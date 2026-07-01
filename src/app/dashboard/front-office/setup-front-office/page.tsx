"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Printer,
    FileText,
    Download,
    Columns,
    Pencil,
    Trash2,
    Copy,
    Settings2,
    List,
    FileSpreadsheet,
    ChevronLeft,
    ChevronRight,
    LucideIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const tabs = [
    { id: "purpose", label: "Purpose", endpoint: "/front-office-purposes" },
    { id: "complaint-type", label: "Complaint Type", endpoint: "/complaint-types" },
    { id: "source", label: "Source", endpoint: "/front-office-sources" },
    { id: "reference", label: "Reference", endpoint: "/front-office-references" },
];

interface TabItem {
    id: number;
    name: string;
    description: string | null;
}

export default function SetupFrontOfficePage() {
    const tt = useTranslateToast();
    const { t } = useTranslation();
    const [activeTabId, setActiveTabId] = useState("purpose");
    const [items, setItems] = useState<TabItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [isBackendPaginated, setIsBackendPaginated] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: ""
    });

    const activeTab = tabs.find(t => t.id === activeTabId)!;
    const currentTabLabel = activeTab.label;

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get(activeTab.endpoint, {
                params: {
                    search: searchQuery,
                    page: page,
                    limit: limit
                }
            });
            const resData = response.data?.data;
            if (resData && resData.data) {
                setItems(resData.data);
                setTotal(resData.total || 0);
                setLastPage(resData.last_page || 1);
                setIsBackendPaginated(true);
            } else {
                const list = Array.isArray(resData) ? resData : [];
                setItems(list);
                setTotal(list.length);
                setLastPage(Math.ceil(list.length / limit) || 1);
                setIsBackendPaginated(false);
            }
            setSelectedIds([]);
        } catch (error) {
            console.error("Error fetching items:", error);
            tt.error("failed_to_load_x_list", { label: currentTabLabel });
        } finally {
            setLoading(false);
        }
    }, [activeTab.endpoint, searchQuery, page, limit, tt, currentTabLabel]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && editId) {
                await api.put(`${activeTab.endpoint}/${editId}`, formData);
                tt.success("x_updated_successfully", { label: currentTabLabel });
            } else {
                await api.post(activeTab.endpoint, formData);
                tt.success("x_added_successfully", { label: currentTabLabel });
            }
            fetchItems();
            resetForm();
        } catch (error) {
            console.error("Error saving item:", error);
            const err = error as { response?: { data?: { message?: string } } };
            const message = err.response?.data?.message || `Failed to save ${currentTabLabel}`;
            tt.error(message);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`${activeTab.endpoint}/${deleteId}`);
            tt.success("x_deleted_successfully", { label: currentTabLabel });
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchItems();
        } catch (error) {
            console.error("Error deleting item:", error);
            tt.error("failed_to_delete_x", { label: currentTabLabel });
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post(`${activeTab.endpoint}/bulk-delete`, { ids: selectedIds });
            tt.success("items_deleted_successfully", { count: selectedIds.length });
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchItems();
        } catch (error) {
            console.error("Error bulk deleting items:", error);
            tt.error("failed_to_delete_selected_x_list", { label: currentTabLabel });
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: ""
        });
        setIsEdit(false);
        setEditId(null);
    };

    const startEdit = (item: TabItem) => {
        setIsEdit(true);
        setEditId(item.id);
        setFormData({
            name: item.name,
            description: item.description || ""
        });
    };

    const displayedItems = isBackendPaginated ? items : items.slice((page - 1) * limit, page * limit);

    const toggleSelectAll = () => {
        const displayedIds = displayedItems.map(p => p.id);
        const allDisplayedSelected = displayedIds.every(id => selectedIds.includes(id));
        if (allDisplayedSelected) {
            setSelectedIds(selectedIds.filter(id => !displayedIds.includes(id)));
        } else {
            const newSelected = [...selectedIds];
            displayedIds.forEach(id => {
                if (!newSelected.includes(id)) {
                    newSelected.push(id);
                }
            });
            setSelectedIds(newSelected);
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleCopy = () => {
        const text = items.map(p => `${p.name}\t${p.description}`).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Column 1: Vertical Tabs */}
                <div className="md:col-span-2">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden sticky top-6">
                        <div className="flex flex-col">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTabId(tab.id);
                                        setSearchQuery("");
                                        setPage(1);
                                        resetForm();
                                    }}
                                    className={cn(
                                        "flex items-center px-4 py-3.5 text-sm font-semibold transition-all border-b border-muted/30 last:border-0",
                                        activeTabId === tab.id
                                            ? "bg-muted/50 text-[#FFA500] border-l-4 border-l-[#FFA500]"
                                            : "text-muted-foreground hover:bg-muted/20 hover:text-slate-900 border-l-4 border-l-transparent"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Column 2: Add Form */}
                <div className="md:col-span-4">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Settings2 className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {isEdit ? `${t("edit")} ${currentTabLabel}` : `${t("add")} ${currentTabLabel}`}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{isEdit ? t("update_entry") : t("create_a_new_entry")}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                        {currentTabLabel} <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50 transition-all hover:border-indigo-200 text-slate-700 font-medium"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("description")}</label>
                                    <Textarea
                                        className="min-h-[120px] rounded-lg bg-muted/30 border-muted/50 resize-none font-medium text-slate-700"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    {isEdit && (
                                        <Button type="button" variant="outline" className="h-10 px-6" onClick={resetForm}>
                                            {t("cancel")}
                                        </Button>
                                    )}
                                    <Button type="submit" variant="gradient" className="h-10 px-8">
                                        {t("save")}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Column 3: List Table */}
                <div className="md:col-span-6">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <List className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{`${currentTabLabel} ${t("list")}`}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("total_entries_count", { total })}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t("search")}
                                        className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setPage(1);
                                        }}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 mr-2">
                                        <Select
                                            value={String(limit)}
                                            onValueChange={(val) => {
                                                setLimit(Number(val));
                                                setPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="h-8 w-16 text-xs border border-muted/50 bg-muted/30 hover:bg-muted/50 transition-colors shadow-none rounded-lg font-semibold text-muted-foreground">
                                                <SelectValue placeholder={String(limit)} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg border-muted/50">
                                                {[20, 50, 100, 500].map((n) => (
                                                    <SelectItem key={n} value={String(n)} className="font-medium text-slate-700">
                                                        {n}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-1">
                                        <IconButton icon={Printer} onClick={() => window.print()} />
                                        <IconButton icon={Copy} onClick={handleCopy} />
                                        <IconButton icon={FileSpreadsheet} onClick={() => tt.success("exporting_to_excel")} />
                                        <IconButton icon={FileText} onClick={() => tt.success("exporting_to_pdf")} />
                                        <IconButton icon={Download} onClick={() => tt.success("downloading")} />
                                        <IconButton icon={Columns} />
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto rounded-lg border border-muted/50">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-4 w-10 border-b border-muted/50">
                                                <Checkbox
                                                    checked={displayedItems.length > 0 && displayedItems.every(item => selectedIds.includes(item.id))}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </th>
                                            <Th>{currentTabLabel}</Th>
                                            <Th>{t("description")}</Th>
                                            <th className="px-4 py-4 border-b border-muted/50 text-right">
                                                <div className="flex justify-end pr-1 text-slate-700">
                                                    {selectedIds.length > 0 ? (
                                                        <button
                                                            onClick={() => setIsBulkDeleteDialogOpen(true)}
                                                            className="bg-red-500 hover:bg-red-600 p-1.5 rounded transition-colors"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 text-white" />
                                                        </button>
                                                    ) : (
                                                        t("action")
                                                    )}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/30">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">{t("loading")}</td>
                                            </tr>
                                        ) : displayedItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">{t("no_data_found")}</td>
                                            </tr>
                                        ) : (
                                            displayedItems.map((item) => (
                                                <tr key={item.id} className={cn(
                                                    "hover:bg-muted/10 transition-colors group",
                                                    selectedIds.includes(item.id) && "bg-muted/30"
                                                )}>
                                                    <td className="px-4 py-4 text-sm whitespace-nowrap">
                                                        <Checkbox
                                                            checked={selectedIds.includes(item.id)}
                                                            onCheckedChange={() => toggleSelect(item.id)}
                                                        />
                                                    </td>
                                                    <Td className="font-semibold text-slate-700">{item.name}</Td>
                                                    <Td className="text-slate-600 font-medium truncate max-w-[200px]">{item.description || "-"}</Td>
                                                    <Td className="text-right">
                                                        <div className="flex justify-end gap-1 px-2">
                                                            <ActionBtn icon={Pencil} className="bg-amber-500" onClick={() => startEdit(item)} />
                                                            <ActionBtn icon={Trash2} className="bg-red-500" onClick={() => { setDeleteId(item.id); setIsDeleteDialogOpen(true); }} />
                                                        </div>
                                                    </Td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                    {t("showing_x_to_y_of_z", { from: total > 0 ? (page - 1) * limit + 1 : 0, to: Math.min(page * limit, total), total })}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all"
                                        disabled={page === 1}
                                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    
                                    {Array.from({ length: lastPage }).map((_, i) => {
                                        const p = i + 1;
                                        const isCurrent = p === page;
                                        const isAdjacent = Math.abs(p - page) <= 1;
                                        const isEdge = p === 1 || p === lastPage;

                                        if (isCurrent || isAdjacent || isEdge) {
                                            return (
                                                <Button
                                                    key={p}
                                                    className={cn(
                                                        "h-8 w-8 rounded-lg font-bold transition-all active:scale-95",
                                                        isCurrent
                                                            ? "border-none p-0 text-white shadow-md shadow-orange-500/10 bg-gradient-to-r from-[#FF9800] to-[#6366F1]"
                                                            : "bg-white border border-gray-200 text-gray-600 hover:bg-muted"
                                                    )}
                                                    onClick={() => setPage(p)}
                                                >
                                                    {p}
                                                </Button>
                                            );
                                        } else if (p === 2 && page > 3) {
                                            return <span key={p} className="text-gray-400">...</span>;
                                        } else if (p === lastPage - 1 && page < lastPage - 2) {
                                            return <span key={p} className="text-gray-400">...</span>;
                                        }
                                        return null;
                                    })}

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all"
                                        disabled={page === lastPage}
                                        onClick={() => setPage(prev => Math.min(prev + 1, lastPage))}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("permanently_delete_x_entry", { label: currentTabLabel })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setDeleteId(null); setIsDeleteDialogOpen(false); }}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">{t("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("bulk_delete_entries")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("confirm_bulk_delete_items", { count: selectedIds.length })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsBulkDeleteDialogOpen(false)}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600">{t("delete_selected")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-4 py-4 border-b border-muted/50 whitespace-nowrap", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-4 py-4 text-sm whitespace-nowrap", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick }: { icon: LucideIcon, onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm"
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}

function ActionBtn({ icon: Icon, className, onClick }: { icon: LucideIcon, className?: string, onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn("p-1.5 text-white rounded transition-all hover:shadow-md active:scale-90", className)}
        >
            <Icon className="h-3 w-3" />
        </button>
    );
}
