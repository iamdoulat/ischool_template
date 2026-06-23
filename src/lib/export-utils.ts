/**
 * Lightweight shared export helpers for list/table pages.
 * Supports Copy (clipboard TSV), Excel (.xlsx), PDF, and Print.
 * Uses the already-installed xlsx / jspdf / jspdf-autotable packages.
 */

export type ExportType = "copy" | "excel" | "pdf" | "print";

export interface ExportPayload {
    filename: string;
    title: string;
    columns: string[];
    rows: (string | number)[][];
}

export function exportData(type: ExportType, payload: ExportPayload): void {
    switch (type) {
        case "copy":
            copyToClipboard(payload);
            return;
        case "excel":
            void exportExcel(payload);
            return;
        case "pdf":
            void exportPdf(payload);
            return;
        case "print":
            printTable(payload);
            return;
    }
}

function copyToClipboard({ columns, rows }: ExportPayload): void {
    const tsv = [columns.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
    if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(tsv).catch(() => {});
    }
}

async function exportExcel({ filename, columns, rows }: ExportPayload): Promise<void> {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([columns, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${filename}.xlsx`);
}

async function exportPdf({ filename, title, columns, rows }: ExportPayload): Promise<void> {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF();
    doc.text(title, 14, 16);
    autoTable(doc, {
        head: [columns],
        body: rows.map((r) => r.map((c) => String(c))),
        startY: 22,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [99, 102, 241] },
    });
    doc.save(`${filename}.pdf`);
}

function printTable({ title, columns, rows }: ExportPayload): void {
    const win = window.open("", "_blank");
    if (!win) return;
    const head = columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
    const body = rows
        .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(String(c))}</td>`).join("")}</tr>`)
        .join("");
    win.document.write(`
        <html>
            <head>
                <title>${escapeHtml(title)}</title>
                <style>
                    body { font-family: sans-serif; padding: 24px; }
                    h1 { font-size: 18px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
                    th, td { border: 1px solid #e5e7eb; padding: 6px 10px; text-align: left; }
                    th { background: #f3f4f6; }
                </style>
            </head>
            <body>
                <h1>${escapeHtml(title)}</h1>
                <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
                <script>window.onload = function () { window.print(); }</script>
            </body>
        </html>
    `);
    win.document.close();
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
