"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Pencil, Trash2, Search, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight
} from "lucide-react";

interface ClassData {
    id: string;
    className: string;
    sections: string[];
}

const mockClasses: ClassData[] = [
    { id: "1", className: "Class 5", sections: ["A", "B", "C", "D"] },
    { id: "2", className: "Class 4", sections: ["A", "B", "C", "D"] },
    { id: "3", className: "Class 3", sections: ["A", "B", "C", "D"] },
    { id: "4", className: "Class 2", sections: ["A", "B", "C", "D"] },
    { id: "5", className: "Class 1", sections: ["A", "B", "C", "D"] },
];

export default function ClassPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const sectionOptions = ["A", "B", "C", "D", "E"];

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Add Class Form */}
            <div className="w-full lg:w-1/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Add Class</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="className" className="text-sm font-medium text-gray-700">
                                Class <span className="text-red-500">*</span>
                            </Label>
                            <Input id="className" className="h-9" />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">
                                Sections <span className="text-red-500">*</span>
                            </Label>
                            <div className="space-y-2">
                                {sectionOptions.map((section) => (
                                    <div key={section} className="flex items-center space-x-2">
                                        <Checkbox id={`section-${section}`} className="border-gray-300" />
                                        <Label
                                            htmlFor={`section-${section}`}
                                            className="text-sm font-normal text-gray-600 cursor-pointer"
                                        >
                                            {section}
                                        </Label>
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

            {/* Right Column: Class List */}
            <div className="w-full lg:w-2/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 font-sans">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Class List</h2>

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
                                    <TableHead className="font-bold text-gray-700">Class</TableHead>
                                    <TableHead className="font-bold text-gray-700">Sections</TableHead>
                                    <TableHead className="font-bold text-gray-700 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockClasses.map((cls) => (
                                    <TableRow key={cls.id} className="text-[13px] hover:bg-gray-50/50 group border-b last:border-0 border-gray-50">
                                        <TableCell className="text-gray-600 font-medium py-3.5 align-top">{cls.className}</TableCell>
                                        <TableCell className="text-gray-600 py-3.5">
                                            <div className="flex flex-col gap-1">
                                                {cls.sections.map((section) => (
                                                    <span key={section}>{section}</span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-3.5 align-top">
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
                            Showing 1 to {mockClasses.length} of {mockClasses.length} entries
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
