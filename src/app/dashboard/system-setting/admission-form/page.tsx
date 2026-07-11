// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";

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

interface TableRow {
    id: string;
    cells: string[];
}

interface FeeTable {
    title: string;
    headers: string[];
    rows: TableRow[];
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
    const { t } = useTranslation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [savingFields, setSavingFields] = useState(false);
    const [activeTab, setActiveTab] = useState("form-setting");

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
                            // If not JSON, keep default
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
                            // If not JSON, keep default
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
                toast({ title: t("saved"), description: "Document added successfully" });
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
                toast({ title: t("deleted"), description: "Document deleted successfully" });
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
                toast({ title: t("saved"), description: "Fields visibility updated successfully" });
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

    const filteredFields = fields.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.field_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <Card className="pt-0 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FileText className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("admission_form") || "Admission Form"}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("configure_admission_form_settings_and_fields") || "Configure admission form settings and fields"}</p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-0">
                    <Tabs defaultValue="form-setting" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
                        <div className="px-4 border-b border-gray-100 bg-white">
                            <TabsList className="bg-transparent h-10 p-0 space-x-6">
                                <TabsTrigger
                                    value="form-setting"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-1 pb-2 h-full shadow-none bg-transparent text-[13px]"
                                >
                                    <FileCheck className="h-3.5 w-3.5 mr-1.5 inline" />
                                    {t("admission_form_setting") || "Admission Form Setting"}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="fields-setting"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-1 pb-2 h-full shadow-none bg-transparent text-[13px]"
                                >
                                    <Settings2 className="h-3.5 w-3.5 mr-1.5 inline" />
                                    {t("admission_form_fields_setting") || "Admission Form Fields Setting"}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {loading ? (
                            <FormSkeleton />
                        ) : (
                            <>
                                {/* Tab 1: Admission Form Setting */}
                                <TabsContent value="form-setting" className="flex-1 p-6 space-y-8 animate-in fade-in duration-300">
                                    
                                    {/* Pre-Documents Note Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center">
                                                <FileText className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <h3 className="text-[13px] font-bold text-gray-800 uppercase tracking-wider">{t("pre_documents_note") || "Pre-Documents Note"}</h3>
                                        </div>
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                            <p className="text-[11px] text-gray-500 mb-2">{t("add_note_before_documents_section") || "Add note or rules to be displayed before the Documents Submitted section."}</p>
                                            <textarea
                                                className="w-full min-h-[100px] text-[12px] border border-gray-200 rounded-md p-3 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                                                value={settings.pre_documents_note}
                                                onChange={(e) => setSettings(prev => ({ ...prev, pre_documents_note: e.target.value }))}
                                                placeholder={t("enter_pre_documents_note") || "Enter note or rules here..."}
                                            />
                                        </div>
                                    </div>

                                    {/* Documents Submitted Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center">
                                                <FileText className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <h3 className="text-[13px] font-bold text-gray-800 uppercase tracking-wider">{t("documents_submitted") || "Documents Submitted"}</h3>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
                                            <p className="text-[11px] text-gray-500">{t("add_documents_required_for_admission") || "Add documents required for admission form submission"}</p>
                                            {/* Add new document */}
                                            <div className="flex gap-2">
                                                <Input
                                                    className="h-8 text-[12px] border-gray-200 focus:ring-indigo-500 shadow-none rounded flex-1"
                                                    placeholder={t("enter_document_name") || "Enter document name..."}
                                                    value={newDocName}
                                                    onChange={(e) => setNewDocName(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && handleAddDocument()}
                                                />
                                                <Button
                                                    size="sm"
                                                    className="h-8 bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 rounded shadow-sm text-[11px] font-bold"
                                                    onClick={handleAddDocument}
                                                    disabled={addingDoc || !newDocName.trim()}
                                                >
                                                    {addingDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                                                    {t("add") || "Add"}
                                                </Button>
                                            </div>
                                            {/* Documents list */}
                                            {documents.length > 0 ? (
                                                <div className="space-y-1.5">
                                                    {documents.map((doc, index) => (
                                                        <div key={doc.id || index} className="flex items-center justify-between bg-white rounded-md border border-gray-100 px-3 py-2 group hover:border-indigo-200 transition-colors">
                                                            <div className="flex items-center gap-2.5">
                                                                <GripVertical className="h-3.5 w-3.5 text-gray-300 cursor-grab" />
                                                                <span className={`text-[12px] ${doc.is_active ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                                                                    {doc.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Switch
                                                                    checked={doc.is_active}
                                                                    onCheckedChange={() => handleToggleDocument(doc, index)}
                                                                    className="data-[state=checked]:bg-[#6366f1] scale-75"
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => handleDeleteDocument(doc, index)}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-[11px] text-gray-400">
                                                    {t("no_documents_added_yet") || "No documents added yet. Click + to add required documents."}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Fee Policy Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <h3 className="text-[13px] font-bold text-gray-800 uppercase tracking-wider">{t("fee_policy") || "Fee Policy"}</h3>
                                        </div>

                                        <div className="space-y-6">
                                            {feePolicyTables.map((table, tableIndex) => (
                                                <div key={tableIndex} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                                                    <h4 className="text-[12px] font-bold text-gray-700 mb-2">{table.title}</h4>

                                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="bg-gray-50/80">
                                                                    {table.headers.map((header, idx) => (
                                                                        <TableHead key={idx} className="text-[11px] font-bold text-gray-600 uppercase tracking-wider h-9">
                                                                            {header}
                                                                        </TableHead>
                                                                    ))}
                                                                    <TableHead className="w-10"></TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {table.rows.map((row, rowIndex) => (
                                                                    <TableRow key={`${tableIndex}-${rowIndex}`} className="hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                                        {row.cells.map((cell, cellIndex) => (
                                                                            <TableCell key={cellIndex} className="p-0">
                                                                                <Input
                                                                                    className="h-9 text-[11px] border-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                                                                                    value={cell}
                                                                                    onChange={(e) => updateFeeTableCell(tableIndex, rowIndex, cellIndex, e.target.value)}
                                                                                />
                                                                            </TableCell>
                                                                        ))}
                                                                        <TableCell className="p-0 w-10">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50"
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
                                                        className="h-7 text-[11px] font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                        onClick={() => addFeeTableRow(tableIndex)}
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Add Row
                                                    </Button>

                                                    <div className="mt-3">
                                                        <label className="text-[11px] font-semibold text-gray-600 mb-1.5 block">Note:</label>
                                                        <textarea
                                                            className="w-full min-h-[80px] text-[11px] border border-gray-200 rounded-md p-2.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                                                            value={table.note}
                                                            onChange={(e) => updateFeeTableNote(tableIndex, e.target.value)}
                                                            placeholder="Enter notes..."
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* For Office Use Only Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center">
                                                <Settings2 className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <h3 className="text-[13px] font-bold text-gray-800 uppercase tracking-wider">{t("for_office_use_only") || "For Office Use Only"}</h3>
                                        </div>

                                        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gray-50/80">
                                                            {officeUseTable.headers.map((header, idx) => (
                                                                <TableHead key={idx} className="text-[11px] font-bold text-gray-600 uppercase tracking-wider h-9">
                                                                    {header}
                                                                </TableHead>
                                                            ))}
                                                            <TableHead className="w-10"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {officeUseTable.rows.map((row, rowIndex) => (
                                                            <TableRow key={row.id} className="hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                                {row.cells.map((cell, cellIndex) => (
                                                                    <TableCell key={cellIndex} className="p-0">
                                                                        <Input
                                                                            className="h-9 text-[11px] border-0 rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                                                                            value={cell}
                                                                            onChange={(e) => updateOfficeTableCell(rowIndex, cellIndex, e.target.value)}
                                                                        />
                                                                    </TableCell>
                                                                ))}
                                                                <TableCell className="p-0 w-10">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50"
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
                                                className="h-7 text-[11px] font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                onClick={addOfficeTableRow}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add Row
                                            </Button>

                                            <div className="mt-3">
                                                <label className="text-[11px] font-semibold text-gray-600 mb-1.5 block">Note:</label>
                                                <textarea
                                                    className="w-full min-h-[120px] text-[11px] border border-gray-200 rounded-md p-2.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                                                    value={officeUseTable.note}
                                                    onChange={(e) => updateOfficeTableNote(e.target.value)}
                                                    placeholder="Enter declaration and signature text..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Terms & Conditions Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center">
                                                <FileText className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <h3 className="text-[13px] font-bold text-gray-800 uppercase tracking-wider">{t("terms_and_conditions") || "Terms & Conditions"}</h3>
                                        </div>
                                        <CKEditorWrapper
                                            value={settings.terms_conditions}
                                            onChange={(val) => setSettings(prev => ({ ...prev, terms_conditions: val }))}
                                            placeholder={t("enter_terms_and_conditions") || "Enter terms and conditions..."}
                                        />
                                    </div>

                                    {/* Declaration Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <h3 className="text-[13px] font-bold text-gray-800 uppercase tracking-wider">{t("declaration") || "Declaration"}</h3>
                                        </div>
                                        <CKEditorWrapper
                                            value={settings.declaration}
                                            onChange={(val) => setSettings(prev => ({ ...prev, declaration: val }))}
                                            placeholder={t("enter_declaration") || "Enter declaration text..."}
                                        />
                                    </div>

                                    {/* Save Button */}
                                    <div className="flex justify-end pt-4 border-t border-gray-100">
                                        <Button
                                            className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-9 text-[11px] font-bold uppercase rounded shadow-md"
                                            onClick={handleSaveSettings}
                                            disabled={savingSettings}
                                        >
                                            {savingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                                            {t("save") || "Save"}
                                        </Button>
                                    </div>
                                </TabsContent>

                                {/* Tab 2: Admission Form Fields Setting */}
                                <TabsContent value="fields-setting" className="flex-1 animate-in fade-in duration-300">
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-[13px] font-bold text-gray-800 uppercase tracking-wider">{t("form_fields_visibility") || "Form Fields Visibility"}</h3>
                                                <p className="text-[11px] text-gray-500 mt-1">{t("toggle_fields_on_off_in_admission_form") || "Toggle fields on/off in the admission form"}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    className="h-8 text-[12px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-56"
                                                    placeholder={t("search_fields") || "Search fields..."}
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-gray-50/80">
                                                        <TableHead className="text-[11px] font-bold text-gray-600 uppercase tracking-wider h-9">#</TableHead>
                                                        <TableHead className="text-[11px] font-bold text-gray-600 uppercase tracking-wider h-9">{t("field_name") || "Field Name"}</TableHead>
                                                        <TableHead className="text-[11px] font-bold text-gray-600 uppercase tracking-wider h-9">{t("column_name") || "Column Name"}</TableHead>
                                                        <TableHead className="text-[11px] font-bold text-gray-600 uppercase tracking-wider h-9 text-center">{t("status") || "Status"}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredFields.length > 0 ? (
                                                        filteredFields.map((field, index) => (
                                                            <TableRow key={field.id} className="hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                                <TableCell className="text-[11px] text-gray-500 w-10">{index + 1}</TableCell>
                                                                <TableCell className="text-[12px] font-medium text-gray-700">{field.name}</TableCell>
                                                                <TableCell className="text-[11px] text-gray-500 font-mono">{field.field_name}</TableCell>
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
                                                            <TableCell colSpan={4} className="text-center py-8 text-[12px] text-gray-400">
                                                                {t("no_fields_found") || "No fields found"}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        {/* Save Button */}
                                        <div className="flex justify-end pt-4">
                                            <Button
                                                className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-9 text-[11px] font-bold uppercase rounded shadow-md"
                                                onClick={handleSaveFields}
                                                disabled={savingFields}
                                            >
                                                {savingFields ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                                                {t("save") || "Save"}
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>
                            </>
                        )}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
