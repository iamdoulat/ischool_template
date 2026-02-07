"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
    Eye,
    ArrowUpDown,
    Upload,
    Image as ImageIcon,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface IDCardTemplate {
    id: string;
    title: string;
    backgroundImage: string;
    designType: string;
}

const mockTemplates: IDCardTemplate[] = [
    { id: "1", title: "Sample Student Identity Card", backgroundImage: "bg_preview.png", designType: "Horizontal" },
    { id: "2", title: "Sample Student Identity Card Vertical", backgroundImage: "bg_preview_v.png", designType: "Vertical" },
];

const toggleFields = [
    { label: "Admission No", id: "admission_no" },
    { label: "Student Name", id: "student_name" },
    { label: "Class", id: "class" },
    { label: "Father Name", id: "father_name" },
    { label: "Mother Name", id: "mother_name" },
    { label: "Student Address", id: "student_address" },
    { label: "Phone", id: "phone" },
    { label: "Date Of Birth", id: "dob" },
    { label: "Blood Group", id: "blood_group" },
    { label: "Design Type", id: "design_type" },
    { label: "Barcode / QR Code", id: "barcode_qr" },
    { label: "Roll No", id: "roll_no" },
    { label: "House", id: "house" },
];

export default function StudentIDCardPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTemplates = mockTemplates.filter((t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Add Student ID Card Form */}
                <div className="w-full lg:w-[450px]">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800 tracking-tight">Add Student ID Card</h2>
                        </div>
                        <div className="p-4 space-y-5">
                            {/* Asset Uploads */}
                            <div className="space-y-4">
                                {[
                                    { label: "Background Image", id: "bg" },
                                    { label: "Logo", id: "logo" },
                                    { label: "Signature", id: "sign" },
                                ].map((asset) => (
                                    <div key={asset.id} className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{asset.label}</Label>
                                        <div className="border border-dashed border-gray-200 rounded p-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
                                            <Upload className="h-3 w-3 text-gray-400" />
                                            <span className="text-[10px] text-gray-400">Drag and drop a file here or click</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* General Inputs */}
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                        School Name <span className="text-red-500 font-bold">*</span>
                                    </Label>
                                    <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Address / Phone / Email</Label>
                                    <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                        ID Card Title <span className="text-red-500 font-bold">*</span>
                                    </Label>
                                    <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Header Color</Label>
                                    <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-3 pt-4 border-t border-gray-50">
                                {toggleFields.map((field) => (
                                    <div key={field.id} className="flex items-center justify-between py-0.5">
                                        <Label htmlFor={field.id} className="text-[11px] font-medium text-gray-600">{field.label}</Label>
                                        <Switch id={field.id} className="data-[state=checked]:bg-indigo-500 scale-75" />
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Student ID Card List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                        <h2 className="text-sm font-medium text-gray-800 tracking-tight">Student ID Card List</h2>

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
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">
                                            <div className="flex items-center gap-1 cursor-pointer">ID Card Title <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="py-3 px-4">
                                            <div className="flex items-center gap-1 cursor-pointer">Background Image <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="py-3 px-4">
                                            <div className="flex items-center gap-1 cursor-pointer">Design Type <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="py-3 px-4 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTemplates.map((template) => (
                                        <TableRow key={template.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                            <TableCell className="py-3 px-4 text-gray-700 font-medium">{template.title}</TableCell>
                                            <TableCell className="py-3 px-4">
                                                <div className="h-10 w-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center group cursor-pointer hover:bg-gray-200 transition-colors relative">
                                                    <ImageIcon className="h-5 w-5 text-red-500 opacity-60" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500 font-medium">{template.designType}</TableCell>
                                            <TableCell className="py-3 px-4 text-right">
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
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                            <div>
                                Showing 1 to {filteredTemplates.length} of {mockTemplates.length} entries
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
