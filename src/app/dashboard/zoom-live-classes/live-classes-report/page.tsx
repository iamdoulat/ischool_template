"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
    Search, Copy, FileSpreadsheet, FileText, Printer, 
    Columns, ChevronLeft, ChevronRight, Video,
    GraduationCap, Layers, Calendar, Users, 
    Zap, MonitorPlay, ExternalLink, BarChart2,
    BookOpen, UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassReport {
    id: string;
    title: string;
    description: string;
    date_time: string;
    api_used: string;
    created_by: string;
    creator?: { name: string; last_name: string };
    staff?: { name: string; last_name: string; employee_id: string };
    school_class?: { name: string };
    section?: { name: string };
    total_join: number;
    status: string;
}

export default function LiveClassesReportPage() {
    const { toast } = useToast();
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [sections, setSections] = useState<any[]>([]);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [reports, setReports] = useState<ClassReport[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalEntries, setTotalEntries] = useState(0);

    useEffect(() => {
        fetchCriteria();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            const cls = classes.find(c => c.id.toString() === selectedClass);
            setSections(cls?.sections || []);
        } else {
            setSections([]);
        }
    }, [selectedClass, classes]);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/conference/live-classes/criteria');
            setClasses(response.data.classes || []);
        } catch (error) {
            console.error("Failed to fetch criteria");
        }
    };

    const fetchReports = async () => {
        if (!selectedClass || !selectedSection) {
            toast({ title: "Validation", description: "Please select Class and Section", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/conference/live-classes', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm,
                    class_id: selectedClass,
                    section_id: selectedSection
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
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                        <BarChart2 className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                            Live Class Analytical Audit
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Multi-dimensional auditing of curriculum-linked live sessions</p>
                    </div>
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <GraduationCap className="h-24 w-24 text-blue-500" />
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="h-5 w-5 text-blue-500" />
                        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Audit Criteria Selection</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Target Class <span className="text-red-500">*</span></Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-12 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-blue-500 shadow-none">
                                    <SelectValue placeholder="Select Institutional Class" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100">
                                    {classes.map(cls => <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Class Section <span className="text-red-500">*</span></Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="h-12 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-blue-500 shadow-none">
                                    <SelectValue placeholder="Select Academic Section" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100">
                                    {sections.map(sec => <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-50 mt-6">
                        <Button 
                            onClick={fetchReports}
                            className="btn-gradient text-white px-12 h-12 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex gap-3"
                        >
                            <Search className="h-4 w-4" /> Execute Class Audit
                        </Button>
                    </div>
                </div>
            </div>

            {/* Report Section */}
            <div className="bg-white rounded-lg shadow-lg shadow-gray-100/50 border border-gray-100 p-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                        Audit Results Matrix
                    </h2>

                    <div className="flex items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Filter records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 text-[11px] border-gray-100 bg-gray-50/30 rounded-lg shadow-none"
                            />
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 transition-all rounded-lg"><Copy className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 transition-all rounded-lg"><FileSpreadsheet className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 transition-all rounded-lg"><Printer className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-50 overflow-hidden shadow-sm overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-600">
                            <TableRow className="hover:bg-transparent border-gray-50">
                                <TableHead className="py-4 px-6 min-w-[250px]">Curriculum Session</TableHead>
                                <TableHead className="py-4 px-6 min-w-[150px]">Class & Section</TableHead>
                                <TableHead className="py-4 px-6 min-w-[180px]">Session Temporal</TableHead>
                                <TableHead className="py-4 px-6 min-w-[200px]">Assigned Teacher</TableHead>
                                <TableHead className="py-4 px-6 text-center min-w-[100px]">Participants</TableHead>
                                <TableHead className="py-4 px-6 text-right min-w-[100px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Executing Audit Protocol...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-gray-400 text-[11px] font-bold uppercase tracking-widest italic">
                                        No curriculum sessions found for the selected criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((item) => (
                                    <TableRow key={item.id} className="text-[13px] text-gray-600 hover:bg-gray-50/30 group border-b last:border-0 border-gray-50 transition-colors">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-blue-700 uppercase tracking-tight">{item.title}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter truncate max-w-[250px]">{item.description || "Official curriculum-linked session"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold text-[9px] border border-blue-100 uppercase">
                                                    {item.school_class?.name}
                                                </span>
                                                <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded-full font-bold text-[9px] border border-gray-100 uppercase">
                                                    Section {item.section?.name}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-tighter">
                                                    <Calendar className="h-3.5 w-3.5 text-blue-500" /> {new Date(item.date_time).toLocaleDateString()}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-5">
                                                    {new Date(item.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                                    {item.staff?.name?.[0]}{item.staff?.last_name?.[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-gray-700 uppercase">{item.staff?.name} {item.staff?.last_name}</span>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Ref: {item.staff?.employee_id}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-center">
                                            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold text-[10px] border border-emerald-100">
                                                <Users className="h-3 w-3" /> {item.total_join}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <Button size="icon" variant="ghost" className="h-9 w-9 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-100" title="Join Session">
                                                    <MonitorPlay className="h-4.5 w-4.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-9 w-9 bg-gray-50 border border-gray-100 text-gray-400 hover:text-blue-600 rounded-lg shadow-sm">
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
                            variant="outline" size="sm" className="h-9 w-9 p-0 border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-600" 
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="default" size="sm" className="h-9 w-9 p-0 btn-gradient text-white border-0 rounded-lg shadow-md">
                            {currentPage}
                        </Button>
                        <Button 
                            onClick={() => setCurrentPage(p => p + 1)}
                            variant="outline" size="sm" className="h-9 w-9 p-0 border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-600" 
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
