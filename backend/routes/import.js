const express = require('express');
const router = express.Router();
const multer = require('multer');
const ical = require('node-ical');
const https = require('https');
const http = require('http');

// Use memory storage for Vercel (serverless functions don't have persistent file system)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Helper function to fetch ICS from URL
function fetchICSFromURL(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch calendar: ${res.statusCode}`));
                return;
            }
            
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// API Endpoint: Import Tasks from URL
router.post('/import-tasks-url', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        const icsContent = await fetchICSFromURL(url);
        const events = ical.parseICS(icsContent);
        
        const importedTasks = [];
        
        for (const key in events) {
            const event = events[key];
            
            if (event.type === 'VEVENT') {
                const title = event.summary || 'Untitled Task';
                const description = event.description || '';
                let dueDate = null;
                
                if (event.end) {
                    dueDate = event.end.toISOString().split('T')[0];
                } else if (event.start) {
                    dueDate = event.start.toISOString().split('T')[0];
                }
                
                importedTasks.push({
                    title: title.trim(),
                    description: description.trim(),
                    dueDate: dueDate
                });
            }
        }
        
        res.json({ tasks: importedTasks });
    } catch (error) {
        console.error('Error importing from URL:', error);
        res.status(500).json({ error: 'Failed to import from URL', details: error.message });
    }
});

// API Endpoint: Import Tasks from .ics file
router.post('/import-tasks', upload.single('icsFile'), async (req, res) => {
    try {
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'ICS file is required' });
        }
        
        // For memory storage, file.buffer contains the file data
        const icsContent = file.buffer.toString('utf-8');
        
        // Parse ICS file
        const events = ical.parseICS(icsContent);
        
        const importedTasks = [];
        
        for (const key in events) {
            const event = events[key];
            
            if (event.type === 'VEVENT') {
                const title = event.summary || 'Untitled Task';
                const description = event.description || '';
                let dueDate = null;
                
                // Use dtstart or dtend as due date
                if (event.end) {
                    dueDate = event.end.toISOString().split('T')[0];
                } else if (event.start) {
                    dueDate = event.start.toISOString().split('T')[0];
                }
                
                importedTasks.push({
                    title: title.trim(),
                    description: description.trim(),
                    dueDate: dueDate
                });
            }
        }
        
        res.json({ tasks: importedTasks });
    } catch (error) {
        console.error('Error importing tasks:', error);
        console.error('Error details:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to import tasks', details: error.message });
    }
});

module.exports = router;
