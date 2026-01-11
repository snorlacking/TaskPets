// Voice input functionality

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// Initialize voice recording
function initVoiceRecording() {
    const voiceBtn = document.getElementById('voice-record-btn');
    if (!voiceBtn) {
        console.error('Voice button not found!');
        return;
    }

    console.log('Voice recording initialized');
    voiceBtn.addEventListener('click', async () => {
        console.log('Voice button clicked, isRecording:', isRecording);
        if (!isRecording) {
            await startRecording();
        } else {
            await stopRecording();
        }
    });
}

// Start recording
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await processVoiceInput(audioBlob);
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        const voiceBtn = document.getElementById('voice-record-btn');
        const voiceIcon = document.getElementById('voice-btn-icon');
        if (voiceBtn) {
            voiceBtn.classList.add('recording');
            if (voiceIcon) voiceIcon.textContent = '⏹️';
        }
    } catch (error) {
        console.error('Error starting recording:', error);
        showError('Error accessing microphone. Please ensure you have granted microphone permissions.');
    }
}

// Stop recording
async function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        const voiceBtn = document.getElementById('voice-record-btn');
        const voiceIcon = document.getElementById('voice-btn-icon');
        if (voiceBtn) {
            voiceBtn.classList.remove('recording');
            if (voiceIcon) voiceIcon.textContent = '🎤';
        }
    }
}

// Process voice input
async function processVoiceInput(audioBlob) {
    showLoading();
    
    try {
        // Step 1: Transcribe audio with Deepgram
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        
        const transcribeResponse = await fetch(`${API_BASE_URL}/voice/transcribe`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        if (!transcribeResponse.ok) {
            const errorData = await transcribeResponse.json();
            throw new Error(errorData.error || 'Failed to transcribe audio');
        }
        
        const transcribeData = await transcribeResponse.json();
        const transcript = transcribeData.transcript;
        
        if (!transcript || !transcript.trim()) {
            hideLoading();
            showError('No speech detected. Please try again.');
            return;
        }
        
        // Step 2: Process transcript with Gemini to create task
        const taskResponse = await fetch(`${API_BASE_URL}/voice/create-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ transcript })
        });
        
        if (!taskResponse.ok) {
            const errorData = await taskResponse.json();
            throw new Error(errorData.error || 'Failed to create task from voice input');
        }
        
        const taskData = await taskResponse.json();
        
        // Step 3: Create the task using the existing task creation flow
        await createTaskFromVoice(taskData);
        
    } catch (error) {
        console.error('Error processing voice input:', error);
        showError(`Error processing voice input: ${error.message}`);
        hideLoading();
    }
}

// Create task from voice input data (with date handling)
async function createTaskFromVoiceWithDate(taskData) {
    try {
        // Create task directly using Gemini's difficulty (don't call difficulty API again)
        const newTask = {
            id: Date.now() + Math.random(),
            description: taskData.title,
            taskDescription: taskData.description || '',
            difficulty: taskData.difficulty || 50,
            completed: false,
            createdAt: Date.now(),
            progress: 0,
            subtasks: [],
            dueDate: taskData.dueDate || null,
            minimized: false,
            timer: {
                isRunning: false,
                startTime: null,
                elapsedTime: 0,
                lastPausedAt: null
            },
            isGoal: taskData.isGoal || false,
            streak: 0,
            history: [],
            lastCompleted: null
        };
        
        tasks.push(newTask);
        await saveTasks();
        renderTasks();
        
        document.getElementById('task-input').value = '';
        document.getElementById('is-goal-checkbox').checked = false;
        
        hideLoading();
        showSuccess('Task created successfully!');
    } catch (error) {
        console.error('Error creating task from voice:', error);
        hideLoading();
        showError('Error creating task. Please try again.');
        throw error;
    }
}

// Create task from voice input data (legacy function, now routes to createTaskFromVoiceWithDate)
async function createTaskFromVoice(taskData) {
    hideLoading();
    
    // If no date and not a goal, show date modal; otherwise create directly
    if (!taskData.dueDate && !taskData.isGoal) {
        // Store taskData for date modal callback
        currentTaskInfo = { taskData, pendingTask: true };
        showDueDateModalForVoice(taskData);
    } else {
        await createTaskFromVoiceWithDate(taskData);
    }
}

// Show due date modal for voice-created tasks
function showDueDateModalForVoice(taskData) {
    const modal = document.getElementById('due-date-modal');
    const dateInput = document.getElementById('due-date-input');
    
    if (!modal || !dateInput) return;
    
    dateInput.value = taskData.dueDate || '';
    modal.classList.add('active');
    
    // Store taskData in currentTaskInfo for the save callback
    if (!currentTaskInfo) currentTaskInfo = {};
    currentTaskInfo.taskData = taskData;
    currentTaskInfo.pendingTask = true;
}

// Make functions globally accessible
window.createTaskFromVoiceWithDate = createTaskFromVoiceWithDate;

// Make functions globally accessible
window.initVoiceRecording = initVoiceRecording;
