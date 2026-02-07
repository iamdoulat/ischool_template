"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    Pencil,
    Trash2,
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

interface HostelRoom {
    id: string;
    roomNumber: string;
    hostel: string;
    roomType: string;
    numberOfBed: string;
    costPerBed: string;
}

const mockRooms: HostelRoom[] = [
    { id: "1", roomNumber: "B1", hostel: "Boys Hostel 101", roomType: "One Bed", numberOfBed: "1", costPerBed: "21,000.00" },
    { id: "2", roomNumber: "B2", hostel: "Boys Hostel 102", roomType: "Two Bed AC", numberOfBed: "2", costPerBed: "70,000.00" },
    { id: "3", roomNumber: "B3", hostel: "Boys Hostel 101", roomType: "One Bed", numberOfBed: "1", costPerBed: "35,000.00" },
    { id: "4", roomNumber: "B4", hostel: "Boys Hostel 102", roomType: "One Bed AC", numberOfBed: "1", costPerBed: "84,000.00" },
    { id: "5", roomNumber: "G1", hostel: "Girls Hostel 101", roomType: "One Bed", numberOfBed: "1", costPerBed: "23,000.00" },
    { id: "6", roomNumber: "G2", hostel: "Girls Hostel 104", roomType: "One Bed", numberOfBed: "1", costPerBed: "21,000.00" },
    { id: "7", roomNumber: "G3", hostel: "Girls Hostel 103", roomType: "Two Bed AC", numberOfBed: "2", costPerBed: "35,000.00" },
    { id: "8", roomNumber: "G4", hostel: "Girls Hostel 104", roomType: "Two Bed", numberOfBed: "2", costPerBed: "21,000.00" },
];

export default function HostelRoomPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredRooms = mockRooms.filter((r) =>
        r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.hostel.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Add Hostel Room Form */}
                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800 tracking-tight">Add Hostel Room</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Room Number / Name <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Hostel <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Select>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="boys101">Boys Hostel 101</SelectItem>
                                        <SelectItem value="boys102">Boys Hostel 102</SelectItem>
                                        <SelectItem value="girls101">Girls Hostel 101</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Room Type <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Select>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="one">One Bed</SelectItem>
                                        <SelectItem value="two">Two Bed</SelectItem>
                                        <SelectItem value="oneac">One Bed AC</SelectItem>
                                        <SelectItem value="twoac">Two Bed AC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Number Of Bed <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Cost Per Bed <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Description</Label>
                                <Textarea className="min-h-[80px] border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none resize-none" placeholder="" />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Hostel Room List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                        <h2 className="text-sm font-medium text-gray-800 tracking-tight">Hostel Room List</h2>

                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-4">
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
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Room Number / Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Hostel <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Room Type <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 cursor-pointer">Number Of Bed <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 cursor-pointer">Cost Per Bed <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRooms.map((room) => (
                                        <TableRow key={room.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                            <TableCell className="py-3 text-gray-700 font-medium">{room.roomNumber}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{room.hostel}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{room.roomType}</TableCell>
                                            <TableCell className="py-3 text-gray-500 text-right">{room.numberOfBed}</TableCell>
                                            <TableCell className="py-3 text-gray-500 text-right">₹{room.costPerBed}</TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                            <div>
                                Showing 1 to {filteredRooms.length} of {mockRooms.length} entries
                            </div>
                            <div className="flex gap-1 items-center">
                                <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600 text-[10px]">‹</span>
                                <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded shadow-sm">
                                    1
                                </Button>
                                <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600 text-[10px]">›</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
