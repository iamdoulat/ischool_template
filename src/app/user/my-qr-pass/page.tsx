"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, QrCode, Smartphone, Download, Printer, CheckCircle, AlertCircle, Nfc } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

const QR_API_BASE = "https://api.qrserver.com/v1/create-qr-code/";

function getQrImageUrl(qrCode: string, size = 300): string {
    const data = JSON.stringify({ qr_code: qrCode });
    return `${QR_API_BASE}?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

interface StudentData {
    name: string;
    admission_no: string;
    role: string;
    avatar: string | null;
    qr_code: string | null;
    nfc_uid: string | null;
    has_qr: boolean;
    has_nfc: boolean;
}

function PageSkeleton() {
    return (
        <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 max-w-4xl">
            <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                <div className="h-9 w-9 rounded-lg bg-gray-200 animate-pulse" />
                <div className="space-y-1.5">
                    <div className="h-3.5 w-40 rounded bg-gray-200 animate-pulse" />
                    <div className="h-2 w-64 rounded bg-gray-100 animate-pulse" />
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="h-64 w-64 mx-auto md:mx-0 rounded-xl bg-gray-100 animate-pulse" />
                    <div className="flex-1 space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function QrSkeleton() {
    return (
        <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
            <CardContent className="p-6">
                <div className="h-52 w-52 mx-auto rounded-xl bg-gray-100 animate-pulse" />
            </CardContent>
        </Card>
    );
}

export default function MyQrPassPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/user/my-qr-code");
                if (res.data?.success) {
                    setData(res.data.data);
                }
            } catch {
                toast.error(t("failed_to_load_your_qr_pass"));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleDownload = () => {
        if (!data?.qr_code) return;
        const url = getQrImageUrl(data.qr_code, 500);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qr-pass-${data.admission_no || data.name.replace(/\s+/g, "-")}.png`;
        a.click();
    };

    const handlePrint = () => {
        if (!data?.qr_code) return;
        const win = window.open("", "_blank");
        if (!win) return;
        const imgSrc = getQrImageUrl(data.qr_code, 400);
        win.document.write(`
            <html><head><title>My QR Pass - ${data.name}</title>
            <style>
                body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;gap:20px;background:#f9fafb;margin:0}
                .card{background:white;border-radius:20px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:400px;width:100%;text-align:center}
                img{max-width:280px;width:100%;border-radius:12px;border:4px solid #e5e7eb}
                .name{font-size:22px;font-weight:700;color:#1f2937;margin-top:16px}
                .id{font-size:13px;color:#6b7280;margin-top:4px}
                .label{font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin-top:8px}
                button{padding:14px 32px;font-size:16px;cursor:pointer;background:linear-gradient(135deg,#FF9800,#6366F1);color:white;border:none;border-radius:12px;font-weight:700;margin-top:20px}
                @media print{body{background:white}button{display:none}}
            </style></head>
            <body>
                <div class="card">
                    <div class="label">Smart Attendance QR Pass</div>
                    <img src="${imgSrc}" alt="QR Code" />
                    <div class="name">${data.name}</div>
                    <div class="id">${data.admission_no ? `ID: ${data.admission_no}` : data.role}</div>
                </div>
                <button onclick="window.print()">Print This Pass</button>
            </body></html>
        `);
        win.document.close();
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            {loading ? (
                <PageSkeleton />
            ) : (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 max-w-4xl">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <QrCode className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("my_attendance_pass")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("your_personal_qr_code_and_nfc_tag_for_smart_attendance")}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                            {/* QR Code card */}
                            {loading ? <QrSkeleton /> : data?.qr_code ? (
                                <div className="shrink-0">
                                    <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden">
                                        <CardContent className="p-6 flex flex-col items-center">
                                            <img
                                                src={getQrImageUrl(data.qr_code, 300)}
                                                alt="My QR Pass"
                                                className="w-52 h-52 rounded-xl border-4 border-gray-100 shadow-sm"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-3 uppercase tracking-widest font-bold">{t("scan_at_attendance_terminal")}</p>
                                            <div className="flex gap-2 mt-4">
                                                <Button onClick={handleDownload} size="sm" variant="outline"
                                                    className="h-8 text-[11px] gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                                    <Download className="h-3.5 w-3.5" /> {t("download")}
                                                </Button>
                                                <Button onClick={handlePrint} size="sm"
                                                    className="h-8 text-[11px] gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white">
                                                    <Printer className="h-3.5 w-3.5" /> {t("print")}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <div className="shrink-0">
                                    <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden">
                                        <CardContent className="p-10 flex flex-col items-center">
                                            <QrCode className="h-16 w-16 text-gray-200 mb-3" />
                                            <p className="text-sm font-semibold text-gray-500">{t("no_qr_code_generated")}</p>
                                            <p className="text-xs text-gray-400 mt-1 text-center">{t("contact_your_school_administrator_to_generate_your_attendance_qr_code")}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Info panel */}
                            {!loading && data && (
                                <div className="flex-1 w-full space-y-4">
                                    <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                                <QrCode className="h-4 w-4" />
                                            </span>
                                            <CardTitle className="text-sm font-bold text-slate-800 leading-none">{t("qr_code")}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                {data.has_qr ? (
                                                    <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-semibold">
                                                        <CheckCircle className="h-3.5 w-3.5" /> {t("generated")}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-semibold">
                                                        <AlertCircle className="h-3.5 w-3.5" /> {t("not_generated")}
                                                    </span>
                                                )}
                                                {data.qr_code && (
                                                    <code className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-gray-500">{data.qr_code}</code>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                                <Nfc className="h-4 w-4" />
                                            </span>
                                            <CardTitle className="text-sm font-bold text-slate-800 leading-none">{t("nfc_tag")}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                {data.has_nfc ? (
                                                    <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-semibold">
                                                        <CheckCircle className="h-3.5 w-3.5" /> {t("assigned")}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-semibold">
                                                        <AlertCircle className="h-3.5 w-3.5" /> {t("not_assigned")}
                                                    </span>
                                                )}
                                                {data.nfc_uid && (
                                                    <code className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-gray-500">{data.nfc_uid}</code>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-2">{t("tap_your_nfc_enabled_card_or_phone_at_the_attendance_terminal")}</p>
                                        </CardContent>
                                    </Card>

                                    {/* Student info */}
                                    <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                                <Smartphone className="h-4 w-4" />
                                            </span>
                                            <CardTitle className="text-sm font-bold text-slate-800 leading-none">{t("details")}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                            {([
                                                [t("name"), data.name],
                                                [t("role"), data.role],
                                                [t("admission_no"), data.admission_no || "—"],
                                            ] as [string, string][]).map(([label, value]) => (
                                                <div key={label}>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{label}</p>
                                                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}