const AppSettings = require('../models/AppSettings');

async function getSettings(req, res, next) {
  try {
    let settings = await AppSettings.findOne();
    if (!settings) settings = await AppSettings.create({});
    res.json({ settings });
  } catch (err) {
    res.json({
      settings: {
        profileName: 'Admin',
        email: 'admin@medguard.ai',
        emailAlerts: true,
        pushNotifications: true,
        darkMode: true,
      },
    });
  }
}

async function updateSettings(req, res, next) {
  try {
    const payload = {
      profileName: req.body.profileName,
      email: req.body.email,
      emailAlerts: Boolean(req.body.emailAlerts),
      pushNotifications: Boolean(req.body.pushNotifications),
      darkMode: Boolean(req.body.darkMode),
      alertThreshold: Number(req.body.alertThreshold) || 3,
    };

    const settings = await AppSettings.findOneAndUpdate({}, payload, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings };
