"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer } from "lucide-react";

interface ExamSubject {
    subject: string;
    date: string;
    startTime: string;
    duration: number; // in minutes
    roomNo: string;
}

interface ExamSchedule {
    id: string;
    examName: string;
    subjects: ExamSubject[];
}

const examSchedules: ExamSchedule[] = [
    {
        id: "1",
        examName: "Periodic Assessments Test (July)",
        subjects: [
            { subject: "English (210)", date: "07/05/2025", startTime: "10:30:00", duration: 90, roomNo: "12" },
            { subject: "Science (111)", date: "07/07/2025", startTime: "10:30:00", duration: 90, roomNo: "11" },
            { subject: "Mathematics (110)", date: "07/10/2025", startTime: "10:30:00", duration: 90, roomNo: "12" },
            { subject: "Social Studies (212)", date: "07/15/2025", startTime: "10:30:00", duration: 90, roomNo: "11" },
        ],
    },
    {
        id: "2",
        examName: "Subject wise Test -2",
        subjects: [
            { subject: "English (210)", date: "06/05/2025", startTime: "11:30:30", duration: 90, roomNo: "11G" },
            { subject: "Hindi (230)", date: "06/10/2025", startTime: "11:30:30", duration: 90, roomNo: "12G" },
            { subject: "Mathematics (110)", date: "06/12/2025", startTime: "11:30:30", duration: 90, roomNo: "11G" },
            { subject: "Science (111)", date: "06/16/2025", startTime: "11:30:30", duration: 90, roomNo: "12G" },
        ],
    },
    {
        id: "3",
        examName: "Online Assessment Test",
        subjects: [
            { subject: "English (210)", date: "04/01/2025", startTime: "10:30:30", duration: 90, roomNo: "11" },
            { subject: "Mathematics (110)", date: "04/05/2025", startTime: "10:30:30", duration: 90, roomNo: "12" },
            { subject: "Hindi (230)", date: "04/08/2025", startTime: "10:30:30", duration: 90, roomNo: "11" },
            { subject: "Science (111)", date: "04/10/2025", startTime: "10:30:30", duration: 90, roomNo: "12" },
        ],
    },
    {
        id: "4",
        examName: "Internal Assessments Exam (November -2025)",
        subjects: [
            { subject: "English (210)", date: "11/05/2025", startTime: "09:00:00", duration: 90, roomNo: "121" },
            { subject: "Hindi (230)", date: "11/08/2025", startTime: "09:00:00", duration: 90, roomNo: "122" },
            { subject: "Mathematics (110)", date: "11/10/2025", startTime: "09:00:00", duration: 90, roomNo: "121" },
            { subject: "Science (111)", date: "11/12/2025", startTime: "09:00:00", duration: 90, roomNo: "112" },
        ],
    },
    {
        id: "5",
        examName: "Online Assessment Test (October-2025)",
        subjects: [
            { subject: "Mathematics (110)", date: "10/06/2025", startTime: "12:00:00", duration: 90, roomNo: "12" },
            { subject: "English (210)", date: "10/08/2025", startTime: "12:00:00", duration: 90, roomNo: "11" },
            { subject: "Social Studies (212)", date: "10/10/2025", startTime: "12:00:00", duration: 90, roomNo: "12" },
            { subject: "Science (111)", date: "10/15/2025", startTime: "12:00:00", duration: 90, roomNo: "11" },
        ],
    },
    {
        id: "6",
        examName: "Monthly Periodic Exam(September-2025)",
        subjects: [
            { subject: "English (210)", date: "09/04/2025", startTime: "10:00:00", duration: 90, roomNo: "12" },
            { subject: "Science (111)", date: "09/06/2025", startTime: "10:00:00", duration: 90, roomNo: "11" },
            { subject: "Hindi (230)", date: "09/08/2025", startTime: "10:00:00", duration: 90, roomNo: "12" },
            { subject: "Mathematics (110)", date: "09/10/2025", startTime: "10:00:00", duration: 90, roomNo: "12" },
        ],
    },
    {
        id: "7",
        examName: "Assessment Test Chapter Wise",
        subjects: [
            { subject: "English (210)", date: "08/05/2025", startTime: "10:00:00", duration: 90, roomNo: "12G" },
            { subject: "Science (111)", date: "08/07/2025", startTime: "10:00:00", duration: 90, roomNo: "12FF" },
            { subject: "Mathematics (110)", date: "08/09/2025", startTime: "10:00:00", duration: 90, roomNo: "11GF" },
            { subject: "Hindi (230)", date: "08/11/2025", startTime: "10:00:00", duration: 90, roomNo: "11GF" },
        ],
    },
];

export default function ExamSchedulePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-xl font-medium text-gray-800">Exam Schedule</h1>
            <div className="space-y-6">
                {examSchedules.map((exam) => (
                    <div key={exam.id} className="bg-white border rounded-md shadow-sm overflow-hidden">
                        <div className="bg-gray-100/50 px-4 py-3 flex justify-between items-center border-b">
                            <h3 className="text-gray-700 font-medium text-sm">{exam.examName}</h3>
                            <Button
                                size="sm"
                                className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                            >
                                <Printer className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-white border-b-0 text-xs uppercase">
                                    <TableRow className="hover:bg-transparent border-b">
                                        <TableHead className="font-semibold text-gray-600 pl-4 w-[25%]">Subject</TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-center w-[20%]">Date</TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-center w-[20%]">Start Time</TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-center w-[20%]">Duration (minute)</TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-center w-[15%]">Room No.</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {exam.subjects.map((subject, index) => (
                                        <TableRow key={index} className="text-sm border-b last:border-0 hover:bg-gray-50/50">
                                            <TableCell className="font-medium text-gray-700 pl-4 py-3">{subject.subject}</TableCell>
                                            <TableCell className="text-center text-gray-600">{subject.date}</TableCell>
                                            <TableCell className="text-center text-gray-600">{subject.startTime}</TableCell>
                                            <TableCell className="text-center text-gray-600">{subject.duration}</TableCell>
                                            <TableCell className="text-center text-gray-600">{subject.roomNo}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
