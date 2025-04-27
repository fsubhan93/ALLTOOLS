// Define all tools with unique icons
const tools = {
  "docTools": [
    { name: "PDF to DOC", link: "tools/pdf-to-doc.html", icon: "icons/pdf.png" },
    { name: "DOC to PDF", link: "tools/doc.png", icon: "icons/doc.png" },
    { name: "PDF to PPT", link: "tools/pdf-to-ppt.html", icon: "icons/ppt.png" },
    { name: "PPT to PDF", link: "tools/ppt-to-pdf.html", icon: "icons/pdf.png" },
    { name: "PDF to Excel", link: "tools/pdf-to-excel.html", icon: "icons/excel.png" },
    { name: "Excel to PDF", link: "tools/excel-to-pdf.html", icon: "icons/pdf.png" },
    { name: "PDF to TXT", link: "tools/pdf-to-txt.html", icon: "icons/txt.png" },
    { name: "TXT to PDF", link: "tools/txt-to-pdf.html", icon: "icons/pdf.png" },
    { name: "PDF to EPUB", link: "tools/pdf-to-epub.html", icon: "icons/epub.png" },
    { name: "EPUB to PDF", link: "tools/epub-to-pdf.html", icon: "icons/pdf.png" },
    { name: "Word to HTML", link: "tools/word-to-html.html", icon: "icons/html.png" },
    { name: "HTML to Word", link: "tools/html-to-word.html", icon: "icons/word.png" }
  ],
  
  "imgTools": [
    { name: "JPG to PNG", link: "tools/jpg-to-png.html", icon: "icons/image.png" },
    { name: "PNG to JPG", link: "tools/png-to-jpg.html", icon: "icons/image.png" },
    { name: "JPG to PDF", link: "tools/jpg-to-pdf.html", icon: "icons/pdf.png" },
    { name: "PNG to PDF", link: "tools/png-to-pdf.html", icon: "icons/pdf.png" },
    { name: "GIF to JPG", link: "tools/gif-to-jpg.html", icon: "icons/gif.png" },
    { name: "GIF to MP4", link: "tools/gif-to-mp4.html", icon: "icons/video.png" },
    { name: "BMP to JPG", link: "tools/bmp-to-jpg.html", icon: "icons/image.png" },
    { name: "WebP to JPG", link: "tools/webp-to-jpg.html", icon: "icons/image.png" },
    { name: "SVG to PNG", link: "tools/svg-to-png.html", icon: "icons/image.png" },
    { name: "HEIC to JPG", link: "tools/heic-to-jpg.html", icon: "icons/image.png" }
  ],

  "vidTools": [
    { name: "MP4 to MP3", link: "tools/mp4-to-mp3.html", icon: "icons/video.png" },
    { name: "MOV to MP4", link: "tools/mov-to-mp4.html", icon: "icons/video.png" },
    { name: "AVI to MP4", link: "tools/avi-to-mp4.html", icon: "icons/video.png" },
    { name: "MKV to MP4", link: "tools/mkv-to-mp4.html", icon: "icons/video.png" },
    { name: "WMV to MP4", link: "tools/wmv-to-mp4.html", icon: "icons/video.png" },
    { name: "FLV to MP4", link: "tools/flv-to-mp4.html", icon: "icons/video.png" },
    { name: "WebM to MP4", link: "tools/webm-to-mp4.html", icon: "icons/video.png" }
  ],

  "audioTools": [
    { name: "MP3 to WAV", link: "tools/mp3-to-wav.html", icon: "icons/audio.png" },
    { name: "WAV to MP3", link: "tools/wav-to-mp3.html", icon: "icons/audio.png" },
    { name: "M4A to MP3", link: "tools/m4a-to-mp3.html", icon: "icons/audio.png" },
    { name: "OGG to MP3", link: "tools/ogg-to-mp3.html", icon: "icons/audio.png" },
    { name: "FLAC to MP3", link: "tools/flac-to-mp3.html", icon: "icons/audio.png" }
  ],

  "archiveTools": [
    { name: "RAR to ZIP", link: "tools/rar-to-zip.html", icon: "icons/archive.png" },
    { name: "ZIP to RAR", link: "tools/zip-to-rar.html", icon: "icons/archive.png" },
    { name: "7Z to ZIP", link: "tools/7z-to-zip.html", icon: "icons/archive.png" },
    { name: "Extract Files", link: "tools/extract-files.html", icon: "icons/extract.png" }
  ],

  "otherTools": [
    { name: "Image Resizer", link: "tools/image-resizer.html", icon: "icons/resize.png" },
    { name: "Image Compressor", link: "tools/image-compressor.html", icon: "icons/compress.png" },
    { name: "PDF Compressor", link: "tools/pdf-compressor.html", icon: "icons/pdf.png" },
    { name: "PDF Merger", link: "tools/pdf-merger.html", icon: "icons/pdf.png" },
    { name: "PDF Splitter", link: "tools/pdf-splitter.html", icon: "icons/pdf.png" },
    { name: "PDF Unlocker", link: "tools/pdf-unlocker.html", icon: "icons/unlock.png" },
    { name: "PDF Protector", link: "tools/pdf-protector.html", icon: "icons/lock.png" },
    { name: "Watermark Adder", link: "tools/watermark-adder.html", icon: "icons/watermark.png" },
    { name: "PDF Page Rotator", link: "tools/pdf-rotator.html", icon: "icons/rotate.png" },
    { name: "Online OCR", link: "tools/online-ocr.html", icon: "icons/ocr.png" },
    { name: "Font Converter", link: "tools/font-converter.html", icon: "icons/font.png" },
    { name: "Color Converter", link: "tools/color-converter.html", icon: "icons/color.png" },
    { name: "Unit Converters", link: "tools/unit-converters.html", icon: "icons/unit.png" }
  ]
};

// Function to create cards
function generateTools(sectionId, toolsList) {
  const section = document.getElementById(sectionId);
  toolsList.forEach(tool => {
    const card = document.createElement("a");
    card.href = tool.link;
    card.className = "tool-card";
    card.innerHTML = `
      <img src="${tool.icon}" alt="${tool.name}">
      <h3>${tool.name}</h3>
    `;
    section.appendChild(card);
  });
}

// Load tools
for (const [sectionId, toolsList] of Object.entries(tools)) {
  generateTools(sectionId, toolsList);
}
