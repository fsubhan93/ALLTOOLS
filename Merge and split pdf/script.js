async function mergePDFs() {
  const input = document.getElementById('mergeFiles');
  const files = Array.from(input.files);
  if (files.length < 2) return alert("Select at least two PDFs");

  const mergedPdf = await PDFLib.PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach(page => mergedPdf.addPage(page));
  }

  const pdfBytes = await mergedPdf.save();
  downloadPDF(pdfBytes, 'merged.pdf');
}

async function splitPDF() {
  const file = document.getElementById('splitFile').files[0];
  const pageIndex = parseInt(document.getElementById('splitPage').value) - 1;
  if (!file || isNaN(pageIndex)) return alert("Select a file and a page number");

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
  const newPdf = await PDFLib.PDFDocument.create();
  const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex]);
  newPdf.addPage(copiedPage);
  const pdfBytes = await newPdf.save();
  downloadPDF(pdfBytes, 'split_page.pdf');
}

async function editPDF() {
  const file = document.getElementById('editFile').files[0];
  const title = document.getElementById('pdfTitle').value;
  const author = document.getElementById('pdfAuthor').value;
  if (!file) return alert("Select a PDF file");

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
  if (title) pdfDoc.setTitle(title);
  if (author) pdfDoc.setAuthor(author);
  const pdfBytes = await pdfDoc.save();
  downloadPDF(pdfBytes, 'edited.pdf');
}

function downloadPDF(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
