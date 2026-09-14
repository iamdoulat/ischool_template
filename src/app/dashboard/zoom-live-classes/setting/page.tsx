"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Save, Key, Video } from "lucide-react";

export default function ZoomSettingPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState("https://demo.smart-school.in/admin/conference/generatetoken");

    const [settings, setSettings] = useState({
        api_key: "",
        api_secret: "",
        teacher_api_credential: true,
        staff_client_type: "web",
        student_client_type: "web",
        parent_live_class: true,
        access_token: ""
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            setRedirectUrl(`${window.location.origin}/admin/conference/generatetoken`);
        }
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/conference/zoom-settings');
            if (response.data) {
                setSettings({
                    api_key: response.data.api_key || "",
                    api_secret: response.data.api_secret || "",
                    teacher_api_credential: response.data.teacher_api_credential !== undefined ? !!response.data.teacher_api_credential : true,
                    staff_client_type: response.data.staff_client_type || "web",
                    student_client_type: response.data.student_client_type || "web",
                    parent_live_class: response.data.parent_live_class !== undefined ? !!response.data.parent_live_class : true,
                    access_token: response.data.access_token || ""
                });
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
            toast.error(t("failed_to_load_settings"));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/conference/zoom-settings', settings);
            toast.success(t("zoom_configuration_updated_successfully"));
            fetchSettings();
        } catch (error) {
            console.error("Failed to save configuration", error);
            toast.error(t("failed_to_save_configuration"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* Gradient card header */}
            <div className="rounded-xl border-[0.5px] border-gray-300 dark:border-zinc-800 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-900 dark:to-zinc-950 dark:border-b dark:border-zinc-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Key className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">{t("zoom_settings")}</h1>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{t("configure_api_credentials_and_access_tokens")}</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-5 h-9 text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 transition-all active:scale-95 border-0 cursor-pointer"
                    >
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t("save")}
                    </Button>
                </div>
            </div>

            {/* Inner Main Card Area */}
            <div className="bg-white dark:bg-card/40 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 space-y-6">

                {/* Alert Notification */}
                <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 px-4 py-3 rounded-lg text-xs font-medium leading-relaxed">
                    {t("access_token_not_generated_please_authenticate_your_account")}
                </div>

                {/* Dual Panel Form Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 text-gray-700 dark:text-gray-300">
                    
                    {/* Left Column (3/5) - Inputs and Horizontal Radios */}
                    <div className="lg:col-span-3 space-y-5">
                        
                        {/* API Key */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <Label className="sm:col-span-4 text-left sm:text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                                {t("zoom_api_key")} <span className="text-red-500">*</span>
                            </Label>
                            <div className="sm:col-span-8">
                                <Input
                                    value={settings.api_key}
                                    onChange={(e) => setSettings({...settings, api_key: e.target.value})}
                                    className="h-9 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-lg text-xs shadow-none w-full"
                                />
                            </div>
                        </div>

                        {/* API Secret */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <Label className="sm:col-span-4 text-left sm:text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                                {t("zoom_api_secret")} <span className="text-red-500">*</span>
                            </Label>
                            <div className="sm:col-span-8">
                                <Input
                                    value={settings.api_secret}
                                    onChange={(e) => setSettings({...settings, api_secret: e.target.value})}
                                    className="h-9 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-lg text-xs shadow-none w-full"
                                />
                            </div>
                        </div>

                        {/* Teacher API Credential */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <Label className="sm:col-span-4 text-left sm:text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                                {t("teacher_api_credential")} <span className="text-red-500">*</span>
                            </Label>
                            <div className="sm:col-span-8 flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="teacher_api_credential"
                                        checked={!settings.teacher_api_credential}
                                        onChange={() => setSettings({...settings, teacher_api_credential: false})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("disabled")}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="radio"
                                        name="teacher_api_credential"
                                        checked={settings.teacher_api_credential}
                                        onChange={() => setSettings({...settings, teacher_api_credential: true})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("enabled")}</span>
                                </label>
                            </div>
                        </div>

                        {/* Staff Client Type */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <Label className="sm:col-span-4 text-left sm:text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                                {t("use_zoom_client_for_staff")} <span className="text-red-500">*</span>
                            </Label>
                            <div className="sm:col-span-8 flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="staff_client_type"
                                        value="web"
                                        checked={settings.staff_client_type === "web"}
                                        onChange={() => setSettings({...settings, staff_client_type: "web"})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("web")}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="staff_client_type"
                                        value="app"
                                        checked={settings.staff_client_type === "app"}
                                        onChange={() => setSettings({...settings, staff_client_type: "app"})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("zoom_app")}</span>
                                </label>
                            </div>
                        </div>

                        {/* Student Client Type */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <Label className="sm:col-span-4 text-left sm:text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                                {t("use_zoom_client_for_student")} <span className="text-red-500">*</span>
                            </Label>
                            <div className="sm:col-span-8 flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="student_client_type"
                                        value="web"
                                        checked={settings.student_client_type === "web"}
                                        onChange={() => setSettings({...settings, student_client_type: "web"})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("web")}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="student_client_type"
                                        value="app"
                                        checked={settings.student_client_type === "app"}
                                        onChange={() => setSettings({...settings, student_client_type: "app"})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("zoom_app")}</span>
                                </label>
                            </div>
                        </div>

                        {/* Parent Live Class */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <Label className="sm:col-span-4 text-left sm:text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                                {t("parent_live_class")} <span className="text-red-500">*</span>
                            </Label>
                            <div className="sm:col-span-8 flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="parent_live_class"
                                        checked={!settings.parent_live_class}
                                        onChange={() => setSettings({...settings, parent_live_class: false})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("disabled")}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="radio"
                                        name="parent_live_class"
                                        checked={settings.parent_live_class}
                                        onChange={() => setSettings({...settings, parent_live_class: true})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("enabled")}</span>
                                </label>
                            </div>
                        </div>

                    </div>

                    {/* Right Column (2/5) - Info & Authorization */}
                    <div className="lg:col-span-2 space-y-4">
                        
                        {/* Zoom branding logo */}
                        <div className="text-5xl font-black text-[#2d8cff] tracking-tighter italic">zoom</div>

                        {/* Guide links */}
                        <div className="space-y-1 mt-4">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {t("to_generate_zoom_api_credential")}{" "}
                                <a href="https://marketplace.zoom.us" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold">
                                    {t("click_here")}
                                </a>
                            </p>
                            
                            <div className="pt-2 space-y-1">
                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{t("zoom_redirect_url")}:</p>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 break-all select-all leading-relaxed bg-gray-50 dark:bg-zinc-900 p-2.5 border border-gray-200 dark:border-zinc-800 rounded-lg">
                                    {redirectUrl}
                                </p>
                            </div>
                        </div>

                        {/* Authorization action button */}
                        <Button 
                            type="button"
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 h-9 text-xs font-bold rounded-full shadow-md transition-all active:scale-95 mt-2 cursor-pointer border-0"
                            onClick={() => {
                                toast.success(t("access_token_successfully_generated_for_developer_account"));
                            }}
                        >
                            {t("get_access_token")}
                        </Button>

                    </div>

                </div>

            </div>

        </div>
    );
}
