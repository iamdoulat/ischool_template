"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "react-quill-new/dist/quill.snow.css";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    Eye,
    Trash2,
    Globe,
    Loader2,
    FolderOpen,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    ExternalLink,
    Share2,
    Sparkles,
} from "lucide-react";
import { cn, toLocaleNumber } from "@/lib/utils";
import api, { clearApiCache } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/components/providers/language-provider";
import { useTranslateToast } from "@/hooks/use-translate-toast";

interface PageItem {
    id: number;
    title: string;
    url: string | null;
    page_type: string;
    template?: string | null;
    is_system: boolean;
    content: string | null;
}

const PAGE_SIZES = [10, 20, 50, 100];

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <Skeleton
                                className="h-4 rounded"
                                style={{ width: `${55 + ((i * 3 + j * 7) % 35)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export function PagesTab({ activeWebsiteTemplate = "ischool" }: { activeWebsiteTemplate?: "ischool" | "imadrasha" } = {}) {
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const tt = useTranslateToast();

    const [pages, setPages] = useState<PageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const appUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");

    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showHtml, setShowHtml] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const ReactQuill = useMemo(
        () => dynamic(() => import("react-quill-new"), { ssr: false }),
        []
    );

    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ align: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["blockquote", "code-block"],
            ["link", "image"],
            ["clean"],
        ],
    };

    const [form, setForm] = useState({
        title: "",
        url: "",
        page_type: "Standard",
        template: "both",
        content: "",
    });

    const fetchPages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/pages");
            const extractedData = res.data?.data?.data || res.data?.data || res.data || [];
            setPages(Array.isArray(extractedData) ? extractedData : []);
        } catch {
            tt.error("failed_to_load_pages");
        } finally {
            setLoading(false);
        }
    }, [tt]);

    useEffect(() => {
        fetchPages();
    }, [fetchPages]);

    const openAdd = () => {
        setEditingId(null);
        setForm({
            title: "",
            url: "",
            page_type: "Standard",
            template: "both",
            content: "",
        });
        setShowHtml(false);
        setOpen(true);
    };

    const openEdit = (item: PageItem) => {
        setEditingId(item.id);
        const resolvedTemplate = item.template || getPageTemplateBadge(item).type || "both";
        setForm({
            title: item.title,
            url: item.url || "",
            page_type: item.page_type,
            template: resolvedTemplate,
            content: item.content || "",
        });
        setShowHtml(false);
        setOpen(true);
    };

    const [templateFilter, setTemplateFilter] = useState<"all" | "both" | "ischool" | "imadrasha">("all");
    const [presetLoading, setPresetLoading] = useState(false);

    const applyPagesPreset = async (targetTemplate: "ischool" | "imadrasha" | "both") => {
        setPresetLoading(true);
        try {
            await api.post("front-cms/pages/preset", { template: targetTemplate });
            clearApiCache('/front-cms/');
            tt.success("pages_preset_applied");
            fetchPages();
        } catch {
            tt.error("failed_to_save_page");
        } finally {
            setPresetLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.title) {
            tt.error("title_is_required");
            return;
        }
        setSaving(true);
        try {
            let normalizedUrl = form.url.trim();
            if (normalizedUrl.toLowerCase() === "home") {
                normalizedUrl = "/";
            } else if (normalizedUrl && !normalizedUrl.startsWith("/") && !normalizedUrl.startsWith("#")) {
                normalizedUrl = `/${normalizedUrl}`;
            }

            const payload = {
                ...form,
                url: normalizedUrl,
                template: form.template || "both",
            };

            if (editingId) {
                await api.put(`front-cms/pages/${editingId}`, payload);
            } else {
                await api.post("front-cms/pages", payload);
            }
            clearApiCache('/front-cms/');
            tt.success(editingId ? "page_updated" : "page_created");
            setOpen(false);
            fetchPages();
        } catch {
            tt.error("failed_to_save_page");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`front-cms/pages/${deleteId}`);
            clearApiCache('/front-cms/');
            tt.success("page_deleted");
            fetchPages();
        } catch {
            tt.error("failed_to_delete_page");
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const handleViewPage = (page: PageItem) => {
        const clean = (page.url || "").trim();
        let target = clean.replace(/^\//, "");
        if (clean === "" || clean === "/" || clean === "home" || clean === "/home") {
            target = "";
        } else if (clean.startsWith("#")) {
            target = clean;
        }
        let fullUrl = `${appUrl.replace(/\/$/, "")}/${target}`;
        const badge = getPageTemplateBadge(page);
        const tmpl = page.template || badge.type;
        if (tmpl === "imadrasha" || tmpl === "ischool") {
            const sep = fullUrl.includes("?") ? "&" : "?";
            if (!fullUrl.includes("template=")) {
                fullUrl = `${fullUrl}${sep}template=${tmpl}`;
            }
        }
        window.open(fullUrl, "_blank");
    };

    const getPageTemplateBadge = useCallback((page: PageItem) => {
        if (page.template) {
            const tmpl = page.template.toLowerCase().trim();
            if (tmpl === "imadrasha" || tmpl === "madrasha") {
                return {
                    label: t("template_imadrasha") || "iMadrasha",
                    className: "bg-teal-50 text-teal-800 border border-teal-200",
                    icon: "🕌",
                    type: "imadrasha" as const,
                };
            }
            if (tmpl === "ischool") {
                return {
                    label: t("template_ischool") || "iSchool",
                    className: "bg-indigo-50 text-indigo-700 border border-indigo-200",
                    icon: "🏫",
                    type: "ischool" as const,
                };
            }
            if (tmpl === "both" || tmpl === "shared" || tmpl === "all") {
                return {
                    label: t("both_templates") || "Both Templates",
                    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
                    icon: "🔗",
                    type: "both" as const,
                };
            }
        }

        const titleLower = (page.title || "").toLowerCase();
        const urlLower = (page.url || "").toLowerCase();
        const hasBangla = /[\u0980-\u09FF]/.test(page.title);
        const isAnchor = urlLower.startsWith("#");

        if (
            titleLower.includes("shared") ||
            titleLower.includes("উভয়") ||
            (page.is_system && !isAnchor && ["/", "/about-us", "/academics", "/notices", "/exam-results", "/contact-us", "/online_admission"].includes(urlLower))
        ) {
            return {
                label: t("both_templates") || "Both Templates",
                className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
                icon: "🔗",
                type: "both" as const,
            };
        }

        if (hasBangla || isAnchor || titleLower.includes("মাদ্রাসা") || titleLower.includes("মুহতামিম")) {
            return {
                label: t("template_imadrasha") || "iMadrasha",
                className: "bg-teal-50 text-teal-800 border border-teal-200",
                icon: "🕌",
                type: "imadrasha" as const,
            };
        }

        return {
            label: t("template_ischool") || "iSchool",
            className: "bg-indigo-50 text-indigo-700 border border-indigo-200",
            icon: "🏫",
            type: "ischool" as const,
        };
    }, [t]);

    const getBadgeStyle = (type: string) => {
        switch (type?.toLowerCase()) {
            case "gallery":
                return "bg-emerald-50 text-emerald-700 border border-emerald-200";
            case "event":
                return "bg-indigo-50 text-indigo-700 border border-indigo-200";
            default:
                return "bg-gray-100 text-gray-700 border border-gray-200";
        }
    };

    const filtered = useMemo(
        () =>
            pages.filter((p) => {
                const matchesSearch =
                    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (p.url && p.url.toLowerCase().includes(searchTerm.toLowerCase()));
                if (!matchesSearch) return false;

                if (templateFilter === "all") return true;
                const badge = getPageTemplateBadge(p);
                if (templateFilter === "both") return badge.type === "both";
                if (templateFilter === "ischool") return badge.type === "ischool" || badge.type === "both";
                if (templateFilter === "imadrasha") return badge.type === "imadrasha" || badge.type === "both";
                return true;
            }),
        [pages, searchTerm, templateFilter, getPageTemplateBadge]
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, filtered.length);

    const handleCopy = () => {
        navigator.clipboard.writeText(
            filtered.map((p) => `${p.title}\t/${p.url || ""}\t${p.page_type}`).join("\n")
        );
        toast({
            title: t("copied"),
            description: t("copied_to_clipboard") || "Copied to clipboard",
        });
    };

    const handleExportCSV = () => {
        const rows = [
            ["Title", "URL", "Page Type", "Is System"],
            ...filtered.map((p) => [
                p.title,
                p.url ? `/${p.url.replace(/^\//, "")}` : "-",
                p.page_type,
                p.is_system ? "Yes" : "No",
            ]),
        ];
        const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "cms_pages.csv";
        link.click();
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: t("excel") },
        { Icon: FileText, onClick: handleExportCSV, title: t("csv") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
    ];

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Table Container Card */}
            <div className="rounded-xl border border-gray-100 bg-white shadow-xs overflow-hidden p-5 space-y-4">
                {/* Template Preset & Share Action Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-teal-50/60 border border-indigo-100/70">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#6366F1] to-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
                            <Share2 className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                <span>{t("shared_for_both_templates") || "Shared for Both Templates (iSchool & iMadrasha)"}</span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {activeWebsiteTemplate === "imadrasha" ? "🕌 " + (t("template_imadrasha") || "iMadrasha") : "🏫 " + (t("template_ischool") || "iSchool")}
                                </span>
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                {t("share_pages_desc") || "Pages linked here can be seamlessly displayed and used in both iSchool and iMadrasha website templates."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={presetLoading}
                            onClick={() => applyPagesPreset("both")}
                            className="h-8 px-3 rounded-lg border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold gap-1.5 shadow-2xs active:scale-95 transition-all bg-white cursor-pointer"
                        >
                            {presetLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-indigo-600" />}
                            {t("sync_shared_pages") || "Sync Shared Pages"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={presetLoading}
                            onClick={() => applyPagesPreset("imadrasha")}
                            className="h-8 px-3 rounded-lg border-teal-200 hover:bg-teal-50 text-teal-700 text-xs font-semibold gap-1.5 shadow-2xs active:scale-95 transition-all bg-white cursor-pointer"
                        >
                            <span>🕌</span> {t("template_imadrasha_pages") || "iMadrasha Pages"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={presetLoading}
                            onClick={() => applyPagesPreset("ischool")}
                            className="h-8 px-3 rounded-lg border-orange-200 hover:bg-orange-50 text-orange-700 text-xs font-semibold gap-1.5 shadow-2xs active:scale-95 transition-all bg-white cursor-pointer"
                        >
                            <span>🏫</span> {t("template_ischool_pages") || "iSchool Pages"}
                        </Button>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {(
                        [
                            { key: "all", label: t("all_pages") || "All Pages", count: pages.length },
                            { key: "both", label: t("both_templates") || "Both Templates (Shared)", count: pages.filter(p => getPageTemplateBadge(p).type === "both").length },
                            { key: "ischool", label: t("template_ischool") || "iSchool", count: pages.filter(p => getPageTemplateBadge(p).type === "ischool" || getPageTemplateBadge(p).type === "both").length },
                            { key: "imadrasha", label: t("template_imadrasha") || "iMadrasha", count: pages.filter(p => getPageTemplateBadge(p).type === "imadrasha" || getPageTemplateBadge(p).type === "both").length },
                        ] as const
                    ).map((tab) => {
                        const active = templateFilter === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => {
                                    setTemplateFilter(tab.key);
                                    setCurrentPage(1);
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg font-medium text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                                    active
                                        ? "bg-indigo-600 text-white shadow-xs font-semibold"
                                        : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80"
                                )}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={cn(
                                        "px-1.5 py-0.2 rounded-full text-[10px]",
                                        active ? "bg-white/25 text-white" : "bg-gray-200 text-gray-600"
                                    )}
                                >
                                    {toLocaleNumber(tab.count, langCode)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search & Export Toolbar + Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        <Input
                            placeholder={t("search_pages")}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-9 h-9 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/60"
                        />
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap justify-end">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500">{t("show")}</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(v) => {
                                    setPageSize(Number(v));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[75px] h-8 text-xs border-gray-200 bg-white shadow-2xs rounded-lg px-2 font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map((n) => (
                                        <SelectItem key={n} value={String(n)} className="text-xs">
                                            {toLocaleNumber(n, langCode)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Export Toolbar */}
                        <div className="flex items-center border border-gray-200/80 rounded-lg p-0.5 bg-gray-50/80 text-gray-500">
                            {toolbarActions.map((a, i) => (
                                <Button
                                    key={i}
                                    variant="ghost"
                                    size="icon"
                                    onClick={a.onClick}
                                    title={a.title}
                                    className="h-7 w-7 text-gray-500 hover:text-gray-800 hover:bg-white rounded-md transition-all shadow-none"
                                >
                                    <a.Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>

                        <Button
                            onClick={openAdd}
                            className="h-8 px-4 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                        >
                            <Plus className="h-3.5 w-3.5" /> {t("add_page")}
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar bg-white shadow-2xs">
                    <Table className="min-w-[720px]">
                        <TableHeader className="bg-gray-50/80 text-xs">
                            <TableRow className="border-b border-gray-100 whitespace-nowrap">
                                <TableHead className="font-bold text-gray-700 py-3 pl-4">
                                    {t("title")}
                                </TableHead>
                                <TableHead className="font-bold text-gray-700 py-3">
                                    {t("url")}
                                </TableHead>
                                <TableHead className="font-bold text-gray-700 py-3 text-center">
                                    {t("type") || "Type"}
                                </TableHead>
                                <TableHead className="font-bold text-gray-700 py-3 text-center">
                                    {t("template") || "Template"}
                                </TableHead>
                                <TableHead className="font-bold text-gray-700 py-3 pr-4 text-right w-[110px]">
                                    {t("action")}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableSkeleton cols={5} />
                            ) : paginated.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-14 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <FolderOpen className="h-8 w-8 opacity-40" />
                                            <span className="text-xs font-semibold">
                                                {t("no_pages_found")}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginated.map((page) => {
                                    const templateBadge = getPageTemplateBadge(page);
                                    return (
                                        <TableRow
                                            key={page.id}
                                            className="text-xs border-b border-gray-50 hover:bg-indigo-50/30 transition-colors whitespace-nowrap cursor-pointer"
                                            onClick={() => openEdit(page)}
                                        >
                                            <TableCell className="py-3 pl-4 font-semibold text-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <span>{page.title}</span>
                                                    {page.is_system && (
                                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                                            System
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 font-mono text-xs">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewPage(page.url);
                                                    }}
                                                    className="text-[#6366f1] font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                    <span>/{page.url?.replace(/^\//, "") || ""}</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </button>
                                            </TableCell>
                                            <TableCell className="py-3 text-center">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-2xs",
                                                        getBadgeStyle(page.page_type)
                                                    )}
                                                >
                                                    {page.page_type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 text-center">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-2xs",
                                                        templateBadge.className
                                                    )}
                                                >
                                                    <span>{templateBadge.icon}</span>
                                                    <span>{templateBadge.label}</span>
                                                </span>
                                            </TableCell>
                                        <TableCell
                                            className="py-3 pr-4 text-right"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    size="icon"
                                                    onClick={() => handleViewPage(page)}
                                                    className="h-7 w-7 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xs shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                                                    title={t("view")}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    onClick={() => openEdit(page)}
                                                    className="h-7 w-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xs shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                                                    title={t("edit")}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                {!page.is_system && (
                                                    <Button
                                                        size="icon"
                                                        onClick={() => setDeleteId(page.id)}
                                                        className="h-7 w-7 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-xs shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
                                                        title={t("delete")}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-3 border-t border-gray-100">
                    <div>
                        {t("showing_x_to_y_of_z", {
                            from: toLocaleNumber(from, langCode),
                            to: toLocaleNumber(to, langCode),
                            total: toLocaleNumber(filtered.length, langCode),
                        })}
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-8 px-3 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 rounded-full shadow-2xs gap-1 cursor-pointer disabled:opacity-40"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" /> {t("previous")}
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .slice(Math.max(0, currentPage - 3), currentPage + 2)
                                .map((page) => {
                                    const isActive = currentPage === page;
                                    return (
                                        <Button
                                            key={page}
                                            size="sm"
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "h-8 w-8 p-0 text-xs font-bold rounded-full transition-all cursor-pointer",
                                                isActive
                                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                            )}
                                        >
                                            {toLocaleNumber(page, langCode)}
                                        </Button>
                                    );
                                })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-8 px-3 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 rounded-full shadow-2xs gap-1 cursor-pointer disabled:opacity-40"
                        >
                            {t("next")} <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add / Edit Page Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl p-0 rounded-2xl overflow-hidden border-none shadow-2xl bg-white">
                    <DialogHeader className="p-5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 flex flex-row items-center gap-3 space-y-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Globe className="h-5 w-5" />
                        </span>
                        <div>
                            <DialogTitle className="text-base font-bold text-gray-800 leading-none">
                                {editingId ? t("edit_page") : t("add_page")}
                            </DialogTitle>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                {t("manage_front_end_cms_pages")}
                            </p>
                        </div>
                    </DialogHeader>

                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("title")} <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="h-9 text-xs rounded-lg border-gray-200 focus-visible:ring-indigo-500"
                                    placeholder={t("page_title")}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("page_type")}
                                </Label>
                                <Select
                                    value={form.page_type}
                                    onValueChange={(v) => setForm({ ...form, page_type: v })}
                                >
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Standard" className="text-xs">Standard</SelectItem>
                                        <SelectItem value="Gallery" className="text-xs">Gallery</SelectItem>
                                        <SelectItem value="Event" className="text-xs">Event</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("url_optional")}
                                </Label>
                                <Input
                                    value={form.url}
                                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                                    className="h-9 text-xs font-mono rounded-lg border-gray-200 focus-visible:ring-indigo-500"
                                    placeholder="/my-custom-page"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("website_template") || "Website Template"}
                                </Label>
                                <Select
                                    value={form.template}
                                    onValueChange={(v) => setForm({ ...form, template: v })}
                                >
                                    <SelectTrigger className="h-9 text-xs border-gray-200 rounded-lg">
                                        <SelectValue placeholder={t("select_template") || "Select Template"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="both" className="text-xs">
                                            <span className="flex items-center gap-1.5">
                                                <span>🔗</span>
                                                <span className="font-medium">{t("both_templates") || "Both Templates (Shared)"}</span>
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="ischool" className="text-xs">
                                            <span className="flex items-center gap-1.5">
                                                <span>🏫</span>
                                                <span className="font-medium">{t("template_ischool") || "iSchool Template"}</span>
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="imadrasha" className="text-xs">
                                            <span className="flex items-center gap-1.5">
                                                <span>🕌</span>
                                                <span className="font-medium">{t("template_imadrasha") || "iMadrasha Template"}</span>
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("content")}
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowHtml(!showHtml)}
                                    className="text-[10px] h-6 px-2 text-gray-500 hover:text-gray-800"
                                >
                                    {showHtml ? t("visual_editor") : t("html_editor")}
                                </Button>
                            </div>

                            {showHtml ? (
                                <textarea
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    rows={10}
                                    className="w-full text-xs font-mono p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/50"
                                    placeholder="<p>HTML content here...</p>"
                                />
                            ) : (
                                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                    <ReactQuill
                                        value={form.content}
                                        onChange={(content: string) => setForm({ ...form, content })}
                                        modules={quillModules}
                                        className="h-64 mb-12"
                                        placeholder={t("write_page_content_here")}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="h-8 px-4 text-xs rounded-full border-gray-200 text-gray-600 hover:bg-gray-100"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-8 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-sm active:scale-95 transition-all"
                        >
                            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {editingId ? t("update_page") : t("create_page")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="max-w-md rounded-2xl p-6">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-gray-900">
                            {t("delete_page")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500">
                            {t("confirm_delete_page_description")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 mt-4">
                        <AlertDialogCancel className="h-8 px-4 text-xs rounded-full border-gray-200 text-gray-600">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="h-8 px-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 shadow-sm active:scale-95"
                        >
                            {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
