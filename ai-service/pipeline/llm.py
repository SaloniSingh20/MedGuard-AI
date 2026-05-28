"""LLM layer using Ollama + LLaMA 3 for medicine analysis."""

import json
import re
import os
from typing import Optional

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "20"))


PROMPT_TEMPLATE = """You are a pharmaceutical authentication expert with deep knowledge of medicine packaging standards.

Analyze the following medicine packaging text extracted via OCR:

<packaging_text>
{text}
</packaging_text>

Your task: Determine if this is AUTHENTIC, SUSPICIOUS, or FAKE (counterfeit) medicine.

Check for these red flags:
1. Missing batch/lot number
2. Missing or invalid expiry date
3. Missing manufacturer information
4. Expired medicine (if dates available)
5. Suspicious or misspelled manufacturer names
6. Missing dosage/composition info
7. Inconsistent or impossible date logic (expiry before manufacture)
8. Generic or ambiguous medicine names
9. Signs of text cloning or formatting anomalies
10. Missing storage instructions

Respond ONLY with this exact JSON (no preamble, no extra text):
{{
  "classification": "SAFE" | "SUSPICIOUS" | "FAKE",
  "confidence": <integer 0-100>,
  "reasoning": "<clear explanation of your verdict in 2-3 sentences>",
  "anomalies": ["<specific anomaly 1>", "<specific anomaly 2>"]
}}"""


def build_prompt(ocr_text: str) -> str:
    clean = ocr_text[:3000] if len(ocr_text) > 3000 else ocr_text
    return PROMPT_TEMPLATE.format(text=clean)


def parse_response(raw: str) -> dict:
    """Extract JSON from LLM response."""
    json_match = re.search(r'\{[\s\S]*?\}', raw)
    if not json_match:
        return _rule_based_fallback(raw)

    try:
        parsed = json.loads(json_match.group(0))
        cls = str(parsed.get("classification", "SUSPICIOUS")).upper().strip()
        if cls not in ("SAFE", "SUSPICIOUS", "FAKE"):
            cls = "SUSPICIOUS"

        conf = parsed.get("confidence", 70)
        try:
            conf = max(0, min(100, int(float(conf))))
        except (TypeError, ValueError):
            conf = 70

        return {
            "classification": cls,
            "confidence": conf,
            "reasoning": str(parsed.get("reasoning", "No reasoning provided.")),
            "anomalies": [str(a) for a in parsed.get("anomalies", []) if a],
        }
    except json.JSONDecodeError:
        return _rule_based_fallback(raw)


def _rule_based_fallback(text: str = "") -> dict:
    """Simple heuristic when LLM is unavailable."""
    lower = text.lower()
    has_batch = bool(re.search(r'batch|lot|b\.?\s*no', lower))
    has_expiry = bool(re.search(r'exp|expiry', lower))
    has_mfg = bool(re.search(r'manufactur|mfg|marketed', lower))
    has_dosage = bool(re.search(r'\d+\s*(mg|ml|mcg|g)\b', lower))
    has_comp = bool(re.search(r'composition|contains|ingredient', lower))

    signals = sum([has_batch, has_expiry, has_mfg, has_dosage, has_comp])
    issues = []
    if not has_batch: issues.append("Missing batch/lot number")
    if not has_expiry: issues.append("Missing expiry date")
    if not has_mfg: issues.append("Missing manufacturer")
    if not has_dosage: issues.append("Missing dosage")
    if not has_comp: issues.append("Missing composition")

    if signals >= 4:
        cls, conf = "SAFE", 80
    elif signals <= 1:
        cls, conf = "FAKE", 72
    else:
        cls, conf = "SUSPICIOUS", 65

    return {
        "classification": cls,
        "confidence": conf,
        "reasoning": f"Rule-based analysis: {signals}/5 required packaging fields present. "
                     + (f"Issues: {', '.join(issues)}." if issues else "All key fields present."),
        "anomalies": issues,
    }


async def analyze_with_ollama(ocr_text: str) -> dict:
    """Send text to Ollama and return structured result."""
    if not HTTPX_AVAILABLE or not ocr_text.strip():
        return _rule_based_fallback(ocr_text)

    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": OLLAMA_MODEL, "prompt": build_prompt(ocr_text), "stream": False},
            )
            response.raise_for_status()
            raw = response.json().get("response", "")
            return parse_response(raw)
    except Exception as e:
        print(f"[LLM] Ollama error: {e} — using rule-based fallback")
        return _rule_based_fallback(ocr_text)
