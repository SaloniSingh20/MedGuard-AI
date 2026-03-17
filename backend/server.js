const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medguard')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Schemas
const medicineSchema = new mongoose.Schema({
  medicine_id: String,
  name: String,
  manufacturer: String,
  batch_number: String,
  qr_code: String,
  manufacture_date: Date,
  expiry_date: Date,
  authentic_packaging_image: String
});

const verificationLogSchema = new mongoose.Schema({
  verification_id: String,
  medicine_id: String,
  timestamp: { type: Date, default: Date.now },
  authenticity_score: Number,
  result: String
});

const reportSchema = new mongoose.Schema({
  report_id: String,
  medicine_name: String,
  image: String,
  description: String,
  location: String,
  timestamp: { type: Date, default: Date.now }
});

const blockchainSchema = new mongoose.Schema({
  block_id: String,
  medicine_id: String,
  timestamp: { type: Date, default: Date.now },
  previous_hash: String,
  hash: String,
  batch_number: String,
  manufacturer: String
});

const Medicine = mongoose.model('Medicine', medicineSchema);
const VerificationLog = mongoose.model('VerificationLog', verificationLogSchema);
const Report = mongoose.model('Report', reportSchema);
const Blockchain = mongoose.model('Blockchain', blockchainSchema);

// File upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Routes
app.post('/api/verify-image', upload.single('image'), async (req, res) => {
  try {
    // Forward to AI service (mock for now)
    const response = await fetch('http://localhost:8000/analyze-image', {
      method: 'POST',
      body: req.file
    });
    const result = await response.json();

    // Save verification log
    const log = new VerificationLog({
      verification_id: Date.now().toString(),
      medicine_id: req.body.medicine_id,
      authenticity_score: result.authenticity_score,
      result: result.result
    });
    await log.save();

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.post('/api/verify-qr', async (req, res) => {
  try {
    const { qr_code } = req.body;
    // Mock verification
    const medicine = await Medicine.findOne({ qr_code });
    if (medicine) {
      res.json({
        medicine_name: medicine.name,
        manufacturer: medicine.manufacturer,
        batch_number: medicine.batch_number,
        manufacture_date: medicine.manufacture_date,
        expiry_date: medicine.expiry_date,
        verification_result: 'Valid'
      });
    } else {
      res.status(404).json({ error: 'QR code not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'QR verification failed' });
  }
});

app.get('/api/medicine/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ medicine_id: req.params.id });
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch medicine' });
  }
});

app.post('/api/report-counterfeit', upload.single('image'), async (req, res) => {
  try {
    const report = new Report({
      report_id: Date.now().toString(),
      medicine_name: req.body.medicine_name,
      image: req.file ? req.file.filename : null,
      description: req.body.description,
      location: req.body.location
    });
    await report.save();
    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

app.get('/api/admin/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.get('/api/admin/verifications', async (req, res) => {
  try {
    const logs = await VerificationLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch verification logs' });
  }
});

app.post('/api/admin/add-medicine', async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
    await medicine.save();
    res.json({ message: 'Medicine added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add medicine' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});