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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye } from "lucide-react";

export default function LiveMeetingReportPage() {
    const reportData = [
        {
            id: 1,
            meetingTitle: "Student Health Scare Mission",
            description: "Student Health Scare Mission",
            dateTime: "01/05/2025 12:00:00",
            createdBy: "",
            totalJoin: 3
        },
        {
            id: 2,
            meetingTitle: "Online Teacher Training Meeting",
            description: "Online Teacher Training Meeting",
            dateTime: "10/05/2025 12:00:00",
            createdBy: "",
            totalJoin: 2
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Live Meeting Report</CardTitle>
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
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3 pl-6">Meeting Title</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Description</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Date Time</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Created By</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3">Total Join</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-3 pr-6 text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.map((row, index) => (
                                    <TableRow key={row.id} className={`hover:bg-muted/20 border-b border-muted/10 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-muted/5'}`}>
                                        <TableCell className="text-slate-700 text-xs py-3 pl-6 font-medium">{row.meetingTitle}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">{row.description}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">{row.dateTime}</TableCell>
                                        <TableCell className="text-slate-700 text-xs py-3">{row.createdBy}</TableCell>
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

                    <div className="p-4 border-t border-muted/20 text-xs text-muted-foreground">
                        <span>Showing 1 to 2 of 2 entries</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
