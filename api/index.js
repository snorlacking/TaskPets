const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const { connectDB } = require('../backend/config/db');
const mongoose = require('mongoose');

// Try to load connect-mongo for MongoDB session store (optional)
let MongoStore;
try {
    MongoStore = require('connect-mongo');
} catch (e) {
    // connect-mongo not installed, will use MemoryStore
    MongoStore = null;
}

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
// Session configuration for Vercel (serverless)
// Use MongoDB session store if MONGO_URI and connect-mongo are available (required for serverless)
// Otherwise fall back to MemoryStore (won't persist on serverless)
let sessionStore;
if (process.env.MONGO_URI && MongoStore) {
    // Use MongoDB session store for serverless (persists across invocations)
    // connect-mongo 5.x uses mongoUrl directly
    sessionStore = MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    });
} else {
    // Fallback to MemoryStore (won't work on serverless but OK for local dev)
    sessionStore = new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    });
}

const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'lax',
        secure: true, // Vercel uses HTTPS, so always secure
        httpOnly: true, // Prevent XSS attacks
        path: '/'
    }
    // Using default cookie name 'connect.sid' to match logout route
};

app.use(session(sessionConfig));

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
