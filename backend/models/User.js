const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    tasks: [{
        id: Number,
        description: String,
        taskDescription: String,
        difficulty: Number,
        completed: Boolean,
        createdAt: Number,
        progress: Number,
        subtasks: Array,
        dueDate: String,
        minimized: Boolean,
        timer: {
            isRunning: Boolean,
            startTime: Number,
            elapsedTime: Number,
            lastPausedAt: Number
        }
    }],
    petData: {
        name: String,
        health: Number,
        happiness: Number,
        hunger: Number,
        energy: Number,
        growthStage: Number,
        coins: Number,
        inventory: Array,
        totalTasksCompleted: Number,
        itemsUsed: Number,
        lastStatUpdate: Number,
        maxHealth: Number,
        maxHappiness: Number,
        activeItems: Array,
        totalTimeSpent: Number
    },
    totalCoinsGained: {
        type: Number,
        default: 0
    },
    totalTasksCompleted: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
