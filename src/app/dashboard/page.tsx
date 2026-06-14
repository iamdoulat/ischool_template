"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/cards/stat-card";
import { FinanceChart } from "@/components/charts/finance-chart";
import { DistributionChart } from "@/components/charts/distribution-chart";
import { OverviewCard } from "@/components/cards/overview-card";
import { SummaryCard } from "@/components/cards/summary-card";
import { mockDashboardData } from "@/lib/mock-data";
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
    UserCheck,
    Loader2,
    Bus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [visibleWidgets, setVisibleWidgets] = useState<string[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/dashboard');
                setData(response.data);
                setVisibleWidgets(response.data.visible_widgets || []);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                // Fallback to mock data if API fails
                setData(mockDashboardData);
                setVisibleWidgets([
                    "fees_awaiting_payment",
                    "staff_approved_leave",
                    "student_approved_leave",
                    "converted_leads",
                    "staff_present_today",
                    "student_present_today",
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Default to mock data if data is incomplete
    const stats = data?.stats || mockDashboardData.stats;
    const dailyFinance = data?.dailyFinance || mockDashboardData.dailyFinance;
    const finance = data?.finance || mockDashboardData.finance;
    const incomeDistribution = data?.incomeDistribution || mockDashboardData.incomeDistribution;
    const expenseDistribution = data?.expenseDistribution || mockDashboardData.expenseDistribution;
    const overviews = data?.overviews || mockDashboardData.overviews;
    const summary = data?.summary || mockDashboardData.summary;

    const widgetDefs: { key: string; title: string; current: number; total: number; percentage: number; icon: any; color: "blue" | "cyan" | "indigo" | "red" | "orange" | "yellow" | "purple" | "primary" }[] = [
        { key: "fees_awaiting_payment", title: "Fees Awaiting Payment", current: stats.feesAwaitingPayment.current, total: stats.feesAwaitingPayment.total, percentage: stats.feesAwaitingPayment.percentage, icon: Wallet, color: "blue" },
        { key: "staff_approved_leave", title: "Staff Approved Leave", current: stats.staffApprovedLeave.current, total: stats.staffApprovedLeave.total, percentage: stats.staffApprovedLeave.percentage, icon: ClipboardCheck, color: "cyan" },
        { key: "student_approved_leave", title: "Student Approved Leave", current: stats.studentApprovedLeave.current, total: stats.studentApprovedLeave.total, percentage: stats.studentApprovedLeave.percentage, icon: FileCheck, color: "indigo" },
        { key: "converted_leads", title: "Converted Leads", current: stats.convertedLeads.current, total: stats.convertedLeads.total, percentage: stats.convertedLeads.percentage, icon: Target, color: "red" },
        { key: "staff_present_today", title: "Staff Present Today", current: stats.staffPresentToday.current, total: stats.staffPresentToday.total, percentage: stats.staffPresentToday.percentage, icon: CalendarCheck, color: "orange" },
        { key: "student_present_today", title: "Student Present Today", current: stats.studentsPresentToday.current, total: stats.studentsPresentToday.total, percentage: stats.studentsPresentToday.percentage, icon: Users, color: "yellow" },
    ];

    const isSectionVisible = (key: string) =>
        visibleWidgets.length === 0 || visibleWidgets.includes(key);

    const visibleWidgetDefs = visibleWidgets.length > 0
        ? widgetDefs.filter(w => visibleWidgets.includes(w.key))
        : widgetDefs;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stat Cards Grid */}
            {visibleWidgetDefs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {visibleWidgetDefs.map((w) => (
                        <StatCard
                            key={w.key}
                            title={w.title}
                            current={w.current}
                            total={w.total}
                            percentage={w.percentage}
                            icon={w.icon}
                            color={w.color}
                        />
                    ))}
                </div>
            )}

            {/* Charts Grid - 2x2 Layout */}
            {isSectionVisible('charts_section') && (
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
            )}

            {/* Overview Cards Row - Move to its own row below charts */}
            {isSectionVisible('overview_section') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <OverviewCard title="Fees Overview" items={overviews.fees} color="indigo" />
                <OverviewCard title="Enquiry Overview" items={overviews.enquiry} color="red" />
                <OverviewCard title="Library Overview" items={overviews.library} color="emerald" />
                <OverviewCard title="Student Today Attendance" items={overviews.attendance} color="cyan" />
            </div>
            )}

            {/* Bottom Summary Cards Grid */}
            {isSectionVisible('summary_section') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard title="Monthly Fees Collection" value={summary.monthlyFees} icon={DollarSign} color="emerald" />
                <SummaryCard title="Monthly Expenses" value={summary.monthlyExpenses} icon={Receipt} color="red" />
                <SummaryCard title="Student" value={summary.studentCount} icon={UsersRound} color="blue" />
                <SummaryCard title="Student Head Count" value={summary.studentHeadCount} icon={UserCircle} color="orange" />
                <SummaryCard title="Admin" value={summary.admin} icon={UserCog} color="purple" />
                <SummaryCard title="Teacher" value={summary.teacher} icon={GraduationCap} color="indigo" />
                <SummaryCard title="Accountant" value={summary.accountant} icon={Calculator} color="cyan" />
                <SummaryCard title="Librarian" value={summary.librarian} icon={LibraryBig} color="rose" />
                <SummaryCard title="Receptionist" value={summary.receptionist} icon={UserRoundCheck} color="yellow" />
                <SummaryCard title="Super Admin" value={summary.superAdmin} icon={ShieldCheck} color="primary" />
                <SummaryCard title="Driver" value={summary.driver || 0} icon={Bus} color="red" />
            </div>
            )}
        </div>
    );
}
