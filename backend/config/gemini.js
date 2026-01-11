const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Cache the working model name
let workingModelName = null;

// Helper function to get model with fallback
async function getWorkingModel(forImage = false) {
    // For images, use models that support vision
    if (forImage) {
        const visionModels = ['gemini-2.5-flash'];
        for (const modelName of visionModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                // Test if model works
                await model.generateContent('test');
                console.log(`✓ Using vision model: ${modelName}`);
                return modelName;
            } catch (error) {
                continue;
            }
        }
    }
    
    // For text-only operations, use the preferred model
    if (workingModelName && !forImage) {
        return workingModelName;
    }
    
    const modelNames = ['gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-pro'];
    
    for (const modelName of modelNames) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            // Test if model works with a simple query
            await model.generateContent('test');
            console.log(`✓ Using model: ${modelName}`);
            if (!forImage) {
                workingModelName = modelName;
            }
            return modelName;
        } catch (error) {
            console.log(`✗ Model ${modelName} not available, trying next...`);
            continue;
        }
    }
    
    // Default fallback
    console.log('⚠ Using default model: gemini-pro (may not work)');
    if (!forImage) {
        workingModelName = 'gemini-pro';
    }
    return 'gemini-pro';
}

// Initialize model on startup
(async () => {
    try {
        await getWorkingModel();
        console.log('✓ Gemini API connection successful');
    } catch (error) {
        console.error('⚠ Warning: Could not connect to Gemini API:', error.message);
        console.error('Make sure your API key is valid');
    }
})();

module.exports = {
    genAI,
    getWorkingModel
};
