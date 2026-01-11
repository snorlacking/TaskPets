const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const router = express.Router();

// Configure Passport
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
    const newUser = {
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
    };

    try {
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        cb(null, user);
      } else {
        user = await User.create(newUser);
        cb(null, user);
      }
    } catch (err) {
      console.error(err);
      cb(err, null);
    }
  }
));

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, name: user.name, email: user.email });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

// Google Auth Routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login.html' }),
  function(req, res) {
    // Successful authentication, redirect to the game.
    req.session.user = req.user;
    res.redirect('/game.html');
  });


// Simple session-based auth scaffold (no password / Google yet)
// POST /api/auth/login  { username }
router.post('/login', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username is required' });

    // Minimal user object - in a real app, look up/create user in DB
    const user = { id: Date.now(), name: username };
    req.session.user = user;
    res.json({ user });
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
