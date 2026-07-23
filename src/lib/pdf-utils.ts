import jsPDF from 'jspdf';
import { getImageUrl } from '@/lib/image-url';

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
    pre_documents_note?: string;
}

export interface ParentPhotos {
    father_photo?: string;
    mother_photo?: string;
    guardian_photo?: string;
    father?: string;
    mother?: string;
    guardian?: string;
}

export const downloadAdmissionFormPdf = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentData: any,
    className: string,
    sectionName: string,
    filename: string,
    photoUrl?: string,
    schoolInfo?: { name?: string; slogan?: string; currencySymbol?: string; address?: string; phone?: string; email?: string; website?: string; web?: string; logo?: string; print_logo?: string; app_logo?: string; logoUrl?: string },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parentPhotos?: any,
    admissionFormConfig?: AdmissionFormConfig
): Promise<void> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 14;
    const contentWidth = pageWidth - marginX * 2;
    let y = 9; // Reduced top padding from 14mm to 9mm

    const safeText = (val: unknown): string => {
        if (val === null || val === undefined || val === "") return "-";
        const str = String(val).trim();
        if (!str) return "-";
        return str.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "").trim() || "-";
    };

    const formatPdfDate = (dateVal: unknown): string => {
        if (dateVal === null || dateVal === undefined || dateVal === "") return "-";
        const str = String(dateVal).trim();
        if (!str || str === "-") return "-";

        if (str.includes("T")) {
            const datePart = str.split("T")[0];
            if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                return datePart;
            }
        }

        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
            return str.substring(0, 10);
        }

        const d = new Date(str);
        if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }

        return safeText(str);
    };

    const cleanHtml = (html: string): string => {
        if (!html) return "";
        return html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<br\s*[\/]?>/gi, "\n")
            .replace(/<\/p>/gi, "\n")
            .replace(/<\/li>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/\n\s*\n/g, "\n")
            .trim();
    };

    const loadImageAsBase64 = async (url: string): Promise<string | undefined> => {
        if (!url || url === "-" || url.includes("undefined")) return undefined;
        if (url.startsWith("data:")) return url;
        try {
            const pUrl = url.replace("localhost", "127.0.0.1");
            const proxyUrl = `/api/camera-proxy?url=${encodeURIComponent(pUrl)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) return undefined;
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve(undefined);
                reader.readAsDataURL(blob);
            });
        } catch {
            return undefined;
        }
    };

    const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - 15) {
            doc.addPage();
            y = 12;
        }
    };

    const renderSectionHeader = (title: string) => {
        checkPageBreak(12);
        doc.setFillColor(4, 78, 67); // Dark teal header accent
        doc.rect(marginX, y, contentWidth, 6, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(title.toUpperCase(), marginX + 3, y + 4.2);
        doc.setTextColor(0, 0, 0);
        y += 9;
    };

    const renderMultilingualBlock = async (htmlOrText: string, sectionTitle?: string) => {
        if (!htmlOrText || !htmlOrText.trim()) return;

        const hasUnicode = /[\u0080-\uFFFF]/.test(htmlOrText);

        if (sectionTitle) {
            renderSectionHeader(sectionTitle);
        }

        if (hasUnicode && typeof window !== "undefined") {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let html2canvas: any;
                try {
                    html2canvas = (await import("html2canvas-pro")).default;
                } catch {
                    html2canvas = (await import("html2canvas")).default;
                }

                const container = document.createElement("div");
                container.id = "pdf-multilingual-container";
                container.style.position = "fixed";
                container.style.left = "-9999px";
                container.style.top = "-9999px";
                container.style.width = "700px";
                container.style.padding = "8px 10px";
                container.style.fontSize = "12px";
                container.style.lineHeight = "1.5";
                container.style.color = "#334155";
                container.style.fontFamily = "'SolaimanLipi', 'Noto Sans Bengali', 'Nikosh', 'Arial', sans-serif";
                container.style.backgroundColor = "#ffffff";
                container.style.wordBreak = "break-word";
                container.innerHTML = htmlOrText;
                document.body.appendChild(container);

                const canvas = await html2canvas(container, {
                    scale: 2,
                    backgroundColor: "#ffffff",
                    logging: false,
                    useCORS: true,
                    onclone: (clonedDoc: Document) => {
                        try {
                            clonedDoc.documentElement.style.backgroundColor = "#ffffff";
                            clonedDoc.body.style.backgroundColor = "#ffffff";
                            clonedDoc.documentElement.style.color = "#334155";
                            clonedDoc.body.style.color = "#334155";

                            const target = clonedDoc.getElementById("pdf-multilingual-container");
                            if (target) {
                                target.style.color = "#334155";
                                target.style.backgroundColor = "#ffffff";
                                const allElements = target.querySelectorAll("*");
                                allElements.forEach((node) => {
                                    const el = node as HTMLElement;
                                    el.style.color = "#334155";
                                    el.style.backgroundColor = "transparent";
                                    el.style.borderColor = "#cbd5e1";
                                });
                            }
                        } catch {
                            // Ignore clone cleanup error
                        }
                    },
                });
                if (document.body.contains(container)) {
                    document.body.removeChild(container);
                }

                const imgData = canvas.toDataURL("image/png");
                const canvasW = canvas.width;
                const canvasH = canvas.height;
                const renderW = contentWidth;
                const renderH = (canvasH / canvasW) * renderW;

                checkPageBreak(renderH + 4);
                doc.addImage(imgData, "PNG", marginX, y, renderW, renderH);
                y += renderH + 4;
                return;
            } catch (err) {
                console.error("Canvas rendering for multilingual block failed, falling back to text", err);
            }
        }

        // Standard text fallback
        const clean = cleanHtml(htmlOrText);
        if (clean) {
            const lines = doc.splitTextToSize(clean, contentWidth);
            const blockHeight = lines.length * 4;
            checkPageBreak(blockHeight + 4);
            doc.setFontSize(7.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(51, 65, 85);
            doc.text(lines, marginX, y);
            y += blockHeight + 5;
        }
    };

    // ── 1. School Header (Left: Logo + Name + Slogan, Right: Address, Email, Phone) ──
    const rightX = pageWidth - marginX;
    let leftY = y;
    let rightY = y;

    const logoCandidate = schoolInfo?.print_logo || schoolInfo?.logo || schoolInfo?.app_logo || schoolInfo?.logoUrl;
    if (logoCandidate) {
        const fullLogoUrl = logoCandidate.startsWith("data:") ? logoCandidate : getImageUrl(logoCandidate);
        const logoBase64 = await loadImageAsBase64(fullLogoUrl);
        if (logoBase64) {
            try {
                const ext = logoBase64.toLowerCase().includes("png") ? "PNG" : "JPEG";
                const imgProps = doc.getImageProperties(logoBase64);
                const maxW = 48;
                const maxH = 18;
                let imgW = maxW;
                let imgH = (imgProps.height / imgProps.width) * imgW;
                if (imgH > maxH) {
                    imgH = maxH;
                    imgW = (imgProps.width / imgProps.height) * imgH;
                }
                doc.addImage(logoBase64, ext, marginX, leftY, imgW, imgH);
                leftY += imgH + 2.5;
            } catch {
                // Ignore logo image failure
            }
        }
    }

    // Left-aligned School Name & Slogan (under logo)
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(safeText(schoolInfo?.name || "SMART SCHOOL"), marginX, leftY + 3.5);
    leftY += 7.5;

    if (schoolInfo?.slogan) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 116, 139);
        doc.text(safeText(schoolInfo.slogan), marginX, leftY);
        leftY += 4.5;
    }

    // Right-aligned Address, Phone No., Email, Website
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);

    if (schoolInfo?.address) {
        doc.text(`Address: ${safeText(schoolInfo.address)}`, rightX, rightY + 3.5, { align: "right" });
        rightY += 4.5;
    }

    if (schoolInfo?.phone) {
        doc.text(`Phone No.: ${safeText(schoolInfo.phone)}`, rightX, rightY + 3.5, { align: "right" });
        rightY += 4.5;
    }

    if (schoolInfo?.email) {
        doc.text(`Email: ${safeText(schoolInfo.email)}`, rightX, rightY + 3.5, { align: "right" });
        rightY += 4.5;
    }

    const webVal = schoolInfo?.website || schoolInfo?.web || "ischool.mddoulat.com";
    if (webVal) {
        doc.text(`Website: ${safeText(webVal)}`, rightX, rightY + 3.5, { align: "right" });
        rightY += 4.5;
    }

    y = Math.max(leftY + 3, rightY + 3);

    // Title Bar
    doc.setFillColor(30, 41, 59);
    doc.rect(marginX, y, contentWidth, 7, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("STUDENT ADMISSION FORM", pageWidth / 2, y + 4.8, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y += 11;

    // ── 2. Photos Section (Student, Father, Mother, Guardian) ────────────────
    const photoBoxW = 27;
    const photoBoxH = 33;
    const photoSpacing = (contentWidth - photoBoxW * 4) / 3;

    const photosList = [
        { label: "Student Photo", url: photoUrl || studentData?.avatar || studentData?.photo || studentData?.student_photo },
        { label: "Father Photo", url: parentPhotos?.father_photo || parentPhotos?.father || studentData?.father_photo },
        { label: "Mother Photo", url: parentPhotos?.mother_photo || parentPhotos?.mother || studentData?.mother_photo },
        { label: "Guardian Photo", url: parentPhotos?.guardian_photo || parentPhotos?.guardian || studentData?.guardian_photo },
    ];

    const photoY = y;
    for (let i = 0; i < photosList.length; i++) {
        const px = marginX + i * (photoBoxW + photoSpacing);
        const item = photosList[i];
        let imgData: string | undefined;
        if (item.url) {
            imgData = await loadImageAsBase64(item.url);
        }

        // Draw Border
        doc.setDrawColor(203, 213, 225);
        doc.rect(px, photoY, photoBoxW, photoBoxH);

        // Header strip for photo
        doc.setFillColor(241, 245, 249);
        doc.rect(px, photoY, photoBoxW, 4, "F");
        doc.setFontSize(6);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(item.label, px + photoBoxW / 2, photoY + 2.8, { align: "center" });

        if (imgData) {
            try {
                const ext = imgData.toLowerCase().includes("png") ? "PNG" : "JPEG";
                doc.addImage(imgData, ext, px + 0.5, photoY + 4.5, photoBoxW - 1, photoBoxH - 5);
            } catch {
                doc.setFontSize(7);
                doc.setTextColor(148, 163, 184);
                doc.text("No Image", px + photoBoxW / 2, photoY + photoBoxH / 2 + 2, { align: "center" });
            }
        } else {
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text("Paste Here", px + photoBoxW / 2, photoY + photoBoxH / 2 + 2, { align: "center" });
        }
    }
    y += photoBoxH + 5;

    // ── Helper: 3-column / 4-column Key-Value Field Grid ──────────────────────
    const renderGridFields = (fields: Array<{ label: string; value: unknown; fullWidth?: boolean }>, cols = 3) => {
        const colW = contentWidth / cols;
        let colIndex = 0;

        fields.forEach((f) => {
            if (f.fullWidth || colIndex >= cols) {
                if (colIndex > 0) {
                    y += 10;
                    colIndex = 0;
                }
            }
            checkPageBreak(10);
            const fx = marginX + colIndex * colW;
            const w = f.fullWidth ? contentWidth : colW - 3;

            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(100, 116, 139);
            doc.text(f.label.toUpperCase(), fx, y);

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(15, 23, 42);
            doc.text(safeText(f.value), fx, y + 4, { maxWidth: w });

            if (f.fullWidth) {
                y += 10;
                colIndex = 0;
            } else {
                colIndex++;
                if (colIndex >= cols) {
                    y += 10;
                    colIndex = 0;
                }
            }
        });

        if (colIndex > 0) {
            y += 10;
        }
    };

    const categoryDisplay = studentData?.category_name ||
        (studentData?.student_category && typeof studentData.student_category === "object" ? (studentData.student_category.category_name || studentData.student_category.name) : undefined) ||
        (typeof studentData?.category === "string" && !/^\d+$/.test(studentData.category) ? studentData.category : undefined) || "-";

    const houseDisplay = (studentData?.house_name && typeof studentData.house_name === "string" && !/^\d+$/.test(studentData.house_name.trim())) ? studentData.house_name :
        (studentData?.student_house && typeof studentData.student_house === "object" ? (studentData.student_house.house_name || studentData.student_house.name) : undefined) ||
        (typeof studentData?.house === "string" && !/^\d+$/.test(studentData.house.trim()) ? studentData.house : undefined) ||
        "-";

    const routeDisplay = (studentData?.route_title && typeof studentData.route_title === "string" && !/^\d+$/.test(studentData.route_title.trim())) ? studentData.route_title :
        (studentData?.transport_route_name && typeof studentData.transport_route_name === "string" && !/^\d+$/.test(studentData.transport_route_name.trim())) ? studentData.transport_route_name :
        (studentData?.route_name && typeof studentData.route_name === "string" && !/^\d+$/.test(studentData.route_name.trim())) ? studentData.route_name :
        (studentData?.route && typeof studentData.route === "object" ? (studentData.route.route_title || studentData.route.title || studentData.route.name) : undefined) ||
        (studentData?.transport_route && typeof studentData.transport_route === "object" ? (studentData.transport_route.route_title || studentData.transport_route.title || studentData.transport_route.name) : undefined) ||
        (studentData?.vehroute?.route && typeof studentData.vehroute.route === "object" ? (studentData.vehroute.route.route_title || studentData.vehroute.route.title || studentData.vehroute.route.name) : undefined) ||
        (studentData?.transport_assignment?.route && typeof studentData.transport_assignment.route === "object" ? (studentData.transport_assignment.route.title || studentData.transport_assignment.route.route_title || studentData.transport_assignment.route.name) : undefined) ||
        (studentData?.transportAssignment?.route && typeof studentData.transportAssignment.route === "object" ? (studentData.transportAssignment.route.title || studentData.transportAssignment.route.route_title || studentData.transportAssignment.route.name) : undefined) ||
        "-";

    const pickupDisplay = (studentData?.pickup_point_name && typeof studentData.pickup_point_name === "string" && !/^\d+$/.test(studentData.pickup_point_name.trim())) ? studentData.pickup_point_name :
        (studentData?.pickup_point && typeof studentData.pickup_point === "object" ? (studentData.pickup_point.point_name || studentData.pickup_point.pickup_point_name || studentData.pickup_point.name || studentData.pickup_point.title) : undefined) ||
        (studentData?.transport_pickup_point && typeof studentData.transport_pickup_point === "object" ? (studentData.transport_pickup_point.point_name || studentData.transport_pickup_point.name) : undefined) ||
        (studentData?.transport_assignment?.pickup_point && typeof studentData.transport_assignment.pickup_point === "object" ? (studentData.transport_assignment.pickup_point.point_name || studentData.transport_assignment.pickup_point.name || studentData.transport_assignment.pickup_point.pickup_point_name) : undefined) ||
        (studentData?.transportAssignment?.pickupPoint && typeof studentData.transportAssignment.pickupPoint === "object" ? (studentData.transportAssignment.pickupPoint.point_name || studentData.transportAssignment.pickupPoint.name || studentData.transportAssignment.pickupPoint.pickup_point_name) : undefined) ||
        "-";

    const hostelDisplay = (studentData?.hostel_name && typeof studentData.hostel_name === "string" && !/^\d+$/.test(studentData.hostel_name.trim())) ? studentData.hostel_name :
        (studentData?.hostel && typeof studentData.hostel === "object" ? (studentData.hostel.hostel_name || studentData.hostel.name || studentData.hostel.title) : undefined) ||
        (studentData?.room?.hostel && typeof studentData.room.hostel === "object" ? (studentData.room.hostel.hostel_name || studentData.room.hostel.name) : undefined) ||
        (studentData?.hostel_room?.hostel && typeof studentData.hostel_room.hostel === "object" ? (studentData.hostel_room.hostel.hostel_name || studentData.hostel_room.hostel.name) : undefined) ||
        "-";

    const roomDisplay = (studentData?.room_number && typeof studentData.room_number === "string" && !/^\d+$/.test(String(studentData.room_number).trim())) ? String(studentData.room_number) :
        (studentData?.room_no && typeof studentData.room_no === "string" && !/^\d+$/.test(String(studentData.room_no).trim())) ? String(studentData.room_no) :
        (studentData?.room && typeof studentData.room === "object" ? (studentData.room.room_number || studentData.room.room_no || studentData.room.name) : undefined) ||
        (studentData?.hostel_room && typeof studentData.hostel_room === "object" ? (studentData.hostel_room.room_number || studentData.hostel_room.room_no || studentData.hostel_room.name) : undefined) ||
        (studentData?.room_number || studentData?.room_no ? String(studentData.room_number || studentData.room_no) : "-");

    // ── 3. Academic & Personal Details ─────────────────────────────────────────
    renderSectionHeader("Student Admission Details");

    const fullName = safeText(studentData?.full_name || `${studentData?.name || ""} ${studentData?.last_name || ""}`.trim());
    const studentFields = [
        { label: "Admission No.", value: studentData?.admission_no },
        { label: "Roll No.", value: studentData?.roll_no },
        { label: "Username", value: studentData?.username },
        { label: "Class", value: className || studentData?.class_name },
        { label: "Section", value: sectionName || studentData?.section_name },
        { label: "Student Name", value: fullName },
        { label: "Gender", value: studentData?.gender },
        { label: "Date of Birth", value: formatPdfDate(studentData?.dob) },
        { label: "ID / Birth Cert No.", value: studentData?.national_identification_no },
        { label: "Place of Birth", value: studentData?.birth_place },
        { label: "State", value: studentData?.state },
        { label: "Nationality", value: studentData?.nationality },
        { label: "Category", value: categoryDisplay },
        { label: "Religion", value: studentData?.religion },
        { label: "Caste", value: studentData?.caste },
        { label: "Mobile Number", value: studentData?.phone || studentData?.mobile_number },
        { label: "Email", value: studentData?.email },
        { label: "Admission Date", value: formatPdfDate(studentData?.admission_date || studentData?.date_of_admission) },
        { label: "Status", value: studentData?.active === false || studentData?.active === 0 ? "Disabled" : "Active" },
        { label: "Blood Group", value: studentData?.blood_group },
        { label: "House", value: houseDisplay },
        { label: "Height", value: studentData?.height },
        { label: "Weight", value: studentData?.weight },
        { label: "Measurement Date", value: formatPdfDate(studentData?.measurement_date) },
        { label: "Postal / Zip Code", value: studentData?.postal_code },
        { label: "Mother Tongue", value: studentData?.mother_tongue },
        { label: "General Behaviour", value: studentData?.general_behaviour },
        { label: "Second Language", value: studentData?.second_language },
        { label: "Current Address", value: studentData?.current_address, fullWidth: true },
        { label: "Permanent Address", value: studentData?.permanent_address, fullWidth: true },
    ];

    renderGridFields(studentFields, 3);

    // ── 4. Previous Academic Record Table ─────────────────────────────────────
    if (Array.isArray(studentData?.previous_academic_record) && studentData.previous_academic_record.length > 0) {
        renderSectionHeader("Previous Academic Record");
        checkPageBreak(25);
        const tableW = contentWidth;
        const colW = tableW / 4;

        doc.setFillColor(241, 245, 249);
        doc.rect(marginX, y, tableW, 6, "F");
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(51, 65, 85);
        doc.text("School Name & Location", marginX + 2, y + 4.2);
        doc.text("Class Passed", marginX + colW + 2, y + 4.2);
        doc.text("Year of Study", marginX + colW * 2 + 2, y + 4.2);
        doc.text("Grade / % Marks", marginX + colW * 3 + 2, y + 4.2);
        y += 6;

        studentData.previous_academic_record.forEach((row: { school_name?: string; class?: string; year?: string; grade?: string; percentage?: string }) => {
            checkPageBreak(6);
            doc.setFontSize(7.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(15, 23, 42);
            doc.text(safeText(row.school_name), marginX + 2, y + 4, { maxWidth: colW - 3 });
            doc.text(safeText(row.class), marginX + colW + 2, y + 4, { maxWidth: colW - 3 });
            doc.text(safeText(row.year), marginX + colW * 2 + 2, y + 4, { maxWidth: colW - 3 });
            doc.text(safeText(row.grade || row.percentage), marginX + colW * 3 + 2, y + 4, { maxWidth: colW - 3 });
            y += 6;
        });
        y += 3;
    }

    // ── 5. Parent & Guardian Detail Section ──────────────────────────────────
    renderSectionHeader("Parent & Guardian Information");

    const parentFields = [
        { label: "Father Name", value: studentData?.father_name },
        { label: "Father Phone", value: studentData?.father_phone },
        { label: "Father Occupation", value: studentData?.father_occupation },
        { label: "Mother Name", value: studentData?.mother_name },
        { label: "Mother Phone", value: studentData?.mother_phone },
        { label: "Mother Occupation", value: studentData?.mother_occupation },
        { label: "Guardian Is", value: studentData?.guardian_is },
        { label: "Guardian Name", value: studentData?.guardian_name },
        { label: "Guardian Relation", value: studentData?.guardian_relation || studentData?.guardian_relation_name },
        { label: "Guardian Email", value: studentData?.guardian_email },
        { label: "Parent Username", value: studentData?.parent_username || studentData?.parent_user?.username },
        { label: "Guardian Phone", value: studentData?.guardian_phone },
        { label: "Guardian Occupation", value: studentData?.guardian_occupation },
        { label: "Bank Account No.", value: studentData?.bank_account_no },
        { label: "Bank Name", value: studentData?.bank_name },
        { label: "IFSC Code", value: studentData?.ifsc_code },
        { label: "RTE Status", value: studentData?.rte },
        { label: "Guardian Address", value: studentData?.guardian_address, fullWidth: true },
    ];

    renderGridFields(parentFields, 3);

    // ── 6. Transport & Hostel Details ──────────────────────────────────────────
    renderSectionHeader("Transport & Hostel Details");
    const transportFields = [
        { label: "Transport Route", value: routeDisplay },
        { label: "Pickup Point", value: pickupDisplay },
        { label: "Hostel Name", value: hostelDisplay },
        { label: "Room No.", value: roomDisplay },
    ];
    renderGridFields(transportFields, 2);

    // ── 7. Health, Achievements & Additional Notes ────────────────────────────
    renderSectionHeader("Health & Miscellaneous Remarks");
    const extraFields = [
        { label: "Identification Marks", value: studentData?.identification_marks },
        { label: "Medical History", value: studentData?.medical_history },
        { label: "Appraisal Achievements", value: studentData?.appraisal_achievements, fullWidth: true },
        { label: "Additional Note", value: studentData?.note, fullWidth: true },
    ];
    renderGridFields(extraFields, 2);

    // ── 8. Admission Form System Settings Data (`/dashboard/system-setting/admission-form`)
    // Renders Documents Checklist, Fee Policy, Terms & Conditions, Declaration, and Office Use Only
    if (admissionFormConfig) {
        // Pre-Documents Note & Required Documents Checklist
        if (admissionFormConfig.documents && admissionFormConfig.documents.length > 0) {
            renderSectionHeader("Required Documents Checklist");

            if (admissionFormConfig.pre_documents_note) {
                checkPageBreak(8);
                doc.setFontSize(7.5);
                doc.setFont("helvetica", "italic");
                doc.setTextColor(71, 85, 105);
                doc.text(safeText(cleanHtml(admissionFormConfig.pre_documents_note)), marginX, y, { maxWidth: contentWidth });
                y += 6;
            }

            const docCols = 2;
            const docW = contentWidth / docCols;
            let docCol = 0;

            admissionFormConfig.documents.forEach((docItem: { name?: string; document?: string; required?: boolean }) => {
                checkPageBreak(6);
                const dName = docItem.name || docItem.document || String(docItem);
                const dx = marginX + docCol * docW;

                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(30, 41, 59);
                doc.text(`[  ]  ${safeText(dName)}${docItem.required ? " *" : ""}`, dx, y);

                docCol++;
                if (docCol >= docCols) {
                    docCol = 0;
                    y += 5.5;
                }
            });
            if (docCol > 0) y += 5.5;
            y += 3;
        }

        // Fee Policy & Structured Fee Tables
        if (admissionFormConfig.fee_policy) {
            renderSectionHeader("Fee Policy & Schedule");
            try {
                const parsedTables = JSON.parse(admissionFormConfig.fee_policy);
                if (Array.isArray(parsedTables)) {
                    parsedTables.forEach((tbl: { title?: string; headers?: string[]; rows?: Array<{ cells: string[] }>; note?: string }) => {
                        checkPageBreak(25);
                        if (tbl.title) {
                            doc.setFontSize(8.5);
                            doc.setFont("helvetica", "bold");
                            doc.setTextColor(4, 78, 67);
                            doc.text(safeText(tbl.title), marginX, y);
                            y += 5;
                        }

                        if (Array.isArray(tbl.headers) && Array.isArray(tbl.rows)) {
                            const tableW = contentWidth;
                            const numCols = tbl.headers.length || 2;
                            const cellW = tableW / numCols;

                            // Table Header
                            doc.setFillColor(241, 245, 249);
                            doc.rect(marginX, y, tableW, 5.5, "F");
                            doc.setFontSize(7.5);
                            doc.setFont("helvetica", "bold");
                            doc.setTextColor(30, 41, 59);

                            tbl.headers.forEach((h, hIdx) => {
                                doc.text(safeText(h), marginX + hIdx * cellW + 2, y + 3.8);
                            });
                            y += 5.5;

                            // Table Rows
                            tbl.rows.forEach((r) => {
                                checkPageBreak(6);
                                doc.setDrawColor(226, 232, 240);
                                doc.rect(marginX, y, tableW, 5.5);
                                doc.setFontSize(7.5);
                                doc.setFont("helvetica", "normal");
                                doc.setTextColor(15, 23, 42);

                                r.cells.forEach((cellVal, cIdx) => {
                                    doc.text(safeText(cellVal), marginX + cIdx * cellW + 2, y + 3.8, { maxWidth: cellW - 3 });
                                });
                                y += 5.5;
                            });
                        }

                        if (tbl.note) {
                            checkPageBreak(10);
                            doc.setFontSize(7);
                            doc.setFont("helvetica", "italic");
                            doc.setTextColor(100, 116, 139);
                            const lines = doc.splitTextToSize(safeText(tbl.note), contentWidth);
                            doc.text(lines, marginX, y + 3);
                            y += lines.length * 3.5 + 4;
                        }
                        y += 2;
                    });
                } else {
                    const clean = cleanHtml(admissionFormConfig.fee_policy);
                    if (clean) {
                        const lines = doc.splitTextToSize(clean, contentWidth);
                        doc.setFontSize(7.5);
                        doc.setFont("helvetica", "normal");
                        doc.setTextColor(51, 65, 85);
                        doc.text(lines, marginX, y);
                        y += lines.length * 4 + 4;
                    }
                }
            } catch {
                const clean = cleanHtml(admissionFormConfig.fee_policy);
                if (clean) {
                    const lines = doc.splitTextToSize(clean, contentWidth);
                    doc.setFontSize(7.5);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(51, 65, 85);
                    doc.text(lines, marginX, y);
                    y += lines.length * 4 + 4;
                }
            }
        }

        // Terms & Conditions
        if (admissionFormConfig.terms_conditions) {
            await renderMultilingualBlock(admissionFormConfig.terms_conditions, "Terms & Conditions");
        }

        // Declaration
        if (admissionFormConfig.declaration) {
            await renderMultilingualBlock(admissionFormConfig.declaration, "Declaration");
        }

        // For Office Use Only Table & Notes
        if (admissionFormConfig.office_use_only) {
            renderSectionHeader("For Office Use Only");
            try {
                const parsed = JSON.parse(admissionFormConfig.office_use_only);
                if (parsed.headers && parsed.rows) {
                    checkPageBreak(30);
                    const tableW = contentWidth;
                    const numCols = parsed.headers.length || 6;
                    const cellW = tableW / numCols;

                    doc.setFillColor(241, 245, 249);
                    doc.rect(marginX, y, tableW, 5.5, "F");
                    doc.setFontSize(7);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(30, 41, 59);

                    parsed.headers.forEach((h: string, idx: number) => {
                        doc.text(safeText(h), marginX + idx * cellW + 1.5, y + 3.8);
                    });
                    y += 5.5;

                    parsed.rows.forEach((r: { cells: string[] }) => {
                        checkPageBreak(6);
                        doc.setDrawColor(226, 232, 240);
                        doc.rect(marginX, y, tableW, 5.5);
                        doc.setFontSize(7);
                        doc.setFont("helvetica", "normal");
                        doc.setTextColor(15, 23, 42);

                        r.cells.forEach((val: string, idx: number) => {
                            doc.text(safeText(val), marginX + idx * cellW + 1.5, y + 3.8, { maxWidth: cellW - 2 });
                        });
                        y += 5.5;
                    });

                    if (parsed.note) {
                        checkPageBreak(12);
                        doc.setFontSize(7);
                        doc.setFont("helvetica", "italic");
                        doc.setTextColor(71, 85, 105);
                        const lines = doc.splitTextToSize(safeText(cleanHtml(parsed.note)), contentWidth);
                        doc.text(lines, marginX, y + 3);
                        y += lines.length * 3.5 + 4;
                    }
                } else {
                    const clean = cleanHtml(admissionFormConfig.office_use_only);
                    if (clean) {
                        checkPageBreak(15);
                        doc.setFontSize(7.5);
                        doc.setFont("helvetica", "normal");
                        doc.setTextColor(51, 65, 85);
                        const lines = doc.splitTextToSize(clean, contentWidth);
                        doc.text(lines, marginX, y);
                        y += lines.length * 4 + 4;
                    }
                }
            } catch {
                const clean = cleanHtml(admissionFormConfig.office_use_only);
                if (clean) {
                    checkPageBreak(15);
                    doc.setFontSize(7.5);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(51, 65, 85);
                    const lines = doc.splitTextToSize(clean, contentWidth);
                    doc.text(lines, marginX, y);
                    y += lines.length * 4 + 4;
                }
            }
        }
    }

    // ── 9. Signature Lines ───────────────────────────────────────────────────
    checkPageBreak(25);
    y += 10;
    doc.setDrawColor(148, 163, 184);

    const sigW = 50;
    const sigGap = (contentWidth - sigW * 3) / 2;

    // Student Sig
    doc.line(marginX, y, marginX + sigW, y);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("Student Signature", marginX + sigW / 2, y + 4, { align: "center" });

    // Parent/Guardian Sig
    const pX = marginX + sigW + sigGap;
    doc.line(pX, y, pX + sigW, y);
    doc.text("Parent / Guardian Signature", pX + sigW / 2, y + 4, { align: "center" });

    // Principal / Office Sig
    const prX = marginX + (sigW + sigGap) * 2;
    doc.line(prX, y, prX + sigW, y);
    doc.text("Principal / Authorized Signature", prX + sigW / 2, y + 4, { align: "center" });

    doc.save(filename);
};
