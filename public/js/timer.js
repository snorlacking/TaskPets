// Start Timer
function startTimer(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;
    
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
        saveTasks();
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
    currentTaskInfo = { id: task.id };
    
    // Render pet visual in modal
    const size = 150;
    const scale = 1;
    const avgStats = (petData.health + petData.happiness + petData.hunger + petData.energy) / 4;
    const isHealthy = avgStats > 50;
    const isHappy = petData.happiness > 50;
    let color = isHealthy ? '#4ade80' : '#f87171';
    
    // Check active items
    const activeItems = petData.activeItems || [];
    const hasHat = activeItems.includes('hat');
    const hasBowTie = activeItems.includes('bow-tie');
    const hasTie = activeItems.includes('tie');
    
    let accessories = '';
    
    // Hat (on head)
    if (hasHat) {
        accessories += `<rect x="60" y="20" width="80" height="25" rx="5" fill="#1f2937" opacity="0.9"/>`;
        accessories += `<rect x="65" y="25" width="70" height="15" rx="3" fill="#374151"/>`;
    }
    
    // Bow tie (on body)
    if (hasBowTie) {
        accessories += `<circle cx="95" cy="105" r="8" fill="#ef4444"/>`;
        accessories += `<circle cx="105" cy="105" r="8" fill="#ef4444"/>`;
        accessories += `<polygon points="100,105 95,115 105,115" fill="#ef4444"/>`;
    }
    
    // Tie (on body)
    if (hasTie) {
        accessories += `<polygon points="100,85 95,105 100,120 105,105" fill="#1f2937"/>`;
        accessories += `<rect x="98" y="85" width="4" height="8" fill="#374151"/>`;
    }
    
    petVisualModal.innerHTML = `
        <svg width="${size}" height="${size}" viewBox="0 0 200 200" style="transform: scale(${scale})">
            <circle cx="100" cy="120" r="60" fill="${color}" opacity="0.9"/>
            <circle cx="100" cy="60" r="45" fill="${color}"/>
            ${accessories}
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
function pauseTimer(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.timer || !task.timer.isRunning) return;
    
    // Calculate and save elapsed time
    const now = Date.now();
    task.timer.elapsedTime += (now - task.timer.startTime);
    task.timer.isRunning = false;
    task.timer.lastPausedAt = now;
    
    saveTasks();
    renderTasks();
    
    // Close timer modal and open progress modal
    document.getElementById('timer-modal').classList.remove('active');
    
    // Open progress modal
    currentTaskInfo = { id: task.id };
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
