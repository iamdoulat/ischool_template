"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Copy, FileSpreadsheet, FileText, Printer, Columns, Pencil, 
    Trash2, ChevronLeft, ChevronRight, Settings2, ShieldAlert,
    LayoutGrid, GraduationCap, ClipboardList, BookMarked, Search,
    FileEdit
} from "lucide-react";
import { cn } from "@/lib/utils";
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

interface CategoryRecord {
    id: string;
    name: string;
    description: string;
}

export default function CBSESettingsPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("Exam Category");
    const [searchTerm, setSearchTerm] = useState("");
    const [categories, setCategories] = useState<CategoryRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalEntries, setTotalEntries] = useState(0);

    // Form State
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: ""
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const menuItems = [
        { name: "Exam Category", icon: LayoutGrid },
        { name: "Exam Grade", icon: GraduationCap },
        { name: "Assessment", icon: ClipboardList },
        { name: "Term", icon: BookMarked },
    ];

    useEffect(() => {
        if (activeTab === "Exam Category") {
            fetchCategories();
        }
    }, [currentPage, itemsPerPage, searchTerm, activeTab]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get('/examination/cbse-exam-categories', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            setCategories(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch categories", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast({ title: "Validation Error", description: "Category name is required", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/examination/cbse-exam-categories/${selectedId}`, formData);
                toast({ title: "Success", description: "Category updated successfully" });
            } else {
                await api.post('/examination/cbse-exam-categories', formData);
                toast({ title: "Success", description: "Category created successfully" });
            }
            resetForm();
            fetchCategories();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save category", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (record: CategoryRecord) => {
        setEditMode(true);
        setSelectedId(record.id);
        setFormData({
            name: record.name,
            description: record.description || ""
        });
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/examination/cbse-exam-categories/${deleteId}`);
            toast({ title: "Success", description: "Category deleted successfully" });
            fetchCategories();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormData({ name: "", description: "" });
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Settings2 className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">CBSE Examination Settings</h1>
                        <p className="text-[11px] text-gray-500 mt-1">Configure board parameters and standards</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column: Settings Menu */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden sticky top-4">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Settings Hub</h3>
                        </div>
                        <nav className="flex flex-col p-2 space-y-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => setActiveTab(item.name)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all group",
                                        activeTab === item.name
                                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-100"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-indigo-600"
                                    )}
                                >
                                    <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", activeTab === item.name ? "text-white" : "text-gray-400")} />
                                    {item.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Middle Column: Create Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col h-fit sticky top-4">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/30 rounded-t-2xl flex items-center gap-3">
                            <FileEdit className="h-5 w-5 text-indigo-500" />
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">
                                {editMode ? "Edit Category" : "New Category"}
                            </h2>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Category Name <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Scholastic"
                                    className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none" 
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Description</Label>
                                <Input 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Optional details..."
                                    className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none" 
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-50 bg-gray-50/30 rounded-b-2xl flex gap-2">
                            {editMode && (
                                <Button onClick={resetForm} variant="outline" className="flex-1 h-11 rounded-full text-[11px] font-bold uppercase tracking-widest border-gray-200">
                                    Cancel
                                </Button>
                            )}
                            <Button 
                                onClick={handleSave} 
                                disabled={submitting}
                                className="btn-gradient flex-[2] text-white h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full"
                            >
                                {submitting ? "Processing..." : editMode ? "Update" : "Create"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Category List */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                                <LayoutGrid className="h-5 w-5 text-indigo-500" />
                                {activeTab} Repository
                            </h2>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Copy className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileSpreadsheet className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileText className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Printer className="h-4 w-4" /></Button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={`Search ${activeTab.toLowerCase()}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Rows:</span>
                                <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(parseInt(val))}>
                                    <SelectTrigger className="w-[100px] h-10 border-gray-100 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10 Rows</SelectItem>
                                        <SelectItem value="25">25 Rows</SelectItem>
                                        <SelectItem value="50">50 Rows</SelectItem>
                                        <SelectItem value="100">100 Rows</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-gray-50/50 text-[11px] uppercase font-bold text-gray-600">
                                    <TableRow className="hover:bg-transparent border-gray-50">
                                        <TableHead className="py-4 px-6 w-full">Category Name</TableHead>
                                        <TableHead className="py-4 px-6 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-48 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">Syncing Records...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : categories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-32 text-center text-gray-400 text-sm italic">
                                                No records found for {activeTab}.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        categories.map((item) => (
                                            <TableRow key={item.id} className="text-[13px] text-gray-600 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer group border-b last:border-0 border-gray-50 transition-colors">
                                                <TableCell className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-indigo-600 uppercase tracking-tight">{item.name}</span>
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter truncate max-w-[300px]">{item.description || "System standard category"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                        <Button size="icon" variant="ghost" onClick={() => handleEdit(item)} className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(item.id)} className="h-8 w-8 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-4 uppercase tracking-tight">
                            <div>
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" 
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="default" size="sm" className="h-8 w-8 p-0 btn-gradient text-white border-0 rounded-lg shadow-md">
                                    {currentPage}
                                </Button>
                                <Button 
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" 
                                    disabled={categories.length < itemsPerPage}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Record</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete this {activeTab.toLowerCase()}? This action is permanent and may affect existing examination data linked to this category.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
