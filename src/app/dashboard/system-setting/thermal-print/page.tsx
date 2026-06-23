"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Printer } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";

export default function ThermalPrintPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        status: true,
        school_name: "Smart School",
        address: "25 Kings Street, CA <br> 89562423934 <br> info@smartschool.com.bd",
        footer_text: "This receipt is computer generated hence no signature is required."
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get("system-setting/thermal-print-settings");
            if (res.data?.status === "success" && res.data.data) {
                setSettings(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post("system-setting/thermal-print-settings", settings);
            if (res.data?.status === "success") {
                toast("success", t("settings_saved_successfully"));
            }
        } catch (error) {
            toast("error", t("failed_to_save"));
            console.error(error);
        } finally {
            setSaving(false);
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
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("thermal_print")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("configure_thermal_receipt_print_settings")}</p>
                        </div>
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

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2">{t("thermal_print")} <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-10">
                            <Switch
                                checked={settings.status}
                                onCheckedChange={(checked) => setSettings({ ...settings, status: checked })}
                                className="data-[state=checked]:bg-indigo-500 scale-90"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2">{t("school_name")} <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-10">
                            <Input
                                value={settings.school_name}
                                onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                                className="h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2 mt-2">{t("address")}</Label>
                        <div className="md:col-span-10">
                            <Textarea
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                className="min-h-[100px] text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2 mt-2">{t("footer_text")}</Label>
                        <div className="md:col-span-10">
                            <Textarea
                                value={settings.footer_text}
                                onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                                className="min-h-[80px] text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y"
                            />
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
        </div>
    );
}
