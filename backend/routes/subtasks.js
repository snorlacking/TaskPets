const express = require('express');
const router = express.Router();
const { genAI, getWorkingModel } = require('../config/gemini');

// API Endpoint: Generate Subtasks
router.post('/generate-subtasks', async (req, res) => {
    try {
        const { task, description } = req.body;
        
        if (!task) {
            return res.status(400).json({ error: 'Task description is required' });
        }
        
        const modelName = await getWorkingModel();
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const fullTaskContext = description ? `${task}\n\nAdditional context: ${description}` : task;
        
        const prompt = `Break down this task into general, high-level subtasks. Keep subtasks broad and general, not overly specific or detailed.

Task: ${fullTaskContext}

Guidelines:
- Create 2-4 general, high-level subtasks
- Keep them broad and general, not detailed or specific
- Focus on major phases or steps, not micro-tasks
- Avoid breaking tasks into too many small pieces

Respond with JSON array of subtasks only:
[
  { "id": "unique_id_1", "text": "General subtask", "completed": false },
  { "id": "unique_id_2", "text": "General subtask", "completed": false }
]

Keep subtasks general and high-level.`;
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();
        
        // Try to extract JSON array from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            text = jsonMatch[0];
        }
        
        let subtasks;
        try {
            subtasks = JSON.parse(text);
            // Validate and ensure each subtask has required fields
            subtasks = subtasks.map((st, index) => ({
                id: st.id || `subtask_${Date.now()}_${index}`,
                text: st.text || '',
                completed: st.completed || false
            })).filter(st => st.text.trim() !== '');
        } catch (parseError) {
            console.error('Error parsing subtasks:', parseError);
            // Return default subtasks if parsing fails
            subtasks = [
                { id: `subtask_${Date.now()}_1`, text: 'Start working on the task', completed: false },
                { id: `subtask_${Date.now()}_2`, text: 'Complete the task', completed: false }
            ];
        }
        
        res.json({ subtasks });
    } catch (error) {
        console.error('Error generating subtasks:', error);
        console.error('Error details:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to generate subtasks', details: error.message });
    }
});

module.exports = router;
