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
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ArrowUpDown,
    FileBadge,
    Loader2,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    type CertificateTemplate,
    type StudentFields,
    renderCertificateHtml,
    printCertificate,
} from "@/lib/certificate";

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

const TABLE_COLS = 9;

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

function toFields(s: ApiStudent): StudentFields {
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
    };
}

export default function GenerateCertificatePage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [sections, setSections] = useState<SectionOption[]>([]);
    const [templates, setTemplates] = useState<CertificateTemplate[]>([]);

    const [classId, setClassId] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [templateId, setTemplateId] = useState("");

    const [students, setStudents] = useState<ApiStudent[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [classesRes, tplRes] = await Promise.all([
                    api.get("/academics/classes?no_paginate=true"),
                    api.get("/certificate/student-certificates", { params: { per_page: 100 } }),
                ]);
                setClasses(classesRes.data.data || classesRes.data || []);
                const tplData = tplRes.data?.data ?? tplRes.data ?? [];
                setTemplates(Array.isArray(tplData) ? tplData : []);
            } catch {
                tt.error("failed_to_load_criteria_data");
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!classId) { setSections([]); setSectionId(""); return; }
        (async () => {
            try {
                const res = await api.get(`/academics/sections?school_class_id=${classId}&no_paginate=true`);
                setSections(res.data.data || res.data || []);
            } catch {
                setSections([]);
            }
        })();
    }, [classId]);

    const handleSearch = async () => {
        if (!classId || !templateId) {
            toast({ title: t("validation_error"), description: t("please_select_class_and_certificate"), variant: "destructive" });
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
            setSelected([]);
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

    const allChecked = filtered.length > 0 && selected.length === filtered.length;
    const toggleAll = () => setSelected(allChecked ? [] : filtered.map((s) => s.id));
    const toggleOne = (id: number) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

    const handleGenerate = () => {
        const template = templates.find((t) => String(t.id) === templateId);
        if (!template) {
            toast({ title: t("error"), description: t("select_certificate_template"), variant: "destructive" });
            return;
        }
        const chosen = students.filter((s) => selected.includes(s.id));
        if (chosen.length === 0) {
            toast({ title: t("no_students_selected"), description: t("select_at_least_one_student"), variant: "destructive" });
            return;
        }
        const pages = chosen
            .map((s) => `<div style="page-break-after:always;">${renderCertificateHtml(template, toFields(s))}</div>`)
            .join("");
        printCertificate(pages);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(filtered.map((s) => `${s.admission_no}\t${studentName(s)}`).join("\n"));
        tt.success("data_copied_to_clipboard");
    };
    const handleExportCSV = () => {
        const rows = [[t("admission_no"), t("name"), t("class"), t("father_name"), t("dob"), t("gender"), t("category"), t("mobile")],
            ...filtered.map((s) => [s.admission_no || "", studentName(s), s.schoolClass?.name || "", s.father_name || "", s.dob || "", s.gender || "", s.category || "", s.phone || ""])];
        const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "students.csv";
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
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <FileBadge className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("generate_certificate")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("generate_certificate_description")}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("certificate")} <span className="text-red-500">*</span></Label>
                            <Select value={templateId} onValueChange={setTemplateId}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select_certificate")} /></SelectTrigger>
                                <SelectContent>
                                    {templates.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
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
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FileText className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{selected.length} of {filtered.length} Selected</p>
                        </div>
                    </div>
                    <Button onClick={handleGenerate} disabled={selected.length === 0} className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all disabled:opacity-40">
                        <FileBadge className="h-4 w-4" /> {t("generate")}
                    </Button>
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
                                    <TableHead className="w-10"><Checkbox checked={allChecked} onCheckedChange={toggleAll} className="h-3.5 w-3.5" /></TableHead>
                                    {[t("admission_no"), t("student_name"), t("class"), t("father_name"), t("dob"), t("gender"), t("category"), t("mobile_number")].map((h) => (
                                        <TableHead key={h} className="font-semibold text-gray-600"><div className="flex items-center gap-1">{h} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows />
                                ) : !searched ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("select_criteria_and_search_to_list")}</TableCell></TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_students_found")}</TableCell></TableRow>
                                ) : filtered.map((s) => (
                                    <TableRow key={s.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                        <TableCell className="py-3"><Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggleOne(s.id)} className="h-3.5 w-3.5" /></TableCell>
                                        <TableCell className="py-3 text-gray-700 font-medium">{s.admission_no || "-"}</TableCell>
                                        <TableCell className="py-3 text-[#6366f1] font-medium">{studentName(s)}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.schoolClass?.name || "-"}{s.section?.name ? ` (${s.section.name})` : ""}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.father_name || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.dob ? new Date(s.dob).toLocaleDateString("en-US") : "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.gender || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.category || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.phone || "-"}</TableCell>
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
        </div>
    );
}
