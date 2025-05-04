document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const convertBtn = document.getElementById('convertBtn');
    const preview = document.getElementById('preview');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const status = document.getElementById('status');
    
    let docContent = '';
    
    // Drag and drop setup
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
        dropZone.style.borderColor = "var(--secondary)";
        dropZone.style.backgroundColor = "rgba(67, 97, 238, 0.05)";
    }
    
    function unhighlight() {
        dropZone.style.borderColor = "var(--accent)";
        dropZone.style.backgroundColor = "transparent";
    }
    
    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFileSelect);
    dropZone.addEventListener('click', () => fileInput.click());
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFile(file);
    }
    
    function handleFileSelect() {
        const file = fileInput.files[0];
        handleFile(file);
    }
    
    function handleFile(file) {
        if (!file.name.match(/\.(doc|docx)$/i)) {
            showStatus("Please select a Word document (DOC/DOCX)", "error");
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            showStatus("File is too large (max 10MB)", "error");
            return;
        }
        
        dropZone.innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--success)"></i>
            <h3>${file.name}</h3>
            <p>${formatFileSize(file.size)} | Ready to convert</p>
        `;
        
        // Read and preview the document
        const reader = new FileReader();
        reader.onload = function(e) {
            mammoth.extractRawText({ arrayBuffer: e.target.result })
                .then(result => {
                    docContent = result.value;
                    preview.innerHTML = `<h4>Document Preview:</h4><div class="doc-preview">${formatPreview(docContent)}</div>`;
                    convertBtn.disabled = false;
                })
                .catch(error => {
                    console.error(error);
                    showStatus("Error reading document", "error");
                });
        };
        reader.readAsArrayBuffer(file);
    }
    
    convertBtn.addEventListener('click', convertToPPT);
    
    function convertToPPT() {
        if (!docContent) {
            showStatus("Please select a Word document first", "error");
            return;
        }
        
        try {
            convertBtn.disabled = true;
            progressContainer.style.display = "block";
            showStatus("Converting to PowerPoint...", "processing");
            
            // Initialize PowerPoint
            const pptx = new PptxGenJS();
            const theme = document.getElementById('theme').value;
            const font = document.getElementById('font').value;
            const addToc = document.getElementById('addToc').checked;
            const addNumbers = document.getElementById('addNumbers').checked;
            
            // Apply theme
            setTheme(pptx, theme, font);
            
            // Split content into slides (by headings)
            const slidesContent = splitContentToSlides(docContent);
            
            // Add title slide
            let titleSlide = pptx.addSlide();
            titleSlide.addText("Presentation", {
                x: 1, y: 1, w: "90%", h: 1,
                fontSize: 36,
                bold: true,
                align: "center"
            });
            
            // Add Table of Contents if enabled
            if (addToc && slidesContent.length > 1) {
                let tocSlide = pptx.addSlide();
                tocSlide.addText("Table of Contents", {
                    x: 1, y: 0.5, w: "90%", h: 0.5,
                    fontSize: 24,
                    bold: true
                });
                
                let tocContent = slidesContent
                    .filter(slide => slide.title)
                    .map((slide, idx) => `${idx + 1}. ${slide.title}`)
                    .join('\n');
                
                tocSlide.addText(tocContent, {
                    x: 1, y: 1.5, w: "90%", h: 4,
                    bullet: true
                });
            }
            
            // Add content slides
            slidesContent.forEach((slide, idx) => {
                updateProgress((idx + 1) / (slidesContent.length + 2) * 100);
                
                let newSlide = pptx.addSlide();
                if (slide.title) {
                    newSlide.addText(slide.title, {
                        x: 0.5, y: 0.5, w: "90%", h: 0.8,
                        fontSize: 28,
                        bold: true
                    });
                }
                
                if (slide.content) {
                    newSlide.addText(slide.content, {
                        x: 0.5, y: slide.title ? 1.5 : 0.8, w: "90%", h: 4,
                        fontSize: 18
                    });
                }
                
                // Add slide number if enabled
                if (addNumbers) {
                    newSlide.addText(`Slide ${idx + 1}`, {
                        x: "90%", y: "90%", w: 1, h: 0.3,
                        fontSize: 10,
                        align: "right"
                    });
                }
            });
            
            // Generate and download
            pptx.writeFile({ fileName: "converted_presentation.pptx" })
                .then(() => {
                    showStatus("Conversion complete! Download started.", "success");
                })
                .catch(error => {
                    console.error(error);
                    showStatus("Error generating PowerPoint", "error");
                })
                .finally(() => {
                    convertBtn.disabled = false;
                    progressContainer.style.display = "none";
                });
            
        } catch (error) {
            console.error(error);
            showStatus("Conversion failed: " + error.message, "error");
            convertBtn.disabled = false;
            progressContainer.style.display = "none";
        }
    }
    
    // Helper functions
    function setTheme(pptx, theme, font) {
        const themes = {
            blue: {
                titleColor: "2a52be",
                textColor: "333333",
                background: "f8f9fa"
            },
            green: {
                titleColor: "4CAF50",
                textColor: "333333",
                background: "f1f8e9"
            },
            red: {
                titleColor: "D32F2F",
                textColor: "333333",
                background: "ffebee"
            },
            purple: {
                titleColor: "7B1FA2",
                textColor: "333333",
                background: "f3e5f5"
            }
        };
        
        pptx.defineSlideMaster({
            title: "MASTER_SLIDE",
            background: { color: themes[theme].background },
            objects: [
                { rect: { x: 0, y: 0, w: "100%", h: 0.4, fill: { color: themes[theme].titleColor } } }
            ],
            slideNumber: { x: "90%", y: "90%" }
        });
        
        pptx.fontFace = {
            title: { name: font, bold: true },
            body: { name: font }
        };
    }
    
    function splitContentToSlides(content) {
        // Split by headings (assuming H1/H2 are slide titles)
        const sections = content.split(/\n\s*\n/);
        const slides = [];
        let currentSlide = {};
        
        sections.forEach(section => {
            if (section.match(/^#+\s.+/)) { // Markdown-style heading
                if (currentSlide.title || currentSlide.content) {
                    slides.push(currentSlide);
                    currentSlide = {};
                }
                currentSlide.title = section.replace(/^#+\s/, '');
            } else {
                currentSlide.content = (currentSlide.content || '') + section + '\n';
            }
        });
        
        if (currentSlide.title || currentSlide.content) {
            slides.push(currentSlide);
        }
        
        return slides.length ? slides : [{ content: content }];
    }
    
    function formatPreview(text) {
        return text
            .replace(/\n/g, '<br>')
            .replace(/^# (.*$)/gm, '<h4>$1</h4>')
            .replace(/^## (.*$)/gm, '<h5>$1</h5>');
    }
    
    function showStatus(message, type) {
        status.textContent = message;
        status.style.display = "block";
        status.className = "status " + type;
    }
    
    function updateProgress(percent) {
        progressBar.style.width = percent + "%";
        progressText.textContent = Math.round(percent) + "%";
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + " bytes";
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        else return (bytes / 1048576).toFixed(1) + " MB";
    }
});
