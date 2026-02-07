"use client";

import { useState } from "react";
import {
    Search,
    LayoutGrid,
    List,
    Plus,
    ChevronDown,
    Monitor,
    BookOpen,
    Clock,
    FileText,
    HelpCircle,
    PenTool,
    MoreVertical,
    Eye,
    Settings,
    LayoutDashboard
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const courses = [
    {
        id: "1",
        title: "English Course for Beginners",
        description: "This course is perfect for anyone looking to improve th... language skills, whether you are a beginner just starting",
        category: "Business Marketing",
        instructor: { name: "Shivam Verma", id: "9002", lastUpdated: "01/26/2026", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Shivam" },
        stats: { class: "Class 1", lessons: 2, hours: "02:00:00 Hrs", exams: 1, assignments: 1, quizzes: 0 },
        price: 72.00,
        originalPrice: 80.00,
        image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2071&auto=format&fit=crop"
    },
    {
        id: "2",
        title: "Hindi language Course",
        description: "A Hindi language course description typically covers... language skills like speaking, listening, reading, and",
        category: "Lifestyle course",
        instructor: { name: "Jason Sharlton", id: "90006", lastUpdated: "01/11/2026", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jason" },
        stats: { class: "Class 1", lessons: 2, hours: "02:00:00 Hrs", exams: 1, assignments: 1, quizzes: 1 },
        price: 108.00,
        originalPrice: 120.00,
        image: "https://images.unsplash.com/photo-1590402444681-cd1838b693f9?q=80&w=1974&auto=format&fit=crop"
    },
    {
        id: "3",
        title: "Math Fundamentals",
        description: "A \"math course\" can be any educational program... covering mathematical concepts, from fundamental",
        category: "UPGRADE SKILL",
        instructor: { name: "Shivam Verma", id: "9002", lastUpdated: "01/11/2026", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Shivam2" },
        stats: { class: "Class 1", lessons: 2, hours: "05:00:00 Hrs", exams: 1, assignments: 1, quizzes: 1 },
        price: 90.00,
        originalPrice: 100.00,
        image: "https://images.unsplash.com/photo-1509228468518-180dd482180c?q=80&w=2070&auto=format&fit=crop"
    },
    {
        id: "4",
        title: "ENVIRONMENTAL SCIENCE COURSE",
        description: "An Environmental Science course explores the natural... environment, the impact of human activities, and",
        category: "Lifestyle course",
        instructor: { name: "Jason Sharlton", id: "90006", lastUpdated: "01/11/2026", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jason2" },
        stats: { class: "Class 1", lessons: 2, hours: "03:30:00 Hrs", exams: 1, assignments: 1, quizzes: 1 },
        price: 76.50,
        originalPrice: 85.00,
        image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop"
    }
];

export default function OnlineCoursePage() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">Course List</h1>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search By Course Name"
                            className="pl-10 h-10 rounded-lg bg-card border-muted/50 focus-visible:ring-primary/20 transition-all shadow-sm"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                    </div>

                    <div className="flex items-center bg-card border border-muted/50 rounded-lg p-1 shadow-sm">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8 rounded-md transition-all", viewMode === "grid" ? "bg-muted text-primary" : "text-muted-foreground")}
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8 rounded-md transition-all", viewMode === "list" ? "bg-muted text-primary" : "text-muted-foreground")}
                            onClick={() => setViewMode("list")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button className="h-10 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                        <Plus className="h-4 w-4" />
                        Add Course
                    </Button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Showing 1 to 4 of 22 entries</p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                        <ChevronDown className="h-4 w-4 rotate-90" />
                    </Button>
                    <Button className="h-8 w-8 rounded-lg border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">1</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                        <ChevronDown className="h-4 w-4 -rotate-90" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function CourseCard({ course }: { course: any }) {
    return (
        <Card className="group border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden hover:shadow-[0_15px_45px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col">
            {/* Image Section */}
            <div className="relative aspect-[16/10] overflow-hidden">
                <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 blur-[0.5px] group-hover:blur-0"
                />

                {/* Instructor Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-white/20 shadow-inner">
                            <img src={course.instructor.avatar} alt={course.instructor.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-white truncate leading-none">
                                {course.instructor.name} ({course.instructor.id})
                            </p>
                            <p className="text-[9px] font-medium text-white/70">
                                Last Updated {course.instructor.lastUpdated}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <CardContent className="p-5 flex flex-col flex-1">
                {/* Title and Description */}
                <div className="space-y-1 mb-4">
                    <h3 className="font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors line-clamp-1">
                        {course.title}
                    </h3>
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
                        {course.description}
                    </p>
                    <div className="flex items-center gap-1 pt-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category:</span>
                        <span className="text-[10px] font-bold text-slate-700">{course.category}</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4 border-y border-dashed border-muted/30 py-4">
                    <StatItem icon={Monitor} label="Class:" value={course.stats.class} />
                    <StatItem icon={BookOpen} label="Lesson" value={course.stats.lessons} />
                    <StatItem icon={Clock} label="" value={course.stats.hours} className="col-span-2" />
                    <StatItem icon={FileText} label="Exam" value={course.stats.exams} />
                    {course.stats.quizzes > 0 && <StatItem icon={HelpCircle} label="Quiz" value={course.stats.quizzes} />}
                    <StatItem icon={PenTool} label="Assignment" value={course.stats.assignments} />
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-5">
                    <span className="text-lg font-black text-slate-800">${course.price.toFixed(2)}</span>
                    <span className="text-sm font-bold text-muted-foreground/60 line-through">${course.originalPrice.toFixed(2)}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-2">
                    <Button className="flex-1 h-9 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-[11px] font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all">
                        Manage
                    </Button>
                    <Button className="flex-1 h-9 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-[11px] font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all">
                        Preview
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function StatItem({ icon: Icon, label, value, className }: { icon: any, label: string, value: any, className?: string }) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="h-6 w-6 rounded-md bg-muted/50 flex items-center justify-center border border-muted/50">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1 min-w-0">
                {label && <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">{label}</span>}
                <span className="text-[10px] font-black text-slate-700 truncate">{value}</span>
            </div>
        </div>
    );
}
