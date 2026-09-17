"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LayoutGrid,
    Wallet,
    UserPlus,
    GraduationCap,
    Users,
    CalendarCheck,
    Bell,
    Clock,
    TrendingUp,
    TrendingDown,
    BookOpen,
    Building2,
    Settings,
    FileText,
    Award,
    Send,
    Loader2,
    Search,
    ChevronUp,
    ChevronDown,
    RotateCcw,
    CheckCircle2,
    SlidersHorizontal,
    LayoutDashboard,
    FileSearch,
    PhoneCall,
    MessageSquareWarning,
    Globe,
    UserX,
    FolderTree,
    Home,
    Landmark,
    Receipt,
    Zap,
    CheckSquare,
    FileSpreadsheet,
    UserCheck,
    Book,
    School,
    Banknote,
    CheckCircle,
    FilePlus,
    List,
    Building,
    Badge,
    Mail,
    MessageSquare,
    MessageCircle,
    Upload,
    Share2,
    Video,
    PackageCheck,
    PackagePlus,
    Package,
    Tags,
    Store,
    Truck,
    MapPin,
    Bus,
    Bed,
    IdCard,
    FileBarChart,
    AlertTriangle,
    ShieldAlert,
    PieChart,
    QrCode,
    ShieldCheck,
    Menu,
    LucideIcon
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { cn, toLocaleNumber } from "@/lib/utils";
import { getShortcutGradientStyle } from "@/lib/shortcut-colors";

const ICON_MAP: Record<string, LucideIcon> = {
    Wallet,
    UserPlus,
    GraduationCap,
    Users,
    CalendarCheck,
    Bell,
    Clock,
    TrendingUp,
    TrendingDown,
    BookOpen,
    Building2,
    Settings,
    FileText,
    Award,
    Send,
    LayoutGrid,
    LayoutDashboard,
    FileSearch,
    PhoneCall,
    MessageSquareWarning,
    Globe,
    UserX,
    FolderTree,
    Home,
    Landmark,
    Receipt,
    Zap,
    CheckSquare,
    FileSpreadsheet,
    UserCheck,
    Book,
    School,
    Banknote,
    CheckCircle,
    FilePlus,
    List,
    Building,
    Badge,
    Mail,
    MessageSquare,
    MessageCircle,
    Upload,
    Share2,
    Video,
    PackageCheck,
    PackagePlus,
    Package,
    Tags,
    Store,
    Truck,
    MapPin,
    Bus,
    Bed,
    IdCard,
    FileBarChart,
    AlertTriangle,
    ShieldAlert,
    PieChart,
    QrCode,
    ShieldCheck,
    Menu,
};

interface ShortcutItem {
    id: string;
    title: string;
    path: string;
    icon: string;
    color?: string;
    category?: string;
    is_active: boolean;
    order: number;
}

type TabType = "catalog" | "active" | "order";

export default function HeaderShortcutsPage() {
    const { toast } = useToast();
    const { t, language } = useTranslation();
    const [items, setItems] = useState<ShortcutItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [activeTab, setActiveTab] = useState<TabType>("catalog");

    const fetchShortcuts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/system-setting/header-shortcuts");
            const list = res.data?.data || res.data || [];
            if (Array.isArray(list) && list.length > 0) {
                setItems(list.sort((a, b) => a.order - b.order));
            }
        } catch (error) {
            console.error("Error loading header shortcuts:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShortcuts();
    }, [fetchShortcuts]);

    const handleToggleActive = (id: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, is_active: !item.is_active };
            }
            return item;
        }));
    };

    const handleMoveUp = (index: number) => {
        if (index <= 0) return;
        setItems(prev => {
            const copy = [...prev];
            const temp = copy[index - 1];
            copy[index - 1] = copy[index];
            copy[index] = temp;
            return copy.map((item, idx) => ({ ...item, order: idx + 1 }));
        });
    };

    const handleMoveDown = (index: number) => {
        if (index >= items.length - 1) return;
        setItems(prev => {
            const copy = [...prev];
            const temp = copy[index + 1];
            copy[index + 1] = copy[index];
            copy[index] = temp;
            return copy.map((item, idx) => ({ ...item, order: idx + 1 }));
        });
    };

    const handleReset = async () => {
        fetchShortcuts();
        toast({ 
            title: t("success") || "Reset", 
            description: t("shortcuts_reset_success") || "Reloaded default shortcuts." 
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const orderedList = items.map((item, idx) => ({
                ...item,
                order: idx + 1,
            }));

            await api.post("/system-setting/header-shortcuts/update", {
                shortcuts: orderedList
            });

            toast({ 
                title: t("success") || "Success", 
                description: t("shortcuts_updated_success") || "Header shortcuts updated successfully." 
            });
        } catch (error) {
            console.error("Error saving header shortcuts:", error);
            toast({ 
                title: t("error") || "Error", 
                description: "Failed to save header shortcuts.", 
                variant: "destructive" 
            });
        } finally {
            setSaving(false);
        }
    };

    // Translation helpers
    const getCategoryLabel = (category: string) => {
        if (!category || category === "All") return t("category_all") || "All";
        const catKey = `category_${category.toLowerCase().replace(/[\s\/\-]+/g, "_")}`;
        const translated = t(catKey);
        if (translated && translated !== catKey) return translated;
        
        const modKey = category.toLowerCase().replace(/[\s\/\-]+/g, "_");
        const modTranslated = t(modKey);
        if (modTranslated && modTranslated !== modKey) return modTranslated;
        
        return category;
    };

    const getShortcutTitle = (item: ShortcutItem) => {
        if (!item) return "";
        if (item.id) {
            const byId = t(item.id);
            if (byId && byId !== item.id) return byId;
        }
        const cleanKey = item.title
            ?.toLowerCase()
            .replace(/&/g, " ")
            .replace(/[\s\/\-]+/g, "_")
            .replace(/^_+|_+$/g, "");
        if (cleanKey) {
            const byTitle = t(cleanKey);
            if (byTitle && byTitle !== cleanKey) return byTitle;
        }
        return item.title;
    };

    const categories = ["All", ...Array.from(new Set(items.map(i => i.category || "General")))];

    const filteredItems = items.filter(item => {
        const titleTrans = getShortcutTitle(item);
        const catTrans = getCategoryLabel(item.category || "General");
        const matchesSearch = 
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            titleTrans.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
            catTrans.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const activeShortcuts = items.filter(i => i.is_active);

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50/30 font-sans">
            {/* Standalone Edge-to-Edge Page Header Banner per AGENTS.md rule */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F3F4FE] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <SlidersHorizontal className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none">
                            {t("header_shortcuts")}
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">
                            {t("header_shortcuts_desc")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        className="h-9 px-4 rounded-full text-xs font-semibold gap-1.5 border-gray-300 hover:bg-gray-100"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {t("reload_defaults")}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        {t("save_shortcuts")}
                    </Button>
                </div>
            </div>

            {/* High-Contrast Segmented Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-gray-100/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 w-full sm:w-fit overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setActiveTab("catalog")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer",
                        activeTab === "catalog"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-white/80 dark:hover:bg-gray-700/80"
                    )}
                >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>{t("tab_shortcut_catalog")}</span>
                    <span className={cn(
                        "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                        activeTab === "catalog" ? "bg-white/30 text-white" : "bg-gray-200 text-gray-700"
                    )}>
                        {toLocaleNumber(items.length, language?.short_code)}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("active")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer",
                        activeTab === "active"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-white/80 dark:hover:bg-gray-700/80"
                    )}
                >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{t("tab_active_shortcuts")}</span>
                    <span className={cn(
                        "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                        activeTab === "active" ? "bg-white/30 text-white" : "bg-emerald-100 text-emerald-800"
                    )}>
                        {toLocaleNumber(activeShortcuts.length, language?.short_code)}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("order")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer",
                        activeTab === "order"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-white/80 dark:hover:bg-gray-700/80"
                    )}
                >
                    <List className="h-3.5 w-3.5" />
                    <span>{t("tab_display_order")}</span>
                </button>
            </div>

            {/* Live Header Preview Bar */}
            <Card className="border-indigo-100 shadow-sm bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                <CardHeader className="py-3 px-5 border-b border-indigo-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4" />
                            {t("live_header_shortcuts_preview")} ({toLocaleNumber(activeShortcuts.length, language?.short_code)} {t("active") || "active"})
                        </CardTitle>
                        <span className="text-[11px] text-indigo-600 font-medium">
                            {t("active_shortcuts_banner_desc")}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="p-4 overflow-x-auto">
                    {activeShortcuts.length > 0 ? (
                        <div className="flex items-center gap-3 py-2 min-w-max">
                            {activeShortcuts.map((item) => {
                                const IconComp = ICON_MAP[item.icon] || LayoutGrid;
                                return (
                                    <div
                                        key={item.id}
                                        className="flex flex-col items-center p-3 rounded-2xl bg-white border border-indigo-100 shadow-sm min-w-[85px] max-w-[110px] text-center"
                                    >
                                        <div
                                            style={getShortcutGradientStyle(item.color)}
                                            className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md drop-shadow-xs shrink-0"
                                        >
                                            <IconComp className="h-5 w-5" />
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-700 mt-2 truncate w-full">
                                            {getShortcutTitle(item)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-4 text-center text-xs text-indigo-400 italic">
                            {t("no_active_shortcuts_selected")}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tab 1: Shortcut Catalog & Layout */}
            {activeTab === "catalog" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in-50 duration-200">
                    {/* Left Column: Shortcut Catalog (8 Cols) */}
                    <div className="lg:col-span-8 space-y-4">
                        <Card className="border-gray-200 shadow-sm">
                            <CardHeader className="py-4 px-5 bg-gray-50/50 border-b border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <CardTitle className="text-sm font-bold text-gray-800">
                                        {t("tab_shortcut_catalog")} ({toLocaleNumber(filteredItems.length, language?.short_code)} {t("shortcuts_count")})
                                    </CardTitle>
                                    <div className="relative w-full sm:w-64">
                                        <Input
                                            placeholder={t("search_module_or_submenu")}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 h-8 text-xs rounded-xl"
                                        />
                                        <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    </div>
                                </div>

                                {/* Category Filter Pills */}
                                <div className="flex items-center gap-1.5 flex-wrap pt-3">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat)}
                                            className={cn(
                                                "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                                                selectedCategory === cat
                                                    ? "bg-indigo-600 text-white shadow-xs"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            )}
                                        >
                                            {getCategoryLabel(cat)}
                                        </button>
                                    ))}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                {loading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                                        ))}
                                    </div>
                                ) : filteredItems.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[680px] overflow-y-auto custom-scrollbar p-1">
                                        {filteredItems.map((item) => {
                                            const IconComp = ICON_MAP[item.icon] || LayoutGrid;
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleToggleActive(item.id)}
                                                    className={cn(
                                                        "flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group",
                                                        item.is_active
                                                          ? "border-indigo-300 bg-indigo-50/30 shadow-sm"
                                                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div
                                                            style={getShortcutGradientStyle(item.color)}
                                                            className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform drop-shadow-xs"
                                                        >
                                                            <IconComp className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-gray-800 truncate">
                                                                {getShortcutTitle(item)}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 truncate">
                                                                {getCategoryLabel(item.category || "General")}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0 ml-2",
                                                        item.is_active
                                                            ? "bg-[#6366f1] border-[#6366f1] text-white"
                                                            : "border-gray-300 bg-gray-50 text-transparent group-hover:border-gray-400"
                                                    )}>
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-xs text-gray-400">
                                        {t("no_shortcuts_found")} &quot;{searchQuery}&quot;.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Reorder Active Shortcuts (4 Cols) */}
                    <div className="lg:col-span-4 space-y-4">
                        <Card className="border-gray-200 shadow-sm">
                            <CardHeader className="py-4 px-5 bg-gray-50/50 border-b border-gray-200">
                                <CardTitle className="text-sm font-bold text-gray-800">
                                    {t("active_display_order")} ({toLocaleNumber(activeShortcuts.length, language?.short_code)})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2 max-h-[680px] overflow-y-auto custom-scrollbar">
                                {items.map((item, index) => {
                                    const IconComp = ICON_MAP[item.icon] || LayoutGrid;
                                    return (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all",
                                                item.is_active
                                                    ? "border-gray-200 bg-white shadow-sm"
                                                    : "border-gray-100 bg-gray-50 opacity-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="text-[10px] font-bold text-gray-400 w-4 text-center">
                                                    {toLocaleNumber(index + 1, language?.short_code)}
                                                </span>
                                                <div
                                                    style={getShortcutGradientStyle(item.color)}
                                                    className="w-7 h-7 rounded-lg text-white flex items-center justify-center shrink-0 drop-shadow-xs"
                                                >
                                                    <IconComp className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="font-semibold text-gray-700 truncate">
                                                    {getShortcutTitle(item)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveUp(index)}
                                                    disabled={index === 0}
                                                    className="h-6 w-6 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title={t("move_up")}
                                                >
                                                    <ChevronUp className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMoveDown(index)}
                                                    disabled={index === items.length - 1}
                                                    className="h-6 w-6 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title={t("move_down")}
                                                >
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Tab 2: Active Shortcuts Focus View */}
            {activeTab === "active" && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                    <Card className="border-gray-200 shadow-sm">
                        <CardHeader className="py-4 px-5 bg-gray-50/50 border-b border-gray-200">
                            <CardTitle className="text-sm font-bold text-gray-800 flex items-center justify-between">
                                <span>{t("tab_active_shortcuts")} ({toLocaleNumber(activeShortcuts.length, language?.short_code)} {t("shortcuts_count")})</span>
                                <span className="text-xs font-normal text-gray-500">
                                    {t("active_shortcuts_banner_desc")}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {activeShortcuts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-1">
                                    {activeShortcuts.map((item) => {
                                        const IconComp = ICON_MAP[item.icon] || LayoutGrid;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => handleToggleActive(item.id)}
                                                className="flex items-center justify-between p-3.5 rounded-2xl border border-indigo-300 bg-indigo-50/30 shadow-sm transition-all cursor-pointer group hover:bg-indigo-50/60"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div
                                                        style={getShortcutGradientStyle(item.color)}
                                                        className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform drop-shadow-xs"
                                                    >
                                                        <IconComp className="h-5 w-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-800 truncate">
                                                            {getShortcutTitle(item)}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 truncate">
                                                            {getCategoryLabel(item.category || "General")}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="w-6 h-6 rounded-full border bg-[#6366f1] border-[#6366f1] text-white flex items-center justify-center transition-all shrink-0 ml-2">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-xs text-gray-400 italic">
                                    {t("no_active_shortcuts_selected")}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tab 3: Display Order Full View */}
            {activeTab === "order" && (
                <div className="space-y-4 animate-in fade-in-50 duration-200">
                    <Card className="border-gray-200 shadow-sm max-w-2xl mx-auto">
                        <CardHeader className="py-4 px-5 bg-gray-50/50 border-b border-gray-200">
                            <CardTitle className="text-sm font-bold text-gray-800">
                                {t("active_display_order")} ({toLocaleNumber(activeShortcuts.length, language?.short_code)})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                            {items.map((item, index) => {
                                const IconComp = ICON_MAP[item.icon] || LayoutGrid;
                                return (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border text-xs transition-all",
                                            item.is_active
                                                ? "border-gray-200 bg-white shadow-sm"
                                                : "border-gray-100 bg-gray-50 opacity-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-xs font-bold text-gray-400 w-6 text-center">
                                                {toLocaleNumber(index + 1, language?.short_code)}
                                            </span>
                                            <div
                                                style={getShortcutGradientStyle(item.color)}
                                                className="w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 drop-shadow-xs"
                                            >
                                                <IconComp className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-800 block truncate">
                                                    {getShortcutTitle(item)}
                                                </span>
                                                <span className="text-[10px] text-gray-400 block truncate">
                                                    {getCategoryLabel(item.category || "General")}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleMoveUp(index)}
                                                disabled={index === 0}
                                                className="h-7 px-2.5 rounded-lg text-xs gap-1"
                                                title={t("move_up")}
                                            >
                                                <ChevronUp className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">{t("move_up")}</span>
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleMoveDown(index)}
                                                disabled={index === items.length - 1}
                                                className="h-7 px-2.5 rounded-lg text-xs gap-1"
                                                title={t("move_down")}
                                            >
                                                <ChevronDown className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">{t("move_down")}</span>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
