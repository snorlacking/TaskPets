const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { ensureAuth } = require('../middleware/authMiddleware');

// GET /api/pet - Get current user's pet data
router.get('/', ensureAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ pet: user.pet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// PUT /api/pet - Update current user's pet data
router.put('/', ensureAuth, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.pet = { ...user.pet, ...updates };
    await user.save();
    res.json({ pet: user.pet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
