from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import redis
from pathlib import Path
import time
import json

from app.jobs.store import load_job
from app.utils.paths import JOBS_DIR

router = APIRouter(prefix="/jobs")

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

@router.get("")
def list_jobs():
    jobs = []
    for d in JOBS_DIR.iterdir():
        try:
            jobs.append(load_job(d.name))
        except Exception:
            continue
    return {"jobs": jobs}

@router.get("/{job_id}")
def get_job(job_id: str):
    try:
        return load_job(job_id)
    except KeyError:
        raise HTTPException(404, "Job not found")
    
@router.get("/{job_id}/events")
def stream_job_events(job_id: str):
    def event_stream():
        pubsub = redis_client.pubsub()
        pubsub.subscribe(f"jobs:{job_id}")

        try:
            for message in pubsub.listen():
                if message["type"] != "message":
                    continue

                yield f"data: {message['data']}\n\n"
        finally:
            pubsub.close()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )

@router.post("/{job_id}/cancel")
def cancel_job(job_id: str):
    job_dir = JOBS_DIR / job_id
    if not job_dir.exists():
        raise HTTPException(404, "Job not found")

    (job_dir / "cancel.flag").write_text("1")
    return {"status": "cancel_requested"}
