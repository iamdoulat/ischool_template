"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Pencil, Trash2, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight, Loader2, X
} from "lucide-react";
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
import api from "@/lib/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Section {
    id: number;
    name: string;
}

interface ClassData {
    id: number;
    name: string;
    sections: Section[];
}

export default function ClassPage() {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [className, setClassName] = useState("");
    // sections stored as array of name strings e.g. ["A","B","C"]
    const [sectionInput, setSectionInput] = useState("");
    const [sectionTags, setSectionTags] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | null>(null);
    const { toast } = useToast();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);

    const fetchClasses = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/academics/classes`, {
                params: { page, search: searchTerm, limit: 10 }
            });
            const { data } = response.data;
            setClasses(data.data);
            setCurrentPage(data.current_page);
            setLastPage(data.last_page);
            setTotal(data.total);
            setFrom(data.from || 0);
            setTo(data.to || 0);
        } catch (error) {
            console.error("Error fetching classes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses(1);
    }, [searchTerm]);

    // Add a section tag when user presses Enter or comma
    const handleSectionKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addSectionTag();
        }
    };

    const addSectionTag = () => {
        const val = sectionInput.trim().replace(/,/g, "");
        if (val && !sectionTags.map(t => t.toUpperCase()).includes(val.toUpperCase())) {
            setSectionTags(prev => [...prev, val.toUpperCase()]);
        }
        setSectionInput("");
    };

    const removeSectionTag = (tag: string) => {
        setSectionTags(prev => prev.filter(t => t !== tag));
    };

    const resetForm = () => {
        setClassName("");
        setSectionTags([]);
        setSectionInput("");
        setEditingId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Also capture anything still typed in the input box
        const allTags = [...sectionTags];
        if (sectionInput.trim()) {
            const extra = sectionInput.trim().toUpperCase().replace(/,/g, "");
            if (extra && !allTags.map(t => t.toUpperCase()).includes(extra)) {
                allTags.push(extra);
            }
        }

        if (!className.trim()) {
            toast("error", "Please provide a class name.");
            return;
        }
        if (allTags.length === 0) {
            toast("error", "Add at least one section (e.g. A, B, C).");
            return;
        }

        setSaving(true);
        try {
            const payload = { name: className, sections: allTags };

            if (editingId) {
                await api.put(`/academics/classes/${editingId}`, payload);
            } else {
                await api.post(`/academics/classes`, payload);
            }
            resetForm();
            fetchClasses(currentPage);
            toast("success", editingId ? "Class updated successfully" : "Class created successfully");
        } catch (error: any) {
            const message = error.response?.data?.message || "Error saving class";
            toast("error", message);
            console.error("Error saving class:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (cls: ClassData) => {
        setClassName(cls.name);
        setSectionTags(cls.sections.map(s => s.name));
        setSectionInput("");
        setEditingId(cls.id);
    };

    const confirmDelete = (id: number) => {
        setIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!idToDelete) return;
        setLoading(true);
        try {
            const response = await api.delete(`/academics/classes/${idToDelete}`);
            if (response.data.status === "success") {
                toast("success", response.data.message || "Class deleted successfully");
                fetchClasses(currentPage);
            }
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Error deleting class");
        } finally {
            setLoading(false);
            setIsDeleteDialogOpen(false);
            setIdToDelete(null);
        }
    };

    const exportToCopy = () => {
        const text = classes.map(c => `${c.name}: ${c.sections.map(s => s.name).join(", ")}`).join("\n");
        navigator.clipboard.writeText(text);
        toast("success", "Copied to clipboard");
    };

    const exportToExcel = () => {
        const data = classes.map(c => ({ Class: c.name, Sections: c.sections.map(s => s.name).join(", ") }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Classes");
        XLSX.writeFile(workbook, "classes.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Class", "Sections"]],
            body: classes.map(c => [c.name, c.sections.map(s => s.name).join(", ")]),
        });
        doc.save("classes.pdf");
    };

    const printTable = () => {
        const printWindow = window.open("", "", "height=600,width=800");
        if (!printWindow) return;
        printWindow.document.write("<html><head><title>Class List</title>");
        printWindow.document.write("<style>table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f2f2f2;}</style>");
        printWindow.document.write("</head><body><h2>Class List</h2><table><thead><tr><th>Class</th><th>Sections</th></tr></thead><tbody>");
        classes.forEach(c => { printWindow.document.write(`<tr><td>${c.name}</td><td>${c.sections.map(s => s.name).join(", ")}</td></tr>`); });
        printWindow.document.write("</tbody></table></body></html>");
        printWindow.document.close();
        printWindow.print();
    };

    const activeGradient = "bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 border-0";
    const saveGradient = "bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white shadow-sm transition-all";

    return (
        <div className="flex flex-col lg:flex-row gap-6 font-sans">
            {/* Left Column: Add/Edit Class Form */}
            <form onSubmit={handleSave} className="w-full lg:w-1/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">
                        {editingId ? "Edit Class" : "Add Class"}
                    </h2>

                    <div className="space-y-4">
                        {/* Class Name */}
                        <div className="space-y-2">
                            <Label htmlFor="className" className="text-sm font-medium text-gray-700">
                                Class <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="className"
                                className="h-9 focus-visible:ring-indigo-500"
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                placeholder="e.g. Class 1"
                                required
                            />
                        </div>

                        {/* Sections Tag Input */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                                Sections <span className="text-red-500">*</span>
                            </Label>
                            <p className="text-xs text-gray-400">Type a section name and press Enter or comma to add (e.g. A, B, C)</p>

                            {/* Tag display */}
                            {sectionTags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-md bg-gray-50 min-h-[40px]">
                                    {sectionTags.map(tag => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeSectionTag(tag)}
                                                className="hover:text-indigo-900 cursor-pointer"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <Input
                                className="h-9 focus-visible:ring-indigo-500"
                                value={sectionInput}
                                onChange={(e) => setSectionInput(e.target.value)}
                                onKeyDown={handleSectionKeyDown}
                                onBlur={addSectionTag}
                                placeholder="Type A, B, C... and press Enter"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            {editingId && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                    className="px-4 h-9 text-xs"
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={saving}
                                className={`px-8 h-9 text-xs flex items-center gap-2 ${saveGradient}`}
                            >
                                {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                                {editingId ? "Update" : "Save"}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Right Column: Class List */}
            <div className="w-full lg:w-2/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Class List</h2>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500"
                            />
                        </div>

                        <div className="flex items-center gap-1 text-gray-400">
                            <Button onClick={exportToCopy} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600" title="Copy">
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button onClick={exportToExcel} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600" title="Excel">
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                            </Button>
                            <Button onClick={exportToPDF} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600" title="PDF">
                                <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button onClick={printTable} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600" title="Print">
                                <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600" title="Columns">
                                <Columns className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border border-gray-100 overflow-hidden min-h-[300px] relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                            </div>
                        )}
                        <Table>
                            <TableHeader className="bg-gray-50/50 text-[11px] uppercase">
                                <TableRow className="hover:bg-transparent border-gray-100">
                                    <TableHead className="font-bold text-gray-700 py-3">Class</TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3">Sections</TableHead>
                                    <TableHead className="font-bold text-gray-700 text-right py-3">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classes.map((cls) => (
                                    <TableRow key={cls.id} className="text-[13px] hover:bg-gray-50/50 border-b last:border-0 border-gray-50">
                                        <TableCell className="text-gray-600 font-medium py-3.5 align-middle">{cls.name}</TableCell>
                                        <TableCell className="text-gray-600 py-3.5 align-middle">
                                            <div className="flex flex-wrap gap-1">
                                                {cls.sections.length > 0
                                                    ? cls.sections.map((section) => (
                                                        <span
                                                            key={section.id}
                                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700"
                                                        >
                                                            {section.name}
                                                        </span>
                                                    ))
                                                    : <span className="text-gray-400 text-xs italic">No sections</span>
                                                }
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-3.5 align-middle">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    onClick={() => handleEdit(cls)}
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    onClick={() => confirmDelete(cls.id)}
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded shadow-sm"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {classes.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-gray-500 text-sm">
                                            No results found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                        <div>Showing {from} to {to} of {total} entries</div>
                        <div className="flex gap-1">
                            <Button
                                variant="outline" size="sm"
                                className="h-7 w-7 p-0 border-gray-200"
                                disabled={currentPage === 1}
                                onClick={() => fetchClasses(currentPage - 1)}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    className={`h-7 w-7 p-0 border-gray-200 ${currentPage === page ? activeGradient : "hover:bg-indigo-50 hover:text-indigo-600"}`}
                                    onClick={() => fetchClasses(page)}
                                >
                                    {page}
                                </Button>
                            ))}
                            <Button
                                variant="outline" size="sm"
                                className="h-7 w-7 p-0 border-gray-200"
                                disabled={currentPage === lastPage}
                                onClick={() => fetchClasses(currentPage + 1)}
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this class and all its sections. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
