const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  totalTasksCompleted: {
    type: Number,
    default: 0,
  },
  totalCoinsEarned: {
    type: Number,
    default: 0,
  },
  totalHoursSpent: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Pet data fields
  pet: {
    name: { type: String, default: "Pet" },
    health: { type: Number, default: 100 },
    happiness: { type: Number, default: 100 },
    hunger: { type: Number, default: 100 },
    energy: { type: Number, default: 100 },
    growthStage: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    inventory: { type: [String], default: [] },
    itemsUsed: { type: Number, default: 0 },
    lastStatUpdate: { type: Number, default: Date.now },
    maxHealth: { type: Number, default: 100 },
    maxHappiness: { type: Number, default: 100 },
  },
});

module.exports = mongoose.model('User', UserSchema);
