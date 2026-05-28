const express = require('express');
const { getAlerts } = require('../controllers/alertController');

const router = express.Router();

router.get('/alerts', getAlerts);

module.exports = router;
