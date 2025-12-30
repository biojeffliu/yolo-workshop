from pathlib import Path
import json
from typing import List, Dict

REGISTRY_PATH = Path("models/registry.json")

class ModelRegistry:
    def load(self) -> Dict:
        if not REGISTRY_PATH.exists():
            return {"models": []}
        return json.loads(REGISTRY_PATH.read_text())

    def save(self, data: Dict):
        REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
        REGISTRY_PATH.write_text(json.dumps(data, indent=2))

    def list_models(self) -> List[Dict]:
        return self.load()["models"]

    def get_model(self, model_id: str) -> Dict:
        for m in self.list_models():
            if m["id"] == model_id:
                return m
        raise KeyError(model_id)

    def add_or_update(self, model: Dict):
        data = self.load()
        data["models"] = [m for m in data["models"] if m["id"] != model["id"]]
        data["models"].append(model)
        self.save(data)
