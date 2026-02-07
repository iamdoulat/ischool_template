"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, X } from "lucide-react";

interface GradeEntry {
    id: string;
    examType: string;
    gradeName: string;
    percentFromUpto: string;
    gradePoint: string;
    description: string;
}

const mockGradeData: GradeEntry[] = [
    // General Purpose (Pass/Fail)
    { id: "1", examType: "General Purpose (Pass/Fail)", gradeName: "B-", percentFromUpto: "0.00 To 40.00", gradePoint: "0.0", description: "" },
    { id: "2", examType: "General Purpose (Pass/Fail)", gradeName: "B", percentFromUpto: "40.00 To 50.00", gradePoint: "0.0", description: "" },
    { id: "3", examType: "General Purpose (Pass/Fail)", gradeName: "B+", percentFromUpto: "50.00 To 60.00", gradePoint: "0.0", description: "" },
    { id: "4", examType: "General Purpose (Pass/Fail)", gradeName: "B++", percentFromUpto: "60.00 To 70.00", gradePoint: "0.0", description: "" },
    { id: "5", examType: "General Purpose (Pass/Fail)", gradeName: "A", percentFromUpto: "70.00 To 80.00", gradePoint: "0.0", description: "" },
    { id: "6", examType: "General Purpose (Pass/Fail)", gradeName: "A+", percentFromUpto: "80.00 To 90.00", gradePoint: "0.0", description: "" },
    { id: "7", examType: "General Purpose (Pass/Fail)", gradeName: "A++", percentFromUpto: "90.00 To 100.00", gradePoint: "0.0", description: "" },
    { id: "8", examType: "General Purpose (Pass/Fail)", gradeName: "A++", percentFromUpto: "33.00 To 100.00", gradePoint: "2.0", description: "" },

    // School Based Grading System
    { id: "9", examType: "School Based Grading System", gradeName: "B-", percentFromUpto: "0.00 To 40.00", gradePoint: "0.0", description: "" },
    { id: "10", examType: "School Based Grading System", gradeName: "B", percentFromUpto: "40.00 To 50.00", gradePoint: "0.0", description: "" },
    { id: "11", examType: "School Based Grading System", gradeName: "B+", percentFromUpto: "50.00 To 60.00", gradePoint: "0.0", description: "" },
    { id: "12", examType: "School Based Grading System", gradeName: "B++", percentFromUpto: "60.00 To 70.00", gradePoint: "0.0", description: "" },
    { id: "13", examType: "School Based Grading System", gradeName: "A", percentFromUpto: "70.00 To 80.00", gradePoint: "0.0", description: "" },
    { id: "14", examType: "School Based Grading System", gradeName: "A+", percentFromUpto: "80.00 To 90.00", gradePoint: "0.0", description: "" },
    { id: "15", examType: "School Based Grading System", gradeName: "A++", percentFromUpto: "90.00 To 100.00", gradePoint: "0.0", description: "" },

    // College Based Grading System
    { id: "16", examType: "College Based Grading System", gradeName: "B-", percentFromUpto: "0.00 To 40.00", gradePoint: "0.0", description: "" },
    { id: "17", examType: "College Based Grading System", gradeName: "B", percentFromUpto: "40.00 To 50.00", gradePoint: "0.0", description: "" },
    { id: "18", examType: "College Based Grading System", gradeName: "B+", percentFromUpto: "50.00 To 60.00", gradePoint: "0.0", description: "" },
    { id: "19", examType: "College Based Grading System", gradeName: "B++", percentFromUpto: "60.00 To 70.00", gradePoint: "0.0", description: "" },
    { id: "20", examType: "College Based Grading System", gradeName: "A", percentFromUpto: "70.00 To 80.00", gradePoint: "0.0", description: "" },
    { id: "21", examType: "College Based Grading System", gradeName: "A+", percentFromUpto: "80.00 To 90.00", gradePoint: "0.0", description: "" },
    { id: "22", examType: "College Based Grading System", gradeName: "A++", percentFromUpto: "90.00 To 100.00", gradePoint: "0.0", description: "" },

    // GPA Grading System
    { id: "23", examType: "GPA Grading System", gradeName: "A+", percentFromUpto: "90.00 To 100.00", gradePoint: "4.5", description: "" },
    { id: "24", examType: "GPA Grading System", gradeName: "A", percentFromUpto: "80.00 To 90.00", gradePoint: "4.0", description: "" },
    { id: "25", examType: "GPA Grading System", gradeName: "B+", percentFromUpto: "70.00 To 80.00", gradePoint: "3.5", description: "" },
    { id: "26", examType: "GPA Grading System", gradeName: "B", percentFromUpto: "60.00 To 70.00", gradePoint: "3.0", description: "" },
    { id: "27", examType: "GPA Grading System", gradeName: "C+", percentFromUpto: "50.00 To 60.00", gradePoint: "2.5", description: "" },
    { id: "28", examType: "GPA Grading System", gradeName: "C", percentFromUpto: "40.00 To 50.00", gradePoint: "2.0", description: "" },
    { id: "29", examType: "GPA Grading System", gradeName: "D", percentFromUpto: "0.00 To 40.00", gradePoint: "1.0", description: "" },

    // Average Passing
    { id: "30", examType: "Average Passing", gradeName: "A+", percentFromUpto: "90.00 To 100.00", gradePoint: "0.0", description: "" },
    { id: "31", examType: "Average Passing", gradeName: "A", percentFromUpto: "80.00 To 90.00", gradePoint: "0.0", description: "" },
    { id: "32", examType: "Average Passing", gradeName: "B+", percentFromUpto: "70.00 To 80.00", gradePoint: "0.0", description: "" },
    { id: "33", examType: "Average Passing", gradeName: "B", percentFromUpto: "60.00 To 70.00", gradePoint: "0.0", description: "" },
    { id: "34", examType: "Average Passing", gradeName: "C+", percentFromUpto: "50.00 To 60.00", gradePoint: "0.0", description: "" },
    { id: "35", examType: "Average Passing", gradeName: "C", percentFromUpto: "40.00 To 50.00", gradePoint: "0.0", description: "" },
    { id: "36", examType: "Average Passing", gradeName: "D", percentFromUpto: "0.00 To 40.00", gradePoint: "0.0", description: "" },
];

export default function MarksGradePage() {
    const groupedData = useMemo(() => {
        const groups: { [key: string]: GradeEntry[] } = {};
        mockGradeData.forEach((entry) => {
            if (!groups[entry.examType]) {
                groups[entry.examType] = [];
            }
            groups[entry.examType].push(entry);
        });
        return Object.entries(groups);
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Add Marks Grade Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                        <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Add Marks Grade</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="examType" className="text-xs font-semibold text-gray-600">
                                    Exam Type <span className="text-red-500">*</span>
                                </Label>
                                <Select>
                                    <SelectTrigger id="examType" className="h-9">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General Purpose (Pass/Fail)</SelectItem>
                                        <SelectItem value="school">School Based Grading System</SelectItem>
                                        <SelectItem value="college">College Based Grading System</SelectItem>
                                        <SelectItem value="gpa">GPA Grading System</SelectItem>
                                        <SelectItem value="average">Average Passing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gradeName" className="text-xs font-semibold text-gray-600">
                                    Grade Name <span className="text-red-500">*</span>
                                </Label>
                                <Input id="gradeName" className="h-9" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="percentUpto" className="text-xs font-semibold text-gray-600">
                                    Percent Upto <span className="text-red-500">*</span>
                                </Label>
                                <Input id="percentUpto" className="h-9" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="percentFrom" className="text-xs font-semibold text-gray-600">
                                    Percent From <span className="text-red-500">*</span>
                                </Label>
                                <Input id="percentFrom" className="h-9" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gradePoint" className="text-xs font-semibold text-gray-600">
                                    Grade Point <span className="text-red-500">*</span>
                                </Label>
                                <Input id="gradePoint" className="h-9" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-semibold text-gray-600">
                                    Description
                                </Label>
                                <Textarea id="description" className="min-h-[100px]" />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-9">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Grade List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Grade List</h2>

                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 text-[11px] uppercase">
                                    <TableRow>
                                        <TableHead className="font-semibold text-gray-600 h-10">Exam Type</TableHead>
                                        <TableHead className="font-semibold text-gray-600 h-10">Grade Name</TableHead>
                                        <TableHead className="font-semibold text-gray-600 h-10">Percent From / Upto</TableHead>
                                        <TableHead className="font-semibold text-gray-600 h-10">Grade Point</TableHead>
                                        <TableHead className="font-semibold text-gray-600 h-10">Description</TableHead>
                                        <TableHead className="font-semibold text-gray-600 h-10 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedData.map(([type, entries]) => (
                                        entries.map((entry, index) => (
                                            <TableRow key={entry.id} className="text-[13px] border-b last:border-0 hover:bg-gray-50/50">
                                                {index === 0 ? (
                                                    <TableCell
                                                        rowSpan={entries.length}
                                                        className="font-medium text-gray-500 align-top border-r pt-3"
                                                    >
                                                        {type}
                                                    </TableCell>
                                                ) : null}
                                                <TableCell className="text-gray-600 font-medium py-2">{entry.gradeName}</TableCell>
                                                <TableCell className="text-gray-500 py-2">{entry.percentFromUpto}</TableCell>
                                                <TableCell className="text-gray-500 py-2">{entry.gradePoint}</TableCell>
                                                <TableCell className="text-gray-500 py-2">{entry.description}</TableCell>
                                                <TableCell className="text-right py-2">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
