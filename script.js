// All tools configuration
const tools = {
    // Document Converters
    "pdf-to-doc": {
        title: "PDF to Word Converter",
        description: "Convert PDF files to editable Word documents while preserving formatting.",
        icon: "file-word",
        accept: ".pdf",
        options: [
            { 
                label: "Output Format", 
                type: "select", 
                id: "format", 
                options: [
                    { value: "docx", text: "DOCX (Word 2007+)" },
                    { value: "doc", text: "DOC (Word 97-2003)" }
                ] 
            },
            { 
                label: "Image Quality", 
                type: "select", 
                id: "quality", 
                options: [
                    { value: "high", text: "High Quality" },
                    { value: "medium", text: "Medium Quality" },
                    { value: "low", text: "Low Quality" }
                ] 
            }
        ]
    },
    
    // Image Converters
    "gif-to-mp4": {
        title: "GIF to MP4 Converter",
        description: "Convert animated GIFs to MP4 videos for better compatibility and smaller size.",
        icon: "file-video",
        accept: "image/gif",
        options: [
            { 
                label: "Video Quality", 
                type: "select", 
                id: "quality", 
                options: [
                    { value: "hd", text: "HD (720p)" },
                    { value: "sd", text: "SD (480p)" }
                ] 
            },
            { 
                label: "Frame Rate (FPS)", 
                type: "number", 
                id: "fps", 
                min: 10, 
                max: 60, 
                value: 24 
            }
        ]
    },
    
    // Archive Tools
    "zip-to-rar": {
        title: "ZIP to RAR Converter",
        description: "Convert ZIP archives to RAR format for better compression ratios.",
        icon: "file-archive",
        accept: ".zip",
        options: [
            { 
                label: "Compression Level", 
                type: "select", 
                id: "compression", 
                options: [
                    { value: "store", text: "Store (no compression)" },
                    { value: "fast", text: "Fast" },
                    { value: "normal", text: "Normal" },
                    { value: "best", text: "Best" }
                ] 
            },
            { 
                label: "Split Archive (MB)", 
                type: "number", 
                id: "split", 
                min: 0, 
                max: 2000, 
                value: 0,
                placeholder: "0 for no splitting"
            }
        ]
    }
};

// Add more tools following the same pattern...
