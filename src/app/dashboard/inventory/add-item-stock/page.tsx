"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
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
    Plus,
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
    UploadCloud,
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


export default function AddItemStockPage() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [stocks, setStocks] = useState<ItemStock[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [limit, setLimit] = useState("50");

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

    const fetchData = async () => {
        try {
            const [catRes, supRes, storeRes] = await Promise.all([
                api.get('/inventory/item-categories?limit=100'),
                api.get('/inventory/item-suppliers?limit=100'),
                api.get('/inventory/item-stores?limit=100')
            ]);
            setCategories(catRes.data.data.map((c: any) => ({ id: c.id, name: c.item_category })));
            setSuppliers(supRes.data.data.map((s: any) => ({ id: s.id, name: s.item_supplier })));
            setStores(storeRes.data.data.map((s: any) => ({ id: s.id, name: s.item_store })));
        } catch (error) {
            console.error("Error fetching dropdown data:", error);
        }
    };

    const fetchItemsByCategory = async (categoryId: string) => {
        if (!categoryId) return;
        try {
            const response = await api.get(`/inventory/items?limit=100&item_category_id=${categoryId}`);
            setItems(response.data.data.map((i: any) => ({ id: i.id, name: i.item_name })));
        } catch (error) {
            console.error("Error fetching items:", error);
        }
    };

    const fetchStocks = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/inventory/item-stocks?page=${page}&search=${searchTerm}&limit=${limit}`);
            setStocks(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching stocks:", error);
            toast({ title: "Error", description: "Failed to fetch stocks", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchStocks();
    }, [limit]);

    useEffect(() => {
        if (formData.item_category_id) {
            fetchItemsByCategory(formData.item_category_id);
        }
    }, [formData.item_category_id]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStocks(1);
    };

    const handleSave = async () => {
        if (!formData.item_category_id || !formData.item_id || !formData.quantity || !formData.purchase_price) {
            toast({ title: "Validation Error", description: "Please fill all required fields", variant: "destructive" });
            return;
        }
        
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value) data.append(key, value);
        });
        if (documentFile) data.append('document', documentFile);

        try {
            if (isEditing && currentId) {
                await api.post(`/inventory/item-stocks/${currentId}?_method=PUT`, data);
                toast({ title: "Success", description: "Stock updated successfully" });
            } else {
                await api.post('/inventory/item-stocks', data);
                toast({ title: "Success", description: "Stock added successfully" });
            }
            resetForm();
            fetchStocks();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Something went wrong",
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormData({
            item_category_id: "",
            item_id: "",
            item_supplier_id: "",
            item_store_id: "",
            quantity: "",
            purchase_price: "",
            date: new Date().toISOString().split('T')[0],
            description: ""
        });
        setDocumentFile(null);
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

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this stock entry?")) {
            try {
                await api.delete(`/inventory/item-stocks/${id}`);
                toast({ title: "Success", description: "Stock deleted successfully" });
                fetchStocks();
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete stock", variant: "destructive" });
            }
        }
    };

    const handleCopy = () => {
        const text = stocks.map(s => `${s.item?.item_name}\t${s.item_category?.item_category}\t${s.quantity}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };

    const handleExportCSV = () => {
        const headers = ["Item", "Category", "Supplier", "Store", "Quantity", "Price", "Date"];
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
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Add Item Stock */}
                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800">Add Item Stock</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Item Category <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Select 
                                    value={formData.item_category_id}
                                    onValueChange={(val) => setFormData({ ...formData, item_category_id: val, item_id: "" })}
                                >
                                    <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Item <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Select
                                    value={formData.item_id}
                                    onValueChange={(val) => setFormData({ ...formData, item_id: val })}
                                    disabled={!formData.item_category_id}
                                >
                                    <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder={formData.item_category_id ? "Select" : "Select Category First"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {items.map(i => (
                                            <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Supplier
                                </Label>
                                <Select
                                    value={formData.item_supplier_id}
                                    onValueChange={(val) => setFormData({ ...formData, item_supplier_id: val })}
                                >
                                    <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Store
                                </Label>
                                <Select
                                    value={formData.item_store_id}
                                    onValueChange={(val) => setFormData({ ...formData, item_store_id: val })}
                                >
                                    <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stores.map(s => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Quantity <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <div className="flex gap-0.5">
                                    <div className="flex-1">
                                        <Input 
                                            type="number" 
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                            className="h-9 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded-l shadow-none border-r-0" 
                                        />
                                    </div>
                                    <div className="flex bg-gray-50 border border-gray-200 rounded-r items-center px-2 text-gray-400 text-xs">
                                        + ∨
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Purchase Price (₹) <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input 
                                    className="h-9 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none" 
                                    value={formData.purchase_price}
                                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <DatePicker 
                                    value={formData.date}
                                    onChange={(val) => setFormData({ ...formData, date: val })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Attach Document
                                </Label>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <UploadCloud className="h-5 w-5 text-gray-400" />
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {documentFile ? documentFile.name : "Drag and drop a file here or click"}
                                    </span>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Description
                                </Label>
                                <Textarea 
                                    className="min-h-[80px] border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none resize-none" 
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end pt-2 gap-2">
                                {isEditing && (
                                    <Button 
                                        variant="outline" 
                                        onClick={resetForm}
                                        className="px-6 h-8 text-[11px] font-bold uppercase rounded-full"
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button 
                                    className="btn-gradient px-10 h-9 text-[11px] font-bold uppercase flex items-center gap-2"
                                    onClick={handleSave}
                                >
                                    <span className="text-sm font-bold">+</span>
                                    {isEditing ? "Update" : "Save"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Item Stock List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-sm font-medium text-gray-800">Item Stock List</h2>

                         {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-4">
                            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-fit">
                                <div className="relative w-full md:w-64">
                                    <Input
                                        placeholder="Search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-3 h-9 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/50"
                                    />
                                </div>
                                <Button type="submit" className="btn-gradient h-9 px-6 text-[11px] font-bold flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    Search
                                </Button>
                            </form>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <Select value={limit} onValueChange={setLimit}>
                                        <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 bg-transparent shadow-none rounded-md px-2 flex gap-1 items-center justify-between">
                                            <SelectValue />
                                            <ChevronLeft className="h-2 w-2 text-gray-400 rotate-90" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    {toolbarActions.map((action, i) => (
                                        <Button 
                                            key={i} 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={action.onClick}
                                            title={action.title}
                                            className="h-7 w-7 hover:bg-gray-100 rounded"
                                        >
                                            <action.Icon className="h-3.5 w-3.5" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[1000px]">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Item <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Category <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Supplier <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Store <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 cursor-pointer">Quantity <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">
                                            Purchase Price (₹)
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Date <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stocks.map((item) => (
                                        <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                            <TableCell className="py-3 text-gray-700 font-medium">{item.item?.item_name}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.item_category?.item_category}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.supplier?.item_supplier || "—"}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.store?.item_store || "—"}</TableCell>
                                            <TableCell className="py-3 text-right text-gray-700 font-medium">{item.quantity}</TableCell>
                                            <TableCell className="py-3 text-right text-gray-500">{item.purchase_price}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{formatDate(item.date)}</TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button 
                                                        size="icon" 
                                                        onClick={() => handleEdit(item)}
                                                        className="btn-action bg-indigo-500 hover:bg-indigo-600 shadow-indigo-100"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button 
                                                        size="icon" 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="btn-action bg-rose-500 hover:bg-rose-600 shadow-rose-100"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                         {/* Footer / Pagination */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50">
                            <div>
                                Showing {pagination?.from || 0} to {pagination?.to || 0} of {pagination?.total || 0} entries
                            </div>
                            <div className="flex gap-2 items-center">
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    disabled={pagination?.current_page === 1}
                                    onClick={() => fetchStocks(pagination!.current_page - 1)}
                                    className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                    <Button 
                                        key={i + 1}
                                        onClick={() => fetchStocks(i + 1)}
                                        className={cn(
                                            "h-7 w-7 p-0 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300",
                                            pagination?.current_page === i + 1 
                                                ? "btn-gradient" 
                                                : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-100"
                                        )}
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    disabled={pagination?.current_page === pagination?.last_page}
                                    onClick={() => fetchStocks(pagination!.current_page + 1)}
                                    className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
