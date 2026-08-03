"use client";

import { useState } from "react";
import { InternalChatDialog } from "@/components/chat/internal-chat-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, UserPlus, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

export default function ChatPage() {
    const [chatOpen, setChatOpen] = useState(true);

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50/30 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                        <MessageSquare className="h-6 w-6" />
                    </span>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800 tracking-tight leading-none">
                            Internal Messaging System
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">
                            Secure staff, teacher, student, and parent chat with privacy contact requests and 5 MB file sharing
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => setChatOpen(true)}
                    className="h-9 px-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold gap-2 shadow-md"
                >
                    <MessageSquare className="h-4 w-4" />
                    Open Chat Window
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="py-4 px-5">
                        <CardTitle className="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            Privacy Contact Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 text-xs text-gray-500 leading-relaxed">
                        To protect privacy, users must send contact requests (<span className="font-semibold text-gray-700">+ Add Request</span>). Messaging is unlocked once the recipient accepts.
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="py-4 px-5">
                        <CardTitle className="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-indigo-600" />
                            File & Image Uploads (Up to 5 MB)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 text-xs text-gray-500 leading-relaxed">
                        Send documents, PDFs, spreadsheets, and images directly in chat messages. File size limit of 5 MB per attachment is enforced.
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="py-4 px-5">
                        <CardTitle className="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            Presence Control
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 text-xs text-gray-500 leading-relaxed">
                        Switch your presence between <span className="font-bold text-emerald-600">Online 🟢</span>, <span className="font-bold text-gray-600">Offline ⚪</span>, or <span className="font-bold text-purple-600">Invisible 👻</span> at any time.
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
