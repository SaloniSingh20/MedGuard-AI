const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const analyzeMedicine = require('../model');
const VerificationLog = require('../models/Verification');
const { recordVerification, checkDuplicateBatch } = require('../services/blockchainService');

function toResultLabel(status) {
  if (status === 'counterfeit') return 'Counterfeit';
  if (status === 'suspicious') return 'Suspicious';
  return 'Authentic';
}

async function verifyImage(req, res, next) {
  try {
    const medicineName = req.body.medicine_name || req.file.originalname || 'Unknown Medicine';
    const fallbackBatch = req.body.batch_number || `BATCH-${Date.now().toString().slice(-8)}`;

    const result = await analyzeMedicine(req.file.path, { medicineName, batchNumber: fallbackBatch });

    const batchNumber = result.batch_number || fallbackBatch;
    const score = Math.max(0, Math.min(100, Math.round(Number(result.authenticity_score) || 50)));
    const confidence = Math.max(0, Math.min(1, Number(result.confidence) || score / 100));

    const blockchainData = await checkDuplicateBatch(batchNumber);

    const verification = await VerificationLog.create({
      medicine_name: medicineName,
      batch_number: batchNumber,
      image_name: req.file.originalname || req.file.filename || 'uploaded-image',
      extracted_text: String(result.extracted_text || ''),
      result: toResultLabel(result.status),
      status: result.status,
      authenticity_score: score,
      confidence,
      ai_result: result.ai_result || {},
      anomalies: result.ai_result?.detected_issues || [],
      manufacturer: result.ai_result?.evidence?.manufacturer ? medicineName : '',
      timestamp: new Date(),
    });

    // Async blockchain record (non-blocking)
    const medicineHash = require('crypto')
      .createHash('sha256')
      .update(`${medicineName}-${batchNumber}`)
      .digest('hex');

    recordVerification(
      verification._id.toString(),
      batchNumber,
      medicineHash,
      result.status,
      confidence
    ).then((txHash) => {
      if (txHash) {
        VerificationLog.findByIdAndUpdate(verification._id, { blockchain_tx: txHash }).catch(() => {});
      }
    });

    await fs.promises.unlink(req.file.path).catch(() => {});

    res.json({
      success: true,
      prediction: result.result,
      status: result.status,
      result: toResultLabel(result.status),
      confidence,
      authenticity_score: score,
      medicine_name: medicineName,
      batch_number: batchNumber,
      verification_id: verification._id,
      blockchain: blockchainData.isDuplicate ? blockchainData : undefined,
      diagnostics: result.diagnostics || undefined,
    });
  } catch (err) {
    if (req.file?.path) await fs.promises.unlink(req.file.path).catch(() => {});
    next(err);
  }
}

async function getVerification(req, res, next) {
  try {
    const verification = await VerificationLog.findById(req.params.id);
    if (!verification) {
      return res.status(404).json({ success: false, error: 'Verification not found' });
    }
    res.json({ verification, supply_chain_steps: [] });
  } catch (err) {
    next(err);
  }
}

async function getRecentVerifications(req, res, next) {
  try {
    const all = ['1', 'true', 'yes'].includes(String(req.query.all || '').toLowerCase());
    const limit = Math.min(Number(req.query.limit || 10), 5000);
    const query = VerificationLog.find().sort({ timestamp: -1 });
    const logs = all ? await query : await query.limit(limit);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
}

async function submitReport(req, res, next) {
  try {
    const Report = require('../models/Report');
    const { medicine_name, description, result, latitude, longitude, batch_number } = req.body;
    const fallbackLat = 8 + Math.random() * 29;
    const fallbackLng = 68 + Math.random() * 29;

    const report = await Report.create({
      medicine_name: medicine_name || 'Unknown Medicine',
      description: description || 'Consumer marked this medicine as suspicious',
      result: result || 'suspicious',
      batch_number: batch_number || '',
      latitude: typeof latitude === 'number' ? latitude : parseFloat(latitude) || fallbackLat,
      longitude: typeof longitude === 'number' ? longitude : parseFloat(longitude) || fallbackLng,
      reporter_ip: req.ip || '',
    });
    res.status(201).json({ success: true, report });
  } catch (err) {
    next(err);
  }
}

async function getReports(req, res, next) {
  try {
    const Report = require('../models/Report');
    const reports = await Report.find().sort({ timestamp: -1 }).limit(200);
    res.json({ reports });
  } catch (err) {
    next(err);
  }
}

module.exports = { verifyImage, getVerification, getRecentVerifications, submitReport, getReports };
