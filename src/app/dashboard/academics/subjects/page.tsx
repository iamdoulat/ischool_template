"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Pencil, Trash2, Search, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight, Loader2
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

interface Subject {
    id: number;
    name: string;
    code: string;
    type: string;
}

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form state
    const [subjectName, setSubjectName] = useState("");
    const [subjectCode, setSubjectCode] = useState("");
    const [subjectType, setSubjectType] = useState("theory");
    const [editingId, setEditingId] = useState<number | null>(null);

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<number | null>(null);
    const { toast } = useToast();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);

    const fetchSubjects = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/academics/subjects`, {
                params: { page, search: searchTerm, limit: 10 }
            });
            const { data } = response.data;
            setSubjects(data.data);
            setCurrentPage(data.current_page);
            setLastPage(data.last_page);
            setTotal(data.total);
            setFrom(data.from || 0);
            setTo(data.to || 0);
        } catch (error) {
            console.error("Error fetching subjects:", error);
            toast("error", "Failed to execute subject fetch request.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchSubjects(1);
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const resetForm = () => {
        setSubjectName("");
        setSubjectCode("");
        setSubjectType("theory");
        setEditingId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subjectName.trim()) {
            toast("error", "Please provide a subject name.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: subjectName,
                code: subjectCode,
                type: subjectType
            };

            if (editingId) {
                await api.put(`/subjects/${editingId}`, payload);
            } else {
                await api.post(`/subjects`, payload);
            }
            resetForm();
            fetchSubjects(currentPage);
            toast("success", editingId ? "Subject updated successfully" : "Subject created successfully");
        } catch (error: any) {
            const message = error.response?.data?.message || "Error saving subject";
            toast("error", message);
            console.error("Error saving subject:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (sub: Subject) => {
        setSubjectName(sub.name);
        setSubjectCode(sub.code || "");
        setSubjectType(sub.type);
        setEditingId(sub.id);
    };

    const confirmDelete = (id: number) => {
        setIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!idToDelete) return;
        setLoading(true);
        try {
            const response = await api.delete(`/subjects/${idToDelete}`);
            if (response.data.status === "success") {
                toast("success", response.data.message || "Subject deleted successfully");
                fetchSubjects(currentPage);
            }
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Error deleting subject");
        } finally {
            setLoading(false);
            setIsDeleteDialogOpen(false);
            setIdToDelete(null);
        }
    };

    // Export functions
    const exportToCopy = () => {
        const text = subjects.map(s => `${s.name}\t${s.code || '-'}\t${s.type}`).join("\n");
        navigator.clipboard.writeText("Subject\tCode\tType\n" + text);
        toast("success", "Copied to clipboard");
    };

    const exportToExcel = () => {
        const data = subjects.map(s => ({
            Subject: s.name,
            'Subject Code': s.code || '-',
            'Subject Type': s.type.charAt(0).toUpperCase() + s.type.slice(1)
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Subjects");
        XLSX.writeFile(workbook, "subjects.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Subject", "Subject Code", "Subject Type"]],
            body: subjects.map(s => [
                s.name,
                s.code || '-',
                s.type.charAt(0).toUpperCase() + s.type.slice(1)
            ]),
        });
        doc.save("subjects.pdf");
    };

    const printTable = () => {
        const printWindow = window.open("", "", "height=600,width=800");
        if (!printWindow) return;
        printWindow.document.write("<html><head><title>Subject List</title>");
        printWindow.document.write("<style>table{width:100%;border-collapse:collapse;font-family:sans-serif;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#f2f2f2;}</style>");
        printWindow.document.write("</head><body><h2>Subject List</h2><table><thead><tr><th>Subject</th><th>Subject Code</th><th>Subject Type</th></tr></thead><tbody>");
        subjects.forEach(s => {
            printWindow.document.write(`<tr><td>${s.name}</td><td>${s.code || '-'}</td><td>${s.type.charAt(0).toUpperCase() + s.type.slice(1)}</td></tr>`);
        });
        printWindow.document.write("</tbody></table></body></html>");
        printWindow.document.close();
        printWindow.print();
    };

    // Styling constants
    const activeGradient = "bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 border-0 text-white";
    const saveGradient = "bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white shadow-sm transition-all";

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Add Subject Form */}
            <form onSubmit={handleSave} className="w-full lg:w-1/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">
                        {editingId ? "Edit Subject" : "Add Subject"}
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="subjectName" className="text-sm font-medium text-gray-700">
                                Subject Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="subjectName"
                                className="h-9 focus-visible:ring-indigo-500"
                                value={subjectName}
                                onChange={(e) => setSubjectName(e.target.value)}
                                placeholder="e.g. Mathematics"
                                required
                            />
                        </div>

                        <div className="space-y-3 pt-1">
                            <RadioGroup
                                value={subjectType}
                                onValueChange={setSubjectType}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="theory" id="theory" className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <Label htmlFor="theory" className="text-sm font-normal text-gray-600 cursor-pointer">Theory</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="practical" id="practical" className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <Label htmlFor="practical" className="text-sm font-normal text-gray-600 cursor-pointer">Practical</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subjectCode" className="text-sm font-medium text-gray-700">
                                Subject Code
                            </Label>
                            <Input
                                id="subjectCode"
                                className="h-9 focus-visible:ring-indigo-500"
                                value={subjectCode}
                                onChange={(e) => setSubjectCode(e.target.value)}
                                placeholder="e.g. 101"
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

            {/* Right Column: Subject List */}
            <div className="w-full lg:w-2/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 font-sans">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Subject List</h2>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
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
                                    <TableHead className="font-bold text-gray-700 py-3">Subject</TableHead>
                                    <TableHead className="font-bold text-gray-700 text-right py-3">Subject Code</TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3 pl-8">Subject Type</TableHead>
                                    <TableHead className="font-bold text-gray-700 text-right py-3">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subjects.map((sub) => (
                                    <TableRow key={sub.id} className="text-[13px] hover:bg-gray-50/50 border-b last:border-0 border-gray-50">
                                        <TableCell className="text-gray-600 font-medium py-3.5 align-middle">{sub.name}</TableCell>
                                        <TableCell className="text-gray-500 text-right py-3.5 align-middle font-mono text-xs">{sub.code || '-'}</TableCell>
                                        <TableCell className="text-gray-600 py-3.5 align-middle pl-8 capitalize">{sub.type}</TableCell>
                                        <TableCell className="text-right py-3.5 align-middle">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    onClick={() => handleEdit(sub)}
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    onClick={() => confirmDelete(sub.id)}
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
                                {subjects.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-gray-500 text-sm">
                                            No subjects found.
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
                                onClick={() => fetchSubjects(currentPage - 1)}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    className={`h-7 w-7 p-0 border-gray-200 ${currentPage === page ? activeGradient : "hover:bg-indigo-50 hover:text-indigo-600"}`}
                                    onClick={() => fetchSubjects(page)}
                                >
                                    {page}
                                </Button>
                            ))}
                            <Button
                                variant="outline" size="sm"
                                className="h-7 w-7 p-0 border-gray-200"
                                disabled={currentPage === lastPage}
                                onClick={() => fetchSubjects(currentPage + 1)}
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
                            This will permanently delete this subject. This action cannot be undone.
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
