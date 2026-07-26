/**
 * StudentCVTemplate.tsx
 * Off-screen renderable CV that mirrors the mockup UI.
 * Rendered into a hidden DOM node, captured by html2canvas → jsPDF.
 */
import React from "react";

export interface StudentCVData {
  // Identity
  name: string;
  full_name?: string;
  admission_no?: string;
  roll_no?: string;
  class_name?: string;
  section_name?: string;
  photo_url?: string;

  // Personal
  dob?: string;
  gender?: string;
  category?: string;
  religion?: string;
  caste?: string;
  blood_group?: string;
  height?: string;
  weight?: string;
  nationality?: string;
  birth_place?: string;
  mother_tongue?: string;
  national_id?: string; // Rendered as "ID/Birth Cert"

  // Address
  address?: string;
  current_address?: string;
  permanent_address?: string;

  // Contact
  phone?: string;
  email?: string;

  // Parent / Guardian
  father_name?: string;
  mother_name?: string;
  father_occupation?: string;
  mother_occupation?: string;
  father_phone?: string;
  mother_phone?: string;
  guardian_name?: string;
  guardian_relation?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_occupation?: string;
  guardian_address?: string;

  // Previous Academic Record
  previous_academic_record?: Array<{
    school_name?: string;
    qualification?: string;
    year?: string;
    percentage_or_grade?: string;
  }>;
}

/* ─── Shared cell styles ─────────────────────────────────────── */
const cellBase: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: 11,
  lineHeight: 1.4,
  borderBottom: "1px solid #e5e7eb",
  borderRight: "1px solid #e5e7eb",
};

const labelCell: React.CSSProperties = {
  ...cellBase,
  fontWeight: 700,
  color: "#1f2937",
  width: "25%",
  background: "#fafafa",
};

const valueCell: React.CSSProperties = {
  ...cellBase,
  color: "#374151",
  width: "25%",
};

const valueCellBlue: React.CSSProperties = {
  ...valueCell,
  color: "#3b4abe",
};

const lastLabelCell: React.CSSProperties = {
  ...labelCell,
  borderBottom: "none",
};

const lastValueCell: React.CSSProperties = {
  ...valueCell,
  borderBottom: "none",
};

const lastValueCellBlue: React.CSSProperties = {
  ...valueCellBlue,
  borderBottom: "none",
};

/* ─── Pair row component ─────────────────────────────────────── */
interface PairRowProps {
  l1: string; v1?: string; blue1?: boolean;
  l2: string; v2?: string; blue2?: boolean;
  isLast?: boolean;
}

const PairRow = ({ l1, v1, blue1, l2, v2, blue2, isLast }: PairRowProps) => (
  <tr>
    <td style={isLast ? lastLabelCell : labelCell}>{l1}</td>
    <td style={isLast ? (blue1 ? lastValueCellBlue : lastValueCell) : (blue1 ? valueCellBlue : valueCell)}>
      {v1 || "—"}
    </td>
    <td style={{ ...(isLast ? lastLabelCell : labelCell) }}>{l2}</td>
    <td style={{
      ...(isLast ? (blue2 ? lastValueCellBlue : lastValueCell) : (blue2 ? valueCellBlue : valueCell)),
      borderRight: "none",
    }}>
      {v2 || "—"}
    </td>
  </tr>
);

/* ─── Section header ─────────────────────────────────────────── */
const SectionTitle = ({ title }: { title: string }) => (
  <h2 style={{
    fontSize: 13,
    fontWeight: 800,
    color: "#111827",
    margin: "18px 0 8px 0",
    paddingBottom: 4,
    borderBottom: "2px solid #e5e7eb",
    letterSpacing: 0.2,
  }}>
    {title}
  </h2>
);

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  border: "1px solid #e5e7eb",
};

export function generateDefaultAvatarDataUri(name: string = "Student"): string {
  const cleanName = (name || "Student").trim();
  const parts = cleanName.split(/\s+/);
  const initials = parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : cleanName.substring(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="12" fill="#6366f1"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="72" font-weight="bold">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/* ─── Main template ──────────────────────────────────────────── */
export const StudentCVTemplate = React.forwardRef<HTMLDivElement, { data: StudentCVData }>(
  ({ data }, ref) => {
    const formatDate = (d?: string) => {
      if (!d) return "";
      try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return d;
        return `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}/${dt.getFullYear()}`;
      } catch { return d ?? ""; }
    };

    const studentFullName = data.full_name || data.name || "—";

    const prevRecords = (data.previous_academic_record && data.previous_academic_record.length > 0)
      ? data.previous_academic_record
      : [
          { school_name: "St. Xavier High School", qualification: "10th Standard / SSC", year: "2022", percentage_or_grade: "88.5%" },
        ];

    const displayPhoto = data.photo_url || generateDefaultAvatarDataUri(studentFullName);

    return (
      <div
        ref={ref}
        style={{
          width: 794,
          minHeight: 1123,
          background: "#fff",
          fontFamily: "'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif",
          padding: "24px 30px",
          boxSizing: "border-box",
          color: "#1f2937",
        }}
      >
        {/* ── Header ───────────────────────────────── */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 20,
          borderBottom: "2px solid #e5e7eb",
          paddingBottom: 16,
          marginBottom: 4,
        }}>
          {/* Photo */}
          <div style={{
            width: 90,
            height: 90,
            borderRadius: 6,
            border: "1.5px solid #d1d5db",
            overflow: "hidden",
            flexShrink: 0,
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayPhoto}
              alt="student photo"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {/* Name + contact */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#111827",
              margin: "0 0 8px 0",
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}>
              {studentFullName}
            </h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {data.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#374151" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l.99-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>{data.phone}</span>
                </div>
              )}
              {data.email && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#3b4abe" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>{data.email}</span>
                </div>
              )}
              {(data.current_address || data.address) && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#374151" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{data.current_address || data.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Academic Details ─────────────────────── */}
        <SectionTitle title="Academic Information" />
        <table style={tableStyle}>
          <tbody>
            <PairRow l1="Admission No" v1={data.admission_no} blue1 l2="Roll No" v2={data.roll_no} />
            <PairRow l1="Current Class" v1={data.class_name} blue1 l2="Section" v2={data.section_name} isLast />
          </tbody>
        </table>

        {/* ── Personal Details ─────────────────────── */}
        <SectionTitle title="Personal Details" />
        <table style={tableStyle}>
          <tbody>
            <PairRow l1="Date Of Birth" v1={formatDate(data.dob)} l2="Gender" v2={data.gender} blue2 />
            <PairRow l1="Category" v1={data.category} l2="Religion" v2={data.religion} />
            <PairRow l1="Caste" v1={data.caste} l2="Blood Group" v2={data.blood_group} />
            <PairRow l1="Height" v1={data.height ? `${data.height} cm` : "—"} l2="Weight" v2={data.weight ? `${data.weight} kg` : "—"} />
            <PairRow l1="Nationality" v1={data.nationality || "Bangladeshi"} l2="Place Of Birth" v2={data.birth_place || "Dhaka"} />
            <PairRow l1="Mother Tongue" v1={data.mother_tongue || "Bengali"} l2="ID/Birth Cert" v2={data.national_id || "—"} />
            <PairRow l1="Current Address" v1={data.current_address || data.address} l2="Permanent Address" v2={data.permanent_address || data.address} isLast />
          </tbody>
        </table>

        {/* ── Parent Guardian Detail ───────────────── */}
        <SectionTitle title="Parent Guardian Detail" />
        <table style={tableStyle}>
          <tbody>
            <PairRow l1="Father Name" v1={data.father_name} blue1 l2="Mother Name" v2={data.mother_name} blue2 />
            <PairRow l1="Father Occupation" v1={data.father_occupation} l2="Mother Occupation" v2={data.mother_occupation} />
            <PairRow l1="Father Phone" v1={data.father_phone} l2="Mother Phone" v2={data.mother_phone} />
            <PairRow l1="Guardian Name" v1={data.guardian_name} blue1 l2="Guardian Relation" v2={data.guardian_relation} />
            <PairRow l1="Guardian Phone" v1={data.guardian_phone} l2="Guardian Email" v2={data.guardian_email} />
            <PairRow l1="Guardian Occupation" v1={data.guardian_occupation} l2="Guardian Address" v2={data.guardian_address} isLast />
          </tbody>
        </table>

        {/* ── Previous Academic Record ─────────────── */}
        <SectionTitle title="Previous Academic Record" />
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={{ ...labelCell, width: "40%", textAlign: "left" }}>School / College Name</th>
              <th style={{ ...labelCell, width: "25%", textAlign: "left" }}>Qualification / Class</th>
              <th style={{ ...labelCell, width: "15%", textAlign: "center" }}>Passing Year</th>
              <th style={{ ...labelCell, width: "20%", textAlign: "right", borderRight: "none" }}>Percentage / Grade</th>
            </tr>
          </thead>
          <tbody>
            {prevRecords.map((rec, i) => {
              const isLastRow = i === prevRecords.length - 1;
              return (
                <tr key={i}>
                  <td style={isLastRow ? lastValueCell : valueCell}>{rec.school_name || "—"}</td>
                  <td style={isLastRow ? lastValueCell : valueCell}>{rec.qualification || "—"}</td>
                  <td style={{ ...(isLastRow ? lastValueCell : valueCell), textAlign: "center" }}>{rec.year || "—"}</td>
                  <td style={{ ...(isLastRow ? lastValueCell : valueCell), textAlign: "right", borderRight: "none" }}>{rec.percentage_or_grade || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── Signature Section ──────────────────────── */}
        <div style={{
          marginTop: 45,
          paddingTop: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}>
          <div style={{ textAlign: "center", width: 170 }}>
            <div style={{ borderBottom: "1.5px dashed #6b7280", marginBottom: 6, height: 28 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>Student Signature</span>
          </div>

          <div style={{ textAlign: "center", width: 170 }}>
            <div style={{ borderBottom: "1.5px dashed #6b7280", marginBottom: 6, height: 28 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>Principal Signature</span>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────── */}
        <div style={{
          marginTop: 20,
          borderTop: "1px solid #e5e7eb",
          paddingTop: 8,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9,
          color: "#9ca3af",
        }}>
          <span>Admission No: {data.admission_no || "—"}</span>
          <span>Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
      </div>
    );
  }
);

StudentCVTemplate.displayName = "StudentCVTemplate";
