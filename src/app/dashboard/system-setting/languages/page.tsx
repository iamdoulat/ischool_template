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
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search, Loader2, Globe, AlertCircle, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";

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
    const { t, isRtl } = useTranslation();
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Form and Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

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
            if (response.data.success) {
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
            is_rtl: lang.is_rtl,
            is_enabled: lang.is_enabled
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            if (editingLanguage) {
                await api.put(`/system-setting/languages/${editingLanguage.id}`, formData);
            } else {
                await api.post("/system-setting/languages", formData);
            }
            await fetchLanguages();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Failed to save language", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this language?")) return;
        try {
            setDeletingId(id);
            await api.delete(`/system-setting/languages/${id}`);
            setLanguages(prev => prev.filter(lang => lang.id !== id));
        } catch (error) {
            console.error("Failed to delete language", error);
            alert("Cannot delete active language or server error occurred.");
        } finally {
            setDeletingId(null);
        }
    };

    const toggleStatus = async (lang: Language, field: "is_enabled" | "is_rtl" | "is_active") => {
        try {
            const updatedValue = !lang[field];

            // For active, we don't just "toggle", we set to true if it was false
            if (field === "is_active" && lang.is_active) return;

            const payload = { [field]: field === "is_active" ? true : updatedValue };

            await api.put(`/system-setting/languages/${lang.id}`, payload);

            if (field === "is_active") {
                // If we set one as active, others become inactive locally too before re-fetch or just re-fetch
                await fetchLanguages();
            } else {
                setLanguages(prev => prev.map(l => l.id === lang.id ? { ...l, ...payload } : l));
            }
        } catch (error) {
            console.error(`Failed to update ${field}`, error);
        }
    };

    const filteredLanguages = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.short_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">

            {/* Header Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Languages className="h-5 w-5 text-primary" />
                    {t("language_list")}
                </h2>

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
                        className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-5 h-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-md gap-1.5 border-none"
                    >
                        <Plus className="h-3.5 w-3.5" /> {t("add_language")}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-0 overflow-hidden">
                {/* Warning Alert */}
                <div className="bg-orange-50/50 border-b border-orange-100/50 px-4 py-3 flex gap-2.5 items-center">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <p className="text-[11px] text-orange-700/80 font-medium">
                        To change language key phrases, please edit the respective language files in the backend repository.
                    </p>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50 border-b border-gray-100">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase w-12 text-center">#</TableHead>
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase">{t("language")}</TableHead>
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase">{t("short_code")}</TableHead>
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase">{t("country_code")}</TableHead>
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase text-center w-24">{t("active")}</TableHead>
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase text-center w-24">{t("is_rtl")}</TableHead>
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase text-center w-24">{t("status")}</TableHead>
                                <TableHead className="h-10 px-4 text-[11px] font-bold text-gray-600 uppercase text-right w-28">{t("action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                            <p className="text-[11px] text-gray-400 font-medium">Loading languages...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredLanguages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center text-[11px] text-gray-400 font-medium">
                                        No languages found matching your search.
                                    </TableCell>
                                </TableRow>
                            ) : filteredLanguages.map((lang, idx) => (
                                <TableRow key={lang.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors h-14">
                                    <TableCell className="py-2 px-4 text-[11px] text-gray-400 font-bold text-center">
                                        {idx + 1}
                                    </TableCell>
                                    <TableCell className="py-2 px-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold text-[10px] uppercase shadow-sm border border-indigo-100/50">
                                                {lang.short_code.substring(0, 2)}
                                            </div>
                                            <span className="text-[12px] font-semibold text-gray-700">{lang.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-[11px] text-gray-500 font-mono">
                                        {lang.short_code}
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-[11px] text-gray-500 font-mono">
                                        {lang.country_code}
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-center">
                                        <div className="flex justify-center">
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
                                                checked={lang.is_rtl}
                                                onCheckedChange={() => toggleStatus(lang, "is_rtl")}
                                                className="h-4 w-4 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded sm transition-all shadow-sm"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-center">
                                        <div className="flex justify-center">
                                            <Switch
                                                checked={lang.is_enabled}
                                                onCheckedChange={() => toggleStatus(lang, "is_enabled")}
                                                className="data-[state=checked]:bg-emerald-500 scale-90 transition-all shadow-sm"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenEditDialog(lang)}
                                                className="h-8 w-8 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(lang.id)}
                                                disabled={deletingId === lang.id}
                                                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                {deletingId === lang.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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
                <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                    <DialogHeader className="bg-gradient-to-r from-orange-400 to-indigo-500 p-6 text-white text-left">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                            {editingLanguage ? t("edit") : t("add_language")}
                        </DialogTitle>
                        <p className="text-white/80 text-[11px] mt-1 font-medium">Fill in the details below to manage your system language.</p>
                    </DialogHeader>

                    <div className="p-6 space-y-5 bg-white">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{t("name")}</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. English"
                                className="h-10 text-[12px] border-gray-100 bg-gray-50/50 focus:ring-indigo-500 rounded-xl shadow-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{t("short_code")}</Label>
                                <Input
                                    value={formData.short_code}
                                    onChange={(e) => setFormData({ ...formData, short_code: e.target.value })}
                                    placeholder="e.g. en"
                                    className="h-10 text-[12px] border-gray-100 bg-gray-50/50 focus:ring-indigo-500 rounded-xl shadow-none font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{t("country_code")}</Label>
                                <Input
                                    value={formData.country_code}
                                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                                    placeholder="e.g. us"
                                    className="h-10 text-[12px] border-gray-100 bg-gray-50/50 focus:ring-indigo-500 rounded-xl shadow-none font-mono"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                            <div className="space-y-0.5">
                                <Label className="text-[11px] font-bold text-gray-700">{t("is_rtl")}</Label>
                                <p className="text-[9px] text-gray-400 font-medium tracking-tight">Enable if the language reads right to left.</p>
                            </div>
                            <Checkbox
                                checked={formData.is_rtl}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_rtl: !!checked })}
                                className="h-5 w-5 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded-md transition-all sm shadow-sm"
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="flex-1 h-10 text-[11px] font-bold uppercase rounded-xl border-gray-200 hover:bg-white text-gray-500"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || !formData.name || !formData.short_code}
                            className="flex-1 h-10 bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white text-[11px] font-bold uppercase rounded-xl shadow-lg border-none"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {editingLanguage ? t("save") : t("save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
