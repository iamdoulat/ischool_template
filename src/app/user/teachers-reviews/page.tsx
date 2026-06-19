"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Copy, FileSpreadsheet, FileDown, Printer, Plus, Star, Pencil,
    ChevronLeft, ChevronRight, Loader2, Search, GraduationCap,
    Mail, Phone, Clock, DoorOpen, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ScheduleItem {
    subject: string;
    time: string;
    room: string;
}

interface Teacher {
    id: number;
    teacherName: string;
    isClassTeacher: boolean;
    email: string;
    phone: string;
    rating: number | null;
    comment: string;
    ratingStatus: string | null;
    ratingId: number | null;
    schedule: ScheduleItem[];
}

function RatingStars({ rating, size = "sm" }: { rating: number | null; size?: "sm" | "md" }) {
    if (rating === null) {
        return <span className="text-[11px] text-gray-400 italic">Not rated</span>;
    }
    const dim = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={cn(dim, star <= rating ? "text-[#f39c12] fill-[#f39c12]" : "text-gray-200 fill-gray-200")}
                />
            ))}
            <span className="ml-1 font-bold text-gray-700 text-[12px]">{rating.toFixed(1)}</span>
        </div>
    );
}

function StatusBadge({ status }: { status: string | null }) {
    if (!status) return null;
    const isApproved = status.toLowerCase() === "approved";
    return (
        <span
            className={cn(
                "inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wide border",
                isApproved
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
            )}
        >
            {status}
        </span>
    );
}

function SelectableStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                >
                    <Star
                        className={cn(
                            "h-9 w-9 cursor-pointer transition-colors",
                            star <= (hover || value) ? "text-[#f39c12] fill-[#f39c12]" : "text-gray-200 fill-gray-200"
                        )}
                    />
                </button>
            ))}
            <span className="ml-2 text-sm font-bold text-gray-600">{value}/5</span>
        </div>
    );
}

export default function UserTeachersReviewsPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [currentPage, setCurrentPage] = useState(1);

    // Rating dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [ratingValue, setRatingValue] = useState(0);
    const [commentValue, setCommentValue] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/user/teachers-reviews");
            setTeachers(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching teachers reviews:", error);
            toast.error("Failed to load teachers reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openRatingDialog = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setRatingValue(teacher.rating || 0);
        setCommentValue(teacher.comment || "");
        setDialogOpen(true);
    };

    const handleSubmitRating = async () => {
        if (!selectedTeacher || ratingValue === 0) return;
        setSubmitting(true);
        try {
            const payload = {
                staff_id: String(selectedTeacher.id),
                staff_name: selectedTeacher.teacherName,
                rating: ratingValue,
                comment: commentValue,
            };
            await api.post("/user/teachers-reviews", payload);
            toast.success("Rating submitted successfully");
            setDialogOpen(false);
            fetchData();
        } catch {
            toast.error("Failed to submit rating");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredData = teachers.filter(c =>
        c.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.schedule.some(s => s.subject.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredData.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    const paginatedData = filteredData.slice(startIndex, startIndex + sizeNum);

    /* ---------- Exports ---------- */
    const exportRows = () =>
        filteredData.map((t) => ({
            "Teacher Name": t.teacherName,
            "Subjects": t.schedule.map((s) => s.subject).join(", ") || "—",
            "Schedule": t.schedule.map((s) => s.time).join(" | ") || "—",
            "Room": t.schedule.map((s) => s.room).filter(Boolean).join(", ") || "—",
            "Email": t.email || "—",
            "Phone": t.phone || "—",
            "My Rating": t.rating ?? "—",
            "Comment": t.comment || "—",
            "Status": t.ratingStatus || "—",
        }));

    const copyToClipboard = () => {
        const text = filteredData
            .map((t) => `${t.teacherName} - ${t.rating ?? "Not rated"} - ${t.comment || ""}`)
            .join("\n");
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(exportRows());
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Teachers Reviews");
        XLSX.writeFile(wb, "teachers_reviews.xlsx");
        toast.success("Excel exported");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Teachers Reviews", 14, 15);
        autoTable(doc, {
            head: [["Teacher Name", "Subjects", "Email", "Phone", "Rating", "Status"]],
            body: filteredData.map((t) => [
                t.teacherName,
                t.schedule.map((s) => s.subject).join(", ") || "—",
                t.email || "—",
                t.phone || "—",
                t.rating ?? "—",
                t.ratingStatus || "—",
            ]),
            startY: 20,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [99, 102, 241] },
        });
        doc.save("teachers_reviews.pdf");
        toast.success("PDF exported");
    };

    const toolbarActions = [
        { icon: Copy, label: "Copy", action: copyToClipboard },
        { icon: FileSpreadsheet, label: "Excel", action: exportToExcel },
        { icon: FileDown, label: "PDF", action: exportToPDF },
        { icon: Printer, label: "Print", action: () => window.print() },
    ];

    return (
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 bg-gray-50/40 min-h-screen font-sans">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-0">
                {/* Header */}
                <div className="border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center gap-3 bg-gradient-to-r from-indigo-50/60 to-transparent">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm shrink-0">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-tight">Teachers Reviews</h1>
                        <p className="text-[12px] text-gray-500">Rate and review your subject teachers</p>
                    </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 print:hidden">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <Input
                                placeholder="Search teacher, subject or email..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-9 pl-9 text-[12px] border-gray-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                            />
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-2">
                            <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                <SelectTrigger className="h-9 w-16 text-[12px] border-gray-200 shadow-none rounded-lg font-medium">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Export / Print group — right aligned */}
                            <div className="flex items-center border border-gray-200 rounded-[10px] overflow-hidden ml-auto md:ml-2">
                                {toolbarActions.map(({ icon: Icon, label, action }, i, arr) => (
                                    <Button
                                        key={label}
                                        variant="ghost"
                                        size="icon"
                                        title={label}
                                        onClick={action}
                                        className={cn(
                                            "h-9 w-9 rounded-none text-gray-500 hover:text-indigo-600 hover:bg-gray-100",
                                            i < arr.length - 1 && "border-r border-gray-200"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ---------- Desktop Table ---------- */}
                    <div className="hidden lg:block rounded-lg border border-gray-100 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1100px]">
                            <TableHeader className="bg-gray-50">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-gray-600 border-b border-gray-100">
                                    <TableHead className="py-3 px-4 h-auto">Teacher</TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Subject</TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Time</TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-center">Room</TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Contact</TableHead>
                                    <TableHead className="py-3 px-4 h-auto">My Rating</TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Comment</TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-right print:hidden">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={8} className="text-center py-12 text-gray-500 text-sm">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading teachers reviews...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedData.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                                            No teachers found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((item) => (
                                        <TableRow key={item.id} className="text-[13px] border-b border-gray-50 last:border-0 hover:bg-indigo-50/20 transition-colors whitespace-nowrap text-gray-600 align-top">
                                            <TableCell className="py-4 px-4 font-medium text-gray-800">
                                                <div className="flex flex-col gap-1">
                                                    <span>{item.teacherName}</span>
                                                    {item.isClassTeacher && (
                                                        <span className="w-fit px-1.5 py-0.5 bg-[#5cb85c]/10 text-[#3d8b3d] text-[10px] rounded font-bold border border-[#5cb85c]/20">
                                                            Class Teacher
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4 text-[12px]">
                                                {item.schedule.length === 0 ? (
                                                    <span className="text-gray-300">—</span>
                                                ) : (
                                                    item.schedule.map((s, i) => (
                                                        <div key={i} className="mb-1 last:mb-0 text-gray-600">{s.subject}</div>
                                                    ))
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 px-4 text-[12px]">
                                                {item.schedule.length === 0 ? (
                                                    <span className="text-gray-300">—</span>
                                                ) : (
                                                    item.schedule.map((s, i) => (
                                                        <div key={i} className="mb-1 last:mb-0 text-gray-500">{s.time}</div>
                                                    ))
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 px-4 text-[12px] text-center">
                                                {item.schedule.length === 0 ? (
                                                    <span className="text-gray-300">—</span>
                                                ) : (
                                                    item.schedule.map((s, i) => (
                                                        <div key={i} className="mb-1 last:mb-0 text-gray-600">{s.room || "—"}</div>
                                                    ))
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 px-4 text-[12px]">
                                                <div className="flex flex-col gap-1">
                                                    {item.email && <span className="text-gray-600">{item.email}</span>}
                                                    {item.phone && <span className="text-gray-400">{item.phone}</span>}
                                                    {!item.email && !item.phone && <span className="text-gray-300">—</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <RatingStars rating={item.rating} />
                                                    <StatusBadge status={item.ratingStatus} />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4 max-w-[220px] whitespace-normal">
                                                <span className="text-gray-500 line-clamp-2" title={item.comment}>
                                                    {item.comment || <span className="text-gray-300">—</span>}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-4 px-4 text-right print:hidden">
                                                <Button
                                                    onClick={() => openRatingDialog(item)}
                                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#e68900] hover:to-[#5558e6] text-white h-8 px-3 rounded-lg text-[11px] font-medium shadow-sm transition-all"
                                                >
                                                    {item.rating !== null ? (
                                                        <><Pencil className="h-3 w-3 mr-1" />Edit</>
                                                    ) : (
                                                        <><Plus className="h-3.5 w-3.5 mr-1" />Rate</>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* ---------- Mobile / Tablet Cards ---------- */}
                    <div className="lg:hidden space-y-3">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 py-12 text-gray-500 text-sm">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading teachers reviews...
                            </div>
                        ) : paginatedData.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-sm">No teachers found</div>
                        ) : (
                            paginatedData.map((item) => (
                                <div key={item.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-gray-800 text-sm truncate">{item.teacherName}</h3>
                                            {item.isClassTeacher && (
                                                <span className="mt-1 inline-block px-1.5 py-0.5 bg-[#5cb85c]/10 text-[#3d8b3d] text-[10px] rounded font-bold border border-[#5cb85c]/20">
                                                    Class Teacher
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => openRatingDialog(item)}
                                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#e68900] hover:to-[#5558e6] text-white h-8 px-3 rounded-lg text-[11px] font-medium shadow-sm shrink-0"
                                        >
                                            {item.rating !== null ? (
                                                <><Pencil className="h-3 w-3 mr-1" />Edit</>
                                            ) : (
                                                <><Plus className="h-3.5 w-3.5 mr-1" />Rate</>
                                            )}
                                        </Button>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <RatingStars rating={item.rating} size="md" />
                                        <StatusBadge status={item.ratingStatus} />
                                    </div>

                                    {item.schedule.length > 0 && (
                                        <div className="mt-3 space-y-1.5 border-t border-gray-50 pt-3">
                                            {item.schedule.map((s, i) => (
                                                <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                                                    <span className="flex items-center gap-1 font-medium text-gray-700"><BookOpen className="h-3 w-3" />{s.subject}</span>
                                                    {s.time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.time}</span>}
                                                    {s.room && <span className="flex items-center gap-1"><DoorOpen className="h-3 w-3" />{s.room}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(item.email || item.phone) && (
                                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-50 pt-3 text-[11px] text-gray-500">
                                            {item.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{item.email}</span>}
                                            {item.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{item.phone}</span>}
                                        </div>
                                    )}

                                    {item.comment && (
                                        <p className="mt-3 border-t border-gray-50 pt-3 text-[11px] text-gray-500 italic">&ldquo;{item.comment}&rdquo;</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-gray-500 pt-2">
                        <div>
                            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                            {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5 print:hidden">
                                <Button
                                    variant="pagination-inactive"
                                    size="icon-sm"
                                    disabled={safePage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <Button
                                        key={page}
                                        variant={safePage === page ? "pagination-active" : "pagination-inactive"}
                                        size="icon-sm"
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}
                                <Button
                                    variant="pagination-inactive"
                                    size="icon-sm"
                                    disabled={safePage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Rating Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle className="text-gray-800 text-base flex items-center gap-2">
                            <Star className="h-4 w-4 text-[#f39c12] fill-[#f39c12]" />
                            Rate Teacher
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 text-xs">
                            {selectedTeacher?.teacherName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">Rating</label>
                            <SelectableStars value={ratingValue} onChange={setRatingValue} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">Comment (optional)</label>
                            <Textarea
                                value={commentValue}
                                onChange={(e) => setCommentValue(e.target.value)}
                                placeholder="Write your feedback..."
                                className="min-h-[100px] text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-lg"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                className="h-9 px-4 text-xs border-gray-200 text-gray-600"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmitRating}
                                disabled={ratingValue === 0 || submitting}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#e68900] hover:to-[#5558e6] text-white h-9 px-5 text-xs font-medium shadow-sm transition-all disabled:opacity-50"
                            >
                                {submitting ? (
                                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Submitting...</>
                                ) : (
                                    "Submit Rating"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
