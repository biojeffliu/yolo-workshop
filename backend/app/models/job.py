from enum import Enum
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Job(BaseModel):
    id: str
    status: JobStatus

    base_model_id: str
    checkpoint: str
    dataset_ids: List[str]
    params: Dict

    created_at: datetime
    updated_at: datetime

    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    error: Optional[str] = None