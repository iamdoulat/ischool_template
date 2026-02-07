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
    Search,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

// Mock Module Data
const modules = [
    { id: 1, name: "Fees Collection", active: true },
    { id: 2, name: "Income", active: true },
    { id: 3, name: "Expense", active: true },
    { id: 4, name: "Student Attendance", active: true },
    { id: 5, name: "Examination", active: true },
    { id: 6, name: "Download Center", active: true },
    { id: 7, name: "Library", active: true },
    { id: 8, name: "Inventory", active: true },
    { id: 9, name: "Transport", active: true },
    { id: 10, name: "Hostel", active: true },
    { id: 11, name: "Communicate", active: true },
    { id: 12, name: "Front CMS", active: true },
    { id: 13, name: "Front Office", active: true },
    { id: 14, name: "Homework", active: true },
    { id: 15, name: "Certificate", active: true },
    { id: 16, name: "Calendar To Do List", active: true },
    { id: 17, name: "Online Examination", active: true },
    { id: 18, name: "Chat", active: true },
    { id: 19, name: "Multi Class", active: true },
    { id: 20, name: "Online Admission", active: true },
    { id: 21, name: "Alumni", active: true },
    { id: 22, name: "Lesson Plan", active: true },
    { id: 23, name: "Annual Calendar", active: true },
    { id: 24, name: "Student CV", active: true },
    { id: 25, name: "Zoom Live Classes", active: true },
    { id: 26, name: "Gmeet Live Classes", active: true },
    { id: 27, name: "Online Course", active: true },
    { id: 28, name: "Behaviour Records", active: true },
    { id: 29, name: "CBSE Examination", active: true },
    { id: 30, name: "Multi Branch", active: true },
    { id: 31, name: "Two Factor Authenticator", active: false },
    { id: 32, name: "QR Code Attendance", active: true },
    { id: 33, name: "Quick Fees", active: true },
    { id: 34, name: "Thermal Print", active: true },
    { id: 35, name: "Whatsapp Messaging", active: true },
];

export default function ModulesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("system");
    const [moduleList, setModuleList] = useState(modules);

    const toggleModule = (id: number) => {
        setModuleList(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
    };

    const filteredModules = moduleList.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans space-y-4">

            {/* Page Layout */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">

                {/* Header with Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-center px-4 py-2 border-b border-gray-100 relative">
                    <h1 className="text-[16px] font-medium text-gray-700">Modules</h1>

                    <Tabs defaultValue="system" className="w-full md:w-auto mt-2 md:mt-0" onValueChange={setActiveTab}>
                        <TabsList className="bg-transparent border-b-0 h-10 p-0 space-x-6">
                            <TabsTrigger
                                value="system"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-4 pb-2 h-full shadow-none bg-transparent"
                            >
                                System
                            </TabsTrigger>
                            <TabsTrigger
                                value="student"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-4 pb-2 h-full shadow-none bg-transparent"
                            >
                                Student
                            </TabsTrigger>
                            <TabsTrigger
                                value="parent"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-4 pb-2 h-full shadow-none bg-transparent"
                            >
                                Parent
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Toolbar */}
                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 bg-white">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 text-[11px] pl-3 border-gray-200 shadow-none rounded bg-gray-50/50 focus:bg-white transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Select defaultValue="50">
                                <SelectTrigger className="h-7 w-16 text-[11px] border-gray-200 shadow-none rounded">
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
                    {activeTab === "system" && (
                        <div className="border border-gray-100 rounded overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="border-b border-gray-100 hover:bg-transparent text-[11px]">
                                        <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase w-full cursor-pointer hover:text-indigo-600 transition-colors group">
                                            <div className="flex items-center gap-1">Name <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" /></div>
                                        </TableHead>
                                        <TableHead className="h-9 px-4 font-bold text-gray-600 text-right w-24 uppercase">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredModules.map((module) => (
                                        <TableRow key={module.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors h-10 group">
                                            <TableCell className="py-2 px-4 text-[12px] text-gray-600 font-medium">{module.name}</TableCell>
                                            <TableCell className="py-2 px-4 text-right">
                                                <div className="flex justify-end">
                                                    <Switch
                                                        checked={module.active}
                                                        onCheckedChange={() => toggleModule(module.id)}
                                                        className="data-[state=checked]:bg-[#6366f1] scale-90 transition-all"
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredModules.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-24 text-center text-[11px] text-gray-400">
                                                No matching records found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-4 px-1">
                        <p className="text-[10px] text-gray-500 font-medium">
                            Showing 1 to {filteredModules.length} of {modules.length} entries
                        </p>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-6 w-6 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50" disabled>
                                <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <Button className="h-6 w-6 p-0 text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 hover:text-indigo-700">1</Button>
                            <Button variant="outline" size="icon" className="h-6 w-6 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50" disabled>
                                <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    {/* Placeholder for other tabs */}
                    {activeTab !== "system" && (
                        <div className="p-12 text-center text-gray-400 text-sm">
                            Configuration for {activeTab} role is currently unavailable.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
