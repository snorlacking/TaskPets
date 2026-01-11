const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const { connectDB } = require('../backend/config/db');

// Load environment variables (Vercel provides these automatically)
try {
    require('dotenv').config();
} catch (e) {
    // dotenv is optional in production
}

const app = express();

// Connect to MongoDB (non-blocking for serverless)
if (process.env.MONGO_URI) {
    connectDB().catch(err => {
        console.error('Failed to connect to MongoDB:', err);
        // Don't exit in serverless - allow function to continue
    });
}

// Check for API key (warn but don't exit in serverless)
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
let completenessRoutes, difficultyRoutes, subtasksRoutes, progressRoutes, importRoutes, authRoutes, userDataRoutes;

try {
    completenessRoutes = require('../backend/routes/completeness');
    difficultyRoutes = require('../backend/routes/difficulty');
    subtasksRoutes = require('../backend/routes/subtasks');
    progressRoutes = require('../backend/routes/progress');
    importRoutes = require('../backend/routes/import');
    authRoutes = require('../backend/routes/auth');
    userDataRoutes = require('../backend/routes/userData');
} catch (error) {
    console.error('Error loading routes:', error);
    throw error;
}

// Register API routes with /api prefix (matching server.js structure)
app.use('/api', completenessRoutes);
app.use('/api', difficultyRoutes);
app.use('/api', subtasksRoutes);
app.use('/api', progressRoutes);
app.use('/api', importRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userDataRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve static files from public directory (after API routes)
app.use(express.static(path.join(__dirname, '../public')));

// Redirect root to home.html (after static files)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'home.html'));
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Export the Express app as a serverless function
module.exports = app;
