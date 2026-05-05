"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ItemStore {
    id: number;
    item_store: string;
    code: string;
    description: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const mockStores: ItemStore[] = [
    { id: "1", name: "Library Store", code: "LS2", description: "" },
    { id: "2", name: "Science Store", code: "SC2", description: "" },
    { id: "3", name: "Uniform Dress Store", code: "UND23", description: "" },
    { id: "4", name: "Furniture Store", code: "FS342", description: "" },
    { id: "5", name: "Chemistry Equipment", code: "CH201", description: "The basic idea about the proper and necessary chemistry lab apparatus should be cleared among the students." },
    { id: "6", name: "Sports Store", code: "spSS", description: "" },
];

export default function ItemStorePage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [stores, setStores] = useState<ItemStore[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [limit, setLimit] = useState("50");
    const [formData, setFormData] = useState({
        item_store: "",
        code: "",
        description: ""
    });

    const fetchStores = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/inventory/item-stores?page=${page}&search=${searchTerm}&limit=${limit}`);
            setStores(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching stores:", error);
            toast({
                title: "Error",
                description: "Failed to fetch stores",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, [limit]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStores(1);
    };

    const handleSave = async () => {
        if (!formData.item_store) {
            toast({
                title: "Validation Error",
                description: "Item Store Name is required",
                variant: "destructive",
            });
            return;
        }
        
        try {
            if (isEditing && currentId) {
                await api.put(`/inventory/item-stores/${currentId}`, formData);
                toast({ title: "Success", description: "Store updated successfully" });
            } else {
                await api.post('/inventory/item-stores', formData);
                toast({ title: "Success", description: "Store added successfully" });
            }
            setIsEditing(false);
            setCurrentId(null);
            setFormData({ item_store: "", code: "", description: "" });
            fetchStores();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Something went wrong",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (store: ItemStore) => {
        setIsEditing(true);
        setCurrentId(store.id);
        setFormData({
            item_store: store.item_store,
            code: store.code || "",
            description: store.description || ""
        });
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this store?")) {
            try {
                await api.delete(`/inventory/item-stores/${id}`);
                toast({ title: "Success", description: "Store deleted successfully" });
                fetchStores();
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to delete store",
                    variant: "destructive",
                });
            }
        }
    };

    const handleCopy = () => {
        const text = stores.map(s => `${s.item_store}\t${s.code}\t${s.description}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };

    const handleExportCSV = () => {
        const headers = ["Item Store Name", "Item Store Code", "Description"];
        const rows = stores.map(s => [s.item_store, s.code, s.description]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "item_stores.csv");
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
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs text-gray-700">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Add Item Store Form */}
                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800 tracking-tight">Add Item Store</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Item Store Name <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input
                                    className="h-9 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none"
                                    placeholder=""
                                    value={formData.item_store}
                                    onChange={(e) => setFormData({ ...formData, item_store: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Item Store Code
                                </Label>
                                <Input
                                    className="h-9 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none"
                                    placeholder=""
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Description
                                </Label>
                                <Textarea
                                    className="min-h-[100px] border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none resize-none"
                                    placeholder=""
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end pt-2 gap-2">
                                {isEditing && (
                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setIsEditing(false);
                                            setCurrentId(null);
                                            setFormData({ item_store: "", code: "", description: "" });
                                        }}
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

                {/* Right Section: Item Store List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                        <h2 className="text-sm font-medium text-gray-800 tracking-tight">Item Store List</h2>

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
                            <Table className="min-w-[800px]">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Item Store Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Item Store Code <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Description <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stores.map((store) => (
                                        <TableRow key={store.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                            <TableCell className="py-3 text-gray-700 font-medium">{store.item_store}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{store.code}</TableCell>
                                            <TableCell className="py-2.5 text-gray-500 max-w-[400px] whitespace-normal">
                                                {store.description || "—"}
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button 
                                                        size="icon" 
                                                        onClick={() => handleEdit(store)}
                                                        className="btn-action bg-indigo-500 hover:bg-indigo-600 shadow-indigo-100"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button 
                                                        size="icon" 
                                                        onClick={() => handleDelete(store.id)}
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
                                    onClick={() => fetchStores(pagination!.current_page - 1)}
                                    className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                    <Button 
                                        key={i + 1}
                                        onClick={() => fetchStores(i + 1)}
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
                                    onClick={() => fetchStores(pagination!.current_page + 1)}
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
