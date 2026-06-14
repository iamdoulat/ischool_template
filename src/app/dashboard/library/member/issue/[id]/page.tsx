"use client";

import { useState, useEffect, useRef, use } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
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
    RotateCcw,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import QRCode from "qrcode";

interface MemberData {
    id: number;
    user_id: number;
    member_id: string;
    library_card_no: string;
    member_type: string;
    active: boolean;
    user: {
        id: number;
        name: string;
        admission_no?: string;
        staff_id?: string;
        gender?: string;
        phone?: string;
        email?: string;
        dob?: string;
        school_class?: { class: string };
        section?: { section: string };
    };
}

interface IssuedBook {
    id: number;
    book_id: number;
    member_id: string;
    issue_date: string;
    due_date: string;
    return_date: string | null;
    book: {
        id: number;
        title: string;
        book_number: string;
    };
}

interface BookOption {
    id: number;
    title: string;
    book_number: string;
    available: number;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

function drawCode39Barcode(canvas: HTMLCanvasElement, text: string) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const code39: Record<string, string> = {
        "0": "101001101101", "1": "110100101011", "2": "101100101011",
        "3": "110110010101", "4": "101001101011", "5": "110100110101",
        "6": "101100110101", "7": "101001011011", "8": "110100101101",
        "9": "101100101101", "A": "110101001011", "B": "101101001011",
        "C": "110110100101", "D": "101011001011", "E": "110101100101",
        "F": "101101100101", "G": "101010011011", "H": "110101001101",
        "I": "101101001101", "J": "101011001101", "K": "110101010011",
        "L": "101101010011", "M": "110110101001", "N": "101011010011",
        "O": "110101101001", "P": "101101101001", "Q": "101010110011",
        "R": "110101011001", "S": "101101011001", "T": "101011011001",
        "U": "110010101011", "V": "100110101011", "W": "110011010101",
        "X": "100101101011", "Y": "110010110101", "Z": "100110110101",
        "-": "100101011011", ".": "110010101101", " ": "100110101101",
        "$": "100100100101", "/": "100100101001", "+": "100101001001",
        "%": "101001001001", "*": "100101101101",
    };

    const upper = text.toUpperCase();
    let encoded = code39["*"];
    for (const ch of upper) {
        if (!code39[ch]) return;
        encoded += code39[ch];
    }
    encoded += code39["*"];

    const barWidth = 1.5;
    const height = 30;
    canvas.width = encoded.length * barWidth + 20;
    canvas.height = height + 20;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000000";

    let x = 10;
    for (const bit of encoded) {
        if (bit === "1") {
            ctx.fillRect(x, 4, barWidth, height);
        }
        x += barWidth;
    }
}

export default function MemberIssuePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { toast } = useToast();
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

    const [member, setMember] = useState<MemberData | null>(null);
    const [memberLoading, setMemberLoading] = useState(true);

    const [issuedBooks, setIssuedBooks] = useState<IssuedBook[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [booksLoading, setBooksLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [limit, setLimit] = useState("10");

    const [books, setBooks] = useState<BookOption[]>([]);
    const [selectedBook, setSelectedBook] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [saving, setSaving] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (!id) return;
        setMemberLoading(true);
        api.get(`/library/members/${id}`)
            .then((res) => {
                const m = res.data.data;
                setMember(m);
            })
            .catch(() => toast({ title: "Error", description: "Failed to load member", variant: "destructive" }))
            .finally(() => setMemberLoading(false));
    }, [id]);

    useEffect(() => {
        if (!member) return;
        setBooksLoading(true);
        api.get("/library/books?no_paginate=true")
            .then((res) => {
                const raw = res.data.data ?? res.data ?? [];
                setBooks(Array.isArray(raw) ? raw.filter((b: BookOption) => b.available > 0) : []);
            })
            .catch(() => {})
            .finally(() => setBooksLoading(false));
    }, [member]);

    useEffect(() => {
        if (!id) return;
        setBooksLoading(true);
        api.get(`/library/book-issues/member/${id}?page=${currentPage}&limit=${limit}`)
            .then((res) => {
                setIssuedBooks(res.data.data ?? []);
                setPagination({
                    current_page: res.data.current_page,
                    last_page: res.data.last_page,
                    total: res.data.total,
                    from: res.data.from,
                    to: res.data.to,
                });
            })
            .catch(() => {})
            .finally(() => setBooksLoading(false));
    }, [id, currentPage, limit]);

    useEffect(() => {
        if (!qrCanvasRef.current || !member) return;
        QRCode.toCanvas(qrCanvasRef.current, member.member_id, {
            width: 100,
            margin: 1,
            color: { dark: "#6366f1", light: "#ffffff" },
        }).catch(() => {});
    }, [member]);

    useEffect(() => {
        if (!barcodeCanvasRef.current || !member) return;
        drawCode39Barcode(barcodeCanvasRef.current, member.member_id);
    }, [member]);

    const handleIssueBook = async () => {
        if (!selectedBook || !dueDate) {
            toast({ title: "Error", description: "Please select a book and due date", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            await api.post("/library/book-issues", {
                member_id: id,
                book_id: Number(selectedBook),
                due_date: dueDate,
            });
            toast({ title: "Success", description: "Book issued successfully" });
            setSelectedBook("");
            setDueDate("");
            setCurrentPage(1);
            const res = await api.get(`/library/book-issues/member/${id}?page=1&limit=${limit}`);
            setIssuedBooks(res.data.data ?? []);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
                from: res.data.from,
                to: res.data.to,
            });
            const booksRes = await api.get("/library/books?no_paginate=true");
            const raw = booksRes.data.data ?? booksRes.data ?? [];
            setBooks(Array.isArray(raw) ? raw.filter((b: BookOption) => b.available > 0) : []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to issue book",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReturnBook = async (issueId: number) => {
        try {
            await api.put(`/library/book-issues/${issueId}/return`);
            toast({ title: "Success", description: "Book returned successfully" });
            const res = await api.get(`/library/book-issues/member/${id}?page=${currentPage}&limit=${limit}`);
            setIssuedBooks(res.data.data ?? []);
            const booksRes = await api.get("/library/books?no_paginate=true");
            const raw = booksRes.data.data ?? booksRes.data ?? [];
            setBooks(Array.isArray(raw) ? raw.filter((b: BookOption) => b.available > 0) : []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to return book",
                variant: "destructive",
            });
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
    };

    const handleCopy = () => {
        const text = issuedBooks.map((b) => `${b.book.title}\t${b.book.book_number}\t${b.issue_date}\t${b.due_date}\t${b.return_date || "-"}`).join("\n");
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };

    const handleExportCSV = () => {
        const headers = ["Book Title", "Book Number", "Issue Date", "Due Return Date", "Return Date"];
        const rows = issuedBooks.map((b) => [b.book.title, b.book.book_number, formatDate(b.issue_date), formatDate(b.due_date), b.return_date ? formatDate(b.return_date) : "-"]);
        const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "issued_books.csv");
        link.style.visibility = "hidden";
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

    const today = new Date().toISOString().split("T")[0];

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Sidebar: Member Information */}
                <div className="w-full lg:w-[280px] shrink-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 flex flex-col items-center border-b border-gray-100">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-100 mb-2 bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400">
                                {member?.user?.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <h2 className="text-sm font-bold text-gray-800">{member?.user?.name || "Loading..."}</h2>
                        </div>

                        <div className="p-0">
                            {[
                                { label: "Member ID", value: member?.member_id || id },
                                { label: "Library Card No.", value: member?.library_card_no || "-" },
                                { label: member?.member_type === "student" ? "Admission No" : "Staff ID", value: member?.user?.admission_no || member?.user?.staff_id || "-" },
                                { label: "Gender", value: member?.user?.gender || "-" },
                                { label: "Member Type", value: member?.member_type ? (member.member_type.charAt(0).toUpperCase() + member.member_type.slice(1)) : "-" },
                                { label: "Mobile Number", value: member?.user?.phone || "-", color: "text-indigo-400" },
                                { label: "Class/Section", value: member?.user?.school_class ? `${member.user.school_class.class} (${member.user.section?.section || ""})` : "-", color: "text-indigo-400" },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2.5 px-4 border-b border-gray-50 last:border-0">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{item.label}</span>
                                    <span className={cn("text-[11px] font-medium text-gray-700", item.color)}>{item.value}</span>
                                </div>
                            ))}

                            {/* Barcode & QR */}
                            <div className="p-4 space-y-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Barcode</span>
                                    <div className="flex justify-center bg-white rounded border border-gray-100 p-2">
                                        <canvas ref={barcodeCanvasRef} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">QR Code</span>
                                    <div className="flex justify-center">
                                        <canvas ref={qrCanvasRef} width={100} height={100} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 space-y-6">
                    {/* Issue Book Form */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800">Issue Book</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                        Books <span className="text-red-500 font-bold">*</span>
                                    </Label>
                                    <Select value={selectedBook} onValueChange={setSelectedBook}>
                                        <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                            <SelectValue placeholder={booksLoading ? "Loading..." : "Select"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {books.map((book) => (
                                                <SelectItem key={book.id} value={String(book.id)}>
                                                    {book.title} ({book.book_number}) - Avail: {book.available}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                        Due Return Date <span className="text-red-500 font-bold">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        min={today}
                                        className="h-9 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleIssueBook}
                                    disabled={saving || !selectedBook || !dueDate}
                                    className="btn-gradient px-6 h-8 text-[11px] font-bold uppercase"
                                >
                                    {saving ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Book Issued List */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-medium text-gray-800">Book Issued</h2>
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-fit">
                                <div className="relative w-full md:w-64">
                                    <Input
                                        placeholder="Search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                                    />
                                </div>
                                <Button type="submit" className="btn-gradient h-8 px-4 text-[11px] font-bold uppercase transition-all">
                                    <Search className="h-3.5 w-3.5 mr-1" /> Search
                                </Button>
                            </form>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <Select value={limit} onValueChange={(v) => { setLimit(v); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 bg-transparent shadow-none rounded-md px-2">
                                            <SelectValue />
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
                                        <Button key={i} variant="ghost" size="icon" onClick={action.onClick} title={action.title} className="h-7 w-7 hover:bg-gray-100 rounded">
                                            <action.Icon className="h-3.5 w-3.5" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[800px]">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Book Title</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Book Number</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Issue Date</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Due Return Date</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Return Date</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {issuedBooks.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-gray-400 text-xs">
                                                {booksLoading ? "Loading..." : "No books issued yet"}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        issuedBooks.map((book) => (
                                            <TableRow key={book.id} className={cn("text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap", book.return_date && "bg-green-50/50")}>
                                                <TableCell className="py-3 text-gray-700 font-medium">{book.book.title}</TableCell>
                                                <TableCell className="py-3 text-gray-500">{book.book.book_number}</TableCell>
                                                <TableCell className="py-3 text-gray-500">{book.issue_date ? formatDate(book.issue_date) : "-"}</TableCell>
                                                <TableCell className="py-3 text-gray-500">{book.due_date ? formatDate(book.due_date) : "-"}</TableCell>
                                                <TableCell className="py-3 text-gray-500">{book.return_date ? formatDate(book.return_date) : "-"}</TableCell>
                                                <TableCell className="py-3 text-right">
                                                    {!book.return_date && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleReturnBook(book.id)}
                                                            className="h-7 w-7 btn-gradient text-white rounded-full shadow-md"
                                                            title="Return Book"
                                                        >
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Footer / Pagination */}
                        {pagination && (
                            <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
                                <div>
                                    Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total || 0} entries
                                </div>
                                <div className="flex gap-1 items-center">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className="h-7 w-7 rounded border-gray-100 hover:bg-gray-50 shadow-none disabled:opacity-30"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    {[...Array(pagination.last_page || 0)].map((_, i) => (
                                        <Button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={cn(
                                                "h-7 w-7 p-0 text-[11px] font-bold rounded shadow-sm",
                                                currentPage === i + 1 ? "btn-gradient text-white" : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-100"
                                            )}
                                        >
                                            {i + 1}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={currentPage === pagination.last_page}
                                        onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                                        className="h-7 w-7 rounded border-gray-100 hover:bg-gray-50 shadow-none disabled:opacity-30"
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
