"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Pencil, Trash2, Search, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight
} from "lucide-react";

interface ClassTeacherAssignment {
    id: string;
    className: string;
    section: string;
    teachers: string[];
}

const mockAssignments: ClassTeacherAssignment[] = [
    { id: "1", className: "Class 1", section: "A", teachers: ["Shivam Verma (9002)"] },
    { id: "2", className: "Class 1", section: "B", teachers: ["Shivam Verma (9002)", "Jason Sharlton (90006)"] },
    { id: "3", className: "Class 2", section: "A", teachers: ["Shivam Verma (9002)", "Jason Sharlton (90006)"] },
    { id: "4", className: "Class 3", section: "A", teachers: ["Shivam Verma (9002)"] },
    { id: "5", className: "Class 4", section: "A", teachers: ["Shivam Verma (9002)", "Jason Sharlton (90006)"] },
    { id: "6", className: "Class 5", section: "A", teachers: ["Shivam Verma (9002)", "Jason Sharlton (90006)"] },
    { id: "7", className: "Class 5", section: "B", teachers: [] },
];

export default function AssignClassTeacherPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const teachers = [
        "Shivam Verma (9002)",
        "Jason Sharlton (90006)",
        "Nishant Khare (1002)",
        "aman (654)"
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Form */}
            <div className="w-full lg:w-1/3 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Assign Class Teacher</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="class" className="text-sm font-medium text-gray-700">
                                Class <span className="text-red-500">*</span>
                            </Label>
                            <Select>
                                <SelectTrigger id="class">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="class1">Class 1</SelectItem>
                                    <SelectItem value="class2">Class 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="section" className="text-sm font-medium text-gray-700">
                                Section <span className="text-red-500">*</span>
                            </Label>
                            <Select>
                                <SelectTrigger id="section">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="a">A</SelectItem>
                                    <SelectItem value="b">B</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">
                                Class Teacher <span className="text-red-500">*</span>
                            </Label>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {teachers.map((teacher) => (
                                    <div key={teacher} className="flex items-center space-x-2">
                                        <Checkbox id={teacher} />
                                        <label
                                            htmlFor={teacher}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-600"
                                        >
                                            {teacher}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-9 text-xs shadow-sm">
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: List */}
            <div className="w-full lg:w-2/3 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Class Teacher List</h2>

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
                                <span className="text-xs text-gray-500">50</span>
                                <Columns className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Printer className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border border-gray-100 overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50 text-[11px] uppercase">
                                <TableRow>
                                    <TableHead className="font-semibold text-gray-600">Class</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Section</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Class Teacher</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockAssignments.map((assignment) => (
                                    <TableRow key={assignment.id} className="text-[13px] hover:bg-gray-50/50 group">
                                        <TableCell className="text-gray-600">{assignment.className}</TableCell>
                                        <TableCell className="text-gray-600">{assignment.section}</TableCell>
                                        <TableCell className="text-gray-600 whitespace-pre-line leading-relaxed">
                                            {assignment.teachers.length > 0
                                                ? assignment.teachers.join('\n')
                                                : ""}
                                        </TableCell>
                                        <TableCell className="text-right">
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
                            Showing 1 to {mockAssignments.length} of {mockAssignments.length} entries
                        </div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0 group" disabled>
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0">
                                1
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0 group" disabled>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
