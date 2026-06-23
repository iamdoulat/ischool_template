"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    Eye,
    ArrowUpDown,
    Upload,
    Image as ImageIcon,
    FileBadge,
    Loader2,
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
import {
    type CertificateTemplate,
    renderCertificateHtml,
    printCertificate,
} from "@/lib/certificate";

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const PLACEHOLDERS = [
    "[name]", "[dob]", "[present_address]", "[guardian]", "[created_at]",
    "[admission_no]", "[roll_no]", "[class]", "[section]", "[gender]",
    "[admission_date]", "[category]", "[caste]", "[father_name]", "[mother_name]",
    "[religion]", "[email]", "[phone]", "[present_date]", "[medical_history]",
];

const SAMPLE_STUDENT = {
    name: "John Doe", dob: "01/01/2015", present_address: "123 Main St", guardian: "Jane Doe",
    admission_no: "10024", roll_no: "5", class: "Class 1", section: "A", gender: "Male",
    admission_date: "06/01/2022", category: "General", father_name: "Richard Doe",
    mother_name: "Jane Doe", religion: "—", email: "john@example.com", phone: "9000000000",
};

const TABLE_COLS = 3;

const emptyForm = {
    name: "", header_left: "", header_center: "", header_right: "", body_text: "",
    footer_left: "", footer_center: "", footer_right: "", header_height: "", footer_height: "",
    body_height: "", body_width: "", enable_student_photo: false, background_image: "",
};

function SkeletonRows({ rows = 5, cols = TABLE_COLS }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <div
                                className="h-3 rounded bg-gray-200/70 animate-pulse"
                                style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function StudentCertificatePage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState("50");

    const [form, setForm] = useState({ ...emptyForm });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const bodyRef = useRef<HTMLTextAreaElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const fetchTemplates = async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/certificate/student-certificates`, {
                params: { page, search: searchTerm, per_page: limit },
            });
            const d = res.data;
            setTemplates(d.data ?? d ?? []);
            setPagination({
                current_page: d.current_page, last_page: d.last_page,
                total: d.total, from: d.from, to: d.to,
            });
        } catch {
            tt.error("failed_to_fetch_certificates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit]);

    const resetForm = () => {
        setForm({ ...emptyForm });
        setEditingId(null);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast({ title: t("validation_error"), description: t("certificate_name_is_required"), variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/certificate/student-certificates/${editingId}`, form);
                tt.success("certificate_updated_successfully");
            } else {
                await api.post(`/certificate/student-certificates`, form);
                tt.success("certificate_created_successfully");
            }
            resetForm();
            fetchTemplates(pagination?.current_page ?? 1);
        } catch {
            tt.error("failed_to_save_certificate");
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (t: CertificateTemplate) => {
        setEditingId(t.id);
        setForm({
            name: t.name ?? "", header_left: t.header_left ?? "", header_center: t.header_center ?? "",
            header_right: t.header_right ?? "", body_text: t.body_text ?? "", footer_left: t.footer_left ?? "",
            footer_center: t.footer_center ?? "", footer_right: t.footer_right ?? "",
            header_height: t.header_height ?? "", footer_height: t.footer_height ?? "",
            body_height: t.body_height ?? "", body_width: t.body_width ?? "",
            enable_student_photo: !!t.enable_student_photo, background_image: t.background_image ?? "",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/certificate/student-certificates/${deleteId}`);
            tt.success("certificate_deleted_successfully");
            if (editingId === deleteId) resetForm();
            fetchTemplates(pagination?.current_page ?? 1);
        } catch {
            tt.error("failed_to_delete_certificate");
        } finally {
            setDeleteId(null);
        }
    };

    const insertPlaceholder = (p: string) => {
        const el = bodyRef.current;
        if (!el) {
            setForm((f) => ({ ...f, body_text: f.body_text + p }));
            return;
        }
        const start = el.selectionStart ?? form.body_text.length;
        const end = el.selectionEnd ?? form.body_text.length;
        const next = form.body_text.slice(0, start) + p + form.body_text.slice(end);
        setForm((f) => ({ ...f, body_text: next }));
        requestAnimationFrame(() => {
            el.focus();
            el.selectionStart = el.selectionEnd = start + p.length;
        });
    };

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("type", "general");
            const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
            const url = res.data?.data?.url ?? res.data?.url ?? "";
            setForm((f) => ({ ...f, background_image: url }));
            tt.success("background_image_uploaded");
        } catch {
            tt.error("failed_to_upload_image");
        } finally {
            setUploading(false);
        }
    };

    const handlePreview = (t: CertificateTemplate) => {
        printCertificate(renderCertificateHtml(t, SAMPLE_STUDENT));
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(templates.map((t) => t.name).join("\n"));
        tt.success("data_copied_to_clipboard");
    };

    const handleExportCSV = () => {
        const rows = [[t("certificate_name"), t("background_image")], ...templates.map((t) => [t.name, t.background_image || "-"])];
        const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "student_certificates.csv";
        link.click();
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
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Form */}
                <div className="w-full lg:w-[450px] shrink-0">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <FileBadge className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {editingId ? t("edit_student_certificate") : t("add_student_certificate")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("design_reusable_certificate_template")}</p>
                            </div>
                            {editingId && (
                                <Button variant="ghost" size="icon" onClick={resetForm} className="h-7 w-7 text-gray-500" title={t("cancel_edit")}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    {t("certificate_name")} <span className="text-red-500">*</span>
                                </Label>
                                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-xs" />
                            </div>

                            {([
                                [t("header_left_text"), "header_left"],
                                [t("header_center_text"), "header_center"],
                                [t("header_right_text"), "header_right"],
                            ] as const).map(([label, key]) => (
                                <div key={key} className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{label}</Label>
                                    <Input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="h-9 text-xs" />
                                </div>
                            ))}

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    {t("body_text")} <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    ref={bodyRef}
                                    value={form.body_text}
                                    onChange={(e) => setForm({ ...form, body_text: e.target.value })}
                                    className="min-h-[110px] text-xs resize-none"
                                />
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {PLACEHOLDERS.map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => insertPlaceholder(p)}
                                            className="text-[9px] text-indigo-500/90 font-medium cursor-pointer hover:underline"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {([
                                [t("footer_left_text"), "footer_left"],
                                [t("footer_center_text"), "footer_center"],
                                [t("footer_right_text"), "footer_right"],
                            ] as const).map(([label, key]) => (
                                <div key={key} className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{label}</Label>
                                    <Input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="h-9 text-xs" />
                                </div>
                            ))}

                            <div className="space-y-3 pt-2 border-t border-gray-100">
                                <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">{t("certificate_design")}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {([
                                        [t("header_height"), "header_height"],
                                        [t("footer_height"), "footer_height"],
                                        [t("body_height"), "body_height"],
                                        [t("body_width"), "body_width"],
                                    ] as const).map(([label, key]) => (
                                        <div key={key} className="space-y-1">
                                            <Label className="text-[10px] text-gray-400">{label}</Label>
                                            <Input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="h-9 text-xs" placeholder="px" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 py-2 border-t border-gray-100">
                                <Label className="text-[10px] font-bold text-gray-800 uppercase tracking-tight">{t("student_photo")}</Label>
                                <Switch
                                    checked={form.enable_student_photo}
                                    onCheckedChange={(v) => setForm({ ...form, enable_student_photo: v })}
                                    className="data-[state=checked]:bg-indigo-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("background_image")}</Label>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                                />
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-200 transition-colors bg-gray-50/30"
                                >
                                    {uploading ? (
                                        <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                                    ) : form.background_image ? (
                                        <>
                                            <img src={form.background_image} alt="bg" className="h-16 object-contain rounded" />
                                            <p className="text-[10px] text-gray-500">{t("click_to_replace")}</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                                <Upload className="h-4 w-4 text-indigo-500" />
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium">{t("drag_drop_or_click")}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                {editingId && (
                                    <Button variant="outline" onClick={resetForm} className="h-9 px-5 text-xs">{t("cancel")}</Button>
                                )}
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                                >
                                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {editingId ? t("update") : t("save")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: List */}
                <div className="flex-1 min-w-0">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <FileText className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_certificate_list")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{pagination?.total ?? templates.length} {t("certificates")}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                                <form onSubmit={(e) => { e.preventDefault(); fetchTemplates(1); }} className="flex items-center gap-2 w-full md:w-auto">
                                    <Input placeholder={t("search_certificates")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-3 h-9 text-xs w-full md:w-64" />
                                    <Button type="submit" className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                                        <Search className="h-4 w-4" /> {t("search")}
                                    </Button>
                                </form>
                                <div className="flex items-center gap-2">
                                    <Select value={limit} onValueChange={setLimit}>
                                        <SelectTrigger className="w-[70px] h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {["10", "25", "50", "100"].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                        {toolbarActions.map((a, i) => (
                                            <Button key={i} variant="ghost" size="icon" onClick={a.onClick} title={a.title} className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                                <a.Icon className="h-4 w-4" />
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-md border overflow-x-auto custom-scrollbar">
                                <Table className="min-w-[560px]">
                                    <TableHeader className="bg-gray-50 text-xs uppercase">
                                        <TableRow className="hover:bg-transparent whitespace-nowrap">
                                            <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("certificate_name")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                            <TableHead className="font-semibold text-gray-600">{t("background_image")}</TableHead>
                                            <TableHead className="font-semibold text-gray-600 text-right">{t("action")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <SkeletonRows />
                                        ) : templates.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                    {t("no_certificates_found")}
                                                </TableCell>
                                            </TableRow>
                                        ) : templates.map((template) => (
                                            <TableRow key={template.id} className="text-xs hover:bg-gray-50/60 transition-colors whitespace-nowrap">
                                                <TableCell className="py-3 text-[#6366f1] font-medium">{template.name}</TableCell>
                                                <TableCell className="py-3">
                                                    {template.background_image ? (
                                                        <img src={template.background_image} alt="bg" className="h-10 w-14 object-cover rounded border border-gray-200" />
                                                    ) : (
                                                        <div className="h-10 w-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                                            <ImageIcon className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button size="icon" onClick={() => handlePreview(template)} title={t("preview")} className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded p-0 shadow-sm active:scale-95 transition-all">
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="icon" onClick={() => startEdit(template)} title={t("edit")} className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded p-0 shadow-sm active:scale-95 transition-all">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="icon" onClick={() => setDeleteId(template.id)} title={t("delete")} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                                <div>{t("showing_x_to_y_of_z", { from: pagination?.from || 0, to: pagination?.to || 0, total: pagination?.total || 0 })}</div>
                                <div className="flex gap-1 items-center">
                                    <Button variant="outline" size="sm" disabled={!pagination || pagination.current_page === 1} onClick={() => fetchTemplates(pagination!.current_page - 1)} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                        <Button key={i + 1} size="sm" onClick={() => fetchTemplates(i + 1)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all", pagination?.current_page === i + 1 ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200")}>
                                            {i + 1}
                                        </Button>
                                    ))}
                                    <Button variant="outline" size="sm" disabled={!pagination || pagination.current_page === pagination.last_page} onClick={() => fetchTemplates(pagination!.current_page + 1)} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_certificate_q")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("delete_certificate_description")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">{t("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
