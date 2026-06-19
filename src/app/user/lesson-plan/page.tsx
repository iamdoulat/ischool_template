"use client";

import { useState } from "react";
import { BookOpen, Clock, XCircle, Menu, ChevronLeft, ChevronRight } from "lucide-react";

const lessonPlanData = {
    "Monday": { date: "06/15/2026", plans: [
        { subject: "English (210)", time: "8:00 AM - 08:45 AM" },
        { subject: "Hindi (230)", time: "8:45 AM - 9:30 AM" }
    ]},
    "Tuesday": { date: "06/16/2026", plans: [
        { subject: "English (210)", time: "8:00 AM - 08:30 AM" },
        { subject: "Hindi (230)", time: "08:35 AM - 09:05 AM" }
    ]},
    "Wednesday": { date: "06/17/2026", plans: [
        { subject: "English (210)", time: "8:00 AM - 08:30 AM" },
        { subject: "Hindi (230)", time: "08:35 AM - 09:05 AM" }
    ]},
    "Thursday": { date: "06/18/2026", plans: [
        { subject: "English (210)", time: "8:00 AM - 08:30 AM" },
        { subject: "Hindi (230)", time: "08:35 AM - 09:05 AM" }
    ]},
    "Friday": { date: "06/19/2026", plans: [
        { subject: "English (210)", time: "9:40 AM - 10:05 AM" },
        { subject: "Hindi (230)", time: "8:00 AM - 08:30 AM" }
    ]},
    "Saturday": { date: "06/20/2026", plans: [
        { subject: "Science (111)", time: "8:00 AM - 08:30 AM" }
    ]},
    "Sunday": { date: "06/21/2026", plans: []}
};

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function UserLessonPlanPage() {
    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 p-4">
                    <h1 className="text-[15px] font-medium text-gray-700 tracking-tight">Lesson Plan</h1>
                </div>

                <div className="p-4">
                    {/* Date Range Selector */}
                    <div className="flex items-center justify-center gap-4 mb-6 mt-2 text-[13px] font-medium text-gray-700">
                        <button className="hover:text-gray-900 transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span>06/15/2026 To 06/21/2026</span>
                        <button className="hover:text-gray-900 transition-colors">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Table / Grid Layout */}
                    <div className="border border-gray-100 rounded-lg overflow-x-auto">
                        <table className="w-full min-w-[1200px] border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {daysOfWeek.map((day) => {
                                        const dayInfo = lessonPlanData[day as keyof typeof lessonPlanData];
                                        return (
                                            <th key={day} className="py-3 px-3 text-left text-[11px] font-bold text-gray-700 bg-transparent">
                                                <div className="flex flex-col">
                                                    <span>{day}</span>
                                                    <span className="font-normal text-gray-500 mt-0.5">{dayInfo?.date}</span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    {daysOfWeek.map((day) => {
                                        const dayInfo = lessonPlanData[day as keyof typeof lessonPlanData];
                                        const plans = dayInfo?.plans || [];
                                        return (
                                            <td key={day} className="p-2 align-top w-[14.28%] border-r border-gray-100 last:border-r-0">
                                                <div className="space-y-3 pt-1">
                                                    {plans.length > 0 ? (
                                                        plans.map((plan, idx) => (
                                                            <div key={idx} className="relative border border-gray-200 rounded-md p-2.5 bg-white shadow-sm hover:shadow-md transition-shadow">
                                                                {/* Top Right Action Icon */}
                                                                <button className="absolute -top-1.5 -right-1.5 bg-[#7e57c2] hover:bg-[#7048b6] text-white p-1 rounded-sm shadow-sm transition-colors z-10 cursor-pointer">
                                                                    <Menu className="h-2.5 w-2.5" />
                                                                </button>
                                                                
                                                                <div className="space-y-1.5 pt-1 pr-2">
                                                                    <div className="flex items-start gap-1.5">
                                                                        <BookOpen className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
                                                                        <span className="text-[#3b82f6] font-medium leading-tight text-[11px]">Subject: {plan.subject}</span>
                                                                    </div>
                                                                    <div className="flex items-start gap-1.5">
                                                                        <Clock className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
                                                                        <span className="text-[#3b82f6] font-medium leading-tight text-[11px]">{plan.time}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="border border-gray-200 rounded-md p-2.5 bg-gray-50/50 flex items-center gap-1.5 mt-1">
                                                            <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                                            <span className="text-red-500 font-medium text-[11px]">Not Scheduled</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
