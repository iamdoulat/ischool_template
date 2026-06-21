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
import { Textarea } from "@/components/ui/textarea";
import {
    Plus, Search, Pencil, Trash2, Save, RefreshCw,
    ShieldAlert, ChevronLeft, ChevronRight, FolderOpen,
    TrendingUp, TrendingDown, Info, ShieldCheck
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Incident {
    id: string;
    title: string;
    point: number;
    description: string;
}

export default function IncidentsPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [incidents, setIncidents] = useState<Incident[]>([]);
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
        title: "",
        point: 0,
        description: ""
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchIncidents();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const response = await api.get('/behaviour/incidents', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            setIncidents(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch incident registry", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title) {
            toast({ title: "Validation", description: "Incident title is required", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/behaviour/incidents/${selectedId}`, formData);
                toast({ title: "Success", description: "Incident protocol updated" });
            } else {
                await api.post('/behaviour/incidents', formData);
                toast({ title: "Success", description: "New incident indexed" });
            }
            setOpen(false);
            resetForm();
            fetchIncidents();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save incident record", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item: Incident) => {
        setEditMode(true);
        setSelectedId(item.id);
        setFormData({
            title: item.title,
            point: item.point,
            description: item.description || ""
        });
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/behaviour/incidents/${deleteId}`);
            toast({ title: "Success", description: "Incident protocol expunged" });
            fetchIncidents();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete incident", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormData({ title: "", point: 0, description: "" });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 gap-0 text-slate-800">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ShieldAlert className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Incidents</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">Manage behaviour incident types and their points</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setOpen(true); }}
                        className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                        Add Incident
                    </Button>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search incidents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Show</span>
                            <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(parseInt(val))}>
                                <SelectTrigger className="h-9 w-[70px] text-xs">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[640px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600">Incident</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center w-[110px]">Points</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Description</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right w-[100px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <TableRow key={i} className="text-xs">
                                            <TableCell className="py-3"><div className="flex items-center gap-2.5"><Skeleton className="h-7 w-7 rounded-md" /><Skeleton className="h-3.5 w-36 rounded" /></div></TableCell>
                                            <TableCell className="text-center"><Skeleton className="h-6 w-12 rounded-full mx-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-3.5 w-full max-w-xs rounded" /></TableCell>
                                            <TableCell className="text-right"><div className="flex justify-end gap-1"><Skeleton className="h-7 w-7 rounded" /><Skeleton className="h-7 w-7 rounded" /></div></TableCell>
                                        </TableRow>
                                    ))
                                ) : incidents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="px-4 py-14 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                                <FolderOpen className="h-10 w-10 opacity-30" />
                                                <p className="text-xs font-semibold text-gray-500">No incidents found</p>
                                                <p className="text-[11px] text-gray-400">Click &ldquo;Add Incident&rdquo; to create your first incident type.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    incidents.map((incident) => (
                                        <TableRow key={incident.id} className="text-xs hover:bg-gray-50/60 transition-colors group">
                                            <TableCell className="py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={cn(
                                                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                                                        incident.point >= 0 ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                                                    )}>
                                                        {incident.point >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                    </span>
                                                    <span className="text-gray-800 font-semibold">{incident.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border tabular-nums",
                                                    incident.point >= 0
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                                )}>
                                                    {incident.point >= 0 ? '+' : ''}{incident.point}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 max-w-md">
                                                <span className="line-clamp-2">{incident.description}</span>
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button onClick={() => handleEdit(incident)} size="sm" className="h-7 w-7 p-0 rounded bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-95 transition-all">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button onClick={() => setDeleteId(incident.id)} size="sm" className="h-7 w-7 p-0 rounded bg-red-500 hover:bg-red-600 text-white shadow-sm active:scale-95 transition-all">
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

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
                        <div>
                            Showing {totalEntries === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries
                        </div>
                        <div className="flex gap-1 items-center">
                            <Button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                variant="outline" size="sm" className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="sm" className="h-8 w-8 p-0 rounded-[10px] text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md">
                                {currentPage}
                            </Button>
                            <Button
                                onClick={() => setCurrentPage(p => p + 1)}
                                variant="outline" size="sm" className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                                disabled={incidents.length < itemsPerPage}
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
                    <div className="bg-rose-500/5 p-8 border-b border-rose-100 flex items-center justify-between">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-gray-800 uppercase tracking-[0.2em] flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                                {editMode ? "Modify Protocol" : "Index New Protocol"}
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-10 grid grid-cols-1 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Incident Classification <span className="text-red-500">*</span></Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="e.g. Harassment and bullying"
                                className="h-14 border-gray-100 bg-gray-50/50 rounded-lg focus:ring-rose-500 shadow-none text-sm font-bold tracking-tight px-6"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Point Value <span className="text-red-500">*</span></Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="number"
                                    value={formData.point}
                                    onChange={(e) => setFormData({...formData, point: parseInt(e.target.value) || 0})}
                                    placeholder="e.g. -10 or 20"
                                    className="h-14 border-gray-100 bg-gray-50/50 rounded-lg focus:ring-rose-500 shadow-none text-sm font-bold tracking-tight px-6 flex-1"
                                />
                                <div className={cn(
                                    "h-14 w-14 rounded-lg flex items-center justify-center shadow-inner transition-colors",
                                    formData.point >= 0 ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                                )}>
                                    {formData.point >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                </div>
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter italic px-2 leading-relaxed flex items-center gap-1">
                                <Info className="h-3 w-3" /> Use negative values for infractions, positive for commendations.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Protocol Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Describe this incident classification in detail..."
                                rows={4}
                                className="border-gray-100 bg-gray-50/50 rounded-lg focus:ring-rose-500 shadow-none text-sm font-bold tracking-tight px-6 py-4 resize-none"
                            />
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
                            Commit Protocol
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-10">
                    <AlertDialogHeader>
                        <div className="h-16 w-16 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 mb-6 shadow-inner">
                            <ShieldCheck className="h-8 w-8 text-rose-400/50" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-gray-800 uppercase tracking-tight">Expunge Incident Protocol</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-4">
                            Are you sure you want to permanently de-index this incident classification? This action will remove it from all future behavioural tracking and reporting matrices.
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
