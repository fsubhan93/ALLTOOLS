document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Acceptance checkbox functionality
    const acceptCheckbox = document.getElementById('accept-checkbox');
    const acceptButton = document.getElementById('accept-button');
    
    acceptCheckbox.addEventListener('change', function() {
        acceptButton.disabled = !this.checked;
    });
    
    acceptButton.addEventListener('click', function() {
        // In a real implementation, you would store this acceptance
        alert('Thank you for accepting our Terms of Use!');
        // You might redirect or close a modal here
        // window.location.href = '/';
    });
    
    // Scroll to top when printing
    window.onbeforeprint = function() {
        window.scrollTo(0, 0);
    };
    
    // For demo purposes - in a real site, this would come from your backend
    const lastUpdatedElement = document.getElementById('last-updated');
    const lastUpdated = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    lastUpdatedElement.textContent = lastUpdated;
});
