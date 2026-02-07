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
    Check
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CommunicationLog {
    id: string;
    title: string;
    description: string;
    date: string;
    scheduleDate?: string;
    isEmail: boolean;
    isSms: boolean;
    isGroup: boolean;
    isIndividual: boolean;
    isClass: boolean;
}

const mockLogs: CommunicationLog[] = [
    {
        id: "1",
        title: "Sports Day Events",
        description: "Games that are played on school sports days can be wide and varied. They can include straightforward sprints and longer races for all age groups as well as egg and spoon races.",
        date: "01/22/2026 02:50 pm",
        isEmail: false,
        isSms: true,
        isGroup: false,
        isIndividual: false,
        isClass: true
    },
    {
        id: "2",
        title: "Sports Day Events",
        description: "Games that are played on school sports days can be wide and varied. They can include straightforward sprints and longer races for all age groups as well as egg and spoon races.",
        date: "01/22/2026 02:49 pm",
        isEmail: false,
        isSms: true,
        isGroup: true,
        isIndividual: false,
        isClass: false
    },
    {
        id: "3",
        title: "Sports Day Events",
        description: "Games that are played on school sports days can be wide and varied. They can include straightforward sprints and longer races for all age groups as well as egg and spoon races.",
        date: "01/22/2026 02:48 pm",
        scheduleDate: "01/22/2026 01:47 pm",
        isEmail: false,
        isSms: true,
        isGroup: true,
        isIndividual: false,
        isClass: false
    },
    {
        id: "4",
        title: "Sports Day Events",
        description: "Games that are played on school sports days can be wide and varied. They can include straightforward sprints and longer races for all age groups as well as egg and spoon races.",
        date: "01/22/2026 02:44 pm",
        isEmail: true,
        isSms: false,
        isGroup: false,
        isIndividual: false,
        isClass: true
    },
    {
        id: "5",
        title: "Sports Day Events",
        description: "Games that are played on school sports days can be wide and varied. They can include straightforward sprints and longer races for all age groups as well as egg and spoon races.",
        date: "01/22/2026 02:43 pm",
        isEmail: true,
        isSms: false,
        isGroup: false,
        isIndividual: true,
        isClass: false
    },
    {
        id: "6",
        title: "National Republic Day",
        description: "India celebrated its 73rd Republic Day on the 26th of January, 2022. The constitution of India was adopted on the 26th of November, 1949 with Dr. B. R. Ambedkar as the Chairman of the Drafting Committee.",
        date: "01/22/2026 02:41 pm",
        isEmail: true,
        isSms: false,
        isGroup: true,
        isIndividual: false,
        isClass: false
    },
    {
        id: "7",
        title: "Annual Day Celebration",
        description: "A day in School - In this theme the program can showcase what all goes in school. The ringing of bell, the class, the love of teachers, happy-go-lucky punishments, all pranks, PTM, sports etc.",
        date: "01/06/2026 01:15 pm",
        scheduleDate: "12/02/2025 03:39 pm",
        isEmail: true,
        isSms: false,
        isGroup: false,
        isIndividual: false,
        isClass: true
    }
];

export default function EmailSmsLogPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-sm font-medium text-gray-800">Email / SMS Log</h1>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white h-8 px-4 text-[10px] font-bold uppercase transition-all rounded shadow-sm">
                    Delete Email Sms Log
                </Button>
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

                {/* Log Table */}
                <div className="rounded-md border border-gray-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 w-[150px]">Title</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Description</TableHead>
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
                            {mockLogs.map((log) => (
                                <TableRow key={log.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/20 transition-colors">
                                    <TableCell className="py-3.5 text-gray-800 font-medium align-top">{log.title}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500 max-w-[400px] leading-relaxed">
                                        {log.description}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-gray-500 align-top whitespace-pre-line">
                                        {log.date.split(' ').join('\n')}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-gray-500 align-top whitespace-pre-line">
                                        {log.scheduleDate ? log.scheduleDate.split(' ').join('\n') : "-"}
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
                                        {log.isClass && <Check className="h-3.5 w-3.5 mx-auto text-gray-800" />}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-right align-top">
                                        <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-2 border-t">
                    <div>
                        Showing 1 to {mockLogs.length} of {mockLogs.length} entries
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
