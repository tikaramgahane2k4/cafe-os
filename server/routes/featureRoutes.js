const express = require('express');
const router = express.Router();
const { getAllFeatures, updateFeature, resolveForTenant } = require('../controllers/featureController');

router.get('/resolve', resolveForTenant);   // must be before /:id
router.get('/', getAllFeatures);
router.patch('/:id', updateFeature);

module.exports = router;
