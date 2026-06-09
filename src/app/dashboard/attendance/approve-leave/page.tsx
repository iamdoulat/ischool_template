"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Pencil, X, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight, CheckCircle2, Loader2, Calendar, User, UserCheck, XCircle, UploadCloud, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface LeaveRequest {
    id: number;
    user: {
        id: number;
        name: string;
        admission_no: string;
        school_class: { id?: number; name: string };
        section: { id?: number; name: string };
        avatar?: string | null;
    };
    leave_type: { id?: number; name: string };
    apply_date: string;
    leave_from: string;
    leave_to: string;
    days: number;
    status: "Approved" | "Disapproved" | "Pending";
    admin_remark: string;
    reason: string;
    attachment?: string;
}

interface SchoolClass {
    id: number;
    name: string;
    sections?: { id: number; name: string }[];
}

export default function ApproveLeavePage() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [adminRemark, setAdminRemark] = useState("");
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Add Leave State
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [newLeaveClass, setNewLeaveClass] = useState("");
    const [newLeaveSection, setNewLeaveSection] = useState("");
    const [newLeaveSections, setNewLeaveSections] = useState<{ id: number; name: string }[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [newLeaveStudent, setNewLeaveStudent] = useState("");
    const [newLeaveType, setNewLeaveType] = useState("");
    const [newLeaveApplyDate, setNewLeaveApplyDate] = useState(new Date().toISOString().split('T')[0]);
    const [newLeaveFromDate, setNewLeaveFromDate] = useState("");
    const [newLeaveToDate, setNewLeaveToDate] = useState("");
    const [newLeaveReason, setNewLeaveReason] = useState("");
    const [newLeaveStatus, setNewLeaveStatus] = useState("Pending");
    const [newLeaveAttachment, setNewLeaveAttachment] = useState<File | null>(null);
    const [savingLeave, setSavingLeave] = useState(false);
    const [editingLeaveId, setEditingLeaveId] = useState<number | null>(null);
    const [rowsPerPage, setRowsPerPage] = useState("50");

    useEffect(() => {
        fetchClasses();
        fetchLeaves();
        fetchLeaveTypes();
    }, []);

    const fetchLeaveTypes = async () => {
        try {
            const response = await api.get("/hr/leave-type");
            if (response.data.success) {
                setLeaveTypes(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching leave types:", error);
        }
    };

    useEffect(() => {
        if (selectedClass) {
            const cls = classes.find(c => c.id.toString() === selectedClass);
            setSections(cls?.sections || []);
            setSelectedSection("");
        }
    }, [selectedClass, classes]);

    useEffect(() => {
        if (newLeaveClass) {
            const cls = classes.find(c => c.id.toString() === newLeaveClass);
            setNewLeaveSections(cls?.sections || []);
            if (!editingLeaveId) {
                setNewLeaveSection("");
                setNewLeaveStudent("");
                setStudents([]);
            }
        }
    }, [newLeaveClass, classes]);

    useEffect(() => {
        if (newLeaveClass && newLeaveSection) {
            const fetchStudents = async () => {
                try {
                    const response = await api.get("/students", {
                        params: { school_class_id: newLeaveClass, section_id: newLeaveSection }
                    });
                    if (response.data.success) {
                        const rawData = response.data.data?.data || response.data.data;
                        if (Array.isArray(rawData)) {
                            setStudents(rawData);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching students:", error);
                }
            };
            fetchStudents();
        }
    }, [newLeaveClass, newLeaveSection]);

    const fetchClasses = async () => {
        try {
            const response = await api.get("/academics/classes?no_paginate=true");
            if (response.data.success) {
                setClasses(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const response = await api.get("/attendance/approve-leave", {
                params: {
                    school_class_id: selectedClass,
                    section_id: selectedSection,
                    search: searchTerm
                }
            });
            if (response.data.success) {
                setLeaves(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching leaves:", error);
            toast.error("Failed to load leave requests");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status: "Approved" | "Disapproved") => {
        if (!selectedLeave) return;

        setUpdatingStatus(true);
        try {
            const response = await api.put(`/attendance/approve-leave/${selectedLeave.id}/status`, {
                status,
                admin_remark: adminRemark
            });
            if (response.data.success) {
                toast.success(`Leave request ${status.toLowerCase()} successfully`);
                setStatusDialogOpen(false);
                fetchLeaves();
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this leave request?")) return;

        try {
            const response = await api.delete(`/attendance/approve-leave/${id}`);
            if (response.data.success) {
                toast.success("Leave request deleted successfully");
                fetchLeaves();
            }
        } catch (error) {
            console.error("Error deleting leave:", error);
            toast.error("Failed to delete leave request");
        }
    };

    const handleSaveLeave = async () => {
        if (!newLeaveStudent || !newLeaveType || !newLeaveApplyDate || !newLeaveFromDate || !newLeaveToDate || !newLeaveStatus) {
            toast.error("Please fill all required fields");
            return;
        }

        // Pre-check existing leave (skip when editing the same leave)
        if (!editingLeaveId) {
            try {
                const checkRes = await api.get("/attendance/approve-leave/check", {
                    params: {
                        user_id: newLeaveStudent,
                        leave_from: newLeaveFromDate,
                        leave_to: newLeaveToDate,
                    },
                });
                if (checkRes.data?.data?.exists) {
                    toast.error("This student already has a leave application in the selected date range.");
                    return;
                }
            } catch {
                // silently continue if check fails
            }
        }

        setSavingLeave(true);
        try {
            const formData = new FormData();
            formData.append('user_id', newLeaveStudent);
            formData.append('leave_type_id', newLeaveType);
            formData.append('apply_date', newLeaveApplyDate);
            formData.append('leave_from', newLeaveFromDate);
            formData.append('leave_to', newLeaveToDate);
            formData.append('status', newLeaveStatus);
            if (newLeaveReason) formData.append('reason', newLeaveReason);
            if (newLeaveAttachment) formData.append('attachment', newLeaveAttachment);

            let response;
            if (editingLeaveId) {
                formData.append('_method', 'PUT');
                response = await api.post(`/attendance/approve-leave/${editingLeaveId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                response = await api.post("/attendance/approve-leave", formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (response.data.success) {
                toast.success(editingLeaveId ? "Leave request updated successfully" : "Leave request created successfully");
                setAddDialogOpen(false);
                resetForm();
                fetchLeaves();
            }
        } catch (error: any) {
            console.error("Error saving leave:", error);
            toast.error(error?.response?.data?.message || "Failed to save leave request");
        } finally {
            setSavingLeave(false);
        }
    };

    const resetForm = () => {
        setEditingLeaveId(null);
        setNewLeaveClass("");
        setNewLeaveSection("");
        setNewLeaveStudent("");
        setNewLeaveType("");
        setNewLeaveApplyDate(new Date().toISOString().split('T')[0]);
        setNewLeaveFromDate("");
        setNewLeaveToDate("");
        setNewLeaveReason("");
        setNewLeaveStatus("Pending");
        setNewLeaveAttachment(null);
    };

    const handleEdit = (item: LeaveRequest) => {
        setEditingLeaveId(item.id);
        const classId = item.user.school_class?.id?.toString() || "";
        const sectionId = item.user.section?.id?.toString() || "";
        setNewLeaveClass(classId);
        // Set sections directly from the item's class data
        const cls = classes.find(c => c.id.toString() === classId);
        if (cls?.sections) setNewLeaveSections(cls.sections);
        setNewLeaveSection(sectionId);
        setNewLeaveStudent(item.user.id.toString());
        setNewLeaveType(item.leave_type.id.toString());
        // Format dates to YYYY-MM-DD for input[type=date]
        setNewLeaveApplyDate(item.apply_date?.substring(0, 10) || "");
        setNewLeaveFromDate(item.leave_from?.substring(0, 10) || "");
        setNewLeaveToDate(item.leave_to?.substring(0, 10) || "");
        setNewLeaveReason(item.reason || "");
        setNewLeaveStatus(item.status);
        setAddDialogOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Approved":
                return <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-none px-3 py-0.5 text-[9px] uppercase font-black rounded-full transition-all">Approved</Badge>;
            case "Disapproved":
                return <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-none px-3 py-0.5 text-[9px] uppercase font-black rounded-full transition-all">Disapproved</Badge>;
            default:
                return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-none px-3 py-0.5 text-[9px] uppercase font-black rounded-full transition-all">Pending</Badge>;
        }
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-800">Leave Management</h1>
                <Button
                    onClick={() => setAddDialogOpen(true)}
                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-6 h-9 text-xs font-bold uppercase transition-all rounded-full shadow-lg active:scale-95 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Apply Leave
                </Button>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mb-4 border-b border-gray-50 pb-2 flex items-center gap-2">
                    <Search className="h-3 w-3" />
                    Select Criteria
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class</Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(cls => (
                                    <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                            <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(sec => (
                                    <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button 
                        onClick={fetchLeaves}
                        disabled={loading}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-8 h-9 text-xs font-bold uppercase transition-all rounded-full shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Search
                    </Button>
                </div>
            </div>

            {/* Approve Leave List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-tight flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                        Approve Leave List
                    </h2>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-80">
                        <Input
                            placeholder="Search by student name or admission no..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyUp={(e) => e.key === 'Enter' && fetchLeaves()}
                            className="pl-4 h-10 text-xs border-gray-100 shadow-none rounded-full focus:ring-2 focus:ring-indigo-500/20 w-full transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                            <SelectTrigger className="w-[70px] h-10 text-xs border-gray-100 rounded-full">
                                <SelectValue placeholder="50" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                                <SelectItem value="500">500</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-full border border-gray-100">
                            {[Copy, FileSpreadsheet, FileText, Printer, Columns].map((Icon, idx) => (
                                <Button key={idx} variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:text-indigo-600 rounded-full transition-all">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-100 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent text-[10px] font-bold uppercase text-gray-500 bg-gray-50/50">
                                <TableHead className="py-4 px-6 w-12">Avatar</TableHead>
                                <TableHead className="py-4 px-6">Student</TableHead>
                                <TableHead className="py-4 px-6">Class/Section</TableHead>
                                <TableHead className="py-4 px-6">Leave Type</TableHead>
                                <TableHead className="py-4 px-6">Apply Date</TableHead>
                                <TableHead className="py-4 px-6">Duration</TableHead>
                                <TableHead className="py-4 px-6">Status</TableHead>
                                <TableHead className="py-4 px-6">Attach Document</TableHead>
                                <TableHead className="py-4 px-6 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                                    </TableCell>
                                </TableRow>
                            ) : leaves.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-32 text-center text-gray-400 text-xs italic">
                                        No leave requests found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leaves.slice(0, parseInt(rowsPerPage)).map((item) => (
                                    <TableRow key={item.id} className="text-sm border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                        <TableCell className="py-4 px-6">
                                            {item.user.avatar ? (
                                                <img
                                                    src={(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace('/api/v1', '/storage') + '/' + item.user.avatar}
                                                    alt=""
                                                    className="h-9 w-9 rounded-full object-cover border-2 border-gray-100"
                                                />
                                            ) : (
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                    {item.user.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.user.name}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">Adm: {item.user.admission_no}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-gray-700 font-semibold">{item.user.school_class.name}</span>
                                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                                <span className="text-gray-500 font-medium">{item.user.section.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-3 py-0.5 text-[9px] uppercase font-black rounded-full transition-all">
                                                {item.leave_type.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-gray-500 font-medium">
                                            {new Date(item.apply_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2 text-gray-800 font-bold">
                                                    <Calendar className="h-3 w-3 text-gray-400" />
                                                    {new Date(item.leave_from).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} - {new Date(item.leave_to).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                                </div>
                                                <span className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">{item.days} days duration</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            {getStatusBadge(item.status)}
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            {item.attachment ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace('/api/v1', '');
                                                        window.open(`${baseUrl}/${item.attachment}`, '_blank');
                                                    }}
                                                    className="h-7 w-7 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded p-0"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <span className="text-gray-300 text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {item.status === "Pending" && (
                                                        <Button
                                                            onClick={() => {
                                                                setSelectedLeave(item);
                                                                setAdminRemark(item.admin_remark || "");
                                                                setStatusDialogOpen(true);
                                                            }}
                                                            size="sm"
                                                            className="h-8 px-4 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white rounded-full text-[10px] font-black uppercase shadow-md transition-all active:scale-95"
                                                        >
                                                            Review
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleEdit(item)}
                                                        className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleDelete(item.id)}
                                                        className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                    >
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
            </div>

            {/* Approval Dialog */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-lg border-none shadow-2xl">
                    <div className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] p-8 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black uppercase tracking-widest text-white/90">Review Request</DialogTitle>
                            <DialogDescription className="text-white/60 text-xs font-medium uppercase tracking-tight">
                                Evaluate and process student leave application
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    
                    <div className="p-8 space-y-8 bg-white">
                        {selectedLeave && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Student</span>
                                        <span className="text-xs font-bold text-gray-900 block">{selectedLeave.user.name}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Class</span>
                                        <span className="text-xs font-bold text-gray-900 block">{selectedLeave.user.school_class.name} ({selectedLeave.user.section.name})</span>
                                    </div>
                                    <div className="col-span-2 space-y-1 pt-2 border-t border-gray-100 mt-2">
                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Reason for Leave</span>
                                        <p className="text-xs text-gray-600 font-medium leading-relaxed bg-white p-3 rounded-lg border border-gray-50 shadow-sm italic">
                                            "{selectedLeave.reason || "No reason provided"}"
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="h-3 w-3" />
                                        Official Admin Remark
                                    </Label>
                                    <Textarea 
                                        placeholder="Enter approval conditions or rejection reasons here..."
                                        value={adminRemark}
                                        onChange={(e) => setAdminRemark(e.target.value)}
                                        className="min-h-[120px] text-xs border-gray-100 focus:ring-2 focus:ring-indigo-500/20 shadow-none resize-none rounded-lg bg-gray-50/50 p-4 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-row justify-between w-full gap-4">
                            <Button 
                                variant="outline" 
                                onClick={() => handleUpdateStatus("Disapproved")}
                                disabled={updatingStatus}
                                className="flex-1 h-12 text-[10px] font-black uppercase text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-all active:scale-95 shadow-sm"
                            >
                                {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                                Disapprove
                            </Button>
                            <Button 
                                onClick={() => handleUpdateStatus("Approved")}
                                disabled={updatingStatus}
                                className="flex-1 h-12 text-[10px] font-black uppercase bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border-none"
                            >
                                {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                Approve Request
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Leave Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={(open) => {
                setAddDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg border-none shadow-2xl">
                    <div className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] p-4 text-white flex justify-between items-center">
                        <DialogTitle className="text-sm font-medium">{editingLeaveId ? "Edit Leave" : "Add Leave"}</DialogTitle>
                    </div>
                    
                    <div className="p-6 space-y-4 bg-white max-h-[80vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] text-gray-600">Class <span className="text-red-500">*</span></Label>
                                <Select value={newLeaveClass} onValueChange={setNewLeaveClass}>
                                    <SelectTrigger className="h-9 text-[12px] border-gray-200">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(cls => (
                                            <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-1.5">
                                <Label className="text-[11px] text-gray-600">Section <span className="text-red-500">*</span></Label>
                                <Select value={newLeaveSection} onValueChange={setNewLeaveSection} disabled={!newLeaveClass}>
                                    <SelectTrigger className="h-9 text-[12px] border-gray-200">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {newLeaveSections.map(sec => (
                                            <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] text-gray-600">Student <span className="text-red-500">*</span></Label>
                                <Select value={newLeaveStudent} onValueChange={setNewLeaveStudent} disabled={!newLeaveSection}>
                                    <SelectTrigger className="h-9 text-[12px] border-gray-200">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map(std => (
                                            <SelectItem key={std.id} value={std.id.toString()}>{`${std.name || ''} ${std.last_name || ''}`}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] text-gray-600">Leave Type <span className="text-red-500">*</span></Label>
                                <Select value={newLeaveType} onValueChange={setNewLeaveType}>
                                    <SelectTrigger className="h-9 text-[12px] border-gray-200">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {leaveTypes.map(type => (
                                            <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] text-gray-600">Apply Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="date" 
                                    value={newLeaveApplyDate} 
                                    onChange={(e) => setNewLeaveApplyDate(e.target.value)} 
                                    className="h-9 text-[12px] border-gray-200"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] text-gray-600">From Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="date" 
                                    value={newLeaveFromDate} 
                                    onChange={(e) => setNewLeaveFromDate(e.target.value)} 
                                    className="h-9 text-[12px] border-gray-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] text-gray-600">To Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="date" 
                                    value={newLeaveToDate} 
                                    onChange={(e) => setNewLeaveToDate(e.target.value)} 
                                    className="h-9 text-[12px] border-gray-200"
                                    min={newLeaveFromDate}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] text-gray-600">Reason</Label>
                            <Textarea 
                                value={newLeaveReason} 
                                onChange={(e) => setNewLeaveReason(e.target.value)} 
                                className="text-[12px] border-gray-200 resize-none min-h-[60px]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] text-gray-600">Leave Status <span className="text-red-500">*</span></Label>
                            <RadioGroup 
                                value={newLeaveStatus} 
                                onValueChange={setNewLeaveStatus}
                                className="flex flex-row gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Pending" id="pending" />
                                    <Label htmlFor="pending" className="text-[12px] font-normal cursor-pointer">Pending</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Disapproved" id="disapprove" />
                                    <Label htmlFor="disapprove" className="text-[12px] font-normal cursor-pointer">Disapprove</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Approved" id="approve" />
                                    <Label htmlFor="approve" className="text-[12px] font-normal cursor-pointer">Approve</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] text-gray-600">Attach Document</Label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors relative">
                                <div className="space-y-1 text-center">
                                    <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                            <span>Drag and drop a file here or click</span>
                                            <input 
                                                id="file-upload" 
                                                name="file-upload" 
                                                type="file" 
                                                className="sr-only" 
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        setNewLeaveAttachment(e.target.files[0]);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    {newLeaveAttachment && (
                                        <p className="text-xs text-green-600 font-medium pt-2">
                                            Selected: {newLeaveAttachment.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 flex justify-end">
                        <Button 
                            onClick={handleSaveLeave}
                            disabled={savingLeave}
                            variant="gradient"
                            className="min-w-[100px]"
                        >
                            {savingLeave ? <Loader2 className="h-4 w-4 animate-spin" /> : "SAVE"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
