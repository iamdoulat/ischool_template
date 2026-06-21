"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
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
    PackagePlus,
    Package,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
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

interface InventoryItem {
    id: number;
    item_name: string;
    description: string;
    item_category_id: number;
    unit: string;
    item_category?: { id: number; item_category: string };
    available_quantity?: number;
}

interface ItemCategory {
    id: number;
    item_category: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const TABLE_COLS = 6;

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

export default function AddItemPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<ItemCategory[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [limit, setLimit] = useState("50");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ item_name: "", item_category_id: "", unit: "", description: "" });

    const fetchCategories = async () => {
        try {
            const response = await api.get('/inventory/item-categories?limit=100');
            setCategories(response.data.data ?? []);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const fetchItems = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/inventory/items?page=${page}&search=${searchTerm}&limit=${limit}`);
            setItems(response.data.data ?? response.data ?? []);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching items:", error);
            toast({ title: "Error", description: "Failed to fetch items", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit]);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchItems(1); };

    const resetForm = () => { setIsEditing(false); setCurrentId(null); setFormData({ item_name: "", item_category_id: "", unit: "", description: "" }); };

    const handleSave = async () => {
        if (!formData.item_name || !formData.item_category_id || !formData.unit) {
            toast({ title: "Validation Error", description: "Item Name, Category and Unit are required", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            if (isEditing && currentId) {
                await api.put(`/inventory/items/${currentId}`, formData);
                toast({ title: "Success", description: "Item updated successfully" });
            } else {
                await api.post('/inventory/items', formData);
                toast({ title: "Success", description: "Item added successfully" });
            }
            resetForm();
            fetchItems();
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Something went wrong";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item: InventoryItem) => {
        setIsEditing(true);
        setCurrentId(item.id);
        setFormData({ item_name: item.item_name, item_category_id: String(item.item_category_id), unit: item.unit || "", description: item.description || "" });
    };

    const handleDelete = (id: number) => { setDeleteItemId(id); setIsDeleteDialogOpen(true); };

    const confirmDelete = async () => {
        if (!deleteItemId) return;
        try {
            await api.delete(`/inventory/items/${deleteItemId}`);
            toast({ title: "Success", description: "Item deleted successfully" });
            setIsDeleteDialogOpen(false);
            setDeleteItemId(null);
            fetchItems();
        } catch {
            toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
        }
    };

    const handleCopy = () => {
        const text = items.map(i => `${i.item_name}\t${i.item_category?.item_category}\t${i.unit}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };

    const handleExportCSV = () => {
        const headers = ["Item", "Item Category", "Unit", "Description"];
        const rows = items.map(i => [i.item_name, i.item_category?.item_category, i.unit, i.description]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "inventory_items.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Add Form */}
                <Card className="h-fit border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <PackagePlus className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{isEditing ? "Edit Item" : "Add Item"}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{isEditing ? "Update selected item" : "Create a new inventory item"}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Item <span className="text-red-500">*</span></Label>
                            <Input value={formData.item_name} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Item Category <span className="text-red-500">*</span></Label>
                            <Select value={formData.item_category_id} onValueChange={(val) => setFormData({ ...formData, item_category_id: val })}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.item_category}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Unit <span className="text-red-500">*</span></Label>
                            <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Description</Label>
                            <Textarea className="resize-none" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="flex justify-end pt-2 gap-2">
                            {isEditing && <Button variant="outline" onClick={resetForm} className="h-9 px-6 rounded-full text-xs font-bold">Cancel</Button>}
                            <Button onClick={handleSave} disabled={saving} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                                <Save className="h-4 w-4" /> {isEditing ? "Update" : "Save"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: List */}
                <Card className="lg:col-span-2 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Package className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Item List</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{pagination?.total ?? items.length} item{(pagination?.total ?? items.length) === 1 ? "" : "s"}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
                                <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 text-xs w-full md:w-64" />
                                <Button type="submit" className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                                    <Search className="h-4 w-4" /> Search
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
                            <Table className="min-w-[900px]">
                                <TableHeader className="bg-gray-50 text-xs uppercase">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap">
                                        <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">Item <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                        <TableHead className="font-semibold text-gray-600">Description</TableHead>
                                        <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">Category <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                        <TableHead className="font-semibold text-gray-600">Unit</TableHead>
                                        <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">Available Qty <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <SkeletonRows rows={6} cols={TABLE_COLS} />
                                    ) : items.length === 0 ? (
                                        <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">No data found</TableCell></TableRow>
                                    ) : items.map((item) => (
                                        <TableRow key={item.id} className="text-xs hover:bg-gray-50/60 transition-colors whitespace-nowrap">
                                            <TableCell className="py-3 text-gray-700 font-medium">{item.item_name}</TableCell>
                                            <TableCell className="py-3 text-gray-400 italic max-w-[160px] truncate">{item.description || "—"}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.item_category?.item_category || "—"}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.unit}</TableCell>
                                            <TableCell className="py-3 font-bold text-indigo-600">{item.available_quantity ?? 0}</TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="sm" onClick={() => handleEdit(item)} className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Pencil className="h-4 w-4" /></Button>
                                                    <Button size="sm" onClick={() => handleDelete(item.id)} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                            <div>Showing {pagination?.from || 0} to {pagination?.to || 0} of {pagination?.total || 0} entries</div>
                            <div className="flex gap-1 items-center">
                                <Button variant="outline" size="sm" disabled={!pagination || pagination.current_page === 1} onClick={() => fetchItems(pagination!.current_page - 1)} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                                {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                    <Button key={i + 1} size="sm" onClick={() => fetchItems(i + 1)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all", pagination?.current_page === i + 1 ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200")}>{i + 1}</Button>
                                ))}
                                <Button variant="outline" size="sm" disabled={!pagination || pagination.current_page === pagination.last_page} onClick={() => fetchItems(pagination!.current_page + 1)} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="sm:max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Item</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete this item? This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
