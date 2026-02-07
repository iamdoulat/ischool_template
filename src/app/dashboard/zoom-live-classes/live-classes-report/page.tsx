"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight, Video } from "lucide-react";

interface ClassReport {
    id: string;
    classTitle: string;
    description: string;
    date: string;
    apiUsed: "Self" | "Global";
    createdBy: string;
    createdFor: string;
    totalJoin: number;
}

const reportData: ClassReport[] = [
    {
        id: "1",
        classTitle: "English Extra Classes",
        description: "English Extra Classes",
        date: "12/01/2025 12:30:00",
        apiUsed: "Global",
        createdBy: "",
        createdFor: "Shivam Verma (Teacher : 9002)",
        totalJoin: 1,
    },
];

export default function LiveClassesReportPage() {
    const [selectedClass, setSelectedClass] = useState("Class 1");
    const [selectedSection, setSelectedSection] = useState("B");
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    const filteredData = reportData.filter((item) =>
        item.classTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="class-select" className="text-xs font-semibold text-gray-600">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger id="class-select" className="h-10">
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Class 1">Class 1</SelectItem>
                                <SelectItem value="Class 2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="section-select" className="text-xs font-semibold text-gray-600">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                            <SelectTrigger id="section-select" className="h-10">
                                <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="A">A</SelectItem>
                                <SelectItem value="B">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6">
                        Search
                    </Button>
                </div>
            </div>

            {/* Report Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                <h2 className="text-lg font-medium text-gray-800">Live Classes Report</h2>

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
                                <TableHead className="font-semibold text-gray-600">Class Title</TableHead>
                                <TableHead className="font-semibold text-gray-600">Description</TableHead>
                                <TableHead className="font-semibold text-gray-600">Date</TableHead>
                                <TableHead className="font-semibold text-gray-600">Api Used</TableHead>
                                <TableHead className="font-semibold text-gray-600">Created By</TableHead>
                                <TableHead className="font-semibold text-gray-600">Created For</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-center">Total Join</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((item) => (
                                <TableRow key={item.id} className="text-sm">
                                    <TableCell className="font-medium text-gray-700">{item.classTitle}</TableCell>
                                    <TableCell className="text-gray-600">{item.description}</TableCell>
                                    <TableCell className="text-gray-600">{item.date}</TableCell>
                                    <TableCell className="text-gray-600">{item.apiUsed}</TableCell>
                                    <TableCell className="text-gray-600">{item.createdBy}</TableCell>
                                    <TableCell className="text-gray-600">{item.createdFor}</TableCell>
                                    <TableCell className="text-center text-gray-600">{item.totalJoin}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                        >
                                            <Video className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                                        No data available in table
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {filteredData.length > 0 && (
                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                        <div>
                            Showing 1 to {filteredData.length} of {reportData.length} entries
                        </div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="default" size="sm" className="h-8 w-8 p-0 bg-indigo-500 hover:bg-indigo-600 text-white">1</Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
