// Global state variables
let petData = {};
let tasks = [];
let currentTaskInfo = null;

// Initialize UI
document.addEventListener('DOMContentLoaded', async () => {
    await fetchUserData();
    await fetchTasks();
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
        // Keep the expanded pet box visible at all times.
        // This makes the UI robust even if the compact header exists or is later re-enabled.
        if (!expanded) {
            ticking = false;
            return;
        }

        // Always show expanded view and hide compact view (if present)
        expanded.style.display = 'block';
        if (compact) compact.style.display = 'none';

        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(handleScroll);
            ticking = true;
        }
    });
});

async function fetchUserData() {
    try {
        const res = await fetch('/api/pet');
        if (res.ok) {
            const { pet } = await res.json();
            if (pet) {
                petData = pet;
            } else {
                window.location.href = '/login.html';
            }
        } else {
            window.location.href = '/login.html';
        }
    } catch (err) {
        console.error('Failed to fetch pet data', err);
        window.location.href = '/login.html';
    }
}

async function fetchTasks() {
    try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
            tasks = await res.json();
        } else {
            console.error('Failed to fetch tasks');
        }
    } catch (err) {
        console.error('Failed to fetch tasks', err);
    }
}

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
// Save pet data to backend
async function savePetData() {
    try {
        const res = await fetch('/api/pet', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(petData)
        });
        if (!res.ok) {
            throw new Error('Failed to save pet data');
        }
    } catch (err) {
        console.error('Error saving pet data:', err);
    }
}
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