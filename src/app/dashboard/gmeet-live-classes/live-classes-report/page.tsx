"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Eye } from "lucide-react";

export default function LiveClassesReportPage() {
    const reportData = [
        {
            id: 1,
            classTitle: "Online Learning Class",
            description: "Online Learning Class",
            dateTime: "15/10/2025 10:30:00",
            createdBy: "",
            createdFor: "Albert Thomas (Teacher - 545645454)",
            totalJoin: 3
        },
        {
            id: 2,
            classTitle: "Mathematics Classes",
            description: "Mathematics Classes",
            dateTime: "05/10/2025 10:50:00",
            createdBy: "",
            createdFor: "Shayan Varma (Teacher - 00023)",
            totalJoin: 2
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-sm font-semibold text-slate-700">Select Criteria</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-slate-600">Class</Label>
                            <Select defaultValue="class1">
                                <SelectTrigger className="h-9 bg-white border-muted/50 text-xs">
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="class1">Class 1</SelectItem>
                                    <SelectItem value="class2">Class 2</SelectItem>
                                    <SelectItem value="class3">Class 3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-slate-600">Section</Label>
                            <Select defaultValue="a">
                                <SelectTrigger className="h-9 bg-white border-muted/50 text-xs">
                                    <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="a">A</SelectItem>
                                    <SelectItem value="b">B</SelectItem>
                                    <SelectItem value="c">C</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button className="h-9 px-6 rounded-md bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5558DD] hover:to-[#7C3AED] text-white text-xs font-bold gap-2 shadow-sm active:scale-95 transition-all">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Live Classes Report</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 flex items-center border-b border-muted/20">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-9 h-9 rounded-md bg-white border-muted/50 focus-visible:ring-primary/20 text-xs"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20 bg-muted/5">
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3 pl-6">Class Title</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Description</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Date Time</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Created By</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Created For</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Total Join</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3 pr-6 text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.map((row, index) => (
                                    <TableRow key={row.id} className={`hover:bg-muted/20 border-b border-muted/10 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-muted/5'}`}>
                                        <TableCell className="text-slate-700 text-xs py-3 pl-6 font-medium">{row.classTitle}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">{row.description}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">{row.dateTime}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">{row.createdBy}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">{row.createdFor}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3 text-center">{row.totalJoin}</TableCell>
                                        <TableCell className="pr-6 py-3">
                                            <div className="flex items-center justify-center">
                                                <Button size="icon" className="h-7 w-7 rounded-sm bg-purple-500 hover:bg-purple-600 text-white shadow-sm">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
