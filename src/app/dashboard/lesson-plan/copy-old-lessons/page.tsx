"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Search,
    Copy,
    Filter,
    BookOpen,
    Layers,
    GraduationCap,
    Route,
    CheckSquare,
    Square,
    Check,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Topic {
    id: string;
    name: string;
}

interface Lesson {
    id: string;
    name: string;
    topics: Topic[];
}

interface OptionItem {
    id: string | number;
    name?: string;
    group_name?: string;
    session?: string;
    school_class_id?: string | number;
}

interface RawTopic {
    id: string;
    className: string;
    section: string;
    subjectGroup: string;
    subject: string;
    lesson: string;
    topics: { id: string; name: string }[];
}

interface SubjectGroupFull {
    id: string | number;
    name: string;
    group_name?: string;
    school_class_id?: string | number;
    subjects?: { id: string | number; name: string; code?: string; type?: string }[];
    sections?: { id: string | number; name: string; pivot?: { subject_group_id: number; section_id: number } }[];
}

function CardSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-3 p-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-muted/60" />
                        <div className="h-4 w-1/3 rounded bg-muted/60" />
                    </div>
                    <div className="h-10 bg-muted/30 rounded-xl" />
                </div>
            ))}
        </div>
    );
}

export default function CopyOldLessonsPage() {
    const { toast } = useToast();
    const [classes, setClasses] = useState<OptionItem[]>([]);
    const [allSections, setAllSections] = useState<OptionItem[]>([]);
    const [subjects, setSubjects] = useState<OptionItem[]>([]);
    const [sessions, setSessions] = useState<OptionItem[]>([]);

    // Separate subject groups for From and To criteria
    const [fromSubjectGroups, setFromSubjectGroups] = useState<SubjectGroupFull[]>([]);
    const [toSubjectGroups, setToSubjectGroups] = useState<SubjectGroupFull[]>([]);

    // Filtered subjects per criteria
    const [fromFilteredSubjects, setFromFilteredSubjects] = useState<OptionItem[]>([]);
    const [toFilteredSubjects, setToFilteredSubjects] = useState<OptionItem[]>([]);

    const [sourceLessons, setSourceLessons] = useState<Lesson[]>([]);
    const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [copying, setCopying] = useState(false);

    // Filter States
    const [fromCriteria, setFromCriteria] = useState({
        session: "",
        class_id: "",
        class_name: "",
        section: "",
        subject_group: "",
        subject: ""
    });

    const [toCriteria, setToCriteria] = useState({
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
        const apiData = res.data as { data?: unknown; success?: boolean } | unknown[] | undefined;
        if (Array.isArray(apiData)) return apiData as OptionItem[];
        const nested = apiData as { data?: unknown };
        if (nested && Array.isArray(nested.data)) return nested.data as OptionItem[];
        return [];
    };

    const fetchInitialData = async () => {
        try {
            const [classesRes, sectionsRes, subjectsRes, sessionsRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/sections?with_class=true&no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subjects?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/system-setting/sessions').catch(() => ({ data: { data: [] } }))
            ]);

            setClasses(extractData(classesRes));
            setAllSections(extractData(sectionsRes));
            setSubjects(extractData(subjectsRes));

            const sessionList = extractData(sessionsRes);
            setSessions(sessionList);
            const active = sessionList.find((s: any) => s.is_active);
            if (active) {
                setFromCriteria(prev => ({ ...prev, session: active.session || "" }));
            } else if (sessionList.length > 0) {
                setFromCriteria(prev => ({ ...prev, session: sessionList[0].session || "" }));
            }
        } catch (error) {
            console.error("Failed to load initial dropdowns", error);
        }
    };

    const fetchFilteredSubjectGroups = async (classId: string, sectionName: string, target: 'from' | 'to') => {
        const params: Record<string, string> = { no_paginate: 'true' };
        if (classId) params.school_class_id = classId;
        if (classId && sectionName) {
            const sec = allSections.find((s) => s.name === sectionName && String(s.school_class_id) === String(classId));
            if (sec) params.section_id = String(sec.id);
        }
        try {
            const res = await api.get('/academics/subject-groups', { params });
            const rawData = res.data?.data || res.data || [];
            const list = Array.isArray(rawData) ? rawData : [];
            if (target === 'from') {
                setFromSubjectGroups(list);
                setFromFilteredSubjects([]);
            } else {
                setToSubjectGroups(list);
                setToFilteredSubjects([]);
            }
        } catch {
            if (target === 'from') {
                setFromSubjectGroups([]);
                setFromFilteredSubjects([]);
            } else {
                setToSubjectGroups([]);
                setToFilteredSubjects([]);
            }
        }
    };

    const getSubjectsForGroup = (groupName: string, groups: SubjectGroupFull[]): OptionItem[] => {
        const group = groups.find(
            (g) => g.name === groupName || g.group_name === groupName
        );
        if (group?.subjects && group.subjects.length > 0) {
            return group.subjects.map((s) => ({
                id: s.id,
                name: s.name,
            }));
        }
        return subjects;
    };

    const handleFromCriteriaChange = (field: string, value: string) => {
        const prev = fromCriteria;
        const updated = { ...prev, [field]: value };

        if (field === 'class_name') {
            const cls = classes.find((c) => c.name === value);
            updated.class_id = cls?.id?.toString() ?? '';
            updated.section = '';
            updated.subject_group = '';
            updated.subject = '';
        }
        if (field === 'section') {
            updated.subject_group = '';
            updated.subject = '';
        }
        if (field === 'subject_group') {
            updated.subject = '';
        }

        setFromCriteria(updated);

        if (field === 'class_name') {
            fetchFilteredSubjectGroups(updated.class_id, '', 'from');
        }
        if (field === 'section') {
            fetchFilteredSubjectGroups(updated.class_id, value, 'from');
        }
        if (field === 'subject_group') {
            setFromFilteredSubjects(getSubjectsForGroup(value, fromSubjectGroups));
        }
    };

    const handleToCriteriaChange = (field: string, value: string) => {
        const prev = toCriteria;
        const updated = { ...prev, [field]: value };

        if (field === 'class_name') {
            const cls = classes.find((c) => c.name === value);
            updated.class_id = cls?.id?.toString() ?? '';
            updated.section = '';
            updated.subject_group = '';
            updated.subject = '';
        }
        if (field === 'section') {
            updated.subject_group = '';
            updated.subject = '';
        }
        if (field === 'subject_group') {
            updated.subject = '';
        }

        setToCriteria(updated);

        if (field === 'class_name') {
            fetchFilteredSubjectGroups(updated.class_id, '', 'to');
        }
        if (field === 'section') {
            fetchFilteredSubjectGroups(updated.class_id, value, 'to');
        }
        if (field === 'subject_group') {
            setToFilteredSubjects(getSubjectsForGroup(value, toSubjectGroups));
        }
    };

    const handleSearch = async () => {
        if (!fromCriteria.session || !fromCriteria.class_name || !fromCriteria.section || !fromCriteria.subject_group || !fromCriteria.subject) {
            toast({ title: "Error", description: "Please select all 'From' criteria", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/lesson-plan/topics');
            const allTopics: RawTopic[] = response.data?.data || response.data || [];

            // Filter based on fromCriteria
            const filtered = allTopics.filter(t =>
                t.className === fromCriteria.class_name &&
                t.section === fromCriteria.section &&
                t.subjectGroup === fromCriteria.subject_group &&
                t.subject === fromCriteria.subject
            ).map(t => ({
                id: t.id,
                name: t.lesson,
                topics: (t.topics || []).map((topic) => ({
                    id: topic.id,
                    name: topic.name
                }))
            }));

            setSourceLessons(filtered);
            setSelectedTopicIds([]);
            if (filtered.length === 0) {
                toast({ title: "Info", description: "No lessons found for selected criteria" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to fetch source lessons", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const allTopicIds = sourceLessons.flatMap(l => l.topics.map(t => t.id));

    const handleSelectAllTopics = () => {
        setSelectedTopicIds(allTopicIds);
    };

    const handleDeselectAllTopics = () => {
        setSelectedTopicIds([]);
    };

    const toggleLessonAll = (lesson: Lesson) => {
        const lessonTopicIds = lesson.topics.map(t => t.id);
        const allSelected = lessonTopicIds.every(id => selectedTopicIds.includes(id));
        if (allSelected) {
            setSelectedTopicIds(prev => prev.filter(id => !lessonTopicIds.includes(id)));
        } else {
            setSelectedTopicIds(prev => Array.from(new Set([...prev, ...lessonTopicIds])));
        }
    };

    const toggleTopic = (id: string) => {
        setSelectedTopicIds(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    const handleCopy = async () => {
        if (selectedTopicIds.length === 0) {
            toast({ title: "Validation Error", description: "Please select at least one topic to copy", variant: "destructive" });
            return;
        }

        if (!toCriteria.class_name || !toCriteria.section || !toCriteria.subject_group || !toCriteria.subject) {
            toast({ title: "Validation Error", description: "Please select all 'Target' criteria", variant: "destructive" });
            return;
        }

        setCopying(true);
        try {
            await api.post('/lesson-plan/copy-topics', {
                from_class: fromCriteria.class_name,
                from_section: fromCriteria.section,
                from_subject_group: fromCriteria.subject_group,
                from_subject: fromCriteria.subject,
                to_class: toCriteria.class_name,
                to_section: toCriteria.section,
                to_subject_group: toCriteria.subject_group,
                to_subject: toCriteria.subject,
                topic_ids: selectedTopicIds
            });

            toast({ title: "Success", description: "Lessons and topics copied successfully" });
            setSelectedTopicIds([]);
        } catch {
            toast({ title: "Error", description: "Failed to copy lessons", variant: "destructive" });
        } finally {
            setCopying(false);
        }
    };

    return (
        <div className="space-y-6 font-sans p-4 sm:p-5 bg-gray-50/10 min-h-screen">
            {/* Top Section: Select Source Session Details */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Select Source Session Details</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Choose the source session, class &amp; subject to search old lessons</p>
                    </div>
                </CardHeader>

                <CardContent className="px-5 pb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                Session <span className="text-red-500">*</span>
                            </Label>
                            <Select value={fromCriteria.session} onValueChange={(val) => setFromCriteria({...fromCriteria, session: val})}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder="Select Session" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map(s => (
                                        <SelectItem key={s.id} value={s.session || ""}>{s.session}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                Class <span className="text-red-500">*</span>
                            </Label>
                            <Select value={fromCriteria.class_name} onValueChange={(val) => handleFromCriteriaChange('class_name', val)}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.name || ""}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                Section <span className="text-red-500">*</span>
                            </Label>
                            <Select value={fromCriteria.section} onValueChange={(val) => handleFromCriteriaChange('section', val)} disabled={!fromCriteria.class_name}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder="Select Section" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allSections.filter(s => String(s.school_class_id) === String(fromCriteria.class_id)).map(s => (
                                        <SelectItem key={s.id} value={s.name || ""}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                Subject Group <span className="text-red-500">*</span>
                            </Label>
                            <Select value={fromCriteria.subject_group} onValueChange={(val) => handleFromCriteriaChange('subject_group', val)} disabled={!fromCriteria.section}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder="Select Group" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fromSubjectGroups.map(g => (
                                        <SelectItem key={g.id} value={g.name || g.group_name || ""}>{g.name || g.group_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                Subject <span className="text-red-500">*</span>
                            </Label>
                            <Select value={fromCriteria.subject} onValueChange={(val) => handleFromCriteriaChange('subject', val)} disabled={!fromCriteria.subject_group}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {fromFilteredSubjects.length > 0
                                        ? fromFilteredSubjects.map(s => (
                                            <SelectItem key={s.id} value={s.name || ""}>{s.name}</SelectItem>
                                        ))
                                        : subjects.map(s => (
                                            <SelectItem key={s.id} value={s.name || ""}>{s.name}</SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end mt-5">
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

            {loading ? (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Copy className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Available Lessons &amp; Topics</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">Loading source lessons…</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <CardSkeleton count={3} />
                    </CardContent>
                </Card>
            ) : sourceLessons.length > 0 ? (
                <>
                    {/* Source Information Ribbon */}
                    <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 via-white to-amber-50/50 dark:from-indigo-950/40 dark:via-gray-900 dark:to-gray-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center text-white shadow-sm">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 font-bold uppercase">Source Lessons For:</span>
                                    <span className="font-black text-sm text-indigo-700 dark:text-indigo-300">{fromCriteria.subject}</span>
                                </div>
                                <p className="text-[11px] text-gray-500 font-medium">
                                    Session {fromCriteria.session} • {fromCriteria.class_name} • Section {fromCriteria.section} • {fromCriteria.subject_group}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold px-3 py-1">
                                {sourceLessons.length} Lessons Available
                            </Badge>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-bold px-3 py-1">
                                {selectedTopicIds.length} / {allTopicIds.length} Selected
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Column: Lesson & Topics Selection */}
                        <div className="w-full lg:w-2/3">
                            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                            <Copy className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Available Lessons &amp; Topics</CardTitle>
                                            <p className="text-[11px] text-gray-500 mt-1">
                                                {sourceLessons.length} lesson{sourceLessons.length === 1 ? '' : 's'} • {allTopicIds.length} total topics
                                            </p>
                                        </div>
                                    </div>

                                    {/* Select all / clear buttons */}
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSelectAllTopics}
                                            className="h-8 text-[10.5px] font-bold text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 rounded-lg"
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleDeselectAllTopics}
                                            className="h-8 text-[10.5px] font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-2.5"
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-5 space-y-5">
                                    {sourceLessons.map((lesson, index) => {
                                        const isFirst = index === 0;
                                        const isLast = index === sourceLessons.length - 1;
                                        const lessonTopicIds = lesson.topics.map(t => t.id);
                                        const allLessonSelected = lessonTopicIds.length > 0 && lessonTopicIds.every(id => selectedTopicIds.includes(id));
                                        const someLessonSelected = lessonTopicIds.some(id => selectedTopicIds.includes(id));

                                        return (
                                            <div
                                                key={lesson.id}
                                                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/90 shadow-2xs overflow-hidden"
                                            >
                                                {/* Lesson Header Banner */}
                                                <div
                                                    onClick={() => toggleLessonAll(lesson)}
                                                    className="p-3.5 bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-indigo-50/30 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                "h-7 w-7 rounded-xl flex items-center justify-center font-black text-xs shadow-2xs shrink-0",
                                                                allLessonSelected
                                                                    ? "bg-emerald-500 text-white"
                                                                    : isFirst
                                                                    ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white"
                                                                    : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                                            )}
                                                        >
                                                            {allLessonSelected ? <Check className="h-4 w-4 stroke-[3]" /> : index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                                                    Step {index + 1}
                                                                </span>
                                                                {isFirst && (
                                                                    <span className="text-[8.5px] bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 px-1.5 py-0.5 rounded font-bold border border-orange-200 dark:border-orange-800">
                                                                        Initial
                                                                    </span>
                                                                )}
                                                                {isLast && sourceLessons.length > 1 && (
                                                                    <span className="text-[8.5px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800">
                                                                        Final Step
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                                                                {lesson.name}
                                                            </h4>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] font-bold border-gray-200 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                            {lesson.topics.filter(t => selectedTopicIds.includes(t.id)).length} / {lesson.topics.length} Selected
                                                        </Badge>
                                                        <Checkbox
                                                            checked={allLessonSelected ? true : someLessonSelected ? "indeterminate" : false}
                                                            onCheckedChange={() => toggleLessonAll(lesson)}
                                                            className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-600"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Topics Branch List */}
                                                <div className="p-3 sm:p-4 space-y-2">
                                                    {lesson.topics.length === 0 ? (
                                                        <div className="py-2 text-center text-xs text-gray-400 italic">
                                                            No topics under this lesson
                                                        </div>
                                                    ) : (
                                                        <div className="relative pl-4 space-y-2 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1.5px] before:border-l before:border-dashed before:border-indigo-200 dark:before:border-indigo-800">
                                                            {lesson.topics.map((topic, tIdx) => {
                                                                const isChecked = selectedTopicIds.includes(topic.id);
                                                                return (
                                                                    <div
                                                                        key={topic.id}
                                                                        onClick={() => toggleTopic(topic.id)}
                                                                        className={cn(
                                                                            "relative flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                                                                            isChecked
                                                                                ? "bg-indigo-50/50 border-indigo-300 dark:bg-indigo-950/30 dark:border-indigo-700 shadow-2xs"
                                                                                : "bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 hover:border-indigo-200"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                                            <span className="text-gray-300 font-bold hidden sm:inline">└──</span>
                                                                            <Checkbox
                                                                                id={topic.id}
                                                                                checked={isChecked}
                                                                                onCheckedChange={() => toggleTopic(topic.id)}
                                                                                className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-600 shadow-2xs"
                                                                            />
                                                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                                                                                <span className="text-gray-400 mr-1 text-[10px]">#{index + 1}.{tIdx + 1}</span>
                                                                                {topic.name}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Target Subject Selection */}
                        <div className="w-full lg:w-1/3">
                            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                        <ArrowRight className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Target Selection</CardTitle>
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            {selectedTopicIds.length} topic{selectedTopicIds.length === 1 ? '' : 's'} chosen to copy
                                        </p>
                                    </div>
                                </CardHeader>

                                <CardContent className="px-5 pb-5 space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            Target Class <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={toCriteria.class_name} onValueChange={(val) => handleToCriteriaChange('class_name', val)}>
                                            <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                                <SelectValue placeholder="Select Target Class" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classes.map(c => (
                                                    <SelectItem key={c.id} value={c.name || ""}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            Target Section <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={toCriteria.section} onValueChange={(val) => handleToCriteriaChange('section', val)} disabled={!toCriteria.class_name}>
                                            <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                                <SelectValue placeholder="Select Target Section" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {allSections.filter(s => String(s.school_class_id) === String(toCriteria.class_id)).map(s => (
                                                    <SelectItem key={s.id} value={s.name || ""}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            Target Subject Group <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={toCriteria.subject_group} onValueChange={(val) => handleToCriteriaChange('subject_group', val)} disabled={!toCriteria.section}>
                                            <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                                <SelectValue placeholder="Select Subject Group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {toSubjectGroups.map(g => (
                                                    <SelectItem key={g.id} value={g.name || g.group_name || ""}>{g.name || g.group_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            Target Subject <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={toCriteria.subject} onValueChange={(val) => handleToCriteriaChange('subject', val)} disabled={!toCriteria.subject_group}>
                                            <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                                <SelectValue placeholder="Select Target Subject" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {toFilteredSubjects.length > 0
                                                    ? toFilteredSubjects.map(s => (
                                                        <SelectItem key={s.id} value={s.name || ""}>{s.name}</SelectItem>
                                                    ))
                                                    : subjects.map(s => (
                                                        <SelectItem key={s.id} value={s.name || ""}>{s.name}</SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                                        <Button
                                            onClick={handleCopy}
                                            disabled={copying || selectedTopicIds.length === 0}
                                            className="btn-gradient w-full text-white h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex items-center justify-center gap-2"
                                        >
                                            {copying ? "Copying..." : <><Copy className="h-4 w-4" /> Copy Selected ({selectedTopicIds.length})</>}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-16 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl mb-4 text-indigo-500">
                        <Search className="h-8 w-8" />
                    </div>
                    <h3 className="text-gray-600 dark:text-gray-300 text-sm font-bold">Select source criteria</h3>
                    <p className="text-gray-400 text-xs mt-1">Session, Class, Section, Subject Group, and Subject required to search old lessons</p>
                </div>
            )}
        </div>
    );
}
