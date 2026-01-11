const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Default pet data structure
function getDefaultPetData() {
    return {
        name: 'My Pet',
        health: 100,
        happiness: 100,
        hunger: 100,
        energy: 100,
        growthStage: 0,
        coins: 0,
        inventory: [],
        totalTasksCompleted: 0,
        itemsUsed: 0,
        lastStatUpdate: Date.now(),
        maxHealth: 100,
        maxHappiness: 100
    };
}

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        
        // Create new user with default pet data and empty tasks
        const user = new User({
            username,
            password, // Will be hashed by pre-save hook
            tasks: [],
            petData: getDefaultPetData(),
            totalCoinsGained: 0,
            totalTasksCompleted: 0
        });
        
        await user.save();
        
        // Create session
        req.session.user = {
            id: user._id.toString(),
            username: user.username
        };
        
        res.json({ 
            user: { 
                id: user._id.toString(), 
                username: user.username 
            } 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user', details: error.message });
    }
});

// Login with username/password
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Verify password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create session
        req.session.user = {
            id: user._id.toString(),
            username: user.username
        };
        
        res.json({ 
            user: { 
                id: user._id.toString(), 
                username: user.username 
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login', details: error.message });
    }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
    try {
        if (req.session && req.session.user) {
            const user = await User.findById(req.session.user.id).select('-password');
            if (user) {
                return res.json({ user: { id: user._id.toString(), username: user.username } });
            }
        }
        res.status(200).json({ user: null });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(200).json({ user: null });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.clearCookie('connect.sid');
        res.json({ ok: true });
    });
});

module.exports = router;
