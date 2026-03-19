const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Owner = require('../models/Owner');
const User = require('../models/User');

const router = express.Router();

// Signup (Owner)
router.post('/signup', async (req, res) => {
  try {
    const { name, ownerName, email, password, cafeName, phone } = req.body;
    const resolvedName = name || ownerName;

    if (!resolvedName || !email || !password || !cafeName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await Owner.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const owner = await Owner.create({
      name: resolvedName,
      email,
      password: hashed,
      cafeName,
      phone: phone || '',
    });

    const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        cafeName: owner.cafeName,
        role: 'owner',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const owner = await Owner.findOne({ email });
    if (!owner) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      const ok = await user.matchPassword(password);
      if (!ok) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || 'owner',
          cafeId: user.cafeId || null,
        }
      });
    }

    let isMatch = await bcrypt.compare(password, owner.password);
    // Legacy fallback: some records may have stored plain-text passwords
    if (!isMatch && owner.password === password) {
      isMatch = true;
      owner.password = await bcrypt.hash(password, 10);
      await owner.save();
    }
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        cafeName: owner.cafeName,
        role: 'owner',
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
