"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    Send,
    ChevronsLeft,
    ChevronsRight,
    Filter,
    Users,
    Mail,
    CheckCircle2,
    Phone,
    Calendar,
    UserCheck,
    Loader2
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatDate, toLocaleNumber, translateClassName } from "@/lib/utils";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-100">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="px-4 py-3.5">
                            <div
                                className="h-4 rounded-md bg-gray-200/70 dark:bg-gray-800 animate-pulse"
                                style={{ width: `${55 + ((i * 5 + j * 11) % 40)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

interface StudentCredential {
    id: number;
    admission_no: string;
    name: string;
    last_name: string;
    dob: string;
    gender: string;
    phone: string;
    school_class?: { name: string };
    section?: { name: string };
}

interface AcademicClass {
    id: number;
    name: string;
    sections?: Section[];
}

interface Section {
    id: number;
    name: string;
}

export default function LoginCredentialsSendPage() {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const [classes, setClasses] = useState<AcademicClass[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [selectedSection, setSelectedSection] = useState<string>("");
    const [students, setStudents] = useState<StudentCredential[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [messageTo, setMessageTo] = useState<string>("student");
    const [notificationType, setNotificationType] = useState<string>("email");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [perPage, setPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchClasses = useCallback(async () => {
        try {
            const response = await api.get('/academics/classes?no_paginate=true');
            setClasses(response.data.data || response.data || []);
        } catch {
            tt.toast("error", "failed_to_fetch_classes");
        }
    }, [tt]);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const handleClassChange = (value: string) => {
        setSelectedClass(value);
        setSelectedSection("");
        const selectedClassObj = classes.find(c => String(c.id) === value);
        setSections(selectedClassObj?.sections || []);
    };

    const handleSearch = useCallback(async () => {
        if (!selectedClass || !selectedSection) {
            tt.toast("error", "please_select_class_and_section");
            return;
        }
        setLoading(true);
        setCurrentPage(1);
        try {
            const response = await api.post('/communicate/search-students', {
                class_id: selectedClass,
                section_id: selectedSection,
                search: searchTerm
            });
            setStudents(response.data.data || response.data || []);
            setSelectedStudentIds([]);
        } catch {
            tt.toast("error", "failed_to_search_students");
        } finally {
            setLoading(false);
        }
    }, [selectedClass, selectedSection, searchTerm, tt]);

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const term = searchTerm.toLowerCase();
            return !term || s.admission_no?.toLowerCase().includes(term) ||
                s.name?.toLowerCase().includes(term) ||
                `${s.name} ${s.last_name}`.toLowerCase().includes(term) ||
                s.phone?.toLowerCase().includes(term);
        });
    }, [students, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / perPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, filteredStudents.length);
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

    const isAllSelected = filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(filteredStudents.map(s => s.id));
        }
    };

    const toggleStudentSelection = (id: number) => {
        setSelectedStudentIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleSend = async () => {
        if (selectedStudentIds.length === 0) {
            tt.toast("error", "please_select_at_least_one_student");
            return;
        }
        setSending(true);
        try {
            const response = await api.post('/communicate/send-credentials', {
                student_ids: selectedStudentIds,
                message_to: messageTo,
                notification_type: notificationType
            });
            tt.success(response.data?.message || "credentials_sent_successfully");
        } catch {
            tt.toast("error", "failed_to_send_credentials");
        } finally {
            setSending(false);
        }
    };

    const handleCopy = () => {
        const text = filteredStudents.map(s => `${s.admission_no}\t${s.name} ${s.last_name || ''}\t${s.school_class?.name || ''} (${s.section?.name || ''})\t${s.phone || ''}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("student_data_copied");
    };

    const handleExportCSV = () => {
        const headers = [t("admission_no") || "Admission No", t("student_name") || "Student Name", t("class") || "Class", t("section") || "Section", t("gender") || "Gender", t("mobile_number") || "Mobile Number"];
        const rows = filteredStudents.map(s => [
            s.admission_no, 
            `${s.name} ${s.last_name || ''}`.trim(), 
            s.school_class?.name || '', 
            s.section?.name || '', 
            t(s.gender?.toLowerCase()) || s.gender || '', 
            s.phone || ''
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "students_credentials.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: t("copy") || "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: t("excel") || "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: t("csv") || "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: t("print") || "Print" },
    ];

    return (
        <div className="p-4 space-y-5 bg-gray-50/10 min-h-screen font-sans">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-indigo-100">
                        <Send className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none">{t("login_credentials_send") || "Send Login Credentials"}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("login_credentials_send_subtitle") || "Send login credentials to students and guardians"}</p>
                    </div>
                </div>
            </div>

            {/* Select Criteria Card */}
            <Card className="border border-gray-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.04)] bg-white rounded-xl overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-4 w-4" />
                    </span>
                    <div>
                        <CardTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria") || "Select Criteria"}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("choose_class_and_section") || "Select class and section to list students"}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-5 md:p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("class") || "Class"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedClass} onValueChange={handleClassChange}>
                                <SelectTrigger className="h-10 border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500/20 rounded-lg shadow-none bg-gray-50/50 hover:bg-gray-50">
                                    <SelectValue placeholder={t("select_class") || "Select Class"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-xs">{translateClassName(c.name, language?.short_code)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("section") || "Section"} <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2.5 items-center">
                                <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                                    <SelectTrigger className="h-10 border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500/20 rounded-lg shadow-none bg-gray-50/50 hover:bg-gray-50 flex-1">
                                        <SelectValue placeholder={t("select_section") || "Select Section"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sections.map(s => <SelectItem key={s.id} value={String(s.id)} className="text-xs">{t(s.name) || s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={handleSearch}
                                    disabled={loading || !selectedClass || !selectedSection}
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f57c00] hover:to-[#4f46e5] text-white gap-2 h-10 px-6 text-xs font-bold uppercase transition-all rounded-lg shadow-md shadow-indigo-200/50 active:scale-95 shrink-0"
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Search className="h-4 w-4" />
                                    )}
                                    {loading ? (t("searching") || "Searching...") : (t("search") || "Search")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dispatch Configuration & Student Table Card */}
            <Card className="border border-gray-200/80 shadow-[0_4px_24px_rgb(0,0,0,0.05)] bg-white rounded-xl overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Users className="h-4 w-4" />
                        </span>
                        <div>
                            <CardTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">{t("dispatch_configuration") || "Dispatch Configuration"}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("configure_credentials_dispatch") || "Configure message recipient and delivery channels"}</p>
                        </div>
                    </div>
                    {selectedStudentIds.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                            <span className="text-xs font-semibold text-indigo-700">
                                {toLocaleNumber(selectedStudentIds.length, language?.short_code)} {t("selected") || "selected"}
                            </span>
                        </div>
                    )}
                </CardHeader>

                <CardContent className="p-5 md:p-6 space-y-6">
                    {/* Controls Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-100">
                        {/* Select All Toggle Card */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                            <div className="space-y-0.5">
                                <Label htmlFor="select-all-checkbox" className="text-xs font-bold text-gray-700 cursor-pointer">
                                    {t("select_all") || "Select All"}
                                </Label>
                                <p className="text-[10px] text-gray-400">
                                    {selectedStudentIds.length > 0
                                        ? `${toLocaleNumber(selectedStudentIds.length, language?.short_code)} / ${toLocaleNumber(filteredStudents.length, language?.short_code)} ${t("selected") || "selected"}`
                                        : `${toLocaleNumber(filteredStudents.length, language?.short_code)} ${t("total") || "total"}`}
                                </p>
                            </div>
                            <Checkbox
                                id="select-all-checkbox"
                                checked={isAllSelected}
                                onCheckedChange={toggleSelectAll}
                                className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 h-5 w-5 rounded-md transition-all cursor-pointer"
                            />
                        </div>

                        {/* Message To */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
                                {t("message_to") || "Message To"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={messageTo} onValueChange={setMessageTo}>
                                <SelectTrigger className="h-10 border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500/20 rounded-lg bg-white shadow-none">
                                    <SelectValue placeholder={t("recipient") || "Recipient"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student" className="text-xs">{t("student") || "Student"}</SelectItem>
                                    <SelectItem value="parent" className="text-xs">{t("parent") || "Guardian / Parent"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Notification Type */}
                        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-indigo-500" />
                                {t("notification_type") || "Notification Type"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={notificationType} onValueChange={setNotificationType}>
                                <SelectTrigger className="h-10 border-gray-200 text-xs focus:ring-2 focus:ring-indigo-500/20 rounded-lg bg-white shadow-none">
                                    <SelectValue placeholder={t("method") || "Method"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email" className="text-xs">{t("email_only") || "Email Only"}</SelectItem>
                                    <SelectItem value="sms" className="text-xs">{t("sms_only") || "SMS Only"}</SelectItem>
                                    <SelectItem value="both" className="text-xs">{t("both_email_and_sms") || "Both Email & SMS"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("filter_results") || "Filter results..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 text-xs border-gray-200 focus-visible:ring-2 focus-visible:ring-indigo-500/20 rounded-lg shadow-none bg-gray-50/50 hover:bg-gray-50"
                            />
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{t("per_page") || "Per Page"}:</span>
                                <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-8 w-[72px] text-xs border-gray-200 bg-white rounded-lg shadow-none px-2.5">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="20" className="text-xs">{toLocaleNumber(20, language?.short_code)}</SelectItem>
                                        <SelectItem value="50" className="text-xs">{toLocaleNumber(50, language?.short_code)}</SelectItem>
                                        <SelectItem value="100" className="text-xs">{toLocaleNumber(100, language?.short_code)}</SelectItem>
                                        <SelectItem value="200" className="text-xs">{toLocaleNumber(200, language?.short_code)}</SelectItem>
                                        <SelectItem value="500" className="text-xs">{toLocaleNumber(500, language?.short_code)}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1 border-l border-gray-100 pl-3">
                                {toolbarActions.map((action, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        onClick={action.onClick}
                                        title={action.title}
                                        className="h-8 w-8 hover:bg-gray-100 text-gray-500 hover:text-indigo-600 rounded-lg transition-colors"
                                    >
                                        <action.Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Student Table */}
                    <div className="rounded-xl border border-gray-200/80 overflow-hidden shadow-sm bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50/90 border-b border-gray-200/80">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-12 text-center py-3.5">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={toggleSelectAll}
                                            className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 h-4 w-4 rounded"
                                        />
                                    </TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-slate-600 tracking-wider py-3.5">{t("admission_no") || "Admission No"}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-slate-600 tracking-wider py-3.5">{t("student_name") || "Student Name"}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-slate-600 tracking-wider py-3.5">{t("class_section") || "Class / Section"}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-slate-600 tracking-wider py-3.5">{t("date_of_birth") || "Date of Birth"}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-slate-600 tracking-wider py-3.5">{t("gender") || "Gender"}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-slate-600 tracking-wider py-3.5 text-right pr-6">{t("mobile_number") || "Mobile Number"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton rows={5} cols={7} />
                                ) : paginatedStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-44 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2 text-gray-400">
                                                <Users className="h-10 w-10 text-gray-300 stroke-[1.5]" />
                                                <p className="text-xs font-semibold text-gray-600">
                                                    {t("no_students_found_search_hint") || "No students found. Please select class and section or adjust your search filter."}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedStudents.map((student) => {
                                        const isSelected = selectedStudentIds.includes(student.id);
                                        const isMale = student.gender?.toLowerCase() === "male";
                                        return (
                                            <TableRow
                                                key={student.id}
                                                onClick={() => toggleStudentSelection(student.id)}
                                                className={cn(
                                                    "text-xs border-b border-gray-100 transition-colors cursor-pointer select-none",
                                                    isSelected ? "bg-indigo-50/40 hover:bg-indigo-50/60" : "hover:bg-slate-50/80"
                                                )}
                                            >
                                                <TableCell className="text-center py-3.5" onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleStudentSelection(student.id)}
                                                        className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 h-4 w-4 rounded"
                                                    />
                                                </TableCell>
                                                <TableCell className="py-3.5 font-medium text-gray-600">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-mono font-semibold">
                                                        {student.admission_no}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[11px] font-bold text-white shadow-xs">
                                                            {student.name?.charAt(0)?.toUpperCase() || "S"}
                                                        </div>
                                                        <span className="font-bold text-gray-800 tracking-tight">
                                                            {student.name} {student.last_name || ''}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3.5">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/80">
                                                        {t(student.school_class?.name || '') || student.school_class?.name}
                                                        {student.section?.name && ` (${t(student.section?.name || '') || student.section?.name})`}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3.5 text-gray-500 text-[11px]">
                                                    <span className="inline-flex items-center gap-1 text-gray-600">
                                                        <Calendar className="h-3 w-3 text-gray-400" />
                                                        {formatDate(student.dob, "dd/MM/yyyy")}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3.5">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                                                        isMale ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-pink-50 text-pink-700 border border-pink-100"
                                                    )}>
                                                        {t(student.gender?.toLowerCase()) || student.gender}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3.5 text-right pr-6">
                                                    {student.phone ? (
                                                        <span className="inline-flex items-center gap-1 font-mono font-semibold text-indigo-600">
                                                            <Phone className="h-3 w-3 text-indigo-400" />
                                                            {student.phone}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300 font-mono">-</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer / Pagination & Action Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <div className="text-xs text-gray-500 font-medium">
                            {filteredStudents.length > 0
                                ? t("showing_x_to_y_of_z", { 
                                    from: toLocaleNumber(startIndex + 1, language?.short_code), 
                                    to: toLocaleNumber(endIndex, language?.short_code), 
                                    total: toLocaleNumber(filteredStudents.length, language?.short_code) 
                                }) || `Showing ${startIndex + 1} to ${endIndex} of ${filteredStudents.length} entries`
                                : (t("no_entries_to_show") || "No entries to show")}
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={safeCurrentPage <= 1}
                                        className="h-8 w-8 rounded-lg border-gray-200 text-gray-600 disabled:opacity-30"
                                    >
                                        <ChevronsLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => setCurrentPage(safeCurrentPage - 1)}
                                        disabled={safeCurrentPage <= 1}
                                        className="h-8 w-8 rounded-lg border-gray-200 text-gray-600 disabled:opacity-30"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                        let pageNum: number;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (safeCurrentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (safeCurrentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = safeCurrentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={cn(
                                                    "h-8 min-w-[32px] px-2 text-xs font-bold rounded-lg transition-all",
                                                    pageNum === safeCurrentPage
                                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-indigo-100"
                                                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                {toLocaleNumber(pageNum, language?.short_code)}
                                            </button>
                                        );
                                    })}
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => setCurrentPage(safeCurrentPage + 1)}
                                        disabled={safeCurrentPage >= totalPages}
                                        className="h-8 w-8 rounded-lg border-gray-200 text-gray-600 disabled:opacity-30"
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={safeCurrentPage >= totalPages}
                                        className="h-8 w-8 rounded-lg border-gray-200 text-gray-600 disabled:opacity-30"
                                    >
                                        <ChevronsRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}

                            <Button
                                onClick={handleSend}
                                disabled={sending || selectedStudentIds.length === 0}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f57c00] hover:to-[#4f46e5] text-white gap-2 px-8 h-10 text-xs font-bold uppercase transition-all rounded-lg shadow-md shadow-indigo-200/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>{t("sending") || "Sending..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        <span>{t("send_credentials") || "Send Credentials"} ({toLocaleNumber(selectedStudentIds.length, language?.short_code)})</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
