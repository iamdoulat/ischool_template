"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
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
import { Plus, Minus, Pencil, X, ListPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

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
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [openCategory, setOpenCategory] = useState<string>("student");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
            toast("error", t("failed_to_fetch_custom_fields"));
        } finally {
            setLoading(false);
        }
    }, [toast]);

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
            grid: String(field.grid),
            field_values: field.field_values || "",
            is_required: field.is_required,
            visible_on_table: field.visible_on_table,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSave = async () => {
        if (!form.belongs_to || !form.field_type || !form.name.trim()) {
            toast("error", t("please_fill_all_required_fields"));
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
                toast("success", t("custom_field_updated"));
            } else {
                await api.post("/system-setting/custom-fields", payload);
                toast("success", t("custom_field_created"));
            }
            resetForm();
            fetchFields();
        } catch (error) {
            console.error("Failed to save custom field", error);
            toast("error", t("failed_to_save_custom_field"));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/system-setting/custom-fields/${deleteId}`);
            toast("success", t("custom_field_deleted"));
            if (editId === deleteId) resetForm();
            fetchFields();
        } catch (error) {
            console.error("Failed to delete custom field", error);
            toast("error", t("failed_to_delete_custom_field"));
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left: Add/Edit form */}
            <div className="lg:col-span-1">
                <Card className="pt-0 overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <ListPlus className="h-5 w-5" />
                            </span>
                            <div>
                                <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{editId ? t("edit_custom_field") : t("add_custom_field")}</h1>
                                <p className="text-[11px] text-gray-500 mt-1">{t("add_custom_field_subtitle")}</p>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-5 space-y-5">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-600">{t("field_belongs_to")} <span className="text-red-500">*</span></Label>
                            <Select value={form.belongs_to} onValueChange={(v) => setForm({ ...form, belongs_to: v })}>
                                <SelectTrigger className="h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">{t("student")}</SelectItem>
                                    <SelectItem value="staff">{t("staff")}</SelectItem>
                                    <SelectItem value="transfer_certificate">{t("transfer_certificate")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-600">{t("field_type")} <span className="text-red-500">*</span></Label>
                            <Select value={form.field_type} onValueChange={(v) => setForm({ ...form, field_type: v })}>
                                <SelectTrigger className="h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded">
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

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-600">{t("field_name")} <span className="text-red-500">*</span></Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-600">{t("grid_bootstrap_column")}</Label>
                            <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                                <div className="bg-gray-50 px-3 py-2 text-[11px] text-gray-500 border-r border-gray-200">col-md-</div>
                                <Input
                                    type="number"
                                    min={1}
                                    max={12}
                                    value={form.grid}
                                    onChange={(e) => setForm({ ...form, grid: e.target.value })}
                                    className="h-9 text-[11px] border-none shadow-none focus-visible:ring-0 rounded-none w-full"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-600">{t("field_values_separate_by_comma")}</Label>
                            <Textarea
                                value={form.field_values}
                                onChange={(e) => setForm({ ...form, field_values: e.target.value })}
                                className="min-h-[60px] text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y"
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <Label className="text-[11px] font-bold text-gray-600">{t("validation")}</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="required"
                                    checked={form.is_required}
                                    onCheckedChange={(c) => setForm({ ...form, is_required: !!c })}
                                    className="h-4 w-4 border-gray-300 text-indigo-600 data-[state=checked]:bg-indigo-600 rounded-[2px]"
                                />
                                <label htmlFor="required" className="text-[11px] text-gray-600 font-medium cursor-pointer">{t("required")}</label>
                            </div>
                        </div>

                        <div className="space-y-3 pt-1">
                            <Label className="text-[11px] font-bold text-gray-600">{t("visibility")}</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="on_table"
                                    checked={form.visible_on_table}
                                    onCheckedChange={(c) => setForm({ ...form, visible_on_table: !!c })}
                                    className="h-4 w-4 border-gray-300 text-indigo-600 data-[state=checked]:bg-indigo-600 rounded-[2px]"
                                />
                                <label htmlFor="on_table" className="text-[11px] text-gray-600 font-medium cursor-pointer">{t("on_table")}</label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
                            {editId && (
                                <Button
                                    variant="outline"
                                    onClick={resetForm}
                                    className="px-5 h-8 text-[11px] font-bold uppercase rounded"
                                >
                                    {t("cancel")}
                                </Button>
                            )}
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                variant="gradient"
                                className="px-6 h-8 text-[11px] uppercase"
                            >
                                {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                {t("save")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right: List grouped by category */}
            <div className="lg:col-span-2">
                <Card className="pt-0 overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <ListPlus className="h-5 w-5" />
                            </span>
                            <div>
                                <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("custom_fields")}</h1>
                                <p className="text-[11px] text-gray-500 mt-1">{t("custom_fields_subtitle")}</p>
                            </div>
                        </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-12 rounded border border-gray-100 bg-gray-100/50 animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            categories.map((category) => {
                                const isOpen = openCategory === category.id;
                                return (
                                    <div key={category.id} className="border border-gray-200 rounded overflow-hidden">
                                        <div
                                            className="flex justify-between items-center px-4 py-3 bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors"
                                            onClick={() => setOpenCategory(isOpen ? "" : category.id)}
                                        >
                                            <h3 className={cn("text-[12px] font-medium transition-colors", isOpen ? "text-indigo-600" : "text-gray-600")}>
                                                {category.name} <span className="text-gray-400">({category.fields.length})</span>
                                            </h3>
                                            <button className="text-gray-500 hover:text-gray-700">
                                                {isOpen ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                            </button>
                                        </div>

                                        {isOpen && (
                                            <div className="bg-white border-t border-gray-200 p-2">
                                                {category.fields.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {category.fields.map((field) => (
                                                            <div key={field.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 transition-all group">
                                                                <div className="flex items-center gap-2">
                                                                    <Plus className="h-3 w-3 text-gray-400 group-hover:text-gray-600" />
                                                                    <span className="text-[11px] font-medium text-gray-600">{field.name}</span>
                                                                    <span className="text-[10px] text-gray-400 capitalize">({field.field_type})</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 pr-2">
                                                                    <button onClick={() => startEdit(field)} className="text-indigo-400 hover:text-indigo-600 transition-colors" title={t("edit")}>
                                                                        <Pencil className="h-3 w-3" />
                                                                    </button>
                                                                    <button onClick={() => setDeleteId(field.id)} className="text-gray-400 hover:text-red-500 transition-colors" title={t("delete")}>
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-4 text-center text-[10px] text-gray-400 italic">{t("no_custom_fields_found")}</div>
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

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_custom_field")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("delete_custom_field_description")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
