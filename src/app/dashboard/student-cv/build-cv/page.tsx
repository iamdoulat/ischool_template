"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { 
    Copy, FileSpreadsheet, FileBox, Printer, Columns,
    ChevronLeft, ChevronRight, Search, ArrowUpDown, LayoutList, Settings, ChevronDown, FileUser
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Student {
    id: string;
    admission_no: string;
    name: string;
    dob: string;
    gender: string;
    student_category?: { category_name: string };
    phone: string;
}

export default function BuildCVPage() {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState("");
    const [searching, setSearching] = useState(false);
    const [criteria, setCriteria] = useState<any[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);

    // Criteria states
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [sections, setSections] = useState<any[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");

    useEffect(() => {
        fetchCriteria();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            const cls = criteria.find(c => c.id.toString() === selectedClass);
            setSections(cls?.sections || []);
            setSelectedSection("");
        } else {
            setSections([]);
            setSelectedSection("");
        }
    }, [selectedClass, criteria]);

    const fetchCriteria = async () => {
        setLoading(true);
        try {
            const response = await api.get('/student-cv/criteria');
            const dataList = response.data.data || [];
            setCriteria(dataList);

            // Auto-select Class 1 / Section A to synchronise with seeder mockup instantly!
            if (dataList.length > 0) {
                const class1 = dataList.find((c: any) => c.name === "Class 1");
                if (class1) {
                    setSelectedClass(class1.id.toString());
                    const sectionA = class1.sections?.find((s: any) => s.name === "A");
                    if (sectionA) {
                        setSelectedSection(sectionA.id.toString());
                        // Fetch students automatically for Class 1 Section A
                        fetchStudentsForClassSection(class1.id.toString(), sectionA.id.toString());
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch criteria", error);
            toast.error(t("failed_to_load_criteria"));
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentsForClassSection = async (classId: string, sectionId: string) => {
        setSearching(true);
        try {
            const response = await api.get('/student-cv/students', {
                params: { school_class_id: classId, section_id: sectionId }
            });
            setStudents(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch students", error);
            toast.error(t("failed_to_load_student_list"));
        } finally {
            setSearching(false);
        }
    };

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection) {
            toast.error(t("please_select_class_and_section"));
            return;
        }
        fetchStudentsForClassSection(selectedClass, selectedSection);
    };

    // Filter students by search term
    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_no.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Format DOB to MM/DD/YYYY
    const formatDob = (dobStr: string) => {
        if (!dobStr) return "";
        try {
            const d = new Date(dobStr);
            if (isNaN(d.getTime())) return dobStr;
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
        } catch {
            return dobStr;
        }
    };

    // Calculate pagination variables
    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredStudents.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + sizeNum);

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans text-xs space-y-4">
            
            {/* Criteria Filtering Section */}
            <div className="bg-white rounded border border-gray-100 shadow-sm space-y-4 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FileUser className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("build_student_cv")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("select_class_and_section_to_build")}</p>
                        </div>
                    </div>
                    <Link href="/dashboard/student-cv/setting">
                        <Button
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-4 h-7.5 text-[11px] font-bold rounded-full shadow-[0_4px_12px_rgba(99,102,241,0.25)] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                        >
                            <Settings className="h-3 w-3" /> Setting
                        </Button>
                    </Link>
                </div>

                <div className="p-4 pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Class Selection */}
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-gray-700">Class <span className="text-red-500">*</span></Label>
                        <div className="relative">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="flex h-9 w-full rounded border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 appearance-none cursor-pointer"
                            >
                                <option value="">Select</option>
                                {criteria.map(c => (
                                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Section Selection */}
                    <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-gray-700">Section</Label>
                        <div className="relative">
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className="flex h-9 w-full rounded border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 appearance-none cursor-pointer"
                            >
                                <option value="">Select</option>
                                {sections.map(s => (
                                    <option key={s.id} value={s.id.toString()}>{s.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button 
                        onClick={handleSearch} 
                        disabled={searching}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-6 h-9.5 text-xs font-bold rounded-full shadow-[0_4px_12px_rgba(99,102,241,0.25)] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                    >
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
                </div>
            </div>

            {/* List Header label */}
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1 pt-2">Student List</div>

            {/* Table Card Panel */}
            <div className="bg-white rounded border border-gray-100 p-4 shadow-sm space-y-4 overflow-hidden min-h-[400px]">

                {/* Table Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-1">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-8 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <div className="relative">
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(e.target.value); setCurrentPage(1); }}
                                    className="flex h-7 w-16 text-[10px] border border-gray-200 shadow-none rounded font-semibold text-gray-700 bg-white px-2 py-0.5 appearance-none cursor-pointer pr-5"
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                </select>
                                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            {[Copy, FileSpreadsheet, FileBox, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[900px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">Admission No <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Student Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-center">Date Of Birth <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-center">Gender <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Category <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">Mobile Number <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {searching ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <div className="flex items-center justify-center gap-2 text-gray-400">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                                            Auditing Students...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedStudents.length === 0 ? (
                                <TableRow className="hover:bg-transparent h-48">
                                    <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                        No students found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedStudents.map((item, idx) => (
                                    <TableRow key={item.id || idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3 px-4 text-gray-600 font-medium">{item.admission_no}</TableCell>
                                        <TableCell className="py-3 px-4 text-[#6366f1] font-semibold hover:underline cursor-pointer">{item.name}</TableCell>
                                        <TableCell className="py-3 px-4 text-center text-gray-600">{formatDob(item.dob) || "—"}</TableCell>
                                        <TableCell className="py-3 px-4 text-center text-gray-600 font-medium">{item.gender}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-600 font-medium">{item.student_category?.category_name || "—"}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-600 font-medium">{item.phone || "—"}</TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            <Button 
                                                onClick={() => toast.success(`Initiating CV Builder for ${item.name}`)}
                                                className="bg-[#6366f1] hover:bg-[#5558e6] text-white p-0 h-6 w-6 rounded shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer ml-auto"
                                                title="Build CV"
                                            >
                                                <LayoutList className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50 mt-2">
                    <div>
                        Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                        {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                    </div>

                    {totalEntries > 0 && (
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
