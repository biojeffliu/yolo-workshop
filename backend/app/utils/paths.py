from pathlib import Path

BASEDIR = Path(__file__).resolve().parent.parent  # points to app
UPLOADS_DIR = BASEDIR / "uploads"
SEGMENTATIONS_DIR = BASEDIR / "segmentations"
ML_MODELS_DIR = BASEDIR / "ml_models"