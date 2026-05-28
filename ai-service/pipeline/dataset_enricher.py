"""Dataset enrichment for medicine validation and manufacturer cross-checking."""

import os
import re
import csv
import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent / "data"

# In-memory cache
_medicine_names: set[str] = set()
_manufacturers: set[str] = set()
_loaded = False


def _normalize(s: str) -> str:
    return re.sub(r'\s+', ' ', str(s or '').lower().strip())


def _load_csv(filepath: Path, col_name: str, col_mfg: Optional[str] = None):
    """Load medicine names and manufacturers from CSV."""
    global _medicine_names, _manufacturers
    try:
        with open(filepath, encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name_val = row.get(col_name, '') or row.get('name', '') or row.get('medicine_name', '')
                if name_val:
                    _medicine_names.add(_normalize(name_val))
                if col_mfg:
                    mfg_val = row.get(col_mfg, '')
                    if mfg_val:
                        _manufacturers.add(_normalize(mfg_val))
    except Exception as e:
        logger.warning(f"Could not load {filepath}: {e}")


def _load_json(filepath: Path):
    """Load medicine data from JSON."""
    global _medicine_names, _manufacturers
    try:
        with open(filepath, encoding='utf-8') as f:
            data = json.load(f)
        items = data if isinstance(data, list) else data.get('data', data.get('records', []))
        for item in (items if isinstance(items, list) else []):
            if isinstance(item, dict):
                for k in ('name', 'medicine_name', 'drug_name', 'Medicine Name'):
                    if k in item:
                        _medicine_names.add(_normalize(item[k]))
                for k in ('manufacturer', 'company', 'Manufacturer'):
                    if k in item:
                        _manufacturers.add(_normalize(item[k]))
    except Exception as e:
        logger.warning(f"Could not load {filepath}: {e}")


def load_datasets():
    """Load all available datasets into memory."""
    global _loaded
    if _loaded:
        return

    if not DATA_DIR.exists():
        logger.info("No data directory found, skipping dataset load")
        _loaded = True
        return

    for filepath in DATA_DIR.rglob('*'):
        if not filepath.is_file():
            continue
        ext = filepath.suffix.lower()
        if ext == '.csv':
            _load_csv(filepath, 'name', 'manufacturer')
        elif ext == '.json':
            _load_json(filepath)

    logger.info(f"Datasets loaded: {len(_medicine_names)} medicines, {len(_manufacturers)} manufacturers")
    _loaded = True


def validate_medicine_name(name: Optional[str]) -> dict:
    """Check if medicine name exists in known dataset."""
    if not name:
        return {'known': None, 'confidence': 0}

    load_datasets()
    normalized = _normalize(name)

    # Exact match
    if normalized in _medicine_names:
        return {'known': True, 'confidence': 95}

    # Partial match (medicine name contains a known word)
    for known in _medicine_names:
        if known and (known in normalized or normalized in known):
            return {'known': True, 'confidence': 75}

    if not _medicine_names:
        return {'known': None, 'confidence': 0}

    return {'known': False, 'confidence': 60}


def validate_manufacturer(mfg: Optional[str]) -> dict:
    """Check if manufacturer name is in known list."""
    if not mfg:
        return {'known': None, 'confidence': 0}

    load_datasets()
    normalized = _normalize(mfg)

    # Known pharmaceutical company patterns
    known_patterns = [
        r'\b(cipla|sun\s*pharma|dr\.?\s*reddy|lupin|mankind|zydus|glenmark|torrent)\b',
        r'\b(abbott|bayer|pfizer|novartis|roche|glaxo|astrazeneca|johnson)\b',
        r'\b(ranbaxy|alembic|cadila|wockhardt|hetero|natco|aurobindo)\b',
        r'\bpharm(a|aceutical|aceuticals)?\b.*\b(ltd|limited|inc|corp|pvt)\b',
    ]

    for pattern in known_patterns:
        if re.search(pattern, normalized, re.I):
            return {'known': True, 'confidence': 85}

    if normalized in _manufacturers:
        return {'known': True, 'confidence': 90}

    if not _manufacturers:
        return {'known': None, 'confidence': 0}

    return {'known': False, 'confidence': 50}
