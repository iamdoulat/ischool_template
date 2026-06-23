"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Boxes
} from "lucide-react";
import { useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useToast } from "@/components/ui/toast";
import { exportData } from "@/lib/export-utils";

interface Module {
    id: number;
    name: string;
    alias: string;
    is_active_system: boolean;
    is_active_student: boolean;
    is_active_parent: boolean;
}

type SortConfig = {
    key: keyof Module;
    direction: 'asc' | 'desc';
} | null;

export default function ModulesPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("system");
    const [moduleList, setModuleList] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    // Pagination & Sorting State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

    const fetchModules = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/system-setting/modules");
            if (response.data.success) {
                setModuleList(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch modules", error);
            toast("error", "Failed to fetch modules");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchModules();
    }, [fetchModules]);

    const toggleModule = async (id: number, currentStatus: boolean, scope: string) => {
        try {
            setUpdatingId(id);
            const field = `is_active_${scope}`;
            const response = await api.put(`/system-setting/modules/${id}`, {
                [field]: !currentStatus
            });
            if (response.data.success) {
                setModuleList(prev => prev.map(m => m.id === id ? response.data.data : m));
                toast("success", `${t("module")} ${t("updated_successfully")}`);
            }
        } catch (error) {
            console.error("Failed to update module", error);
            toast("error", "Failed to update module status");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleSort = (key: keyof Module) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedModules = useMemo(() => {
        const result = [...moduleList].filter(m =>
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.alias.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [moduleList, searchTerm, sortConfig]);

    const totalPages = Math.ceil(filteredAndSortedModules.length / itemsPerPage);
    const paginatedModules = filteredAndSortedModules.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleExport = (type: "copy" | "excel" | "pdf" | "print") => {
        exportData(type, {
            filename: `modules-${activeTab}`,
            title: `Modules (${activeTab})`,
            columns: ["Name", "Status"],
            rows: filteredAndSortedModules.map((m) => {
                const isActive = activeTab === "system" ? m.is_active_system : activeTab === "student" ? m.is_active_student : m.is_active_parent;
                return [m.name, isActive ? "Enabled" : "Disabled"];
            }),
        });
    };

    const renderTable = (scope: string) => (
        <div className="border border-gray-100 rounded overflow-x-auto">
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-b border-gray-100 hover:bg-transparent text-[11px]">
                        <TableHead
                            className="h-9 px-4 font-bold text-gray-600 uppercase w-full cursor-pointer hover:text-indigo-600 transition-colors group"
                            onClick={() => handleSort('name')}
                        >
                            <div className="flex items-center gap-1">
                                {t("name")}
                                <ArrowUpDown className={`h-3 w-3 ${sortConfig?.key === 'name' ? 'opacity-100 text-indigo-600' : 'opacity-30 group-hover:opacity-100'}`} />
                            </div>
                        </TableHead>
                        <TableHead className="h-9 px-4 font-bold text-gray-600 text-right w-24 uppercase">{t("action")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedModules.map((module) => {
                        const isActive = scope === "system" ? module.is_active_system : scope === "student" ? module.is_active_student : module.is_active_parent;
                        return (
                            <TableRow key={module.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors h-10 group">
                                <TableCell className="py-2 px-4 text-[12px] text-gray-600 font-medium">{t(module.alias.toLowerCase()) || module.name}</TableCell>
                                <TableCell className="py-2 px-4 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        {updatingId === module.id && <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />}
                                        <Switch
                                            checked={isActive}
                                            disabled={updatingId === module.id}
                                            onCheckedChange={() => toggleModule(module.id, isActive, scope)}
                                            className="data-[state=checked]:bg-[#6366f1] scale-90 transition-all"
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {paginatedModules.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center text-[11px] text-gray-400">
                                No matching records found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <Card className="pt-0 overflow-hidden">
                {/* Gradient header with icon + tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Boxes className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("modules")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">Enable or disable system modules</p>
                        </div>
                    </div>
                    <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setCurrentPage(1); }}>
                        <TabsList className="bg-white/60 h-9 p-1 rounded-lg">
                            <TabsTrigger value="system" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-gray-500 text-[12px] font-medium px-4">{t("system")}</TabsTrigger>
                            <TabsTrigger value="student" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-gray-500 text-[12px] font-medium px-4">{t("student")}</TabsTrigger>
                            <TabsTrigger value="parent" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-600 text-gray-500 text-[12px] font-medium px-4">{t("parent")}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <CardContent className="p-0">
                    {loading ? (
                        <TableSkeleton rows={10} columns={1} />
                    ) : (
                        <>
                            {/* Toolbar */}
                            <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100">
                                <div className="relative w-full md:w-64">
                                    <Input
                                        placeholder={`${t("search")}...`}
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        className="h-8 text-[11px] pl-3 border-gray-200 shadow-none rounded bg-gray-50/50 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-7 w-16 text-[11px] border-gray-200 shadow-none rounded">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50" onClick={() => handleExport('copy')}><Copy className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50" onClick={() => handleExport('excel')}><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50" onClick={() => handleExport('pdf')}><FileText className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50" onClick={() => handleExport('print')}><Printer className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Columns className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="p-4">
                                {activeTab === "system" && renderTable("system")}
                                {activeTab === "student" && renderTable("student")}
                                {activeTab === "parent" && renderTable("parent")}

                                {/* Pagination */}
                                <div className="flex items-center justify-between pt-4 px-1">
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        {t("showing")} {filteredAndSortedModules.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} {t("to")} {Math.min(currentPage * itemsPerPage, filteredAndSortedModules.length)} {t("of")} {filteredAndSortedModules.length} {t("entries")}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="icon" className="h-6 w-6 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                                            <ChevronLeft className="h-3 w-3" />
                                        </Button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum = 1;
                                            if (totalPages <= 5) { pageNum = i + 1; }
                                            else if (currentPage <= 3) { pageNum = i + 1; }
                                            else if (currentPage >= totalPages - 2) { pageNum = totalPages - 4 + i; }
                                            else { pageNum = currentPage - 2 + i; }
                                            return (
                                                <Button key={pageNum} onClick={() => setCurrentPage(pageNum)} variant={currentPage === pageNum ? "pagination-active" : "pagination-inactive"} className="h-6 w-6 p-0 text-[10px]">
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                        <Button variant="outline" size="icon" className="h-6 w-6 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                                            <ChevronRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
