import { getImageUrl } from "@/lib/image-url";

export interface CertificateTemplate {
    id: number;
    name: string;
    header_left?: string | null;
    header_center?: string | null;
    header_right?: string | null;
    body_text?: string | null;
    remarks?: string | null;
    footer_left?: string | null;
    footer_center?: string | null;
    footer_right?: string | null;
    header_height?: string | null;
    footer_height?: string | null;
    body_height?: string | null;
    body_width?: string | null;
    enable_student_photo?: boolean;
    background_image?: string | null;
    header_font_color?: string | null;
    title_color?: string | null;
    body_font_color?: string | null;
    layout_type?: "royal_gold" | "kids_purple" | "luxury_burgundy" | "school_letterhead" | "standard_school" | string | null;
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
    school_name?: string;
    school_logo?: string;
    session?: string;
    // TC & Certificate specific
    certificate_no?: string;
    tc_number?: string;
    issue_date?: string;
    reason?: string;
    remarks?: string;
    [key: string]: string | null | undefined;
}

export interface SchoolSettings {
    school_name?: string;
    admin_logo?: string;
    print_logo?: string;
    app_logo?: string;
    phone?: string;
    email?: string;
    address?: string;
    current_session?: string;
    general_purpose_header_image?: string | null;
    general_purpose_footer_content?: string | null;
    general_purpose_paper_size?: string | null;
    // ID Auto Generation for Certificates
    auto_student_certificate_no?: boolean;
    student_certificate_prefix?: string;
    student_certificate_digit?: number;
    student_certificate_start_from?: string;
    auto_transfer_certificate_no?: boolean;
    transfer_certificate_prefix?: string;
    transfer_certificate_digit?: number;
    transfer_certificate_start_from?: string;
    school_name_title_color?: string | null;
}

/** Formats a unique Certificate Number like `C/N: TC-0001/2026` or `C/N: CERT-0001/2026` */
export function formatCertificateNumber(
    template: CertificateTemplate,
    student: StudentFields,
    settings?: SchoolSettings
): string {
    if (student.certificate_no) {
        return student.certificate_no.startsWith("C/N:") ? student.certificate_no : `C/N: ${student.certificate_no}`;
    }
    if (student.tc_number) {
        return student.tc_number.startsWith("C/N:") ? student.tc_number : `C/N: ${student.tc_number}`;
    }

    const currentYear = new Date().getFullYear();
    const isTC = (template.layout_type === "school_letterhead" && (
        (template.name || "").toLowerCase().includes("transfer") ||
        (template.header_center || "").toLowerCase().includes("transfer")
    )) || !!student.reason;

    if (isTC) {
        const prefix = settings?.transfer_certificate_prefix !== undefined && settings.transfer_certificate_prefix !== ""
            ? settings.transfer_certificate_prefix
            : "TC-";
        const digits = Number(settings?.transfer_certificate_digit || 4);
        const startFrom = parseInt(settings?.transfer_certificate_start_from || "1", 10) || 1;
        const rawNum = student.id ? (parseInt(String(student.id).replace(/\D/g, ""), 10) || startFrom) : startFrom;
        const paddedNum = String(rawNum).padStart(digits, "0");
        return `C/N: ${prefix}${paddedNum}/${currentYear}`;
    }

    const prefix = settings?.student_certificate_prefix !== undefined && settings.student_certificate_prefix !== ""
        ? settings.student_certificate_prefix
        : "CERT-";
    const digits = Number(settings?.student_certificate_digit || 4);
    const startFrom = parseInt(settings?.student_certificate_start_from || "1", 10) || 1;
    const rawNum = student.id ? (parseInt(String(student.id).replace(/\D/g, ""), 10) || startFrom) : startFrom;
    const paddedNum = String(rawNum).padStart(digits, "0");
    return `C/N: ${prefix}${paddedNum}/${currentYear}`;
}

/** Pre-built certificate design templates matching modern school award standards */
export const PREBUILT_CERTIFICATES: Array<Omit<CertificateTemplate, "id"> & { id: number; description: string; preview_bg: string; badge_color: string }> = [
    {
        id: -1,
        name: "Royal Maroon & Gold - Appreciation",
        layout_type: "royal_gold",
        header_center: "CERTIFICATE OF APPRECIATION",
        body_text: "IN GRATEFUL RECOGNITION OF YOUR VALUABLE SUPPORT AND CONTRIBUTION TO OUR SCHOOL COMMUNITY.",
        remarks: "Honors and distinction.",
        footer_center: "SAVANNAH WARD\nPRINCIPAL",
        header_height: "90",
        footer_height: "70",
        body_height: "auto",
        body_width: "900",
        enable_student_photo: false,
        header_font_color: "#1a1a1a",
        title_color: "#926d27",
        body_font_color: "#2b1810",
        description: "Regal maroon & gold fluid wave curves, dual gold inner borders, and high-res gold laurel seal.",
        preview_bg: "linear-gradient(135deg, #7a131b 0%, #b88e44 100%)",
        badge_color: "bg-amber-600 text-white",
    },
    {
        id: -2,
        name: "Kids Vibrant Purple - Distinction",
        layout_type: "kids_purple",
        header_center: "AWARD OF DISTINCTION",
        body_text: "for exemplary behavior, academic effort, and positive contribution to the school community during the school year.\n\nYour hard work and bright spirit are truly appreciated.",
        remarks: "Distinction in curricular activities.",
        footer_left: "Ms. Molly Harper\nHomeroom Teacher",
        header_height: "90",
        footer_height: "70",
        body_height: "auto",
        body_width: "900",
        enable_student_photo: false,
        header_font_color: "#19205a",
        title_color: "#19205a",
        body_font_color: "#1f2937",
        description: "Playful wavy border, lively purple & sunshine yellow curves, with cute school pupil characters.",
        preview_bg: "linear-gradient(135deg, #58138b 0%, #ca8a04 100%)",
        badge_color: "bg-purple-600 text-white",
    },
    {
        id: -3,
        name: "Classic Luxury Burgundy - Excellence",
        layout_type: "luxury_burgundy",
        body_height: "auto",
        body_width: "900",
        enable_student_photo: false,
        description: "Solid chocolate-burgundy top banner with white typography, inner card frame, and golden ribbon medal.",
        preview_bg: "linear-gradient(135deg, #442323 0%, #7d3c3c 100%)",
        badge_color: "bg-red-950 text-white",
    },
    {
        id: -4,
        name: "School Letterhead Template (General Purpose)",
        layout_type: "school_letterhead",
        header_center: "GENERAL PURPOSE CERTIFICATE",
        body_text: "This is to certify that [name], son/daughter of [father_name], bearing Admission No. [admission_no] and Roll No. [roll_no], is a bonafide student of Class [class] ([section]) of this institution during session [session].\n\nTheir academic participation, conduct, and moral character have been found highly satisfactory during their period of study at this institution.",
        remarks: "Certified that the student has cleared all school dues and is granted this certificate upon official request.",
        footer_left: "Prepared By",
        footer_center: "Checked By",
        footer_right: "Authorized Signatory / Principal",
        header_height: "120",
        footer_height: "80",
        body_height: "auto",
        body_width: "900",
        enable_student_photo: true,
        description: "Uses the exact Print Header & Footer defined in System Settings > Print Header Footer (General Purpose tab).",
        preview_bg: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
        badge_color: "bg-teal-700 text-white",
    },
    {
        id: -5,
        name: "Standard School Certificate",
        layout_type: "standard_school",
        header_left: "Affiliation No: 198234",
        header_center: "ACADEMIC MERIT & CONDUCT CERTIFICATE",
        header_right: "School Code: 4021",
        body_text: "",
        remarks: "Certified that the student has displayed outstanding moral character, discipline, and academic dedication during the academic session.",
        footer_left: "Class Teacher",
        footer_center: "Verified By",
        footer_right: "Principal",
        header_height: "85",
        footer_height: "65",
        body_height: "auto",
        body_width: "900",
        enable_student_photo: true,
        description: "Official school certificate with school logo, address, student photo, and multi-signature footer.",
        preview_bg: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
        badge_color: "bg-slate-700 text-white",
    },
];

/** Replace `[placeholder]` tokens in a text string using the student's field map. */
export function substitutePlaceholders(text: string, fields: StudentFields, wrapBold = true): string {
    const presentDate = fields.present_date || new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const defaults: Record<string, string> = {
        name: fields.name || "",
        student_name: fields.name || "",
        dob: fields.dob || "",
        date_of_birth: fields.dob || "",
        present_address: fields.present_address || "",
        address: fields.present_address || "",
        current_address: fields.present_address || "",
        guardian: fields.guardian || "",
        admission_no: fields.admission_no || "",
        admission_number: fields.admission_no || "",
        roll_no: fields.roll_no || "",
        roll_number: fields.roll_no || "",
        class: fields.class || "",
        grade: fields.class || "",
        class_grade: fields.class || "",
        section: fields.section || "",
        gender: fields.gender || "",
        admission_date: fields.admission_date || "",
        date_of_admission: fields.admission_date || "",
        category: fields.category || "",
        caste: fields.caste || "",
        father_name: fields.father_name || "",
        mother_name: fields.mother_name || "",
        religion: fields.religion || "",
        email: fields.email || "",
        phone: fields.phone || "",
        mobile_no: fields.phone || "",
        mobile: fields.phone || "",
        present_date: presentDate,
        date: presentDate,
        session: fields.session || "2026 - 2027",
        academic_session: fields.session || "2026 - 2027",
        certificate_no: fields.certificate_no || fields.tc_number || "",
        certificate_number: fields.certificate_no || fields.tc_number || "",
        cert_no: fields.certificate_no || fields.tc_number || "",
        tc_number: fields.tc_number || fields.certificate_no || "",
        tc_no: fields.tc_number || fields.certificate_no || "",
        reason: fields.reason || "",
        remarks: fields.remarks || "",
        school_name: fields.school_name || "",
    };

    return text.replace(/\[([^\]]+)\]/g, (match, rawKey) => {
        const normalized = rawKey
            .toLowerCase()
            .replace(/['’]/g, "")
            .replace(/[\/\.\-_]/g, " ")
            .trim()
            .replace(/\s+/g, "_");

        const value = defaults[normalized] !== undefined
            ? defaults[normalized]
            : defaults[rawKey.toLowerCase().trim()];

        if (value != null && value !== "") {
            return wrapBold ? `<strong class="cert-var">${value}</strong>` : String(value);
        }
        return match;
    });
}

/** SVG Vector Assets */
const SVG_ASSETS = {
    schoolBookLogo: `
    <svg viewBox="0 0 100 80" width="48" height="38" fill="currentColor">
      <path d="M50 20 C35 10 15 12 5 18 L5 65 C15 60 35 58 50 68 C65 58 85 60 95 65 L95 18 C85 12 65 10 50 20 Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M50 20 L50 68" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <path d="M12 26 C22 22 36 21 46 27 M12 36 C22 32 36 31 46 37 M12 46 C22 42 36 41 46 47" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M88 26 C78 22 64 21 54 27 M88 36 C78 32 64 31 54 37 M88 46 C78 42 64 41 54 47" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    goldSealMedal: `
    <svg viewBox="0 0 200 200" width="130" height="130">
      <defs>
        <radialGradient id="goldGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff4c2"/>
          <stop offset="40%" stop-color="#e8bf5b"/>
          <stop offset="80%" stop-color="#bf8f2e"/>
          <stop offset="100%" stop-color="#8a6113"/>
        </radialGradient>
        <radialGradient id="goldRim" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#d6a738"/>
          <stop offset="100%" stop-color="#734f0c"/>
        </radialGradient>
      </defs>
      <!-- Laurel Leaves Outer Wreath -->
      <g fill="#c99738" stroke="#8a6113" stroke-width="0.5">
        <path d="M50 150 C30 130 25 100 35 70 C38 85 45 100 60 115 Z"/>
        <path d="M38 120 C22 105 20 80 30 55 C36 70 45 85 55 95 Z"/>
        <path d="M35 85 C25 65 30 45 45 30 C46 45 52 60 62 70 Z"/>
        <path d="M150 150 C170 130 175 100 165 70 C162 85 155 100 140 115 Z"/>
        <path d="M162 120 C178 105 180 80 170 55 C164 70 155 85 145 95 Z"/>
        <path d="M165 85 C175 65 170 45 155 30 C154 45 148 60 138 70 Z"/>
      </g>
      <!-- Starburst / Serrated Seal Edge -->
      <circle cx="100" cy="100" r="62" fill="url(#goldRim)"/>
      <polygon points="100,32 106,45 120,40 122,54 136,53 134,67 148,70 142,83 154,89 144,100 154,111 142,117 148,130 134,133 136,147 122,146 120,160 106,155 100,168 94,155 80,160 78,146 64,147 66,133 52,130 58,117 46,111 56,100 46,89 58,83 52,70 66,67 64,53 78,54 80,40 94,45" fill="url(#goldGrad)" stroke="#734f0c" stroke-width="1.5"/>
      <!-- Inner Disc -->
      <circle cx="100" cy="100" r="48" fill="url(#goldGrad)" stroke="#8a6113" stroke-width="2"/>
      <circle cx="100" cy="100" r="42" fill="none" stroke="#fff4c2" stroke-width="1.5" stroke-dasharray="3,2"/>
      <circle cx="100" cy="100" r="36" fill="url(#goldGrad)"/>
      <!-- Star Icons -->
      <path d="M100 76 L102 82 L108 82 L103 86 L105 92 L100 88 L95 92 L97 86 L92 82 L98 82 Z" fill="#734f0c"/>
      <text x="100" y="112" font-family="'Cinzel', Georgia, serif" font-size="12" font-weight="900" fill="#613f06" text-anchor="middle" letter-spacing="2">OFFICIAL</text>
      <text x="100" y="125" font-family="'Montserrat', sans-serif" font-size="8" font-weight="800" fill="#734f0c" text-anchor="middle" letter-spacing="1">AWARD</text>
    </svg>`,

    goldRibbonRosette: `
    <svg viewBox="0 0 160 180" width="115" height="130">
      <defs>
        <radialGradient id="rosetteGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffeaa7"/>
          <stop offset="60%" stop-color="#e2b13c"/>
          <stop offset="100%" stop-color="#996e13"/>
        </radialGradient>
      </defs>
      <!-- Ribbons Behind -->
      <path d="M60 110 L40 170 L65 155 L90 170 L75 110 Z" fill="#241515" stroke="#110a0a" stroke-width="1.5"/>
      <path d="M100 110 L85 170 L110 155 L135 170 L115 110 Z" fill="#382020" stroke="#110a0a" stroke-width="1.5"/>
      <!-- Outer Scalloped Medal -->
      <circle cx="80" cy="75" r="56" fill="url(#rosetteGrad)" stroke="#5e4104" stroke-width="2"/>
      <circle cx="80" cy="75" r="48" fill="#f8cd5b" stroke="#734f0c" stroke-width="1.5" stroke-dasharray="4,2"/>
      <circle cx="80" cy="75" r="40" fill="url(#rosetteGrad)"/>
      <text x="80" y="73" font-family="'Playfair Display', serif" font-size="15" font-weight="900" fill="#4d3202" text-anchor="middle">★ ★ ★</text>
      <text x="80" y="90" font-family="'Montserrat', sans-serif" font-size="9" font-weight="900" fill="#3b2400" text-anchor="middle" letter-spacing="1">EXCELLENCE</text>
    </svg>`,

    kidsIllustration: `
    <svg viewBox="0 0 240 200" width="165" height="138">
      <!-- Girl on Left -->
      <g>
        <!-- Hair -->
        <path d="M40 95 C30 115 20 140 25 150 C32 150 40 135 45 115 Z" fill="#d95d18"/>
        <path d="M85 95 C95 115 105 140 100 150 C93 150 85 135 80 115 Z" fill="#d95d18"/>
        <circle cx="62" cy="70" r="30" fill="#d95d18"/>
        <!-- Face -->
        <circle cx="62" cy="74" r="22" fill="#fed6ba"/>
        <!-- Hair Fringe -->
        <path d="M42 66 C52 56 72 56 82 66 C75 62 50 62 42 66 Z" fill="#b04408"/>
        <!-- Eyes & Smile -->
        <circle cx="55" cy="74" r="2.5" fill="#333"/>
        <circle cx="69" cy="74" r="2.5" fill="#333"/>
        <circle cx="51" cy="79" r="3" fill="#fca5a5" opacity="0.6"/>
        <circle cx="73" cy="79" r="3" fill="#fca5a5" opacity="0.6"/>
        <path d="M58 81 Q62 86 66 81" fill="none" stroke="#774a32" stroke-width="1.8" stroke-linecap="round"/>
        <!-- Body / Uniform -->
        <path d="M42 96 L82 96 L88 150 L36 150 Z" fill="#1e224f"/>
        <polygon points="62,96 55,115 62,125 69,115" fill="#f59e0b"/>
        <!-- Skirt -->
        <path d="M36 145 L88 145 L94 175 L30 175 Z" fill="#141738"/>
        <!-- Book in hands -->
        <rect x="50" y="108" width="24" height="30" rx="3" fill="#a855f7"/>
        <rect x="54" y="112" width="16" height="6" rx="2" fill="#ffffff"/>
      </g>
      <!-- Boy on Right -->
      <g>
        <!-- Hair -->
        <circle cx="155" cy="65" r="26" fill="#3b2314"/>
        <!-- Face -->
        <circle cx="155" cy="70" r="23" fill="#a16207"/>
        <!-- Eyes & Smile -->
        <circle cx="147" cy="70" r="2.5" fill="#111"/>
        <circle cx="163" cy="70" r="2.5" fill="#111"/>
        <path d="M150 78 Q155 83 160 78" fill="none" stroke="#451a03" stroke-width="2" stroke-linecap="round"/>
        <!-- Waving Hand -->
        <path d="M125 95 L110 55 C108 50 115 45 120 50 L135 85 Z" fill="#a16207"/>
        <!-- Body / Suit -->
        <path d="M135 92 L180 92 L185 160 L130 160 Z" fill="#1e224f"/>
        <!-- Yellow Backpack Straps -->
        <path d="M140 92 L142 135 M175 92 L173 135" stroke="#facc15" stroke-width="5" stroke-linecap="round"/>
        <!-- White Collar -->
        <polygon points="155,92 147,105 155,112 163,105" fill="#ffffff"/>
        <!-- Pants -->
        <rect x="133" y="160" width="22" height="35" fill="#141738"/>
        <rect x="160" y="160" width="22" height="35" fill="#141738"/>
      </g>
    </svg>`,
};

/**
 * Render certificate HTML dynamically according to the chosen preset layout style.
 */
export function renderCertificateHtml(
    template: CertificateTemplate,
    student: StudentFields,
    settings?: SchoolSettings
): string {
    const sub = (t?: string | null, wrapBold = false) => substitutePlaceholders(t ?? "", student, wrapBold);
    const layout = template.layout_type || "standard_school";
    const headerFontColor = template.header_font_color || settings?.school_name_title_color || "#0f766e";
    const titleColor = template.title_color || (layout === "royal_gold" ? "#926d27" : layout === "kids_purple" ? "#19205a" : layout === "luxury_burgundy" ? "#ffffff" : "#0f172a");
    const bodyFontColor = template.body_font_color || (layout === "royal_gold" ? "#2b1810" : layout === "kids_purple" ? "#1f2937" : layout === "luxury_burgundy" ? "#1f2937" : "#1e293b");

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const schoolName = settings?.school_name || student.school_name || sub(template.header_left) || "Bhujpur Government Primary School";
    const rawLogo = settings?.print_logo || settings?.admin_logo || settings?.app_logo || student.school_logo || (settings as any)?.logo;
    const schoolLogoUrl = rawLogo ? getImageUrl(rawLogo) : null;
    const schoolAddress = settings?.address || student.school_address || (settings as any)?.school_address || "House#68, Road#10, Sector#10, Uttara Model Town, Dhaka-1230";
    const schoolPhone = settings?.phone || student.school_phone || "";
    const schoolEmail = settings?.email || student.school_email || "";
    const sessionText = settings?.current_session || student.session || "2026 - 2027";
    const recipientName = student.name || "JOHN DOE";
    const titleText = sub(template.header_center) || "CERTIFICATE OF APPRECIATION";
    const bodyText = sub(template.body_text) || "IN GRATEFUL RECOGNITION OF YOUR VALUABLE SUPPORT AND CONTRIBUTION TO OUR SCHOOL COMMUNITY.";
    const footerLeft = sub(template.footer_left) || "Class Teacher";
    const footerCenter = sub(template.footer_center) || "";
    const footerRight = sub(template.footer_right) || "Principal";
    const presentDate = student.present_date || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    // Certificate Number & QR Code definition
    const certNoFormatted = formatCertificateNumber(template, student, settings);
    const certNoClean = certNoFormatted.replace(/^C\/N:\s*/i, "");

    const certQrPayload = JSON.stringify({
        cert_no: certNoClean,
        student_name: recipientName,
        admission_no: student.admission_no || "",
        school: schoolName,
        issue_date: presentDate,
    });
    const certQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(certQrPayload)}&margin=0`;

    const logoHtml = schoolLogoUrl
        ? `<img src="${schoolLogoUrl}" alt="${schoolName}" class="school-logo-img" style="max-height:55px;max-width:180px;object-fit:contain;margin-bottom:2px;" />`
        : `<div style="display:inline-block;color:${headerFontColor};margin-bottom:2px;">${SVG_ASSETS.schoolBookLogo}</div>`;

    // ──────────────────────── 1. ROYAL MAROON & GOLD LAYOUT ────────────────────────
    if (layout === "royal_gold") {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${sub(template.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800;900&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #e5e7eb; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Montserrat', sans-serif; }
    @media print {
      body { background: #fff; padding: 0; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: landscape; margin: 0; }
      .cert-page { box-shadow: none !important; margin: 0 !important; width: 100vw !important; height: 100vh !important; }
    }
    .cert-page {
      position: relative;
      width: 1000px;
      height: 700px;
      background: #fdfbf7;
      border: 1px solid #e0d8c3;
      box-shadow: 0 20px 50px rgba(0,0,0,0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 50px 70px;
      color: #2b1810;
    }
    .wave-top-right {
      position: absolute;
      top: 0; right: 0; width: 260px; height: 380px;
      pointer-events: none; z-index: 1;
    }
    .wave-bottom-left {
      position: absolute;
      bottom: 0; left: 0; width: 260px; height: 380px;
      pointer-events: none; z-index: 1;
    }
    .inner-border {
      position: absolute;
      top: 24px; left: 24px; right: 24px; bottom: 24px;
      border: 3px solid #d4af37; pointer-events: none; z-index: 2;
    }
    .inner-border-2 {
      position: absolute;
      top: 29px; left: 29px; right: 29px; bottom: 29px;
      border: 1px solid #b88e44; pointer-events: none; z-index: 2;
    }
    .cert-content {
      position: relative; z-index: 3; height: 100%;
      display: flex; flex-direction: column; justify-content: space-between; text-align: center;
    }
    .header-top-row {
      display: flex; justify-content: space-between; align-items: center; padding: 0 10px;
    }
    .header-logo-block {
      display: flex; flex-direction: column; align-items: center;
    }
    .school-name-text {
      font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 800;
      letter-spacing: 4px; text-transform: uppercase; color: #1a1a1a; margin-top: 4px;
    }
    .cert-title {
      font-family: 'Cinzel', serif; font-size: 32px; font-weight: 800;
      letter-spacing: 2px; color: #926d27; text-transform: uppercase; margin-top: 14px;
    }
    .cert-subtitle {
      font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 700;
      letter-spacing: 3px; color: #4b382a; text-transform: uppercase; margin-top: 12px;
    }
    .recipient-name {
      font-family: 'Cinzel', serif; font-size: 42px; font-weight: 800;
      letter-spacing: 3px; color: #9e7529; text-transform: uppercase; margin: 10px 0 14px 0;
      text-shadow: 1px 1px 0 rgba(212,175,55,0.2);
    }
    .body-message {
      font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 600;
      line-height: 1.8; letter-spacing: 1.5px; text-transform: uppercase; color: #2b1810;
      max-width: 680px; margin: 0 auto;
    }
    .date-display {
      font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 700;
      letter-spacing: 2px; text-transform: uppercase; color: #2b1810; margin-top: 14px;
    }
    .cert-footer-row {
      display: flex; justify-content: space-between; align-items: flex-end;
      padding: 0 40px 10px 40px; position: relative;
    }
    .sig-block {
      display: flex; flex-direction: column; align-items: center; width: 220px;
      text-align: center; margin: 0 auto;
    }
    .sig-line { width: 180px; height: 2px; background: #2b1810; margin-bottom: 8px; }
    .sig-name {
      font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 800;
      letter-spacing: 1px; text-transform: uppercase; color: #1a1a1a; line-height: 1.4;
    }
    .seal-container { position: absolute; right: 20px; bottom: 0px; }
  </style>
</head>
<body>
  <div class="cert-page">
    <svg class="wave-top-right" viewBox="0 0 260 380" preserveAspectRatio="none">
      <path d="M260,0 L120,0 C160,120 180,180 260,250 Z" fill="#b88e44" opacity="0.9"/>
      <path d="M260,0 L160,0 C200,100 210,160 260,340 Z" fill="#6b121c"/>
      <path d="M260,0 L185,0 C220,80 230,140 260,220 Z" fill="#801522"/>
    </svg>
    <svg class="wave-bottom-left" viewBox="0 0 260 380" preserveAspectRatio="none">
      <path d="M0,380 L0,220 C80,240 100,280 140,380 Z" fill="#b88e44" opacity="0.9"/>
      <path d="M0,380 L0,140 C50,220 60,280 100,380 Z" fill="#6b121c"/>
      <path d="M0,380 L0,250 C40,290 50,330 75,380 Z" fill="#801522"/>
    </svg>
    <div class="inner-border"></div>
    <div class="inner-border-2"></div>
    <div class="cert-content">
      <div class="header-top-row">
        <div style="width:140px;"></div>
        <div class="header-logo-block">
          ${logoHtml}
          <div class="school-name-text">${schoolName}</div>
        </div>
        <div style="width:140px;"></div>
      </div>
      <div>
        <div class="cert-title">${titleText}</div>
        <div class="cert-subtitle">PRESENTED TO</div>
        <div class="recipient-name">${recipientName}</div>
        <div class="body-message">${bodyText.replace(/\n/g, "<br/>")}</div>
        <div class="date-display">${presentDate}</div>
      </div>
      <div class="cert-footer-row">
        <div class="qr-container-bottom-left" style="position:absolute;left:20px;bottom:0px;display:flex;align-items:center;gap:10px;background:rgba(253,251,247,0.95);border:1.5px solid #d4af37;padding:5px 9px;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.06);text-align:left;">
          <img src="${certQrCodeUrl}" alt="QR" style="width:56px;height:56px;object-fit:contain;display:block;border-radius:3px;border:1px solid #e0d8c3;background:#fff;padding:2px;" />
          <div style="display:flex;flex-direction:column;justify-content:center;text-align:left;line-height:1.2;">
            <span style="font-size:8.5px;font-weight:800;color:#801522;text-transform:uppercase;letter-spacing:0.5px;">Certificate No:</span>
            <span style="font-size:12px;font-weight:800;color:#1a1a1a;letter-spacing:0.3px;margin-top:2px;">${certNoClean}</span>
          </div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-name">${(footerCenter || footerLeft || "SAVANNAH WARD\nPRINCIPAL").replace(/\n/g, "<br/>")}</div>
        </div>
        <div class="seal-container">${SVG_ASSETS.goldSealMedal}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
    }

    // ──────────────────────── 2. KIDS VIBRANT PURPLE & YELLOW LAYOUT ────────────────────────
    if (layout === "kids_purple") {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${sub(template.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;800&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #e5e7eb; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Montserrat', sans-serif; }
    @media print {
      body { background: #fff; padding: 0; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: landscape; margin: 0; }
      .cert-page { box-shadow: none !important; margin: 0 !important; width: 100vw !important; height: 100vh !important; }
    }
    .cert-page {
      position: relative; width: 1000px; height: 700px; background: #ffffff;
      box-shadow: 0 20px 50px rgba(0,0,0,0.15); overflow: hidden;
      display: flex; flex-direction: column; justify-content: space-between; padding: 50px 70px;
    }
    .wavy-frame-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
    .cert-content {
      position: relative; z-index: 3; height: 100%; display: flex; flex-direction: column; justify-content: space-between; text-align: center; padding: 10px 40px;
    }
    .header-top-row { display: flex; justify-content: space-between; align-items: center; }
    .header-logo-block { display: flex; flex-direction: column; align-items: center; }
    .school-name-text { font-size: 13px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #19205a; margin-top: 4px; }
    .cert-title {
      font-family: 'Fredoka', 'Montserrat', sans-serif; font-size: 38px; font-weight: 800; letter-spacing: 2px; color: #19205a; text-transform: uppercase; margin-top: 12px;
    }
    .cert-subtitle { font-size: 13px; font-weight: 600; color: #4b5563; margin-top: 10px; }
    .recipient-name {
      font-family: 'Fredoka', 'Montserrat', sans-serif; font-size: 40px; font-weight: 800; letter-spacing: 2px; color: #19205a; text-transform: uppercase; margin: 10px 0 12px 0;
    }
    .body-message { font-size: 13px; font-weight: 500; line-height: 1.7; color: #1f2937; max-width: 620px; margin: 0 auto; }
    .date-display { font-size: 12px; font-weight: 600; color: #4b5563; margin-top: 10px; }
    .cert-footer-row { display: flex; justify-content: space-between; align-items: flex-end; position: relative; margin-bottom: 10px; }
    .sig-block { display: flex; flex-direction: column; align-items: center; width: 220px; text-align: center; margin: 0 auto; }
    .sig-line { width: 180px; height: 2px; background: #19205a; margin-bottom: 6px; }
    .sig-name { font-size: 13px; font-weight: 800; color: #19205a; }
    .seal-left { position: absolute; left: 10px; bottom: 0px; }
    .kids-right { position: absolute; right: 0px; bottom: -15px; }
  </style>
</head>
<body>
  <div class="cert-page">
    <svg class="wavy-frame-svg" viewBox="0 0 1000 700" preserveAspectRatio="none">
      <path d="M 50,30 Q 150,5 250,30 T 500,20 T 750,30 T 950,30 Q 980,150 960,350 T 960,650 Q 850,680 750,660 T 500,670 T 250,660 T 50,660 Q 20,500 40,350 T 40,50 Z" fill="none" stroke="#facc15" stroke-width="12" stroke-linecap="round"/>
      <path d="M0,0 L1000,0 L1000,700 L0,700 Z" fill="#58138b"/>
      <path d="M 60,40 Q 150,15 250,40 T 500,30 T 750,40 T 940,40 Q 970,150 950,350 T 950,640 Q 850,670 750,650 T 500,660 T 250,650 T 60,650 Q 30,500 50,350 T 50,60 Z" fill="#ffffff"/>
    </svg>
    <div class="cert-content">
      <div class="header-top-row">
        <div style="width:140px;"></div>
        <div class="header-logo-block">
          ${logoHtml}
          <div class="school-name-text">${schoolName}</div>
        </div>
        <div style="width:140px;"></div>
      </div>
      <div>
        <div class="cert-title">${titleText}</div>
        <div class="cert-subtitle">This certificate proudly recognizes</div>
        <div class="recipient-name">${recipientName}</div>
        <div class="body-message">${bodyText.replace(/\n/g, "<br/>")}</div>
        <div class="date-display">Dated this ${presentDate}</div>
      </div>
      <div class="cert-footer-row">
        <div class="seal-left" style="display:flex;align-items:center;gap:12px;">
          ${SVG_ASSETS.goldSealMedal}
          <div class="qr-container-bottom-left" style="display:flex;align-items:center;gap:8px;background:#ffffff;border:1.5px solid #facc15;padding:4px 8px;border-radius:6px;box-shadow:0 2px 4px rgba(0,0,0,0.06);text-align:left;">
            <img src="${certQrCodeUrl}" alt="QR" style="width:48px;height:48px;object-fit:contain;display:block;border-radius:3px;background:#fff;padding:2px;" />
            <div style="display:flex;flex-direction:column;justify-content:center;line-height:1.2;">
              <span style="font-size:8px;font-weight:800;color:#58138b;text-transform:uppercase;letter-spacing:0.5px;">Certificate No:</span>
              <span style="font-size:11px;font-weight:800;color:#19205a;letter-spacing:0.3px;margin-top:2px;">${certNoClean}</span>
            </div>
          </div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-name">${(footerLeft || footerCenter || "Ms. Molly Harper\nHomeroom Teacher").replace(/\n/g, "<br/>")}</div>
        </div>
        <div class="kids-right">${SVG_ASSETS.kidsIllustration}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
    }

    // ──────────────────────── 3. CLASSIC LUXURY BURGUNDY LAYOUT ────────────────────────
    if (layout === "luxury_burgundy") {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${sub(template.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,800;0,900;1,600&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #e5e7eb; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Montserrat', sans-serif; }
    @media print {
      body { background: #fff; padding: 0; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: landscape; margin: 0; }
      .cert-page { box-shadow: none !important; margin: 0 !important; width: 100vw !important; height: 100vh !important; }
    }
    .cert-page {
      position: relative; width: 1000px; height: 700px; background: #422020;
      box-shadow: 0 20px 50px rgba(0,0,0,0.18); overflow: hidden; display: flex; flex-direction: column; padding: 30px;
    }
    .cert-inner-card {
      background: #ffffff; height: 100%; width: 100%; border: 12px solid #ffffff;
      display: flex; flex-direction: column; justify-content: space-between; position: relative;
    }
    .top-burgundy-banner { background: #422020; color: #ffffff; text-align: center; padding: 24px 20px 20px 20px; position: relative; }
    .banner-school-name { font-size: 13px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #f3e8e8; margin-bottom: 6px; }
    .banner-title { font-family: 'Playfair Display', serif; font-size: 34px; font-weight: 800; letter-spacing: 1px; color: #ffffff; }
    .body-content-area { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 20px 60px; }
    .cert-subtitle { font-size: 14px; font-weight: 600; color: #4b5563; margin-bottom: 12px; }
    .recipient-name { font-family: 'Playfair Display', serif; font-size: 46px; font-weight: 900; color: #111827; margin-bottom: 18px; }
    .body-message { font-size: 13.5px; font-weight: 500; line-height: 1.8; color: #1f2937; max-width: 650px; margin: 0 auto; }
    .date-display { font-size: 12.5px; font-weight: 600; color: #374151; margin-top: 18px; }
    .footer-row { display: flex; justify-content: space-between; align-items: flex-end; padding: 0 50px 30px 50px; position: relative; }
    .sig-block { display: flex; flex-direction: column; align-items: center; width: 260px; text-align: center; margin: 0 auto; }
    .sig-line { width: 220px; height: 2px; background: #422020; margin-bottom: 8px; }
    .sig-name { font-size: 13px; font-weight: 800; color: #111827; }
    .rosette-right { position: absolute; right: 35px; bottom: 10px; }
  </style>
</head>
<body>
  <div class="cert-page">
    <div class="cert-inner-card">
      <div class="top-burgundy-banner">
        <div class="banner-school-name">${schoolName}</div>
        <div class="banner-title">${titleText}</div>
      </div>
      <div class="body-content-area">
        <div class="cert-subtitle">This is to proudly recognize</div>
        <div class="recipient-name">${recipientName}</div>
        <div class="body-message">${bodyText.replace(/\n/g, "<br/>")}</div>
        <div class="date-display">Presented on this ${presentDate}</div>
      </div>
      <div class="footer-row">
        <div class="qr-container-bottom-left" style="position:absolute;left:35px;bottom:10px;display:flex;align-items:center;gap:10px;background:#ffffff;border:1.5px solid #d4af37;padding:5px 9px;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.06);text-align:left;">
          <img src="${certQrCodeUrl}" alt="QR" style="width:54px;height:54px;object-fit:contain;display:block;border-radius:3px;border:1px solid #cbd5e1;background:#fff;padding:2px;" />
          <div style="display:flex;flex-direction:column;justify-content:center;line-height:1.2;">
            <span style="font-size:8.5px;font-weight:800;color:#422020;text-transform:uppercase;letter-spacing:0.5px;">Certificate No:</span>
            <span style="font-size:12px;font-weight:800;color:#111827;letter-spacing:0.3px;margin-top:2px;">${certNoClean}</span>
          </div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-name">${(footerCenter || footerLeft || "Ms. Rachel Greene\nHomeroom Teacher").replace(/\n/g, "<br/>")}</div>
        </div>
        <div class="rosette-right">${SVG_ASSETS.goldRibbonRosette}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
    }

    // ──────────────────────── 4. SCHOOL LETTERHEAD (GENERAL PURPOSE TAB PRINT) ────────────────────────
    if (layout === "school_letterhead") {
        const headerImg = settings?.general_purpose_header_image ? getImageUrl(settings.general_purpose_header_image) : null;
        const footerContent = settings?.general_purpose_footer_content;
        const hasPhoto = template.enable_student_photo !== false;
        const studentPhoto = student.image ? getImageUrl(student.image) : null;
        const letterheadBodyText = sub(template.body_text, true);
        const formattedLetterheadBody = letterheadBodyText
            ? letterheadBodyText
                .replace(/\r\n/g, "\n")
                .replace(/\n{2,}/g, "<div style='height:6px;'></div>")
                .replace(/\n/g, "<br/>")
            : "";
        const letterheadRemarks = sub(template.remarks || student.reason || student.remarks, true);

        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <base href="${origin}/" />
  <title>${sub(template.name)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #f1f5f9;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: 'Arial Narrow', 'Nimbus Sans L', Arial, 'Helvetica Neue', sans-serif;
      color: #0f172a;
    }
    @media print {
      @page { size: landscape; margin: 10px; }
      html, body {
        background: #fff;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .letterhead-page {
        box-shadow: none !important;
        margin: 0 auto !important;
        width: calc(100vw - 20px) !important;
        height: calc(100vh - 20px) !important;
        max-height: calc(100vh - 20px) !important;
        border: 1px solid #cbd5e1 !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
    .letterhead-page {
      position: relative;
      width: 1000px;
      height: 640px;
      max-height: 640px;
      margin: 10px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      box-shadow: 0 12px 36px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
      color: #0f172a;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    /* Top Header Section */
    .print-header-banner {
      width: 100%;
      border-bottom: 2px solid ${headerFontColor};
      background: #fafaf9;
      flex-shrink: 0;
    }
    .print-header-img {
      width: 100%;
      max-height: 95px;
      object-fit: contain;
      display: block;
    }
    .default-letterhead-header {
      display: grid;
      grid-template-columns: 180px 1fr 180px;
      align-items: center;
      padding: 10px 40px;
      gap: 12px;
      background: linear-gradient(to bottom, #f8fafc, #ffffff);
    }
    .header-logo-col {
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    .header-spacer-col {
      width: 180px;
    }
    .school-info-center {
      text-align: center;
    }
    .letterhead-school-title {
      font-size: 24px;
      font-weight: 800;
      color: ${headerFontColor};
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-family: 'Arial Narrow', Arial, sans-serif;
      line-height: 1.15;
    }
    .letterhead-meta {
      font-size: 11px;
      color: #475569;
      margin-top: 3px;
      line-height: 1.35;
    }
    /* Body Certificate Content */
    .letterhead-body {
      flex: 1;
      padding: 12px 45px 12px 45px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow: hidden;
    }
    .title-row-container {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
      position: relative;
    }
    .cert-title-center {
      text-align: center;
      padding-top: 2px;
    }
    .cert-main-title {
      font-size: 26px;
      font-weight: 800;
      color: ${titleColor};
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-family: 'Arial Narrow', Arial, sans-serif;
      line-height: 1.1;
    }
    /* Stylish Underline for Certificate Header */
    .cert-title-underline {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 4px auto 0 auto;
      width: 260px;
    }
    .cert-title-underline .u-line {
      flex: 1;
      height: 1.5px;
      background: linear-gradient(90deg, transparent, ${headerFontColor} 70%, ${headerFontColor});
      border-radius: 2px;
    }
    .cert-title-underline .u-line.u-right {
      background: linear-gradient(90deg, ${headerFontColor}, ${headerFontColor} 30%, transparent);
    }
    .cert-title-underline .u-icon {
      color: ${headerFontColor};
      font-size: 10px;
      letter-spacing: 2px;
      line-height: 1;
    }
    .photo-box {
      float: right;
      width: 80px;
      height: 96px;
      margin-left: 20px;
      margin-bottom: 8px;
      margin-top: 2px;
      border: 1.5px solid #334155;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
    }
    .photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    /* Main middle-aligned body content */
    .letterhead-main-content {
      flex: 1;
      display: block;
      gap: 6px;
      margin: 2px 0;
    }
    .letterhead-text-body {
      font-family: 'Arial Narrow', 'Nimbus Sans L', Arial, sans-serif;
      font-size: 15.5px;
      line-height: 1.6;
      letter-spacing: 0.15px;
      color: ${bodyFontColor};
      text-align: justify;
      text-justify: inter-word;
      margin: 0;
      padding: 0;
    }
    .letterhead-text-body strong, .letterhead-text-body b, .cert-var {
      font-weight: 800 !important;
      color: #000000 !important;
    }
    /* Certification remarks box */
    .statement-container {
      clear: both;
      margin-top: 8px;
      margin-bottom: 2px;
      padding: 6px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3.5px solid ${headerFontColor};
      border-radius: 4px;
    }
    .statement-label {
      font-size: 11.5px;
      font-weight: 800;
      color: ${headerFontColor};
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 2px;
    }
    .statement-content {
      font-size: 14px;
      font-weight: 800 !important;
      line-height: 1.4;
      color: #000000 !important;
      font-family: 'Arial Narrow', 'Nimbus Sans L', Arial, sans-serif;
    }
    .statement-content, .statement-content strong, .statement-content b, .statement-content * {
      font-weight: 800 !important;
      color: #000000 !important;
    }
    /* Signatures Row anchored to bottom */
    .signature-row-bottom {
      clear: both;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 10px;
      padding-bottom: 2px;
      margin-top: 4px;
    }
    .sig-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 220px;
      text-align: center;
    }
    .sig-col-left {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 260px;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .sig-col-left strong {
      color: #000000;
      font-weight: 800;
    }
    .sig-underline {
      width: 170px;
      height: 1px;
      border-bottom: 1.5px dotted #334155;
      margin-bottom: 5px;
    }
    .sig-col-title {
      font-size: 10.5px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      line-height: 1.3;
    }
    .letterhead-footer-bottom {
      padding: 6px 45px 8px 45px;
      background: #fafaf9;
      flex-shrink: 0;
    }
    .custom-general-footer {
      font-size: 10px;
      color: #64748b;
      line-height: 1.3;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="letterhead-page">
    <div class="print-header-banner">
      ${headerImg
        ? `<img src="${headerImg}" class="print-header-img" alt="Header" />`
        : `<div class="default-letterhead-header">
             <div class="header-logo-col">${logoHtml}</div>
             <div class="school-info-center">
               <div class="letterhead-school-title">${schoolName}</div>
               <div class="letterhead-meta">
                 ${schoolAddress ? `<span>${schoolAddress}</span>` : ""}
                 ${schoolPhone ? ` &bull; <span>Tel: ${schoolPhone}</span>` : ""}
                 ${schoolEmail ? ` &bull; <span>Email: ${schoolEmail}</span>` : ""}
               </div>
             </div>
             <div class="header-spacer-col"></div>
           </div>`
      }
    </div>

    <div class="letterhead-body">
      <div class="title-row-container">
        <div class="cert-title-center">
          <h1 class="cert-main-title">${titleText}</h1>
          <div class="cert-title-underline">
            <span class="u-line"></span>
            <span class="u-icon">&bull; &#10022; &bull;</span>
            <span class="u-line u-right"></span>
          </div>
        </div>
      </div>

      <!-- Middle-aligned body container -->
      <div class="letterhead-main-content">
        ${hasPhoto ? `
        <div class="photo-box">
          ${studentPhoto
            ? `<img src="${studentPhoto}" alt="Student Photo" class="photo-img" />`
            : `<span style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Photo</span>`
          }
        </div>` : ""}

        <!-- Open Custom Body Text in Arial Narrow with Bolded Dynamic Variables -->
        <div class="letterhead-text-body">
          ${formattedLetterheadBody}
        </div>

        <!-- Remarks / Purpose / Certification Box placed directly under Body Text -->
        ${(template.remarks || student.reason || student.remarks) ? `
        <div class="statement-container">
          <div class="statement-label">REMARKS / PURPOSE / CERTIFICATION :</div>
          <div class="statement-content">
            ${letterheadRemarks.replace(/\n/g, "<br/>")}
          </div>
        </div>` : ""}
      </div>

      <!-- Signatures Row anchored to the bottom with enlarged QR Code and Certificate No beside it -->
      <div class="signature-row-bottom">
        <div class="sig-col-left">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <img src="${certQrCodeUrl}" alt="QR" style="width:64px;height:64px;object-fit:contain;display:block;border-radius:4px;border:1.5px solid #cbd5e1;background:#fff;padding:3px;box-shadow:0 1px 4px rgba(0,0,0,0.06);" />
            <div style="display:flex;flex-direction:column;justify-content:center;text-align:left;line-height:1.2;">
              <span style="font-size:9px;font-weight:800;color:${headerFontColor};text-transform:uppercase;letter-spacing:0.5px;">Certificate No:</span>
              <span style="font-size:12.5px;font-weight:800;color:#0f172a;letter-spacing:0.3px;margin-top:2px;">${certNoClean}</span>
            </div>
          </div>
          <span style="font-size:11.5px;color:#334155;">Date: <strong style="color:#000;">${presentDate}</strong></span>
        </div>
        <div class="sig-col">
          <div class="sig-underline"></div>
          <div class="sig-col-title">${footerLeft || "PREPARED BY"}</div>
        </div>
        <div class="sig-col">
          <div class="sig-underline"></div>
          <div class="sig-col-title">${footerRight || "AUTHORIZED SIGNATORY / PRINCIPAL"}</div>
        </div>
      </div>
    </div>

    ${footerContent ? `<div class="letterhead-footer-bottom"><div class="custom-general-footer">${footerContent}</div></div>` : ""}
  </div>
</body>
</html>`;
    }

    // ──────────────────────── 5. STANDARD SCHOOL PRINT HEADER & FOOTER ────────────────────────
    const headerHeight = template.header_height ? `${template.header_height}px` : "90px";
    const footerHeight = template.footer_height ? `${template.footer_height}px` : "70px";
    const bodyWidth = template.body_width ? `${template.body_width}px` : "1000px";

    const bg = template.background_image
        ? `background: url('${template.background_image}') center/cover no-repeat;`
        : "background: #ffffff;";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${sub(template.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f1f5f9; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Inter', Arial, sans-serif; }
    @media print {
      body { background: #fff; padding: 0; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: landscape; margin: 0; }
      .cert-wrapper { box-shadow: none !important; margin: 0 !important; width: 100vw !important; height: 100vh !important; border-width: 4px !important; }
    }
    .cert-wrapper {
      width: ${bodyWidth};
      min-height: 700px;
      ${bg}
      border: 8px double #475569;
      box-shadow: 0 15px 40px rgba(0,0,0,0.1);
      padding: 30px 45px 20px 45px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #1e293b;
      position: relative;
    }
    .cert-header {
      min-height: ${headerHeight};
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #334155;
      padding-bottom: 10px;
    }
    .header-col-left, .header-col-right {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      line-height: 1.5;
    }
    .header-col-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .school-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 1px;
    }
    .cert-title-badge {
      font-size: 13px;
      font-weight: 800;
      color: #4f46e5;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .cert-body-content {
      flex: 1;
      padding: 12px 10px;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .title-photo-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .cert-main-heading {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      text-align: center;
      flex: 1;
      padding-top: 4px;
    }
    .photo-frame {
      width: 90px;
      height: 105px;
      border: 1.5px solid #475569;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      flex-shrink: 0;
    }
    .photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    /* Structured Data Table */
    .std-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 6px;
      margin: 6px 0 12px 0;
      font-size: 13px;
    }
    .std-table td {
      padding: 2px 4px;
      vertical-align: middle;
    }
    .s-label {
      width: 220px;
      font-weight: 700;
      color: #1e293b;
      font-size: 12.5px;
      white-space: nowrap;
    }
    .s-sublabel {
      font-weight: 700;
      color: #1e293b;
      font-size: 12.5px;
      text-align: right;
      padding-right: 14px;
      white-space: nowrap;
    }
    .s-val {
      border-bottom: 1px dotted #64748b;
      color: #0f172a;
      font-weight: 700;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .statement-box {
      margin-top: 6px;
      padding: 10px 14px;
      background: #f8fafc;
      border-left: 3px solid #4f46e5;
      border-radius: 4px;
    }
    .statement-heading {
      font-size: 11.5px;
      font-weight: 800;
      color: #4f46e5;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .statement-text {
      font-size: 13.5px;
      font-weight: 800 !important;
      line-height: 1.65;
      color: #000000 !important;
    }
    .statement-text, .statement-text strong, .statement-text b, .statement-text * {
      font-weight: 800 !important;
      color: #000000 !important;
    }
    .cert-footer {
      min-height: ${footerHeight};
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      border-top: 2px solid #334155;
      padding-top: 10px;
    }
    .footer-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 180px;
      text-align: center;
    }
    .footer-sig-line {
      width: 150px;
      height: 1px;
      border-bottom: 1px dotted #334155;
      margin-bottom: 6px;
    }
    .footer-label {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.3;
    }
  </style>
</head>
<body>
  <div class="cert-wrapper">
    <div class="cert-header">
      <div class="header-col-left">
        <div>${sub(template.header_left) || `Date: ${presentDate}`}</div>
        <div style="display:inline-flex;align-items:center;gap:6px;background:#f8fafc;border:1px solid #cbd5e1;border-left:3px solid #4f46e5;padding:3px 7px;border-radius:4px;margin-top:5px;text-align:left;">
          <img src="${certQrCodeUrl}" alt="QR" style="width:26px;height:26px;object-fit:contain;display:block;border-radius:2px;background:#fff;" />
          <div style="display:flex;flex-direction:column;line-height:1.15;">
            <span style="font-size:7.5px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:0.4px;">Certificate No:</span>
            <span style="font-size:10.5px;font-weight:800;color:#0f172a;letter-spacing:0.3px;">${certNoClean}</span>
          </div>
        </div>
      </div>
      <div class="header-col-center">
        ${logoHtml}
        <div class="school-name">${schoolName}</div>
        <div class="cert-title-badge">${titleText}</div>
      </div>
      <div class="header-col-right" style="text-align:right;">${sub(template.header_right) || `Session: ${sessionText}`}</div>
    </div>

    <div class="cert-body-content">
      <div class="title-photo-row">
        <div style="width: 90px;"></div>
        <div class="cert-main-heading">${titleText}</div>
        <div class="photo-frame">
          ${template.enable_student_photo !== false && student.image
            ? `<img src="${student.image}" alt="Student Photo" />`
            : `<span style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Photo</span>`
          }
        </div>
      </div>

      <!-- Structured Data Table -->
      <table class="std-table">
        <tr>
          <td class="s-label">Student's Name</td>
          <td class="s-val" colspan="3">${recipientName || "-"}</td>
        </tr>
        <tr>
          <td class="s-label">Student Code / Adm. No</td>
          <td class="s-val">${student.admission_no || "-"}</td>
          <td class="s-sublabel">Roll No</td>
          <td class="s-val" style="width: 180px;">${student.roll_no || "-"}</td>
        </tr>
        <tr>
          <td class="s-label">Father's Name</td>
          <td class="s-val" colspan="3">${student.father_name || "-"}</td>
        </tr>
        <tr>
          <td class="s-label">Mother's Name</td>
          <td class="s-val" colspan="3">${student.mother_name || "-"}</td>
        </tr>
        <tr>
          <td class="s-label">Address</td>
          <td class="s-val" colspan="3">${student.present_address || "-"}</td>
        </tr>
        <tr>
          <td class="s-label">Date of birth (in Register)</td>
          <td class="s-val">${student.dob || "-"}</td>
          <td class="s-sublabel">Gender / Category</td>
          <td class="s-val">${[student.gender, student.category].filter(Boolean).join(" / ") || "-"}</td>
        </tr>
        <tr>
          <td class="s-label">Class & Section</td>
          <td class="s-val">${student.class ? `Class ${student.class}${student.section ? ` (${student.section})` : ""}` : "-"}</td>
          <td class="s-sublabel">Academic Session</td>
          <td class="s-val">${sessionText}</td>
        </tr>
      </table>

      <!-- Statement Box -->
      ${(template.remarks || template.body_text || student.reason || student.remarks) ? `
      <div class="statement-box">
        <div class="statement-heading">REMARKS / PURPOSE / CERTIFICATION :</div>
        <div class="statement-text">
          ${sub(template.remarks || template.body_text || student.reason || student.remarks || "").replace(/\n/g, "<br/>")}
        </div>
      </div>` : ""}
    </div>

    <div class="cert-footer">
      <div class="footer-col">
        <div class="footer-sig-line"></div>
        <div class="footer-label">${footerLeft || "Class Teacher"}</div>
      </div>
      <div class="footer-col">
        <div class="footer-sig-line"></div>
        <div class="footer-label">${footerCenter || "Verified By"}</div>
      </div>
      <div class="footer-col">
        <div class="footer-sig-line"></div>
        <div class="footer-label">${footerRight || "Head of Institution<br/>with Office Seal"}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/** Open a print dialog for the rendered certificate HTML. */
export function printCertificate(html: string): void {
    const win = window.open("", "_blank", "width=1050,height=750");
    if (!win) {
        alert("Pop-up blocked. Please allow pop-ups for this site.");
        return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
}

/** Convert a single image URL to base64 data URI via /api/proxy-image server-side proxy. */
async function proxyImageToBase64(url: string): Promise<string> {
    try {
        const proxyUrl = `${window.location.origin}/api/proxy-image?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) return "";
        const blob = await res.blob();
        if (blob.size <= 100) return ""; // Skip tiny transparent-PNG fallback
        return await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string) || "");
            reader.onerror = () => resolve("");
            reader.readAsDataURL(blob);
        });
    } catch {
        return "";
    }
}

/** Download the rendered certificate as a PDF via jsPDF + html2canvas. */
export async function downloadCertificatePdf(html: string, filename = "certificate.pdf"): Promise<void> {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
    ]);

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-10000px;left:-10000px;width:1050px;height:750px;border:none;visibility:hidden;";
    document.body.appendChild(iframe);

    try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) throw new Error("Could not access iframe document");
        doc.open();
        doc.write(html);
        doc.close();

        // Convert each non-data image in the iframe DOM to base64 via server-side proxy
        const images = Array.from(doc.images);
        for (const img of images) {
            if (!img.src || img.src.startsWith("data:") || img.src === "about:blank") continue;
            const base64 = await proxyImageToBase64(img.src);
            if (base64 && base64.startsWith("data:image")) {
                img.src = base64;
            }
        }

        // Wait for all images (now base64) to finish decoding
        await Promise.all(
            Array.from(doc.images).map(
                (img) =>
                    new Promise((resolve) => {
                        if (img.complete && img.naturalWidth > 0) return resolve(true);
                        img.onload = () => resolve(true);
                        img.onerror = () => resolve(false);
                        setTimeout(() => resolve(true), 3000);
                    })
            )
        );
        await new Promise((resolve) => setTimeout(resolve, 400));

        const targetEl = (doc.querySelector(".letterhead-page, .cert-page, .cert-wrapper, .card") as HTMLElement) || doc.body;
        const canvas = await html2canvas(targetEl, {
            scale: 2,
            useCORS: false,
            allowTaint: false,
            backgroundColor: "#ffffff",
            logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = canvas.width / 2;
        const pdfHeight = canvas.height / 2;
        const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
            unit: "px",
            format: [pdfWidth, pdfHeight],
        });
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(filename);
    } finally {
        if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
        }
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
    design_type?: string | null;
    is_active?: boolean;
    show_admission_no?: boolean;
    show_student_name?: boolean;
    show_class?: boolean;
    show_roll_no?: boolean;
    show_house?: boolean;
    show_blood_group?: boolean;
    show_session?: boolean;
    show_staff_name?: boolean;
    show_staff_id?: boolean;
    show_designation?: boolean;
    show_department?: boolean;
    show_joining_date?: boolean;
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
    admission_no?: string;
    roll_no?: string;
    class?: string;
    section?: string;
    house?: string;
    blood_group?: string;
    session?: string;
    staff_id?: string;
    designation?: string;
    department?: string;
    joining_date?: string;
    father_name?: string;
    mother_name?: string;
    address?: string;
    phone?: string;
    dob?: string;
    qr_code?: string | null;
}

export interface PrebuiltIdCardPreset extends Omit<IdCardTemplate, "id"> {
    id: number;
    description: string;
    preview_bg: string;
    badge_color: string;
}

export const PREBUILT_STUDENT_ID_CARDS: PrebuiltIdCardPreset[] = [
    {
        id: -101,
        title: "Modern Minimalist Indigo (Horizontal)",
        school_name: "SPRINGDALE INTERNATIONAL SCHOOL",
        school_address: "123 Academic Blvd, Oxford District",
        header_color: "#4F46E5",
        design_type: "Horizontal",
        show_admission_no: true,
        show_student_name: true,
        show_class: true,
        show_roll_no: true,
        show_father_name: true,
        show_mother_name: false,
        show_address: true,
        show_phone: true,
        show_dob: true,
        show_blood_group: true,
        show_house: true,
        show_session: true,
        show_qr: true,
        description: "Horizontal layout with sleek indigo header, structured grid, photo card frame, session tag, and QR verification badge.",
        preview_bg: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
        badge_color: "bg-indigo-600 text-white",
    },
    {
        id: -102,
        title: "Executive Slate & Gold (Vertical)",
        school_name: "OAKRIDGE ACADEMY & HIGH SCHOOL",
        school_address: "450 Heritage Way, New York",
        header_color: "#0F172A",
        design_type: "Vertical",
        show_admission_no: true,
        show_student_name: true,
        show_class: true,
        show_roll_no: true,
        show_father_name: true,
        show_mother_name: false,
        show_address: false,
        show_phone: true,
        show_dob: true,
        show_blood_group: true,
        show_house: true,
        show_session: true,
        show_qr: true,
        description: "Vertical lanyard badge with dark slate header, gold trim, centered portrait, session badge, and gold-trimmed QR code.",
        preview_bg: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
        badge_color: "bg-slate-900 text-amber-400",
    },
    {
        id: -103,
        title: "Bright Future Golden Crest (Horizontal)",
        school_name: "BRIGHT FUTURE PUBLIC SCHOOL",
        school_address: "Discipline • Education • Excellence",
        header_color: "#0F2942",
        design_type: "Horizontal",
        show_admission_no: true,
        show_student_name: true,
        show_class: true,
        show_roll_no: true,
        show_father_name: true,
        show_mother_name: true,
        show_address: false,
        show_phone: true,
        show_dob: true,
        show_blood_group: false,
        show_house: false,
        show_session: true,
        show_qr: true,
        description: "Navy blue & gold crest horizontal ID with golden badge, session box, high-contrast barcode, and clean colon-aligned details.",
        preview_bg: "linear-gradient(135deg, #0f2942 0%, #1e3a8a 100%)",
        badge_color: "bg-amber-500 text-slate-950 font-bold",
    },
    {
        id: -104,
        title: "Liberty Collegiate Maroon (Vertical)",
        school_name: "LIBERTY SS / COLLEGE",
        school_address: "Birtamode-5, Jhapa",
        header_color: "#7F1D1D",
        design_type: "Vertical",
        show_admission_no: true,
        show_student_name: true,
        show_class: true,
        show_roll_no: true,
        show_father_name: true,
        show_mother_name: false,
        show_address: true,
        show_phone: true,
        show_dob: true,
        show_blood_group: false,
        show_house: false,
        show_session: true,
        show_qr: true,
        description: "Prestigious vertical collegiate badge with maroon arch header, vertical 'STUDENT ID CARD' side ribbon, and faculty pill.",
        preview_bg: "linear-gradient(135deg, #7f1d1d 0%, #5b0e14 100%)",
        badge_color: "bg-red-900 text-white",
    },
    {
        id: -105,
        title: "Royal Blue & Gold Circle (Vertical)",
        school_name: "BRIGHT FUTURE INTERNATIONAL SCHOOL",
        school_address: "Learn • Grow • Succeed",
        header_color: "#0B2545",
        design_type: "Vertical",
        show_admission_no: true,
        show_student_name: true,
        show_class: true,
        show_roll_no: true,
        show_father_name: true,
        show_mother_name: false,
        show_address: true,
        show_phone: true,
        show_dob: true,
        show_blood_group: false,
        show_house: false,
        show_session: true,
        show_qr: true,
        description: "Official vertical badge with concentric blue & gold circular photo frame, ribbon banner, session badge, and barcode footer.",
        preview_bg: "linear-gradient(135deg, #0b2545 0%, #134074 100%)",
        badge_color: "bg-blue-950 text-amber-300",
    },
    {
        id: -106,
        title: "Little Flower Vibrant Curved (Vertical)",
        school_name: "PROTIVA LITTLE FLOWER ACADEMY",
        school_address: "Promised To Ensure Quality Education",
        header_color: "#4C1D95",
        design_type: "Vertical",
        show_admission_no: true,
        show_student_name: true,
        show_class: true,
        show_roll_no: true,
        show_father_name: true,
        show_mother_name: false,
        show_address: false,
        show_phone: true,
        show_dob: true,
        show_blood_group: true,
        show_house: false,
        show_session: true,
        show_qr: true,
        description: "Energetic purple & orange curved header with green gear emblem, orange photo frame, session line, and wave footer.",
        preview_bg: "linear-gradient(135deg, #4c1d95 0%, #ea580c 100%)",
        badge_color: "bg-purple-900 text-amber-300",
    },
    {
        id: -107,
        title: "Vikas National Bilingual (Vertical)",
        school_name: "शास. प्राथ. शाला गारका (VIKAS ACADEMY)",
        school_address: "ब्लॉक-डौंडी लोहारा, जिला- बालोद",
        header_color: "#1E3A8A",
        design_type: "Vertical",
        show_admission_no: true,
        show_student_name: true,
        show_class: true,
        show_roll_no: true,
        show_father_name: true,
        show_mother_name: false,
        show_address: true,
        show_phone: true,
        show_dob: true,
        show_blood_group: false,
        show_house: false,
        show_session: true,
        show_qr: true,
        description: "Classic bilingual vertical layout with navy & gold header, yellow class banner, Hindi labels, session, and green signature stamp.",
        preview_bg: "linear-gradient(135deg, #1e3a8a 0%, #be185d 100%)",
        badge_color: "bg-blue-900 text-yellow-300",
    },
    {
        id: -108,
        title: "Tech Sapphire Digital ID (Horizontal)",
        school_name: "HORIZON STEM & ROBOTICS ACADEMY",
        school_address: "10 Innovation Way, Silicon Park",
        header_color: "#0284C7",
        design_type: "Horizontal",
        show_admission_no: true,
        show_student_name: true,
        show_class: true,
        show_roll_no: true,
        show_father_name: true,
        show_mother_name: true,
        show_address: false,
        show_phone: true,
        show_dob: true,
        show_blood_group: true,
        show_house: true,
        show_session: true,
        show_qr: true,
        description: "Modern sapphire digital badge with RFID chip frame, monospace session readout, cyber barcode, and digital QR frame.",
        preview_bg: "linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)",
        badge_color: "bg-sky-600 text-white",
    },
    {
        id: -109,
        title: "Bright Future Modern Wave (Vertical)",
        school_name: "BRIGHT FUTURE PUBLIC SCHOOL",
        school_address: "Knowledge Today, Success Tomorrow",
        header_color: "#0B2238",
        design_type: "Vertical",
        show_admission_no: true,
        show_student_name: true,
        show_class: true,
        show_roll_no: true,
        show_father_name: true,
        show_mother_name: true,
        show_address: true,
        show_phone: true,
        show_dob: true,
        show_blood_group: true,
        show_house: false,
        show_session: true,
        show_qr: true,
        description: "Navy blue vertical ID with gold & cyan wave ribbon, rounded photo, side session & QR, and curved bottom-right ID badge.",
        preview_bg: "linear-gradient(135deg, #0b2238 0%, #1e3a8a 100%)",
        badge_color: "bg-blue-950 text-amber-400",
    },
    {
        id: -110,
        title: "Green Field International Crest (Vertical)",
        school_name: "GREEN FIELD INTERNATIONAL SCHOOL",
        school_address: "Shaping Minds, Building Futures",
        header_color: "#14532D",
        design_type: "Vertical",
        show_admission_no: true,
        show_student_name: true,
        show_class: true,
        show_roll_no: true,
        show_father_name: true,
        show_mother_name: true,
        show_address: true,
        show_phone: true,
        show_dob: true,
        show_blood_group: true,
        show_house: false,
        show_session: true,
        show_qr: true,
        description: "Emerald & olive vertical crest card with circular photo, green ribbon banner, icon-bulleted rows, and solid green footer band.",
        preview_bg: "linear-gradient(135deg, #14532d 0%, #15803d 100%)",
        badge_color: "bg-emerald-900 text-white",
    },
];

export const PREBUILT_STAFF_ID_CARDS: PrebuiltIdCardPreset[] = [
    {
        id: -201,
        title: "Faculty Indigo Professional (Horizontal)",
        school_name: "SPRINGDALE INTERNATIONAL SCHOOL",
        school_address: "123 Academic Blvd, Oxford District",
        header_color: "#4F46E5",
        design_type: "Horizontal",
        show_staff_name: true,
        show_staff_id: true,
        show_designation: true,
        show_department: true,
        show_father_name: false,
        show_mother_name: false,
        show_joining_date: true,
        show_address: false,
        show_phone: true,
        show_dob: false,
        show_qr: true,
        description: "Clean horizontal faculty ID badge with indigo corporate header, department pill badge, and authorized sign.",
        preview_bg: "linear-gradient(135deg, #4f46e5 0%, #312e81 100%)",
        badge_color: "bg-indigo-600 text-white",
    },
    {
        id: -202,
        title: "Executive Staff Slate & Gold (Vertical)",
        school_name: "ST. AUGUSTINE HIGH SCHOOL",
        school_address: "Excellence in Education Since 1985",
        header_color: "#0F172A",
        design_type: "Vertical",
        show_staff_name: true,
        show_staff_id: true,
        show_designation: true,
        show_department: true,
        show_father_name: false,
        show_mother_name: false,
        show_joining_date: true,
        show_address: true,
        show_phone: true,
        show_dob: false,
        show_qr: true,
        description: "Vertical executive lanyard badge with dark slate header, gold trim, centered portrait, and digital staff verification.",
        preview_bg: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
        badge_color: "bg-slate-900 text-amber-400",
    },
    {
        id: -203,
        title: "Bright Future Golden Crest Staff (Horizontal)",
        school_name: "BRIGHT FUTURE PUBLIC SCHOOL",
        school_address: "Discipline • Education • Excellence",
        header_color: "#0F2942",
        design_type: "Horizontal",
        show_staff_name: true,
        show_staff_id: true,
        show_designation: true,
        show_department: true,
        show_father_name: false,
        show_mother_name: false,
        show_joining_date: true,
        show_address: false,
        show_phone: true,
        show_dob: false,
        show_qr: true,
        description: "Navy & gold horizontal faculty ID with golden crest, department seal, and high-contrast staff barcode footer.",
        preview_bg: "linear-gradient(135deg, #0f2942 0%, #1e3a8a 100%)",
        badge_color: "bg-blue-950 text-amber-400",
    },
    {
        id: -204,
        title: "Liberty Collegiate Maroon Faculty (Vertical)",
        school_name: "LIBERTY SS / COLLEGE",
        school_address: "Knowledge • Integrity • Service",
        header_color: "#7F1D1D",
        design_type: "Vertical",
        show_staff_name: true,
        show_staff_id: true,
        show_designation: true,
        show_department: true,
        show_father_name: false,
        show_mother_name: false,
        show_joining_date: true,
        show_address: true,
        show_phone: true,
        show_dob: false,
        show_qr: true,
        description: "Classic vertical collegiate faculty lanyard badge with arched maroon header, side ribbon, and rounded photo frame.",
        preview_bg: "linear-gradient(135deg, #7f1d1d 0%, #5b0e14 100%)",
        badge_color: "bg-red-900 text-white",
    },
    {
        id: -205,
        title: "Royal Blue & Gold Circle Staff (Vertical)",
        school_name: "BRIGHT FUTURE INTERNATIONAL SCHOOL",
        school_address: "Learn • Grow • Succeed",
        header_color: "#0B2545",
        design_type: "Vertical",
        show_staff_name: true,
        show_staff_id: true,
        show_designation: true,
        show_department: true,
        show_father_name: false,
        show_mother_name: false,
        show_joining_date: true,
        show_address: true,
        show_phone: true,
        show_dob: false,
        show_qr: true,
        description: "Official staff vertical badge with concentric blue & gold circular photo frame, ribbon banner, and barcode footer.",
        preview_bg: "linear-gradient(135deg, #0b2545 0%, #134074 100%)",
        badge_color: "bg-blue-950 text-amber-300",
    },
    {
        id: -206,
        title: "Little Flower Vibrant Curved Staff (Vertical)",
        school_name: "PROTIVA LITTLE FLOWER ACADEMY",
        school_address: "Promised To Ensure Quality Education",
        header_color: "#4C1D95",
        design_type: "Vertical",
        show_staff_name: true,
        show_staff_id: true,
        show_designation: true,
        show_department: true,
        show_father_name: false,
        show_mother_name: false,
        show_joining_date: true,
        show_address: true,
        show_phone: true,
        show_dob: false,
        show_qr: true,
        description: "Energetic purple & orange curved header staff ID with gear emblem, orange photo frame, and wave footer.",
        preview_bg: "linear-gradient(135deg, #4c1d95 0%, #ea580c 100%)",
        badge_color: "bg-purple-900 text-amber-300",
    },
    {
        id: -207,
        title: "Vikas National Bilingual Staff (Vertical)",
        school_name: "शास. प्राथ. शाला गारका (VIKAS ACADEMY)",
        school_address: "ब्लॉक-डौंडी लोहारा, जिला- बालोद",
        header_color: "#1E3A8A",
        design_type: "Vertical",
        show_staff_name: true,
        show_staff_id: true,
        show_designation: true,
        show_department: true,
        show_father_name: false,
        show_mother_name: false,
        show_joining_date: true,
        show_address: true,
        show_phone: true,
        show_dob: false,
        show_qr: true,
        description: "Classic bilingual vertical layout with navy & gold header, designation banner, Hindi labels, and green signature stamp.",
        preview_bg: "linear-gradient(135deg, #1e3a8a 0%, #be185d 100%)",
        badge_color: "bg-blue-900 text-yellow-300",
    },
    {
        id: -208,
        title: "Tech Staff Sapphire High-Tech (Horizontal)",
        school_name: "HORIZON STEM & ROBOTICS ACADEMY",
        school_address: "10 Innovation Way, Silicon Park",
        header_color: "#0284C7",
        design_type: "Horizontal",
        show_staff_name: true,
        show_staff_id: true,
        show_designation: true,
        show_department: true,
        show_father_name: false,
        show_mother_name: false,
        show_joining_date: true,
        show_address: false,
        show_phone: true,
        show_dob: false,
        show_qr: true,
        description: "Modern sapphire digital staff badge with high-contrast designation banner, staff QR badge, and dual-column data.",
        preview_bg: "linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)",
        badge_color: "bg-sky-600 text-white",
    },
    {
        id: -209,
        title: "Bright Future Modern Wave Staff (Vertical)",
        school_name: "BRIGHT FUTURE PUBLIC SCHOOL",
        school_address: "Knowledge Today, Success Tomorrow",
        header_color: "#0B2238",
        design_type: "Vertical",
        show_staff_name: true,
        show_staff_id: true,
        show_designation: true,
        show_department: true,
        show_father_name: true,
        show_mother_name: false,
        show_joining_date: true,
        show_address: true,
        show_phone: true,
        show_dob: true,
        show_qr: true,
        description: "Executive navy & gold wave vertical faculty ID with side QR matrix, designation tag, and curved ID badge.",
        preview_bg: "linear-gradient(135deg, #0b2238 0%, #1e3a8a 100%)",
        badge_color: "bg-blue-950 text-amber-400",
    },
    {
        id: -210,
        title: "Green Field International Staff (Vertical)",
        school_name: "GREEN FIELD INTERNATIONAL SCHOOL",
        school_address: "Shaping Minds, Building Futures",
        header_color: "#14532D",
        design_type: "Vertical",
        show_staff_name: true,
        show_staff_id: true,
        show_designation: true,
        show_department: true,
        show_father_name: false,
        show_mother_name: false,
        show_joining_date: true,
        show_address: true,
        show_phone: true,
        show_dob: true,
        show_qr: true,
        description: "Lush green & olive vertical staff badge with circular photo, ribbon banner, and solid emerald footer band.",
        preview_bg: "linear-gradient(135deg, #14532d 0%, #15803d 100%)",
        badge_color: "bg-emerald-900 text-white",
    },
];

export function renderIdCardHtml(
    card: IdCardTemplate,
    person: IdCardPerson,
    type: "student" | "staff" = "student",
): string {
    const headerColor = card.header_color || "#4F46E5";
    const vertical = (card.design_type || "").toLowerCase() === "vertical";
    const titleLower = (card.title || "").toLowerCase();
    const sessionVal = person.session || "2024-25";

    const formatRoleBadge = () => {
        if (type === "staff") {
            return person.designation || "Staff Member";
        }
        if (!person.class) return "Student";
        const c = person.class.trim();
        return /^(class|grade|sec|std)\b/i.test(c) ? c : `Class ${c}`;
    };

    const studentRows: [boolean | undefined, string, string | undefined][] = [
        [card.show_admission_no, "Adm No", person.admission_no],
        [card.show_class, "Class", person.section ? `${person.class || ""} (${person.section})` : person.class],
        [card.show_roll_no, "Roll No", person.roll_no],
        [card.show_session !== false, "Session", sessionVal],
        [card.show_father_name, "Father", person.father_name],
        [card.show_mother_name, "Mother", person.mother_name],
        [card.show_dob, "DOB", person.dob],
        [card.show_blood_group, "Blood Group", person.blood_group],
        [card.show_house, "House", person.house],
        [card.show_phone, "Emergency", person.phone],
        [card.show_address, "Address", person.address],
    ];

    const staffRows: [boolean | undefined, string, string | undefined][] = [
        [card.show_staff_id, "Staff ID", person.staff_id],
        [card.show_designation, "Designation", person.designation],
        [card.show_department, "Department", person.department],
        [card.show_father_name, "Father", person.father_name],
        [card.show_mother_name, "Mother", person.mother_name],
        [card.show_joining_date, "Join Date", person.joining_date],
        [card.show_dob, "DOB", person.dob],
        [card.show_phone, "Emergency", person.phone],
        [card.show_address, "Address", person.address],
    ];

    const rows = (type === "staff" ? staffRows : studentRows).filter(([show, , val]) => show && val);

    const bg = card.background_image
        ? `background: url('${getImageUrl(card.background_image)}') center/cover no-repeat;`
        : "background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);";

    const identifierVal = type === "staff" ? (person.staff_id || "STAFF") : (person.admission_no || "STUDENT");
    const rawQrCode = person.qr_code || (type === "staff" ? (person.staff_id || person.name || "STAFF") : (person.admission_no || person.name || "STUDENT"));
    const qrPayload = JSON.stringify({ qr_code: rawQrCode });
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}&margin=1`;

    const signHtml = card.signature
        ? `<div style="text-align:right;"><img src="${getImageUrl(card.signature)}" alt="Signature" style="height:24px;max-width:70px;object-fit:contain;display:inline-block;margin-bottom:1px;" /><div style="width:55px;border-bottom:1px solid #cbd5e1;margin:1px 0 1px auto;"></div><div style="font-size:7.5px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Principal</div></div>`
        : `<div style="text-align:right;"><div style="font-size:11px;color:#0b2238;font-weight:bold;font-family:cursive;">&#9997; Shafi</div><div style="width:55px;border-bottom:1px solid #cbd5e1;margin:1px 0 1px auto;"></div><div style="font-size:7.5px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Principal</div></div>`;

    const generateBarcodeSvg = (value: string, height: number = 18, color: string = "#0f2942"): string => {
        const clean = (value || "10024").toString().trim();
        const bars: { width: number; space: number }[] = [];
        // Guard start bars
        bars.push({ width: 2, space: 1 }, { width: 1, space: 1.5 });
        for (let i = 0; i < clean.length; i++) {
            const code = clean.charCodeAt(i);
            const w1 = (code % 3) * 0.7 + 1;
            const s1 = ((code >> 1) % 2) * 0.7 + 1;
            const w2 = ((code >> 2) % 3) * 0.7 + 1;
            const s2 = ((code >> 3) % 2) * 0.7 + 1;
            const w3 = ((code >> 4) % 2) * 0.7 + 1;
            const s3 = ((code >> 5) % 2) * 0.7 + 1;
            bars.push({ width: w1, space: s1 }, { width: w2, space: s2 }, { width: w3, space: s3 });
        }
        // Guard stop bars
        bars.push({ width: 2, space: 1 }, { width: 3, space: 1 }, { width: 1.5, space: 0 });

        let currentX = 1;
        let rects = "";
        for (const b of bars) {
            rects += `<rect x="${currentX.toFixed(1)}" y="0" width="${b.width.toFixed(1)}" height="${height}" fill="${color}" />`;
            currentX += b.width + b.space;
        }
        const totalWidth = Math.ceil(currentX + 1);

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" width="100%" height="${height}" preserveAspectRatio="none" style="display:block;">${rects}</svg>`;
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // STYLE: Bright Future Golden Crest (Horizontal) — Inspired by Image 2
    // ─────────────────────────────────────────────────────────────────────────────
    if (!vertical && (titleLower.includes("crest") || titleLower.includes("bright future") || titleLower.includes("golden crest") || headerColor === "#0F2942")) {
        const logoHtml = card.logo
            ? `<img src="${getImageUrl(card.logo)}" alt="logo" style="height:32px;max-width:55px;object-fit:contain;" />`
            : `<div style="width:30px;height:30px;border-radius:50%;background:#f59e0b;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#0f2942;box-shadow:0 2px 6px rgba(0,0,0,0.3);">&#127891;</div>`;

        const photoHtml = person.photo
            ? `<img src="${getImageUrl(person.photo)}" alt="photo" style="width:80px;height:95px;object-fit:cover;border-radius:8px;border:2.5px solid #0f2942;box-shadow:0 3px 8px rgba(0,0,0,0.15);" />`
            : `<div style="width:80px;height:95px;background:#e2e8f0;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#0f2942;font-size:9px;font-weight:800;border:2.5px solid #0f2942;"><span style="font-size:18px;margin-bottom:2px;">&#128100;</span>NO PHOTO</div>`;

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 20px; display: flex; justify-content: center; background: #e2e8f0; }
    .card { width: 440px; min-height: 265px; background: #ffffff; border: 2px solid #0f2942; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15,41,66,0.2); display: flex; flex-direction: column; position: relative; }
    .top-notch-wrap { display: flex; justify-content: center; padding-top: 10px; margin-bottom: 8px; }
    .top-notch { height: 7.5px; width: 50px; background: #071524; border: 1.2px solid #f59e0b; border-radius: 6px; }
    .header { background: #0f2942; color: #fff; padding: 0 14px 8px; position: relative; border-bottom: 3px solid #f59e0b; }
    .header-content { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .school-info { flex: 1; text-align: left; }
    .school-title { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #ffffff; line-height: 1.15; }
    .school-motto { font-size: 7.5px; color: #f59e0b; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; margin-top: 1px; }
    .badge-sample { background: #f59e0b; color: #0f2942; font-size: 9px; font-weight: 900; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; }
    .body { padding: 8px 12px; display: flex; gap: 10px; flex: 1; align-items: stretch; }
    .photo-pane { display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .details-pane { flex: 1; font-size: 9px; }
    .details-table { width: 100%; border-collapse: collapse; }
    .details-table tr { border-bottom: 1px solid #f1f5f9; }
    .details-table td { padding: 1.8px 0; vertical-align: middle; }
    .label { width: 85px; color: #0f2942; font-weight: 800; font-size: 8px; text-transform: uppercase; letter-spacing: 0.2px; }
    .val { color: #1e293b; font-weight: 700; font-size: 9px; text-transform: uppercase; }
    .right-badges { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 0 4px; border-left: 1px dashed #cbd5e1; min-width: 75px; text-align: center; }
    .session-pill { background: #0f2942; color: #ffffff; font-size: 8px; font-weight: 900; padding: 3px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.3px; width: 100%; }
    .valid-tag { font-size: 7px; font-weight: 800; color: #64748b; text-transform: uppercase; line-height: 1.2; }
    .footer { padding: 4px 12px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .barcode-wrap { display: flex; flex-direction: column; align-items: center; width: 110px; }
    .barcode-sub { font-size: 7.5px; font-weight: 800; font-family: monospace; letter-spacing: 1.5px; color: #475569; margin-top: 1.5px; text-align: center; }
    .gold-bar { height: 4px; background: #f59e0b; width: 100%; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="top-notch-wrap"><div class="top-notch"></div></div>
      <div class="header-content">
        ${logoHtml}
        <div class="school-info">
          <div class="school-title">${card.school_name || "BRIGHT FUTURE PUBLIC SCHOOL"}</div>
          <div class="school-motto">${card.school_address || "DISCIPLINE • EDUCATION • EXCELLENCE"}</div>
        </div>
        <div class="badge-sample">${type === "staff" ? "FACULTY ID" : "STUDENT ID"}</div>
      </div>
    </div>
    <div class="body">
      <div class="photo-pane">
        ${photoHtml}
      </div>
      <div class="details-pane">
        ${type === "staff" ? `
          <table class="details-table">
            <tr><td class="label">NAME</td><td>: <b>${person.name || "N/A"}</b></td></tr>
            ${card.show_designation && person.designation ? `<tr><td class="label">DESIGNATION</td><td>: ${person.designation}</td></tr>` : ""}
            ${card.show_department && person.department ? `<tr><td class="label">DEPARTMENT</td><td>: ${person.department}</td></tr>` : ""}
            ${card.show_staff_id && person.staff_id ? `<tr><td class="label">STAFF ID</td><td>: ${person.staff_id}</td></tr>` : ""}
            ${card.show_joining_date && person.joining_date ? `<tr><td class="label">JOIN DATE</td><td>: ${person.joining_date}</td></tr>` : ""}
            ${card.show_phone && person.phone ? `<tr><td class="label">PHONE</td><td>: ${person.phone}</td></tr>` : ""}
            ${card.show_address && person.address ? `<tr><td class="label">ADDRESS</td><td>: ${person.address}</td></tr>` : ""}
          </table>
        ` : `
          <table class="details-table">
            <tr><td class="label">NAME</td><td>: <b>${person.name || "N/A"}</b></td></tr>
            ${card.show_father_name && person.father_name ? `<tr><td class="label">FATHER'S NAME</td><td>: ${person.father_name}</td></tr>` : ""}
            ${card.show_mother_name && person.mother_name ? `<tr><td class="label">MOTHER'S NAME</td><td>: ${person.mother_name}</td></tr>` : ""}
            ${card.show_dob && person.dob ? `<tr><td class="label">DATE OF BIRTH</td><td>: ${person.dob}</td></tr>` : ""}
            ${card.show_class && person.class ? `<tr><td class="label">CLASS</td><td>: ${person.class} ${person.section ? `(${person.section})` : ""}</td></tr>` : ""}
            ${card.show_roll_no && person.roll_no ? `<tr><td class="label">ROLL NO.</td><td>: ${person.roll_no}</td></tr>` : ""}
            ${card.show_admission_no && person.admission_no ? `<tr><td class="label">ADMISSION NO.</td><td>: ${person.admission_no}</td></tr>` : ""}
          </table>
        `}
      </div>
      <div class="right-badges">
        <div style="font-size:18px;line-height:1;">&#127979;</div>
        <div class="valid-tag">VALID UPTO<br><b>MARCH 2026</b></div>
        <div class="session-pill">${type === "staff" ? (person.department ? `DEPT<br>${person.department}` : `STAFF<br>ID`) : `SESSION<br>${sessionVal}`}</div>
      </div>
    </div>
    <div class="footer">
      <div class="barcode-wrap">
        <div style="width:100%;height:18px;display:flex;align-items:center;justify-content:center;">
          ${generateBarcodeSvg(identifierVal, 18, "#0f2942")}
        </div>
        <div class="barcode-sub">${identifierVal}</div>
      </div>
      ${card.show_qr ? `
        <img src="${qrCodeUrl}" alt="QR" style="width:30px;height:30px;object-fit:contain;" />
      ` : ""}
      ${signHtml}
    </div>
    <div class="gold-bar"></div>
  </div>
</body>
</html>`;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STYLE: Liberty Collegiate Maroon (Vertical) — Inspired by Image 3
    // ─────────────────────────────────────────────────────────────────────────────
    if (vertical && (titleLower.includes("liberty") || titleLower.includes("maroon") || titleLower.includes("collegiate") || headerColor === "#7F1D1D")) {
        const logoHtml = card.logo
            ? `<img src="${getImageUrl(card.logo)}" alt="logo" style="height:32px;max-width:55px;object-fit:contain;" />`
            : `<div style="width:28px;height:28px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#7f1d1d;border:2px solid #7f1d1d;">&#127795;</div>`;

        const photoHtml = person.photo
            ? `<img src="${getImageUrl(person.photo)}" alt="photo" style="width:78px;height:92px;object-fit:cover;border-radius:10px;border:3px solid #0f2942;box-shadow:0 4px 10px rgba(0,0,0,0.15);" />`
            : `<div style="width:78px;height:92px;background:#f1f5f9;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#0f2942;font-size:9px;font-weight:800;border:3px solid #0f2942;"><span style="font-size:16px;margin-bottom:2px;">&#128100;</span>NO PHOTO</div>`;

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 20px; display: flex; justify-content: center; background: #f8fafc; }
    .card { width: 285px; min-height: 455px; background: #ffffff; border: 1.5px solid #7f1d1d; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 28px rgba(127,29,29,0.2); display: flex; flex-direction: column; position: relative; }
    .top-notch-wrap { display: flex; justify-content: center; padding-top: 12px; margin-bottom: 8px; }
    .top-notch { height: 7.5px; width: 46px; background: #450a0a; border: 1.5px solid #fecaca; border-radius: 6px; }
    .header { background: radial-gradient(circle at 50% -20%, #7f1d1d 0%, #450a0a 100%); color: #fff; padding: 0 12px 32px; text-align: center; position: relative; border-radius: 0 0 50% 50% / 15px; }
    .header-logo { display: flex; justify-content: center; margin-top: 2px; margin-bottom: 3px; }
    .school-title { font-size: 13px; font-weight: 900; font-family: 'Times New Roman', Georgia, serif; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; color: #ffffff; }
    .school-sub { font-size: 7.5px; color: #fecaca; margin-top: 1px; letter-spacing: 0.5px; text-transform: uppercase; font-weight: 600; }
    .photo-wrap { margin-top: -24px; display: flex; justify-content: center; position: relative; z-index: 10; }
    .side-ribbon { position: absolute; left: 6px; top: 120px; writing-mode: vertical-rl; transform: rotate(180deg); font-size: 8px; font-weight: 900; letter-spacing: 1.5px; color: #7f1d1d; opacity: 0.8; text-transform: uppercase; }
    .name-banner { text-align: center; margin-top: 5px; padding: 0 10px; }
    .person-name { font-size: 13.5px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.4px; line-height: 1.2; }
    .role-badge { display: inline-block; background: #7f1d1d; color: #ffffff; font-size: 8.5px; font-weight: 800; padding: 2px 12px; border-radius: 12px; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
    .body { padding: 6px 14px 4px 24px; flex: 1; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    .details-table tr { border-bottom: 1px solid #f1f5f9; }
    .details-table td { padding: 2.5px 0; vertical-align: middle; }
    .label { width: 85px; color: #475569; font-weight: 700; font-size: 8.5px; text-transform: uppercase; }
    .val { color: #0f172a; font-weight: 800; text-align: right; }
    .footer { padding: 6px 12px; background: #0f172a; color: #fff; display: flex; justify-content: space-between; align-items: center; border-radius: 12px 12px 0 0; margin-top: 4px; }
    .footer-text { font-size: 7px; color: #cbd5e1; line-height: 1.3; }
  </style>
</head>
<body>
  <div class="card">
    <div class="side-ribbon">${type === "staff" ? "FACULTY ID CARD" : "STUDENT ID CARD"}</div>
    <div class="header">
      <div class="top-notch-wrap"><div class="top-notch"></div></div>
      <div class="header-logo">${logoHtml}</div>
      <div class="school-title">${card.school_name || "LIBERTY SS / COLLEGE"}</div>
      ${card.school_address ? `<div class="school-sub">${card.school_address}</div>` : ""}
    </div>
    <div class="photo-wrap">
      ${photoHtml}
    </div>
    <div class="name-banner">
      <div class="person-name">${person.name || "N/A"}</div>
      <span class="role-badge">${formatRoleBadge()}</span>
    </div>
    <div class="body">
      ${type === "staff" ? `
        <table class="details-table">
          ${card.show_designation && person.designation ? `<tr><td class="label">&#127891; Designation</td><td class="val">${person.designation}</td></tr>` : ""}
          ${card.show_department && person.department ? `<tr><td class="label">&#127970; Department</td><td class="val">${person.department}</td></tr>` : ""}
          ${card.show_staff_id && person.staff_id ? `<tr><td class="label">&#127380; Staff ID</td><td class="val">${person.staff_id}</td></tr>` : ""}
          ${card.show_joining_date && person.joining_date ? `<tr><td class="label">&#128197; Joined</td><td class="val">${person.joining_date}</td></tr>` : ""}
          ${card.show_phone && person.phone ? `<tr><td class="label">&#128222; Contact No.</td><td class="val">${person.phone}</td></tr>` : ""}
          ${card.show_address && person.address ? `<tr><td class="label">&#128205; Address</td><td class="val">${person.address}</td></tr>` : ""}
        </table>
      ` : `
        <table class="details-table">
          <tr><td class="label">&#128197; Session</td><td class="val">${sessionVal}</td></tr>
          ${card.show_admission_no && person.admission_no ? `<tr><td class="label">&#127380; ID No.</td><td class="val">${person.admission_no}</td></tr>` : ""}
          ${card.show_roll_no && person.roll_no ? `<tr><td class="label">&#128220; Roll No</td><td class="val">${person.roll_no}</td></tr>` : ""}
          ${card.show_phone && person.phone ? `<tr><td class="label">&#128222; Contact No.</td><td class="val">${person.phone}</td></tr>` : ""}
          ${card.show_dob && person.dob ? `<tr><td class="label">&#127874; DOB</td><td class="val">${person.dob}</td></tr>` : ""}
          ${card.show_address && person.address ? `<tr><td class="label">&#128205; Address</td><td class="val">${person.address}</td></tr>` : ""}
        </table>
      `}
    </div>
    <div style="padding:0 12px 2px;display:flex;justify-content:flex-end;">
      ${signHtml}
    </div>
    <div class="footer">
      <div class="footer-text">
        <div>&#128222; ${person.phone || "9800000000"}</div>
        <div>&#9993; info@libertysscollege.edu</div>
      </div>
      ${card.show_qr ? `
        <img src="${qrCodeUrl}" alt="QR" style="width:28px;height:28px;object-fit:contain;background:#fff;border-radius:2px;padding:1px;" />
      ` : ""}
    </div>
  </div>
</body>
</html>`;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STYLE: Royal Blue & Gold Circle (Vertical) — Inspired by Image 4
    // ─────────────────────────────────────────────────────────────────────────────
    if (vertical && (titleLower.includes("circle") || titleLower.includes("royal blue") || headerColor === "#0B2545")) {
        const logoHtml = card.logo
            ? `<img src="${getImageUrl(card.logo)}" alt="logo" style="height:28px;max-width:55px;object-fit:contain;" />`
            : `<div style="width:26px;height:26px;border-radius:50%;background:#f59e0b;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:#0b2545;border:1.5px solid #fff;">&#127891;</div>`;

        const photoHtml = person.photo
            ? `<img src="${getImageUrl(person.photo)}" alt="photo" style="width:84px;height:84px;object-fit:cover;border-radius:50%;border:3.5px solid #0b2545;outline:2.5px solid #f59e0b;box-shadow:0 4px 12px rgba(0,0,0,0.2);" />`
            : `<div style="width:84px;height:84px;background:#e2e8f0;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#0b2545;font-size:8.5px;font-weight:800;border:3.5px solid #0b2545;outline:2.5px solid #f59e0b;"><span style="font-size:18px;">&#128100;</span>NO PHOTO</div>`;

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 20px; display: flex; justify-content: center; background: #e2e8f0; }
    .card { width: 285px; min-height: 460px; background: #ffffff; border: 2px solid #0b2545; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(11,37,69,0.25); display: flex; flex-direction: column; position: relative; }
    .top-notch-wrap { display: flex; justify-content: center; padding-top: 12px; margin-bottom: 8px; }
    .top-notch { height: 7.5px; width: 46px; background: #051329; border: 1.5px solid #f59e0b; border-radius: 6px; }
    .header { background: linear-gradient(135deg, #0b2545 0%, #134074 100%); color: #fff; padding: 0 12px 36px; text-align: center; position: relative; border-bottom: 3.5px solid #f59e0b; }
    .header-logo { display: flex; justify-content: center; margin-top: 2px; margin-bottom: 3px; }
    .school-title { font-size: 11.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.6px; line-height: 1.2; color: #ffffff; }
    .school-sub { font-size: 7.5px; color: #fde68a; margin-top: 1px; letter-spacing: 0.8px; text-transform: uppercase; font-weight: 700; }
    .photo-wrap { margin-top: -30px; display: flex; justify-content: center; position: relative; z-index: 10; }
    .ribbon-banner { display: inline-block; background: #0b2545; color: #ffffff; font-size: 8px; font-weight: 900; padding: 2px 14px; border-radius: 2px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .name-banner { text-align: center; margin-top: 4px; padding: 0 10px; }
    .person-name { font-size: 14px; font-weight: 900; color: #0b2545; text-transform: uppercase; letter-spacing: 0.4px; }
    .body { padding: 6px 14px; flex: 1; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 9px; }
    .details-table tr { border-bottom: 1px solid #f1f5f9; }
    .details-table td { padding: 2.2px 0; vertical-align: middle; }
    .label { width: 90px; color: #0b2545; font-weight: 800; font-size: 8px; text-transform: uppercase; }
    .val { color: #1e293b; font-weight: 700; text-align: left; }
    .barcode-band { text-align: center; font-family: monospace; font-size: 10px; font-weight: 900; letter-spacing: 2px; color: #0b2545; padding: 2px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    .footer { padding: 4px 12px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; }
    .session-badge { background: #f59e0b; color: #0b2545; font-size: 8px; font-weight: 900; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="top-notch-wrap"><div class="top-notch"></div></div>
      <div class="header-logo">${logoHtml}</div>
      <div class="school-title">${card.school_name || "BRIGHT FUTURE INTERNATIONAL SCHOOL"}</div>
      ${card.school_address ? `<div class="school-sub">${card.school_address}</div>` : ""}
    </div>
    <div class="photo-wrap">
      ${photoHtml}
    </div>
    <div class="name-banner">
      <div class="ribbon-banner">${type === "staff" ? "STAFF / FACULTY" : "STUDENT"}</div>
      <div class="person-name">${person.name || "N/A"}</div>
    </div>
    <div class="body">
      ${type === "staff" ? `
        <table class="details-table">
          ${card.show_designation && person.designation ? `<tr><td class="label">💼 Designation</td><td>: ${person.designation}</td></tr>` : ""}
          ${card.show_department && person.department ? `<tr><td class="label">🏢 Department</td><td>: ${person.department}</td></tr>` : ""}
          ${card.show_staff_id && person.staff_id ? `<tr><td class="label">🆔 Staff ID</td><td>: ${person.staff_id}</td></tr>` : ""}
          ${card.show_joining_date && person.joining_date ? `<tr><td class="label">📅 Joining Date</td><td>: ${person.joining_date}</td></tr>` : ""}
          ${card.show_phone && person.phone ? `<tr><td class="label">📞 Mobile No.</td><td>: ${person.phone}</td></tr>` : ""}
          ${card.show_address && person.address ? `<tr><td class="label">🏠 Address</td><td>: ${person.address}</td></tr>` : ""}
        </table>
      ` : `
        <table class="details-table">
          <tr><td class="label">📅 Session</td><td>: <b>${sessionVal}</b></td></tr>
          ${card.show_father_name && person.father_name ? `<tr><td class="label">👤 Father's Name</td><td>: ${person.father_name}</td></tr>` : ""}
          ${card.show_dob && person.dob ? `<tr><td class="label">🎂 Date of Birth</td><td>: ${person.dob}</td></tr>` : ""}
          ${card.show_class && person.class ? `<tr><td class="label">🎓 Class / Grade</td><td>: ${person.class} ${person.section ? `(${person.section})` : ""}</td></tr>` : ""}
          ${card.show_roll_no && person.roll_no ? `<tr><td class="label">🏷️ Roll No.</td><td>: ${person.roll_no}</td></tr>` : ""}
          ${card.show_admission_no && person.admission_no ? `<tr><td class="label">🆔 Admission No.</td><td>: ${person.admission_no}</td></tr>` : ""}
          ${card.show_address && person.address ? `<tr><td class="label">🏠 Address</td><td>: ${person.address}</td></tr>` : ""}
        </table>
      `}
    </div>
    <div class="barcode-band" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 0;background:#ffffff;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
      <div style="width:140px;height:18px;display:flex;align-items:center;justify-content:center;">
        ${generateBarcodeSvg(identifierVal, 18, "#0b2545")}
      </div>
      <div style="font-family:monospace;font-size:7.5px;font-weight:800;letter-spacing:1.5px;color:#64748b;margin-top:1.5px;text-align:center;">${identifierVal}</div>
    </div>
    <div class="footer">
      <div class="session-badge">${type === "staff" ? (person.department || "STAFF ID") : `SESSION ${sessionVal}`}</div>
      ${card.show_qr ? `
        <img src="${qrCodeUrl}" alt="QR" style="width:26px;height:26px;object-fit:contain;" />
      ` : ""}
      ${signHtml}
    </div>
  </div>
</body>
</html>`;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STYLE: Little Flower Vibrant Curved (Vertical) — Inspired by Image 5
    // ─────────────────────────────────────────────────────────────────────────────
    if (vertical && (titleLower.includes("flower") || titleLower.includes("protiva") || titleLower.includes("curved") || headerColor === "#4C1D95")) {
        const logoHtml = card.logo
            ? `<img src="${getImageUrl(card.logo)}" alt="logo" style="height:32px;max-width:55px;object-fit:contain;" />`
            : `<div style="width:30px;height:30px;border-radius:50%;background:#15803d;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#fff;border:2px solid #ea580c;">&#9881;</div>`;

        const photoHtml = person.photo
            ? `<img src="${getImageUrl(person.photo)}" alt="photo" style="width:78px;height:90px;object-fit:cover;border-radius:12px;border:3.5px solid #ea580c;box-shadow:0 4px 10px rgba(0,0,0,0.15);" />`
            : `<div style="width:78px;height:90px;background:#fdf4ff;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#4c1d95;font-size:9px;font-weight:800;border:3.5px solid #ea580c;"><span style="font-size:16px;margin-bottom:2px;">&#128100;</span>NO PHOTO</div>`;

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 20px; display: flex; justify-content: center; background: #faf5ff; }
    .card { width: 285px; min-height: 460px; background: #ffffff; border: 2px solid #4c1d95; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 28px rgba(76,29,149,0.2); display: flex; flex-direction: column; position: relative; }
    .top-notch-wrap { display: flex; justify-content: center; padding-top: 12px; margin-bottom: 8px; }
    .top-notch { height: 7.5px; width: 46px; background: #2e1065; border: 1.5px solid #fde047; border-radius: 6px; }
    .header { background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%); color: #fff; padding: 0 10px 24px; text-align: center; position: relative; border-bottom: 4px solid #ea580c; }
    .header-logo { display: flex; justify-content: center; margin-top: 2px; margin-bottom: 3px; }
    .school-title { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.6px; color: #fde047; line-height: 1.2; }
    .school-sub { font-size: 7.5px; color: #ffffff; margin-top: 1px; font-style: italic; }
    .photo-wrap { margin-top: -18px; display: flex; justify-content: center; position: relative; z-index: 10; }
    .badge-id { display: inline-block; background: #4c1d95; color: #ffffff; font-size: 9px; font-weight: 900; padding: 2px 14px; border-radius: 10px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #ea580c; }
    .body { padding: 8px 16px 4px; flex: 1; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    .details-table tr { border-bottom: 1px solid #f3e8ff; }
    .details-table td { padding: 2.2px 0; vertical-align: middle; }
    .label { width: 85px; color: #000000; font-weight: 800; font-size: 9px; }
    .val { color: #000000; font-weight: 700; font-size: 9.5px; }
    .footer { padding: 6px 14px 8px; background: #ea580c; color: #fff; display: flex; justify-content: space-between; align-items: center; border-radius: 16px 16px 0 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="top-notch-wrap"><div class="top-notch"></div></div>
      <div class="header-logo">${logoHtml}</div>
      <div class="school-title">${card.school_name || "PROTIVA LITTLE FLOWER ACADEMY"}</div>
      ${card.school_address ? `<div class="school-sub">"${card.school_address}"</div>` : ""}
    </div>
    <div class="photo-wrap">
      ${photoHtml}
    </div>
    <div style="text-align:center;">
      <span class="badge-id">${type === "staff" ? "STAFF ID" : "ID CARD"}</span>
    </div>
    <div class="body">
      ${type === "staff" ? `
        <table class="details-table">
          <tr><td class="label">Name</td><td>: <b>${person.name || "N/A"}</b></td></tr>
          ${card.show_designation && person.designation ? `<tr><td class="label">Designation</td><td>: ${person.designation}</td></tr>` : ""}
          ${card.show_department && person.department ? `<tr><td class="label">Department</td><td>: ${person.department}</td></tr>` : ""}
          ${card.show_staff_id && person.staff_id ? `<tr><td class="label">Staff ID</td><td>: ${person.staff_id}</td></tr>` : ""}
          ${card.show_joining_date && person.joining_date ? `<tr><td class="label">Joining Date</td><td>: ${person.joining_date}</td></tr>` : ""}
          ${card.show_phone && person.phone ? `<tr><td class="label">Mobile</td><td>: ${person.phone}</td></tr>` : ""}
          ${card.show_address && person.address ? `<tr><td class="label">Address</td><td>: ${person.address}</td></tr>` : ""}
        </table>
      ` : `
        <table class="details-table">
          <tr><td class="label">Name</td><td>: <b>${person.name || "N/A"}</b></td></tr>
          ${card.show_class && person.class ? `<tr><td class="label">Class</td><td>: ${person.class} ${person.section ? `(${person.section})` : ""}</td></tr>` : ""}
          ${card.show_roll_no && person.roll_no ? `<tr><td class="label">Roll</td><td>: ${person.roll_no}</td></tr>` : ""}
          <tr><td class="label">Session</td><td>: <b>${sessionVal}</b></td></tr>
          ${card.show_dob && person.dob ? `<tr><td class="label">Date Of Birth</td><td>: ${person.dob}</td></tr>` : ""}
          ${card.show_blood_group && person.blood_group ? `<tr><td class="label">Blood Group</td><td>: ${person.blood_group}</td></tr>` : ""}
          ${card.show_phone && person.phone ? `<tr><td class="label">Mobile</td><td>: ${person.phone}</td></tr>` : ""}
        </table>
      `}
    </div>
    <div style="padding:0 14px 2px;display:flex;justify-content:flex-end;">
      ${signHtml}
    </div>
    <div class="footer">
      <div style="font-size:8px;font-weight:800;letter-spacing:0.5px;">PROTIVA ACADEMY</div>
      ${card.show_qr ? `
        <img src="${qrCodeUrl}" alt="QR" style="width:24px;height:24px;object-fit:contain;background:#fff;border-radius:2px;" />
      ` : ""}
    </div>
  </div>
</body>
</html>`;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STYLE: Bright Future Modern Wave (Vertical) — Inspired by Sample Image 1
    // ─────────────────────────────────────────────────────────────────────────────
    if (vertical && (titleLower.includes("wave") || (titleLower.includes("bright future") && !titleLower.includes("circle")))) {
        const logoHtml = card.logo
            ? `<img src="${getImageUrl(card.logo)}" alt="logo" style="height:32px;max-width:55px;object-fit:contain;" />`
            : `<div style="width:30px;height:30px;border-radius:50%;background:#f59e0b;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#0b2238;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:1.5px solid #fff;">&#127891;</div>`;

        const photoHtml = person.photo
            ? `<img src="${getImageUrl(person.photo)}" alt="photo" style="width:100%;height:100%;object-fit:cover;" />`
            : `<div style="width:100%;height:100%;background:#f1f5f9;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#0b2238;font-size:9px;font-weight:800;"><span style="font-size:18px;margin-bottom:2px;">&#128100;</span>NO PHOTO</div>`;

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 20px; display: flex; justify-content: center; background: #e2e8f0; }
    .card { width: 285px; min-height: 460px; background: #ffffff; border: 2px solid #0b2238; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 28px rgba(11,34,56,0.25); display: flex; flex-direction: column; position: relative; }
    /* Micro-mesh geometric background texture */
    .card-bg-texture { position: absolute; inset: 0; background-image: radial-gradient(rgba(11,34,56,0.04) 1px, transparent 1px); background-size: 8px 8px; pointer-events: none; z-index: 1; }
    /* Vector swoosh background texture */
    .card-vector-bg { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
    .header { background: #0b2238; color: #ffffff; padding: 0 10px 0; text-align: center; position: relative; z-index: 5; }
    .top-notch-wrap { display: flex; justify-content: center; padding-top: 12px; margin-bottom: 8px; }
    .top-notch { height: 7.5px; width: 46px; background: #040c14; border: 1.5px solid #f59e0b; border-radius: 6px; }
    .header-content { display: flex; align-items: center; justify-content: flex-start; gap: 8px; padding: 2px 4px 8px; }
    .header-titles { text-align: left; flex: 1; min-width: 0; }
    .school-title { font-size: 13px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; text-transform: uppercase; line-height: 1.15; }
    .school-sub-title { font-size: 9.5px; font-weight: 900; color: #f59e0b; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 1px; }
    .school-motto { font-size: 7px; color: #93c5fd; letter-spacing: 0.3px; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
    .wave-box { width: 100%; height: 18px; margin-top: -1px; line-height: 0; position: relative; z-index: 5; }
    .content-wrap { position: relative; z-index: 5; display: flex; flex-direction: column; flex: 1; }
    .photo-row { display: flex; align-items: flex-start; justify-content: space-between; padding: 8px 16px 2px; gap: 14px; }
    .photo-wrap { width: 90px; height: 105px; border-radius: 12px; border: 2.5px solid #0b2238; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.12); flex-shrink: 0; background: #f8fafc; position: relative; z-index: 6; }
    .session-qr-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 4px; position: relative; z-index: 6; }
    .session-head { font-size: 8.5px; font-weight: 900; color: #1e3a8a; letter-spacing: 0.8px; text-transform: uppercase; }
    .session-year { font-size: 11px; font-weight: 900; color: #0f172a; margin-top: 1px; }
    .qr-img { width: 48px; height: 48px; object-fit: contain; margin-top: 6px; border-radius: 4px; background: #fff; padding: 1px; }
    .name-banner { text-align: center; padding: 2px 12px; margin-top: 2px; }
    .person-name { font-size: 15px; font-weight: 900; color: #0b2238; text-transform: uppercase; letter-spacing: 0.4px; line-height: 1.2; }
    .class-subline { font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 1px; }
    .body { padding: 4px 16px; flex: 1; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    .details-table td { padding: 2px 0; vertical-align: top; }
    .label { width: 84px; color: #1e293b; font-weight: 800; font-size: 8.5px; white-space: nowrap; }
    .colon { width: 10px; color: #0f172a; font-weight: 800; text-align: center; }
    .val { color: #0f172a; font-weight: 700; font-size: 9px; }
    .footer { padding: 4px 16px 6px; display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 6; }
    .sign-box { text-align: left; }
    .id-badge { background: linear-gradient(135deg, #0b2238 0%, #1e3a8a 100%); color: #fff; padding: 4px 12px; border-radius: 14px 4px 14px 4px; border: 1.5px solid #38bdf8; text-align: center; box-shadow: 0 2px 6px rgba(11,34,56,0.25); position: relative; z-index: 7; }
    .id-badge-lbl { font-size: 7.5px; font-weight: 800; color: #93c5fd; text-transform: uppercase; letter-spacing: 0.5px; }
    .id-badge-val { font-size: 10px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-bg-texture"></div>
    <div class="card-vector-bg">
      <svg viewBox="0 0 285 460" preserveAspectRatio="none" style="width:100%;height:100%;display:block;">
        <!-- Translucent sky blue curved ribbon textures behind left photo -->
        <path d="M-20,70 Q60,120 20,240 T-30,340 Z" fill="#93c5fd" opacity="0.22"/>
        <path d="M-10,90 Q80,140 40,220 T-10,310 Z" fill="#38bdf8" opacity="0.12"/>
        <!-- Soft diagonal watermark background arcs -->
        <circle cx="142" cy="230" r="130" fill="none" stroke="#e0f2fe" stroke-width="1.5" opacity="0.6"/>
        <circle cx="142" cy="230" r="170" fill="none" stroke="#e0f2fe" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>
        <!-- Sweeping wave swoosh at bottom right -->
        <path d="M120,460 Q200,430 285,410 L285,460 Z" fill="#38bdf8" opacity="0.25"/>
        <path d="M150,460 Q220,440 285,425 L285,460 Z" fill="#0b2238" opacity="0.15"/>
      </svg>
    </div>
    <div class="header">
      <div class="top-notch-wrap"><div class="top-notch"></div></div>
      <div class="header-content">
        ${logoHtml}
        <div class="header-titles">
          <div class="school-title">${card.school_name || "BRIGHT FUTURE"}</div>
          <div class="school-sub-title">PUBLIC SCHOOL</div>
          <div class="school-motto">${card.school_address || "Knowledge Today, Success Tomorrow"}</div>
        </div>
      </div>
    </div>
    <div class="wave-box">
      <svg viewBox="0 0 285 18" preserveAspectRatio="none" style="width:100%;height:18px;display:block;">
        <path d="M0,0 Q70,18 140,8 T285,6 L285,18 L0,18 Z" fill="#93c5fd" opacity="0.6"/>
        <path d="M0,0 Q80,14 160,4 T285,8 L285,18 L0,18 Z" fill="#f59e0b"/>
        <path d="M0,10 Q90,18 170,8 T285,12 L285,18 L0,18 Z" fill="#ffffff"/>
      </svg>
    </div>
    <div class="content-wrap">
      <div class="photo-row">
        <div class="photo-wrap">
          ${photoHtml}
        </div>
        <div class="session-qr-col">
          <div class="session-head">SESSION</div>
          <div class="session-year">${sessionVal}</div>
          ${card.show_qr ? `<img src="${qrCodeUrl}" alt="QR" class="qr-img" />` : ""}
        </div>
      </div>
      <div class="name-banner">
        <div class="person-name">${person.name || "AARAV SHARMA"}</div>
        <div class="class-subline">${type === "staff" ? `Designation : <b>${person.designation || "Faculty"}</b>` : `Class : <b>${person.class || "7th"} ${person.section ? `(${person.section})` : "(B)"}</b>`}</div>
      </div>
      <div class="body">
        ${type === "staff" ? `
          <table class="details-table">
            ${card.show_father_name && person.father_name ? `<tr><td class="label">Father's Name</td><td class="colon">:</td><td class="val">${person.father_name}</td></tr>` : ""}
            ${card.show_department && person.department ? `<tr><td class="label">Department</td><td class="colon">:</td><td class="val">${person.department}</td></tr>` : ""}
            ${card.show_dob && person.dob ? `<tr><td class="label">Date of Birth</td><td class="colon">:</td><td class="val">${person.dob}</td></tr>` : ""}
            ${card.show_joining_date && person.joining_date ? `<tr><td class="label">Joining Date</td><td class="colon">:</td><td class="val">${person.joining_date}</td></tr>` : ""}
            ${card.show_phone && person.phone ? `<tr><td class="label">Mobile</td><td class="colon">:</td><td class="val">${person.phone}</td></tr>` : ""}
            ${card.show_address && person.address ? `<tr><td class="label">Address</td><td class="colon">:</td><td class="val">${person.address}</td></tr>` : ""}
          </table>
        ` : `
          <table class="details-table">
            ${card.show_father_name && person.father_name ? `<tr><td class="label">Father's Name</td><td class="colon">:</td><td class="val">${person.father_name}</td></tr>` : ""}
            ${card.show_mother_name && person.mother_name ? `<tr><td class="label">Mother's Name</td><td class="colon">:</td><td class="val">${person.mother_name}</td></tr>` : ""}
            ${card.show_dob && person.dob ? `<tr><td class="label">Date of Birth</td><td class="colon">:</td><td class="val">${person.dob}</td></tr>` : ""}
            ${card.show_blood_group && person.blood_group ? `<tr><td class="label">Blood Group</td><td class="colon">:</td><td class="val">${person.blood_group}</td></tr>` : ""}
            ${card.show_address && person.address ? `<tr><td class="label">Address</td><td class="colon">:</td><td class="val">${person.address}</td></tr>` : ""}
          </table>
        `}
      </div>
      <div class="footer">
        <div class="sign-box">
          ${card.signature
            ? `<img src="${getImageUrl(card.signature)}" alt="Signature" style="height:24px;max-width:65px;object-fit:contain;display:block;margin-bottom:1px;" />`
            : `<div style="font-size:11px;color:#0b2238;font-weight:bold;font-family:cursive;">&#9997; Shafi</div>`}
          <div style="border-top:1px solid #cbd5e1;width:55px;margin-top:1px;"></div>
          <div style="font-size:7.5px;font-weight:800;color:#64748b;text-transform:uppercase;">Principal</div>
        </div>
        <div class="id-badge">
          <div class="id-badge-lbl">ID No.</div>
          <div class="id-badge-val">${identifierVal.includes("STUDENT") ? "BFPS/25/0789" : identifierVal}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STYLE: Green Field International Crest (Vertical) — Inspired by Sample Image 2
    // ─────────────────────────────────────────────────────────────────────────────
    if (vertical && (titleLower.includes("green field") || titleLower.includes("greenfield") || titleLower.includes("international crest") || titleLower.includes("green") || headerColor === "#14532D")) {
        const logoHtml = card.logo
            ? `<img src="${getImageUrl(card.logo)}" alt="logo" style="height:32px;max-width:55px;object-fit:contain;" />`
            : `<div style="width:30px;height:30px;border-radius:50%;background:#14532d;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:#86efac;border:1.5px solid #86efac;">&#127891;</div>`;

        const photoHtml = person.photo
            ? `<img src="${getImageUrl(person.photo)}" alt="photo" style="width:100%;height:100%;object-fit:cover;" />`
            : `<div style="width:100%;height:100%;background:#f0fdf4;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#14532d;font-size:9px;font-weight:800;"><span style="font-size:18px;margin-bottom:2px;">&#128100;</span>NO PHOTO</div>`;

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 20px; display: flex; justify-content: center; background: #ecfdf5; }
    .card { width: 285px; min-height: 460px; background: #ffffff; border: 2px solid #14532d; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 28px rgba(20,83,45,0.22); display: flex; flex-direction: column; position: relative; }
    /* Leaf & security dot texture */
    .card-bg-texture { position: absolute; inset: 0; background-image: radial-gradient(rgba(20,83,45,0.035) 1px, transparent 1px); background-size: 9px 9px; pointer-events: none; z-index: 1; }
    /* Dual sweeping curved arcs vector background layer */
    .card-arcs-bg { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
    .top-notch-wrap { display: flex; justify-content: center; padding-top: 12px; margin-bottom: 8px; position: relative; z-index: 5; }
    .top-notch { height: 7.5px; width: 46px; background: #062413; border: 1.5px solid #86efac; border-radius: 6px; }
    .header { padding: 0 10px 6px; position: relative; text-align: center; z-index: 5; }
    .header-content { display: flex; align-items: center; justify-content: flex-start; gap: 8px; padding: 0 4px; }
    .school-info { text-align: left; flex: 1; }
    .school-title { font-size: 14px; font-weight: 900; color: #14532d; letter-spacing: 0.5px; line-height: 1.15; }
    .school-sub { font-size: 9px; font-weight: 900; color: #1f2937; letter-spacing: 0.6px; text-transform: uppercase; margin-top: 1px; }
    .school-motto { font-size: 7.5px; font-weight: 600; color: #4b5563; margin-top: 1px; font-style: italic; }
    .content-wrap { position: relative; z-index: 5; display: flex; flex-direction: column; flex: 1; }
    .photo-wrap { width: 92px; height: 92px; border-radius: 50%; border: 3.5px solid #15803d; outline: 2.5px solid #86efac; margin: 4px auto 0; overflow: hidden; box-shadow: 0 4px 12px rgba(21,128,61,0.25); background: #f0fdf4; display: flex; align-items: center; justify-content: center; position: relative; z-index: 6; }
    .ribbon-wrap { display: flex; align-items: center; justify-content: center; margin-top: 6px; position: relative; z-index: 6; }
    .ribbon-main { background: linear-gradient(135deg, #15803d 0%, #16a34a 100%); color: #ffffff; font-size: 12.5px; font-weight: 900; padding: 3px 18px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.6px; box-shadow: 0 2px 5px rgba(21,128,61,0.3); border: 1px solid #86efac; }
    .class-subline { text-align: center; font-size: 11px; font-weight: 800; color: #14532d; margin-top: 3px; }
    .body { padding: 6px 14px 2px; flex: 1; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    .details-table td { padding: 2px 0; vertical-align: top; }
    .icon-td { width: 16px; font-size: 10px; color: #15803d; text-align: left; }
    .label { width: 80px; color: #1e293b; font-weight: 800; font-size: 8.5px; white-space: nowrap; }
    .colon { width: 8px; color: #0f172a; font-weight: 800; text-align: center; }
    .val { color: #0f172a; font-weight: 700; font-size: 9px; }
    .bottom-row { display: flex; align-items: center; justify-content: space-between; padding: 4px 14px 6px; position: relative; z-index: 6; }
    .session-block { text-align: left; }
    .session-lbl { font-size: 8px; font-weight: 900; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; }
    .session-num { font-size: 10.5px; font-weight: 900; color: #0f172a; }
    .qr-center { display: flex; align-items: center; justify-content: center; }
    .qr-img { width: 40px; height: 40px; object-fit: contain; background: #fff; padding: 1px; border-radius: 3px; }
    .sign-block { text-align: right; }
    .footer-bar { background: #14532d; color: #ffffff; text-align: center; font-size: 9.5px; font-weight: 900; letter-spacing: 0.8px; padding: 4px 0; text-transform: uppercase; position: relative; z-index: 6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-bg-texture"></div>
    <div class="card-arcs-bg">
      <svg viewBox="0 0 285 460" preserveAspectRatio="none" style="width:100%;height:100%;display:block;">
        <!-- Symmetrical Sweeping Dual Green Arcs framing photo as in sample -->
        <!-- Outer Left Arch -->
        <path d="M-40,110 Q40,130 50,180 T-20,240 Z" fill="#15803d" opacity="0.85"/>
        <!-- Inner Left Arch -->
        <path d="M-25,125 Q55,145 65,185 T-10,230 Z" fill="#65a30d" opacity="0.9"/>
        <!-- Outer Right Arch -->
        <path d="M325,110 Q245,130 235,180 T305,240 Z" fill="#15803d" opacity="0.85"/>
        <!-- Inner Right Arch -->
        <path d="M310,125 Q230,145 220,185 T295,230 Z" fill="#65a30d" opacity="0.9"/>
        <!-- Concentric Watermark Rings behind circular photo -->
        <circle cx="142" cy="115" r="58" fill="none" stroke="#86efac" stroke-width="1.5" opacity="0.4"/>
        <circle cx="142" cy="115" r="70" fill="none" stroke="#15803d" stroke-width="1" stroke-dasharray="3 3" opacity="0.25"/>
      </svg>
    </div>
    <div class="top-notch-wrap"><div class="top-notch"></div></div>
    <div class="header">
      <div class="header-content">
        ${logoHtml}
        <div class="school-info">
          <div class="school-title">${card.school_name || "GREEN FIELD"}</div>
          <div class="school-sub">INTERNATIONAL SCHOOL</div>
          <div class="school-motto">${card.school_address || "Shaping Minds, Building Futures"}</div>
        </div>
      </div>
    </div>
    <div class="content-wrap">
      <div class="photo-wrap">
        ${photoHtml}
      </div>
      <div class="ribbon-wrap">
        <div class="ribbon-main">${person.name || "ANANYA VERMA"}</div>
      </div>
      <div class="class-subline">
        ${type === "staff" ? `Designation : <b>${person.designation || "Teacher"}</b>` : `Class : <b>${person.class || "6th"} ${person.section ? `(${person.section})` : "(A)"}</b>`}
      </div>
      <div class="body">
        ${type === "staff" ? `
          <table class="details-table">
            ${card.show_father_name && person.father_name ? `<tr><td class="icon-td">&#128100;</td><td class="label">Father's Name</td><td class="colon">:</td><td class="val">${person.father_name}</td></tr>` : ""}
            ${card.show_department && person.department ? `<tr><td class="icon-td">&#127970;</td><td class="label">Department</td><td class="colon">:</td><td class="val">${person.department}</td></tr>` : ""}
            ${card.show_dob && person.dob ? `<tr><td class="icon-td">&#128197;</td><td class="label">Date of Birth</td><td class="colon">:</td><td class="val">${person.dob}</td></tr>` : ""}
            ${card.show_joining_date && person.joining_date ? `<tr><td class="icon-td">&#128197;</td><td class="label">Joining Date</td><td class="colon">:</td><td class="val">${person.joining_date}</td></tr>` : ""}
            ${card.show_phone && person.phone ? `<tr><td class="icon-td">&#128222;</td><td class="label">Mobile</td><td class="colon">:</td><td class="val">${person.phone}</td></tr>` : ""}
            ${card.show_address && person.address ? `<tr><td class="icon-td">&#128205;</td><td class="label">Address</td><td class="colon">:</td><td class="val">${person.address}</td></tr>` : ""}
          </table>
        ` : `
          <table class="details-table">
            ${card.show_father_name && person.father_name ? `<tr><td class="icon-td">&#128100;</td><td class="label">Father's Name</td><td class="colon">:</td><td class="val">${person.father_name}</td></tr>` : ""}
            ${card.show_mother_name && person.mother_name ? `<tr><td class="icon-td">&#128100;</td><td class="label">Mother's Name</td><td class="colon">:</td><td class="val">${person.mother_name}</td></tr>` : ""}
            ${card.show_dob && person.dob ? `<tr><td class="icon-td">&#128197;</td><td class="label">Date of Birth</td><td class="colon">:</td><td class="val">${person.dob}</td></tr>` : ""}
            ${card.show_blood_group && person.blood_group ? `<tr><td class="icon-td">&#129656;</td><td class="label">Blood Group</td><td class="colon">:</td><td class="val">${person.blood_group}</td></tr>` : ""}
            ${card.show_address && person.address ? `<tr><td class="icon-td">&#128205;</td><td class="label">Address</td><td class="colon">:</td><td class="val">${person.address}</td></tr>` : ""}
          </table>
        `}
      </div>
      <div class="bottom-row">
        <div class="session-block">
          <div class="session-lbl">SESSION</div>
          <div class="session-num">${sessionVal}</div>
        </div>
        <div class="qr-center">
          ${card.show_qr ? `<img src="${qrCodeUrl}" alt="QR" class="qr-img" />` : ""}
        </div>
        <div class="sign-block">
          ${card.signature
            ? `<img src="${getImageUrl(card.signature)}" alt="Signature" style="height:24px;max-width:55px;object-fit:contain;display:block;margin-left:auto;margin-bottom:1px;" />`
            : `<div style="font-size:11px;color:#14532d;font-weight:bold;font-family:cursive;">&#9997; Shafi</div>`}
          <div style="border-top:1px solid #cbd5e1;width:50px;margin-top:1px;margin-left:auto;"></div>
          <div style="font-size:7.5px;font-weight:800;color:#64748b;text-transform:uppercase;">Principal</div>
        </div>
      </div>
      <div class="footer-bar">
        ID No. ${identifierVal.includes("STUDENT") ? "GFIS/25/0456" : identifierVal}
      </div>
    </div>
  </div>
</body>
</html>`;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STYLE: Vikas National Bilingual (Vertical) — Inspired by Image 1
    // ─────────────────────────────────────────────────────────────────────────────
    if (vertical && (titleLower.includes("vikas") || titleLower.includes("national") || titleLower.includes("bilingual"))) {
        const logoHtml = card.logo
            ? `<img src="${getImageUrl(card.logo)}" alt="logo" style="height:28px;max-width:55px;object-fit:contain;" />`
            : `<div style="width:26px;height:26px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:#1e3a8a;border:1.5px solid #fde047;">&#127891;</div>`;

        const photoHtml = person.photo
            ? `<img src="${getImageUrl(person.photo)}" alt="photo" style="width:78px;height:90px;object-fit:cover;border-radius:6px;border:3px solid #db2777;box-shadow:0 4px 10px rgba(0,0,0,0.15);" />`
            : `<div style="width:78px;height:90px;background:#fdf2f8;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#db2777;font-size:9px;font-weight:800;border:3px solid #db2777;"><span style="font-size:16px;">&#128100;</span>NO PHOTO</div>`;

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 20px; display: flex; justify-content: center; background: #e0f2fe; }
    .card { width: 285px; min-height: 460px; background: #ffffff; border: 2px solid #1e3a8a; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 28px rgba(30,58,138,0.25); display: flex; flex-direction: column; position: relative; }
    .top-notch-wrap { display: flex; justify-content: center; padding-top: 12px; margin-bottom: 8px; }
    .top-notch { height: 7.5px; width: 46px; background: #0f172a; border: 1.5px solid #fde047; border-radius: 6px; }
    .header { background: #1e3a8a; color: #fff; padding: 0 10px 24px; text-align: center; position: relative; border-bottom: 3.5px solid #ea580c; }
    .header-logo { display: flex; justify-content: center; margin-top: 2px; margin-bottom: 2px; }
    .school-title { font-size: 13px; font-weight: 900; color: #ffffff; line-height: 1.2; }
    .school-sub { font-size: 8px; color: #93c5fd; margin-top: 1px; font-weight: 600; }
    .class-tag { font-size: 9.5px; font-weight: 900; color: #fde047; margin-top: 2px; }
    .photo-wrap { margin-top: -18px; display: flex; justify-content: center; position: relative; z-index: 10; }
    .name-banner { text-align: center; margin-top: 4px; padding: 0 10px; }
    .person-name { font-size: 14.5px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; }
    .body { padding: 6px 16px; flex: 1; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    .details-table tr { border-bottom: 1px solid #f1f5f9; }
    .details-table td { padding: 2.2px 0; vertical-align: middle; }
    .label { width: 95px; color: #1e3a8a; font-weight: 800; font-size: 8.5px; }
    .val { color: #0f172a; font-weight: 700; font-size: 9px; }
    .footer { padding: 6px 14px 8px; background: #ffffff; border-top: 1.5px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="top-notch-wrap"><div class="top-notch"></div></div>
      <div class="header-logo">${logoHtml}</div>
      <div class="school-title">${card.school_name || "शास. प्राथ. शाला गारका"}</div>
      ${card.school_address ? `<div class="school-sub">${card.school_address}</div>` : ""}
      <div class="class-tag">${type === "staff" ? `पद / DESIGNATION: ${person.designation || "शिक्षक / TEACHER"}` : `कक्षा / CLASS: ${person.class || "1st"}`}</div>
    </div>
    <div class="photo-wrap">
      ${photoHtml}
    </div>
    <div class="name-banner">
      <div class="person-name">${person.name || "N/A"}</div>
    </div>
    <div class="body">
      ${type === "staff" ? `
        <table class="details-table">
          ${card.show_designation && person.designation ? `<tr><td class="label">Designation / पद</td><td>: <b>${person.designation}</b></td></tr>` : ""}
          ${card.show_department && person.department ? `<tr><td class="label">Department / विभाग</td><td>: ${person.department}</td></tr>` : ""}
          ${card.show_staff_id && person.staff_id ? `<tr><td class="label">Staff ID / कर्मचारी क्र.</td><td>: ${person.staff_id}</td></tr>` : ""}
          ${card.show_joining_date && person.joining_date ? `<tr><td class="label">Joining / नियुक्ति तिथि</td><td>: ${person.joining_date}</td></tr>` : ""}
          ${card.show_phone && person.phone ? `<tr><td class="label">Mobile / मो.</td><td>: ${person.phone}</td></tr>` : ""}
          ${card.show_address && person.address ? `<tr><td class="label">Address / पता</td><td>: ${person.address}</td></tr>` : ""}
        </table>
      ` : `
        <table class="details-table">
          <tr><td class="label">Session / सत्र</td><td>: <b>${sessionVal}</b></td></tr>
          ${card.show_father_name && person.father_name ? `<tr><td class="label">Father / पिता</td><td>: ${person.father_name}</td></tr>` : ""}
          ${card.show_dob && person.dob ? `<tr><td class="label">DOB / जन्मतिथि</td><td>: ${person.dob}</td></tr>` : ""}
          ${card.show_phone && person.phone ? `<tr><td class="label">Mobile / मो.</td><td>: ${person.phone}</td></tr>` : ""}
          ${card.show_address && person.address ? `<tr><td class="label">Address / पता</td><td>: ${person.address}</td></tr>` : ""}
        </table>
      `}
    </div>
    <div class="footer">
      ${card.show_qr ? `
        <img src="${qrCodeUrl}" alt="QR" style="width:30px;height:30px;object-fit:contain;" />
      ` : "<div></div>"}
      <div style="text-align:right;">
        ${card.signature
          ? `<img src="${getImageUrl(card.signature)}" alt="Signature" style="height:24px;max-width:55px;object-fit:contain;display:block;margin-left:auto;margin-bottom:1px;" />`
          : `<div style="font-size:11px;color:#16a34a;font-weight:bold;">&#9997; Shafi</div>`}
        <div style="font-size:7.5px;font-weight:800;color:#64748b;text-transform:uppercase;">Principal</div>
      </div>
    </div>
  </div>
</body>
</html>`;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STYLE 2: Executive Slate & Gold (Vertical)
    // ─────────────────────────────────────────────────────────────────────────────
    if (vertical) {
        const logoHtml = card.logo
            ? `<img src="${getImageUrl(card.logo)}" alt="logo" style="height:28px;max-width:55px;object-fit:contain;" />`
            : `<div style="width:24px;height:24px;border-radius:6px;background:rgba(245,158,11,0.2);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;color:#f59e0b;border:1.5px solid #f59e0b;">&#127891;</div>`;

        const photoHtml = person.photo
            ? `<img src="${getImageUrl(person.photo)}" alt="photo" style="width:74px;height:88px;object-fit:cover;border-radius:12px;border:3px solid #f59e0b;box-shadow:0 4px 14px rgba(245,158,11,0.25);" />`
            : `<div style="width:74px;height:88px;background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#f59e0b;font-size:9px;font-weight:800;border:3px solid #f59e0b;box-shadow:0 4px 14px rgba(245,158,11,0.25);letter-spacing:0.3px;"><span style="font-size:16px;margin-bottom:2px;opacity:0.8;">&#128100;</span>NO PHOTO</div>`;

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 20px; display: flex; justify-content: center; background: #f1f5f9; }
    .card { width: 285px; min-height: 450px; ${bg} border: 1.5px solid #334155; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 28px rgba(15,23,42,0.25); display: flex; flex-direction: column; position: relative; }
    .top-notch-wrap { display: flex; justify-content: center; padding-top: 12px; margin-bottom: 8px; }
    .top-notch { height: 7.5px; width: 46px; background: #020617; border: 1.5px solid #f59e0b; border-radius: 6px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.8); }
    .header { background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); color: #fff; padding: 0 12px 34px; text-align: center; position: relative; border-bottom: 3px solid #f59e0b; }
    .header-logo { display: flex; justify-content: center; margin-top: 3px; margin-bottom: 4px; }
    .school-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; line-height: 1.25; color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
    .school-sub { font-size: 8px; color: #fde68a; margin-top: 2px; line-height: 1.2; font-weight: 600; }
    .photo-wrap { margin-top: -26px; display: flex; justify-content: center; position: relative; z-index: 10; }
    .name-banner { text-align: center; margin-top: 6px; padding: 0 10px; }
    .person-name { font-size: 13.5px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.4px; line-height: 1.2; }
    .role-badge { display: inline-block; background: #0f172a; color: #f59e0b; border: 1px solid #f59e0b; font-size: 8.5px; font-weight: 800; padding: 2px 10px; border-radius: 12px; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.6px; box-shadow: 0 2px 5px rgba(0,0,0,0.15); }
    .body { padding: 8px 16px 6px; flex: 1; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    .details-table tr { border-bottom: 1px solid #fef3c7; }
    .details-table tr:last-child { border-bottom: none; }
    .details-table td { padding: 2.5px 0; vertical-align: middle; }
    .label { width: 80px; color: #475569; font-weight: 700; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.3px; }
    .val { color: #0f172a; font-weight: 800; text-align: right; }
    .footer { padding: 6px 14px 8px; background: #ffffff; border-top: 1.5px solid #fef3c7; display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="top-notch-wrap"><div class="top-notch"></div></div>
      <div class="header-logo">${logoHtml}</div>
      <div class="school-title">${card.school_name || "INSTITUTION NAME"}</div>
      ${card.school_address ? `<div class="school-sub">${card.school_address}</div>` : ""}
    </div>
    <div class="photo-wrap">
      ${photoHtml}
    </div>
    <div class="name-banner">
      <div class="person-name">${person.name || "N/A"}</div>
      <span class="role-badge">${formatRoleBadge()}</span>
    </div>
    <div class="body">
      <table class="details-table">
        ${rows.map(([, lbl, val]) => `<tr><td class="label">&#9670; ${lbl}</td><td class="val">${val}</td></tr>`).join("")}
      </table>
    </div>
    <div class="footer">
      ${card.show_qr ? `
        <div style="display:flex;align-items:center;gap:6px;background:#fefce8;border:1.5px solid #f59e0b;padding:2px 6px;border-radius:6px;box-shadow:0 1px 3px rgba(245,158,11,0.15);">
          <img src="${qrCodeUrl}" alt="QR" style="width:36px;height:36px;object-fit:contain;display:block;" />
          <div style="display:flex;flex-direction:column;text-align:left;line-height:1.2;">
            <span style="font-size:7px;font-weight:900;color:#b45309;text-transform:uppercase;letter-spacing:0.5px;">VERIFIED</span>
            <span style="font-size:9px;font-weight:900;color:#0f172a;">${identifierVal}</span>
          </div>
        </div>
      ` : "<div></div>"}
      ${signHtml}
    </div>
  </div>
</body>
</html>`;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STYLE 5: Tech Sapphire Digital ID (Horizontal)
    // ─────────────────────────────────────────────────────────────────────────────
    if (titleLower.includes("sapphire") || titleLower.includes("tech") || titleLower.includes("digital") || titleLower.includes("robotics") || headerColor === "#0284C7") {
        const logoHtml = card.logo
            ? `<img src="${getImageUrl(card.logo)}" alt="logo" style="height:26px;max-width:45px;object-fit:contain;" />`
            : `<div style="width:22px;height:22px;border-radius:4px;background:#082f49;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:10px;color:#38bdf8;border:1px solid #38bdf8;">&#9889;</div>`;

        const photoHtml = person.photo
            ? `<img src="${getImageUrl(person.photo)}" alt="photo" style="width:72px;height:86px;object-fit:cover;border-radius:6px;border:2px solid #38bdf8;box-shadow:0 0 10px rgba(56,189,248,0.25);" />`
            : `<div style="width:72px;height:86px;background:#082f49;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#38bdf8;font-size:8.5px;font-weight:800;border:2px solid #38bdf8;box-shadow:0 0 10px rgba(56,189,248,0.25);font-family:monospace;"><span style="font-size:16px;margin-bottom:2px;">&#128187;</span>[CHIP ID]</div>`;

        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; }
    body { margin: 0; padding: 20px; display: flex; justify-content: center; background: #0b1329; }
    .card { width: 430px; min-height: 255px; background: #ffffff; border: 2px solid #0284c7; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(2,132,199,0.25); display: flex; flex-direction: column; position: relative; }
    .top-notch-wrap { display: flex; justify-content: center; padding-top: 10px; margin-bottom: 8px; }
    .top-notch { height: 7.5px; width: 50px; background: #082f49; border: 1.2px solid #38bdf8; border-radius: 5px; box-shadow: 0 0 6px rgba(56,189,248,0.5); }
    .header { background: linear-gradient(90deg, #0c4a6e 0%, #0284c7 100%); color: #fff; padding: 0 14px 8px; position: relative; border-bottom: 2px solid #38bdf8; }
    .header-main { display: flex; align-items: center; gap: 10px; }
    .header-text { flex: 1; min-width: 0; text-align: left; }
    .school-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; line-height: 1.2; color: #ffffff; text-shadow: 0 0 6px rgba(56,189,248,0.6); }
    .school-sub { font-size: 8px; color: #bae6fd; margin-top: 1px; line-height: 1.2; font-family: monospace; }
    .body { padding: 10px 14px 8px; display: flex; gap: 14px; flex: 1; align-items: flex-start; }
    .photo-col { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .id-pill { background: #082f49; border: 1px solid #38bdf8; font-size: 7.5px; font-weight: 800; color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-family: monospace; letter-spacing: 0.5px; }
    .details-col { flex: 1; min-width: 0; }
    .name-banner { font-size: 13px; font-weight: 900; color: #0369a1; margin-bottom: 6px; text-transform: uppercase; border-bottom: 2px solid #0284c7; padding-bottom: 3px; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .role-badge { background: #0284c7; color: #ffffff; font-size: 8px; font-weight: 800; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; font-family: monospace; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    .details-table tr { border-bottom: 1px solid #e0f2fe; }
    .details-table tr:last-child { border-bottom: none; }
    .details-table td { padding: 2px 0; vertical-align: middle; }
    .label { width: 75px; color: #0284c7; font-weight: 700; font-size: 8px; text-transform: uppercase; letter-spacing: 0.4px; font-family: monospace; }
    .val { color: #0f172a; font-weight: 700; text-align: left; font-family: monospace; font-size: 9px; }
    .footer { padding: 6px 14px; background: #f0f9ff; border-top: 1px solid #bae6fd; display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="top-notch-wrap"><div class="top-notch"></div></div>
      <div class="header-main">
        ${logoHtml}
        <div class="header-text">
          <div class="school-title">${card.school_name || "INSTITUTION NAME"}</div>
          ${card.school_address ? `<div class="school-sub">${card.school_address}</div>` : ""}
        </div>
      </div>
    </div>
    <div class="body">
      <div class="photo-col">
        ${photoHtml}
        <span class="id-pill">${identifierVal}</span>
      </div>
      <div class="details-col">
        <div class="name-banner">
          <span>${person.name || "N/A"}</span>
          <span class="role-badge">${formatRoleBadge()}</span>
        </div>
        <table class="details-table">
          ${rows.map(([, lbl, val]) => `<tr><td class="label">[${lbl}]:</td><td class="val">${val}</td></tr>`).join("")}
        </table>
      </div>
    </div>
    <div class="footer">
      ${card.show_qr ? `
        <div style="display:flex;align-items:center;gap:6px;background:#082f49;border:1px solid #38bdf8;padding:2px 6px;border-radius:4px;box-shadow:0 0 6px rgba(56,189,248,0.2);">
          <img src="${qrCodeUrl}" alt="QR" style="width:34px;height:34px;object-fit:contain;display:block;background:#fff;border-radius:2px;" />
          <div style="display:flex;flex-direction:column;text-align:left;line-height:1.1;">
            <span style="font-size:7px;font-weight:900;color:#38bdf8;font-family:monospace;letter-spacing:0.5px;">CYBER ID</span>
            <span style="font-size:8.5px;font-weight:900;color:#ffffff;font-family:monospace;">${identifierVal}</span>
          </div>
        </div>
      ` : "<div></div>"}
      ${signHtml}
    </div>
  </div>
</body>
</html>`;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // STYLE 1: Modern Minimalist Indigo (Horizontal - Default Horizontal)
    // ─────────────────────────────────────────────────────────────────────────────
    const logoHtml = card.logo
        ? `<img src="${getImageUrl(card.logo)}" alt="logo" style="height:28px;max-width:55px;object-fit:contain;" />`
        : `<div style="width:24px;height:24px;border-radius:6px;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;color:#fff;border:1px solid rgba(255,255,255,0.35);">&#127891;</div>`;

    const photoHtml = person.photo
        ? `<img src="${getImageUrl(person.photo)}" alt="photo" style="width:72px;height:86px;object-fit:cover;border-radius:8px;border:2.5px solid #fff;box-shadow:0 3px 8px rgba(79,70,229,0.15);" />`
        : `<div style="width:72px;height:86px;background:linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#4f46e5;font-size:9px;font-weight:800;border:2.5px solid #fff;box-shadow:0 3px 8px rgba(79,70,229,0.15);letter-spacing:0.3px;"><span style="font-size:15px;margin-bottom:2px;opacity:0.7;">&#128100;</span>NO PHOTO</div>`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 20px; display: flex; justify-content: center; }
    .card { width: 430px; min-height: 255px; ${bg} border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.12); display: flex; flex-direction: column; position: relative; }
    .top-notch-wrap { display: flex; justify-content: center; padding-top: 10px; margin-bottom: 8px; }
    .top-notch { height: 7.5px; width: 50px; background: rgba(0,0,0,0.4); border: 1.2px solid rgba(255,255,255,0.3); border-radius: 6px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, ${headerColor} 0%, color-mix(in srgb, ${headerColor} 75%, #000) 100%); color: #fff; padding: 0 14px 8px; position: relative; border-bottom: 2px solid rgba(255,255,255,0.25); }
    .header-main { display: flex; align-items: center; gap: 10px; }
    .header-text { flex: 1; min-width: 0; text-align: left; }
    .school-title { font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
    .school-sub { font-size: 8px; color: rgba(255,255,255,0.85); opacity: 0.9; margin-top: 1px; line-height: 1.2; font-weight: 500; }
    .body { padding: 10px 14px 8px; display: flex; gap: 14px; flex: 1; align-items: flex-start; }
    .photo-col { display: flex; flex-direction: column; align-items: center; gap: 5px; }
    .id-pill { background: #eef2ff; border: 1px solid #c7d2fe; font-size: 8px; font-weight: 800; color: #4338ca; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
    .details-col { flex: 1; min-width: 0; }
    .name-banner { font-size: 13px; font-weight: 800; color: #1e1b4b; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1.5px solid ${headerColor}; padding-bottom: 3px; display: flex; align-items: center; justify-content: space-between; gap: 6px; }
    .role-badge { background: ${headerColor}; color: #fff; font-size: 8.5px; font-weight: 700; padding: 1.5px 7px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.4px; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
    .details-table tr { border-bottom: 1px solid #f1f5f9; }
    .details-table tr:last-child { border-bottom: none; }
    .details-table td { padding: 2.5px 0; vertical-align: middle; }
    .label { width: 75px; color: #64748b; font-weight: 700; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.2px; }
    .val { color: #0f172a; font-weight: 700; text-align: left; }
    .footer { padding: 6px 14px; background: rgba(255,255,255,0.85); border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="top-notch-wrap"><div class="top-notch"></div></div>
      <div class="header-main">
        ${logoHtml}
        <div class="header-text">
          <div class="school-title">${card.school_name || "INSTITUTION NAME"}</div>
          ${card.school_address ? `<div class="school-sub">${card.school_address}</div>` : ""}
        </div>
      </div>
    </div>
    <div class="body">
      <div class="photo-col">
        ${photoHtml}
        <span class="id-pill">${identifierVal}</span>
      </div>
      <div class="details-col">
        <div class="name-banner">
          <span>${person.name || "N/A"}</span>
          <span class="role-badge">${formatRoleBadge()}</span>
        </div>
        <table class="details-table">
          ${rows.map(([, lbl, val]) => `<tr><td class="label">${lbl}:</td><td class="val">${val}</td></tr>`).join("")}
        </table>
      </div>
    </div>
    <div class="footer">
      ${card.show_qr ? `
        <div style="display:flex;align-items:center;gap:5px;background:#fff;border:1px solid #cbd5e1;padding:2px 5px;border-radius:5px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <img src="${qrCodeUrl}" alt="QR" style="width:34px;height:34px;object-fit:contain;display:block;" />
          <div style="display:flex;flex-direction:column;text-align:left;line-height:1.1;">
            <span style="font-size:7px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">SCAN CODE</span>
            <span style="font-size:8px;font-weight:800;color:#1e293b;">${identifierVal}</span>
          </div>
        </div>
      ` : "<div></div>"}
      ${signHtml}
    </div>
  </div>
</body>
</html>`;
}

/** Open a print dialog for the rendered ID cards HTML. */
export function printIdCards(html: string): void {
    printCertificate(html);
}

/** Download the rendered ID card as a PDF via jsPDF + html2canvas. */
export async function downloadIdCardPdf(html: string, filename = "id_card.pdf"): Promise<void> {
    return downloadCertificatePdf(html, filename);
}


