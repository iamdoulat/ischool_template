"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Pencil, X, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight, CheckCircle2, Loader2, Calendar, User, UserCheck, XCircle } from "lucide-react";
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
        school_class: { name: string };
        section: { name: string };
    };
    leave_type: { name: string };
    apply_date: string;
    leave_from: string;
    leave_to: string;
    days: number;
    status: "Approved" | "Disapproved" | "Pending";
    admin_remark: string;
    reason: string;
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

    useEffect(() => {
        fetchClasses();
        fetchLeaves();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            const cls = classes.find(c => c.id.toString() === selectedClass);
            setSections(cls?.sections || []);
            setSelectedSection("");
        }
    }, [selectedClass, classes]);

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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
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

                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-full border border-gray-100">
                        {[Copy, FileSpreadsheet, FileText, Printer, Columns].map((Icon, idx) => (
                            <Button key={idx} variant="ghost" size="icon" className="h-8 w-8 hover:bg-white hover:text-indigo-600 rounded-full transition-all">
                                <Icon className="h-3.5 w-3.5" />
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-gray-100 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent text-[10px] font-bold uppercase text-gray-500 bg-gray-50/50">
                                <TableHead className="py-4 px-6">Student</TableHead>
                                <TableHead className="py-4 px-6">Class/Section</TableHead>
                                <TableHead className="py-4 px-6">Leave Type</TableHead>
                                <TableHead className="py-4 px-6">Apply Date</TableHead>
                                <TableHead className="py-4 px-6">Duration</TableHead>
                                <TableHead className="py-4 px-6">Status</TableHead>
                                <TableHead className="py-4 px-6 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                                    </TableCell>
                                </TableRow>
                            ) : leaves.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-gray-400 text-xs italic">
                                        No leave requests found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leaves.map((item) => (
                                    <TableRow key={item.id} className="text-sm border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
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
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
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
                                                    onClick={() => handleDelete(item.id)}
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-all group/btn"
                                                >
                                                    <X className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
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
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white">
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
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
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
                                        <p className="text-xs text-gray-600 font-medium leading-relaxed bg-white p-3 rounded-xl border border-gray-50 shadow-sm italic">
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
                                        className="min-h-[120px] text-xs border-gray-100 focus:ring-2 focus:ring-indigo-500/20 shadow-none resize-none rounded-xl bg-gray-50/50 p-4 transition-all"
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
                                className="flex-1 h-12 text-[10px] font-black uppercase bg-gradient-to-r from-green-500 to-[#10B981] hover:from-[#10B981] hover:to-[#059669] text-white rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border-none"
                            >
                                {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                Approve Request
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
