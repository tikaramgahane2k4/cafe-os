const express = require('express');
const router = express.Router();
const {
  getAllFeatures,
  getFeatureImpact,
  previewFeatureUpdate,
  resolveForTenant,
  searchTenantsForFeature,
  updateFeature,
} = require('../controllers/featureController');

router.get('/resolve', resolveForTenant);   // must be before /:id
router.get('/tenants/search', searchTenantsForFeature);
router.get('/', getAllFeatures);
router.get('/:id/impact', getFeatureImpact);
router.post('/:id/preview', previewFeatureUpdate);
router.patch('/:id', updateFeature);

module.exports = router;
