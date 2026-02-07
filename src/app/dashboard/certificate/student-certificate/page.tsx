"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface CertificateTemplate {
    id: string;
    name: string;
    backgroundImage: string;
}

const mockTemplates: CertificateTemplate[] = [
    { id: "1", name: "sample transfer certificate", backgroundImage: "bg_preview.png" },
];

const placeholders = [
    "[name]", "[dob]", "[present_address]", "[guardian]", "[created_at]",
    "[admission_no]", "[roll_no]", "[class]", "[section]", "[gender]",
    "[admission_date]", "[category]", "[cast]", "[father_name]", "[mother_name]",
    "[religion]", "[email]", "[phone]", "[present_date]", "[Medical History]"
];

export default function StudentCertificatePage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Add Student Certificate Form */}
                <div className="w-full lg:w-[450px]">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800 tracking-tight">Add Student Certificate</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Certificate Name <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Header Left Text</Label>
                                <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Header Center Text</Label>
                                <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Header Right Text</Label>
                                <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Body Text <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Textarea className="min-h-[100px] border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none resize-none" placeholder="" />
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {placeholders.map((p) => (
                                        <span key={p} className="text-[9px] text-blue-500/80 font-medium cursor-pointer hover:underline">{p}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Footer Left Text</Label>
                                <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Footer Center Text</Label>
                                <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Footer Right Text</Label>
                                <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                            </div>

                            <div className="space-y-3 pt-2">
                                <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">Certificate Design</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-gray-400">Header Height</Label>
                                        <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-gray-400">Footer Height</Label>
                                        <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-gray-400">Body Height</Label>
                                        <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-gray-400">Body Width</Label>
                                        <Input className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" placeholder="" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 py-2 border-t border-gray-50">
                                <Label className="text-[10px] font-bold text-gray-800 uppercase tracking-tight">Student Photo</Label>
                                <Switch className="data-[state=checked]:bg-indigo-500" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Background Image</Label>
                                <div className="border-2 border-dashed border-gray-100 rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-100 transition-colors bg-gray-50/20">
                                    <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                        <Upload className="h-4 w-4 text-indigo-500" />
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium">Drag and drop a file here or click</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Student Certificate List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                        <h2 className="text-sm font-medium text-gray-800 tracking-tight">Student Certificate List</h2>

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
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">
                                            <div className="flex items-center gap-1 cursor-pointer">Certificate Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="py-3 px-4">Background Image</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockTemplates.map((template) => (
                                        <TableRow key={template.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                            <TableCell className="py-3 px-4 text-[#6366f1] font-medium cursor-pointer hover:underline">{template.name}</TableCell>
                                            <TableCell className="py-3 px-4">
                                                <div className="h-10 w-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center group cursor-pointer hover:bg-gray-200 transition-colors relative">
                                                    <ImageIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded" />
                                                </div>
                                            </TableCell>
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
                                Showing 1 to {mockTemplates.length} of {mockTemplates.length} entries
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
