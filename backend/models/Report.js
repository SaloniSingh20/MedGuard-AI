const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    medicine_name: { type: String, required: true, index: true },
    description: { type: String, default: 'Potential counterfeit reported' },
    result: { type: String, default: 'suspicious' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    reporter_ip: { type: String, default: '' },
    batch_number: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { collection: 'reports', timestamps: true }
);

module.exports =
  mongoose.models.Report || mongoose.model('Report', reportSchema);
