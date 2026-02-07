"use client";

import { useState } from "react";
import Link from "next/link";
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
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowRightSquare,
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

interface LibraryMember {
    id: string;
    memberId: string;
    libraryCardNo: string;
    admissionNo: string;
    name: string;
    memberType: string;
    phone: string;
}

const mockMembers: LibraryMember[] = [
    { id: "1", memberId: "7", libraryCardNo: "0013", admissionNo: "18002", name: "Robin Peterson", memberType: "Student", phone: "9465454545" },
    { id: "2", memberId: "8", libraryCardNo: "0115", admissionNo: "18005", name: "Glen Stark", memberType: "Student", phone: "9858471234" },
    { id: "3", memberId: "9", libraryCardNo: "00185", admissionNo: "18007", name: "Brian Kohler", memberType: "Student", phone: "9465454445" },
    { id: "4", memberId: "10", libraryCardNo: "0101", admissionNo: "18004", name: "Laura Clinton", memberType: "Student", phone: "9445454554" },
    { id: "5", memberId: "11", libraryCardNo: "12W", admissionNo: "18023", name: "Karuna Rana", memberType: "Student", phone: "7412589530" },
    { id: "6", memberId: "14", libraryCardNo: "001L", admissionNo: "18020", name: "Jhony Taylor", memberType: "Student", phone: "67878878" },
    { id: "7", memberId: "15", libraryCardNo: "102L", admissionNo: "18025", name: "Jhonson wood", memberType: "Student", phone: "8776882879" },
    { id: "8", memberId: "16", libraryCardNo: "100", admissionNo: "18008", name: "David Heart", memberType: "Student", phone: "645646544" },
    { id: "9", memberId: "17", libraryCardNo: "00120", admissionNo: "18014", name: "Devin Donnach", memberType: "Student", phone: "7896541235" },
    { id: "10", memberId: "18", libraryCardNo: "210", admissionNo: "18009", name: "Kavya Roy", memberType: "Student", phone: "9874581321" },
    { id: "11", memberId: "19", libraryCardNo: "254", admissionNo: "18029", name: "Rahul Sinha", memberType: "Student", phone: "6985471235" },
    { id: "12", memberId: "20", libraryCardNo: "895", admissionNo: "18028", name: "Rahul Sinha", memberType: "Student", phone: "7418529530" },
    { id: "13", memberId: "21", libraryCardNo: "987", admissionNo: "18010", name: "Kriti Singh", memberType: "Student", phone: "185485415" },
    { id: "14", memberId: "22", libraryCardNo: "845", admissionNo: "18006", name: "Simon Peterson", memberType: "Student", phone: "9485454545" },
    { id: "15", memberId: "23", libraryCardNo: "231", admissionNo: "18003", name: "Nicolas Fleming", memberType: "Student", phone: "54848548" },
];

export default function IssueReturnPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredMembers = mockMembers.filter((member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.memberId.includes(searchTerm) ||
        member.admissionNo.includes(searchTerm)
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-sm font-medium text-gray-800 tracking-tight">Members</h1>
            </div>

            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4">
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

                {/* Members Table */}
                <div className="rounded border border-gray-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">
                                        Member ID <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">
                                        Library Card No. <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">
                                        Admission No <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">
                                        Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">
                                        Member Type <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">
                                        Phone <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMembers.map((member) => (
                                <TableRow key={member.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                    <TableCell className="py-3 text-gray-500">{member.memberId}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{member.libraryCardNo}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{member.admissionNo}</TableCell>
                                    <TableCell className="py-3 text-gray-700 font-medium">{member.name}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{member.memberType}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{member.phone}</TableCell>
                                    <TableCell className="py-3 text-right">
                                        <Link href={`/dashboard/library/member/issue/${member.memberId}`}>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                <ArrowRightSquare className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>
                        Showing 1 to {filteredMembers.length} of {mockMembers.length} entries
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
