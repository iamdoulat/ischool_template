"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ChevronLeft, ChevronRight, Search, Pencil, Trash2,
    Tag, Loader2, FolderOpen, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface HolidayType {
    id: string;
    name: string;
}

const PAGE_SIZES = ["10", "25", "50", "100"];

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <Skeleton className="h-4 rounded" style={{ width: `${50 + ((i * 5 + j * 11) % 40)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function HolidayTypePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [holidayTypes, setHolidayTypes] = useState<HolidayType[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [totalEntries, setTotalEntries] = useState(0);

    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "" });
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchHolidayTypes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/annual-calendar/holiday-types', {
                params: { page: currentPage, per_page: itemsPerPage, search: searchTerm },
            });
            if (response.data && response.data.data) {
                setHolidayTypes(response.data.data || []);
                setTotalEntries(response.data.total || 0);
            } else {
                setHolidayTypes(response.data || []);
                setTotalEntries(response.data.length || 0);
            }
        } catch {
            toast.error("Failed to load holiday types");
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm]);

    useEffect(() => { fetchHolidayTypes(); }, [fetchHolidayTypes]);

    const handleSave = async () => {
        if (!formData.name) {
            toast.error("Name is required"); return;
        }
        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/annual-calendar/holiday-types/${selectedId}`, formData);
                toast.success("Holiday type updated");
            } else {
                await api.post('/annual-calendar/holiday-types', formData);
                toast.success("Holiday type created");
            }
            resetForm(); fetchHolidayTypes();
        } catch {
            toast.error("Failed to save holiday type");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (type: HolidayType) => {
        setFormData({ name: type.name });
        setSelectedId(type.id);
        setEditMode(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/annual-calendar/holiday-types/${deleteId}`);
            toast.success("Holiday type deleted");
            fetchHolidayTypes();
        } catch {
            toast.error("Failed to delete holiday type");
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormData({ name: "" });
        setEditMode(false);
        setSelectedId(null);
    };

    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left: Form */}
                <div className="lg:col-span-1">
                    <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                        <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    {editMode ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                </span>
                                <CardTitle className="text-base font-bold text-slate-800 leading-none">
                                    {editMode ? "Edit Holiday Type" : "Add Holiday Type"}
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">Name <span className="text-red-500">*</span></Label>
                                <Input value={formData.name} onChange={e => setFormData({ name: e.target.value })} placeholder="Enter holiday type name" className="h-9 text-xs" />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                {editMode && (
                                    <Button variant="outline" onClick={resetForm} className="h-9 px-4 text-xs font-bold">Cancel</Button>
                                )}
                                <Button onClick={handleSave} disabled={submitting} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95">
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editMode ? "Update" : "Save")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Table */}
                <div className="lg:col-span-2">
                    <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                        <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <Tag className="h-5 w-5" />
                                </span>
                                <div>
                                    <CardTitle className="text-base font-bold text-slate-800 leading-none">Holiday Types</CardTitle>
                                    <p className="text-[11px] text-gray-500 mt-1">Categories for annual calendar entries</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            {/* Toolbar */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input placeholder="Search types..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Show</span>
                                    <Select value={itemsPerPage} onValueChange={v => { setItemsPerPage(v); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-9 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {PAGE_SIZES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="rounded-md border overflow-x-auto">
                                <Table className="min-w-[400px]">
                                    <TableHeader className="bg-gray-50 text-xs uppercase">
                                        <TableRow className="hover:bg-transparent whitespace-nowrap">
                                            <TableHead className="font-semibold text-gray-600">Name</TableHead>
                                            <TableHead className="font-semibold text-gray-600 text-right w-[100px]">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? <TableSkeleton cols={2} /> : holidayTypes.length === 0 ? (
                                            <TableRow><TableCell colSpan={2} className="py-14 text-center"><div className="flex flex-col items-center gap-2 text-gray-400"><FolderOpen className="h-8 w-8 opacity-40" /><span className="text-xs">No holiday types found.</span></div></TableCell></TableRow>
                                        ) : holidayTypes.map((item, idx) => (
                                            <TableRow key={item.id || idx} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                <TableCell className="py-3 font-medium text-gray-800">{item.name}</TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button onClick={() => handleEdit(item)} size="sm" className="h-7 w-7 p-0 rounded bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-95"><Pencil className="h-4 w-4" /></Button>
                                                        <Button onClick={() => setDeleteId(item.id)} size="sm" className="h-7 w-7 p-0 rounded bg-red-500 hover:bg-red-600 text-white shadow-sm active:scale-95"><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
                                <div>Showing {totalEntries > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries</div>
                                {totalPages > 1 && (
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, safePage - 3), safePage + 2).map(page => (
                                            <Button key={page} size="sm" onClick={() => setCurrentPage(page)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold", safePage === page ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200")}>{page}</Button>
                                        ))}
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Holiday Type</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. Deleting this type may affect associated calendar entries.</AlertDialogDescription>
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
