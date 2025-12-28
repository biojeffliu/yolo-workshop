from pydantic import BaseModel

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