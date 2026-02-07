import { StatCard } from "@/components/cards/stat-card";
import { FinanceChart } from "@/components/charts/finance-chart";
import { DistributionChart } from "@/components/charts/distribution-chart";
import { OverviewCard } from "@/components/cards/overview-card";
import { SummaryCard } from "@/components/cards/summary-card";
import { mockDashboardData } from "@/lib/mock-data";
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
    UserCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
    const { stats, dailyFinance, finance, incomeDistribution, expenseDistribution, overviews, summary } = mockDashboardData;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <StatCard
                    title="Fees Awaiting Payment"
                    current={stats.feesAwaitingPayment.current}
                    total={stats.feesAwaitingPayment.total}
                    percentage={stats.feesAwaitingPayment.percentage}
                    icon={Wallet}
                    color="blue"
                />
                <StatCard
                    title="Staff Approved Leave"
                    current={stats.staffApprovedLeave.current}
                    total={stats.staffApprovedLeave.total}
                    percentage={stats.staffApprovedLeave.percentage}
                    icon={ClipboardCheck}
                    color="cyan"
                />
                <StatCard
                    title="Student Approved Leave"
                    current={stats.studentApprovedLeave.current}
                    total={stats.studentApprovedLeave.total}
                    percentage={stats.studentApprovedLeave.percentage}
                    icon={FileCheck}
                    color="indigo"
                />
                <StatCard
                    title="Converted Leads"
                    current={stats.convertedLeads.current}
                    total={stats.convertedLeads.total}
                    percentage={stats.convertedLeads.percentage}
                    icon={Target}
                    color="red"
                />
                <StatCard
                    title="Staff Present Today"
                    current={stats.staffPresentToday.current}
                    total={stats.staffPresentToday.total}
                    percentage={stats.staffPresentToday.percentage}
                    icon={CalendarCheck}
                    color="orange"
                />
                <StatCard
                    title="Student Present Today"
                    current={stats.studentsPresentToday.current}
                    total={stats.studentsPresentToday.total}
                    percentage={stats.studentsPresentToday.percentage}
                    icon={Users}
                    color="yellow"
                />
            </div>

            {/* Charts Grid - 2x2 Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FinanceChart
                    title="Fees Collection & Expenses For January 2026"
                    data={dailyFinance}
                    type="bar"
                />
                <DistributionChart
                    title="Income - January 2026"
                    data={incomeDistribution}
                />
                <FinanceChart
                    title="Fees Collection & Expenses For Session 2025-26"
                    data={finance}
                    type="line"
                />
                <DistributionChart
                    title="Expense - January 2026"
                    data={expenseDistribution}
                />
            </div>

            {/* Overview Cards Row - Move to its own row below charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <OverviewCard title="Fees Overview" items={overviews.fees} color="indigo" />
                <OverviewCard title="Enquiry Overview" items={overviews.enquiry} color="red" />
                <OverviewCard title="Library Overview" items={overviews.library} color="emerald" />
                <OverviewCard title="Student Today Attendance" items={overviews.attendance} color="cyan" />
            </div>

            {/* Bottom Summary Cards Grid */}
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
            </div>
        </div>
    );
}
