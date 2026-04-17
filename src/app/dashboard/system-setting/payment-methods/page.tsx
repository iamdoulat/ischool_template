"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Loader2, CreditCard } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

// List of payment gateways
const gateways = [
    "Paypal", "Stripe", "PayU", "CCAvenue", "InstaMojo", "Paystack",
    "Razorpay", "Paytm", "Midtrans", "Pesapal", "Flutter Wave",
    "iPay Africa", "JazzCash", "Billplz", "SSLCommerz", "Walkingm",
    "Mollie", "Cashfree", "Payfast", "ToyyibPay", "Twocheckout",
    "Skrill", "Payhere", "Onepay", "DPO Pay", "MOMO Pay"
];

const activeGateways = [...gateways, "None"];

const specificConfigs: Record<string, { fields: { key: string, label: string, type: string, options?: { value: string, label: string }[] }[] }> = {
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

    // Default generic config
    return {
        providerName,
        fields: [
            { key: "api_key", label: "API Key", type: "text" },
            { key: "api_secret", label: "API Secret", type: "password" },
        ]
    };
}

export default function PaymentMethodsPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("Paypal");
    const [selectedGateway, setSelectedGateway] = useState("None");
    const [loading, setLoading] = useState(true);
    const [savingTab, setSavingTab] = useState(false);
    const [savingSelected, setSavingSelected] = useState(false);

    // State to hold settings for all providers: { "paypal": { config: {...}, status: "enabled" }, "active_gateway": { config: { selected: "Stripe" } } }
    const [settingsData, setSettingsData] = useState<Record<string, { config: any, status: string }>>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/system-setting/payment-settings');
            if (res.data?.status === 'success') {
                const fetchedSettings = res.data.data;
                const formattedData: any = {};

                fetchedSettings.forEach((setting: any) => {
                    formattedData[setting.provider] = {
                        config: setting.config || {},
                        status: setting.status ? "enabled" : "disabled"
                    };

                    if (setting.provider === 'active_gateway' && setting.config?.selected) {
                        setSelectedGateway(setting.config.selected);
                    }
                });

                setSettingsData(formattedData);
            }
        } catch (error) {
            toast("error", "Failed to fetch Payment settings");
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
                status: prev[providerKey]?.status || "enabled"
            }
        }));
    };

    const handleSaveTab = async () => {
        setSavingTab(true);
        try {
            const activeConfig = getProviderConfig(activeTab);
            const providerKey = activeConfig.providerName;
            const currentData = settingsData[providerKey] || { config: {}, status: 'enabled' };

            const payload = {
                provider: providerKey,
                config: currentData.config,
                status: true
            };

            const res = await api.post('/system-setting/payment-settings', payload);
            if (res.data?.status === 'success') {
                toast("success", `${activeTab} Configuration Saved`);
            }
        } catch (error) {
            toast("error", `Failed to save ${activeTab} configuration`);
        } finally {
            setSavingTab(false);
        }
    };

    const handleSaveSelected = async () => {
        setSavingSelected(true);
        try {
            const payload = {
                provider: 'active_gateway',
                config: { selected: selectedGateway },
                status: true
            };

            const res = await api.post('/system-setting/payment-settings', payload);
            if (res.data?.status === 'success') {
                toast("success", `Active Gateway Saved As ${selectedGateway}`);
            }
        } catch (error) {
            toast("error", `Failed to save Active Gateway`);
        } finally {
            setSavingSelected(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    const currentActiveConfig = getProviderConfig(activeTab);
    const providerKey = currentActiveConfig.providerName;
    const currentData = settingsData[providerKey] || { config: {}, status: "enabled" };

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans flex flex-col md:flex-row gap-6">

            {/* Left Column: Configuration Area (Tabs & Form) */}
            <div className="flex-1 space-y-4">
                <h1 className="text-sm font-medium text-gray-800 tracking-tight">Payment Methods</h1>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col min-h-[600px]">

                    {/* Top Tabs */}
                    <div className="border-b border-gray-100 bg-white sticky top-0 z-10 transition-all">
                        <div className="flex overflow-x-auto no-scrollbar pb-1 pt-1 px-1">
                            {gateways.map((gateway) => (
                                <button
                                    key={gateway}
                                    onClick={() => setActiveTab(gateway)}
                                    className={cn(
                                        "px-4 py-3 text-[11px] font-bold uppercase transition-all whitespace-nowrap border-b-2 mx-1",
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

                    {/* Configuration Form */}
                    <div className="flex-1 p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in fade-in duration-300">

                            {/* Form Fields */}
                            <div className="lg:col-span-2 space-y-6">
                                {currentActiveConfig.fields.map((field) => {
                                    if (field.type === 'radio') {
                                        return (
                                            <div key={field.key} className="grid grid-cols-1 md:grid-cols-3 items-start gap-4 pt-4">
                                                <Label className="text-[11px] font-bold text-gray-500 text-right uppercase mt-1">{field.label}</Label>
                                                <div className="md:col-span-2 space-y-2">
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

                                    return (
                                        <div key={field.key} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                            <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">{field.label} <span className="text-red-500">*</span></Label>
                                            <div className="md:col-span-2 relative">
                                                <Input
                                                    type={field.type}
                                                    value={currentData.config[field.key] || ""}
                                                    onChange={(e) => handleFieldChange(providerKey, field.key, e.target.value)}
                                                    className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Brand Showcase */}
                            <div className="flex flex-col items-center justify-center space-y-6 pt-4 lg:pt-0 lg:border-l border-gray-100 lg:pl-8 min-h-[200px]">
                                <div className="h-24 w-24 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                                    <CreditCard className="h-10 w-10 text-indigo-400" />
                                </div>
                                <p className="text-xs text-center text-gray-400 font-bold uppercase tracking-wider leading-relaxed">
                                    Configure {activeTab}
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* Footer Save Action */}
                    <div className="border-t border-gray-50 p-6 bg-white flex justify-center mt-auto">
                        <Button
                            onClick={handleSaveTab}
                            disabled={savingTab}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-90 text-white px-10 h-10 text-xs font-bold uppercase transition-all rounded-full shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5"
                        >
                            {savingTab ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                            ) : "Save"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Column: Gateway Selection Sidebar */}
            <div className="w-full md:w-64 space-y-2">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 h-full max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar sticky top-4 flex flex-col">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight mb-4 border-b border-gray-50 pb-2">
                        Select Payment Gateway
                    </h2>

                    <div className="flex-1 overflow-y-auto">
                        <RadioGroup value={selectedGateway} onValueChange={setSelectedGateway} className="space-y-3 pb-8">
                            {activeGateways.map((gateway) => (
                                <div key={`sel-${gateway}`} className="flex items-center space-x-2.5 group">
                                    <RadioGroupItem
                                        value={gateway}
                                        id={`sel-${gateway}`}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 data-[state=checked]:border-indigo-600"
                                    />
                                    <Label
                                        htmlFor={`sel-${gateway}`}
                                        className={cn(
                                            "text-[11px] font-medium cursor-pointer transition-colors",
                                            selectedGateway === gateway ? "text-indigo-600 font-bold" : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        {gateway}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-50 flex justify-end">
                        <Button
                            onClick={handleSaveSelected}
                            disabled={savingSelected}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-90 text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md w-full"
                        >
                            {savingSelected ? (
                                <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> ...</>
                            ) : "Save Option"}
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    );
}
