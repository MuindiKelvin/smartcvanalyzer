// Student ID: 2366790
// Group Name: Jackboys

document.addEventListener('DOMContentLoaded', () => {
    const role = sessionStorage.getItem('role');
    if (!role || role !== 'ROLE_USER') {
        window.location.href = '/index.html';
    }
});

function uploadCV() {
    const cvFile = document.getElementById('cvFile').files[0];
    if (!cvFile) {
        alert('Please select a CV file to upload.');
        return;
    }

    const formData = new FormData();
    formData.append('file', cvFile);

    fetch('/api/files/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            return response.text();
        } else {
            return response.text().then(text => { throw new Error(text); });
        }
    })
    .then(fileName => {
        alert('CV uploaded successfully!');
        displayCVContent(cvFile);
    })
    .catch(error => {
        console.error('Error uploading CV:', error);
        alert('Failed to upload CV: ' + error.message);
    });
}

function displayCVContent(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const cvText = document.getElementById('cvText');
        cvText.textContent = e.target.result;
        document.getElementById('cvContent').style.display = 'block';
    };
    reader.readAsText(file);
}