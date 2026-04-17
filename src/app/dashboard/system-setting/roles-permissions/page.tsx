"use client";

import { useEffect, useState, useCallback } from "react";
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
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import {
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    Search,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    ShieldCheck,
    Check
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Simple Tooltip component
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
    return (
        <div className="group relative inline-flex items-center justify-center">
            {children}
            <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
                <div className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap font-medium">
                    {content}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
            </div>
        </div>
    );
};

export default function RolesPermissionsPage() {
    const [roles, setRoles] = useState<any[]>([]);
    const [paginationMeta, setPaginationMeta] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleName, setRoleName] = useState("");
    const [editingRole, setEditingRole] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        role: true,
        type: true,
        action: true,
    });
    const [limit, setLimit] = useState("50");

    const fetchRoles = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get("/roles", {
                params: {
                    search: searchTerm,
                    page: page,
                    limit: limit === "All" ? 1000 : parseInt(limit)
                }
            });
            setRoles(response.data.data.data);
            setPaginationMeta(response.data.data);
        } catch (error) {
            console.error("Failed to fetch roles:", error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, limit]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchRoles();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchRoles]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleName.trim()) return;

        setSubmitting(true);
        try {
            if (editingRole) {
                await api.patch(`/roles/${editingRole.id}`, { name: roleName });
            } else {
                await api.post("/roles", {
                    name: roleName,
                    is_system: false
                });
            }
            setRoleName("");
            setEditingRole(null);
            fetchRoles();
        } catch (error) {
            console.error("Failed to save role:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (role: any) => {
        if (role.name === 'Super Admin') return;
        setEditingRole(role);
        setRoleName(role.name);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this role?")) return;

        try {
            await api.delete(`/roles/${id}`);
            fetchRoles();
        } catch (error) {
            console.error("Failed to delete role:", error);
        }
    };

    const toggleColumn = (column: keyof typeof visibleColumns) => {
        setVisibleColumns(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    const getExportData = () => {
        const headers = ["Role", "Type"];
        const rows = roles.map(r => [r.name, r.is_system ? "System" : "Custom"]);
        return { headers, rows };
    };

    const handleCopy = () => {
        const { headers, rows } = getExportData();
        const content = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
        navigator.clipboard.writeText(content);
        alert("Role list copied to clipboard (Tab-separated)");
    };

    const handleExportCSV = () => {
        const { headers, rows } = getExportData();
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "roles_list.csv");
        link.click();
    };

    const handlePrint = () => {
        const { headers, rows } = getExportData();
        const html = `
            <html>
                <head>
                    <title>Role List</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 14px; }
                        th { background-color: #f8fafc; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
                        h1 { font-size: 24px; margin: 0; color: #1e293b; }
                        .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: right; }
                    </style>
                </head>
                <body>
                    <h1>Role List</h1>
                    <table>
                        <thead>
                            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}
                        </tbody>
                    </table>
                    <div class="footer">Generated on ${new Date().toLocaleDateString()}</div>
                </body>
            </html>
        `;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    return (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-6 bg-gray-50/10 min-h-screen font-sans">

            {/* Role Creation Form */}
            <div className="lg:col-span-1">
                <Card className="border-none shadow-sm h-fit">
                    <CardHeader className="pb-3 border-b border-gray-50">
                        <CardTitle className="text-sm font-medium text-gray-700">Role</CardTitle>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="pt-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-medium text-gray-500">Name <span className="text-red-500">*</span></label>
                                <Input
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    placeholder="Enter role name"
                                    className="h-9 text-[12px] border-gray-200 focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end pt-2">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white text-[12px] px-8 h-9 rounded-full shadow-md transition-all"
                            >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "SAVE"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>

            {/* Role List */}
            <div className="lg:col-span-3">
                <Card className="border-none shadow-sm min-h-[500px] flex flex-col">
                    <CardHeader className="pb-3 border-b border-gray-50">
                        <CardTitle className="text-sm font-medium text-gray-700">Role List</CardTitle>
                    </CardHeader>

                    <div className="p-3 pb-0 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-8 text-[11px] pl-8 border-gray-200 shadow-none rounded bg-gray-50/50 focus:bg-white transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="h-8 w-[70px] text-[11px] border-gray-200 bg-gray-50/50 shadow-none focus:ring-0 focus:ring-offset-0">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent className="min-w-[70px]">
                                    <SelectItem value="50" className="text-[11px]">50</SelectItem>
                                    <SelectItem value="100" className="text-[11px]">100</SelectItem>
                                    <SelectItem value="200" className="text-[11px]">200</SelectItem>
                                    <SelectItem value="500" className="text-[11px]">500</SelectItem>
                                    <SelectItem value="All" className="text-[11px]">All</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1">
                                <Tooltip content="Copy">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleCopy}
                                        className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Excel">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleExportCSV}
                                        className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                    >
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                </Tooltip>
                                <Tooltip content="PDF">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handlePrint}
                                        className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Print">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handlePrint}
                                        className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                    >
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Column">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50 outline-none">
                                                <Columns className="h-3.5 w-3.5" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-32 p-1" align="end">
                                            <div className="space-y-0.5">
                                                {([
                                                    { id: 'role', label: 'Role' },
                                                    { id: 'type', label: 'Type' },
                                                    { id: 'action', label: 'Action' }
                                                ] as const).map((col) => (
                                                    <div
                                                        key={col.id}
                                                        className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                                                        onClick={() => toggleColumn(col.id)}
                                                    >
                                                        <span className="text-[12px] text-gray-700">{col.label}</span>
                                                        {visibleColumns[col.id] && (
                                                            <Check className="h-3.5 w-3.5 text-indigo-500" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-hidden">
                        <Table className="table-fixed w-full border-collapse">
                            <TableHeader className="bg-gray-50/40">
                                <TableRow className="border-b border-gray-100 hover:bg-transparent text-[11px]">
                                    {visibleColumns.role && <TableHead className="h-10 px-3 font-bold text-gray-600 uppercase w-auto">Role</TableHead>}
                                    {visibleColumns.type && <TableHead className="h-10 px-3 font-bold text-gray-600 uppercase w-[100px]">Type</TableHead>}
                                    {visibleColumns.action && <TableHead className="h-10 px-3 font-bold text-gray-600 uppercase text-right w-[140px]">Action</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleColumns.role ? (visibleColumns.type ? (visibleColumns.action ? 3 : 2) : (visibleColumns.action ? 2 : 1)) : (visibleColumns.type ? (visibleColumns.action ? 2 : 1) : 1)} className="h-32 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                                        </TableCell>
                                    </TableRow>
                                ) : roles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={visibleColumns.role ? (visibleColumns.type ? (visibleColumns.action ? 3 : 2) : (visibleColumns.action ? 2 : 1)) : (visibleColumns.type ? (visibleColumns.action ? 2 : 1) : 1)} className="h-32 text-center text-gray-400 text-xs">No roles found.</TableCell>
                                    </TableRow>
                                ) : (
                                    roles.map((role) => (
                                        <TableRow key={role.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors h-11 group">
                                            {visibleColumns.role && (
                                                <TableCell className="py-2 px-3 text-[12px] text-gray-600 font-medium truncate max-w-0" title={role.name}>
                                                    {role.name}
                                                </TableCell>
                                            )}
                                            {visibleColumns.type && <TableCell className="py-2 px-3 text-[12px] text-gray-400 truncate">{role.is_system ? "System" : "Custom"}</TableCell>}
                                            {visibleColumns.action && (
                                                <TableCell className="py-2 px-3 text-right">
                                                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <Tooltip content="Assign Permission">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg shadow-sm" asChild>
                                                                <Link href={`/dashboard/system-setting/roles-permissions/assign-permission/${role.id}`}>
                                                                    <ShieldCheck className="h-3.5 w-3.5" />
                                                                </Link>
                                                            </Button>
                                                        </Tooltip>
                                                        <Tooltip content="Edit Role">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(role)}
                                                                disabled={role.name === 'Super Admin'}
                                                                className={`h-7 w-7 ${role.name === 'Super Admin' ? 'bg-gray-100 text-gray-400' : 'bg-[#6366f1] text-white hover:bg-[#5558dd] shadow-sm'} rounded-lg`}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </Tooltip>
                                                        <Tooltip content="Delete Role">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(role.id)}
                                                                disabled={role.name === 'Super Admin'}
                                                                className={`h-7 w-7 ${role.name === 'Super Admin' ? 'bg-gray-100 text-gray-400' : 'bg-red-500 text-white hover:bg-red-600 shadow-sm'} rounded-lg`}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {paginationMeta && (
                        <CardFooter className="py-3 items-center justify-between border-t border-gray-50">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                Showing {paginationMeta.from || 0} to {paginationMeta.to || 0} of {paginationMeta.total || 0} entries
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={!paginationMeta.prev_page_url}
                                    onClick={() => fetchRoles(paginationMeta.current_page - 1)}
                                    className="h-8 w-8 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg bg-gradient-to-r from-orange-400 to-indigo-500 text-white shadow-md hover:from-orange-500 hover:to-indigo-600 font-bold text-xs pointer-events-none"
                                >
                                    {paginationMeta.current_page}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={!paginationMeta.next_page_url}
                                    onClick={() => fetchRoles(paginationMeta.current_page + 1)}
                                    className="h-8 w-8 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardFooter>
                    )}
                </Card>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print,
                    button,
                    nav,
                    input,
                    header,
                    .lg\\:col-span-1 {
                        display: none !important;
                    }
                    .lg\\:col-span-3 {
                        width: 100% !important;
                        grid-column: span 3 / span 3 !important;
                    }
                    .Card {
                        border: none !important;
                        box-shadow: none !important;
                    }
                    body {
                        background: white !important;
                    }
                }
            `}</style>
        </div>
    );
}
