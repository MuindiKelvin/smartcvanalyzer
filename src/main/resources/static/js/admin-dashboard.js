document.addEventListener('DOMContentLoaded', () => {
    const role = sessionStorage.getItem('role');
    const username = sessionStorage.getItem('username');
    const password = sessionStorage.getItem('password') || prompt('Please enter your password to access the dashboard:');
    if (!password) {
        alert('Password is required to access the dashboard.');
        logout();
        return;
    }
    sessionStorage.setItem('password', password);

    if (!role || role !== 'ROLE_ADMIN') {
        window.location.href = '/index.html';
    } else {
        loadCVsForApproval();
        loadUsers();
        loadJobs();
        loadApplications();
        fetchJobsForCandidates();
        loadActivityLog();
    }
});

function logActivity(message) {
    const activityLog = document.getElementById('activityLog');
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = `${new Date().toLocaleString()}: ${message}`;
    activityLog.prepend(li);
}

function loadActivityLog() {
    logActivity('Admin logged in');
}

function loadCVsForApproval() {
    const username = sessionStorage.getItem('username');
    const password = sessionStorage.getItem('password');

    fetch('/api/admin/pending-applications', {
        headers: {
            'Authorization': 'Basic ' + btoa(username + ':' + password)
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(applications => {
        const cvList = document.getElementById('cvList');
        cvList.innerHTML = '';
        if (!Array.isArray(applications) || applications.length === 0) {
            cvList.innerHTML = '<li class="list-group-item text-center text-muted">No pending applications found.</li>';
            return;
        }
        applications.forEach(app => {
            if (!app || !app.user || !app.job) {
                console.warn('Invalid application data:', app);
                return;
            }
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span>${app.user.username || 'N/A'} applied for ${app.job.description || 'N/A'}</span>
                <div>
                    <button class="btn btn-sm btn-primary me-2" onclick="viewCV('${app.user.username || ''}')">
                        <i class="bi bi-eye"></i> View CV
                    </button>
                    <button class="btn btn-sm btn-success" onclick="approveCV(${app.id})">
                        <i class="bi bi-check-circle"></i> Approve
                    </button>
                </div>
            `;
            cvList.appendChild(li);
        });
    })
    .catch(error => {
        console.error('Error loading CVs:', error);
        alert('Failed to load CVs for approval: ' + error.message);
    });
}

function viewCV(username) {
    if (!username) {
        alert('Cannot view CV: Username is missing.');
        return;
    }
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    fetch(`/api/files/cv/${username}`, {
        headers: {
            'Authorization': auth
        }
    })
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

function approveCV(applicationId) {
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    fetch(`/api/admin/approve-application/${applicationId}`, {
        method: 'POST',
        headers: {
            'Authorization': auth
        }
    })
    .then(response => {
        if (response.ok) {
            alert('Application approved!');
            logActivity(`Application ID ${applicationId} approved`);
            loadCVsForApproval();
            loadApplications();
        } else {
            throw new Error('Failed to approve application');
        }
    })
    .catch(error => {
        console.error('Error approving application:', error);
        alert(error.message);
    });
}

function loadUsers() {
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    fetch('/api/admin/users', {
        headers: {
            'Authorization': auth
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(users => {
        const userList = document.getElementById('userList');
        userList.innerHTML = '';
        if (!Array.isArray(users) || users.length === 0) {
            userList.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No users found.</td></tr>';
            return;
        }
        users.forEach(user => {
            if (!user || !user.username) {
                console.warn('Invalid user data:', user);
                return;
            }
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.username || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.role || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2" onclick='editUser(${JSON.stringify(user)})'>
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            `;
            userList.appendChild(tr);
        });
    })
    .catch(error => {
        console.error('Error loading users:', error);
        alert('Failed to load users: ' + error.message);
    });
}

function createUser() {
    const username = document.getElementById('createUsername').value;
    const email = document.getElementById('createEmail').value;
    const password = document.getElementById('createPassword').value;
    const role = document.getElementById('createRole').value;
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));

    fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
        },
        body: JSON.stringify({ username, email, password, role })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('User created successfully!');
            logActivity(`User ${username} created`);
            loadUsers();
            bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide();
        } else {
            alert('Failed to create user: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error creating user:', error);
        alert('Failed to create user: ' + error.message);
    });
}

function editUser(user) {
    document.getElementById('updateUserId').value = user.id;
    document.getElementById('updateUsername').value = user.username;
    document.getElementById('updateEmail').value = user.email;
    document.getElementById('updateRole').value = user.role;
    new bootstrap.Modal(document.getElementById('updateUserModal')).show();
}

function updateUser() {
    const id = document.getElementById('updateUserId').value;
    const username = document.getElementById('updateUsername').value;
    const email = document.getElementById('updateEmail').value;
    const role = document.getElementById('updateRole').value;
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));

    fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
        },
        body: JSON.stringify({ username, email, role })
    })
    .then(response => {
        if (response.ok) {
            alert('User updated successfully!');
            logActivity(`User ${username} updated`);
            loadUsers();
            bootstrap.Modal.getInstance(document.getElementById('updateUserModal')).hide();
        } else {
            throw new Error('Failed to update user');
        }
    })
    .catch(error => {
        console.error('Error updating user:', error);
        alert(error.message);
    });
}

function deleteUser(userId) {
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    if (confirm('Are you sure you want to delete this user?')) {
        fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': auth
            }
        })
        .then(response => {
            if (response.ok) {
                alert('User deleted!');
                logActivity(`User ID ${userId} deleted`);
                loadUsers();
            } else {
                throw new Error('Failed to delete user');
            }
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            alert(error.message);
        });
    }
}

let allJobs = [];

function loadJobs() {
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    fetch('/api/jobs/all', {
        headers: {
            'Authorization': auth
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`HTTP ${response.status}: ${text}`); });
        }
        return response.json();
    })
    .then(jobs => {
        allJobs = jobs;
        displayJobs(jobs);
    })
    .catch(error => {
        console.error('Error loading jobs:', error);
        alert('Failed to load jobs: ' + error.message);
    });
}

function displayJobs(jobs) {
    const jobList = document.getElementById('jobList');
    jobList.innerHTML = '';
    if (!Array.isArray(jobs) || jobs.length === 0) {
        const div = document.createElement('div');
        div.className = 'col-12 text-center text-muted';
        div.textContent = 'No jobs available.';
        jobList.appendChild(div);
        return;
    }
    jobs.forEach(job => {
        if (!job || !job.description) {
            console.warn('Invalid job data:', job);
            return;
        }
        const div = document.createElement('div');
        div.className = 'col-md-6 col-lg-4 mb-4';
        div.innerHTML = `
            <div class="dashboard-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span>${job.description || 'N/A'}</span>
                    <button class="btn btn-sm btn-light" onclick="toggleJobDetails(${job.id})">
                        <i class="bi bi-chevron-down" id="toggleIcon${job.id}"></i>
                    </button>
                </div>
                <div class="job-details" id="jobDetails${job.id}">
                    <p><strong>Detailed Description:</strong> ${job.detailedDescription || 'N/A'}</p>
                    <p><strong>Criteria:</strong> ${job.criteria || 'N/A'}</p>
                    <p><strong>Applications:</strong> ${(job.applications && Array.isArray(job.applications) ? job.applications.length : 0)}</p>
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-end">
                        <button class="btn btn-sm btn-warning me-2" onclick='editJob(${JSON.stringify(job)})' data-bs-toggle="tooltip" title="Edit Job">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteJob(${job.id})" data-bs-toggle="tooltip" title="Delete Job">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        jobList.appendChild(div);
    });
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function toggleJobDetails(jobId) {
    const details = document.getElementById(`jobDetails${jobId}`);
    const icon = document.getElementById(`toggleIcon${jobId}`);
    if (details.style.display === 'block') {
        details.style.display = 'none';
        icon.className = 'bi bi-chevron-down';
    } else {
        details.style.display = 'block';
        icon.className = 'bi bi-chevron-up';
    }
}

function filterJobs() {
    const searchTerm = document.getElementById('jobSearch').value.toLowerCase();
    const filteredJobs = allJobs.filter(job =>
        (job.description && job.description.toLowerCase().includes(searchTerm)) ||
        (job.detailedDescription && job.detailedDescription.toLowerCase().includes(searchTerm)) ||
        (job.criteria && job.criteria.toLowerCase().includes(searchTerm))
    );
    displayJobs(filteredJobs);
}

function createJob() {
    const description = document.getElementById('createJobDescription').value;
    const detailedDescription = document.getElementById('createJobDetailedDescription').value;
    const criteria = document.getElementById('createJobCriteria').value;
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));

    fetch('/api/jobs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
        },
        body: JSON.stringify({ description, detailedDescription, criteria })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`HTTP ${response.status}: ${text}`); });
        }
        return response.json();
    })
    .then(job => {
        alert('Job created successfully!');
        logActivity(`Job ${description} created`);
        loadJobs();
        fetchJobsForCandidates();
        bootstrap.Modal.getInstance(document.getElementById('createJobModal')).hide();
    })
    .catch(error => {
        console.error('Error creating job:', error);
        alert('Failed to create job: ' + error.message);
    });
}

function editJob(job) {
    document.getElementById('updateJobId').value = job.id;
    document.getElementById('updateJobDescription').value = job.description;
    document.getElementById('updateJobDetailedDescription').value = job.detailedDescription;
    document.getElementById('updateJobCriteria').value = job.criteria;
    new bootstrap.Modal(document.getElementById('updateJobModal')).show();
}

function updateJob() {
    const id = document.getElementById('updateJobId').value;
    const description = document.getElementById('updateJobDescription').value;
    const detailedDescription = document.getElementById('updateJobDetailedDescription').value;
    const criteria = document.getElementById('updateJobCriteria').value;
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));

    fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
        },
        body: JSON.stringify({ id, description, detailedDescription, criteria })
    })
    .then(response => {
        if (response.ok) {
            alert('Job updated successfully!');
            logActivity(`Job ${description} updated`);
            loadJobs();
            fetchJobsForCandidates();
            bootstrap.Modal.getInstance(document.getElementById('updateJobModal')).hide();
        } else {
            throw new Error('Failed to update job');
        }
    })
    .catch(error => {
        console.error('Error updating job:', error);
        alert(error.message);
    });
}

function deleteJob(jobId) {
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    if (confirm('Are you sure you want to delete this job?')) {
        fetch(`/api/jobs/${jobId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': auth
            }
        })
        .then(response => {
            if (response.ok) {
                alert('Job deleted!');
                logActivity(`Job ID ${jobId} deleted`);
                loadJobs();
                fetchJobsForCandidates();
            } else {
                throw new Error('Failed to delete job');
            }
        })
        .catch(error => {
            console.error('Error deleting job:', error);
            alert(error.message);
        });
    }
}

function loadApplications() {
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    fetch('/api/admin/applications', {
        headers: {
            'Authorization': auth
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`HTTP ${response.status}: ${text}`); });
        }
        return response.json();
    })
    .then(applications => {
        const applicationList = document.getElementById('applicationList');
        applicationList.innerHTML = '';
        if (!Array.isArray(applications) || applications.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="6" class="text-center text-muted">No applications available.</td>';
            applicationList.appendChild(tr);
            return;
        }
        applications.forEach(app => {
            if (!app || !app.user || !app.job) {
                console.warn('Invalid application data:', app);
                return;
            }
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${app.user.username || 'N/A'}</td>
                <td>${app.job.description || 'N/A'}</td>
                <td>${app.cvPath || 'N/A'}</td>
                <td>${app.status || 'N/A'}</td>
                <td>
                    ${app.status === 'PENDING' ? `
                        <button class="btn btn-sm btn-success me-2" onclick="approveApplication(${app.id})">
                            <i class="bi bi-check-circle"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-warning me-2" onclick="rejectApplication(${app.id})">
                            <i class="bi bi-x-circle"></i> Reject
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteApplication(${app.id})">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewCandidatesForJob(${app.job.id}, '${app.job.description || 'N/A'}')" data-bs-toggle="modal" data-bs-target="#viewCandidatesModal">
                        <i class="bi bi-award"></i> View Candidates
                    </button>
                </td>
            `;
            applicationList.appendChild(tr);
        });
    })
    .catch(error => {
        console.error('Error loading applications:', error);
        alert('Failed to load applications: ' + error.message);
    });
}

function approveApplication(applicationId) {
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    fetch(`/api/admin/approve-application/${applicationId}`, {
        method: 'POST',
        headers: {
            'Authorization': auth
        }
    })
    .then(response => {
        if (response.ok) {
            alert('Application approved!');
            logActivity(`Application ID ${applicationId} approved`);
            loadApplications();
            loadCVsForApproval();
        } else {
            throw new Error('Failed to approve application');
        }
    })
    .catch(error => {
        console.error('Error approving application:', error);
        alert(error.message);
    });
}

function rejectApplication(applicationId) {
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    fetch(`/api/admin/reject-application/${applicationId}`, {
        method: 'POST',
        headers: {
            'Authorization': auth
        }
    })
    .then(response => {
        if (response.ok) {
            alert('Application rejected!');
            logActivity(`Application ID ${applicationId} rejected`);
            loadApplications();
            loadCVsForApproval();
        } else {
            throw new Error('Failed to reject application');
        }
    })
    .catch(error => {
        console.error('Error rejecting application:', error);
        alert(error.message);
    });
}

function deleteApplication(applicationId) {
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    if (confirm('Are you sure you want to delete this application?')) {
        fetch(`/api/admin/applications/${applicationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': auth
            }
        })
        .then(response => {
            if (response.ok) {
                alert('Application deleted!');
                logActivity(`Application ID ${applicationId} deleted`);
                loadApplications();
                loadCVsForApproval();
            } else {
                throw new Error('Failed to delete application');
            }
        })
        .catch(error => {
            console.error('Error deleting application:', error);
            alert(error.message);
        });
    }
}

function viewCandidatesForJob(jobId, jobDescription) {
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    fetch(`/api/candidates/rank/${jobId}`, {
        headers: {
            'Authorization': auth
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`HTTP ${response.status}: ${text}`); });
        }
        return response.json();
    })
    .then(candidates => {
        const candidatesList = document.getElementById('candidatesForJobList');
        candidatesList.innerHTML = '';
        document.getElementById('viewCandidatesModalLabel').textContent = `Candidates for ${jobDescription || 'Unknown Job'}`;
        if (!Array.isArray(candidates) || candidates.length === 0) {
            const li = document.createElement('li');
            li.className = 'list-group-item text-center text-muted';
            li.textContent = 'No candidates available.';
            candidatesList.appendChild(li);
            return;
        }
        candidates.forEach(candidate => {
            if (!candidate || !candidate.user || !candidate.user.username) {
                console.warn('Invalid candidate data:', candidate);
                return;
            }
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span>${candidate.user.username} (${candidate.score ? candidate.score.toFixed(2) : 'N/A'}%)</span>
                <button class="btn btn-sm btn-primary" onclick="viewCV('${candidate.user.username}')">
                    <i class="bi bi-eye"></i> View CV
                </button>
            `;
            candidatesList.appendChild(li);
        });
    })
    .catch(error => {
        console.error('Error loading candidates:', error);
        alert('Failed to load candidates: ' + error.message);
    });
}

function fetchJobsForCandidates() {
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    fetch('/api/jobs/all', {
        headers: {
            'Authorization': auth
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`HTTP ${response.status}: ${text}`); });
        }
        return response.json();
    })
    .then(jobs => {
        const jobSelect = document.getElementById('jobSelectCandidates');
        jobSelect.innerHTML = '<option value="" disabled selected>Select a job</option>';
        if (!Array.isArray(jobs) || jobs.length === 0) {
            console.warn('No jobs found for candidate selection');
            return;
        }
        jobs.forEach(job => {
            if (!job || !job.description) {
                console.warn('Invalid job data:', job);
                return;
            }
            const option = document.createElement('option');
            option.value = job.id;
            option.textContent = job.description;
            jobSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error fetching jobs:', error);
        alert('Failed to load jobs: ' + error.message);
    });
}

function loadCandidates() {
    const jobId = document.getElementById('jobSelectCandidates').value;
    if (!jobId) {
        alert('Please select a job to view candidates.');
        return;
    }

    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    fetch(`/api/candidates/rank/${jobId}`, {
        headers: {
            'Authorization': auth
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`HTTP ${response.status}: ${text}`); });
        }
        return response.json();
    })
    .then(candidates => {
        const candidateList = document.getElementById('candidateList');
        candidateList.innerHTML = '';
        if (!Array.isArray(candidates) || candidates.length === 0) {
            const li = document.createElement('li');
            li.className = 'list-group-item text-center text-muted';
            li.textContent = 'No candidates available.';
            candidateList.appendChild(li);
            return;
        }
        candidates.forEach(candidate => {
            if (!candidate || !candidate.user || !candidate.user.username) {
                console.warn('Invalid candidate data:', candidate);
                return;
            }
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <span>${candidate.user.username} (${candidate.score ? candidate.score.toFixed(2) : 'N/A'}%)</span>
                <button class="btn btn-sm btn-primary" onclick="viewCV('${candidate.user.username}')">
                    <i class="bi bi-eye"></i> View CV
                </button>
            `;
            candidateList.appendChild(li);
        });
    })
    .catch(error => {
        console.error('Error loading candidates:', error);
        alert('Failed to load candidates: ' + error.message);
    });
}

function logout() {
    sessionStorage.clear();
    window.location.href = '/index.html';
}