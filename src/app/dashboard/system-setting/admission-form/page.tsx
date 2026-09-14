// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { cn, toLocaleNumber } from "@/lib/utils";

const CKEditorWrapper = dynamic(() => import("@/components/ui/ckeditor"), { ssr: false });
import {
    Loader2,
    FileText,
    Plus,
    Trash2,
    GripVertical,
    Save,
    CheckCircle2,
    FileCheck,
    Settings2,
    Search,
    CreditCard,
    Building,
    FileSignature
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface DocumentItem {
    id?: number;
    name: string;
    is_active: boolean;
    sort_order?: number;
}

interface FieldItem {
    id: number;
    name: string;
    field_name: string;
    is_active: boolean;
}

interface TableRowData {
    id: string;
    cells: string[];
}

interface FeeTable {
    title: string;
    headers: string[];
    rows: TableRowData[];
    note: string;
}

function FormSkeleton() {
    return (
        <div className="space-y-6 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-24 w-full rounded" />
                </div>
            ))}
        </div>
    );
}

// Default Fee Policy Tables
const DEFAULT_FEE_POLICY_TABLES: FeeTable[] = [
    {
        title: "Academic Fee Schedule",
        headers: ["Particulars", "Payable"],
        rows: [
            { id: "1", cells: ["Admission Fee", "At the time of admission"] },
            { id: "2", cells: ["Caution Deposit", "At the time of admission"] },
            { id: "3", cells: ["Term 1", "At the time of admission"] },
            { id: "4", cells: ["Term 2", "On or before 10th July"] },
            { id: "5", cells: ["Term 3", "On or before 10th Oct."] },
            { id: "6", cells: ["Term 4", "On or before 10th Jan."] },
        ],
        note: "1. All monetary dues related to academic & transport should be cleared on or before the due dates failing which the school management is authorized to impose a penalty per student.\n2. Payment must be made at school premise either in the form of cheque or cash",
    },
    {
        title: "Transport Fee Schedule",
        headers: ["Particulars", "Payable"],
        rows: [
            { id: "1", cells: ["1st Installment (April - Oct.)", "On or before 10th April"] },
            { id: "2", cells: ["2nd Installment (Nov. - Mar.)", "On or before 10th Nov."] },
        ],
        note: "Note: Pupil opting for school transportation should clear the dues in 2 installments.",
    },
];

const DEFAULT_OFFICE_USE_TABLE_STRUCTURED = {
    headers: ["Particulars", "Amount", "Receipt No.", "Mode of Payment", "Date of Payment", "Remarks"],
    rows: [
        { id: "1", cells: ["Admission Fee", "", "", "", "", ""] },
        { id: "2", cells: ["Caution Deposit", "", "", "", "", ""] },
        { id: "3", cells: ["Term 1", "", "", "", "", ""] },
        { id: "4", cells: ["Term 2", "", "", "", "", ""] },
        { id: "5", cells: ["Term 3", "", "", "", "", ""] },
        { id: "6", cells: ["Term 4", "", "", "", "", ""] },
        { id: "7", cells: ["Total Applicable Fee", "", "", "", "", ""] },
    ],
    note: "I ............................................., father of/ mother of/ guardian of ............................................., have applied for admission of my ward into class ........................ . I have read and accept the Terms & Conditions / Declaration of the school.\n\nChoose the relevant options if you wish to avail of transport facility:\nDo you need transport facility:   Yes ☐     No ☐\n\n\nParent's Signature ...............................     Counsellor's Signature .......................     Principal's Signature ..............................."
};

export default function AdmissionFormPage() {
    const { t, language } = useTranslation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [savingFields, setSavingFields] = useState(false);
    const [activeTab, setActiveTab] = useState<"form-setting" | "fields-setting">("form-setting");

    // Settings state
    const [settings, setSettings] = useState({
        fee_policy: "",
        office_use_only: "",
        terms_conditions: "",
        declaration: "",
        pre_documents_note: "",
    });

    // Fee Policy Tables
    const [feePolicyTables, setFeePolicyTables] = useState<FeeTable[]>(DEFAULT_FEE_POLICY_TABLES);

    // Office Use Only Table
    const [officeUseTable, setOfficeUseTable] = useState(DEFAULT_OFFICE_USE_TABLE_STRUCTURED);

    // Documents state
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [newDocName, setNewDocName] = useState("");
    const [addingDoc, setAddingDoc] = useState(false);

    // Fields state
    const [fields, setFields] = useState<FieldItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/system-setting/admission-form");
            if (response.data.success) {
                const { settings: s, documents: docs, fields: f } = response.data.data;
                if (s) {
                    setSettings({
                        fee_policy: s.fee_policy || "",
                        office_use_only: s.office_use_only || "",
                        terms_conditions: s.terms_conditions || "",
                        declaration: s.declaration || "",
                        pre_documents_note: s.pre_documents_note || "",
                    });

                    // Parse fee_policy JSON if exists
                    if (s.fee_policy) {
                        try {
                            const parsed = JSON.parse(s.fee_policy);
                            if (Array.isArray(parsed)) {
                                setFeePolicyTables(parsed);
                            }
                        } catch (e) {
                            setFeePolicyTables(DEFAULT_FEE_POLICY_TABLES);
                        }
                    }

                    // Parse office_use_only JSON if exists
                    if (s.office_use_only) {
                        try {
                            const parsed = JSON.parse(s.office_use_only);
                            if (parsed.headers && parsed.rows) {
                                setOfficeUseTable(parsed);
                            }
                        } catch (e) {
                            setOfficeUseTable(DEFAULT_OFFICE_USE_TABLE_STRUCTURED);
                        }
                    }
                }
                if (docs) setDocuments(docs);
                if (f) setFields(f);
            }
        } catch (error) {
            console.error("Error fetching admission form settings:", error);
            toast({ variant: "destructive", title: t("error"), description: t("failed_to_load") });
        } finally {
            setLoading(false);
        }
    }, [toast, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Save settings
    const handleSaveSettings = async () => {
        try {
            setSavingSettings(true);
            const response = await api.post("/system-setting/admission-form/settings", {
                fee_policy: JSON.stringify(feePolicyTables),
                office_use_only: JSON.stringify(officeUseTable),
                terms_conditions: settings.terms_conditions,
                declaration: settings.declaration,
                pre_documents_note: settings.pre_documents_note,
            });
            if (response.data.success) {
                toast({ title: t("saved"), description: t("settings_updated_successfully") || "Settings updated successfully" });
            }
        } catch (error: any) {
            console.error("Save settings error:", error);
            toast({ variant: "destructive", title: t("error"), description: error?.response?.data?.message || t("failed_to_save") });
        } finally {
            setSavingSettings(false);
        }
    };

    // Fee Policy Table Handlers
    const addFeeTableRow = (tableIndex: number) => {
        setFeePolicyTables(prev => {
            const updated = [...prev];
            const table = updated[tableIndex];
            const newId = String(Date.now());
            table.rows.push({ id: newId, cells: table.headers.map(() => "") });
            return updated;
        });
    };

    const updateFeeTableCell = (tableIndex: number, rowIndex: number, cellIndex: number, value: string) => {
        setFeePolicyTables(prev => {
            const updated = [...prev];
            updated[tableIndex].rows[rowIndex].cells[cellIndex] = value;
            return updated;
        });
    };

    const updateFeeTableNote = (tableIndex: number, value: string) => {
        setFeePolicyTables(prev => {
            const updated = [...prev];
            updated[tableIndex].note = value;
            return updated;
        });
    };

    const removeFeeTableRow = (tableIndex: number, rowIndex: number) => {
        setFeePolicyTables(prev => {
            const updated = [...prev];
            updated[tableIndex].rows.splice(rowIndex, 1);
            return updated;
        });
    };

    // Office Use Table Handlers
    const addOfficeTableRow = () => {
        setOfficeUseTable(prev => ({
            ...prev,
            rows: [...prev.rows, { id: String(Date.now()), cells: prev.headers.map(() => "") }],
        }));
    };

    const updateOfficeTableCell = (rowIndex: number, cellIndex: number, value: string) => {
        setOfficeUseTable(prev => {
            const updated = { ...prev };
            updated.rows[rowIndex].cells[cellIndex] = value;
            return updated;
        });
    };

    const updateOfficeTableNote = (value: string) => {
        setOfficeUseTable(prev => ({ ...prev, note: value }));
    };

    const removeOfficeTableRow = (rowIndex: number) => {
        setOfficeUseTable(prev => ({
            ...prev,
            rows: prev.rows.filter((_, i) => i !== rowIndex),
        }));
    };

    // Add document
    const handleAddDocument = async () => {
        if (!newDocName.trim()) return;
        try {
            setAddingDoc(true);
            const response = await api.post("/system-setting/admission-form/documents", { name: newDocName.trim() });
            if (response.data.success) {
                setDocuments(prev => [...prev, response.data.data]);
                setNewDocName("");
                toast({ title: t("saved"), description: t("document_added_successfully") || "Document added successfully" });
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: t("error"), description: error?.response?.data?.message || t("failed_to_save") });
        } finally {
            setAddingDoc(false);
        }
    };

    // Toggle document active status
    const handleToggleDocument = async (doc: DocumentItem, index: number) => {
        if (!doc.id) return;
        try {
            const response = await api.put(`/system-setting/admission-form/documents/${doc.id}`, {
                is_active: !doc.is_active,
            });
            if (response.data.success) {
                setDocuments(prev => prev.map((d, i) => i === index ? { ...d, is_active: !d.is_active } : d));
            }
        } catch (error) {
            console.error("Toggle document error:", error);
        }
    };

    // Delete document
    const handleDeleteDocument = async (doc: DocumentItem, index: number) => {
        if (!doc.id) return;
        try {
            const response = await api.delete(`/system-setting/admission-form/documents/${doc.id}`);
            if (response.data.success) {
                setDocuments(prev => prev.filter((_, i) => i !== index));
                toast({ title: t("deleted"), description: t("document_deleted_successfully") || "Document deleted successfully" });
            }
        } catch (error) {
            console.error("Delete document error:", error);
        }
    };

    // Save fields
    const handleSaveFields = async () => {
        try {
            setSavingFields(true);
            const response = await api.post("/system-setting/admission-form/fields", {
                fields: fields.map(f => ({ id: f.id, is_active: f.is_active })),
            });
            if (response.data.success) {
                toast({ title: t("saved"), description: t("fields_visibility_updated") || "Fields visibility updated successfully" });
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: t("error"), description: error?.response?.data?.message || t("failed_to_save") });
        } finally {
            setSavingFields(false);
        }
    };

    // Toggle field
    const toggleField = (id: number) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, is_active: !f.is_active } : f));
    };

    // Translation helpers
    const getFieldDisplayName = (field: FieldItem) => {
        if (!field) return "";
        if (field.field_name) {
            const byField = t(field.field_name);
            if (byField && byField !== field.field_name) return byField;
        }
        const key = field.name.toLowerCase().replace(/[\s\/\-]+/g, "_");
        const byKey = t(key);
        if (byKey && byKey !== key) return byKey;
        return field.name;
    };

    const getHeaderTranslation = (header: string) => {
        const lower = header.toLowerCase().replace(/[\s\/\.\-]+/g, "_").trim();
        if (lower === "particulars") return t("particulars") || header;
        if (lower === "payable") return t("payable") || header;
        if (lower === "amount") return t("amount") || header;
        if (lower === "receipt_no") return t("receipt_no") || header;
        if (lower === "mode_of_payment") return t("mode_of_payment") || header;
        if (lower === "date_of_payment") return t("date_of_payment") || header;
        if (lower === "remarks") return t("remarks") || header;
        const translated = t(lower);
        if (translated && translated !== lower) return translated;
        return header;
    };

    const getTableTitleTranslation = (title: string) => {
        if (title.includes("Academic Fee")) return t("academic_fee_schedule") || title;
        if (title.includes("Transport Fee")) return t("transport_fee_schedule") || title;
        return title;
    };

    const filteredFields = fields.filter(f => {
        const transName = getFieldDisplayName(f);
        return f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="p-4 md:p-6 space-y-6 bg-gray-50/30 min-h-screen font-sans">
            {/* Standalone Edge-to-Edge Page Header Banner per AGENTS.md rule */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F3F4FE] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <FileText className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none">{t("admission_form")}</h1>
                        <p className="text-xs text-gray-500 mt-1">{t("configure_admission_form_settings_and_fields")}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {activeTab === "form-setting" ? (
                        <Button
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-6 h-9 text-xs font-bold uppercase rounded-full shadow-md active:scale-95 transition-all"
                            onClick={handleSaveSettings}
                            disabled={savingSettings || loading}
                        >
                            {savingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                            {t("save")}
                        </Button>
                    ) : (
                        <Button
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-6 h-9 text-xs font-bold uppercase rounded-full shadow-md active:scale-95 transition-all"
                            onClick={handleSaveFields}
                            disabled={savingFields || loading}
                        >
                            {savingFields ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                            {t("save")}
                        </Button>
                    )}
                </div>
            </div>

            {/* High-Contrast Segmented Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-gray-100/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 w-full sm:w-fit overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setActiveTab("form-setting")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer",
                        activeTab === "form-setting"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-white/80 dark:hover:bg-gray-700/80"
                    )}
                >
                    <FileCheck className="h-3.5 w-3.5" />
                    <span>{t("admission_form_setting")}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("fields-setting")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer",
                        activeTab === "fields-setting"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-white/80 dark:hover:bg-gray-700/80"
                    )}
                >
                    <Settings2 className="h-3.5 w-3.5" />
                    <span>{t("admission_form_fields_setting")}</span>
                    <span className={cn(
                        "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                        activeTab === "fields-setting" ? "bg-white/30 text-white" : "bg-gray-200 text-gray-700"
                    )}>
                        {toLocaleNumber(fields.length, language?.short_code)}
                    </span>
                </button>
            </div>

            {loading ? (
                <Card className="border-gray-200 shadow-sm bg-white">
                    <FormSkeleton />
                </Card>
            ) : (
                <>
                    {/* Tab 1: Admission Form Setting */}
                    {activeTab === "form-setting" && (
                        <div className="space-y-6 animate-in fade-in-50 duration-200">
                            {/* Pre-Documents Note Section */}
                            <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
                                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2.5">
                                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center text-white shadow-xs">
                                        <FileText className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{t("pre_documents_note")}</h3>
                                        <p className="text-[11px] text-gray-500 mt-0.5">{t("add_note_before_documents_section")}</p>
                                    </div>
                                </div>
                                <CardContent className="p-5">
                                    <textarea
                                        className="w-full min-h-[100px] text-xs border border-gray-200 rounded-lg p-3 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-y leading-relaxed font-sans"
                                        value={settings.pre_documents_note}
                                        onChange={(e) => setSettings(prev => ({ ...prev, pre_documents_note: e.target.value }))}
                                        placeholder={t("enter_pre_documents_note")}
                                    />
                                </CardContent>
                            </Card>

                            {/* Documents Submitted Section */}
                            <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
                                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2.5">
                                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center text-white shadow-xs">
                                        <FileCheck className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{t("documents_submitted")}</h3>
                                        <p className="text-[11px] text-gray-500 mt-0.5">{t("add_documents_required_for_admission")}</p>
                                    </div>
                                </div>
                                <CardContent className="p-5 space-y-4">
                                    {/* Add new document */}
                                    <div className="flex gap-2">
                                        <Input
                                            className="h-9 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded-lg flex-1"
                                            placeholder={t("enter_document_name")}
                                            value={newDocName}
                                            onChange={(e) => setNewDocName(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleAddDocument()}
                                        />
                                        <Button
                                            size="sm"
                                            className="h-9 bg-[#6366f1] hover:bg-[#5558dd] text-white px-5 rounded-lg shadow-sm text-xs font-bold gap-1"
                                            onClick={handleAddDocument}
                                            disabled={addingDoc || !newDocName.trim()}
                                        >
                                            {addingDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                                            {t("add") || "Add"}
                                        </Button>
                                    </div>

                                    {/* Documents list */}
                                    {documents.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                            {documents.map((doc, index) => (
                                                <div key={doc.id || index} className="flex items-center justify-between bg-gray-50/60 rounded-xl border border-gray-200/80 px-3.5 py-2.5 group hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <GripVertical className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                        <span className={cn(
                                                            "text-xs font-semibold truncate",
                                                            doc.is_active ? "text-gray-800" : "text-gray-400 line-through"
                                                        )}>
                                                            {doc.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Switch
                                                            checked={doc.is_active}
                                                            onCheckedChange={() => handleToggleDocument(doc, index)}
                                                            className="data-[state=checked]:bg-[#6366f1] scale-75"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            onClick={() => handleDeleteDocument(doc, index)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-xs text-gray-400 italic">
                                            {t("no_documents_added_yet")}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Fee Policy Section */}
                            <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
                                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2.5">
                                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center text-white shadow-xs">
                                        <CreditCard className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{t("fee_policy")}</h3>
                                    </div>
                                </div>
                                <CardContent className="p-5 space-y-6">
                                    {feePolicyTables.map((table, tableIndex) => (
                                        <div key={tableIndex} className="bg-gray-50/40 rounded-xl border border-gray-200 p-4 space-y-3">
                                            <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                                                <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                                                {getTableTitleTranslation(table.title)}
                                            </h4>

                                            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-50/80">
                                                            {table.headers.map((header, idx) => (
                                                                <TableHead key={idx} className="text-[11px] font-bold text-gray-600 uppercase tracking-wider h-9">
                                                                    {getHeaderTranslation(header)}
                                                                </TableHead>
                                                            ))}
                                                            <TableHead className="w-10"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {table.rows.map((row, rowIndex) => (
                                                            <TableRow key={`${tableIndex}-${rowIndex}`} className="hover:bg-indigo-50/40 transition-colors">
                                                                {row.cells.map((cell, cellIndex) => (
                                                                    <TableCell key={cellIndex} className="p-1">
                                                                        <Input
                                                                            className="h-8 text-xs border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 bg-white"
                                                                            value={cell}
                                                                            onChange={(e) => updateFeeTableCell(tableIndex, rowIndex, cellIndex, e.target.value)}
                                                                        />
                                                                    </TableCell>
                                                                ))}
                                                                <TableCell className="p-1 w-10 text-center">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                                        onClick={() => removeFeeTableRow(tableIndex, rowIndex)}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                onClick={() => addFeeTableRow(tableIndex)}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                {t("add_row")}
                                            </Button>

                                            <div className="pt-2">
                                                <label className="text-[11px] font-bold text-gray-600 mb-1 block">{t("note") || "Note"}:</label>
                                                <textarea
                                                    className="w-full min-h-[75px] text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 resize-y leading-relaxed bg-white"
                                                    value={table.note}
                                                    onChange={(e) => updateFeeTableNote(tableIndex, e.target.value)}
                                                    placeholder={t("enter_notes")}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* For Office Use Only Section */}
                            <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
                                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2.5">
                                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center text-white shadow-xs">
                                        <Building className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{t("for_office_use_only")}</h3>
                                    </div>
                                </div>

                                <CardContent className="p-5 space-y-4">
                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50/80">
                                                    {officeUseTable.headers.map((header, idx) => (
                                                        <TableHead key={idx} className="text-[11px] font-bold text-gray-600 uppercase tracking-wider h-9">
                                                            {getHeaderTranslation(header)}
                                                        </TableHead>
                                                    ))}
                                                    <TableHead className="w-10"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {officeUseTable.rows.map((row, rowIndex) => (
                                                    <TableRow key={row.id} className="hover:bg-indigo-50/40 transition-colors">
                                                        {row.cells.map((cell, cellIndex) => (
                                                            <TableCell key={cellIndex} className="p-1">
                                                                <Input
                                                                    className="h-8 text-xs border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 bg-white"
                                                                    value={cell}
                                                                    onChange={(e) => updateOfficeTableCell(rowIndex, cellIndex, e.target.value)}
                                                                />
                                                            </TableCell>
                                                        ))}
                                                        <TableCell className="p-1 w-10 text-center">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                                onClick={() => removeOfficeTableRow(rowIndex)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                        onClick={addOfficeTableRow}
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        {t("add_row")}
                                    </Button>

                                    <div className="pt-2">
                                        <label className="text-[11px] font-bold text-gray-600 mb-1 block">{t("note") || "Note"}:</label>
                                        <textarea
                                            className="w-full min-h-[100px] text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 resize-y leading-relaxed bg-white"
                                            value={officeUseTable.note}
                                            onChange={(e) => updateOfficeTableNote(e.target.value)}
                                            placeholder={t("enter_declaration_signature")}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Terms & Conditions Section */}
                            <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
                                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2.5">
                                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center text-white shadow-xs">
                                        <FileText className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{t("terms_and_conditions")}</h3>
                                    </div>
                                </div>
                                <CardContent className="p-5">
                                    <CKEditorWrapper
                                        value={settings.terms_conditions}
                                        onChange={(val) => setSettings(prev => ({ ...prev, terms_conditions: val }))}
                                        placeholder={t("enter_terms_and_conditions")}
                                    />
                                </CardContent>
                            </Card>

                            {/* Declaration Section */}
                            <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
                                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2.5">
                                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center text-white shadow-xs">
                                        <FileSignature className="h-3.5 w-3.5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{t("declaration")}</h3>
                                    </div>
                                </div>
                                <CardContent className="p-5">
                                    <CKEditorWrapper
                                        value={settings.declaration}
                                        onChange={(val) => setSettings(prev => ({ ...prev, declaration: val }))}
                                        placeholder={t("enter_declaration")}
                                    />
                                </CardContent>
                            </Card>

                            {/* Save Button */}
                            <div className="flex justify-end pt-2">
                                <Button
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-8 h-9 text-xs font-bold uppercase rounded-full shadow-md active:scale-95"
                                    onClick={handleSaveSettings}
                                    disabled={savingSettings}
                                >
                                    {savingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                                    {t("save")}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Admission Form Fields Setting */}
                    {activeTab === "fields-setting" && (
                        <div className="space-y-4 animate-in fade-in-50 duration-200">
                            <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{t("form_fields_visibility")}</h3>
                                            <p className="text-[11px] text-gray-500 mt-0.5">{t("toggle_fields_on_off_in_admission_form")}</p>
                                        </div>
                                        <div className="relative w-full sm:w-64">
                                            <Input
                                                className="h-8 pl-9 text-xs border-gray-200 focus:ring-indigo-500 rounded-lg"
                                                placeholder={t("search_fields")}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50/80">
                                                    <TableHead className="text-[11px] font-bold text-gray-600 uppercase tracking-wider h-9 w-14">#</TableHead>
                                                    <TableHead className="text-[11px] font-bold text-gray-600 uppercase tracking-wider h-9">{t("field_name")}</TableHead>
                                                    <TableHead className="text-[11px] font-bold text-gray-600 uppercase tracking-wider h-9">{t("column_name")}</TableHead>
                                                    <TableHead className="text-[11px] font-bold text-gray-600 uppercase tracking-wider h-9 text-center w-24">{t("status")}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredFields.length > 0 ? (
                                                    filteredFields.map((field, index) => (
                                                        <TableRow key={field.id} className="hover:bg-indigo-50/40 transition-colors">
                                                            <TableCell className="text-xs text-gray-500 font-bold">
                                                                {toLocaleNumber(index + 1, language?.short_code)}
                                                            </TableCell>
                                                            <TableCell className="text-xs font-semibold text-gray-800">
                                                                {getFieldDisplayName(field)}
                                                            </TableCell>
                                                            <TableCell className="text-xs text-gray-500 font-mono">
                                                                {field.field_name}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex justify-center">
                                                                    <Switch
                                                                        checked={field.is_active}
                                                                        onCheckedChange={() => toggleField(field.id)}
                                                                        className="data-[state=checked]:bg-[#6366f1] scale-75"
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-8 text-xs text-gray-400 italic">
                                                            {t("no_fields_found")}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Save Button */}
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-8 h-9 text-xs font-bold uppercase rounded-full shadow-md active:scale-95"
                                            onClick={handleSaveFields}
                                            disabled={savingFields}
                                        >
                                            {savingFields ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                                            {t("save")}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
