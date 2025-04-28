document.addEventListener('DOMContentLoaded', function() {
    // PDF to DOC conversion
    const pdfToDocBtn = document.getElementById('convert-pdf-to-doc');
    const pdfInput = document.getElementById('pdf-input');
    const pdfToDocStatus = document.getElementById('pdf-to-doc-status');
    
    pdfToDocBtn.addEventListener('click', async function() {
        if (!pdfInput.files || pdfInput.files.length === 0) {
            showStatus(pdfToDocStatus, 'Please select a PDF file first', 'error');
            return;
        }
        
        const pdfFile = pdfInput.files[0];
        if (pdfFile.size > 10 * 1024 * 1024) { // 10MB limit
            showStatus(pdfToDocStatus, 'File is too large (max 10MB)', 'error');
            return;
        }
        
        showStatus(pdfToDocStatus, 'Converting PDF to DOC...', 'processing');
        
        try {
            // Read the PDF file
            const arrayBuffer = await pdfFile.arrayBuffer();
            
            // Load the PDF document
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            let textContent = '';
            
            // Extract text from each page
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const content = await page.getTextContent();
                const strings = content.items.map(item => item.str);
                textContent += strings.join(' ') + '\n\n';
            }
            
            // Create a DOC file (simple text file with .doc extension)
            const blob = new Blob([textContent], { type: 'application/msword' });
            saveAs(blob, pdfFile.name.replace('.pdf', '') + '.doc');
            
            showStatus(pdfToDocStatus, 'Conversion complete!', 'success');
        } catch (error) {
            console.error('PDF to DOC conversion error:', error);
            showStatus(pdfToDocStatus, 'Conversion failed. Please try again.', 'error');
        }
    });
    
    // DOC to PDF conversion
    const docToPdfBtn = document.getElementById('convert-doc-to-pdf');
    const docInput = document.getElementById('doc-input');
    const docToPdfStatus = document.getElementById('doc-to-pdf-status');
    
    docToPdfBtn.addEventListener('click', async function() {
        if (!docInput.files || docInput.files.length === 0) {
            showStatus(docToPdfStatus, 'Please select a DOC file first', 'error');
            return;
        }
        
        const docFile = docInput.files[0];
        if (docFile.size > 10 * 1024 * 1024) { // 10MB limit
            showStatus(docToPdfStatus, 'File is too large (max 10MB)', 'error');
            return;
        }
        
        showStatus(docToPdfStatus, 'Converting DOC to PDF...', 'processing');
        
        try {
            // Read the DOC file
            const arrayBuffer = await docFile.arrayBuffer();
            
            // Convert DOC to text using mammoth.js
            const result = await mammoth.extractRawText({ arrayBuffer });
            const text = result.value;
            
            // Create a new PDF document
            const pdfDoc = await PDFLib.PDFDocument.create();
            const page = pdfDoc.addPage([595, 842]); // A4 size (595 x 842 points)
            
            // Add text to the PDF
            page.drawText(text, {
                x: 50,
                y: 800,
                size: 12,
                lineHeight: 18,
                maxWidth: 500,
            });
            
            // Save the PDF
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            saveAs(blob, docFile.name.replace('.docx', '').replace('.doc', '') + '.pdf');
            
            showStatus(docToPdfStatus, 'Conversion complete!', 'success');
        } catch (error) {
            console.error('DOC to PDF conversion error:', error);
            showStatus(docToPdfStatus, 'Conversion failed. Please try again.', 'error');
        }
    });
    
    // Helper function to show status messages
    function showStatus(element, message, type) {
        element.textContent = message;
        element.style.display = 'block';
        element.className = 'status ' + type;
        
        // Hide the status after 5 seconds for success/error messages
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }
});