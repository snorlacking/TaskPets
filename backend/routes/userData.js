const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to check authentication
function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

// GET /api/user/data - Fetch user's tasks and petData
router.get('/data', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Calculate hunger/energy decay based on lastLogin
        let petData = user.petData || {};
        if (user.lastLogin && petData.hunger !== undefined && petData.energy !== undefined) {
            const now = Date.now();
            const lastLoginTime = new Date(user.lastLogin).getTime();
            const hoursPassed = (now - lastLoginTime) / (1000 * 60 * 60);
            
            if (hoursPassed > 0) {
                // Decay rate: 15 points per hour for hunger, 10 points per hour for energy
                const decayRate = (petData.decayMultiplier || 1);
                const hungerDecay = decayRate * 15 * hoursPassed;
                const energyDecay = decayRate * 10 * hoursPassed;
                
                petData.hunger = Math.max(0, (petData.hunger || 100) - hungerDecay);
                petData.energy = Math.max(0, (petData.energy || 100) - energyDecay);
                
                // Update lastStatUpdate to now
                petData.lastStatUpdate = now;
                
                // Save updated petData to database
                user.petData = petData;
                user.lastLogin = new Date(); // Update lastLogin to now
                await user.save();
            }
        }
        
        res.json({
            tasks: user.tasks || [],
            petData: petData
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Failed to fetch user data', details: error.message });
    }
});

// POST /api/user/data - Save user's tasks and petData
router.post('/data', requireAuth, async (req, res) => {
    try {
        const { tasks, petData } = req.body;
        
        const user = await User.findById(req.session.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update tasks and petData
        if (tasks !== undefined) {
            user.tasks = tasks;
        }
        if (petData !== undefined) {
            user.petData = petData;
        }
        
        // Update totalCoinsGained from petData.coins
        if (petData && petData.coins !== undefined) {
            user.totalCoinsGained = petData.coins;
        }
        
        // Update totalTasksCompleted from tasks
        if (tasks) {
            const completedCount = tasks.filter(t => t.completed).length;
            user.totalTasksCompleted = completedCount;
        }
        
        await user.save();
        
        res.json({ 
            success: true,
            totalCoinsGained: user.totalCoinsGained,
            totalTasksCompleted: user.totalTasksCompleted
        });
    } catch (error) {
        console.error('Error saving user data:', error);
        res.status(500).json({ error: 'Failed to save user data', details: error.message });
    }
});

// GET /api/user/profile - Fetch user profile stats
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).select('username totalCoinsGained totalTasksCompleted petData');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            username: user.username,
            totalCoinsGained: user.totalCoinsGained || 0,
            totalTasksCompleted: user.totalTasksCompleted || 0,
            petData: user.petData || {}
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile', details: error.message });
    }
});

module.exports = router;
