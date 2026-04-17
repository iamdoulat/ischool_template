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
import { ExternalLink, MessageSquare, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const gatewaysConfig: Record<string, { providerName: string, fields: { key: string, label: string, type: string }[] }> = {
    "Clickatell Sms Gateway": {
        providerName: "clickatell",
        fields: [
            { key: "username", label: "Clickatell Username", type: "text" },
            { key: "password", label: "Clickatell Password", type: "password" },
            { key: "api_key", label: "API Key", type: "text" }
        ]
    },
    "Twilio SMS Gateway": {
        providerName: "twilio",
        fields: [
            { key: "account_sid", label: "Account SID", type: "text" },
            { key: "auth_token", label: "Auth Token", type: "password" },
            { key: "sender_phone", label: "Sender Phone Number", type: "text" }
        ]
    },
    "MSG91": {
        providerName: "msg91",
        fields: [
            { key: "auth_key", label: "Auth Key", type: "text" },
            { key: "sender_id", label: "Sender ID", type: "text" }
        ]
    },
    "Text Local": {
        providerName: "text_local",
        fields: [
            { key: "api_key", label: "API Key", type: "text" },
            { key: "sender_id", label: "Sender ID", type: "text" }
        ]
    },
    "SMS Country": {
        providerName: "sms_country",
        fields: [
            { key: "username", label: "Username", type: "text" },
            { key: "password", label: "Password", type: "password" },
            { key: "sender_id", label: "Sender ID", type: "text" }
        ]
    },
    "Bulk SMS": {
        providerName: "bulk_sms",
        fields: [
            { key: "username", label: "Username", type: "text" },
            { key: "password", label: "Password", type: "password" }
        ]
    },
    "Mobi Reach": {
        providerName: "mobi_reach",
        fields: [
            { key: "auth_key", label: "Auth Key", type: "text" },
            { key: "route_id", label: "Route ID", type: "text" }
        ]
    },
    "Nexmo": {
        providerName: "nexmo",
        fields: [
            { key: "api_key", label: "API Key", type: "text" },
            { key: "api_secret", label: "API Secret", type: "password" },
            { key: "sender_phone", label: "Sender Phone Number", type: "text" }
        ]
    },
    "AfricasTalking": {
        providerName: "africas_talking",
        fields: [
            { key: "username", label: "Username", type: "text" },
            { key: "api_key", label: "API Key", type: "text" }
        ]
    },
    "SMS Egypt": {
        providerName: "sms_egypt",
        fields: [
            { key: "username", label: "Username", type: "text" },
            { key: "password", label: "Password", type: "password" },
            { key: "sender_id", label: "Sender ID", type: "text" }
        ]
    },
    "SMS Gateway Hub": {
        providerName: "sms_gateway_hub",
        fields: [
            { key: "api_key", label: "API Key", type: "text" },
            { key: "sender_id", label: "Sender ID", type: "text" }
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

export default function SmsSettingPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("Clickatell Sms Gateway");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // State to hold settings for all providers: { "clickatell": { config: {...}, status: "enabled" }, ... }
    const [settingsData, setSettingsData] = useState<Record<string, { config: any, status: string }>>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/system-setting/sms-settings');
            if (res.data?.status === 'success') {
                const fetchedSettings = res.data.data;
                const formattedData: any = {};

                fetchedSettings.forEach((setting: any) => {
                    formattedData[setting.provider] = {
                        config: setting.config || {},
                        status: setting.status ? "enabled" : "disabled"
                    };
                });

                setSettingsData(formattedData);
            }
        } catch (error) {
            toast("error", "Failed to fetch SMS settings");
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (providerKey: string, fieldKey: string, value: string) => {
        setSettingsData(prev => ({
            ...prev,
            [providerKey]: {
                ...prev[providerKey],
                config: {
                    ...(prev[providerKey]?.config || {}),
                    [fieldKey]: value
                },
                status: prev[providerKey]?.status || "disabled"
            }
        }));
    };

    const handleStatusChange = (providerKey: string, status: string) => {
        setSettingsData(prev => ({
            ...prev,
            [providerKey]: {
                ...prev[providerKey],
                config: prev[providerKey]?.config || {},
                status: status
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
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

    const currentActiveConfig = gatewaysConfig[activeTab];
    const providerKey = currentActiveConfig.providerName;
    const currentData = settingsData[providerKey] || { config: {}, status: "disabled" };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">SMS Setting</h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
                {/* Scrollable Tabs */}
                <div className="border-b border-gray-100 bg-white">
                    <div className="flex overflow-x-auto no-scrollbar">
                        {gateways.map((gateway) => (
                            <button
                                key={gateway}
                                onClick={() => setActiveTab(gateway)}
                                className={cn(
                                    "px-5 py-3 text-[11px] font-bold uppercase transition-all whitespace-nowrap border-b-2",
                                    activeTab === gateway
                                        ? "text-indigo-600 border-indigo-500 bg-indigo-50/10"
                                        : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"
                                )}
                            >
                                {gateway}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start animate-in fade-in duration-300">

                        {/* Left: Configuration Form */}
                        <div className="space-y-6">
                            {currentActiveConfig.fields.map((field) => (
                                <div key={field.key} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">
                                        {field.label} <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="md:col-span-2">
                                        <Input
                                            type={field.type}
                                            value={currentData.config[field.key] || ""}
                                            onChange={(e) => handleFieldChange(providerKey, field.key, e.target.value)}
                                            placeholder={`Enter ${field.label.toLowerCase()}`}
                                            className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
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
                        </div>

                        {/* Right: Brand Card */}
                        <div className="flex flex-col items-center justify-center p-8 space-y-6">
                            {activeTab === "Clickatell Sms Gateway" ? (
                                <>
                                    <div className="p-6 bg-white rounded-xl flex items-center justify-center">
                                        <div className="flex items-center gap-2 text-3xl font-bold tracking-tighter text-gray-700">
                                            <div className="h-8 w-8 rounded-full border-[3px] border-emerald-400 flex items-center justify-center">
                                                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                            </div>
                                            <span className="text-gray-600">Clickatell</span>
                                        </div>
                                    </div>
                                    <a
                                        href="https://www.clickatell.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-indigo-500 hover:text-indigo-600 hover:underline flex items-center gap-1.5 font-medium transition-colors"
                                    >
                                        https://www.clickatell.com
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
                </div>

                {/* Footer Save Action */}
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
