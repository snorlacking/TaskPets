const express = require('express');
const router = express.Router();
const multer = require('multer');
const { genAI, getWorkingModel } = require('../config/gemini');

// Configure multer for memory storage
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

// POST /api/goals/validate-proof - Validate goal completion proof
router.post('/validate-proof', requireAuth, upload.single('proof'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No proof file provided' });
        }

        const { taskDescription } = req.body;
        
        if (!taskDescription) {
            return res.status(400).json({ error: 'Task description is required' });
        }

        // Convert file to base64
        const base64Data = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        const dataUri = `data:${mimeType};base64,${base64Data}`;

        // Use Gemini to validate the proof (use vision model)
        const modelName = await getWorkingModel(true); // true for image support
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `You are validating proof of completion for a goal. The user claims they completed: "${taskDescription}"

Please analyze the provided proof (image or video) and determine if it clearly demonstrates completion of this goal.

Consider:
1. Does the proof visually show the goal being completed?
2. Is the proof clear and unambiguous?
3. Does it match what would be expected for this type of goal?

Respond with ONLY a JSON object in this format:
{
    "valid": true/false,
    "message": "brief explanation"
}

If valid is true, the goal is considered completed. If false, provide a brief message explaining why.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            }
        ]);

        const responseText = result.response.text();
        
        // Parse JSON response
        let validationResult;
        try {
            // Try to extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                validationResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('Error parsing Gemini response:', parseError);
            // Fallback: check if response indicates validation
            const lowerText = responseText.toLowerCase();
            validationResult = {
                valid: lowerText.includes('valid') && (lowerText.includes('true') || lowerText.includes('yes')),
                message: responseText.substring(0, 200)
            };
        }

        res.json({
            valid: validationResult.valid || false,
            message: validationResult.message || 'Proof validation completed'
        });
    } catch (error) {
        console.error('Error validating goal proof:', error);
        res.status(500).json({ 
            error: 'Failed to validate proof', 
            details: error.message 
        });
    }
});

module.exports = router;
