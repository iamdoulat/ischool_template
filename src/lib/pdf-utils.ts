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

// ─── Admission Form PDF ───────────────────────────────────────────────────────

export interface AdmissionFormConfig {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    documents?: any[];
    fee_policy?: string;
    office_use_only?: string;
    terms_conditions?: string;
    declaration?: string;
}

export const downloadAdmissionFormPdf = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentData: any,
    className: string,
    sectionName: string,
    filename: string,
    photoUrl?: string,
    schoolInfo?: { name?: string; slogan?: string; currencySymbol?: string },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentPhotos?: any,
    admissionFormConfig?: AdmissionFormConfig
): Promise<void> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 15;

    const safeText = (val: unknown): string => {
        if (val === null || val === undefined) return "-";
        return String(val).replace(/[^\x00-\x7F]/g, "").trim() || "-";
    };

    const loadImageAsBase64 = async (url: string): Promise<string> => {
        const proxyUrl = `/api/camera-proxy?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // ── Header ──────────────────────────────────────────────────────────────
    const schoolName = safeText(schoolInfo?.name || "Your School");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(schoolName, pageWidth / 2, y, { align: "center" });
    y += 7;

    if (schoolInfo?.slogan) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(safeText(schoolInfo.slogan), pageWidth / 2, y, { align: "center" });
        y += 6;
    }

    // Title bar
    doc.setFillColor(30, 30, 30);
    doc.rect(14, y, pageWidth - 28, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("STUDENT ADMISSION FORM", pageWidth / 2, y + 5.5, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y += 14;

    // ── Student Photo ────────────────────────────────────────────────────────
    const photoX = pageWidth - 14 - 30;
    if (photoUrl) {
        try {
            let imgData: string;
            if (photoUrl.startsWith("data:")) {
                imgData = photoUrl;
            } else {
                const pUrl = photoUrl.replace("localhost", "127.0.0.1");
                imgData = await loadImageAsBase64(pUrl);
            }
            doc.addImage(imgData, "PNG", photoX, y, 30, 36);
            doc.rect(photoX, y, 30, 36);
        } catch {
            doc.rect(photoX, y, 30, 36);
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text("Photo", photoX + 8, y + 19);
            doc.setTextColor(0, 0, 0);
        }
    } else {
        doc.rect(photoX, y, 30, 36);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text("Photo", photoX + 8, y + 19);
        doc.setTextColor(0, 0, 0);
    }

    const infoX = 14;
    const colW = (photoX - infoX - 6) / 2;

    // ── Student Info ─────────────────────────────────────────────────────────
    const addLabelValue = (label: string, value: string, x: number, cy: number, w = colW) => {
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text(label.toUpperCase(), x, cy);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(20, 20, 20);
        doc.text(safeText(value), x, cy + 4, { maxWidth: w - 2 });
    };

    let infoY = y;
    const fullName = safeText(studentData?.full_name || `${studentData?.name || ""} ${studentData?.last_name || ""}`.trim());
    addLabelValue("Student Name", fullName, infoX, infoY, colW * 2);
    infoY += 11;

    addLabelValue("Admission No.", safeText(studentData?.admission_no), infoX, infoY);
    addLabelValue("Roll No.", safeText(studentData?.roll_no), infoX + colW + 3, infoY);
    infoY += 11;

    addLabelValue("Class", className, infoX, infoY);
    addLabelValue("Section", sectionName, infoX + colW + 3, infoY);
    infoY += 11;

    addLabelValue("Date of Birth", safeText(studentData?.dob), infoX, infoY);
    addLabelValue("Gender", safeText(studentData?.gender), infoX + colW + 3, infoY);
    infoY += 11;

    addLabelValue("Date of Admission", safeText(studentData?.date_of_admission || studentData?.admission_date), infoX, infoY);
    addLabelValue("Blood Group", safeText(studentData?.blood_group), infoX + colW + 3, infoY);
    infoY += 11;

    addLabelValue("Category", safeText(studentData?.category || studentData?.student_category?.category_name), infoX, infoY);
    addLabelValue("Religion", safeText(studentData?.religion), infoX + colW + 3, infoY);

    y = Math.max(infoY + 11, y + 40);

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, pageWidth - 14, y);
    y += 7;

    // ── Contact / Address ────────────────────────────────────────────────────
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(245, 245, 245);
    doc.rect(14, y - 4, pageWidth - 28, 6, "F");
    doc.text("Contact & Address", 16, y);
    y += 6;

    addLabelValue("Phone", safeText(studentData?.phone || studentData?.mobile_number), infoX, y);
    addLabelValue("Email", safeText(studentData?.email), infoX + colW + 3, y);
    y += 10;
    addLabelValue("Current Address", safeText(studentData?.current_address), infoX, y, colW * 2 + 3);
    y += 10;
    addLabelValue("Permanent Address", safeText(studentData?.permanent_address), infoX, y, colW * 2 + 3);
    y += 12;

    doc.line(14, y, pageWidth - 14, y);
    y += 7;

    // ── Parent / Guardian Info ───────────────────────────────────────────────
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(245, 245, 245);
    doc.rect(14, y - 4, pageWidth - 28, 6, "F");
    doc.text("Parent / Guardian Information", 16, y);
    y += 6;

    addLabelValue("Father's Name", safeText(studentData?.father_name), infoX, y);
    addLabelValue("Father's Phone", safeText(studentData?.father_phone), infoX + colW + 3, y);
    y += 10;
    addLabelValue("Mother's Name", safeText(studentData?.mother_name), infoX, y);
    addLabelValue("Mother's Phone", safeText(studentData?.mother_phone), infoX + colW + 3, y);
    y += 10;
    addLabelValue("Guardian Name", safeText(studentData?.guardian_name), infoX, y);
    addLabelValue("Guardian Phone", safeText(studentData?.guardian_phone), infoX + colW + 3, y);
    y += 10;
    addLabelValue("Guardian Relation", safeText(studentData?.guardian_relation), infoX, y);
    addLabelValue("Occupation", safeText(studentData?.father_occupation || studentData?.guardian_occupation), infoX + colW + 3, y);
    y += 12;

    // ── Documents Checklist ──────────────────────────────────────────────────
    if (admissionFormConfig?.documents && admissionFormConfig.documents.length > 0) {
        if (y > pageHeight - 50) { doc.addPage(); y = 15; }
        doc.line(14, y, pageWidth - 14, y);
        y += 7;

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y - 4, pageWidth - 28, 6, "F");
        doc.text("Required Documents", 16, y);
        y += 8;

        doc.setFontSize(8);
        admissionFormConfig.documents.forEach((doc_item: { name?: string; document?: string; required?: boolean }) => {
            const name = doc_item.name || doc_item.document || String(doc_item);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(40, 40, 40);
            doc.text(`[ ]  ${safeText(name)}${doc_item.required ? " *" : ""}`, 20, y);
            y += 6;
            if (y > pageHeight - 30) { doc.addPage(); y = 15; }
        });
        y += 4;
    }

    // ── Terms / Declaration ──────────────────────────────────────────────────
    const addTextSection = (label: string, content: string) => {
        if (!content) return;
        if (y > pageHeight - 40) { doc.addPage(); y = 15; }
        doc.line(14, y, pageWidth - 14, y);
        y += 7;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y - 4, pageWidth - 28, 6, "F");
        doc.text(label, 16, y);
        y += 7;
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        const clean = content.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
        const lines = doc.splitTextToSize(safeText(clean), pageWidth - 28);
        doc.text(lines, 14, y);
        y += lines.length * 4 + 6;
        doc.setTextColor(0, 0, 0);
    };

    addTextSection("Terms & Conditions", admissionFormConfig?.terms_conditions || "");
    addTextSection("Declaration", admissionFormConfig?.declaration || "");
    addTextSection("Fee Policy", admissionFormConfig?.fee_policy || "");

    // ── Office Use Only ──────────────────────────────────────────────────────
    if (admissionFormConfig?.office_use_only) {
        if (y > pageHeight - 40) { doc.addPage(); y = 15; }
        doc.line(14, y, pageWidth - 14, y);
        y += 7;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(230, 240, 255);
        doc.rect(14, y - 4, pageWidth - 28, 6, "F");
        doc.text("For Office Use Only", 16, y);
        y += 8;
        doc.rect(14, y, pageWidth - 28, 20);
        y += 25;
    }

    // ── Signature Line ───────────────────────────────────────────────────────
    if (y > pageHeight - 30) { doc.addPage(); y = 15; }
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.line(14, y + 10, 60, y + 10);
    doc.text("Student Signature", 14, y + 14);
    doc.line(pageWidth / 2 - 23, y + 10, pageWidth / 2 + 23, y + 10);
    doc.text("Parent/Guardian Signature", pageWidth / 2 - 23, y + 14);
    doc.line(pageWidth - 60, y + 10, pageWidth - 14, y + 10);
    doc.text("Principal Signature", pageWidth - 60, y + 14);

    doc.save(filename);
};
