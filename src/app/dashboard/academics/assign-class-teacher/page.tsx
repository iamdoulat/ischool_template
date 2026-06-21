"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Pencil, Trash2, Search, Copy, FileSpreadsheet, FileText, Printer, ChevronLeft, ChevronRight, Loader2, UserCheck
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
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
}

export default function AssignClassTeacherPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");

    // Data states
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [assignments, setAssignments] = useState<ClassTeacherAssignment[]>([]);

    // Form states
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);

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
            toast("error", "Failed to load prerequisite data");
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

    const handleSave = async () => {
        if (!selectedClassId || !selectedSectionId || selectedStaffIds.length === 0) {
            toast("error", "Please fill all required fields");
            return;
        }

        setSaving(true);
        try {
            await api.post("/academics/class-teachers", {
                school_class_id: parseInt(selectedClassId),
                section_id: parseInt(selectedSectionId),
                teacher_ids: selectedStaffIds
            });
            toast("success", "Class teachers assigned successfully");

            // Refresh list
            const assignRes = await api.get("/academics/class-teachers");
            setAssignments(assignRes.data.data || []);

            // Clear form
            setSelectedClassId("");
            setSelectedSectionId("");
            setSelectedStaffIds([]);
        } catch (error) {
            console.error("Error saving assignment:", error);
            toast("error", "Failed to save assignment");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (assignment: ClassTeacherAssignment) => {
        setSelectedClassId(assignment.class_id.toString());
        fetchSectionsByClass(assignment.class_id.toString());
        setSelectedSectionId(assignment.section_id.toString());
        setSelectedStaffIds(assignment.teachers.map(t => t.id));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggleStaffSelection = (id: number) => {
        setSelectedStaffIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
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
            toast("success", "Assignment removed successfully");
            setAssignments(prev => prev.filter(a => a.id !== idToDelete));
            setSelectedKeys(prev => prev.filter(k => k !== idToDelete));
        } catch (error) {
            console.error("Error deleting assignment:", error);
            toast("error", "Failed to delete assignment");
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
            toast("success", `${selectedKeys.length} assignments removed successfully`);
            setAssignments(prev => prev.filter(a => !selectedKeys.includes(a.id)));
            setSelectedKeys([]);
        } catch (error) {
            console.error("Error in bulk delete:", error);
            toast("error", "Failed to delete selected assignments");
        } finally {
            setDeleting(false);
            setIsBulkDeleteDialogOpen(false);
        }
    };

    // Export functions
    const handleCopy = () => {
        const text = filteredAssignments.map(a =>
            `${a.class_name}\t${a.section_name}\t${a.teachers.map(t => t.name).join(', ')}`
        ).join("\n");
        navigator.clipboard.writeText("Class\tSection\tClass Teacher\n" + text);
        toast("success", "Copied to clipboard");
    };

    const handleExportExcel = () => {
        const data = filteredAssignments.map(a => ({
            Class: a.class_name,
            Section: a.section_name,
            'Class Teacher': a.teachers.map(t => t.name).join(', ')
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Assignments");
        XLSX.writeFile(workbook, "class_teacher_assignments.xlsx");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Class", "Section", "Class Teacher"]],
            body: filteredAssignments.map(a => [
                a.class_name,
                a.section_name,
                a.teachers.map(t => t.name).join(', ')
            ]),
        });
        doc.save("class_teacher_assignments.pdf");
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredAssignments = assignments.filter(a =>
        a.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.section_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.teachers.some(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Form */}
            <div className="w-full lg:w-1/3 space-y-4">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <UserCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Assign Class Teacher</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">Assign teachers to a class section</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">
                                    Class <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={selectedClassId}
                                    onValueChange={(val) => {
                                        setSelectedClassId(val);
                                        setSelectedSectionId('');
                                        fetchSectionsByClass(val);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">
                                    Section <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={selectedSectionId}
                                    onValueChange={setSelectedSectionId}
                                    disabled={!selectedClassId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={!selectedClassId ? 'Select class first' : 'Select'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sections.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-gray-700">
                                    Class Teacher <span className="text-red-500">*</span>
                                </Label>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 border rounded p-2">
                                    {staffList.map((staff) => (
                                        <div key={staff.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`staff-${staff.id}`}
                                                checked={selectedStaffIds.includes(staff.id)}
                                                onCheckedChange={() => toggleStaffSelection(staff.id)}
                                            />
                                            <Label
                                                htmlFor={`staff-${staff.id}`}
                                                className="text-sm font-normal text-gray-600 cursor-pointer"
                                            >
                                                {staff.name} {staff.staff_id ? `(${staff.staff_id})` : ""}
                                            </Label>
                                        </div>
                                    ))}
                                    {staffList.length === 0 && (
                                        <p className="text-xs text-center text-gray-400 py-4">No staff found</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white border-0 shadow-md h-10"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: List */}
            <div className="w-full lg:w-2/3 space-y-4">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 font-sans">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <UserCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Class Teacher List</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{filteredAssignments.length} total entr{filteredAssignments.length === 1 ? 'y' : 'ies'}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                            <div className="relative w-full md:w-64">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <Input
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-9 border-gray-200 focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-gray-400">
                                    {selectedKeys.length > 0 && (
                                        <Button
                                            onClick={() => setIsBulkDeleteDialogOpen(true)}
                                            variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" title="Delete Selected"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button onClick={handleCopy} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100" title="Copy">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button onClick={handleExportExcel} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100" title="Excel">
                                        <FileSpreadsheet className="h-4 w-4" />
                                    </Button>
                                    <Button onClick={handleExportPDF} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100" title="PDF">
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button onClick={handlePrint} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100" title="Print">
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border border-gray-100 overflow-hidden min-h-[300px] relative">
                            <Table>
                                <TableHeader className="bg-gray-50/50 text-[11px] uppercase">
                                    <TableRow>
                                        <TableHead className="w-10 pl-4">
                                            <Checkbox
                                                checked={filteredAssignments.length > 0 && selectedKeys.length === filteredAssignments.length}
                                                onCheckedChange={toggleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-600">Class</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Section</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Class Teacher</TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-right pr-4">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={5} />
                                    ) : filteredAssignments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                No data found
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredAssignments.map((assignment) => (
                                        <TableRow key={assignment.id} className={`text-[13px] hover:bg-gray-50/50 group ${selectedKeys.includes(assignment.id) ? 'bg-indigo-50/30' : ''}`}>
                                            <TableCell className="pl-4">
                                                <Checkbox
                                                    checked={selectedKeys.includes(assignment.id)}
                                                    onCheckedChange={() => toggleRowSelection(assignment.id)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-gray-600 font-medium">{assignment.class_name}</TableCell>
                                            <TableCell className="text-gray-600">{assignment.section_name}</TableCell>
                                            <TableCell className="text-gray-600 whitespace-pre-line leading-relaxed">
                                                {assignment.teachers.map(t => t.name).join('\n')}
                                            </TableCell>
                                            <TableCell className="text-right pr-4">
                                                <div className="flex items-center justify-end gap-1 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        onClick={() => handleEdit(assignment)}
                                                        size="icon" variant="ghost" className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded shadow-sm"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => confirmDelete(assignment.id)}
                                                        size="icon" variant="ghost" className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded shadow-sm"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                            <div>
                                Showing 1 to {filteredAssignments.length} of {filteredAssignments.length} entries
                            </div>
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-white border border-gray-200 text-gray-600 rounded-[10px]" disabled>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-7 w-7 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white border-0 shadow-md rounded-[10px]"
                                >
                                    1
                                </Button>
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-white border border-gray-200 text-gray-600 rounded-[10px]" disabled>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Deletion Dialogs */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this class teacher assignment? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Selected Assignments?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {selectedKeys.length} selected assignments? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleBulkDelete();
                            }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete Selected
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
