document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const conversionType = document.getElementById('conversion-type');
    const qualityControl = document.getElementById('quality-control');
    const qualitySlider = document.getElementById('jpg-quality');
    const qualityValue = document.getElementById('quality-value');
    const originalPreview = document.getElementById('original-preview');
    const convertedPreview = document.getElementById('converted-preview');
    const originalInfo = document.getElementById('original-info');
    const convertedInfo = document.getElementById('converted-info');
    const downloadBtn = document.getElementById('download-btn');
    
    let convertedImageBlob = null;
    
    // Toggle quality control based on conversion type
    conversionType.addEventListener('change', function() {
        if (this.value === 'png-to-jpg') {
            qualityControl.style.display = 'flex';
        } else {
            qualityControl.style.display = 'none';
        }
        
        // If there's already an image loaded, convert it again with new settings
        if (originalPreview.src && originalPreview.src !== '#') {
            convertImage(fileInput.files[0]);
        }
    });
    
    // Update quality value display
    qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = this.value;
        
        // If there's already an image loaded, convert it again with new quality
        if (conversionType.value === 'png-to-jpg' && originalPreview.src && originalPreview.src !== '#') {
            convertImage(fileInput.files[0]);
        }
    });
    
    // Handle drag and drop events
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
    dropArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', function() {
        if (this.files.length) {
            handleFiles(this.files);
        }
    });
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            handleFiles(files);
            fileInput.files = files;
        }
    }
    
    function handleFiles(files) {
        const file = files[0];
        
        // Check if file is an image
        if (!file.type.match('image.*')) {
            alert('Please select an image file (JPG or PNG)');
            return;
        }
        
        // Check if file is either JPG or PNG
        if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
            alert('Please select either a JPG or PNG image');
            return;
        }
        
        // Check conversion compatibility
        if ((conversionType.value === 'jpg-to-png' && !file.type.match('image/jpeg')) || 
            (conversionType.value === 'png-to-jpg' && !file.type.match('image/png'))) {
            alert(`Selected image format doesn't match the conversion type. Please select a ${conversionType.value === 'jpg-to-png' ? 'JPG' : 'PNG'} image or change the conversion type.`);
            return;
        }
        
        // Display original image
        const reader = new FileReader();
        reader.onload = function(e) {
            originalPreview.src = e.target.result;
            originalInfo.textContent = `Format: ${file.type.split('/')[1].toUpperCase()}, Size: ${formatFileSize(file.size)}`;
        };
        reader.readAsDataURL(file);
        
        // Convert the image
        convertImage(file);
    }
    
    function convertImage(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                let mimeType, fileName, fileExtension;
                
                if (conversionType.value === 'jpg-to-png') {
                    mimeType = 'image/png';
                    fileName = file.name.replace(/\.jpe?g$/i, '.png');
                    fileExtension = 'PNG';
                } else {
                    mimeType = 'image/jpeg';
                    fileName = file.name.replace(/\.png$/i, '.jpg');
                    fileExtension = 'JPG';
                    const quality = parseInt(qualitySlider.value) / 100;
                }
                
                canvas.toBlob(function(blob) {
                    convertedImageBlob = blob;
                    const convertedUrl = URL.createObjectURL(blob);
                    convertedPreview.src = convertedUrl;
                    convertedInfo.textContent = `Format: ${fileExtension}, Size: ${formatFileSize(blob.size)}`;
                    
                    // Enable download button
                    downloadBtn.disabled = false;
                    downloadBtn.onclick = function() {
                        const a = document.createElement('a');
                        a.href = convertedUrl;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    };
                }, mimeType, conversionType.value === 'png-to-jpg' ? parseInt(qualitySlider.value) / 100 : undefined);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});
