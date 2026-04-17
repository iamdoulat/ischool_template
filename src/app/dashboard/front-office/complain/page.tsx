"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
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
    Calendar,
    CloudUpload,
    Copy,
    FileSpreadsheet
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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

interface Complaint {
    id: number;
    complaint_type: string | null;
    source: string | null;
    complain_by: string;
    phone: string | null;
    date: string | null;
    description: string | null;
    action_taken: string | null;
    assigned: string | null;
    note: string | null;
    attachment: string | null;
    created_at?: string;
}



export default function ComplainPage() {
    const { toast } = useToast();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [dynamicComplaintTypes, setDynamicComplaintTypes] = useState<any[]>([]);
    const [dynamicSources, setDynamicSources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

    const [formData, setFormData] = useState<Partial<Complaint>>({
        complaint_type: "",
        source: "",
        complain_by: "",
        phone: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        action_taken: "",
        assigned: "",
        note: "",
        attachment: ""
    });

    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/complaints", {
                params: {
                    search: searchQuery
                }
            });
            setComplaints(response.data.data.data || response.data.data);
        } catch (error) {
            console.error("Error fetching complaints:", error);
            toast("error", "Failed to load complaints");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, toast]);

    const fetchComplaintTypes = useCallback(async () => {
        try {
            const response = await api.get("/complaint-types?limit=1000");
            const data = response.data.data?.data || response.data.data || [];
            if (Array.isArray(data)) setDynamicComplaintTypes(data);
        } catch (error) {
            console.error("Error fetching complaint types:", error);
        }
    }, []);

    const fetchSources = useCallback(async () => {
        try {
            const response = await api.get("/front-office-sources?limit=1000");
            const data = response.data.data?.data || response.data.data || [];
            if (Array.isArray(data)) setDynamicSources(data);
        } catch (error) {
            console.error("Error fetching sources:", error);
        }
    }, []);

    useEffect(() => {
        fetchComplaints();
        fetchComplaintTypes();
        fetchSources();
    }, [fetchComplaints, fetchComplaintTypes, fetchSources]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && editId) {
                await api.put(`/complaints/${editId}`, formData);
                toast("success", "Complaint updated successfully");
            } else {
                await api.post("/complaints", formData);
                toast("success", "Complaint added successfully");
            }
            fetchComplaints();
            resetForm();
        } catch (error: any) {
            console.error("Error saving complaint:", error);
            const message = error.response?.data?.message || "Failed to save complaint";
            toast("error", message);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/complaints/${deleteId}`);
            toast("success", "Complaint deleted successfully");
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchComplaints();
        } catch (error) {
            console.error("Error deleting complaint:", error);
            toast("error", "Failed to delete complaint");
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post("/complaints/bulk-delete", { ids: selectedIds });
            toast("success", `${selectedIds.length} complaints deleted successfully`);
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchComplaints();
        } catch (error) {
            console.error("Error bulk deleting complaints:", error);
            toast("error", "Failed to delete selected complaints");
        }
    };

    const resetForm = () => {
        setFormData({
            complaint_type: "",
            source: "",
            complain_by: "",
            phone: "",
            date: new Date().toISOString().split("T")[0],
            description: "",
            action_taken: "",
            assigned: "",
            note: "",
            attachment: ""
        });
        setIsEdit(false);
        setEditId(null);
    };

    const startEdit = (complaint: Complaint) => {
        setIsEdit(true);
        setEditId(complaint.id);
        setFormData({
            complaint_type: complaint.complaint_type || "",
            source: complaint.source || "",
            complain_by: complaint.complain_by,
            phone: complaint.phone || "",
            date: complaint.date ? new Date(complaint.date).toISOString().split("T")[0] : "",
            description: complaint.description || "",
            action_taken: complaint.action_taken || "",
            assigned: complaint.assigned || "",
            note: complaint.note || "",
            attachment: complaint.attachment || ""
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === complaints.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(complaints.map(c => c.id));
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleCopy = () => {
        const text = complaints.map(c => `${c.id}\t${c.complaint_type}\t${c.complain_by}\t${c.phone}\t${c.date}`).join("\n");
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Left Column: Add Complain Form */}
                <div className="md:col-span-4">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm sticky top-6">
                        <CardHeader className="border-b border-muted/50 pb-4">
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">
                                {isEdit ? "Edit Complain" : "Add Complain"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Complaint Type</label>
                                    <div className="relative">
                                        <select
                                            className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer group-hover:border-indigo-200 transition-colors font-medium text-slate-700"
                                            value={formData.complaint_type || ""}
                                            onChange={(e) => setFormData({ ...formData, complaint_type: e.target.value })}
                                        >
                                            <option value="">Select</option>
                                            {dynamicComplaintTypes.map(type => (
                                                <option key={type.id} value={type.name}>{type.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Source</label>
                                    <div className="relative">
                                        <select
                                            className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer group-hover:border-indigo-200 transition-colors font-medium text-slate-700"
                                            value={formData.source || ""}
                                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        >
                                            <option value="">Select</option>
                                            {dynamicSources.map(source => (
                                                <option key={source.id} value={source.name}>{source.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                        Complain By <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50 transition-all hover:border-indigo-200"
                                        value={formData.complain_by || ""}
                                        onChange={(e) => setFormData({ ...formData, complain_by: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Phone</label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={formData.phone || ""}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Date</label>
                                    <Input
                                        type="date"
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={formData.date || ""}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Description</label>
                                    <Textarea
                                        className="min-h-[80px] rounded-lg bg-muted/30 border-muted/50 resize-none"
                                        value={formData.description || ""}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Action Taken</label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={formData.action_taken || ""}
                                        onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Assigned</label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={formData.assigned || ""}
                                        onChange={(e) => setFormData({ ...formData, assigned: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Note</label>
                                    <Textarea
                                        className="min-h-[80px] rounded-lg bg-muted/30 border-muted/50 resize-none"
                                        value={formData.note || ""}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Attach Document</label>
                                    <div className="border-2 border-dashed border-muted/50 rounded-lg p-6 bg-muted/10 group-hover:bg-muted/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group-hover:border-indigo-300">
                                        <div className="p-2 rounded-full bg-muted/30">
                                            <CloudUpload className="h-5 w-5 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                        <p className="text-xs font-semibold text-muted-foreground group-hover:text-slate-900 transition-colors">Drag and drop a file here or click</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    {isEdit && (
                                        <Button type="button" variant="outline" className="h-10 px-6" onClick={resetForm}>
                                            Cancel
                                        </Button>
                                    )}
                                    <Button type="submit" variant="gradient" className="h-10 px-8">
                                        Save
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Complaint List Table */}
                <div className="md:col-span-8">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-muted/50 pb-4">
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Complaint List</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search"
                                        className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
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
                                            <th className="px-4 py-4 w-10 border-b border-muted/50">
                                                <Checkbox
                                                    checked={selectedIds.length === complaints.length && complaints.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </th>
                                            <Th>Complain #</Th>
                                            <Th>Complaint Type</Th>
                                            <Th>Name</Th>
                                            <Th>Phone</Th>
                                            <Th>Date</Th>
                                            <th className="px-4 py-4 border-b border-muted/50 text-right">
                                                <div className="flex justify-end pr-1 text-slate-700">
                                                    {selectedIds.length > 0 ? (
                                                        <button
                                                            onClick={() => setIsBulkDeleteDialogOpen(true)}
                                                            className="bg-red-500 hover:bg-red-600 p-1.5 rounded transition-colors"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 text-white" />
                                                        </button>
                                                    ) : (
                                                        "ACTION"
                                                    )}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/30">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading complaints...</td>
                                            </tr>
                                        ) : complaints.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No complaints found</td>
                                            </tr>
                                        ) : (
                                            complaints.map((item) => (
                                                <tr key={item.id} className={cn(
                                                    "hover:bg-muted/10 transition-colors group",
                                                    selectedIds.includes(item.id) && "bg-muted/30"
                                                )}>
                                                    <td className="px-4 py-4">
                                                        <Checkbox
                                                            checked={selectedIds.includes(item.id)}
                                                            onCheckedChange={() => toggleSelect(item.id)}
                                                        />
                                                    </td>
                                                    <Td className="text-slate-600 font-medium">{item.id}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.complaint_type || "-"}</Td>
                                                    <Td className="font-semibold text-slate-700">{item.complain_by}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.phone || "-"}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.date ? new Date(item.date).toLocaleDateString() : "-"}</Td>
                                                    <Td className="text-right">
                                                        <div className="flex justify-end gap-1 px-2">
                                                            <ActionBtn icon={Eye} className="bg-[#4F39F6]" onClick={() => { setSelectedComplaint(item); setIsViewDialogOpen(true); }} />
                                                            <ActionBtn icon={Pencil} className="bg-[#4F39F6]" onClick={() => startEdit(item)} />
                                                            <ActionBtn icon={Trash2} className="bg-red-500" onClick={() => { setDeleteId(item.id); setIsDeleteDialogOpen(true); }} />
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
                                    Showing {complaints.length > 0 ? 1 : 0} to {complaints.length} of {complaints.length} entries
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
                </div>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the complaint entry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setDeleteId(null); setIsDeleteDialogOpen(false); }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bulk Delete Entries</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {selectedIds.length} selected complaint entries? This action cannot be undone.
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
                            Complaint Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                            <DetailItem label="Complaint Type" value={selectedComplaint?.complaint_type} />
                            <DetailItem label="Source" value={selectedComplaint?.source} />
                            <DetailItem label="Complain By" value={selectedComplaint?.complain_by} />
                            <DetailItem label="Phone" value={selectedComplaint?.phone} />
                            <DetailItem label="Date" value={selectedComplaint?.date ? new Date(selectedComplaint.date).toLocaleDateString() : "-"} />
                            <DetailItem label="Assigned" value={selectedComplaint?.assigned} />
                            <DetailItem label="Action Taken" value={selectedComplaint?.action_taken} />
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                                <p className="text-sm text-slate-700 bg-muted/30 p-3 rounded-lg border border-muted/50 min-h-[60px]">
                                    {selectedComplaint?.description || "No description provided"}
                                </p>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Note</label>
                                <p className="text-sm text-slate-700 bg-muted/30 p-3 rounded-lg border border-muted/50 min-h-[60px]">
                                    {selectedComplaint?.note || "No note provided"}
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
    return <td className={cn("px-4 py-4 text-sm whitespace-nowrap", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick }: { icon: any, onClick?: () => void }) {
    return (
        <button
            type="button"
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
