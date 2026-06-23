"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { FileType2, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";

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

export default function FileTypesPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [setting, setSetting] = useState<FileUploadSetting>(emptySetting);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
    }, [toast]);

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
            toast("success", t("file_upload_settings_saved"));
        } catch (error) {
            console.error("Failed to save file upload settings", error);
            toast("error", t("failed_to_save_file_upload_settings"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <Card className="pt-0 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FileType2 className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("file_types")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("configure_allowed_file_and_image_upload_settings")}</p>
                        </div>
                    </div>
                    {!loading && (
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            variant="gradient"
                            className="px-6 h-8 text-[11px] uppercase"
                        >
                            {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            {t("save")}
                        </Button>
                    )}
                </div>
                <CardContent className="p-0">
                    {loading ? (
                        <FormSkeleton />
                    ) : (
                        <div className="p-6 space-y-8">
                            {/* Setting For Files */}
                            <div className="space-y-4">
                                <h2 className="text-[14px] font-medium text-gray-600 border-b border-gray-100 pb-2">{t("setting_for_files")}</h2>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[12px] font-bold text-gray-700">{t("allowed_extension")} <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            value={setting.file_extension}
                                            onChange={(e) => update("file_extension", e.target.value)}
                                            className="min-h-[80px] text-[12px] bg-white border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[12px] font-bold text-gray-700">{t("allowed_mime_type")} <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            value={setting.file_mime}
                                            onChange={(e) => update("file_mime", e.target.value)}
                                            className="min-h-[100px] text-[12px] bg-white border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[12px] font-bold text-gray-700">{t("upload_size_in_bytes")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="number"
                                            value={setting.file_size}
                                            onChange={(e) => update("file_size", e.target.value)}
                                            className="h-9 text-[12px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Setting For Image */}
                            <div className="space-y-4 pt-4">
                                <h2 className="text-[14px] font-medium text-gray-600 border-b border-gray-100 pb-2">{t("setting_for_image")}</h2>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[12px] font-bold text-gray-700">{t("allowed_extension")} <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            value={setting.image_extension}
                                            onChange={(e) => update("image_extension", e.target.value)}
                                            className="min-h-[60px] text-[12px] bg-white border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[12px] font-bold text-gray-700">{t("allowed_mime_type")} <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            value={setting.image_mime}
                                            onChange={(e) => update("image_mime", e.target.value)}
                                            className="min-h-[60px] text-[12px] bg-white border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[12px] font-bold text-gray-700">{t("upload_size_in_bytes")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="number"
                                            value={setting.image_size}
                                            onChange={(e) => update("image_size", e.target.value)}
                                            className="h-9 text-[12px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-50">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    variant="gradient"
                                    className="px-8 h-8 text-[11px] uppercase"
                                >
                                    {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                    {t("save")}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
