const VerificationLog = require('../models/Verification');
const Report = require('../models/Report');

const COUNTERFEIT_SPIKE_THRESHOLD = parseInt(process.env.ALERT_COUNTERFEIT_THRESHOLD || '3', 10);
const SUSPICIOUS_BATCH_THRESHOLD = parseInt(process.env.ALERT_SUSPICIOUS_THRESHOLD || '2', 10);
const CHECK_WINDOW_HOURS = parseInt(process.env.ALERT_WINDOW_HOURS || '24', 10);

async function generateAlerts(limit = 24) {
  const windowStart = new Date(Date.now() - CHECK_WINDOW_HOURS * 60 * 60 * 1000);

  const [reports, flaggedVerifications] = await Promise.all([
    Report.find().sort({ timestamp: -1 }).limit(limit),
    VerificationLog.find({ status: { $in: ['suspicious', 'counterfeit'] } })
      .sort({ timestamp: -1 })
      .limit(limit),
  ]);

  const reportAlerts = reports.map((item) => ({
    id: `report-${item._id}`,
    type: 'report',
    severity: 'medium',
    title: `Community report: ${item.medicine_name}`,
    description: item.description || 'Consumer reported safety concern.',
    medicine_name: item.medicine_name,
    result: item.result || 'suspicious',
    batch_number: item.batch_number || '',
    timestamp: item.timestamp,
  }));

  const verificationAlerts = flaggedVerifications.map((item) => ({
    id: `verification-${item._id}`,
    type: 'verification',
    severity: item.status === 'counterfeit' ? 'high' : 'medium',
    title: `${capitalize(item.status)} verification detected`,
    description: `${item.medicine_name} was flagged as ${item.status} (${item.authenticity_score}% confidence).`,
    medicine_name: item.medicine_name,
    result: item.status,
    batch_number: item.batch_number,
    timestamp: item.timestamp,
  }));

  const batchAlerts = await detectSuspiciousBatchPatterns();

  const all = [...verificationAlerts, ...reportAlerts, ...batchAlerts].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const summary = buildSummary(all, flaggedVerifications, reports);
  return { alerts: all.slice(0, limit), summary };
}

async function detectSuspiciousBatchPatterns() {
  try {
    const pipeline = [
      { $match: { status: { $in: ['suspicious', 'counterfeit'] } } },
      { $group: { _id: '$batch_number', count: { $sum: 1 }, statuses: { $push: '$status' }, medicine_name: { $first: '$medicine_name' }, timestamp: { $max: '$timestamp' } } },
      { $match: { count: { $gte: SUSPICIOUS_BATCH_THRESHOLD } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ];
    const patterns = await VerificationLog.aggregate(pipeline);

    return patterns.map((p) => ({
      id: `batch-pattern-${p._id}`,
      type: 'batch_pattern',
      severity: p.count >= COUNTERFEIT_SPIKE_THRESHOLD ? 'critical' : 'high',
      title: `Repeated suspicious batch: ${p._id}`,
      description: `Batch ${p._id} (${p.medicine_name}) has been flagged ${p.count} times.`,
      medicine_name: p.medicine_name,
      result: 'counterfeit',
      batch_number: p._id,
      timestamp: p.timestamp,
    }));
  } catch {
    return [];
  }
}

function buildSummary(all, flagged, reports) {
  return {
    total: all.length,
    critical: all.filter((a) => a.severity === 'critical').length,
    high: all.filter((a) => a.severity === 'high').length,
    medium: all.filter((a) => a.severity === 'medium').length,
    totalReports: reports.length,
    suspiciousVerifications: flagged.filter((v) => v.status === 'suspicious').length,
    counterfeitVerifications: flagged.filter((v) => v.status === 'counterfeit').length,
    recentWindow: CHECK_WINDOW_HOURS,
  };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { generateAlerts };
