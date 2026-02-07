"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    Pencil,
    Tag,
    Search,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Standard Role Interface
interface Role {
    id: string;
    name: string;
    type: string;
}

// Mock Data
const initialRoles: Role[] = [
    { id: "1", name: "Admin", type: "System" },
    { id: "2", name: "Teacher", type: "System" },
    { id: "3", name: "Accountant", type: "System" },
    { id: "4", name: "Librarian", type: "System" },
    { id: "5", name: "Receptionist", type: "System" },
    { id: "6", name: "Super Admin", type: "System" },
];

export default function RolesPermissionsPage() {
    const [roles, setRoles] = useState<Role[]>(initialRoles);
    const [searchTerm, setSearchTerm] = useState("");

    // Simple search filter
    const filteredRoles = roles.filter((role) =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans flex flex-col md:flex-row gap-6 items-start">

            {/* Left Column: Create Role Form */}
            <div className="w-full md:w-1/3 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-50 p-4">
                        <h2 className="text-[13px] font-medium text-gray-700">Role</h2>
                    </div>

                    <div className="p-5 space-y-6">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-600">Name <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder=""
                                className="h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-50 p-4 bg-white flex justify-end">
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md">
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Column: Role List */}
            <div className="w-full md:w-2/3 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="border-b border-gray-50 p-4">
                        <h2 className="text-[13px] font-medium text-gray-700">Role List</h2>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="relative w-full sm:w-auto">
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-8 w-full sm:w-64 text-[11px] pl-3 border-gray-200 shadow-none rounded bg-gray-50/50 focus:bg-white transition-colors"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-7 w-7 text-gray-500 border-gray-200 hover:bg-gray-50"><Copy className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 text-gray-500 border-gray-200 hover:bg-gray-50"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 text-gray-500 border-gray-200 hover:bg-gray-50"><FileText className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 text-gray-500 border-gray-200 hover:bg-gray-50"><Printer className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 text-gray-500 border-gray-200 hover:bg-gray-50"><Columns className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="border border-gray-100 rounded overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                        <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase w-1/2">Role</TableHead>
                                        <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase w-1/3">Type</TableHead>
                                        <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRoles.map((role) => (
                                        <TableRow key={role.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                            <TableCell className="py-2.5 px-4 text-[11px] font-medium text-gray-700">{role.name}</TableCell>
                                            <TableCell className="py-2.5 px-4 text-[11px] text-gray-500">{role.type}</TableCell>
                                            <TableCell className="py-2.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button size="icon" className="h-6 w-6 rounded bg-[#6366f1] hover:bg-[#5558dd] text-white shadow-sm transition-all" title="Assign Permission">
                                                        <Tag className="h-3 w-3" />
                                                    </Button>
                                                    <Button size="icon" className="h-6 w-6 rounded bg-[#6366f1] hover:bg-[#5558dd] text-white shadow-sm transition-all" title="Edit">
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredRoles.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-[11px] text-gray-400">
                                                No data available in table
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-[10px] text-gray-500 font-medium">
                                Showing 1 to {filteredRoles.length} of {filteredRoles.length} entries
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
                    </div>
                </div>
            </div>

        </div>
    );
}
