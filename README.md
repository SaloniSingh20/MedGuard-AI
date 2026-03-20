# 🛡️ MedGuard AI

### AI-Powered Fake Medicine Detection & Drug Authentication Platform

MedGuard AI is a **next-generation healthcare safety platform** that detects counterfeit medicines using **Artificial Intelligence + Blockchain verification**.
It provides **real-time scanning, authentication, and reporting**, ensuring safer pharmaceutical consumption.

---

## 🚀 Features

* 🧠 **AI Packaging Analysis**
  Detects fake medicines using trained models on real-world datasets.

* ⛓️ **Blockchain Batch Authentication**
  Verifies drug batches securely using smart contracts.

* 🔍 **QR Code Verification**
  Instantly validate medicine authenticity via QR scanning.

* 🚨 **Consumer Counterfeit Reporting**
  Users can report suspicious medicines to improve detection systems.

* 📊 **Real-Time Analytics Dashboard**
  Tracks scan history, fraud detection rates, and system insights.

* 🛠️ **Admin Dashboard**
  Full control over monitoring, alerts, and dataset updates.

---

## 🖥️ Tech Stack

### Frontend

* ⚡ Next.js
* 🎨 TailwindCSS
* 🎬 Framer Motion

### Backend

* 🟢 Node.js
* 🚀 Express.js

### Database

* 🍃 MongoDB

### AI Microservice

* 🐍 Python (FastAPI)
* 🤖 TensorFlow / PyTorch
* 👁️ OpenCV

### Blockchain

* 🔗 Hardhat
* 📜 Solidity

---

## 📁 Project Structure

```
medguard-ai/
│
├── frontend/        # Next.js frontend (UI + dashboard)
├── backend/         # Express API server
├── ai-service/      # AI model + inference service
├── blockchain/      # Smart contracts & scripts
├── database/        # MongoDB + Docker setup
```

---

## ⚡ Setup Instructions

### 1️⃣ Start Database (MongoDB)

```bash
docker compose -f database/docker-compose.yml up -d
```

### 2️⃣ Start Backend

```bash
cd backend
npm install
npm run dev
```

### 3️⃣ Start AI Service

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4️⃣ Start Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Demo Workflow

1. 📸 Upload or capture medicine image
2. 🧠 AI analyzes packaging
3. ⛓️ Blockchain verifies batch authenticity
4. 📊 Authenticity score is generated
5. 📝 Result is logged in system
6. 🚨 User can report counterfeit if detected

---

## 📊 GitHub Dataset Integration

MedGuard AI leverages real-world datasets for training and validation:

* 🔗 https://github.com/ageron/handson-ml2
* 🔗 https://github.com/ardamavi/Sign-Language-Digits-Dataset
* 🔗 https://github.com/soumith/imagenetloader.torch
* 🔗 https://github.com/Kaggle/kaggle-api
* 🔗 https://github.com/ieee8023/medical-imaging-datasets

---

## 🌐 Deployment

* 🌍 **Frontend** → Vercel
* ⚙️ **Backend** → Render
* 🤖 **AI Service** → Docker / VPS

---

## 📸 UI Highlights

* ✨ Glassmorphic design
* 🌙 Dark/Light mode support
* ⚡ Fully responsive & mobile-first
* 🎬 Smooth animations with Framer Motion

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 🤝 Contributing

Contributions are welcome!

* Fork the repository
* Create a new branch
* Submit a Pull Request

---

## 💡 Vision

MedGuard AI aims to eliminate counterfeit medicines globally by combining
**AI intelligence + Blockchain trust**, making healthcare safer and smarter.

---

⭐ *If you found this project useful, please consider giving it a star!*
