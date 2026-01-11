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
        console.log('Registration attempt started');
        const { username, password } = req.body;
        
        if (!username || !password) {
            console.log('Registration failed: missing username or password');
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        console.log('Checking if user exists:', username);
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('Registration failed: username already exists');
            return res.status(409).json({ error: 'Username already exists' });
        }
        
        console.log('Creating new user');
        // Create new user with default pet data and empty tasks
        const user = new User({
            username,
            password, // Will be hashed by pre-save hook
            tasks: [],
            petData: getDefaultPetData(),
            totalCoinsGained: 0,
            totalTasksCompleted: 0
        });
        
        console.log('Saving user to database');
        await user.save();
        console.log('User saved successfully, ID:', user._id.toString());
        
        // Create session
        console.log('Creating session, req.session exists:', !!req.session);
        req.session.user = {
            id: user._id.toString(),
            username: user.username
        };
        console.log('Session created, user in session:', req.session.user);
        
        // Save session
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) {
                    console.error('Error saving session:', err);
                    reject(err);
                } else {
                    console.log('Session saved successfully');
                    resolve();
                }
            });
        });
        
        console.log('Registration successful, sending response');
        res.json({ 
            user: { 
                id: user._id.toString(), 
                username: user.username 
            } 
        });
    } catch (error) {
        console.error('Registration error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        res.status(500).json({ error: 'Failed to register user', details: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
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
        
        // Explicitly save session before sending response (critical for serverless)
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) {
                    console.error('Error saving session during login:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        
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
        console.log('GET /auth/me - checking session');
        console.log('req.session exists:', !!req.session);
        console.log('req.session.user:', req.session?.user);
        console.log('req.headers.cookie:', req.headers.cookie);
        
        if (req.session && req.session.user) {
            console.log('Session found, looking up user:', req.session.user.id);
            const user = await User.findById(req.session.user.id).select('-password');
            if (user) {
                console.log('User found:', user.username);
                return res.json({ user: { id: user._id.toString(), username: user.username } });
            } else {
                console.log('User not found in database');
            }
        } else {
            console.log('No session or no user in session');
        }
        console.log('Returning user: null');
        res.status(200).json({ user: null });
    } catch (error) {
        console.error('Get user error:', error);
        console.error('Error stack:', error.stack);
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
