"use client";

import { Search, ChevronDown, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FeesCarryForwardPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Selection Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-muted/50 flex items-center justify-between">
                    <h2 className="font-bold text-lg tracking-tight">Select Criteria</h2>
                    <Button
                        size="sm"
                        className="bg-gradient-to-r from-[#4F39F6] to-[#7C3AED] hover:from-[#3F2BDB] hover:to-[#6D28D9] text-white rounded-full px-6 h-9 font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all text-[11px] border-none uppercase tracking-wider"
                    >
                        Delete Carry Forward
                    </Button>
                </div>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        {/* Class */}
                        <div className="space-y-2.5 group">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                Class <span className="text-destructive font-black">*</span>
                            </label>
                            <div className="relative">
                                <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium">
                                    <option value="">Select</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        {/* Section */}
                        <div className="space-y-2.5 group">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                Section <span className="text-destructive font-black">*</span>
                            </label>
                            <div className="relative">
                                <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium">
                                    <option value="">Select</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                            <Button
                                className="h-11 px-10 rounded-full bg-gradient-to-r from-[#FF9800] to-[#4F39F6] hover:from-[#F57C00] hover:to-[#3F2BDB] text-white font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.05] active:scale-95 flex items-center gap-2 border-none group/btn"
                            >
                                <Search className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                                Search
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
