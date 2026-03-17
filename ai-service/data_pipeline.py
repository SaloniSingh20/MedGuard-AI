import os
import cv2
import numpy as np
from pathlib import Path

RAW_DATA_DIR = Path(__file__).parent / 'data' / 'raw'
PROCESSED_DATA_DIR = Path(__file__).parent / 'data' / 'processed'

LABELS = ['genuine', 'suspicious', 'unknown']


def process_images():
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    for repo_dir in RAW_DATA_DIR.iterdir():
        if repo_dir.is_dir():
            for img_file in repo_dir.rglob('*.jpg'):
                img = cv2.imread(str(img_file))
                if img is None:
                    continue
                img = cv2.resize(img, (224, 224))
                img = img / 255.0
                # Dummy label assignment
                label = 'unknown'
                out_dir = PROCESSED_DATA_DIR / label
                out_dir.mkdir(exist_ok=True)
                out_path = out_dir / img_file.name
                cv2.imwrite(str(out_path), (img * 255).astype(np.uint8))
                print(f"Processed {img_file} -> {out_path}")

if __name__ == '__main__':
    process_images()
