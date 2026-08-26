"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    Loader2,
    CreditCard,
    Banknote,
    Copy,
    Check,
    ExternalLink,
    Zap,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Globe,
    HelpCircle
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast as sonnerToast } from "sonner";

const gateways = [
    "Offline", "UddoktaPay", "Paypal", "Stripe", "PayU",
    "Razorpay", "Paytm", "Flutter Wave",
    "iPay Africa", "JazzCash", "SSLCommerz",
    "Mollie", "Payfast"
];

const specificConfigs: Record<string, { fields: { key: string, label: string, type: string, placeholder?: string, help?: string, options?: { value: string, label: string }[] }[] }> = {
    "Offline": {
        fields: [
            { key: "name", label: "Payment Method Name", type: "text", placeholder: "Offline Payment / Cash Deposit" },
            { key: "description", label: "Description", type: "textarea", placeholder: "Pay at counter or deposit to our bank account" },
            { key: "instructions", label: "Payment Instructions", type: "textarea", placeholder: "Bank Name: XYZ, Account: 123456789" }
        ]
    },
    "UddoktaPay": {
        fields: [
            {
                key: "api_key",
                label: "UddoktaPay API Key",
                type: "password",
                placeholder: "Enter your UddoktaPay API Key (e.g. 9845xxxx-xxxx-xxxx)",
                help: "Found in your UddoktaPay Merchant Panel -> API Credentials"
            },
            {
                key: "api_url",
                label: "API Endpoint URL",
                type: "text",
                placeholder: "https://sandbox.uddoktapay.com/api/checkout-v2",
                help: "Sandbox: https://sandbox.uddoktapay.com/api/checkout-v2 | Live: https://pay.uddoktapay.com/api/checkout-v2 or your custom domain"
            },
            {
                key: "mode",
                label: "Environment Mode",
                type: "radio",
                options: [
                    { value: "sandbox", label: "Sandbox (Testing)" },
                    { value: "live", label: "Live (Production)" }
                ]
            },
            {
                key: "fee_type",
                label: "Processing Fees Type",
                type: "radio",
                options: [
                    { value: "none", label: "None (0%)" },
                    { value: "percentage", label: "Percentage (%)" },
                    { value: "fix", label: "Fixed Amount" }
                ]
            },
            {
                key: "fee_amount",
                label: "Processing Fee Value",
                type: "text",
                placeholder: "e.g. 2.5 for 2.5% or 10 for 10 currency units"
            }
        ]
    },
    "Paypal": {
        fields: [
            { key: "username", label: "Paypal Username", type: "text" },
            { key: "password", label: "Paypal Password", type: "password" },
            { key: "signature", label: "Paypal Signature", type: "text" },
            { key: "fee_type", label: "Processing Fees Type", type: "radio", options: [{ value: "none", label: "None" }, { value: "percentage", label: "Percentage (%)" }, { value: "fix", label: "Fix Amount ($)" }] },
            { key: "fee_amount", label: "Percentage/Fix Amount", type: "text" }
        ]
    },
    "Stripe": {
        fields: [
            { key: "publishable_key", label: "Publishable Key", type: "text" },
            { key: "secret_key", label: "Secret Key", type: "password" }
        ]
    },
    "Razorpay": {
        fields: [
            { key: "key_id", label: "Key ID", type: "text" },
            { key: "key_secret", label: "Key Secret", type: "password" }
        ]
    },
    "SSLCommerz": {
        fields: [
            { key: "store_id", label: "Store ID", type: "text" },
            { key: "store_password", label: "Store Password", type: "password" },
            { key: "mode", label: "Environment Mode", type: "radio", options: [{ value: "sandbox", label: "Sandbox" }, { value: "live", label: "Live" }] }
        ]
    }
};

function getProviderConfig(gateway: string) {
    const providerName = gateway.toLowerCase().replace(/ /g, '_');
    if (specificConfigs[gateway]) {
        return { providerName, ...specificConfigs[gateway] };
    }
    return {
        providerName,
        fields: [
            { key: "api_key", label: "API Key", type: "text" },
            { key: "api_secret", label: "API Secret", type: "password" },
        ]
    };
}

function FormSkeleton() {
    return (
        <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <Skeleton className="h-3 w-28 rounded ml-auto" />
                    <div className="md:col-span-2"><Skeleton className="h-8 w-full rounded" /></div>
                </div>
            ))}
        </div>
    );
}

export default function PaymentMethodsPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("Offline");
    const [loading, setLoading] = useState(true);
    const [savingTab, setSavingTab] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [copiedWebhook, setCopiedWebhook] = useState(false);
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

    const [settingsData, setSettingsData] = useState<Record<string, { config: any, status: boolean }>>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    // Clear test result when switching tabs
    useEffect(() => {
        setTestResult(null);
    }, [activeTab]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('system-setting/payment-settings');
            if (res.data?.status === 'success') {
                const fetchedSettings = res.data.data;
                const formattedData: any = {};

                fetchedSettings.forEach((setting: any) => {
                    formattedData[setting.provider] = {
                        config: setting.config || {},
                        status: setting.status
                    };
                });

                // Default uddoktapay config if not present
                if (!formattedData.uddoktapay) {
                    formattedData.uddoktapay = {
                        config: {
                            api_key: "",
                            api_url: "https://sandbox.uddoktapay.com/api/checkout-v2",
                            mode: "sandbox",
                            fee_type: "none",
                            fee_amount: "0"
                        },
                        status: false
                    };
                }

                setSettingsData(formattedData);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            sonnerToast.error("Failed to load payment settings");
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (providerKey: string, fieldKey: string, value: string) => {
        setSettingsData(prev => ({
            ...prev,
            [providerKey]: {
                ...prev[providerKey],
                config: { ...(prev[providerKey]?.config || {}), [fieldKey]: value },
                status: prev[providerKey]?.status ?? false
            }
        }));
    };

    const handleSaveTab = async () => {
        setSavingTab(true);
        try {
            const activeConfig = getProviderConfig(activeTab);
            const providerKey = activeConfig.providerName;
            const currentData = settingsData[providerKey] || { config: {}, status: false };

            const payload = { provider: providerKey, config: currentData.config, status: currentData.status ?? false };
            const res = await api.post('system-setting/payment-settings', payload);
            if (res.data?.status === 'success') {
                sonnerToast.success(`${activeTab} configuration saved successfully`);
                toast("success", `${activeTab} ${t("configuration_saved")}`);
                
                setSettingsData(prev => ({
                    ...prev,
                    [providerKey]: {
                        config: currentData.config,
                        status: currentData.status ?? false
                    }
                }));
            }
        } catch (error) {
            sonnerToast.error(`Failed to save ${activeTab} configuration`);
            toast("error", `${t("failed_to_save")} ${activeTab} ${t("configuration")}`);
        } finally {
            setSavingTab(false);
        }
    };

    const handleToggleGateway = async (gatewayName: string) => {
        const providerName = gatewayName.toLowerCase().replace(/ /g, '_');
        const currentData = settingsData[providerName];

        if (!currentData) {
            sonnerToast.error(`Please configure and save ${gatewayName} before enabling it.`);
            return;
        }

        try {
            const res = await api.post(`system-setting/payment-settings/${providerName}/toggle`);
            if (res.data?.status === 'success') {
                const newStatus = res.data.data.status;
                setSettingsData(prev => ({
                    ...prev,
                    [providerName]: {
                        ...prev[providerName],
                        status: newStatus
                    }
                }));
                if (newStatus) {
                    sonnerToast.success(`${gatewayName} activated`);
                } else {
                    sonnerToast.info(`${gatewayName} deactivated`);
                }
            }
        } catch (error) {
            sonnerToast.error(`Failed to toggle ${gatewayName}`);
        }
    };

    const handleTestUddoktaPayConnection = async () => {
        const currentData = settingsData.uddoktapay?.config || {};
        if (!currentData.api_key) {
            sonnerToast.error("Please enter an API Key first before testing");
            return;
        }

        setTestingConnection(true);
        setTestResult(null);

        try {
            const res = await api.post('payment/uddoktapay/test-connection', {
                api_key: currentData.api_key,
                api_url: currentData.api_url || "https://sandbox.uddoktapay.com/api/checkout-v2"
            });

            if (res.data?.status === 'success') {
                setTestResult({ success: true, message: res.data.message || "Connection verified successfully!" });
                sonnerToast.success("UddoktaPay Connection Verified!");
            } else {
                setTestResult({ success: false, message: res.data?.message || "Connection test failed." });
                sonnerToast.error(res.data?.message || "Connection test failed");
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || "Unable to reach UddoktaPay endpoint";
            setTestResult({ success: false, message: errorMsg });
            sonnerToast.error(errorMsg);
        } finally {
            setTestingConnection(false);
        }
    };

    const getWebhookUrl = () => {
        if (typeof window !== "undefined") {
            const origin = window.location.origin;
            return `${origin}/api/v1/payment/uddoktapay/webhook`;
        }
        return "https://your-school-domain.com/api/v1/payment/uddoktapay/webhook";
    };

    const handleCopyWebhook = () => {
        navigator.clipboard.writeText(getWebhookUrl());
        setCopiedWebhook(true);
        sonnerToast.success("Webhook URL copied to clipboard");
        setTimeout(() => setCopiedWebhook(false), 2500);
    };

    const currentActiveConfig = getProviderConfig(activeTab);
    const providerKey = currentActiveConfig.providerName;
    const currentData = settingsData[providerKey] || { config: {}, status: true };

    return (
        <div className="p-2 sm:p-3 md:p-4 space-y-4 sm:space-y-6 bg-gray-50/10 min-h-screen font-sans flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Left Column: Configuration Area */}
            <div className="flex-1 min-w-0 space-y-4">
                <Card className="pt-0 overflow-hidden border border-gray-200/75 shadow-sm rounded-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                            </span>
                            <div>
                                <h1 className="text-[13px] sm:text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("payment_methods")}</h1>
                                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 sm:mt-1">
                                    Configure gateways, credentials, webhook IPN and processing fees
                                </p>
                            </div>
                        </div>

                        {activeTab === "UddoktaPay" && (
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    v2 API Ready
                                </span>
                            </div>
                        )}
                    </div>
                    <CardContent className="p-0 min-h-[400px] sm:min-h-[500px]">
                        {/* Top Tabs - Select on mobile, scrollable tabs on md+ */}
                        <div className="border-b border-gray-100 bg-white">
                            <div className="sm:hidden px-3 py-2">
                                <Select value={activeTab} onValueChange={setActiveTab}>
                                    <SelectTrigger className="h-9 text-[12px] border-gray-200 shadow-none rounded">
                                        <SelectValue placeholder="Select gateway" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {gateways.map((gateway) => (
                                            <SelectItem key={gateway} value={gateway} className="text-[12px]">
                                                {gateway}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="hidden sm:block overflow-x-auto">
                                <div className="flex pb-1 pt-1 px-1">
                                    {gateways.map((gateway) => (
                                        <button
                                            key={gateway}
                                            onClick={() => setActiveTab(gateway)}
                                            className={cn(
                                                "px-3 xl:px-4 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-bold uppercase transition-all whitespace-nowrap border-b-2 mx-0.5 sm:mx-1 flex items-center gap-1.5",
                                                activeTab === gateway
                                                    ? "text-indigo-600 border-indigo-500 bg-indigo-50/10"
                                                    : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"
                                            )}
                                        >
                                            {gateway === "Offline" && <Banknote className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                                            {gateway === "UddoktaPay" && <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500" />}
                                            {gateway}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Configuration Form */}
                        <div className="p-4 sm:p-5 md:p-6 space-y-6">
                            {loading ? (
                                <FormSkeleton />
                            ) : (
                                <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 animate-in fade-in duration-300">
                                    <div className="flex-1 min-w-0 space-y-4 sm:space-y-5">
                                        
                                        {/* UddoktaPay Banner & Quick Presets */}
                                        {activeTab === "UddoktaPay" && (
                                            <div className="p-3.5 bg-gradient-to-r from-amber-50/70 to-indigo-50/60 border border-amber-200/50 rounded-lg space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-gray-800 text-xs font-semibold">
                                                        <Zap className="h-4 w-4 text-amber-600" />
                                                        <span>UddoktaPay Automated Payment Gateway (bKash, Nagad, Rocket, Cards)</span>
                                                    </div>
                                                    <a
                                                        href="https://uddoktapay.readme.io/reference/overview"
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                                    >
                                                        Documentation <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                                <p className="text-[11px] text-gray-600 leading-relaxed">
                                                    Seamless integration with automated instant checkout, webhooks & auto fee settlement for Bangladesh & global payment methods.
                                                </p>
                                                <div className="pt-1 flex flex-wrap items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Quick Endpoint Presets:</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleFieldChange("uddoktapay", "api_url", "https://pay.uddoktapay.com/api/checkout-v2");
                                                            handleFieldChange("uddoktapay", "mode", "live");
                                                        }}
                                                        className="px-2.5 py-1 text-[10px] font-bold bg-white border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 rounded-md text-gray-700 shadow-2xs transition-colors cursor-pointer"
                                                    >
                                                        Live (pay.uddoktapay.com)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleFieldChange("uddoktapay", "api_url", "https://sandbox.uddoktapay.com/api/checkout-v2");
                                                            handleFieldChange("uddoktapay", "mode", "sandbox");
                                                            if (!currentData.config?.api_key || currentData.config.api_key.trim() === "") {
                                                                handleFieldChange("uddoktapay", "api_key", "982d381360a69d419689740d9f2e26ce36fb7a50");
                                                            }
                                                        }}
                                                        className="px-2.5 py-1 text-[10px] font-bold bg-white border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 rounded-md text-gray-700 shadow-2xs transition-colors cursor-pointer"
                                                    >
                                                        Sandbox (Test Mode)
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
                                                    <strong>Note:</strong> In live mode, if you have a branded UddoktaPay merchant panel, enter your panel API URL (e.g. <code>https://yourpanel.uddoktapay.com/api/checkout-v2</code>) and your Live API Key from your merchant dashboard.
                                                </p>
                                            </div>
                                        )}

                                        {currentActiveConfig.fields.map((field) => {
                                            if (field.type === 'radio') {
                                                return (
                                                    <div key={field.key} className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 pt-1 sm:pt-2">
                                                        <Label className="text-[11px] font-bold text-gray-600 sm:text-right uppercase mt-0 sm:mt-1">
                                                            {field.label}
                                                        </Label>
                                                        <div className="sm:col-span-2 space-y-2">
                                                            <RadioGroup
                                                                value={currentData.config[field.key] || (field.options?.[0]?.value || "none")}
                                                                onValueChange={(val) => handleFieldChange(providerKey, field.key, val)}
                                                                className="flex flex-wrap gap-4"
                                                            >
                                                                {field.options?.map(opt => (
                                                                    <div key={opt.value} className="flex items-center space-x-2">
                                                                        <RadioGroupItem value={opt.value} id={`r-${field.key}-${opt.value}`} className="text-indigo-600 border-gray-300" />
                                                                        <Label htmlFor={`r-${field.key}-${opt.value}`} className="text-[11px] text-gray-700 cursor-pointer">{opt.label}</Label>
                                                                    </div>
                                                                ))}
                                                            </RadioGroup>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (field.type === 'textarea') {
                                                return (
                                                    <div key={field.key} className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-3 sm:items-start sm:gap-4">
                                                        <Label className="text-[11px] font-bold text-gray-600 sm:text-right uppercase mt-0 sm:mt-2">
                                                            {field.label}
                                                        </Label>
                                                        <div className="sm:col-span-2 relative">
                                                            <Textarea
                                                                value={currentData.config[field.key] || ""}
                                                                onChange={(e) => handleFieldChange(providerKey, field.key, e.target.value)}
                                                                className="min-h-[70px] sm:min-h-[80px] text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            const isPasswordField = field.type === 'password';
                                            const isRevealed = showPassword[field.key] || false;

                                            return (
                                                <div key={field.key} className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-3 sm:items-center sm:gap-4">
                                                    <div className="sm:text-right">
                                                        <Label className="text-[11px] font-bold text-gray-600 uppercase">
                                                            {field.label} <span className="text-red-500">*</span>
                                                        </Label>
                                                    </div>
                                                    <div className="sm:col-span-2 relative">
                                                        <div className="relative flex items-center">
                                                            <Input
                                                                type={isPasswordField && !isRevealed ? "password" : "text"}
                                                                value={currentData.config[field.key] || ""}
                                                                onChange={(e) => handleFieldChange(providerKey, field.key, e.target.value)}
                                                                className="h-8 sm:h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded pr-10 font-mono"
                                                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                                            />
                                                            {isPasswordField && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowPassword(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                                                                    className="absolute right-2.5 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                                                    title={isRevealed ? "Hide key" : "Show key"}
                                                                >
                                                                    {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                                </button>
                                                            )}
                                                        </div>
                                                        {field.help && (
                                                            <p className="text-[10px] text-gray-400 mt-1">{field.help}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* UddoktaPay Webhook (IPN) Section */}
                                        {activeTab === "UddoktaPay" && (
                                            <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
                                                <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-3 sm:items-start sm:gap-4">
                                                    <div className="sm:text-right">
                                                        <Label className="text-[11px] font-bold text-gray-600 uppercase">
                                                            IPN / Webhook URL
                                                        </Label>
                                                    </div>
                                                    <div className="sm:col-span-2 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                readOnly
                                                                value={getWebhookUrl()}
                                                                className="h-8 sm:h-9 text-[11px] bg-gray-50/80 text-gray-700 font-mono border-gray-200 rounded"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={handleCopyWebhook}
                                                                className="h-8 sm:h-9 px-3 text-xs shrink-0 border-gray-200 hover:bg-indigo-50 hover:text-indigo-600"
                                                            >
                                                                {copiedWebhook ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                                                                <span className="ml-1 text-[11px]">{copiedWebhook ? "Copied" : "Copy"}</span>
                                                            </Button>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500">
                                                            Set this URL in your UddoktaPay merchant panel under <strong>Webhook Settings</strong> to automatically record completed payments.
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Connection Test Probe Status Banner */}
                                                {testResult && (
                                                    <div className={cn(
                                                        "p-3 rounded-lg flex items-start gap-2.5 text-xs animate-in fade-in duration-200",
                                                        testResult.success
                                                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                            : "bg-red-50 text-red-800 border border-red-200"
                                                    )}>
                                                        {testResult.success ? (
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                                        ) : (
                                                            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                                                        )}
                                                        <div>
                                                            <p className="font-semibold text-[11px]">{testResult.success ? "Connection Successful" : "Connection Failed"}</p>
                                                            <p className="text-[11px] mt-0.5 opacity-90">{testResult.message}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="hidden xl:flex flex-col items-center justify-center space-y-4 xl:border-l border-gray-100 xl:pl-8 min-w-[200px] shrink-0">
                                        <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center shadow-xs">
                                            {activeTab === "Offline" ? (
                                                <Banknote className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-400" />
                                            ) : activeTab === "UddoktaPay" ? (
                                                <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500" />
                                            ) : (
                                                <CreditCard className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-400" />
                                            )}
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                                                {activeTab}
                                            </p>
                                            <span className={cn(
                                                "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                currentData.status ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                                            )}>
                                                {currentData.status ? "Enabled" : "Disabled"}
                                            </span>
                                        </div>

                                        {activeTab === "UddoktaPay" && (
                                            <div className="w-full pt-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleTestUddoktaPayConnection}
                                                    disabled={testingConnection}
                                                    className="w-full h-8 text-[11px] font-semibold border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                                >
                                                    {testingConnection ? (
                                                        <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> Verifying...</>
                                                    ) : (
                                                        <><Zap className="w-3 h-3 mr-1.5 text-amber-500" /> Test Connection</>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="border-t border-gray-100 p-4 sm:p-5 md:p-6 bg-white flex flex-col sm:flex-row items-center justify-center gap-3">
                            {activeTab === "UddoktaPay" && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleTestUddoktaPayConnection}
                                    disabled={testingConnection}
                                    className="h-9 sm:h-10 px-6 text-[11px] sm:text-xs font-bold uppercase rounded-full border-gray-200 hover:bg-gray-50 w-full sm:w-auto"
                                >
                                    {testingConnection ? (
                                        <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Testing...</>
                                    ) : (
                                        <><Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Test Connection</>
                                    )}
                                </Button>
                            )}

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

            {/* Right Column: Gateway Selection Sidebar */}
            <div className="w-full lg:w-56 xl:w-64 shrink-0">
                <Card className="pt-0 overflow-hidden border border-gray-200/75 shadow-sm rounded-xl">
                    <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[12px] sm:text-[14px] font-bold text-gray-800 tracking-tight leading-none truncate">{t("active_gateways") || "Active Gateways"}</h1>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 truncate">{t("toggle_payment_methods") || "Toggle to enable"}</p>
                        </div>
                    </div>
                    <CardContent className="p-3 sm:p-4">
                        <div className="overflow-y-auto max-h-[40vh] sm:max-h-[50vh] lg:max-h-[60vh] pr-1">
                            <div className="space-y-1.5 sm:space-y-2">
                                {gateways.map((gateway) => {
                                    const providerName = gateway.toLowerCase().replace(/ /g, '_');
                                    const isEnabled = settingsData[providerName]?.status || false;
                                    
                                    return (
                                        <div
                                            key={`sel-${gateway}`}
                                            className={cn(
                                                "flex items-center justify-between group py-1.5 px-2 rounded-md transition-colors border-b border-gray-50 last:border-0",
                                                activeTab === gateway ? "bg-indigo-50/50" : "hover:bg-gray-50"
                                            )}
                                        >
                                            <Label
                                                className="text-[10px] sm:text-[11px] font-medium cursor-pointer transition-colors flex items-center gap-1 sm:gap-1.5 truncate text-gray-600 group-hover:text-indigo-600"
                                                onClick={() => setActiveTab(gateway)}
                                            >
                                                {gateway === "Offline" && <Banknote className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />}
                                                {gateway === "UddoktaPay" && <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500 shrink-0" />}
                                                <span className="truncate">{gateway}</span>
                                            </Label>
                                            <Switch 
                                                checked={isEnabled} 
                                                onCheckedChange={() => handleToggleGateway(gateway)} 
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
