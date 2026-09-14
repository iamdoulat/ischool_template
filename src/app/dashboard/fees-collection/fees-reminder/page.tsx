"use client";

import { BellRing, Save, Loader2, Send, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn, toLocaleNumber } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
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

function TableSkeleton({ rows = 4, cols = 3 }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                            <div
                                className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }}
                            />
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
    const { t, language } = useTranslation();
    const tt = useTranslateToast();

    const fetchReminders = useCallback(async () => {
        try {
            const response = await api.get("/fee-reminders");
            setReminders(response.data.data || []);
        } catch (error) {
            console.error("Error fetching fee reminders:", error);
            tt.error("failed_to_fetch_fee_reminders");
        } finally {
            setLoading(false);
        }
    }, [tt]);

    useEffect(() => {
        fetchReminders();
    }, [fetchReminders]);

    const handleActiveChange = (id: number, checked: boolean) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, is_active: checked } : r));
    };

    const handleDaysChange = (id: number, days: string) => {
        const val = parseInt(days, 10) || 0;
        setReminders(prev => prev.map(r => r.id === id ? { ...r, days: val } : r));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post("/fee-reminders/bulk-update", { reminders });
            tt.success("fee_reminders_saved_successfully");
            fetchReminders();
        } catch (error) {
            console.error("Error saving fee reminders:", error);
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
        } catch (error) {
            console.error("Error sending fee reminders:", error);
            tt.error("failed_to_send_fee_reminders");
        } finally {
            setSending(false);
        }
    };

    const activeCount = reminders.filter(r => r.is_active).length;
    const beforeReminders = reminders.filter(r => r.type === "Before");
    const afterReminders = reminders.filter(r => r.type === "After");

    const renderReminderRow = (reminder: Reminder) => (
        <tr key={reminder.id} className="hover:bg-muted/20 transition-colors group">
            {/* Status Switch / Checkbox */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <Switch
                        id={`reminder-${reminder.id}`}
                        checked={reminder.is_active}
                        onCheckedChange={(checked) => handleActiveChange(reminder.id, checked)}
                        className="cursor-pointer"
                    />
                    <span
                        className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            reminder.is_active
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        )}
                    >
                        {reminder.is_active ? t("active") : t("inactive")}
                    </span>
                </div>
            </td>

            {/* Reminder Title and Subtitle */}
            <td className="px-6 py-4">
                <div className="flex flex-col gap-0.5">
                    <span className={cn(
                        "text-xs sm:text-sm font-bold tracking-tight",
                        reminder.is_active ? "text-foreground" : "text-muted-foreground"
                    )}>
                        {reminder.type === "Before"
                            ? t("due_date_reminder_before")
                            : t("due_date_reminder_after")}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                        {reminder.type === "Before"
                            ? t("auto_notify_before_due_date")
                            : t("auto_notify_after_due_date")}
                    </span>
                </div>
            </td>

            {/* Days Input */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-2 max-w-[200px]">
                    <Input
                        type="number"
                        min="0"
                        value={reminder.days}
                        onChange={(e) => handleDaysChange(reminder.id, e.target.value)}
                        disabled={!reminder.is_active}
                        className="h-9 w-20 rounded-xl bg-background border-border/80 focus-visible:ring-primary/20 text-xs font-bold text-center disabled:opacity-40"
                    />
                    <span className={cn(
                        "text-xs font-bold whitespace-nowrap",
                        reminder.is_active
                            ? reminder.type === "Before"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground/40"
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
        <div className="p-3 sm:p-5 pt-1 sm:pt-2 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-300 pb-20">
            {/* Top Page Header Card with Signature Gradient */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] overflow-hidden p-0">
                <div className="flex flex-row items-center justify-between gap-3 px-5 py-3.5 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <BellRing className="h-5 w-5 sm:h-6 sm:w-6" />
                        </span>
                        <div>
                            <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 leading-none">
                                {t("fees_reminder")}
                            </CardTitle>
                            <p className="text-xs text-slate-600 mt-1 font-medium">
                                {t("configure_automated_fee_reminder_notifications")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setShowSendDialog(true)}
                            disabled={sending || loading || activeCount === 0}
                            className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border-none"
                        >
                            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            <span>{sending ? t("sending") : t("send_now")}</span>
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Overview KPI Stats Cards with Rich Vibrant Full Gradients */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Total Reminder Rules */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#818CF8] text-white shadow-md flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white/95 uppercase tracking-wide">
                            {t("total_reminder_types")}
                        </span>
                        <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                            <BellRing className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            {toLocaleNumber(reminders.length, language?.short_code)}
                        </div>
                        <p className="text-xs text-white/80 font-semibold mt-1.5">
                            {t("reminder_types_count")}
                        </p>
                    </div>
                </div>

                {/* Active Reminders */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#059669] via-[#10B981] to-[#34D399] text-white shadow-md flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white/95 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                            {t("active_reminders")}
                        </span>
                        <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            {toLocaleNumber(activeCount, language?.short_code)}
                        </div>
                        <p className="text-xs text-white/85 font-semibold mt-1.5">
                            {toLocaleNumber(activeCount, language?.short_code)} {t("active")}
                        </p>
                    </div>
                </div>

                {/* Before Due Date Reminders */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0284C7] via-[#0EA5E9] to-[#38BDF8] text-white shadow-md flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white/95 uppercase tracking-wide">
                            {t("before_due_date")}
                        </span>
                        <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            {toLocaleNumber(beforeReminders.length, language?.short_code)}
                        </div>
                        <p className="text-xs text-white/85 font-semibold mt-1.5">
                            {t("auto_notify_before_due_date")}
                        </p>
                    </div>
                </div>

                {/* After Due Date Reminders */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#D97706] via-[#F59E0B] to-[#FBBF24] text-white shadow-md flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white/95 uppercase tracking-wide">
                            {t("after_due_date")}
                        </span>
                        <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            {toLocaleNumber(afterReminders.length, language?.short_code)}
                        </div>
                        <p className="text-xs text-white/85 font-semibold mt-1.5">
                            {t("auto_notify_after_due_date")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Send Result Banner */}
            {sendResult && (
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 p-4 animate-in slide-in-from-top-2 duration-300 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
                                {sendResult.total_notifications > 0
                                    ? t("reminder_notifications_sent_summary", {
                                        notifications: toLocaleNumber(sendResult.total_notifications, language?.short_code),
                                        students: toLocaleNumber(sendResult.students_notified, language?.short_code)
                                    })
                                    : t("no_pending_fee_reminders")}
                            </p>
                            {sendResult.total_notifications > 0 && (
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                                    {t("before_due_date")}: {toLocaleNumber(sendResult.before_reminders, language?.short_code)} · {t("after_due_date")}: {toLocaleNumber(sendResult.after_reminders, language?.short_code)}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setSendResult(null)}
                        className="text-emerald-600 hover:text-emerald-800 text-xs font-bold p-1 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Reminder Configuration Settings Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BellRing className="h-4 w-4" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {t("reminder_settings")}
                            </CardTitle>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                {toLocaleNumber(reminders.length, language?.short_code)} {t("reminder_types_count")} · {toLocaleNumber(activeCount, language?.short_code)} {t("active")}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/40 border-b border-border/70">
                                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-foreground w-[160px]">
                                        {t("status")}
                                    </th>
                                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-foreground">
                                        {t("reminder_type")}
                                    </th>
                                    <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-foreground w-[220px]">
                                        {t("days")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50 text-xs">
                                {loading ? (
                                    <TableSkeleton rows={4} cols={3} />
                                ) : reminders.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground font-semibold">
                                            {t("no_data_found")}
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {/* Before Due Date Section */}
                                        {beforeReminders.length > 0 && (
                                            <>
                                                <tr className="bg-blue-50/40 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30">
                                                    <td colSpan={3} className="px-6 py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
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
                                                <tr className="bg-amber-50/40 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30">
                                                    <td colSpan={3} className="px-6 py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                                            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
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

                    {/* Bottom Action Bar */}
                    <div className="p-4 sm:p-5 border-t border-border/70 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <Button
                            onClick={() => setShowSendDialog(true)}
                            disabled={sending || loading || activeCount === 0}
                            className="w-full sm:w-auto h-10 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span>{sending ? t("sending") : t("send_reminder_notifications")}</span>
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="w-full sm:w-auto h-10 px-8 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                            <span>{saving ? t("saving") : t("save_configuration")}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Send Confirmation Dialog */}
            <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("send_reminder_notifications")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("send_reminder_notifications_confirm")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold text-xs cursor-pointer">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSendReminders}
                            className="rounded-xl font-bold text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-95 shadow-md shadow-indigo-500/20 border-none cursor-pointer"
                        >
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            {t("send_now")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
