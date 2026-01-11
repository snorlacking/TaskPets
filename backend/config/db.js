const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI;

async function connectDB() {
	if (!MONGO_URI) throw new Error('MONGO_URI not set in .env');
		await mongoose.connect(MONGO_URI);
	console.log('MongoDB Connected:', mongoose.connection.host || MONGO_URI);
}

module.exports = { connectDB };
