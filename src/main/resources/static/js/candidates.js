// Student ID: 2366790
// Group Name: Jackboys

document.addEventListener('DOMContentLoaded', () => {
    const role = sessionStorage.getItem('role');
    if (!role || role !== 'ROLE_ADMIN') {
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

function loadCandidates() {
    const jobId = document.getElementById('jobSelect').value;
    if (!jobId) return;

    fetch(`/api/candidates/rank/${jobId}`)
        .then(response => response.json())
        .then(candidates => {
            const candidateList = document.getElementById('candidateList');
            candidateList.innerHTML = '';
            candidates.forEach(candidate => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `
                    <span>${candidate.user.username} (${candidate.score.toFixed(2)}%)</span>
                    <button class="btn btn-sm btn-primary" onclick="viewCV('${candidate.user.username}')">View CV</button>
                `;
                candidateList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error loading candidates:', error);
            alert('Failed to load candidates. Please try again.');
        });
}

function viewCV(username) {
    fetch(`/api/files/cv/${username}`)
        .then(response => {
            if (response.ok) {
                return response.text();
            } else {
                throw new Error('CV not found');
            }
        })
        .then(cvContent => {
            const cvText = document.getElementById('cvText');
            cvText.textContent = cvContent;
            document.getElementById('cvPreview').style.display = 'block';
        })
        .catch(error => {
            console.error('Error loading CV:', error);
            alert('Failed to load CV: ' + error.message);
        });
}