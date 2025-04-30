document.addEventListener('DOMContentLoaded', function() {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    
    // DOM elements
    const docToPdfTab = document.getElementById('docToPdfTab');
    const pdfToDocTab = document.getElementById('pdfToDocTab');
    const docToPdfSection = document.getElementById('docToPdfSection');
    const pdfToDocSection = document.getElementById('pdfToDocSection');
    
    // DOC to PDF elements
    const docDropArea = document.getElementById('docDropArea');
    const docFileInput = document.getElementById('docFileInput');
    const selectDocFile = document.getElementById('selectDocFile');
    const clearDocFile = document.getElementById('clearDocFile');
    const generatePdf = document.getElementById('generatePdf');
    const docPreviewContainer = document.getElementById('docPreviewContainer');
    
    // PDF to DOC elements
    const pdfDropArea = document.getElementById('pdfDropArea');
    const pdfFileInput = document.getElementById('pdfFileInput');
    const selectPdfFile = document.getElementById('selectPdfFile');
    const clearPdfFile = document.getElementById('clearPdfFile');
    const generateDoc = document.getElementById('generateDoc');
    const pdfPreviewContainer = document.getElementById('pdfPreviewContainer');
    
    // File info container
    const fileInfoContainer = document.getElementById('fileInfo');
    
    // Store uploaded files
    let docFile = null;
    let pdfFile = null;
    
    // Tab switching
    docToPdfTab.addEventListener('click', () => {
        docToPdfTab.classList.add('active');
        pdfToDocTab.classList.remove('active');
        docToPdfSection.style.display = 'block';
        pdfToDocSection.style.display = 'none';
    });
    
    pdfToDocTab.addEventListener('click', () => {
        pdfToDocTab.classList.add('active');
        docToPdfTab.classList.remove('active');
        pdfToDocSection.style.display = 'block';
        docToPdfSection.style.display = 'none';
    });
    
    // DOC to PDF functionality
    setupFileUpload(
        docDropArea,
        docFileInput,
        selectDocFile,
        clearDocFile,
        generatePdf,
        docPreviewContainer,
        fileInfoContainer,
        ['.doc', '.docx'],
        (file) => { docFile = file; },
        () => { docFile = null; }
    );
    
    // PDF to DOC functionality
    setupFileUpload(
        pdfDropArea,
        pdfFileInput,
        selectPdfFile,
        clearPdfFile,
        generateDoc,
        pdfPreviewContainer,
        fileInfoContainer,
        ['.pdf'],
        (file) => { pdfFile = file; },
        () => { pdfFile = null; }
    );
    
    // Generate PDF from DOC
    generatePdf.addEventListener('click', async () => {
        if (!docFile) return;
        
        try {
            const pdfFileName = document.getElementById('pdfFileName').value.trim() || 
                               docFile.name.replace(/\.[^/.]+$/, "") + '.pdf';
            
            // Convert DOCX to HTML using mammoth
            const arrayBuffer = await readFileAsArrayBuffer(docFile);
            const result = await mammoth.extractRawText({arrayBuffer: arrayBuffer});
            const text = result.value;
            
            // Create PDF
            const pdf = new jsPDF({
                orientation: document.getElementById('pdfOrientation').value,
                unit: 'mm'
            });
            
            const pageSize = getPageSizeInMM(document.getElementById('pdfPageSize').value);
            const margin = parseFloat(document.getElementById('pdfMargin').value);
            const fontSize = parseFloat(document.getElementById('pdfFontSize').value);
            
            pdf.setFontSize(fontSize);
            
            // Split text into lines that fit the page width
            const maxWidth = pageSize.width - (margin * 2);
            const lines = pdf.splitTextToSize(text, maxWidth);
            
            let y = margin;
            const lineHeight = fontSize * 0.35; // mm
            
            for (let i = 0; i < lines.length; i++) {
                if (y + lineHeight > pageSize.height - margin) {
                    pdf.addPage([pageSize.width, pageSize.height], document.getElementById('pdfOrientation').value);
                    y = margin;
                }
                
                pdf.text(lines[i], margin, y);
                y += lineHeight;
            }
            
            // Save PDF
            pdf.save(pdfFileName);
            
            showSuccessMessage('Document converted to PDF successfully!');
        } catch (error) {
            console.error('Error converting DOC to PDF:', error);
            showErrorMessage('Failed to convert document to PDF. Please try again.');
        }
    });
    
    // Generate DOC from PDF
    generateDoc.addEventListener('click', async () => {
        if (!pdfFile) return;
        
        try {
            const docFileName = document.getElementById('docFileName').value.trim() || 
                                pdfFile.name.replace(/\.[^/.]+$/, "") + '.docx';
            
            // Extract text from PDF
            const arrayBuffer = await readFileAsArrayBuffer(pdfFile);
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            let text = '';
            
            for (let i = 0; i < pages.length; i++) {
                text += await pages[i].getText();
                if (i < pages.length - 1) text += '\n\n';
            }
            
            // Create DOCX document
            const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;
            
            const doc = new Document({
                styles: {
                    paragraphStyles: [{
                        id: "Normal",
                        name: "Normal",
                        run: {
                            size: document.getElementById('docFontSize').value + "pt",
                            font: document.getElementById('docFont').value,
                        },
                        paragraph: {
                            spacing: {
                                line: parseFloat(document.getElementById('docLineSpacing').value) * 240,
                            },
                        },
                    }]
                },
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: text,
                            style: "Normal",
                        })
                    ]
                }]
            });
            
            // Generate and download DOCX
            const blob = await docx.Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = docFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showSuccessMessage('PDF converted to document successfully!');
        } catch (error) {
            console.error('Error converting PDF to DOC:', error);
            showErrorMessage('Failed to convert PDF to document. Please try again.');
        }
    });
    
    // Helper functions
    function setupFileUpload(dropArea, fileInput, selectBtn, clearBtn, generateBtn, previewContainer, infoContainer, allowedExtensions, setFile, clearFile) {
        // Event listeners for drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
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
                handleFile(files[0]);
            }
        }
        
        // File input click
        selectBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                handleFile(fileInput.files[0]);
            }
        });
        
        // Clear file button
        clearBtn.addEventListener('click', () => {
            clearFile();
            updateFileInfo(null, infoContainer);
            updatePreview('No file selected yet', previewContainer);
            generateBtn.disabled = true;
            fileInput.value = '';
        });
        
        function handleFile(file) {
            // Check file extension
            const fileExt = file.name.split('.').pop().toLowerCase();
            if (!allowedExtensions.includes('.' + fileExt)) {
                showErrorMessage(`Please upload a ${allowedExtensions.join('/')} file`);
                return;
            }
            
            setFile(file);
            updateFileInfo(file, infoContainer);
            generateBtn.disabled = false;
            
            // Show preview
            if (file.type.match('application/pdf') || file.name.match(/\.pdf$/i)) {
                previewPdf(file, previewContainer);
            } else {
                previewTextFile(file, previewContainer);
            }
        }
    }
    
    function updateFileInfo(file, container) {
        container.innerHTML = '';
        
        if (!file) {
            container.innerHTML = '<p class="empty-message">No file uploaded yet</p>';
            return;
        }
        
        const fileInfoHTML = `
            <h3><i class="fas fa-file"></i> File Information</h3>
            <div class="file-details">
                <div class="file-detail">
                    <label>File Name:</label>
                    <p>${file.name}</p>
                </div>
                <div class="file-detail">
                    <label>File Size:</label>
                    <p>${formatFileSize(file.size)}</p>
                </div>
                <div class="file-detail">
                    <label>File Type:</label>
                    <p>${file.type || file.name.split('.').pop().toUpperCase()}</p>
                </div>
            </div>
        `;
        
        container.innerHTML = fileInfoHTML;
    }
    
    function updatePreview(content, container) {
        container.innerHTML = '';
        
        if (typeof content === 'string') {
            container.innerHTML = `<p>${content}</p>`;
            return;
        }
        
        const previewDiv = document.createElement('div');
        previewDiv.className = 'preview-content';
        previewDiv.appendChild(content);
        container.appendChild(previewDiv);
    }
    
    function previewTextFile(file, container) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const content = document.createElement('div');
            content.textContent = e.target.result.substring(0, 1000) + (e.target.result.length > 1000 ? '...' : '');
            updatePreview(content, container);
        };
        
        reader.readAsText(file);
    }
    
    async function previewPdf(file, container) {
        try {
            const arrayBuffer = await readFileAsArrayBuffer(file);
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const firstPage = pdfDoc.getPage(0);
            const text = await firstPage.getText();
            
            const content = document.createElement('div');
            content.textContent = text.substring(0, 1000) + (text.length > 1000 ? '...' : '');
            updatePreview(content, container);
        } catch (error) {
            console.error('Error previewing PDF:', error);
            updatePreview('Could not preview PDF content', container);
        }
    }
    
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function getPageSizeInMM(size) {
        switch (size) {
            case 'a4':
                return { width: 210, height: 297 };
            case 'letter':
                return { width: 215.9, height: 279.4 };
            case 'legal':
                return { width: 215.9, height: 355.6 };
            default:
                return { width: 210, height: 297 };
        }
    }
    
    function showSuccessMessage(message) {
        const alert = document.createElement('div');
        alert.className = 'alert success';
        alert.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }
    
    function showErrorMessage(message) {
        const alert = document.createElement('div');
        alert.className = 'alert error';
        alert.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }
});