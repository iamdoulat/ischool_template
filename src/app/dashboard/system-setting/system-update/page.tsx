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
import { cn } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
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

export default function SystemUpdatePage() {
    const { t } = useTranslation();
    const { settings } = useSettings();

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
                    toast.info(`New version ${updateData.latest_version} available!`);
                } else {
                    toast.success(response.data.message || t("you_are_using_latest_version") || "You are using the latest version.");
                }
            }
        } catch (error) {
            console.error("Failed to check for updates:", error);
            toast.error("Failed to connect to update server.");
        } finally {
            setLoadingCheck(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.name.endsWith('.zip')) {
                toast.error("Please upload a valid .zip update file.");
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
                toast.error("Please upload a valid .zip update file.");
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUploadUpdate = async () => {
        if (!selectedFile) {
            toast.error("Please select an update.zip file first.");
            return;
        }

        setUpdating(true);
        setUpdateProgress(15);
        setCurrentStep("Uploading update.zip package...");
        setExecutionLogs(["[Start] Preparing update.zip package for installation..."]);

        const formData = new FormData();
        formData.append("update_file", selectedFile);

        try {
            setUpdateProgress(40);
            setCurrentStep("Extracting package & overwriting backend files...");
            setExecutionLogs(prev => [...prev, "[Processing] Extracting backend & database files..."]);

            const response = await api.post("/system-setting/system-update/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data && response.data.data) {
                const resData = response.data.data;
                setUpdateProgress(100);
                setCurrentStep("Update process completed successfully!");

                if (resData.logs && Array.isArray(resData.logs)) {
                    setExecutionLogs(resData.logs);
                } else {
                    setExecutionLogs(prev => [...prev, `[Success] System updated to version ${resData.version}`]);
                }

                setCurrentVersion(resData.version || currentVersion);
                toast.success(resData.message || `System updated to version ${resData.version}!`);
                setSelectedFile(null);
                fetchSystemVersion();
            }
        } catch (error: any) {
            console.error("System update failed:", error);
            setUpdateProgress(0);
            setCurrentStep("Update process failed.");
            
            const errorMessage = error.response?.data?.message || "Failed to process system update. Please verify update.zip file.";
            const logs = error.response?.data?.data || [errorMessage];
            setExecutionLogs(Array.isArray(logs) ? logs : [errorMessage]);
            toast.error(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    const handleInstallRemote = async (downloadUrl: string) => {
        setUpdating(true);
        setUpdateProgress(20);
        setCurrentStep("Downloading update package from remote server...");
        setExecutionLogs(["[Start] Initiating remote package download..."]);

        try {
            setUpdateProgress(50);
            setCurrentStep("Processing ZIP package, executing DB migrations...");

            const response = await api.post("/system-setting/system-update/install-remote", {
                download_url: downloadUrl
            });

            if (response.data && response.data.data) {
                const resData = response.data.data;
                setUpdateProgress(100);
                setCurrentStep("Remote update completed!");

                if (resData.logs && Array.isArray(resData.logs)) {
                    setExecutionLogs(resData.logs);
                }

                setCurrentVersion(resData.version || currentVersion);
                setRemoteUpdate(null);
                toast.success(`System successfully upgraded to version ${resData.version}!`);
                fetchSystemVersion();
            }
        } catch (error: any) {
            console.error("Remote update failed:", error);
            setUpdateProgress(0);
            setCurrentStep("Remote update failed.");
            const errorMessage = error.response?.data?.message || error.message || "Failed to complete remote update.";
            setExecutionLogs(prev => [...prev, `[Error] ${errorMessage}`]);
            toast.error(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <Card className="pt-0 overflow-hidden flex flex-col min-h-[400px]">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-6 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F3F4FE] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <RefreshCw className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none">
                                {t("system_update") || "System Update"}
                            </h1>
                            <p className="text-xs text-gray-500 mt-1">
                                Automate backend code updates and database migrations via ZIP package or direct URL.
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant="gradient" 
                        className="px-6 h-9 text-xs uppercase font-semibold tracking-wider shadow-sm transition-all hover:shadow-md"
                        onClick={handleCheckUpdate}
                        disabled={loadingCheck || updating}
                    >
                        <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loadingCheck && "animate-spin")} />
                        {t("check_for_updates") || "Check For Updates"}
                    </Button>
                </div>

                <CardContent className="p-6 space-y-6">
                    {/* Status & Version Dashboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Current Version Card */}
                        <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100/50 border border-emerald-200/80 p-5 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700/80">
                                        Installed System Version
                                    </span>
                                    <h3 className="text-2xl font-black text-emerald-800 mt-1 tracking-tight">
                                        v{currentVersion}
                                    </h3>
                                </div>
                                <span className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-700">
                                    <ShieldCheck className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-700">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                Backend Controlled via .env
                            </div>
                        </div>

                        {/* Environment Diagnostics */}
                        <div className="bg-gradient-to-br from-indigo-50/60 to-slate-50 border border-indigo-100 p-5 rounded-xl flex flex-col justify-between shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700/80">
                                        Server Environment
                                    </span>
                                    <div className="space-y-1 mt-2 text-xs text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <Server className="h-3.5 w-3.5 text-indigo-600" />
                                            <span>PHP: <strong>{systemInfo?.php_version || "8.2+"}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Database className="h-3.5 w-3.5 text-indigo-600" />
                                            <span>Laravel: <strong>{systemInfo?.laravel_version || "12.x"}</strong></span>
                                        </div>
                                    </div>
                                </div>
                                <span className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-700">
                                    <Server className="h-6 w-6" />
                                </span>
                            </div>
                            <div className="mt-3 text-[11px] text-gray-500">
                                Zip Archive Extractor: {systemInfo?.zip_enabled !== false ? (
                                    <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                                        <Check className="h-3 w-3" /> Enabled
                                    </span>
                                ) : (
                                    <span className="text-amber-600 font-semibold inline-flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> Zip extension missing
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Automated Upgrader Status */}
                        <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-200/80 p-5 rounded-xl flex flex-col justify-between shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800/80">
                                        Updater Status
                                    </span>
                                    <h4 className="text-sm font-bold text-amber-900 mt-1">
                                        {remoteUpdate?.has_update ? "New Version Ready" : "System Fully Up To Date"}
                                    </h4>
                                </div>
                                <span className="p-2.5 bg-amber-500/10 rounded-lg text-amber-700">
                                    <Sparkles className="h-6 w-6" />
                                </span>
                            </div>
                            <p className="text-[11px] text-amber-800/80 mt-3 leading-snug">
                                Upload <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono text-[10px]">update.zip</code> to automatically extract new backend code and run database migrations.
                            </p>
                        </div>
                    </div>

                    {/* Remote Update Available Alert Box */}
                    {remoteUpdate?.has_update && (
                        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-indigo-950 font-extrabold text-[11px] rounded-full uppercase tracking-wider shadow">
                                        <Sparkles className="h-3 w-3" /> Update v{remoteUpdate.latest_version} Available
                                    </div>
                                    <h3 className="text-lg font-bold text-white pt-1">
                                        Upgrade iSchool Backend & Database
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
                                        Install v{remoteUpdate.latest_version} Now
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Manual ZIP Package Upload Section */}
                    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <FileArchive className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800">
                                        Upload Update Package (.zip)
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        Select or drag the official system update file containing new backend scripts and database migrations.
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
                                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for installation
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
                                        <X className="h-3.5 w-3.5 mr-1" /> Remove File
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <UploadCloud className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">
                                            Click to browse or drag and drop <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-600 font-mono">update.zip</code> file
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Maximum ZIP package size: 100MB
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
                                            Updating System...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Upload & Execute Update
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Real-time Update Progress & Terminal Logs */}
                    {(updating || executionLogs.length > 0) && (
                        <div className="border border-slate-800 bg-slate-950 text-slate-100 rounded-xl p-5 shadow-lg space-y-4 font-mono text-xs">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Terminal className="h-4 w-4 text-indigo-400" />
                                    <span className="font-bold text-xs">Update Execution Progress & Output Log</span>
                                </div>
                                <span className="text-[11px] text-slate-400">
                                    Status: <span className="text-amber-400 font-semibold">{currentStep}</span>
                                </span>
                            </div>

                            {updating && (
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between text-[11px] text-slate-400">
                                        <span>Executing Upgrade Tasks</span>
                                        <span>{updateProgress}%</span>
                                    </div>
                                    <Progress value={updateProgress} className="h-2 bg-slate-800" />
                                </div>
                            )}

                            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 max-h-56 overflow-y-auto space-y-1.5 text-[11px] leading-relaxed text-slate-300">
                                {executionLogs.map((log, idx) => (
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
                                ))}
                            </div>
                        </div>
                    )}

                    {/* How Update Package Works Instructions */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                            <Info className="h-4 w-4 text-blue-600" />
                            <span>System Update Package Guidelines & Directory Structure</span>
                        </div>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-blue-950/80 leading-relaxed pl-6 list-disc">
                            <li>Place updated backend PHP files inside the ZIP archive. Existing files will be replaced automatically.</li>
                            <li>Put database migrations inside <code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono">database/migrations/</code> to run <code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono">php artisan migrate --force</code>.</li>
                            <li>Include an optional <code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono">version.json</code> file to set the new version string e.g. <code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono">&#123;"version": "1.1.0"&#125;</code>.</li>
                            <li>Sensitive environment files (<code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono">.env</code>), uploads, and vendor folders are strictly protected during extraction.</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
