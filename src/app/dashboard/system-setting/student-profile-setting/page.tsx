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
    ChevronRight
} from "lucide-react";

// Mock Data for Dashboard Settings
const dashboardWidgetsRaw = [
    { id: 1, name: "Welcome Student", student: true, parent: true },
    { id: 2, name: "Notice Board", student: true, parent: true },
    { id: 3, name: "Subject Progress", student: true, parent: true },
    { id: 4, name: "Upcoming Class", student: true, parent: true },
    { id: 5, name: "Homework", student: true, parent: true },
    { id: 6, name: "Teacher List", student: true, parent: true },
    { id: 7, name: "Visitor List", student: true, parent: true },
    { id: 8, name: "Library", student: true, parent: true },
];

export default function StudentProfileSettingPage() {
    // State for Dashboard Setting Tab
    const [dashboardWidgets, setDashboardWidgets] = useState(dashboardWidgetsRaw);
    const [searchTerm, setSearchTerm] = useState("");

    // State for Student Profile Update Tab
    const [allowEditable, setAllowEditable] = useState(false);

    // Toggle Handlers
    const toggleDashboardWidget = (id: number, type: 'student' | 'parent') => {
        setDashboardWidgets(prev => prev.map(widget =>
            widget.id === id ? { ...widget, [type]: !widget[type] } : widget
        ));
    };

    const filteredWidgets = dashboardWidgets.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans space-y-4">

            {/* Page Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">

                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-50">
                    <h1 className="text-[14px] font-medium text-gray-700">Student Profile Setting</h1>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="student-profile-update" className="flex flex-col flex-1">
                    <div className="px-4 border-b border-gray-100">
                        <TabsList className="bg-transparent h-10 p-0 space-x-6">
                            <TabsTrigger
                                value="student-profile-update"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-1 pb-2 h-full shadow-none bg-transparent text-[13px]"
                            >
                                Student Profile Update
                            </TabsTrigger>
                            <TabsTrigger
                                value="dashboard-setting"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-1 pb-2 h-full shadow-none bg-transparent text-[13px]"
                            >
                                Dashboard Setting
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Tab 1: Student Profile Update Content */}
                    <TabsContent value="student-profile-update" className="mt-0 p-6">
                        <div className="space-y-6 max-w-4xl">
                            <div className="flex items-center gap-12 border-b border-gray-50 pb-6">
                                <label className="text-[13px] font-medium text-gray-700 w-48">Allow Editable Form Fields</label>
                                <div className="flex items-center gap-4">
                                    <Switch
                                        checked={allowEditable}
                                        onCheckedChange={setAllowEditable}
                                        className="data-[state=checked]:bg-indigo-600 scale-90"
                                    />
                                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md">
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Dashboard Setting Content */}
                    <TabsContent value="dashboard-setting" className="mt-0 flex-1 flex flex-col">
                        {/* Toolbar */}
                        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50/50">
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
                                            <TableHead className="h-10 px-4 font-bold text-gray-600 text-[11px] w-full cursor-pointer hover:text-indigo-600 transition-colors group">
                                                <div className="flex items-center gap-1">Name <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" /></div>
                                            </TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600 text-[11px] text-center w-24">
                                                <div className="flex items-center justify-center gap-1">Student <ArrowUpDown className="h-3 w-3 opacity-30" /></div>
                                            </TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600 text-[11px] text-center w-24">
                                                <div className="flex items-center justify-center gap-1">Parent <ArrowUpDown className="h-3 w-3 opacity-30" /></div>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredWidgets.map((widget) => (
                                            <TableRow key={widget.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors h-11 group">
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-600 font-medium">{widget.name}</TableCell>
                                                <TableCell className="py-2 px-4 text-center">
                                                    <div className="flex justify-center">
                                                        <Switch
                                                            checked={widget.student}
                                                            onCheckedChange={() => toggleDashboardWidget(widget.id, 'student')}
                                                            className="data-[state=checked]:bg-[#6366f1] scale-90 transition-all"
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2 px-4 text-center">
                                                    <div className="flex justify-center">
                                                        <Switch
                                                            checked={widget.parent}
                                                            onCheckedChange={() => toggleDashboardWidget(widget.id, 'parent')}
                                                            className="data-[state=checked]:bg-[#6366f1] scale-90 transition-all"
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredWidgets.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-24 text-center text-[12px] text-gray-400">
                                                    No records found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between pt-4">
                                <p className="text-[10px] text-gray-500 font-medium">
                                    Showing 1 to {filteredWidgets.length} of {dashboardWidgets.length} entries
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
