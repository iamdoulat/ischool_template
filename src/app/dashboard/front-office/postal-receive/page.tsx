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
import { Badge } from "@/components/ui/badge";

interface PostalReceive {
    id: number;
    from_title: string;
    reference_no: string | null;
    address: string | null;
    note: string | null;
    to_title: string | null;
    date: string | null;
    attachment: string | null;
    created_at?: string;
}

export default function PostalReceivePage() {
    const { toast } = useToast();
    const [receives, setReceives] = useState<PostalReceive[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedReceive, setSelectedReceive] = useState<PostalReceive | null>(null);

    const [formData, setFormData] = useState<Partial<PostalReceive>>({
        from_title: "",
        reference_no: "",
        address: "",
        note: "",
        to_title: "",
        date: new Date().toISOString().split("T")[0],
        attachment: ""
    });

    const fetchReceives = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/postal-receives", {
                params: {
                    search: searchQuery
                }
            });
            setReceives(response.data.data.data || response.data.data);
        } catch (error) {
            console.error("Error fetching postal receives:", error);
            toast("error", "Failed to load postal receives");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, toast]);

    useEffect(() => {
        fetchReceives();
    }, [fetchReceives]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && editId) {
                await api.put(`/postal-receives/${editId}`, formData);
                toast("success", "Postal receive updated successfully");
            } else {
                await api.post("/postal-receives", formData);
                toast("success", "Postal receive added successfully");
            }
            fetchReceives();
            resetForm();
        } catch (error: any) {
            console.error("Error saving postal receive:", error);
            const message = error.response?.data?.message || "Failed to save postal receive";
            toast("error", message);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/postal-receives/${deleteId}`);
            toast("success", "Postal receive deleted successfully");
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchReceives();
        } catch (error) {
            console.error("Error deleting postal receive:", error);
            toast("error", "Failed to delete postal receive");
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post("/postal-receives/bulk-delete", { ids: selectedIds });
            toast("success", `${selectedIds.length} entries deleted successfully`);
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchReceives();
        } catch (error) {
            console.error("Error bulk deleting receives:", error);
            toast("error", "Failed to delete selected entries");
        }
    };

    const resetForm = () => {
        setFormData({
            from_title: "",
            reference_no: "",
            address: "",
            note: "",
            to_title: "",
            date: new Date().toISOString().split("T")[0],
            attachment: ""
        });
        setIsEdit(false);
        setEditId(null);
    };

    const startEdit = (receive: PostalReceive) => {
        setIsEdit(true);
        setEditId(receive.id);
        setFormData({
            from_title: receive.from_title,
            reference_no: receive.reference_no || "",
            address: receive.address || "",
            note: receive.note || "",
            to_title: receive.to_title || "",
            date: receive.date ? new Date(receive.date).toISOString().split("T")[0] : "",
            attachment: receive.attachment || ""
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === receives.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(receives.map(d => d.id));
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
        const text = receives.map(d => `${d.from_title}\t${d.reference_no}\t${d.to_title}\t${d.date}`).join("\n");
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

                {/* Left Column: Add Postal Receive Form */}
                <div className="md:col-span-4">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm sticky top-6">
                        <CardHeader className="border-b border-muted/50 pb-4">
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">
                                {isEdit ? "Edit Postal Receive" : "Add Postal Receive"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                        From Title <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50 transition-all hover:border-indigo-200"
                                        value={formData.from_title || ""}
                                        onChange={(e) => setFormData({ ...formData, from_title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Reference No</label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={formData.reference_no || ""}
                                        onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Address</label>
                                    <Textarea
                                        className="min-h-[80px] rounded-lg bg-muted/30 border-muted/50 resize-none"
                                        value={formData.address || ""}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">To Title</label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={formData.to_title || ""}
                                        onChange={(e) => setFormData({ ...formData, to_title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Date</label>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            className="h-10 rounded-lg bg-muted/30 border-muted/50 pr-10"
                                            value={formData.date || ""}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
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

                {/* Right Column: Postal Receive List Table */}
                <div className="md:col-span-8">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-muted/50 pb-4">
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Postal Receive List</CardTitle>
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
                                                    checked={selectedIds.length === receives.length && receives.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </th>
                                            <Th>From Title</Th>
                                            <Th>Reference No</Th>
                                            <Th>To Title</Th>
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
                                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading receives...</td>
                                            </tr>
                                        ) : receives.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No postal receives found</td>
                                            </tr>
                                        ) : (
                                            receives.map((item) => (
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
                                                    <Td className="font-semibold text-slate-700">{item.from_title}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.reference_no || "-"}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.to_title || "-"}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.date ? new Date(item.date).toLocaleDateString() : "-"}</Td>
                                                    <Td className="text-right">
                                                        <div className="flex justify-end gap-1 px-2">
                                                            <ActionBtn icon={Eye} className="bg-[#4F39F6]" onClick={() => { setSelectedReceive(item); setIsViewDialogOpen(true); }} />
                                                            {item.attachment && <ActionBtn icon={Download} className="bg-[#4F39F6]" />}
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
                                    Showing {receives.length > 0 ? 1 : (receives.length === 0 ? 0 : 0)} to {receives.length} of {receives.length} entries
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
                            This action cannot be undone. This will permanently delete the postal receive entry.
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
                            Are you sure you want to delete {selectedIds.length} selected postal receive entries? This action cannot be undone.
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
                            Postal Receive Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                            <DetailItem label="From Title" value={selectedReceive?.from_title} />
                            <DetailItem label="To Title" value={selectedReceive?.to_title} />
                            <DetailItem label="Reference No" value={selectedReceive?.reference_no} />
                            <DetailItem label="Date" value={selectedReceive?.date ? new Date(selectedReceive.date).toLocaleDateString() : "-"} />
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Address</label>
                                <p className="text-sm text-slate-700 bg-muted/30 p-3 rounded-lg border border-muted/50 min-h-[60px]">
                                    {selectedReceive?.address || "No address provided"}
                                </p>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Note</label>
                                <p className="text-sm text-slate-700 bg-muted/30 p-3 rounded-lg border border-muted/50 min-h-[60px]">
                                    {selectedReceive?.note || "No note provided"}
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
