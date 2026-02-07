"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, X, Eye, Upload, Image as ImageIcon, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight } from "lucide-react";

interface Marksheet {
    id: string;
    certificateName: string;
    hasBackgroundImage: boolean;
    isActive: boolean;
}

const mockMarksheets: Marksheet[] = [
    { id: "1", certificateName: "school marksheet", hasBackgroundImage: true, isActive: true },
    { id: "2", certificateName: "Marksheet", hasBackgroundImage: false, isActive: false },
];

export default function DesignMarksheetPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    const filteredData = mockMarksheets.filter((item) =>
        item.certificateName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Add Marksheet Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border space-y-4">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-medium text-gray-800">Add Marksheet</h2>
                        </div>

                        <div className="p-4 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
                            <div className="space-y-2">
                                <Label htmlFor="template" className="text-xs font-semibold text-gray-600">
                                    Template <span className="text-red-500">*</span>
                                </Label>
                                <Input id="template" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="examName" className="text-xs font-semibold text-gray-600">Exam Name</Label>
                                <Input id="examName" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="schoolName" className="text-xs font-semibold text-gray-600">School Name</Label>
                                <Input id="schoolName" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="examCenter" className="text-xs font-semibold text-gray-600">Exam Center</Label>
                                <Input id="examCenter" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bodyText" className="text-xs font-semibold text-gray-600">Body Text</Label>
                                <Input id="bodyText" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="footerText" className="text-xs font-semibold text-gray-600">Footer Text</Label>
                                <Input id="footerText" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="printingDate" className="text-xs font-semibold text-gray-600">Printing Date</Label>
                                <Input id="printingDate" type="date" />
                            </div>

                            {/* File Uploads */}
                            {["Header Image", "Left Sign", "Right Sign", "Left Sign", "Middle Sign", "Right Sign", "Background Image"].map((label, idx) => (
                                <div key={`${label}-${idx}`} className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-600">{label}</Label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors bg-[#fdfcff]">
                                        <Upload className="h-6 w-6 text-gray-400 mb-2" />
                                        <span className="text-xs text-gray-500 font-medium">Drag and drop a file here or click</span>
                                    </div>
                                </div>
                            ))}

                            {/* Toggles */}
                            <div className="space-y-3 pt-2">
                                {[
                                    "Name", "Father Name", "Mother Name", "Exam Number",
                                    "Admission No", "Division", "Roll Number", "Photo",
                                    "Class", "Section", "Status (Pass/Fail/Grading)", "Remark"
                                ].map((item) => (
                                    <div key={item} className="flex items-center justify-between">
                                        <Label htmlFor={`toggle-${item}`} className="text-xs font-semibold text-gray-600 cursor-pointer">{item}</Label>
                                        <Switch id={`toggle-${item}`} className="data-[state=checked]:bg-indigo-500 h-5 w-9" />
                                    </div>
                                ))}
                            </div>

                        </div>
                        <div className="p-4 border-t flex justify-end">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6">
                                Save
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Marksheet List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                        <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Marksheet List</h2>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-48">
                                <Input
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                                    <SelectTrigger className="w-[70px] h-8 text-xs">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <Columns className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 text-xs uppercase">
                                    <TableRow>
                                        <TableHead className="font-semibold text-gray-600 w-full">Certificate Name</TableHead>
                                        <TableHead className="font-semibold text-gray-600 min-w-[150px]">Background Image</TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-right min-w-[120px]">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((item) => (
                                        <TableRow key={item.id} className="text-sm">
                                            <TableCell className="font-medium text-blue-600 hover:underline cursor-pointer">{item.certificateName}</TableCell>
                                            <TableCell>
                                                {item.hasBackgroundImage ? (
                                                    <div className="h-8 w-8 bg-gray-100 rounded border flex items-center justify-center">
                                                        <ImageIcon className="h-4 w-4 text-gray-500" />
                                                    </div>
                                                ) : (
                                                    <div className="h-8 w-8 bg-gray-50 rounded border flex items-center justify-center">
                                                        <div className="h-2 w-4 border border-gray-300"></div>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        size="sm"
                                                        className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                        title="View"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                        title="Delete"
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
                                Showing 1 to {filteredData.length} of {mockMarksheets.length} entries
                            </div>
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled><ChevronLeft className="h-3.5 w-3.5" /></Button>
                                <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white">1</Button>
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled><ChevronRight className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
