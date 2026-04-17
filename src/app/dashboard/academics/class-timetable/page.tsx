"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Plus, Search, Printer, Clock, User, BookOpen, MapPin, AlertCircle, Loader2, X, Trash2
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface TimetableEntry {
    id: number;
    subject_id: number;
    subject_group_id?: number;
    staff_id: number;
    day: string;
    start_time: string;
    end_time: string;
    room: string;
    subject?: { name: string; code?: string };
    staff?: { name: string; staff_id?: string };
}

interface TimetableDay {
    day: string;
    entries: TimetableEntry[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ClassTimetablePage() {
    const { toast } = useToast();

    // Prerequisite states
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<any[]>([]);

    // Selection states
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [selectedSubjectGroupId, setSelectedSubjectGroupId] = useState<string>("");

    // Timetable data
    const [timetableData, setTimetableData] = useState<TimetableDay[]>(
        DAYS.map(day => ({ day, entries: [] }))
    );

    // UI states
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Load prerequisites
    useEffect(() => {
        const fetchPrerequisites = async () => {
            setLoading(true);
            try {
                const [classRes, sectionRes, subjectGroupRes] = await Promise.all([
                    api.get("/classes", { params: { limit: 1000 } }),
                    api.get("/sections", { params: { limit: 1000 } }),
                    api.get("/subject-groups", { params: { limit: 1000 } }),
                ]);
                setClasses(classRes.data.data.data || []);
                setSections(sectionRes.data.data.data || []);
                setSubjectGroups(subjectGroupRes.data.data.data || []);
            } catch (error) {
                console.error("Error fetching prerequisites:", error);
                toast("error", "Failed to load prerequisite data");
            } finally {
                setLoading(false);
            }
        };
        fetchPrerequisites();
    }, []);

    const handleSearch = async () => {
        if (!selectedClassId || !selectedSectionId) {
            toast("error", "Please select both Class and Section");
            return;
        }

        setSearching(true);
        try {
            const res = await api.get("/class-timetables", {
                params: {
                    school_class_id: selectedClassId,
                    section_id: selectedSectionId,
                    subject_group_id: selectedSubjectGroupId || undefined
                }
            });
            const entries = res.data.data || [];

            // Group entries by day
            const grouped = DAYS.map(day => ({
                day,
                entries: entries.filter((e: any) => e.day === day)
            }));
            setTimetableData(grouped);
        } catch (error) {
            console.error("Error searching timetable:", error);
            toast("error", "Failed to fetch timetable");
        } finally {
            setSearching(false);
        }
    };

    const handleDeleteEntry = async (id: number) => {
        if (!confirm("Are you sure you want to delete this entry?")) return;

        try {
            await api.delete(`/class-timetables/${id}`);
            toast("success", "Entry deleted successfully");
            handleSearch(); // Refresh list
        } catch (error) {
            console.error("Error deleting entry:", error);
            toast("error", "Failed to delete entry");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-4">
            {/* Header/Title */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 no-print">
                <div className="flex items-center gap-2 text-[#6366f1]">
                    <Clock className="h-6 w-6" />
                    <h1 className="text-xl font-medium text-gray-800">Class Time Table</h1>
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 no-print select-criteria-section">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h2 className="text-lg font-medium text-gray-800">Select Criteria</h2>
                    <Link href="/dashboard/academics/class-timetable/add">
                        <Button className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-3 h-8 text-xs gap-1 shadow-md transition-all duration-300">
                            <Plus className="h-4 w-4" /> Add
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
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
                            Subject Group
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

                <div className="flex justify-end">
                    <Button
                        onClick={handleSearch}
                        className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-8 h-9 text-xs gap-2 shadow-md transition-all duration-300"
                        disabled={searching || loading}
                    >
                        {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Search
                    </Button>
                </div>
            </div>

            {/* Timetable Section */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="flex justify-end p-2 border-b no-print">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#6366f1]"
                        onClick={handlePrint}
                    >
                        <Printer className="h-5 w-5" />
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <div className="flex min-w-max">
                        {timetableData.map((dayData) => (
                            <div key={dayData.day} className="flex-1 min-w-[200px] border-r last:border-r-0">
                                <div className="bg-gray-50/50 p-2 text-center border-b">
                                    <span className="text-sm font-bold text-gray-700">{dayData.day}</span>
                                </div>
                                <div className="p-3 space-y-3 bg-white min-h-[400px]">
                                    {dayData.entries.length > 0 ? (
                                        dayData.entries.map((entry, idx) => (
                                            <div key={idx} className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow relative group">
                                                <button
                                                    onClick={() => handleDeleteEntry(entry.id)}
                                                    className="absolute top-2 right-2 p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                                <div className="space-y-2 text-[11px]">
                                                    <div className="flex items-start gap-2">
                                                        <BookOpen className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                                        <span className="font-semibold text-green-600">Subject: {entry.subject?.name} ({entry.subject?.code})</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                                        <span className="text-green-700 font-medium">{entry.start_time} - {entry.end_time}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <User className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                                        <span className="text-green-700 font-medium">{entry.staff?.name} ({entry.staff?.staff_id})</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                                        <span className="text-green-700 font-medium">Room: {entry.room || "N/A"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-white border rounded-lg p-3 text-center">
                                            <div className="flex items-center justify-center gap-2 text-red-500 text-[11px] font-medium py-1">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                <span>Not Scheduled</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
