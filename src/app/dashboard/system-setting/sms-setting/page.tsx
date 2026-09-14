"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, toLocaleNumber } from "@/lib/utils";
import { Loader2, MessageSquare, Send, RefreshCw, Smartphone, ExternalLink, Sliders, CheckCircle2, XCircle, Clock, Save } from "lucide-react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { toast as sonnerToast } from "sonner";
import { QueueMonitorCard } from "@/components/queue/queue-monitor-card";

interface GatewayFieldDef {
    key: string;
    labelKey: string;
    fallbackLabel: string;
    type: string;
    options?: string[];
    optionLabelKeys?: Record<string, string>;
    optionLabels?: Record<string, string>;
    showWhen?: { field: string; value: string };
}

interface GatewayConfigDef {
    providerName: string;
    guideUrl?: string;
    fields: GatewayFieldDef[];
}

const gatewaysConfig: Record<string, GatewayConfigDef> = {
    "BipSMS": {
        providerName: "bipsms",
        guideUrl: "https://app.bipsms.com",
        fields: [
            { key: "secret", labelKey: "api_secret", fallbackLabel: "API Secret", type: "password" },
            { 
                key: "mode", 
                labelKey: "sms_mode", 
                fallbackLabel: "Mode (devices/credits)", 
                type: "select", 
                options: ["devices", "credits"],
                optionLabelKeys: { "devices": "mode_devices", "credits": "mode_credits" },
                optionLabels: { "devices": "Devices", "credits": "Credits" }
            },
            { key: "device", labelKey: "device_id_for_devices_mode", fallbackLabel: "Device ID (for devices mode)", type: "password", showWhen: { field: "mode", value: "devices" } },
            { key: "gateway", labelKey: "gateway_id_for_credits_mode", fallbackLabel: "Gateway ID (for credits mode)", type: "password", showWhen: { field: "mode", value: "credits" } },
            { key: "sim", labelKey: "sim_slot", fallbackLabel: "SIM Slot (1/2)", type: "text" },
            { key: "priority", labelKey: "priority", fallbackLabel: "Priority", type: "text" }
        ]
    },
    "Twilio SMS Gateway": {
        providerName: "twilio",
        guideUrl: "https://www.twilio.com/console",
        fields: [
            { key: "account_sid", labelKey: "account_sid", fallbackLabel: "Account SID", type: "text" },
            { key: "auth_token", labelKey: "auth_token", fallbackLabel: "Auth Token", type: "password" },
            { key: "sender_phone", labelKey: "sender_phone_number", fallbackLabel: "Sender Phone Number", type: "text" }
        ]
    },
    "Clickatell Sms Gateway": {
        providerName: "clickatell",
        guideUrl: "https://www.clickatell.com",
        fields: [
            { key: "username", labelKey: "clickatell_username", fallbackLabel: "Clickatell Username", type: "text" },
            { key: "password", labelKey: "clickatell_password", fallbackLabel: "Clickatell Password", type: "password" },
            { key: "api_key", labelKey: "api_key", fallbackLabel: "API Key", type: "password" }
        ]
    },
    "MSG91": {
        providerName: "msg91",
        guideUrl: "https://control.msg91.com",
        fields: [
            { key: "auth_key", labelKey: "auth_key", fallbackLabel: "Auth Key", type: "password" },
            { key: "sender_id", labelKey: "sender_id", fallbackLabel: "Sender ID", type: "text" }
        ]
    },
    "Text Local": {
        providerName: "text_local",
        guideUrl: "https://www.textlocal.in",
        fields: [
            { key: "api_key", labelKey: "api_key", fallbackLabel: "API Key", type: "password" },
            { key: "sender_id", labelKey: "sender_id", fallbackLabel: "Sender ID", type: "text" }
        ]
    },
    "SMS Country": {
        providerName: "sms_country",
        guideUrl: "https://www.smscountry.com",
        fields: [
            { key: "username", labelKey: "username", fallbackLabel: "Username", type: "text" },
            { key: "password", labelKey: "password", fallbackLabel: "Password", type: "password" },
            { key: "sender_id", labelKey: "sender_id", fallbackLabel: "Sender ID", type: "text" }
        ]
    },
    "Bulk SMS": {
        providerName: "bulk_sms",
        guideUrl: "https://www.bulksms.com",
        fields: [
            { key: "username", labelKey: "username", fallbackLabel: "Username", type: "text" },
            { key: "password", labelKey: "password", fallbackLabel: "Password", type: "password" }
        ]
    },
    "Mobi Reach": {
        providerName: "mobi_reach",
        guideUrl: "https://www.mobireach.com.bd",
        fields: [
            { key: "auth_key", labelKey: "auth_key", fallbackLabel: "Auth Key", type: "password" },
            { key: "route_id", labelKey: "route_id", fallbackLabel: "Route ID", type: "text" }
        ]
    },
    "Nexmo": {
        providerName: "nexmo",
        guideUrl: "https://dashboard.nexmo.com",
        fields: [
            { key: "api_key", labelKey: "api_key", fallbackLabel: "API Key", type: "password" },
            { key: "api_secret", labelKey: "api_secret", fallbackLabel: "API Secret", type: "password" },
            { key: "sender_phone", labelKey: "sender_phone_number", fallbackLabel: "Sender Phone Number", type: "text" }
        ]
    },
    "AfricasTalking": {
        providerName: "africas_talking",
        guideUrl: "https://africastalking.com",
        fields: [
            { key: "username", labelKey: "username", fallbackLabel: "Username", type: "text" },
            { key: "api_key", labelKey: "api_key", fallbackLabel: "API Key", type: "text" }
        ]
    },
    "SMS Egypt": {
        providerName: "sms_egypt",
        guideUrl: "https://www.smsegypt.com",
        fields: [
            { key: "username", labelKey: "username", fallbackLabel: "Username", type: "text" },
            { key: "password", labelKey: "password", fallbackLabel: "Password", type: "password" },
            { key: "sender_id", labelKey: "sender_id", fallbackLabel: "Sender ID", type: "text" }
        ]
    },
    "SMS Gateway Hub": {
        providerName: "sms_gateway_hub",
        guideUrl: "https://www.smsgatewayhub.com",
        fields: [
            { key: "api_key", labelKey: "api_key", fallbackLabel: "API Key", type: "text" },
            { key: "sender_id", labelKey: "sender_id", fallbackLabel: "Sender ID", type: "text" }
        ]
    },
    "Custom SMS Gateway": {
        providerName: "custom_sms",
        fields: [
            { key: "gateway_url", labelKey: "gateway_url", fallbackLabel: "Gateway URL", type: "text" },
            { key: "http_method", labelKey: "http_method", fallbackLabel: "HTTP Method", type: "select", options: ["GET", "POST"] },
            { key: "param_phone", labelKey: "param_phone_name", fallbackLabel: "Phone Parameter Name", type: "text" },
            { key: "param_message", labelKey: "param_message_name", fallbackLabel: "Message Parameter Name", type: "text" },
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

export default function SmsSettingPage() {
    const { t, language } = useTranslation();

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

    const fetchSmsSettings = useCallback(async () => {
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

                gatewayTabKeys.forEach((tabKey) => {
                    const providerName = gatewaysConfig[tabKey].providerName;
                    if (!formatted[providerName]) {
                        formatted[providerName] = {
                            provider: providerName,
                            name: tabKey,
                            config: {
                                sms_limit: 100,
                            },
                            status: providerName === "bipsms",
                            sent_count: 0,
                        };
                    } else if (formatted[providerName].config.sms_limit === undefined) {
                        formatted[providerName].config.sms_limit = 100;
                    }
                });

                setSettingsData(formatted);
                setRoundRobinEnabled(Boolean(res.data.round_robin?.enabled));
                if (res.data.sms_interval) {
                    setIntervalConfig({
                        mode: res.data.sms_interval.mode || "random",
                        min: Number(res.data.sms_interval.min) || 1,
                        max: Number(res.data.sms_interval.max) || 10,
                        fixed: Number(res.data.sms_interval.fixed) || 1,
                    });
                }
            }
        } catch (error) {
            console.error("Failed to fetch SMS settings:", error);
            sonnerToast.error(t("failed_to_load") || "Failed to load SMS settings");
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchSmsSettings();
    }, [fetchSmsSettings]);

    const handleSaveInterval = async () => {
        setSavingInterval(true);
        try {
            const payload = {
                channel: 'sms',
                mode: intervalConfig.mode || "random",
                min: Number(intervalConfig.min) || 1,
                max: Number(intervalConfig.max) || 10,
                fixed: Number(intervalConfig.fixed) || 1,
            };
            const res = await api.post('/system-setting/sms-gateways/interval', payload);
            if (res.data?.status === 'success') {
                sonnerToast.success(t("sms_interval_saved_successfully") || res.data.message || "SMS interval settings saved successfully");
                if (res.data.data) {
                    setIntervalConfig({
                        mode: res.data.data.mode || "random",
                        min: Number(res.data.data.min) || 1,
                        max: Number(res.data.data.max) || 10,
                        fixed: Number(res.data.data.fixed) || 1,
                    });
                }
            } else {
                sonnerToast.error(t("failed_to_save_interval_settings") || res.data?.message || "Failed to save interval settings");
            }
        } catch {
            sonnerToast.error(t("failed_to_save_interval_settings") || "Failed to save interval settings");
        } finally {
            setSavingInterval(false);
        }
    };

    const currentTabDef = gatewaysConfig[activeTab];
    const currentProviderKey = currentTabDef.providerName;
    const currentItem = settingsData[currentProviderKey] || {
        provider: currentProviderKey,
        name: activeTab,
        config: { sms_limit: 100 },
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
                const successMsg = t("whatsapp_config_saved_successfully", { provider: getProviderTabLabel(activeTab) }) || `${activeTab} configuration saved successfully!`;
                sonnerToast.success(successMsg);
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
                const errMsg = t("failed_to_save_configuration", { provider: getProviderTabLabel(activeTab) }) || res.data?.message || `Failed to save ${activeTab} configuration`;
                sonnerToast.error(errMsg);
            }
        } catch (err: unknown) {
            const errRes = err as { response?: { data?: { message?: string } } };
            const errMsg = errRes.response?.data?.message || t("failed_to_save_configuration", { provider: getProviderTabLabel(activeTab) }) || `Failed to save ${activeTab} configuration`;
            sonnerToast.error(errMsg);
        } finally {
            setSavingTab(false);
        }
    };

    const handleToggleGateway = async (providerKey: string, tabLabel: string) => {
        const translatedLabel = getProviderTabLabel(tabLabel);
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
                    sonnerToast.success(t("provider_activated", { provider: translatedLabel }) || `${translatedLabel} activated`);
                } else {
                    sonnerToast.info(t("provider_deactivated", { provider: translatedLabel }) || `${translatedLabel} deactivated`);
                }
            }
        } catch {
            sonnerToast.error(t("failed_to_toggle_provider", { provider: translatedLabel }) || `Failed to toggle ${translatedLabel}`);
        }
    };

    const handleToggleRoundRobin = async () => {
        try {
            const res = await api.post('/system-setting/sms-gateways/toggle-round-robin');
            if (res.data?.status === 'success') {
                const newStatus = res.data.data.round_robin_enabled;
                setRoundRobinEnabled(newStatus);
                if (newStatus) {
                    sonnerToast.success(t("round_robin_activated") || "SMS Round Robin load balancing activated!");
                } else {
                    sonnerToast.info(t("round_robin_deactivated") || "SMS Round Robin load balancing deactivated");
                }
            }
        } catch {
            sonnerToast.error(t("failed_to_toggle_round_robin") || "Failed to toggle SMS Round Robin load balancing");
        }
    };

    const handleTestSms = async () => {
        if (!testPhone.trim()) {
            sonnerToast.error(t("enter_phone_number_to_send_test_sms") || "Please enter a test phone number");
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
                const msg = res.data?.message || t("test_sms_sent_successfully") || "Test SMS sent successfully";
                setTestResult({ ok: true, message: msg });
                sonnerToast.success(msg);
            } else {
                const msg = res.data?.message || t("test_sms_failed") || "Test SMS failed";
                setTestResult({ ok: false, message: msg });
                sonnerToast.error(msg);
            }
        } catch (err: unknown) {
            const errRes = err as { response?: { data?: { message?: string } } };
            const msg = errRes.response?.data?.message || t("test_sms_failed") || "Failed to send test SMS";
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

    const getFieldLabel = (field: GatewayFieldDef) => {
        return t(field.labelKey) || field.fallbackLabel;
    };

    const getProviderTabLabel = (tabKey: string) => {
        const keyMap: Record<string, string> = {
            "BipSMS": "bipsms",
            "Twilio SMS Gateway": "twilio_sms_gateway",
            "Clickatell Sms Gateway": "clickatell_sms_gateway",
            "MSG91": "msg91",
            "Text Local": "text_local",
            "SMS Country": "sms_country",
            "Bulk SMS": "bulk_sms",
            "Mobi Reach": "mobi_reach",
            "Nexmo": "nexmo",
            "AfricasTalking": "africas_talking",
            "SMS Egypt": "sms_egypt",
            "SMS Gateway Hub": "sms_gateway_hub",
            "Custom SMS Gateway": "custom_sms_gateway",
        };
        const transKey = keyMap[tabKey];
        if (transKey && t(transKey)) return t(transKey);
        return tabKey;
    };

    const getOptionLabel = (field: GatewayFieldDef, opt: string) => {
        const optKey = field.optionLabelKeys?.[opt];
        if (optKey && t(optKey)) return t(optKey);
        return field.optionLabels?.[opt] || opt.charAt(0).toUpperCase() + opt.slice(1);
    };

    return (
        <div className="p-2 sm:p-3 md:p-4 space-y-4 sm:space-y-6 bg-gray-50/10 min-h-screen font-sans flex flex-col lg:flex-row gap-4 sm:gap-6">
            
            {/* Left Column: Main Gateway Configuration Area */}
            <div className="flex-1 min-w-0 space-y-4">
                <Card className="pt-0 overflow-hidden">
                    {/* Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                            </span>
                            <div>
                                <h1 className="text-[13px] sm:text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                                    {t("sms_setting") || "SMS Settings & Multiple SMS Gateways"}
                                </h1>
                                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 sm:mt-1">
                                    {t("configure_sms_gateway_providers") || "Configure SMS gateways & enable Round Robin load balancing"}
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
                                        <SelectValue placeholder={t("select_sms_gateway") || "Select SMS Gateway"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {gatewayTabKeys.map((tabKey) => (
                                            <SelectItem key={tabKey} value={tabKey} className="text-[12px]">
                                                {getProviderTabLabel(tabKey)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Desktop Horizontal Tabs */}
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
                                                    "px-3 xl:px-4 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-bold transition-all whitespace-nowrap border-b-2 mx-0.5 sm:mx-1 flex items-center gap-1.5",
                                                    activeTab === tabKey
                                                        ? "text-indigo-600 border-indigo-500 bg-indigo-50/10"
                                                        : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                <span>{getProviderTabLabel(tabKey)}</span>
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
                                        {currentTabDef.fields.map((field) => {
                                            if (field.showWhen) {
                                                const depVal = currentItem.config[field.showWhen.field] || "";
                                                if (depVal !== field.showWhen.value) return null;
                                            }

                                            const labelText = getFieldLabel(field);

                                            return (
                                                <div key={field.key} className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
                                                    <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">
                                                        {labelText} <span className="text-red-500">*</span>
                                                    </Label>
                                                    <div className="sm:col-span-3">
                                                        {field.type === "select" && field.options ? (
                                                            <Select
                                                                value={String(currentItem.config[field.key] || "")}
                                                                onValueChange={(val) => handleFieldChange(field.key, val)}
                                                            >
                                                                <SelectTrigger className="h-8 sm:h-9 text-[11px] border-gray-200 shadow-none rounded text-gray-700">
                                                                    <SelectValue placeholder={t("select_field_value", { field: labelText }) || `Select ${labelText}`} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {field.options.map((opt) => (
                                                                        <SelectItem key={opt} value={opt} className="text-[11px]">
                                                                            {getOptionLabel(field, opt)}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Input
                                                                type={field.type}
                                                                value={String(currentItem.config[field.key] || "")}
                                                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                                                placeholder={t("enter_field_value", { field: labelText }) || `Enter ${labelText}`}
                                                                className="h-8 sm:h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Send Limit per Round Field for Round Robin */}
                                        <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4 pt-2 border-t border-dashed border-gray-200">
                                            <Label className="text-[11px] font-bold text-indigo-700 sm:text-right uppercase flex items-center gap-1 justify-end">
                                                <RefreshCw className="h-3 w-3 text-indigo-600" />
                                                {t("send_limit_per_round") || "Send Limit per Round"}
                                            </Label>
                                            <div className="sm:col-span-3 space-y-1">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={10000}
                                                    value={currentItem.config.sms_limit || 100}
                                                    onChange={(e) => handleFieldChange("sms_limit", Math.max(1, Number(e.target.value)))}
                                                    className="h-8 sm:h-9 text-[11px] border-indigo-200 focus:ring-indigo-500 shadow-none rounded w-full sm:w-44"
                                                    placeholder={t("sms_count_placeholder") || "100 SMS"}
                                                />
                                                <p className="text-[10px] text-gray-400">
                                                    {t("send_limit_per_round_desc") || "Number of SMS messages sent via this gateway before Round Robin rotates to the next active SMS gateway."}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Test SMS Row */}
                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3">
                                                <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">
                                                    {t("test_sms_phone") || "Test SMS Phone"}
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
                                                            onClick={handleTestSms}
                                                            disabled={testing || !testPhone.trim()}
                                                            variant="outline"
                                                            className="h-8 sm:h-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[11px] font-bold uppercase shrink-0 px-3"
                                                        >
                                                            {testing ? (
                                                                <><Loader2 className="h-3 w-3 animate-spin mr-1.5" /> {t("testing") || "Testing..."}</>
                                                            ) : (
                                                                <><Send className="h-3 w-3 mr-1.5 text-indigo-600" /> {t("send_test") || "Send Test"}</>
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

                                    {/* Right Gateway Branding / Guide Link */}
                                    <div className="hidden xl:flex flex-col items-center justify-center space-y-6 xl:border-l border-gray-100 xl:pl-8 min-h-[220px]">
                                        <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gradient-to-br from-orange-50 to-indigo-50 border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                                            <Smartphone className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-500" />
                                        </div>
                                        <div className="text-center space-y-1.5">
                                            <p className="text-[11px] sm:text-xs text-gray-500 font-bold tracking-wider">
                                                {t("configure_provider", { provider: getProviderTabLabel(activeTab) }) || `Configure ${getProviderTabLabel(activeTab)}`}
                                            </p>
                                            <span className={cn(
                                                "text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block",
                                                currentItem.status ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                                            )}>
                                                {currentItem.status ? (t("active_gateway") || "● Active Gateway") : (t("disabled_provider") || "○ Disabled")}
                                            </span>
                                            {currentTabDef.guideUrl && (
                                                <a
                                                    href={currentTabDef.guideUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[11px] text-indigo-600 hover:underline flex items-center justify-center gap-1 font-medium transition-colors pt-1"
                                                >
                                                    {t("documentation") || "Documentation"} <ExternalLink className="h-3 w-3" />
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
                                {savingTab ? <><Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" /> {t("saving") || "Saving..."}</> : (t("save") || "Save")}
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
                                {t("sms_round_robin") || "SMS Round Robin"}
                            </h2>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 truncate">
                                {t("auto_rotate_across_sms_gateways") || "Auto rotate across active SMS gateways"}
                            </p>
                        </div>
                    </div>

                    <CardContent className="p-3.5 sm:p-4 space-y-3">
                        <div className="flex items-center justify-between py-1 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                            <div className="space-y-0.5">
                                <Label className="text-[11px] font-bold text-gray-700 block">
                                    {t("round_robin_mode") || "Round Robin Mode"}
                                </Label>
                                <span className={cn(
                                    "text-[10px] font-semibold block",
                                    roundRobinEnabled ? "text-indigo-600" : "text-gray-400"
                                )}>
                                    {roundRobinEnabled 
                                        ? (t("active_count_gateways", { count: toLocaleNumber(activeCount, language?.short_code) }) || `Active (${toLocaleNumber(activeCount, language?.short_code)} Gateways)`)
                                        : (t("disabled") || "Disabled")}
                                </span>
                            </div>
                            <Switch
                                checked={roundRobinEnabled}
                                onCheckedChange={handleToggleRoundRobin}
                                className="data-[state=checked]:bg-indigo-600"
                            />
                        </div>

                        <p className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 p-2.5 rounded border border-gray-100">
                            {t("sms_round_robin_note") || "💡 When enabled, outgoing SMS messages will rotate across all active SMS gateways based on each gateway's send limit per round."}
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
                                {t("sending_interval_and_rate_limiter") || "Sending Interval & Rate Limiter"}
                            </h2>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                                {t("queue_delay_between_messages") || "Queue delay between messages"}
                            </p>
                        </div>
                    </div>

                    <CardContent className="p-3.5 sm:p-4 space-y-3">
                        <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-gray-700">{t("interval_mode") || "Interval Mode"}</Label>
                            <Select 
                                value={intervalConfig.mode || "random"} 
                                onValueChange={(val) => setIntervalConfig(prev => ({ ...prev, mode: val }))}
                            >
                                <SelectTrigger className="h-8 text-[11px] border-gray-200">
                                    <SelectValue placeholder={t("select_interval_mode") || "Select interval mode"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="random" className="text-[11px]">{t("random_delay_anti_ban") || "Random Delay (Anti-Ban)"}</SelectItem>
                                    <SelectItem value="fixed" className="text-[11px]">{t("fixed_interval") || "Fixed Interval"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(intervalConfig.mode || "random") === "random" ? (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-gray-600">{t("from_sec") || "From (Sec)"}</Label>
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
                                    <Label className="text-[10px] font-bold text-gray-600">{t("to_sec") || "To (Sec)"}</Label>
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
                                <Label className="text-[10px] font-bold text-gray-600">{t("interval_seconds") || "Interval (Seconds)"}</Label>
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
                            {t("save_interval") || "Save Interval"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Live Queue Monitor & Emergency Cancellation */}
                <QueueMonitorCard channelFilter="sms" title={t("sms_queue_emergency_stop") || "SMS Queue & Emergency Stop"} />

                {/* Active Gateways Toggle List Sidebar */}
                <Card className="pt-0 overflow-hidden">
                    <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Sliders className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-[12px] sm:text-[14px] font-bold text-gray-800 tracking-tight leading-none truncate">
                                {t("active_gateways") || "Active Gateways"}
                            </h2>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 truncate">
                                {t("toggle_to_enable_or_disable") || "Toggle to enable or disable"}
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
                                    const limitVal = toLocaleNumber(item?.config?.sms_limit || 100, language?.short_code);

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
                                                    {getProviderTabLabel(tabKey)}
                                                </Label>
                                                <span className="text-[9px] text-gray-400 block truncate">
                                                    {isEnabled 
                                                        ? (t("limit_per_round", { limit: limitVal }) || `Limit: ${limitVal} / round`) 
                                                        : (t("inactive") || "Inactive")}
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
