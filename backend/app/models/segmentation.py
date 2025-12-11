from pydantic import BaseModel

class LoadModelRequest(BaseModel):
    folder: str

class CreateObjRequest(BaseModel):
    folder: str
    obj_id: int
    class_id: int

class DeleteObjRequest(BaseModel):
    folder: str
    obj_id: int

class SegmentRequest(BaseModel):
    frame_index: int
    folder: str
    x: int
    y: int
    is_positive: bool
    object_id: int

class PropagateRequest(BaseModel):
    folder: str
    total_frames: int

class GetFrameRequest(BaseModel):
    folder: str
    frame_idx: int
    show_class: bool

class ResetMaskRequest(BaseModel):
    folder: str
    frame_idx: int

class ResetMasksFolderRequest(BaseModel):
    folder: str