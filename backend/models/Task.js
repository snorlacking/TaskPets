const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  taskDescription: {
    type: String,
    default: '',
  },
  difficulty: {
    type: Number,
    default: 50,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    default: null,
  },
  progress: {
    type: Number,
    default: 0,
  },
  subtasks: [
    {
      id: { type: String },
      text: { type: String },
      completed: { type: Boolean, default: false },
    }
  ],
  minimized: {
    type: Boolean,
    default: false,
  },
  timer: {
    isRunning: { type: Boolean, default: false },
    startTime: { type: Number, default: null },
    elapsedTime: { type: Number, default: 0 },
    lastPausedAt: { type: Number, default: null },
  },
});

module.exports = mongoose.model('Task', TaskSchema);
