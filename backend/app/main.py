from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import images, upload, finetune, folders, ml_models, segmentation, save
from fastapi.staticfiles import StaticFiles
from starlette.responses import Response
from app.utils.paths import UPLOADS_DIR
from pathlib import Path

app = FastAPI()

cors_config = {
    "allow_origins": ["*"],
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}

app.add_middleware(
    CORSMiddleware,
    **cors_config
)

static_files = StaticFiles(directory=str(UPLOADS_DIR))
static_with_cors = CORSMiddleware(static_files, **cors_config)
app.mount("/static", static_with_cors, name="static")

@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("Access-Control-Allow-Origin", "*")
    response.headers.setdefault("Access-Control-Allow-Methods", "*")
    response.headers.setdefault("Access-Control-Allow-Headers", "*")
    return response
    

app.include_router(images.router, prefix="/api")
app.include_router(folders.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(segmentation.router, prefix="/api")
app.include_router(save.router, prefix="/api")
app.include_router(ml_models.router, prefix="/api")
# app.include_router(finetune.router, prefix="/api")