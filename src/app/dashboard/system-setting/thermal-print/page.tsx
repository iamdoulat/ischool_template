"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Printer, Eye, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast as sonnerToast } from "sonner";

export default function ThermalPrintPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const printRef = useRef<HTMLDivElement>(null);

    const [settings, setSettings] = useState({
        status: true,
        school_name: "",
        address: "",
        footer_text: ""
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get("system-setting/thermal-print-settings");
            if (res.data?.status === "success" && res.data.data) {
                setSettings(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
            sonnerToast.error("Failed to load thermal print settings");
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!settings.school_name.trim()) {
            newErrors.school_name = "School name is required";
        } else if (settings.school_name.length > 255) {
            newErrors.school_name = "School name must not exceed 255 characters";
        }

        if (settings.address && settings.address.length > 1000) {
            newErrors.address = "Address must not exceed 1000 characters";
        }

        if (settings.footer_text && settings.footer_text.length > 1000) {
            newErrors.footer_text = "Footer text must not exceed 1000 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            sonnerToast.error("Please fix validation errors");
            return;
        }

        setSaving(true);
        try {
            const res = await api.post("system-setting/thermal-print-settings", settings);
            if (res.data?.status === "success") {
                sonnerToast.success("Thermal print settings saved successfully");
                toast("success", t("settings_saved_successfully"));
                fetchSettings();
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                sonnerToast.error("Validation failed. Please check the form.");
            } else {
                sonnerToast.error("Failed to save settings");
                toast("error", t("failed_to_save"));
            }
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm("Are you sure you want to reset to default settings?")) {
            return;
        }

        setResetting(true);
        try {
            const res = await api.post("system-setting/thermal-print-settings/reset");
            if (res.data?.status === "success") {
                setSettings(res.data.data);
                setErrors({});
                sonnerToast.success("Settings reset to defaults");
            }
        } catch (error) {
            sonnerToast.error("Failed to reset settings");
            console.error(error);
        } finally {
            setResetting(false);
        }
    };

    const handlePrint = () => {
        if (printRef.current) {
            const printWindow = window.open('', '', 'width=300,height=600');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Thermal Print Preview</title>
                            <style>
                                body {
                                    font-family: 'Courier New', monospace;
                                    margin: 0;
                                    padding: 20px;
                                    font-size: 12px;
                                }
                                @media print {
                                    body { padding: 0; }
                                }
                            </style>
                        </head>
                        <body>
                            ${printRef.current.innerHTML}
                        </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
        }
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">

                {/* Gradient Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Printer className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                                {t("thermal_print")}
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("configure_thermal_receipt_print_settings")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setShowPreview(true)}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                            className="text-[11px] h-8 gap-1.5"
                        >
                            <Eye className="h-3.5 w-3.5" />
                            Preview
                        </Button>
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            size="sm"
                            disabled={loading || resetting}
                            className="text-[11px] h-8 gap-1.5"
                        >
                            {resetting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <RotateCcw className="h-3.5 w-3.5" />
                            )}
                            Reset
                        </Button>
                    </div>
                </div>

                {loading ? (
                    /* Form Skeleton */
                    <div className="w-full p-8 space-y-6 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                <div className="md:col-span-2 h-3 w-24 bg-gray-200/70 rounded" />
                                <div className="md:col-span-10">
                                    <div className={`bg-gray-200/60 rounded ${i === 0 ? "h-5 w-10" : i >= 2 ? "h-20 w-full" : "h-9 w-full"}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                <>
                {/* Form Container */}
                <div className="w-full p-8 space-y-6 animate-in fade-in duration-300">

                    {/* Status */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2">
                            {t("thermal_print")} <span className="text-red-500">*</span>
                        </Label>
                        <div className="md:col-span-10 flex items-center gap-3">
                            <Switch
                                checked={settings.status}
                                onCheckedChange={(checked) => setSettings({ ...settings, status: checked })}
                                className="data-[state=checked]:bg-indigo-500 scale-90"
                            />
                            <span className={`text-[11px] font-medium flex items-center gap-1.5 ${settings.status ? 'text-green-600' : 'text-gray-500'}`}>
                                {settings.status ? (
                                    <>
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Enabled
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-3.5 w-3.5" />
                                        Disabled
                                    </>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* School Name */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2 mt-2">
                            {t("school_name")} <span className="text-red-500">*</span>
                        </Label>
                        <div className="md:col-span-10 space-y-1.5">
                            <Input
                                value={settings.school_name}
                                onChange={(e) => {
                                    setSettings({ ...settings, school_name: e.target.value });
                                    if (errors.school_name) {
                                        setErrors({ ...errors, school_name: '' });
                                    }
                                }}
                                className={`h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded ${
                                    errors.school_name ? 'border-red-500' : ''
                                }`}
                                placeholder="Enter school name"
                            />
                            {errors.school_name && (
                                <p className="text-[10px] text-red-500">{errors.school_name}</p>
                            )}
                        </div>
                    </div>

                    {/* Address */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2 mt-2">
                            {t("address")}
                        </Label>
                        <div className="md:col-span-10 space-y-1.5">
                            <Textarea
                                value={settings.address}
                                onChange={(e) => {
                                    setSettings({ ...settings, address: e.target.value });
                                    if (errors.address) {
                                        setErrors({ ...errors, address: '' });
                                    }
                                }}
                                className={`min-h-[100px] text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y ${
                                    errors.address ? 'border-red-500' : ''
                                }`}
                                placeholder="Enter school address (use <br> for line breaks)"
                            />
                            {errors.address && (
                                <p className="text-[10px] text-red-500">{errors.address}</p>
                            )}
                            <p className="text-[10px] text-gray-500">Use &lt;br&gt; tags for line breaks in thermal print</p>
                        </div>
                    </div>

                    {/* Footer Text */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2 mt-2">
                            {t("footer_text")}
                        </Label>
                        <div className="md:col-span-10 space-y-1.5">
                            <Textarea
                                value={settings.footer_text}
                                onChange={(e) => {
                                    setSettings({ ...settings, footer_text: e.target.value });
                                    if (errors.footer_text) {
                                        setErrors({ ...errors, footer_text: '' });
                                    }
                                }}
                                className={`min-h-[80px] text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y ${
                                    errors.footer_text ? 'border-red-500' : ''
                                }`}
                                placeholder="Enter footer text for receipts"
                            />
                            {errors.footer_text && (
                                <p className="text-[10px] text-red-500">{errors.footer_text}</p>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer Save Action */}
                <div className="w-full border-t border-gray-50 p-4 bg-white flex justify-end mt-auto">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-90 text-white px-10 h-10 text-xs font-bold uppercase transition-all rounded-full shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5"
                    >
                        {saving ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("saving")}...</>
                        ) : t("save")}
                    </Button>
                </div>
                </>
                )}
            </div>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Thermal Print Preview</DialogTitle>
                        <DialogDescription>
                            Preview of how your thermal receipt will appear
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div
                            ref={printRef}
                            className="border border-gray-300 p-4 rounded bg-white font-mono text-xs text-center space-y-3"
                            style={{ width: '280px', margin: '0 auto' }}
                        >
                            <div className="border-b-2 border-dashed border-gray-400 pb-3">
                                <h3 className="font-bold text-sm uppercase">{settings.school_name || "School Name"}</h3>
                                <div
                                    className="text-[10px] mt-2 text-gray-700"
                                    dangerouslySetInnerHTML={{
                                        __html: settings.address?.replace(/<br>/gi, '\n') || "School Address"
                                    }}
                                    style={{ whiteSpace: 'pre-line' }}
                                />
                            </div>
                            <div className="py-3 border-b-2 border-dashed border-gray-400">
                                <div className="text-left space-y-1">
                                    <div className="flex justify-between">
                                        <span>Receipt No:</span>
                                        <span className="font-semibold">#12345</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Date:</span>
                                        <span>{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Student:</span>
                                        <span>John Doe</span>
                                    </div>
                                </div>
                            </div>
                            <div className="py-3 border-b-2 border-dashed border-gray-400">
                                <div className="text-left space-y-1">
                                    <div className="flex justify-between font-semibold">
                                        <span>Description</span>
                                        <span>Amount</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tuition Fee</span>
                                        <span>$500.00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Library Fee</span>
                                        <span>$50.00</span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-2 border-t">
                                        <span>Total:</span>
                                        <span>$550.00</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 text-[10px] text-gray-600">
                                {settings.footer_text || "Thank you!"}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                onClick={() => setShowPreview(false)}
                                variant="outline"
                                size="sm"
                            >
                                Close
                            </Button>
                            <Button
                                onClick={handlePrint}
                                size="sm"
                                className="bg-gradient-to-r from-orange-400 to-indigo-500 text-white"
                            >
                                <Printer className="h-3.5 w-3.5 mr-1.5" />
                                Test Print
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
