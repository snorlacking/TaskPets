const express = require('express');
const router = express.Router();
const { genAI, getWorkingModel } = require('../config/gemini');

// API Endpoint: Check Task Completeness
router.post('/check-completeness', async (req, res) => {
    try {
        const { task } = req.body;
        
        if (!task) {
            return res.status(400).json({ error: 'Task description is required' });
        }
        
        const modelName = await getWorkingModel();
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = `Check if this task description needs additional information. Set a very low bar - only flag tasks that are extremely vague or meaningless (like "do stuff", "things", etc.). Reasonable tasks like "Math Homework", "Call dentist", "Finish project" should pass without requiring more info.

Task: ${task}

Respond with JSON only:
{
  "needsMoreInfo": true/false,
  "message": "optional suggestion for what additional info would help (only if needsMoreInfo is true)"
}`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();
        
        // Try to extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            text = jsonMatch[0];
        }
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            // If JSON parse fails, try to infer from text
            const needsMoreInfo = text.toLowerCase().includes('true') || text.toLowerCase().includes('needs');
            data = {
                needsMoreInfo: needsMoreInfo,
                message: needsMoreInfo ? 'Could you provide more details about this task?' : null
            };
        }
        
        res.json(data);
    } catch (error) {
        console.error('Error checking completeness:', error);
        console.error('Error details:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to check task completeness', details: error.message });
    }
});

module.exports = router;
