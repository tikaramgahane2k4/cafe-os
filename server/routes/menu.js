const express = require('express');
const MenuItem = require('../models/MenuItem');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all menu items
router.get('/', authMiddleware, async (req, res) => {
  try {
    const items = await MenuItem.find({ ownerId: req.ownerId });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add menu item
router.post('/', authMiddleware, async (req, res) => {
  try {
    const item = new MenuItem({
      ...req.body,
      ownerId: req.ownerId
    });
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update menu item
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.ownerId },
      req.body,
      { new: true }
    );
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete menu item
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await MenuItem.findOneAndDelete({ _id: req.params.id, ownerId: req.ownerId });
    res.json({ message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update stock status
router.patch('/:id/stock', authMiddleware, async (req, res) => {
  try {
    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.ownerId },
      { inStock: req.body.inStock },
      { new: true }
    );
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
