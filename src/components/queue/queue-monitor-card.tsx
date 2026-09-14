"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle, RefreshCw, XCircle, ShieldAlert, MessageCircle, MessageSquare, Mail, Play } from "lucide-react";
import api from "@/lib/api";
import { toast as sonnerToast } from "sonner";
import { cn, toLocaleNumber } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface QueueStatus {
    total_pending: number;
    email_jobs: number;
    sms_jobs: number;
    whatsapp_jobs: number;
    failed_jobs: number;
}

interface QueueMonitorCardProps {
    channelFilter?: "all" | "email" | "sms" | "whatsapp";
    title?: string;
    className?: string;
}

export function QueueMonitorCard({
    channelFilter = "all",
    title,
    className,
}: QueueMonitorCardProps) {
    const { t, language } = useTranslation();
    const [status, setStatus] = useState<QueueStatus>({
        total_pending: 0,
        email_jobs: 0,
        sms_jobs: 0,
        whatsapp_jobs: 0,
        failed_jobs: 0,
    });
    const [loading, setLoading] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [restarting, setRestarting] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [openRestartDialog, setOpenRestartDialog] = useState(false);

    const channelName =
        channelFilter === "whatsapp"
            ? t("destination_whatsapp")
            : channelFilter === "sms"
            ? t("destination_sms")
            : channelFilter === "email"
            ? t("destination_email")
            : t("notification");

    const defaultTitle = title || `${channelName} Queue & Emergency Control`;

    const fetchQueueStatus = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/system-setting/notification-queue/status");
            const isOk = Boolean(res.data?.success || res.data?.status?.toLowerCase() === "success");
            if (isOk && res.data.data) {
                setStatus(res.data.data);
            }
        } catch {
            // fail-safe
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQueueStatus();
        const interval = setInterval(fetchQueueStatus, 5000);
        return () => clearInterval(interval);
    }, [fetchQueueStatus]);

    const handleCancelQueue = async () => {
        try {
            setCancelling(true);
            const res = await api.post("/system-setting/notification-queue/cancel", {
                channel: channelFilter,
                clear_failed: channelFilter === "all",
            });
            const isOk = Boolean(res.data?.success || res.data?.status?.toLowerCase() === "success");
            if (isOk) {
                sonnerToast.success(res.data.message || `${channelName} queue cancelled successfully`);
                await fetchQueueStatus();
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            sonnerToast.error(err.response?.data?.message || `Failed to cancel ${channelName} queue`);
        } finally {
            setCancelling(false);
            setOpenDialog(false);
        }
    };

    const handleRestartQueue = async () => {
        try {
            setRestarting(true);
            const res = await api.post("/system-setting/notification-queue/restart", {
                channel: channelFilter,
            });
            const isOk = Boolean(res.data?.success || res.data?.status?.toLowerCase() === "success");
            if (isOk) {
                sonnerToast.success(res.data.message || `Force restarted ${channelName} queue for immediate sending`);
                await fetchQueueStatus();

                // Progressive follow-up polls to reflect real-time draining
                setTimeout(fetchQueueStatus, 1500);
                setTimeout(fetchQueueStatus, 3000);
                setTimeout(fetchQueueStatus, 5000);
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            sonnerToast.error(err.response?.data?.message || `Failed to restart ${channelName} queue`);
        } finally {
            setRestarting(false);
            setOpenRestartDialog(false);
        }
    };

    const countForChannel =
        channelFilter === "email"
            ? status.email_jobs
            : channelFilter === "sms"
            ? status.sms_jobs
            : channelFilter === "whatsapp"
            ? status.whatsapp_jobs
            : status.total_pending;

    const ChannelIcon =
        channelFilter === "whatsapp"
            ? MessageCircle
            : channelFilter === "sms"
            ? MessageSquare
            : channelFilter === "email"
            ? Mail
            : ShieldAlert;

    return (
        <Card className={cn("pt-0 overflow-hidden border-rose-100 dark:border-rose-950/30 shadow-sm", className)}>
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 bg-gradient-to-r from-[#FFF1F2] to-[#FFF7ED] dark:from-rose-950/20 dark:to-amber-950/20 border-b border-rose-100 dark:border-rose-950/30">
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-sm">
                        <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                    <div>
                        <h2 className="text-[12px] sm:text-[13px] font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">
                            {defaultTitle}
                        </h2>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                            {t("real_time_queue_monitoring_control")}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={fetchQueueStatus}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 cursor-pointer"
                    title={`Refresh ${channelName} Queue Status`}
                >
                    <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-rose-500")} />
                </button>
            </div>

            <CardContent className="p-3.5 sm:p-4 space-y-3">
                {/* Single Channel Specific Status Display */}
                {channelFilter !== "all" ? (
                    <div className="flex items-center justify-between p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                        <div className="flex items-center gap-2">
                            <ChannelIcon className="h-4 w-4 text-rose-600" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                {channelName} — {t("pending_in_queue")}
                            </span>
                        </div>
                        <Badge
                            variant={countForChannel > 0 ? "destructive" : "secondary"}
                            className={cn(
                                "text-xs font-black px-2.5 py-0.5 rounded-lg",
                                countForChannel > 0 && "animate-pulse"
                            )}
                        >
                            {countForChannel === 1 
                                ? t("job_count", { count: toLocaleNumber(1, language?.short_code) })
                                : t("jobs_count", { count: toLocaleNumber(countForChannel, language?.short_code) })
                            }
                        </Badge>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-muted/40 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{t("pending_in_queue")}</span>
                            <Badge
                                variant={status.total_pending > 0 ? "destructive" : "secondary"}
                                className={cn(
                                    "text-xs font-bold px-2.5 py-0.5 rounded-lg",
                                    status.total_pending > 0 && "animate-pulse"
                                )}
                            >
                                {status.total_pending === 1 
                                    ? t("job_count", { count: toLocaleNumber(1, language?.short_code) })
                                    : t("jobs_count", { count: toLocaleNumber(status.total_pending, language?.short_code) })
                                }
                            </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-blue-50/70 dark:bg-blue-950/20 p-2 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">{t("destination_email")}</div>
                                <div className="text-sm font-black text-blue-900 dark:text-blue-200">{toLocaleNumber(status.email_jobs, language?.short_code)}</div>
                            </div>
                            <div className="bg-amber-50/70 dark:bg-amber-950/20 p-2 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">{t("destination_sms")}</div>
                                <div className="text-sm font-black text-amber-900 dark:text-amber-200">{toLocaleNumber(status.sms_jobs, language?.short_code)}</div>
                            </div>
                            <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">{t("destination_whatsapp")}</div>
                                <div className="text-sm font-black text-emerald-900 dark:text-emerald-200">{toLocaleNumber(status.whatsapp_jobs, language?.short_code)}</div>
                            </div>
                        </div>
                    </>
                )}

                {/* Queue Control Buttons: Force Restart & Emergency Cancel */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Force Restart Queue Action */}
                    <AlertDialog open={openRestartDialog} onOpenChange={setOpenRestartDialog}>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="default"
                                size="sm"
                                disabled={restarting || countForChannel === 0}
                                className="w-full h-8 px-2 text-xs font-bold rounded-xl uppercase bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:from-[#4F46E5] hover:to-[#4338CA] text-white shadow-none transition-all truncate cursor-pointer"
                                title={`Force restart ${channelName} queue for immediate sending`}
                            >
                                {restarting ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1 shrink-0" />
                                ) : (
                                    <Play className="h-3 w-3 mr-1 fill-white shrink-0" />
                                )}
                                <span className="truncate">{t("force_restart")}</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-indigo-600">
                                    <RefreshCw className="h-5 w-5 text-indigo-600" />
                                    {t("force_restart")} ({channelName})
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-600 text-sm leading-relaxed">
                                    Are you sure you want to force restart the <strong>{channelName}</strong> queue?
                                    <br /><br />
                                    This will release all stuck/reserved <strong>{channelName}</strong> jobs, reset retry limits, and wake up background workers to start sending all {toLocaleNumber(countForChannel, language?.short_code)} pending messages immediately.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl font-bold text-xs cursor-pointer">{t("cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleRestartQueue}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                                >
                                    {t("force_restart")}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Emergency Cancel Action */}
                    <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={cancelling || countForChannel === 0}
                                className="w-full h-8 px-2 text-xs font-bold rounded-xl uppercase bg-rose-600 hover:bg-rose-700 text-white shadow-none transition-all truncate cursor-pointer"
                                title={`Emergency cancel ${channelName} queue`}
                            >
                                {cancelling ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1 shrink-0" />
                                ) : (
                                    <XCircle className="h-3 w-3 mr-1 shrink-0" />
                                )}
                                <span className="truncate">{t("emergency_cancel")}</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                                    {t("emergency_cancel")} ({channelName})
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-600 text-sm leading-relaxed">
                                    Are you sure you want to cancel all pending <strong>{channelName}</strong> messages in the queue?
                                    <br /><br />
                                    This will instantly stop all {toLocaleNumber(countForChannel, language?.short_code)} unsent {channelName} messages without affecting any other channels. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl font-bold text-xs cursor-pointer">{t("keep_sending")}</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleCancelQueue}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                                >
                                    {t("emergency_cancel")}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
}

