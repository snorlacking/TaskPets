const express = require('express');
const router = express.Router();


const fs = require('fs');
const path = require('path');
const USERS_FILE = path.join(__dirname, '../data/users.json');

function readUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    } catch {
        return [];
    }
}
function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}


// Register new user (local file)
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    let users = readUsers();
    if (users.find(u => u.username === username)) {
        return res.status(409).json({ error: 'Username already exists' });
    }
    const user = { id: Date.now(), username, password };
    users.push(user);
    writeUsers(users);
    res.json({ ok: true });
});


// Login with username/password (local file)
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const users = readUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    req.session.user = { id: user.id, name: user.username };
    res.json({ user: { id: user.id, name: user.username } });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
    if (req.session && req.session.user) return res.json({ user: req.session.user });
    res.status(200).json({ user: null });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Failed to logout' });
        res.clearCookie('connect.sid');
        res.json({ ok: true });
    });
});

module.exports = router;
