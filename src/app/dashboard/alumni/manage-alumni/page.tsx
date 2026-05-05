"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    LayoutList,
    Menu as MenuIcon,
    ArrowUpDown,
    FileSearch,
    Plus,
    X,
    FileJson,
    Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface Alumni {
    id: string;
    admission_no: string;
    name: string;
    gender: string;
    email: string;
    phone: string;
    school_class?: { name: string };
    section?: { name: string };
    academic_session?: { session: string };
}

import { useRouter } from "next/navigation";
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

// ... existing code ...

export default function ManageAlumniPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [viewType, setViewType] = useState<"list" | "details">("list");
    const [searchTerm, setSearchTerm] = useState("");
    
    // Data states
    const [alumni, setAlumni] = useState<Alumni[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Action states
    const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // ... existing code ...

    const handleView = (student: Alumni) => {
        setSelectedAlumni(student);
        setIsViewDialogOpen(true);
    };

    const handleEdit = (student: Alumni) => {
        toast({
            title: "Redirecting",
            description: `Redirecting to edit profile for ${student.name}...`,
        });
        // router.push(`/dashboard/student-information/student-admission?edit=${student.id}`);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/students/${deleteId}`);
            setAlumni(alumni.filter(a => a.id.toString() !== deleteId.toString()));
            toast({
                title: "Success",
                description: "Alumni record deleted successfully.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete alumni record.",
                variant: "destructive",
            });
        } finally {
            setDeleteId(null);
        }
    };
    
    // Criteria Options
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    
    // Filter State
    const [filters, setFilters] = useState({
        session_id: "",
        class_id: "",
        section_id: "all",
        admission_no: ""
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        try {
            const [classesData, sessionsData] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/system-setting/sessions")
            ]);
            setClasses(classesData.data.data || []);
            setSessions(sessionsData.data.data || []);
        } catch (error) {
            console.error("Failed to load criteria");
        }
    };

    const handleClassChange = (classId: string) => {
        setFilters({ ...filters, class_id: classId, section_id: "all" });
        const selectedCls = classes.find(c => c.id.toString() === classId);
        setSections(selectedCls?.sections || []);
    };

    const handleSearch = async (isByAdmissionNo = false) => {
        if (isByAdmissionNo) {
            if (!filters.admission_no) {
                toast({ title: "Error", description: "Please enter an admission number.", variant: "destructive" });
                return;
            }
        } else {
            if (!filters.session_id || !filters.class_id) {
                toast({ title: "Error", description: "Session and Class are required.", variant: "destructive" });
                return;
            }
        }

        setLoading(true);
        try {
            const params = isByAdmissionNo 
                ? { admission_no: filters.admission_no }
                : { 
                    session_id: filters.session_id, 
                    class_id: filters.class_id, 
                    section_id: filters.section_id === "all" ? "" : filters.section_id 
                };

            const response = await api.get("/alumni/manage", { params });
            setAlumni(response.data.data || []);
            setCurrentPage(1);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch alumni data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Derived Data
    const filteredAlumni = alumni.filter(a => 
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.admission_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalEntries = filteredAlumni.length;
    const itemsPerPageNum = parseInt(itemsPerPage);
    const totalPages = Math.ceil(totalEntries / itemsPerPageNum);
    const startIndex = (currentPage - 1) * itemsPerPageNum;
    const paginatedData = filteredAlumni.slice(startIndex, startIndex + itemsPerPageNum);

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800 tracking-tight">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5 flex-1">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            Pass Out Session <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Select value={filters.session_id} onValueChange={(val) => setFilters({...filters, session_id: val})}>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {sessions.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.session}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5 flex-1">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            Class <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Select value={filters.class_id} onValueChange={handleClassChange}>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5 flex-1">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                        <Select value={filters.section_id} onValueChange={(val) => setFilters({...filters, section_id: val})}>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex md:block">
                        <Button onClick={() => handleSearch(false)} disabled={loading} className="w-full md:w-auto bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-xs font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-50 flex items-center gap-4">
                    <div className="flex-1 space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search By Admission Number</Label>
                        <Input 
                            value={filters.admission_no}
                            onChange={(e) => setFilters({...filters, admission_no: e.target.value})}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(true)}
                            placeholder="Search By Admission Number" 
                            className="h-8 border-gray-200 text-[11px] rounded shadow-none focus-visible:ring-indigo-500" 
                        />
                    </div>
                    <Button onClick={() => handleSearch(true)} disabled={loading} className="mt-5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-xs font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Search
                    </Button>
                </div>
            </div>

            {/* Alumni List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                {/* Tabs for View Mode */}
                <div className="flex items-center gap-1 border-b border-gray-100 pb-0.5">
                    <Button
                        variant="ghost"
                        onClick={() => setViewType("list")}
                        className={cn(
                            "h-8 px-3 rounded-none border-b-2 text-[10px] font-bold uppercase tracking-tight gap-1.5 transition-all outline-none focus-visible:ring-0",
                            viewType === "list" ? "border-indigo-500 text-indigo-500 bg-indigo-50/10" : "border-transparent text-gray-400 hover:text-gray-600"
                        )}
                    >
                        <LayoutList className="h-3.5 w-3.5" />
                        List View
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setViewType("details")}
                        className={cn(
                            "h-8 px-3 rounded-none border-b-2 text-[10px] font-bold uppercase tracking-tight gap-1.5 transition-all outline-none focus-visible:ring-0",
                            viewType === "details" ? "border-indigo-500 text-indigo-500 bg-indigo-50/10" : "border-transparent text-gray-400 hover:text-gray-600"
                        )}
                    >
                        <Columns className="h-3.5 w-3.5" />
                        Details View
                    </Button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Rows</span>
                            <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 shadow-none rounded font-semibold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            {[Copy, FileSpreadsheet, FileJson, FileText, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Admission No <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Student Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Class <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Gender <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Current Email <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Current Phone <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center text-gray-500 font-medium">
                                        Searching records...
                                    </TableCell>
                                </TableRow>
                            ) : paginatedData.length === 0 ? (
                                <TableRow className="hover:bg-transparent h-64">
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                            <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                            <div className="relative">
                                                <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                    <FileSearch className="h-8 w-8 text-gray-200" />
                                                </div>
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                    <Plus className="h-3 w-3 text-indigo-300" />
                                                </div>
                                            </div>
                                            <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                <span className="text-lg">←</span> Search with criteria to view alumni.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map(student => (
                                    <TableRow key={student.id} className="hover:bg-gray-50/50">
                                        <TableCell className="py-3 px-4 font-medium text-indigo-600">{student.admission_no}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-700">{student.name}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{student.school_class?.name} {student.section?.name}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{student.gender}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{student.email}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{student.phone}</TableCell>
                                        <TableCell className="py-3 px-4 pr-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button onClick={() => handleView(student)} size="icon" className="h-7 w-7 rounded-md bg-[#10b981] hover:bg-[#059669] text-white shadow-sm">
                                                    <MenuIcon className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button onClick={() => handleEdit(student)} size="icon" className="h-7 w-7 rounded-md bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-sm">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button onClick={() => setDeleteId(student.id)} size="icon" className="h-7 w-7 rounded-md bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-sm">
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer / Pagination */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
                    <div>
                        {totalEntries > 0 ? (
                            `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPageNum, totalEntries)} of ${totalEntries} entries`
                        ) : (
                            "Showing 0 to 0 of 0 entries"
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-xl border-gray-100 shadow-sm text-gray-400 hover:text-gray-600 bg-white"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <Button
                                key={i}
                                variant={currentPage === i + 1 ? "default" : "outline"}
                                className={cn(
                                    "h-8 min-w-[32px] rounded-xl text-xs font-bold transition-all shadow-sm",
                                    currentPage === i + 1 
                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-indigo-500/30 border-0" 
                                        : "bg-white border-gray-100 text-gray-500 hover:text-gray-700"
                                )}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </Button>
                        ))}
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 rounded-xl border-gray-100 shadow-sm text-gray-400 hover:text-gray-600 bg-white"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Action Dialogs */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="rounded bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this alumni record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded font-bold text-xs h-9">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 rounded font-bold text-xs h-9 text-white">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 rounded bg-white overflow-hidden">
                    <DialogHeader className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                        <DialogTitle className="text-lg font-bold text-indigo-900">Alumni Details</DialogTitle>
                    </DialogHeader>
                    {selectedAlumni && (
                        <div className="p-6 space-y-4 text-sm text-gray-700">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Admission No</span>
                                    <p className="font-semibold text-gray-800">{selectedAlumni.admission_no || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Student Name</span>
                                    <p className="font-semibold text-gray-800">{selectedAlumni.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Class & Section</span>
                                    <p className="font-semibold text-gray-800">{selectedAlumni.school_class?.name || 'N/A'} - {selectedAlumni.section?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Pass Out Session</span>
                                    <p className="font-semibold text-gray-800">{selectedAlumni.academic_session?.session || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Gender</span>
                                    <p className="font-semibold text-gray-800">{selectedAlumni.gender || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Contact Email</span>
                                    <p className="font-semibold text-gray-800">{selectedAlumni.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">Contact Phone</span>
                                    <p className="font-semibold text-gray-800">{selectedAlumni.phone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
