// Open Progress Modal
function openProgressModal(task) {
    currentTaskInfo = { id: task.id };
    const modal = document.getElementById('progress-modal');
    const descriptionTextarea = document.getElementById('progress-description');
    const subtasksList = document.getElementById('progress-subtasks-list');
    const resultDiv = document.getElementById('progress-result');
    
    descriptionTextarea.value = '';
    resultDiv.innerHTML = '';
    resultDiv.className = 'progress-result';
    
    // Populate subtasks checkboxes
    if (task.subtasks && task.subtasks.length > 0) {
        subtasksList.innerHTML = task.subtasks.map(subtask => `
            <label class="progress-subtask-label">
                <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
                    data-subtask-id="${subtask.id}">
                ${escapeHtml(subtask.text)}
            </label>
        `).join('');
    } else {
        subtasksList.innerHTML = '<p style="color: #6b7280;">No subtasks yet.</p>';
    }
    
    modal.classList.add('active');
}

// Handle Progress Modal Actions
async function handleUpdateProgress() {
    if (!currentTaskInfo) return;
    
    const task = tasks.find(t => t.id === currentTaskInfo.id);
    if (!task) return;
    
    const descriptionTextarea = document.getElementById('progress-description');
    const progressDescription = descriptionTextarea.value.trim();
    const subtasksList = document.getElementById('progress-subtasks-list');
    const checkboxes = subtasksList.querySelectorAll('input[type="checkbox"]');
    
    // Update subtasks based on checkboxes
    checkboxes.forEach(checkbox => {
        const subtaskId = checkbox.dataset.subtaskId;
        const subtask = task.subtasks.find(st => st.id === subtaskId);
        if (subtask) {
            subtask.completed = checkbox.checked;
        }
    });
    
    showLoading();
    
    try {
        // Send subtasks without completed status for assessment
        const subtasksForAssessment = task.subtasks.map(st => ({
            id: st.id,
            text: st.text
        }));
        
        const response = await fetch(`${API_BASE_URL}/assess-progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task: task.description,
                currentSubtasks: subtasksForAssessment,
                progressDescription: progressDescription
            })
        });
        
        const result = await response.json();
        
        // Update task with AI assessment
        task.progress = result.progress || calculateTaskProgress(task);
        if (result.updatedSubtasks && result.updatedSubtasks.length > 0) {
            task.subtasks = result.updatedSubtasks;
        }
        
        saveTasks();
        renderTasks();
        hideLoading();
        
        // Update modal content with refreshed subtasks
        openProgressModal(task);
        
        // Show result
        const resultDiv = document.getElementById('progress-result');
        resultDiv.className = 'progress-result success';
        resultDiv.innerHTML = `<strong>Progress Updated!</strong><p>${result.explanation || 'Progress has been assessed and updated.'}</p>`;
    } catch (error) {
        console.error('Error assessing progress:', error);
        hideLoading();
        
        // Fallback: update progress based on subtasks
        task.progress = calculateTaskProgress(task);
        saveTasks();
        renderTasks();
        
        // Update modal content with refreshed subtasks
        openProgressModal(task);
        
        const resultDiv = document.getElementById('progress-result');
        resultDiv.className = 'progress-result success';
        resultDiv.innerHTML = '<strong>Progress Updated!</strong><p>Progress calculated based on completed subtasks.</p>';
    }
}

// Handle All Done Button
function handleAllDone() {
    if (!currentTaskInfo) return;
    
    const task = tasks.find(t => t.id === currentTaskInfo.id);
    if (!task) return;
    
    // Mark all subtasks as complete
    if (task.subtasks) {
        task.subtasks.forEach(subtask => {
            subtask.completed = true;
        });
    }
    
    task.progress = 100;
    task.completed = true;
    
    // Award coins
    const coinsEarned = task.difficulty * 2;
    petData.coins += coinsEarned;
    
    // Small happiness boost
    petData.happiness = Math.min(100, petData.happiness + 5);
    
    // Stop timer if running and add to total time spent
    if (task.timer && task.timer.isRunning) {
        const now = Date.now();
        const timeSpent = now - task.timer.startTime;
        task.timer.elapsedTime += timeSpent;
        task.timer.isRunning = false;
        petData.totalTimeSpent = (petData.totalTimeSpent || 0) + timeSpent;
    } else if (task.timer && task.timer.elapsedTime > 0) {
        // Add elapsed time even if timer wasn't running
        petData.totalTimeSpent = (petData.totalTimeSpent || 0) + task.timer.elapsedTime;
    }
    
    calculateGrowth();
    savePetData();
    saveTasks();
    renderTasks();
    renderPet();
    animateCoinGain(coinsEarned);
    
    // Close modals
    document.getElementById('progress-modal').classList.remove('active');
    const timerModal = document.getElementById('timer-modal');
    if (timerModal) {
        timerModal.classList.remove('active');
    }
}
