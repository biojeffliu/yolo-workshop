from fastapi import APIRouter, HTTPException
from app.models.save import SegmentationsYOLOMetadata
from app.utils.paths import SEGMENTATIONS_DIR
from pathlib import Path
import os
import json

router = APIRouter(prefix="/datasets", tags=["datasets"])

METADATA_FILENAME = "dataset.json"

@router.get("")
def list_datasets():
    if not SEGMENTATIONS_DIR.exists():
        raise HTTPException(500, detail="Datasets directory missing")
    
    datasets_names = [name for name in os.listdir(SEGMENTATIONS_DIR) if (SEGMENTATIONS_DIR / name).is_dir()]

    metadata_list = [load_metadata(name) for name in datasets_names]

    metadata_list.sort(key=lambda x: x.created_at, reverse=True)

    return {"datasets": metadata_list}

# Renaming datasets belongs to folders api
# Current limitation only puts 1 segmentation folder per image

def get_metadata_path(folder_name: str):
    return SEGMENTATIONS_DIR / folder_name / METADATA_FILENAME

def load_metadata(folder_name: str) -> SegmentationsYOLOMetadata:
    folder_path = SEGMENTATIONS_DIR / folder_name
    file_path = folder_path / METADATA_FILENAME

    if not folder_path.exists():
        raise HTTPException(404, detail="Dataset folder not found")

    if not file_path.exists():
        raise HTTPException(404, detail="Metadata file not found")
    
    try:
        with open(file_path, "r") as f:
            data = json.load(f)

        return SegmentationsYOLOMetadata.model_validate(data)
    
    except json.JSONDecodeError:
        raise HTTPException(500, detail="Invalid metadata JSON")

    except Exception as e:
        raise HTTPException(
            500,
            detail=f"Failed to load dataset metadata: {str(e)}"
        )
