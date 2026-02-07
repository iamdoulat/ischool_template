"use client";

import { useState } from "react";
import Image from "next/image";
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
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    ArrowUpDown,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface IssuedBook {
    id: string;
    title: string;
    bookNumber: string;
    issueDate: string;
    dueReturnDate: string;
    returnDate: string;
}

const mockIssuedBooks: IssuedBook[] = [
    { id: "1", title: "Environmental science", bookNumber: "98057", issueDate: "11/01/2025", dueReturnDate: "11/24/2025", returnDate: "" },
    { id: "2", title: "English Reader", bookNumber: "4344", issueDate: "02/02/2025", dueReturnDate: "02/10/2025", returnDate: "" },
    { id: "3", title: "Mathematics", bookNumber: "9854", issueDate: "02/02/2025", dueReturnDate: "02/02/2025", returnDate: "" },
    { id: "4", title: "Hindi Vyakaran", bookNumber: "3455", issueDate: "02/02/2025", dueReturnDate: "02/21/2025", returnDate: "" },
    { id: "5", title: "The Little Fir Tree", bookNumber: "54342", issueDate: "02/02/2025", dueReturnDate: "02/28/2025", returnDate: "" },
    { id: "6", title: "Building With Bricks", bookNumber: "DA23111", issueDate: "02/02/2025", dueReturnDate: "02/25/2025", returnDate: "" },
    { id: "7", title: "Fractions and Decimals", bookNumber: "SDS4222", issueDate: "12/01/2025", dueReturnDate: "12/21/2025", returnDate: "01/21/2026" },
];

export default function MemberIssuePage({ params }: { params: { id: string } }) {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Sidebar: Member Information */}
                <div className="w-full lg:w-[280px] shrink-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 flex flex-col items-center border-b border-gray-100">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-100 mb-2">
                                <Image
                                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop"
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <h2 className="text-sm font-bold text-gray-800">Robin Peterson</h2>
                        </div>

                        <div className="p-0">
                            {[
                                { label: "Member ID", value: params.id },
                                { label: "Library Card No.", value: "0013" },
                                { label: "Admission No", value: "18002" },
                                { label: "Gender", value: "Male" },
                                { label: "Member Type", value: "Student" },
                                { label: "Mobile Number", value: "9898985454", color: "text-indigo-400" },
                                { label: "Session Year", value: "2021-22", color: "text-indigo-400" },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2.5 px-4 border-b border-gray-50 last:border-0">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{item.label}</span>
                                    <span className={cn("text-[11px] font-medium text-gray-700", item.color)}>{item.value}</span>
                                </div>
                            ))}

                            {/* Barcode & QR Placeholder */}
                            <div className="p-4 space-y-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Barcode</span>
                                    <div className="h-8 w-full bg-gray-50 rounded flex items-center justify-center border border-dashed border-gray-200">
                                        <div className="h-4 w-3/4 bg-gray-800/10 rounded-sm" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">QR Code</span>
                                    <div className="h-16 w-16 mx-auto bg-gray-50 rounded flex items-center justify-center border border-dashed border-gray-200">
                                        <div className="h-10 w-10 bg-gray-800/10 rounded-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 space-y-6">
                    {/* Issue Book Form */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800">Issue Book</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                        Books <span className="text-red-500 font-bold">*</span>
                                    </Label>
                                    <Select>
                                        <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Environmental Science</SelectItem>
                                            <SelectItem value="2">English Reader</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                        Due Return Date <span className="text-red-500 font-bold">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        defaultValue="02/05/2026"
                                        className="h-9 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Book Issued List */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-medium text-gray-800">Book Issued</h2>
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

                        {/* Table */}
                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[800px]">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Book Title</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Book Number</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Issue Date</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Due Return Date</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Return Date</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockIssuedBooks.map((book) => (
                                        <TableRow key={book.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                            <TableCell className="py-3 text-gray-700 font-medium">{book.title}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{book.bookNumber}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{book.issueDate}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{book.dueReturnDate}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{book.returnDate || "-"}</TableCell>
                                            <TableCell className="py-3 text-right">
                                                <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                    <RotateCcw className="h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
                            <div>
                                Showing 1 to {mockIssuedBooks.length} of {mockIssuedBooks.length} entries
                            </div>
                            <div className="flex gap-1 items-center">
                                <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600 text-sm">‹</span>
                                <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded">
                                    1
                                </Button>
                                <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600 text-sm">›</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
