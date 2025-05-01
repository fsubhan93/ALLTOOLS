document.addEventListener('DOMContentLoaded', async function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const convertBtn = document.getElementById('convertBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const status = document.getElementById('status');
    const previewAudio = document.getElementById('previewAudio');
    
    let videoFile = null;
    
    // Initialize FFmpeg
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ 
        log: true,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
    });
    
    // Load FFmpeg
    try {
        status.textContent = "Loading FFmpeg...";
        status.style.display = "block";
        await ffmpeg.load();
        status.style.display = "none";
    } catch (error) {
        showStatus("Failed to load FFmpeg. Please refresh.", "error");
        console.error(error);
        return;
    }
    
    // Drag and drop handlers
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
        dropZone.addEventListener(event, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(event => {
        dropZone.addEventListener(event, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(event => {
        dropZone.addEventListener(event, unhighlight, false);
    });
    
    function highlight() {
        dropZone.style.borderColor = "var(--accent)";
        dropZone.style.backgroundColor = "rgba(255, 77, 77, 0.1)";
    }
    
    function unhighlight() {
        dropZone.style.borderColor = "rgba(255, 255, 255, 0.3)";
        dropZone.style.backgroundColor = "transparent";
    }
    
    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFileSelect);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFile(file);
    }
    
    function handleFileSelect() {
        const file = fileInput.files[0];
        handleFile(file);
    }
    
    function handleFile(file) {
        if (!file.type.startsWith('video/')) {
            showStatus("Please select a video file (MP4, WebM, MOV, AVI)", "error");
            return;
        }
        
        videoFile = file;
        dropZone.innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--success)"></i>
            <h3>${file.name}</h3>
            <p>${formatFileSize(file.size)} | Ready to convert</p>
        `;
        
        // Preview audio (optional)
        const videoURL = URL.createObjectURL(file);
        previewAudio.src = videoURL;
        previewAudio.style.display = "block";
    }
    
    convertBtn.addEventListener('click', convertToMP3);
    
    async function convertToMP3() {
        if (!videoFile) {
            showStatus("Please select a video file first", "error");
            return;
        }
        
        const bitrate = document.getElementById('quality').value;
        const startTime = document.getElementById('startTime').value || 0;
        const endTime = document.getElementById('endTime').value || '';
        
        try {
            convertBtn.disabled = true;
            progressContainer.style.display = "flex";
            showStatus("Converting video to MP3...", "processing");
            
            // Write video file to FFmpeg's virtual file system
            ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(videoFile));
            
            // Run FFmpeg command
            let command = [
                '-i', 'input.mp4',
                '-b:a', `${bitrate}k`,
                '-vn', // Disable video
                '-acodec', 'libmp3lame',
                'output.mp3'
            ];
            
            // Add trim if specified
            if (startTime || endTime) {
                command.splice(2, 0, '-ss', startTime);
                if (endTime) command.splice(6, 0, '-to', endTime);
            }
            
            await ffmpeg.run(...command);
            
            // Read result
            const data = ffmpeg.FS('readFile', 'output.mp3');
            
            // Create download link
            const blob = new Blob([data.buffer], { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = videoFile.name.replace(/\.[^/.]+$/, '') + '.mp3';
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            showStatus("Conversion complete! Download started.", "success");
        } catch (error) {
            console.error(error);
            showStatus("Conversion failed: " + error.message, "error");
        } finally {
            convertBtn.disabled = false;
            progressContainer.style.display = "none";
        }
    }
    
    function showStatus(message, type) {
        status.textContent = message;
        status.style.display = "block";
        status.className = "status " + type;
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + " bytes";
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        else return (bytes / 1048576).toFixed(1) + " MB";
    }
    
    // Progress reporting (FFmpeg doesn't support progress events)
    // This is a simulated progress for better UX
    let progressInterval;
    convertBtn.addEventListener('click', () => {
        let progress = 0;
        progressInterval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress > 90) progress = 90; // FFmpeg will take over at the end
            updateProgress(progress);
        }, 300);
    });
    
    function updateProgress(percent) {
        progressBar.style.width = percent + "%";
        progressText.textContent = Math.round(percent) + "%";
    }
});
