"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    FileText,
    Copy,
    FileSpreadsheet,
    FileBox,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Eraser
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = ["All Users", "Staff", "Students", "Parent", "Guest"];

interface UserLogEntry {
    user: string;
    role: string;
    class?: string;
    ipAddress: string;
    loginTime: string;
    userAgent: string;
}

const mockLogs: UserLogEntry[] = [
    { user: "superadmin@gmail.com", role: "Super Admin", class: "", ipAddress: "192.168.0.152", loginTime: "02/05/2026 11:38:32", userAgent: "Chrome 144.0.0.0, Windows 10" },
    { user: "std98", role: "Student", class: "Class 1(A)", ipAddress: "192.168.0.152", loginTime: "02/05/2026 11:34:24", userAgent: "Chrome 144.0.0.0, Windows 10" },
    { user: "superadmin@gmail.com", role: "Super Admin", class: "", ipAddress: "192.168.0.152", loginTime: "02/05/2026 11:33:05", userAgent: "Chrome 144.0.0.0, Windows 10" },
    { user: "superadmin@gmail.com", role: "Super Admin", class: "", ipAddress: "10.110.1.5", loginTime: "02/04/2026 15:09:18", userAgent: "Chrome 144.0.0.0, Windows 10" },
    { user: "superadmin@gmail.com", role: "Super Admin", class: "", ipAddress: "10.110.1.8", loginTime: "02/04/2026 15:01:43", userAgent: "Chrome 144.0.0.0, Windows 10" },
    { user: "superadmin@gmail.com", role: "Super Admin", class: "", ipAddress: "10.110.1.5", loginTime: "02/04/2026 13:28:13", userAgent: "Chrome 144.0.0.0, Windows 10" },
    { user: "std98", role: "Student", class: "Class 1(A)", ipAddress: "192.168.0.152", loginTime: "02/04/2026 13:12:16", userAgent: "Chrome 144.0.0.0, Windows 10" },
    { user: "superadmin@gmail.com", role: "Super Admin", class: "", ipAddress: "192.168.0.152", loginTime: "02/04/2026 13:08:35", userAgent: "Chrome 144.0.0.0, Windows 10" },
    { user: "std2", role: "Student", class: "Class 1(A)", ipAddress: "10.110.1.6", loginTime: "02/04/2026 12:10:28", userAgent: "Chrome 144.0.0.0, Windows 10" },
    { user: "superadmin@gmail.com", role: "Super Admin", class: "", ipAddress: "10.110.1.6", loginTime: "02/04/2026 12:09:50", userAgent: "Chrome 144.0.0.0, Windows 10" },
    { user: "std98", role: "Student", class: "Class 1(A)", ipAddress: "10.110.1.6", loginTime: "02/04/2026 12:09:04", userAgent: "Chrome 144.0.0.0, Windows 10" },
    { user: "superadmin@gmail.com", role: "Super Admin", class: "", ipAddress: "192.168.0.154", loginTime: "02/04/2026 11:33:38", userAgent: "Chrome 144.0.0.0, Windows 10" },
    { user: "jason@gmail.com", role: "Teacher", class: "", ipAddress: "192.168.0.152", loginTime: "02/03/2026 22:03:12", userAgent: "Chrome 144.0.0.0, Android" },
    { user: "superadmin@gmail.com", role: "Super Admin", class: "", ipAddress: "192.168.0.153", loginTime: "02/03/2026 21:21:29", userAgent: "Chrome 144.0.0.0, Android" },
    { user: "superadmin@gmail.com", role: "Super Admin", class: "", ipAddress: "192.168.0.152", loginTime: "02/03/2026 21:20:13", userAgent: "Chrome 144.0.0.0, Windows 10" },
];

export default function UserLogPage() {
    const [activeTab, setActiveTab] = useState("All Users");
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-sm font-medium text-gray-800 tracking-tight">User Log</h1>
                <div className="flex bg-white border border-gray-100 rounded-md overflow-hidden shadow-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-3 py-1.5 text-[10px] font-bold uppercase transition-colors border-r border-gray-50 last:border-0",
                                activeTab === tab
                                    ? "bg-indigo-50 text-indigo-600 shadow-inner"
                                    : "text-gray-400 hover:bg-gray-50 bg-transparent"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[600px]">

                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-3 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5 w-full md:w-auto">
                            <Eraser className="h-3 w-3" />
                            Clear Userlog Record
                        </Button>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">50</span>
                                <Select defaultValue="50">
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
                </div>

                {/* User Log Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1200px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">Users <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Role <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Class <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">IP Address <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Login Date Time <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-right">User Agent</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockLogs.map((log, idx) => (
                                <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{log.user}</TableCell>
                                    <TableCell className="py-3 px-4">
                                        <span className={cn(
                                            log.role === "Super Admin" ? "text-blue-600" : "text-gray-500"
                                        )}>
                                            {log.role}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{log.class || "-"}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{log.ipAddress}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{log.loginTime}</TableCell>
                                    <TableCell className="py-3 px-4 text-right text-gray-400 font-normal">{log.userAgent}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>Showing 1 to 15 of 320 entries</div>
                    <div className="flex gap-1 items-center">
                        <ChevronLeft className="h-3.5 w-3.5 text-gray-300 cursor-pointer" />
                        <Button size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded shadow-sm">
                            1
                        </Button>
                        <Button size="sm" className="h-6 w-6 p-0 bg-transparent hover:bg-gray-100 text-gray-400 border-0 text-[10px] rounded">
                            2
                        </Button>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 cursor-pointer" />
                    </div>
                </div>
            </div>
        </div>
    );
}
