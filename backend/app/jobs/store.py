from uuid import uuid4
import json
from pathlib import Path
from datetime import datetime
from app.models.job import Job, JobStatus
from app.utils.paths import JOBS_DIR

def create_job(**kwargs) -> Job:
    job_id = f"job_{uuid4().hex[:8]}"
    job = Job(
        id=job_id,
        status=JobStatus.QUEUED,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        **kwargs,
    )

    d = JOBS_DIR / job_id
    d.mkdir(parents=True)
    save_job(job)

    return job

def save_job(job: Job):
    d = JOBS_DIR / job.id
    (d / "job.json").write_text(job.model_dump_json(indent=2))

def load_job(job_id: str) -> Job:
    p = JOBS_DIR / job_id / "job.json"
    if not p.exists():
        raise KeyError(job_id)
    return Job.model_validate_json(p.read_text())

def mark_job_running(job_id: str):
    job = load_job(job_id)
    job.status = JobStatus.RUNNING
    job.started_at = datetime.now()
    job.updated_at = datetime.now()
    save_job(job)

def mark_job_failed(job_id: str, error: str):
    job = load_job(job_id)
    job.status = JobStatus.FAILED
    job.error = error
    job.finished_at = datetime.now()
    job.updated_at = job.finished_at
    save_job(job)

def mark_job_completed(job_id: str):
    job = load_job(job_id)
    job.status = JobStatus.COMPLETED
    job.finished_at = datetime.now()
    job.updated_at = job.finished_at
    save_job(job)

def mark_job_cancelled(job_id: str):
    job = load_job(job_id)
    job.status = JobStatus.CANCELLED
    job.finished_at = datetime.now()
    job.updated_at = job.finished_at
    save_job(job)

def is_cancel_requested(job_id: str) -> bool:
    return (JOBS_DIR / job_id / "cancel.flag").exists()