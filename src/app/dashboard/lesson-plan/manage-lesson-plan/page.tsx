"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
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
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { formatDate, toLocaleNumber, translateClassName, translateSectionName, translateSubjectName } from "@/lib/utils";
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

function CardSkeleton({ count = 7 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 space-y-3 bg-white/60 dark:bg-gray-800/50 backdrop-blur-xs animate-pulse shadow-xs">
                    <div className="h-10 rounded-xl bg-gray-100 dark:bg-gray-700/60" />
                    <div className="space-y-2 pt-2">
                        <div className="h-28 rounded-xl bg-gray-100/70 dark:bg-gray-700/40" />
                        <div className="h-28 rounded-xl bg-gray-100/70 dark:bg-gray-700/40" />
                    </div>
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
    rawClassName?: string;
    rawSection?: string;
    rawSubject?: string;
    school_class_id?: number | string;
    section_id?: number | string;
    subject_id?: number | string;
    subject_group_id?: number | string;
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

interface RawLessonGroup {
    id: string | number;
    className: string;
    section: string;
    subjectGroup?: string;
    subject: string;
    lessons: string[];
    lesson_ids?: (string | number)[];
}

interface RawTopicGroup {
    id: string | number;
    className: string;
    section: string;
    subjectGroup?: string;
    subject: string;
    lesson: string;
    topics: { id: string | number; name: string; is_completed?: boolean; completion_date?: string | null }[];
    topic_ids?: (string | number)[];
}

export default function ManageLessonPlanPage() {
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const tt = useTranslateToast();

    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
    const [classes, setClasses] = useState<{ id: number | string; name: string }[]>([]);
    const [sections, setSections] = useState<{ id: number | string; name: string; school_class_id?: number | string }[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("all");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
    const [startDate, setStartDate] = useState<Date>(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    });
    const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);
    const [loading, setLoading] = useState(false);

    // Lesson & Topic data for dropdowns
    const [allLessonGroups, setAllLessonGroups] = useState<RawLessonGroup[]>([]);
    const [allTopicGroups, setAllTopicGroups] = useState<RawTopicGroup[]>([]);
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

    // Helper normalizers
    const norm = (s?: string) => (s || "").trim().toLowerCase();
    const cleanSec = (s?: string) => (s || "").replace(/^section\s+/i, "").trim().toLowerCase();

    // Helper for localized day
    const getLocalizedDay = (day: string) => {
        const key = day.toLowerCase();
        const translated = t(key);
        return translated !== key ? translated : day;
    };

    // Helper to check if a date is today
    const isTodayDate = (dateStr: string) => {
        if (!dateStr) return false;
        const today = new Date();
        const target = new Date(dateStr);
        return today.getFullYear() === target.getFullYear() &&
               today.getMonth() === target.getMonth() &&
               today.getDate() === target.getDate();
    };

    // Quick jump to current week
    const handleTodayWeek = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        setStartDate(new Date(d.setDate(diff)));
    };

    // Available lessons for current selected slot filtered by subject, class, and section
    const availableLessons = useMemo(() => {
        if (!selectedSlot) return [];
        const targetSubj = norm(selectedSlot.lesson.rawSubject || selectedSlot.lesson.subject);
        const targetCls = norm(selectedSlot.lesson.rawClassName || selectedSlot.lesson.className.replace(/\s*\(.*\)$/, ""));
        const targetSec = cleanSec(selectedSlot.lesson.rawSection || selectedSlot.lesson.className.match(/\((.*?)\)/)?.[1]);

        // 1. Strict match: Subject + Class + Section
        let matched = allLessonGroups.filter(g => {
            const mSubj = norm(g.subject) === targetSubj;
            const mCls = norm(g.className) === targetCls;
            const mSec = !targetSec || cleanSec(g.section) === targetSec || cleanSec(g.section) === "";
            return mSubj && mCls && mSec;
        });

        // 2. Fallback: Subject + Class
        if (matched.length === 0) {
            matched = allLessonGroups.filter(g => {
                const mSubj = norm(g.subject) === targetSubj;
                const mCls = norm(g.className) === targetCls;
                return mSubj && mCls;
            });
        }

        // 3. Fallback: Subject only
        if (matched.length === 0) {
            matched = allLessonGroups.filter(g => norm(g.subject) === targetSubj);
        }

        const set = new Set<string>();
        matched.forEach(g => {
            (g.lessons || []).forEach(l => {
                if (l && l.trim()) set.add(l.trim());
            });
        });

        const list = Array.from(set).sort();
        if (formData.lesson && !list.includes(formData.lesson)) {
            return [formData.lesson, ...list];
        }
        return list;
    }, [selectedSlot, allLessonGroups, formData.lesson]);

    // Available topics for current selected slot & chosen lesson
    const availableTopics = useMemo(() => {
        if (!selectedSlot || !formData.lesson) return [];
        const targetSubj = norm(selectedSlot.lesson.rawSubject || selectedSlot.lesson.subject);
        const targetCls = norm(selectedSlot.lesson.rawClassName || selectedSlot.lesson.className.replace(/\s*\(.*\)$/, ""));
        const targetSec = cleanSec(selectedSlot.lesson.rawSection || selectedSlot.lesson.className.match(/\((.*?)\)/)?.[1]);
        const targetLes = norm(formData.lesson);

        // 1. Strict match: Lesson + Subject + Class + Section
        let matched = allTopicGroups.filter(g => {
            const mLes = norm(g.lesson) === targetLes;
            const mSubj = norm(g.subject) === targetSubj;
            const mCls = norm(g.className) === targetCls;
            const mSec = !targetSec || cleanSec(g.section) === targetSec || cleanSec(g.section) === "";
            return mLes && mSubj && mCls && mSec;
        });

        // 2. Fallback: Lesson + Subject + Class
        if (matched.length === 0) {
            matched = allTopicGroups.filter(g => {
                const mLes = norm(g.lesson) === targetLes;
                const mSubj = norm(g.subject) === targetSubj;
                const mCls = norm(g.className) === targetCls;
                return mLes && mSubj && mCls;
            });
        }

        // 3. Fallback: Lesson + Subject
        if (matched.length === 0) {
            matched = allTopicGroups.filter(g => {
                const mLes = norm(g.lesson) === targetLes;
                const mSubj = norm(g.subject) === targetSubj;
                return mLes && mSubj;
            });
        }

        // 4. Fallback: Lesson only
        if (matched.length === 0) {
            matched = allTopicGroups.filter(g => norm(g.lesson) === targetLes);
        }

        const set = new Set<string>();
        matched.forEach(g => {
            (g.topics || []).forEach(t => {
                const name = typeof t === "string" ? t : (t as { name: string })?.name;
                if (name && name.trim()) set.add(name.trim());
            });
        });

        const list = Array.from(set).sort();
        if (formData.topic && !list.includes(formData.topic)) {
            return [formData.topic, ...list];
        }
        return list;
    }, [selectedSlot, formData.lesson, allTopicGroups, formData.topic]);

    useEffect(() => {
        fetchTeachers();
        fetchClassesAndSections();
        fetchLessonsAndTopics();
    }, []);

    const fetchClassesAndSections = async () => {
        try {
            const [classRes, secRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true'),
                api.get('/academics/sections?with_class=true&no_paginate=true')
            ]);
            setClasses(classRes.data?.data?.data || classRes.data?.data || []);
            setSections(secRes.data?.data || secRes.data || []);
        } catch (error) {
            console.error("Failed to fetch classes/sections", error);
        }
    };

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
            const lessonsData: RawLessonGroup[] = lessonsRes.data?.data || lessonsRes.data || [];
            const topicsData: RawTopicGroup[] = topicsRes.data?.data || topicsRes.data || [];

            setAllLessonGroups(lessonsData);
            setAllTopicGroups(topicsData);
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

            const params: Record<string, string> = {
                staff_id: selectedTeacherId,
                start_date: formatLocalDate(startDate),
                end_date: formatLocalDate(endDate)
            };

            if (selectedClassId && selectedClassId !== "all") {
                params.school_class_id = selectedClassId;
            }
            if (selectedSectionId && selectedSectionId !== "all") {
                params.section_id = selectedSectionId;
            }

            const response = await api.get('/lesson-plan/manage-lesson-plan', { params });
            const serverData: DayPlan[] = response.data || [];
            setWeekPlan(serverData);
        } catch {
            tt.error("failed_to_fetch_lesson_plan");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTeacherId) fetchWeekPlan();
    }, [selectedTeacherId, startDate, selectedClassId, selectedSectionId]);

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
        fetchLessonsAndTopics();
    };

    const handleSave = async () => {
        if (!formData.lesson || !formData.topic) {
            tt.error("lesson_and_topic_are_required");
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

            tt.success("lesson_plan_saved_successfully");
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
        } catch {
            tt.error("failed_to_fetch_lesson_plan");
        }
    };

    const getWeekRangeString = () => {
        const end = new Date(startDate);
        end.setDate(startDate.getDate() + 6);
        return `${toLocaleNumber(formatDate(startDate), shortCode)} ${t("to") || "To"} ${toLocaleNumber(formatDate(end), shortCode)}`;
    };

    const totalLessons = weekPlan.reduce((acc, d) => acc + d.lessons.length, 0);
    const plannedLessons = weekPlan.reduce((acc, d) => acc + d.lessons.filter(l => Boolean(l.plan)).length, 0);

    return (
        <div className="space-y-6 font-sans p-4 sm:p-5 bg-gray-50/10 min-h-screen">
            {/* Top Card: Select Criteria */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                            {t("select_criteria") || "Select Criteria"}
                        </CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("x_teachers_available", { count: toLocaleNumber(teachers.length, shortCode) })}
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("teachers") || "Teachers"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                <SelectTrigger className="w-full h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none focus:ring-indigo-500">
                                    <SelectValue placeholder={t("select_teacher") || "Select Teacher"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.map(tOption => (
                                        <SelectItem key={tOption.id} value={tOption.id.toString()}>
                                            {tOption.name} ({toLocaleNumber(tOption.staff_id || "", shortCode)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("class")}
                            </Label>
                            <Select
                                value={selectedClassId}
                                onValueChange={(val) => {
                                    setSelectedClassId(val);
                                    setSelectedSectionId("all");
                                }}
                            >
                                <SelectTrigger className="w-full h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none focus:ring-indigo-500">
                                    <SelectValue placeholder={t("all_classes") || "All Classes"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all_classes") || "All Classes"}</SelectItem>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{translateClassName(c.name, shortCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("section")}
                            </Label>
                            <Select
                                value={selectedSectionId}
                                onValueChange={setSelectedSectionId}
                                disabled={selectedClassId === "all"}
                            >
                                <SelectTrigger className="w-full h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none focus:ring-indigo-500">
                                    <SelectValue placeholder={t("all_sections") || "All Sections"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all_sections") || "All Sections"}</SelectItem>
                                    {sections
                                        .filter(s => selectedClassId === "all" || String(s.school_class_id) === String(selectedClassId))
                                        .map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {translateSectionName(s.name, shortCode)}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Button onClick={fetchWeekPlan} className="btn-gradient text-white gap-2 h-10 w-full text-[11px] font-bold uppercase shadow-md shadow-orange-200/50 transition-all rounded-lg cursor-pointer">
                                <Search className="h-4 w-4" /> {t("search")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Timetable Card: Manage Lesson Plan */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ClipboardList className="h-5 w-5" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {t("manage_lesson_plan") || "Manage Lesson Plan"}
                                </CardTitle>
                                <span className="bg-indigo-100/70 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {toLocaleNumber(totalLessons, shortCode)} {t("lesson") || "Lessons"}
                                </span>
                                {plannedLessons > 0 && (
                                    <span className="bg-emerald-100/70 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {toLocaleNumber(plannedLessons, shortCode)} {t("plan_added") || "Plan Added"}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("x_total_lessons_this_week", { count: toLocaleNumber(totalLessons, shortCode) })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleTodayWeek}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 rounded-lg shadow-2xs"
                        >
                            {t("current_week") || "Current Week"}
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 overflow-x-auto">
                    {/* Week switcher header */}
                    <div className="flex justify-center items-center gap-4 sm:gap-6 mb-6 bg-gray-50/80 dark:bg-gray-800/60 p-3 rounded-2xl border border-gray-200/70 dark:border-gray-800 max-w-xl mx-auto shadow-2xs">
                        <Button
                            onClick={() => handleNavigate('prev')}
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-700 hover:text-indigo-600 transition-all shadow-xs bg-white/80 dark:bg-gray-800 cursor-pointer"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>

                        <div className="text-xs sm:text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            {getWeekRangeString()}
                        </div>

                        <Button
                            onClick={() => handleNavigate('next')}
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-700 hover:text-indigo-600 transition-all shadow-xs bg-white/80 dark:bg-gray-800 cursor-pointer"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* 7 Columns Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 min-w-[1300px]">
                        {loading ? (
                            <CardSkeleton count={7} />
                        ) : (
                            weekPlan.map((dayPlan) => {
                                const isToday = isTodayDate(dayPlan.date);

                                return (
                                    <div key={dayPlan.day} className="space-y-3 flex flex-col">
                                        {/* Day Column Header */}
                                        <div
                                            className={`p-3 rounded-2xl border transition-all text-center relative overflow-hidden shadow-2xs ${
                                                isToday
                                                    ? "bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/60 dark:to-gray-900 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20"
                                                    : "bg-gray-50/80 dark:bg-gray-800/60 border-gray-200/70 dark:border-gray-800"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <span className="text-[11px] font-black text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                                                    {getLocalizedDay(dayPlan.day)}
                                                </span>
                                                {isToday && (
                                                    <span className="bg-indigo-600 text-white text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded-full">
                                                        Today
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold">
                                                <span>{toLocaleNumber(formatDate(dayPlan.date), shortCode)}</span>
                                                <span className="text-indigo-600 dark:text-indigo-400">
                                                    {toLocaleNumber(dayPlan.lessons.length, shortCode)} {t("lesson") || "Lessons"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Lessons for the Day */}
                                        {dayPlan.lessons.length > 0 ? (
                                            <div className="space-y-3 flex-1">
                                                {dayPlan.lessons.map((lesson) => {
                                                    const hasPlan = Boolean(lesson.plan);

                                                    return (
                                                        <div
                                                            key={lesson.id}
                                                            onClick={hasPlan ? () => openDialog("view", dayPlan, lesson) : undefined}
                                                            className={`rounded-2xl border transition-all duration-200 p-3.5 bg-white dark:bg-gray-800/90 shadow-2xs hover:shadow-md group relative overflow-hidden ${
                                                                hasPlan
                                                                    ? "border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 cursor-pointer"
                                                                    : "border-gray-200 dark:border-gray-700/80 hover:border-indigo-300"
                                                            }`}
                                                        >
                                                            {/* Side indicator strip */}
                                                            <div
                                                                className={`absolute left-0 top-0 bottom-0 w-1 ${
                                                                    hasPlan ? "bg-emerald-500" : "bg-gradient-to-b from-orange-400 to-indigo-500"
                                                                }`}
                                                            />

                                                            <div className="space-y-2.5 pl-1.5">
                                                                {/* Top: Subject + Actions */}
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <h4 className="font-bold text-gray-800 dark:text-gray-100 text-xs leading-tight truncate">
                                                                                {translateSubjectName(lesson.subject, shortCode)}
                                                                            </h4>
                                                                        </div>
                                                                        <span className="inline-block mt-0.5 text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded">
                                                                            {lesson.subjectCode}
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        {hasPlan ? (
                                                                            <>
                                                                                <Button
                                                                                    onClick={(e) => { e.stopPropagation(); openDialog("edit", dayPlan, lesson); }}
                                                                                    size="icon"
                                                                                    className="h-6 w-6 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-2xs transition-transform active:scale-95 cursor-pointer"
                                                                                    title={t("edit_lesson_plan") || "Edit Lesson Plan"}
                                                                                >
                                                                                    <Pencil className="h-3 w-3" />
                                                                                </Button>
                                                                                <Button
                                                                                    onClick={(e) => { e.stopPropagation(); openDialog("view", dayPlan, lesson); }}
                                                                                    size="icon"
                                                                                    className="h-6 w-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition-transform active:scale-95 cursor-pointer"
                                                                                    title={t("view_lesson_plan") || "View Lesson Plan"}
                                                                                >
                                                                                    <Eye className="h-3 w-3" />
                                                                                </Button>
                                                                            </>
                                                                        ) : (
                                                                            <Button
                                                                                onClick={(e) => { e.stopPropagation(); openDialog("add", dayPlan, lesson); }}
                                                                                size="icon"
                                                                                className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
                                                                                title={t("add_lesson_plan") || "Add Lesson Plan"}
                                                                            >
                                                                                <Plus className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Time and Room Meta */}
                                                                <div className="space-y-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="h-3 w-3 text-emerald-500 shrink-0" />
                                                                            {toLocaleNumber(lesson.timeRange, shortCode)}
                                                                        </span>
                                                                        <span className="font-bold text-gray-700 dark:text-gray-300">
                                                                            {lesson.rawClassName ? translateClassName(lesson.rawClassName, shortCode) : translateClassName(lesson.className.split('(')[0].trim(), shortCode)}{lesson.rawSection ? ` (${translateSectionName(lesson.rawSection, shortCode)})` : lesson.className.includes('(') ? ` (${translateSectionName(lesson.className.match(/\((.*?)\)/)?.[1] || '', shortCode)})` : ''}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                                                                        <span>{toLocaleNumber(lesson.roomNo, shortCode)}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Planned status strip */}
                                                                {hasPlan ? (
                                                                    <div className="pt-2 border-t border-dashed border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-1">
                                                                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                            {t("plan_added") || "Plan Added"}
                                                                        </span>
                                                                        <span className="text-[9.5px] text-gray-400 truncate max-w-[120px] font-medium italic">
                                                                            {lesson.plan?.topic}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="pt-1 text-[9px] text-amber-600/90 dark:text-amber-400 font-bold flex items-center justify-between">
                                                                        <span>• {t("add_lesson_plan") || "No plan assigned"}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            /* Off Day Empty Card */
                                            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/30 p-6 flex flex-col items-center justify-center gap-2 text-center min-h-[140px] flex-1">
                                                <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                                    <CircleSlash className="h-4 w-4" />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                    {t("off_day") || "Off Day"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit/View Lesson Plan Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl rounded-3xl border-0 shadow-2xl p-0 overflow-hidden bg-white dark:bg-gray-900">
                    <DialogHeader className="relative p-6 sm:p-7 bg-gradient-to-r from-[#FF9800] via-[#8B5CF6] to-[#6366F1] text-white overflow-hidden">
                        <div className="absolute inset-0 opacity-15">
                            <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white blur-md" />
                            <div className="absolute -bottom-6 -left-6 h-36 w-36 rounded-full bg-white blur-md" />
                        </div>
                        <div className="relative">
                            <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 shadow-inner">
                                    {dialogMode === "view" ? <Eye className="h-5 w-5" /> : dialogMode === "edit" ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                </span>
                                {dialogMode === "view" ? (t("view_lesson_plan") || "View Lesson Plan") : dialogMode === "edit" ? (t("edit_lesson_plan") || "Edit Lesson Plan") : (t("add_lesson_plan") || "Add Lesson Plan")}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                {dialogMode === "view" ? "View lesson plan details" : dialogMode === "edit" ? "Edit lesson plan details" : "Add new lesson plan"}
                            </DialogDescription>

                            {/* Slot Meta Ribbon */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-md border border-white/20">
                                    <CalendarIcon className="h-3.5 w-3.5" />
                                    {selectedSlot ? getLocalizedDay(selectedSlot.dayPlan.day) : ""}, {selectedSlot?.dayPlan.date ? toLocaleNumber(formatDate(selectedSlot.dayPlan.date), shortCode) : ""}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-md border border-white/20">
                                    <FileText className="h-3.5 w-3.5" />
                                    {selectedSlot?.lesson.subject ? translateSubjectName(selectedSlot.lesson.subject, shortCode) : ""}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-md border border-white/20">
                                    <ClipboardList className="h-3.5 w-3.5" />
                                    {selectedSlot?.lesson.rawClassName ? translateClassName(selectedSlot.lesson.rawClassName, shortCode) : selectedSlot?.lesson.className ? translateClassName(selectedSlot.lesson.className.split('(')[0].trim(), shortCode) : ""}
                                    {selectedSlot?.lesson.rawSection ? ` (${translateSectionName(selectedSlot.lesson.rawSection, shortCode)})` : selectedSlot?.lesson.className && selectedSlot.lesson.className.includes('(') ? ` (${translateSectionName(selectedSlot.lesson.className.match(/\((.*?)\)/)?.[1] || '', shortCode)})` : ''}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-md border border-white/20">
                                    <Clock className="h-3.5 w-3.5" />
                                    {selectedSlot?.lesson.timeRange ? toLocaleNumber(selectedSlot.lesson.timeRange, shortCode) : ""}
                                </span>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 sm:p-7 space-y-5 max-h-[60vh] overflow-y-auto">
                        {/* Lesson & Topic Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                                    {t("lesson")} <span className="text-red-500">*</span>
                                </Label>
                                {dialogMode === "view" ? (
                                    <div className="h-11 flex items-center px-4 border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl text-sm text-gray-700 dark:text-gray-200 font-bold">
                                        {formData.lesson || "—"}
                                    </div>
                                ) : (
                                    <Select
                                        value={formData.lesson}
                                        onValueChange={(v) => setFormData({...formData, lesson: v, topic: ""})}
                                        disabled={lessonsLoading}
                                    >
                                        <SelectTrigger className="h-11 border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/50 rounded-xl text-sm focus:ring-indigo-500">
                                            <SelectValue placeholder={lessonsLoading ? (t("loading_lessons") || "Loading lessons...") : (t("select_lesson") || "Select lesson")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableLessons.length === 0 && (
                                                <div className="flex flex-col items-center gap-1 p-4 text-xs text-gray-400">
                                                    <FileText className="h-5 w-5 opacity-40" />
                                                    <span>{t("no_lessons_found_for_this_subject_class") || "No lessons found for this subject/class"}</span>
                                                </div>
                                            )}
                                            {availableLessons.map((name) => (
                                                <SelectItem key={name} value={name}>{name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                    <ClipboardList className="h-3.5 w-3.5 text-indigo-500" />
                                    {t("topic")} <span className="text-red-500">*</span>
                                </Label>
                                {dialogMode === "view" ? (
                                    <div className="h-11 flex items-center px-4 border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl text-sm text-gray-700 dark:text-gray-200 font-bold">
                                        {formData.topic || "—"}
                                    </div>
                                ) : (
                                    <Select
                                        value={formData.topic}
                                        onValueChange={(v) => setFormData({...formData, topic: v})}
                                        disabled={!formData.lesson || lessonsLoading}
                                    >
                                        <SelectTrigger className="h-11 border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/50 rounded-xl text-sm focus:ring-indigo-500">
                                            <SelectValue placeholder={
                                                !formData.lesson ? (t("select_lesson_first") || "Select lesson first") : lessonsLoading ? (t("loading") || "Loading...") : (t("select_topic") || "Select topic")
                                            } />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTopics.length === 0 && formData.lesson && (
                                                <div className="flex flex-col items-center gap-1 p-4 text-xs text-gray-400">
                                                    <ClipboardList className="h-5 w-5 opacity-40" />
                                                    <span>{t("no_topics_for_this_lesson") || "No topics for this lesson"}</span>
                                                </div>
                                            )}
                                            {availableTopics.map((name) => (
                                                <SelectItem key={name} value={name}>{name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {t("details") || "Details"}
                                </span>
                                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        {t("sub_topic") || "Sub Topic"}
                                    </Label>
                                    <Input
                                        readOnly={dialogMode === "view"}
                                        value={formData.sub_topic}
                                        onChange={(e) => setFormData({...formData, sub_topic: e.target.value})}
                                        placeholder={t("enter_sub_topic") || "Enter sub topic"}
                                        className="h-11 border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/50 rounded-xl focus:ring-indigo-500 text-xs sm:text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        {t("presentation") || "Presentation"}
                                    </Label>
                                    <Textarea
                                        readOnly={dialogMode === "view"}
                                        value={formData.presentation}
                                        onChange={(e) => setFormData({...formData, presentation: e.target.value})}
                                        placeholder={t("presentation_placeholder") || "How will you present this lesson?"}
                                        className="min-h-[90px] border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/50 rounded-xl focus:ring-indigo-500 p-4 resize-none text-xs sm:text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        {t("lesson_summary_objectives") || "Lesson Summary / Objectives"}
                                    </Label>
                                    <Textarea
                                        readOnly={dialogMode === "view"}
                                        value={formData.objectives}
                                        onChange={(e) => setFormData({...formData, objectives: e.target.value})}
                                        placeholder={t("objectives_placeholder") || "What should students achieve?"}
                                        className="min-h-[90px] border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/50 rounded-xl focus:ring-indigo-500 p-4 resize-none text-xs sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-5 sm:p-6 bg-gray-50/80 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                            {dialogMode !== "view" && (
                                <span className="flex items-center gap-1.5 font-medium">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                    {t("required_fields") || "Required fields"}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setIsDialogOpen(false)}
                                variant="outline"
                                className="h-10 px-6 rounded-xl text-xs font-bold uppercase tracking-wider border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            >
                                {dialogMode === "view" ? (t("close") || "Close") : (t("cancel") || "Cancel")}
                            </Button>
                            {dialogMode !== "view" && (
                                <Button
                                    onClick={handleSave}
                                    className="btn-gradient text-white h-10 px-8 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-orange-300/40 hover:shadow-xl transition-all cursor-pointer"
                                >
                                    {dialogMode === "edit" ? (t("update_plan") || "Update Plan") : (t("save_plan") || "Save Plan")}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
