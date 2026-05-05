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
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-black tracking-tight text-slate-700 uppercase">Incident Protocol Registry</CardTitle>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Institutional behavioural incident classification matrix</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setOpen(true); }}
                        className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[10px] font-bold uppercase gap-2 shadow-lg active:scale-95 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Index Incident
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-6 flex items-center gap-6 border-b border-muted/20">
                        <div className="relative w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter incident protocols..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 rounded-xl bg-white border-muted/50 focus-visible:ring-indigo-500/20 text-[10px] font-bold uppercase tracking-[0.2em] shadow-none"
                            />
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Page Density:</span>
                            <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(parseInt(val))}>
                                <SelectTrigger className="h-10 w-24 text-[10px] font-bold bg-white border-muted/50 rounded-xl uppercase tracking-widest">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100">
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
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 pl-8">Protocol Title</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 text-center w-[120px]">Point Value</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 w-[50%]">Protocol Description</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-[0.2em] py-5 pr-8 text-right">Utility</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Incident Registry...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : incidents.length === 0 ? (
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableCell colSpan={4} className="h-[300px] text-center">
                                            <div className="flex flex-col items-center justify-center gap-6 text-muted-foreground/50">
                                                <div className="p-8 rounded-[2.5rem] bg-rose-50/50 text-rose-400 transform rotate-6 shadow-inner">
                                                    <FolderOpen className="h-16 w-16 opacity-30" />
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500/60 bg-rose-50 px-6 py-2 rounded-full border border-rose-100">
                                                        No incident protocols indexed
                                                    </span>
                                                    <p className="text-[9px] uppercase font-black text-gray-400 tracking-tighter italic">
                                                        Use the "Index Incident" action to classify a new behavioural protocol.
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    incidents.map((incident, index) => (
                                        <TableRow key={incident.id} className={cn(
                                            "hover:bg-rose-50/10 border-b border-muted/10 transition-colors group",
                                            index % 2 === 0 ? 'bg-white' : 'bg-muted/5'
                                        )}>
                                            <TableCell className="py-5 pl-8">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-xl flex items-center justify-center shadow-inner",
                                                        incident.point >= 0 ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                                                    )}>
                                                        {incident.point >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                    </div>
                                                    <span className="text-slate-700 text-[11px] font-black uppercase tracking-tight">{incident.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 text-center">
                                                <span className={cn(
                                                    "px-4 py-1.5 rounded-full font-black text-[10px] border shadow-sm tabular-nums uppercase tracking-widest",
                                                    incident.point >= 0
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                                )}>
                                                    {incident.point >= 0 ? '+' : ''}{incident.point}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-[10px] leading-relaxed py-5 font-bold">{incident.description}</TableCell>
                                            <TableCell className="pr-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                                                    <Button onClick={() => handleEdit(incident)} size="icon" className="h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-100 transition-all active:scale-90">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button onClick={() => setDeleteId(incident.id)} size="icon" className="h-8 w-8 rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-100 transition-all active:scale-90">
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
                        <span>Registry: {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} protocols</span>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                variant="outline" size="icon" className="h-9 w-9 rounded-lg border-muted/50 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="icon" className="h-9 w-9 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md font-bold">
                                {currentPage}
                            </Button>
                            <Button
                                onClick={() => setCurrentPage(p => p + 1)}
                                variant="outline" size="icon" className="h-9 w-9 rounded-lg border-muted/50 hover:bg-rose-50 hover:text-rose-600 transition-all"
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
                <DialogContent className="rounded-[2rem] border-0 shadow-2xl max-w-lg p-0 overflow-hidden bg-white">
                    <div className="bg-rose-500/5 p-8 border-b border-rose-100 flex items-center justify-between">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-gray-800 uppercase tracking-[0.2em] flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200">
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
                                className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-rose-500 shadow-none text-sm font-bold tracking-tight px-6"
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
                                    className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-rose-500 shadow-none text-sm font-bold tracking-tight px-6 flex-1"
                                />
                                <div className={cn(
                                    "h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors",
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
                                className="border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-rose-500 shadow-none text-sm font-bold tracking-tight px-6 py-4 resize-none"
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
                        <div className="h-16 w-16 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 mb-6 shadow-inner">
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
