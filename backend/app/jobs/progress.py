import json
from datetime import datetime

from app.utils.redis import get_redis

def publish_event(job_id: str, event: str, data: dict):
    r = get_redis()

    payload = {
        "job_id": job_id,
        "event": event,
        "timestamp": datetime.now().isoformat(),
        "data": data,
    }

    r.publish(
        f"jobs:{job_id}",
        json.dumps(payload),
    )