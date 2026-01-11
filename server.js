const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./backend/config/db');
require('dotenv').config();

// Connect to database
connectDB();


const app = express();
const PORT = process.env.PORT || 3000;

// Check for API key
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.error('ERROR: GEMINI_API_KEY is not set in .env file!');
    console.error('Please set your Gemini API key in the .env file.');
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static('.'));

// Redirect root to home.html
app.get('/', (req, res) => {
    res.redirect('/home.html');
});

// Import route modules
const completenessRoutes = require('./backend/routes/completeness');
const difficultyRoutes = require('./backend/routes/difficulty');
const proofRoutes = require('./backend/routes/proof');
const subtasksRoutes = require('./backend/routes/subtasks');
const progressRoutes = require('./backend/routes/progress');
const importRoutes = require('./backend/routes/import');

const authRoutes = require('./backend/routes/auth');
const taskRoutes = require('./backend/routes/tasks');
const petRoutes = require('./backend/routes/pet');

// Register routes
app.use('/api', completenessRoutes);
app.use('/api', difficultyRoutes);
app.use('/api', proofRoutes);
app.use('/api', subtasksRoutes);
app.use('/api', progressRoutes);
app.use('/api', importRoutes);
// Auth endpoints
app.use('/api/auth', authRoutes);

app.use('/api/tasks', taskRoutes);
app.use('/api/pet', petRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Make sure to set GEMINI_API_KEY in your .env file');
});
