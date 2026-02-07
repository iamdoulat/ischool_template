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
import { Input } from "@/components/ui/input";
import {
    Search,
    FileText,
    PlusSquare,
    ClipboardList,
    Copy,
    FileSpreadsheet,
    FileBox,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const reportLinks = [
    { name: "Stack Report", icon: FileText, active: true },
    { name: "Add Item Report", icon: PlusSquare },
    { name: "Issue Item Report", icon: ClipboardList },
];

interface StockItem {
    name: string;
    category: string;
    supplier: string;
    store: string;
    availableQty: number;
    totalQty: number;
    totalIssued: number;
}

const mockStock: StockItem[] = [
    { name: "Class Board", category: "Books Stationery", supplier: "Camlin Stationers", store: "Library Store", availableQty: 260, totalQty: 280, totalIssued: 27 },
    { name: "Football", category: "Sports", supplier: "Camlin Stationers", store: "Science Store", availableQty: 104, totalQty: 112, totalIssued: 8 },
    { name: "Cricket Bat", category: "Sports", supplier: "Camlin Stationers", store: "Library Store", availableQty: 221, totalQty: 250, totalIssued: 20 },
    { name: "Uniform", category: "Staff Dress", supplier: "jhonson Uniform Dress", store: "Uniform Dress Store", availableQty: 28, totalQty: 48, totalIssued: 30 },
    { name: "Benches", category: "Furniture", supplier: "David Furniture", store: "Furniture Store", availableQty: 27, totalQty: 50, totalIssued: 23 },
    { name: "Table chair", category: "Furniture", supplier: "David Furniture", store: "Furniture Store", availableQty: 4, totalQty: 12, totalIssued: 18 },
    { name: "Desk", category: "Furniture", supplier: "David Furniture", store: "Furniture Store", availableQty: 233, totalQty: 234, totalIssued: 1 },
    { name: "Lab Equipment", category: "Chemistry Lab Apparatus", supplier: "Jhon smith Supplier", store: "Chemistry Equipment", availableQty: 40, totalQty: 50, totalIssued: 20 },
    { name: "Projectors", category: "Chemistry Lab Apparatus", supplier: "Jhon smith Supplier", store: "Chemistry Equipment", availableQty: 39, totalQty: 45, totalIssued: 6 },
];

export default function InventoryReportPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Inventory Report</h1>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type</Label>
                        <Select>
                            <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="this_week">This Week</SelectItem>
                                <SelectItem value="this_month">This Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end">
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5">
                            <Search className="h-3 w-3" />
                            Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stock Report Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Stock Report</h2>

                {/* Table Toolbar */}
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
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">100</span>
                            <Select defaultValue="100">
                                <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
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

                {/* Results Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1200px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Category <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Supplier <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Store <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-center">Available Quantity <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-center">Total Quantity <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-right">Total Issued</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockStock.map((item, idx) => (
                                <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{item.name}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{item.category}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{item.supplier}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{item.store}</TableCell>
                                    <TableCell className="py-3 px-4 text-center text-emerald-600 font-bold">{item.availableQty}</TableCell>
                                    <TableCell className="py-3 px-4 text-center text-gray-500">{item.totalQty}</TableCell>
                                    <TableCell className="py-3 px-4 text-right text-gray-500">{item.totalIssued}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>Showing 1 to 9 of 9 entries</div>
                    <div className="flex gap-1 items-center">
                        <ChevronLeft className="h-3.5 w-3.5 text-gray-300 cursor-pointer" />
                        <Button size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded shadow-sm">
                            1
                        </Button>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 cursor-pointer" />
                    </div>
                </div>
            </div>
        </div>
    );
}
