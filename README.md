# MedGuard AI

**AI-Powered Fake Medicine Detection & Drug Authentication Platform**

## Features
- AI packaging analysis (real GitHub datasets)
- Blockchain batch authentication
- QR code verification
- Consumer counterfeit reporting
- Real-time scan logs and analytics
- Admin dashboard

## Tech Stack
- Frontend: Next.js, TailwindCSS, Framer Motion
- Backend: Node.js, Express.js
- Database: MongoDB
- AI Microservice: Python FastAPI, TensorFlow/PyTorch, OpenCV
- Blockchain: Hardhat + Solidity

## Project Structure
```
medguard-ai/
  frontend/
    ...
  backend/
    ...
  ai-service/
    ...
  blockchain/
    ...
  database/
    ...
```

## Setup Instructions
1. Start MongoDB:
   ```bash
   docker compose -f database/docker-compose.yml up -d
   ```
2. Start Backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. Start AI Service:
   ```bash
   cd ai-service
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
4. Start Frontend:
   ```bash
   cd frontend/frontend
   npm install
   npm run dev
   ```

## Demo Workflow
- Scan medicine → AI analyzes packaging → Blockchain verifies batch → Authenticity score displayed → Verification logged → User reports counterfeit

## GitHub Data Integration
- Uses real datasets from:
  - ageron/handson-ml2
  - ardamavi/Sign-Language-Digits-Dataset
  - soumith/imagenetloader.torch
  - kaggle/kaggle-api
  - ieee8023/medical-imaging-datasets

## Deployment
- Frontend: Vercel
- Backend: Render
- AI Service: Docker/VPS

## License
MIT
