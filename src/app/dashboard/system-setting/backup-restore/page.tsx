"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Check
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
import { ConfirmDialog } from "@/components/dashboard/system-setting/backup-restore/confirm-dialog";

interface BackupFile {
    id: number;
    filename: string;
    path: string;
    size: string;
    created_at: string;
}

export default function BackupRestorePage() {
    const [backups, setBackups] = useState<BackupFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [cronKey, setCronKey] = useState("");
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [copied, setCopied] = useState(false);

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
            toast("error", "Failed to fetch backup history");
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

    useEffect(() => {
        fetchBackups();
        fetchCronKey();
    }, [fetchBackups, fetchCronKey]);

    const handleCreateBackup = async () => {
        try {
            setCreating(true);
            const response = await api.post("/system-setting/backups");
            if (response.data.status === "Success") {
                toast("success", "Backup created successfully");
                fetchBackups();
            } else {
                toast("error", response.data.message || "Failed to create backup");
            }
        } catch (error: any) {
            console.error("Failed to create backup", error);
            const errorMsg = error.response?.data?.message || "Failed to create backup";
            toast("error", errorMsg);
        } finally {
            setCreating(false);
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
                toast("success", "Backup deleted successfully");
                fetchBackups();
            }
        } catch (error) {
            console.error("Failed to delete backup", error);
            toast("error", "Failed to delete backup");
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
            toast("success", "Restoration started. Please wait...");
            const response = await api.post(`/system-setting/backups/${targetId}/restore`);
            if (response.data.status === "Success") {
                toast("success", "Database restored successfully");
            }
        } catch (error) {
            console.error("Failed to restore database", error);
            toast("error", "Failed to restore database");
        } finally {
            setConfirmLoading(false);
            setConfirmOpen(false);
            setConfirmAction(null);
        }
    };

    const handleDownload = (id: number) => {
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/system-setting/backups/${id}/download`;
        window.open(url, '_blank');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast("error", "Please select a file first");
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append("file", selectedFile);

            const response = await api.post("/system-setting/backups/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (response.data.status === "Success") {
                toast("success", "Backup uploaded successfully");
                setSelectedFile(null);
                fetchBackups();

                // Ask to restore immediately
                setConfirmAction({ type: "upload-restore", id: response.data.data.id });
                setConfirmOpen(true);
            }
        } catch (error) {
            console.error("Failed to upload backup", error);
            toast("error", "Failed to upload backup");
        } finally {
            setUploading(false);
        }
    };

    const handleRegenerateKey = async () => {
        try {
            const response = await api.post("/system-setting/backups/cron-key/regenerate");
            if (response.data.status === "Success") {
                setCronKey(response.data.cron_secret_key);
                toast("success", "Cron secret key regenerated");
            }
        } catch (error) {
            console.error("Failed to regenerate cron key", error);
            toast("error", "Failed to regenerate cron key");
        }
    };

    const copyToClipboard = () => {
        const cronCommand = `curl "${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/cron/backup-db?secret_key=${cronKey}"`;
        navigator.clipboard.writeText(cronCommand);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast("success", "Cron command copied to clipboard");
    };

    const getConfirmData = () => {
        switch (confirmAction?.type) {
            case "delete":
                return {
                    title: "Delete Backup?",
                    description: "This will permanently delete the backup file from the server history. This action cannot be undone.",
                    confirmText: "Yes, Delete",
                    variant: "destructive" as const,
                    onConfirm: confirmDelete
                };
            case "restore":
                return {
                    title: "Restore Database?",
                    description: "RESTORE DATABASE? This will overwrite your current database with this backup. This is a critical action! Proceed with extreme caution.",
                    confirmText: "Yes, Restore",
                    variant: "warning" as const,
                    onConfirm: () => confirmRestore()
                };
            case "upload-restore":
                return {
                    title: "Restore Uploaded Backup?",
                    description: "The backup has been uploaded. Do you want to RESTORE it now and overwrite your current database?",
                    confirmText: "Yes, Restore Now",
                    variant: "warning" as const,
                    onConfirm: () => confirmRestore(confirmAction.id)
                };
            default:
                return {
                    title: "",
                    description: "",
                    confirmText: "",
                    variant: "default" as const,
                    onConfirm: () => { }
                };
        }
    };

    const confirmData = getConfirmData();

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* Left Column: Backup History */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-50">
                        <h2 className="text-[13px] font-medium text-gray-700">Backup History</h2>
                        <Button
                            onClick={handleCreateBackup}
                            disabled={creating}
                            className="bg-gradient-to-r from-[#FF8C42] to-[#6D5BFE] hover:from-[#f97316] hover:to-[#5c4ae4] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg gap-1.5 border-none"
                        >
                            {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                            Create Backup
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="p-4">
                        <div className="border border-gray-100 rounded overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                        <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase">Backup Files</TableHead>
                                        <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase text-right w-[300px]">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                                                <p className="text-[11px] text-gray-400 mt-2 uppercase font-bold tracking-widest">Loading History...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : backups.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-gray-400 text-[11px] uppercase font-bold">
                                                No backups found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        backups.map((file) => (
                                            <TableRow key={file.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors group">
                                                <TableCell className="py-2 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-medium text-blue-500 hover:text-blue-600 hover:underline cursor-pointer transition-colors">
                                                            {file.filename}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 font-mono">{file.size} • {new Date(file.created_at).toLocaleString()}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 opacity-90 hover:opacity-100">
                                                        <Button
                                                            onClick={() => handleDownload(file.id)}
                                                            className="h-6 px-2 rounded bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white shadow-sm transition-all text-[9px] font-semibold uppercase gap-1 border-none"
                                                        >
                                                            <Download className="h-2.5 w-2.5" />
                                                            Download
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleRestore(file.id)}
                                                            className="h-6 px-2 rounded bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-sm transition-all text-[9px] font-semibold uppercase gap-1 border-none"
                                                        >
                                                            <RotateCcw className="h-2.5 w-2.5" />
                                                            Restore
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDelete(file.id)}
                                                            className="h-6 px-2 rounded bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-sm transition-all text-[9px] font-semibold uppercase gap-1 border-none"
                                                        >
                                                            <Trash2 className="h-2.5 w-2.5" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Upload & Cron Key */}
            <div className="lg:col-span-1 space-y-4">

                {/* Upload Box */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-50 p-4">
                        <h2 className="text-[13px] font-medium text-gray-700">Upload From Local Directory</h2>
                    </div>

                    <div className="p-4 space-y-4">
                        <label className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors group relative">
                            <Input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                accept=".sql"
                            />
                            <CloudUpload className="h-8 w-8 text-gray-300 group-hover:text-indigo-400 transition-colors mb-2" />
                            <p className="text-[11px] text-gray-500 font-medium">
                                {selectedFile ? selectedFile.name : "Drag and drop a file here or click"}
                            </p>
                        </label>

                        <div className="flex justify-end pt-2 border-t border-gray-50">
                            <Button
                                onClick={handleUpload}
                                disabled={uploading || !selectedFile}
                                className="bg-gradient-to-r from-[#FF8C42] to-[#6D5BFE] hover:from-[#f97316] hover:to-[#5c4ae4] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg gap-1.5 border-none"
                            >
                                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                                Upload
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Cron Key Box */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-gray-50">
                        <h2 className="text-[13px] font-medium text-gray-700">Cron Secret Key</h2>
                        <Button
                            onClick={handleRegenerateKey}
                            className="bg-gradient-to-r from-[#FF8C42] to-[#6D5BFE] hover:from-[#f97316] hover:to-[#5c4ae4] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg border-none"
                        >
                            Regenerate
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

                            <div className="absolute bottom-2 right-4">
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Backup Schedule Box */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-50">
                        <h2 className="text-[13px] font-medium text-gray-700">Backup Schedule Cron</h2>
                    </div>
                    <div className="p-4 space-y-3">
                        <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold tracking-tight">
                            Use this command in your VPS cron tab to automate backups (e.g., daily at midnight):
                        </p>
                        <div className="bg-gray-900 rounded p-3 relative group">
                            <code className="text-gray-300 text-[10px] break-all block pr-8">
                                0 0 * * * curl "{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/cron/backup-db?secret_key={cronKey}"
                            </code>
                            <button
                                onClick={copyToClipboard}
                                className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
                            >
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                loading={confirmLoading}
                title={confirmData.title}
                description={confirmData.description}
                confirmText={confirmData.confirmText}
                variant={confirmData.variant}
                onConfirm={confirmData.onConfirm}
            />
        </div>
    );
}
