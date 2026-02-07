"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, FileText, BookOpen, Printer, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const reportLinks = [
    { name: "Syllabus Status Report", icon: FileText, active: true },
    { name: "Subject Lesson Plan Report", icon: BookOpen },
];

const syllabusStatus = [
    { subject: "English (210)", percentage: 37 },
    { subject: "Hindi (230)", percentage: 100 },
    { subject: "Mathematics (110)", percentage: 75 },
    { subject: "Science (111)", percentage: 67 },
    { subject: "Drawing (200)", percentage: 100 },
    { subject: "Computer (00220)", percentage: 87 },
    { subject: "Elective 1 (101)", percentage: 50 },
];

function DonutChart({ percentage, title }: { percentage: number; title: string }) {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center space-y-3">
            <span className="text-[10px] font-bold text-gray-700 tracking-tight">{title}</span>
            <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                    {/* Background Circle */}
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-gray-200"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="text-[#4caf50]"
                    />
                </svg>
            </div>
            <div className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded">
                Complete {percentage}%
            </div>
        </div>
    );
}

export default function LessonPlanReportPage() {
    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Lesson Plan Report</h1>

            {/* Report Links Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-6">
                    {reportLinks.map((link) => (
                        <div
                            key={link.name}
                            className={cn(
                                "flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors group",
                                link.active ? "bg-gray-100" : "hover:bg-gray-50"
                            )}
                        >
                            <link.icon className={cn("h-3.5 w-3.5", link.active ? "text-gray-700" : "text-gray-400 group-hover:text-gray-600")} />
                            <span className={cn("text-[10px] font-medium tracking-tight", link.active ? "text-gray-800" : "text-gray-500 group-hover:text-gray-700")}>
                                {link.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                        <Select defaultValue="c1">
                            <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Class 1" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="c1">Class 1</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section <span className="text-red-500">*</span></Label>
                        <Select defaultValue="a">
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="A" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Subject Group <span className="text-red-500">*</span></Label>
                        <Select defaultValue="g1">
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Class 1st Subject Group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="g1">Class 1st Subject Group</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5">
                        <Search className="h-3 w-3" />
                        Search
                    </Button>
                </div>
            </div>

            {/* Syllabus Status Report Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-8">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Syllabus Status Report</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-10">
                    {syllabusStatus.map((item) => (
                        <DonutChart key={item.subject} title={item.subject} percentage={item.percentage} />
                    ))}
                </div>
            </div>

            {/* Subject - Lesson - Topic Status Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                    <div className="space-y-1">
                        <p className="text-[9px] text-indigo-500 italic font-medium tracking-tight">Note : Subject Percentage Based On Topic.</p>
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Subject - Lesson - Topic Status</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-500 border border-indigo-100 rounded">
                            <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-500 border border-indigo-100 rounded">
                            <Download className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                <div className="p-4">
                    <div className="space-y-6">
                        {/* English Group */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-gray-50 pb-1.5">
                                <h3 className="text-[11px] font-bold text-gray-800">English (210)</h3>
                                <span className="text-[10px] font-bold text-gray-500">37% Complete</span>
                            </div>

                            <div className="pl-4 space-y-4">
                                {/* Lesson 1 */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-700">1 First Day at School</span>
                                        <span className="text-[10px] font-bold text-gray-500">100% Complete</span>
                                    </div>
                                    <div className="pl-6 space-y-1.5 text-[10px] text-gray-500">
                                        <div className="flex justify-between italic">
                                            <span>1.1 School Life</span>
                                            <span className="text-gray-400">Complete (04/10/2025)</span>
                                        </div>
                                        <div className="flex justify-between italic">
                                            <span>1.2 School Day's</span>
                                            <span className="text-gray-400">Complete (04/12/2025)</span>
                                        </div>
                                        <div className="flex justify-between italic">
                                            <span>1.3 Chapter-2</span>
                                            <span className="text-gray-400">Complete (12/26/2025)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Lesson 2 */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-700">2 The Wind and the Sun</span>
                                        <span className="text-[10px] font-bold text-gray-500">100% Complete</span>
                                    </div>
                                    <div className="pl-6 flex justify-between italic text-[10px] text-gray-500">
                                        <span>2.1 The Wind</span>
                                        <span className="text-gray-400">100% Complete</span>
                                    </div>
                                </div>

                                {/* Lesson 3 */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-700">3 Storm in the Garden</span>
                                        <span className="text-[10px] font-bold text-gray-500">100% Complete</span>
                                    </div>
                                    <div className="pl-6 space-y-1.5 text-[10px] text-gray-500">
                                        <div className="flex justify-between italic">
                                            <span>3.1 My Garden</span>
                                            <span className="text-gray-400">Complete (04/25/2025)</span>
                                        </div>
                                        <div className="flex justify-between italic">
                                            <span>3.2 Chapter 2</span>
                                            <span className="text-gray-400">Complete (11/20/2025)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Lesson 4 */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-700">4 The Grasshopper and the Ant</span>
                                        <span className="text-[10px] font-bold text-gray-500">67% Complete</span>
                                    </div>
                                    <div className="pl-6 space-y-1.5 text-[10px] text-gray-500">
                                        <div className="flex justify-between italic">
                                            <span>4.1 The Ant</span>
                                            <span className="text-gray-400">Complete (08/20/2025)</span>
                                        </div>
                                        <div className="flex justify-between italic">
                                            <span>4.2 Chapter 4</span>
                                            <span className="text-gray-400">Complete (10/25/2025)</span>
                                        </div>
                                        <div className="flex justify-between italic opacity-50">
                                            <span>4.3 Chapter-5</span>
                                            <span className="text-red-400 font-bold">Incomplete</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Placeholder for more lessons to match scroll length */}
                                {[5, 6, 7].map((i) => (
                                    <div key={i} className="space-y-2 opacity-50">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-700">{i} First Day at School</span>
                                            <span className="text-red-400 font-bold">0% Complete</span>
                                        </div>
                                        <div className="pl-6 flex justify-between italic text-[10px] text-gray-500">
                                            <span>{i}.1 School Life</span>
                                            <span className="text-red-400 font-bold">Incomplete</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
