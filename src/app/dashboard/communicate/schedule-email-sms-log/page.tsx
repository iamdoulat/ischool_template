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
    Trash2,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Check,
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

interface ScheduledLog {
    id: string;
    title: string;
    message: string;
    date: string;
    scheduleDate: string;
    isEmail: boolean;
    isSms: boolean;
    isGroup: boolean;
    isIndividual: boolean;
    isClass: boolean;
}

const mockScheduledLogs: ScheduledLog[] = [
    {
        id: "1",
        title: "Online Classes",
        message: "Be very punctual in log in time, screen off time, activity time table etc. Be ready with necessary text books, note books, pen, pencil and other accessories before class begins. Make sure the device is sufficiently charged before the beginning of the class.",
        date: "02/04/2025 06:02 pm",
        scheduleDate: "02/12/2025 05:02 pm",
        isEmail: true,
        isSms: false,
        isGroup: true,
        isIndividual: false,
        isClass: false
    },
    {
        id: "2",
        title: "New Academic admission start (2025-26)",
        message: "NEW ADMISSIONS FOR THE NEXT SESSION 2025-26 ARE OPEN FROM CLASSES NURSERY TO CLASS-VIII FROM 1ST APRIL 2025.",
        date: "04/04/2025 01:27 pm",
        scheduleDate: "04/05/2025 11:27 am",
        isEmail: true,
        isSms: false,
        isGroup: true,
        isIndividual: false,
        isClass: false
    },
    {
        id: "3",
        title: "International Yoga Day",
        message: "International Yoga Day, celebrated annually on June 21st, offers schools a valuable opportunity to promote physical and mental well-being. Schools often organize yoga sessions, demonstrations of asanas, and awareness campaigns to introduce students to the benefits of yoga.",
        date: "06/03/2025 08:33 pm",
        scheduleDate: "06/21/2025 07:00 am",
        isEmail: true,
        isSms: false,
        isGroup: true,
        isIndividual: false,
        isClass: false
    },
    {
        id: "4",
        title: "Annual Day Celebration",
        message: "A day in School - In this theme the program can showcase what all goes in school. The ringing of bell, the class, the love of teachers, happy-go-lucky punishments, all pranks, PTM, sports etc.",
        date: "01/06/2026 01:15 pm",
        scheduleDate: "12/02/2025 03:39 pm",
        isEmail: true,
        isSms: false,
        isGroup: false,
        isIndividual: false,
        isClass: true
    },
    {
        id: "5",
        title: "Sports Day Events",
        message: "Games that are played on school sports days can be wide and varied. They can include straightforward sprints and longer races for all age groups as well as egg and spoon races.",
        date: "01/22/2026 02:48 pm",
        scheduleDate: "01/22/2026 01:47 pm",
        isEmail: false,
        isSms: true,
        isGroup: true,
        isIndividual: false,
        isClass: false
    }
];

export default function ScheduleEmailSmsLogPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredLogs = mockScheduledLogs.filter(log =>
        log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-sm font-medium text-gray-800 uppercase tracking-tight">Schedule Email SMS Log</h1>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                {/* Toolbar */}
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
                            {[Copy, FileSpreadsheet, FileText, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Scheduled Log Table */}
                <div className="rounded-md border border-gray-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 w-[150px]">Title</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Message</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 w-[120px]">Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 w-[120px]">Schedule Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Email</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">SMS</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Group</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Individual</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Class</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.map((log) => (
                                <TableRow key={log.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/20 transition-colors">
                                    <TableCell className="py-3.5 text-gray-800 font-medium align-top">{log.title}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500 max-w-[400px] leading-relaxed">
                                        {log.message}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-gray-400 align-top whitespace-pre-line text-[10px] font-medium">
                                        {log.date.split(' ').join('\n')}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-gray-400 align-top whitespace-pre-line text-[10px] font-medium">
                                        {log.scheduleDate.split(' ').join('\n')}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center">
                                        {log.isEmail && <Check className="h-3.5 w-3.5 mx-auto text-gray-800" />}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center">
                                        {log.isSms && <Check className="h-3.5 w-3.5 mx-auto text-gray-800" />}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center">
                                        {log.isGroup && <Check className="h-3.5 w-3.5 mx-auto text-gray-800" />}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center">
                                        {log.isIndividual && <Check className="h-3.5 w-3.5 mx-auto text-gray-800" />}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center">
                                        {log.isClass ? <Check className="h-3.5 w-3.5 mx-auto text-gray-800" /> : <X className="h-3 w-3 mx-auto text-gray-300" />}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-right align-top">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                <Columns className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Info */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-2">
                    <div>
                        Showing 1 to {filteredLogs.length} of {mockScheduledLogs.length} entries
                    </div>
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600">‹</span>
                        <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0">
                            1
                        </Button>
                        <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600">›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
