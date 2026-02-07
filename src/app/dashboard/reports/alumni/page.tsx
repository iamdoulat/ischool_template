"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Search,
    GraduationCap,
    Plus,
    Copy,
    FileSpreadsheet,
    FileBox,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AlumniReportPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Alumni Report</h1>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Pass Out Session <span className="text-red-500">*</span></Label>
                        <Select defaultValue="2016-17">
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2016-17">2016-17</SelectItem>
                                <SelectItem value="2017-18">2017-18</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                        <Select defaultValue="c1">
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="c1">Class 1</SelectItem>
                                <SelectItem value="c2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section <span className="text-red-500">*</span></Label>
                        <Select defaultValue="a">
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5">
                        <Search className="h-3 w-3" />
                        Search
                    </Button>
                </div>
            </div>

            {/* Alumni Report Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Alumni Report</h2>

                {/* Table Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">50</span>
                            <Select defaultValue="50">
                                <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none ring-0">
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
                            {[Copy, FileSpreadsheet, FileBox, FileText, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Results Table */}
                <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1500px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4 flex items-center gap-1">Admission No <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 flex items-center gap-1">Student Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 flex items-center gap-1">Class <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 flex items-center gap-1">Gender <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 flex items-center gap-1">Current Email <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 flex items-center gap-1">Date Of Birth <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 flex items-center gap-1">Current Address <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 flex items-center gap-1">Occupation <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-right">Current Phone</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="hover:bg-transparent h-64">
                                <TableCell colSpan={9} className="text-center py-12">
                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                        <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest whitespace-nowrap">No data available in table</p>
                                        <div className="relative">
                                            <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                <GraduationCap className="h-8 w-8 text-gray-200" />
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                <Plus className="h-3 w-3 text-indigo-300" />
                                            </div>
                                        </div>
                                        <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                            <span className="text-lg">←</span> Add new record or search with different criteria.
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>Showing 0 to 0 of 0 entries</div>
                </div>
            </div>
        </div>
    );
}
