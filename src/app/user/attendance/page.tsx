"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mockAttendanceData: Record<number, string> = {
    1: "Present",
    4: "Absent",
    5: "Holiday",
    7: "Holiday",
    9: "Late",
    10: "Present",
    11: "Present",
    13: "Present",
    16: "Present",
    18: "Late",
    20: "Present",
    21: "Half Day",
    23: "Absent",
    24: "Half Day",
    26: "Half Day"
};

const statusColors: Record<string, string> = {
    "Present": "bg-[#16a34a] text-white",
    "Absent": "bg-[#dc2626] text-white",
    "Late": "bg-[#facc15] text-white",
    "Half Day": "bg-[#f97316] text-white",
    "Holiday": "bg-[#9ca3af] text-white",
};

export default function UserAttendancePage() {
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    // June 2026 starts on Monday. It has 30 days.
    const daysInMonth = 30;
    const startOffset = 0; // 0 means starts on Monday

    const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;
    const cells = Array.from({ length: totalCells }, (_, i) => {
        const day = i - startOffset + 1;
        return day > 0 && day <= daysInMonth ? day : null;
    });

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 p-4">
                    <h1 className="text-[15px] font-medium text-gray-700 tracking-tight">Attendance</h1>
                </div>

                <div className="p-4">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-4 relative">
                        <div className="flex items-center gap-1">
                            <Button className="bg-[#7e57c2] hover:bg-[#7048b6] text-white px-2 h-8 rounded shadow-none transition-all active:scale-95">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button className="bg-[#7e57c2] hover:bg-[#7048b6] text-white px-2 h-8 rounded shadow-none transition-all active:scale-95">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 font-medium text-[15px] text-gray-700">
                            June 2026
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="border border-gray-200 rounded-sm overflow-hidden">
                        {/* Days Header */}
                        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                            {daysOfWeek.map((day, idx) => (
                                <div key={idx} className="text-center py-2 text-[12px] text-gray-500 font-medium border-r border-gray-200 last:border-r-0">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Body */}
                        <div className="grid grid-cols-7">
                            {cells.map((day, idx) => {
                                const status = day ? mockAttendanceData[day] : null;
                                return (
                                    <div 
                                        key={idx} 
                                        className={cn(
                                            "min-h-[120px] border-r border-b border-gray-200 last:border-r-0",
                                            (idx + 1) % 7 === 0 ? "border-r-0" : "", // Remove right border for last column
                                            idx >= cells.length - 7 ? "border-b-0" : "" // Remove bottom border for last row
                                        )}
                                    >
                                        {day && (
                                            <div className="flex flex-col h-full">
                                                <div className="text-right p-1.5 text-[11px] text-gray-600 font-medium">
                                                    {day}
                                                </div>
                                                {status && (
                                                    <div className={cn(
                                                        "mx-1 mb-1 px-1.5 py-0.5 text-[10px] font-bold rounded-sm shadow-sm flex items-center",
                                                        statusColors[status]
                                                    )}>
                                                        {status}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
