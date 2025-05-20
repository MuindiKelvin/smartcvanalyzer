// Student ID: 2366790
// Group Name: Jackboys

function resetPassword() {
    const email = document.getElementById('email').value;

    fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Password reset instructions have been sent to your email. (Simulated)');
            window.location.href = '/index.html';
        } else {
            alert('Failed to reset password: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error during password reset:', error);
        alert('An error occurred. Please try again.');
    });
}