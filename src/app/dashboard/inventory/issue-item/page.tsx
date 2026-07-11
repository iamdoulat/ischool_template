"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Trash2,
    ArrowLeftRight,
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

interface InventoryIssue {
    id: number;
    item_id: number;
    item_category_id: number;
    user_type: string;
    issue_to: string;
    issue_by: string;
    issue_date: string;
    return_date?: string;
    quantity: number;
    note?: string;
    status: "issued" | "returned";
    item?: { item_name: string };
    item_category?: { item_category: string };
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const TABLE_COLS = 9;

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

export default function IssueItemPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [issues, setIssues] = useState<InventoryIssue[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [limit, setLimit] = useState("50");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
    const [returnItemId, setReturnItemId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteIssueId, setDeleteIssueId] = useState<number | null>(null);

    const [categories, setCategories] = useState<{ id: number; item_category: string }[]>([]);
    const [items, setItems] = useState<{ id: number; item_name: string }[]>([]);
    const [formData, setFormData] = useState({
        user_type: "staff",
        issue_to: "",
        issue_by: "Admin",
        issue_date: new Date().toISOString().split('T')[0],
        return_date: "",
        item_category_id: "",
        item_id: "",
        quantity: "1",
        note: ""
    });

    const fetchCategories = async () => {
        try {
            const response = await api.get('/inventory/item-categories?limit=100');
            setCategories(response.data.data ?? []);
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const fetchItemsByCategory = async (categoryId: string) => {
        if (!categoryId) return;
        try {
            const response = await api.get(`/inventory/items?limit=100&item_category_id=${categoryId}`);
            setItems(response.data.data ?? []);
        } catch (err) {
            console.error("Error fetching items:", err);
        }
    };

    const fetchIssues = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/inventory/issue-items?page=${page}&search=${searchTerm}&limit=${limit}`);
            setIssues(response.data.data ?? response.data ?? []);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching issues:", error);
            tt.error("failed_to_fetch_issue_records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchIssues();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit]);

    useEffect(() => {
        if (formData.item_category_id) fetchItemsByCategory(formData.item_category_id);
    }, [formData.item_category_id]);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchIssues(1); };

    const resetIssueForm = () => {
        setFormData({ user_type: "staff", issue_to: "", issue_by: "Admin", issue_date: new Date().toISOString().split('T')[0], return_date: "", item_category_id: "", item_id: "", quantity: "1", note: "" });
    };

    const handleIssueItem = async () => {
        if (!formData.issue_to || !formData.item_id || !formData.quantity) {
            tt.error("please_fill_required_fields");
            return;
        }
        setSaving(true);
        try {
            await api.post('/inventory/issue-items', formData);
            tt.success("item_issued_successfully");
            setIsDialogOpen(false);
            resetIssueForm();
            fetchIssues();
        } catch (error) {
            console.error("Error issuing item:", error);
            tt.error("failed_to_issue_item");
        } finally {
            setSaving(false);
        }
    };

    const handleReturn = (id: number) => { setReturnItemId(id); setIsReturnDialogOpen(true); };

    const confirmReturn = async () => {
        if (!returnItemId) return;
        try {
            await api.put(`/inventory/issue-items/${returnItemId}`, { status: 'returned' });
            tt.success("item_returned_successfully");
            setIsReturnDialogOpen(false);
            setReturnItemId(null);
            fetchIssues();
        } catch {
            tt.error("failed_to_return_item");
        }
    };

    const handleDelete = (id: number) => { setDeleteIssueId(id); setIsDeleteDialogOpen(true); };

    const confirmDeleteIssue = async () => {
        if (!deleteIssueId) return;
        try {
            await api.delete(`/inventory/issue-items/${deleteIssueId}`);
            tt.success("record_deleted_successfully");
            setIsDeleteDialogOpen(false);
            setDeleteIssueId(null);
            fetchIssues();
        } catch {
            tt.error("failed_to_delete_record");
        }
    };

    const handleCopy = () => {
        const text = issues.map(i => `${i.item?.item_name}\t${i.issue_to}\t${i.status}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const handleExportCSV = () => {
        const headers = [t("item"), t("category"), t("issue_to"), t("issued_by"), t("date"), t("status")];
        const rows = issues.map(i => [i.item?.item_name, i.item_category?.item_category, i.issue_to, i.issue_by, i.issue_date, i.status]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "issued_items.csv");
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
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <ArrowLeftRight className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("issue_item_list")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{pagination?.total ?? issues.length} {t("issue_records")}</p>
                    </div>
                    <Button onClick={() => setIsDialogOpen(true)} className="ml-auto h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                        <Plus className="h-4 w-4" /> {t("issue_item")}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Toolbar */}
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

                    {/* Table */}
                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("item")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("note")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("item_category")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("issue_return")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("issue_to")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("issued_by")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("quantity")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("status")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows rows={6} cols={TABLE_COLS} />
                                ) : issues.length === 0 ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</TableCell></TableRow>
                                ) : issues.map((issue) => (
                                    <TableRow key={issue.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                        <TableCell className="py-3 text-gray-700 font-medium">{issue.item?.item_name}</TableCell>
                                        <TableCell className="py-3 text-gray-400">{issue.note || "—"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{issue.item_category?.item_category}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{issue.issue_date} — {issue.return_date || t("open")}</TableCell>
                                        <TableCell className="py-3 text-gray-700 font-medium">{issue.issue_to}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{issue.issue_by}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{issue.quantity}</TableCell>
                                        <TableCell className="py-3">
                                            {issue.status === "issued" ? (
                                                <Button onClick={() => handleReturn(issue.id)} className="h-5 px-2 bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-bold rounded-full uppercase shadow-sm">
                                                    {t("click_to_return")}
                                                </Button>
                                            ) : (
                                                <span className="inline-flex h-5 px-2 items-center bg-emerald-500 text-white text-[9px] font-bold rounded-full uppercase shadow-sm">
                                                    {t("returned")}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <Button size="sm" onClick={() => handleDelete(issue.id)} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                        <div>{t("showing_x_to_y_of_z", { from: (pagination?.from || 0).toString(), to: (pagination?.to || 0).toString(), total: (pagination?.total || 0).toString() })}</div>
                        <div className="flex gap-1 items-center">
                            <Button variant="outline" size="sm" disabled={!pagination || pagination.current_page === 1} onClick={() => fetchIssues(pagination!.current_page - 1)} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                            {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                <Button key={i + 1} size="sm" onClick={() => fetchIssues(i + 1)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all", pagination?.current_page === i + 1 ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200")}>{i + 1}</Button>
                            ))}
                            <Button variant="outline" size="sm" disabled={!pagination || pagination.current_page === pagination.last_page} onClick={() => fetchIssues(pagination!.current_page + 1)} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Issue Item Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetIssueForm(); }}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-800">{t("issue_item")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("user_type")} <span className="text-red-500">*</span></Label>
                            <Select value={formData.user_type} onValueChange={(val) => setFormData({ ...formData, user_type: val })}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="staff">{t("staff")}</SelectItem>
                                    <SelectItem value="student">{t("student")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("issue_to")} <span className="text-red-500">*</span></Label>
                            <Input className="h-9 text-xs" placeholder={t("name_or_id")} value={formData.issue_to} onChange={(e) => setFormData({ ...formData, issue_to: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("issue_by")} <span className="text-red-500">*</span></Label>
                            <Input className="h-9 text-xs" value={formData.issue_by} onChange={(e) => setFormData({ ...formData, issue_by: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("issue_date")} <span className="text-red-500">*</span></Label>
                            <DatePicker value={formData.issue_date} onChange={(val) => setFormData({ ...formData, issue_date: val })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("return_date")}</Label>
                            <DatePicker value={formData.return_date} onChange={(val) => setFormData({ ...formData, return_date: val })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("item_category")} <span className="text-red-500">*</span></Label>
                            <Select value={formData.item_category_id} onValueChange={(val) => setFormData({ ...formData, item_category_id: val, item_id: "" })}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select")} /></SelectTrigger>
                                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.item_category}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("item")} <span className="text-red-500">*</span></Label>
                            <Select value={formData.item_id} onValueChange={(val) => setFormData({ ...formData, item_id: val })} disabled={!formData.item_category_id}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select")} /></SelectTrigger>
                                <SelectContent>{items.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.item_name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("quantity")} <span className="text-red-500">*</span></Label>
                            <Input type="number" className="h-9 text-xs" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                        </div>
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("note")}</Label>
                            <Textarea className="min-h-[80px] text-xs resize-none" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full" disabled={saving}>{t("cancel")}</Button>
                        <Button onClick={handleIssueItem} disabled={saving} className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[11px] uppercase font-bold shadow-lg active:scale-95 transition-all">
                            {saving ? t("saving") : t("save_issue_record")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Return Confirmation */}
            <AlertDialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
                <AlertDialogContent className="sm:max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("return_item")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("mark_item_as_returned_confirmation")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmReturn} className="bg-emerald-500 hover:bg-emerald-600 text-white">{t("confirm_return")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="sm:max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_issue_record")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("delete_issue_record_confirmation")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteIssue} className="bg-red-500 hover:bg-red-600 text-white">{t("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
