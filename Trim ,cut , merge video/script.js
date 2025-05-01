document.addEventListener('DOMContentLoaded', async function() {
    // Initialize FFmpeg
    const { createFFmpeg, fetchFile } = FFmpeg;
    const ffmpeg = createFFmpeg({ 
        log: true,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
    });

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Initialize trim video functionality
    const trimFileInput = document.getElementById('trimFileInput');
    const trimDropZone = document.getElementById('trimDropZone');
    const trimVideo = document.getElementById('trimVideo');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const trimRange = document.getElementById('trimRange');
    const trimBtn = document.getElementById('trimBtn');
    
    // Initialize merge videos functionality
    const mergeFileInput = document.getElementById('mergeFileInput');
    const mergeDropZone = document.getElementById('mergeDropZone');
    const videoList = document.getElementById('videoList');
    const mergeBtn = document.getElementById('mergeBtn');
    
    // Common elements
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const status = document.getElementById('status');
    
    let videosToMerge = [];
    
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
    
    // ==================== TRIM VIDEO ==================== //
    setupFileUpload(trimDropZone, trimFileInput, handleTrimFile);
    
    function handleTrimFile(file) {
        if (!file.type.startsWith('video/')) {
            showStatus("Please select a video file", "error");
            return;
        }
        
        const videoURL = URL.createObjectURL(file);
        trimVideo.src = videoURL;
        
        trimVideo.onloadedmetadata = () => {
            endTimeInput.value = Math.floor(trimVideo.duration);
            trimRange.max = Math.floor(trimVideo.duration);
        };
        
        trimRange.addEventListener('input', () => {
            startTimeInput.value = trimRange.value;
            trimVideo.currentTime = trimRange.value;
        });
        
        startTimeInput.addEventListener('change', () => {
            trimRange.value = startTimeInput.value;
            trimVideo.currentTime = startTimeInput.value;
        });
        
        endTimeInput.addEventListener('change', () => {
            if (parseFloat(endTimeInput.value) > trimVideo.duration) {
                endTimeInput.value = Math.floor(trimVideo.duration);
            }
        });
        
        trimDropZone.innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--success)"></i>
            <h3>${file.name}</h3>
            <p>Ready to trim</p>
        `;
    }
    
    trimBtn.addEventListener('click', async () => {
        if (!trimVideo.src) {
            showStatus("Please select a video first", "error");
            return;
        }
        
        const start = parseFloat(startTimeInput.value);
        const end = parseFloat(endTimeInput.value);
        
        if (start >= end) {
            showStatus("End time must be after start time", "error");
            return;
        }
        
        try {
            trimBtn.disabled = true;
            progressContainer.style.display = "flex";
            showStatus("Trimming video...", "processing");
            
            // Fetch the video file
            const file = trimFileInput.files[0];
            ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));
            
            // Run FFmpeg command to trim
            await ffmpeg.run(
                '-i', 'input.mp4',
                '-ss', startTimeInput.value,
                '-to', endTimeInput.value,
                '-c', 'copy',
                'output.mp4'
            );
            
            // Get the result
            const data = ffmpeg.FS('readFile', 'output.mp4');
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `trimmed_${file.name}`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            showStatus("Video trimmed successfully!", "success");
        } catch (error) {
            console.error(error);
            showStatus("Error trimming video: " + error.message, "error");
        } finally {
            trimBtn.disabled = false;
            progressContainer.style.display = "none";
        }
    });
    
    // ==================== MERGE VIDEOS ==================== //
    setupFileUpload(mergeDropZone, mergeFileInput, handleMergeFiles, true);
    
    function handleMergeFiles(files) {
        videosToMerge = Array.from(files).filter(file => file.type.startsWith('video/'));
        
        if (videosToMerge.length < 2) {
            showStatus("Please select at least 2 videos to merge", "error");
            return;
        }
        
        videoList.innerHTML = '';
        videosToMerge.forEach((file, index) => {
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';
            videoItem.innerHTML = `
                <i class="fas fa-video"></i>
                <div class="video-info">
                    <h4>${file.name}</h4>
                    <p>${formatFileSize(file.size)}</p>
                </div>
                <button class="remove-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            videoList.appendChild(videoItem);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.getAttribute('data-index');
                videosToMerge.splice(index, 1);
                handleMergeFiles(videosToMerge);
            });
        });
    }
    
    mergeBtn.addEventListener('click', async () => {
        if (videosToMerge.length < 2) {
            showStatus("Please select at least 2 videos", "error");
            return;
        }
        
        try {
            mergeBtn.disabled = true;
            progressContainer.style.display = "flex";
            showStatus("Merging videos...", "processing");
            
            // Sort videos if needed
            if (document.getElementById('mergeOrder').value === 'alphabetical') {
                videosToMerge.sort((a, b) => a.name.localeCompare(b.name));
            }
            
            // Write all videos to FFmpeg FS
            for (let i = 0; i < videosToMerge.length; i++) {
                ffmpeg.FS('writeFile', `input${i}.mp4`, await fetchFile(videosToMerge[i]));
                updateProgress((i + 1) / videosToMerge.length * 50);
            }
            
            // Create a text file with the merge list
            const mergeList = videosToMerge.map((_, i) => `file 'input${i}.mp4'`).join('\n');
            ffmpeg.FS('writeFile', 'merge.txt', mergeList);
            
            // Run FFmpeg command to merge
            await ffmpeg.run(
                '-f', 'concat',
                '-i', 'merge.txt',
                '-c', 'copy',
                'output.mp4'
            );
            
            // Get the result
            const data = ffmpeg.FS('readFile', 'output.mp4');
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `merged_${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            showStatus("Videos merged successfully!", "success");
        } catch (error) {
            console.error(error);
            showStatus("Error merging videos: " + error.message, "error");
        } finally {
            mergeBtn.disabled = false;
            progressContainer.style.display = "none";
        }
    });
    
    // ==================== HELPER FUNCTIONS ==================== //
    function setupFileUpload(dropZone, fileInput, callback, multiple = false) {
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
            dropZone.style.backgroundColor = "rgba(255, 65, 108, 0.1)";
        }
        
        function unhighlight() {
            dropZone.style.borderColor = "rgba(255, 255, 255, 0.3)";
            dropZone.style.backgroundColor = "transparent";
        }
        
        dropZone.addEventListener('drop', handleDrop, false);
        fileInput.addEventListener('change', handleFileSelect);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (multiple) {
                callback(files);
            } else {
                callback(files[0]);
            }
        }
        
        function handleFileSelect() {
            const files = fileInput.files;
            if (multiple) {
                callback(files);
            } else {
                callback(files[0]);
            }
        }
        
        dropZone.addEventListener('click', () => fileInput.click());
    }
    
    function showStatus(message, type) {
        status.textContent = message;
        status.style.display = "block";
        status.className = "status " + type;
    }
    
    function updateProgress(percent) {
        progressBar.style.width = percent + "%";
        progressText.textContent = Math.round(percent) + "%";
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + " bytes";
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        else return (bytes / 1048576).toFixed(1) + " MB";
    }
});
