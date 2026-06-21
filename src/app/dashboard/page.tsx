"use client";

import { useCallback, useEffect, useState } from "react";
import { StatCard } from "@/components/cards/stat-card";
import { FinanceChart } from "@/components/charts/finance-chart";
import { DistributionChart } from "@/components/charts/distribution-chart";
import { OverviewCard } from "@/components/cards/overview-card";
import { SummaryCard } from "@/components/cards/summary-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { mockDashboardData } from "@/lib/mock-data";
import { useCurrency } from "@/components/providers/currency-provider";
import api from "@/lib/api";
import {
    Wallet,
    Target,
    DollarSign,
    Receipt,
    UsersRound,
    ShieldCheck,
    CalendarCheck,
    ClipboardCheck,
    UserCog,
    GraduationCap,
    Calculator,
    LibraryBig,
    UserRoundCheck,
    UserCircle,
    Users,
    FileCheck,
    Bus,
    type LucideIcon
} from "lucide-react";

const DEFAULT_WIDGETS = [
    "fees_awaiting_payment",
    "staff_approved_leave",
    "student_approved_leave",
    "converted_leads",
    "staff_present_today",
    "student_present_today",
    "charts_section",
    "overview_section",
    "summary_monthly_fees",
    "summary_monthly_expenses",
    "summary_student",
    "summary_student_head_count",
    "summary_admin",
    "summary_teacher",
    "summary_accountant",
    "summary_librarian",
    "summary_receptionist",
    "summary_super_admin",
    "summary_driver",
];

/** Small section label used to break the page into scannable bands. */
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-4">
            {children}
        </h3>
    );
}

export default function DashboardPage() {
    const { selectedCurrency } = useCurrency();
    const [data, setData] = useState<Record<string, unknown>>(mockDashboardData);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [visibleWidgets, setVisibleWidgets] = useState<string[]>([]);

    const fetchDashboardData = useCallback(async () => {
        try {
            const response = await api.get('/dashboard');
            setData(response.data);
            setVisibleWidgets(response.data.visible_widgets || []);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            // Fallback to mock data if API fails
            setData(mockDashboardData);
            setVisibleWidgets(DEFAULT_WIDGETS);
        } finally {
            setLastUpdated(new Date());
        }
    }, []);

    useEffect(() => {
        fetchDashboardData().finally(() => setLoading(false));
    }, [fetchDashboardData]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    }, [fetchDashboardData]);

    if (loading) {
        return <DashboardSkeleton />;
    }

    // Default to mock data if data is incomplete
    const d = data as typeof mockDashboardData;
    const stats = d?.stats || mockDashboardData.stats;
    const dailyFinance = d?.dailyFinance || mockDashboardData.dailyFinance;
    const finance = d?.finance || mockDashboardData.finance;
    const incomeDistribution = d?.incomeDistribution || mockDashboardData.incomeDistribution;
    const expenseDistribution = d?.expenseDistribution || mockDashboardData.expenseDistribution;
    const overviews = d?.overviews || mockDashboardData.overviews;
    const summary = d?.summary || mockDashboardData.summary;

    // Format a raw number with the active currency symbol from CurrencyProvider.
    // Falls back to the pre-formatted string the backend sends if no raw value exists.
    const sym = selectedCurrency?.symbol ?? '$';
    const formatMoney = (rawKey: keyof typeof summary, fallbackKey: keyof typeof summary): string => {
        const raw = summary[rawKey];
        if (typeof raw === 'number') {
            return `${sym}${raw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        // fallback: use the pre-formatted string from the backend / mock
        return String(summary[fallbackKey] ?? '—');
    };

    const widgetDefs: { key: string; title: string; current: number; total: number; percentage: number; icon: LucideIcon; color: "blue" | "cyan" | "indigo" | "red" | "orange" | "yellow" | "purple" | "primary" }[] = [
        { key: "fees_awaiting_payment", title: "Fees Awaiting Payment", current: stats.feesAwaitingPayment.current, total: stats.feesAwaitingPayment.total, percentage: stats.feesAwaitingPayment.percentage, icon: Wallet, color: "blue" },
        { key: "staff_approved_leave", title: "Staff Approved Leave", current: stats.staffApprovedLeave.current, total: stats.staffApprovedLeave.total, percentage: stats.staffApprovedLeave.percentage, icon: ClipboardCheck, color: "cyan" },
        { key: "student_approved_leave", title: "Student Approved Leave", current: stats.studentApprovedLeave.current, total: stats.studentApprovedLeave.total, percentage: stats.studentApprovedLeave.percentage, icon: FileCheck, color: "indigo" },
        { key: "converted_leads", title: "Converted Leads", current: stats.convertedLeads.current, total: stats.convertedLeads.total, percentage: stats.convertedLeads.percentage, icon: Target, color: "red" },
        { key: "staff_present_today", title: "Staff Present Today", current: stats.staffPresentToday.current, total: stats.staffPresentToday.total, percentage: stats.staffPresentToday.percentage, icon: CalendarCheck, color: "orange" },
        { key: "student_present_today", title: "Student Present Today", current: stats.studentsPresentToday.current, total: stats.studentsPresentToday.total, percentage: stats.studentsPresentToday.percentage, icon: Users, color: "yellow" },
    ];

    const summaryCardDefs: { key: string; title: string; icon: LucideIcon; color: "blue" | "red" | "purple" | "primary" | "cyan" | "indigo" | "orange" | "yellow" | "emerald" | "rose"; getValue: () => string | number }[] = [
        { key: "summary_monthly_fees",     title: "Monthly Income",   icon: DollarSign, color: "emerald", getValue: () => formatMoney('monthlyFeesAmount', 'monthlyFees') },
        { key: "summary_monthly_expenses", title: "Monthly Expenses", icon: Receipt,    color: "red",     getValue: () => formatMoney('monthlyExpensesAmount', 'monthlyExpenses') },
        { key: "summary_student", title: "Student", icon: UsersRound, color: "blue", getValue: () => summary.studentCount },
        { key: "summary_student_head_count", title: "Student Head Count", icon: UserCircle, color: "orange", getValue: () => summary.studentHeadCount },
        { key: "summary_admin", title: "Admin", icon: UserCog, color: "purple", getValue: () => summary.admin },
        { key: "summary_teacher", title: "Teacher", icon: GraduationCap, color: "indigo", getValue: () => summary.teacher },
        { key: "summary_accountant", title: "Accountant", icon: Calculator, color: "cyan", getValue: () => summary.accountant },
        { key: "summary_librarian", title: "Librarian", icon: LibraryBig, color: "rose", getValue: () => summary.librarian },
        { key: "summary_receptionist", title: "Receptionist", icon: UserRoundCheck, color: "yellow", getValue: () => summary.receptionist },
        { key: "summary_super_admin", title: "Super Admin", icon: ShieldCheck, color: "primary", getValue: () => summary.superAdmin },
        { key: "summary_driver", title: "Driver", icon: Bus, color: "red", getValue: () => summary.driver || 0 },
    ];

    const isSectionVisible = (key: string) =>
        visibleWidgets.length === 0 || visibleWidgets.includes(key);

    const visibleWidgetDefs = visibleWidgets.length > 0
        ? widgetDefs.filter(w => visibleWidgets.includes(w.key))
        : widgetDefs;

    // Derive visible summary cards first — the backend returns individual keys
    // (summary_monthly_fees, summary_student …) but never a 'summary_section' group key.
    const visibleSummaryCards = visibleWidgets.length > 0
        ? summaryCardDefs.filter(c => visibleWidgets.includes(c.key) || visibleWidgets.includes('summary_section'))
        : summaryCardDefs;

    // Section is visible whenever at least one summary card passed the filter above.
    const isSummaryVisible = visibleSummaryCards.length > 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Page Header: greeting, date, session, refresh */}
            <DashboardHeader
                onRefresh={handleRefresh}
                refreshing={refreshing}
                lastUpdated={lastUpdated}
            />

            {/* Stat Cards Grid */}
            {visibleWidgetDefs.length > 0 && (
                <section>
                    <SectionLabel>Key Metrics</SectionLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {visibleWidgetDefs.map((w, i) => (
                            <div
                                key={w.key}
                                className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both"
                                style={{ animationDelay: `${i * 60}ms`, animationDuration: "500ms" }}
                            >
                                <StatCard
                                    title={w.title}
                                    current={w.current}
                                    total={w.total}
                                    percentage={w.percentage}
                                    icon={w.icon}
                                    color={w.color}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Charts Grid - 2x2 Layout */}
            {isSectionVisible('charts_section') && (
            <section>
                <SectionLabel>Finance & Distribution</SectionLabel>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FinanceChart
                        title={`Fees Collection & Expenses For ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                        data={dailyFinance}
                        type="bar"
                    />
                    <DistributionChart
                        title={`Income - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                        data={incomeDistribution}
                    />
                    <FinanceChart
                        title="Fees Collection & Expenses For Session"
                        data={finance}
                        type="line"
                    />
                    <DistributionChart
                        title={`Expense - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                        data={expenseDistribution}
                    />
                </div>
            </section>
            )}

            {/* Overview Cards Row - Move to its own row below charts */}
            {isSectionVisible('overview_section') && (
            <section>
                <SectionLabel>Today&apos;s Overview</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <OverviewCard title="Fees Overview" items={overviews.fees} color="indigo" />
                    <OverviewCard title="Enquiry Overview" items={overviews.enquiry} color="red" />
                    <OverviewCard title="Library Overview" items={overviews.library} color="emerald" />
                    <OverviewCard title="Student Today Attendance" items={overviews.attendance} color="cyan" />
                </div>
            </section>
            )}

            {/* Bottom Summary Cards Grid */}
            {isSummaryVisible && visibleSummaryCards.length > 0 && (
            <section>
                <SectionLabel>Headcount & Roles</SectionLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {visibleSummaryCards.map((c, i) => (
                        <div
                            key={c.key}
                            className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both"
                            style={{ animationDelay: `${i * 40}ms`, animationDuration: "500ms" }}
                        >
                            <SummaryCard title={c.title} value={c.getValue()} icon={c.icon} color={c.color} />
                        </div>
                    ))}
                </div>
            </section>
            )}
        </div>
    );
}
