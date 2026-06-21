"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search, ChevronLeft, ChevronRight,
    Copy, FileSpreadsheet, FileBox, Printer, Columns,
    Loader2, Clock, BookOpen, Award, FileText, Monitor,
    Star, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface OnlineCourse {
    id: number;
    title: string;
    subtitle: string;
    description: string;
    category: string;
    instructor_name: string;
    image: string;
    price: number;
    original_price: number;
    class_name: string;
    total_lessons: number;
    total_hours: string;
    total_exams: number;
    total_assignments: number;
    total_quizzes: number;
    outline: { title: string; video_url: string }[];
    live_classes: { title: string; link: string }[];
    quizzes: { question: string; options: string[]; correct_answer: string; points: number }[];
}

export default function UserOnlineCoursePage() {
    const [data, setData] = useState<OnlineCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("12");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [selectedCourse, setSelectedCourse] = useState<OnlineCourse | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/user/online-courses", {
                params: {
                    search: searchTerm || undefined,
                    per_page: itemsPerPage,
                    page: currentPage,
                },
            });
            const res = response.data?.data || {
                data: [], current_page: 1, last_page: 1, total: 0, per_page: 12,
            };
            setData(res.data || []);
            setTotalEntries(res.total || 0);
            setLastPage(res.last_page || 1);
            setCurrentPage(res.current_page || 1);
        } catch (error) {
            console.error("Failed to load courses", error);
            setData([]);
            setTotalEntries(0);
            setLastPage(1);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, itemsPerPage, currentPage]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalPages = lastPage;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * parseInt(itemsPerPage, 10);

    const openDetail = (course: OnlineCourse) => {
        setSelectedCourse(course);
        setDetailOpen(true);
    };

    return (
        <div className="p-4 lg:p-6 space-y-5 min-h-screen font-sans text-xs animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2.5 px-5 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1] shadow-md">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-sm">
                        <Monitor className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[16px] font-bold text-white tracking-tight leading-none">Online Courses</h1>
                        <p className="text-[11px] text-white/80 mt-1">{totalEntries} course{totalEntries === 1 ? "" : "s"} available</p>
                    </div>
                </div>

                <div className="p-4 lg:p-5 space-y-5">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 border-b border-gray-100 pb-4">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search courses..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-9 h-9 text-[12px] border-gray-200 focus-visible:ring-indigo-300 rounded-lg shadow-none"
                            />
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-2">
                            <Select
                                value={itemsPerPage}
                                onValueChange={(val) => {
                                    setItemsPerPage(val);
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-16 text-[11px] border-gray-200 shadow-none rounded-lg font-semibold text-gray-700 bg-white">
                                    <SelectValue placeholder="12" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="6">6</SelectItem>
                                    <SelectItem value="12">12</SelectItem>
                                    <SelectItem value="24">24</SelectItem>
                                    <SelectItem value="48">48</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1 text-gray-400">
                                {[Copy, FileSpreadsheet, FileBox, Printer, Columns].map((Icon, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-white hover:shadow-sm rounded-md border border-transparent hover:border-gray-200 transition-all"
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Course Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm animate-pulse">
                                    <div className="h-36 bg-gray-100" />
                                    <div className="p-3 space-y-2">
                                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                                        <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                                        <div className="grid grid-cols-2 gap-2 pt-2">
                                            <div className="h-2.5 bg-gray-100 rounded" />
                                            <div className="h-2.5 bg-gray-100 rounded" />
                                        </div>
                                        <div className="h-7 bg-gray-100 rounded mt-3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Monitor className="h-12 w-12 opacity-30 mb-3" />
                            <p className="font-bold uppercase text-[11px] tracking-widest">No courses available</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {data.map((course) => (
                                <div
                                    key={course.id}
                                    className="group border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 flex flex-col"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative h-36 bg-gradient-to-br from-[#6366f1]/10 to-[#FF9800]/10 overflow-hidden">
                                        {course.image ? (
                                            <img
                                                src={course.image}
                                                alt={course.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Monitor className="h-10 w-10 text-gray-300" />
                                            </div>
                                        )}
                                        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[#6366f1] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            {course.category}
                                        </span>
                                    </div>

                                    {/* Body */}
                                    <div className="p-3.5 flex flex-col flex-1">
                                        <h3 className="text-[13px] font-bold text-gray-800 leading-tight line-clamp-2 mb-1 group-hover:text-[#6366f1] transition-colors">
                                            {course.title}
                                        </h3>
                                        {course.subtitle && (
                                            <p className="text-[10px] text-gray-500 line-clamp-1 mb-2">
                                                {course.subtitle}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-600 mb-3">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                                                <Star className="h-3 w-3" />
                                            </span>
                                            <span className="truncate">{course.instructor_name || "Instructor"}</span>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-1.5 mb-3 mt-auto">
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                <BookOpen className="h-3 w-3 text-indigo-400 shrink-0" />
                                                {course.total_lessons} Lessons
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                <Clock className="h-3 w-3 text-indigo-400 shrink-0" />
                                                {course.total_hours || "N/A"}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                <FileText className="h-3 w-3 text-indigo-400 shrink-0" />
                                                {course.total_exams} Exams
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                <Award className="h-3 w-3 text-indigo-400 shrink-0" />
                                                {course.total_quizzes} Quizzes
                                            </div>
                                        </div>

                                        {/* Price & Action */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[15px] font-bold text-[#6366f1]">
                                                    ${course.price.toFixed(2)}
                                                </span>
                                                {course.original_price > course.price && (
                                                    <span className="text-[10px] text-gray-400 line-through">
                                                        ${course.original_price.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                onClick={() => openDetail(course)}
                                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-3.5 h-8 text-[10px] font-bold rounded-lg shadow-sm transition-all active:scale-95 border-0"
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
                        <div>
                            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                            {Math.min(startIndex + parseInt(itemsPerPage, 10), totalEntries)} of{" "}
                            {totalEntries} entries
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    disabled={safePage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold",
                                            safePage === page
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95"
                                                : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    disabled={safePage === totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Course Detail Modal */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-[820px] w-[95vw] p-0 overflow-hidden bg-white border border-gray-200 shadow-2xl rounded-xl text-gray-700">
                    <div className="bg-gradient-to-r from-[#6366f1] to-[#FF9800] text-white px-5 py-4 flex justify-between items-center">
                        <DialogHeader>
                            <DialogTitle className="text-white text-sm font-semibold tracking-tight pr-6">
                                {selectedCourse?.title || "Course Details"}
                            </DialogTitle>
                        </DialogHeader>
                        <button
                            onClick={() => setDetailOpen(false)}
                            className="text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="p-4 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto custom-scrollbar text-xs">
                        {selectedCourse && (
                            <>
                                {/* Hero */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {selectedCourse.image && (
                                        <img
                                            src={selectedCourse.image}
                                            alt={selectedCourse.title}
                                            className="w-full sm:w-48 h-40 sm:h-32 object-cover rounded-lg border border-gray-100 shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-sm font-bold text-gray-800 mb-1">
                                            {selectedCourse.title}
                                        </h2>
                                        {selectedCourse.subtitle && (
                                            <p className="text-[11px] text-gray-500 mb-2">
                                                {selectedCourse.subtitle}
                                            </p>
                                        )}
                                        <p className="text-[11px] text-gray-600 leading-relaxed mb-3 line-clamp-3">
                                            {selectedCourse.description}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Star className="h-3.5 w-3.5 text-amber-400" />
                                                {selectedCourse.instructor_name}
                                            </span>
                                            <span className="bg-indigo-50 text-[#6366f1] px-2 py-0.5 rounded-full font-medium">
                                                {selectedCourse.category}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Bar */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: "Lessons", value: selectedCourse.total_lessons, icon: BookOpen },
                                        { label: "Hours", value: selectedCourse.total_hours || "N/A", icon: Clock },
                                        { label: "Exams", value: selectedCourse.total_exams, icon: FileText },
                                        { label: "Quizzes", value: selectedCourse.total_quizzes, icon: Award },
                                    ].map((stat, i) => (
                                        <div key={i} className="rounded-lg border border-gray-100 bg-gradient-to-br from-[#FF9800]/5 to-[#6366F1]/5 p-3 flex flex-col items-center text-center">
                                            <stat.icon className="h-4 w-4 text-[#6366f1] mb-1" />
                                            <div className="text-sm font-bold text-gray-800">{stat.value}</div>
                                            <div className="text-[10px] text-gray-500">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Price */}
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-[#6366f1]">
                                        ${selectedCourse.price.toFixed(2)}
                                    </span>
                                    {selectedCourse.original_price > selectedCourse.price && (
                                        <span className="text-[11px] text-gray-400 line-through">
                                            ${selectedCourse.original_price.toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                {/* Course Outline */}
                                {selectedCourse.outline && selectedCourse.outline.length > 0 && (
                                    <div>
                                        <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            Course Outline
                                        </h3>
                                        <div className="space-y-1.5">
                                            {selectedCourse.outline.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-2 bg-gray-50 rounded p-2"
                                                >
                                                    <Monitor className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                                    <span className="text-[11px] text-gray-700 flex-1">
                                                        {item.title}
                                                    </span>
                                                    {item.video_url && (
                                                        <span className="text-[10px] text-indigo-500 font-medium">
                                                            Video
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Live Classes */}
                                {selectedCourse.live_classes && selectedCourse.live_classes.length > 0 && (
                                    <div>
                                        <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            Live Classes
                                        </h3>
                                        <div className="space-y-1.5">
                                            {selectedCourse.live_classes.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-2 bg-orange-50 rounded p-2"
                                                >
                                                    <Monitor className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                                                    <span className="text-[11px] text-gray-700 flex-1">
                                                        {item.title}
                                                    </span>
                                                    {item.link && (
                                                        <a
                                                            href={item.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] text-[#6366f1] font-medium hover:underline"
                                                        >
                                                            Join
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Quizzes */}
                                {selectedCourse.quizzes && selectedCourse.quizzes.length > 0 && (
                                    <div>
                                        <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            Quizzes
                                        </h3>
                                        <div className="space-y-2">
                                            {selectedCourse.quizzes.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="bg-indigo-50/50 rounded p-3 border border-indigo-100/50"
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-[10px] font-bold text-[#6366f1] bg-indigo-100 rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
                                                            {idx + 1}
                                                        </span>
                                                        <div>
                                                            <p className="text-[11px] font-medium text-gray-700 mb-1">
                                                                {item.question}
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {item.options?.map((opt, oi) => (
                                                                    <span
                                                                        key={oi}
                                                                        className={cn(
                                                                            "text-[10px] px-2 py-0.5 rounded border",
                                                                            opt === item.correct_answer
                                                                                ? "bg-green-50 border-green-200 text-green-700"
                                                                                : "bg-white border-gray-200 text-gray-500"
                                                                        )}
                                                                    >
                                                                        {opt}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400 mt-1">
                                                                {item.points} pts
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Apply Button Footer */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#6366f1]">
                                ${selectedCourse?.price.toFixed(2)}
                            </span>
                            {selectedCourse && selectedCourse.original_price > selectedCourse.price && (
                                <span className="text-[11px] text-gray-400 line-through">
                                    ${selectedCourse.original_price.toFixed(2)}
                                </span>
                            )}
                        </div>
                        <Button
                            onClick={() => {
                                toast.success("Enrolled successfully! Redirecting to course...");
                                setDetailOpen(false);
                            }}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-6 h-9 text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(99,102,241,0.25)] transition-all active:scale-95 border-0"
                        >
                            Apply Now
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
