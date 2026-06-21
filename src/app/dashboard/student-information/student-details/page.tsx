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
    User,
    Users,
    Mail,
    Phone,
    Calendar,
    BadgeCheck,
    X,
    GraduationCap
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
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useImageUrl } from "@/lib/image-url";

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
    const { toast } = useToast();
    const router = useRouter();
    const getImageUrl = useImageUrl();
    const [viewMode, setViewMode] = useState<"list" | "details">("list");
    const [loading, setLoading] = useState(false);
    const [fetchingPrereqs, setFetchingPrereqs] = useState(true);

    const [classes, setClasses] = useState<{ id: number; name: string; sections?: { id: number; name: string }[] }[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

    const [filters, setFilters] = useState({
        school_class_id: "",
        section_id: "",
        search: "",
        status: ""
    });

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

    useEffect(() => {
        fetchPrerequisites();
    }, []);

    const fetchPrerequisites = async () => {
        try {
            const [classesRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true")
            ]);
            setClasses(classesRes.data.data?.data || classesRes.data.data || []);
        } catch (error) {
            console.error("Error fetching prerequisites:", error);
            toast("error", "Failed to load classes");
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
            toast("success", "Student record deleted successfully");
            setDeleteDialogOpen(false);
            handleSearch(pagination.current_page);
        } catch (error) {
            console.error("Delete error:", error);
            toast("error", "Failed to delete student record");
        } finally {
            setDeleting(false);
        }
    };

    const handleReset = () => {
        setFilters({
            school_class_id: "",
            section_id: "",
            search: "",
            status: ""
        });
        setStudents([]);
    };

    const handleSearch = async (page = 1) => {
        setLoading(true);
        try {
            const params: Record<string, any> = { limit: 50, page };
            if (filters.school_class_id) params.school_class_id = filters.school_class_id;
            if (filters.section_id) params.section_id = filters.section_id;
            if (filters.status) params.status = filters.status;
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

            if (!studentsData || studentsData.length === 0) {
                console.log("No students found. Params sent:", JSON.stringify(params), "API response:", JSON.stringify(response.data));
            }
        } catch (error) {
            console.error("Error fetching students:", error);
            toast("error", "Failed to fetch students");
        } finally {
            setLoading(false);
        }
    };

    const tableHeaders = [
        "Avatar", "Admission No", "Student Name", "Roll No.", "Class",
        "Father Name", "Date Of Birth", "Gender", "Category",
        "Mobile Number", "Status", "Action"
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Select Criteria Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Select Criteria</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Filter students by class, section &amp; status</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        {/* Class and Section fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    Class <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.school_class_id}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFilters(prev => ({ ...prev, school_class_id: val, section_id: "" }));
                                        }}
                                        className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    Section
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.section_id}
                                        onChange={(e) => setFilters(prev => ({ ...prev, section_id: e.target.value }))}
                                        className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Section</option>
                                        {getClassSections(filters.school_class_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    Status
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                        className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Status</option>
                                        <option value="active">Active</option>
                                        <option value="disabled">Disabled</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="sm:col-span-2 flex justify-end">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="h-11 px-6 rounded-lg border-muted/50 hover:bg-muted/50"
                                        onClick={handleReset}
                                        disabled={loading}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        variant="gradient"
                                        className="h-11 px-8"
                                        onClick={() => handleSearch(1)}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        Search
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Search By Keyword field */}
                        <div className="space-y-4 border-l border-muted/50 pl-8 hidden md:block">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    Search By Keyword
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Search By Student Name, Roll Number, etc."
                                        value={filters.search}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                        className="h-11 pl-11 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all"
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch(1)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="h-11 px-6 rounded-lg border-muted/50 hover:bg-muted/50"
                                        onClick={handleReset}
                                        disabled={loading}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        variant="gradient"
                                        className="h-11 px-8"
                                        onClick={() => handleSearch(1)}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        Search
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Users className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Student Details</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{pagination.total} student{pagination.total === 1 ? "" : "s"} found</p>
                    </div>
                </CardHeader>

                <div className="border-b border-muted/50">
                    <div className="flex px-2">
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative",
                                viewMode === "list" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutList className="h-4 w-4" />
                            List View
                            {viewMode === "list" && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary),0.5)]" />
                            )}
                        </button>
                        <button
                            onClick={() => setViewMode("details")}
                            className={cn(
                                "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative",
                                viewMode === "details" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Details View
                            {viewMode === "details" && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary),0.5)]" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="p-0 min-h-[400px]">
                    {loading ? (
                        viewMode === "list" ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/30">
                                            {tableHeaders.map((header) => (
                                                <th key={header} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <TableSkeleton rows={8} cols={12} />
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
                                        <tr className="bg-muted/30">
                                            {tableHeaders.map((header) => (
                                                <th key={header} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student) => (
                                            <tr key={student.id} className="group hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <Avatar className="h-10 w-10 border border-muted-foreground/20 shadow-sm">
                                                        <AvatarImage src={getImageUrl(student.avatar)} />
                                                        <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-black">
                                                            {student.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-foreground/80">{student.admission_no}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-primary">{student.name} {student.last_name}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-foreground/80">{student.roll_no || "-"}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-foreground/80">
                                                    {student.school_class?.name} ({student.section?.name})
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-foreground/80">{student.father_name || "-"}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-foreground/80">{formatDate(student.dob)}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-foreground/80">{student.gender || "-"}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-foreground/80">{student.student_category?.category_name || student.category || "-"}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-foreground/80">{student.phone || "-"}</td>
                                                <td className="px-6 py-4">
                                                    <Badge className={cn(
                                                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                        student.active
                                                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                            : "bg-red-500/10 text-red-600 border-red-500/20"
                                                    )} variant="outline">
                                                        {student.active ? "Active" : "Disabled"}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg bg-indigo-500 border-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-sm"
                                                            onClick={() => {
                                                                setSelectedStudent(student);
                                                                setViewDialogOpen(true);
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg bg-amber-500 border-amber-500 text-white hover:bg-amber-600 transition-all shadow-sm"
                                                            onClick={() => router.push(`/dashboard/student-information/student-details/${student.id}/edit`)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg bg-red-500 border-red-500 text-white hover:bg-red-600 transition-all shadow-sm"
                                                            onClick={() => {
                                                                setSelectedStudent(student);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
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
                                    <div key={student.id} className="group relative bg-card rounded-lg border border-muted/50 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 z-10">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-indigo-500 border-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-lg"
                                                onClick={() => {
                                                    setSelectedStudent(student);
                                                    setViewDialogOpen(true);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-amber-500 border-amber-500 text-white hover:bg-amber-600 transition-all shadow-lg"
                                                onClick={() => router.push(`/dashboard/student-information/student-details/${student.id}/edit`)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-red-500 border-red-500 text-white hover:bg-red-600 transition-all shadow-lg"
                                                onClick={() => {
                                                    setSelectedStudent(student);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <div className="relative">
                                                <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-indigo-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500" />
                                                <Avatar className="h-24 w-24 rounded-lg border-2 border-white shadow-md relative">
                                                    <AvatarImage src={getImageUrl(student.avatar)} />
                                                    <AvatarFallback className="bg-primary/5 text-primary text-2xl font-black">
                                                        {student.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="font-black text-lg tracking-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                                    {student.name} {student.last_name}
                                                </h3>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1 rounded-full inline-block">
                                                    ADM: {student.admission_no}
                                                </p>
                                            </div>

                                            <div className="w-full pt-4 grid grid-cols-2 gap-3">
                                                <div className="bg-muted/30 p-2 rounded-lg text-center">
                                                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase">Class</p>
                                                    <p className="text-xs font-bold text-foreground line-clamp-1">{student.school_class?.name}</p>
                                                </div>
                                                <div className="bg-muted/30 p-2 rounded-lg text-center">
                                                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase">Roll No</p>
                                                    <p className="text-xs font-bold text-foreground">{student.roll_no || "-"}</p>
                                                </div>
                                            </div>

                                            <div className="w-full space-y-2 pt-2 border-t border-muted/50">
                                                <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px]">
                                                    <User className="h-3 w-3 text-primary/60" />
                                                    <span className="line-clamp-1">F: {student.father_name || "-"}</span>
                                                </div>
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px]">
                                                        <Phone className="h-3 w-3 text-primary/60" />
                                                        <span>{student.phone || "-"}</span>
                                                    </div>
                                                    <Badge className={cn(
                                                        "px-2 py-0 rounded-full text-[8px] font-bold uppercase tracking-widest border-none shadow-none h-4",
                                                        student.active
                                                            ? "bg-green-500/10 text-green-600"
                                                            : "bg-red-500/10 text-red-600"
                                                    )}>
                                                        {student.active ? "Active" : "Disabled"}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px]">
                                                    <BadgeCheck className="h-3 w-3 text-primary/60" />
                                                    <span className="line-clamp-1">Cat: {student.student_category?.category_name || student.category || "-"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        /* Empty State */
                        <div className="py-24 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="relative p-8 bg-muted/30 rounded-[2.5rem] border border-muted/50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                    <img
                                        src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png"
                                        alt="No Data"
                                        className="h-24 w-24 object-contain opacity-80 drop-shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-500"
                                    />
                                    <div className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-muted/50">
                                        <FolderSearch className="h-6 w-6 text-amber-500" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="font-black text-xl tracking-tight text-foreground uppercase">
                                    No students found
                                </p>
                                <p className="text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
                                    Click Search to show all students, or refine your filters above.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="h-12 px-6 rounded-lg" onClick={handleReset}>
                                    <Search className="h-5 w-5" />
                                    Try different criteria
                                </Button>
                                <Button variant="gradient" className="h-12 px-8 rounded-lg" onClick={() => window.location.href = "/dashboard/student-information/student-admission"}>
                                    <Plus className="h-5 w-5" />
                                    Add new record
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {!loading && students.length > 0 && (
                    <div className="px-6 py-4 bg-muted/10 border-t border-muted/50 flex items-center justify-between">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Showing {pagination.from} to {pagination.to} of {pagination.total} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                size="icon"
                                className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 disabled:opacity-50"
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
                                        "h-8 w-8 rounded-[10px] p-0 font-bold active:scale-95 transition-all shadow-md",
                                        pagination.current_page === i + 1
                                            ? "text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1]"
                                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                            <Button
                                size="icon"
                                className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 disabled:opacity-50"
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
                <DialogContent className="max-w-[1350px] p-0 overflow-hidden border-none shadow-2xl rounded-lg bg-background/95 backdrop-blur-md">
                    <DialogHeader className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative">
                        <div className="absolute top-4 right-4">
                            <Button variant="ghost" size="icon" onClick={() => setViewDialogOpen(false)} className="rounded-full hover:bg-white/20 transition-all">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-indigo-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-500" />
                                <Avatar className="h-32 w-32 md:h-40 md:w-40 rounded-lg border-4 border-white shadow-xl relative transition-transform duration-500 group-hover:scale-[1.02]">
                                    <AvatarImage src={getImageUrl(selectedStudent?.avatar)} />
                                    <AvatarFallback className="bg-primary/5 text-primary text-4xl font-black">
                                        {selectedStudent?.name?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="text-center md:text-left space-y-3">
                                <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-primary/10 text-primary border-primary/20 text-xs font-bold uppercase tracking-widest shadow-sm">
                                    Student Profile
                                </Badge>
                                <DialogTitle className="text-4xl font-black tracking-tight text-foreground">
                                    {selectedStudent?.name} {selectedStudent?.last_name}
                                </DialogTitle>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm bg-white/50 px-3 py-1.5 rounded-lg border border-muted/50">
                                        <BadgeCheck className="h-4 w-4 text-primary" />
                                        ADM: {selectedStudent?.admission_no}
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm bg-white/50 px-3 py-1.5 rounded-lg border border-muted/50">
                                        <GraduationCap className="h-4 w-4 text-indigo-500" />
                                        {selectedStudent?.school_class?.name} ({selectedStudent?.section?.name})
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Personal Info */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 px-1">Personal Details</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <InfoField label="Date of Birth" value={formatDate(selectedStudent?.dob)} icon={Calendar} />
                                    <InfoField label="Gender" value={selectedStudent?.gender} icon={User} />
                                    <InfoField label="Blood Group" value={selectedStudent?.blood_group || "-"} icon={BadgeCheck} />
                                    <InfoField label="Religion" value={selectedStudent?.religion || "-"} icon={BadgeCheck} />
                                </div>
                            </div>

                            {/* Contact & Parent Info */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/60 px-1">Contact &amp; Guardian</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <InfoField label="Mobile Number" value={selectedStudent?.phone} icon={Phone} />
                                    <InfoField label="Email Address" value={selectedStudent?.email || "-"} icon={Mail} />
                                    <InfoField label="Father Name" value={selectedStudent?.father_name} icon={User} />
                                    <InfoField label="Category" value={selectedStudent?.student_category?.category_name || selectedStudent?.category || "-"} icon={BadgeCheck} />
                                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/10 border border-muted/50 group hover:bg-white hover:shadow-md transition-all duration-300">
                                        <div className="p-2.5 bg-white rounded-lg shadow-sm border border-muted group-hover:scale-110 transition-transform">
                                            <BadgeCheck className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Status</p>
                                            <Badge className={cn(
                                                "mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none",
                                                selectedStudent?.active
                                                    ? "bg-green-500/10 text-green-600"
                                                    : "bg-red-500/10 text-red-600"
                                            )}>
                                                {selectedStudent?.active ? "Active" : "Disabled"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-muted/20 border-t border-muted/50 flex flex-row gap-3">
                        <Button variant="outline" className="flex-1 rounded-lg h-12 font-bold" onClick={() => setViewDialogOpen(false)}>
                            Close
                        </Button>
                        <Button
                            variant="gradient"
                            className="flex-1 rounded-lg h-12 font-bold"
                            onClick={() => {
                                setViewDialogOpen(false);
                                router.push(`/dashboard/student-information/student-details/${selectedStudent?.id}/edit`);
                            }}
                        >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md border-none shadow-2xl rounded-lg bg-background/95 backdrop-blur-md">
                    <DialogHeader className="pt-6">
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                            <Trash2 className="h-8 w-8 text-red-600" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-center tracking-tight">Delete Record?</DialogTitle>
                        <DialogDescription className="text-center pt-2 font-medium">
                            Are you sure you want to delete <span className="text-foreground font-bold">{selectedStudent?.name} {selectedStudent?.last_name}</span>?
                            <br />This action is permanent and cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-row gap-3 p-6 mt-2">
                        <Button variant="outline" className="flex-1 rounded-lg h-12 font-bold" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1 rounded-lg h-12 font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Delete Student"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function InfoField({ label, value, icon: Icon }: { label: string, value?: string, icon: React.ElementType }) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/10 border border-muted/50 group hover:bg-white hover:shadow-md transition-all duration-300">
            <div className="p-2.5 bg-white rounded-lg shadow-sm border border-muted group-hover:scale-110 transition-transform">
                <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">{label}</p>
                <p className="text-sm font-bold text-foreground">{value || "N/A"}</p>
            </div>
        </div>
    );
}
