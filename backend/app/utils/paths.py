from pathlib import Path

BASEDIR = Path(__file__).resolve().parent.parent  # app
BACKEND_DIR = BASEDIR.parent  # backend
UPLOADS_DIR = BACKEND_DIR / "uploads"
SEGMENTATIONS_DIR = BACKEND_DIR / "segmentations"
ML_MODELS_DIR = BACKEND_DIR / "ml_models"
JOBS_DIR = BACKEND_DIR / "jobs"