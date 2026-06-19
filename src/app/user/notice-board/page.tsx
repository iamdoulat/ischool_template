"use client";

import { Mail } from "lucide-react";

const notices = [
    { title: "Fee Submission Reminder", color: "text-[#a78bfa]" },
    { title: "Extra class for Std - X to XII", color: "text-[#a78bfa]" },
    { title: "Parent-Teacher Meeting", color: "text-[#a78bfa]" },
    { title: "Online Learning Notice", color: "text-[#a78bfa]" },
    { title: "Extra class for Std - X to XII", color: "text-[#a78bfa]" },
    { title: "Student Health Check-up", color: "text-[#a78bfa]" },
    { title: "PTM", color: "text-[#a78bfa]" },
    { title: "Notice for new Book collection", color: "text-[#a78bfa]" },
    { title: "Fee Submission Reminder", color: "text-[#a78bfa]" },
    { title: "Fees Reminder", color: "text-[#38bdf8]" }, // Light blue/cyan for this specific one
    { title: "PTM Notice - April 2026", color: "text-[#a78bfa]" },
    { title: "Student Health Check-up", color: "text-[#a78bfa]" },
    { title: "Exam Notice - April 2026", color: "text-[#a78bfa]" },
    { title: "Notice for new Book collection", color: "text-[#a78bfa]" },
    { title: "Holiday Notice - April 2026", color: "text-[#a78bfa]" },
    { title: "march Monthly Examination", color: "text-[#a78bfa]" },
    { title: "Parent-Teacher Meeting", color: "text-[#a78bfa]" },
    { title: "Online Learning Notice", color: "text-[#a78bfa]" },
    { title: "Fee Submission Reminder", color: "text-[#a78bfa]" }
];

export default function UserNoticeBoardPage() {
    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 p-4">
                    <h1 className="text-[15px] font-medium text-gray-700 tracking-tight">Notice Board</h1>
                </div>
                
                {/* Notice List */}
                <div className="flex flex-col">
                    {notices.map((notice, index) => (
                        <div 
                            key={index} 
                            className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            <Mail className={`h-4 w-4 ${notice.color}`} strokeWidth={2} />
                            <span className={`text-[13px] ${notice.color}`}>
                                {notice.title}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
