// Toggle Subtask
async function toggleSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t._id === taskId);
    if (task) {
        const subtask = task.subtasks.find(st => st.id === subtaskId);
        if (subtask) {
            subtask.completed = !subtask.completed;
            await handleUpdateTask(task._id, { subtasks: task.subtasks });
            renderTasks();
        }
    }
}

// Update Subtask Text
async function updateSubtaskText(taskId, subtaskId, text) {
    const task = tasks.find(t => t._id === taskId);
    if (task) {
        const subtask = task.subtasks.find(st => st.id === subtaskId);
        if (subtask) {
            subtask.text = text;
            await handleUpdateTask(task._id, { subtasks: task.subtasks });
            renderTasks();
        }
    }
}

// Delete Subtask
async function deleteSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t._id === taskId);
    if (task) {
        task.subtasks = task.subtasks.filter(st => st.id !== subtaskId);
        await handleUpdateTask(task._id, { subtasks: task.subtasks });
        renderTasks();
    }
}

// Add Subtask
async function addSubtask(taskId) {
    const task = tasks.find(t => t._id === taskId);
    if (task) {
        const newSubtask = {
            id: Math.random().toString(36).substr(2, 9),
            text: '',
            completed: false
        };
        task.subtasks.push(newSubtask);
        await handleUpdateTask(task._id, { subtasks: task.subtasks });
        renderTasks();
    }
}
// Handle Add Task
async function handleAddTask(e) {
    e.preventDefault();
    const input = document.getElementById('task-input');
    const description = input.value.trim();
    
    if (!description) return;
    
    try {
        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description }),
        });

        if (res.ok) {
            const newTask = await res.json();
            tasks.push(newTask);
            renderTasks();
            input.value = '';
        } else {
            alert('Failed to add task');
        }
    } catch (err) {
        console.error('Error adding task:', err);
        alert('Error adding task. Please check if the backend server is running.');
    }
}

// Handle Delete Task
async function handleDeleteTask(taskId) {
    try {
        const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
        if (res.ok) {
            tasks = tasks.filter(t => t._id !== taskId);
            renderTasks();
        } else {
            alert('Failed to delete task');
        }
    } catch (err) {
        console.error('Error deleting task:', err);
    }
}

async function handleUpdateTask(taskId, updates) {
    try {
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });

        if (res.ok) {
            const updatedTask = await res.json();
            const index = tasks.findIndex(t => t._id === taskId);
            if (index !== -1) {
                tasks[index] = updatedTask;
            }
            renderTasks();
        } else {
            alert('Failed to update task');
        }
    } catch (err) {
        console.error('Error updating task:', err);
    }
}


// Toggle Task Minimize
async function toggleTaskMinimize(taskId) {
    const task = tasks.find(t => t._id === taskId);
    if (task) {
        task.minimized = !task.minimized;
        await handleUpdateTask(task._id, { minimized: task.minimized });
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
        alert('Please enter a calendar URL');
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
            alert('No tasks found in the calendar.');
        }
        
        hideLoading();
        document.getElementById('import-modal').classList.remove('active');
        urlInput.value = '';
    } catch (error) {
        console.error('Error importing from URL:', error);
        alert('Error importing calendar. Please check if the backend server is running.');
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
            alert('No tasks found in the .ics file.');
        }
        
        hideLoading();
        document.getElementById('import-modal').classList.remove('active');
    } catch (error) {
        console.error('Error importing tasks:', error);
        alert('Error importing tasks. Please check if the backend server is running.');
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
    alert(`Successfully imported ${importedTasks.length} task(s)!`);
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
async function updateTaskDescription(taskId, description) {
    const task = tasks.find(t => t._id === taskId);
    if (task) {
        task.taskDescription = description.trim();
        await handleUpdateTask(task._id, { taskDescription: task.taskDescription });
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
        if (a.isCompleted === b.isCompleted) return 0;
        return a.isCompleted ? 1 : -1;
    });
    taskList.innerHTML = sortedTasks.map(task => {
        const progress = task.progress || 0;
        const elapsedTime = task.timer ? (task.timer.elapsedTime + (task.timer.isRunning ? Date.now() - task.timer.startTime : 0)) : 0;
        const timerDisplay = task.timer && task.timer.isRunning ? formatTime(elapsedTime) : (task.timer && task.timer.elapsedTime > 0 ? formatTime(task.timer.elapsedTime) : '');
        const isMinimized = task.minimized;
        const dueDateDisplay = task.dueDate ? `<span class="due-date-badge ${new Date(task.dueDate) < new Date() && !task.isCompleted ? 'overdue' : ''}">📅 ${formatDate(task.dueDate)}</span>` : '';
        return `
        <div class="task-card ${task.isCompleted ? 'completed' : ''}">
            <div class="task-header">
                <div class="task-title-row">
                    <div class="task-description">${escapeHtml(task.description)}</div>
                    <button class="minimize-btn" onclick="toggleTaskMinimize('${task._id}')" title="${isMinimized ? 'Expand' : 'Minimize'}">${isMinimized ? '▼' : '▲'}</button>
                </div>
                ${!isMinimized ? `
                ${task.taskDescription ? `<div class="task-description-text">${escapeHtml(task.taskDescription)}</div>` : ''}
                <button class="edit-description-btn" onclick="toggleTaskDescription('${task._id}')" title="Edit description">${task.taskDescription ? '✏️' : '+ Add description'}</button>
                ${task.taskDescription ? `<textarea class="task-description-edit" id="task-desc-${task._id}" style="display:none;" onblur="updateTaskDescription('${task._id}', this.value)">${escapeHtml(task.taskDescription)}</textarea>` : `<textarea class="task-description-edit" id="task-desc-${task._id}" style="display:none;" placeholder="Add description..." onblur="updateTaskDescription('${task._id}', this.value)"></textarea>`}
                ` : ''}
            </div>
            <div class="task-meta">
                <span class="difficulty-badge">Difficulty: ${task.difficulty}/100</span>
                <span class="coin-reward">
                    <span class="coin-icon">🪙</span>
                    ${task.difficulty * 2} coins
                </span>
                ${dueDateDisplay}
            </div>
            ${!isMinimized ? `
            <!-- Progress Bar -->
            <div class="task-progress-section">
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                    <span class="progress-text">${progress}%</span>
                </div>
            </div>
            <!-- Subtasks -->
            <div class="subtasks-section" id="subtasks-${task._id}">
                ${task.subtasks && task.subtasks.length > 0 ? `
                    <div class="subtasks-list">
                        ${task.subtasks.map((subtask, index) => `
                            <div class="subtask-item">
                                <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
                                    onchange="toggleSubtask('${task._id}', '${subtask.id}')" 
                                    class="subtask-checkbox">
                                <input type="text" value="${escapeHtml(subtask.text)}" 
                                    class="subtask-text" 
                                    onblur="updateSubtaskText('${task._id}', '${subtask.id}', this.value)"
                                    onkeypress="if(event.key==='Enter') this.blur()">
                                <button class="subtask-delete-btn" onclick="deleteSubtask('${task._id}', '${subtask.id}')" title="Delete">×</button>
                            </div>
                        `).join('')}
                        <button class="add-subtask-btn" onclick="addSubtask('${task._id}')">+ Add Subtask</button>
                    </div>
                ` : `
                    <button class="generate-subtasks-btn" onclick="generateSubtasks('${task._id}')">Generate Subtasks</button>
                `}
            </div>
            ` : ''}
            <div class="task-actions">
                ${task.isCompleted ? '<span style="color: #10b981; font-weight: 600;">✓ Completed</span>' : ''}
                ${!task.isCompleted ? `
                    ${task.timer && task.timer.isRunning ? `
                        <div class="timer-display running">⏱️ ${timerDisplay}</div>
                        <button class="timer-btn pause-btn" onclick="pauseTimer('${task._id}')">Pause</button>
                    ` : `
                        ${timerDisplay ? `<div class="timer-display">⏱️ ${timerDisplay}</div>` : ''}
                        <button class="timer-btn start-btn" onclick="startTimer('${task._id}')">Start Timer</button>
                    `}
                ` : ''}
                <button class="task-btn delete-btn" onclick="handleDeleteTask('${task._id}')">Delete</button>
            </div>
        </div>
    `;
    }).join('');
    startTimerUpdates();
}
