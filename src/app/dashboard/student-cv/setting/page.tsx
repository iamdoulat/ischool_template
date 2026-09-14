"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    Copy, FileSpreadsheet, FileBox, FileText, Printer,
    ChevronLeft, ChevronRight, Search, ArrowUpDown, Settings,
    FileUser, Download, Save, Sliders, CheckCircle2
} from "lucide-react";
import { cn, toLocaleNumber } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import Link from "next/link";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CvField {
    id: number;
    name: string;
    tab: 'cv_fields' | 'cv_other_fields' | 'student_panel_cv_setting';
    is_active: boolean;
}

const FIELD_NAME_KEY_MAP: Record<string, string> = {
    "last name": "last_name",
    "gender": "gender",
    "date of birth": "date_of_birth",
    "category": "category",
    "religion": "religion",
    "caste": "caste",
    "mobile number": "mobile_number",
    "email": "email",
    "student photo": "student_photo",
    "blood group": "blood_group",
    "height": "height",
    "weight": "weight",
    "father name": "father_name",
    "father phone": "father_phone",
    "father occupation": "father_occupation",
    "mother name": "mother_name",
    "mother phone": "mother_phone",
    "mother occupation": "mother_occupation",
    "guardian name": "guardian_name",
    "guardian relation": "guardian_relation",
    "guardian email": "guardian_email",
    "guardian phone": "guardian_phone",
    "guardian occupation": "guardian_occupation",
    "guardian address": "guardian_address",
    "national identification number": "national_identification_number",
    "national identification no": "national_identification_number",
    "local identification number": "local_identification_number",
    "local identification no": "local_identification_number",
    "personal details": "personal_details",
    "parent guardian detail": "parent_guardian_detail",
    "medical history": "medical_history",
    "work experience": "work_experience",
    "education/qualification": "education_qualification",
    "education qualification": "education_qualification",
    "technical skills": "technical_skills",
    "reference": "reference",
    "other details": "other_details",
    "enable download": "enable_download",
    "student login": "student_login",
    "download cv": "download_cv",
};

export default function CVSettingPage() {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'cv_fields' | 'cv_other_fields' | 'student_panel_cv_setting'>('cv_fields');
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [fields, setFields] = useState<CvField[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");

    const translateFieldName = (rawName: string): string => {
        if (!rawName) return "";
        const lower = rawName.trim().toLowerCase();
        const key = FIELD_NAME_KEY_MAP[lower];
        if (key) {
            const translated = t(key);
            if (translated && translated !== key) {
                return translated;
            }
        }
        return rawName;
    };

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/student-cv/settings');
            setFields(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch settings", error);
            toast.error(t("failed_to_load_cv_settings") || "Failed to load CV settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleToggle = async (id: number, newStatus: boolean) => {
        try {
            // Optimistic update
            setFields(prev => prev.map(f => f.id === id ? { ...f, is_active: newStatus } : f));
            
            await api.post('/student-cv/settings/toggle', {
                id,
                is_active: newStatus
            });
            
            toast.success(t("cv_setting_updated_successfully") || "CV Setting updated successfully");
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error(t("failed_to_update_cv_setting") || "Failed to update CV Setting");
            fetchSettings();
        }
    };

    const handleSavePanelSettings = () => {
        toast.success(t("student_panel_cv_setting_saved_successfully") || "Student Panel CV Setting saved successfully");
    };

    // Filter fields by tab & search keyword
    const tabFields = useMemo(() => fields.filter(f => f.tab === activeTab), [fields, activeTab]);
    
    const filteredFields = useMemo(() => {
        return tabFields.filter(f => {
            const translated = translateFieldName(f.name);
            const lowerSearch = searchTerm.toLowerCase();
            return (
                f.name.toLowerCase().includes(lowerSearch) ||
                translated.toLowerCase().includes(lowerSearch)
            );
        });
    }, [tabFields, searchTerm]);

    // Calculate pagination variables
    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredFields.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    const paginatedFields = filteredFields.slice(startIndex, startIndex + sizeNum);

    // Export Handlers
    const exportToCopy = () => {
        if (filteredFields.length === 0) { toast.error(t("no_data_available_in_table") || "No data to copy"); return; }
        const header = "Name\tTranslated Name\tStatus\n";
        const rows = filteredFields.map(f =>
            `${f.name}\t${translateFieldName(f.name)}\t${f.is_active ? 'Active' : 'Inactive'}`
        ).join("\n");
        navigator.clipboard.writeText(header + rows);
        toast.success(t("copied_to_clipboard") || "Copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        if (filteredFields.length === 0) { toast.error(t("no_data_available_in_table") || "No data to export"); return; }
        const mapped = filteredFields.map(f => ({
            "Field Name": translateFieldName(f.name),
            "Original Name": f.name,
            "Status": f.is_active ? "Active" : "Inactive",
        }));
        const ws = XLSX.utils.json_to_sheet(mapped);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "CV Settings");
        if (isCsv) { XLSX.writeFile(wb, "cv_settings.csv", { bookType: "csv" }); toast.success(t("csv_downloaded") || "CSV downloaded"); }
        else { XLSX.writeFile(wb, "cv_settings.xlsx"); toast.success(t("excel_downloaded") || "Excel file downloaded"); }
    };

    const exportToPDF = () => {
        if (filteredFields.length === 0) { toast.error(t("no_data_available_in_table") || "No data to export"); return; }
        const doc = new jsPDF();
        const head = [["Field Name", "Original Name", "Status"]];
        const body = filteredFields.map(f => [translateFieldName(f.name), f.name, f.is_active ? "Active" : "Inactive"]);
        autoTable(doc, { head, body, theme: "grid" });
        doc.save("cv_settings.pdf");
        toast.success(t("pdf_downloaded") || "PDF downloaded");
    };

    return (
        <div className="w-full space-y-4 pb-12">
            {/* Master Page Header Banner */}
            <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Settings className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-base font-bold tracking-tight text-gray-800 leading-none flex items-center gap-2 flex-wrap">
                                {t("cv_setting") || "CV Setting"}
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Sliders className="h-3 w-3" />
                                    {t("active_monitor") || "Configuration"}
                                </span>
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("configure_cv_fields_description") || "Configure CV fields and student panel options"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link href="/dashboard/student-cv/build-cv">
                            <Button
                                variant="outline"
                                className="h-8 px-3 text-xs font-semibold rounded-lg border-gray-200 bg-white hover:bg-gray-50 text-gray-700 gap-1.5 cursor-pointer shadow-xs"
                            >
                                <FileUser className="h-3.5 w-3.5 text-indigo-600" />
                                <span>{t("build_cv") || "Build CV"}</span>
                            </Button>
                        </Link>
                        <Link href="/dashboard/student-cv/download-cv">
                            <Button
                                className="h-8 px-3.5 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-xs gap-1.5 cursor-pointer active:scale-95 transition-all"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span>{t("download_cvs") || "Download CVs"}</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs Ribbon */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-lg p-1.5 shadow-sm overflow-x-auto">
                {([
                    { id: 'cv_fields', key: 'cv_fields', label: 'CV Fields', count: fields.filter(f => f.tab === 'cv_fields').length },
                    { id: 'cv_other_fields', key: 'cv_other_fields', label: 'CV Other Fields', count: fields.filter(f => f.tab === 'cv_other_fields').length },
                    { id: 'student_panel_cv_setting', key: 'student_panel_cv_setting', label: 'Student Panel CV Setting', count: fields.filter(f => f.tab === 'student_panel_cv_setting').length },
                ] as const).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setCurrentPage(1);
                            setSearchTerm("");
                        }}
                        className={cn(
                            "px-3.5 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs font-bold"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
                        )}
                    >
                        <span>{t(tab.key) || tab.label}</span>
                        <span className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                            activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                        )}>
                            {toLocaleNumber(tab.count, language?.short_code)}
                        </span>
                    </button>
                ))}
            </div>

            {/* Settings Main Content Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-4 overflow-hidden min-h-[500px] flex flex-col justify-between">
                {activeTab === 'student_panel_cv_setting' ? (
                    /* Student Panel CV Setting Custom Form Layout */
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                    {t("student_panel_cv_setting") || "Student Panel CV Setting"}
                                </h2>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    {t("configure_cv_fields_description") || "Configure CV fields and student panel options"}
                                </p>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                                    <span>{t("auditing_fields") || "Loading fields..."}</span>
                                </div>
                            ) : (
                                <div className="space-y-3 pt-2 max-w-xl">
                                    {tabFields.map((field) => (
                                        <div
                                            key={field.id}
                                            className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-indigo-50/20 transition-colors"
                                        >
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">
                                                    {translateFieldName(field.name)}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    {field.name}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={field.is_active}
                                                onClick={() => handleToggle(field.id, !field.is_active)}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
                                                    field.is_active ? "bg-indigo-600" : "bg-gray-200"
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                                                        field.is_active ? "translate-x-5" : "translate-x-0"
                                                    )}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100 mt-auto">
                            <Button 
                                onClick={handleSavePanelSettings}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-5 h-8.5 text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer border-0 gap-1.5"
                            >
                                <Save className="h-3.5 w-3.5" />
                                <span>{t("save") || "Save"}</span>
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* CV Fields & CV Other Fields Table Layout */
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-4 flex-1 flex flex-col">
                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-3">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <Input
                                        placeholder={t("search") || "Search..."}
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="pl-8 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
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
                                                <SelectItem value="10">{toLocaleNumber(10, language?.short_code)}</SelectItem>
                                                <SelectItem value="25">{toLocaleNumber(25, language?.short_code)}</SelectItem>
                                                <SelectItem value="50">{toLocaleNumber(50, language?.short_code)}</SelectItem>
                                                <SelectItem value="100">{toLocaleNumber(100, language?.short_code)}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <Button variant="ghost" size="icon" title={t("copy") || "Copy"} onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded cursor-pointer">
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded cursor-pointer">
                                            <FileSpreadsheet className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title={t("csv") || "CSV"} onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded cursor-pointer">
                                            <FileBox className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title={t("pdf") || "PDF"} onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded cursor-pointer">
                                            <FileText className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title={t("print") || "Print"} onClick={() => window.print()} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded cursor-pointer">
                                            <Printer className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Table Layout */}
                            <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                                <Table className="min-w-[600px]">
                                    <TableHeader className="bg-gray-50/60 border-b border-gray-100">
                                        <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                            <TableHead className="py-3 px-4">{t("name") || "Name"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                            <TableHead className="py-3 px-4 text-right pr-6">{t("action") || "Action"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={2} className="text-center py-16">
                                                    <div className="flex items-center justify-center gap-2 text-gray-400">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
                                                        <span>{t("auditing_fields") || "Loading fields..."}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedFields.length === 0 ? (
                                            <TableRow className="hover:bg-transparent h-48">
                                                <TableCell colSpan={2} className="text-center py-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                                    {t("no_fields_found") || "No fields found."}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedFields.map((field) => (
                                                <TableRow
                                                    key={field.id}
                                                    className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap"
                                                >
                                                    <TableCell className="py-3.5 px-4 font-semibold text-gray-800">
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                            <span>{translateFieldName(field.name)}</span>
                                                            <span className="text-[10px] font-normal text-gray-400">({field.name})</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3.5 px-4 text-right pr-6">
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={field.is_active}
                                                            onClick={() => handleToggle(field.id, !field.is_active)}
                                                            className={cn(
                                                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
                                                                field.is_active ? "bg-indigo-600" : "bg-gray-200"
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                                                                    field.is_active ? "translate-x-5" : "translate-x-0"
                                                                )}
                                                            />
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Footer Controls Pinned to Bottom */}
                        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100 mt-auto gap-3">
                            <div>
                                {t("showing_x_to_y_of_z", {
                                    x: toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, language?.short_code),
                                    y: toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), language?.short_code),
                                    z: toLocaleNumber(totalEntries, language?.short_code),
                                }) || `Showing ${totalEntries > 0 ? startIndex + 1 : 0} to ${Math.min(startIndex + sizeNum, totalEntries)} of ${totalEntries} entries`}
                                {searchTerm && ` (${t("filtered_from") || "filtered from"} ${toLocaleNumber(tabFields.length, language?.short_code)} ${t("total_entries") || "total entries"})`}
                            </div>

                            {totalEntries > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        disabled={safePage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                        className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-400 rounded-lg transition-all border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "h-8 w-8 transition-all text-xs flex items-center justify-center cursor-pointer font-bold rounded-lg",
                                                safePage === page
                                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                                    : "bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border border-gray-200"
                                            )}
                                        >
                                            {toLocaleNumber(page, language?.short_code)}
                                        </button>
                                    ))}

                                    <button
                                        disabled={safePage === totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                        className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-400 rounded-lg transition-all border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
