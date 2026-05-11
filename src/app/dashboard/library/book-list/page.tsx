"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

const mockBooks: Book[] = [
    { id: "1", title: "Hindi Vyakaran", description: "No Description", bookNumber: "1453", isbnNumber: "DA097886", publisher: "D.S. Publisher", author: "Suresh Kumar", subject: "Hindi", rackNumber: "7845", qty: 80, available: 77, price: "₹10,500.00", postDate: "02/23/2025" },
    { id: "2", title: "Mathematics", description: "No Description", bookNumber: "1455", isbnNumber: "BRT0-890907", publisher: "D.S. Publisher", author: "", subject: "Mathematics", rackNumber: "1234", qty: 90, available: 86, price: "₹14,000.00", postDate: "02/17/2025" },
    { id: "3", title: "Environmental Studies (EVS)", description: "No Description", bookNumber: "65545", isbnNumber: "FSB87665", publisher: "D.S. Publisher", author: "", subject: "Environmental", rackNumber: "756", qty: 90, available: 88, price: "₹21,000.00", postDate: "02/11/2025" },
    { id: "4", title: "English Reader", description: "English Reader", bookNumber: "4344", isbnNumber: "FG-08908", publisher: "S.K. Publisher", author: "", subject: "English", rackNumber: "4545", qty: 50, available: 48, price: "₹17,500.00", postDate: "02/02/2025" },
    { id: "5", title: "Social & Political Life", description: "No Description", bookNumber: "87897", isbnNumber: "VBB00-8-90-78", publisher: "St. Publisher", author: "Harish Vardhan", subject: "Social Science", rackNumber: "57574", qty: 100, available: 90, price: "₹8,400.00", postDate: "01/20/2025" },
    { id: "6", title: "Wonderful Adventures of Nils", description: "No Description", bookNumber: "789667", isbnNumber: "DER900808", publisher: "S.K. Publisher", author: "Selma Lagerlöf", subject: "English", rackNumber: "567574", qty: 90, available: 79, price: "₹7,000.00", postDate: "01/15/2025" },
    { id: "7", title: "Electricity & Circuits", description: "No Description", bookNumber: "56433", isbnNumber: "FG-08908", publisher: "S.K. Publisher", author: "John Wright", subject: "Science", rackNumber: "89875", qty: 80, available: 69, price: "₹3,500.00", postDate: "01/10/2025" },
    { id: "8", title: "Basic Geometrical Ideas", description: "No Description", bookNumber: "34222", isbnNumber: "FWSE56564", publisher: "S.K. Publisher", author: "David Wilson", subject: "Mathematics", rackNumber: "34522", qty: 100, available: 93, price: "₹5,600.00", postDate: "01/02/2025" },
];

export default function BookListPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [books, setBooks] = useState<Book[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState("50");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
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
            setBooks(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching books:", error);
            toast({ title: "Error", description: "Failed to fetch books", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
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
        try {
            if (editingBook) {
                await api.put(`/library/books/${editingBook.id}`, formData);
                toast({ title: "Success", description: "Book updated successfully" });
            } else {
                await api.post('/library/books', formData);
                toast({ title: "Success", description: "Book added successfully" });
            }
            setIsDialogOpen(false);
            fetchBooks();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to save book",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this book?")) {
            try {
                await api.delete(`/library/books/${id}`);
                toast({ title: "Success", description: "Book deleted successfully" });
                fetchBooks();
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete book", variant: "destructive" });
            }
        }
    };

    const handleCopy = () => {
        const text = books.map(b => `${b.title}\t${b.book_number}\t${b.author}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Data copied to clipboard" });
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
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
             <div className="flex justify-between items-center mb-2">
                <h1 className="text-sm font-medium text-gray-800">Book List</h1>
                <Button onClick={handleAddClick} className="btn-gradient gap-2 h-8 px-4 text-[10px] font-bold uppercase transition-all rounded-full shadow-md">
                    <Plus className="h-3.5 w-3.5" /> Add Book
                </Button>
            </div>

            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                 {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-4">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-fit">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-9 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/50"
                            />
                        </div>
                        <Button type="submit" className="btn-gradient h-9 px-6 text-[11px] font-bold flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </form>

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
                                    <SelectItem value="100">100</SelectItem>
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

                {/* Table Container with horizontal scroll */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1200px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Book Title <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Description <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Book Number <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">ISBN Number <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Publisher <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Author <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Subject <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Rack Number <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Qty <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Available <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Book Price</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Post Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right sticky right-0 bg-gray-50/50 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {books.map((book) => (
                                <TableRow key={book.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap group">
                                    <TableCell className="py-3 text-gray-700 font-medium">{book.title}</TableCell>
                                    <TableCell className="py-3 text-gray-400 max-w-[200px] truncate" title={book.description}>{book.description || "-"}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.book_number}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.isbn_number || "-"}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.publisher || "-"}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.author || "-"}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.subject || "-"}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.rack_number || "-"}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.qty}</TableCell>
                                    <TableCell className="py-3 text-gray-500 font-bold text-indigo-600">{book.available}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.price ? `₹${book.price}` : "-"}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.post_date ? formatDate(book.post_date) : "-"}</TableCell>
                                    <TableCell className="py-3 text-right sticky right-0 bg-white group-hover:bg-gray-50/30 transition-colors shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button 
                                                size="icon" 
                                                onClick={() => handleEditClick(book)}
                                                className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm"
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                onClick={() => handleDelete(book.id)}
                                                className="h-6 w-6 bg-rose-500 hover:bg-rose-600 text-white rounded shadow-sm"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
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
                            onClick={() => fetchBooks(pagination!.current_page - 1)}
                            className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {[...Array(pagination?.last_page || 0)].map((_, i) => (
                            <Button 
                                key={i + 1}
                                onClick={() => fetchBooks(i + 1)}
                                className={cn(
                                    "h-7 w-7 p-0 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300",
                                    pagination?.current_page === i + 1 
                                        ? "btn-gradient" 
                                        : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-100"
                                )}
                            >
                                {i + 1}
                            </Button>
                        ))}
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pagination?.current_page === pagination?.last_page}
                            onClick={() => fetchBooks(pagination!.current_page + 1)}
                            className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Add/Edit Book Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-gray-800">{editingBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Book Title <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                    placeholder="Enter book title"
                                />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Description</Label>
                                <Textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="border-gray-200 text-xs shadow-none min-h-[60px]"
                                    placeholder="Enter description"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Book Number <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={formData.book_number}
                                    onChange={(e) => setFormData({ ...formData, book_number: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">ISBN Number</Label>
                                <Input 
                                    value={formData.isbn_number}
                                    onChange={(e) => setFormData({ ...formData, isbn_number: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Publisher</Label>
                                <Input 
                                    value={formData.publisher}
                                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Author</Label>
                                <Input 
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Subject</Label>
                                <Input 
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Rack Number</Label>
                                <Input 
                                    value={formData.rack_number}
                                    onChange={(e) => setFormData({ ...formData, rack_number: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Quantity <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="number"
                                    value={formData.qty}
                                    onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Price</Label>
                                <Input 
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="h-9 border-gray-200 text-xs shadow-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Post Date</Label>
                                <DatePicker 
                                    value={formData.post_date}
                                    onChange={(date) => setFormData({ ...formData, post_date: date })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full">Cancel</Button>
                            <Button onClick={handleSave} className="btn-gradient h-9 px-8 text-[11px] uppercase font-bold rounded-full">Save Book</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
