// Show Loading
function showLoading() {
    document.getElementById('loading-overlay').classList.add('active');
}

// Hide Loading
function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
