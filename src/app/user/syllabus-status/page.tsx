"use client";

import { Printer, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const syllabusData = [
    {
        subject: "English (210)",
        completion: 68,
        lessons: [
            {
                id: 1,
                title: "Chapter 1",
                completion: 100,
                topics: [
                    { id: "1.1", title: "Noun", status: "Complete (04/01/2026)" }
                ]
            },
            {
                id: 2,
                title: "First Day at School",
                completion: 100,
                topics: [
                    { id: "2.1", title: "School Life", status: "Complete (04/03/2026)" }
                ]
            },
            {
                id: 3,
                title: "The Wind and the Sun",
                completion: 100,
                topics: [
                    { id: "3.1", title: "The Wind", status: "Complete (04/14/2026)" }
                ]
            },
            {
                id: 4,
                title: "Storm in the Garden",
                completion: 100,
                topics: [
                    { id: "4.1", title: "My Garden", status: "Complete (04/17/2026)" }
                ]
            },
            {
                id: 11,
                title: "The Wind and the Sun",
                completion: 0,
                topics: [
                    { id: "11.1", title: "The Wind", status: "Incomplete" }
                ]
            },
            {
                id: 12,
                title: "Storm in the Garden",
                completion: 0,
                topics: [
                    { id: "12.1", title: "My Garden", status: "Incomplete" }
                ]
            }
        ]
    },
    {
        subject: "Hindi (230)",
        completion: 0,
        lessons: [
            {
                id: 1,
                title: "Hindi Varnmala",
                completion: 0,
                topics: [
                    { id: "1.1", title: "मेरा परिवार", status: "Incomplete" }
                ]
            },
            {
                id: 2,
                title: "पेड़-पौधे",
                completion: 0,
                topics: [
                    { id: "2.1", title: "सब्जियों के नाम", status: "Incomplete" }
                ]
            }
        ]
    },
    {
        subject: "Mathematics (110)",
        completion: 0,
        lessons: []
    },
    {
        subject: "Science (111)",
        completion: 100,
        lessons: [
            {
                id: 1,
                title: "Parts of a Plants",
                completion: 100,
                topics: [
                    { id: "1.1", title: "Plants Leaves", status: "Complete (04/03/2026)" },
                    { id: "1.2", title: "Chapter 10", status: "Complete (04/30/2026)" }
                ]
            },
            {
                id: 2,
                title: "The World of Birds",
                completion: 100,
                topics: [
                    { id: "2.1", title: "Chapter 10", status: "Complete (04/15/2026)" }
                ]
            }
        ]
    },
    {
        subject: "Social Studies (212)",
        completion: 100,
        lessons: [
            {
                id: 1,
                title: "Safety Rules and First Aid",
                completion: 100,
                topics: [
                    { id: "1.1", title: "First Aid Box", status: "Complete (04/17/2026)" },
                    { id: "1.2", title: "Chapter 6", status: "Complete (04/07/2026)" }
                ]
            }
        ]
    }
];

const DonutChart = ({ percentage }: { percentage: number }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center">
            <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke="#d1d5db"
                    strokeWidth="24"
                    fill="none"
                />
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke="#4caf50"
                    strokeWidth="24"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="butt"
                />
            </svg>
        </div>
    );
};

export default function UserSyllabusStatusPage() {
    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs text-gray-700">
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 p-4">
                    <h1 className="text-[15px] font-medium text-gray-700 tracking-tight">Syllabus Status</h1>
                </div>

                {/* Top Charts Section */}
                <div className="p-8">
                    <div className="flex flex-wrap items-center justify-center gap-16">
                        {syllabusData.map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-4">
                                <h3 className="font-bold text-[13px]">{item.subject}</h3>
                                <DonutChart percentage={item.completion} />
                                <div className="bg-black text-white text-[11px] font-bold px-3 py-0.5 rounded shadow-sm">
                                    Complete {item.completion}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom List Section */}
                <div className="border-t border-gray-100">
                    <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/30">
                        <h2 className="font-medium text-[13px]">Subject - Lesson - Topic Status</h2>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7 rounded border-gray-200 shadow-none text-gray-500">
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7 rounded border-gray-200 shadow-none text-gray-500" onClick={() => window.print()}>
                                <Printer className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="space-y-0 text-[12px]">
                            {syllabusData.map((subject, sIdx) => (
                                <div key={sIdx}>
                                    {/* Subject Row */}
                                    <div className="flex justify-between items-center py-2.5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors px-2">
                                        <div className="font-bold text-gray-800">{subject.subject}</div>
                                        <div className="font-bold text-gray-800">{subject.completion}% Complete</div>
                                    </div>

                                    {/* Lessons */}
                                    {subject.lessons.map((lesson, lIdx) => (
                                        <div key={lIdx}>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-50 hover:bg-gray-50/50 transition-colors pl-6 pr-2">
                                                <div className="font-bold text-gray-700 flex gap-3">
                                                    <span className="w-4 text-right">{lesson.id}</span>
                                                    <span>{lesson.title}</span>
                                                </div>
                                                <div className="font-bold text-gray-700">{lesson.completion}% Complete</div>
                                            </div>

                                            {/* Topics */}
                                            {lesson.topics.map((topic, tIdx) => (
                                                <div key={tIdx} className="flex justify-between items-center py-2 border-b border-gray-50 hover:bg-gray-50/50 transition-colors pl-12 pr-2 text-gray-500">
                                                    <div className="flex gap-3">
                                                        <span className="w-6 text-right">{topic.id}</span>
                                                        <span>{topic.title}</span>
                                                    </div>
                                                    <div className="italic">{topic.status}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
