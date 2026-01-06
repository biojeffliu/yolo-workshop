from pathlib import Path
import json
from app.utils.paths import JOBS_DIR

def index_artifact(job_id: str, name: str, path: Path, kind: str):
    artifacts_path = JOBS_DIR / job_id / "artifacts.json"
    artifacts = []

    if artifacts_path.exists():
        artifacts = json.loads(artifacts_path.read_text())

    artifacts.append({
        "name": name,
        "path": str(path),
        "kind": kind,
    })

    artifacts_path.write_text(json.dumps(artifacts, indent=2))
