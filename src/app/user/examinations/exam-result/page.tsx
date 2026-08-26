"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import {
    Printer,
    Download,
    Loader2,
    FileText,
    Award,
    Percent,
    Trophy,
    Layers,
    Sigma,
    GraduationCap,
    ChevronDown,
    ChevronUp,
    Star,
    CheckCircle2,
    XCircle,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useSettings } from "@/components/providers/settings-provider";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { getImageUrl } from "@/lib/image-url";

type Subject = {
    id: number;
    name: string;
    max: string;
    min: string;
    theory?: string;
    practical?: string;
    obtained: string;
    result: "Pass" | "Fail";
    grade: string;
    grade_point?: string;
    note: string;
};

type StudentInfo = {
    name: string;
    admission_no: string;
    roll_no: string;
    father_name: string;
    mother_name: string;
    dob: string;
    gender: string;
    class: string;
    section: string;
    photo?: string;
};

type GradeScaleItem = {
    name: string;
    percent_from: number;
    percent_upto: number;
    grade_point: number;
    description: string;
};

type ExamResult = {
    exam_id: number;
    exam_name: string;
    session?: string;
    exam_type: string;
    is_grading: boolean;
    student?: StudentInfo;
    subjects: Subject[];
    summary: {
        percentage: string;
        result: "Pass" | "Fail";
        division: string;
        grade: string;
        grade_point?: string;
        grand_total: string;
        total_obtained: string;
    };
    grading_scale?: GradeScaleItem[];
};

export default function UserExaminationsResultPage() {
    const { t } = useTranslation();
    const [results, setResults] = useState<ExamResult[]>([]);
    const [studentProfile, setStudentProfile] = useState<StudentInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [printingId, setPrintingId] = useState<number | null>(null);
    const [expandedGradingExamId, setExpandedGradingExamId] = useState<number | null>(null);
    const { toast } = useToast();
    const { settings } = useSettings();
    const printIframeRef = useRef<HTMLIFrameElement | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const [resResult, resProfile] = await Promise.allSettled([
                    api.get("/user/exam-results"),
                    api.get("/user/profile").catch(() => null),
                ]);

                if (!isMounted) return;

                if (resResult.status === "fulfilled" && resResult.value?.data) {
                    const rawData = resResult.value.data?.data ?? resResult.value.data ?? [];
                    const list: ExamResult[] = Array.isArray(rawData) ? rawData : (rawData.data || []);
                    setResults(list);
                } else {
                    toast({
                        variant: "destructive",
                        title: t("error"),
                        description: t("failed_to_load_exam_results"),
                    });
                }

                if (resProfile.status === "fulfilled" && resProfile.value?.data) {
                    const pData = resProfile.value.data?.data ?? resProfile.value.data;
                    if (pData?.basic) {
                        const b = pData.basic;
                        const pTab = pData.profileTab?.basicDetails;
                        const pParent = pData.profileTab?.parentGuardianDetails;
                        setStudentProfile({
                            name: b.name || "",
                            admission_no: b.admissionNo || "",
                            roll_no: b.rollNumber || "",
                            father_name: pParent?.father?.name || "",
                            mother_name: pParent?.mother?.name || "",
                            dob: pTab?.dateOfBirth || "",
                            gender: b.gender || "",
                            class: b.class || "",
                            section: b.section || "",
                            photo: b.image || "",
                        });
                    }
                }
            } catch {
                if (isMounted) {
                    toast({
                        variant: "destructive",
                        title: t("error"),
                        description: t("failed_to_load_exam_results"),
                    });
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [toast, t]);

    // Helper: Convert image URL to base64 for jsPDF with multi-stage fallback
    const loadImageAsBase64 = async (rawUrl: string): Promise<string | undefined> => {
        if (!rawUrl || rawUrl === "-" || rawUrl.includes("undefined")) return undefined;
        if (rawUrl.startsWith("data:")) return rawUrl;

        // 1. Try Image element + Canvas (handles client-accessible images and base64)
        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    try {
                        const canvas = document.createElement("canvas");
                        canvas.width = img.naturalWidth || img.width;
                        canvas.height = img.naturalHeight || img.height;
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL("image/png"));
                        } else {
                            reject(new Error("Canvas context null"));
                        }
                    } catch (e) {
                        reject(e);
                    }
                };
                img.onerror = (e) => reject(e);
                img.src = rawUrl;
            });
            if (base64 && base64.startsWith("data:image/")) {
                return base64;
            }
        } catch {
            // Proceed to direct fetch
        }

        // 2. Try direct fetch
        try {
            const res = await fetch(rawUrl);
            if (res.ok) {
                const blob = await res.blob();
                if (blob.size > 40) {
                    return await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                }
            }
        } catch {
            // Proceed to proxy fetch
        }

        // 3. Try Next.js server-side image proxies
        for (const endpoint of ["/api/proxy-image", "/api/camera-proxy"]) {
            try {
                const proxyUrl = `${endpoint}?url=${encodeURIComponent(rawUrl)}`;
                const res = await fetch(proxyUrl);
                if (res.ok) {
                    const blob = await res.blob();
                    if (blob.size > 40) {
                        const b64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                        if (b64 && b64.startsWith("data:image/")) {
                            return b64;
                        }
                    }
                }
            } catch {
                // Try next proxy
            }
        }

        return undefined;
    };

    // Build comprehensive vector PDF Marksheet
    const buildMarksheetPdf = async (exam: ExamResult): Promise<jsPDF> => {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = 14;
        const contentWidth = pageWidth - marginX * 2;
        let y = 14;

        // 1. Header with Logo and School Information
        const rawLogo = settings?.print_logo || settings?.app_logo || settings?.admin_logo || settings?.logo;
        let logoBase64: string | undefined;
        if (rawLogo) {
            const fullLogoUrl = getImageUrl(rawLogo, settings?.base_url);
            logoBase64 = await loadImageAsBase64(fullLogoUrl);
        }

        let leftY = y;
        let rightY = y;

        if (logoBase64 && logoBase64.startsWith("data:image/")) {
            try {
                const ext = logoBase64.includes("png") ? "PNG" : "JPEG";
                const imgProps = doc.getImageProperties(logoBase64);
                const maxW = 44;
                const maxH = 18;
                let imgW = maxW;
                let imgH = (imgProps.height / imgProps.width) * imgW;
                if (imgH > maxH) {
                    imgH = maxH;
                    imgW = (imgProps.width / imgProps.height) * imgH;
                }
                doc.addImage(logoBase64, ext, marginX, leftY, imgW, imgH);
                leftY += imgH + 2.5;
            } catch {
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(99, 102, 241);
                doc.text("iSCHOOL", marginX, leftY + 5);
                leftY += 8;
            }
        } else {
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(99, 102, 241);
            doc.text("iSCHOOL", marginX, leftY + 5);
            leftY += 8;
        }

        // School Name
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        const schoolName = settings?.school_name || "Bhujpur Government Primary School";
        doc.text(schoolName, marginX, leftY + 4);
        leftY += 8;

        // Right side school contact details
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);

        const rightX = pageWidth - marginX;
        if (settings?.address) {
            doc.text(`Address: ${settings.address}`, rightX, rightY + 3.5, { align: "right" });
            rightY += 4.2;
        }
        if (settings?.phone) {
            doc.text(`Phone: ${settings.phone}`, rightX, rightY + 3.5, { align: "right" });
            rightY += 4.2;
        }
        if (settings?.email) {
            doc.text(`Email: ${settings.email}`, rightX, rightY + 3.5, { align: "right" });
            rightY += 4.2;
        }
        const website = settings?.frontend_url || (typeof window !== "undefined" ? window.location.host : "") || "ischool.mddoulat.com";
        if (website) {
            doc.text(`Website: ${website.replace(/^https?:\/\//, "")}`, rightX, rightY + 3.5, { align: "right" });
            rightY += 4.2;
        }

        y = Math.max(leftY + 2, rightY + 2);

        // Header Title Banner Bar
        doc.setFillColor(67, 56, 202); // indigo-700
        doc.roundedRect(marginX, y, contentWidth, 8, 1.5, 1.5, "F");
        doc.setFontSize(10.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("OFFICIAL ACADEMIC MARK SHEET", pageWidth / 2, y + 5.5, { align: "center" });
        doc.setTextColor(0, 0, 0);
        y += 12;

        // Exam Title Subheading
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        const examTitle = exam.session ? `${exam.exam_name} (${exam.session})` : exam.exam_name;
        doc.text(examTitle, marginX, y);

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(`Evaluation Type: ${exam.exam_type || "Grading System"}`, rightX, y, { align: "right" });
        y += 5;

        // 2. Student Information Box
        const student = exam.student || studentProfile;
        const studentBoxHeight = 26;
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.roundedRect(marginX, y, contentWidth, studentBoxHeight, 2, 2, "FD");

        const col1X = marginX + 4;
        const col2X = marginX + contentWidth * 0.38;
        const col3X = marginX + contentWidth * 0.72;

        const renderField = (label: string, value: string, xPos: number, yPos: number) => {
            doc.setFontSize(7.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(100, 116, 139);
            doc.text(label.toUpperCase(), xPos, yPos);

            doc.setFontSize(8.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text(value || "—", xPos, yPos + 4);
        };

        // Row 1
        renderField("Student Name", student?.name || "Student", col1X, y + 5);
        renderField("Roll Number", student?.roll_no || "—", col2X, y + 5);
        renderField("Admission No", student?.admission_no || "—", col3X, y + 5);

        // Row 2
        const classSection = student?.class ? `${student.class}${student.section ? ` (${student.section})` : ""}` : "—";
        renderField("Class & Section", classSection, col1X, y + 16);
        renderField("Father's Name", student?.father_name || "—", col2X, y + 16);
        renderField("Date of Birth", student?.dob ? new Date(student.dob).toLocaleDateString("en-GB") : "—", col3X, y + 16);

        y += studentBoxHeight + 6;

        // 3. Subject-wise Marks Table (autoTable)
        const tableColumns = ["#", "SUBJECT NAME", "MAX MARKS", "MIN MARKS", "MARKS OBTAINED", "GRADE / GPA", "RESULT / NOTE"];
        const tableRows = exam.subjects.map((s, idx) => {
            const gradeDisplay = s.grade
                ? (s.grade_point ? `${s.grade} (${s.grade_point})` : s.grade)
                : "—";
            const resultNote = s.obtained === "Absent" ? "Absent" : `${s.result}${s.note ? ` - ${s.note}` : ""}`;
            return [
                String(idx + 1),
                s.name,
                s.max || "100.00",
                s.min || "33.00",
                s.obtained === "Absent" ? "ABSENT" : s.obtained,
                gradeDisplay,
                resultNote,
            ];
        });

        autoTable(doc, {
            head: [tableColumns],
            body: tableRows,
            startY: y,
            margin: { left: marginX, right: marginX },
            theme: "grid",
            headStyles: {
                fillColor: [67, 56, 202], // Indigo-700
                textColor: 255,
                fontStyle: "bold",
                fontSize: 8.5,
                halign: "center",
                cellPadding: 2.5,
            },
            bodyStyles: {
                fontSize: 8,
                textColor: [30, 41, 59],
                cellPadding: 2.5,
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252],
            },
            columnStyles: {
                0: { halign: "center", cellWidth: 10 },
                1: { halign: "left", fontStyle: "bold" },
                2: { halign: "center", cellWidth: 24 },
                3: { halign: "center", cellWidth: 24 },
                4: { halign: "center", cellWidth: 30, fontStyle: "bold" },
                5: { halign: "center", cellWidth: 28, fontStyle: "bold" },
                6: { halign: "left", cellWidth: 32 },
            },
            didParseCell: (data) => {
                if (data.section === "body" && data.column.index === 4) {
                    if (data.cell.raw === "ABSENT") {
                        data.cell.styles.textColor = [220, 38, 38];
                        data.cell.styles.fontStyle = "bold";
                    }
                }
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalTableY = (doc as any).lastAutoTable?.finalY || y + 50;
        y = finalTableY + 5;

        // 4. Performance Summary Badges (5 Cards)
        const summaryCols = 5;
        const summaryCardW = (contentWidth - (summaryCols - 1) * 3) / summaryCols;
        const summaryCardH = 16;

        const summaryItems = [
            { label: "Grand Total", val: exam.summary.grand_total || "—", color: [99, 102, 241] },
            { label: "Marks Obtained", val: exam.summary.total_obtained || "—", color: [79, 70, 229] },
            { label: "Percentage", val: `${exam.summary.percentage}%`, color: [16, 185, 129] },
            {
                label: "Grade / GPA",
                val: exam.summary.grade ? `${exam.summary.grade}${exam.summary.grade_point ? ` (${exam.summary.grade_point})` : ""}` : (exam.summary.division || "—"),
                color: [249, 115, 22],
            },
            {
                label: "Final Result",
                val: exam.summary.result.toUpperCase(),
                color: exam.summary.result === "Pass" ? [22, 163, 74] : [220, 38, 38],
            },
        ];

        summaryItems.forEach((item, idx) => {
            const cardX = marginX + idx * (summaryCardW + 3);
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(cardX, y, summaryCardW, summaryCardH, 2, 2, "FD");

            doc.setFontSize(6.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(100, 116, 139);
            doc.text(item.label.toUpperCase(), cardX + summaryCardW / 2, y + 5, { align: "center" });

            doc.setFontSize(9.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(item.color[0], item.color[1], item.color[2]);
            doc.text(item.val, cardX + summaryCardW / 2, y + 12, { align: "center" });
        });

        y += summaryCardH + 5;

        // 5. Grading System Scale Reference Box (if grading scale is present)
        if (exam.grading_scale && exam.grading_scale.length > 0) {
            doc.setFontSize(7.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(71, 85, 105);
            doc.text("GRADING SYSTEM SCALE REFERENCE:", marginX, y + 3);
            y += 5;

            const scaleCols = ["Grade", "Marks Range (%)", "Grade Point (GPA)", "Remarks"];
            const scaleRows = exam.grading_scale.map((g) => [
                g.name,
                `${g.percent_from}% - ${g.percent_upto}%`,
                g.grade_point.toFixed(2),
                g.description || "—",
            ]);

            autoTable(doc, {
                head: [scaleCols],
                body: scaleRows,
                startY: y,
                margin: { left: marginX, right: marginX },
                theme: "plain",
                headStyles: {
                    fillColor: [241, 245, 249],
                    textColor: [71, 85, 105],
                    fontStyle: "bold",
                    fontSize: 7,
                    halign: "center",
                    cellPadding: 1.5,
                },
                bodyStyles: {
                    fontSize: 6.5,
                    textColor: [100, 116, 139],
                    halign: "center",
                    cellPadding: 1.2,
                },
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const scaleFinalY = (doc as any).lastAutoTable?.finalY || y + 20;
            y = scaleFinalY + 3;
        }

        // 6. Signatures Block & Printing Date
        const footerY = Math.max(y + 12, pageHeight - 26);
        const sigWidth = contentWidth / 3;
        const sigLineW = 40;

        const signatures = [
            { label: "Class Teacher", x: marginX + sigWidth * 0.5 },
            { label: "Exam Controller", x: marginX + sigWidth * 1.5 },
            { label: "Principal / Headmaster", x: marginX + sigWidth * 2.5 },
        ];

        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.5);

        signatures.forEach((sig) => {
            doc.line(sig.x - sigLineW / 2, footerY, sig.x + sigLineW / 2, footerY);
            doc.setFontSize(7.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(71, 85, 105);
            doc.text(sig.label, sig.x, footerY + 4, { align: "center" });
        });

        // Bottom timestamp
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        const printedDate = `Generated on: ${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        doc.text(printedDate, marginX, pageHeight - 6);
        doc.text("Official Digital Mark Sheet Verification", rightX, pageHeight - 6, { align: "right" });

        return doc;
    };

    // Handle PDF Download
    const handleDownloadMarksheet = async (exam: ExamResult) => {
        setDownloadingId(exam.exam_id);
        try {
            const doc = await buildMarksheetPdf(exam);
            const cleanExamName = (exam.exam_name || "Exam").replace(/[^a-zA-Z0-9_-]/g, "_");
            const studentId = exam.student?.admission_no || exam.student?.roll_no || studentProfile?.admission_no || "Student";
            const filename = `Marksheet_${cleanExamName}_${studentId}.pdf`;
            doc.save(filename);
            toast({
                title: t("success") || "Downloaded",
                description: `${exam.exam_name} marksheet PDF downloaded successfully.`,
            });
        } catch (err) {
            console.error("PDF Download error:", err);
            toast({
                variant: "destructive",
                title: t("error"),
                description: "Failed to generate marksheet PDF. Please try again.",
            });
        } finally {
            setDownloadingId(null);
        }
    };

    // Handle Direct PDF Print
    const handlePrintMarksheet = async (exam: ExamResult) => {
        setPrintingId(exam.exam_id);
        try {
            const doc = await buildMarksheetPdf(exam);
            doc.autoPrint();
            const blob = doc.output("blob");
            const blobUrl = URL.createObjectURL(blob);

            if (printIframeRef.current) {
                printIframeRef.current.src = blobUrl;
                printIframeRef.current.onload = () => {
                    setTimeout(() => {
                        try {
                            printIframeRef.current?.contentWindow?.focus();
                            printIframeRef.current?.contentWindow?.print();
                        } catch {
                            window.open(blobUrl, "_blank");
                        }
                        setPrintingId(null);
                    }, 200);
                };
            } else {
                window.open(blobUrl, "_blank");
                setPrintingId(null);
            }
        } catch (err) {
            console.error("PDF Print error:", err);
            toast({
                variant: "destructive",
                title: t("error"),
                description: "Failed to print marksheet. Please try downloading instead.",
            });
            setPrintingId(null);
        }
    };

    const ResultPill = ({ result }: { result: "Pass" | "Fail" }) => (
        <span
            className={cn(
                "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-xs tracking-wide",
                result === "Pass" ? "bg-emerald-500" : "bg-rose-500"
            )}
        >
            {t(result === "Pass" ? "pass" : "fail")}
        </span>
    );

    return (
        /* pb-32 sm:pb-16 ensures bottom content is never overlapped by mobile navigation bar */
        <div className="p-3 sm:p-5 lg:p-6 animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-32 sm:pb-16">
            {/* Hidden iframe for reliable PDF direct printing without page reloads */}
            <iframe ref={printIframeRef} className="hidden" title="print_frame" />

            <Card className="shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Page Header (Clean title without Print All button) ── */}
                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Award className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">
                                {t("exam_result")}
                            </h1>
                            <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-gray-400 mt-1">
                                {loading
                                    ? t("loading_results")
                                    : `${results.length} published result${results.length === 1 ? "" : "s"}`}
                            </p>
                        </div>
                    </div>
                </div>

                <CardContent className="p-3 sm:p-5 lg:p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <span className="text-sm font-medium">{t("loading_results")}</span>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <FileText className="h-12 w-12 opacity-30 mb-3" />
                            <p className="text-base font-semibold text-gray-600 dark:text-gray-300">
                                {t("no_published_exam_results")}
                            </p>
                            <p className="text-sm mt-1 text-gray-400">{t("results_appear_here_once_published")}</p>
                        </div>
                    ) : (
                        results.map((exam) => {
                            const summaryTiles = [
                                {
                                    icon: Percent,
                                    label: t("percentage"),
                                    value: `${exam.summary.percentage}%`,
                                    color: "text-emerald-600",
                                },
                                {
                                    icon: Layers,
                                    label: t("division"),
                                    value: exam.summary.division || "—",
                                    color: "text-sky-600",
                                },
                                {
                                    icon: Award,
                                    label: t("grade") || "Grade",
                                    value: exam.summary.grade || "—",
                                    color: "text-orange-600",
                                },
                                {
                                    icon: Star,
                                    label: "GPA / Point",
                                    value: exam.summary.grade_point || (exam.summary.grade ? "—" : "—"),
                                    color: "text-amber-600",
                                },
                                {
                                    icon: Sigma,
                                    label: t("grand_total"),
                                    value: exam.summary.grand_total,
                                    color: "text-indigo-600",
                                },
                                {
                                    icon: Trophy,
                                    label: t("obtained"),
                                    value: exam.summary.total_obtained,
                                    color: "text-violet-600",
                                },
                            ];

                            const isDownloading = downloadingId === exam.exam_id;
                            const isPrinting = printingId === exam.exam_id;
                            const isGradingOpen = expandedGradingExamId === exam.exam_id;

                            return (
                                <div
                                    key={exam.exam_id}
                                    className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm break-inside-avoid bg-white dark:bg-gray-900 transition-all hover:border-indigo-200 dark:hover:border-indigo-900/50"
                                >
                                    {/* ── Exam Header Bar (Fully Mobile Responsive) ── */}
                                    <div className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] px-3.5 sm:px-4 py-3 text-white flex flex-wrap items-center justify-between gap-2.5 shadow-xs">
                                        <div className="flex items-center gap-2 min-w-0 pr-1">
                                            <Award className="h-5 w-5 shrink-0 text-white/90" />
                                            <div className="min-w-0">
                                                <span className="font-bold text-[13.5px] sm:text-[15px] block truncate">
                                                    {exam.exam_name}
                                                </span>
                                                {exam.session && (
                                                    <span className="text-white/80 font-medium text-[11px] block sm:inline sm:ml-2">
                                                        ({exam.session})
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 ml-auto shrink-0">
                                            {/* Download Marksheet Button */}
                                            <Button
                                                onClick={() => handleDownloadMarksheet(exam)}
                                                disabled={isDownloading || isPrinting}
                                                size="sm"
                                                className="h-8 px-2.5 sm:px-3 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm border border-white/25 transition-all active:scale-95 flex items-center gap-1.5 shadow-xs"
                                                title="Download PDF Marksheet"
                                            >
                                                {isDownloading ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Download className="h-3.5 w-3.5" />
                                                )}
                                                <span className="hidden sm:inline">
                                                    {isDownloading ? "Generating..." : "Download Marksheet"}
                                                </span>
                                                <span className="sm:hidden">Marksheet</span>
                                            </Button>

                                            {/* Print Button */}
                                            <Button
                                                onClick={() => handlePrintMarksheet(exam)}
                                                disabled={isDownloading || isPrinting}
                                                size="sm"
                                                className="h-8 px-2 sm:px-3 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm border border-white/25 transition-all active:scale-95 flex items-center gap-1.5 shadow-xs"
                                                title="Print Marksheet"
                                            >
                                                {isPrinting ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Printer className="h-3.5 w-3.5" />
                                                )}
                                                <span className="hidden sm:inline">Print</span>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Desktop Table View (lg+) */}
                                    <div className="hidden lg:block overflow-x-auto">
                                        <Table className="min-w-[760px]">
                                            <TableHeader>
                                                <TableRow className="bg-gray-50/80 dark:bg-gray-800/60 hover:bg-gray-50/80 border-b border-gray-200 dark:border-gray-700">
                                                    <TableHead className="w-[220px] text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300 py-3">
                                                        {t("subject")}
                                                    </TableHead>
                                                    <TableHead className="text-center text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300 py-3">
                                                        {t("max_marks")}
                                                    </TableHead>
                                                    <TableHead className="text-center text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300 py-3">
                                                        {t("min_marks")}
                                                    </TableHead>
                                                    <TableHead className="text-center text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300 py-3">
                                                        {t("marks_obtained")}
                                                    </TableHead>
                                                    <TableHead className="text-center text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300 py-3">
                                                        {t("grade") || "Grade"}
                                                    </TableHead>
                                                    <TableHead className="text-center text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300 py-3">
                                                        GPA
                                                    </TableHead>
                                                    <TableHead className="text-center text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300 py-3">
                                                        {t("result")}
                                                    </TableHead>
                                                    <TableHead className="text-right text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300 py-3 pr-6">
                                                        {t("note")}
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {exam.subjects.map((s) => (
                                                    <TableRow
                                                        key={s.id}
                                                        className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors border-b border-gray-100 dark:border-gray-800"
                                                    >
                                                        <TableCell className="text-[13px] text-gray-800 dark:text-gray-200 py-3.5 font-semibold">
                                                            {s.name}
                                                        </TableCell>
                                                        <TableCell className="text-center text-[13px] text-gray-600 dark:text-gray-400 py-3.5">
                                                            {s.max}
                                                        </TableCell>
                                                        <TableCell className="text-center text-[13px] text-gray-600 dark:text-gray-400 py-3.5">
                                                            {s.min}
                                                        </TableCell>
                                                        <TableCell
                                                            className={cn(
                                                                "text-center text-[13px] py-3.5 font-bold",
                                                                s.obtained === "Absent"
                                                                    ? "text-red-500 italic font-medium"
                                                                    : "text-gray-900 dark:text-gray-100"
                                                            )}
                                                        >
                                                            {s.obtained}
                                                        </TableCell>
                                                        <TableCell className="text-center text-[13px] py-3.5 font-bold text-orange-600 dark:text-orange-400">
                                                            {s.grade || "—"}
                                                        </TableCell>
                                                        <TableCell className="text-center text-[13px] py-3.5 font-semibold text-gray-700 dark:text-gray-300">
                                                            {s.grade_point || "—"}
                                                        </TableCell>
                                                        <TableCell className="text-center text-[13px] py-3.5">
                                                            <ResultPill result={s.result} />
                                                        </TableCell>
                                                        <TableCell className="text-right text-[13px] text-gray-500 dark:text-gray-400 py-3.5 pr-6">
                                                            {s.note || "—"}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Mobile Cards View (<lg) */}
                                    <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                        {exam.subjects.map((s) => (
                                            <div key={s.id} className="p-3.5 sm:p-4 space-y-2.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[13.5px] font-bold text-gray-800 dark:text-gray-200">
                                                        {s.name}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        {s.grade && (
                                                            <span className="text-[11.5px] font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 rounded-full px-2 py-0.5">
                                                                Grade: {s.grade}
                                                            </span>
                                                        )}
                                                        <ResultPill result={s.result} />
                                                    </div>
                                                </div>

                                                <div className="rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 px-3.5 py-2">
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                                                        <div className="flex items-center justify-between py-0.5">
                                                            <span className="text-gray-500 dark:text-gray-400">{t("max")}</span>
                                                            <span className="font-semibold text-gray-700 dark:text-gray-200">{s.max}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between py-0.5">
                                                            <span className="text-gray-500 dark:text-gray-400">{t("min")}</span>
                                                            <span className="font-semibold text-gray-700 dark:text-gray-200">{s.min}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between py-0.5">
                                                            <span className="text-gray-500 dark:text-gray-400">GPA</span>
                                                            <span className="font-semibold text-gray-700 dark:text-gray-200">{s.grade_point || "—"}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between py-0.5">
                                                            <span className="text-gray-700 dark:text-gray-300 font-semibold">{t("obtained")}</span>
                                                            <span
                                                                className={cn(
                                                                    "font-bold text-[13px]",
                                                                    s.obtained === "Absent"
                                                                        ? "text-red-500 italic"
                                                                        : "text-indigo-600 dark:text-indigo-400"
                                                                )}
                                                            >
                                                                {s.obtained}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {s.note && (
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                        {t("note")}: {s.note}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* ── Performance Summary Tiles ── */}
                                    <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 p-3 sm:p-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-2.5">
                                            {summaryTiles.map((tile, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-2.5 shadow-xs"
                                                >
                                                    <span
                                                        className={cn(
                                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10",
                                                            tile.color
                                                        )}
                                                    >
                                                        <tile.icon className="h-4 w-4" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-none">
                                                            {tile.label}
                                                        </p>
                                                        <p className={cn("text-[13.5px] sm:text-[14px] font-bold mt-0.5 truncate", tile.color)}>
                                                            {tile.value}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Overall Result Status Badge */}
                                            <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-2.5 shadow-xs col-span-2 sm:col-span-1">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-none mb-1">
                                                        {t("result")}
                                                    </p>
                                                    <ResultPill result={exam.summary.result} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Grading System Reference Accordion / Card ── */}
                                        {exam.grading_scale && exam.grading_scale.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200/70 dark:border-gray-700/60">
                                                <button
                                                    onClick={() => setExpandedGradingExamId(isGradingOpen ? null : exam.exam_id)}
                                                    className="w-full flex items-center justify-between p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40 text-left transition-colors hover:bg-indigo-50"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                        <span className="text-[12px] font-bold text-indigo-900 dark:text-indigo-200">
                                                            Grading System & Scale Reference
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                                        <span>{isGradingOpen ? "Hide" : "View Scale"}</span>
                                                        {isGradingOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                    </div>
                                                </button>

                                                {isGradingOpen && (
                                                    <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 animate-in fade-in duration-200">
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left text-[11px]">
                                                                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                                                                    <tr>
                                                                        <th className="py-2 px-3">Grade</th>
                                                                        <th className="py-2 px-3">Marks Range (%)</th>
                                                                        <th className="py-2 px-3 text-center">Grade Point (GPA)</th>
                                                                        <th className="py-2 px-3 text-right">Remarks</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                                    {exam.grading_scale.map((scale, sIdx) => (
                                                                        <tr key={sIdx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                                                                            <td className="py-2 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                                                                                {scale.name}
                                                                            </td>
                                                                            <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                                                                                {scale.percent_from}% — {scale.percent_upto}%
                                                                            </td>
                                                                            <td className="py-2 px-3 text-center font-bold text-gray-800 dark:text-gray-200">
                                                                                {scale.grade_point.toFixed(2)}
                                                                            </td>
                                                                            <td className="py-2 px-3 text-right text-gray-500 dark:text-gray-400">
                                                                                {scale.description || "—"}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
