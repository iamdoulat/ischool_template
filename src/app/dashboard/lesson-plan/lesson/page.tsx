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
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Pencil,
    Trash2,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Plus,
    X
} from "lucide-react";

interface LessonEntry {
    id: string;
    className: string;
    section: string;
    subjectGroup: string;
    subject: string;
    lessons: string[];
}

const mockLessons: LessonEntry[] = [
    {
        id: "1",
        className: "Class 5",
        section: "A",
        subjectGroup: "Class 5th Subject Group",
        subject: "English (210)",
        lessons: ["Alice in Wonderland", "The Milkman's Cow", "I had a Little Pony"]
    },
    {
        id: "2",
        className: "Class 5",
        section: "A",
        subjectGroup: "Class 5th Subject Group",
        subject: "Mathematics (110)",
        lessons: ["Tables and Shares", "Building with Bricks", "Carts and Wheels", "Long and Short"]
    },
    {
        id: "3",
        className: "Class 1",
        section: "A",
        subjectGroup: "Class 1st Subject Group",
        subject: "English (210)",
        lessons: [
            "First Day at School", "The Wind and the Sun", "Storm in the Garden",
            "The Grasshopper and the Ant", "First Day at School", "The Wind and the Sun",
            "Storm in the Garden", "The Grasshopper and the Ant", "First Day at School",
            "The Wind and the Sun", "Storm in the Garden", "The Grasshopper and the Ant"
        ]
    },
    {
        id: "4",
        className: "Class 2",
        section: "A",
        subjectGroup: "Class 2nd Subject Group",
        subject: "English (210)",
        lessons: ["Nine and the Baby Sparrows", "Sea Song", "The Balloon Man"]
    }
];

export default function LessonPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [lessonsInputs, setLessonsInputs] = useState([""]);

    const addMoreLesson = () => {
        setLessonsInputs([...lessonsInputs, ""]);
    };

    const removeLessonInput = (index: number) => {
        const newInputs = lessonsInputs.filter((_, i) => i !== index);
        if (newInputs.length === 0) {
            setLessonsInputs([""]);
        } else {
            setLessonsInputs(newInputs);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 font-sans bg-gray-50/10 min-h-screen">
            {/* Left Column: Add Lesson Form */}
            <div className="w-full lg:w-1/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <h2 className="text-sm font-medium text-gray-800 border-b pb-2 mb-4">Add Lesson</h2>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Class <span className="text-red-500">*</span>
                            </Label>
                            <Select>
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
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
                            <Select>
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
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
                            <Select>
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
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
                            <Select>
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="english">English (210)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                    Lesson Name <span className="text-red-500">*</span>
                                </Label>
                                <Button
                                    onClick={addMoreLesson}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm flex items-center gap-1 transition-colors"
                                >
                                    Add More
                                </Button>
                            </div>

                            {lessonsInputs.map((_, index) => (
                                <div key={index} className="flex gap-2 items-center group">
                                    <Input className="h-9 border-gray-200 text-xs shadow-none focus-visible:ring-indigo-500" />
                                    <button onClick={() => removeLessonInput(index)} className="text-red-500 hover:text-red-700 transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-9 text-xs shadow-sm transition-all rounded">
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Lesson List */}
            <div className="w-full lg:w-2/3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                    <h2 className="text-sm font-medium text-gray-800 border-b pb-2">Lesson List</h2>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold">50</span>
                                <Select defaultValue="50">
                                    <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                                <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Columns className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-600">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-3 px-3">Class</TableHead>
                                    <TableHead className="py-3 px-3">Section</TableHead>
                                    <TableHead className="py-3 px-3 whitespace-nowrap">Subject Group</TableHead>
                                    <TableHead className="py-3 px-3">Subject</TableHead>
                                    <TableHead className="py-3 px-3 text-right pr-12">Lesson</TableHead>
                                    <TableHead className="py-3 px-3 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockLessons.map((entry) => (
                                    <TableRow key={entry.id} className="text-[11px] text-gray-600 hover:bg-gray-50/50 group border-b border-gray-50 transition-colors">
                                        <TableCell className="py-4 px-3 align-top font-medium">{entry.className}</TableCell>
                                        <TableCell className="py-4 px-3 align-top">{entry.section}</TableCell>
                                        <TableCell className="py-4 px-3 align-top">{entry.subjectGroup}</TableCell>
                                        <TableCell className="py-4 px-3 align-top">{entry.subject}</TableCell>
                                        <TableCell className="py-4 px-3 align-top text-right pr-12">
                                            <div className="flex flex-col gap-1.5">
                                                {entry.lessons.map((lesson, idx) => (
                                                    <div key={idx} className="leading-tight">{lesson}</div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-3 align-top text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-2">
                        <div>
                            Showing 1 to {mockLessons.length} of {mockLessons.length} entries
                        </div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-7 border-gray-200 px-2" disabled>
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="default" size="sm" className="h-7 bg-indigo-500 border-0 text-white min-w-[28px]">
                                1
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 border-gray-200 px-2" disabled>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
