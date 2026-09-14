/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import {
    Search,
    FileText,
    PieChart,
    Users,
    UserPlus,
    ClipboardList,
    BookOpen,
    Key,
    GraduationCap,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Eye,
    Monitor,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn, toLocaleNumber, translateClassName, translateSectionName } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/components/providers/language-provider";

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <Skeleton
                                className="h-4 rounded"
                                style={{ width: `${55 + ((i * 3 + j * 7) % 35)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

interface ReportLink {
    id: string;
    key: string;
    icon: typeof FileText;
    active?: boolean;
}

const reportLinks: { group: ReportLink[] }[] = [
    {
        group: [
            { id: "Student Report", key: "student_report", icon: FileText, active: true },
            { id: "Student History", key: "student_history", icon: ClipboardList },
            { id: "Class Subject Report", key: "class_subject_report", icon: BookOpen },
            { id: "Student Profile", key: "student_profile", icon: UserPlus },
            { id: "Online Admission Report", key: "online_admission_report", icon: GraduationCap },
        ],
    },
    {
        group: [
            { id: "Class & Section Report", key: "class_and_section_report", icon: ClipboardList },
            { id: "Student Login Credential", key: "student_login_credential", icon: Key },
            { id: "Admission Report", key: "admission_report", icon: FileText },
            { id: "Student Gender Ratio Report", key: "student_gender_ratio_report", icon: PieChart },
        ],
    },
    {
        group: [
            { id: "Guardian Report", key: "guardian_report", icon: Users },
            { id: "Parent Login Credential", key: "parent_login_credential", icon: Key },
            { id: "Sibling Report", key: "sibling_report", icon: Users },
            { id: "Student Teacher Ratio Report", key: "student_teacher_ratio_report", icon: Users },
        ],
    },
];

export default function StudentInformationReportPage() {
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";

    // Data states
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);

    // Filter states
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedGender, setSelectedGender] = useState("all");
    const [selectedRte, setSelectedRte] = useState("all");

    // Pagination & Loading
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const itemsPerPageNum = 50;

    // View Modal
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    // Active Tab
    const [activeReportTab, setActiveReportTab] = useState("Student Report");

    // Class & Section Report State
    const [classSectionData, setClassSectionData] = useState<any[]>([]);
    const [classSectionSearch, setClassSectionSearch] = useState("");
    const [classSectionLoading, setClassSectionLoading] = useState(false);

    // Guardian Report State
    const [guardianStudents, setGuardianStudents] = useState<any[]>([]);
    const [guardianLoading, setGuardianLoading] = useState(false);
    const [guardianSearchText, setGuardianSearchText] = useState("");
    const [guardianCurrentPage, setGuardianCurrentPage] = useState(1);
    const [guardianTotalPages, setGuardianTotalPages] = useState(0);
    const [guardianTotalEntries, setGuardianTotalEntries] = useState(0);

    const fetchInitialData = useCallback(async () => {
        try {
            const [classesRes, categoriesRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/student-categories?no_paginate=true"),
            ]);
            const classesData = classesRes.data?.data?.data || classesRes.data?.data || [];
            const categoriesData = categoriesRes.data?.data?.data || categoriesRes.data?.data || [];
            setClasses(Array.isArray(classesData) ? classesData : []);
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        } catch (error) {
            console.error("Failed to fetch initial data", error);
            setClasses([]);
            setCategories([]);
        }
    }, []);

    const fetchClassSectionReport = useCallback(async () => {
        setClassSectionLoading(true);
        try {
            const params = new URLSearchParams();
            if (classSectionSearch) params.append("search", classSectionSearch);
            params.append("limit", "50");
            const res = await api.get(`/student-reports/class-section?${params.toString()}`);
            setClassSectionData(res.data?.data?.data || res.data?.data || []);
        } catch {
            toast({
                title: t("error") || "Error",
                description: t("failed_to_fetch_report"),
                variant: "destructive",
            });
        } finally {
            setClassSectionLoading(false);
        }
    }, [classSectionSearch, t, toast]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        if (activeReportTab === "Class & Section Report") {
            fetchClassSectionReport();
        }
    }, [activeReportTab, fetchClassSectionReport]);

    const handleClassSectionSearch = () => {
        fetchClassSectionReport();
    };

    const handleClassChange = async (classId: string) => {
        setSelectedClass(classId);
        setSelectedSection("all");
        setSections([]);
        if (!classId || classId === "all") return;

        try {
            const res = await api.get(`/academics/classes/${classId}`);
            const sectionsData = res.data?.data?.sections;
            setSections(Array.isArray(sectionsData) ? sectionsData : []);
        } catch (error) {
            console.error("Failed to fetch sections", error);
            setSections([]);
        }
    };

    // Student History State
    const [historyStudents, setHistoryStudents] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedAdmissionYear, setSelectedAdmissionYear] = useState("all");
    const [admissionYears, setAdmissionYears] = useState<string[]>([]);

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const years = Array.from({ length: 15 }, (_, i) => (currentYear - i).toString());
        setAdmissionYears(years);
    }, []);

    const handleHistorySearch = async () => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: t("validation_error") || "Validation Error",
                description: t("please_select_a_class"),
                variant: "destructive",
            });
            return;
        }

        setHistoryLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("school_class_id", selectedClass);
            if (selectedAdmissionYear !== "all") {
                params.append("admission_year", selectedAdmissionYear);
            }
            params.append("limit", "100");

            const res = await api.get(`/students?${params.toString()}`);
            setHistoryStudents(res.data?.data?.data || res.data?.data || []);
        } catch {
            toast({
                title: t("error") || "Error",
                description: t("failed_to_fetch_report"),
                variant: "destructive",
            });
        } finally {
            setHistoryLoading(false);
        }
    };

    // Student Login Credential State
    const [credentialStudents, setCredentialStudents] = useState<any[]>([]);
    const [credentialLoading, setCredentialLoading] = useState(false);

    const handleCredentialSearch = async () => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: t("validation_error") || "Validation Error",
                description: t("please_select_a_class"),
                variant: "destructive",
            });
            return;
        }

        setCredentialLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("school_class_id", selectedClass);
            if (selectedSection !== "all") params.append("section_id", selectedSection);
            params.append("limit", "100");

            const res = await api.get(`/students?${params.toString()}`);
            setCredentialStudents(res.data?.data?.data || res.data?.data || []);
        } catch {
            toast({
                title: t("error") || "Error",
                description: t("failed_to_fetch_report"),
                variant: "destructive",
            });
        } finally {
            setCredentialLoading(false);
        }
    };

    // Parent Login Credential State
    const [parentCredentialStudents, setParentCredentialStudents] = useState<any[]>([]);
    const [parentCredentialLoading, setParentCredentialLoading] = useState(false);

    const handleParentCredentialSearch = async () => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: t("validation_error") || "Validation Error",
                description: t("please_select_a_class"),
                variant: "destructive",
            });
            return;
        }

        setParentCredentialLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("school_class_id", selectedClass);
            if (selectedSection !== "all") params.append("section_id", selectedSection);
            params.append("limit", "100");

            const res = await api.get(`/students?${params.toString()}`);
            setParentCredentialStudents(res.data?.data?.data || res.data?.data || []);
        } catch {
            toast({
                title: t("error") || "Error",
                description: t("failed_to_fetch_report"),
                variant: "destructive",
            });
        } finally {
            setParentCredentialLoading(false);
        }
    };

    // Class Subject Report State
    const [classSubjectData, setClassSubjectData] = useState<any[]>([]);
    const [classSubjectLoading, setClassSubjectLoading] = useState(false);
    const [classSubjectSearch, setClassSubjectSearch] = useState("");

    const handleClassSubjectSearch = async () => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: t("validation_error") || "Validation Error",
                description: t("please_select_a_class"),
                variant: "destructive",
            });
            return;
        }

        setClassSubjectLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("school_class_id", selectedClass);
            if (selectedSection !== "all") params.append("section_id", selectedSection);
            params.append("limit", "100");

            const res = await api.get(`/student-reports/class-subject?${params.toString()}`);
            setClassSubjectData(res.data?.data?.data || res.data?.data || []);
        } catch {
            toast({
                title: t("error") || "Error",
                description: t("failed_to_fetch_report"),
                variant: "destructive",
            });
        } finally {
            setClassSubjectLoading(false);
        }
    };

    // Admission Report State
    const [admissionData, setAdmissionData] = useState<any[]>([]);
    const [admissionLoading, setAdmissionLoading] = useState(false);
    const [selectedSearchType, setSelectedSearchType] = useState("all");

    const searchTypes = [
        { id: "today", name: "Today" },
        { id: "this_week", name: "This Week" },
        { id: "last_week", name: "Last Week" },
        { id: "this_month", name: "This Month" },
        { id: "last_month", name: "Last Month" },
        { id: "this_year", name: "This Year" },
        { id: "last_year", name: "Last Year" },
    ];

    const handleAdmissionSearch = async () => {
        if (!selectedSearchType || selectedSearchType === "all") {
            toast({
                title: t("validation_error") || "Validation Error",
                description: t("please_select_criteria") || "Please select a Search Type.",
                variant: "destructive",
            });
            return;
        }

        setAdmissionLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("search_type", selectedSearchType);
            params.append("limit", "100");

            const res = await api.get(`/students?${params.toString()}`);
            setAdmissionData(res.data?.data?.data || res.data?.data || []);
        } catch {
            toast({
                title: t("error") || "Error",
                description: t("failed_to_fetch_report"),
                variant: "destructive",
            });
        } finally {
            setAdmissionLoading(false);
        }
    };

    // Sibling Report State
    const [siblingData, setSiblingData] = useState<any[]>([]);
    const [siblingLoading, setSiblingLoading] = useState(false);
    const [siblingSearch, setSiblingSearch] = useState("");

    const handleSiblingSearch = async () => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: t("validation_error") || "Validation Error",
                description: t("please_select_a_class"),
                variant: "destructive",
            });
            return;
        }

        setSiblingLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("school_class_id", selectedClass);
            if (selectedSection !== "all") params.append("section_id", selectedSection);
            params.append("limit", "100");

            const res = await api.get(`/student-reports/sibling?${params.toString()}`);
            setSiblingData(res.data?.data?.data || res.data?.data || []);
        } catch {
            toast({
                title: t("error") || "Error",
                description: t("failed_to_fetch_report"),
                variant: "destructive",
            });
        } finally {
            setSiblingLoading(false);
        }
    };

    // Student Profile State
    const [profileData, setProfileData] = useState<any[]>([]);
    const [profileLoading, setProfileLoading] = useState(false);
    const [selectedProfileSearchType, setSelectedProfileSearchType] = useState("all");
    const [profileSearch, setProfileSearch] = useState("");

    const handleProfileSearch = async () => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: t("validation_error") || "Validation Error",
                description: t("please_select_a_class"),
                variant: "destructive",
            });
            return;
        }

        setProfileLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("school_class_id", selectedClass);
            if (selectedSection !== "all") params.append("section_id", selectedSection);
            if (selectedProfileSearchType !== "all") {
                params.append("search_type", selectedProfileSearchType);
            }
            params.append("limit", "100");

            const res = await api.get(`/students?${params.toString()}`);
            setProfileData(res.data?.data?.data || res.data?.data || []);
        } catch {
            toast({
                title: t("error") || "Error",
                description: t("failed_to_fetch_report"),
                variant: "destructive",
            });
        } finally {
            setProfileLoading(false);
        }
    };

    // Student Gender Ratio Report State
    const [genderRatioData, setGenderRatioData] = useState<any[]>([]);
    const [genderRatioLoading, setGenderRatioLoading] = useState(false);
    const [genderRatioSearch, setGenderRatioSearch] = useState("");

    const fetchGenderRatioReport = useCallback(async () => {
        setGenderRatioLoading(true);
        try {
            const res = await api.get("/student-reports/gender-ratio");
            setGenderRatioData(res.data?.data?.data || res.data?.data || []);
        } catch {
            toast({
                title: t("error") || "Error",
                description: t("failed_to_fetch_report"),
                variant: "destructive",
            });
        } finally {
            setGenderRatioLoading(false);
        }
    }, [t, toast]);

    useEffect(() => {
        if (activeReportTab === "Student Gender Ratio Report") {
            fetchGenderRatioReport();
        }
    }, [activeReportTab, fetchGenderRatioReport]);

    // Student Teacher Ratio Report State
    const [teacherRatioData, setTeacherRatioData] = useState<any[]>([]);
    const [teacherRatioLoading, setTeacherRatioLoading] = useState(false);
    const [teacherRatioSearch, setTeacherRatioSearch] = useState("");

    const fetchTeacherRatioReport = useCallback(async () => {
        setTeacherRatioLoading(true);
        try {
            const res = await api.get("/student-reports/student-teacher-ratio");
            setTeacherRatioData(res.data?.data?.data || res.data?.data || []);
        } catch {
            toast({
                title: t("error") || "Error",
                description: t("failed_to_fetch_report"),
                variant: "destructive",
            });
        } finally {
            setTeacherRatioLoading(false);
        }
    }, [t, toast]);

    useEffect(() => {
        if (activeReportTab === "Student Teacher Ratio Report") {
            fetchTeacherRatioReport();
        }
    }, [activeReportTab, fetchTeacherRatioReport]);

    // Online Admission Report State
    const [onlineAdmissionData, setOnlineAdmissionData] = useState<any[]>([]);
    const [onlineAdmissionLoading, setOnlineAdmissionLoading] = useState(false);
    const [selectedOnlineStatus, setSelectedOnlineStatus] = useState("all");

    const handleOnlineAdmissionSearch = async () => {
        setOnlineAdmissionLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedClass !== "all") params.append("school_class_id", selectedClass);
            if (selectedSection !== "all") params.append("section_id", selectedSection);
            if (selectedOnlineStatus !== "all") params.append("status", selectedOnlineStatus);
            params.append("limit", "100");

            const res = await api.get(`/online-admissions?${params.toString()}`);
            setOnlineAdmissionData(res.data?.data?.data || res.data?.data || []);
        } catch {
            toast({
                title: t("error") || "Error",
                description: t("failed_to_fetch_report"),
                variant: "destructive",
            });
        } finally {
            setOnlineAdmissionLoading(false);
        }
    };

    const handleGuardianSearch = async (page = 1) => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: t("validation_error") || "Validation Error",
                description: t("please_select_a_class"),
                variant: "destructive",
            });
            return;
        }

        setGuardianLoading(true);
        setGuardianCurrentPage(page);
        try {
            const params = new URLSearchParams();
            params.append("school_class_id", selectedClass);
            if (selectedSection !== "all") params.append("section_id", selectedSection);
            if (guardianSearchText) params.append("search", guardianSearchText);
            params.append("page", page.toString());
            params.append("limit", itemsPerPageNum.toString());

            const res = await api.get(`/students?${params.toString()}`);
            setGuardianStudents(res.data?.data?.data || res.data?.data || []);
            setGuardianTotalPages(res.data?.data?.last_page || 0);
            setGuardianTotalEntries(res.data?.data?.total || 0);
        } catch {
            toast({
                title: t("error") || "Error",
                description: t("failed_to_fetch_report"),
                variant: "destructive",
            });
        } finally {
            setGuardianLoading(false);
        }
    };

    const handleSearch = async (page = 1) => {
        if (!selectedClass || selectedClass === "all") {
            toast({
                title: t("validation_error") || "Validation Error",
                description: t("please_select_a_class"),
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        setCurrentPage(page);
        try {
            const params = new URLSearchParams();
            params.append("school_class_id", selectedClass);
            if (selectedSection !== "all") params.append("section_id", selectedSection);
            if (selectedCategory !== "all") params.append("category", selectedCategory);
            if (selectedGender !== "all") params.append("gender", selectedGender);
            if (selectedRte !== "all") params.append("rte", selectedRte);
            params.append("page", page.toString());
            params.append("limit", itemsPerPageNum.toString());

            const res = await api.get(`/students?${params.toString()}`);
            setStudents(res.data?.data?.data || res.data?.data || []);
            setTotalPages(res.data?.data?.last_page || 0);
            setTotalEntries(res.data?.data?.total || 0);
        } catch {
            toast({
                title: t("error") || "Error",
                description: t("failed_to_fetch_report"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleView = (student: any) => {
        setSelectedStudent(student);
        setIsViewDialogOpen(true);
    };

    const handleEdit = (student: any) => {
        toast({
            title: t("redirecting") || "Redirecting",
            description: `${t("edit")}: ${student.name}...`,
        });
    };

    const startIndex = (currentPage - 1) * itemsPerPageNum;

    return (
        <div className="space-y-6">
            {/* Standalone Edge-to-Edge Gradient Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Users className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("student_information_report")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("generate_student_guardian_reports")}
                        </p>
                    </div>
                </div>
                <Link
                    href="/user/profile"
                    className="flex items-center gap-1.5 h-8 px-4 rounded-full text-white text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] transition-all active:scale-95 shadow-md shrink-0"
                >
                    <Monitor className="h-3.5 w-3.5" />
                    {t("student_portal_view")}
                </Link>
            </div>

            {/* Navigation Grid of 13 Report Tabs */}
            <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {reportLinks.flatMap((col) => col.group).map((link) => {
                        const isActive = activeReportTab === link.id;
                        return (
                            <div
                                key={link.id}
                                onClick={() => setActiveReportTab(link.id)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group",
                                    isActive
                                        ? "border-indigo-200 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-200"
                                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-xs"
                                )}
                            >
                                <div
                                    className={cn(
                                        "p-2 rounded-lg transition-all duration-300",
                                        isActive
                                            ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                            : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                    )}
                                >
                                    <link.icon className="h-4 w-4" />
                                </div>
                                <span
                                    className={cn(
                                        "text-xs font-bold tracking-tight transition-colors duration-300",
                                        isActive ? "text-[#6366f1]" : "text-gray-700"
                                    )}
                                >
                                    {t(link.key)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tab 1: Student Report */}
            {activeReportTab === "Student Report" && (
                <>
                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("select_criteria")}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("class")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("select_class")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("select_class")}
                                        </SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()} className="text-xs">
                                                {translateClassName(cls.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("section")}
                                </Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("all_sections")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("all_sections")}
                                        </SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()} className="text-xs">
                                                {translateSectionName(sec.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("category")}
                                </Label>
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("all_categories")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("all_categories")}
                                        </SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()} className="text-xs">
                                                {cat.category_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("gender")}
                                </Label>
                                <Select value={selectedGender} onValueChange={setSelectedGender}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("all")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">{t("all")}</SelectItem>
                                        <SelectItem value="Male" className="text-xs">{t("male")}</SelectItem>
                                        <SelectItem value="Female" className="text-xs">{t("female")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("rte")}
                                </Label>
                                <Select value={selectedRte} onValueChange={setSelectedRte}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("all")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">{t("all")}</SelectItem>
                                        <SelectItem value="Yes" className="text-xs">{t("yes")}</SelectItem>
                                        <SelectItem value="No" className="text-xs">{t("no")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={() => handleSearch(1)}
                                disabled={loading}
                                className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("student_report")}
                        </h2>

                        <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1500px]">
                                <TableHeader className="bg-gray-50/80 text-xs">
                                    <TableRow className="border-b border-gray-100 whitespace-nowrap text-xs font-bold text-gray-700">
                                        <TableHead className="py-3 px-4">{t("section")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("admission_no")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("student_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("father_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("date_of_birth")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("gender")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("category")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("mobile_number")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("local_identification_number")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("national_identification_number")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("rte")}</TableHead>
                                        <TableHead className="py-3 px-4 text-right pr-4">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={12} />
                                    ) : students.length > 0 ? (
                                        students.map((student) => (
                                            <TableRow
                                                key={student.id}
                                                className="hover:bg-indigo-50/30 transition-colors cursor-pointer border-b border-gray-50 text-xs whitespace-nowrap"
                                                onClick={() => handleView(student)}
                                            >
                                                <TableCell className="py-3 px-4 text-gray-600">
                                                    {translateSectionName(student.section?.name, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-[#6366f1] font-semibold">
                                                    {toLocaleNumber(student.admission_no, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                    {student.name} {student.last_name || ""}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.father_name || "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.dob ? toLocaleNumber(student.dob, langCode) : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.gender ? (t(student.gender.toLowerCase()) || student.gender) : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.student_category?.category_name || student.category || "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.phone ? toLocaleNumber(student.phone, langCode) : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.local_identification_no || "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.national_identification_no || "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.rte || "—"}
                                                </TableCell>
                                                <TableCell
                                                    className="py-3 px-4 pr-4 text-right"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            onClick={() => handleView(student)}
                                                            size="icon"
                                                            className="h-7 w-7 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xs shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                                                            title={t("view")}
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleEdit(student)}
                                                            size="icon"
                                                            className="h-7 w-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xs shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                                                            title={t("edit")}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="h-56">
                                            <TableCell colSpan={12} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-2 opacity-60">
                                                    <p className="text-rose-500 font-bold text-xs">
                                                        {t("no_data_available_in_table")}
                                                    </p>
                                                    <p className="text-gray-400 text-xs">
                                                        {t("search_with_different_criteria")}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-3 border-t border-gray-100">
                            <div>
                                {totalEntries > 0
                                    ? t("showing_x_to_y_of_z", {
                                          from: toLocaleNumber(startIndex + 1, langCode),
                                          to: toLocaleNumber(
                                              Math.min(startIndex + itemsPerPageNum, totalEntries),
                                              langCode
                                          ),
                                          total: toLocaleNumber(totalEntries, langCode),
                                      })
                                    : t("showing_x_to_y_of_z", {
                                          from: toLocaleNumber(0, langCode),
                                          to: toLocaleNumber(0, langCode),
                                          total: toLocaleNumber(0, langCode),
                                      })}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSearch(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1 || loading}
                                    className="h-8 px-3 rounded-full text-xs"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <Button
                                        key={i}
                                        onClick={() => handleSearch(i + 1)}
                                        disabled={loading}
                                        className={cn(
                                            "h-8 w-8 p-0 rounded-full text-xs font-bold transition-all",
                                            currentPage === i + 1
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        {toLocaleNumber(i + 1, langCode)}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSearch(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0 || loading}
                                    className="h-8 px-3 rounded-full text-xs"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Tab 2: Class & Section Report */}
            {activeReportTab === "Class & Section Report" && (
                <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                    <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                        {t("class_and_section_report")}
                    </h2>

                    <div className="flex justify-between items-center mb-4 gap-3">
                        <div className="relative w-72">
                            <input
                                type="text"
                                placeholder={t("search")}
                                className="w-full h-9 px-3 text-xs border border-gray-200 rounded-full bg-gray-50/60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={classSectionSearch}
                                onChange={(e) => setClassSectionSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleClassSectionSearch()}
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-full">
                            <TableHeader className="bg-gray-50/80 text-xs">
                                <TableRow className="border-b border-gray-100 whitespace-nowrap text-xs font-bold text-gray-700">
                                    <TableHead className="py-3 px-4 w-16">{t("s_no")}</TableHead>
                                    <TableHead className="py-3 px-4">{t("class")}</TableHead>
                                    <TableHead className="py-3 px-4">{t("total_students")}</TableHead>
                                    <TableHead className="py-3 px-4 text-right pr-4">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classSectionLoading ? (
                                    <TableSkeleton cols={4} />
                                ) : classSectionData.length > 0 ? (
                                    classSectionData.map((row, idx) => (
                                        <TableRow
                                            key={idx}
                                            className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50 text-xs whitespace-nowrap"
                                        >
                                            <TableCell className="py-3 px-4 text-gray-600">
                                                {toLocaleNumber(row.s_no || idx + 1, langCode)}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                {translateClassName(row.class_name, langCode)} (
                                                {translateSectionName(row.section_name, langCode)})
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600 font-medium">
                                                {toLocaleNumber(row.students_count || 0, langCode)}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 pr-4 text-right">
                                                <Button
                                                    size="icon"
                                                    className="h-7 w-7 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs active:scale-95 transition-all"
                                                    title={t("view")}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="h-56">
                                        <TableCell colSpan={4} className="text-center py-12">
                                            <p className="text-rose-500 font-bold text-xs">
                                                {t("no_data_available_in_table")}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Tab 3: Guardian Report */}
            {activeReportTab === "Guardian Report" && (
                <>
                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("select_criteria")}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("class")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("select_class")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("select_class")}
                                        </SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()} className="text-xs">
                                                {translateClassName(cls.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("section")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("all_sections")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("all_sections")}
                                        </SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()} className="text-xs">
                                                {translateSectionName(sec.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={() => handleGuardianSearch(1)}
                                disabled={guardianLoading}
                                className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                            >
                                {guardianLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                {t("guardian_report")}
                            </h2>
                            <div className="relative w-72">
                                <input
                                    type="text"
                                    placeholder={t("search")}
                                    className="w-full h-8 px-3 text-xs border border-gray-200 rounded-full bg-gray-50/60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={guardianSearchText}
                                    onChange={(e) => setGuardianSearchText(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleGuardianSearch(1)}
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1200px]">
                                <TableHeader className="bg-gray-50/80 text-xs">
                                    <TableRow className="border-b border-gray-100 whitespace-nowrap text-xs font-bold text-gray-700">
                                        <TableHead className="py-3 px-4">{t("class")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("section")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("admission_no")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("student_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("mobile_number")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("guardian_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("guardian_relation")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("guardian_phone")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("guardian_occupation")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("guardian_address")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {guardianLoading ? (
                                        <TableSkeleton cols={10} />
                                    ) : guardianStudents.length > 0 ? (
                                        guardianStudents.map((student) => (
                                            <TableRow
                                                key={student.id}
                                                className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50 text-xs whitespace-nowrap"
                                            >
                                                <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                    {translateClassName(student.school_class?.name, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {translateSectionName(student.section?.name, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-[#6366f1] font-semibold">
                                                    {toLocaleNumber(student.admission_no, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                    {student.name} {student.last_name || ""}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.phone ? toLocaleNumber(student.phone, langCode) : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">
                                                    {student.guardian_name || "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.guardian_relation || "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.guardian_phone ? toLocaleNumber(student.guardian_phone, langCode) : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.guardian_occupation || "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500 truncate max-w-xs">
                                                    {student.guardian_address || "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="h-56">
                                            <TableCell colSpan={10} className="text-center py-12">
                                                <p className="text-rose-500 font-bold text-xs">
                                                    {t("no_data_available_in_table")}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-3 border-t border-gray-100">
                            <div>
                                {guardianTotalEntries > 0
                                    ? t("showing_x_to_y_of_z", {
                                          from: toLocaleNumber((guardianCurrentPage - 1) * itemsPerPageNum + 1, langCode),
                                          to: toLocaleNumber(
                                              Math.min((guardianCurrentPage - 1) * itemsPerPageNum + itemsPerPageNum, guardianTotalEntries),
                                              langCode
                                          ),
                                          total: toLocaleNumber(guardianTotalEntries, langCode),
                                      })
                                    : t("showing_x_to_y_of_z", {
                                          from: toLocaleNumber(0, langCode),
                                          to: toLocaleNumber(0, langCode),
                                          total: toLocaleNumber(0, langCode),
                                      })}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGuardianSearch(Math.max(1, guardianCurrentPage - 1))}
                                    disabled={guardianCurrentPage === 1 || guardianLoading}
                                    className="h-8 px-3 rounded-full text-xs"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                {Array.from({ length: guardianTotalPages }).map((_, i) => (
                                    <Button
                                        key={i}
                                        onClick={() => handleGuardianSearch(i + 1)}
                                        disabled={guardianLoading}
                                        className={cn(
                                            "h-8 w-8 p-0 rounded-full text-xs font-bold transition-all",
                                            guardianCurrentPage === i + 1
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        {toLocaleNumber(i + 1, langCode)}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGuardianSearch(Math.min(guardianTotalPages, guardianCurrentPage + 1))}
                                    disabled={guardianCurrentPage === guardianTotalPages || guardianTotalPages === 0 || guardianLoading}
                                    className="h-8 px-3 rounded-full text-xs"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Tab 4: Student History */}
            {activeReportTab === "Student History" && (
                <>
                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("select_criteria")}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("class")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("select_class")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("select_class")}
                                        </SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()} className="text-xs">
                                                {translateClassName(cls.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("admission_year")}
                                </Label>
                                <Select value={selectedAdmissionYear} onValueChange={setSelectedAdmissionYear}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("all_years")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">{t("all_years")}</SelectItem>
                                        {admissionYears.map((year) => (
                                            <SelectItem key={year} value={year} className="text-xs">
                                                {toLocaleNumber(year, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleHistorySearch}
                                disabled={historyLoading}
                                className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                            >
                                {historyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("student_history")}
                        </h2>

                        <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1200px]">
                                <TableHeader className="bg-gray-50/80 text-xs">
                                    <TableRow className="border-b border-gray-100 whitespace-nowrap text-xs font-bold text-gray-700">
                                        <TableHead className="py-3 px-4">{t("admission_no")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("student_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("admission_date")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("class")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("session") || "Session"}</TableHead>
                                        <TableHead className="py-3 px-4">{t("mobile_number")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("guardian_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("guardian_phone")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historyLoading ? (
                                        <TableSkeleton cols={8} />
                                    ) : historyStudents.length > 0 ? (
                                        historyStudents.map((student) => (
                                            <TableRow
                                                key={student.id}
                                                className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50 text-xs whitespace-nowrap"
                                            >
                                                <TableCell className="py-3 px-4 text-[#6366f1] font-semibold">
                                                    {toLocaleNumber(student.admission_no, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                    {student.name} {student.last_name || ""}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.admission_date ? toLocaleNumber(student.admission_date, langCode) : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {translateClassName(student.school_class?.name, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.academic_session?.session || "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.phone ? toLocaleNumber(student.phone, langCode) : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.guardian_name || "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.guardian_phone ? toLocaleNumber(student.guardian_phone, langCode) : "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="h-56">
                                            <TableCell colSpan={8} className="text-center py-12">
                                                <p className="text-rose-500 font-bold text-xs">
                                                    {t("no_data_available_in_table")}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {/* Tab 5: Student Login Credential */}
            {activeReportTab === "Student Login Credential" && (
                <>
                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("select_criteria")}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("class")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("select_class")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("select_class")}
                                        </SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()} className="text-xs">
                                                {translateClassName(cls.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("section")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("all_sections")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("all_sections")}
                                        </SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()} className="text-xs">
                                                {translateSectionName(sec.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleCredentialSearch}
                                disabled={credentialLoading}
                                className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                            >
                                {credentialLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("student_login_credential")}
                        </h2>

                        <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50/80 text-xs">
                                    <TableRow className="border-b border-gray-100 whitespace-nowrap text-xs font-bold text-gray-700">
                                        <TableHead className="py-3 px-4">{t("admission_no")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("student_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("username")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("password")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {credentialLoading ? (
                                        <TableSkeleton cols={4} />
                                    ) : credentialStudents.length > 0 ? (
                                        credentialStudents.map((student) => (
                                            <TableRow
                                                key={student.id}
                                                className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50 text-xs whitespace-nowrap"
                                            >
                                                <TableCell className="py-3 px-4 text-[#6366f1] font-semibold">
                                                    {toLocaleNumber(student.admission_no, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                    {student.name} {student.last_name || ""}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 font-mono text-gray-600">
                                                    {student.user?.email || student.admission_no}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 font-mono text-gray-600">
                                                    ******
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="h-56">
                                            <TableCell colSpan={4} className="text-center py-12">
                                                <p className="text-rose-500 font-bold text-xs">
                                                    {t("no_data_available_in_table")}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {/* Tab 6: Parent Login Credential */}
            {activeReportTab === "Parent Login Credential" && (
                <>
                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("select_criteria")}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("class")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("select_class")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("select_class")}
                                        </SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()} className="text-xs">
                                                {translateClassName(cls.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("section")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("all_sections")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("all_sections")}
                                        </SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()} className="text-xs">
                                                {translateSectionName(sec.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleParentCredentialSearch}
                                disabled={parentCredentialLoading}
                                className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                            >
                                {parentCredentialLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("parent_login_credential")}
                        </h2>

                        <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50/80 text-xs">
                                    <TableRow className="border-b border-gray-100 whitespace-nowrap text-xs font-bold text-gray-700">
                                        <TableHead className="py-3 px-4">{t("admission_no")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("student_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("guardian_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("parent_username")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("parent_password")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parentCredentialLoading ? (
                                        <TableSkeleton cols={5} />
                                    ) : parentCredentialStudents.length > 0 ? (
                                        parentCredentialStudents.map((student) => (
                                            <TableRow
                                                key={student.id}
                                                className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50 text-xs whitespace-nowrap"
                                            >
                                                <TableCell className="py-3 px-4 text-[#6366f1] font-semibold">
                                                    {toLocaleNumber(student.admission_no, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                    {student.name} {student.last_name || ""}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-600 font-medium">
                                                    {student.guardian_name || "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 font-mono text-gray-600">
                                                    {student.guardian_email || `parent_${student.admission_no}`}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 font-mono text-gray-600">
                                                    ******
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="h-56">
                                            <TableCell colSpan={5} className="text-center py-12">
                                                <p className="text-rose-500 font-bold text-xs">
                                                    {t("no_data_available_in_table")}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {/* Tab 7: Class Subject Report */}
            {activeReportTab === "Class Subject Report" && (
                <>
                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("select_criteria")}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("class")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("select_class")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("select_class")}
                                        </SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()} className="text-xs">
                                                {translateClassName(cls.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("section")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("all_sections")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("all_sections")}
                                        </SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()} className="text-xs">
                                                {translateSectionName(sec.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleClassSubjectSearch}
                                disabled={classSubjectLoading}
                                className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                            >
                                {classSubjectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                {t("class_subject_report")}
                            </h2>
                            <div className="relative w-72">
                                <input
                                    type="text"
                                    placeholder={t("search")}
                                    className="w-full h-8 px-3 text-xs border border-gray-200 rounded-full bg-gray-50/60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={classSubjectSearch}
                                    onChange={(e) => setClassSubjectSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50/80 text-xs">
                                    <TableRow className="border-b border-gray-100 whitespace-nowrap text-xs font-bold text-gray-700">
                                        <TableHead className="py-3 px-4">{t("class")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("section")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("subject")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("teacher")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("time") || "Time"}</TableHead>
                                        <TableHead className="py-3 px-4">{t("room_no") || "Room No"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classSubjectLoading ? (
                                        <TableSkeleton cols={6} />
                                    ) : classSubjectData.length > 0 ? (
                                        classSubjectData
                                            .filter(
                                                (item) =>
                                                    !classSubjectSearch ||
                                                    item.subject?.toLowerCase().includes(classSubjectSearch.toLowerCase()) ||
                                                    item.teacher?.toLowerCase().includes(classSubjectSearch.toLowerCase())
                                            )
                                            .map((row, idx) => (
                                                <TableRow
                                                    key={row.id || idx}
                                                    className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50 text-xs whitespace-nowrap"
                                                >
                                                    <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                        {translateClassName(row.class, langCode)}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {translateSectionName(row.section, langCode)}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-[#6366f1] font-semibold">
                                                        {row.subject || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-800 font-medium">
                                                        {row.teacher || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {row.time ? toLocaleNumber(row.time, langCode) : "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {row.room_no ? toLocaleNumber(row.room_no, langCode) : "—"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                    ) : (
                                        <TableRow className="h-56">
                                            <TableCell colSpan={6} className="text-center py-12">
                                                <p className="text-rose-500 font-bold text-xs">
                                                    {t("no_data_available_in_table")}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {/* Tab 8: Admission Report */}
            {activeReportTab === "Admission Report" && (
                <>
                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("select_criteria")}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("search_type")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedSearchType} onValueChange={setSelectedSearchType}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("select")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">{t("all")}</SelectItem>
                                        {searchTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id} className="text-xs">
                                                {t(type.id) || type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleAdmissionSearch}
                                disabled={admissionLoading}
                                className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                            >
                                {admissionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("admission_report")}
                        </h2>

                        <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1200px]">
                                <TableHeader className="bg-gray-50/80 text-xs">
                                    <TableRow className="border-b border-gray-100 whitespace-nowrap text-xs font-bold text-gray-700">
                                        <TableHead className="py-3 px-4">{t("admission_no")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("student_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("class")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("father_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("date_of_birth")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("admission_date")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("gender")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("category")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("mobile_number")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {admissionLoading ? (
                                        <TableSkeleton cols={9} />
                                    ) : admissionData.length > 0 ? (
                                        admissionData.map((student) => (
                                            <TableRow
                                                key={student.id}
                                                className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50 text-xs whitespace-nowrap"
                                            >
                                                <TableCell className="py-3 px-4 text-[#6366f1] font-semibold">
                                                    {toLocaleNumber(student.admission_no, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                    {student.name} {student.last_name || ""}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">
                                                    {translateClassName(student.school_class?.name, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.father_name || "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.dob ? toLocaleNumber(student.dob, langCode) : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.admission_date ? toLocaleNumber(student.admission_date, langCode) : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.gender ? (t(student.gender.toLowerCase()) || student.gender) : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.category_name || "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {student.phone ? toLocaleNumber(student.phone, langCode) : "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="h-56">
                                            <TableCell colSpan={9} className="text-center py-12">
                                                <p className="text-rose-500 font-bold text-xs">
                                                    {t("no_data_available_in_table")}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {/* Tab 9: Sibling Report */}
            {activeReportTab === "Sibling Report" && (
                <>
                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("select_criteria")}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("class")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("select_class")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("select_class")}
                                        </SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()} className="text-xs">
                                                {translateClassName(cls.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("section")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("all_sections")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("all_sections")}
                                        </SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()} className="text-xs">
                                                {translateSectionName(sec.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleSiblingSearch}
                                disabled={siblingLoading}
                                className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                            >
                                {siblingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                {t("sibling_report")}
                            </h2>
                            <div className="relative w-72">
                                <input
                                    type="text"
                                    placeholder={t("search")}
                                    className="w-full h-8 px-3 text-xs border border-gray-200 rounded-full bg-gray-50/60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={siblingSearch}
                                    onChange={(e) => setSiblingSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1200px]">
                                <TableHeader className="bg-gray-50/80 text-xs">
                                    <TableRow className="border-b border-gray-100 whitespace-nowrap text-xs font-bold text-gray-700">
                                        <TableHead className="py-3 px-4">{t("father_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("mother_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("guardian_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("guardian_phone")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("student_name")} ({t("sibling_name") || "Sibling"})</TableHead>
                                        <TableHead className="py-3 px-4">{t("class")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("admission_date")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("gender")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {siblingLoading ? (
                                        <TableSkeleton cols={8} />
                                    ) : siblingData.length > 0 ? (
                                        siblingData
                                            .filter(
                                                (student) =>
                                                    !siblingSearch ||
                                                    student.name?.toLowerCase().includes(siblingSearch.toLowerCase()) ||
                                                    student.guardian_name?.toLowerCase().includes(siblingSearch.toLowerCase())
                                            )
                                            .map((student) => (
                                                <TableRow
                                                    key={student.id}
                                                    className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50 text-xs whitespace-nowrap"
                                                >
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.father_name || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.mother_name || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.guardian_name || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.guardian_phone ? toLocaleNumber(student.guardian_phone, langCode) : "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                        {student.name} {student.last_name || ""}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-800 font-medium">
                                                        {translateClassName(student.school_class?.name, langCode)}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.admission_date ? toLocaleNumber(student.admission_date, langCode) : "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.gender ? (t(student.gender.toLowerCase()) || student.gender) : "—"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                    ) : (
                                        <TableRow className="h-56">
                                            <TableCell colSpan={8} className="text-center py-12">
                                                <p className="text-rose-500 font-bold text-xs">
                                                    {t("no_data_available_in_table")}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {/* Tab 10: Student Profile */}
            {activeReportTab === "Student Profile" && (
                <>
                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("select_criteria")}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("admission_date")}
                                </Label>
                                <Select value={selectedProfileSearchType} onValueChange={setSelectedProfileSearchType}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("select")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">{t("all")}</SelectItem>
                                        {searchTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id} className="text-xs">
                                                {t(type.id) || type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("class")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("select_class")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("select_class")}
                                        </SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()} className="text-xs">
                                                {translateClassName(cls.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("section")} <span className="text-rose-500">*</span>
                                </Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("all_sections")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("all_sections")}
                                        </SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()} className="text-xs">
                                                {translateSectionName(sec.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleProfileSearch}
                                disabled={profileLoading}
                                className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                            >
                                {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                {t("student_profile")}
                            </h2>
                            <div className="relative w-72">
                                <input
                                    type="text"
                                    placeholder={t("search")}
                                    className="w-full h-8 px-3 text-xs border border-gray-200 rounded-full bg-gray-50/60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={profileSearch}
                                    onChange={(e) => setProfileSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[2000px]">
                                <TableHeader className="bg-gray-50/80 text-xs">
                                    <TableRow className="border-b border-gray-100 whitespace-nowrap text-xs font-bold text-gray-700">
                                        <TableHead className="py-3 px-4">{t("admission_no")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("roll_number") || "Roll Number"}</TableHead>
                                        <TableHead className="py-3 px-4">{t("class")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("section")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("first_name") || "First Name"}</TableHead>
                                        <TableHead className="py-3 px-4">{t("last_name") || "Last Name"}</TableHead>
                                        <TableHead className="py-3 px-4">{t("gender")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("date_of_birth")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("category")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("religion") || "Religion"}</TableHead>
                                        <TableHead className="py-3 px-4">{t("caste") || "Caste"}</TableHead>
                                        <TableHead className="py-3 px-4">{t("mobile_number")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("email") || "Email"}</TableHead>
                                        <TableHead className="py-3 px-4">{t("admission_date")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("blood_group") || "Blood Group"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {profileLoading ? (
                                        <TableSkeleton cols={15} />
                                    ) : profileData.length > 0 ? (
                                        profileData
                                            .filter(
                                                (student) =>
                                                    !profileSearch ||
                                                    student.name?.toLowerCase().includes(profileSearch.toLowerCase()) ||
                                                    student.admission_no?.toLowerCase().includes(profileSearch.toLowerCase())
                                            )
                                            .map((student) => (
                                                <TableRow
                                                    key={student.id}
                                                    className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50 text-xs whitespace-nowrap"
                                                >
                                                    <TableCell className="py-3 px-4 text-[#6366f1] font-semibold">
                                                        {toLocaleNumber(student.admission_no, langCode)}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.roll_no ? toLocaleNumber(student.roll_no, langCode) : "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                        {translateClassName(student.school_class?.name, langCode)}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {translateSectionName(student.section?.name, langCode)}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-800 font-medium">
                                                        {student.name || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-800 font-medium">
                                                        {student.last_name || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.gender ? (t(student.gender.toLowerCase()) || student.gender) : "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.dob ? toLocaleNumber(student.dob, langCode) : "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.category_name || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.religion || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.caste || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.phone ? toLocaleNumber(student.phone, langCode) : "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.email || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.admission_date ? toLocaleNumber(student.admission_date, langCode) : "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">
                                                        {student.blood_group || "—"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                    ) : (
                                        <TableRow className="h-56">
                                            <TableCell colSpan={15} className="text-center py-12">
                                                <p className="text-rose-500 font-bold text-xs">
                                                    {t("no_data_available_in_table")}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {/* Tab 11: Student Gender Ratio Report */}
            {activeReportTab === "Student Gender Ratio Report" && (
                <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                    <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                        {t("student_gender_ratio_report")}
                    </h2>

                    <div className="flex justify-between items-center mb-4 gap-3">
                        <div className="relative w-72">
                            <input
                                type="text"
                                placeholder={t("search")}
                                className="w-full h-9 px-3 text-xs border border-gray-200 rounded-full bg-gray-50/60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={genderRatioSearch}
                                onChange={(e) => setGenderRatioSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-full">
                            <TableHeader className="bg-gray-50/80 text-xs">
                                <TableRow className="border-b border-gray-100 whitespace-nowrap text-xs font-bold text-gray-700">
                                    <TableHead className="py-3 px-4">{t("class")} ({t("section")})</TableHead>
                                    <TableHead className="py-3 px-4 text-center">{t("boys")}</TableHead>
                                    <TableHead className="py-3 px-4 text-center">{t("girls")}</TableHead>
                                    <TableHead className="py-3 px-4 text-center">{t("total_students")}</TableHead>
                                    <TableHead className="py-3 px-4 text-right pr-4">{t("ratio")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {genderRatioLoading ? (
                                    <TableSkeleton cols={5} />
                                ) : genderRatioData.length > 0 ? (
                                    genderRatioData
                                        .filter((item) =>
                                            item.class_section?.toLowerCase().includes(genderRatioSearch.toLowerCase())
                                        )
                                        .map((row, idx) => (
                                            <TableRow
                                                key={idx}
                                                className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50 text-xs whitespace-nowrap"
                                            >
                                                <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                    {row.class_section}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600 font-medium">
                                                    {toLocaleNumber(row.total_boys || 0, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600 font-medium">
                                                    {toLocaleNumber(row.total_girls || 0, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center text-[#6366f1] font-bold">
                                                    {toLocaleNumber(row.total_students || 0, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right pr-4 text-gray-500 font-semibold">
                                                    {row.ratio || "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow className="h-56">
                                        <TableCell colSpan={5} className="text-center py-12">
                                            <p className="text-rose-500 font-bold text-xs">
                                                {t("no_data_available_in_table")}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Tab 12: Student Teacher Ratio Report */}
            {activeReportTab === "Student Teacher Ratio Report" && (
                <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                    <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                        {t("student_teacher_ratio_report")}
                    </h2>

                    <div className="flex justify-between items-center mb-4 gap-3">
                        <div className="relative w-72">
                            <input
                                type="text"
                                placeholder={t("search")}
                                className="w-full h-9 px-3 text-xs border border-gray-200 rounded-full bg-gray-50/60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={teacherRatioSearch}
                                onChange={(e) => setTeacherRatioSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-full">
                            <TableHeader className="bg-gray-50/80 text-xs">
                                <TableRow className="border-b border-gray-100 whitespace-nowrap text-xs font-bold text-gray-700">
                                    <TableHead className="py-3 px-4">{t("class")} ({t("section")})</TableHead>
                                    <TableHead className="py-3 px-4 text-center">{t("total_students")}</TableHead>
                                    <TableHead className="py-3 px-4 text-center">{t("total_teachers")}</TableHead>
                                    <TableHead className="py-3 px-4 text-right pr-4">{t("ratio")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teacherRatioLoading ? (
                                    <TableSkeleton cols={4} />
                                ) : teacherRatioData.length > 0 ? (
                                    teacherRatioData
                                        .filter((item) =>
                                            item.class_section?.toLowerCase().includes(teacherRatioSearch.toLowerCase())
                                        )
                                        .map((row, idx) => (
                                            <TableRow
                                                key={idx}
                                                className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50 text-xs whitespace-nowrap"
                                            >
                                                <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                    {row.class_section}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600 font-medium">
                                                    {toLocaleNumber(row.total_students || 0, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600 font-medium">
                                                    {toLocaleNumber(row.total_teachers || 0, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right pr-4 text-gray-500 font-semibold">
                                                    {row.ratio || "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow className="h-56">
                                        <TableCell colSpan={4} className="text-center py-12">
                                            <p className="text-rose-500 font-bold text-xs">
                                                {t("no_data_available_in_table")}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Tab 13: Online Admission Report */}
            {activeReportTab === "Online Admission Report" && (
                <>
                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("select_criteria")}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("class")}
                                </Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("select_class")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("select_class")}
                                        </SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()} className="text-xs">
                                                {translateClassName(cls.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("section")}
                                </Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("all_sections")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">
                                            {t("all_sections")}
                                        </SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()} className="text-xs">
                                                {translateSectionName(sec.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("status")}
                                </Label>
                                <Select value={selectedOnlineStatus} onValueChange={setSelectedOnlineStatus}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("all_status")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">{t("all_status")}</SelectItem>
                                        <SelectItem value="approved" className="text-xs">{t("approved") || "Approved"}</SelectItem>
                                        <SelectItem value="pending" className="text-xs">{t("pending") || "Pending"}</SelectItem>
                                        <SelectItem value="rejected" className="text-xs">{t("rejected") || "Rejected"}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                onClick={handleOnlineAdmissionSearch}
                                disabled={onlineAdmissionLoading}
                                className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                            >
                                {onlineAdmissionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-3">
                            {t("online_admission_report")}
                        </h2>

                        <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1200px]">
                                <TableHeader className="bg-gray-50/80 text-xs">
                                    <TableRow className="border-b border-gray-100 whitespace-nowrap text-xs font-bold text-gray-700">
                                        <TableHead className="py-3 px-4">{t("reference_no")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("admission_no")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("student_name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("class")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("mobile_number")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("date_of_birth")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("gender")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("status")}</TableHead>
                                        <TableHead className="py-3 px-4 text-center">{t("payment_status")}</TableHead>
                                        <TableHead className="py-3 px-4 text-center">{t("enrolled")}</TableHead>
                                        <TableHead className="py-3 px-4 text-right pr-4">{t("paid_amount")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {onlineAdmissionLoading ? (
                                        <TableSkeleton cols={11} />
                                    ) : onlineAdmissionData.length > 0 ? (
                                        onlineAdmissionData.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                className="hover:bg-indigo-50/30 transition-colors border-b border-gray-50 text-xs whitespace-nowrap"
                                            >
                                                <TableCell className="py-3 px-4 text-[#6366f1] font-semibold">
                                                    {row.reference_no}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {row.admission_no ? toLocaleNumber(row.admission_no, langCode) : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                    {row.first_name} {row.last_name || ""}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">
                                                    {translateClassName(row.school_class?.name, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {row.mobile_no ? toLocaleNumber(row.mobile_no, langCode) : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {row.dob ? toLocaleNumber(row.dob, langCode) : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">
                                                    {row.gender ? (t(row.gender.toLowerCase()) || row.gender) : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                            row.status === "approved"
                                                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                                : row.status === "rejected"
                                                                ? "bg-rose-50 text-rose-600 border border-rose-100"
                                                                : "bg-amber-50 text-amber-600 border border-amber-100"
                                                        }`}
                                                    >
                                                        {t(row.status || "pending") || row.status || "Pending"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-500 font-medium">
                                                    {t(row.payment_status?.toLowerCase()) || row.payment_status || "—"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span
                                                        className={`text-xs font-bold ${
                                                            row.is_enrolled ? "text-emerald-600" : "text-rose-500"
                                                        }`}
                                                    >
                                                        {row.is_enrolled ? t("yes") : t("no")}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right pr-4 text-gray-800 font-bold">
                                                    {toLocaleNumber(row.paid_amount || "0.00", langCode)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="h-56">
                                            <TableCell colSpan={11} className="text-center py-12">
                                                <p className="text-rose-500 font-bold text-xs">
                                                    {t("no_data_available_in_table")}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {/* View Student Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[520px] p-0 rounded-2xl overflow-hidden border-none shadow-2xl bg-white">
                    <DialogHeader className="p-5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 flex flex-row items-center gap-3 space-y-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Users className="h-5 w-5" />
                        </span>
                        <div>
                            <DialogTitle className="text-base font-bold text-gray-800 leading-none">
                                {t("student_details")}
                            </DialogTitle>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                {selectedStudent?.name} {selectedStudent?.last_name || ""}
                            </p>
                        </div>
                    </DialogHeader>
                    {selectedStudent && (
                        <div className="p-5 space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3 bg-gray-50/60 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">
                                        {t("admission_no")}
                                    </span>
                                    <p className="font-bold text-[#6366f1]">
                                        {toLocaleNumber(selectedStudent.admission_no, langCode) || "—"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">
                                        {t("student_name")}
                                    </span>
                                    <p className="font-bold text-gray-800">
                                        {selectedStudent.name} {selectedStudent.last_name || ""}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">
                                        {t("class_and_section")}
                                    </span>
                                    <p className="font-bold text-gray-800">
                                        {translateClassName(selectedStudent.school_class?.name, langCode)} -{" "}
                                        {translateSectionName(selectedStudent.section?.name, langCode)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">
                                        {t("date_of_birth")}
                                    </span>
                                    <p className="font-bold text-gray-800">
                                        {selectedStudent.dob ? toLocaleNumber(selectedStudent.dob, langCode) : "—"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">
                                        {t("gender")}
                                    </span>
                                    <p className="font-bold text-gray-800">
                                        {selectedStudent.gender ? (t(selectedStudent.gender.toLowerCase()) || selectedStudent.gender) : "—"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">
                                        {t("category")}
                                    </span>
                                    <p className="font-bold text-gray-800">
                                        {selectedStudent.student_category?.category_name || selectedStudent.category || "—"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">
                                        {t("contact_phone")}
                                    </span>
                                    <p className="font-bold text-gray-800">
                                        {selectedStudent.phone ? toLocaleNumber(selectedStudent.phone, langCode) : "—"}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">
                                        {t("rte")}
                                    </span>
                                    <p className="font-bold text-gray-800">
                                        {selectedStudent.rte || "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
