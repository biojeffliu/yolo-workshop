from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from app.models.segmentation import LoadModelRequest, SegmentRequest,PropagateRequest, ResetMaskRequest, ResetMasksFolderRequest, CreateObjRequest, DeleteObjRequest, GetFrameRequest
from app.services.sam2_engine import SAM2Engine
from app.services.mask_store import MASK_STORE
from app.utils.cocos import COCO_LABELS
from app.utils.validation import safe_folder_path
from app.utils.overlay import make_overlay 
import base64
import cv2
import numpy as np
import io
import torch


router = APIRouter(prefix="/segmentation", tags=["segmentation"])

MASK_COLORS = [
    (255, 0, 0),
    (0, 255, 0),
    (0, 0, 255),
    (255, 255, 0),
    (255, 0, 255),
    (0, 255, 255),
]

@router.post("/load-model")
async def load_model(req: LoadModelRequest):
    folder_path = safe_folder_path(req.folder)

    if not folder_path.exists():
        raise HTTPException(404, detail="Folder not found")

    engine = SAM2Engine.get_instance()
    engine.load()
    state = engine.load_video(str(folder_path))

    return {
        "status": "model_loaded",
        "folder": req.folder,
        "frames": len(list(folder_path.iterdir()))
    }

@router.post("/create-object")
async def create_object(req: CreateObjRequest):
    MASK_STORE.create_obj_id(req.folder, req.obj_id, req.class_id)

@router.post("/delete-object")
async def delete_object(req: DeleteObjRequest):
    MASK_STORE.delete_obj_id(req.folder, req.obj_id)

@router.post("/click")
async def process_click(req: SegmentRequest):
    folder_path = safe_folder_path(req.folder)
    
    engine = SAM2Engine.get_instance()
    engine.load()

    state = engine.load_video(str(folder_path))

    frame_files = sorted(
        [p for p in folder_path.iterdir() if p.suffix.lower() in [".jpg", ".jpeg", ".png"]],
        key=lambda x: int(''.join(filter(str.isdigit, x.name)) or -1)
    )

    if req.frame_index >= len(frame_files):
        raise HTTPException(400, "Invalid frame index")

    image = cv2.imread(str(frame_files[req.frame_index]))
    if image is None:
        raise HTTPException(500, "Failed to read frame")

    point = np.array([[req.x, req.y]], dtype=np.float32)
    label = np.array([1 if req.is_positive else 0], dtype=np.int32)

    _, out_obj_ids, out_logits = engine.predictor.add_new_points_or_box(
        inference_state=state,
        frame_idx=req.frame_index,
        obj_id=req.object_id,
        points=point,
        labels=label,
    )

    for idx, obj_id in enumerate(out_obj_ids):
        prob = torch.sigmoid(out_logits[idx])
        mask = (prob > 0.5).int().squeeze().cpu().numpy().astype(np.uint8)
        MASK_STORE.save_mask(req.folder, req.frame_index, int(obj_id), mask)

    masks = MASK_STORE.get_masks(req.folder, req.frame_index)

    overlay = make_overlay(image, masks)
    success, buffer = cv2.imencode(".jpg", overlay)
    if not success:
        raise HTTPException(500, "Failed to encode overlay image")

    return StreamingResponse(io.BytesIO(buffer.tobytes()), media_type="image/jpeg")

@router.post("/propagate-masks")
async def propagate_masks(req: PropagateRequest):
    folder_path = safe_folder_path(req.folder)
    total_frames = req.total_frames

    engine = SAM2Engine.get_instance()
    engine.load()

    state = engine.load_video(str(folder_path))

    frame_files = sorted(
        [p for p in folder_path.iterdir() if p.suffix.lower() in [".jpg", ".jpeg", ".png"]],
        key=lambda x: int(''.join(filter(str.isdigit, x.name)) or -1)
    )

    if len(frame_files) == 0:
        raise HTTPException(400, "No frames found")
    
    for out_frame_idx, out_obj_ids, out_logits in engine.predictor.propagate_in_video(state):
        for idx, obj_id in enumerate(out_obj_ids):
            prob = torch.sigmoid(out_logits[idx])
            mask = (prob > 0.5).int().squeeze().cpu().numpy().astype(np.uint8)

            MASK_STORE.save_mask(req.folder, out_frame_idx, int(obj_id), mask)

    engine.predictor.reset_state(state)

    overlayed_images = []

    for frame_idx, frame_path in enumerate(frame_files):
        image = cv2.imread(str(frame_path))
        if image is None:
            continue

        masks = MASK_STORE.get_masks(req.folder, frame_idx)

        overlay = make_overlay(image, masks)
        success, buffer = cv2.imencode(".jpg", overlay)
        if not success:
            continue
        
        img_b64 = base64.b64encode(buffer).decode("utf-8")
        overlayed_images.append(img_b64)

    return {
        "status": "success",
        "folder": req.folder,
        "frames_updated": len(overlayed_images),
        "images": overlayed_images
    }

@router.get("/frame")
async def get_frame(req: GetFrameRequest):
    folder_path = safe_folder_path(req.folder)
    frame_idx = req.frame_idx
    show_class = req.show_class
    frame_files = sorted(
        [p for p in folder_path.iterdir() if p.suffix.lower() in [".jpg", ".jpeg", ".png"]],
        key=lambda x: int(''.join(filter(str.isdigit, x.name)) or -1)
    )

    if frame_idx >= len(frame_files):
        raise HTTPException(400, "Invalid frame index")

    image = cv2.imread(str(frame_files[frame_idx]))
    if image is None:
        raise HTTPException(500, "Failed to load image")
    
    overlay = image.copy()
    masks = MASK_STORE.get_masks(req.folder, frame_idx)
    obj_meta = MASK_STORE.objects.get(req.folder, {})

    overlay = make_overlay(image, masks, obj_meta=obj_meta, show_class=show_class)
    success, buffer = cv2.imencode(".jpg", overlay)
    if not success:
        raise HTTPException(500, "Failed to encode frame overlay")

    return StreamingResponse(io.BytesIO(buffer.tobytes()), media_type="image/jpeg")


@router.post("/reset-mask")
async def reset_masks(req: ResetMaskRequest):
    folder_path = safe_folder_path(req.folder)
    MASK_STORE.clear_frame(folder_path, req.frame_idx)
    return {
        "status": "success"
    }

@router.post("/reset-masks-folder")
async def reset_masks_folder(req: ResetMasksFolderRequest):
    folder_path = safe_folder_path(req.folder)
    MASK_STORE.delete_masks_folder(folder_path)
    return {
        "status": "success"
    }