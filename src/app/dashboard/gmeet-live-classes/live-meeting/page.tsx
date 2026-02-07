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

export default function LiveMeetingPage() {
    const meetingsData = [
        { id: 1, title: "Webinar on testing Meeting", description: "Webinar on testing Meeting", dateType: "01/05/2025 12:30:00", duration: 45, createdBy: "", status: "Awaited", badge: true },
        { id: 2, title: "FTM Inauguration Online", description: "FTM Inauguration Online", dateType: "10/10/2025 11:30:00", duration: 45, createdBy: "", status: "Awaited", badge: true },
        { id: 3, title: "Document Explanation My meeting", description: "Document Explanation", dateType: "10/10/2025 12:00:00", duration: 45, createdBy: "", status: "Awaited", badge: true },
        { id: 4, title: "Student Health Scare Mission", description: "Student Health Scare Mission", dateType: "12/15/2025 03:15:00", duration: 35, createdBy: "", status: "Awaited", badge: true },
        { id: 5, title: "School Traumatic Past class", description: "School Traumatic Past class", dateType: "01/01/2025 12:30:00", duration: 45, createdBy: "", status: "Awaited", badge: true },
        { id: 6, title: "Student Health Scare Mission", description: "Student Health Scare Mission", dateType: "01/05/2025 12:00:00", duration: 54, createdBy: "", status: "Awaited", badge: true },
        { id: 7, title: "Project status updatess", description: "Project status updatess", dateType: "01/02/2025 12:30:00", duration: 54, createdBy: "", status: "Awaited", badge: true },
        { id: 8, title: "Finance Report Meeting", description: "Finance Report Meeting", dateType: "01/06/2025 01:50:00", duration: 54, createdBy: "", status: "Awaited", badge: true },
        { id: 9, title: "Republic Day Celebration", description: "Republic Day Celebration", dateType: "01/01/2026 12:30:00", duration: 38, createdBy: "", status: "Awaited", badge: true },
        { id: 10, title: "Staff Meeting", description: "Staff Meeting", dateType: "01/05/2026 03:30:00", duration: 38, createdBy: "", status: "Awaited", badge: true },
        { id: 11, title: "Teacher's Meeting", description: "Teacher's Meeting", dateType: "01/06/2026 12:30:00", duration: 45, createdBy: "", status: "Awaited", badge: true },
        { id: 12, title: "Teacher's Meeting", description: "Teacher's Meeting", dateType: "01/01/2026 12:30:00", duration: 35, createdBy: "", status: "Awaited", badge: true },
        { id: 13, title: "Teacher's Meeting", description: "Teacher's Meeting", dateType: "11/01/2025 12:00:00", duration: 45, createdBy: "Staff", status: "dropdown", badge: false },
        { id: 14, title: "Staff Meeting", description: "Staff Meeting", dateType: "11/08/2025 11:50:00", duration: 35, createdBy: "Staff", status: "dropdown", badge: false },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Live Meeting</CardTitle>
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
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3 pl-6">Meeting Title</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Description</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Date Type</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Class Duration (Minutes)</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Created By</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Status</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3 pr-6 text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {meetingsData.map((row, index) => (
                                    <TableRow key={row.id} className={`hover:bg-muted/20 border-b border-muted/10 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-muted/5'}`}>
                                        <TableCell className="text-slate-700 text-xs py-3 pl-6 font-medium">{row.title}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">{row.description}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">{row.dateType}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3 text-center">{row.duration}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">{row.createdBy}</TableCell>
                                        <TableCell className="py-3">
                                            {row.status === "dropdown" ? (
                                                <Select defaultValue="awaited">
                                                    <SelectTrigger className="h-7 w-[100px] text-xs bg-white border-muted/50">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="awaited">Awaited</SelectItem>
                                                        <SelectItem value="completed">Completed</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                row.badge && (
                                                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-orange-500 text-white inline-block">
                                                        Awaited
                                                    </span>
                                                )
                                            )}
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
                        <span>Showing 1 to 14 of 14 entries</span>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7 rounded-md">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="icon" className="h-7 w-7 rounded-md bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md">
                                1
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
