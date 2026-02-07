"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Pencil,
    Eye,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    History
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PayrollRecord {
    id: string;
    staffId: string;
    name: string;
    role: string;
    department: string;
    designation: string;
    phone: string;
    status: "Generated" | "Paid" | "Unpaid";
}

const mockPayrollData: PayrollRecord[] = [
    {
        id: "1",
        staffId: "9005",
        name: "Maria Ford",
        role: "Receptionist",
        department: "Academic",
        designation: "Receptionist",
        phone: "8521479630",
        status: "Generated"
    }
];

export default function PayrollPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800">Payroll</h1>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                            Role <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="receptionist">
                            <SelectTrigger className="h-9 border-gray-200 text-sm focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="receptionist">Receptionist</SelectItem>
                                <SelectItem value="accountant">Accountant</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                            Month <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="january">
                            <SelectTrigger className="h-9 border-gray-200 text-sm focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="january">January</SelectItem>
                                <SelectItem value="february">February</SelectItem>
                                <SelectItem value="march">March</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                            Year <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="2026">
                            <SelectTrigger className="h-9 border-gray-200 text-sm focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2026">2026</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-8 px-6 text-xs shadow-sm transition-all rounded">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            {/* Staff List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800 border-b pb-2">Staff List</h2>

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
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Staff ID</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Name</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Role</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Department</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Designation</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Phone</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Status</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockPayrollData.map((staff) => (
                                <TableRow key={staff.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/20 transition-colors">
                                    <TableCell className="py-3.5 text-gray-500">{staff.staffId}</TableCell>
                                    <TableCell className="py-3.5 text-gray-800 font-medium">{staff.name}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{staff.role}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{staff.department}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{staff.designation}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{staff.phone}</TableCell>
                                    <TableCell className="py-3.5">
                                        <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                            {staff.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                <History className="h-3 w-3" />
                                            </Button>
                                            <Button className="h-6 px-3 bg-[#6366f1] hover:bg-[#5558dd] text-white text-[9px] font-bold uppercase rounded shadow-sm">
                                                Proceed To Pay
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
                        Showing 1 to {mockPayrollData.length} of {mockPayrollData.length} entries
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
