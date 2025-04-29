document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const wordToPdfBtn = document.getElementById('wordToPdfBtn');
    const pdfToWordBtn = document.getElementById('pdfToWordBtn');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const outputFormat = document.getElementById('outputFormat');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const convertBtn = document.getElementById('convertBtn');
    const resultBox = document.getElementById('resultBox');
    const fileInfo = document.getElementById('fileInfo');
    const downloadBtn = document.getElementById('downloadBtn');
    const browseBtn = dropZone.querySelector('.browse-btn');

    // State variables
    let currentConversionType = 'word-to-pdf';
    let selectedFile = null;
    let convertedFile = null;

    // Initialize
    updateUI();

    // Event Listeners
    wordToPdfBtn.addEventListener('click', () => {
        currentConversionType = 'word-to-pdf';
        updateUI();
        toggleActiveTab();
    });

    pdfToWordBtn.addEventListener('click', () => {
        currentConversionType = 'pdf-to-word';
        updateUI();
        toggleActiveTab();
    });

    function toggleActiveTab() {
        wordToPdfBtn.classList.toggle('active', currentConversionType === 'word-to-pdf');
        pdfToWordBtn.classList.toggle('active', currentConversionType === 'pdf-to-word');
    }

    browseBtn.addEventListener('click', () => fileInput.click());
    
    ['dragover', 'dragenter'].forEach(event => {
        dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#4361ee';
            dropZone.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
        });
    });

    ['dragleave', 'dragend'].forEach(event => {
        dropZone.addEventListener(event, () => {
            dropZone.style.borderColor = 'transparent';
            dropZone.style.backgroundColor = '';
        });
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'transparent';
        dropZone.style.backgroundColor = '';
        if (e.dataTransfer.files.length) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFileSelection(fileInput.files[0]);
        }
    });

    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = qualitySlider.value;
    });

    convertBtn.addEventListener('click', convertFile);
    downloadBtn.addEventListener('click', downloadFile);

    // Functions
    function updateUI() {
        if (currentConversionType === 'word-to-pdf') {
            fileInput.accept = '.docx,.doc,.rtf';
            outputFormat.innerHTML = '<option value="pdf">PDF Document</option>';
            document.querySelector('.file-types').textContent = 'Supports: DOCX, DOC, RTF';
        } else {
            fileInput.accept = '.pdf';
            outputFormat.innerHTML = `
                <option value="docx">Word Document (DOCX)</option>
                <option value="rtf">Rich Text Format (RTF)</option>
            `;
            document.querySelector('.file-types').textContent = 'Supports: PDF';
        }
        
        // Reset
        selectedFile = null;
        convertBtn.disabled = true;
        resultBox.style.display = 'none';
    }

    function handleFileSelection(file) {
        // Validate file type
        const validTypes = {
            'word-to-pdf': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/rtf'],
            'pdf-to-word': ['application/pdf']
        }[currentConversionType];
        
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validTypes.includes(file.type) && !file.name.match(/\.(docx|doc|rtf|pdf)$/i)) {
            alert(`Please select a ${currentConversionType === 'word-to-pdf' ? 'Word document' : 'PDF file'}`);
            return;
        }
        
        selectedFile = file;
        convertBtn.disabled = false;
        
        // Show file info
        fileInfo.innerHTML = `
            <p><strong>Selected File:</strong> ${file.name}</p>
            <p><strong>Size:</strong> ${formatFileSize(file.size)}</p>
            <p><strong>Type:</strong> ${fileExt.toUpperCase().replace('.', '')}</p>
        `;
    }

    async function convertFile() {
        if (!selectedFile) return;
        
        convertBtn.disabled = true;
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
        
        try {
            const outputType = outputFormat.value;
            const fileName = selectedFile.name.replace(/\.[^/.]+$/, '') + '.' + outputType;
            
            if (currentConversionType === 'word-to-pdf') {
                convertedFile = await convertWordToPdf(selectedFile, fileName);
            } else {
                convertedFile = await convertPdfToWord(selectedFile, fileName);
            }
            
            // Show result
            fileInfo.innerHTML += `
                <p><strong>Converted to:</strong> ${fileName}</p>
                <p><strong>New Size:</strong> ${formatFileSize(convertedFile.size)}</p>
            `;
            resultBox.style.display = 'block';
            
        } catch (error) {
            alert('Conversion failed: ' + error.message);
            console.error(error);
        } finally {
            convertBtn.innerHTML = '<i class="fas fa-magic"></i> Convert Now';
        }
    }

    async function convertWordToPdf(file, fileName) {
        // Read the Word file
        const arrayBuffer = await file.arrayBuffer();
        
        // Convert DOCX to HTML using Mammoth.js
        const result = await mammoth.extractRawText({ arrayBuffer });
        const textContent = result.value;
        
        // Create a PDF with the text content
        const { PDFDocument, rgb } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([550, 750]);
        
        // Add text to PDF
        const fontSize = 12;
        const textWidth = 500;
        const { height } = page.getSize();
        
        page.drawText(textContent, {
            x: 50,
            y: height - 50 - fontSize,
            size: fontSize,
            maxWidth: textWidth,
            lineHeight: fontSize * 1.2,
            color: rgb(0, 0, 0),
        });
        
        // Save PDF
        const pdfBytes = await pdfDoc.save();
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        return {
            name: fileName,
            type: 'application/pdf',
            size: pdfBlob.size,
            blob: pdfBlob
        };
    }

    async function convertPdfToWord(file, fileName) {
        // Read the PDF file
        const arrayBuffer = await file.arrayBuffer();
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Extract text from PDF
        let textContent = '';
        for (let i = 0; i < pdfDoc.getPageCount(); i++) {
            const page = pdfDoc.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map(item => item.str).join(' ') + '\n\n';
        }
        
        // Create a Word document using docx.js
        const { Document, Paragraph, TextRun, Packer } = docx;
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: textContent,
                                size: 24,
                            }),
                        ],
                    }),
                ],
            }],
        });
        
        // Generate the DOCX file
        const docxBuffer = await Packer.toBuffer(doc);
        const docxBlob = new Blob([docxBuffer], { 
            type: outputFormat.value === 'docx' 
                ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
                : 'application/rtf' 
        });
        
        return {
            name: fileName,
            type: docxBlob.type,
            size: docxBlob.size,
            blob: docxBlob
        };
    }

    function downloadFile() {
        if (!convertedFile) return;
        saveAs(convertedFile.blob, convertedFile.name);
    }

    // Helper function
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});
