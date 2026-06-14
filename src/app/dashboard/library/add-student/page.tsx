"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
    Plus,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    MoreVertical,
    Pencil,
    Trash2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";

interface StudentMember {
    id: number;
    name: string;
    admission_no: string;
    father_name: string;
    dob: string;
    gender: string;
    phone: string;
    school_class?: { name: string };
    section?: { name: string };
    library_member?: {
        id: number;
        member_id: string;
        library_card_no: string;
        active: boolean;
    };
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}



export default function AddStudentLibraryPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [students, setStudents] = useState<StudentMember[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState("50");

    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentMember | null>(null);
    const [memberFormData, setMemberFormData] = useState({
        library_card_no: "",
        member_id: ""
    });
    const [saving, setSaving] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<StudentMember | null>(null);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/academics/classes?no_paginate=true');
            setClasses(response.data.data ?? []);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const fetchSections = async (classId: string) => {
        if (!classId) return;
        try {
            const response = await api.get(`/academics/sections?school_class_id=${classId}&no_paginate=true`);
            setSections(response.data.data ?? []);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const fetchStudents = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/library/members?type=student&page=${page}&search=${searchTerm}&limit=${limit}&class_id=${selectedClass}&section_id=${selectedSection}`);
            setStudents(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching students:", error);
            toast({ title: "Error", description: "Failed to fetch student records", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchStudents();
    }, [limit]);

    useEffect(() => {
        if (selectedClass) {
            fetchSections(selectedClass);
        }
    }, [selectedClass]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStudents(1);
    };

    const handleAddMembership = (student: StudentMember) => {
        setSelectedStudent(student);
        setIsEditing(false);
        setMemberFormData({
            library_card_no: "",
            member_id: student.admission_no || ""
        });
        setIsDialogOpen(true);
    };

    const handleEditMembership = (student: StudentMember) => {
        setSelectedStudent(student);
        setIsEditing(true);
        setMemberFormData({
            library_card_no: student.library_member?.library_card_no || "",
            member_id: student.library_member?.member_id || ""
        });
        setIsDialogOpen(true);
    };

    const saveMembership = async () => {
        if (!memberFormData.member_id) {
            toast({ title: "Error", description: "Library Member ID is required", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            await api.post('/library/members', {
                user_id: selectedStudent?.id,
                member_type: 'student',
                ...memberFormData
            });
            toast({ title: "Success", description: "Library membership assigned successfully" });
            setIsDialogOpen(false);
            fetchStudents();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to assign membership",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const updateMembership = async () => {
        if (!memberFormData.member_id) {
            toast({ title: "Error", description: "Library Member ID is required", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            await api.put(`/library/members/${selectedStudent?.id}`, memberFormData);
            toast({ title: "Success", description: "Library membership updated successfully" });
            setIsDialogOpen(false);
            fetchStudents();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update membership",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleRevokeClick = (student: StudentMember) => {
        setDeleteTarget(student);
        setIsDeleteDialogOpen(true);
    };

    const confirmRevoke = async () => {
        if (!deleteTarget) return;
        try {
            await api.delete(`/library/members/${deleteTarget.id}`);
            toast({ title: "Success", description: "Membership revoked successfully" });
            setIsDeleteDialogOpen(false);
            setDeleteTarget(null);
            fetchStudents();
        } catch (error) {
            toast({ title: "Error", description: "Failed to revoke membership", variant: "destructive" });
        }
    };

    const handleCopy = () => {
        const text = students.map(s => `${s.name}\t${s.admission_no}\t${s.library_member ? 'Member' : 'Not Member'}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };

    const handleExportCSV = () => {
        const headers = ["Name", "Admission No", "Class", "Member ID", "Card No", "Status"];
        const rows = students.map(s => [s.name, s.admission_no, `${s.school_class?.name}(${s.section?.name})`, s.library_member?.member_id || "-", s.library_member?.library_card_no || "-", s.library_member ? 'Active' : 'Inactive']);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "library_students.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            {/* Select Criteria Section */}
             <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800 border-b pb-2">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Class <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">Section</Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map((sec) => (
                                    <SelectItem key={sec.id} value={String(sec.id)}>{sec.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button onClick={() => fetchStudents(1)} className="btn-gradient gap-2 h-8 px-6 text-[11px] font-bold uppercase transition-all rounded shadow-sm">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            {/* Student Members List Section */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                <h2 className="text-sm font-medium text-gray-800">Student Members List</h2>

                 {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-4">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-fit">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-9 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/50"
                            />
                        </div>
                        <Button type="submit" className="btn-gradient h-9 px-6 text-[11px] font-bold flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </form>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 bg-transparent shadow-none rounded-md px-2 flex gap-1 items-center justify-between">
                                    <SelectValue />
                                    <ChevronLeft className="h-2 w-2 text-gray-400 rotate-90" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            {toolbarActions.map((action, i) => (
                                <Button 
                                    key={i} 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={action.onClick}
                                    title={action.title}
                                    className="h-7 w-7 hover:bg-gray-100 rounded"
                                >
                                    <action.Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* List Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1200px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Member ID <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Library Card No.</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Admission No</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Student Name</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Class <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Father Name</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Date Of Birth <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Gender <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Mobile Number</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {students.map((student) => (
                                <TableRow
                                    key={student.id}
                                    className={cn(
                                        "text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap",
                                        student.library_member && "bg-[#e8f5e9]/60 hover:bg-[#c8e6c9]/60" // Light green for members
                                    )}
                                >
                                    <TableCell className="py-3 text-gray-500">{student.library_member?.member_id || "-"}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{student.library_member?.library_card_no || "-"}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{student.admission_no}</TableCell>
                                    <TableCell className="py-3 text-gray-700 font-medium">{student.name}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{student.school_class?.name} ({student.section?.name})</TableCell>
                                    <TableCell className="py-3 text-gray-500">{student.father_name}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{student.dob ? formatDate(student.dob) : "-"}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{student.gender}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{student.phone || "-"}</TableCell>
                                    <TableCell className="py-3 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="text-xs">
                                                {student.library_member ? (
                                                    <>
                                                        <DropdownMenuItem onClick={() => handleEditMembership(student)}>
                                                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleRevokeClick(student)} className="text-red-500">
                                                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Revoke
                                                        </DropdownMenuItem>
                                                    </>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleAddMembership(student)}>
                                                        <Plus className="h-3.5 w-3.5 mr-2" /> Add
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                 {/* Footer / Pagination */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50">
                    <div>
                        Showing {pagination?.from || 0} to {pagination?.to || 0} of {pagination?.total || 0} entries
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pagination?.current_page === 1}
                            onClick={() => fetchStudents(pagination!.current_page - 1)}
                            className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {[...Array(pagination?.last_page || 0)].map((_, i) => (
                            <Button 
                                key={i + 1}
                                onClick={() => fetchStudents(i + 1)}
                                className={cn(
                                    "h-7 w-7 p-0 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300",
                                    pagination?.current_page === i + 1 
                                        ? "btn-gradient" 
                                        : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-100"
                                )}
                            >
                                {i + 1}
                            </Button>
                        ))}
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pagination?.current_page === pagination?.last_page}
                            onClick={() => fetchStudents(pagination!.current_page + 1)}
                            className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Add / Edit Membership Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-gray-800">{isEditing ? "Edit Library Member" : "Add Library Member"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Student Name</Label>
                                <Input value={selectedStudent?.name || ""} disabled className="h-9 bg-gray-50 border-gray-200 text-xs shadow-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Library Card No.</Label>
                                    <Input 
                                        value={memberFormData.library_card_no}
                                        onChange={(e) => setMemberFormData({ ...memberFormData, library_card_no: e.target.value })}
                                        className="h-9 border-gray-200 text-xs shadow-none"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                        Member ID <span className="text-red-500 font-bold">*</span>
                                    </Label>
                                    <Input 
                                        value={memberFormData.member_id}
                                        onChange={(e) => setMemberFormData({ ...memberFormData, member_id: e.target.value })}
                                        className="h-9 border-gray-200 text-xs shadow-none"
                                        placeholder="Required"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full" disabled={saving}>Cancel</Button>
                            <Button onClick={isEditing ? updateMembership : saveMembership} className="btn-gradient h-9 px-8 text-[11px] uppercase font-bold rounded-full" disabled={saving}>
                                {saving ? "Saving..." : isEditing ? "Update Member" : "Add Member"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Revoke Confirmation Dialog */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent className="sm:max-w-[400px]">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Membership</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to revoke library membership for <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmRevoke} className="bg-red-500 hover:bg-red-600 text-white">Revoke</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
