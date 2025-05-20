// Student ID: 2366790
// Group Name: Jackboys

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Validate input
    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }

    const requestBody = {
        username: username,
        password: password
    };

    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || `Login failed (HTTP ${response.status})`);
            }).catch(() => {
                throw new Error(`Login failed (HTTP ${response.status})`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            sessionStorage.setItem('username', username);
            sessionStorage.setItem('password', password); // Store password for Basic Auth in other requests
            sessionStorage.setItem('role', data.role);
            if (data.role === 'ROLE_ADMIN') {
                window.location.href = '/admin-dashboard.html';
            } else if (data.role === 'ROLE_USER') {
                window.location.href = '/user-dashboard.html';
            } else {
                alert('Login failed: Invalid role assigned (' + data.role + '). Please contact the administrator.');
                sessionStorage.clear();
            }
        } else {
            alert('Login failed: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error during login:', error);
        alert('Login failed: ' + error.message);
    });
}

function logout() {
    sessionStorage.clear();
    window.location.href = '/index.html';
}