const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema(
  {
    profileName: { type: String, default: 'Admin' },
    email: { type: String, default: 'admin@medguard.ai' },
    emailAlerts: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: true },
    alertThreshold: { type: Number, default: 3 },
    autoBlocklist: { type: Boolean, default: false },
  },
  { collection: 'app_settings', timestamps: true }
);

module.exports =
  mongoose.models.AppSettings ||
  mongoose.model('AppSettings', appSettingsSchema);
