from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import images, upload, folders, segmentation, save
from fastapi.staticfiles import StaticFiles
from app.utils.paths import UPLOADS_DIR

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class CORSStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        response = await super().get_response(path, scope)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

app.mount("/static", CORSStaticFiles(directory="static"), name="static")

app.include_router(images.router, prefix="/api")
app.include_router(folders.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(segmentation.router, prefix="/api")
app.include_router(save.router, prefix="/api")