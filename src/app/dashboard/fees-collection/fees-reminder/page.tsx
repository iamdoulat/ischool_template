"use client";

import { BellRing, Check, Save, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden">
                <CardHeader className="border-b border-muted/20 bg-muted/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                            <BellRing className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Reminder Settings</CardTitle>
                            <CardDescription>Toggle and set days for each reminder type.</CardDescription>
                        </div>
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
                                    <tr>
                                        <td colSpan={3} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                                                <p className="text-sm font-medium text-muted-foreground">Loading reminders...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : reminders.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Info className="h-10 w-10 text-muted-foreground/30" />
                                                <p className="text-sm font-medium text-muted-foreground">No reminders configured.</p>
                                            </div>
                                        </td>
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
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="h-12 px-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 group/save"
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


