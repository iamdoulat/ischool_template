"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    ArrowUpDown,
    Save,
    UploadCloud,
    PackageSearch,
    Boxes,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
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

interface ItemStock {
    id: number;
    item_id: number;
    item_category_id: number;
    item_supplier_id?: number;
    item_store_id?: number;
    quantity: number;
    purchase_price: string;
    date: string;
    description?: string;
    document?: string;
    item?: { item_name: string };
    item_category?: { item_category: string };
    supplier?: { item_supplier: string };
    store?: { item_store: string };
}

interface DropdownItem {
    id: number;
    name: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const TABLE_COLS = 8;

function SkeletonRows({ rows = 6, cols = TABLE_COLS }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <div className="h-3 rounded bg-gray-200/70 animate-pulse" style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function AddItemStockPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [stocks, setStocks] = useState<ItemStock[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [limit, setLimit] = useState("50");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteStockId, setDeleteStockId] = useState<number | null>(null);

    const [categories, setCategories] = useState<DropdownItem[]>([]);
    const [items, setItems] = useState<DropdownItem[]>([]);
    const [suppliers, setSuppliers] = useState<DropdownItem[]>([]);
    const [stores, setStores] = useState<DropdownItem[]>([]);

    const [formData, setFormData] = useState({
        item_category_id: "",
        item_id: "",
        item_supplier_id: "",
        item_store_id: "",
        quantity: "",
        purchase_price: "",
        date: new Date().toISOString().split('T')[0],
        description: ""
    });
    const [documentFile, setDocumentFile] = useState<File | null>(null);

    const fetchDropdowns = async () => {
        try {
            const [catRes, supRes, storeRes] = await Promise.all([
                api.get('/inventory/item-categories?limit=100'),
                api.get('/inventory/item-suppliers?limit=100'),
                api.get('/inventory/item-stores?limit=100')
            ]);
            setCategories(catRes.data.data.map((c: { id: number; item_category: string }) => ({ id: c.id, name: c.item_category })));
            setSuppliers(supRes.data.data.map((s: { id: number; item_supplier: string }) => ({ id: s.id, name: s.item_supplier })));
            setStores(storeRes.data.data.map((s: { id: number; item_store: string }) => ({ id: s.id, name: s.item_store })));
        } catch (err) {
            console.error("Error fetching dropdown data:", err);
        }
    };

    const fetchItemsByCategory = async (categoryId: string) => {
        if (!categoryId) return;
        try {
            const response = await api.get(`/inventory/items?limit=100&item_category_id=${categoryId}`);
            setItems(response.data.data.map((i: { id: number; item_name: string }) => ({ id: i.id, name: i.item_name })));
        } catch (err) {
            console.error("Error fetching items:", err);
        }
    };

    const fetchStocks = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/inventory/item-stocks?page=${page}&search=${searchTerm}&limit=${limit}`);
            setStocks(response.data.data ?? response.data ?? []);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching stocks:", error);
            tt.error("failed_to_fetch_stocks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDropdowns();
        fetchStocks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit]);

    useEffect(() => {
        if (formData.item_category_id) fetchItemsByCategory(formData.item_category_id);
    }, [formData.item_category_id]);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchStocks(1); };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormData({ item_category_id: "", item_id: "", item_supplier_id: "", item_store_id: "", quantity: "", purchase_price: "", date: new Date().toISOString().split('T')[0], description: "" });
        setDocumentFile(null);
    };

    const handleSave = async () => {
        if (!formData.item_category_id || !formData.item_id || !formData.quantity || !formData.purchase_price) {
            tt.error("please_fill_all_required_fields");
            return;
        }
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => { if (value) data.append(key, value); });
        if (documentFile) data.append('document', documentFile);
        setSaving(true);
        try {
            if (isEditing && currentId) {
                await api.post(`/inventory/item-stocks/${currentId}?_method=PUT`, data);
                tt.success("stock_updated_successfully");
            } else {
                await api.post('/inventory/item-stocks', data);
                tt.success("stock_added_successfully");
            }
            resetForm();
            fetchStocks();
        } catch (error) {
            console.error("Error saving stock:", error);
            tt.error("something_went_wrong");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (stock: ItemStock) => {
        setIsEditing(true);
        setCurrentId(stock.id);
        setFormData({
            item_category_id: String(stock.item_category_id),
            item_id: String(stock.item_id),
            item_supplier_id: stock.item_supplier_id ? String(stock.item_supplier_id) : "",
            item_store_id: stock.item_store_id ? String(stock.item_store_id) : "",
            quantity: String(stock.quantity),
            purchase_price: stock.purchase_price,
            date: stock.date,
            description: stock.description || ""
        });
    };

    const handleDelete = (id: number) => { setDeleteStockId(id); setIsDeleteDialogOpen(true); };

    const confirmDelete = async () => {
        if (!deleteStockId) return;
        try {
            await api.delete(`/inventory/item-stocks/${deleteStockId}`);
            tt.success("stock_deleted_successfully");
            setIsDeleteDialogOpen(false);
            setDeleteStockId(null);
            fetchStocks();
        } catch {
            tt.error("failed_to_delete_stock");
        }
    };

    const handleCopy = () => {
        const text = stocks.map(s => `${s.item?.item_name}\t${s.item_category?.item_category}\t${s.quantity}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const handleExportCSV = () => {
        const headers = [t("item"), t("category"), t("supplier"), t("store"), t("quantity"), t("price"), t("date")];
        const rows = stocks.map(s => [s.item?.item_name, s.item_category?.item_category, s.supplier?.item_supplier, s.store?.item_store, s.quantity, s.purchase_price, s.date]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "item_stock.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: t("excel") },
        { Icon: FileText, onClick: handleExportCSV, title: t("csv") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
        { Icon: Columns, onClick: () => {}, title: t("columns") },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Add Form */}
                <Card className="h-fit border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <PackageSearch className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{isEditing ? t("edit_item_stock") : t("add_item_stock")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{isEditing ? t("update_stock_entry") : t("record_new_stock_entry")}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("item_category")} <span className="text-red-500">*</span></Label>
                            <Select value={formData.item_category_id} onValueChange={(val) => setFormData({ ...formData, item_category_id: val, item_id: "" })}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select")} /></SelectTrigger>
                                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("item")} <span className="text-red-500">*</span></Label>
                            <Select value={formData.item_id} onValueChange={(val) => setFormData({ ...formData, item_id: val })} disabled={!formData.item_category_id}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={formData.item_category_id ? t("select") : t("select_category_first")} /></SelectTrigger>
                                <SelectContent>{items.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("supplier")}</Label>
                            <Select value={formData.item_supplier_id} onValueChange={(val) => setFormData({ ...formData, item_supplier_id: val })}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select")} /></SelectTrigger>
                                <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("store")}</Label>
                            <Select value={formData.item_store_id} onValueChange={(val) => setFormData({ ...formData, item_store_id: val })}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select")} /></SelectTrigger>
                                <SelectContent>{stores.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("quantity")} <span className="text-red-500">*</span></Label>
                            <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("purchase_price")} <span className="text-red-500">*</span></Label>
                            <Input value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("date")}</Label>
                            <DatePicker value={formData.date} onChange={(val) => setFormData({ ...formData, date: val })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("attach_document")}</Label>
                            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
                                <UploadCloud className="h-5 w-5 text-gray-400" />
                                <span className="text-[10px] text-gray-400 font-medium text-center">{documentFile ? documentFile.name : t("drag_and_drop_or_click")}</span>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("description")}</Label>
                            <Textarea className="resize-none" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="flex justify-end pt-2 gap-2">
                            {isEditing && <Button variant="outline" onClick={resetForm} className="h-9 px-6 rounded-full text-xs font-bold">{t("cancel")}</Button>}
                            <Button onClick={handleSave} disabled={saving} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                                <Save className="h-4 w-4" /> {isEditing ? t("update") : t("save")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: List */}
                <Card className="lg:col-span-2 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Boxes className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("item_stock_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{pagination?.total ?? stocks.length} {t("stock_entries")}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
                                <Input placeholder={t("search_placeholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 text-xs w-full md:w-64" />
                                <Button type="submit" className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                                    <Search className="h-4 w-4" /> {t("search")}
                                </Button>
                            </form>
                            <div className="flex items-center gap-2">
                                <Select value={limit} onValueChange={setLimit}>
                                    <SelectTrigger className="w-[70px] h-9 text-xs"><SelectValue placeholder="50" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                    {toolbarActions.map((action, i) => (
                                        <Button key={i} variant="ghost" size="icon" onClick={action.onClick} title={action.title} className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                            <action.Icon className="h-4 w-4" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1000px]">
                                <TableHeader className="bg-gray-50 text-xs uppercase">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap">
                                        <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("item")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                        <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("category")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("supplier")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("store")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-right"><div className="flex items-center justify-end gap-1">{t("qty")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-right">{t("purchase_price")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("date")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-right">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <SkeletonRows rows={6} cols={TABLE_COLS} />
                                    ) : stocks.length === 0 ? (
                                        <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</TableCell></TableRow>
                                    ) : stocks.map((stock) => (
                                        <TableRow key={stock.id} className="text-xs hover:bg-gray-50/60 transition-colors whitespace-nowrap">
                                            <TableCell className="py-3 text-gray-700 font-medium">{stock.item?.item_name}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{stock.item_category?.item_category}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{stock.supplier?.item_supplier || "—"}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{stock.store?.item_store || "—"}</TableCell>
                                            <TableCell className="py-3 text-right font-bold text-indigo-600">{stock.quantity}</TableCell>
                                            <TableCell className="py-3 text-right text-gray-500">{stock.purchase_price}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{formatDate(stock.date)}</TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="sm" onClick={() => handleEdit(stock)} className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Pencil className="h-4 w-4" /></Button>
                                                    <Button size="sm" onClick={() => handleDelete(stock.id)} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                            <div>{t("showing_x_to_y_of_z", { from: (pagination?.from || 0).toString(), to: (pagination?.to || 0).toString(), total: (pagination?.total || 0).toString() })}</div>
                            <div className="flex gap-1 items-center">
                                <Button variant="outline" size="sm" disabled={!pagination || pagination.current_page === 1} onClick={() => fetchStocks(pagination!.current_page - 1)} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                                {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                    <Button key={i + 1} size="sm" onClick={() => fetchStocks(i + 1)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all", pagination?.current_page === i + 1 ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200")}>{i + 1}</Button>
                                ))}
                                <Button variant="outline" size="sm" disabled={!pagination || pagination.current_page === pagination.last_page} onClick={() => fetchStocks(pagination!.current_page + 1)} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="sm:max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_item_stock")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("delete_item_stock_confirmation")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white">{t("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
