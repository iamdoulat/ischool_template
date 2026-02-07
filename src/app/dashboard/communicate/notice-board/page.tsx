"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Plus, Trash2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notice {
    id: string;
    title: string;
}

const initialNotices: Notice[] = [
    { id: "1", title: "Annual Function Practice" },
    { id: "2", title: "School Holiday Notice" },
    { id: "3", title: "Parent-Teacher Meeting" },
    { id: "4", title: "Fee Submission Reminder" },
    { id: "5", title: "February Monthly Examination" },
    { id: "6", title: "Fees Updates" },
    { id: "7", title: "Online Learning Notice" },
    { id: "8", title: "Staff Meeting" },
    { id: "9", title: "Fees Reminder" },
    { id: "10", title: "Student Health Check-up" },
    { id: "11", title: "Extra class for Std - X to XII" },
    { id: "12", title: "New Year Celebration Holiday" },
    { id: "13", title: "PTM Meeting" },
    { id: "14", title: "Staff Meeting" },
    { id: "15", title: "Fees Reminder" },
    { id: "16", title: "Online Learning Notice" },
    { id: "17", title: "Notice for new Book collection" },
    { id: "18", title: "School Vacation Notice ..!!" },
    { id: "19", title: "Merry Christmas Holiday" },
    { id: "20", title: "Online Learning Notice" },
    { id: "21", title: "Staff Meeting" },
    { id: "22", title: "Fees Reminder" },
    { id: "23", title: "Student Health Check-up" },
    { id: "24", title: "Extra class for Std-X to XII" },
    { id: "25", title: "Christmas Celebration Holiday" },
    { id: "26", title: "PTM Meeting" },
];

export default function NoticeBoardPage() {
    const [notices, setNotices] = useState<Notice[]>(initialNotices);

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-sm font-medium text-gray-800">Notice Board</h1>
                <div className="flex items-center gap-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-8 px-4 text-[10px] font-bold uppercase transition-all rounded shadow-sm">
                        <Plus className="h-3.5 w-3.5" /> Post New Message
                    </Button>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white h-8 px-4 text-[10px] font-bold uppercase transition-all rounded shadow-sm">
                        Delete Notice Board
                    </Button>
                </div>
            </div>

            {/* Notice List Container */}
            <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden">
                {notices.map((notice, index) => (
                    <div
                        key={notice.id}
                        className={cn(
                            "flex items-center justify-between p-3.5 group hover:bg-gray-50/50 transition-colors",
                            index !== notices.length - 1 && "border-b border-gray-100"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-[#6366f1] stroke-[2.5px]" />
                            <span className="text-[13px] text-[#6366f1] font-medium hover:underline cursor-pointer">
                                {notice.title}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded">
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50 rounded">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
