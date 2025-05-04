document.addEventListener('DOMContentLoaded', function() {
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

    // ==================== PDF COMPRESSION ==================== //
    const compressInput = document.getElementById('compressInput');
    const compressDropZone = document.getElementById('compressDropZone');
    const compressBtn = document.getElementById('compressBtn');
    
    setupFileUpload(compressDropZone, compressInput, handleCompressFile);
    
    function handleCompressFile(file) {
        if (!file.name.match(/\.pdf$/i)) {
            showStatus("Please select a PDF file", "error");
            return;
        }
        
        compressDropZone.innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--success)"></i>
            <h3>${file.name}</h3>
            <p>${formatFileSize(file.size)} | Ready to compress</p>
        `;
    }
    
    compressBtn.addEventListener('click', async () => {
        if (!compressInput.files.length) {
            showStatus("Please select a PDF first", "error");
            return;
        }
        
        try {
            compressBtn.disabled = true;
            showProgress(0, "Preparing PDF...");
            
            const file = compressInput.files[0];
            const compressionLevel = document.querySelector('input[name="compression"]:checked').value;
            
            // Load PDF
            showProgress(20, "Loading PDF...");
            const pdfBytes = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            
            // Compression settings based on level
            let quality;
            switch(compressionLevel) {
                case 'low': quality = 0.9; break;
                case 'medium': quality = 0.7; break;
                case 'high': quality = 0.5; break;
                default: quality = 0.7;
            }
            
            // Compress images in PDF
            showProgress(40, "Compressing images...");
            const pages = pdfDoc.getPages();
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();
                
                // This is a simplified compression - real compression would need more advanced processing
                const content = page.node.content;
                if (content && content.resources && content.resources.XObject) {
                    const xObjects = content.resources.XObject;
                    for (const key in xObjects) {
                        if (xObjects[key].constructor.name === 'PDFImage') {
                            const image = xObjects[key];
                            image.setQuality(quality * 100);
                        }
                    }
                }
                
                updateProgress(40 + (i / pages.length * 30));
            }
            
            // Save compressed PDF
            showProgress(80, "Generating compressed PDF...");
            const compressedPdfBytes = await pdfDoc.save({
                useObjectStreams: true,
                // Additional compression options
                // Note: PDF-Lib has limited built-in compression
            });
            
            // Download
            showProgress(90, "Preparing download...");
            const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compressed_${file.name}`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            showStatus("PDF compressed successfully!", "success");
        } catch (error) {
            console.error(error);
            showStatus("Compression failed: " + error.message, "error");
        } finally {
            compressBtn.disabled = false;
            hideProgress();
        }
    });
    
    // ==================== PDF EDITING ==================== //
    const editInput = document.getElementById('editInput');
    const editDropZone = document.getElementById('editDropZone');
    const saveBtn = document.getElementById('saveBtn');
    const editorPreview = document.getElementById('editorPreview');
    const toolBtns = document.querySelectorAll('.tool-btn');
    
    let pdfDoc = null;
    let pdfPages = [];
    
    setupFileUpload(editDropZone, editInput, handleEditFile);
    
    async function handleEditFile(file) {
        if (!file.name.match(/\.pdf$/i)) {
            showStatus("Please select a PDF file", "error");
            return;
        }
        
        try {
            editDropZone.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                <h3>Loading PDF...</h3>
            `;
            
            // Load PDF for editing
            const pdfBytes = await file.arrayBuffer();
            pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            pdfPages = pdfDoc.getPages();
            
            // Render first page as preview
            const firstPage = pdfPages[0];
            const { width, height } = firstPage.getSize();
            
            // Create canvas for preview
            editorPreview.innerHTML = `
                <canvas id="pdfPreviewCanvas"></canvas>
                <p>Page 1 of ${pdfPages.length}</p>
            `;
            
            // Initialize PDF.js for rendering
            const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            
            const viewport = page.getViewport({ scale: 0.8 });
            const canvas = document.getElementById('pdfPreviewCanvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            editDropZone.innerHTML = `
                <i class="fas fa-check-circle" style="color: var(--success)"></i>
                <h3>${file.name}</h3>
                <p>${pdfPages.length} pages | Ready to edit</p>
            `;
            
            // Enable tool buttons
            toolBtns.forEach(btn => btn.disabled = false);
            
        } catch (error) {
            console.error(error);
            showStatus("Error loading PDF: " + error.message, "error");
            editDropZone.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <h3>Drag & Drop PDF Here</h3>
                <p>or click to browse (Max 30MB)</p>
            `;
        }
    }
    
    // Tool button handlers
    toolBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tool = this.dataset.tool;
            switch(tool) {
                case 'text':
                    addTextToPdf();
                    break;
                case 'image':
                    addImageToPdf();
                    break;
                case 'rotate':
                    rotatePages();
                    break;
                case 'delete':
                    deletePages();
                    break;
            }
        });
    });
    
    async function addTextToPdf() {
        if (!pdfDoc) return;
        
        const text = prompt("Enter text to add:");
        if (!text) return;
        
        try {
            // Add text to first page (for demo)
            const firstPage = pdfPages[0];
            const { width, height } = firstPage.getSize();
            
            firstPage.drawText(text, {
                x: 50,
                y: height - 50,
                size: 20,
                color: PDFLib.rgb(0, 0, 0),
            });
            
            showStatus("Text added to PDF!", "success");
            await updatePreview();
        } catch (error) {
            console.error(error);
            showStatus("Failed to add text", "error");
        }
    }
    
    async function addImageToPdf() {
        if (!pdfDoc) return;
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const imageBytes = await file.arrayBuffer();
                const image = await pdfDoc.embedJpg(imageBytes) || 
                              await pdfDoc.embedPng(imageBytes);
                
                // Add to first page (for demo)
                const firstPage = pdfPages[0];
                const { width, height } = firstPage.getSize();
                
                firstPage.drawImage(image, {
                    x: 50,
                    y: height - 200,
                    width: 150,
                    height: 100,
                });
                
                showStatus("Image added to PDF!", "success");
                await updatePreview();
            } catch (error) {
                console.error(error);
                showStatus("Failed to add image", "error");
            }
        };
        input.click();
    }
    
    async function rotatePages() {
        if (!pdfDoc) return;
        
        const angle = prompt("Enter rotation angle (90, 180, or 270):", "90");
        if (!angle || !['90', '180', '270'].includes(angle)) {
            showStatus("Invalid rotation angle", "error");
            return;
        }
        
        try {
            pdfPages.forEach(page => {
                page.setRotation(page.getRotation() + parseInt(angle));
            });
            
            showStatus(`Pages rotated by ${angle} degrees`, "success");
            await updatePreview();
        } catch (error) {
            console.error(error);
            showStatus("Failed to rotate pages", "error");
        }
    }
    
    async function deletePages() {
        if (!pdfDoc) return;
        
        const pageNumbers = prompt("Enter page numbers to delete (e.g., 1,3-5):");
        if (!pageNumbers) return;
        
        try {
            // Parse page numbers (simple implementation)
            const pagesToDelete = new Set();
            const parts = pageNumbers.split(',');
            
            for (const part of parts) {
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(Number);
                    for (let i = start; i <= end; i++) {
                        if (i > 0 && i <= pdfPages.length) {
                            pagesToDelete.add(i - 1); // 0-based index
                        }
                    }
                } else {
                    const num = Number(part);
                    if (num > 0 && num <= pdfPages.length) {
                        pagesToDelete.add(num - 1);
                    }
                }
            }
            
            // Remove pages (backwards to avoid index issues)
            const sorted = Array.from(pagesToDelete).sort((a, b) => b - a);
            for (const index of sorted) {
                pdfDoc.removePage(index);
            }
            
            pdfPages = pdfDoc.getPages();
            showStatus(`Deleted ${sorted.length} pages`, "success");
            await updatePreview();
        } catch (error) {
            console.error(error);
            showStatus("Failed to delete pages", "error");
        }
    }
    
    async function updatePreview() {
        if (!pdfDoc) return;
        
        try {
            // Re-render preview
            const pdfBytes = await pdfDoc.save();
            const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1);
            
            const viewport = page.getViewport({ scale: 0.8 });
            const canvas = document.getElementById('pdfPreviewCanvas');
            const context = canvas.getContext('2d');
            
            // Clear canvas
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            // Update page count
            const pageCountEl = document.querySelector('#editorPreview p');
            if (pageCountEl) {
                pageCountEl.textContent = `Page 1 of ${pdfPages.length}`;
            }
        } catch (error) {
            console.error("Preview update error:", error);
        }
    }
    
    saveBtn.addEventListener('click', async () => {
        if (!pdfDoc) {
            showStatus("No PDF loaded to save", "error");
            return;
        }
        
        try {
            saveBtn.disabled = true;
            showProgress(0, "Saving edits...");
            
            // Save edited PDF
            showProgress(50, "Generating PDF...");
            const editedPdfBytes = await pdfDoc.save();
            
            // Download
            showProgress(90, "Preparing download...");
            const blob = new Blob([editedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `edited_${editInput.files[0].name}`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            showStatus("Edited PDF saved successfully!", "success");
        } catch (error) {
            console.error(error);
            showStatus("Failed to save PDF: " + error.message, "error");
        } finally {
            saveBtn.disabled = false;
            hideProgress();
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
        dropZone.addEventListener('click', () => fileInput.click());
        
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
    }
    
    function showStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.style.display = "block";
        status.className = "status " + type;
    }
    
    function showProgress(percent, message) {
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        progressContainer.style.display = "flex";
        progressBar.style.width = percent + "%";
        progressText.textContent = message || Math.round(percent) + "%";
    }
    
    function hideProgress() {
        document.getElementById('progressContainer').style.display = "none";
    }
    
    function updateProgress(percent) {
        document.getElementById('progressBar').style.width = percent + "%";
        document.getElementById('progressText').textContent = Math.round(percent) + "%";
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + " bytes";
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        else return (bytes / 1048576).toFixed(1) + " MB";
    }
    
    // Initialize PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
    
    // Disable tool buttons initially
    toolBtns.forEach(btn => btn.disabled = true);
});
