"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, FileSpreadsheet, FileText, Printer, Filter, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionItem {
    id: string | number;
    name?: string;
    group_name?: string;
    school_class_id?: string | number;
}

interface RawTopic {
    id: string;
    className: string;
    section: string;
    subjectGroup: string;
    subject: string;
    lesson: string;
    topics: { id: string; name: string; completion_date?: string | null; is_completed?: boolean }[];
}

interface TopicStatus {
    id: string;
    name: string;
    completionDate?: string | null;
    isCompleted: boolean;
}

interface LessonStatus {
    id: string;
    className: string;
    section: string;
    subjectGroup: string;
    subject: string;
    lesson: string;
    topics: TopicStatus[];
}

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export default function ManageSyllabusStatusPage() {
    const { toast } = useToast();
    const [classes, setClasses] = useState<OptionItem[]>([]);
    const [sections, setSections] = useState<OptionItem[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<OptionItem[]>([]);
    const [subjects, setSubjects] = useState<OptionItem[]>([]);
    const [syllabusData, setSyllabusData] = useState<LessonStatus[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [criteria, setCriteria] = useState({
        class_id: "",
        class_name: "",
        section: "",
        subject_group: "",
        subject: ""
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const extractData = (res: { data?: unknown }): OptionItem[] => {
        const data = res.data as { data?: unknown } | unknown[] | undefined;
        if (Array.isArray(data)) return data as OptionItem[];
        if (data && Array.isArray((data as { data?: unknown }).data)) {
            return (data as { data: OptionItem[] }).data;
        }
        return [];
    };

    const fetchInitialData = async () => {
        try {
            const [classesRes, subjectsRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subjects?no_paginate=true').catch(() => ({ data: [] }))
            ]);

            setClasses(extractData(classesRes));
            setSubjects(extractData(subjectsRes));
        } catch (error) {
            console.error("Failed to load initial dropdowns", error);
        }
    };

    // Fetch sections filtered by selected class
    const fetchSectionsByClass = async (classId: string) => {
        if (!classId) { setSections([]); return; }
        try {
            const res = await api.get('/academics/sections?with_class=true&no_paginate=true');
            const all: OptionItem[] = res.data?.data || res.data || [];
            const filtered = all.filter((s) => String(s.school_class_id) === String(classId));
            setSections(filtered);
        } catch {
            setSections([]);
        }
    };

    // Fetch subject groups filtered by class and section
    const fetchFilteredSubjectGroups = async (classId: string, sectionName: string) => {
        const params: Record<string, string> = { no_paginate: 'true' };
        if (classId) params.school_class_id = classId;
        const cls = classes.find((c) => String(c.id) === String(classId));
        if (cls && sectionName) {
            const sec = sections.find((s) => s.name === sectionName && String(s.school_class_id) === String(classId));
            if (sec) params.section_id = String(sec.id);
        }
        try {
            const res = await api.get('/academics/subject-groups', { params });
            setSubjectGroups(extractData(res));
        } catch {
            setSubjectGroups([]);
        }
    };

    const handleSearch = async () => {
        if (!criteria.class_name || !criteria.section || !criteria.subject_group || !criteria.subject) {
            toast({ title: "Error", description: "Please select all criteria", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/lesson-plan/topics');
            const allTopics: RawTopic[] = response.data;

            // Filter based on criteria
            const filtered = allTopics.filter(t =>
                t.className === criteria.class_name &&
                t.section === criteria.section &&
                t.subjectGroup === criteria.subject_group &&
                t.subject === criteria.subject
            ).map(t => ({
                id: t.id,
                className: t.className,
                section: t.section,
                subjectGroup: t.subjectGroup,
                subject: t.subject,
                lesson: t.lesson,
                topics: t.topics.map((topic) => ({
                    id: topic.id,
                    name: topic.name,
                    completionDate: topic.completion_date,
                    isCompleted: !!topic.is_completed
                }))
            }));

            setSyllabusData(filtered);
            if (filtered.length === 0) {
                toast({ title: "Info", description: "No syllabus data found for selected criteria" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch syllabus data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (topicId: string, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus;
            const completionDate = newStatus ? new Date().toISOString().split('T')[0] : null;

            await api.put(`/lesson-plan/topics/${topicId}/status`, {
                is_completed: newStatus,
                completion_date: completionDate
            });

            // Update local state
            setSyllabusData(prevData =>
                prevData.map(lesson => ({
                    ...lesson,
                    topics: lesson.topics.map(topic =>
                        topic.id === topicId
                            ? { ...topic, isCompleted: newStatus, completionDate: completionDate }
                            : topic
                    )
                }))
            );

            toast({ title: "Success", description: "Status updated successfully" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6 p-4 font-sans bg-gray-50/10 min-h-screen">
            {/* Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Select Criteria</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Choose class, section &amp; subject</p>
                    </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Class <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={criteria.class_name}
                                onValueChange={(val) => {
                                    const cls = classes.find((c) => c.name === val);
                                    const classId = cls?.id?.toString() ?? '';
                                    setCriteria({ ...criteria, class_name: val, class_id: classId, section: '', subject_group: '', subject: '' });
                                    fetchSectionsByClass(classId);
                                    fetchFilteredSubjectGroups(classId, '');
                                }}
                            >
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.name || ""}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Section <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={criteria.section}
                                onValueChange={(val) => {
                                    setCriteria({ ...criteria, section: val, subject_group: '', subject: '' });
                                    fetchFilteredSubjectGroups(criteria.class_id, val);
                                }}
                                disabled={!criteria.class_name}
                            >
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => (
                                        <SelectItem key={s.id} value={s.name || ""}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Subject Group <span className="text-red-500">*</span>
                            </Label>
                            <Select value={criteria.subject_group} onValueChange={(val) => setCriteria({...criteria, subject_group: val})} disabled={!criteria.class_name}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjectGroups.map(g => (
                                        <SelectItem key={g.id} value={g.name || g.group_name || ""}>{g.name || g.group_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Subject <span className="text-red-500">*</span>
                            </Label>
                            <Select value={criteria.subject} onValueChange={(val) => setCriteria({...criteria, subject: val})}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={s.name || ""}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="btn-gradient text-white gap-2 h-10 px-8 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full"
                        >
                            {loading ? "Searching..." : <><Search className="h-4 w-4" /> Search</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {(loading || syllabusData.length > 0) && (
                <>
                    {syllabusData.length > 0 && (
                        <div className="text-sm font-medium text-gray-700 mt-6 mb-2 flex items-center gap-2">
                            Syllabus Status For: <span className="font-bold text-indigo-600">{criteria.subject}</span>
                        </div>
                    )}

                    {/* Syllabus Table Section */}
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <ListChecks className="h-5 w-5" />
                                </span>
                                <div>
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Manage Syllabus Status</CardTitle>
                                    <p className="text-[11px] text-gray-500 mt-1">{syllabusData.length} lesson{syllabusData.length === 1 ? '' : 's'}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 cursor-pointer">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 cursor-pointer">
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 cursor-pointer">
                                    <Printer className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 text-[11px] font-bold uppercase text-gray-600 border-b border-gray-100">
                                            <th className="p-4 text-left w-12">#</th>
                                            <th className="p-4 text-left">Lesson Topic</th>
                                            <th className="p-4 text-left">Topic Completion Date</th>
                                            <th className="p-4 text-left">Status</th>
                                            <th className="p-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? (
                                            <TableSkeleton rows={5} cols={5} />
                                        ) : syllabusData.length === 0 ? (
                                            <tr><td colSpan={5} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">No data found</td></tr>
                                        ) : (
                                            syllabusData.map((lesson, idx) => (
                                                <tr key={lesson.id} className="group hover:bg-gray-50/30 transition-colors border-b border-gray-50">
                                                    <td className="p-4 text-[11px] text-gray-400 align-top font-medium">{idx + 1}</td>
                                                    <td className="p-4 align-top">
                                                        <div className="space-y-4">
                                                            <div className="text-[12px] font-bold text-gray-800 uppercase tracking-tight">{lesson.lesson}</div>
                                                            <div className="pl-4 space-y-3">
                                                                {lesson.topics.map((topic, tIdx) => (
                                                                    <div key={topic.id} className="text-[12px] text-gray-500 flex gap-3 items-center">
                                                                        <span className="w-6 shrink-0 text-[10px] text-gray-300 font-bold">{idx + 1}.{tIdx + 1}</span>
                                                                        <span className="font-medium">{topic.name}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-top">
                                                        <div className="space-y-3 mt-8">
                                                            {lesson.topics.map((topic) => (
                                                                <div key={topic.id} className="h-6 flex items-center text-[11px] text-gray-400 italic font-medium">
                                                                    {topic.completionDate || "---"}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-top">
                                                        <div className="space-y-3 mt-8">
                                                            {lesson.topics.map((topic) => (
                                                                <div key={topic.id} className="h-6 flex items-center">
                                                                    <span className={cn(
                                                                        "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-300",
                                                                        topic.isCompleted
                                                                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-100"
                                                                            : "bg-gray-100 text-gray-400"
                                                                    )}>
                                                                        {topic.isCompleted ? "Completed" : "Incomplete"}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-top text-right">
                                                        <div className="space-y-3 mt-8 flex flex-col items-end">
                                                            {lesson.topics.map((topic) => (
                                                                <div key={topic.id} className="h-6 flex items-center">
                                                                    <Switch
                                                                        checked={topic.isCompleted}
                                                                        onCheckedChange={() => toggleStatus(topic.id, topic.isCompleted)}
                                                                        className="h-4 w-8 data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-gray-200"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {!loading && syllabusData.length === 0 && (
                <div className="bg-white rounded-lg border border-dashed border-gray-200 p-20 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <Search className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium">Select criteria to view syllabus status</h3>
                    <p className="text-gray-300 text-[11px] uppercase tracking-widest mt-1">Class, Section, Subject Group, and Subject required</p>
                </div>
            )}
        </div>
    );
}
