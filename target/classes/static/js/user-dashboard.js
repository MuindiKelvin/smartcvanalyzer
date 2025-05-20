// Student ID: 2366790
// Group Name: Jackboys

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

    if (!role || role !== 'ROLE_USER' || !username) {
        window.location.href = '/index.html';
    } else {
        fetchJobs();
        loadApplicationHistory();
    }
});

let appliedJobIds = [];

function fetchJobs() {
    const jobList = document.getElementById('jobList');
    const jobSelect = document.getElementById('jobSelect');

    // Null checks for required DOM elements
    if (!jobList || !jobSelect) {
        console.error('Required DOM elements are missing: jobList or jobSelect not found.');
        alert('Error: The page structure is incorrect. Please contact support.');
        return;
    }

    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    fetch('/api/jobs/all', {
        headers: {
            'Authorization': auth
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('You do not have permission to view job listings. Please contact an administrator.');
            }
            return response.text().then(text => { throw new Error(`HTTP ${response.status}: ${text}`); });
        }
        return response.json();
    })
    .then(jobs => {
        console.log('Jobs fetched:', jobs); // Debug log
        jobList.innerHTML = '';
        jobSelect.innerHTML = '<option value="" disabled selected>Select a job to apply</option>';

        if (jobs.length === 0) {
            const div = document.createElement('div');
            div.className = 'col-12 text-center text-muted';
            div.textContent = 'No jobs available.';
            jobList.appendChild(div);
        } else {
            jobs.forEach(job => {
                // Populate job list with collapsible details and apply button
                const div = document.createElement('div');
                div.className = 'col-md-6 col-lg-4 mb-4';
                div.innerHTML = `
                    <div class="dashboard-card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span>${job.description}</span>
                            <button class="btn btn-sm btn-light" onclick="toggleJobDetails(${job.id})">
                                <i class="bi bi-chevron-down" id="toggleIcon${job.id}"></i>
                            </button>
                        </div>
                        <div class="job-details" id="jobDetails${job.id}" style="display: none;">
                            <p><strong>Detailed Description:</strong> ${job.detailedDescription}</p>
                            <p><strong>Criteria:</strong> ${job.criteria}</p>
                        </div>
                        <div class="card-body">
                            <div class="d-flex justify-content-end">
                                ${!appliedJobIds.includes(job.id) ? `
                                    <button class="btn btn-sm btn-primary" onclick="applyForJob(${job.id})" data-bs-toggle="tooltip" title="Apply for this job">
                                        <i class="bi bi-briefcase"></i> Apply
                                    </button>
                                ` : `
                                    <span class="text-muted">Applied</span>
                                `}
                            </div>
                        </div>
                    </div>
                `;
                jobList.appendChild(div);

                // Populate job select dropdown
                const option = document.createElement('option');
                option.value = job.id;
                option.textContent = job.description;
                jobSelect.appendChild(option);
            });
        }

        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    })
    .catch(error => {
        console.error('Error fetching jobs:', error);
        alert('Failed to load jobs: ' + error.message);
        jobList.innerHTML = '<div class="col-12 text-center text-muted">Unable to load jobs at this time.</div>';
    });
}

function toggleJobDetails(jobId) {
    const details = document.getElementById(`jobDetails${jobId}`);
    const icon = document.getElementById(`toggleIcon${jobId}`);
    if (!details || !icon) {
        console.error(`Job details or icon not found for job ID ${jobId}`);
        return;
    }
    if (details.style.display === 'block') {
        details.style.display = 'none';
        icon.className = 'bi bi-chevron-down';
    } else {
        details.style.display = 'block';
        icon.className = 'bi bi-chevron-up';
    }
}

function applyForJob(jobId) {
    const jobSelect = document.getElementById('jobSelect');
    if (!jobSelect) {
        console.error('jobSelect element not found.');
        alert('Error: Cannot apply for job. Page structure is incorrect.');
        return;
    }
    // Set the job select dropdown to the selected job
    jobSelect.value = jobId;
    
    // Open the apply modal
    const applyModal = document.getElementById('applyJobModal');
    if (!applyModal) {
        console.error('Apply job modal not found.');
        alert('Error: Cannot apply for job. Page structure is incorrect.');
        return;
    }
    new bootstrap.Modal(applyModal).show();
}

function applyJob() {
    // Use the elements from the modal if the modal is open, otherwise use the main form
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById('applyJobModal'));
    const isModalOpen = modalInstance && modalInstance._isShown;

    const jobSelect = isModalOpen ? document.querySelector('#applyJobModal #jobSelect') : document.getElementById('jobSelect');
    const cvFileApply = isModalOpen ? document.querySelector('#applyJobModal #cvFileApply') : document.getElementById('cvFileApply');

    if (!jobSelect || !cvFileApply) {
        console.error('Required DOM elements for applying job are missing.');
        alert('Error: Cannot apply for job. Page structure is incorrect.');
        return;
    }

    const jobId = jobSelect.value;
    const cvFile = cvFileApply.files[0];
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));

    if (!jobId || !cvFile) {
        alert('Please select a job and upload a CV.');
        return;
    }

    const progressBar = document.getElementById('progressBar');
    const matchResult = document.getElementById('matchResult');
    if (!progressBar || !matchResult) {
        console.error('Progress bar or match result elements are missing.');
        alert('Error: Page structure is incorrect.');
        return;
    }

    progressBar.style.display = 'block';
    matchResult.style.display = 'none';

    const formData = new FormData();
    formData.append('cvFile', cvFile);
    formData.append('jobId', jobId);

    fetch('/api/users/apply', {
        method: 'POST',
        headers: {
            'Authorization': auth
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => { throw new Error(data.message || 'Unknown error'); });
        }
        return response.json();
    })
    .then(data => {
        progressBar.style.display = 'none';
        alert('Application submitted successfully!');
        loadApplicationHistory();
        fetchJobs(); // Refresh job list to update applied status

        // Display match result
        const matchScoreElement = document.getElementById('matchScore');
        const cvPreview = document.getElementById('cvPreview');
        if (!matchScoreElement || !cvPreview) {
            console.error('Match score or CV preview elements are missing.');
            return;
        }
        const matchScore = data.matchScore;
        const cvText = data.cvText;
        matchScoreElement.textContent = matchScore.toFixed(2);
        cvPreview.textContent = cvText;
        matchResult.style.display = 'block';

        // If match score is below 50%, prompt for feedback
        if (matchScore < 50) {
            const feedbackModal = document.getElementById('feedbackModal');
            if (feedbackModal) {
                new bootstrap.Modal(feedbackModal).show();
            }
        }

        // Close the apply modal if open
        if (isModalOpen) {
            modalInstance.hide();
        }
    })
    .catch(error => {
        progressBar.style.display = "none";
        console.error('Error applying for job:', error);
        alert('Failed to submit application: ' + error.message);
    });
}

function submitFeedback() {
    const satisfied = document.querySelector('input[name="satisfaction"]:checked')?.value;
    const comments = document.getElementById('feedbackComments')?.value;

    if (!satisfied) {
        alert('Please indicate whether you are satisfied with the matching result.');
        return;
    }

    // Simulate sending feedback to the server (in a real system, send to an endpoint)
    console.log('Feedback:', { satisfied, comments });
    alert('Thank you for your feedback!');
    const feedbackModal = document.getElementById('feedbackModal');
    if (feedbackModal) {
        bootstrap.Modal.getInstance(feedbackModal).hide();
    }
}

function uploadCV() {
    const cvFileInput = document.getElementById('cvFile');
    if (!cvFileInput) {
        console.error('CV file input element not found.');
        alert('Error: Cannot upload CV. Page structure is incorrect.');
        return;
    }
    const cvFile = cvFileInput.files[0];
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));

    if (!cvFile) {
        alert('Please select a CV file to upload.');
        return;
    }

    const formData = new FormData();
    formData.append('file', cvFile);

    fetch('/api/files/upload', {
        method: 'POST',
        headers: {
            'Authorization': auth
        },
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

function buildCV() {
    const fullName = document.getElementById('fullName')?.value;
    const email = document.getElementById('email')?.value;
    const phone = document.getElementById('phone')?.value;
    const education = document.getElementById('education')?.value;
    const experience = document.getElementById('experience')?.value;
    const skills = document.getElementById('skills')?.value;
    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));

    if (!fullName || !email || !phone || !education || !experience || !skills) {
        alert('Please fill in all fields to build your CV.');
        return;
    }

    // Generate CV content
    const cvContent = `
Curriculum Vitae
================
Name: ${fullName}
Email: ${email}
Phone: ${phone}

Education
---------
${education}

Experience
----------
${experience}

Skills
------
${skills}
================
    `;

    // Display the generated CV
    const cvGenerated = document.getElementById('cvGenerated');
    const cvGeneratedText = document.getElementById('cvGeneratedText');
    if (!cvGenerated || !cvGeneratedText) {
        console.error('CV generated elements are missing.');
        alert('Error: Cannot display generated CV. Page structure is incorrect.');
        return;
    }
    cvGeneratedText.textContent = cvContent;
    cvGenerated.style.display = 'block';

    // Save the CV to the server
    const blob = new Blob([cvContent], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', blob, `${sessionStorage.getItem('username')}_generated_cv.txt`);

    fetch('/api/files/upload', {
        method: 'POST',
        headers: {
            'Authorization': auth
        },
        body: formData
    })
    .then(response => {
        if (response.ok) {
            alert('CV generated and saved successfully!');
        } else {
            return response.text().then(text => { throw new Error(text); });
        }
    })
    .catch(error => {
        console.error('Error saving generated CV:', error);
        alert('Failed to save generated CV: ' + error.message);
    });
}

function displayCVContent(file) {
    const cvContent = document.getElementById('cvContent');
    const cvText = document.getElementById('cvText');
    if (!cvContent || !cvText) {
        console.error('CV content elements are missing.');
        alert('Error: Cannot display CV content. Page structure is incorrect.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        cvText.textContent = e.target.result;
        cvContent.style.display = 'block';
    };
    reader.readAsText(file);
}

function loadApplicationHistory() {
    const applicationList = document.getElementById('applicationHistoryList');
    if (!applicationList) {
        console.error('Application history list element not found.');
        alert('Error: Cannot load application history. Page structure is incorrect.');
        return;
    }

    const auth = 'Basic ' + btoa(sessionStorage.getItem('username') + ':' + sessionStorage.getItem('password'));
    fetch('/api/users/my-applications', {
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
        applicationList.innerHTML = '';
        appliedJobIds = []; // Reset applied job IDs
        if (applications.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="3" class="text-center text-muted">No applications submitted yet.</td>';
            applicationList.appendChild(tr);
        } else {
            applications.forEach(app => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${app.job.description}</td>
                    <td>${app.cvPath}</td>
                    <td>${app.status}</td>
                `;
                applicationList.appendChild(tr);
                appliedJobIds.push(app.job.id); // Store applied job IDs
            });
        }
        fetchJobs(); // Refresh job list to update applied status
    })
    .catch(error => {
        console.error('Error loading application history:', error);
        alert('Failed to load application history: ' + error.message);
    });
}

function logout() {
    sessionStorage.clear();
    window.location.href = '/index.html';
}