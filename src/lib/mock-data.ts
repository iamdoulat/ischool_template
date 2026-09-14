export const mockDashboardData = {
    stats: {
        feesAwaitingPayment: { current: 0, total: 0, percentage: 0, color: "blue" },
        staffApprovedLeave: { current: 0, total: 0, percentage: 0, color: "cyan" },
        studentApprovedLeave: { current: 0, total: 0, percentage: 0, color: "indigo" },
        convertedLeads: { current: 0, total: 0, percentage: 0, color: "red" },
        staffPresentToday: { current: 0, total: 0, percentage: 0, color: "orange" },
        studentsPresentToday: { current: 0, total: 0, percentage: 0, color: "yellow" },
    },
    dailyFinance: Array.from({ length: 31 }, (_, i) => ({
        day: (i + 1).toString().padStart(2, '0'),
        collections: 0,
        expenses: 0,
    })),
    expenseDistribution: [
        { name: "No Data", value: 0, color: "#d1d5db" },
    ],
    incomeDistribution: [
        { name: "No Data", value: 0, color: "#d1d5db" },
    ],
    summary: {
        monthlyFeesAmount: 0,
        monthlyExpensesAmount: 0,
        totalIncomeAmount: 0,
        totalExpensesAmount: 0,
        monthlyFees: "$0.00",
        monthlyExpenses: "$0.00",
        totalIncome: "$0.00",
        totalExpenses: "$0.00",
        studentCount: 0,
        studentHeadCount: 0,
        admin: 0,
        branchAdmin: 0,
        teacher: 0,
        accountant: 0,
        librarian: 0,
        receptionist: 0,
        superAdmin: 0,
        driver: 0
    },
    finance: [
        { month: "Jan", collections: 0, expenses: 0 },
        { month: "Feb", collections: 0, expenses: 0 },
        { month: "Mar", collections: 0, expenses: 0 },
        { month: "Apr", collections: 0, expenses: 0 },
        { month: "May", collections: 0, expenses: 0 },
        { month: "Jun", collections: 0, expenses: 0 },
        { month: "Jul", collections: 0, expenses: 0 },
        { month: "Aug", collections: 0, expenses: 0 },
        { month: "Sep", collections: 0, expenses: 0 },
        { month: "Oct", collections: 0, expenses: 0 },
        { month: "Nov", collections: 0, expenses: 0 },
        { month: "Dec", collections: 0, expenses: 0 },
    ],
    overviews: {
        fees: [
            { label: "UNPAID", value: "$0.00", percentage: 0, color: "bg-blue-600" },
            { label: "PAID", value: "$0.00", percentage: 0, color: "bg-cyan-500" },
        ],
        enquiry: [
            { label: "ACTIVE", value: 0, percentage: 0, color: "bg-red-500" },
        ],
        library: [
            { label: "ISSUED", value: 0, percentage: 0, color: "bg-indigo-600" },
            { label: "RETURNED", value: 0, percentage: 0, color: "bg-cyan-500" },
        ],
        attendance: [
            { label: "PRESENT", value: 0, percentage: 0, color: "bg-emerald-500" },
            { label: "ABSENT", value: 0, percentage: 0, color: "bg-red-500" },
            { label: "LATE", value: 0, percentage: 0, color: "bg-yellow-500" },
            { label: "HALF DAY", value: 0, percentage: 0, color: "bg-orange-500" },
        ]
    }
};
