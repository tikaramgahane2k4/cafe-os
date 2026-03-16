const express = require('express');
const router = express.Router();
const { getAnalytics, getTenantUsage } = require('../controllers/analyticsController');

router.get('/tenant-usage', getTenantUsage);
router.get('/', getAnalytics);

module.exports = router;
