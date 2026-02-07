"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Plus, Search, Printer, Clock, User, BookOpen, MapPin, AlertCircle
} from "lucide-react";

interface TimetableEntry {
    subject: string;
    time: string;
    teacher: string;
    room: string;
}

interface TimetableDay {
    day: string;
    entries: TimetableEntry[];
}

const mockTimetable: TimetableDay[] = [
    {
        day: "Monday",
        entries: [
            { subject: "English (210)", time: "1:35 PM - 02:35 PM", teacher: "aman (654)", room: "Room No: 122" },
            { subject: "Drawing (200)", time: "02:40 PM - 03:40 PM", teacher: "Nishant Khare (1002)", room: "Room No: 122" },
            { subject: "Computer (00220)", time: "03:45 PM - 04:45 PM", teacher: "Shivam Verma (9002)", room: "Room No: 122" },
            { subject: "Science (111)", time: "4:50 PM - 5:25 PM", teacher: "Jason Sharlton (90006)", room: "Room No: 122" },
        ]
    },
    {
        day: "Tuesday",
        entries: [
            { subject: "Hindi (230)", time: "9:00 AM - 09:45 AM", teacher: "Shivam Verma (9002)", room: "Room No: 12" },
            { subject: "English (210)", time: "10:30 AM - 11:15 AM", teacher: "Shivam Verma (9002)", room: "Room No: 12" },
            { subject: "Mathematics (110)", time: "11:20 PM - 11:55 AM", teacher: "aman (654)", room: "Room No: 12" },
        ]
    },
    {
        day: "Wednesday",
        entries: [
            { subject: "English (210)", time: "9:00 AM - 09:45 AM", teacher: "Shivam Verma (9002)", room: "Room No: 12" },
            { subject: "Mathematics (110)", time: "10:30 AM - 11:15 AM", teacher: "Shivam Verma (9002)", room: "Room No: 12" },
        ]
    },
    {
        day: "Thursday",
        entries: [
            { subject: "Mathematics (110)", time: "09:45 AM - 10:30 AM", teacher: "Shivam Verma (9002)", room: "Room No: 12" },
            { subject: "Hindi (230)", time: "10:30 AM - 11:15 AM", teacher: "Shivam Verma (9002)", room: "Room No: 12" },
        ]
    },
    {
        day: "Friday",
        entries: [
            { subject: "English (210)", time: "9:00 AM - 09:45 AM", teacher: "Shivam Verma (9002)", room: "Room No: 12" },
            { subject: "Hindi (230)", time: "10:30 AM - 11:15 AM", teacher: "Shivam Verma (9002)", room: "Room No: 12" },
        ]
    },
    {
        day: "Saturday",
        entries: [
            { subject: "Mathematics (110)", time: "9:00 AM - 09:45 AM", teacher: "Shivam Verma (9002)", room: "Room No: 12" },
            { subject: "English (210)", time: "10:30 AM - 11:15 AM", teacher: "Shivam Verma (9002)", room: "Room No: 12" },
        ]
    },
    {
        day: "Sunday",
        entries: []
    }
];

export default function ClassTimetablePage() {
    return (
        <div className="space-y-6">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                    <h2 className="text-lg font-medium text-gray-800">Select Criteria</h2>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-3 h-8 text-xs gap-1 shadow-sm">
                        <Plus className="h-4 w-4" /> Add
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor="class" className="text-xs font-semibold text-gray-600 uppercase">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="class1">
                            <SelectTrigger id="class" className="h-10">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class1">Class 1</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="section" className="text-xs font-semibold text-gray-600 uppercase">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="a">
                            <SelectTrigger id="section" className="h-10">
                                <SelectValue placeholder="A" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-9 text-xs gap-2">
                        <Search className="h-4 w-4" /> Search
                    </Button>
                </div>
            </div>

            {/* Timetable Section */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="flex justify-end p-2 border-b">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6366f1]">
                        <Printer className="h-5 w-5" />
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <div className="flex min-w-max">
                        {mockTimetable.map((dayData) => (
                            <div key={dayData.day} className="flex-1 min-w-[200px] border-r last:border-r-0">
                                <div className="bg-gray-50/50 p-2 text-center border-b">
                                    <span className="text-sm font-bold text-gray-700">{dayData.day}</span>
                                </div>
                                <div className="p-3 space-y-3 bg-white min-h-[400px]">
                                    {dayData.entries.length > 0 ? (
                                        dayData.entries.map((entry, idx) => (
                                            <div key={idx} className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="space-y-2 text-[11px]">
                                                    <div className="flex items-start gap-2">
                                                        <BookOpen className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                                        <span className="font-semibold text-green-600">Subject: {entry.subject}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                                        <span className="text-green-700 font-medium">{entry.time}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <User className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                                        <span className="text-green-700 font-medium">{entry.teacher}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                                                        <span className="text-green-700 font-medium">{entry.room}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-white border rounded-lg p-3 text-center">
                                            <div className="flex items-center justify-center gap-2 text-red-500 text-[11px] font-medium py-1">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                <span>Not Scheduled</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
