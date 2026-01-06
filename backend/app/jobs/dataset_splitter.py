from pathlib import Path
import random
import yaml
import os
import warnings
from typing import List, Tuple
from collections import defaultdict
from app.utils.paths import SEGMENTATIONS_DIR

def split_and_build_training_view(
    dataset_ids: List[str],
    job_dir: Path,
    train_ratio: float = 0.8,
    seed: int = 67,
    use_symlinks: bool = True
):
    random.seed(seed)
    
    all_samples: List[Tuple[Path, Path]] = []
    report = {
        "datasets": [],
        "summary": {
            "datasets_selected": len(dataset_ids),
            "datasets_valid": 0,
            "datasets_invalid": 0,
            "total_samples": 0,
            "used_samples": 0,
            "skipped_samples": 0,
        },
        "warnings": [],
    }

    for dataset_id in dataset_ids:
        dataset_root = SEGMENTATIONS_DIR / dataset_id
        images_dir = dataset_root / "images"
        labels_dir = dataset_root / "labels"

        dataset_report = {
            "dataset_id": dataset_id,
            "status": "invalid",
            "total_samples": 0,
            "used_samples": 0,
            "skipped_samples": 0,
            "issues": defaultdict(int),
        }

        if not images_dir.exists() or not labels_dir.exists():
            msg = f"Dataset {dataset_id} missing images/ or labels/ directory"
            warnings.warn(msg)
            report["warnings"].append(msg)
            report["datasets"].append(dataset_report)
            report["summary"]["datasets_invalid"] += 1
            continue

        images = sorted(
            p for p in images_dir.iterdir()
            if p.suffix.lower() in {".jpg", ".jpeg", ".png"}
        )

        dataset_report["total_samples"] = len(images)
        report["summary"]["total_samples"] += len(images)

        valid_pairs = []

        for img in images:
            lbl = labels_dir / f"{img.stem}.txt"

            if not lbl.exists():
                dataset_report["issues"]["missing_label"] += 1
                continue

            if lbl.stat().st_size == 0:
                dataset_report["issues"]["empty_label"] += 1
                continue

            try:
                for line in lbl.read_text().splitlines():
                    if not line.strip():
                        continue
                    int(line.split()[0])
            except Exception:
                dataset_report["issues"]["malformed_label"] += 1
                continue

            valid_pairs.append((img, lbl))

        if not valid_pairs:
            msg = f"Dataset {dataset_id} contains no valid samples"
            warnings.warn(msg)
            report["warnings"].append(msg)
            dataset_report["issues"]["no_valid_samples"] += 1
            report["datasets"].append(dataset_report)
            report["summary"]["datasets_invalid"] += 1
            continue

        dataset_report["status"] = "valid"
        dataset_report["used_samples"] = len(valid_pairs)
        dataset_report["skipped_samples"] = (
            dataset_report["total_samples"] - len(valid_pairs)
        )

        report["summary"]["used_samples"] += len(valid_pairs)
        report["summary"]["skipped_samples"] += dataset_report["skipped_samples"]
        report["summary"]["datasets_valid"] += 1

        all_samples.extend(valid_pairs)
        report["datasets"].append(dataset_report)

    if not all_samples:
        raise RuntimeError("No valid samples found across selected datasets")
    
    random.shuffle(all_samples)
    split_idx = int(len(all_samples) * train_ratio)
    train_samples = all_samples[:split_idx]
    val_samples = all_samples[split_idx:]

    dataset_dir = job_dir / "dataset"
    train_img_dir = dataset_dir / "train/images"
    train_lbl_dir = dataset_dir / "train/labels"
    val_img_dir = dataset_dir / "val/images"
    val_lbl_dir = dataset_dir / "val/labels"

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

    nc, names = infer_classes_from_samples(all_samples)

    data_yaml = {
        "path": str(dataset_dir),
        "train": "train/images",
        "val": "val/images",
        "nc": nc,
        "names": names,
    }

    data_yaml_path = dataset_dir / "data.yaml"
    data_yaml_path.write_text(yaml.safe_dump(data_yaml))

    return data_yaml_path, report


def infer_classes_from_samples(samples: List[Tuple[Path, Path]]):
    classes = set()
    for _, lbl in samples:
        for line in lbl.read_text().splitlines():
            if line.strip():
                classes.add(int(line.split()[0]))

    nc = max(classes) + 1 if classes else 0
    names = [f"class_{i}" for i in range(nc)]
    return nc, names