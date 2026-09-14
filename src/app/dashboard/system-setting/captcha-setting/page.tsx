"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/components/providers/language-provider";
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
import { toast } from "sonner";
import { exportData } from "@/lib/export-utils";
import { toLocaleNumber } from "@/lib/utils";

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
    const { language } = useLanguage();
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
            const [resModules, resConfig] = await Promise.all([
                api.get("/system-setting/captcha-settings").catch(() => null),
                api.get("/system-setting/captcha-settings/config").catch(() => null),
            ]);

            const rawModules = resModules?.data?.data || resModules?.data || [];
            let modulesList: CaptchaSetting[] = [];
            if (Array.isArray(rawModules)) {
                modulesList = rawModules;
            } else if (Array.isArray(rawModules.modules)) {
                modulesList = rawModules.modules;
            } else if (Array.isArray(rawModules.data)) {
                modulesList = rawModules.data;
            }
            setSettings(modulesList);

            const rawConfig = resConfig?.data?.data || resConfig?.data;
            if (rawConfig && typeof rawConfig === "object") {
                setConfig((prev) => ({ ...prev, ...rawConfig }));
            }
        } catch (error) {
            console.error("Failed to fetch captcha settings", error);
            toast.error(t("failed_to_fetch_captcha_settings"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSavingConfig(true);
            const res = await api.post("/system-setting/captcha-settings/config", config);
            const saved = res.data?.data || res.data;
            if (saved && typeof saved === "object") {
                setConfig((prev) => ({ ...prev, ...saved }));
            }
            toast.success(t("captcha_config_saved_successfully"));
        } catch (error) {
            console.error("Failed to save captcha config", error);
            toast.error(t("failed_to_save_captcha_config"));
        } finally {
            setSavingConfig(false);
        }
    };

    const toggleSetting = async (id: number) => {
        try {
            setUpdatingId(id);
            const res = await api.post(`/system-setting/captcha-settings/${id}/toggle`);
            const updated = res.data?.data || res.data;
            if (updated && updated.id) {
                setSettings((prev) =>
                    (Array.isArray(prev) ? prev : []).map((s) => (s.id === id ? updated : s))
                );
                toast.success(t("captcha_setting_updated"));
            }
        } catch (error) {
            console.error("Failed to update captcha setting", error);
            toast.error(t("failed_to_update_captcha_setting"));
        } finally {
            setUpdatingId(null);
        }
    };

    const translateModuleName = (name: string, alias: string): string => {
        const key = (alias || name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const directLookup = t(key);
        if (directLookup && directLookup !== key) return directLookup;

        const aliasMap: Record<string, string> = {
            user_login: t("user_login"),
            login: t("login"),
            student_login: t("student_login"),
            parent_login: t("parent_login"),
            teacher_login: t("teacher_login"),
            staff_login: t("staff_login"),
            admin_login: t("admin_login"),
            online_admission: t("online_admission"),
            complain: t("complain"),
            complaint: t("complain"),
            contact_us: t("contact_us"),
            visitor_registration: t("visitor_registration"),
        };

        if (aliasMap[key]) return aliasMap[key];
        return name;
    };

    const filtered = useMemo(() => {
        const list = Array.isArray(settings) ? settings : [];
        return list.filter((item) =>
            (item?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item?.alias || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [settings, searchTerm]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleExport = (type: "copy" | "excel" | "pdf" | "print") => {
        exportData(type, {
            filename: "captcha-settings",
            title: t("captcha_setting"),
            columns: [t("module_name"), t("status")],
            rows: filtered.map((s) => [
                translateModuleName(s.name, s.alias),
                s.is_active ? t("enabled") : t("disabled")
            ]),
        });
    };

    return (
        <div className="p-4 space-y-5 bg-gray-50/10 min-h-screen font-sans">
            {/* Page Header Banner (Mandatory Rule: Edge-to-edge gradient div, NEVER inside Card) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("captcha_setting")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("captcha_setting_subtitle")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Provider & API Keys Configuration (5 cols) */}
                <div className="lg:col-span-5 space-y-5">
                    <Card className="rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-5 py-3.5">
                            <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                                    <Key className="w-4 h-4" />
                                </span>
                                <div>
                                    <CardTitle className="text-[13px] font-bold text-gray-800 leading-tight">
                                        {t("captcha_provider_and_api_keys")}
                                    </CardTitle>
                                    <CardDescription className="text-[10px] text-gray-500 mt-0.5">
                                        {t("captcha_provider_subtitle")}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            <form onSubmit={handleSaveConfig} className="space-y-4">
                                {/* Provider Selector */}
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-gray-700">
                                        {t("captcha_engine")}
                                    </Label>
                                    <RadioGroup
                                        value={config.captcha_type}
                                        onValueChange={(val: "math" | "recaptcha" | "turnstile") =>
                                            setConfig({ ...config, captcha_type: val })
                                        }
                                        className="grid grid-cols-1 gap-2 pt-1"
                                    >
                                        <div className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${config.captcha_type === 'math' ? 'border-indigo-500 bg-indigo-50/40 shadow-xs' : 'border-gray-200 hover:bg-gray-50'}`}>
                                            <div className="flex items-center space-x-2.5">
                                                <RadioGroupItem value="math" id="math" />
                                                <div>
                                                    <Label htmlFor="math" className="text-xs font-bold text-gray-800 cursor-pointer">
                                                        {t("mathematical_captcha")}
                                                    </Label>
                                                    <p className="text-[11px] text-gray-500">
                                                        {t("mathematical_captcha_desc")}
                                                    </p>
                                                </div>
                                            </div>
                                            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                                        </div>

                                        <div className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${config.captcha_type === 'recaptcha' ? 'border-indigo-500 bg-indigo-50/40 shadow-xs' : 'border-gray-200 hover:bg-gray-50'}`}>
                                            <div className="flex items-center space-x-2.5">
                                                <RadioGroupItem value="recaptcha" id="recaptcha" />
                                                <div>
                                                    <Label htmlFor="recaptcha" className="text-xs font-bold text-gray-800 cursor-pointer">
                                                        {t("google_recaptcha")}
                                                    </Label>
                                                    <p className="text-[11px] text-gray-500">
                                                        {t("google_recaptcha_desc")}
                                                    </p>
                                                </div>
                                            </div>
                                            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                                        </div>

                                        <div className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${config.captcha_type === 'turnstile' ? 'border-indigo-500 bg-indigo-50/40 shadow-xs' : 'border-gray-200 hover:bg-gray-50'}`}>
                                            <div className="flex items-center space-x-2.5">
                                                <RadioGroupItem value="turnstile" id="turnstile" />
                                                <div>
                                                    <Label htmlFor="turnstile" className="text-xs font-bold text-gray-800 cursor-pointer">
                                                        {t("cloudflare_turnstile")}
                                                    </Label>
                                                    <p className="text-[11px] text-gray-500">
                                                        {t("cloudflare_turnstile_desc")}
                                                    </p>
                                                </div>
                                            </div>
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Google reCAPTCHA Fields */}
                                {config.captcha_type === "recaptcha" && (
                                    <div className="space-y-3.5 pt-2 p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 animate-in fade-in duration-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-blue-900">
                                                {t("google_recaptcha_settings")}
                                            </span>
                                            <a
                                                href="https://www.google.com/recaptcha/admin"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                                            >
                                                <span>{t("get_keys")}</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-bold text-gray-700">
                                                {t("recaptcha_version")}
                                            </Label>
                                            <Select
                                                value={config.recaptcha_version || "v2"}
                                                onValueChange={(val: "v2" | "v3") => setConfig({ ...config, recaptcha_version: val })}
                                            >
                                                <SelectTrigger className="h-8 text-xs bg-white rounded-lg border-gray-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="v2">{t("recaptcha_v2_checkbox")}</SelectItem>
                                                    <SelectItem value="v3">{t("recaptcha_v3_invisible")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-bold text-gray-700">
                                                {t("site_key")}
                                            </Label>
                                            <Input
                                                placeholder={t("enter_recaptcha_site_key")}
                                                value={config.recaptcha_site_key || ""}
                                                onChange={(e) => setConfig({ ...config, recaptcha_site_key: e.target.value })}
                                                className="h-8 text-xs bg-white font-mono rounded-lg border-gray-200"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[11px] font-bold text-gray-700">
                                                    {t("secret_key")}
                                                </Label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSecretKey(!showSecretKey)}
                                                    className="text-[10px] text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                                                >
                                                    {showSecretKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                    {showSecretKey ? t("hide") : t("show")}
                                                </button>
                                            </div>
                                            <Input
                                                type={showSecretKey ? "text" : "password"}
                                                placeholder={t("enter_recaptcha_secret_key")}
                                                value={config.recaptcha_secret_key || ""}
                                                onChange={(e) => setConfig({ ...config, recaptcha_secret_key: e.target.value })}
                                                className="h-8 text-xs bg-white font-mono rounded-lg border-gray-200"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Cloudflare Turnstile Fields */}
                                {config.captcha_type === "turnstile" && (
                                    <div className="space-y-3.5 pt-2 p-3.5 bg-orange-50/40 rounded-xl border border-orange-100 animate-in fade-in duration-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-orange-950">
                                                {t("cloudflare_turnstile_settings")}
                                            </span>
                                            <a
                                                href="https://dash.cloudflare.com/?to=/:account/turnstile"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:underline"
                                            >
                                                <span>{t("get_keys")}</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[11px] font-bold text-gray-700">
                                                {t("site_key")}
                                            </Label>
                                            <Input
                                                placeholder={t("enter_turnstile_site_key")}
                                                value={config.turnstile_site_key || ""}
                                                onChange={(e) => setConfig({ ...config, turnstile_site_key: e.target.value })}
                                                className="h-8 text-xs bg-white font-mono rounded-lg border-gray-200"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[11px] font-bold text-gray-700">
                                                    {t("secret_key")}
                                                </Label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSecretKey(!showSecretKey)}
                                                    className="text-[10px] text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                                                >
                                                    {showSecretKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                    {showSecretKey ? t("hide") : t("show")}
                                                </button>
                                            </div>
                                            <Input
                                                type={showSecretKey ? "text" : "password"}
                                                placeholder={t("enter_turnstile_secret_key")}
                                                value={config.turnstile_secret_key || ""}
                                                onChange={(e) => setConfig({ ...config, turnstile_secret_key: e.target.value })}
                                                className="h-8 text-xs bg-white font-mono rounded-lg border-gray-200"
                                            />
                                        </div>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={savingConfig}
                                    className="w-full h-9 text-[11px] font-bold uppercase bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-sm rounded-lg active:scale-95 transition-all"
                                >
                                    {savingConfig ? (
                                        <>
                                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                            {t("saving_keys")}
                                        </>
                                    ) : (
                                        t("save_captcha_settings")
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Module Toggle Settings (7 cols) */}
                <div className="lg:col-span-7">
                    <Card className="rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-5 py-3.5">
                            <div className="flex items-center gap-2">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                                    <ShieldCheck className="w-4 h-4" />
                                </span>
                                <div>
                                    <CardTitle className="text-[13px] font-bold text-gray-800 leading-tight">
                                        {t("module_verification_rules")}
                                    </CardTitle>
                                    <CardDescription className="text-[10px] text-gray-500 mt-0.5">
                                        {t("module_verification_rules_subtitle")}
                                    </CardDescription>
                                </div>
                            </div>
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
                                                placeholder={t("search_modules")}
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className="h-8 text-xs pl-3 border-gray-200 shadow-none rounded-lg bg-gray-50/50 focus:bg-white transition-colors"
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
                                                <SelectTrigger className="h-7 w-16 text-[11px] border-gray-200 shadow-none rounded-lg bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">{toLocaleNumber(10, language?.short_code)}</SelectItem>
                                                    <SelectItem value="25">{toLocaleNumber(25, language?.short_code)}</SelectItem>
                                                    <SelectItem value="50">{toLocaleNumber(50, language?.short_code)}</SelectItem>
                                                    <SelectItem value="100">{toLocaleNumber(100, language?.short_code)}</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => handleExport("copy")}><Copy className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => handleExport("excel")}><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => handleExport("pdf")}><FileText className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => handleExport("print")}><Printer className="h-3.5 w-3.5" /></Button>
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
                                                                {t("module_name")} <ArrowUpDown className="h-3 w-3 opacity-30" />
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="h-9 px-4 font-bold text-gray-700 text-[11px] uppercase text-right w-24">
                                                            {t("status")}
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {paginated.map((item) => (
                                                        <TableRow key={item.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors h-11">
                                                            <TableCell className="py-2.5 px-4 text-xs text-gray-800 font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-gray-700">
                                                                        {translateModuleName(item.name, item.alias)}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                                        ({item.alias})
                                                                    </span>
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
                                                                {t("no_records_found")}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Pagination */}
                                        <div className="flex items-center justify-between pt-3 px-1">
                                            <p className="text-[11px] text-gray-500 font-medium">
                                                {t("showing")} {toLocaleNumber(filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1, language?.short_code)} {t("to")} {toLocaleNumber(Math.min(currentPage * itemsPerPage, filtered.length), language?.short_code)} {t("of")} {toLocaleNumber(filtered.length, language?.short_code)} {t("entries")}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50 rounded"
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
                                                        className="h-6 w-6 p-0 text-[10px] rounded"
                                                    >
                                                        {toLocaleNumber(pageNum, language?.short_code)}
                                                    </Button>
                                                ))}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50 rounded"
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
