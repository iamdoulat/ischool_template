"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, FileText, Wallet, Users, BarChart, Activity } from "lucide-react";

export default function ReportPage() {
    const [activeReport, setActiveReport] = useState("expense");

    const expenseData = [
        { id: 1, branch: "Home Branch", name: "Motor Convoy Charges", invoice: "53430", head: "Miscellaneous", date: "05/06/2026", amount: 350.00 },
        { id: 2, branch: "Home Branch", name: "The Flower Center", invoice: "345345", head: "Electricity Bill", date: "05/06/2026", amount: 1200.00 },
        { id: 3, branch: "Home Branch", name: "Articl Event Tent", invoice: "5345", head: "Telephone Bill", date: "07/12/2025", amount: 50.00 },
        { id: 4, branch: "Home Branch", name: "Stock Tunnel", invoice: "7654", head: "Flower", date: "07/12/2025", amount: 750.00 },
        { id: 5, branch: "Home Branch", name: "Staff Training", invoice: "7865", head: "Miscellaneous", date: "03/03/2026", amount: 600.00 },
        { id: 6, branch: "Home Branch", name: "CBSE BOOKS", invoice: "4567", head: "Stationery-Furniture", date: "05/06/2026", amount: 450.00 },
        { id: 7, branch: "Home Branch", name: "Online Courier Charges", invoice: "6577", head: "Miscellaneous", date: "02/02/2026", amount: 350.00 },
        { id: 8, branch: "Home Branch", name: "The Flower Center", invoice: "5552", head: "Electricity Bill", date: "02/19/2026", amount: 1200.00 },
        { id: 9, branch: "Home Branch", name: "Articl Event Tent", invoice: "6666", head: "Telephone Bill", date: "02/09/2026", amount: 825.00 },
        { id: 10, branch: "Home Branch", name: "Staff Training", invoice: "5754", head: "Miscellaneous", date: "05/06/2026", amount: 600.00 },
        { id: 11, branch: "Home Branch", name: "CBSE BOOKS", invoice: "7755", head: "Stationery-Furniture", date: "02/09/2026", amount: 350.00 },
        { id: 12, branch: "Home Branch (Retired)", name: "Instructional Internet", invoice: "172-0726", head: "Telephone Bill", date: "01/09/2026", amount: 1500.00 },
        { id: 13, branch: "Mount Carmel School 1", name: "Stock Tunnel", invoice: "6454", head: "Miscellaneous", date: "07/28/2025", amount: 600.00 },
        { id: 14, branch: "Mount Carmel School 1", name: "MORE NEW HOUSE", invoice: "654653", head: "Book Safe", date: "05/27/2026", amount: 650.00 },
    ];

    const grandTotal = expenseData.reduce((sum, item) => sum + item.amount, 0);

    const reportTypes = [
        { id: "daily", label: "Daily Collection Report", icon: FileText },
        { id: "expense", label: "Expenses Report", icon: Wallet },
        { id: "payroll", label: "Payroll Report", icon: Users },
        { id: "income", label: "Income Report", icon: BarChart },
        { id: "userlog", label: "User Log Report", icon: Activity },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardContent className="p-6">
                    {/* Report Type Selection */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                        {reportTypes.map((report) => {
                            const Icon = report.icon;
                            return (
                                <button
                                    key={report.id}
                                    onClick={() => setActiveReport(report.id)}
                                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium ${activeReport === report.id
                                            ? "border-orange-500 bg-orange-50 text-orange-700"
                                            : "border-muted/30 bg-white hover:border-muted/60 text-slate-600"
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-xs">{report.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Select Criteria */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Select Criteria</h3>
                        <div className="flex items-end gap-4">
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-medium text-slate-600">Search Type</label>
                                <Select defaultValue="keyword">
                                    <SelectTrigger className="h-9 bg-white border-muted/50 text-xs">
                                        <SelectValue placeholder="Select search type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="keyword">Keyword</SelectItem>
                                        <SelectItem value="branch">Branch</SelectItem>
                                        <SelectItem value="date">Date Range</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Expense Report Table */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Expense Report</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pl-6">Branch</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Name</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Invoice No</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Expense Head</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Date</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pr-6 text-right">Amount ($)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenseData.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-muted/30 border-b border-muted/10 transition-colors">
                                        <TableCell className="text-slate-700 text-sm pl-6 py-3">{row.branch}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-3">{row.name}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-3">{row.invoice}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-3">{row.head}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-3">{row.date}</TableCell>
                                        <TableCell className="text-slate-700 text-sm pr-6 py-3 text-right">${row.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer with Pagination and Grand Total */}
                    <div className="p-4 border-t border-muted/20 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Showing 1 to {expenseData.length} of {expenseData.length} entries</span>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" disabled>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="default" size="icon" className="h-7 w-7 rounded-md bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md">
                                    1
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" disabled>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="px-4 py-1.5 rounded-md bg-red-50 border-2 border-red-500 text-red-700 font-bold text-sm">
                                Grand Total: ${grandTotal.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
