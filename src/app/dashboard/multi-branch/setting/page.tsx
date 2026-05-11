"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
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
    Globe, Link, Building2, Save, RefreshCw, 
    ShieldCheck, AlertCircle, Info, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Branch {
    id: string;
    branch_name: string;
    branch_url: string;
}

export default function SettingPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalEntries, setTotalEntries] = useState(0);

    // Form State
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        branch_name: "",
        branch_url: ""
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchBranches();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const response = await api.get('/multi-branch/branches', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            setBranches(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch branches", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.branch_name || !formData.branch_url) {
            toast({ title: "Validation", description: "All fields are required", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/multi-branch/branches/${selectedId}`, formData);
                toast({ title: "Success", description: "Branch node updated" });
            } else {
                await api.post('/multi-branch/branches', formData);
                toast({ title: "Success", description: "New branch indexed" });
            }
            setOpen(false);
            resetForm();
            fetchBranches();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save branch node", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item: Branch) => {
        setEditMode(true);
        setSelectedId(item.id);
        setFormData({
            branch_name: item.branch_name,
            branch_url: item.branch_url
        });
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/multi-branch/branches/${deleteId}`);
            toast({ title: "Success", description: "Branch node expunged" });
            fetchBranches();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete branch", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormData({
            branch_name: "",
            branch_url: ""
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
                            <Globe className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold tracking-tight text-slate-700 uppercase">Branch Ecosystem</CardTitle>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 text-balance">Management of institutional multi-campus nodes</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => { resetForm(); setOpen(true); }}
                        className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[10px] font-bold uppercase gap-2 shadow-lg active:scale-95 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Add Node
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-6 flex items-center gap-6 border-b border-muted/20">
                        <div className="relative w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter institutional nodes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 rounded-lg bg-white border-muted/50 focus-visible:ring-indigo-500/20 text-[10px] font-bold uppercase tracking-[0.2em] shadow-none"
                            />
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Page Density:</span>
                            <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(parseInt(val))}>
                                <SelectTrigger className="h-10 w-24 text-[10px] font-bold bg-white border-muted/50 rounded-lg uppercase tracking-widest">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100">
                                    <SelectItem value="10">10 Rows</SelectItem>
                                    <SelectItem value="25">25 Rows</SelectItem>
                                    <SelectItem value="50">50 Rows</SelectItem>
                                    <SelectItem value="100">100 Rows</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20 bg-muted/5">
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-5 pl-8">Institutional Node</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-5">Node URL</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-5 pr-8 text-right">Protocol Utility</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Syncing Ecosystem Nodes...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : branches.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-32 text-center text-gray-400 text-[11px] font-bold uppercase tracking-widest italic">
                                            No institutional nodes indexed in the registry.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    branches.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-indigo-50/20 border-b border-muted/10 transition-colors group">
                                            <TableCell className="text-slate-700 text-sm py-5 pl-8 font-bold uppercase tracking-tight flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                {item.branch_name}
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <a 
                                                    href={item.branch_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 text-[11px] font-bold uppercase tracking-widest underline decoration-blue-200 underline-offset-4 hover:text-blue-800 transition-colors flex items-center gap-2 group/link"
                                                >
                                                    {item.branch_url}
                                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                </a>
                                            </TableCell>
                                            <TableCell className="pr-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                                                    <Button onClick={() => handleEdit(item)} size="icon" className="h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-100 transition-all active:scale-90">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button onClick={() => setDeleteId(item.id)} size="icon" className="h-8 w-8 rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-100 transition-all active:scale-90">
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

                    <div className="p-4 border-t border-muted/20 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Index: {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} node entries</span>
                        <div className="flex items-center gap-2">
                            <Button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                variant="outline" size="icon" className="h-9 w-9 rounded-lg border-muted/50 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="icon" className="h-9 w-9 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md font-bold">
                                {currentPage}
                            </Button>
                            <Button 
                                onClick={() => setCurrentPage(p => p + 1)}
                                variant="outline" size="icon" className="h-9 w-9 rounded-lg border-muted/50 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                disabled={branches.length < itemsPerPage}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="rounded-lg border-0 shadow-2xl max-w-lg p-0 overflow-hidden bg-white">
                    <div className="bg-indigo-500/5 p-8 border-b border-indigo-100 flex items-center justify-between">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-gray-800 uppercase tracking-[0.2em] flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                {editMode ? "Modify Node" : "Index New Node"}
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-10 grid grid-cols-1 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Node Identification <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.branch_name}
                                onChange={(e) => setFormData({...formData, branch_name: e.target.value})}
                                placeholder="e.g. Smart School - Campus Alpha"
                                className="h-14 border-gray-100 bg-gray-50/50 rounded-lg focus:ring-indigo-500 shadow-none text-sm font-bold tracking-tight px-6" 
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Access URL (Protocol Required) <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Input 
                                    value={formData.branch_url}
                                    onChange={(e) => setFormData({...formData, branch_url: e.target.value})}
                                    placeholder="https://campus-alpha.ischool.io"
                                    className="h-14 border-gray-100 bg-gray-50/50 rounded-lg focus:ring-indigo-500 shadow-none px-6 text-sm font-bold tracking-tight pr-12" 
                                />
                                <Link className="absolute right-5 top-4.5 h-5 w-5 text-gray-300" />
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter italic px-2 leading-relaxed">
                                * Ensure the institutional protocol matches the indexed security certificate.
                            </p>
                        </div>
                    </div>

                    <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="h-12 px-8 rounded-full text-[10px] font-bold uppercase tracking-widest">Discard</Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={submitting}
                            className="btn-gradient text-white px-12 h-12 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex gap-3 active:scale-95"
                        >
                            {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Commit Node
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-10">
                    <AlertDialogHeader>
                        <div className="h-16 w-16 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 mb-6 shadow-inner">
                            <ShieldCheck className="h-8 w-8 text-rose-400/50" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-gray-800 uppercase tracking-tight">Expunge Institutional Node</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-4">
                            Are you sure you want to permanently de-index this campus node? This action will invalidate all cross-branch redirection protocols and synchronization paths for this specific node.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-10 gap-4">
                        <AlertDialogCancel className="h-12 px-8 rounded-full text-[10px] font-bold uppercase tracking-widest border-gray-100">Cancel Protocol</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-12 px-10 rounded-full text-[10px] font-bold uppercase tracking-widest border-0 shadow-xl shadow-rose-200 active:scale-95 transition-all">
                            Confirm Expunge
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
