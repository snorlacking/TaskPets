const express = require('express');
const router = express.Router();
const { genAI, getWorkingModel } = require('../config/gemini');

// API Endpoint: Rate Task Difficulty
router.post('/rate-difficulty', async (req, res) => {
    try {
        const { task } = req.body;
        
        if (!task) {
            return res.status(400).json({ error: 'Task description is required' });
        }
        
        const modelName = await getWorkingModel();
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = `Rate the difficulty of this task on a scale of 1-100, where 1 is very easy and 100 is extremely difficult.
Task: ${task}
Respond with only a number between 1 and 100.`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text().trim();
        
        // Extract number from response
        const numberMatch = text.match(/\d+/);
        let rating = 50; // Default
        
        if (numberMatch) {
            rating = parseInt(numberMatch[0]);
            // Clamp to 1-100 range
            rating = Math.max(1, Math.min(100, rating));
        }
        
        res.json({ rating });
    } catch (error) {
        console.error('Error rating difficulty:', error);
        console.error('Error details:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to rate task difficulty', details: error.message });
    }
});

module.exports = router;
