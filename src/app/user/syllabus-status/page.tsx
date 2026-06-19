"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Printer, Copy, Loader2, BookOpen, ChevronDown, ChevronRight, CheckCircle2, Circle, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
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

/* ── Expandable lesson row ── */
function LessonRow({ lesson, color }: { lesson: Lesson; color: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div>
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-3 py-2.5 pl-6 pr-3 border-b border-gray-50 hover:bg-indigo-50/30 transition-colors text-left"
            >
                <div className="flex items-center gap-2 font-semibold text-[13px] text-gray-700 min-w-0">
                    {open ? <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />}
                    <span className="truncate">{lesson.title}</span>
                </div>
                <div className="flex items-center gap-3 w-[120px] sm:w-[150px] shrink-0">
                    <ProgressBar value={lesson.completion} color={color} />
                    <span className="text-[12px] font-bold text-gray-600 w-9 text-right shrink-0">{lesson.completion}%</span>
                </div>
            </button>

            {open && (
                <div className="animate-in slide-in-from-top-1 duration-200">
                    {lesson.topics.map((topic) => (
                        <div
                            key={topic.id}
                            className="flex items-center justify-between py-2 pl-14 pr-3 border-b border-gray-50 hover:bg-gray-50/40 transition-colors"
                        >
                            <div className="flex items-center gap-2 text-[12px] text-gray-600">
                                {topic.is_completed
                                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                    : <Circle className="h-3.5 w-3.5 text-gray-300 shrink-0" />}
                                {topic.title}
                            </div>
                            <span className={cn(
                                "text-[11px] italic shrink-0",
                                topic.is_completed ? "text-green-600 font-medium" : "text-gray-400"
                            )}>
                                {topic.is_completed
                                    ? `Complete${topic.completion_date ? " (" + topic.completion_date + ")" : ""}`
                                    : "Incomplete"}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Main page ── */
export default function UserSyllabusStatusPage() {
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
                    toast({ variant: "destructive", title: "Error", description: res.data.message || "Failed to load syllabus." });
                }
            } catch {
                toast({ variant: "destructive", title: "Error", description: "Failed to load syllabus status." });
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
                l.topics.map((t) => `    ${t.title}: ${t.is_completed ? "Complete" : "Incomplete"}`).join("\n")
            ).join("\n")
        ).join("\n\n");
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard" });
    };

    const totalTopics = data.reduce((a, s) => a + s.total_topics, 0);
    const completedTopics = data.reduce((a, s) => a + s.completed_topics, 0);
    const overall = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <GraduationCap className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none truncate">Syllabus Status</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {loading
                                    ? "Loading syllabus…"
                                    : data.length === 0
                                        ? "No syllabus available"
                                        : `${overall}% overall · ${completedTopics}/${totalTopics} topics across ${data.length} subject${data.length === 1 ? "" : "s"}`}
                            </p>
                        </div>
                    </div>
                    {!loading && data.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={copyToClipboard}
                                title="Copy"
                                className="h-9 w-9 rounded-[10px] hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 text-gray-500 transition-all print:hidden"
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={() => window.print()}
                                title="Print"
                                className="h-9 px-3.5 gap-1.5 rounded-[10px] text-white text-[12px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95 print:hidden"
                            >
                                <Printer className="h-4 w-4" />
                                <span className="hidden sm:inline">Print</span>
                            </Button>
                        </div>
                    )}
                </div>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Loading syllabus...</span>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <BookOpen className="h-12 w-12 opacity-30 mb-3" />
                            <p className="text-base font-semibold text-gray-500">No syllabus data found.</p>
                            <p className="text-sm mt-1 text-gray-400">Syllabus will appear here once the admin adds topics for your class.</p>
                        </div>
                    ) : (
                        <>
                            {/* Subject Donut Cards */}
                            <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/30">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                    {data.map((s, idx) => {
                                        const color = getColor(idx);
                                        return (
                                            <div
                                                key={s.subject}
                                                className="group flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                                            >
                                                <p className="text-[12px] font-bold text-gray-700 text-center leading-tight line-clamp-2 min-h-[30px] flex items-center" title={s.subject}>{s.subject}</p>
                                                <DonutChart percentage={s.completion} color={color} />
                                                <div
                                                    className="text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm"
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {s.completion}% Complete
                                                </div>
                                                <p className="text-[11px] text-gray-400">{s.completed_topics}/{s.total_topics} Topics</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Subject → Lesson → Topic List */}
                            <div className="border-t border-gray-100">
                                {/* Sub-header */}
                                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/40">
                                    <h2 className="font-semibold text-[13px] text-gray-700">Subject — Lesson — Topic Status</h2>
                                </div>

                                <div className="text-[12px]">
                                    {data.map((subject, idx) => {
                                        const color = getColor(idx);
                                        return (
                                            <div key={subject.subject}>
                                                {/* Subject row */}
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50/70">
                                                    <div className="flex items-center gap-2 font-bold text-[13px] text-gray-800">
                                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                                        {subject.subject}
                                                    </div>
                                                    <div className="flex items-center gap-3 w-full sm:w-auto sm:min-w-[180px]">
                                                        <ProgressBar value={subject.completion} color={color} />
                                                        <span className="text-[12px] font-bold text-gray-700 w-16 text-right shrink-0">{subject.completion}% Done</span>
                                                    </div>
                                                </div>

                                                {/* Lessons */}
                                                {subject.lessons.length === 0 ? (
                                                    <div className="pl-6 py-2 text-[12px] text-gray-400 italic border-b border-gray-50">No lessons added yet.</div>
                                                ) : (
                                                    subject.lessons.map((lesson, lIdx) => (
                                                        <LessonRow key={`${subject.subject}-${lIdx}`} lesson={lesson} color={color} />
                                                    ))
                                                )}
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
