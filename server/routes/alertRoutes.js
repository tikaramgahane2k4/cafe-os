const express = require('express');
const router = express.Router();
const { getAlerts, updateAlertStatus } = require('../controllers/alertController');

router.get('/', getAlerts);
router.patch('/:id/status', updateAlertStatus);

module.exports = router;
