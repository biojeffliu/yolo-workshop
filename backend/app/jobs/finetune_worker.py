from datetime import datetime
from ultralytics import YOLO
from pathlib import Path
import json

from app.services.model_service import ModelService
from app.jobs.progress import publish_event
from app.jobs.store import (
    mark_job_running,
    mark_job_failed,
    mark_job_completed,
    is_cancel_requested,
)
from app.jobs.dataset_splitter import split_and_build_training_view
from app.utils.paths import ML_MODELS_DIR

def run_finetune_job(job_id: str, payload: dict):
    svc = ModelService()
    job_dir = ML_MODELS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    cfg = payload["training_config"]

    try:
        mark_job_running(job_id)
        publish_event(job_id, "starting", {})

        base_model_id = payload["base_model_id"]
        checkpoint = payload.get("checkpoint", "best")

        ckpt_path = svc.resolve_checkpoint(base_model_id, checkpoint)

        publish_event(job_id, "model_loaded", {
            "base_model_id": base_model_id,
            "checkpoint": checkpoint
        })

        dataset_yaml, dataset_report = split_and_build_training_view(
            dataset_id=payload["dataset_ids"][0],
            job_dir=job_dir,
            train_ratio=0.8,
            seed=payload.get("seed", 42)
        )

        publish_event(job_id, "dataset_ready", dataset_report)

        (job_dir / "dataset_report.json").write_text(
            json.dumps(dataset_report, indent=2)
        )

        yolo = YOLO(str(ckpt_path))

        start_time = datetime.now()

        def on_train_epoch_end(trainer):
            if is_cancel_requested(job_id):
                trainer.stop = True
                publish_event(job_id, "cancelled", {})
                raise RuntimeError("Job cancelled")

            metrics = trainer.metrics
            epoch = trainer.epoch

            publish_event(job_id, "epoch_end", {
                "epoch": epoch,
                "metrics": metrics
            })

        yolo.add_callback("on_train_epoch_end", on_train_epoch_end)

        yolo.train(
            data=str(dataset_yaml),
            epochs=payload["epochs"],
            imgsz=payload["img_size"],
            batch=payload["batch_size"],
            lr0=payload["learning_rate"],
            patience=payload["patience"],
            freeze=payload["layer_freeze"],
            project=str(job_dir),
            name="",
            exist_ok=True,
        )

        end_time = datetime.now()

        write_metadata(job_dir, payload)
        write_training_summary(job_dir, start_time, end_time)

        mark_job_completed(job_id)
        publish_event(job_id, "completed", {})

    except Exception as e:
        mark_job_failed(job_id, str(e))
        publish_event(job_id, "failed", {"error": str(e)})
        raise

def write_metadata(job_dir: Path, payload: dict):
    meta = {
        "parent_model_id": payload["base_model_id"],
        "checkpoint_used": payload.get("checkpoint", "best"),
        "datasets": payload["dataset_ids"],
        "created_at": datetime.now().isoformat(),
    }

    with open(job_dir / "metadata.json", "w") as f:
        json.dump(meta, f, indent=2)

def write_training_summary(job_dir: Path, start, end):
    summary = {
        "duration_minutes": (end - start).total_seconds() / 60,
    }

    with open(job_dir / "training_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

        