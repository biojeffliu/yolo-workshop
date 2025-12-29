from pathlib import Path
from ultralytics import YOLO
import os

MODELS_DIR = Path("models/ultralytics")

# Will support other ultralytics models in the future. Now all you get is YOLOv8 because that's what ART used lmao

YOLOV8_SEG_MODELS = [
    "yolov8n-seg.pt",
    "yolov8s-seg.pt",
    "yolov8m-seg.pt",
    "yolov8l-seg.pt",
    "yolov8x-seg.pt",
]

def install():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    old_cwd = os.getcwd()
    os.chdir(MODELS_DIR)

    try:
        for name in YOLOV8_SEG_MODELS:
            path = MODELS_DIR / name
            if path.exists():
                print(f"{name} already installed in {str(path)}")
                continue
            print(f"Downloading {name}")
            YOLO(name)
            print(f"Installed {name}")

    finally:
        os.chdir(old_cwd)

if __name__ == "__main__":
    install()