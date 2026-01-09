document.addEventListener('DOMContentLoaded', function() {
    console.log('Language School website loaded');
});

function showAlert(type, message) {
    const container = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = 'alert alert-' + type + ' alert-dismissible fade show';
    alert.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
    container.appendChild(alert);
    setTimeout(function() {
        alert.classList.remove('show');
        setTimeout(function() {
            alert.remove();
        }, 150);
    }, 5000);
}

