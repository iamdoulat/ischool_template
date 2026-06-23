"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
    Plus,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    MoreVertical,
    Pencil,
    Trash2,
    GraduationCap,
    SlidersHorizontal,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface StudentMember {
    id: number;
    name: string;
    admission_no: string;
    father_name: string;
    dob: string;
    gender: string;
    phone: string;
    school_class?: { name: string };
    section?: { name: string };
    library_member?: {
        id: number;
        member_id: string;
        library_card_no: string;
        active: boolean;
    };
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const TABLE_COLS = 10;

function SkeletonRows({ rows = 6, cols = TABLE_COLS }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <div
                                className="h-3 rounded bg-gray-200/70 animate-pulse"
                                style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function AddStudentLibraryPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [students, setStudents] = useState<StudentMember[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState("50");

    const [classes, setClasses] = useState<{ id: number | string; name: string }[]>([]);
    const [sections, setSections] = useState<{ id: number | string; name: string }[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentMember | null>(null);
    const [memberFormData, setMemberFormData] = useState({
        library_card_no: "",
        member_id: ""
    });
    const [saving, setSaving] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<StudentMember | null>(null);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/academics/classes?no_paginate=true');
            setClasses(response.data.data ?? []);
        } catch (err) {
            console.error("Error fetching classes:", err);
        }
    };

    const fetchSections = async (classId: string) => {
        if (!classId) return;
        try {
            const response = await api.get(`/academics/sections?school_class_id=${classId}&no_paginate=true`);
            setSections(response.data.data ?? []);
        } catch (err) {
            console.error("Error fetching sections:", err);
        }
    };

    const fetchStudents = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/library/members?type=student&page=${page}&search=${searchTerm}&limit=${limit}&class_id=${selectedClass}&section_id=${selectedSection}`);
            setStudents(response.data.data ?? response.data ?? []);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching students:", error);
            tt.error("failed_to_fetch_student_records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchStudents();
    }, [limit]);

    useEffect(() => {
        if (selectedClass) {
            fetchSections(selectedClass);
        }
    }, [selectedClass]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStudents(1);
    };

    const handleAddMembership = (student: StudentMember) => {
        setSelectedStudent(student);
        setIsEditing(false);
        setMemberFormData({
            library_card_no: "",
            member_id: student.admission_no || ""
        });
        setIsDialogOpen(true);
    };

    const handleEditMembership = (student: StudentMember) => {
        setSelectedStudent(student);
        setIsEditing(true);
        setMemberFormData({
            library_card_no: student.library_member?.library_card_no || "",
            member_id: student.library_member?.member_id || ""
        });
        setIsDialogOpen(true);
    };

    const saveMembership = async () => {
        if (!memberFormData.member_id) {
            tt.error("library_member_id_required");
            return;
        }

        setSaving(true);
        try {
            await api.post('/library/members', {
                user_id: selectedStudent?.id,
                member_type: 'student',
                ...memberFormData
            });
            tt.success("library_membership_assigned_successfully");
            setIsDialogOpen(false);
            fetchStudents();
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            tt.error(message || "failed_to_assign_membership");
        } finally {
            setSaving(false);
        }
    };

    const updateMembership = async () => {
        if (!memberFormData.member_id) {
            tt.error("library_member_id_required");
            return;
        }

        setSaving(true);
        try {
            await api.put(`/library/members/${selectedStudent?.id}`, memberFormData);
            tt.success("library_membership_updated_successfully");
            setIsDialogOpen(false);
            fetchStudents();
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            tt.error(message || "failed_to_update_membership");
        } finally {
            setSaving(false);
        }
    };

    const handleRevokeClick = (student: StudentMember) => {
        setDeleteTarget(student);
        setIsDeleteDialogOpen(true);
    };

    const confirmRevoke = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/library/members/${deleteTarget.id}`);
            tt.success("membership_revoked_successfully");
            setIsDeleteDialogOpen(false);
            setDeleteTarget(null);
            fetchStudents();
        } catch {
            tt.error("failed_to_revoke_membership");
        }
    };

    const handleCopy = () => {
        const text = students.map(s => `${s.name}\t${s.admission_no}\t${s.library_member ? 'Member' : 'Not Member'}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const handleExportCSV = () => {
        const headers = ["Name", "Admission No", "Class", "Member ID", "Card No", "Status"];
        const rows = students.map(s => [s.name, s.admission_no, `${s.school_class?.name}(${s.section?.name})`, s.library_member?.member_id || "-", s.library_member?.library_card_no || "-", s.library_member ? 'Active' : 'Inactive']);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "library_students.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="space-y-6">
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <SlidersHorizontal className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("filter_students_by_class_and_section")}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">
                                {t("class")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">{t("section")}</Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map((sec) => (
                                        <SelectItem key={sec.id} value={String(sec.id)}>{sec.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button onClick={() => fetchStudents(1)} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                            <Search className="h-4 w-4" /> {t("search")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <GraduationCap className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_members_list")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("x_students_found", { count: pagination?.total ?? students.length })}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder={t("search_by_name_admission_no")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                                <Search className="h-4 w-4" /> {t("search")}
                            </Button>
                        </form>

                        <div className="flex items-center gap-2">
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="w-[70px] h-9 text-xs">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                {toolbarActions.map((action, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        onClick={action.onClick}
                                        title={action.title}
                                        className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                    >
                                        <action.Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("member_id")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("library_card_no")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("admission_no")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("student_name")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("class")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("father_name")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("date_of_birth")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("gender")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("mobile_number")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows rows={6} cols={TABLE_COLS} />
                                ) : students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            {t("no_students_found")}
                                        </TableCell>
                                    </TableRow>
                                ) : students.map((student) => (
                                    <TableRow
                                        key={student.id}
                                        className={cn(
                                            "text-xs hover:bg-gray-50/60 transition-colors whitespace-nowrap",
                                            student.library_member && "bg-[#e8f5e9]/60 hover:bg-[#c8e6c9]/60"
                                        )}
                                    >
                                        <TableCell className="py-3 text-gray-500">{student.library_member?.member_id || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{student.library_member?.library_card_no || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{student.admission_no}</TableCell>
                                        <TableCell className="py-3 text-gray-700 font-medium">{student.name}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{student.school_class?.name} ({student.section?.name})</TableCell>
                                        <TableCell className="py-3 text-gray-500">{student.father_name}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{student.dob ? formatDate(student.dob) : "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{student.gender}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{student.phone || "-"}</TableCell>
                                        <TableCell className="py-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="text-xs">
                                                    {student.library_member ? (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleEditMembership(student)}>
                                                                <Pencil className="h-3.5 w-3.5 mr-2" /> {t("edit")}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleRevokeClick(student)} className="text-red-500">
                                                                <Trash2 className="h-3.5 w-3.5 mr-2" /> {t("revoke")}
                                                            </DropdownMenuItem>
                                                        </>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleAddMembership(student)}>
                                                            <Plus className="h-3.5 w-3.5 mr-2" /> {t("add")}
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                        <div>
                            {t("showing_x_to_y_of_z", { from: pagination?.from || 0, to: pagination?.to || 0, total: pagination?.total || 0 })}
                        </div>
                        <div className="flex gap-1 items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination || pagination.current_page === 1}
                                onClick={() => fetchStudents(pagination!.current_page - 1)}
                                className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                <Button
                                    key={i + 1}
                                    size="sm"
                                    onClick={() => fetchStudents(i + 1)}
                                    className={cn(
                                        "h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all",
                                        pagination?.current_page === i + 1
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md"
                                            : "bg-white text-gray-600 border border-gray-200"
                                    )}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination || pagination.current_page === pagination.last_page}
                                onClick={() => fetchStudents(pagination!.current_page + 1)}
                                className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-800">{isEditing ? t("edit_library_member") : t("add_library_member")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("student_name")}</Label>
                            <Input value={selectedStudent?.name || ""} disabled className="h-9 bg-gray-50 border-gray-200 text-xs shadow-none" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("library_card_no")}</Label>
                                <Input
                                    value={memberFormData.library_card_no}
                                    onChange={(e) => setMemberFormData({ ...memberFormData, library_card_no: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                    placeholder={t("optional")}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                    {t("member_id")} <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input
                                    value={memberFormData.member_id}
                                    onChange={(e) => setMemberFormData({ ...memberFormData, member_id: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                    placeholder={t("required")}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full" disabled={saving}>{t("cancel")}</Button>
                        <Button onClick={isEditing ? updateMembership : saveMembership} className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[11px] uppercase font-bold shadow-lg active:scale-95 transition-all" disabled={saving}>
                            {saving ? t("saving") : isEditing ? t("update_member") : t("add_member")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="sm:max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("revoke_membership")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("revoke_membership_confirmation", { name: deleteTarget?.name || "" })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRevoke} className="bg-red-500 hover:bg-red-600 text-white">{t("revoke")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
