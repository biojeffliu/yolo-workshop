from fastapi import APIRouter, HTTPException
from app.models.finetune import FineTuneRequest
from app.services.model_service import ModelService
# from app.jobs.enqueue import enqueue_finetune_job
# from app.jobs.store import create_job

router = APIRouter(prefix="/finetune", tags=["finetune"])
svc = ModelService()

@router.post("")
def start_finetune(req: FineTuneRequest):
    try:
        model = svc.get_model(req.base_model_id)
        svc.resolve_checkpoint(req.base_model_id, req.checkpoint)
    except KeyError as e:
        raise HTTPException(400, str(e))
    
    if model["task"] != "segment":
        raise HTTPException(400, "Only segmentation models are supported")
    
    job = create_job(
        base_model_id=req.base_model_id,
        checkpoint=req.checkpoint,
        dataset_ids=req.dataset_ids,
        params=req.model_dump(),
    )

    enqueue_finetune_job(job.id, req)

    return {
        "job_id": job.id,
        "status": "queued",
        "events_url": f"/jobs/{job.id}/events",
    }
