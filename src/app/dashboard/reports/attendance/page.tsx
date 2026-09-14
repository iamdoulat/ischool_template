/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
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
    CalendarCheck,
    ClipboardList,
    Copy,
    FileSpreadsheet,
    FileBox,
    Printer,
    FolderOpen,
    ChevronLeft,
    ChevronRight,
    Monitor,
    Filter,
} from "lucide-react";
import Link from "next/link";
import { cn, toLocaleNumber, translateClassName, translateSectionName } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/providers/language-provider";

const monthList = [
    { value: "jan", key: "month_jan", label: "January" },
    { value: "feb", key: "month_feb", label: "February" },
    { value: "mar", key: "month_mar", label: "March" },
    { value: "apr", key: "month_apr", label: "April" },
    { value: "may", key: "month_may", label: "May" },
    { value: "jun", key: "month_jun", label: "June" },
    { value: "jul", key: "month_jul", label: "July" },
    { value: "aug", key: "month_aug", label: "August" },
    { value: "sep", key: "month_sep", label: "September" },
    { value: "oct", key: "month_oct", label: "October" },
    { value: "nov", key: "month_nov", label: "November" },
    { value: "dec", key: "month_dec", label: "December" },
];

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

const reportLinks = [
    { id: "Attendance Report", key: "attendance_report", icon: FileText },
    { id: "Student Attendance Type Report", key: "student_attendance_type_report", icon: FileText },
    { id: "Daily Attendance Report", key: "daily_attendance_report", icon: FileText },
    { id: "Student Day Wise Attendance Report", key: "student_day_wise_attendance_report", icon: FileText },
    { id: "Staff Day Wise Attendance Report", key: "staff_day_wise_attendance_report", icon: FileText },
    { id: "Staff Attendance Report", key: "staff_attendance_report", icon: FileText },
    { id: "Biometric Attendance Log", key: "biometric_attendance_log", icon: FileText },
];

interface AttendanceRow {
    name: string;
    percentage: string;
    p: number;
    l: number;
    a: number;
    h: number;
    f: number;
    grid: (string | null)[];
}

export default function AttendanceReportPage() {
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";

    const getMonthLabel = (mVal: string) => {
        const item = monthList.find(m => m.value.toLowerCase() === mVal?.toLowerCase());
        if (!item) return mVal;
        return t(item.key) || item.label;
    };
    const [activeTab, setActiveTab] = useState("Attendance Report");
    const [searchTerm, setSearchTerm] = useState("");
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [filteredSections, setFilteredSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [attendanceData, setAttendanceData] = useState<AttendanceRow[]>([]);
    
    // Student Day Wise state
    const [selectedDayWiseDate, setSelectedDayWiseDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSource, setSelectedSource] = useState("All");
    const [dayWiseData, setDayWiseData] = useState<any[]>([]);
    const [attendanceTypeData, setAttendanceTypeData] = useState<any[]>([]);
    const [attendanceType, setAttendanceType] = useState("");
    const [searchType, setSearchType] = useState("today");
    const [selectedSection, setSelectedSection] = useState("");

    // Daily Attendance Report state
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyReportData, setDailyReportData] = useState<any[]>([]);
    const [biometricData, setBiometricData] = useState<any[]>([]);
    const [selectedBiometricDate, setSelectedBiometricDate] = useState(new Date().toISOString().split('T')[0]);

    // Staff Reports state
    const [staffRoles, setStaffRoles] = useState<any[]>([]);
    const [selectedStaffRole, setSelectedStaffRole] = useState("");
    const [selectedStaffDate, setSelectedStaffDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedStaffSource, setSelectedStaffSource] = useState("All");
    const [staffDayWiseData, setStaffDayWiseData] = useState<any[]>([]);
    const [staffAttendanceData, setStaffAttendanceData] = useState<any[]>([]);

    const [selectedClass, setSelectedClass] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");

    useEffect(() => {
        const now = new Date();
        const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        setSelectedMonth(monthNames[now.getMonth()]);
        setSelectedYear(now.getFullYear().toString());
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [classesRes, sectionsRes, sessionsRes, rolesRes] = await Promise.all([
                api.get("academics/classes", { params: { no_paginate: true } }),
                api.get("academics/sections", { params: { no_paginate: true } }),
                api.get("system-setting/sessions"),
                api.get("hr/staff-roles")
            ]);
            
            const classesList = Array.isArray(classesRes.data.data) 
                ? classesRes.data.data 
                : (classesRes.data.data?.data || []);
            
            const sectionsList = Array.isArray(sectionsRes.data.data) 
                ? sectionsRes.data.data 
                : (sectionsRes.data.data?.data || []);

            const sessionsList = sessionsRes.data.success ? sessionsRes.data.data : [];
            const rolesList = rolesRes.data.status === "Success" ? rolesRes.data.data : [];
            
            setClasses(classesList);
            setSections(sectionsList);
            setSessions(sessionsList);
            setStaffRoles(rolesList);
            if (rolesList.length > 0) setSelectedStaffRole(rolesList[0].name);
            
            if (classesList.length > 0) {
                const firstClass = classesList[0];
                setSelectedClass(firstClass.id.toString());
                setFilteredSections(firstClass.sections || []);
                if (firstClass.sections?.length > 0) {
                    setSelectedSection(firstClass.sections[0].id.toString());
                }
            }

            if (sessionsList.length > 0) {
                const activeSession = sessionsList.find((s: any) => s.is_active);
                if (activeSession) {
                    const yearMatch = activeSession.session.match(/\d{4}/);
                    if (yearMatch) setSelectedYear(yearMatch[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching initial data:", error);
            toast.error("Failed to load initial data");
        }
    };

    useEffect(() => {
        if (selectedClass) {
            const classObj = classes.find(c => c.id.toString() === selectedClass);
            const classSections = classObj?.sections || [];
            setFilteredSections(classSections);
        }
    }, [selectedClass, classes]);

    const handleExport = (type: string) => {
        let dataToExport: any[] = [];
        if (activeTab === "Attendance Report") dataToExport = attendanceData;
        else if (activeTab === "Student Day Wise Attendance Report") dataToExport = dayWiseData;
        else if (activeTab === "Student Attendance Type Report") dataToExport = attendanceTypeData;
        else if (activeTab === "Staff Day Wise Attendance Report") dataToExport = staffDayWiseData;
        else if (activeTab === "Staff Attendance Report") dataToExport = staffAttendanceData;
        else if (activeTab === "Biometric Attendance Log") dataToExport = biometricData;
        
        if (dataToExport.length === 0) {
            toast.warning(`No data available to export`);
            return;
        }

        toast.success(`Exporting as ${type.toUpperCase()}...`);
        let headers: string[] = [];
        let rows: any[] = [];

        if (activeTab === "Attendance Report") {
            headers = ["Student Name", "P", "L", "A", "H", "F", "Percentage"];
            rows = dataToExport.map(row => [row.name, row.p, row.l, row.a, row.h, row.f, row.percentage]);
        } else if (activeTab === "Student Day Wise Attendance Report") {
            headers = ["#", "Admission No", "Roll Number", "Name", "Attendance", "Date", "Source", "IP Address", "Agent", "Scan Location"];
            rows = dataToExport.map((row, i) => [i + 1, row.admission_no, row.roll_no, row.name, row.attendance, row.date, row.source, row.ip_address, row.agent, row.scan_location]);
        } else if (activeTab === "Biometric Attendance Log") {
            headers = ["#", "Admission No", "Student Name", "Punch In", "Device Serial Number", "IP Address"];
            rows = dataToExport.map((row, i) => [i + 1, row.admission_no, row.student_name, row.punch_in, row.device_serial, row.ip_address]);
        } else if (activeTab === "Staff Day Wise Attendance Report") {
            headers = ["Staff ID", "Name", "Role", "Designation", "Department", "Count"];
            rows = dataToExport.map(row => [row.staff_id, row.name, row.role, row.designation, row.department, row.count]);
        } else if (activeTab === "Staff Attendance Report") {
            headers = ["Staff ID", "Name", "Role", "Designation", "P", "L", "A", "H", "F", "Percentage"];
            rows = dataToExport.map(row => [row.staff_id, row.name, row.role, row.designation, row.p, row.l, row.a, row.h, row.f, row.percentage]);
        } else {
            headers = ["Admission No", "Student Name", "Class", "Father Name", "DOB", "Admission Date", "Gender", "Mobile", "Count"];
            rows = dataToExport.map(row => [row.admission_no, row.student_name, row.class, row.father_name, row.dob, row.admission_date, row.gender, row.mobile_number, row.count]);
        }

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `${activeTab.replace(/ /g, '_')}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection || !selectedMonth || !selectedYear) {
            toast.warning("Please fill all required fields");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get("reports/attendance/student", {
                params: { school_class_id: selectedClass, section_id: selectedSection, month: selectedMonth, year: selectedYear }
            });
            setAttendanceData(res.data.data || []);
            toast.success("Report generated");
        } catch (error) {
            toast.error("Failed to fetch report");
        } finally {
            setLoading(false);
        }
    };

    const handleDayWiseSearch = async () => {
        if (!selectedClass || !selectedSection || !selectedDayWiseDate) {
            toast.warning("Please fill all required fields");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get("reports/attendance/student-day-wise", {
                params: { 
                    school_class_id: selectedClass, 
                    section_id: selectedSection, 
                    date: selectedDayWiseDate,
                    source: selectedSource
                }
            });
            setDayWiseData(res.data.data || []);
            toast.success("Day Wise Report generated");
        } catch (error) {
            toast.error("Failed to fetch report");
        } finally {
            setLoading(false);
        }
    };

    const handleAttendanceTypeSearch = async () => {
        if (!selectedClass || !attendanceType || !searchType) {
            toast.warning("Please fill all required fields");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get("reports/attendance/day-wise", {
                params: { 
                    school_class_id: selectedClass, 
                    section_id: selectedSection || 'all',
                    attendance_type: attendanceType, 
                    search_type: searchType 
                }
            });
            setAttendanceTypeData(res.data.data || []);
            toast.success("Attendance Type Report generated");
        } catch (error) {
            toast.error("Failed to fetch report");
        } finally {
            setLoading(false);
        }
    };

    const handleDailySearch = async () => {
        if (!selectedDate) {
            toast.warning("Please select a date");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get("reports/attendance/daily", { params: { date: selectedDate } });
            setDailyReportData(res.data.data || []);
            toast.success("Daily report generated");
        } catch (error) {
            toast.error("Failed to fetch report");
        } finally {
            setLoading(false);
        }
    };

    const handleStaffDayWiseSearch = async () => {
        if (!selectedStaffRole || !selectedStaffDate) {
            toast.warning("Please fill all required fields");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get("reports/attendance/staff-day-wise", {
                params: { role: selectedStaffRole, date: selectedStaffDate, source: selectedStaffSource }
            });
            setStaffDayWiseData(res.data.data || []);
            toast.success("Staff Day Wise Report generated");
        } catch (error) {
            toast.error("Failed to fetch report");
        } finally {
            setLoading(false);
        }
    };

    const handleStaffAttendanceSearch = async () => {
        if (!selectedStaffRole || !selectedMonth || !selectedYear) {
            toast.warning("Please fill all required fields");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get("reports/attendance/staff", {
                params: { role: selectedStaffRole, month: selectedMonth, year: selectedYear }
            });
            setStaffAttendanceData(res.data.data || []);
            toast.success("Staff Attendance Report generated");
        } catch (error) {
            toast.error("Failed to fetch report");
        } finally {
            setLoading(false);
        }
    };

    const handleBiometricSearch = async () => {
        if (!selectedBiometricDate) {
            toast.warning("Please select a date");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get("reports/attendance/biometric", { params: { date: selectedBiometricDate } });
            setBiometricData(res.data.data || []);
            toast.success("Biometric log retrieved");
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (month: string, year: string) => {
        const monthMap: { [key: string]: number } = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
        const date = new Date(parseInt(year), monthMap[month], 1);
        const days = [];
        while (date.getMonth() === monthMap[month]) {
            days.push({ d: date.getDate().toString().padStart(2, '0'), n: date.toLocaleDateString('en-US', { weekday: 'short' }) });
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const daysHeader = selectedMonth && selectedYear ? getDaysInMonth(selectedMonth, selectedYear) : [];

    return (
        <div className="space-y-6 pb-20">
            {/* Standalone Edge-to-Edge Gradient Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <CalendarCheck className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("attendance_report")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("attendance_report_description")}
                        </p>
                    </div>
                </div>
                <Link
                    href="/user/attendance"
                    className="flex items-center gap-1.5 h-8 px-4 rounded-full text-white text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] transition-all active:scale-95 shadow-md shrink-0"
                >
                    <Monitor className="h-3.5 w-3.5" />
                    {t("student_portal_view")}
                </Link>
            </div>

            {/* Navigation Grid of 7 Report Tabs */}
            <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {reportLinks.map((link) => {
                        const isActive = activeTab === link.id;
                        return (
                            <div
                                key={link.id}
                                onClick={() => setActiveTab(link.id)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group",
                                    isActive
                                        ? "border-indigo-200 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-200"
                                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-xs"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg transition-all duration-300",
                                    isActive ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                )}>
                                    <link.icon className="h-4 w-4" />
                                </div>
                                <span className={cn(
                                    "text-xs font-bold tracking-tight transition-colors duration-300",
                                    isActive ? "text-[#6366f1]" : "text-gray-700"
                                )}>
                                    {t(link.key)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Attendance Report Tab */}
            {activeTab === "Attendance Report" && (
                <div className="space-y-5">
                    {/* Select Criteria Card */}
                    <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                            <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                                <Filter className="h-4 w-4" />
                            </span>
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("select_criteria") || "Select Criteria"}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("class") || "Class"} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue placeholder={t("select") || "Select"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {translateClassName(c.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("section") || "Section"} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue placeholder={t("select") || "Select"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredSections.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {translateSectionName(s.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("month") || "Month"} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue placeholder={t("select") || "Select"}>
                                            {getMonthLabel(selectedMonth)}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {monthList.map(m => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {t(m.key) || m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("year") || "Year"} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue placeholder={t("select") || "Select"}>
                                            {selectedYear ? toLocaleNumber(sessions.find(s => (s.session.match(/\d{4}/)?.[0] || s.session) === selectedYear)?.session || selectedYear, langCode) : (t("select") || "Select")}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sessions.map(s => {
                                            const y = s.session.match(/\d{4}/)?.[0] || s.session;
                                            return (
                                                <SelectItem key={s.id} value={y}>
                                                    {toLocaleNumber(s.session, langCode)}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                onClick={handleSearch} 
                                disabled={loading} 
                                className="h-9 px-5 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer w-full flex items-center justify-center uppercase tracking-wider"
                            >
                                <Search className="h-3.5 w-3.5" /> 
                                {loading ? (t("loading") || "Loading...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>

                    {/* Student Attendance Analytical Report Card & Table */}
                    <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                    <ClipboardList className="h-4 w-4" />
                                </span>
                                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    {t("student_attendance_report") || "Student Attendance Analytical Report"}
                                </h2>
                            </div>
                            {/* Legend badges */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    P: {t("present") || "Present"}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    L: {t("late") || "Late"}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    A: {t("absent") || "Absent"}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    H: {t("holiday") || "Holiday"}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    F: {t("half_day") || "Half Day"}
                                </span>
                            </div>
                        </div>

                        {/* Search and Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input 
                                    placeholder={t("search") || "Search"} 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="h-8 pl-8 text-[11px] w-full rounded-lg border-gray-200 shadow-none focus:ring-1 focus:ring-indigo-500" 
                                />
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 self-end sm:self-auto">
                                <Button onClick={() => handleExport('copy')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("copy") || "Copy"}><Copy className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('excel')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("excel") || "Excel"}><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('csv')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title="CSV"><FileBox className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('pdf')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("pdf") || "PDF"}><FileText className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('print')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("print") || "Print"}><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                        {/* Attendance Matrix Table */}
                        <div className="rounded-xl border border-gray-200/80 overflow-x-auto shadow-2xs">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50/75">
                                    <TableRow className="text-[10px] font-bold uppercase text-gray-600 border-b border-gray-200 hover:bg-gray-50/75">
                                        <TableHead className="py-2.5 px-3 sticky left-0 z-20 bg-gray-50 min-w-[140px] text-gray-700 font-bold border-r border-gray-200">
                                            {t("student_date") || "Student / Date"}
                                        </TableHead>
                                        <TableHead className="py-2.5 px-1.5 text-center font-bold text-gray-700 border-r border-gray-100 min-w-[42px]">
                                            (%)
                                        </TableHead>
                                        <TableHead className="py-2.5 px-1.5 text-center font-bold text-emerald-600 border-r border-gray-100 min-w-[30px]">
                                            P
                                        </TableHead>
                                        <TableHead className="py-2.5 px-1.5 text-center font-bold text-amber-600 border-r border-gray-100 min-w-[30px]">
                                            L
                                        </TableHead>
                                        <TableHead className="py-2.5 px-1.5 text-center font-bold text-red-600 border-r border-gray-100 min-w-[30px]">
                                            A
                                        </TableHead>
                                        <TableHead className="py-2.5 px-1.5 text-center font-bold text-blue-600 border-r border-gray-100 min-w-[30px]">
                                            H
                                        </TableHead>
                                        <TableHead className="py-2.5 px-1.5 text-center font-bold text-indigo-600 border-r-2 border-gray-200 min-w-[30px]">
                                            F
                                        </TableHead>
                                        {daysHeader.map((d, i) => (
                                            <TableHead key={i} className="py-2 px-1 text-center border-r border-gray-100 min-w-[32px] text-gray-700 font-bold text-[10px]">
                                                {toLocaleNumber(d.d, langCode)}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={7 + (daysHeader.length || 30)} />
                                    ) : attendanceData.length > 0 ? (
                                        attendanceData
                                            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map((s, i) => (
                                                <TableRow key={i} className="text-[11px] border-b border-gray-100 hover:bg-indigo-50/40 hover:shadow-xs transition-colors">
                                                    <TableCell className="py-2 px-3 font-semibold text-gray-800 sticky left-0 z-10 bg-white border-r border-gray-200">
                                                        {s.name}
                                                    </TableCell>
                                                    <TableCell className="py-2 px-1 text-center border-r border-gray-100">
                                                        <span className="inline-block bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded text-[8px]">
                                                            {toLocaleNumber(s.percentage, langCode)}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-2 px-1 text-center font-semibold text-emerald-600 border-r border-gray-100">
                                                        {toLocaleNumber(s.p, langCode)}
                                                    </TableCell>
                                                    <TableCell className="py-2 px-1 text-center font-semibold text-amber-600 border-r border-gray-100">
                                                        {toLocaleNumber(s.l, langCode)}
                                                    </TableCell>
                                                    <TableCell className="py-2 px-1 text-center font-semibold text-red-600 border-r border-gray-100">
                                                        {toLocaleNumber(s.a, langCode)}
                                                    </TableCell>
                                                    <TableCell className="py-2 px-1 text-center font-semibold text-blue-600 border-r border-gray-100">
                                                        {toLocaleNumber(s.h, langCode)}
                                                    </TableCell>
                                                    <TableCell className="py-2 px-1 text-center font-semibold text-indigo-600 border-r-2 border-gray-200">
                                                        {toLocaleNumber(s.f, langCode)}
                                                    </TableCell>
                                                    {s.grid.map((c, j) => (
                                                        <TableCell key={j} className={cn(
                                                            "py-2 px-1 text-center border-r border-gray-100 last:border-r-0 font-bold text-[10px]",
                                                            c === 'P' && "text-emerald-600 bg-emerald-50/30",
                                                            c === 'L' && "text-amber-600 bg-amber-50/30",
                                                            c === 'A' && "text-rose-600 bg-rose-50/30",
                                                            c === 'H' && "text-blue-600 bg-blue-50/30",
                                                            c === 'F' && "text-indigo-600 bg-indigo-50/30"
                                                        )}>
                                                            {c || "-"}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7 + (daysHeader.length || 30)} className="h-48 text-center py-10">
                                                <div className="flex flex-col items-center justify-center space-y-2 opacity-75">
                                                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200/60 shadow-inner">
                                                        <CalendarCheck className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                    <p className="text-gray-500 font-semibold text-xs">
                                                        {t("no_attendance_records_found") || "No attendance records found"}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400">
                                                        {t("choose_criteria_above_and_click_generate_report") || "Choose criteria above and click search"}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Footer with Translated Showing Entries and Localized Page Number */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                            <span>
                                {t("showing_entries_count") 
                                    ? t("showing_entries_count").replace("{count}", toLocaleNumber(attendanceData.length, langCode))
                                    : `Showing ${toLocaleNumber(attendanceData.length, langCode)} entries`}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200" disabled>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button className="h-7 px-2.5 text-[11px] font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:from-[#f59e0b] hover:to-[#818cf8] shadow-xs">
                                    {toLocaleNumber(1, langCode)}
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200" disabled>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Day Wise Tab */}
            {activeTab === "Student Day Wise Attendance Report" && (
                <div className="space-y-5">
                    <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                            <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                                <Filter className="h-4 w-4" />
                            </span>
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("select_criteria") || "Select Criteria"}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("class") || "Class"} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue placeholder={t("select") || "Select"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {translateClassName(c.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("section") || "Section"} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue placeholder={t("select") || "Select"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("select") || "Select"}</SelectItem>
                                        {filteredSections.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {translateSectionName(s.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("date") || "Date"} <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    type="date" 
                                    value={selectedDayWiseDate} 
                                    onChange={e => setSelectedDayWiseDate(e.target.value)}
                                    className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("source") || "Source"}
                                </Label>
                                <Select value={selectedSource} onValueChange={setSelectedSource}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">{t("all") || "All"}</SelectItem>
                                        <SelectItem value="Manual">{t("manual") || "Manual"}</SelectItem>
                                        <SelectItem value="Device">{t("device") || "Device"}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                onClick={handleDayWiseSearch} 
                                disabled={loading} 
                                className="h-9 px-5 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer w-full flex items-center justify-center uppercase tracking-wider"
                            >
                                <Search className="h-3.5 w-3.5" /> 
                                {loading ? (t("loading") || "Loading...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>

                    <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                <FileText className="h-4 w-4" />
                            </span>
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("student_day_wise_attendance_report") || "Student Day Wise Attendance Report"}
                            </h2>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input 
                                    placeholder={t("search") || "Search"} 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="h-8 pl-8 text-[11px] w-full rounded-lg border-gray-200 shadow-none focus:ring-1 focus:ring-indigo-500" 
                                />
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 self-end sm:self-auto">
                                <Button onClick={() => handleExport('copy')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("copy") || "Copy"}><Copy className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('excel')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("excel") || "Excel"}><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('csv')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title="CSV"><FileBox className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('pdf')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("pdf") || "PDF"}><FileText className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('print')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("print") || "Print"}><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-200/80 overflow-x-auto shadow-2xs">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50/75">
                                    <TableRow className="text-[10px] font-bold uppercase text-gray-600 border-b border-gray-200">
                                        <TableHead className="py-2.5 px-3">#</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("admission_no") || "Admission No"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("roll_number") || "Roll Number"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("name") || "Name"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("attendance") || "Attendance"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("date") || "Date"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("source") || "Source"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("ip_address") || "IP Address"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("agent") || "Agent"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("scan_location") || "Scan Location"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dayWiseData.length > 0 ? (
                                        dayWiseData.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((s, i) => (
                                            <TableRow key={i} className="text-[11px] border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="py-2.5 px-3 font-medium">{toLocaleNumber(i + 1, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3">{s.admission_no}</TableCell>
                                                <TableCell className="py-2.5 px-3">{toLocaleNumber(s.roll_no, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3 font-semibold text-indigo-600">{s.name}</TableCell>
                                                <TableCell className="py-2.5 px-3">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase shadow-2xs",
                                                        s.attendance === 'present' && "bg-emerald-500",
                                                        s.attendance === 'absent' && "bg-rose-500",
                                                        s.attendance === 'late' && "bg-amber-500",
                                                        s.attendance === 'half_day' && "bg-indigo-500",
                                                        s.attendance === 'holiday' && "bg-blue-500"
                                                    )}>
                                                        {s.attendance === 'present' ? (t("present") || "Present") :
                                                         s.attendance === 'absent' ? (t("absent") || "Absent") :
                                                         s.attendance === 'late' ? (t("late") || "Late") :
                                                         s.attendance === 'holiday' ? (t("holiday") || "Holiday") :
                                                         s.attendance === 'half_day' ? (t("half_day") || "Half Day") : s.attendance}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-2.5 px-3">{toLocaleNumber(s.date, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3">{s.source}</TableCell>
                                                <TableCell className="py-2.5 px-3">{s.ip_address}</TableCell>
                                                <TableCell className="py-2.5 px-3 truncate max-w-[100px]">{s.agent}</TableCell>
                                                <TableCell className="py-2.5 px-3">{s.scan_location}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-40 text-center py-8">
                                                <p className="text-gray-400 text-xs font-medium">
                                                    {t("no_attendance_records_found") || "No attendance records found"}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                            <span>
                                {t("showing_entries_count") 
                                    ? t("showing_entries_count").replace("{count}", toLocaleNumber(dayWiseData.length, langCode))
                                    : `Showing ${toLocaleNumber(dayWiseData.length, langCode)} entries`}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200" disabled><ChevronLeft className="h-3.5 w-3.5" /></Button>
                                <Button className="h-7 px-2.5 text-[11px] font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs">{toLocaleNumber(1, langCode)}</Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200" disabled><ChevronRight className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Attendance Type Report Tab */}
            {activeTab === "Student Attendance Type Report" && (
                <div className="space-y-5">
                    <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                            <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                                <Filter className="h-4 w-4" />
                            </span>
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("select_criteria") || "Select Criteria"}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("search_type") || "Search Type"}
                                </Label>
                                <Select value={searchType} onValueChange={setSearchType}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">{t("today") || "Today"}</SelectItem>
                                        <SelectItem value="this_week">{t("this_week") || "This Week"}</SelectItem>
                                        <SelectItem value="this_month">{t("this_month") || "This Month"}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("attendance_type") || "Attendance Type"} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={attendanceType} onValueChange={setAttendanceType}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="P">{t("present") || "Present"} (P)</SelectItem>
                                        <SelectItem value="A">{t("absent") || "Absent"} (A)</SelectItem>
                                        <SelectItem value="L">{t("late") || "Late"} (L)</SelectItem>
                                        <SelectItem value="H">{t("holiday") || "Holiday"} (H)</SelectItem>
                                        <SelectItem value="F">{t("half_day") || "Half Day"} (F)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("class") || "Class"} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue placeholder={t("select") || "Select"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {translateClassName(c.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("section") || "Section"}
                                </Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue placeholder={t("select") || "Select"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("select") || "Select"}</SelectItem>
                                        {sections.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {translateSectionName(s.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                onClick={handleAttendanceTypeSearch} 
                                disabled={loading} 
                                className="h-9 px-5 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer w-full flex items-center justify-center uppercase tracking-wider"
                            >
                                <Search className="h-3.5 w-3.5" /> 
                                {loading ? (t("loading") || "Loading...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>

                    <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                <FileText className="h-4 w-4" />
                            </span>
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("student_attendance_type_report") || "Student Attendance Type Report"}
                            </h2>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input 
                                    placeholder={t("search") || "Search"} 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="h-8 pl-8 text-[11px] w-full rounded-lg border-gray-200 shadow-none focus:ring-1 focus:ring-indigo-500" 
                                />
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 self-end sm:self-auto">
                                <Button onClick={() => handleExport('copy')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("copy") || "Copy"}><Copy className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('excel')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("excel") || "Excel"}><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('csv')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title="CSV"><FileBox className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('pdf')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("pdf") || "PDF"}><FileText className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('print')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("print") || "Print"}><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-200/80 overflow-x-auto shadow-2xs">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50/75">
                                    <TableRow className="text-[10px] font-bold uppercase text-gray-600 border-b border-gray-200">
                                        <TableHead className="py-2.5 px-3">{t("admission_no") || "Admission No"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("student_name") || "Student Name"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("class") || "Class"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("father_name") || "Father Name"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("date_of_birth") || "Date Of Birth"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("admission_date") || "Admission Date"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("gender") || "Gender"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("mobile_number") || "Mobile Number"}</TableHead>
                                        <TableHead className="py-2.5 px-3 text-right">{t("count") || "Count"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendanceTypeData.length > 0 ? (
                                        attendanceTypeData.filter(s => s.student_name.toLowerCase().includes(searchTerm.toLowerCase())).map((s, i) => (
                                            <TableRow key={i} className="text-[11px] border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="py-2.5 px-3">{s.admission_no}</TableCell>
                                                <TableCell className="py-2.5 px-3 font-semibold text-indigo-600">{s.student_name}</TableCell>
                                                <TableCell className="py-2.5 px-3">{s.class}</TableCell>
                                                <TableCell className="py-2.5 px-3">{s.father_name}</TableCell>
                                                <TableCell className="py-2.5 px-3">{toLocaleNumber(s.dob, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3">{toLocaleNumber(s.admission_date, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3">{s.gender}</TableCell>
                                                <TableCell className="py-2.5 px-3">{toLocaleNumber(s.mobile_number, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3 text-right font-bold text-gray-800">{toLocaleNumber(s.count, langCode)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-40 text-center py-8">
                                                <p className="text-gray-400 text-xs font-medium">
                                                    {t("no_attendance_records_found") || "No attendance records found"}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                            <span>
                                {t("showing_entries_count") 
                                    ? t("showing_entries_count").replace("{count}", toLocaleNumber(attendanceTypeData.length, langCode))
                                    : `Showing ${toLocaleNumber(attendanceTypeData.length, langCode)} entries`}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200" disabled><ChevronLeft className="h-3.5 w-3.5" /></Button>
                                <Button className="h-7 px-2.5 text-[11px] font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs">{toLocaleNumber(1, langCode)}</Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200" disabled><ChevronRight className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Day Wise Attendance Report */}
            {activeTab === "Staff Day Wise Attendance Report" && (
                <div className="space-y-5">
                    <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                            <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                                <Filter className="h-4 w-4" />
                            </span>
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("select_criteria") || "Select Criteria"}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("role") || "Role"}
                                </Label>
                                <Select value={selectedStaffRole} onValueChange={setSelectedStaffRole}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue placeholder={t("select") || "Select"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staffRoles.map(r => (
                                            <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("date") || "Date"}
                                </Label>
                                <Input 
                                    type="date" 
                                    value={selectedStaffDate} 
                                    onChange={e => setSelectedStaffDate(e.target.value)}
                                    className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("source") || "Source"}
                                </Label>
                                <Select value={selectedStaffSource} onValueChange={setSelectedStaffSource}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">{t("all") || "All"}</SelectItem>
                                        <SelectItem value="Manual">{t("manual") || "Manual"}</SelectItem>
                                        <SelectItem value="Device">{t("device") || "Device"}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                onClick={handleStaffDayWiseSearch} 
                                disabled={loading} 
                                className="h-9 px-5 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer w-full flex items-center justify-center uppercase tracking-wider"
                            >
                                <Search className="h-3.5 w-3.5" /> 
                                {loading ? (t("loading") || "Loading...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>

                    <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                <FileText className="h-4 w-4" />
                            </span>
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("staff_day_wise_attendance_report") || "Staff Day Wise Attendance Report"}
                            </h2>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input 
                                    placeholder={t("search") || "Search"} 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="h-8 pl-8 text-[11px] w-full rounded-lg border-gray-200 shadow-none focus:ring-1 focus:ring-indigo-500" 
                                />
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 self-end sm:self-auto">
                                <Button onClick={() => handleExport('copy')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("copy") || "Copy"}><Copy className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('excel')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("excel") || "Excel"}><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('csv')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title="CSV"><FileBox className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('pdf')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("pdf") || "PDF"}><FileText className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('print')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("print") || "Print"}><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-200/80 overflow-x-auto shadow-2xs">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50/75">
                                    <TableRow className="text-[10px] font-bold uppercase text-gray-600 border-b border-gray-200">
                                        <TableHead className="py-2.5 px-3">#</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("staff_id") || "Staff ID"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("role") || "Role"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("name") || "Name"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("attendance") || "Attendance"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("date") || "Date"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("source") || "Source"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("ip_address") || "IP Address"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("agent") || "Agent"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("scan_location") || "Scan Location"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staffDayWiseData.length > 0 ? (
                                        staffDayWiseData.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((s, i) => (
                                            <TableRow key={i} className="text-[11px] border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="py-2.5 px-3 font-medium">{toLocaleNumber(i + 1, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3">{s.staff_id}</TableCell>
                                                <TableCell className="py-2.5 px-3">{s.role}</TableCell>
                                                <TableCell className="py-2.5 px-3 font-semibold text-gray-800">{s.name}</TableCell>
                                                <TableCell className="py-2.5 px-3">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase shadow-2xs",
                                                        s.attendance === 'present' && "bg-emerald-500",
                                                        s.attendance === 'absent' && "bg-rose-500",
                                                        s.attendance === 'late' && "bg-amber-500",
                                                        s.attendance === 'half_day' && "bg-cyan-500",
                                                        s.attendance === 'half_day_second' && "bg-cyan-600",
                                                        s.attendance === 'holiday' && "bg-blue-500"
                                                    )}>
                                                        {s.attendance === 'present' ? (t("present") || "Present") :
                                                         s.attendance === 'absent' ? (t("absent") || "Absent") :
                                                         s.attendance === 'late' ? (t("late") || "Late") :
                                                         s.attendance === 'holiday' ? (t("holiday") || "Holiday") :
                                                         s.attendance === 'half_day' ? (t("half_day") || "Half Day") : s.attendance.replace(/_/g, ' ')}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-2.5 px-3">{toLocaleNumber(s.date, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3">{s.source}</TableCell>
                                                <TableCell className="py-2.5 px-3">{s.ip_address}</TableCell>
                                                <TableCell className="py-2.5 px-3 truncate max-w-[100px]">{s.agent}</TableCell>
                                                <TableCell className="py-2.5 px-3">{s.scan_location}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-40 text-center py-8">
                                                <p className="text-gray-400 text-xs font-medium">
                                                    {t("no_attendance_records_found") || "No attendance records found"}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                            <span>
                                {t("showing_entries_count") 
                                    ? t("showing_entries_count").replace("{count}", toLocaleNumber(staffDayWiseData.length, langCode))
                                    : `Showing ${toLocaleNumber(staffDayWiseData.length, langCode)} entries`}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200" disabled><ChevronLeft className="h-3.5 w-3.5" /></Button>
                                <Button className="h-7 px-2.5 text-[11px] font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs">{toLocaleNumber(1, langCode)}</Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200" disabled><ChevronRight className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Daily Attendance Report Tab */}
            {activeTab === "Daily Attendance Report" && (
                <div className="space-y-5">
                    <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                            <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                                <Filter className="h-4 w-4" />
                            </span>
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("select_criteria") || "Select Criteria"}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("date") || "Date"} <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    type="date" 
                                    value={selectedDate} 
                                    onChange={e => setSelectedDate(e.target.value)}
                                    className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30"
                                />
                            </div>
                            <Button 
                                onClick={handleDailySearch} 
                                disabled={loading} 
                                className="h-9 px-5 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer w-full flex items-center justify-center uppercase tracking-wider"
                            >
                                <Search className="h-3.5 w-3.5" /> 
                                {loading ? (t("loading") || "Loading...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>

                    <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                <FileText className="h-4 w-4" />
                            </span>
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("daily_attendance_report") || "Daily Attendance Report"}
                            </h2>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input 
                                    placeholder={t("search") || "Search"} 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="h-8 pl-8 text-[11px] w-full rounded-lg border-gray-200 shadow-none focus:ring-1 focus:ring-indigo-500" 
                                />
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 self-end sm:self-auto">
                                <Button onClick={() => handleExport('copy')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("copy") || "Copy"}><Copy className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('excel')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("excel") || "Excel"}><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('csv')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title="CSV"><FileBox className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('pdf')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("pdf") || "PDF"}><FileText className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('print')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("print") || "Print"}><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-200/80 overflow-hidden shadow-2xs">
                            <Table>
                                <TableHeader className="bg-gray-50/75">
                                    <TableRow className="text-[10px] font-bold uppercase text-gray-600 border-b border-gray-200">
                                        <TableHead className="py-2.5 px-3">{t("class_section") || "Class (Section)"}</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center">{t("total_present") || "Total Present"}</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center">{t("male_present") || "Male Present"}</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center">{t("female_present") || "Female Present"}</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center">{t("total_absent") || "Total Absent"}</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center">{t("male_absent") || "Male Absent"}</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center">{t("female_absent") || "Female Absent"}</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center text-emerald-600">{t("present_percentage") || "Present %"}</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center text-red-600">{t("absent_percentage") || "Absent %"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dailyReportData.length > 0 ? (
                                        dailyReportData.filter(r => r.class_section.toLowerCase().includes(searchTerm.toLowerCase())).map((r, i) => (
                                            <TableRow key={i} className="text-[11px] border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="py-2.5 px-3 font-semibold text-gray-800">{r.class_section}</TableCell>
                                                <TableCell className="py-2.5 px-3 text-center font-bold text-emerald-600">{toLocaleNumber(r.total_present, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3 text-center text-gray-500">{toLocaleNumber(r.male_present, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3 text-center text-gray-500">{toLocaleNumber(r.female_present, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3 text-center font-bold text-rose-500">{toLocaleNumber(r.total_absent, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3 text-center text-gray-500">{toLocaleNumber(r.male_absent, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3 text-center text-gray-500">{toLocaleNumber(r.female_absent, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3 text-center">
                                                    <span className="bg-emerald-500 text-white px-2 py-0.5 rounded font-bold text-[9px] shadow-2xs">{toLocaleNumber(r.present_percentage, langCode)}</span>
                                                </TableCell>
                                                <TableCell className="py-2.5 px-3 text-center">
                                                    <span className="bg-rose-500 text-white px-2 py-0.5 rounded font-bold text-[9px] shadow-2xs">{toLocaleNumber(r.absent_percentage, langCode)}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-40 text-center py-8">
                                                <p className="text-gray-400 text-xs font-medium">
                                                    {t("no_attendance_records_found") || "No attendance records found"}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                            <span>
                                {t("showing_entries_count") 
                                    ? t("showing_entries_count").replace("{count}", toLocaleNumber(dailyReportData.length, langCode))
                                    : `Showing ${toLocaleNumber(dailyReportData.length, langCode)} entries`}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200" disabled><ChevronLeft className="h-3.5 w-3.5" /></Button>
                                <Button className="h-7 px-2.5 text-[11px] font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs">{toLocaleNumber(1, langCode)}</Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200" disabled><ChevronRight className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Attendance Report */}
            {activeTab === "Staff Attendance Report" && (
                <div className="space-y-5">
                    <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                            <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                                <Filter className="h-4 w-4" />
                            </span>
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("select_criteria") || "Select Criteria"}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("role") || "Role"} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedStaffRole} onValueChange={setSelectedStaffRole}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue placeholder={t("select") || "Select"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {staffRoles.map(r => (
                                            <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("month") || "Month"} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue placeholder={t("select") || "Select"}>
                                            {getMonthLabel(selectedMonth)}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {monthList.map(m => (
                                            <SelectItem key={m.value} value={m.value}>
                                                {t(m.key) || m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("year") || "Year"} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                        <SelectValue placeholder={t("select") || "Select"}>
                                            {selectedYear ? toLocaleNumber(sessions.find(s => (s.session.match(/\d{4}/)?.[0] || s.session) === selectedYear)?.session || selectedYear, langCode) : (t("select") || "Select")}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sessions.map(s => {
                                            const y = s.session.match(/\d{4}/)?.[0] || s.session;
                                            return (
                                                <SelectItem key={s.id} value={y}>
                                                    {toLocaleNumber(s.session, langCode)}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                onClick={handleStaffAttendanceSearch} 
                                disabled={loading} 
                                className="h-9 px-5 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer w-full flex items-center justify-center uppercase tracking-wider"
                            >
                                <Search className="h-3.5 w-3.5" /> 
                                {loading ? (t("loading") || "Loading...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>

                    <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                    <ClipboardList className="h-4 w-4" />
                                </span>
                                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    {t("staff_attendance_report") || "Staff Attendance Report"}
                                </h2>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    P: {t("present") || "Present"}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    L: {t("late") || "Late"}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    A: {t("absent") || "Absent"}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    H: {t("holiday") || "Holiday"}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    F: {t("half_day") || "Half Day"}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input 
                                    placeholder={t("search") || "Search"} 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="h-8 pl-8 text-[11px] w-full rounded-lg border-gray-200 shadow-none focus:ring-1 focus:ring-indigo-500" 
                                />
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 self-end sm:self-auto">
                                <Button onClick={() => handleExport('copy')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("copy") || "Copy"}><Copy className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('excel')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("excel") || "Excel"}><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('csv')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title="CSV"><FileBox className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('pdf')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("pdf") || "PDF"}><FileText className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('print')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("print") || "Print"}><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200/80 overflow-x-auto shadow-2xs">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50/75">
                                    <TableRow className="text-[10px] font-bold uppercase text-gray-600 border-b border-gray-200">
                                        <TableHead className="py-2.5 px-3 sticky left-0 z-20 bg-gray-50 min-w-[140px] text-gray-700 font-bold border-r border-gray-200">
                                            {t("staff_date") || "Staff / Date"}
                                        </TableHead>
                                        <TableHead className="py-2.5 px-1.5 text-center font-bold text-gray-700 border-r border-gray-100 min-w-[42px]">(%)</TableHead>
                                        <TableHead className="py-2.5 px-1.5 text-center font-bold text-emerald-600 border-r border-gray-100 min-w-[30px]">P</TableHead>
                                        <TableHead className="py-2.5 px-1.5 text-center font-bold text-amber-600 border-r border-gray-100 min-w-[30px]">L</TableHead>
                                        <TableHead className="py-2.5 px-1.5 text-center font-bold text-red-600 border-r border-gray-100 min-w-[30px]">A</TableHead>
                                        <TableHead className="py-2.5 px-1.5 text-center font-bold text-blue-600 border-r border-gray-100 min-w-[30px]">H</TableHead>
                                        <TableHead className="py-2.5 px-1.5 text-center font-bold text-indigo-600 border-r-2 border-gray-200 min-w-[30px]">F</TableHead>
                                        {daysHeader.map((d, i) => (
                                            <TableHead key={i} className="py-2 px-1 text-center border-r border-gray-100 min-w-[32px] text-gray-700 font-bold text-[10px]">
                                                {toLocaleNumber(d.d, langCode)}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staffAttendanceData.length > 0 ? (
                                        staffAttendanceData.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((s, i) => (
                                            <TableRow key={i} className="text-[11px] border-b border-gray-100 hover:bg-indigo-50/40 hover:shadow-xs transition-colors">
                                                <TableCell className="py-2 px-3 font-semibold text-gray-800 sticky left-0 z-10 bg-white border-r border-gray-200">{s.name}</TableCell>
                                                <TableCell className="py-2 px-1 text-center border-r border-gray-100">
                                                    <span className="inline-block bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded text-[8px] shadow-2xs">
                                                        {toLocaleNumber(s.percentage, langCode)}%
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-2 px-1 text-center font-semibold text-emerald-600 border-r border-gray-100">{toLocaleNumber(s.p, langCode)}</TableCell>
                                                <TableCell className="py-2 px-1 text-center font-semibold text-amber-600 border-r border-gray-100">{toLocaleNumber(s.l, langCode)}</TableCell>
                                                <TableCell className="py-2 px-1 text-center font-semibold text-red-600 border-r border-gray-100">{toLocaleNumber(s.a, langCode)}</TableCell>
                                                <TableCell className="py-2 px-1 text-center font-semibold text-blue-600 border-r border-gray-100">{toLocaleNumber(s.h, langCode)}</TableCell>
                                                <TableCell className="py-2 px-1 text-center font-semibold text-indigo-600 border-r-2 border-gray-200">{toLocaleNumber(s.f, langCode)}</TableCell>
                                                {s.grid.map((c: string, j: number) => (
                                                    <TableCell key={j} className={cn("py-2 px-1 text-center border-r border-gray-100 last:border-r-0 font-bold text-[10px]", 
                                                        c==='P' && "text-emerald-600 bg-emerald-50/30",
                                                        c==='L' && "text-amber-600 bg-amber-50/30",
                                                        c==='A' && "text-rose-600 bg-rose-50/30",
                                                        c==='H' && "text-blue-600 bg-blue-50/30",
                                                        c==='F' && "text-indigo-600 bg-indigo-50/30"
                                                    )}>{c || "-"}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7 + (daysHeader.length || 30)} className="h-40 text-center py-8">
                                                <p className="text-gray-400 text-xs font-medium">
                                                    {t("no_attendance_records_found") || "No attendance records found"}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                            <span>
                                {t("showing_entries_count") 
                                    ? t("showing_entries_count").replace("{count}", toLocaleNumber(staffAttendanceData.length, langCode))
                                    : `Showing ${toLocaleNumber(staffAttendanceData.length, langCode)} entries`}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200" disabled><ChevronLeft className="h-3.5 w-3.5" /></Button>
                                <Button className="h-7 px-2.5 text-[11px] font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs">{toLocaleNumber(1, langCode)}</Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200" disabled><ChevronRight className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Biometric Attendance Log */}
            {activeTab === "Biometric Attendance Log" && (
                <div className="space-y-5">
                    <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                            <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                                <Filter className="h-4 w-4" />
                            </span>
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("select_criteria") || "Select Criteria"}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("date") || "Date"}
                                </Label>
                                <Input 
                                    type="date" 
                                    value={selectedBiometricDate} 
                                    onChange={e => setSelectedBiometricDate(e.target.value)}
                                    className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30"
                                />
                            </div>
                            <Button 
                                onClick={handleBiometricSearch}
                                disabled={loading}
                                className="h-9 px-5 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer w-full flex items-center justify-center uppercase tracking-wider"
                            >
                                <Search className="h-3.5 w-3.5" /> 
                                {loading ? (t("loading") || "Loading...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>

                    <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                                <FileText className="h-4 w-4" />
                            </span>
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {t("biometric_attendance_log") || "Biometric Attendance"}
                            </h2>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input 
                                    placeholder={t("search") || "Search"} 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="h-8 pl-8 text-[11px] w-full rounded-lg border-gray-200 shadow-none focus:ring-1 focus:ring-indigo-500" 
                                />
                            </div>
                            <div className="flex items-center gap-1 text-gray-500 self-end sm:self-auto">
                                <Button onClick={() => handleExport('copy')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("copy") || "Copy"}><Copy className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('excel')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("excel") || "Excel"}><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('csv')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title="CSV"><FileBox className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('pdf')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("pdf") || "PDF"}><FileText className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('print')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("print") || "Print"}><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-200/80 overflow-hidden shadow-2xs">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50/75">
                                    <TableRow className="text-[10px] font-bold uppercase text-gray-600 border-b border-gray-200">
                                        <TableHead className="py-2.5 px-3">{t("admission_no") || "Admission No"}</TableHead>
                                        <TableHead className="py-2.5 px-3">{t("student_name") || "Student Name"}</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center">{t("punch_in") || "Punch In"}</TableHead>
                                        <TableHead className="py-2.5 px-3 text-center">{t("device_serial_number") || "Device Serial Number"}</TableHead>
                                        <TableHead className="py-2.5 px-3 text-right">{t("ip_address") || "IP Address"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {biometricData.length > 0 ? (
                                        biometricData.filter(row => 
                                            row.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            row.admission_no.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map((row, i) => (
                                            <TableRow key={i} className="text-[11px] border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="py-2.5 px-3">{row.admission_no}</TableCell>
                                                <TableCell className="py-2.5 px-3 font-semibold text-indigo-600">{row.student_name}</TableCell>
                                                <TableCell className="py-2.5 px-3 text-center">{toLocaleNumber(row.punch_in, langCode)}</TableCell>
                                                <TableCell className="py-2.5 px-3 text-center">{row.device_serial}</TableCell>
                                                <TableCell className="py-2.5 px-3 text-right">{row.ip_address}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48">
                                                <div className="flex flex-col items-center justify-center space-y-2 py-8">
                                                    <p className="text-gray-400 text-xs font-medium">{t("no_attendance_records_found") || "No data available in table"}</p>
                                                    <div className="relative">
                                                        <FolderOpen className="h-16 w-16 text-gray-200" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                            <span>
                                {t("showing_entries_count") 
                                    ? t("showing_entries_count").replace("{count}", toLocaleNumber(biometricData.length, langCode))
                                    : `Showing ${toLocaleNumber(biometricData.length, langCode)} entries`}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200" disabled><ChevronLeft className="h-3.5 w-3.5" /></Button>
                                <Button className="h-7 px-2.5 text-[11px] font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs">{toLocaleNumber(1, langCode)}</Button>
                                <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200" disabled><ChevronRight className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
