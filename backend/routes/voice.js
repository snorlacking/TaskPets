const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@deepgram/sdk');
const { genAI, getWorkingModel } = require('../config/gemini');

// Configure multer for memory storage (for audio files)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware to check authentication
function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

// POST /api/voice/transcribe - Transcribe audio using Deepgram
router.post('/transcribe', requireAuth, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
        if (!deepgramApiKey) {
            return res.status(500).json({ error: 'Deepgram API key not configured' });
        }

        const deepgram = createClient(deepgramApiKey);

        // Transcribe audio using Deepgram SDK
        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
            req.file.buffer,
            {
                model: 'nova-2',
                language: 'en',
                smart_format: true,
            }
        );

        if (error) {
            console.error('Deepgram error:', error);
            return res.status(500).json({ error: 'Failed to transcribe audio', details: error.message });
        }

        const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
        
        if (!transcript.trim()) {
            return res.status(400).json({ error: 'No speech detected in audio' });
        }

        res.json({ transcript: transcript.trim() });
    } catch (error) {
        console.error('Error transcribing audio:', error);
        res.status(500).json({ error: 'Failed to transcribe audio', details: error.message });
    }
});

// POST /api/voice/create-task - Process transcript with Gemini and create task
router.post('/create-task', requireAuth, async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript || !transcript.trim()) {
            return res.status(400).json({ error: 'Transcript is required' });
        }

        const modelName = await getWorkingModel();
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `You are processing a voice input to create a task. Extract and format the task information.

User's voice input: "${transcript}"

Analyze the input and determine:
1. A short, concise task title (max 10-15 words)
2. A detailed description for the task (2-3 sentences explaining what needs to be done)
3. Whether this is a goal (recurring task) or a regular task. Look for keywords like "goal", "daily", "habit", "every day", "regularly", etc.
4. A difficulty rating (1-100)
5. If a date is mentioned, extract it and format as YYYY-MM-DD. If no date is mentioned, set to null.

Respond with JSON only:
{
  "title": "Short task title",
  "description": "Detailed description of the task",
  "isGoal": true/false,
  "difficulty": 50,
  "dueDate": "YYYY-MM-DD" or null
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Extract JSON from response
        let taskData;
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                taskData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('Error parsing Gemini response:', parseError);
            // Fallback: create a basic task structure
            taskData = {
                title: transcript.trim().substring(0, 100),
                description: transcript.trim(),
                isGoal: false,
                difficulty: 50
            };
        }

        // Validate and set defaults
        taskData.title = taskData.title || transcript.trim().substring(0, 100);
        taskData.description = taskData.description || transcript.trim();
        taskData.isGoal = taskData.isGoal || false;
        taskData.difficulty = Math.max(1, Math.min(100, parseInt(taskData.difficulty) || 50));
        taskData.dueDate = taskData.dueDate || null;
        taskData.isGoalUnclear = taskData.isGoalUnclear || false; // Flag if unclear

        res.json(taskData);
    } catch (error) {
        console.error('Error creating task from voice:', error);
        res.status(500).json({ error: 'Failed to create task from voice input', details: error.message });
    }
});

module.exports = router;
