"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import {
    Plus,
    Search,
    Pencil,
    Eye,
    ChevronLeft,
    ChevronRight,
    CircleSlash,
    Clock,
    MapPin,
    ClipboardList,
    FileText,
    Filter,
    Calendar as CalendarIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function CardSkeleton({ count = 6 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl border border-muted/30 p-4 space-y-3 bg-card animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-muted/60" />
                        <div className="space-y-2 flex-1">
                            <div className="h-3 w-1/2 rounded bg-muted/60" />
                            <div className="h-3 w-1/3 rounded bg-muted/60" />
                        </div>
                    </div>
                    <div className="h-3 w-full rounded bg-muted/60" />
                    <div className="h-3 w-3/4 rounded bg-muted/60" />
                </div>
            ))}
        </>
    );
}

interface TeacherOption {
    id: string | number;
    role?: string;
    name?: string;
    staff_id?: string | number;
}

interface LessonPlanItem {
    id: string; // Timetable ID
    subject: string;
    subjectCode: string;
    className: string;
    timeRange: string;
    roomNo: string;
    plan: {
        id: string;
        lesson: string;
        topic: string;
        sub_topic: string;
        presentation?: string;
        objectives?: string;
    } | null;
    actions: ("add" | "edit" | "report" | "view")[];
}

interface DayPlan {
    day: string;
    date: string;
    lessons: LessonPlanItem[];
}

interface LessonOption {
    name: string;
}

interface TopicOption {
    name: string;
    lesson: string;
}

export default function ManageLessonPlanPage() {
    const { toast } = useToast();
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
    const [startDate, setStartDate] = useState<Date>(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    });
    const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);
    const [loading, setLoading] = useState(false);

    // Lesson & Topic data for dropdowns
    const [lessonNames, setLessonNames] = useState<string[]>([]);
    const [topicOptions, setTopicOptions] = useState<TopicOption[]>([]);
    const [lessonsLoading, setLessonsLoading] = useState(false);

    // Form Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
    const [selectedSlot, setSelectedSlot] = useState<{ dayPlan: DayPlan; lesson: LessonPlanItem } | null>(null);
    const [formData, setFormData] = useState({
        lesson: "",
        topic: "",
        sub_topic: "",
        presentation: "",
        objectives: ""
    });

    // Filtered topics based on selected lesson
    const filteredTopics = formData.lesson
        ? topicOptions.filter(t => t.lesson === formData.lesson).map(t => t.name)
        : [];

    useEffect(() => {
        fetchTeachers();
        fetchLessonsAndTopics();
    }, []);

    const fetchTeachers = async () => {
        try {
            const response = await api.get('/hr/staff-directory', {
                params: { role: 'Teacher', no_paginate: true, active: 'all' }
            });
            let data: TeacherOption[] = response.data?.data || response.data || [];
            data = data.filter((u) => u.role === 'Teacher');
            setTeachers(data);
            if (data.length > 0) setSelectedTeacherId(data[0].id.toString());
        } catch (error) {
            console.error("Failed to fetch teachers", error);
        }
    };

    const fetchLessonsAndTopics = async () => {
        setLessonsLoading(true);
        try {
            const [lessonsRes, topicsRes] = await Promise.all([
                api.get('/lesson-plan/lessons').catch(() => ({ data: [] })),
                api.get('/lesson-plan/topics').catch(() => ({ data: [] }))
            ]);
            const lessonsData = lessonsRes.data?.data || lessonsRes.data || [];
            const topicsData = topicsRes.data?.data || topicsRes.data || [];

            const names = new Set<string>();
            lessonsData.forEach((g: any) => {
                (g.lessons || []).forEach((l: string) => names.add(l));
            });
            setLessonNames(Array.from(names).sort());

            const topics: TopicOption[] = [];
            topicsData.forEach((g: any) => {
                (g.topics || []).forEach((t: any) => {
                    if (t.name) topics.push({ name: t.name, lesson: g.lesson || '' });
                });
            });
            setTopicOptions(topics);
        } catch (error) {
            console.error("Failed to fetch lessons/topics", error);
        } finally {
            setLessonsLoading(false);
        }
    };

    const formatLocalDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const fetchWeekPlan = async () => {
        if (!selectedTeacherId) return;
        setLoading(true);
        setWeekPlan([]);
        try {
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);

            const response = await api.get('/lesson-plan/manage-lesson-plan', {
                params: {
                    staff_id: selectedTeacherId,
                    start_date: formatLocalDate(startDate),
                    end_date: formatLocalDate(endDate)
                }
            });
            const serverData: DayPlan[] = response.data || [];
            setWeekPlan(serverData);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch lesson plan", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTeacherId) fetchWeekPlan();
    }, [selectedTeacherId, startDate]);

    const handleNavigate = (direction: 'next' | 'prev') => {
        const newDate = new Date(startDate);
        newDate.setDate(startDate.getDate() + (direction === 'next' ? 7 : -7));
        setStartDate(newDate);
    };

    const openDialog = (mode: "add" | "edit" | "view", dayPlan: DayPlan, lesson: LessonPlanItem) => {
        setDialogMode(mode);
        setSelectedSlot({ dayPlan, lesson });
        if (mode === "add") {
            setFormData({ lesson: "", topic: "", sub_topic: "", presentation: "", objectives: "" });
        } else {
            setFormData({
                lesson: lesson.plan?.lesson || "",
                topic: lesson.plan?.topic || "",
                sub_topic: lesson.plan?.sub_topic || "",
                presentation: lesson.plan?.presentation || "",
                objectives: lesson.plan?.objectives || ""
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.lesson || !formData.topic) {
            toast({ title: "Validation Error", description: "Lesson and Topic are required", variant: "destructive" });
            return;
        }

        if (!selectedSlot) return;

        const dayName = selectedSlot.dayPlan.day;
        const lessonId = selectedSlot.lesson.id;
        const savedData = { ...formData };
        let savedPlanId: string | null = null;

        try {
            const payload = {
                ...formData,
                class_timetable_id: lessonId,
                date: selectedSlot.dayPlan.date
            };

            if (dialogMode === "edit" && selectedSlot.lesson.plan?.id) {
                savedPlanId = selectedSlot.lesson.plan.id;
                await api.put(`/lesson-plan/manage-lesson-plan/${savedPlanId}`, payload);
            } else {
                const res = await api.post('/lesson-plan/manage-lesson-plan', payload);
                savedPlanId = res.data?.data?.id || res.data?.id || null;
            }

            toast({ title: "Success", description: "Lesson plan saved successfully" });
            setIsDialogOpen(false);

            // Apply plan to current state immediately (so edit/view buttons show)
            setWeekPlan(prev => prev.map(dp =>
                dp.day === dayName
                    ? {
                        ...dp,
                        lessons: dp.lessons.map(l =>
                            l.id === lessonId
                                ? {
                                    ...l,
                                    plan: {
                                        id: savedPlanId || `opt-${Date.now()}`,
                                        lesson: savedData.lesson,
                                        topic: savedData.topic,
                                        sub_topic: savedData.sub_topic,
                                        presentation: savedData.presentation,
                                        objectives: savedData.objectives
                                    }
                                }
                                : l
                        )
                    }
                    : dp
            ));

            // Refresh from server — merge will preserve this plan if GET returns no plan
            await fetchWeekPlan();
        } catch (error) {
            const msg = (error as any)?.response?.data?.message || "Failed to save lesson plan";
            toast({ title: "Error", description: msg, variant: "destructive" });
        }
    };

    const getWeekRangeString = () => {
        const end = new Date(startDate);
        end.setDate(startDate.getDate() + 6);
        return `${formatDate(startDate)} To ${formatDate(end)}`;
    };

    const totalLessons = weekPlan.reduce((acc, d) => acc + d.lessons.length, 0);

    return (
        <div className="p-4 space-y-6 font-sans bg-gray-50/30 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800">Manage Lesson Plan</h1>
            </div>

            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Select Criteria</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{teachers.length} teacher{teachers.length === 1 ? '' : 's'} available</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-3 max-w-2xl">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            Teachers <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-3 items-center">
                            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                <SelectTrigger className="w-full h-11 border-gray-100 bg-gray-50/30 text-sm rounded-lg focus:ring-indigo-500">
                                    <SelectValue placeholder="Select Teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.map(t => (
                                        <SelectItem key={t.id} value={t.id.toString()}>{t.name} ({t.staff_id})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={fetchWeekPlan} className="btn-gradient text-white gap-2 h-11 px-8 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full">
                                <Search className="h-4 w-4" /> Search
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <ClipboardList className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Weekly Lesson Plan</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{totalLessons} total lesson{totalLessons === 1 ? '' : 's'} this week</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 overflow-x-auto">
                    <div className="flex justify-center items-center gap-8 mb-8 bg-gray-50/50 p-4 rounded-lg border border-gray-50">
                        <Button onClick={() => handleNavigate('prev')} variant="ghost" size="icon" className="h-10 w-10 text-gray-400 rounded-full hover:bg-white hover:text-indigo-600 transition-all shadow-sm bg-white">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <div className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-3">
                            <CalendarIcon className="h-5 w-5 text-indigo-500" />
                            {getWeekRangeString()}
                        </div>
                        <Button onClick={() => handleNavigate('next')} variant="ghost" size="icon" className="h-10 w-10 text-gray-400 rounded-full hover:bg-white hover:text-indigo-600 transition-all shadow-sm bg-white">
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 min-w-[1400px]">
                        {loading ? (
                            <CardSkeleton count={7} />
                        ) : (
                            weekPlan.map((dayPlan) => (
                                <div key={dayPlan.day} className="space-y-4">
                                    <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100 text-center shadow-sm">
                                        <div className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">{dayPlan.day}</div>
                                        <div className="text-[10px] text-indigo-400 font-bold mt-1 tracking-tighter">{formatDate(dayPlan.date)}</div>
                                    </div>

                                    {dayPlan.lessons.length > 0 ? (
                                        <div className="space-y-4">
                                            {dayPlan.lessons.map((lesson) => (
                                                <div
                                                    key={lesson.id}
                                                    className={`bg-white border border-gray-50 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border-l-4 ${lesson.plan ? "border-l-emerald-500 cursor-pointer" : "border-l-indigo-500"}`}
                                                    onClick={lesson.plan ? () => openDialog("view", dayPlan, lesson) : undefined}
                                                >
                                                    <div className="p-3 space-y-2.5">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-start gap-2 min-w-0">
                                                                <div className="bg-indigo-50 p-1.5 rounded-lg shrink-0">
                                                                    <ClipboardList className="h-4 w-4 text-indigo-500" />
                                                                </div>
                                                                <div className="text-[11px] leading-tight pt-0.5 min-w-0">
                                                                    <div className="font-bold text-gray-800 uppercase tracking-tight truncate">{lesson.subject}</div>
                                                                    <div className="text-indigo-400 font-bold text-[9px]">{lesson.subjectCode}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1 shrink-0">
                                                                {lesson.plan ? (
                                                                    <>
                                                                        <Button
                                                                            onClick={(e) => { e.stopPropagation(); openDialog("edit", dayPlan, lesson); }}
                                                                            size="icon"
                                                                            className="h-6 w-6 bg-amber-500 hover:bg-amber-600 text-white rounded-md shadow-sm"
                                                                            title="Edit Lesson Plan"
                                                                        >
                                                                            <Pencil className="h-3 w-3" />
                                                                        </Button>
                                                                        <Button
                                                                            onClick={(e) => { e.stopPropagation(); openDialog("view", dayPlan, lesson); }}
                                                                            size="icon"
                                                                            className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow-sm"
                                                                            title="View Lesson Plan"
                                                                        >
                                                                            <Eye className="h-3 w-3" />
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <Button
                                                                        onClick={(e) => { e.stopPropagation(); openDialog("add", dayPlan, lesson); }}
                                                                        size="icon"
                                                                        className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white rounded-lg shadow-md"
                                                                        title="Add Lesson Plan"
                                                                    >
                                                                        <Plus className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3 text-emerald-500" />
                                                                {lesson.timeRange}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3 text-rose-500" />
                                                                {lesson.roomNo}
                                                            </span>
                                                            <span className="ml-auto font-medium text-gray-700">{lesson.className}</span>
                                                        </div>

                                                        {lesson.plan && (
                                                            <div className="pt-1.5 border-t border-dashed border-gray-100 flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5 text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                    Plan Added
                                                                </div>
                                                                <div className="text-[9px] text-gray-400 truncate max-w-[140px] italic">
                                                                    {lesson.plan.topic}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-red-50/30 border border-dashed border-red-100 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-center min-h-[150px]">
                                            <CircleSlash className="h-6 w-6 text-red-300" />
                                            <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Off Day</div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit/View Lesson Plan Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl rounded-xl border-0 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="relative p-6 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white" />
                            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white" />
                        </div>
                        <div className="relative">
                            <DialogTitle className="text-lg font-bold flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                                    {dialogMode === "view" ? <Eye className="h-5 w-5" /> : dialogMode === "edit" ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                </span>
                                {dialogMode === "view" ? "View Lesson Plan" : dialogMode === "edit" ? "Edit Lesson Plan" : "Add Lesson Plan"}
                            </DialogTitle>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm">
                                    <CalendarIcon className="h-3 w-3" />
                                    {selectedSlot?.dayPlan.day}, {selectedSlot?.dayPlan.date ? formatDate(selectedSlot.dayPlan.date) : ""}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm">
                                    <FileText className="h-3 w-3" />
                                    {selectedSlot?.lesson.subject}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm">
                                    <ClipboardList className="h-3 w-3" />
                                    {selectedSlot?.lesson.className}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm">
                                    <Clock className="h-3 w-3" />
                                    {selectedSlot?.lesson.timeRange}
                                </span>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto bg-white">
                        {/* Lesson & Topic */}
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                    <FileText className="h-3 w-3 text-indigo-500" />
                                    Lesson <span className="text-red-500">*</span>
                                </Label>
                                {dialogMode === "view" ? (
                                    <div className="h-11 flex items-center px-4 border border-gray-100 bg-gray-50/50 rounded-lg text-sm text-gray-700 font-medium">
                                        {formData.lesson || "—"}
                                    </div>
                                ) : (
                                    <Select
                                        value={formData.lesson}
                                        onValueChange={(v) => setFormData({...formData, lesson: v, topic: ""})}
                                        disabled={lessonsLoading}
                                    >
                                        <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-400 transition-all">
                                            <SelectValue placeholder={lessonsLoading ? "Loading lessons..." : "Select lesson"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {lessonNames.length === 0 && (
                                                <div className="flex flex-col items-center gap-1 p-4 text-xs text-gray-400">
                                                    <FileText className="h-5 w-5 opacity-40" />
                                                    <span>No lessons found</span>
                                                </div>
                                            )}
                                            {lessonNames.map((name) => (
                                                <SelectItem key={name} value={name}>{name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                    <ClipboardList className="h-3 w-3 text-indigo-500" />
                                    Topic <span className="text-red-500">*</span>
                                </Label>
                                {dialogMode === "view" ? (
                                    <div className="h-11 flex items-center px-4 border border-gray-100 bg-gray-50/50 rounded-lg text-sm text-gray-700 font-medium">
                                        {formData.topic || "—"}
                                    </div>
                                ) : (
                                    <Select
                                        value={formData.topic}
                                        onValueChange={(v) => setFormData({...formData, topic: v})}
                                        disabled={!formData.lesson || lessonsLoading}
                                    >
                                        <SelectTrigger className="h-11 border-gray-100 bg-gray-50/30 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-400 transition-all">
                                            <SelectValue placeholder={
                                                !formData.lesson ? "Select lesson first" : lessonsLoading ? "Loading..." : "Select topic"
                                            } />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredTopics.length === 0 && formData.lesson && (
                                                <div className="flex flex-col items-center gap-1 p-4 text-xs text-gray-400">
                                                    <ClipboardList className="h-5 w-5 opacity-40" />
                                                    <span>No topics for this lesson</span>
                                                </div>
                                            )}
                                            {filteredTopics.map((name) => (
                                                <SelectItem key={name} value={name}>{name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details</span>
                                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <span className="text-gray-300">~</span>
                                        Sub Topic
                                    </Label>
                                    <Input
                                        readOnly={dialogMode === "view"}
                                        value={formData.sub_topic}
                                        onChange={(e) => setFormData({...formData, sub_topic: e.target.value})}
                                        placeholder="Enter sub topic"
                                        className="h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 focus:border-indigo-400 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <span className="text-gray-300">~</span>
                                        Presentation
                                    </Label>
                                    <Textarea
                                        readOnly={dialogMode === "view"}
                                        value={formData.presentation}
                                        onChange={(e) => setFormData({...formData, presentation: e.target.value})}
                                        placeholder="How will you present this lesson?"
                                        className="min-h-[90px] border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 focus:border-indigo-400 transition-all p-4 resize-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <span className="text-gray-300">~</span>
                                        Lesson Summary / Objectives
                                    </Label>
                                    <Textarea
                                        readOnly={dialogMode === "view"}
                                        value={formData.objectives}
                                        onChange={(e) => setFormData({...formData, objectives: e.target.value})}
                                        placeholder="What should students achieve?"
                                        className="min-h-[90px] border-gray-100 bg-gray-50/30 rounded-lg focus:ring-indigo-500 focus:border-indigo-400 transition-all p-4 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            {dialogMode !== "view" && (
                                <span className="flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                                    Required fields
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setIsDialogOpen(false)}
                                variant="outline"
                                className="h-10 px-6 rounded-lg text-[11px] font-bold uppercase tracking-widest border-gray-200 hover:bg-gray-100 transition-all"
                            >
                                {dialogMode === "view" ? "Close" : "Cancel"}
                            </Button>
                            {dialogMode !== "view" && (
                                <Button
                                    onClick={handleSave}
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white h-10 px-8 rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-orange-200/50 transition-all duration-300"
                                >
                                    {dialogMode === "edit" ? "Update Plan" : "Save Plan"}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
