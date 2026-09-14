"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { 
    FileType2, 
    Loader2, 
    FileText, 
    Image as ImageIcon, 
    SlidersHorizontal,
    Info,
    CheckCircle2,
    HardDrive
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { clearFileUploadSettingsCache } from "@/lib/file-validation";
import { cn, toLocaleNumber } from "@/lib/utils";

interface FileUploadSetting {
    id?: number;
    file_extension: string;
    file_mime: string;
    file_size: number | string;
    image_extension: string;
    image_mime: string;
    image_size: number | string;
}

const emptySetting: FileUploadSetting = {
    file_extension: "",
    file_mime: "",
    file_size: "",
    image_extension: "",
    image_mime: "",
    image_size: "",
};

function FormSkeleton() {
    return (
        <div className="p-6 space-y-8 animate-pulse">
            {Array.from({ length: 2 }).map((_, s) => (
                <div key={s} className="space-y-4">
                    <div className="h-4 w-40 bg-gray-200/60 rounded border-b" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-3 w-32 bg-gray-200/60 rounded" />
                            <div className="h-16 w-full bg-gray-200/60 rounded" />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

type TabType = "all" | "files" | "images";

export default function FileTypesPage() {
    const { t, language } = useTranslation();
    const { toast } = useToast();
    const [setting, setSetting] = useState<FileUploadSetting>(emptySetting);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("all");

    const fetchSetting = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/system-setting/file-types");
            const data = res.data?.data;
            if (data) {
                setSetting({
                    id: data.id,
                    file_extension: data.file_extension || "",
                    file_mime: data.file_mime || "",
                    file_size: data.file_size ?? "",
                    image_extension: data.image_extension || "",
                    image_mime: data.image_mime || "",
                    image_size: data.image_size ?? "",
                });
            }
        } catch (error) {
            console.error("Failed to fetch file upload settings", error);
            toast("error", t("failed_to_fetch_file_upload_settings"));
        } finally {
            setLoading(false);
        }
    }, [toast, t]);

    useEffect(() => {
        fetchSetting();
    }, [fetchSetting]);

    const update = (key: keyof FileUploadSetting, value: string) =>
        setSetting((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.post("/system-setting/file-types", {
                file_extension: setting.file_extension,
                file_mime: setting.file_mime,
                file_size: Number(setting.file_size) || 0,
                image_extension: setting.image_extension,
                image_mime: setting.image_mime,
                image_size: Number(setting.image_size) || 0,
            });
            clearFileUploadSettingsCache();
            toast("success", t("file_upload_settings_saved"));
        } catch (error) {
            console.error("Failed to save file upload settings", error);
            toast("error", t("failed_to_save_file_upload_settings"));
        } finally {
            setSaving(false);
        }
    };

    const formatBytes = (bytes: number | string) => {
        const num = Number(bytes);
        if (!num || isNaN(num)) return null;
        if (num >= 1048576) {
            return `${toLocaleNumber((num / 1048576).toFixed(2), language?.short_code)} MB`;
        }
        if (num >= 1024) {
            return `${toLocaleNumber((num / 1024).toFixed(2), language?.short_code)} KB`;
        }
        return `${toLocaleNumber(num, language?.short_code)} Bytes`;
    };

    const renderFilesCard = () => (
        <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="py-3.5 px-5 bg-indigo-50/40 border-b border-indigo-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    {t("setting_for_files")}
                </CardTitle>
                <span className="text-[11px] font-medium text-indigo-700 bg-indigo-100/60 px-2.5 py-0.5 rounded-full">
                    PDF, DOC, XLS, ZIP
                </span>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                        <span>{t("allowed_extension")} <span className="text-red-500">*</span></span>
                        <span className="text-[10px] text-gray-400 font-normal">
                            {t("extensions_hint")}
                        </span>
                    </Label>
                    <Textarea
                        value={setting.file_extension}
                        onChange={(e) => update("file_extension", e.target.value)}
                        placeholder="pdf, doc, docx, xls, xlsx, ppt, pptx, txt, zip, rar"
                        className="min-h-[75px] text-xs bg-white border-gray-200 focus:ring-indigo-500 rounded-lg resize-y leading-relaxed font-mono"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                        <span>{t("allowed_mime_type")} <span className="text-red-500">*</span></span>
                        <span className="text-[10px] text-gray-400 font-normal">
                            {t("mime_types_hint")}
                        </span>
                    </Label>
                    <Textarea
                        value={setting.file_mime}
                        onChange={(e) => update("file_mime", e.target.value)}
                        placeholder="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="min-h-[90px] text-xs bg-white border-gray-200 focus:ring-indigo-500 rounded-lg resize-y leading-relaxed font-mono text-gray-600"
                    />
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-gray-700">
                            {t("upload_size_in_bytes")} <span className="text-red-500">*</span>
                        </Label>
                        {formatBytes(setting.file_size) && (
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                {t("size_preview_calc")} {formatBytes(setting.file_size)}
                            </span>
                        )}
                    </div>
                    <Input
                        type="number"
                        value={setting.file_size}
                        onChange={(e) => update("file_size", e.target.value)}
                        className="h-9 text-xs border-gray-200 focus:ring-indigo-500 rounded-lg w-full font-mono"
                    />
                </div>
            </CardContent>
        </Card>
    );

    const renderImagesCard = () => (
        <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="py-3.5 px-5 bg-amber-50/40 border-b border-amber-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-amber-600" />
                    {t("setting_for_image")}
                </CardTitle>
                <span className="text-[11px] font-medium text-amber-800 bg-amber-100/60 px-2.5 py-0.5 rounded-full">
                    PNG, JPG, JPEG, WEBP, SVG
                </span>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                        <span>{t("allowed_extension")} <span className="text-red-500">*</span></span>
                        <span className="text-[10px] text-gray-400 font-normal">
                            {t("extensions_hint")}
                        </span>
                    </Label>
                    <Textarea
                        value={setting.image_extension}
                        onChange={(e) => update("image_extension", e.target.value)}
                        placeholder="jpg, jpeg, png, gif, webp, svg"
                        className="min-h-[75px] text-xs bg-white border-gray-200 focus:ring-amber-500 rounded-lg resize-y leading-relaxed font-mono"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                        <span>{t("allowed_mime_type")} <span className="text-red-500">*</span></span>
                        <span className="text-[10px] text-gray-400 font-normal">
                            {t("mime_types_hint")}
                        </span>
                    </Label>
                    <Textarea
                        value={setting.image_mime}
                        onChange={(e) => update("image_mime", e.target.value)}
                        placeholder="image/jpeg, image/png, image/gif, image/webp, image/svg+xml"
                        className="min-h-[90px] text-xs bg-white border-gray-200 focus:ring-amber-500 rounded-lg resize-y leading-relaxed font-mono text-gray-600"
                    />
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-gray-700">
                            {t("upload_size_in_bytes")} <span className="text-red-500">*</span>
                        </Label>
                        {formatBytes(setting.image_size) && (
                            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                {t("size_preview_calc")} {formatBytes(setting.image_size)}
                            </span>
                        )}
                    </div>
                    <Input
                        type="number"
                        value={setting.image_size}
                        onChange={(e) => update("image_size", e.target.value)}
                        className="h-9 text-xs border-gray-200 focus:ring-amber-500 rounded-lg w-full font-mono"
                    />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-4 md:p-6 bg-gray-50/30 font-sans space-y-6 min-h-screen">
            {/* Standalone Edge-to-Edge Page Header Banner per AGENTS.md rule */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F3F4FE] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <FileType2 className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none">{t("file_types")}</h1>
                        <p className="text-xs text-gray-500 mt-1">{t("configure_allowed_file_and_image_upload_settings")}</p>
                    </div>
                </div>

                {!loading && (
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-6 h-9 text-xs font-bold uppercase transition-all rounded-full shadow-md border-none min-w-[120px] active:scale-95"
                    >
                        {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                        {t("save")}
                    </Button>
                )}
            </div>

            {/* High-Contrast Segmented Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-gray-100/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 w-full sm:w-fit overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer",
                        activeTab === "all"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-white/80 dark:hover:bg-gray-700/80"
                    )}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>{t("tab_all_settings")}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("files")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer",
                        activeTab === "files"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-white/80 dark:hover:bg-gray-700/80"
                    )}
                >
                    <FileText className="h-3.5 w-3.5" />
                    <span>{t("tab_files")}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("images")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer",
                        activeTab === "images"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-white/80 dark:hover:bg-gray-700/80"
                    )}
                >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>{t("tab_images")}</span>
                </button>
            </div>

            {loading ? (
                <Card className="border-gray-200 shadow-sm bg-white">
                    <FormSkeleton />
                </Card>
            ) : (
                <div className="space-y-6 animate-in fade-in-50 duration-200">
                    {/* Tab 1: All Upload Settings (Side-by-side or stacked grid) */}
                    {activeTab === "all" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {renderFilesCard()}
                            {renderImagesCard()}
                        </div>
                    )}

                    {/* Tab 2: Focused Files Settings */}
                    {activeTab === "files" && (
                        <div className="max-w-3xl mx-auto">
                            {renderFilesCard()}
                        </div>
                    )}

                    {/* Tab 3: Focused Image Settings */}
                    {activeTab === "images" && (
                        <div className="max-w-3xl mx-auto">
                            {renderImagesCard()}
                        </div>
                    )}

                    {/* Bottom Save Action Bar */}
                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-8 h-9 text-xs font-bold uppercase transition-all rounded-full shadow-md border-none min-w-[140px] active:scale-95"
                        >
                            {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-2 h-3.5 w-3.5" />}
                            {t("save")}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
