document.addEventListener('DOMContentLoaded', function() {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    
    // DOM elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFile');
    const clearFileBtn = document.getElementById('clearFile');
    const generatePdfBtn = document.getElementById('generatePdf');
    const previewContainer = document.getElementById('previewContainer');
    const fileInfoContainer = document.getElementById('fileInfo');
    
    // Settings elements
    const pageSizeSelect = document.getElementById('pageSize');
    const customSizeGroup = document.getElementById('customSizeGroup');
    const customWidthInput = document.getElementById('customWidth');
    const customHeightInput = document.getElementById('customHeight');
    const pageOrientationSelect = document.getElementById('pageOrientation');
    const marginSizeSlider = document.getElementById('marginSize');
    const marginValueSpan = document.getElementById('marginValue');
    const fontSizeSlider = document.getElementById('fontSize');
    const fontSizeValueSpan = document.getElementById('fontSizeValue');
    const headerColorInput = document.getElementById('headerColor');
    const cellPaddingSlider = document.getElementById('cellPadding');
    const cellPaddingValueSpan = document.getElementById('cellPaddingValue');
    const showGridSelect = document.getElementById('showGrid');
    const pdfNameInput = document.getElementById('pdfName');
    
    // Store uploaded file data
    let excelData = null;
    let currentSheetIndex = 0;
    
    // Event listeners for drag and drop
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
        const files = dt.files;
        if (files.length) {
            handleFile(files[0]);
        }
    }
    
    // File input click
    selectFileBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFile(fileInput.files[0]);
        }
    });
    
    // Clear file button
    clearFileBtn.addEventListener('click', () => {
        excelData = null;
        updateFileInfo();
        updatePreview();
        generatePdfBtn.disabled = true;
        fileInput.value = '';
    });
    
    // Generate PDF button
    generatePdfBtn.addEventListener('click', generatePdf);
    
    // Settings change listeners
    pageSizeSelect.addEventListener('change', function() {
        customSizeGroup.style.display = this.value === 'custom' ? 'block' : 'none';
    });
    
    marginSizeSlider.addEventListener('input', function() {
        marginValueSpan.textContent = `${this.value} mm`;
    });
    
    fontSizeSlider.addEventListener('input', function() {
        fontSizeValueSpan.textContent = `${this.value} pt`;
        updatePreview();
    });
    
    cellPaddingSlider.addEventListener('input', function() {
        cellPaddingValueSpan.textContent = `${this.value} px`;
    });
    
    // Handle uploaded file
    function handleFile(file) {
        // Check if file is an Excel file
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
            alert('Please upload an Excel file (.xlsx, .xls, .csv)');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Extract data from all sheets
            excelData = {
                fileName: file.name,
                fileSize: formatFileSize(file.size),
                sheets: [],
                sheetNames: workbook.SheetNames
            };
            
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                excelData.sheets.push(jsonData);
            });
            
            updateFileInfo();
            updatePreview();
            generatePdfBtn.disabled = false;
        };
        
        reader.readAsArrayBuffer(file);
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Update file info in UI
    function updateFileInfo() {
        fileInfoContainer.innerHTML = '';
        
        if (!excelData) {
            fileInfoContainer.innerHTML = '<p class="empty-message">No file uploaded yet</p>';
            return;
        }
        
        const fileInfoHTML = `
            <h3><i class="fas fa-file-excel"></i> File Information</h3>
            <div class="file-details">
                <div class="file-detail">
                    <label>File Name:</label>
                    <p>${excelData.fileName}</p>
                </div>
                <div class="file-detail">
                    <label>File Size:</label>
                    <p>${excelData.fileSize}</p>
                </div>
                <div class="file-detail">
                    <label>Sheets:</label>
                    <p>${excelData.sheetNames.length}</p>
                </div>
                <div class="file-detail">
                    <label>Rows in Current Sheet:</label>
                    <p>${excelData.sheets[currentSheetIndex].length}</p>
                </div>
            </div>
            <div class="sheet-selector">
                <label>Select Sheet:</label>
                <div class="sheet-buttons" id="sheetButtons">
                    ${excelData.sheetNames.map((name, index) => `
                        <button class="sheet-btn ${index === currentSheetIndex ? 'active' : ''}" 
                                data-index="${index}">
                            ${name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        fileInfoContainer.innerHTML = fileInfoHTML;
        
        // Add event listeners for sheet buttons
        document.querySelectorAll('.sheet-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                currentSheetIndex = parseInt(this.getAttribute('data-index'));
                updateFileInfo();
                updatePreview();
            });
        });
    }
    
    // Update preview
    function updatePreview() {
        previewContainer.innerHTML = '';
        
        if (!excelData) {
            previewContainer.innerHTML = '<p>No Excel file selected yet</p>';
            return;
        }
        
        const sheetData = excelData.sheets[currentSheetIndex];
        if (sheetData.length === 0) {
            previewContainer.innerHTML = '<p>Selected sheet is empty</p>';
            return;
        }
        
        // Create preview table
        const table = document.createElement('table');
        table.className = 'preview-table';
        
        // Create header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Use first row as headers if available
        const headers = sheetData[0] || [];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header !== undefined ? header : '';
            th.style.fontSize = `${fontSizeSlider.value}px`;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body rows (show up to 10 rows for preview)
        const tbody = document.createElement('tbody');
        const maxPreviewRows = Math.min(10, sheetData.length - 1);
        
        for (let i = 1; i <= maxPreviewRows; i++) {
            const rowData = sheetData[i] || [];
            const row = document.createElement('tr');
            
            headers.forEach((_, colIndex) => {
                const td = document.createElement('td');
                td.textContent = rowData[colIndex] !== undefined ? rowData[colIndex] : '';
                td.style.fontSize = `${fontSizeSlider.value}px`;
                td.style.padding = `${cellPaddingSlider.value}px`;
                row.appendChild(td);
            });
            
            tbody.appendChild(row);
        }
        
        table.appendChild(tbody);
        previewContainer.appendChild(table);
        
        // Add note about preview limits
        if (sheetData.length > maxPreviewRows + 1) {
            const note = document.createElement('p');
            note.style.marginTop = '10px';
            note.style.fontSize = '14px';
            note.style.color = 'var(--light-text)';
            note.textContent = `Preview showing first ${maxPreviewRows} rows of ${sheetData.length - 1} total rows`;
            previewContainer.appendChild(note);
        }
    }
    
    // Get page size in millimeters
    function getPageSizeInMM() {
        let width, height;
        
        switch (pageSizeSelect.value) {
            case 'a4':
                width = 210;
                height = 297;
                break;
            case 'letter':
                width = 215.9;
                height = 279.4;
                break;
            case 'legal':
                width = 215.9;
                height = 355.6;
                break;
            case 'custom':
                width = parseFloat(customWidthInput.value) || 210;
                height = parseFloat(customHeightInput.value) || 297;
                break;
            default:
                width = 210;
                height = 297;
        }
        
        if (pageOrientationSelect.value === 'landscape') {
            return { width: Math.max(width, height), height: Math.min(width, height) };
        } else {
            return { width: Math.min(width, height), height: Math.max(width, height) };
        }
    }
    
    // Generate PDF
    function generatePdf() {
        if (!excelData) return;
        
        const pdfName = pdfNameInput.value.trim() || excelData.fileName.replace(/\.[^/.]+$/, "") + '.pdf';
        const pdf = new jsPDF({
            orientation: pageOrientationSelect.value,
            unit: 'mm'
        });
        
        const pageSize = getPageSizeInMM();
        const margin = parseFloat(marginSizeSlider.value);
        const fontSize = parseFloat(fontSizeSlider.value);
        const headerColor = headerColorInput.value;
        const cellPadding = parseFloat(cellPaddingSlider.value) / 3; // Approximate conversion from px to mm
        const showGrid = showGridSelect.value === 'true';
        
        // Process current sheet
        const sheetData = excelData.sheets[currentSheetIndex];
        if (sheetData.length === 0) return;
        
        // Extract headers (use first row if available)
        const headers = sheetData[0] || [];
        
        // Prepare data for autotable (skip header row if it exists)
        const data = sheetData.slice(1).map(row => {
            return headers.map((_, colIndex) => row[colIndex] !== undefined ? row[colIndex] : '');
        });
        
        // PDF settings
        pdf.autoTable({
            head: [headers],
            body: data,
            startY: margin,
            margin: { top: margin, right: margin, bottom: margin, left: margin },
            styles: {
                fontSize: fontSize,
                cellPadding: cellPadding,
                overflow: 'linebreak',
                halign: 'left',
                valign: 'middle'
            },
            headStyles: {
                fillColor: headerColor,
                textColor: '#ffffff',
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: '#f8f9fa'
            },
            tableWidth: 'auto',
            showHead: 'everyPage',
            pageBreak: 'auto',
            theme: showGrid ? 'grid' : 'plain',
            didDrawPage: function(data) {
                // Footer with page number
                const pageCount = pdf.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    pdf.setPage(i);
                    pdf.setFontSize(10);
                    pdf.setTextColor(150);
                    pdf.text(
                        `Page ${i} of ${pageCount}`,
                        pageSize.width - margin - 20,
                        pageSize.height - margin + 10
                    );
                }
            }
        });
        
        // Save PDF
        pdf.save(pdfName);
    }
});