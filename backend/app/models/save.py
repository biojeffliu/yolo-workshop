from pydantic import BaseModel, Field

class SaveSegmentationsYOLORequest(BaseModel):
    folder: str
    min_area: int = 10
    simplify: bool = True

class SaveSegmentationsPNGRequest(BaseModel):
    folder: str
    save_negatives: bool

class SaveSegmentationsJSONRequest(BaseModel):
    folder: str
    save_negatives: bool

class YOLOObjectStats(BaseModel):
    object_id: str
    class_id: int
    class_name: str
    labels_written: int

class YOLOClassStats(BaseModel):
    id: int
    name: str
    labels_written: int

class YOLOCounts(BaseModel):
    frames_total: int
    frames_written: int
    frames_empty: int
    labels_total: int

class YOLOExportConfig(BaseModel):
    min_area: int
    simplify: bool

class SegmentationsYOLOMetadata(BaseModel):
    dataset_id: str
    created_at: str
    job_id: str
    type: str = Field(alias="type")
    counts: YOLOCounts
    objects: list[YOLOObjectStats]
    classes: list[YOLOClassStats]
    export_config: YOLOExportConfig