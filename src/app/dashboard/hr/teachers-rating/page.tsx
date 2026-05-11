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
    TableRow
} from "@/components/ui/table";
import {
    Star,
    Trash2,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    CheckCircle
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Rating {
    id: number;
    staff_id: string;
    staff_name: string;
    rating: number;
    comment: string;
    status: "Pending" | "Approved";
    student_name: string;
}

export default function TeachersRatingPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/hr/teacher-ratings");
            setRatings(response.data.data);
        } catch (error) {
            console.error("Error fetching ratings:", error);
            toast("error", "Failed to load teacher ratings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id: number) => {
        try {
            await api.put(`/hr/teacher-ratings/${id}/approve`);
            toast("success", "Rating approved successfully");
            fetchData();
        } catch (error) {
            toast("error", "Failed to approve rating");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this rating?")) return;
        try {
            await api.delete(`/hr/teacher-ratings/${id}`);
            toast("success", "Rating deleted successfully");
            fetchData();
        } catch (error) {
            toast("error", "Failed to delete rating");
        }
    };

    const filteredRatings = ratings.filter(item =>
        item.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.staff_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredRatings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredRatings.slice(startIndex, startIndex + itemsPerPage);

    const StarRating = ({ count }: { count: number }) => (
        <div className="flex gap-0.5 items-center">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={cn(
                        "h-3 w-3",
                        s <= count ? "fill-orange-400 text-orange-400" : "text-gray-200"
                    )}
                />
            ))}
            <span className="ml-1 text-[10px] text-gray-500 font-bold">{count}</span>
        </div>
    );

    // Export Functions
    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(ratings.map(r => ({
            "Staff ID": r.staff_id,
            "Staff Name": r.staff_name,
            "Rating": r.rating,
            "Comment": r.comment,
            "Status": r.status,
            "Student Name": r.student_name
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Teacher Ratings");
        XLSX.writeFile(wb, "teacher_ratings.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Teacher Ratings List", 14, 15);
        autoTable(doc, {
            head: [['Staff ID', 'Staff Name', 'Rating', 'Status', 'Student Name']],
            body: ratings.map(r => [r.staff_id, r.staff_name, r.rating, r.status, r.student_name]),
            startY: 20,
        });
        doc.save("teacher_ratings.pdf");
    };

    const copyToClipboard = () => {
        const text = ratings.map(r => `${r.staff_id} - ${r.staff_name} (${r.rating}*): ${r.status}`).join('\n');
        navigator.clipboard.writeText(text);
        toast("success", "Data copied to clipboard");
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800 border-b pb-2">Teacher Ratings List</h2>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search by Staff ID, Name or Student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-lg"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(val) => {
                                    setItemsPerPage(parseInt(val));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="h-7 w-14 text-[10px] border-none bg-gray-50 hover:bg-gray-100 transition-colors shadow-none rounded-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={copyToClipboard}>
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={exportToExcel}>
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={exportToPDF}>
                                <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={() => window.print()}>
                                <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors">
                                <Columns className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded border border-gray-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Staff ID</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Staff Name</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Rating</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Comment</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Status</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Student Name</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-gray-400 italic">Loading teacher ratings...</TableCell>
                                </TableRow>
                            ) : paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-gray-400 italic">No ratings found</TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((item) => (
                                    <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/20 transition-colors">
                                        <TableCell className="py-3.5 text-gray-500">{item.staff_id}</TableCell>
                                        <TableCell className="py-3.5 text-indigo-500 font-medium cursor-pointer hover:underline">{item.staff_name}</TableCell>
                                        <TableCell className="py-3.5"><StarRating count={item.rating} /></TableCell>
                                        <TableCell className="py-3.5 text-gray-500 italic max-w-[200px] truncate" title={item.comment}>{item.comment || "—"}</TableCell>
                                        <TableCell className="py-3.5">
                                            <span className={cn(
                                                "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                                                item.status === "Pending" ? "bg-orange-500 text-white" : "bg-green-600 text-white"
                                            )}>
                                                {item.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3.5 text-gray-500">{item.student_name || "—"}</TableCell>
                                        <TableCell className="py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {item.status === "Pending" && (
                                                    <Button 
                                                        onClick={() => handleApprove(item.id)}
                                                        variant="gradient"
                                                        className="h-7 px-3 text-[9px] font-bold uppercase rounded shadow-sm flex items-center gap-1"
                                                    >
                                                        <CheckCircle className="h-3 w-3" />
                                                        Approve
                                                    </Button>
                                                )}
                                                <Button 
                                                    onClick={() => handleDelete(item.id)} 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors shadow-sm"
                                                >
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

                <div className="flex justify-end items-center gap-2 py-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="h-8 w-8 rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-30"
                    >
                        <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                            key={page}
                            variant={currentPage === page ? "gradient" : "outline"}
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                                "h-8 w-8 rounded-lg text-[10px] font-bold p-0 transition-all",
                                currentPage === page ? "shadow-md scale-105" : "border-gray-100 text-gray-400 hover:text-indigo-600"
                            )}
                        >
                            {page}
                        </Button>
                    ))}

                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="h-8 w-8 rounded-lg border border-gray-100 hover:bg-gray-50 disabled:opacity-30"
                    >
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
