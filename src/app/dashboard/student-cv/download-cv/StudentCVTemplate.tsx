/**
 * StudentCVTemplate.tsx
 * Off-screen renderable CV that mirrors the mockup UI.
 * Rendered into a hidden DOM node, captured by html2canvas → jsPDF.
 */
import React from "react";

export interface StudentCVData {
  // Identity
  name: string;
  admission_no?: string;
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
  national_id?: string;
  local_id?: string;

  // Contact
  phone?: string;
  email?: string;
  address?: string;

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
}

/* ─── Shared cell styles ─────────────────────────────────────── */
const cellBase: React.CSSProperties = {
  padding: "7px 10px",
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
      {v1 || ""}
    </td>
    <td style={{ ...(isLast ? lastLabelCell : labelCell) }}>{l2}</td>
    <td style={{
      ...(isLast ? (blue2 ? lastValueCellBlue : lastValueCell) : (blue2 ? valueCellBlue : valueCell)),
      borderRight: "none",
    }}>
      {v2 || ""}
    </td>
  </tr>
);

/* ─── Section header ─────────────────────────────────────────── */
const SectionTitle = ({ title }: { title: string }) => (
  <h2 style={{
    fontSize: 13,
    fontWeight: 800,
    color: "#111827",
    margin: "22px 0 8px 0",
    paddingBottom: 5,
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

    return (
      <div
        ref={ref}
        style={{
          width: 794,
          minHeight: 1123,
          background: "#fff",
          fontFamily: "'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif",
          padding: "28px 32px",
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
          paddingBottom: 20,
          marginBottom: 4,
        }}>
          {/* Photo */}
          <div style={{
            width: 88,
            height: 88,
            borderRadius: 6,
            border: "1px solid #d1d5db",
            overflow: "hidden",
            flexShrink: 0,
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {data.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.photo_url}
                alt="student"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                crossOrigin="anonymous"
              />
            ) : (
              <svg viewBox="0 0 80 80" width={60} height={60} fill="none">
                <circle cx="40" cy="28" r="18" fill="#9ca3af" />
                <ellipse cx="40" cy="70" rx="28" ry="18" fill="#9ca3af" />
              </svg>
            )}
          </div>

          {/* Name + contact */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: 22,
              fontWeight: 900,
              color: "#111827",
              margin: "0 0 12px 0",
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}>
              {data.name || "—"}
            </h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {data.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#374151" }}>
                  {/* phone icon inline SVG */}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l.99-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>{data.phone}</span>
                </div>
              )}
              {data.email && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#3b4abe" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>{data.email}</span>
                </div>
              )}
              {data.address && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#374151" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{data.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Personal Details ─────────────────────── */}
        <SectionTitle title="Personal Details" />
        <table style={tableStyle}>
          <tbody>
            <PairRow l1="Date Of Birth" v1={formatDate(data.dob)} l2="Gender" v2={data.gender} blue2 />
            <PairRow l1="Category" v1={data.category} l2="Religion" v2={data.religion} />
            <PairRow l1="Caste" v1={data.caste} l2="Blood Group" v2={data.blood_group} />
            <PairRow l1="Height" v1={data.height} l2="Weight" v2={data.weight} />
            <PairRow
              l1="National Identification Number" v1={data.national_id}
              l2="Local Identification Number"   v2={data.local_id}
              isLast
            />
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

        {/* ── Footer ───────────────────────────────── */}
        <div style={{
          marginTop: 44,
          borderTop: "1px solid #e5e7eb",
          paddingTop: 10,
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
