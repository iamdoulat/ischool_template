"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    ChevronLeft,
    ChevronRight,
    ArrowUpDown
} from "lucide-react";

// Mock Data
const studentFields = [
    { id: 1, name: "Roll Number", active: true },
    { id: 2, name: "Middle Name", active: false },
    { id: 3, name: "Last Name", active: true },
    { id: 4, name: "Category", active: true },
    { id: 5, name: "Religion", active: true },
    { id: 6, name: "Caste", active: true },
    { id: 7, name: "Mobile Number", active: true },
    { id: 8, name: "Email", active: true },
    { id: 9, name: "Admission Date", active: true },
    { id: 10, name: "Student Photo", active: true },
    { id: 11, name: "House", active: true },
    { id: 12, name: "Blood Group", active: true },
    { id: 13, name: "Height", active: true },
    { id: 14, name: "Weight", active: true },
    { id: 15, name: "Measurement Date", active: true },
    { id: 16, name: "Father Name", active: true },
    { id: 17, name: "Father Phone", active: true },
    { id: 18, name: "Father Occupation", active: true },
    { id: 19, name: "RTE", active: true },
    { id: 20, name: "Previous School Details", active: true },
    { id: 21, name: "Note", active: true },
    { id: 22, name: "Upload Documents", active: true },
    { id: 23, name: "Barcode", active: true },
];

export default function SystemFieldsPage() {
    const [fields, setFields] = useState(studentFields);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("student");

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
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">

                {/* Header with Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-center px-4 py-2 border-b border-gray-100 relative">
                    <h1 className="text-[16px] font-medium text-gray-700">System Fields</h1>

                    <Tabs defaultValue="student" className="w-full md:w-auto mt-2 md:mt-0" onValueChange={setActiveTab}>
                        <TabsList className="bg-transparent border-b-0 h-10 p-0 space-x-6">
                            <TabsTrigger
                                value="student"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-4 pb-2 h-full shadow-none bg-transparent"
                            >
                                Student
                            </TabsTrigger>
                            <TabsTrigger
                                value="staff"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-4 pb-2 h-full shadow-none bg-transparent"
                            >
                                Staff
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Toolbar */}
                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-white border-b border-gray-50/50">
                    <div className="relative w-full md:w-48">
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

                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-white p-4">
                    {activeTab === "student" ? (
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
                                                No records found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-400 text-sm border border-gray-100 rounded bg-gray-50/30">
                            System fields configuration for {activeTab} is currently unavailable.
                        </div>
                    )}

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

            </div>
        </div>
    );
}
