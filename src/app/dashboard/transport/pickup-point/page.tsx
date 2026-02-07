"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Plus,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    MapPin,
    ArrowUpDown,
    Eye,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PickupPoint {
    id: string;
    name: string;
    latitude: string;
    longitude: string;
}

const mockPoints: PickupPoint[] = [
    { id: "1", name: "Brooklyn North", latitude: "23.21953720694318", longitude: "79.92068396109676" },
    { id: "2", name: "Brooklyn South", latitude: "23.204781722973813", longitude: "79.89751486729702" },
    { id: "3", name: "Brooklyn West", latitude: "23.19324172886814", longitude: "79.91536320113687" },
    { id: "4", name: "Brooklyn East", latitude: "23.193952567195508", longitude: "79.9243812546212" },
    { id: "5", name: "Brooklyn Central", latitude: "23.21230494952628", longitude: "79.92914139397982" },
    { id: "6", name: "Manhattan", latitude: "23.2088338875238", longitude: "80.00451042401824" },
    { id: "7", name: "Railway Station", latitude: "23.18852749480289", longitude: "79.9505498414184" },
    { id: "8", name: "High Court", latitude: "23.188815568293845", longitude: "79.94728996887004" },
    { id: "9", name: "civil Line", latitude: "23.186120045559583", longitude: "79.95531910280892" },
    { id: "10", name: "Vijay Nagar", latitude: "23.190170327288888", longitude: "79.89843280559972" },
    { id: "11", name: "Ranital Chowk", latitude: "23.170504583243085", longitude: "79.92385377583044" },
];

export default function PickupPointPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredPoints = mockPoints.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-sm font-medium text-gray-800 tracking-tight">Pickup Point List</h2>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        Add
                    </Button>
                </div>

                <div className="p-4 space-y-4">
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
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                        <div className="flex items-center gap-1 cursor-pointer">Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1 cursor-pointer">Latitude <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1 cursor-pointer">Longitude <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPoints.map((point) => (
                                    <TableRow key={point.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3 text-gray-700 font-medium">{point.name}</TableCell>
                                        <TableCell className="py-3 text-right text-gray-500">{point.latitude}</TableCell>
                                        <TableCell className="py-3 text-right text-gray-500">{point.longitude}</TableCell>
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

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                        <div>
                            Showing 1 to {filteredPoints.length} of {mockPoints.length} entries
                        </div>
                        <div className="flex gap-1 items-center">
                            <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600 text-[10px]">‹</span>
                            <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded">
                                1
                            </Button>
                            <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600 text-[10px]">›</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
