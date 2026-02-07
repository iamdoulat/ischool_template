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
import {
    Plus,
    Search,
    Pencil,
    X,
    FileText,
    MoreHorizontal
} from "lucide-react";

export default function IncidentsPage() {
    const incidents = [
        { id: 1, title: "Harassment and bullying", point: -10, description: "If students report this type of behaviour, institutions will be able to monitor the individuals involved. They can then try to resolve the situation." },
        { id: 2, title: "Improper behaviour", point: -10, description: "Improper behaviour could be observed in a staff member or another student. If the behaviour is threatening, concerning or inappropriate, the university or school will need to monitor the individual to ensure that the behaviour is not repetitive." },
        { id: 3, title: "Theft", point: -15, description: "It's important to report cases of theft on campus so that the university or school can increase security where needed. They could also consider other options to combat incidents of theft, such as lockers." },
        { id: 4, title: "Student Good Behaviour", point: 20, description: "Smile & have a good attitude and good behaviour." },
        { id: 5, title: "Respect others/property", point: 10, description: "Respect others/property." },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Incident List</CardTitle>
                    </div>
                    <Button className="h-9 px-4 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                        <Plus className="h-4 w-4" />
                        Add
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
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline">Export</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MoreHorizontal className="h-4 w-4" />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pl-6">Title</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 text-center">Point</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 w-[50%]">Description</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pr-6 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {incidents.map((incident) => (
                                    <TableRow key={incident.id} className="hover:bg-muted/30 border-b border-muted/10 transition-colors">
                                        <TableCell className="font-bold text-slate-700 text-xs pl-6 py-4">{incident.title}</TableCell>
                                        <TableCell className="font-bold text-slate-700 text-xs text-center py-4">{incident.point}</TableCell>
                                        <TableCell className="text-slate-500 text-xs leading-relaxed py-4">{incident.description}</TableCell>
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
                        <span>Showing 1 to 5 of 5 entries</span>
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
