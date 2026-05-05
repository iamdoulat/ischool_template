"use client";

import { useState, useEffect } from "react";
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
    Users,
    Printer,
    PieChart,
    Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

const financeReports = [
    { name: "Balance Fees Statement", icon: FileText, active: true },
    { name: "Daily Collection Report", icon: FileText },
    { name: "Fees Statement", icon: FileText },
    { name: "Balance Fees Report", icon: FileText },
    { name: "Fees Collection Report", icon: FileText },
    { name: "Online Fees Collection Report", icon: FileText },
    { name: "Balance Fees Report With Remark", icon: FileText },
    { name: "Income Report", icon: FileText },
    { name: "Expense Report", icon: FileText },
    { name: "Payroll Report", icon: FileText },
    { name: "Income Group Report", icon: FileText },
    { name: "Expense Group Report", icon: FileText },
    { name: "Online Admission Fees Collection Report", icon: FileText },
    { name: "Due Fees Report", icon: FileText },
    { name: "Income Expense Balance Report", icon: FileText },
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

export default function FinanceReportPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("Balance Fees Statement");
    
    // Data states
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [balanceStatementData, setBalanceStatementData] = useState<StudentFinance[]>([]);
    
    // Filter states
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("all");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/academics/classes');
            // Extract the array from data.data or fallback to res.data
            const classData = res.data.data?.data || res.data.data || [];
            setClasses(Array.isArray(classData) ? classData : []);
        } catch (error) {
            console.error("Failed to fetch classes");
            setClasses([]);
        }
    };

    const handleClassChange = async (value: string) => {
        setSelectedClass(value);
        setSelectedSection("all");
        if (value === "all") {
            setSections([]);
            return;
        }
        try {
            const res = await api.get(`/academics/sections?school_class_id=${value}`);
            const sectionData = res.data.data?.data || res.data.data || [];
            setSections(Array.isArray(sectionData) ? sectionData : []);
        } catch (error) {
            console.error("Failed to fetch sections");
            setSections([]);
        }
    };

    // Daily Collection Report State
    const [dailyCollectionData, setDailyCollectionData] = useState<any[]>([]);
    const [dailyCollectionLoading, setDailyCollectionLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState("2026-04-01");
    const [dateTo, setDateTo] = useState("2026-04-30");
    const [dailySearch, setDailySearch] = useState("");

    const fetchDailyCollection = async () => {
        setDailyCollectionLoading(true);
        try {
            const res = await api.get(`/finance-reports/daily-collection?date_from=${dateFrom}&date_to=${dateTo}`);
            setDailyCollectionData(res.data.data || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch daily collection report.",
                variant: "destructive"
            });
        } finally {
            setDailyCollectionLoading(false);
        }
    };

    // Fees Statement Report State
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState("all");
    const [feesStatementData, setFeesStatementData] = useState<any | null>(null);
    const [feesStatementLoading, setFeesStatementLoading] = useState(false);

    const fetchStudents = async (sectionId: string) => {
        try {
            const res = await api.get(`/students?section_id=${sectionId}&limit=100`);
            const studentList = res.data.data?.data || res.data.data || [];
            setStudents(Array.isArray(studentList) ? studentList : []);
        } catch (error) {
            console.error("Failed to fetch students");
            setStudents([]);
        }
    };

    const handleSectionChange = (value: string) => {
        setSelectedSection(value);
        setSelectedStudent("all");
        if (value !== "all") {
            fetchStudents(value);
        } else {
            setStudents([]);
        }
    };

    const handleSearch = async () => {
        if (activeTab === "Balance Fees Statement") {
            if (!selectedClass || selectedClass === "all") {
                toast({
                    title: "Validation Error",
                    description: "Please select a class",
                    variant: "destructive"
                });
                return;
            }

            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('school_class_id', selectedClass);
                if (selectedSection !== "all") params.append('section_id', selectedSection);

                const res = await api.get(`/finance-reports/balance-fees-statement?${params.toString()}`);
                setBalanceStatementData(res.data.data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch balance statement",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        } else if (activeTab === "Daily Collection Report") {
            fetchDailyCollection();
        } else if (activeTab === "Fees Statement") {
            if (selectedStudent === "all") {
                toast({
                    title: "Validation Error",
                    description: "Please select a student",
                    variant: "destructive"
                });
                return;
            }

            setFeesStatementLoading(true);
            try {
                const res = await api.get(`/finance-reports/fees-statement?student_id=${selectedStudent}`);
                setFeesStatementData(res.data.data || null);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch fees statement",
                    variant: "destructive"
                });
            } finally {
                setFeesStatementLoading(false);
            }
        }
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Finance</h1>

            {/* Report Links Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1">
                    {financeReports.map((link) => (
                        <div
                            key={link.name}
                            onClick={() => {
                                if (link.name === "Balance Fees Statement" || link.name === "Daily Collection Report" || link.name === "Fees Statement") {
                                    setActiveTab(link.name);
                                } else {
                                    toast({
                                        title: "Information",
                                        description: `${link.name} is coming soon.`,
                                    });
                                }
                            }}
                            className={cn(
                                "flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors group",
                                activeTab === link.name ? "bg-gray-100" : "hover:bg-gray-50"
                            )}
                        >
                            <link.icon className={cn("h-3.5 w-3.5", activeTab === link.name ? "text-gray-700" : "text-gray-400 group-hover:text-gray-600")} />
                            <span className={cn("text-[10px] font-medium tracking-tight", activeTab === link.name ? "text-gray-800" : "text-gray-500 group-hover:text-gray-700")}>
                                {link.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {activeTab === "Balance Fees Statement" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select</SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select</SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSearch} disabled={loading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-xs font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 uppercase">
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {balanceStatementData.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Balance Fees Statement</h3>
                                <Button variant="outline" className="h-7 px-3 text-[10px] flex items-center gap-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50">
                                    <Printer className="h-3 w-3" />
                                    Print
                                </Button>
                            </div>

                            {balanceStatementData.map((student, sIdx) => (
                                <div key={sIdx} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    {/* Section Header */}
                                    <div className="bg-gray-50/10 border-b border-gray-100 p-3 grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                                    <TableHead className="py-2 px-3 h-auto text-center">Due Date</TableHead>
                                                    <TableHead className="py-2 px-3 h-auto text-center">Status</TableHead>
                                                    <TableHead className="py-2 px-3 h-auto">Amount ($) Payment ID</TableHead>
                                                    <TableHead className="py-2 px-3 h-auto">Mode</TableHead>
                                                    <TableHead className="py-2 px-3 h-auto text-center">Date</TableHead>
                                                    <TableHead className="py-2 px-3 h-auto text-right">Discount ($)</TableHead>
                                                    <TableHead className="py-2 px-3 h-auto text-right">Fine ($)</TableHead>
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
                                                        <TableCell className="py-2 px-3 text-center text-gray-500">{fee.dueDate}</TableCell>
                                                        <TableCell className="py-2 px-3 text-center">
                                                            <span className={cn(
                                                                "inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight border",
                                                                fee.status === "Unpaid" ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                            )}>
                                                                {fee.status}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-2 px-3 font-medium text-gray-700 flex gap-1 items-center">
                                                            {fee.amount} <span className="text-gray-300 mx-1">|</span> <span className="text-red-400">{fee.paymentId}</span>
                                                        </TableCell>
                                                        <TableCell className="py-2 px-3 text-gray-500">{fee.mode || '-'}</TableCell>
                                                        <TableCell className="py-2 px-3 text-center text-gray-500">{fee.date || '-'}</TableCell>
                                                        <TableCell className="py-2 px-3 text-right text-gray-500">{fee.discount}</TableCell>
                                                        <TableCell className="py-2 px-3 text-right text-gray-500">{fee.fine}</TableCell>
                                                        <TableCell className="py-2 px-3 text-right text-gray-500">{fee.paid}</TableCell>
                                                        <TableCell className="py-2 px-3 text-right font-medium text-gray-700">{fee.balance}</TableCell>
                                                    </TableRow>
                                                ))}

                                                {/* Grand Total Row */}
                                                <TableRow className="bg-gray-50/20 font-bold text-[10px] hover:bg-gray-50/20 border-t-2 border-gray-100">
                                                    <TableCell colSpan={4} className="py-2 px-3 text-right uppercase tracking-tighter text-gray-400 font-bold">Grand Total</TableCell>
                                                    <TableCell className="py-2 px-3">
                                                        <span className="text-gray-700 font-bold">{student.totalAmount}</span>
                                                        <span className="text-gray-300 mx-1">|</span>
                                                        <span className="text-red-500 font-bold">0.00</span>
                                                    </TableCell>
                                                    <TableCell colSpan={2}></TableCell>
                                                    <TableCell className="py-2 px-3 text-right text-gray-700 font-bold">{student.totalDiscount}</TableCell>
                                                    <TableCell className="py-2 px-3 text-right text-gray-700 font-bold">{student.totalFine}</TableCell>
                                                    <TableCell className="py-2 px-3 text-right text-indigo-600 font-bold">{student.totalPaid}</TableCell>
                                                    <TableCell className="py-2 px-3 text-right text-red-600 font-bold">{student.totalBalance}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === "Daily Collection Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Date From <span className="text-red-500">*</span></Label>
                                <input 
                                    type="date"
                                    className="w-full h-8 px-3 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Date To <span className="text-red-500">*</span></Label>
                                <input 
                                    type="date"
                                    className="w-full h-8 px-3 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSearch} disabled={dailyCollectionLoading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-xs font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Daily Collection Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Daily Collection Report</h2>

                        <div className="flex justify-between items-center mb-4">
                            <div className="relative w-64">
                                <input 
                                    type="text"
                                    placeholder="Search" 
                                    className="w-full h-8 px-3 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={dailySearch}
                                    onChange={(e) => setDailySearch(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <Select defaultValue="50">
                                    <SelectTrigger className="h-8 w-16 text-[11px] border-none shadow-none focus:ring-0">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 text-gray-400">
                                    <FileText className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                    <PieChart className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                    <Users className="h-4 w-4 cursor-pointer hover:text-gray-600" />
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Date</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Total Transactions</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Amount</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dailyCollectionLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-gray-400">
                                                Loading daily collection report...
                                            </TableCell>
                                        </TableRow>
                                    ) : dailyCollectionData.length > 0 ? (
                                        dailyCollectionData.filter(item => 
                                            item.date?.toLowerCase().includes(dailySearch.toLowerCase())
                                        ).map((row, idx) => (
                                            <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors">
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{row.date}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600">{row.total_transactions}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600 font-medium">${row.amount}</TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={4} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No data available in table</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <DollarSign className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}

            {activeTab === "Fees Statement" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select</SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                                <Select value={selectedSection} onValueChange={handleSectionChange}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select</SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Student <span className="text-red-500">*</span></Label>
                                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select</SelectItem>
                                        {students.map((stu) => (
                                            <SelectItem key={stu.id} value={stu.id.toString()}>
                                                {stu.first_name} {stu.last_name} ({stu.admission_no})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSearch} disabled={feesStatementLoading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-xs font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {feesStatementData && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-2 flex justify-center items-start">
                                        <div className="w-24 h-24 bg-gray-50 rounded border border-gray-100 flex items-center justify-center text-gray-300 text-[8px] font-bold uppercase text-center p-2">
                                            No Image Available
                                        </div>
                                    </div>
                                    <div className="md:col-span-10 grid grid-cols-2 gap-x-8 gap-y-2 text-[11px]">
                                        <div className="flex justify-between border-b border-gray-50 pb-1">
                                            <span className="text-gray-400 font-bold uppercase">Name</span>
                                            <span className="text-gray-700 font-bold">{feesStatementData.name}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-50 pb-1">
                                            <span className="text-gray-400 font-bold uppercase">Class (Section)</span>
                                            <span className="text-gray-700 font-bold">{feesStatementData.classSection}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-50 pb-1">
                                            <span className="text-gray-400 font-bold uppercase">Father Name</span>
                                            <span className="text-gray-700 font-bold">{feesStatementData.fatherName}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-50 pb-1">
                                            <span className="text-gray-400 font-bold uppercase">Admission No</span>
                                            <span className="text-gray-700 font-bold">{feesStatementData.admissionNo}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-50 pb-1">
                                            <span className="text-gray-400 font-bold uppercase">Mobile Number</span>
                                            <span className="text-gray-700 font-bold">{feesStatementData.mobileNumber}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-50 pb-1">
                                            <span className="text-gray-400 font-bold uppercase">Roll Number</span>
                                            <span className="text-gray-700 font-bold">{feesStatementData.rollNumber}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-50 pb-1">
                                            <span className="text-gray-400 font-bold uppercase">Category</span>
                                            <span className="text-gray-700 font-bold">{feesStatementData.category}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-50 pb-1">
                                            <span className="text-gray-400 font-bold uppercase">RTE</span>
                                            <span className="text-red-500 font-bold uppercase">{feesStatementData.rte}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/10">
                                    <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Fees Statement</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center bg-white border border-gray-200 rounded px-2 h-7">
                                            <input type="text" placeholder="Search" className="border-none bg-transparent text-[10px] focus:ring-0 w-32" />
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Printer className="h-3.5 w-3.5" /></Button>
                                            <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><FileText className="h-3.5 w-3.5" /></Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50/30 text-[9px] font-bold uppercase text-gray-500 hover:bg-gray-50/30">
                                                <TableHead className="py-2 px-3 h-auto">Fees Group</TableHead>
                                                <TableHead className="py-2 px-3 h-auto">Fees Code</TableHead>
                                                <TableHead className="py-2 px-3 h-auto text-center">Due Date</TableHead>
                                                <TableHead className="py-2 px-3 h-auto text-center">Status</TableHead>
                                                <TableHead className="py-2 px-3 h-auto">Amount ($)</TableHead>
                                                <TableHead className="py-2 px-3 h-auto">Payment ID</TableHead>
                                                <TableHead className="py-2 px-3 h-auto text-center">Mode</TableHead>
                                                <TableHead className="py-2 px-3 h-auto text-center">Date</TableHead>
                                                <TableHead className="py-2 px-3 h-auto text-right">Discount ($)</TableHead>
                                                <TableHead className="py-2 px-3 h-auto text-right">Fine ($)</TableHead>
                                                <TableHead className="py-2 px-3 h-auto text-right">Paid ($)</TableHead>
                                                <TableHead className="py-2 px-3 h-auto text-right font-bold text-gray-700">Balance ($)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {feesStatementData.fees.map((fee: any, idx: number) => (
                                                <TableRow key={idx} className={cn("text-[10px] hover:bg-gray-50/50 transition-colors border-b border-gray-50", fee.status === "Unpaid" && "bg-red-50/40")}>
                                                    <TableCell className="py-2 px-3 font-medium text-gray-700">{fee.group}</TableCell>
                                                    <TableCell className="py-2 px-3 text-gray-500">{fee.code}</TableCell>
                                                    <TableCell className="py-2 px-3 text-center text-gray-500">{fee.dueDate}</TableCell>
                                                    <TableCell className="py-2 px-3 text-center">
                                                        <span className={cn(
                                                            "inline-flex px-1.5 py-0.5 rounded-[2px] text-[8px] font-bold uppercase border",
                                                            fee.status === "Paid" ? "bg-emerald-500 text-white border-emerald-500" : "bg-red-500 text-white border-red-500"
                                                        )}>
                                                            {fee.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-2 px-3 font-bold text-gray-700">
                                                        {fee.amount} <span className="text-red-500 font-normal"> - 0.00</span>
                                                    </TableCell>
                                                    <TableCell className="py-2 px-3 text-gray-500">
                                                        {fee.paymentId !== "0.00" && (
                                                            <div className="flex items-center gap-1">
                                                                <ArrowRightLeft className="h-2.5 w-2.5 rotate-90 text-gray-300" />
                                                                {fee.paymentId}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-2 px-3 text-center text-gray-500">{fee.mode || "-"}</TableCell>
                                                    <TableCell className="py-2 px-3 text-center text-gray-500">{fee.date || "-"}</TableCell>
                                                    <TableCell className="py-2 px-3 text-right text-gray-500">{fee.discount}</TableCell>
                                                    <TableCell className="py-2 px-3 text-right text-gray-500">{fee.fine}</TableCell>
                                                    <TableCell className="py-2 px-3 text-right text-gray-500">{fee.paid}</TableCell>
                                                    <TableCell className="py-2 px-3 text-right font-bold text-gray-700">{fee.balance}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
