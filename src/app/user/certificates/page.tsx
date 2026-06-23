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
} from "lucide-react";
import {
    type CertificateTemplate,
    type StudentFields,
    renderCertificateHtml,
    printCertificate,
    downloadCertificatePdf,
} from "@/lib/certificate";
import { useTranslation } from "@/hooks/use-translation";

interface ApiResponse {
    certificates: CertificateTemplate[];
    student: StudentFields;
}

function SkeletonCard() {
    return (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-pulse">
            <div className="h-12 bg-gradient-to-r from-gray-100 to-gray-200" />
            <div className="p-4 space-y-3">
                <div className="h-3 w-3/4 rounded bg-gray-200/70" />
                <div className="h-3 w-1/2 rounded bg-gray-200/70" />
                <div className="flex gap-2 mt-4">
                    <div className="h-8 flex-1 rounded-lg bg-gray-200/70" />
                    <div className="h-8 flex-1 rounded-lg bg-gray-200/70" />
                    <div className="h-8 flex-1 rounded-lg bg-gray-200/70" />
                </div>
            </div>
        </div>
    );
}

export default function UserCertificatesPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/user/certificates");
                const payload = res.data?.data ?? res.data;
                setData(payload);
            } catch {
                toast({ title: t("error"), description: t("failed_to_load_certificates"), variant: "destructive" });
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePrint = (template: CertificateTemplate) => {
        if (!data?.student) return;
        printCertificate(renderCertificateHtml(template, data.student));
    };

    const handleDownload = async (template: CertificateTemplate) => {
        if (!data?.student) return;
        setDownloadingId(template.id);
        try {
            const html = renderCertificateHtml(template, data.student);
            await downloadCertificatePdf(html, `${template.name.replace(/\s+/g, "-")}.pdf`);
        } catch {
            toast({ title: t("error"), description: t("failed_to_generate_pdf"), variant: "destructive" });
        } finally {
            setDownloadingId(null);
        }
    };

    const handlePreview = (template: CertificateTemplate) => {
        if (!data?.student) return;
        const html = renderCertificateHtml(template, data.student);
        const win = window.open("", "_blank", "width=900,height=700");
        if (win) { win.document.write(html); win.document.close(); }
    };

    const s = data?.student;

    return (
        <div className="flex flex-col gap-5 p-4 animate-in fade-in duration-300">
            {/* Page title */}
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                    <FileBadge className="h-5 w-5" />
                </span>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">{t("my_certificates")}</h1>
                    <p className="text-xs text-gray-500">{t("view_preview_and_download_your_certificates")}</p>
                </div>
            </div>

            {/* Student info card */}
            {loading ? (
                <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 animate-pulse">
                    <div className="flex gap-4">
                        <div className="h-20 w-20 rounded-lg bg-gray-200" />
                        <div className="flex-1 grid grid-cols-2 gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="h-2.5 w-1/3 rounded bg-gray-200" />
                                    <div className="h-3.5 w-2/3 rounded bg-gray-100" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : s ? (
                <Card className="shadow-sm border-0 p-0 gap-0 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <h3 className="text-sm font-bold text-slate-800">{t("student_information")}</h3>
                    </div>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className="h-20 w-20 shrink-0 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 overflow-hidden">
                                {s.image
                                    ? <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
                                    : <User className="h-8 w-8 opacity-40" />}
                            </div>
                            <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                                {([
                                    [t("name"), s.name],
                                    [t("admission_no"), s.admission_no],
                                    [t("class"), `${s.class}${s.section ? ` (${s.section})` : ""}`],
                                    [t("father_name"), s.father_name],
                                    [t("roll_no"), s.roll_no],
                                    [t("category"), s.category],
                                ] as [string, string | undefined][]).map(([label, value]) => (
                                    <div key={label}>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{label}</p>
                                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{value || "—"}</p>
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
                    {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : !data?.certificates?.length ? (
                <Card className="shadow-sm border-0">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <FileBadge className="h-12 w-12 opacity-25 mb-3" />
                        <p className="text-base font-medium text-gray-500">{t("no_certificates_available")}</p>
                        <p className="text-xs text-gray-400 mt-1">{t("contact_your_school_administrator_to_create_certificate_templates")}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.certificates.map((cert) => (
                        <div key={cert.id} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            {/* Card header gradient strip */}
                            <div className="px-4 py-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] flex items-center gap-2">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <FileBadge className="h-4 w-4" />
                                </span>
                                <h3 className="text-sm font-bold text-slate-800 truncate">{cert.name}</h3>
                            </div>

                            {/* Background image preview */}
                            {cert.background_image ? (
                                <div className="h-28 overflow-hidden bg-gray-50">
                                    <img src={cert.background_image} alt="Certificate background" className="h-full w-full object-cover" />
                                </div>
                            ) : (
                                <div className="h-28 bg-gradient-to-br from-indigo-50 to-orange-50 flex items-center justify-center">
                                    <FileBadge className="h-12 w-12 text-indigo-200" />
                                </div>
                            )}

                            {/* Body preview */}
                            <div className="px-4 py-3">
                                {cert.body_text && (
                                    <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                                        {cert.body_text.replace(/\[[\w\s]+\]/g, "…").slice(0, 120)}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="px-4 pb-4 flex items-center gap-2">
                                <Button
                                    onClick={() => handlePreview(cert)}
                                    className={cn(
                                        "flex-1 h-8 text-[11px] font-bold rounded-lg gap-1.5 transition-all active:scale-95",
                                        "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-none"
                                    )}
                                >
                                    <Eye className="h-3.5 w-3.5" /> {t("preview")}
                                </Button>
                                <Button
                                    onClick={() => handlePrint(cert)}
                                    className={cn(
                                        "flex-1 h-8 text-[11px] font-bold rounded-lg gap-1.5 transition-all active:scale-95",
                                        "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-none"
                                    )}
                                >
                                    <Printer className="h-3.5 w-3.5" /> {t("print")}
                                </Button>
                                <Button
                                    onClick={() => handleDownload(cert)}
                                    disabled={downloadingId === cert.id}
                                    className="flex-1 h-8 text-[11px] font-bold rounded-lg gap-1.5 transition-all active:scale-95 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm"
                                >
                                    {downloadingId === cert.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Download className="h-3.5 w-3.5" />
                                    )}
                                    PDF
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
