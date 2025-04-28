document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
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

    wordUploadArea.addEventListener('click', () => wordInput.click());
    
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
        
        try {
            // For demo purposes - in production use a server-side solution
            // This is a simplified client-side approach
            
            // Read the Word file
            const arrayBuffer = await wordFile.arrayBuffer();
            
            // Convert Word to HTML (simplified approach)
            const result = await mammoth.extractRawText({ arrayBuffer });
            const text = result.value;
            
            // Create a new PDF
            const pdfDoc = await PDFLib.PDFDocument.create();
            const page = pdfDoc.addPage([595, 842]); // A4 size
            
            // Add text to PDF
            page.drawText(text, {
                x: 50,
                y: 800,
                size: 12,
                lineHeight: 18,
                maxWidth: 500,
            });
            
            // Save and download
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = wordFile.name.replace(/\.[^/.]+$/, '') + '.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            showStatus(wordStatus, 'Conversion complete!', 'success');
        } catch (error) {
            console.error('Conversion error:', error);
            showStatus(wordStatus, 'Conversion failed. Please try again.', 'error');
        }
    });

    // PDF to Word conversion
    const pdfToWordBtn = document.getElementById('convert-to-word');
    const pdfInput = document.getElementById('pdf-input');
    const pdfStatus = document.getElementById('pdf-status');
    const pdfUploadArea = document.getElementById('pdf-upload');

    pdfUploadArea.addEventListener('click', () => pdfInput.click());
    
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
        
        try {
            // For demo purposes - in production use a server-side solution
            
            // Read PDF file
            const arrayBuffer = await pdfFile.arrayBuffer();
            
            // Extract text from PDF
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();
            let textContent = '';
            
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const content = await page.getTextContent();
                const strings = content.items.map(item => item.str);
                textContent += strings.join(' ') + '\n\n';
            }
            
            // Create Word file (simplified as text file)
            const blob = new Blob([textContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = pdfFile.name.replace(/\.[^/.]+$/, '') + '.doc';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            showStatus(pdfStatus, 'Conversion complete!', 'success');
        } catch (error) {
            console.error('Conversion error:', error);
            showStatus(pdfStatus, 'Conversion failed. Please try again.', 'error');
        }
    });

    // Helper function
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
});
