const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/authMiddleware');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get all tasks for a user
// @route   GET /api/tasks
router.get('/', ensureAuth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @desc    Create a new task
// @route   POST /api/tasks
router.post('/', ensureAuth, async (req, res) => {
  try {
    const { description, dueDate } = req.body;
    const newTask = await Task.create({
      user: req.user.id,
      description,
      dueDate,
    });
    res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
router.put('/:id', ensureAuth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not Authorized' });
    }

    // Update task completion and user stats
    if (req.body.isCompleted && !task.isCompleted) {
        await User.findByIdAndUpdate(req.user.id, { $inc: { totalTasksCompleted: 1 } });
    } else if (!req.body.isCompleted && task.isCompleted) {
        await User.findByIdAndUpdate(req.user.id, { $inc: { totalTasksCompleted: -1 } });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not Authorized' });
    }

    await task.remove();
    res.json({ message: 'Task removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
