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
    Users,
    CalendarCheck,
    ClipboardList,
    UserCheck,
    CalendarDays,
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
    {
        group: [
            { name: "Attendance Report", icon: FileText, active: true },
            { name: "Student Day Wise Attendance Report", icon: ClipboardList },
        ]
    },
    {
        group: [
            { name: "Student Attendance Type Report", icon: Users },
            { name: "Staff Day Wise Attendance Report", icon: ClipboardList },
        ]
    },
    {
        group: [
            { name: "Daily Attendance Report", icon: CalendarCheck },
            { name: "Staff Attendance Report", icon: UserCheck },
        ]
    }
];

interface AttendanceRow {
    name: string;
    percentage: string;
    p: number;
    l: number;
    a: number;
    h: number;
    f: number;
    grid: (string | null)[];
}

const mockStudents: AttendanceRow[] = [
    "Ashwani Kumar", "Edward Thomas", "xavier bartlett", "Nahal Wadhera", "Steven Taylor",
    "Georgia Wareham", "James Bennett", "Edward Thomas", "Niharika", "Matthew Bacon",
    "RAM", "Nidhi Verma", "AVYAAN"
].map(name => ({
    name,
    percentage: name === "Ashwani Kumar" ? "-" : "100.00",
    p: 0, l: 0, a: 0, h: 0, f: 0,
    grid: Array(28).fill(null)
}));

const DAYS_HEADER = [
    { d: "01", n: "Sat" }, { d: "02", n: "Sun" }, { d: "03", n: "Mon" }, { d: "04", n: "Tue" }, { d: "05", n: "Wed" },
    { d: "06", n: "Thu" }, { d: "07", n: "Fri" }, { d: "08", n: "Sat" }, { d: "09", n: "Sun" }, { d: "10", n: "Mon" },
    { d: "11", n: "Tue" }, { d: "12", n: "Wed" }, { d: "13", n: "Thu" }, { d: "14", n: "Fri" }, { d: "15", n: "Sat" },
    { d: "16", n: "Sun" }, { d: "17", n: "Mon" }, { d: "18", n: "Tue" }, { d: "19", n: "Wed" }, { d: "20", n: "Thu" },
    { d: "21", n: "Fri" }, { d: "22", n: "Sat" }, { d: "23", n: "Sun" }, { d: "24", n: "Mon" }, { d: "25", n: "Tue" },
    { d: "26", n: "Wed" }, { d: "27", n: "Thu" }, { d: "28", n: "Fri" }
];

export default function AttendanceReportPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Attendance Report</h1>

            {/* Report Links Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {reportLinks.map((col, idx) => (
                        <div key={idx} className="space-y-1">
                            {col.group.map((link) => (
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
                    ))}
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                        <Select defaultValue="c1">
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500 outline-none ring-0 focus-visible:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="c1">Class 1</SelectItem>
                                <SelectItem value="c2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section <span className="text-red-500">*</span></Label>
                        <Select defaultValue="a">
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Month <span className="text-red-500">*</span></Label>
                        <Select defaultValue="feb">
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="jan">January</SelectItem>
                                <SelectItem value="feb">February</SelectItem>
                                <SelectItem value="mar">March</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Year</Label>
                        <Select defaultValue="2025">
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2025">2025</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end lg:justify-start">
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5">
                            <Search className="h-3 w-3" />
                            Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* Attendance Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-gray-50 pb-4">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Student Attendance Report</h2>
                    <div className="flex items-center gap-3 text-[9px] font-bold text-gray-500">
                        <span className="flex items-center gap-1">Present: <span className="text-emerald-500">P</span></span>
                        <span className="flex items-center gap-1">Late: <span className="text-amber-500">L</span></span>
                        <span className="flex items-center gap-1">Absent: <span className="text-red-500">A</span></span>
                        <span className="flex items-center gap-1">Holiday: <span className="text-blue-500">H</span></span>
                        <span className="flex items-center gap-1">Half Day: <span className="text-indigo-500">F</span></span>
                    </div>
                </div>

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

                {/* Horizontal Scroll Table */}
                <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-full">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-2.5 px-3 min-w-[150px] sticky left-0 bg-gray-50 z-10">Student / Date</TableHead>
                                <TableHead className="py-2.5 px-3 text-center">(%)</TableHead>
                                <TableHead className="py-2.5 px-1.5 text-center text-emerald-600">P</TableHead>
                                <TableHead className="py-2.5 px-1.5 text-center text-amber-600">L</TableHead>
                                <TableHead className="py-2.5 px-1.5 text-center text-red-600">A</TableHead>
                                <TableHead className="py-2.5 px-1.5 text-center text-blue-600">H</TableHead>
                                <TableHead className="py-2.5 px-1.5 text-center text-indigo-600 border-r border-gray-100">F</TableHead>
                                {DAYS_HEADER.map((day, idx) => (
                                    <TableHead key={idx} className={cn(
                                        "py-2.5 px-2 text-center border-r border-gray-100 last:border-r-0 min-w-[40px]",
                                        (day.n === "Sun" || day.n === "Sat") && "text-blue-500"
                                    )}>
                                        <div className="flex flex-col leading-tight">
                                            <span>{day.d}</span>
                                            <span className="text-[8px] opacity-60 font-medium">{day.n}</span>
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockStudents.map((student, sIdx) => (
                                <TableRow key={sIdx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <TableCell className="py-2.5 px-3 font-medium text-indigo-600 hover:underline cursor-pointer sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        {student.name}
                                    </TableCell>
                                    <TableCell className="py-2.5 px-3 text-center">
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded text-[8px] font-bold",
                                            student.percentage === "-" ? "bg-gray-400 text-white" : "bg-emerald-500 text-white"
                                        )}>
                                            {student.percentage}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-2.5 px-1.5 text-center text-gray-500">{student.p}</TableCell>
                                    <TableCell className="py-2.5 px-1.5 text-center text-gray-500">{student.l}</TableCell>
                                    <TableCell className="py-2.5 px-1.5 text-center text-gray-500">{student.a}</TableCell>
                                    <TableCell className="py-2.5 px-1.5 text-center text-gray-500">{student.h}</TableCell>
                                    <TableCell className="py-2.5 px-1.5 text-center text-gray-500 border-r border-gray-100">{student.f}</TableCell>
                                    {student.grid.map((cell, cIdx) => (
                                        <TableCell key={cIdx} className="py-2.5 px-2 text-center border-r border-gray-100 last:border-r-0 text-gray-300">
                                            -
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>Showing 1 to 13 of 13 entries</div>
                    <div className="flex gap-1 items-center">
                        <ChevronLeft className="h-3.5 w-3.5 text-gray-300 cursor-pointer hover:text-gray-500" />
                        <Button size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded shadow-sm">
                            1
                        </Button>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 cursor-pointer hover:text-gray-500" />
                    </div>
                </div>
            </div>
        </div>
    );
}
