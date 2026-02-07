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

interface Event {
    id: string;
    title: string;
    date: string;
    venue: string;
}

const mockEvents: Event[] = [
    { id: "1", title: "World Radio Day", date: "02/13/2026", venue: "Class Room" },
    { id: "2", title: "Republic Day Celebration", date: "01/23/2026 - 01/26/2026", venue: "School Ground" },
    { id: "3", title: "Math Exhibition Model", date: "12/01/2025 - 12/10/2025", venue: "School Hall Room" },
    { id: "4", title: "National Mathematics Day Celebration", date: "12/20/2025 - 12/24/2025", venue: "School Hall Room" },
    { id: "5", title: "Children's day program by teachers", date: "11/11/2025 - 11/20/2025", venue: "School Hall Room" },
    { id: "6", title: "School Spirit Rally", date: "10/15/2025 - 10/25/2025", venue: "School Ground" },
    { id: "7", title: "School Year Preparation Workshops", date: "10/05/2025 - 10/15/2025", venue: "School Hall Room" },
    { id: "8", title: "Teachers' Day Celebration", date: "09/01/2025 - 09/05/2025", venue: "School Hall Room" },
    { id: "9", title: "Happy Independence Day Celebration", date: "08/05/2025 - 08/15/2025", venue: "School Ground" },
    { id: "10", title: "English Recitation Competition", date: "08/01/2025 - 08/20/2025", venue: "School Hall Room" },
    { id: "11", title: "National Level Workshop for Science Teachers Teaching in Class X to XII (Online)", date: "07/07/2025 - 07/15/2025", venue: "School Hall Room" },
    { id: "12", title: "Conducting of NCSC 2025-26 School Level", date: "06/02/2025 - 06/30/2025", venue: "School Play Ground" },
    { id: "13", title: "Summer School Programme", date: "05/01/2025 - 05/30/2025", venue: "School Hall Room" },
    { id: "14", title: "Books Mela", date: "04/04/2025 - 04/30/2025", venue: "School Play Ground" },
    { id: "15", title: "Building Leadership Skills camp", date: "04/02/2025 - 04/30/2025", venue: "School Hall Room" },
    { id: "16", title: "Summer Learning Activities", date: "04/01/2025 - 04/30/2025", venue: "School Hall Room" },
];

export default function EventListPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredEvents = mockEvents.filter((event) =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <h2 className="text-sm font-semibold text-gray-800 tracking-tight">Event List</h2>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        Add
                    </Button>
                </div>

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
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[800px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Title <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Date <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Venue <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEvents.map((event) => (
                                <TableRow key={event.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{event.title}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{event.date}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{event.venue}</TableCell>
                                    <TableCell className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
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

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>
                        Showing 1 to {filteredEvents.length} of {mockEvents.length} entries
                    </div>
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600 text-[10px]">‹</span>
                        <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded shadow-sm">
                            1
                        </Button>
                        <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600 text-[10px]">›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
