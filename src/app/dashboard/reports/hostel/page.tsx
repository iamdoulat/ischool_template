"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";
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
    Home,
    Plus,
    Copy,
    FileSpreadsheet,
    FileBox,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";

export default function HostelReportPage() {
    const { symbol } = useCurrencyFormatter();
    const [searchTerm, setSearchTerm] = useState("");

    // Criteria Lists
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [hostels, setHostels] = useState<any[]>([]);

    // Selected Criteria Values
    const [selectedClass, setSelectedClass] = useState<string>("all");
    const [selectedSection, setSelectedSection] = useState<string>("all");
    const [selectedHostel, setSelectedHostel] = useState<string>("all");

    // Report Result States
    const [reportList, setReportList] = useState<any[]>([]);
    const [isSearched, setIsSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");

    // Fetch Criteria Parameters on Mount
    useEffect(() => {
        const fetchCriteria = async () => {
            try {
                const response = await api.get("/reports/hostel/criteria");
                setClasses(response.data.classes || []);
                setSections(response.data.sections || []);
                setHostels(response.data.hostels || []);
            } catch (error) {
                console.error("Failed to fetch criteria", error);
                toast.error("Failed to load criteria parameters");
            }
        };
        fetchCriteria();
    }, []);

    // Search Report Action
    const handleSearch = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (selectedClass !== "all") params.class_id = selectedClass;
            if (selectedSection !== "all") params.section_id = selectedSection;
            if (selectedHostel !== "all") params.hostel_id = selectedHostel;

            const response = await api.get("/reports/hostel/search", { params });
            setReportList(response.data.data || []);
            setIsSearched(true);
            setCurrentPage(1);
            toast.success("Hostel Report loaded successfully");
        } catch (error) {
            console.error("Failed to fetch hostel report", error);
            toast.error("Failed to load hostel report");
        } finally {
            setLoading(false);
        }
    };

    // Filtered Report logic based on searchTerm
    const filteredReport = reportList.filter((item) => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return (
            (item.class || "").toLowerCase().includes(lower) ||
            (item.admission_no || "").toLowerCase().includes(lower) ||
            (item.student_name || "").toLowerCase().includes(lower) ||
            (item.mobile_number || "").toLowerCase().includes(lower) ||
            (item.guardian_phone || "").toLowerCase().includes(lower) ||
            (item.hostel_name || "").toLowerCase().includes(lower) ||
            (item.room_number || "").toLowerCase().includes(lower) ||
            (item.room_type || "").toLowerCase().includes(lower)
        );
    });

    // Available sections based on selectedClass
    const availableSections = selectedClass === "all"
        ? []
        : (classes.find(c => c.id.toString() === selectedClass)?.sections || []);

    const handleClassChange = (classId: string) => {
        setSelectedClass(classId);
        setSelectedSection("all");
    };

    // Pagination calculations
    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredReport.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    const paginatedReportList = filteredReport.slice(startIndex, startIndex + sizeNum);

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Hostel Report</h1>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                        <Select value={selectedClass} onValueChange={handleClassChange}>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section <span className="text-red-500">*</span></Label>
                        <Select 
                            value={selectedSection} 
                            onValueChange={setSelectedSection}
                            disabled={selectedClass === "all"}
                        >
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500 disabled:opacity-50">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sections</SelectItem>
                                {availableSections.map((sec: any) => (
                                    <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Hostel Name</Label>
                        <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Hostels</SelectItem>
                                {hostels.map((h) => (
                                    <SelectItem key={h.id} value={h.id.toString()}>{h.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button 
                        onClick={handleSearch}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5"
                    >
                        <Search className="h-3 w-3" />
                        Search
                    </Button>
                </div>
            </div>

            {/* Student Hostel Report Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Student Hostel Report</h2>

                {/* Search & Export Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-50">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-8 h-8 border-gray-200 text-[11px] shadow-none focus-visible:ring-indigo-500 rounded"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Show</span>
                            <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                <SelectTrigger className="h-7 w-16 border-gray-200 text-[11px] shadow-none rounded">
                                    <SelectValue placeholder="50" />
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
                <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1500px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">Class (Section) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Admission No <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Student Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Mobile Number <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Guardian Phone <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Hostel Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Room Number / Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Room Type <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-right">Cost Per Bed ({symbol}) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-12">
                                        <div className="flex items-center justify-center gap-2 text-gray-400">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                                            Loading...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : !isSearched ? (
                                <TableRow className="hover:bg-transparent h-64">
                                    <TableCell colSpan={9} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                            <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest whitespace-nowrap">No data available in table</p>
                                            <div className="relative">
                                                <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                    <Home className="h-8 w-8 text-gray-200" />
                                                </div>
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                    <Plus className="h-3 w-3 text-indigo-300" />
                                                </div>
                                            </div>
                                            <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                <span className="text-lg">←</span> Add new record or search with different criteria.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedReportList.length > 0 ? (
                                paginatedReportList.map((item, idx) => (
                                    <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3 px-4 text-gray-700 font-medium">{item.class}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{item.admission_no}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-700 font-medium">{item.student_name}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{item.mobile_number}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{item.guardian_phone}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{item.hostel_name}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{item.room_number}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{item.room_type}</TableCell>
                                        <TableCell className="py-3 px-4 text-right text-indigo-600 font-bold">{symbol}{item.cost.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={9} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                        No hostel records match the search.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50 mt-2">
                    <div>
                        Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                        {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                        {searchTerm && ` (filtered from ${reportList.length} total entries)`}
                    </div>

                    {reportList.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={safePage === 1}
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold",
                                        safePage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95"
                                            : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                    )}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                disabled={safePage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
