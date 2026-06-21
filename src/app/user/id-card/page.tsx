"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreditCard, User, Printer, Download, Loader2 } from "lucide-react";
import {
    type IdCardTemplate,
    type IdCardPerson,
    renderIdCardHtml,
    printIdCards,
    downloadCertificatePdf,
} from "@/lib/certificate";

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
}

interface ApiResponse {
    cards: IdCardTemplate[];
    student: PortalStudent;
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
    };
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
                </div>
            </div>
        </div>
    );
}

export default function UserIdCardPage() {
    const { toast } = useToast();
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/user/id-card");
                setData(res.data?.data ?? res.data);
            } catch {
                toast({ title: "Error", description: "Failed to load ID cards", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const person = data?.student ? toPerson(data.student) : null;

    const handlePrint = (card: IdCardTemplate) => {
        if (!person) return;
        printIdCards(renderIdCardHtml(card, person, "student"));
    };

    const handleDownload = async (card: IdCardTemplate) => {
        if (!person) return;
        setDownloadingId(card.id);
        try {
            const html = `<div style="padding:20px;background:#fff;display:inline-block;">${renderIdCardHtml(card, person, "student")}</div>`;
            await downloadCertificatePdf(html, `${card.title.replace(/\s+/g, "-")}.pdf`);
        } catch {
            toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-5 p-4 animate-in fade-in duration-300">
            {/* Page title */}
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                    <CreditCard className="h-5 w-5" />
                </span>
                <div>
                    <h1 className="text-xl font-bold text-gray-800">My ID Card</h1>
                    <p className="text-xs text-gray-500">Preview, print, and download your identity card</p>
                </div>
            </div>

            {/* Student info */}
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
            ) : data?.student ? (
                <Card className="shadow-sm border-0 p-0 gap-0 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <h3 className="text-sm font-bold text-slate-800">Student Information</h3>
                    </div>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className="h-20 w-20 shrink-0 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 overflow-hidden">
                                {data.student.image
                                    ? <img src={data.student.image} alt={data.student.name} className="h-full w-full object-cover" />
                                    : <User className="h-8 w-8 opacity-40" />}
                            </div>
                            <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                                {([
                                    ["Name", data.student.name],
                                    ["Admission No", data.student.admission_no],
                                    ["Class", `${data.student.class || ""}${data.student.section ? ` (${data.student.section})` : ""}`],
                                    ["Roll Number", data.student.roll_no],
                                    ["Father Name", data.student.father_name],
                                    ["Blood Group", data.student.blood_group],
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

            {/* Cards grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(2)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : !data?.cards?.length ? (
                <Card className="shadow-sm border-0">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <CreditCard className="h-12 w-12 opacity-25 mb-3" />
                        <p className="text-base font-medium text-gray-500">No ID card available.</p>
                        <p className="text-xs text-gray-400 mt-1">Contact your school administrator to create an ID card template.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.cards.map((card) => (
                        <div key={card.id} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="px-4 py-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] flex items-center gap-2">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <CreditCard className="h-4 w-4" />
                                </span>
                                <h3 className="text-sm font-bold text-slate-800 truncate">{card.title}</h3>
                            </div>

                            {/* Live ID card preview */}
                            <div className="p-3 bg-gray-50 flex justify-center overflow-x-auto">
                                {person && (
                                    <div
                                        className="origin-top scale-90"
                                        dangerouslySetInnerHTML={{ __html: renderIdCardHtml(card, person, "student") }}
                                    />
                                )}
                            </div>

                            <div className="px-4 pb-4 pt-3 flex items-center gap-2">
                                <Button
                                    onClick={() => handlePrint(card)}
                                    className={cn(
                                        "flex-1 h-8 text-[11px] font-bold rounded-lg gap-1.5 transition-all active:scale-95",
                                        "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-none"
                                    )}
                                >
                                    <Printer className="h-3.5 w-3.5" /> Print
                                </Button>
                                <Button
                                    onClick={() => handleDownload(card)}
                                    disabled={downloadingId === card.id}
                                    className="flex-1 h-8 text-[11px] font-bold rounded-lg gap-1.5 transition-all active:scale-95 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm"
                                >
                                    {downloadingId === card.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
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
