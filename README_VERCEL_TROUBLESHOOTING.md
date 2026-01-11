# Vercel Deployment Troubleshooting

If you're getting a 500 error, check the Vercel function logs:

1. Go to your Vercel dashboard
2. Click on your project
3. Go to the "Functions" tab
4. Click on a failed request to see the error logs

Common issues:

1. **Missing Environment Variables**: Make sure `GEMINI_API_KEY` is set in Vercel dashboard
2. **File System Operations**: The auth route uses file system which won't work in serverless - this is okay for now as auth routes will just fail gracefully
3. **Route Path Issues**: Routes are mounted with `/api` prefix to match the original server.js structure
