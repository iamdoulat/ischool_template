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
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";

interface Topic {
    id: string;
    name: string;
}

interface Lesson {
    id: string;
    name: string;
    topics: Topic[];
}

const mockLessons: Lesson[] = [
    {
        id: "1",
        name: "First Day at School",
        topics: [
            { id: "1.1", name: "School Life" },
            { id: "1.2", name: "School Day's" },
            { id: "1.3", name: "Chapter-2" },
        ]
    },
    {
        id: "2",
        name: "The Wind and the Sun",
        topics: [
            { id: "2.1", name: "The Wind" },
        ]
    },
    {
        id: "3",
        name: "Storm in the Garden",
        topics: [
            { id: "3.1", name: "My Garden" },
            { id: "3.2", name: "Chapter 2" },
        ]
    }
];

export default function CopyOldLessonsPage() {
    return (
        <div className="space-y-6 font-sans">
            {/* Top Section: Select Old Session Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <h2 className="text-sm font-medium text-gray-800 mb-4">Select Old Session Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600 uppercase">
                            Session <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="2025-26">
                            <SelectTrigger className="h-9 border-gray-200 text-xs">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2025-26">2025-26</SelectItem>
                                <SelectItem value="2024-25">2024-25</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600 uppercase">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="class1">
                            <SelectTrigger className="h-9 border-gray-200 text-xs">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class1">Class 1</SelectItem>
                                <SelectItem value="class2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600 uppercase">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="a">
                            <SelectTrigger className="h-9 border-gray-200 text-xs">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600 uppercase">
                            Subject Group <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="group1">
                            <SelectTrigger className="h-9 border-gray-200 text-xs">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="group1">Class 1st Subject Group</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600 uppercase">
                            Subject <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="english">
                            <SelectTrigger className="h-9 border-gray-200 text-xs">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="english">English (210)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-8 px-5 text-xs shadow-sm transition-all">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            <div className="text-sm font-medium text-gray-700 mt-6 mb-2">
                Syllabus Status For: <span className="font-bold">English (210)</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column: Lesson & Topics Selection */}
                <div className="w-full lg:w-2/3">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b">
                            <h3 className="text-sm font-medium text-gray-800">Lesson & Topics Select Subject</h3>
                        </div>

                        <div className="divide-y divide-gray-100">
                            <div className="grid grid-cols-[40px_1fr] bg-gray-50/50 text-[11px] font-bold uppercase text-gray-600 p-2">
                                <div>#</div>
                                <div>Lesson Topic</div>
                            </div>

                            {mockLessons.map((lesson, index) => (
                                <div key={lesson.id} className="grid grid-cols-[40px_1fr] p-3 group hover:bg-gray-50/30 transition-colors">
                                    <div className="text-xs text-gray-500">{index + 1}</div>
                                    <div className="space-y-3">
                                        <div className="text-xs font-bold text-gray-800">
                                            {lesson.name} <span className="text-red-500 ml-0.5">*</span>
                                        </div>
                                        <div className="pl-6 space-y-2.5">
                                            {lesson.topics.map((topic) => (
                                                <div key={topic.id} className="flex items-center gap-2">
                                                    <span className="text-[11px] text-gray-400 w-6 font-mono">{topic.id}</span>
                                                    <Checkbox id={topic.id} className="h-3.5 w-3.5 rounded border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 shadow-none" />
                                                    <Label htmlFor={topic.id} className="text-[12px] text-gray-600 font-normal cursor-pointer hover:text-indigo-600 transition-colors">
                                                        {topic.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Target Subject Selection */}
                <div className="w-full lg:w-1/3">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-5">
                        <h3 className="text-sm font-medium text-gray-800 border-b pb-2">Select Subject</h3>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Class <span className="text-red-500">*</span>
                            </Label>
                            <Select>
                                <SelectTrigger className="h-9 border-gray-200 text-xs">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="class1">Class 1</SelectItem>
                                    <SelectItem value="class2">Class 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Section <span className="text-red-500">*</span>
                            </Label>
                            <Select>
                                <SelectTrigger className="h-9 border-gray-200 text-xs">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="a">A</SelectItem>
                                    <SelectItem value="b">B</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Subject Group <span className="text-red-500">*</span>
                            </Label>
                            <Select>
                                <SelectTrigger className="h-9 border-gray-200 text-xs">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="group1">Class 1st Subject Group</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Subject <span className="text-red-500">*</span>
                            </Label>
                            <Select>
                                <SelectTrigger className="h-9 border-gray-200 text-xs">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="english">English (210)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-9 text-xs shadow-sm transition-all rounded">
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
