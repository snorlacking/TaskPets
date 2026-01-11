const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { genAI, getWorkingModel } = require('../config/gemini');
const { readFileContent, getFileType, getMimeType, readImageAsBase64 } = require('../utils/fileHandler');

// Multer configuration for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// API Endpoint: Validate Proof
router.post('/validate-proof', upload.single('proof'), async (req, res) => {
    try {
        const { task, difficulty } = req.body;
        const file = req.file;
        
        if (!task || !difficulty || !file) {
            return res.status(400).json({ error: 'Task, difficulty, and proof file are required' });
        }
        
        const filePath = file.path;
        // Use originalname for file type detection since multer temp files don't have extensions
        const fileType = getFileType(file.originalname);
        
        // Use a vision-capable model for images
        const modelName = await getWorkingModel(fileType === 'image');
        const model = genAI.getGenerativeModel({ model: modelName });
        
        let result;
        
        if (fileType === 'image') {
            // For images, pass the actual image data to Gemini
            const imageBase64 = readImageAsBase64(filePath);
            const mimeType = getMimeType(file.originalname);
            
            if (!imageBase64) {
                return res.status(500).json({ error: 'Failed to read image file' });
            }
            
            console.log(`Processing image: ${file.originalname}, MIME type: ${mimeType}, Size: ${Math.round(imageBase64.length / 1024)}KB`);
            
            const prompt = `I completed a task and need you to verify if my proof of completion matches the task requirements.
Task: ${task}
Difficulty Rating: ${difficulty}/100

Please analyze the provided image and check if it successfully demonstrates completion of this task. Look at what's visible in the image - text, screenshots, photos, diagrams, etc. - and determine if it shows evidence of task completion. If the image contains visual content (screenshots, photos, diagrams, text), it should be considered valid proof.
Respond with JSON only:
{
  "valid": true/false,
  "explanation": "brief explanation of why it is/isn't valid"
}`;
            
            try {
                // Pass both text prompt and image to Gemini using the correct format
                result = await model.generateContent([
                    { text: prompt },
                    {
                        inlineData: {
                            data: imageBase64,
                            mimeType: mimeType
                        }
                    }
                ]);
            } catch (imageError) {
                console.error('Error sending image to Gemini:', imageError);
                // If image format fails, fall back to describing the image
                return res.status(500).json({ 
                    error: 'Failed to process image', 
                    details: 'The model may not support image inputs. Try a different model or use a text-based proof.' 
                });
            }
        } else {
            // For text files, read as text
            const fileContent = readFileContent(filePath);
            const contentPreview = fileContent.substring(0, 2000); // Limit content length
            const prompt = `I completed a task and need you to verify if my proof of completion matches the task requirements.
Task: ${task}
Difficulty Rating: ${difficulty}/100
Proof content: ${contentPreview}

Please check if the provided proof successfully demonstrates completion of this task. 
Respond with JSON only:
{
  "valid": true/false,
  "explanation": "brief explanation of why it is/isn't valid"
}`;
            
            result = await model.generateContent(prompt);
        }
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
            const isValid = text.toLowerCase().includes('valid') || text.toLowerCase().includes('yes') || text.toLowerCase().includes('true');
            data = {
                valid: isValid,
                explanation: text.substring(0, 200)
            };
        }
        
        // Clean up uploaded file
        try {
            fs.unlinkSync(filePath);
        } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
        }
        
        res.json(data);
    } catch (error) {
        console.error('Error validating proof:', error);
        console.error('Error details:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to validate proof', details: error.message });
    }
});

module.exports = router;
