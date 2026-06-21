/**
 * Shared certificate rendering utilities.
 * Used by dashboard generate/transfer-certificate pages and the student portal.
 */

export interface CertificateTemplate {
    id: number;
    name: string;
    header_left?: string | null;
    header_center?: string | null;
    header_right?: string | null;
    body_text?: string | null;
    footer_left?: string | null;
    footer_center?: string | null;
    footer_right?: string | null;
    header_height?: string | null;
    footer_height?: string | null;
    body_height?: string | null;
    body_width?: string | null;
    enable_student_photo?: boolean;
    background_image?: string | null;
    is_active?: boolean;
}

export interface StudentFields {
    name?: string;
    dob?: string;
    present_address?: string;
    guardian?: string;
    created_at?: string;
    admission_no?: string;
    roll_no?: string;
    class?: string;
    section?: string;
    gender?: string;
    admission_date?: string;
    category?: string;
    caste?: string;
    father_name?: string;
    mother_name?: string;
    religion?: string;
    email?: string;
    phone?: string;
    present_date?: string;
    medical_history?: string;
    blood_group?: string;
    house?: string;
    image?: string | null;
    // TC-specific
    tc_number?: string;
    issue_date?: string;
    reason?: string;
    [key: string]: string | null | undefined;
}

/** Replace `[placeholder]` tokens in a text string using the student's field map. */
export function substitutePlaceholders(text: string, fields: StudentFields): string {
    const presentDate = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    const defaults: StudentFields = {
        present_date: presentDate,
        medical_history: "",
        ...fields,
    };

    return text.replace(/\[(\w+[\w\s]*)\]/g, (match, key) => {
        const normalized = key.toLowerCase().replace(/\s+/g, "_");
        const value = defaults[normalized];
        return value != null ? String(value) : match;
    });
}

/**
 * Render a full certificate as an HTML string.
 * Layout: optional background image, header (left / center / right), body, footer (left / center / right).
 */
export function renderCertificateHtml(template: CertificateTemplate, student: StudentFields): string {
    const sub = (t?: string | null) => substitutePlaceholders(t ?? "", student);

    const headerHeight = template.header_height ? `${template.header_height}px` : "80px";
    const footerHeight = template.footer_height ? `${template.footer_height}px` : "60px";
    const bodyHeight   = template.body_height   ? `${template.body_height}px`   : "auto";
    const bodyWidth    = template.body_width     ? `${template.body_width}px`    : "100%";

    const bg = template.background_image
        ? `background: url('${template.background_image}') center/cover no-repeat;`
        : "";

    const photoHtml = template.enable_student_photo && student.image
        ? `<div style="text-align:right;margin-bottom:8px;">
               <img src="${student.image}" alt="Student Photo"
                    style="width:80px;height:80px;object-fit:cover;border:2px solid #ccc;border-radius:4px;" />
           </div>`
        : "";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${sub(template.name)}</title>
  <style>
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; font-size: 13px; color: #222; }
    .cert-wrapper { width: ${bodyWidth}; margin: 0 auto; ${bg} padding: 20px; box-sizing: border-box; }
    .cert-header  { height: ${headerHeight}; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #444; padding-bottom: 8px; }
    .cert-body    { min-height: ${bodyHeight}; padding: 24px 0; line-height: 1.8; }
    .cert-footer  { height: ${footerHeight}; display: flex; align-items: flex-end; justify-content: space-between; border-top: 2px solid #444; padding-top: 8px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="cert-wrapper">
    <div class="cert-header">
      <span>${sub(template.header_left)}</span>
      <span style="font-size:16px;font-weight:bold;">${sub(template.header_center)}</span>
      <span>${sub(template.header_right)}</span>
    </div>
    <div class="cert-body">
      ${photoHtml}
      ${sub(template.body_text).replace(/\n/g, "<br/>")}
    </div>
    <div class="cert-footer">
      <span>${sub(template.footer_left)}</span>
      <span>${sub(template.footer_center)}</span>
      <span>${sub(template.footer_right)}</span>
    </div>
  </div>
</body>
</html>`;
}

/** Open a print dialog for the rendered certificate HTML. */
export function printCertificate(html: string): void {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
        alert("Pop-up blocked. Please allow pop-ups for this site.");
        return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
}

/** Download the rendered certificate as a PDF via jsPDF + html2canvas. */
export async function downloadCertificatePdf(html: string, filename = "certificate.pdf"): Promise<void> {
    // Dynamic import so the main bundle stays light
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
    ]);

    const container = document.createElement("div");
    container.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:900px;background:#fff;";
    container.innerHTML = html;
    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(filename);
    } finally {
        document.body.removeChild(container);
    }
}

/* ───────────────────────── ID Cards ───────────────────────── */

export interface IdCardTemplate {
    id: number;
    title: string;
    school_name?: string | null;
    school_address?: string | null;
    header_color?: string | null;
    background_image?: string | null;
    logo?: string | null;
    signature?: string | null;
    design_type?: string | null; // "Horizontal" | "Vertical"
    is_active?: boolean;
    // student show_* flags
    show_admission_no?: boolean;
    show_student_name?: boolean;
    show_class?: boolean;
    show_roll_no?: boolean;
    show_house?: boolean;
    show_blood_group?: boolean;
    // staff show_* flags
    show_staff_name?: boolean;
    show_staff_id?: boolean;
    show_designation?: boolean;
    show_department?: boolean;
    show_joining_date?: boolean;
    // shared show_* flags
    show_father_name?: boolean;
    show_mother_name?: boolean;
    show_address?: boolean;
    show_phone?: boolean;
    show_dob?: boolean;
    show_qr?: boolean;
}

export interface IdCardPerson {
    name?: string;
    photo?: string | null;
    // student
    admission_no?: string;
    roll_no?: string;
    class?: string;
    section?: string;
    house?: string;
    blood_group?: string;
    // staff
    staff_id?: string;
    designation?: string;
    department?: string;
    joining_date?: string;
    // shared
    father_name?: string;
    mother_name?: string;
    address?: string;
    phone?: string;
    dob?: string;
}

/**
 * Render a single ID card (credit-card proportioned) as an HTML string.
 * `type` selects which set of show_* flags / fields apply.
 */
export function renderIdCardHtml(
    card: IdCardTemplate,
    person: IdCardPerson,
    type: "student" | "staff" = "student",
): string {
    const headerColor = card.header_color || "#6366F1";
    const vertical = (card.design_type || "").toLowerCase() === "vertical";
    const width = vertical ? 280 : 420;

    const studentRows: [boolean | undefined, string, string | undefined][] = [
        [card.show_admission_no, "Admission No", person.admission_no],
        [card.show_class, "Class", person.section ? `${person.class || ""} (${person.section})` : person.class],
        [card.show_roll_no, "Roll No", person.roll_no],
        [card.show_father_name, "Father", person.father_name],
        [card.show_mother_name, "Mother", person.mother_name],
        [card.show_dob, "DOB", person.dob],
        [card.show_blood_group, "Blood Group", person.blood_group],
        [card.show_house, "House", person.house],
        [card.show_phone, "Phone", person.phone],
        [card.show_address, "Address", person.address],
    ];

    const staffRows: [boolean | undefined, string, string | undefined][] = [
        [card.show_staff_id, "Staff ID", person.staff_id],
        [card.show_designation, "Designation", person.designation],
        [card.show_department, "Department", person.department],
        [card.show_father_name, "Father", person.father_name],
        [card.show_mother_name, "Mother", person.mother_name],
        [card.show_joining_date, "Joining", person.joining_date],
        [card.show_dob, "DOB", person.dob],
        [card.show_phone, "Phone", person.phone],
        [card.show_address, "Address", person.address],
    ];

    const rows = (type === "staff" ? staffRows : studentRows)
        .filter(([flag, , value]) => flag && value)
        .map(([, label, value]) =>
            `<div style="display:flex;gap:4px;font-size:9px;line-height:1.5;">
                <span style="font-weight:700;color:#444;min-width:64px;">${label}</span>
                <span style="color:#222;">${value}</span>
             </div>`)
        .join("");

    const showName = type === "staff" ? card.show_staff_name : card.show_student_name;
    const bg = card.background_image ? `background:url('${card.background_image}') center/cover no-repeat;` : "background:#fff;";

    return `
<div class="id-card" style="width:${width}px;border:1px solid #ddd;border-radius:10px;overflow:hidden;font-family:Arial,sans-serif;${bg};box-shadow:0 2px 8px rgba(0,0,0,0.12);margin:10px;">
  <div style="background:${headerColor};color:#fff;padding:8px 12px;display:flex;align-items:center;gap:8px;">
    ${card.logo ? `<img src="${card.logo}" alt="logo" style="height:32px;width:32px;object-fit:contain;border-radius:4px;background:#fff;padding:2px;" />` : ""}
    <div style="min-width:0;">
      <div style="font-size:13px;font-weight:700;line-height:1.2;">${card.school_name || ""}</div>
      <div style="font-size:8px;opacity:0.9;">${card.school_address || ""}</div>
    </div>
  </div>
  <div style="padding:12px;display:flex;gap:12px;${vertical ? "flex-direction:column;align-items:center;text-align:center;" : ""}">
    <div style="flex-shrink:0;">
      <div style="width:72px;height:84px;border:2px solid ${headerColor};border-radius:6px;overflow:hidden;background:#f1f1f1;display:flex;align-items:center;justify-content:center;">
        ${person.photo ? `<img src="${person.photo}" alt="photo" style="width:100%;height:100%;object-fit:cover;" />` : `<span style="font-size:9px;color:#aaa;">No Photo</span>`}
      </div>
    </div>
    <div style="flex:1;min-width:0;">
      ${showName ? `<div style="font-size:13px;font-weight:700;color:${headerColor};margin-bottom:4px;">${person.name || ""}</div>` : ""}
      ${rows}
    </div>
  </div>
  <div style="padding:6px 12px;display:flex;align-items:flex-end;justify-content:space-between;border-top:1px solid #eee;">
    ${card.show_qr ? `<div style="width:38px;height:38px;background:repeating-linear-gradient(45deg,#000,#000 2px,#fff 2px,#fff 4px);border:1px solid #ccc;"></div>` : "<span></span>"}
    ${card.signature ? `<img src="${card.signature}" alt="signature" style="height:30px;object-fit:contain;" />` : `<span style="font-size:8px;color:#888;border-top:1px solid #aaa;padding-top:2px;">Authorised Sign</span>`}
  </div>
</div>`;
}

/** Wrap one or more ID-card HTML fragments in a printable document and open print dialog. */
export function printIdCards(cardsHtml: string): void {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>ID Cards</title>
        <style>body{margin:0;padding:16px;display:flex;flex-wrap:wrap;gap:12px;background:#f5f5f5;}@media print{body{background:#fff;}}</style>
        </head><body>${cardsHtml}</body></html>`;
    printCertificate(html);
}
