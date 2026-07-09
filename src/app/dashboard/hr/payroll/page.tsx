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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PrintHeader } from "@/components/layout/PrintHeader";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import * as XLSX from 'xlsx';
import { useReactToPrint } from "react-to-print";

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

interface HistoryEntry {
    month: number;
    year: number;
    basic_salary: number | null;
    allowances: number | null;
    deductions: number | null;
    net_salary: number | null;
    status: string | null;
    paid_on: string | null;
    note: string | null;
}

interface HistoryData {
    staff: {
        id: number;
        staff_id: string;
        name: string;
        role: string;
        designation: string;
        department: string;
    };
    history: HistoryEntry[];
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

const statusColors: Record<string, string> = {
    Generated: "bg-orange-500 text-white shadow-sm",
    Paid: "bg-green-600 text-white shadow-sm",
    Unpaid: "bg-red-600 text-white shadow-sm",
};

// ─── Payslip Component ───────────────────────────────────────────────────────

function Payslip({ row, month, year, school, t }: {
    row: PayrollRow;
    month: number;
    year: number;
    school: SchoolInfo;
    t: (key: string, params?: Record<string, string | number>) => string;
}) {
    const MONTHS = [
        { label: "january", value: 1 },
        { label: "february", value: 2 },
        { label: "march", value: 3 },
        { label: "april", value: 4 },
        { label: "may", value: 5 },
        { label: "june", value: 6 },
        { label: "july", value: 7 },
        { label: "august", value: 8 },
        { label: "september", value: 9 },
        { label: "october", value: 10 },
        { label: "november", value: 11 },
        { label: "december", value: 12 },
    ];
    const monthName = t(MONTHS.find(m => m.value === month)?.label ?? "");
    const grossSalary = row.basic_salary + row.allowances;
    const cur = school.currency || "$";

    return (
        <div id="payslip-content" className="bg-white text-black p-8 text-[11px] font-sans w-full max-w-2xl mx-auto shadow-sm">
            {/* Header */}
            <PrintHeader title={t("salary_payslip")} tabName="Payslip" />
            
            <div className="flex justify-between items-center mb-6 mt-6">
                <p className="text-[14px] font-semibold text-gray-800">
                    {t("period_colon")} <span className="text-indigo-600">{monthName} {year}</span>
                </p>
                <div className="text-right">
                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest mb-0.5">{t("payslip_id")}</span>
                    <span className="font-bold text-gray-800">#{row.payroll_id ?? "—"}</span>
                </div>
            </div>

            {/* Staff info */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                <div className="space-y-1">
                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">{t("staff_id")}</span>
                    <span className="text-gray-800 font-semibold">{row.staff_id}</span>
                </div>
                <div className="space-y-1">
                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">{t("name")}</span>
                    <span className="text-gray-800 font-semibold">{row.name}</span>
                </div>
                <div className="space-y-1">
                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">{t("department_name")}</span>
                    <span className="text-gray-800">{row.department || "—"}</span>
                </div>
                <div className="space-y-1">
                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">{t("designation")}</span>
                    <span className="text-gray-800">{row.designation || "—"}</span>
                </div>
            </div>

            {/* Earnings & Deductions table */}
            <div className="grid grid-cols-2 gap-0 mb-6 border border-gray-200 rounded-lg overflow-hidden">
                <div className="border-r border-gray-200">
                    <div className="bg-gray-100 px-4 py-2 font-bold text-gray-700 uppercase tracking-widest text-[9px]">{t("earnings")}</div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">{t("basic_salary")}</span>
                            <span className="font-semibold">{cur}{row.basic_salary.toLocaleString()}</span>
                        </div>
                        {row.allowances > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t("allowances")}</span>
                                <span className="font-semibold text-green-600">+{cur}{row.allowances.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="pt-2 border-t border-gray-100 flex justify-between font-bold text-gray-800">
                            <span>{t("gross_earnings")}</span>
                            <span>{cur}{grossSalary.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="bg-gray-100 px-4 py-2 font-bold text-gray-700 uppercase tracking-widest text-[9px]">{t("deductions")}</div>
                    <div className="p-4 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">{t("general_deductions")}</span>
                            <span className="font-semibold text-red-500">-{cur}{row.deductions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between opacity-0">
                            <span className="text-gray-600">—</span>
                            <span className="font-semibold">—</span>
                        </div>
                        <div className="pt-2 border-t border-gray-100 flex justify-between font-bold text-gray-800">
                            <span>{t("total_deductions")}</span>
                            <span>{cur}{row.deductions.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Final Summary */}
            <div className="bg-indigo-900 text-white rounded-lg p-6 flex justify-between items-center shadow-lg">
                <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-[.2em]">{t("net_salary_payable")}</span>
                    <p className="text-[24px] font-bold tracking-tight">{cur}{row.net_salary.toLocaleString()}</p>
                </div>
                <div className="text-right space-y-1">
                    <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">{t("payment_status")}</span>
                    <p className="text-[11px] font-bold bg-white/20 px-3 py-1 rounded-full">{row.status}</p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-4 border-t border-gray-100 flex justify-between items-end">
                <div className="space-y-1">
                    <p className="text-[9px] text-gray-400 italic">{t("generated_on")} {new Date().toLocaleDateString()}</p>
                    <p className="text-[9px] text-gray-500 font-medium">{t("computer_generated_document")}</p>
                </div>
                <div className="text-center w-32">
                    <div className="h-px bg-gray-300 w-full mb-2"></div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t("accounts_manager")}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PayrollPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();

    // Criteria
    const [role, setRole] = useState("all");
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

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

    const [historyRow, setHistoryRow] = useState<PayrollRow | null>(null);
    const [historyData, setHistoryData] = useState<HistoryData | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);

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
            tt.error("failed_to_load_payroll");
        } finally {
            setLoading(false);
        }
    }, [month, year, role, perPage, page, keyword, tt]);

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
                tt.success("payroll_generated_for_x", { name: genRow.name });
                setGenOpen(false);
                fetchPayroll();
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_generate_payroll");
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
                tt.success("x_marked_as_paid", { name: payRow.name });
                setPayRow(null);
                fetchPayroll();
            }
        } catch {
            tt.error("failed_to_mark_paid");
        } finally {
            setPayLoading(false);
        }
    };

    // ── Print ─────────────────────────────────────────────────────────────────
    const handlePrint = useReactToPrint({ contentRef: printRef });

    // ── History ───────────────────────────────────────────────────────────
    const openHistory = async (row: PayrollRow) => {
        setHistoryRow(row);
        setHistoryData(null);
        setHistoryLoading(true);
        try {
            const res = await api.get(`/hr/payroll/history/${row.id}`);
            if (res.data?.success) {
                setHistoryData(res.data.data);
            }
        } catch {
            tt.error("failed_to_load_history");
        } finally {
            setHistoryLoading(false);
        }
    };

    // ── Export Functions ───────────────────────────────────────────────────────
    const handleCopy = () => {
        const text = rows.map(r => `${r.staff_id}\t${r.name}\t${r.role}\t${r.status || t("not_generated")}`).join("\n");
        navigator.clipboard.writeText("Staff ID\tName\tRole\tStatus\n" + text);
        tt.success("copied_to_clipboard");
    };

    const handleExportCSV = () => {
        const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
            "Staff ID": r.staff_id,
            "Name": r.name,
            "Role": r.role,
            "Status": r.status || t("not_generated"),
            "Net Salary": r.net_salary
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t("payroll"));
        XLSX.writeFile(wb, `Payroll_${month}_${year}.xlsx`);
    };

    const MONTHS = [
        { label: "january", value: 1 },
        { label: "february", value: 2 },
        { label: "march", value: 3 },
        { label: "april", value: 4 },
        { label: "may", value: 5 },
        { label: "june", value: 6 },
        { label: "july", value: 7 },
        { label: "august", value: 8 },
        { label: "september", value: 9 },
        { label: "october", value: 10 },
        { label: "november", value: 11 },
        { label: "december", value: 12 },
    ];

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            {/* ── Page header ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                    <Banknote className="h-5 w-5" />
                </span>
                <h1 className="text-xl font-medium text-gray-800">{t("payroll")}</h1>
            </div>

            {/* ── Select Criteria ─────────────────────────────────────────────── */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("search_payroll_by_role_month_year")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t("role")} <span className="text-red-500">*</span></Label>
                            <Select value={String(role)} onValueChange={setRole}>
                                <SelectTrigger className="h-10 border-gray-100 text-xs focus:ring-indigo-500 bg-white rounded-lg shadow-none">
                                    <SelectValue placeholder={t("all_roles")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100">
                                    <SelectItem value="all">{t("all_roles")}</SelectItem>
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
                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t("month")} <span className="text-red-500">*</span></Label>
                            <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                                <SelectTrigger className="h-10 border-gray-100 text-xs focus:ring-indigo-500 bg-white rounded-lg shadow-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100">
                                    {MONTHS.map(m => (
                                        <SelectItem key={m.value} value={String(m.value)}>{t(m.label)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t("year")} <span className="text-red-500">*</span></Label>
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
                            {t("search")}
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
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("payroll_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("x_staff_records", { count: meta?.total ?? rows.length })}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Input
                                    placeholder={t("search_staff")}
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
                                    {t("search")}
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
                                        {["staff_id", "name", "role", "department_name", "designation", "phone", "status", "action"].map(h => (
                                            <TableHead key={h} className={`text-[10px] font-bold uppercase text-gray-600 py-3 ${h === "action" ? "text-right" : ""}`}>{t(h)}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={8} />
                                    ) : rows.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</TableCell></TableRow>
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
                                                        {t(row.status.toLowerCase())}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-300 italic">{t("not_generated")}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => openGenerate(row)}
                                                        className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors shadow-sm"
                                                        title={row.status ? t("edit_payroll") : t("generate_payroll")}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>

                                                    {row.status && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => setSlipRow(row)}
                                                            className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors shadow-sm"
                                                            title={t("view_payslip")}
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}

                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
                                                        title={t("payroll_history")}
                                                        onClick={() => openHistory(row)}
                                                    >
                                                        <History className="h-3.5 w-3.5" />
                                                    </Button>

                                                    {row.status && row.status !== "Paid" && (
                                                        <Button
                                                            onClick={() => setPayRow(row)}
                                                            variant="gradient"
                                                            className="h-7 px-4 text-[10px] font-bold uppercase rounded-full shadow-md"
                                                        >
                                                            {t("proceed_to_pay")}
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
                                {t("showing_x_to_y_of_z", {
                                    from: rows.length === 0 ? 0 : (page - 1) * perPage + 1,
                                    to: Math.min(page * perPage, meta?.total || 0),
                                    total: meta?.total || 0
                                })}
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
                    <p className="text-[12px] font-medium uppercase tracking-[.2em] text-gray-400">{t("no_data_selected")}</p>
                    <p className="text-[11px] text-gray-400 mt-2 italic">{t("select_role_month_year_message")}</p>
                </div>
            )}

            {/* ── Generate Payroll Dialog ──────────────────────────────────────── */}
            <Dialog open={genOpen} onOpenChange={setGenOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 font-sans border-0 shadow-2xl overflow-hidden gap-0 rounded-lg">
                    <DialogHeader className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] p-5 text-white">
                        <div className="flex justify-between items-center w-full pr-6">
                            <div className="space-y-0.5">
                                <DialogTitle className="text-sm font-bold uppercase tracking-wider">
                                    {genRow?.payroll_id ? t("edit_payroll") : t("generate_payroll")}
                                </DialogTitle>
                                <p className="text-[10px] opacity-80 font-medium">{genRow?.name} • {t(MONTHS.find(m => m.value === month)?.label ?? "")} {year}</p>
                            </div>
                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <DollarSign className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t("basic_salary")} <span className="text-red-500">*</span></Label>
                                <Input
                                    type="number"
                                    value={genForm.basic_salary}
                                    onChange={e => setGenForm(prev => ({ ...prev, basic_salary: e.target.value }))}
                                    className="h-10 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                    placeholder={t("enter_amount")}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 text-green-600">{t("allowances")}</Label>
                                    <Input
                                        type="number"
                                        value={genForm.allowances}
                                        onChange={e => setGenForm(prev => ({ ...prev, allowances: e.target.value }))}
                                        className="h-10 text-xs border-gray-100 bg-green-50/30 focus-visible:ring-green-500 rounded-lg shadow-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 text-red-500">{t("deductions")}</Label>
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
                                <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-[.2em]">{t("net_calculated")}</span>
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
                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t("notes")}</Label>
                            <Input
                                value={genForm.note}
                                onChange={e => setGenForm(prev => ({ ...prev, note: e.target.value }))}
                                className="h-10 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                placeholder={t("optional_remark")}
                            />
                        </div>
                    </div>

                    <DialogFooter className="bg-gray-50 p-4 border-t border-gray-100">
                        <Button variant="ghost" className="h-10 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-transparent" onClick={() => setGenOpen(false)}>{t("cancel")}</Button>
                        <Button
                            onClick={handleGenerate}
                            disabled={genSaving || !genForm.basic_salary}
                            variant="gradient"
                            className="h-10 px-8 text-xs font-bold uppercase tracking-widest rounded-lg shadow-md gap-2"
                        >
                            {genSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {genRow?.payroll_id ? t("update_payroll") : t("generate_now")}
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
                            <DialogTitle className="text-lg font-bold text-gray-800">{t("confirm_payment")}</DialogTitle>
                            <p className="text-xs text-gray-500 max-w-[280px]">
                                {t("confirm_payment_message", { name: payRow?.name || "" })}
                            </p>
                        </div>

                        <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-100">
                            <div className="flex justify-between text-[11px] text-gray-500">
                                <span>{t("period")}</span>
                                <span className="font-bold text-gray-800">{t(MONTHS.find(m => m.value === month)?.label ?? "")} {year}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-gray-500">
                                <span>{t("net_salary")}</span>
                                <span className="font-bold text-indigo-600">{school.currency || "$"}{payRow?.net_salary?.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full pt-4">
                            <Button variant="outline" className="h-11 text-xs font-bold uppercase tracking-widest rounded-lg border-gray-200" onClick={() => setPayRow(null)}>{t("no_cancel")}</Button>
                            <Button
                                onClick={handlePay}
                                disabled={payLoading}
                                variant="gradient"
                                className="h-11 text-xs font-bold uppercase tracking-widest rounded-lg shadow-lg gap-2"
                            >
                                {payLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {t("yes_confirm")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── View Payslip Dialog ──────────────────────────────────────────── */}
            <Dialog open={!!slipRow} onOpenChange={() => setSlipRow(null)}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 shadow-2xl rounded-lg">
                    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white">
                        <DialogTitle className="text-sm font-bold uppercase tracking-[.2em]">{t("salary_payslip_details")}</DialogTitle>
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
                                t={t}
                            />
                        )}
                    </div>

                    <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <p className="text-[10px] text-gray-400 font-medium">{t("verify_details_before_print")}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" className="h-10 px-6 text-[11px] font-bold uppercase tracking-widest rounded-lg" onClick={() => setSlipRow(null)}>{t("close")}</Button>
                            <Button
                                onClick={handlePrint}
                                variant="gradient"
                                className="h-10 px-8 text-[11px] font-bold uppercase tracking-widest rounded-lg shadow-md gap-2"
                            >
                                <Printer className="h-4 w-4" />
                                {t("print_payslip")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* ── Salary History Dialog ───────────────────────────────────── */}
            <Dialog open={!!historyRow} onOpenChange={() => { setHistoryRow(null); setHistoryData(null); }}>
                <DialogContent className="w-[95vw] max-w-5xl p-0 overflow-hidden border-0 shadow-2xl rounded-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center shrink-0">
                                <History className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-bold uppercase tracking-[.15em] leading-none">
                                    {t("salary_history")}
                                </DialogTitle>
                                {historyData && (
                                    <p className="text-[11px] text-white/80 mt-0.5 font-medium">
                                        {historyData.staff.name} &bull; {historyData.staff.role}
                                        {historyData.staff.designation ? ` • ${historyData.staff.designation}` : ""}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => { setHistoryRow(null); setHistoryData(null); }}
                            className="h-8 w-8 hover:bg-white/10 text-white border-none rounded-full">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Staff Info Strip */}
                    {historyData && (
                        <div className="flex items-center gap-6 px-6 py-3 bg-indigo-50/60 border-b border-indigo-100/60">
                            <div className="text-[10px] text-gray-500">
                                <span className="font-bold uppercase tracking-widest text-gray-400 block">Staff ID</span>
                                <span className="font-bold text-gray-700">{historyData.staff.staff_id}</span>
                            </div>
                            {historyData.staff.department && (
                                <div className="text-[10px] text-gray-500">
                                    <span className="font-bold uppercase tracking-widest text-gray-400 block">{t("department_name")}</span>
                                    <span className="font-bold text-gray-700">{historyData.staff.department}</span>
                                </div>
                            )}
                            <div className="ml-auto text-[10px] text-indigo-500 font-bold uppercase tracking-widest">
                                {t("last_12_months")}
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-y-auto max-h-[60vh] bg-white">
                        {historyLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">{t("loading")}</p>
                            </div>
                        ) : historyData ? (
                            <Table>
                                <TableHeader className="bg-gray-100 sticky top-0">
                                    <TableRow className="hover:bg-transparent border-gray-200">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("month")}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">{t("basic_salary")}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">{t("allowances")}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">{t("deductions")}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">{t("net_salary")}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">{t("status")}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">{t("paid_on")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historyData.history.map((entry, idx) => {
                                        const monthNames = ["january","february","march","april","may","june","july","august","september","october","november","december"];
                                        const monthLabel = t(monthNames[entry.month - 1]) + " " + entry.year;
                                        const isCurrentMonth = entry.month === (new Date().getMonth() + 1) && entry.year === new Date().getFullYear();
                                        const hasData = entry.net_salary !== null;
                                        return (
                                            <TableRow key={idx} className={cn(
                                                "border-b border-gray-50 text-[11px] transition-colors",
                                                isCurrentMonth ? "bg-indigo-50/50" : "hover:bg-gray-50/40",
                                                !hasData ? "opacity-50" : ""
                                            )}>
                                                <TableCell className="py-3 font-medium text-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        {isCurrentMonth && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />}
                                                        {monthLabel}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 text-right text-gray-600">
                                                    {hasData ? `${school.currency}${entry.basic_salary?.toLocaleString()}` : <span className="text-gray-300 italic text-[10px]">—</span>}
                                                </TableCell>
                                                <TableCell className="py-3 text-right text-green-600 font-medium">
                                                    {hasData && (entry.allowances ?? 0) > 0 ? `+${school.currency}${entry.allowances?.toLocaleString()}` : <span className="text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell className="py-3 text-right text-red-500 font-medium">
                                                    {hasData && (entry.deductions ?? 0) > 0 ? `-${school.currency}${entry.deductions?.toLocaleString()}` : <span className="text-gray-300">—</span>}
                                                </TableCell>
                                                <TableCell className="py-3 text-right font-bold text-gray-800">
                                                    {hasData ? `${school.currency}${entry.net_salary?.toLocaleString()}` : <span className="text-gray-300 italic text-[10px]">Not Generated</span>}
                                                </TableCell>
                                                <TableCell className="py-3 text-center">
                                                    {entry.status ? (
                                                        <span className={cn(
                                                            "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter",
                                                            statusColors[entry.status]
                                                        )}>{t(entry.status.toLowerCase())}</span>
                                                    ) : (
                                                        <span className="text-gray-300 text-[10px]">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-3 text-center text-gray-500 text-[10px]">
                                                    {entry.paid_on ?? <span className="text-gray-300">—</span>}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end items-center px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <Button variant="gradient" className="h-9 px-8 text-[11px] font-bold uppercase tracking-widest rounded-lg shadow-md"
                            onClick={() => { setHistoryRow(null); setHistoryData(null); }}>
                            {t("close")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
