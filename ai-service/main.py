"""MedGuard AI Service — FastAPI application for medicine verification."""

import os
import io
import asyncio
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from pipeline.ocr import extract_text, extract_medicine_entities
from pipeline.llm import analyze_with_ollama, _rule_based_fallback
from pipeline.risk_scorer import score_ocr_quality, score_text_completeness, check_date_logic, fuse_scores
from pipeline.dataset_enricher import validate_medicine_name, validate_manufacturer, load_datasets

app = FastAPI(
    title="MedGuard AI Service",
    description="FastAPI service for OCR + LLM medicine verification",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Pre-load datasets on startup."""
    asyncio.get_event_loop().run_in_executor(None, load_datasets)


@app.get("/health")
async def health():
    return {"ok": True, "service": "medguard-ai", "version": "2.0.0"}


@app.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    medicine_name: str = Form(default=""),
):
    """Full pipeline: OCR → LLM → risk scoring → verdict."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()
    if len(image_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 15MB)")

    # Step 1: OCR
    ocr_text = extract_text(image_bytes)
    entities = extract_medicine_entities(ocr_text)

    # Step 2: LLM analysis
    llm_result = await analyze_with_ollama(ocr_text)

    # Step 3: Dataset enrichment
    name_to_check = medicine_name or entities.get('medicine_name') or ""
    mfg_to_check = entities.get('manufacturer') or ""

    name_validation = validate_medicine_name(name_to_check)
    mfg_validation = validate_manufacturer(mfg_to_check)

    # Step 4: Risk scoring
    ocr_score = score_ocr_quality(entities)
    text_completeness = score_text_completeness(ocr_text)
    date_check = check_date_logic(entities.get('mfg_date'), entities.get('expiry_date'))

    fused = fuse_scores(
        ocr_score=(ocr_score + text_completeness) / 2,
        llm_confidence=llm_result['confidence'],
        llm_classification=llm_result['classification'],
        date_check=date_check,
        anomaly_count=len(llm_result.get('anomalies', [])),
    )

    # Enhance anomalies with enrichment signals
    anomalies = list(llm_result.get('anomalies', []))
    if name_validation.get('known') is False:
        anomalies.append(f"Medicine name '{name_to_check}' not found in known dataset")
    if mfg_validation.get('known') is False:
        anomalies.append(f"Manufacturer '{mfg_to_check}' not recognized")
    if date_check.get('expired'):
        anomalies.append("Medicine is expired")
    if date_check.get('suspicious'):
        anomalies.append("Invalid date logic: expiry before manufacture date")

    return JSONResponse({
        "success": True,
        "verdict": fused['verdict'],
        "classification": llm_result['classification'],
        "confidence": fused['final_score'] / 100,
        "authenticity_score": fused['final_score'],
        "risk_level": fused['risk_level'],
        "reasoning": llm_result['reasoning'],
        "anomalies": anomalies,
        "extracted": {
            "raw_text": ocr_text,
            "medicine_name": entities.get('medicine_name') or medicine_name,
            "batch_number": entities.get('batch_number'),
            "manufacturer": entities.get('manufacturer'),
            "expiry_date": entities.get('expiry_date'),
            "mfg_date": entities.get('mfg_date'),
            "dosage": entities.get('dosage'),
            "composition": entities.get('composition'),
        },
        "enrichment": {
            "name_known": name_validation.get('known'),
            "manufacturer_known": mfg_validation.get('known'),
            "date_valid": date_check.get('valid'),
            "is_expired": date_check.get('expired'),
        },
        "scoring": fused['components'],
    })


@app.post("/analyze-text")
async def analyze_text_endpoint(payload: dict):
    """Analyze pre-extracted text (for integration testing)."""
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    entities = extract_medicine_entities(text)
    llm_result = await analyze_with_ollama(text)

    return JSONResponse({
        "success": True,
        "classification": llm_result['classification'],
        "confidence": llm_result['confidence'],
        "reasoning": llm_result['reasoning'],
        "anomalies": llm_result.get('anomalies', []),
        "entities": entities,
    })
