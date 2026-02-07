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
import { Search, FileText, BarChart3, Trophy, UserCheck, Plus, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const reportLinks = [
    { name: "Result Report", icon: FileText, active: true },
    { name: "Exams Report", icon: FileText },
    { name: "Student Exams Attempt Report", icon: UserCheck },
    { name: "Exams Rank Report", icon: Trophy },
];

export default function OnlineExaminationsReportPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Online Examinations Report</h1>

            {/* Report Links Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-1 gap-x-6">
                    {reportLinks.map((link) => (
                        <div
                            key={link.name}
                            className={cn(
                                "flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors group",
                                link.active ? "bg-gray-100" : "hover:bg-gray-50"
                            )}
                        >
                            <link.icon className={cn("h-3.5 w-3.5", link.active ? "text-gray-700" : "text-gray-400 group-hover:text-gray-600")} />
                            <span className={cn("text-[10px] font-medium tracking-tight", link.active ? "text-gray-800" : "text-gray-500 group-hover:text-gray-700")}>
                                {link.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Exam <span className="text-red-500">*</span></Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="exam1">Mid Term Online Exam</SelectItem>
                                <SelectItem value="exam2">Final Term Online Exam</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Class 1</SelectItem>
                                <SelectItem value="2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section <span className="text-red-500">*</span></Label>
                        <Select>
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
                <div className="flex justify-end">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5">
                        <Search className="h-3 w-3" />
                        Search
                    </Button>
                </div>
            </div>

            {/* Result Report Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Result Report</h2>

                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-full">
                        <TableHeader className="bg-transparent">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">Admission No</TableHead>
                                <TableHead className="py-3 px-4">Student Name</TableHead>
                                <TableHead className="py-3 px-4">Class</TableHead>
                                <TableHead className="py-3 px-4 text-center">Total Attempt</TableHead>
                                <TableHead className="py-3 px-4 text-center">Remaining Attempt</TableHead>
                                <TableHead className="py-3 px-4 text-center">Exam Submitted</TableHead>
                                <TableHead className="py-3 px-4 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="hover:bg-transparent h-64">
                                <TableCell colSpan={7} className="text-center py-12">
                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                        <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest whitespace-nowrap">No data available in table</p>
                                        <div className="relative">
                                            <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                <Monitor className="h-8 w-8 text-gray-200" />
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

                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
                    <div>Showing 0 to 0 of 0 entries</div>
                </div>
            </div>
        </div>
    );
}
