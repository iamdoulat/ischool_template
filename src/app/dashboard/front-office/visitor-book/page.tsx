"use client";

import {
    Search,
    Plus,
    Printer,
    FileText,
    Table as TableIcon,
    FileDown,
    Download,
    Columns,
    ChevronDown,
    Eye,
    Pencil,
    Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const visitorData = [
    { id: "1", purpose: "Parent Teacher Meeting", meetingWith: "Student (RAM - 7656)", name: "David", phone: "56677467", idCard: "234", persons: "2", date: "01/24/2026", inTime: "01:13 PM", outTime: "02:15 PM" },
    { id: "2", purpose: "Marketing", meetingWith: "Staff (Shivam Verma - 9002)", name: "Peter", phone: "098096789", idCard: "5676", persons: "5", date: "01/21/2026", inTime: "11:37 AM", outTime: "12:35 PM" },
    { id: "3", purpose: "Marketing", meetingWith: "Student (Vinay Singh - 5422)", name: "Arun Goyal", phone: "566456", idCard: "46546", persons: "2", date: "01/15/2026", inTime: "05:55 PM", outTime: "06:55 PM", hasDownload: true },
    { id: "4", purpose: "School Events", meetingWith: "Student (Vinay Singh - 5422)", name: "Jamesh", phone: "0808979678", idCard: "678869", persons: "6", date: "01/13/2026", inTime: "11:30 AM", outTime: "12:30 PM", hasDownload: true },
    { id: "5", purpose: "Parent Teacher Meeting", meetingWith: "Student (Vinay Singh - 5422)", name: "David Wilson", phone: "90807899678", idCard: "546456", persons: "5", date: "01/09/2026", inTime: "04:07 PM", outTime: "05:07 PM", hasDownload: true },
];

export default function VisitorBookPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between border-b border-muted/50 pb-4">
                    <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Visitor List</CardTitle>
                    <Button variant="gradient" size="sm" className="h-9 px-6">
                        <Plus className="h-4 w-4" /> Add
                    </Button>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search"
                                className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50 focus:ring-2 focus:ring-[#008489]/20"
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
                                    <Th>Purpose</Th>
                                    <Th>Meeting With</Th>
                                    <Th>Visitor Name</Th>
                                    <Th>Phone</Th>
                                    <Th>ID Card</Th>
                                    <Th>Number Of Person</Th>
                                    <Th>Date</Th>
                                    <Th>In Time</Th>
                                    <Th>Out Time</Th>
                                    <Th className="text-right">Action</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted/30">
                                {visitorData.map((visitor) => (
                                    <tr key={visitor.id} className="hover:bg-muted/10 transition-colors group">
                                        <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.purpose}</Td>
                                        <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.meetingWith}</Td>
                                        <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.name}</Td>
                                        <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.phone}</Td>
                                        <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.idCard}</Td>
                                        <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.persons}</Td>
                                        <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.date}</Td>
                                        <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.inTime}</Td>
                                        <Td className="text-slate-600 font-medium whitespace-nowrap">{visitor.outTime}</Td>
                                        <Td className="text-right">
                                            <div className="flex justify-end gap-1 px-1">
                                                <ActionBtn icon={Eye} className="bg-[#4F39F6]" />
                                                {visitor.hasDownload && <ActionBtn icon={Download} className="bg-[#4F39F6]" />}
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
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Showing 1 to 5 of 22 entries</p>
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
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-4 py-4 border-b border-muted/50", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-4 py-4 text-sm", className)}>{children}</td>;
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
