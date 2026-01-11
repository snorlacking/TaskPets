document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const submitBtn = document.getElementById('submitBtn');
  const googleBtn = document.getElementById('googleBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    if (!username) return alert('Please enter a name');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      if (!res.ok) throw new Error('Login failed');
  const { user } = await res.json();
  window.location.href = '/game.html';
    } catch (err) {
      console.error(err);
      alert('Login failed. See console for details.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign in';
    }
  });

  googleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/api/auth/google';
  });
});
