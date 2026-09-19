"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, translateClassName, translateSectionName, toLocaleNumber } from "@/lib/utils";
import {
    CreditCard,
    QrCode,
    Nfc,
    Printer,
    Download,
    Loader2,
    User,
    CheckCircle,
    AlertCircle,
    Layers,
    Smartphone,
    BadgeCheck,
    Info,
} from "lucide-react";
import {
    type IdCardTemplate,
    type IdCardPerson,
    renderIdCardHtml,
    printIdCards,
    downloadCertificatePdf,
} from "@/lib/certificate";
import { useTranslation } from "@/hooks/use-translation";

const QR_API_BASE = "https://api.qrserver.com/v1/create-qr-code/";

function getQrImageUrl(qrCode: string, size = 300): string {
    const data = JSON.stringify({ qr_code: qrCode });
    return `${QR_API_BASE}?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

interface PortalStudent {
    name?: string;
    admission_no?: string;
    roll_no?: string;
    class?: string;
    section?: string;
    father_name?: string;
    mother_name?: string;
    dob?: string;
    blood_group?: string;
    house?: string;
    phone?: string;
    present_address?: string;
    image?: string | null;
    session?: string;
    school_name?: string;
    school_logo?: string;
    school_address?: string;
}

interface StudentQrData {
    name: string;
    admission_no: string;
    role: string;
    avatar: string | null;
    qr_code: string | null;
    nfc_uid: string | null;
    has_qr: boolean;
    has_nfc: boolean;
}

interface ApiResponse {
    cards?: IdCardTemplate[];
    student?: PortalStudent;
    qr_pass?: StudentQrData;
}

function toPerson(s: PortalStudent): IdCardPerson {
    return {
        name: s.name || "",
        admission_no: s.admission_no || "",
        roll_no: s.roll_no || "",
        class: s.class || "",
        section: s.section || "",
        father_name: s.father_name || "",
        mother_name: s.mother_name || "",
        dob: s.dob || "",
        blood_group: s.blood_group || "",
        house: s.house || "",
        phone: s.phone || "",
        address: s.present_address || "",
        photo: s.image || null,
        session: s.session || "",
    };
}

function PageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-16 rounded-lg bg-gray-100 animate-pulse" />
            <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
            <div className="h-96 rounded-xl bg-gray-100 animate-pulse" />
        </div>
    );
}

export default function UserIdQrPassPage() {
    const { t, language } = useTranslation();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [cards, setCards] = useState<IdCardTemplate[]>([]);
    const [student, setStudent] = useState<PortalStudent | null>(null);
    const [qrData, setQrData] = useState<StudentQrData | null>(null);

    const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
    const [iframeHeight, setIframeHeight] = useState<number>(340);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<string>("id_card");

    useEffect(() => {
        (async () => {
            try {
                // Fetch unified endpoint with fallback
                const res = await api.get("/user/id-qr-pass").catch(() => null);
                if (res?.data?.success) {
                    const d: ApiResponse = res.data.data;
                    setCards(d.cards || []);
                    setStudent(d.student || null);
                    setQrData(d.qr_pass || null);
                    if (d.cards?.length) {
                        setSelectedCardId(d.cards[0].id);
                    }
                } else {
                    // Fallback to separate endpoints
                    const [cardRes, qrRes] = await Promise.allSettled([
                        api.get("/user/id-card"),
                        api.get("/user/my-qr-code"),
                    ]);

                    if (cardRes.status === "fulfilled") {
                        const cardData = cardRes.value.data?.data ?? cardRes.value.data;
                        setCards(cardData?.cards || []);
                        setStudent(cardData?.student || null);
                        if (cardData?.cards?.length) {
                            setSelectedCardId(cardData.cards[0].id);
                        }
                    }

                    if (qrRes.status === "fulfilled" && qrRes.value.data?.success) {
                        setQrData(qrRes.value.data.data);
                    }
                }
            } catch {
                toast({
                    title: t("error"),
                    description: t("failed_to_load_id_cards") || "Failed to load ID card and QR pass data",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const person = student ? toPerson(student) : null;
    const card = (cards.find((c) => c.id === selectedCardId) || cards[0]) ?? null;
    const isVertical = card ? (card.design_type || "").toLowerCase() === "vertical" : false;

    useEffect(() => {
        setIframeHeight(isVertical ? 540 : 340);
    }, [isVertical, card?.id]);

    const handlePrintIdCard = (c: IdCardTemplate) => {
        if (!person) return;
        printIdCards(renderIdCardHtml(c, person, "student"));
    };

    const handleDownloadIdCardPdf = async (c: IdCardTemplate) => {
        if (!person) return;
        setDownloadingId(c.id);
        try {
            const html = renderIdCardHtml(c, person, "student");
            await downloadCertificatePdf(html, `${c.title.replace(/\s+/g, "-")}.pdf`);
        } catch {
            toast({
                title: t("error"),
                description: t("failed_to_generate_pdf") || "Failed to generate PDF",
                variant: "destructive",
            });
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDownloadQrPng = () => {
        const qrCode = qrData?.qr_code || student?.admission_no;
        if (!qrCode) return;
        const url = getQrImageUrl(qrCode, 500);
        const a = document.createElement("a");
        a.href = url;
        const nameSlug = (student?.name || qrData?.name || "student").replace(/\s+/g, "-");
        a.download = `qr-pass-${student?.admission_no || nameSlug}.png`;
        a.click();
    };

    const handlePrintQrPass = () => {
        const qrCode = qrData?.qr_code || student?.admission_no;
        if (!qrCode) return;
        const win = window.open("", "_blank");
        if (!win) return;
        const imgSrc = getQrImageUrl(qrCode, 400);
        const studentName = student?.name || qrData?.name || "Student";
        const studentId = student?.admission_no || qrData?.admission_no || "";

        win.document.write(`
            <html><head><title>My QR Pass - ${studentName}</title>
            <style>
                body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;gap:20px;background:#f9fafb;margin:0}
                .card{background:white;border-radius:20px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:400px;width:100%;text-align:center;border:1px solid #e2e8f0}
                img{max-width:280px;width:100%;border-radius:12px;border:4px solid #e5e7eb}
                .title{font-size:12px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:16px}
                .name{font-size:22px;font-weight:700;color:#1f2937;margin-top:16px}
                .id{font-size:13px;color:#6b7280;margin-top:4px}
                button{padding:12px 28px;font-size:15px;cursor:pointer;background:linear-gradient(135deg,#FF9800,#6366F1);color:white;border:none;border-radius:10px;font-weight:700;margin-top:20px}
                @media print{body{background:white}button{display:none}}
            </style></head>
            <body>
                <div class="card">
                    <div class="title">Smart Attendance QR Pass</div>
                    <img src="${imgSrc}" alt="QR Code" />
                    <div class="name">${studentName}</div>
                    <div class="id">${studentId ? `ID: ${studentId}` : ""}</div>
                </div>
                <button onclick="window.print()">Print This Pass</button>
            </body></html>
        `);
        win.document.close();
    };

    if (loading) {
        return <PageSkeleton />;
    }

    const effectiveQrCode = qrData?.qr_code || null;
    const hasQrCode = !!effectiveQrCode || qrData?.has_qr;
    const hasNfc = !!qrData?.nfc_uid || qrData?.has_nfc;

    return (
        <div className="space-y-6">
            {/* Edge-to-edge Page Header Banner per AGENTS.md conventions */}
            <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CreditCard className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {t("my_id_card_and_qr") || "My ID Card and QR"}
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("preview_print_and_download_your_identity_card_and_qr_pass") ||
                                    "Preview, print and download your identity card and smart attendance QR pass"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Student Profile Information Overview */}
            {student && (
                <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                <BadgeCheck className="h-4 w-4" />
                            </span>
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                {t("student_information") || "Student Information"}
                            </h3>
                        </div>
                        {student.session && (
                            <span className="text-[10px] font-semibold bg-white/90 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200/80 shadow-2xs">
                                {toLocaleNumber(student.session, language?.short_code)}
                            </span>
                        )}
                    </div>
                    <div className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className="h-20 w-20 shrink-0 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 overflow-hidden shadow-xs">
                                {student.image || qrData?.avatar ? (
                                    <img
                                        src={student.image || qrData?.avatar || ""}
                                        alt={student.name || "Student"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-9 w-9 opacity-40" />
                                )}
                            </div>
                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3 text-sm">
                                {([
                                    [t("name"), student.name || qrData?.name],
                                    [t("admission_no"), student.admission_no || qrData?.admission_no],
                                    [
                                        t("class"),
                                        `${student.class ? translateClassName(student.class, language?.short_code) : ""}${
                                            student.section ? ` (${translateSectionName(student.section, language?.short_code)})` : ""
                                        }`,
                                    ],
                                    [t("roll_no"), student.roll_no],
                                    [t("blood_group"), student.blood_group],
                                ] as [string, string | undefined][]).map(([label, value]) => (
                                    <div key={label}>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{label}</p>
                                        <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">{value || "—"}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-xl h-11 border border-gray-200/80">
                    <TabsTrigger
                        value="id_card"
                        className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs gap-2 transition-all px-4"
                    >
                        <CreditCard className="h-4 w-4" />
                        <span>{t("digital_id_card") || "Digital ID Card"}</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="qr_pass"
                        className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs gap-2 transition-all px-4"
                    >
                        <QrCode className="h-4 w-4" />
                        <span>{t("qr_and_nfc_pass") || "QR & NFC Pass"}</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="all"
                        className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-xs gap-2 transition-all px-4"
                    >
                        <Layers className="h-4 w-4" />
                        <span>{t("all_in_one_view") || "All-in-One View"}</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Digital ID Card */}
                <TabsContent value="id_card" className="mt-4 space-y-4">
                    {!card ? (
                        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-16 flex flex-col items-center justify-center text-gray-400">
                            <CreditCard className="h-12 w-12 opacity-25 mb-3" />
                            <p className="text-sm font-semibold text-gray-600">{t("no_id_card_available") || "No ID Card Available"}</p>
                            <p className="text-xs text-gray-400 mt-1 text-center max-w-sm">
                                {t("contact_your_school_administrator_to_create_an_id_card_template") ||
                                    "Contact your school administrator to create or publish an ID card template."}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-full max-w-2xl rounded-2xl border border-gray-200/80 bg-white shadow-md overflow-hidden transition-shadow">
                                <div className="px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] flex flex-wrap items-center justify-between gap-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                            <CreditCard className="h-4 w-4" />
                                        </span>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-slate-800 truncate">{card.title}</h3>
                                            <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                                                {t("official_student_id") || "Official Student ID"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            onClick={() => handlePrintIdCard(card)}
                                            size="sm"
                                            className="h-8 px-3.5 text-xs font-bold rounded-lg gap-1.5 transition-all active:scale-95 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs"
                                        >
                                            <Printer className="h-3.5 w-3.5" /> {t("print")}
                                        </Button>
                                        <Button
                                            onClick={() => handleDownloadIdCardPdf(card)}
                                            disabled={downloadingId === card.id}
                                            size="sm"
                                            className="h-8 px-4 text-xs font-bold rounded-lg gap-1.5 transition-all active:scale-95 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-xs"
                                        >
                                            {downloadingId === card.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Download className="h-3.5 w-3.5" />
                                            )}
                                            {t("download_pdf") || "Download PDF"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Template switcher if multiple cards */}
                                {cards.length > 1 && (
                                    <div className="px-5 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center gap-2 overflow-x-auto">
                                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                                            {t("template") || "Template"}:
                                        </span>
                                        {cards.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => setSelectedCardId(c.id)}
                                                className={cn(
                                                    "text-xs px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap",
                                                    selectedCardId === c.id
                                                        ? "bg-indigo-600 text-white shadow-xs"
                                                        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                                                )}
                                            >
                                                {c.title}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Live Preview iframe */}
                                <div className="p-6 bg-slate-100/70 flex justify-center items-center overflow-x-auto min-h-[380px]">
                                    {person && (
                                        <iframe
                                            key={`${card.id}-${card.design_type}-${person.session}`}
                                            srcDoc={renderIdCardHtml(card, person, "student")}
                                            title={card.title || t("my_id_card")}
                                            className="border-0 rounded-2xl shadow-md transition-all"
                                            style={{
                                                width: isVertical ? "340px" : "480px",
                                                height: `${iframeHeight}px`,
                                                maxWidth: "100%",
                                            }}
                                            scrolling="no"
                                            onLoad={(e) => {
                                                try {
                                                    const doc = e.currentTarget.contentDocument || e.currentTarget.contentWindow?.document;
                                                    if (doc) {
                                                        const cardEl = doc.querySelector(".card");
                                                        if (cardEl) {
                                                            const h = cardEl.getBoundingClientRect().height;
                                                            if (h > 100) {
                                                                setIframeHeight(Math.ceil(h + 40));
                                                                return;
                                                            }
                                                        }
                                                        if (doc.body && doc.body.scrollHeight > 100) {
                                                            setIframeHeight(doc.body.scrollHeight);
                                                        }
                                                    }
                                                } catch {
                                                    // ignore cross-domain iframes
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Tab 2: QR & NFC Attendance Pass */}
                <TabsContent value="qr_pass" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        {/* QR Code preview & actions */}
                        <div className="md:col-span-5 flex justify-center">
                            <div className="w-full max-w-sm rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
                                <div className="px-4 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                            <QrCode className="h-4 w-4" />
                                        </span>
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                            {t("qr_code") || "QR Code"}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-semibold text-emerald-600 bg-white/90 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                                        {t("active") || "Active"}
                                    </span>
                                </div>
                                <div className="p-6 flex flex-col items-center text-center">
                                    {effectiveQrCode ? (
                                        <>
                                            <img
                                                src={getQrImageUrl(effectiveQrCode, 300)}
                                                alt="My Attendance QR Pass"
                                                className="w-56 h-56 rounded-xl border-4 border-gray-100 shadow-sm"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-3 uppercase tracking-widest font-bold">
                                                {t("scan_at_attendance_terminal") || "SCAN AT ATTENDANCE TERMINAL"}
                                            </p>
                                            <div className="flex gap-2.5 mt-5 w-full">
                                                <Button
                                                    onClick={handleDownloadQrPng}
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 h-8 text-xs gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-semibold"
                                                >
                                                    <Download className="h-3.5 w-3.5" /> {t("download")}
                                                </Button>
                                                <Button
                                                    onClick={handlePrintQrPass}
                                                    size="sm"
                                                    className="flex-1 h-8 text-xs gap-1.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white font-semibold shadow-xs"
                                                >
                                                    <Printer className="h-3.5 w-3.5" /> {t("print")}
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-8 flex flex-col items-center">
                                            <QrCode className="h-16 w-16 text-gray-300 mb-3" />
                                            <p className="text-sm font-semibold text-gray-600">
                                                {t("no_qr_code_generated") || "No QR Code Generated"}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1 max-w-xs">
                                                {t("contact_your_school_administrator_to_generate_your_attendance_qr_code") ||
                                                    "Contact your school administrator to generate your attendance QR code."}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status details and terminal info */}
                        <div className="md:col-span-7 space-y-4">
                            {/* QR Status Card */}
                            <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
                                <div className="flex flex-row items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                        <QrCode className="h-4 w-4" />
                                    </span>
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                        {t("qr_code") || "QR Code Attendance Status"}
                                    </h3>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            {hasQrCode ? (
                                                <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-100">
                                                    <CheckCircle className="h-3.5 w-3.5" /> {t("generated") || "Generated"}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-semibold border border-amber-100">
                                                    <AlertCircle className="h-3.5 w-3.5" /> {t("not_generated") || "Not Generated"}
                                                </span>
                                            )}
                                        </div>
                                        {effectiveQrCode && (
                                            <code className="px-2.5 py-1 bg-slate-100 rounded text-[11px] font-mono text-slate-600 border border-slate-200/60">
                                                {effectiveQrCode}
                                            </code>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* NFC Status Card */}
                            <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
                                <div className="flex flex-row items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                        <Nfc className="h-4 w-4" />
                                    </span>
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                        {t("nfc_tag") || "NFC Tag Smart Attendance"}
                                    </h3>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            {hasNfc ? (
                                                <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-100">
                                                    <CheckCircle className="h-3.5 w-3.5" /> {t("assigned") || "Assigned"}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-semibold border border-amber-100">
                                                    <AlertCircle className="h-3.5 w-3.5" /> {t("not_assigned") || "Not Assigned"}
                                                </span>
                                            )}
                                        </div>
                                        {qrData?.nfc_uid && (
                                            <code className="px-2.5 py-1 bg-slate-100 rounded text-[11px] font-mono text-slate-600 border border-slate-200/60">
                                                {qrData.nfc_uid}
                                            </code>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-2.5 flex items-center gap-1.5">
                                        <Smartphone className="h-3.5 w-3.5 text-indigo-500" />
                                        {t("tap_your_nfc_enabled_card_or_phone_at_the_attendance_terminal") ||
                                            "Tap your NFC-enabled card or mobile device at any institution terminal."}
                                    </p>
                                </div>
                            </div>

                            {/* Help / Guidance card */}
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 shadow-xs overflow-hidden">
                                <div className="p-4 flex items-start gap-3">
                                    <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                                    <div className="text-xs text-indigo-900 leading-relaxed">
                                        <p className="font-semibold">{t("quick_tips") || "Smart Pass Attendance Tips"}:</p>
                                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-indigo-800/80 text-[11px]">
                                            <li>You can print your QR Pass or save it on your phone for contactless daily check-in.</li>
                                            <li>Both the QR Code and your physical student ID card are recognized by attendance scanners.</li>
                                            <li>If your QR code is unreadable, your school administrator can re-generate a new one.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Tab 3: All-in-One View */}
                <TabsContent value="all" className="mt-4 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left: ID Card */}
                        <div className="lg:col-span-7">
                            <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
                                <div className="px-4 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                            <CreditCard className="h-4 w-4" />
                                        </span>
                                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                            {t("digital_id_card") || "Digital ID Card"}
                                        </h3>
                                    </div>
                                    {card && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={() => handlePrintIdCard(card)}
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-2.5 text-xs font-semibold bg-white"
                                            >
                                                <Printer className="h-3 w-3 mr-1" /> {t("print")}
                                            </Button>
                                            <Button
                                                onClick={() => handleDownloadIdCardPdf(card)}
                                                disabled={downloadingId === card.id}
                                                size="sm"
                                                className="h-7 px-2.5 text-xs font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white"
                                            >
                                                <Download className="h-3 w-3 mr-1" /> {t("pdf") || "PDF"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-slate-100/70 flex justify-center items-center overflow-x-auto min-h-[340px]">
                                    {card && person ? (
                                        <iframe
                                            key={`all-${card.id}-${card.design_type}`}
                                            srcDoc={renderIdCardHtml(card, person, "student")}
                                            title={card.title || t("my_id_card")}
                                            className="border-0 rounded-2xl shadow-sm"
                                            style={{
                                                width: isVertical ? "320px" : "440px",
                                                height: `${iframeHeight}px`,
                                                maxWidth: "100%",
                                            }}
                                            scrolling="no"
                                        />
                                    ) : (
                                        <p className="text-xs text-gray-400">{t("no_id_card_available")}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: QR Code & NFC */}
                        <div className="lg:col-span-5 space-y-4">
                            <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
                                <div className="px-4 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                            <QrCode className="h-4 w-4" />
                                        </span>
                                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                            {t("qr_code") || "QR Attendance Pass"}
                                        </h3>
                                    </div>
                                    {effectiveQrCode && (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={handleDownloadQrPng}
                                                size="sm"
                                                variant="outline"
                                                className="h-7 px-2.5 text-xs font-semibold bg-white"
                                            >
                                                <Download className="h-3 w-3 mr-1" /> PNG
                                            </Button>
                                            <Button
                                                onClick={handlePrintQrPass}
                                                size="sm"
                                                className="h-7 px-2.5 text-xs font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white"
                                            >
                                                <Printer className="h-3 w-3 mr-1" /> {t("print")}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex flex-col items-center text-center">
                                    {effectiveQrCode ? (
                                        <>
                                            <img
                                                src={getQrImageUrl(effectiveQrCode, 260)}
                                                alt="QR Pass"
                                                className="w-48 h-48 rounded-xl border-2 border-gray-200 shadow-xs"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-wider">
                                                {t("scan_at_attendance_terminal")}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-400 py-6">{t("no_qr_code_generated")}</p>
                                    )}
                                </div>
                            </div>

                            {/* NFC Card in All-in-One */}
                            <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
                                <div className="px-4 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                            <Nfc className="h-4 w-4" />
                                        </span>
                                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                            {t("nfc_tag") || "NFC Tag"}
                                        </h3>
                                    </div>
                                    {hasNfc ? (
                                        <span className="text-[10px] font-semibold text-emerald-600 bg-white/90 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                                            {t("active") || "Active"}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-semibold text-amber-600 bg-white/90 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                                            {t("none") || "None"}
                                        </span>
                                    )}
                                </div>
                                <div className="p-4 flex items-center justify-between flex-wrap gap-2">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-800">
                                            {hasNfc ? (t("assigned") || "Assigned") : (t("not_assigned") || "Not Assigned")}
                                        </p>
                                        <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                                            <Smartphone className="h-3.5 w-3.5 text-indigo-500" />
                                            {t("tap_your_nfc_enabled_card_or_phone_at_the_attendance_terminal") ||
                                                "Tap your NFC-enabled card or mobile device at any institution terminal."}
                                        </p>
                                    </div>
                                    {qrData?.nfc_uid && (
                                        <code className="px-2.5 py-1 bg-slate-100 rounded text-[11px] font-mono text-slate-600 border border-slate-200/60">
                                            {qrData.nfc_uid}
                                        </code>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
