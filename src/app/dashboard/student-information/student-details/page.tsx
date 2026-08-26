// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Filter,
    LayoutList,
    LayoutGrid,
    FolderSearch,
    Plus,
    ChevronDown,
    Loader2,
    Eye,
    Pencil,
    Trash2,
    Download,
    User,
    Users,
    Mail,
    Phone,
    Calendar,
    BadgeCheck,
    X,
    GraduationCap,
    LogIn,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-GB');
};


import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useImageUrl } from "@/lib/image-url";
import { downloadAdmissionFormPdf } from "@/lib/pdf-utils";
import { exportData } from "@/lib/export-utils";
import { useSettings } from "@/components/providers/settings-provider";
import { useCurrency } from "@/components/providers/currency-provider";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

function CardSkeleton({ count = 6 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl border border-muted/30 p-4 space-y-3 bg-card animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-muted/60" />
                        <div className="space-y-2 flex-1">
                            <div className="h-3 w-1/2 rounded bg-muted/60" />
                            <div className="h-3 w-1/3 rounded bg-muted/60" />
                        </div>
                    </div>
                    <div className="h-3 w-full rounded bg-muted/60" />
                    <div className="h-3 w-3/4 rounded bg-muted/60" />
                </div>
            ))}
        </>
    );
}

interface Student {
    id: number;
    name: string;
    last_name: string;
    admission_no: string;
    roll_no: string;
    dob: string;
    gender: string;
    category: string;
    phone: string;
    father_name: string;
    avatar?: string;
    religion?: string;
    caste?: string;
    blood_group?: string;
    school_class?: { name: string };
    section?: { name: string };
    student_category?: { category_name: string };
    active: boolean;
}

export default function StudentDetailsPage() {
    const tt = useTranslateToast();
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const getImageUrl = useImageUrl();
    const { settings } = useSettings();
    const { selectedCurrency } = useCurrency();
    const [viewMode, setViewMode] = useState<"list" | "details">("list");
    const [loading, setLoading] = useState(false);
    const [fetchingPrereqs, setFetchingPrereqs] = useState(true);
    const [hasSearched, setHasSearched] = useState(false);

    const [classes, setClasses] = useState<{ id: number; name: string; sections?: { id: number; name: string }[] }[]>([]);
    const [categories, setCategories] = useState<{ id: number; category_name?: string; name?: string }[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    const [filters, setFilters] = useState({
        school_class_id: searchParams.get("school_class_id") || "",
        section_id: searchParams.get("section_id") || "",
        search: searchParams.get("search") || "",
        status: searchParams.get("status") || "",
        gender: searchParams.get("gender") || "",
        category: searchParams.get("category") || "",
    });

    const [perPage, setPerPage] = useState<number>(50);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        from: 0,
        to: 0
    });

    // Action Dialogs
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [impersonatingId, setImpersonatingId] = useState<number | null>(null);

    const handleImpersonate = async (student: Student) => {
        setImpersonatingId(student.id);
        try {
            const res = await api.post(`/impersonate/student/${student.id}`);
            const data = res.data?.data;
            if (data?.access_token) {
                const currentAdminToken = localStorage.getItem("auth_token");
                if (currentAdminToken) {
                    localStorage.setItem("admin_auth_token", currentAdminToken);
                }
                localStorage.setItem("auth_token", data.access_token);
                localStorage.setItem("is_impersonating", "true");
                tt.success("impersonating_student_login_successful");
                setTimeout(() => {
                    window.location.href = "/user/dashboard";
                }, 400);
            } else {
                tt.error("failed_to_impersonate_student");
            }
        } catch (err: any) {
            console.error("Impersonation error:", err);
            tt.error(err?.response?.data?.message || "failed_to_impersonate_student");
        } finally {
            setImpersonatingId(null);
        }
    };

    const handleExport = (type: "copy" | "excel" | "pdf" | "print") => {
        if (!students || students.length === 0) {
            tt.error("no_data_to_export" || "No data to export");
            return;
        }
        const columns = [
            "#",
            "Admission No",
            "Student Name",
            "Class",
            "Section",
            "Roll No",
            "Father Name",
            "Date of Birth",
            "Gender",
            "Category",
            "Mobile Number",
            "Status"
        ];
        const rows = students.map((s, idx) => [
            ((pagination.current_page - 1) * perPage) + idx + 1,
            s.admission_no || "-",
            `${s.name || ""} ${s.last_name || ""}`.trim() || "-",
            s.school_class?.name || "-",
            s.section?.name || "-",
            s.roll_no || "-",
            s.father_name || "-",
            formatDate(s.dob),
            s.gender || "-",
            s.student_category?.category_name || s.category || "-",
            s.phone || "-",
            s.active ? "Active" : "Disabled"
        ]);

        exportData(type, {
            filename: `student-details-${new Date().toISOString().split("T")[0]}`,
            title: "Student Details List",
            columns,
            rows,
        });
        if (type === "copy") {
            tt.success("copied_to_clipboard" || "Copied to clipboard!");
        }
    };

    const handlePerPageChange = (newLimit: number) => {
        setPerPage(newLimit);
        if (hasSearched) {
            handleSearch(1, newLimit);
        }
    };

    useEffect(() => {
        fetchPrerequisites();
    }, []);

    // Sync URL search params into filters state when URL changes
    useEffect(() => {
        const urlSearch = searchParams.get("search") || "";
        const urlClass = searchParams.get("school_class_id") || "";
        const urlSection = searchParams.get("section_id") || "";
        const urlStatus = searchParams.get("status") || "";
        const urlGender = searchParams.get("gender") || "";
        const urlCategory = searchParams.get("category") || "";

        if (urlSearch || urlClass || urlSection || urlStatus || urlGender || urlCategory) {
            setFilters(prev => ({
                ...prev,
                search: urlSearch,
                school_class_id: urlClass,
                section_id: urlSection,
                status: urlStatus,
                gender: urlGender,
                category: urlCategory,
            }));
            setHasSearched(true);
        }
    }, [searchParams]);

    // Load students ONLY if active filter parameters are present in URL
    useEffect(() => {
        if (!fetchingPrereqs) {
            const urlSearch = searchParams.get("search") || "";
            const urlClass = searchParams.get("school_class_id") || "";
            const urlSection = searchParams.get("section_id") || "";
            if (urlClass || urlSearch || urlSection) {
                handleSearch(1);
            }
        }
    }, [fetchingPrereqs]);

    const fetchPrerequisites = async () => {
        try {
            const [classesRes, categoriesRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true").catch(() => ({ data: { data: [] } })),
                api.get("/student-categories").catch(() => ({ data: { data: [] } }))
            ]);
            setClasses(classesRes.data?.data?.data || classesRes.data?.data || []);
            setCategories(categoriesRes.data?.data?.data || categoriesRes.data?.data || []);
        } catch (error) {
            console.error("Error fetching prerequisites:", error);
            tt.error("failed_to_load_classes");
        } finally {
            setFetchingPrereqs(false);
        }
    };

    const getClassSections = (classId: string) => {
        if (!classId) return [];
        const selectedClass = classes.find(c => c.id.toString() === classId);
        return selectedClass?.sections || [];
    };

    const handleDelete = async () => {
        if (!selectedStudent) return;
        setDeleting(true);
        try {
            await api.delete(`/students/${selectedStudent.id}`);
            tt.success("student_record_deleted_successfully");
            setDeleteDialogOpen(false);
            handleSearch(pagination.current_page);
        } catch (error) {
            console.error("Delete error:", error);
            tt.error("failed_to_delete_student_record");
        } finally {
            setDeleting(false);
        }
    };

    const handleReset = () => {
        setFilters({
            school_class_id: "",
            section_id: "",
            search: "",
            status: "",
            gender: "",
            category: "",
        });
        setStudents([]);
        setHasSearched(false);
    };

    const handleDownloadPdf = async (student: Student) => {
        try {
            // Fetch full student details + admission form config in parallel.
            // The admission form config (documents, fee policy, office use only,
            // terms & conditions, declaration) is sourced from
            // /dashboard/system-setting/admission-form -> "Admission Form Setting" tab.
            const [studentRes, admissionFormRes, routesRes, pickupsRes, routePickupsRes, transportAssignmentsRes, hostelsRes, roomsRes, housesRes] = await Promise.all([
                api.get(`/students/${student.id}`),
                api.get("/system-setting/admission-form").catch(() => null),
                api.get("/transport/routes").catch(() => null),
                api.get("/transport/pickup-points").catch(() => null),
                api.get("/transport/route-pickup-points").catch(() => null),
                api.get("/transport/student-assignments").catch(() => null),
                api.get("/hostels").catch(() => null),
                api.get("/rooms").catch(() => null),
                api.get("/student-houses").catch(() => null),
            ]);
            const fullData = studentRes.data?.data || studentRes.data;
            if (!fullData) {
                tt.error("failed_to_load_student_details");
                return;
            }

            const routesList = routesRes?.data?.data?.data || routesRes?.data?.data || routesRes?.data || [];
            const pickupsList = pickupsRes?.data?.data?.data || pickupsRes?.data?.data || pickupsRes?.data || [];
            const routePickupsList = routePickupsRes?.data?.data?.data || routePickupsRes?.data?.data || routePickupsRes?.data || [];
            const transportAssignmentsList = transportAssignmentsRes?.data?.data?.data || transportAssignmentsRes?.data?.data || transportAssignmentsRes?.data || [];
            const hostelsList = hostelsRes?.data?.data?.data || hostelsRes?.data?.data || hostelsRes?.data || [];
            const roomsList = roomsRes?.data?.data?.data || roomsRes?.data?.data || roomsRes?.data || [];
            const housesList = housesRes?.data?.data?.data || housesRes?.data?.data || housesRes?.data || [];

            const studentAssignment = Array.isArray(transportAssignmentsList)
                ? transportAssignmentsList.find((a: any) => a.student_id?.toString() === (fullData.id || student.id)?.toString())
                : null;

            const routeId = fullData.transport_route_id || fullData.route_id || studentAssignment?.route_id || studentAssignment?.transport_route_id;
            const routeObj = Array.isArray(routesList) ? routesList.find((r: any) => r.id?.toString() === routeId?.toString()) : null;

            const routeName = (fullData.route_title && !/^\d+$/.test(String(fullData.route_title).trim())) ? fullData.route_title :
                (fullData.transport_route_name && !/^\d+$/.test(String(fullData.transport_route_name).trim())) ? fullData.transport_route_name :
                    fullData.route?.title || fullData.route?.route_title || fullData.route?.name ||
                    fullData.transport_route?.title || fullData.transport_route?.route_title || fullData.transport_route?.name ||
                    routeObj?.title || routeObj?.route_title || routeObj?.name;

            const pickupId = fullData.transport_pickup_point_id || fullData.pickup_point_id || fullData.route_pickup_point_id || studentAssignment?.pickup_point_id || studentAssignment?.route_pickup_point_id;
            const pickupObj = Array.isArray(pickupsList) ? pickupsList.find((p: any) => p.id?.toString() === pickupId?.toString()) : null;
            const routePickupMapping = Array.isArray(routePickupsList) ? routePickupsList.find((rp: any) => rp.id?.toString() === pickupId?.toString()) : null;
            const pickupObjFromMapping = routePickupMapping ? Array.isArray(pickupsList) && pickupsList.find((p: any) => p.id?.toString() === routePickupMapping.pickup_point_id?.toString()) : null;

            const pickupName = (fullData.pickup_point_name && !/^\d+$/.test(String(fullData.pickup_point_name).trim())) ? fullData.pickup_point_name :
                fullData.pickup_point?.point_name || fullData.pickup_point?.pickup_point_name || fullData.pickup_point?.name || fullData.pickup_point?.title ||
                pickupObj?.point_name || pickupObj?.pickup_point_name || pickupObj?.name || pickupObj?.title ||
                pickupObjFromMapping?.point_name || pickupObjFromMapping?.pickup_point_name || pickupObjFromMapping?.name;

            const hostelId = fullData.hostel_id || fullData.room?.hostel_id || fullData.hostel_room?.hostel_id;
            const hostelObj = Array.isArray(hostelsList) ? hostelsList.find((h: any) => h.id?.toString() === hostelId?.toString()) : null;

            const hostelName = (fullData.hostel_name && !/^\d+$/.test(String(fullData.hostel_name).trim())) ? fullData.hostel_name :
                fullData.hostel?.hostel_name || fullData.hostel?.name || fullData.hostel?.title ||
                fullData.room?.hostel?.hostel_name || fullData.room?.hostel?.name ||
                fullData.hostel_room?.hostel?.hostel_name || fullData.hostel_room?.hostel?.name ||
                hostelObj?.hostel_name || hostelObj?.name;

            const roomId = fullData.room_id || fullData.hostel_room_id;
            const roomObj = Array.isArray(roomsList) ? roomsList.find((r: any) => r.id?.toString() === roomId?.toString()) : null;

            const roomNo = (fullData.room_number && !/^\d+$/.test(String(fullData.room_number).trim())) ? String(fullData.room_number) :
                (fullData.room_no && !/^\d+$/.test(String(fullData.room_no).trim())) ? String(fullData.room_no) :
                    fullData.room?.room_number || fullData.room?.room_no || fullData.room?.name ||
                    fullData.hostel_room?.room_number || fullData.hostel_room?.room_no || fullData.hostel_room?.name ||
                    roomObj?.room_number || roomObj?.room_no || roomObj?.name;

            const houseId = fullData.house || fullData.student_house_id || fullData.house_id;
            const houseObj = Array.isArray(housesList) ? housesList.find((h: any) => h.id?.toString() === houseId?.toString() || h.name === houseId || h.house_name === houseId) : null;

            const houseName = (fullData.house_name && !/^\d+$/.test(String(fullData.house_name).trim())) ? fullData.house_name :
                fullData.student_house?.name || fullData.student_house?.house_name ||
                houseObj?.house_name || houseObj?.name || (houseId && !/^\d+$/.test(String(houseId).trim()) ? houseId : "");

            const className = fullData.school_class?.name || fullData.class_name || student.school_class?.name || "";
            const sectionName = fullData.section?.name || fullData.section_name || student.section?.name || "";

            const rawPhoto = fullData.avatar || fullData.student_photo || fullData.photo || fullData.image || student.avatar;
            const photoUrl = rawPhoto ? getImageUrl(rawPhoto) : undefined;

            const rawFatherPhoto = fullData.father_photo || fullData.father_image || fullData.father_pic;
            const rawMotherPhoto = fullData.mother_photo || fullData.mother_image || fullData.mother_pic;
            const rawGuardianPhoto = fullData.guardian_photo || fullData.guardian_image || fullData.guardian_pic;

            const parentPhotos = {
                father_photo: rawFatherPhoto ? getImageUrl(rawFatherPhoto) : undefined,
                mother_photo: rawMotherPhoto ? getImageUrl(rawMotherPhoto) : undefined,
                guardian_photo: rawGuardianPhoto ? getImageUrl(rawGuardianPhoto) : undefined,
            };

            const admissionFormConfig = admissionFormRes?.data?.data || null;

            await downloadAdmissionFormPdf(
                {
                    ...fullData,
                    route_title: routeName,
                    pickup_point_name: pickupName,
                    hostel_name: hostelName,
                    room_number: roomNo,
                    house_name: houseName,
                },
                className,
                sectionName,
                `student-details-${fullData.admission_no || student.id}.pdf`,
                photoUrl,
                {
                    name: settings?.school_name,
                    slogan: settings?.school_slogan,
                    school_code: settings?.school_code,
                    address: settings?.address,
                    phone: settings?.phone,
                    email: settings?.email,
                    website: settings?.website || settings?.url || "ischool.mddoulat.com",
                    print_logo: settings?.print_logo || settings?.admin_logo || settings?.app_logo || "/logo-print.png",
                    logo: settings?.print_logo || settings?.admin_logo || settings?.app_logo,
                    currencySymbol: selectedCurrency?.symbol || '$'
                },
                parentPhotos,
                admissionFormConfig
            );
        } catch (error) {
            console.error("Error downloading student PDF:", error);
            tt.error("failed_to_download_student_details");
        }
    };

    const handleSearch = async (page = 1, customLimit?: number) => {
        setHasSearched(true);
        setLoading(true);
        const limit = customLimit || perPage;
        try {
            const params: Record<string, any> = { limit, page };
            if (filters.school_class_id) params.school_class_id = filters.school_class_id;
            if (filters.section_id) params.section_id = filters.section_id;
            if (filters.status) params.status = filters.status;
            if (filters.gender) params.gender = filters.gender;
            if (filters.category) params.category = filters.category;
            if (filters.search) params.search = filters.search;

            const response = await api.get("/students", { params });
            const result = response.data?.data;
            const studentsData = result?.data || result || [];

            setStudents(studentsData);
            setPagination({
                current_page: result?.current_page || 1,
                last_page: result?.last_page || 1,
                total: result?.total || studentsData.length,
                from: result?.from || 1,
                to: result?.to || studentsData.length
            });

        } catch (error: any) {
            console.error("[StudentDetails] Error fetching students:", error?.response?.status, error?.response?.data || error?.message);
            tt.error("failed_to_fetch_students");
        } finally {
            setLoading(false);
        }
    };

    const tableHeaders = [
        "#", t("avatar"), t("admission_no"), t("student_name"), t("roll_no"), t("class"),
        t("father_name"), t("date_of_birth"), t("gender"), t("category"),
        t("mobile_number"), t("status"), t("action")
    ];

    return (
        <div className="space-y-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen animate-in fade-in duration-500">
            {/* Select Criteria Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("filter_students_by_class_section_status")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Class */}
                        <div className="space-y-1.5 group">
                            <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                {t("class")}
                            </label>
                            <div className="relative">
                                <select
                                    value={filters.school_class_id}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFilters(prev => ({ ...prev, school_class_id: val, section_id: "" }));
                                    }}
                                    className="flex h-11 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 px-3.5 py-2 text-xs text-gray-900 dark:text-gray-100 font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:bg-white dark:focus-visible:bg-gray-800 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" className="text-gray-400">{t("select_class")}</option>
                                    {classes.map(c => <option key={c.id} value={c.id} className="text-gray-900 font-medium">{c.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Section */}
                        <div className="space-y-1.5 group">
                            <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                {t("section")}
                            </label>
                            <div className="relative">
                                <select
                                    value={filters.section_id}
                                    onChange={(e) => setFilters(prev => ({ ...prev, section_id: e.target.value }))}
                                    className="flex h-11 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 px-3.5 py-2 text-xs text-gray-900 dark:text-gray-100 font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:bg-white dark:focus-visible:bg-gray-800 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" className="text-gray-400">{t("select_section")}</option>
                                    {getClassSections(filters.school_class_id).map(s => <option key={s.id} value={s.id} className="text-gray-900 font-medium">{s.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-1.5 group">
                            <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                {t("category")}
                            </label>
                            <div className="relative">
                                <select
                                    value={filters.category}
                                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                    className="flex h-11 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 px-3.5 py-2 text-xs text-gray-900 dark:text-gray-100 font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:bg-white dark:focus-visible:bg-gray-800 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" className="text-gray-400">{t("select_category") || "Select Category"}</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.category_name || cat.name || cat.id.toString()} className="text-gray-900 font-medium">
                                            {cat.category_name || cat.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="space-y-1.5 group">
                            <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                {t("gender")}
                            </label>
                            <div className="relative">
                                <select
                                    value={filters.gender}
                                    onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                                    className="flex h-11 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 px-3.5 py-2 text-xs text-gray-900 dark:text-gray-100 font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:bg-white dark:focus-visible:bg-gray-800 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" className="text-gray-400">{t("select_gender") || "Select Gender"}</option>
                                    <option value="Male" className="text-gray-900 font-medium">{t("male") || "Male"}</option>
                                    <option value="Female" className="text-gray-900 font-medium">{t("female") || "Female"}</option>
                                    <option value="Other" className="text-gray-900 font-medium">{t("other") || "Other"}</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5 group">
                            <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                {t("status")}
                            </label>
                            <div className="relative">
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    className="flex h-11 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 px-3.5 py-2 text-xs text-gray-900 dark:text-gray-100 font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:bg-white dark:focus-visible:bg-gray-800 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="" className="text-gray-400">{t("select_status")}</option>
                                    <option value="active" className="text-gray-900 font-medium">{t("active")}</option>
                                    <option value="disabled" className="text-gray-900 font-medium">{t("disabled")}</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Search By Keyword */}
                        <div className="space-y-1.5 group">
                            <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                {t("search_by_keyword")}
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                                <Input
                                    placeholder={t("search_by_student_name_roll_number_etc")}
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    className="h-11 pl-10 rounded-lg bg-gray-50/40 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold placeholder:text-gray-400 focus-visible:bg-white dark:focus-visible:bg-gray-800 focus-visible:ring-indigo-500 transition-all text-xs"
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch(1)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            variant="outline"
                            className="h-9 px-5 rounded-full border-gray-200 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider"
                            onClick={handleReset}
                            disabled={loading}
                        >
                            {t("reset")}
                        </Button>
                        <Button
                            className="btn-gradient text-white h-9 px-6 rounded-full text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer"
                            onClick={() => handleSearch(1)}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1.5" />}
                            {t("search")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Users className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_details")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {!hasSearched
                                    ? (t("search_by_class_and_section") || "Search by Class & Section to view records")
                                    : `${pagination.total} ${pagination.total === 1 ? t("student_found") : t("students_found")}`}
                            </p>
                        </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        {/* Row Selection Dropdown */}
                        <div className="relative">
                            <select
                                value={perPage}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                className="h-8 pl-3 pr-7 text-xs font-bold text-gray-700 dark:text-gray-200 bg-white/90 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
                            >
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={500}>500</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Export & Action Icon Buttons */}
                        <div className="flex items-center gap-1 bg-white/60 dark:bg-gray-800/60 p-1 rounded-lg border border-gray-200/60 dark:border-gray-700">
                            <Button
                                onClick={() => handleExport("copy")}
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                                title="Copy to clipboard"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                onClick={() => handleExport("excel")}
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                                title="Export to Excel (.xlsx)"
                            >
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                onClick={() => handleExport("pdf")}
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-rose-600 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                                title="Export to PDF"
                            >
                                <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                onClick={() => handleExport("print")}
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                                title="Print Table"
                            >
                                <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                onClick={() => setViewMode(prev => prev === "list" ? "details" : "list")}
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                                title={viewMode === "list" ? "Switch to Details View" : "Switch to List View"}
                            >
                                <Columns3 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/40">
                    <div className="flex px-4">
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer",
                                viewMode === "list" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-800"
                            )}
                        >
                            <LayoutList className="h-4 w-4" />
                            {t("list_view")}
                            {viewMode === "list" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full shadow-sm" />
                            )}
                        </button>
                        <button
                            onClick={() => setViewMode("details")}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer",
                                viewMode === "details" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 hover:text-gray-800"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            {t("details_view")}
                            {viewMode === "details" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full shadow-sm" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="p-0 min-h-[380px]">
                    {!hasSearched ? (
                        /* Initial Prompt Before Search */
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 px-4">
                            <div className="p-5 bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                                <FolderSearch className="h-12 w-12 text-[#6366F1]" />
                            </div>
                            <div className="space-y-1.5 max-w-md">
                                <h3 className="font-bold text-base text-gray-800 dark:text-gray-100">
                                    {t("search_by_class_and_section") || "Search by Class & Section"}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {t("please_select_class_section_and_search") || "Please select a Class and Section from the filter options above and click 'Search' to view student information."}
                                </p>
                            </div>
                            <Button
                                className="btn-gradient text-white h-9 px-6 rounded-full text-xs font-bold uppercase tracking-wider shadow-md mt-2 cursor-pointer"
                                onClick={() => handleSearch(1)}
                            >
                                <Search className="h-4 w-4 mr-1.5" />
                                {t("search_now") || "Search Now"}
                            </Button>
                        </div>
                    ) : loading ? (
                        viewMode === "list" ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                            {tableHeaders.map((header) => (
                                                <th key={header} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <TableSkeleton rows={8} cols={13} />
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                <CardSkeleton count={8} />
                            </div>
                        )
                    ) : students.length > 0 ? (
                        viewMode === "list" ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                            {tableHeaders.map((header) => (
                                                <th key={header} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {students.map((student, idx) => (
                                            <tr key={student.id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                                                <td className="px-4 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400">
                                                    {((pagination.current_page - 1) * perPage) + idx + 1}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <Avatar className="h-9 w-9 border border-gray-200 shadow-2xs">
                                                        <AvatarImage src={getImageUrl(student.avatar)} />
                                                        <AvatarFallback className="bg-indigo-50 text-indigo-700 text-[10px] font-black">
                                                            {student.name ? student.name.substring(0, 2).toUpperCase() : "ST"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900">
                                                        {student.admission_no}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span
                                                        onClick={() => {
                                                            setSelectedStudent(student);
                                                            setViewDialogOpen(true);
                                                        }}
                                                        className="text-xs font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600 transition-colors cursor-pointer"
                                                    >
                                                        {student.name} {student.last_name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-xs font-semibold text-gray-900 dark:text-gray-100">{student.roll_no || "-"}</td>
                                                <td className="px-4 py-3.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                                                    {student.school_class?.name} {student.section?.name ? `(${student.section?.name})` : ""}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs font-semibold text-gray-800 dark:text-gray-200">{student.father_name || "-"}</td>
                                                <td className="px-4 py-3.5 text-xs font-medium text-gray-700 dark:text-gray-300">{formatDate(student.dob)}</td>
                                                <td className="px-4 py-3.5 text-xs font-medium text-gray-700 dark:text-gray-300">{student.gender || "-"}</td>
                                                <td className="px-4 py-3.5 text-xs font-semibold text-gray-800 dark:text-gray-200">{student.student_category?.category_name || student.category || "-"}</td>
                                                <td className="px-4 py-3.5 text-xs font-semibold text-gray-800 dark:text-gray-200">{student.phone || "-"}</td>
                                                <td className="px-4 py-3.5">
                                                    <Badge className={cn(
                                                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                                        student.active
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                                                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                                                    )} variant="outline">
                                                        {student.active ? t("active") : t("disabled")}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-12 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 border-none text-white hover:from-purple-700 hover:to-indigo-700 transition-all shadow-xs hover:shadow-md shrink-0 cursor-pointer active:scale-95"
                                                            onClick={() => handleImpersonate(student)}
                                                            disabled={impersonatingId === student.id}
                                                            title="Login immediately as Student (Impersonate)"
                                                        >
                                                            {impersonatingId === student.id ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <LogIn className="h-3.5 w-3.5" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 border-none text-white hover:from-blue-600 hover:to-indigo-700 transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95"
                                                            onClick={() => {
                                                                setSelectedStudent(student);
                                                                setViewDialogOpen(true);
                                                            }}
                                                            title="View Student"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-12 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 border-none text-white hover:from-emerald-600 hover:to-teal-700 transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95"
                                                            onClick={() => handleDownloadPdf(student)}
                                                            title="Download Admission Form PDF"
                                                        >
                                                            <Download className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-12 rounded-lg bg-gradient-to-r from-[#FF9800] to-amber-500 border-none text-white hover:from-orange-500 hover:to-amber-600 transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95"
                                                            onClick={() => router.push(`/dashboard/student-information/student-details/${student.id}/edit`)}
                                                            title="Edit Student"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-12 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 border-none text-white hover:from-rose-600 hover:to-red-700 transition-all shadow-xs hover:shadow-md cursor-pointer active:scale-95"
                                                            onClick={() => {
                                                                setSelectedStudent(student);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                            title="Delete Student"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {students.map((student) => (
                                    <div
                                        key={student.id}
                                        className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                                    >
                                        {/* Card Top Banner with Status */}
                                        <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-gray-800 dark:to-gray-850 px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                                            <span className="font-mono text-[11px] font-bold text-indigo-600 bg-white/80 dark:bg-gray-800/80 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900 shadow-2xs">
                                                {student.admission_no}
                                            </span>
                                            <Badge className={cn(
                                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs",
                                                student.active
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                                                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                                            )}>
                                                {student.active ? t("active") : t("disabled")}
                                            </Badge>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-5 flex flex-col items-center text-center space-y-3.5 flex-1">
                                            <div className="relative cursor-pointer" onClick={() => { setSelectedStudent(student); setViewDialogOpen(true); }}>
                                                <Avatar className="h-20 w-20 rounded-2xl border-2 border-white dark:border-gray-800 shadow-md ring-2 ring-indigo-100 dark:ring-indigo-900/50">
                                                    <AvatarImage src={getImageUrl(student.avatar)} className="object-cover" />
                                                    <AvatarFallback className="bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10 text-indigo-700 text-xl font-black">
                                                        {student.name ? student.name.substring(0, 2).toUpperCase() : "ST"}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>

                                            <div className="space-y-0.5 w-full">
                                                <h3
                                                    onClick={() => { setSelectedStudent(student); setViewDialogOpen(true); }}
                                                    className="font-bold text-sm tracking-tight text-gray-900 dark:text-gray-100 line-clamp-1 hover:text-indigo-600 transition-colors cursor-pointer"
                                                >
                                                    {student.name} {student.last_name}
                                                </h3>
                                                <p className="text-[11px] font-medium text-gray-500">
                                                    {student.gender || "-"} {student.dob ? `• ${formatDate(student.dob)}` : ""}
                                                </p>
                                            </div>

                                            {/* Class & Roll No Badges with Luxury Soft Gradients */}
                                            <div className="w-full grid grid-cols-2 gap-2">
                                                <div className="bg-gradient-to-br from-indigo-50/90 via-indigo-50/40 to-purple-50/60 dark:from-indigo-950/40 dark:to-purple-950/30 p-2.5 rounded-xl text-center border border-indigo-100/80 dark:border-indigo-900/50 shadow-2xs">
                                                    <p className="text-[10px] font-bold text-indigo-600/90 dark:text-indigo-400 uppercase tracking-wider">{t("class")}</p>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 line-clamp-1 mt-0.5">
                                                        {student.school_class?.name || "-"} {student.section?.name ? `(${student.section?.name})` : ""}
                                                    </p>
                                                </div>
                                                <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/60 dark:from-amber-950/40 dark:to-orange-950/30 p-2.5 rounded-xl text-center border border-amber-100/80 dark:border-amber-900/50 shadow-2xs">
                                                    <p className="text-[10px] font-bold text-amber-600/90 dark:text-amber-400 uppercase tracking-wider">{t("roll_no")}</p>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 line-clamp-1 mt-0.5">
                                                        {student.roll_no || "-"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Details Rows */}
                                            <div className="w-full space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800 text-left text-[11.5px]">
                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                    <User className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                    <span className="truncate text-gray-600 dark:text-gray-400 font-medium">
                                                        {t("father_name")}: <strong className="text-gray-900 dark:text-gray-100 font-bold">{student.father_name || "-"}</strong>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                    <Phone className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                    <span className="truncate text-gray-600 dark:text-gray-400 font-medium">
                                                        {t("phone")}: <strong className="text-gray-900 dark:text-gray-100 font-bold">{student.phone || "-"}</strong>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                    <BadgeCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                    <span className="truncate text-gray-600 dark:text-gray-400 font-medium">
                                                        {t("category")}: <strong className="text-gray-900 dark:text-gray-100 font-bold">{student.student_category?.category_name || student.category || "-"}</strong>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Footer Action Buttons with Vibrant Gradient Colors */}
                                        <div className="bg-gray-50/80 dark:bg-gray-800/80 px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 border-none text-white hover:from-purple-700 hover:to-indigo-700 transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
                                                onClick={() => handleImpersonate(student)}
                                                disabled={impersonatingId === student.id}
                                                title="Login as Student"
                                            >
                                                {impersonatingId === student.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <LogIn className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 border-none text-white hover:from-blue-600 hover:to-indigo-700 transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
                                                onClick={() => {
                                                    setSelectedStudent(student);
                                                    setViewDialogOpen(true);
                                                }}
                                                title="View Details"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 border-none text-white hover:from-emerald-600 hover:to-teal-700 transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
                                                onClick={() => handleDownloadPdf(student)}
                                                title="Download PDF"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#FF9800] to-amber-500 border-none text-white hover:from-orange-500 hover:to-amber-600 transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
                                                onClick={() => router.push(`/dashboard/student-information/student-details/${student.id}/edit`)}
                                                title="Edit"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 border-none text-white hover:from-rose-600 hover:to-red-700 transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
                                                onClick={() => {
                                                    setSelectedStudent(student);
                                                    setDeleteDialogOpen(true);
                                                }}
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        /* Empty State */
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="relative group">
                                <div className="relative p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-200 shadow-2xs">
                                    <FolderSearch className="h-12 w-12 text-indigo-500" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-base text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                                    {t("no_students_found")}
                                </p>
                                <p className="text-xs text-gray-500 max-w-[320px] mx-auto leading-relaxed">
                                    {t("click_search_to_show_all_students_or_refine_your_filters")}
                                </p>
                            </div>
                            <div className="flex gap-2.5 pt-2">
                                <Button variant="outline" className="h-9 px-5 rounded-full text-xs font-bold uppercase border-gray-200" onClick={handleReset}>
                                    <Search className="h-4 w-4 mr-1.5" />
                                    {t("try_different_criteria")}
                                </Button>
                                <Button className="btn-gradient text-white h-9 px-6 rounded-full text-xs font-bold uppercase shadow-md" onClick={() => window.location.href = "/dashboard/student-information/student-admission"}>
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    {t("add_new_record")}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {!loading && students.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            {t("showing_x_to_y_of_z", { from: pagination.from, to: pagination.to, total: pagination.total })}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <Button
                                size="icon"
                                className="h-8 w-8 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                onClick={() => handleSearch(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1 || loading}
                            >
                                <ChevronDown className="h-4 w-4 rotate-90" />
                            </Button>
                            {[...Array(pagination.last_page)].map((_, i) => (
                                <Button
                                    key={i}
                                    onClick={() => handleSearch(i + 1)}
                                    className={cn(
                                        "h-8 w-8 rounded-lg p-0 text-xs font-bold transition-all shadow-xs cursor-pointer",
                                        pagination.current_page === i + 1
                                            ? "btn-gradient text-white"
                                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                    )}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                            <Button
                                size="icon"
                                className="h-8 w-8 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                onClick={() => handleSearch(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page || loading}
                            >
                                <ChevronDown className="h-4 w-4 -rotate-90" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* View Student Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="w-[96vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl p-0 overflow-hidden border border-gray-200/80 dark:border-gray-800 shadow-2xl rounded-3xl bg-white dark:bg-gray-900">
                    <DialogHeader className="p-6 md:p-8 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-gray-800 dark:to-gray-850 border-b border-gray-100 dark:border-gray-800 relative">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <Avatar className="h-24 w-24 md:h-28 md:w-28 rounded-3xl border-4 border-white dark:border-gray-800 shadow-lg relative shrink-0 ring-4 ring-indigo-100/60 dark:ring-indigo-950/40">
                                <AvatarImage src={getImageUrl(selectedStudent?.avatar)} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-br from-[#FF9800]/15 to-[#6366F1]/15 text-indigo-700 text-2xl font-black">
                                    {selectedStudent?.name ? selectedStudent?.name.substring(0, 2).toUpperCase() : "ST"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center sm:text-left space-y-2 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <Badge className="px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                                        {t("student_profile")}
                                    </Badge>
                                    <Badge className={cn(
                                        "px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs",
                                        selectedStudent?.active ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300" : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                                    )}>
                                        {selectedStudent?.active ? t("active") : t("disabled")}
                                    </Badge>
                                </div>
                                <DialogTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 truncate">
                                    {selectedStudent?.name} {selectedStudent?.last_name}
                                </DialogTitle>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2.5 pt-0.5">
                                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-bold text-xs bg-white/90 dark:bg-gray-800/90 px-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-2xs">
                                        <BadgeCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                                        <span className="text-gray-500 font-medium">{t("admission_no")}:</span>
                                        <strong className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{selectedStudent?.admission_no}</strong>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-bold text-xs bg-white/90 dark:bg-gray-800/90 px-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-2xs">
                                        <GraduationCap className="h-4 w-4 text-indigo-600 shrink-0" />
                                        <span>{selectedStudent?.school_class?.name || "Class"} {selectedStudent?.section?.name ? `(${selectedStudent.section.name})` : ""}</span>
                                    </div>
                                    {selectedStudent?.roll_no && (
                                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-bold text-xs bg-white/90 dark:bg-gray-800/90 px-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-gray-700 shadow-2xs">
                                            <User className="h-4 w-4 text-amber-500 shrink-0" />
                                            <span className="text-gray-500 font-medium">Roll:</span>
                                            <strong className="text-gray-900 dark:text-gray-100">{selectedStudent.roll_no}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personal Info */}
                            <div className="space-y-3.5 bg-gray-50/70 dark:bg-gray-800/40 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xs">
                                <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                    <User className="h-4 w-4" /> {t("personal_details")}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <InfoField label={t("date_of_birth")} value={formatDate(selectedStudent?.dob)} icon={Calendar} color="indigo" />
                                    <InfoField label={t("gender")} value={selectedStudent?.gender} icon={User} color="purple" />
                                    <InfoField label={t("blood_group")} value={selectedStudent?.blood_group || "-"} icon={BadgeCheck} color="rose" />
                                    <InfoField label={t("religion")} value={selectedStudent?.religion || "-"} icon={BadgeCheck} color="blue" />
                                </div>
                            </div>

                            {/* Contact & Parent Info */}
                            <div className="space-y-3.5 bg-gray-50/70 dark:bg-gray-800/40 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xs">
                                <h4 className="text-[11.5px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                    <Phone className="h-4 w-4" /> {t("contact_and_guardian")}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <InfoField label={t("mobile_number")} value={selectedStudent?.phone} icon={Phone} color="emerald" />
                                    <InfoField label={t("email_address")} value={selectedStudent?.email || "-"} icon={Mail} color="blue" />
                                    <InfoField label={t("father_name")} value={selectedStudent?.father_name} icon={User} color="amber" />
                                    <InfoField label={t("category")} value={selectedStudent?.student_category?.category_name || selectedStudent?.category || "-"} icon={BadgeCheck} color="indigo" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 md:p-6 bg-gray-50/80 dark:bg-gray-850/80 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center gap-3">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto rounded-full h-10 px-6 text-xs font-bold uppercase tracking-wider border-gray-200 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 shadow-xs cursor-pointer"
                            onClick={() => setViewDialogOpen(false)}
                        >
                            {t("close")}
                        </Button>
                        <div className="flex items-center gap-2.5 w-full sm:w-auto sm:ml-auto">
                            {selectedStudent && (
                                <Button
                                    className="flex-1 sm:flex-initial rounded-full h-10 px-6 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                                    onClick={() => {
                                        setViewDialogOpen(false);
                                        handleImpersonate(selectedStudent);
                                    }}
                                >
                                    <LogIn className="h-3.5 w-3.5 mr-1.5" />
                                    Impersonate
                                </Button>
                            )}
                            <Button
                                className="btn-gradient text-white flex-1 sm:flex-initial rounded-full h-10 px-7 text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                                onClick={() => {
                                    setViewDialogOpen(false);
                                    router.push(`/dashboard/student-information/student-details/${selectedStudent?.id}/edit`);
                                }}
                            >
                                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                {t("edit_profile")}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md border border-gray-200/80 dark:border-gray-800 shadow-2xl rounded-3xl bg-white dark:bg-gray-900 p-0 overflow-hidden">
                    <div className="p-6 sm:p-7 text-center">
                        <div className="mx-auto w-16 h-16 bg-rose-50 dark:bg-rose-950/50 rounded-2xl ring-8 ring-rose-50/60 dark:ring-rose-950/30 flex items-center justify-center mb-4 shadow-2xs">
                            <Trash2 className="h-8 w-8 text-rose-600 dark:text-rose-400" />
                        </div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                            {t("delete_record")}
                        </DialogTitle>
                        <DialogDescription className="text-center pt-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                            {t("are_you_sure_you_want_to_delete")}
                            <span className="block mt-2 font-bold text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 py-1.5 px-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 mx-auto max-w-xs truncate">
                                {selectedStudent?.name} {selectedStudent?.last_name}
                            </span>
                            <span className="block mt-2 text-[11px] text-gray-400">
                                {t("this_action_is_permanent_and_cannot_be_undone")}
                            </span>
                        </DialogDescription>
                    </div>
                    <DialogFooter className="flex flex-row gap-3 p-4 sm:p-5 bg-gray-50/80 dark:bg-gray-850/80 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-full h-10 text-xs font-bold uppercase tracking-wider border-gray-200 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 cursor-pointer shadow-xs"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleting}
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            className="flex-1 rounded-full h-10 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                            {t("delete_student")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function InfoField({ label, value, icon: Icon, color = "indigo" }: { label: string, value?: string, icon: React.ElementType, color?: string }) {
    const colorClasses = {
        indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50",
        purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border-purple-100 dark:border-purple-900/50",
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
        amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
        rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-100 dark:border-rose-900/50",
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-100 dark:border-blue-900/50",
    }[color] || "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50";

    return (
        <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-gray-850 border border-gray-100 dark:border-gray-800 shadow-2xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group">
            <div className={cn("p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-110", colorClasses)}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">{label}</p>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate mt-0.5">{value || "-"}</p>
            </div>
        </div>
    );
}
