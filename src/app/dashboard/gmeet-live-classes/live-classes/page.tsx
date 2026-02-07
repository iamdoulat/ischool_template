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
import { Plus, Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function LiveClassesPage() {
    const classesData = [
        {
            id: 1,
            title: "Recent Ongoing Class",
            description: "Recent Ongoing Class",
            dateTime: "06/06/2026 09:30:00",
            duration: 45,
            createdBy: "Ion Mack (Super Admin - 00001)",
            createdFor: "Holden Avinct-Teacher- 00025",
            classes: ["Class 4 (A)", "Class 5 (B)", "Class 6 (C)", "Class 1 (D)"],
            status: "Awaited"
        },
        {
            id: 2,
            title: "English Grammar Session",
            description: "English Grammar Session",
            dateTime: "02/27/2025 07:54:03",
            duration: 45,
            createdBy: "Ion Mack (Super Admin - 00001)",
            createdFor: "William Albert (Admin - 00026)",
            classes: ["Class 5 (A)", "Class 1 (B)", "Class 2 (C)", "Class 1 (D)", "Class 1 (E)"],
            status: "Awaited"
        },
        {
            id: 3,
            title: "Science Class",
            description: "Science Class",
            dateTime: "02/15/2025 05:35:03",
            duration: 45,
            createdBy: "Ion Mack (Super Admin - 00001)",
            createdFor: "Jason Shurian-Teacher- 000255",
            classes: ["Class 5 (A)", "Class 1 (B)", "Class 2 (C)", "Class 1 (D)"],
            status: "Awaited"
        },
        {
            id: 4,
            title: "Class - Mathematics",
            description: "Class - Mathematics",
            dateTime: "02/10/2026 05:18:02",
            duration: 35,
            createdBy: "Ion Mack (Super Admin - 00001)",
            createdFor: "Shayan Varma-Teacher- 00023",
            classes: ["Class 1 (A)", "Class 1 (B)", "Class 5 (C)", "Class 1 (D)"],
            status: "Awaited"
        },
        {
            id: 5,
            title: "English Classes",
            description: "English Classes",
            dateTime: "06/06/2026 08:30:03",
            duration: 45,
            createdBy: "Ion Mack (Super Admin - 00001)",
            createdFor: "Jason Shurian-Teacher- 000455",
            classes: ["Class 1 (A)", "Class 1 (B)", "Class 2 (C)", "Class 1 (D)"],
            status: "Awaited"
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Live Classes</CardTitle>
                    <Button className="h-9 px-4 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                        <Plus className="h-4 w-4" />
                        Add
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 flex items-center gap-4 border-b border-muted/20">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-9 h-9 rounded-md bg-white border-muted/50 focus-visible:ring-primary/20 text-xs"
                            />
                        </div>
                        <span className="text-xs text-muted-foreground ml-auto">50</span>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20 bg-muted/5">
                                    <TableHead className="w-12 pl-6">
                                        <Checkbox />
                                    </TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Class Title</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Description</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Date Time</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Class Duration (Minutes)</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Created By</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Created For</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Classes</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Status</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3 pr-6 text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classesData.map((row, index) => (
                                    <TableRow key={row.id} className={`hover:bg-muted/20 border-b border-muted/10 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-muted/5'}`}>
                                        <TableCell className="pl-6">
                                            <Checkbox />
                                        </TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3 font-medium">{row.title}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">{row.description}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">{row.dateTime}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3 text-center">{row.duration}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">{row.createdBy}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">{row.createdFor}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">
                                            <div className="space-y-0.5">
                                                {row.classes.map((cls, i) => (
                                                    <div key={i} className="flex items-center gap-1">
                                                        <Checkbox className="h-3 w-3" />
                                                        <span className="text-xs">{cls}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Select defaultValue={row.status.toLowerCase()}>
                                                <SelectTrigger className="h-7 w-[100px] text-xs bg-white border-muted/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="awaited">Awaited</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="pr-6 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button size="icon" className="h-7 w-7 rounded-sm bg-green-500 hover:bg-green-600 text-white shadow-sm">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" className="h-7 w-7 rounded-sm bg-purple-500 hover:bg-purple-600 text-white shadow-sm">
                                                    <Plus className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="p-4 border-t border-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Showing 1 to 5 of 15 entries</span>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7 rounded-md">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="icon" className="h-7 w-7 rounded-md bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md">
                                1
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7 rounded-md">
                                2
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7 rounded-md">
                                3
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7 rounded-md">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
