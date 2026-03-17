import os
import requests
import zipfile
import subprocess
from pathlib import Path

GITHUB_REPOS = [
    'https://github.com/ageron/handson-ml2',
    'https://github.com/ardamavi/Sign-Language-Digits-Dataset',
    'https://github.com/soumith/imagenetloader.torch',
    'https://github.com/Kaggle/kaggle-api',
    'https://github.com/ieee8023/medical-imaging-datasets'
]

RAW_DATA_DIR = Path(__file__).parent / 'data' / 'raw'


def clone_repo(repo_url):
    repo_name = repo_url.split('/')[-1]
    dest = RAW_DATA_DIR / repo_name
    if dest.exists():
        print(f"Repo {repo_name} already exists.")
        return
    try:
        subprocess.run(['git', 'clone', repo_url, str(dest)], check=True)
        print(f"Cloned {repo_url}")
    except Exception as e:
        print(f"Git clone failed for {repo_url}: {e}")
        # Try zip download
        zip_url = repo_url + '/archive/refs/heads/master.zip'
        zip_path = RAW_DATA_DIR / f'{repo_name}.zip'
        try:
            r = requests.get(zip_url)
            with open(zip_path, 'wb') as f:
                f.write(r.content)
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(RAW_DATA_DIR)
            print(f"Downloaded zip for {repo_url}")
        except Exception as e2:
            print(f"Zip download failed for {repo_url}: {e2}")


def fetch_all():
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    for repo in GITHUB_REPOS:
        clone_repo(repo)

if __name__ == '__main__':
    fetch_all()
