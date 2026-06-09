"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Copy, FileSpreadsheet, FileBox, Printer, Columns, 
    ChevronLeft, ChevronRight, Search, ArrowUpDown, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CvField {
    id: number;
    name: string;
    tab: 'cv_fields' | 'cv_other_fields' | 'student_panel_cv_setting';
    is_active: boolean;
}

export default function CVSettingPage() {
    const [activeTab, setActiveTab] = useState<'cv_fields' | 'cv_other_fields' | 'student_panel_cv_setting'>('cv_fields');
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [fields, setFields] = useState<CvField[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/student-cv/settings');
            setFields(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch settings", error);
            toast.error("Failed to load CV settings");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id: number, newStatus: boolean) => {
        try {
            // Optimistic update
            setFields(prev => prev.map(f => f.id === id ? { ...f, is_active: newStatus } : f));
            
            await api.post('/student-cv/settings/toggle', {
                id,
                is_active: newStatus
            });
            
            toast.success("CV Setting updated successfully");
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("Failed to update CV Setting");
            // Revert on error
            fetchSettings();
        }
    };

    const handleSavePanelSettings = () => {
        toast.success("Student Panel CV Setting saved successfully");
    };

    // Filter fields by tab & search keyword
    const tabFields = fields.filter(f => f.tab === activeTab);
    const filteredFields = tabFields.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate pagination variables
    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredFields.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    const paginatedFields = filteredFields.slice(startIndex, startIndex + sizeNum);

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans text-xs space-y-4">
            
            {/* Page Title */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-base font-semibold tracking-tight text-gray-800">CV Setting</span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-100 overflow-x-auto whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm">
                {(['cv_fields', 'cv_other_fields', 'student_panel_cv_setting'] as const).map((tab) => {
                    const label = tab === 'cv_fields' 
                        ? 'CV Fields' 
                        : tab === 'cv_other_fields' 
                            ? 'CV Other Fields' 
                            : 'Student Panel CV Setting';
                    return (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setCurrentPage(1);
                                setSearchTerm("");
                            }}
                            className={cn(
                                "px-4 py-2 text-xs font-bold transition-all relative border-b-2 cursor-pointer",
                                activeTab === tab 
                                    ? "text-[#6366f1] border-[#6366f1]" 
                                    : "text-gray-500 border-transparent hover:text-gray-800"
                            )}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Settings Main Content Card */}
            <div className="bg-white rounded border border-gray-100 p-4 shadow-sm space-y-4 overflow-hidden min-h-[450px]">

                {activeTab === 'student_panel_cv_setting' ? (
                    /* Student Panel CV Setting Custom Form Layout (matching the exact screenshot) */
                    <div className="space-y-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                                Auditing Settings...
                            </div>
                        ) : (
                            <div className="space-y-6 pt-4 min-h-[250px]">
                                {tabFields.map((field) => (
                                    <div key={field.id} className="flex items-center gap-6 text-[12px] font-semibold text-gray-700">
                                        <span className="w-32">{field.name}</span>
                                        <button
                                            onClick={() => handleToggle(field.id, !field.is_active)}
                                            className={cn(
                                                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0",
                                                field.is_active ? "bg-[#6366f1]" : "bg-gray-200"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                    field.is_active ? "translate-x-4" : "translate-x-0"
                                                )}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end pt-4 border-t border-gray-50 mt-6">
                            <Button 
                                onClick={handleSavePanelSettings}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-5 h-8 text-[11px] font-bold rounded shadow-md shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer border-0"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* CV Fields & CV Other Fields Table Layout */
                    <>
                        {/* Toolbar */}
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

                        {/* Table Layout */}
                        <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[600px]">
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-12">
                                                <div className="flex items-center justify-center gap-2 text-gray-400">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                                                    Auditing Fields...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedFields.length === 0 ? (
                                        <TableRow className="hover:bg-transparent h-48">
                                            <TableCell colSpan={2} className="text-center py-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                                No fields found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedFields.map((field) => (
                                            <TableRow key={field.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors whitespace-nowrap">
                                                <TableCell className="py-3 px-4 text-gray-600 font-semibold">{field.name}</TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <button
                                                        onClick={() => handleToggle(field.id, !field.is_active)}
                                                        className={cn(
                                                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-0",
                                                            field.is_active ? "bg-[#6366f1]" : "bg-gray-200"
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                                field.is_active ? "translate-x-4" : "translate-x-0"
                                                            )}
                                                        />
                                                    </button>
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
                    </>
                )}

            </div>

        </div>
    );
}
