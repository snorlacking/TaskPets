// Initialize Pet Data
async function initPetData() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/data`, {
            credentials: 'include'
        });
        
        if (response.status === 401) {
            // Not authenticated, redirect to login
            window.location.href = 'login.html';
            return getDefaultPetData();
        }
        
        if (!response.ok) {
            throw new Error('Failed to fetch pet data');
        }
        
        const data = await response.json();
        
        // Return petData or default if not set
        if (data.petData && Object.keys(data.petData).length > 0) {
            return data.petData;
        }
        
        return getDefaultPetData();
    } catch (error) {
        console.error('Error loading pet data:', error);
        // Return default on error
        return getDefaultPetData();
    }
}

// Default pet data structure
function getDefaultPetData() {
    return {
        name: 'My Pet',
        health: 100,
        happiness: 100,
        hunger: 100,
        energy: 100,
        growthStage: 0,
        coins: 0,
        inventory: [],
        totalTasksCompleted: 0,
        itemsUsed: 0,
        lastStatUpdate: Date.now(),
        maxHealth: 100,
        maxHappiness: 100,
        activeItems: [], // Track which wearable items are currently active
        totalTimeSpent: 0 // Total time spent on all tasks (in milliseconds)
    };
}

// Initialize Tasks
async function initTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/data`, {
            credentials: 'include'
        });
        
        if (response.status === 401) {
            // Not authenticated, redirect to login
            window.location.href = 'login.html';
            return [];
        }
        
        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }
        
        const data = await response.json();
        
        let tasks = data.tasks || [];
        
        // Migrate existing tasks to include new fields (if needed)
        tasks = tasks.map(task => {
            if (!task.hasOwnProperty('progress')) {
                task.progress = 0;
            }
            if (!task.hasOwnProperty('subtasks')) {
                task.subtasks = [];
            }
            if (!task.hasOwnProperty('timer')) {
                task.timer = {
                    isRunning: false,
                    startTime: null,
                    elapsedTime: 0,
                    lastPausedAt: null
                };
            }
            if (!task.hasOwnProperty('taskDescription')) {
                task.taskDescription = '';
            }
            if (!task.hasOwnProperty('dueDate')) {
                task.dueDate = null;
            }
            if (!task.hasOwnProperty('minimized')) {
                task.minimized = false;
            }
            return task;
        });
        
        return tasks;
    } catch (error) {
        console.error('Error loading tasks:', error);
        // Return empty array on error
        return [];
    }
}

// Save Pet Data
async function savePetData() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ petData })
        });
        
        if (response.status === 401) {
            // Not authenticated, redirect to login
            window.location.href = 'login.html';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to save pet data');
        }
    } catch (error) {
        console.error('Error saving pet data:', error);
    }
}

// Save Tasks
async function saveTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ tasks })
        });
        
        if (response.status === 401) {
            // Not authenticated, redirect to login
            window.location.href = 'login.html';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to save tasks');
        }
    } catch (error) {
        console.error('Error saving tasks:', error);
    }
}
