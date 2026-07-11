"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import {
    Search,
    Plus,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Loader2,
    BookOpen,
    Monitor,
    Pencil,
    Trash2,
    Eye,
    Upload,
    Play,
    Check,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const activeGradient = "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:from-[#FF9800] hover:to-[#6366F1]";

function getYoutubeId(url: string): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

interface OutlineItem {
    id: number;
    title: string;
    description: string;
    video_url?: string;
}

interface LiveClassItem {
    id: number;
    title: string;
    description: string;
    live_link: string;
}

interface QuizItem {
    id: number;
    title: string;
    description: string;
    option_1: string;
    option_2: string;
    option_3: string;
    option_4: string;
    correct_option: number;
    points: number;
}

interface Course {
    id: string;
    title: string;
    subtitle?: string;
    description: string;
    category: string;
    instructor: { name: string; id: string; admission_no: string; avatar: string; updated_at: string };
    price: number;
    original_price: number;
    image: string;
    class_name: string;
    total_lessons: number;
    total_hours: string;
    total_exams: number;
    total_assignments: number;
    total_quizzes: number;
    outline?: OutlineItem[];
    live_classes?: LiveClassItem[];
    quizzes?: QuizItem[];
}

export default function OnlineCoursePage() {
    const { t } = useTranslation();
    const { symbol, formatCurrency } = useCurrencyFormatter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [courses, setCourses] = useState<Course[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [perPage, setPerPage] = useState(20);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [viewCourse, setViewCourse] = useState<Course | null>(null);
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
    const [showFullDetails, setShowFullDetails] = useState(false);

    const [form, setForm] = useState({
        title: "",
        subtitle: "",
        category: "",
        price: "",
        original_price: "",
        description: "",
        class_name: "",
        instructor_name: "",
        thumbnail: null as File | null,
        thumbnail_preview: "",
        outline: [] as OutlineItem[],
        live_classes: [] as LiveClassItem[],
        quizzes: [] as QuizItem[],
    });

    const fetchCourses = useCallback(async (page?: number) => {
        setLoading(true);
        try {
            const res = await api.get("/online-course/courses", {
                params: { search: searchTerm, page: page || currentPage, per_page: perPage },
            });
            const d = res.data;
            if (d.data) {
                const list = (Array.isArray(d.data) ? d.data : d.data.data || []).map((c: any) => ({
                    ...c,
                    outline: typeof c.outline === "string" ? JSON.parse(c.outline) : c.outline || [],
                    live_classes: typeof c.live_classes === "string" ? JSON.parse(c.live_classes) : c.live_classes || [],
                    quizzes: typeof c.quizzes === "string" ? JSON.parse(c.quizzes) : c.quizzes || [],
                }));
                setCourses(list);
                setTotal(d.total || d.meta?.total || 0);
                setLastPage(d.last_page || d.meta?.last_page || 1);
                setCurrentPage(d.current_page || d.meta?.current_page || 1);
                setFrom(d.from || d.meta?.from || 0);
                setTo(d.to || d.meta?.to || 0);
            } else {
                setCourses([]);
            }
        } catch {
            toast.error(t("failed_to_fetch_courses"));
        } finally {
            setLoading(false);
        }
    }, [searchTerm, currentPage, perPage, t]);

    useEffect(() => {
        fetchCourses(1);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchCourses(1), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const resetForm = () => {
        setForm({ title: "", subtitle: "", category: "", price: "", original_price: "", description: "", class_name: "", instructor_name: "", thumbnail: null, thumbnail_preview: "", outline: [], live_classes: [], quizzes: [] });
        setEditingId(null);
    };

    const handleOpenAdd = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (course: Course) => {
        setEditingId(course.id);
        setForm({
            title: course.title,
            subtitle: course.subtitle || "",
            category: course.category,
            price: course.price.toString(),
            original_price: (course.original_price || "").toString(),
            description: course.description,
            class_name: course.class_name,
            instructor_name: course.instructor?.name || "",
            thumbnail: null,
            thumbnail_preview: course.image || "",
            outline: course.outline || [],
            live_classes: course.live_classes || [],
            quizzes: course.quizzes || [],
        });
        setIsDialogOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("title", form.title);
            fd.append("subtitle", form.subtitle);
            fd.append("category", form.category);
            fd.append("price", form.price);
            fd.append("original_price", form.original_price);
            fd.append("description", form.description);
            fd.append("class_name", form.class_name);
            fd.append("instructor_name", form.instructor_name);
            fd.append("outline", JSON.stringify(form.outline));
            fd.append("live_classes", JSON.stringify(form.live_classes));
            fd.append("quizzes", JSON.stringify(form.quizzes));
            if (form.thumbnail) fd.append("image", form.thumbnail);

            if (editingId) {
                fd.append("_method", "PUT");
                await api.post(`/online-course/courses/${editingId}`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success(t("course_updated_successfully"));
            } else {
                await api.post("/online-course/courses", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success(t("course_created_successfully"));
            }
            setIsDialogOpen(false);
            resetForm();
            fetchCourses(1);
        } catch {
            toast.error(t("failed_to_save_course"));
        } finally {
            setSaving(false);
        }
    };

    const handleOpenView = (course: Course) => {
        setViewCourse({
            ...course,
            outline: typeof course.outline === "string" ? JSON.parse(course.outline) : course.outline || [],
            live_classes: typeof course.live_classes === "string" ? JSON.parse(course.live_classes) : course.live_classes || [],
            quizzes: typeof course.quizzes === "string" ? JSON.parse(course.quizzes) : course.quizzes || [],
        });
        setShowFullDetails(false);
        setIsViewDialogOpen(true);
    };

    const confirmDelete = (id: string) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/online-course/courses/${deleteId}`);
            toast.success(t("course_deleted_successfully"));
            fetchCourses(1);
        } catch {
            toast.error(t("failed_to_delete_course"));
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const exportToCopy = () => {
        const text = courses.map((c) => `${c.title}\t${c.category}\t${formatCurrency(c.price)}\t${c.class_name}`).join("\n");
        navigator.clipboard.writeText(text);
        toast.success(t("copied_to_clipboard"));
    };

    const exportToExcel = () => {
        const data = courses.map((c) => ({
            Title: c.title,
            Category: c.category,
            Price: c.price,
            Class: c.class_name,
            Instructor: c.instructor?.name || "",
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Courses");
        XLSX.writeFile(wb, "courses.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [[t("title"), t("category"), t("price"), t("class"), t("instructor")]],
            body: courses.map((c) => [c.title, c.category, formatCurrency(c.price), c.class_name, c.instructor?.name || ""]),
        });
        doc.save("courses.pdf");
    };

    const exportToPrint = () => {
        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(`
            <html><head><title>${t("courses")}</title>
            <style>table { width:100%; border-collapse:collapse; } th,td { border:1px solid #ddd; padding:8px; text-align:left; } th { background:#f5f5f5; }</style>
            </head><body><h2>${t("courses")}</h2><table>
            <thead><tr><th>${t("title")}</th><th>${t("category")}</th><th>${t("price")}</th><th>${t("class")}</th><th>${t("instructor")}</th></tr></thead>
            <tbody>${courses.map((c) => `<tr><td>${c.title}</td><td>${c.category}</td><td>${formatCurrency(c.price)}</td><td>${c.class_name}</td><td>${c.instructor?.name || ""}</td></tr>`).join("")}
            </tbody></table></body></html>`);
        win.document.close();
        win.print();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Monitor className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("online_courses")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("x_courses_in_your_catalog", { count: total })}</p>
                    </div>
                </div>
                <Button onClick={handleOpenAdd} className={cn("h-9 px-5 text-xs font-bold rounded-full shadow-md flex items-center gap-2", activeGradient)}>
                    <Plus className="h-4 w-4" /> {t("add_course")}
                </Button>
            </div>

            {/* Search + Export */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                        placeholder={t("search_courses")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-lg"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <span>{t("show")}</span>
                        <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setCurrentPage(1); }}>
                            <SelectTrigger className="h-7 text-xs w-16 border-gray-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                                <SelectItem value="500">500</SelectItem>
                            </SelectContent>
                        </Select>
                        <span>{t("entries")}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                        <Button onClick={exportToCopy} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600" title={t("copy")}>
                            <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button onClick={exportToExcel} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600" title={t("excel")}>
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                        </Button>
                        <Button onClick={exportToPDF} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600" title={t("pdf")}>
                            <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button onClick={exportToPrint} variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50 hover:text-indigo-600" title={t("print")}>
                            <Printer className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="rounded-md border border-gray-100 overflow-hidden min-h-[300px] relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    )}
                    <Table>
                        <TableHeader className="bg-gray-50/50 text-[11px] uppercase">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="font-bold text-gray-700 py-3">{t("course")}</TableHead>
                                <TableHead className="font-bold text-gray-700 py-3">{t("category")}</TableHead>
                                <TableHead className="font-bold text-gray-700 py-3">{t("class")}</TableHead>
                                <TableHead className="font-bold text-gray-700 py-3">{t("instructor")}</TableHead>
                                <TableHead className="font-bold text-gray-700 py-3 text-right">{t("price_with_symbol", { symbol })}</TableHead>
                                <TableHead className="font-bold text-gray-700 py-3 text-right">{t("action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courses.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center text-gray-400 text-sm">
                                        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                        <p className="font-medium">{t("no_courses_found")}</p>
                                        <p className="text-xs mt-1">{t("click_add_course_to_create_one")}</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                courses.map((course) => (
                                    <TableRow key={course.id} className="text-[13px] hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer border-b last:border-0 border-gray-50">
                                        <TableCell className="py-3.5 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                    {course.image ? (
                                                        <img src={course.image} className="h-full w-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-gray-300"><BookOpen className="h-4 w-4" /></div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-800 truncate">{course.title}</p>
                                                    <p className="text-[11px] text-gray-400 truncate">{course.description?.slice(0, 60)}...</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-600 py-3.5 align-middle capitalize">{course.category || "-"}</TableCell>
                                        <TableCell className="text-gray-600 py-3.5 align-middle">{course.class_name || "-"}</TableCell>
                                        <TableCell className="text-gray-600 py-3.5 align-middle">{course.instructor?.name || "-"}</TableCell>
                                        <TableCell className="text-right py-3.5 align-middle font-medium text-gray-800">{formatCurrency(course.price)}</TableCell>
                                        <TableCell className="text-right py-3.5 align-middle">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button onClick={() => handleOpenView(course)} size="icon" variant="ghost" className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded shadow-sm">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button onClick={() => handleOpenEdit(course)} size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button onClick={() => confirmDelete(course.id)} size="icon" variant="ghost" className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded shadow-sm">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-4 py-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                        <span>{t("showing_x_to_y_of_z", { from, to, total })}</span>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-gray-200" disabled={currentPage === 1} onClick={() => fetchCourses(currentPage - 1)}>
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {Array.from({ length: lastPage }, (_, i) => i + 1).map((page) => (
                            <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" className={`h-7 w-7 p-0 border-gray-200 ${currentPage === page ? activeGradient : "hover:bg-indigo-50 hover:text-indigo-600"}`} onClick={() => fetchCourses(page)}>
                                {page}
                            </Button>
                        ))}
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-gray-200" disabled={currentPage === lastPage} onClick={() => fetchCourses(currentPage + 1)}>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); resetForm(); } }}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-lg border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-indigo-500" />
                            {editingId ? t("edit_course") : t("add_course")}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-5">
                        {/* Thumbnail */}
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("thumbnail")}</Label>
                            <div className="flex items-center gap-4">
                                <div
                                    onClick={() => document.getElementById("thumb-input")?.click()}
                                    className="h-20 w-36 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all overflow-hidden relative group"
                                >
                                    {form.thumbnail_preview ? (
                                        <>
                                            <img src={form.thumbnail_preview} className="h-full w-full object-cover" alt="" />
                                            <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Upload className="h-5 w-5 text-indigo-600" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 text-gray-400">
                                            <Upload className="h-5 w-5" />
                                            <span className="text-[8px] font-bold uppercase">{t("upload")}</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    id="thumb-input"
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setForm({ ...form, thumbnail: file, thumbnail_preview: URL.createObjectURL(file) });
                                        }
                                    }}
                                />
                                <p className="text-[10px] text-gray-400">{t("recommended_size")}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("title")}</Label>
                                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9 text-xs border-gray-200 rounded-lg" placeholder={t("course_title_placeholder")} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("sub_title")}</Label>
                                <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="h-9 text-xs border-gray-200 rounded-lg" placeholder={t("course_subtitle_placeholder")} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("category")}</Label>
                                <Input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-9 text-xs border-gray-200 rounded-lg" placeholder={t("category_placeholder")} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("instructor_name")}</Label>
                                <Input value={form.instructor_name} onChange={(e) => setForm({ ...form, instructor_name: e.target.value })} className="h-9 text-xs border-gray-200 rounded-lg" placeholder={t("instructor_name_placeholder")} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("class")}</Label>
                                <Input value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} className="h-9 text-xs border-gray-200 rounded-lg" placeholder={t("class_placeholder")} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("price_with_symbol", { symbol })}</Label>
                                <Input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="h-9 text-xs border-gray-200 rounded-lg" placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("original_price_with_symbol", { symbol })}</Label>
                                <Input type="number" step="0.01" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className="h-9 text-xs border-gray-200 rounded-lg" placeholder="0.00" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("description")}</Label>
                            <Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[100px] text-xs border-gray-200 rounded-lg" placeholder={t("course_description_placeholder")} />
                        </div>

                        {/* Course Outline Accordions */}
                        <div className="space-y-3 border-t border-gray-100 pt-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("course_outline")}</Label>
                                <Button type="button" onClick={() => setForm({ ...form, outline: [...form.outline, { id: Date.now(), title: "", description: "", video_url: "" }] })} className="h-7 text-[9px] font-bold rounded-full px-3 flex items-center gap-1 bg-gradient-to-r from-orange-400 to-indigo-500 text-white">
                                    <Plus size={12} /> {t("add_outline_item")}
                                </Button>
                            </div>
                            {form.outline.length === 0 && (
                                <p className="text-[11px] text-gray-400 italic">{t("no_outline_items_added_yet")}</p>
                            )}
                            {form.outline.map((item, idx) => (
                                <div key={item.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/20 space-y-3 relative group">
                                    <Button type="button" size="icon" onClick={() => setForm({ ...form, outline: form.outline.filter((o) => o.id !== item.id) })} className="absolute top-3 right-3 h-7 w-7 bg-red-500 text-white rounded-[8px] shadow-md opacity-0 group-hover:opacity-100">
                                        <Trash2 size={14} />
                                    </Button>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        <ChevronDown size={12} className="text-indigo-400" />
                                        {t("item_n", { n: idx + 1 })}
                                    </div>
                                    <div className="space-y-2 pr-8">
                                        <Input value={item.title} onChange={(e) => { const o = [...form.outline]; o[idx] = { ...o[idx], title: e.target.value }; setForm({ ...form, outline: o }); }} className="h-8 text-[11px] font-bold bg-white border-gray-100 rounded-lg" placeholder={t("outline_title_placeholder")} />
                                        <div className="flex items-center gap-2">
                                            <Input value={item.video_url || ""} onChange={(e) => { const o = [...form.outline]; o[idx] = { ...o[idx], video_url: e.target.value }; setForm({ ...form, outline: o }); }} className="h-8 text-[11px] bg-white border-gray-100 rounded-lg flex-1" placeholder={t("youtube_video_url_optional_placeholder")} />
                                            {item.video_url && (
                                                <Play size={14} className="text-red-400 shrink-0" />
                                            )}
                                        </div>
                                        <Textarea value={item.description} onChange={(e) => { const o = [...form.outline]; o[idx] = { ...o[idx], description: e.target.value }; setForm({ ...form, outline: o }); }} className="min-h-[60px] text-[11px] bg-white border-gray-100 rounded-lg" placeholder={t("outline_description_placeholder")} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Live Class Accordions */}
                        <div className="space-y-3 border-t border-gray-100 pt-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("live_class")}</Label>
                                <Button type="button" onClick={() => setForm({ ...form, live_classes: [...form.live_classes, { id: Date.now(), title: "", description: "", live_link: "" }] })} className="h-7 text-[9px] font-bold rounded-full px-3 flex items-center gap-1 bg-gradient-to-r from-orange-400 to-indigo-500 text-white">
                                    <Plus size={12} /> {t("add_live_class")}
                                </Button>
                            </div>
                            {form.live_classes.length === 0 && (
                                <p className="text-[11px] text-gray-400 italic">{t("no_live_classes_added_yet")}</p>
                            )}
                            {form.live_classes.map((item, idx) => (
                                <div key={item.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/20 space-y-3 relative group">
                                    <Button type="button" size="icon" onClick={() => setForm({ ...form, live_classes: form.live_classes.filter((o) => o.id !== item.id) })} className="absolute top-3 right-3 h-7 w-7 bg-red-500 text-white rounded-[8px] shadow-md opacity-0 group-hover:opacity-100">
                                        <Trash2 size={14} />
                                    </Button>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        <Play size={12} className="text-cyan-400" />
                                        {t("live_class_n", { n: idx + 1 })}
                                    </div>
                                    <div className="space-y-2 pr-8">
                                        <Input value={item.title} onChange={(e) => { const o = [...form.live_classes]; o[idx] = { ...o[idx], title: e.target.value }; setForm({ ...form, live_classes: o }); }} className="h-8 text-[11px] font-bold bg-white border-gray-100 rounded-lg" placeholder={t("live_class_title_placeholder")} />
                                        <Input value={item.live_link} onChange={(e) => { const o = [...form.live_classes]; o[idx] = { ...o[idx], live_link: e.target.value }; setForm({ ...form, live_classes: o }); }} className="h-8 text-[11px] bg-white border-gray-100 rounded-lg" placeholder={t("live_class_link_placeholder")} />
                                        <Textarea value={item.description} onChange={(e) => { const o = [...form.live_classes]; o[idx] = { ...o[idx], description: e.target.value }; setForm({ ...form, live_classes: o }); }} className="min-h-[60px] text-[11px] bg-white border-gray-100 rounded-lg" placeholder={t("live_class_description_placeholder")} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quizzes Accordions */}
                        <div className="space-y-3 border-t border-gray-100 pt-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{t("quizzes")}</Label>
                                <Button type="button" onClick={() => setForm({ ...form, quizzes: [...form.quizzes, { id: Date.now(), title: "", description: "", option_1: "", option_2: "", option_3: "", option_4: "", correct_option: 1, points: 1 }] })} className="h-7 text-[9px] font-bold rounded-full px-3 flex items-center gap-1 bg-gradient-to-r from-orange-400 to-indigo-500 text-white">
                                    <Plus size={12} /> {t("add_question")}
                                </Button>
                            </div>
                            {form.quizzes.length === 0 && (
                                <p className="text-[11px] text-gray-400 italic">{t("no_quiz_questions_added_yet")}</p>
                            )}
                            {form.quizzes.map((item, idx) => (
                                <div key={item.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/20 space-y-3 relative group">
                                    <Button type="button" size="icon" onClick={() => setForm({ ...form, quizzes: form.quizzes.filter((o) => o.id !== item.id) })} className="absolute top-3 right-3 h-7 w-7 bg-red-500 text-white rounded-[8px] shadow-md opacity-0 group-hover:opacity-100">
                                        <Trash2 size={14} />
                                    </Button>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        <Check size={12} className="text-rose-400" />
                                        {t("question_n", { n: idx + 1 })}
                                    </div>
                                    <div className="space-y-2 pr-8">
                                        <Input value={item.title} onChange={(e) => { const o = [...form.quizzes]; o[idx] = { ...o[idx], title: e.target.value }; setForm({ ...form, quizzes: o }); }} className="h-8 text-[11px] font-bold bg-white border-gray-100 rounded-lg" placeholder={t("question_title_placeholder")} />
                                        <Textarea value={item.description} onChange={(e) => { const o = [...form.quizzes]; o[idx] = { ...o[idx], description: e.target.value }; setForm({ ...form, quizzes: o }); }} className="min-h-[60px] text-[11px] bg-white border-gray-100 rounded-lg" placeholder={t("question_description_placeholder")} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input value={item.option_1} onChange={(e) => { const o = [...form.quizzes]; o[idx] = { ...o[idx], option_1: e.target.value }; setForm({ ...form, quizzes: o }); }} className={`h-8 text-[11px] bg-white border-gray-100 rounded-lg ${item.correct_option === 1 ? "border-l-4 border-l-emerald-500" : ""}`} placeholder={t("option_1")} />
                                            <Input value={item.option_2} onChange={(e) => { const o = [...form.quizzes]; o[idx] = { ...o[idx], option_2: e.target.value }; setForm({ ...form, quizzes: o }); }} className={`h-8 text-[11px] bg-white border-gray-100 rounded-lg ${item.correct_option === 2 ? "border-l-4 border-l-emerald-500" : ""}`} placeholder={t("option_2")} />
                                            <Input value={item.option_3} onChange={(e) => { const o = [...form.quizzes]; o[idx] = { ...o[idx], option_3: e.target.value }; setForm({ ...form, quizzes: o }); }} className={`h-8 text-[11px] bg-white border-gray-100 rounded-lg ${item.correct_option === 3 ? "border-l-4 border-l-emerald-500" : ""}`} placeholder={t("option_3")} />
                                            <Input value={item.option_4} onChange={(e) => { const o = [...form.quizzes]; o[idx] = { ...o[idx], option_4: e.target.value }; setForm({ ...form, quizzes: o }); }} className={`h-8 text-[11px] bg-white border-gray-100 rounded-lg ${item.correct_option === 4 ? "border-l-4 border-l-emerald-500" : ""}`} placeholder={t("option_4")} />
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-[9px] font-bold text-gray-400 uppercase">{t("correct")}</Label>
                                                <select value={item.correct_option} onChange={(e) => { const o = [...form.quizzes]; o[idx] = { ...o[idx], correct_option: Number(e.target.value) }; setForm({ ...form, quizzes: o }); }} className="h-8 text-[11px] bg-white border border-gray-200 rounded-lg px-2 text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400">
                                                    <option value={1}>{t("option_1")}</option>
                                                    <option value={2}>{t("option_2")}</option>
                                                    <option value={3}>{t("option_3")}</option>
                                                    <option value={4}>{t("option_4")}</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-[9px] font-bold text-gray-400 uppercase">{t("points")}</Label>
                                                <Input type="number" min={1} value={item.points} onChange={(e) => { const o = [...form.quizzes]; o[idx] = { ...o[idx], points: Number(e.target.value) }; setForm({ ...form, quizzes: o }); }} className="h-8 w-16 text-[11px] bg-white border-gray-100 rounded-lg text-center" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="h-9 text-xs font-bold rounded-full px-6">
                                {t("cancel")}
                            </Button>
                            <Button disabled={saving} className={cn("h-9 text-xs font-bold rounded-full px-6 shadow-md", activeGradient)}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                {editingId ? t("update") : t("save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("permanently_delete_course_warning")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="h-9 text-xs font-bold rounded-full px-6">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="h-9 text-xs font-bold rounded-full px-6 bg-red-600 hover:bg-red-700">
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* View Detail Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={(open) => { if (!open) { setIsViewDialogOpen(false); setPlayingVideoId(null); setShowFullDetails(false); } }}>
                <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto rounded-lg border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-indigo-500" />
                            {viewCourse?.title || t("course_details")}
                        </DialogTitle>
                    </DialogHeader>
                    {viewCourse && (
                        <div className="space-y-6">
                            {/* Hero */}
                            <div className="flex flex-col sm:flex-row gap-5">
                                {viewCourse.image && (
                                    <div className="w-full sm:w-48 h-32 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                        <img src={viewCourse.image} className="h-full w-full object-cover" alt="" />
                                    </div>
                                )}
                                <div className="flex-1 space-y-2 min-w-0">
                                    {viewCourse.subtitle && (
                                        <p className="text-[12px] font-medium text-indigo-500">{viewCourse.subtitle}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">{viewCourse.category}</span>
                                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">{viewCourse.class_name}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">{viewCourse.description}</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-5 gap-2">
                                <div className="bg-indigo-50 rounded-lg py-2 px-2 text-center border border-indigo-100">
                                    <p className="text-sm font-black text-indigo-600">{viewCourse.total_lessons || 0}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">{t("lessons")}</p>
                                </div>
                                <div className="bg-emerald-50 rounded-lg py-2 px-2 text-center border border-emerald-100">
                                    <p className="text-[11px] font-black text-emerald-600">{viewCourse.total_hours || "0"}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">{t("hours")}</p>
                                </div>
                                <div className="bg-amber-50 rounded-lg py-2 px-2 text-center border border-amber-100">
                                    <p className="text-sm font-black text-amber-600">{viewCourse.total_exams || 0}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-amber-400">{t("exams")}</p>
                                </div>
                                <div className="bg-cyan-50 rounded-lg py-2 px-2 text-center border border-cyan-100">
                                    <p className="text-sm font-black text-cyan-600">0</p>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-400">{t("live_class")}</p>
                                </div>
                                <div className="bg-rose-50 rounded-lg py-2 px-2 text-center border border-rose-100">
                                    <p className="text-sm font-black text-rose-600">{viewCourse.total_quizzes || 0}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-rose-400">{t("quizzes")}</p>
                                </div>
                            </div>

                            {/* Pricing & Instructor */}
                            <div className="flex gap-2">
                                <div className="flex-1 bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg py-2.5 px-3 text-center border border-sky-100">
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-sky-400">{t("pricing")}</p>
                                    <div className="flex items-center justify-center gap-1.5">
                                        <span className="text-base font-black text-gray-800">{formatCurrency(viewCourse.price)}</span>
                                        {viewCourse.original_price > 0 && (
                                            <span className="text-[10px] font-semibold text-gray-400 line-through">{formatCurrency(viewCourse.original_price)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-lg py-2.5 px-3 text-center border border-purple-100">
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-purple-400">{t("instructor")}</p>
                                    <p className="text-xs font-bold text-gray-700 truncate">{viewCourse.instructor?.name || t("n_a")}</p>
                                </div>
                            </div>

                            {showFullDetails ? (
                                <>
                                    {/* Course Outline */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t("course_outline")}</p>
                                        {viewCourse.outline && viewCourse.outline.length > 0 ? (
                                            <div className="space-y-2">
                                                {viewCourse.outline.map((item, idx) => {
                                                    const colors = [
                                                        { border: "border-l-indigo-400", bg: "bg-indigo-50/30", hover: "hover:bg-indigo-100/50", badge: "bg-indigo-500 text-white" },
                                                        { border: "border-l-emerald-400", bg: "bg-emerald-50/30", hover: "hover:bg-emerald-100/50", badge: "bg-emerald-500 text-white" },
                                                        { border: "border-l-amber-400", bg: "bg-amber-50/30", hover: "hover:bg-amber-100/50", badge: "bg-amber-500 text-white" },
                                                        { border: "border-l-rose-400", bg: "bg-rose-50/30", hover: "hover:bg-rose-100/50", badge: "bg-rose-500 text-white" },
                                                        { border: "border-l-cyan-400", bg: "bg-cyan-50/30", hover: "hover:bg-cyan-100/50", badge: "bg-cyan-500 text-white" },
                                                    ];
                                                    const c = colors[idx % colors.length];
                                                    return (
                                                        <details key={item.id || idx} className="group border border-gray-100 border-l-4 rounded-lg overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
                                                            <summary className={`flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-700 border-l-4 border-transparent ${c.bg} cursor-pointer ${c.hover} transition-all duration-200 scale-[1.00] group-hover:scale-[1.01] list-none ${c.border}`}>
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-bold ${c.badge} shrink-0`}>{idx + 1}</span>
                                                                    <span className="truncate">{item.title}</span>
                                                                    {item.video_url && <Play size={12} className="text-red-400 shrink-0" />}
                                                                </div>
                                                                <ChevronDown size={14} className="text-gray-400 transition-all duration-300 group-open:rotate-180 group-hover:text-gray-600 shrink-0" />
                                                            </summary>
                                                            <div className="border-t border-gray-100 bg-white">
                                                                {item.video_url && (() => {
                                                                    const vid = getYoutubeId(item.video_url!);
                                                                    if (!vid) return null;
                                                                    const isPlaying = playingVideoId === vid;
                                                                    return (
                                                                        <div className="relative w-full aspect-video bg-black">
                                                                            {isPlaying ? (
                                                                                <iframe
                                                                                    src={`https://www.youtube.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1`}
                                                                                    className="w-full h-full"
                                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                                    allowFullScreen
                                                                                />
                                                                            ) : (
                                                                                <>
                                                                                    <img src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`} className="w-full h-full object-cover" alt="" />
                                                                                    <button onClick={() => setPlayingVideoId(vid)} className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group/vid">
                                                                                        <span className="flex items-center justify-center h-14 w-14 rounded-full bg-red-600 text-white shadow-lg transition-transform group-hover/vid:scale-110">
                                                                                            <Play size={24} className="ml-1" />
                                                                                        </span>
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                                {item.description && (
                                                                    <div className="px-4 py-3 text-[12px] text-gray-600 leading-relaxed">
                                                                        {item.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </details>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-gray-400 italic">{t("no_outline_items_available")}</p>
                                        )}
                                    </div>

                                    {/* Live Class */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t("live_class")}</p>
                                        {viewCourse.live_classes && viewCourse.live_classes.length > 0 ? (
                                            <div className="space-y-2">
                                                {viewCourse.live_classes.map((item, idx) => {
                                                    const colors = [
                                                        { border: "border-l-cyan-400", bg: "bg-cyan-50/30", hover: "hover:bg-cyan-100/50", badge: "bg-cyan-500 text-white" },
                                                        { border: "border-l-teal-400", bg: "bg-teal-50/30", hover: "hover:bg-teal-100/50", badge: "bg-teal-500 text-white" },
                                                        { border: "border-l-sky-400", bg: "bg-sky-50/30", hover: "hover:bg-sky-100/50", badge: "bg-sky-500 text-white" },
                                                        { border: "border-l-blue-400", bg: "bg-blue-50/30", hover: "hover:bg-blue-100/50", badge: "bg-blue-500 text-white" },
                                                    ];
                                                    const c = colors[idx % colors.length];
                                                    return (
                                                        <div key={item.id || idx} className="border border-gray-100 border-l-4 rounded-lg overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
                                                            <div className={`px-4 py-3 text-xs font-semibold text-gray-700 ${c.bg} ${c.border}`}>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-bold ${c.badge} shrink-0`}>{idx + 1}</span>
                                                                        <span className="truncate">{item.title}</span>
                                                                    </div>
                                                                    {item.live_link && (
                                                                        <a href={item.live_link} target="_blank" rel="noopener noreferrer">
                                                                            <Button className="h-7 text-[10px] font-bold rounded-full px-4 shadow-sm bg-gradient-to-r from-orange-400 to-rose-500 text-white hover:shadow-md transition-shadow">
                                                                                <Play size={11} className="mr-1" /> {t("join")}
                                                                            </Button>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {item.description && (
                                                                <div className="px-4 py-3 text-[12px] text-gray-600 leading-relaxed bg-white border-t border-gray-100">
                                                                    {item.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-gray-400 italic">{t("no_live_classes_available")}</p>
                                        )}
                                    </div>

                                    {/* Quizzes */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t("quizzes")}</p>
                                        {viewCourse.quizzes && viewCourse.quizzes.length > 0 ? (
                                            <div className="space-y-3">
                                                {viewCourse.quizzes.map((item, idx) => {
                                                    const totalPoints = viewCourse.quizzes!.reduce((s, q) => s + q.points, 0);
                                                    const optColors = ["border-l-indigo-400", "border-l-emerald-400", "border-l-amber-400", "border-l-rose-400"];
                                                    const optLabels = ["A", "B", "C", "D"];
                                                    return (
                                                        <div key={item.id || idx} className="border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                                                            <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-bold bg-rose-500 text-white shrink-0">{idx + 1}</span>
                                                                        <span className="text-xs font-semibold text-gray-700">{item.title}</span>
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-amber-600 shrink-0 ml-2">{item.points} {t("pts")}</span>
                                                                </div>
                                                                {item.description && (
                                                                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                                                                )}
                                                            </div>
                                                            <div className="px-4 py-2 bg-white space-y-1.5">
                                                                {[item.option_1, item.option_2, item.option_3, item.option_4].map((opt, oi) => {
                                                                    const isCorrect = oi + 1 === item.correct_option;
                                                                    return (
                                                                        <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] border ${isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold" : "border-gray-100 bg-gray-50/50 text-gray-600"}`}>
                                                                            <span className={`inline-flex items-center justify-center h-5 w-5 rounded text-[9px] font-bold shrink-0 ${isCorrect ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"}`}>{optLabels[oi]}</span>
                                                                            <span className="flex-1">{opt}</span>
                                                                            {isCorrect && <Check size={12} className="text-emerald-500 shrink-0" />}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {(() => {
                                                    const totalPts = viewCourse.quizzes!.reduce((s, q) => s + q.points, 0);
                                                    return (
                                                        <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-xs font-semibold text-gray-600">
                                                            <span>{t("total_points_x", { points: totalPts })}</span>
                                                            <span>{t("pass_x_pts", { points: Math.ceil(totalPts * 0.5) })}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-gray-400 italic">{t("no_quiz_questions_available")}</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-center">
                                    <BookOpen className="h-10 w-10 text-gray-300 mb-3" />
                                    <p className="text-sm font-semibold text-gray-600">{t("apply_to_view_full_course_details")}</p>
                                    <p className="text-[11px] text-gray-400 mt-1 mb-4">{t("details_hidden_until_apply")}</p>
                                    <Button onClick={() => setShowFullDetails(true)} className="h-9 text-xs font-bold rounded-full px-6 shadow-md bg-gradient-to-r from-orange-400 to-indigo-500 text-white">
                                        {t("apply_now")}
                                    </Button>
                                </div>
                            )}

                            <DialogFooter>
                                <Button onClick={() => setIsViewDialogOpen(false)} className="h-9 text-xs font-bold rounded-full px-6">
                                    {t("close")}
                                </Button>
                                <a href="/online_admission" target="_blank" rel="noopener noreferrer">
                                    <Button className="h-9 text-xs font-bold rounded-full px-6 shadow-md bg-gradient-to-r from-orange-400 to-indigo-500 text-white">
                                        {t("apply_now")}
                                    </Button>
                                </a>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
