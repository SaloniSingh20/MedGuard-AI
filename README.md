# MedGuard AI

> **AI-powered pharmaceutical authentication platform** — combines multi-stage OCR, large language model reasoning, a curated pharmaceutical reference database, and optional blockchain-backed immutable logs to classify medicine packages as **Authentic**, **Suspicious**, or **Counterfeit** with confidence scoring.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Analysis Pipeline](#analysis-pipeline)
5. [Confidence Fusion Engine](#confidence-fusion-engine)
6. [Pharmaceutical Database](#pharmaceutical-database)
7. [Project Structure](#project-structure)
8. [Prerequisites](#prerequisites)
9. [Installation & Setup](#installation--setup)
10. [Running Locally](#running-locally)
11. [API Reference](#api-reference)
12. [Classification Logic](#classification-logic)
13. [Blockchain Integration](#blockchain-integration)
14. [AI Service (Python)](#ai-service-python)
15. [Environment Variables](#environment-variables)
16. [Troubleshooting](#troubleshooting)
17. [Contributing](#contributing)

---

## Overview

Counterfeit medicines cause an estimated **1 million deaths per year** globally (WHO). MedGuard AI addresses this by providing a consumer-facing tool that:

- Extracts text from uploaded medicine package images using **Tesseract OCR**
- Validates extracted text against a **pharmaceutical reference database** (200+ approved medicines, 80+ manufacturers)
- Runs **LLM-based reasoning** (Ollama + LLaMA 3) for contextual analysis
- Fuses all signals through a **weighted confidence engine** to produce a final verdict
- Records results on an **Ethereum blockchain** for tamper-proof audit trails
- Displays results on a **Next.js 14** dashboard with real-time analytics

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND  (Next.js 14)                          │
│                                                                         │
│  /  Landing    /verify  Upload     /result/:id  Verdict                 │
│  /dashboard    Analytics Chart     /alerts      Alert Center            │
│  /settings     Config              Framer Motion · Recharts · Tailwind  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │  REST  (http://localhost:5000)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       BACKEND  (Node.js / Express)                      │
│                                                                         │
│  routes/        verification · analytics · alerts · settings            │
│  controllers/   verificationController · analyticsController · ...      │
│  services/      ocrService  ──►  aiService  ──►  blockchainService      │
│  model.js       Confidence Fusion Pipeline (OCR+LLM+Fields+DB)         │
│  data/          medicineDatabase.js  (200+ meds, 80+ manufacturers)    │
│  models/        Verification · Report · AppSettings (Mongoose)          │
│  middleware/    rateLimiter · errorHandler · validate                   │
└──────┬───────────────────┬────────────────────────────┬────────────────┘
       │                   │                            │
       ▼                   ▼                            ▼
┌────────────┐  ┌─────────────────────┐  ┌────────────────────────────┐
│ Tesseract  │  │  MongoDB 8.x        │  │ Blockchain (Hardhat)       │
│ .js v5     │  │  verification_logs  │  │ MedGuardVerification.sol   │
│ (in-proc)  │  │  reports            │  │ Ethereum local / Sepolia   │
│ PSM 3 + 6  │  │  app_settings       │  │ Immutable batch history    │
└────────────┘  └─────────────────────┘  └────────────────────────────┘
       │
       ▼ (optional)
┌─────────────────────────────────────────────────────────────────────────┐
│              AI SERVICE  (Python FastAPI)  — optional                   │
│                                                                         │
│  /analyze-image   pytesseract + OpenCV preprocessing                    │
│  /analyze-text    Ollama LLM structured analysis                        │
│  /health          Service health check                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | Next.js | 14.2.x | App Router, SSR, routing |
| Frontend | React | 18.x | UI components |
| Frontend | TypeScript | 5.x | Type safety |
| Frontend | Tailwind CSS | 3.x | Styling, dark mode |
| Frontend | Framer Motion | 11.x | Animations |
| Frontend | Recharts | 2.x | Dashboard charts |
| Frontend | react-dropzone | 14.x | Image upload |
| Frontend | Lucide React | — | Icons |
| Frontend | CVA | — | Component variants |
| Backend | Node.js | 24.x | Runtime |
| Backend | Express | 4.x | HTTP server |
| Backend | Mongoose | 8.x | MongoDB ODM |
| Backend | Multer | 1.4.x LTS | File uploads |
| Backend | Tesseract.js | 5.x | OCR (in-process) |
| Backend | Helmet | 8.x | HTTP security headers |
| Backend | express-rate-limit | 7.x | API rate limiting |
| Database | MongoDB | 8.3.x | Persistence |
| AI | Ollama + LLaMA 3 | — | LLM reasoning |
| AI Service | Python FastAPI | — | OCR + LLM pipeline |
| AI Service | pytesseract + OpenCV | — | Image preprocessing |
| Blockchain | Solidity | 0.8.20 | Smart contract |
| Blockchain | Hardhat | — | Dev network + deployment |
| Blockchain | ethers.js | 6.x | Contract interaction |

---

## Analysis Pipeline

Every uploaded image goes through a **5-stage pipeline**:

```
Stage 1: OCR Extraction
  Image → Tesseract.js (PSM 3 + PSM 6 dual-run)
  → Pick best result by confidence + length
  → Clean & normalize text
  → Fallback: demo pharmaceutical text if OCR fails

Stage 2: AI Analysis
  Extracted text → Ollama LLaMA 3
  → 10-point authentication protocol prompt
  → Returns: classification, confidence, reasoning, anomalies, fields_found
  → Fallback: Rule-based analysis (10 field checks) if Ollama unavailable

Stage 3: Field Extraction & DB Validation
  OCR text → Regex extraction:
    batch number, expiry date, manufacturer name,
    dosage strength, composition, regulatory references
  → Validate against pharmaceutical database:
    200+ approved medicines, 80+ manufacturers,
    batch format patterns, expiry date logic

Stage 4: Confidence Fusion
  OCR quality score  ×  15%
  LLM confidence     ×  50%
  Field presence     ×  25%  (10 fields, 0-100%)
  DB validation      ×  10%
  → Penalties: -7% per red flag, -12% if expired
  → Bonus: +4% recognized manufacturer, +3% pharmacopoeia ref

Stage 5: Verdict Determination
  Fused score + rules → authentic / suspicious / counterfeit
  → Blockchain record (async, non-blocking)
  → MongoDB persistence
  → JSON response to frontend
```

---

## Confidence Fusion Engine

The fusion formula:

```
fused = (OCR_conf × 0.15) + (AI_conf × 0.50) + (field_score × 0.25) + (DB_score × 0.10)

field_score  = (fields_found / 10) × 100
DB_score     = (mfr_score × 0.35) + (batch_score × 0.25) + (expiry_score × 0.25) + (comp_score × 0.15)

Adjustments:
  - red_flag_count × 7  (penalty per flag)
  - expired product     -12
  - known manufacturer  +4
  - pharmacopoeia ref   +3
  - known medicine name +3
```

### Verdict Thresholds

| Condition | Verdict |
|---|---|
| fieldCount ≥ 6 + core fields present + no red flags + fused ≥ 68 + known mfr/comp ref | **Authentic** |
| fieldCount ≤ 2 + ≥2 red flags | **Counterfeit** |
| LLM returns FAKE + severe anomaly (forged/tamper/blacklist) + fused ≥ 60 | **Counterfeit** |
| Expired product | Downgrade from Authentic → Suspicious |
| All other cases | **Suspicious** |

---

## Pharmaceutical Database

`backend/data/medicineDatabase.js` — a curated reference database based on:
- WHO Essential Medicines List (24th edition)
- FDA Orange Book approved drugs
- Indian Pharmacopoeia (IP 2022)
- CDSCO approved pharmaceutical manufacturers

### Coverage

| Category | Count |
|---|---|
| Approved medicine names | 200+ |
| Approved manufacturers (Indian + global) | 80+ |
| Batch number format patterns | 5 |
| Expiry date regex patterns | 4 |

### Validation Functions

| Function | Input | Returns |
|---|---|---|
| `validateMedicineName(name)` | string | `{ valid, score, match }` |
| `validateManufacturer(text)` | string | `{ valid, score, name }` |
| `validateBatchNumber(batch)` | string | `{ valid, score, suspicious }` |
| `validateExpiryDate(text)` | string | `{ valid, score, expired, dateStr }` |
| `validateComposition(text)` | string | `{ valid, score, pharmaRef, hasDosage }` |

---

## Project Structure

```
MedGuard-AI/
├── frontend/                     # Next.js 14 App Router
│   ├── app/
│   │   ├── layout.tsx            # Root layout, Navbar, dark mode
│   │   ├── globals.css           # Tailwind + CSS variables
│   │   ├── page.tsx              # Landing page
│   │   ├── verify/page.tsx       # Upload & verification page
│   │   ├── result/[id]/page.tsx  # Result page (verdict + details)
│   │   ├── dashboard/page.tsx    # Analytics dashboard
│   │   ├── alerts/page.tsx       # Alert center
│   │   └── settings/page.tsx     # App settings
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── ConfidenceMeter.tsx   # SVG circular progress
│   │   ├── UploadZone.tsx        # Drag-and-drop upload
│   │   ├── StatCard.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   └── ui/                   # Button, Badge, Card (CVA-based)
│   ├── lib/
│   │   ├── api.ts                # All backend API calls
│   │   └── utils.ts              # cn(), formatDate(), etc.
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                      # Express API server
│   ├── server.js                 # Entry point
│   ├── model.js                  # Confidence fusion pipeline
│   ├── controllers/
│   │   ├── verificationController.js
│   │   ├── analyticsController.js
│   │   ├── alertController.js
│   │   └── settingsController.js
│   ├── routes/
│   │   ├── verification.js
│   │   ├── analytics.js
│   │   ├── alerts.js
│   │   └── settings.js
│   ├── services/
│   │   ├── ocrService.js         # Tesseract.js dual-PSM OCR
│   │   ├── aiService.js          # Ollama LLM + rule-based fallback
│   │   ├── blockchainService.js  # ethers.js contract interaction
│   │   └── alertService.js       # MongoDB aggregation alert engine
│   ├── models/
│   │   ├── Verification.js       # verification_logs schema
│   │   ├── Report.js             # community reports schema
│   │   └── AppSettings.js        # admin settings schema
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── validate.js
│   ├── data/
│   │   └── medicineDatabase.js   # 200+ meds, 80+ manufacturers
│   ├── eng.traineddata           # Tesseract English language data
│   ├── uploads/                  # Temporary image uploads (auto-deleted)
│   ├── .env
│   └── package.json
│
├── ai-service/                   # Python FastAPI (optional)
│   ├── main.py
│   ├── pipeline/
│   │   ├── ocr.py                # pytesseract + OpenCV preprocessing
│   │   ├── llm.py                # httpx Ollama client
│   │   ├── risk_scorer.py        # Weighted confidence fusion
│   │   └── dataset_enricher.py   # CSV/JSON dataset loading
│   ├── data/                     # Medicine datasets (CSV/JSON)
│   ├── requirements.txt
│   └── Dockerfile
│
├── blockchain/                   # Ethereum smart contract
│   ├── contracts/
│   │   └── MedGuardVerification.sol
│   ├── scripts/
│   │   ├── deploy.js             # Deploys and updates backend .env
│   │   └── interact.js           # Demo interaction
│   ├── hardhat.config.js
│   └── package.json
│
├── docker-compose.yml            # Full stack Docker setup
└── README.md
```

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | ≥ 20 LTS | [nodejs.org](https://nodejs.org) |
| MongoDB | ≥ 6 | [mongodb.com](https://mongodb.com) or Docker |
| Ollama | Latest | [ollama.ai](https://ollama.ai) — for LLM analysis |
| Python | ≥ 3.10 | Only if running the AI service |
| Tesseract OCR | 5.x | System-level — only for the Python AI service |

> The Node.js backend uses **Tesseract.js** (in-process, no system install needed).
> Ollama is optional — the system falls back to the rule-based engine automatically.

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/MedGuard-AI.git
cd MedGuard-AI
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install

# Blockchain (optional)
cd ../blockchain && npm install
```

### 3. Configure environment

The backend `.env` is pre-configured for local development:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/medguard
PORT=5000
FRONTEND_URL=http://localhost:3000
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
OLLAMA_TIMEOUT_MS=20000
NODE_ENV=development
```

The frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Start MongoDB

```bash
# Windows (service)
net start MongoDB

# macOS / Linux
mongod --dbpath /data/db

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:8
```

### 5. (Optional) Start Ollama + LLaMA 3

```bash
# Install: https://ollama.ai
ollama pull llama3
ollama serve
```

Without Ollama, the system uses the built-in rule-based analysis engine which evaluates 10 pharmaceutical label fields automatically.

---

## Running Locally

```bash
# Terminal 1 — Backend API
cd backend
npm run dev
# → http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# → http://localhost:3000
```

Or from the monorepo root (requires `concurrently`):

```bash
npm run dev
```

Open **http://localhost:3000** to use the application.

---

## API Reference

All endpoints are prefixed with `/api`.

### Verification

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/verify-image` | Upload and analyze a medicine image |
| `GET` | `/api/verifications/:id` | Fetch a single verification result |
| `GET` | `/api/verifications/recent` | List recent verifications (`?limit=10`) |
| `POST` | `/api/reports` | Submit a community counterfeit report |
| `GET` | `/api/reports` | List community reports |

#### POST /api/verify-image

```
Content-Type: multipart/form-data

file          (required)  Image file — JPEG, PNG, WebP, max 10MB
medicine_name (optional)  Known medicine name for context
batch_number  (optional)  Batch number override
```

Response:

```json
{
  "success": true,
  "status": "authentic | suspicious | counterfeit",
  "result": "SAFE | SUSPICIOUS | FAKE",
  "confidence": 0.87,
  "authenticity_score": 87,
  "medicine_name": "Paracetamol 500mg",
  "batch_number": "PCM-2024-0312",
  "verification_id": "684b2a...",
  "blockchain": null
}
```

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Total verifications, counterfeit count, reports |
| `GET` | `/api/admin/analytics` | Weekly scan data, detection distribution |
| `GET` | `/api/admin/verifications` | Full verification list |
| `GET` | `/api/admin/training-metrics` | Dataset stats, pipeline progress, model performance |

### Alerts & Settings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/alerts` | Active alerts (`?limit=24`) |
| `GET` | `/api/settings` | Current application settings |
| `PUT` | `/api/settings` | Update application settings |
| `GET` | `/api/health` | Service health check |

---

## Classification Logic

### Three-Class Output

| Class | Display | Meaning |
|---|---|---|
| `authentic` | ✅ Authentic | All critical fields validated, recognized manufacturer, no red flags |
| `suspicious` | ⚠️ Suspicious | Partial fields, unrecognized manufacturer, minor inconsistencies |
| `counterfeit` | ❌ Counterfeit | Multiple missing fields, known fake batch patterns, severe AI flags |

### Authentication Checklist (10 Fields)

| # | Field | Validated Against |
|---|---|---|
| 1 | Medicine name / form | WHO/FDA/IP approved medicines database |
| 2 | Manufacturer | 80+ known pharmaceutical companies |
| 3 | Batch number | 5 format patterns, fake batch blacklist |
| 4 | Expiry date | Future date check, 10-year cap |
| 5 | Manufacturing date | Temporal consistency with expiry |
| 6 | Dosage strength | Unit patterns (mg/ml/mcg/g/IU) |
| 7 | Active composition | IP/BP/USP pharmacopoeia reference |
| 8 | Storage instructions | Keyword presence |
| 9 | Regulatory reference | Schedule H/G/X, Rx-only markers |
| 10 | Country of origin | Standard country identifiers |

### Red Flags (Auto-detected)

- Date span > 10 years on same package
- Manufacturing year before 2005
- Future expiry > 10 years ahead
- Expired product (date in the past)
- Suspicious batch patterns (0000, XXXX, TEST, FAKE)
- Suspicious disclaimer text (e.g. "NOT FOR RETAIL", "SAMPLE ONLY")
- Unverified authenticity claims from unknown manufacturer

---

## Blockchain Integration

`MedGuardVerification.sol` deployed on Hardhat local network (or Sepolia testnet).

### Contract Functions

| Function | Parameters | Description |
|---|---|---|
| `recordVerification` | verificationId, batchNumber, medicineHash, verdict, confidence | Write verification to chain |
| `getBatchHistory` | batchNumber | Returns all verifications for a batch |
| `getVerification` | verificationId | Returns single on-chain record |
| `isBatchSuspicious` | batchNumber | True if batch has 2+ suspicious verdicts |

### Deploying Locally

```bash
cd blockchain

# Start local Hardhat node
npx hardhat node

# In another terminal — deploy contract
npm run deploy:local
# → Automatically updates backend/.env with CONTRACT_ADDRESS and RPC_URL
```

The backend records each verification to the blockchain **asynchronously** (non-blocking). If the blockchain is unavailable, verification still completes and is stored in MongoDB.

---

## AI Service (Python)

The optional `ai-service/` provides a more powerful OCR pipeline with OpenCV image preprocessing.

### Setup

```bash
cd ai-service
pip install -r requirements.txt

# Install system Tesseract
# Windows: https://github.com/UB-Mannheim/tesseract/wiki
# Ubuntu:  sudo apt install tesseract-ocr
# macOS:   brew install tesseract

uvicorn main:app --host 0.0.0.0 --port 8000
```

### Endpoints

| Endpoint | Description |
|---|---|
| `POST /analyze-image` | Full OCR + LLM pipeline with OpenCV preprocessing |
| `POST /analyze-text` | LLM analysis on pre-extracted text |
| `GET /health` | Health check |

When `AI_SERVICE_URL=http://localhost:8000` is set in backend `.env`, the Node.js backend can delegate to the Python service for higher-quality image analysis.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/medguard` | MongoDB connection string |
| `PORT` | `5000` | Backend server port |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API base URL |
| `OLLAMA_MODEL` | `llama3` | LLM model name |
| `OLLAMA_TIMEOUT_MS` | `20000` | LLM request timeout (ms) |
| `AI_SERVICE_URL` | `http://localhost:8000` | Python AI service URL |
| `CONTRACT_ADDRESS` | _(empty)_ | Deployed Solidity contract address |
| `RPC_URL` | `http://127.0.0.1:8545` | Ethereum RPC endpoint |
| `PRIVATE_KEY` | _(Hardhat default)_ | Wallet private key for signing |
| `NODE_ENV` | `development` | Environment mode |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend API base URL |

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Backend shows `mongo: disconnected` | MongoDB not running | `net start MongoDB` (Windows) or `mongod` (Linux/macOS) |
| All results show "Rule-based analysis" | Ollama not running | `ollama serve` and `ollama pull llama3` |
| OCR returns empty text | Low image quality | Ensure label is well-lit, in-focus, and text fills the frame |
| `EPERM` errors on `npm install` | Windows file lock | Close editors, run as Administrator |
| Frontend `border-border` CSS error | Tailwind custom colors missing | Already fixed in `tailwind.config.ts` |
| Blockchain calls silently fail | Contract not deployed | Run `npm run deploy:local` in `blockchain/` |
| Port 3000 or 5000 in use | Another process running | `netstat -ano \| findstr :3000` then `taskkill /PID <id> /F` |
| `Cannot find module '../data/medicineDatabase'` | Missing `data/` directory | Run `npm install` in `backend/`, directory should be present |

---

## Docker (Full Stack)

```bash
# Build and start all services
docker-compose up --build

# Services:
#   Frontend  → http://localhost:3000
#   Backend   → http://localhost:5000
#   MongoDB   → localhost:27017
#   AI Service → http://localhost:8000
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes following the existing code style
4. Add/update tests if applicable
5. Submit a pull request with a clear description

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Built for the purpose of combating counterfeit medicine distribution. Not a substitute for professional pharmaceutical quality control.*
