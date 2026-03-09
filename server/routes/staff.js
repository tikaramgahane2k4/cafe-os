const express = require('express');
const Staff = require('../models/Staff');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all staff
router.get('/', authMiddleware, async (req, res) => {
  try {
    const staff = await Staff.find({ ownerId: req.ownerId });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add staff member
router.post('/', authMiddleware, async (req, res) => {
  try {
    const staff = new Staff({
      ...req.body,
      ownerId: req.ownerId
    });
    await staff.save();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update staff member
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.ownerId },
      req.body,
      { new: true }
    );
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete staff member
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Staff.findOneAndDelete({ _id: req.params.id, ownerId: req.ownerId });
    res.json({ message: 'Staff deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
