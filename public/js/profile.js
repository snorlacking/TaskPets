document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Failed to fetch user');
        const { user } = await res.json();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }
        document.getElementById('profile-name').textContent = user.name;
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-total-time').textContent = user.totalHoursSpent || 0;
        document.getElementById('profile-total-tasks').textContent = user.totalTasksCompleted || 0;
        document.getElementById('profile-total-coins').textContent = user.totalCoinsEarned || 0;
    } catch (err) {
        console.error('Failed to load profile:', err);
        document.getElementById('profile-error').textContent = 'Failed to load profile information.';
    }
});
