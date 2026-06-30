"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Loader2, CreditCard, Banknote } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { toast as sonnerToast } from "sonner";

const gateways = [
    "Offline", "Paypal", "Stripe", "PayU", "InstaMojo", "Paystack",
    "Razorpay", "Paytm", "Pesapal", "Flutter Wave",
    "iPay Africa", "JazzCash", "SSLCommerz",
    "Mollie", "Cashfree", "Payfast", "ToyyibPay", "Twocheckout",
    "Skrill", "Payhere", "Onepay", "DPO Pay", "MOMO Pay"
];

const activeGateways = [...gateways, "None"];

const specificConfigs: Record<string, { fields: { key: string, label: string, type: string, options?: { value: string, label: string }[] }[] }> = {
    "Offline": {
        fields: [
            { key: "name", label: "Payment Method Name", type: "text" },
            { key: "description", label: "Description", type: "textarea" },
            { key: "instructions", label: "Payment Instructions", type: "textarea" }
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
    "Paystack": {
        fields: [
            { key: "public_key", label: "Public Key", type: "text" },
            { key: "secret_key", label: "Secret Key", type: "password" }
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
    const [selectedGateway, setSelectedGateway] = useState("Offline");
    const [loading, setLoading] = useState(true);
    const [savingTab, setSavingTab] = useState(false);
    const [savingSelected, setSavingSelected] = useState(false);

    const [settingsData, setSettingsData] = useState<Record<string, { config: any, status: boolean }>>({});

    useEffect(() => {
        fetchSettings();
    }, []);

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
                    if (setting.provider === 'active_gateway' && setting.config?.selected) {
                        setSelectedGateway(setting.config.selected);
                    }
                });

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
                status: prev[providerKey]?.status ?? true
            }
        }));
    };

    const handleSaveTab = async () => {
        setSavingTab(true);
        try {
            const activeConfig = getProviderConfig(activeTab);
            const providerKey = activeConfig.providerName;
            const currentData = settingsData[providerKey] || { config: {}, status: true };

            const payload = { provider: providerKey, config: currentData.config, status: true };
            const res = await api.post('system-setting/payment-settings', payload);
            if (res.data?.status === 'success') {
                sonnerToast.success(`${activeTab} configuration saved successfully`);
                toast("success", `${activeTab} ${t("configuration_saved")}`);
            }
        } catch (error) {
            sonnerToast.error(`Failed to save ${activeTab} configuration`);
            toast("error", `${t("failed_to_save")} ${activeTab} ${t("configuration")}`);
        } finally {
            setSavingTab(false);
        }
    };

    const handleSaveSelected = async () => {
        setSavingSelected(true);
        try {
            const payload = { provider: 'active_gateway', config: { selected: selectedGateway }, status: true };
            const res = await api.post('system-setting/payment-settings', payload);
            if (res.data?.status === 'success') {
                sonnerToast.success(`Active gateway set to ${selectedGateway}`);
                toast("success", `${t("active_gateway_saved_as")} ${selectedGateway}`);
            }
        } catch (error) {
            sonnerToast.error("Failed to save active gateway");
            toast("error", t("failed_to_save_active_gateway"));
        } finally {
            setSavingSelected(false);
        }
    };

    const currentActiveConfig = getProviderConfig(activeTab);
    const providerKey = currentActiveConfig.providerName;
    const currentData = settingsData[providerKey] || { config: {}, status: true };

    return (
        <div className="p-2 sm:p-3 md:p-4 space-y-4 sm:space-y-6 bg-gray-50/10 min-h-screen font-sans flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Left Column: Configuration Area */}
            <div className="flex-1 min-w-0 space-y-4">
                <Card className="pt-0 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                            </span>
                            <div>
                                <h1 className="text-[13px] sm:text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("payment_methods")}</h1>
                                <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 sm:mt-1">{t("add_a_payment_method")}</p>
                            </div>
                        </div>
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
                                            {gateway}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Configuration Form */}
                        <div className="p-4 sm:p-5 md:p-6">
                            {loading ? (
                                <FormSkeleton />
                            ) : (
                                <div className="flex flex-col xl:flex-row gap-6 xl:gap-12 animate-in fade-in duration-300">
                                    <div className="flex-1 min-w-0 space-y-4 sm:space-y-5 md:space-y-6">
                                        {currentActiveConfig.fields.map((field) => {
                                            if (field.type === 'radio') {
                                                return (
                                                    <div key={field.key} className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 pt-2 sm:pt-4">
                                                        <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase mt-0 sm:mt-1">{field.label}</Label>
                                                        <div className="sm:col-span-2 space-y-2">
                                                            <RadioGroup
                                                                value={currentData.config[field.key] || (field.options?.[0]?.value || "none")}
                                                                onValueChange={(val) => handleFieldChange(providerKey, field.key, val)}
                                                            >
                                                                {field.options?.map(opt => (
                                                                    <div key={opt.value} className="flex items-center space-x-2">
                                                                        <RadioGroupItem value={opt.value} id={`r-${field.key}-${opt.value}`} className="text-indigo-600 border-gray-300" />
                                                                        <Label htmlFor={`r-${field.key}-${opt.value}`} className="text-[11px] text-gray-600">{opt.label}</Label>
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
                                                        <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase mt-0 sm:mt-2">{field.label}</Label>
                                                        <div className="sm:col-span-2 relative">
                                                            <Textarea
                                                                value={currentData.config[field.key] || ""}
                                                                onChange={(e) => handleFieldChange(providerKey, field.key, e.target.value)}
                                                                className="min-h-[70px] sm:min-h-[80px] text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={field.key} className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-3 sm:items-center sm:gap-4">
                                                    <Label className="text-[11px] font-bold text-gray-500 sm:text-right uppercase">{field.label} <span className="text-red-500">*</span></Label>
                                                    <div className="sm:col-span-2 relative">
                                                        <Input
                                                            type={field.type}
                                                            value={currentData.config[field.key] || ""}
                                                            onChange={(e) => handleFieldChange(providerKey, field.key, e.target.value)}
                                                            className="h-8 sm:h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                                            placeholder={`Enter ${field.label.toLowerCase()}`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="hidden xl:flex flex-col items-center justify-center space-y-6 xl:border-l border-gray-100 xl:pl-8 min-h-[200px]">
                                        <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                                            {activeTab === "Offline" ? <Banknote className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-400" /> : <CreditCard className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-400" />}
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-center text-gray-400 font-bold uppercase tracking-wider leading-relaxed">
                                            {t("configure")} {activeTab}
                                        </p>
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

            {/* Right Column: Gateway Selection Sidebar */}
            <div className="w-full lg:w-56 xl:w-64 shrink-0">
                <Card className="pt-0 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[12px] sm:text-[14px] font-bold text-gray-800 tracking-tight leading-none truncate">{t("select_gateway")}</h1>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 truncate">{t("configured_payment_methods")}</p>
                        </div>
                    </div>
                    <CardContent className="p-3 sm:p-4">
                        <div className="overflow-y-auto max-h-[40vh] sm:max-h-[50vh] lg:max-h-[60vh]">
                            <RadioGroup value={selectedGateway} onValueChange={setSelectedGateway} className="space-y-1.5 sm:space-y-2.5">
                                {activeGateways.map((gateway) => (
                                    <div key={`sel-${gateway}`} className="flex items-center space-x-2 sm:space-x-2.5 group py-0.5">
                                        <RadioGroupItem
                                            value={gateway}
                                            id={`sel-${gateway}`}
                                            className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-600 border-gray-300 data-[state=checked]:border-indigo-600"
                                        />
                                        <Label
                                            htmlFor={`sel-${gateway}`}
                                            className={cn(
                                                "text-[10px] sm:text-[11px] font-medium cursor-pointer transition-colors flex items-center gap-1 sm:gap-1.5 truncate",
                                                selectedGateway === gateway ? "text-indigo-600 font-bold" : "text-gray-500 hover:text-gray-700"
                                            )}
                                        >
                                            {gateway === "Offline" && <Banknote className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />}
                                            <span className="truncate">{gateway}</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-50">
                            <Button
                                onClick={handleSaveSelected}
                                disabled={savingSelected}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-4 sm:px-6 h-7 sm:h-8 text-[10px] sm:text-[11px] font-bold uppercase transition-all rounded shadow-md w-full"
                            >
                                {savingSelected ? <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-2 animate-spin" /> : null}
                                {savingSelected ? "..." : t("save_option")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
