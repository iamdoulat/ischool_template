"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Pencil,
    Trash2,
    Printer,
    Copy,
    FileSpreadsheet,
    FileText,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Layers,
    Search,
    GraduationCap,
    BookOpen,
    CheckCircle2,
    Sparkles,
    Columns
} from "lucide-react";
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
import { cn, translateClassName, translateSectionName, translateSubjectName, toLocaleNumber } from "@/lib/utils";

const GROUP_PRESETS = [
    { key: "class_1st_subject_group", defaultLabel: "Class 1st Subject Group" },
    { key: "class_2nd_subject_group", defaultLabel: "Class 2nd Subject Group" },
    { key: "class_3rd_subject_group", defaultLabel: "Class 3rd Subject Group" },
    { key: "class_4th_subject_group", defaultLabel: "Class 4th Subject Group" },
    { key: "class_5th_subject_group", defaultLabel: "Class 5th Subject Group" },
    { key: "science_group", defaultLabel: "Science Group" },
    { key: "business_studies", defaultLabel: "Business Studies" },
    { key: "humanities_arts", defaultLabel: "Humanities / Arts" }
];

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                            <div
                                className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }}
                            />
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
    code?: string;
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
    const { t, language } = useTranslation();
    const tt = useTranslateToast();

    const formatGroupName = (grpName: string) => {
        if (!grpName) return "";
        const lower = grpName.toLowerCase().trim();
        
        const presetKey = lower.replace(/[^a-z0-9]+/g, '_');
        const translatedPreset = t(presetKey);
        if (translatedPreset && translatedPreset !== presetKey) return translatedPreset;

        const match = lower.match(/^class\s*(\d+)(?:st|nd|rd|th)?\s*(?:subject|subject group|subjects)?$/i);
        if (match) {
            const num = match[1];
            return t("class_x_subject_group", { class: toLocaleNumber(num, language?.short_code) }) || grpName;
        }
        return grpName;
    };

    // Data states
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);

    // UI states
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [limit, setLimit] = useState("50");

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
        if (!selectedClassId) {
            setSections([]);
            return;
        }
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
            setSubjectGroups(data.data || []);
            setCurrentPage(data.current_page || 1);
            setLastPage(data.last_page || 1);
            setTotal(data.total || 0);
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
        setSelectedSections([]);
        fetchSectionsByClass(value);
    };

    const handleSelectAllSubjects = () => {
        if (selectedSubjects.length === subjects.length) {
            setSelectedSubjects([]);
        } else {
            setSelectedSubjects(subjects.map((s) => s.id));
        }
    };

    const handleSelectAllSections = () => {
        if (selectedSections.length === sections.length) {
            setSelectedSections([]);
        } else {
            setSelectedSections(sections.map((s) => s.id));
        }
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
            name: name.trim(),
            school_class_id: parseInt(classId),
            sections: selectedSections,
            subjects: selectedSubjects,
            description: description.trim()
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
            const err = error as {
                response?: {
                    data?: {
                        message?: string;
                        errors?: Record<string, string[]>;
                        data?: Record<string, string[]>;
                    };
                    status?: number;
                };
            };
            console.error("Error saving subject group:", error);
            const errData = err.response?.data;
            let errMsg = errData?.message;
            if (errData?.errors && typeof errData.errors === 'object') {
                const firstErr = Object.values(errData.errors).flat()[0];
                if (firstErr) errMsg = firstErr;
            } else if (errData?.data && typeof errData.data === 'object' && !Array.isArray(errData.data)) {
                const firstErr = Object.values(errData.data).flat()[0];
                if (typeof firstErr === 'string') errMsg = firstErr;
            }
            tt.error(errMsg || "failed_to_save");
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
        setSelectedSections(group.sections.map((s) => s.id));
        setSelectedSubjects(group.subjects.map((s) => s.id));
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
            const err = error as { response?: { data?: { message?: string }; status?: number } };
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
        return subjectGroups.map((group, idx) => ({
            "#": idx + 1,
            [t("name")]: formatGroupName(group.name),
            [t("class_sections") || "Class Sections"]: `${translateClassName(group.school_class?.name || "", language?.short_code)} (${group.sections.map((s) => `${t("section_short")} ${translateSectionName(s.name, language?.short_code)}`).join(', ')})`,
            [t("subjects")]: group.subjects.map((s) => translateSubjectName(s.name, language?.short_code)).join(', '),
            [t("status") || "Status"]: t("active") || "Active"
        }));
    };

    const exportToCopy = () => {
        const classSecLabel = t("class_sections") || "Class Sections";
        const text = exportDataForTable()
            .map((row: Record<string, string | number>) => `${row["#"]}. ${row[t("name")]}\t${row[classSecLabel]}\t${row[t("subjects")]}`)
            .join("\n");
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
        doc.text(t("subject_group_list"), 14, 15);
        autoTable(doc, {
            head: [["#", t("name"), t("class_sections") || "Class Sections", t("subjects"), t("status") || "Status"]],
            body: subjectGroups.map((group, idx) => [
                idx + 1,
                formatGroupName(group.name),
                group.sections.map((s) => `${translateClassName(group.school_class?.name || "", language?.short_code)} - ${t("section_short")} ${translateSectionName(s.name, language?.short_code)}`).join('\n'),
                group.subjects.map((s) => translateSubjectName(s.name, language?.short_code)).join(', '),
                t("active") || "Active"
            ]),
            startY: 20
        });
        doc.save("subject_groups.pdf");
    };

    const printTable = () => {
        window.print();
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen">
            {/* Left Column: Form */}
            <form onSubmit={handleSave} className="w-full lg:w-1/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Layers className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {editingId ? t("edit_subject_group") : t("add_subject_group")}
                            </CardTitle>
                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                                {t("x_subjects_selected", { count: toLocaleNumber(selectedSubjects.length, language?.short_code) })}
                            </p>
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5 space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("name")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t("subject_group_name_placeholder")}
                                className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none focus-visible:ring-indigo-500 font-medium"
                                required
                            />
                        </div>

                        {/* Quick Group Presets */}
                        <div className="space-y-1.5 pt-1">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-amber-500" /> {t("quick_name_presets")}
                            </Label>
                            <div className="flex flex-wrap gap-1.5 max-h-[90px] overflow-y-auto pr-1">
                                {GROUP_PRESETS.map((preset) => {
                                    const label = t(preset.key) || preset.defaultLabel;
                                    return (
                                        <button
                                            key={preset.key}
                                            type="button"
                                            onClick={() => setName(label)}
                                            className={cn(
                                                "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                                                name === label
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                                    : "bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 border-gray-200"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Class Selection */}
                        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("class")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={classId} onValueChange={handleClassChange}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none font-medium">
                                    <SelectValue placeholder={t("select_class")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {translateClassName(c.name, language?.short_code)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sections Selection */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    {t("sections")} <span className="text-red-500">*</span>
                                </Label>
                                {sections.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleSelectAllSections}
                                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                    >
                                        {selectedSections.length === sections.length ? t("deselect_all") : t("select_all")}
                                    </button>
                                )}
                            </div>
                            {!classId ? (
                                <p className="text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-3 text-center bg-gray-50/30">
                                    {t("select_class_first_to_see_sections") || "Select Class First To See Sections"}
                                </p>
                            ) : sections.length === 0 ? (
                                <p className="text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-3 text-center bg-gray-50/30">
                                    {t("no_sections_available_for_this_class") || "No sections available for this class"}
                                </p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 border border-gray-200 dark:border-gray-800 rounded-xl p-3 max-h-[140px] overflow-y-auto bg-gray-50/20">
                                    {sections.map((section) => (
                                        <div
                                            key={section.id}
                                            onClick={() => {
                                                if (selectedSections.includes(section.id)) {
                                                    setSelectedSections((prev) => prev.filter((id) => id !== section.id));
                                                } else {
                                                    setSelectedSections((prev) => [...prev, section.id]);
                                                }
                                            }}
                                            className={cn(
                                                "flex items-center space-x-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all",
                                                selectedSections.includes(section.id)
                                                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-700 dark:text-indigo-300 shadow-2xs"
                                                    : "bg-white dark:bg-zinc-800 border-gray-200 text-gray-700 dark:text-zinc-300 hover:border-indigo-200"
                                            )}
                                        >
                                            <Checkbox
                                                id={`section-${section.id}`}
                                                checked={selectedSections.includes(section.id)}
                                                className="h-4 w-4 rounded-md data-[state=checked]:bg-indigo-600"
                                            />
                                            <Label htmlFor={`section-${section.id}`} className="cursor-pointer">
                                                {t("section_short")} {translateSectionName(section.name, language?.short_code)}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Subjects Selection */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    {t("subjects")} <span className="text-red-500">*</span>
                                </Label>
                                {subjects.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleSelectAllSubjects}
                                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                    >
                                        {selectedSubjects.length === subjects.length ? t("deselect_all") : t("select_all")}
                                    </button>
                                )}
                            </div>
                            {subjects.length === 0 ? (
                                <p className="text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-3 text-center bg-gray-50/30">
                                    {t("no_subjects_available_in_system") || "No subjects available in the system"}
                                </p>
                            ) : (
                                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-gray-50/20">
                                    {subjects.map((subject) => {
                                        const isChecked = selectedSubjects.includes(subject.id);
                                        const displayName = translateSubjectName(subject.name, language?.short_code);
                                        return (
                                            <div
                                                key={subject.id}
                                                onClick={() => {
                                                    if (isChecked) {
                                                        setSelectedSubjects((prev) => prev.filter((id) => id !== subject.id));
                                                    } else {
                                                        setSelectedSubjects((prev) => [...prev, subject.id]);
                                                    }
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all",
                                                    isChecked
                                                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-700 dark:text-indigo-300 shadow-2xs"
                                                        : "bg-white dark:bg-zinc-800 border-gray-200 text-gray-700 dark:text-zinc-300 hover:border-indigo-200"
                                                )}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`subject-${subject.id}`}
                                                        checked={isChecked}
                                                        className="h-4 w-4 rounded-md data-[state=checked]:bg-indigo-600"
                                                    />
                                                    <Label htmlFor={`subject-${subject.id}`} className="cursor-pointer">
                                                        {displayName}
                                                    </Label>
                                                </div>
                                                {subject.code && (
                                                    <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                                                        {toLocaleNumber(subject.code, language?.short_code)}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("description")}
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t("subject_group_desc_placeholder")}
                                className="min-h-[75px] resize-none border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none focus-visible:ring-indigo-500 font-medium"
                            />
                        </div>

                        {/* Form Action Buttons */}
                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                            {editingId && (
                                <Button
                                    type="button"
                                    onClick={resetForm}
                                    variant="outline"
                                    className="h-9 px-4 rounded-full text-xs font-bold uppercase border-gray-200 cursor-pointer"
                                >
                                    {t("cancel")}
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={saving}
                                className="btn-gradient text-white px-8 h-9 text-[11px] font-bold uppercase shadow-lg shadow-orange-200/50 transition-all rounded-full flex items-center gap-2 cursor-pointer"
                            >
                                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                {editingId ? t("update") : t("save")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Right Column: List View */}
            <div className="w-full lg:w-2/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 font-sans">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Layers className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {t("subject_group_list")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {t("total_entries_count", { count: toLocaleNumber(total, language?.short_code) })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select value={limit} onValueChange={(v) => setLimit(v)}>
                                <SelectTrigger className="h-8 w-16 text-xs border-gray-200 rounded-lg">
                                    <SelectValue placeholder={toLocaleNumber(50, language?.short_code)} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">{toLocaleNumber(10, language?.short_code)}</SelectItem>
                                    <SelectItem value="25">{toLocaleNumber(25, language?.short_code)}</SelectItem>
                                    <SelectItem value="50">{toLocaleNumber(50, language?.short_code)}</SelectItem>
                                    <SelectItem value="100">{toLocaleNumber(100, language?.short_code)}</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1 text-gray-400">
                                <Button
                                    onClick={exportToCopy}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                                    title={t("copy")}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                    onClick={exportToExcel}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                                    title={t("excel")}
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button
                                    onClick={exportToPDF}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                                    title={t("pdf")}
                                >
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                    onClick={printTable}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                                    title={t("print")}
                                >
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                                    title={t("columns")}
                                >
                                    <Columns className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5 space-y-4">
                        {/* Search Bar & Stats Badge */}
                        <div className="flex justify-between items-center gap-4">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={t("search_subject_groups")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 text-xs border-gray-200 bg-gray-50/30 rounded-lg focus-visible:ring-indigo-500 shadow-none font-medium"
                                />
                            </div>

                            {total > 0 && (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10.5px] font-bold py-1 px-2.5">
                                    <Layers className="h-3 w-3 mr-1" />
                                    {t("x_subject_groups", { count: toLocaleNumber(total, language?.short_code) })}
                                </Badge>
                            )}
                        </div>

                        {/* Enhanced Table */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
                            <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-gray-800/80 text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300">
                                    <TableRow className="hover:bg-transparent border-gray-200 dark:border-gray-700">
                                        <TableHead className="py-3 px-4 w-[60px]">#</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[180px]">{t("name")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[200px]">{t("class_sections") || "Class Sections"}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[240px]">{t("subjects")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[110px]">{t("status") || "Status"}</TableHead>
                                        <TableHead className="py-3 px-4 text-right w-[100px]">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={4} cols={6} />
                                    ) : subjectGroups.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="px-4 py-16 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                                {t("no_data_found")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        subjectGroups.map((group, idx) => (
                                            <TableRow
                                                key={group.id}
                                                className="text-[13px] border-b last:border-0 border-gray-100 dark:border-gray-800 hover:bg-indigo-50/25 transition-colors group align-top"
                                            >
                                                {/* Serial Number */}
                                                <TableCell className="py-3.5 px-4 font-bold text-gray-400 text-xs">
                                                    {toLocaleNumber((currentPage - 1) * parseInt(limit) + idx + 1, language?.short_code)}
                                                </TableCell>

                                                {/* Group Name & Icon */}
                                                <TableCell className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
                                                            <Layers className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                                                                {formatGroupName(group.name)}
                                                            </p>
                                                            {group.description && (
                                                                <p className="text-[11px] text-gray-400 font-medium line-clamp-1 max-w-[200px]">
                                                                    {group.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Class & Sections */}
                                                <TableCell className="py-3.5 px-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {group.sections.map((sec) => (
                                                            <span
                                                                key={sec.id}
                                                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-100 dark:border-indigo-800 shadow-2xs"
                                                            >
                                                                <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                                                                {translateClassName(group.school_class?.name, language?.short_code)} • {t("section_short")} {translateSectionName(sec.name, language?.short_code)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </TableCell>

                                                {/* Subjects */}
                                                <TableCell className="py-3.5 px-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {group.subjects.map((sub) => (
                                                            <span
                                                                key={sub.id}
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-semibold text-xs border border-amber-200/70 dark:border-amber-900/40 shadow-2xs"
                                                            >
                                                                <BookOpen className="h-3 w-3 text-amber-600" />
                                                                {translateSubjectName(sub.name, language?.short_code)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell className="py-3.5 px-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                        {t("active") || "Active"}
                                                    </span>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            onClick={() => handleEdit(group)}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-xs cursor-pointer"
                                                            title={t("edit")}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => confirmDelete(group.id)}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all shadow-xs cursor-pointer"
                                                            title={t("delete")}
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

                        {/* Pagination Footer */}
                        {total > 0 && (
                            <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-2 uppercase tracking-tight">
                                <div>
                                    {t("showing_x_to_y_of_z", {
                                        from: toLocaleNumber(from, language?.short_code),
                                        to: toLocaleNumber(to, language?.short_code),
                                        total: toLocaleNumber(total, language?.short_code)
                                    })}
                                </div>
                                <div className="flex gap-1.5">
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-sm disabled:opacity-40 cursor-pointer"
                                        disabled={currentPage === 1}
                                        onClick={() => fetchSubjectGroups(currentPage - 1)}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            size="sm"
                                            className={cn(
                                                "h-8 w-8 p-0 rounded-[10px] text-xs font-black shadow-sm transition-all cursor-pointer",
                                                currentPage === page
                                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0"
                                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                                            )}
                                            onClick={() => fetchSubjectGroups(page)}
                                        >
                                            {toLocaleNumber(page, language?.short_code)}
                                        </Button>
                                    ))}
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-sm disabled:opacity-40 cursor-pointer"
                                        disabled={currentPage === lastPage || lastPage === 0}
                                        onClick={() => fetchSubjectGroups(currentPage + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">
                            {t("are_you_absolutely_sure") || t("are_you_sure")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("delete_subject_group_confirm_message")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-gray-200 cursor-pointer">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-rose-500 hover:bg-rose-600 h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-0 shadow-md cursor-pointer text-white"
                        >
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
