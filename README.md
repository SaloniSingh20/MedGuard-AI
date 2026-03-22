# MedGuard AI

AI-powered medicine verification platform that combines **OCR + LLM analysis + blockchain-backed history** to classify scans into:

* Authentic
* Suspicious
* Counterfeit

---

## What It Does

* Scans medicine package images from the web UI.
* Extracts text using OCR (Tesseract).
* Runs AI verification using LLaMA 3 (via Ollama).
* Fuses AI signals with blockchain/history evidence for final classification.
* Stores verification logs and analysis details in MongoDB.
* Provides dashboard metrics for analytics, alerts, and monitoring.

---

## Current Classification Logic

The backend classifies each scan into `authentic`, `suspicious`, or `counterfeit` using:

### 1. AI Signals

* Model classification (SAFE / SUSPICIOUS / FAKE)
* Confidence score
* AI reasoning
* Detected anomalies

### 2. OCR Quality / Content Signals

* Presence of batch / lot identifiers
* Presence of manufacturing & expiry dates
* Presence of dosage / composition keywords
* Manufacturer / company detection
* Missing or malformed packaging fields

### 3. Blockchain / History Fusion

* Prior verdict consistency for the same batch
* Duplicate or anomaly patterns
* Suspicious verification frequency
* Severity gating (tamper / forged / invalid signals)

➡️ Final output is a **fused classification with calibrated confidence**

---

## Result Page Behavior

* Displays verification result (Authentic / Suspicious / Counterfeit)
* Shows confidence score (visual + numeric)
* Displays AI reasoning and detected issues
* Keeps supply chain timeline hidden from result output flow

---

## Datasets Used

The system leverages multiple datasets for enrichment, validation, and AI reasoning support:

* https://raw.githubusercontent.com/mahfuj-m/Medicine-s-Dataset/master/medicine.csv
* https://raw.githubusercontent.com/mahfuj-m/Medicine-s-Dataset/master/medicine.json
* https://raw.githubusercontent.com/Rajtamang01/Medicine_Recommandation_System_python/main/datasets/medications.csv
* https://raw.githubusercontent.com/Rajtamang01/Medicine_Recommandation_System_python/main/datasets/Training.csv
* https://raw.githubusercontent.com/shivamdobhal/SmartMedicine/main/training.csv

These datasets include:

* Medicine composition and metadata
* Manufacturer and drug details
* Symptom-based mappings
* Training signals for healthcare ML tasks

---

## Repository Structure

```text
medguard-ai/
  ai-service/
    data/
    models/
    pipeline/
    main.py
  backend/
    controllers/
    routes/
    services/
    models/
    middleware/
    server.js
  blockchain/
    contracts/
    scripts/
    hardhat.config.js
  database/
    docker-compose.yml
  frontend/
    app/
    components/
    lib/
    public/
  README.md
```

---

## Tech Stack

### Frontend

* Next.js
* React
* Tailwind CSS
* Framer Motion
* Shadcn UI

### Backend

* Node.js
* Express.js
* Multer
* Axios

### AI Service

* Python (FastAPI)
* Tesseract OCR
* Ollama (LLaMA 3)

### Blockchain

* Solidity
* Hardhat

### Database

* MongoDB

---

## Setup

Install dependencies:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../ai-service && pip install -r requirements.txt
```

Start database:

```bash
docker compose -f database/docker-compose.yml up -d
```

Run LLM:

```bash
ollama run llama3
```

Run app:

```bash
npm run dev
```

---

## API Endpoints

* POST `/api/verify-image` → Verify medicine image
* GET `/api/verifications/:id` → Get verification result
* GET `/api/admin/analytics` → Analytics
* GET `/api/alerts` → Alerts

---

## Notes

* Works best with high-quality images
* OCR accuracy depends on text clarity
* Designed for real-time verification
* Runs LLM locally (privacy-friendly)

---

## License

MIT
