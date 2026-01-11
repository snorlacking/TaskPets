const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
require('dotenv').config();

const app = express();

// Check for API key (warn but don't exit in serverless - allow Vercel to show error)
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('WARNING: GEMINI_API_KEY is not set! API calls will fail.');
}

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Import route modules
const completenessRoutes = require('../backend/routes/completeness');
const difficultyRoutes = require('../backend/routes/difficulty');
const subtasksRoutes = require('../backend/routes/subtasks');
const progressRoutes = require('../backend/routes/progress');
const importRoutes = require('../backend/routes/import');
const authRoutes = require('../backend/routes/auth');

// Register routes
app.use('/api', completenessRoutes);
app.use('/api', difficultyRoutes);
app.use('/api', subtasksRoutes);
app.use('/api', progressRoutes);
app.use('/api', importRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Export the Express app as a serverless function
module.exports = app;
