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
import { ExternalLink, Loader2, Send, CheckCircle2, XCircle, Smartphone } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const gatewaysConfig: Record<string, { providerName: string, fields: { key: string, label: string, type: string, options?: string[], optionLabels?: Record<string, string> }[], guideUrl?: string }> = {
    "Meta WhatsApp Official": {
        providerName: "whatsapp_meta",
        guideUrl: "https://business.facebook.com/",
        fields: [
            { key: "access_token", label: "Access Token", type: "password" },
            { key: "phone_number_id", label: "Phone Number ID", type: "text" },
            { key: "phone_number", label: "Registered Phone Number", type: "text" },
            { key: "language", label: "Language", type: "text" },
        ]
    },
    "Twilio": {
        providerName: "whatsapp_twilio",
        guideUrl: "https://www.twilio.com/console",
        fields: [
            { key: "account_sid", label: "Account SID", type: "text" },
            { key: "auth_token", label: "Auth Token", type: "password" },
            { key: "sender_phone", label: "Sender Phone Number", type: "text" },
        ]
    },
    "BipSMS": {
        providerName: "whatsapp_bipsms",
        guideUrl: "https://app.bipsms.com",
        fields: [
            { key: "secret", label: "API Secret", type: "password" },
            { key: "account", label: "WhatsApp Account ID", type: "text" },
            { key: "priority", label: "Priority", type: "select", options: ["1", "2"], optionLabels: { "1": "Yes (send immediately)", "2": "No (queue)" } },
        ]
    }
};

const gateways = Object.keys(gatewaysConfig);

type ProviderData = {
    config: Record<string, string>;
    status: "enabled" | "disabled";
};

export default function WhatsappMessagingPage() {
    const [activeTab, setActiveTab] = useState("Meta WhatsApp Official");
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
            toast.error("Failed to load WhatsApp settings");
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

            const payload = {
                provider: providerKey,
                config: currentData.config,
                status: currentData.status === "enabled"
            };

            const res = await api.post('/system-setting/sms-settings', payload);
            const resStatus = res.data?.status;
            const isSuccess = resStatus === 'success' || resStatus === 200;

            if (isSuccess) {
                const updated = res.data.data;
                if (updated && typeof updated === 'object' && updated !== true) {
                    setSettingsData(prev => ({
                        ...prev,
                        [providerKey]: {
                            config: updated.config || currentData.config,
                            status: updated.status ? "enabled" : "disabled"
                        }
                    }));
                }
                toast.success(res.data?.message || `${activeTab} configuration saved`);
            } else {
                toast.error(res.data?.message || `Failed to save ${activeTab} configuration`);
            }
        } catch (err: unknown) {
            const msg =
                err && typeof err === "object" && "response" in err
                    ? ((err as { response: { data: { message: string } } }).response?.data?.message ?? `Failed to save ${activeTab} configuration`)
                    : `Failed to save ${activeTab} configuration`;
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleTestMessage = async () => {
        if (!testPhone.trim()) {
            toast.error("Enter a phone number to send the test message");
            return;
        }
        setTesting(true);
        setTestResult(null);
        try {
            const activeConfig = gatewaysConfig[activeTab];
            const providerKey = activeConfig.providerName;
            const res = await api.post('/system-setting/sms-settings/test', {
                provider: providerKey,
                phone: testPhone.trim()
            });
            const resStatus = res.data?.status;
            const isSuccess = resStatus === 'success' || resStatus === 200;

            if (isSuccess) {
                const successMsg = res.data?.message || "Test message sent successfully";
                setTestResult({ ok: true, message: successMsg });
                toast.success(successMsg);
            } else {
                const errorMsg = res.data?.message || "Test message failed";
                setTestResult({ ok: false, message: errorMsg });
                toast.error(errorMsg);
            }
        } catch (err: unknown) {
            const msg =
                err && typeof err === "object" && "response" in err
                    ? ((err as { response: { data: { message: string } } }).response?.data?.message ?? "Failed to send test message")
                    : "Failed to send test message";
            setTestResult({ ok: false, message: msg });
            toast.error(msg);
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    const currentActiveConfig = gatewaysConfig[activeTab];
    const providerKey = currentActiveConfig.providerName;
    const currentData = settingsData[providerKey] || { config: {}, status: "disabled" };
    const isConfigured = Object.keys(currentData.config).length > 0;

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">WhatsApp Gateway</h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="border-b border-gray-100 bg-white">
                    <div className="flex overflow-x-auto no-scrollbar">
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

                <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start animate-in fade-in duration-300">
                        <div className="space-y-6">
                            {currentActiveConfig.fields.map((field) => (
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
                                                            {field.optionLabels?.[opt] || opt.charAt(0).toUpperCase() + opt.slice(1)}
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
                            ))}

                            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mt-6">
                                <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Status <span className="text-red-500">*</span></Label>
                                <div className="md:col-span-2">
                                    <Select value={currentData.status} onValueChange={(val) => handleStatusChange(providerKey, val)}>
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

                            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 pt-4 border-t border-gray-50">
                                <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Test Message</Label>
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
                                            onClick={handleTestMessage}
                                            disabled={testing || !isConfigured || currentData.status !== "enabled"}
                                            size="sm"
                                            className="h-8 text-[10px] font-bold uppercase px-3 bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-90 text-white rounded-full shadow-none"
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
                                    <p className="text-[9px] text-gray-400 italic">Save configuration before testing</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-8 space-y-6">
                            {currentActiveConfig.guideUrl && (
                                <>
                                    <div className={cn(
                                        "p-6 rounded-lg flex items-center justify-center transition-all",
                                        isConfigured ? "bg-green-50 border border-green-100" : "bg-white"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "flex items-center justify-center",
                                                isConfigured ? "text-green-500" : "text-gray-300"
                                            )}>
                                                <Smartphone className={cn("h-10 w-10", isConfigured && "text-green-500")} />
                                            </div>
                                            <div className="text-left">
                                                <p className={cn(
                                                    "text-xs font-bold uppercase tracking-wider",
                                                    isConfigured ? "text-green-700" : "text-gray-400"
                                                )}>
                                                    {isConfigured ? "Configured" : "Not Configured"}
                                                </p>
                                                <p className={cn(
                                                    "text-[10px] mt-0.5",
                                                    isConfigured ? "text-green-500" : "text-gray-300"
                                                )}>
                                                    {currentData.status === "enabled" ? "Active" : "Disabled"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={currentActiveConfig.guideUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-indigo-500 hover:text-indigo-600 hover:underline flex items-center gap-1.5 font-medium transition-colors"
                                    >
                                        {currentActiveConfig.guideUrl}
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-50 p-6 bg-white flex justify-center mt-auto">
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
