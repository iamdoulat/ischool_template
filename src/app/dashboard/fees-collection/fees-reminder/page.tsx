"use client";

import { BellRing, Check, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const reminders = [
    { type: "Before", days: "2", active: false },
    { type: "Before", days: "5", active: false },
    { type: "After", days: "2", active: false },
    { type: "After", days: "5", active: false },
];

export default function FeesReminderPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Fees Reminder Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-muted/50 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <BellRing className="h-5 w-5" />
                    </div>
                    <h2 className="font-bold text-lg tracking-tight text-foreground">Fees Reminder</h2>
                </div>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-muted/50 bg-muted/5">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 w-48">Action</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Reminder Type</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Days</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted/50">
                                {reminders.map((reminder, idx) => (
                                    <tr key={idx} className="hover:bg-muted/10 transition-colors group">
                                        <td className="px-8 py-4">
                                            <label className="flex items-center gap-3 cursor-pointer group/label w-fit">
                                                <div className="relative flex items-center justify-center">
                                                    <Checkbox
                                                        id={`reminder-${idx}`}
                                                        className="h-5 w-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-[#4F39F6] data-[state=checked]:border-[#4F39F6] transition-all"
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-muted-foreground group-hover/label:text-foreground transition-colors uppercase tracking-wider text-[11px]">
                                                    Active
                                                </span>
                                            </label>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className="text-sm font-bold text-muted-foreground tracking-tight">
                                                {reminder.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="relative max-w-[200px]">
                                                <Input
                                                    type="number"
                                                    defaultValue={reminder.days}
                                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-bold pr-10 hover:border-primary/50"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none text-muted-foreground/30">
                                                    <div className="h-4 w-4 flex items-center justify-center">
                                                        <Check className="h-3 w-3" />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 border-t border-muted/50 flex justify-end">
                        <Button
                            className="h-11 px-10 rounded-full bg-gradient-to-r from-[#FF9800] to-[#4F39F6] hover:from-[#F57C00] hover:to-[#3F2BDB] text-white font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2 group/save border-none"
                        >
                            <Save className="h-4 w-4 group-hover/save:scale-110 transition-transform" />
                            Save
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
