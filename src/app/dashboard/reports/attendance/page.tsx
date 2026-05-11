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
    Users,
    CalendarCheck,
    ClipboardList,
    UserCheck,
    CalendarDays,
    Copy,
    FileSpreadsheet,
    FileBox,
    Printer,
    Columns,
    Columns2,
    FolderOpen,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const reportLinks = [
    { name: "Attendance Report", icon: FileText },
    { name: "Student Attendance Type Report", icon: FileText },
    { name: "Daily Attendance Report", icon: FileText },
    { name: "Student Day Wise Attendance Report", icon: FileText },
    { name: "Staff Day Wise Attendance Report", icon: FileText },
    { name: "Staff Attendance Report", icon: FileText },
    { name: "Biometric Attendance Log", icon: FileText },
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
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Attendance Report</h1>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-2">
                    {reportLinks.map((link) => {
                        const isActive = activeTab === link.name;
                        return (
                            <div 
                                key={link.name}
                                onClick={() => setActiveTab(link.name)}
                                className={cn(
                                    "flex items-center gap-3 p-2 px-3 rounded cursor-pointer group transition-colors",
                                    isActive 
                                        ? "bg-gray-100" 
                                        : "hover:bg-gray-50"
                                )}
                            >
                                <link.icon className="h-4 w-4 text-gray-500" />
                                <span className={cn(
                                    "text-[11px] font-bold text-gray-600",
                                    isActive && "text-gray-900"
                                )}>
                                    {link.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Attendance Report Tab */}
            {activeTab === "Attendance Report" && (
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section <span className="text-red-500">*</span></Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{filteredSections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Month <span className="text-red-500">*</span></Label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].map(m => (
                                            <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Year <span className="text-red-500">*</span></Label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {sessions.map(s => {
                                            const y = s.session.match(/\d{4}/)?.[0] || s.session;
                                            return <SelectItem key={s.id} value={y}>{s.session}</SelectItem>;
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                onClick={handleSearch} 
                                disabled={loading} 
                                variant="gradient"
                                className="h-9 px-10 text-[11px] uppercase tracking-wider min-w-[140px]"
                            >
                                <Search className="h-4 w-4 mr-1.5" /> 
                                {loading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Student Attendance Report</h2>
                            <div className="flex gap-2 text-[9px] font-bold text-gray-400">
                                <span className="text-emerald-500">P</span> <span className="text-amber-500">L</span> <span className="text-red-500">A</span> <span className="text-blue-500">H</span> <span className="text-indigo-500">F</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center gap-4">
                            <Input placeholder="Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-8 text-[11px] w-64 rounded shadow-none" />
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button onClick={() => handleExport('copy')} variant="ghost" size="icon" className="h-7 w-7 rounded"><Copy className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('excel')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('csv')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileBox className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('pdf')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileText className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('print')} variant="ghost" size="icon" className="h-7 w-7 rounded"><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                        <div className="rounded border border-gray-100 overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2 px-3 sticky left-0 bg-gray-50 min-w-[120px]">Student / Date</TableHead>
                                        <TableHead className="py-2 px-1 text-center">(%)</TableHead>
                                        <TableHead className="py-2 px-1 text-center text-emerald-600">P</TableHead>
                                        <TableHead className="py-2 px-1 text-center text-amber-600">L</TableHead>
                                        <TableHead className="py-2 px-1 text-center text-red-600">A</TableHead>
                                        <TableHead className="py-2 px-1 text-center text-blue-600">H</TableHead>
                                        <TableHead className="py-2 px-1 text-center text-indigo-600 border-r border-gray-100">F</TableHead>
                                        {daysHeader.map((d, i) => <TableHead key={i} className="py-2 px-1 text-center border-r border-gray-100 min-w-[30px]">{d.d}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendanceData.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((s, i) => (
                                        <TableRow key={i} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="py-2 px-3 font-medium text-indigo-600 sticky left-0 bg-white">{s.name}</TableCell>
                                            <TableCell className="py-2 px-1 text-center"><span className="bg-emerald-500 text-white px-1 rounded text-[8px]">{s.percentage}</span></TableCell>
                                            <TableCell className="py-2 px-1 text-center">{s.p}</TableCell>
                                            <TableCell className="py-2 px-1 text-center">{s.l}</TableCell>
                                            <TableCell className="py-2 px-1 text-center">{s.a}</TableCell>
                                            <TableCell className="py-2 px-1 text-center">{s.h}</TableCell>
                                            <TableCell className="py-2 px-1 text-center border-r border-gray-100">{s.f}</TableCell>
                                            {s.grid.map((c, j) => (
                                                <TableCell key={j} className={cn("py-2 px-1 text-center border-r border-gray-100 last:border-r-0 font-bold", 
                                                    c==='P' && "text-emerald-500", c==='L' && "text-amber-500", c==='A' && "text-red-500", c==='H' && "text-blue-500", c==='F' && "text-indigo-500"
                                                )}>{c}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] text-gray-500">Showing {attendanceData.length} entries</span>
                            <div className="flex gap-1">
                                <Button variant="pagination-inactive" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="pagination-active" className="h-7 w-7 text-[10px]">1</Button>
                                <Button variant="pagination-inactive" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Day Wise Tab */}
            {activeTab === "Student Day Wise Attendance Report" && (
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none focus:ring-primary"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section <span className="text-red-500">*</span></Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none focus:ring-primary"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select</SelectItem>
                                        {filteredSections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="date" 
                                    value={selectedDayWiseDate} 
                                    onChange={e => setSelectedDayWiseDate(e.target.value)}
                                    className="h-8 border-gray-200 text-[11px] rounded shadow-none focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Source</Label>
                                <Select value={selectedSource} onValueChange={setSelectedSource}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none focus:ring-primary"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All</SelectItem>
                                        <SelectItem value="Manual">Manual</SelectItem>
                                        <SelectItem value="Device">Device</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                onClick={handleDayWiseSearch} 
                                disabled={loading} 
                                variant="gradient"
                                className="h-9 px-10 text-[11px] uppercase tracking-wider min-w-[140px]"
                            >
                                <Search className="h-4 w-4 mr-1.5" /> 
                                {loading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Student Day Wise Attendance Report</h2>
                        <div className="flex justify-between items-center gap-4">
                            <Input placeholder="Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-8 text-[11px] w-64 rounded shadow-none" />
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 text-gray-600 font-bold text-[11px]">
                                    <Select defaultValue="50">
                                        <SelectTrigger className="h-7 w-16 text-[10px] border-none shadow-none focus:ring-0">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400 border-l pl-2">
                                    <Button onClick={() => handleExport('copy')} variant="ghost" size="icon" className="h-7 w-7 rounded"><Copy className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('excel')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('csv')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileBox className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('pdf')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileText className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('print')} variant="ghost" size="icon" className="h-7 w-7 rounded"><Printer className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded"><Columns className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        </div>
                        <div className="rounded border border-gray-100 overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2 px-3">#</TableHead>
                                        <TableHead className="py-2 px-3">Admission No</TableHead>
                                        <TableHead className="py-2 px-3">Roll Number</TableHead>
                                        <TableHead className="py-2 px-3">Name</TableHead>
                                        <TableHead className="py-2 px-3">Attendance</TableHead>
                                        <TableHead className="py-2 px-3">Date</TableHead>
                                        <TableHead className="py-2 px-3">Source</TableHead>
                                        <TableHead className="py-2 px-3">IP Address</TableHead>
                                        <TableHead className="py-2 px-3">Agent</TableHead>
                                        <TableHead className="py-2 px-3">Scan Location</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dayWiseData.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((s, i) => (
                                        <TableRow key={i} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50">
                                            <TableCell className="py-2 px-3">{i + 1}</TableCell>
                                            <TableCell className="py-2 px-3">{s.admission_no}</TableCell>
                                            <TableCell className="py-2 px-3">{s.roll_no}</TableCell>
                                            <TableCell className="py-2 px-3 font-medium text-indigo-600">{s.name}</TableCell>
                                            <TableCell className="py-2 px-3">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase",
                                                    s.attendance === 'present' && "bg-emerald-500",
                                                    s.attendance === 'absent' && "bg-red-500",
                                                    s.attendance === 'late' && "bg-amber-500",
                                                    s.attendance === 'half_day' && "bg-cyan-500",
                                                    s.attendance === 'holiday' && "bg-blue-500"
                                                )}>
                                                    {s.attendance}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">{s.date}</TableCell>
                                            <TableCell className="py-2 px-3">{s.source}</TableCell>
                                            <TableCell className="py-2 px-3">{s.ip_address}</TableCell>
                                            <TableCell className="py-2 px-3 truncate max-w-[100px]">{s.agent}</TableCell>
                                            <TableCell className="py-2 px-3">{s.scan_location}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] text-gray-500">Showing {dayWiseData.length} entries</span>
                            <div className="flex gap-1">
                                <Button variant="pagination-inactive" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="pagination-active" className="h-7 w-7 text-[10px]">1</Button>
                                <Button variant="pagination-inactive" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Attendance Type Report Tab */}
            {activeTab === "Student Attendance Type Report" && (
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type</Label>
                                <Select value={searchType} onValueChange={setSearchType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="this_week">This Week</SelectItem>
                                        <SelectItem value="this_month">This Month</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Attendance Type <span className="text-red-500">*</span></Label>
                                <Select value={attendanceType} onValueChange={setAttendanceType}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="P">Present (P)</SelectItem>
                                        <SelectItem value="A">Absent (A)</SelectItem>
                                        <SelectItem value="L">Late (L)</SelectItem>
                                        <SelectItem value="H">Holiday (H)</SelectItem>
                                        <SelectItem value="F">Half Day (F)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none focus:ring-primary"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                                <Select value={selectedSection} onValueChange={setSelectedSection}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none focus:ring-primary"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Select</SelectItem>
                                        {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                onClick={handleAttendanceTypeSearch} 
                                disabled={loading} 
                                variant="gradient"
                                className="h-9 px-10 text-[11px] uppercase tracking-wider min-w-[140px]"
                            >
                                <Search className="h-4 w-4 mr-1.5" /> 
                                {loading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Student Attendance Type Report</h2>
                        <div className="flex justify-between items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Input placeholder="Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-8 text-[11px] w-64 rounded shadow-none" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button onClick={() => handleExport('copy')} variant="ghost" size="icon" className="h-7 w-7 rounded"><Copy className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('excel')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('csv')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileBox className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('pdf')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileText className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('print')} variant="ghost" size="icon" className="h-7 w-7 rounded"><Printer className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        </div>
                        <div className="rounded border border-gray-100 overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2 px-3">Admission No</TableHead>
                                        <TableHead className="py-2 px-3">Student Name</TableHead>
                                        <TableHead className="py-2 px-3">Class</TableHead>
                                        <TableHead className="py-2 px-3">Father Name</TableHead>
                                        <TableHead className="py-2 px-3">Date Of Birth</TableHead>
                                        <TableHead className="py-2 px-3">Admission Date</TableHead>
                                        <TableHead className="py-2 px-3">Gender</TableHead>
                                        <TableHead className="py-2 px-3">Mobile Number</TableHead>
                                        <TableHead className="py-2 px-3 text-right">Count</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendanceTypeData.filter(s => s.student_name.toLowerCase().includes(searchTerm.toLowerCase())).map((s, i) => (
                                        <TableRow key={i} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50">
                                            <TableCell className="py-2 px-3">{s.admission_no}</TableCell>
                                            <TableCell className="py-2 px-3 font-medium text-indigo-600">{s.student_name}</TableCell>
                                            <TableCell className="py-2 px-3">{s.class}</TableCell>
                                            <TableCell className="py-2 px-3">{s.father_name}</TableCell>
                                            <TableCell className="py-2 px-3">{s.dob}</TableCell>
                                            <TableCell className="py-2 px-3">{s.admission_date}</TableCell>
                                            <TableCell className="py-2 px-3">{s.gender}</TableCell>
                                            <TableCell className="py-2 px-3">{s.mobile_number}</TableCell>
                                            <TableCell className="py-2 px-3 text-right font-bold text-gray-700">{s.count}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] text-gray-500">Showing {attendanceTypeData.length} entries</span>
                            <div className="flex gap-1">
                                <Button variant="pagination-inactive" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="pagination-active" className="h-7 w-7 text-[10px]">1</Button>
                                <Button variant="pagination-inactive" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Day Wise Attendance Report */}
            {activeTab === "Staff Day Wise Attendance Report" && (
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Role</Label>
                                <Select value={selectedStaffRole} onValueChange={setSelectedStaffRole}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{staffRoles.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Date</Label>
                                <Input 
                                    type="date" 
                                    value={selectedStaffDate} 
                                    onChange={e => setSelectedStaffDate(e.target.value)}
                                    className="h-8 border-gray-200 text-[11px] rounded shadow-none focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Source</Label>
                                <Select value={selectedStaffSource} onValueChange={setSelectedStaffSource}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All</SelectItem>
                                        <SelectItem value="Manual">Manual</SelectItem>
                                        <SelectItem value="Device">Device</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                onClick={handleStaffDayWiseSearch} 
                                disabled={loading} 
                                variant="gradient"
                                className="h-9 px-10 text-[11px] uppercase tracking-wider min-w-[140px]"
                            >
                                <Search className="h-4 w-4 mr-1.5" /> 
                                {loading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Staff Day Wise Attendance Report</h2>
                        <div className="flex justify-between items-center gap-4">
                            <Input placeholder="Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-8 text-[11px] w-64 rounded shadow-none" />
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button onClick={() => handleExport('copy')} variant="ghost" size="icon" className="h-7 w-7 rounded"><Copy className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('excel')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('csv')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileBox className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('pdf')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileText className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('print')} variant="ghost" size="icon" className="h-7 w-7 rounded"><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>
                        <div className="rounded border border-gray-100 overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2 px-3">#</TableHead>
                                        <TableHead className="py-2 px-3">Staff ID</TableHead>
                                        <TableHead className="py-2 px-3">Role</TableHead>
                                        <TableHead className="py-2 px-3">Name</TableHead>
                                        <TableHead className="py-2 px-3">Attendance</TableHead>
                                        <TableHead className="py-2 px-3">Date</TableHead>
                                        <TableHead className="py-2 px-3">Source</TableHead>
                                        <TableHead className="py-2 px-3">IP Address</TableHead>
                                        <TableHead className="py-2 px-3">Agent</TableHead>
                                        <TableHead className="py-2 px-3">Scan Location</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staffDayWiseData.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((s, i) => (
                                        <TableRow key={i} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50">
                                            <TableCell className="py-2 px-3">{i + 1}</TableCell>
                                            <TableCell className="py-2 px-3">{s.staff_id}</TableCell>
                                            <TableCell className="py-2 px-3">{s.role}</TableCell>
                                            <TableCell className="py-2 px-3 font-medium">{s.name}</TableCell>
                                            <TableCell className="py-2 px-3">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase",
                                                    s.attendance === 'present' && "bg-emerald-500",
                                                    s.attendance === 'absent' && "bg-red-500",
                                                    s.attendance === 'late' && "bg-amber-500",
                                                    s.attendance === 'half_day' && "bg-cyan-500",
                                                    s.attendance === 'half_day_second' && "bg-cyan-600",
                                                    s.attendance === 'holiday' && "bg-blue-500"
                                                )}>
                                                    {s.attendance.replace(/_/g, ' ')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2 px-3">{s.date}</TableCell>
                                            <TableCell className="py-2 px-3">{s.source}</TableCell>
                                            <TableCell className="py-2 px-3">{s.ip_address}</TableCell>
                                            <TableCell className="py-2 px-3 truncate max-w-[100px]">{s.agent}</TableCell>
                                            <TableCell className="py-2 px-3">{s.scan_location}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] text-gray-500">Showing {staffDayWiseData.length} entries</span>
                            <div className="flex gap-1">
                                <Button variant="pagination-inactive" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="pagination-active" className="h-7 w-7 text-[10px]">1</Button>
                                <Button variant="pagination-inactive" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Daily Attendance Report Tab */}
            {activeTab === "Daily Attendance Report" && (
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="date" 
                                    value={selectedDate} 
                                    onChange={e => setSelectedDate(e.target.value)}
                                    className="h-8 border-gray-200 text-[11px] rounded shadow-none focus:ring-primary"
                                />
                            </div>
                            <Button 
                                onClick={handleDailySearch} 
                                disabled={loading} 
                                variant="gradient"
                                className="h-9 px-10 text-[11px] uppercase tracking-wider min-w-[140px]"
                            >
                                <Search className="h-4 w-4 mr-1.5" /> 
                                {loading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Daily Attendance Report</h2>
                        <div className="flex justify-between items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Input placeholder="Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-8 text-[11px] w-64 rounded shadow-none" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button onClick={() => handleExport('copy')} variant="ghost" size="icon" className="h-7 w-7 rounded"><Copy className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('excel')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('csv')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileBox className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('pdf')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileText className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('print')} variant="ghost" size="icon" className="h-7 w-7 rounded"><Printer className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        </div>
                        <div className="rounded border border-gray-100 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="text-[9px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2 px-2">Class (Section)</TableHead>
                                        <TableHead className="py-2 px-2 text-center">Total Present</TableHead>
                                        <TableHead className="py-2 px-2 text-center">Male Present</TableHead>
                                        <TableHead className="py-2 px-2 text-center">Female Present</TableHead>
                                        <TableHead className="py-2 px-2 text-center">Total Absent</TableHead>
                                        <TableHead className="py-2 px-2 text-center">Male Absent</TableHead>
                                        <TableHead className="py-2 px-2 text-center">Female Absent</TableHead>
                                        <TableHead className="py-2 px-2 text-center text-emerald-600">Present %</TableHead>
                                        <TableHead className="py-2 px-2 text-center text-red-600">Absent %</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dailyReportData.filter(r => r.class_section.toLowerCase().includes(searchTerm.toLowerCase())).map((r, i) => (
                                        <TableRow key={i} className="text-[10px] border-b border-gray-50 hover:bg-gray-50/50">
                                            <TableCell className="py-2 px-2 font-medium text-gray-700">{r.class_section}</TableCell>
                                            <TableCell className="py-2 px-2 text-center font-bold text-emerald-600">{r.total_present}</TableCell>
                                            <TableCell className="py-2 px-2 text-center text-gray-500">{r.male_present}</TableCell>
                                            <TableCell className="py-2 px-2 text-center text-gray-500">{r.female_present}</TableCell>
                                            <TableCell className="py-2 px-2 text-center font-bold text-red-500">{r.total_absent}</TableCell>
                                            <TableCell className="py-2 px-2 text-center text-gray-500">{r.male_absent}</TableCell>
                                            <TableCell className="py-2 px-2 text-center text-gray-500">{r.female_absent}</TableCell>
                                            <TableCell className="py-2 px-2 text-center">
                                                <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded-sm font-bold text-[8px]">{r.present_percentage}</span>
                                            </TableCell>
                                            <TableCell className="py-2 px-2 text-center">
                                                <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-sm font-bold text-[8px]">{r.absent_percentage}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] text-gray-500">Showing {dailyReportData.length} entries</span>
                            <div className="flex gap-1">
                                <Button variant="pagination-inactive" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="pagination-active" className="h-7 w-7 text-[10px]">1</Button>
                                <Button variant="pagination-inactive" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Attendance Report */}
            {activeTab === "Staff Attendance Report" && (
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Role <span className="text-red-500">*</span></Label>
                                <Select value={selectedStaffRole} onValueChange={setSelectedStaffRole}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>{staffRoles.map(r => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Month <span className="text-red-500">*</span></Label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].map(m => (
                                            <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Year <span className="text-red-500">*</span></Label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] rounded shadow-none"><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {sessions.map(s => {
                                            const y = s.session.match(/\d{4}/)?.[0] || s.session;
                                            return <SelectItem key={s.id} value={y}>{s.session}</SelectItem>;
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                onClick={handleStaffAttendanceSearch} 
                                disabled={loading} 
                                variant="gradient"
                                className="h-9 px-10 text-[11px] uppercase tracking-wider min-w-[140px]"
                            >
                                <Search className="h-4 w-4 mr-1.5" /> 
                                {loading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Staff Attendance Report</h2>
                            <div className="flex gap-2 text-[9px] font-bold text-gray-400">
                                <span className="text-emerald-500">P</span> <span className="text-amber-500">L</span> <span className="text-red-500">A</span> <span className="text-blue-500">H</span> <span className="text-indigo-500">F</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center gap-4">
                            <Input placeholder="Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-8 text-[11px] w-64 rounded shadow-none" />
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button onClick={() => handleExport('copy')} variant="ghost" size="icon" className="h-7 w-7 rounded"><Copy className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('excel')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('csv')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileBox className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('pdf')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileText className="h-3.5 w-3.5" /></Button>
                                <Button onClick={() => handleExport('print')} variant="ghost" size="icon" className="h-7 w-7 rounded"><Printer className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                        <div className="rounded border border-gray-100 overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2 px-3 sticky left-0 bg-gray-50 min-w-[120px]">Staff / Date</TableHead>
                                        <TableHead className="py-2 px-1 text-center">(%)</TableHead>
                                        <TableHead className="py-2 px-1 text-center text-emerald-600">P</TableHead>
                                        <TableHead className="py-2 px-1 text-center text-amber-600">L</TableHead>
                                        <TableHead className="py-2 px-1 text-center text-red-600">A</TableHead>
                                        <TableHead className="py-2 px-1 text-center text-blue-600">H</TableHead>
                                        <TableHead className="py-2 px-1 text-center text-indigo-600 border-r border-gray-100">F</TableHead>
                                        {daysHeader.map((d, i) => <TableHead key={i} className="py-2 px-1 text-center border-r border-gray-100 min-w-[30px]">{d.d}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staffAttendanceData.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((s, i) => (
                                        <TableRow key={i} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="py-2 px-3 font-medium text-indigo-600 sticky left-0 bg-white">{s.name}</TableCell>
                                            <TableCell className="py-2 px-1 text-center"><span className="bg-emerald-500 text-white px-1 rounded text-[8px]">{s.percentage}</span></TableCell>
                                            <TableCell className="py-2 px-1 text-center">{s.p}</TableCell>
                                            <TableCell className="py-2 px-1 text-center">{s.l}</TableCell>
                                            <TableCell className="py-2 px-1 text-center">{s.a}</TableCell>
                                            <TableCell className="py-2 px-1 text-center">{s.h}</TableCell>
                                            <TableCell className="py-2 px-1 text-center border-r border-gray-100">{s.f}</TableCell>
                                            {s.grid.map((c: string, j: number) => (
                                                <TableCell key={j} className={cn("py-2 px-1 text-center border-r border-gray-100 last:border-r-0 font-bold", 
                                                    c==='P' && "text-emerald-500", c==='L' && "text-amber-500", c==='A' && "text-red-500", c==='H' && "text-blue-500", c==='F' && "text-indigo-500"
                                                )}>{c}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] text-gray-500">Showing {staffAttendanceData.length} entries</span>
                            <div className="flex gap-1">
                                <Button variant="pagination-inactive" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="pagination-active" className="h-7 w-7 text-[10px]">1</Button>
                                <Button variant="pagination-inactive" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Biometric Attendance Log */}
            {activeTab === "Biometric Attendance Log" && (
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Date</Label>
                                <Input 
                                    type="date" 
                                    value={selectedBiometricDate} 
                                    onChange={e => setSelectedBiometricDate(e.target.value)}
                                    className="h-8 border-gray-200 text-[11px] rounded shadow-none focus:ring-primary"
                                />
                            </div>
                            <Button 
                                onClick={handleBiometricSearch}
                                disabled={loading}
                                variant="gradient"
                                className="h-9 px-10 text-[11px] uppercase tracking-wider min-w-[140px]"
                            >
                                <Search className="h-4 w-4 mr-1.5" /> 
                                {loading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Biometric Attendance</h2>
                        <div className="flex justify-between items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Input 
                                    placeholder="Search" 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="h-8 text-[11px] w-64 rounded shadow-none" 
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Select defaultValue="50">
                                    <SelectTrigger className="h-8 w-16 text-[11px] border-gray-200 rounded shadow-none">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1 text-gray-400 border-l pl-2 border-gray-100 ml-2">
                                    <Button onClick={() => handleExport('copy')} variant="ghost" size="icon" className="h-7 w-7 rounded"><Copy className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('excel')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('csv')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileBox className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('pdf')} variant="ghost" size="icon" className="h-7 w-7 rounded"><FileText className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('print')} variant="ghost" size="icon" className="h-7 w-7 rounded"><Printer className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded"><Columns2 className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        </div>
                        <div className="rounded border border-gray-100 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2 px-3">Admission No</TableHead>
                                        <TableHead className="py-2 px-3">Student Name</TableHead>
                                        <TableHead className="py-2 px-3 text-center">Punch In</TableHead>
                                        <TableHead className="py-2 px-3 text-center">Device Serial Number</TableHead>
                                        <TableHead className="py-2 px-3 text-right">IP Address</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {biometricData.length > 0 ? (
                                        biometricData.filter(row => 
                                            row.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            row.admission_no.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map((row, i) => (
                                            <TableRow key={i} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50">
                                                <TableCell className="py-2 px-3">{row.admission_no}</TableCell>
                                                <TableCell className="py-2 px-3 font-medium text-indigo-600">{row.student_name}</TableCell>
                                                <TableCell className="py-2 px-3 text-center">{row.punch_in}</TableCell>
                                                <TableCell className="py-2 px-3 text-center">{row.device_serial}</TableCell>
                                                <TableCell className="py-2 px-3 text-right">{row.ip_address}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-64">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <p className="text-red-400 text-[11px] font-medium">No data available in table</p>
                                                    <div className="relative">
                                                        <FolderOpen className="h-24 w-24 text-gray-100" />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="space-y-1">
                                                                <div className="h-8 w-6 bg-white border border-gray-200 rounded-sm transform -rotate-6"></div>
                                                                <div className="h-8 w-6 bg-white border border-gray-200 rounded-sm absolute top-0 left-2 transform rotate-6 shadow-sm"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={handleBiometricSearch}
                                                        className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 flex items-center transition-colors"
                                                    >
                                                        <span className="mr-1">⬅</span> Add new record or search with different criteria.
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-[10px] text-gray-500">Showing {biometricData.length} to {biometricData.length} of {biometricData.length} entries</span>
                            <div className="flex gap-1">
                                <Button variant="pagination-inactive" size="icon" className="h-7 w-7"><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="pagination-inactive" size="icon" className="h-7 w-7"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
