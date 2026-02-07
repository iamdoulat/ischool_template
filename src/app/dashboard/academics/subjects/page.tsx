"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Pencil, Trash2, Search, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight
} from "lucide-react";

interface Subject {
    id: string;
    name: string;
    code: string;
    type: string;
}

const mockSubjects: Subject[] = [
    { id: "1", name: "English", code: "210", type: "Theory" },
    { id: "2", name: "Hindi", code: "230", type: "Theory" },
    { id: "3", name: "Mathematics", code: "110", type: "Practical" },
    { id: "4", name: "Science", code: "111", type: "Practical" },
    { id: "5", name: "Social Studies", code: "212", type: "Theory" },
    { id: "6", name: "French", code: "231", type: "Practical" },
    { id: "7", name: "Drawing", code: "200", type: "Practical" },
    { id: "8", name: "Computer", code: "00220", type: "Practical" },
    { id: "9", name: "Elective 1", code: "101", type: "Theory" },
    { id: "10", name: "Elective 2", code: "102", type: "Theory" },
    { id: "11", name: "Elective 3", code: "103", type: "Theory" },
];

export default function SubjectsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredSubjects = mockSubjects.filter(sub =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Add Subject Form */}
            <div className="w-full lg:w-1/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Add Subject</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="subjectName" className="text-sm font-medium text-gray-700">
                                Subject Name <span className="text-red-500">*</span>
                            </Label>
                            <Input id="subjectName" className="h-9" />
                        </div>

                        <div className="space-y-3 pt-1">
                            <RadioGroup defaultValue="theory" className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="theory" id="theory" className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <Label htmlFor="theory" className="text-sm font-normal text-gray-600 cursor-pointer">Theory</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="practical" id="practical" className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    <Label htmlFor="practical" className="text-sm font-normal text-gray-600 cursor-pointer">Practical</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subjectCode" className="text-sm font-medium text-gray-700">
                                Subject Code
                            </Label>
                            <Input id="subjectCode" className="h-9" />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-9 text-xs shadow-sm">
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Subject List */}
            <div className="w-full lg:w-2/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 font-sans">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Subject List</h2>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-8 text-xs border-gray-200"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-xs text-gray-500 font-medium">50</span>
                                <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Columns className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50/50 text-[11px] uppercase">
                                <TableRow>
                                    <TableHead className="font-bold text-gray-700">Subject</TableHead>
                                    <TableHead className="font-bold text-gray-700 text-right">Subject Code</TableHead>
                                    <TableHead className="font-bold text-gray-700">Subject Type</TableHead>
                                    <TableHead className="font-bold text-gray-700 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubjects.map((sub) => (
                                    <TableRow key={sub.id} className="text-[13px] hover:bg-gray-50/50 group border-b last:border-0 border-gray-50">
                                        <TableCell className="text-gray-600 font-medium py-3.5">{sub.name}</TableCell>
                                        <TableCell className="text-gray-600 text-right py-3.5">{sub.code}</TableCell>
                                        <TableCell className="text-gray-600 py-3.5">{sub.type}</TableCell>
                                        <TableCell className="text-right py-3.5">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <Trash2 className="h-3.5 w-3.5" />
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
                            Showing 1 to {filteredSubjects.length} of {mockSubjects.length} entries
                        </div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled>
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0">
                                1
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
