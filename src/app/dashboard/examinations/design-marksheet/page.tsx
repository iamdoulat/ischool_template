"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Pencil, Trash2, Eye, Upload, Image as ImageIcon, Search,
    Copy, FileSpreadsheet, FileText, Printer, Columns, 
    ChevronLeft, ChevronRight, Palette, Layout, Settings2, FileCheck
} from "lucide-react";
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

interface Marksheet {
    id: string;
    name: string;
    background_image: string;
    is_active: boolean;
}

export default function DesignMarksheetPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [templates, setTemplates] = useState<Marksheet[]>([]);
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
        exam_name: "",
        school_name: "",
        exam_center: "",
        body_text: "",
        footer_text: "",
        printing_date: "",
        header_image: "",
        left_logo: "",
        right_logo: "",
        left_sign: "",
        middle_sign: "",
        right_sign: "",
        background_image: "",
        show_name: true,
        show_father_name: true,
        show_mother_name: true,
        show_exam_number: true,
        show_admission_no: true,
        show_division: true,
        show_roll_no: true,
        show_photo: true,
        show_class: true,
        show_section: true,
        show_status: true,
        show_remark: true,
        is_active: true
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await api.get('/examination/marksheet-templates', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            setTemplates(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch templates", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast({ title: "Validation Error", description: "Template name is required", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/examination/marksheet-templates/${selectedId}`, formData);
                toast({ title: "Success", description: "Template updated successfully" });
            } else {
                await api.post('/examination/marksheet-templates', formData);
                toast({ title: "Success", description: "Template created successfully" });
            }
            resetForm();
            fetchTemplates();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (template: any) => {
        setEditMode(true);
        setSelectedId(template.id);
        setFormData({
            ...template,
            printing_date: template.printing_date ? template.printing_date.substring(0, 10) : ""
        });
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/examination/marksheet-templates/${deleteId}`);
            toast({ title: "Success", description: "Template deleted successfully" });
            fetchTemplates();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormData({
            name: "",
            exam_name: "",
            school_name: "",
            exam_center: "",
            body_text: "",
            footer_text: "",
            printing_date: "",
            header_image: "",
            left_logo: "",
            right_logo: "",
            left_sign: "",
            middle_sign: "",
            right_sign: "",
            background_image: "",
            show_name: true,
            show_father_name: true,
            show_mother_name: true,
            show_exam_number: true,
            show_admission_no: true,
            show_division: true,
            show_roll_no: true,
            show_photo: true,
            show_class: true,
            show_section: true,
            show_status: true,
            show_remark: true,
            is_active: true
        });
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Add Marksheet Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-120px)] sticky top-4">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/30 rounded-t-2xl flex items-center gap-3">
                            <Palette className="h-5 w-5 text-indigo-500" />
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">
                                {editMode ? "Edit Marksheet" : "Add Marksheet"}
                            </h2>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Template Name <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. School Final Marksheet"
                                    className="h-10 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none" 
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Exam Name</Label>
                                <Input 
                                    value={formData.exam_name}
                                    onChange={(e) => setFormData({...formData, exam_name: e.target.value})}
                                    className="h-10 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none" 
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">School Name</Label>
                                <Input 
                                    value={formData.school_name}
                                    onChange={(e) => setFormData({...formData, school_name: e.target.value})}
                                    className="h-10 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none" 
                                />
                            </div>

                            {/* Toggles Section */}
                            <div className="pt-4 border-t border-dashed border-gray-100 space-y-4">
                                <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">Display Configurations</h3>
                                {[
                                    { key: "show_name", label: "Student Name" },
                                    { key: "show_father_name", label: "Father Name" },
                                    { key: "show_roll_no", label: "Roll Number" },
                                    { key: "show_photo", label: "Student Photo" },
                                    { key: "show_class", label: "Class & Section" },
                                    { key: "show_status", label: "Pass/Fail Status" }
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between group">
                                        <Label className="text-[11px] font-bold text-gray-600 cursor-pointer group-hover:text-indigo-600 transition-colors">{item.label}</Label>
                                        <Switch 
                                            checked={(formData as any)[item.key]} 
                                            onCheckedChange={(val) => setFormData({...formData, [item.key]: val})}
                                            className="data-[state=checked]:bg-indigo-500 scale-90" 
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* File Upload Placeholders */}
                            <div className="pt-4 border-t border-dashed border-gray-100 space-y-4">
                                <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Assets & Media</h3>
                                {["Header Image", "Background Image"].map((label) => (
                                    <div key={label} className="space-y-2">
                                        <Label className="text-[11px] font-bold text-gray-500 uppercase">{label}</Label>
                                        <div className="border-2 border-dashed border-gray-100 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-all bg-gray-50/20 group">
                                            <Upload className="h-6 w-6 text-gray-300 mb-2 group-hover:text-indigo-400 transition-colors" />
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Upload Asset</span>
                                        </div>
                                    </div>
                                ))}
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
                                {submitting ? "Saving..." : editMode ? "Update Template" : "Save Template"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Marksheet List */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                                <Layout className="h-5 w-5 text-indigo-500" />
                                Marksheet Templates
                            </h2>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer">
                                    <Columns className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search templates..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 shadow-none"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">View:</span>
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
                                        <TableHead className="py-4 px-6">Certificate Name</TableHead>
                                        <TableHead className="py-4 px-6">Design Status</TableHead>
                                        <TableHead className="py-4 px-6">Assets</TableHead>
                                        <TableHead className="py-4 px-6 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-48 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">Syncing Design Repository...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : templates.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-gray-400 text-sm italic">
                                                No designs found. Create your first template on the left.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        templates.map((item) => (
                                            <TableRow key={item.id} className="text-[13px] text-gray-600 hover:bg-gray-50/30 group border-b last:border-0 border-gray-50 transition-colors">
                                                <TableCell className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-indigo-600 uppercase tracking-tight">{item.name}</span>
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">System ID: {item.id}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    {item.is_active ? (
                                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold text-[9px] border border-emerald-100 flex items-center gap-1.5 w-fit">
                                                            <FileCheck className="h-3 w-3" /> ACTIVE
                                                        </span>
                                                    ) : (
                                                        <span className="bg-gray-50 text-gray-400 px-3 py-1 rounded-full font-bold text-[9px] border border-gray-100 flex items-center gap-1.5 w-fit">
                                                            <Settings2 className="h-3 w-3" /> DRAFT
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <div className="flex gap-2">
                                                        {item.background_image ? (
                                                            <div className="h-8 w-8 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-center" title="Has Background">
                                                                <ImageIcon className="h-4 w-4 text-indigo-500" />
                                                            </div>
                                                        ) : (
                                                            <div className="h-8 w-8 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center opacity-30">
                                                                <ImageIcon className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
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
                                    disabled={templates.length < itemsPerPage}
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
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Design Template</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete this marksheet design? This will permanently remove all configuration settings and associated asset links.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-11 rounded-full text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete Template
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
