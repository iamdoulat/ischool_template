"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Search, Save, Loader2, CheckCircle2, AlertCircle, History, CalendarDays, UserCheck } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { StaffCsvImportDialog } from "@/components/attendance/StaffCsvImportDialog";

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

const attendanceOptions = [
    { label: "Present", value: "present", color: "text-green-600", bg: "bg-green-600" },
    { label: "Late", value: "late", color: "text-amber-500", bg: "bg-amber-500" },
    { label: "Absent", value: "absent", color: "text-red-600", bg: "bg-red-600" },
    { label: "Half Day", value: "half_day", color: "text-orange-500", bg: "bg-orange-500" },
    { label: "Holiday", value: "holiday", color: "text-blue-500", bg: "bg-blue-500" },
    { label: "2nd Half", value: "half_day_second", color: "text-purple-500", bg: "bg-purple-500" },
];

const attendanceBadge: Record<string, string> = {
    present: "bg-green-600 text-white shadow-sm",
    late: "bg-amber-500 text-white shadow-sm",
    absent: "bg-red-600 text-white shadow-sm",
    half_day: "bg-orange-500 text-white shadow-sm",
    holiday: "bg-blue-500 text-white shadow-sm",
    half_day_second: "bg-purple-500 text-white shadow-sm",
};

const today = new Date().toISOString().split("T")[0];

export default function StaffAttendancePage() {
    const { toast } = useToast();
    const [role, setRole] = useState("all");
    const [date, setDate] = useState(today);
    const [attendanceData, setAttendanceData] = useState<StaffAttendanceRecord[]>([]);
    const [bulkAttendance, setBulkAttendance] = useState("");
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searched, setSearched] = useState(false);
    const [roles, setRoles] = useState<any[]>([]);

    useEffect(() => {
        api.get("/hr/staff-roles").then(res => setRoles(res.data?.data || [])).catch(console.error);
    }, []);

    const handleSearch = useCallback(async () => {
        if (!date) { toast("error", "Please select an attendance date."); return; }
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
            }
        } catch {
            toast("error", "Failed to load staff list.");
        } finally {
            setSearching(false);
        }
    }, [date, role, toast]);

    const handleBulkChange = (value: string) => {
        setBulkAttendance(value);
        setAttendanceData(prev => prev.map(item => ({ ...item, attendance: value })));
    };

    const handleIndividualChange = (id: number, field: keyof StaffAttendanceRecord, value: string) => {
        setAttendanceData(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleCsvImport = (records: any[]) => {
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
                toast("success", `Applied CSV data to ${matchCount} matching staff members.`);
            } else {
                toast("error", "No matching staff members found for the imported records.");
            }
            return updated;
        });
    };

    const handleSave = async () => {
        if (attendanceData.length === 0) { toast("error", "No staff to save."); return; }
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
                toast("success", res.data.message ?? "Attendance saved successfully!");
            }
        } catch (e: any) {
            toast("error", e.response?.data?.message || "Failed to save attendance.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800">Staff Attendance</h1>
                <Button 
                    onClick={() => window.history.back()} 
                    variant="outline"
                    className="gap-2 h-9 px-6 text-[11px] font-bold uppercase rounded-lg border-gray-200 hover:bg-white shadow-sm flex items-center"
                >
                    <History className="h-4 w-4" /> Attendance Report
                </Button>
            </div>

            {/* Select Criteria */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                    <div className="h-4 w-1 bg-indigo-500 rounded-full"></div>
                    <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Mark Daily Attendance</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Role <span className="text-red-500">*</span></Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="h-10 border-gray-100 text-xs focus:ring-indigo-500 bg-white rounded-lg shadow-none">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100">
                                <SelectItem value="all">All Roles</SelectItem>
                                {roles.map((r, idx) => (
                                    <SelectItem key={r.id || idx} value={r.name}>{r.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 col-span-2">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Attendance Date <span className="text-red-500">*</span></Label>
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
                                Search
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Staff Attendance Table */}
            {(searched || attendanceData.length > 0) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 space-y-4">
                    {/* Bulk Action Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-4 border-b border-gray-50 bg-indigo-50/20">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-100 rounded-lg">
                                    <UserCheck className="h-4 w-4 text-indigo-600" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                                    Set Bulk:
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
                                            {opt.label}
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
                                Save Attendance
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="px-4 pb-4">
                        <div className="rounded-xl border border-gray-50 overflow-hidden shadow-sm">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-gray-100">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 w-12 pl-4 text-center">#</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600">Staff Info</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600">Role</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 min-w-[320px]">Attendance Status</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600">Entry/Exit</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600">Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendanceData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                                                    <p className="text-xs italic">No staff records found for this selection.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : attendanceData.map((staff, idx) => (
                                        <TableRow key={staff.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                            <TableCell className="py-4 pl-4 text-center text-gray-400 font-mono text-[10px]">{idx + 1}</TableCell>
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
                                                            {attendanceOptions.find(o => o.value === staff.attendance)?.label ?? staff.attendance}
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
                                                                    {opt.label.split(' ')[0]}
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
                                                    placeholder="Add note..."
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
                    </div>

                    {/* Bottom Save Bar */}
                    {attendanceData.length > 0 && (
                        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-50 bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-gray-400" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {attendanceData.length} Staff Members &bull; {new Date(date).toDateString()}
                                </p>
                            </div>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                variant="gradient"
                                className="gap-2 h-10 px-10 text-[11px] font-bold uppercase tracking-widest rounded shadow-xl"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Finalize & Save
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {!searched && attendanceData.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-gray-300 bg-white rounded-xl border border-dashed border-gray-200">
                    <UserCheck className="h-16 w-16 mb-4 opacity-10" />
                    <p className="text-[12px] font-medium uppercase tracking-[.2em] text-gray-400">No Data Loaded</p>
                    <p className="text-[11px] text-gray-400 mt-2 italic">Select a role and date, then click search to load the attendance sheet.</p>
                </div>
            )}
        </div>
    );
}
