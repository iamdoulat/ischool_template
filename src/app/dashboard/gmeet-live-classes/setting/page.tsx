"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Loader2, Save } from "lucide-react";

export default function SettingPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        api_key: "",
        api_secret: "",
        use_calendar_api: false,
        forgot_live_class: false
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/conference/gmeet-settings');
            if (response.data) {
                setFormData({
                    api_key: response.data.api_key || "",
                    api_secret: response.data.api_secret || "",
                    use_calendar_api: !!response.data.use_calendar_api,
                    forgot_live_class: !!response.data.forgot_live_class
                });
            }
        } catch (error) {
            console.error("Failed to load settings", error);
            toast.error(t("failed_to_load_google_meet_settings"));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            await api.post('/conference/gmeet-settings', formData);
            toast.success(t("settings_updated_successfully"));
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error(t("failed_to_update_google_meet_settings"));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 space-y-4 min-h-screen font-sans text-xs max-w-3xl">
                <div className="rounded-xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="h-9 w-9 rounded-lg bg-gray-200 animate-pulse" />
                        <div className="space-y-1.5">
                            <div className="h-4 w-44 rounded bg-gray-200 animate-pulse" />
                            <div className="h-2 w-32 rounded bg-gray-100 animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-6 space-y-5">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col md:flex-row gap-3 items-center">
                            <div className="h-3 w-1/4 rounded bg-gray-200 animate-pulse" />
                            <div className="h-9 flex-1 max-w-lg rounded bg-gray-100 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 min-h-screen font-sans text-xs max-w-3xl">

            {/* Gradient card header */}
            <div className="rounded-xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex items-center justify-between gap-2.5 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Settings className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("google_meet_settings")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("configure_api_credentials_and_live_class_behaviour")}</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={submitting}
                        className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t("save")}
                    </Button>
                </div>
            </div>

            {/* Main White Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-0 overflow-hidden">
                
                {/* Form Fields Container */}
                <div className="p-6 space-y-5">
                    
                    {/* API Key */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        <Label className="w-full md:w-[28%] text-left md:text-right font-medium text-gray-600 text-xs pr-4 md:mb-0 mb-1">
                            {t("api_key")}
                        </Label>
                        <div className="w-full md:w-[70%] max-w-lg">
                            <Input
                                value={formData.api_key}
                                onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                                placeholder=""
                                className="h-9 border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none"
                            />
                        </div>
                    </div>

                    {/* API Secret */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        <Label className="w-full md:w-[28%] text-left md:text-right font-medium text-gray-600 text-xs pr-4 md:mb-0 mb-1">
                            {t("api_secret")}
                        </Label>
                        <div className="w-full md:w-[70%] max-w-lg">
                            <Input
                                value={formData.api_secret}
                                onChange={(e) => setFormData({...formData, api_secret: e.target.value})}
                                placeholder=""
                                className="h-9 border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none"
                            />
                        </div>
                    </div>

                    {/* Use Google Calendar Api */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        <Label className="w-full md:w-[28%] text-left md:text-right font-medium text-gray-600 text-xs pr-4 md:mb-0 mb-1">
                            {t("use_google_calendar_api")} <span className="text-red-500">*</span>
                        </Label>
                        <div className="w-full md:w-[70%] max-w-lg flex items-center gap-6 text-xs text-gray-700 font-medium">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="use_calendar_api"
                                    checked={!formData.use_calendar_api}
                                    onChange={() => setFormData({...formData, use_calendar_api: false})}
                                    className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                />
                                <span>{t("disabled")}</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="use_calendar_api"
                                    checked={formData.use_calendar_api}
                                    onChange={() => setFormData({...formData, use_calendar_api: true})}
                                    className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                />
                                <span>{t("enabled")}</span>
                            </label>
                        </div>
                    </div>

                    {/* Parent Live Class */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        <Label className="w-full md:w-[28%] text-left md:text-right font-medium text-gray-600 text-xs pr-4 md:mb-0 mb-1">
                            {t("parent_live_class")} <span className="text-red-500">*</span>
                        </Label>
                        <div className="w-full md:w-[70%] max-w-lg flex items-center gap-6 text-xs text-gray-700 font-medium">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="forgot_live_class"
                                    checked={!formData.forgot_live_class}
                                    onChange={() => setFormData({...formData, forgot_live_class: false})}
                                    className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                />
                                <span>{t("disabled")}</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="forgot_live_class"
                                    checked={formData.forgot_live_class}
                                    onChange={() => setFormData({...formData, forgot_live_class: true})}
                                    className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                />
                                <span>{t("enabled")}</span>
                            </label>
                        </div>
                    </div>

                </div>

                {/* Footer Save Button */}
                <div className="bg-white p-4 border-t border-gray-150 flex justify-start md:pl-[28%]">
                    <Button 
                        onClick={handleSave} 
                        disabled={submitting}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-5 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm"
                    >
                        {submitting ? t("saving") : t("save")}
                    </Button>
                </div>

            </div>

        </div>
    );
}
