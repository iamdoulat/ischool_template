"use client";

import { useState } from "react";
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
    History
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface LeaveRequest {
    id: string;
    staff: string;
    staffId: string;
    leaveType: string;
    halfDay: string;
    leaveDate: string;
    days: string;
    applyDate: string;
    status: "Pending" | "Approved" | "Disapproved";
}

const mockLeaveRequests: LeaveRequest[] = [
    { id: "1", staff: "Joe Black (9000)", staffId: "9000", leaveType: "Sick Leave", halfDay: "", leaveDate: "02/25/2026 - 02/28/2026", days: "4.00", applyDate: "02/24/2026", status: "Pending" },
    { id: "2", staff: "Joe Black (9000)", staffId: "9000", leaveType: "Maternity Leave", halfDay: "", leaveDate: "02/18/2026 - 02/21/2026", days: "9.00", applyDate: "02/18/2026", status: "Pending" },
    { id: "3", staff: "Joe Black (9000)", staffId: "9000", leaveType: "Medical Leave", halfDay: "", leaveDate: "02/07/2026 - 02/10/2026", days: "4.00", applyDate: "02/05/2026", status: "Pending" },
    { id: "4", staff: "Joe Black (9000)", staffId: "9000", leaveType: "Medical Leave", halfDay: "Second Half", leaveDate: "02/04/2026 - 02/04/2026", days: "0.50", applyDate: "02/03/2026", status: "Pending" },
    { id: "5", staff: "Maria Ford (9005)", staffId: "9005", leaveType: "Sick Leave", halfDay: "", leaveDate: "02/14/2026 - 02/16/2026", days: "3.00", applyDate: "02/14/2026", status: "Pending" },
    { id: "6", staff: "Brandon Heart (9009)", staffId: "9009", leaveType: "Medical Leave", halfDay: "", leaveDate: "02/27/2026 - 02/28/2026", days: "2.00", applyDate: "02/21/2026", status: "Disapproved" },
    { id: "7", staff: "James Decker (9001)", staffId: "9001", leaveType: "Casual Leave", halfDay: "", leaveDate: "02/18/2026 - 02/20/2026", days: "3.00", applyDate: "02/16/2026", status: "Pending" },
    { id: "8", staff: "Jason Sharlton (90008)", staffId: "90008", leaveType: "Casual Leave", halfDay: "Second Half", leaveDate: "02/10/2026 - 02/10/2026", days: "0.50", applyDate: "02/11/2026", status: "Pending" },
    { id: "9", staff: "Shivam Verma (9002)", staffId: "9002", leaveType: "Casual Leave", halfDay: "", leaveDate: "02/11/2026 - 02/12/2026", days: "2.00", applyDate: "02/05/2026", status: "Approved" },
    { id: "10", staff: "William Abbot (9008)", staffId: "9008", leaveType: "Medical Leave", halfDay: "", leaveDate: "02/05/2026 - 02/07/2026", days: "2.00", applyDate: "02/03/2026", status: "Approved" },
    { id: "11", staff: "Joe Black (9000)", staffId: "9000", leaveType: "Medical Leave", halfDay: "", leaveDate: "01/23/2026 - 01/23/2026", days: "1.00", applyDate: "01/22/2026", status: "Pending" },
    { id: "12", staff: "Maria Ford (9005)", staffId: "9005", leaveType: "Maternity Leave", halfDay: "", leaveDate: "01/28/2026 - 01/31/2026", days: "4.00", applyDate: "01/28/2026", status: "Approved" },
    { id: "13", staff: "Joe Black (9000)", staffId: "9000", leaveType: "Maternity Leave", halfDay: "", leaveDate: "01/26/2026 - 01/28/2026", days: "3.00", applyDate: "01/25/2026", status: "Pending" },
    { id: "14", staff: "Joe Black (9000)", staffId: "9000", leaveType: "Medical Leave", halfDay: "Second Half", leaveDate: "01/15/2026 - 01/15/2026", days: "0.50", applyDate: "01/15/2026", status: "Pending" },
    { id: "15", staff: "Jason Sharlton (90008)", staffId: "90008", leaveType: "Casual Leave", halfDay: "", leaveDate: "01/23/2026 - 01/26/2026", days: "4.00", applyDate: "01/23/2026", status: "Pending" },
    { id: "16", staff: "James Decker (9001)", staffId: "9001", leaveType: "Medical Leave", halfDay: "", leaveDate: "01/12/2026 - 01/16/2026", days: "5.00", applyDate: "01/02/2026", status: "Disapproved" },
];

export default function ApproveLeaveRequestPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredRequests = mockLeaveRequests.filter(req =>
        req.staff.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.leaveType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800">Approve Leave Request</h1>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-9 px-4 text-xs shadow-sm transition-all rounded">
                    <Plus className="h-4 w-4" /> Add Leave Request
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-[10px] text-gray-500 font-bold">50</span>
                            <Select defaultValue="50">
                                <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                <Columns className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border border-gray-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Staff</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Leave Type</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Half Day</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Leave Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Days</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Apply Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Status</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRequests.map((req) => (
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
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                <List className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
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
                        Showing 1 to {filteredRequests.length} of {mockLeaveRequests.length} entries
                    </div>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-gray-200" disabled>
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0">
                            1
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-gray-200" disabled>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
