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
    Search,
    ArrowUpDown
} from "lucide-react";

// Mock Data for Students
const students = [
    { id: 1, admissionNo: "1800011", name: "Edward Thomas", username: "std1", class: "Class 5(A)", fatherName: "Olivier Thomas", mobile: "8233366611", active: true },
    { id: 2, admissionNo: "18002", name: "Robin Peterson", username: "std2", class: "Class 5(A)", fatherName: "Lucas Peterson", mobile: "69898565464", active: true },
    { id: 3, admissionNo: "18005", name: "Glen Stark", username: "std4", class: "Class 5(B)", fatherName: "James Stark", mobile: "9658471234", active: true },
    { id: 4, admissionNo: "18007", name: "Brian Kohlar", username: "std6", class: "Class 5(A)", fatherName: "Nick Kohlar", mobile: "5646546546", active: true },
    { id: 5, admissionNo: "18004", name: "Laura Clinton", username: "std7", class: "Class 5(A)", fatherName: "Michael Clinton", mobile: "65656546", active: true },
    { id: 6, admissionNo: "18008", name: "David Heart", username: "std8", class: "Class 4(A)", fatherName: "Glenn Heart", mobile: "646445641654", active: true },
    { id: 7, admissionNo: "18013", name: "Benjamin Gates", username: "std10", class: "Class 5(A)", fatherName: "Nathan Gates", mobile: "4654646546", active: true },
    { id: 8, admissionNo: "18010", name: "Kriti Singh", username: "std11", class: "Class 5(B)", fatherName: "Manish Singh", mobile: "49456454", active: true },
    { id: 9, admissionNo: "11025", name: "Surya Lalwani", username: "std12", class: "Class 4(A)", fatherName: "James Stark", mobile: "97567987987", active: true },
    { id: 10, admissionNo: "18016", name: "Apolline", username: "std15", class: "Class 5(A)", fatherName: "Elanie", mobile: "895412630", active: true },
    { id: 11, admissionNo: "18023", name: "Karuna Rana", username: "std17", class: "Class 5(A)", fatherName: "Rajesh Rana", mobile: "789654123", active: true },
    { id: 12, admissionNo: "18014", name: "Devin Coinneach", username: "std18", class: "Class 5(A)", fatherName: "jack Coinneach", mobile: "7411478552", active: true },
    { id: 13, admissionNo: "18028", name: "Rahul Sinha", username: "std19", class: "Class 4(C)", fatherName: "B S SINHA", mobile: "7896541230", active: true },
    { id: 14, admissionNo: "18029", name: "Rahul Sinha", username: "std20", class: "Class 5(B)", fatherName: "G S SINHA", mobile: "8527413690", active: true },
    { id: 15, admissionNo: "18025", name: "Jhonson wood", username: "std23", class: "Class 5(C)", fatherName: "David", mobile: "76878567", active: true },
    { id: 16, admissionNo: "18020", name: "Jhony Taylor", username: "std24", class: "Class 4(B)", fatherName: "Paul", mobile: "87978567", active: true },
    { id: 17, admissionNo: "18021", name: "Mohit Raina", username: "std26", class: "Class 4(A)", fatherName: "Ravi Raina", mobile: "789412305", active: true },
    { id: 18, admissionNo: "18087", name: "Rohit Khanna", username: "std31", class: "Class 4(C)", fatherName: "Piyush Khanna", mobile: "8895742310", active: true },
];

// Mock Parents Data (Just structure example)
const parents = [
    { id: 1, name: "Olivier Thomas", username: "parent1", student: "Edward Thomas", mobile: "8233366611", active: true },
];

// Mock Staff Data
const staff = [
    { id: 1, staffId: "EMP001", name: "John Doe", role: "Teacher", department: "Science", mobile: "7894561230", active: true },
];

export default function UsersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("student");

    // Mock Toggle Function
    const toggleStatus = (id: number) => {
        // In a real app, this would call an API
        console.log(`Toggling status for ID ${id}`);
    };

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans space-y-4">

            {/* Page Layout */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">

                {/* Header with Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-center px-4 py-2 border-b border-gray-100">
                    <h1 className="text-[16px] font-medium text-gray-700">Users</h1>

                    <Tabs defaultValue="student" className="w-full md:w-auto" onValueChange={setActiveTab}>
                        <TabsList className="bg-transparent border-b-0 h-10 p-0 space-x-6">
                            <TabsTrigger
                                value="student"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-2 pb-2 h-full shadow-none bg-transparent"
                            >
                                Student
                            </TabsTrigger>
                            <TabsTrigger
                                value="parent"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-2 pb-2 h-full shadow-none bg-transparent"
                            >
                                Parent
                            </TabsTrigger>
                            <TabsTrigger
                                value="staff"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-2 pb-2 h-full shadow-none bg-transparent"
                            >
                                Staff
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Toolbar */}
                <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50">
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
                            <span className="text-[11px] text-gray-500 font-medium">Rows:</span>
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
                <div className="flex-1 overflow-auto">
                    {/* Student Table */}
                    {activeTab === "student" && (
                        <Table>
                            <TableHeader className="bg-gray-50/40 sticky top-0 z-10">
                                <TableRow className="border-b border-gray-100 hover:bg-transparent text-[11px]">
                                    <TableHead className="h-10 px-4 font-bold text-gray-600 cursor-pointer hover:text-indigo-600 transition-colors group w-32">
                                        <div className="flex items-center gap-1">Admission No <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" /></div>
                                    </TableHead>
                                    <TableHead className="h-10 px-4 font-bold text-gray-600 cursor-pointer hover:text-indigo-600 transition-colors group">
                                        <div className="flex items-center gap-1">Student Name <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" /></div>
                                    </TableHead>
                                    <TableHead className="h-10 px-4 font-bold text-gray-600 cursor-pointer hover:text-indigo-600 transition-colors group">
                                        <div className="flex items-center gap-1">Username <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" /></div>
                                    </TableHead>
                                    <TableHead className="h-10 px-4 font-bold text-gray-600 cursor-pointer hover:text-indigo-600 transition-colors group">
                                        <div className="flex items-center gap-1">Class <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" /></div>
                                    </TableHead>
                                    <TableHead className="h-10 px-4 font-bold text-gray-600 cursor-pointer hover:text-indigo-600 transition-colors group">
                                        <div className="flex items-center gap-1">Father Name <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" /></div>
                                    </TableHead>
                                    <TableHead className="h-10 px-4 font-bold text-gray-600 cursor-pointer hover:text-indigo-600 transition-colors group">
                                        <div className="flex items-center gap-1">Mobile Number <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" /></div>
                                    </TableHead>
                                    <TableHead className="h-10 px-4 font-bold text-gray-600 text-right w-20">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student) => (
                                    <TableRow key={student.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors h-10 group">
                                        <TableCell className="py-2 px-4 text-[11px] text-gray-500 font-medium">{student.admissionNo}</TableCell>
                                        <TableCell className="py-2 px-4 text-[11px] font-medium text-indigo-500 hover:underline cursor-pointer">{student.name}</TableCell>
                                        <TableCell className="py-2 px-4 text-[11px] text-gray-500">{student.username}</TableCell>
                                        <TableCell className="py-2 px-4 text-[11px] text-gray-500">{student.class}</TableCell>
                                        <TableCell className="py-2 px-4 text-[11px] text-gray-500">{student.fatherName}</TableCell>
                                        <TableCell className="py-2 px-4 text-[11px] text-gray-500">{student.mobile}</TableCell>
                                        <TableCell className="py-2 px-4 text-right">
                                            <div className="flex justify-end">
                                                <Switch
                                                    className="data-[state=checked]:bg-[#6366f1] scale-75"
                                                    defaultChecked={student.active}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {/* Parent Table Placeholder */}
                    {activeTab === "parent" && (
                        <div className="p-8 text-center text-gray-400 text-sm">Parent list placeholder</div>
                    )}

                    {/* Staff Table Placeholder */}
                    {activeTab === "staff" && (
                        <div className="p-8 text-center text-gray-400 text-sm">Staff list placeholder</div>
                    )}
                </div>

            </div>
        </div>
    );
}
