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
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    LayoutList,
    User,
    ArrowUpDown,
    FileSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ManageAlumniPage() {
    const [viewType, setViewType] = useState<"list" | "details">("list");
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800 tracking-tight">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5 flex-1">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            Pass Out Session <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="2016-17" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2016-17">2016-17</SelectItem>
                                <SelectItem value="2017-18">2017-18</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5 flex-1">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            Class <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="Class 1" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="c1">Class 1</SelectItem>
                                <SelectItem value="c2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5 flex-1">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="A" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex md:block">
                        <Button className="w-full md:w-auto bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center justify-center gap-1.5">
                            <Search className="h-3 w-3" />
                            Search
                        </Button>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-50 flex items-center gap-4">
                    <div className="flex-1 space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search By Admission Number</Label>
                        <Input placeholder="Search By Admission Number" className="h-8 border-gray-200 text-[11px] rounded shadow-none focus-visible:ring-indigo-500" />
                    </div>
                    <Button className="mt-5 bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5">
                        <Search className="h-3 w-3" />
                        Search
                    </Button>
                </div>
            </div>

            {/* Alumni List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                {/* Tabs for View Mode */}
                <div className="flex items-center gap-1 border-b border-gray-100 pb-0.5">
                    <Button
                        variant="ghost"
                        onClick={() => setViewType("list")}
                        className={cn(
                            "h-8 px-3 rounded-none border-b-2 text-[10px] font-bold uppercase tracking-tight gap-1.5 transition-all outline-none focus-visible:ring-0",
                            viewType === "list" ? "border-indigo-500 text-indigo-500 bg-indigo-50/10" : "border-transparent text-gray-400 hover:text-gray-600"
                        )}
                    >
                        <LayoutList className="h-3.5 w-3.5" />
                        List View
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setViewType("details")}
                        className={cn(
                            "h-8 px-3 rounded-none border-b-2 text-[10px] font-bold uppercase tracking-tight gap-1.5 transition-all outline-none focus-visible:ring-0",
                            viewType === "details" ? "border-indigo-500 text-indigo-500 bg-indigo-50/10" : "border-transparent text-gray-400 hover:text-gray-600"
                        )}
                    >
                        <Columns className="h-3.5 w-3.5" />
                        Details View
                    </Button>
                </div>

                {/* Toolbar */}
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
                                <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded">
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
                            {[Copy, FileSpreadsheet, FileText, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Admission No <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Student Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Class <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Gender <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Current Email <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Current Phone <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Blank State based on image */}
                            <TableRow className="hover:bg-transparent h-64">
                                <TableCell colSpan={7} className="text-center py-12">
                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                        <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                        <div className="relative">
                                            <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                <FileSearch className="h-8 w-8 text-gray-200" />
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                <PlusIcon className="h-3 w-3 text-indigo-300" />
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
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
                    <div>Showing 0 to 0 of 0 entries</div>
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-300 mr-2 cursor-not-allowed">‹</span>
                        <span className="text-gray-300 ml-2 cursor-not-allowed">›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    );
}
