"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    X,
    FileJson,
    Menu as MenuIcon,
    ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, addMonths, subMonths } from "date-fns";

interface AlumniEvent {
    id: string;
    event_title: string;
    school_class_id: string | null;
    section_id: string | null;
    session_id: string | null;
    from_date: string;
    to_date: string;
    note: string | null;
    photo: string | null;
    show_on_app: boolean;
    school_class?: { name: string };
    section?: { name: string };
    session?: { session: string };
}

export default function AlumniEventsPage() {
    const { toast } = useToast();
    const [events, setEvents] = useState<AlumniEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Form State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AlumniEvent | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    
    // Criteria Data
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");
    
    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4)); // Default to May 2026 as per screenshot if we wanted, but let's just use current date usually. Actually, let's use current month.
    
    const [formState, setFormState] = useState({
        event_title: "",
        school_class_id: "all",
        section_id: "all",
        session_id: "all",
        from_date: format(new Date(), "yyyy-MM-dd"),
        to_date: format(new Date(), "yyyy-MM-dd"),
        note: "",
        show_on_app: true
    });

    useEffect(() => {
        setMounted(true);
        fetchEvents();
        fetchCriteria();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await api.get("/alumni/events");
            setEvents(response.data.data || []);
        } catch (error) {
            toast({ title: "Error", description: "Failed to load events.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchCriteria = async () => {
        try {
            const [classesData, sessionsData] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/system-setting/sessions")
            ]);
            
            setClasses(classesData.data.data || []);
            setSessions(sessionsData.data.data || []);
        } catch (error) {
            console.error("Failed to fetch criteria");
        }
    };

    const handleClassChange = (classId: string) => {
        setFormState({ ...formState, school_class_id: classId, section_id: "all" });
        if (classId === "all") {
            setSections([]);
            return;
        }
        const selectedCls = classes.find(c => c.id.toString() === classId);
        setSections(selectedCls?.sections || []);
    };

    const handleOpenDialog = (event: AlumniEvent | null = null) => {
        if (event) {
            setEditingEvent(event);
            setFormState({
                event_title: event.event_title,
                school_class_id: event.school_class_id?.toString() || "all",
                section_id: event.section_id?.toString() || "all",
                session_id: event.session_id?.toString() || "all",
                from_date: event.from_date,
                to_date: event.to_date,
                note: event.note || "",
                show_on_app: event.show_on_app
            });
            if (event.school_class_id) {
                handleClassChange(event.school_class_id.toString());
            }
        } else {
            setEditingEvent(null);
            setFormState({
                event_title: "",
                school_class_id: "all",
                section_id: "all",
                session_id: "all",
                from_date: format(new Date(), "yyyy-MM-dd"),
                to_date: format(new Date(), "yyyy-MM-dd"),
                note: "",
                show_on_app: true
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formState.event_title || !formState.from_date || !formState.to_date) {
            toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
            return;
        }

        setFormLoading(true);
        try {
            const payload = {
                ...formState,
                school_class_id: formState.school_class_id === "all" ? null : formState.school_class_id,
                section_id: formState.section_id === "all" ? null : formState.section_id,
                session_id: formState.session_id === "all" ? null : formState.session_id,
            };

            if (editingEvent) {
                await api.put(`/alumni/events/${editingEvent.id}`, payload);
                toast({ title: "Success", description: "Event updated successfully." });
            } else {
                await api.post("/alumni/events", payload);
                toast({ title: "Success", description: "Event created successfully." });
            }
            setIsDialogOpen(false);
            fetchEvents();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save event.", variant: "destructive" });
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this event?")) return;
        try {
            await api.delete(`/alumni/events/${id}`);
            toast({ title: "Success", description: "Event deleted successfully." });
            fetchEvents();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete event.", variant: "destructive" });
        }
    };

    const filteredEvents = events.filter(e =>
        e.event_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalEntries = filteredEvents.length;
    const itemsPerPageNum = parseInt(itemsPerPage);
    const totalPages = Math.ceil(totalEntries / itemsPerPageNum);
    const startIndex = (currentPage - 1) * itemsPerPageNum;
    const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPageNum);

    // Calendar Logic
    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-4 relative">
                <div className="flex bg-gradient-to-r from-[#FF9800] to-[#6366F1] rounded overflow-hidden shadow-sm absolute left-0">
                    <button 
                        className="px-3 py-1.5 text-white hover:bg-white/20 border-r border-white/20 transition-colors"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button 
                        className="px-3 py-1.5 text-white hover:bg-white/20 transition-colors"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
                <div className="w-full text-center">
                    <h2 className="text-xl text-slate-700 font-normal">{format(currentMonth, "MMMM yyyy")}</h2>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return (
            <div className="grid grid-cols-7 border-t border-l border-gray-200">
                {days.map(day => (
                    <div key={day} className="py-2 text-center text-sm text-slate-600 font-normal border-r border-b border-gray-200 bg-white">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        // adjust to start on Monday
        let startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const formattedDate = format(day, "d");
                const cloneDay = day;
                const isCurrentMonth = isSameMonth(day, monthStart);

                days.push(
                    <div
                        key={day.toString()}
                        className={cn(
                            "h-24 p-2 border-r border-b border-gray-200 bg-white flex justify-end items-start",
                            !isCurrentMonth ? "text-gray-300" : "text-gray-600"
                        )}
                    >
                        <span className="text-sm">{formattedDate}</span>
                        {/* Event indicator could go here if needed */}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 border-l border-gray-200" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="bg-white">{rows}</div>;
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col lg:flex-row gap-6 font-sans text-slate-700">
            {/* Left Section: Calendar */}
            <div className="w-full lg:w-[45%]">
                <Card className="rounded-sm shadow-sm border border-gray-200 bg-white">
                    <CardContent className="p-6">
                        {renderHeader()}
                        <div className="mt-6">
                            {renderDays()}
                            {renderCells()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Section: Event List */}
            <div className="flex-1">
                <Card className="rounded-sm shadow-sm border border-gray-200 bg-white">
                    <CardHeader className="px-6 py-4 border-b border-gray-200 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xl font-normal text-slate-700">Event List</CardTitle>
                        <Button 
                            onClick={() => handleOpenDialog()}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white rounded-full shadow-lg shadow-indigo-500/30 px-6 h-10 font-bold text-sm transition-all"
                        >
                            + Add
                        </Button>
                    </CardHeader>
                    <CardContent className="p-4">
                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                            <div className="relative w-full sm:w-64">
                                <Input
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-9 rounded-sm border border-gray-300 focus-visible:ring-0 text-sm w-full"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-8 w-16 text-sm border-none shadow-none focus:ring-0 px-1 font-semibold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm hover:bg-gray-100"><Copy className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm hover:bg-gray-100"><FileSpreadsheet className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm hover:bg-gray-100"><FileJson className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm hover:bg-gray-100"><FileText className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm hover:bg-gray-100"><Printer className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm hover:bg-gray-100"><Columns className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table className="border-b border-gray-200">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-sm font-bold text-slate-700 py-3 h-auto whitespace-nowrap">Event Title <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-50" /></TableHead>
                                        <TableHead className="text-sm font-bold text-slate-700 py-3 h-auto whitespace-nowrap">Class Section <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-50" /></TableHead>
                                        <TableHead className="text-sm font-bold text-slate-700 py-3 h-auto whitespace-nowrap">Pass Out Session <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-50" /></TableHead>
                                        <TableHead className="text-sm font-bold text-slate-700 py-3 h-auto whitespace-nowrap">From <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-50" /></TableHead>
                                        <TableHead className="text-sm font-bold text-slate-700 py-3 h-auto whitespace-nowrap">To <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-50" /></TableHead>
                                        <TableHead className="text-sm font-bold text-slate-700 py-3 h-auto text-right whitespace-nowrap pr-4">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                                Loading events...
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedEvents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                                No events found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedEvents.map((event, index) => (
                                            <TableRow key={event.id} className="hover:bg-gray-50/50">
                                                <TableCell className="py-4 text-sm text-slate-600">
                                                    {event.event_title}
                                                </TableCell>
                                                <TableCell className="py-4 text-sm text-slate-600">
                                                    {event.school_class_id ? `${event.school_class?.name || ''} ${event.section?.name || ''}` : 'All'}
                                                </TableCell>
                                                <TableCell className="py-4 text-sm text-slate-600">
                                                    {event.session?.session || ""}
                                                </TableCell>
                                                <TableCell className="py-4 text-sm text-slate-600">
                                                    {format(new Date(event.from_date), "dd-MMM-yyyy")}
                                                </TableCell>
                                                <TableCell className="py-4 text-sm text-slate-600">
                                                    {format(new Date(event.to_date), "dd-MMM-yyyy")}
                                                </TableCell>
                                                <TableCell className="py-4 pr-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button 
                                                            size="icon" 
                                                            className="h-8 w-8 rounded-md bg-[#10b981] hover:bg-[#059669] text-white shadow-sm"
                                                        >
                                                            <MenuIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            onClick={() => handleOpenDialog(event)}
                                                            size="icon" 
                                                            className="h-8 w-8 rounded-md bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-sm"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            onClick={() => handleDelete(event.id)}
                                                            size="icon" 
                                                            className="h-8 w-8 rounded-md bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-sm"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        
                        {/* Pagination Footer */}
                        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                            <div>
                                {totalEntries > 0 ? (
                                    `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPageNum, totalEntries)} of ${totalEntries} entries`
                                ) : (
                                    "Showing 0 to 0 of 0 entries"
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg border-gray-100 shadow-sm text-gray-400 hover:text-gray-600 bg-white"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <Button
                                        key={i}
                                        variant={currentPage === i + 1 ? "default" : "outline"}
                                        className={cn(
                                            "h-8 min-w-[32px] rounded-lg text-xs font-bold transition-all shadow-sm",
                                            currentPage === i + 1 
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-indigo-500/30 border-0" 
                                                : "bg-white border-gray-100 text-gray-500 hover:text-gray-700"
                                        )}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg border-gray-100 shadow-sm text-gray-400 hover:text-gray-600 bg-white"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Form Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 rounded bg-white">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="text-lg font-normal text-slate-800">{editingEvent ? "Edit Event" : "Add Event"}</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-normal text-slate-700">Event Title *</Label>
                            <Input 
                                value={formState.event_title}
                                onChange={(e) => setFormState({...formState, event_title: e.target.value})}
                                className="h-9 rounded-sm border-gray-300"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-normal text-slate-700">Class</Label>
                                <Select value={formState.school_class_id} onValueChange={handleClassChange}>
                                    <SelectTrigger className="h-9 rounded-sm border-gray-300">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {classes.map(cls => <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-normal text-slate-700">Section</Label>
                                <Select value={formState.section_id} onValueChange={(val) => setFormState({...formState, section_id: val})}>
                                    <SelectTrigger className="h-9 rounded-sm border-gray-300">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {sections.map(sec => <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-normal text-slate-700">Pass Out Session</Label>
                                <Select value={formState.session_id} onValueChange={(val) => setFormState({...formState, session_id: val})}>
                                    <SelectTrigger className="h-9 rounded-sm border-gray-300">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {sessions.map(sess => <SelectItem key={sess.id} value={sess.id.toString()}>{sess.session}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-normal text-slate-700">Show on App</Label>
                                <Select value={formState.show_on_app ? "yes" : "no"} onValueChange={(val) => setFormState({...formState, show_on_app: val === "yes"})}>
                                    <SelectTrigger className="h-9 rounded-sm border-gray-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="yes">Yes</SelectItem>
                                        <SelectItem value="no">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-normal text-slate-700">From Date *</Label>
                                <Input 
                                    type="date"
                                    value={formState.from_date}
                                    onChange={(e) => setFormState({...formState, from_date: e.target.value})}
                                    className="h-9 rounded-sm border-gray-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-normal text-slate-700">To Date *</Label>
                                <Input 
                                    type="date"
                                    value={formState.to_date}
                                    onChange={(e) => setFormState({...formState, to_date: e.target.value})}
                                    className="h-9 rounded-sm border-gray-300"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t">
                        <Button 
                            onClick={handleSubmit}
                            disabled={formLoading}
                            className="bg-[#6c5ce7] hover:bg-[#5b4cc4] text-white rounded shadow-sm px-6 h-9 font-normal text-sm"
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
