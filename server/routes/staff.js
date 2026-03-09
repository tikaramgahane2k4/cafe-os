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
    res.status(500).json({ message: 'Failed to fetch staff', error: error.message });
  }
});

// Add staff member
router.post('/', authMiddleware, async (req, res) => {
  try {
    const staffData = { ...req.body };
    delete staffData._id; // Ensure we don't pass an empty or existing _id
    const staff = new Staff({
      ...staffData,
      ownerId: req.ownerId
    });
    await staff.save();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add staff member', error: error.message });
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
    res.status(500).json({ message: 'Failed to delete staff member', error: error.message });
  }
});

module.exports = router;
