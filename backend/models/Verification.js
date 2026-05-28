const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema(
  {
    medicine_name: { type: String, default: 'Unknown Medicine', index: true },
    batch_number: { type: String, default: 'BATCH-UNKNOWN', index: true },
    image_name: { type: String, default: '' },
    extracted_text: { type: String, default: '' },
    result: { type: String, required: true },
    status: {
      type: String,
      enum: ['authentic', 'suspicious', 'counterfeit'],
      required: true,
      index: true,
    },
    authenticity_score: { type: Number, min: 0, max: 100, required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    ai_result: { type: mongoose.Schema.Types.Mixed, default: {} },
    anomalies: [{ type: String }],
    risk_flags: [{ type: String }],
    manufacturer: { type: String, default: '' },
    expiry_date: { type: String, default: '' },
    dosage: { type: String, default: '' },
    composition: { type: String, default: '' },
    blockchain_tx: { type: String, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { collection: 'verification_logs', timestamps: true }
);

verificationSchema.index({ status: 1, timestamp: -1 });
verificationSchema.index({ batch_number: 1, status: 1 });

module.exports =
  mongoose.models.VerificationLog ||
  mongoose.model('VerificationLog', verificationSchema);
