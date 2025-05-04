document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const resizeMode = document.getElementById('resizeMode');
    const percentageControl = document.getElementById('percentageControl');
    const dimensionsControl = document.getElementById('dimensionsControl');
    const widthControl = document.getElementById('widthControl');
    const heightControl = document.getElementById('heightControl');
    const resizePercentage = document.getElementById('resizePercentage');
    const percentageValue = document.getElementById('percentageValue');
    const resizeWidth = document.getElementById('resizeWidth');
    const resizeHeight = document.getElementById('resizeHeight');
    const maintainAspect = document.getElementById('maintainAspect');
    const resizeByWidth = document.getElementById('resizeByWidth');
    const resizeByHeight = document.getElementById('resizeByHeight');
    const quality = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const outputFormat = document.getElementById('outputFormat');
    const grayscale = document.getElementById('grayscale');
    const flipHorizontal = document.getElementById('flipHorizontal');
    const flipVertical = document.getElementById('flipVertical');
    const rotation = document.getElementById('rotation');
    const originalImage = document.getElementById('originalImage');
    const processedImage = document.getElementById('processedImage');
    const originalDimensions = document.getElementById('originalDimensions');
    const originalSize = document.getElementById('originalSize');
    const processedDimensions = document.getElementById('processedDimensions');
    const processedSize = document.getElementById('processedSize');
    const reductionPercent = document.getElementById('reductionPercent');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const previewContainer = document.querySelector('.preview-container');
    const actionButtons = document.querySelector('.action-buttons');
    const status = document.getElementById('status');
    
    // Variables
    let originalFile = null;
    let originalImageData = null;
    let processedImageData = null;
    
    // Event Listeners
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            fileInput.files = files;
            handleFileSelect({ target: fileInput });
        }
    }
    
    // Resize mode change
    resizeMode.addEventListener('change', function() {
        percentageControl.classList.add('hidden');
        dimensionsControl.classList.add('hidden');
        widthControl.classList.add('hidden');
        heightControl.classList.add('hidden');
        
        switch (this.value) {
            case 'percentage':
                percentageControl.classList.remove('hidden');
                break;
            case 'dimensions':
                dimensionsControl.classList.remove('hidden');
                break;
            case 'width':
                widthControl.classList.remove('hidden');
                break;
            case 'height':
                heightControl.classList.remove('hidden');
                break;
        }
    });
    
    // Percentage slider
    resizePercentage.addEventListener('input', function() {
        percentageValue.textContent = `${this.value}%`;
        if (originalFile) processImage();
    });
    
    // Quality slider
    quality.addEventListener('input', function() {
        qualityValue.textContent = `${this.value}%`;
        if (originalFile) processImage();
    });
    
    // Dimension inputs
    [resizeWidth, resizeHeight, resizeByWidth, resizeByHeight].forEach(input => {
        input.addEventListener('input', function() {
            if (maintainAspect.checked && originalImageData && (this === resizeWidth || this === resizeHeight)) {
                const aspectRatio = originalImageData.width / originalImageData.height;
                if (this === resizeWidth) {
                    resizeHeight.value = Math.round(this.value / aspectRatio);
                } else {
                    resizeWidth.value = Math.round(this.value * aspectRatio);
                }
            }
            if (originalFile) processImage();
        });
    });
    
    // Maintain aspect ratio checkbox
    maintainAspect.addEventListener('change', function() {
        if (this.checked && originalImageData) {
            const aspectRatio = originalImageData.width / originalImageData.height;
            resizeHeight.value = Math.round(resizeWidth.value / aspectRatio);
        }
    });
    
    // Other controls
    [outputFormat, grayscale, flipHorizontal, flipVertical, rotation].forEach(control => {
        control.addEventListener('change', function() {
            if (originalFile) processImage();
        });
    });
    
    // Download button
    downloadBtn.addEventListener('click', downloadProcessedImage);
    
    // Reset button
    resetBtn.addEventListener('click', resetTool);
    
    // Functions
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            showStatus('Please select an image file.', 'error');
            return;
        }
        
        originalFile = file;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            originalImage.src = event.target.result;
            
            // Get image dimensions
            const img = new Image();
            img.onload = function() {
                originalImageData = {
                    width: img.width,
                    height: img.height,
                    src: event.target.result
                };
                
                // Update original image info
                originalDimensions.textContent = `${img.width} × ${img.height} px`;
                originalSize.textContent = formatFileSize(file.size);
                
                // Set default dimensions
                resizeWidth.value = img.width;
                resizeHeight.value = img.height;
                resizeByWidth.value = img.width;
                resizeByHeight.value = img.height;
                
                // Show preview and controls
                previewContainer.classList.remove('hidden');
                actionButtons.classList.remove('hidden');
                
                // Process the image
                processImage();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        
        showStatus('Image loaded successfully!', 'success');
    }
    
    async function processImage() {
        if (!originalFile) return;
        
        try {
            showStatus('Processing image...', '');
            
            // Get the selected options
            const options = {
                resizeMode: resizeMode.value,
                resizePercentage: parseInt(resizePercentage.value),
                resizeWidth: parseInt(resizeWidth.value),
                resizeHeight: parseInt(resizeHeight.value),
                resizeByWidth: parseInt(resizeByWidth.value),
                resizeByHeight: parseInt(resizeByHeight.value),
                quality: parseInt(quality.value) / 100,
                outputFormat: outputFormat.value === 'original' ? null : outputFormat.value,
                grayscale: grayscale.checked,
                flipHorizontal: flipHorizontal.checked,
                flipVertical: flipVertical.checked,
                rotation: parseInt(rotation.value)
            };
            
            // Process the image using the browser-image-compression library
            const processedFile = await processImageWithOptions(originalFile, options);
            
            // Display the processed image
            const reader = new FileReader();
            reader.onload = function(event) {
                processedImage.src = event.target.result;
                
                // Get processed image dimensions
                const img = new Image();
                img.onload = function() {
                    processedImageData = {
                        width: img.width,
                        height: img.height,
                        src: event.target.result
                    };
                    
                    // Update processed image info
                    processedDimensions.textContent = `${img.width} × ${img.height} px`;
                    processedSize.textContent = formatFileSize(processedFile.size);
                    
                    // Calculate reduction percentage
                    const reduction = ((originalFile.size - processedFile.size) / originalFile.size * 100).toFixed(1);
                    reductionPercent.textContent = `${reduction}% smaller`;
                    reductionPercent.style.color = reduction > 0 ? 'var(--success-color)' : 'var(--error-color)';
                    
                    showStatus('Image processed successfully!', 'success');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(processedFile);
        } catch (error) {
            console.error('Error processing image:', error);
            showStatus('Error processing image. Please try again.', 'error');
        }
    }
    
    async function processImageWithOptions(file, options) {
        return new Promise(async (resolve, reject) => {
            try {
                // Create canvas for advanced manipulations
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate new dimensions based on resize mode
                    let newWidth, newHeight;
                    
                    switch (options.resizeMode) {
                        case 'percentage':
                            newWidth = Math.round(img.width * options.resizePercentage / 100);
                            newHeight = Math.round(img.height * options.resizePercentage / 100);
                            break;
                        case 'dimensions':
                            newWidth = options.resizeWidth;
                            newHeight = options.resizeHeight;
                            break;
                        case 'width':
                            newWidth = options.resizeByWidth;
                            newHeight = Math.round(img.height * (options.resizeByWidth / img.width));
                            break;
                        case 'height':
                            newHeight = options.resizeByHeight;
                            newWidth = Math.round(img.width * (options.resizeByHeight / img.height));
                            break;
                    }
                    
                    // Set canvas dimensions
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    
                    // Apply transformations
                    ctx.save();
                    
                    // Flip and rotate
                    if (options.flipHorizontal || options.flipVertical || options.rotation !== 0) {
                        // Move to center
                        ctx.translate(canvas.width / 2, canvas.height / 2);
                        
                        // Apply rotation
                        if (options.rotation !== 0) {
                            ctx.rotate(options.rotation * Math.PI / 180);
                        }
                        
                        // Apply flip
                        let scaleX = options.flipHorizontal ? -1 : 1;
                        let scaleY = options.flipVertical ? -1 : 1;
                        ctx.scale(scaleX, scaleY);
                        
                        // Draw image centered
                        ctx.drawImage(img, -newWidth / 2, -newHeight / 2, newWidth, newHeight);
                    } else {
                        // Draw image normally
                        ctx.drawImage(img, 0, 0, newWidth, newHeight);
                    }
                    
                    ctx.restore();
                    
                    // Apply grayscale if needed
                    if (options.grayscale) {
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;
                        for (let i = 0; i < data.length; i += 4) {
                            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                            data[i] = avg;     // red
                            data[i + 1] = avg; // green
                            data[i + 2] = avg; // blue
                        }
                        ctx.putImageData(imageData, 0, 0);
                    }
                    
                    // Convert to blob with specified format and quality
                    canvas.toBlob(blob => {
                        if (!blob) {
                            reject(new Error('Canvas toBlob failed'));
                            return;
                        }
                        
                        // If no format conversion needed, return as is
                        if (!options.outputFormat || options.outputFormat === getFileExtension(file.name)) {
                            resolve(new File([blob], file.name, { type: blob.type }));
                        } else {
                            // Convert to new format
                            const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.' + options.outputFormat;
                            let mimeType;
                            
                            switch (options.outputFormat) {
                                case 'jpeg':
                                    mimeType = 'image/jpeg';
                                    break;
                                case 'png':
                                    mimeType = 'image/png';
                                    break;
                                case 'webp':
                                    mimeType = 'image/webp';
                                    break;
                                default:
                                    mimeType = blob.type;
                            }
                            
                            resolve(new File([blob], newFileName, { type: mimeType }));
                        }
                    }, options.outputFormat ? 'image/' + options.outputFormat : blob.type, options.quality);
                };
                img.src = URL.createObjectURL(file);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }
    
    function downloadProcessedImage() {
        if (!processedImageData) return;
        
        const a = document.createElement('a');
        a.href = processedImageData.src;
        
        // Get suggested filename
        let filename = originalFile.name;
        if (outputFormat.value !== 'original') {
            filename = filename.replace(/\.[^/.]+$/, '') + '.' + outputFormat.value;
        }
        
        a.download = filename || 'processed-image';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    function resetTool() {
        // Reset file input
        fileInput.value = '';
        originalFile = null;
        originalImageData = null;
        processedImageData = null;
        
        // Reset image displays
        originalImage.src = '';
        processedImage.src = '';
        originalDimensions.textContent = '';
        originalSize.textContent = '';
        processedDimensions.textContent = '';
        processedSize.textContent = '';
        reductionPercent.textContent = '';
        
        // Hide preview and buttons
        previewContainer.classList.add('hidden');
        actionButtons.classList.add('hidden');
        
        // Reset controls to defaults
        resizeMode.value = 'percentage';
        percentageControl.classList.remove('hidden');
        dimensionsControl.classList.add('hidden');
        widthControl.classList.add('hidden');
        heightControl.classList.add('hidden');
        resizePercentage.value = 100;
        percentageValue.textContent = '100%';
        quality.value = 80;
        qualityValue.textContent = '80%';
        outputFormat.value = 'original';
        grayscale.checked = false;
        flipHorizontal.checked = false;
        flipVertical.checked = false;
        rotation.value = '0';
        
        showStatus('Tool reset. Ready for a new image!', 'success');
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function showStatus(message, type) {
        status.textContent = message;
        status.className = 'status';
        if (type) status.classList.add(type);
    }
});
