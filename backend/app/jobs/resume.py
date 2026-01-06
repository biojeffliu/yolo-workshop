from pathlib import Path
import json
from app.utils.paths import JOBS_DIR

def write_resume_state(job_id: str, epoch: int, checkpoint: str):
    p = JOBS_DIR / job_id / "resume.json"
    p.write_text(json.dumps({
        "epoch": epoch,
        "checkpoint": checkpoint,
    }))
