"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const tabs = ["Meta WhatsApp Official", "Twilio"];

export default function WhatsappMessagingPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("Meta WhatsApp Official");

    // States for Meta WhatsApp Official
    const [metaToken, setMetaToken] = useState("");
    const [metaPhone, setMetaPhone] = useState("");
    const [metaLanguage, setMetaLanguage] = useState("");
    const [metaStatus, setMetaStatus] = useState("enabled");

    // States for Twilio
    const [twilioSid, setTwilioSid] = useState("");
    const [twilioToken, setTwilioToken] = useState("");
    const [twilioPhone, setTwilioPhone] = useState("");
    const [twilioStatus, setTwilioStatus] = useState("enabled");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/system-setting/sms-settings');
            if (res.data?.status === 'success') {
                const settings = res.data.data;
                const meta = settings.find((s: any) => s.provider === 'whatsapp_meta');
                const twilio = settings.find((s: any) => s.provider === 'twilio');

                if (meta) {
                    setMetaToken(meta.config.access_token || "");
                    setMetaPhone(meta.config.phone_number || "");
                    setMetaLanguage(meta.config.language || "");
                    setMetaStatus(meta.status ? "enabled" : "disabled");
                }

                if (twilio) {
                    setTwilioSid(twilio.config.account_sid || "");
                    setTwilioToken(twilio.config.auth_token || "");
                    setTwilioPhone(twilio.config.sender_phone || "");
                    setTwilioStatus(twilio.status ? "enabled" : "disabled");
                }
            }
        } catch (error) {
            toast("error", "Failed to fetch settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const isMeta = activeTab === "Meta WhatsApp Official";
            const payload = isMeta
                ? {
                    provider: 'whatsapp_meta',
                    config: {
                        access_token: metaToken,
                        phone_number: metaPhone,
                        language: metaLanguage
                    },
                    status: metaStatus === "enabled"
                }
                : {
                    provider: 'twilio',
                    config: {
                        account_sid: twilioSid,
                        auth_token: twilioToken,
                        sender_phone: twilioPhone
                    },
                    status: twilioStatus === "enabled"
                };

            const res = await api.post('/system-setting/sms-settings', payload);
            if (res.data?.status === 'success') {
                toast("success", `${activeTab} Configuration Saved`);
            }
        } catch (error) {
            toast("error", `Failed to save ${activeTab} configuration`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">WhatsApp / SMS Messaging Setting</h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                {/* Tabs */}
                <div className="flex border-b border-gray-100 bg-gray-50/30">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-3 text-[11px] font-bold uppercase transition-all relative",
                                activeTab === tab
                                    ? "text-indigo-600 bg-white border-b-2 border-indigo-500 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="p-8 max-w-6xl mx-auto">
                    {activeTab === "Meta WhatsApp Official" ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start animate-in fade-in duration-300">

                            {/* Form Fields */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Access Token <span className="text-red-500">*</span></Label>
                                    <div className="md:col-span-2">
                                        <Input
                                            value={metaToken}
                                            onChange={(e) => setMetaToken(e.target.value)}
                                            placeholder="Enter access token"
                                            className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Registered Phone Number <span className="text-red-500">*</span></Label>
                                    <div className="md:col-span-2">
                                        <Input
                                            value={metaPhone}
                                            onChange={(e) => setMetaPhone(e.target.value)}
                                            placeholder="Enter registered phone number"
                                            className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Language <span className="text-red-500">*</span></Label>
                                    <div className="md:col-span-2">
                                        <Input
                                            value={metaLanguage}
                                            onChange={(e) => setMetaLanguage(e.target.value)}
                                            placeholder="e.g., en"
                                            className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Status <span className="text-red-500">*</span></Label>
                                    <div className="md:col-span-2">
                                        <Select value={metaStatus} onValueChange={setMetaStatus}>
                                            <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="enabled">Enabled</SelectItem>
                                                <SelectItem value="disabled">Disabled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Meta Brand Card */}
                            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                                <div className="w-56 h-32 bg-blue-600 rounded-xl shadow-lg flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                    <div className="bg-white p-3 rounded-2xl shadow-xl transform transition-transform group-hover:scale-110">
                                        <svg className="w-12 h-12 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12.001 3.5c-3.111 0-5.875 1.579-7.534 3.993C3.012 10.016 3.012 13.984 4.467 16.507c1.659 2.414 4.423 3.993 7.534 3.993h.001c3.111 0 5.875-1.579 7.534-3.993 1.455-2.523 1.455-6.491 0-9.014-1.659-2.414-4.423-3.993-7.534-3.993s-5.875 1.579-7.534 3.993zM12.001 2c3.5 0 6.666 1.834 8.5 4.5 1.667 3 1.667 7.5 0 10.5-1.834 2.666-5 4.5-8.5 4.5h-.001c-3.5 0-6.666-1.834-8.5-4.5-1.667-3-1.667-7.5 0-10.5 1.834-2.666 5-4.5 8.5-4.5h.001z" />
                                            <path d="M12.001 8c-1.381 0-2.5 1.119-2.5 2.5s1.119 2.5 2.5 2.5c1.381 0 2.5-1.119 2.5-2.5s-1.119-2.5-2.5-2.5zm5.5 2.5c0 3.038-2.462 5.5-5.5 5.5s-5.5-2.462-5.5-5.5 2.462-5.5 5.5-5.5 5.5 2.462 5.5 5.5z" />
                                        </svg>
                                    </div>
                                </div>
                                <a
                                    href="https://business.facebook.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:underline flex items-center gap-1.5 font-medium"
                                >
                                    https://business.facebook.com/
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start animate-in fade-in duration-300">
                            {/* Twilio Form Fields */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Account SID <span className="text-red-500">*</span></Label>
                                    <div className="md:col-span-2">
                                        <Input
                                            value={twilioSid}
                                            onChange={(e) => setTwilioSid(e.target.value)}
                                            placeholder="Enter Twilio Account SID"
                                            className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Auth Token <span className="text-red-500">*</span></Label>
                                    <div className="md:col-span-2">
                                        <Input
                                            type="password"
                                            value={twilioToken}
                                            onChange={(e) => setTwilioToken(e.target.value)}
                                            placeholder="Enter Twilio Auth Token"
                                            className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Sender Phone Number <span className="text-red-500">*</span></Label>
                                    <div className="md:col-span-2">
                                        <Input
                                            value={twilioPhone}
                                            onChange={(e) => setTwilioPhone(e.target.value)}
                                            placeholder="e.g. +1234567890"
                                            className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Status <span className="text-red-500">*</span></Label>
                                    <div className="md:col-span-2">
                                        <Select value={twilioStatus} onValueChange={setTwilioStatus}>
                                            <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="enabled">Enabled</SelectItem>
                                                <SelectItem value="disabled">Disabled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Twilio Brand Card */}
                            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                                <div className="w-56 h-32 bg-[#F22F46] rounded-xl shadow-lg flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                                    <div className="bg-white p-3 rounded-2xl shadow-xl transform transition-transform group-hover:scale-110">
                                        <svg className="w-12 h-12 text-[#F22F46]" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#F22F46" />
                                            <path d="M7.4 17.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm9.2 0c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm-9.2-5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm9.2 0c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#FFF" />
                                        </svg>
                                    </div>
                                </div>
                                <a
                                    href="https://www.twilio.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#F22F46] hover:underline flex items-center gap-1.5 font-medium"
                                >
                                    https://www.twilio.com/
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-50 p-6 bg-white flex justify-center">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-90 text-white px-10 h-10 text-xs font-bold uppercase transition-all rounded-full shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5"
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                        ) : "Save"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
