"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
    Plus, 
    Trash2, 
    Printer,
    Download,
    ArrowLeft, 
    CheckCircle2, 
    Loader2, 
    Calendar, 
    User, 
    GraduationCap,
    Tag
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import { useSettings } from "@/components/providers/settings-provider";
import { useImageUrl } from "@/lib/image-url";

interface ClassItem { id: number; name: string; }
interface SectionItem { id: number; name: string; }
interface StudentItem { id: number; name: string; last_name?: string; admission_no?: string; school_class_id?: number; section_id?: number; school_class?: { name: string }; section?: { name: string }; [key: string]: unknown; }

interface InvoiceItem {
    id: string;
    description: string;
    qty: number;
    amount: number;
}

function GenerateInvoiceContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedStudentId = searchParams.get("student_id") || "";
    const editId = searchParams.get("edit_id") || "";
    const feeId = searchParams.get("fee_id") || editId;
    const autoPdf = searchParams.get("auto_pdf") === "true";

    const { symbol } = useCurrencyFormatter();
    const { toast } = useToast();
    const { settings } = useSettings();
    const getImageUrl = useImageUrl();

    const invoiceCardRef = useRef<HTMLDivElement>(null);

    // Dropdown & Student Selection states
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [students, setStudents] = useState<StudentItem[]>([]);
    
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId);
    const [studentData, setStudentData] = useState<StudentItem | null>(null);
    const [fetchingStudents, setFetchingStudents] = useState(false);

    // Print Settings state (Invoice Tab from print-header-footer)
    const [printSetting, setPrintSetting] = useState<{ header_image_url?: string; footer_content?: string; paper_size?: string } | null>(null);

    // Invoice Form states
    const [invoiceNo] = useState(() => editId ? `INV-EDIT-${editId}` : `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 15);
        return d.toISOString().split('T')[0];
    });

    const [items, setItems] = useState<InvoiceItem[]>([
        { id: "1", description: "Tuition Fee", qty: 1, amount: 0 }
    ]);
    const [discount, setDiscount] = useState<number | string>(0);
    const [notes, setNotes] = useState("Please pay on or before the due date to avoid late payment fine.");
    const [submitting, setSubmitting] = useState(false);
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const [isPdfExporting, setIsPdfExporting] = useState(false);

    // Direct PDF File Download Handler
    const handleDownloadPdf = useCallback(async () => {
        if (!invoiceCardRef.current) return;
        setPdfGenerating(true);
        setIsPdfExporting(true);

        // Allow React state update to flush DOM before html2canvas capture
        await new Promise((resolve) => setTimeout(resolve, 150));

        try {
            const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
                import("jspdf"),
                import("html2canvas-pro"),
            ]);

            const element = invoiceCardRef.current;

            // Proxy images if needed for CORS/local assets
            const images = Array.from(element.querySelectorAll('img'));
            const originalSrcs = new Map<HTMLImageElement, string>();

            for (const img of images) {
                const src = img.src || '';
                if (src && (src.includes(':8000') || src.includes('localhost') || src.includes('127.0.0.1'))) {
                    try {
                        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
                        const res = await fetch(proxyUrl);
                        if (res.ok) {
                            const blob = await res.blob();
                            const base64 = await new Promise<string>((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result as string);
                                reader.onerror = reject;
                                reader.readAsDataURL(blob);
                            });
                            originalSrcs.set(img, src);
                            img.src = base64;
                            await img.decode().catch(() => {});
                        }
                    } catch {
                        // ignore proxy errors
                    }
                }
            }

            const canvas = await html2canvas(element, { 
                scale: 2, 
                useCORS: true, 
                logging: false,
                allowTaint: true,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `
                        * {
                            box-sizing: border-box !important;
                        }
                        .pdf-header-banner {
                            background-color: #000000 !important;
                            color: #ffffff !important;
                            text-align: center !important;
                            padding: 10px 0 !important;
                            width: 100% !important;
                        }
                        .pdf-4col-row {
                            display: flex !important;
                            flex-direction: row !important;
                            width: 100% !important;
                            gap: 12px !important;
                        }
                        .pdf-col-card {
                            width: 25% !important;
                            flex: 1 1 0% !important;
                            padding: 14px !important;
                            border-radius: 10px !important;
                            background-color: #ffffff !important;
                            border: 1px solid #e2e8f0 !important;
                        }
                    `;
                    clonedDoc.head.appendChild(style);
                }
            });

            // Restore original image sources
            for (const [img, src] of originalSrcs.entries()) {
                img.src = src;
            }

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            
            const studentNameSlug = studentData?.name ? studentData.name.replace(/\s+/g, '_') : 'Student';
            pdf.save(`${invoiceNo}_${studentNameSlug}.pdf`);

            toast("success", "Invoice PDF downloaded successfully!");
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast("error", "Failed to download PDF invoice");
        } finally {
            setIsPdfExporting(false);
            setPdfGenerating(false);
        }
    }, [invoiceNo, studentData?.name, toast]);

    // Fetch Print Settings for Invoice Tab
    const fetchPrintSettings = useCallback(async () => {
        try {
            const res = await api.get("system-setting/print-settings");
            if (res.data?.status === "success" && Array.isArray(res.data.data)) {
                const invoiceSet = res.data.data.find((item: { type: string }) => item.type === "Invoice") 
                                 || res.data.data.find((item: { type: string }) => item.type === "Fees Receipt");
                if (invoiceSet) {
                    setPrintSetting(invoiceSet);
                    if (invoiceSet.footer_content) {
                        setNotes(invoiceSet.footer_content);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load print settings:", error);
        }
    }, []);

    useEffect(() => {
        fetchPrintSettings();
    }, [fetchPrintSettings]);

    // Fetch existing manual invoice details for editing / auto PDF download
    useEffect(() => {
        if (feeId) {
            api.get(`/fee-collection/manual-invoice/${feeId}`).then(res => {
                const data = res.data.data || res.data;
                if (data) {
                    if (data.student_id) setSelectedStudentId(data.student_id.toString());
                    if (data.student) setStudentData(data.student);
                    if (data.due_date) setDueDate(new Date(data.due_date).toISOString().split('T')[0]);
                    if (data.description) {
                        setItems([{
                            id: "1",
                            description: data.description,
                            qty: 1,
                            amount: Number(data.amount || 0)
                        }]);
                    }
                    if (autoPdf) {
                        setTimeout(() => {
                            handleDownloadPdf();
                        }, 600);
                    }
                }
            }).catch(() => {
                // Ignore if fetch fails
            });
        }
    }, [feeId, autoPdf, handleDownloadPdf]);

    // Load Class & Section Dropdowns
    const fetchDropdowns = useCallback(async () => {
        try {
            const [classRes, sectionRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/academics/sections?no_paginate=true")
            ]);
            setClasses(classRes.data.data?.data || classRes.data.data || []);
            setSections(sectionRes.data.data?.data || sectionRes.data.data || []);
        } catch (error) {
            console.error("Error loading classes/sections:", error);
        }
    }, []);

    useEffect(() => {
        fetchDropdowns();
    }, [fetchDropdowns]);

    // Fetch Students based on Class & Section selection
    const fetchStudents = useCallback(async (classId: string, sectionId: string) => {
        setFetchingStudents(true);
        try {
            const params: Record<string, string> = { no_paginate: "true" };
            if (classId) params.school_class_id = classId;
            if (sectionId) params.section_id = sectionId;

            const res = await api.get("/fee-collection/search-students", { params });
            const list = res.data.data?.data || res.data.data || [];
            setStudents(list);

            if (selectedStudentId) {
                const found = list.find((s: StudentItem) => s.id.toString() === selectedStudentId);
                if (found) setStudentData(found);
            }
        } catch (error) {
            console.error("Error searching students:", error);
        } finally {
            setFetchingStudents(false);
        }
    }, [selectedStudentId]);

    useEffect(() => {
        fetchStudents(selectedClass, selectedSection);
    }, [selectedClass, selectedSection, fetchStudents]);

    // Fetch specific preselected student details if needed
    useEffect(() => {
        if (preselectedStudentId && !studentData) {
            api.get(`/students/${preselectedStudentId}`).then(res => {
                const s = res.data.data || res.data;
                if (s) {
                    setStudentData(s);
                    setSelectedStudentId(s.id.toString());
                    if (s.school_class_id) setSelectedClass(s.school_class_id.toString());
                }
            }).catch(() => {
                // Ignore if student detail endpoint fails
            });
        }
    }, [preselectedStudentId, studentData]);

    const handleStudentChange = (id: string) => {
        setSelectedStudentId(id);
        const s = students.find(item => item.id.toString() === id);
        setStudentData(s || null);
    };

    // Item manipulation handlers
    const addItemRow = () => {
        setItems(prev => [
            ...prev,
            { id: Date.now().toString(), description: "", qty: 1, amount: 0 }
        ]);
    };

    const removeItemRow = (id: string) => {
        if (items.length <= 1) return;
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            return {
                ...item,
                [field]: field === "qty" || field === "amount" ? Math.max(0, Number(value) || 0) : value
            };
        }));
    };

    // Calculations: Subtotal, Discount & Net Grand Total
    const subtotal = items.reduce((acc, item) => acc + (Number(item.qty || 0) * Number(item.amount || 0)), 0);
    const discountVal = Math.max(0, Number(discount) || 0);
    const grandTotal = Math.max(0, subtotal - discountVal);

    // Native High-Precision Browser Print Handler
    const handleNativePrint = () => {
        window.print();
    };

    // Save or update manual invoice
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId) {
            toast("error", "Please select a student first");
            return;
        }

        const validItems = items.filter(item => item.description.trim() !== "");
        if (validItems.length === 0) {
            toast("error", "Please add at least one line item description");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                student_id: selectedStudentId,
                due_date: dueDate,
                discount: discountVal,
                items: validItems.map(item => ({
                    description: item.description,
                    qty: item.qty,
                    amount: item.amount
                }))
            };

            if (editId) {
                await api.put(`/fee-collection/manual-invoice/${editId}`, payload);
                toast("success", "Invoice updated successfully!");
            } else {
                await api.post("/fee-collection/generate-manual-invoice", payload);
                toast("success", "Invoice generated and added to Due Fees!");
            }

            router.push(`/dashboard/fees-collection/quick-fees?student_id=${selectedStudentId}`);
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } } };
            toast("error", err.response?.data?.message || "Failed to save invoice");
        } finally {
            setSubmitting(false);
        }
    };

    // Safe logo URL resolver using application-wide getImageUrl helper
    const rawLogo = settings.print_logo || settings.print_logo_base64 || settings.admin_logo || settings.app_logo;
    const logoUrl = getImageUrl(rawLogo);
    const headerImageUrl = printSetting?.header_image_url ? getImageUrl(printSetting.header_image_url) : "";

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return "";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${mm}/${dd}/${yyyy}`;
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-6 pb-24 animate-in fade-in duration-500 max-w-5xl mx-auto">
            {/* Embedded High-Precision Print & Save-to-PDF CSS */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                    body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:block {
                        display: block !important;
                    }
                    .print\\:border-none {
                        border: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:p-0 {
                        padding: 0 !important;
                    }
                    .print\\:bg-white {
                        background-color: #ffffff !important;
                    }
                    .print\\:text-black {
                        color: #000000 !important;
                    }
                    .print\\:flex-row {
                        display: flex !important;
                        flex-direction: row !important;
                    }
                    input, textarea, select {
                        border: none !important;
                        background: transparent !important;
                        box-shadow: none !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        appearance: none !important;
                        -webkit-appearance: none !important;
                    }
                    input[type="date"]::-webkit-calendar-picker-indicator {
                        display: none !important;
                        -webkit-appearance: none !important;
                    }
                }
            `}</style>

            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm print:hidden">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="gap-2 font-bold text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Quick Fees
                </Button>

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleNativePrint}
                        className="gap-2 font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 shadow-sm"
                    >
                        <Printer className="h-4 w-4 text-slate-600" />
                        Print
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleDownloadPdf}
                        disabled={pdfGenerating}
                        className="gap-2 font-bold border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 shadow-sm"
                    >
                        {pdfGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-indigo-600" />}
                        {pdfGenerating ? "Generating PDF..." : "Download PDF Invoice"}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || !selectedStudentId}
                        className="gap-2 font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md hover:opacity-95"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        {editId ? "Update Invoice" : "Save & Add to Due Fees"}
                    </Button>
                </div>
            </div>

            {/* Standard Invoice Paper Template */}
            <form onSubmit={handleSubmit}>
                <Card 
                    ref={invoiceCardRef} 
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    className="border border-slate-200/80 shadow-2xl bg-white rounded-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none"
                >
                    {/* Header Template matching PrintHeader & Invoice Tab style */}
                    <CardHeader className="p-0 border-none bg-white" style={{ backgroundColor: '#ffffff', borderBottom: 'none' }}>
                        {headerImageUrl ? (
                            <div className="w-full bg-white overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={headerImageUrl} 
                                    alt="Invoice Header Banner" 
                                    className="w-full h-auto max-h-48 object-contain object-center"
                                />
                            </div>
                        ) : (
                            <div className="w-full flex flex-col bg-white" style={{ backgroundColor: '#ffffff' }}>
                                <div 
                                    className="flex flex-wrap justify-between items-start p-6 md:p-8 bg-white min-h-[110px] gap-6"
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px', backgroundColor: '#ffffff' }}
                                >
                                    {/* Left Side: Marked print_logo Box & School Name */}
                                    <div className="flex flex-col justify-center items-start space-y-2">
                                        <div className="min-h-[44px] flex items-center">
                                            {logoUrl ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img 
                                                    src={logoUrl} 
                                                    alt="Print Logo" 
                                                    className="max-h-16 w-auto object-contain"
                                                    onError={(e) => {
                                                        const imgEl = e.currentTarget;
                                                        imgEl.style.display = 'none';
                                                        if (imgEl.nextElementSibling) {
                                                            (imgEl.nextElementSibling as HTMLElement).style.display = 'inline-flex';
                                                        }
                                                    }}
                                                />
                                            ) : null}
                                            <div 
                                                style={{ backgroundColor: '#4CAF50', color: '#ffffff', padding: '4px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}
                                                className={`px-3 py-1 bg-[#4CAF50] text-white font-bold text-xs rounded tracking-wider uppercase ${logoUrl ? 'hidden' : 'inline-flex'}`}
                                            >
                                                {settings.school_code || "SMART SCHOOL"}
                                            </div>
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none" style={{ color: '#0f172a', fontWeight: '900', fontSize: '24px' }}>
                                                {settings.school_name || "iSchool"}
                                            </h1>
                                        </div>
                                    </div>

                                    {/* Right Side: Contact Info */}
                                    <div className="flex flex-col text-xs text-slate-700 font-semibold items-end text-right space-y-1 justify-center" style={{ textAlign: 'right', fontSize: '12px', color: '#334155' }}>
                                        <p><span className="font-bold text-slate-900" style={{ color: '#0f172a' }}>Address:</span> {settings.address || "House#68, Road#10, Sector,11"}</p>
                                        <p><span className="font-bold text-slate-900" style={{ color: '#0f172a' }}>Phone No.:</span> {settings.phone || "+8801851046320"}</p>
                                        <p><span className="font-bold text-slate-900" style={{ color: '#0f172a' }}>Email:</span> {settings.email || "smartideasbd24@gmail.com"}</p>
                                        <p><span className="font-bold text-slate-900" style={{ color: '#0f172a' }}>Website:</span> {settings.base_url?.replace(/^https?:\/\//, '') || "api.ischool.mddoulat.com"}</p>
                                    </div>
                                </div>

                                {/* Full-width Black Title Bar */}
                                <div className="w-full bg-black text-white text-center py-2.5 pdf-header-banner" style={{ backgroundColor: '#000000', color: '#ffffff', textAlign: 'center', padding: '10px 0' }}>
                                    <h2 className="text-sm md:text-base font-black uppercase tracking-widest" style={{ color: '#ffffff', fontWeight: '900', letterSpacing: '0.1em' }}>INVOICE</h2>
                                </div>
                            </div>
                        )}
                    </CardHeader>

                    <CardContent className="p-6 space-y-4 pt-0 mt-0" style={{ padding: '0px 24px 24px 24px', marginTop: '0px', paddingTop: '0px' }}>
                        {/* COMBINED SECTION: Top-Aligned 4-Column Single-Row Layout (Zero Top Space & Border-Free Header) */}
                        <div 
                            className="p-0 pt-0 mt-0 space-y-3 bg-transparent print:bg-transparent"
                            style={{ padding: '0px', marginTop: '0px', paddingTop: '0px', backgroundColor: 'transparent', border: 'none' }}
                        >
                            {/* Top Controls Row for Selectors & Date Inputs (Omitted from Print & PDF Output) */}
                            {!isPdfExporting && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden border-b border-slate-200/80 pb-3 mb-3 pt-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <GraduationCap className="h-3.5 w-3.5 text-indigo-600" /> Class & Section
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={selectedClass}
                                                onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudentId(""); setStudentData(null); }}
                                            >
                                                <option value="">Select Class</option>
                                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <select
                                                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={selectedSection}
                                                onChange={(e) => { setSelectedSection(e.target.value); setSelectedStudentId(""); setStudentData(null); }}
                                            >
                                                <option value="">All Sections</option>
                                                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5 text-indigo-600" /> Select Student *
                                        </label>
                                        <select
                                            className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={selectedStudentId}
                                            onChange={(e) => handleStudentChange(e.target.value)}
                                            required
                                        >
                                            <option value="">
                                                {fetchingStudents ? "Loading Students..." : "Select Student..."}
                                            </option>
                                            {students.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name} {s.last_name || ""} {s.admission_no ? `(${s.admission_no})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-indigo-600" /> Edit Dates
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                type="date"
                                                className="h-8 text-xs font-semibold border-slate-300"
                                                value={issueDate}
                                                onChange={(e) => setIssueDate(e.target.value)}
                                            />
                                            <Input
                                                type="date"
                                                className="h-8 text-xs font-semibold border-amber-300 text-amber-700"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 4 COLUMNS IN 1 SINGLE ROW: Flex layout with inline styles & transparent wrapper */}
                            <div 
                                className="flex flex-row items-stretch gap-3 text-xs w-full print:flex-row pdf-4col-row pt-2" 
                                style={{ display: 'flex', flexDirection: 'row', width: '100%', gap: '12px', alignItems: 'stretch' }}
                            >
                                {/* Column 1: Invoice No & Billed Student Name */}
                                <div className="w-1/4 p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2 shadow-sm flex flex-col justify-between pdf-col-card" style={{ width: '25%', flex: '1 1 0%', padding: '14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block" style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800' }}>INVOICE NO</span>
                                        <strong className="font-mono text-slate-900 font-black text-xs block mt-0.5" style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: '900', fontSize: '13px' }}>{invoiceNo}</strong>
                                    </div>
                                    <div className="pt-1.5 border-t border-slate-100" style={{ paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                                        <span className="text-[9px] uppercase font-extrabold tracking-wider text-indigo-600 block" style={{ fontSize: '9px', color: '#4f46e5', fontWeight: '800' }}>BILLED TO STUDENT</span>
                                        <h2 className="text-xs font-black text-slate-900 leading-snug mt-0.5" style={{ color: '#0f172a', fontWeight: '900', fontSize: '13px' }}>{studentData ? `${studentData.name} ${studentData.last_name || ""}` : "Doulat Khan"}</h2>
                                        <p className="text-[10px] text-slate-500 font-medium" style={{ fontSize: '10px', color: '#64748b' }}>
                                            Adm No: <strong className="text-slate-900 font-bold" style={{ color: '#0f172a' }}>{studentData?.admission_no || "ADM-0001"}</strong>
                                        </p>
                                    </div>
                                </div>

                                {/* Column 2: Guardian Details */}
                                <div className="w-1/4 p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2 shadow-sm flex flex-col justify-between pdf-col-card" style={{ width: '25%', flex: '1 1 0%', padding: '14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block" style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800' }}>GUARDIAN DETAILS</span>
                                        <p className="text-xs font-bold text-slate-800 mt-1" style={{ color: '#1e293b', fontWeight: '700', fontSize: '12px' }}>
                                            {(studentData?.father_name as string) || (studentData?.guardian_name as string) || "Sabedul Hoque"}
                                        </p>
                                    </div>
                                    <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-500" style={{ paddingTop: '6px', borderTop: '1px solid #f1f5f9', fontSize: '10px', color: '#64748b' }}>
                                        <span>Phone Number:</span>
                                        <p className="font-bold text-slate-800" style={{ color: '#1e293b', fontWeight: '700' }}>{(studentData?.mobile_no as string) || (studentData?.guardian_phone as string) || "01851046320"}</p>
                                    </div>
                                </div>

                                {/* Column 3: Issue Date */}
                                <div className="w-1/4 p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2 shadow-sm flex flex-col justify-between pdf-col-card" style={{ width: '25%', flex: '1 1 0%', padding: '14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block" style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800' }}>ISSUE DATE</span>
                                        <strong className="text-slate-900 font-black text-xs block mt-1" style={{ color: '#0f172a', fontWeight: '900', fontSize: '13px' }}>{formatDateDisplay(issueDate)}</strong>
                                    </div>
                                    <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-500" style={{ paddingTop: '6px', borderTop: '1px solid #f1f5f9', fontSize: '10px', color: '#64748b' }}>
                                        <span>Status:</span>
                                        <p className="font-bold text-amber-600 uppercase tracking-wider text-[9px] bg-amber-50 inline-block px-1.5 py-0.5 rounded border border-amber-200 mt-0.5" style={{ color: '#d97706', fontWeight: '700', backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>UNPAID / DUE</p>
                                    </div>
                                </div>

                                {/* Column 4: Due Date, Class, Section, Academic Session */}
                                <div className="w-1/4 p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2 shadow-sm flex flex-col justify-between pdf-col-card" style={{ width: '25%', flex: '1 1 0%', padding: '14px', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block" style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800' }}>DUE DATE</span>
                                        <strong className="text-slate-900 font-black text-xs block mt-1" style={{ color: '#0f172a', fontWeight: '900', fontSize: '13px' }}>{formatDateDisplay(dueDate)}</strong>
                                    </div>
                                    <div className="pt-1.5 border-t border-slate-100 text-right space-y-0.5 text-[10px]" style={{ paddingTop: '6px', borderTop: '1px solid #f1f5f9', textAlign: 'right', fontSize: '10px', color: '#334155' }}>
                                        <p>Class: <strong className="text-slate-900 font-bold" style={{ color: '#0f172a' }}>{studentData?.school_class?.name || "Class 1"}</strong></p>
                                        <p>Section: <strong className="text-slate-900 font-bold" style={{ color: '#0f172a' }}>{studentData?.section?.name || "A"}</strong></p>
                                        <p className="text-slate-500 text-[9px]" style={{ fontSize: '9px', color: '#64748b' }}>Academic Session: {settings.session || "2026-27"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Items Particulars Table */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider" style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>
                                    Fee Particulars & Line Items
                                </h3>
                                {!isPdfExporting && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={addItemRow}
                                        className="gap-1.5 text-xs font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 print:hidden"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add Description Row
                                    </Button>
                                )}
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm print:border-slate-300" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                <table className="w-full text-left text-xs border-collapse" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr className="bg-slate-100/90 text-slate-700 uppercase font-black border-b border-slate-200 print:bg-slate-100" style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                                            <th className="p-3.5 w-12 text-center" style={{ padding: '12px', textAlign: 'center' }}>#</th>
                                            <th className="p-3.5" style={{ padding: '12px' }}>Fee Description / Particulars</th>
                                            <th className="p-3.5 w-24 text-center" style={{ padding: '12px', textAlign: 'center' }}>Qty</th>
                                            <th className="p-3.5 w-36 text-right" style={{ padding: '12px', textAlign: 'right' }}>Unit Price ({symbol})</th>
                                            <th className="p-3.5 w-36 text-right" style={{ padding: '12px', textAlign: 'right' }}>Subtotal ({symbol})</th>
                                            {!isPdfExporting && <th className="p-3.5 w-16 text-center print:hidden">Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                                        {items.map((item, idx) => {
                                            const itemSubtotal = Number(item.qty || 0) * Number(item.amount || 0);
                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors" style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td className="p-3.5 text-center font-bold text-slate-400" style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#94a3b8' }}>{idx + 1}</td>
                                                    <td className="p-3.5 font-semibold text-slate-900" style={{ padding: '12px', fontWeight: '600', color: '#0f172a' }}>
                                                        {isPdfExporting ? (
                                                            <span>{item.description || "Tuition Fee"}</span>
                                                        ) : (
                                                            <Input
                                                                type="text"
                                                                placeholder="e.g. Monthly Tuition Fee - August, Exam Fee, Lab Fee..."
                                                                className="h-9 text-xs font-semibold border-slate-200 print:border-none print:p-0 print:h-auto"
                                                                value={item.description}
                                                                onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                                                required
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-3.5 text-center" style={{ padding: '12px', textAlign: 'center' }}>
                                                        {isPdfExporting ? (
                                                            <span>{item.qty}</span>
                                                        ) : (
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                className="h-9 text-xs font-semibold text-center border-slate-200 print:border-none print:p-0 print:h-auto"
                                                                value={item.qty}
                                                                onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                                                                required
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-3.5 text-right" style={{ padding: '12px', textAlign: 'right' }}>
                                                        {isPdfExporting ? (
                                                            <span className="font-bold text-slate-900">{Number(item.amount || 0).toFixed(2)}</span>
                                                        ) : (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                placeholder="0.00"
                                                                className="h-9 text-xs font-bold text-right border-slate-200 print:border-none print:p-0 print:h-auto"
                                                                value={item.amount || ""}
                                                                onChange={(e) => updateItem(item.id, "amount", e.target.value)}
                                                                required
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-3.5 text-right font-extrabold text-slate-900 text-sm" style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
                                                        {itemSubtotal.toFixed(2)}
                                                    </td>
                                                    {!isPdfExporting && (
                                                        <td className="p-3.5 text-center print:hidden">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItemRow(item.id)}
                                                                disabled={items.length <= 1}
                                                                className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                                                                title="Remove Row"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Net Calculation Summary Box with Subtotal, Discount & Grand Total */}
                        <div className="flex justify-end pt-2" style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                            <div 
                                className="w-full md:w-80 bg-white text-slate-900 p-5 rounded-xl space-y-3 border border-slate-200 shadow-sm print:bg-white print:border-slate-300" 
                                style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', width: '320px' }}
                            >
                                <div className="flex justify-between text-xs text-slate-600 print:text-slate-600" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                                    <span>Total Particulars Items:</span>
                                    <span className="font-bold text-slate-900 print:text-slate-900" style={{ fontWeight: 'bold', color: '#0f172a' }}>{items.length}</span>
                                </div>

                                <div className="flex justify-between text-xs text-slate-600 print:text-slate-600" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                                    <span>Subtotal Amount:</span>
                                    <span className="font-bold text-slate-900 print:text-slate-900" style={{ fontWeight: 'bold', color: '#0f172a' }}>{symbol}{subtotal.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between items-center text-xs text-slate-600 print:text-slate-600" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#475569' }}>
                                    <span className="font-semibold flex items-center gap-1">
                                        <Tag className="h-3 w-3 text-emerald-600" /> Discount ({symbol}):
                                    </span>
                                    {isPdfExporting ? (
                                        <span className="font-bold text-emerald-600" style={{ fontWeight: 'bold', color: '#059669' }}>
                                            -{symbol}{discountVal.toFixed(2)}
                                        </span>
                                    ) : (
                                        <div className="w-28">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                className="h-8 text-xs font-bold text-right border-slate-200 text-emerald-600 focus:ring-emerald-500"
                                                value={discount}
                                                onChange={(e) => setDiscount(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-slate-200 print:border-slate-300 pt-3 flex justify-between items-center" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="text-sm font-black uppercase tracking-wider text-slate-900 print:text-slate-900" style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>Grand Total Payable:</span>
                                    <span className="text-2xl font-black text-slate-900 print:text-slate-900" style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>
                                        {symbol}{grandTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Terms & Footer Instructions */}
                        <div className="space-y-2 pt-4" style={{ paddingTop: '16px' }}>
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                                Invoice Terms & Footer Instructions
                            </label>
                            {isPdfExporting ? (
                                <div className="p-3 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 whitespace-pre-wrap" style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#334155' }}>
                                    {notes}
                                </div>
                            ) : (
                                <textarea
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 p-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 print:border-none print:bg-transparent print:p-0"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            )}
                        </div>

                        {/* Official Signature Footer Template */}
                        <div className="pt-12 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-500" style={{ borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', paddingTop: '40px', fontSize: '12px', color: '#64748b' }}>
                            <div style={{ textAlign: 'center', width: '200px' }}>
                                <div className="h-10 border-b border-slate-400 w-48 mx-auto mb-2" style={{ borderBottom: '1px solid #94a3b8', height: '30px', marginBottom: '8px' }}></div>
                                <p className="font-bold text-slate-800" style={{ fontWeight: 'bold', color: '#1e293b' }}>Accountant / Prepared By</p>
                            </div>
                            <div style={{ textAlign: 'center', width: '200px' }}>
                                <div className="h-10 border-b border-slate-400 w-48 mx-auto mb-2" style={{ borderBottom: '1px solid #94a3b8', height: '30px', marginBottom: '8px' }}></div>
                                <p className="font-bold text-slate-800" style={{ fontWeight: 'bold', color: '#1e293b' }}>Principal / Authorized Signatory</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}

export default function GenerateInvoicePage() {
    return (
        <Suspense fallback={
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <GenerateInvoiceContent />
        </Suspense>
    );
}
