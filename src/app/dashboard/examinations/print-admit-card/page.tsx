"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";

export default function PrintAdmitCardPage() {
    return (
        <div className="space-y-6">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-6">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="examGroup" className="text-xs font-semibold text-gray-600">
                            Exam Group <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="gpa">
                            <SelectTrigger id="examGroup">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gpa">GPA Exam Grading System</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="exam" className="text-xs font-semibold text-gray-600">
                            Exam <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="monthly">
                            <SelectTrigger id="exam">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">Monthly Exam Practice(November-2025)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="session" className="text-xs font-semibold text-gray-600">
                            Session <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="2018-19">
                            <SelectTrigger id="session">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2018-19">2018-19</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="class" className="text-xs font-semibold text-gray-600">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="class2">
                            <SelectTrigger id="class">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="section" className="text-xs font-semibold text-gray-600">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="b">
                            <SelectTrigger id="section">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 gap-2 text-xs">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            {/* Student List Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-lg font-medium text-gray-800">Student List</h2>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 text-xs h-8">
                        Generate
                    </Button>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 text-xs uppercase">
                            <TableRow>
                                <TableHead className="w-[40px] px-4">
                                    <Checkbox className="border-gray-400" />
                                </TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[120px]">Admission No</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[150px]">Student Name</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[150px]">Father Name</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[120px]">Date Of Birth</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">Gender</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">Category</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[120px]">Mobile Number</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Empty state or mock row to show structure */}
                            <TableRow className="h-12 hover:bg-gray-50">
                                <TableCell colSpan={8} className="text-center text-gray-500 text-sm">
                                    No Data Available
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
