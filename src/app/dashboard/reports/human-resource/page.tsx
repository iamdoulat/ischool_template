"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
    Search,
    FileText,
    Users,
    Wallet,
    CalendarDays,
    Copy,
    FileSpreadsheet,
    FileBox,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const reportLinks = [
    { name: "Staff Report", icon: Users, active: true },
    { name: "Payroll Report", icon: Wallet },
    { name: "Leave Request Report", icon: CalendarDays },
    { name: "My Leave Request Report", icon: UserIcon },
];

function UserIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    );
}

interface StaffData {
    id: string;
    role: string;
    designation: string;
    department: string;
    name: string;
    fatherName: string;
    motherName: string;
    email: string;
    gender: string;
    dob: string;
    doj: string;
    phone: string;
    emergency: string;
    marital: string;
    currentAddress: string;
    permanentAddress: string;
    qualification: string;
    experience: string;
    note: string;
    epf: string;
    salary: string;
    contract: string;
    shift: string;
    location: string;
    leaves: string[];
}

const mockStaff: StaffData[] = [
    {
        id: "9000",
        role: "Super Admin",
        designation: "Technical Head",
        department: "Admin",
        name: "Joe Black",
        fatherName: "Will Black",
        motherName: "Mini Black",
        email: "superadmin@gmail.com",
        gender: "Male",
        dob: "01/01/1988",
        doj: "03/11/2010",
        phone: "6545645645",
        emergency: "54654644",
        marital: "Married",
        currentAddress: "9837 Temple Apartment",
        permanentAddress: "9837 Temple Apartment",
        qualification: "MS",
        experience: "15 Yrs",
        note: "",
        epf: "564564564",
        salary: "$1,50,000.00",
        contract: "permanent",
        shift: "Morning",
        location: "Ground Floor",
        leaves: [
            "Medical Leave: 20.00",
            "Casual Leave: 25.00",
            "Maternity Leave: 25.00"
        ]
    },
    {
        id: "9001",
        role: "Teacher",
        designation: "Subject Teacher",
        department: "Academic",
        name: "Sarah Jenkins",
        fatherName: "Robert Jenkins",
        motherName: "Alice Jenkins",
        email: "sarah@example.com",
        gender: "Female",
        dob: "12/05/1992",
        doj: "01/06/2018",
        phone: "9876543210",
        emergency: "9876543211",
        marital: "Single",
        currentAddress: "123 School Lane",
        permanentAddress: "123 School Lane",
        qualification: "M.Ed",
        experience: "5 Yrs",
        note: "Specialist in Math",
        epf: "123456789",
        salary: "$60,000.00",
        contract: "permanent",
        shift: "Morning",
        location: "Block A",
        leaves: [
            "Medical Leave: 10.00",
            "Casual Leave: 15.00",
            "Maternity Leave: 20.00",
            "Sick Leave: 15.00"
        ]
    }
];

export default function HumanResourceReportPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Human Resource Report</h1>

            {/* Report Links Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-y-1 gap-x-6">
                    {reportLinks.map((link) => (
                        <div
                            key={link.name}
                            className={cn(
                                "flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors group",
                                link.active ? "bg-gray-100" : "hover:bg-gray-50"
                            )}
                        >
                            <link.icon className={cn("h-3.5 w-3.5", link.active ? "text-gray-700" : "text-gray-400 group-hover:text-gray-600")} />
                            <span className={cn("text-[10px] font-medium tracking-tight", link.active ? "text-gray-800" : "text-gray-500 group-hover:text-gray-700")}>
                                {link.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type By (Date Of Joining)</Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="this_week">This Week</SelectItem>
                                <SelectItem value="this_month">This Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Status</Label>
                        <Select defaultValue="active">
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="disabled">Disabled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Role</Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Designation</Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="head">Head</SelectItem>
                                <SelectItem value="junior">Junior</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5">
                        <Search className="h-3 w-3" />
                        Search
                    </Button>
                </div>
            </div>

            {/* Staff Report Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Staff Report</h2>

                {/* Table Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
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
                                <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none ring-0">
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
                            {[Copy, FileSpreadsheet, FileBox, FileText, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Staff Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[3500px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">Staff ID <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Role <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Designation <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Department <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Father Name</TableHead>
                                <TableHead className="py-3 px-4">Mother Name</TableHead>
                                <TableHead className="py-3 px-4">Email <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Gender <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Date Of Birth <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Date Of Joining <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Phone <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Emergency Contact Number</TableHead>
                                <TableHead className="py-3 px-4">Marital Status</TableHead>
                                <TableHead className="py-3 px-4">Current Address</TableHead>
                                <TableHead className="py-3 px-4">Permanent Address</TableHead>
                                <TableHead className="py-3 px-4">Qualification</TableHead>
                                <TableHead className="py-3 px-4">Work Experience</TableHead>
                                <TableHead className="py-3 px-4">Note</TableHead>
                                <TableHead className="py-3 px-4">EPF No. <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Basic Salary <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Contract Type <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Work Shift <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Work Location <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-right">Leaves</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockStaff.map((staff, idx) => (
                                <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{staff.id}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.role}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.designation}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.department}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-700 font-bold">{staff.name}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.fatherName}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.motherName}</TableCell>
                                    <TableCell className="py-3 px-4 text-indigo-600 underline cursor-pointer">{staff.email}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.gender}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.dob}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.doj}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.phone}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.emergency}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.marital}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500 max-w-xs">{staff.currentAddress}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500 max-w-xs">{staff.permanentAddress}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.qualification}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.experience}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500 italic max-w-xs">{staff.note}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.epf}</TableCell>
                                    <TableCell className="py-3 px-4 text-emerald-600 font-bold">{staff.salary}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.contract}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.shift}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{staff.location}</TableCell>
                                    <TableCell className="py-3 px-4 text-right">
                                        <div className="flex flex-col text-[10px] leading-relaxed text-gray-500 text-right">
                                            {staff.leaves.map((leave, lIdx) => (
                                                <span key={lIdx}>{leave}</span>
                                            ))}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
                    <div>Showing 1 to 2 of 2 entries</div>
                    <div className="flex gap-1 items-center">
                        <ChevronLeft className="h-3.5 w-3.5 text-gray-300 cursor-pointer" />
                        <Button size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded shadow-sm">
                            1
                        </Button>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 cursor-pointer" />
                    </div>
                </div>
            </div>
        </div>
    );
}
