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
import {
    Search,
    FileText,
    DollarSign,
    Wallet,
    ArrowRightLeft,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Receipt,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const financeReports = [
    {
        group: [
            { name: "Fees Statement", icon: FileText, active: true },
            { name: "Balance Fees Report", icon: Wallet },
            { name: "Fees Collection Report", icon: DollarSign },
            { name: "Online Fees Receipt", icon: Receipt },
        ]
    },
    {
        group: [
            { name: "Income Report", icon: TrendingUp },
            { name: "Expense Report", icon: TrendingDown },
            { name: "Income Group Report", icon: TrendingUp },
            { name: "Expense Group Report", icon: TrendingDown },
        ]
    },
    {
        group: [
            { name: "Payroll Report", icon: Users },
        ]
    }
];

interface FeeRow {
    group: string;
    code: string;
    dueDate: string;
    status: "Paid" | "Unpaid" | "Partial";
    amount: string;
    paymentId: string;
    mode: string;
    date: string;
    discount: string;
    fine: string;
    paid: string;
    balance: string;
    isTransport?: boolean;
}

interface StudentFinance {
    admissionNo: string;
    name: string;
    fatherName: string;
    classSection: string;
    fees: FeeRow[];
    totalAmount: string;
    totalDiscount: string;
    totalFine: string;
    totalPaid: string;
    totalBalance: string;
}

const mockData: StudentFinance[] = [
    {
        admissionNo: "7000",
        name: "RAM",
        fatherName: "Jay",
        classSection: "Class 1 (A)",
        fees: [
            { group: "Class 1 General (April Month Fees)", code: "apr-month-fees", dueDate: "04/10/2025", status: "Unpaid", amount: "24,500.00", paymentId: "0.00", mode: "", date: "", discount: "0.00", fine: "0.00", paid: "0.00", balance: "24,500.00" },
            { group: "Class 1 General (Admission Fees)", code: "admission-fees", dueDate: "04/10/2025", status: "Unpaid", amount: "1,75,000.00", paymentId: "0.00", mode: "", date: "", discount: "0.00", fine: "0.00", paid: "0.00", balance: "1,75,000.00" },
            { group: "Class 1 General (May Month Fees)", code: "may-month-fees", dueDate: "05/10/2025", status: "Unpaid", amount: "24,500.00", paymentId: "0.00", mode: "", date: "", discount: "0.00", fine: "0.00", paid: "0.00", balance: "24,500.00" },
            { group: "Transport Fees", code: "January", dueDate: "01/05/2025", status: "Unpaid", amount: "0.7", paymentId: "0.00", mode: "", date: "", discount: "0.00", fine: "0.00", paid: "0.00", balance: "0.7", isTransport: true },
            { group: "Transport Fees", code: "February", dueDate: "02/05/2025", status: "Unpaid", amount: "0.7", paymentId: "0.00", mode: "", date: "", discount: "0.00", fine: "0.00", paid: "0.00", balance: "0.7", isTransport: true },
        ],
        totalAmount: "14,50,000.00",
        totalDiscount: "0.00",
        totalFine: "0.00",
        totalPaid: "0.00",
        totalBalance: "14,50,000.00"
    },
    {
        admissionNo: "20001",
        name: "Georgia Wickham",
        fatherName: "Zakary Poulter",
        classSection: "Class 1 (A)",
        fees: [
            { group: "Class 1 General (April Month Fees)", code: "apr-month-fees", dueDate: "04/10/2025", status: "Unpaid", amount: "24,500.00", paymentId: "0.00", mode: "", date: "", discount: "0.00", fine: "0.00", paid: "0.00", balance: "24,500.00" },
            { group: "Transport Fees", code: "April", dueDate: "04/05/2025", status: "Unpaid", amount: "0.7", paymentId: "0.00", mode: "", date: "", discount: "0.00", fine: "0.00", paid: "0.00", balance: "0.7", isTransport: true },
        ],
        totalAmount: "14,41,000.0",
        totalDiscount: "0.00",
        totalFine: "0.00",
        totalPaid: "0.00",
        totalBalance: "14,41,000.0"
    }
];

export default function FinanceReportPage() {
    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Finance Report</h1>

            {/* Report Links Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {financeReports.map((col, idx) => (
                        <div key={idx} className="space-y-1">
                            {col.group.map((link) => (
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
                    ))}
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Class 1</SelectItem>
                                <SelectItem value="2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Category</Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Select</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end">
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5">
                            <Search className="h-3 w-3" />
                            Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* Fees Statement Report Output */}
            {mockData.map((student, sIdx) => (
                <div key={sIdx} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                    {/* Section Header */}
                    <div className="bg-gray-50/10 border-b border-gray-100 p-3 grid grid-cols-4 gap-4">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Admission No</span>
                            <span className="text-[11px] font-bold text-gray-700">{student.admissionNo}</span>
                        </div>
                        <div className="flex flex-col border-l border-gray-100 pl-4">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Name</span>
                            <span className="text-[11px] font-bold text-gray-700">{student.name}</span>
                        </div>
                        <div className="flex flex-col border-l border-gray-100 pl-4">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Father Name</span>
                            <span className="text-[11px] font-bold text-gray-700">{student.fatherName}</span>
                        </div>
                        <div className="flex flex-col border-l border-gray-100 pl-4">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Class (Section)</span>
                            <span className="text-[11px] font-bold text-gray-700">{student.classSection}</span>
                        </div>
                    </div>

                    {/* Fees Table */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-transparent border-b border-gray-100 hover:bg-transparent">
                                <TableRow className="text-[9px] font-bold uppercase text-gray-500 hover:bg-transparent border-0">
                                    <TableHead className="py-2 px-3 h-auto">Fees Group</TableHead>
                                    <TableHead className="py-2 px-3 h-auto">Fees Code</TableHead>
                                    <TableHead className="py-2 px-3 h-auto">Due Date</TableHead>
                                    <TableHead className="py-2 px-3 h-auto">Status</TableHead>
                                    <TableHead className="py-2 px-3 h-auto">Amount ($) Payment ID</TableHead>
                                    <TableHead className="py-2 px-3 h-auto">Mode</TableHead>
                                    <TableHead className="py-2 px-3 h-auto">Date</TableHead>
                                    <TableHead className="py-2 px-3 h-auto">Discount ($)</TableHead>
                                    <TableHead className="py-2 px-3 h-auto">Fine ($)</TableHead>
                                    <TableHead className="py-2 px-3 h-auto text-right">Paid ($)</TableHead>
                                    <TableHead className="py-2 px-3 h-auto text-right">Balance ($)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {student.fees.map((fee, fIdx) => (
                                    <TableRow
                                        key={fIdx}
                                        className={cn(
                                            "text-[10px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors",
                                            fee.isTransport && "bg-red-50/40"
                                        )}
                                    >
                                        <TableCell className="py-2 px-3 font-medium text-gray-700">{fee.group}</TableCell>
                                        <TableCell className="py-2 px-3 text-gray-500">{fee.code}</TableCell>
                                        <TableCell className="py-2 px-3 text-gray-500">{fee.dueDate}</TableCell>
                                        <TableCell className="py-2 px-3">
                                            <span className={cn(
                                                "inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight",
                                                fee.status === "Unpaid" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                                            )}>
                                                {fee.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-2 px-3 font-medium text-gray-700 flex gap-1 items-center">
                                            {fee.amount} <span className="text-gray-300 mx-1">|</span> <span className="text-red-400">{fee.paymentId}</span>
                                        </TableCell>
                                        <TableCell className="py-2 px-3 text-gray-500">{fee.mode}</TableCell>
                                        <TableCell className="py-2 px-3 text-gray-500">{fee.date}</TableCell>
                                        <TableCell className="py-2 px-3 text-gray-500">{fee.discount}</TableCell>
                                        <TableCell className="py-2 px-3 text-gray-500">{fee.fine}</TableCell>
                                        <TableCell className="py-2 px-3 text-right text-gray-500">{fee.paid}</TableCell>
                                        <TableCell className="py-2 px-3 text-right font-medium text-gray-700">{fee.balance}</TableCell>
                                    </TableRow>
                                ))}

                                {/* Grand Total Row */}
                                <TableRow className="bg-gray-50/20 font-bold text-[10px] hover:bg-gray-50/20 border-t-2 border-gray-100">
                                    <TableCell colSpan={4} className="py-2 px-3 text-right uppercase tracking-tighter text-gray-400">Grand Total</TableCell>
                                    <TableCell className="py-2 px-3">
                                        <span className="text-gray-700">{student.totalAmount}</span>
                                        <span className="text-gray-300 mx-1">|</span>
                                        <span className="text-red-500">00.000.00</span>
                                    </TableCell>
                                    <TableCell colSpan={2}></TableCell>
                                    <TableCell className="py-2 px-3 text-gray-700">{student.totalDiscount}</TableCell>
                                    <TableCell className="py-2 px-3 text-gray-700">{student.totalFine}</TableCell>
                                    <TableCell className="py-2 px-3 text-right text-indigo-500">{student.totalPaid}</TableCell>
                                    <TableCell className="py-2 px-3 text-right text-red-500">{student.totalBalance}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ))}
        </div>
    );
}
