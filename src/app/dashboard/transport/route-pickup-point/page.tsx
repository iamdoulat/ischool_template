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
    Eye,
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

interface Stop {
    point: string;
    fees: string;
    distance: string;
    time: string;
}

interface RoutePickup {
    id: string;
    route: string;
    stops: Stop[];
}

const mockData: RoutePickup[] = [
    {
        id: "1",
        route: "Brooklyn Central",
        stops: [
            { point: "Brooklyn North", fees: "3,500.00", distance: "20.0", time: "9:00 AM" },
            { point: "Brooklyn South", fees: "4,200.00", distance: "15.0", time: "9:30 AM" },
            { point: "Brooklyn West", fees: "3,500.00", distance: "25.0", time: "10:15 AM" },
            { point: "Brooklyn East", fees: "3,500.00", distance: "10.0", time: "10:45 AM" },
        ],
    },
    {
        id: "2",
        route: "Brooklyn East",
        stops: [
            { point: "Brooklyn North", fees: "3,500.00", distance: "20.0", time: "11:30 AM" },
            { point: "Brooklyn East", fees: "28,000.00", distance: "12.0", time: "2:17 PM" },
            { point: "Brooklyn Central", fees: "3,500.00", distance: "25.0", time: "12:30 PM" },
            { point: "Brooklyn South", fees: "7,000.00", distance: "15.0", time: "2:30 PM" },
            { point: "Ranital Chowk", fees: "7,000.00", distance: "20.0", time: "3:00 PM" },
        ],
    },
    {
        id: "3",
        route: "Brooklyn South",
        stops: [
            { point: "Brooklyn North", fees: "3,500.00", distance: "20.0", time: "10:30 AM" },
            { point: "High Court", fees: "7,000.00", distance: "10.0", time: "11:00 AM" },
            { point: "Railway Station", fees: "3,500.00", distance: "15.0", time: "11:45 AM" },
            { point: "Brooklyn West", fees: "3,500.00", distance: "20.0", time: "12:30 PM" },
        ],
    },
    {
        id: "4",
        route: "Brooklyn North",
        stops: [
            { point: "Brooklyn West", fees: "3,500.00", distance: "20.0", time: "10:00 AM" },
            { point: "Brooklyn East", fees: "3,500.00", distance: "20.0", time: "10:30 AM" },
            { point: "Brooklyn South", fees: "7,000.00", distance: "15.0", time: "11:30 AM" },
            { point: "Brooklyn Central", fees: "7,000.00", distance: "25.0", time: "12:15 PM" },
        ],
    },
    {
        id: "5",
        route: "Brooklyn West",
        stops: [
            { point: "Brooklyn North", fees: "7,000.00", distance: "20.0", time: "11:00 AM" },
            { point: "Brooklyn West", fees: "3,500.00", distance: "10.0", time: "11:30 AM" },
            { point: "Brooklyn South", fees: "7,000.00", distance: "20.0", time: "12:15 PM" },
            { point: "Brooklyn Central", fees: "7,000.00", distance: "25.0", time: "12:45 PM" },
        ],
    },
];

export default function RoutePickupPointPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredData = mockData.filter((item) =>
        item.route.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-sm font-medium text-gray-800 tracking-tight">Route Pickup Point</h2>
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
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                        <div className="flex items-center gap-1 cursor-pointer">Route <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                        <div className="flex items-center gap-1 cursor-pointer">Pickup Point <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                        <div className="flex items-center gap-1 cursor-pointer">Monthly Fees (₹) <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                        <div className="flex items-center gap-1 cursor-pointer">Distance (km) <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                        <div className="flex items-center gap-1 cursor-pointer">Pickup Time <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item) => (
                                    <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors align-top">
                                        <TableCell className="py-4 text-gray-700 font-medium">{item.route}</TableCell>
                                        <TableCell className="py-4">
                                            <div className="space-y-1">
                                                {item.stops.map((stop, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <span className="text-gray-400 font-bold w-4">{i + 1}</span>
                                                        <span className="text-gray-600">{stop.point}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="space-y-1">
                                                {item.stops.map((stop, i) => (
                                                    <div key={i} className="flex items-center h-4">
                                                        <span className="text-gray-600">{stop.fees}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="space-y-1">
                                                {item.stops.map((stop, i) => (
                                                    <div key={i} className="flex items-center h-4">
                                                        <span className="text-gray-600">{stop.distance}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="space-y-1">
                                                {item.stops.map((stop, i) => (
                                                    <div key={i} className="flex items-center h-4">
                                                        <span className="text-gray-600">{stop.time}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <Eye className="h-3 w-3" />
                                                </Button>
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
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50">
                        <div>
                            Showing 1 to {filteredData.length} of {mockData.length} entries
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
    );
}
