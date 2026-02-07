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
    X
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface LeaveRecord {
    id: string;
    staff: string;
    leaveType: string;
    halfDay: string;
    leaveDate: string;
    days: string;
    applyDate: string;
    status: "Pending" | "Approved" | "Disapproved";
}

const mockLeaves: LeaveRecord[] = [
    { id: "1", staff: "Joe Black (9000)", leaveType: "Sick Leave", halfDay: "", leaveDate: "02/25/2026 - 02/28/2026", days: "4.00", applyDate: "02/24/2026", status: "Pending" },
    { id: "2", staff: "Joe Black (9000)", leaveType: "Maternity Leave", halfDay: "", leaveDate: "02/18/2026 - 02/21/2026", days: "9.00", applyDate: "02/18/2026", status: "Pending" },
    { id: "3", staff: "Joe Black (9000)", leaveType: "Medical Leave", halfDay: "", leaveDate: "02/07/2026 - 02/10/2026", days: "4.00", applyDate: "02/05/2026", status: "Pending" },
    { id: "4", staff: "Joe Black (9000)", leaveType: "Medical Leave", halfDay: "Second Half", leaveDate: "02/04/2026 - 02/04/2026", days: "0.50", applyDate: "02/03/2026", status: "Pending" },
    { id: "5", staff: "Joe Black (9000)", leaveType: "Medical Leave", halfDay: "", leaveDate: "01/23/2026 - 01/23/2026", days: "1.00", applyDate: "01/22/2026", status: "Pending" },
    { id: "6", staff: "Joe Black (9000)", leaveType: "Maternity Leave", halfDay: "", leaveDate: "01/26/2026 - 01/28/2026", days: "3.00", applyDate: "01/25/2026", status: "Pending" },
    { id: "7", staff: "Joe Black (9000)", leaveType: "Medical Leave", halfDay: "Second Half", leaveDate: "01/15/2026 - 01/15/2026", days: "0.50", applyDate: "01/15/2026", status: "Pending" },
];

export default function ApplyLeavePage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredLeaves = mockLeaves.filter(leave =>
        leave.leaveType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800 tracking-tight">Leaves</h1>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-9 px-4 text-xs shadow-sm shadow-indigo-100 transition-all rounded">
                    Apply Leave
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
                            {filteredLeaves.map((leave) => (
                                <TableRow key={leave.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/20 transition-colors">
                                    <TableCell className="py-3.5 text-gray-700 font-medium">{leave.staff}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{leave.leaveType}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{leave.halfDay}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{leave.leaveDate}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{leave.days}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{leave.applyDate}</TableCell>
                                    <TableCell className="py-3.5">
                                        <span className={cn(
                                            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                                            leave.status === "Pending" && "bg-orange-500 text-white",
                                            leave.status === "Approved" && "bg-green-600 text-white",
                                            leave.status === "Disapproved" && "bg-red-600 text-white"
                                        )}>
                                            {leave.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                <List className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded border-0">
                                                <X className="h-3 w-3" />
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
                        Showing 1 to {filteredLeaves.length} of {mockLeaves.length} entries
                    </div>
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-400 mr-2">‹</span>
                        <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0">
                            1
                        </Button>
                        <span className="text-gray-400 ml-2">›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
