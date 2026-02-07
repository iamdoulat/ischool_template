"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, FolderOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Reports Tabs/Links Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50 pb-0">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700 mb-4">Reports</CardTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-1">
                        <ReportLink label="Student Incident Report" active />
                        <ReportLink label="Student Behaviour Rank Report" />
                        <ReportLink label="Class Wise Rank Report" />
                        <ReportLink label="Class Section Wise Rank Report" />
                        <ReportLink label="House Wise Rank Report" />
                        <ReportLink label="Incident Wise Report" />
                    </div>
                </CardHeader>

                {/* Select Criteria Section */}
                <div className="p-6">
                    <h3 className="text-sm font-bold text-slate-600 mb-4">Select Criteria</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Class</label>
                            <Select>
                                <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-muted/50 focus:ring-primary/20">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="class1">Class 1</SelectItem>
                                    <SelectItem value="class2">Class 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Section</label>
                            <Select>
                                <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-muted/50 focus:ring-primary/20">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="section1">Section A</SelectItem>
                                    <SelectItem value="section2">Section B</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Session</label>
                            <Select>
                                <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-muted/50 focus:ring-primary/20">
                                    <SelectValue placeholder="Current Session Points" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="current">Current Session Points</SelectItem>
                                    <SelectItem value="all">All Sessions</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-6">
                        <Button className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Student Incident List Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Student Incident List</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[300px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pl-6">Admission No</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Student Name</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Class (Section)</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Gender</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Phone</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Total Incidents</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Total Points</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pr-6 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Empty State */}
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableCell colSpan={8} className="h-[250px] text-center">
                                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground/50">
                                            <div className="p-4 rounded-full bg-muted/20">
                                                <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                                            </div>
                                            <span className="text-xs font-medium text-destructive/50 bg-destructive/5 px-4 py-1.5 rounded-full">No data available in table</span>
                                            <p className="text-[10px] uppercase font-bold text-emerald-600 flex items-center gap-1 mt-2">
                                                <span>←</span> Add new record or search with different criteria.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                    <div className="p-4 border-t border-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Showing 0 to 0 of 0 entries</span>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" disabled>
                                <span className="sr-only">Previous</span>
                                &lt;
                            </Button>
                            <Button variant="default" size="icon" className="h-7 w-7 rounded-md bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md">
                                1
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" disabled>
                                <span className="sr-only">Next</span>
                                &gt;
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ReportLink({ label, active }: { label: string, active?: boolean }) {
    return (
        <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm font-semibold",
            active ? "bg-muted/50 text-slate-800" : "text-muted-foreground hover:text-slate-700 hover:bg-muted/30"
        )}>
            <div className={cn("p-1 rounded bg-muted/50", active && "bg-white shadow-sm")}>
                <FileText className="h-3.5 w-3.5" />
            </div>
            <span>{label}</span>
        </div>
    )
}
