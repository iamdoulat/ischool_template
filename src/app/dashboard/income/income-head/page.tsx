"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, FileSpreadsheet, FileText, Printer, Columns, Pencil, X, ChevronLeft, ChevronRight, Loader2, Save, FileCode, Wallet, ListChecks } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface IncomeHeadRecord {
    id: string;
    incomeHead: string;
    description: string;
}

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

export default function IncomeHeadPage() {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");
    const [incomeHeads, setIncomeHeads] = useState<IncomeHeadRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        income_head: "",
        description: ""
    });

    const fetchIncomeHeads = async () => {
        try {
            setLoading(true);
            const res = await api.get("income/income-heads");
            if (res.data?.status === "Success") {
                // Map backend snake_case to frontend camelCase if needed,
                // but let's just keep it consistent.
                const mappedData = res.data.data.map((item: { id: number | string; income_head: string; description?: string }) => ({
                    id: item.id.toString(),
                    incomeHead: item.income_head,
                    description: item.description || ""
                }));
                setIncomeHeads(mappedData);
            }
        } catch (error) {
            console.error("Error fetching income heads:", error);
            toast.error(t("failed_to_fetch_income_heads"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncomeHeads();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.income_head) {
            toast.error(t("income_head_is_required"));
            return;
        }

        try {
            setSaving(true);
            if (editingId) {
                const res = await api.put(`income/income-heads/${editingId}`, formData);
                if (res.data?.status === "Success") {
                    toast.success(t("income_head_updated_successfully"));
                    setEditingId(null);
                }
            } else {
                const res = await api.post("income/income-heads", formData);
                if (res.data?.status === "Success") {
                    toast.success(t("income_head_saved_successfully"));
                }
            }
            setFormData({ income_head: "", description: "" });
            fetchIncomeHeads();
        } catch (error) {
            console.error("Error saving income head:", error);
            toast.error(t("failed_to_save_income_head"));
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item: IncomeHeadRecord) => {
        setEditingId(item.id);
        setFormData({
            income_head: item.incomeHead,
            description: item.description
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("are_you_sure_delete_record"))) return;

        try {
            const res = await api.delete(`income/income-heads/${id}`);
            if (res.data?.status === "Success") {
                toast.success(t("income_head_deleted_successfully"));
                fetchIncomeHeads();
            }
        } catch (error) {
            console.error("Error deleting income head:", error);
            toast.error(t("failed_to_delete_income_head"));
        }
    };

    const exportData = incomeHeads.map(item => ({
        [t("income_head")]: item.incomeHead,
        [t("description")]: item.description
    }));

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "IncomeHeads");
        XLSX.writeFile(wb, "income_heads.xlsx");
        toast.success(t("exported_to_excel"));
    };

    const exportToCSV = () => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "income_heads.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t("exported_to_csv"));
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text(t("income_head_list"), 14, 15);
        autoTable(doc, {
            head: [[t("income_head"), t("description")]],
            body: incomeHeads.map(item => [item.incomeHead, item.description]),
            startY: 20,
        });
        doc.save("income_heads.pdf");
        toast.success(t("exported_to_pdf"));
    };

    const copyToClipboard = () => {
        const text = exportData.map(d => Object.values(d).join('\t')).join('\n');
        const header = Object.keys(exportData[0] || {}).join('\t');
        navigator.clipboard.writeText(header + '\n' + text);
        toast.success(t("copied_to_clipboard"));
    };

    const filteredData = incomeHeads.filter((item) =>
        item.incomeHead.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Add Income Head Form */}
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 h-fit sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Wallet className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {editingId ? t("edit_income_head") : t("add_income_head")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("create_manage_income_heads")}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="income-head" className="text-xs font-semibold text-gray-600">
                                    {t("income_head")} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="income-head"
                                    value={formData.income_head}
                                    onChange={(e) => setFormData({ ...formData, income_head: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-semibold text-gray-600">
                                    {t("description")}
                                </Label>
                                <Textarea
                                    id="description"
                                    className="resize-none"
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end pt-2">
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

                {/* Right Column: Income Head List */}
                <Card className="lg:col-span-2 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ListChecks className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("income_head_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{incomeHeads.length} {t("income_head")}{incomeHeads.length === 1 ? "" : "s"}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-4">
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
                                        <TableHead className="font-semibold text-gray-600">{t("income_head")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 w-full">{t("description")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-right">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={3} />
                                    ) : filteredData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                {t("no_data_found")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredData.map((item) => (
                                            <TableRow key={item.id} className="text-sm">
                                                <TableCell className="font-medium text-gray-700 py-3">{item.incomeHead}</TableCell>
                                                <TableCell className="text-gray-600">{item.description}</TableCell>
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
                                                            onClick={() => handleDelete(item.id)}
                                                            className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                        >
                                                            <X className="h-4 w-4" />
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
                                {t("showing_x_to_y_of_z", { from: 1, to: filteredData.length, total: incomeHeads.length })}
                            </div>
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" className="h-7 w-7 rounded-[10px] p-0 shadow-sm bg-white border border-gray-200 text-gray-600" disabled><ChevronLeft className="h-4 w-4" /></Button>
                                <Button variant="default" size="sm" className="h-7 w-7 rounded-[10px] p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md">1</Button>
                                <Button variant="outline" size="sm" className="h-7 w-7 rounded-[10px] p-0 shadow-sm bg-white border border-gray-200 text-gray-600" disabled><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
