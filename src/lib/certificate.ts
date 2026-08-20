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
        description: "Vibrant purple scalloped waves, cheerful yellow inner contour, gold seal, and cute student graphics.",
        preview_bg: "linear-gradient(135deg, #5b1399 0%, #f9c909 100%)",
        badge_color: "bg-purple-600 text-white",
    },
    {
        id: -3,
        name: "Classic Luxury Burgundy - Excellence",
        layout_type: "luxury_burgundy",
        header_center: "Certificate of Excellence",
        body_text: "for outstanding excellence in academic achievement and exemplary conduct during the school year.",
        remarks: "Academic Excellence and leadership.",
        footer_center: "Ms. Rachel Greene\nHomeroom Teacher",
        header_height: "100",
        footer_height: "70",
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
    const sub = (t?: string | null) => substitutePlaceholders(t ?? "", student);
    const layout = template.layout_type || "standard_school";

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const schoolName = settings?.school_name || student.school_name || sub(template.header_left) || "OAKRIDGE SCHOOL";
    const rawLogo = settings?.print_logo || settings?.admin_logo || settings?.app_logo || student.school_logo;
    const schoolLogoUrl = rawLogo ? getImageUrl(rawLogo) : null;
    const sessionText = settings?.current_session || student.session || "2026 - 2027";
    const recipientName = student.name || "JOHN DOE";
    const titleText = sub(template.header_center) || "CERTIFICATE OF APPRECIATION";
    const bodyText = sub(template.body_text) || "IN GRATEFUL RECOGNITION OF YOUR VALUABLE SUPPORT AND CONTRIBUTION TO OUR SCHOOL COMMUNITY.";
    const footerLeft = sub(template.footer_left) || "Class Teacher";
    const footerCenter = sub(template.footer_center) || "";
    const footerRight = sub(template.footer_right) || "Principal";
    const presentDate = student.present_date || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const logoHtml = schoolLogoUrl
        ? `<img src="${schoolLogoUrl}" alt="${schoolName}" class="school-logo-img" style="max-height:55px;max-width:180px;object-fit:contain;margin-bottom:2px;" />`
        : `<div style="display:inline-block;color:#0f766e;margin-bottom:2px;">${SVG_ASSETS.schoolBookLogo}</div>`;

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
    .header-logo-block {
      display: flex; flex-direction: column; align-items: center; margin-top: 10px;
    }
    .school-name-text {
      font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 800;
      letter-spacing: 4px; text-transform: uppercase; color: #1a1a1a; margin-top: 4px;
    }
    .cert-title {
      font-family: 'Cinzel', serif; font-size: 32px; font-weight: 800;
      letter-spacing: 2px; color: #926d27; text-transform: uppercase; margin-top: 18px;
    }
    .cert-subtitle {
      font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 700;
      letter-spacing: 3px; color: #4b382a; text-transform: uppercase; margin-top: 14px;
    }
    .recipient-name {
      font-family: 'Cinzel', serif; font-size: 42px; font-weight: 800;
      letter-spacing: 3px; color: #9e7529; text-transform: uppercase; margin: 12px 0 16px 0;
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
      <div class="header-logo-block">
        ${logoHtml}
        <div class="school-name-text">${schoolName}</div>
      </div>
      <div>
        <div class="cert-title">${titleText}</div>
        <div class="cert-subtitle">PRESENTED TO</div>
        <div class="recipient-name">${recipientName}</div>
        <div class="body-message">${bodyText.replace(/\n/g, "<br/>")}</div>
        <div class="date-display">${presentDate}</div>
      </div>
      <div class="cert-footer-row">
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
    .header-logo-block { display: flex; flex-direction: column; align-items: center; margin-top: 15px; }
    .school-name-text { font-size: 13px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #19205a; margin-top: 4px; }
    .cert-title {
      font-family: 'Fredoka', 'Montserrat', sans-serif; font-size: 38px; font-weight: 800; letter-spacing: 2px; color: #19205a; text-transform: uppercase; margin-top: 15px;
    }
    .cert-subtitle { font-size: 13px; font-weight: 600; color: #4b5563; margin-top: 12px; }
    .recipient-name {
      font-family: 'Fredoka', 'Montserrat', sans-serif; font-size: 40px; font-weight: 800; letter-spacing: 2px; color: #19205a; text-transform: uppercase; margin: 12px 0 14px 0;
    }
    .body-message { font-size: 13px; font-weight: 500; line-height: 1.7; color: #1f2937; max-width: 620px; margin: 0 auto; }
    .date-display { font-size: 12px; font-weight: 600; color: #4b5563; margin-top: 12px; }
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
      <div class="header-logo-block">
        ${logoHtml}
        <div class="school-name-text">${schoolName}</div>
      </div>
      <div>
        <div class="cert-title">${titleText}</div>
        <div class="cert-subtitle">This certificate proudly recognizes</div>
        <div class="recipient-name">${recipientName}</div>
        <div class="body-message">${bodyText.replace(/\n/g, "<br/>")}</div>
        <div class="date-display">Dated this ${presentDate}</div>
      </div>
      <div class="cert-footer-row">
        <div class="seal-left">${SVG_ASSETS.goldSealMedal}</div>
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
    .top-burgundy-banner { background: #422020; color: #ffffff; text-align: center; padding: 24px 20px 20px 20px; }
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
      border-bottom: 2px solid #0f766e;
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
      color: #0f766e;
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
      display: grid;
      grid-template-columns: 180px 1fr 180px;
      align-items: start;
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
      color: #0f172a;
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
      background: linear-gradient(90deg, transparent, #0f766e 70%, #0f766e);
      border-radius: 2px;
    }
    .cert-title-underline .u-line.u-right {
      background: linear-gradient(90deg, #0f766e, #0f766e 30%, transparent);
    }
    .cert-title-underline .u-icon {
      color: #0f766e;
      font-size: 10px;
      letter-spacing: 2px;
      line-height: 1;
    }
    /* Certificate Number Badge */
    .cert-no-box {
      font-family: 'Arial Narrow', 'Nimbus Sans L', Arial, sans-serif;
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.3px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 3.5px solid #0f766e;
      padding: 4px 10px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      justify-self: start;
      align-self: start;
      margin-top: 2px;
    }
    .cert-no-label {
      font-weight: 800;
      color: #0f766e;
      font-size: 12.5px;
    }
    .cert-no-val {
      font-weight: 800;
      color: #0f172a;
      font-size: 13.5px;
    }
    .photo-box {
      width: 78px;
      height: 94px;
      border: 1.5px solid #334155;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      justify-self: end;
      align-self: start;
    }
    .photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    /* Main middle-aligned body content */
    .letterhead-main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 6px;
      margin: 2px 0;
    }
    .letterhead-text-body {
      font-family: 'Arial Narrow', 'Nimbus Sans L', Arial, sans-serif;
      font-size: 15.5px;
      line-height: 1.6;
      letter-spacing: 0.15px;
      color: #1e293b;
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
      margin-top: 4px;
      margin-bottom: 2px;
      padding: 6px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3.5px solid #0f766e;
      border-radius: 4px;
    }
    .statement-label {
      font-size: 11.5px;
      font-weight: 800;
      color: #0f766e;
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
      width: 220px;
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
                 ${settings?.address ? `${settings.address} &bull; ` : ""}
                 ${settings?.phone ? `Tel: ${settings.phone} &bull; ` : ""}
                 ${settings?.email ? `Email: ${settings.email}` : ""}
               </div>
             </div>
             <div class="header-spacer-col"></div>
           </div>`
      }
    </div>

    <div class="letterhead-body">
      <div class="title-row-container">
        <div class="cert-no-box">
          <span class="cert-no-label">C/N:</span>
          <span class="cert-no-val">${(formatCertificateNumber(template, student, settings)).replace(/^C\/N:\s*/i, "")}</span>
        </div>
        <div class="cert-title-center">
          <h1 class="cert-main-title">${titleText}</h1>
          <div class="cert-title-underline">
            <span class="u-line"></span>
            <span class="u-icon">&bull; &#10022; &bull;</span>
            <span class="u-line u-right"></span>
          </div>
        </div>
        <div class="photo-box">
          ${hasPhoto && studentPhoto
            ? `<img src="${studentPhoto}" alt="Student Photo" class="photo-img" />`
            : `<span style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Photo</span>`
          }
        </div>
      </div>

      <!-- Middle-aligned body container -->
      <div class="letterhead-main-content">
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

      <!-- Signatures Row anchored to the bottom -->
      <div class="signature-row-bottom">
        <div class="sig-col-left">
          <span>Date: <strong>${presentDate}</strong></span>
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
      <div class="header-col-left">${sub(template.header_left) || `Date: ${presentDate}`}</div>
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
    staff_id?: string;
    designation?: string;
    department?: string;
    joining_date?: string;
    father_name?: string;
    mother_name?: string;
    address?: string;
    phone?: string;
    dob?: string;
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
        show_qr: true,
        description: "Horizontal layout with sleek indigo header, structured grid, photo card frame, and QR verification badge.",
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
        show_qr: true,
        description: "Vertical lanyard badge with dark slate header, gold trim, centered student portrait, and quick-scan QR code.",
        preview_bg: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
        badge_color: "bg-slate-900 text-amber-400",
    },
    {
        id: -103,
        title: "Vibrant Campus Emerald (Horizontal)",
        school_name: "GREENWOOD PUBLIC SCHOOL",
        school_address: "88 Eco Park Road, Cambridge",
        header_color: "#0D9488",
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
        show_qr: false,
        description: "Energetic emerald & teal horizontal card with clean badges, rounded photo frame, and authorized sign section.",
        preview_bg: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
        badge_color: "bg-teal-700 text-white",
    },
    {
        id: -104,
        title: "Academic Heritage Crimson (Vertical)",
        school_name: "ST. XAVIER COLLEGIATE SCHOOL",
        school_address: "32 Cathedral Road, St. Jude Square",
        header_color: "#881337",
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
        show_qr: true,
        description: "Prestigious vertical ID with royal crimson header, serif branding, prominent admission pill, and emergency contact.",
        preview_bg: "linear-gradient(135deg, #881337 0%, #be123c 100%)",
        badge_color: "bg-rose-900 text-white",
    },
    {
        id: -105,
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
        show_qr: true,
        description: "Modern sapphire blue badge with dual-column fields, high-visibility student card tags, and digital barcode/QR frame.",
        preview_bg: "linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)",
        badge_color: "bg-sky-600 text-white",
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
        preview_bg: "linear-gradient(135deg, #4338ca 0%, #6366f1 100%)",
        badge_color: "bg-indigo-600 text-white",
    },
    {
        id: -202,
        title: "Executive Staff Slate & Gold (Vertical)",
        school_name: "OAKRIDGE ACADEMY & HIGH SCHOOL",
        school_address: "450 Heritage Way, New York",
        header_color: "#0F172A",
        design_type: "Vertical",
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
        description: "Vertical executive lanyard badge with dark slate header, gold trim, centered portrait, and digital staff verification.",
        preview_bg: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
        badge_color: "bg-slate-900 text-amber-400",
    },
    {
        id: -203,
        title: "Campus Educator Emerald (Horizontal)",
        school_name: "GREENWOOD PUBLIC SCHOOL",
        school_address: "88 Eco Park Road, Cambridge",
        header_color: "#0D9488",
        design_type: "Horizontal",
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
        show_qr: false,
        description: "Vibrant emerald educator badge with clean grid info, employee joining date, and emergency contact details.",
        preview_bg: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
        badge_color: "bg-teal-700 text-white",
    },
    {
        id: -204,
        title: "University Senior Faculty Crimson (Vertical)",
        school_name: "ST. XAVIER COLLEGIATE SCHOOL",
        school_address: "32 Cathedral Road, St. Jude Square",
        header_color: "#881337",
        design_type: "Vertical",
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
        description: "Official institutional crimson vertical badge with department header, employee code pill, and principal seal.",
        preview_bg: "linear-gradient(135deg, #881337 0%, #be123c 100%)",
        badge_color: "bg-rose-900 text-white",
    },
    {
        id: -205,
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
];

export function renderIdCardHtml(
    card: IdCardTemplate,
    person: IdCardPerson,
    type: "student" | "staff" = "student",
): string {
    const headerColor = card.header_color || "#4F46E5";
    const vertical = (card.design_type || "").toLowerCase() === "vertical";
    const width = vertical ? 280 : 420;

    const studentRows: [boolean | undefined, string, string | undefined][] = [
        [card.show_admission_no, "Adm No", person.admission_no],
        [card.show_class, "Class", person.section ? `${person.class || ""} (${person.section})` : person.class],
        [card.show_roll_no, "Roll No", person.roll_no],
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

    const logoHtml = card.logo
        ? `<img src="${getImageUrl(card.logo)}" alt="logo" style="height:30px;max-width:55px;object-fit:contain;" />`
        : `<div style="width:26px;height:26px;border-radius:6px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:11px;color:#fff;border:1px solid rgba(255,255,255,0.3);">&#127891;</div>`;

    const photoHtml = person.photo
        ? `<img src="${getImageUrl(person.photo)}" alt="photo" style="width:72px;height:86px;object-fit:cover;border-radius:6px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.15);" />`
        : `<div style="width:72px;height:86px;background:#e2e8f0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:10px;font-weight:bold;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.15);">NO PHOTO</div>`;

    const signHtml = card.signature
        ? `<div style="text-align:right;"><img src="${getImageUrl(card.signature)}" alt="sign" style="height:22px;max-width:65px;object-fit:contain;" /><div style="font-size:8px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Auth Sign</div></div>`
        : `<div style="text-align:right;"><div style="width:55px;border-bottom:1px dashed #cbd5e1;margin-bottom:2px;"></div><div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Auth Sign</div></div>`;

    const identifierVal = type === "staff" ? (person.staff_id || "STAFF") : (person.admission_no || "STUDENT");

    const qrHtml = card.show_qr
        ? `<div style="display:flex;align-items:center;gap:4px;background:#fff;border:1px solid #e2e8f0;padding:2px 5px;border-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${headerColor}" stroke-width="2"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 14h3v3h-3zM14 18h3v3h-3zM19 19h2v2h-2z"/></svg>
            <span style="font-size:8px;font-weight:800;color:#334155;letter-spacing:0.4px;">${identifierVal}</span>
          </div>`
        : "";

    if (vertical) {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 20px; display: flex; justify-content: center; }
    .card { width: 280px; min-height: 440px; ${bg} border: 1px solid #cbd5e1; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.12); display: flex; flex-direction: column; position: relative; }
    .top-notch { height: 5px; width: 40px; background: rgba(0,0,0,0.18); border-radius: 4px; margin: 6px auto 0; }
    .header { background: linear-gradient(135deg, ${headerColor} 0%, color-mix(in srgb, ${headerColor} 75%, #000) 100%); color: #fff; padding: 10px 14px 18px; text-align: center; position: relative; border-bottom: 3px solid rgba(255,255,255,0.25); }
    .header-logo { display: flex; justify-content: center; margin-bottom: 4px; }
    .school-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; }
    .school-sub { font-size: 8px; opacity: 0.85; margin-top: 2px; line-height: 1.2; }
    .photo-wrap { margin-top: -24px; display: flex; justify-content: center; position: relative; z-index: 5; }
    .name-banner { text-align: center; margin-top: 6px; padding: 0 10px; }
    .person-name { font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.2; }
    .role-badge { display: inline-block; background: ${headerColor}; color: #fff; font-size: 9px; font-weight: 700; padding: 1px 8px; border-radius: 10px; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
    .body { padding: 10px 14px; flex: 1; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .details-table tr { border-bottom: 1px solid #f1f5f9; }
    .details-table td { padding: 3px 0; vertical-align: top; }
    .label { width: 75px; color: #64748b; font-weight: 600; font-size: 9px; text-transform: uppercase; }
    .val { color: #0f172a; font-weight: 700; text-align: right; }
    .footer { padding: 8px 14px 10px; background: rgba(255,255,255,0.85); border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="top-notch"></div>
      <div class="header-logo" style="margin-top:4px;">${logoHtml}</div>
      <div class="school-title">${card.school_name || "INSTITUTION NAME"}</div>
      ${card.school_address ? `<div class="school-sub">${card.school_address}</div>` : ""}
    </div>
    <div class="photo-wrap">
      ${photoHtml}
    </div>
    <div class="name-banner">
      <div class="person-name">${person.name || "N/A"}</div>
      <span class="role-badge">${type === "staff" ? (person.designation || "Staff Member") : (person.class ? `Class ${person.class}` : "Student")}</span>
    </div>
    <div class="body">
      <table class="details-table">
        ${rows.map(([, lbl, val]) => `<tr><td class="label">${lbl}</td><td class="val">${val}</td></tr>`).join("")}
      </table>
    </div>
    <div class="footer">
      ${qrHtml ? qrHtml : "<div></div>"}
      ${signHtml}
    </div>
  </div>
</body>
</html>`;
    }

    // Horizontal Layout
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 20px; display: flex; justify-content: center; }
    .card { width: ${width}px; min-height: 250px; ${bg} border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.12); display: flex; flex-direction: column; }
    .header { background: linear-gradient(135deg, ${headerColor} 0%, color-mix(in srgb, ${headerColor} 75%, #000) 100%); color: #fff; padding: 8px 14px; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid rgba(255,255,255,0.25); }
    .header-text { flex: 1; min-width: 0; text-align: left; }
    .school-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; }
    .school-sub { font-size: 8px; opacity: 0.85; margin-top: 1px; line-height: 1.2; }
    .body { padding: 10px 14px; display: flex; gap: 14px; flex: 1; align-items: flex-start; }
    .photo-col { display: flex; flex-direction: column; align-items: center; gap: 5px; }
    .id-pill { background: #f1f5f9; border: 1px solid #cbd5e1; font-size: 8px; font-weight: 800; color: #334155; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
    .details-col { flex: 1; min-width: 0; }
    .name-banner { font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1.5px solid ${headerColor}; padding-bottom: 3px; }
    .details-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .details-table tr { border-bottom: 1px solid #f1f5f9; }
    .details-table td { padding: 2.5px 0; vertical-align: top; }
    .label { width: 75px; color: #64748b; font-weight: 600; font-size: 9px; text-transform: uppercase; }
    .val { color: #0f172a; font-weight: 700; text-align: left; }
    .footer { padding: 6px 14px; background: rgba(255,255,255,0.85); border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      ${logoHtml}
      <div class="header-text">
        <div class="school-title">${card.school_name || "INSTITUTION NAME"}</div>
        ${card.school_address ? `<div class="school-sub">${card.school_address}</div>` : ""}
      </div>
    </div>
    <div class="body">
      <div class="photo-col">
        ${photoHtml}
        <span class="id-pill">${identifierVal}</span>
      </div>
      <div class="details-col">
        <div class="name-banner">${person.name || "N/A"}</div>
        <table class="details-table">
          ${rows.map(([, lbl, val]) => `<tr><td class="label">${lbl}:</td><td class="val">${val}</td></tr>`).join("")}
        </table>
      </div>
    </div>
    <div class="footer">
      ${qrHtml ? qrHtml : "<div></div>"}
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


