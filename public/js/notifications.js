// Notification system to replace browser alerts

// Show a notification message
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    notification.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${escapeHtml(message)}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    notificationContainer.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    return notification;
}

// Convenience functions
function showError(message, duration = 5000) {
    return showNotification(message, 'error', duration);
}

function showSuccess(message, duration = 5000) {
    return showNotification(message, 'success', duration);
}

function showWarning(message, duration = 5000) {
    return showNotification(message, 'warning', duration);
}

function showInfo(message, duration = 5000) {
    return showNotification(message, 'info', duration);
}

// Make functions globally accessible
window.showNotification = showNotification;
window.showError = showError;
window.showSuccess = showSuccess;
window.showWarning = showWarning;
window.showInfo = showInfo;
