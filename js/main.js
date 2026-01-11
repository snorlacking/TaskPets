// Global state variables
let petData = initPetData();
let tasks = initTasks();
let currentTaskInfo = null;

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    // Reload pet data on page load (in case we returned from shop page)
    petData = initPetData();
    renderPet();
    renderTasks();
    setupEventListeners();
    updateStatDecay();
    setInterval(updateStatDecay, 60000); // Update every minute
    
    // Initialize pet section display
    const expanded = document.getElementById('pet-section-expanded');
    const compact = document.getElementById('header-compact');
    if (expanded) expanded.style.display = 'block';
    if (compact) compact.style.display = 'none';
    
    // Scroll handler for pet section
    let ticking = false;
    
    function handleScroll() {
        if (!expanded || !compact) return;
        
        const expandedRect = expanded.getBoundingClientRect();
        const topBarHeight = 70;
        
        if (expandedRect.bottom <= topBarHeight) {
            if (expanded.style.display !== 'none') {
                expanded.style.display = 'none';
                compact.style.display = 'flex';
            }
        } else {
            if (compact.style.display !== 'none') {
                compact.style.display = 'none';
                expanded.style.display = 'block';
            }
        }
        
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(handleScroll);
            ticking = true;
        }
    });
});

// Setup Event Listeners
function setupEventListeners() {
    // Task form
    document.getElementById('task-form').addEventListener('submit', handleAddTask);
    
    // Import tasks button
    document.getElementById('import-tasks-btn').addEventListener('click', handleImportTasks);
    document.getElementById('close-import').addEventListener('click', () => {
        document.getElementById('import-modal').classList.remove('active');
    });
    document.getElementById('cancel-import').addEventListener('click', () => {
        document.getElementById('import-modal').classList.remove('active');
    });
    document.getElementById('import-from-url-btn').addEventListener('click', handleImportFromURL);
    document.getElementById('import-from-file-btn').addEventListener('click', handleImportFromFile);
    
    // Due date modal
    const dueDateModal = document.getElementById('due-date-modal');
    if (dueDateModal) {
        document.getElementById('close-due-date').addEventListener('click', () => {
            dueDateModal.classList.remove('active');
            currentTaskInfo = null;
        });
        document.getElementById('skip-due-date').addEventListener('click', () => {
            dueDateModal.classList.remove('active');
            currentTaskInfo = null;
        });
        document.getElementById('save-due-date').addEventListener('click', () => {
            const dateInput = document.getElementById('due-date-input');
            const dateValue = dateInput.value;
            if (currentTaskInfo && currentTaskInfo.id) {
                const task = tasks.find(t => t.id === currentTaskInfo.id);
                if (task) {
                    task.dueDate = dateValue || null;
                    saveTasks();
                    renderTasks();
                }
            }
            dueDateModal.classList.remove('active');
            currentTaskInfo = null;
        });
    }
    
    // Info modal
    document.getElementById('close-info').addEventListener('click', () => {
        document.getElementById('info-modal').classList.remove('active');
    });
    document.getElementById('skip-info').addEventListener('click', () => {
        document.getElementById('info-modal').classList.remove('active');
        if (currentTaskInfo) {
            proceedWithTask(currentTaskInfo.description);
        }
    });
    document.getElementById('submit-info').addEventListener('click', () => {
        const additionalInfo = document.getElementById('additional-info').value;
        if (currentTaskInfo) {
            const taskDescription = additionalInfo || '';
            document.getElementById('info-modal').classList.remove('active');
            proceedWithTask(currentTaskInfo.description, taskDescription);
        }
    });
    
    // Progress modal
    document.getElementById('close-progress').addEventListener('click', () => {
        cancelProgressModal();
    });
    document.getElementById('cancel-progress').addEventListener('click', () => {
        cancelProgressModal();
    });
    document.getElementById('update-progress-btn').addEventListener('click', handleUpdateProgress);
    document.getElementById('all-done-btn').addEventListener('click', handleAllDone);
    
    // Pet name (both views)
    const nameInput = document.getElementById('pet-name');
    const nameInputCompact = document.getElementById('pet-name-compact');
    if (nameInput) {
        nameInput.addEventListener('change', (e) => {
            petData.name = e.target.value;
            if (nameInputCompact) nameInputCompact.value = e.target.value;
            savePetData();
        });
    }
    if (nameInputCompact) {
        nameInputCompact.addEventListener('change', (e) => {
            petData.name = e.target.value;
            if (nameInput) nameInput.value = e.target.value;
            savePetData();
        });
    }
}

// Make functions globally accessible for onclick handlers
window.handleDeleteTask = handleDeleteTask;
window.generateSubtasks = generateSubtasks;
window.toggleSubtask = toggleSubtask;
window.updateSubtaskText = updateSubtaskText;
window.deleteSubtask = deleteSubtask;
window.addSubtask = addSubtask;
window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.cancelProgressModal = cancelProgressModal;
window.toggleTaskDescription = toggleTaskDescription;
window.updateTaskDescription = updateTaskDescription;
window.toggleTaskMinimize = toggleTaskMinimize;
window.handleImportTasks = handleImportTasks;
window.handleImportFromURL = handleImportFromURL;
window.handleImportFromFile = handleImportFromFile;
