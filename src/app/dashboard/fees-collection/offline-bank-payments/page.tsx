"use client";

import {
    Search,
    FileText,
    FileSpreadsheet,
    FileCode,
    Printer,
    Menu,
    ChevronDown,
    Wallet
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const data = [
    {
        requestId: "243",
        admissionNo: "5422",
        name: "Vinay Singh",
        class: "Class 1(B)",
        paymentDate: "01/28/2026",
        submitDate: "01/28/2026 02:11 pm",
        amount: "50.00",
        status: "Pending",
        statusDate: "",
        paymentId: ""
    },
    {
        requestId: "242",
        admissionNo: "5422",
        name: "Vinay Singh",
        class: "Class 1(B)",
        paymentDate: "01/27/2026",
        submitDate: "01/27/2026 06:06 pm",
        amount: "50.00",
        status: "Pending",
        statusDate: "",
        paymentId: ""
    }
];

export default function OfflineBankPaymentsPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-muted/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="font-bold text-lg tracking-tight">Offline Bank Payments</h2>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full max-w-sm group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search..."
                                defaultValue="5422"
                                className="pl-10 h-10 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                {[
                                    { icon: FileSpreadsheet, label: "Excel" },
                                    { icon: FileText, label: "CSV" },
                                    { icon: FileCode, label: "PDF" },
                                    { icon: Printer, label: "Print" }
                                ].map((tool, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                                    >
                                        <tool.icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                            <div className="h-8 w-px bg-muted/50 mx-2" />
                            <select className="h-10 px-3 rounded-xl border border-muted/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                                <option>50</option>
                                <option>100</option>
                                <option>All</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-2xl border border-muted/50 overflow-hidden bg-muted/10 shadow-inner">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/30">
                                        {[
                                            "Request ID", "Admission No", "Name", "Class",
                                            "Payment Date", "Submit Date", "Amount ($)", "Status",
                                            "Status Date", "Payment ID", "Action"
                                        ].map((header) => (
                                            <th key={header} className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/50">
                                    {data.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-muted/20 transition-colors group">
                                            <td className="px-4 py-4 text-sm font-medium text-muted-foreground">{row.requestId}</td>
                                            <td className="px-4 py-4 text-sm font-bold text-foreground">{row.admissionNo}</td>
                                            <td className="px-4 py-4 text-sm font-bold text-primary">{row.name}</td>
                                            <td className="px-4 py-4 text-sm font-medium text-muted-foreground">{row.class}</td>
                                            <td className="px-4 py-4 text-sm text-muted-foreground">{row.paymentDate}</td>
                                            <td className="px-4 py-4 text-sm text-muted-foreground">{row.submitDate}</td>
                                            <td className="px-4 py-4 text-sm font-black text-foreground">{row.amount}</td>
                                            <td className="px-4 py-4">
                                                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm shadow-amber-500/20">
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-muted-foreground">{row.statusDate}</td>
                                            <td className="px-4 py-4 text-sm text-muted-foreground">{row.paymentId}</td>
                                            <td className="px-4 py-4">
                                                <Button
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg bg-[#4F39F6] hover:bg-[#4F39F6]/90 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-110 active:scale-95"
                                                >
                                                    <Menu className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-muted/50">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            Showing 1 to {data.length} of {data.length} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                <ChevronDown className="h-4 w-4 rotate-90" />
                            </Button>
                            <Button className="h-8 w-8 rounded-lg border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-br from-[#FF9800] to-[#4F39F6]">
                                1
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                <ChevronDown className="h-4 w-4 -rotate-90" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
