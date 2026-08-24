"use client";

import React, { useState, useEffect } from "react";
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
import { Loader2, AlertTriangle, RefreshCw, XCircle, ShieldAlert, MessageCircle, MessageSquare, Mail } from "lucide-react";
import api from "@/lib/api";
import { toast as sonnerToast } from "sonner";
import { cn } from "@/lib/utils";

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
    const [status, setStatus] = useState<QueueStatus>({
        total_pending: 0,
        email_jobs: 0,
        sms_jobs: 0,
        whatsapp_jobs: 0,
        failed_jobs: 0,
    });
    const [loading, setLoading] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);

    const channelName =
        channelFilter === "whatsapp"
            ? "WhatsApp"
            : channelFilter === "sms"
            ? "SMS"
            : channelFilter === "email"
            ? "Email"
            : "Notification";

    const defaultTitle = title || `${channelName} Queue & Emergency Stop`;

    const fetchQueueStatus = async () => {
        try {
            setLoading(true);
            const res = await api.get("/system-setting/notification-queue/status");
            if (res.data?.status === "success" && res.data.data) {
                setStatus(res.data.data);
            }
        } catch {
            // fail-safe
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueueStatus();
        const interval = setInterval(fetchQueueStatus, 6000);
        return () => clearInterval(interval);
    }, []);

    const handleCancelQueue = async () => {
        try {
            setCancelling(true);
            const res = await api.post("/system-setting/notification-queue/cancel", {
                channel: channelFilter,
                clear_failed: channelFilter === "all",
            });
            if (res.data?.status === "success") {
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
        <Card className={cn("pt-0 overflow-hidden border-rose-100 shadow-sm", className)}>
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 bg-gradient-to-r from-[#FFF1F2] to-[#FFF7ED] border-b border-rose-100">
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-sm">
                        <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                    <div>
                        <h2 className="text-[12px] sm:text-[13px] font-bold text-gray-800 tracking-tight leading-none">
                            {defaultTitle}
                        </h2>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                            Real-time {channelName} queue monitoring
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={fetchQueueStatus}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    title={`Refresh ${channelName} Queue Status`}
                >
                    <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-rose-500")} />
                </button>
            </div>

            <CardContent className="p-3.5 sm:p-4 space-y-3">
                {/* Single Channel Specific Status Display */}
                {channelFilter !== "all" ? (
                    <div className="flex items-center justify-between p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                        <div className="flex items-center gap-2">
                            <ChannelIcon className="h-4 w-4 text-rose-600" />
                            <span className="text-[11px] font-bold text-gray-700">
                                Pending {channelName} in Queue
                            </span>
                        </div>
                        <Badge
                            variant={countForChannel > 0 ? "destructive" : "secondary"}
                            className={cn(
                                "text-[11px] font-extrabold px-2.5 py-0.5",
                                countForChannel > 0 && "animate-pulse"
                            )}
                        >
                            {countForChannel} {countForChannel === 1 ? "Job" : "Jobs"}
                        </Badge>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-[11px] font-bold text-gray-700">Pending in Queue</span>
                            <Badge
                                variant={status.total_pending > 0 ? "destructive" : "secondary"}
                                className={cn(
                                    "text-[11px] font-bold px-2 py-0.5",
                                    status.total_pending > 0 && "animate-pulse"
                                )}
                            >
                                {status.total_pending} {status.total_pending === 1 ? "Job" : "Jobs"}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 text-center">
                            <div className="bg-blue-50/70 p-2 rounded border border-blue-100">
                                <div className="text-[9px] font-bold text-blue-600 uppercase">Email</div>
                                <div className="text-[12px] font-extrabold text-blue-900">{status.email_jobs}</div>
                            </div>
                            <div className="bg-amber-50/70 p-2 rounded border border-amber-100">
                                <div className="text-[9px] font-bold text-amber-600 uppercase">SMS</div>
                                <div className="text-[12px] font-extrabold text-amber-900">{status.sms_jobs}</div>
                            </div>
                            <div className="bg-emerald-50/70 p-2 rounded border border-emerald-100">
                                <div className="text-[9px] font-bold text-emerald-600 uppercase">WhatsApp</div>
                                <div className="text-[12px] font-extrabold text-emerald-900">{status.whatsapp_jobs}</div>
                            </div>
                        </div>
                    </>
                )}

                {/* Emergency Cancel Action (Channel Specific) */}
                <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={cancelling || countForChannel === 0}
                            className="w-full h-8 text-[11px] font-bold uppercase bg-rose-600 hover:bg-rose-700 text-white shadow-none transition-all"
                        >
                            {cancelling ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            ) : (
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Emergency Cancel {channelName} Queue
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                                <AlertTriangle className="h-5 w-5 text-rose-600" />
                                Emergency {channelName} Queue Cancellation
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600 text-sm leading-relaxed">
                                Are you sure you want to cancel all pending <strong>{channelName}</strong> messages in the queue?
                                <br /><br />
                                This will instantly stop all {countForChannel} unsent {channelName} messages without affecting any other channels. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Keep Sending</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleCancelQueue}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                            >
                                Yes, Cancel {channelName} Queue Now
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}
