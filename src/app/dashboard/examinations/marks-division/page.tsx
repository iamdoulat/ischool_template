"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, X } from "lucide-react";

interface Division {
    id: string;
    name: string;
    percentFrom: string;
    percentUpto: string;
}

const mockDivisions: Division[] = [
    { id: "1", name: "First", percentFrom: "100.00", percentUpto: "60.00" },
    { id: "2", name: "Second", percentFrom: "60.00", percentUpto: "40.00" },
    { id: "3", name: "Third", percentFrom: "40.00", percentUpto: "0.00" },
];

export default function MarksDivisionPage() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Add Marks Division Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                        <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Add Marks Division</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="divisionName" className="text-xs font-semibold text-gray-600">
                                    Division Name <span className="text-red-500">*</span>
                                </Label>
                                <Input id="divisionName" className="h-9" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="percentFrom" className="text-xs font-semibold text-gray-600">
                                    Percent From <span className="text-red-500">*</span>
                                </Label>
                                <Input id="percentFrom" className="h-9" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="percentUpto" className="text-xs font-semibold text-gray-600">
                                    Percent Upto <span className="text-red-500">*</span>
                                </Label>
                                <Input id="percentUpto" className="h-9" />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-9">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Division List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Division List</h2>

                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 text-[11px] uppercase">
                                    <TableRow>
                                        <TableHead className="font-semibold text-gray-600 h-10">Division Name</TableHead>
                                        <TableHead className="font-semibold text-gray-600 h-10">Percentage From</TableHead>
                                        <TableHead className="font-semibold text-gray-600 h-10">Percentage Upto</TableHead>
                                        <TableHead className="font-semibold text-gray-600 h-10 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockDivisions.map((division) => (
                                        <TableRow key={division.id} className="text-[13px] hover:bg-gray-50/50">
                                            <TableCell className="text-indigo-600 font-medium py-3 cursor-pointer">{division.name}</TableCell>
                                            <TableCell className="text-gray-600 py-3">{division.percentFrom}</TableCell>
                                            <TableCell className="text-gray-600 py-3">{division.percentUpto}</TableCell>
                                            <TableCell className="text-right py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        size="sm"
                                                        className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                        title="Delete"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
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
        </div>
    );
}
