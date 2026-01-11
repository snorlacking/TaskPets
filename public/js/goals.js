// Goal-related functions

// Open Goal Proof Modal
function openGoalProofModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.isGoal) return;
    
    currentTaskInfo = { id: taskId };
    const modal = document.getElementById('goal-proof-modal');
    const proofInput = document.getElementById('goal-proof-input');
    const preview = document.getElementById('goal-proof-preview');
    const result = document.getElementById('goal-proof-result');
    
    const filenameDisplay = document.getElementById('goal-proof-filename');
    
    proofInput.value = '';
    preview.innerHTML = '';
    result.innerHTML = '';
    result.className = 'progress-result';
    result.style.display = 'none';
    if (filenameDisplay) filenameDisplay.textContent = '';
    
    modal.classList.add('active');
    
    // Preview image/video - use onchange to avoid multiple listeners
    proofInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            // Update filename display
            if (filenameDisplay) {
                filenameDisplay.textContent = file.name;
            }
            
            preview.innerHTML = '';
            const reader = new FileReader();
            reader.onload = function(e) {
                if (file.type.startsWith('image/')) {
                    preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 300px; border-radius: 8px;">`;
                } else if (file.type.startsWith('video/')) {
                    preview.innerHTML = `<video src="${e.target.result}" controls style="max-width: 100%; max-height: 300px; border-radius: 8px;"></video>`;
                }
            };
            reader.readAsDataURL(file);
        }
    };
}

// Skip Goal Proof (complete without validation)
function skipGoalProof() {
    if (!currentTaskInfo) return;
    
    const task = tasks.find(t => t.id === currentTaskInfo.id);
    if (!task || !task.isGoal) return;
    
    // Confirm skip
    if (!confirm('Are you sure you want to complete this goal without proof? This will mark it as completed without validation.')) {
        return;
    }
    
    completeGoal(task, true); // true = skipped
}

// Complete Goal (shared logic for both validated and skipped)
function completeGoal(task, skipped = false) {
    const now = Date.now();
    
    // Add to history
    if (!task.history) task.history = [];
    task.history.push({
        date: now,
        validated: !skipped,
        skipped: skipped
    });
    
    // Update lastCompleted to the most recent history entry
    task.lastCompleted = now;
    
    // Recalculate streak from history (ensures it's based on database data)
    task.streak = calculateStreakFromHistory(task.history);
    
    // Award coins
    const coinsEarned = task.difficulty * 2;
    petData.coins += coinsEarned;
    
    // Small happiness boost
    petData.happiness = Math.min(100, petData.happiness + 5);
    
    calculateGrowth();
    savePetData();
    saveTasks();
    renderTasks();
    renderPet();
    animateCoinGain(coinsEarned);
    
    // Show success message
    const result = document.getElementById('goal-proof-result');
    const message = skipped 
        ? `Goal completed without proof! Earned ${coinsEarned} coins. Streak: ${task.streak}`
        : `Goal completed! Earned ${coinsEarned} coins. Streak: ${task.streak}`;
    
    result.innerHTML = `<div style="padding: 1rem; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px;">
        <p style="color: #166534; font-weight: 600; margin-bottom: 0.5rem;">✅ Goal Completed!</p>
        <p style="color: #15803d; margin: 0;">${message}</p>
    </div>`;
    result.className = 'progress-result';
    result.style.display = 'block';
    
    // Close modal after a short delay
    setTimeout(() => {
        document.getElementById('goal-proof-modal').classList.remove('active');
    }, 2000);
}

// Submit Goal Proof
async function submitGoalProof() {
    if (!currentTaskInfo) return;
    
    const task = tasks.find(t => t.id === currentTaskInfo.id);
    if (!task || !task.isGoal) return;
    
    const proofInput = document.getElementById('goal-proof-input');
    const file = proofInput.files[0];
    const result = document.getElementById('goal-proof-result');
    
    if (!file) {
        result.innerHTML = '<p style="color: #ef4444;">Please select a file or click "Skip Proof" if you cannot provide proof.</p>';
        result.className = 'progress-result error';
        result.style.display = 'block';
        return;
    }
    
    showLoading();
    
    try {
        const formData = new FormData();
        formData.append('proof', file);
        formData.append('taskDescription', task.description);
        formData.append('taskId', task.id);
        
        const response = await fetch(`${API_BASE_URL}/goals/validate-proof`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const data = await response.json();
        
        hideLoading();
        
        if (data.valid) {
            // Goal completed successfully - use shared completion logic
            completeGoal(task, false); // false = validated
        } else {
            // Proof validation failed - show AI response
            result.innerHTML = `<div style="padding: 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
                <p style="color: #dc2626; font-weight: 600; margin-bottom: 0.5rem;">❌ Validation Failed</p>
                <p style="color: #991b1b; margin: 0;">${data.message || 'Proof validation failed. Please try again with different proof.'}</p>
            </div>`;
            result.className = 'progress-result error';
            result.style.display = 'block';
        }
    } catch (error) {
        hideLoading();
        console.error('Error submitting goal proof:', error);
        result.innerHTML = '<p style="color: #ef4444;">Error validating proof. Please try again.</p>';
        result.className = 'progress-result error';
    }
}

// Open Goal History Modal
function openGoalHistoryModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.isGoal) return;
    
    const modal = document.getElementById('goal-history-modal');
    const content = document.getElementById('goal-history-content');
    
    if (!task.history || task.history.length === 0) {
        content.innerHTML = '<p style="color: #6b7280;">No completion history yet.</p>';
    } else {
        const sortedHistory = [...task.history].sort((a, b) => b.date - a.date);
        content.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${sortedHistory.map(entry => {
                    const date = new Date(entry.date);
                    return `
                        <div style="padding: 1rem; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                            <div style="font-weight: 600; color: #1f2937;">${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                            <div style="color: #6b7280; font-size: 0.9rem;">${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    modal.classList.add('active');
}

// Make functions globally accessible
window.openGoalProofModal = openGoalProofModal;
window.openGoalHistoryModal = openGoalHistoryModal;
window.submitGoalProof = submitGoalProof;
window.skipGoalProof = skipGoalProof;
