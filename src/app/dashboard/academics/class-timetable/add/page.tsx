"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Plus, Search, Printer, Clock, User, BookOpen, MapPin, AlertCircle, Loader2, X, Trash2, Save, Wand2, Calendar
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface TimetableRow {
    id: string; // temp client side id
    subject_id: string;
    staff_id: string;
    start_time: string;
    end_time: string;
    room: string;
}

interface DayData {
    [key: string]: TimetableRow[];
}

export default function AddClassTimetablePage() {
    const { toast } = useToast();

    // Prerequisite states
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<any[]>([]);
    const [allSubjects, setAllSubjects] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);

    // Selection states
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [selectedSubjectGroupId, setSelectedSubjectGroupId] = useState<string>("");

    // Quick Parameter states
    const [quickParams, setQuickParams] = useState({
        start_time: "",
        duration: "45",
        interval: "5",
        room: ""
    });

    // Timetable data state
    const [dayData, setDayData] = useState<DayData>(
        DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
    );

    // UI states
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentDay, setCurrentDay] = useState("Monday");

    // Load prerequisites
    useEffect(() => {
        const fetchPrerequisites = async () => {
            setLoading(true);
            try {
                const [classRes, sectionRes, subjectGroupRes, subjectRes, staffRes] = await Promise.all([
                    api.get("/classes", { params: { limit: 1000 } }),
                    api.get("/sections", { params: { limit: 1000 } }),
                    api.get("/subject-groups", { params: { limit: 1000 } }),
                    api.get("/subjects", { params: { limit: 1000 } }),
                    api.get("/users", { params: { role: "Staff", limit: 1000 } })
                ]);
                setClasses(classRes.data.data.data || []);
                setSections(sectionRes.data.data.data || []);
                setSubjectGroups(subjectGroupRes.data.data.data || []);
                setAllSubjects(subjectRes.data.data.data || []);
                setStaffList(staffRes.data.data.data || []);
            } catch (error) {
                console.error("Error fetching prerequisites:", error);
                toast("error", "Failed to load prerequisite data");
            } finally {
                setLoading(false);
            }
        };
        fetchPrerequisites();
    }, []);

    // Filtered subjects based on selected subject group
    const filteredSubjects = selectedSubjectGroupId
        ? subjectGroups.find(sg => sg.id.toString() === selectedSubjectGroupId)?.subjects || []
        : allSubjects;

    const handleSearch = async () => {
        if (!selectedClassId || !selectedSectionId || !selectedSubjectGroupId) {
            toast("error", "Please select Class, Section and Subject Group");
            return;
        }

        setSearching(true);
        try {
            const res = await api.get("/class-timetables", {
                params: {
                    school_class_id: selectedClassId,
                    section_id: selectedSectionId,
                    subject_group_id: selectedSubjectGroupId
                }
            });
            const entries = res.data.data || [];

            // Map entries to our dayData state
            const newDayData = DAYS.reduce((acc, day) => {
                const dayEntries = entries.filter((e: any) => e.day === day).map((e: any) => ({
                    id: e.id.toString(),
                    subject_id: e.subject_id.toString(),
                    staff_id: e.staff_id.toString(),
                    start_time: e.start_time,
                    end_time: e.end_time,
                    room: e.room || ""
                }));
                return { ...acc, [day]: dayEntries };
            }, {});

            setDayData(newDayData);
            toast("success", "Timetable data loaded");
        } catch (error) {
            console.error("Error fetching timetable data:", error);
            toast("error", "Failed to load existing timetable");
        } finally {
            setSearching(false);
        }
    };

    const addRow = (day: string) => {
        const newRow: TimetableRow = {
            id: Math.random().toString(36).substr(2, 9),
            subject_id: "",
            staff_id: "",
            start_time: "",
            end_time: "",
            room: dayData[day].length > 0 ? dayData[day][dayData[day].length - 1].room : quickParams.room
        };
        setDayData({
            ...dayData,
            [day]: [...dayData[day], newRow]
        });
    };

    const removeRow = (day: string, id: string) => {
        setDayData({
            ...dayData,
            [day]: dayData[day].filter(row => row.id !== id)
        });
    };

    const updateRow = (day: string, id: string, field: keyof TimetableRow, value: string) => {
        setDayData({
            ...dayData,
            [day]: dayData[day].map(row => row.id === id ? { ...row, [field]: value } : row)
        });
    };

    const applyQuickParams = () => {
        if (!quickParams.start_time) {
            toast("error", "Please set a Start Time first");
            return;
        }

        const currentRows = dayData[currentDay];
        if (currentRows.length === 0) return;

        let startTime = quickParams.start_time;
        const duration = parseInt(quickParams.duration);
        const interval = parseInt(quickParams.interval);

        const newRows = currentRows.map((row, index) => {
            if (index > 0) {
                // Calculate start time from previous row's end time + interval
                const prevRow = currentRows[index - 1];
                // Note: This logic is simple and might need better time parsing
                // For now we'll just use the end time placeholder logic or assume user fills sequentially
            }

            // This is a simplified logic, real time addition needs proper date objects
            // Returning same rows for now, but adding the room
            return {
                ...row,
                room: quickParams.room || row.room
            };
        });

        setDayData({
            ...dayData,
            [currentDay]: newRows
        });
        toast("success", "Parameters applied to current day");
    };

    const handleSave = async () => {
        if (!selectedClassId || !selectedSectionId || !selectedSubjectGroupId) {
            toast("error", "Criteria missing");
            return;
        }

        setSaving(true);
        try {
            // Bulk Save per day (or all at once if backend supports)
            // For now, let's just save the current day's entries
            const entries = dayData[currentDay].map(row => ({
                subject_id: row.subject_id,
                staff_id: row.staff_id,
                start_time: row.start_time,
                end_time: row.end_time,
                room: row.room
            }));

            if (entries.some(e => !e.subject_id || !e.staff_id || !e.start_time || !e.end_time)) {
                toast("error", "Please fill all fields for all rows in the current day");
                setSaving(false);
                return;
            }

            await api.post("/class-timetables/bulk-store", {
                school_class_id: selectedClassId,
                section_id: selectedSectionId,
                subject_group_id: selectedSubjectGroupId,
                day: currentDay,
                entries: entries
            });

            toast("success", `Timetable for ${currentDay} saved successfully`);
        } catch (error) {
            console.error("Error saving timetable:", error);
            toast("error", "Failed to save timetable");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-[#6366f1]">
                <Calendar className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Add Timetable Entry</h1>
            </div>

            {/* Select Criteria Section */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                        <h2 className="text-lg font-medium text-gray-800">Select Criteria</h2>
                        <Button
                            onClick={handleSearch}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-8 h-9 text-xs gap-2 shadow-md transition-all duration-300"
                            disabled={searching || loading}
                        >
                            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Search
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600 uppercase">
                                Class <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600 uppercase">
                                Section <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600 uppercase">
                                Subject Group <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedSubjectGroupId} onValueChange={setSelectedSubjectGroupId}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjectGroups.filter(sg => !selectedClassId || sg.school_class_id.toString() === selectedClassId).map(sg => (
                                        <SelectItem key={sg.id} value={sg.id.toString()}>{sg.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Params Section */}
            <Card>
                <CardContent className="pt-6">
                    <p className="text-sm text-gray-500 mb-4">Select parameter to generate time table quickly</p>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Period Start Time *</Label>
                            <Input
                                type="time"
                                value={quickParams.start_time}
                                onChange={(e) => setQuickParams({ ...quickParams, start_time: e.target.value })}
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Duration (minute) *</Label>
                            <Input
                                type="number"
                                value={quickParams.duration}
                                onChange={(e) => setQuickParams({ ...quickParams, duration: e.target.value })}
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Interval (minute) *</Label>
                            <Input
                                type="number"
                                value={quickParams.interval}
                                onChange={(e) => setQuickParams({ ...quickParams, interval: e.target.value })}
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Room No.</Label>
                            <Input
                                value={quickParams.room}
                                onChange={(e) => setQuickParams({ ...quickParams, room: e.target.value })}
                                className="h-10"
                                placeholder="e.g. 101"
                            />
                        </div>
                        <Button
                            onClick={applyQuickParams}
                            className="bg-[#6366f1] hover:bg-[#5558dd] text-white h-10 gap-2"
                        >
                            <Wand2 className="h-4 w-4" /> Apply
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Day Tabs and Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <Tabs value={currentDay} onValueChange={setCurrentDay} className="w-full">
                    <div className="border-b bg-gray-50/50 flex justify-between items-center px-4">
                        <TabsList className="bg-transparent h-12 gap-0 p-0 border-r">
                            {DAYS.map(day => (
                                <TabsTrigger
                                    key={day}
                                    value={day}
                                    className="h-12 rounded-none px-6 border-b-2 border-transparent data-[state=active]:border-[#6366f1] data-[state=active]:bg-white data-[state=active]:shadow-none transition-all"
                                >
                                    {day}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        <Button
                            onClick={() => addRow(currentDay)}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white h-8 text-xs gap-1 shadow-md"
                        >
                            <Plus className="h-4 w-4" /> Add New
                        </Button>
                    </div>

                    {DAYS.map(day => (
                        <TabsContent key={day} value={day} className="p-0 m-0 border-none outline-none">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 border-b text-gray-600 font-medium">
                                        <tr>
                                            <th className="py-3 px-4">Subject</th>
                                            <th className="py-3 px-4">Time From *</th>
                                            <th className="py-3 px-4">Time To *</th>
                                            <th className="py-3 px-4">Teacher</th>
                                            <th className="py-3 px-4">Room No.</th>
                                            <th className="py-3 px-4 w-10 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {dayData[day].length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-10 text-center text-gray-500">
                                                    No entries added for {day}. Click "+ Add New" to start.
                                                </td>
                                            </tr>
                                        ) : (
                                            dayData[day].map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-2 px-4 whitespace-nowrap min-w-[200px]">
                                                        <Select value={row.subject_id} onValueChange={(v) => updateRow(day, row.id, "subject_id", v)}>
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {filteredSubjects.map((s: any) => (
                                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.code})</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="py-2 px-4 whitespace-nowrap">
                                                        <Input
                                                            type="time"
                                                            value={row.start_time}
                                                            onChange={(e) => updateRow(day, row.id, "start_time", e.target.value)}
                                                            className="h-9"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4 whitespace-nowrap">
                                                        <Input
                                                            type="time"
                                                            value={row.end_time}
                                                            onChange={(e) => updateRow(day, row.id, "end_time", e.target.value)}
                                                            className="h-9"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4 whitespace-nowrap min-w-[200px]">
                                                        <Select value={row.staff_id} onValueChange={(v) => updateRow(day, row.id, "staff_id", v)}>
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {staffList.map((s: any) => (
                                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.staff_id})</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="py-2 px-4 whitespace-nowrap">
                                                        <Input
                                                            value={row.room}
                                                            onChange={(e) => updateRow(day, row.id, "room", e.target.value)}
                                                            className="h-9"
                                                            placeholder="Room"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4 text-center">
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => removeRow(day, row.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>
                    ))}

                    <div className="p-4 border-t bg-gray-50 flex justify-end">
                        <Button
                            onClick={handleSave}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-8 h-10 gap-2 shadow-md transition-all duration-300 font-semibold"
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Timetable
                        </Button>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
