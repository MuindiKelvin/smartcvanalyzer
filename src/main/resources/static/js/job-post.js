// Student ID: 2366790
// Group Name: Jackboys

function postJob() {
    const jobDescription = document.getElementById('jobDescription').value;
    const detailedDescription = document.getElementById('detailedDescription').value;
    const criteria = document.getElementById('criteria').value;

    fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: jobDescription,
            description: detailedDescription,
            criteria: criteria
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            alert('Job posted successfully');
            window.location.href = '/candidates.html';
        } else {
            alert('Failed to post job');
        }
    })
    .catch(error => alert('Error: ' + error));
}