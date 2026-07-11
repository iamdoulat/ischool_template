"use client";

import { useState, useEffect } from "react";
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
    ArrowUpDown,
    Trash2,
    Save,
    Truck,
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

const TABLE_COLS = 4;

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

const EMPTY_FORM = {
    item_supplier: "", phone: "", email: "", address: "",
    contact_person_name: "", contact_person_phone: "", contact_person_email: "", description: ""
};

export default function ItemSupplierPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [limit, setLimit] = useState("50");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteSupplierId, setDeleteSupplierId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });

    const fetchSuppliers = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/inventory/item-suppliers?page=${page}&search=${searchTerm}&limit=${limit}`);
            setSuppliers(response.data.data ?? response.data ?? []);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            tt.error("failed_to_fetch_suppliers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit]);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchSuppliers(1); };

    const resetForm = () => { setIsEditing(false); setCurrentId(null); setFormData({ ...EMPTY_FORM }); };

    const handleSave = async () => {
        if (!formData.item_supplier) {
            tt.error("supplier_name_is_required");
            return;
        }
        setSaving(true);
        try {
            if (isEditing && currentId) {
                await api.put(`/inventory/item-suppliers/${currentId}`, formData);
                tt.success("supplier_updated_successfully");
            } else {
                await api.post('/inventory/item-suppliers', formData);
                tt.success("supplier_added_successfully");
            }
            resetForm();
            fetchSuppliers();
        } catch (error) {
            console.error("Error saving supplier:", error);
            tt.error("something_went_wrong");
        } finally {
            setSaving(false);
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

    const handleDelete = (id: number) => { setDeleteSupplierId(id); setIsDeleteDialogOpen(true); };

    const confirmDelete = async () => {
        if (!deleteSupplierId) return;
        try {
            await api.delete(`/inventory/item-suppliers/${deleteSupplierId}`);
            tt.success("supplier_deleted_successfully");
            setIsDeleteDialogOpen(false);
            setDeleteSupplierId(null);
            fetchSuppliers();
        } catch {
            tt.error("failed_to_delete_supplier");
        }
    };

    const handleCopy = () => {
        const text = suppliers.map(s => `${s.item_supplier}\t${s.contact_person_name}\t${s.address}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const handleExportCSV = () => {
        const headers = [t("item_supplier"), t("contact_person"), t("address")];
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
                            <Truck className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{isEditing ? t("edit_item_supplier") : t("add_item_supplier")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{isEditing ? t("update_selected_supplier") : t("create_new_supplier")}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("name")} <span className="text-red-500">*</span></Label>
                            <Input value={formData.item_supplier} onChange={e => setFormData({ ...formData, item_supplier: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("phone")}</Label>
                            <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("email")}</Label>
                            <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("address")}</Label>
                            <Textarea className="resize-none min-h-[60px]" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("contact_person_name")}</Label>
                            <Input value={formData.contact_person_name} onChange={e => setFormData({ ...formData, contact_person_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("contact_person_phone")}</Label>
                            <Input value={formData.contact_person_phone} onChange={e => setFormData({ ...formData, contact_person_phone: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("contact_person_email")}</Label>
                            <Input value={formData.contact_person_email} onChange={e => setFormData({ ...formData, contact_person_email: e.target.value })} />
                        </div>
                        <div className="flex justify-end pt-2 gap-2">
                            {isEditing && <Button variant="outline" onClick={resetForm} className="h-9 px-6 rounded-full text-xs font-bold">{t("cancel")}</Button>}
                            <Button onClick={handleSave} disabled={saving} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                                <Save className="h-4 w-4" /> {isEditing ? t("update") : t("add")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: List */}
                <Card className="lg:col-span-2 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Truck className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("item_supplier_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{pagination?.total ?? suppliers.length} {t("suppliers")}</p>
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
                            <Table className="min-w-[900px]">
                                <TableHeader className="bg-gray-50 text-xs uppercase">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap">
                                        <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("item_supplier")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                        <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("contact_person")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                        <TableHead className="font-semibold text-gray-600">{t("address")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-right">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <SkeletonRows rows={6} cols={TABLE_COLS} />
                                    ) : suppliers.length === 0 ? (
                                        <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</TableCell></TableRow>
                                    ) : suppliers.map((s) => (
                                        <TableRow key={s.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                            <TableCell className="py-4">
                                                <div className="space-y-1.5 min-w-[200px]">
                                                    <div className="font-semibold text-gray-700">{s.item_supplier}</div>
                                                    <div className="flex items-center gap-1.5 text-gray-500"><Phone className="h-3 w-3 text-indigo-400 shrink-0" /><span>{s.phone || "—"}</span></div>
                                                    <div className="flex items-center gap-1.5 text-gray-500"><Mail className="h-3 w-3 text-emerald-400 shrink-0" /><span>{s.email || "—"}</span></div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="space-y-1.5 min-w-[200px]">
                                                    <div className="flex items-center gap-1.5 font-semibold text-gray-700"><User className="h-3 w-3 text-amber-500" />{s.contact_person_name || "—"}</div>
                                                    <div className="flex items-center gap-1.5 text-gray-500"><Phone className="h-3 w-3 text-indigo-400 shrink-0" /><span>{s.contact_person_phone || "—"}</span></div>
                                                    <div className="flex items-center gap-1.5 text-gray-500"><Mail className="h-3 w-3 text-emerald-400 shrink-0" /><span>{s.contact_person_email || "—"}</span></div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-start gap-2 text-gray-500 max-w-[250px]"><MapPin className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" /><span className="whitespace-normal leading-relaxed">{s.address || "—"}</span></div>
                                            </TableCell>
                                            <TableCell className="py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="sm" onClick={() => handleEdit(s)} className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Pencil className="h-4 w-4" /></Button>
                                                    <Button size="sm" onClick={() => handleDelete(s.id)} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Trash2 className="h-4 w-4" /></Button>
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
                                <Button variant="outline" size="sm" disabled={!pagination || pagination.current_page === 1} onClick={() => fetchSuppliers(pagination!.current_page - 1)} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                                {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                    <Button key={i + 1} size="sm" onClick={() => fetchSuppliers(i + 1)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all", pagination?.current_page === i + 1 ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200")}>{i + 1}</Button>
                                ))}
                                <Button variant="outline" size="sm" disabled={!pagination || pagination.current_page === pagination.last_page} onClick={() => fetchSuppliers(pagination!.current_page + 1)} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="sm:max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_item_supplier")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("delete_item_supplier_confirmation")}</AlertDialogDescription>
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
