const mongoose = require('mongoose');

async function connectDB() {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        throw new Error('MONGO_URI not set in environment variables');
    }
    
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected:', mongoose.connection.host || MONGO_URI);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

module.exports = { connectDB };
