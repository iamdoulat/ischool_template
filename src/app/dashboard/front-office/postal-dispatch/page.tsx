"use client";

import {
    Search,
    Printer,
    FileText,
    Table as TableIcon,
    FileDown,
    Download,
    Columns,
    ChevronDown,
    Eye,
    Pencil,
    Trash2,
    Calendar,
    CloudUpload
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const dispatchData = [
    { id: "1", to: "Fees Discussion", ref: "RFN2400", from: "Fees Discussion", date: "01/19/2026", hasDownload: true },
    { id: "2", to: "NCC Camp Program", ref: "RFN2412", from: "NCC Camp Program", date: "01/26/2026" },
    { id: "3", to: "Books deliver in School", ref: "RFN8856", from: "Books deliver in School", date: "01/22/2026" },
    { id: "4", to: "Exam Center Office", ref: "RFN3452", from: "Exam Center Office", date: "01/17/2026" },
    { id: "5", to: "Fees Discussion", ref: "RFN6573", from: "Fees Discussion", date: "01/12/2026" },
];

export default function PostalDispatchPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Left Column: Add Postal Dispatch Form */}
                <div className="md:col-span-4">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-muted/50 pb-4">
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Add Postal Dispatch</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-1.5 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                    To Title <span className="text-destructive">*</span>
                                </label>
                                <Input className="h-10 rounded-lg bg-muted/30 border-muted/50 transition-all hover:border-indigo-200" />
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Reference No</label>
                                <Input className="h-10 rounded-lg bg-muted/30 border-muted/50" />
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Address</label>
                                <Textarea className="min-h-[80px] rounded-lg bg-muted/30 border-muted/50 resize-none" />
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Note</label>
                                <Textarea className="min-h-[80px] rounded-lg bg-muted/30 border-muted/50 resize-none" />
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">From Title</label>
                                <Input className="h-10 rounded-lg bg-muted/30 border-muted/50" />
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Date</label>
                                <div className="relative">
                                    <Input defaultValue="02/02/2026" className="h-10 rounded-lg bg-muted/30 border-muted/50 pr-10" />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Attach Document</label>
                                <div className="border-2 border-dashed border-muted/50 rounded-lg p-6 bg-muted/10 group-hover:bg-muted/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group-hover:border-indigo-300">
                                    <div className="p-2 rounded-full bg-muted/30">
                                        <CloudUpload className="h-5 w-5 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                    <p className="text-xs font-semibold text-muted-foreground group-hover:text-slate-900 transition-colors">Drag and drop a file here or click</p>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button variant="gradient" className="h-10 px-8">
                                    Save
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Postal Dispatch List Table */}
                <div className="md:col-span-8">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-muted/50 pb-4">
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Postal Dispatch List</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search"
                                        className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 mr-4">
                                        <span className="text-sm font-semibold text-muted-foreground">50</span>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex gap-1">
                                        <IconButton icon={Printer} />
                                        <IconButton icon={FileText} />
                                        <IconButton icon={TableIcon} />
                                        <IconButton icon={FileDown} />
                                        <IconButton icon={Download} />
                                        <IconButton icon={Columns} />
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto rounded-xl border border-muted/50">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <Th>To Title</Th>
                                            <Th>Reference No</Th>
                                            <Th>From Title</Th>
                                            <Th>Date</Th>
                                            <Th className="text-right">Action</Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/30">
                                        {dispatchData.map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/10 transition-colors group">
                                                <Td className="font-semibold text-slate-700">{item.to}</Td>
                                                <Td className="text-slate-600 font-medium">{item.ref}</Td>
                                                <Td className="text-slate-600 font-medium">{item.from}</Td>
                                                <Td className="text-slate-600 font-medium">{item.date}</Td>
                                                <Td className="text-right">
                                                    <div className="flex justify-end gap-1 px-2">
                                                        <ActionBtn icon={Eye} className="bg-[#4F39F6]" />
                                                        {item.hasDownload && <ActionBtn icon={Download} className="bg-[#4F39F6]" />}
                                                        <ActionBtn icon={Pencil} className="bg-[#4F39F6]" />
                                                        <ActionBtn icon={Trash2} className="bg-[#4F39F6]" />
                                                    </div>
                                                </Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Showing 1 to 5 of 14 entries</p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                        <ChevronDown className="h-4 w-4 rotate-90" />
                                    </Button>
                                    <Button className="h-8 w-8 rounded-lg border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-br from-[#FF9800] to-[#4F39F6]">1</Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                        <ChevronDown className="h-4 w-4 -rotate-90" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-4 py-4 border-b border-muted/50", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-4 py-4 text-sm whitespace-nowrap", className)}>{children}</td>;
}

function IconButton({ icon: Icon }: { icon: any }) {
    return (
        <button className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm">
            <Icon className="h-4 w-4" />
        </button>
    );
}

function ActionBtn({ icon: Icon, className }: { icon: any, className?: string }) {
    return (
        <button className={cn("p-1.5 text-white rounded transition-all hover:shadow-md active:scale-90", className)}>
            <Icon className="h-3 w-3" />
        </button>
    );
}
