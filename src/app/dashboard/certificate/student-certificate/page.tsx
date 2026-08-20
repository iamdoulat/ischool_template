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
import { Badge } from "@/components/ui/badge";
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
    Sparkles,
    Check,
    Palette,
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
    type SchoolSettings,
    PREBUILT_CERTIFICATES,
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
    "[session]", "[school_name]",
];

const SAMPLE_STUDENT = {
    name: "JORDAN LEE",
    dob: "05/12/2012",
    present_address: "123 Academic Way",
    guardian: "Robert Lee",
    admission_no: "SCH-1042",
    roll_no: "12",
    class: "Grade 5",
    section: "A",
    gender: "Male",
    admission_date: "08/15/2020",
    category: "General",
    father_name: "Robert Lee",
    mother_name: "Sarah Lee",
    religion: "—",
    email: "jordan.lee@example.com",
    phone: "+1 555 019 2834",
    session: "2026 - 2027",
};

const TABLE_COLS = 4;

const emptyForm = {
    name: "",
    header_left: "",
    header_center: "CERTIFICATE OF APPRECIATION",
    header_right: "",
    body_text: "IN GRATEFUL RECOGNITION OF YOUR VALUABLE SUPPORT AND CONTRIBUTION TO OUR SCHOOL COMMUNITY.",
    remarks: "Certified that the student has been a bona fide student with commendable moral character and regular attendance.",
    footer_left: "",
    footer_center: "SAVANNAH WARD\nPRINCIPAL",
    footer_right: "",
    header_height: "90",
    footer_height: "70",
    body_height: "auto",
    body_width: "900",
    enable_student_photo: false,
    background_image: "",
    layout_type: "royal_gold",
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
    const [settings, setSettings] = useState<SchoolSettings>({});

    const [form, setForm] = useState({ ...emptyForm });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const bodyRef = useRef<HTMLTextAreaElement>(null);
    const remarksRef = useRef<HTMLTextAreaElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const galleryScrollRef = useRef<HTMLDivElement>(null);

    const scrollGallery = (direction: "left" | "right") => {
        if (galleryScrollRef.current) {
            const offset = direction === "left" ? -280 : 280;
            galleryScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
        }
    };

    const fetchSettings = async () => {
        try {
            const [genRes, printRes] = await Promise.all([
                api.get("/system-setting/general-setting").catch(() => ({ data: { data: {} } })),
                api.get("/system-setting/print-settings").catch(() => ({ data: { data: [] } })),
            ]);
            const gData = genRes.data?.data || genRes.data || {};
            const pData = printRes.data?.data || printRes.data || [];
            const generalPurposeTab = Array.isArray(pData)
                ? pData.find((p: any) => p.type === "General Purpose")
                : null;

            setSettings({
                ...gData,
                school_name: gData.school_name || "OAKRIDGE SCHOOL",
                admin_logo: gData.admin_logo || "",
                phone: gData.phone || "",
                email: gData.email || "",
                address: gData.address || "",
                current_session: gData.current_session || "2026 - 2027",
                general_purpose_header_image: generalPurposeTab?.header_image_url || generalPurposeTab?.header_image || null,
                general_purpose_footer_content: generalPurposeTab?.footer_content || null,
                general_purpose_paper_size: generalPurposeTab?.paper_size || "A4",
            });
        } catch {
            setSettings({
                school_name: "OAKRIDGE SCHOOL",
                current_session: "2026 - 2027",
            });
        }
    };

    const fetchTemplates = async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/certificate/student-certificates`, {
                params: { page, search: searchTerm, per_page: limit },
            });
            const d = res.data;
            setTemplates(d.data ?? d ?? []);
            setPagination({
                current_page: d.current_page,
                last_page: d.last_page,
                total: d.total,
                from: d.from,
                to: d.to,
            });
        } catch {
            tt.error("failed_to_fetch_certificates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [searchTerm, limit]);

    const resetForm = () => {
        setForm({ ...emptyForm });
        setEditingId(null);
    };

    const insertPlaceholder = (ph: string, targetField: "body_text" | "remarks" = "body_text") => {
        const ref = targetField === "remarks" ? remarksRef.current : bodyRef.current;
        if (ref) {
            const start = ref.selectionStart ?? form[targetField].length;
            const end = ref.selectionEnd ?? form[targetField].length;
            const text = form[targetField];
            const next = text.substring(0, start) + ph + text.substring(end);
            setForm((prev) => ({ ...prev, [targetField]: next }));
            setTimeout(() => {
                ref.focus();
                ref.setSelectionRange(start + ph.length, start + ph.length);
            }, 0);
        } else {
            setForm((prev) => ({ ...prev, [targetField]: (prev[targetField] ? prev[targetField] + " " : "") + ph }));
        }
    };

    const applyPrebuilt = (preset: (typeof PREBUILT_CERTIFICATES)[number]) => {
        setForm({
            name: preset.name,
            header_left: preset.header_left ?? "",
            header_center: preset.header_center ?? "",
            header_right: preset.header_right ?? "",
            body_text: preset.body_text ?? "",
            remarks: preset.remarks ?? "",
            footer_left: preset.footer_left ?? "",
            footer_center: preset.footer_center ?? "",
            footer_right: preset.footer_right ?? "",
            header_height: preset.header_height ?? "90",
            footer_height: preset.footer_height ?? "70",
            body_height: preset.body_height ?? "auto",
            body_width: preset.body_width ?? "900",
            enable_student_photo: !!preset.enable_student_photo,
            background_image: "",
            layout_type: preset.layout_type ?? "royal_gold",
        });
        setEditingId(null);
        toast({
            title: t("template_loaded") || "Design Loaded",
            description: `Loaded "${preset.name}". You can now customize or save it for your school.`,
        });
        window.scrollTo({ top: 380, behavior: "smooth" });
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast({
                title: t("validation_error"),
                description: t("certificate_name_is_required"),
                variant: "destructive",
            });
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
            name: t.name ?? "",
            header_left: t.header_left ?? "",
            header_center: t.header_center ?? "",
            header_right: t.header_right ?? "",
            body_text: t.body_text ?? "",
            remarks: t.remarks ?? "",
            footer_left: t.footer_left ?? "",
            footer_center: t.footer_center ?? "",
            footer_right: t.footer_right ?? "",
            header_height: t.header_height ?? "90",
            footer_height: t.footer_height ?? "70",
            body_height: t.body_height ?? "auto",
            body_width: t.body_width ?? "900",
            enable_student_photo: !!t.enable_student_photo,
            background_image: t.background_image ?? "",
            layout_type: t.layout_type ?? "royal_gold",
        });
        window.scrollTo({ top: 380, behavior: "smooth" });
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

    const handlePreviewTemplate = (t: CertificateTemplate) => {
        const student = {
            ...SAMPLE_STUDENT,
            school_name: settings.school_name,
            school_logo: settings.admin_logo,
            session: settings.current_session,
        };
        const html = renderCertificateHtml(t, student, settings);
        printCertificate(html);
    };

    const handlePreviewCurrentForm = () => {
        const templateObj: CertificateTemplate = {
            id: editingId || 0,
            name: form.name || "Preview Certificate",
            ...form,
        };
        const student = {
            ...SAMPLE_STUDENT,
            school_name: settings.school_name,
            school_logo: settings.admin_logo,
            session: settings.current_session,
        };
        const html = renderCertificateHtml(templateObj, student, settings);
        printCertificate(html);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(templates.map((t) => t.name).join("\n"));
        tt.success("data_copied_to_clipboard");
    };

    const handleExportCSV = () => {
        const rows = [
            [t("certificate_name"), t("layout_style"), t("background_image")],
            ...templates.map((t) => [t.name, t.layout_type || "standard_school", t.background_image || "-"]),
        ];
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

    const getLayoutBadge = (layout?: string | null) => {
        switch (layout) {
            case "royal_gold":
                return <Badge className="bg-amber-600/90 hover:bg-amber-600 text-white text-[10px]">Royal Maroon & Gold</Badge>;
            case "kids_purple":
                return <Badge className="bg-purple-600/90 hover:bg-purple-600 text-white text-[10px]">Kids Vibrant Purple</Badge>;
            case "luxury_burgundy":
                return <Badge className="bg-rose-950 hover:bg-rose-900 text-white text-[10px]">Luxury Burgundy</Badge>;
            case "school_letterhead":
                return <Badge className="bg-teal-700 hover:bg-teal-800 text-white text-[10px]">School Letterhead (Print H/F)</Badge>;
            default:
                return <Badge className="bg-slate-700 hover:bg-slate-800 text-white text-[10px]">Standard School Print</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* ──────────────────────── Pre-built Certificate Templates Gallery ──────────────────────── */}
            <Card className="border-[0.5px] border-indigo-100 shadow-[0_4px_24px_rgb(0,0,0,0.06)] bg-gradient-to-r from-amber-50/40 via-purple-50/30 to-indigo-50/40 overflow-hidden">
                <CardHeader className="py-4 px-6 border-b border-indigo-100/60 bg-white/60 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                                <Sparkles className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                                    Pre-built Certificate Design Templates
                                    <Badge className="bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider px-2">
                                        Pro Styles
                                    </Badge>
                                </CardTitle>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    1-Click ready-to-use high-resolution certificates. Automatically branded with your school logo, name, and General Purpose print settings.
                                </p>
                            </div>
                        </div>

                        {/* Horizontal Scroll Navigation Arrows */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
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
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div
                        ref={galleryScrollRef}
                        className="flex items-stretch gap-4 overflow-x-auto custom-scrollbar pb-3 pt-1 scroll-smooth snap-x snap-mandatory"
                    >
                        {PREBUILT_CERTIFICATES.map((preset) => (
                            <div
                                key={preset.id}
                                className="group relative flex-none w-[calc(25%-12px)] min-w-[240px] flex flex-col justify-between rounded-2xl bg-white border border-gray-200/80 p-4 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 hover:-translate-y-0.5 snap-start"
                            >
                                <div className="space-y-3">
                                    {/* Preview Banner Header */}
                                    <div
                                        style={{ background: preset.preview_bg }}
                                        className="h-28 rounded-xl relative overflow-hidden flex flex-col items-center justify-center text-white p-3 shadow-inner text-center"
                                    >
                                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px]" />
                                        <div className="relative z-10 space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-200 block">
                                                {preset.layout_type === "royal_gold" && "Regal Foil & Waves"}
                                                {preset.layout_type === "kids_purple" && "Playful Distinction"}
                                                {preset.layout_type === "luxury_burgundy" && "Classic Excellence"}
                                                {preset.layout_type === "school_letterhead" && "Letterhead Print H/F"}
                                                {preset.layout_type === "standard_school" && "School Print Header"}
                                            </span>
                                            <h4 className="font-extrabold text-sm tracking-tight text-white drop-shadow-sm leading-snug">
                                                {preset.header_center}
                                            </h4>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-xs text-gray-900 line-clamp-1">{preset.name}</h4>
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
                                            onClick={() => handlePreviewTemplate({ id: 0, ...preset })}
                                            title={t("preview") || "Preview Certificate"}
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

            {/* ──────────────────────── Main Content: Form & List ──────────────────────── */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: Form */}
                <div className="w-full lg:w-[460px] shrink-0">
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
                            {/* Certificate Name */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    {t("certificate_name")} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={form.name}
                                    placeholder="e.g. Certificate of Appreciation"
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="h-9 text-xs"
                                />
                            </div>

                            {/* UI Layout Style Picker */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1.5">
                                    <Palette className="h-3.5 w-3.5 text-indigo-500" />
                                    Certificate UI Style Layout <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={form.layout_type}
                                    onValueChange={(val) => setForm({ ...form, layout_type: val })}
                                >
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="Choose a certificate layout style" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="royal_gold">Royal Maroon & Gold (Appreciation / Honors)</SelectItem>
                                        <SelectItem value="kids_purple">Kids Vibrant Purple (Distinction / Primary)</SelectItem>
                                        <SelectItem value="luxury_burgundy">Classic Luxury Burgundy (Excellence / Senior)</SelectItem>
                                        <SelectItem value="school_letterhead">School Letterhead Template (General Purpose Print H/F)</SelectItem>
                                        <SelectItem value="standard_school">Standard School Print Header & Footer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Header Texts */}
                            {([
                                [t("header_left_text"), "header_left", "Left header or affiliation code"],
                                [t("header_center_text"), "header_center", "Main Certificate Title (e.g. CERTIFICATE OF APPRECIATION)"],
                                [t("header_right_text"), "header_right", "Right header or session code"],
                            ] as const).map(([label, key, placeholder]) => (
                                <div key={key} className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{label}</Label>
                                    <Input
                                        value={form[key]}
                                        placeholder={placeholder}
                                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                        className="h-9 text-xs"
                                    />
                                </div>
                            ))}

                            {/* Body Text (Open Custom Text) */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">
                                        {t("body_text")} (Open Custom Text)
                                    </Label>
                                    <span className="text-[10px] text-gray-400">Used in artistic layout styles</span>
                                </div>
                                <Textarea
                                    ref={bodyRef}
                                    value={form.body_text}
                                    onChange={(e) => setForm({ ...form, body_text: e.target.value })}
                                    className="min-h-[90px] text-xs resize-none"
                                    placeholder="Enter open certificate recognition text or paragraph..."
                                />
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {PLACEHOLDERS.map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => insertPlaceholder(p, "body_text")}
                                            className="text-[9px] text-indigo-600 font-semibold px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 cursor-pointer transition-colors"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* REMARKS / PURPOSE / CERTIFICATION */}
                            <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-bold text-teal-800 uppercase tracking-tight">
                                        REMARKS / PURPOSE / CERTIFICATION :
                                    </Label>
                                    <span className="text-[10px] text-gray-400">Printed in structured certificates</span>
                                </div>
                                <Textarea
                                    ref={remarksRef}
                                    value={form.remarks}
                                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                                    className="min-h-[85px] text-xs resize-none"
                                    placeholder="e.g. Certified that the student has been a bona fide student with commendable moral character and regular attendance..."
                                />
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {PLACEHOLDERS.map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => insertPlaceholder(p, "remarks")}
                                            className="text-[9px] text-teal-700 font-semibold px-1.5 py-0.5 rounded bg-teal-50 hover:bg-teal-100 cursor-pointer transition-colors"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Signatures */}
                            {([
                                [t("footer_left_text"), "footer_left", "Left signature (e.g. Class Teacher)"],
                                [t("footer_center_text"), "footer_center", "Center signature (e.g. Principal)"],
                                [t("footer_right_text"), "footer_right", "Right signature (e.g. Director)"],
                            ] as const).map(([label, key, placeholder]) => (
                                <div key={key} className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{label}</Label>
                                    <Input
                                        value={form[key]}
                                        placeholder={placeholder}
                                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                        className="h-9 text-xs"
                                    />
                                </div>
                            ))}

                            {/* Design Dimensions */}
                            <div className="space-y-3 pt-2 border-t border-gray-100">
                                <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">{t("certificate_design")}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {([
                                        [t("header_height"), "header_height", "90"],
                                        [t("footer_height"), "footer_height", "70"],
                                        [t("body_height"), "body_height", "auto"],
                                        [t("body_width"), "body_width", "900"],
                                    ] as const).map(([label, key, ph]) => (
                                        <div key={key} className="space-y-1">
                                            <Label className="text-[10px] text-gray-400">{label}</Label>
                                            <Input
                                                value={form[key]}
                                                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                                className="h-9 text-xs"
                                                placeholder={ph}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                <Label className="text-[10px] font-bold text-gray-800 uppercase tracking-tight">{t("student_photo")}</Label>
                                <Switch
                                    checked={form.enable_student_photo}
                                    onCheckedChange={(v) => setForm({ ...form, enable_student_photo: v })}
                                    className="data-[state=checked]:bg-indigo-500"
                                />
                            </div>

                            {/* Optional Custom Background Image */}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Custom Background Image (Optional)
                                </Label>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                                />
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-md p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-200 transition-colors bg-gray-50/30"
                                >
                                    {uploading ? (
                                        <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                                    ) : form.background_image ? (
                                        <>
                                            <img src={form.background_image} alt="bg" className="h-14 object-contain rounded shadow-xs" />
                                            <p className="text-[10px] text-gray-500">{t("click_to_replace")}</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-7 w-7 rounded-full bg-indigo-50 flex items-center justify-center">
                                                <Upload className="h-3.5 w-3.5 text-indigo-500" />
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium">{t("drag_drop_or_click")}</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center gap-2 pt-3 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handlePreviewCurrentForm}
                                    className="h-9 px-3.5 text-xs font-semibold gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    Live Preview
                                </Button>

                                <div className="flex items-center gap-2">
                                    {editingId && (
                                        <Button variant="outline" onClick={resetForm} className="h-9 px-4 text-xs">
                                            {t("cancel")}
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="h-9 px-7 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                                    >
                                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {editingId ? t("update") : t("save")}
                                    </Button>
                                </div>
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
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {t("student_certificate_list")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {pagination?.total ?? templates.length} {t("certificates")}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        fetchTemplates(1);
                                    }}
                                    className="flex items-center gap-2 w-full md:w-auto"
                                >
                                    <Input
                                        placeholder={t("search_certificates")}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-3 h-9 text-xs w-full md:w-64"
                                    />
                                    <Button
                                        type="submit"
                                        className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                                    >
                                        <Search className="h-4 w-4" /> {t("search")}
                                    </Button>
                                </form>
                                <div className="flex items-center gap-2">
                                    <Select value={limit} onValueChange={setLimit}>
                                        <SelectTrigger className="w-[70px] h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["10", "25", "50", "100"].map((n) => (
                                                <SelectItem key={n} value={n}>
                                                    {n}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                        {toolbarActions.map((a, i) => (
                                            <Button
                                                key={i}
                                                variant="ghost"
                                                size="icon"
                                                onClick={a.onClick}
                                                title={a.title}
                                                className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                            >
                                                <a.Icon className="h-4 w-4" />
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-md border overflow-x-auto custom-scrollbar">
                                <Table className="min-w-[650px]">
                                    <TableHeader className="bg-gray-50 text-xs uppercase">
                                        <TableRow className="hover:bg-transparent whitespace-nowrap">
                                            <TableHead className="font-semibold text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    {t("certificate_name")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                                </div>
                                            </TableHead>
                                            <TableHead className="font-semibold text-gray-600">Layout Style</TableHead>
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
                                        ) : (
                                            templates.map((template) => (
                                                <TableRow
                                                    key={template.id}
                                                    className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap"
                                                >
                                                    <TableCell className="py-3 text-[#6366f1] font-medium">
                                                        {template.name}
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        {getLayoutBadge(template.layout_type)}
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        {template.background_image ? (
                                                            <img
                                                                src={template.background_image}
                                                                alt="bg"
                                                                className="h-9 w-14 object-cover rounded border border-gray-200"
                                                            />
                                                        ) : (
                                                            <div className="h-9 w-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                                                <ImageIcon className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                size="icon"
                                                                onClick={() => handlePreviewTemplate(template)}
                                                                title={t("preview")}
                                                                className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                            >
                                                                <Eye className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                onClick={() => startEdit(template)}
                                                                title={t("edit")}
                                                                className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                onClick={() => setDeleteId(template.id)}
                                                                title={t("delete")}
                                                                className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                                <div>
                                    {t("showing_x_to_y_of_z", {
                                        from: pagination?.from || 0,
                                        to: pagination?.to || 0,
                                        total: pagination?.total || 0,
                                    })}
                                </div>
                                <div className="flex gap-1 items-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!pagination || pagination.current_page === 1}
                                        onClick={() => fetchTemplates(pagination!.current_page - 1)}
                                        className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                        <Button
                                            key={i + 1}
                                            size="sm"
                                            onClick={() => fetchTemplates(i + 1)}
                                            className={cn(
                                                "h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all",
                                                pagination?.current_page === i + 1
                                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md"
                                                    : "bg-white text-gray-600 border border-gray-200"
                                            )}
                                        >
                                            {i + 1}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!pagination || pagination.current_page === pagination.last_page}
                                        onClick={() => fetchTemplates(pagination!.current_page + 1)}
                                        className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                                    >
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
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
