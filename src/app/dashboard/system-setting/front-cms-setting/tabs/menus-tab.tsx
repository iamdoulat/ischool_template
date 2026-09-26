"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Menu,
    Pencil,
    Trash2,
    Loader2,
    Link as LinkIcon,
    GripVertical,
} from "lucide-react";
import { cn, toLocaleNumber } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/components/providers/language-provider";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface MenuItem {
    id: number;
    title: string;
    is_external: boolean;
    open_new_tab: boolean;
    url?: string;
    page?: string;
    type: string;
    parent_id?: number | null;
    order: number;
    column?: number;
    sub_items?: MenuItem[];
}

function MenuSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-1/3 rounded" />
                        <Skeleton className="h-2.5 w-1/2 rounded" />
                    </div>
                    <Skeleton className="h-6 w-12 rounded" />
                </div>
            ))}
        </div>
    );
}

export function MenusTab() {
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const tt = useTranslateToast();

    const [activeTab, setActiveTab] = useState<"main" | "bottom">("main");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [pages, setPages] = useState<{ id: number; title: string; url: string }[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const frontendUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");

    const [form, setForm] = useState({
        title: "",
        is_external: false,
        open_new_tab: false,
        url: "",
        page: "",
        column: 1,
    });

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchPages = useCallback(async () => {
        try {
            const res = await api.get("front-cms/pages");
            const data = res.data?.data?.data || res.data?.data || res.data || [];
            if (Array.isArray(data)) setPages(data);
        } catch {
            console.error("Failed to load pages");
        }
    }, []);

    const fetchMenus = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/menus");
            const data = res.data?.data?.data || res.data?.data || res.data || [];
            if (Array.isArray(data)) setMenus(data);
        } catch {
            tt.error("failed_to_load_menus");
        } finally {
            setLoading(false);
        }
    }, [tt]);

    useEffect(() => {
        fetchMenus();
        fetchPages();
    }, [fetchMenus, fetchPages]);

    const handleSave = async () => {
        if (!form.title) {
            tt.error("title_is_required");
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form, type: activeTab };
            if (editingId) {
                await api.put(`front-cms/menus/${editingId}`, payload);
            } else {
                await api.post("front-cms/menus", payload);
            }
            tt.success(editingId ? "menu_item_updated" : "menu_item_added");
            handleCancel();
            fetchMenus();
        } catch {
            tt.error("failed_to_save_menu");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item: MenuItem) => {
        setEditingId(item.id);
        setActiveTab(item.type as "main" | "bottom");
        setForm({
            title: item.title,
            is_external: item.is_external,
            open_new_tab: item.open_new_tab,
            url: item.url || "",
            page: item.page || "",
            column: item.column || 1,
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm({
            title: "",
            is_external: false,
            open_new_tab: false,
            url: "",
            page: "",
            column: 1,
        });
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`front-cms/menus/${deleteId}`);
            tt.success("menu_item_deleted");
            setDeleteId(null);
            fetchMenus();
        } catch (err) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
                ?.message;
            toast({
                title: t("error") || "Error",
                description: msg || t("failed_to_delete"),
                variant: "destructive",
            });
        } finally {
            setDeleting(false);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const sIdx = result.source.index;
        const dIdx = result.destination.index;
        if (sIdx === dIdx) return;

        const current = [...menus.filter((m) => m.type === activeTab)];
        const [moved] = current.splice(sIdx, 1);
        current.splice(dIdx, 0, moved);
        const updated = current.map((item, i) => ({ ...item, order: i }));

        setMenus((prev) => [...prev.filter((m) => m.type !== activeTab), ...updated]);

        try {
            await api.post("front-cms/menus/reorder", {
                items: updated.map((item) => ({ id: item.id, order: item.order })),
            });
        } catch {
            tt.error("failed_to_save_order");
            fetchMenus();
        }
    };

    const applyMenusPreset = async (targetTemplate: "ischool" | "imadrasha") => {
        setSaving(true);
        try {
            await api.post("front-cms/menus/preset", { template: targetTemplate });
            tt.success("menus_preset_applied");
            fetchMenus();
        } catch {
            tt.error("failed_to_save_menu");
        } finally {
            setSaving(false);
        }
    };

    const currentMenus = menus
        .filter((m) => m.type === activeTab)
        .sort((a, b) => a.order - b.order);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Panel: Form */}
                <div className="w-full lg:w-[380px] shrink-0">
                    <Card className="rounded-xl border border-gray-100 bg-white shadow-xs overflow-hidden pt-0 gap-0">
                        <CardHeader className="p-4 px-5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <LinkIcon className="h-4 w-4" />
                                </span>
                                <CardTitle className="text-sm font-bold text-gray-800 leading-none">
                                    {editingId ? t("edit_menu_item") : t("add_menu_item")}
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("menu_item")} <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="h-9 text-xs rounded-lg border-gray-200 focus-visible:ring-indigo-500"
                                    placeholder={t("menu_label")}
                                />
                            </div>

                            <div className="space-y-3 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-gray-700">
                                        {t("external_url")}
                                    </Label>
                                    <Switch
                                        checked={form.is_external}
                                        onCheckedChange={(v) => setForm({ ...form, is_external: v })}
                                        className="data-[state=checked]:bg-[#6366f1]"
                                    />
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                                    <Label className="text-xs font-semibold text-gray-700">
                                        {t("open_in_new_tab")}
                                    </Label>
                                    <Switch
                                        checked={form.open_new_tab}
                                        onCheckedChange={(v) => setForm({ ...form, open_new_tab: v })}
                                        className="data-[state=checked]:bg-[#6366f1]"
                                    />
                                </div>
                            </div>

                            {form.is_external ? (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">
                                        {t("external_url")}
                                    </Label>
                                    <Input
                                        value={form.url}
                                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                                        className="h-9 text-xs font-mono rounded-lg border-gray-200 focus-visible:ring-indigo-500"
                                        placeholder="https://"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">
                                        {t("page")}
                                    </Label>
                                    <Select
                                        value={form.page}
                                        onValueChange={(v) => setForm({ ...form, page: v })}
                                    >
                                        <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                            <SelectValue placeholder={t("select_a_page")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pages.map((p) => (
                                                <SelectItem
                                                    key={p.id}
                                                    value={
                                                        p.url ||
                                                        p.title.toLowerCase().replace(/\s+/g, "-")
                                                    }
                                                    className="text-xs"
                                                >
                                                    {p.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {activeTab === "bottom" && (
                                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                                    <Label className="text-xs font-bold text-gray-700">
                                        {t("footer_column")}
                                    </Label>
                                    <Select
                                        value={form.column.toString()}
                                        onValueChange={(v) =>
                                            setForm({ ...form, column: parseInt(v) })
                                        }
                                    >
                                        <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1" className="text-xs">
                                                {t("column_1_logo_and_bio")}
                                            </SelectItem>
                                            <SelectItem value="2" className="text-xs">
                                                {t("column_2_quick_links")}
                                            </SelectItem>
                                            <SelectItem value="3" className="text-xs">
                                                {t("column_3_information")}
                                            </SelectItem>
                                            <SelectItem value="4" className="text-xs">
                                                {t("column_4_contact_us")}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                {editingId && (
                                    <Button
                                        onClick={handleCancel}
                                        variant="outline"
                                        className="h-9 px-4 text-xs font-bold rounded-full border-gray-200 hover:bg-gray-100"
                                    >
                                        {t("cancel")}
                                    </Button>
                                )}
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                                >
                                    {saving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : editingId ? (
                                        t("update")
                                    ) : (
                                        t("save")
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel: Menu List */}
                <div className="flex-1 min-w-0">
                    <Card className="rounded-xl border border-gray-100 bg-white shadow-xs overflow-hidden pt-0 gap-0">
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 p-4 px-5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <Menu className="h-4 w-4" />
                                </span>
                                <div>
                                    <CardTitle className="text-sm font-bold text-gray-800 leading-none">
                                        {t("menu_items")}
                                    </CardTitle>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{t("drag_to_reorder_hint")}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                                <div className="flex bg-gray-100/80 p-0.5 rounded-full border border-gray-200">
                                    <Button
                                        onClick={() => setActiveTab("main")}
                                        className={cn(
                                            "h-7 px-4 text-[11px] font-bold rounded-full transition-all cursor-pointer shadow-none",
                                            activeTab === "main"
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                                : "bg-transparent text-gray-500 hover:text-gray-800"
                                        )}
                                    >
                                        {t("main_menu")}
                                    </Button>
                                    <Button
                                        onClick={() => setActiveTab("bottom")}
                                        className={cn(
                                            "h-7 px-4 text-[11px] font-bold rounded-full transition-all cursor-pointer shadow-none",
                                            activeTab === "bottom"
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                                : "bg-transparent text-gray-500 hover:text-gray-800"
                                        )}
                                    >
                                        {t("bottom_menu")}
                                    </Button>
                                </div>
                                <div className="flex items-center gap-1.5 pl-1 border-l border-gray-200">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => applyMenusPreset("imadrasha")}
                                        disabled={saving}
                                        className="h-7 text-[10px] font-bold rounded-full border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer shadow-none"
                                        title="Load iMadrasha Navigation Menus"
                                    >
                                        <span>🕌</span>
                                        <span>{t("template_imadrasha")}</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => applyMenusPreset("ischool")}
                                        disabled={saving}
                                        className="h-7 text-[10px] font-bold rounded-full border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer shadow-none"
                                        title="Load iSchool Navigation Menus"
                                    >
                                        <span>🏫</span>
                                        <span>{t("template_ischool")}</span>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5">
                            {loading ? (
                                <MenuSkeleton />
                            ) : currentMenus.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-14 gap-2 text-gray-400">
                                    <Menu className="h-8 w-8 opacity-30" />
                                    <p className="text-xs font-semibold">{t("no_menu_items_found")}</p>
                                </div>
                            ) : (
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="menu-list">
                                        {(provided) => (
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className="space-y-2"
                                            >
                                                {currentMenus.map((item, index) => (
                                                    <Draggable
                                                        key={item.id.toString()}
                                                        draggableId={item.id.toString()}
                                                        index={index}
                                                    >
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className="space-y-1.5"
                                                            >
                                                                <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl group hover:border-indigo-200 hover:shadow-xs transition-all">
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <div
                                                                            {...provided.dragHandleProps}
                                                                            className="shrink-0 p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                                                                        >
                                                                            <GripVertical className="h-4 w-4" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <span className="text-xs font-bold text-gray-800">
                                                                                    {item.title}
                                                                                </span>
                                                                                {activeTab === "bottom" && (
                                                                                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full uppercase">
                                                                                        {t("column")}{" "}
                                                                                        {toLocaleNumber(
                                                                                            item.column || 1,
                                                                                            langCode
                                                                                        )}
                                                                                    </span>
                                                                                )}
                                                                                {!!item.is_external && (
                                                                                    <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full font-bold">
                                                                                        {t("external")}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <span className="text-[10px] text-gray-400 font-medium truncate block max-w-[280px] mt-0.5 font-mono">
                                                                                {item.is_external
                                                                                    ? item.url
                                                                                    : `${frontendUrl.replace(/\/$/, "")}/${(item.page || "").replace(/^\//, "")}`}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        <Button
                                                                            size="icon"
                                                                            onClick={() => handleEdit(item)}
                                                                            className="h-7 w-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xs shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                                                                            title={t("edit")}
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            size="icon"
                                                                            onClick={() => setDeleteId(item.id)}
                                                                            className="h-7 w-7 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-xs shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
                                                                            title={t("delete")}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Sub Items */}
                                                                {item.sub_items && item.sub_items.length > 0 && (
                                                                    <div className="pl-6 space-y-1.5 border-l-2 border-indigo-100 ml-3">
                                                                        {item.sub_items.map((sub) => (
                                                                            <div
                                                                                key={sub.id}
                                                                                className="flex items-center justify-between p-2.5 bg-gray-50/60 border border-gray-100 rounded-lg group hover:border-indigo-200 hover:bg-white transition-all"
                                                                            >
                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                    <Menu className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                                                                                    <div className="min-w-0">
                                                                                        <span className="text-xs font-semibold text-gray-700">
                                                                                            {sub.title}
                                                                                        </span>
                                                                                        <span className="text-[9px] text-gray-400 font-mono truncate block max-w-[200px]">
                                                                                            {sub.is_external
                                                                                                ? sub.url
                                                                                                : `${frontendUrl.replace(/\/$/, "")}/${(sub.page || "").replace(/^\//, "")}`}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                                    <Button
                                                                                        size="icon"
                                                                                        onClick={() => handleEdit(sub)}
                                                                                        className="h-6 w-6 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                                                                                        title={t("edit")}
                                                                                    >
                                                                                        <Pencil className="h-3 w-3" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="icon"
                                                                                        onClick={() => setDeleteId(sub.id)}
                                                                                        className="h-6 w-6 rounded-md bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                                                                                        title={t("delete")}
                                                                                    >
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-4 mt-4 border-t border-gray-100">
                                <div>
                                    {t("showing")}{" "}
                                    <span className="font-bold text-gray-700">
                                        {toLocaleNumber(currentMenus.length, langCode)}
                                    </span>{" "}
                                    {t("entries")}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-gray-900">
                            {t("delete_menu_item")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500">
                            {t("delete_menu_item_confirmation")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel
                            disabled={deleting}
                            className="h-9 text-xs font-bold rounded-full"
                        >
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="h-9 text-xs font-bold rounded-full bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {deleting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
