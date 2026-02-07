"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, FileSpreadsheet, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopicStatus {
    id: string;
    name: string;
    completionDate?: string;
    isCompleted: boolean;
}

interface LessonStatus {
    id: string;
    name: string;
    topics: TopicStatus[];
}

const mockSyllabusData: LessonStatus[] = [
    {
        id: "1",
        name: "First Day at School",
        topics: [
            { id: "1.1", name: "School Life", completionDate: "04/19/2025", isCompleted: true },
            { id: "1.2", name: "School Day's", completionDate: "05/22/2025", isCompleted: true },
            { id: "1.3", name: "Chapter-2", completionDate: "12/20/2025", isCompleted: true },
        ]
    },
    {
        id: "2",
        name: "The Wind and the Sun",
        topics: [
            { id: "2.1", name: "The Wind", completionDate: "08/25/2025", isCompleted: true },
        ]
    },
    {
        id: "3",
        name: "Storm in the Garden",
        topics: [
            { id: "3.1", name: "My Garden", completionDate: "04/25/2025", isCompleted: true },
            { id: "3.2", name: "Chapter 2", completionDate: "11/20/2025", isCompleted: true },
        ]
    },
    {
        id: "4",
        name: "The Grahshopper and the Ant",
        topics: [
            { id: "4.1", name: "The Ant", completionDate: "06/20/2025", isCompleted: true },
            { id: "4.2", name: "Chapter-4", completionDate: "10/25/2025", isCompleted: true },
            { id: "4.3", name: "Chapter-5", isCompleted: false },
        ]
    },
    {
        id: "5",
        name: "First Day at School",
        topics: [
            { id: "5.1", name: "School Life", completionDate: "01/22/2026", isCompleted: true },
        ]
    },
    {
        id: "6",
        name: "The Wind and the Sun",
        topics: [
            { id: "6.1", name: "The Wind", completionDate: "02/02/2026", isCompleted: true },
        ]
    },
    {
        id: "7",
        name: "Storm in the Garden",
        topics: [
            { id: "7.1", name: "My Garden", isCompleted: false },
        ]
    },
    {
        id: "8",
        name: "The Grahshopper and the Ant",
        topics: [
            { id: "8.1", name: "The Ant", isCompleted: false },
        ]
    },
    {
        id: "9",
        name: "First Day at School",
        topics: [
            { id: "9.1", name: "School Life", isCompleted: false },
            { id: "9.2", name: "School Day's", isCompleted: false },
            { id: "9.3", name: "Chapter-2", isCompleted: false },
        ]
    },
    {
        id: "10",
        name: "The Wind and the Sun",
        topics: [
            { id: "10.1", name: "The Wind", isCompleted: false },
        ]
    },
];

export default function ManageSyllabusStatusPage() {
    return (
        <div className="space-y-6 p-4 font-sans bg-gray-50/10 min-h-screen">
            {/* Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <h2 className="text-sm font-medium text-gray-800 mb-4">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="class1">
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class1">Class 1</SelectItem>
                                <SelectItem value="class2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="a">
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Subject Group <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="group1">
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="group1">Class 1st Subject Group</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Subject <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="english">
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="english">English (210)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-8 px-6 text-xs shadow-sm transition-all rounded">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            <div className="text-sm font-medium text-gray-700 mt-6 mb-2">
                Syllabus Status For: <span className="font-bold">English (210)</span>
            </div>

            {/* Syllabus Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex justify-end p-2 gap-1 border-b bg-gray-50/30">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600">
                        <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600">
                        <FileText className="h-4 w-4" />
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-[11px] font-bold uppercase text-gray-600 border-b border-gray-100">
                                <th className="p-3 text-left w-12">#</th>
                                <th className="p-3 text-left">Lesson Topic</th>
                                <th className="p-3 text-left">Topic Completion Date</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {mockSyllabusData.map((lesson, idx) => (
                                <tr key={lesson.id} className="group hover:bg-gray-50/30 transition-colors">
                                    <td className="p-3 text-xs text-gray-400 align-top">{idx + 1}</td>
                                    <td className="p-3 align-top">
                                        <div className="space-y-2">
                                            <div className="text-xs font-bold text-gray-800">{lesson.name}</div>
                                            <div className="pl-4 space-y-1.5">
                                                {lesson.topics.map((topic) => (
                                                    <div key={topic.id} className="text-[12px] text-gray-500 flex gap-2">
                                                        <span className="w-6 shrink-0">{topic.id}</span>
                                                        <span>{topic.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 align-top">
                                        <div className="space-y-2 pt-6">
                                            {lesson.topics.map((topic) => (
                                                <div key={topic.id} className="h-[18px] text-[12px] text-gray-500 italic">
                                                    {topic.completionDate || ""}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3 align-top">
                                        <div className="space-y-2 pt-6">
                                            {lesson.topics.map((topic) => (
                                                <div key={topic.id} className="h-[18px] flex items-center">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-[3px] text-[10px] font-medium tracking-tight",
                                                        topic.isCompleted
                                                            ? "bg-black text-white"
                                                            : "bg-gray-200 text-gray-500"
                                                    )}>
                                                        {topic.isCompleted ? "Completed" : "Incomplete"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3 align-top text-right">
                                        <div className="space-y-2 pt-6 flex flex-col items-end">
                                            {lesson.topics.map((topic) => (
                                                <div key={topic.id} className="h-[18px] flex items-center">
                                                    <Switch
                                                        checked={topic.isCompleted}
                                                        className="h-3.5 w-7 scale-75 data-[state=checked]:bg-indigo-600"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
