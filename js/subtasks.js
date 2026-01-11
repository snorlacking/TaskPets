// Calculate task progress
function calculateTaskProgress(task) {
    if (!task.subtasks || task.subtasks.length === 0) {
        return task.progress || 0;
    }
    const completed = task.subtasks.filter(st => st.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
}

// Generate Subtasks
async function generateSubtasks(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate-subtasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                task: task.description,
                description: task.taskDescription || ''
            })
        });
        
        const result = await response.json();
        task.subtasks = result.subtasks || [];
        // Keep existing progress (don't recalculate from subtasks)
        
        saveTasks();
        renderTasks();
        hideLoading();
    } catch (error) {
        console.error('Error generating subtasks:', error);
        alert('Error generating subtasks. Please check if the backend server is running.');
        hideLoading();
    }
}

// Toggle Subtask Completion
function toggleSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks || task.completed) return;
    
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (subtask) {
        subtask.completed = !subtask.completed;
        // Update progress based on subtask completion percentage
        task.progress = calculateTaskProgress(task);
        
        // Check if all subtasks are completed
        const allCompleted = task.subtasks.length > 0 && task.subtasks.every(st => st.completed);
        if (allCompleted) {
            task.completed = true;
            task.progress = 100;
            
            // Award coins
            const coinsEarned = task.difficulty * 2;
            petData.coins += coinsEarned;
            
            // Small happiness boost
            petData.happiness = Math.min(100, petData.happiness + 5);
            petData.totalTasksCompleted++;
            
            // Stop timer if running
            if (task.timer && task.timer.isRunning) {
                const now = Date.now();
                task.timer.elapsedTime += (now - task.timer.startTime);
                task.timer.isRunning = false;
            }
            
            calculateGrowth();
            savePetData();
            renderPet();
            animateCoinGain(coinsEarned);
        }
        
        saveTasks();
        renderTasks();
    }
}

// Update Subtask Text
function updateSubtaskText(taskId, subtaskId, newText) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (subtask && newText.trim() !== '') {
        subtask.text = newText.trim();
        saveTasks();
    } else if (subtask && newText.trim() === '') {
        // Remove empty subtask
        deleteSubtask(taskId, subtaskId);
    }
}

// Delete Subtask
function deleteSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    // Don't delete completed subtasks
    if (subtask && subtask.completed) {
        return;
    }
    
    task.subtasks = task.subtasks.filter(st => st.id !== subtaskId);
    // Don't update progress from subtask count - only use AI assessment
    saveTasks();
    renderTasks();
}

// Add Subtask
function addSubtask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (!task.subtasks) {
        task.subtasks = [];
    }
    
    const newSubtask = {
        id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: 'New subtask',
        completed: false
    };
    
    task.subtasks.push(newSubtask);
    saveTasks();
    renderTasks();
}
