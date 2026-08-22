"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    CreditCard,
    Loader2,
    X,
    Sparkles,
    Check,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    type IdCardTemplate,
    type PrebuiltIdCardPreset,
    PREBUILT_STUDENT_ID_CARDS,
    renderIdCardHtml,
    printIdCards,
} from "@/lib/certificate";

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const TOGGLE_FIELDS = [
    { label: "Admission No", key: "show_admission_no" },
    { label: "Student Name", key: "show_student_name" },
    { label: "Class", key: "show_class" },
    { label: "Roll No", key: "show_roll_no" },
    { label: "Session", key: "show_session" },
    { label: "Father Name", key: "show_father_name" },
    { label: "Mother Name", key: "show_mother_name" },
    { label: "Student Address", key: "show_address" },
    { label: "Phone", key: "show_phone" },
    { label: "Date Of Birth", key: "show_dob" },
    { label: "Blood Group", key: "show_blood_group" },
    { label: "House", key: "show_house" },
    { label: "Barcode / QR Code", key: "show_qr" },
] as const;

type ToggleKey = (typeof TOGGLE_FIELDS)[number]["key"];

const ASSETS = [
    { label: "Background Image", key: "background_image", title: "Background Image", hint: "Optional background pattern or image" },
    { label: "School Logo", key: "logo", title: "School Logo", hint: "Upload school emblem or crest (PNG/JPEG)" },
    { label: "Principal / Authorized Signature", key: "signature", title: "Principal / Authorized Signature", hint: "Upload Principal / Authorized signature image (PNG with transparent bg)" },
] as const;
type AssetKey = (typeof ASSETS)[number]["key"];

const SAMPLE_PERSON = {
    name: "John Doe", admission_no: "10024", roll_no: "5", class: "Class 1", section: "A",
    father_name: "Richard Doe", mother_name: "Jane Doe", dob: "01/01/2015",
    blood_group: "O+", house: "Red", phone: "9000000000", address: "123 Main St",
    session: "2024-25",
};

const emptyForm = {
    title: "", school_name: "", school_address: "", header_color: "#6366F1", design_type: "Horizontal",
    background_image: "", logo: "", signature: "",
    show_admission_no: true, show_student_name: true, show_class: true, show_roll_no: false,
    show_father_name: true, show_mother_name: false, show_address: false, show_phone: false,
    show_dob: false, show_blood_group: false, show_house: false, show_session: true, show_qr: true,
};

const TABLE_COLS = 4;

function SkeletonRows({ rows = 5, cols = TABLE_COLS }: { rows?: number; cols?: number }) {
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

export default function StudentIDCardPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [templates, setTemplates] = useState<IdCardTemplate[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [limit, setLimit] = useState("10");
    const [form, setForm] = useState(emptyForm);
    const [uploadingKey, setUploadingKey] = useState<AssetKey | null>(null);

    const fetchTemplates = useCallback(
        async (page = 1) => {
            setLoading(true);
            try {
                const res = await api.get(`/certificate/student-id-cards`, {
                    params: { page, per_page: limit, search: searchTerm || undefined },
                });
                const d = res.data;
                if (d && Array.isArray(d.data)) {
                    setTemplates(d.data);
                    setPagination({ current_page: d.current_page, last_page: d.last_page, total: d.total, from: d.from, to: d.to });
                } else if (Array.isArray(d)) {
                    setTemplates(d);
                    setPagination(null);
                }
            } catch {
                tt.error("failed_to_load_id_cards");
            } finally {
                setLoading(false);
            }
        },
        [limit, searchTerm]
    );

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            toast({ title: t("validation_error"), description: t("id_card_title_is_required"), variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/certificate/student-id-cards/${editingId}`, form);
                tt.success("id_card_updated_successfully");
            } else {
                await api.post(`/certificate/student-id-cards`, form);
                tt.success("id_card_created_successfully");
            }
            resetForm();
            fetchTemplates(pagination?.current_page ?? 1);
        } catch {
            tt.error("failed_to_save_id_card");
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (t: IdCardTemplate) => {
        setEditingId(t.id);
        setForm({
            title: t.title ?? "", school_name: t.school_name ?? "", school_address: t.school_address ?? "",
            header_color: t.header_color ?? "#6366F1", design_type: t.design_type ?? "Horizontal",
            background_image: t.background_image ?? "", logo: t.logo ?? "", signature: t.signature ?? "",
            show_admission_no: !!t.show_admission_no, show_student_name: !!t.show_student_name, show_class: !!t.show_class,
            show_roll_no: !!t.show_roll_no, show_father_name: !!t.show_father_name, show_mother_name: !!t.show_mother_name,
            show_address: !!t.show_address, show_phone: !!t.show_phone, show_dob: !!t.show_dob,
            show_blood_group: !!t.show_blood_group, show_house: !!t.show_house,
            show_session: t.show_session !== undefined ? !!t.show_session : true,
            show_qr: !!t.show_qr,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/certificate/student-id-cards/${deleteId}`);
            tt.success("id_card_deleted_successfully");
            if (editingId === deleteId) resetForm();
            fetchTemplates(pagination?.current_page ?? 1);
        } catch {
            tt.error("failed_to_delete_id_card");
        } finally {
            setDeleteId(null);
        }
    };

    const handleUpload = async (key: AssetKey, file: File) => {
        setUploadingKey(key);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("type", "general");
            const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
            const url = res.data?.data?.url ?? res.data?.url ?? "";
            setForm((f) => ({ ...f, [key]: url }));
            tt.success("image_uploaded");
        } catch {
            tt.error("failed_to_upload_image");
        } finally {
            setUploadingKey(null);
        }
    };

    const handlePreview = (t: IdCardTemplate) => printIdCards(renderIdCardHtml(t, SAMPLE_PERSON, "student"));

    const handleCopy = () => {
        navigator.clipboard.writeText(templates.map((t) => `${t.title}\t${t.design_type}`).join("\n"));
        tt.success("data_copied_to_clipboard");
    };
    const handleExportCSV = () => {
        const rows = [[t("id_card_title"), t("design_type")], ...templates.map((t) => [t.title, t.design_type || "-"])];
        const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "student_id_cards.csv";
        link.click();
    };

    const galleryScrollRef = useRef<HTMLDivElement>(null);
    const scrollGallery = (direction: "left" | "right") => {
        if (!galleryScrollRef.current) return;
        const scrollAmount = 300;
        galleryScrollRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    const applyPrebuilt = (preset: PrebuiltIdCardPreset) => {
        setEditingId(null);
        setForm({
            title: preset.title,
            school_name: preset.school_name || "",
            school_address: preset.school_address || "",
            header_color: preset.header_color || "#4F46E5",
            design_type: preset.design_type || "Horizontal",
            background_image: preset.background_image || "",
            logo: preset.logo || "",
            signature: preset.signature || "",
            show_admission_no: !!preset.show_admission_no,
            show_student_name: !!preset.show_student_name,
            show_class: !!preset.show_class,
            show_roll_no: !!preset.show_roll_no,
            show_father_name: !!preset.show_father_name,
            show_mother_name: !!preset.show_mother_name,
            show_address: !!preset.show_address,
            show_phone: !!preset.show_phone,
            show_dob: !!preset.show_dob,
            show_blood_group: !!preset.show_blood_group,
            show_house: !!preset.show_house,
            show_session: preset.show_session !== undefined ? !!preset.show_session : true,
            show_qr: !!preset.show_qr,
        });
        toast({
            title: t("template_loaded") || "Template Loaded",
            description: `"${preset.title}" design loaded. You can customize fields and click Save.`,
        });
        window.scrollTo({ top: 380, behavior: "smooth" });
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
            {/* ──────────────────────── Pre-built ID Card Templates Gallery ──────────────────────── */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Sparkles className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                                <span>Pre-built Student ID Card Design Templates</span>
                                <Badge className="bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider px-2">
                                    {PREBUILT_STUDENT_ID_CARDS.length} Pro Styles
                                </Badge>
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                1-Click ready-to-use professional ID cards. Click &ldquo;Use Design&rdquo; to customize, redesign, and save into your reusable templates.
                            </p>
                        </div>
                    </div>

                    {/* Horizontal Scroll Navigation Arrows */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => scrollGallery("left")}
                            className="h-8 w-8 rounded-full border-gray-200 bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 shadow-xs"
                            title="Scroll left"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => scrollGallery("right")}
                            className="h-8 w-8 rounded-full border-gray-200 bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 shadow-xs"
                            title="Scroll right"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div
                        ref={galleryScrollRef}
                        className="flex items-stretch gap-4 overflow-x-auto custom-scrollbar pb-3 pt-1 scroll-smooth snap-x snap-mandatory"
                    >
                        {PREBUILT_STUDENT_ID_CARDS.map((preset) => (
                            <div
                                key={preset.id}
                                className="group relative flex-none w-[calc(25%-12px)] min-w-[250px] flex flex-col justify-between rounded-2xl bg-white border border-gray-200/80 p-4 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 hover:-translate-y-0.5 snap-start"
                            >
                                <div className="space-y-3">
                                    {/* Preview Banner Header */}
                                    <div
                                        style={{ background: preset.preview_bg }}
                                        className="h-28 rounded-xl relative overflow-hidden flex flex-col items-center justify-center text-white p-3 shadow-inner text-center"
                                    >
                                        <div className="absolute top-2.5 w-9 h-1.5 rounded-full bg-black/40 border border-white/20 shadow-inner z-20" />
                                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px]" />
                                        <div className="relative z-10 space-y-1 mt-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-200 block">
                                                {preset.design_type} Style
                                            </span>
                                            <h4 className="font-extrabold text-sm tracking-tight text-white drop-shadow-sm leading-snug">
                                                {preset.title.split("(")[0]}
                                            </h4>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-xs text-gray-900 line-clamp-1">{preset.title}</h4>
                                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                                            {preset.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Actions</span>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            onClick={() => handlePreview({ ...preset, id: 0 })}
                                            title={t("preview") || "Preview ID Card"}
                                            className="h-8 w-8 rounded-lg border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 shadow-xs active:scale-95 transition-all"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            onClick={() => applyPrebuilt(preset)}
                                            title="Use Design / Apply Template"
                                            className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm active:scale-95 transition-all"
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Form */}
                <div className="w-full lg:w-[450px] shrink-0">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <CreditCard className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{editingId ? t("edit_student_id_card") : t("add_student_id_card")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("design_reusable_id_card_template")}</p>
                            </div>
                            {editingId && <Button variant="ghost" size="icon" onClick={resetForm} className="h-7 w-7 text-gray-500" title={t("cancel_edit")}><X className="h-4 w-4" /></Button>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Asset uploads */}
                            {ASSETS.map((asset) => (
                                <div key={asset.key} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{asset.title}</Label>
                                        {form[asset.key] && (
                                            <button
                                                type="button"
                                                onClick={() => setForm((f) => ({ ...f, [asset.key]: "" }))}
                                                className="text-[10px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-0.5"
                                            >
                                                <X className="h-3 w-3" /> Remove
                                            </button>
                                        )}
                                    </div>
                                    <label className="border-2 border-dashed border-gray-200 rounded-md p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/20 transition-all bg-gray-50/40 min-h-[64px]">
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(asset.key, e.target.files[0])} />
                                        {uploadingKey === asset.key ? (
                                            <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                                            </div>
                                        ) : form[asset.key] ? (
                                            <div className="flex items-center gap-3 w-full justify-center">
                                                <img src={form[asset.key]} alt={asset.label} className="h-10 max-w-[140px] object-contain rounded bg-white p-1 border border-gray-200 shadow-xs" />
                                                <span className="text-[10px] text-indigo-600 font-semibold">Click to change</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <Upload className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className="text-[11px] font-semibold">Upload {asset.label}</span>
                                                </div>
                                                <span className="text-[9.5px] text-gray-400">{asset.hint}</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            ))}

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("id_card_title")} <span className="text-red-500">*</span></Label>
                                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9 text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("school_name")}</Label>
                                <Input value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} className="h-9 text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("address_phone_email")}</Label>
                                <Input value={form.school_address} onChange={(e) => setForm({ ...form, school_address: e.target.value })} className="h-9 text-xs" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("header_color")}</Label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={form.header_color} onChange={(e) => setForm({ ...form, header_color: e.target.value })} className="h-9 w-12 rounded border border-gray-200 cursor-pointer" />
                                        <Input value={form.header_color} onChange={(e) => setForm({ ...form, header_color: e.target.value })} className="h-9 text-xs flex-1" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("design_type")}</Label>
                                    <Select value={form.design_type} onValueChange={(v) => setForm({ ...form, design_type: v })}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Horizontal">{t("horizontal")}</SelectItem>
                                            <SelectItem value="Vertical">{t("vertical")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-3 border-t border-gray-100">
                                <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">{t("visible_fields")}</h3>
                                {TOGGLE_FIELDS.map((field) => (
                                    <div key={field.key} className="flex items-center justify-between py-0.5">
                                        <Label className="text-[11px] font-medium text-gray-600">{t(field.key)}</Label>
                                        <Switch checked={form[field.key as ToggleKey]} onCheckedChange={(v) => setForm({ ...form, [field.key]: v })} className="data-[state=checked]:bg-indigo-500 scale-90" />
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                {editingId && <Button variant="outline" onClick={resetForm} className="h-9 px-5 text-xs">{t("cancel")}</Button>}
                                <Button onClick={handleSave} disabled={saving} className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}{editingId ? t("update") : t("save")}
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
                                <ImageIcon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_id_card_list")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{pagination?.total ?? templates.length} {t("templates")}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                                <form onSubmit={(e) => { e.preventDefault(); fetchTemplates(1); }} className="flex items-center gap-2 w-full md:w-auto">
                                    <Input placeholder={t("search_id_cards")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-3 h-9 text-xs w-full md:w-64" />
                                    <Button type="submit" className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                                        <Search className="h-4 w-4" /> {t("search")}
                                    </Button>
                                </form>
                                <div className="flex items-center gap-2">
                                    <Select value={limit} onValueChange={setLimit}>
                                        <SelectTrigger className="w-[70px] h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>{["10", "25", "50", "100"].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                        {toolbarActions.map((a, i) => (
                                            <Button key={i} variant="ghost" size="icon" onClick={a.onClick} title={a.title} className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"><a.Icon className="h-4 w-4" /></Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-md border overflow-x-auto custom-scrollbar">
                                <Table className="min-w-[640px]">
                                    <TableHeader className="bg-gray-50 text-xs uppercase">
                                        <TableRow className="hover:bg-transparent whitespace-nowrap">
                                            <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">{t("id_card_title")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                            <TableHead className="font-semibold text-gray-600">{t("background")}</TableHead>
                                            <TableHead className="font-semibold text-gray-600">{t("design_type")}</TableHead>
                                            <TableHead className="font-semibold text-gray-600 text-right">{t("action")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <SkeletonRows />
                                        ) : templates.length === 0 ? (
                                            <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_id_cards_found")}</TableCell></TableRow>
                                        ) : templates.map((template) => (
                                            <TableRow key={template.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                                <TableCell className="py-3 text-[#6366f1] font-medium">{template.title}</TableCell>
                                                <TableCell className="py-3">
                                                    {template.background_image ? (
                                                        <img src={template.background_image} alt="bg" className="h-10 w-14 object-cover rounded border border-gray-200" />
                                                    ) : (
                                                        <div className="h-10 w-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center"><ImageIcon className="h-5 w-5 text-gray-400" /></div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-3 text-gray-500 font-medium">{template.design_type || "-"}</TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button size="icon" onClick={() => handlePreview(template)} title={t("preview")} className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Eye className="h-3.5 w-3.5" /></Button>
                                                        <Button size="icon" onClick={() => startEdit(template)} title={t("edit")} className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Pencil className="h-3.5 w-3.5" /></Button>
                                                        <Button size="icon" onClick={() => setDeleteId(template.id)} title={t("delete")} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Trash2 className="h-3.5 w-3.5" /></Button>
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
                                    <Button variant="outline" size="sm" disabled={!pagination || pagination.current_page === 1} onClick={() => fetchTemplates(pagination!.current_page - 1)} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                                    {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                        <Button key={i + 1} size="sm" onClick={() => fetchTemplates(i + 1)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all", pagination?.current_page === i + 1 ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200")}>{i + 1}</Button>
                                    ))}
                                    <Button variant="outline" size="sm" disabled={!pagination || pagination.current_page === pagination.last_page} onClick={() => fetchTemplates(pagination!.current_page + 1)} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_id_card_q")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("delete_id_card_description")}</AlertDialogDescription>
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
