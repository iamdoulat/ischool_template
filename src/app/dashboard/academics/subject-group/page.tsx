"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Printer, Copy, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Loader2, Library } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
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
import api from "@/lib/api";
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

interface Section {
    id: number;
    name: string;
    school_class_id?: number | string;
}

interface SchoolClass {
    id: number;
    name: string;
    sections: Section[];
}

interface Subject {
    id: number;
    name: string;
}

interface SubjectGroup {
    id: number;
    name: string;
    school_class_id: number;
    description: string | null;
    school_class?: SchoolClass;
    sections: Section[];
    subjects: Subject[];
}

export default function SubjectGroupPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();

    // Data states
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);

    // UI states
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [limit, setLimit] = useState("10");

    // Form states
    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState("");
    const [classId, setClassId] = useState<string>("");
    const [selectedSections, setSelectedSections] = useState<number[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
    const [description, setDescription] = useState("");

    // Delete dialog states
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);

    // Load prerequisites (Classes, Subjects)
    useEffect(() => {
        const fetchPrerequisites = async () => {
            try {
                const [classRes, subRes] = await Promise.all([
                    api.get(`/academics/classes?no_paginate=true`),
                    api.get(`/academics/subjects?no_paginate=true`)
                ]);
                setClasses(classRes.data.data?.data || classRes.data.data || []);
                setSubjects(subRes.data.data?.data || subRes.data.data || []);
            } catch (error) {
                console.error("Failed to load prerequisites", error);
                tt.error("failed_to_load");
            }
        };
        fetchPrerequisites();
    }, []);

    // Fetch sections filtered by selected class ID
    const fetchSectionsByClass = async (selectedClassId: string) => {
        if (!selectedClassId) { setSections([]); return; }
        try {
            const res = await api.get('/academics/sections?with_class=true&no_paginate=true');
            const all: Section[] = res.data?.data || res.data || [];
            const filtered = all.filter((s: Section) => String(s.school_class_id) === String(selectedClassId));
            setSections(filtered);
        } catch {
            setSections([]);
        }
    };

    // Load Subject Groups with pagination
    const fetchSubjectGroups = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/academics/subject-groups`, {
                params: {
                    page,
                    search: searchTerm,
                    limit: parseInt(limit)
                }
            });
            const { data } = response.data;
            setSubjectGroups(data.data);
            setCurrentPage(data.current_page);
            setLastPage(data.last_page);
            setTotal(data.total);
            setFrom(data.from || 0);
            setTo(data.to || 0);
        } catch (error) {
            console.error("Error fetching subject groups:", error);
            tt.error("failed_to_load");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjectGroups(1);
    }, [searchTerm, limit]);

    // Handle Class Selection Change
    const handleClassChange = (value: string) => {
        setClassId(value);
        setSelectedSections([]); // Reset section selection when class changes
        fetchSectionsByClass(value);
    };

    // Handle Form Submit
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return tt.error("name_is_required");
        if (!classId) return tt.error("class_is_required");
        if (selectedSections.length === 0) return tt.error("select_at_least_one_section");
        if (selectedSubjects.length === 0) return tt.error("select_at_least_one_subject");

        setSaving(true);
        const payload = {
            name,
            school_class_id: parseInt(classId),
            sections: selectedSections,
            subjects: selectedSubjects,
            description
        };

        try {
            if (editingId) {
                await api.put(`/academics/subject-groups/${editingId}`, payload);
                tt.success("updated_successfully");
            } else {
                await api.post(`/academics/subject-groups`, payload);
                tt.success("created_successfully");
            }
            resetForm();
            fetchSubjectGroups(currentPage);
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            console.error("Error saving subject group:", error);
            tt.error(err.response?.data?.message || "failed_to_save");
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setName("");
        setClassId("");
        setSelectedSections([]);
        setSelectedSubjects([]);
        setDescription("");
        setEditingId(null);
    };

    const handleEdit = (group: SubjectGroup) => {
        setName(group.name);
        setClassId(group.school_class_id.toString());
        fetchSectionsByClass(group.school_class_id.toString());
        setSelectedSections(group.sections.map(s => s.id));
        setSelectedSubjects(group.subjects.map(s => s.id));
        setDescription(group.description || "");
        setEditingId(group.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = (id: number) => {
        setIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!idToDelete) return;
        setLoading(true);
        try {
            await api.delete(`/academics/subject-groups/${idToDelete}`);
            fetchSubjectGroups(currentPage);
            tt.success("deleted_successfully");
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            console.error("Error deleting subject group:", error);
            tt.error(err.response?.data?.message || "failed_to_delete");
        } finally {
            setLoading(false);
            setIsDeleteDialogOpen(false);
            setIdToDelete(null);
        }
    };

    // --- Export Functions ---
    const exportDataForTable = () => {
        return subjectGroups.map(group => ({
            [t("name")]: group.name,
            [t("class_sections")]: `${group.school_class?.name || ''} (${group.sections.map(s => s.name).join(', ')})`,
            [t("subjects")]: group.subjects.map(s => s.name).join(', ')
        }));
    };

    const exportToCopy = () => {
        const text = exportDataForTable().map((row: Record<string, string>) => `${row[t("name")]}\t${row[t("class_sections")]}\t${row[t("subjects")]}`).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(exportDataForTable());
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Subject Groups");
        XLSX.writeFile(workbook, "subject_groups.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [[t("name"), t("class_sections"), t("subjects")]],
            body: subjectGroups.map(group => [
                group.name,
                group.sections.map(s => `${group.school_class?.name || ''} - ${s.name}`).join('\n'),
                group.subjects.map(s => s.name).join('\n')
            ]),
            styles: { cellPadding: 2, fontSize: 8 },
            columnStyles: {
                1: { cellWidth: 'auto' },
                2: { cellWidth: 'auto' }
            }
        });
        doc.save("subject_groups.pdf");
    };

    const printTable = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        if (!printWindow) return;
        printWindow.document.write('<html><head><title>' + t("subject_group_list") + '</title>');
        printWindow.document.write('<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; font-family: sans-serif; font-size: 13px; } th { background-color: #f2f2f2; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h2>' + t("subject_group_list") + '</h2>');
        printWindow.document.write('<table><thead><tr><th>' + t("name") + '</th><th>' + t("class_sections") + '</th><th>' + t("subjects") + '</th></tr></thead><tbody>');
        subjectGroups.forEach(group => {
            const sectionsRow = group.sections.map(s => `${group.school_class?.name || ''} - ${s.name}`).join('<br>');
            const subjectsRow = group.subjects.map(s => s.name).join('<br>');
            printWindow.document.write(`<tr><td>${group.name}</td><td>${sectionsRow}</td><td>${subjectsRow}</td></tr>`);
        });
        printWindow.document.write('</tbody></table></body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    // Styling logic
    const saveGradient = "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-sm transition-all";
    const pagerActive = "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white rounded-[10px] border-0";
    const pagerInactive = "bg-white border border-gray-200 text-gray-600 rounded-[10px] hover:bg-indigo-50 hover:text-indigo-600";

    return (
        <div className="flex flex-col lg:flex-row gap-6 font-sans">
            {/* Left Column: Form */}
            <form onSubmit={handleSave} className="w-full lg:w-1/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Library className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {editingId ? t("edit_subject_group") : t("add_subject_group")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {t("x_subjects_selected", { count: selectedSubjects.length })}
                                </p>
                            </div>
                        </div>
                        {editingId && (
                            <Button type="button" variant="ghost" size="sm" onClick={resetForm} className="text-xs text-indigo-600">
                                {t("cancel_edit")}
                            </Button>
                        )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                {t("name")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-9 focus-visible:ring-indigo-500"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                                {t("class")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={classId} onValueChange={handleClassChange}>
                                <SelectTrigger className="h-9 font-medium focus:ring-indigo-500">
                                    <SelectValue placeholder={t("select")} />
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
                                {t("sections")} <span className="text-red-500">*</span>
                            </Label>
                            {!classId ? (
                                <p className="text-xs text-gray-400 border border-dashed rounded p-2 text-center">{t("select_class_first_to_see_sections")}</p>
                            ) : sections.length === 0 ? (
                                <p className="text-xs text-gray-400 border border-dashed rounded p-2 text-center">{t("no_sections_available_for_this_class")}</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-[150px] overflow-y-auto">
                                    {sections.map(section => (
                                        <div key={section.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`section-${section.id}`}
                                                checked={selectedSections.includes(section.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedSections(prev => [...prev, section.id]);
                                                    else setSelectedSections(prev => prev.filter(id => id !== section.id));
                                                }}
                                            />
                                            <Label htmlFor={`section-${section.id}`} className="text-sm font-normal text-gray-600 cursor-pointer">
                                                {section.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">
                                {t("subjects")} <span className="text-red-500">*</span>
                            </Label>
                            {subjects.length === 0 ? (
                                <p className="text-xs text-gray-400 border border-dashed rounded p-2 text-center">{t("no_subjects_available_in_system")}</p>
                            ) : (
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar border rounded-md p-3">
                                    {subjects.map((subject) => (
                                        <div key={subject.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`subject-${subject.id}`}
                                                checked={selectedSubjects.includes(subject.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedSubjects(prev => [...prev, subject.id]);
                                                    else setSelectedSubjects(prev => prev.filter(id => id !== subject.id));
                                                }}
                                            />
                                            <Label
                                                htmlFor={`subject-${subject.id}`}
                                                className="text-sm font-normal text-gray-600 cursor-pointer w-full"
                                            >
                                                {subject.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                {t("description")}
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[100px] resize-none border-gray-200 focus-visible:ring-indigo-500"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={saving}
                                className={`px-8 h-9 text-xs flex items-center gap-2 ${saveGradient}`}
                            >
                                {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                                {editingId ? t("update") : t("save")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Right Column: List View */}
            <div className="w-full lg:w-2/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Library className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("subject_group_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("total_entries_count", { count: total })}</p>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder={t("search")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <Select value={limit} onValueChange={(v) => setLimit(v)}>
                                        <SelectTrigger className="h-8 w-[70px] text-xs border-gray-200 focus:ring-indigo-500">
                                            <SelectValue placeholder="10" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Button onClick={exportToCopy} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm border border-gray-100 bg-white">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button onClick={exportToExcel} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm border border-gray-100 bg-white">
                                        <FileSpreadsheet className="h-4 w-4" />
                                    </Button>
                                    <Button onClick={exportToPDF} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm border border-gray-100 bg-white">
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button onClick={printTable} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm border border-gray-100 bg-white">
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border border-gray-100 overflow-hidden min-h-[300px] relative">
                            <Table>
                                <TableHeader className="bg-gray-50/50 text-[11px] uppercase">
                                    <TableRow className="hover:bg-transparent border-gray-100">
                                        <TableHead className="font-bold text-gray-700 py-3">{t("name")}</TableHead>
                                        <TableHead className="font-bold text-gray-700 py-3">{t("class_section")}</TableHead>
                                        <TableHead className="font-bold text-gray-700 py-3">{t("subject")}</TableHead>
                                        <TableHead className="font-bold text-gray-700 text-right py-3 w-[80px]">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={4} />
                                    ) : subjectGroups.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td>
                                        </tr>
                                    ) : (
                                        subjectGroups.map((group) => (
                                            <TableRow key={group.id} className="text-[13px] hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer group border-b last:border-0 border-gray-50 align-top">
                                                <TableCell className="text-gray-600 font-medium py-3.5">{group.name}</TableCell>
                                                <TableCell className="text-gray-600 py-3.5">
                                                    <div className="flex flex-col gap-1">
                                                        {group.sections.map((sec) => (
                                                            <div key={sec.id}>
                                                                {group.school_class?.name} - {sec.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-gray-600 py-3.5">
                                                    <div className="flex flex-col gap-1">
                                                        {group.subjects.map((sub) => (
                                                            <div key={sub.id}>
                                                                {sub.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-3.5">
                                                    <div className="flex items-center justify-end gap-1 transition-opacity">
                                                        <Button
                                                            onClick={() => handleEdit(group)}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded shadow-sm"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => confirmDelete(group.id)}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded shadow-sm"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {total > 0 && (
                            <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                                <div>
                                    {t("showing_x_to_y_of_z", { from, to, total })}
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={`h-7 w-7 p-0 ${pagerInactive}`}
                                        disabled={currentPage === 1}
                                        onClick={() => fetchSubjectGroups(currentPage - 1)}
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            className={`h-7 w-7 p-0 ${currentPage === page ? pagerActive : pagerInactive}`}
                                            onClick={() => fetchSubjectGroups(page)}
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={`h-7 w-7 p-0 ${pagerInactive}`}
                                        disabled={currentPage === lastPage}
                                        onClick={() => fetchSubjectGroups(currentPage + 1)}
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_absolutely_sure")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("delete_subject_group_confirm_message")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
