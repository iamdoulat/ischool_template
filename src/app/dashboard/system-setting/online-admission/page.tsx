"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    CloudUpload,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Loader2
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useCurrency } from "@/components/providers/currency-provider";
import api from "@/lib/api";
import { useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/toast";


// Initial field structure
const initialFields = [
    { id: 1, name: "Last Name", active: true },
    { id: 2, name: "Category", active: true },
    { id: 3, name: "Religion", active: true },
    { id: 4, name: "Caste", active: true },
    { id: 5, name: "Mobile Number", active: true },
    { id: 6, name: "Email", active: true },
    { id: 7, name: "Student Photo", active: true },
    { id: 8, name: "House", active: true },
    { id: 9, name: "Blood Group", active: true },
    { id: 10, name: "Height", active: true },
    { id: 11, name: "Weight", active: true },
    { id: 12, name: "Measurement Date", active: true },
    { id: 13, name: "Father Name", active: true },
    { id: 14, name: "Father Phone", active: true },
    { id: 15, name: "Father Occupation", active: true },
    { id: 16, name: "Father Photo", active: true },
    { id: 17, name: "Mother Name", active: true },
    { id: 18, name: "Mother Phone", active: true },
    { id: 19, name: "Mother Occupation", active: true },
    { id: 20, name: "Mother Photo", active: true },
    { id: 21, name: "If Guardian Is", active: true },
    { id: 22, name: "Guardian Name", active: true },
    { id: 23, name: "Guardian Relation", active: true },
];

export default function OnlineAdmissionPage() {
    const { selectedCurrency } = useCurrency();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState("form-setting");
    const [fields, setFields] = useState(initialFields);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [savingFields, setSavingFields] = useState(false);
    const instructionsTextareaRef = useRef<HTMLTextAreaElement>(null);
    const termsTextareaRef = useRef<HTMLTextAreaElement>(null);

    // State for Form Settings
    const [settings, setSettings] = useState({
        online_admission: true,
        online_admission_payment_option: true,
        online_admission_form_fees: "100.00",
        instructions: "General Instruction:- These instructions pertain to online application for admission to Smart School...",
        terms_conditions: "General Terms & Conditions for Students:- 1. The User declares that the content of the Portal shall be accessed...",
        admission_form_file: null as File | null,
        admission_form_file_name: "",
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/system-setting/online-admission");
            if (response.data.success) {
                const { settings: fetchedSettings, fields: fetchedFields } = response.data.data;
                if (fetchedSettings) {
                    setSettings({
                        online_admission: Boolean(fetchedSettings.online_admission),
                        online_admission_payment_option: Boolean(fetchedSettings.online_admission_payment_option),
                        online_admission_form_fees: fetchedSettings.online_admission_form_fees,
                        instructions: fetchedSettings.instructions || "",
                        terms_conditions: fetchedSettings.terms_conditions || "",
                        admission_form_file: null,
                        admission_form_file_name: fetchedSettings.admission_form_file_name || "",
                    });
                }
                if (fetchedFields && fetchedFields.length > 0) {
                    setFields(fetchedFields.map((f: { id: number; name: string; is_active: boolean }) => ({
                        id: f.id,
                        name: f.name,
                        active: Boolean(f.is_active)
                    })));
                }
            }
        } catch (error) {
            console.error("Error fetching online admission settings:", error);
            toast("error", "Failed to load settings. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const validateSettings = () => {
        if (!settings.online_admission_form_fees || isNaN(parseFloat(settings.online_admission_form_fees))) {
            toast("error", "Please enter a valid numeric value for form fees.");
            return false;
        }
        if (parseFloat(settings.online_admission_form_fees) < 0) {
            toast("error", "Form fees cannot be negative.");
            return false;
        }
        if (!settings.instructions.trim()) {
            toast("error", "Instructions are required.");
            return false;
        }
        if (!settings.terms_conditions.trim()) {
            toast("error", "Terms & conditions are required.");
            return false;
        }
        return true;
    };

    const handleSaveSettings = async () => {
        if (!validateSettings()) {
            return;
        }

        if (!confirm("Are you sure you want to save the form settings?")) {
            return;
        }
        try {
            setSavingSettings(true);

            const formData = new FormData();
            formData.append('online_admission', settings.online_admission.toString());
            formData.append('online_admission_payment_option', settings.online_admission_payment_option.toString());
            formData.append('online_admission_form_fees', settings.online_admission_form_fees);
            formData.append('instructions', settings.instructions);
            formData.append('terms_conditions', settings.terms_conditions);

            if (settings.admission_form_file) {
                formData.append('admission_form_file', settings.admission_form_file);
            }

            const response = await api.post("/system-setting/online-admission/settings", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                toast("success", "Form settings updated successfully.");
                // Clear the file after successful upload
                setSettings(prev => ({
                    ...prev,
                    admission_form_file: null
                }));
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        } catch (error: unknown) {
            console.error("Save settings error:", error);
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update form settings.";
            toast("error", errorMessage);
        } finally {
            setSavingSettings(false);
        }
    };

    const handleSaveFields = async () => {
        if (!confirm("Are you sure you want to update the fields visibility settings?")) {
            return;
        }

        try {
            setSavingFields(true);
            const response = await api.post("/system-setting/online-admission/fields", {
                fields: fields.map(f => ({ id: f.id, is_active: f.active }))
            });
            if (response.data.success) {
                toast("success", "Fields visibility updated successfully.");
            } else {
                toast("error", response.data.message || "Failed to update fields visibility.");
            }
        } catch (error: unknown) {
            console.error("Save fields error:", error);
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update fields visibility.";
            toast("error", errorMessage);
        } finally {
            setSavingFields(false);
        }
    };

    const toggleField = (id: number) => {
        setFields(prev => prev.map(item =>
            item.id === id ? { ...item, active: !item.active } : item
        ));
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type (PDF, DOC, DOCX)
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                toast("error", "Please select a PDF or Word document file.");
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast("error", "File size must be less than 10MB.");
                return;
            }

            setSettings(prev => ({
                ...prev,
                admission_form_file: file,
                admission_form_file_name: file.name
            }));
        }
    };

    const handleFileUpload = () => {
        fileInputRef.current?.click();
    };

    const removeFile = () => {
        setSettings(prev => ({
            ...prev,
            admission_form_file: null,
            admission_form_file_name: ""
        }));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const formatText = (command: string, textareaRef: React.RefObject<HTMLTextAreaElement>) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        let formattedText = selectedText;
        let newStart = start;
        let newEnd = end;

        switch (command) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                newStart += 2;
                newEnd += 2;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                newStart += 1;
                newEnd += 1;
                break;
            case 'underline':
                formattedText = `<u>${selectedText}</u>`;
                newStart += 3;
                newEnd += 3;
                break;
            case 'align-left':
                // For simplicity, we'll just add markdown-style alignment
                formattedText = selectedText; // Keep as is for now
                break;
            case 'align-center':
                formattedText = `<center>${selectedText}</center>`;
                newStart += 8;
                newEnd += 8;
                break;
            case 'align-right':
                formattedText = `<div style="text-align: right">${selectedText}</div>`;
                newStart += 31;
                newEnd += 31;
                break;
            case 'list':
                formattedText = `• ${selectedText}`;
                newStart += 2;
                newEnd += 2;
                break;
            case 'list-ordered':
                formattedText = `1. ${selectedText}`;
                newStart += 3;
                newEnd += 3;
                break;
        }

        const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
        textarea.value = newValue;
        textarea.setSelectionRange(newStart, newEnd);
        textarea.focus();

        // Update the state
        if (textareaRef === instructionsTextareaRef) {
            setSettings(prev => ({ ...prev, instructions: newValue }));
        } else if (textareaRef === termsTextareaRef) {
            setSettings(prev => ({ ...prev, terms_conditions: newValue }));
        }
    };

    const handleExport = (type: 'copy' | 'csv' | 'pdf' | 'print') => {
        const data = fields.map(f => ({ Name: f.name, Status: f.active ? 'Active' : 'Inactive' }));

        if (type === 'copy') {
            const text = data.map(row => `${row.Name}\t${row.Status}`).join('\n');
            navigator.clipboard.writeText(text);
            toast("success", "Table data copied to clipboard.");
        } else if (type === 'csv') {
            const headers = "Name,Status\n";
            const rows = data.map(row => `${row.Name},${row.Status}`).join('\n');
            const blob = new Blob([headers + rows], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `online_admission_fields.csv`;
            a.click();
        } else if (type === 'pdf' || type === 'print') {
            window.print();
        }
    };

    const filteredFields = fields.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans space-y-4">

            {/* Page Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">

                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-50">
                    <h1 className="text-[14px] font-medium text-gray-700">Online Admission</h1>
                </div>

                <Tabs defaultValue="form-setting" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
                    <div className="px-4 border-b border-gray-100">
                        <TabsList className="bg-transparent h-10 p-0 space-x-6">
                            <TabsTrigger
                                value="form-setting"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-1 pb-2 h-full shadow-none bg-transparent text-[13px]"
                            >
                                Online Admission Form Setting
                            </TabsTrigger>
                            <TabsTrigger
                                value="fields-setting"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-1 pb-2 h-full shadow-none bg-transparent text-[13px]"
                            >
                                Online Admission Fields Setting
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Tab 1: Form Setting */}
                    <TabsContent value="form-setting" className="flex-1 p-6 space-y-8 animate-in fade-in duration-300">
                        <div className="space-y-6">
                            {/* Basic Toggles */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 max-w-4xl">
                                <div className="flex items-center justify-between">
                                    <label className="text-[12px] font-bold text-gray-700">Online Admission</label>
                                    <Switch
                                        checked={settings.online_admission}
                                        onCheckedChange={(val) => setSettings({ ...settings, online_admission: val })}
                                        className="data-[state=checked]:bg-[#6366f1] scale-90"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-[12px] font-bold text-gray-700">Online Admission Payment Option</label>
                                    <Switch
                                        checked={settings.online_admission_payment_option}
                                        onCheckedChange={(val) => setSettings({ ...settings, online_admission_payment_option: val })}
                                        className="data-[state=checked]:bg-[#6366f1] scale-90"
                                    />
                                </div>

                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-[12px] font-bold text-gray-700">Online Admission Form Fees ({selectedCurrency?.symbol || '$'})</label>
                                    <Input
                                        className="h-8 text-[12px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full"
                                        value={settings.online_admission_form_fees}
                                        onChange={(e) => setSettings({ ...settings, online_admission_form_fees: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[12px] font-bold text-gray-700">Upload Admission Application Form</label>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg h-8 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleFileUpload}>
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <CloudUpload className="h-3 w-3" />
                                                    <span className="text-[10px] font-medium">
                                                        {settings.admission_form_file_name ? settings.admission_form_file_name : "Drag and drop a file here or click"}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button size="icon" className="h-8 w-8 bg-[#6366f1] hover:bg-[#5558dd] rounded shadow-sm" onClick={handleFileUpload}>
                                                <CloudUpload className="h-3.5 w-3.5 text-white" />
                                            </Button>
                                        </div>
                                        {settings.admission_form_file_name && (
                                            <div className="flex items-center gap-2 text-[10px] text-gray-600">
                                                <span>Current file: {settings.admission_form_file_name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={removeFile}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <p className="text-[9px] text-gray-400">Accepted formats: PDF, DOC, DOCX (Max 10MB)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions Editor */}
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-gray-700">Online Admission Instructions</label>
                                <div className="border border-gray-200 rounded-md overflow-hidden">
                                    {/* Editor Toolbar */}
                                    <div className="bg-gray-50 p-1 flex items-center gap-1 border-b border-gray-200 flex-wrap">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('bold', instructionsTextareaRef)}><Bold className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('italic', instructionsTextareaRef)}><Italic className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('underline', instructionsTextareaRef)}><Underline className="h-3 w-3" /></Button>
                                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('align-left', instructionsTextareaRef)}><AlignLeft className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('align-center', instructionsTextareaRef)}><AlignCenter className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('align-right', instructionsTextareaRef)}><AlignRight className="h-3 w-3" /></Button>
                                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('list', instructionsTextareaRef)}><List className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('list-ordered', instructionsTextareaRef)}><ListOrdered className="h-3 w-3" /></Button>
                                    </div>
                                    <Textarea
                                        ref={instructionsTextareaRef}
                                        className="min-h-[100px] border-none focus-visible:ring-0 text-[11px] p-3 resize-y rounded-none shadow-none"
                                        placeholder="Enter instructions here..."
                                        value={settings.instructions}
                                        onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Terms & Conditions Editor */}
                            <div className="space-y-2">
                                <label className="text-[12px] font-bold text-gray-700">Terms & Conditions</label>
                                <div className="border border-gray-200 rounded-md overflow-hidden">
                                    {/* Editor Toolbar */}
                                    <div className="bg-gray-50 p-1 flex items-center gap-1 border-b border-gray-200 flex-wrap">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('bold', termsTextareaRef)}><Bold className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('italic', termsTextareaRef)}><Italic className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('underline', termsTextareaRef)}><Underline className="h-3 w-3" /></Button>
                                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('align-left', termsTextareaRef)}><AlignLeft className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('align-center', termsTextareaRef)}><AlignCenter className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('align-right', termsTextareaRef)}><AlignRight className="h-3 w-3" /></Button>
                                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('list', termsTextareaRef)}><List className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => formatText('list-ordered', termsTextareaRef)}><ListOrdered className="h-3 w-3" /></Button>
                                    </div>
                                    <Textarea
                                        ref={termsTextareaRef}
                                        className="min-h-[100px] border-none focus-visible:ring-0 text-[11px] p-3 resize-y rounded-none shadow-none"
                                        placeholder="Enter terms here..."
                                        value={settings.terms_conditions}
                                        onChange={(e) => setSettings({ ...settings, terms_conditions: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-50">
                                <Button
                                    onClick={handleSaveSettings}
                                    disabled={savingSettings}
                                    className="bg-gradient-to-r from-[#FF8C42] to-[#6D5BFE] hover:opacity-90 text-white px-8 h-9 text-[12px] font-bold uppercase transition-all rounded-full shadow-lg border-none min-w-[120px]"
                                >
                                    {savingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Save
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Fields Setting */}
                    <TabsContent value="fields-setting" className="mt-0 flex-1 flex flex-col">
                        {/* Toolbar */}
                        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-white border-b border-gray-50/50">
                            <div className="relative w-full md:w-56">
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-8 text-[12px] pl-3 border-gray-200 shadow-none rounded bg-white focus:bg-white transition-colors placeholder:text-gray-400"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Select defaultValue="50">
                                        <SelectTrigger className="h-7 w-14 text-[11px] border-gray-200 shadow-none rounded bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button onClick={() => handleExport('copy')} variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Copy className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('csv')} variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('pdf')} variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><FileText className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={() => handleExport('print')} variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Printer className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Columns className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 p-4 bg-white overflow-auto">
                            <div className="border border-gray-100 rounded overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-gray-50/40">
                                        <TableRow className="border-b border-gray-100 hover:bg-transparent text-[11px]">
                                            <TableHead className="h-10 px-4 font-bold text-gray-600 text-[11px] uppercase w-full cursor-pointer hover:text-indigo-600 transition-colors group">
                                                <div className="flex items-center gap-1">Name <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" /></div>
                                            </TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600 text-[11px] uppercase text-right w-24">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredFields.map((item) => (
                                            <TableRow key={item.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors h-11 group">
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-600 font-medium">{item.name}</TableCell>
                                                <TableCell className="py-2 px-4 text-right">
                                                    <div className="flex justify-end">
                                                        <Switch
                                                            checked={item.active}
                                                            onCheckedChange={() => toggleField(item.id)}
                                                            className="data-[state=checked]:bg-[#6366f1] scale-90 transition-all"
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredFields.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-24 text-center text-[12px] text-gray-400">
                                                    No matching records found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Save Button for Fields */}
                            <div className="flex justify-end pt-4 mt-4 border-t border-gray-50">
                                <Button
                                    onClick={handleSaveFields}
                                    disabled={savingFields}
                                    className="bg-gradient-to-r from-[#FF8C42] to-[#6D5BFE] hover:opacity-90 text-white px-8 h-9 text-[12px] font-bold uppercase transition-all rounded-full shadow-lg border-none min-w-[120px]"
                                >
                                    {savingFields ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Save
                                </Button>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between pt-4">
                                <p className="text-[10px] text-gray-500 font-medium">
                                    Showing 1 to {filteredFields.length} of {fields.length} entries
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50" disabled>
                                        <ChevronLeft className="h-3 w-3" />
                                    </Button>
                                    <Button className="h-7 w-7 p-0 text-[10px] font-bold bg-gradient-to-r from-[#FF8C42] to-[#6D5BFE] text-white border-none hover:opacity-90 aspect-square rounded-md shadow-sm">1</Button>
                                    <Button variant="outline" size="icon" className="h-7 w-7 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50" disabled>
                                        <ChevronRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}
