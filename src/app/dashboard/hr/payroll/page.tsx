"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Loader2,
    History,
    DollarSign,
    Eye,
    X,
    Filter,
    Banknote,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import * as XLSX from 'xlsx';

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

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
    Generated: "bg-orange-500 text-white shadow-sm",
    Paid: "bg-green-600 text-white shadow-sm",
    Unpaid: "bg-red-600 text-white shadow-sm",
};

// ─── Payslip Component ───────────────────────────────────────────────────────

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
        <div id="payslip-content" className="bg-white text-black p-8 text-[11px] font-sans w-full max-w-2xl mx-auto shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b pb-4 border-gray-100">
                <div>
                    {school.logo && (
                        <img src={school.logo} alt="Logo" className="h-12 mb-2 object-contain" />
                    )}
                    <p className="text-[20px] font-bold text-indigo-900 tracking-tight">{school.school_name || "iSchool Management"}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Payroll Management System</p>
                </div>
                <div className="text-right text-[10px] text-gray-500 space-y-1">
                    {school.address && <p>{school.address}</p>}
                    {school.phone && <p>Tel: {school.phone}</p>}
                    {school.email && <p>Email: {school.email}</p>}
                    {school.website && <p>{school.website}</p>}
                </div>
            </div>

            {/* Title bar */}
            <div className="bg-indigo-600 text-white text-center py-1.5 text-[12px] font-bold mb-4 rounded uppercase tracking-wider">
                Salary Payslip
            </div>

            <div className="flex justify-between items-center mb-6">
                <p className="text-[14px] font-semibold text-gray-800">
                    Period: <span className="text-indigo-600">{monthName} {year}</span>
                </p>
                <div className="text-right">
                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest mb-0.5">Payslip ID</span>
                    <span className="font-bold text-gray-800">#{row.payroll_id ?? "—"}</span>
                </div>
            </div>

            {/* Staff info */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                <div className="space-y-1">
                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">Staff ID</span>
                    <span className="text-gray-800 font-semibold">{row.staff_id}</span>
                </div>
                <div className="space-y-1">
                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">Name</span>
                    <span className="text-gray-800 font-semibold">{row.name}</span>
                </div>
                <div className="space-y-1">
                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">Department</span>
                    <span className="text-gray-800">{row.department || "—"}</span>
                </div>
                <div className="space-y-1">
                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">Designation</span>
                    <span className="text-gray-800">{row.designation || "—"}</span>
                </div>
            </div>

            {/* Earnings & Deductions table */}
            <div className="grid grid-cols-2 gap-0 mb-6 border border-gray-200 rounded-lg overflow-hidden">
                <div className="border-r border-gray-200">
                    <div className="bg-gray-100 px-4 py-2 font-bold text-gray-700 uppercase tracking-widest text-[9px]">Earnings</div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Basic Salary</span>
                            <span className="font-semibold">{cur}{row.basic_salary.toLocaleString()}</span>
                        </div>
                        {row.allowances > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Allowances</span>
                                <span className="font-semibold text-green-600">+{cur}{row.allowances.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="pt-2 border-t border-gray-100 flex justify-between font-bold text-gray-800">
                            <span>Gross Earnings</span>
                            <span>{cur}{grossSalary.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="bg-gray-100 px-4 py-2 font-bold text-gray-700 uppercase tracking-widest text-[9px]">Deductions</div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">General Deductions</span>
                            <span className="font-semibold text-red-500">-{cur}{row.deductions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between opacity-0">
                            <span className="text-gray-600">—</span>
                            <span className="font-semibold">—</span>
                        </div>
                        <div className="pt-2 border-t border-gray-100 flex justify-between font-bold text-gray-800">
                            <span>Total Deductions</span>
                            <span>{cur}{row.deductions.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Final Summary */}
            <div className="bg-indigo-900 text-white rounded-lg p-6 flex justify-between items-center shadow-lg">
                <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-[.2em]">Net Salary Payable</span>
                    <p className="text-[24px] font-bold tracking-tight">{cur}{row.net_salary.toLocaleString()}</p>
                </div>
                <div className="text-right space-y-1">
                    <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Payment Status</span>
                    <p className="text-[11px] font-bold bg-white/20 px-3 py-1 rounded-full">{row.status}</p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-4 border-t border-gray-100 flex justify-between items-end">
                <div className="space-y-1">
                    <p className="text-[9px] text-gray-400 italic">Generated on {new Date().toLocaleDateString()}</p>
                    <p className="text-[9px] text-gray-500 font-medium">This is a computer-generated document.</p>
                </div>
                <div className="text-center w-32">
                    <div className="h-px bg-gray-300 w-full mb-2"></div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Accounts Manager</p>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PayrollPage() {
    const { toast } = useToast();

    // Criteria
    const [role, setRole] = useState("all");
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);

    // Table
    const [keyword, setKeyword] = useState("");
    const [perPage, setPerPage] = useState(50);
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState<PayrollRow[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);

    // School info
    const [school, setSchool] = useState<SchoolInfo>({
        school_name: "iSchool Management", address: "", phone: "", email: "", website: "", logo: "", currency: "$"
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

    // ── Fetch school settings ──────────────────────────────────────────────────
    useEffect(() => {
        api.get("/system-setting/general-setting").then(res => {
            const d = res.data?.data ?? res.data ?? {};
            setSchool({
                school_name: d.school_name ?? d.institute_name ?? "iSchool Management",
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
    const fetchPayroll = useCallback(async (pg = page, limit = perPage, kw = keyword) => {
        try {
            setLoading(true);
            const params: Record<string, string | number> = { month, year, per_page: limit, page: pg };
            if (role && role !== "all") params.role = role;
            if (kw) params.keyword = kw;

            const res = await api.get("/hr/payroll", { params });
            if (res.data?.success) {
                setRows(res.data.data ?? []);
                setMeta(res.data.meta ?? null);
                setSearched(true);
            }
        } catch {
            toast("error", "Failed to load payroll data.");
        } finally {
            setLoading(false);
        }
    }, [month, year, role, perPage, page, keyword, toast]);

    const handleSearch = () => { setPage(1); fetchPayroll(1, perPage, keyword); };

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
            const payload = {
                user_id: genRow.id,
                month,
                year,
                basic_salary: parseFloat(genForm.basic_salary) || 0,
                allowances: parseFloat(genForm.allowances) || 0,
                deductions: parseFloat(genForm.deductions) || 0,
                note: genForm.note || null,
            };

            const res = await api.post("/hr/payroll", payload);
            if (res.data?.success) {
                toast("success", `Payroll generated for ${genRow.name}`);
                setGenOpen(false);
                fetchPayroll();
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            toast("error", err.response?.data?.message || "Failed to generate payroll.");
        } finally {
            setGenSaving(false);
        }
    };

    // ── Pay ────────────────────────────────────────────────────────────────────
    const handlePay = async () => {
        if (!payRow?.payroll_id) return;
        try {
            setPayLoading(true);
            const res = await api.put(`/hr/payroll/${payRow.payroll_id}/pay`);
            if (res.data?.success) {
                toast("success", `${payRow.name} marked as Paid.`);
                setPayRow(null);
                fetchPayroll();
            }
        } catch {
            toast("error", "Failed to mark as paid.");
        } finally {
            setPayLoading(false);
        }
    };

    // ── Print ─────────────────────────────────────────────────────────────────
    const handlePrint = () => {
        const content = printRef.current?.innerHTML ?? "";
        const win = window.open("", "_blank", "width=850,height=900");
        if (!win) return;
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payslip - ${slipRow?.name}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body class="bg-white">
                ${content}
            </body>
            </html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 700);
    };

    // ── Export Functions ───────────────────────────────────────────────────────
    const handleCopy = () => {
        const text = rows.map(r => `${r.staff_id}\t${r.name}\t${r.role}\t${r.status || "Not Generated"}`).join("\n");
        navigator.clipboard.writeText("Staff ID\tName\tRole\tStatus\n" + text);
        toast("success", "Copied to clipboard!");
    };

    const handleExportCSV = () => {
        const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
            "Staff ID": r.staff_id,
            "Name": r.name,
            "Role": r.role,
            "Status": r.status || "Not Generated",
            "Net Salary": r.net_salary
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payroll");
        XLSX.writeFile(wb, `Payroll_${month}_${year}.xlsx`);
    };

    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            {/* ── Page header ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                    <Banknote className="h-5 w-5" />
                </span>
                <h1 className="text-xl font-medium text-gray-800">Payroll</h1>
            </div>

            {/* ── Select Criteria ─────────────────────────────────────────────── */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Select Criteria</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Search payroll records by role, month &amp; year</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Role <span className="text-red-500">*</span></Label>
                            <Select value={String(role)} onValueChange={setRole}>
                                <SelectTrigger className="h-10 border-gray-100 text-xs focus:ring-indigo-500 bg-white rounded-lg shadow-none">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100">
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

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Month <span className="text-red-500">*</span></Label>
                            <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                                <SelectTrigger className="h-10 border-gray-100 text-xs focus:ring-indigo-500 bg-white rounded-lg shadow-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100">
                                    {MONTHS.map(m => (
                                        <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Year <span className="text-red-500">*</span></Label>
                            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                                <SelectTrigger className="h-10 border-gray-100 text-xs focus:ring-indigo-500 bg-white rounded-lg shadow-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100">
                                    {years.map(y => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            variant="gradient"
                            className="gap-2 h-10 px-8 text-[11px] font-bold uppercase tracking-widest rounded shadow-md"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Staff List ──────────────────────────────────────────────────── */}
            {searched && (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Banknote className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Payroll List</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{meta?.total ?? rows.length} staff record{(meta?.total ?? rows.length) === 1 ? "" : "s"}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Input
                                    placeholder="Search staff..."
                                    value={keyword}
                                    onChange={e => setKeyword(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                                    className="h-8 w-64 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-lg"
                                />
                                <Button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    variant="gradient"
                                    className="h-8 px-6 text-[10px] font-bold uppercase rounded shadow-sm"
                                >
                                    Search
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); fetchPayroll(1, Number(v)); }}>
                                        <SelectTrigger className="h-7 w-14 text-[10px] border-none bg-gray-50 hover:bg-gray-100 transition-colors shadow-none rounded-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[10, 25, 50, 100].map(n => (
                                                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={handleCopy}>
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={handleExportCSV}>
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={() => window.print()}>
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors">
                                        <Columns className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-gray-100">
                                        {["Staff ID", "Name", "Role", "Department", "Designation", "Phone", "Status", "Action"].map(h => (
                                            <TableHead key={h} className={`text-[10px] font-bold uppercase text-gray-600 py-3 ${h === "Action" ? "text-right" : ""}`}>{h}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={8} />
                                    ) : rows.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">No data found</TableCell></TableRow>
                                    ) : rows.map(row => (
                                        <TableRow key={row.id} className="border-b border-gray-50 hover:bg-gray-50/20 transition-colors text-[11px]">
                                            <TableCell className="py-3 text-gray-500 font-mono">{row.staff_id}</TableCell>
                                            <TableCell className="py-3 text-gray-800 font-medium">{row.name}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{row.role}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{row.department || "—"}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{row.designation || "—"}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{row.phone || "—"}</TableCell>
                                            <TableCell className="py-3">
                                                {row.status ? (
                                                    <span className={cn(
                                                        "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm",
                                                        statusColors[row.status]
                                                    )}>
                                                        {row.status}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-300 italic">Not Generated</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => openGenerate(row)}
                                                        className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors shadow-sm"
                                                        title={row.status ? "Edit Payroll" : "Generate Payroll"}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>

                                                    {row.status && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => setSlipRow(row)}
                                                            className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors shadow-sm"
                                                            title="View Payslip"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}

                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
                                                        title="Payroll History"
                                                    >
                                                        <History className="h-3.5 w-3.5" />
                                                    </Button>

                                                    {row.status && row.status !== "Paid" && (
                                                        <Button
                                                            onClick={() => setPayRow(row)}
                                                            variant="gradient"
                                                            className="h-7 px-4 text-[10px] font-bold uppercase rounded-full shadow-md"
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

                        {/* Pagination */}
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-2">
                            <div>
                                Showing {rows.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, meta?.total || 0)} of {meta?.total || 0} entries
                            </div>
                            <div className="flex gap-2 items-center">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"
                                    disabled={page === 1}
                                    onClick={() => { setPage(page - 1); fetchPayroll(page - 1); }}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {Array.from({ length: meta?.last_page || 1 }).map((_, i) => {
                                    const p = i + 1;
                                    const isCurrent = p === page;
                                    const isAdjacent = Math.abs(p - page) <= 1;
                                    const isEdge = p === 1 || p === (meta?.last_page || 1);

                                    if (isCurrent || isAdjacent || isEdge) {
                                        return (
                                            <Button
                                                key={p}
                                                size="sm"
                                                className={cn(
                                                    "h-8 w-8 rounded-[10px] font-bold shadow-sm transition-all",
                                                    isCurrent
                                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white"
                                                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                                                )}
                                                onClick={() => { setPage(p); fetchPayroll(p); }}
                                            >
                                                {p}
                                            </Button>
                                        );
                                    } else if (p === 2 && page > 4) {
                                        return <span key={p} className="text-gray-400">...</span>;
                                    } else if (p === (meta?.last_page || 1) - 1 && page < (meta?.last_page || 1) - 3) {
                                        return <span key={p} className="text-gray-400">...</span>;
                                    }
                                    return null;
                                })}

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"
                                    disabled={page === (meta?.last_page || 1) || !meta}
                                    onClick={() => { setPage(page + 1); fetchPayroll(page + 1); }}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty state */}
            {!searched && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300 bg-white rounded-lg border border-dashed border-gray-200">
                    <DollarSign className="h-16 w-16 mb-4 opacity-10" />
                    <p className="text-[12px] font-medium uppercase tracking-[.2em] text-gray-400">No Data Selected</p>
                    <p className="text-[11px] text-gray-400 mt-2 italic">Select role, month and year, then click search.</p>
                </div>
            )}

            {/* ── Generate Payroll Dialog ──────────────────────────────────────── */}
            <Dialog open={genOpen} onOpenChange={setGenOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 font-sans border-0 shadow-2xl overflow-hidden gap-0 rounded-lg">
                    <DialogHeader className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] p-5 text-white">
                        <div className="flex justify-between items-center w-full pr-6">
                            <div className="space-y-0.5">
                                <DialogTitle className="text-sm font-bold uppercase tracking-wider">
                                    {genRow?.payroll_id ? "Edit" : "Generate"} Payroll
                                </DialogTitle>
                                <p className="text-[10px] opacity-80 font-medium">{genRow?.name} • {MONTHS.find(m => m.value === month)?.label} {year}</p>
                            </div>
                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <DollarSign className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Basic Salary <span className="text-red-500">*</span></Label>
                                <Input
                                    type="number"
                                    value={genForm.basic_salary}
                                    onChange={e => setGenForm(prev => ({ ...prev, basic_salary: e.target.value }))}
                                    className="h-10 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                    placeholder="Enter amount"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 text-green-600">Allowances</Label>
                                    <Input
                                        type="number"
                                        value={genForm.allowances}
                                        onChange={e => setGenForm(prev => ({ ...prev, allowances: e.target.value }))}
                                        className="h-10 text-xs border-gray-100 bg-green-50/30 focus-visible:ring-green-500 rounded-lg shadow-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 text-red-500">Deductions</Label>
                                    <Input
                                        type="number"
                                        value={genForm.deductions}
                                        onChange={e => setGenForm(prev => ({ ...prev, deductions: e.target.value }))}
                                        className="h-10 text-xs border-gray-100 bg-red-50/30 focus-visible:ring-red-500 rounded-lg shadow-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-900 rounded-lg p-4 flex justify-between items-center shadow-inner overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12"></div>
                            <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-[.2em]">Net Calculated</span>
                                <p className="text-[20px] font-bold text-white tracking-tight">
                                    {school.currency || "$"}{(
                                        (parseFloat(genForm.basic_salary) || 0) +
                                        (parseFloat(genForm.allowances) || 0) -
                                        (parseFloat(genForm.deductions) || 0)
                                    ).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Notes</Label>
                            <Input
                                value={genForm.note}
                                onChange={e => setGenForm(prev => ({ ...prev, note: e.target.value }))}
                                className="h-10 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                placeholder="Optional remark"
                            />
                        </div>
                    </div>

                    <DialogFooter className="bg-gray-50 p-4 border-t border-gray-100">
                        <Button variant="ghost" className="h-10 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-transparent" onClick={() => setGenOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleGenerate}
                            disabled={genSaving || !genForm.basic_salary}
                            variant="gradient"
                            className="h-10 px-8 text-xs font-bold uppercase tracking-widest rounded-lg shadow-md gap-2"
                        >
                            {genSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {genRow?.payroll_id ? "Update Payroll" : "Generate Now"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Confirm Pay Dialog ───────────────────────────────────────────── */}
            <Dialog open={!!payRow} onOpenChange={() => setPayRow(null)}>
                <DialogContent className="sm:max-w-[400px] p-6 rounded-lg border-0 shadow-2xl">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mb-2">
                            <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-lg font-bold text-gray-800">Confirm Payment</DialogTitle>
                            <p className="text-xs text-gray-500 max-w-[280px]">
                                Are you sure you want to mark <strong>{payRow?.name}</strong>&apos;s payroll as Paid?
                            </p>
                        </div>

                        <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-100">
                            <div className="flex justify-between text-[11px] text-gray-500">
                                <span>Period</span>
                                <span className="font-bold text-gray-800">{MONTHS.find(m => m.value === month)?.label} {year}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-gray-500">
                                <span>Net Salary</span>
                                <span className="font-bold text-indigo-600">{school.currency || "$"}{payRow?.net_salary?.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full pt-4">
                            <Button variant="outline" className="h-11 text-xs font-bold uppercase tracking-widest rounded-lg border-gray-200" onClick={() => setPayRow(null)}>No, Cancel</Button>
                            <Button
                                onClick={handlePay}
                                disabled={payLoading}
                                variant="gradient"
                                className="h-11 text-xs font-bold uppercase tracking-widest rounded-lg shadow-lg gap-2"
                            >
                                {payLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Yes, Confirm
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── View Payslip Dialog ──────────────────────────────────────────── */}
            <Dialog open={!!slipRow} onOpenChange={() => setSlipRow(null)}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 shadow-2xl rounded-lg">
                    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white">
                        <DialogTitle className="text-sm font-bold uppercase tracking-[.2em]">Salary Payslip Details</DialogTitle>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSlipRow(null)}
                            className="h-8 w-8 hover:bg-white/10 text-white border-none rounded-full"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div ref={printRef} className="overflow-y-auto max-h-[70vh] bg-white">
                        {slipRow && (
                            <Payslip
                                row={slipRow}
                                month={month}
                                year={year}
                                school={school}
                            />
                        )}
                    </div>

                    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <p className="text-[10px] text-gray-400 font-medium">Verify all details before printing or sending.</p>
                        <div className="flex gap-2">
                            <Button variant="outline" className="h-10 px-6 text-[11px] font-bold uppercase tracking-widest rounded-lg" onClick={() => setSlipRow(null)}>Close</Button>
                            <Button
                                onClick={handlePrint}
                                variant="gradient"
                                className="h-10 px-8 text-[11px] font-bold uppercase tracking-widest rounded-lg shadow-md gap-2"
                            >
                                <Printer className="h-4 w-4" />
                                Print Payslip
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
