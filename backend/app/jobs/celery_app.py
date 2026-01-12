import os
from pathlib import Path
from dotenv import load_dotenv
from celery import Celery

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_track_started=True,
    result_expires=3600,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)

import app.jobs.finetune_task