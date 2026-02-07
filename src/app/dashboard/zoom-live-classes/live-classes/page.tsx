"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Video, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight, X, CheckSquare } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LiveClass {
    id: string;
    classTitle: string;
    description: string;
    dateTime: string;
    duration: number;
    apiUsed: "Self" | "Global";
    createdBy: string;
    createdFor: string;
    classes: string[];
    status: "Awaited" | "Finished" | "Cancelled";
}

const liveClasses: LiveClass[] = [
    {
        id: "1",
        classTitle: "Aptitude Test-series Discussion",
        description: "Aptitude Test-series Discussion",
        dateTime: "02/28/2026 15:50:00",
        duration: 35,
        apiUsed: "Global",
        createdBy: "Joe Black (Teacher : 9000)",
        createdFor: "Jason Sharlton (Teacher : 90006)",
        classes: ["Class 5 (A)", "Class 5 (B)", "Class 5 (C)", "Class 5 (D)"],
        status: "Awaited",
    },
    {
        id: "2",
        classTitle: "Computer Studies Classes",
        description: "Computer Studies Classes",
        dateTime: "02/20/2026 15:00:00",
        duration: 35,
        apiUsed: "Global",
        createdBy: "Joe Black (Teacher : 9000)",
        createdFor: "aman (Teacher : 654)",
        classes: ["Class 4 (A)", "Class 4 (B)", "Class 4 (C)", "Class 4 (D)"],
        status: "Awaited",
    },
    {
        id: "3",
        classTitle: "Hindi Online class",
        description: "Hindi Online class",
        dateTime: "02/17/2026 15:47:00",
        duration: 45,
        apiUsed: "Global",
        createdBy: "Joe Black (Teacher : 9000)",
        createdFor: "Nishant Khare (Teacher : 1002)",
        classes: ["Class 3 (A)", "Class 3 (B)", "Class 3 (C)", "Class 3 (D)"],
        status: "Awaited",
    },
    {
        id: "4",
        classTitle: "EVS Extra Classes",
        description: "EVS Extra Classes",
        dateTime: "02/13/2026 15:46:00",
        duration: 35,
        apiUsed: "Global",
        createdBy: "Joe Black (Admin : 9000)",
        createdFor: "William Abbot (Admin : 9003)",
        classes: ["Class 2 (A)", "Class 2 (B)", "Class 2 (C)", "Class 2 (D)"],
        status: "Awaited",
    },
    {
        id: "5",
        classTitle: "Online Course Class",
        description: "",
        dateTime: "02/07/2026 15:29:00",
        duration: 35,
        apiUsed: "Global",
        createdBy: "Joe Black (Teacher : 9000)",
        createdFor: "Jason Sharlton (Teacher : 90006)",
        classes: ["Class 2 (A)", "Class 2 (B)", "Class 2 (C)", "Class 2 (D)"],
        status: "Awaited",
    },
    {
        id: "6",
        classTitle: "Social Studies Classes",
        description: "",
        dateTime: "02/04/2026 15:27:00",
        duration: 20,
        apiUsed: "Global",
        createdBy: "Joe Black (Teacher : 9000)",
        createdFor: "Shivam Verma (Teacher : 9002)",
        classes: ["Class 1 (A)", "Class 1 (B)", "Class 1 (C)", "Class 1 (D)"],
        status: "Awaited",
    },
    {
        id: "7",
        classTitle: "English Chapter One",
        description: "",
        dateTime: "02/04/2026 15:18:00",
        duration: 25,
        apiUsed: "Global",
        createdBy: "Joe Black (Teacher : 9000)",
        createdFor: "Shivam Verma (Teacher : 9002)",
        classes: ["Class 1 (A)", "Class 1 (B)", "Class 1 (C)", "Class 1 (D)"],
        status: "Awaited",
    },
    {
        id: "8",
        classTitle: "Maths Discussion",
        description: "Maths Discussion",
        dateTime: "01/30/2026 03:00:00",
        duration: 45,
        apiUsed: "Global",
        createdBy: "Joe Black (Teacher : 9000)",
        createdFor: "Albert Thomas (Teacher : 5454554)",
        classes: ["Class 1 (A)", "Class 1 (B)", "Class 1 (C)", "Class 1 (D)"],
        status: "Awaited",
    },
    {
        id: "9",
        classTitle: "Online Course Class",
        description: "Online Course Class",
        dateTime: "01/26/2026 05:00:00",
        duration: 35,
        apiUsed: "Global",
        createdBy: "Joe Black (Teacher : 9000)",
        createdFor: "Shivam Verma (Teacher : 9002)",
        classes: ["Class 3 (A)", "Class 3 (B)", "Class 3 (C)", "Class 3 (D)"],
        status: "Awaited",
    },
    {
        id: "10",
        classTitle: "Social Studies Classes",
        description: "Social Studies Classes",
        dateTime: "01/22/2026 14:00:00",
        duration: 45,
        apiUsed: "Global",
        createdBy: "Joe Black (Teacher : 9000)",
        createdFor: "Shivam Verma (Teacher : 9002)",
        classes: ["Class 4 (A)", "Class 4 (B)", "Class 4 (C)", "Class 4 (D)"],
        status: "Awaited",
    },
];

export default function LiveClassesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    const filteredClasses = liveClasses.filter((item) =>
        item.classTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-800">Live Classes</h1>
                <div className="flex gap-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex w-full md:w-auto items-center gap-2">
                        <div className="relative w-full md:w-64 flex gap-2">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 pr-10"
                            />
                            <Button className="bg-gradient-to-r from-orange-400 to-indigo-600 text-white hover:opacity-90 transition-opacity">
                                Search
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                            <SelectTrigger className="w-[70px]">
                                <SelectValue placeholder="50" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <Columns className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 text-xs uppercase">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-600 whitespace-nowrap">Class Title</TableHead>
                                <TableHead className="font-semibold text-gray-600 whitespace-nowrap">Description</TableHead>
                                <TableHead className="font-semibold text-gray-600 whitespace-nowrap">Date Time</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-center whitespace-nowrap">Class Duration <br /> (Minutes)</TableHead>
                                <TableHead className="font-semibold text-gray-600 whitespace-nowrap">Api Used</TableHead>
                                <TableHead className="font-semibold text-gray-600 whitespace-nowrap">Created By</TableHead>
                                <TableHead className="font-semibold text-gray-600 whitespace-nowrap">Created For</TableHead>
                                <TableHead className="font-semibold text-gray-600 whitespace-nowrap">Class</TableHead>
                                <TableHead className="font-semibold text-gray-600 whitespace-nowrap">Status</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right whitespace-nowrap">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClasses.map((item) => (
                                <TableRow key={item.id} className="text-sm">
                                    <TableCell className="font-medium text-gray-700">{item.classTitle}</TableCell>
                                    <TableCell className="text-gray-600">{item.description}</TableCell>
                                    <TableCell className="text-gray-600">{item.dateTime}</TableCell>
                                    <TableCell className="text-center text-gray-600 text-xs">{item.duration}</TableCell>
                                    <TableCell className="text-gray-600">{item.apiUsed}</TableCell>
                                    <TableCell className="text-gray-600">{item.createdBy}</TableCell>
                                    <TableCell className="text-gray-600">{item.createdFor}</TableCell>
                                    <TableCell className="text-gray-600">
                                        <div className="flex flex-col gap-0.5">
                                            {item.classes.map((cls, idx) => (
                                                <div key={idx} className="flex items-center gap-1 text-xs">
                                                    <CheckSquare className="h-3 w-3 text-gray-500" />
                                                    <span>{cls}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="inline-flex items-center border rounded px-2 py-1 bg-white">
                                            <span className="text-xs font-medium text-gray-700 mr-2">{item.status}</span>
                                            {/* Placeholder for helper/dropdown icon if it were a real dropdown */}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                size="sm"
                                                className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                            >
                                                <Video className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                    <div>
                        Showing 1 to {filteredClasses.length} of {liveClasses.length} entries
                    </div>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="default" size="sm" className="h-8 w-8 p-0 bg-indigo-500 hover:bg-indigo-600 text-white">1</Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
