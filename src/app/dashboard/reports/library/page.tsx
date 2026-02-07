"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Search,
    FileText,
    BookOpen,
    CalendarClock,
    Archive,
    RefreshCcw,
    Copy,
    FileSpreadsheet,
    FileBox,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const reportLinks = [
    { name: "Book Issue Report", icon: FileText, active: true },
    { name: "Book Due Report", icon: CalendarClock },
    { name: "Book Inventory Report", icon: Archive },
    { name: "Book Issue Return Report", icon: RefreshCcw },
];

interface LibraryIssue {
    title: string;
    number: string;
    issueDate: string;
    dueDate: string;
    memberId: string;
    cardNo: string;
    admissionNo: string;
    issueBy: string;
    memberType: string;
}

const mockIssues: LibraryIssue[] = [
    { title: "Physical and Chemical Changes", number: "42355", issueDate: "01/01/2026", dueDate: "01/20/2026", memberId: "32", cardNo: "362", admissionNo: "18097", issueBy: "George Jany Sharon (18097)", memberType: "Student" },
    { title: "Human-environment interactions", number: "56328", issueDate: "01/01/2026", dueDate: "01/10/2026", memberId: "32", cardNo: "362", admissionNo: "18097", issueBy: "George Jany Sharon (18097)", memberType: "Student" },
    { title: "चन्द्र गहना से लौटती बेर", number: "5463", issueDate: "01/01/2026", dueDate: "01/25/2026", memberId: "32", cardNo: "362", admissionNo: "18097", issueBy: "George Jany Sharon (18097)", memberType: "Student" },
    { title: "Human-environment interactions", number: "56328", issueDate: "01/01/2026", dueDate: "01/24/2026", memberId: "38", cardNo: "433", admissionNo: "326260", issueBy: "Arpit Patel (326260)", memberType: "Student" },
    { title: "Physical and Chemical Changes", number: "42355", issueDate: "01/01/2026", dueDate: "01/22/2026", memberId: "38", cardNo: "433", admissionNo: "326260", issueBy: "Arpit Patel (326260)", memberType: "Student" },
    { title: "The Valley of Flowers", number: "80675", issueDate: "01/01/2026", dueDate: "01/05/2026", memberId: "29", cardNo: "321", admissionNo: "1800011", issueBy: "Edward Thomas (1800011)", memberType: "Student" },
    { title: "Environmental science", number: "98057", issueDate: "01/01/2026", dueDate: "01/23/2026", memberId: "17", cardNo: "00120", admissionNo: "18014", issueBy: "Devin Colmreach (18014)", memberType: "Student" },
    { title: "The Valley of Flowers", number: "80675", issueDate: "01/01/2026", dueDate: "01/18/2026", memberId: "27", cardNo: "00125", admissionNo: "18077", issueBy: "Dharambir Singh (18077)", memberType: "Student" },
    { title: "Environmental science", number: "98057", issueDate: "01/01/2026", dueDate: "01/26/2026", memberId: "27", cardNo: "00125", admissionNo: "18077", issueBy: "Dharambir Singh (18077)", memberType: "Student" },
    { title: "The Little Fir Tree", number: "64342", issueDate: "01/01/2026", dueDate: "01/17/2026", memberId: "27", cardNo: "00125", admissionNo: "18077", issueBy: "Dharambir Singh (18077)", memberType: "Student" },
];

export default function LibraryReportPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Library Report</h1>

            {/* Report Links Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-y-1 gap-x-6">
                    {reportLinks.map((link) => (
                        <div
                            key={link.name}
                            className={cn(
                                "flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors group",
                                link.active ? "bg-gray-100" : "hover:bg-gray-50"
                            )}
                        >
                            <link.icon className={cn("h-3.5 w-3.5", link.active ? "text-gray-700" : "text-gray-400 group-hover:text-gray-600")} />
                            <span className={cn("text-[10px] font-medium tracking-tight", link.active ? "text-gray-800" : "text-gray-500 group-hover:text-gray-700")}>
                                {link.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type</Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="this_week">This Week</SelectItem>
                                <SelectItem value="this_month">This Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Members Type</Label>
                        <Select defaultValue="all">
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5">
                        <Search className="h-3 w-3" />
                        Search
                    </Button>
                </div>
            </div>

            {/* Book Issue Report Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Book Issue Report</h2>

                {/* Table Toolbar */}
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
                                <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none ring-0">
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
                            {[Copy, FileSpreadsheet, FileBox, FileText, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1500px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">Book Title <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Book Number <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Issue Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Due Return Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Member ID <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Library Card Number <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Admission No <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Issue By <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-right">Members Type</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockIssues.map((issue, idx) => (
                                <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{issue.title}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{issue.number}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{issue.issueDate}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{issue.dueDate}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{issue.memberId}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{issue.cardNo}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{issue.admissionNo}</TableCell>
                                    <TableCell className="py-3 px-4 text-indigo-600 font-medium">{issue.issueBy}</TableCell>
                                    <TableCell className="py-3 px-4 text-right text-gray-500">{issue.memberType}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>Showing 1 to 10 of 20 entries</div>
                    <div className="flex gap-1 items-center">
                        <ChevronLeft className="h-3.5 w-3.5 text-gray-300 cursor-pointer" />
                        <Button size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded shadow-sm">
                            1
                        </Button>
                        <Button size="sm" className="h-6 w-6 p-0 bg-transparent hover:bg-gray-100 text-gray-400 border-0 text-[10px] rounded">
                            2
                        </Button>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 cursor-pointer" />
                    </div>
                </div>
            </div>
        </div>
    );
}
