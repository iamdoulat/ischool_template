"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import "react-quill-new/dist/quill.snow.css";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Label
} from "@/components/ui/label";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    Plus,
    ArrowUpDown,
    Eye,
    X,
    Loader2
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface PageItem {
    id: number;
    title: string;
    url: string | null;
    page_type: string;
    is_system: boolean;
    content: string | null;
}

export default function PagesListPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [pages, setPages] = useState<PageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const appUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "https://ischool.com";

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        url: "",
        page_type: "Standard",
        content: ""
    });

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const ReactQuill = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }), []);

    useEffect(() => {
        fetchPages();
    }, []);

    const handleOpenDialog = (page?: PageItem) => {
        if (page) {
            setEditingId(page.id);
            setFormData({
                title: page.title,
                url: page.url || "",
                page_type: page.page_type,
                content: page.content || ""
            });
        } else {
            setEditingId(null);
            setFormData({ title: "", url: "", page_type: "Standard", content: "" });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title) {
            toast("error", "Title is required");
            return;
        }

        setSaving(true);
        try {
            let res;
            if (editingId) {
                res = await api.put(`front-cms/pages/${editingId}`, formData);
            } else {
                res = await api.post("front-cms/pages", formData);
            }

            if (res.data?.status === "Success" || res.status === 200 || res.status === 201) {
                toast("success", editingId ? "Page updated successfully" : "Page added successfully");
                setIsDialogOpen(false);
                fetchPages();
            }
        } catch (error) {
            toast("error", "Failed to save page");
        } finally {
            setSaving(false);
        }
    };

    const handleViewPage = (url: string | null) => {
        const fullUrl = `${appUrl.replace(/\/$/, '')}/${(url || '').replace(/^\//, '')}`;
        window.open(fullUrl, '_blank');
    };

    const fetchPages = async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/pages");
            if (res.data?.status === "Success") {
                setPages(res.data.data);
            }
        } catch (error) {
            toast("error", "Failed to load pages");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            const res = await api.delete(`front-cms/pages/${deleteId}`);
            if (res.data?.status === "Success" || res.status === 200) {
                toast("success", "Page deleted successfully");
                setIsDeleteOpen(false);
                fetchPages();
            }
        } catch (error) {
            toast("error", "Failed to delete page");
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const filteredPages = pages.filter((page) =>
        page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (page.url && page.url.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getBadgeStyle = (type: string) => {
        switch (type?.toLowerCase()) {
            case "gallery":
                return "bg-lime-500 text-white";
            case "event":
                return "bg-cyan-500 text-white";
            default:
                return "bg-gray-400 text-white";
        }
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <h2 className="text-sm font-semibold text-gray-800 tracking-tight">Page List</h2>
                    <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-5 h-9 font-bold rounded-full shadow-md flex items-center gap-2 tracking-tight">
                        <Plus className="h-4 w-4 text-white font-bold stroke-[3px]" />
                        Add
                    </Button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-9 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/50"
                            />
                        </div>
                        <Button className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-5 h-9 font-bold rounded-full shadow-md flex items-center gap-2 text-sm tracking-tight">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">50</span>
                            <Select defaultValue="50">
                                <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            {[Copy, FileSpreadsheet, FileText, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Title <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">URL <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Page Type <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredPages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                                        No pages found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPages.map((page) => (
                                    <TableRow key={page.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3 px-4 text-gray-700 font-medium">{page.title}</TableCell>
                                        <TableCell 
                                            className="py-3 px-4 text-indigo-500 font-medium hover:underline cursor-pointer"
                                            onClick={() => handleViewPage(page.url)}
                                        >
                                            {appUrl.replace(/\/$/, '')}/{page.url?.replace(/^\//, '')}
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight shadow-sm",
                                                getBadgeStyle(page.page_type)
                                            )}>
                                                {page.page_type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    onClick={() => handleViewPage(page.url)}
                                                    className="h-8 w-8 bg-[#10b981] hover:bg-[#059669] text-white rounded-[10px] shadow-md border-0"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(page)} className="h-8 w-8 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-[10px] shadow-md border-0">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                {!page.is_system && (
                                                    <Button size="icon" variant="ghost" onClick={() => handleDelete(page.id)} className="h-8 w-8 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-[10px] shadow-md border-0 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>
                        Showing 1 to {filteredPages.length} of {pages.length} entries
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-[14px] bg-gray-50/50 border border-gray-100 hover:bg-gray-100 text-gray-500">
                            <ChevronLeft className="h-4 w-4 stroke-[3px]" />
                        </Button>
                        <Button variant="default" size="icon" className="h-9 w-9 p-0 bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white border-0 font-bold text-[14px] rounded-[14px] shadow-md">
                            1
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-[14px] bg-gray-50/50 border border-gray-100 hover:bg-gray-100 text-gray-500">
                            <ChevronRight className="h-4 w-4 stroke-[3px]" />
                        </Button>
                    </div>
                </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Page" : "Add Page"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Title <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="h-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 shadow-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Page Type</Label>
                                <Select value={formData.page_type} onValueChange={(v) => setFormData({ ...formData, page_type: v })}>
                                    <SelectTrigger className="h-9 border-gray-200 text-[11px] shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Standard">Standard</SelectItem>
                                        <SelectItem value="Gallery">Gallery</SelectItem>
                                        <SelectItem value="Event">Event</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">URL (Optional)</Label>
                            <Input
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                className="h-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 shadow-none"
                                placeholder="/my-page"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">Content</Label>
                            <div className="min-h-[200px] border border-gray-200 rounded-md overflow-hidden">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.content}
                                    onChange={(content) => setFormData({ ...formData, content })}
                                    className="h-full bg-white"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="border-t pt-4">
                        <Button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-9 text-[11px] font-bold uppercase transition-all rounded shadow-sm"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="flex flex-col items-center justify-center space-y-3 py-4">
                        <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center">
                            <Trash2 className="h-6 w-6 text-red-500" />
                        </div>
                        <DialogTitle className="text-lg font-bold text-gray-800">Delete Page</DialogTitle>
                        <p className="text-sm text-gray-500 text-center">Are you sure you want to delete this page? This action cannot be undone.</p>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:justify-center pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteOpen(false)}
                            className="flex-1 h-10 text-[11px] font-bold uppercase border-gray-100 hover:bg-gray-50 text-gray-500 rounded"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold uppercase transition-all rounded shadow-sm flex items-center justify-center"
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Delete Now"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
