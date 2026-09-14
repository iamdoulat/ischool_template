"use client";

import { useState } from "react";
import { InternalChatDialog } from "@/components/chat/internal-chat-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/components/providers/settings-provider";
import { useTranslation } from "@/hooks/use-translation";
import { MessageSquare, Users, ShieldCheck, FileText, AlertCircle } from "lucide-react";

export default function ChatPage() {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const isChatEnabled = settings?.enable_chat !== false && (typeof window === 'undefined' || localStorage.getItem('ischool_enable_chat') !== 'false');
    const [chatOpen, setChatOpen] = useState(true);

    if (!isChatEnabled) {
        return (
            <div className="space-y-6 p-4 md:p-6 bg-gray-50/30 font-sans min-h-[60vh] flex items-center justify-center">
                <Card className="max-w-md border-amber-200 bg-amber-50/40 shadow-sm text-center p-8 rounded-3xl">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <AlertCircle className="w-7 h-7" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">{t("chat_system_disabled") || "Chat System Disabled"}</h2>
                    <p className="text-xs text-gray-600 leading-relaxed mb-6">
                        {t("chat_disabled_description") || "The real-time internal chat system has been turned OFF by Admin in General Settings."}
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50/30 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                        <MessageSquare className="h-6 w-6" />
                    </span>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight leading-none">
                            {t("internal_messaging_system") || "Internal Messaging System"}
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">
                            {t("internal_messaging_description") || "Secure staff, teacher, student, and parent chat with privacy contact requests and 5 MB file sharing"}
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => setChatOpen(true)}
                    className="h-9 px-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold gap-2 shadow-md cursor-pointer"
                >
                    <MessageSquare className="h-4 w-4" />
                    {t("open_chat_window") || "Open Chat Window"}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="py-4 px-5">
                        <CardTitle className="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            {t("privacy_contact_requests") || "Privacy Contact Requests"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 text-xs text-gray-500 leading-relaxed">
                        {t("privacy_contact_description") || "To protect privacy, users must send contact requests (+ Add Request). Messaging is unlocked once the recipient accepts."}
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="py-4 px-5">
                        <CardTitle className="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-indigo-600" />
                            {t("file_image_uploads") || "File & Image Uploads (Up to 5 MB)"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 text-xs text-gray-500 leading-relaxed">
                        {t("file_image_description") || "Send documents, PDFs, spreadsheets, and images directly in chat messages. File size limit of 5 MB per attachment is enforced."}
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="py-4 px-5">
                        <CardTitle className="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            {t("presence_control") || "Presence Control"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 text-xs text-gray-500 leading-relaxed">
                        {t("presence_control_description") || "Switch your presence between Online 🟢, Offline ⚪, or Invisible 👻 at any time."}
                    </CardContent>
                </Card>
            </div>

            <InternalChatDialog
                open={chatOpen}
                onOpenChange={setChatOpen}
            />
        </div>
    );
}
