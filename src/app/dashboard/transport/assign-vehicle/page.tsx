"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

interface VehicleAssignment {
    id: string;
    route: string;
    vehicles: string[];
}

const mockAssignments: VehicleAssignment[] = [
    { id: "1", route: "Brooklyn Central", vehicles: ["VH1001"] },
    { id: "2", route: "Brooklyn East", vehicles: ["VH4584", "VH1001"] },
    { id: "3", route: "Brooklyn West", vehicles: ["VH4584", "VH5645"] },
    { id: "4", route: "Brooklyn South", vehicles: ["VH5645"] },
    { id: "5", route: "Brooklyn North", vehicles: ["VH5645"] },
];

const availableVehicles = ["VH4584", "VH5645", "VH1001"];

export default function AssignVehiclePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);

    const filteredAssignments = mockAssignments.filter((a) =>
        a.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.vehicles.some(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const toggleVehicle = (vehicle: string) => {
        setSelectedVehicles(prev =>
            prev.includes(vehicle) ? prev.filter(v => v !== vehicle) : [...prev, vehicle]
        );
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Assign Vehicle On Route Form */}
                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800 tracking-tight">Assign Vehicle On Route</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Route <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Select>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="central">Brooklyn Central</SelectItem>
                                        <SelectItem value="east">Brooklyn East</SelectItem>
                                        <SelectItem value="west">Brooklyn West</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Vehicle <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <div className="space-y-2.5 ml-1">
                                    {availableVehicles.map((v) => (
                                        <div key={v} className="flex items-center space-x-2.5 group cursor-pointer">
                                            <Checkbox
                                                id={v}
                                                checked={selectedVehicles.includes(v)}
                                                onChange={() => toggleVehicle(v)}
                                                className="h-3.5 w-3.5 border-gray-300 accent-indigo-500 rounded-sm"
                                            />
                                            <Label htmlFor={v} className="text-[11px] text-gray-600 font-medium cursor-pointer group-hover:text-indigo-600 transition-colors">
                                                {v}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Vehicle Route List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                        <h2 className="text-sm font-medium text-gray-800 tracking-tight">Vehicle Route List</h2>

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
                            <Table className="min-w-[600px]">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Route <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Vehicle <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAssignments.map((assignment) => (
                                        <TableRow key={assignment.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                            <TableCell className="py-3 text-gray-700 font-medium">{assignment.route}</TableCell>
                                            <TableCell className="py-3 text-gray-500 leading-relaxed italic font-medium">
                                                {assignment.vehicles.join(", ")}
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
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
                                Showing 1 to {filteredAssignments.length} of {mockAssignments.length} entries
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
        </div>
    );
}
