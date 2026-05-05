"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
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
import { 
    Activity, LayoutDashboard, Wallet, Bus, 
    UserCheck, Library, GraduationCap, Users,
    RefreshCw, Info, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewData {
    fees_details: any[];
    transport_details: any[];
    admission_details: any[];
    library_details: any[];
    alumni_details: any[];
    payroll_details: any[];
    attendance_details: any[];
}

export default function OverviewPage() {
    const { toast } = useToast();
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOverview();
    }, []);

    const fetchOverview = async () => {
        setLoading(true);
        try {
            const response = await api.get('/multi-branch/overview');
            setData(response.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch ecosystem overview", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-700">
                <div className="h-16 w-16 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-2xl shadow-indigo-100 animate-pulse">
                    <LayoutDashboard className="h-8 w-8" />
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 animate-bounce">Synchronizing Ecosystem Nodes</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Aggregating cross-campus intelligence matrices...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24 font-sans">
            {/* Strategy Header */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 text-indigo-600">
                    <Activity className="h-48 w-48" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="h-16 w-16 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner transform -rotate-3">
                        <Building2 className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-widest flex items-center gap-4">
                            Ecosystem Overview
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.25em] mt-1.5 flex items-center gap-2">
                            <Info className="h-3 w-3 text-indigo-400" /> Real-time analytical aggregation of multi-campus node performance
                        </p>
                    </div>
                </div>
            </div>

            {/* Fees Details */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                        <Wallet className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-black tracking-tight text-slate-700 uppercase">Institutional Fees Matrix</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-muted/20">
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-widest py-5 pl-8">Branch Node</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-widest py-5 text-center">Session Index</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-widest py-5 text-center">Total Nodes</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-widest py-5">Total Valuation</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-widest py-5">Committed Value</TableHead>
                                    <TableHead className="font-black text-slate-600 text-[10px] uppercase tracking-widest py-5 pr-8 text-right">Node Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.fees_details.map((row, index) => (
                                    <TableRow key={row.id} className={cn(
                                        "hover:bg-emerald-50/20 border-b border-muted/10 transition-colors group",
                                        index % 2 === 0 ? 'bg-white' : 'bg-muted/5'
                                    )}>
                                        <TableCell className="text-slate-700 text-[11px] font-black pl-8 py-5 uppercase tracking-tight">{row.branch}</TableCell>
                                        <TableCell className="text-slate-500 text-[10px] font-bold py-5 text-center uppercase tracking-widest">{row.session}</TableCell>
                                        <TableCell className="text-slate-500 text-[11px] font-black py-5 text-center tabular-nums">{row.students}</TableCell>
                                        <TableCell className="text-slate-700 text-[11px] font-bold py-5 tabular-nums">{row.totalFees}</TableCell>
                                        <TableCell className="text-emerald-600 text-[11px] font-black py-5 tabular-nums">{row.paidFees}</TableCell>
                                        <TableCell className="text-rose-600 text-[11px] font-black pr-8 py-5 text-right tabular-nums tracking-widest">{row.balanceFees}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Student Admission */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                    <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-inner">
                            <UserCheck className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-sm font-black tracking-tight text-slate-700 uppercase">Admission Flux Matrix</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-muted/20 text-[9px] uppercase font-black text-gray-500 tracking-widest">
                                        <TableHead className="py-4 pl-8">Branch Node</TableHead>
                                        <TableHead className="py-4 text-center">Offline</TableHead>
                                        <TableHead className="py-4 text-right pr-8">Online</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.admission_details.map((row, idx) => (
                                        <TableRow key={row.id} className={cn(
                                            "hover:bg-blue-50/20 border-b border-muted/10 transition-colors group text-[11px]",
                                            idx % 2 === 0 ? 'bg-white' : 'bg-muted/5'
                                        )}>
                                            <TableCell className="text-slate-700 font-black pl-8 py-4 uppercase tracking-tight">{row.branch}</TableCell>
                                            <TableCell className="text-slate-500 font-black py-4 text-center tabular-nums">{row.offline}</TableCell>
                                            <TableCell className="text-blue-600 font-black pr-8 py-4 text-right tabular-nums">{row.online}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Library Details */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                    <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
                            <Library className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-sm font-black tracking-tight text-slate-700 uppercase">Knowledge Node Density</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-muted/20 text-[9px] uppercase font-black text-gray-500 tracking-widest">
                                        <TableHead className="py-4 pl-8">Branch Node</TableHead>
                                        <TableHead className="py-4 text-center">Resources</TableHead>
                                        <TableHead className="py-4 text-center">Members</TableHead>
                                        <TableHead className="py-4 text-right pr-8">Circulation</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.library_details.map((row, idx) => (
                                        <TableRow key={row.id} className={cn(
                                            "hover:bg-amber-50/20 border-b border-muted/10 transition-colors group text-[11px]",
                                            idx % 2 === 0 ? 'bg-white' : 'bg-muted/5'
                                        )}>
                                            <TableCell className="text-slate-700 font-black pl-8 py-4 uppercase tracking-tight">{row.branch}</TableCell>
                                            <TableCell className="text-slate-500 font-black py-4 text-center tabular-nums">{row.totalBooks}</TableCell>
                                            <TableCell className="text-slate-500 font-black py-4 text-center tabular-nums">{row.members}</TableCell>
                                            <TableCell className="text-amber-600 font-black pr-8 py-4 text-right tabular-nums">{row.bookIssued}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Staff Payroll */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
                        <Users className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-black tracking-tight text-slate-700 uppercase">Institutional Payroll Protocol</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-muted/20 text-[10px] font-black uppercase text-gray-500 tracking-[0.15em]">
                                    <TableHead className="py-5 pl-8">Branch Node</TableHead>
                                    <TableHead className="py-5 text-center">Human Capital</TableHead>
                                    <TableHead className="py-5 text-center">Gen Nodes</TableHead>
                                    <TableHead className="py-5 text-center">Paid Nodes</TableHead>
                                    <TableHead className="py-5">Aggregate Net</TableHead>
                                    <TableHead className="py-5 pr-8 text-right">Aggregate Paid</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.payroll_details.map((row, index) => (
                                    <TableRow key={row.id} className={cn(
                                        "hover:bg-indigo-50/20 border-b border-muted/10 transition-colors group text-[11px]",
                                        index % 2 === 0 ? 'bg-white' : 'bg-muted/5'
                                    )}>
                                        <TableCell className="text-slate-700 font-black pl-8 py-5 uppercase tracking-tight">{row.branch}</TableCell>
                                        <TableCell className="text-slate-500 font-black py-5 text-center tabular-nums">{row.totalStaff}</TableCell>
                                        <TableCell className="text-slate-500 font-black py-5 text-center tabular-nums">{row.generated}</TableCell>
                                        <TableCell className="text-emerald-600 font-black py-5 text-center tabular-nums">{row.paid}</TableCell>
                                        <TableCell className="text-slate-700 font-bold py-5 tabular-nums tracking-widest">{row.netAmount}</TableCell>
                                        <TableCell className="text-indigo-600 font-black pr-8 py-5 text-right tabular-nums tracking-widest">{row.paidAmount}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance & Transport Sub-Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                    <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
                            <Activity className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-sm font-black tracking-tight text-slate-700 uppercase">Human Capital Presence</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-muted/20 text-[9px] uppercase font-black text-gray-500 tracking-widest">
                                    <TableHead className="py-4 pl-8">Branch Node</TableHead>
                                    <TableHead className="py-4 text-center">Nodes</TableHead>
                                    <TableHead className="py-4 text-center text-emerald-600">Present</TableHead>
                                    <TableHead className="py-4 text-right pr-8 text-rose-600">Absent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.attendance_details.map((row, idx) => (
                                    <TableRow key={row.id} className={cn(
                                        "hover:bg-rose-50/20 border-b border-muted/10 transition-colors group text-[11px]",
                                        idx % 2 === 0 ? 'bg-white' : 'bg-muted/5'
                                    )}>
                                        <TableCell className="text-slate-700 font-black pl-8 py-4 uppercase tracking-tight">{row.branch}</TableCell>
                                        <TableCell className="text-slate-500 font-black py-4 text-center tabular-nums">{row.totalStaff}</TableCell>
                                        <TableCell className="text-emerald-600 font-black py-4 text-center tabular-nums">{row.present}</TableCell>
                                        <TableCell className="text-rose-600 font-black pr-8 py-4 text-right tabular-nums">{row.absent}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                    <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
                            <Bus className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-sm font-black tracking-tight text-slate-700 uppercase">Transport Logistics Matrix</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-muted/20 text-[9px] uppercase font-black text-gray-500 tracking-widest">
                                    <TableHead className="py-4 pl-8">Branch Node</TableHead>
                                    <TableHead className="py-4">Aggregate Valuation</TableHead>
                                    <TableHead className="py-4 text-right pr-8 text-rose-600">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.transport_details.map((row, idx) => (
                                    <TableRow key={row.id} className={cn(
                                        "hover:bg-indigo-50/20 border-b border-muted/10 transition-colors group text-[11px]",
                                        idx % 2 === 0 ? 'bg-white' : 'bg-muted/5'
                                    )}>
                                        <TableCell className="text-slate-700 font-black pl-8 py-4 uppercase tracking-tight">{row.branch}</TableCell>
                                        <TableCell className="text-slate-500 font-black py-4 tabular-nums">{row.totalFees}</TableCell>
                                        <TableCell className="text-rose-600 font-black pr-8 py-4 text-right tabular-nums">{row.balanceFees}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
