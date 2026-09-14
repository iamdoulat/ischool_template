"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useLanguage } from "@/components/providers/language-provider";
import { toLocaleNumber, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Wallet,
    Bus,
    Library,
    Users,
    UserCheck,
    Activity,
    Building2,
    RefreshCw,
} from "lucide-react";

interface FeeRow {
    id: number;
    branch: string;
    session: string;
    students: number;
    totalFees: string;
    paidFees: string;
    balanceFees: string;
}

interface AdmissionRow {
    id: number;
    branch: string;
    offline: number;
    online: number;
}

interface LibraryRow {
    id: number;
    branch: string;
    totalBooks: number;
    members: number;
    bookIssued: number;
}

interface PayrollRow {
    id: number;
    branch: string;
    totalStaff: number;
    generated: number;
    paid: number;
    netAmount: string;
    paidAmount: string;
}

interface AttendanceRow {
    id: number;
    branch: string;
    totalStaff: number;
    present: number;
    absent: number;
}

interface TransportRow {
    id: number;
    branch: string;
    totalFees: string;
    balanceFees: string;
}

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
                            <div
                                className="h-3 rounded bg-gray-200/70 animate-pulse"
                                style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

function SectionCard({
    icon: Icon,
    title,
    subtitle,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs overflow-hidden">
            <div className="flex flex-row items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                    <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-sm font-bold text-gray-800 tracking-tight leading-none">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            <div className="p-0">
                <div className="overflow-x-auto custom-scrollbar">{children}</div>
            </div>
        </div>
    );
}

const TH = "font-bold text-gray-600 text-xs py-3.5 uppercase whitespace-nowrap";

export default function OverviewPage() {
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const { toast } = useToast();

    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchOverview = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/multi-branch/overview");
            setData(response.data?.data ?? response.data);
        } catch (error) {
            console.error("Error fetching overview data:", error);
            toast({
                title: t("error"),
                description: t("failed_to_fetch_ecosystem_overview"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [t, toast]);

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    return (
        <div className="space-y-6">
            {/* Page Header Banner - Standalone edge-to-edge gradient */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("ecosystem_overview")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("real_time_aggregation_across_all_campus_branches")}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={fetchOverview}
                    disabled={loading}
                    className="h-8 px-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                >
                    <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> {t("refresh")}
                </Button>
            </div>

            {/* Institutional Fees */}
            <SectionCard
                icon={Wallet}
                title={t("institutional_fees")}
                subtitle={t("fee_collection_per_branch")}
            >
                <Table className="min-w-[760px]">
                    <TableHeader className="bg-gray-50/80">
                        <TableRow className="border-b border-gray-100">
                            <TableHead className={`${TH} pl-5`}>{t("branch")}</TableHead>
                            <TableHead className={`${TH} text-center`}>{t("session")}</TableHead>
                            <TableHead className={`${TH} text-center`}>{t("students")}</TableHead>
                            <TableHead className={TH}>{t("total_fees")}</TableHead>
                            <TableHead className={TH}>{t("paid")}</TableHead>
                            <TableHead className={`${TH} text-right pr-5`}>{t("balance")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <SkeletonRows cols={6} />
                        ) : !data?.fees_details?.length ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="py-10 text-center text-xs font-semibold text-gray-400"
                                >
                                    {t("no_data")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.fees_details.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="text-xs border-b border-gray-50 hover:bg-indigo-50/30 transition-colors whitespace-nowrap"
                                >
                                    <TableCell className="py-3.5 pl-5 font-semibold text-gray-800">
                                        {row.branch}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center text-gray-600 font-medium">
                                        {toLocaleNumber(row.session, langCode)}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center text-gray-600 font-medium">
                                        {toLocaleNumber(row.students, langCode)}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-gray-700 font-medium">
                                        {toLocaleNumber(row.totalFees, langCode)}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-emerald-600 font-bold">
                                        {toLocaleNumber(row.paidFees, langCode)}
                                    </TableCell>
                                    <TableCell className="py-3.5 pr-5 text-right text-rose-600 font-bold">
                                        {toLocaleNumber(row.balanceFees, langCode)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Student Admission */}
                <SectionCard
                    icon={UserCheck}
                    title={t("student_admission")}
                    subtitle={t("offline_vs_online_intake")}
                >
                    <Table className="min-w-[360px]">
                        <TableHeader className="bg-gray-50/80">
                            <TableRow className="border-b border-gray-100">
                                <TableHead className={`${TH} pl-5`}>{t("branch")}</TableHead>
                                <TableHead className={`${TH} text-center`}>{t("offline")}</TableHead>
                                <TableHead className={`${TH} text-right pr-5`}>{t("online")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <SkeletonRows cols={3} />
                            ) : !data?.admission_details?.length ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={3}
                                        className="py-10 text-center text-xs font-semibold text-gray-400"
                                    >
                                        {t("no_data")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.admission_details.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="text-xs border-b border-gray-50 hover:bg-indigo-50/30 transition-colors whitespace-nowrap"
                                    >
                                        <TableCell className="py-3.5 pl-5 font-semibold text-gray-800">
                                            {row.branch}
                                        </TableCell>
                                        <TableCell className="py-3.5 text-center text-gray-600 font-medium">
                                            {toLocaleNumber(row.offline, langCode)}
                                        </TableCell>
                                        <TableCell className="py-3.5 pr-5 text-right text-blue-600 font-bold">
                                            {toLocaleNumber(row.online, langCode)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </SectionCard>

                {/* Library */}
                <SectionCard
                    icon={Library}
                    title={t("library")}
                    subtitle={t("resources_and_circulation")}
                >
                    <Table className="min-w-[440px]">
                        <TableHeader className="bg-gray-50/80">
                            <TableRow className="border-b border-gray-100">
                                <TableHead className={`${TH} pl-5`}>{t("branch")}</TableHead>
                                <TableHead className={`${TH} text-center`}>{t("books")}</TableHead>
                                <TableHead className={`${TH} text-center`}>{t("members")}</TableHead>
                                <TableHead className={`${TH} text-right pr-5`}>{t("issued")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <SkeletonRows cols={4} />
                            ) : !data?.library_details?.length ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-10 text-center text-xs font-semibold text-gray-400"
                                    >
                                        {t("no_data")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.library_details.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="text-xs border-b border-gray-50 hover:bg-indigo-50/30 transition-colors whitespace-nowrap"
                                    >
                                        <TableCell className="py-3.5 pl-5 font-semibold text-gray-800">
                                            {row.branch}
                                        </TableCell>
                                        <TableCell className="py-3.5 text-center text-gray-600 font-medium">
                                            {toLocaleNumber(row.totalBooks, langCode)}
                                        </TableCell>
                                        <TableCell className="py-3.5 text-center text-gray-600 font-medium">
                                            {toLocaleNumber(row.members, langCode)}
                                        </TableCell>
                                        <TableCell className="py-3.5 pr-5 text-right text-amber-600 font-bold">
                                            {toLocaleNumber(row.bookIssued, langCode)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </SectionCard>
            </div>

            {/* Staff Payroll */}
            <SectionCard
                icon={Users}
                title={t("staff_payroll")}
                subtitle={t("payroll_generation_per_branch")}
            >
                <Table className="min-w-[760px]">
                    <TableHeader className="bg-gray-50/80">
                        <TableRow className="border-b border-gray-100">
                            <TableHead className={`${TH} pl-5`}>{t("branch")}</TableHead>
                            <TableHead className={`${TH} text-center`}>{t("staff")}</TableHead>
                            <TableHead className={`${TH} text-center`}>{t("generated")}</TableHead>
                            <TableHead className={`${TH} text-center`}>{t("paid")}</TableHead>
                            <TableHead className={TH}>{t("net_amount")}</TableHead>
                            <TableHead className={`${TH} text-right pr-5`}>{t("paid_amount")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <SkeletonRows cols={6} />
                        ) : !data?.payroll_details?.length ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="py-10 text-center text-xs font-semibold text-gray-400"
                                >
                                    {t("no_data")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.payroll_details.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="text-xs border-b border-gray-50 hover:bg-indigo-50/30 transition-colors whitespace-nowrap"
                                >
                                    <TableCell className="py-3.5 pl-5 font-semibold text-gray-800">
                                        {row.branch}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center text-gray-600 font-medium">
                                        {toLocaleNumber(row.totalStaff, langCode)}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center text-gray-600 font-medium">
                                        {toLocaleNumber(row.generated, langCode)}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center text-emerald-600 font-bold">
                                        {toLocaleNumber(row.paid, langCode)}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-gray-700 font-medium">
                                        {toLocaleNumber(row.netAmount, langCode)}
                                    </TableCell>
                                    <TableCell className="py-3.5 pr-5 text-right text-indigo-600 font-bold">
                                        {toLocaleNumber(row.paidAmount, langCode)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Staff Attendance */}
                <SectionCard
                    icon={Activity}
                    title={t("staff_attendance")}
                    subtitle={t("present_vs_absent")}
                >
                    <Table className="min-w-[440px]">
                        <TableHeader className="bg-gray-50/80">
                            <TableRow className="border-b border-gray-100">
                                <TableHead className={`${TH} pl-5`}>{t("branch")}</TableHead>
                                <TableHead className={`${TH} text-center`}>{t("staff")}</TableHead>
                                <TableHead className={`${TH} text-center`}>{t("present")}</TableHead>
                                <TableHead className={`${TH} text-right pr-5`}>{t("absent")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <SkeletonRows cols={4} />
                            ) : !data?.attendance_details?.length ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-10 text-center text-xs font-semibold text-gray-400"
                                    >
                                        {t("no_data")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.attendance_details.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="text-xs border-b border-gray-50 hover:bg-indigo-50/30 transition-colors whitespace-nowrap"
                                    >
                                        <TableCell className="py-3.5 pl-5 font-semibold text-gray-800">
                                            {row.branch}
                                        </TableCell>
                                        <TableCell className="py-3.5 text-center text-gray-600 font-medium">
                                            {toLocaleNumber(row.totalStaff, langCode)}
                                        </TableCell>
                                        <TableCell className="py-3.5 text-center text-emerald-600 font-bold">
                                            {toLocaleNumber(row.present, langCode)}
                                        </TableCell>
                                        <TableCell className="py-3.5 pr-5 text-right text-rose-600 font-bold">
                                            {toLocaleNumber(row.absent, langCode)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </SectionCard>

                {/* Transport */}
                <SectionCard
                    icon={Bus}
                    title={t("transport")}
                    subtitle={t("transport_fee_valuation")}
                >
                    <Table className="min-w-[360px]">
                        <TableHeader className="bg-gray-50/80">
                            <TableRow className="border-b border-gray-100">
                                <TableHead className={`${TH} pl-5`}>{t("branch")}</TableHead>
                                <TableHead className={TH}>{t("total_fees")}</TableHead>
                                <TableHead className={`${TH} text-right pr-5`}>{t("balance")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <SkeletonRows cols={3} />
                            ) : !data?.transport_details?.length ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={3}
                                        className="py-10 text-center text-xs font-semibold text-gray-400"
                                    >
                                        {t("no_data")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.transport_details.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="text-xs border-b border-gray-50 hover:bg-indigo-50/30 transition-colors whitespace-nowrap"
                                    >
                                        <TableCell className="py-3.5 pl-5 font-semibold text-gray-800">
                                            {row.branch}
                                        </TableCell>
                                        <TableCell className="py-3.5 text-gray-600 font-medium">
                                            {toLocaleNumber(row.totalFees, langCode)}
                                        </TableCell>
                                        <TableCell className="py-3.5 pr-5 text-right text-rose-600 font-bold">
                                            {toLocaleNumber(row.balanceFees, langCode)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </SectionCard>
            </div>
        </div>
    );
}
