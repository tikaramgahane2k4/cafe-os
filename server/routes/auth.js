const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Owner = require('../models/Owner');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const owner = await Owner.findOne({ email });
    if (!owner) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        cafeName: owner.cafeName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
