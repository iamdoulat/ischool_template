"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Pencil,
    Trash2,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    Loader2,
    UserCheck,
    GraduationCap,
    LayoutGrid,
    CheckCircle2,
    Users,
    IdCard,
    Columns
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { getImageUrl } from "@/lib/image-url";
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
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";

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

interface Teacher {
    id: number;
    name: string;
    staff_id?: string;
    avatar?: string;
    photo?: string;
}

interface ClassTeacherAssignment {
    id: string; // class_id-section_id
    class_id: number;
    section_id: number;
    class_name: string;
    section_name: string;
    teachers: Teacher[];
}

interface SchoolClass {
    id: number;
    name: string;
}

interface Section {
    id: number;
    name: string;
    school_class_id?: number | string;
}

interface Staff {
    id: number;
    name: string;
    staff_id?: string;
    avatar?: string;
    photo?: string;
}

export default function AssignClassTeacherPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [teacherFilterTerm, setTeacherFilterTerm] = useState("");

    // Data states
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [assignments, setAssignments] = useState<ClassTeacherAssignment[]>([]);

    // Form states
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
    const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

    // UI states
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Selection state
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

    // Dialog states
    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    // Load prerequisites (classes, teachers, assignments)
    const fetchPrerequisites = async () => {
        setLoading(true);
        try {
            const [classRes, staffRes, assignRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/hr/staff-directory", { params: { role: 'Teacher', no_paginate: true, active: 'all' } }),
                api.get("/academics/class-teachers")
            ]);
            setClasses(classRes.data.data?.data || classRes.data.data || []);
            const teachers = (staffRes.data?.data || staffRes.data || []).filter((u: { role?: string }) => u.role === 'Teacher');
            setStaffList(teachers);
            setAssignments(assignRes.data.data || []);
        } catch (error) {
            console.error("Error fetching prerequisites:", error);
            tt.error("failed_to_load");
        } finally {
            setLoading(false);
        }
    };

    // Fetch sections filtered by selected class ID
    const fetchSectionsByClass = async (classId: string) => {
        if (!classId) { setSections([]); return; }
        try {
            const res = await api.get('/academics/sections?with_class=true&no_paginate=true');
            const all: Section[] = res.data?.data || res.data || [];
            const filtered = all.filter((s: Section) => String(s.school_class_id) === String(classId));
            setSections(filtered);
        } catch {
            setSections([]);
        }
    };

    useEffect(() => {
        fetchPrerequisites();
    }, []);

    const resetForm = () => {
        setSelectedClassId("");
        setSelectedSectionId("");
        setSelectedStaffIds([]);
        setEditingAssignmentId(null);
    };

    const handleSave = async () => {
        if (!selectedClassId || !selectedSectionId || selectedStaffIds.length === 0) {
            tt.error("please_fill_required_fields");
            return;
        }

        setSaving(true);
        try {
            await api.post("/academics/class-teachers", {
                school_class_id: parseInt(selectedClassId),
                section_id: parseInt(selectedSectionId),
                teacher_ids: selectedStaffIds
            });
            tt.success("class_teachers_assigned_successfully");

            // Refresh list
            const assignRes = await api.get("/academics/class-teachers");
            setAssignments(assignRes.data.data || []);

            // Clear form
            resetForm();
        } catch (error) {
            console.error("Error saving assignment:", error);
            tt.error("failed_to_save");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (assignment: ClassTeacherAssignment) => {
        setSelectedClassId(assignment.class_id.toString());
        fetchSectionsByClass(assignment.class_id.toString());
        setSelectedSectionId(assignment.section_id.toString());
        setSelectedStaffIds(assignment.teachers.map(t => t.id));
        setEditingAssignmentId(assignment.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggleStaffSelection = (id: number) => {
        setSelectedStaffIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleSelectAllTeachers = () => {
        if (selectedStaffIds.length === staffList.length) {
            setSelectedStaffIds([]);
        } else {
            setSelectedStaffIds(staffList.map(s => s.id));
        }
    };

    const toggleRowSelection = (id: string) => {
        setSelectedKeys(prev =>
            prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedKeys.length === filteredAssignments.length) {
            setSelectedKeys([]);
        } else {
            setSelectedKeys(filteredAssignments.map(a => a.id));
        }
    };

    const confirmDelete = (id: string) => {
        setIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!idToDelete) return;
        setDeleting(true);
        try {
            await api.delete(`/academics/class-teachers/${idToDelete}`);
            tt.success("assignment_removed_successfully");
            setAssignments(prev => prev.filter(a => a.id !== idToDelete));
            setSelectedKeys(prev => prev.filter(k => k !== idToDelete));
        } catch (error) {
            console.error("Error deleting assignment:", error);
            tt.error("failed_to_delete");
        } finally {
            setDeleting(false);
            setIsDeleteDialogOpen(false);
            setIdToDelete(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedKeys.length === 0) return;
        setDeleting(true);
        try {
            await api.post("/academics/class-teachers/bulk-delete", { keys: selectedKeys });
            tt.success("assignments_removed_successfully", { count: selectedKeys.length });
            setAssignments(prev => prev.filter(a => !selectedKeys.includes(a.id)));
            setSelectedKeys([]);
        } catch (error) {
            console.error("Error in bulk delete:", error);
            tt.error("failed_to_delete_selected_assignments");
        } finally {
            setDeleting(false);
            setIsBulkDeleteDialogOpen(false);
        }
    };

    // Export functions
    const handleCopy = () => {
        const text = filteredAssignments.map((a, idx) =>
            `${idx + 1}. ${a.class_name} (Section ${a.section_name}) - Teachers: ${a.teachers.map(t => `${t.name}${t.staff_id ? ` (${t.staff_id})` : ''}`).join(', ')}`
        ).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const handleExportExcel = () => {
        const data = filteredAssignments.map((a, idx) => ({
            "#": idx + 1,
            [t("class")]: a.class_name,
            [t("section")]: `Section ${a.section_name}`,
            [t("class_teacher")]: a.teachers.map(t => `${t.name}${t.staff_id ? ` (${t.staff_id})` : ''}`).join(', '),
            "Status": "Active"
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Class Teachers");
        XLSX.writeFile(workbook, "class_teacher_assignments.xlsx");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Class Teacher Assignment List", 14, 15);
        autoTable(doc, {
            head: [["#", t("class"), t("section"), t("class_teacher"), "Status"]],
            body: filteredAssignments.map((a, idx) => [
                idx + 1,
                a.class_name,
                `Section ${a.section_name}`,
                a.teachers.map(t => `${t.name}${t.staff_id ? ` (${t.staff_id})` : ''}`).join(', '),
                "Active"
            ]),
            startY: 20
        });
        doc.save("class_teacher_assignments.pdf");
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredAssignments = assignments.filter(a =>
        a.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.section_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.teachers.some(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || (t.staff_id && t.staff_id.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const filteredStaff = staffList.filter(s =>
        s.name.toLowerCase().includes(teacherFilterTerm.toLowerCase()) ||
        (s.staff_id && s.staff_id.toLowerCase().includes(teacherFilterTerm.toLowerCase()))
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen">
            {/* Left Column: Form */}
            <div className="w-full lg:w-1/3 space-y-4">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <UserCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {editingAssignmentId ? "Edit Class Teacher" : t("assign_class_teacher")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("assign_teachers_to_class_section")}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 space-y-4">
                        {/* Class Select */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("class")} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedClassId}
                                onValueChange={(val) => {
                                    setSelectedClassId(val);
                                    setSelectedSectionId('');
                                    fetchSectionsByClass(val);
                                }}
                            >
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Section Select */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("section")} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedSectionId}
                                onValueChange={setSelectedSectionId}
                                disabled={!selectedClassId}
                            >
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder={!selectedClassId ? t("select_class_first") : t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Class Teacher Select Box */}
                        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    {t("class_teacher")} <span className="text-red-500">*</span>
                                </Label>
                                {staffList.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleSelectAllTeachers}
                                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                                    >
                                        {selectedStaffIds.length === staffList.length ? "Deselect All" : "Select All"}
                                    </button>
                                )}
                            </div>

                            {/* Search Teacher Input */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input
                                    placeholder="Search teacher by name / ID..."
                                    value={teacherFilterTerm}
                                    onChange={(e) => setTeacherFilterTerm(e.target.value)}
                                    className="pl-8 h-8 text-[11px] border-gray-200 bg-gray-50/30 rounded-lg shadow-none"
                                />
                            </div>

                            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 border border-gray-200 rounded-xl p-2.5 bg-gray-50/30">
                                {filteredStaff.length === 0 ? (
                                    <p className="text-xs text-center text-gray-400 py-4">{t("no_staff_found")}</p>
                                ) : (
                                    filteredStaff.map((staff) => {
                                        const isSelected = selectedStaffIds.includes(staff.id);
                                        return (
                                            <div
                                                key={staff.id}
                                                onClick={() => toggleStaffSelection(staff.id)}
                                                className={cn(
                                                    "flex items-center space-x-2.5 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all",
                                                    isSelected
                                                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/40"
                                                        : "bg-white border-gray-200 text-gray-700 hover:border-indigo-200"
                                                )}
                                            >
                                                <Checkbox
                                                    id={`staff-${staff.id}`}
                                                    checked={isSelected}
                                                    className="h-4 w-4 rounded-md data-[state=checked]:bg-indigo-600 shadow-2xs"
                                                />
                                                <div className="flex items-center justify-between flex-1 min-w-0">
                                                    <span className="truncate">{staff.name}</span>
                                                    {staff.staff_id && (
                                                        <span className="text-[10px] font-mono text-gray-400 font-normal ml-1">
                                                            {staff.staff_id}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                            {editingAssignmentId && (
                                <Button
                                    type="button"
                                    onClick={resetForm}
                                    variant="outline"
                                    className="h-9 px-4 rounded-full text-xs font-bold uppercase border-gray-200"
                                >
                                    {t("cancel")}
                                </Button>
                            )}
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-gradient text-white px-8 h-9 text-[11px] font-bold uppercase shadow-lg shadow-orange-200/50 transition-all rounded-full flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        {t("saving")}
                                    </>
                                ) : (
                                    editingAssignmentId ? t("update") : t("save")
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: List */}
            <div className="w-full lg:w-2/3 space-y-4">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 font-sans">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <UserCheck className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("class_teacher_list")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("total_entries_count", { count: filteredAssignments.length })}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-gray-400">
                            {selectedKeys.length > 0 && (
                                <Button
                                    onClick={() => setIsBulkDeleteDialogOpen(true)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1 font-bold mr-1 cursor-pointer"
                                    title={t("delete_selected")}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete ({selectedKeys.length})
                                </Button>
                            )}
                            <Button onClick={handleCopy} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title={t("copy")}>
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button onClick={handleExportExcel} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title={t("excel")}>
                                <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button onClick={handleExportPDF} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title={t("pdf")}>
                                <FileText className="h-4 w-4" />
                            </Button>
                            <Button onClick={handlePrint} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title={t("print")}>
                                <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Columns">
                                <Columns className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 space-y-4">
                        {/* Search Bar */}
                        <div className="flex justify-between items-center gap-4">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by class, section, teacher..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 text-xs border-gray-200 bg-gray-50/30 rounded-lg focus-visible:ring-indigo-500 shadow-none"
                                />
                            </div>

                            {filteredAssignments.length > 0 && (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10.5px] font-bold py-1 px-2.5">
                                    <Users className="h-3 w-3 mr-1" />
                                    {filteredAssignments.length} Assigned Sections
                                </Badge>
                            )}
                        </div>

                        {/* Enhanced Table */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
                            <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-gray-800/80 text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300">
                                    <TableRow className="hover:bg-transparent border-gray-200 dark:border-gray-700">
                                        <TableHead className="w-[45px] pl-4">
                                            <Checkbox
                                                checked={filteredAssignments.length > 0 && selectedKeys.length === filteredAssignments.length}
                                                onCheckedChange={toggleSelectAll}
                                                className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-600 shadow-2xs"
                                            />
                                        </TableHead>
                                        <TableHead className="py-3 px-3 w-[60px]">#</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[140px]">{t("class")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[120px]">{t("section")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[260px]">{t("class_teacher")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[110px]">Status</TableHead>
                                        <TableHead className="py-3 px-4 text-right w-[100px]">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={4} cols={7} />
                                    ) : filteredAssignments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="px-4 py-16 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                                {t("no_data_found")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredAssignments.map((assignment, idx) => {
                                            const isSelected = selectedKeys.includes(assignment.id);
                                            return (
                                                <TableRow
                                                    key={assignment.id}
                                                    className={cn(
                                                        "text-[13px] border-b last:border-0 border-gray-100 dark:border-gray-800 transition-colors group align-top",
                                                        isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : "hover:bg-indigo-50/20"
                                                    )}
                                                >
                                                    <TableCell className="pl-4 py-3.5">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleRowSelection(assignment.id)}
                                                            className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-600 shadow-2xs"
                                                        />
                                                    </TableCell>

                                                    {/* Serial Number */}
                                                    <TableCell className="py-3.5 px-3 font-bold text-gray-400 text-xs">
                                                        {idx + 1}
                                                    </TableCell>

                                                    {/* Class */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-100 dark:border-indigo-800 shadow-2xs">
                                                            <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                                                            {assignment.class_name}
                                                        </span>
                                                    </TableCell>

                                                    {/* Section */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-[11px] border border-gray-200 dark:border-gray-700">
                                                            Section {assignment.section_name}
                                                        </span>
                                                    </TableCell>

                                                    {/* Class Teacher(s) */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <div className="space-y-1.5">
                                                            {assignment.teachers.map((teacher) => (
                                                                <div
                                                                    key={teacher.id}
                                                                    className="inline-flex items-center gap-2.5 px-2.5 py-1 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-2xs mr-1.5 mb-1"
                                                                >
                                                                    <Avatar className="h-6 w-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
                                                                        <AvatarImage
                                                                            src={getImageUrl(teacher.avatar || teacher.photo)}
                                                                            alt={teacher.name}
                                                                            className="object-cover"
                                                                        />
                                                                        <AvatarFallback className="bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white font-bold text-[9px]">
                                                                            {teacher.name.slice(0, 2).toUpperCase()}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="font-bold text-xs text-gray-800 dark:text-gray-100">
                                                                        {teacher.name}
                                                                    </span>
                                                                    {teacher.staff_id && (
                                                                        <span className="text-[10px] font-mono font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">
                                                                            {teacher.staff_id}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                                                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                            Assigned
                                                        </span>
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                onClick={() => handleEdit(assignment)}
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-xs"
                                                                title="Edit Assignment"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                onClick={() => confirmDelete(assignment.id)}
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all shadow-xs"
                                                                title="Delete Assignment"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Footer */}
                        {filteredAssignments.length > 0 && (
                            <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-2 uppercase tracking-tight">
                                <div>
                                    {t("showing_x_to_y_of_z", { from: 1, to: filteredAssignments.length, total: filteredAssignments.length })}
                                </div>
                                <div className="flex gap-1.5">
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-white border border-gray-200 text-gray-600 rounded-[10px] shadow-sm disabled:opacity-40"
                                        disabled
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-sm font-black"
                                    >
                                        1
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-white border border-gray-200 text-gray-600 rounded-[10px] shadow-sm disabled:opacity-40"
                                        disabled
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Deletion Dialogs */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">{t("delete_assignment")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("delete_assignment_confirm_message")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel disabled={deleting} className="h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-gray-200">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-rose-500 hover:bg-rose-600 h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-0 shadow-md"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">{t("delete_selected_assignments")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("delete_selected_assignments_confirm_message", { count: selectedKeys.length })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel disabled={deleting} className="h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-gray-200">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleBulkDelete();
                            }}
                            className="bg-rose-500 hover:bg-rose-600 h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-0 shadow-md"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {t("delete_selected")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
