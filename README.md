# Pet Task List 🐾

A gamified task management application centered around caring for your virtual pet. Complete tasks, earn coins, and help your pet grow!

## Features

- **Task Management**: Add tasks that are automatically checked for completeness and rated for difficulty (1-100) using Gemini AI
- **Virtual Pet**: Care for your pet with stats (Health, Happiness, Hunger, Energy)
- **Growth System**: Watch your pet grow through multiple stages as you complete tasks
- **Shop System**: Spend coins on food, toys, treats, decorations, and upgrades
- **Coin Economy**: Earn coins equal to double the task difficulty (2-200 coins per task)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Gemini API Key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

## Setup Instructions

1. **Clone or download this repository**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root directory:
   ```
   GEMINI_API_KEY=your_api_key_here
   PORT=3000
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

## How to Use

1. **Add a Task**: Enter a task description in the input field. Gemini AI will check if more information is needed (only flags extremely vague tasks like "do stuff").

2. **Complete a Task**: Click the "Complete" button on any task. No file upload or proof is required.

3. **Earn Coins**: When a task is completed, you earn coins equal to double the difficulty rating (e.g., difficulty 50 = 100 coins).

4. **Shop for Items**: Click the "Shop" button to buy items for your pet:
   - **Food**: Restores hunger and health
   - **Toys**: Increases happiness and energy
   - **Treats**: Boosts all stats significantly
   - **Decorations**: Cosmetic items
   - **Upgrades**: Permanent improvements

5. **Care for Your Pet**: Use items from your inventory or purchased items to keep your pet healthy and happy. Your pet will grow as you complete more tasks and care for them!

## Pet Stats

- **Health**: Affected by food and treats. Keep it high for a healthy pet!
- **Happiness**: Increased by toys, treats, and task completions
- **Hunger**: Restored by food items. Decreases over time
- **Energy**: Affected by treats and rest items

## Growth Stages

Your pet grows through multiple stages:
- **Baby** → **Young** → **Teen** → **Adult**

Growth is based on:
- Tasks completed
- Items used
- Average stats maintained

## Technical Details

### Frontend
- Uses Gemini AI for task completeness and difficulty rating
- No file upload or proof validation required

### Backend
- Provides endpoints for Gemini AI task completeness and difficulty


## Local auth (dev)

This project includes a simple session-based scaffold for local development. It is NOT production-ready.

Endpoints:
- POST /api/auth/login  — body { "username": "Your name" } -> creates a session
- GET  /api/auth/me     — returns { user } or { user: null }
- POST /api/auth/logout — destroys session

To get started after pulling these changes:

```powershell
npm install
```

```powershell
npm start
```

Open http://localhost:3000/login.html to sign in (dev flow).

Notes: Google login will be added later. For production, replace the in-memory session store and add real user persistence + OAuth.

## Notes

- All data is stored in browser localStorage (client-side only)
- The backend server must be running for Gemini AI features
- No file upload or proof validation is required

## Troubleshooting

**Server won't start:**
- Make sure you have Node.js installed
- Check that PORT 3000 is not already in use
- Verify your `.env` file has the correct GEMINI_API_KEY

**Tasks not being rated or checked:**
- Ensure the backend server is running
- Check browser console for CORS or connection errors
- Verify your Gemini API key is valid

**Pet not growing:**
- Complete more tasks
- Use items from the shop
- Maintain high pet stats

## License

MIT
