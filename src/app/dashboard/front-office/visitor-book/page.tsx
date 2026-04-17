"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Plus,
    Printer,
    FileText,
    Table as TableIcon,
    FileDown,
    Download,
    Columns,
    ChevronDown,
    Eye,
    Pencil,
    Trash2,
    X,
    LayoutGrid,
    CheckCircle2,
    AlertCircle,
    Copy,
    FileSpreadsheet,
    Calendar,
    User,
    Phone,
    Briefcase,
    Clock,
    Users,
    StickyNote,
    Paperclip
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface Visitor {
    id: number;
    purpose: string;
    meeting_with: string;
    visitor_name: string;
    phone: string;
    id_card: string | null;
    number_of_person: number;
    date: string;
    in_time: string;
    out_time: string | null;
    note: string | null;
    attachment: string | null;
    source: string | null;
}

export default function VisitorBookPage() {
    const { toast } = useToast();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [purposes, setPurposes] = useState<any[]>([]);
    const [sources, setSources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [currentVisitor, setCurrentVisitor] = useState<Visitor | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

    const [formData, setFormData] = useState<Partial<Visitor>>({
        purpose: "",
        meeting_with: "",
        visitor_name: "",
        phone: "",
        id_card: "",
        number_of_person: 1,
        date: new Date().toISOString().split("T")[0],
        in_time: "09:00",
        out_time: "",
        note: "",
        attachment: "",
        source: ""
    });

    const fetchVisitors = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/visitors", {
                params: {
                    search: searchQuery
                }
            });
            setVisitors(response.data.data);
        } catch (error) {
            console.error("Error fetching visitors:", error);
            toast("error", "Failed to load visitors");
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    const fetchPurposes = useCallback(async () => {
        try {
            const response = await api.get("/front-office-purposes?limit=1000");
            const data = response.data.data?.data || response.data.data || [];
            if (Array.isArray(data)) setPurposes(data);
        } catch (error) {
            console.error("Error fetching purposes:", error);
        }
    }, []);

    const fetchSources = useCallback(async () => {
        try {
            const response = await api.get("/front-office-sources?limit=1000");
            const data = response.data.data?.data || response.data.data || [];
            if (Array.isArray(data)) setSources(data);
        } catch (error) {
            console.error("Error fetching sources:", error);
        }
    }, []);

    useEffect(() => {
        fetchVisitors();
        fetchPurposes();
        fetchSources();
    }, [fetchVisitors, fetchPurposes, fetchSources]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentVisitor) {
                await api.put(`/visitors/${currentVisitor.id}`, formData);
                toast("success", "Visitor updated successfully");
            } else {
                await api.post("/visitors", formData);
                toast("success", "Visitor added successfully");
            }
            setIsDialogOpen(false);
            fetchVisitors();
            resetForm();
        } catch (error) {
            console.error("Error saving visitor:", error);
            toast("error", "Failed to save visitor");
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/visitors/${deleteId}`);
            toast("success", "Visitor deleted successfully");
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchVisitors();
        } catch (error) {
            console.error("Error deleting visitor:", error);
            toast("error", "Failed to delete visitor");
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post("/visitors/bulk-delete", { ids: selectedIds });
            toast("success", `${selectedIds.length} visitors deleted successfully`);
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchVisitors();
        } catch (error) {
            console.error("Error bulk deleting visitors:", error);
            toast("error", "Failed to delete selected visitors");
        }
    };

    const resetForm = () => {
        setFormData({
            purpose: "",
            meeting_with: "",
            visitor_name: "",
            phone: "",
            id_card: "",
            number_of_person: 1,
            date: new Date().toISOString().split("T")[0],
            in_time: "09:00",
            out_time: "",
            note: "",
            attachment: "",
            source: ""
        });
        setCurrentVisitor(null);
    };

    const openEditModal = (visitor: Visitor) => {
        setCurrentVisitor(visitor);
        setFormData({
            ...visitor,
            date: visitor.date ? new Date(visitor.date).toISOString().split("T")[0] : "",
            in_time: visitor.in_time ? visitor.in_time.substring(0, 5) : "",
            out_time: visitor.out_time ? visitor.out_time.substring(0, 5) : "",
            source: visitor.source || ""
        });
        setIsDialogOpen(true);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === visitors.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(visitors.map(v => v.id));
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Export functions
    const handleCopy = () => {
        const text = visitors.map(v => `${v.purpose}\t${v.meeting_with}\t${v.visitor_name}\t${v.phone}\t${v.date}`).join("\n");
        navigator.clipboard.writeText(text);
        toast("success", "Copied to clipboard");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        toast("success", "Exporting to Excel...");
    };

    const handleExportPDF = () => {
        toast("success", "Exporting to PDF...");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-muted/50 pb-4">
                    <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Visitor List</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button variant="gradient" size="sm" className="h-9 px-6">
                                <Plus className="h-4 w-4 mr-2" /> Add
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl">
                            <div className="bg-[#4F39F6] px-6 py-4 flex items-center justify-between">
                                <DialogTitle className="text-xl font-bold text-white">{currentVisitor ? "Edit Visitor" : "Add Visitor"}</DialogTitle>
                                <button
                                    onClick={() => setIsDialogOpen(false)}
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-8 bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Purpose <span className="text-destructive">*</span></label>
                                        <div className="relative">
                                            <select
                                                className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                                                value={formData.purpose}
                                                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                                required
                                            >
                                                <option value="">Select</option>
                                                {purposes.map(p => (
                                                    <option key={p.id} value={p.name}>{p.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Meeting With <span className="text-destructive">*</span></label>
                                        <Input
                                            placeholder="e.g. Staff (Name) or Student (Name)"
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.meeting_with}
                                            onChange={(e) => setFormData({ ...formData, meeting_with: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Visitor Name <span className="text-destructive">*</span></label>
                                        <Input
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.visitor_name}
                                            onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Phone <span className="text-destructive">*</span></label>
                                        <Input
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">ID Card</label>
                                        <Input
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.id_card || ""}
                                            onChange={(e) => setFormData({ ...formData, id_card: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Number Of Person <span className="text-destructive">*</span></label>
                                        <Input
                                            type="number"
                                            min="1"
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.number_of_person}
                                            onChange={(e) => setFormData({ ...formData, number_of_person: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Date <span className="text-destructive">*</span></label>
                                        <Input
                                            type="date"
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">In Time <span className="text-destructive">*</span></label>
                                        <Input
                                            type="time"
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.in_time}
                                            onChange={(e) => setFormData({ ...formData, in_time: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Out Time</label>
                                        <Input
                                            type="time"
                                            className="h-11 rounded-lg border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-primary/20"
                                            value={formData.out_time || ""}
                                            onChange={(e) => setFormData({ ...formData, out_time: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Source</label>
                                        <div className="relative">
                                            <select
                                                className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                                                value={formData.source || ""}
                                                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                            >
                                                <option value="">Select</option>
                                                {sources.map(s => (
                                                    <option key={s.id} value={s.name}>{s.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Note</label>
                                        <textarea
                                            className="flex min-h-[80px] w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all focus:bg-white"
                                            value={formData.note || ""}
                                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Attachment</label>
                                        <div className="h-20 w-full border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
                                            <Paperclip className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                                            <span className="text-xs text-slate-500 mt-1">Click to upload file</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-100">
                                    <Button
                                        type="submit"
                                        variant="gradient"
                                        className="h-11 px-10 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
                                    >
                                        Save
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search"
                                className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50 focus:ring-2 focus:ring-[#008489]/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-4">
                                <span className="text-sm font-semibold text-muted-foreground">50</span>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex gap-1">
                                <IconButton icon={Printer} onClick={handlePrint} />
                                <IconButton icon={Copy} onClick={handleCopy} />
                                <IconButton icon={FileSpreadsheet} onClick={handleExportExcel} />
                                <IconButton icon={FileText} onClick={handleExportPDF} />
                                <IconButton icon={Download} onClick={() => toast("success", "Downloading...")} />
                                <IconButton icon={Columns} />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-xl border border-muted/50">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-4 w-10">
                                        <Checkbox
                                            checked={selectedIds.length === visitors.length && visitors.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </th>
                                    <Th>Purpose</Th>
                                    <Th>Meeting With</Th>
                                    <Th>Visitor Name</Th>
                                    <Th>Phone</Th>
                                    <Th>ID Card</Th>
                                    <Th>Number Of Person</Th>
                                    <Th>Date</Th>
                                    <Th>In Time</Th>
                                    <Th>Out Time</Th>
                                    <Th>Source</Th>
                                    <th className="px-4 py-4 text-right">
                                        <div className="flex justify-end">
                                            {selectedIds.length > 0 ? (
                                                <button
                                                    onClick={() => setIsBulkDeleteDialogOpen(true)}
                                                    className="bg-red-500 hover:bg-red-600 p-1.5 rounded transition-colors"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-white" />
                                                </button>
                                            ) : (
                                                <span className="text-muted-foreground font-bold tracking-wider">ACTION</span>
                                            )}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">Loading visitors...</td>
                                    </tr>
                                ) : visitors.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">No visitors found</td>
                                    </tr>
                                ) : (
                                    visitors.map((visitor) => (
                                        <tr key={visitor.id} className={cn(
                                            "hover:bg-muted/10 transition-colors group",
                                            selectedIds.includes(visitor.id) && "bg-muted/30"
                                        )}>
                                            <td className="px-4 py-4">
                                                <Checkbox
                                                    checked={selectedIds.includes(visitor.id)}
                                                    onCheckedChange={() => toggleSelect(visitor.id)}
                                                />
                                            </td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.purpose}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.meeting_with}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.visitor_name}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.phone}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.id_card || "-"}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.number_of_person}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.date ? new Date(visitor.date).toLocaleDateString() : "-"}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.in_time}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.out_time || "-"}</Td>
                                            <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.source || "-"}</Td>
                                            <Td className="text-right">
                                                <div className="flex justify-end gap-1 px-1">
                                                    <ActionBtn icon={Eye} className="bg-[#4F39F6]" onClick={() => { setSelectedVisitor(visitor); setIsViewDialogOpen(true); }} />
                                                    {visitor.attachment && <ActionBtn icon={Download} className="bg-[#4F39F6]" />}
                                                    <ActionBtn icon={Pencil} className="bg-[#4F39F6]" onClick={() => openEditModal(visitor)} />
                                                    <ActionBtn icon={Trash2} className="bg-red-500" onClick={() => { setDeleteId(visitor.id); setIsDeleteDialogOpen(true); }} />
                                                </div>
                                            </Td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            Showing {visitors.length > 0 ? 1 : 0} to {visitors.length} of {visitors.length} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                <ChevronDown className="h-4 w-4 rotate-90" />
                            </Button>
                            <Button className="h-8 w-8 rounded-lg border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-br from-[#FF9800] to-[#4F39F6]">1</Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                <ChevronDown className="h-4 w-4 -rotate-90" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the visitor entry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bulk Delete Visitors</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {selectedIds.length} selected visitor entries? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsBulkDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600">Delete Selected</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="bg-[#4F39F6] p-6">
                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Visitor Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                            <DetailItem label="Purpose" value={selectedVisitor?.purpose} />
                            <DetailItem label="Source" value={selectedVisitor?.source} />
                            <DetailItem label="Meeting With" value={selectedVisitor?.meeting_with} />
                            <DetailItem label="Visitor Name" value={selectedVisitor?.visitor_name} />
                            <DetailItem label="Phone" value={selectedVisitor?.phone} />
                            <DetailItem label="ID Card" value={selectedVisitor?.id_card} />
                            <DetailItem label="Number Of Person" value={selectedVisitor?.number_of_person?.toString()} />
                            <DetailItem label="Date" value={selectedVisitor?.date ? new Date(selectedVisitor.date).toLocaleDateString() : "-"} />
                            <DetailItem label="In Time" value={selectedVisitor?.in_time} />
                            <DetailItem label="Out Time" value={selectedVisitor?.out_time} />
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Note</label>
                                <p className="text-sm text-slate-700 bg-muted/30 p-3 rounded-lg border border-muted/50 min-h-[60px]">
                                    {selectedVisitor?.note || "No note provided"}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end mt-8">
                            <Button
                                onClick={() => setIsViewDialogOpen(false)}
                                variant="gradient"
                                className="px-8 h-10 rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95 text-white"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-4 py-4 border-b border-muted/50 whitespace-nowrap", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-4 py-4 text-sm", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick }: { icon: any, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm"
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}

function ActionBtn({ icon: Icon, className, onClick }: { icon: any, className?: string, onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn("p-1.5 text-white rounded transition-all hover:shadow-md active:scale-90", className)}
        >
            <Icon className="h-3 w-3" />
        </button>
    );
}

function DetailItem({ label, value }: { label: string, value: string | null | undefined }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
            <div className="h-10 flex items-center px-3 bg-muted/30 rounded-lg border border-muted/50">
                <span className="text-sm font-semibold text-slate-700">{value || "-"}</span>
            </div>
        </div>
    );
}
