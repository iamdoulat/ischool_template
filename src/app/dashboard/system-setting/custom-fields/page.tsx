"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Pencil, Trash2, ListPlus, Loader2, AlertCircle, Layers } from "lucide-react";
import { cn, toLocaleNumber } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";

interface CustomField {
    id: number;
    belongs_to: string;
    field_type: string;
    name: string;
    grid: number;
    field_values: string | null;
    is_required: boolean;
    visible_on_table: boolean;
}

interface Category {
    id: string;
    name: string;
    fields: CustomField[];
}

const emptyForm = {
    belongs_to: "",
    field_type: "",
    name: "",
    grid: "12",
    field_values: "",
    is_required: false,
    visible_on_table: false,
};

export default function CustomFieldsPage() {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const [categories, setCategories] = useState<Category[]>([]);
    const [openCategory, setOpenCategory] = useState<string>("student");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editId, setEditId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const fetchFields = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/system-setting/custom-fields");
            setCategories(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch custom fields", error);
            toast.error(t("failed_to_fetch_custom_fields"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchFields();
    }, [fetchFields]);

    const resetForm = () => {
        setForm(emptyForm);
        setEditId(null);
    };

    const startEdit = (field: CustomField) => {
        setEditId(field.id);
        setForm({
            belongs_to: field.belongs_to,
            field_type: field.field_type,
            name: field.name,
            grid: String(field.grid || 12),
            field_values: field.field_values || "",
            is_required: !!field.is_required,
            visible_on_table: !!field.visible_on_table,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSave = async () => {
        if (!form.belongs_to || !form.field_type || !form.name.trim()) {
            toast.error(t("please_fill_all_required_fields"));
            return;
        }
        try {
            setSaving(true);
            const payload = {
                belongs_to: form.belongs_to,
                field_type: form.field_type,
                name: form.name.trim(),
                grid: Number(form.grid) || 12,
                field_values: form.field_values || null,
                is_required: form.is_required,
                visible_on_table: form.visible_on_table,
            };
            if (editId) {
                await api.put(`/system-setting/custom-fields/${editId}`, payload);
                toast.success(t("custom_field_updated"));
            } else {
                await api.post("/system-setting/custom-fields", payload);
                toast.success(t("custom_field_created"));
            }
            resetForm();
            fetchFields();
        } catch (error) {
            console.error("Failed to save custom field", error);
            toast.error(t("failed_to_save_custom_field"));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            setDeleting(true);
            await api.delete(`/system-setting/custom-fields/${deleteId}`);
            toast.success(t("custom_field_deleted"));
            if (editId === deleteId) resetForm();
            fetchFields();
        } catch (error) {
            console.error("Failed to delete custom field", error);
            toast.error(t("failed_to_delete_custom_field"));
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const translateCategoryName = (name: string) => {
        const lower = (name || "").toLowerCase().trim();
        if (lower === "student") return t("student");
        if (lower === "staff") return t("staff");
        if (lower === "transfer_certificate" || lower === "transfer certificate") return t("transfer_certificate");
        return name;
    };

    const translateFieldType = (type: string) => {
        const lower = (type || "").toLowerCase().trim();
        if (lower === "input") return t("input");
        if (lower === "textarea") return t("textarea");
        if (lower === "select") return t("select");
        if (lower === "checkbox") return t("checkbox");
        if (lower === "date" || lower === "date_picker") return t("date_picker");
        return type;
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Page Header Banner (Mandatory Rule) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <ListPlus className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("custom_fields")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("custom_fields_subtitle")}
                        </p>
                    </div>
                </div>
            </div>

            {/* 1/3 and 2/3 Responsive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left: Add/Edit form (1/3) */}
                <div className="lg:col-span-1">
                    <Card className="rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                                <ListPlus className="h-4 w-4" />
                            </span>
                            <div>
                                <h2 className="text-[13px] font-bold text-gray-800 leading-tight">
                                    {editId ? t("edit_custom_field") : t("add_custom_field")}
                                </h2>
                                <p className="text-[10px] text-gray-500">
                                    {t("add_custom_field_subtitle")}
                                </p>
                            </div>
                        </div>

                        <CardContent className="p-5 space-y-4">
                            {/* Belongs To */}
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-600">
                                    {t("field_belongs_to")} <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={form.belongs_to}
                                    onValueChange={(v) => setForm({ ...form, belongs_to: v })}
                                >
                                    <SelectTrigger className="h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded-lg">
                                        <SelectValue placeholder={t("select")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">{t("student")}</SelectItem>
                                        <SelectItem value="staff">{t("staff")}</SelectItem>
                                        <SelectItem value="transfer_certificate">{t("transfer_certificate")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Field Type */}
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-600">
                                    {t("field_type")} <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={form.field_type}
                                    onValueChange={(v) => setForm({ ...form, field_type: v })}
                                >
                                    <SelectTrigger className="h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded-lg">
                                        <SelectValue placeholder={t("select")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="input">{t("input")}</SelectItem>
                                        <SelectItem value="textarea">{t("textarea")}</SelectItem>
                                        <SelectItem value="select">{t("select")}</SelectItem>
                                        <SelectItem value="checkbox">{t("checkbox")}</SelectItem>
                                        <SelectItem value="date">{t("date_picker")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Field Name */}
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-600">
                                    {t("field_name")} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder={t("enter_field_name")}
                                    className="h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded-lg"
                                />
                            </div>

                            {/* Grid bootstrap column */}
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-600">
                                    {t("grid_bootstrap_column")}
                                </Label>
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">
                                    <div className="px-3 py-2 text-[11px] font-mono text-gray-500 border-r border-gray-200 bg-gray-100/50">
                                        col-md-
                                    </div>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={form.grid}
                                        onChange={(e) => setForm({ ...form, grid: e.target.value })}
                                        className="h-9 text-[11px] border-none shadow-none focus-visible:ring-0 rounded-none w-full bg-white"
                                    />
                                </div>
                            </div>

                            {/* Field values */}
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-600">
                                    {t("field_values_separate_by_comma")}
                                </Label>
                                <Textarea
                                    value={form.field_values}
                                    onChange={(e) => setForm({ ...form, field_values: e.target.value })}
                                    placeholder="Option 1, Option 2, Option 3..."
                                    className="min-h-[64px] text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded-lg resize-y"
                                />
                            </div>

                            {/* Validation and Visibility Checkboxes */}
                            <div className="p-3 bg-gray-50/70 rounded-lg border border-gray-100 space-y-3">
                                <div>
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        {t("validation")}
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="required"
                                            checked={form.is_required}
                                            onCheckedChange={(c) => setForm({ ...form, is_required: !!c })}
                                            className="h-4 w-4 border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded transition-all shadow-xs"
                                        />
                                        <label htmlFor="required" className="text-[11px] text-gray-700 font-medium cursor-pointer">
                                            {t("required")}
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-200/60">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                        {t("visibility")}
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="on_table"
                                            checked={form.visible_on_table}
                                            onCheckedChange={(c) => setForm({ ...form, visible_on_table: !!c })}
                                            className="h-4 w-4 border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded transition-all shadow-xs"
                                        />
                                        <label htmlFor="on_table" className="text-[11px] text-gray-700 font-medium cursor-pointer">
                                            {t("on_table")}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end items-center gap-2 pt-2 border-t border-gray-100">
                                {editId && (
                                    <Button
                                        variant="outline"
                                        onClick={resetForm}
                                        className="h-9 px-4 text-[11px] font-bold uppercase rounded-lg border-gray-200 hover:bg-white text-gray-600"
                                    >
                                        {t("cancel")}
                                    </Button>
                                )}
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-9 px-6 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white text-[11px] font-bold uppercase rounded-lg shadow-sm border-none active:scale-95"
                                >
                                    {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                                    {t("save")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: List grouped by category (2/3) */}
                <div className="lg:col-span-2">
                    <Card className="rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                                    <Layers className="h-4 w-4" />
                                </span>
                                <div>
                                    <h2 className="text-[13px] font-bold text-gray-800 leading-tight">
                                        {t("custom_field_list")}
                                    </h2>
                                    <p className="text-[10px] text-gray-500">
                                        {t("custom_fields_subtitle")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-4 space-y-3">
                            {loading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-12 rounded-lg border border-gray-100 bg-gray-100/50 animate-pulse" />
                                    ))}
                                </div>
                            ) : categories.length === 0 ? (
                                <div className="p-8 text-center text-[12px] text-gray-400 font-medium">
                                    {t("no_custom_fields_found")}
                                </div>
                            ) : (
                                categories.map((category) => {
                                    const isOpen = openCategory === category.id;
                                    const fieldCount = category.fields?.length || 0;
                                    return (
                                        <div
                                            key={category.id}
                                            className="border border-gray-200 rounded-lg overflow-hidden transition-all shadow-xs"
                                        >
                                            <div
                                                className={cn(
                                                    "flex justify-between items-center px-4 py-3 cursor-pointer transition-colors select-none",
                                                    isOpen ? "bg-indigo-50/40 border-b border-gray-200" : "bg-gray-50/60 hover:bg-gray-100/60"
                                                )}
                                                onClick={() => setOpenCategory(isOpen ? "" : category.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <h3 className={cn(
                                                        "text-[12px] font-bold transition-colors",
                                                        isOpen ? "text-indigo-700" : "text-gray-700"
                                                    )}>
                                                        {translateCategoryName(category.name)}
                                                    </h3>
                                                    <span className="text-[11px] font-medium text-gray-400">
                                                        ({toLocaleNumber(fieldCount, language?.short_code)})
                                                    </span>
                                                </div>
                                                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white border border-gray-200 text-gray-500 shadow-xs">
                                                    {isOpen ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                                </span>
                                            </div>

                                            {isOpen && (
                                                <div className="bg-white p-2.5">
                                                    {fieldCount > 0 ? (
                                                        <div className="space-y-1.5">
                                                            {category.fields.map((field) => (
                                                                <div
                                                                    key={field.id}
                                                                    className="flex justify-between items-center p-2.5 hover:bg-gray-50 rounded-lg border border-gray-100 transition-all group"
                                                                >
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                                        <span className="text-[12px] font-semibold text-gray-700">
                                                                            {field.name}
                                                                        </span>
                                                                        <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                                                                            {translateFieldType(field.field_type)}
                                                                        </span>
                                                                        {field.is_required ? (
                                                                            <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded">
                                                                                {t("required")}
                                                                            </span>
                                                                        ) : null}
                                                                        {field.visible_on_table ? (
                                                                            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                                                                                {t("on_table")}
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => startEdit(field)}
                                                                            className="h-7 w-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xs active:scale-95 transition-all"
                                                                            title={t("edit")}
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => setDeleteId(field.id)}
                                                                            className="h-7 w-7 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-xs active:scale-95 transition-all"
                                                                            title={t("delete")}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 text-center text-[11px] text-gray-400 italic font-medium">
                                                            {t("no_custom_fields_found")}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-xl max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                            {t("delete_custom_field")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500 leading-relaxed">
                            {t("delete_custom_field_description")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0 mt-3">
                        <AlertDialogCancel className="h-8 text-xs font-semibold rounded-lg">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
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
