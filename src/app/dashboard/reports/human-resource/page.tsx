"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
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
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

interface PayrollData {
    name: string;
    role: string;
    designation: string;
    monthYear: string;
    payslip: string;
    basic: number;
    earning: number;
    deduction: number;
    gross: number;
    tax: number;
    net: number;
}

interface LeaveData {
    staff: string;
    leaveType: string;
    halfDay: string;
    doj: string;
    applyDate: string;
    leaveDate: string;
    days: string;
    status: string;
}

interface MyLeaveData {
    staff: string;
    leaveType: string;
    halfDay: string;
    applyDate: string;
    leaveDate: string;
    days: string;
    status: string;
}

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <Skeleton className="h-4 rounded" style={{ width: `${55 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function HumanResourceReportPage() {
    const [activeTab, setActiveTab] = useState("Staff Report");
    
    // Dropdown criteria lists
    const [roles, setRoles] = useState<{ name: string }[]>([]);
    const [designations, setDesignations] = useState<{ name: string }[]>([]);
    const [staffs, setStaffs] = useState<{ id: number; name: string; staff_id: string }[]>([]);

    // Selection states (Staff Report)
    const [selectedSearchType, setSelectedSearchType] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("active");
    const [selectedRole, setSelectedRole] = useState<string>("all");
    const [selectedDesignation, setSelectedDesignation] = useState<string>("all");

    // Selection states (Payroll Report)
    const [selectedPayrollRole, setSelectedPayrollRole] = useState<string>("all");
    const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>("January");
    const [selectedPayrollYear, setSelectedPayrollYear] = useState<string>("2026");

    // Selection states (Leave Request Report)
    const [selectedLeaveFrom, setSelectedLeaveFrom] = useState<string>("2026-05-01");
    const [selectedLeaveTo, setSelectedLeaveTo] = useState<string>("2026-05-30");
    const [selectedLeaveDoj, setSelectedLeaveDoj] = useState<string>("2026-05-01");
    const [selectedLeaveStaff, setSelectedLeaveStaff] = useState<string>("all");
    const [selectedLeaveStatus, setSelectedLeaveStatus] = useState<string>("Pending");

    // Selection states (My Leave Request Report)
    const [selectedMyLeaveFrom, setSelectedMyLeaveFrom] = useState<string>("2026-05-01");
    const [selectedMyLeaveTo, setSelectedMyLeaveTo] = useState<string>("2026-05-30");
    const [selectedMyLeaveStatus, setSelectedMyLeaveStatus] = useState<string>("Approved");

    // Report results state
    const [staffList, setStaffList] = useState<StaffData[]>([]);
    const [payrollList, setPayrollList] = useState<PayrollData[]>([]);
    const [leaveList, setLeaveList] = useState<LeaveData[]>([]);
    const [myLeaveList, setMyLeaveList] = useState<MyLeaveData[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [payrollIsSearched, setPayrollIsSearched] = useState(false);
    const [leaveIsSearched, setLeaveIsSearched] = useState(false);
    const [myLeaveIsSearched, setMyLeaveIsSearched] = useState(false);

    // Search and Pagination states
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState<string>("50");
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/reports/human-resource/criteria');
            setRoles(response.data.roles || []);
            setDesignations(response.data.designations || []);
            setStaffs(response.data.staff || []);
        } catch (error) {
            console.error("Failed to fetch criteria", error);
            toast.error("Failed to load HR criteria options");
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/human-resource/report', {
                params: {
                    search_type: selectedSearchType,
                    status: selectedStatus,
                    role: selectedRole,
                    designation: selectedDesignation,
                }
            });
            setStaffList(response.data.data || []);
            setCurrentPage(1);
            toast.success("Staff report loaded successfully");
        } catch (error) {
            console.error("Failed to query staff report", error);
            toast.error("Failed to load staff report data");
        } finally {
            setLoading(false);
        }
    };

    const handlePayrollSearch = async () => {
        if (!selectedPayrollYear) {
            toast.error("Please enter/select a Year");
            return;
        }
        setLoading(true);
        try {
            const response = await api.get('/reports/human-resource/payroll', {
                params: {
                    role: selectedPayrollRole,
                    month: selectedPayrollMonth,
                    year: selectedPayrollYear,
                }
            });
            setPayrollList(response.data.data || []);
            setPayrollIsSearched(true);
            setCurrentPage(1);
            toast.success("Payroll report loaded successfully");
        } catch (error) {
            console.error("Failed to query payroll report", error);
            toast.error("Failed to load payroll report data");
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/human-resource/leave', {
                params: {
                    status: selectedLeaveStatus,
                    staff_id: selectedLeaveStaff,
                    from_date: selectedLeaveFrom,
                    to_date: selectedLeaveTo,
                    doj: selectedLeaveDoj,
                }
            });
            setLeaveList(response.data.data || []);
            setLeaveIsSearched(true);
            setCurrentPage(1);
            toast.success("Leave requests report loaded successfully");
        } catch (error) {
            console.error("Failed to query leave report", error);
            toast.error("Failed to load leave request report data");
        } finally {
            setLoading(false);
        }
    };

    const handleMyLeaveSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/human-resource/my-leave', {
                params: {
                    status: selectedMyLeaveStatus,
                    from_date: selectedMyLeaveFrom,
                    to_date: selectedMyLeaveTo,
                }
            });
            setMyLeaveList(response.data.data || []);
            setMyLeaveIsSearched(true);
            setCurrentPage(1);
            toast.success("My Leave report loaded successfully");
        } catch (error) {
            console.error("Failed to query my leave report", error);
            toast.error("Failed to load my leave report data");
        } finally {
            setLoading(false);
        }
    };

    // Filter lists locally by keyword search box
    const filteredStaff = staffList.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (item.id && item.id.toLowerCase().includes(term)) ||
            (item.name && item.name.toLowerCase().includes(term)) ||
            (item.email && item.email.toLowerCase().includes(term)) ||
            (item.phone && item.phone.toLowerCase().includes(term)) ||
            (item.role && item.role.toLowerCase().includes(term)) ||
            (item.designation && item.designation.toLowerCase().includes(term)) ||
            (item.department && item.department.toLowerCase().includes(term))
        );
    });

    const filteredPayroll = payrollList.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (item.name && item.name.toLowerCase().includes(term)) ||
            (item.role && item.role.toLowerCase().includes(term)) ||
            (item.designation && item.designation.toLowerCase().includes(term)) ||
            (item.monthYear && item.monthYear.toLowerCase().includes(term)) ||
            (item.payslip && item.payslip.toLowerCase().includes(term))
        );
    });

    const filteredLeave = leaveList.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (item.staff && item.staff.toLowerCase().includes(term)) ||
            (item.leaveType && item.leaveType.toLowerCase().includes(term)) ||
            (item.halfDay && item.halfDay.toLowerCase().includes(term)) ||
            (item.doj && item.doj.toLowerCase().includes(term)) ||
            (item.applyDate && item.applyDate.toLowerCase().includes(term)) ||
            (item.leaveDate && item.leaveDate.toLowerCase().includes(term)) ||
            (item.days && item.days.toLowerCase().includes(term)) ||
            (item.status && item.status.toLowerCase().includes(term))
        );
    });

    const filteredMyLeave = myLeaveList.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (item.staff && item.staff.toLowerCase().includes(term)) ||
            (item.leaveType && item.leaveType.toLowerCase().includes(term)) ||
            (item.halfDay && item.halfDay.toLowerCase().includes(term)) ||
            (item.applyDate && item.applyDate.toLowerCase().includes(term)) ||
            (item.leaveDate && item.leaveDate.toLowerCase().includes(term)) ||
            (item.days && item.days.toLowerCase().includes(term)) ||
            (item.status && item.status.toLowerCase().includes(term))
        );
    });

    // Pagination Calculations
    const totalEntries = 
        activeTab === "Staff Report" ? filteredStaff.length : 
        activeTab === "Payroll Report" ? filteredPayroll.length :
        activeTab === "Leave Request Report" ? filteredLeave.length : filteredMyLeave.length;
    
    const sizeNum = parseInt(itemsPerPage);
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPages) || 1;
    const startIndex = (safeCurrentPage - 1) * sizeNum;
    
    const paginatedStaff = filteredStaff.slice(startIndex, startIndex + sizeNum);
    const paginatedPayroll = filteredPayroll.slice(startIndex, startIndex + sizeNum);
    const paginatedLeave = filteredLeave.slice(startIndex, startIndex + sizeNum);
    const paginatedMyLeave = filteredMyLeave.slice(startIndex, startIndex + sizeNum);

    // Grand Totals for Payroll Report
    const totalBasic = filteredPayroll.reduce((sum, item) => sum + item.basic, 0);
    const totalEarning = filteredPayroll.reduce((sum, item) => sum + item.earning, 0);
    const totalDeduction = filteredPayroll.reduce((sum, item) => sum + item.deduction, 0);
    const totalGross = filteredPayroll.reduce((sum, item) => sum + item.gross, 0);
    const totalTax = filteredPayroll.reduce((sum, item) => sum + item.tax, 0);
    const totalNet = filteredPayroll.reduce((sum, item) => sum + item.net, 0);

    // Export Options
    const exportToCopy = () => {
        if (activeTab === "Staff Report") {
            if (filteredStaff.length === 0) {
                toast.error("No data available to copy");
                return;
            }
            const text = [
                "Staff ID\tRole\tDesignation\tDepartment\tName\tEmail\tPhone\tSalary\tContract",
                ...filteredStaff.map(s => `${s.id}\t${s.role}\t${s.designation}\t${s.department}\t${s.name}\t${s.email}\t${s.phone}\t${s.salary}\t${s.contract}`)
            ].join("\n");

            navigator.clipboard.writeText(text);
            toast.success("Staff records copied to clipboard");
        } else if (activeTab === "Payroll Report") {
            if (filteredPayroll.length === 0) {
                toast.error("No data available to copy");
                return;
            }
            const text = [
                "Name\tRole\tDesignation\tMonth - Year\tPayslip #\tBasic Salary\tEarning\tDeduction\tGross Salary\tTax\tNet Salary",
                ...filteredPayroll.map(p => `${p.name}\t${p.role}\t${p.designation}\t${p.monthYear}\t${p.payslip}\t$${p.basic}\t$${p.earning}\t$${p.deduction}\t$${p.gross}\t$${p.tax}\t$${p.net}`)
            ].join("\n");

            navigator.clipboard.writeText(text);
            toast.success("Payroll records copied to clipboard");
        } else if (activeTab === "Leave Request Report") {
            if (filteredLeave.length === 0) {
                toast.error("No data available to copy");
                return;
            }
            const text = [
                "Staff\tLeave Type\tHalf Day\tDate Of Joining\tApply Date\tLeave Date\tDays\tStatus",
                ...filteredLeave.map(l => `${l.staff}\t${l.leaveType}\t${l.halfDay}\t${l.doj}\t${l.applyDate}\t${l.leaveDate}\t${l.days}\t${l.status}`)
            ].join("\n");

            navigator.clipboard.writeText(text);
            toast.success("Leave records copied to clipboard");
        } else {
            if (filteredMyLeave.length === 0) {
                toast.error("No data available to copy");
                return;
            }
            const text = [
                "Staff\tLeave Type\tHalf Day\tApply Date\tLeave Date\tDays\tStatus",
                ...filteredMyLeave.map(l => `${l.staff}\t${l.leaveType}\t${l.halfDay}\t${l.applyDate}\t${l.leaveDate}\t${l.days}\t${l.status}`)
            ].join("\n");

            navigator.clipboard.writeText(text);
            toast.success("Personal leave records copied to clipboard");
        }
    };

    const exportToExcel = (isCsv = false) => {
        if (activeTab === "Staff Report") {
            if (filteredStaff.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const mapped = filteredStaff.map(s => ({
                "Staff ID": s.id,
                "Role": s.role,
                "Designation": s.designation,
                "Department": s.department,
                "Name": s.name,
                "Email": s.email,
                "Phone": s.phone,
                "Basic Salary": s.salary,
                "Contract Type": s.contract,
                "Date of Joining": s.doj,
            }));

            const worksheet = XLSX.utils.json_to_sheet(mapped);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Directory Report");

            if (isCsv) {
                XLSX.writeFile(workbook, "staff_directory_report.csv", { bookType: "csv" });
                toast.success("CSV file downloaded successfully");
            } else {
                XLSX.writeFile(workbook, "staff_directory_report.xlsx");
                toast.success("Excel spreadsheet downloaded successfully");
            }
        } else if (activeTab === "Payroll Report") {
            if (filteredPayroll.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const mapped = filteredPayroll.map(p => ({
                "Name": p.name,
                "Role": p.role,
                "Designation": p.designation,
                "Month - Year": p.monthYear,
                "Payslip #": p.payslip,
                "Basic Salary ($)": p.basic,
                "Earning ($)": p.earning,
                "Deduction ($)": p.deduction,
                "Gross Salary ($)": p.gross,
                "Tax ($)": p.tax,
                "Net Salary ($)": p.net
            }));

            const worksheet = XLSX.utils.json_to_sheet(mapped);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Report");

            if (isCsv) {
                XLSX.writeFile(workbook, "payroll_report.csv", { bookType: "csv" });
                toast.success("CSV file downloaded successfully");
            } else {
                XLSX.writeFile(workbook, "payroll_report.xlsx");
                toast.success("Excel spreadsheet downloaded successfully");
            }
        } else if (activeTab === "Leave Request Report") {
            if (filteredLeave.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const mapped = filteredLeave.map(l => ({
                "Staff": l.staff,
                "Leave Type": l.leaveType,
                "Half Day": l.halfDay,
                "Date Of Joining": l.doj,
                "Apply Date": l.applyDate,
                "Leave Date": l.leaveDate,
                "Days": l.days,
                "Status": l.status,
            }));

            const worksheet = XLSX.utils.json_to_sheet(mapped);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Request Report");

            if (isCsv) {
                XLSX.writeFile(workbook, "leave_request_report.csv", { bookType: "csv" });
                toast.success("CSV file downloaded successfully");
            } else {
                XLSX.writeFile(workbook, "leave_request_report.xlsx");
                toast.success("Excel spreadsheet downloaded successfully");
            }
        } else {
            if (filteredMyLeave.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const mapped = filteredMyLeave.map(l => ({
                "Staff": l.staff,
                "Leave Type": l.leaveType,
                "Half Day": l.halfDay,
                "Apply Date": l.applyDate,
                "Leave Date": l.leaveDate,
                "Days": l.days,
                "Status": l.status,
            }));

            const worksheet = XLSX.utils.json_to_sheet(mapped);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "My Leave Request Report");

            if (isCsv) {
                XLSX.writeFile(workbook, "my_leave_request_report.csv", { bookType: "csv" });
                toast.success("CSV file downloaded successfully");
            } else {
                XLSX.writeFile(workbook, "my_leave_request_report.xlsx");
                toast.success("Excel spreadsheet downloaded successfully");
            }
        }
    };

    const exportToPDF = () => {
        if (activeTab === "Staff Report") {
            if (filteredStaff.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const doc = new jsPDF("landscape");
            const head = [["Staff ID", "Name", "Role", "Designation", "Department", "Email", "Phone", "Salary", "Contract"]];
            const body = filteredStaff.map(s => [s.id, s.name, s.role, s.designation, s.department, s.email, s.phone, s.salary, s.contract]);

            autoTable(doc, { head, body, theme: "grid" });
            doc.save("staff_directory_report.pdf");
            toast.success("PDF report downloaded successfully");
        } else if (activeTab === "Payroll Report") {
            if (filteredPayroll.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const doc = new jsPDF("landscape");
            const head = [["Name", "Role", "Designation", "Month - Year", "Payslip #", "Basic Salary", "Earning", "Deduction", "Gross Salary", "Tax", "Net Salary"]];
            const body = filteredPayroll.map(p => [
                p.name, p.role, p.designation, p.monthYear, p.payslip,
                `$${p.basic.toFixed(2)}`, `$${p.earning.toFixed(2)}`, `$${p.deduction.toFixed(2)}`,
                `$${p.gross.toFixed(2)}`, `$${p.tax.toFixed(2)}`, `$${p.net.toFixed(2)}`
            ]);

            autoTable(doc, { head, body, theme: "grid" });
            doc.save("payroll_report.pdf");
            toast.success("PDF report downloaded successfully");
        } else if (activeTab === "Leave Request Report") {
            if (filteredLeave.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const doc = new jsPDF("landscape");
            const head = [["Staff", "Leave Type", "Half Day", "Date Of Joining", "Apply Date", "Leave Date", "Days", "Status"]];
            const body = filteredLeave.map(l => [l.staff, l.leaveType, l.halfDay, l.doj, l.applyDate, l.leaveDate, l.days, l.status]);

            autoTable(doc, { head, body, theme: "grid" });
            doc.save("leave_request_report.pdf");
            toast.success("PDF report downloaded successfully");
        } else {
            if (filteredMyLeave.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const doc = new jsPDF("landscape");
            const head = [["Staff", "Leave Type", "Half Day", "Apply Date", "Leave Date", "Days", "Status"]];
            const body = filteredMyLeave.map(l => [l.staff, l.leaveType, l.halfDay, l.applyDate, l.leaveDate, l.days, l.status]);

            autoTable(doc, { head, body, theme: "grid" });
            doc.save("my_leave_request_report.pdf");
            toast.success("PDF report downloaded successfully");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20 text-xs">
            {/* Header Card */}
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Users className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-800 leading-none">Human Resource Report</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">Staff directory, payroll, and leave reports</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {reportLinks.map((link) => {
                            const isActive = activeTab === link.name;
                            return (
                                <div
                                    key={link.name}
                                    onClick={() => {
                                        setActiveTab(link.name);
                                        setSearchTerm("");
                                        setCurrentPage(1);
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all group",
                                        isActive
                                            ? "border-indigo-200 bg-indigo-50/50 shadow-sm"
                                            : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-lg transition-all duration-300",
                                        isActive ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                    )}>
                                        <link.icon className="h-4 w-4" />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold tracking-tight uppercase transition-colors duration-300",
                                        isActive ? "text-indigo-700" : "text-gray-600"
                                    )}>
                                        {link.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Select Criteria Section (Staff Report) */}
            {activeTab === "Staff Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type By (Date Of Joining)</Label>
                            <Select value={selectedSearchType} onValueChange={setSelectedSearchType}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="this_week">This Week</SelectItem>
                                    <SelectItem value="this_month">This Month</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Status</Label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="disabled">Disabled</SelectItem>
                                    <SelectItem value="all">All Status</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Role</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    {roles.map(r => (
                                        <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Designation</Label>
                            <Select value={selectedDesignation} onValueChange={setSelectedDesignation}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Designations</SelectItem>
                                    {designations.map(d => (
                                        <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button 
                            onClick={handleSearch}
                            disabled={loading}
                            variant="gradient"
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]"
                        >
                            <Search className="h-4 w-4" />
                            {loading ? "Searching..." : "Search"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Select Criteria Section (Payroll Report) */}
            {activeTab === "Payroll Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 animate-fadeIn">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Role</Label>
                            <Select value={selectedPayrollRole} onValueChange={setSelectedPayrollRole}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    {roles.map(r => (
                                        <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Month</Label>
                            <Select value={selectedPayrollMonth} onValueChange={setSelectedPayrollMonth}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Year <span className="text-red-500">*</span></Label>
                            <Select value={selectedPayrollYear} onValueChange={setSelectedPayrollYear}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {["2026", "2025", "2024", "2023", "2022"].map(y => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button 
                            onClick={handlePayrollSearch}
                            disabled={loading}
                            variant="gradient"
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]"
                        >
                            <Search className="h-4 w-4" />
                            {loading ? "Searching..." : "Search"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Select Criteria Section (Leave Request Report) */}
            {activeTab === "Leave Request Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 animate-fadeIn">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">From Date</Label>
                            <Input 
                                type="date" 
                                value={selectedLeaveFrom} 
                                onChange={(e) => setSelectedLeaveFrom(e.target.value)}
                                className="h-8 border-gray-200 text-[11px] shadow-none rounded focus-visible:ring-indigo-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">To Date</Label>
                            <Input 
                                type="date" 
                                value={selectedLeaveTo} 
                                onChange={(e) => setSelectedLeaveTo(e.target.value)}
                                className="h-8 border-gray-200 text-[11px] shadow-none rounded focus-visible:ring-indigo-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Date Of Joining</Label>
                            <Input 
                                type="date" 
                                value={selectedLeaveDoj} 
                                onChange={(e) => setSelectedLeaveDoj(e.target.value)}
                                className="h-8 border-gray-200 text-[11px] shadow-none rounded focus-visible:ring-indigo-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Staff Name</Label>
                            <Select value={selectedLeaveStaff} onValueChange={setSelectedLeaveStaff}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Staff</SelectItem>
                                    {staffs.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.staff_id || s.id})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Status</Label>
                            <Select value={selectedLeaveStatus} onValueChange={setSelectedLeaveStatus}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Approved">Approved</SelectItem>
                                    <SelectItem value="Disapproved">Disapproved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button 
                            onClick={handleLeaveSearch}
                            disabled={loading}
                            variant="gradient"
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]"
                        >
                            <Search className="h-4 w-4" />
                            {loading ? "Searching..." : "Search"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Select Criteria Section (My Leave Request Report) */}
            {activeTab === "My Leave Request Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 animate-fadeIn">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">From Date</Label>
                            <Input 
                                type="date" 
                                value={selectedMyLeaveFrom} 
                                onChange={(e) => setSelectedMyLeaveFrom(e.target.value)}
                                className="h-8 border-gray-200 text-[11px] shadow-none rounded focus-visible:ring-indigo-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">To Date</Label>
                            <Input 
                                type="date" 
                                value={selectedMyLeaveTo} 
                                onChange={(e) => setSelectedMyLeaveTo(e.target.value)}
                                className="h-8 border-gray-200 text-[11px] shadow-none rounded focus-visible:ring-indigo-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Status</Label>
                            <Select value={selectedMyLeaveStatus} onValueChange={setSelectedMyLeaveStatus}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Approved">Approved</SelectItem>
                                    <SelectItem value="Disapproved">Disapproved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button 
                            onClick={handleMyLeaveSearch}
                            disabled={loading}
                            variant="gradient"
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]"
                        >
                            <Search className="h-4 w-4" />
                            {loading ? "Searching..." : "Search"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Staff Report Table Section */}
            {activeTab === "Staff Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Staff Report</h2>

                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Show</span>
                                <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
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
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" title="Copy" onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                    <FileBox className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="PDF" onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Print" onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
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
                                {loading ? (
                                    <TableSkeleton cols={25} />
                                ) : paginatedStaff.length > 0 ? (
                                    paginatedStaff.map((staff, idx) => (
                                        <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
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
                                                    {(staff.leaves || []).map((leave, lIdx) => (
                                                        <span key={lIdx}>{leave}</span>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={25} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            No staff records match selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Spacing */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-4 border-t border-t-gray-50/50 mt-2">
                        <div>
                            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                            {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                            {searchTerm && ` (filtered from ${staffList.length} total entries)`}
                        </div>
                        {staffList.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <button 
                                    disabled={safeCurrentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer border-none font-bold",
                                            safeCurrentPage === page 
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white font-extrabold shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95" 
                                                : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button 
                                    disabled={safeCurrentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Payroll Report Table Section */}
            {activeTab === "Payroll Report" && payrollIsSearched && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px] animate-fadeIn">
                    <div className="flex justify-between items-center">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Payroll Report</h2>
                    </div>

                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Show</span>
                                <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
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
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" title="Copy" onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                    <FileBox className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="PDF" onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Print" onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Payroll Table */}
                    <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1400px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Role <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Designation <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Month - Year <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Payslip # <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Basic Salary ($) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Earning ($) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Deduction ($) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Gross Salary ($) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Tax ($) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Net Salary ($) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton cols={11} />
                                ) : paginatedPayroll.length > 0 ? (
                                    <>
                                        {paginatedPayroll.map((pay, idx) => (
                                            <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                <TableCell className="py-3 px-4 text-gray-700 font-bold">{pay.name}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{pay.role}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{pay.designation}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{pay.monthYear}</TableCell>
                                                <TableCell className="py-3 px-4 text-[#6366F1] font-bold text-center">{pay.payslip}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700">{pay.basic.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700">{pay.earning.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700">{pay.deduction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-medium">{pay.gross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700">{pay.tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-emerald-600 font-bold">{pay.net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            </TableRow>
                                        ))}
                                        
                                        {/* Grand Total Row */}
                                        <TableRow className="bg-gray-50/40 text-[11px] font-extrabold hover:bg-gray-50/60 border-t border-t-gray-100">
                                            <TableCell colSpan={5} className="py-3.5 px-4 text-right text-gray-800 font-extrabold">Grand Total</TableCell>
                                            <TableCell className="py-3.5 px-4 text-right text-gray-800">${totalBasic.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="py-3.5 px-4 text-right text-gray-800">${totalEarning.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="py-3.5 px-4 text-right text-gray-800">${totalDeduction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="py-3.5 px-4 text-right text-gray-800">${totalGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="py-3.5 px-4 text-right text-gray-800">${totalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="py-3.5 px-4 text-right text-emerald-700 font-black">${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                        </TableRow>
                                    </>
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={11} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            No payroll records match selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Spacing */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-4 border-t border-t-gray-50/50 mt-2">
                        <div>
                            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                            {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                            {searchTerm && ` (filtered from ${payrollList.length} total entries)`}
                        </div>
                        {payrollList.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <button 
                                    disabled={safeCurrentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer border-none font-bold",
                                            safeCurrentPage === page 
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white font-extrabold shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95" 
                                                : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button 
                                    disabled={safeCurrentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Leave Request Report Table Section */}
            {activeTab === "Leave Request Report" && leaveIsSearched && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px] animate-fadeIn">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Leave Request Report</h2>

                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Show</span>
                                <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
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
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" title="Copy" onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                    <FileBox className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="PDF" onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Print" onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Leave Table */}
                    <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Staff <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Leave Type <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Half Day <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Date Of Joining <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Apply Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Leave Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-center">Days <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Status <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton cols={8} />
                                ) : paginatedLeave.length > 0 ? (
                                    paginatedLeave.map((leave, idx) => (
                                        <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                            <TableCell className="py-3 px-4 text-gray-700 font-bold">{leave.staff}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{leave.leaveType}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500 font-medium">{leave.halfDay || "-"}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{leave.doj}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{leave.applyDate}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500 font-medium">{leave.leaveDate}</TableCell>
                                            <TableCell className="py-3 px-4 text-center text-gray-700">{leave.days}</TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide",
                                                    leave.status === "Approved" ? "bg-emerald-500 text-white" :
                                                    leave.status === "Pending" ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                                                )}>
                                                    {leave.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={8} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            No leave request records match selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Spacing */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-4 border-t border-t-gray-50/50 mt-2">
                        <div>
                            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                            {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                            {searchTerm && ` (filtered from ${leaveList.length} total entries)`}
                        </div>
                        {leaveList.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <button 
                                    disabled={safeCurrentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer border-none font-bold",
                                            safeCurrentPage === page 
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white font-extrabold shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95" 
                                                : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button 
                                    disabled={safeCurrentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* My Leave Request Report Table Section */}
            {activeTab === "My Leave Request Report" && myLeaveIsSearched && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px] animate-fadeIn">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">My Leave Request Report</h2>

                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Show</span>
                                <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
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
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" title="Copy" onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                    <FileBox className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="PDF" onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Print" onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* My Leave Table */}
                    <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1000px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Staff <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Leave Type <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Half Day <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Apply Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Leave Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-center">Days <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Status <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton cols={7} />
                                ) : paginatedMyLeave.length > 0 ? (
                                    paginatedMyLeave.map((leave, idx) => (
                                        <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                            <TableCell className="py-3 px-4 text-gray-700 font-bold">{leave.staff}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{leave.leaveType}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500 font-medium">{leave.halfDay || "-"}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{leave.applyDate}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500 font-medium">{leave.leaveDate}</TableCell>
                                            <TableCell className="py-3 px-4 text-center text-gray-700">{leave.days}</TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide",
                                                    leave.status === "Approved" ? "bg-emerald-500 text-white" :
                                                    leave.status === "Pending" ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                                                )}>
                                                    {leave.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            No personal leave request records match selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Spacing */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-4 border-t border-t-gray-50/50 mt-2">
                        <div>
                            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                            {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                            {searchTerm && ` (filtered from ${myLeaveList.length} total entries)`}
                        </div>
                        {myLeaveList.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <button 
                                    disabled={safeCurrentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer border-none font-bold",
                                            safeCurrentPage === page 
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white font-extrabold shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95" 
                                                : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button 
                                    disabled={safeCurrentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
