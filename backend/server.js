
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const analyzeMedicine = require("./model");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static("uploads"));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medguard";
mongoose.connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// File upload
const upload = multer({ dest: "uploads/" });

// Scan endpoint using AI model
app.post("/api/verify-image", upload.single("file"), (req, res) => {
  try {
    const result = analyzeMedicine(req.file.path);
    res.json({
      success: true,
      prediction: result.result,
      confidence: result.confidence
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "AI processing failed"
    });
  }
});

// QR verification endpoint (mock)
app.post("/api/verify-qr", async (req, res) => {
  try {
    const { qr_code } = req.body;
    // Mock verification
    // ...existing code...
    res.json({ verification_result: "Valid" });
  } catch (error) {
    res.status(500).json({ error: "QR verification failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});