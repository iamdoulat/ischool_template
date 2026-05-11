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
    Phone,
    Mail,
    User,
    MapPin,
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
    X,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Supplier {
    id: number;
    item_supplier: string;
    phone: string;
    email: string;
    address: string;
    contact_person_name: string;
    contact_person_phone: string;
    contact_person_email: string;
    description: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}


export default function ItemSupplierPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [limit, setLimit] = useState("50");
    const [formData, setFormData] = useState({
        item_supplier: "",
        phone: "",
        email: "",
        address: "",
        contact_person_name: "",
        contact_person_phone: "",
        contact_person_email: "",
        description: ""
    });

    const fetchSuppliers = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/inventory/item-suppliers?page=${page}&search=${searchTerm}&limit=${limit}`);
            setSuppliers(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            toast({
                title: "Error",
                description: "Failed to fetch suppliers",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [limit]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSuppliers(1);
    };

    const handleSave = async () => {
        if (!formData.item_supplier) {
            toast({
                title: "Validation Error",
                description: "Name is required",
                variant: "destructive",
            });
            return;
        }
        
        try {
            if (isEditing && currentId) {
                await api.put(`/inventory/item-suppliers/${currentId}`, formData);
                toast({ title: "Success", description: "Supplier updated successfully" });
            } else {
                await api.post('/inventory/item-suppliers', formData);
                toast({ title: "Success", description: "Supplier added successfully" });
            }
            setIsEditing(false);
            setCurrentId(null);
            setFormData({
                item_supplier: "", phone: "", email: "", address: "",
                contact_person_name: "", contact_person_phone: "", contact_person_email: "", description: ""
            });
            fetchSuppliers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Something went wrong",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (s: Supplier) => {
        setIsEditing(true);
        setCurrentId(s.id);
        setFormData({
            item_supplier: s.item_supplier,
            phone: s.phone || "",
            email: s.email || "",
            address: s.address || "",
            contact_person_name: s.contact_person_name || "",
            contact_person_phone: s.contact_person_phone || "",
            contact_person_email: s.contact_person_email || "",
            description: s.description || ""
        });
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/inventory/item-suppliers/${id}`);
            toast({ title: "Success", description: "Supplier deleted successfully" });
            fetchSuppliers();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete supplier",
                variant: "destructive",
            });
        }
    };

    const handleCopy = () => {
        const text = suppliers.map(s => `${s.item_supplier}\t${s.contact_person_name}\t${s.address}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };

    const handleExportCSV = () => {
        const headers = ["Item Supplier", "Contact Person", "Address"];
        const rows = suppliers.map(s => [s.item_supplier, s.contact_person_name, s.address]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "item_suppliers.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: handlePrint, title: "Print" },
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs text-gray-700">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Add Item Supplier Form */}
                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800 tracking-tight">Add Item Supplier</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight flex justify-between">
                                    Name <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input 
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none pr-8" 
                                    placeholder="" 
                                    value={formData.item_supplier}
                                    onChange={e => setFormData({...formData, item_supplier: e.target.value})}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Phone</Label>
                                <Input 
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" 
                                    placeholder="" 
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Email</Label>
                                <Input 
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" 
                                    placeholder="" 
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Address</Label>
                                <Textarea 
                                    className="min-h-[60px] border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none resize-none" 
                                    placeholder="" 
                                    value={formData.address}
                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Contact Person Name</Label>
                                <Input 
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" 
                                    placeholder="" 
                                    value={formData.contact_person_name}
                                    onChange={e => setFormData({...formData, contact_person_name: e.target.value})}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Contact Person Phone</Label>
                                <Input 
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" 
                                    placeholder="" 
                                    value={formData.contact_person_phone}
                                    onChange={e => setFormData({...formData, contact_person_phone: e.target.value})}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Contact Person Email</Label>
                                <Input 
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none" 
                                    placeholder="" 
                                    value={formData.contact_person_email}
                                    onChange={e => setFormData({...formData, contact_person_email: e.target.value})}
                                />
                            </div>

                            <div className="flex justify-end pt-4 gap-2">
                                {isEditing && (
                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                item_supplier: "", phone: "", email: "", address: "",
                                                contact_person_name: "", contact_person_phone: "", contact_person_email: "", description: ""
                                            });
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
                                    {isEditing ? "Update" : "Add"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Item Supplier List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                        <h2 className="text-sm font-medium text-gray-800 tracking-tight">Item Supplier List</h2>

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
                            <Table className="min-w-[900px]">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Item Supplier <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Contact Person <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Address <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {suppliers.map((s) => (
                                        <TableRow key={s.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                            <TableCell className="py-4">
                                                <div className="space-y-1.5 min-w-[200px]">
                                                    <div className="font-semibold text-gray-700 underline decoration-indigo-200 underline-offset-2">{s.item_supplier}</div>
                                                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50/50 w-fit px-1.5 py-0.5 rounded border border-gray-100/50">
                                                        <Phone className="h-3 w-3 text-indigo-400 shrink-0" />
                                                        <span>{s.phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50/50 w-fit px-1.5 py-0.5 rounded border border-gray-100/50">
                                                        <Mail className="h-3 w-3 text-emerald-400 shrink-0" />
                                                        <span>{s.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="space-y-1.5 min-w-[200px]">
                                                    <div className="flex items-center gap-1.5 font-semibold text-gray-700 underline decoration-indigo-200 underline-offset-2">
                                                        <User className="h-3 w-3 text-amber-500" />
                                                        {s.contact_person_name}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50/50 w-fit px-1.5 py-0.5 rounded border border-gray-100/50">
                                                        <Phone className="h-3 w-3 text-indigo-400 shrink-0" />
                                                        <span>{s.contact_person_phone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50/50 w-fit px-1.5 py-0.5 rounded border border-gray-100/50">
                                                        <Mail className="h-3 w-3 text-emerald-400 shrink-0" />
                                                        <span>{s.contact_person_email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-start gap-2 text-gray-500 max-w-[250px] bg-gray-50/30 p-2 rounded border border-gray-100">
                                                    <MapPin className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" />
                                                    <span className="whitespace-normal leading-relaxed">{s.address}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button size="icon" className="btn-action bg-green-500 hover:bg-green-600 shadow-green-100">
                                                        <Phone className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button 
                                                        size="icon" 
                                                        onClick={() => handleEdit(s)}
                                                        className="btn-action bg-indigo-500 hover:bg-indigo-600 shadow-indigo-100"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button 
                                                        size="icon" 
                                                        onClick={() => handleDelete(s.id)}
                                                        className="btn-action bg-rose-500 hover:bg-rose-600 shadow-rose-100"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
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
                                    onClick={() => fetchSuppliers(pagination!.current_page - 1)}
                                    className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                    <Button 
                                        key={i + 1}
                                        onClick={() => fetchSuppliers(i + 1)}
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
                                    onClick={() => fetchSuppliers(pagination!.current_page + 1)}
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
