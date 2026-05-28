"""Calibrated risk scoring combining OCR, LLM, and metadata signals."""

from typing import Optional
import re
from datetime import datetime


def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def check_date_logic(mfg_date: Optional[str], expiry_date: Optional[str]) -> dict:
    """Validate date consistency."""
    if not mfg_date or not expiry_date:
        return {"valid": None, "expired": None, "suspicious": False}

    def parse(d: str):
        for fmt in ('%m/%Y', '%m-%Y', '%m/%y', '%m-%y'):
            try:
                return datetime.strptime(d.strip(), fmt)
            except ValueError:
                pass
        return None

    mfg = parse(mfg_date)
    exp = parse(expiry_date)

    if not mfg or not exp:
        return {"valid": None, "expired": None, "suspicious": False}

    now = datetime.now()
    expired = exp < now
    illogical = exp <= mfg

    return {"valid": not illogical, "expired": expired, "suspicious": illogical}


def score_ocr_quality(entities: dict) -> float:
    """Score OCR completeness (0-100)."""
    fields = ['batch_number', 'expiry_date', 'manufacturer', 'dosage', 'composition']
    present = sum(1 for f in fields if entities.get(f))
    return (present / len(fields)) * 100


def score_text_completeness(text: str) -> float:
    """Score based on expected packaging signals."""
    checks = [
        bool(re.search(r'batch|lot|b\.?\s*no', text, re.I)),
        bool(re.search(r'exp(?:iry)?|expires', text, re.I)),
        bool(re.search(r'manufactur|mfg\s*by|marketed', text, re.I)),
        bool(re.search(r'\d+\s*(?:mg|ml|mcg|g|IU)\b', text, re.I)),
        bool(re.search(r'composition|contains|ingredient', text, re.I)),
        bool(re.search(r'store|keep|below\s*\d+', text, re.I)),
    ]
    return (sum(checks) / len(checks)) * 100


def fuse_scores(
    ocr_score: float,
    llm_confidence: float,
    llm_classification: str,
    date_check: dict,
    anomaly_count: int,
) -> dict:
    """
    Weighted fusion of all signals.
    Returns: { final_score, verdict, risk_level }
    """
    # Weights
    W_OCR = 0.25
    W_LLM = 0.50
    W_DATE = 0.15
    W_ANOMALY = 0.10

    # Normalize LLM confidence to 0-100
    llm_norm = _clamp(llm_confidence)

    # Date penalty
    date_score = 100.0
    if date_check.get('suspicious'):
        date_score = 10.0
    elif date_check.get('expired'):
        date_score = 30.0
    elif date_check.get('valid') is None:
        date_score = 60.0

    # Anomaly penalty
    anomaly_penalty = _clamp(anomaly_count * 12.0, 0.0, 60.0)
    anomaly_score = _clamp(100.0 - anomaly_penalty)

    # Weighted fusion
    raw_score = (
        W_OCR * ocr_score +
        W_LLM * llm_norm +
        W_DATE * date_score +
        W_ANOMALY * anomaly_score
    )

    # Classification override
    if llm_classification == 'FAKE' and anomaly_count >= 2:
        raw_score = min(raw_score, 35.0)
    elif llm_classification == 'SAFE' and ocr_score >= 70:
        raw_score = max(raw_score, 72.0)

    final = _clamp(raw_score)

    if final >= 72 and llm_classification != 'FAKE':
        verdict = 'authentic'
    elif final <= 40 or llm_classification == 'FAKE':
        verdict = 'counterfeit'
    else:
        verdict = 'suspicious'

    risk_level = 'low' if verdict == 'authentic' else 'high' if verdict == 'counterfeit' else 'medium'

    return {
        'final_score': round(final, 1),
        'verdict': verdict,
        'risk_level': risk_level,
        'components': {
            'ocr_score': round(ocr_score, 1),
            'llm_confidence': round(llm_norm, 1),
            'date_score': round(date_score, 1),
            'anomaly_score': round(anomaly_score, 1),
        },
    }
