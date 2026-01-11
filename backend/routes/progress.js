const express = require('express');
const router = express.Router();
const { genAI, getWorkingModel } = require('../config/gemini');

// API Endpoint: Assess Progress
router.post('/assess-progress', async (req, res) => {
    try {
        const { task, currentSubtasks, progressDescription } = req.body;
        
        if (!task) {
            return res.status(400).json({ error: 'Task description is required' });
        }
        
        const modelName = await getWorkingModel();
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const subtasksList = currentSubtasks ? currentSubtasks.map((st, i) => 
            `${i + 1}. ${st.text}`
        ).join('\n') : 'No subtasks yet.';
        
        const prompt = `Assess the progress on this task based on the user's description and current subtasks. Do not worry about which subtasks are already marked as complete - assess based solely on the user's progress description.

Task: ${task}
Current Subtasks:
${subtasksList}

User's Progress Description: ${progressDescription || 'No description provided'}

Based on the user's description, determine:
1. What percentage of the task is complete (0-100)?
2. Which subtasks should be marked as completed based on the user's description?
3. Are there any new subtasks that should be added or existing ones that should be modified?

Respond with JSON only:
{
  "progress": 75,
  "updatedSubtasks": [
    { "id": "id1", "text": "Updated subtask text", "completed": true },
    { "id": "id2", "text": "Another subtask", "completed": false }
  ],
  "explanation": "Brief explanation of the progress assessment"
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
            // Validate progress is 0-100
            data.progress = Math.max(0, Math.min(100, parseInt(data.progress) || 0));
            // Ensure updatedSubtasks is an array
            if (!Array.isArray(data.updatedSubtasks)) {
                data.updatedSubtasks = currentSubtasks || [];
            }
            // Ensure each subtask has required fields
            data.updatedSubtasks = data.updatedSubtasks.map((st, index) => ({
                id: st.id || `subtask_${Date.now()}_${index}`,
                text: st.text || '',
                completed: st.completed || false
            })).filter(st => st.text.trim() !== '');
        } catch (parseError) {
            console.error('Error parsing progress assessment:', parseError);
            // Return default response
            const completedCount = currentSubtasks ? currentSubtasks.filter(st => st.completed).length : 0;
            const totalCount = currentSubtasks ? currentSubtasks.length : 1;
            data = {
                progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
                updatedSubtasks: currentSubtasks || [],
                explanation: 'Progress assessed based on subtask completion.'
            };
        }
        
        res.json(data);
    } catch (error) {
        console.error('Error assessing progress:', error);
        console.error('Error details:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to assess progress', details: error.message });
    }
});

module.exports = router;
