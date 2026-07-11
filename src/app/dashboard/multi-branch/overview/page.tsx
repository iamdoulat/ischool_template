"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Wallet, Bus, Library, Users, UserCheck, Activity, Building2, RefreshCw,
} from "lucide-react";

interface FeeRow { id: number; branch: string; session: string; students: number; totalFees: string; paidFees: string; balanceFees: string; }
interface AdmissionRow { id: number; branch: string; offline: number; online: number; }
interface LibraryRow { id: number; branch: string; totalBooks: number; members: number; bookIssued: number; }
interface PayrollRow { id: number; branch: string; totalStaff: number; generated: number; paid: number; netAmount: string; paidAmount: string; }
interface AttendanceRow { id: number; branch: string; totalStaff: number; present: number; absent: number; }
interface TransportRow { id: number; branch: string; totalFees: string; balanceFees: string; }

interface OverviewData {
    fees_details: FeeRow[];
    transport_details: TransportRow[];
    admission_details: AdmissionRow[];
    library_details: LibraryRow[];
    payroll_details: PayrollRow[];
    attendance_details: AttendanceRow[];
}

function SkeletonRows({ rows = 4, cols }: { rows?: number; cols: number }) {
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

function SectionCard({ icon: Icon, title, subtitle, children }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle?: string; children: React.ReactNode; }) {
    return (
        <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
            <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                    <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{title}</CardTitle>
                    {subtitle && <p className="text-[11px] text-gray-500 mt-1">{subtitle}</p>}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto custom-scrollbar">{children}</div>
            </CardContent>
        </Card>
    );
}

const TH = "font-semibold text-gray-600 text-[11px] uppercase whitespace-nowrap";

export default function OverviewPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchOverview = async () => {
        setLoading(true);
        try {
            const response = await api.get("/multi-branch/overview");
            setData(response.data?.data ?? response.data);
        } catch {
            tt.toast("error", "failed_to_fetch_ecosystem_overview");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                        <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">{t("ecosystem_overview")}</h1>
                        <p className="text-xs text-gray-500">{t("real_time_aggregation_across_all_campus_branches")}</p>
                    </div>
                </div>
                <button
                    onClick={fetchOverview}
                    className="h-9 px-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> {t("refresh")}
                </button>
            </div>

            {/* Fees */}
            <SectionCard icon={Wallet} title={t("institutional_fees")} subtitle={t("fee_collection_per_branch")}>
                <Table className="min-w-[760px]">
                    <TableHeader className="bg-gray-50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className={TH}>{t("branch")}</TableHead>
                            <TableHead className={`${TH} text-center`}>{t("session")}</TableHead>
                            <TableHead className={`${TH} text-center`}>{t("students")}</TableHead>
                            <TableHead className={TH}>{t("total_fees")}</TableHead>
                            <TableHead className={TH}>{t("paid")}</TableHead>
                            <TableHead className={`${TH} text-right`}>{t("balance")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? <SkeletonRows cols={6} /> : !data?.fees_details?.length ? (
                            <TableRow><TableCell colSpan={6} className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data")}</TableCell></TableRow>
                        ) : data.fees_details.map((row) => (
                            <TableRow key={row.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                <TableCell className="py-3 font-medium text-gray-700">{row.branch}</TableCell>
                                <TableCell className="py-3 text-center text-gray-500">{row.session}</TableCell>
                                <TableCell className="py-3 text-center text-gray-500 tabular-nums">{row.students}</TableCell>
                                <TableCell className="py-3 text-gray-700 tabular-nums">{row.totalFees}</TableCell>
                                <TableCell className="py-3 text-emerald-600 font-medium tabular-nums">{row.paidFees}</TableCell>
                                <TableCell className="py-3 text-right text-rose-600 font-medium tabular-nums">{row.balanceFees}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Admission */}
                <SectionCard icon={UserCheck} title={t("student_admission")} subtitle={t("offline_vs_online_intake")}>
                    <Table className="min-w-[360px]">
                        <TableHeader className="bg-gray-50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className={TH}>{t("branch")}</TableHead>
                                <TableHead className={`${TH} text-center`}>{t("offline")}</TableHead>
                                <TableHead className={`${TH} text-right`}>{t("online")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? <SkeletonRows cols={3} /> : !data?.admission_details?.length ? (
                                <TableRow><TableCell colSpan={3} className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data")}</TableCell></TableRow>
                            ) : data.admission_details.map((row) => (
                                <TableRow key={row.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                    <TableCell className="py-3 font-medium text-gray-700">{row.branch}</TableCell>
                                    <TableCell className="py-3 text-center text-gray-500 tabular-nums">{row.offline}</TableCell>
                                    <TableCell className="py-3 text-right text-blue-600 font-medium tabular-nums">{row.online}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </SectionCard>

                {/* Library */}
                <SectionCard icon={Library} title={t("library")} subtitle={t("resources_and_circulation")}>
                    <Table className="min-w-[440px]">
                        <TableHeader className="bg-gray-50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className={TH}>{t("branch")}</TableHead>
                                <TableHead className={`${TH} text-center`}>{t("books")}</TableHead>
                                <TableHead className={`${TH} text-center`}>{t("members")}</TableHead>
                                <TableHead className={`${TH} text-right`}>{t("issued")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? <SkeletonRows cols={4} /> : !data?.library_details?.length ? (
                                <TableRow><TableCell colSpan={4} className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data")}</TableCell></TableRow>
                            ) : data.library_details.map((row) => (
                                <TableRow key={row.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                    <TableCell className="py-3 font-medium text-gray-700">{row.branch}</TableCell>
                                    <TableCell className="py-3 text-center text-gray-500 tabular-nums">{row.totalBooks}</TableCell>
                                    <TableCell className="py-3 text-center text-gray-500 tabular-nums">{row.members}</TableCell>
                                    <TableCell className="py-3 text-right text-amber-600 font-medium tabular-nums">{row.bookIssued}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </SectionCard>
            </div>

            {/* Payroll */}
            <SectionCard icon={Users} title={t("staff_payroll")} subtitle={t("payroll_generation_per_branch")}>
                <Table className="min-w-[760px]">
                    <TableHeader className="bg-gray-50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className={TH}>{t("branch")}</TableHead>
                            <TableHead className={`${TH} text-center`}>{t("staff")}</TableHead>
                            <TableHead className={`${TH} text-center`}>{t("generated")}</TableHead>
                            <TableHead className={`${TH} text-center`}>{t("paid")}</TableHead>
                            <TableHead className={TH}>{t("net_amount")}</TableHead>
                            <TableHead className={`${TH} text-right`}>{t("paid_amount")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? <SkeletonRows cols={6} /> : !data?.payroll_details?.length ? (
                            <TableRow><TableCell colSpan={6} className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data")}</TableCell></TableRow>
                        ) : data.payroll_details.map((row) => (
                            <TableRow key={row.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                <TableCell className="py-3 font-medium text-gray-700">{row.branch}</TableCell>
                                <TableCell className="py-3 text-center text-gray-500 tabular-nums">{row.totalStaff}</TableCell>
                                <TableCell className="py-3 text-center text-gray-500 tabular-nums">{row.generated}</TableCell>
                                <TableCell className="py-3 text-center text-emerald-600 font-medium tabular-nums">{row.paid}</TableCell>
                                <TableCell className="py-3 text-gray-700 tabular-nums">{row.netAmount}</TableCell>
                                <TableCell className="py-3 text-right text-indigo-600 font-medium tabular-nums">{row.paidAmount}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attendance */}
                <SectionCard icon={Activity} title={t("staff_attendance")} subtitle={t("present_vs_absent")}>
                    <Table className="min-w-[440px]">
                        <TableHeader className="bg-gray-50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className={TH}>{t("branch")}</TableHead>
                                <TableHead className={`${TH} text-center`}>{t("staff")}</TableHead>
                                <TableHead className={`${TH} text-center`}>{t("present")}</TableHead>
                                <TableHead className={`${TH} text-right`}>{t("absent")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? <SkeletonRows cols={4} /> : !data?.attendance_details?.length ? (
                                <TableRow><TableCell colSpan={4} className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data")}</TableCell></TableRow>
                            ) : data.attendance_details.map((row) => (
                                <TableRow key={row.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                    <TableCell className="py-3 font-medium text-gray-700">{row.branch}</TableCell>
                                    <TableCell className="py-3 text-center text-gray-500 tabular-nums">{row.totalStaff}</TableCell>
                                    <TableCell className="py-3 text-center text-emerald-600 font-medium tabular-nums">{row.present}</TableCell>
                                    <TableCell className="py-3 text-right text-rose-600 font-medium tabular-nums">{row.absent}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </SectionCard>

                {/* Transport */}
                <SectionCard icon={Bus} title={t("transport")} subtitle={t("transport_fee_valuation")}>
                    <Table className="min-w-[360px]">
                        <TableHeader className="bg-gray-50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className={TH}>{t("branch")}</TableHead>
                                <TableHead className={TH}>{t("total_fees")}</TableHead>
                                <TableHead className={`${TH} text-right`}>{t("balance")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? <SkeletonRows cols={3} /> : !data?.transport_details?.length ? (
                                <TableRow><TableCell colSpan={3} className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data")}</TableCell></TableRow>
                            ) : data.transport_details.map((row) => (
                                <TableRow key={row.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                    <TableCell className="py-3 font-medium text-gray-700">{row.branch}</TableCell>
                                    <TableCell className="py-3 text-gray-500 tabular-nums">{row.totalFees}</TableCell>
                                    <TableCell className="py-3 text-right text-rose-600 font-medium tabular-nums">{row.balanceFees}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </SectionCard>
            </div>
        </div>
    );
}
