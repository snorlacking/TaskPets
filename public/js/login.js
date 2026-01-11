document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('auth-form');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const errorDiv = document.getElementById('auth-error');
    
    // Show error message
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    
    // Hide error message
    function hideError() {
        errorDiv.style.display = 'none';
    }
    
    // Handle login
    async function handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }
        
        hideError();
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
        
        try {
            console.log('Attempting login...');
            console.log('API_BASE_URL:', API_BASE_URL);
            console.log('Login endpoint:', `${API_BASE_URL}/auth/login`);
            
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            
            console.log('Login response status:', response.status);
            console.log('Login response ok:', response.ok);
            console.log('Login response headers:', Object.fromEntries(response.headers.entries()));
            console.log('Set-Cookie header:', response.headers.get('set-cookie'));
            console.log('Cookies after login:', document.cookie);
            
            const data = await response.json();
            console.log('Login response data:', data);
            
            if (!response.ok) {
                console.error('Login failed:', data);
                showError(data.error || 'Login failed');
                loginBtn.disabled = false;
                loginBtn.textContent = 'Sign In';
                return;
            }
            
            console.log('Login successful, redirecting to game.html');
            // Redirect to game
            window.location.href = 'game.html';
        } catch (error) {
            console.error('Login error:', error);
            showError('An error occurred. Please try again.');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    }
    
    // Handle registration
    async function handleRegister() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }
        
        if (password.length < 3) {
            showError('Password must be at least 3 characters long');
            return;
        }
        
        hideError();
        registerBtn.disabled = true;
        registerBtn.textContent = 'Creating...';
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                showError(data.error || 'Registration failed');
                registerBtn.disabled = false;
                registerBtn.textContent = 'Create Account';
                return;
            }
            
            // Redirect to game
            window.location.href = 'game.html';
        } catch (error) {
            console.error('Registration error:', error);
            showError('An error occurred. Please try again.');
            registerBtn.disabled = false;
            registerBtn.textContent = 'Create Account';
        }
    }
    
    // Form submit (login)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });
    
    // Register button
    registerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleRegister();
    });
});
