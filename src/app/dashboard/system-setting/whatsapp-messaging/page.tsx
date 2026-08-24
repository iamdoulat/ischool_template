"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Loader2, MessageCircle, Send, RefreshCw, Smartphone, ExternalLink, Sliders, CheckCircle2, XCircle, Clock, Save } from "lucide-react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { toast as sonnerToast } from "sonner";
import { QueueMonitorCard } from "@/components/queue/queue-monitor-card";

interface GatewayFieldDef {
    key: string;
    label: string;
    type: string;
    options?: string[];
    optionLabels?: Record<string, string>;
}

interface GatewayConfigDef {
    providerName: string;
    guideUrl?: string;
    fields: GatewayFieldDef[];
}

// BipSMS is FIRST tab as requested!
const gatewaysConfig: Record<string, GatewayConfigDef> = {
    "BipSMS": {
        providerName: "whatsapp_bipsms",
        guideUrl: "https://app.bipsms.com",
        fields: [
            { key: "secret", label: "API Secret", type: "password" },
            { key: "account", label: "WhatsApp Account ID", type: "password" },
            { key: "priority", label: "Priority", type: "select", options: ["1", "2"], optionLabels: { "1": "Yes (send immediately)", "2": "No (queue)" } },
        ]
    },
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
    }
};

const gatewayTabKeys = Object.keys(gatewaysConfig);

interface ProviderStateItem {
    provider: string;
    name: string;
    config: Record<string, string | number | boolean>;
    status: boolean;
    sent_count: number;
}

function FormSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <Skeleton className="h-4 w-28 rounded md:col-span-1 ml-auto" />
                    <div className="md:col-span-3"><Skeleton className="h-9 w-full rounded" /></div>
                </div>
            ))}
        </div>
    );
}

export default function WhatsappMessagingPage() {
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState<string>("BipSMS");
    const [loading, setLoading] = useState<boolean>(true);
    const [savingTab, setSavingTab] = useState<boolean>(false);
    const [testing, setTesting] = useState<boolean>(false);
    const [testPhone, setTestPhone] = useState<string>("");
    const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

    const [settingsData, setSettingsData] = useState<Record<string, ProviderStateItem>>({});
    const [roundRobinEnabled, setRoundRobinEnabled] = useState<boolean>(false);
    const [intervalConfig, setIntervalConfig] = useState<{ mode: string; min: number; max: number; fixed: number }>({
        mode: "random",
        min: 1,
        max: 10,
        fixed: 1,
    });
    const [savingInterval, setSavingInterval] = useState<boolean>(false);

    const fetchWhatsappSettings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/system-setting/sms-gateways');
            if (res.data?.status === 'success') {
                const fetchedList: ProviderStateItem[] = res.data.data || [];
                const formatted: Record<string, ProviderStateItem> = {};

                fetchedList.forEach((item) => {
                    if (item.provider !== "round_robin_setting" && !item.provider.endsWith('_queue_interval')) {
                        formatted[item.provider] = {
                            provider: item.provider,
                            name: item.name || item.provider,
                            config: item.config || {},
                            status: Boolean(item.status),
                            sent_count: item.sent_count || 0,
                        };
                    }
                });

                // Ensure all WhatsApp gateway tabs exist in state
                gatewayTabKeys.forEach((tabKey) => {
                    const providerName = gatewaysConfig[tabKey].providerName;
                    if (!formatted[providerName]) {
                        formatted[providerName] = {
                            provider: providerName,
                            name: tabKey,
                            config: {
                                wa_limit: 100,
                            },
                            status: providerName === "whatsapp_bipsms",
                            sent_count: 0,
                        };
                    } else if (formatted[providerName].config.wa_limit === undefined) {
                        formatted[providerName].config.wa_limit = 100;
                    }
                });

                setSettingsData(formatted);
                setRoundRobinEnabled(Boolean(res.data.round_robin?.enabled));

                if (res.data.whatsapp_interval) {
                    setIntervalConfig({
                        mode: res.data.whatsapp_interval.mode || "random",
                        min: Number(res.data.whatsapp_interval.min) || 1,
                        max: Number(res.data.whatsapp_interval.max) || 10,
                        fixed: Number(res.data.whatsapp_interval.fixed) || 1,
                    });
                }
            }
        } catch (error) {
            console.error("Failed to fetch WhatsApp settings:", error);
            sonnerToast.error(t("failed_to_load") || "Failed to load WhatsApp settings");
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchWhatsappSettings();
    }, [fetchWhatsappSettings]);

    const handleSaveInterval = async () => {
        setSavingInterval(true);
        try {
            const payload = {
                channel: 'whatsapp',
                mode: intervalConfig.mode || "random",
                min: Number(intervalConfig.min) || 1,
                max: Number(intervalConfig.max) || 10,
                fixed: Number(intervalConfig.fixed) || 1,
            };
            const res = await api.post('/system-setting/sms-gateways/interval', payload);
            if (res.data?.status === 'success') {
                sonnerToast.success(res.data.message || "WhatsApp interval settings saved successfully");
                if (res.data.data) {
                    setIntervalConfig({
                        mode: res.data.data.mode || "random",
                        min: Number(res.data.data.min) || 1,
                        max: Number(res.data.data.max) || 10,
                        fixed: Number(res.data.data.fixed) || 1,
                    });
                }
            } else {
                sonnerToast.error(res.data?.message || "Failed to save interval settings");
            }
        } catch {
            sonnerToast.error("Failed to save interval settings");
        } finally {
            setSavingInterval(false);
        }
    };

    const currentTabDef = gatewaysConfig[activeTab];
    const currentProviderKey = currentTabDef.providerName;
    const currentItem = settingsData[currentProviderKey] || {
        provider: currentProviderKey,
        name: activeTab,
        config: { wa_limit: 100 },
        status: false,
        sent_count: 0,
    };

    const handleFieldChange = (fieldKey: string, value: string | number | boolean) => {
        setSettingsData(prev => ({
            ...prev,
            [currentProviderKey]: {
                ...prev[currentProviderKey],
                config: {
                    ...(prev[currentProviderKey]?.config || {}),
                    [fieldKey]: value,
                }
            }
        }));
    };

    const handleSaveTab = async () => {
        setSavingTab(true);
        setTestResult(null);
        try {
            const payload = {
                provider: currentProviderKey,
                name: activeTab,
                config: currentItem.config,
                status: currentItem.status,
            };

            const res = await api.post('/system-setting/sms-gateways', payload);
            if (res.data?.status === 'success') {
                sonnerToast.success(`${activeTab} WhatsApp configuration saved successfully!`);
                if (res.data.data) {
                    setSettingsData(prev => ({
                        ...prev,
                        [currentProviderKey]: {
                            ...prev[currentProviderKey],
                            config: res.data.data.config || {},
                            status: Boolean(res.data.data.status),
                        }
                    }));
                }
            } else {
                sonnerToast.error(res.data?.message || `Failed to save ${activeTab} configuration`);
            }
        } catch (err: unknown) {
            const errRes = err as { response?: { data?: { message?: string } } };
            sonnerToast.error(errRes.response?.data?.message || `Failed to save ${activeTab} configuration`);
        } finally {
            setSavingTab(false);
        }
    };

    const handleToggleGateway = async (providerKey: string, tabLabel: string) => {
        try {
            const res = await api.post(`/system-setting/sms-gateways/${providerKey}/toggle`);
            if (res.data?.status === 'success') {
                const newStatus = res.data.data.status;
                setSettingsData(prev => ({
                    ...prev,
                    [providerKey]: {
                        ...prev[providerKey],
                        status: newStatus
                    }
                }));

                if (newStatus) {
                    sonnerToast.success(`${tabLabel} activated`);
                } else {
                    sonnerToast.info(`${tabLabel} deactivated`);
                }
            }
        } catch {
            sonnerToast.error(`Failed to toggle ${tabLabel}`);
        }
    };

    const handleToggleRoundRobin = async () => {
        try {
            const res = await api.post('/system-setting/sms-gateways/toggle-round-robin');
            if (res.data?.status === 'success') {
                const newStatus = res.data.data.round_robin_enabled;
                setRoundRobinEnabled(newStatus);
                if (newStatus) {
                    sonnerToast.success("WhatsApp Round Robin load balancing activated!");
                } else {
                    sonnerToast.info("WhatsApp Round Robin load balancing deactivated");
                }
            }
        } catch {
            sonnerToast.error("Failed to toggle WhatsApp Round Robin load balancing");
        }
    };

    const handleTestMessage = async () => {
        if (!testPhone.trim()) {
            sonnerToast.error(t("enter_a_phone_number_to_send_the_test_message") || "Please enter a test phone number");
            return;
        }

        setTesting(true);
        setTestResult(null);
        try {
            const res = await api.post('/system-setting/sms-gateways/test', {
                provider: currentProviderKey,
                phone: testPhone.trim(),
                config: currentItem.config,
            });

            if (res.data?.status === 'success') {
                setTestResult({ ok: true, message: res.data?.message || "Test WhatsApp message sent successfully" });
                sonnerToast.success(res.data?.message || "Test WhatsApp message sent successfully");
            } else {
                setTestResult({ ok: false, message: res.data?.message || "Test WhatsApp message failed" });
                sonnerToast.error(res.data?.message || "Test WhatsApp message failed");
            }
        } catch (err: unknown) {
            const errRes = err as { response?: { data?: { message?: string } } };
            const msg = errRes.response?.data?.message || "Failed to send test WhatsApp message";
            setTestResult({ ok: false, message: msg });
            sonnerToast.error(msg);
        } finally {
            setTesting(false);
        }
    };

    const activeCount = Object.keys(gatewaysConfig).filter(tabKey => {
        const pKey = gatewaysConfig[tabKey].providerName;
        return settingsData[pKey]?.status;
    }).length;

    return (
        <div className="p-2 sm:p-3 md:p-4 space-y-4 sm:space-y-6 bg-gray-50/10 min-h-screen font-sans flex flex-col lg:flex-row gap-4 sm:gap-6">
            
            {/* Left Column: Main Gateway Configuration Area */}
            <div className="flex-1 min-w-0 space-y-4">
                <Card className="pt-0 overflow-hidden">
                    {/* Main Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            </span>
                            <div>
                                <h1 className="text-[13px] sm:text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                                    {t("whatsapp_messaging") || "WhatsApp Messaging & Gateways"}
                                </h1>
                                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 sm:mt-1">
                                    {t("configure_whatsapp_messaging_providers") || "Configure WhatsApp providers & enable Round Robin load balancing"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-0 min-h-[400px] sm:min-h-[500px]">
                        {/* Gateway Tabs Header */}
                        <div className="border-b border-gray-100 bg-white">
                            {/* Mobile Dropdown */}
                            <div className="sm:hidden px-3 py-2">
                                <Select value={activeTab} onValueChange={(val) => { setActiveTab(val); setTestResult(null); }}>
                                    <SelectTrigger className="h-9 text-[12px] border-gray-200 shadow-none rounded">
                                        <SelectValue placeholder="Select WhatsApp Provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {gatewayTabKeys.map((tabKey) => (
                                            <SelectItem key={tabKey} value={tabKey} className="text-[12px]">
                                                {tabKey}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Desktop Horizontal Tabs (BipSMS IS FIRST) */}
                            <div className="hidden sm:block overflow-x-auto">
                                <div className="flex pb-1 pt-1 px-1">
                                    {gatewayTabKeys.map((tabKey) => {
                                        const gwProviderKey = gatewaysConfig[tabKey].providerName;
                                        const gwData = settingsData[gwProviderKey];
                                        const gwEnabled = gwData?.status || false;

                                        return (
                                            <button
                                                key={tabKey}
                                                onClick={() => { setActiveTab(tabKey); setTestResult(null); }}
                                                className={cn(
                                                    "px-3 xl:px-4 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-bold uppercase transition-all whitespace-nowrap border-b-2 mx-0.5 sm:mx-1 flex items-center gap-1.5",
                                                    activeTab === tabKey
                                                        ? "text-indigo-600 border-indigo-500 bg-indigo-50/10"
                                                        : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                <span>{tabKey}</span>
                                                {gwEnabled && (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="p-4 sm:p-5 md:p-6">
                            {loading ? (
                                <FormSkeleton />
                            ) : (
                                <div className="flex flex-col xl:flex-row gap-6 xl:gap-12 animate-in fade-in duration-300">
                                    <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">
                                        
                                        {/* Dynamic Fields per Gateway */}
                                        {currentTabDef.fields.map((field) => (
                                            <div key={field.key} className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
                                                <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">
                                                    {field.label} <span className="text-red-500">*</span>
                                                </Label>
                                                <div className="sm:col-span-3">
                                                    {field.type === "select" && field.options ? (
                                                        <Select
                                                            value={currentItem.config[field.key] || ""}
                                                            onValueChange={(val) => handleFieldChange(field.key, val)}
                                                        >
                                                            <SelectTrigger className="h-8 sm:h-9 text-[11px] border-gray-200 shadow-none rounded text-gray-700">
                                                                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {field.options.map((opt) => (
                                                                    <SelectItem key={opt} value={opt} className="text-[11px]">
                                                                        {field.optionLabels?.[opt] || opt.charAt(0).toUpperCase() + opt.slice(1)}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Input
                                                            type={field.type}
                                                            value={currentItem.config[field.key] || ""}
                                                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                                            placeholder={`Enter ${field.label.toLowerCase()}`}
                                                            className="h-8 sm:h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Send Limit per Round Field for Round Robin */}
                                        <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4 pt-2 border-t border-dashed border-gray-200">
                                            <Label className="text-[11px] font-bold text-indigo-700 sm:text-right uppercase flex items-center gap-1 justify-end">
                                                <RefreshCw className="h-3 w-3 text-indigo-600" />
                                                Send Limit per Round
                                            </Label>
                                            <div className="sm:col-span-3 space-y-1">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={10000}
                                                    value={currentItem.config.wa_limit || 100}
                                                    onChange={(e) => handleFieldChange("wa_limit", Math.max(1, Number(e.target.value)))}
                                                    className="h-8 sm:h-9 text-[11px] border-indigo-200 focus:ring-indigo-500 shadow-none rounded w-full sm:w-44"
                                                    placeholder="100 Messages"
                                                />
                                                <p className="text-[10px] text-gray-400">
                                                    Number of WhatsApp messages sent via this gateway before Round Robin rotates to the next active WhatsApp provider.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Test Message Row */}
                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3">
                                                <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">
                                                    Test Phone Number
                                                </Label>
                                                <div className="sm:col-span-3 space-y-2">
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="text"
                                                            placeholder="+1234567890"
                                                            value={testPhone}
                                                            onChange={(e) => setTestPhone(e.target.value)}
                                                            className="h-8 sm:h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded flex-1"
                                                        />
                                                        <Button
                                                            onClick={handleTestMessage}
                                                            disabled={testing || !testPhone.trim()}
                                                            variant="outline"
                                                            className="h-8 sm:h-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[11px] font-bold uppercase shrink-0 px-3"
                                                        >
                                                            {testing ? (
                                                                <><Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Testing...</>
                                                            ) : (
                                                                <><Send className="h-3 w-3 mr-1.5 text-indigo-600" /> Send Test</>
                                                            )}
                                                        </Button>
                                                    </div>
                                                    {testResult && (
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded",
                                                            testResult.ok ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-red-700 bg-red-50 border border-red-200"
                                                        )}>
                                                            {testResult.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                                            {testResult.message}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Right Gateway Branding / Documentation Link */}
                                    <div className="hidden xl:flex flex-col items-center justify-center space-y-6 xl:border-l border-gray-100 xl:pl-8 min-h-[220px]">
                                        <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gradient-to-br from-emerald-50 to-indigo-50 border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                                            <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
                                        </div>
                                        <div className="text-center space-y-1.5">
                                            <p className="text-[11px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">
                                                Configure {activeTab}
                                            </p>
                                            <span className={cn(
                                                "text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block",
                                                currentItem.status ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                                            )}>
                                                {currentItem.status ? "● Active Provider" : "○ Disabled"}
                                            </span>
                                            {currentTabDef.guideUrl && (
                                                <a
                                                    href={currentTabDef.guideUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[11px] text-indigo-600 hover:underline flex items-center justify-center gap-1 font-medium transition-colors pt-1"
                                                >
                                                    Documentation <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Save Action */}
                        <div className="border-t border-gray-50 p-4 sm:p-5 md:p-6 bg-white flex justify-center">
                            <Button
                                onClick={handleSaveTab}
                                disabled={savingTab}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-8 sm:px-10 h-9 sm:h-10 text-[11px] sm:text-xs font-bold uppercase transition-all rounded-full shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 w-full sm:w-auto"
                            >
                                {savingTab ? <><Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" /> {t("saving")}</> : t("save")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Active Gateways & Round Robin Sidebar */}
            <div className="w-full lg:w-64 xl:w-72 shrink-0 space-y-4">
                
                {/* Round Robin Master Card */}
                <Card className="pt-0 overflow-hidden border-indigo-100 shadow-sm">
                    <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-[#EFF0FD] to-[#FFF5E7] border-b border-gray-100">
                        <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#FF9800] text-white shadow-sm">
                            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-[12px] sm:text-[14px] font-bold text-gray-800 tracking-tight leading-none truncate">
                                WhatsApp Round Robin
                            </h2>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 truncate">
                                Auto rotate across WhatsApp gateways
                            </p>
                        </div>
                    </div>

                    <CardContent className="p-3.5 sm:p-4 space-y-3">
                        <div className="flex items-center justify-between py-1 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                            <div className="space-y-0.5">
                                <Label className="text-[11px] font-bold text-gray-700 block">
                                    Round Robin Mode
                                </Label>
                                <span className={cn(
                                    "text-[10px] font-semibold block",
                                    roundRobinEnabled ? "text-indigo-600" : "text-gray-400"
                                )}>
                                    {roundRobinEnabled ? `Active (${activeCount} Providers)` : "Disabled"}
                                </span>
                            </div>
                            <Switch
                                checked={roundRobinEnabled}
                                onCheckedChange={handleToggleRoundRobin}
                                className="data-[state=checked]:bg-indigo-600"
                            />
                        </div>

                        <p className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 p-2.5 rounded border border-gray-100">
                            💡 When enabled, outgoing WhatsApp messages will rotate across active providers based on each provider&apos;s send limit per round.
                        </p>
                    </CardContent>
                </Card>

                {/* Queue Sending Interval Control Card */}
                <Card className="pt-0 overflow-hidden border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 sm:py-3.5 bg-gradient-to-r from-[#ECFDF5] to-[#EFF6FF] border-b border-gray-100">
                        <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-600 text-white shadow-sm">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-[12px] sm:text-[13px] font-bold text-gray-800 tracking-tight leading-none">
                                Sending Interval & Anti-Ban
                            </h2>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                                Queue delay between messages
                            </p>
                        </div>
                    </div>

                    <CardContent className="p-3.5 sm:p-4 space-y-3">
                        <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-gray-700">Interval Mode</Label>
                            <Select 
                                value={intervalConfig.mode || "random"} 
                                onValueChange={(val) => setIntervalConfig(prev => ({ ...prev, mode: val }))}
                            >
                                <SelectTrigger className="h-8 text-[11px] border-gray-200">
                                    <SelectValue placeholder="Select interval mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="random" className="text-[11px]">Random Delay (Anti-Ban)</SelectItem>
                                    <SelectItem value="fixed" className="text-[11px]">Fixed Interval</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(intervalConfig.mode || "random") === "random" ? (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-gray-600">From (Sec)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={300}
                                        value={intervalConfig.min ?? ""}
                                        onChange={(e) => {
                                            const val = e.target.value === "" ? 1 : parseInt(e.target.value, 10);
                                            setIntervalConfig(prev => ({ ...prev, min: isNaN(val) ? 1 : val }));
                                        }}
                                        className="h-8 text-[11px]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-gray-600">To (Sec)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={300}
                                        value={intervalConfig.max ?? ""}
                                        onChange={(e) => {
                                            const val = e.target.value === "" ? 10 : parseInt(e.target.value, 10);
                                            setIntervalConfig(prev => ({ ...prev, max: isNaN(val) ? 10 : val }));
                                        }}
                                        className="h-8 text-[11px]"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-600">Interval (Seconds)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={300}
                                    value={intervalConfig.fixed ?? ""}
                                    onChange={(e) => {
                                        const val = e.target.value === "" ? 1 : parseInt(e.target.value, 10);
                                        setIntervalConfig(prev => ({ ...prev, fixed: isNaN(val) ? 1 : val }));
                                    }}
                                    className="h-8 text-[11px]"
                                />
                            </div>
                        )}

                        <Button
                            size="sm"
                            onClick={handleSaveInterval}
                            disabled={savingInterval}
                            className="w-full h-8 text-[11px] font-bold uppercase bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {savingInterval ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                            Save Interval
                        </Button>
                    </CardContent>
                </Card>

                {/* Live Queue Monitor & Emergency Cancellation */}
                <QueueMonitorCard channelFilter="whatsapp" title="WhatsApp Queue & Emergency Stop" />

                {/* Active Gateways Toggle List Sidebar */}
                <Card className="pt-0 overflow-hidden">
                    <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Sliders className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-[12px] sm:text-[14px] font-bold text-gray-800 tracking-tight leading-none truncate">
                                Active Gateways
                            </h2>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 truncate">
                                Toggle to enable or disable
                            </p>
                        </div>
                    </div>

                    <CardContent className="p-3 sm:p-4">
                        <div className="overflow-y-auto max-h-[45vh] sm:max-h-[55vh] pr-1">
                            <div className="space-y-2">
                                {gatewayTabKeys.map((tabKey) => {
                                    const gwProviderKey = gatewaysConfig[tabKey].providerName;
                                    const item = settingsData[gwProviderKey];
                                    const isEnabled = item?.status || false;
                                    const isSelected = activeTab === tabKey;

                                    return (
                                        <div
                                            key={`side-${tabKey}`}
                                            className={cn(
                                                "flex items-center justify-between p-2 rounded-lg transition-all border",
                                                isSelected
                                                    ? "bg-indigo-50/40 border-indigo-200"
                                                    : "border-gray-100 hover:bg-gray-50"
                                            )}
                                        >
                                            <div
                                                className="min-w-0 cursor-pointer flex-1 mr-2"
                                                onClick={() => { setActiveTab(tabKey); setTestResult(null); }}
                                            >
                                                <Label className="text-[11px] font-bold text-gray-700 cursor-pointer block truncate hover:text-indigo-600">
                                                    {tabKey}
                                                </Label>
                                                <span className="text-[9px] text-gray-400 block truncate">
                                                    {isEnabled ? `Limit: ${item?.config?.wa_limit || 100} / round` : "Inactive"}
                                                </span>
                                            </div>

                                            <Switch
                                                checked={isEnabled}
                                                onCheckedChange={() => handleToggleGateway(gwProviderKey, tabKey)}
                                                className="data-[state=checked]:bg-indigo-600 h-4 w-7 sm:h-5 sm:w-9"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
