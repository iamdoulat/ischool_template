"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    CloudUpload,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Mock Data for Online Admission Fields
const admissionFields = [
    { id: 1, name: "Last Name", active: true },
    { id: 2, name: "Category", active: true },
    { id: 3, name: "Religion", active: true },
    { id: 4, name: "Caste", active: true },
    { id: 5, name: "Mobile Number", active: true },
    { id: 6, name: "Email", active: true },
    { id: 7, name: "Student Photo", active: true },
    { id: 8, name: "House", active: true },
    { id: 9, name: "Blood Group", active: true },
    { id: 10, name: "Height", active: true },
    { id: 11, name: "Weight", active: true },
    { id: 12, name: "Measurement Date", active: true },
    { id: 13, name: "Father Name", active: true },
    { id: 14, name: "Father Phone", active: true },
    { id: 15, name: "Father Occupation", active: true },
    { id: 16, name: "Father Photo", active: true },
    { id: 17, name: "Mother Name", active: true },
    { id: 18, name: "Mother Phone", active: true },
    { id: 19, name: "Mother Occupation", active: true },
    { id: 20, name: "Mother Photo", active: true },
    { id: 21, name: "If Guardian Is", active: true },
    { id: 22, name: "Guardian Name", active: true },
    { id: 23, name: "Guardian Relation", active: true },
];

export default function OnlineAdmissionPage() {
    const [activeTab, setActiveTab] = useState("form-setting");
    const [fields, setFields] = useState(admissionFields);
    const [searchTerm, setSearchTerm] = useState("");

    // State for Form Settings
    const [onlineAdmission, setOnlineAdmission] = useState(true);
    const [paymentOption, setPaymentOption] = useState(true);

    const toggleField = (id: number) => {
        setFields(prev => prev.map(item =>
            item.id === id ? { ...item, active: !item.active } : item
        ));
    };

    const filteredFields = fields.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans space-y-4">

            {/* Page Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">

                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-50">
                    <h1 className="text-[14px] font-medium text-gray-700">Online Admission</h1>
                </div>

                <Tabs defaultValue="form-setting" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
                    <div className="px-4 border-b border-gray-100">
                        <TabsList className="bg-transparent h-10 p-0 space-x-6">
                            <TabsTrigger
                                value="form-setting"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-1 pb-2 h-full shadow-none bg-transparent text-[13px]"
                            >
                                Online Admission Form Setting
                            </TabsTrigger>
                            <TabsTrigger
                                value="fields-setting"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-1 pb-2 h-full shadow-none bg-transparent text-[13px]"
                            >
                                Online Admission Fields Setting
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Tab 1: Form Setting */}
                    <TabsContent value="form-setting" className="flex-1 p-6 space-y-8 animate-in fade-in duration-300">
                        <div className="space-y-6">
                            {/* Basic Toggles */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 max-w-4xl">
                                <div className="flex items-center justify-between">
                                    <label className="text-[12px] font-bold text-gray-700">Online Admission</label>
                                    <Switch
                                        checked={onlineAdmission}
                                        onCheckedChange={setOnlineAdmission}
                                        className="data-[state=checked]:bg-[#6366f1] scale-90"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-[12px] font-bold text-gray-700">Online Admission Payment Option</label>
                                    <Switch
                                        checked={paymentOption}
                                        onCheckedChange={setPaymentOption}
                                        className="data-[state=checked]:bg-[#6366f1] scale-90"
                                    />
                                </div>

                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-[12px] font-bold text-gray-700">Online Admission Form Fees ($)</label>
                                    <Input className="h-8 text-[12px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full" defaultValue="100.00" />
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[12px] font-bold text-gray-700">Upload Admission Application Form</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg h-8 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <CloudUpload className="h-3 w-3" />
                                                <span className="text-[10px] font-medium">Drag and drop a file here or click</span>
                                            </div>
                                        </div>
                                        <Button size="icon" className="h-8 w-8 bg-[#6366f1] hover:bg-[#5558dd] rounded shadow-sm">
                                            <CloudUpload className="h-3.5 w-3.5 text-white" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions Editor */}
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-gray-700">Online Admission Instructions</label>
                                <div className="border border-gray-200 rounded-md overflow-hidden">
                                    {/* Editor Toolbar */}
                                    <div className="bg-gray-50 p-1 flex items-center gap-1 border-b border-gray-200 flex-wrap">
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><Bold className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><Italic className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><Underline className="h-3 w-3" /></Button>
                                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><AlignLeft className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><AlignCenter className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><AlignRight className="h-3 w-3" /></Button>
                                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><List className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><ListOrdered className="h-3 w-3" /></Button>
                                    </div>
                                    <Textarea className="min-h-[100px] border-none focus-visible:ring-0 text-[11px] p-3 resize-y rounded-none shadow-none" placeholder="Enter instructions here..." defaultValue="General Instruction:- These instructions pertain to online application for admission to Mount Carmel School..." />
                                </div>
                            </div>

                            {/* Terms & Conditions Editor */}
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-gray-700">Terms & Conditions</label>
                                <div className="border border-gray-200 rounded-md overflow-hidden">
                                    {/* Editor Toolbar */}
                                    <div className="bg-gray-50 p-1 flex items-center gap-1 border-b border-gray-200 flex-wrap">
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><Bold className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6"><Italic className="h-3 w-3" /></Button>
                                    </div>
                                    <Textarea className="min-h-[100px] border-none focus-visible:ring-0 text-[11px] p-3 resize-y rounded-none shadow-none" placeholder="Enter terms here..." defaultValue="General Terms & Conditions for Students:- 1. The User declares that the content of the Portal shall be accessed..." />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-50">
                                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md border-b-2 border-indigo-700">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Fields Setting */}
                    <TabsContent value="fields-setting" className="mt-0 flex-1 flex flex-col">
                        {/* Toolbar */}
                        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-white border-b border-gray-50/50">
                            <div className="relative w-full md:w-56">
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-8 text-[12px] pl-3 border-gray-200 shadow-none rounded bg-white focus:bg-white transition-colors placeholder:text-gray-400"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Select defaultValue="50">
                                        <SelectTrigger className="h-7 w-14 text-[11px] border-gray-200 shadow-none rounded bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Copy className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><FileText className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Printer className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Columns className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 p-4 bg-white overflow-auto">
                            <div className="border border-gray-100 rounded overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-gray-50/40">
                                        <TableRow className="border-b border-gray-100 hover:bg-transparent text-[11px]">
                                            <TableHead className="h-10 px-4 font-bold text-gray-600 text-[11px] uppercase w-full cursor-pointer hover:text-indigo-600 transition-colors group">
                                                <div className="flex items-center gap-1">Name <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" /></div>
                                            </TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600 text-[11px] uppercase text-right w-24">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredFields.map((item) => (
                                            <TableRow key={item.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors h-11 group">
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-600 font-medium">{item.name}</TableCell>
                                                <TableCell className="py-2 px-4 text-right">
                                                    <div className="flex justify-end">
                                                        <Switch
                                                            checked={item.active}
                                                            onCheckedChange={() => toggleField(item.id)}
                                                            className="data-[state=checked]:bg-[#6366f1] scale-90 transition-all"
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredFields.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-24 text-center text-[12px] text-gray-400">
                                                    No matching records found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between pt-4">
                                <p className="text-[10px] text-gray-500 font-medium">
                                    Showing 1 to {filteredFields.length} of {fields.length} entries
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50" disabled>
                                        <ChevronLeft className="h-3 w-3" />
                                    </Button>
                                    <Button className="h-7 w-7 p-0 text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 hover:text-indigo-700 aspect-square">1</Button>
                                    <Button variant="outline" size="icon" className="h-7 w-7 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50" disabled>
                                        <ChevronRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}
