"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
    DialogFooter
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
import { Plus, Pencil, Trash2, Search, Loader2, AlertCircle, Languages } from "lucide-react";
import { cn, toLocaleNumber, translateLanguageName } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "sonner";

interface Language {
    id: number;
    name: string;
    short_code: string;
    country_code: string;
    is_rtl: boolean;
    is_active: boolean;
    is_enabled: boolean;
}

export default function LanguagesPage() {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Form and Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
    const [saving, setSaving] = useState(false);

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Form fields
    const [formData, setFormData] = useState({
        name: "",
        short_code: "",
        country_code: "",
        is_rtl: false,
        is_enabled: true
    });

    useEffect(() => {
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        try {
            setLoading(true);
            const response = await api.get("/system-setting/languages");
            if (response.data?.success && Array.isArray(response.data.data)) {
                setLanguages(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch languages", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddDialog = () => {
        setEditingLanguage(null);
        setFormData({
            name: "",
            short_code: "",
            country_code: "",
            is_rtl: false,
            is_enabled: true
        });
        setIsDialogOpen(true);
    };

    const handleOpenEditDialog = (lang: Language) => {
        setEditingLanguage(lang);
        setFormData({
            name: lang.name,
            short_code: lang.short_code,
            country_code: lang.country_code,
            is_rtl: !!lang.is_rtl,
            is_enabled: !!lang.is_enabled
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.short_code.trim()) return;
        try {
            setSaving(true);
            if (editingLanguage) {
                await api.put(`/system-setting/languages/${editingLanguage.id}`, formData);
            } else {
                await api.post("/system-setting/languages", formData);
            }
            toast.success(t("language_saved_successfully"));
            await fetchLanguages();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Failed to save language", error);
            toast.error(t("failed_to_save") || "Failed to save language");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        try {
            setDeleting(true);
            await api.delete(`/system-setting/languages/${deleteId}`);
            setLanguages(prev => prev.filter(lang => lang.id !== deleteId));
            toast.success(t("language_deleted_successfully"));
            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error("Failed to delete language", error);
            toast.error(t("cannot_delete_active_language"));
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const toggleStatus = async (lang: Language, field: "is_enabled" | "is_rtl" | "is_active") => {
        try {
            const updatedValue = !lang[field];

            // For active, we don't toggle off, we set to true
            if (field === "is_active" && lang.is_active) return;

            const payload = { [field]: field === "is_active" ? true : updatedValue };

            await api.put(`/system-setting/languages/${lang.id}`, payload);

            if (field === "is_active") {
                toast.success(t("active_language_changed"));
                await fetchLanguages();
            } else {
                toast.success(t("language_status_updated"));
                setLanguages(prev => prev.map(l => l.id === lang.id ? { ...l, ...payload } : l));
            }
        } catch (error) {
            console.error(`Failed to update ${field}`, error);
            toast.error(t("failed_to_update_status") || "Failed to update status");
        }
    };

    const filteredLanguages = languages.filter(lang =>
        (lang.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lang.short_code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lang.country_code || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Page Header Banner (Mandatory Rule) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Languages className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("language_list")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("manage_system_languages_and_translations")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                            placeholder={t("search_languages")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 h-8 text-[11px] border-gray-200 focus:ring-indigo-500 rounded shadow-none"
                        />
                    </div>
                    <Button
                        onClick={handleOpenAddDialog}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-4 h-8 text-[11px] font-bold uppercase transition-all rounded-lg shadow-sm gap-1.5 border-none active:scale-95"
                    >
                        <Plus className="h-3.5 w-3.5" /> {t("add_language")}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-0 overflow-hidden">
                {/* Warning Alert */}
                <div className="bg-orange-50/50 border-b border-orange-100/50 px-4 py-3 flex gap-2.5 items-center">
                    <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                    <p className="text-[11px] text-orange-700/80 font-medium">
                        {t("change_language_key_phrases_notice")}
                    </p>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50 border-b border-gray-100">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase w-14 text-center">
                                    {t("sl_no")}
                                </TableHead>
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase">
                                    {t("language_name")}
                                </TableHead>
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase">
                                    {t("short_code")}
                                </TableHead>
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase">
                                    {t("country_code")}
                                </TableHead>
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase text-center w-24">
                                    {t("active")}
                                </TableHead>
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase text-center w-28">
                                    {t("is_rtl")}
                                </TableHead>
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase text-center w-24">
                                    {t("status")}
                                </TableHead>
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase text-right w-24">
                                    {t("action")}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={`sk-${i}`} className="border-b border-gray-50 h-14">
                                        {Array.from({ length: 8 }).map((_, j) => (
                                             <TableCell key={j} className="py-2 px-4">
                                                <div className="h-3 rounded bg-gray-200/60 animate-pulse" style={{ width: `${45 + ((i * 5 + j * 9) % 40)}%` }} />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filteredLanguages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center text-[11px] text-gray-400 font-medium">
                                        {t("no_languages_found")}
                                    </TableCell>
                                </TableRow>
                            ) : filteredLanguages.map((lang, idx) => (
                                <TableRow key={lang.id} className="border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-xs relative transition-all duration-200 h-14">
                                    <TableCell className="py-2 px-4 text-[11px] text-gray-400 font-bold text-center">
                                        {toLocaleNumber(idx + 1, language?.short_code)}
                                    </TableCell>
                                    <TableCell className="py-2 px-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px] uppercase shadow-xs border border-indigo-100/50">
                                                {lang.short_code ? lang.short_code.substring(0, 2) : "--"}
                                            </div>
                                            <span className="text-[12px] font-semibold text-gray-700">
                                                {translateLanguageName(lang.name, language?.short_code) || lang.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-[11px] text-gray-500 font-mono font-medium">
                                        {lang.short_code}
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-[11px] text-gray-500 font-mono font-medium uppercase">
                                        {lang.country_code || "-"}
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-center">
                                        <div className="flex justify-center" title={t("set_as_default_language")}>
                                            <RadioGroup
                                                value={lang.is_active ? "active" : ""}
                                                onValueChange={() => toggleStatus(lang, "is_active")}
                                            >
                                                <RadioGroupItem
                                                    value="active"
                                                    className={cn(
                                                        "h-4 w-4 border-gray-300 transition-all cursor-pointer",
                                                        lang.is_active ? "border-indigo-500 text-indigo-500" : ""
                                                    )}
                                                />
                                            </RadioGroup>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-center">
                                        <div className="flex justify-center">
                                            <Checkbox
                                                checked={!!lang.is_rtl}
                                                onCheckedChange={() => toggleStatus(lang, "is_rtl")}
                                                className="h-4 w-4 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded transition-all shadow-xs"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-center">
                                        <div className="flex justify-center">
                                            <Switch
                                                checked={!!lang.is_enabled}
                                                onCheckedChange={() => toggleStatus(lang, "is_enabled")}
                                                className="data-[state=checked]:bg-emerald-500 scale-90 transition-all shadow-xs"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-right">
                                        <div className="flex justify-end items-center gap-1.5">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenEditDialog(lang)}
                                                className="h-7 w-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xs active:scale-95 transition-all"
                                                title={t("edit")}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(lang.id)}
                                                className="h-7 w-7 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-xs active:scale-95 transition-all"
                                                title={t("delete")}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Add / Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl rounded-xl">
                    <DialogHeader className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] p-5 text-white text-left">
                        <DialogTitle className="text-base font-bold uppercase tracking-tight flex items-center gap-2">
                            <Languages className="h-5 w-5" />
                            {editingLanguage ? t("edit_language") : t("add_language")}
                        </DialogTitle>
                        <p className="text-white/80 text-[11px] mt-1 font-medium">
                            {t("fill_details_manage_system_language")}
                        </p>
                    </DialogHeader>

                    <div className="p-5 space-y-4 bg-white">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider pl-0.5">
                                {t("language_name")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t("enter_language_name")}
                                className="h-9 text-[12px] border-gray-200 bg-gray-50/50 focus:ring-indigo-500 rounded-lg shadow-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider pl-0.5">
                                    {t("short_code")} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.short_code}
                                    onChange={(e) => setFormData({ ...formData, short_code: e.target.value })}
                                    placeholder={t("eg_short_code")}
                                    className="h-9 text-[12px] border-gray-200 bg-gray-50/50 focus:ring-indigo-500 rounded-lg shadow-none font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider pl-0.5">
                                    {t("country_code")}
                                </Label>
                                <Input
                                    value={formData.country_code}
                                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                                    placeholder={t("eg_country_code")}
                                    className="h-9 text-[12px] border-gray-200 bg-gray-50/50 focus:ring-indigo-500 rounded-lg shadow-none font-mono uppercase"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50/80 rounded-lg border border-gray-100">
                            <div className="space-y-0.5">
                                <Label className="text-[11px] font-bold text-gray-700">{t("is_rtl")}</Label>
                                <p className="text-[10px] text-gray-400 font-medium">
                                    {t("enable_rtl_description")}
                                </p>
                            </div>
                            <Checkbox
                                checked={formData.is_rtl}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_rtl: !!checked })}
                                className="h-5 w-5 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded transition-all shadow-xs"
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-gray-50/70 border-t border-gray-100 flex gap-2.5">
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="flex-1 h-9 text-[11px] font-bold uppercase rounded-lg border-gray-200 hover:bg-white text-gray-600"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || !formData.name.trim() || !formData.short_code.trim()}
                            className="flex-1 h-9 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white text-[11px] font-bold uppercase rounded-lg shadow-sm border-none active:scale-95"
                        >
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                            {t("save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-xl max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                            {t("delete_language")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500 leading-relaxed">
                            {t("delete_language_confirmation")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0 mt-3">
                        <AlertDialogCancel className="h-8 text-xs font-semibold rounded-lg">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={deleting}
                            className="h-8 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg active:scale-95"
                        >
                            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
