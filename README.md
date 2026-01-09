# YOLO Workshop
<p align="center">
  <img src="gifs/label_example.gif" alt="SAM2 Labeling Demo" width="800">
  <br/>
  <em>SAM2 Labeling on Video Example</em>
</p>

SAM2 Video autolabeler, fine-tuning, and inference pipeline for YOLOv8-seg using ultralytics.
This project consists of:
- **Frontend:** React/Next.js app
- **Backend:** Python + YOLOv8, hosted on **FastAPI**

## Prerequisites
Make sure you have the following installed:
- Node.js (v18+ recommended)
- pnpm ```npm install -g pnpm```
- NVIDIA GPU + CUDA *(optional but highly recommended)*

## Install
1. From the repo root, create the Conda environment:
```bash
conda env create -f backend/environment.yml
conda activate sam2env
```
2. Start the backend:
```bash
cd backend
uvicorn app.main:app --reload --workers 1
```
Backend should now be running at `http://localhost:8000`

3. (Optional, for fine-tune and inference) Install ultralytics models:
```bash
python3 install_ultralytics_models.py
```

4. Install frontend dependencies via pnpm:
```bash
cd frontend
pnpm install
```
5. Configure environment variables, create a `.env.local` file in `frontend` if needed
```bash
cat <<EOF > .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
EOF
```
6. Start frontend dev server:
```bash
pnpm dev
```
Frontend should now be running at: `http://localhost:3000`

## Video-Player and Segmentation Help
### Saving segmentations leads to empty datasets
This issue relates to how the uvicorn server uses multiple workers. The easiest fix is to restart the backend server with 1 worker:
```bash
uvicorn app.main:app --reload --workers 1
```

## Model Fine-tuning Help

## Known Limitations
- Currently only 1 segmentation per dataset is allowed

## TODO
- Support for pose models (figure out labeling service)

## Sources
[@ekberndt](https://www.github.com/ekberndt)'s [YOLOv8 Instance Segmentation Fine-Tuning](https://github.com/ekberndt/YOLOv8-Fine-Tune) helped me with the fine-tuning setion of this project.