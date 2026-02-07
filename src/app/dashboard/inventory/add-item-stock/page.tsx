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
    ArrowUpDown,
    UploadCloud,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ItemStock {
    id: string;
    item: string;
    category: string;
    supplier: string;
    store: string;
    quantity: number;
    purchasePrice: string;
    date: string;
}

const mockStock: ItemStock[] = [
    { id: "1", item: "Desk", category: "Furniture", supplier: "David Furniture", store: "Furniture Store (FS342)", quantity: 234, purchasePrice: "17,150.00", date: "02/26/2026" },
    { id: "2", item: "Projectors", category: "Chemistry Lab Apparatus", supplier: "Jhon smith Supplier", store: "Chemistry Equipment (CH201)", quantity: 45, purchasePrice: "31,920.00", date: "02/28/2026" },
    { id: "3", item: "Class Board", category: "Books Stationery", supplier: "Jhon smith Supplier", store: "Furniture Store (FS342)", quantity: 100, purchasePrice: "24,150.00", date: "02/20/2026" },
    { id: "4", item: "Table chair", category: "Furniture", supplier: "David Furniture", store: "Furniture Store (FS342)", quantity: 12, purchasePrice: "20,000.00", date: "02/17/2026" },
    { id: "5", item: "Uniform", category: "Staff Dress", supplier: "Jhonson Uniform Dress", store: "Uniform Dress Store (UND23)", quantity: 23, purchasePrice: "21,000.00", date: "02/07/2026" },
    { id: "6", item: "Football", category: "Sports", supplier: "Camlin Stationaries", store: "Library Store (LS2)", quantity: 12, purchasePrice: "14,000.00", date: "02/03/2026" },
    { id: "7", item: "Cricket Bat", category: "Sports", supplier: "Camlin Stationaries", store: "Library Store (LS2)", quantity: 200, purchasePrice: "25,820.00", date: "01/22/2026" },
];

export default function AddItemStockPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredStock = mockStock.filter((s) =>
        s.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Add Item Stock */}
                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800">Add Item Stock</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Item Category <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Select>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="furniture">Furniture</SelectItem>
                                        <SelectItem value="sports">Sports</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Item <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Select>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="desk">Desk</SelectItem>
                                        <SelectItem value="football">Football</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Supplier
                                </Label>
                                <Select>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="david">David Furniture</SelectItem>
                                        <SelectItem value="camlin">Camlin Stationaries</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Store
                                </Label>
                                <Select>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="furniture_store">Furniture Store (FS342)</SelectItem>
                                        <SelectItem value="library_store">Library Store (LS2)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Quantity <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <div className="flex gap-0.5">
                                    <div className="flex-1">
                                        <Input type="number" className="h-9 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded-l shadow-none border-r-0" />
                                    </div>
                                    <div className="flex bg-gray-50 border border-gray-200 rounded-r items-center px-2 text-gray-400 text-xs">
                                        + ∨
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Purchase Price (₹) <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input className="h-9 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Date <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input type="text" defaultValue="02/26/2026" className="h-9 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Attach Document
                                </Label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
                                    <UploadCloud className="h-5 w-5 text-gray-400" />
                                    <span className="text-[10px] text-gray-400 font-medium">Drag and drop a file here or click</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Description
                                </Label>
                                <Textarea className="min-h-[80px] border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none resize-none" />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Item Stock List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-sm font-medium text-gray-800">Item Stock List</h2>

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
                            <Table className="min-w-[1000px]">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Item <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Category <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Supplier <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Store <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 cursor-pointer">Quantity <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">
                                            Purchase Price (₹)
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Date <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStock.map((item) => (
                                        <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                            <TableCell className="py-3 text-gray-700 font-medium">{item.item}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.category}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.supplier}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.store}</TableCell>
                                            <TableCell className="py-3 text-right text-gray-700 font-medium">{item.quantity}</TableCell>
                                            <TableCell className="py-3 text-right text-gray-500">{item.purchasePrice}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.date}</TableCell>
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
                                Showing 1 to {filteredStock.length} of {mockStock.length} entries
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
