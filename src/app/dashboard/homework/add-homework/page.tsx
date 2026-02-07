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
    TableRow
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
    Plus,
    Eye,
    Pencil,
    Trash2,
    ArrowUpDown
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface HomeworkRecord {
    id: string;
    class: string;
    section: string;
    subjectGroup: string;
    subject: string;
    homeworkDate: string;
    submissionDate: string;
    evaluationDate: string;
    createdBy: string;
}

const mockHomework: HomeworkRecord[] = [
    {
        id: "1",
        class: "Class 1",
        section: "A",
        subjectGroup: "Class 1st Subject Group",
        subject: "Hindi (230)",
        homeworkDate: "02/05/2026",
        submissionDate: "02/10/2026",
        evaluationDate: "",
        createdBy: "Joe Black (9000)",
    },
];

export default function AddHomeworkPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800 border-b pb-2">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="class1">
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class1">Class 1</SelectItem>
                                <SelectItem value="class2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">Section</Label>
                        <Select defaultValue="a">
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">Subject Group</Label>
                        <Select defaultValue="group1">
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="group1">Class 1st Subject Group</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">Subject</Label>
                        <Select defaultValue="hindi">
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hindi">Hindi (230)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-8 px-6 text-[11px] font-bold uppercase transition-all rounded shadow-sm">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            {/* Homework List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 pt-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm font-medium text-gray-800">Homework List</h2>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-7 px-3 text-[10px] font-bold uppercase transition-all rounded shadow-sm">
                        <Plus className="h-3 w-3" /> Add
                    </Button>
                </div>

                <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="bg-transparent h-auto p-0 border-b border-gray-100 w-full justify-start rounded-none gap-6 mb-4">
                        <TabsTrigger
                            value="upcoming"
                            className="text-[11px] font-medium px-0 py-2 border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 rounded-none bg-transparent shadow-none"
                        >
                            Upcoming Homework
                        </TabsTrigger>
                        <TabsTrigger
                            value="closed"
                            className="text-[11px] font-medium px-0 py-2 border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 rounded-none bg-transparent shadow-none"
                        >
                            Closed Homework
                        </TabsTrigger>
                    </TabsList>

                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
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

                    <div className="rounded border border-gray-50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-gray-100">
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                        Class <ArrowUpDown className="h-2.5 w-2.5 inline-block ml-1 opacity-50" />
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Section</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Subject Group</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Subject</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Homework Date</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Submission Date</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Evaluation Date</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Created By</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockHomework.map((item) => (
                                    <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                        <TableCell className="py-3 text-gray-700 font-medium">{item.class}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{item.section}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{item.subjectGroup}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{item.subject}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{item.homeworkDate}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{item.submissionDate}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{item.evaluationDate || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{item.createdBy}</TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 mt-2">
                        <div>
                            Showing 1 to {mockHomework.length} of {mockHomework.length} entries
                        </div>
                        <div className="flex gap-1 items-center">
                            <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600 text-sm">‹</span>
                            <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded">
                                1
                            </Button>
                            <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600 text-sm">›</span>
                        </div>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
