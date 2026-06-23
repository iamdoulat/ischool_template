"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Copy, FileSpreadsheet, FileText, Printer, Columns, Pencil, Trash2, Loader2, Save, FileCode, ChevronLeft, ChevronRight, FileDown, Eye, PlusCircle, Receipt } from "lucide-react";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useTranslation } from "@/hooks/use-translation";
import { useImageUrl, useBaseUrl } from "@/lib/image-url";
import api from "@/lib/api";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDate } from "@/lib/utils";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useSettings } from "@/components/providers/settings-provider";

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

interface IncomeHead {
    id: number;
    income_head: string;
}

interface IncomeRecord {
    id: string;
    name: string;
    description: string;
    invoice_number: string;
    date: string;
    income_head_id: string;
    income_head_name: string;
    amount: number;
    document?: string;
}

export default function AddIncomePage() {
    const { settings } = useSettings();
    const { symbol, formatCurrency } = useCurrencyFormatter();
    const { t } = useTranslation();
    const getImageUrl = useImageUrl();
    const baseApiUrl = useBaseUrl();
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");
    const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
    const [incomeHeads, setIncomeHeads] = useState<IncomeHead[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [invoicePrintSettings, setInvoicePrintSettings] = useState<{ header_image_url: string | null; footer_content: string }>({ header_image_url: null, footer_content: "" });

    const [formData, setFormData] = useState({
        income_head_id: "",
        name: "",
        invoice_number: "",
        date: new Date().toISOString().split('T')[0],
        amount: "",
        description: ""
    });

    const fetchNextInvoiceNumber = async () => {
        try {
            const res = await api.get("income/incomes/next-invoice-number");
            if (res.data?.status === "Success" && res.data.data?.invoice_number) {
                setFormData(prev => ({ ...prev, invoice_number: res.data.data.invoice_number }));
            }
        } catch {
            // silently fail — invoice_number stays blank
        }
    };

    const fetchInvoicePrintSettings = async () => {
        try {
            const res = await api.get("system-setting/print-settings");
            if (res.data?.status === "success") {
                const invoice = (res.data.data || []).find((s: { type: string; header_image_url?: string | null; footer_content?: string }) => s.type === "Invoice");
                if (invoice) {
                    setInvoicePrintSettings({
                        header_image_url: invoice.header_image_url || null,
                        footer_content: invoice.footer_content || "",
                    });
                }
            }
        } catch {
            // silently fail
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [headsRes, incomesRes] = await Promise.all([
                api.get("income/income-heads"),
                api.get("income/incomes")
            ]);

            if (headsRes.data?.status === "Success") {
                setIncomeHeads(headsRes.data.data);
            }

            if (incomesRes.data?.status === "Success") {
                const mappedIncomes = incomesRes.data.data.map((item: {
                    id: number | string;
                    name: string;
                    description?: string;
                    invoice_number?: string;
                    date: string;
                    income_head_id: number | string;
                    income_head?: { income_head?: string };
                    amount: string | number;
                    document?: string;
                }) => ({
                    id: item.id.toString(),
                    name: item.name,
                    description: item.description || "",
                    invoice_number: item.invoice_number || "",
                    date: item.date,
                    income_head_id: item.income_head_id.toString(),
                    income_head_name: item.income_head?.income_head || "N/A",
                    amount: parseFloat(String(item.amount)),
                    document: item.document
                }));
                setIncomes(mappedIncomes);
            }

            await Promise.all([
                fetchNextInvoiceNumber(),
                fetchInvoicePrintSettings(),
            ]);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error(t("failed_to_load_data"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.income_head_id || !formData.date || !formData.amount) {
            toast.error(t("please_fill_all_required_fields"));
            return;
        }

        const data = new FormData();
        data.append('income_head_id', formData.income_head_id);
        data.append('name', formData.name);
        data.append('invoice_number', formData.invoice_number);
        data.append('date', formData.date);
        data.append('amount', formData.amount);
        data.append('description', formData.description);
        if (selectedFile) {
            data.append('document', selectedFile);
        }

        try {
            setSaving(true);
            let res;
            if (editingId) {
                // Laravel workaround for PUT with FormData: use POST and _method=PUT
                data.append('_method', 'PUT');
                res = await api.post(`income/incomes/${editingId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                res = await api.post("income/incomes", data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (res.data?.status === "Success") {
                toast.success(editingId ? t("income_updated_successfully") : t("income_saved_successfully"));
                resetForm();
                fetchData();
            }
        } catch (error) {
            console.error("Error saving income:", error);
            toast.error(t("failed_to_save_income"));
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            income_head_id: "",
            name: "",
            invoice_number: "",
            date: new Date().toISOString().split('T')[0],
            amount: "",
            description: ""
        });
        setEditingId(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchNextInvoiceNumber();
    };

    const handleEdit = (item: IncomeRecord) => {
        setEditingId(item.id);
        setFormData({
            income_head_id: item.income_head_id,
            name: item.name,
            invoice_number: item.invoice_number,
            date: item.date,
            amount: item.amount.toString(),
            description: item.description
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("are_you_sure_delete_record"))) return;

        try {
            const res = await api.delete(`income/incomes/${id}`);
            if (res.data?.status === "Success") {
                toast.success(t("income_deleted_successfully"));
                fetchData();
            }
        } catch (error) {
            console.error("Error deleting income:", error);
            toast.error(t("failed_to_delete_income"));
        }
    };

    const exportData = incomes.map(item => ({
        'Name': item.name,
        'Description': item.description,
        'Invoice Number': item.invoice_number,
        'Date': item.date,
        'Income Head': item.income_head_name,
        'Amount': formatCurrency(item.amount)
    }));

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Incomes");
        XLSX.writeFile(wb, "incomes.xlsx");
        toast.success(t("exported_to_excel"));
    };

    const exportToCSV = () => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "incomes.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t("exported_to_csv"));
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text(t("income_list"), 14, 15);
        autoTable(doc, {
            head: [[t("name"), t("invoice"), t("date"), t("income_head"), t("amount")]],
            body: incomes.map(item => [item.name, item.invoice_number, item.date, item.income_head_name, formatCurrency(item.amount)]),
            startY: 20,
        });
        doc.save("incomes.pdf");
        toast.success(t("exported_to_pdf"));
    };

    const loadImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => {
                // Fallback without crossOrigin just in case it's on the same host but fails CORS
                const fallbackImg = new Image();
                fallbackImg.onload = () => resolve(fallbackImg);
                fallbackImg.onerror = reject;
                fallbackImg.src = url;
            };
            img.src = url;
        });

    const downloadInvoicePDF = async (item: IncomeRecord) => {
        const doc = new jsPDF();
        let startY = 15;
        const pageWidth = doc.internal.pageSize.getWidth();

        // Helper to map non-ASCII currency symbols to text equivalents for jsPDF
        const formatPdfCurrency = (val: number) => {
            let str = formatCurrency(val);
            // Map known non-ASCII currency symbols to text
            str = str.replace(/৳/g, "Tk ");
            str = str.replace(/₹/g, "Rs ");
            str = str.replace(/€/g, "EUR ");
            str = str.replace(/£/g, "GBP ");

            // Remove any other non-ASCII characters to prevent PDF corruption
            return str.replace(/[^\x00-\x7F]/g, "").trim();
        };

        const { header_image_url, footer_content } = invoicePrintSettings;

        let imageLoaded = false;
        if (header_image_url) {
            try {
                let imgUrl = header_image_url;
                // Fix relative URLs or localhost mismatches
                if (imgUrl.startsWith('/')) {
                    imgUrl = baseApiUrl + imgUrl;
                }
                imgUrl = imgUrl.replace('localhost', '127.0.0.1');

                const img = await loadImage(imgUrl);
                // Based on standard A4 (210x297mm), make it full width minus margins
                const imgWidth = 190;
                const imgHeight = (img.naturalHeight / img.naturalWidth) * imgWidth;
                doc.addImage(img, 'PNG', 10, startY, imgWidth, imgHeight);
                startY += imgHeight + 10;
                imageLoaded = true;
            } catch (error) {
                console.error("Failed to load header image for PDF:", error);
                // silently continue without header image
            }
        }

        if (!imageLoaded) {
            const schoolName = settings?.school_name || "SMART SCHOOL";
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text(schoolName, pageWidth / 2, startY + 10, { align: "center" });
            startY += 25;
        }

        // Top Section Left
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        let leftY = startY;
        doc.text(`${t("name")}: ${item.name}`, 14, leftY);

        leftY += 6;
        doc.text(`${t("roll_no")}:`, 14, leftY);
        doc.text(`${t("class")}:`, 60, leftY);

        leftY += 6;
        doc.text(`${t("section")}:`, 14, leftY);
        doc.text(`${t("session")}:`, 60, leftY);

        // Top Section Center
        doc.setFontSize(16);
        doc.text(t("invoice_uppercase"), pageWidth / 2, startY + 5, { align: "center" });

        // Top Section Right
        doc.setFontSize(10);
        let rightY = startY;
        doc.text(`${t("invoice_no")}: ${item.invoice_number || 'N/A'}`, pageWidth - 14, rightY, { align: "right" });
        rightY += 6;
        doc.text(`${t("date")}: ${formatDate(item.date)}`, pageWidth - 14, rightY, { align: "right" });
        rightY += 6;
        doc.text(`${t("income_head")}: ${item.income_head_name}`, pageWidth - 14, rightY, { align: "right" });

        startY = Math.max(leftY, rightY) + 10;

        // Line
        doc.setLineWidth(0.5);
        doc.line(14, startY, pageWidth - 14, startY);
        startY += 5;

        // Table
        autoTable(doc, {
            head: [[
                t("no"),
                t("description"),
                { content: t("qty"), styles: { halign: 'right' } },
                { content: t("amount"), styles: { halign: 'right' } }
            ]],
            body: [
                ['1', item.description || item.name || t("income"), '1', formatPdfCurrency(item.amount)],
            ],
            startY: startY,
            headStyles: {
                fillColor: [41, 128, 185], // #2980b9 blue color
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245], // light gray
            },
            styles: {
                fontSize: 10,
                cellPadding: 3,
            },
            columnStyles: {
                0: { cellWidth: 20 },
                2: { cellWidth: 30, halign: 'right' },
                3: { halign: 'right' }
            }
        });

        let finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

        // Totals
        doc.setFontSize(9);
        doc.text(`${t("discount")}:`, pageWidth - 40, finalY, { align: "right" });
        doc.text(formatPdfCurrency(0), pageWidth - 14, finalY, { align: "right" });

        finalY += 5;
        doc.text(`${t("sub_total")}:`, pageWidth - 40, finalY, { align: "right" });
        doc.text(formatPdfCurrency(item.amount), pageWidth - 14, finalY, { align: "right" });

        finalY += 6;
        doc.setFontSize(11);
        doc.text(`${t("total")}:`, pageWidth - 40, finalY, { align: "right" });
        doc.text(formatPdfCurrency(item.amount), pageWidth - 14, finalY, { align: "right" });

        // Footer Text
        finalY += 30; // spacing

        // additional footer content from settings
        if (footer_content) {
            doc.setFontSize(10);
            const lines = doc.splitTextToSize(footer_content, 180);
            doc.text(lines, pageWidth / 2, finalY, { align: "center" });
        }

        doc.save(`invoice-${item.invoice_number || item.id}.pdf`);
        toast.success(t("invoice_downloaded"));
    };

    const copyToClipboard = () => {
        const text = exportData.map(d => Object.values(d).join('\t')).join('\n');
        const header = Object.keys(exportData[0] || {}).join('\t');
        navigator.clipboard.writeText(header + '\n' + text);
        toast.success(t("copied_to_clipboard"));
    };

    const filteredData = incomes.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.income_head_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Add Income Form */}
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 h-fit sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <PlusCircle className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {editingId ? t("edit_income") : t("add_income")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("record_new_income_entry")}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="income-head" className="text-xs font-semibold text-gray-600">
                                    {t("income_head")} <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.income_head_id}
                                    onValueChange={(val) => setFormData({ ...formData, income_head_id: val })}
                                >
                                    <SelectTrigger id="income-head">
                                        <SelectValue placeholder={t("select")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {incomeHeads.map((head) => (
                                            <SelectItem key={head.id} value={head.id.toString()}>
                                                {head.income_head}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-semibold text-gray-600">
                                    {t("name")} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="invoice-number" className="text-xs font-semibold text-gray-600">
                                    {t("invoice_number")}
                                </Label>
                                <Input
                                    id="invoice-number"
                                    value={formData.invoice_number}
                                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-xs font-semibold text-gray-600">
                                    {t("date")} <span className="text-red-500">*</span>
                                </Label>
                                <DatePicker
                                    value={formData.date}
                                    onChange={(val) => setFormData({ ...formData, date: val })}
                                    className="h-11 border-gray-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-xs font-semibold text-gray-600">
                                    {t("amount")} ({symbol}) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-gray-600">
                                    {t("attach_document")}
                                </Label>
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                />
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <Upload className="h-6 w-6 mb-2" />
                                    <span className="text-xs">
                                        {selectedFile ? selectedFile.name : t("drag_and_drop_file_here_or_click")}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-semibold text-gray-600">
                                    {t("description")}
                                </Label>
                                <Textarea
                                    id="description"
                                    className="resize-none"
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end pt-2 gap-2">
                                {editingId && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={resetForm}
                                        className="h-9 px-6 rounded-full text-xs font-bold"
                                    >
                                        {t("cancel")}
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {editingId ? t("update") : t("save")}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Right Column: Income List */}
                <Card className="lg:col-span-2 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Receipt className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("income_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{incomes.length} {t("income")} {incomes.length === 1 ? t("entry") : t("entries")}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex w-full md:w-auto items-center gap-2">
                                <div className="relative w-full md:w-64">
                                    <Input
                                        placeholder={t("search") + "..."}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-3 pr-10"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                                    <SelectTrigger className="w-[70px]">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                    <Button
                                        variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                        onClick={copyToClipboard}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                        onClick={exportToExcel}
                                    >
                                        <FileSpreadsheet className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                        onClick={exportToCSV}
                                    >
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                        onClick={exportToPDF}
                                    >
                                        <FileCode className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                        onClick={() => window.print()}
                                    >
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <Columns className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 text-xs uppercase">
                                    <TableRow>
                                        <TableHead className="font-semibold text-gray-600 whitespace-nowrap">{t("name")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 min-w-[300px]">{t("description")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 whitespace-nowrap">{t("invoice_number")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 whitespace-nowrap">{t("date")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 whitespace-nowrap">{t("income_head")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 whitespace-nowrap">{t("attachment")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 whitespace-nowrap text-right">{t("amount")} ({symbol})</TableHead>
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
                                                <TableCell className="text-gray-600">{item.income_head_name}</TableCell>
                                                <TableCell>
                                                    {item.document ? (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                window.open(getImageUrl(item.document), '_blank');
                                                            }}
                                                            className="h-7 w-7 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded p-0"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-gray-600 text-right">{formatCurrency(item.amount)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleEdit(item)}
                                                            className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => downloadInvoicePDF(item)}
                                                            className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                            title={t("download_invoice_pdf")}
                                                        >
                                                            <FileDown className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleDelete(item.id)}
                                                            className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
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
                                {t("showing_x_to_y_of_z", { from: 1, to: filteredData.length, total: incomes.length })}
                            </div>
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" className="h-7 w-7 rounded-[10px] p-0 bg-white border border-gray-200 text-gray-600 shadow-sm" disabled><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="default" size="sm" className="h-7 w-7 rounded-[10px] p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md">1</Button>
                                <Button variant="outline" size="sm" className="h-7 w-7 rounded-[10px] p-0 bg-white border border-gray-200 text-gray-600 shadow-sm" disabled><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
