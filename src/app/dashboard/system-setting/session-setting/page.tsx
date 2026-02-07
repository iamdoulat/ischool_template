"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Copy,
    FileSpreadsheet,
    FileBox,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Pencil,
    Trash2,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionEntry {
    session: string;
    isActive: boolean;
}

const sessions: SessionEntry[] = [
    { session: "2016-17", isActive: false },
    { session: "2017-18", isActive: false },
    { session: "2018-19", isActive: false },
    { session: "2019-20", isActive: false },
    { session: "2020-21", isActive: false },
    { session: "2021-22", isActive: false },
    { session: "2022-23", isActive: false },
    { session: "2023-24", isActive: false },
    { session: "2024-25", isActive: false },
    { session: "2025-26", isActive: true },
    { session: "2026-27", isActive: false },
    { session: "2027-28", isActive: false },
    { session: "2028-29", isActive: false },
    { session: "2029-30", isActive: false },
];

export default function SessionSettingPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col md:flex-row gap-6">

                {/* Left Side: Add Session */}
                <div className="w-full md:w-1/3 md:max-w-sm space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Add Session</h2>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Session <span className="text-red-500">*</span></Label>
                                <Input className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Session List */}
                <div className="flex-1 space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Session List</h2>

                        {/* Warning Note */}
                        <div className="bg-blue-50/50 border border-blue-100/50 p-3 rounded-md flex gap-2.5 items-start">
                            <div className="flex-shrink-0 mt-0.5">
                                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Info className="h-2.5 w-2.5 text-blue-500" />
                                </div>
                            </div>
                            <p className="text-[10px] text-blue-600/80 leading-relaxed font-medium">
                                Note: Changing the session name format may cause issues on some pages or features, so it is recommended not to change the session name format.
                            </p>
                        </div>

                        {/* Table Header / Actions */}
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

                        {/* Session Table */}
                        <div className="rounded border border-gray-50 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Session <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">Status <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessions.map((item, idx) => (
                                        <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="py-3 px-4 text-gray-700">{item.session}</TableCell>
                                            <TableCell className="py-3 px-4">
                                                {item.isActive ? (
                                                    <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter">
                                                        Active
                                                    </span>
                                                ) : null}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-500">
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500">
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Table Footer */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                            <div>Showing 1 to 14 of 14 entries</div>
                            <div className="flex items-center gap-1">
                                <Button disabled variant="outline" className="h-6 w-6 p-0 border-gray-100 text-gray-300">
                                    <ChevronLeft className="h-3 w-3" />
                                </Button>
                                <Button className="h-6 w-6 p-0 bg-indigo-500 text-white text-[10px] border-0 hover:bg-indigo-600">1</Button>
                                <Button disabled variant="outline" className="h-6 w-6 p-0 border-gray-100 text-gray-300">
                                    <ChevronRight className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
