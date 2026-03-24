const express = require('express');
const router = express.Router();
const {
  getInvoices,
  createInvoice,
  updateInvoice,
  getBillingSummary,
  getTenantBillingDetails,
  seedInvoices,
} = require('../controllers/invoiceController');

router.get('/summary', getBillingSummary);
router.get('/tenant/:tenantId/details', getTenantBillingDetails);
router.post('/seed', seedInvoices);
router.get('/', getInvoices);
router.post('/', createInvoice);
router.patch('/:id', updateInvoice);

module.exports = router;
