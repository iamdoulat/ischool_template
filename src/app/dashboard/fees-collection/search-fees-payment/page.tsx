"use client";

import { Search, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchFeesPaymentPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Search Fees Payment Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-muted/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Search className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="font-bold text-lg tracking-tight">Search Fees Payment</h2>
                    </div>
                </div>
                <CardContent className="p-8">
                    <div className="flex flex-col sm:flex-row items-end gap-6">
                        <div className="space-y-2.5 flex-1 max-w-sm group">
                            <label className="text-sm font-bold text-muted-foreground flex items-center gap-1.5 ml-1 transition-colors group-focus-within:text-primary">
                                Payment ID <span className="text-destructive font-black">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    placeholder="Enter Payment ID"
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                />
                            </div>
                        </div>
                        <Button
                            className="h-11 px-10 rounded-full bg-gradient-to-r from-[#FF9800] to-[#4F39F6] hover:from-[#F57C00] hover:to-[#3F2BDB] text-white font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.05] active:scale-95 flex items-center gap-2 border-none"
                        >
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </div>

                    {/* Helper Info */}
                    <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3 max-w-2xl animate-in slide-in-from-bottom-2 duration-700">
                        <div className="mt-0.5">
                            <Info className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-primary tracking-tight">Search Instructions</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Enter the unique <strong>Payment ID</strong> to retrieve detailed transaction history, receipt details, and payment verification status.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
