"""OCR pipeline using Tesseract with preprocessing."""

import io
import re
from typing import Optional

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False


def preprocess_image(image_bytes: bytes) -> Optional[bytes]:
    """Denoise, enhance contrast, and threshold for better OCR."""
    if not CV2_AVAILABLE:
        return image_bytes

    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes

        # Resize if too small
        h, w = img.shape[:2]
        if max(h, w) < 800:
            scale = 800 / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Denoise
        denoised = cv2.fastNlMeansDenoising(gray, h=10)

        # Adaptive threshold
        thresh = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )

        # Encode back to bytes
        success, encoded = cv2.imencode('.png', thresh)
        return encoded.tobytes() if success else image_bytes
    except Exception:
        return image_bytes


def extract_text(image_bytes: bytes) -> str:
    """Extract text from image bytes using Tesseract."""
    if not TESSERACT_AVAILABLE:
        return ""

    processed = preprocess_image(image_bytes)
    try:
        img = Image.open(io.BytesIO(processed))
        config = r'--oem 3 --psm 6 -l eng'
        text = pytesseract.image_to_string(img, config=config)
        return clean_text(text)
    except Exception:
        return ""


def clean_text(raw: str) -> str:
    """Remove noise from OCR output."""
    # Remove non-printable chars except newline
    text = re.sub(r'[^\x20-\x7E\n\r]', ' ', raw)
    # Collapse excessive whitespace
    text = re.sub(r'[ \t]{2,}', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def extract_medicine_entities(text: str) -> dict:
    """Extract structured fields from OCR text."""
    lines = text.split('\n')

    def find(pattern: str) -> Optional[str]:
        for line in lines:
            m = re.search(pattern, line, re.IGNORECASE)
            if m:
                rest = line[m.end():].strip().lstrip(':-').strip()
                return rest if rest else None
        return None

    batch_match = re.search(
        r'(?:batch|lot|b\.?\s*no\.?)\s*[:\-]?\s*([A-Z0-9\-\/]{3,20})',
        text, re.IGNORECASE
    )

    expiry_match = re.search(
        r'(?:exp(?:iry)?|expires?)\s*[:\-]?\s*((?:0?[1-9]|1[0-2])[\/-](?:20)?\d{2,4})',
        text, re.IGNORECASE
    )

    mfg_date_match = re.search(
        r'(?:mfg\.?\s*date|manufactured)\s*[:\-]?\s*((?:0?[1-9]|1[0-2])[\/-](?:20)?\d{2,4})',
        text, re.IGNORECASE
    )

    dosage_match = re.search(r'\b(\d{1,4}\s*(?:mg|ml|mcg|g|IU))\b', text, re.IGNORECASE)

    return {
        'raw_text': text,
        'batch_number': batch_match.group(1) if batch_match else None,
        'expiry_date': expiry_match.group(1) if expiry_match else None,
        'mfg_date': mfg_date_match.group(1) if mfg_date_match else None,
        'dosage': dosage_match.group(1) if dosage_match else None,
        'manufacturer': find(r'manufactured\s*by|mfg\s*by|marketed\s*by|manufacturer'),
        'medicine_name': find(r'(tablet|capsule|syrup|injection|ointment|cream)\b') or lines[0][:80] if lines else None,
        'composition': find(r'composition|contains|ingredient|active'),
    }
