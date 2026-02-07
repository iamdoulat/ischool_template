"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, FileSpreadsheet, FileText, Printer, Columns, Pencil, X, ChevronLeft, ChevronRight, CreditCard } from "lucide-react";

interface TemplateRecord {
    id: string;
    template: string;
    classSections: string;
    templateDescription: string;
}

const templateData: TemplateRecord[] = [
    {
        id: "1",
        template: "Monthly Test Template (Single exam without term)",
        classSections: "Class 1: A, B, C, D",
        templateDescription: "",
    },
    {
        id: "2",
        template: "Assessment Template (Single exam without term)",
        classSections: "Class 2: A, B, C, D",
        templateDescription: "",
    },
    {
        id: "3",
        template: "Periodic Singlewise Test Template",
        classSections: "Class 1: A, B, C, D",
        templateDescription: "",
    },
    {
        id: "4",
        template: "Subject Test Template (Single exam without term)",
        classSections: "Class 5: A, B, C, D",
        templateDescription: "",
    },
    {
        id: "5",
        template: "Assessment Template (multiple exams without term)",
        classSections: "Class 1: A, B, C, D",
        templateDescription: "",
    },
    {
        id: "6",
        template: "Subject wise template (Multiple exams without term)",
        classSections: "Class 5: A, B, C, D",
        templateDescription: "",
    },
    {
        id: "7",
        template: "Periodic Test Template (Single exam without term)",
        classSections: "Class 5: A, B, C, D",
        templateDescription: "",
    },
    {
        id: "8",
        template: "Assessment Test Template ( Term Wise exam )",
        classSections: "Class 1: A, B, C, D",
        templateDescription: "",
    },
    {
        id: "9",
        template: "Single Assessment Template (Single exam without term )",
        classSections: "Class 1: A, B, C, D",
        templateDescription: "",
    },
    {
        id: "10",
        template: "Online Test Template (Single exam without term )",
        classSections: "Class 2: A, B, C, D",
        templateDescription: "",
    },
    {
        id: "11",
        template: "Periodic Term-end Exams (Single exam without term )",
        classSections: "Class 1: A, B, C, D",
        templateDescription: "",
    },
    {
        id: "12",
        template: "Template",
        classSections: "Class 1: A, B, C, D",
        templateDescription: "",
    },
    {
        id: "13",
        template: "Monthly february Test Template (Single exam without term )",
        classSections: "Class 1: A, B, C, D",
        templateDescription: "",
    },
];

export default function TemplatePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    const filteredData = templateData.filter((item) =>
        item.template.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Template List</h2>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex w-full md:w-auto items-center gap-2">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 pr-10"
                            />
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
                                <TableHead className="font-semibold text-gray-600 min-w-[250px]">Template</TableHead>
                                <TableHead className="font-semibold text-gray-600 w-[200px]">Class Sections</TableHead>
                                <TableHead className="font-semibold text-gray-600 w-full">Template Description</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right min-w-[120px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((item) => (
                                <TableRow key={item.id} className="text-sm">
                                    <TableCell className="font-medium text-gray-700 py-3">{item.template}</TableCell>
                                    <TableCell className="text-gray-600 whitespace-nowrap">{item.classSections}</TableCell>
                                    <TableCell className="text-gray-600">{item.templateDescription}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                size="sm"
                                                className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                title="View ID Card"
                                            >
                                                <CreditCard className="h-4 w-4" />
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
                        Showing 1 to {filteredData.length} of {templateData.length} entries
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
