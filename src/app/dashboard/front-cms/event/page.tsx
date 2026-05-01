"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
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
    Pencil,
    Trash2,
    Plus,
    ArrowUpDown,
    Eye,
    X,
    Loader2,
    Calendar,
    MapPin
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EventItem {
    id: number;
    title: string;
    venue: string | null;
    start_date: string;
    end_date: string | null;
    description: string | null;
    image_path: string | null;
}

export default function EventListPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        title: "",
        venue: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        description: "",
        image: null as File | null
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/events");
            if (res.data?.status === "Success") {
                setEvents(res.data.data);
            }
        } catch (error) {
            toast("error", "Failed to load events");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (item?: EventItem) => {
        if (item) {
            setEditingId(item.id);
            setFormData({
                title: item.title,
                venue: item.venue || "",
                start_date: item.start_date,
                end_date: item.end_date || "",
                description: item.description || "",
                image: null
            });
        } else {
            setEditingId(null);
            setFormData({
                title: "",
                venue: "",
                start_date: new Date().toISOString().split('T')[0],
                end_date: "",
                description: "",
                image: null
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.start_date) {
            toast("error", "Title and Start Date are required");
            return;
        }

        setSaving(true);
        try {
            const data = new FormData();
            data.append("title", formData.title);
            data.append("venue", formData.venue);
            data.append("start_date", formData.start_date);
            data.append("end_date", formData.end_date);
            data.append("description", formData.description);
            if (formData.image) {
                data.append("image", formData.image);
            }

            let res;
            if (editingId) {
                data.append('_method', 'PUT');
                res = await api.post(`front-cms/events/${editingId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                res = await api.post("front-cms/events", data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (res.data?.status === "Success" || res.status === 200 || res.status === 201) {
                toast("success", editingId ? "Event updated successfully" : "Event added successfully");
                setIsDialogOpen(false);
                fetchEvents();
            }
        } catch (error) {
            toast("error", "Failed to save event");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this event?")) return;
        try {
            const res = await api.delete(`front-cms/events/${id}`);
            if (res.data?.status === "Success") {
                toast("success", "Event deleted successfully");
                fetchEvents();
            }
        } catch (error) {
            toast("error", "Failed to delete event");
        }
    };

    const filteredEvents = events.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.venue && item.venue.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <h2 className="text-sm font-semibold text-gray-800 tracking-tight">Event List</h2>
                    <Button 
                        onClick={() => handleOpenDialog()}
                        className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-5 h-9 font-bold rounded-full shadow-md flex items-center gap-2 tracking-tight"
                    >
                        <Plus className="h-4 w-4 text-white font-bold stroke-[3px]" />
                        Add Event
                    </Button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-9 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/50"
                            />
                        </div>
                        <Button className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-5 h-9 font-bold rounded-full shadow-md flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-gray-400">
                            {[Copy, FileSpreadsheet, FileText, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[800px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">Title</TableHead>
                                <TableHead className="py-3 px-4">Date</TableHead>
                                <TableHead className="py-3 px-4">Venue</TableHead>
                                <TableHead className="py-3 px-4 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredEvents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                                        No events found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredEvents.map((item) => (
                                    <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3 px-4 font-medium text-gray-700">
                                            {item.title}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {item.start_date} {item.end_date ? `- ${item.end_date}` : ""}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {item.venue || "No venue"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 bg-[#10b981] hover:bg-[#059669] text-white rounded-[10px] shadow-md border-0">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    onClick={() => handleOpenDialog(item)}
                                                    className="h-8 w-8 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-[10px] shadow-md border-0"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    onClick={() => handleDelete(item.id)}
                                                    className="h-8 w-8 bg-[#ef4444] hover:bg-[#dc2626] text-white rounded-[10px] shadow-md border-0 flex items-center justify-center"
                                                >
                                                    <X className="h-4 w-4 stroke-[3px]" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>
                        Showing 1 to {filteredEvents.length} of {events.length} entries
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-[14px] bg-gray-50/50 border border-gray-100 hover:bg-gray-100 text-gray-500">
                            <ChevronLeft className="h-4 w-4 stroke-[3px]" />
                        </Button>
                        <Button variant="default" size="icon" className="h-9 w-9 p-0 bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white border-0 font-bold text-[14px] rounded-[14px] shadow-md">
                            1
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-[14px] bg-gray-50/50 border border-gray-100 hover:bg-gray-100 text-gray-500">
                            <ChevronRight className="h-4 w-4 stroke-[3px]" />
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Event" : "Add Event"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Title <span className="text-red-500">*</span></Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="h-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 shadow-none bg-gray-50/50"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Start Date <span className="text-red-500">*</span></Label>
                                <Input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="h-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 shadow-none bg-gray-50/50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">End Date (Optional)</Label>
                                <Input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="h-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 shadow-none bg-gray-50/50"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Venue</Label>
                            <Input
                                value={formData.venue}
                                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                className="h-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 shadow-none bg-gray-50/50"
                                placeholder="School Hall, Ground, etc."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="border-gray-200 text-[11px] focus-visible:ring-indigo-500 shadow-none bg-gray-50/50 min-h-[80px]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Event Image</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                                className="h-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 shadow-none bg-gray-50/50 cursor-pointer"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-8 h-9 text-[11px] font-bold uppercase transition-all rounded-full shadow-md"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Event"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
