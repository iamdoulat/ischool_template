"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Copy, FileSpreadsheet, FileText, Printer, Columns, 
    ChevronLeft, ChevronRight, Video, BarChart3,
    Search, Calendar, Users, ShieldCheck, Zap,
    ExternalLink, Info, MonitorPlay
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingReport {
    id: string;
    title: string;
    description: string;
    date_time: string;
    api_used: string;
    created_by: string;
    creator?: {
        name: string;
        last_name: string;
    };
    total_join: number;
    status: string;
}

export default function LiveMeetingReportPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [reports, setReports] = useState<MeetingReport[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalEntries, setTotalEntries] = useState(0);

    useEffect(() => {
        fetchReports();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await api.get('/conference/live-meetings', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            setReports(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch reports", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                            Meeting Analytical Reports
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Audit of institutional live sessions & participation metrics</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-80 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Filter by meeting title..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 text-sm border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none"
                            />
                        </div>
                        <Button className="btn-gradient text-white h-11 px-6 rounded-xl text-[11px] font-bold uppercase shadow-lg shadow-orange-200/40">
                            Search
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Rows:</span>
                        <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(parseInt(val))}>
                            <SelectTrigger className="w-[100px] h-10 border-gray-100 bg-gray-50/30 text-xs rounded-xl shadow-none">
                                <SelectValue placeholder="50" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 Rows</SelectItem>
                                <SelectItem value="25">25 Rows</SelectItem>
                                <SelectItem value="50">50 Rows</SelectItem>
                                <SelectItem value="100">100 Rows</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 text-gray-400 ml-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Copy className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><FileSpreadsheet className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-lg cursor-pointer"><Printer className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-50 overflow-hidden shadow-sm overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-600">
                            <TableRow className="hover:bg-transparent border-gray-50">
                                <TableHead className="py-4 px-6 min-w-[250px]">Meeting Dimension</TableHead>
                                <TableHead className="py-4 px-6 min-w-[150px]">Temporal Schedule</TableHead>
                                <TableHead className="py-4 px-6 text-center">Protocol</TableHead>
                                <TableHead className="py-4 px-6 min-w-[150px]">Initiated By</TableHead>
                                <TableHead className="py-4 px-6 text-center min-w-[100px]">Participants</TableHead>
                                <TableHead className="py-4 px-6 text-right min-w-[120px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Auditing Sessions...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-400 text-sm italic">
                                        No analytical records found in the current audit period.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((item) => (
                                    <TableRow key={item.id} className="text-[13px] text-gray-600 hover:bg-gray-50/30 group border-b last:border-0 border-gray-50 transition-colors">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-indigo-700 uppercase tracking-tight">{item.title}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter truncate max-w-[300px]">{item.description || "Institutional live session"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-tighter">
                                                    <Calendar className="h-3.5 w-3.5 text-indigo-500" /> {new Date(item.date_time).toLocaleDateString()}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-5">
                                                    {new Date(item.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-center">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full font-bold text-[9px] border uppercase tracking-widest",
                                                item.api_used === 'Global' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-purple-50 text-purple-600 border-purple-100"
                                            )}>
                                                {item.api_used} Protocol
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 font-bold text-gray-400 uppercase tracking-tighter text-[11px]">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-[9px]">
                                                    {item.creator?.name?.[0]}{item.creator?.last_name?.[0]}
                                                </div>
                                                {item.creator ? `${item.creator.name} ${item.creator.last_name}` : "System Core"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-center">
                                            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold text-[10px] border border-emerald-100">
                                                <Users className="h-3 w-3" /> {item.total_join}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md" title="Join / View">
                                                    <MonitorPlay className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 bg-gray-50 border border-gray-100 text-gray-400 hover:text-indigo-600 rounded-lg shadow-sm">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-4 uppercase tracking-tight">
                    <div>
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" 
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="default" size="sm" className="h-8 w-8 p-0 btn-gradient text-white border-0 rounded-lg shadow-md">
                            {currentPage}
                        </Button>
                        <Button 
                            onClick={() => setCurrentPage(p => p + 1)}
                            variant="outline" size="sm" className="h-8 w-8 p-0 border-gray-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" 
                            disabled={reports.length < itemsPerPage}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
