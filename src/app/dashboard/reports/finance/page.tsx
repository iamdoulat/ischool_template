"use client";

import React, { useState, useEffect, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
    Eye,
    Copy,
    File,
    Monitor
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
    const [balanceFeesReportData, setBalanceFeesReportData] = useState<any[]>([]);
    const [balanceFeesReportLoading, setBalanceFeesReportLoading] = useState(false);
    
    // Filter states
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("all");
    const [searchType, setSearchType] = useState("all");
    const [loading, setLoading] = useState(false);

    // Fees Collection Report State
    const [collectionReportData, setCollectionReportData] = useState<any[]>([]);
    const [collectionReportLoading, setCollectionReportLoading] = useState(false);
    const [searchDuration, setSearchDuration] = useState("today");
    const [selectedFeeType, setSelectedFeeType] = useState("all");
    const [selectedCollector, setSelectedCollector] = useState("all");
    const [groupBy, setGroupBy] = useState("class");
    const [feeTypes, setFeeTypes] = useState<any[]>([]);
    const [collectors, setCollectors] = useState<any[]>([]);

    // Online Fees Collection Report State
    const [onlineCollectionData, setOnlineCollectionData] = useState<any[]>([]);
    const [onlineCollectionLoading, setOnlineCollectionLoading] = useState(false);
    const [onlineSearchType, setOnlineSearchType] = useState("today");

    // Balance Fees Report With Remark State
    const [remarkReportData, setRemarkReportData] = useState<any[]>([]);
    const [remarkReportLoading, setRemarkReportLoading] = useState(false);
    const [selectedRemarkClass, setSelectedRemarkClass] = useState("");
    const [selectedRemarkSection, setSelectedRemarkSection] = useState("");

    // Income Report State
    const [incomeReportData, setIncomeReportData] = useState<any[]>([]);
    const [incomeReportLoading, setIncomeReportLoading] = useState(false);
    const [incomeSearchType, setIncomeSearchType] = useState("today");

    // Expense Report State
    const [expenseReportData, setExpenseReportData] = useState<any[]>([]);
    const [expenseReportLoading, setExpenseReportLoading] = useState(false);
    const [expenseSearchType, setExpenseSearchType] = useState("today");

    // Income Group Report State
    const [incomeGroupReportData, setIncomeGroupReportData] = useState<any[]>([]);
    const [incomeGroupReportLoading, setIncomeGroupReportLoading] = useState(false);
    const [incomeGroupSearchType, setIncomeGroupSearchType] = useState("today");
    const [selectedIncomeHead, setSelectedIncomeHead] = useState("all");
    const [incomeHeads, setIncomeHeads] = useState<any[]>([]);

    // Expense Group Report State
    const [expenseGroupReportData, setExpenseGroupReportData] = useState<any[]>([]);
    const [expenseGroupReportLoading, setExpenseGroupReportLoading] = useState(false);
    const [expenseGroupSearchType, setExpenseGroupSearchType] = useState("today");
    const [selectedExpenseHead, setSelectedExpenseHead] = useState("all");
    const [expenseHeads, setExpenseHeads] = useState<any[]>([]);

    // Payroll Report State
    const [payrollReportData, setPayrollReportData] = useState<any[]>([]);
    const [payrollReportLoading, setPayrollReportLoading] = useState(false);
    const [payrollSearchType, setPayrollSearchType] = useState("today");

    // Online Admission Fees Collection Report State
    const [onlineAdmissionCollectionData, setOnlineAdmissionCollectionData] = useState<any[]>([]);
    const [onlineAdmissionCollectionLoading, setOnlineAdmissionCollectionLoading] = useState(false);
    const [onlineAdmissionSearchType, setOnlineAdmissionSearchType] = useState("today");

    // Due Fees Report State
    const [dueFeesReportData, setDueFeesReportData] = useState<any[]>([]);
    const [dueFeesReportLoading, setDueFeesReportLoading] = useState(false);

    // Income Expense Balance Report State
    const [incomeExpenseBalanceData, setIncomeExpenseBalanceData] = useState<any[]>([]);
    const [incomeExpenseBalanceLoading, setIncomeExpenseBalanceLoading] = useState(false);
    const [incomeExpenseBalanceSearchType, setIncomeExpenseBalanceSearchType] = useState("today");

    useEffect(() => {
        fetchClasses();
        fetchCollectionFilters();
        fetchIncomeGroupFilters();
        fetchExpenseGroupFilters();
    }, []);

    const fetchIncomeGroupFilters = async () => {
        try {
            const res = await api.get('/finance-reports/income-group-filters');
            setIncomeHeads(res.data.data.income_heads || []);
        } catch (error) {
            console.error("Failed to fetch income group filters");
        }
    };

    const fetchExpenseGroupFilters = async () => {
        try {
            const res = await api.get('/finance-reports/expense-group-filters');
            setExpenseHeads(res.data.data.expense_heads || []);
        } catch (error) {
            console.error("Failed to fetch expense group filters");
        }
    };

    const fetchCollectionFilters = async () => {
        try {
            const res = await api.get('/finance-reports/collection-filters');
            setFeeTypes(res.data.data.fee_types || []);
            setCollectors(res.data.data.collectors || []);
        } catch (error) {
            console.error("Failed to fetch collection filters");
        }
    };

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
        } else if (activeTab === "Balance Fees Report") {
            if (!selectedClass || selectedClass === "all") {
                toast({
                    title: "Validation Error",
                    description: "Please select a class",
                    variant: "destructive"
                });
                return;
            }

            setBalanceFeesReportLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('school_class_id', selectedClass);
                if (selectedSection !== "all") params.append('section_id', selectedSection);
                params.append('search_type', searchType);

                const res = await api.get(`/finance-reports/balance-fees-report?${params.toString()}`);
                setBalanceFeesReportData(res.data.data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch balance fees report",
                    variant: "destructive"
                });
            } finally {
                setBalanceFeesReportLoading(false);
            }
        } else if (activeTab === "Fees Collection Report") {
            setCollectionReportLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('search_duration', searchDuration);
                if (selectedClass && selectedClass !== "all") params.append('school_class_id', selectedClass);
                if (selectedSection && selectedSection !== "all") params.append('section_id', selectedSection);
                if (selectedFeeType && selectedFeeType !== "all") params.append('fee_type_id', selectedFeeType);
                if (selectedCollector && selectedCollector !== "all") params.append('collect_by', selectedCollector);
                params.append('group_by', groupBy);

                const res = await api.get(`/finance-reports/fees-collection-report?${params.toString()}`);
                setCollectionReportData(res.data.data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch collection report",
                    variant: "destructive"
                });
            } finally {
                setCollectionReportLoading(false);
            }
        } else if (activeTab === "Online Fees Collection Report") {
            setOnlineCollectionLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('search_type', onlineSearchType);

                const res = await api.get(`/finance-reports/online-fees-collection-report?${params.toString()}`);
                setOnlineCollectionData(res.data.data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch online collection report",
                    variant: "destructive"
                });
            } finally {
                setOnlineCollectionLoading(false);
            }
        } else if (activeTab === "Balance Fees Report With Remark") {
            setRemarkReportLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedRemarkClass) params.append('class_id', selectedRemarkClass);
                if (selectedRemarkSection) params.append('section_id', selectedRemarkSection);

                const res = await api.get(`/finance-reports/balance-fees-report-with-remark?${params.toString()}`);
                setRemarkReportData(res.data.data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch balance fees report with remark",
                    variant: "destructive"
                });
            } finally {
                setRemarkReportLoading(false);
            }
        } else if (activeTab === "Income Report") {
            setIncomeReportLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('search_type', incomeSearchType);

                const res = await api.get(`/finance-reports/income-report?${params.toString()}`);
                setIncomeReportData(res.data.data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch income report",
                    variant: "destructive"
                });
            } finally {
                setIncomeReportLoading(false);
            }
        } else if (activeTab === "Expense Report") {
            setExpenseReportLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('search_type', expenseSearchType);

                const res = await api.get(`/finance-reports/expense-report?${params.toString()}`);
                setExpenseReportData(res.data.data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch expense report",
                    variant: "destructive"
                });
            } finally {
                setExpenseReportLoading(false);
            }
        } else if (activeTab === "Income Group Report") {
            setIncomeGroupReportLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('search_type', incomeGroupSearchType);
                if (selectedIncomeHead !== "all") params.append('income_head_id', selectedIncomeHead);

                const res = await api.get(`/finance-reports/income-group-report?${params.toString()}`);
                setIncomeGroupReportData(res.data.data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch income group report",
                    variant: "destructive"
                });
            } finally {
                setIncomeGroupReportLoading(false);
            }
        } else if (activeTab === "Expense Group Report") {
            setExpenseGroupReportLoading(true);
            try {
                const params = new URLSearchParams();
                params.append('search_type', expenseGroupSearchType);
                if (selectedExpenseHead !== "all") params.append('expense_head_id', selectedExpenseHead);

                const res = await api.get(`/finance-reports/expense-group-report?${params.toString()}`);
                setExpenseGroupReportData(res.data.data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch expense group report",
                    variant: "destructive"
                });
            } finally {
                setExpenseGroupReportLoading(false);
            }
        } else if (activeTab === "Payroll Report") {
            setPayrollReportLoading(true);
            try {
                const res = await api.get(`/finance-reports/payroll-report?search_type=${payrollSearchType}`);
                setPayrollReportData(res.data.data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch payroll report",
                    variant: "destructive"
                });
            } finally {
                setPayrollReportLoading(false);
            }
        } else if (activeTab === "Online Admission Fees Collection Report") {
            setOnlineAdmissionCollectionLoading(true);
            try {
                const res = await api.get(`/finance-reports/online-admission-fees-collection-report?search_type=${onlineAdmissionSearchType}`);
                setOnlineAdmissionCollectionData(res.data.data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch online admission collection report",
                    variant: "destructive"
                });
            } finally {
                setOnlineAdmissionCollectionLoading(false);
            }
        } else if (activeTab === "Due Fees Report") {
            setDueFeesReportLoading(true);
            try {
                const res = await api.get(`/finance-reports/due-fees-report?school_class_id=${selectedClass}&section_id=${selectedSection}`);
                setDueFeesReportData(res.data.data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch due fees report",
                    variant: "destructive"
                });
            } finally {
                setDueFeesReportLoading(false);
            }
        } else if (activeTab === "Income Expense Balance Report") {
            setIncomeExpenseBalanceLoading(true);
            try {
                const res = await api.get(`/finance-reports/income-expense-balance-report?search_type=${incomeExpenseBalanceSearchType}`);
                setIncomeExpenseBalanceData(res.data.data || []);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to fetch income expense balance report",
                    variant: "destructive"
                });
            } finally {
                setIncomeExpenseBalanceLoading(false);
            }
        }
    };

    return (
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20">
            {/* Gradient header card with report-type tabs inside */}
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <DollarSign className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-800 leading-none">Finance Report</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">Fees, income, expense, and payroll reports</p>
                            </div>
                        </div>
                        <Link
                            href="/user/fees"
                            className="flex items-center gap-1.5 h-8 px-3.5 rounded-[10px] text-white text-[11px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95 shadow-sm"
                        >
                            <Monitor className="h-3.5 w-3.5" />
                            Student Portal View
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {financeReports.map((link) => (
                        <div
                            key={link.name}
                            onClick={() => {
                                if (link.name === "Balance Fees Statement" || 
                                    link.name === "Daily Collection Report" || 
                                    link.name === "Fees Statement" ||
                                    link.name === "Balance Fees Report" ||
                                    link.name === "Fees Collection Report" ||
                                    link.name === "Online Fees Collection Report" ||
                                    link.name === "Balance Fees Report With Remark" ||
                                    link.name === "Income Report" ||
                                    link.name === "Expense Report" ||
                                    link.name === "Income Group Report" ||
                                    link.name === "Expense Group Report" ||
                                    link.name === "Online Admission Fees Collection Report" ||
                                    link.name === "Due Fees Report" ||
                                    link.name === "Income Expense Balance Report" ||
                                    link.name === "Payroll Report") {
                                    setActiveTab(link.name);
                                } else {
                                    toast({
                                        title: "Information",
                                        description: `${link.name} is coming soon.`,
                                    });
                                }
                            }}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all group",
                                activeTab === link.name
                                    ? "border-indigo-200 bg-indigo-50/50 shadow-sm"
                                    : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-lg transition-all duration-300",
                                activeTab === link.name ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                            )}>
                                <link.icon className="h-4 w-4" />
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold tracking-tight uppercase transition-colors duration-300",
                                activeTab === link.name ? "text-indigo-700" : "text-gray-600"
                            )}>
                                {link.name}
                            </span>
                        </div>
                    ))}
                    </div>
                </CardContent>
            </Card>

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
                            <Button variant="gradient" onClick={handleSearch} disabled={loading} className="px-6 h-9 flex items-center justify-center gap-2">
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
                                                            "text-[10px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer",
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
                            <Button variant="gradient" onClick={handleSearch} disabled={dailyCollectionLoading} className="px-6 h-9 flex items-center justify-center gap-2">
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

            {activeTab === "Balance Fees Report" && (
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

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type</Label>
                                <Select value={searchType} onValueChange={setSearchType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="balance">Only Balance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button variant="gradient" onClick={handleSearch} disabled={balanceFeesReportLoading} className="px-6 h-9 flex items-center justify-center gap-2">
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Balance Fees Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Balance Fees Report</h2>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Student Name</TableHead>
                                        <TableHead className="py-3 px-4">Class</TableHead>
                                        <TableHead className="py-3 px-4">Mobile No.</TableHead>
                                        <TableHead className="py-3 px-4">Admission No</TableHead>
                                        <TableHead className="py-3 px-4">Roll Number</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Father Name</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Total Fees ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Paid Fees ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Discount ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Fine ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right font-bold text-gray-700">Balance ($)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {balanceFeesReportLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center py-12 text-gray-400">
                                                Loading report...
                                            </TableCell>
                                        </TableRow>
                                    ) : balanceFeesReportData.length > 0 ? (
                                        <>
                                            {balanceFeesReportData.map((row, idx) => (
                                                <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors text-[10px]">
                                                    <TableCell className="py-3 px-4 text-gray-800 font-medium">{row.student_name}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.class}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.mobile_no}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.admission_no}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.roll_number}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.father_name}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-700 font-medium">{row.total_fees}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-emerald-600 font-medium">{row.paid_fees}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-600">{row.discount}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-600">{row.fine}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right font-bold text-red-600">{row.balance}</TableCell>
                                                </TableRow>
                                            ))}
                                            {/* Summary Row */}
                                            <TableRow className="bg-gray-50/20 font-bold text-[10px] hover:bg-gray-50/20 border-t-2 border-gray-100">
                                                <TableCell colSpan={6} className="py-3 px-4 text-right uppercase tracking-tighter text-gray-400 font-bold">Total</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">
                                                    ${balanceFeesReportData.reduce((acc, curr) => acc + parseFloat(curr.total_fees), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-emerald-600 font-bold">
                                                    ${balanceFeesReportData.reduce((acc, curr) => acc + parseFloat(curr.paid_fees), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">
                                                    ${balanceFeesReportData.reduce((acc, curr) => acc + parseFloat(curr.discount), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">
                                                    ${balanceFeesReportData.reduce((acc, curr) => acc + parseFloat(curr.fine), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-red-600 font-bold">
                                                    ${balanceFeesReportData.reduce((acc, curr) => acc + parseFloat(curr.balance), 0).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={11} className="text-center py-12">
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

            {activeTab === "Fees Collection Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                            <div className="space-y-1">
                                <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Search Duration <span className="text-red-500">*</span></Label>
                                <Select value={searchDuration} onValueChange={setSearchDuration}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[10px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="yesterday">Yesterday</SelectItem>
                                        <SelectItem value="this_week">This Week</SelectItem>
                                        <SelectItem value="last_week">Last Week</SelectItem>
                                        <SelectItem value="this_month">This Month</SelectItem>
                                        <SelectItem value="last_month">Last Month</SelectItem>
                                        <SelectItem value="this_year">This Year</SelectItem>
                                        <SelectItem value="last_year">Last Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Class</Label>
                                <Select value={selectedClass} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[10px] shadow-none rounded focus:ring-indigo-500">
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

                            <div className="space-y-1">
                                <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[10px] shadow-none rounded focus:ring-indigo-500">
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

                            <div className="space-y-1">
                                <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Fees Type</Label>
                                <Select value={selectedFeeType} onValueChange={setSelectedFeeType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[10px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select</SelectItem>
                                        {feeTypes.map((ft) => (
                                            <SelectItem key={ft.id} value={ft.id.toString()}>{ft.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Collect By</Label>
                                <Select value={selectedCollector} onValueChange={setSelectedCollector}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[10px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select</SelectItem>
                                        {collectors.map((c) => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Group By</Label>
                                <Select value={groupBy} onValueChange={setGroupBy}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[10px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="class">Class</SelectItem>
                                        <SelectItem value="collection_person">Collection Person</SelectItem>
                                        <SelectItem value="payment_mode">Payment Mode</SelectItem>
                                        <SelectItem value="fees_group">Fees Group</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSearch} disabled={collectionReportLoading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-[10px] font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 uppercase">
                                <Search className="h-3.5 w-3.5" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Fees Collection Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Fees Collection Report</h2>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[9px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Payment ID</TableHead>
                                        <TableHead className="py-3 px-4">Date</TableHead>
                                        <TableHead className="py-3 px-4">Student Name</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Class</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Fees Group</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Fees Type</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Mode</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Amount ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Discount ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Fine ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right font-bold text-gray-700">Total ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Collected By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {collectionReportLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={12} className="text-center py-12 text-gray-400">
                                                Loading collection report...
                                            </TableCell>
                                        </TableRow>
                                    ) : collectionReportData.length > 0 ? (
                                        <>
                                            {collectionReportData.map((row, idx) => (
                                                <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors text-[10px]">
                                                    <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.payment_id}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.date}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-800 font-medium">{row.student_name}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.class}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.fees_group}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.fees_type}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.mode}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-700 font-medium">{row.amount}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-emerald-600 font-medium">{row.discount}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-600">{row.fine}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right font-bold text-indigo-600">{row.total}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.collected_by}</TableCell>
                                                </TableRow>
                                            ))}
                                            {/* Summary Row */}
                                            <TableRow className="bg-gray-50/20 font-bold text-[10px] hover:bg-gray-50/20 border-t-2 border-gray-100">
                                                <TableCell colSpan={7} className="py-3 px-4 text-right uppercase tracking-tighter text-gray-400 font-bold">Total</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">
                                                    ${collectionReportData.reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-emerald-600 font-bold">
                                                    ${collectionReportData.reduce((acc, curr) => acc + parseFloat(curr.discount), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">
                                                    ${collectionReportData.reduce((acc, curr) => acc + parseFloat(curr.fine), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-indigo-600 font-bold">
                                                    ${collectionReportData.reduce((acc, curr) => acc + parseFloat(curr.total), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4"></TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={12} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No record found</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Receipt className="h-8 w-8 text-gray-200" />
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

            {activeTab === "Balance Fees Report With Remark" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedRemarkClass} onValueChange={(val) => {
                                    setSelectedRemarkClass(val);
                                    const cls = classes.find(c => c.id.toString() === val);
                                    setSections(cls?.sections || []);
                                    setSelectedRemarkSection("");
                                }}>
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
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section <span className="text-red-500">*</span></Label>
                                <Select value={selectedRemarkSection} onValueChange={setSelectedRemarkSection}>
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
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSearch} disabled={remarkReportLoading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-[10px] font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 uppercase tracking-wide">
                                <Search className="h-3.5 w-3.5" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Balance Fees Report With Remark Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Balance Fees Report With Remark</h2>
                            <Button variant="outline" className="h-7 px-3 text-[10px] font-bold text-indigo-600 border-indigo-100 hover:bg-indigo-50 rounded flex items-center gap-1.5">
                                <Printer className="h-3 w-3" />
                                Print
                            </Button>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[9px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Student Name (Admission No)</TableHead>
                                        <TableHead className="py-3 px-4">Class</TableHead>
                                        <TableHead className="py-3 px-4">Fees</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Amount ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Paid ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right font-bold text-gray-700">Balance ($)</TableHead>
                                        <TableHead className="py-3 px-4">Remark</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {remarkReportLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-[10px]">
                                                Loading report...
                                            </TableCell>
                                        </TableRow>
                                    ) : remarkReportData.length > 0 ? (
                                        remarkReportData.map((row, idx) => (
                                            <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors text-[10px]">
                                                <TableCell className="py-3 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-indigo-600 font-bold">{row.student_name}</span>
                                                        <span className="text-gray-400 text-[9px]">({row.admission_no})</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-600">{row.class}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500 text-[9px] leading-relaxed max-w-[300px] break-words">
                                                    {row.fees_details}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-medium">{row.amount}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-emerald-600 font-medium">{row.paid}</TableCell>
                                                <TableCell className="py-3 px-4 text-right font-bold text-indigo-600">{row.balance}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-600 italic text-[9px]">
                                                    {row.remark || "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={7} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No record found</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Receipt className="h-8 w-8 text-gray-200" />
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

            {activeTab === "Expense Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type <span className="text-red-500">*</span></Label>
                                <Select value={expenseSearchType} onValueChange={setExpenseSearchType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="yesterday">Yesterday</SelectItem>
                                        <SelectItem value="this_week">This Week</SelectItem>
                                        <SelectItem value="last_week">Last Week</SelectItem>
                                        <SelectItem value="this_month">This Month</SelectItem>
                                        <SelectItem value="last_month">Last Month</SelectItem>
                                        <SelectItem value="this_year">This Year</SelectItem>
                                        <SelectItem value="last_year">Last Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSearch} disabled={expenseReportLoading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-[10px] font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 uppercase tracking-wide">
                                <Search className="h-3.5 w-3.5" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Expense Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Expense Report</h2>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Copy className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><FileText className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><File className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[9px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Date</TableHead>
                                        <TableHead className="py-3 px-4">Expense Head</TableHead>
                                        <TableHead className="py-3 px-4">Name</TableHead>
                                        <TableHead className="py-3 px-4">Invoice Number</TableHead>
                                        <TableHead className="py-3 px-4 text-right font-bold text-gray-700">Amount ($)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenseReportLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-gray-400 text-[10px]">
                                                Loading expense report...
                                            </TableCell>
                                        </TableRow>
                                    ) : expenseReportData.length > 0 ? (
                                        <>
                                            {expenseReportData.map((row, idx) => (
                                                <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors text-[10px]">
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.date}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.expense_head}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-800 font-medium">{row.name}</TableCell>
                                                    <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.invoice_number}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right font-bold text-red-600">${row.amount}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-gray-50/20 font-bold text-[10px] hover:bg-gray-50/20 border-t-2 border-gray-100">
                                                <TableCell colSpan={4} className="py-3 px-4 text-right uppercase tracking-tighter text-gray-400 font-bold">Total</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-red-600 font-bold">
                                                    ${expenseReportData.reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={5} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No record found</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Receipt className="h-8 w-8 text-gray-200" />
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
            {activeTab === "Payroll Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type <span className="text-red-500">*</span></Label>
                                <Select value={payrollSearchType} onValueChange={setPayrollSearchType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="yesterday">Yesterday</SelectItem>
                                        <SelectItem value="this_week">This Week</SelectItem>
                                        <SelectItem value="last_week">Last Week</SelectItem>
                                        <SelectItem value="this_month">This Month</SelectItem>
                                        <SelectItem value="last_month">Last Month</SelectItem>
                                        <SelectItem value="this_year">This Year</SelectItem>
                                        <SelectItem value="last_year">Last Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSearch} disabled={payrollReportLoading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-[10px] font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 uppercase tracking-wide">
                                <Search className="h-3.5 w-3.5" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Payroll Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Payroll Report</h2>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Copy className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><FileText className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><File className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[9px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Name</TableHead>
                                        <TableHead className="py-3 px-4">Role</TableHead>
                                        <TableHead className="py-3 px-4">Designation</TableHead>
                                        <TableHead className="py-3 px-4">Month - Year</TableHead>
                                        <TableHead className="py-3 px-4">Payslip #</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Basic Salary ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Earning ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Deduction ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Gross Salary ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Tax ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right font-bold text-gray-700">Net Salary ($)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payrollReportLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center py-12 text-gray-400 text-[10px]">
                                                Loading payroll report...
                                            </TableCell>
                                        </TableRow>
                                    ) : payrollReportData.length > 0 ? (
                                        <>
                                            {payrollReportData.map((row, idx) => (
                                                <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors text-[10px]">
                                                    <TableCell className="py-3 px-4 text-blue-600 font-medium">{row.name}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.role}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.designation}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.month_year}</TableCell>
                                                    <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.payslip_no}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-600">${row.basic_salary}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-600">${row.earning}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-600">${row.deduction}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-600">${row.gross_salary}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-600">${row.tax}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right font-bold text-indigo-600">${row.net_salary}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-gray-50/20 font-bold text-[10px] hover:bg-gray-50/20 border-t-2 border-gray-100">
                                                <TableCell colSpan={5} className="py-3 px-4 text-right uppercase tracking-tighter text-gray-400 font-bold">Total</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">
                                                    ${payrollReportData.reduce((acc, curr) => acc + parseFloat(curr.basic_salary), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">
                                                    ${payrollReportData.reduce((acc, curr) => acc + parseFloat(curr.earning), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">
                                                    ${payrollReportData.reduce((acc, curr) => acc + parseFloat(curr.deduction), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">
                                                    ${payrollReportData.reduce((acc, curr) => acc + parseFloat(curr.gross_salary), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">
                                                    ${payrollReportData.reduce((acc, curr) => acc + parseFloat(curr.tax), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-indigo-600 font-bold">
                                                    ${payrollReportData.reduce((acc, curr) => acc + parseFloat(curr.net_salary), 0).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={11} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No record found</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Receipt className="h-8 w-8 text-gray-200" />
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
            {activeTab === "Income Group Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type <span className="text-red-500">*</span></Label>
                                <Select value={incomeGroupSearchType} onValueChange={setIncomeGroupSearchType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="yesterday">Yesterday</SelectItem>
                                        <SelectItem value="this_week">This Week</SelectItem>
                                        <SelectItem value="last_week">Last Week</SelectItem>
                                        <SelectItem value="this_month">This Month</SelectItem>
                                        <SelectItem value="last_month">Last Month</SelectItem>
                                        <SelectItem value="this_year">This Year</SelectItem>
                                        <SelectItem value="last_year">Last Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Income Head</Label>
                                <Select value={selectedIncomeHead} onValueChange={setSelectedIncomeHead}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select</SelectItem>
                                        {incomeHeads.map((head) => (
                                            <SelectItem key={head.id} value={head.id.toString()}>{head.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSearch} disabled={incomeGroupReportLoading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-[10px] font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 uppercase tracking-wide">
                                <Search className="h-3.5 w-3.5" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Income Group Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Income Group Report</h2>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Copy className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><FileText className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><File className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[9px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Income Head</TableHead>
                                        <TableHead className="py-3 px-4">Income ID</TableHead>
                                        <TableHead className="py-3 px-4">Name</TableHead>
                                        <TableHead className="py-3 px-4">Date</TableHead>
                                        <TableHead className="py-3 px-4">Invoice Number</TableHead>
                                        <TableHead className="py-3 px-4 text-right font-bold text-gray-700">Amount ($)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {incomeGroupReportLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-gray-400 text-[10px]">
                                                Loading income group report...
                                            </TableCell>
                                        </TableRow>
                                    ) : incomeGroupReportData.length > 0 ? (
                                        <>
                                            {Object.entries(
                                                incomeGroupReportData.reduce((acc: any, curr: any) => {
                                                    if (!acc[curr.income_head]) acc[curr.income_head] = [];
                                                    acc[curr.income_head].push(curr);
                                                    return acc;
                                                }, {})
                                            ).map(([head, records]: [string, any], headIdx) => (
                                                <Fragment key={headIdx}>
                                                    {records.map((row: any, rowIdx: number) => (
                                                        <TableRow key={`${headIdx}-${rowIdx}`} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors text-[10px]">
                                                            <TableCell className="py-3 px-4 text-gray-800 font-medium">
                                                                {rowIdx === 0 ? head : ""}
                                                            </TableCell>
                                                            <TableCell className="py-3 px-4 text-center text-gray-600">{row.income_id}</TableCell>
                                                            <TableCell className="py-3 px-4 text-gray-600">{row.name}</TableCell>
                                                            <TableCell className="py-3 px-4 text-gray-600">{row.date}</TableCell>
                                                            <TableCell className="py-3 px-4 text-gray-600">{row.invoice_number}</TableCell>
                                                            <TableCell className="py-3 px-4 text-right text-gray-600">${row.amount}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow className="bg-gray-50/20 font-bold text-[10px] hover:bg-gray-50/20 border-b border-gray-100">
                                                        <TableCell colSpan={5} className="py-3 px-4 text-right uppercase tracking-tighter text-gray-400 font-bold">Sub Total</TableCell>
                                                        <TableCell className="py-3 px-4 text-right text-gray-900 font-bold border-t border-gray-200">
                                                            ${records.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0).toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                </Fragment>
                                            ))}
                                        </>
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={6} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No record found</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Receipt className="h-8 w-8 text-gray-200" />
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
            {activeTab === "Expense Group Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type <span className="text-red-500">*</span></Label>
                                <Select value={expenseGroupSearchType} onValueChange={setExpenseGroupSearchType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="yesterday">Yesterday</SelectItem>
                                        <SelectItem value="this_week">This Week</SelectItem>
                                        <SelectItem value="last_week">Last Week</SelectItem>
                                        <SelectItem value="this_month">This Month</SelectItem>
                                        <SelectItem value="last_month">Last Month</SelectItem>
                                        <SelectItem value="this_year">This Year</SelectItem>
                                        <SelectItem value="last_year">Last Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Expense Head</Label>
                                <Select value={selectedExpenseHead} onValueChange={setSelectedExpenseHead}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select</SelectItem>
                                        {expenseHeads.map((head) => (
                                            <SelectItem key={head.id} value={head.id.toString()}>{head.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSearch} disabled={expenseGroupReportLoading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-[10px] font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 uppercase tracking-wide">
                                <Search className="h-3.5 w-3.5" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Expense Group Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Expense Group Report</h2>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Copy className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><FileText className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><File className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[9px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Expense Head</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Expense ID</TableHead>
                                        <TableHead className="py-3 px-4">Name</TableHead>
                                        <TableHead className="py-3 px-4">Date</TableHead>
                                        <TableHead className="py-3 px-4">Invoice Number</TableHead>
                                        <TableHead className="py-3 px-4 text-right font-bold text-gray-700">Amount ($)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenseGroupReportLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-gray-400 text-[10px]">
                                                Loading expense group report...
                                            </TableCell>
                                        </TableRow>
                                    ) : expenseGroupReportData.length > 0 ? (
                                        <>
                                            {Object.entries(
                                                expenseGroupReportData.reduce((acc: any, curr: any) => {
                                                    if (!acc[curr.expense_head]) acc[curr.expense_head] = [];
                                                    acc[curr.expense_head].push(curr);
                                                    return acc;
                                                }, {})
                                            ).map(([head, records]: [string, any], headIdx) => (
                                                <React.Fragment key={headIdx}>
                                                    {records.map((row: any, rowIdx: number) => (
                                                        <TableRow key={`${headIdx}-${rowIdx}`} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors text-[10px]">
                                                            <TableCell className="py-3 px-4 text-gray-800 font-medium">
                                                                {rowIdx === 0 ? head : ""}
                                                            </TableCell>
                                                            <TableCell className="py-3 px-4 text-center text-gray-600">{row.expense_id}</TableCell>
                                                            <TableCell className="py-3 px-4 text-gray-600">{row.name}</TableCell>
                                                            <TableCell className="py-3 px-4 text-gray-600">{row.date}</TableCell>
                                                            <TableCell className="py-3 px-4 text-gray-600">{row.invoice_number}</TableCell>
                                                            <TableCell className="py-3 px-4 text-right text-gray-600">${row.amount}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow className="bg-gray-50/20 font-bold text-[10px] hover:bg-gray-50/20 border-b border-gray-100">
                                                        <TableCell colSpan={5} className="py-3 px-4 text-right uppercase tracking-tighter text-gray-400 font-bold">Sub Total</TableCell>
                                                        <TableCell className="py-3 px-4 text-right text-gray-900 font-bold border-t border-gray-200">
                                                            ${records.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0).toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                </React.Fragment>
                                            ))}
                                        </>
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={6} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No record found</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Receipt className="h-8 w-8 text-gray-200" />
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
            {activeTab === "Online Admission Fees Collection Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type <span className="text-red-500">*</span></Label>
                                <Select value={onlineAdmissionSearchType} onValueChange={setOnlineAdmissionSearchType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="yesterday">Yesterday</SelectItem>
                                        <SelectItem value="this_week">This Week</SelectItem>
                                        <SelectItem value="last_week">Last Week</SelectItem>
                                        <SelectItem value="this_month">This Month</SelectItem>
                                        <SelectItem value="last_month">Last Month</SelectItem>
                                        <SelectItem value="this_year">This Year</SelectItem>
                                        <SelectItem value="last_year">Last Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSearch} disabled={onlineAdmissionCollectionLoading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-[10px] font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 uppercase tracking-wide">
                                <Search className="h-3.5 w-3.5" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Online Admission Fees Collection Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Online Admission Fees Collection Report</h2>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Copy className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><FileText className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><File className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[9px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Date</TableHead>
                                        <TableHead className="py-3 px-4">Admission No</TableHead>
                                        <TableHead className="py-3 px-4">Reference No</TableHead>
                                        <TableHead className="py-3 px-4">Name</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Class</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Payment Mode</TableHead>
                                        <TableHead className="py-3 px-4 text-right font-bold text-gray-700">Paid Amount ($)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {onlineAdmissionCollectionLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-[10px]">
                                                Loading online admission collection report...
                                            </TableCell>
                                        </TableRow>
                                    ) : onlineAdmissionCollectionData.length > 0 ? (
                                        <>
                                            {onlineAdmissionCollectionData.map((row: any, idx: number) => (
                                                <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors text-[10px]">
                                                    <TableCell className="py-3 px-4 text-gray-600 font-medium">{row.date}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.admission_no || "-"}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.reference_no}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-800 font-medium">{row.name}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.class}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.payment_mode}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-900 font-bold">${row.paid_amount}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-gray-50/20 font-bold text-[10px] hover:bg-gray-50/20 border-b border-gray-100">
                                                <TableCell colSpan={6} className="py-3 px-4 text-right uppercase tracking-tighter text-gray-400 font-bold">Total</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-900 font-bold border-t border-gray-200">
                                                    ${onlineAdmissionCollectionData.reduce((sum: number, r: any) => sum + parseFloat(r.paid_amount), 0).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={7} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No record found</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Receipt className="h-8 w-8 text-gray-200" />
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
            {activeTab === "Due Fees Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section <span className="text-red-500">*</span></Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {sections.map((sec) => (
                                            <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSearch} disabled={dueFeesReportLoading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-[10px] font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 uppercase tracking-wide">
                                <Search className="h-3.5 w-3.5" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Due Fees Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Due Fees Report</h2>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Copy className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><FileText className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><File className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[9px] font-bold uppercase text-gray-600">
                                        <TableHead className="w-10 py-3 px-4">
                                            <Checkbox className="h-3.5 w-3.5 border-gray-300 rounded-sm data-[state=checked]:bg-indigo-600" />
                                        </TableHead>
                                        <TableHead className="py-3 px-4">Admission No</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Student Name</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Father Name</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Class</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Due Amount</TableHead>
                                        <TableHead className="py-3 px-4 text-right font-bold text-gray-700">Total Due Amount</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Mobile No.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dueFeesReportLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12 text-gray-400 text-[10px]">
                                                Loading due fees report...
                                            </TableCell>
                                        </TableRow>
                                    ) : dueFeesReportData.length > 0 ? (
                                        <>
                                            {dueFeesReportData.map((row: any, idx: number) => (
                                                <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors text-[10px]">
                                                    <TableCell className="py-3 px-4">
                                                        <Checkbox className="h-3.5 w-3.5 border-gray-300 rounded-sm data-[state=checked]:bg-indigo-600" />
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600 font-medium">{row.admission_no}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-800 font-medium">{row.student_name}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.father_name}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.class}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-600">
                                                        {row.due_amounts.map((amt: string, i: number) => (
                                                            <span key={i}>
                                                                ${amt}
                                                                {i < row.due_amounts.length - 1 && <span className="text-red-500 mx-1">+</span>}
                                                            </span>
                                                        ))}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-900 font-bold">${row.total_due_amount}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.mobile_no}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-gray-50/20 font-bold text-[10px] hover:bg-gray-50/20 border-b border-gray-100">
                                                <TableCell colSpan={5} className="py-3 px-4 text-right uppercase tracking-tighter text-gray-400 font-bold">Total</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-900 font-bold border-t border-gray-200">
                                                    -
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-900 font-bold border-t border-gray-200">
                                                    ${dueFeesReportData.reduce((sum: number, r: any) => sum + parseFloat(r.total_due_amount), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4"></TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={8} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No record found</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Receipt className="h-8 w-8 text-gray-200" />
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
            {activeTab === "Income Expense Balance Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type <span className="text-red-500">*</span></Label>
                                <Select value={incomeExpenseBalanceSearchType} onValueChange={setIncomeExpenseBalanceSearchType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="yesterday">Yesterday</SelectItem>
                                        <SelectItem value="this_week">This Week</SelectItem>
                                        <SelectItem value="last_week">Last Week</SelectItem>
                                        <SelectItem value="this_month">This Month</SelectItem>
                                        <SelectItem value="last_month">Last Month</SelectItem>
                                        <SelectItem value="this_year">This Year</SelectItem>
                                        <SelectItem value="last_year">Last Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSearch} disabled={incomeExpenseBalanceLoading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-[10px] font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 uppercase tracking-wide">
                                <Search className="h-3.5 w-3.5" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Income Expense Balance Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Income Expense Balance Report</h2>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Copy className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><FileText className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><File className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[9px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Date</TableHead>
                                        <TableHead className="py-3 px-4">Name</TableHead>
                                        <TableHead className="py-3 px-4">Income Expense Head</TableHead>
                                        <TableHead className="py-3 px-4">Description</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Income Money In ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Expense Money Out ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right font-bold text-gray-700">Overall Balance ($)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {incomeExpenseBalanceLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-[10px]">
                                                Loading income expense balance report...
                                            </TableCell>
                                        </TableRow>
                                    ) : incomeExpenseBalanceData.length > 0 ? (
                                        <>
                                            {incomeExpenseBalanceData.map((row: any, idx: number) => (
                                                <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors text-[10px]">
                                                    <TableCell className="py-3 px-4 text-gray-600 font-medium">{row.date}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-800 font-medium">{row.name}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.head}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600 max-w-[200px] truncate">{row.description}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-green-600 font-medium">
                                                        {parseFloat(row.income) > 0 ? `$${row.income}` : "-"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-red-600 font-medium">
                                                        {parseFloat(row.expense) > 0 ? `$${row.expense}` : "-"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-900 font-bold">${row.balance}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-gray-50/20 font-bold text-[10px] hover:bg-gray-50/20 border-b border-gray-100">
                                                <TableCell colSpan={4} className="py-3 px-4 text-right uppercase tracking-tighter text-gray-400 font-bold">Total</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-green-600 font-bold border-t border-gray-200">
                                                    ${incomeExpenseBalanceData.reduce((sum: number, r: any) => sum + parseFloat(r.income), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-red-600 font-bold border-t border-gray-200">
                                                    ${incomeExpenseBalanceData.reduce((sum: number, r: any) => sum + parseFloat(r.expense), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-900 font-bold border-t border-gray-200">
                                                    ${incomeExpenseBalanceData[incomeExpenseBalanceData.length - 1]?.balance || "0.00"}
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={7} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No record found</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Receipt className="h-8 w-8 text-gray-200" />
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
            {activeTab === "Income Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type <span className="text-red-500">*</span></Label>
                                <Select value={incomeSearchType} onValueChange={setIncomeSearchType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="yesterday">Yesterday</SelectItem>
                                        <SelectItem value="this_week">This Week</SelectItem>
                                        <SelectItem value="last_week">Last Week</SelectItem>
                                        <SelectItem value="this_month">This Month</SelectItem>
                                        <SelectItem value="last_month">Last Month</SelectItem>
                                        <SelectItem value="this_year">This Year</SelectItem>
                                        <SelectItem value="last_year">Last Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSearch} disabled={incomeReportLoading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-[10px] font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 uppercase tracking-wide">
                                <Search className="h-3.5 w-3.5" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Income Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Income Report</h2>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Copy className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><FileText className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><File className="h-3.5 w-3.5" /></Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 border-gray-200 text-gray-400"><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[9px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Name</TableHead>
                                        <TableHead className="py-3 px-4">Invoice Number</TableHead>
                                        <TableHead className="py-3 px-4">Income Head</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Date</TableHead>
                                        <TableHead className="py-3 px-4 text-right font-bold text-gray-700">Amount ($)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {incomeReportLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-gray-400 text-[10px]">
                                                Loading income report...
                                            </TableCell>
                                        </TableRow>
                                    ) : incomeReportData.length > 0 ? (
                                        <>
                                            {incomeReportData.map((row, idx) => (
                                                <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors text-[10px]">
                                                    <TableCell className="py-3 px-4 text-gray-800 font-medium">{row.name}</TableCell>
                                                    <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.invoice_number}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.income_head}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.date}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right font-bold text-emerald-600">${row.amount}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-gray-50/20 font-bold text-[10px] hover:bg-gray-50/20 border-t-2 border-gray-100">
                                                <TableCell colSpan={4} className="py-3 px-4 text-right uppercase tracking-tighter text-gray-400 font-bold">Total</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-emerald-600 font-bold">
                                                    ${incomeReportData.reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={5} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No record found</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Receipt className="h-8 w-8 text-gray-200" />
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

            {activeTab === "Online Fees Collection Report" && (
                <>
                    {/* Select Criteria Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type <span className="text-red-500">*</span></Label>
                                <Select value={onlineSearchType} onValueChange={setOnlineSearchType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="yesterday">Yesterday</SelectItem>
                                        <SelectItem value="this_week">This Week</SelectItem>
                                        <SelectItem value="last_week">Last Week</SelectItem>
                                        <SelectItem value="this_month">This Month</SelectItem>
                                        <SelectItem value="last_month">Last Month</SelectItem>
                                        <SelectItem value="this_year">This Year</SelectItem>
                                        <SelectItem value="last_year">Last Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSearch} disabled={onlineCollectionLoading} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-[10px] font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 uppercase tracking-wide">
                                <Search className="h-3.5 w-3.5" />
                                Search
                            </Button>
                        </div>
                    </div>

                    {/* Online Fees Collection Report Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Online Fees Collection Report</h2>

                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-full">
                                <TableHeader className="bg-transparent">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[9px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Payment ID</TableHead>
                                        <TableHead className="py-3 px-4">Date</TableHead>
                                        <TableHead className="py-3 px-4">Student Name</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Class</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Fees Group</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Fees Type</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Mode</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Amount ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Discount ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right">Fine ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-right font-bold text-gray-700">Total ($)</TableHead>
                                        <TableHead className="py-3 px-4 text-center">Collected By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {onlineCollectionLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={12} className="text-center py-12 text-gray-400 text-[10px]">
                                                Loading online collection report...
                                            </TableCell>
                                        </TableRow>
                                    ) : onlineCollectionData.length > 0 ? (
                                        <>
                                            {onlineCollectionData.map((row, idx) => (
                                                <TableRow key={idx} className="hover:bg-gray-50/50 border-b border-gray-50 transition-colors text-[10px]">
                                                    <TableCell className="py-3 px-4 text-indigo-600 font-medium">{row.payment_id}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600">{row.date}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-800 font-medium">{row.student_name}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.class}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.fees_group}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.fees_type}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.mode}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-700 font-medium">{row.amount}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-emerald-600 font-medium">{row.discount}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-600">{row.fine}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right font-bold text-indigo-600">{row.total}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-600">{row.collected_by}</TableCell>
                                                </TableRow>
                                            ))}
                                            {/* Summary Row */}
                                            <TableRow className="bg-gray-50/20 font-bold text-[10px] hover:bg-gray-50/20 border-t-2 border-gray-100">
                                                <TableCell colSpan={7} className="py-3 px-4 text-right uppercase tracking-tighter text-gray-400 font-bold">Total</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">
                                                    ${onlineCollectionData.reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-emerald-600 font-bold">
                                                    ${onlineCollectionData.reduce((acc, curr) => acc + parseFloat(curr.discount), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">
                                                    ${onlineCollectionData.reduce((acc, curr) => acc + parseFloat(curr.fine), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-indigo-600 font-bold">
                                                    ${onlineCollectionData.reduce((acc, curr) => acc + parseFloat(curr.total), 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4"></TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={12} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4">No record found</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <Receipt className="h-8 w-8 text-gray-200" />
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
                                                {stu.name} {stu.last_name} ({stu.admission_no})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button variant="gradient" onClick={handleSearch} disabled={feesStatementLoading} className="px-6 h-9 flex items-center justify-center gap-2">
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
                                                <TableRow key={idx} className={cn("text-[10px] hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer border-b border-gray-50", fee.status === "Unpaid" && "bg-red-50/40")}>
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
                                                    <TableCell className="py-2 px-3 font-bold text-gray-700">{fee.amount}</TableCell>
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
