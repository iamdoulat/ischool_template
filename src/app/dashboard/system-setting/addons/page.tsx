"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    CloudUpload,
    Puzzle,
    Loader2,
    CheckCircle2,
    Library,
    Printer,
    Banknote,
    QrCode,
    FileText,
    ShieldCheck,
    Network,
    UserCheck,
    PlaySquare,
    Video,
    MonitorPlay,
    MessageCircle,
    type LucideIcon,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";

interface SystemModule {
    id: number;
    name: string;
    alias: string;
    version: string | null;
    description: string | null;
    is_active_system: boolean;
    is_active_student: boolean;
    is_active_parent: boolean;
}

// Map module alias → an icon for the addon card.
const ICON_BY_ALIAS: Record<string, LucideIcon> = {
    whatsapp_messaging: MessageCircle,
    thermal_print: Printer,
    quick_fees: Banknote,
    qr_code_attendance: QrCode,
    cbse_examination: FileText,
    two_factor_authenticator: ShieldCheck,
    multi_branch: Network,
    behaviour_records: UserCheck,
    online_course: PlaySquare,
    gmeet_live_classes: Video,
    zoom_live_classes: MonitorPlay,
};

function AddonCardSkeleton() {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex gap-4 animate-pulse">
            <div className="flex flex-col items-center gap-2 flex-shrink-0 w-20">
                <div className="h-16 w-16 bg-gray-200/70 rounded-md" />
                <div className="h-3 w-14 bg-gray-200/70 rounded" />
            </div>
            <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 bg-gray-200/70 rounded" />
                <div className="h-2.5 w-full bg-gray-200/60 rounded" />
                <div className="h-2.5 w-5/6 bg-gray-200/60 rounded" />
                <div className="flex justify-end pt-3">
                    <div className="h-6 w-20 bg-gray-200/70 rounded" />
                </div>
            </div>
        </div>
    );
}

export default function AddonsPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [modules, setModules] = useState<SystemModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchModules = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/system-setting/modules");
            const data = res.data?.data ?? res.data ?? [];
            setModules(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch addons", error);
            toast("error", t("failed_to_fetch_addons"));
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchModules();
    }, [fetchModules]);

    const toggleInstall = async (module: SystemModule) => {
        const action = module.is_active_system ? "uninstall" : "install";
        try {
            setBusyId(module.id);
            const res = await api.post(`/system-setting/modules/${module.id}/${action}`);
            const updated = res.data?.data;
            if (updated) {
                setModules((prev) => prev.map((m) => (m.id === module.id ? updated : m)));
                toast("success", `${module.name} ${action === "install" ? "installed" : "uninstalled"}`);
            }
        } catch (error) {
            console.error(`Failed to ${action} addon`, error);
            toast("error", `Failed to ${action} ${module.name}`);
        } finally {
            setBusyId(null);
        }
    };

    const handleFileSelected = async (file: File | undefined) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".zip")) {
            toast("error", t("please_upload_a_zip_addon_package"));
            return;
        }
        const formData = new FormData();
        formData.append("file", file);
        try {
            setUploading(true);
            const res = await api.post("/system-setting/modules/upload", formData);
            if (res.data?.success) {
                toast("success", res.data.message || t("addon_uploaded_successfully"));
                fetchModules();
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            console.error("Failed to upload addon", error);
            toast("error", err.response?.data?.message || t("failed_to_upload_addon"));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans space-y-6">

            {/* Header */}
            <div className="bg-white rounded-t-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Puzzle className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("addons")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("install_and_manage_available_addon_modules")}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Box */}
            <div className="bg-white rounded-b-lg shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-4 items-stretch">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    className="hidden"
                    onChange={(e) => handleFileSelected(e.target.files?.[0])}
                />
                <div
                    className="flex-1 border-2 border-dashed border-gray-200 rounded-lg h-12 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors group"
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        handleFileSelected(e.dataTransfer.files?.[0]);
                    }}
                >
                    <div className="flex items-center gap-2 text-gray-500 group-hover:text-indigo-500">
                        <CloudUpload className="h-4 w-4" />
                        <span className="text-[11px] font-medium">{t("drag_and_drop_a_zip_addon_here_or_click")}</span>
                    </div>
                </div>
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-12 text-[11px] font-bold uppercase transition-all rounded shadow-md gap-2 w-full md:w-auto disabled:opacity-70"
                >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                    {uploading ? `${t("uploading")}...` : t("upload")}
                </Button>
            </div>

            {/* Addons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <AddonCardSkeleton key={i} />)
                ) : modules.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-400 text-[12px]">{t("no_addons_found")}</div>
                ) : (
                    modules.map((module) => {
                        const Icon = ICON_BY_ALIAS[module.alias] || Puzzle;
                        const installed = module.is_active_system;
                        return (
                            <div key={module.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-shadow">
                                {/* Icon Area */}
                                <div className="flex flex-col items-center gap-2 flex-shrink-0 w-20">
                                    <div className="h-16 w-16 bg-orange-100 border border-orange-200 rounded-md flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-orange-400 transform -skew-x-12 translate-x-[-50%] w-full h-full opacity-20" />
                                        <Library className="h-10 w-10 text-orange-500 absolute opacity-30" />
                                        <div className="relative z-10 bg-white/80 p-1.5 rounded-full shadow-sm backdrop-blur-sm">
                                            <Icon className="text-gray-700 h-5 w-5" />
                                        </div>
                                    </div>
                                    <span className="text-[12px] text-gray-500 font-medium">{t("version")} {module.version || "1.0"}</span>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 flex flex-col justify-between min-w-0">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-[12px] font-bold text-indigo-600 leading-tight">{module.name}</h3>
                                            {installed && (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full shrink-0">
                                                    <CheckCircle2 className="h-2.5 w-2.5" /> {t("installed")}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-3">
                                            {module.description || t("no_description_available")}
                                        </p>
                                    </div>

                                    <div className="flex justify-end mt-2">
                                        <Button
                                            onClick={() => toggleInstall(module)}
                                            disabled={busyId === module.id}
                                            className={`h-6 px-3 text-[9px] font-bold uppercase rounded shadow-sm gap-1 ${
                                                installed
                                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                                    : "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white"
                                            }`}
                                        >
                                            {busyId === module.id && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                                            {installed ? t("uninstall") : t("install")}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
