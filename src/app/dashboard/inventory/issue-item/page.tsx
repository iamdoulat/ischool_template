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
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
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
    Plus,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Trash2,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface InventoryIssue {
    id: number;
    item_id: number;
    item_category_id: number;
    user_type: string;
    issue_to: string;
    issue_by: string;
    issue_date: string;
    return_date?: string;
    quantity: number;
    note?: string;
    status: "issued" | "returned";
    item?: { item_name: string };
    item_category?: { item_category: string };
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}


export default function IssueItemPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [issues, setIssues] = useState<InventoryIssue[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState("50");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [categories, setCategories] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        user_type: "staff",
        issue_to: "",
        issue_by: "Admin", // Should be logged in user
        issue_date: new Date().toISOString().split('T')[0],
        return_date: "",
        item_category_id: "",
        item_id: "",
        quantity: "1",
        note: ""
    });

    const fetchCategories = async () => {
        try {
            const response = await api.get('/inventory/item-categories?limit=100');
            setCategories(response.data.data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchItemsByCategory = async (categoryId: string) => {
        if (!categoryId) return;
        try {
            const response = await api.get(`/inventory/items?limit=100&item_category_id=${categoryId}`);
            setItems(response.data.data);
        } catch (error) {
            console.error("Error fetching items:", error);
        }
    };

    const fetchIssues = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/inventory/issue-items?page=${page}&search=${searchTerm}&limit=${limit}`);
            setIssues(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching issues:", error);
            toast({ title: "Error", description: "Failed to fetch issue records", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchIssues();
    }, [limit]);

    useEffect(() => {
        if (formData.item_category_id) {
            fetchItemsByCategory(formData.item_category_id);
        }
    }, [formData.item_category_id]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchIssues(1);
    };

    const handleIssueItem = async () => {
        if (!formData.issue_to || !formData.item_id || !formData.quantity) {
            toast({ title: "Validation Error", description: "Please fill required fields", variant: "destructive" });
            return;
        }

        try {
            await api.post('/inventory/issue-items', formData);
            toast({ title: "Success", description: "Item issued successfully" });
            setIsDialogOpen(false);
            setFormData({
                user_type: "staff",
                issue_to: "",
                issue_by: "Admin",
                issue_date: new Date().toISOString().split('T')[0],
                return_date: "",
                item_category_id: "",
                item_id: "",
                quantity: "1",
                note: ""
            });
            fetchIssues();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to issue item",
                variant: "destructive",
            });
        }
    };

    const handleReturn = async (id: number) => {
        if (confirm("Are you sure you want to return this item?")) {
            try {
                await api.put(`/inventory/issue-items/${id}`, { status: 'returned' });
                toast({ title: "Success", description: "Item returned successfully" });
                fetchIssues();
            } catch (error) {
                toast({ title: "Error", description: "Failed to return item", variant: "destructive" });
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this record?")) {
            try {
                await api.delete(`/inventory/issue-items/${id}`);
                toast({ title: "Success", description: "Record deleted successfully" });
                fetchIssues();
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete record", variant: "destructive" });
            }
        }
    };

    const handleCopy = () => {
        const text = issues.map(i => `${i.item?.item_name}\t${i.issue_to}\t${i.status}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };

    const handleExportCSV = () => {
        const headers = ["Item", "Category", "Issue To", "Issued By", "Date", "Status"];
        const rows = issues.map(i => [i.item?.item_name, i.item_category?.item_category, i.issue_to, i.issue_by, i.issue_date, i.status]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "issued_items.csv");
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
                <h1 className="text-sm font-medium text-gray-800 tracking-tight">Issue Item List</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="btn-gradient gap-2 h-8 px-4 text-[10px] font-bold uppercase transition-all rounded-full shadow-md">
                            <Plus className="h-3.5 w-3.5" /> Issue Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-gray-800">Issue Item</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">User Type *</Label>
                                <Select value={formData.user_type} onValueChange={(val) => setFormData({ ...formData, user_type: val })}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-md shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="staff">Staff</SelectItem>
                                        <SelectItem value="student">Student</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Issue To *</Label>
                                <Input 
                                    className="h-9 border-gray-200 text-xs rounded-md shadow-none" 
                                    placeholder="Search by Name/ID"
                                    value={formData.issue_to}
                                    onChange={(e) => setFormData({ ...formData, issue_to: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Issue By *</Label>
                                <Input 
                                    className="h-9 border-gray-200 text-xs rounded-md shadow-none"
                                    value={formData.issue_by}
                                    onChange={(e) => setFormData({ ...formData, issue_by: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Issue Date *</Label>
                                <DatePicker 
                                    value={formData.issue_date}
                                    onChange={(val) => setFormData({ ...formData, issue_date: val })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Return Date</Label>
                                <DatePicker 
                                    value={formData.return_date}
                                    onChange={(val) => setFormData({ ...formData, return_date: val })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Item Category *</Label>
                                <Select value={formData.item_category_id} onValueChange={(val) => setFormData({ ...formData, item_category_id: val, item_id: "" })}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-md shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.item_category}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Item *</Label>
                                <Select value={formData.item_id} onValueChange={(val) => setFormData({ ...formData, item_id: val })} disabled={!formData.item_category_id}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-md shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {items.map(i => (
                                            <SelectItem key={i.id} value={String(i.id)}>{i.item_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Quantity *</Label>
                                <Input 
                                    type="number" 
                                    className="h-9 border-gray-200 text-xs rounded-md shadow-none"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Note</Label>
                                <Textarea 
                                    className="min-h-[80px] border-gray-200 text-xs rounded-md shadow-none resize-none"
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full">Cancel</Button>
                            <Button onClick={handleIssueItem} className="btn-gradient h-9 px-8 text-[11px] uppercase font-bold rounded-full">Save Issue Record</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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

                {/* Action Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1200px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Item <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Note <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Item Category <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Issue - Return</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Issue To <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Issued By <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Quantity <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Status</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {issues.map((issue) => (
                                <TableRow key={issue.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                    <TableCell className="py-3 text-gray-700 font-medium">{issue.item?.item_name}</TableCell>
                                    <TableCell className="py-3 text-gray-400">{issue.note || "-"}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{issue.item_category?.item_category}</TableCell>
                                    <TableCell className="py-3 text-gray-500">
                                        {issue.issue_date} - {issue.return_date || "Open"}
                                    </TableCell>
                                    <TableCell className="py-3 text-gray-700 font-medium">{issue.issue_to}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{issue.issue_by}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{issue.quantity}</TableCell>
                                    <TableCell className="py-3">
                                        {issue.status === "issued" ? (
                                            <Button 
                                                onClick={() => handleReturn(issue.id)}
                                                className="h-5 px-2 bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-bold rounded-full uppercase whitespace-nowrap shadow-sm shadow-rose-100"
                                            >
                                                Click to Return
                                            </Button>
                                        ) : (
                                            <span className="h-5 px-2 bg-emerald-500 text-white text-[9px] font-bold rounded-full uppercase flex items-center justify-center w-fit shadow-sm shadow-emerald-100">
                                                Returned
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-3 text-right">
                                        <Button 
                                            size="icon" 
                                            onClick={() => handleDelete(issue.id)}
                                            className="btn-action bg-rose-500 hover:bg-rose-600 shadow-rose-100"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
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
                            onClick={() => fetchIssues(pagination!.current_page - 1)}
                            className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {[...Array(pagination?.last_page || 0)].map((_, i) => (
                            <Button 
                                key={i + 1}
                                onClick={() => fetchIssues(i + 1)}
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
                            onClick={() => fetchIssues(pagination!.current_page + 1)}
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
