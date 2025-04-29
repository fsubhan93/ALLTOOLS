document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const tabButtons = document.querySelectorAll('.tab-btn');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const outputFormat = document.getElementById('outputFormat');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const convertBtn = document.getElementById('convertBtn');
    const resultBox = document.getElementById('resultBox');
    const fileInfo = document.getElementById('fileInfo');
    const downloadBtn = document.getElementById('downloadBtn');
    const supportedFormats = document.getElementById('supportedFormats');

    // State variables
    let currentConversionType = 'word-to-pdf';
    let selectedFile = null;
    let convertedFile = null;

    // Initialize
    updateUI();

    // Event Listeners
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentConversionType = btn.dataset.type;
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateUI();
        });
    });

    dropZone.addEventListener('click', () => fileInput.click());
    
    ['dragover', 'dragenter'].forEach(event => {
        dropZone.addEventListener(event, (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = 'rgba(72, 149, 239, 0.1)';
        });
    });

    ['dragleave', 'dragend'].forEach(event => {
        dropZone.addEventListener(event, () => {
            dropZone.style.backgroundColor = '';
        });
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
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
            supportedFormats.textContent = 'Supports: DOCX, DOC, RTF';
            fileInput.accept = '.docx,.doc,.rtf';
            outputFormat.innerHTML = '<option value="pdf">PDF</option>';
            document.querySelector('.option-group:nth-child(2)').style.display = 'block';
        } else {
            supportedFormats.textContent = 'Supports: PDF';
            fileInput.accept = '.pdf';
            outputFormat.innerHTML = `
                <option value="docx">DOCX (Microsoft Word)</option>
                <option value="rtf">RTF (Rich Text Format)</option>
            `;
            document.querySelector('.option-group:nth-child(2)').style.display = 'none';
        }
        
        // Reset
        selectedFile = null;
        convertBtn.disabled = true;
        resultBox.style.display = 'none';
    }

    function handleFileSelection(file) {
        // Validate file type
        const validTypes = {
            'word-to-pdf': ['.docx', '.doc', '.rtf'],
            'pdf-to-word': ['.pdf']
        }[currentConversionType];
        
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validTypes.includes(fileExt)) {
            alert(`Please select a ${validTypes.join(', ')} file`);
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
            convertBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Convert Now';
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
