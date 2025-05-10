document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Privacy acceptance checkbox functionality
    const privacyAcceptCheckbox = document.getElementById('privacy-accept-checkbox');
    const privacyAcceptButton = document.getElementById('privacy-accept-button');
    
    privacyAcceptCheckbox.addEventListener('change', function() {
        privacyAcceptButton.disabled = !this.checked;
    });
    
    privacyAcceptButton.addEventListener('click', function() {
        // In a real implementation, you would store this acceptance
        alert('Thank you for accepting our Privacy Policy!');
        // You might redirect or close a modal here
        // window.location.href = '/';
        
        // Example: Set a cookie to remember acceptance
        // document.cookie = "privacy_accepted=true; max-age=2592000; path=/"; // 30 days
    });
    
    // For demo purposes - in a real site, this would come from your backend
    const lastUpdatedElement = document.getElementById('last-updated');
    const lastUpdated = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    lastUpdatedElement.textContent = lastUpdated;
    
    // Example cookie preference center functionality
    const cookiePrefs = {
        init: function() {
            // Check if preferences are already set
            this.loadPreferences();
            
            // Set up event listeners for cookie toggles
            document.querySelectorAll('.cookie-toggle input').forEach(toggle => {
                toggle.addEventListener('change', this.savePreferences.bind(this));
            });
        },
        
        loadPreferences: function() {
            // In a real implementation, load from cookies/localStorage
            // This is just a demo
            document.getElementById('essential-cookies').checked = true;
            document.getElementById('essential-cookies').disabled = true;
            document.getElementById('analytics-cookies').checked = this.getPreference('analytics') !== 'false';
            document.getElementById('preference-cookies').checked = this.getPreference('preference') !== 'false';
        },
        
        savePreferences: function() {
            // In a real implementation, save to cookies/localStorage
            const analytics = document.getElementById('analytics-cookies').checked;
            const preference = document.getElementById('preference-cookies').checked;
            
            // Example: Set cookies with preferences
            // document.cookie = `analytics_cookies=${analytics}; max-age=2592000; path=/`;
            // document.cookie = `preference_cookies=${preference}; max-age=2592000; path=/`;
            
            alert('Cookie preferences saved!');
        },
        
        getPreference: function(name) {
            // Simplified for demo - would parse cookies in real implementation
            return localStorage.getItem(`cookie_${name}`) || 'true';
        }
    };
    
    // Initialize if cookie prefs element exists
    if (document.querySelector('.cookie-prefs')) {
        cookiePrefs.init();
    }
    
    // Example data request functionality
    document.getElementById('request-data-btn')?.addEventListener('click', function() {
        alert('In a real implementation, this would initiate a data request process.');
        // Would typically open a form or send an API request
    });
});
