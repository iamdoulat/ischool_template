"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Search,
    FileText,
    PlusSquare,
    ClipboardList,
    Copy,
    FileSpreadsheet,
    FileBox,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const reportLinks = [
    { name: "Stack Report", icon: FileText, active: true },
    { name: "Add Item Report", icon: PlusSquare },
    { name: "Issue Item Report", icon: ClipboardList },
];

interface StockItem {
    name: string;
    category: string;
    supplier: string;
    store: string;
    availableQty: number;
    totalQty: number;
    totalIssued: number;
}

interface AddItemRow {
    name: string;
    category: string;
    supplier: string;
    store: string;
    quantity: number;
    purchase_price: string;
    date: string;
}

interface IssueItemRow {
    item: string;
    note: string;
    category: string;
    dateRange: string;
    issue_to: string;
    issue_by: string;
    quantity: number;
}

const mockStock: StockItem[] = [
    { name: "Class Board", category: "Books Stationery", supplier: "Camlin Stationers", store: "Library Store", availableQty: 260, totalQty: 280, totalIssued: 27 },
    { name: "Football", category: "Sports", supplier: "Camlin Stationers", store: "Science Store", availableQty: 104, totalQty: 112, totalIssued: 8 },
    { name: "Cricket Bat", category: "Sports", supplier: "Camlin Stationers", store: "Library Store", availableQty: 221, totalQty: 250, totalIssued: 20 },
    { name: "Uniform", category: "Staff Dress", supplier: "jhonson Uniform Dress", store: "Uniform Dress Store", availableQty: 28, totalQty: 48, totalIssued: 30 },
    { name: "Benches", category: "Furniture", supplier: "David Furniture", store: "Furniture Store", availableQty: 27, totalQty: 50, totalIssued: 23 },
    { name: "Table chair", category: "Furniture", supplier: "David Furniture", store: "Furniture Store", availableQty: 4, totalQty: 12, totalIssued: 18 },
    { name: "Desk", category: "Furniture", supplier: "David Furniture", store: "Furniture Store", availableQty: 233, totalQty: 234, totalIssued: 1 },
    { name: "Lab Equipment", category: "Chemistry Lab Apparatus", supplier: "Jhon smith Supplier", store: "Chemistry Equipment", availableQty: 40, totalQty: 50, totalIssued: 20 },
    { name: "Projectors", category: "Chemistry Lab Apparatus", supplier: "Jhon smith Supplier", store: "Chemistry Equipment", availableQty: 39, totalQty: 45, totalIssued: 6 },
];

import api from "@/lib/api";
import { toast } from "sonner";

export default function InventoryReportPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("Stack Report");
    
    // Stack Report State
    const [stackList, setStackList] = useState<StockItem[]>([]);
    const [stackIsSearched, setStackIsSearched] = useState(false);
    const [stackSearchType, setStackSearchType] = useState("all_time");

    // Add Item Report State
    const [addItemList, setAddItemList] = useState<AddItemRow[]>([]);
    const [addIsSearched, setAddIsSearched] = useState(false);
    const [addSearchType, setAddSearchType] = useState("all_time");

    // Issue Item Report State
    const [issueItemList, setIssueItemList] = useState<IssueItemRow[]>([]);
    const [issueIsSearched, setIssueIsSearched] = useState(false);
    const [issueSearchType, setIssueSearchType] = useState("all_time");

    const [loading, setLoading] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("10");

    const handleStackSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/inventory/stack", {
                params: { search_type: stackSearchType },
            });
            setStackList(response.data.data || []);
            setStackIsSearched(true);
            setCurrentPage(1);
            toast.success("Stack report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch stack report", error);
            toast.error("Failed to load stack report");
        } finally {
            setLoading(false);
        }
    };

    const handleAddSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/inventory/add-item", {
                params: { search_type: addSearchType },
            });
            setAddItemList(response.data.data || []);
            setAddIsSearched(true);
            setCurrentPage(1);
            toast.success("Add Item report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch Add Item report", error);
            toast.error("Failed to load Add Item report");
        } finally {
            setLoading(false);
        }
    };

    const handleIssueSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get("/reports/inventory/issue-item", {
                params: { search_type: issueSearchType },
            });
            setIssueItemList(response.data.data || []);
            setIssueIsSearched(true);
            setCurrentPage(1);
            toast.success("Issue Item report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch Issue Item report", error);
            toast.error("Failed to load Issue Item report");
        } finally {
            setLoading(false);
        }
    };

    // Derived data - Stack Report
    const filteredStack = stackList.filter((item) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            (item.name || "").toLowerCase().includes(lower) ||
            (item.category || "").toLowerCase().includes(lower) ||
            (item.supplier || "").toLowerCase().includes(lower) ||
            (item.store || "").toLowerCase().includes(lower)
        );
    });

    // Derived data - Add Item Report
    const filteredAdd = addItemList.filter((item) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            (item.name || "").toLowerCase().includes(lower) ||
            (item.category || "").toLowerCase().includes(lower) ||
            (item.supplier || "").toLowerCase().includes(lower) ||
            (item.store || "").toLowerCase().includes(lower)
        );
    });

    // Derived data - Issue Item Report
    const filteredIssue = issueItemList.filter((item) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            (item.item || "").toLowerCase().includes(lower) ||
            (item.note || "").toLowerCase().includes(lower) ||
            (item.category || "").toLowerCase().includes(lower) ||
            (item.issue_to || "").toLowerCase().includes(lower) ||
            (item.issue_by || "").toLowerCase().includes(lower)
        );
    });

    const sizeNum = parseInt(itemsPerPage, 10) || 10;
    
    // Stack pagination variables
    const totalStackEntries = filteredStack.length;
    const totalStackPages = Math.ceil(totalStackEntries / sizeNum) || 1;
    const safeStackPage = Math.min(currentPage, totalStackPages);
    const startStackIndex = (safeStackPage - 1) * sizeNum;
    const paginatedStackList = filteredStack.slice(startStackIndex, startStackIndex + sizeNum);

    // Add Item pagination variables
    const totalAddEntries = filteredAdd.length;
    const totalAddPages = Math.ceil(totalAddEntries / sizeNum) || 1;
    const safeAddPage = Math.min(currentPage, totalAddPages);
    const startAddIndex = (safeAddPage - 1) * sizeNum;
    const paginatedAddList = filteredAdd.slice(startAddIndex, startAddIndex + sizeNum);

    // Issue Item pagination variables
    const totalIssueEntries = filteredIssue.length;
    const totalIssuePages = Math.ceil(totalIssueEntries / sizeNum) || 1;
    const safeIssuePage = Math.min(currentPage, totalIssuePages);
    const startIssueIndex = (safeIssuePage - 1) * sizeNum;
    const paginatedIssueList = filteredIssue.slice(startIssueIndex, startIssueIndex + sizeNum);

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Inventory Report</h1>

            {/* Report Links Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {reportLinks.map((link) => {
                        const isActive = activeTab === link.name;
                        return (
                            <div 
                                key={link.name}
                                onClick={() => {
                                    setActiveTab(link.name);
                                    setSearchTerm("");
                                    setCurrentPage(1);
                                }}
                                className={cn(
                                    "flex items-center gap-3 p-3 px-4 rounded-lg border transition-all duration-300 cursor-pointer group relative overflow-hidden",
                                    isActive 
                                        ? "bg-white border-gray-300 shadow-[0_10px_25px_rgba(0,0,0,0.08)] ring-1 ring-gray-400/10 -translate-y-0.5" 
                                        : "bg-white border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-gray-200 hover:-translate-y-0.5"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg transition-all duration-300",
                                    isActive ? "bg-gray-100 text-gray-900 shadow-inner" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600"
                                )}>
                                    <link.icon className="h-4 w-4" />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold tracking-tight uppercase transition-colors duration-300",
                                    isActive ? "text-gray-900" : "text-gray-500 group-hover:text-gray-700"
                                )}>
                                    {link.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Select Criteria Section */}
            {activeTab === "Stack Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type</Label>
                            <Select value={stackSearchType} onValueChange={setStackSearchType}>
                                <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="All Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="this_week">This Week</SelectItem>
                                    <SelectItem value="this_month">This Month</SelectItem>
                                    <SelectItem value="last_month">Last Month</SelectItem>
                                    <SelectItem value="this_year">This Year</SelectItem>
                                    <SelectItem value="all_time">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end">
                            <Button 
                                onClick={handleStackSearch}
                                disabled={loading}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-xs font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                            >
                                <Search className="h-4 w-4" />
                                {loading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "Add Item Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type</Label>
                            <Select value={addSearchType} onValueChange={setAddSearchType}>
                                <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="All Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="this_week">This Week</SelectItem>
                                    <SelectItem value="this_month">This Month</SelectItem>
                                    <SelectItem value="last_month">Last Month</SelectItem>
                                    <SelectItem value="this_year">This Year</SelectItem>
                                    <SelectItem value="all_time">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end">
                            <Button 
                                onClick={handleAddSearch}
                                disabled={loading}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-xs font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                            >
                                <Search className="h-4 w-4" />
                                {loading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "Issue Item Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type</Label>
                            <Select value={issueSearchType} onValueChange={setIssueSearchType}>
                                <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="All Time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="this_week">This Week</SelectItem>
                                    <SelectItem value="this_month">This Month</SelectItem>
                                    <SelectItem value="last_month">Last Month</SelectItem>
                                    <SelectItem value="this_year">This Year</SelectItem>
                                    <SelectItem value="all_time">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end">
                            <Button 
                                onClick={handleIssueSearch}
                                disabled={loading}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-xs font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                            >
                                <Search className="h-4 w-4" />
                                {loading ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stack Report Table Section */}
            {activeTab === "Stack Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Stock Report</h2>

                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Show</span>
                                <Select value={itemsPerPage} onValueChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-14 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none ring-0">
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
                            <div className="flex items-center gap-1 text-gray-400">
                                {[Copy, FileSpreadsheet, FileBox, FileText, Printer, Columns].map((Icon, i) => (
                                    <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <Icon className="h-3.5 w-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Category <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Supplier <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Store <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-center">Available Quantity <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-center">Total Quantity <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Total Issued</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12">
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                                                Loading...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : !stackIsSearched ? (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={7} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">No data available in table</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedStackList.length > 0 ? (
                                    paginatedStackList.map((item, idx) => (
                                        <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="py-3 px-4 text-gray-700 font-medium">{item.name}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.category}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.supplier}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.store}</TableCell>
                                            <TableCell className="py-3 px-4 text-center text-emerald-600 font-bold">{item.availableQty}</TableCell>
                                            <TableCell className="py-3 px-4 text-center text-gray-500">{item.totalQty}</TableCell>
                                            <TableCell className="py-3 px-4 text-right text-gray-500">{item.totalIssued}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            No items match the search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50 mt-2">
                        <div>
                            Showing {totalStackEntries > 0 ? startStackIndex + 1 : 0} to{" "}
                            {Math.min(startStackIndex + sizeNum, totalStackEntries)} of {totalStackEntries} entries
                            {searchTerm && ` (filtered from ${stackList.length} total entries)`}
                        </div>

                        {stackList.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    disabled={safeStackPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from({ length: totalStackPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold",
                                            safeStackPage === page
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95"
                                                : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    disabled={safeStackPage === totalStackPages}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalStackPages))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Item Report Table Section */}
            {activeTab === "Add Item Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Add Item Report</h2>

                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Show</span>
                                <Select value={itemsPerPage} onValueChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-14 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none ring-0">
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
                            <div className="flex items-center gap-1 text-gray-400">
                                {[Copy, FileSpreadsheet, FileBox, FileText, Printer, Columns].map((Icon, i) => (
                                    <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <Icon className="h-3.5 w-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Category <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Supplier <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Store <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-center">Quantity <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Purchase Price <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12">
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                                                Loading...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : !addIsSearched ? (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={7} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">No data available in table</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedAddList.length > 0 ? (
                                    paginatedAddList.map((item, idx) => (
                                        <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="py-3 px-4 text-gray-700 font-medium">{item.name}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.category}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.supplier}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.store}</TableCell>
                                            <TableCell className="py-3 px-4 text-center text-gray-700 font-bold">{item.quantity}</TableCell>
                                            <TableCell className="py-3 px-4 text-right text-indigo-600 font-bold">${item.purchase_price}</TableCell>
                                            <TableCell className="py-3 px-4 text-right text-gray-500">{item.date}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            No items match the search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50 mt-2">
                        <div>
                            Showing {totalAddEntries > 0 ? startAddIndex + 1 : 0} to{" "}
                            {Math.min(startAddIndex + sizeNum, totalAddEntries)} of {totalAddEntries} entries
                            {searchTerm && ` (filtered from ${addItemList.length} total entries)`}
                        </div>

                        {addItemList.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    disabled={safeAddPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from({ length: totalAddPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold",
                                            safeAddPage === page
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95"
                                                : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    disabled={safeAddPage === totalAddPages}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalAddPages))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Issue Item Report Table Section */}
            {activeTab === "Issue Item Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Issue Item Report</h2>

                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Show</span>
                                <Select value={itemsPerPage} onValueChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-14 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none ring-0">
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
                            <div className="flex items-center gap-1 text-gray-400">
                                {[Copy, FileSpreadsheet, FileBox, FileText, Printer, Columns].map((Icon, i) => (
                                    <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <Icon className="h-3.5 w-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Item <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Note <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Item Category <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Issue - Return <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Issue To <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Issued By <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Quantity <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12">
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                                                Loading...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : !issueIsSearched ? (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={7} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">No data available in table</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedIssueList.length > 0 ? (
                                    paginatedIssueList.map((item, idx) => (
                                        <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="py-3 px-4 text-gray-700 font-medium">{item.item}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.note}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.category}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.dateRange}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.issue_to}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{item.issue_by}</TableCell>
                                            <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">{item.quantity}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            No items match the search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50 mt-2">
                        <div>
                            Showing {totalIssueEntries > 0 ? startIssueIndex + 1 : 0} to{" "}
                            {Math.min(startIssueIndex + sizeNum, totalIssueEntries)} of {totalIssueEntries} entries
                            {searchTerm && ` (filtered from ${issueItemList.length} total entries)`}
                        </div>

                        {issueItemList.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    disabled={safeIssuePage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from({ length: totalIssuePages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold",
                                            safeIssuePage === page
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95"
                                                : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    disabled={safeIssuePage === totalIssuePages}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalIssuePages))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
