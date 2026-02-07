"use client";

import { useState } from "react";
import {
    Search,
    Printer,
    FileText,
    Table as TableIcon,
    FileDown,
    Download,
    Columns,
    ChevronDown,
    Pencil,
    Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const tabs = [
    { id: "purpose", label: "Purpose" },
    { id: "complaint-type", label: "Complaint Type" },
    { id: "source", label: "Source" },
    { id: "reference", label: "Reference" },
];

const mockData: Record<string, any[]> = {
    purpose: [
        { id: "1", name: "Staff", description: "" },
        { id: "2", name: "Parent", description: "" },
        { id: "3", name: "Student", description: "" },
    ],
    "complaint-type": [
        { id: "1", name: "Fees", description: "" },
        { id: "2", name: "Study", description: "" },
        { id: "3", name: "Teacher", description: "" },
    ],
    source: [
        { id: "1", name: "Advertisement", description: "" },
        { id: "2", name: "Online Front Site", description: "" },
        { id: "3", name: "Google Ads", description: "" },
    ],
    reference: [
        { id: "1", name: "Staff", description: "" },
        { id: "2", name: "Parent", description: "" },
        { id: "3", name: "Student", description: "" },
    ],
};

export default function SetupFrontOfficePage() {
    const [activeTab, setActiveTab] = useState("purpose");

    const currentTabLabel = tabs.find(t => t.id === activeTab)?.label || "";

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Column 1: Vertical Tabs */}
                <div className="md:col-span-2">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                        <div className="flex flex-col">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center px-4 py-3.5 text-sm font-semibold transition-all border-b border-muted/30 last:border-0",
                                        activeTab === tab.id
                                            ? "bg-muted/50 text-[#FFA500] border-l-4 border-l-[#FFA500]"
                                            : "text-muted-foreground hover:bg-muted/20 hover:text-slate-900 border-l-4 border-l-transparent"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Column 2: Add Form */}
                <div className="md:col-span-4">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-muted/50 pb-4">
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Add {currentTabLabel}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-1.5 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                    {currentTabLabel} <span className="text-destructive">*</span>
                                </label>
                                <Input className="h-10 rounded-lg bg-muted/30 border-muted/50 transition-all hover:border-indigo-200" />
                            </div>

                            <div className="space-y-1.5 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Description</label>
                                <Textarea className="min-h-[120px] rounded-lg bg-muted/30 border-muted/50 resize-none" />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button variant="gradient" className="h-10 px-8">
                                    Save
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Column 3: List Table */}
                <div className="md:col-span-6">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-muted/50 pb-4">
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">{currentTabLabel} List</CardTitle>
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
                                            <Th>{currentTabLabel}</Th>
                                            <Th>Description</Th>
                                            <Th className="text-right">Action</Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/30">
                                        {mockData[activeTab].map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/10 transition-colors group">
                                                <Td className="font-semibold text-slate-700">{item.name}</Td>
                                                <Td className="text-slate-600 font-medium">{item.description || "-"}</Td>
                                                <Td className="text-right">
                                                    <div className="flex justify-end gap-1 px-2">
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
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Showing 1 to {mockData[activeTab].length} of {mockData[activeTab].length} entries</p>
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
