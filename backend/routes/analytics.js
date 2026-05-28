const express = require('express');
const {
  getStats,
  getAnalytics,
  getVerificationList,
  getTrainingMetrics,
} = require('../controllers/analyticsController');

const router = express.Router();

router.get('/admin/stats', getStats);
router.get('/admin/analytics', getAnalytics);
router.get('/admin/verifications', getVerificationList);
router.get('/admin/training-metrics', getTrainingMetrics);

module.exports = router;
