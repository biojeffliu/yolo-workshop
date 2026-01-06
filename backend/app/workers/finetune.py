from app.jobs.celery_app import celery_app
from app.jobs.finetune_worker import run_finetune_job

@celery_app.task(bind=True, name="finetune.run")
def run_finetune_task(self, job_id: str, payload: dict):
    return run_finetune_job(job_id, payload)