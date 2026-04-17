"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Pencil,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CheckCircle2,
    AlertCircle,
    History,
    DollarSign,
    Eye,
} from "lucide-react";
import api from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayrollRow {
    id: number;
    payroll_id: number | null;
    staff_id: string;
    name: string;
    role: string;
    department: string;
    designation: string;
    phone: string;
    basic_salary: number;
    allowances: number;
    deductions: number;
    net_salary: number;
    status: "Generated" | "Paid" | "Unpaid" | null;
    paid_on: string | null;
    note: string | null;
}

interface Meta {
    total: number;
    page: number;
    per_page: number;
    last_page: number;
}

interface SchoolInfo {
    school_name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logo: string;
    currency: string;
}

const MONTHS = [
    { label: "January", value: 1 },
    { label: "February", value: 2 },
    { label: "March", value: 3 },
    { label: "April", value: 4 },
    { label: "May", value: 5 },
    { label: "June", value: 6 },
    { label: "July", value: 7 },
    { label: "August", value: 8 },
    { label: "September", value: 9 },
    { label: "October", value: 10 },
    { label: "November", value: 11 },
    { label: "December", value: 12 },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const statusColors: Record<string, string> = {
    Generated: "bg-orange-500 text-white",
    Paid: "bg-emerald-500 text-white",
    Unpaid: "bg-red-500 text-white",
};

const gradBtn = "bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white font-bold shadow-md transition-all rounded-full border-none disabled:opacity-60";

// ─── Payslip Print Component ─────────────────────────────────────────────────

function Payslip({ row, month, year, school }: {
    row: PayrollRow;
    month: number;
    year: number;
    school: SchoolInfo;
}) {
    const monthName = MONTHS.find(m => m.value === month)?.label ?? "";
    const grossSalary = row.basic_salary + row.allowances;
    const cur = school.currency || "$";

    return (
        <div id="payslip-content" className="bg-white text-black p-6 text-[11px] font-sans w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 border-b pb-3">
                <div>
                    {school.logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={school.logo} alt="Logo" className="h-10 mb-1 object-contain" />
                    )}
                    <p className="text-[18px] font-bold text-gray-900">{school.school_name || "Your School Name Here"}</p>
                </div>
                <div className="text-right text-[10px] text-gray-600 space-y-0.5">
                    {school.address && <p>Address: {school.address}</p>}
                    {school.phone && <p>Phone No.: {school.phone}</p>}
                    {school.email && <p>Email: {school.email}</p>}
                    {school.website && <p>Website: {school.website}</p>}
                </div>
            </div>

            {/* Title bar */}
            <div className="bg-gray-900 text-white text-center py-1 text-[11px] font-bold mb-3">
                Payslip
            </div>
            <p className="text-center text-[13px] font-semibold text-gray-800 mb-4">
                Payslip For The Period Of {monthName} {year}
            </p>

            {/* Slip # and date */}
            <div className="flex justify-between mb-4 text-[10px]">
                <span className="font-semibold">Payslip #{row.payroll_id ?? "—"}</span>
                <span className="font-semibold">
                    {row.paid_on
                        ? `Payment Date: ${new Date(row.paid_on).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}`
                        : row.status === "Generated" ? "Payment Date: Pending" : ""}
                </span>
            </div>

            {/* Staff info */}
            <table className="w-full mb-4 text-[10px]">
                <tbody>
                    <tr>
                        <td className="font-semibold pr-2 py-0.5 w-28">Staff ID</td>
                        <td className="pr-6">{row.staff_id}</td>
                        <td className="font-semibold pr-2 w-24">Name</td>
                        <td>{row.name}</td>
                    </tr>
                    <tr>
                        <td className="font-semibold pr-2 py-0.5">Department</td>
                        <td>{row.department || "—"}</td>
                        <td className="font-semibold pr-2">Designation</td>
                        <td>{row.designation || "—"}</td>
                    </tr>
                </tbody>
            </table>

            {/* Earnings & Deductions table */}
            <table className="w-full mb-4 border-collapse text-[10px]">
                <thead>
                    <tr className="border-b border-t border-gray-900">
                        <th className="py-1 text-left font-bold">Earning</th>
                        <th className="py-1 text-right font-bold">Amount ({cur})</th>
                        <th className="py-1 text-left font-bold pl-6">Deduction</th>
                        <th className="py-1 text-right font-bold">Amount ({cur})</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="py-0.5">Basic Salary</td>
                        <td className="text-right">{row.basic_salary.toFixed(2)}</td>
                        <td className="py-0.5 pl-6">Deductions</td>
                        <td className="text-right">{row.deductions.toFixed(2)}</td>
                    </tr>
                    {row.allowances > 0 && (
                        <tr>
                            <td className="py-0.5">Allowances</td>
                            <td className="text-right">{row.allowances.toFixed(2)}</td>
                            <td></td>
                            <td></td>
                        </tr>
                    )}
                    <tr className="border-t border-gray-900 font-bold">
                        <td className="py-1">Total Earning</td>
                        <td className="text-right">{grossSalary.toFixed(2)}</td>
                        <td className="pl-6">Total Deduction</td>
                        <td className="text-right">{row.deductions.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Summary */}
            <table className="w-full mb-4 text-[10px]">
                <tbody className="divide-y divide-gray-100">
                    {[
                        { label: "Payment Mode", value: "Bank Transfer" },
                        { label: `Basic Salary (${cur})`, value: row.basic_salary.toFixed(2) },
                        { label: `Gross Salary (${cur})`, value: grossSalary.toFixed(2) },
                        { label: `Deductions (${cur})`, value: row.deductions.toFixed(2) },
                        { label: `Net Salary (${cur})`, value: row.net_salary.toFixed(2) },
                    ].map(item => (
                        <tr key={item.label}>
                            <td className="py-0.5 font-medium">{item.label}</td>
                            <td className="text-right">{item.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer */}
            <p className="text-[9px] text-gray-500 border-t pt-2 mt-2">
                This payslip is computer generated hence no signature is required.
            </p>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PayrollPage() {
    // Criteria
    const [role, setRole] = useState("all");
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);

    // Table
    const [keyword, setKeyword] = useState("");
    const [perPage, setPerPage] = useState(10);
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState<PayrollRow[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);

    // School info
    const [school, setSchool] = useState<SchoolInfo>({
        school_name: "", address: "", phone: "", email: "", website: "", logo: "", currency: "$"
    });

    // Dialogs
    const [genOpen, setGenOpen] = useState(false);
    const [genRow, setGenRow] = useState<PayrollRow | null>(null);
    const [genForm, setGenForm] = useState({ basic_salary: "", allowances: "", deductions: "", note: "" });
    const [genSaving, setGenSaving] = useState(false);

    const [payRow, setPayRow] = useState<PayrollRow | null>(null);
    const [payLoading, setPayLoading] = useState(false);

    const [slipRow, setSlipRow] = useState<PayrollRow | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // Toast
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Fetch school settings ──────────────────────────────────────────────────
    useEffect(() => {
        api.get("/system-setting/general-setting").then(res => {
            const d = res.data?.data ?? res.data ?? {};
            setSchool({
                school_name: d.school_name ?? d.institute_name ?? "",
                address: d.address ?? d.institute_address ?? "",
                phone: d.phone ?? d.institute_phone ?? "",
                email: d.email ?? d.institute_email ?? "",
                website: d.website ?? d.institute_website ?? "",
                logo: d.logo ?? d.institute_logo ?? "",
                currency: d.currency ?? "$",
            });
        }).catch(() => {/* use defaults */ });
    }, []);

    // ── Fetch payroll ──────────────────────────────────────────────────────────
    const fetchPayroll = useCallback(async (pg = 1, kw = keyword) => {
        try {
            setLoading(true);
            const params: Record<string, string | number> = { month, year, per_page: perPage, page: pg };
            if (role && role !== "all") params.role = role;
            if (kw) params.keyword = kw;
            const res = await api.get("/hr/payroll", { params });
            setRows(res.data.data ?? []);
            setMeta(res.data.meta ?? null);
            setPage(pg);
            setSearched(true);
        } catch {
            showToast("error", "Failed to load payroll data.");
        } finally {
            setLoading(false);
        }
    }, [month, year, role, perPage, keyword]);

    const handleSearch = () => { setPage(1); fetchPayroll(1, keyword); };

    // ── Generate ───────────────────────────────────────────────────────────────
    const openGenerate = (row: PayrollRow) => {
        setGenRow(row);
        setGenForm({
            basic_salary: String(row.basic_salary || ""),
            allowances: String(row.allowances || ""),
            deductions: String(row.deductions || ""),
            note: row.note ?? "",
        });
        setGenOpen(true);
    };

    const handleGenerate = async () => {
        if (!genRow) return;
        try {
            setGenSaving(true);
            await api.post("/hr/payroll", {
                user_id: genRow.id,
                month,
                year,
                basic_salary: parseFloat(genForm.basic_salary) || 0,
                allowances: parseFloat(genForm.allowances) || 0,
                deductions: parseFloat(genForm.deductions) || 0,
                note: genForm.note || null,
            });
            showToast("success", `Payroll generated for ${genRow.name}`);
            setGenOpen(false);
            fetchPayroll(page);
        } catch {
            showToast("error", "Failed to generate payroll.");
        } finally {
            setGenSaving(false);
        }
    };

    // ── Pay ────────────────────────────────────────────────────────────────────
    const handlePay = async () => {
        if (!payRow?.payroll_id) return;
        try {
            setPayLoading(true);
            await api.put(`/hr/payroll/${payRow.payroll_id}/pay`);
            showToast("success", `${payRow.name} marked as Paid.`);
            setPayRow(null);
            fetchPayroll(page);
        } catch {
            showToast("error", "Failed to mark as paid.");
        } finally {
            setPayLoading(false);
        }
    };

    // ── Print ─────────────────────────────────────────────────────────────────
    const handlePrint = () => {
        const content = printRef.current?.innerHTML ?? "";
        const win = window.open("", "_blank", "width=800,height=900");
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payslip</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th { text-align: left; border-top: 1.5px solid #111; border-bottom: 1.5px solid #111; padding: 4px 0; }
                    td { padding: 3px 0; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: bold; }
                    .border-top { border-top: 1.5px solid #111; }
                    .center { text-align: center; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };

    // ── Export Functions ───────────────────────────────────────────────────────
    const handleCopy = () => {
        const text = rows.map(r => `${r.staff_id}\t${r.name}\t${r.role}\t${r.phone || ""}\t${r.status || "Not Generated"}`).join("\n");
        navigator.clipboard.writeText("Staff ID\tName\tRole\tPhone\tStatus\n" + text);
        showToast("success", "Table copied to clipboard");
    };

    const handleExportCSV = () => {
        const csv = ["Staff ID,Name,Role,Department,Designation,Phone,Status"];
        rows.forEach(r => {
            csv.push(`"${r.staff_id}","${r.name}","${r.role}","${r.department || ""}","${r.designation || ""}","${r.phone || ""}","${r.status || "Not Generated"}"`);
        });
        const blob = new Blob([csv.join("\n")], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Payroll_${month}_${year}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handlePrintTable = () => {
        const win = window.open("", "_blank");
        if (!win) return;

        let html = `
        <html><head><title>Payroll Report</title>
        <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
        </style>
        </head><body>
        <h2>Payroll Report - ${MONTHS.find(m => m.value === month)?.label} ${year}</h2>
        <table>
            <tr><th>Staff ID</th><th>Name</th><th>Role</th><th>Department</th><th>Phone</th><th>Status</th></tr>
        `;

        rows.forEach(r => {
            html += `<tr><td>${r.staff_id}</td><td>${r.name}</td><td>${r.role}</td><td>${r.department || "-"}</td><td>${r.phone || "-"}</td><td>${r.status || "Not Generated"}</td></tr>`;
        });

        html += `</table></body></html>`;
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 250);
    };

    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-[10px] font-medium
                    ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                    {toast.type === "success"
                        ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                        : <AlertCircle className="h-4 w-4 shrink-0" />}
                    {toast.msg}
                </div>
            )}

            <h1 className="text-[16px] font-medium text-gray-800">Payroll</h1>

            {/* ── Select Criteria ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                            Role <span className="text-red-500">*</span>
                        </Label>
                        <Select value={String(role)} onValueChange={setRole}>
                            <SelectTrigger className="h-9 border-gray-200 text-[10px] focus:ring-indigo-500 bg-white">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
                                <SelectItem value="Teacher">Teacher</SelectItem>
                                <SelectItem value="Accountant">Accountant</SelectItem>
                                <SelectItem value="Receptionist">Receptionist</SelectItem>
                                <SelectItem value="Librarian">Librarian</SelectItem>
                                <SelectItem value="Driver">Driver</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                            Month <span className="text-red-500">*</span>
                        </Label>
                        <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                            <SelectTrigger className="h-9 border-gray-200 text-[10px] focus:ring-indigo-500 bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map(m => (
                                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                            Year <span className="text-red-500">*</span>
                        </Label>
                        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                            <SelectTrigger className="h-9 border-gray-200 text-[10px] focus:ring-indigo-500 bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => (
                                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end pt-3">
                    <Button
                        onClick={handleSearch}
                        disabled={loading}
                        className={`${gradBtn} gap-2 h-9 px-6 text-[10px]`}
                    >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                        {loading ? "Searching..." : "Search"}
                    </Button>
                </div>
            </div>

            {/* ── Staff List ──────────────────────────────────────────────────── */}
            {searched && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-3 px-4 py-3 border-b border-gray-100">
                        <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Staff List</h2>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Search name or ID..."
                                value={keyword}
                                onChange={e => { setKeyword(e.target.value); fetchPayroll(1, e.target.value); }}
                                className="h-8 w-44 text-[10px] border-gray-200 focus-visible:ring-indigo-400"
                            />
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-gray-400">Show</span>
                                <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); fetchPayroll(1); }}>
                                    <SelectTrigger className="h-7 w-14 text-[10px] border-gray-200 bg-transparent shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[10, 25, 50].map(n => (
                                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-0.5 text-gray-400">
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100" onClick={handleCopy} title="Copy Table">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100" onClick={handleExportCSV} title="Export CSV">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100" onClick={handlePrintTable} title="Export PDF">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100" onClick={handlePrintTable} title="Print">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Columns className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/70 hover:bg-transparent border-gray-100">
                                    {["Staff ID", "Name", "Role", "Department", "Designation", "Phone", "Status", "Action"].map(h => (
                                        <TableHead key={h} className={`text-[10px] font-bold uppercase text-gray-500 py-3 ${h === "Action" ? "text-right pr-4" : ""}`}>{h}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center text-[10px] text-gray-400">
                                            No staff found for the selected criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : rows.map(row => (
                                    <TableRow key={row.id} className="border-b border-gray-50 hover:bg-indigo-50/20 transition-colors">
                                        <TableCell className="py-3 text-[10px] text-gray-500 font-mono">{row.staff_id}</TableCell>
                                        <TableCell className="py-3 text-[10px] text-gray-800 font-semibold">{row.name}</TableCell>
                                        <TableCell className="py-3 text-[10px] text-gray-500">{row.role}</TableCell>
                                        <TableCell className="py-3 text-[10px] text-gray-500">{row.department || "—"}</TableCell>
                                        <TableCell className="py-3 text-[10px] text-gray-500">{row.designation || "—"}</TableCell>
                                        <TableCell className="py-3 text-[10px] text-gray-500">{row.phone || "—"}</TableCell>
                                        <TableCell className="py-3">
                                            {row.status ? (
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${statusColors[row.status] ?? "bg-gray-200 text-gray-700"}`}>
                                                    {row.status}
                                                </span>
                                            ) : (
                                                <span className="text-[9px] text-gray-400 italic">Not Generated</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3 text-right pr-4">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Generate / Edit */}
                                                <Button
                                                    size="icon"
                                                    onClick={() => openGenerate(row)}
                                                    className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded border-none"
                                                    title={row.status ? "Edit Payroll" : "Generate Payroll"}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                {/* History */}
                                                <Button
                                                    size="icon"
                                                    className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded border-none"
                                                    title="Payroll History"
                                                >
                                                    <History className="h-3 w-3" />
                                                </Button>
                                                {/* View Payslip — beside history */}
                                                {row.status && (
                                                    <Button
                                                        size="icon"
                                                        onClick={() => setSlipRow(row)}
                                                        className="h-6 w-6 bg-white border border-gray-200 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 rounded shadow-sm"
                                                        title="View Payslip"
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                {/* Proceed to Pay */}
                                                {row.status && row.status !== "Paid" && (
                                                    <Button
                                                        onClick={() => setPayRow(row)}
                                                        className={`h-6 px-3 text-[9px] font-bold uppercase rounded-full border-none ${gradBtn}`}
                                                    >
                                                        Proceed to Pay
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* ── Pagination ─────────────────────────────────────────────── */}
                    {meta && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
                            <p className="text-[10px] text-gray-400">
                                Showing {rows.length === 0 ? 0 : (meta.page - 1) * meta.per_page + 1} to{" "}
                                {Math.min(meta.page * meta.per_page, meta.total)} of {meta.total} entries
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100"
                                    disabled={page <= 1 || loading}
                                    onClick={() => fetchPayroll(page - 1)}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
                                    <Button
                                        key={p}
                                        size="icon"
                                        onClick={() => fetchPayroll(p)}
                                        disabled={loading}
                                        className={`h-7 w-7 rounded-full text-[10px] font-bold border-none transition-all
                                            ${p === page
                                                ? "bg-gradient-to-br from-orange-400 to-indigo-500 text-white shadow-md shadow-orange-500/20 scale-[1.05]"
                                                : "bg-transparent text-gray-500 hover:bg-gray-100"
                                            }`}
                                    >
                                        {p}
                                    </Button>
                                ))}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100"
                                    disabled={page >= (meta?.last_page ?? 1) || loading}
                                    onClick={() => fetchPayroll(page + 1)}
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {!searched && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <DollarSign className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-[10px]">Select role, month and year, then click <strong>Search</strong>.</p>
                </div>
            )}

            {/* ── Generate Payroll Dialog ──────────────────────────────────────── */}
            <Dialog open={genOpen} onOpenChange={setGenOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[13px] font-bold">
                            {genRow?.payroll_id ? "Edit" : "Generate"} Payroll — {genRow?.name}
                        </DialogTitle>
                        <p className="text-[10px] text-gray-400">
                            {MONTHS.find(m => m.value === month)?.label} {year}
                        </p>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 py-2">
                        {[
                            { label: "Basic Salary *", key: "basic_salary" },
                            { label: "Allowances", key: "allowances" },
                            { label: "Deductions", key: "deductions" },
                        ].map(f => (
                            <div key={f.key} className={f.key === "basic_salary" ? "col-span-2" : ""}>
                                <Label className="text-[10px] font-bold text-gray-500 uppercase">{f.label}</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={genForm[f.key as keyof typeof genForm]}
                                    onChange={e => setGenForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    className="mt-1 h-9 text-[10px] border-gray-200 focus-visible:ring-indigo-400"
                                />
                            </div>
                        ))}
                        <div className="col-span-2 flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2">
                            <span className="text-[10px] font-bold text-indigo-700 uppercase">Net Salary</span>
                            <span className="text-[13px] font-bold text-indigo-700">
                                {(
                                    (parseFloat(genForm.basic_salary) || 0) +
                                    (parseFloat(genForm.allowances) || 0) -
                                    (parseFloat(genForm.deductions) || 0)
                                ).toFixed(2)}
                            </span>
                        </div>
                        <div className="col-span-2">
                            <Label className="text-[10px] font-bold text-gray-500 uppercase">Note</Label>
                            <Input
                                placeholder="Optional note"
                                value={genForm.note}
                                onChange={e => setGenForm(prev => ({ ...prev, note: e.target.value }))}
                                className="mt-1 h-9 text-[10px] border-gray-200 focus-visible:ring-indigo-400"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="h-9 text-[10px]" onClick={() => setGenOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleGenerate}
                            disabled={genSaving || !genForm.basic_salary}
                            className={`${gradBtn} h-9 px-6 text-[10px] gap-2`}
                        >
                            {genSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {genRow?.payroll_id ? "Update" : "Generate"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Confirm Pay Dialog ───────────────────────────────────────────── */}
            <Dialog open={!!payRow} onOpenChange={() => setPayRow(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-[13px] font-bold">Confirm Payment</DialogTitle>
                    </DialogHeader>
                    <p className="text-[10px] text-gray-600 py-2">
                        Mark <strong>{payRow?.name}</strong>&apos;s payroll as <strong>Paid</strong>?
                        Net salary: <strong>{payRow?.net_salary?.toFixed(2)}</strong>
                    </p>
                    <DialogFooter>
                        <Button variant="outline" className="h-9 text-[10px]" onClick={() => setPayRow(null)}>Cancel</Button>
                        <Button
                            onClick={handlePay}
                            disabled={payLoading}
                            className={`${gradBtn} h-9 px-6 text-[10px] gap-2`}
                        >
                            {payLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Confirm Pay
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── View Payslip Dialog ──────────────────────────────────────────── */}
            <Dialog open={!!slipRow} onOpenChange={() => setSlipRow(null)}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden">
                    {/* Dialog title bar */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600">
                        <DialogTitle className="text-white text-[13px] font-bold">Details</DialogTitle>
                        <Button
                            size="icon"
                            onClick={handlePrint}
                            className="h-7 w-7 bg-white/20 hover:bg-white/30 text-white border-none rounded"
                            title="Print Payslip"
                        >
                            <Printer className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    {/* Payslip content */}
                    <div ref={printRef} className="overflow-y-auto max-h-[75vh]">
                        {slipRow && (
                            <Payslip
                                row={slipRow}
                                month={month}
                                year={year}
                                school={school}
                            />
                        )}
                    </div>

                    <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/30">
                        <Button variant="outline" className="h-8 text-[10px]" onClick={() => setSlipRow(null)}>Close</Button>
                        <Button
                            onClick={handlePrint}
                            className={`${gradBtn} h-8 px-5 text-[10px] gap-2`}
                        >
                            <Printer className="h-3.5 w-3.5" />
                            Print Payslip
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
