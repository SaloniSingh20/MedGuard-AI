# MedGuard AI

AI-powered medicine verification platform that combines OCR + LLM analysis + blockchain-backed history to classify scans into:

- Authentic
- Suspicious
- Counterfeit

## What It Does

- Scans medicine package images from the web UI.
- Extracts text using OCR.
- Runs AI verification on extracted packaging content.
- Fuses AI signals with blockchain/history evidence for final classification.
- Stores verification logs and analysis details in MongoDB.
- Provides dashboard metrics for analytics, alerts, and training telemetry.

## Current Classification Logic

The backend classifies each scan into `authentic`, `suspicious`, or `counterfeit` using:

1. AI signals
- Model status and confidence
- AI reason and detected issues

2. OCR quality/content signals
- Presence of batch/lot identifiers
- Presence of mfg/exp date markers
- Presence of dosage/composition keywords
- Presence of manufacturer/company terms

3. Blockchain/history fusion
- Prior verdict consistency for the same batch
- Counterfeit-safe history signals
- Severity gating (tamper/forged/invalid-QR style indicators)

Final result is a fused status with calibrated confidence.

## Result Page Behavior

- Shows verification result gauge and confidence.
- Shows AI reason and detected issues.
- Supply chain timeline is intentionally hidden from the result page output flow.

## Repository Structure

```text
medguard-ai/
  ai-service/
    data/
    scripts/
    main.py
    train_model.py
  backend/
    services/
    server.js
    model.js
  frontend/
    app/
    components/
  blockchain/
  database/
  docker-compose.yml
```

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or Docker)
- Ollama running locally (default: http://localhost:11434)

## Setup

### 1) Install dependencies

Root:

```bash
npm install
```

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd frontend
npm install
```

AI service:

```bash
cd ai-service
pip install -r requirements.txt
```

### 2) Start MongoDB

```bash
docker compose -f database/docker-compose.yml up -d
```

### 3) Start services

From root:

```bash
npm run dev
```

This runs:

- Backend on port 5000
- Frontend on port 3000
- AI service on port 8000

## Environment Variables

Backend (`backend/.env`):

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/medguard
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3
```

## Key API Endpoints

- `POST /api/verify-image` -> verify uploaded medicine image
- `GET /api/verifications/:id` -> verification + AI reasoning
- `GET /api/admin/training-metrics` -> dynamic training pipeline metrics
- `POST /api/admin/datasets/ingest` -> ingest GitHub/Kaggle dataset sources
- `GET /api/alerts` -> alerts + summary
- `GET /api/admin/analytics` -> analytics distributions
- `GET /api/settings`, `PUT /api/settings` -> settings persistence

## Dataset Ingestion

Dataset ingestion script:

- `ai-service/scripts/ingest-datasets.mjs`

It pulls configured GitHub sources, writes Kaggle-seed records, and generates augmented records used in training telemetry.

Manual ingestion trigger:

```bash
curl -X POST http://localhost:5000/api/admin/datasets/ingest
```

## Notes

- If scans keep returning suspicious for clean packages, verify image quality and packaging completeness (batch/manufacturer/exp fields visible).
- For best results, upload clear front/back packaging photos with readable text.

## License

MIT
