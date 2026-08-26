"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Loader2,
    FileBadge,
    User,
    Printer,
    Download,
    Eye,
    Sparkles,
} from "lucide-react";
import {
    type CertificateTemplate,
    type StudentFields,
    type SchoolSettings,
    renderCertificateHtml,
    printCertificate,
    downloadCertificatePdf,
} from "@/lib/certificate";
import { useTranslation } from "@/hooks/use-translation";
import { useSettings } from "@/components/providers/settings-provider";
import { getImageUrl } from "@/lib/image-url";

interface ApiResponse {
    certificates: CertificateTemplate[];
    student: StudentFields;
    settings?: SchoolSettings;
}

function SkeletonCard() {
    return (
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden animate-pulse">
            <div className="h-12 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700" />
            <div className="p-4 space-y-3">
                <div className="h-3 w-3/4 rounded bg-gray-200/70 dark:bg-gray-800" />
                <div className="h-3 w-1/2 rounded bg-gray-200/70 dark:bg-gray-800" />
                <div className="flex gap-2 mt-4">
                    <div className="h-9 flex-1 rounded-lg bg-gray-200/70 dark:bg-gray-800" />
                    <div className="h-9 flex-1 rounded-lg bg-gray-200/70 dark:bg-gray-800" />
                    <div className="h-9 flex-1 rounded-lg bg-gray-200/70 dark:bg-gray-800" />
                </div>
            </div>
        </div>
    );
}

export default function UserCertificatesPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { settings: globalSettings } = useSettings();
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    useEffect(() => {
        let isMounted = true;

        (async () => {
            try {
                const res = await api.get("/user/certificates");
                if (!isMounted) return;
                const payload = res.data?.data ?? res.data;
                setData(payload);
            } catch {
                if (isMounted) {
                    toast({
                        title: t("error"),
                        description: t("failed_to_load_certificates"),
                        variant: "destructive",
                    });
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mergedSettings = (data?.settings || globalSettings || {}) as SchoolSettings;

    const handlePrint = (template: CertificateTemplate) => {
        if (!data?.student) return;
        printCertificate(renderCertificateHtml(template, data.student, mergedSettings));
    };

    const handleDownload = async (template: CertificateTemplate) => {
        if (!data?.student) return;
        setDownloadingId(template.id);
        try {
            const html = renderCertificateHtml(template, data.student, mergedSettings);
            await downloadCertificatePdf(html, `${template.name.replace(/\s+/g, "-")}.pdf`);
        } catch {
            toast({
                title: t("error"),
                description: t("failed_to_generate_pdf"),
                variant: "destructive",
            });
        } finally {
            setDownloadingId(null);
        }
    };

    const handlePreview = (template: CertificateTemplate) => {
        if (!data?.student) return;
        const html = renderCertificateHtml(template, data.student, mergedSettings);
        const win = window.open("", "_blank", "width=900,height=700");
        if (win) {
            win.document.write(html);
            win.document.close();
        }
    };

    const s = data?.student;

    return (
        /* pb-32 sm:pb-16 ensures bottom content and action buttons are fully visible above the fixed mobile navbar */
        <div className="flex flex-col gap-5 p-3 sm:p-5 lg:p-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-32 sm:pb-16">
            {/* Page title */}
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                    <FileBadge className="h-5 w-5" />
                </span>
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">
                        {t("my_certificates")}
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("view_preview_and_download_your_certificates")}
                    </p>
                </div>
            </div>

            {/* Student info card */}
            {loading ? (
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4 animate-pulse">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="h-20 w-20 rounded-xl bg-gray-200 dark:bg-gray-800 shrink-0" />
                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="h-2.5 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
                                    <div className="h-3.5 w-2/3 rounded bg-gray-100 dark:bg-gray-800/60" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : s ? (
                <Card className="shadow-sm border border-gray-200/80 dark:border-gray-800 rounded-xl overflow-hidden p-0 gap-0 bg-white dark:bg-gray-900">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-gray-800/80 dark:to-gray-800/40">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200">
                            {t("student_information")}
                        </h3>
                    </div>
                    <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="h-20 w-20 shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-400 overflow-hidden shadow-xs">
                                {s.image ? (
                                    <img
                                        src={getImageUrl(s.image, globalSettings?.base_url)}
                                        alt={s.name || "Student"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-8 w-8 opacity-40" />
                                )}
                            </div>
                            <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-3 text-sm w-full">
                                {([
                                    [t("name"), s.name],
                                    [t("admission_no"), s.admission_no],
                                    [t("class"), `${s.class || ""}${s.section ? ` (${s.section})` : ""}`],
                                    [t("father_name"), s.father_name],
                                    [t("roll_no"), s.roll_no],
                                    [t("category"), s.category],
                                ] as [string, string | undefined][]).map(([label, value]) => (
                                    <div key={label} className="min-w-0">
                                        <p className="text-[10.5px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight truncate">
                                            {label}
                                        </p>
                                        <p className="text-[13.5px] sm:text-sm font-bold text-gray-800 dark:text-gray-200 mt-0.5 truncate">
                                            {value || "—"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            {/* Certificates grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : !data?.certificates?.length ? (
                <Card className="shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <FileBadge className="h-12 w-12 opacity-25 mb-3" />
                        <p className="text-base font-medium text-gray-600 dark:text-gray-300">
                            {t("no_certificates_available")}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 text-center max-w-sm">
                            {t("contact_your_school_administrator_to_create_certificate_templates")}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.certificates.map((cert) => (
                        <div
                            key={cert.id}
                            className="rounded-xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div>
                                {/* Card header gradient strip */}
                                <div className="px-4 py-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-gray-800/90 dark:to-gray-800/40 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                        <FileBadge className="h-4 w-4" />
                                    </span>
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-gray-100 truncate">
                                        {cert.name}
                                    </h3>
                                </div>

                                {/* Background image / thumbnail preview */}
                                {cert.background_image ? (
                                    <div className="h-32 sm:h-36 overflow-hidden bg-gray-50 dark:bg-gray-800/60 relative flex items-center justify-center">
                                        <img
                                            src={getImageUrl(cert.background_image, globalSettings?.base_url)}
                                            alt={cert.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-32 sm:h-36 bg-gradient-to-br from-indigo-50/60 via-white to-orange-50/60 dark:from-gray-800/60 dark:via-gray-900 dark:to-gray-800/30 flex flex-col items-center justify-center p-4 text-center">
                                        <FileBadge className="h-10 w-10 text-indigo-300 dark:text-indigo-600/50 mb-1" />
                                        <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                                            {cert.name}
                                        </span>
                                    </div>
                                )}

                                {/* Body preview */}
                                <div className="px-4 py-3">
                                    {cert.body_text ? (
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                            {cert.body_text.replace(/\[[\w\s]+\]/g, "…").slice(0, 120)}
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-gray-400 italic">
                                            Standard School Official Certificate
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions (Touch-friendly and fully responsive on mobile) */}
                            <div className="p-3.5 pt-0 flex items-center gap-2 border-t border-gray-50 dark:border-gray-800/80 mt-2">
                                <Button
                                    onClick={() => handlePreview(cert)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-9 text-[11.5px] font-bold rounded-lg gap-1.5 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-all active:scale-95"
                                >
                                    <Eye className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>{t("preview")}</span>
                                </Button>
                                <Button
                                    onClick={() => handlePrint(cert)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-9 text-[11.5px] font-bold rounded-lg gap-1.5 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-all active:scale-95"
                                >
                                    <Printer className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>{t("print")}</span>
                                </Button>
                                <Button
                                    onClick={() => handleDownload(cert)}
                                    disabled={downloadingId === cert.id}
                                    size="sm"
                                    className="flex-1 h-9 text-[11.5px] font-bold rounded-lg gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {downloadingId === cert.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Download className="h-3.5 w-3.5" />
                                    )}
                                    <span>PDF</span>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
