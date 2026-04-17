"use client";

import { useState, useCallback } from "react";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/lib/api";

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
    { label: "Present", value: "present", color: "text-emerald-600" },
    { label: "Late", value: "late", color: "text-amber-500" },
    { label: "Absent", value: "absent", color: "text-red-500" },
    { label: "Half Day", value: "half_day", color: "text-orange-500" },
    { label: "Holiday", value: "holiday", color: "text-blue-500" },
    { label: "Half Day (2nd)", value: "half_day_second", color: "text-purple-500" },
];

const attendanceBadge: Record<string, string> = {
    present: "bg-emerald-50 text-emerald-700 border-emerald-200",
    late: "bg-amber-50 text-amber-700 border-amber-200",
    absent: "bg-red-50 text-red-700 border-red-200",
    half_day: "bg-orange-50 text-orange-700 border-orange-200",
    holiday: "bg-blue-50 text-blue-700 border-blue-200",
    half_day_second: "bg-purple-50 text-purple-700 border-purple-200",
};

// Format today's date as YYYY-MM-DD
const today = new Date().toISOString().split("T")[0];

export default function StaffAttendancePage() {
    const [role, setRole] = useState("all");
    const [date, setDate] = useState(today);
    const [attendanceData, setAttendanceData] = useState<StaffAttendanceRecord[]>([]);
    const [bulkAttendance, setBulkAttendance] = useState("");
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searched, setSearched] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const handleSearch = useCallback(async () => {
        if (!date) { showToast("error", "Please select an attendance date."); return; }
        try {
            setSearching(true);
            setSearched(false);
            const params: Record<string, string> = { date };
            if (role && role !== "all") params.role = role;
            const res = await api.get("/hr/staff-attendance", { params });
            setAttendanceData(res.data.data ?? []);
            setBulkAttendance("");
            setSearched(true);
        } catch {
            showToast("error", "Failed to load staff. Please try again.");
        } finally {
            setSearching(false);
        }
    }, [date, role]);

    const handleBulkChange = (value: string) => {
        setBulkAttendance(value);
        setAttendanceData(prev => prev.map(item => ({ ...item, attendance: value })));
    };

    const handleIndividualChange = (id: number, field: keyof StaffAttendanceRecord, value: string) => {
        setAttendanceData(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleSave = async () => {
        if (attendanceData.length === 0) { showToast("error", "No staff to save. Search first."); return; }
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
            showToast("success", res.data.message ?? "Attendance saved!");
        } catch {
            showToast("error", "Failed to save attendance. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-[10px] font-medium transition-all
                    ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                    {toast.type === "success"
                        ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                        : <AlertCircle className="h-4 w-4 shrink-0" />}
                    {toast.msg}
                </div>
            )}

            {/* Page Title */}
            <h1 className="text-[16px] font-medium text-gray-800">Staff Attendance</h1>

            {/* Select Criteria */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Select Criteria</h2>
                <div className="flex flex-col md:flex-row gap-4 items-end">

                    <div className="flex-1 space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                            Role
                        </Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="h-9 border-gray-200 text-[10px] focus:ring-indigo-500 bg-white">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
                                <SelectItem value="Teacher">Teacher</SelectItem>
                                <SelectItem value="Accountant">Accountant</SelectItem>
                                <SelectItem value="Librarian">Librarian</SelectItem>
                                <SelectItem value="Receptionist">Receptionist</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                            Attendance Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="h-9 border-gray-200 text-[10px] focus-visible:ring-indigo-500 bg-white"
                        />
                    </div>

                    <div className="pb-0.5">
                        <Button
                            onClick={handleSearch}
                            disabled={searching}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white gap-2 h-9 px-5 text-[10px] font-bold shadow-md transition-all rounded-full border-none disabled:opacity-60"
                        >
                            {searching
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Search className="h-3.5 w-3.5" />}
                            {searching ? "Searching..." : "Search"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Staff Attendance Table */}
            {(searched || attendanceData.length > 0) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">

                    {/* Toolbar: bulk radio + save */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/40">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                                Set all as:
                            </span>
                            <RadioGroup
                                value={bulkAttendance}
                                onValueChange={handleBulkChange}
                                className="flex flex-wrap gap-3"
                            >
                                {attendanceOptions.map(opt => (
                                    <div key={opt.value} className="flex items-center gap-1.5">
                                        <RadioGroupItem
                                            value={opt.value}
                                            id={`bulk-${opt.value}`}
                                            className="h-3.5 w-3.5 border-gray-300 text-indigo-600"
                                        />
                                        <Label
                                            htmlFor={`bulk-${opt.value}`}
                                            className={`text-[10px] font-medium cursor-pointer leading-none ${opt.color}`}
                                        >
                                            {opt.label}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white gap-2 h-8 px-4 text-[10px] font-bold shadow-md transition-all rounded-full border-none whitespace-nowrap disabled:opacity-60"
                        >
                            {saving
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Save className="h-3.5 w-3.5" />}
                            {saving ? "Saving..." : "Save Attendance"}
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/70 hover:bg-transparent border-gray-100">
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500 w-10 pl-4">#</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500">Staff ID</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500">Name</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500">Role</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500 min-w-[400px]">Attendance</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500">Source</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500">Entry Time</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500">Exit Time</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500">Note</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center text-[10px] text-gray-400">
                                            No staff found for the selected criteria.
                                        </TableCell>
                                    </TableRow>
                                ) : attendanceData.map((staff, idx) => (
                                    <TableRow key={staff.id} className="text-[10px] border-b border-gray-50 hover:bg-indigo-50/20 transition-colors">
                                        <TableCell className="py-2.5 pl-4 text-gray-400 font-medium">{idx + 1}</TableCell>
                                        <TableCell className="py-2.5 text-gray-500 font-mono text-[10px]">{staff.staff_id}</TableCell>
                                        <TableCell className="py-2.5 text-gray-800 font-semibold">{staff.name}</TableCell>
                                        <TableCell className="py-2.5">
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[13px] font-medium border border-indigo-100">
                                                {staff.role}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <div className="flex items-center gap-1">
                                                {/* Compact status badge */}
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-semibold mr-2 ${attendanceBadge[staff.attendance] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                                                    {attendanceOptions.find(o => o.value === staff.attendance)?.label ?? staff.attendance}
                                                </span>
                                                <RadioGroup
                                                    value={staff.attendance}
                                                    onValueChange={val => handleIndividualChange(staff.id, "attendance", val)}
                                                    className="flex flex-wrap gap-2"
                                                >
                                                    {attendanceOptions.map(opt => (
                                                        <div key={opt.value} className="flex items-center gap-1">
                                                            <RadioGroupItem
                                                                value={opt.value}
                                                                id={`${staff.id}-${opt.value}`}
                                                                className="h-3 w-3 border-gray-300 text-indigo-600"
                                                            />
                                                            <Label
                                                                htmlFor={`${staff.id}-${opt.value}`}
                                                                className={`text-[10px] font-medium cursor-pointer leading-none ${opt.color}`}
                                                            >
                                                                {opt.label}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2.5 text-gray-400 text-[10px]">{staff.source}</TableCell>
                                        <TableCell className="py-2.5">
                                            <Input
                                                type="time"
                                                value={staff.entry_time}
                                                onChange={e => handleIndividualChange(staff.id, "entry_time", e.target.value)}
                                                className="h-7 w-28 text-[10px] bg-white border-gray-200 shadow-none focus-visible:ring-indigo-400"
                                            />
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <Input
                                                type="time"
                                                value={staff.exit_time}
                                                onChange={e => handleIndividualChange(staff.id, "exit_time", e.target.value)}
                                                className="h-7 w-28 text-[10px] bg-white border-gray-200 shadow-none focus-visible:ring-indigo-400"
                                            />
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <Input
                                                type="text"
                                                placeholder="Optional note"
                                                value={staff.note}
                                                onChange={e => handleIndividualChange(staff.id, "note", e.target.value)}
                                                className="h-7 w-40 text-[10px] bg-white border-gray-200 shadow-none focus-visible:ring-indigo-400"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer: count + save again */}
                    {attendanceData.length > 0 && (
                        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 bg-gray-50/30">
                            <p className="text-[10px] text-gray-400">
                                {attendanceData.length} staff member{attendanceData.length !== 1 ? "s" : ""} &middot; {date}
                            </p>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white gap-2 h-8 px-4 text-[10px] font-bold shadow-md transition-all rounded-full border-none whitespace-nowrap disabled:opacity-60"
                            >
                                {saving
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Save className="h-3.5 w-3.5" />}
                                {saving ? "Saving..." : "Save Attendance"}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state before first search */}
            {!searched && attendanceData.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Search className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-[10px]">Select a role and date, then click <strong>Search</strong> to load staff.</p>
                </div>
            )}
        </div>
    );
}

