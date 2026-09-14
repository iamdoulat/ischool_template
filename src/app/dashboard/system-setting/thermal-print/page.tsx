"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Printer, Eye, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
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
            sonnerToast.error(t("failed_load_thermal_print_settings"));
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!settings.school_name.trim()) {
            newErrors.school_name = t("school_name_is_required");
        } else if (settings.school_name.length > 255) {
            newErrors.school_name = t("school_name_max_limit");
        }

        if (settings.address && settings.address.length > 1000) {
            newErrors.address = t("address_max_limit");
        }

        if (settings.footer_text && settings.footer_text.length > 1000) {
            newErrors.footer_text = t("footer_text_max_limit");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            sonnerToast.error(t("please_fix_validation_errors"));
            return;
        }

        setSaving(true);
        try {
            const res = await api.post("system-setting/thermal-print-settings", settings);
            if (res.data?.status === "success") {
                sonnerToast.success(t("thermal_print_settings_saved_success"));
                toast("success", t("thermal_print_settings_saved_success"));
                fetchSettings();
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                sonnerToast.error(t("validation_failed_check_form"));
            } else {
                sonnerToast.error(t("failed_to_save_settings"));
                toast("error", t("failed_to_save_settings"));
            }
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm(t("confirm_reset_thermal_settings"))) {
            return;
        }

        setResetting(true);
        try {
            const res = await api.post("system-setting/thermal-print-settings/reset");
            if (res.data?.status === "success") {
                setSettings(res.data.data);
                setErrors({});
                sonnerToast.success(t("settings_reset_to_defaults"));
            }
        } catch (error) {
            sonnerToast.error(t("failed_reset_settings"));
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
                            <title>${t("thermal_print_preview")}</title>
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
            {/* Page Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
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
                        {t("preview")}
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
                        {t("reset")}
                    </Button>
                </div>
            </div>

            {/* Settings Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">
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
                                        {t("enabled")}
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-3.5 w-3.5" />
                                        {t("disabled")}
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
                                placeholder={t("enter_school_name")}
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
                                placeholder={t("enter_school_address_placeholder")}
                            />
                            {errors.address && (
                                <p className="text-[10px] text-red-500">{errors.address}</p>
                            )}
                            <p className="text-[10px] text-gray-500">{t("use_br_tags_for_line_breaks")}</p>
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
                                placeholder={t("enter_footer_text_placeholder")}
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
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-10 h-10 text-xs font-bold uppercase transition-all rounded-full shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5"
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
                        <DialogTitle>{t("thermal_print_preview")}</DialogTitle>
                        <DialogDescription>
                            {t("preview_thermal_receipt_desc")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div
                            ref={printRef}
                            className="border border-gray-300 p-4 rounded bg-white font-mono text-xs text-center space-y-3"
                            style={{ width: '280px', margin: '0 auto' }}
                        >
                            <div className="border-b-2 border-dashed border-gray-400 pb-3">
                                <h3 className="font-bold text-sm uppercase">{settings.school_name || t("school_name")}</h3>
                                <div
                                    className="text-[10px] mt-2 text-gray-700"
                                    dangerouslySetInnerHTML={{
                                        __html: sanitizeHtml(settings.address?.replace(/<br>/gi, '\n') || t("address"))
                                    }}
                                    style={{ whiteSpace: 'pre-line' }}
                                />
                            </div>
                            <div className="py-3 border-b-2 border-dashed border-gray-400">
                                <div className="text-left space-y-1">
                                    <div className="flex justify-between">
                                        <span>{t("receipt_no")}</span>
                                        <span className="font-semibold">#12345</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t("receipt_date")}</span>
                                        <span>{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t("student")}</span>
                                        <span>{t("sample_student_name")}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="py-3 border-b-2 border-dashed border-gray-400">
                                <div className="text-left space-y-1">
                                    <div className="flex justify-between font-semibold">
                                        <span>{t("receipt_description")}</span>
                                        <span>{t("receipt_amount")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t("tuition_fee")}</span>
                                        <span>$500.00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t("library_fee")}</span>
                                        <span>$50.00</span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-2 border-t">
                                        <span>{t("total")}:</span>
                                        <span>$550.00</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 text-[10px] text-gray-600">
                                {settings.footer_text || t("thank_you")}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                onClick={() => setShowPreview(false)}
                                variant="outline"
                                size="sm"
                            >
                                {t("close")}
                            </Button>
                            <Button
                                onClick={handlePrint}
                                size="sm"
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            >
                                <Printer className="h-3.5 w-3.5 mr-1.5" />
                                {t("test_print")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
