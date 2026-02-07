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
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    Eye,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

interface CalendarEntry {
    id: string;
    date: string;
    type: string;
    description: string;
    createdBy: string;
    frontSite: string;
}

const mockCalendarData: CalendarEntry[] = [
    {
        id: "1",
        date: "02/20/2026 To 02/24/2026",
        type: "Activity",
        description: "Students will present science projects and innovative models in the exhibition. Parents and students are invited to visit and encourage participants.",
        createdBy: "Joe Black (9000)",
        frontSite: "No"
    },
    {
        id: "2",
        date: "02/11/2026 To 02/14/2026",
        type: "School Events",
        description: "Annual Sports Day",
        createdBy: "Joe Black (9000)",
        frontSite: "Yes"
    },
    {
        id: "3",
        date: "01/22/2026 To 01/22/2026",
        type: "Holiday",
        description: "campus selection",
        createdBy: "Joe Black (9000)",
        frontSite: "Yes"
    },
    {
        id: "4",
        date: "11/13/2025 To 11/14/2025",
        type: "Activity",
        description: "Children's Day, also known as 'Bal Diwas', is celebrated in India on November 14 to commemorate the birth anniversary of Jawaharlal Nehru, who advocated for children's education and rights.",
        createdBy: "Joe Black (9000)",
        frontSite: "Yes"
    },
    {
        id: "5",
        date: "10/20/2025 To 10/23/2025",
        type: "Holiday",
        description: "Dear Parents, it is hereby to inform you that there will be Diwali celebration on 20th October 2025 (Monday), from 8AM to 1PM. The dress code for this occasion will be traditional party wear. Students can bring small kandil, rangoli and diya to decorate their classroom.",
        createdBy: "Joe Black (9000)",
        frontSite: "Yes"
    },
    {
        id: "6",
        date: "09/01/2025 To 09/05/2025",
        type: "Activity",
        description: "Schools are organizing various cultural programs, such as dances, songs, and speeches, to celebrate Teacher's Day on September 5th, honoring the dedication of educators. Students often participate enthusiastically, writing original speeches and taking part in competitions to express their appreciation for teachers' efforts in shaping their futures.",
        createdBy: "Joe Black (9000)",
        frontSite: "Yes"
    },
    {
        id: "7",
        date: "08/14/2025 To 08/15/2025",
        type: "Activity",
        description: "Happy Independence Day! Let's celebrate the freedom and unity of our nation, remembering the sacrifices of our heroes and striving for a better future. Wishing you a day filled with joy, pride, and patriotic spirit.",
        createdBy: "Joe Black (9000)",
        frontSite: "Yes"
    },
    {
        id: "8",
        date: "07/20/2025 To 07/30/2025",
        type: "Activity",
        description: "Van Mahotsav, a week-long festival celebrating trees, is often celebrated in schools with tree planting, awareness campaigns, and creative activities. Schools use this opportunity to instill a sense of environmental responsibility in students and promote the importance of trees for a healthy planet.",
        createdBy: "Joe Black (9000)",
        frontSite: "Yes"
    }
];

export default function AnnualCalendarPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold text-gray-800">Annual Calendar</h1>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-9 px-4 text-sm font-medium transition-all shadow-sm">
                    <Plus className="h-4 w-4" /> Add
                </Button>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="type" className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2 items-center">
                        <Select defaultValue="holiday">
                            <SelectTrigger id="type" className="w-full md:w-[300px] h-10 border-gray-200">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="holiday">Holiday</SelectItem>
                                <SelectItem value="activity">Activity</SelectItem>
                                <SelectItem value="school_event">School Events</SelectItem>
                                <SelectItem value="vacation">Vacation</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-10 px-6 transition-all shadow-sm">
                            <Search className="h-4 w-4" /> Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* Calendar List Section */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-medium text-gray-800">Calendar List</h2>
                </div>

                <div className="p-4 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search"
                                className="pl-9 h-9 border-gray-200 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-sm text-gray-500">50</span>
                                <Select defaultValue="50">
                                    <SelectTrigger className="w-16 h-8 text-xs border-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-1 border-l pl-3 border-gray-100">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-[#6366f1] hover:bg-indigo-50">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-[#6366f1] hover:bg-indigo-50">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-[#6366f1] hover:bg-indigo-50">
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-[#6366f1] hover:bg-indigo-50">
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-[#6366f1] hover:bg-indigo-50">
                                    <Columns className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border border-gray-100 overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="font-semibold text-gray-700">Date</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Type</TableHead>
                                    <TableHead className="font-semibold text-gray-700 min-w-[300px]">Description</TableHead>
                                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Created By</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Front Site</TableHead>
                                    <TableHead className="font-semibold text-gray-700 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockCalendarData.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <TableCell className="text-sm font-medium text-gray-700 whitespace-nowrap">{item.date}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                {item.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600 leading-relaxed italic pr-4">
                                            "{item.description}"
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{item.createdBy}</TableCell>
                                        <TableCell className="text-sm">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.frontSite === "Yes" ? "bg-green-50 text-green-700 border border-green-100" : "bg-gray-50 text-gray-600 border border-gray-100"
                                                }`}>
                                                {item.frontSite}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 pt-2 font-medium">
                        <div>
                            Showing 1 to {mockCalendarData.length} of {mockCalendarData.length} entries
                        </div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200" disabled>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="default" size="sm" className="h-8 w-8 p-0 bg-[#6366f1] border-0 text-white shadow-sm">
                                1
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200" disabled>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
