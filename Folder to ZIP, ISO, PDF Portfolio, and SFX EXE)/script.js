document.addEventListener('DOMContentLoaded', function() {
    const folderInput = document.getElementById('folderInput');
    const dropArea = document.getElementById('dropArea');
    const convertBtn = document.getElementById('convertBtn');
    const status = document.getElementById('status');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    
    let files = [];
    
    // Handle drag and drop
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
        const fileList = dt.files;
        handleFiles(fileList);
    }
    
    folderInput.addEventListener('change', function() {
        if (this.files.length) {
            handleFiles(this.files);
        }
    });
    
    function handleFiles(fileList) {
        files = Array.from(fileList);
        updateUI();
    }
    
    function updateUI() {
        if (files.length > 0) {
            dropArea.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <h3>${files.length} files selected</h3>
                <p>Ready to convert</p>
            `;
            convertBtn.disabled = false;
        } else {
            dropArea.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <h3>Drag & Drop Folder Here</h3>
                <p>or click to browse</p>
            `;
            convertBtn.disabled = true;
        }
    }
    
    convertBtn.addEventListener('click', async function() {
        if (files.length === 0) return;
        
        const format = document.querySelector('input[name="format"]:checked').value;
        
        try {
            showStatus('Processing...', 'processing');
            progressContainer.style.display = 'block';
            
            switch(format) {
                case 'zip':
                    await convertToZip();
                    break;
                case 'pdf':
                    await convertToPDF();
                    break;
                case 'iso':
                    showStatus('ISO conversion requires server-side processing', 'error');
                    break;
                case 'exe':
                    showStatus('EXE creation requires server-side processing', 'error');
                    break;
                default:
                    await convertToZip();
            }
        } catch (error) {
            console.error('Conversion error:', error);
            showStatus('Conversion failed: ' + error.message, 'error');
        } finally {
            progressContainer.style.display = 'none';
        }
    });
    
    async function convertToZip() {
        const zip = new JSZip();
        let processed = 0;
        
        // Create folder structure in ZIP
        for (const file of files) {
            const relativePath = file.webkitRelativePath.split('/').slice(1).join('/');
            const fileData = await readFileAsArrayBuffer(file);
            zip.file(relativePath, fileData);
            
            processed++;
            updateProgress(processed / files.length * 100);
        }
        
        // Generate ZIP file
        const content = await zip.generateAsync({ type: 'blob' }, metadata => {
            updateProgress(metadata.percent);
        });
        
        // Download
        saveAs(content, 'converted_folder.zip');
        showStatus('Conversion to ZIP complete!', 'success');
    }
    
    async function convertToPDF() {
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        let processed = 0;
        
        // Process only PDFs or create PDFs from images/text files
        const supportedFiles = files.filter(file => 
            file.type === 'application/pdf' || 
            file.type.startsWith('image/') || 
            file.type.startsWith('text/')
        );
        
        if (supportedFiles.length === 0) {
            throw new Error('No supported files found for PDF conversion');
        }
        
        for (const file of supportedFiles) {
            try {
                if (file.type === 'application/pdf') {
                    // Merge PDFs
                    const pdfBytes = await readFileAsArrayBuffer(file);
                    const externalPdfDoc = await PDFDocument.load(pdfBytes);
                    const pages = await pdfDoc.copyPages(externalPdfDoc, externalPdfDoc.getPageIndices());
                    pages.forEach(page => pdfDoc.addPage(page));
                } else if (file.type.startsWith('image/')) {
                    // Add images as PDF pages
                    const imageBytes = await readFileAsArrayBuffer(file);
                    const image = await pdfDoc.embedJpg(imageBytes) || await pdfDoc.embedPng(imageBytes);
                    const page = pdfDoc.addPage([image.width, image.height]);
                    page.drawImage(image, {
                        x: 0,
                        y: 0,
                        width: image.width,
                        height: image.height,
                    });
                } else if (file.type.startsWith('text/')) {
                    // Add text files as PDF pages
                    const text = await readFileAsText(file);
                    const page = pdfDoc.addPage([595, 842]); // A4 size
                    page.drawText(text, {
                        x: 50,
                        y: 800,
                        size: 12,
                        lineHeight: 18,
                        maxWidth: 500,
                    });
                }
                
                processed++;
                updateProgress(processed / supportedFiles.length * 100);
            } catch (error) {
                console.warn(`Skipping file ${file.name}:`, error);
            }
        }
        
        // Download
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        saveAs(blob, 'converted_folder.pdf');
        showStatus('PDF portfolio created!', 'success');
    }
    
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    function showStatus(message, type) {
        status.textContent = message;
        status.style.display = 'block';
        status.className = 'status ' + type;
    }
    
    function updateProgress(percent) {
        progressBar.style.width = `${percent}%`;
    }
});
