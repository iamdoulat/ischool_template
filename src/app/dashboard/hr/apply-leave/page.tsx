"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
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
    Trash2
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

export default function ApplyLeavePage() {
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

    // Modal state
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        role: "Select",
        user_id: "",
        apply_date: new Date().toISOString().split('T')[0],
        leave_type_id: "",
        leave_from: "",
        leave_to: "",
        half_day: "",
        reason: "",
        admin_remark: "",
        status: "Pending" as "Pending" | "Approved" | "Disapproved"
    });
    const [staffList, setStaffList] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [submitLoading, setSubmitLoading] = useState(false);

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

    const handleAddSubmit = async () => {
        if (!addForm.user_id || !addForm.leave_type_id || !addForm.leave_from || !addForm.leave_to || !addForm.apply_date) {
            toast("error", "Please fill required fields (Name, Leave Type, Dates).");
            return;
        }
        setSubmitLoading(true);
        try {
            const start = new Date(addForm.leave_from);
            const end = new Date(addForm.leave_to);
            let d = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
            if (addForm.half_day) d -= 0.5;
            if (d < 0.5) d = 0.5;

            const payload = {
                user_id: addForm.user_id,
                leave_type_id: addForm.leave_type_id,
                leave_from: addForm.leave_from,
                leave_to: addForm.leave_to,
                days: d,
                apply_date: addForm.apply_date,
                half_day: addForm.half_day || null,
                reason: addForm.reason,
                admin_remark: addForm.admin_remark,
                status: addForm.status
            };

            const res = await api.post("/hr/leave-request", payload);
            if (res.data?.success) {
                toast("success", "Leave request submitted successfully");
                setIsAddOpen(false);
                fetchRequests();
                setAddForm({
                    role: "Select", user_id: "", apply_date: new Date().toISOString().split('T')[0],
                    leave_type_id: "", leave_from: "", leave_to: "", half_day: "", reason: "", admin_remark: "", status: "Pending"
                });
            }
        } catch (e: any) {
            toast("error", e.response?.data?.message || "Failed to submit request.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this leave request?")) return;
        try {
            const res = await api.delete(`/hr/leave-request/${id}`);
            if (res.data?.success) {
                toast("success", "Leave request deleted");
                fetchRequests();
            }
        } catch (error) {
            console.error(error);
            toast("error", "Failed to delete request");
        }
    };

    const handleSearch = () => {
        setPage(1);
        fetchRequests(1, perPage, keyword);
    };

    // Export Functions
    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(requests.map(r => ({
            "Staff": r.staff,
            "Type": r.leaveType,
            "Dates": r.leaveDate,
            "Days": r.days,
            "Status": r.status
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leave Requests");
        XLSX.writeFile(wb, "leave_requests.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Leave Request List", 14, 15);
        autoTable(doc, {
            head: [['Staff', 'Type', 'Leave Dates', 'Days', 'Status']],
            body: requests.map(r => [r.staff, r.leaveType, r.leaveDate, r.days, r.status]),
            startY: 20,
        });
        doc.save("leave_requests.pdf");
    };

    const copyToClipboard = () => {
        const text = requests.map(r => `${r.staff} - ${r.leaveType} (${r.leaveDate}): ${r.status}`).join('\n');
        navigator.clipboard.writeText(text);
        toast("success", "Data copied to clipboard");
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800">Leaves</h1>
                <Button 
                    onClick={() => setIsAddOpen(true)} 
                    variant="gradient"
                    className="gap-2 h-9 px-6 text-[11px] font-bold uppercase rounded shadow-md flex items-center"
                >
                    <Plus className="h-4 w-4" /> Apply Leave
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
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={copyToClipboard}>
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={exportToExcel}>
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={exportToPDF}>
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
                                            <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors shadow-sm" title="View details" onClick={() => { setSelectedRequest(req); setIsViewOpen(true); }}>
                                                <List className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors shadow-sm" title="Cancel request" onClick={() => handleDelete(req.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
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

            {/* Add Leave Request Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 font-sans border-0 shadow-2xl overflow-hidden gap-0 rounded-lg">
                    <DialogHeader className="bg-gradient-to-r from-orange-400 to-indigo-500 p-4 text-white">
                        <DialogTitle className="text-sm font-bold uppercase tracking-wider">Apply Leave Request</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Role <span className="text-red-500">*</span></Label>
                                <Select value={addForm.role} onValueChange={v => setAddForm({ ...addForm, role: v })}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {roles.map(r => (
                                            <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Name <span className="text-red-500">*</span></Label>
                                <Select value={addForm.user_id} onValueChange={v => setAddForm({ ...addForm, user_id: v })}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {staffList.filter(s => addForm.role === "Select" || s.role === addForm.role).map(s => (
                                            <SelectItem key={s.id} value={String(s.user_id || s.id)}>
                                                {s.name} {s.staff_id ? `(${s.staff_id})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Apply Date <span className="text-red-500">*</span></Label>
                                <DatePicker value={addForm.apply_date} onChange={val => setAddForm({ ...addForm, apply_date: val })} className="h-9 text-xs border-gray-200 rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Leave Type <span className="text-red-500">*</span></Label>
                                <Select value={addForm.leave_type_id} onValueChange={v => setAddForm({ ...addForm, leave_type_id: v })}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {leaveTypes.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Leave From Date <span className="text-red-500">*</span></Label>
                                <DatePicker value={addForm.leave_from} onChange={val => setAddForm({ ...addForm, leave_from: val })} className="h-9 text-xs border-gray-200 rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Leave To Date <span className="text-red-500">*</span></Label>
                                <DatePicker value={addForm.leave_to} onChange={val => setAddForm({ ...addForm, leave_to: val })} className="h-9 text-xs border-gray-200 rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500" />
                            </div>
                        </div>

                        <div className="flex justify-start gap-6 items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer group">
                                <input type="radio" name="half_day" checked={addForm.half_day === "First Half"} onChange={() => setAddForm({ ...addForm, half_day: "First Half" })} className="h-4 w-4 accent-indigo-600" />
                                <span className="group-hover:text-indigo-600 transition-colors">Half Day (First Half)</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer group">
                                <input type="radio" name="half_day" checked={addForm.half_day === "Second Half"} onChange={() => setAddForm({ ...addForm, half_day: "Second Half" })} className="h-4 w-4 accent-indigo-600" />
                                <span className="group-hover:text-indigo-600 transition-colors">Half Day (Second Half)</span>
                            </label>
                            {addForm.half_day && (
                                <Button variant="ghost" className="h-6 px-2 text-[10px] text-blue-500 hover:bg-blue-50 font-bold uppercase tracking-wider" onClick={() => setAddForm({ ...addForm, half_day: "" })}>Clear</Button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Reason</Label>
                                <Textarea value={addForm.reason} onChange={e => setAddForm({ ...addForm, reason: e.target.value })} className="text-xs resize-none h-20 border-gray-200 rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500" placeholder="Describe leave reason..." />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Note</Label>
                                <Textarea value={addForm.admin_remark} onChange={e => setAddForm({ ...addForm, admin_remark: e.target.value })} className="text-xs resize-none h-20 border-gray-200 rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500" placeholder="Internal notes..." />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5 pt-2 border-t border-gray-100">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Attach Document</Label>
                                <label className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-200 transition-all flex flex-col items-center justify-center gap-2">
                                    <span className="text-[10px] text-gray-400 font-medium">☁️ DRAG AND DROP OR CLICK TO UPLOAD</span>
                                    <input type="file" className="hidden" />
                                </label>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">Status</Label>
                                <div className="flex gap-4 items-center h-9">
                                    {["Pending", "Approved", "Disapproved"].map(st => (
                                        <label key={st} className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer group">
                                            <input type="radio" name="status" checked={addForm.status === st} onChange={() => setAddForm({ ...addForm, status: st as any })} className="h-4 w-4 accent-indigo-600" />
                                            <span className="group-hover:text-indigo-600 transition-colors">{st}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="bg-gray-50 p-4 border-t border-gray-100 rounded-b-xl flex gap-2">
                        <Button onClick={() => setIsAddOpen(false)} variant="outline" className="h-9 px-6 text-xs font-bold uppercase rounded-lg border-gray-200 hover:bg-white shadow-sm">Cancel</Button>
                        <Button onClick={handleAddSubmit} disabled={submitLoading} variant="gradient" className="h-9 px-8 text-xs font-bold uppercase rounded-lg shadow-md min-w-[120px]">
                            {submitLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            SAVE REQUEST
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Details Modal */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 font-sans border-0 shadow-2xl overflow-hidden gap-0 rounded-lg">
                    <DialogHeader className="bg-gradient-to-r from-orange-400 to-indigo-500 p-4 text-white">
                        <DialogTitle className="text-sm font-bold uppercase tracking-wider">Leave Request Details</DialogTitle>
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
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">Apply Date</span> 
                                    <span className="text-gray-800 font-medium">{selectedRequest.applyDate}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">Days</span> 
                                    <span className="text-gray-800 font-bold text-indigo-600">{selectedRequest.days}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">Half Day</span> 
                                    <span className="text-gray-800 font-medium">{selectedRequest.halfDay || 'No'}</span>
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest">Status</span>
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
                                <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest mb-2">Reason</span>
                                <div className="text-[12px] text-gray-700 bg-gray-50 p-4 rounded-lg min-h-20 border border-gray-100 leading-relaxed italic shadow-inner">
                                    {selectedRequest.reason || 'No reason provided.'}
                                </div>
                            </div>
                            {selectedRequest.adminRemark && (
                                <div className="pt-4 border-t border-gray-100">
                                    <span className="font-bold text-gray-400 block text-[9px] uppercase tracking-widest mb-2">Admin Remark</span>
                                    <div className="text-[12px] text-gray-700 bg-indigo-50/30 p-4 rounded-lg min-h-20 border border-indigo-100/50 leading-relaxed shadow-inner">
                                        {selectedRequest.adminRemark}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
