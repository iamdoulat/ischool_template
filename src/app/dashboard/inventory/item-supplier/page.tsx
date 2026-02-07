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
    Phone,
    Mail,
    User,
    MapPin,
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

interface Supplier {
    id: string;
    name: string;
    phone: string;
    email: string;
    contactPerson: {
        name: string;
        phone: string;
        email: string;
    };
    address: string;
}

const mockSuppliers: Supplier[] = [
    {
        id: "1",
        name: "Camlin Stationeries",
        phone: "8458435583",
        email: "camlin@gmail.com",
        contactPerson: {
            name: "Bruce Stark",
            phone: "847487932",
            email: "bruce@gmail.com",
        },
        address: "22 Cristal Way, CA",
    },
    {
        id: "2",
        name: "Jhonson Uniform Dress",
        phone: "8798787856",
        email: "jhon@gmail.com",
        contactPerson: {
            name: "David",
            phone: "87878785678",
            email: "david@gmail.com",
        },
        address: "22 Cristal Way, CA",
    },
    {
        id: "3",
        name: "David Furniture",
        phone: "678678678",
        email: "da@gmail.com",
        contactPerson: {
            name: "Peter",
            phone: "685675578",
            email: "pet@gmail.com",
        },
        address: "22 Cristal Way, CA",
    },
    {
        id: "4",
        name: "Jhon smith Supplier",
        phone: "8908898875",
        email: "jhon@gmail.com",
        contactPerson: {
            name: "David",
            phone: "8987878578",
            email: "david@gmail.com",
        },
        address: "Delhi Road, DR",
    },
];

export default function ItemSupplierPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredSuppliers = mockSuppliers.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactPerson.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs text-gray-700">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Add Item Supplier Form */}
                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800 tracking-tight">Add Item Supplier</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight flex justify-between">
                                    Name <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <div className="relative group">
                                    <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none pr-8" placeholder="" />
                                    <div className="absolute right-2 top-1.5 h-5 w-5 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                                        <div className="w-2.5 h-0.5 bg-gray-400 rounded-full flex gap-0.5 items-center justify-center">
                                            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full" />
                                            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full" />
                                            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Phone</Label>
                                <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Email</Label>
                                <div className="relative">
                                    <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none pr-8" placeholder="" />
                                    <Mail className="absolute right-2.5 top-2.5 h-3 w-3 text-emerald-500" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Address</Label>
                                <Textarea className="min-h-[70px] border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none resize-none" placeholder="" />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Contact Person Name</Label>
                                <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Contact Person Phone</Label>
                                <div className="relative group">
                                    <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none pr-8" placeholder="" />
                                    <div className="absolute right-2 top-1.5 h-5 w-5 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                                        <div className="w-2.5 h-0.5 bg-gray-400 rounded-full flex gap-0.5 items-center justify-center">
                                            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full" />
                                            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full" />
                                            <div className="w-0.5 h-0.5 bg-gray-400 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Contact Person Email</Label>
                                <div className="relative">
                                    <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none pr-8" placeholder="" />
                                    <Mail className="absolute right-2.5 top-2.5 h-3 w-3 text-emerald-500" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Description</Label>
                                <Textarea className="min-h-[70px] border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none resize-none" placeholder="" />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Item Supplier List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                        <h2 className="text-sm font-medium text-gray-800 tracking-tight">Item Supplier List</h2>

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
                            <Table className="min-w-[900px]">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Item Supplier <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Contact Person <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Address <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSuppliers.map((s) => (
                                        <TableRow key={s.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                            <TableCell className="py-4">
                                                <div className="space-y-1.5 min-w-[200px]">
                                                    <div className="font-semibold text-gray-700 underline decoration-indigo-200 underline-offset-2">{s.name}</div>
                                                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50/50 w-fit px-1.5 py-0.5 rounded border border-gray-100/50">
                                                        <Phone className="h-3 w-3 text-indigo-400 shrink-0" />
                                                        <span>{s.phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50/50 w-fit px-1.5 py-0.5 rounded border border-gray-100/50">
                                                        <Mail className="h-3 w-3 text-emerald-400 shrink-0" />
                                                        <span>{s.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="space-y-1.5 min-w-[200px]">
                                                    <div className="flex items-center gap-1.5 font-semibold text-gray-700 underline decoration-indigo-200 underline-offset-2">
                                                        <User className="h-3 w-3 text-amber-500" />
                                                        {s.contactPerson.name}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50/50 w-fit px-1.5 py-0.5 rounded border border-gray-100/50">
                                                        <Phone className="h-3 w-3 text-indigo-400 shrink-0" />
                                                        <span>{s.contactPerson.phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50/50 w-fit px-1.5 py-0.5 rounded border border-gray-100/50">
                                                        <Mail className="h-3 w-3 text-emerald-400 shrink-0" />
                                                        <span>{s.contactPerson.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-start gap-2 text-gray-500 max-w-[250px] bg-gray-50/30 p-2 rounded border border-gray-100">
                                                    <MapPin className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" />
                                                    <span className="whitespace-normal leading-relaxed">{s.address}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 bg-[#6366f1] hover:bg-[#5558dd] text-white rounded transition-colors shadow-sm">
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 bg-[#6366f1] hover:bg-[#5558dd] text-white rounded transition-colors shadow-sm">
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
                                Showing 1 to {filteredSuppliers.length} of {mockSuppliers.length} entries
                            </div>
                            <div className="flex gap-1 items-center">
                                <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600 text-sm">‹</span>
                                <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded shadow-sm">
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
