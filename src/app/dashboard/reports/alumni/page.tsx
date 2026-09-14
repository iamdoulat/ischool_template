"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Search,
    GraduationCap,
    Copy,
    FileSpreadsheet,
    FileBox,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Monitor,
    Loader2,
} from "lucide-react";
import { cn, toLocaleNumber, translateClassName, translateSectionName } from "@/lib/utils";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useLanguage } from "@/components/providers/language-provider";

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <Skeleton className="h-4 rounded" style={{ width: `${55 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

interface ClassItem {
    id: number | string;
    name: string;
    sections?: { id: number | string; name: string }[];
}

interface SessionItem {
    id: number | string;
    session: string;
}

interface AlumniReportRow {
    admission_no?: string;
    student_name?: string;
    class?: string;
    class_name?: string;
    section_name?: string;
    gender?: string;
    current_email?: string;
    dob?: string;
    current_address?: string;
    occupation?: string;
    current_phone?: string;
}

function formatStudentClass(item: AlumniReportRow, langCode: string): string {
    if (item.class_name) {
        const c = translateClassName(item.class_name, langCode);
        const s = item.section_name ? ` (${translateSectionName(item.section_name, langCode)})` : "";
        return `${c}${s}`;
    }
    if (item.class && item.class !== "-") {
        const match = item.class.match(/^(.+?)\s*\((.+?)\)$/);
        if (match) {
            const c = translateClassName(match[1].trim(), langCode);
            const s = translateSectionName(match[2].trim(), langCode);
            return `${c} (${s})`;
        }
        return translateClassName(item.class, langCode);
    }
    return "-";
}

function translateGender(gender: string | null | undefined, t: (k: string) => string): string {
    if (!gender || gender === "-") return "-";
    const lower = gender.toLowerCase().trim();
    if (lower === "male") return t("male") || "Male";
    if (lower === "female") return t("female") || "Female";
    if (lower === "other") return t("other") || "Other";
    return t(lower) || gender;
}

function formatDateDMY(dateStr: string | null | undefined, langCode: string): string {
    if (!dateStr || dateStr === "-") return "-";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = String(d.getFullYear());
        return `${toLocaleNumber(day, langCode)}/${toLocaleNumber(month, langCode)}/${toLocaleNumber(year, langCode)}`;
    } catch {
        return dateStr;
    }
}

export default function AlumniReportPage() {
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const [searchTerm, setSearchTerm] = useState("");

    // Criteria Lists
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sessions, setSessions] = useState<SessionItem[]>([]);

    // Selected Criteria Values
    const [selectedSession, setSelectedSession] = useState<string>("all");
    const [selectedClass, setSelectedClass] = useState<string>("all");
    const [selectedSection, setSelectedSection] = useState<string>("all");

    // Report Result States
    const [reportList, setReportList] = useState<AlumniReportRow[]>([]);
    const [isSearched, setIsSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");

    // Fetch Criteria Parameters on Mount
    useEffect(() => {
        const fetchCriteria = async () => {
            try {
                const response = await api.get("/reports/alumni/criteria");
                setClasses(response.data.classes || []);
                setSessions(response.data.sessions || []);
            } catch (error) {
                console.error("Failed to fetch criteria", error);
                toast.error(t("failed_to_load_report") || "Failed to load criteria parameters");
            }
        };
        fetchCriteria();
    }, [t]);

    // Search Report Action
    const handleSearch = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (selectedSession !== "all") params.session_id = selectedSession;
            if (selectedClass !== "all") params.class_id = selectedClass;
            if (selectedSection !== "all") params.section_id = selectedSection;

            const response = await api.get("/reports/alumni/search", { params });
            setReportList(response.data.data || []);
            setIsSearched(true);
            setCurrentPage(1);
            toast.success(t("report_loaded_successfully") || "Alumni Report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch alumni report", error);
            toast.error(t("failed_to_load_report") || "Failed to load alumni report");
        } finally {
            setLoading(false);
        }
    };

    // Filtered Report logic based on searchTerm
    const filteredReport = reportList.filter((item) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            (item.admission_no || "").toLowerCase().includes(lower) ||
            (item.student_name || "").toLowerCase().includes(lower) ||
            (item.class || "").toLowerCase().includes(lower) ||
            (item.gender || "").toLowerCase().includes(lower) ||
            (item.current_email || "").toLowerCase().includes(lower) ||
            (item.dob || "").toLowerCase().includes(lower) ||
            (item.current_address || "").toLowerCase().includes(lower) ||
            (item.occupation || "").toLowerCase().includes(lower) ||
            (item.current_phone || "").toLowerCase().includes(lower)
        );
    });

    // Available sections based on selectedClass
    const availableSections = selectedClass === "all"
        ? []
        : (classes.find(c => c.id.toString() === selectedClass)?.sections || []);

    const handleClassChange = (classId: string) => {
        setSelectedClass(classId);
        setSelectedSection("all");
    };

    // Pagination calculations
    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredReport.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    const paginatedReportList = filteredReport.slice(startIndex, startIndex + sizeNum);

    // Export helpers
    const exportToCopy = () => {
        if (filteredReport.length === 0) { toast.error(t("no_data_available_in_table") || "No data to copy"); return; }
        const text = [
            "Admission No\tStudent Name\tClass\tGender\tCurrent Email\tDOB\tCurrent Address\tOccupation\tCurrent Phone",
            ...filteredReport.map((r) => `${r.admission_no}\t${r.student_name}\t${r.class}\t${r.gender}\t${r.current_email}\t${r.dob}\t${r.current_address}\t${r.occupation}\t${r.current_phone}`)
        ].join("\n");
        navigator.clipboard.writeText(text);
        toast.success(t("copied_to_clipboard") || "Copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        if (filteredReport.length === 0) { toast.error(t("no_data_available_in_table") || "No data to export"); return; }
        const mapped = filteredReport.map((r) => ({
            "Admission No": r.admission_no,
            "Student Name": r.student_name,
            "Class": r.class,
            "Gender": r.gender,
            "Current Email": r.current_email,
            "DOB": r.dob,
            "Current Address": r.current_address,
            "Occupation": r.occupation,
            "Current Phone": r.current_phone,
        }));
        const ws = XLSX.utils.json_to_sheet(mapped);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Alumni Report");
        if (isCsv) { XLSX.writeFile(wb, "alumni_report.csv", { bookType: "csv" }); toast.success(t("csv_downloaded") || "CSV downloaded"); }
        else { XLSX.writeFile(wb, "alumni_report.xlsx"); toast.success(t("excel_downloaded") || "Excel file downloaded"); }
    };

    const exportToPDF = () => {
        if (filteredReport.length === 0) { toast.error(t("no_data_available_in_table") || "No data to export"); return; }
        const doc = new jsPDF("landscape");
        const head = [["Admission No", "Student Name", "Class", "Gender", "Current Email", "DOB", "Current Address", "Occupation", "Current Phone"]];
        const body = filteredReport.map((r) => [r.admission_no, r.student_name, r.class, r.gender, r.current_email, r.dob, r.current_address, r.occupation, r.current_phone]);
        autoTable(doc, { head, body, theme: "grid" });
        doc.save("alumni_report.pdf");
        toast.success(t("pdf_downloaded") || "PDF downloaded");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 pb-20 text-xs">
            {/* Standalone Edge-to-Edge Gradient Header Banner */}
            <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm flex items-center justify-center shrink-0">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none">
                                {t("alumni_report") || "Alumni Report"}
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                {t("alumni_report_description") || "Graduated student alumni records and contact information"}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/user/profile"
                        className="flex items-center gap-1.5 h-8 px-4 rounded-full text-white text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:scale-[1.02] active:scale-95 transition-all shadow-sm shrink-0 w-fit"
                    >
                        <Monitor className="h-3.5 w-3.5" />
                        {t("student_portal_view") || "Student Portal View"}
                    </Link>
                </div>
            </div>

            {/* Tab Navigation Grid */}
            <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-200 cursor-pointer">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                            <GraduationCap className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold tracking-tight text-[#6366f1]">
                            {t("alumni_report") || "Alumni Report"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Select Criteria Section - 4-column inline responsive grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">
                    {t("select_criteria") || "Select Criteria"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            {t("pass_out_session") || "Pass Out Session"}
                        </Label>
                        <Select value={selectedSession} onValueChange={setSelectedSession}>
                            <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue>
                                    {selectedSession === "all"
                                        ? (t("all") || "All")
                                        : (sessions.find(s => s.id.toString() === selectedSession)?.session || selectedSession)}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("all") || "All"}</SelectItem>
                                {sessions.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.session}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            {t("class") || "Class"}
                        </Label>
                        <Select value={selectedClass} onValueChange={handleClassChange}>
                            <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue>
                                    {selectedClass === "all"
                                        ? (t("all_classes") || "All Classes")
                                        : (classes.find(c => c.id.toString() === selectedClass) ? translateClassName(classes.find(c => c.id.toString() === selectedClass)!.name, langCode) : selectedClass)}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("all_classes") || "All Classes"}</SelectItem>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id.toString()}>
                                        {translateClassName(cls.name, langCode)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            {t("section") || "Section"}
                        </Label>
                        <Select
                            value={selectedSection}
                            onValueChange={setSelectedSection}
                            disabled={selectedClass === "all"}
                        >
                            <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500 disabled:opacity-50">
                                <SelectValue>
                                    {selectedClass === "all"
                                        ? (t("select_class_first") || "Select Class First")
                                        : (selectedSection === "all"
                                            ? (t("all_sections") || "All Sections")
                                            : (availableSections.find(sec => sec.id.toString() === selectedSection) ? translateSectionName(availableSections.find(sec => sec.id.toString() === selectedSection)!.name, langCode) : selectedSection))}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("all_sections") || "All Sections"}</SelectItem>
                                {availableSections.map((sec) => (
                                    <SelectItem key={sec.id} value={sec.id.toString()}>
                                        {translateSectionName(sec.name, langCode)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold h-8 flex items-center justify-center gap-2 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    {t("searching") || "Searching…"}
                                </>
                            ) : (
                                <>
                                    <Search className="h-3.5 w-3.5" />
                                    {t("search") || "Search"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Alumni Report Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 overflow-hidden min-h-[420px] flex flex-col justify-between transition-all animate-fadeIn">
                <div className="space-y-4 flex-1 flex flex-col">
                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {t("alumni_report") || "Alumni Report"}
                    </h2>

                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder={t("search") || "Search..."}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{t("show") || "Show"}</span>
                                <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-14 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">{toLocaleNumber(10, langCode)}</SelectItem>
                                        <SelectItem value="25">{toLocaleNumber(25, langCode)}</SelectItem>
                                        <SelectItem value="50">{toLocaleNumber(50, langCode)}</SelectItem>
                                        <SelectItem value="100">{toLocaleNumber(100, langCode)}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" title={t("copy") || "Copy"} onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title={t("csv") || "CSV"} onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                    <FileBox className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title={t("pdf") || "PDF"} onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title={t("print") || "Print"} onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar flex-1">
                        <Table className="min-w-[1500px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">{t("admission_no") || "Admission No"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">{t("student_name") || "Student Name"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">{t("class") || "Class"} ({t("section") || "Section"}) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">{t("gender") || "Gender"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">{t("current_email") || "Current Email"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">{t("date_of_birth") || "Date of Birth"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">{t("current_address") || "Current Address"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">{t("occupation") || "Occupation"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">{t("current_phone") || "Current Phone"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton cols={9} />
                                ) : !isSearched ? (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={9} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest whitespace-nowrap">
                                                    {t("no_data_available_in_table") || "No data available in table"}
                                                </p>
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                        <GraduationCap className="h-8 w-8 text-gray-200" />
                                                    </div>
                                                </div>
                                                <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                    <span className="text-lg">←</span> {t("search_with_criteria_to_retrieve_alumni_details") || "Search with criteria to retrieve alumni details."}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedReportList.length > 0 ? (
                                    paginatedReportList.map((item, idx) => (
                                        <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                            <TableCell className="py-3 px-4 text-gray-500">{toLocaleNumber(item.admission_no, langCode)}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-700 font-medium">{item.student_name}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-700 font-medium">{formatStudentClass(item, langCode)}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{translateGender(item.gender, t)}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.current_email}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{formatDateDMY(item.dob, langCode)}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{toLocaleNumber(item.current_address, langCode)}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.occupation && item.occupation !== "-" ? (t(item.occupation) || item.occupation) : "-"}</TableCell>
                                            <TableCell className="py-3 px-4 text-right text-gray-500">{toLocaleNumber(item.current_phone, langCode)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={9} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            {t("no_items_match_the_search") || "No items match the search."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Footer Pagination pinned to bottom */}
                <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100 mt-auto gap-3">
                    <div>
                        {totalEntries === 0 ? (
                            t("showing_x_to_y_of_z", {
                                from: toLocaleNumber(0, langCode),
                                to: toLocaleNumber(0, langCode),
                                total: toLocaleNumber(0, langCode),
                                x: toLocaleNumber(0, langCode),
                                y: toLocaleNumber(0, langCode),
                                z: toLocaleNumber(0, langCode),
                            }) || `${t("showing") || "Showing"} ${toLocaleNumber(0, langCode)} ${t("to") || "to"} ${toLocaleNumber(0, langCode)} ${t("of") || "of"} ${toLocaleNumber(0, langCode)} ${t("entries") || "entries"}`
                        ) : (
                            t("showing_x_to_y_of_z", {
                                from: toLocaleNumber(startIndex + 1, langCode),
                                to: toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), langCode),
                                total: toLocaleNumber(totalEntries, langCode),
                                x: toLocaleNumber(startIndex + 1, langCode),
                                y: toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), langCode),
                                z: toLocaleNumber(totalEntries, langCode),
                            }) || `${t("showing") || "Showing"} ${toLocaleNumber(startIndex + 1, langCode)} ${t("to") || "to"} ${toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), langCode)} ${t("of") || "of"} ${toLocaleNumber(totalEntries, langCode)} ${t("entries") || "entries"}`
                        )}
                        {searchTerm && ` (${t("filtered_from") || "filtered from"} ${toLocaleNumber(reportList.length, langCode)} ${t("total_entries") || "total entries"})`}
                    </div>

                    {reportList.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={safePage === 1}
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 w-8 text-xs font-bold flex items-center justify-center cursor-pointer transition-all rounded-lg",
                                        safePage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs font-bold"
                                            : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200"
                                    )}
                                >
                                    {toLocaleNumber(page, langCode)}
                                </button>
                            ))}

                            <button
                                disabled={safePage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
