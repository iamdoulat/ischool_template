"use client";

import { BellRing, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface Reminder {
    id: number;
    type: string;
    days: number;
    is_active: boolean;
}

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export default function FeesReminderPage() {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchReminders();
    }, []);

    const fetchReminders = async () => {
        try {
            const response = await api.get("/fee-reminders");
            setReminders(response.data.data);
        } catch (error) {
            toast("error", "Failed to fetch fee reminders");
        } finally {
            setLoading(false);
        }
    };

    const handleActiveChange = (id: number, checked: boolean) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, is_active: checked } : r));
    };

    const handleDaysChange = (id: number, days: string) => {
        const val = parseInt(days) || 0;
        setReminders(prev => prev.map(r => r.id === id ? { ...r, days: val } : r));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post("/fee-reminders/bulk-update", { reminders });
            toast("success", "Fee reminders saved successfully");
            fetchReminders(); // Refresh data
        } catch (error) {
            toast("error", "Failed to save fee reminders");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Fees Reminder</h1>
                <p className="text-muted-foreground">Configure automated fee reminder notifications for students and parents.</p>
            </div>

            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <BellRing className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Reminder Settings</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{reminders.length} reminder type{reminders.length === 1 ? '' : 's'}</p>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-muted/20 bg-muted/10">
                                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[150px]">Status</th>
                                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Reminder Type</th>
                                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[250px]">Days</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted/10">
                                {loading ? (
                                    <TableSkeleton rows={5} cols={3} />
                                ) : reminders.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">No data found</td>
                                    </tr>
                                ) : reminders.map((reminder) => (
                                    <tr key={reminder.id} className="hover:bg-muted/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id={`reminder-${reminder.id}`}
                                                    checked={reminder.is_active}
                                                    onCheckedChange={(checked) => handleActiveChange(reminder.id, checked as boolean)}
                                                    className="h-5 w-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                                                />
                                                <label
                                                    htmlFor={`reminder-${reminder.id}`}
                                                    className={cn(
                                                        "text-[11px] font-black uppercase tracking-widest cursor-pointer transition-colors",
                                                        reminder.is_active ? "text-primary" : "text-muted-foreground/50"
                                                    )}
                                                >
                                                    {reminder.is_active ? 'Active' : 'Inactive'}
                                                </label>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className={cn(
                                                    "text-base font-bold tracking-tight",
                                                    reminder.is_active ? "text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {reminder.type} Due Date Reminder
                                                </span>
                                                <span className="text-xs text-muted-foreground/70 font-medium">
                                                    Automatically notify when fees are {reminder.type.toLowerCase()} the due date.
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="relative flex-1 max-w-[120px]">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={reminder.days}
                                                        onChange={(e) => handleDaysChange(reminder.id, e.target.value)}
                                                        disabled={!reminder.is_active}
                                                        className="h-10 rounded-lg bg-muted/20 border-muted/50 focus-visible:bg-background focus-visible:ring-primary/20 transition-all font-bold text-center pr-2 disabled:opacity-30"
                                                    />
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-bold uppercase tracking-tighter",
                                                    reminder.is_active ? "text-muted-foreground" : "text-muted-foreground/30"
                                                )}>
                                                    Days
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-8 border-t border-muted/20 bg-muted/5 flex justify-end">
                        <Button
                            variant="gradient"
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="h-12 px-12 flex items-center gap-2"
                        >
                            {saving ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5 group-hover/save:scale-110 transition-transform" />
                            )}
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
