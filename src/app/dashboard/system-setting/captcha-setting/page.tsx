"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    RadioGroup,
    RadioGroupItem,
} from "@/components/ui/radio-group";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ShieldCheck,
    Loader2,
    Key,
    ExternalLink,
    CheckCircle2,
    Eye,
    EyeOff,
    Sparkles,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { exportData } from "@/lib/export-utils";

interface CaptchaSetting {
    id: number;
    name: string;
    alias: string;
    is_active: boolean;
}

interface CaptchaConfig {
    captcha_type: "math" | "recaptcha" | "turnstile";
    recaptcha_version: "v2" | "v3";
    recaptcha_site_key: string;
    recaptcha_secret_key: string;
    turnstile_site_key: string;
    turnstile_secret_key: string;
    is_active: boolean;
}

export default function CaptchaSettingPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [settings, setSettings] = useState<CaptchaSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingConfig, setSavingConfig] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [showSecretKey, setShowSecretKey] = useState(false);

    // Captcha Provider & Keys State
    const [config, setConfig] = useState<CaptchaConfig>({
        captcha_type: "math",
        recaptcha_version: "v2",
        recaptcha_site_key: "",
        recaptcha_secret_key: "",
        turnstile_site_key: "",
        turnstile_secret_key: "",
        is_active: true,
    });

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/system-setting/captcha-settings");
            const data = res.data?.data;
            if (data) {
                if (Array.isArray(data)) {
                    setSettings(data);
                } else {
                    setSettings(data.modules || []);
                    if (data.config) {
                        setConfig((prev) => ({ ...prev, ...data.config }));
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch captcha settings", error);
            toast("error", t("failed_to_fetch_captcha_settings") || "Failed to load captcha settings.");
        } finally {
            setLoading(false);
        }
    }, [toast, t]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSavingConfig(true);
            const res = await api.post("/system-setting/captcha-settings/config", config);
            if (res.data?.data) {
                setConfig((prev) => ({ ...prev, ...res.data.data }));
            }
            toast("success", "Captcha provider and API keys saved successfully!");
        } catch (error) {
            console.error("Failed to save captcha config", error);
            toast("error", "Failed to save captcha configuration.");
        } finally {
            setSavingConfig(false);
        }
    };

    const toggleSetting = async (id: number) => {
        try {
            setUpdatingId(id);
            const res = await api.post(`/system-setting/captcha-settings/${id}/toggle`);
            const updated = res.data?.data;
            if (updated) {
                setSettings((prev) => prev.map((s) => (s.id === id ? updated : s)));
                toast("success", t("captcha_setting_updated") || "Setting updated successfully.");
            }
        } catch (error) {
            console.error("Failed to update captcha setting", error);
            toast("error", t("failed_to_update_captcha_setting") || "Failed to update setting.");
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = useMemo(
        () =>
            settings.filter((item) =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [settings, searchTerm]
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleExport = (type: "copy" | "excel" | "pdf" | "print") => {
        exportData(type, {
            filename: "captcha-settings",
            title: t("captcha_setting") || "Captcha Settings",
            columns: [t("name") || "Module Name", t("status") || "Status"],
            rows: filtered.map((s) => [s.name, s.is_active ? (t("enabled") || "Enabled") : (t("disabled") || "Disabled")]),
        });
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            {/* Header Banner */}
            <Card className="pt-0 overflow-hidden shadow-xs border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <ShieldCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none">
                                {t("captcha_setting") || "Captcha Settings & Google reCAPTCHA"}
                            </h1>
                            <p className="text-xs text-gray-500 mt-1">
                                {t("captcha_setting_subtitle") || "Configure your Captcha Provider (Math, Google reCAPTCHA, or Cloudflare Turnstile) and enable verification per module."}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Provider & API Keys Configuration (5 cols) */}
                <div className="lg:col-span-5 space-y-5">
                    <Card className="shadow-xs border-gray-200 overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-3.5">
                            <div className="flex items-center gap-2">
                                <Key className="w-4 h-4 text-indigo-600" />
                                <CardTitle className="text-sm font-bold text-gray-800">
                                    Captcha Provider & API Keys
                                </CardTitle>
                            </div>
                            <CardDescription className="text-xs text-gray-500">
                                Select your verification engine and enter your public/secret credentials.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5">
                            <form onSubmit={handleSaveConfig} className="space-y-4">
                                
                                {/* Provider Selector */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-700">Captcha Engine</Label>
                                    <RadioGroup
                                        value={config.captcha_type}
                                        onValueChange={(val: "math" | "recaptcha" | "turnstile") =>
                                            setConfig({ ...config, captcha_type: val })
                                        }
                                        className="grid grid-cols-1 gap-2 pt-1"
                                    >
                                        <div className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${config.captcha_type === 'math' ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                                            <div className="flex items-center space-x-2.5">
                                                <RadioGroupItem value="math" id="math" />
                                                <div>
                                                    <Label htmlFor="math" className="text-xs font-bold text-gray-800 cursor-pointer">
                                                        Mathematical Captcha
                                                    </Label>
                                                    <p className="text-[11px] text-gray-500">Built-in math challenge (e.g. 5 + 3 = ?). No API keys needed.</p>
                                                </div>
                                            </div>
                                            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                        </div>

                                        <div className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${config.captcha_type === 'recaptcha' ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                                            <div className="flex items-center space-x-2.5">
                                                <RadioGroupItem value="recaptcha" id="recaptcha" />
                                                <div>
                                                    <Label htmlFor="recaptcha" className="text-xs font-bold text-gray-800 cursor-pointer">
                                                        Google reCAPTCHA
                                                    </Label>
                                                    <p className="text-[11px] text-gray-500">Industry standard Google security protection (v2 or v3).</p>
                                                </div>
                                            </div>
                                            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                                        </div>

                                        <div className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${config.captcha_type === 'turnstile' ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                                            <div className="flex items-center space-x-2.5">
                                                <RadioGroupItem value="turnstile" id="turnstile" />
                                                <div>
                                                    <Label htmlFor="turnstile" className="text-xs font-bold text-gray-800 cursor-pointer">
                                                        Cloudflare Turnstile
                                                    </Label>
                                                    <p className="text-[11px] text-gray-500">Smart, seamless, privacy-first bot detection.</p>
                                                </div>
                                            </div>
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Google reCAPTCHA Fields */}
                                {config.captcha_type === "recaptcha" && (
                                    <div className="space-y-3.5 pt-2 p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 animate-in fade-in duration-300">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-blue-900">Google reCAPTCHA Settings</span>
                                            <a
                                                href="https://www.google.com/recaptcha/admin"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                                            >
                                                <span>Get Keys</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-semibold text-gray-700">reCAPTCHA Version</Label>
                                            <Select
                                                value={config.recaptcha_version || "v2"}
                                                onValueChange={(val: "v2" | "v3") => setConfig({ ...config, recaptcha_version: val })}
                                            >
                                                <SelectTrigger className="h-8 text-xs bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="v2">v2 (&quot;I&apos;m not a robot&quot; Checkbox)</SelectItem>
                                                    <SelectItem value="v3">v3 (Invisible / Score-based)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-semibold text-gray-700">Site Key</Label>
                                            <Input
                                                placeholder="Enter Google reCAPTCHA Site Key"
                                                value={config.recaptcha_site_key || ""}
                                                onChange={(e) => setConfig({ ...config, recaptcha_site_key: e.target.value })}
                                                className="h-8 text-xs bg-white font-mono"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[11px] font-semibold text-gray-700">Secret Key</Label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSecretKey(!showSecretKey)}
                                                    className="text-[10px] text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                                                >
                                                    {showSecretKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                    {showSecretKey ? "Hide" : "Show"}
                                                </button>
                                            </div>
                                            <Input
                                                type={showSecretKey ? "text" : "password"}
                                                placeholder="Enter Google reCAPTCHA Secret Key"
                                                value={config.recaptcha_secret_key || ""}
                                                onChange={(e) => setConfig({ ...config, recaptcha_secret_key: e.target.value })}
                                                className="h-8 text-xs bg-white font-mono"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Cloudflare Turnstile Fields */}
                                {config.captcha_type === "turnstile" && (
                                    <div className="space-y-3.5 pt-2 p-3.5 bg-orange-50/40 rounded-xl border border-orange-100 animate-in fade-in duration-300">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-orange-950">Cloudflare Turnstile Settings</span>
                                            <a
                                                href="https://dash.cloudflare.com/?to=/:account/turnstile"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:underline"
                                            >
                                                <span>Get Keys</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-semibold text-gray-700">Site Key</Label>
                                            <Input
                                                placeholder="Enter Turnstile Site Key (0x4AAAAAA...)"
                                                value={config.turnstile_site_key || ""}
                                                onChange={(e) => setConfig({ ...config, turnstile_site_key: e.target.value })}
                                                className="h-8 text-xs bg-white font-mono"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[11px] font-semibold text-gray-700">Secret Key</Label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSecretKey(!showSecretKey)}
                                                    className="text-[10px] text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                                                >
                                                    {showSecretKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                    {showSecretKey ? "Hide" : "Show"}
                                                </button>
                                            </div>
                                            <Input
                                                type={showSecretKey ? "text" : "password"}
                                                placeholder="Enter Turnstile Secret Key"
                                                value={config.turnstile_secret_key || ""}
                                                onChange={(e) => setConfig({ ...config, turnstile_secret_key: e.target.value })}
                                                className="h-8 text-xs bg-white font-mono"
                                            />
                                        </div>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={savingConfig}
                                    className="w-full h-9 text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-sm"
                                >
                                    {savingConfig ? (
                                        <>
                                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                            Saving Keys...
                                        </>
                                    ) : (
                                        "Save Captcha Settings"
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Module Toggle Settings (7 cols) */}
                <div className="lg:col-span-7">
                    <Card className="shadow-xs border-gray-200 overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-3.5">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                <CardTitle className="text-sm font-bold text-gray-800">
                                    Module Verification Rules
                                </CardTitle>
                            </div>
                            <CardDescription className="text-xs text-gray-500">
                                Turn Captcha protection ON or OFF for specific portals and forms.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-0">
                            {loading ? (
                                <TableSkeleton rows={6} columns={2} />
                            ) : (
                                <>
                                    {/* Toolbar */}
                                    <div className="p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white border-b border-gray-100">
                                        <div className="relative w-full sm:w-64">
                                            <Input
                                                placeholder={t("search") || "Search modules..."}
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className="h-8 text-xs pl-3 border-gray-200 shadow-none rounded bg-gray-50/50 focus:bg-white transition-colors"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            <Select
                                                value={itemsPerPage.toString()}
                                                onValueChange={(val) => {
                                                    setItemsPerPage(Number(val));
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                <SelectTrigger className="h-7 w-16 text-[11px] border-gray-200 shadow-none rounded bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10</SelectItem>
                                                    <SelectItem value="25">25</SelectItem>
                                                    <SelectItem value="50">50</SelectItem>
                                                    <SelectItem value="100">100</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50" onClick={() => handleExport("copy")}><Copy className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50" onClick={() => handleExport("excel")}><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50" onClick={() => handleExport("pdf")}><FileText className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50" onClick={() => handleExport("print")}><Printer className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Columns className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="p-3 sm:p-4">
                                        <div className="border border-gray-100 rounded-lg overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-gray-50/60">
                                                    <TableRow className="border-b border-gray-100 hover:bg-transparent text-[11px]">
                                                        <TableHead className="h-9 px-4 font-bold text-gray-700 text-[11px] uppercase w-full">
                                                            <div className="flex items-center gap-1">
                                                                {t("name") || "Module Name"} <ArrowUpDown className="h-3 w-3 opacity-30" />
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="h-9 px-4 font-bold text-gray-700 text-[11px] uppercase text-right w-24">
                                                            {t("action") || "Status"}
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {paginated.map((item) => (
                                                        <TableRow key={item.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors h-11">
                                                            <TableCell className="py-2.5 px-4 text-xs text-gray-800 font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <span>{item.name}</span>
                                                                    <span className="text-[10px] text-gray-400 font-mono">({item.alias})</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-2.5 px-4 text-right">
                                                                <div className="flex justify-end items-center gap-2">
                                                                    {updatingId === item.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />}
                                                                    <Switch
                                                                        checked={item.is_active}
                                                                        disabled={updatingId === item.id}
                                                                        onCheckedChange={() => toggleSetting(item.id)}
                                                                        className="data-[state=checked]:bg-[#6366f1] scale-90 transition-all"
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {paginated.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={2} className="h-24 text-center text-xs text-gray-400">
                                                                {t("no_records_found") || "No captcha module records found."}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Pagination */}
                                        <div className="flex items-center justify-between pt-3 px-1">
                                            <p className="text-[11px] text-gray-500 font-medium">
                                                {t("showing") || "Showing"} {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} {t("to") || "to"} {Math.min(currentPage * itemsPerPage, filtered.length)} {t("of") || "of"} {filtered.length} {t("entries") || "entries"}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50"
                                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-3 w-3" />
                                                </Button>
                                                {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((pageNum) => (
                                                    <Button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        variant={currentPage === pageNum ? "pagination-active" : "pagination-inactive"}
                                                        className="h-6 w-6 p-0 text-[10px]"
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                ))}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50"
                                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages || totalPages === 0}
                                                >
                                                    <ChevronRight className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
