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
3. Install frontend dependencies via pnpm:
```bash
cd frontend
pnpm install
```
4. Configure environment variables, create a `.env.local` file if needed
```bash
cat <<EOF > .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
EOF
```
5. Start frontend dev server:
```bash
pnpm dev
```
Frontend should now be running at: `http://localhost:3000`

## Video-Player and Segmentation Help

## Model Fine-tuning Help

## Sources
[@ekberndt](https://www.github.com/ekberndt)'s [YOLOv8 Instance Segmentation Fine-Tuning](https://github.com/ekberndt/YOLOv8-Fine-Tune) helped me with the fine-tuning setion of this project.