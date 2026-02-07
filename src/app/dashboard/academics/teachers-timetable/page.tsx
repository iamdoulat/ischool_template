"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Plus, Search, Printer, Clock, BookOpen, MapPin, AlertCircle, LayoutGrid
} from "lucide-react";

interface TimetableEntry {
    class: string;
    subject: string;
    time: string;
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
            { class: "Class: Class 1(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 1(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
        ]
    },
    {
        day: "Tuesday",
        entries: [
            { class: "Class: Class 2(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(D)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12FF" },
        ]
    },
    {
        day: "Wednesday",
        entries: [
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 5(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(D)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
        ]
    },
    {
        day: "Thursday",
        entries: [
            { class: "Class: Class 3(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 5(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 5(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(D)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12FF" },
        ]
    },
    {
        day: "Friday",
        entries: [
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 5(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 3(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(A)", subject: "Subject: Mathematics (110)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 5(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
        ]
    },
    {
        day: "Saturday",
        entries: [
            { class: "Class: Class 3(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 5(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 5(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: Mathematics (110)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: Mathematics (110)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
        ]
    },
    {
        day: "Sunday",
        entries: []
    }
];

export default function TeachersTimetablePage() {
    return (
        <div className="space-y-4">
            {/* Header/Title */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h1 className="text-xl font-medium text-gray-800">Teacher Time Table</h1>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col space-y-2">
                    <Label htmlFor="teacher" className="text-xs font-semibold text-gray-600">
                        Teachers <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2 max-w-2xl">
                        <Select defaultValue="shivam">
                            <SelectTrigger id="teacher" className="h-9 flex-1">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="shivam">Shivam Verma (9002)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-9 text-xs shadow-sm">
                            Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* Timetable Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden relative">
                <div className="absolute right-4 top-4 z-10">
                    <Button size="icon" variant="ghost" className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm p-0">
                        <Printer className="h-4 w-4" />
                    </Button>
                </div>

                <div className="overflow-x-auto pt-14 px-4 pb-4">
                    <div className="flex min-w-max gap-4">
                        {mockTimetable.map((dayData) => (
                            <div key={dayData.day} className="flex-1 min-w-[200px]">
                                <div className="bg-white py-2 text-left mb-2">
                                    <span className="text-sm font-bold text-gray-800 uppercase border-b-2 border-transparent">{dayData.day}</span>
                                </div>
                                <div className="space-y-3 min-h-[500px]">
                                    {dayData.entries.length > 0 ? (
                                        dayData.entries.map((entry, idx) => (
                                            <div key={idx} className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group">
                                                <div className="space-y-1.5 text-[11px]">
                                                    <div className="flex items-center gap-2">
                                                        <LayoutGrid className="h-3 w-3 text-gray-400" />
                                                        <span className="font-semibold text-green-700">{entry.class} Subject: {entry.subject.split(': ')[1]}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 pl-5">
                                                        <Clock className="h-3 w-3 text-gray-400" />
                                                        <span className="text-green-800 font-medium">{entry.time}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 pl-5">
                                                        <MapPin className="h-3 w-3 text-gray-400" />
                                                        <span className="text-green-800 font-medium">{entry.room}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
                                            <div className="flex items-center justify-center gap-2 text-red-500 text-[11px] font-bold py-1 uppercase">
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
