// API Base URL - adjust for your backend
// Automatically use Vercel API routes in production, localhost in development
const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// Growth stages
const GROWTH_STAGES = ['Baby', 'Young', 'Teen', 'Adult'];
