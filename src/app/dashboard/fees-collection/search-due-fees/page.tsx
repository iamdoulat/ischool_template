"use client";

import { Search, Filter, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SearchDueFeesPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Select Criteria Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Select Criteria</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Search due fees records</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2.5 group">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                Fees Group <span className="text-destructive font-black">*</span>
                            </label>
                            <div className="relative">
                                <select className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium">
                                    <option value="">Select</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        <div className="space-y-2.5 group">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                Class
                            </label>
                            <div className="relative">
                                <select className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium">
                                    <option value="">Select</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        <div className="space-y-2.5 group">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                Section
                            </label>
                            <div className="relative">
                                <select className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium">
                                    <option value="">Select</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform group-focus-within:rotate-180" />
                            </div>
                        </div>

                        <div className="md:col-span-3 flex justify-end">
                            <Button
                                className="h-11 px-10 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#F57C00] hover:to-[#3F2BDB] text-white font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.05] active:scale-95 flex items-center gap-2 border-none"
                            >
                                <Search className="h-4 w-4" />
                                Search
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
