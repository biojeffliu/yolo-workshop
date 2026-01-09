from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from app.services.mask_store import MASK_STORE
from app.services.job_store import YOLO_JOBS
from app.models.save import *
from app.utils.validation import safe_folder_path
from app.utils.paths import SEGMENTATIONS_DIR, UPLOADS_DIR
from app.utils.cocos import COCO_LABELS
import os
import json
import cv2
import uuid
import asyncio
import numpy as np
from datetime import datetime
from collections import defaultdict

router = APIRouter(prefix="/save", tags=["save"])

@router.post("/segmentations-yolo")
async def save_segmentations_yolo(
    req: SaveSegmentationsYOLORequest,
    background_tasks: BackgroundTasks
):
    folder = req.folder

    if folder not in MASK_STORE.store:
        raise HTTPException(404, detail="No masks found for folder")

    job_id = str(uuid.uuid4())

    YOLO_JOBS[job_id] = {
        "status": "running",
        "processed": 0,
        "total": 0,
        "progress": 0.0,
        "error": None
    }

    background_tasks.add_task(run_yolo_export, folder, req, job_id)

    return {
        "job_id": job_id,
        "status": "started"
    }

@router.get("/segmentations-yolo/progress")
async def yolo_export_progress(job_id: str):
    job = YOLO_JOBS.get(job_id)

    if not job:
        raise HTTPException(404, "Job not found")
    
    return job

@router.get("/segmentations-yolo/stream")
async def yolo_progress_stream(job_id: str):
    async def event_generator():
        while True:
            job = YOLO_JOBS[job_id]
            if not job:
                break
            yield f"data: {json.dumps(job)}\n\n"
            if job["status"] == "completed":
                break
            await asyncio.sleep(0.3)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )

def run_yolo_export(folder: str, req: SaveSegmentationsYOLORequest, job_id: str):
    store = MASK_STORE.store[folder]
    obj_meta = MASK_STORE.objects.get(folder, {})

    src_images_dir = UPLOADS_DIR / folder

    save_dir = SEGMENTATIONS_DIR / folder
    labels_dir = save_dir / "labels"
    images_dir = save_dir / "images"

    labels_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)

    total = len(store)
    YOLO_JOBS[job_id]["total"] = total

    processed = 0

    empty_count = 0
    label_count = 0

    used_classes = set()
    labels_per_object = defaultdict(int)
    labels_per_class = defaultdict(int)

    for frame_idx, obj_masks in store.items():
        label_lines = []

        src_img = src_images_dir / f"{frame_idx:05d}.jpg"
        dst_img = images_dir / f"{frame_idx:05d}.jpg"

        if src_img.exists() and not dst_img.exists():
            os.symlink(src_img, dst_img)


        for obj_id, mask in obj_masks.items():
            class_id = obj_meta.get(obj_id, {}).get("class_id")
            used_classes.add(class_id)
            if class_id is None:
                continue

            h, w = mask.shape

            contours, _ = cv2.findContours(
                mask.astype(np.uint8),
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE
            )

            for cnt in contours:
                if cv2.contourArea(cnt) < req.min_area:
                    continue

                if req.simplify:
                    eps = 0.005 * cv2.arcLength(cnt, True)
                    cnt = cv2.approxPolyDP(cnt, eps, True)

                cnt = cnt.squeeze()
                if cnt.ndim != 2 or cnt.shape[0] < 3:
                    continue

                coords = []
                for x, y in cnt:
                    coords.append(x / w)
                    coords.append(y / h)

                label_lines.append(
                    " ".join([str(class_id)] + [f"{c:.6f}" for c in coords])
                )
                label_count += 1

                labels_per_object[obj_id] += 1
                labels_per_class[class_id] += 1

            empty = len(label_lines) == 0
            if empty:
                empty_count += 1

        out_path = labels_dir / f"{frame_idx:05d}.txt"
        with open(out_path, "w") as f:
            f.write("\n".join(label_lines))

        processed += 1
        YOLO_JOBS[job_id]["processed"] = processed
        YOLO_JOBS[job_id]["progress"] = processed / total

    meta = {
        "dataset_id": folder,
        "created_at": datetime.now().isoformat(),
        "job_id": job_id,
        "type": "yolo_segmentation",
        "counts": {
            "frames_total": total,
            "frames_written": processed,
            "frames_empty": empty_count,
            "labels_total": label_count
        },
        "objects": [
            {
                "object_id": str(obj_id),
                "class_id": obj_meta.get(obj_id, {}).get("class_id"),
                "class_name": COCO_LABELS.get(obj_meta.get(obj_id, {}).get("class_id")),
                "labels_written": count,
            }
            for obj_id, count in labels_per_object.items()
        ],
        "classes": [
            {
                "id": cid,
                "name": COCO_LABELS[cid],
                "labels_written": count,
            }
            for cid, count in sorted(labels_per_class.items())
        ],
        "export_config": {
            "min_area": req.min_area,
            "simplify": req.simplify
        }
    }

    tmp = save_dir / "dataset.json.tmp"
    with open(tmp, "w") as f:
        json.dump(meta, f, indent=2)
    tmp.replace(save_dir / "dataset.json")

    YOLO_JOBS[job_id]["status"] = "completed"
    YOLO_JOBS[job_id]["progress"] = 1.0