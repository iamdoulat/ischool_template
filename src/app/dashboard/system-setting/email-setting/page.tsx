"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";

export default function EmailSettingPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        mail_mailer: "smtp",
        mail_host: "",
        mail_port: "587",
        mail_username: "",
        mail_password: "",
        mail_encryption: "tls",
        mail_from_address: "",
        mail_from_name: "",
    });

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get("/system-setting/email-setting");
            if (response.data.status === "Success") {
                setFormData(response.data.data);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: t("error"),
                description: t("failed_to_fetch_email_settings"),
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await api.post("/system-setting/email-setting", formData);
            if (response.data.status === "Success") {
                toast({
                    title: t("success_title"),
                    description: t("email_settings_updated_successfully"),
                });
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t("error"),
                description: error.response?.data?.message || t("failed_to_save_email_settings"),
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 h-full">
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                <p className="text-sm text-gray-400 font-medium">{t("loading")}</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col items-center">

                {/* Header */}
                <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Mail className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("email_setting")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("configure_smtp_and_outgoing_mail_settings")}</p>
                        </div>
                    </div>
                </div>

                {/* Form Container */}
                <div className="w-full max-w-4xl p-8 space-y-5 animate-in fade-in duration-300">

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">{t("email_engine")} <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-3">
                            <Select
                                value={formData.mail_mailer}
                                onValueChange={(val) => handleChange("mail_mailer", val)}
                            >
                                <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded text-gray-600">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="smtp">SMTP</SelectItem>
                                    <SelectItem value="sendmail">SendMail</SelectItem>
                                    <SelectItem value="phpmail">PHPMail</SelectItem>
                                    <SelectItem value="log">Log</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">{t("email")} <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-3">
                            <Input
                                value={formData.mail_from_address}
                                onChange={(e) => handleChange("mail_from_address", e.target.value)}
                                className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">{t("from_name")} <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-3">
                            <Input
                                value={formData.mail_from_name}
                                onChange={(e) => handleChange("mail_from_name", e.target.value)}
                                className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                            />
                        </div>
                    </div>

                    {formData.mail_mailer === "smtp" && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">{t("smtp_username")} <span className="text-red-500">*</span></Label>
                                <div className="md:col-span-3">
                                    <Input
                                        value={formData.mail_username}
                                        onChange={(e) => handleChange("mail_username", e.target.value)}
                                        className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">{t("smtp_password")} <span className="text-red-500">*</span></Label>
                                <div className="md:col-span-3 relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.mail_password}
                                        onChange={(e) => handleChange("mail_password", e.target.value)}
                                        className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded pr-8"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500"
                                    >
                                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">{t("smtp_server")} <span className="text-red-500">*</span></Label>
                                <div className="md:col-span-3">
                                    <Input
                                        value={formData.mail_host}
                                        onChange={(e) => handleChange("mail_host", e.target.value)}
                                        className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">{t("smtp_port")} <span className="text-red-500">*</span></Label>
                                <div className="md:col-span-3">
                                    <Input
                                        value={formData.mail_port}
                                        onChange={(e) => handleChange("mail_port", e.target.value)}
                                        className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full md:w-32"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">{t("smtp_security")} <span className="text-red-500">*</span></Label>
                                <div className="md:col-span-3">
                                    <Select
                                        value={formData.mail_encryption}
                                        onValueChange={(val) => handleChange("mail_encryption", val)}
                                    >
                                        <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded text-gray-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tls">TLS</SelectItem>
                                            <SelectItem value="ssl">SSL</SelectItem>
                                            <SelectItem value="none">None</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </>
                    )}

                </div>

                {/* Footer Save Action */}
                <div className="w-full border-t border-gray-50 p-6 bg-white flex justify-center mt-auto">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md border-b-2 border-indigo-700 min-w-[120px]"
                    >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                        {saving ? t("loading") : t("save")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
