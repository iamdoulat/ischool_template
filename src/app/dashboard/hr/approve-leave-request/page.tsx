"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Plus,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    List,
    History,
    Loader2,
    X,
    CheckCircle,
    XCircle
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LeaveRequest {
    id: number;
    staff: string;
    staffId: string;
    leaveType: string;
    halfDay: string;
    leaveDate: string;
    days: string;
    applyDate: string;
    status: "Pending" | "Approved" | "Disapproved";
    reason?: string;
    adminRemark?: string;
}

interface Meta {
    total: number;
    page: number;
    per_page: number;
    last_page: number;
}

export default function ApproveLeaveRequestPage() {
    const { toast } = useToast();
    const [keyword, setKeyword] = useState("");
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(50);
    const [loading, setLoading] = useState(false);

    // View Details state
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [adminRemark, setAdminRemark] = useState("");
    const [updateLoading, setUpdateLoading] = useState(false);

    // Modal state for Adding (as backup)
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);

    const fetchInitialData = async () => {
        try {
            const [staffRes, typeRes, roleRes] = await Promise.all([
                api.get("/hr/staff-directory"),
                api.get("/hr/leave-type"),
                api.get("/hr/staff-roles")
            ]);
            setStaffList(staffRes.data?.data || []);
            setLeaveTypes(typeRes.data?.data || []);
            setRoles(roleRes.data?.data || []);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchRequests = async (p = page, limit = perPage, q = keyword) => {
        setLoading(true);
        try {
            const res = await api.get("/hr/leave-request", {
                params: {
                    page: p,
                    per_page: limit,
                    search: q || undefined
                }
            });
            if (res.data?.success) {
                setRequests(res.data.data);
                setMeta(res.data.meta);
            }
        } catch (error) {
            console.error(error);
            toast("error", "Failed to load leave requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [page, perPage]);

    const handleUpdateStatus = async (id: number, status: "Approved" | "Disapproved") => {
        setUpdateLoading(true);
        try {
            const res = await api.put(`/hr/leave-request/${id}`, {
                status,
                admin_remark: adminRemark
            });
            if (res.data?.success) {
                toast("success", `Leave request ${status.toLowerCase()} successfully`);
                setIsViewOpen(false);
                fetchRequests();
                setAdminRemark("");
            }
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Failed to update status");
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchRequests(1, perPage, keyword);
    };

    const handleCopy = () => {
        if (!requests.length) return;
        const text = requests.map(r => `${r.staff}\t${r.leaveType}\t${r.leaveDate}\t${r.days}\t${r.status}`).join('\n');
        navigator.clipboard.writeText("Staff\tLeave Type\tLeave Date\tDays\tStatus\n" + text);
        toast("success", "Copied to clipboard!");
    };

    const handleExportCSV = () => {
        const ws = XLSX.utils.json_to_sheet(requests.map(r => ({
            "Staff": r.staff,
            "Type": r.leaveType,
            "Dates": r.leaveDate,
            "Days": r.days,
            "Status": r.status
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leave Approvals");
        XLSX.writeFile(wb, "leave_approvals.xlsx");
    };

    const handlePrint = () => window.print();

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800">Approve Leave Request</h1>
                <Button 
                    onClick={() => window.history.back()} 
                    variant="outline"
                    className="gap-2 h-9 px-6 text-[11px] font-bold uppercase rounded-lg border-gray-200 hover:bg-white shadow-sm flex items-center"
                >
                    <History className="h-4 w-4" /> Back
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Input
                            placeholder="Search..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleSearch()}
                            className="h-8 w-64 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-lg"
                        />
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            variant="gradient"
                            className="gap-2 h-8 px-6 text-[11px] font-bold uppercase rounded shadow-sm flex items-center"
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                            Search
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
                                <SelectTrigger className="h-7 w-14 text-[10px] border-none bg-gray-50 hover:bg-gray-100 transition-colors shadow-none rounded-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 25, 50, 100].map(n => (
                                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={handleCopy}>
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={handleExportCSV}>
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={handlePrint}>
                                <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={() => window.print()}>
                                <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors">
                                <Columns className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded border border-gray-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                {["Staff", "Leave Type", "Half Day", "Leave Date", "Days", "Apply Date", "Status", "Action"].map(h => (
                                    <TableHead key={h} className={`text-[10px] font-bold uppercase text-gray-600 py-3 ${h === "Action" ? "text-right" : ""}`}>{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && requests.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="h-24 text-center text-gray-400 text-[11px] italic">Loading...</TableCell></TableRow>
                            ) : requests.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="h-24 text-center text-gray-400 text-[11px] italic">No leave requests found.</TableCell></TableRow>
                            ) : requests.map((req) => (
                                <TableRow key={req.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/20 transition-colors">
                                    <TableCell className="py-3.5 text-gray-700 font-medium">{req.staff}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{req.leaveType}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{req.halfDay}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{req.leaveDate}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{req.days}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{req.applyDate}</TableCell>
                                    <TableCell className="py-3.5">
                                        <span className={cn(
                                            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                                            req.status === "Pending" && "bg-orange-500 text-white",
                                            req.status === "Approved" && "bg-green-600 text-white",
                                            req.status === "Disapproved" && "bg-red-600 text-white"
                                        )}>
                                            {req.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors shadow-sm" 
                                                title="View & Approve" 
                                                onClick={() => { 
                                                    setSelectedRequest(req); 
                                                    setAdminRemark(req.adminRemark || "");
                                                    setIsViewOpen(true); 
                                                }}
                                            >
                                                <List className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end items-center gap-2 py-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="h-8 w-8 rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-30"
                    >
                        <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </Button>

                    {Array.from({ length: meta?.last_page || 1 }).map((_, i) => (
                        <Button
                            key={i + 1}
                            variant={page === i + 1 ? "gradient" : "outline"}
                            onClick={() => setPage(i + 1)}
                            className={cn(
                                "h-8 w-8 rounded-lg text-[10px] font-bold p-0 transition-all",
                                page === i + 1 ? "shadow-md scale-105" : "border-gray-100 text-gray-400 hover:text-indigo-600"
                            )}
                        >
                            {i + 1}
                        </Button>
                    ))}

                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={page === (meta?.last_page || 1) || !meta}
                        onClick={() => setPage(page + 1)}
                        className="h-8 w-8 rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-30"
                    >
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                    </Button>
                </div>
            </div>

            {/* View Details & Approve Modal */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 font-sans border-0 shadow-2xl overflow-hidden gap-0 rounded-lg">
                    <DialogHeader className="bg-gradient-to-r from-orange-400 to-indigo-500 p-4 text-white">
                        <DialogTitle className="text-sm font-bold uppercase tracking-wider">Review Leave Request</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6 text-sm">
                                <div className="space-y-1">
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">Staff</span> 
                                    <span className="text-gray-800 font-semibold">{selectedRequest.staff}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">Leave Type</span> 
                                    <span className="text-gray-800 font-semibold">{selectedRequest.leaveType}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">Leave Date</span> 
                                    <span className="text-gray-800 font-medium">{selectedRequest.leaveDate}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">Days</span> 
                                    <span className="text-gray-800 font-bold text-indigo-600">{selectedRequest.days}</span>
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">Current Status</span>
                                    <span className={cn(
                                        "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter inline-block shadow-sm",
                                        selectedRequest.status === "Pending" && "bg-orange-500 text-white",
                                        selectedRequest.status === "Approved" && "bg-green-600 text-white",
                                        selectedRequest.status === "Disapproved" && "bg-red-600 text-white"
                                    )}>
                                        {selectedRequest.status}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-100">
                                <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest mb-2">Reason for Leave</span>
                                <div className="text-[12px] text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100 leading-relaxed italic shadow-inner">
                                    {selectedRequest.reason || 'No reason provided.'}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 space-y-3">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Admin Remark / Feedback</Label>
                                <Textarea 
                                    value={adminRemark}
                                    onChange={(e) => setAdminRemark(e.target.value)}
                                    className="text-xs resize-none h-24 border-gray-200 rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Add notes about your decision..."
                                />
                            </div>

                            {selectedRequest.status === "Pending" ? (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <Button 
                                        onClick={() => handleUpdateStatus(selectedRequest.id, "Disapproved")}
                                        disabled={updateLoading}
                                        variant="outline"
                                        className="h-10 text-[11px] font-bold uppercase tracking-widest rounded-lg border-red-200 text-red-600 hover:bg-red-50 gap-2"
                                    >
                                        <XCircle className="h-4 w-4" /> Disapprove
                                    </Button>
                                    <Button 
                                        onClick={() => handleUpdateStatus(selectedRequest.id, "Approved")}
                                        disabled={updateLoading}
                                        variant="gradient"
                                        className="h-10 text-[11px] font-bold uppercase tracking-widest rounded-lg gap-2 shadow-md"
                                    >
                                        <CheckCircle className="h-4 w-4" /> Approve
                                    </Button>
                                </div>
                            ) : (
                                <div className="pt-2">
                                    <Button 
                                        onClick={() => setIsViewOpen(false)}
                                        variant="outline"
                                        className="w-full h-10 text-[11px] font-bold uppercase tracking-widest rounded-lg"
                                    >
                                        Close
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
