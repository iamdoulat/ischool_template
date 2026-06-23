"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import api from "@/lib/api";
import { Loader2, Settings, Smartphone, ScanFace, ScanLine, Save } from "lucide-react";

interface SmartSettings {
    is_face_enabled: boolean;
    is_qr_enabled: boolean;
    is_nfc_enabled: boolean;
}

function MethodSkeleton() {
    return (
        <div className="flex items-center justify-between border rounded-lg p-4">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-200/70 animate-pulse" />
                <div className="space-y-2">
                    <div className="h-3.5 w-40 rounded bg-gray-200/70 animate-pulse" />
                    <div className="h-2.5 w-64 rounded bg-gray-200/60 animate-pulse" />
                </div>
            </div>
            <div className="h-6 w-11 rounded-full bg-gray-200/70 animate-pulse" />
        </div>
    );
}

export default function SmartAttendanceSettingsPage() {
    const [settings, setSettings] = useState<SmartSettings>({ is_face_enabled: true, is_qr_enabled: true, is_nfc_enabled: true });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { t } = useTranslation();

    const METHODS = [
        { key: "is_face_enabled" as const, label: t("face_recognition"), desc: t("face_recognition_desc"), Icon: ScanFace, color: "text-blue-600 bg-blue-50" },
        { key: "is_qr_enabled" as const, label: t("qr_code_scan"), desc: t("qr_code_scan_desc"), Icon: ScanLine, color: "text-emerald-600 bg-emerald-50" },
        { key: "is_nfc_enabled" as const, label: t("nfc_system"), desc: t("nfc_system_desc"), Icon: Smartphone, color: "text-purple-600 bg-purple-50" },
    ];

    useEffect(() => {
        (async () => {
            try {
                const response = await api.get("/smart-attendance/settings");
                const data = response.data?.data?.data || response.data?.data;
                if (data) {
                    setSettings({
                        is_face_enabled: !!data.is_face_enabled,
                        is_qr_enabled: !!data.is_qr_enabled,
                        is_nfc_enabled: !!data.is_nfc_enabled,
                    });
                }
            } catch {
                toast.error(t("failed_to_load_attendance_settings"));
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.post("/smart-attendance/settings", settings);
            toast.success(t("settings_saved_successfully"));
        } catch {
            toast.error(t("failed_to_save_settings"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 max-w-4xl">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Settings className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("smart_attendance_settings")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("toggle_methods_available")}</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t("save")}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <>
                            <MethodSkeleton />
                            <MethodSkeleton />
                            <MethodSkeleton />
                        </>
                    ) : (
                        METHODS.map(({ key, label, desc, Icon, color }) => (
                            <div key={key} className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50/60 transition-colors">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className={`p-3 rounded-full shrink-0 ${color}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <Label className="text-sm font-semibold text-gray-800">{label}</Label>
                                        <p className="text-xs text-muted-foreground">{desc}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={settings[key]}
                                    onCheckedChange={(c) => setSettings({ ...settings, [key]: c })}
                                    className="data-[state=checked]:bg-indigo-500 shrink-0"
                                />
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
