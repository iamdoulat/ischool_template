"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Settings,
    Cloud,
    UserCircle,
    Save,
    RefreshCw,
    ShieldCheck,
    Info,
    Zap,
    Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const activeGradient = "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:from-[#FF9800] hover:to-[#6366F1]";

export default function SettingPage() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({ curriculum: false, aws: false, guest: false });

    // Dialog State
    const [confirmSection, setConfirmSection] = useState<'curriculum' | 'aws' | 'guest' | null>(null);

    const [settings, setSettings] = useState({
        quiz: true,
        exam: true,
        assignment: true,
        aws_access_key_id: "",
        aws_secret_access_key: "",
        aws_bucket_name: "",
        aws_region: "",
        guest_login: true,
        guest_user_prefix: "Guest",
        guest_user_id_start: 100
    });

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/online-course/settings");
            if (response.data) {
                setSettings(prev => ({
                    ...prev,
                    ...response.data
                }));
            }
        } catch (error) {
            console.error("Failed to fetch course settings:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSave = async (section: 'curriculum' | 'aws' | 'guest') => {
        setSaving({ ...saving, [section]: true });
        try {
            await api.post("/online-course/settings", settings);
            toast.success(t("settings_updated_successfully"));
        } catch {
            toast.error(t("failed_to_save_settings"));
        } finally {
            setSaving({ ...saving, [section]: false });
            setConfirmSection(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="h-16 w-16 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Settings className="h-8 w-8 text-indigo-500" />
                </div>
                <p className="text-sm font-semibold text-gray-500">{t("loading_settings")}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Settings className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("online_course_settings")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("configure_assessment_and_cloud_storage")}</p>
                    </div>
                </div>
            </div>

            {/* Curriculum Setting Section */}
            <Card className="border-gray-100 shadow-sm overflow-hidden p-0 gap-0">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Zap className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-sm font-bold text-gray-800 leading-none">{t("course_curriculum")}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-5 space-y-6">
                    <div className="space-y-3">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("assessment_modules")}</Label>
                        <div className="flex flex-wrap gap-3">
                            <CheckboxItem
                                id="quiz"
                                label={t("quiz_protocol")}
                                checked={settings.quiz}
                                onChange={(val) => setSettings({ ...settings, quiz: val })}
                            />
                            <CheckboxItem
                                id="exam"
                                label={t("exam_node")}
                                checked={settings.exam}
                                onChange={(val) => setSettings({ ...settings, exam: val })}
                            />
                            <CheckboxItem
                                id="assignment"
                                label={t("assignment_core")}
                                checked={settings.assignment}
                                onChange={(val) => setSettings({ ...settings, assignment: val })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <Button
                            onClick={() => setConfirmSection("curriculum")}
                            disabled={saving.curriculum}
                            className={cn("h-9 text-xs font-bold rounded-full px-6 shadow-md", activeGradient)}
                        >
                            {saving.curriculum ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            {t("sync_curriculum")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* AWS S3 Bucket Setting Section */}
            <Card className="border-gray-100 shadow-sm overflow-hidden p-0 gap-0">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Cloud className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-sm font-bold text-gray-800 leading-none">{t("cloud_storage_infrastructure")}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-5 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField
                            label={t("aws_access_key_id")}
                            required
                            icon={<Lock className="h-3.5 w-3.5" />}
                            value={settings.aws_access_key_id || ""}
                            onChange={(val) => setSettings({ ...settings, aws_access_key_id: val })}
                        />
                        <InputField
                            label={t("secret_access_key")}
                            required
                            type="password"
                            icon={<ShieldCheck className="h-3.5 w-3.5" />}
                            value={settings.aws_secret_access_key || ""}
                            onChange={(val) => setSettings({ ...settings, aws_secret_access_key: val })}
                        />
                        <InputField
                            label={t("institutional_bucket")}
                            required
                            icon={<Cloud className="h-3.5 w-3.5" />}
                            value={settings.aws_bucket_name || ""}
                            onChange={(val) => setSettings({ ...settings, aws_bucket_name: val })}
                        />
                        <InputField
                            label={t("target_region")}
                            required
                            icon={<Info className="h-3.5 w-3.5" />}
                            value={settings.aws_region || ""}
                            onChange={(val) => setSettings({ ...settings, aws_region: val })}
                        />
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <Button
                            onClick={() => setConfirmSection("aws")}
                            disabled={saving.aws}
                            className={cn("h-9 text-xs font-bold rounded-full px-6 shadow-md", activeGradient)}
                        >
                            {saving.aws ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            {t("commit_cloud_sync")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Guest User Section */}
            <Card className="border-gray-100 shadow-sm overflow-hidden p-0 gap-0">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <UserCircle className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-sm font-bold text-gray-800 leading-none">{t("guest_node_configuration")}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-5 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                        <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">
                                {t("guest_access_protocol")} <span className="text-red-500">*</span>
                            </Label>
                            <p className="text-xs text-gray-400">{t("allow_unauthenticated_nodes_preview")}</p>
                        </div>
                        <button
                            onClick={() => setSettings({ ...settings, guest_login: !settings.guest_login })}
                            className={cn(
                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                                settings.guest_login ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1]" : "bg-gray-200"
                            )}
                        >
                            <span
                                className={cn(
                                    "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-all duration-300",
                                    settings.guest_login ? "translate-x-6" : "translate-x-1"
                                )}
                            />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField
                            label={t("guest_prefix")}
                            required
                            icon={<UserCircle className="h-3.5 w-3.5" />}
                            value={settings.guest_user_prefix || ""}
                            onChange={(val) => setSettings({ ...settings, guest_user_prefix: val })}
                        />
                        <InputField
                            label={t("id_start_range")}
                            required
                            type="number"
                            icon={<Zap className="h-3.5 w-3.5" />}
                            value={(settings.guest_user_id_start || 0).toString()}
                            onChange={(val) => setSettings({ ...settings, guest_user_id_start: parseInt(val) || 0 })}
                        />
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <Button
                            onClick={() => setConfirmSection("guest")}
                            disabled={saving.guest}
                            className={cn("h-9 text-xs font-bold rounded-full px-6 shadow-md", activeGradient)}
                        >
                            {saving.guest ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            {t("initialize_guest_protocol")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Commit Confirmation Dialog */}
            <AlertDialog open={confirmSection !== null} onOpenChange={(open) => !open && setConfirmSection(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("confirm_parameter_sync")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("parameter_sync_description", { section: confirmSection || "" })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="h-9 text-xs font-bold rounded-full px-6">{t("abort_sync")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => confirmSection && handleSave(confirmSection)}
                            className={cn("h-9 text-xs font-bold rounded-full px-6", activeGradient)}
                        >
                            {t("confirm_commit")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function CheckboxItem({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (val: boolean) => void }) {
    return (
        <div
            onClick={() => onChange(!checked)}
            className={cn(
                "flex items-center space-x-3 group cursor-pointer p-4 rounded-lg border transition-all duration-300 min-w-[160px]",
                checked
                    ? "border-indigo-200 bg-indigo-50/50"
                    : "border-gray-100 bg-white hover:border-gray-200"
            )}
        >
            <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(val) => onChange(!!val)}
                className={cn(
                    "h-4 w-4 rounded transition-all",
                    checked ? "bg-indigo-500 border-indigo-500" : "border-gray-300"
                )}
            />
            <label
                htmlFor={id}
                className={cn(
                    "text-xs font-semibold cursor-pointer transition-colors",
                    checked ? "text-indigo-700" : "text-gray-600 group-hover:text-indigo-600"
                )}
            >
                {label}
            </label>
        </div>
    );
}

function InputField({ label, required, value, onChange, type = "text", icon }: { label: string; required?: boolean; value: string; onChange: (val: string) => void; type?: string; icon?: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight flex items-center gap-1.5">
                {icon}
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 text-xs border-gray-200 rounded-lg focus-visible:ring-indigo-500"
                placeholder={`Enter ${label.toLowerCase()}...`}
            />
        </div>
    );
}
