import json
import redis
from datetime import datetime

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)

def publish_event(job_id: str, event: str, data: dict):
    payload = {
        "job_id": job_id,
        "event": event,
        "timestamp": datetime.now().isoformat(),
        "data": data,
    }

    redis_client.publish(
        f"jobs:{job_id}",
        json.dumps(payload),
    )