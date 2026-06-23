"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Menu, Pencil, Trash2, Loader2, Link,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
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

export default function MenusPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [activeTab, setActiveTab] = useState<"main" | "bottom">("main");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [pages, setPages] = useState<{ id: number, title: string, url: string }[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    const [form, setForm] = useState({
        title: "", is_external: false, open_new_tab: false,
        url: "", page: "", column: 1,
    });

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchMenus();
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const res = await api.get("front-cms/pages");
            if (res.data?.status === "Success") setPages(res.data.data);
        } catch { console.error("Failed to load pages"); }
    };

    const fetchMenus = async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/menus");
            if (res.data?.status === "Success") setMenus(res.data.data);
        } catch { tt.error("failed_to_load_menus"); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!form.title) {
            tt.error("title_is_required"); return;
        }
        setSaving(true);
        try {
            const payload = { ...form, type: activeTab };
            if (editingId) await api.put(`front-cms/menus/${editingId}`, payload);
            else await api.post("front-cms/menus", payload);
            tt.success(editingId ? "menu_item_updated" : "menu_item_added");
            handleCancel(); fetchMenus();
        } catch { tt.error("failed_to_save_menu"); }
        finally { setSaving(false); }
    };

    const handleEdit = (item: MenuItem) => {
        setEditingId(item.id);
        setActiveTab(item.type as "main" | "bottom");
        setForm({
            title: item.title, is_external: item.is_external, open_new_tab: item.open_new_tab,
            url: item.url || "", page: item.page || "", column: item.column || 1,
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm({ title: "", is_external: false, open_new_tab: false, url: "", page: "", column: 1 });
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`front-cms/menus/${deleteId}`);
            tt.success("menu_item_deleted");
            setDeleteId(null); fetchMenus();
        } catch (err) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast({ title: "Error", description: msg || t("failed_to_delete"), variant: "destructive" });
        } finally { setDeleting(false); }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const sIdx = result.source.index, dIdx = result.destination.index;
        if (sIdx === dIdx) return;

        const current = [...menus.filter(m => m.type === activeTab)];
        const [moved] = current.splice(sIdx, 1);
        current.splice(dIdx, 0, moved);
        const updated = current.map((item, i) => ({ ...item, order: i }));

        setMenus(prev => [...prev.filter(m => m.type !== activeTab), ...updated]);

        try {
            await api.post('front-cms/menus/reorder', {
                items: updated.map(item => ({ id: item.id, order: item.order }))
            });
        } catch {
            tt.error("failed_to_save_order");
            fetchMenus();
        }
    };

    const currentMenus = menus.filter(m => m.type === activeTab).sort((a, b) => a.order - b.order);

    return (
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col lg:flex-row gap-5">
                {/* Left Panel: Form */}
                <div className="w-full lg:w-[420px] shrink-0">
                    <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                        <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <Link className="h-5 w-5" />
                                </span>
                                <CardTitle className="text-base font-bold text-slate-800 leading-none">
                                    {editingId ? t("edit_menu_item") : t("add_menu_item")}
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">{t("menu_item")} <span className="text-red-500">*</span></Label>
                                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-9 text-xs" placeholder={t("menu_label")} />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-1">
                                    <Label className="text-xs font-medium text-gray-600">{t("external_url")}</Label>
                                    <Switch checked={form.is_external} onCheckedChange={v => setForm({ ...form, is_external: v })} className="data-[state=checked]:bg-indigo-500" />
                                </div>
                                <div className="flex items-center justify-between py-1">
                                    <Label className="text-xs font-medium text-gray-600">{t("open_in_new_tab")}</Label>
                                    <Switch checked={form.open_new_tab} onCheckedChange={v => setForm({ ...form, open_new_tab: v })} className="data-[state=checked]:bg-indigo-500" />
                                </div>
                            </div>

                            {form.is_external ? (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-600">{t("external_url")}</Label>
                                    <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className="h-9 text-xs" placeholder="https://" />
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-600">{t("page")}</Label>
                                    <Select value={form.page} onValueChange={v => setForm({ ...form, page: v })}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select_a_page")} /></SelectTrigger>
                                        <SelectContent>
                                            {pages.map(p => (
                                                <SelectItem key={p.id} value={p.url || p.title.toLowerCase().replace(/\s+/g, '-')}>{p.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {activeTab === "bottom" && (
                                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                                    <Label className="text-xs font-semibold text-gray-600">{t("footer_column")}</Label>
                                    <Select value={form.column.toString()} onValueChange={v => setForm({ ...form, column: parseInt(v) })}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">{t("column_1_logo_and_bio")}</SelectItem>
                                            <SelectItem value="2">{t("column_2_quick_links")}</SelectItem>
                                            <SelectItem value="3">{t("column_3_information")}</SelectItem>
                                            <SelectItem value="4">{t("column_4_contact_us")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                {editingId && (
                                    <Button onClick={handleCancel} variant="outline" className="h-9 px-4 text-xs font-bold">{t("cancel")}</Button>
                                )}
                                <Button onClick={handleSave} disabled={saving} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? t("update") : t("save"))}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel: Menu List */}
                <div className="flex-1 min-w-0">
                    <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <Menu className="h-5 w-5" />
                                </span>
                                <CardTitle className="text-base font-bold text-slate-800 leading-none">{t("menu_items")}</CardTitle>
                            </div>
                            <div className="flex bg-gray-100/80 p-0.5 rounded-lg border border-gray-200">
                                <Button onClick={() => setActiveTab("main")} className={cn("h-7 px-4 text-[10px] font-bold uppercase rounded-md transition-all shadow-none", activeTab === "main" ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm" : "bg-transparent text-gray-400 hover:text-gray-600")}>
                                    {t("main_menu")}
                                </Button>
                                <Button onClick={() => setActiveTab("bottom")} className={cn("h-7 px-4 text-[10px] font-bold uppercase rounded-md transition-all shadow-none", activeTab === "bottom" ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm" : "bg-transparent text-gray-400 hover:text-gray-600")}>
                                    {t("bottom_menu")}
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5">
                            {loading ? (
                                <MenuSkeleton />
                            ) : currentMenus.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
                                    <Menu className="h-8 w-8 opacity-30" />
                                    <p className="text-xs font-medium">{t("no_menu_items_found")}</p>
                                </div>
                            ) : (
                                <DragDropContext onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="menu-list">
                                        {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1.5">
                                                {currentMenus.map((item, index) => (
                                                    <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                                                        {(provided) => (
                                                            <div ref={provided.innerRef} {...provided.draggableProps} className="space-y-1">
                                                                <div className="flex items-center justify-between p-2.5 bg-white border border-gray-100 rounded-lg group hover:border-indigo-200 hover:shadow-sm transition-all">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div {...provided.dragHandleProps} className="shrink-0">
                                                                            <Menu className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 transition-colors cursor-grab active:cursor-grabbing" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <span className="text-xs font-bold text-gray-700">{item.title}</span>
                                                                                {activeTab === "bottom" && (
                                                                                    <span className="text-[8px] font-bold text-white bg-indigo-500 px-1.5 py-0.5 rounded uppercase">Col {item.column}</span>
                                                                                )}
                                                                                {!!item.is_external && <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">{t("external")}</span>}
                                                                            </div>
                                                                            <span className="text-[9px] text-indigo-400 font-medium truncate block max-w-[250px]">
                                                                                {item.is_external ? item.url : `${frontendUrl.replace(/\/$/, '')}/${(item.page || '').replace(/^\//, '')}`}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)} className="h-7 w-7 p-0 rounded bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-95">
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button size="sm" variant="ghost" onClick={() => setDeleteId(item.id)} className="h-7 w-7 p-0 rounded bg-red-500 hover:bg-red-600 text-white shadow-sm active:scale-95">
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Sub Items */}
                                                                {item.sub_items && item.sub_items.length > 0 && (
                                                                    <div className="pl-8 space-y-1 border-l-2 border-indigo-100 ml-3">
                                                                        {item.sub_items.map(sub => (
                                                                            <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50/50 border border-gray-100 rounded-lg group hover:border-indigo-200 hover:bg-white transition-all">
                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                    <Menu className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                                                                                    <div className="min-w-0">
                                                                                        <span className="text-[11px] font-semibold text-gray-600">{sub.title}</span>
                                                                                        <span className="text-[8px] text-indigo-400 font-medium truncate block max-w-[180px]">
                                                                                            {sub.is_external ? sub.url : `${frontendUrl.replace(/\/$/, '')}/${(sub.page || '').replace(/^\//, '')}`}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-1 shrink-0">
                                                                                    <Button size="sm" variant="ghost" onClick={() => handleEdit(sub)} className="h-6 w-6 p-0 rounded bg-amber-500 hover:bg-amber-600 text-white shadow-sm">
                                                                                        <Pencil className="h-3 w-3" />
                                                                                    </Button>
                                                                                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(sub.id)} className="h-6 w-6 p-0 rounded bg-red-500 hover:bg-red-600 text-white shadow-sm">
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
                                <div>{t("showing_x_entries", { count: currentMenus.length })}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Dialog */}
            <Dialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null); }}>
                <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b">
                        <DialogTitle className="text-base font-bold text-slate-800">{t("delete_menu_item")}</DialogTitle>
                    </DialogHeader>
                    <div className="p-5 text-center space-y-3">
                        <div className="mx-auto w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <Trash2 className="h-5 w-5 text-red-600" />
                        </div>
                        <p className="text-sm text-gray-500">{t("delete_menu_item_confirmation")}</p>
                    </div>
                    <DialogFooter className="px-5 py-4 border-t bg-gray-50 gap-2">
                        <Button variant="ghost" onClick={() => setDeleteId(null)} disabled={deleting} className="flex-1 h-9 text-xs font-bold">{t("cancel")}</Button>
                        <Button onClick={confirmDelete} disabled={deleting} className="flex-1 h-9 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg shadow-sm">
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {t("delete_now")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
