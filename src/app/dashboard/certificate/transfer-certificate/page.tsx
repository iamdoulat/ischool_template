"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ArrowUpDown,
    ShieldCheck,
    Loader2,
    Download,
    FileBadge,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type StudentFields, renderCertificateHtml, printCertificate, downloadCertificatePdf } from "@/lib/certificate";

interface ClassOption { id: number; name: string; }
interface SectionOption { id: number; name: string; }
interface ApiStudent {
    id: number;
    admission_no?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    father_name?: string;
    mother_name?: string;
    dob?: string;
    gender?: string;
    category?: string;
    phone?: string;
    email?: string;
    roll_no?: string;
    religion?: string;
    current_address?: string;
    admission_date?: string;
    avatar?: string;
    schoolClass?: { name?: string };
    section?: { name?: string };
}

interface IssuedTC {
    tc_number: string;
    student_name: string;
    admission_no: string;
    issue_date: string;
    is_reissue: boolean;
    meta?: StudentFields;
}

const TABLE_COLS = 8;

// Minimal TC template for rendering
const TC_TEMPLATE = {
    id: 0,
    name: "Transfer Certificate",
    header_left: "",
    header_center: "TRANSFER CERTIFICATE",
    header_right: "",
    body_text: `This is to certify that [name], S/D/O [father_name], bearing Admission No. [admission_no],
was a student of this school in Class [class] ([section]).

Date of Birth: [dob]
Gender: [gender]
Category: [category]
Date of Admission: [admission_date]
TC Number: [tc_number]
Issue Date: [present_date]

[reason]

The student is hereby issued this Transfer Certificate upon leaving the institution.`,
    footer_left: "Class Teacher",
    footer_center: "",
    footer_right: "Principal",
    header_height: "80",
    footer_height: "60",
    body_height: "auto",
    body_width: "860",
    enable_student_photo: false,
    background_image: null,
    is_active: true,
};

function SkeletonRows({ rows = 6, cols = TABLE_COLS }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <div className="h-3 rounded bg-gray-200/70 animate-pulse" style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

function studentName(s: ApiStudent): string {
    return `${s.name || s.first_name || ""} ${s.last_name || ""}`.trim();
}

function toFields(s: ApiStudent, extra?: Partial<StudentFields>): StudentFields {
    return {
        name: studentName(s),
        admission_no: s.admission_no || "",
        roll_no: s.roll_no || "",
        class: s.schoolClass?.name || "",
        section: s.section?.name || "",
        gender: s.gender || "",
        dob: s.dob ? new Date(s.dob).toLocaleDateString("en-US") : "",
        category: s.category || "",
        father_name: s.father_name || "",
        mother_name: s.mother_name || "",
        religion: s.religion || "",
        email: s.email || "",
        phone: s.phone || "",
        present_address: s.current_address || "",
        admission_date: s.admission_date ? new Date(s.admission_date).toLocaleDateString("en-US") : "",
        image: s.avatar ? `/storage/${s.avatar}` : null,
        ...extra,
    };
}

export default function TransferCertificatePage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [sections, setSections] = useState<SectionOption[]>([]);
    const [classId, setClassId] = useState("");
    const [sectionId, setSectionId] = useState("");

    const [students, setStudents] = useState<ApiStudent[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const [reissueIds, setReissueIds] = useState<number[]>([]);
    const [issuingId, setIssuingId] = useState<number | null>(null);

    // Verify TC dialog
    const [verifyOpen, setVerifyOpen] = useState(false);
    const [verifyInput, setVerifyInput] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<IssuedTC | null | "not_found">(null);

    // Reason dialog for issuing
    const [reasonDialogId, setReasonDialogId] = useState<number | null>(null);
    const [reason, setReason] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/academics/classes?no_paginate=true");
                setClasses(res.data.data || res.data || []);
            } catch { /* silent */ }
        })();
    }, []);

    useEffect(() => {
        if (!classId) { setSections([]); setSectionId(""); return; }
        (async () => {
            try {
                const res = await api.get(`/academics/sections?school_class_id=${classId}&no_paginate=true`);
                setSections(res.data.data || res.data || []);
            } catch { setSections([]); }
        })();
    }, [classId]);

    const handleSearch = async () => {
        if (!classId) {
            toast({ title: t("validation_error"), description: t("please_select_class"), variant: "destructive" });
            return;
        }
        setLoading(true);
        setSearched(true);
        try {
            const res = await api.get("/students", {
                params: { school_class_id: classId, section_id: sectionId || undefined, limit: 500 },
            });
            const data = res.data?.data?.data || res.data?.data || res.data || [];
            setStudents(Array.isArray(data) ? data : []);
            setReissueIds([]);
        } catch {
            tt.error("failed_to_fetch_students");
        } finally {
            setLoading(false);
        }
    };

    const filtered = students.filter((s) =>
        studentName(s).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.admission_no || "").includes(searchTerm)
    );

    const toggleReissue = (id: number) =>
        setReissueIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

    const openIssueTc = (s: ApiStudent) => {
        setReasonDialogId(s.id);
        setReason("");
    };

    const issueTc = async () => {
        const student = students.find((s) => s.id === reasonDialogId);
        if (!student) return;
        setIssuingId(reasonDialogId);
        setReasonDialogId(null);
        try {
            const res = await api.post("/certificate/transfer-certificates", {
                student_id: student.id,
                reason: reason.trim() || null,
            });
            const tc: IssuedTC = res.data.data;
            toast({ title: t("tc_issued"), description: `${t("tc_number")}: ${tc.tc_number}` });
            const fields: StudentFields = {
                ...toFields(student),
                tc_number: tc.tc_number,
                reason: reason.trim() || "",
            };
            const html = renderCertificateHtml(TC_TEMPLATE, fields);
            await downloadCertificatePdf(html, `TC-${tc.tc_number}.pdf`);
        } catch {
            tt.error("failed_to_issue_transfer_certificate");
        } finally {
            setIssuingId(null);
        }
    };

    const printTc = (s: ApiStudent) => {
        const fields = toFields(s);
        printCertificate(renderCertificateHtml(TC_TEMPLATE, fields));
    };

    const handleVerify = async () => {
        if (!verifyInput.trim()) return;
        setVerifying(true);
        setVerifyResult(null);
        try {
            const res = await api.get("/certificate/transfer-certificates/verify", { params: { tc_number: verifyInput.trim() } });
            setVerifyResult(res.data.data as IssuedTC);
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            setVerifyResult(status === 404 ? "not_found" : null);
            if (status !== 404) {
                tt.error("failed_to_verify_tc");
            }
        } finally {
            setVerifying(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(filtered.map((s) => `${s.admission_no}\t${studentName(s)}`).join("\n"));
        tt.success("data_copied_to_clipboard");
    };
    const handleExportCSV = () => {
        const rows = [[t("admission_no"), t("name"), t("dob"), t("gender"), t("category"), t("mobile")],
            ...filtered.map((s) => [s.admission_no || "", studentName(s), s.dob || "", s.gender || "", s.category || "", s.phone || ""])];
        const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "transfer_certificate_students.csv";
        link.click();
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="space-y-6">
            {/* Criteria */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FileBadge className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("transfer_certificate")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("issue_tc_description")}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { setVerifyOpen(true); setVerifyInput(""); setVerifyResult(null); }}
                        className="h-9 px-4 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                    >
                        <ShieldCheck className="h-4 w-4" /> {t("verify_tc")}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("class")} <span className="text-red-500">*</span></Label>
                            <Select value={classId} onValueChange={setClassId}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select_class")} /></SelectTrigger>
                                <SelectContent>
                                    {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("section")}</Label>
                            <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("all_sections")} /></SelectTrigger>
                                <SelectContent>
                                    {sections.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSearch} disabled={loading} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} {t("search")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Student list */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_list")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{filtered.length} {t("students")}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <Input placeholder={t("search_students")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-3 h-9 text-xs w-full md:w-64" />
                        <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500 self-end md:self-auto">
                            {toolbarActions.map((a, i) => (
                                <Button key={i} variant="ghost" size="icon" onClick={a.onClick} title={a.title} className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                    <a.Icon className="h-4 w-4" />
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1100px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    {[t("admission_no"), t("student_name"), t("dob"), t("gender"), t("category"), t("mobile_number")].map((h) => (
                                        <TableHead key={h} className="font-semibold text-gray-600"><div className="flex items-center gap-1">{h} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    ))}
                                    <TableHead className="font-semibold text-gray-600 text-center">{t("reissue")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows />
                                ) : !searched ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("select_class_and_search_to_list")}</TableCell></TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_students_found")}</TableCell></TableRow>
                                ) : filtered.map((s) => (
                                    <TableRow key={s.id} className={cn("text-xs hover:bg-gray-50/60 transition-colors whitespace-nowrap", issuingId === s.id && "opacity-60 pointer-events-none")}>
                                        <TableCell className="py-3 text-gray-700 font-medium">{s.admission_no || "-"}</TableCell>
                                        <TableCell className="py-3 text-[#6366f1] font-medium">{studentName(s)}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.dob ? new Date(s.dob).toLocaleDateString("en-US") : "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.gender || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.category || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.phone || "-"}</TableCell>
                                        <TableCell className="py-3 text-center">
                                            <Checkbox checked={reissueIds.includes(s.id)} onCheckedChange={() => toggleReissue(s.id)} className="h-3.5 w-3.5 border-gray-300" />
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="icon"
                                                    onClick={() => printTc(s)}
                                                    title={t("print_tc")}
                                                    className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                >
                                                    <Printer className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    onClick={() => openIssueTc(s)}
                                                    disabled={issuingId === s.id}
                                                    title={t("issue_and_download_tc")}
                                                    className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                >
                                                    {issuingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="text-xs text-gray-500 font-medium pt-2">
                        {t("showing_x_students", { count: filtered.length })}
                    </div>
                </CardContent>
            </Card>

            {/* Verify TC Dialog */}
            <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-indigo-500" /> {t("verify_transfer_certificate")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-gray-500 uppercase">{t("tc_number")}</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="TC-2026-0001"
                                value={verifyInput}
                                onChange={(e) => setVerifyInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                                className="h-9 text-xs"
                            />
                            <Button onClick={handleVerify} disabled={verifying} className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold gap-2 shadow-md">
                                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>

                        {verifyResult === "not_found" && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-medium">
                                <XCircle className="h-4 w-4 shrink-0" /> {t("no_tc_found_with_that_number")}
                            </div>
                        )}
                        {verifyResult && verifyResult !== "not_found" && (
                            <div className="rounded-lg border border-green-100 bg-green-50 p-4 space-y-2">
                                <div className="flex items-center gap-2 text-green-700 font-bold text-xs">
                                    <CheckCircle2 className="h-4 w-4" /> {t("tc_verified")}
                                    {verifyResult.is_reissue && <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">{t("reissue")}</span>}
                                </div>
                                {([
                                    [t("tc_number"), verifyResult.tc_number],
                                    [t("student"), verifyResult.student_name],
                                    [t("admission_no"), verifyResult.admission_no],
                                    [t("issue_date"), verifyResult.issue_date ? new Date(verifyResult.issue_date).toLocaleDateString("en-US") : "-"],
                                ] as [string, string][]).map(([k, v]) => (
                                    <div key={k} className="flex justify-between text-xs">
                                        <span className="text-gray-500 font-medium">{k}</span>
                                        <span className="text-gray-800 font-semibold">{v}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVerifyOpen(false)} className="h-9 text-xs">{t("close")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reason dialog */}
            <AlertDialog open={reasonDialogId !== null} onOpenChange={(o) => !o && setReasonDialogId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("issue_transfer_certificate")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("issue_tc_reason_description")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                        placeholder={t("reason_for_transfer_optional")}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="mt-1 text-xs h-9"
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={issueTc}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white"
                        >
                            {t("issue_and_download")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
