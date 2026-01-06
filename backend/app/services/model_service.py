from pathlib import Path
import json
from typing import Dict, List
from ultralytics import YOLO
from app.utils.paths import ML_MODELS_DIR

class ModelService:
    def __init__(self):
        self.ultralytics_dir = ML_MODELS_DIR / "ultralytics"
        self.finetuned_dir = ML_MODELS_DIR / "finetuned"

    def list_models(self) -> List[Dict]:
        models = []

        for pt in self.ultralytics_dir.glob("*.pt"):
            models.append(self._inspect_pretrained(pt))

        for run_dir in self.finetuned_dir.iterdir():
            if not run_dir.is_dir():
                continue
            best = run_dir / "weights" / "best.pt"
            if best.exists():
                models.append(self._inspect_finetuned(run_dir, best))

        return models

    def get_model(self, model_id: str) -> Dict:
        for m in self.list_models():
            if m["id"] == model_id:
                return m
        raise KeyError(f"Model not found: {model_id}")

    def list_checkpoints(self, model_id: str) -> List[Dict]:
        model = self.get_model(model_id)

        if model["source"] == "ultralytics":
            return [{
                "id": "best",
                "label": "Best (pretrained)",
                "path": model["path"],
                "recommended": True,
            }]

        run_dir = Path(model["run_dir"])
        weights_dir = run_dir / "weights"
        meta = self._load_metadata(run_dir)

        checkpoints = []

        best_epoch = meta.get("best_epoch")
        checkpoints.append({
            "id": "best",
            "label": f"Best (epoch {best_epoch})" if best_epoch else "Best",
            "path": str(weights_dir / "best.pt"),
            "epoch": best_epoch,
            "recommended": True,
        })

        if (weights_dir / "last.pt").exists():
            checkpoints.append({
                "id": "last",
                "label": "Last",
                "path": str(weights_dir / "last.pt"),
            })

        for p in sorted(weights_dir.glob("epoch*.pt"), reverse=True):
            epoch = int(p.stem.replace("epoch", ""))
            checkpoints.append({
                "id": f"epoch{epoch}",
                "label": f"Epoch {epoch}",
                "path": str(p),
                "epoch": epoch,
            })

        return checkpoints
    
    def resolve_checkpoint(self, model_id: str, checkpoint_id: str) -> Path:
        checkpoints = self.list_checkpoints(model_id)
        for c in checkpoints:
            if c["id"] == checkpoint_id:
                return Path(c["path"])
        raise KeyError(f"Checkpoint not found: {checkpoint_id}")
    
    def _inspect_pretrained(self, pt: Path) -> Dict:
        y = YOLO(str(pt))
        params_m = sum(p.numel() for p in y.model.parameters()) / 1e6
        stride = int(max(y.model.stride))

        size = next((s for s in ["n","s","m","l","x"] if f"{s}-" in pt.name), None)

        return {
            "id": f"ultralytics:{pt.stem}",
            "name": pt.stem,
            "path": str(pt),
            "task": y.task,
            "family": "yolov8",
            "size": size,
            "params_m": round(params_m, 2),
            "stride": stride,
            "source": "ultralytics",
            "pretrained": True,
            "fine_tunable": True,
        }

    def _inspect_finetuned(self, run_dir: Path, best_pt: Path) -> Dict:
        y = YOLO(str(best_pt))
        params_m = sum(p.numel() for p in y.model.parameters()) / 1e6
        stride = int(max(y.model.stride))
        meta = self._load_metadata(run_dir)

        return {
            "id": f"finetuned:{run_dir.name}",
            "name": f"Fine-tuned ({run_dir.name})",
            "path": str(best_pt),
            "run_dir": str(run_dir),
            "task": y.task,
            "family": "yolov8",
            "size": meta.get("base_model_size"),
            "params_m": round(params_m, 2),
            "stride": stride,
            "source": "finetuned",
            "pretrained": False,
            "fine_tunable": True,
            "datasets": meta.get("datasets"),
            "created_at": meta.get("created_at"),
        }

    def _load_metadata(self, run_dir: Path) -> Dict:
        meta_path = run_dir / "metadata.json"
        if meta_path.exists():
            return json.loads(meta_path.read_text())
        return {}