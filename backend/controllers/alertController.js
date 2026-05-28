const { generateAlerts } = require('../services/alertService');

async function getAlerts(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit || 24), 200);
    const { alerts, summary } = await generateAlerts(limit);
    res.json({ alerts, summary });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAlerts };
