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
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ExternalLink, MessageSquare, Loader2, Send, CheckCircle2, XCircle, Smartphone } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";

const gatewaysConfig: Record<string, { providerName: string, fields: { key: string, label: string, type: string, options?: string[], showWhen?: { field: string, value: string } }[], guideUrl?: string }> = {
    "Clickatell Sms Gateway": {
        providerName: "clickatell",
        guideUrl: "https://www.clickatell.com",
        fields: [
            { key: "username", label: "Clickatell Username", type: "text" },
            { key: "password", label: "Clickatell Password", type: "password" },
            { key: "api_key", label: "API Key", type: "text" }
        ]
    },
    "Twilio SMS Gateway": {
        providerName: "twilio",
        guideUrl: "https://www.twilio.com/console",
        fields: [
            { key: "account_sid", label: "Account SID", type: "text" },
            { key: "auth_token", label: "Auth Token", type: "password" },
            { key: "sender_phone", label: "Sender Phone Number", type: "text" }
        ]
    },
    "MSG91": {
        providerName: "msg91",
        guideUrl: "https://control.msg91.com",
        fields: [
            { key: "auth_key", label: "Auth Key", type: "text" },
            { key: "sender_id", label: "Sender ID", type: "text" }
        ]
    },
    "Text Local": {
        providerName: "text_local",
        guideUrl: "https://www.textlocal.in",
        fields: [
            { key: "api_key", label: "API Key", type: "text" },
            { key: "sender_id", label: "Sender ID", type: "text" }
        ]
    },
    "SMS Country": {
        providerName: "sms_country",
        guideUrl: "https://www.smscountry.com",
        fields: [
            { key: "username", label: "Username", type: "text" },
            { key: "password", label: "Password", type: "password" },
            { key: "sender_id", label: "Sender ID", type: "text" }
        ]
    },
    "Bulk SMS": {
        providerName: "bulk_sms",
        guideUrl: "https://www.bulksms.com",
        fields: [
            { key: "username", label: "Username", type: "text" },
            { key: "password", label: "Password", type: "password" }
        ]
    },
    "Mobi Reach": {
        providerName: "mobi_reach",
        guideUrl: "https://www.mobireach.com.bd",
        fields: [
            { key: "auth_key", label: "Auth Key", type: "text" },
            { key: "route_id", label: "Route ID", type: "text" }
        ]
    },
    "Nexmo": {
        providerName: "nexmo",
        guideUrl: "https://dashboard.nexmo.com",
        fields: [
            { key: "api_key", label: "API Key", type: "text" },
            { key: "api_secret", label: "API Secret", type: "password" },
            { key: "sender_phone", label: "Sender Phone Number", type: "text" }
        ]
    },
    "AfricasTalking": {
        providerName: "africas_talking",
        guideUrl: "https://africastalking.com",
        fields: [
            { key: "username", label: "Username", type: "text" },
            { key: "api_key", label: "API Key", type: "text" }
        ]
    },
    "SMS Egypt": {
        providerName: "sms_egypt",
        guideUrl: "https://www.smsegypt.com",
        fields: [
            { key: "username", label: "Username", type: "text" },
            { key: "password", label: "Password", type: "password" },
            { key: "sender_id", label: "Sender ID", type: "text" }
        ]
    },
    "SMS Gateway Hub": {
        providerName: "sms_gateway_hub",
        guideUrl: "https://www.smsgatewayhub.com",
        fields: [
            { key: "api_key", label: "API Key", type: "text" },
            { key: "sender_id", label: "Sender ID", type: "text" }
        ]
    },
    "BipSMS": {
        providerName: "bipsms",
        guideUrl: "https://app.bipsms.com",
        fields: [
            { key: "secret", label: "API Secret", type: "password" },
            { key: "mode", label: "Mode (devices/credits)", type: "select", options: ["devices", "credits"] },
            { key: "device", label: "Device ID (for devices mode)", type: "text", showWhen: { field: "mode", value: "devices" } },
            { key: "gateway", label: "Gateway ID (for credits mode)", type: "text", showWhen: { field: "mode", value: "credits" } },
            { key: "sim", label: "SIM Slot (1/2)", type: "text" },
            { key: "priority", label: "Priority (0/1/2)", type: "text" }
        ]
    },
    "Custom SMS Gateway": {
        providerName: "custom",
        fields: [
            { key: "name", label: "Gateway Name", type: "text" },
            { key: "url", label: "Gateway URL", type: "text" },
            { key: "method", label: "Method (GET/POST)", type: "text" }
        ]
    }
};

const gateways = Object.keys(gatewaysConfig);

type ProviderData = {
    config: Record<string, string>;
    status: "enabled" | "disabled";
};

function FormSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <Skeleton className="h-3 w-28 rounded ml-auto" />
                    <div className="md:col-span-2">
                        <Skeleton className="h-8 w-full rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function SmsSettingPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("Clickatell Sms Gateway");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testPhone, setTestPhone] = useState("");
    const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

    const [settingsData, setSettingsData] = useState<Record<string, ProviderData>>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/system-setting/sms-settings');
            const list = res.data?.data;
            if (Array.isArray(list)) {
                const formattedData: Record<string, ProviderData> = {};
                list.forEach((setting: { provider: string; config: Record<string, string>; status: boolean }) => {
                    formattedData[setting.provider] = {
                        config: setting.config || {},
                        status: setting.status ? "enabled" : "disabled"
                    };
                });
                setSettingsData(formattedData);
            }
        } catch {
            toast.error(t("failed_to_load"));
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (providerKey: string, fieldKey: string, value: string) => {
        setSettingsData(prev => ({
            ...prev,
            [providerKey]: {
                config: { ...(prev[providerKey]?.config || {}), [fieldKey]: value },
                status: prev[providerKey]?.status || "disabled"
            }
        }));
    };

    const handleStatusChange = (providerKey: string, status: string) => {
        setSettingsData(prev => ({
            ...prev,
            [providerKey]: {
                config: prev[providerKey]?.config || {},
                status: status as "enabled" | "disabled"
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setTestResult(null);
        try {
            const activeConfig = gatewaysConfig[activeTab];
            const providerKey = activeConfig.providerName;
            const currentData = settingsData[providerKey] || { config: {}, status: 'disabled' };

            const payload = { provider: providerKey, config: currentData.config, status: currentData.status === "enabled" };

            const res = await api.post('/system-setting/sms-settings', payload);
            const resStatus = res.data?.status;
            const isSuccess = resStatus === 'success' || resStatus === 200;

            if (isSuccess) {
                toast.success(res.data?.message || `${activeTab} configuration saved`);
            } else {
                toast.error(res.data?.message || `Failed to save ${activeTab} configuration`);
            }
        } catch (err: unknown) {
            const msg = err && typeof err === "object" && "response" in err
                ? ((err as { response: { data: { message: string } } }).response?.data?.message ?? `Failed to save ${activeTab} configuration`)
                : `Failed to save ${activeTab} configuration`;
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleTestSms = async () => {
        if (!testPhone.trim()) {
            toast.error(t("enter_phone_number_to_send_test_sms"));
            return;
        }
        setTesting(true);
        setTestResult(null);
        try {
            const activeConfig = gatewaysConfig[activeTab];
            const providerKey = activeConfig.providerName;
            const res = await api.post('/system-setting/sms-settings/test', { provider: providerKey, phone: testPhone.trim() });
            const resStatus = res.data?.status;
            const isSuccess = resStatus === 'success' || resStatus === 200;

            if (isSuccess) {
                setTestResult({ ok: true, message: res.data?.message || "Test SMS sent successfully" });
                toast.success(res.data?.message || "Test SMS sent successfully");
            } else {
                setTestResult({ ok: false, message: res.data?.message || "Test SMS failed" });
                toast.error(res.data?.message || "Test SMS failed");
            }
        } catch (err: unknown) {
            const msg = err && typeof err === "object" && "response" in err
                ? ((err as { response: { data: { message: string } } }).response?.data?.message ?? "Failed to send test SMS")
                : "Failed to send test SMS";
            setTestResult({ ok: false, message: msg });
            toast.error(msg);
        } finally {
            setTesting(false);
        }
    };

    const currentActiveConfig = gatewaysConfig[activeTab];
    const providerKey = currentActiveConfig.providerName;
    const currentData = settingsData[providerKey] || { config: {}, status: "disabled" };
    const isConfigured = Object.keys(currentData.config).length > 0;

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <Card className="pt-0 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <MessageSquare className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("sms_setting")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("configure_sms_gateway_providers")}</p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-0">
                    {/* Gateway Tabs */}
                    <div className="border-b border-gray-100 bg-white overflow-x-auto">
                        <div className="flex no-scrollbar">
                            {gateways.map((gateway) => {
                                const gwProviderKey = gatewaysConfig[gateway].providerName;
                                const gwData = settingsData[gwProviderKey];
                                const gwConfigured = gwData && Object.keys(gwData.config).length > 0;
                                const gwEnabled = gwData?.status === "enabled";
                                return (
                                    <button
                                        key={gateway}
                                        onClick={() => { setActiveTab(gateway); setTestResult(null); }}
                                        className={cn(
                                            "px-5 py-3 text-[11px] font-bold uppercase transition-all whitespace-nowrap border-b-2 flex items-center gap-2",
                                            activeTab === gateway
                                                ? "text-indigo-600 border-indigo-500 bg-indigo-50/10"
                                                : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        {gwConfigured && (gwEnabled
                                            ? <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                                            : <XCircle className="h-3 w-3 text-gray-300 shrink-0" />
                                        )}
                                        {gateway}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
                        {loading ? (
                            <FormSkeleton />
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start animate-in fade-in duration-300">
                                <div className="space-y-6">
                                    {currentActiveConfig.fields.map((field) => {
                                        if (field.showWhen) {
                                            const dependentValue = currentData.config[field.showWhen.field] || "";
                                            if (dependentValue !== field.showWhen.value) return null;
                                        }

                                        return (
                                            <div key={field.key} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                                <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">
                                                    {field.label} <span className="text-red-500">*</span>
                                                </Label>
                                                <div className="md:col-span-2">
                                                    {field.type === "select" && field.options ? (
                                                        <Select
                                                            value={currentData.config[field.key] || ""}
                                                            onValueChange={(val) => handleFieldChange(providerKey, field.key, val)}
                                                        >
                                                            <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                                                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {field.options.map((opt) => (
                                                                    <SelectItem key={opt} value={opt}>
                                                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Input
                                                            type={field.type}
                                                            value={currentData.config[field.key] || ""}
                                                            onChange={(e) => handleFieldChange(providerKey, field.key, e.target.value)}
                                                            placeholder={`Enter ${field.label.toLowerCase()}`}
                                                            className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mt-6">
                                        <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">{t("status")} <span className="text-red-500">*</span></Label>
                                        <div className="md:col-span-2">
                                            <Select value={currentData.status} onValueChange={(val) => handleStatusChange(providerKey, val)}>
                                                <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="enabled">{t("enabled")}</SelectItem>
                                                    <SelectItem value="disabled">{t("disabled")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 pt-4 border-t border-gray-50">
                                        <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">{t("test_sms")}</Label>
                                        <div className="md:col-span-2 space-y-2">
                                            <div className="flex gap-2">
                                                <Input
                                                    type="text"
                                                    value={testPhone}
                                                    onChange={(e) => setTestPhone(e.target.value)}
                                                    placeholder="+1234567890"
                                                    className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded flex-1"
                                                />
                                                <Button
                                                    onClick={handleTestSms}
                                                    disabled={testing || !isConfigured || currentData.status !== "enabled"}
                                                    size="sm"
                                                    className="h-8 text-[10px] font-bold uppercase px-3 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white rounded-full shadow-none"
                                                >
                                                    {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                                </Button>
                                            </div>
                                            {testResult && (
                                                <div className={cn(
                                                    "flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded",
                                                    testResult.ok ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                                                )}>
                                                    {testResult.ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                                    {testResult.message}
                                                </div>
                                            )}
                                            <p className="text-[9px] text-gray-400 italic">{t("save_configuration_before_testing")}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center p-8 space-y-6">
                                    {currentActiveConfig.guideUrl ? (
                                        <>
                                            <div className={cn(
                                                "p-6 rounded-lg flex items-center justify-center transition-all",
                                                isConfigured ? "bg-green-50 border border-green-100" : "bg-white"
                                            )}>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("flex items-center justify-center", isConfigured ? "text-green-500" : "text-gray-300")}>
                                                        <Smartphone className={cn("h-10 w-10", isConfigured && "text-green-500")} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={cn("text-xs font-bold uppercase tracking-wider", isConfigured ? "text-green-700" : "text-gray-400")}>
                                                            {isConfigured ? t("configured") : t("not_configured")}
                                                        </p>
                                                        <p className={cn("text-[10px] mt-0.5", isConfigured ? "text-green-500" : "text-gray-300")}>
                                                            {currentData.status === "enabled" ? t("active") : t("disabled")}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <a href={currentActiveConfig.guideUrl} target="_blank" rel="noopener noreferrer"
                                                className="text-xs text-indigo-500 hover:text-indigo-600 hover:underline flex items-center gap-1.5 font-medium transition-colors">
                                                {currentActiveConfig.guideUrl}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-24 w-24 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                                                <MessageSquare className="h-10 w-10 text-indigo-400" />
                                            </div>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{activeTab}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-50 p-6 bg-white flex justify-center">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-10 h-10 text-xs font-bold uppercase transition-all rounded-full shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5"
                        >
                            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("loading")}</> : t("save")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
