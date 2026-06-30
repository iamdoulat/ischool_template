import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas-pro";

/* ── DATA INTERFACES ───────────────────────────────────────────────── */
export interface AdmissionFormData {
  [key: string]: any;
  admission_no?: string;
  roll_no?: string;
  name?: string;
  last_name?: string;
  full_name?: string;
  gender?: string;
  dob?: string;
  birth_place?: string;
  state?: string;
  nationality?: string;
  blood_group?: string;
  religion?: string;
  caste?: string;
  category?: string;
  phone?: string;
  email?: string;
  admission_date?: string;
  house?: string;
  height?: string;
  weight?: string;
  measurement_date?: string;
  medical_history?: string;
  postal_code?: string;
  mother_tongue?: string;
  identification_marks?: string;
  father_name?: string;
  father_phone?: string;
  father_occupation?: string;
  mother_name?: string;
  mother_phone?: string;
  mother_occupation?: string;
  guardian_type?: string;
  guardian_name?: string;
  guardian_relation?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_occupation?: string;
  guardian_address?: string;
  current_address?: string;
  permanent_address?: string;
  national_identification_no?: string;
  local_identification_no?: string;
  bank_account_no?: string;
  bank_name?: string;
  ifsc_code?: string;
  previous_school_details?: string;
  note?: string;
  rte?: string;
  school_class_id?: string | number;
  section_id?: string | number;
  avatar?: string | null;
  mother_avatar?: string | null;
  father_avatar?: string | null;
  guardian_avatar?: string | null;
  second_language?: string;
  appraisal_achievements?: string;
  general_behaviour?: string;
}

export interface SchoolInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  slogan?: string;
  logoUrl?: string;
  currencySymbol?: string;
}

/* ── COLOR PALETTE ──────────────────────────────────────────────────── */
// Tuples are mutable [number, number, number] (not `as const`) so they
// satisfy jsPDF-autotable's `Color` type when passed to head/body styles.
type RGB = [number, number, number];
const C: Record<string, RGB> = {
  primary: [30, 58, 138], // Deep Blue for headers
  primaryLight: [219, 234, 254], // Very Light Blue
  accent: [220, 38, 38], // Red for highlights
  textDark: [17, 24, 39], // Gray 900
  textMuted: [107, 114, 128], // Gray 500
  border: [209, 213, 219], // Gray 300
  white: [255, 255, 255],
  black: [0, 0, 0],
  bgLight: [249, 250, 251], // Gray 50
};

/* ── HELPERS ────────────────────────────────────────────────────────── */
async function loadImageAsBase64(url?: string): Promise<string | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    
    const fallbackToProxy = () => {
      // Fallback to proxy if Image loading fails due to CORS
      fetch(`/api/camera-proxy?url=${encodeURIComponent(url)}`)
        .then(res => res.blob())
        .then(blob => {
          const objectUrl = URL.createObjectURL(blob);
          const proxyImg = new window.Image();
          proxyImg.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = proxyImg.width;
            canvas.height = proxyImg.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(proxyImg, 0, 0);
              try {
                resolve(canvas.toDataURL("image/jpeg"));
              } catch (e) {
                resolve(null);
              }
            } else {
              resolve(null);
            }
            URL.revokeObjectURL(objectUrl);
          };
          proxyImg.onerror = () => {
            resolve(null);
            URL.revokeObjectURL(objectUrl);
          };
          proxyImg.src = objectUrl;
        })
        .catch(() => resolve(null));
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          resolve(canvas.toDataURL("image/jpeg"));
        } catch (e) {
          fallbackToProxy();
        }
      } else {
        resolve(null);
      }
    };
    img.onerror = fallbackToProxy;
    img.src = url;
  });
}

/**
 * Convert HTML (e.g. from CKEditor) to plain text suitable for jsPDF.
 * - <br> and block tags become newlines
 * - <li> becomes "• " prefix
 * - HTML entities are decoded
 * - Excess whitespace is collapsed
 */
function htmlToPlainText(html?: string): string {
  if (!html) return "";
  let s = String(html);

  // Normalize line breaks for block-level elements
  s = s.replace(/<\s*br\s*\/?\s*>/gi, "\n");
  s = s.replace(/<\s*\/\s*(p|div|h[1-6]|tr)\s*>/gi, "\n");
  s = s.replace(/<\s*li[^>]*>/gi, "• ");
  s = s.replace(/<\s*\/\s*li\s*>/gi, "\n");
  s = s.replace(/<\s*\/\s*(ul|ol)\s*>/gi, "\n");

  // Strip all remaining tags
  s = s.replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&hellip;/gi, "…")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&rsquo;/gi, "’")
    .replace(/&lsquo;/gi, "‘")
    .replace(/&rdquo;/gi, "”")
    .replace(/&ldquo;/gi, "“")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

  // Collapse excessive blank lines / trailing whitespace
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

const fmtDate = (d?: string | null): string => {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

/**
 * Convert CKEditor-style HTML to an array of plain-text paragraphs / list-items
 * suitable for the PDF. Returns `[]` for empty input.
 */
function htmlToParagraphs(html?: string): string[] {
  const text = htmlToPlainText(html);
  if (!text) return [];
  return text
    .split(/\n+/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Detect whether the supplied HTML contains characters jsPDF's built-in
 * Latin-1 fonts cannot render (Bengali, Arabic, CJK, etc.). When true, the
 * caller should rasterize the block instead of writing plain text.
 */
function containsNonLatin(html?: string): boolean {
  if (!html) return false;
  // Anything outside Latin-1 supplement / common European punctuation.
  return /[^\u0020-\u024F\u2010-\u206F\u20A0-\u20CF\u2100-\u214F]/.test(
    htmlToPlainText(html),
  );
}

/**
 * Render an HTML string into the PDF as one or more raster slices, paginating
 * automatically when the rendered block is taller than the remaining page.
 * Used for CKEditor sections that may contain Bengali / non-Latin glyphs the
 * built-in jsPDF fonts cannot encode.
 */
async function renderHtmlAsImage(
  doc: jsPDF,
  html: string,
  opts: {
    x: number;
    y: number;
    widthMm: number;
    pageHeightMm: number;
    bottomMarginMm: number;
    topMarginMm: number;
    fontSizePx?: number;
  },
): Promise<number> {
  const { x, y, widthMm, pageHeightMm, bottomMarginMm, topMarginMm } = opts;
  const fontSizePx = opts.fontSizePx ?? 12;

  // Off-screen container styled to match the PDF body text.
  const container = document.createElement("div");
  // 1mm ≈ 3.78px at 96dpi; render at the actual mm width so the canvas
  // height we measure maps 1:1 to mm when we place it back in the PDF.
  const widthPx = Math.round(widthMm * 3.78);
  Object.assign(container.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${widthPx}px`,
    padding: "0",
    margin: "0",
    background: "#ffffff",
    color: "#111827",
    fontFamily:
      '"Noto Sans Bengali", "Nirmala UI", "SolaimanLipi", "Kalpurush", "Hind Siliguri", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
    fontSize: `${fontSizePx}px`,
    lineHeight: "1.45",
    wordBreak: "break-word",
  } as CSSStyleDeclaration);
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: "#ffffff",
      scale: 2, // crisper text
      useCORS: true,
      logging: false,
    });

    const pxPerMm = canvas.width / widthMm;
    let remainingPx = canvas.height;
    let srcY = 0;
    let cursorY = y;

    while (remainingPx > 0) {
      const availableMm = pageHeightMm - bottomMarginMm - cursorY;
      // If there's barely any room left, jump to a fresh page first.
      if (availableMm < 10) {
        doc.addPage();
        cursorY = topMarginMm;
        continue;
      }

      const sliceHeightPx = Math.min(remainingPx, Math.floor(availableMm * pxPerMm));
      const sliceHeightMm = sliceHeightPx / pxPerMm;

      // Copy a horizontal slice of the source canvas onto a temp canvas.
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = sliceHeightPx;
      const ctx = slice.getContext("2d");
      if (!ctx) break;
      ctx.drawImage(
        canvas,
        0,
        srcY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx,
      );

      const dataUrl = slice.toDataURL("image/png");
      doc.addImage(dataUrl, "PNG", x, cursorY, widthMm, sliceHeightMm);

      srcY += sliceHeightPx;
      remainingPx -= sliceHeightPx;
      cursorY += sliceHeightMm;

      if (remainingPx > 0) {
        doc.addPage();
        cursorY = topMarginMm;
      }
    }

    return cursorY;
  } finally {
    document.body.removeChild(container);
  }
}

/* ── jsPDF DRAWING HELPERS ──────────────────────────────────────────── */
function drawRect(doc: any, x: number, y: number, w: number, h: number, fillColor?: readonly number[], strokeColor?: readonly number[]) {
  if (fillColor) {
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.rect(x, y, w, h, "F");
  }
  if (strokeColor) {
    doc.setDrawColor(strokeColor[0], strokeColor[1], strokeColor[2]);
    doc.setLineWidth(0.3);
    doc.rect(x, y, w, h, "S");
  }
}

function writeText(doc: any, text: string, x: number, y: number, size: number, font: "normal" | "bold" | "italic" = "normal", color: readonly number[] = C.textDark, align: "left" | "center" | "right" = "left", maxWidth?: number) {
  doc.setFont("helvetica", font);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  if (maxWidth) {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y, { align });
  } else {
    doc.text(text, x, y, { align });
  }
}

/* ── ADMISSION FORM CONFIG (dynamic content from system-setting/admission-form) ── */
export interface AdmissionFormConfigDocument {
  id?: number;
  name: string;
  is_active?: boolean | number;
}

export interface AdmissionFormConfig {
  /** Required documents list ("Documents Submitted" section). Inactive items are filtered out. */
  documents?: AdmissionFormConfigDocument[];
  /** CKEditor HTML for the "FEE POLICY" section. */
  fee_policy?: string;
  /** CKEditor HTML for the "FOR OFFICE USE ONLY" section. */
  office_use_only?: string;
  /** CKEditor HTML for the "Terms & Conditions" section. */
  terms_conditions?: string;
  /** CKEditor HTML for the "DECLARATION" section. */
  declaration?: string;
}

/* ── MAIN PDF GENERATOR ─────────────────────────────────────────────── */
export async function downloadAdmissionFormPdf(
  data: AdmissionFormData,
  className?: string,
  sectionName?: string,
  filename = "admission-form.pdf",
  photoUrl?: string,
  school?: SchoolInfo,
  parentPhotos?: { mother?: string, father?: string, guardian?: string },
  admissionFormConfig?: AdmissionFormConfig
): Promise<void> {
  const doc = new jsPDF("p", "mm", "a4");
  
  const PW = 210;
  const PH = 297;
  const M = 15;
  const CW = PW - M * 2;
  let Y = M;

  const advance = (mm: number) => {
    Y += mm;
    if (Y > PH - 25) { doc.addPage(); Y = M; }
  };

  const need = (mm: number) => {
    if (Y + mm > PH - 25) { doc.addPage(); Y = M; }
  };

  const hr = (y: number, color = C.border, thickness = 0.3) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(thickness);
    doc.line(M, y, PW - M, y);
  };

  const sectionHeader = (title: string, yPos: number) => {
    drawRect(doc, M, yPos, CW, 8, C.primaryLight, C.primary);
    writeText(doc, title.toUpperCase(), M + 3, yPos + 5.5, 10, "bold", C.primary);
    return yPos + 8;
  };

  const drawCheckbox = (x: number, y: number, checked: boolean, label: string) => {
    drawRect(doc, x, y - 3, 4, 4, undefined, C.textDark);
    if (checked) {
      doc.setDrawColor(C.textDark[0], C.textDark[1], C.textDark[2]);
      doc.setLineWidth(0.5);
      doc.line(x + 0.5, y - 1, x + 1.5, y + 0.5);
      doc.line(x + 1.5, y + 0.5, x + 3.5, y - 2.5);
    }
    writeText(doc, label, x + 6, y, 9, "normal", C.textDark);
  };

  const drawFieldLine = (label: string, value: string, x: number, y: number, labelWidth: number, totalWidth: number) => {
    writeText(doc, label, x, y, 9, "normal", C.textDark);
    const lineX = x + labelWidth;
    const lineWidth = totalWidth - labelWidth;
    
    // Draw dotting or solid line
    doc.setDrawColor(C.textDark[0], C.textDark[1], C.textDark[2]);
    doc.setLineWidth(0.3);
    doc.line(lineX, y + 1, lineX + lineWidth, y + 1);
    
    if (value) {
      writeText(doc, value, lineX + 2, y, 10, "bold", C.primary);
    }
  };

  /**
   * Render an array of paragraphs (each may wrap onto multiple lines) starting
   * at the current Y, auto-paginating when content overflows. Used for the
   * dynamic FEE POLICY / FOR OFFICE USE ONLY / Terms & Conditions / DECLARATION
   * sections fed from the "Admission Form Setting" tab.
   */
  const renderParagraphs = (
    paragraphs: string[],
    fontSize: number,
    leftMargin: number,
    rightInset: number,
    paragraphGap: number,
  ) => {
    if (!paragraphs.length) return;
    const usableWidth = CW - leftMargin - rightInset;
    const lineHeight = fontSize * 0.45 + 1.2; // tuned for helvetica
    paragraphs.forEach((para) => {
      const lines = doc.splitTextToSize(para, usableWidth);
      const blockHeight = lines.length * lineHeight + paragraphGap;
      // Move to a new page if this block can't fit in the remaining space
      need(blockHeight);
      writeText(doc, para, M + leftMargin, Y, fontSize, "normal", C.textDark, "left", usableWidth);
      advance(lines.length * lineHeight + paragraphGap);
    });
  };

  const drawBoxes = (x: number, y: number, value: string, count: number, label: string) => {
    writeText(doc, label, x, y + 4, 9, "normal", C.textDark);
    const labelW = doc.getTextWidth(label) + 2;
    let startX = x + labelW;
    const boxW = 5;
    const boxH = 6;
    for (let i = 0; i < count; i++) {
      drawRect(doc, startX, y, boxW, boxH, undefined, C.textDark);
      if (value && value[i]) {
        writeText(doc, value[i], startX + 1.5, y + 4.5, 10, "bold", C.primary);
      }
      startX += boxW + 1;
    }
    return startX;
  };

  // Resolve values
  const studentName = data.full_name || `${data.name || ""} ${data.last_name || ""}`.trim();
  const info = school || {
    name: "School Name",
    address: "Instilling Values, Nurturing Excellence",
    slogan: "Excellence in Education",
  };

  const photoData = await loadImageAsBase64(photoUrl);
  const motherPhotoData = await loadImageAsBase64(parentPhotos?.mother);
  const fatherPhotoData = await loadImageAsBase64(parentPhotos?.father);
  const guardianPhotoData = await loadImageAsBase64(parentPhotos?.guardian);

  // --- PAGE 1 ---
  
  let topY = Y + 8;
  const cx = PW / 2;

  // Logo / Title
  // Instead of an actual image logo, we'll draw a nice polygon or text placeholder for the logo
  writeText(doc, "ADMISSION FORM", cx, topY - 2, 14, "bold", C.textDark, "center");
  doc.line(cx - 25, topY - 1, cx + 25, topY - 1);
  
  // School Name
  writeText(doc, info.name || "School Name", cx, topY + 12, 22, "bold", C.primary, "center");
  if (info.slogan) {
    drawRect(doc, cx - 40, topY + 15, 80, 5, C.textDark);
    writeText(doc, info.slogan, cx, topY + 18.5, 7, "normal", C.white, "center");
  }

  // Photo Box
  const photoW = 35;
  const photoH = 45;
  const photoX = PW - M - photoW - 5;
  const photoY = topY - 2;
  drawRect(doc, photoX, photoY, photoW, photoH, undefined, C.textDark);
  if (photoData) {
    try {
      doc.addImage(photoData, "JPEG", photoX + 1, photoY + 1, photoW - 2, photoH - 2);
    } catch { }
  } else {
    writeText(doc, "Affix passport\nsize photo of the\nstudent", photoX + photoW/2, photoY + photoH/2 - 2, 8, "normal", C.textDark, "center");
  }

  // Top fields
  let formNoY = topY + 28;
  drawFieldLine("Form No.:", "", M + 5, formNoY, 18, 60);
  drawFieldLine("Date:", fmtDate(data.admission_date || new Date().toISOString()), M + 5, formNoY + 8, 12, 60);
  drawBoxes(M + 5, formNoY + 14, data.admission_no || "", 10, "Admission No.:");

  Y = Math.max(photoY + photoH, formNoY + 20) + 5;
  
  // Section 1
  Y = sectionHeader("STUDENT'S PROFILE:", Y);
  
  advance(8);
  drawFieldLine("Name of pupil (In capital letters) :", studentName.toUpperCase(), M + 5, Y, 55, CW - 10);
  
  advance(8);
  drawFieldLine("Admission sought for Class           :", `${className || data.school_class_id || ""} ${sectionName || data.section_id || ""}`.trim(), M + 5, Y, 55, 90);
  
  // Academic Year Boxes
  let currYear = new Date().getFullYear();
  let nextYear = (currYear + 1).toString().slice(-2);
  let acYear = `${currYear}${nextYear}`; // e.g. 202425 -> actually needs 4 boxes then 2 boxes
  writeText(doc, "Academic Year :", M + 105, Y, 9, "normal", C.textDark);
  let ayX = M + 130;
  drawBoxes(ayX, Y - 4, currYear.toString(), 4, "");
  doc.text("-", ayX + 24, Y);
  drawBoxes(ayX + 26, Y - 4, nextYear, 2, "");
  
  advance(10);
  // DOB boxes
  writeText(doc, "Date of Birth", M + 5, Y, 9, "normal", C.textDark);
  writeText(doc, ":", M + 60, Y, 9, "normal", C.textDark);
  const rawDob = data.dob || "";
  let dPart = "", mPart = "", yPart = "";
  if (rawDob) {
    const dt = new Date(rawDob);
    if (!isNaN(dt.getTime())) {
      dPart = dt.getDate().toString().padStart(2, "0");
      mPart = (dt.getMonth() + 1).toString().padStart(2, "0");
      yPart = dt.getFullYear().toString();
    }
  }
  let dbX = M + 63;
  const ddStartX = dbX;
  dbX = drawBoxes(dbX, Y - 4, dPart, 2, "");
  const ddEndX = dbX;
  writeText(doc, "/", dbX + 1, Y, 10, "normal", C.textDark);
  const mmStartX = dbX + 3;
  dbX = drawBoxes(dbX + 3, Y - 4, mPart, 2, "");
  const mmEndX = dbX;
  writeText(doc, "/", dbX + 1, Y, 10, "normal", C.textDark);
  const yyyyStartX = dbX + 3;
  dbX = drawBoxes(dbX + 3, Y - 4, yPart, 4, "");
  const yyyyEndX = dbX;
  // Labels centered under each group of boxes
  writeText(doc, "D D", (ddStartX + ddEndX) / 2, Y + 5, 6, "normal", C.textMuted, "center");
  writeText(doc, "M M", (mmStartX + mmEndX) / 2, Y + 5, 6, "normal", C.textMuted, "center");
  writeText(doc, "Y Y Y Y", (yyyyStartX + yyyyEndX) / 2, Y + 5, 6, "normal", C.textMuted, "center");
  
  drawFieldLine("ID/Birth Cert.:", data.national_identification_no || "", dbX + 5, Y, 22, PW - M - dbX - 10);
  
  advance(10);
  drawFieldLine("Place of Birth", data.birth_place || "", M + 5, Y, 55, 110);
  drawFieldLine("State:", data.state || "", M + 120, Y, 10, CW - 125);
  
  advance(8);
  drawFieldLine("Nationality", data.nationality || "", M + 5, Y, 55, 110);
  drawFieldLine("Religion:", data.religion || "", M + 120, Y, 15, CW - 125);
  
  advance(8);
  writeText(doc, "Gender", M + 5, Y, 9, "normal", C.textDark);
  writeText(doc, ":", M + 60, Y, 9, "normal", C.textDark);
  const gen = (data.gender || "").toLowerCase();
  drawCheckbox(M + 63, Y, gen === "male", "Male");
  drawCheckbox(M + 83, Y, gen === "female", "Female");
  drawFieldLine("Caste:", data.caste || "", M + 120, Y, 12, CW - 125);
  
  advance(8);
  writeText(doc, "Current Address", M + 5, Y, 9, "normal", C.textDark);
  writeText(doc, ":", M + 60, Y, 9, "normal", C.textDark);
  
  const address = data.current_address || "";
  const maxLen = 60;
  const parts = address.match(new RegExp('.{1,' + maxLen + '}', 'g')) || [];
  
  drawFieldLine("", parts[0] || "", M + 63, Y, 0, CW - 68);
  if (parts.length > 1) {
    advance(8);
    drawFieldLine("", parts[1] || "", M + 63, Y, 0, CW - 68);
  }
  if (parts.length > 2) {
    advance(8);
    drawFieldLine("", parts[2] || "", M + 63, Y, 0, CW - 68);
  }
  if (parts.length > 3) {
    advance(8);
    drawFieldLine("", parts[3] || "", M + 63, Y, 0, CW - 68 - 50);
  }
  
  // Advance for Postal Code
  advance(8);
  drawFieldLine("Postal / Zip Code:", data.postal_code || data.pincode || "", M + 63 + CW - 68 - 60, Y, 26, 60);
  
  advance(8);
  writeText(doc, "Permanent Address", M + 5, Y, 9, "normal", C.textDark);
  writeText(doc, ":", M + 60, Y, 9, "normal", C.textDark);
  
  const permAddress = data.permanent_address || "";
  const permParts = permAddress.match(new RegExp('.{1,' + maxLen + '}', 'g')) || [];
  
  drawFieldLine("", permParts[0] || "", M + 63, Y, 0, CW - 68);
  if (permParts.length > 1) {
    advance(8);
    drawFieldLine("", permParts[1] || "", M + 63, Y, 0, CW - 68);
  }
  if (permParts.length > 2) {
    advance(8);
    drawFieldLine("", permParts[2] || "", M + 63, Y, 0, CW - 68);
  }
  if (permParts.length > 3) {
    advance(8);
    drawFieldLine("", permParts[3] || "", M + 63, Y, 0, CW - 68);
  }
  
  advance(8);
  drawFieldLine("Mother Tongue", data.mother_tongue || "", M + 5, Y, 55, 110);
  drawFieldLine("Blood group:", data.blood_group || "", M + 120, Y, 20, CW - 125);
  
  advance(8);
  writeText(doc, "Identification Marks", M + 5, Y, 9, "normal", C.textDark);
  writeText(doc, ":", M + 60, Y, 9, "normal", C.textDark);
  drawFieldLine("", data.identification_marks || "", M + 63, Y, 0, CW - 68);
  
  advance(12);
  writeText(doc, "Previous academic record", M + 5, Y, 10, "bold", C.textDark);
  advance(4);
  
  const defaultRecords = [
    ['', '', '', ''],
    ['', '', '', '']
  ];
  let academicRecords = defaultRecords;
  if (Array.isArray(data.previous_academic_record) && data.previous_academic_record.length > 0) {
    academicRecords = data.previous_academic_record.map((r: any) => [
      r.school_name || '',
      r.class || '',
      r.year || '',
      r.percentage || ''
    ]);
  } else if (data.previous_school_details) {
    academicRecords = [
      [data.previous_school_details, '', '', ''],
      ['', '', '', '']
    ];
  }

  autoTable(doc, {
    startY: Y,
    margin: { left: M + 5, right: M + 5 },
    theme: 'grid',
    headStyles: { fillColor: C.white, textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, fontStyle: 'bold' },
    bodyStyles: { textColor: C.primary, lineColor: C.textDark, lineWidth: 0.3, fontStyle: 'bold', minCellHeight: 10 },
    head: [['Name of the previous school & location', 'Class', 'Year of Study', 'Percentage/Grade']],
    body: academicRecords,
  });
  
  Y = (doc as any).lastAutoTable.finalY + 10;
  
  writeText(doc, "Appraisal of your Child", M + 5, Y, 10, "bold", C.textDark);
  advance(6);
  writeText(doc, "Please mention the achievements, if any, of your child in academics/extra/co-curricular activities", M + 5, Y, 9, "normal", C.textDark);
  const appraisalText = data.appraisal_achievements || "";
  const appraisalLines = doc.splitTextToSize(appraisalText, CW - 10);
  advance(8);
  drawFieldLine("", appraisalLines[0] || "", M + 5, Y, 0, CW - 10);
  advance(8);
  drawFieldLine("", appraisalLines[1] || "", M + 5, Y, 0, CW - 10);
  if (appraisalLines.length > 2) {
    for (let i = 2; i < appraisalLines.length; i++) {
        advance(8);
        drawFieldLine("", appraisalLines[i], M + 5, Y, 0, CW - 10);
    }
  }
  
  advance(12);
  writeText(doc, "General Behaviour:", M + 5, Y, 9, "normal", C.textDark);
  drawCheckbox(M + 35, Y, data.general_behaviour === "Mild", "Mild");
  drawCheckbox(M + 55, Y, data.general_behaviour === "Normal", "Normal");
  drawCheckbox(M + 75, Y, data.general_behaviour === "Hyperactive", "Hyperactive");
  
  advance(10);
  writeText(doc, "Please mention, in brief, if there is any history of previous illness, allergy or physical /psychological illness.", M + 5, Y, 9, "normal", C.textDark);
  advance(8);
  drawFieldLine("", data.note || "", M + 5, Y, 0, CW - 10);
  
  advance(12);
  writeText(doc, "Second Language:", M + 5, Y, 9, "normal", C.textDark);
  const isEnglish = data.second_language === "English";
  const isArabic = data.second_language === "Arabic";
  const isOthers = !!data.second_language && !isEnglish && !isArabic;
  drawCheckbox(M + 35, Y, isEnglish, "English");
  drawCheckbox(M + 60, Y, isArabic, "Arabic");
  drawCheckbox(M + 82, Y, isOthers, "Others");
  if (isOthers) {
      writeText(doc, `(${data.second_language})`, M + 102, Y, 9, "normal", C.textDark);
  }
  
  // --- PARENTS SECTION ---
  need(90);
  
  Y = sectionHeader("PARENTS' / GUARDIAN'S PROFILE", Y + 5);
  advance(5);
  
  // Photo boxes
  const parPhotoW = 30;
  const parPhotoH = 40;
  const gap = (CW - (parPhotoW * 3)) / 4;
  
  const drawParentBox = (title: string, xPos: number, photoBase64: string | null) => {
    drawRect(doc, xPos, Y, parPhotoW, parPhotoH, undefined, C.border);
    if (photoBase64) {
      try {
        doc.addImage(photoBase64, xPos + 1, Y + 1, parPhotoW - 2, parPhotoH - 2);
      } catch { }
    } else {
      writeText(doc, `${title}'s\nPhoto`, xPos + parPhotoW/2, Y + parPhotoH/2, 9, "normal", C.textMuted, "center");
    }
    writeText(doc, `Signature .....................................`, xPos - 5, Y + parPhotoH + 10, 8, "normal", C.textDark);
  };
  
  drawParentBox("Mother", M + gap, motherPhotoData);
  drawParentBox("Father", M + gap*2 + parPhotoW, fatherPhotoData);
  drawParentBox("Guardian", M + gap*3 + parPhotoW*2, guardianPhotoData);
  
  advance(parPhotoH + 20);
  
  // Parents Particulars Table
  autoTable(doc, {
    startY: Y,
    margin: { left: M + 5, right: M + 5 },
    theme: 'grid',
    headStyles: { fillColor: C.white, textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, fontStyle: 'bold' },
    bodyStyles: { textColor: C.primary, lineColor: C.textDark, lineWidth: 0.3, fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: C.textDark },
    },
    head: [['Particulars', 'Mother', 'Father', 'Guardian']],
    body: [
      ['Name', data.mother_name || '', data.father_name || '', data.guardian_name || ''],
      ['Occupation', data.mother_occupation || '', data.father_occupation || '', data.guardian_occupation || ''],
      ['Mobile Number', data.mother_phone || '', data.father_phone || '', data.guardian_phone || ''],
      ['Email', '', '', data.guardian_email || ''],
      ['Office Contact Number\nwith extn. (if any)', '', '', ''],
    ],
  });
  
  Y = (doc as any).lastAutoTable.finalY + 10;

  
  need(40);
  writeText(doc, "SIBLINGS' PROFILE", M + 5, Y, 10, "bold", C.textDark);
  advance(4);
  
  autoTable(doc, {
    startY: Y,
    margin: { left: M + 5, right: M + 5 },
    theme: 'grid',
    headStyles: { fillColor: C.white, textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { textColor: C.primary, lineColor: C.textDark, lineWidth: 0.3, fontStyle: 'bold', minCellHeight: 8 },
    head: [['S.No.', 'Name of the Sibling', 'Class', 'Name of the School']],
    body: [
      ['1.', '', '', ''],
      ['2.', '', '', ''],
      ['3.', '', '', ''],
    ],
  });
  
  Y = (doc as any).lastAutoTable.finalY + 10;
  
  // --- PAGE 3 ---
  need(50);
  const preDocsNote = admissionFormConfig?.pre_documents_note !== undefined
    ? admissionFormConfig.pre_documents_note
    : "• On leaving the school, our child shall return any school property they might have borrowed during their time of study in the school.\n\n• We agree that the School reserves the right of refunding/not refunding the tuition fee (or any such fee which is paid at the time of admission), in case the child leaves/gets transferred during the course of the Academic Year.";

  if (preDocsNote) {
    const rules = preDocsNote.split('\n').filter(r => r.trim());
    rules.forEach(rule => {
      const lines = doc.splitTextToSize(rule, CW - 10);
      writeText(doc, rule, M + 5, Y, 9, "normal", C.textDark, "left", CW - 10);
      advance(lines.length * 4.5 + 2);
    });
  }  
  advance(5);
  need(20);
  writeText(doc, "Documents Submitted", M + 5, Y, 11, "bold", C.textDark);
  advance(8);

  // Dynamic documents from the "Admission Form Setting" tab; fall back to defaults
  // when nothing is configured so the existing PDF layout is preserved.
  const configuredDocs = (admissionFormConfig?.documents || [])
    .filter((d) => d && d.name && (d.is_active === undefined || !!d.is_active))
    .map((d) => d.name as string);
  const defaultDocs = [
    "Caste Certificate of the child seeking admission (if any)",
    "Photocopy of Birth Certificate (Attested)",
    "Three latest passport size photographs of student",
    "One latest passport size photograph of mother",
    "One latest passport size photograph of father",
    "Transfer Certificate (Original)",
    "Photocopy of Progress Card (of previous academic year)",
  ];
  const docsList = configuredDocs.length > 0 ? configuredDocs : defaultDocs;

  // Render two checkboxes per row at the existing column positions.
  for (let i = 0; i < docsList.length; i += 2) {
    need(10);
    drawCheckbox(M + 5, Y, false, docsList[i]);
    if (docsList[i + 1]) {
      drawCheckbox(M + 90, Y, false, docsList[i + 1]);
    }
    advance(8);
  }
  
  advance(15);
  need(20);
  writeText(doc, "FEE POLICY", PW / 2, Y, 12, "bold", C.textDark, "center");
  doc.line(PW / 2 - 15, Y + 1, PW / 2 + 15, Y + 1);
  advance(8);

  // Dynamic FEE POLICY content from "Admission Form Setting" tab.
  // The settings page stores fee_policy as JSON (FeeTable[]). Try JSON first,
  // then fall back to HTML rendering (with non-Latin rasterization) or defaults.
  const feePolicyHtml = admissionFormConfig?.fee_policy;
  let feePolicyHandled = false;
  {
  // Try structured JSON first (admission form settings stores fee tables as JSON)
  let feePolicyRenderedFromJson = false;
  if (feePolicyHtml) {
    try {
      const parsedFeeTables = JSON.parse(feePolicyHtml);
      if (Array.isArray(parsedFeeTables) && parsedFeeTables.length > 0 && parsedFeeTables[0]?.headers) {
        feePolicyRenderedFromJson = true;
        if (parsedFeeTables.length === 2) {
          // Side-by-side layout for exactly 2 tables (matching default design)
          const feeY = Y;
          writeText(doc, parsedFeeTables[0].title || "Fee Schedule", M + 5, feeY, 10, "bold", C.textDark);
          autoTable(doc, {
            startY: feeY + 3,
            margin: { left: M + 5, right: PW / 2 + 5 },
            theme: 'grid',
            headStyles: { fillColor: C.white, textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, halign: 'center' },
            head: [parsedFeeTables[0].headers],
            body: parsedFeeTables[0].rows.map((r: any) => r.cells),
          });
          const leftEndY = (doc as any).lastAutoTable.finalY;

          writeText(doc, parsedFeeTables[1].title || "Fee Schedule", PW / 2 + 5, feeY, 10, "bold", C.textDark);
          autoTable(doc, {
            startY: feeY + 3,
            margin: { left: PW / 2 + 5, right: M + 5 },
            theme: 'grid',
            headStyles: { fillColor: C.white, textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, halign: 'center' },
            head: [parsedFeeTables[1].headers],
            body: parsedFeeTables[1].rows.map((r: any) => r.cells),
          });
          const rightEndY = (doc as any).lastAutoTable.finalY;

          if (parsedFeeTables[1].note) {
            writeText(doc, parsedFeeTables[1].note, PW / 2 + 5, rightEndY + 5, 8, "normal", C.textDark, "left", CW / 2 - 10);
          }
          Y = Math.max(leftEndY, rightEndY) + 15;

          if (parsedFeeTables[0].note) {
            const noteLines = parsedFeeTables[0].note.split('\n').filter((l: string) => l.trim());
            noteLines.forEach((line: string) => {
              const wrapped = doc.splitTextToSize(line, CW - 10);
              writeText(doc, line, M + 5, Y, 8.5, "normal", C.textDark, "left", CW - 10);
              advance(wrapped.length * 4.2 + 2);
            });
          }
        } else {
          // Sequential layout for 1 or 3+ tables
          parsedFeeTables.forEach((table: any) => {
            need(30);
            writeText(doc, table.title || "Fee Schedule", M + 5, Y, 10, "bold", C.textDark);
            advance(3);
            autoTable(doc, {
              startY: Y,
              margin: { left: M + 5, right: M + 5 },
              theme: 'grid',
              headStyles: { fillColor: C.white, textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, fontStyle: 'bold', halign: 'center' },
              bodyStyles: { textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, halign: 'center' },
              head: [table.headers],
              body: table.rows.map((r: any) => r.cells),
            });
            Y = (doc as any).lastAutoTable.finalY + 5;
            if (table.note) {
              const noteLines = table.note.split('\n').filter((l: string) => l.trim());
              noteLines.forEach((line: string) => {
                const wrapped = doc.splitTextToSize(line, CW - 10);
                writeText(doc, line, M + 5, Y, 8.5, "normal", C.textDark, "left", CW - 10);
                advance(wrapped.length * 4.2 + 2);
              });
            }
            advance(5);
          });
        }
      }
    } catch { /* not JSON */ }
  }
  if (feePolicyRenderedFromJson) {
    feePolicyHandled = true;
  }
  }

  // Fall back: non-Latin rasterize → HTML paragraphs → hardcoded defaults
  if (!feePolicyHandled && feePolicyHtml && containsNonLatin(feePolicyHtml)) {
    Y = await renderHtmlAsImage(doc, feePolicyHtml, {
      x: M + 5, y: Y, widthMm: CW - 10,
      pageHeightMm: PH, bottomMarginMm: 25, topMarginMm: M,
    });
    advance(2);
    feePolicyHandled = true;
  }
  if (!feePolicyHandled) {
    const feePolicyParagraphs = htmlToParagraphs(feePolicyHtml);
    if (feePolicyParagraphs.length > 0) {
      renderParagraphs(feePolicyParagraphs, 9, 5, 5, 2);
    } else {
      let feeY = Y;
      writeText(doc, "Academic Fee Schedule", M + 5, feeY, 10, "bold", C.textDark);

      autoTable(doc, {
        startY: feeY + 3,
        margin: { left: M + 5, right: PW / 2 + 5 },
        theme: 'grid',
        headStyles: { fillColor: C.white, textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, halign: 'center' },
        head: [['Particulars', 'Payable']],
        body: [
          ['Admission Fee', 'At the time of admission'],
          ['Caution Deposit', 'At the time of admission'],
          ['Term 1', 'At the time of admission'],
          ['Term 2', 'On or before 10th July'],
          ['Term 3', 'On or before 10th Oct.'],
          ['Term 4', 'On or before 10th Jan.'],
        ],
      });

      writeText(doc, "Transport Fee Schedule", PW / 2 + 5, feeY, 10, "bold", C.textDark);
      autoTable(doc, {
        startY: feeY + 3,
        margin: { left: PW / 2 + 5, right: M + 5 },
        theme: 'grid',
        headStyles: { fillColor: C.white, textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, halign: 'center' },
        head: [['Particulars', 'Payable']],
        body: [
          ['1st Installment\n(April - Oct.)', 'On or before 10th April'],
          ['2nd Installment\n(Nov. - Mar.)', 'On or before 10th Nov.'],
        ],
      });

      writeText(doc, "Note: Pupil opting for school transportation should clear the\ndues in 2 installments.", PW / 2 + 5, (doc as any).lastAutoTable.finalY + 5, 8, "normal", C.textDark);

      Y = Math.max((doc as any).lastAutoTable.finalY, feeY + 50) + 15;

      const rules2 = [
        "1. All monetary dues related to academic & transport should be cleared on or before the due dates failing which the school\n   management is authorised to impose a penalty per student.\n   Note: School management reserves the right to stop the transportation without any prior notice or intimation if fee dues\n   are not cleared in time.",
        "2. Payment must be made at school premise either in the form of cheque or cash"
      ];

      rules2.forEach(rule => {
        const lines = doc.splitTextToSize(rule, CW - 10);
        writeText(doc, rule, M + 5, Y, 8.5, "normal", C.textDark, "left", CW - 10);
        advance(lines.length * 4.2 + 2);
      });
    }
  }

  advance(5);
  need(20);
  writeText(doc, "FOR OFFICE USE ONLY", PW / 2, Y, 11, "bold", C.textDark, "center");
  advance(4);

  // Dynamic "For Office Use Only" content from system-setting/admission-form.
  // The settings page stores office_use_only as JSON ({headers, rows, note}).
  // Try JSON first, then fall back to HTML rendering or defaults.
  const officeHtml = admissionFormConfig?.office_use_only;
  let officeHandled = false;

  // 1. Try structured JSON first
  if (officeHtml) {
    try {
      const parsedOfficeTable = JSON.parse(officeHtml);
      if (parsedOfficeTable?.headers && Array.isArray(parsedOfficeTable.rows)) {
        officeHandled = true;
        autoTable(doc, {
          startY: Y,
          margin: { left: M + 5, right: M + 5 },
          theme: 'grid',
          headStyles: { fillColor: C.white, textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, fontStyle: 'bold' },
          bodyStyles: { textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, minCellHeight: 8 },
          head: [parsedOfficeTable.headers],
          body: parsedOfficeTable.rows.map((r: any, idx: number) => {
            if (idx === parsedOfficeTable.rows.length - 1 && r.cells[0]?.toLowerCase().includes('total')) {
              return [{ content: r.cells[0], styles: { fontStyle: 'bold' } }, ...r.cells.slice(1)];
            }
            return r.cells;
          }),
        });
        Y = (doc as any).lastAutoTable.finalY + 15;
      }
    } catch { /* not JSON */ }
  }

  // 2. Fall back: non-Latin rasterize
  if (!officeHandled && officeHtml && containsNonLatin(officeHtml)) {
    Y = await renderHtmlAsImage(doc, officeHtml, {
      x: M + 5, y: Y, widthMm: CW - 10,
      pageHeightMm: PH, bottomMarginMm: 25, topMarginMm: M,
    });
    advance(2);
    officeHandled = true;
  }

  // 3. Fall back: HTML paragraphs or hardcoded defaults
  if (!officeHandled) {
    const officeParagraphs = htmlToParagraphs(officeHtml);
    if (officeParagraphs.length > 0) {
      renderParagraphs(officeParagraphs, 9, 5, 5, 3);
    } else {
      autoTable(doc, {
        startY: Y,
        margin: { left: M + 5, right: M + 5 },
        theme: 'grid',
        headStyles: { fillColor: C.white, textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, fontStyle: 'bold' },
        bodyStyles: { textColor: C.textDark, lineColor: C.textDark, lineWidth: 0.3, minCellHeight: 8 },
        head: [['Particulars', 'Amount', 'Receipt No.', 'Mode of Payment', 'Date of Payment', 'Remarks']],
        body: [
          ['Admission Fee', '', '', '', '', ''],
          ['Caution Deposit', '', '', '', '', ''],
          ['Term 1', '', '', '', '', ''],
          ['Term 2', '', '', '', '', ''],
          ['Term 3', '', '', '', '', ''],
          ['Term 4', '', '', '', '', ''],
          [{ content: 'Total Applicable Fee', styles: { fontStyle: 'bold' } }, '', '', '', '', ''],
        ],
      });

      Y = (doc as any).lastAutoTable.finalY + 15;
    }
  }
  need(55);
  
  const declText = `I .......................................................................... father of/ mother of/ guardian of .......................................................................... have applied for admission of my ward into class ........................ . I have read and accept the Terms & Conditions / Declaration of the school.`;
  const declLines = doc.splitTextToSize(declText, CW - 10);
  writeText(doc, declText, M + 5, Y, 9, "normal", C.textDark, "left", CW - 10);
  advance(declLines.length * 4.5 + 4);
  
  writeText(doc, "Choose the relevant options if you wish to avail of transport facility:", M + 15, Y, 9, "normal", C.textDark);
  advance(6);
  writeText(doc, "Do you need transport facility:   Yes", M + 15, Y, 9, "normal", C.textDark);
  drawCheckbox(M + 72, Y, false, "");
  writeText(doc, "No", M + 82, Y, 9, "normal", C.textDark);
  drawCheckbox(M + 88, Y, false, "");
  
  advance(15);
  writeText(doc, "Parent's Signature ...............................", M + 5, Y, 9, "normal", C.textDark);
  writeText(doc, "Counsellor's Signature ...............................", PW / 2 - 25, Y, 9, "normal", C.textDark);
  writeText(doc, "Principal's Signature ...............................", PW - M - 65, Y, 9, "normal", C.textDark);
  
  // --- PAGE 4 (Terms and Conditions / Declaration) ---
  need(70);

  Y += 15;
  writeText(doc, "Terms & Conditions", PW / 2, Y, 13, "bold", C.textDark, "center");
  doc.line(PW / 2 - 22, Y + 1, PW / 2 + 22, Y + 1);
  advance(10);

  // Dynamic Terms & Conditions from system-setting/admission-form.
  // Rasterize via browser fonts when the editor content contains non-Latin
  // glyphs (Bengali, Arabic, CJK) since jsPDF's built-in helvetica only
  // supports Latin-1 — otherwise the text comes through as mojibake.
  const tcHtml = admissionFormConfig?.terms_conditions;
  const tcParagraphs = htmlToParagraphs(tcHtml);
  if (tcHtml && containsNonLatin(tcHtml)) {
    Y = await renderHtmlAsImage(doc, tcHtml, {
      x: M + 10, y: Y, widthMm: CW - 20,
      pageHeightMm: PH, bottomMarginMm: 25, topMarginMm: M,
    });
    advance(2);
  } else if (tcParagraphs.length > 0) {
    renderParagraphs(tcParagraphs, 9, 10, 10, 4);
  } else {
    const tc = [
      "1. Admission form must be filled in with due care by the parents/guardian. Any change in current / permanent address, mobile numbers,\n   etc. should be informed to the school in writing duly signed by parents / guardian (changes would not be accepted over phone,\n   SMS).",
      "2. Original transfer certificate from previous school and proof of education of the child (photocopy of mark sheet/report card)\n   should be submitted before the academic year begins.",
      "3. School would provide Foundation classes for students of higher classes which is optional and on payment of\n   additional fee.",
      "4. Additional charges will be collected for belts, ID cards and entry fee during field trips.",
      "5. Any misbehavior/misconduct by the student/parent/guardian will lead to rustication of the student without any prior notice.",
      "6. If you wish to avail school transport, please enquire about the routes in operation at the time of admission. Request for\n   diversion or modification of the existing routes may be considered but the decision will be taken by transport in-charge.",
      "7. School management is authorised to make any of the following changes in transport with prior notice/intimation to the\n   parents:\n      • Change in pick-up and drop timings\n      • Change in pick-up and drop points\n      • Change in order of pick-up and drop points",
      "8. The School may facilitate availability of books & uniform through stalls at the campus (for a day) prior to the\n   commencement of the classes. Such date would be informed to parents/guardians/students through mail/SMS.\n\n   The School Management is not responsible for any kind of inconvenience, such as delay in delivery, damage of goods,\n   etc., caused by any of the external vendors."
    ];

    tc.forEach(t => {
      const lines = doc.splitTextToSize(t, CW - 20);
      writeText(doc, t, M + 10, Y, 9, "normal", C.textDark, "left", CW - 20);
      advance(lines.length * 4.5 + 4);
    });
  }

  advance(10);
  need(40);
  writeText(doc, "DECLARATION", PW / 2, Y, 13, "bold", C.textDark, "center");
  writeText(doc, "(To be signed by Parent/Guardian at the time of admission only)", PW / 2, Y + 5, 10, "normal", C.textDark, "center");
  advance(15);

  // Dynamic Declaration from system-setting/admission-form.
  // Rasterize when content contains non-Latin glyphs so Bengali/Arabic/CJK
  // render correctly and the block wraps within the page width.
  const declarationHtml = admissionFormConfig?.declaration;
  const declarationParagraphs = htmlToParagraphs(declarationHtml);
  if (declarationHtml && containsNonLatin(declarationHtml)) {
    Y = await renderHtmlAsImage(doc, declarationHtml, {
      x: M + 10, y: Y, widthMm: CW - 20,
      pageHeightMm: PH, bottomMarginMm: 25, topMarginMm: M,
    });
    advance(2);
  } else if (declarationParagraphs.length > 0) {
    renderParagraphs(declarationParagraphs, 9, 10, 10, 4);
  } else {
    const declarations = [
      "1. We acknowledge that this application does not automatically admit our child to the School.\n   The School reserves the right to make a final decision with respect to admission.",
      "2. We acknowledge that, should this application be accepted, our child and we (her/his parents or guardians)\n   undertake to abide by the policies and regulations of the School and we understand that in serious instances\n   of breach like, damage to school property, bodily harm to another student/teacher, our child may be asked to\n   leave the school.",
      "3. We acknowledge that, upon acceptance of this application we agree to pay the total fee as applicable and abide by\n   the billing options outlined in the fee schedule as informed by the school from time to time.",
      "4. We acknowledge that the school will take reasonable care and exercise due diligence within its premises and\n   during school activities, it will bear no responsibility should the applicant exercise any reckless and/or careless\n   behaviour that may endanger her/his safety and others around and as such cause harm or injury to herself/himself\n   and others.",
      "5. We declare that all previous medical and psychological histories are correctly reported on the admission form."
    ];

    declarations.forEach(d => {
      const lines = doc.splitTextToSize(d, CW - 20);
      writeText(doc, d, M + 10, Y, 9, "normal", C.textDark, "left", CW - 20);
      advance(lines.length * 4.5 + 4);
    });
  }
  
  const pageCount = (doc as any).internal?.getNumberOfPages ? (doc as any).internal.getNumberOfPages() : doc.getNumberOfPages();
  const dateFooter = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Draw Footer Text
    writeText(doc, `Generated on: ${dateFooter}`, M, PH - 8, 6, "normal", C.textMuted);
    writeText(doc, `${info.name || "School Name"} • Page ${i} of ${pageCount}`, PW - M, PH - 8, 6, "normal", C.textMuted, "right");
  }

  /* ── Save ────────────────────────────────────────────────────────── */
  doc.save(filename);
}
