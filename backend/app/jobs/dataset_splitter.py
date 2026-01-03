from pathlib import Path
import random
import yaml
import os
from typing import List, Tuple
from app.utils.paths import SEGMENTATIONS_DIR

def split_and_build_training_view(
    dataset_id: str,
    job_dir: Path,
    train_ratio: float = 0.8,
    seed: int = 67,
    use_symlinks: bool = True
):
    src_root = SEGMENTATIONS_DIR / dataset_id
    images_dir = src_root / "images"
    labels_dir = src_root / "labels"

    if not images_dir.exists() or not labels_dir.exists():
        raise FileNotFoundError(
            f"Dataset {dataset_id} must contain images/ and labels/"
        )
    
    images = sorted(
        p for p in images_dir.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".png"}
    )

    if not images:
        raise ValueError(f"No images found in dataset {dataset_id}")
    
    samples: List[Tuple[Path, Path]] = []
    for img in images:
        lbl = labels_dir / f"{img.stem}.txt"
        if lbl.exists():
            samples.append((img, lbl))

    if not samples:
        raise ValueError(f"No image/label pairs found in {dataset_id}")
    
    random.seed(seed)
    random.shuffle(samples)

    split_idx = int(len(samples) * train_ratio)
    train_samples = samples[:split_idx]
    val_samples = samples[split_idx:]

    dataset_dir = job_dir / "dataset"
    train_img_dir = dataset_dir / "train" / "images"
    train_lbl_dir = dataset_dir / "train" / "labels"
    val_img_dir = dataset_dir / "val" / "images"
    val_lbl_dir = dataset_dir / "val" / "labels"

    for d in [train_img_dir, train_lbl_dir, val_img_dir, val_lbl_dir]:
        d.mkdir(parents=True, exist_ok=True)

    def place(src: Path, dst: Path):
        if dst.exists():
            return
        if use_symlinks:
            os.symlink(src, dst)
        else:
            dst.write_bytes(src.read_bytes())

    for img, lbl in train_samples:
        place(img, train_img_dir / img.name)
        place(lbl, train_lbl_dir / lbl.name)

    for img, lbl in val_samples:
        place(img, val_img_dir / img.name)
        place(lbl, val_lbl_dir / lbl.name)

    data_yaml = {
        "path": str(dataset_dir),
        "train": "train/images",
        "val": "val/images",
        "nc": infer_num_classes(labels_dir),
        "names": infer_class_names(labels_dir),
    }

    data_yaml_path = dataset_dir / "data.yaml"
    with open(data_yaml_path, "w") as f:
        yaml.safe_dump(data_yaml, f)

    return data_yaml_path

def infer_num_classes(labels_dir: Path) -> int:
    classes = set()
    for lbl in labels_dir.glob("*.txt"):
        for line in lbl.read_text().splitlines():
            if not line.strip():
                continue
            cls = int(line.split()[0])
            classes.add(cls)
    return max(classes) + 1 if classes else 0


def infer_class_names(labels_dir: Path) -> List[str]:
    nc = infer_num_classes(labels_dir)
    return [f"class_{i}" for i in range(nc)]