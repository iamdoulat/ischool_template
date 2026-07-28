"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Plus,
    Upload,
    RotateCcw,
    Download,
    Trash2,
    CloudUpload,
    Eye,
    EyeOff,
    Loader2,
    Copy,
    Check,
    Database,
    Archive,
    Cloud,
    Save,
    Clock,
    Server,
    HardDrive
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useBaseUrl } from "@/lib/image-url";
import { ConfirmDialog } from "@/components/dashboard/system-setting/backup-restore/confirm-dialog";

interface BackupFile {
    id: number;
    filename: string;
    path: string;
    size: string;
    destination?: string;
    created_at: string;
}

interface BackupSettings {
    auto_backup_enabled: boolean;
    backup_type: "db" | "full";
    frequency: "daily" | "weekly" | "monthly";
    schedule_time: string;
    destination: "local" | "s3" | "gdrive";
    aws_access_key_id: string;
    aws_secret_access_key: string;
    aws_default_region: string;
    aws_bucket: string;
    gdrive_client_id: string;
    gdrive_client_secret: string;
    gdrive_refresh_token: string;
    gdrive_folder_id: string;
}

export default function BackupRestorePage() {
    const { t } = useTranslation();
    const baseApiUrl = useBaseUrl();
    const apiRoot = `${baseApiUrl}/api/v1`;
    const [backups, setBackups] = useState<BackupFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [creatingType, setCreatingType] = useState<"db" | "full" | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [cronKey, setCronKey] = useState("");
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [copied, setCopied] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);

    const [settings, setSettings] = useState<BackupSettings>({
        auto_backup_enabled: false,
        backup_type: "db",
        frequency: "daily",
        schedule_time: "02:00",
        destination: "local",
        aws_access_key_id: "",
        aws_secret_access_key: "",
        aws_default_region: "us-east-1",
        aws_bucket: "",
        gdrive_client_id: "",
        gdrive_client_secret: "",
        gdrive_refresh_token: "",
        gdrive_folder_id: ""
    });

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        type: "delete" | "restore" | "upload-restore";
        id?: number;
    } | null>(null);

    const { toast } = useToast();

    const fetchBackups = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/system-setting/backups");
            if (response.data.status === "Success") {
                setBackups(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch backups", error);
            toast("error", t("failed_to_fetch_backup_history"));
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const fetchCronKey = useCallback(async () => {
        try {
            const response = await api.get("/system-setting/backups/cron-key");
            if (response.data.status === "Success") {
                setCronKey(response.data.cron_secret_key || "");
            }
        } catch (error) {
            console.error("Failed to fetch cron key", error);
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            const response = await api.get("/system-setting/backups/settings");
            if (response.data.status === "Success" && response.data.data) {
                setSettings(prev => ({ ...prev, ...response.data.data }));
            }
        } catch (error) {
            console.error("Failed to fetch backup settings", error);
        }
    }, []);

    useEffect(() => {
        fetchBackups();
        fetchCronKey();
        fetchSettings();
    }, [fetchBackups, fetchCronKey, fetchSettings]);

    const handleCreateBackup = async (type: "db" | "full") => {
        try {
            setCreatingType(type);
            toast("info", type === "full" ? "Creating full system & uploads backup (.zip)..." : "Creating database backup (.sql)...");
            const response = await api.post("/system-setting/backups", {
                type,
                destination: settings.destination
            });
            if (response.data.status === "Success") {
                toast("success", type === "full" ? "Full system backup (.zip) created successfully!" : t("backup_created_successfully"));
                fetchBackups();
            } else {
                toast("error", response.data.message || t("failed_to_create_backup"));
            }
        } catch (error: any) {
            console.error("Failed to create backup", error);
            const errorMsg = error.response?.data?.message || t("failed_to_create_backup");
            toast("error", errorMsg);
        } finally {
            setCreatingType(null);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setSavingSettings(true);
            const response = await api.put("/system-setting/backups/settings", settings);
            if (response.data.status === "Success") {
                toast("success", "Automated backup & cloud destination settings saved!");
            }
        } catch (error) {
            console.error("Failed to save backup settings", error);
            toast("error", "Failed to save backup settings");
        } finally {
            setSavingSettings(false);
        }
    };

    const handleDelete = async (id: number) => {
        setConfirmAction({ type: "delete", id });
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!confirmAction?.id) return;
        try {
            setConfirmLoading(true);
            const response = await api.delete(`/system-setting/backups/${confirmAction.id}`);
            if (response.data.status === "Success") {
                toast("success", t("backup_deleted_successfully"));
                fetchBackups();
            }
        } catch (error) {
            console.error("Failed to delete backup", error);
            toast("error", t("failed_to_delete_backup"));
        } finally {
            setConfirmLoading(false);
            setConfirmOpen(false);
            setConfirmAction(null);
        }
    };

    const handleRestore = async (id: number) => {
        setConfirmAction({ type: "restore", id });
        setConfirmOpen(true);
    };

    const confirmRestore = async (id?: number) => {
        const targetId = id || confirmAction?.id;
        if (!targetId) return;
        try {
            setConfirmLoading(true);
            toast("success", t("restoration_started"));
            const response = await api.post(`/system-setting/backups/${targetId}/restore`);
            if (response.data.status === "Success") {
                toast("success", response.data.message || t("database_restored_successfully"));
            }
        } catch (error) {
            console.error("Failed to restore database", error);
            toast("error", t("failed_to_restore_database"));
        } finally {
            setConfirmLoading(false);
            setConfirmOpen(false);
            setConfirmAction(null);
        }
    };

    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    const handleDownload = async (id: number, filename?: string) => {
        try {
            setDownloadingId(id);
            const response = await api.get(`/system-setting/backups/${id}/download`, {
                responseType: "blob"
            });

            let downloadName = filename || `backup_${id}.sql`;
            const disposition = response.headers["content-disposition"];
            if (disposition && disposition.includes("filename=")) {
                const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (match && match[1]) {
                    downloadName = match[1].replace(/['"]/g, "");
                }
            }

            const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", downloadName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast("success", t("backup_downloaded_successfully"));
        } catch (error) {
            console.error("Failed to download backup", error);
            toast("error", t("failed_to_download_backup"));
        } finally {
            setDownloadingId(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast("error", t("please_select_a_file_first"));
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("file", selectedFile);

            const response = await api.post("/system-setting/backups/upload", formData);

            if (response.data.status === "Success") {
                toast("success", t("backup_uploaded_successfully"));
                setSelectedFile(null);
                fetchBackups();

                setConfirmAction({ type: "upload-restore", id: response.data.data.id });
                setConfirmOpen(true);
            } else {
                toast("error", response.data.message || t("failed_to_upload_backup"));
            }
        } catch (error: any) {
            console.error("Failed to upload backup", error);
            const errorMsg = error.response?.data?.message || t("failed_to_upload_backup");
            toast("error", errorMsg);
        } finally {
            setUploading(false);
        }
    };

    const handleRegenerateKey = async () => {
        try {
            const response = await api.post("/system-setting/backups/cron-key/regenerate");
            if (response.data.status === "Success") {
                setCronKey(response.data.cron_secret_key);
                toast("success", t("cron_key_regenerated_successfully"));
            }
        } catch (error) {
            console.error("Failed to regenerate cron key", error);
            toast("error", t("failed_to_regenerate_cron_key"));
        }
    };

    const copyCronUrl = () => {
        const url = `${apiRoot}/cron?key=${cronKey}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast("success", t("cron_url_copied_to_clipboard"));
        setTimeout(() => setCopied(false), 2000);
    };

    const renderDestinationBadge = (dest?: string) => {
        const d = (dest || "local").toLowerCase();
        if (d === "s3") {
            return (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                    <Cloud className="h-3 w-3 text-amber-500" />
                    Amazon S3
                </span>
            );
        }
        if (d === "gdrive") {
            return (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                    <Server className="h-3 w-3 text-emerald-500" />
                    Google Drive
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                <HardDrive className="h-3 w-3 text-slate-500" />
                Local Storage
            </span>
        );
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Top Header Card */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Archive className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("backup_history")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">Manage database dumps, full file backups, and automated cloud sync</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        onClick={() => handleCreateBackup("db")}
                        disabled={creatingType !== null}
                        className="bg-gradient-to-r from-[#FF8C42] to-[#6D5BFE] hover:from-[#f97316] hover:to-[#5c4ae4] text-white px-4 h-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-md gap-1.5 border-none"
                    >
                        {creatingType === "db" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
                        Create DB Backup (.sql)
                    </Button>
                    <Button
                        onClick={() => handleCreateBackup("full")}
                        disabled={creatingType !== null}
                        className="bg-gradient-to-r from-[#6366F1] to-[#a855f7] hover:from-[#4f46e5] hover:to-[#9333ea] text-white px-4 h-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-md gap-1.5 border-none"
                    >
                        {creatingType === "full" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                        Create Full Backup (.zip)
                    </Button>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column: Backup History Table */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-[13px] font-medium text-gray-700">{t("backup_history")}</h2>
                            <span className="text-[11px] text-gray-400 font-medium">{backups.length} {t("files")}</span>
                        </div>

                        <div className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                                            <TableHead className="h-9 text-[11px] font-semibold text-gray-600 px-4">{t("backup_file")}</TableHead>
                                            <TableHead className="h-9 text-[11px] font-semibold text-gray-600 px-4">Destination</TableHead>
                                            <TableHead className="h-9 text-[11px] font-semibold text-gray-600 px-4 text-right">{t("action")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-gray-400">
                                                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                                                    <span className="text-[11px]">{t("loading_backup_history")}...</span>
                                                </TableCell>
                                            </TableRow>
                                        ) : backups.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-gray-400 text-[11px] uppercase font-bold">
                                                    {t("no_backups_found")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            backups.map((file) => {
                                                const isZip = file.filename.endsWith(".zip");
                                                return (
                                                    <TableRow key={file.id} className="border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm relative transition-all duration-300 cursor-pointer group">
                                                        <TableCell className="py-2.5 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black uppercase shrink-0 shadow-xs",
                                                                    isZip ? "bg-purple-100 text-purple-600 border border-purple-200" : "bg-blue-100 text-blue-600 border border-blue-200"
                                                                )}>
                                                                    {isZip ? <Archive className="h-4 w-4" /> : <Database className="h-4 w-4" />}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span
                                                                        onClick={() => handleDownload(file.id, file.filename)}
                                                                        className="text-[11px] font-bold text-gray-800 hover:text-indigo-600 hover:underline cursor-pointer transition-colors truncate"
                                                                    >
                                                                        {file.filename}
                                                                    </span>
                                                                    <div className="flex items-center gap-2 text-[9px] text-gray-400 font-mono mt-0.5">
                                                                        <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase", isZip ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600")}>
                                                                            {isZip ? "FULL (.ZIP)" : "DB (.SQL)"}
                                                                        </span>
                                                                        <span>{file.size}</span>
                                                                        <span>•</span>
                                                                        <span>{new Date(file.created_at).toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-2.5 px-4">
                                                            {renderDestinationBadge(file.destination)}
                                                        </TableCell>
                                                        <TableCell className="py-2.5 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <Button
                                                                    onClick={() => handleDownload(file.id, file.filename)}
                                                                    disabled={downloadingId === file.id}
                                                                    className="h-7 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs transition-all text-[10px] font-bold uppercase gap-1 border-none"
                                                                >
                                                                    {downloadingId === file.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                                                    {t("download")}
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleRestore(file.id)}
                                                                    className="h-7 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all text-[10px] font-bold uppercase gap-1 border-none"
                                                                >
                                                                    <RotateCcw className="h-3 w-3" />
                                                                    {t("restore")}
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleDelete(file.id)}
                                                                    className="h-7 px-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition-all text-[10px] font-bold uppercase gap-1 border-none"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                    {t("delete")}
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Automated Schedule, Cloud Sync & Upload */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Automated Backup & Cloud Settings */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="border-b border-gray-50 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-indigo-600" />
                                <h2 className="text-[13px] font-bold text-gray-800">Auto Backup & Cloud Destination</h2>
                            </div>
                            <Switch
                                checked={settings.auto_backup_enabled}
                                onCheckedChange={(val) => setSettings(prev => ({ ...prev, auto_backup_enabled: val }))}
                            />
                        </div>

                        <div className="p-4 space-y-3 text-left">
                            <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-gray-700">Backup Scope</Label>
                                <Select
                                    value={settings.backup_type}
                                    onValueChange={(val: "db" | "full") => setSettings(prev => ({ ...prev, backup_type: val }))}
                                >
                                    <SelectTrigger className="h-8 text-[11px]">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="db">Database Only (.sql)</SelectItem>
                                        <SelectItem value="full">Full System (Database + Complete Project Root .zip)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-bold text-gray-700">Frequency</Label>
                                    <Select
                                        value={settings.frequency}
                                        onValueChange={(val: "daily" | "weekly" | "monthly") => setSettings(prev => ({ ...prev, frequency: val }))}
                                    >
                                        <SelectTrigger className="h-8 text-[11px]">
                                            <SelectValue placeholder="Frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-bold text-gray-700">Scheduled Time</Label>
                                    <Input
                                        type="time"
                                        value={settings.schedule_time}
                                        onChange={(e) => setSettings(prev => ({ ...prev, schedule_time: e.target.value }))}
                                        className="h-8 text-[11px]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[11px] font-bold text-gray-700">Destination</Label>
                                <Select
                                    value={settings.destination}
                                    onValueChange={(val: "local" | "s3" | "gdrive") => setSettings(prev => ({ ...prev, destination: val }))}
                                >
                                    <SelectTrigger className="h-8 text-[11px]">
                                        <SelectValue placeholder="Select Destination" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="local">Local Storage</SelectItem>
                                        <SelectItem value="s3">AWS S3 Cloud Storage</SelectItem>
                                        <SelectItem value="gdrive">Google Drive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* AWS S3 Settings */}
                            {settings.destination === "s3" && (
                                <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-2 mt-2">
                                    <p className="text-[10px] font-bold uppercase text-indigo-700">AWS S3 Credentials</p>
                                    <Input
                                        placeholder="AWS Access Key ID"
                                        value={settings.aws_access_key_id}
                                        onChange={(e) => setSettings(prev => ({ ...prev, aws_access_key_id: e.target.value }))}
                                        className="h-7 text-[10px] bg-white"
                                    />
                                    <Input
                                        type="password"
                                        placeholder="AWS Secret Access Key"
                                        value={settings.aws_secret_access_key}
                                        onChange={(e) => setSettings(prev => ({ ...prev, aws_secret_access_key: e.target.value }))}
                                        className="h-7 text-[10px] bg-white"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            placeholder="Region (e.g. us-east-1)"
                                            value={settings.aws_default_region}
                                            onChange={(e) => setSettings(prev => ({ ...prev, aws_default_region: e.target.value }))}
                                            className="h-7 text-[10px] bg-white"
                                        />
                                        <Input
                                            placeholder="S3 Bucket Name"
                                            value={settings.aws_bucket}
                                            onChange={(e) => setSettings(prev => ({ ...prev, aws_bucket: e.target.value }))}
                                            className="h-7 text-[10px] bg-white"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Google Drive Settings */}
                            {settings.destination === "gdrive" && (
                                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-2 mt-2">
                                    <p className="text-[10px] font-bold uppercase text-emerald-700">Google Drive API Credentials</p>
                                    <Input
                                        placeholder="Client ID"
                                        value={settings.gdrive_client_id}
                                        onChange={(e) => setSettings(prev => ({ ...prev, gdrive_client_id: e.target.value }))}
                                        className="h-7 text-[10px] bg-white"
                                    />
                                    <Input
                                        type="password"
                                        placeholder="Client Secret"
                                        value={settings.gdrive_client_secret}
                                        onChange={(e) => setSettings(prev => ({ ...prev, gdrive_client_secret: e.target.value }))}
                                        className="h-7 text-[10px] bg-white"
                                    />
                                    <Input
                                        placeholder="Refresh Token"
                                        value={settings.gdrive_refresh_token}
                                        onChange={(e) => setSettings(prev => ({ ...prev, gdrive_refresh_token: e.target.value }))}
                                        className="h-7 text-[10px] bg-white"
                                    />
                                    <Input
                                        placeholder="Drive Folder ID (Optional)"
                                        value={settings.gdrive_folder_id}
                                        onChange={(e) => setSettings(prev => ({ ...prev, gdrive_folder_id: e.target.value }))}
                                        className="h-7 text-[10px] bg-white"
                                    />
                                </div>
                            )}

                            <div className="pt-2 border-t border-gray-100 flex justify-end">
                                <Button
                                    onClick={handleSaveSettings}
                                    disabled={savingSettings}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 h-8 text-[11px] font-bold uppercase rounded-full shadow-sm gap-1.5 border-none"
                                >
                                    {savingSettings ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                    Save Auto Backup Settings
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Upload Box */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="border-b border-gray-50 p-4">
                            <h2 className="text-[13px] font-medium text-gray-700">{t("upload_from_local_directory")}</h2>
                        </div>

                        <div className="p-4 space-y-4">
                            <label className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors group relative">
                                <Input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                    accept=".sql,.zip"
                                />
                                <CloudUpload className="h-8 w-8 text-gray-300 group-hover:text-indigo-400 transition-colors mb-2" />
                                <p className="text-[11px] text-gray-500 font-medium">
                                    {selectedFile ? selectedFile.name : t("drag_and_drop_a_file_here_or_click")}
                                </p>
                                <span className="text-[9px] text-gray-400 mt-1 uppercase">Supports .SQL & .ZIP Backups</span>
                            </label>

                            <div className="flex justify-end pt-2 border-t border-gray-50">
                                <Button
                                    onClick={handleUpload}
                                    disabled={uploading || !selectedFile}
                                    className="bg-gradient-to-r from-[#FF8C42] to-[#6D5BFE] hover:from-[#f97316] hover:to-[#5c4ae4] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg gap-1.5 border-none"
                                >
                                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                    {t("upload")}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Cron Key Box */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-50">
                            <h2 className="text-[13px] font-medium text-gray-700">{t("cron_secret_key")}</h2>
                            <Button
                                onClick={handleRegenerateKey}
                                className="bg-gradient-to-r from-[#FF8C42] to-[#6D5BFE] hover:from-[#f97316] hover:to-[#5c4ae4] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg border-none"
                            >
                                {t("regenerate")}
                            </Button>
                        </div>

                        <div className="p-4 relative min-h-[60px]">
                            <div className="flex flex-col gap-2">
                                <div className="relative">
                                    <Input
                                        readOnly
                                        value={showKey ? cronKey : "********************************"}
                                        className="h-8 text-[11px] font-mono border-transparent bg-transparent shadow-none px-0 "
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowKey(!showKey)}
                                        className="h-6 text-[10px] text-gray-500 hover:text-gray-700 px-2"
                                    >
                                        {showKey ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                                        {showKey ? t("hide_key") : t("show_key")}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={copyCronUrl}
                                        className="h-6 text-[10px] text-indigo-600 border-indigo-200 hover:bg-indigo-50 px-2"
                                    >
                                        {copied ? <Check className="h-3 w-3 mr-1 text-green-600" /> : <Copy className="h-3 w-3 mr-1" />}
                                        {copied ? t("copied") : t("copy_cron_url")}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog for Delete / Restore */}
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={(open) => {
                    setConfirmOpen(open);
                    if (!open) setConfirmAction(null);
                }}
                loading={confirmLoading}
                title={
                    confirmAction?.type === "delete"
                        ? t("delete_backup") || "Delete Backup"
                        : confirmAction?.type === "restore"
                        ? t("restore_backup") || "Restore Backup"
                        : t("restore_uploaded_backup") || "Restore Uploaded Backup"
                }
                description={
                    confirmAction?.type === "delete"
                        ? t("are_you_sure_you_want_to_delete_this_backup") || "Are you sure you want to delete this backup file?"
                        : t("are_you_sure_you_want_to_restore_this_backup") || "Restoring a backup will overwrite current database records. Proceed?"
                }
                confirmText={confirmAction?.type === "delete" ? t("delete") || "Delete" : t("restore") || "Restore"}
                variant={confirmAction?.type === "delete" ? "destructive" : "warning"}
                onConfirm={() => {
                    if (confirmAction?.type === "delete") confirmDelete();
                    else if (confirmAction?.type === "restore" || confirmAction?.type === "upload-restore") confirmRestore();
                }}
            />
        </div>
    );
}
