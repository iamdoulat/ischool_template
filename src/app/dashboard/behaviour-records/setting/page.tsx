"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, RefreshCw, MessageSquare, UserCheck, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        student_comment: true,
        parent_comment: true
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/behaviour/settings');
            if (response.data) {
                setSettings({
                    student_comment: !!response.data.student_comment,
                    parent_comment: !!response.data.parent_comment
                });
            }
        } catch (error) {
            console.error("Failed to fetch behaviour settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/behaviour/settings', settings);
            tt.success("behaviour_configuration_updated");
        } catch (error) {
            tt.error("failed_to_update_configuration");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-sans">
                <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm flex items-center gap-6">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-64 rounded" />
                        <Skeleton className="h-3 w-80 rounded" />
                    </div>
                </div>
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-44 rounded" />
                            <Skeleton className="h-2.5 w-60 rounded" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 p-8 bg-white/50 rounded-lg border border-gray-50">
                            <div className="space-y-2"><Skeleton className="h-4 w-56 rounded" /><Skeleton className="h-3 w-72 rounded" /></div>
                            <div className="flex flex-wrap gap-10"><Skeleton className="h-16 w-60 rounded-lg" /><Skeleton className="h-16 w-60 rounded-lg" /></div>
                        </div>
                        <div className="flex justify-center pt-8 border-t border-gray-50"><Skeleton className="h-14 w-64 rounded-full" /></div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
            {/* Setting Section */}
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 gap-0 text-slate-800">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Zap className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("communication_settings")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("control_who_can_comment_on_behaviour_records")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-indigo-500" />
                            {t("comment_channels")}
                        </h3>
                        <p className="text-xs text-gray-500 ml-6">{t("choose_who_can_comment_on_student_behaviour_records")}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <CheckboxItem
                            id="student"
                            label={t("student_comments")}
                            description={t("allow_students_to_comment")}
                            checked={settings.student_comment}
                            onChange={(val) => setSettings({...settings, student_comment: val})}
                            icon={<UserCheck className="h-4 w-4" />}
                        />
                        <CheckboxItem
                            id="parent"
                            label={t("parent_comments")}
                            description={t("allow_parents_to_comment")}
                            checked={settings.parent_comment}
                            onChange={(val) => setSettings({...settings, parent_comment: val})}
                            icon={<Users className="h-4 w-4" />}
                        />
                    </div>

                    <div className="flex justify-end pt-2 border-t border-gray-100">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all mt-3"
                        >
                            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {t("save_changes")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function CheckboxItem({ id, label, description, checked, onChange, icon }: { id: string, label: string, description?: string, checked: boolean, onChange: (val: boolean) => void, icon?: React.ReactNode }) {
    return (
        <div
            onClick={() => onChange(!checked)}
            className={cn(
                "flex items-start gap-3 cursor-pointer p-4 rounded-lg border transition-all duration-200",
                checked
                    ? "border-indigo-500 bg-indigo-50/50"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
            )}
        >
            <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(val) => onChange(!!val)}
                className={cn("mt-0.5 shrink-0", checked ? "text-indigo-500" : "text-gray-400")}
            />
            <div className="flex flex-col gap-0.5">
                <label
                    htmlFor={id}
                    className={cn(
                        "text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5",
                        checked ? "text-indigo-700" : "text-gray-700"
                    )}
                >
                    {icon}
                    {label}
                </label>
                {description && (
                    <span className="text-[11px] text-gray-400">{description}</span>
                )}
            </div>
        </div>
    );
}
