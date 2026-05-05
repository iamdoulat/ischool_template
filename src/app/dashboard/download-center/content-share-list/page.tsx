"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
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
    Eye,
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

interface SharedContent {
    id: number;
    title: string;
    send_to: string;
    share_date: string;
    valid_upto?: string;
    sender?: { name: string };
    description: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export default function ContentShareListPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [sharedContent, setSharedContent] = useState<SharedContent[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState("50");

    useEffect(() => {
        fetchSharedContent();
    }, [searchTerm, limit]);

    const fetchSharedContent = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/download-center/shared-contents?page=${page}&limit=${limit}&search=${searchTerm}`);
            setSharedContent(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching shared content:", error);
            toast({ title: "Error", description: "Failed to fetch shared content", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this shared content?")) {
            try {
                await api.delete(`/download-center/shared-contents/${id}`);
                toast({ title: "Success", description: "Shared content deleted successfully" });
                fetchSharedContent();
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete shared content", variant: "destructive" });
            }
        }
    };

    const handleCopy = () => {
        const text = sharedContent.map(t => `${t.title}\t${t.send_to}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };

    const handleExportCSV = () => {
        const headers = ["Title", "Send To", "Share Date", "Valid Upto", "Shared By"];
        const rows = sharedContent.map(t => [t.title, t.send_to, t.share_date, t.valid_upto, t.sender?.name]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "shared_content.csv");
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
            {/* Header Section */}
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-sm font-medium text-gray-800">Content Share List</h1>
            </div>

             {/* Main Content Area */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search shared content..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-9 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/50"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <Select value={limit} onValueChange={setLimit}>
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

                {/* Content Table */}
                <div className="rounded border border-gray-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Title <ArrowUpDown className="h-2.5 w-2.5" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Send To <ArrowUpDown className="h-2.5 w-2.5" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Share Date <ArrowUpDown className="h-2.5 w-2.5" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Valid Upto <ArrowUpDown className="h-2.5 w-2.5" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Shared By <ArrowUpDown className="h-2.5 w-2.5" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Description</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                         <TableBody>
                            {sharedContent.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-gray-400 text-xs">
                                        No shared content found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sharedContent.map((item) => (
                                    <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3 text-gray-700 font-medium">{item.title}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{item.send_to}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{formatDate(item.share_date)}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{item.valid_upto ? formatDate(item.valid_upto) : "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{item.sender?.name}</TableCell>
                                        <TableCell className="py-3 text-gray-500 truncate max-w-[200px]">{item.description || "-"}</TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="h-7 w-7 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full">
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
                            onClick={() => fetchSharedContent(pagination!.current_page - 1)}
                            className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {[...Array(pagination?.last_page || 0)].map((_, i) => (
                            <Button 
                                key={i + 1}
                                onClick={() => fetchSharedContent(i + 1)}
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
                            onClick={() => fetchSharedContent(pagination!.current_page + 1)}
                            className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
