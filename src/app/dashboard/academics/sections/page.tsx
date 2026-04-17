"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Pencil, Trash2, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight, Loader2
} from "lucide-react";
import api from "@/lib/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

interface Section {
    id: number;
    name: string;
}

export default function SectionsPage() {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sectionName, setSectionName] = useState("");
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

    const fetchSections = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/sections`, {
                params: {
                    page: page,
                    search: searchTerm,
                    limit: 10
                }
            });
            const { data } = response.data;
            setSections(data.data);
            setCurrentPage(data.current_page);
            setLastPage(data.last_page);
            setTotal(data.total);
            setFrom(data.from || 0);
            setTo(data.to || 0);
        } catch (error) {
            console.error("Error fetching sections:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSections(1);
    }, [searchTerm]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sectionName.trim()) {
            toast("error", "Please provide a section name.");
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/sections/${editingId}`, { name: sectionName });
                toast("success", "Section updated successfully");
            } else {
                await api.post(`/sections`, { name: sectionName });
                toast("success", "Section created successfully");
            }
            setSectionName("");
            setEditingId(null);
            fetchSections(currentPage);
        } catch (error: any) {
            console.error("Error saving section:", error);
            toast("error", error.response?.data?.message || "Error saving section");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (section: Section) => {
        setSectionName(section.name);
        setEditingId(section.id);
    };

    const confirmDelete = (id: number) => {
        setIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!idToDelete) return;
        setLoading(true);
        try {
            await api.delete(`/sections/${idToDelete}`);
            fetchSections(currentPage);
            toast("success", "Section deleted successfully (globally)");
        } catch (error: any) {
            console.error("Error deleting section:", error);
            toast("error", error.response?.data?.message || "Error deleting section");
        } finally {
            setLoading(false);
            setIsDeleteDialogOpen(false);
            setIdToDelete(null);
        }
    };

    const exportToCopy = () => {
        const text = sections.map(s => s.name).join("\n");
        navigator.clipboard.writeText(text);
        toast("success", "Copied to clipboard");
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(sections.map(s => ({ Section: s.name })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sections");
        XLSX.writeFile(workbook, "sections.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [['Section']],
            body: sections.map(s => [s.name]),
        });
        doc.save("sections.pdf");
    };

    const printTable = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        if (!printWindow) return;
        printWindow.document.write('<html><head><title>Section List</title>');
        printWindow.document.write('<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h2>Section List</h2>');
        printWindow.document.write('<table><thead><tr><th>Section</th></tr></thead><tbody>');
        sections.forEach(s => {
            printWindow.document.write(`<tr><td>${s.name}</td></tr>`);
        });
        printWindow.document.write('</tbody></table></body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    // Gradient background utility for active pagination
    const activeGradient = "bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 border-0";
    // Gradient background utility for save button
    const saveGradient = "bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white shadow-sm transition-all";

    return (
        <div className="flex flex-col lg:flex-row gap-6 font-sans">
            {/* Left Column: Add Section Form */}
            <form onSubmit={handleSave} className="w-full lg:w-1/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">
                        {editingId ? "Edit Section" : "Add Section"}
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sectionName" className="text-sm font-medium text-gray-700">
                                Section Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="sectionName"
                                className="h-9 focus-visible:ring-indigo-500"
                                value={sectionName}
                                onChange={(e) => setSectionName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex justify-end pt-2">
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

            {/* Right Column: Section List */}
            <div className="w-full lg:w-2/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Section List</h2>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-xs text-gray-500 font-medium">50</span>
                                <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button onClick={exportToCopy} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button onClick={exportToExcel} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button onClick={exportToPDF} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button onClick={printTable} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
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
                                    <TableHead className="font-bold text-gray-700 py-3">Section</TableHead>
                                    <TableHead className="font-bold text-gray-700 text-right py-3">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sections.map((sec) => (
                                    <TableRow key={sec.id} className="text-[13px] hover:bg-gray-50/50 group border-b last:border-0 border-gray-50">
                                        <TableCell className="text-gray-600 font-normal py-3.5">{sec.name}</TableCell>
                                        <TableCell className="text-right py-3.5">
                                            <div className="flex items-center justify-end gap-1 transition-opacity">
                                                <Button
                                                    onClick={() => handleEdit(sec)}
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    onClick={() => confirmDelete(sec.id)}
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
                                {sections.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center text-gray-500 text-sm">
                                            No results found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                        <div>
                            Showing {from} to {to} of {total} entries
                        </div>
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 border-gray-200"
                                disabled={currentPage === 1}
                                onClick={() => fetchSections(currentPage - 1)}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    className={`h-7 w-7 p-0 border-gray-200 ${currentPage === page ? activeGradient : "hover:bg-indigo-50 hover:text-indigo-600"}`}
                                    onClick={() => fetchSections(page)}
                                >
                                    {page}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 border-gray-200"
                                disabled={currentPage === lastPage}
                                onClick={() => fetchSections(currentPage + 1)}
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
                            This will permanently delete this section from all classes tracking it. This action cannot be undone.
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
