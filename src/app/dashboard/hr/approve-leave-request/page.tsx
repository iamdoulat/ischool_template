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
    Loader2
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

const gradBtn = "bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-90 transition-opacity text-white border-none";
const gradPill = "bg-gradient-to-r from-orange-400 to-indigo-500 text-white border-0 shadow-sm";

export default function ApproveLeaveRequestPage() {
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

    useEffect(() => {
        api.get("/hr/staff-directory").then(res => setStaffList(res.data?.data || [])).catch(console.error);
        api.get("/hr/leave-types").then(res => setLeaveTypes(res.data?.data || [])).catch(console.error);
        api.get("/hr/staff-roles").then(res => setRoles(res.data?.data || [])).catch(console.error);
    }, []);

    const handleAddSubmit = async () => {
        if (!addForm.user_id || !addForm.leave_type_id || !addForm.leave_from || !addForm.leave_to || !addForm.apply_date) {
            alert("Please fill required fields (Name, Leave Type, Dates).");
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

            const res = await api.post("/hr/leave-requests", payload);
            if (res.data?.success) {
                setIsAddOpen(false);
                fetchRequests();
                setAddForm({
                    role: "Select", user_id: "", apply_date: new Date().toISOString().split('T')[0],
                    leave_type_id: "", leave_from: "", leave_to: "", half_day: "", reason: "", admin_remark: "", status: "Pending"
                });
            } else {
                alert("Error adding request.");
            }
        } catch (e: any) {
            alert(e.response?.data?.message || "Failed to submit request.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const fetchRequests = async (p = page, limit = perPage, q = keyword) => {
        setLoading(true);
        try {
            const res = await api.get("/hr/leave-requests", {
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
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this leave request?")) return;
        try {
            const res = await api.delete(`/hr/leave-requests/${id}`);
            if (res.data?.success) {
                fetchRequests();
            }
        } catch (error) {
            console.error(error);
            alert("Failed to delete request");
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [page, perPage]);

    const handleSearch = () => {
        setPage(1);
        fetchRequests(1, perPage, keyword);
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800">Approve Leave Request</h1>
                <Button onClick={() => setIsAddOpen(true)} className={cn("gap-2 h-9 px-4 text-xs font-bold rounded-full cursor-pointer", gradBtn)}>
                    <Plus className="h-4 w-4" /> Add Leave Request
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
                            className="h-9 w-64 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-full"
                        />
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className={cn("gap-2 h-9 px-6 text-sm font-bold rounded-full cursor-pointer", gradBtn)}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Search
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-[10px] text-gray-500 font-bold">{perPage}</span>
                            <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
                                <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 25, 50, 100].map(n => (
                                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            {[Copy, FileSpreadsheet, FileText, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-md border border-gray-50 overflow-hidden">
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
                                <TableRow><TableCell colSpan={8} className="h-24 text-center text-gray-400 text-xs">Loading...</TableCell></TableRow>
                            ) : requests.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="h-24 text-center text-gray-400 text-xs">No leave requests found.</TableCell></TableRow>
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
                                        <div className="flex items-center justify-end gap-1">
                                            {/* List/View */}
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-[#6366f1] hover:bg-[#5558dd] text-white rounded shadow-sm" title="View details" onClick={() => { setSelectedRequest(req); setIsViewOpen(true); }}>
                                                <List className="h-3 w-3" />
                                            </Button>
                                            {/* History/Delete - Replaced with History icon matching the image */}
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-[#6366f1] hover:bg-[#5558dd] text-white rounded shadow-sm" title="Delete request" onClick={() => handleDelete(req.id)}>
                                                <History className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-2">
                    <div>
                        Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, meta?.total || 0)} of {meta?.total || 0} entries
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-2xl border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 shadow-sm"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Pagination Numbers */}
                        {Array.from({ length: meta?.last_page || 1 }).map((_, i) => {
                            const p = i + 1;
                            // Basic logic: show first, last, current, and adjacent
                            const isCurrent = p === page;
                            const isAdjacent = Math.abs(p - page) <= 1;
                            const isEdge = p === 1 || p === (meta?.last_page || 1);

                            if (isCurrent || isAdjacent || isEdge) {
                                return (
                                    <Button
                                        key={p}
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "h-8 w-8 rounded-2xl font-bold shadow-sm transition-all",
                                            isCurrent ? gradPill : "border-transparent bg-transparent hover:bg-gray-100 text-gray-600"
                                        )}
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </Button>
                                );
                            } else if (p === 2 && page > 4) {
                                return <span key={p} className="text-gray-400">...</span>;
                            } else if (p === (meta?.last_page || 1) - 1 && page < (meta?.last_page || 1) - 3) {
                                return <span key={p} className="text-gray-400">...</span>;
                            }
                            return null;
                        })}


                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-2xl border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 shadow-sm"
                            disabled={page === (meta?.last_page || 1) || !meta}
                            onClick={() => setPage(page + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add Leave Request Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 font-sans border-0 shadow-lg overflow-hidden gap-0">
                    <div className="bg-[#6366f1] p-3 text-white flex justify-between items-center rounded-none">
                        <DialogTitle className="text-sm font-medium">Add Leave Request</DialogTitle>
                    </div>
                    <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Role <span className="text-red-500">*</span></Label>
                                <Select value={addForm.role} onValueChange={v => setAddForm({ ...addForm, role: v })}>
                                    <SelectTrigger className="h-8 text-xs border-gray-200"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {roles.map(r => (
                                            <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Name <span className="text-red-500">*</span></Label>
                                <Select value={addForm.user_id} onValueChange={v => setAddForm({ ...addForm, user_id: v })}>
                                    <SelectTrigger className="h-8 text-xs border-gray-200"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {staffList.map(s => <SelectItem key={s.id} value={String(s.user_id || s.id)}>{s.name} {s.staff_id ? `(${s.staff_id})` : ''}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Apply Date <span className="text-red-500">*</span></Label>
                                <Input type="date" value={addForm.apply_date} onChange={e => setAddForm({ ...addForm, apply_date: e.target.value })} className="h-8 text-xs border-gray-200" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Leave Type <span className="text-red-500">*</span></Label>
                                <Select value={addForm.leave_type_id} onValueChange={v => setAddForm({ ...addForm, leave_type_id: v })}>
                                    <SelectTrigger className="h-8 text-xs border-gray-200"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {leaveTypes.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Leave From Date <span className="text-red-500">*</span></Label>
                                <Input type="date" value={addForm.leave_from} onChange={e => setAddForm({ ...addForm, leave_from: e.target.value })} className="h-8 text-xs border-gray-200" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Leave To Date <span className="text-red-500">*</span></Label>
                                <Input type="date" value={addForm.leave_to} onChange={e => setAddForm({ ...addForm, leave_to: e.target.value })} className="h-8 text-xs border-gray-200" />
                            </div>
                        </div>

                        <div className="flex justify-start gap-4 items-center">
                            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                                <input type="radio" name="half_day" checked={addForm.half_day === "First Half"} onChange={() => setAddForm({ ...addForm, half_day: "First Half" })} className="accent-indigo-600" />
                                Half Day (First Half)
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                                <input type="radio" name="half_day" checked={addForm.half_day === "Second Half"} onChange={() => setAddForm({ ...addForm, half_day: "Second Half" })} className="accent-indigo-600" />
                                Half Day (Second Half)
                            </label>
                            {addForm.half_day && (
                                <span className="text-[10px] text-blue-500 cursor-pointer hover:underline ml-2" onClick={() => setAddForm({ ...addForm, half_day: "" })}>Clear Half Day</span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Reason</Label>
                                <Textarea value={addForm.reason} onChange={e => setAddForm({ ...addForm, reason: e.target.value })} className="text-xs resize-none h-20 border-gray-200" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600">Note</Label>
                                <Textarea value={addForm.admin_remark} onChange={e => setAddForm({ ...addForm, admin_remark: e.target.value })} className="text-xs resize-none h-20 border-gray-200" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600 font-bold mb-1 block">Attach Document</Label>
                                <label className="border border-dashed border-gray-300 rounded-md p-3 text-center cursor-pointer hover:bg-gray-50 flex flex-col items-center justify-center gap-1">
                                    <span className="text-[11px] text-gray-600">☁️ Drag and drop a file here or click</span>
                                    <input type="file" className="hidden" />
                                </label>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-600 font-bold mb-1 block">Status</Label>
                                <div className="flex gap-4 items-center">
                                    {["Pending", "Approved", "Disapproved"].map(st => (
                                        <label key={st} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                                            <input type="radio" name="status" checked={addForm.status === st} onChange={() => setAddForm({ ...addForm, status: st as any })} className="accent-indigo-600" />
                                            {st}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="bg-white p-3 border-t border-gray-100">
                        <Button onClick={handleAddSubmit} disabled={submitLoading} className={cn("gap-2 h-9 px-8 text-sm font-bold rounded-full cursor-pointer", gradBtn)}>
                            {submitLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                            SAVE
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Details Modal */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 font-sans border-0 shadow-lg overflow-hidden gap-0">
                    <div className="bg-[#6366f1] p-3 text-white flex justify-between items-center rounded-none">
                        <DialogTitle className="text-sm font-medium">Leave Request Details</DialogTitle>
                    </div>
                    {selectedRequest && (
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                <div><span className="font-bold text-gray-500 block text-[11px] uppercase mb-0.5">Staff</span> <span className="text-gray-800">{selectedRequest.staff}</span></div>
                                <div><span className="font-bold text-gray-500 block text-[11px] uppercase mb-0.5">Leave Type</span> <span className="text-gray-800">{selectedRequest.leaveType}</span></div>
                                <div><span className="font-bold text-gray-500 block text-[11px] uppercase mb-0.5">Leave Date</span> <span className="text-gray-800">{selectedRequest.leaveDate}</span></div>
                                <div><span className="font-bold text-gray-500 block text-[11px] uppercase mb-0.5">Apply Date</span> <span className="text-gray-800">{selectedRequest.applyDate}</span></div>
                                <div><span className="font-bold text-gray-500 block text-[11px] uppercase mb-0.5">Days</span> <span className="text-gray-800">{selectedRequest.days}</span></div>
                                <div><span className="font-bold text-gray-500 block text-[11px] uppercase mb-0.5">Half Day</span> <span className="text-gray-800">{selectedRequest.halfDay || 'N/A'}</span></div>
                                <div className="col-span-2"><span className="font-bold text-gray-500 block text-[11px] uppercase mb-1">Status</span>
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1 inline-block",
                                        selectedRequest.status === "Pending" && "bg-orange-500 text-white",
                                        selectedRequest.status === "Approved" && "bg-green-600 text-white",
                                        selectedRequest.status === "Disapproved" && "bg-red-600 text-white"
                                    )}>
                                        {selectedRequest.status}
                                    </span>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-gray-100">
                                <span className="font-bold text-gray-500 block text-[11px] uppercase mb-1.5">Reason</span>
                                <p className="text-[13px] text-gray-700 bg-gray-50 p-3 rounded-md min-h-16 border border-gray-100">{selectedRequest.reason || 'No reason provided.'}</p>
                            </div>
                            {selectedRequest.adminRemark && (
                                <div className="pt-3 border-t border-gray-100">
                                    <span className="font-bold text-gray-500 block text-[11px] uppercase mb-1.5">Admin Remark</span>
                                    <p className="text-[13px] text-gray-700 bg-gray-50 p-3 rounded-md min-h-16 border border-gray-100">{selectedRequest.adminRemark}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
