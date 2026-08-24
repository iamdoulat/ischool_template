"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Loader2, Mail, Send, RefreshCw, Server, Sliders, Clock, Save } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { toast as sonnerToast } from "sonner";
import { QueueMonitorCard } from "@/components/queue/queue-monitor-card";

interface GatewayConfig {
    name: string;
    mail_mailer: string;
    mail_host: string;
    mail_port: string;
    mail_username: string;
    mail_password: string;
    mail_encryption: string;
    mail_from_address: string;
    mail_from_name: string;
    email_limit: number;
}

interface GatewayItem {
    gateway: string;
    name: string;
    config: GatewayConfig;
    status: boolean;
    sent_count: number;
}

const defaultGatewaysList = [
    { gateway: "smtp_1", name: "SMTP 1 (Primary)" },
    { gateway: "smtp_2", name: "SMTP 2 (Secondary)" },
    { gateway: "sendgrid", name: "SendGrid SMTP" },
    { gateway: "mailgun", name: "Mailgun SMTP" },
    { gateway: "ses", name: "Amazon SES SMTP" },
    { gateway: "postmark", name: "Postmark SMTP" },
    { gateway: "custom_smtp", name: "Custom SMTP" },
];

function FormSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                    <Skeleton className="h-4 w-28 rounded md:col-span-1 ml-auto" />
                    <div className="md:col-span-3"><Skeleton className="h-9 w-full rounded" /></div>
                </div>
            ))}
        </div>
    );
}

export default function EmailSettingPage() {
    const { t } = useTranslation();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<string>("smtp_1");
    const [loading, setLoading] = useState<boolean>(true);
    const [savingTab, setSavingTab] = useState<boolean>(false);
    const [testingEmail, setTestingEmail] = useState<boolean>(false);
    const [testEmail, setTestEmail] = useState<string>("");

    const [gatewaysData, setGatewaysData] = useState<Record<string, GatewayItem>>({});
    const [roundRobinEnabled, setRoundRobinEnabled] = useState<boolean>(false);
    const [intervalConfig, setIntervalConfig] = useState<{ mode: string; min: number; max: number; fixed: number }>({
        mode: "random",
        min: 1,
        max: 10,
        fixed: 1,
    });
    const [savingInterval, setSavingInterval] = useState<boolean>(false);

    useEffect(() => {
        fetchEmailGateways();
    }, []);

    const fetchEmailGateways = async () => {
        setLoading(true);
        try {
            const res = await api.get("/system-setting/email-gateways");
            if (res.data?.status === "success") {
                const fetchedGateways: GatewayItem[] = res.data.data || [];
                const formatted: Record<string, GatewayItem> = {};

                fetchedGateways.forEach((item) => {
                    if (item.gateway !== "round_robin_setting" && !item.gateway.endsWith('_queue_interval')) {
                        formatted[item.gateway] = {
                            gateway: item.gateway,
                            name: item.name || item.gateway,
                            config: {
                                name: item.name || item.gateway,
                                mail_mailer: item.config?.mail_mailer || "smtp",
                                mail_host: item.config?.mail_host || "",
                                mail_port: item.config?.mail_port || "587",
                                mail_username: item.config?.mail_username || "",
                                mail_password: item.config?.mail_password || "",
                                mail_encryption: item.config?.mail_encryption || "tls",
                                mail_from_address: item.config?.mail_from_address || "",
                                mail_from_name: item.config?.mail_from_name || "",
                                email_limit: item.config?.email_limit ? Number(item.config.email_limit) : 100,
                            },
                            status: Boolean(item.status),
                            sent_count: item.sent_count || 0,
                        };
                    }
                });

                // Ensure all default gateways exist in state
                defaultGatewaysList.forEach((def) => {
                    if (!formatted[def.gateway]) {
                        formatted[def.gateway] = {
                            gateway: def.gateway,
                            name: def.name,
                            config: {
                                name: def.name,
                                mail_mailer: "smtp",
                                mail_host: "",
                                mail_port: "587",
                                mail_username: "",
                                mail_password: "",
                                mail_encryption: "tls",
                                mail_from_address: "",
                                mail_from_name: "",
                                email_limit: 100,
                            },
                            status: def.gateway === "smtp_1",
                            sent_count: 0,
                        };
                    }
                });

                setGatewaysData(formatted);
                setRoundRobinEnabled(Boolean(res.data.round_robin?.enabled));

                if (res.data.email_interval) {
                    setIntervalConfig({
                        mode: res.data.email_interval.mode || "random",
                        min: Number(res.data.email_interval.min) || 1,
                        max: Number(res.data.email_interval.max) || 10,
                        fixed: Number(res.data.email_interval.fixed) || 1,
                    });
                }
            }
        } catch (error) {
            console.error("Failed to fetch email gateways:", error);
            sonnerToast.error("Failed to load email gateways");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveInterval = async () => {
        setSavingInterval(true);
        try {
            const payload = {
                mode: intervalConfig.mode || "random",
                min: Number(intervalConfig.min) || 1,
                max: Number(intervalConfig.max) || 10,
                fixed: Number(intervalConfig.fixed) || 1,
            };
            const res = await api.post('/system-setting/email-gateways/interval', payload);
            if (res.data?.status === 'success') {
                sonnerToast.success(res.data.message || "Email interval settings saved successfully");
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

    const currentItem = gatewaysData[activeTab] || {
        gateway: activeTab,
        name: defaultGatewaysList.find(g => g.gateway === activeTab)?.name || activeTab,
        config: {
            name: defaultGatewaysList.find(g => g.gateway === activeTab)?.name || activeTab,
            mail_mailer: "smtp",
            mail_host: "",
            mail_port: "587",
            mail_username: "",
            mail_password: "",
            mail_encryption: "tls",
            mail_from_address: "",
            mail_from_name: "",
            email_limit: 100,
        },
        status: false,
        sent_count: 0,
    };

    const handleFieldChange = (field: keyof GatewayConfig, value: string | number | boolean) => {
        setGatewaysData(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                config: {
                    ...(prev[activeTab]?.config || currentItem.config),
                    [field]: value,
                }
            }
        }));
    };

    const handleSaveGateway = async () => {
        setSavingTab(true);
        try {
            const payload = {
                gateway: activeTab,
                name: currentItem.config.name || currentItem.name,
                config: currentItem.config,
                status: currentItem.status,
            };

            const res = await api.post("/system-setting/email-gateways", payload);
            if (res.data?.status === "success") {
                sonnerToast.success(`${currentItem.name} configuration saved successfully!`);
                toast({
                    title: t("success_title"),
                    description: `${currentItem.name} configuration saved successfully`,
                });
                if (res.data.data) {
                    setGatewaysData(prev => ({
                        ...prev,
                        [activeTab]: {
                            ...prev[activeTab],
                            config: res.data.data.config || {},
                            status: Boolean(res.data.data.status),
                        }
                    }));
                }
            }
        } catch (error: unknown) {
            const errRes = error as { response?: { data?: { message?: string } } };
            sonnerToast.error(`Failed to save ${currentItem.name} configuration`);
            toast({
                variant: "destructive",
                title: t("error"),
                description: errRes.response?.data?.message || `Failed to save ${currentItem.name}`,
            });
        } finally {
            setSavingTab(false);
        }
    };

    const handleToggleGateway = async (gatewayKey: string) => {
        const item = gatewaysData[gatewayKey];
        try {
            const res = await api.post(`/system-setting/email-gateways/${gatewayKey}/toggle`);
            if (res.data?.status === "success") {
                const newStatus = res.data.data.status;
                setGatewaysData(prev => ({
                    ...prev,
                    [gatewayKey]: {
                        ...prev[gatewayKey],
                        status: newStatus
                    }
                }));

                if (newStatus) {
                    sonnerToast.success(`${item.name} activated`);
                } else {
                    sonnerToast.info(`${item.name} deactivated`);
                }
            }
        } catch {
            sonnerToast.error(`Failed to toggle ${item?.name || gatewayKey}`);
        }
    };

    const handleToggleRoundRobin = async () => {
        try {
            const res = await api.post("/system-setting/email-gateways/toggle-round-robin");
            if (res.data?.status === "success") {
                const newStatus = res.data.data.round_robin_enabled;
                setRoundRobinEnabled(newStatus);
                if (newStatus) {
                    sonnerToast.success("Round Robin load balancing activated!");
                } else {
                    sonnerToast.info("Round Robin load balancing deactivated");
                }
            }
        } catch {
            sonnerToast.error("Failed to toggle Round Robin load balancing");
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            sonnerToast.error("Please enter a test email address");
            return;
        }

        setTestingEmail(true);
        try {
            const res = await api.post("/system-setting/email-gateways/test", {
                test_email: testEmail,
                gateway: activeTab,
                config: currentItem.config,
            });

            if (res.data?.status === "Success" || res.data?.status === "success") {
                sonnerToast.success(`Test email sent successfully via ${currentItem.name} to ${testEmail}`);
                toast({
                    title: t("success_title"),
                    description: `Test email sent successfully to ${testEmail}`,
                });
            }
        } catch (error: unknown) {
            const errRes = error as { response?: { data?: { message?: string } } };
            sonnerToast.error(errRes.response?.data?.message || `Failed to send test email via ${currentItem.name}`);
            toast({
                variant: "destructive",
                title: t("error"),
                description: errRes.response?.data?.message || "Failed to send test email",
            });
        } finally {
            setTestingEmail(false);
        }
    };

    const activeCount = Object.values(gatewaysData).filter(g => g.status).length;

    return (
        <div className="p-2 sm:p-3 md:p-4 space-y-4 sm:space-y-6 bg-gray-50/10 min-h-screen font-sans flex flex-col lg:flex-row gap-4 sm:gap-6">
            
            {/* Left Column: Main Gateway Configuration Area */}
            <div className="flex-1 min-w-0 space-y-4">
                <Card className="pt-0 overflow-hidden">
                    {/* Main Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                            </span>
                            <div>
                                <h1 className="text-[13px] sm:text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                                    {t("email_setting") || "Email Settings & Multiple SMTP Gateways"}
                                </h1>
                                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 sm:mt-1">
                                    {t("configure_smtp_and_outgoing_mail_settings") || "Configure SMTP gateways & enable Round Robin load balancing"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-0 min-h-[400px] sm:min-h-[500px]">
                        {/* Gateway Tabs Header */}
                        <div className="border-b border-gray-100 bg-white">
                            {/* Mobile Select */}
                            <div className="sm:hidden px-3 py-2">
                                <Select value={activeTab} onValueChange={setActiveTab}>
                                    <SelectTrigger className="h-9 text-[12px] border-gray-200 shadow-none rounded">
                                        <SelectValue placeholder="Select Email Gateway" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {defaultGatewaysList.map((gt) => (
                                            <SelectItem key={gt.gateway} value={gt.gateway} className="text-[12px]">
                                                {gatewaysData[gt.gateway]?.name || gt.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Desktop Scrollable Horizontal Tabs */}
                            <div className="hidden sm:block overflow-x-auto">
                                <div className="flex pb-1 pt-1 px-1">
                                    {defaultGatewaysList.map((gt) => {
                                        const isTabActive = activeTab === gt.gateway;
                                        const isEnabled = gatewaysData[gt.gateway]?.status || false;

                                        return (
                                            <button
                                                key={gt.gateway}
                                                onClick={() => setActiveTab(gt.gateway)}
                                                className={cn(
                                                    "px-3 xl:px-4 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-bold uppercase transition-all whitespace-nowrap border-b-2 mx-0.5 sm:mx-1 flex items-center gap-1.5",
                                                    isTabActive
                                                        ? "text-indigo-600 border-indigo-500 bg-indigo-50/10"
                                                        : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                <Server className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                <span>{gatewaysData[gt.gateway]?.name || gt.name}</span>
                                                {isEnabled && (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Configuration Form */}
                        <div className="p-4 sm:p-5 md:p-6">
                            {loading ? (
                                <FormSkeleton />
                            ) : (
                                <div className="flex flex-col xl:flex-row gap-6 xl:gap-12 animate-in fade-in duration-300">
                                    <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">

                                        {/* Gateway Name Field */}
                                        <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
                                            <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">
                                                Gateway Display Name <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="sm:col-span-3">
                                                <Input
                                                    value={currentItem.config.name}
                                                    onChange={(e) => handleFieldChange("name", e.target.value)}
                                                    className="h-8 sm:h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                                    placeholder="e.g. SMTP 1 (Primary)"
                                                />
                                            </div>
                                        </div>

                                        {/* Mail Engine */}
                                        <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
                                            <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">
                                                {t("email_engine") || "Engine"} <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="sm:col-span-3">
                                                <Select
                                                    value={currentItem.config.mail_mailer || "smtp"}
                                                    onValueChange={(val) => handleFieldChange("mail_mailer", val)}
                                                >
                                                    <SelectTrigger className="h-8 sm:h-9 text-[11px] border-gray-200 shadow-none rounded text-gray-700">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="smtp">SMTP</SelectItem>
                                                        <SelectItem value="sendmail">SendMail</SelectItem>
                                                        <SelectItem value="phpmail">PHPMail</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Sender Email (From Address) */}
                                        <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
                                            <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">
                                                {t("email") || "Sender Email"} <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="sm:col-span-3">
                                                <Input
                                                    type="email"
                                                    value={currentItem.config.mail_from_address}
                                                    onChange={(e) => handleFieldChange("mail_from_address", e.target.value)}
                                                    className="h-8 sm:h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                                    placeholder="noreply@yourdomain.com"
                                                />
                                            </div>
                                        </div>

                                        {/* Sender Name */}
                                        <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
                                            <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">
                                                {t("from_name") || "From Name"} <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="sm:col-span-3">
                                                <Input
                                                    value={currentItem.config.mail_from_name}
                                                    onChange={(e) => handleFieldChange("mail_from_name", e.target.value)}
                                                    className="h-8 sm:h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                                    placeholder="iSchool School System"
                                                />
                                            </div>
                                        </div>

                                        {/* SMTP Server Host */}
                                        <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
                                            <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">
                                                {t("smtp_server") || "SMTP Server Host"} <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="sm:col-span-3">
                                                <Input
                                                    value={currentItem.config.mail_host}
                                                    onChange={(e) => handleFieldChange("mail_host", e.target.value)}
                                                    className="h-8 sm:h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                                    placeholder="smtp.gmail.com or mail.yourdomain.com"
                                                />
                                            </div>
                                        </div>

                                        {/* SMTP Port */}
                                        <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
                                            <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">
                                                {t("smtp_port") || "SMTP Port"} <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="sm:col-span-3">
                                                <Input
                                                    value={currentItem.config.mail_port}
                                                    onChange={(e) => handleFieldChange("mail_port", e.target.value)}
                                                    className="h-8 sm:h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full sm:w-40"
                                                    placeholder="587 / 465 / 25"
                                                />
                                            </div>
                                        </div>

                                        {/* SMTP Username */}
                                        <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
                                            <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">
                                                {t("smtp_username") || "SMTP Username"} <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="sm:col-span-3">
                                                <Input
                                                    value={currentItem.config.mail_username}
                                                    onChange={(e) => handleFieldChange("mail_username", e.target.value)}
                                                    className="h-8 sm:h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                                    placeholder="username@domain.com or API Key"
                                                />
                                            </div>
                                        </div>

                                        {/* SMTP Password */}
                                        <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
                                            <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">
                                                {t("smtp_password") || "SMTP Password"} <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="sm:col-span-3">
                                                <Input
                                                    type="password"
                                                    value={currentItem.config.mail_password}
                                                    onChange={(e) => handleFieldChange("mail_password", e.target.value)}
                                                    className="h-8 sm:h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                                    placeholder="••••••••••••"
                                                />
                                            </div>
                                        </div>

                                        {/* SMTP Encryption */}
                                        <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-4 sm:items-center sm:gap-4">
                                            <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">
                                                {t("smtp_security") || "Encryption"} <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="sm:col-span-3">
                                                <Select
                                                    value={currentItem.config.mail_encryption || "tls"}
                                                    onValueChange={(val) => handleFieldChange("mail_encryption", val)}
                                                >
                                                    <SelectTrigger className="h-8 sm:h-9 text-[11px] border-gray-200 shadow-none rounded text-gray-700">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="tls">TLS (Port 587 / 2525)</SelectItem>
                                                        <SelectItem value="ssl">SSL (Port 465)</SelectItem>
                                                        <SelectItem value="none">None (Plain text)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Round Robin Send Limit per Batch */}
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
                                                    value={currentItem.config.email_limit || 100}
                                                    onChange={(e) => handleFieldChange("email_limit", Math.max(1, Number(e.target.value)))}
                                                    className="h-8 sm:h-9 text-[11px] border-indigo-200 focus:ring-indigo-500 shadow-none rounded w-full sm:w-44"
                                                    placeholder="100 emails"
                                                />
                                                <p className="text-[10px] text-gray-400">
                                                    Number of emails sent via this gateway before Round Robin rotates to the next active gateway.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Test Email Row */}
                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3">
                                                <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">
                                                    Test Gateway Email
                                                </Label>
                                                <div className="sm:col-span-3 flex gap-2">
                                                    <Input
                                                        type="email"
                                                        placeholder="Enter destination email to send test message"
                                                        value={testEmail}
                                                        onChange={(e) => setTestEmail(e.target.value)}
                                                        className="h-8 sm:h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded flex-1"
                                                    />
                                                    <Button
                                                        onClick={handleTestEmail}
                                                        disabled={testingEmail || !testEmail}
                                                        variant="outline"
                                                        className="h-8 sm:h-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[11px] font-bold uppercase shrink-0 px-3"
                                                    >
                                                        {testingEmail ? (
                                                            <><Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Testing...</>
                                                        ) : (
                                                            <><Send className="h-3 w-3 mr-1.5 text-indigo-600" /> Send Test</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Right Side Gateway Branding Box */}
                                    <div className="hidden xl:flex flex-col items-center justify-center space-y-6 xl:border-l border-gray-100 xl:pl-8 min-h-[220px]">
                                        <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gradient-to-br from-indigo-50 to-orange-50 border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                                            <Server className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-500" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-[11px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">
                                                Configure {currentItem.name}
                                            </p>
                                            <span className={cn(
                                                "text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block",
                                                currentItem.status ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                                            )}>
                                                {currentItem.status ? "● Active Gateway" : "○ Disabled"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Save Action */}
                        <div className="border-t border-gray-50 p-4 sm:p-5 md:p-6 bg-white flex justify-center">
                            <Button
                                onClick={handleSaveGateway}
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
                                Round Robin Balancer
                            </h2>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 truncate">
                                Auto rotate across active gateways
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
                                    {roundRobinEnabled ? `Active (${activeCount} Gateways)` : "Disabled"}
                                </span>
                            </div>
                            <Switch
                                checked={roundRobinEnabled}
                                onCheckedChange={handleToggleRoundRobin}
                                className="data-[state=checked]:bg-indigo-600"
                            />
                        </div>

                        <p className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 p-2.5 rounded border border-gray-100">
                            💡 When enabled, outgoing emails will rotate across all active gateways. Each gateway sends up to its configured limit before looping to the next.
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
                                Sending Interval & Rate Limiter
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
                <QueueMonitorCard channelFilter="email" title="Email Queue & Emergency Stop" />

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
                                {defaultGatewaysList.map((gt) => {
                                    const item = gatewaysData[gt.gateway];
                                    const isEnabled = item?.status || false;
                                    const isSelected = activeTab === gt.gateway;

                                    return (
                                        <div
                                            key={`side-${gt.gateway}`}
                                            className={cn(
                                                "flex items-center justify-between p-2 rounded-lg transition-all border",
                                                isSelected
                                                    ? "bg-indigo-50/40 border-indigo-200"
                                                    : "border-gray-100 hover:bg-gray-50"
                                            )}
                                        >
                                            <div
                                                className="min-w-0 cursor-pointer flex-1 mr-2"
                                                onClick={() => setActiveTab(gt.gateway)}
                                            >
                                                <Label className="text-[11px] font-bold text-gray-700 cursor-pointer block truncate hover:text-indigo-600">
                                                    {item?.name || gt.name}
                                                </Label>
                                                <span className="text-[9px] text-gray-400 block truncate">
                                                    {isEnabled ? `Limit: ${item?.config?.email_limit || 100} / round` : "Inactive"}
                                                </span>
                                            </div>

                                            <Switch
                                                checked={isEnabled}
                                                onCheckedChange={() => handleToggleGateway(gt.gateway)}
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
