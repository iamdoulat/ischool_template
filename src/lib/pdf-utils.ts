import jsPDF from 'jspdf';

export const renderPdfHeader = async (
    doc: jsPDF,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoicePrintSettings: any,
    baseApiUrl: string,
    title: string
): Promise<number> => {
    let startY = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const { header_image_url } = invoicePrintSettings;
    let imageLoaded = false;

    const loadImageAsBase64 = async (url: string): Promise<string> => {
        try {
            const proxyUrl = `/api/camera-proxy?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Failed to load image as base64", e);
            throw e;
        }
    };

    if (header_image_url) {
        try {
            let imgUrl = header_image_url;
            if (imgUrl.startsWith('/')) imgUrl = baseApiUrl + imgUrl;
            imgUrl = imgUrl.replace('localhost', '127.0.0.1');

            const base64Data = await loadImageAsBase64(imgUrl);
            const imgProps = doc.getImageProperties(base64Data);
            const imgWidth = 190;
            const imgHeight = (imgProps.height / imgProps.width) * imgWidth;
            const ext = imgUrl.toLowerCase().match(/\.(jpeg|jpg)$/) ? 'JPEG' : 'PNG';
            doc.addImage(base64Data, ext, 10, startY, imgWidth, imgHeight);
            startY += imgHeight + 10;
            imageLoaded = true;
        } catch (error) {
            console.error("Failed to load header image for PDF:", error);
        }
    }

    if (!imageLoaded) {
        // Render Default Header Layout
        let logoY = startY;
        if (settings?.print_logo) {
            try {
                let logoUrl = settings.print_logo;
                if (logoUrl.startsWith('/')) logoUrl = baseApiUrl + logoUrl;
                logoUrl = logoUrl.replace('localhost', '127.0.0.1');
                const base64Data = await loadImageAsBase64(logoUrl);
                const imgProps = doc.getImageProperties(base64Data);
                const imgHeight = (imgProps.height / imgProps.width) * 40;
                const ext = logoUrl.toLowerCase().match(/\.(jpeg|jpg)$/) ? 'JPEG' : 'PNG';
                doc.addImage(base64Data, ext, 14, startY, 40, imgHeight);
                logoY += imgHeight + 5;
            } catch (error) {
                console.error("Failed to add print_logo to PDF:", error);
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("SMART SCHOOL", 14, startY + 5);
                logoY += 10;
            }
        } else {
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("SMART SCHOOL", 14, startY + 5);
            logoY += 10;
        }

        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text(settings?.school_name || "Your School Name Here", 14, logoY + 5);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        let rightY = startY + 5;
        doc.text(`Address: ${settings?.address || "25 Kings Street, CA"}`, pageWidth - 14, rightY, { align: "right" });
        rightY += 5;
        doc.text(`Phone No.: ${settings?.phone || "89562423934"}`, pageWidth - 14, rightY, { align: "right" });
        rightY += 5;
        doc.text(`Email: ${settings?.email || "yourschool@gmail.com"}`, pageWidth - 14, rightY, { align: "right" });
        rightY += 5;
        doc.text(`Website: ${settings?.base_url?.replace(/^https?:\/\//, '') || "www.yoursite.in"}`, pageWidth - 14, rightY, { align: "right" });

        startY = Math.max(logoY + 15, rightY + 10);

        // Render black bar with title
        doc.setFillColor(0, 0, 0);
        doc.rect(14, startY, pageWidth - 28, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), pageWidth / 2, startY + 5.5, { align: "center" });
        doc.setTextColor(0, 0, 0); // reset color
        startY += 15;
    }

    return startY;
};

export const renderPdfFooter = (
    doc: jsPDF,
    footerContent: string,
    finalY: number
) => {
    if (footerContent) {
        doc.setFontSize(10);
        const pageWidth = doc.internal.pageSize.getWidth();
        const lines = doc.splitTextToSize(footerContent, 180);
        doc.text(lines, pageWidth / 2, finalY, { align: "center" });
    }
};
