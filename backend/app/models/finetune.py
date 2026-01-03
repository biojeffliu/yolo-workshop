from pydantic import BaseModel
from typing import List, Optional

class FineTuneRequest(BaseModel):
    base_model_id: str
    checkpoint: str = "best"
    dataset_ids: List[str]

    epochs: int = 100
    img_size: int = 640
    batch_size: int = 8
    learning_rate: float = 0.01
    patience: int = 50
    layer_freeze: int = 0
    resume: bool = False