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
    Download,
    Loader2,
    ShieldCheck,
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
    type CertificateTemplate,
    type StudentFields,
    type SchoolSettings,
    PREBUILT_CERTIFICATES,
    renderCertificateHtml,
    printCertificate,
    downloadCertificatePdf,
} from "@/lib/certificate";
import { getImageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";

/** Fetch an image URL and return a base64 data URI, using /api/proxy-image to bypass CORS. */
async function fetchImageBase64(url: string | null | undefined): Promise<string> {
    if (!url) return "";
    if (url.startsWith("data:")) return url;
    // Strategy 1: direct fetch (works for same-origin)
    try {
        const res = await fetch(url, { mode: "cors" });
        if (res.ok) {
            const blob = await res.blob();
            if (blob.size > 100) return await blobToBase64(blob);
        }
    } catch { /* CORS blocked – expected for cross-origin */ }
    // Strategy 2: server-side proxy (bypasses CORS entirely)
    try {
        const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
        if (res.ok) {
            const blob = await res.blob();
            if (blob.size > 100) return await blobToBase64(blob);
        }
    } catch { /* proxy also failed */ }
    return url; // fallback: return original URL
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || "");
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
    });
}

interface ClassOption { id: number; name: string; }
interface SectionOption { id: number; name: string; }
interface CategoryOption { id: number; category_name?: string; name?: string; }
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
    category?: string | number;
    student_category_id?: number;
    student_category?: { id?: number; category_name?: string; name?: string };
    studentCategory?: { id?: number; category_name?: string; name?: string };
    phone?: string;
    email?: string;
    roll_no?: string;
    religion?: string;
    current_address?: string;
    admission_date?: string;
    avatar?: string;
    image?: string;
    photo?: string;
    student_photo?: string;
    school_class_id?: number;
    schoolClass?: { name?: string };
    section_id?: number;
    section?: { name?: string };
}

interface IssuedCertificate {
    tc_number: string;
    student_name: string;
    admission_no: string;
    issue_date: string;
    is_reissue: boolean;
    reason?: string;
    meta?: StudentFields;
}

const TABLE_COLS = 12;

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
    return "-";
}

function getStudentClassName(s: ApiStudent, classList: ClassOption[] = [], fallbackClassId = ""): string {
    return s.schoolClass?.name
        || (s as any).school_class?.name
        || (s as any).class_name
        || classList.find((c) => String(c.id) === String(s.school_class_id || fallbackClassId))?.name
        || "";
}

function toFields(
    s: ApiStudent,
    catList: CategoryOption[] = [],
    classList: ClassOption[] = [],
    fallbackClassId = "",
    schoolSettings?: SchoolSettings
): StudentFields {
    const className = getStudentClassName(s, classList, fallbackClassId);
    const sectionName = s.section?.name || (s as any).section_name || "";
    const avatarRaw = s.avatar || s.image || s.photo || s.student_photo || (s as any).avatar_url || null;
    const avatarUrl = avatarRaw ? getImageUrl(avatarRaw) : null;

    return {
        id: s.id,
        name: studentName(s),
        admission_no: s.admission_no || "",
        roll_no: s.roll_no || "",
        class: className,
        grade: className,
        section: sectionName,
        gender: s.gender || "",
        dob: s.dob ? new Date(s.dob).toLocaleDateString("en-US") : "",
        category: getCategoryName(s, catList),
        father_name: s.father_name || "",
        mother_name: s.mother_name || "",
        religion: s.religion || "",
        email: s.email || "",
        phone: s.phone || "",
        present_address: s.current_address || "",
        admission_date: s.admission_date ? new Date(s.admission_date).toLocaleDateString("en-US") : "",
        image: avatarUrl,
        school_name: schoolSettings?.school_name,
        school_logo: schoolSettings?.admin_logo || schoolSettings?.print_logo,
        session: schoolSettings?.current_session,
    };
}

export default function GenerateCertificatePage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [sections, setSections] = useState<SectionOption[]>([]);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
    const [settings, setSettings] = useState<SchoolSettings>({});

    const [classId, setClassId] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [templateId, setTemplateId] = useState("");

    const [students, setStudents] = useState<ApiStudent[]>([]);
    const [studentCertMap, setStudentCertMap] = useState<Record<number, string>>({});
    const [selected, setSelected] = useState<number[]>([]);
    const [reissueIds, setReissueIds] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [bulkDownloading, setBulkDownloading] = useState(false);

    // Verify Certificate dialog
    const [verifyOpen, setVerifyOpen] = useState(false);
    const [verifyInput, setVerifyInput] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<IssuedCertificate | null | "not_found">(null);

    // Reason dialog for reissue
    const [reasonDialogId, setReasonDialogId] = useState<number | null>(null);
    const [reason, setReason] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const [classesRes, categoriesRes, tplRes, setRes, printRes] = await Promise.all([
                    api.get("/academics/classes?no_paginate=true").catch(() => ({ data: { data: [] } })),
                    api.get("/student-categories").catch(() => ({ data: { data: [] } })),
                    api.get("/certificate/student-certificates", { params: { per_page: 100 } }).catch(() => ({ data: { data: [] } })),
                    api.get("/system-setting/general-setting").catch(() => ({ data: { data: {} } })),
                    api.get("/system-setting/print-settings").catch(() => ({ data: { data: [] } })),
                ]);
                setClasses(classesRes.data?.data?.data || classesRes.data?.data || classesRes.data || []);
                setCategories(categoriesRes.data?.data?.data || categoriesRes.data?.data || categoriesRes.data || []);
                const tplData = tplRes.data?.data?.data || tplRes.data?.data || tplRes.data || [];
                const loadedList = Array.isArray(tplData) && tplData.length > 0 ? tplData : PREBUILT_CERTIFICATES;
                setTemplates(loadedList);
                if (loadedList.length > 0) {
                    setTemplateId(String(loadedList[0].id));
                }
                const sData = setRes.data?.data || setRes.data || {};
                const pData = printRes.data?.data || printRes.data || [];
                const generalPurposeTab = Array.isArray(pData)
                    ? pData.find((p: any) => p.type === "General Purpose")
                    : null;

                setSettings({
                    ...sData,
                    school_name: sData.school_name || "OAKRIDGE SCHOOL",
                    admin_logo: sData.admin_logo || "",
                    phone: sData.phone || "",
                    email: sData.email || "",
                    address: sData.address || "",
                    current_session: sData.current_session || "2026 - 2027",
                    general_purpose_header_image: generalPurposeTab?.header_image_url || generalPurposeTab?.header_image || null,
                    general_purpose_footer_content: generalPurposeTab?.footer_content || null,
                    general_purpose_paper_size: generalPurposeTab?.paper_size || "A4",
                });
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
                setSections(res.data?.data?.data || res.data?.data || res.data || []);
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
            const [studentsRes, tcRes] = await Promise.all([
                api.get("/students", {
                    params: { school_class_id: classId, section_id: sectionId || undefined, limit: 500 },
                }),
                api.get("/certificate/transfer-certificates", {
                    params: { school_class_id: classId, section_id: sectionId || undefined, per_page: 500 },
                }).catch(() => ({ data: { data: [] } })),
            ]);
            const data = studentsRes.data?.data?.data || studentsRes.data?.data || studentsRes.data || [];
            setStudents(Array.isArray(data) ? data : []);

            const tcData = tcRes.data?.data?.data || tcRes.data?.data || tcRes.data || [];
            const tcList = Array.isArray(tcData) ? tcData : [];
            const mapping: Record<number, string> = {};
            tcList.forEach((tc: any) => {
                if (tc.student_id && !mapping[tc.student_id]) {
                    mapping[tc.student_id] = tc.tc_number;
                }
            });
            setStudentCertMap(mapping);
            setSelected([]);
            setReissueIds([]);
        } catch {
            tt.error("failed_to_fetch_students");
        } finally {
            setLoading(false);
        }
    };

    const filtered = students.filter((s) =>
        studentName(s).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.admission_no || "").includes(searchTerm) ||
        (studentCertMap[s.id] || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const allChecked = filtered.length > 0 && selected.length === filtered.length;
    const toggleAll = () => setSelected(allChecked ? [] : filtered.map((s) => s.id));
    const toggleOne = (id: number) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    const toggleReissue = (id: number) => setReissueIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

    const processDownloadCertificate = async (student: ApiStudent, isReissue: boolean, customReason: string) => {
        const template = templates.find((t) => String(t.id) === templateId);
        if (!template) {
            toast({ title: t("error"), description: t("select_certificate_template"), variant: "destructive" });
            return;
        }
        setDownloadingId(student.id);
        try {
            const res = await api.post("/certificate/transfer-certificates", {
                student_id: student.id,
                reason: customReason.trim() || undefined,
                is_reissue: isReissue,
            });
            const certData: IssuedCertificate = res.data?.data || res.data;
            const certNumber = certData?.tc_number || "";

            if (certNumber) {
                setStudentCertMap((prev) => ({ ...prev, [student.id]: certNumber }));
            }

            toast({
                title: isReissue
                    ? (t("certificate_reissued") || "Certificate Reissued")
                    : (t("certificate_downloaded") || "Certificate Downloaded"),
                description: `${t("certificate_no") || "Certificate No"}: ${certNumber}`,
            });

            // Pre-convert images to base64 data URIs to avoid CORS in html2canvas
            const avatarRaw = student.avatar || student.image || student.photo || student.student_photo || (student as any).avatar_url || null;
            const logoRaw = settings?.print_logo || settings?.admin_logo || (settings as any)?.app_logo || "";
            const headerRaw = settings?.general_purpose_header_image || "";
            const [logoB64, photoB64, headerB64] = await Promise.all([
                fetchImageBase64(logoRaw ? getImageUrl(logoRaw) : null),
                fetchImageBase64(avatarRaw ? getImageUrl(avatarRaw) : null),
                fetchImageBase64(headerRaw ? getImageUrl(headerRaw) : null),
            ]);

            // Build settings & fields with inline base64 images
            const pdfSettings: SchoolSettings = {
                ...settings,
                print_logo: logoB64.startsWith("data:") ? logoB64 : settings?.print_logo,
                admin_logo: logoB64.startsWith("data:") ? logoB64 : settings?.admin_logo,
                general_purpose_header_image: headerB64.startsWith("data:") ? headerB64 : settings?.general_purpose_header_image,
            };
            const fields: StudentFields = {
                ...toFields(student, categories, classes, classId, pdfSettings),
                tc_number: certNumber,
                reason: customReason.trim() || (certData as any)?.reason || certData?.meta?.reason || "",
                image: photoB64.startsWith("data:") ? photoB64 : getImageUrl(avatarRaw),
                school_logo: logoB64.startsWith("data:") ? logoB64 : (pdfSettings?.admin_logo || pdfSettings?.print_logo),
            };

            const html = renderCertificateHtml(template, fields, pdfSettings);
            const cleanName = (studentName(student) || certNumber || "student").replace(/[^a-zA-Z0-9-_]/g, "_");
            await downloadCertificatePdf(html, `Certificate_${cleanName}.pdf`);

            if (isReissue) {
                setReissueIds((prev) => prev.filter((id) => id !== student.id));
            }
        } catch (err) {
            console.error("Failed to issue/download certificate:", err);
            tt.error("failed_to_download_certificate");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDownloadClick = async (s: ApiStudent) => {
        const isReissue = reissueIds.includes(s.id);
        if (isReissue) {
            setReasonDialogId(s.id);
            setReason("");
        } else {
            await processDownloadCertificate(s, false, "");
        }
    };

    const handleReissueConfirm = async () => {
        const student = students.find((s) => s.id === reasonDialogId);
        if (!student) return;
        const enteredReason = reason;
        setReasonDialogId(null);
        await processDownloadCertificate(student, true, enteredReason);
    };

    const handlePrintSingle = async (s: ApiStudent) => {
        const template = templates.find((t) => String(t.id) === templateId);
        if (!template) {
            toast({ title: t("error"), description: t("select_certificate_template"), variant: "destructive" });
            return;
        }
        const isReissue = reissueIds.includes(s.id);
        setDownloadingId(s.id);
        try {
            const res = await api.post("/certificate/transfer-certificates", {
                student_id: s.id,
                is_reissue: isReissue,
            });
            const certData: IssuedCertificate = res.data?.data || res.data;
            if (certData?.tc_number) {
                setStudentCertMap((prev) => ({ ...prev, [s.id]: certData.tc_number }));
            }
            const fields: StudentFields = {
                ...toFields(s, categories, classes, classId, settings),
                tc_number: certData?.tc_number,
                reason: (certData as any)?.reason || certData?.meta?.reason || "",
            };
            const html = renderCertificateHtml(template, fields, settings);
            printCertificate(html);
            if (isReissue) {
                setReissueIds((prev) => prev.filter((id) => id !== s.id));
            }
        } catch {
            const fields = toFields(s, categories, classes, classId, settings);
            printCertificate(renderCertificateHtml(template, fields, settings));
        } finally {
            setDownloadingId(null);
        }
    };

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
            .map((s) => {
                const fields = {
                    ...toFields(s, categories, classes, classId, settings),
                    tc_number: studentCertMap[s.id] || undefined,
                };
                return `<div style="page-break-after:always;">${renderCertificateHtml(template, fields, settings)}</div>`;
            })
            .join("");
        printCertificate(pages);
    };

    const handleDownloadBulk = async () => {
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
        setBulkDownloading(true);
        try {
            if (chosen.length === 1) {
                await processDownloadCertificate(chosen[0], reissueIds.includes(chosen[0].id), "");
            } else {
                // Pre-convert shared images (logo, header) once for all students
                const logoRaw = settings?.print_logo || settings?.admin_logo || (settings as any)?.app_logo || "";
                const headerRaw = settings?.general_purpose_header_image || "";
                const [logoB64, headerB64] = await Promise.all([
                    fetchImageBase64(logoRaw ? getImageUrl(logoRaw) : null),
                    fetchImageBase64(headerRaw ? getImageUrl(headerRaw) : null),
                ]);
                const pdfSettings: SchoolSettings = {
                    ...settings,
                    print_logo: logoB64.startsWith("data:") ? logoB64 : settings?.print_logo,
                    admin_logo: logoB64.startsWith("data:") ? logoB64 : settings?.admin_logo,
                    general_purpose_header_image: headerB64.startsWith("data:") ? headerB64 : settings?.general_purpose_header_image,
                };

                // Pre-convert each student's photo
                const studentPhotos = await Promise.all(
                    chosen.map((s) => {
                        const avatarRaw = s.avatar || s.image || s.photo || s.student_photo || (s as any).avatar_url || null;
                        return fetchImageBase64(avatarRaw ? getImageUrl(avatarRaw) : null);
                    })
                );

                const pages = chosen
                    .map((s, i) => {
                        const photoB64 = studentPhotos[i];
                        const avatarRaw = s.avatar || s.image || s.photo || s.student_photo || (s as any).avatar_url || null;
                        const fields = {
                            ...toFields(s, categories, classes, classId, pdfSettings),
                            tc_number: studentCertMap[s.id] || undefined,
                            image: photoB64.startsWith("data:") ? photoB64 : getImageUrl(avatarRaw),
                            school_logo: logoB64.startsWith("data:") ? logoB64 : (pdfSettings?.admin_logo || pdfSettings?.print_logo),
                        };
                        return `<div style="page-break-after:always;">${renderCertificateHtml(template, fields, pdfSettings)}</div>`;
                    })
                    .join("");
                const cleanTplName = (template.name || "certificate").replace(/[^a-zA-Z0-9-_]/g, "_");
                await downloadCertificatePdf(pages, `Certificates_${cleanTplName}_${chosen.length}_students.pdf`);
                toast({
                    title: t("certificates_downloaded") || "Certificates Downloaded",
                    description: `${chosen.length} certificates generated`,
                });
            }
        } catch (err) {
            console.error("Failed to download bulk certificates:", err);
            tt.error("failed_to_download_certificate");
        } finally {
            setBulkDownloading(false);
        }
    };

    const handleVerify = async () => {
        if (!verifyInput.trim()) return;
        setVerifying(true);
        setVerifyResult(null);
        try {
            const res = await api.get("/certificate/transfer-certificates/verify", { params: { tc_number: verifyInput.trim() } });
            setVerifyResult(res.data.data as IssuedCertificate);
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            setVerifyResult(status === 404 ? "not_found" : null);
            if (status !== 404) {
                tt.error("failed_to_verify_certificate");
            }
        } finally {
            setVerifying(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(filtered.map((s) => `${s.admission_no || ""}\t${studentName(s)}\t${studentCertMap[s.id] || ""}\t${getCategoryName(s, categories)}`).join("\n"));
        tt.success("data_copied_to_clipboard");
    };
    const handleExportCSV = () => {
        const rows = [[t("admission_no"), t("name"), t("certificate_no") || "Certificate No", t("class"), t("father_name"), t("dob"), t("gender"), t("category"), t("mobile")],
            ...filtered.map((s) => {
                const clsName = getStudentClassName(s, classes, classId);
                const secName = s.section?.name || (s as any).section_name || "";
                const classDisplay = clsName ? (secName ? `${clsName} (${secName})` : clsName) : (secName ? `(${secName})` : "");
                return [
                    s.admission_no || "",
                    studentName(s),
                    studentCertMap[s.id] || "",
                    classDisplay,
                    s.father_name || "",
                    s.dob || "",
                    s.gender || "",
                    getCategoryName(s, categories),
                    s.phone || ""
                ];
            })];
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
            {/* Criteria & Header */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FileBadge className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("generate_certificate")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("generate_certificate_description")}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { setVerifyOpen(true); setVerifyResult(null); setVerifyInput(""); }}
                        className="h-9 px-4 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                        <ShieldCheck className="h-4 w-4" /> {t("verify_certificate") || "Verify Certificate"}
                    </Button>
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
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FileText className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{selected.length} of {filtered.length} Selected</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button onClick={handleGenerate} disabled={selected.length === 0} className="h-9 px-4 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-40">
                            <Printer className="h-3.5 w-3.5" /> {t("print") || "Print"}
                        </Button>
                        <Button onClick={handleDownloadBulk} disabled={selected.length === 0 || bulkDownloading} className="h-9 px-4 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-40">
                            {bulkDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} {t("download") || "Download"}
                        </Button>
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
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="w-10"><Checkbox checked={allChecked} onCheckedChange={toggleAll} className="h-3.5 w-3.5" /></TableHead>
                                    {[
                                        t("admission_no"),
                                        t("student_name"),
                                        t("certificate_no") || "Certificate No",
                                        t("class"),
                                        t("father_name"),
                                        t("dob"),
                                        t("gender"),
                                        t("category"),
                                        t("mobile_number"),
                                    ].map((h) => (
                                        <TableHead key={h} className="font-semibold text-gray-600"><div className="flex items-center gap-1">{h} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    ))}
                                    <TableHead className="font-semibold text-gray-600 text-center">{t("reissue") || "Reissue"}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">{t("action") || "Action"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows />
                                ) : !searched ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("select_criteria_and_search_to_list")}</TableCell></TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_students_found")}</TableCell></TableRow>
                                ) : filtered.map((s) => {
                                    const clsName = getStudentClassName(s, classes, classId);
                                    const secName = s.section?.name || (s as any).section_name || "";
                                    const classDisplay = clsName ? (secName ? `${clsName} (${secName})` : clsName) : (secName ? `(${secName})` : "-");
                                    const catName = getCategoryName(s, categories);

                                    return (
                                        <TableRow key={s.id} className={cn("text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap", downloadingId === s.id && "opacity-60 pointer-events-none")}>
                                            <TableCell className="py-3"><Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggleOne(s.id)} className="h-3.5 w-3.5" /></TableCell>
                                            <TableCell className="py-3 text-gray-700 font-medium">{s.admission_no || "-"}</TableCell>
                                            <TableCell className="py-3 text-[#6366f1] font-medium">{studentName(s)}</TableCell>
                                            <TableCell className="py-3">
                                                {studentCertMap[s.id] ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        {studentCertMap[s.id]}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 font-normal italic text-[11px]">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-700 font-medium">{classDisplay}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{s.father_name || "-"}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{s.dob ? new Date(s.dob).toLocaleDateString("en-US") : "-"}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{s.gender || "-"}</TableCell>
                                            <TableCell className="py-3 text-gray-700 font-medium">{catName}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{s.phone || "-"}</TableCell>
                                            <TableCell className="py-3 text-center">
                                                <Checkbox checked={reissueIds.includes(s.id)} onCheckedChange={() => toggleReissue(s.id)} className="h-3.5 w-3.5 border-gray-300" />
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        size="icon"
                                                        onClick={() => handlePrintSingle(s)}
                                                        title={t("print") || "Print Certificate"}
                                                        className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                    >
                                                        <Printer className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        onClick={() => handleDownloadClick(s)}
                                                        disabled={downloadingId === s.id}
                                                        title={t("download_pdf") || "Download PDF"}
                                                        className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                    >
                                                        {downloadingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="text-xs text-gray-500 font-medium pt-2">
                        {searched && (
                            filtered.length !== students.length && students.length > 0
                                ? `Showing ${filtered.length} of ${students.length} ${students.length === 1 ? "student" : "students"}`
                                : `Showing ${filtered.length} ${filtered.length === 1 ? "student" : "students"}`
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Verify Certificate Dialog */}
            <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-indigo-500" /> {t("verify_certificate") || "Verify Certificate"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-gray-500 uppercase">{t("certificate_no") || "Certificate Number"}</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="TC-2026-0001 or CERT-0001"
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
                                <XCircle className="h-4 w-4 shrink-0" /> {t("no_certificate_found_with_that_number") || "No certificate found with that number."}
                            </div>
                        )}
                        {verifyResult && verifyResult !== "not_found" && (
                            <div className="rounded-lg border border-green-100 bg-green-50 p-4 space-y-2">
                                <div className="flex items-center gap-2 text-green-700 font-bold text-xs">
                                    <CheckCircle2 className="h-4 w-4" /> {t("certificate_verified") || "Certificate Verified"}
                                    {verifyResult.is_reissue && <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">{t("reissue") || "Reissue"}</span>}
                                </div>
                                {([
                                    [t("certificate_no") || "Certificate No", verifyResult.tc_number],
                                    [t("student") || "Student", verifyResult.student_name],
                                    [t("admission_no") || "Admission No", verifyResult.admission_no],
                                    [t("issue_date") || "Issue Date", verifyResult.issue_date ? new Date(verifyResult.issue_date).toLocaleDateString("en-US") : "-"],
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

            {/* Reissue Reason dialog */}
            <AlertDialog open={reasonDialogId !== null} onOpenChange={(o) => !o && setReasonDialogId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("reissue_certificate") || "Reissue Certificate"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("issue_certificate_reason_description") || "Enter the reason for re-issuing this certificate. A new certificate number will be assigned."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Input
                        placeholder={t("reason_optional") || "Reason (Optional)"}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="mt-1 text-xs h-9"
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReissueConfirm}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white"
                        >
                            {t("issue_and_download") || "Issue & Download"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
