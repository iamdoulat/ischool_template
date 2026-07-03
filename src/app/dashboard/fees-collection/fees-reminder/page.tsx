"use client";

import { BellRing, Save, Loader2, Send, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Reminder {
    id: number;
    type: string;
    days: number;
    is_active: boolean;
}

interface SendResult {
    total_notifications: number;
    before_reminders: number;
    after_reminders: number;
    students_notified: number;
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
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState<SendResult | null>(null);
    const [showSendDialog, setShowSendDialog] = useState(false);
    const { t } = useTranslation();
    const tt = useTranslateToast();

    useEffect(() => {
        fetchReminders();
    }, []);

    const fetchReminders = async () => {
        try {
            const response = await api.get("/fee-reminders");
            setReminders(response.data.data);
        } catch {
            tt.error("failed_to_fetch_fee_reminders");
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
            tt.success("fee_reminders_saved_successfully");
            fetchReminders(); // Refresh data
        } catch {
            tt.error("failed_to_save_fee_reminders");
        } finally {
            setSaving(false);
        }
    };

    const handleSendReminders = async () => {
        setShowSendDialog(false);
        setSending(true);
        setSendResult(null);
        try {
            const response = await api.post("/fee-reminders/send");
            const result = response.data?.data;
            setSendResult(result);
            if (result?.total_notifications > 0) {
                tt.success("fee_reminders_sent_successfully");
            } else {
                tt.success("no_pending_fee_reminders");
            }
        } catch {
            tt.error("failed_to_send_fee_reminders");
        } finally {
            setSending(false);
        }
    };

    const activeCount = reminders.filter(r => r.is_active).length;
    const beforeReminders = reminders.filter(r => r.type === "Before");
    const afterReminders = reminders.filter(r => r.type === "After");

    const renderReminderRow = (reminder: Reminder) => (
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
                        {reminder.is_active ? t("active") : t("inactive")}
                    </label>
                </div>
            </td>
            <td className="px-8 py-6">
                <div className="flex flex-col gap-1">
                    <span className={cn(
                        "text-base font-bold tracking-tight",
                        reminder.is_active ? "text-foreground" : "text-muted-foreground"
                    )}>
                        {reminder.type === "Before"
                            ? t("due_date_reminder_before")
                            : t("due_date_reminder_after")}
                    </span>
                    <span className="text-xs text-muted-foreground/70 font-medium">
                        {reminder.type === "Before"
                            ? t("auto_notify_before_due_date")
                            : t("auto_notify_after_due_date")}
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
                        "text-sm font-bold uppercase tracking-tighter whitespace-nowrap",
                        reminder.is_active
                            ? reminder.type === "Before"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-orange-600 dark:text-orange-400"
                            : "text-muted-foreground/30"
                    )}>
                        {reminder.type === "Before"
                            ? t("days_before")
                            : t("days_after")}
                    </span>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{t("fees_reminder")}</h1>
                <p className="text-muted-foreground">{t("configure_automated_fee_reminder_notifications")}</p>
            </div>

            {/* Send Result Banner */}
            {sendResult && (
                <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                            <Send className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                                {sendResult.total_notifications > 0
                                    ? `${sendResult.total_notifications} reminder notification(s) sent to ${sendResult.students_notified} student(s)`
                                    : "No pending fee reminders found for today"}
                            </p>
                            {sendResult.total_notifications > 0 && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                                    Before due date: {sendResult.before_reminders} · After due date: {sendResult.after_reminders}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => setSendResult(null)}
                            className="text-green-500 hover:text-green-700 text-xs font-medium"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <BellRing className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("reminder_settings")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {reminders.length} {t("reminder_types_count")} · {activeCount} {t("active")}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-muted/20 bg-muted/10">
                                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[150px]">{t("status")}</th>
                                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("reminder_type")}</th>
                                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[250px]">{t("days")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted/10">
                                {loading ? (
                                    <TableSkeleton rows={4} cols={3} />
                                ) : reminders.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td>
                                    </tr>
                                ) : (
                                    <>
                                        {/* Before Due Date Section */}
                                        {beforeReminders.length > 0 && (
                                            <>
                                                <tr>
                                                    <td colSpan={3} className="px-8 py-3 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                                                {t("before_due_date")}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {beforeReminders.map(renderReminderRow)}
                                            </>
                                        )}

                                        {/* After Due Date Section */}
                                        {afterReminders.length > 0 && (
                                            <>
                                                <tr>
                                                    <td colSpan={3} className="px-8 py-3 bg-orange-50/50 dark:bg-orange-950/20 border-b border-orange-100 dark:border-orange-900/30">
                                                        <div className="flex items-center gap-2">
                                                            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                                                            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                                                {t("after_due_date")}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {afterReminders.map(renderReminderRow)}
                                            </>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-8 border-t border-muted/20 bg-muted/5 flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setShowSendDialog(true)}
                            disabled={sending || loading || activeCount === 0}
                            className="h-12 px-6 flex items-center gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/30"
                        >
                            {sending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                            {sending ? t("sending") : t("send_reminder_notifications")}
                        </Button>
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
                            {saving ? t("saving") : t("save_configuration")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Send Confirmation Dialog */}
            <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("send_reminder_notifications")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("send_reminder_notifications_confirm")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSendReminders}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {t("send_now")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
