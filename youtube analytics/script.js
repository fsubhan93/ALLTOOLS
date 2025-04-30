// API Key
const API_KEY = 'AIzaSyALMeP4d4VjWG-5iNWa0Iw9Enb0fhEwvc4';

// DOM Elements
const channelInput = document.getElementById('channel-input');
const searchBtn = document.getElementById('search-btn');
const analyticsSection = document.getElementById('analytics-section');
const errorMessage = document.getElementById('error-message');
const loading = document.getElementById('loading');

// Channel Data Elements
const channelThumbnail = document.getElementById('channel-thumbnail');
const channelTitle = document.getElementById('channel-title');
const channelDescription = document.getElementById('channel-description');
const channelId = document.getElementById('channel-id');
const channelUrl = document.getElementById('channel-url');
const subscriberCount = document.getElementById('subscriber-count');
const videoCount = document.getElementById('video-count');
const viewCount = document.getElementById('view-count');
const creationDate = document.getElementById('creation-date');
const country = document.getElementById('country');
const channelStatus = document.getElementById('channel-status');
const relatedPlaylists = document.getElementById('related-playlists');
const keywords = document.getElementById('keywords');
const revenue = document.getElementById('revenue');

// Chart variables
let subscriberChart, videoUploadsChart, viewsChart, revenueChart, engagementChart, demographicsChart;

// RPM rates by country
const rpmRates = {
    'US': 7.53,    // United States
    'GB': 5.62,    // United Kingdom
    'NZ': 5.56,    // New Zealand
    'AE': 2.33,    // United Arab Emirates
    'PK': 2.5,     // Pakistan
    'IN': 2.5      // India
};

// Default RPM for other countries
const DEFAULT_RPM = 2.0;

// Event Listeners
searchBtn.addEventListener('click', fetchChannelData);
channelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchChannelData();
});

// Main function to fetch channel data
async function fetchChannelData() {
    const query = channelInput.value.trim();
    if (!query) {
        showError('Please enter a channel name or URL');
        return;
    }

    // Show loading, hide analytics and error
    loading.style.display = 'flex';
    analyticsSection.style.display = 'none';
    hideError();

    try {
        let channelId = await getChannelId(query);
        if (!channelId) {
            showError('Channel not found. Please try another search.');
            return;
        }

        const channelData = await getChannelDetails(channelId);
        displayChannelData(channelData);
        createCharts(channelData);
        analyticsSection.style.display = 'block';
    } catch (error) {
        console.error('Error fetching channel data:', error);
        showError('An error occurred while fetching channel data. Please try again.');
    } finally {
        loading.style.display = 'none';
    }
}

// Get channel ID from search query (could be channel name, URL, or ID)
async function getChannelId(query) {
    // Check if query is a YouTube URL
    let channelId = extractChannelIdFromUrl(query);
    if (channelId) return channelId;

    // If not a URL, search by channel name
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&key=${API_KEY}`;
    
    try {
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            return data.items[0].id.channelId;
        }
        return null;
    } catch (error) {
        console.error('Error searching for channel:', error);
        return null;
    }
}

// Extract channel ID from various YouTube URL formats
function extractChannelIdFromUrl(url) {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        // If it's not a URL, might be a direct channel ID
        return url.length === 24 ? url : null;
    }

    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        const pathname = urlObj.pathname;

        // Handle different URL formats
        if (pathname.startsWith('/channel/')) {
            return pathname.split('/')[2];
        } else if (pathname.startsWith('/c/') || pathname.startsWith('/user/')) {
            // For custom URLs, we'll need to search by the handle
            return null;
        } else if (urlObj.searchParams.get('channel_id')) {
            return urlObj.searchParams.get('channel_id');
        }
    } catch (e) {
        return null;
    }

    return null;
}

// Get detailed channel information
async function getChannelDetails(channelId) {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,status,brandingSettings&id=${channelId}&key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            return data.items[0];
        }
        return null;
    } catch (error) {
        console.error('Error fetching channel details:', error);
        throw error;
    }
}

// Display channel data in the UI
function displayChannelData(channelData) {
    if (!channelData) return;

    const snippet = channelData.snippet || {};
    const stats = channelData.statistics || {};
    const status = channelData.status || {};
    const branding = channelData.brandingSettings || {};

    // Basic info
    channelThumbnail.src = snippet.thumbnails?.high?.url || '';
    channelTitle.textContent = snippet.title || 'N/A';
    channelDescription.textContent = snippet.description || 'No description available';
    channelId.textContent = channelData.id || 'N/A';
    
    // Custom URL (handle)
    const customUrl = branding.channel?.customUrl;
    channelUrl.textContent = customUrl ? `youtube.com/${customUrl}` : 'N/A';
    if (customUrl) {
        channelUrl.innerHTML = `<a href="https://youtube.com/${customUrl}" target="_blank">youtube.com/${customUrl}</a>`;
    }

    // Statistics
    subscriberCount.textContent = stats.subscriberCount ? formatNumber(stats.subscriberCount) : 'Hidden';
    videoCount.textContent = stats.videoCount ? formatNumber(stats.videoCount) : 'N/A';
    viewCount.textContent = stats.viewCount ? formatNumber(stats.viewCount) : 'N/A';

    // Dates
    creationDate.textContent = snippet.publishedAt ? new Date(snippet.publishedAt).toLocaleDateString() : 'N/A';

    // Country and status
    country.textContent = snippet.country || 'N/A';
    
    let statusText = [];
    if (status.privacyStatus) statusText.push(status.privacyStatus);
    if (status.isLinked) statusText.push('Linked');
    if (status.longUploadsStatus) statusText.push('Long uploads enabled');
    channelStatus.textContent = statusText.length > 0 ? statusText.join(', ') : 'N/A';

    // Related playlists
    const playlists = channelData.contentDetails?.relatedPlaylists || {};
    const playlistItems = Object.entries(playlists).map(([key, value]) => `${key}: ${value}`);
    relatedPlaylists.textContent = playlistItems.length > 0 ? playlistItems.join(', ') : 'N/A';

    // Keywords
    const channelKeywords = branding.channel?.keywords || '';
    keywords.textContent = channelKeywords ? channelKeywords.replace(/"/g, '').split(' ').join(', ') : 'N/A';

    // Calculate and display revenue
    calculateRevenue(stats.viewCount, snippet.country);
}

// Format large numbers with commas
function formatNumber(num) {
    return parseInt(num).toLocaleString();
}

// Calculate estimated revenue based on views and country
function calculateRevenue(views, countryCode) {
    if (!views) {
        revenue.textContent = '$0.00';
        return;
    }

    const viewsNum = parseInt(views);
    const rpm = rpmRates[countryCode] || DEFAULT_RPM;
    const estimatedRevenue = (viewsNum / 1000) * rpm; // RPM is revenue per 1000 views
    
    revenue.textContent = `$${estimatedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Create all charts
function createCharts(channelData) {
    // Destroy existing charts if they exist
    if (subscriberChart) subscriberChart.destroy();
    if (videoUploadsChart) videoUploadsChart.destroy();
    if (viewsChart) viewsChart.destroy();
    if (revenueChart) revenueChart.destroy();
    if (engagementChart) engagementChart.destroy();
    if (demographicsChart) demographicsChart.destroy();

    // Generate some placeholder data since we don't have historical data from the API
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last12Months = [...months.slice(currentMonth + 1), ...months.slice(0, currentMonth + 1)].slice(0, 6);
    
    // Subscriber Growth (Line Chart)
    const subscriberData = {
        labels: last12Months,
        datasets: [{
            label: 'Subscribers',
            data: generateRandomData(6, 10000, 500000, true),
            borderColor: '#00ffcc',
            backgroundColor: 'rgba(0, 255, 204, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    subscriberChart = new Chart(
        document.getElementById('subscriber-chart'),
        {
            type: 'line',
            data: subscriberData,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Subscriber Growth (Last 6 Months)'
                    }
                }
            }
        }
    );

    // Video Uploads (Bar Chart)
    const uploadsData = {
        labels: last12Months,
        datasets: [{
            label: 'Videos Uploaded',
            data: generateRandomData(6, 1, 20),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    };

    videoUploadsChart = new Chart(
        document.getElementById('video-uploads-chart'),
        {
            type: 'bar',
            data: uploadsData,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Video Uploads (Last 6 Months)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    );

    // Views Over Time (Pie Chart)
    const viewsData = {
        labels: last12Months,
        datasets: [{
            data: generateRandomData(6, 10000, 500000),
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)'
            ],
            borderWidth: 1
        }]
    };

    viewsChart = new Chart(
        document.getElementById('views-chart'),
        {
            type: 'pie',
            data: viewsData,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Views Distribution (Last 6 Months)'
                    }
                }
            }
        }
    );

    // Revenue Trends (Doughnut Chart)
    const revenueData = {
        labels: last12Months,
        datasets: [{
            data: generateRandomData(6, 100, 5000),
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)'
            ],
            borderWidth: 1
        }]
    };

    revenueChart = new Chart(
        document.getElementById('revenue-chart'),
        {
            type: 'doughnut',
            data: revenueData,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Revenue Trends (Last 6 Months)'
                    }
                }
            }
        }
    );

    // Engagement Metrics (Radar Chart)
    const engagementData = {
        labels: ['Likes', 'Comments', 'Shares', 'Watch Time', 'Click-through'],
        datasets: [{
            label: 'Engagement Metrics',
            data: generateRandomData(5, 1, 100),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
        }]
    };

    engagementChart = new Chart(
        document.getElementById('engagement-chart'),
        {
            type: 'radar',
            data: engagementData,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Engagement Metrics'
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        }
    );

    // Audience Demographics (Polar Area Chart)
    const demographicsData = {
        labels: ['13-17', '18-24', '25-34', '35-44', '45-54', '55+'],
        datasets: [{
            data: generateRandomData(6, 5, 40),
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)'
            ],
            borderWidth: 1
        }]
    };

    demographicsChart = new Chart(
        document.getElementById('demographics-chart'),
        {
            type: 'polarArea',
            data: demographicsData,
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Audience Age Demographics'
                    }
                }
            }
        }
    );
}

// Helper function to generate random data for charts
function generateRandomData(count, min, max, increasing = false) {
    const data = [];
    let lastValue = min;
    
    for (let i = 0; i < count; i++) {
        let value;
        if (increasing) {
            value = lastValue + Math.random() * (max / count);
            lastValue = value;
        } else {
            value = min + Math.random() * (max - min);
        }
        data.push(Math.round(value));
    }
    
    return data;
}

// Error handling functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}