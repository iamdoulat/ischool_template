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

interface Vehicle {
    id: string;
    vehicleNumber: string;
    vehicleModel: string;
    yearMade: string;
    registrationNumber: string;
    chassisNumber: string;
    maxSeatingCapacity: string;
    driverName: string;
    driverLicense: string;
    driverContact: string;
}

const mockVehicles: Vehicle[] = [
    {
        id: "1",
        vehicleNumber: "VH4584",
        vehicleModel: "Ford CAG",
        yearMade: "2015",
        registrationNumber: "FFG-76575676787",
        chassisNumber: "523422",
        maxSeatingCapacity: "50",
        driverName: "Jasper",
        driverLicense: "258714545",
        driverContact: "8521473610",
    },
    {
        id: "2",
        vehicleNumber: "VH5645",
        vehicleModel: "Volvo Bus",
        yearMade: "2018",
        registrationNumber: "BGBFDF787987856",
        chassisNumber: "45433",
        maxSeatingCapacity: "50",
        driverName: "Maximus",
        driverLicense: "545645656775",
        driverContact: "885456456",
    },
    {
        id: "3",
        vehicleNumber: "VH1001",
        vehicleModel: "Volvo Bus",
        yearMade: "2017",
        registrationNumber: "FVFF-38737835",
        chassisNumber: "45453",
        maxSeatingCapacity: "50",
        driverName: "Michel",
        driverLicense: "R534534",
        driverContact: "8657777852",
    },
];

export default function VehiclePage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredVehicles = mockVehicles.filter((v) =>
        v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.driverName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-sm font-medium text-gray-800 tracking-tight">Vehicle List</h2>
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
                                        <div className="flex items-center gap-1 cursor-pointer whitespace-nowrap">Vehicle Number <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                        <div className="flex items-center gap-1 cursor-pointer whitespace-nowrap">Vehicle Model <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1 cursor-pointer">Year Made <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                        <div className="flex items-center gap-1 cursor-pointer whitespace-nowrap">Registration Number <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                        <div className="flex items-center gap-1 cursor-pointer whitespace-nowrap">Chassis Number <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap">Max Seating Capacity <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                        <div className="flex items-center gap-1 cursor-pointer whitespace-nowrap">Driver Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                        <div className="flex items-center gap-1 cursor-pointer whitespace-nowrap">Driver License <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                        <div className="flex items-center gap-1 cursor-pointer whitespace-nowrap">Driver Contact <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVehicles.map((vehicle) => (
                                    <TableRow key={vehicle.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3 text-gray-700 font-medium">{vehicle.vehicleNumber}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{vehicle.vehicleModel}</TableCell>
                                        <TableCell className="py-3 text-center text-gray-500">{vehicle.yearMade}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{vehicle.registrationNumber}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{vehicle.chassisNumber}</TableCell>
                                        <TableCell className="py-3 text-center text-gray-500">{vehicle.maxSeatingCapacity}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{vehicle.driverName}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{vehicle.driverLicense}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{vehicle.driverContact}</TableCell>
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
                            Showing 1 to {filteredVehicles.length} of {mockVehicles.length} entries
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
