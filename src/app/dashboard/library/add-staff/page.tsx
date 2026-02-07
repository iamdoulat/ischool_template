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
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    RotateCcw,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface StaffMember {
    id: string;
    memberId: string;
    libraryCardNo: string;
    staffName: string;
    email: string;
    dob: string;
    phone: string;
    isMember: boolean;
}

const mockStaff: StaffMember[] = [
    { id: "1", memberId: "31", libraryCardNo: "453", staffName: "Joe Black (9000)", email: "superadmin@gmail.com", dob: "01/01/1988", phone: "6545645645", isMember: true },
    { id: "2", memberId: "2", libraryCardNo: "00156", staffName: "Shivam Verma (9002)", email: "manishp@gmail.com", dob: "06/18/1982", phone: "9562654564", isMember: true },
    { id: "3", memberId: "3", libraryCardNo: "00146", staffName: "Brandon Heart (9003)", email: "brandong@gmail.com", dob: "03/04/1988", phone: "34564654", isMember: true },
    { id: "4", memberId: "", libraryCardNo: "", staffName: "William Abbot (9002)", email: "william@gmail.com", dob: "05/03/1982", phone: "56465465", isMember: false },
    { id: "5", memberId: "20", libraryCardNo: "789", staffName: "Jason Sharkey (90006)", email: "jason@gmail.com", dob: "05/15/1980", phone: "46545654564", isMember: true },
    { id: "6", memberId: "5", libraryCardNo: "001758", staffName: "James Decker (9004)", email: "james.decker@gmail.com", dob: "10/01/1987", phone: "78785545453", isMember: true },
    { id: "7", memberId: "4", libraryCardNo: "00147", staffName: "Maria Ford (9005)", email: "maria.ford@gmail.com", dob: "02/10/1992", phone: "8521479530", isMember: true },
    { id: "8", memberId: "", libraryCardNo: "", staffName: "Nishant Khare (1002)", email: "nishant@gmail.com", dob: "12/11/2000", phone: "9865757657", isMember: false },
    { id: "9", memberId: "", libraryCardNo: "", staffName: "aman (GS4)", email: "aman@gmail.com", dob: "01/14/2025", phone: "", isMember: false },
];

export default function AddStaffLibraryPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredStaff = mockStaff.filter((staff) =>
        staff.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            {/* Staff Member List Section */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                <h2 className="text-sm font-medium text-gray-800">Staff Member List</h2>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">50</span>
                            <Select defaultValue="50">
                                <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded">
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
                            {[Copy, FileSpreadsheet, FileText, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded text-gray-400">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* List Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Member ID <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Library Card No.</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Staff Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Email <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Date Of Birth <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Phone <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStaff.map((staff) => (
                                <TableRow
                                    key={staff.id}
                                    className={cn(
                                        "text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap",
                                        staff.isMember && "bg-[#e8f5e9]/60 hover:bg-[#c8e6c9]/60" // Light green for members
                                    )}
                                >
                                    <TableCell className="py-3 text-gray-500">{staff.memberId}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{staff.libraryCardNo}</TableCell>
                                    <TableCell className="py-3 text-gray-700 font-medium">{staff.staffName}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{staff.email}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{staff.dob}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{staff.phone || "-"}</TableCell>
                                    <TableCell className="py-3 text-right">
                                        <Button size="icon" variant="ghost" className="h-6 w-6 bg-[#6366f1] hover:bg-[#5558dd] text-white rounded shadow-sm">
                                            {staff.isMember ? (
                                                <RotateCcw className="h-3 w-3" />
                                            ) : (
                                                <Plus className="h-3.5 w-3.5 font-bold" />
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>
                        Showing 1 to {filteredStaff.length} of {mockStaff.length} entries
                    </div>
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600 text-[10px]">‹</span>
                        <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded">
                            1
                        </Button>
                        <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600 text-[10px]">›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
