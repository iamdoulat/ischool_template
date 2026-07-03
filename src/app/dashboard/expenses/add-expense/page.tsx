"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Copy, FileSpreadsheet, FileText, Printer, Columns, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, Save, FileCode, Download, Eye, MinusCircle, ClipboardList } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDate } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useImageUrl, useBaseUrl } from "@/lib/image-url";
import { useTranslation } from "@/hooks/use-translation";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

interface ExpenseRecord {
    id: string;
    name: string;
    description: string;
    invoice_number: string;
    date: string;
    expense_head_id: string;
    expense_head: { expense_head: string };
    amount: number;
    document?: string;
}

interface ExpenseHead {
    id: string;
    expense_head: string;
}

export default function AddExpensePage() {
    const { t } = useTranslation();
    const { formatCurrency, symbol: currencySymbol } = useCurrencyFormatter();
    const getImageUrl = useImageUrl();
    const baseApiUrl = useBaseUrl();
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");
    const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
    const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [invoicePrintSettings, setInvoicePrintSettings] = useState<{ header_image_url: string | null; footer_content: string }>({ header_image_url: null, footer_content: "" });

    const [formData, setFormData] = useState({
        expense_head_id: "",
        name: "",
        invoice_number: "",
        date: new Date().toISOString().split('T')[0],
        amount: "",
        description: "",
        document: null as File | null
    });

    const fetchNextExpenseNumber = async () => {
        try {
            const res = await api.get("expense/expenses/next-expense-number");
            if (res.data?.status === "Success" && res.data.data?.invoice_number) {
                setFormData(prev => ({ ...prev, invoice_number: res.data.data.invoice_number }));
            }
        } catch { /* silently fail */ }
    };

    const fetchInvoicePrintSettings = async () => {
        try {
            const res = await api.get("system-setting/print-settings");
            if (res.data?.status === "success") {
                const invoice = (res.data.data || []).find((s: { type: string }) => s.type === "Invoice");
                if (invoice) {
                    setInvoicePrintSettings({
                        header_image_url: invoice.header_image_url || null,
                        footer_content: invoice.footer_content || "",
                    });
                }
            }
        } catch { /* silently fail */ }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expenseRes, headRes] = await Promise.all([
                api.get("expense/expenses"),
                api.get("expense/expense-heads")
            ]);
            if (expenseRes.data?.status === "Success") setExpenses(expenseRes.data.data);
            if (headRes.data?.status === "Success") setExpenseHeads(headRes.data.data);
            await Promise.all([fetchNextExpenseNumber(), fetchInvoicePrintSettings()]);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error(t("failed_to_load_records"));
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, document: e.target.files[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.expense_head_id || !formData.name || !formData.date || !formData.amount) {
            toast.error(t("please_fill_all_required_fields"));
            return;
        }
        const data = new FormData();
        data.append("expense_head_id", formData.expense_head_id);
        data.append("name", formData.name);
        data.append("invoice_number", formData.invoice_number);
        data.append("date", formData.date);
        data.append("amount", formData.amount);
        data.append("description", formData.description);
        if (formData.document) data.append("document", formData.document);

        try {
            setSaving(true);
            let res;
            if (editingId) {
                data.append("_method", "PUT");
                res = await api.post('expense/expenses/' + editingId, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                res = await api.post("expense/expenses", data, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            if (res.data?.status === "Success") {
                toast.success(editingId ? t("expense_updated_successfully") : t("expense_saved_successfully"));
                resetForm();
                fetchData();
            }
        } catch (error) {
            console.error("Error saving expense:", error);
            toast.error(t("failed_to_save_expense"));
        } finally { setSaving(false); }
    };

    const resetForm = () => {
        setFormData({
            expense_head_id: "",
            name: "",
            invoice_number: "",
            date: new Date().toISOString().split('T')[0],
            amount: "",
            description: "",
            document: null
        });
        setEditingId(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleEdit = (item: ExpenseRecord) => {
        setEditingId(item.id);
        setFormData({
            expense_head_id: item.expense_head_id.toString(),
            name: item.name,
            invoice_number: item.invoice_number || "",
            date: item.date,
            amount: item.amount.toString(),
            description: item.description || "",
            document: null
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("are_you_sure_delete_expense"))) return;
        try {
            const res = await api.delete('expense/expenses/' + id);
            if (res.data?.status === "Success") {
                toast.success(t("expense_deleted_successfully"));
                fetchData();
            }
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast.error(t("failed_to_delete_expense"));
        }
    };

    const filteredData = expenses.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.expense_head.expense_head.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.invoice_number && item.invoice_number.includes(searchTerm))
    );

    const exportData = filteredData.map(item => ({
        [t("name")]: item.name,
        [t("description")]: item.description,
        [t("expense_number")]: item.invoice_number,
        [t("date")]: item.date,
        [t("expense_head")]: item.expense_head.expense_head,
        [t("amount")]: item.amount
    }));

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t("expenses"));
        XLSX.writeFile(wb, "expenses.xlsx");
        toast.success(t("exported_to_excel"));
    };

    const exportToCSV = () => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "expenses.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t("exported_to_csv"));
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text(t("expense_list"), 14, 15);
        autoTable(doc, {
            head: [[t('name'), t('expense_number'), t('date'), t('expense_head'), t('amount')]],
            body: filteredData.map(item => [item.name, item.invoice_number, item.date, item.expense_head.expense_head, item.amount]),
            startY: 20,
        });
        doc.save("expenses.pdf");
        toast.success(t("exported_to_pdf"));
    };

    const loadImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => {
                const fallbackImg = new Image();
                fallbackImg.onload = () => resolve(fallbackImg);
                fallbackImg.onerror = reject;
                fallbackImg.src = url;
            };
            img.src = url;
        });

    const downloadInvoicePDF = async (item: ExpenseRecord) => {
        const doc = new jsPDF();
        let startY = 15;
        const formatPdfCurrency = (val: number) => {
            let str = formatCurrency(val);
            str = str.replace(/[^\x00-\x7F]/g, "").trim();
            return str;
        };
        const { header_image_url, footer_content } = invoicePrintSettings;
        if (header_image_url) {
            try {
                let imgUrl = header_image_url;
                if (imgUrl.startsWith('/')) imgUrl = baseApiUrl + imgUrl;
                imgUrl = imgUrl.replace('localhost', '127.0.0.1');
                const img = await loadImage(imgUrl);
                const imgWidth = 190;
                const imgHeight = (img.naturalHeight / img.naturalWidth) * imgWidth;
                doc.addImage(img, 'PNG', 10, startY, imgWidth, imgHeight);
                startY += imgHeight + 10;
            } catch { /* silently continue */ }
        }
        doc.setFontSize(16);
        doc.text(t("expense_invoice"), 14, startY);
        startY += 10;
        doc.setFontSize(10);
        doc.text(t("expense_no_x", { number: item.invoice_number || 'N/A' }), 14, startY);
        startY += 6;
        doc.text(t("date_x", { date: formatDate(item.date) }), 14, startY);
        startY += 6;
        doc.text(t("expense_head_x", { head: item.expense_head.expense_head }), 14, startY);
        startY += 6;
        doc.line(14, startY, 196, startY);
        startY += 4;
        autoTable(doc, {
            head: [[t('description'), t('amount')]],
            body: [[item.name, formatPdfCurrency(item.amount)]],
            startY,
        });
        let finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text(t("total_x", { amount: formatPdfCurrency(item.amount) }), 14, finalY);
        if (footer_content) {
            finalY += 10;
            doc.setFontSize(9);
            const lines = doc.splitTextToSize(footer_content, 180);
            doc.text(lines, 14, finalY);
        }
        doc.save('expense-' + (item.invoice_number || item.id) + '.pdf');
        toast.success(t("invoice_downloaded"));
    };

    const copyToClipboard = () => {
        if (exportData.length === 0) return;
        const text = exportData.map(d => Object.values(d).join('\t')).join('\n');
        const header = Object.keys(exportData[0] || {}).join('\t');
        navigator.clipboard.writeText(header + '\n' + text);
        toast.success(t("copied_to_clipboard"));
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Add Expense Form */}
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 h-fit sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <MinusCircle className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {editingId ? t("edit_expense") : t("add_expense")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("record_new_expense")}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="expense-head" className="text-xs font-semibold text-gray-600">
                                    {t("expense_head")} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.expense_head_id} onValueChange={(val) => setFormData({ ...formData, expense_head_id: val })}>
                                    <SelectTrigger id="expense-head">
                                        <SelectValue placeholder={t("select")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {expenseHeads.map((head) => (
                                            <SelectItem key={head.id} value={head.id.toString()}>{head.expense_head}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-semibold text-gray-600">
                                    {t("name")} <span className="text-red-500">*</span>
                                </Label>
                                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoice-number" className="text-xs font-semibold text-gray-600">{t("expense_number")}</Label>
                                <Input id="invoice-number" value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} placeholder={t("auto_generated")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-xs font-semibold text-gray-600">
                                    {t("date")} <span className="text-red-500">*</span>
                                </Label>
                                <DatePicker value={formData.date} onChange={(val) => setFormData({ ...formData, date: val })} className="h-11 border-gray-200" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-xs font-semibold text-gray-600">
                                    {t("amount")} <span className="text-red-500">*</span>
                                </Label>
                                <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-gray-600">{t("attach_document")}</Label>
                                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <Upload className="h-6 w-6 mb-2 group-hover:text-indigo-500 transition-colors" />
                                    <span className="text-xs font-medium">
                                        {formData.document ? formData.document.name : t("drag_drop_or_click")}
                                    </span>
                                    <Input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-semibold text-gray-600">{t("description")}</Label>
                                <Textarea id="description" className="resize-none" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="flex justify-end pt-2 gap-2">
                                {editingId && (
                                    <Button type="button" variant="outline" onClick={resetForm} className="h-9 px-6 rounded-full text-xs font-bold">
                                        {t("cancel")}
                                    </Button>
                                )}
                                <Button type="submit" disabled={saving} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {editingId ? t("update") : t("save")}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Right Column: Expense List */}
                <Card className="lg:col-span-2 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ClipboardList className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("expense_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("x_expenses_recorded", { count: expenses.length })}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex w-full md:w-auto items-center gap-2">
                                <div className="relative w-full md:w-64">
                                    <Input placeholder={t("search") + "..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-3 pr-10" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                                    <SelectTrigger className="w-[70px]"><SelectValue placeholder="50" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200" onClick={copyToClipboard}><Copy className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200" onClick={exportToExcel}><FileSpreadsheet className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200" onClick={exportToCSV}><FileText className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200" onClick={exportToPDF}><FileCode className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"><Columns className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 text-xs uppercase">
                                    <TableRow>
                                        <TableHead className="font-semibold text-gray-600 whitespace-nowrap">{t("name")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 min-w-[300px]">{t("description")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 whitespace-nowrap">{t("expense_number")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 whitespace-nowrap">{t("date")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 whitespace-nowrap">{t("expense_head")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 whitespace-nowrap">{t("attachment")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 whitespace-nowrap text-right">{t("amount")} ({currencySymbol})</TableHead>
                                        <TableHead className="font-semibold text-gray-600 whitespace-nowrap text-right">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={8} />
                                    ) : filteredData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                {t("no_data_found")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredData.map((item) => (
                                            <TableRow key={item.id} className="text-sm">
                                                <TableCell className="font-medium text-gray-700 py-3">{item.name}</TableCell>
                                                <TableCell className="text-gray-600 text-xs">{item.description}</TableCell>
                                                <TableCell className="text-gray-600">{item.invoice_number}</TableCell>
                                                <TableCell className="text-gray-600">{formatDate(item.date)}</TableCell>
                                                <TableCell className="text-gray-600">{item.expense_head.expense_head}</TableCell>
                                                <TableCell>
                                                    {item.document ? (
                                                        <Button size="sm" variant="ghost" onClick={() => { window.open(getImageUrl(item.document), '_blank'); }} className="h-7 w-7 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded p-0">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    ) : (<span className="text-gray-300 text-xs">—</span>)}
                                                </TableCell>
                                                <TableCell className="text-gray-600 text-right font-semibold">{formatCurrency(item.amount)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button size="sm" onClick={() => downloadInvoicePDF(item)} className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Download className="h-4 w-4" /></Button>
                                                        <Button size="sm" onClick={() => handleEdit(item)} className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Pencil className="h-4 w-4" /></Button>
                                                        <Button size="sm" onClick={() => handleDelete(item.id)} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                            <div>
                                {t("showing_x_to_y_of_z", { from: 1, to: filteredData.length, total: expenses.length })}
                            </div>
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm" disabled><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="default" size="sm" className="h-8 w-8 p-0 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md font-bold">1</Button>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm" disabled><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}