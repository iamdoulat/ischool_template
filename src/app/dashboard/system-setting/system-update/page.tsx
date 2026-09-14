"use client";

import { useSettings } from "@/components/providers/settings-provider";
import { 
    Info, 
    RefreshCw, 
    UploadCloud, 
    CheckCircle2, 
    AlertCircle, 
    FileArchive, 
    Server, 
    Database, 
    ShieldCheck, 
    Terminal, 
    DownloadCloud, 
    Sparkles,
    Check,
    X,
    FileText
} from "lucide-react";
import { cn, toLocaleNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useToast as useUiToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

interface VersionInfo {
    version: string;
    php_version?: string;
    laravel_version?: string;
    zip_enabled?: boolean;
}

interface RemoteUpdateInfo {
    has_update: boolean;
    current_version: string;
    latest_version: string;
    download_url: string | null;
    changelog: string | null;
    published_at?: string;
    message?: string;
}

type ActiveTab = "status" | "upload" | "guidelines";

export default function SystemUpdatePage() {
    const { t, language } = useTranslation();
    const { settings } = useSettings();
    const { toast: uiToast } = useUiToast();

    const [activeTab, setActiveTab] = useState<ActiveTab>("status");
    const [currentVersion, setCurrentVersion] = useState<string>(settings?.app_version || "1.0.0");
    const [systemInfo, setSystemInfo] = useState<VersionInfo | null>(null);
    const [loadingCheck, setLoadingCheck] = useState<boolean>(false);
    const [remoteUpdate, setRemoteUpdate] = useState<RemoteUpdateInfo | null>(null);
    
    // File Upload State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [updating, setUpdating] = useState<boolean>(false);
    const [updateProgress, setUpdateProgress] = useState<number>(0);
    const [currentStep, setCurrentStep] = useState<string>("");
    const [executionLogs, setExecutionLogs] = useState<string[]>([]);
    const [updatedFilesList, setUpdatedFilesList] = useState<Array<{ name: string; path: string; extension?: string; size?: number }>>([]);
    const [migrationsRunList, setMigrationsRunList] = useState<string[]>([]);
    const [updateSuccessVersion, setUpdateSuccessVersion] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch current system version on mount
    useEffect(() => {
        fetchSystemVersion();
    }, []);

    const fetchSystemVersion = async () => {
        try {
            const response = await api.get("/system-setting/system-update");
            if (response.data && response.data.data) {
                const data = response.data.data;
                setCurrentVersion(data.version || "1.0.0");
                setSystemInfo(data);
            }
        } catch (error) {
            console.error("Failed to fetch system version:", error);
        }
    };

    const handleCheckUpdate = async () => {
        setLoadingCheck(true);
        try {
            const response = await api.post("/system-setting/system-update/check");
            if (response.data && response.data.data) {
                const updateData: RemoteUpdateInfo = response.data.data;
                setRemoteUpdate(updateData);
                if (updateData.has_update) {
                    toast.info(`${t("new_version_ready")} ${updateData.latest_version}`);
                } else {
                    toast.success(response.data.message || t("system_up_to_date"));
                }
            }
        } catch (error) {
            console.error("Failed to check for updates:", error);
            toast.error(t("error") || "Failed to connect to update server.");
        } finally {
            setLoadingCheck(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.name.endsWith('.zip')) {
                toast.error(t("upload_package_desc"));
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (!file.name.endsWith('.zip')) {
                toast.error(t("upload_package_desc"));
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUploadUpdate = async () => {
        if (!selectedFile) {
            toast.error(t("upload_package_desc"));
            return;
        }

        setUpdating(true);
        setUpdateSuccessVersion(null);
        setUpdatedFilesList([]);
        setMigrationsRunList([]);
        setUpdateProgress(15);
        setCurrentStep(t("upload_update_package"));
        setExecutionLogs([`[Start] ${t("upload_update_package")}`]);

        const formData = new FormData();
        formData.append("update_file", selectedFile);

        try {
            setUpdateProgress(40);
            setCurrentStep(t("updating_system"));
            setExecutionLogs(prev => [...prev, `[Processing] ${t("updating_system")}`]);

            const response = await api.post("/system-setting/system-update/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data && response.data.data) {
                const resData = response.data.data;
                const newVer = resData.version || currentVersion;
                setUpdateProgress(100);
                setCurrentStep(t("system_update_completed"));

                if (resData.logs && Array.isArray(resData.logs)) {
                    setExecutionLogs(resData.logs);
                } else {
                    setExecutionLogs(prev => [...prev, `[Success] ${t("system_updated_to_version")} ${newVer}`]);
                }

                if (resData.updated_files && Array.isArray(resData.updated_files)) {
                    setUpdatedFilesList(resData.updated_files);
                }
                if (resData.migrations_run && Array.isArray(resData.migrations_run)) {
                    setMigrationsRunList(resData.migrations_run);
                }

                setCurrentVersion(newVer);
                setUpdateSuccessVersion(newVer);

                toast.success(`🎉 ${t("system_update_completed")}`, {
                    description: resData.message || `${t("system_updated_to_version")} ${newVer}.`,
                    duration: 8000,
                });

                uiToast({
                    title: t("system_update_completed"),
                    description: `${t("system_updated_to_version")} ${newVer}.`,
                });

                setSelectedFile(null);
                fetchSystemVersion();
            }
        } catch (error: any) {
            console.error("System update failed:", error);
            setUpdateProgress(0);
            setCurrentStep(t("error") || "Failed");
            
            const errorMessage = error.response?.data?.message || t("error") || "Failed to process system update. Please verify update.zip file.";
            const logs = error.response?.data?.data || [errorMessage];
            setExecutionLogs(Array.isArray(logs) ? logs : [errorMessage]);
            toast.error(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    const handleInstallRemote = async (downloadUrl: string) => {
        setUpdating(true);
        setUpdateSuccessVersion(null);
        setUpdatedFilesList([]);
        setMigrationsRunList([]);
        setUpdateProgress(20);
        setCurrentStep(t("updating_system"));
        setExecutionLogs([`[Start] ${t("updating_system")}`]);

        try {
            setUpdateProgress(50);
            setCurrentStep(t("updating_system"));

            const response = await api.post("/system-setting/system-update/install-remote", {
                download_url: downloadUrl
            });

            if (response.data && response.data.data) {
                const resData = response.data.data;
                const newVer = resData.version || currentVersion;
                setUpdateProgress(100);
                setCurrentStep(t("system_update_completed"));

                if (resData.logs && Array.isArray(resData.logs)) {
                    setExecutionLogs(resData.logs);
                }

                if (resData.updated_files && Array.isArray(resData.updated_files)) {
                    setUpdatedFilesList(resData.updated_files);
                }
                if (resData.migrations_run && Array.isArray(resData.migrations_run)) {
                    setMigrationsRunList(resData.migrations_run);
                }

                setCurrentVersion(newVer);
                setRemoteUpdate(null);
                setUpdateSuccessVersion(newVer);

                toast.success(`🎉 ${t("system_update_completed")}`, {
                    description: `${t("system_updated_to_version")} ${newVer}.`,
                    duration: 8000,
                });

                uiToast({
                    title: t("system_update_completed"),
                    description: `${t("system_updated_to_version")} ${newVer}.`,
                });

                fetchSystemVersion();
            }
        } catch (error: any) {
            console.error("Remote update failed:", error);
            setUpdateProgress(0);
            setCurrentStep(t("error") || "Failed");
            const errorMessage = error.response?.data?.message || error.message || "Failed to complete remote update.";
            setExecutionLogs(prev => [...prev, `[Error] ${errorMessage}`]);
            toast.error(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            {/* Standalone Edge-to-Edge Page Header Banner per AGENTS.md rule */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F3F4FE] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <RefreshCw className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none">
                            {t("system_update")}
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">
                            {t("system_update_desc")}
                        </p>
                    </div>
                </div>
                <Button 
                    variant="gradient" 
                    className="px-5 h-9 text-xs uppercase font-semibold tracking-wider shadow-sm transition-all hover:shadow-md"
                    onClick={handleCheckUpdate}
                    disabled={loadingCheck || updating}
                >
                    {loadingCheck ? (
                        <>
                            <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                            {t("checking")}
                        </>
                    ) : (
                        <>
                            <RefreshCw className="mr-2 h-3.5 w-3.5" />
                            {t("check_for_update")}
                        </>
                    )}
                </Button>
            </div>

            {/* High-Contrast Segmented Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-gray-100/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 w-full sm:w-fit overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setActiveTab("status")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap",
                        activeTab === "status"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-white/80 dark:hover:bg-gray-700/80"
                    )}
                >
                    <Server className="h-3.5 w-3.5" />
                    <span>{t("system_version_status")}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap",
                        activeTab === "upload"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-white/80 dark:hover:bg-gray-700/80"
                    )}
                >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>{t("manual_package_upload")}</span>
                    {selectedFile && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/30 text-white">
                            {toLocaleNumber(1, language?.short_code)}
                        </span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("guidelines")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap",
                        activeTab === "guidelines"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-white/80 dark:hover:bg-gray-700/80"
                    )}
                >
                    <Info className="h-3.5 w-3.5" />
                    <span>{t("update_guidelines")}</span>
                </button>
            </div>

            {/* Tab 1: System Status & Version Overview */}
            {activeTab === "status" && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                    {/* Success Alert Banner when update is completed */}
                    {updateSuccessVersion && (
                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between gap-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
                                    <CheckCircle2 className="h-6 w-6" />
                                </span>
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                                        {t("system_update_completed")}
                                    </h4>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                                        {t("system_updated_to_version")} <strong className="font-bold">{updateSuccessVersion}</strong>.
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setUpdateSuccessVersion(null)}
                                className="text-emerald-700 dark:text-emerald-300 border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-bold"
                            >
                                {t("dismiss")}
                            </Button>
                        </div>
                    )}

                    {/* Remote Update Available Alert Box */}
                    {remoteUpdate?.has_update && (
                        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-indigo-950 font-extrabold text-[11px] rounded-full uppercase tracking-wider shadow">
                                        <Sparkles className="h-3 w-3" /> {t("update_available")} v{remoteUpdate.latest_version}
                                    </div>
                                    <h3 className="text-lg font-bold text-white pt-1">
                                        {t("upgrade_backend_database")}
                                    </h3>
                                    {remoteUpdate.changelog && (
                                        <p className="text-xs text-indigo-200 line-clamp-2 max-w-xl">
                                            {remoteUpdate.changelog}
                                        </p>
                                    )}
                                </div>

                                {remoteUpdate.download_url && (
                                    <Button
                                        onClick={() => handleInstallRemote(remoteUpdate.download_url!)}
                                        disabled={updating}
                                        className="bg-amber-500 hover:bg-amber-400 text-indigo-950 font-bold px-6 h-10 shadow-md text-xs uppercase"
                                    >
                                        <DownloadCloud className="mr-2 h-4 w-4" />
                                        {t("install_now")} (v{remoteUpdate.latest_version})
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* System Information & Version Overview 3 Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Current System Version */}
                        <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/50 border border-indigo-100 p-5 rounded-xl flex flex-col justify-between shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-800/80">
                                        {t("current_version")}
                                    </span>
                                    <h3 className="text-2xl font-black text-indigo-950 mt-1 tracking-tight">
                                        v{currentVersion}
                                    </h3>
                                </div>
                                <span className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-600">
                                    <Server className="h-6 w-6" />
                                </span>
                            </div>
                            <p className="text-[11px] text-indigo-800/80 mt-3 leading-snug">
                                {t("production_branch_desc")}
                            </p>
                        </div>

                        {/* Environment Specs */}
                        <div className="bg-gray-50/70 border border-gray-200/80 p-5 rounded-xl flex flex-col justify-between shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        {t("environment_specs")}
                                    </span>
                                    <h4 className="text-sm font-bold text-gray-800 mt-1">
                                        PHP {systemInfo?.php_version || "8.2+"} • Laravel {systemInfo?.laravel_version || "12.x"}
                                    </h4>
                                </div>
                                <span className="p-2.5 bg-gray-200/60 rounded-lg text-gray-700">
                                    <Database className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="text-[11px] text-gray-600 mt-3 space-y-1">
                                <p className="flex items-center gap-1.5">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                    {t("zip_extension")}: {systemInfo?.zip_enabled !== false ? (
                                        <span className="text-emerald-600 font-semibold">{t("active") || "Active"}</span>
                                    ) : (
                                        <span className="text-amber-600 font-semibold inline-flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" /> {t("missing")}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Automated Upgrader Status */}
                        <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-200/80 p-5 rounded-xl flex flex-col justify-between shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800/80">
                                        {t("updater_status")}
                                    </span>
                                    <h4 className="text-sm font-bold text-amber-900 mt-1">
                                        {remoteUpdate?.has_update 
                                            ? t("new_version_ready") 
                                            : t("system_up_to_date")}
                                    </h4>
                                </div>
                                <span className="p-2.5 bg-amber-500/10 rounded-lg text-amber-700">
                                    <Sparkles className="h-6 w-6" />
                                </span>
                            </div>
                            <p className="text-[11px] text-amber-800/80 mt-3 leading-snug">
                                {t("upload_update_zip_desc")}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Manual ZIP Package Upload Section */}
            {activeTab === "upload" && (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <FileArchive className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800">
                                        {t("upload_update_package")}
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        {t("upload_package_desc")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* File Drag and Drop Box */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3",
                                isDragging 
                                    ? "border-indigo-500 bg-indigo-50/50 scale-[1.005]" 
                                    : selectedFile 
                                        ? "border-emerald-300 bg-emerald-50/30" 
                                        : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50/50"
                            )}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".zip"
                                className="hidden"
                            />

                            {selectedFile ? (
                                <div className="flex flex-col items-center space-y-2">
                                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                        <FileArchive className="h-6 w-6" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-gray-800">{selectedFile.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {toLocaleNumber((selectedFile.size / (1024 * 1024)).toFixed(2), language?.short_code)} MB • {t("ready_for_installation")}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs h-7 mt-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                        }}
                                    >
                                        <X className="h-3.5 w-3.5 mr-1" /> {t("remove_file")}
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <UploadCloud className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">
                                            {t("drag_drop_zip")}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {t("max_zip_size")}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Upload & Execute Button */}
                        {selectedFile && (
                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleUploadUpdate}
                                    disabled={updating}
                                    variant="gradient"
                                    className="px-8 h-10 text-xs uppercase font-bold tracking-wider shadow-md"
                                >
                                    {updating ? (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                            {t("updating_system")}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            {t("upload_execute_update")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Standalone Updated Files & Database Summary */}
                    {updatedFilesList.length > 0 && (
                        <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-5 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-emerald-500 text-white rounded-lg shadow-sm">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-emerald-950">
                                            {t("updated_files_summary")}
                                        </h3>
                                        <p className="text-xs text-emerald-700">
                                            {toLocaleNumber(updatedFilesList.length, language?.short_code)} {t("standalone_files_updated")}
                                        </p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                                    {toLocaleNumber(updatedFilesList.length, language?.short_code)} {t("files_modified") || "Files Modified"}
                                </span>
                            </div>

                            {/* Standalone Files Grid Badges */}
                            <div className="space-y-2">
                                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                                    {t("standalone_updated_files") || "Standalone Updated Files:"}
                                </span>
                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                    {updatedFilesList.map((fileItem, idx) => (
                                        <div
                                            key={idx}
                                            title={`File Path: ${fileItem.path}`}
                                            className="group relative flex items-center gap-2 bg-white border border-emerald-200 hover:border-emerald-400 px-3 py-1.5 rounded-lg shadow-xs transition-all hover:shadow-md cursor-pointer"
                                        >
                                            <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                            <span className="text-xs font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">
                                                {fileItem.name}
                                            </span>
                                            <span className="text-[10px] font-mono text-gray-400 border-l border-gray-200 pl-2 max-w-[180px] truncate">
                                                {fileItem.path}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Executed Migrations List */}
                            {migrationsRunList.length > 0 && (
                                <div className="pt-2 border-t border-emerald-200/80 space-y-2">
                                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                                        {t("database_migrations_executed")}
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {migrationsRunList.map((mig, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 text-xs font-mono font-semibold rounded-md border border-emerald-300">
                                                <Database className="h-3 w-3 text-emerald-600" />
                                                {mig}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Real-time Update Progress & Terminal Logs */}
                    {(updating || executionLogs.length > 0) && (
                        <div className="border border-slate-800 bg-slate-950 text-slate-100 rounded-xl p-5 shadow-lg space-y-4 font-mono text-xs">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Terminal className="h-4 w-4 text-indigo-400" />
                                    <span className="font-bold text-xs">{t("update_output_log")}</span>
                                </div>
                                <span className="text-[11px] text-slate-400">
                                    {t("status_label")}: <span className="text-amber-400 font-semibold">{currentStep}</span>
                                </span>
                            </div>

                            {updating && (
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between text-[11px] text-slate-400">
                                        <span>{t("executing_upgrade_tasks")}</span>
                                        <span>{toLocaleNumber(updateProgress, language?.short_code)}%</span>
                                    </div>
                                    <Progress value={updateProgress} className="h-2 bg-slate-800" />
                                </div>
                            )}

                            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 max-h-56 overflow-y-auto space-y-1.5 text-[11px] leading-relaxed text-slate-300">
                                {executionLogs.map((log, idx) => {
                                    // Parse "Updated file: StandaloneName [path]"
                                    const match = log.match(/^Updated file:\s*([^\s\[]+)\s*\[(.*)\]$/);
                                    if (match) {
                                        return (
                                            <div key={idx} className="flex items-start gap-2">
                                                <span className="text-slate-600 select-none">&gt;</span>
                                                <span className="text-emerald-400 font-semibold">
                                                    Updated file: <strong className="text-emerald-200 font-bold bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-800/60">{match[1]}</strong> <span className="text-slate-400 text-[10px] font-mono ml-1">({match[2]})</span>
                                                </span>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div key={idx} className="flex items-start gap-2">
                                            <span className="text-slate-600 select-none">&gt;</span>
                                            <span className={cn(
                                                log.includes("Error") || log.includes("failed") || log.includes("Warning")
                                                    ? "text-red-400 font-semibold"
                                                    : log.includes("Success") || log.includes("Updated") || log.includes("completed")
                                                        ? "text-emerald-400 font-semibold"
                                                        : "text-slate-300"
                                            )}>
                                                {log}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 3: Update Guidelines & Documentation */}
            {activeTab === "guidelines" && (
                <div className="animate-in fade-in-50 duration-200">
                    <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-2.5 text-blue-900 font-bold text-sm">
                            <Info className="h-5 w-5 text-blue-600" />
                            <span>{t("guidelines_title")}</span>
                        </div>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-950/90 leading-relaxed pl-5 list-disc">
                            <li className="leading-normal">{t("guideline_1")}</li>
                            <li className="leading-normal">{t("guideline_2")}</li>
                            <li className="leading-normal">{t("guideline_3")}</li>
                            <li className="leading-normal">{t("guideline_4")}</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
