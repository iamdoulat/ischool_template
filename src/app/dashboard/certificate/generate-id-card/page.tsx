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
    CreditCard,
    Loader2,
    Download,
    UserSquare2,
    UserX,
    CheckCircle2,
    Sparkles,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { type IdCardTemplate, type IdCardPerson, renderIdCardHtml, printIdCards, downloadIdCardPdf } from "@/lib/certificate";
import { getImageUrl } from "@/lib/image-url";

interface ClassOption { id: number; name: string; }
interface SectionOption { id: number; name: string; }
interface CategoryOption { id: number; category_name?: string; name?: string; }
interface ApiStudent {
    id: number;
    user_id?: number;
    qr_code?: string;
    user?: { id?: number; qr_code?: string };
    admission_no?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    father_name?: string;
    mother_name?: string;
    dob?: string;
    gender?: string;
    category?: string | number;
    student_category_id?: number;
    student_category?: { id?: number; category_name?: string; name?: string };
    studentCategory?: { id?: number; category_name?: string; name?: string };
    phone?: string;
    roll_no?: string;
    blood_group?: string;
    house?: string;
    current_address?: string;
    avatar?: string;
    school_class_id?: number;
    schoolClass?: { name?: string };
    section_id?: number;
    section?: { name?: string };
}

const TABLE_COLS = 11;

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

function getCategoryName(s: ApiStudent, catList: CategoryOption[] = []): string {
    if (s.studentCategory?.category_name || s.studentCategory?.name) {
        return s.studentCategory.category_name || s.studentCategory.name || "-";
    }
    if (s.student_category?.category_name || s.student_category?.name) {
        return s.student_category.category_name || s.student_category.name || "-";
    }
    if (s.category) {
        const found = catList.find((c) => String(c.id) === String(s.category));
        if (found) {
            return found.category_name || found.name || "";
        }
        if (typeof s.category === "string" && isNaN(Number(s.category)) && s.category.trim() !== "") {
            return s.category;
        }
    }
    if (s.student_category_id) {
        const found = catList.find((c) => String(c.id) === String(s.student_category_id));
        if (found) {
            return found.category_name || found.name || "";
        }
    }
    return "-";
}

function getStudentClassName(s: ApiStudent, classList: ClassOption[] = [], fallbackClassId = ""): string {
    return s.schoolClass?.name
        || (s as any).school_class?.name
        || (s as any).class?.name
        || (s as any).class_name
        || (s as any).school_class_name
        || (typeof (s as any).class === "string" ? (s as any).class : "")
        || classList.find((c) => String(c.id) === String(s.school_class_id || (s as any).class_id || fallbackClassId))?.name
        || "";
}

function getStudentSectionName(s: ApiStudent, sectionList: SectionOption[] = [], fallbackSectionId = ""): string {
    return s.section?.name
        || (s as any).section_name
        || (typeof (s as any).section === "string" ? (s as any).section : "")
        || sectionList.find((sec) => String(sec.id) === String(s.section_id || fallbackSectionId))?.name
        || "";
}

function getStudentClassWithSection(
    s: ApiStudent,
    classList: ClassOption[] = [],
    sectionList: SectionOption[] = [],
    fallbackClassId = "",
    fallbackSectionId = ""
): string {
    const clsName = getStudentClassName(s, classList, fallbackClassId);
    const secName = getStudentSectionName(s, sectionList, fallbackSectionId);

    if (clsName && secName) return `${clsName} (${secName})`;
    if (clsName) return clsName;
    if (secName) return `(${secName})`;
    return "-";
}

function toPerson(
    s: ApiStudent,
    qrMap: Record<string, string> = {},
    classList: ClassOption[] = [],
    sectionList: SectionOption[] = [],
    fallbackClassId = "",
    fallbackSectionId = ""
): IdCardPerson {
    const avatarRaw = s.avatar || (s as any).image || (s as any).photo || (s as any).student_photo || null;
    const resolvedQr = s.qr_code || s.user?.qr_code || (s.admission_no ? qrMap[String(s.admission_no)] : null) || (s.id ? qrMap[String(s.id)] : null) || s.admission_no || null;
    const className = getStudentClassName(s, classList, fallbackClassId);
    const sectionName = getStudentSectionName(s, sectionList, fallbackSectionId);
    return {
        name: studentName(s),
        admission_no: s.admission_no || "",
        roll_no: s.roll_no || "",
        class: className,
        section: sectionName,
        father_name: s.father_name || "",
        mother_name: s.mother_name || "",
        dob: s.dob ? new Date(s.dob).toLocaleDateString("en-US") : "",
        blood_group: s.blood_group || "",
        house: s.house || "",
        session: (s as any).session?.session || (s as any).academic_session?.session || (s as any).academicSession?.session || (s as any).session_name || (s as any).session || "2024-25",
        phone: s.phone || "",
        address: s.current_address || "",
        photo: avatarRaw ? getImageUrl(avatarRaw) : null,
        qr_code: resolvedQr,
    };
}

export default function GenerateIDCardPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [sections, setSections] = useState<SectionOption[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [templates, setTemplates] = useState<IdCardTemplate[]>([]);

    const [classId, setClassId] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [templateId, setTemplateId] = useState("");

    const [students, setStudents] = useState<ApiStudent[]>([]);
    const [assignedIds, setAssignedIds] = useState<number[]>([]);
    const [qrMap, setQrMap] = useState<Record<string, string>>({});
    const [selected, setSelected] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [activating, setActivating] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [classesRes, tplRes, catRes] = await Promise.all([
                    api.get("/academics/classes?no_paginate=true"),
                    api.get("/certificate/student-id-cards", { params: { per_page: 100 } }),
                    api.get("/student-categories").catch(() => api.get("/student/student-categories?no_paginate=true")).catch(() => ({ data: { data: [] } })),
                ]);
                setClasses(classesRes.data.data || classesRes.data || []);
                const tplData = tplRes.data?.data ?? tplRes.data ?? [];
                const list = Array.isArray(tplData) ? tplData : [];
                setTemplates(list);
                const activeTpl = list.find((tp: any) => tp.is_active);
                if (activeTpl) {
                    setTemplateId(String(activeTpl.id));
                } else if (list.length > 0) {
                    setTemplateId(String(list[0].id));
                }
                const catData = catRes.data?.data?.data || catRes.data?.data || catRes.data || [];
                setCategories(Array.isArray(catData) ? catData : []);
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
            } catch { setSections([]); }
        })();
    }, [classId]);

    const handleActivateStyle = async (id: string) => {
        if (!id) return;
        setActivating(true);
        try {
            await api.post(`/certificate/student-id-cards/${id}/activate`);
            setTemplates((prev) => prev.map((t) => ({ ...t, is_active: String(t.id) === id })));
            toast({
                title: t("success") || "Success",
                description: "Template activated as the official student ID card style.",
            });
        } catch {
            tt.error("failed_to_activate_template");
        } finally {
            setActivating(false);
        }
    };

    const handleSearch = async () => {
        if (!classId || !templateId) {
            toast({ title: t("validation_error"), description: t("please_select_class_and_id_card_template"), variant: "destructive" });
            return;
        }
        setLoading(true);
        setSearched(true);
        try {
            const [studentsRes, qrRes] = await Promise.all([
                api.get("/students", { params: { school_class_id: classId, section_id: sectionId || undefined, limit: 500 } }),
                api.get("/smart-attendance/users?role=student").catch(() => ({ data: { data: [] } })),
            ]);
            const data = studentsRes.data?.data?.data || studentsRes.data?.data || studentsRes.data || [];
            const qrList = qrRes.data?.data || qrRes.data || [];
            const map: Record<string, string> = {};
            if (Array.isArray(qrList)) {
                qrList.forEach((u: any) => {
                    if (u.qr_code) {
                        if (u.admission_no) map[String(u.admission_no)] = u.qr_code;
                        if (u.id) map[String(u.id)] = u.qr_code;
                        if (u.email) map[String(u.email)] = u.qr_code;
                        if (u.name) map[String(u.name)] = u.qr_code;
                    }
                });
            }
            setQrMap(map);
            const studentList = Array.isArray(data) ? data : [];
            setStudents(studentList);
            setAssignedIds(studentList.map((s: any) => s.id));
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

    const selectedTemplate = templates.find((tp) => String(tp.id) === templateId);

    const handleGenerate = () => {
        const template = templates.find((tp) => String(tp.id) === templateId);
        if (!template) {
            toast({ title: t("error"), description: t("select_id_card_template"), variant: "destructive" });
            return;
        }
        const chosen = students.filter((s) => selected.includes(s.id));
        if (chosen.length === 0) {
            toast({ title: t("no_students_selected"), description: t("select_at_least_one_student"), variant: "destructive" });
            return;
        }
        setAssignedIds((prev) => Array.from(new Set([...prev, ...selected])));
        printIdCards(chosen.map((s) => renderIdCardHtml(template, toPerson(s, qrMap, classes, sections, classId, sectionId), "student")).join(""));
        toast({
            title: t("success") || "Success",
            description: `ID Card generated & assigned for ${chosen.length} student(s).`,
        });
    };

    const handleUnassignBulk = () => {
        if (selected.length === 0) {
            toast({ title: t("no_students_selected"), description: "Please select at least one student to unassign", variant: "destructive" });
            return;
        }
        setAssignedIds((prev) => prev.filter((id) => !selected.includes(id)));
        toast({
            title: t("success") || "Success",
            description: `ID Card unassigned for ${selected.length} student(s).`,
        });
    };

    const handleUnassignSingle = (s: ApiStudent) => {
        setAssignedIds((prev) => prev.filter((id) => id !== s.id));
        toast({
            title: t("success") || "Success",
            description: `ID Card unassigned for ${studentName(s)}.`,
        });
    };

    const handlePrintSingle = (s: ApiStudent) => {
        const template = templates.find((tp) => String(tp.id) === templateId);
        if (!template) {
            toast({ title: t("error"), description: t("select_id_card_template") || "Please select an ID card template first", variant: "destructive" });
            return;
        }
        setAssignedIds((prev) => Array.from(new Set([...prev, s.id])));
        const html = renderIdCardHtml(template, toPerson(s, qrMap, classes, sections, classId, sectionId), "student");
        printIdCards(html);
    };

    const handleDownloadSingle = async (s: ApiStudent) => {
        const template = templates.find((tp) => String(tp.id) === templateId);
        if (!template) {
            toast({ title: t("error"), description: t("select_id_card_template") || "Please select an ID card template first", variant: "destructive" });
            return;
        }
        setDownloadingId(s.id);
        try {
            setAssignedIds((prev) => Array.from(new Set([...prev, s.id])));
            const html = renderIdCardHtml(template, toPerson(s, qrMap, classes, sections, classId, sectionId), "student");
            const safeName = (s.name || s.first_name || `student_${s.id}`).replace(/[^a-zA-Z0-9-_]/g, "_");
            await downloadIdCardPdf(html, `Student_ID_Card_${safeName}.pdf`);
            toast({ title: t("success"), description: t("id_card_downloaded") || "ID card downloaded successfully" });
        } catch (err) {
            console.error("Failed to download ID card:", err);
            tt.error("failed_to_download_id_card");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(filtered.map((s) => `${s.admission_no}\t${studentName(s)}\t${getCategoryName(s, categories)}`).join("\n"));
        tt.success("data_copied_to_clipboard");
    };
    const handleExportCSV = () => {
        const rows = [[t("admission_no"), t("name"), t("class"), t("father_name"), t("dob"), t("gender"), t("category"), t("mobile"), "ID Card Status"],
            ...filtered.map((s) => [s.admission_no || "", studentName(s), getStudentClassWithSection(s, classes, sections, classId, sectionId), s.father_name || "", s.dob || "", s.gender || "", getCategoryName(s, categories), s.phone || "", assignedIds.includes(s.id) ? "Generated" : "Unassigned"])];
        const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "students_id_card.csv";
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
                        <CreditCard className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("generate_student_id_card")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("generate_id_card_description")}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("class")} <span className="text-red-500">*</span></Label>
                            <Select value={classId} onValueChange={setClassId}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select_class")} /></SelectTrigger>
                                <SelectContent>
                                    {classes.map((c) => (<SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("section")}</Label>
                            <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select_section")} /></SelectTrigger>
                                <SelectContent>
                                    {sections.map((s) => (<SelectItem key={s.id} value={String(s.id)} className="text-xs">{s.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("id_card_template")} <span className="text-red-500">*</span></Label>
                                {selectedTemplate && (
                                    selectedTemplate.is_active ? (
                                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold tracking-wider px-2 py-0.5 gap-1 shadow-xs">
                                            <CheckCircle2 className="h-3 w-3" /> ACTIVE STYLE
                                        </Badge>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleActivateStyle(templateId)}
                                            disabled={activating || !templateId}
                                            className="h-5 px-1.5 text-[10px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold"
                                        >
                                            {activating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                            Set as Active Style
                                        </Button>
                                    )
                                )}
                            </div>
                            <Select value={templateId} onValueChange={setTemplateId}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select_id_card_template")} /></SelectTrigger>
                                <SelectContent>
                                    {templates.map((tp) => (
                                        <SelectItem key={tp.id} value={String(tp.id)} className="text-xs">
                                            <div className="flex items-center justify-between w-full gap-4">
                                                <span>{tp.title}</span>
                                                {tp.is_active && (
                                                    <Badge className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0">ACTIVE STYLE</Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="h-8 px-4 text-xs font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#4f46e5] text-white shadow-sm transition-all"
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Search className="h-3.5 w-3.5 mr-1" />}
                            {t("search")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Student List */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <UserSquare2 className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("select_students_to_generate_id_cards")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleUnassignBulk}
                            disabled={selected.length === 0}
                            className="h-8 px-3 text-xs font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 shadow-xs transition-all disabled:opacity-50 gap-1.5"
                        >
                            <UserX className="h-3.5 w-3.5" />
                            Unassign ({selected.length})
                        </Button>
                        <Button
                            onClick={handleGenerate}
                            disabled={selected.length === 0}
                            className="h-8 px-3.5 text-xs font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#4f46e5] text-white shadow-sm transition-all disabled:opacity-50 gap-1.5"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            {t("generate")} ({selected.length})
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search_students")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-8 pl-8 text-xs bg-white/70"
                            />
                        </div>
                        <div className="flex items-center gap-1 self-end sm:self-auto">
                            {toolbarActions.map(({ Icon, onClick, title }) => (
                                <Button
                                    key={title}
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={onClick}
                                    className="h-8 w-8 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border-gray-200"
                                    title={title}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="w-10"><Checkbox checked={allChecked} onCheckedChange={toggleAll} className="h-3.5 w-3.5" /></TableHead>
                                    {[t("admission_no"), t("student_name"), t("class"), t("father_name"), t("dob"), t("gender"), t("category"), t("mobile_number"), "ID Card Status"].map((h) => (
                                        <TableHead key={h} className="font-semibold text-gray-600"><div className="flex items-center gap-1">{h} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    ))}
                                    <TableHead className="text-right font-semibold text-gray-600">{t("action") || "Action"}</TableHead>
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
                                        <TableCell className="py-3 text-gray-500">{getStudentClassWithSection(s, classes, sections, classId, sectionId)}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.father_name || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.dob ? new Date(s.dob).toLocaleDateString("en-US") : "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.gender || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{getCategoryName(s, categories)}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.phone || "-"}</TableCell>
                                        <TableCell className="py-3">
                                            {assignedIds.includes(s.id) ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold gap-1 shadow-2xs">
                                                    <CheckCircle2 className="h-3 w-3" /> Generated
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-[10px] font-bold gap-1">
                                                    <UserX className="h-3 w-3" /> Unassigned
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    size="icon"
                                                    onClick={() => handlePrintSingle(s)}
                                                    disabled={downloadingId === s.id}
                                                    title={t("print") || "Print ID Card"}
                                                    className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                >
                                                    <Printer className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    onClick={() => handleDownloadSingle(s)}
                                                    disabled={downloadingId === s.id}
                                                    title={t("download_pdf") || "Download PDF"}
                                                    className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                >
                                                    {downloadingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                                </Button>
                                                {assignedIds.includes(s.id) && (
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={() => handleUnassignSingle(s)}
                                                        title="Unassign ID Card"
                                                        className="h-7 w-7 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 rounded p-0 shadow-xs active:scale-95 transition-all"
                                                    >
                                                        <UserX className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="text-xs text-gray-500 font-medium pt-2">
                        {searched && (
                            filtered.length !== students.length && students.length > 0
                                ? `Showing ${filtered.length} of ${students.length} ${students.length === 1 ? "student" : "students"}`
                                : t("showing_x_students", { count: filtered.length }) || `Showing ${filtered.length} students`
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
