document.addEventListener('DOMContentLoaded', function() {
    // Tool item click handler
    document.querySelectorAll('.tool-item').forEach(item => {
        item.addEventListener('click', function(e) {
            // Don't trigger if clicking on the "Use Tool" link
            if (!e.target.classList.contains('use-tool')) {
                const toolName = this.querySelector('h3').textContent;
                alert(`${toolName} would open here in a full implementation`);
            }
        });
    });

    // "Use Tool" link click handler
    document.querySelectorAll('.use-tool').forEach(link => {
        link.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent the tool-item click from firing
            const toolName = this.closest('.tool-item').querySelector('h3').textContent;
            alert(`Opening ${toolName} tool...`);
            // In a real implementation, you would navigate to the tool page here
            // window.location.href = `/${toolName.toLowerCase().replace(/\s+/g, '-')}`;
        });
    });

    // Coming soon tool hover effect
    document.querySelectorAll('.coming-soon').forEach(span => {
        span.addEventListener('mouseover', function() {
            this.title = "This tool will be available soon!";
        });
    });
});