document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const selectFilesBtn = document.getElementById('selectFiles');
    const convertBtn = document.getElementById('convertBtn');
    const resetBtn = document.getElementById('resetBtn');
    const toggleAdvancedBtn = document.getElementById('toggleAdvanced');
    const advancedOptions = document.getElementById('advancedOptions');
    const resultsSection = document.getElementById('resultsSection');
    const resultsGrid = document.getElementById('resultsGrid');
    const downloadAllBtn = document.getElementById('downloadAll');
    const clearAllBtn = document.getElementById('clearAll');
    
    // Files array to store uploaded files
    let files = [];
    
    // Initialize JS PDF
    const { jsPDF } = window.jspdf;
    
    // Event Listeners
    selectFilesBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', handleFileSelect);
    
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.style.borderColor = '#3a57e8';
        dropArea.style.backgroundColor = 'rgba(58, 87, 232, 0.05)';
    });
    
    dropArea.addEventListener('dragleave', () => {
        dropArea.style.borderColor = '#e0e0e0';
        dropArea.style.backgroundColor = 'transparent';
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.style.borderColor = '#e0e0e0';
        dropArea.style.backgroundColor = 'transparent';
        
        if (e.dataTransfer.files.length) {
            files = Array.from(e.dataTransfer.files);
            updateFileList();
        }
    });
    
    toggleAdvancedBtn.addEventListener('click', () => {
        advancedOptions.style.display = advancedOptions.style.display === 'block' ? 'none' : 'block';
    });
    
    convertBtn.addEventListener('click', convertToPDF);
    
    resetBtn.addEventListener('click', resetConverter);
    
    downloadAllBtn.addEventListener('click', downloadAllFiles);
    
    clearAllBtn.addEventListener('click', clearAllFiles);
    
    // Functions
    function handleFileSelect(e) {
        files = Array.from(e.target.files);
        updateFileList();
    }
    
    function updateFileList() {
        if (files.length > 0) {
            convertBtn.disabled = false;
        } else {
            convertBtn.disabled = true;
        }
    }
    
    async function convertToPDF() {
        if (files.length === 0) return;
        
        convertBtn.disabled = true;
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
        
        try {
            // Process each file
            for (const file of files) {
                await processFile(file);
            }
            
            // Show results section
            resultsSection.style.display = 'block';
            
            // Scroll to results
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth' });
            }, 300);
            
        } catch (error) {
            console.error('Conversion error:', error);
            alert('An error occurred during conversion. Please try again.');
        } finally {
            convertBtn.disabled = false;
            convertBtn.innerHTML = '<i class="fas fa-file-export"></i> Convert to PDF';
        }
    }
    
    async function processFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get conversion options
                    const options = getConversionOptions();
                    
                    // Process each worksheet
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const pdf = new jsPDF({
                            orientation: options.pageLayout === 'landscape' ? 'landscape' : 'portrait',
                            unit: 'mm',
                            format: options.pageSize
                        });
                        
                        // Convert worksheet to HTML
                        const html = XLSX.utils.sheet_to_html(worksheet, {
                            showGridLines: options.gridlines === 'show'
                        });
                        
                        // Add HTML to PDF
                        pdf.html(html, {
                            callback: function(pdf) {
                                // Save PDF
                                const pdfBlob = pdf.output('blob');
                                const pdfUrl = URL.createObjectURL(pdfBlob);
                                
                                // Add to results
                                addResultToGrid(file.name, pdfUrl, pdfBlob);
                                resolve();
                            },
                            x: 10,
                            y: 10,
                            width: options.pageLayout === 'landscape' ? 277 : 190, // A4 dimensions in mm
                            windowWidth: 1000
                        });
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    function getConversionOptions() {
        return {
            pageLayout: document.getElementById('pageLayout').value,
            pageSize: document.getElementById('pageSize').value,
            gridlines: document.getElementById('gridlines').value,
            headers: document.getElementById('headers').value,
            fitToPage: document.getElementById('fitToPage').checked,
            repeatHeaders: document.getElementById('repeatHeaders').checked,
            blackAndWhite: document.getElementById('blackAndWhite').checked,
            includeComments: document.getElementById('includeComments').checked
        };
    }
    
    function addResultToGrid(originalName, pdfUrl, pdfBlob) {
        const fileName = originalName.replace(/\.[^/.]+$/, '') + '.pdf';
        const fileSize = formatFileSize(pdfBlob.size);
        
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        resultCard.innerHTML = `
            <div class="result-card-icon">
                <i class="fas fa-file-pdf"></i>
            </div>
            <div class="result-card-info">
                <h3>${fileName}</h3>
                <p>${fileSize}</p>
            </div>
            <div class="result-card-actions">
                <button class="download-btn" data-url="${pdfUrl}" data-filename="${fileName}">
                    <i class="fas fa-download"></i>
                </button>
                <button class="preview-btn" data-url="${pdfUrl}">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        `;
        
        resultsGrid.appendChild(resultCard);
        
        // Add event listeners to new buttons
        resultCard.querySelector('.download-btn').addEventListener('click', (e) => {
            downloadPDF(e.target.closest('button').dataset.url, e.target.closest('button').dataset.filename);
        });
        
        resultCard.querySelector('.preview-btn').addEventListener('click', (e) => {
            previewPDF(e.target.closest('button').dataset.url);
        });
    }
    
    function downloadPDF(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    function previewPDF(url) {
        window.open(url, '_blank');
    }
    
    function downloadAllFiles() {
        const downloadButtons = resultsGrid.querySelectorAll('.download-btn');
        downloadButtons.forEach(btn => {
            const url = btn.dataset.url;
            const filename = btn.dataset.filename;
            downloadPDF(url, filename);
        });
    }
    
    function clearAllFiles() {
        resultsGrid.innerHTML = '';
        resultsSection.style.display = 'none';
        files = [];
        fileInput.value = '';
        updateFileList();
    }
    
    function resetConverter() {
        // Reset form elements to default values
        document.getElementById('pageLayout').value = 'portrait';
        document.getElementById('pageSize').value = 'a4';
        document.getElementById('gridlines').value = 'show';
        document.getElementById('headers').value = 'include';
        document.getElementById('fitToPage').checked = false;
        document.getElementById('repeatHeaders').checked = false;
        document.getElementById('blackAndWhite').checked = false;
        document.getElementById('includeComments').checked = false;
        
        // Hide advanced options
        advancedOptions.style.display = 'none';
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    }
    
    // Initialize
    resetConverter();
    updateFileList();
});
