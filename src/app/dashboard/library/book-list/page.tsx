"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDate } from "@/lib/utils";
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
    Plus,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    ArrowUpDown,
    Library,
    BookOpen,
    Barcode,
    User,
    Tag,
    MapPin,
    Calendar,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/components/providers/currency-provider";
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

interface Book {
    id: number;
    title: string;
    description: string;
    book_number: string;
    isbn_number: string;
    publisher: string;
    author: string;
    subject: string;
    rack_number: string;
    qty: number;
    available: number;
    price: string;
    post_date: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const TABLE_COLS = 13;

function SkeletonRows({ rows = 6, cols = TABLE_COLS }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <div
                                className="h-3 rounded bg-gray-200/70 animate-pulse"
                                style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function BookListPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const { selectedCurrency } = useCurrency();
    const currencySymbol = selectedCurrency?.symbol || "$";
    const [searchTerm, setSearchTerm] = useState("");
    const [books, setBooks] = useState<Book[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState("50");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteBookId, setDeleteBookId] = useState<number | null>(null);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        book_number: "",
        isbn_number: "",
        publisher: "",
        author: "",
        subject: "",
        rack_number: "",
        qty: "0",
        price: "0",
        post_date: new Date().toISOString().split('T')[0]
    });

    const fetchBooks = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/library/books?page=${page}&search=${searchTerm}&limit=${limit}`);
            setBooks(response.data.data ?? response.data ?? []);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching books:", error);
            tt.error("failed_to_fetch_books");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchBooks(1);
    };

    const handleAddClick = () => {
        setEditingBook(null);
        setFormData({
            title: "",
            description: "",
            book_number: "",
            isbn_number: "",
            publisher: "",
            author: "",
            subject: "",
            rack_number: "",
            qty: "0",
            price: "0",
            post_date: new Date().toISOString().split('T')[0]
        });
        setIsDialogOpen(true);
    };

    const handleEditClick = (book: Book) => {
        setEditingBook(book);
        setFormData({
            title: book.title,
            description: book.description || "",
            book_number: book.book_number,
            isbn_number: book.isbn_number || "",
            publisher: book.publisher || "",
            author: book.author || "",
            subject: book.subject || "",
            rack_number: book.rack_number || "",
            qty: String(book.qty),
            price: String(book.price),
            post_date: book.post_date || new Date().toISOString().split('T')[0]
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.book_number) {
            tt.error("title_and_book_number_required");
            return;
        }
        setSaving(true);
        try {
            if (editingBook) {
                await api.put(`/library/books/${editingBook.id}`, formData);
                tt.success("book_updated_successfully");
            } else {
                await api.post('/library/books', formData);
                tt.success("book_added_successfully");
            }
            setIsDialogOpen(false);
            fetchBooks();
        } catch (error) {
            tt.error("failed_to_save_book");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteBookId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteBookId) return;
        try {
            await api.delete(`/library/books/${deleteBookId}`);
            tt.success("book_deleted_successfully");
            setIsDeleteDialogOpen(false);
            setDeleteBookId(null);
            fetchBooks();
        } catch {
            tt.error("failed_to_delete_book");
        }
    };

    const handleCopy = () => {
        const text = books.map(b => `${b.title}\t${b.book_number}\t${b.author}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const handleExportCSV = () => {
        const headers = ["Title", "Book Number", "ISBN", "Author", "Subject", "Qty", "Available", "Price"];
        const rows = books.map(b => [b.title, b.book_number, b.isbn_number || "-", b.author || "-", b.subject || "-", b.qty, b.available, b.price]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "books_list.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="space-y-6">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                <div className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Library className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none truncate">{t("book_list")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("books_in_library_count", { count: pagination?.total ?? books.length })}</p>
                    </div>
                    <Button
                        onClick={handleAddClick}
                        className="ml-auto h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all"
                    >
                        <Plus className="h-4 w-4" /> {t("add_book")}
                    </Button>
                </div>
                <CardContent className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder={t("search_by_title_author_number")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                                <Search className="h-4 w-4" /> {t("search")}
                            </Button>
                        </form>

                        <div className="flex items-center gap-2">
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="w-[70px] h-9 text-xs">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                {toolbarActions.map((action, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        onClick={action.onClick}
                                        title={action.title}
                                        className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                    >
                                        <action.Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-gray-200/80 overflow-x-auto custom-scrollbar shadow-xs bg-white">
                        <Table className="min-w-[1250px]">
                            <TableHeader className="bg-gradient-to-r from-gray-50/90 via-slate-50/80 to-indigo-50/30 text-[11px] uppercase tracking-wider border-b border-gray-200/80">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-4"><div className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-indigo-500" /> {t("book_title")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3"><div className="flex items-center gap-1.5"><Barcode className="h-3.5 w-3.5 text-slate-500" /> {t("book_number")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3">{t("isbn_number")}</TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3">{t("publisher")}</TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3"><div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-indigo-500" /> {t("author")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3"><div className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-indigo-500" /> {t("subject")}</div></TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3"><div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-amber-600" /> {t("rack_number")}</div></TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3 text-center">{t("qty")}</TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3 text-center">{t("available")}</TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3">{t("book_price")}</TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-3"><div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-400" /> {t("post_date")}</div></TableHead>
                                    <TableHead className="font-bold text-gray-700 py-3.5 px-4 text-right sticky right-0 bg-gray-50/95 shadow-[-4px_0_10px_rgba(0,0,0,0.03)]">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows rows={6} cols={TABLE_COLS} />
                                ) : books.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={TABLE_COLS} className="px-4 py-16 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Library className="h-8 w-8 text-gray-300 stroke-1" />
                                                <span>{t("no_books_found")}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : books.map((book) => (
                                    <TableRow key={book.id} className="text-xs hover:bg-indigo-50/40 border-b border-gray-100 hover:shadow-xs relative transition-all duration-200 whitespace-nowrap group">
                                        {/* Book Title & Description */}
                                        <TableCell className="py-3 px-4 text-gray-800">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-indigo-50/80 border border-indigo-100/80 flex items-center justify-center shrink-0 text-indigo-600 group-hover:scale-105 transition-transform">
                                                    <BookOpen className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
                                                        {book.title}
                                                    </p>
                                                    {book.description && (
                                                        <p className="text-[11px] text-gray-400 truncate max-w-[220px] mt-0.5" title={book.description}>
                                                            {book.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Book Number */}
                                        <TableCell className="py-3 px-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold text-[11px] border border-slate-200/70">
                                                #{book.book_number}
                                            </span>
                                        </TableCell>

                                        {/* ISBN Number */}
                                        <TableCell className="py-3 px-3 text-gray-600 font-mono text-[11px]">
                                            {book.isbn_number ? (
                                                <span className="text-gray-700">{book.isbn_number}</span>
                                            ) : (
                                                <span className="text-gray-300 font-sans">—</span>
                                            )}
                                        </TableCell>

                                        {/* Publisher */}
                                        <TableCell className="py-3 px-3 text-gray-600 font-medium">
                                            {book.publisher || <span className="text-gray-300 font-normal">—</span>}
                                        </TableCell>

                                        {/* Author */}
                                        <TableCell className="py-3 px-3 text-gray-700 font-medium">
                                            {book.author ? (
                                                <span className="inline-flex items-center gap-1">
                                                    <span>{book.author}</span>
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 font-normal">—</span>
                                            )}
                                        </TableCell>

                                        {/* Subject */}
                                        <TableCell className="py-3 px-3">
                                            {book.subject ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-200/60">
                                                    {book.subject}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </TableCell>

                                        {/* Rack Number */}
                                        <TableCell className="py-3 px-3">
                                            {book.rack_number ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-mono font-semibold text-[10px] border border-amber-200/60">
                                                    <MapPin className="h-2.5 w-2.5 text-amber-600" />
                                                    Rack {book.rack_number}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </TableCell>

                                        {/* Quantity */}
                                        <TableCell className="py-3 px-3 text-center font-bold text-gray-700">
                                            {book.qty}
                                        </TableCell>

                                        {/* Available */}
                                        <TableCell className="py-3 px-3 text-center">
                                            {book.available > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200/70 shadow-2xs">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    {book.available} Available
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px] border border-rose-200/70">
                                                    Out of Stock
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Book Price */}
                                        <TableCell className="py-3 px-3 font-bold text-gray-800">
                                            {book.price ? `${currencySymbol}${book.price}` : <span className="text-gray-300 font-normal font-sans">—</span>}
                                        </TableCell>

                                        {/* Post Date */}
                                        <TableCell className="py-3 px-3 text-gray-500 text-[11px]">
                                            {book.post_date ? formatDate(book.post_date) : <span className="text-gray-300">—</span>}
                                        </TableCell>

                                        {/* Action Buttons */}
                                        <TableCell className="py-3 px-4 text-right sticky right-0 bg-white group-hover:bg-indigo-50/40 shadow-[-4px_0_10px_rgba(0,0,0,0.03)]">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEditClick(book)}
                                                    className="h-7 w-7 text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200/70 rounded-md p-0 shadow-2xs active:scale-95 transition-all cursor-pointer"
                                                    title={t("edit")}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteClick(book.id)}
                                                    className="h-7 w-7 text-red-600 bg-red-50 hover:bg-red-500 hover:text-white border border-red-200/70 rounded-md p-0 shadow-2xs active:scale-95 transition-all cursor-pointer"
                                                    title={t("delete")}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                        <div>
                            {t("showing_x_to_y_of_z", { from: pagination?.from || 0, to: pagination?.to || 0, total: pagination?.total || 0 })}
                        </div>
                        <div className="flex gap-1 items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination || pagination.current_page === 1}
                                onClick={() => fetchBooks(pagination!.current_page - 1)}
                                className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                <Button
                                    key={i + 1}
                                    size="sm"
                                    onClick={() => fetchBooks(i + 1)}
                                    className={cn(
                                        "h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all",
                                        pagination?.current_page === i + 1
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md"
                                            : "bg-white text-gray-600 border border-gray-200"
                                    )}
                                >
                                    {i + 1}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination || pagination.current_page === pagination.last_page}
                                onClick={() => fetchBooks(pagination!.current_page + 1)}
                                className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Book Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-6 py-4 border-b border-gray-100 shrink-0 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10 rounded-t-lg">
                        <DialogTitle className="text-lg font-bold text-gray-800">{editingBook ? t("edit_book") : t("add_new_book")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 overflow-y-auto custom-scrollbar flex-1">
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("book_title_label")} <span className="text-red-500">*</span></Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="h-9 border-gray-200 text-xs shadow-none"
                                placeholder={t("enter_book_title")}
                            />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("description")}</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="border-gray-200 text-xs shadow-none min-h-[60px]"
                                placeholder={t("enter_description")}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("book_number_label")} <span className="text-red-500">*</span></Label>
                            <Input
                                value={formData.book_number}
                                onChange={(e) => setFormData({ ...formData, book_number: e.target.value })}
                                className="h-9 border-gray-200 text-xs shadow-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("isbn_number")}</Label>
                            <Input
                                value={formData.isbn_number}
                                onChange={(e) => setFormData({ ...formData, isbn_number: e.target.value })}
                                className="h-9 border-gray-200 text-xs shadow-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("publisher")}</Label>
                            <Input
                                value={formData.publisher}
                                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                className="h-9 border-gray-200 text-xs shadow-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("author")}</Label>
                            <Input
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                className="h-9 border-gray-200 text-xs shadow-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("subject")}</Label>
                            <Input
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="h-9 border-gray-200 text-xs shadow-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("rack_number")}</Label>
                            <Input
                                value={formData.rack_number}
                                onChange={(e) => setFormData({ ...formData, rack_number: e.target.value })}
                                className="h-9 border-gray-200 text-xs shadow-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("quantity_label")} <span className="text-red-500">*</span></Label>
                            <Input
                                type="number"
                                value={formData.qty}
                                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                                className="h-9 border-gray-200 text-xs shadow-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("price")}</Label>
                            <Input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="h-9 border-gray-200 text-xs shadow-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("post_date")}</Label>
                            <DatePicker
                                value={formData.post_date}
                                onChange={(date) => setFormData({ ...formData, post_date: date })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50 rounded-b-lg">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full" disabled={saving}>{t("cancel")}</Button>
                        <Button onClick={handleSave} disabled={saving} className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[11px] uppercase font-bold shadow-lg active:scale-95 transition-all">
                            {saving ? t("saving") : t("save_book")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="sm:max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_book")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("delete_book_confirmation")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white">{t("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
