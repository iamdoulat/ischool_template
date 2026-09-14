/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Globe,
    Building2,
    Loader2,
    ExternalLink,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Users,
    Briefcase,
    Star,
    Phone,
    Mail,
    Sparkles,
    Image as ImageIcon,
    Palette,
    Upload,
    Settings,
} from "lucide-react";
import { cn, toLocaleNumber } from "@/lib/utils";
import { toast as sonnerToast } from "sonner";
import { useImageUrl } from "@/lib/image-url";

interface Branch {
    id: string | number;
    branch_name: string;
    school_slogan?: string;
    school_description?: string;
    branch_code?: string;
    slug?: string;
    branch_url: string;
    is_main?: boolean | number;
    phone?: string;
    email?: string;
    address?: string;
    principal_name?: string;
    logo?: string;
    admin_logo?: string;
    admin_small_logo?: string;
    app_logo?: string;
    print_logo?: string;
    favicon?: string;
    primary_color?: string;
    status?: string;
    total_students_count?: number;
    total_staff_count?: number;
}

const TABLE_COLS = 6;

function SkeletonRows({ rows = 5 }: { rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: TABLE_COLS }).map((_, j) => (
                        <TableCell key={j} className="py-3.5">
                            <div
                                className="h-3.5 rounded bg-gray-200/70 animate-pulse"
                                style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function SettingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const getImageUrl = useImageUrl();

    const [searchTerm, setSearchTerm] = useState("");
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [originUrl, setOriginUrl] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [totalEntries, setTotalEntries] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | number | null>(null);
    const [deleteId, setDeleteId] = useState<string | number | null>(null);
    const [uploadingLogoType, setUploadingLogoType] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        branch_name: "",
        school_slogan: "",
        school_description: "",
        branch_code: "",
        slug: "",
        branch_url: "",
        is_main: false,
        phone: "",
        email: "",
        address: "",
        principal_name: "",
        logo: "",
        admin_logo: "",
        admin_small_logo: "",
        app_logo: "",
        print_logo: "",
        favicon: "",
        primary_color: "#6366F1",
        status: "active",
    });

    const getFrontendBaseUrl = useCallback(() => {
        if (typeof window !== "undefined" && window.location.origin) {
            return window.location.origin;
        }
        if (process.env.NEXT_PUBLIC_FRONTEND_URL) {
            return process.env.NEXT_PUBLIC_FRONTEND_URL.replace(/\/$/, "");
        }
        if (process.env.NEXT_PUBLIC_APP_URL) {
            return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
        }
        return "http://localhost:3000";
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setOriginUrl(window.location.origin);
        }
    }, []);

    const fetchBranches = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = {
                page,
                per_page: itemsPerPage,
            };
            if (searchTerm.trim()) {
                params.search = searchTerm.trim();
            }
            const response = await api.get("/multi-branch/branches", { params });
            const body = response.data;
            if (body && Array.isArray(body.data)) {
                setBranches(body.data);
                setTotalEntries(body.total || body.data.length);
                setLastPage(body.last_page || 1);
            } else if (Array.isArray(body)) {
                setBranches(body);
                setTotalEntries(body.length);
                setLastPage(1);
            } else {
                setBranches([]);
                setTotalEntries(0);
                setLastPage(1);
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
            toast({
                title: t("error"),
                description: t("failed_to_fetch_data") || "Failed to fetch branches",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage, searchTerm, t, toast]);

    useEffect(() => {
        fetchBranches(currentPage);
    }, [fetchBranches, currentPage]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.branch_name.trim()) {
            toast({
                title: t("error"),
                description: t("all_fields_are_required") || "Branch School Name is required.",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            const baseOrigin = (originUrl || getFrontendBaseUrl()).replace(/\/$/, "");
            const payload = {
                ...formData,
                branch_url: formData.is_main
                    ? `${baseOrigin}`
                    : `${baseOrigin}/br/${formData.slug || formData.branch_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            };

            if (editMode && selectedId) {
                await api.put(`/multi-branch/branches/${selectedId}`, payload);
                toast({
                    title: t("success"),
                    description: t("branch_updated") || "Branch updated successfully.",
                });
            } else {
                await api.post("/multi-branch/branches", payload);
                toast({
                    title: t("success"),
                    description: t("branch_created") || "Branch created successfully.",
                });
            }
            setOpen(false);
            resetForm();
            fetchBranches(currentPage);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast({
                title: t("error"),
                description: error.response?.data?.message || t("failed_to_save_data") || "Failed to save branch.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (branch: Branch) => {
        setSelectedId(branch.id);
        setEditMode(true);
        setFormData({
            branch_name: branch.branch_name || "",
            school_slogan: branch.school_slogan || "",
            school_description: branch.school_description || "",
            branch_code: branch.branch_code || "",
            slug: branch.slug || "",
            branch_url: branch.branch_url || "",
            is_main: Boolean(branch.is_main) || branch.id === 1 || String(branch.id) === "1",
            phone: branch.phone || "",
            email: branch.email || "",
            address: branch.address || "",
            principal_name: branch.principal_name || "",
            logo: branch.logo || "",
            admin_logo: branch.admin_logo || branch.logo || "",
            admin_small_logo: branch.admin_small_logo || "",
            app_logo: branch.app_logo || "",
            print_logo: branch.print_logo || "",
            favicon: branch.favicon || "",
            primary_color: branch.primary_color || "#6366F1",
            status: branch.status || "active",
        });
        setOpen(true);
    };

    const handleFileUpload = async (logoType: string, file: File) => {
        if (!selectedId) {
            sonnerToast.info("Please save the branch first before uploading dedicated assets.");
            return;
        }

        setUploadingLogoType(logoType);
        const data = new FormData();
        data.append("logo_type", logoType);
        data.append("file", file);

        try {
            const res = await api.post(`/multi-branch/branches/${selectedId}/upload-logo`, data);
            const relativeUrl = res.data?.url;
            setFormData((prev) => ({
                ...prev,
                [logoType]: relativeUrl,
                ...(logoType === "admin_logo" ? { logo: relativeUrl } : {}),
            }));
            sonnerToast.success(`${logoType.replace(/_/g, " ").toUpperCase()} uploaded successfully.`);
            fetchBranches(currentPage);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            sonnerToast.error(error.response?.data?.message || "Failed to upload logo asset.");
        } finally {
            setUploadingLogoType(null);
        }
    };

    const handleDeleteLogo = async (logoType: string) => {
        if (!selectedId) {
            setFormData((prev) => ({ ...prev, [logoType]: "" }));
            return;
        }

        try {
            await api.post(`/multi-branch/branches/${selectedId}/delete-logo`, { logo_type: logoType });
            setFormData((prev) => ({ ...prev, [logoType]: "" }));
            sonnerToast.success(`${logoType.replace(/_/g, " ").toUpperCase()} removed.`);
            fetchBranches(currentPage);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            sonnerToast.error(error.response?.data?.message || "Failed to remove logo asset.");
        }
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/multi-branch/branches/${deleteId}`);
            toast({
                title: t("success"),
                description: t("branch_deleted") || "Branch removed successfully.",
            });
            fetchBranches(currentPage);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast({
                title: t("error"),
                description: error.response?.data?.message || t("failed_to_delete_data") || "Failed to delete branch.",
                variant: "destructive",
            });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormData({
            branch_name: "",
            school_slogan: "",
            school_description: "",
            branch_code: "",
            slug: "",
            branch_url: "",
            is_main: false,
            phone: "",
            email: "",
            address: "",
            principal_name: "",
            logo: "",
            admin_logo: "",
            admin_small_logo: "",
            app_logo: "",
            print_logo: "",
            favicon: "",
            primary_color: "#6366F1",
            status: "active",
        });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(
            branches.map((b) => `${b.branch_name}\t${b.branch_code || ""}\t${b.branch_url}\t${b.phone || ""}`).join("\n")
        );
        toast({
            title: t("copied"),
            description: t("copied_to_clipboard") || "Branch list copied to clipboard.",
        });
    };

    const handleExportCSV = () => {
        const rows = [
            ["Branch Name", "Code", "Slug", "Branch URL", "Status", "Students", "Staff"],
            ...branches.map((b) => [
                b.branch_name,
                b.branch_code || "-",
                b.slug || "-",
                b.branch_url,
                b.status || "active",
                (b.total_students_count || 0).toString(),
                (b.total_staff_count || 0).toString(),
            ]),
        ];
        const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "branches.csv";
        link.click();
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: t("excel") },
        { Icon: FileText, onClick: handleExportCSV, title: t("csv") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
    ];

    const from = totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const to = Math.min(currentPage * itemsPerPage, totalEntries);

    // Auto-generated full live URL for preview
    const isMainModal = Boolean(formData.is_main) || selectedId === 1 || String(selectedId) === "1";
    const livePreviewSlug = isMainModal ? "" : (formData.slug || formData.branch_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    const currentOrigin = (originUrl || getFrontendBaseUrl()).replace(/\/$/, "");
    const fullGeneratedUrl = isMainModal ? `${currentOrigin}` : `${currentOrigin}/br/${livePreviewSlug || "branch-name"}`;
    const modalLinkHref = isMainModal ? "/" : `/br/${livePreviewSlug}`;

    const logoAssetConfigs = [
        {
            key: "admin_logo",
            label: "Admin Header Logo",
            desc: "Primary branch logo displayed on top navigation bar and dashboard header.",
            dim: "240 × 70 px",
        },
        {
            key: "admin_small_logo",
            label: "Collapsed Sidebar Icon",
            desc: "Compact icon logo displayed when dashboard sidebar is collapsed.",
            dim: "60 × 60 px",
        },
        {
            key: "print_logo",
            label: "Receipts & Invoices Logo",
            desc: "High-resolution logo printed on fee receipts, report cards, and certificates.",
            dim: "300 × 100 px",
        },
        {
            key: "app_logo",
            label: "Student Portal & App Logo",
            desc: "Branded emblem for student/parent mobile portal and public landing.",
            dim: "180 × 180 px",
        },
        {
            key: "favicon",
            label: "Browser Tab Favicon",
            desc: "Small square favicon displayed in the browser tab for this branch.",
            dim: "32 × 32 px (.ico, .png)",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header Banner - Standalone edge-to-edge gradient */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Globe className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("branch_settings")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("branch_settings_description")}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setOpen(true);
                    }}
                    className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                    <Plus className="h-4 w-4" /> {t("add_branch")}
                </Button>
            </div>

            {/* Table Container Card */}
            <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs overflow-hidden p-5 space-y-4">
                {/* Search & Export Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setCurrentPage(1);
                            fetchBranches(1);
                        }}
                        className="flex items-center gap-2 w-full md:w-auto"
                    >
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                            <Input
                                placeholder={t("search_branches")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/60"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                        >
                            <Search className="h-3.5 w-3.5" /> {t("search")}
                        </Button>
                    </form>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                        {/* Items Per Page Select */}
                        <div className="flex items-center gap-1.5">
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(val) => {
                                    setItemsPerPage(parseInt(val));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[75px] h-8 text-xs border-gray-200 bg-white shadow-2xs rounded-lg px-2 font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {["10", "25", "50", "100"].map((n) => (
                                        <SelectItem key={n} value={n} className="text-xs">
                                            {toLocaleNumber(Number(n), langCode)}
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
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar bg-white shadow-2xs">
                    <Table className="min-w-[850px]">
                        <TableHeader className="bg-gray-50/80 text-xs">
                            <TableRow className="border-b border-gray-100 whitespace-nowrap">
                                <TableHead className="font-bold text-gray-700 py-3 pl-4">
                                    {t("campus_branch_details")}
                                </TableHead>
                                <TableHead className="font-bold text-gray-700 py-3">
                                    {t("access_url_code")}
                                </TableHead>
                                <TableHead className="font-bold text-gray-700 py-3">
                                    {t("contact_info")}
                                </TableHead>
                                <TableHead className="font-bold text-gray-700 py-3 text-center">
                                    {t("assigned_members")}
                                </TableHead>
                                <TableHead className="font-bold text-gray-700 py-3 text-center">
                                    {t("status")}
                                </TableHead>
                                <TableHead className="font-bold text-gray-700 py-3 pr-4 text-right">
                                    {t("action")}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <SkeletonRows />
                            ) : branches.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={TABLE_COLS}
                                        className="py-12 text-center text-xs font-semibold text-gray-400"
                                    >
                                        {t("no_branches_found")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                branches.map((item) => {
                                    const isMainBranch =
                                        item.is_main === true ||
                                        item.is_main === 1 ||
                                        String(item.is_main) === "1" ||
                                        item.id === 1 ||
                                        String(item.id) === "1";
                                    const baseOrigin = (originUrl || getFrontendBaseUrl()).replace(/\/$/, "");
                                    const branchLiveUrl = isMainBranch
                                        ? `${baseOrigin}`
                                        : `${baseOrigin}/br/${item.slug || item.id}`;
                                    const branchHref = isMainBranch ? "/" : `/br/${item.slug || item.id}`;
                                    const activeDisplayLogo =
                                        item.admin_logo || item.logo || item.app_logo || item.print_logo;

                                    return (
                                        <TableRow
                                            key={item.id}
                                            className="text-xs border-b border-gray-50 hover:bg-indigo-50/30 transition-colors cursor-pointer whitespace-nowrap"
                                            onClick={() => {
                                                if (isMainBranch) {
                                                    sonnerToast.info("Main Campus is managed from General Settings.");
                                                    router.push("/dashboard/system-setting/general-setting");
                                                } else {
                                                    handleEdit(item);
                                                }
                                            }}
                                        >
                                            {/* Branch Name & Logo Badge */}
                                            <TableCell className="py-3 pl-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={cn(
                                                            "h-11 w-11 rounded-xl flex items-center justify-center font-bold overflow-hidden border p-0.5 shrink-0",
                                                            isMainBranch
                                                                ? "bg-indigo-50 text-[#6366f1] border-indigo-100"
                                                                : "bg-gray-50 text-gray-500 border-gray-200"
                                                        )}
                                                    >
                                                        {activeDisplayLogo ? (
                                                            <img
                                                                src={getImageUrl(activeDisplayLogo)}
                                                                alt={item.branch_name}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        ) : isMainBranch ? (
                                                            <Star className="h-5 w-5 fill-[#FF9800] text-[#FF9800]" />
                                                        ) : (
                                                            <Building2 className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-800 text-sm">
                                                                {item.branch_name}
                                                            </span>
                                                            {isMainBranch && (
                                                                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-2xs">
                                                                    {t("main_campus")}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.school_slogan ? (
                                                            <p className="text-[11px] text-gray-500 italic truncate max-w-xs">
                                                                &ldquo;{item.school_slogan}&rdquo;
                                                            </p>
                                                        ) : item.principal_name ? (
                                                            <p className="text-[11px] text-gray-500">
                                                                {t("principal_branch_head")}: {item.principal_name}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Code & URL */}
                                            <TableCell className="py-3">
                                                <div>
                                                    <span className="font-mono text-xs font-bold bg-gray-100/80 px-2 py-0.5 rounded-md text-gray-700 border border-gray-200/60">
                                                        {toLocaleNumber(item.branch_code || item.slug || "-", langCode)}
                                                    </span>
                                                    <div className="mt-1 flex items-center gap-1.5">
                                                        <a
                                                            href={branchHref}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[#6366f1] font-medium hover:underline inline-flex items-center gap-1 text-xs"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <span>{branchLiveUrl}</span>
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 rounded p-0 text-gray-400 hover:text-gray-700"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigator.clipboard.writeText(branchLiveUrl);
                                                                sonnerToast.success("Branch URL copied to clipboard!");
                                                            }}
                                                            title={t("copy_url")}
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Contact Info */}
                                            <TableCell className="py-3">
                                                <div className="space-y-0.5 text-xs text-gray-500">
                                                    {item.phone && (
                                                        <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                                                            <Phone className="h-3 w-3 text-[#6366f1]" />
                                                            <span>{toLocaleNumber(item.phone, langCode)}</span>
                                                        </div>
                                                    )}
                                                    {item.email && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Mail className="h-3 w-3 text-gray-400" />
                                                            <span>{item.email}</span>
                                                        </div>
                                                    )}
                                                    {!item.phone && !item.email && <span className="italic text-[11px]">-</span>}
                                                </div>
                                            </TableCell>

                                            {/* Members count */}
                                            <TableCell className="py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-100">
                                                        <Users className="h-3 w-3" />
                                                        <span>
                                                            {toLocaleNumber(item.total_students_count || 0, langCode)} {t("students")}
                                                        </span>
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                                                        <Briefcase className="h-3 w-3" />
                                                        <span>
                                                            {toLocaleNumber(item.total_staff_count || 0, langCode)} {t("staff")}
                                                        </span>
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell className="py-3 text-center">
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-bold uppercase px-2.5 py-1 rounded-full",
                                                        item.status === "active"
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                            : "bg-rose-50 text-rose-700 border border-rose-200"
                                                    )}
                                                >
                                                    {item.status === "active"
                                                        ? t("active_operational")
                                                        : t("inactive_under_setup")}
                                                </span>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="py-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {isMainBranch ? (
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push("/dashboard/system-setting/general-setting");
                                                            }}
                                                            size="sm"
                                                            title="Main Campus is managed from General Settings"
                                                            className="h-7 px-3 text-xs font-bold text-white bg-gradient-to-r from-[#6366f1] to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-lg gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                                                        >
                                                            <Settings className="h-3 w-3" />
                                                            <span>{t("general_settings")}</span>
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEdit(item);
                                                                }}
                                                                className="h-7 w-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xs shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                                                                title={t("edit")}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteId(item.id);
                                                                }}
                                                                className="h-7 w-7 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-xs shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
                                                                title={t("delete")}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </>
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
                            total: toLocaleNumber(totalEntries, langCode),
                        })}
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage <= 1 || loading}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="h-8 px-3 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 rounded-full shadow-2xs gap-1 cursor-pointer disabled:opacity-40"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" /> {t("previous")}
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: lastPage }).map((_, i) => {
                                const pageNum = i + 1;
                                const isActive = currentPage === pageNum;
                                return (
                                    <Button
                                        key={pageNum}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={cn(
                                            "h-8 w-8 p-0 text-xs font-bold rounded-full transition-all cursor-pointer",
                                            isActive
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        {toLocaleNumber(pageNum, langCode)}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage >= lastPage || loading}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="h-8 px-3 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 rounded-full shadow-2xs gap-1 cursor-pointer disabled:opacity-40"
                        >
                            {t("next")} <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Register New Campus Branch / Edit Branch Modal Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl p-0 rounded-2xl overflow-hidden border-none shadow-2xl bg-white">
                    {/* Modal Header Banner */}
                    <DialogHeader className="p-5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 flex flex-row items-center gap-3 space-y-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Building2 className="h-5 w-5" />
                        </span>
                        <div>
                            <DialogTitle className="text-base font-bold text-gray-800 leading-none">
                                {editMode ? t("edit_branch") : t("register_new_campus_branch")}
                            </DialogTitle>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                {t("register_branch_subtitle")}
                            </p>
                        </div>
                    </DialogHeader>

                    <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                        {/* Auto-Generated URL Preview Banner */}
                        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50/60 to-indigo-50/60 border border-indigo-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-[#6366f1] flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-[#FF9800]" />
                                    {t("auto_generated_url_preview")}
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(fullGeneratedUrl);
                                        sonnerToast.success("Branch URL copied!");
                                    }}
                                    className="h-7 text-xs font-bold text-[#6366f1] hover:bg-indigo-100/50 rounded-lg gap-1"
                                >
                                    <Copy className="h-3 w-3" />
                                    <span>{t("copy_url")}</span>
                                </Button>
                            </div>
                            <div className="p-2.5 rounded-lg bg-white border border-indigo-100 font-mono text-xs font-semibold text-gray-800 truncate flex items-center justify-between gap-2 shadow-2xs">
                                <span className="truncate">{fullGeneratedUrl}</span>
                                <a
                                    href={modalLinkHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 text-[#6366f1] hover:underline"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </div>

                        {/* Branch Identity */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("branch_school_name")} <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    value={formData.branch_name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        setFormData((prev) => ({
                                            ...prev,
                                            branch_name: name,
                                            slug: prev.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                                            branch_code: prev.branch_code || `BR-${name.slice(0, 3).toUpperCase()}`,
                                        }));
                                    }}
                                    placeholder="e.g. Uttara Model Campus"
                                    className="h-9 text-xs rounded-lg border-gray-200 focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("branch_code_abbr")}
                                </Label>
                                <Input
                                    value={formData.branch_code}
                                    onChange={(e) =>
                                        setFormData({ ...formData, branch_code: e.target.value.toUpperCase() })
                                    }
                                    placeholder="e.g. BR-UTT"
                                    className="h-9 text-xs rounded-lg uppercase font-mono border-gray-200 focus-visible:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("campus_slogan_tagline")}
                                </Label>
                                <Input
                                    value={formData.school_slogan}
                                    onChange={(e) => setFormData({ ...formData, school_slogan: e.target.value })}
                                    placeholder="e.g. Inspiring Excellence in Every Child"
                                    className="h-9 text-xs rounded-lg border-gray-200 focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("url_slug")}
                                </Label>
                                <Input
                                    value={formData.slug}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                                        })
                                    }
                                    placeholder="e.g. uttara"
                                    className="h-9 text-xs rounded-lg font-mono border-gray-200 focus-visible:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Principal & Contacts */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("principal_branch_head")}
                                </Label>
                                <Input
                                    value={formData.principal_name}
                                    onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                                    placeholder="e.g. Dr. A. Rahman"
                                    className="h-9 text-xs rounded-lg border-gray-200 focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("branch_helpline_phone")}
                                </Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+880 1800-000000"
                                    className="h-9 text-xs rounded-lg border-gray-200 focus-visible:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("branch_email_address")}
                                </Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="uttara@ischool.com"
                                    className="h-9 text-xs rounded-lg border-gray-200 focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("operational_status")}
                                </Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger className="h-9 text-xs rounded-lg border-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active" className="text-xs">
                                            {t("active_operational")}
                                        </SelectItem>
                                        <SelectItem value="inactive" className="text-xs">
                                            {t("inactive_under_setup")}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* ── Branch Logos & Branding Assets Upload Section ── */}
                        <div className="space-y-3 pt-3 border-t border-gray-100">
                            <div>
                                <Label className="text-xs font-bold text-gray-800 flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-[#6366f1]" />
                                    {t("branch_brand_logos_upload")}
                                </Label>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    {t("branch_brand_logos_upload_desc")}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {logoAssetConfigs.map((cfg) => {
                                    const currentVal = (formData as Record<string, string | boolean>)[cfg.key] as string;
                                    const isUploading = uploadingLogoType === cfg.key;
                                    return (
                                        <div
                                            key={cfg.key}
                                            className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex flex-col justify-between space-y-3"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold text-gray-800">
                                                        {cfg.label}
                                                    </Label>
                                                    <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                        {cfg.dim}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 mt-1">
                                                    {cfg.desc}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Logo Preview box */}
                                                <div className="h-14 w-20 rounded-lg border border-gray-200 bg-white flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                                                    {currentVal ? (
                                                        <img
                                                            src={getImageUrl(currentVal)}
                                                            alt={cfg.label}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <div className="text-[10px] text-gray-400 font-semibold text-center leading-tight">
                                                            No Logo
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex-1 flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <label className="flex-1">
                                                            <input
                                                                type="file"
                                                                accept="image/*,.ico"
                                                                className="hidden"
                                                                disabled={isUploading}
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handleFileUpload(cfg.key, file);
                                                                }}
                                                            />
                                                            <div
                                                                className={cn(
                                                                    "h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-gray-700 shadow-2xs",
                                                                    isUploading && "opacity-50 pointer-events-none"
                                                                )}
                                                            >
                                                                {isUploading ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6366f1]" />
                                                                ) : (
                                                                    <Upload className="h-3.5 w-3.5 text-[#6366f1]" />
                                                                )}
                                                                <span>{currentVal ? "Replace" : "Upload"}</span>
                                                            </div>
                                                        </label>

                                                        {currentVal && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteLogo(cfg.key)}
                                                                className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 shrink-0"
                                                                title="Remove Logo"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <Input
                                                        value={currentVal || ""}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, [cfg.key]: e.target.value })
                                                        }
                                                        placeholder="Or enter image URL path..."
                                                        className="h-7 text-[11px] rounded-md font-mono border-gray-200"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Theme & Color */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                <Palette className="h-3.5 w-3.5 text-[#6366f1]" />
                                {t("campus_primary_theme_color")}
                            </Label>
                            <div className="flex items-center gap-3">
                                <Input
                                    type="color"
                                    value={formData.primary_color || "#6366F1"}
                                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                    className="h-9 w-16 p-1 rounded-lg cursor-pointer border-gray-200"
                                />
                                <Input
                                    value={formData.primary_color || "#6366F1"}
                                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                                    className="h-9 text-xs rounded-lg font-mono uppercase max-w-xs border-gray-200"
                                />
                            </div>
                        </div>

                        {/* Campus Address */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">
                                {t("campus_address")}
                            </Label>
                            <Textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Sector 7, Road 14, Uttara, Dhaka-1230"
                                rows={2}
                                className="text-xs rounded-lg resize-none border-gray-200 focus-visible:ring-indigo-500"
                            />
                        </div>

                        {/* Primary Campus Switch */}
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-800">
                                    {t("set_as_primary_campus")}
                                </p>
                                <p className="text-[11px] text-gray-500">
                                    {t("primary_campus_desc")}
                                </p>
                            </div>
                            <Switch
                                checked={formData.is_main}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_main: checked })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-4 px-6 bg-gray-50/80 border-t border-gray-100 flex sm:justify-between items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="h-9 px-5 text-xs font-bold rounded-full border-gray-200 hover:bg-gray-100"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={submitting}
                            className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {editMode ? t("update") : t("save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-gray-900">
                            {t("delete_branch")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500">
                            {t("delete_branch_confirm")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-9 text-xs font-bold rounded-full">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            className="h-9 text-xs font-bold rounded-full bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
