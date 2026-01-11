# Deploying to Vercel

This project has been configured to work with Vercel's serverless platform.

## Setup Instructions

1. **Install Vercel CLI** (if deploying via CLI):
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   Or connect your GitHub repository to Vercel for automatic deployments.

3. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project settings → Environment Variables
   - Add the following variables:
     - `GEMINI_API_KEY` - Your Google Gemini API key
     - `SESSION_SECRET` - A random secret string for session encryption (optional, defaults to 'dev_secret_change_me')
     - `NODE_ENV` - Set to `production` (optional)

## Important Notes

- **File Uploads**: File uploads now use memory storage instead of disk storage (Vercel serverless functions don't have a persistent file system)
- **Sessions**: Sessions use memory storage, so they won't persist across serverless function invocations. For production, consider using a database or external session store.
- **Static Files**: All static files (HTML, CSS, JS) are served automatically by Vercel
- **API Routes**: All API routes are handled by the serverless function in `api/index.js`
- **Route Configuration**: Routes in the serverless function don't include the `/api` prefix since Vercel routes `/api/*` to the function automatically

## Local Development

For local development, continue using:
```bash
npm run dev
```

This uses the original `server.js` file. The Vercel deployment uses `api/index.js` instead.

## Project Structure

- `api/index.js` - Serverless function entry point for Vercel
- `server.js` - Original Express server for local development
- `vercel.json` - Vercel configuration
- All other files remain the same
