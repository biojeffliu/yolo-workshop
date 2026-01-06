from pydantic import BaseModel
from typing import List, Optional, Literal

class AugmentationConfig(BaseModel):
    hsv_h: float = 0.1
    hsv_s: float = 0.7
    hsv_v: float = 0.4
    degrees: float = 0.4
    translate: float = 0.3
    scale: float = 0.5
    shear: float = 0.01
    perspective: float = 0.001
    flipud: float = 0.3
    fliplr: float = 0.3
    mosaic: float = 0.5
    mixup: float = 0.5
    copy_paste: float = 0.4
    erasing: float = 0.2
    crop_fraction: float = 0.1

class DatasetConfig(BaseModel):
    train_percentage: float = 1.0
    keep_empty_frames: bool = True
    empty_frame_keep_ratio: float = 0.8
    dataset_weights: dict[str, float] = {}

class ModelInitConfig(BaseModel):
    resume: bool = False
    resume_checkpoint: str | None = None
    model_size: Literal["n", "s", "m", "l", "x"] | None = None

class TuningConfig(BaseModel):
    enabled: bool = False
    use_ray: bool = False
    iterations: int = 5

class ExportConfig(BaseModel):
    export_onnx: bool = True
    onnx_batch_size: int = 4

class TrainingConfig(BaseModel):
    epochs: int = 100
    num_train_loops: int = 1
    img_size: int = 1032
    layer_freeze: int = 0

    dataset: DatasetConfig = DatasetConfig()
    augmentations: AugmentationConfig = AugmentationConfig()
    model_init: ModelInitConfig = ModelInitConfig()
    tuning: TuningConfig = TuningConfig()
    export: ExportConfig = ExportConfig()

class FineTuneRequest(BaseModel):
    base_model_id: str
    checkpoint: str = "best"
    dataset_ids: List[str]
    training_config: TrainingConfig