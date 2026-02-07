"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Pencil, X, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

interface LeaveRequest {
    id: string;
    studentName: string;
    studentId: string;
    class: string;
    section: string;
    applyDate: string;
    fromDate: string;
    toDate: string;
    status: "Approved" | "Disapproved" | "Pending";
    statusDate?: string;
    approvedBy?: string;
}

const mockLeaveRequests: LeaveRequest[] = [
    { id: "1", studentName: "David Clarkson", studentId: "RS56223", class: "Class 2", section: "A", applyDate: "02/13/2026", fromDate: "02/18/2026", toDate: "02/19/2026", status: "Disapproved", approvedBy: "Joe Black (9000)" },
    { id: "2", studentName: "Niharika", studentId: "9001", class: "Class 2", section: "A", applyDate: "02/05/2026", fromDate: "02/18/2026", toDate: "02/19/2026", status: "Approved", statusDate: "02/02/2026", approvedBy: "Joe Black (9000)" },
    { id: "3", studentName: "Edward Thomas", studentId: "18001", class: "Class 1", section: "A", applyDate: "02/05/2026", fromDate: "02/11/2026", toDate: "02/11/2026", status: "Pending" },
    { id: "4", studentName: "Ashwani Kumar", studentId: "120020", class: "Class 1", section: "A", applyDate: "02/10/2026", fromDate: "02/16/2026", toDate: "02/16/2026", status: "Approved", statusDate: "02/02/2026", approvedBy: "Joe Black (9000)" },
    { id: "5", studentName: "Niharika", studentId: "9001", class: "Class 2", section: "A", applyDate: "02/04/2026", fromDate: "02/09/2026", toDate: "02/09/2026", status: "Pending" },
    { id: "6", studentName: "Niharika", studentId: "9001", class: "Class 2", section: "A", applyDate: "02/02/2026", fromDate: "02/03/2026", toDate: "02/03/2026", status: "Pending" },
    { id: "7", studentName: "Vinay Singh", studentId: "5422", class: "Class 1", section: "B", applyDate: "01/25/2026", fromDate: "01/26/2026", toDate: "01/26/2026", status: "Pending" },
    { id: "8", studentName: "RKS Kumar", studentId: "RKS001", class: "Class 1", section: "B", applyDate: "01/22/2026", fromDate: "01/23/2026", toDate: "01/23/2026", status: "Pending" },
];

export default function ApproveLeavePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    const filteredData = mockLeaveRequests.filter((item) =>
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-6">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="class" className="text-xs font-semibold text-gray-600">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select>
                            <SelectTrigger id="class">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class1">Class 1</SelectItem>
                                <SelectItem value="class2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="section" className="text-xs font-semibold text-gray-600">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select>
                            <SelectTrigger id="section">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 gap-2 text-xs h-8">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            {/* Approve Leave List Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-lg font-medium text-gray-800">Approve Leave List</h2>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 text-xs h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-48">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-8 text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                            <SelectTrigger className="w-[70px] h-8 text-xs">
                                <SelectValue placeholder="50" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
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

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 text-[11px] uppercase">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-600 min-w-[150px]">Student Name</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[80px]">Class</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[80px]">Section</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">Apply Date</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">From Date</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">To Date</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[120px]">Status</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[150px]">Approve Disapprove By</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right min-w-[120px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((item) => (
                                <TableRow key={item.id} className="text-[13px] hover:bg-gray-50/50">
                                    <TableCell className="font-medium text-gray-700 py-3">
                                        {item.studentName} ({item.studentId})
                                    </TableCell>
                                    <TableCell className="text-gray-500">{item.class}</TableCell>
                                    <TableCell className="text-gray-500">{item.section}</TableCell>
                                    <TableCell className="text-gray-500">{item.applyDate}</TableCell>
                                    <TableCell className="text-gray-500">{item.fromDate}</TableCell>
                                    <TableCell className="text-gray-500">{item.toDate}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className={`font-medium ${item.status === "Approved" ? "text-green-600" :
                                                item.status === "Disapproved" ? "text-red-600" :
                                                    "text-amber-600"
                                                }`}>
                                                {item.status} {item.statusDate && `(${item.statusDate})`}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-500">{item.approvedBy || ""}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {item.status === "Pending" && (
                                                <Button
                                                    size="sm"
                                                    className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                    title="Approve"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                title="Edit"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                title="Delete"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                    <div>
                        Showing 1 to {filteredData.length} of {mockLeaveRequests.length} entries
                    </div>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 group hover:bg-indigo-50 hover:text-indigo-600" disabled><ChevronLeft className="h-3.5 w-3.5" /></Button>
                        <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white">1</Button>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 group hover:bg-indigo-50 hover:text-indigo-600" disabled><ChevronRight className="h-3.5 w-3.5" /></Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
