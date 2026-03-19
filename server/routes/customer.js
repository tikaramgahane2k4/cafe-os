const express = require('express');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all customers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const customers = await Customer.find({ ownerId: req.ownerId });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch customers', error: error.message });
  }
});

// Get customer details with orders
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, ownerId: req.ownerId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const orders = await Order.find({ customerId: req.params.id, ownerId: req.ownerId }).sort({ createdAt: -1 });
    res.json({ ...customer.toObject(), orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch customer details', error: error.message });
  }
});

// Add new customer
router.post('/', authMiddleware, async (req, res) => {
  try {
    const customer = new Customer({
      ...req.body,
      ownerId: req.ownerId
    });
    await customer.save();
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add customer', error: error.message });
  }
});

// Add order for customer
router.post('/:id/orders', authMiddleware, async (req, res) => {
  try {
    const order = new Order({
      customerId: req.params.id,
      items: req.body.items,
      total: req.body.total,
      ownerId: req.ownerId
    });
    await order.save();

    // Update customer loyalty points and visit history
    await Customer.findByIdAndUpdate(req.params.id, {
      $inc: { loyaltyPoints: Math.floor(req.body.total / 10) },
      $push: { visitHistory: { date: new Date(), orderTotal: req.body.total } }
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
});

module.exports = router;
