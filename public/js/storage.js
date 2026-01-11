// Initialize Pet Data
function initPetData() {
    const saved = localStorage.getItem('petData');
    if (saved) {
        return JSON.parse(saved);
    }
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
        maxHappiness: 100
    };
}

// Initialize Tasks
function initTasks() {
    const saved = localStorage.getItem('tasks');
    let tasks = saved ? JSON.parse(saved) : [];
    
    // Migrate existing tasks to include new fields
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
}

// Save Pet Data
function savePetData() {
    localStorage.setItem('petData', JSON.stringify(petData));
}

// Save Tasks
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}
