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
    Phone,
    Pencil,
    Trash2,
    Calendar,
    Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const enquiryData = [
    { id: "1", name: "abha", phone: "8965896589", source: "Advertisement", date: "02/02/2026", lastFollowUp: "", nextFollowUp: "02/09/2026", status: "Active" },
    { id: "2", name: "abha", phone: "9865897456", source: "Advertisement", date: "02/02/2026", lastFollowUp: "", nextFollowUp: "02/10/2026", status: "Active" },
    { id: "3", name: "adi", phone: "5453453", source: "Advertisement", date: "01/27/2026", lastFollowUp: "", nextFollowUp: "01/27/2026", status: "Active", highlighted: true },
    { id: "4", name: "Enquiry", phone: "7656565464", source: "Advertisement", date: "01/26/2026", lastFollowUp: "", nextFollowUp: "01/26/2026", status: "Active", highlighted: true },
    { id: "5", name: "admission", phone: "887575757", source: "Advertisement", date: "01/24/2026", lastFollowUp: "", nextFollowUp: "01/24/2026", status: "Active", highlighted: true },
    { id: "6", name: "Enquiry", phone: "646564657", source: "Front Office", date: "01/21/2026", lastFollowUp: "01/21/2026", nextFollowUp: "01/23/2026", status: "Active", highlighted: true },
    { id: "7", name: "nidhi", phone: "67646467675", source: "Google Ads", date: "01/19/2026", lastFollowUp: "01/19/2026", nextFollowUp: "01/22/2026", status: "Active", highlighted: true },
];

export default function AdmissionEnquiryPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Select Criteria Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b border-muted/50 pb-4">
                    <CardTitle className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <Filter className="h-5 w-5 text-indigo-500" />
                        Select Criteria
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-6 gap-4 items-end">
                        <div className="space-y-2 group lg:col-span-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Class</label>
                            <div className="relative">
                                <select className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer group-hover:border-indigo-200 transition-colors">
                                    <option>Select</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2 group lg:col-span-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Source</label>
                            <div className="relative">
                                <select className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer group-hover:border-indigo-200 transition-colors">
                                    <option>Select</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2 group lg:col-span-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                Enquiry From Date <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <Input className="h-10 rounded-lg bg-muted/30 border-muted/50 pr-10" />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2 group lg:col-span-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                Enquiry To Date <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <Input className="h-10 rounded-lg bg-muted/30 border-muted/50 pr-10" />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2 group lg:col-span-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Status</label>
                            <div className="relative">
                                <select className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer group-hover:border-indigo-200 transition-colors">
                                    <option>Active</option>
                                    <option>Passive</option>
                                    <option>Dead</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="lg:col-span-1 flex justify-end">
                            <Button variant="gradient" className="h-10 px-8">
                                <Search className="h-4 w-4 text-white" />
                                Search
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Admission Enquiry List Table */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-muted/50 pb-4">
                    <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Admission Enquiry</CardTitle>
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
                                    <Th>Name</Th>
                                    <Th>Phone</Th>
                                    <Th>Source</Th>
                                    <Th>Enquiry Date</Th>
                                    <Th>Last Follow Up Date</Th>
                                    <Th>Next Follow Up Date</Th>
                                    <Th>Status</Th>
                                    <Th className="text-right">Action</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted/30">
                                {enquiryData.map((item) => (
                                    <tr key={item.id} className={cn(
                                        "hover:bg-muted/10 transition-colors",
                                        item.highlighted && "bg-[#FBE9E9]/40 hover:bg-[#FBE9E9]/60"
                                    )}>
                                        <Td className="font-semibold text-slate-700">{item.name}</Td>
                                        <Td className="text-slate-600 font-medium">{item.phone}</Td>
                                        <Td className="text-slate-600 font-medium">{item.source}</Td>
                                        <Td className="text-slate-600 font-medium">{item.date}</Td>
                                        <Td className="text-slate-600 font-medium">{item.lastFollowUp || "-"}</Td>
                                        <Td className="text-slate-600 font-medium">{item.nextFollowUp}</Td>
                                        <Td>
                                            <Badge variant="outline" className="text-[10px] font-bold border-indigo-200 text-indigo-700 bg-indigo-50/30 px-2 py-0.5">
                                                {item.status}
                                            </Badge>
                                        </Td>
                                        <Td className="text-right">
                                            <div className="flex justify-end gap-1 px-2">
                                                <ActionBtn icon={Phone} className="bg-[#4F39F6]" />
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
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Showing 1 to 7 of 16 entries</p>
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
        <button className={cn("p-1.5 text-white rounded transition-all hover:shadow-md", className)}>
            <Icon className="h-3 w-3" />
        </button>
    );
}
