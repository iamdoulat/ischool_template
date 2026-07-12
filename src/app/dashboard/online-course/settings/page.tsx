"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
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
    Check,
    ChevronDown,
    Save,
    RefreshCw,
    ShieldCheck,
    Info,
    Zap,
    Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
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

export default function SettingPage() {
    const { toast } = useToast();
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

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/online-course/settings');
            if (response.data) {
                setSettings({
                    ...settings,
                    ...response.data
                });
            }
        } catch (error) {
            console.error("Failed to fetch course settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (section: 'curriculum' | 'aws' | 'guest') => {
        setSaving({ ...saving, [section]: true });
        try {
            await api.post('/online-course/settings', settings);
            toast({
                title: t("protocol_committed"),
                description: t("institutional_section_params_updated", { section }),
                variant: "default"
            });
        } catch (error) {
            toast({
                title: t("commit_failure"),
                description: t("failed_to_sync_parameters"),
                variant: "destructive"
            });
        } finally {
            setSaving({ ...saving, [section]: false });
            setConfirmSection(null);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-700">
                <div className="h-16 w-16 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-2xl shadow-indigo-100 animate-pulse">
                    <Settings className="h-8 w-8" />
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 animate-bounce">{t("accessing_course_config")}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">{t("fetching_institutional_parameters")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Strategy Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Settings className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("institutional_settings")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("configure_assessment_and_cloud_storage")}</p>
                    </div>
                </div>
            </div>

            {/* Curriculum Setting Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                        <Zap className="h-4 w-4" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900">{t("course_curriculum_registry")}</h2>
                </div>
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight min-w-[200px]">
                            {t("assessment_modules")}
                        </label>
                        <div className="flex flex-wrap items-center gap-6">
                            <CheckboxItem
                                id="quiz"
                                label={t("quiz_protocol")}
                                checked={settings.quiz}
                                onChange={(val) => setSettings({...settings, quiz: val})}
                            />
                            <CheckboxItem
                                id="exam"
                                label={t("exam_node")}
                                checked={settings.exam}
                                onChange={(val) => setSettings({...settings, exam: val})}
                            />
                            <CheckboxItem
                                id="assignment"
                                label={t("assignment_core")}
                                checked={settings.assignment}
                                onChange={(val) => setSettings({...settings, assignment: val})}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-5 border-t border-gray-50">
                        <Button
                            onClick={() => setConfirmSection('curriculum')}
                            disabled={saving.curriculum}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-6 text-xs font-bold rounded-lg shadow-sm flex items-center gap-2"
                        >
                            {saving.curriculum ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {t("sync_curriculum")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* AWS S3 Bucket Setting Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm">
                        <Cloud className="h-4 w-4" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900">{t("cloud_storage_infrastructure")}</h2>
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <InputField
                            label={t("aws_access_key_id")}
                            required
                            icon={<Lock className="h-3.5 w-3.5" />}
                            value={settings.aws_access_key_id || ""}
                            onChange={(val) => setSettings({...settings, aws_access_key_id: val})}
                        />
                        <InputField
                            label={t("secret_access_key")}
                            required
                            type="password"
                            icon={<Lock className="h-3.5 w-3.5" />}
                            value={settings.aws_secret_access_key || ""}
                            onChange={(val) => setSettings({...settings, aws_secret_access_key: val})}
                        />
                        <InputField
                            label={t("institutional_bucket")}
                            required
                            icon={<Cloud className="h-3.5 w-3.5" />}
                            value={settings.aws_bucket_name || ""}
                            onChange={(val) => setSettings({...settings, aws_bucket_name: val})}
                        />
                        <InputField
                            label={t("target_region")}
                            required
                            icon={<Info className="h-3.5 w-3.5" />}
                            value={settings.aws_region || ""}
                            onChange={(val) => setSettings({...settings, aws_region: val})}
                        />
                    </div>
                    <div className="flex justify-end pt-5 border-t border-gray-50">
                        <Button
                            onClick={() => setConfirmSection('aws')}
                            disabled={saving.aws}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-6 text-xs font-bold rounded-lg shadow-sm flex items-center gap-2"
                        >
                            {saving.aws ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {t("commit_cloud_sync")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Guest User Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm">
                        <UserCircle className="h-4 w-4" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900">{t("guest_node_configuration")}</h2>
                </div>
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-8 p-6 bg-slate-50/50 rounded-lg border border-gray-50">
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">
                                {t("guest_access_protocol")} <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-gray-400">{t("allow_unauthenticated_nodes_preview")}</p>
                        </div>
                        <button
                            onClick={() => setSettings({...settings, guest_login: !settings.guest_login})}
                            className={cn(
                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                                settings.guest_login ? "bg-indigo-600" : "bg-gray-200"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <InputField
                            label={t("guest_prefix")}
                            required
                            icon={<UserCircle className="h-3.5 w-3.5" />}
                            value={settings.guest_user_prefix || ""}
                            onChange={(val) => setSettings({...settings, guest_user_prefix: val})}
                        />
                        <InputField
                            label={t("id_start_range")}
                            required
                            type="number"
                            icon={<Zap className="h-3.5 w-3.5" />}
                            value={(settings.guest_user_id_start || 0).toString()}
                            onChange={(val) => setSettings({...settings, guest_user_id_start: parseInt(val) || 0})}
                        />
                    </div>
                    <div className="flex justify-end pt-5 border-t border-gray-50">
                        <Button
                            onClick={() => setConfirmSection('guest')}
                            disabled={saving.guest}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-6 text-xs font-bold rounded-lg shadow-sm flex items-center gap-2"
                        >
                            {saving.guest ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {t("initialize_guest_protocol")}
                        </Button>
                    </div>
                </div>
            </div>

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
                        <AlertDialogCancel>{t("abort_sync")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => confirmSection && handleSave(confirmSection)}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {t("confirm_commit")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function CheckboxItem({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (val: boolean) => void }) {
    return (
        <div
            onClick={() => onChange(!checked)}
            className={cn(
                "flex items-center space-x-3 group cursor-pointer p-4 rounded-lg border transition-all duration-300 min-w-[160px]",
                checked
                    ? "border-indigo-500 bg-indigo-50/50"
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

function InputField({ label, required, value, onChange, type = "text", icon }: { label: string, required?: boolean, value: string, onChange: (val: string) => void, type?: string, icon?: React.ReactNode }) {
    return (
        <div className="space-y-2 group">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight flex items-center gap-2">
                {icon}
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <Input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-9 rounded-lg border-gray-200 bg-white focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all text-xs px-3 shadow-sm"
                    placeholder={`Enter ${label.toLowerCase()}...`}
                />
            </div>
        </div>
    );
}
