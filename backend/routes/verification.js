const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateObjectId, validateImageUpload } = require('../middleware/validate');
const {
  verifyImage,
  getVerification,
  getRecentVerifications,
  submitReport,
  getReports,
} = require('../controllers/verificationController');

const router = express.Router();

const upload = multer({
  dest: path.resolve(__dirname, '..', 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/verify-image', uploadLimiter, upload.single('file'), validateImageUpload, verifyImage);
router.get('/verifications/recent', getRecentVerifications);
router.get('/verifications/:id', validateObjectId('id'), getVerification);
router.post('/reports', submitReport);
router.get('/reports', getReports);
router.post('/verify-qr', (req, res) => res.json({ verification_result: 'Valid' }));

module.exports = router;
