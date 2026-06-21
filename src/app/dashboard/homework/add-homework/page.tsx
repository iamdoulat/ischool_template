"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Plus,
    Eye,
    Pencil,
    Trash2,
    ArrowUpDown,
    Filter,
    BookOpenCheck
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

interface HomeworkRecord {
    id: number;
    schoolClass?: { name: string };
    class?: { name: string };
    section?: { name: string };
    subjectGroup?: { name: string };
    subject?: { name: string };
    homework_date: string;
    submission_date: string;
    evaluation_date?: string;
    creator?: { name: string };
    description: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

interface OptionItem {
    id: number;
    name: string;
    school_class_id?: number;
}

export default function AddHomeworkPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [homeworks, setHomeworks] = useState<HomeworkRecord[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState("50");

    const [classes, setClasses] = useState<OptionItem[]>([]);
    const [sections, setSections] = useState<OptionItem[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<OptionItem[]>([]);
    const [subjects, setSubjects] = useState<OptionItem[]>([]);

    const [filters, setFilters] = useState({
        class_id: "",
        section_id: "",
        subject_group_id: "",
        subject_id: "",
    });

    const [activeTab, setActiveTab] = useState("upcoming");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        class_id: "",
        section_id: "",
        subject_group_id: "",
        subject_id: "",
        homework_date: new Date().toISOString().split('T')[0],
        submission_date: new Date().toISOString().split('T')[0],
        description: "",
    });

    const filteredSections = filters.class_id
        ? sections.filter(s => String(s.school_class_id) === filters.class_id)
        : sections;
    const filteredSubjectGroups = filters.class_id
        ? subjectGroups.filter(sg => String(sg.school_class_id) === filters.class_id)
        : subjectGroups;
    const filteredSubjects = filters.class_id
        ? subjects.filter(s => String(s.school_class_id) === filters.class_id)
        : subjects;

    const formFilteredSections = formData.class_id
        ? sections.filter(s => String(s.school_class_id) === formData.class_id)
        : sections;
    const formFilteredSubjectGroups = formData.class_id
        ? subjectGroups.filter(sg => String(sg.school_class_id) === formData.class_id)
        : subjectGroups;
    const formFilteredSubjects = formData.class_id
        ? subjects.filter(s => String(s.school_class_id) === formData.class_id)
        : subjects;

    const today = new Date().toISOString().split('T')[0];
    const upcomingHomeworks = homeworks.filter(h => h.submission_date >= today);
    const closedHomeworks = homeworks.filter(h => h.submission_date < today);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [classesRes, sectionsRes, groupsRes, subjectsRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true'),
                api.get('/academics/sections?with_class=true&no_paginate=true'),
                api.get('/academics/subject-groups?no_paginate=true'),
                api.get('/academics/subjects?no_paginate=true')
            ]);
            setClasses(classesRes.data.data || []);
            setSections(sectionsRes.data.data || []);
            setSubjectGroups(groupsRes.data.data || []);
            setSubjects(subjectsRes.data.data || []);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    const fetchHomeworks = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit,
                search: searchTerm,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });
            const response = await api.get(`/homework/homeworks?${params.toString()}`);
            setHomeworks(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching homeworks:", error);
            toast({ title: "Error", description: "Failed to fetch homeworks", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchHomeworks(1);
    };

    const handleSave = async () => {
        try {
            await api.post('/homework/homeworks', formData);
            toast({ title: "Success", description: "Homework added successfully" });
            setIsDialogOpen(false);
            fetchHomeworks();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            toast({
                title: "Error",
                description: err.response?.data?.message || "Failed to save homework",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this homework?")) {
            try {
                await api.delete(`/homework/homeworks/${id}`);
                toast({ title: "Success", description: "Homework deleted successfully" });
                fetchHomeworks();
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete homework", variant: "destructive" });
            }
        }
    };

    const handleCopy = () => {
        const text = homeworks.map(h => `${h.schoolClass?.name}\t${h.subject?.name}\t${h.homework_date}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };

    const handleExportCSV = () => {
        const headers = ["Class", "Section", "Subject", "Homework Date", "Submission Date"];
        const rows = homeworks.map(h => [h.schoolClass?.name, h.section?.name, h.subject?.name, h.homework_date, h.submission_date]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "homework_list.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toolbarActions: { Icon: React.ElementType; onClick: () => void; title: string }[] = [
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Select Criteria</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Filter homework by class, section &amp; subject</p>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Class <span className="text-red-500">*</span>
                            </Label>
                            <Select value={filters.class_id} onValueChange={(v) => setFilters({ ...filters, class_id: v, section_id: "", subject_group_id: "", subject_id: "" })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">Section</Label>
                            <Select value={filters.section_id} onValueChange={(v) => setFilters({ ...filters, section_id: v })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredSections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">Subject Group</Label>
                            <Select value={filters.subject_group_id} onValueChange={(v) => setFilters({ ...filters, subject_group_id: v })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredSubjectGroups.map(sg => <SelectItem key={sg.id} value={String(sg.id)}>{sg.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">Subject</Label>
                            <Select value={filters.subject_id} onValueChange={(v) => setFilters({ ...filters, subject_id: v })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredSubjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end md:col-span-4">
                            <Button type="submit" className="btn-gradient gap-2 h-9 px-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-md">
                                <Search className="h-3.5 w-3.5" /> Search
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Homework List Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BookOpenCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Add Homework</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{pagination?.total ?? homeworks.length} homework record(s)</p>
                        </div>
                    </div>
                    <Button onClick={() => setIsDialogOpen(true)} className="btn-gradient gap-2 h-8 px-4 text-[10px] font-bold uppercase transition-all rounded-full shadow-md">
                        <Plus className="h-3.5 w-3.5" /> Add Homework
                    </Button>
                </CardHeader>
                <CardContent className="p-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-transparent h-auto p-0 border-b border-gray-100 w-full justify-start rounded-none gap-6 mb-4">
                            <TabsTrigger
                                value="upcoming"
                                className="text-[11px] font-medium px-0 py-2 border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 rounded-none bg-transparent shadow-none"
                            >
                                Upcoming Homework
                            </TabsTrigger>
                            <TabsTrigger
                                value="closed"
                                className="text-[11px] font-medium px-0 py-2 border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 rounded-none bg-transparent shadow-none"
                            >
                                Closed Homework
                            </TabsTrigger>
                        </TabsList>

                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 border-b border-gray-50 pb-4">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder="Search results..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 h-9 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/50"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <Select value={limit} onValueChange={setLimit}>
                                        <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 bg-transparent shadow-none rounded-md px-2 flex gap-1 items-center justify-between">
                                            <SelectValue />
                                            <ChevronLeft className="h-2 w-2 text-gray-400 rotate-90" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    {toolbarActions.map((action, i) => (
                                        <Button
                                            key={i}
                                            variant="ghost"
                                            size="icon"
                                            onClick={action.onClick}
                                            title={action.title}
                                            className="h-7 w-7 hover:bg-gray-100 rounded"
                                        >
                                            <action.Icon className="h-3.5 w-3.5" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            Class <ArrowUpDown className="h-2.5 w-2.5 inline-block ml-1 opacity-50" />
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Section</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Subject Group</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Subject</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Homework Date</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Submission Date</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Evaluation Date</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Created By</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(() => {
                                        const displayData = activeTab === "upcoming" ? upcomingHomeworks : closedHomeworks;
                                        if (loading) return <TableSkeleton rows={5} cols={9} />;
                                        if (displayData.length === 0) return (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">No data found</td>
                                            </tr>
                                        );
                                        return displayData.map((item) => (
                                        <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                            <TableCell className="py-3 text-gray-700 font-medium">{item.schoolClass?.name || item.class?.name || "-"}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.section?.name || "-"}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.subjectGroup?.name || "-"}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.subject?.name || "-"}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{formatDate(item.homework_date)}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{formatDate(item.submission_date)}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.evaluation_date ? formatDate(item.evaluation_date) : "-"}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{item.creator?.name || "-"}</TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-sm">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-sm">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))})()}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Footer / Pagination */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50">
                            <div>
                                Showing {pagination?.from || 0} to {pagination?.to || 0} of {pagination?.total || 0} entries
                            </div>
                            <div className="flex gap-2 items-center">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={pagination?.current_page === 1}
                                    onClick={() => fetchHomeworks(pagination!.current_page - 1)}
                                    className="h-7 w-7 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 hover:opacity-90 transition-all shadow-sm disabled:opacity-30"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                    <Button
                                        key={i + 1}
                                        onClick={() => fetchHomeworks(i + 1)}
                                        className={cn(
                                            "h-7 w-7 p-0 text-[11px] font-bold rounded-[10px] shadow-sm transition-all duration-300",
                                            pagination?.current_page === i + 1
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white"
                                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={pagination?.current_page === pagination?.last_page}
                                    onClick={() => fetchHomeworks(pagination!.current_page + 1)}
                                    className="h-7 w-7 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 hover:opacity-90 transition-all shadow-sm disabled:opacity-30"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Add Homework Dialog */}
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                                <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                                    <DialogTitle className="text-lg font-bold text-white">Add Homework</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4 px-6 py-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">Class <span className="text-red-500">*</span></Label>
                                        <Select value={formData.class_id} onValueChange={(v) => setFormData({ ...formData, class_id: v, section_id: "", subject_group_id: "", subject_id: "" })}>
                                            <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                                <SelectValue placeholder="Select Class" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">Section <span className="text-red-500">*</span></Label>
                                        <Select value={formData.section_id} onValueChange={(v) => setFormData({ ...formData, section_id: v })}>
                                            <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                                <SelectValue placeholder="Select Section" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formFilteredSections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">Subject Group</Label>
                                        <Select value={formData.subject_group_id} onValueChange={(v) => setFormData({ ...formData, subject_group_id: v })}>
                                            <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                                <SelectValue placeholder="Select Group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formFilteredSubjectGroups.map(sg => <SelectItem key={sg.id} value={String(sg.id)}>{sg.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">Subject <span className="text-red-500">*</span></Label>
                                        <Select value={formData.subject_id} onValueChange={(v) => setFormData({ ...formData, subject_id: v })}>
                                            <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                                <SelectValue placeholder="Select Subject" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formFilteredSubjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">Homework Date <span className="text-red-500">*</span></Label>
                                        <DatePicker
                                            value={formData.homework_date}
                                            onChange={(date) => setFormData({ ...formData, homework_date: date })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">Submission Date <span className="text-red-500">*</span></Label>
                                        <DatePicker
                                            value={formData.submission_date}
                                            onChange={(date) => setFormData({ ...formData, submission_date: date })}
                                        />
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">Description</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="border-gray-200 text-xs shadow-none min-h-[80px]"
                                            placeholder="Enter homework instructions..."
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="px-6 pb-6">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full">Cancel</Button>
                                    <Button onClick={handleSave} className="btn-gradient h-9 px-8 text-[11px] uppercase font-bold rounded-full">Save Homework</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
