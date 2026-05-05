"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Trash2,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Check
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";

interface CommunicationLog {
    id: string;
    title: string;
    message: string;
    date: string;
    scheduleDate?: string;
    isEmail: boolean;
    isSms: boolean;
    isGroup: boolean;
    isIndividual: boolean;
    isClass: boolean;
}

export default function EmailSmsLogPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [logs, setLogs] = useState<CommunicationLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/communicate/scheduled-logs');
            setLogs(response.data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch logs", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (rawId: string, isEmail: boolean) => {
        if (!confirm("Are you sure you want to delete this log?")) return;
        
        try {
            const numericId = rawId.replace('sms_', '').replace('email_', '');
            const type = isEmail ? 'email' : 'sms';
            await api.delete(`/communicate/logs/${numericId}?type=${type}`);
            toast({ title: "Success", description: "Log deleted successfully" });
            fetchLogs();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete log", variant: "destructive" });
        }
    };

    const handleCopy = () => {
        const text = logs.map(l => `${l.title}\t${l.message}\t${l.date}\t${l.scheduleDate}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };

    const handleExportCSV = () => {
        const headers = ["Title", "Message", "Date", "Schedule Date", "Email", "SMS", "Group", "Individual", "Class"];
        const rows = logs.map(l => [l.title, l.message, l.date, l.scheduleDate || '-', l.isEmail ? 'Yes' : 'No', l.isSms ? 'Yes' : 'No', l.isGroup ? 'Yes' : 'No', l.isIndividual ? 'Yes' : 'No', l.isClass ? 'Yes' : 'No']);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "email_sms_logs.csv");
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
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-sm font-medium text-gray-800">Email / SMS Log</h1>
                <Button className="btn-gradient h-8 px-6 text-[10px] font-bold uppercase transition-all rounded-full shadow-md">
                    Delete Email Sms Log
                </Button>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <Select defaultValue="50">
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

                {/* Log Table */}
                <div className="rounded-md border border-gray-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 w-[150px]">Title</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Description</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 w-[120px]">Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 w-[120px]">Schedule Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Email</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">SMS</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Group</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Individual</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Class</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.filter(log => log.title.toLowerCase().includes(searchTerm.toLowerCase()) || log.message.toLowerCase().includes(searchTerm.toLowerCase())).map((log) => (
                                <TableRow key={log.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/20 transition-colors">
                                    <TableCell className="py-3.5 text-gray-800 font-medium align-top">{log.title}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500 max-w-[400px] leading-relaxed">
                                        {log.message}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-gray-500 align-top whitespace-pre-line">
                                        {log.date}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-gray-500 align-top whitespace-pre-line">
                                        {log.scheduleDate || "-"}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center">
                                        {log.isEmail && <Check className="h-3.5 w-3.5 mx-auto text-gray-800" />}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center">
                                        {log.isSms && <Check className="h-3.5 w-3.5 mx-auto text-gray-800" />}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center">
                                        {log.isGroup && <Check className="h-3.5 w-3.5 mx-auto text-gray-800" />}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center">
                                        {log.isIndividual && <Check className="h-3.5 w-3.5 mx-auto text-gray-800" />}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-center">
                                        {log.isClass && <Check className="h-3.5 w-3.5 mx-auto text-gray-800" />}
                                    </TableCell>
                                    <TableCell className="py-3.5 text-right align-top">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(log.id, log.isEmail)} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all shadow-sm">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer / Pagination */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50">
                    <div>
                        Showing 1 to {logs.length} of {logs.length} entries
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={true}
                            className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                            className="h-7 w-7 p-0 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300 btn-gradient"
                        >
                            1
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={true}
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
