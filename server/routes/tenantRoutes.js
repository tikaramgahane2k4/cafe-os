const express = require('express');
const router = express.Router();
const {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  updateTenantStatus,
  trackActivity,
  deleteTenant,
} = require('../controllers/tenantController');

router.get('/', getAllTenants);
router.get('/:id', getTenantById);
router.post('/', createTenant);
router.patch('/:id', updateTenant);
router.patch('/:id/status', updateTenantStatus);
router.patch('/:id/activity', trackActivity);
router.delete('/:id', deleteTenant);

module.exports = router;
