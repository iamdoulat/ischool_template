"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function OverviewPage() {
    // Fees Details Data
    const feesData = [
        { id: 1, branch: "Home Branch", session: "2025-26", students: 75, totalFees: "$17,112.02", paidFees: "$96,512.5", balanceFees: "$6,12,559.53" },
        { id: 2, branch: "Smart School 1", session: "2025-26", students: 18, totalFees: "$42,750.00", paidFees: "$7,235.98", balanceFees: "$35,159.00" },
        { id: 3, branch: "Smart School 2", session: "2025-26", students: 11, totalFees: "$21,750.00", paidFees: "$2,200.00", balanceFees: "$10,550.00" },
        { id: 4, branch: "Smart School 3", session: "2025-26", students: 14, totalFees: "$48,850.00", paidFees: "$3,700.00", balanceFees: "$44,580.00" },
    ];

    // Transport Fees Details Data
    const transportData = [
        { id: 1, branch: "Home Branch", session: "2025-26", totalFees: "$32,800.00", paidFees: "$3,045.00", balanceFees: "$30,755.00" },
        { id: 2, branch: "Smart School 1", session: "2025-26", totalFees: "$2,350.00", paidFees: "$00.00", balanceFees: "$2,350.00" },
        { id: 3, branch: "Smart School 2", session: "2025-26", totalFees: "$4,550.00", paidFees: "$00.00", balanceFees: "$4,430.00" },
        { id: 4, branch: "Smart School 3", session: "2025-26", totalFees: "$7,850.00", paidFees: "$50.00", balanceFees: "$2,800.00" },
    ];

    // Student Admission Data
    const admissionData = [
        { id: 1, branch: "Home Branch", session: "2025-26", offline: 28, online: 6 },
        { id: 2, branch: "Smart School 1", session: "2025-26", offline: 3, online: 2 },
        { id: 3, branch: "Smart School 2", session: "2025-26", offline: 3, online: 0 },
        { id: 4, branch: "Smart School 3", session: "2025-26", offline: 3, online: 0 },
    ];

    // Library Details Data
    const libraryData = [
        { id: 1, branch: "Home Branch", totalBooks: 20, members: 52, bookIssued: 220 },
        { id: 2, branch: "Smart School 1", totalBooks: 12, members: 18, bookIssued: 40 },
        { id: 3, branch: "Smart School 2", totalBooks: 11, members: 16, bookIssued: 45 },
        { id: 4, branch: "Smart School 3", totalBooks: 8, members: 21, bookIssued: 37 },
    ];

    // Alumni Students Data
    const alumniData = [
        { id: 1, branch: "Home Branch", students: 4 },
        { id: 2, branch: "Smart School 1", students: 2 },
        { id: 3, branch: "Smart School 2", students: 5 },
        { id: 4, branch: "Smart School 3", students: 2 },
    ];

    // Staff Payroll Data
    const payrollData = [
        { id: 1, branch: "Home Branch", totalStaff: 5, generated: 2, notGenerated: 0, paid: 7, netAmount: "$1,93,420.00", paidAmount: "$1,61,440.00" },
        { id: 2, branch: "Smart School 1", totalStaff: 7, generated: 0, notGenerated: 7, paid: 0, netAmount: "$0.00", paidAmount: "$0.00" },
        { id: 3, branch: "Smart School 2", totalStaff: 7, generated: 0, notGenerated: 7, paid: 0, netAmount: "$0.00", paidAmount: "$0.00" },
        { id: 4, branch: "Smart School 3", totalStaff: 8, generated: 0, notGenerated: 8, paid: 0, netAmount: "$0.00", paidAmount: "$0.00" },
    ];

    // Staff Attendance Data
    const attendanceData = [
        { id: 1, branch: "Home Branch", totalStaff: 5, present: 0, absent: 4 },
        { id: 2, branch: "Smart School 1", totalStaff: 7, present: 1, absent: 1 },
        { id: 3, branch: "Smart School 2", totalStaff: 7, present: 1, absent: 1 },
        { id: 4, branch: "Smart School 3", totalStaff: 8, present: 1, absent: 1 },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Fees Details */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Fees Details</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pl-6">Branch</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Current Session</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Total Students</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Total Fees</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Total Paid Fees</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pr-6">Total Balance Fees</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {feesData.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-muted/30 border-b border-muted/10 transition-colors">
                                        <TableCell className="text-slate-700 text-sm pl-6 py-4">{row.branch}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.session}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.students}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.totalFees}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.paidFees}</TableCell>
                                        <TableCell className="text-slate-700 text-sm pr-6 py-4">{row.balanceFees}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Transport Fees Details */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Transport Fees Details</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pl-6">Branch</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Current Session</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Total Fees</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Total Paid Fees</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pr-6">Total Balance Fees</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transportData.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-muted/30 border-b border-muted/10 transition-colors">
                                        <TableCell className="text-slate-700 text-sm pl-6 py-4">{row.branch}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.session}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.totalFees}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.paidFees}</TableCell>
                                        <TableCell className="text-slate-700 text-sm pr-6 py-4">{row.balanceFees}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Student Admission */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Student Admission</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pl-6">Branch</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Current Session</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Offline Admission</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pr-6">Online Admission</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {admissionData.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-muted/30 border-b border-muted/10 transition-colors">
                                        <TableCell className="text-slate-700 text-sm pl-6 py-4">{row.branch}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.session}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.offline}</TableCell>
                                        <TableCell className="text-slate-700 text-sm pr-6 py-4">{row.online}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Library Details */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Library Details</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pl-6">Branch</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Total Books</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Members</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pr-6">Book Issued</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {libraryData.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-muted/30 border-b border-muted/10 transition-colors">
                                        <TableCell className="text-slate-700 text-sm pl-6 py-4">{row.branch}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.totalBooks}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.members}</TableCell>
                                        <TableCell className="text-slate-700 text-sm pr-6 py-4">{row.bookIssued}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Alumni Students */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Alumni Students</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pl-6">Branch</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pr-6">Alumni Students</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alumniData.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-muted/30 border-b border-muted/10 transition-colors">
                                        <TableCell className="text-slate-700 text-sm pl-6 py-4">{row.branch}</TableCell>
                                        <TableCell className="text-slate-700 text-sm pr-6 py-4">{row.students}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Staff Payroll */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Staff Payroll Of January</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pl-6">Branch</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Total Staff</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Payroll Generated</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Payroll Not Generated</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Payroll Paid</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Net Amount</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pr-6">Paid Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payrollData.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-muted/30 border-b border-muted/10 transition-colors">
                                        <TableCell className="text-slate-700 text-sm pl-6 py-4">{row.branch}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.totalStaff}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.generated}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.notGenerated}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.paid}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.netAmount}</TableCell>
                                        <TableCell className="text-slate-700 text-sm pr-6 py-4">{row.paidAmount}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Staff Attendance Details */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Staff Attendance Details At 02/06/2026</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pl-6">Branch</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Total Staff</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4">Present</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider py-4 pr-6">Absent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceData.map((row) => (
                                    <TableRow key={row.id} className="hover:bg-muted/30 border-b border-muted/10 transition-colors">
                                        <TableCell className="text-slate-700 text-sm pl-6 py-4">{row.branch}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.totalStaff}</TableCell>
                                        <TableCell className="text-slate-700 text-sm py-4">{row.present}</TableCell>
                                        <TableCell className="text-slate-700 text-sm pr-6 py-4">{row.absent}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
