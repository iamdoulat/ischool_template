/**
 * cvDownload.ts
 * Captures a DOM element (the off-screen StudentCVTemplate) with html2canvas
 * and saves it as an A4 PDF via jsPDF.
 */

export async function downloadStudentCVAsPdf(
  element: HTMLElement,
  filename: string = "student-cv.pdf"
): Promise<void> {
  // Lazy-load to avoid SSR issues
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  // A4 dimensions in mm
  const A4_W_MM = 210;
  const A4_H_MM = 297;

  // Capture at 2× scale for crisp text
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");

  // Calculate image height to maintain aspect ratio within A4
  const canvasW = canvas.width;
  const canvasH = canvas.height;
  const ratio = canvasH / canvasW;

  const imgW = A4_W_MM;
  const imgH = imgW * ratio;

  const pdf = new jsPDF({
    orientation: imgH > A4_H_MM ? "portrait" : "portrait",
    unit: "mm",
    format: "a4",
  });

  // If content fits in one page
  if (imgH <= A4_H_MM) {
    pdf.addImage(imgData, "PNG", 0, 0, imgW, imgH);
  } else {
    // Multi-page: slice the canvas into A4-height chunks
    const pageHeightPx = Math.floor((canvasW * A4_H_MM) / A4_W_MM);
    let yOffset = 0;
    let pageIndex = 0;

    while (yOffset < canvasH) {
      const sliceH = Math.min(pageHeightPx, canvasH - yOffset);

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvasW;
      pageCanvas.height = sliceH;

      const ctx = pageCanvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasW, sliceH);
      ctx.drawImage(canvas, 0, -yOffset);

      const pageImg = pageCanvas.toDataURL("image/png");
      const sliceHMm = (sliceH / canvasW) * A4_W_MM;

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(pageImg, "PNG", 0, 0, A4_W_MM, sliceHMm);

      yOffset += pageHeightPx;
      pageIndex++;
    }
  }

  pdf.save(filename);
}
