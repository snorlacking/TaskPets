// Global state variables
let petData;
let tasks;
let currentTaskInfo = null;

// Initialize UI
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    console.log('Checking authentication...');
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Fetching from:', `${API_BASE_URL}/auth/me`);
    
    try {
        const authResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            credentials: 'include'
        });
        
        console.log('Auth response status:', authResponse.status);
        console.log('Auth response ok:', authResponse.ok);
        console.log('Auth response headers:', Object.fromEntries(authResponse.headers.entries()));
        console.log('Set-Cookie header:', authResponse.headers.get('set-cookie'));
        console.log('Cookies in document:', document.cookie);
        
        if (!authResponse.ok || authResponse.status === 401) {
            console.error('Auth check failed - status:', authResponse.status);
            const errorText = await authResponse.text();
            console.error('Auth error response:', errorText);
            window.location.href = 'login.html';
            return;
        }
        
        const authData = await authResponse.json();
        console.log('Auth data received:', authData);
        
        if (!authData.user) {
            console.error('Auth check failed - no user in response:', authData);
            window.location.href = 'login.html';
            return;
        }
        
        console.log('Authentication successful, user:', authData.user);
    } catch (error) {
        console.error('Auth check error:', error);
        console.error('Error details:', error.message, error.stack);
        window.location.href = 'login.html';
        return;
    }
    
    // Load data
    petData = await initPetData();
    tasks = await initTasks();
    
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
        currentTaskInfo = null;
    });
    document.getElementById('submit-info').addEventListener('click', async () => {
        const additionalInfo = document.getElementById('additional-info').value.trim();
        if (currentTaskInfo && currentTaskInfo.description) {
            await proceedWithTask(currentTaskInfo.description, additionalInfo);
            document.getElementById('info-modal').classList.remove('active');
            currentTaskInfo = null;
        }
    });
    document.getElementById('skip-info').addEventListener('click', async () => {
        if (currentTaskInfo && currentTaskInfo.description) {
            await proceedWithTask(currentTaskInfo.description, '');
            document.getElementById('info-modal').classList.remove('active');
            currentTaskInfo = null;
        }
    });
    
    // Progress modal
    document.getElementById('close-progress').addEventListener('click', () => {
        document.getElementById('progress-modal').classList.remove('active');
    });
    document.getElementById('cancel-progress').addEventListener('click', cancelProgressModal);
    document.getElementById('update-progress-btn').addEventListener('click', handleUpdateProgress);
    document.getElementById('all-done-btn').addEventListener('click', handleAllDone);
    
    // Pet name input
    const nameInput = document.getElementById('pet-name');
    const nameInputCompact = document.getElementById('pet-name-compact');
    if (nameInput) {
        nameInput.addEventListener('blur', (e) => {
            petData.name = e.target.value || 'My Pet';
            savePetData();
            renderPet();
        });
    }
    if (nameInputCompact) {
        nameInputCompact.addEventListener('blur', (e) => {
            petData.name = e.target.value || 'My Pet';
            savePetData();
            renderPet();
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
window.handleUpdateProgress = handleUpdateProgress;
window.handleAllDone = handleAllDone;
