// Format time display
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Start Timer
async function startTimer(taskId) {
    const task = tasks.find(t => t._id === taskId);
    if (!task || task.isCompleted) return;

    if (!task.timer) {
        task.timer = {
            isRunning: false,
            startTime: null,
            elapsedTime: 0,
            lastPausedAt: null
        };
    }

    if (!task.timer.isRunning) {
        task.timer.isRunning = true;
        task.timer.startTime = Date.now();
        await handleUpdateTask(task._id, { timer: task.timer });
        renderTasks();
        showTimerModal(task);
    }
}

// Show Timer Modal
function showTimerModal(task) {
    const modal = document.getElementById('timer-modal');
    const taskDescription = document.getElementById('timer-task-description');
    const timerDisplay = document.getElementById('timer-modal-display');
    const petVisualModal = document.getElementById('pet-visual-modal');
    
    taskDescription.textContent = task.description;
    currentTaskInfo = task;
    
    // Render pet visual in modal
    const size = 150;
    const scale = 1;
    const avgStats = (petData.health + petData.happiness + petData.hunger + petData.energy) / 4;
    const isHealthy = avgStats > 50;
    const isHappy = petData.happiness > 50;
    let color = isHealthy ? '#4ade80' : '#f87171';
    
    petVisualModal.innerHTML = `
        <svg width="${size}" height="${size}" viewBox="0 0 200 200" style="transform: scale(${scale})">
            <circle cx="100" cy="120" r="60" fill="${color}" opacity="0.9"/>
            <circle cx="100" cy="60" r="45" fill="${color}"/>
            <circle cx="85" cy="55" r="8" fill="#1f2937"/>
            <circle cx="115" cy="55" r="8" fill="#1f2937"/>
            <path d="M 80 70 Q 100 ${isHappy ? 75 : 80} 120 70" stroke="#1f2937" stroke-width="3" fill="none" stroke-linecap="round"/>
            <text x="100" y="180" text-anchor="middle" font-size="30">💪</text>
        </svg>
    `;
    
    modal.classList.add('active');
    
    // Update timer display
    const updateDisplay = () => {
        if (task.timer && task.timer.isRunning) {
            const elapsedTime = task.timer.elapsedTime + (Date.now() - task.timer.startTime);
            timerDisplay.textContent = formatTime(elapsedTime);
        }
    };
    
    updateDisplay();
    const timerInterval = setInterval(() => {
        if (!task.timer || !task.timer.isRunning || !modal.classList.contains('active')) {
            clearInterval(timerInterval);
            return;
        }
        updateDisplay();
    }, 1000);
}

// Pause Timer
async function pauseTimer(taskId) {
    const task = tasks.find(t => t._id === taskId);
    if (!task || !task.timer || !task.timer.isRunning) return;

    // Calculate and save elapsed time
    const now = Date.now();
    task.timer.elapsedTime += (now - task.timer.startTime);
    task.timer.isRunning = false;
    task.timer.lastPausedAt = now;

    await handleUpdateTask(task._id, { timer: task.timer });
    renderTasks();

    // Open progress modal
    currentTaskInfo = task;
    openProgressModal(task);
}

// Cancel Progress Modal (keep timer paused)
function cancelProgressModal() {
    // Close both modals, timer stays paused
    document.getElementById('progress-modal').classList.remove('active');
    const timerModal = document.getElementById('timer-modal');
    if (timerModal) {
        timerModal.classList.remove('active');
    }
    currentTaskInfo = null;
}

// Start timer updates interval
let timerUpdateInterval = null;
function startTimerUpdates() {
    if (timerUpdateInterval) {
        clearInterval(timerUpdateInterval);
    }
    
    timerUpdateInterval = setInterval(() => {
        const hasRunningTimer = tasks.some(task => task.timer && task.timer.isRunning);
        if (hasRunningTimer) {
            renderTasks();
        }
    }, 1000);
}
