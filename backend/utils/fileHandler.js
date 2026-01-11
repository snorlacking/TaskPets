const fs = require('fs');
const path = require('path');

// Helper function to read file content
function readFileContent(filePath) {
    try {
        const ext = path.extname(filePath).toLowerCase();
        
        if (['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.py', '.java', '.cpp', '.c'].includes(ext)) {
            // Text files
            return fs.readFileSync(filePath, 'utf-8');
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
            // Image files - convert to base64
            const imageBuffer = fs.readFileSync(filePath);
            return imageBuffer.toString('base64');
        } else {
            // Try to read as text
            return fs.readFileSync(filePath, 'utf-8');
        }
    } catch (error) {
        console.error('Error reading file:', error);
        return '';
    }
}

// Helper function to get file type
function getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
        return 'image';
    }
    return 'text';
}

// Helper function to get MIME type from file path
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
}

// Helper function to read image file as base64
function readImageAsBase64(filePath) {
    try {
        const imageBuffer = fs.readFileSync(filePath);
        return imageBuffer.toString('base64');
    } catch (error) {
        console.error('Error reading image file:', error);
        return null;
    }
}

module.exports = {
    readFileContent,
    getFileType,
    getMimeType,
    readImageAsBase64
};
