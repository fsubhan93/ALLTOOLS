document.addEventListener('DOMContentLoaded', function() {
    // Initialize PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Word to PDF conversion
    const wordToPdfBtn = document.getElementById('convert-to-pdf');
    const wordInput = document.getElementById('word-input');
    const wordStatus = document.getElementById('word-status');
    const wordUploadArea = document.getElementById('word-upload');
    const wordProgress = document.getElementById('word-progress');
    const wordProgressBar = document.getElementById('word-progress-bar');

    wordUploadArea.addEventListener('click', () => wordInput.click());
    
    wordInput.addEventListener('change', function() {
        if (this.files.length) {
            const file = this.files[0];
            wordUploadArea.innerHTML = `
                <i class="upload-icon">✅</i>
                <h3>${file.name}</h3>
                <p>${formatFileSize(file.size)}</p>
            `;
        }
    });

    wordToPdfBtn.addEventListener('click', async function() {
        if (!wordInput.files.length) {
            showStatus(wordStatus, 'Please select a Word file first', 'error');
            return;
        }
        
        const wordFile = wordInput.files[0];
        if (wordFile.size > 10 * 1024 * 1024) {
            showStatus(wordStatus, 'File is too large (max 10MB)', 'error');
            return;
        }
        
        showStatus(wordStatus, 'Converting Word to PDF...', 'processing');
        wordProgress.style.display = 'block';
        updateProgress(wordProgressBar, 0);

        try {
            // Show progress (simulated)
            updateProgress(wordProgressBar, 30);
            
            // Read the Word file
            const arrayBuffer = await readFileAsArrayBuffer(wordFile);
            updateProgress(wordProgressBar, 60);

            // Convert Word to HTML with formatting
            const result = await mammoth.extractRawHtml({ arrayBuffer });
            const html = result.value;
            updateProgress(wordProgressBar, 80);

            // Create PDF with better formatting
            const pdfDoc = await PDFLib.PDFDocument.create();
            const page = pdfDoc.addPage([595, 842]); // A4 size
            
            // Improved text formatting
            const textLines = html.split('\n');
            let yPosition = 800;
            const fontSize = 12;
            const lineHeight = 18;
            
            for (const line of textLines) {
                if (line.trim()) {
                    page.drawText(line, {
                        x: 50,
                        y: yPosition,
                        size: fontSize,
                        maxWidth: 500,
                    });
                    yPosition -= lineHeight;
                }
            }

            updateProgress(wordProgressBar, 90);
            const pdfBytes = await pdfDoc.save();
            
            // Download PDF
            downloadFile(pdfBytes, wordFile.name.replace(/\.[^/.]+$/, '') + '.pdf', 'application/pdf');
            
            showStatus(wordStatus, 'Conversion complete!', 'success');
        } catch (error) {
            console.error('Conversion error:', error);
            showStatus(wordStatus, 'Conversion failed. Please try again.', 'error');
        } finally {
            wordProgress.style.display = 'none';
        }
    });

    // PDF to Word conversion
    const pdfToWordBtn = document.getElementById('convert-to-word');
    const pdfInput = document.getElementById('pdf-input');
    const pdfStatus = document.getElementById('pdf-status');
    const pdfUploadArea = document.getElementById('pdf-upload');
    const pdfProgress = document.getElementById('pdf-progress');
    const pdfProgressBar = document.getElementById('pdf-progress-bar');

    pdfUploadArea.addEventListener('click', () => pdfInput.click());
    
    pdfInput.addEventListener('change', function() {
        if (this.files.length) {
            const file = this.files[0];
            pdfUploadArea.innerHTML = `
                <i class="upload-icon">✅</i>
                <h3>${file.name}</h3>
                <p>${formatFileSize(file.size)}</p>
            `;
        }
    });

    pdfToWordBtn.addEventListener('click', async function() {
        if (!pdfInput.files.length) {
            showStatus(pdfStatus, 'Please select a PDF file first', 'error');
            return;
        }
        
        const pdfFile = pdfInput.files[0];
        if (pdfFile.size > 10 * 1024 * 1024) {
            showStatus(pdfStatus, 'File is too large (max 10MB)', 'error');
            return;
        }
        
        showStatus(pdfStatus, 'Converting PDF to Word...', 'processing');
        pdfProgress.style.display = 'block';
        updateProgress(pdfProgressBar, 0);

        try {
            updateProgress(pdfProgressBar, 20);
            const arrayBuffer = await readFileAsArrayBuffer(pdfFile);
            
            // Use PDF.js for better text extraction
            updateProgress(pdfProgressBar, 40);
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            let textContent = '';
            updateProgress(pdfProgressBar, 60);
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                textContent += content.items.map(item => item.str).join(' ') + '\n\n';
                updateProgress(pdfProgressBar, 60 + (i / pdf.numPages * 30));
            }

            // Create DOCX-like content (simplified)
            updateProgress(pdfProgressBar, 95);
            const docContent = `<?xml version="1.0"?>
                <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:body>
                        <w:p><w:r><w:t>${escapeXml(textContent)}</w:t></w:r></w:p>
                    </w:body>
                </w:document>`;
            
            downloadFile(docContent, pdfFile.name.replace(/\.[^/.]+$/, '') + '.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            
            showStatus(pdfStatus, 'Conversion complete!', 'success');
        } catch (error) {
            console.error('Conversion error:', error);
            showStatus(pdfStatus, 'Conversion failed. Please try again.', 'error');
        } finally {
            pdfProgress.style.display = 'none';
        }
    });

    // Helper functions
    function showStatus(element, message, type) {
        element.textContent = message;
        element.style.display = 'block';
        element.className = 'status ' + type;
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }

    function updateProgress(progressBar, percent) {
        progressBar.style.width = `${percent}%`;
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }

    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    function downloadFile(data, filename, mimeType) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    function escapeXml(unsafe) {
        return unsafe.replace(/[<>&'"]/g, function(c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }
});
