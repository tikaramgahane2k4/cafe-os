const express = require('express');
const router = express.Router();
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { Order, Customer, MenuItem, Staff, InventoryItem, Review } = require('../models/TenantEntities');

const ENTITY_MAP = {
  orders: Order,
  customers: Customer,
  menu: MenuItem,
  staff: Staff,
  inventory: InventoryItem,
  reviews: Review,
};

router.use(tenantMiddleware);

router.get('/:entity', async (req, res) => {
  try {
    const Model = ENTITY_MAP[req.params.entity];
    if (!Model) return res.status(404).json({ success: false, message: 'Entity not found' });
    const data = await Model.find({ tenantId: req.tenantId }).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, tenantId: req.tenantId, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:entity', async (req, res) => {
  try {
    const Model = ENTITY_MAP[req.params.entity];
    if (!Model) return res.status(404).json({ success: false, message: 'Entity not found' });
    const doc = await Model.create({ ...req.body, tenantId: req.tenantId });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
