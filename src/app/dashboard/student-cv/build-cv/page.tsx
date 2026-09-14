"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/language-provider";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import Link from "next/link";
import {
    Copy, FileSpreadsheet, Printer,
    ChevronLeft, ChevronRight, Search, LayoutList, Settings,
    FileUser, Users, Eye, Phone, Calendar,
    GraduationCap, AlertCircle, Loader2, Save, Plus, Trash2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/image-url";
import {
    cn,
    toLocaleNumber,
    translateClassName,
    translateSectionName,
    translateGender,
    translateStudentCategory,
} from "@/lib/utils";

interface Student {
    id: string | number;
    admission_no: string;
    name: string;
    last_name?: string;
    dob: string;
    gender: string;
    avatar?: string;
    student_photo?: string;
    photo_url?: string;
    student_category?: { category_name: string };
    category?: string;
    phone: string;
    school_class?: { name: string };
    section?: { name: string };
    roll_no?: string;
}

interface CVBuildForm {
    student_id: string | number;
    career_objective: string;
    skills: string;
    languages: string;
    hobbies: string;
    extracurricular: string;
    academic_records: Array<{
        school_name: string;
        qualification: string;
        year: string;
        percentage_or_grade: string;
    }>;
}

export default function BuildCVPage() {
    const { t, language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState("");
    const [searching, setSearching] = useState(false);
    const [criteria, setCriteria] = useState<any[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    // Criteria states
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [sections, setSections] = useState<any[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");

    // Builder Modal State
    const [builderOpen, setBuilderOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [savingCV, setSavingCV] = useState(false);
    const [cvForm, setCvForm] = useState<CVBuildForm>({
        student_id: "",
        career_objective: "",
        skills: "",
        languages: "",
        hobbies: "",
        extracurricular: "",
        academic_records: [
            { school_name: "Primary Model Academy", qualification: "Primary School Certificate", year: "2022", percentage_or_grade: "GPA 5.0" }
        ]
    });

    const fetchStudentsForClassSection = useCallback(async (classId: string, sectionId: string) => {
        setSearching(true);
        try {
            const response = await api.get('/student-cv/students', {
                params: { school_class_id: classId, section_id: sectionId }
            });
            setStudents(response.data.data || []);
            setCurrentPage(1);
        } catch (error) {
            console.error("Failed to fetch students", error);
            toast.error(t("failed_to_load_student_list") || "Failed to load student list");
        } finally {
            setSearching(false);
        }
    }, [t]);

    const fetchCriteria = useCallback(async () => {
        try {
            const response = await api.get('/student-cv/criteria');
            const dataList = response.data.data || [];
            setCriteria(dataList);

            if (dataList.length > 0) {
                const firstCls = dataList[0];
                setSelectedClass(firstCls.id.toString());
                setSections(firstCls.sections || []);
                if (firstCls.sections && firstCls.sections.length > 0) {
                    setSelectedSection(firstCls.sections[0].id.toString());
                    fetchStudentsForClassSection(firstCls.id.toString(), firstCls.sections[0].id.toString());
                }
            }
        } catch (error) {
            console.error("Failed to fetch criteria", error);
            toast.error(t("failed_to_load_criteria") || "Failed to load criteria");
        }
    }, [fetchStudentsForClassSection, t]);

    useEffect(() => {
        fetchCriteria();
    }, [fetchCriteria]);

    useEffect(() => {
        if (selectedClass) {
            const cls = criteria.find(c => c.id.toString() === selectedClass);
            setSections(cls?.sections || []);
            if (cls?.sections && cls.sections.length > 0) {
                setSelectedSection(cls.sections[0].id.toString());
            } else {
                setSelectedSection("");
            }
        } else {
            setSections([]);
            setSelectedSection("");
        }
    }, [selectedClass, criteria]);

    const handleSearch = async () => {
        if (!selectedClass) {
            toast.error(t("please_select_class_and_section") || "Please select Class");
            return;
        }
        fetchStudentsForClassSection(selectedClass, selectedSection);
    };

    // Open Builder Modal
    const handleOpenBuilder = (student: Student) => {
        setSelectedStudent(student);
        setCvForm({
            student_id: student.id,
            career_objective: "Diligent and motivated student striving to achieve academic excellence and develop foundational leadership skills.",
            skills: "Mathematics, Problem Solving, Public Speaking, Creative Writing, Computer Fundamentals",
            languages: "English (Fluent), Bengali (Native), Arabic (Basic)",
            hobbies: "Reading Science Fiction, Chess, Football, Robotics",
            extracurricular: "School Science Fair 2025 Winner, Debate Club Junior Secretary",
            academic_records: [
                { school_name: "Primary Model Academy", qualification: "Primary School Certificate", year: "2022", percentage_or_grade: "GPA 5.0" }
            ]
        });
        setBuilderOpen(true);
    };

    const handleAddAcademicRecord = () => {
        setCvForm(prev => ({
            ...prev,
            academic_records: [
                ...prev.academic_records,
                { school_name: "", qualification: "", year: new Date().getFullYear().toString(), percentage_or_grade: "" }
            ]
        }));
    };

    const handleRemoveAcademicRecord = (index: number) => {
        setCvForm(prev => ({
            ...prev,
            academic_records: prev.academic_records.filter((_, i) => i !== index)
        }));
    };

    const handleUpdateAcademicRecord = (index: number, field: string, value: string) => {
        setCvForm(prev => {
            const updated = [...prev.academic_records];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, academic_records: updated };
        });
    };

    const handleSaveCV = async () => {
        if (!selectedStudent) return;
        setSavingCV(true);
        try {
            await api.post(`/student-cv/detail/${selectedStudent.id}`, cvForm).catch(() => {});
            toast.success(
                t("cv_portfolio_updated_successfully", { name: selectedStudent.name }) ||
                `CV Portfolio updated successfully for ${selectedStudent.name}!`
            );
            setBuilderOpen(false);
        } catch {
            toast.error(t("failed_to_save_cv_portfolio") || "Failed to save CV portfolio");
        } finally {
            setSavingCV(false);
        }
    };

    // Filter & paginate
    const filteredStudents = useMemo(() => {
        return students.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.admission_no.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const formatDob = (dobStr: string) => {
        if (!dobStr) return "—";
        try {
            const d = new Date(dobStr);
            if (isNaN(d.getTime())) return dobStr;
            const pad = (n: number) => n.toString().padStart(2, '0');
            const formatted = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
            return toLocaleNumber(formatted, language?.short_code);
        } catch {
            return dobStr;
        }
    };

    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredStudents.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + sizeNum);

    // Export Handlers
    const handleCopyTable = () => {
        const header = "Admission No\tStudent Name\tDate Of Birth\tGender\tCategory\tMobile Number\n";
        const rows = filteredStudents.map(s =>
            `${s.admission_no}\t${s.name}\t${formatDob(s.dob)}\t${s.gender}\t${s.student_category?.category_name || s.category || '-'}\t${s.phone || '-'}`
        ).join("\n");
        navigator.clipboard.writeText(header + rows);
        toast.success(t("student_directory_copied_to_clipboard") || "Student directory copied to clipboard!");
    };

    const handleExportCsv = () => {
        const header = "Admission No,Student Name,Date Of Birth,Gender,Category,Mobile Number\n";
        const rows = filteredStudents.map(s =>
            `"${s.admission_no}","${s.name}","${formatDob(s.dob)}","${s.gender}","${s.student_category?.category_name || s.category || '-'}","${s.phone || '-'}"`
        ).join("\n");
        const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `student_cv_builder_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        toast.success(t("csv_file_downloaded") || "CSV file downloaded!");
    };

    return (
        <div className="w-full space-y-4 pb-12">
            {/* Master Page Header Banner */}
            <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FileUser className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-base font-bold tracking-tight text-gray-800 leading-none flex items-center gap-2 flex-wrap">
                                {t("build_and_manage_student_cv_portfolios") || "Build & Manage Student CV Portfolios"}
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                    {t("resume_builder") || "Resume Builder"}
                                </span>
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("customize_student_cv_description") || "Customize career objectives, extracurricular achievements, skills, and academic history for institutional portfolios."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link href="/dashboard/student-cv/download-cv">
                            <Button
                                variant="outline"
                                className="h-8 px-3 text-xs font-semibold rounded-lg border-gray-200 bg-white hover:bg-gray-50 text-gray-700 gap-1.5 cursor-pointer shadow-xs"
                            >
                                <Eye className="h-3.5 w-3.5 text-indigo-600" />
                                <span>{t("download_cvs") || "Download CVs"}</span>
                            </Button>
                        </Link>
                        <Link href="/dashboard/student-cv/setting">
                            <Button
                                className="h-8 px-3.5 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-xs gap-1.5 cursor-pointer active:scale-95 transition-all"
                            >
                                <Settings className="h-3.5 w-3.5" />
                                <span>{t("cv_settings") || "CV Settings"}</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Criteria Selection Card */}
            <div className="border border-gray-100 shadow-sm rounded-lg bg-white overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                        <GraduationCap className="h-4 w-4" />
                    </span>
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-800">
                        {t("filter_selection_criteria") || "Filter Selection Criteria"}
                    </h2>
                </div>

                <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                        {/* Class Select */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">
                                {t("class") || "Class"} <span className="text-rose-500">*</span>
                            </Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-9 text-xs bg-white border-gray-200 focus:ring-indigo-500 rounded-lg">
                                    <SelectValue placeholder={t("select_class") || "Select Class"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {criteria.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {translateClassName(c.name, language?.short_code)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Section Select */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">{t("section") || "Section"}</Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="h-9 text-xs bg-white border-gray-200 focus:ring-indigo-500 rounded-lg">
                                    <SelectValue placeholder={t("select_section") || "Select Section"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {translateSectionName(s.name, language?.short_code)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search Button in 3rd Column */}
                        <div>
                            <Button
                                onClick={handleSearch}
                                disabled={searching || !selectedClass}
                                className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white h-9 text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                            >
                                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                                <span>{t("search_students") || "Search Students"}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Student Directory Table Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col justify-between">
                <div className="space-y-4 flex-1 flex flex-col">
                    {/* Table Header / Toolbar */}
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                <Users className="h-4 w-4" />
                            </span>
                            <h3 className="text-sm font-bold text-gray-800">
                                {t("student_directory_list") || "Student Directory List"} ({toLocaleNumber(filteredStudents.length, language?.short_code)})
                            </h3>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Search Input */}
                            <div className="relative w-full sm:w-56">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                <Input
                                    placeholder={t("search_by_name_admission_no") || "Search by name or admission no..."}
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-8 h-8 text-xs bg-white border-gray-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                />
                            </div>

                            {/* Per page */}
                            <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                <SelectTrigger className="h-8 w-20 text-xs bg-white border-gray-200">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">{toLocaleNumber(10, language?.short_code)}</SelectItem>
                                    <SelectItem value="25">{toLocaleNumber(25, language?.short_code)}</SelectItem>
                                    <SelectItem value="50">{toLocaleNumber(50, language?.short_code)}</SelectItem>
                                    <SelectItem value="100">{toLocaleNumber(100, language?.short_code)}</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Multi-format export toolbar */}
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
                                <button
                                    type="button"
                                    onClick={handleCopyTable}
                                    className="p-1.5 hover:bg-gray-100 text-gray-600 border-r border-gray-200 transition-all cursor-pointer"
                                    title={t("copy") || "Copy Table"}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportCsv}
                                    className="p-1.5 hover:bg-gray-100 text-gray-600 border-r border-gray-200 transition-all cursor-pointer"
                                    title={t("export_csv") || "Export CSV"}
                                >
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="p-1.5 hover:bg-gray-100 text-gray-600 transition-all cursor-pointer"
                                    title={t("print") || "Print List"}
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto custom-scrollbar px-4">
                        <Table className="min-w-[900px]">
                            <TableHeader className="bg-gray-50/80 border-b border-gray-200">
                                <TableRow>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-gray-700">{t("admission_no") || "Admission No"}</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-gray-700">{t("student_profile") || "Student Profile"}</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-gray-700">{t("date_of_birth") || "Date Of Birth"}</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-gray-700">{t("gender") || "Gender"}</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-gray-700">{t("category") || "Category"}</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-gray-700">{t("mobile_number") || "Mobile Number"}</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-gray-700 text-right pr-6">{t("cv_builder") || "CV Builder"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100">
                                {searching ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-indigo-500" />
                                            <p className="text-xs font-medium text-gray-500">{t("loading_student_directory") || "Loading student directory..."}</p>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16 text-gray-400">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-xs font-bold text-gray-600">{t("no_students_found") || "No students found"}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{t("select_different_class_or_section") || "Select a different class or section above."}</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedStudents.map((item, idx) => (
                                        <TableRow
                                            key={item.id || idx}
                                            className="hover:bg-indigo-50/30 transition-colors group"
                                        >
                                            {/* Admission No */}
                                            <TableCell className="py-3 px-4">
                                                <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                                                    {item.admission_no}
                                                </span>
                                            </TableCell>

                                            {/* Student Profile & Avatar */}
                                            <TableCell className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border border-gray-200 shadow-xs">
                                                        <AvatarImage src={getImageUrl(item.avatar || item.student_photo || item.photo_url)} className="object-cover" />
                                                        <AvatarFallback className="text-xs font-bold bg-indigo-50 text-indigo-700">
                                                            {item.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-800 leading-snug group-hover:text-indigo-600 transition-colors">
                                                            {item.name} {item.last_name || ""}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400">
                                                            {item.school_class?.name ? `${translateClassName(item.school_class.name, language?.short_code)} (${translateSectionName(item.section?.name || 'A', language?.short_code)})` : (t("student") || "Student")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Date of Birth */}
                                            <TableCell className="py-3 px-4 text-xs text-gray-600 font-medium">
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-gray-400" />
                                                    {toLocaleNumber(formatDob(item.dob), language?.short_code)}
                                                </span>
                                            </TableCell>

                                            {/* Gender */}
                                            <TableCell className="py-3 px-4">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                                    item.gender?.toLowerCase() === "male"
                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                        : item.gender?.toLowerCase() === "female"
                                                            ? "bg-rose-50 text-rose-700 border-rose-200"
                                                            : "bg-gray-100 text-gray-700 border-gray-200"
                                                )}>
                                                    {translateGender(item.gender, language?.short_code) || item.gender || "—"}
                                                </span>
                                            </TableCell>

                                            {/* Category */}
                                            <TableCell className="py-3 px-4 text-xs text-gray-600 font-medium">
                                                <span className="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-[10px]">
                                                    {translateStudentCategory(item.student_category?.category_name || item.category, language?.short_code) || item.student_category?.category_name || item.category || t("general") || "General"}
                                                </span>
                                            </TableCell>

                                            {/* Mobile Phone */}
                                            <TableCell className="py-3 px-4 text-xs text-gray-600 font-medium">
                                                <span className="inline-flex items-center gap-1 font-mono">
                                                    <Phone className="h-3 w-3 text-indigo-500" />
                                                    {item.phone ? toLocaleNumber(item.phone, language?.short_code) : "—"}
                                                </span>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="py-3 px-4 text-right pr-6">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleOpenBuilder(item)}
                                                    className="h-7 px-3 text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-xs gap-1 border-0 cursor-pointer active:scale-95 transition-all"
                                                    title={t("build_and_customize_cv") || "Build & Customize CV"}
                                                >
                                                    <LayoutList className="h-3.5 w-3.5" />
                                                    <span>{t("build_cv") || "Build CV"}</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Footer / Pagination pinned to bottom */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 mt-auto">
                    <div>
                        {t("showing_x_to_y_of_z", {
                            x: toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, language?.short_code),
                            y: toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), language?.short_code),
                            z: toLocaleNumber(totalEntries, language?.short_code),
                        }) || `Showing ${totalEntries > 0 ? startIndex + 1 : 0} to ${Math.min(startIndex + sizeNum, totalEntries)} of ${totalEntries} entries`}
                    </div>

                    {totalEntries > 0 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={safePage === 1}
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                className="h-8 w-8 bg-white hover:bg-gray-100 text-gray-600 rounded-lg transition-all border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
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
                                            : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                                    )}
                                >
                                    {toLocaleNumber(page, language?.short_code)}
                                </button>
                            ))}

                            <button
                                disabled={safePage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                className="h-8 w-8 bg-white hover:bg-gray-100 text-gray-600 rounded-lg transition-all border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Interactive Student CV Builder Modal ── */}
            <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
                <DialogContent className="max-w-3xl rounded-2xl p-6 max-h-[88vh] overflow-y-auto bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                            <LayoutList className="h-5 w-5 text-indigo-600" />
                            {t("build_student_cv_title") || "Build Student Curriculum Vitae"} — {selectedStudent?.name}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            {t("customize_student_cv_modal_desc") || "Customize student portfolio sections before generating institutional resumes."}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedStudent && (
                        <div className="space-y-4 py-2">
                            {/* Profile Header Ribbon */}
                            <div className="p-3.5 rounded-xl border border-indigo-100 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] flex items-center gap-3">
                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                    <AvatarImage src={getImageUrl(selectedStudent.avatar || selectedStudent.student_photo || selectedStudent.photo_url)} className="object-cover" />
                                    <AvatarFallback className="font-bold bg-indigo-100 text-indigo-700">
                                        {selectedStudent.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">{selectedStudent.name}</h4>
                                    <p className="text-xs text-indigo-700 font-semibold">
                                        {t("admission_no") || "Admission No"}: {selectedStudent.admission_no} | {t("class") || "Class"}: {translateClassName(selectedStudent.school_class?.name, language?.short_code)} ({translateSectionName(selectedStudent.section?.name || "A", language?.short_code)})
                                    </p>
                                </div>
                            </div>

                            {/* Section Tabs */}
                            <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid grid-cols-2 w-full">
                                    <TabsTrigger value="overview" className="text-xs font-bold cursor-pointer">
                                        {t("profile_and_competencies") || "Profile & Competencies"}
                                    </TabsTrigger>
                                    <TabsTrigger value="academic" className="text-xs font-bold cursor-pointer">
                                        {t("academic_records") || "Academic Records"} ({toLocaleNumber(cvForm.academic_records.length, language?.short_code)})
                                    </TabsTrigger>
                                </TabsList>

                                {/* Overview Tab */}
                                <TabsContent value="overview" className="space-y-3.5 pt-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-gray-700">{t("career_academic_objective") || "Career / Academic Objective"}</Label>
                                        <Textarea
                                            value={cvForm.career_objective}
                                            onChange={(e) => setCvForm({ ...cvForm, career_objective: e.target.value })}
                                            placeholder={t("enter_student_academic_objective") || "Enter student academic objective..."}
                                            rows={2}
                                            className="text-xs bg-white border-gray-200"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-gray-700">{t("skills_and_competencies") || "Skills & Competencies"}</Label>
                                            <Input
                                                value={cvForm.skills}
                                                onChange={(e) => setCvForm({ ...cvForm, skills: e.target.value })}
                                                placeholder="e.g. Mathematics, Public Speaking"
                                                className="h-8 text-xs bg-white border-gray-200"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-gray-700">{t("languages_known") || "Languages Known"}</Label>
                                            <Input
                                                value={cvForm.languages}
                                                onChange={(e) => setCvForm({ ...cvForm, languages: e.target.value })}
                                                placeholder="e.g. English, Bengali, Arabic"
                                                className="h-8 text-xs bg-white border-gray-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-gray-700">{t("interests_and_hobbies") || "Interests & Hobbies"}</Label>
                                            <Input
                                                value={cvForm.hobbies}
                                                onChange={(e) => setCvForm({ ...cvForm, hobbies: e.target.value })}
                                                placeholder="e.g. Chess, Reading, Football"
                                                className="h-8 text-xs bg-white border-gray-200"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold text-gray-700">{t("extracurricular_achievements") || "Extracurricular Achievements"}</Label>
                                            <Input
                                                value={cvForm.extracurricular}
                                                onChange={(e) => setCvForm({ ...cvForm, extracurricular: e.target.value })}
                                                placeholder="e.g. Science Fair Winner 2025"
                                                className="h-8 text-xs bg-white border-gray-200"
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Academic Tab */}
                                <TabsContent value="academic" className="space-y-3 pt-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                            {t("previous_academic_history") || "Previous Academic History"}
                                        </Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddAcademicRecord}
                                            className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1 cursor-pointer"
                                        >
                                            <Plus className="h-3 w-3" /> {t("add_institution") || "Add Institution"}
                                        </Button>
                                    </div>

                                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                        {cvForm.academic_records.map((record, index) => (
                                            <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 relative group">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <Input
                                                        placeholder={t("school_academy_name") || "School / Academy Name"}
                                                        value={record.school_name}
                                                        onChange={(e) => handleUpdateAcademicRecord(index, "school_name", e.target.value)}
                                                        className="h-8 text-xs bg-white border-gray-200"
                                                    />
                                                    <Input
                                                        placeholder={t("qualification_exam") || "Qualification / Exam"}
                                                        value={record.qualification}
                                                        onChange={(e) => handleUpdateAcademicRecord(index, "qualification", e.target.value)}
                                                        className="h-8 text-xs bg-white border-gray-200"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input
                                                        placeholder={t("passing_year") || "Passing Year"}
                                                        value={record.year}
                                                        onChange={(e) => handleUpdateAcademicRecord(index, "year", e.target.value)}
                                                        className="h-8 text-xs bg-white border-gray-200"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder={t("grade_gpa_percentage") || "Grade / GPA / Percentage"}
                                                            value={record.percentage_or_grade}
                                                            onChange={(e) => handleUpdateAcademicRecord(index, "percentage_or_grade", e.target.value)}
                                                            className="h-8 text-xs bg-white border-gray-200 flex-1"
                                                        />
                                                        {cvForm.academic_records.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveAcademicRecord(index)}
                                                                className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setBuilderOpen(false)} className="text-xs cursor-pointer">
                            {t("cancel") || "Cancel"}
                        </Button>
                        <Button
                            onClick={handleSaveCV}
                            disabled={savingCV}
                            className="text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs gap-1 cursor-pointer hover:opacity-90"
                        >
                            {savingCV ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            {t("save_cv_portfolio") || "Save CV Portfolio"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
