"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    Printer,
    Copy,
    Loader2,
    BookOpen,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Circle,
    GraduationCap,
    Route,
    Milestone,
    Sparkles,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

type Topic = {
    id: number;
    title: string;
    is_completed: boolean;
    completion_date: string | null;
};

type Lesson = {
    title: string;
    completion: number;
    topics: Topic[];
};

type SubjectSyllabus = {
    subject: string;
    completion: number;
    total_topics: number;
    completed_topics: number;
    lessons: Lesson[];
};

/* ── Animated donut ── */
function DonutChart({ percentage, color }: { percentage: number; color: string }) {
    const [animated, setAnimated] = useState(0);
    const radius = 42;
    const stroke = 14;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animated / 100) * circumference;

    useEffect(() => {
        const t = setTimeout(() => setAnimated(percentage), 120);
        return () => clearTimeout(t);
    }, [percentage]);

    return (
        <div className="relative flex items-center justify-center">
            <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
                <circle cx="55" cy="55" r={radius} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
                <circle
                    cx="55" cy="55" r={radius}
                    stroke={color}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="butt"
                    style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
            </svg>
            <span className="absolute text-[15px] font-bold text-gray-800">{animated}%</span>
        </div>
    );
}

/* ── Animated progress bar ── */
function ProgressBar({ value, color }: { value: number; color: string }) {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setWidth(value), 120);
        return () => clearTimeout(t);
    }, [value]);

    return (
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${width}%`, backgroundColor: color }}
            />
        </div>
    );
}

const SUBJECT_COLORS = [
    "#6366F1", "#FF9800", "#10b981", "#f43f5e", "#3b82f6", "#a855f7", "#14b8a6",
];

function getColor(idx: number) {
    return SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
}

/* ── Hierarchical Step-by-Step Lesson Node ── */
function HierarchicalLessonNode({
    lesson,
    index,
    total,
    color,
    subjectIdx
}: {
    lesson: Lesson;
    index: number;
    total: number;
    color: string;
    subjectIdx: number;
}) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(true);
    const isFirst = index === 0;
    const isLast = index === total - 1;
    const isCompleted = lesson.completion === 100;

    return (
        <div className="relative flex items-start gap-3 group/step">
            {/* Step Milestone Circle */}
            <div
                className={cn(
                    "absolute -left-6 top-1 h-6 w-6 rounded-full flex items-center justify-center font-black text-[10px] shadow-2xs ring-4 ring-white dark:ring-gray-900 shrink-0 transition-transform group-hover/step:scale-110",
                    isCompleted
                        ? "bg-emerald-500 text-white"
                        : isFirst
                        ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white"
                        : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                )}
            >
                {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : index + 1}
            </div>

            {/* Step Card */}
            <div className="flex-1 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 rounded-2xl p-3.5 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-600 transition-all mb-3 hover:shadow-xs">
                {/* Lesson Header Row */}
                <div
                    onClick={() => setOpen((o) => !o)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer select-none"
                >
                    <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                <span>Lesson {index + 1}</span>
                                {isFirst && (
                                    <span className="text-[8.5px] bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 px-1.5 py-0.5 rounded font-bold border border-orange-200 dark:border-orange-800">
                                        Initial
                                    </span>
                                )}
                                {isLast && total > 1 && (
                                    <span className="text-[8.5px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800">
                                        Final Step
                                    </span>
                                )}
                            </span>
                            {lesson.topics.length > 0 && (
                                <Badge variant="outline" className="bg-gray-50 text-gray-500 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-[9.5px] font-bold py-0 px-2 h-4.5">
                                    {lesson.topics.length} Topic{lesson.topics.length === 1 ? "" : "s"}
                                </Badge>
                            )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                            {lesson.title}
                        </h4>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        <div className="w-24 sm:w-28">
                            <ProgressBar value={lesson.completion} color={color} />
                        </div>
                        <span className="text-xs font-black text-gray-700 dark:text-gray-300 w-10 text-right">
                            {lesson.completion}%
                        </span>
                        <div className="h-6 w-6 rounded-md bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center text-gray-400">
                            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </div>
                    </div>
                </div>

                {/* Sub-Topics Hierarchy Branches */}
                {open && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2 animate-in fade-in duration-200">
                        {lesson.topics.length === 0 ? (
                            <p className="text-[11px] text-gray-400 italic pl-3">No topics listed under this lesson</p>
                        ) : (
                            <div className="relative pl-4 space-y-2 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1.5px] before:border-l before:border-dashed before:border-indigo-200 dark:before:border-indigo-800">
                                {lesson.topics.map((topic, tIdx) => (
                                    <div
                                        key={topic.id}
                                        className="relative flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50/70 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800/80 text-[11px]"
                                    >
                                        {/* Connecting branch line */}
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <span className="text-gray-300 font-bold">└──</span>
                                            {topic.is_completed ? (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                            ) : (
                                                <Circle className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                                            )}
                                            <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                                                <span className="text-gray-400 mr-1 text-[10px]">#{index + 1}.{tIdx + 1}</span>
                                                {topic.title}
                                            </span>
                                        </div>

                                        {/* Topic Status Badge */}
                                        <span
                                            className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border",
                                                topic.is_completed
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                                    : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                                            )}
                                        >
                                            {topic.is_completed
                                                ? `${t("complete")}${topic.completion_date ? ` (${topic.completion_date})` : ""}`
                                                : t("incomplete")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Main page ── */
export default function UserSyllabusStatusPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<SubjectSyllabus[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get("/user/syllabus-status");
                if (res.data.success) {
                    setData(res.data.data ?? []);
                } else {
                    toast({ variant: "destructive", title: t("error"), description: res.data.message || t("failed_to_load_syllabus") });
                }
            } catch {
                toast({ variant: "destructive", title: t("error"), description: t("failed_to_load_syllabus_status") });
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [toast]);

    const copyToClipboard = () => {
        const text = data.map((s) =>
            `${s.subject}: ${s.completion}% (${s.completed_topics}/${s.total_topics})\n` +
            s.lessons.map((l) =>
                `  ${l.title}: ${l.completion}%\n` +
                l.topics.map((tp) => `    ${tp.title}: ${tp.is_completed ? t("complete") : t("incomplete")}`).join("\n")
            ).join("\n")
        ).join("\n\n");
        navigator.clipboard.writeText(text);
        toast({ title: t("copied_to_clipboard") });
    };

    const totalTopics = data.reduce((a, s) => a + s.total_topics, 0);
    const completedTopics = data.reduce((a, s) => a + s.completed_topics, 0);
    const overall = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <GraduationCap className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[16px] font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none truncate">{t("syllabus_status")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {loading
                                    ? t("loading_syllabus")
                                    : data.length === 0
                                        ? t("no_syllabus_available")
                                        : `${overall}% ${t("overall")} · ${completedTopics}/${totalTopics} ${t("topics_across")} ${data.length} ${t("subject")}${data.length === 1 ? "" : "s"}`}
                            </p>
                        </div>
                    </div>
                    {!loading && data.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={copyToClipboard}
                                title={t("copy")}
                                className="h-9 w-9 rounded-[10px] hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 text-gray-500 transition-all print:hidden"
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={() => window.print()}
                                title={t("print")}
                                className="h-9 px-3.5 gap-1.5 rounded-[10px] text-white text-[12px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95 print:hidden"
                            >
                                <Printer className="h-4 w-4" />
                                <span className="hidden sm:inline">{t("print")}</span>
                            </Button>
                        </div>
                    )}
                </div>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>{t("loading_syllabus_dots")}</span>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <BookOpen className="h-12 w-12 opacity-30 mb-3" />
                            <p className="text-base font-semibold text-gray-500">{t("no_syllabus_data_found")}</p>
                            <p className="text-sm mt-1 text-gray-400">{t("syllabus_will_appear_here_once_the_admin_adds_topics_for_your_class")}</p>
                        </div>
                    ) : (
                        <>
                            {/* Subject Donut Cards */}
                            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                    {data.map((s, idx) => {
                                        const color = getColor(idx);
                                        return (
                                            <div
                                                key={s.subject}
                                                className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/90 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                                            >
                                                <p className="text-[12px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight line-clamp-2 min-h-[30px] flex items-center" title={s.subject}>{s.subject}</p>
                                                <DonutChart percentage={s.completion} color={color} />
                                                <div
                                                    className="text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm"
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {s.completion}% {t("complete")}
                                                </div>
                                                <p className="text-[11px] text-gray-400">{s.completed_topics}/{s.total_topics} {t("topics")}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Subject → Hierarchical Step-by-Step Lessons Roadmap */}
                            <div className="border-t border-gray-100 dark:border-gray-800">
                                <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-bold text-[13px] text-gray-800 dark:text-gray-200">
                                        <Route className="h-4 w-4 text-indigo-500" />
                                        <span>Curriculum Roadmap & Step-by-Step Hierarchy</span>
                                    </div>
                                    <span className="text-[11px] text-gray-400 font-medium">
                                        {data.length} Subject{data.length === 1 ? "" : "s"}
                                    </span>
                                </div>

                                <div className="p-4 sm:p-6 space-y-6">
                                    {data.map((subject, idx) => {
                                        const color = getColor(idx);
                                        return (
                                            <div
                                                key={subject.subject}
                                                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 overflow-hidden shadow-2xs"
                                            >
                                                {/* Subject Banner */}
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
                                                    <div className="flex items-center gap-2.5 font-black text-sm text-gray-800 dark:text-gray-100">
                                                        <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: color }} />
                                                        <span>{subject.subject}</span>
                                                        <Badge variant="outline" className="ml-1 text-[10px] font-bold border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
                                                            {subject.lessons?.length || 0} Lessons
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-3 w-full sm:w-auto sm:min-w-[200px]">
                                                        <ProgressBar value={subject.completion} color={color} />
                                                        <span className="text-xs font-black text-gray-700 dark:text-gray-300 w-16 text-right shrink-0">
                                                            {subject.completion}% {t("done")}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Hierarchical Lessons Track */}
                                                <div className="p-5 sm:p-6">
                                                    {subject.lessons.length === 0 ? (
                                                        <div className="py-6 text-center text-xs text-gray-400 italic">
                                                            {t("no_lessons_added_yet")}
                                                        </div>
                                                    ) : (
                                                        <div className="relative pl-6 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-indigo-400 before:via-indigo-200 before:to-emerald-400 dark:before:from-indigo-600 dark:before:via-indigo-900 dark:before:to-emerald-600">
                                                            {subject.lessons.map((lesson, lIdx) => (
                                                                <HierarchicalLessonNode
                                                                    key={`${subject.subject}-${lIdx}`}
                                                                    lesson={lesson}
                                                                    index={lIdx}
                                                                    total={subject.lessons.length}
                                                                    color={color}
                                                                    subjectIdx={idx}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
