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
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    Plus,
    Eye,
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

interface AlumniEvent {
    id: string;
    title: string;
    classSection: string;
    passOutSession: string;
    from: string;
    to: string;
}

const mockEvents: AlumniEvent[] = [
    {
        id: "1",
        title: "Christmas Celebration",
        classSection: "All",
        passOutSession: "All",
        from: "12/22/2025",
        to: "12/26/2025",
    },
    {
        id: "2",
        title: "New Academic admission start (2025-26)",
        classSection: "All",
        passOutSession: "All",
        from: "04/01/2025",
        to: "04/15/2025",
    },
    {
        id: "3",
        title: "Government scholarship exam, 2024",
        classSection: "All",
        passOutSession: "All",
        from: "10/14/2024",
        to: "10/20/2024",
    },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AlumniEventsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    // Simple Mock Calendar Generator for Feb 2026
    const generateCalendarDays = () => {
        const days = [];
        // Prev month days
        for (let i = 26; i <= 31; i++) days.push({ day: i, type: "prev" });
        // Feb 2026 days
        for (let i = 1; i <= 28; i++) days.push({ day: i, type: "current" });
        // Next month days
        for (let i = 1; i <= 8; i++) days.push({ day: i, type: "next" });
        return days;
    };

    const calendarDays = generateCalendarDays();

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col xl:flex-row gap-6">
                {/* Left Section: Calendar */}
                <div className="w-full xl:w-[60%]">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <h2 className="text-sm font-medium text-gray-700">February 2026</h2>
                            <div className="w-14" /> {/* Spacer */}
                        </div>

                        <div className="grid grid-cols-7 border-t border-l border-gray-100">
                            {DAYS.map((day) => (
                                <div key={day} className="py-2 text-center text-[10px] font-bold text-gray-500 border-r border-b border-gray-100 bg-gray-50/50">
                                    {day}
                                </div>
                            ))}
                            {calendarDays.map((date, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "h-24 p-2 border-r border-b border-gray-100 transition-colors hover:bg-gray-50/30 text-right font-medium",
                                        date.type !== "current" ? "text-gray-200" : "text-gray-400"
                                    )}
                                >
                                    {date.day}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Section: Event List */}
                <div className="flex-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                            <h2 className="text-sm font-medium text-gray-800 tracking-tight">Event List</h2>
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5">
                                <Plus className="h-3.5 w-3.5" />
                                Add Event
                            </Button>
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
                                        <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                            <Icon className="h-3.5 w-3.5" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Table View */}
                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[600px]">
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4 flex items-center gap-1 cursor-pointer">
                                            Event Title <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                        </TableHead>
                                        <TableHead className="py-3 px-4">
                                            <div className="flex items-center gap-1 cursor-pointer">
                                                Class Section <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="py-3 px-4">
                                            <div className="flex items-center gap-1 cursor-pointer">
                                                Pass Out Session <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="py-3 px-4">
                                            <div className="flex items-center gap-1 cursor-pointer">
                                                From <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="py-3 px-4">
                                            <div className="flex items-center gap-1 cursor-pointer">
                                                To <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="py-3 px-4 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockEvents.map((event) => (
                                        <TableRow key={event.id} className="text-[10px] sm:text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="py-3 px-4 text-gray-700 font-medium whitespace-nowrap">{event.title}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500 text-[9px] font-bold uppercase tracking-tight">{event.classSection}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500 text-[9px] font-bold uppercase tracking-tight">{event.passOutSession}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{event.from}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{event.to}</TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Table Footer */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
                            <div>Showing 1 to 3 of 3 entries</div>
                            <div className="flex gap-1 items-center">
                                <ChevronLeft className="h-3.5 w-3.5 text-gray-300 cursor-not-allowed" />
                                <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded shadow-sm">
                                    1
                                </Button>
                                <ChevronRight className="h-3.5 w-3.5 text-gray-300 cursor-not-allowed" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
