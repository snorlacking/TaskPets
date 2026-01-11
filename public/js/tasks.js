// Handle Add Task
async function handleAddTask(e) {
    e.preventDefault();
    const input = document.getElementById('task-input');
    const description = input.value.trim();
    if (!description) return;
    
    const isGoal = document.getElementById('is-goal-checkbox').checked;
    
    showLoading();
    
    try {
        // Check completeness first
        const completenessResponse = await fetch(`${API_BASE_URL}/check-completeness`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task: description })
        });
        
        const completenessData = await completenessResponse.json();
        
        if (completenessData.needsMoreInfo) {
            hideLoading();
            currentTaskInfo = { description, taskDescription: '', isGoal };
            document.getElementById('info-message').textContent = completenessData.message || 'Could you provide more details about this task?';
            document.getElementById('additional-info').value = '';
            document.getElementById('info-modal').classList.add('active');
            return;
        }
        
        // Proceed with difficulty rating
        await proceedWithTask(description, '', isGoal);
    } catch (error) {
        console.error('Error adding task:', error);
        showError('Error adding task. Please check if the backend server is running.');
        hideLoading();
    }
}

// Proceed with task (after completeness check)
async function proceedWithTask(description, taskDescription = '', isGoal = false) {
    try {
        const difficultyResponse = await fetch(`${API_BASE_URL}/rate-difficulty`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task: description + (taskDescription ? ' ' + taskDescription : '') })
        });
        
        const difficultyData = await difficultyResponse.json();
        const difficulty = parseInt(difficultyData.rating) || 50;
        
        const newTask = {
            id: Date.now() + Math.random(),
            description,
            taskDescription: taskDescription || '',
            difficulty,
            completed: false,
            createdAt: Date.now(),
            progress: 0,
            subtasks: [],
            dueDate: null,
            minimized: false,
            timer: {
                isRunning: false,
                startTime: null,
                elapsedTime: 0,
                lastPausedAt: null
            },
            isGoal: isGoal || false,
            streak: 0,
            history: [],
            lastCompleted: null
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        
        document.getElementById('task-input').value = '';
        document.getElementById('is-goal-checkbox').checked = false;
        hideLoading();
        
        // Show due date modal (optional) - only for regular tasks
        if (!isGoal) {
            setTimeout(() => showDueDateModal(newTask.id), 100);
        }
    } catch (error) {
        console.error('Error rating difficulty:', error);
        showError('Error rating task difficulty. Please check if the backend server is running.');
        hideLoading();
    }
}

// Handle Delete Task
function handleDeleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
}

// Toggle Task Minimize
function toggleTaskMinimize(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.minimized = !task.minimized;
        saveTasks();
        renderTasks();
    }
}

// Format Date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Show Due Date Modal
function showDueDateModal(taskId) {
    const modal = document.getElementById('due-date-modal');
    const dateInput = document.getElementById('due-date-input');
    
    if (!modal || !dateInput) return;
    
    dateInput.value = '';
    currentTaskInfo = { id: taskId };
    modal.classList.add('active');
}

// Handle Import Tasks
async function handleImportTasks() {
    document.getElementById('import-modal').classList.add('active');
}

// Handle Import from File
async function handleImportFromFile() {
    const fileInput = document.getElementById('import-file-input');
    fileInput.click();
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        await processImportFile(file);
        fileInput.value = '';
    };
}

// Handle Import from URL
async function handleImportFromURL() {
    const urlInput = document.getElementById('import-url-input');
    const url = urlInput.value.trim();
    
    if (!url) {
        showWarning('Please enter a calendar URL');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/import-tasks-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        
        const result = await response.json();
        
        if (result.tasks && result.tasks.length > 0) {
            await processImportedTasks(result.tasks);
        } else {
            showWarning('No tasks found in the calendar.');
        }
        
        hideLoading();
        document.getElementById('import-modal').classList.remove('active');
        urlInput.value = '';
    } catch (error) {
        console.error('Error importing from URL:', error);
        showError('Error importing calendar. Please check if the backend server is running.');
        hideLoading();
    }
}

// Process Import File
async function processImportFile(file) {
    showLoading();
    
    try {
        const formData = new FormData();
        formData.append('icsFile', file);
        
        const response = await fetch(`${API_BASE_URL}/import-tasks`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.tasks && result.tasks.length > 0) {
            await processImportedTasks(result.tasks);
        } else {
            showWarning('No tasks found in the .ics file.');
        }
        
        hideLoading();
        document.getElementById('import-modal').classList.remove('active');
    } catch (error) {
        console.error('Error importing tasks:', error);
        showError('Error importing tasks. Please check if the backend server is running.');
        hideLoading();
    }
}

// Process Imported Tasks
async function processImportedTasks(importedTasks) {
    for (const importedTask of importedTasks) {
        try {
            const difficultyResponse = await fetch(`${API_BASE_URL}/rate-difficulty`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task: importedTask.title + (importedTask.description ? ' ' + importedTask.description : '') })
            });
            const difficultyData = await difficultyResponse.json();
            const difficulty = parseInt(difficultyData.rating) || 50;
            
            const newTask = {
                id: Date.now() + Math.random(),
                description: importedTask.title,
                taskDescription: importedTask.description || '',
                difficulty,
                completed: false,
                createdAt: Date.now(),
                progress: 0,
                subtasks: [],
                dueDate: importedTask.dueDate || null,
                minimized: false,
                timer: {
                    isRunning: false,
                    startTime: null,
                    elapsedTime: 0,
                    lastPausedAt: null
                }
            };
            tasks.push(newTask);
        } catch (error) {
            console.error('Error rating difficulty for imported task:', error);
        }
    }
    
    saveTasks();
    renderTasks();
    showSuccess(`Successfully imported ${importedTasks.length} task(s)!`);
}

// Toggle Task Description Editor
function toggleTaskDescription(taskId) {
    const textarea = document.getElementById(`task-desc-${taskId}`);
    const btn = event.target;
    if (textarea.style.display === 'none') {
        textarea.style.display = 'block';
        textarea.focus();
        btn.style.display = 'none';
    }
}

// Update Task Description
function updateTaskDescription(taskId, description) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.taskDescription = description.trim();
        saveTasks();
        renderTasks();
    }
}

// Render Tasks
function renderTasks() {
    const taskList = document.getElementById('task-list');
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No tasks yet. Add one to get started!</p>';
        return;
    }
    
    // Sort tasks: incomplete first, then completed
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });
    
    // Clear and prepare for animations
    taskList.innerHTML = '';
    
    // Render tasks with staggered animations
    sortedTasks.forEach((task, index) => {
        const progress = task.progress || 0;
        const elapsedTime = task.timer ? (task.timer.elapsedTime + (task.timer.isRunning ? Date.now() - task.timer.startTime : 0)) : 0;
        const timerDisplay = task.timer && task.timer.isRunning ? formatTime(elapsedTime) : (task.timer && task.timer.elapsedTime > 0 ? formatTime(task.timer.elapsedTime) : '');
        
        const isMinimized = task.minimized;
        const isGoal = task.isGoal || false;
        
        // Different displays for goals vs regular tasks
        let dateDisplay = '';
        if (isGoal) {
            // Get lastCompleted from database (stored in task.lastCompleted, derived from history)
            let lastCompleted = 'Never';
            if (task.lastCompleted) {
                // Use the timestamp directly from database, format it properly
                const date = new Date(task.lastCompleted);
                // Use local date components to avoid timezone issues
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                lastCompleted = formatDate(`${year}-${month}-${day}`);
            }
            dateDisplay = `<span class="due-date-badge">📅 Last Completed: ${lastCompleted}</span>`;
            // Streak is calculated from database history
            if (task.streak > 0) {
                dateDisplay += ` <span class="due-date-badge" style="background: #fbbf24; color: #1f2937;">🔥 Streak: ${task.streak}</span>`;
            }
        } else {
            dateDisplay = task.dueDate ? `<span class="due-date-badge ${new Date(task.dueDate) < new Date() && !task.completed ? 'overdue' : ''}">📅 ${formatDate(task.dueDate)}</span>` : '';
        }
        
        const taskElement = document.createElement('div');
        taskElement.className = 'task-card' + (task.completed && !isGoal ? ' completed' : '');
        taskElement.style.animationDelay = `${index * 0.1}s`;
        
        taskElement.innerHTML = `
            <div class="task-header">
                <div class="task-title-row">
                    <div class="task-description">${escapeHtml(task.description)}</div>
                    <button class="minimize-btn" onclick="toggleTaskMinimize(${task.id})" title="${isMinimized ? 'Expand' : 'Minimize'}">${isMinimized ? '▼' : '▲'}</button>
                </div>
                ${!isMinimized ? `
                ${task.taskDescription ? `<div class="task-description-text">${escapeHtml(task.taskDescription)}</div>` : ''}
                <button class="edit-description-btn" onclick="toggleTaskDescription(${task.id})" title="Edit description">${task.taskDescription ? '✏️' : '+ Add description'}</button>
                ${task.taskDescription ? `<textarea class="task-description-edit" id="task-desc-${task.id}" style="display:none;" onblur="updateTaskDescription(${task.id}, this.value)">${escapeHtml(task.taskDescription)}</textarea>` : `<textarea class="task-description-edit" id="task-desc-${task.id}" style="display:none;" placeholder="Add description..." onblur="updateTaskDescription(${task.id}, this.value)"></textarea>`}
                ` : ''}
            </div>
            <div class="task-meta">
                <span class="difficulty-badge">Difficulty: ${task.difficulty}/100</span>
                <span class="coin-reward">
                    <span class="coin-icon">🪙</span>
                    ${task.difficulty * 2} coins
                </span>
                ${isGoal ? '<span class="difficulty-badge" style="background: #8b5cf6;">🎯 Goal</span>' : ''}
                ${dateDisplay}
            </div>
            
            ${!isMinimized && !isGoal ? `
            <!-- Progress Bar -->
            <div class="task-progress-section">
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                    <span class="progress-text">${progress}%</span>
                </div>
            </div>
            
            <!-- Subtasks -->
            <div class="subtasks-section" id="subtasks-${task.id}">
                ${task.subtasks && task.subtasks.length > 0 ? `
                    <div class="subtasks-list">
                        ${task.subtasks.map((subtask, index) => `
                            <div class="subtask-item">
                                <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
                                    onchange="toggleSubtask(${task.id}, '${subtask.id}')" 
                                    class="subtask-checkbox">
                                <input type="text" value="${escapeHtml(subtask.text)}" 
                                    class="subtask-text" 
                                    onblur="updateSubtaskText(${task.id}, '${subtask.id}', this.value)"
                                    onkeypress="if(event.key==='Enter') this.blur()">
                                <button class="subtask-delete-btn" onclick="deleteSubtask(${task.id}, '${subtask.id}')" title="Delete">×</button>
                            </div>
                        `).join('')}
                        <button class="add-subtask-btn" onclick="addSubtask(${task.id})">+ Add Subtask</button>
                    </div>
                ` : `
                    <button class="generate-subtasks-btn" onclick="generateSubtasks(${task.id})">Generate Subtasks</button>
                `}
            </div>
            
            ` : ''}
            
            <div class="task-actions">
                ${isGoal ? `
                    <button class="task-btn" style="background: #10b981;" onclick="openGoalProofModal(${task.id})">Complete Goal</button>
                    <button class="task-btn" style="background: #667eea;" onclick="openGoalHistoryModal(${task.id})">History</button>
                    <button class="task-btn delete-btn" onclick="handleDeleteTask(${task.id})">Delete</button>
                ` : `
                    ${task.completed ? '<span style="color: #10b981; font-weight: 600;">✓ Completed</span>' : ''}
                    ${!task.completed ? `
                        ${task.timer && task.timer.isRunning ? `
                            <div class="timer-display running">⏱️ ${timerDisplay}</div>
                            <button class="timer-btn pause-btn" onclick="pauseTimer(${task.id})">Pause</button>
                        ` : `
                            ${timerDisplay ? `<div class="timer-display">⏱️ ${timerDisplay}</div>` : ''}
                            <button class="timer-btn start-btn" onclick="startTimer(${task.id})">Start Timer</button>
                        `}
                    ` : task.timer && task.timer.elapsedTime > 0 ? `
                    <div class="timer-display">⏱️ ${formatTime(task.timer.elapsedTime)}</div>
                    ` : ''}
                    <button class="task-btn delete-btn" onclick="handleDeleteTask(${task.id})">Delete</button>
                `}
            </div>
        `;
        
        taskList.appendChild(taskElement);
    });
    
    // Start timer updates for running timers
    startTimerUpdates();
}
