"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Printer, Copy } from "lucide-react";

interface SubjectGroup {
    id: string;
    name: string;
    classes: string[];
    subjects: string[];
}

const mockSubjectGroups: SubjectGroup[] = [
    {
        id: "1",
        name: "Class 1st Subject Group",
        classes: ["Class 1(A)", "Class 1(B)", "Class 1(C)", "Class 1(D)"],
        subjects: ["English", "Hindi", "Mathematics", "Science", "Drawing", "Computer", "Elective 1"],
    },
    {
        id: "2",
        name: "Class 2nd Subject Group",
        classes: ["Class 2(A)", "Class 2(B)", "Class 2(C)", "Class 2(D)"],
        subjects: ["English", "Hindi", "Mathematics", "Science", "Drawing", "Computer", "Elective 1"],
    },
    {
        id: "3",
        name: "Class 3rd Subject Group",
        classes: ["Class 3(A)", "Class 3(B)", "Class 3(C)", "Class 3(D)"],
        subjects: ["English", "Hindi", "Mathematics", "Science", "Social Studies", "Computer", "Elective 1", "Elective 2"],
    },
    {
        id: "4",
        name: "Class 4th Subject Group",
        classes: ["Class 4(A)", "Class 4(B)", "Class 4(C)", "Class 4(D)"],
        subjects: ["English", "Hindi", "Mathematics", "Science", "Social Studies", "Computer", "Elective 1", "Elective 2", "Elective 3"],
    },
    {
        id: "5",
        name: "Class 5th Subject Group",
        classes: ["Class 5(A)", "Class 5(B)", "Class 5(C)", "Class 5(D)"],
        subjects: ["English", "Hindi", "Mathematics", "Science", "Social Studies", "Drawing", "Computer", "Elective 1", "Elective 2"],
    },
];

const availableSubjects = [
    "English", "Hindi", "Mathematics", "Science", "Social Studies", "French", "Drawing", "Computer", "Elective 1", "Elective 2", "Elective 3"
];

const sections = ["A", "B", "C", "D"];

export default function SubjectGroupPage() {
    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Add Subject Group Form */}
            <div className="w-full lg:w-1/3 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Add Subject Group</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                Name <span className="text-red-500">*</span>
                            </Label>
                            <Input id="name" placeholder="" className="h-9" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="class" className="text-sm font-medium text-gray-700">
                                Class <span className="text-red-500">*</span>
                            </Label>
                            <Select>
                                <SelectTrigger id="class" className="h-9 font-medium">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="class1">Class 1</SelectItem>
                                    <SelectItem value="class2">Class 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                                Sections <span className="text-red-500">*</span>
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {sections.map(section => (
                                    <div key={section} className="flex items-center space-x-2">
                                        <Checkbox id={`section-${section}`} />
                                        <Label htmlFor={`section-${section}`} className="text-sm font-normal text-gray-600 cursor-pointer">
                                            {section}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">
                                Subject <span className="text-red-500">*</span>
                            </Label>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {availableSubjects.map((subject) => (
                                    <div key={subject} className="flex items-center space-x-2">
                                        <Checkbox id={`subject-${subject}`} />
                                        <Label
                                            htmlFor={`subject-${subject}`}
                                            className="text-sm font-normal text-gray-600 cursor-pointer"
                                        >
                                            {subject}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                Description
                            </Label>
                            <Textarea id="description" className="min-h-[100px] resize-none border-gray-200" />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-9 text-xs shadow-sm">
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Subject Group List */}
            <div className="w-full lg:w-2/3 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h2 className="text-lg font-medium text-gray-800">Subject Group List</h2>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6366f1]">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6366f1]">
                                <Printer className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50/50 text-[11px] uppercase">
                                <TableRow>
                                    <TableHead className="font-bold text-gray-700">Name</TableHead>
                                    <TableHead className="font-bold text-gray-700">Class (Section)</TableHead>
                                    <TableHead className="font-bold text-gray-700">Subject</TableHead>
                                    <TableHead className="font-bold text-gray-700 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockSubjectGroups.map((group) => (
                                    <TableRow key={group.id} className="text-[12px] hover:bg-gray-50/50 group align-top">
                                        <TableCell className="text-gray-600 font-medium py-4">{group.name}</TableCell>
                                        <TableCell className="text-gray-600 py-4">
                                            {group.classes.map((cls, idx) => (
                                                <div key={idx} className="mb-1">{idx + 1}. {cls}</div>
                                            ))}
                                        </TableCell>
                                        <TableCell className="text-gray-600 py-4 leading-relaxed whitespace-pre-line">
                                            {group.subjects.join("\n")}
                                        </TableCell>
                                        <TableCell className="text-right py-4">
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
                </div>
            </div>
        </div>
    );
}
