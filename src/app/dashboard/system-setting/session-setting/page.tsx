"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
    Copy,
    FileSpreadsheet,
    FileBox,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Pencil,
    Trash2,
    Info,
    Loader2
} from "lucide-react";

interface SessionEntry {
    id: number;
    session: string;
    is_active: boolean;
}

export default function SessionSettingPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [sessions, setSessions] = useState<SessionEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>("desc");

    // Form state
    const [editId, setEditId] = useState<number | null>(null);
    const [sessionName, setSessionName] = useState("");
    const [isActive, setIsActive] = useState(false);

    // Notifications
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("auth_token");
            const response = await axios.get("http://127.0.0.1:8000/api/v1/system-setting/sessions", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.success) {
                setSessions(response.data.data);
            }
        } catch (err: any) {
            console.error("Failed to fetch sessions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const resetForm = () => {
        setEditId(null);
        setSessionName("");
        setIsActive(false);
        setError("");
        setSuccess("");
    };

    const handleEdit = (session: SessionEntry) => {
        setEditId(session.id);
        setSessionName(session.session);
        setIsActive(session.is_active);
        setError("");
        setSuccess("");
    };

    const handleSave = async () => {
        if (!sessionName.trim()) {
            setError("Session name is required");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");
            const token = localStorage.getItem("auth_token");

            const payload = {
                session: sessionName,
                is_active: isActive
            };

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            if (editId) {
                await axios.put(`http://127.0.0.1:8000/api/v1/system-setting/sessions/${editId}`, payload, config);
                setSuccess("Session updated successfully");
            } else {
                await axios.post("http://127.0.0.1:8000/api/v1/system-setting/sessions", payload, config);
                setSuccess("Session added successfully");
            }

            fetchSessions();
            resetForm();
            setTimeout(() => setSuccess(""), 3000);

        } catch (err: any) {
            setError(err.response?.data?.message || "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this session?")) {
            return;
        }

        try {
            const token = localStorage.getItem("auth_token");
            await axios.delete(`http://127.0.0.1:8000/api/v1/system-setting/sessions/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setSuccess("Session deleted successfully");
            fetchSessions();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to delete session");
        }
    };

    const filteredSessions = sessions.filter(s =>
        s.session.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        if (!sortOrder) return 0;
        if (sortOrder === "asc") return a.session.localeCompare(b.session);
        return b.session.localeCompare(a.session);
    });

    const toggleSort = () => {
        setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    };

    const handleCopy = () => {
        if (filteredSessions.length === 0) return;
        const headers = ["Session", "Status"];
        const rows = filteredSessions.map(s => [s.session, s.is_active ? "Active" : "Inactive"]);
        const tsv = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
        navigator.clipboard.writeText(tsv).then(() => {
            setSuccess("Copied to clipboard");
            setTimeout(() => setSuccess(""), 3000);
        });
    };

    const handleExportExcel = () => {
        if (filteredSessions.length === 0) return;
        const headers = ["Session", "Status"];
        const rows = filteredSessions.map(s => [s.session, s.is_active ? "Active" : "Inactive"]);
        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "sessions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        if (filteredSessions.length === 0) return;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        const headers = ["Session", "Status"];
        const rows = filteredSessions.map(s => [s.session, s.is_active ? "Active" : ""]);

        const html = `
            <html>
            <head>
                <title>Session List</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; color: #333; }
                    h2 { margin-bottom: 20px; font-size: 18px; color: #111; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
                    th { background-color: #f9fafb; font-weight: bold; text-transform: uppercase; }
                    tr:nth-child(even) { background-color: #fdfdfd; }
                </style>
            </head>
            <body>
                <h2>Session List</h2>
                <table>
                    <thead>
                        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        doc.open();
        doc.write(html);
        doc.close();

        iframe.contentWindow?.focus();
        setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 1000);
        }, 250);
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col md:flex-row gap-6">

                {/* Left Side: Add/Edit Session */}
                <div className="w-full md:w-1/3 md:max-w-sm space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">
                            {editId ? "Edit Session" : "Add Session"}
                        </h2>

                        {error && <div className="text-red-500 text-[10px] font-medium bg-red-50 p-2 rounded">{error}</div>}
                        {success && <div className="text-green-500 text-[10px] font-medium bg-green-50 p-2 rounded">{success}</div>}

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Session <span className="text-red-500">*</span></Label>
                                <Input
                                    value={sessionName}
                                    onChange={(e) => setSessionName(e.target.value)}
                                    placeholder="e.g. 2026-27"
                                    className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isActive"
                                    checked={isActive}
                                    onCheckedChange={(checked) => setIsActive(checked as boolean)}
                                />
                                <label
                                    htmlFor="isActive"
                                    className="text-[11px] font-medium leading-none cursor-pointer"
                                >
                                    Set as Active Session
                                </label>
                            </div>

                            <div className="flex justify-between pt-2">
                                {editId ? (
                                    <Button
                                        variant="outline"
                                        onClick={resetForm}
                                        className="h-7 text-[10px] font-bold uppercase"
                                    >
                                        Cancel
                                    </Button>
                                ) : <div />}
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-6 h-8 text-[11px] font-bold transition-all rounded-full shadow-md border-none"
                                >
                                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Session List */}
                <div className="flex-1 space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Session List</h2>

                        {/* Warning Note */}
                        <div className="bg-blue-50/50 border border-blue-100/50 p-3 rounded-md flex gap-2.5 items-start">
                            <div className="flex-shrink-0 mt-0.5">
                                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Info className="h-2.5 w-2.5 text-blue-500" />
                                </div>
                            </div>
                            <p className="text-[10px] text-blue-600/80 leading-relaxed font-medium">
                                Note: Changing the session name format may cause issues on some pages or features, so it is recommended not to change the session name format.
                            </p>
                        </div>

                        {/* Table Header / Actions */}
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
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">50</span>
                                    <Select defaultValue="50">
                                        <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none ring-0">
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
                                    <Button onClick={handleCopy} variant="ghost" size="icon" title="Copy" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={handleExportExcel} variant="ghost" size="icon" title="Export Excel / CSV" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={handleExportExcel} variant="ghost" size="icon" title="Export CSV Data" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <FileBox className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={handlePrint} variant="ghost" size="icon" title="Save as PDF (Print)" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={handlePrint} variant="ghost" size="icon" title="Print" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <Columns className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Session Table */}
                        <div className="rounded border border-gray-50 overflow-hidden relative">
                            {loading && (
                                <div className="absolute inset-0 z-10 bg-white/50 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                                </div>
                            )}
                            <Table>
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={toggleSort}>
                                            <div className="flex items-center">
                                                Session <ArrowUpDown className="h-2.5 w-2.5 ml-1 opacity-50" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="py-3 px-4">Status <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSessions.length > 0 ? filteredSessions.map((item) => (
                                        <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="py-3 px-4 text-gray-700">{item.session}</TableCell>
                                            <TableCell className="py-3 px-4">
                                                {item.is_active ? (
                                                    <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter">
                                                        Active
                                                    </span>
                                                ) : null}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-7 w-7 text-gray-400 hover:text-indigo-500">
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-7 w-7 text-gray-400 hover:text-red-500">
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-6 text-gray-400">
                                                {loading ? "Loading sessions..." : "No sessions found"}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Table Footer */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                            <div>Showing 1 to {filteredSessions.length} of {filteredSessions.length} entries</div>
                            <div className="flex items-center gap-1.5">
                                <Button disabled variant="outline" className="h-7 w-7 p-0 border border-gray-100 bg-gray-50/50 text-gray-400 rounded-lg hover:bg-gray-100 transition-all shadow-sm">
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button className="h-7 w-7 p-0 bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white text-[11px] font-bold border-0 rounded-lg shadow-md transition-all">1</Button>
                                <Button disabled variant="outline" className="h-7 w-7 p-0 border border-gray-100 bg-gray-50/50 text-gray-400 rounded-lg hover:bg-gray-100 transition-all shadow-sm">
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
