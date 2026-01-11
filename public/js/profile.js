document.addEventListener('DOMContentLoaded', async () => {
    const errorDiv = document.getElementById('profile-error');
    const loadingDiv = document.getElementById('profile-loading');
    const contentDiv = document.getElementById('profile-content');
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            credentials: 'include'
        });
        
        if (response.status === 401) {
            // Not authenticated, redirect to login
            window.location.href = 'login.html';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        
        // Display profile data
        document.getElementById('profile-username').textContent = data.username || 'Unknown';
        document.getElementById('profile-coins').textContent = (data.totalCoinsGained || 0).toLocaleString();
        document.getElementById('profile-tasks').textContent = (data.totalTasksCompleted || 0).toLocaleString();
        
        // Show content, hide loading
        loadingDiv.style.display = 'none';
        contentDiv.style.display = 'block';
    } catch (error) {
        console.error('Error loading profile:', error);
        loadingDiv.style.display = 'none';
        errorDiv.textContent = 'Failed to load profile information.';
        errorDiv.style.display = 'block';
        
        // Redirect to login after a delay if it's an auth error
        if (error.message.includes('401') || error.message.includes('Authentication')) {
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    }
});
