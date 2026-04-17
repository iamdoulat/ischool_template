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
    Phone,
    X,
    Filter,
    FileSpreadsheet,
    Copy,
    ArrowUpDown,
    CheckCircle2,
    AlertCircle,
    Copy as CopyIcon
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

interface PhoneCallLog {
    id: number;
    name: string | null;
    phone: string;
    date: string;
    description: string | null;
    next_follow_up_date: string | null;
    call_duration: string | null;
    note: string | null;
    call_type: "Incoming" | "Outgoing";
    created_at?: string;
}

export default function PhoneCallLogPage() {
    const { toast } = useToast();
    const [logs, setLogs] = useState<PhoneCallLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<PhoneCallLog | null>(null);

    const [formData, setFormData] = useState<Partial<PhoneCallLog>>({
        name: "",
        phone: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        next_follow_up_date: "",
        call_duration: "",
        note: "",
        call_type: "Incoming"
    });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/phone-call-logs", {
                params: {
                    search: searchQuery
                }
            });
            // Handle Laravel paginated response structure
            setLogs(response.data.data.data || response.data.data);
        } catch (error) {
            console.error("Error fetching phone call logs:", error);
            toast("error", "Failed to load phone call logs");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, toast]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && editId) {
                await api.put(`/phone-call-logs/${editId}`, formData);
                toast("success", "Phone call log updated successfully");
            } else {
                await api.post("/phone-call-logs", formData);
                toast("success", "Phone call log added successfully");
            }
            fetchLogs();
            resetForm();
        } catch (error: any) {
            console.error("Error saving phone call log:", error);
            const message = error.response?.data?.message || "Failed to save phone call log";
            toast("error", message);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/phone-call-logs/${deleteId}`);
            toast("success", "Phone call log deleted successfully");
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchLogs();
        } catch (error) {
            console.error("Error deleting phone call log:", error);
            toast("error", "Failed to delete phone call log");
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post("/phone-call-logs/bulk-delete", { ids: selectedIds });
            toast("success", `${selectedIds.length} logs deleted successfully`);
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchLogs();
        } catch (error) {
            console.error("Error bulk deleting logs:", error);
            toast("error", "Failed to delete selected logs");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            phone: "",
            date: new Date().toISOString().split("T")[0],
            description: "",
            next_follow_up_date: "",
            call_duration: "",
            note: "",
            call_type: "Incoming"
        });
        setIsEdit(false);
        setEditId(null);
    };

    const startEdit = (log: PhoneCallLog) => {
        setIsEdit(true);
        setEditId(log.id);
        setFormData({
            name: log.name || "",
            phone: log.phone,
            date: log.date ? new Date(log.date).toISOString().split("T")[0] : "",
            description: log.description || "",
            next_follow_up_date: log.next_follow_up_date ? new Date(log.next_follow_up_date).toISOString().split("T")[0] : "",
            call_duration: log.call_duration || "",
            note: log.note || "",
            call_type: log.call_type
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === logs.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(logs.map(l => l.id));
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
        const text = logs.map(l => `${l.name}\t${l.phone}\t${l.date}\t${l.call_type}`).join("\n");
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

                {/* Left Column: Add Phone Call Log Form */}
                <div className="md:col-span-4">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm sticky top-6">
                        <CardHeader className="border-b border-muted/50 pb-4">
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">
                                {isEdit ? "Edit Phone Call Log" : "Add Phone Call Log"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Name</label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={formData.name || ""}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                        Phone <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50 transition-all hover:border-indigo-200"
                                        value={formData.phone || ""}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                        Date <span className="text-destructive">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            className="h-10 rounded-lg bg-muted/30 border-muted/50 pr-10"
                                            value={formData.date || ""}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            required
                                        />
                                    </div>
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
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Next Follow Up Date</label>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            className="h-10 rounded-lg bg-muted/30 border-muted/50 pr-10"
                                            value={formData.next_follow_up_date || ""}
                                            onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Call Duration</label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={formData.call_duration || ""}
                                        onChange={(e) => setFormData({ ...formData, call_duration: e.target.value })}
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

                                <div className="space-y-3 group pb-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                        Call Type <span className="text-destructive">*</span>
                                    </label>
                                    <div className="flex gap-6 ml-1">
                                        <label className="flex items-center gap-2 cursor-pointer group/item">
                                            <input
                                                type="radio"
                                                name="callType"
                                                className="w-4 h-4 accent-[#008489]"
                                                checked={formData.call_type === "Incoming"}
                                                onChange={() => setFormData({ ...formData, call_type: "Incoming" })}
                                            />
                                            <span className="text-sm font-medium text-slate-600 group-hover/item:text-slate-900 transition-colors">Incoming</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group/item">
                                            <input
                                                type="radio"
                                                name="callType"
                                                className="w-4 h-4 accent-[#008489]"
                                                checked={formData.call_type === "Outgoing"}
                                                onChange={() => setFormData({ ...formData, call_type: "Outgoing" })}
                                            />
                                            <span className="text-sm font-medium text-slate-600 group-hover/item:text-slate-900 transition-colors">Outgoing</span>
                                        </label>
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

                {/* Right Column: Phone Call Log List Table */}
                <div className="md:col-span-8">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-muted/50 pb-4">
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Phone Call Log List</CardTitle>
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
                                        <IconButton icon={CopyIcon} onClick={handleCopy} />
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
                                                    checked={selectedIds.length === logs.length && logs.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </th>
                                            <Th>Name</Th>
                                            <Th>Phone</Th>
                                            <Th>Date</Th>
                                            <Th>Next Follow Up Date</Th>
                                            <Th>Call Type</Th>
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
                                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading logs...</td>
                                            </tr>
                                        ) : logs.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No phone call logs found</td>
                                            </tr>
                                        ) : (
                                            logs.map((item) => (
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
                                                    <Td className="font-semibold text-slate-700">{item.name || "-"}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.phone}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.date ? new Date(item.date).toLocaleDateString() : "-"}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.next_follow_up_date ? new Date(item.next_follow_up_date).toLocaleDateString() : "-"}</Td>
                                                    <Td className="text-slate-600 font-medium text-xs">
                                                        <Badge variant={item.call_type === "Incoming" ? "default" : "secondary"} className="text-[10px]">
                                                            {item.call_type}
                                                        </Badge>
                                                    </Td>
                                                    <Td className="text-right">
                                                        <div className="flex justify-end gap-1 px-2">
                                                            <ActionBtn icon={Eye} className="bg-[#4F39F6]" onClick={() => { setSelectedLog(item); setIsViewDialogOpen(true); }} />
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
                                    Showing {logs.length > 0 ? 1 : 0} to {logs.length} of {logs.length} entries
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
                            This action cannot be undone. This will permanently delete the phone call log.
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
                        <AlertDialogTitle>Bulk Delete Logs</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {selectedIds.length} selected phone call logs? This action cannot be undone.
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
                            Phone Call Log Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                            <DetailItem label="Name" value={selectedLog?.name} />
                            <DetailItem label="Phone" value={selectedLog?.phone} />
                            <DetailItem label="Date" value={selectedLog?.date ? new Date(selectedLog.date).toLocaleDateString() : "-"} />
                            <DetailItem label="Next Follow Up Date" value={selectedLog?.next_follow_up_date ? new Date(selectedLog.next_follow_up_date).toLocaleDateString() : "-"} />
                            <DetailItem label="Call Duration" value={selectedLog?.call_duration} />
                            <DetailItem label="Call Type" value={selectedLog?.call_type} isBadge />
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                                <p className="text-sm text-slate-700 bg-muted/30 p-3 rounded-lg border border-muted/50 min-h-[60px]">
                                    {selectedLog?.description || "No description provided"}
                                </p>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Note</label>
                                <p className="text-sm text-slate-700 bg-muted/30 p-3 rounded-lg border border-muted/50 min-h-[60px]">
                                    {selectedLog?.note || "No note provided"}
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

function DetailItem({ label, value, isBadge }: { label: string, value: string | null | undefined, isBadge?: boolean }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
            <div className="h-10 flex items-center px-3 bg-muted/30 rounded-lg border border-muted/50">
                {isBadge ? (
                    <Badge variant={value === "Incoming" ? "default" : "secondary"} className="text-[10px]">
                        {value || "-"}
                    </Badge>
                ) : (
                    <span className="text-sm font-semibold text-slate-700">{value || "-"}</span>
                )}
            </div>
        </div>
    );
}
