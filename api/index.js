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
    console.log('✓ connect-mongo loaded successfully');
} catch (e) {
    // connect-mongo not installed, will use MemoryStore
    console.warn('⚠ connect-mongo not found, using MemoryStore (sessions won\'t persist on serverless)');
    console.warn('⚠ Error:', e.message);
    MongoStore = null;
}

// Load environment variables (Vercel provides these automatically)
try {
    require('dotenv').config();
} catch (e) {
    // dotenv is optional in production
}

const app = express();

// Trust proxy - CRITICAL for Vercel (tells Express to trust X-Forwarded-* headers)
app.set('trust proxy', 1);

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
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        // Allow all origins in production (Vercel)
        callback(null, true);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie']
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
    console.log('✓ Using MongoDB session store (connect-mongo)');
    sessionStore = MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    });
} else {
    // Fallback to MemoryStore (won't work on serverless but OK for local dev)
    console.warn('⚠ Using MemoryStore - sessions will NOT persist on serverless functions!');
    console.warn('⚠ MONGO_URI available:', !!process.env.MONGO_URI);
    console.warn('⚠ MongoStore available:', !!MongoStore);
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
        secure: process.env.NODE_ENV === 'production', // true on Vercel, false on localhost
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for production (cross-origin safe)
        httpOnly: true, // Prevent XSS attacks
        path: '/'
    }
    // Using default cookie name 'connect.sid' to match logout route
};

app.use(session(sessionConfig));

// Import route modules
let completenessRoutes, difficultyRoutes, subtasksRoutes, progressRoutes, importRoutes, authRoutes, userDataRoutes, goalsRoutes;

try {
    completenessRoutes = require('../backend/routes/completeness');
    difficultyRoutes = require('../backend/routes/difficulty');
    subtasksRoutes = require('../backend/routes/subtasks');
    progressRoutes = require('../backend/routes/progress');
    importRoutes = require('../backend/routes/import');
    authRoutes = require('../backend/routes/auth');
    userDataRoutes = require('../backend/routes/userData');
    goalsRoutes = require('../backend/routes/goals');
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
app.use('/api/goals', goalsRoutes);

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
