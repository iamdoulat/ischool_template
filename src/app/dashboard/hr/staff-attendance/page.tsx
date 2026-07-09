"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Save, Loader2, AlertCircle, History, CalendarDays, UserCheck, ClipboardCheck, Filter, Copy, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { StaffCsvImportDialog } from "@/components/attendance/StaffCsvImportDialog";
import * as XLSX from "xlsx";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

interface StaffAttendanceRecord {
    id: number;
    staff_id: string;
    name: string;
    role: string;
    attendance: string;
    date: string;
    source: string;
    entry_time: string;
    exit_time: string;
    note: string;
}

interface StaffRole {
    id?: number | string;
    name: string;
}

const today = new Date().toISOString().split("T")[0];

export default function StaffAttendancePage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [role, setRole] = useState("all");
    const [date, setDate] = useState(today);
    const [attendanceData, setAttendanceData] = useState<StaffAttendanceRecord[]>([]);
    const [bulkAttendance, setBulkAttendance] = useState("");
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searched, setSearched] = useState(false);
    const [roles, setRoles] = useState<StaffRole[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const attendanceOptions = [
        { label: "present", value: "present", color: "text-green-600", bg: "bg-green-600" },
        { label: "late", value: "late", color: "text-amber-500", bg: "bg-amber-500" },
        { label: "absent", value: "absent", color: "text-red-600", bg: "bg-red-600" },
        { label: "half_day", value: "half_day", color: "text-orange-500", bg: "bg-orange-500" },
        { label: "holiday", value: "holiday", color: "text-blue-500", bg: "bg-blue-500" },
        { label: "second_half", value: "half_day_second", color: "text-purple-500", bg: "bg-purple-500" },
    ];

    const attendanceBadge: Record<string, string> = {
        present: "bg-green-600 text-white shadow-sm",
        late: "bg-amber-500 text-white shadow-sm",
        absent: "bg-red-600 text-white shadow-sm",
        half_day: "bg-orange-500 text-white shadow-sm",
        holiday: "bg-blue-500 text-white shadow-sm",
        half_day_second: "bg-purple-500 text-white shadow-sm",
    };

    useEffect(() => {
        api.get("/hr/staff-roles").then(res => setRoles(res.data?.data || [])).catch(console.error);
    }, []);

    const handleSearch = useCallback(async () => {
        if (!date) { tt.error("please_select_attendance_date"); return; }
        try {
            setSearching(true);
            setSearched(false);
            const params: Record<string, string> = { date };
            if (role && role !== "all") params.role = role;
            const res = await api.get("/hr/staff-attendance", { params });
            if (res.data?.success) {
                setAttendanceData(res.data.data ?? []);
                setBulkAttendance("");
                setSearched(true);
                setCurrentPage(1);
            }
        } catch {
            tt.error("failed_to_load_staff_list");
        } finally {
            setSearching(false);
        }
    }, [date, role, tt]);

    const handleBulkChange = (value: string) => {
        setBulkAttendance(value);
        setAttendanceData(prev => prev.map(item => ({ ...item, attendance: value })));
    };

    const handleIndividualChange = (id: number, field: keyof StaffAttendanceRecord, value: string) => {
        setAttendanceData(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleCsvImport = (records: Array<{ staff_id?: string; name: string; attendance?: string; entry_time?: string; exit_time?: string; note?: string }>) => {
        setAttendanceData(prev => {
            const updated = [...prev];
            let matchCount = 0;
            records.forEach(record => {
                const idx = updated.findIndex(s =>
                    s.staff_id === record.staff_id ||
                    s.name.toLowerCase() === record.name.toLowerCase()
                );
                if (idx !== -1) {
                    updated[idx] = {
                        ...updated[idx],
                        attendance: record.attendance || updated[idx].attendance,
                        entry_time: record.entry_time || updated[idx].entry_time,
                        exit_time: record.exit_time || updated[idx].exit_time,
                        note: record.note || updated[idx].note,
                    };
                    matchCount++;
                }
            });
            if (matchCount > 0) {
                tt.success("applied_csv_data_to_n", { count: matchCount });
            } else {
                tt.error("no_matching_staff_csv");
            }
            return updated;
        });
    };

    const handleCopy = () => {
        if (attendanceData.length === 0) {
            tt.error("no_data_to_copy");
            return;
        }
        const header = ["#", "Staff ID", "Name", "Role", "Attendance", "Note"].join("\t");
        const rows = attendanceData.map((s, idx) => 
            [idx + 1, s.staff_id, s.name, s.role, s.attendance, s.note || ""].join("\t")
        );
        const text = [header, ...rows].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const handleExportExcel = () => {
        if (attendanceData.length === 0) {
            tt.error("no_data_to_export");
            return;
        }
        const dataToExport = attendanceData.map((s, idx) => ({
            "#": idx + 1,
            "Staff ID": s.staff_id,
            "Name": s.name,
            "Role": s.role,
            "Attendance": s.attendance,
            "Note": s.note || ""
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Staff Attendance");
        XLSX.writeFile(wb, `staff_attendance_${date}.xlsx`);
        tt.success("exported_to_excel");
    };

    const handleSave = async () => {
        if (attendanceData.length === 0) { tt.error("no_staff_to_save"); return; }
        try {
            setSaving(true);
            const records = attendanceData.map(s => ({
                user_id: s.id,
                attendance: s.attendance,
                entry_time: s.entry_time || null,
                exit_time: s.exit_time || null,
                note: s.note || null,
            }));
            const res = await api.post("/hr/staff-attendance", { date, records });
            if (res.data?.success) {
                tt.success("attendance_saved_successfully");
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            tt.error(err.response?.data?.message || "failed_to_save_attendance");
        } finally {
            setSaving(false);
        }
    };

    const totalPages = Math.ceil(attendanceData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = attendanceData.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800 flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-indigo-600" /> {t("staff_attendance")}
                </h1>
                <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                    className="gap-2 h-9 px-6 text-[11px] font-bold uppercase rounded-lg border-gray-200 hover:bg-white shadow-sm flex items-center"
                >
                    <History className="h-4 w-4" /> {t("attendance_report")}
                </Button>
            </div>

            {/* Select Criteria */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("mark_daily_attendance")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("select_role_and_attendance_date")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t("role")} <span className="text-red-500">*</span></Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger className="h-10 border-gray-100 text-xs focus:ring-indigo-500 bg-white rounded-lg shadow-none">
                                    <SelectValue placeholder={t("all_roles")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100">
                                    <SelectItem value="all">{t("all_roles")}</SelectItem>
                                    {roles.map((r, idx) => (
                                        <SelectItem key={r.id || idx} value={r.name}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 col-span-2">
                            <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t("attendance_date")} <span className="text-red-500">*</span></Label>
                            <div className="flex gap-4">
                                 <DatePicker
                                     value={date}
                                     onChange={val => setDate(val)}
                                     className="h-10 border-gray-100 text-xs focus-visible:ring-indigo-500 bg-white rounded-lg shadow-none max-w-[250px]"
                                 />
                                <Button
                                    onClick={handleSearch}
                                    disabled={searching}
                                    variant="gradient"
                                    className="gap-2 h-10 px-8 text-[11px] font-bold uppercase tracking-widest rounded shadow-md"
                                >
                                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    {t("search")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Staff Attendance Table */}
            {(searching || searched || attendanceData.length > 0) && (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <ClipboardCheck className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("staff_attendance")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("x_staff_members_on_date", { count: attendanceData.length, date: new Date(date).toDateString() })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleCopy}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                                title={t("copy")}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={handleExportExcel}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                                title={t("export_excel")}
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Select 
                                value={itemsPerPage.toString()} 
                                onValueChange={(val) => { 
                                    setItemsPerPage(parseInt(val, 10)); 
                                    setCurrentPage(1); 
                                }}
                            >
                                <SelectTrigger className="h-8 w-[80px] text-[11px] border-gray-200 bg-white rounded-lg focus:ring-indigo-500">
                                    <SelectValue placeholder="20" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100">
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                    <SelectItem value="200">200</SelectItem>
                                    <SelectItem value="500">500</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                        {/* Bulk Action Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-4 border-b border-gray-50 bg-indigo-50/20">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-100 rounded-lg">
                                        <UserCheck className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                                        {t("set_bulk")}:
                                    </span>
                                </div>
                                <RadioGroup
                                    value={bulkAttendance}
                                    onValueChange={handleBulkChange}
                                    className="flex flex-wrap gap-4"
                                >
                                    {attendanceOptions.map(opt => (
                                        <div key={opt.value} className="flex items-center gap-1.5">
                                            <RadioGroupItem
                                                value={opt.value}
                                                id={`bulk-${opt.value}`}
                                                className="h-4 w-4 border-gray-300 text-indigo-600"
                                            />
                                            <Label
                                                htmlFor={`bulk-${opt.value}`}
                                                className={cn("text-[11px] font-bold cursor-pointer leading-none uppercase tracking-tighter", opt.color)}
                                            >
                                                {t(opt.label)}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="flex items-center gap-3">
                                <StaffCsvImportDialog onImport={handleCsvImport} />
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    variant="gradient"
                                    className="gap-2 h-9 px-6 text-[11px] font-bold uppercase tracking-widest rounded shadow-lg transition-transform hover:scale-105"
                                >
                                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    {t("save_attendance")}
                                </Button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="px-4 pb-4">
                            <div className="rounded-lg border border-gray-200/50 overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-gray-100">
                                        <TableRow className="hover:bg-transparent border-gray-100">
                                            <TableHead className="text-[10px] font-bold uppercase text-gray-600 w-12 pl-4 text-center">#</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase text-gray-600">{t("staff_info")}</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase text-gray-600">{t("role")}</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase text-gray-600 min-w-[320px]">{t("attendance_status")}</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase text-gray-600">{t("entry_exit")}</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase text-gray-600">{t("notes")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {searching ? (
                                            <TableSkeleton rows={5} cols={6} />
                                        ) : attendanceData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-32 text-center">
                                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                                        <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                                                        <p className="text-xs italic">{t("no_staff_records_found")}</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedData.map((staff, idx) => (
                                            <TableRow key={staff.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                                <TableCell className="py-4 pl-4 text-center text-gray-400 font-mono text-[10px]">{startIndex + idx + 1}</TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-gray-800 uppercase tracking-tight">{staff.name}</span>
                                                        <span className="text-[9px] text-gray-400 font-mono">{staff.staff_id}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-tighter border border-indigo-100">
                                                        {staff.role}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-20">
                                                            <span className={cn(
                                                                "inline-flex items-center justify-center w-full px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter shadow-sm",
                                                                attendanceBadge[staff.attendance] || "bg-gray-200 text-gray-600"
                                                            )}>
                                                                {t(attendanceOptions.find(o => o.value === staff.attendance)?.label ?? staff.attendance)}
                                                            </span>
                                                        </div>
                                                        <RadioGroup
                                                            value={staff.attendance}
                                                            onValueChange={val => handleIndividualChange(staff.id, "attendance", val)}
                                                            className="flex flex-wrap gap-x-3"
                                                        >
                                                            {attendanceOptions.map(opt => (
                                                                <div key={opt.value} className="flex items-center gap-1.5 group cursor-pointer">
                                                                    <RadioGroupItem
                                                                        value={opt.value}
                                                                        id={`${staff.id}-${opt.value}`}
                                                                        className="h-3.5 w-3.5 border-gray-200 text-indigo-600 focus:ring-offset-0 focus:ring-0"
                                                                    />
                                                                    <Label
                                                                        htmlFor={`${staff.id}-${opt.value}`}
                                                                        className={cn("text-[9px] font-bold cursor-pointer leading-none uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity", staff.attendance === opt.value ? "opacity-100" : "")}
                                                                    >
                                                                        {t(opt.label)}
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </RadioGroup>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex gap-2 items-center">
                                                        <Input
                                                            type="time"
                                                            value={staff.entry_time}
                                                            onChange={e => handleIndividualChange(staff.id, "entry_time", e.target.value)}
                                                            className="h-7 w-24 text-[10px] bg-white border-gray-100 rounded-md focus-visible:ring-indigo-500 shadow-none px-2"
                                                        />
                                                        <span className="text-gray-300">—</span>
                                                        <Input
                                                            type="time"
                                                            value={staff.exit_time}
                                                            onChange={e => handleIndividualChange(staff.id, "exit_time", e.target.value)}
                                                            className="h-7 w-24 text-[10px] bg-white border-gray-100 rounded-md focus-visible:ring-indigo-500 shadow-none px-2"
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 pr-4">
                                                    <Input
                                                        type="text"
                                                        placeholder={t("add_note")}
                                                        value={staff.note}
                                                        onChange={e => handleIndividualChange(staff.id, "note", e.target.value)}
                                                        className="h-7 min-w-[120px] text-[10px] bg-white border-gray-100 rounded-md focus-visible:ring-indigo-500 shadow-none"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {attendanceData.length > 0 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-4 px-2">
                                    <div>{t("showing_x_to_y_of_z", { from: attendanceData.length === 0 ? 0 : startIndex + 1, to: Math.min(startIndex + itemsPerPage, attendanceData.length), total: attendanceData.length })}</div>
                                    {totalPages > 1 && (
                                        <div className="flex gap-1 items-center">
                                            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <Button key={page} size="sm" onClick={() => setCurrentPage(page)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all", currentPage === page ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200")}>{page}</Button>
                                            ))}
                                            <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom Save Bar */}
                        {attendanceData.length > 0 && (
                            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-50 bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-gray-400" />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {t("x_staff_members_on_date", { count: attendanceData.length, date: new Date(date).toDateString() })}
                                    </p>
                                </div>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    variant="gradient"
                                    className="gap-2 h-10 px-10 text-[11px] font-bold uppercase tracking-widest rounded shadow-xl"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {t("finalize_and_save")}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Empty state */}
            {!searched && !searching && attendanceData.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-gray-300 bg-white rounded-lg border border-dashed border-gray-200">
                    <UserCheck className="h-16 w-16 mb-4 opacity-10" />
                    <p className="text-[12px] font-medium uppercase tracking-[.2em] text-gray-400">{t("no_data_loaded")}</p>
                    <p className="text-[11px] text-gray-400 mt-2 italic">{t("select_role_and_date_message")}</p>
                </div>
            )}
        </div>
    );
}
