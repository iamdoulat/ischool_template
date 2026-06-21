"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight,
    Globe, Link as LinkIcon, Building2, Loader2, ExternalLink, Copy, FileSpreadsheet, FileText, Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Branch {
    id: string;
    branch_name: string;
    branch_url: string;
}

const TABLE_COLS = 3;

function SkeletonRows({ rows = 5 }: { rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: TABLE_COLS }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <div className="h-3 rounded bg-gray-200/70 animate-pulse" style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function SettingPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalEntries, setTotalEntries] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ branch_name: "", branch_url: "" });
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchBranches = async (page = currentPage) => {
        setLoading(true);
        try {
            const response = await api.get("/multi-branch/branches", {
                params: { page, per_page: itemsPerPage, search: searchTerm },
            });
            setBranches(response.data.data || []);
            setTotalEntries(response.data.total || 0);
            setLastPage(response.data.last_page || 1);
        } catch {
            toast({ title: "Error", description: "Failed to fetch branches", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, itemsPerPage]);

    const handleSave = async () => {
        if (!formData.branch_name || !formData.branch_url) {
            toast({ title: "Validation", description: "All fields are required", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/multi-branch/branches/${selectedId}`, formData);
                toast({ title: "Success", description: "Branch updated" });
            } else {
                await api.post("/multi-branch/branches", formData);
                toast({ title: "Success", description: "Branch created" });
            }
            setOpen(false);
            resetForm();
            fetchBranches(currentPage);
        } catch {
            toast({ title: "Error", description: "Failed to save branch", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item: Branch) => {
        setEditMode(true);
        setSelectedId(item.id);
        setFormData({ branch_name: item.branch_name, branch_url: item.branch_url });
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/multi-branch/branches/${deleteId}`);
            toast({ title: "Success", description: "Branch deleted" });
            fetchBranches(currentPage);
        } catch {
            toast({ title: "Error", description: "Failed to delete branch", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormData({ branch_name: "", branch_url: "" });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(branches.map((b) => `${b.branch_name}\t${b.branch_url}`).join("\n"));
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };
    const handleExportCSV = () => {
        const rows = [["Branch Name", "Branch URL"], ...branches.map((b) => [b.branch_name, b.branch_url])];
        const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "branches.csv";
        link.click();
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
    ];

    const from = totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const to = Math.min(currentPage * itemsPerPage, totalEntries);

    return (
        <div className="space-y-6">
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Globe className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Branch Settings</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{totalEntries} campus branch{totalEntries === 1 ? "" : "es"} registered</p>
                        </div>
                    </div>
                    <Button onClick={() => { resetForm(); setOpen(true); }} className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                        <Plus className="h-4 w-4" /> Add Branch
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <form onSubmit={(e) => { e.preventDefault(); setCurrentPage(1); fetchBranches(1); }} className="flex items-center gap-2 w-full md:w-auto">
                            <Input placeholder="Search branches..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-3 h-9 text-xs w-full md:w-64" />
                            <Button type="submit" className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                                <Search className="h-4 w-4" /> Search
                            </Button>
                        </form>
                        <div className="flex items-center gap-2">
                            <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(parseInt(val)); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[70px] h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>{["10", "25", "50", "100"].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                            </Select>
                            <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                {toolbarActions.map((a, i) => (
                                    <Button key={i} variant="ghost" size="icon" onClick={a.onClick} title={a.title} className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"><a.Icon className="h-4 w-4" /></Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[560px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600">Branch Name</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Branch URL</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows />
                                ) : branches.length === 0 ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">No branches found</TableCell></TableRow>
                                ) : branches.map((item) => (
                                    <TableRow key={item.id} className="text-xs hover:bg-gray-50/60 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500"><Building2 className="h-4 w-4" /></span>
                                                <span className="font-medium text-gray-700">{item.branch_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <a href={item.branch_url} target="_blank" rel="noopener noreferrer" className="text-[#6366f1] font-medium hover:underline inline-flex items-center gap-1.5">
                                                {item.branch_url}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button onClick={() => handleEdit(item)} size="icon" title="Edit" className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Pencil className="h-3.5 w-3.5" /></Button>
                                                <Button onClick={() => setDeleteId(item.id)} size="icon" title="Delete" className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Trash2 className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                        <div>Showing {from} to {to} of {totalEntries} entries</div>
                        <div className="flex gap-1 items-center">
                            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                            {[...Array(lastPage)].map((_, i) => (
                                <Button key={i + 1} size="sm" onClick={() => setCurrentPage(i + 1)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all", currentPage === i + 1 ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200")}>{i + 1}</Button>
                            ))}
                            <Button variant="outline" size="sm" disabled={currentPage >= lastPage} onClick={() => setCurrentPage((p) => p + 1)} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white"><Building2 className="h-4 w-4" /></span>
                            {editMode ? "Edit Branch" : "Add Branch"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Branch Name <span className="text-red-500">*</span></Label>
                            <Input value={formData.branch_name} onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })} placeholder="e.g. Smart School - Campus Alpha" className="h-9 text-xs" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Branch URL <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Input value={formData.branch_url} onChange={(e) => setFormData({ ...formData, branch_url: e.target.value })} placeholder="https://campus-alpha.ischool.io" className="h-9 text-xs pr-10" />
                                <LinkIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-300" />
                            </div>
                            <p className="text-[10px] text-gray-400 italic">Include the full protocol (https://).</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} className="h-9 px-5 text-xs">Cancel</Button>
                        <Button onClick={handleSave} disabled={submitting} className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}{editMode ? "Update" : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Branch?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. The branch will be permanently removed from the registry.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
