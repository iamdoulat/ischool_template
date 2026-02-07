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
import { Plus, Search, Pencil, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function SettingPage() {
    const branchData = [
        { id: 1, branch: "Mount Carmel School 1", url: "https://demo.smart-school.io/branch2/" },
        { id: 2, branch: "Mount Carmel School 2", url: "https://demo.smart-school.io/branch2/" },
        { id: 3, branch: "Mount Carmel School 3", url: "https://demo.smart-school.io/branch2/" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Setting</CardTitle>
                    <Button className="h-9 px-4 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                        <Plus className="h-4 w-4" />
                        Add New
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 flex justify-between items-center border-b border-muted/20">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-9 h-9 rounded-full bg-muted/30 border-muted/50 focus-visible:ring-primary/20 text-xs"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pl-6">Branch</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">URL</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pr-6 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {branchData.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-muted/30 border-b border-muted/10 transition-colors">
                                        <TableCell className="text-slate-700 text-sm pl-6 py-4">{row.branch}</TableCell>
                                        <TableCell className="text-blue-600 text-sm py-4 underline hover:text-blue-800 cursor-pointer">
                                            {row.url}
                                        </TableCell>
                                        <TableCell className="pr-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="icon"
                                                    className="h-7 w-7 rounded-sm bg-[#6366F1] hover:bg-[#5558DD] text-white shadow-sm"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    className="h-7 w-7 rounded-sm bg-[#6366F1] hover:bg-[#5558DD] text-white shadow-sm"
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

                    <div className="p-4 border-t border-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Showing 1 to 3 of 3 entries</span>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" disabled>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="default" size="icon" className="h-7 w-7 rounded-md bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md">
                                1
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7 rounded-md" disabled>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
