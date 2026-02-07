"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Pencil, Trash2, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight
} from "lucide-react";

interface HolidayType {
    id: string;
    name: string;
}

const mockHolidayTypes: HolidayType[] = [
    { id: "1", name: "Holiday" },
    { id: "2", name: "Vacation" },
    { id: "3", name: "Activity" },
    { id: "4", name: "EVENTS" },
    { id: "5", name: "School Events" },
];

export default function HolidayTypePage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTypes = mockHolidayTypes.filter(type =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 font-sans">
            {/* Left Column: Add Holiday Type Form */}
            <div className="w-full lg:w-1/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Add Holiday Type</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="holidayTypeName" className="text-sm font-medium text-gray-700">
                                Name <span className="text-red-500">*</span>
                            </Label>
                            <Input id="holidayTypeName" className="h-9 focus-visible:ring-indigo-500" />
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-9 text-xs shadow-sm transition-all">
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Holiday Type List */}
            <div className="w-full lg:w-2/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Holiday Type</h2>

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
                                <span className="text-xs text-gray-500 font-medium">50</span>
                                <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                    <Columns className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50/50 text-[11px] uppercase">
                                <TableRow className="hover:bg-transparent border-gray-100">
                                    <TableHead className="font-bold text-gray-700 py-3">Name</TableHead>
                                    <TableHead className="font-bold text-gray-700 text-right py-3">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTypes.map((type) => (
                                    <TableRow key={type.id} className="text-[13px] hover:bg-gray-50/50 group border-b last:border-0 border-gray-50">
                                        <TableCell className="text-gray-600 font-normal py-3.5">{type.name}</TableCell>
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
                                {filteredTypes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center text-gray-500 text-sm">
                                            No results found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                        <div>
                            Showing 1 to {filteredTypes.length} of {mockHolidayTypes.length} entries
                        </div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-gray-200" disabled>
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0">
                                1
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-gray-200" disabled>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
