// Student ID: 2366790
// Group Name: Jackboys

document.addEventListener('DOMContentLoaded', () => {
    const role = sessionStorage.getItem('role');
    if (!role || role !== 'ROLE_USER') {
        window.location.href = '/index.html';
    } else {
        fetchJobs();
    }
});

function fetchJobs() {
    fetch('/api/jobs/all')
        .then(response => response.json())
        .then(jobs => {
            const jobSelect = document.getElementById('jobSelect');
            jobs.forEach(job => {
                const option = document.createElement('option');
                option.value = job.id;
                option.textContent = job.description;
                jobSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching jobs:', error);
            alert('Failed to load jobs. Please try again.');
        });
}

function applyJob() {
    const jobId = document.getElementById('jobSelect').value;
    const cvFile = document.getElementById('cvFile').files[0];

    if (!jobId || !cvFile) {
        alert('Please select a job and upload a CV.');
        return;
    }

    const formData = new FormData();
    formData.append('cvFile', cvFile);

    fetch('/api/candidates/apply', {
        method: 'POST',
        headers: {
            'jobId': jobId,
            'username': sessionStorage.getItem('username')
        },
        body: formData
    })
    .then(response => {
        if (response.ok) {
            alert('Application submitted successfully!');
            window.location.href = '/apply-job.html';
        } else {
            return response.text().then(text => { throw new Error(text); });
        }
    })
    .catch(error => {
        console.error('Error applying for job:', error);
        alert('Failed to submit application: ' + error.message);
    });
}