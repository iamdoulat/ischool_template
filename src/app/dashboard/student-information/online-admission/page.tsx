"use client";

import { useState } from "react";
import {
    Search,
    FileText,
    Table as TableIcon,
    Printer,
    FileDown,
    ChevronDown,
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    Check,
    Minus,
    Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const studentData = [
    {
        id: "1",
        referenceNo: "810394",
        studentName: "Olia Wood",
        class: "Class 5(A)",
        fatherName: "SASAS",
        dob: "01/28/2020",
        gender: "Male",
        category: "",
        mobile: "7890678678",
        formStatus: "Submitted (01/16/2026)",
        paymentStatus: "Paid",
        enrolled: false,
        createdAt: "01/16/2026"
    },
    {
        id: "2",
        referenceNo: "464213",
        studentName: "Matthew Bacon",
        class: "Class 1(A)",
        fatherName: "Jason",
        dob: "12/31/2018",
        gender: "Male",
        category: "",
        mobile: "08909789",
        formStatus: "Not Submitted",
        paymentStatus: "Unpaid",
        enrolled: true,
        createdAt: "01/02/2026"
    },
    {
        id: "3",
        referenceNo: "427557",
        studentName: "David Clarkson",
        class: "Class 2(A)",
        fatherName: "Albert",
        dob: "04/08/2017",
        gender: "Male",
        category: "General",
        mobile: "890890789",
        formStatus: "Submitted (01/02/2026)",
        paymentStatus: "Paid",
        enrolled: true,
        createdAt: "01/02/2026"
    },
    {
        id: "4",
        referenceNo: "478699",
        studentName: "James Bennett",
        class: "Class 1(A)",
        fatherName: "David Wilson",
        dob: "05/05/2009",
        gender: "Male",
        category: "General",
        mobile: "8978786866",
        formStatus: "Submitted (12/01/2025)",
        paymentStatus: "Paid",
        enrolled: true,
        createdAt: "12/01/2025"
    },
    {
        id: "5",
        referenceNo: "546873",
        studentName: "Prenelan Subrayen",
        class: "Class 1(A)",
        fatherName: "David",
        dob: "08/12/2016",
        gender: "Male",
        category: "",
        mobile: "9009000976",
        formStatus: "Not Submitted",
        paymentStatus: "Unpaid",
        enrolled: false,
        createdAt: "11/01/2025"
    }
];

export default function OnlineAdmissionPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-muted/50 pb-4">
                    <CardTitle className="text-xl font-bold tracking-tight">Student List</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search"
                                className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-4">
                                <span className="text-sm font-semibold text-muted-foreground">50</span>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex gap-1">
                                <IconButton icon={Printer} />
                                <IconButton icon={FileText} />
                                <IconButton icon={TableIcon} />
                                <IconButton icon={FileDown} />
                                <IconButton icon={Download} />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-xl border border-muted/50">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <Th>Reference No</Th>
                                    <Th>Student Name</Th>
                                    <Th>Class</Th>
                                    <Th>Father Name</Th>
                                    <Th>Date Of Birth</Th>
                                    <Th>Gender</Th>
                                    <Th>Category</Th>
                                    <Th>Student Mobile Number</Th>
                                    <Th>Form Status</Th>
                                    <Th>Payment Status</Th>
                                    <Th>Enrolled</Th>
                                    <Th>Created At</Th>
                                    <Th className="text-right">Action</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted/30">
                                {studentData.map((student) => (
                                    <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                        <Td><span className="font-semibold text-primary/80">{student.referenceNo}</span></Td>
                                        <Td className="font-semibold">{student.studentName}</Td>
                                        <Td>{student.class}</Td>
                                        <Td>{student.fatherName}</Td>
                                        <Td>{student.dob}</Td>
                                        <Td>{student.gender}</Td>
                                        <Td>{student.category || "-"}</Td>
                                        <Td>{student.mobile}</Td>
                                        <Td>
                                            <Badge className={cn(
                                                "font-bold text-[10px] px-2 py-0.5 whitespace-nowrap",
                                                student.formStatus.startsWith("Submitted")
                                                    ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200"
                                                    : "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200"
                                            )}>
                                                {student.formStatus}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            <Badge className={cn(
                                                "font-bold text-[10px] px-2 py-0.5",
                                                student.paymentStatus === "Paid"
                                                    ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200"
                                                    : "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200"
                                            )}>
                                                {student.paymentStatus}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            <div className="flex justify-center">
                                                {student.enrolled ? (
                                                    <Check className="h-4 w-4 text-green-600 font-bold" strokeWidth={3} />
                                                ) : (
                                                    <div className="h-4 w-4 flex items-center justify-center">
                                                        <div className="h-3 w-3 rounded-full border-2 border-slate-400 flex items-center justify-center">
                                                            <div className="h-1 w-1 bg-slate-400 rounded-full" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Td>
                                        <Td>{student.createdAt}</Td>
                                        <Td className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <ActionBtn icon={Printer} className="bg-indigo-500 hover:bg-indigo-600" />
                                                <ActionBtn icon={Pencil} className="bg-indigo-500 hover:bg-indigo-600" />
                                                <ActionBtn icon={Trash2} className="bg-indigo-500 hover:bg-indigo-600" />
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Showing 1 to 5 of 5 entries</p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                <ChevronDown className="h-4 w-4 rotate-90" />
                            </Button>
                            <Button className="h-8 w-8 rounded-lg border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-br from-[#FF9800] to-[#4F39F6]">1</Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                <ChevronDown className="h-4 w-4 -rotate-90" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-4 py-4 border-b border-muted/50", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-4 py-4 text-sm font-medium text-slate-600", className)}>{children}</td>;
}

function IconButton({ icon: Icon }: { icon: any }) {
    return (
        <button className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm">
            <Icon className="h-4 w-4" />
        </button>
    );
}

function ActionBtn({ icon: Icon, className }: { icon: any, className?: string }) {
    return (
        <button className={cn("p-1.5 text-white rounded transition-all hover:shadow-md", className)}>
            <Icon className="h-3 w-3" />
        </button>
    );
}
