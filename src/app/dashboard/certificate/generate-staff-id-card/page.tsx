"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ArrowUpDown,
    UserSquare2,
    Loader2,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { type IdCardTemplate, type IdCardPerson, renderIdCardHtml, printIdCards } from "@/lib/certificate";

interface ApiStaff {
    id: number;
    staff_id?: string;
    name?: string;
    role?: string;
    designation?: string;
    department?: string;
    father_name?: string;
    mother_name?: string;
    date_of_joining?: string;
    joining_date?: string;
    phone?: string;
    dob?: string;
    current_address?: string;
    avatar?: string;
}

interface Role { name: string; }

const TABLE_COLS = 11;

function SkeletonRows({ rows = 5, cols = TABLE_COLS }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <div className="h-3 rounded bg-gray-200/70 animate-pulse" style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

function toPerson(s: ApiStaff): IdCardPerson {
    return {
        name: s.name || "",
        staff_id: s.staff_id || "",
        designation: s.designation || "",
        department: s.department || "",
        father_name: s.father_name || "",
        mother_name: s.mother_name || "",
        joining_date: s.date_of_joining || s.joining_date
            ? new Date(s.date_of_joining || s.joining_date || "").toLocaleDateString("en-US")
            : "",
        dob: s.dob ? new Date(s.dob).toLocaleDateString("en-US") : "",
        phone: s.phone || "",
        address: s.current_address || "",
        photo: s.avatar ? `/storage/${s.avatar}` : null,
    };
}

export default function GenerateStaffIDCardPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [templates, setTemplates] = useState<IdCardTemplate[]>([]);

    const [selectedRole, setSelectedRole] = useState("");
    const [templateId, setTemplateId] = useState("");

    const [staff, setStaff] = useState<ApiStaff[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const [rolesRes, tplRes] = await Promise.all([
                    api.get("/hr/staff-roles"),
                    api.get("/certificate/staff-id-cards", { params: { per_page: 100 } }),
                ]);
                setRoles(rolesRes.data?.data || rolesRes.data || []);
                const tplData = tplRes.data?.data ?? tplRes.data ?? [];
                setTemplates(Array.isArray(tplData) ? tplData : []);
            } catch {
                tt.error("failed_to_load_criteria_data");
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = async () => {
        if (!selectedRole || !templateId) {
            toast({ title: t("validation_error"), description: t("please_select_role_and_id_card_template"), variant: "destructive" });
            return;
        }
        setLoading(true);
        setSearched(true);
        try {
            const res = await api.get("/hr/staff-directory", { params: { role: selectedRole, no_paginate: true } });
            const data = res.data?.data || res.data || [];
            setStaff(Array.isArray(data) ? data : []);
            setSelected([]);
        } catch {
            tt.error("failed_to_fetch_staff");
        } finally {
            setLoading(false);
        }
    };

    const filtered = staff.filter((s) =>
        (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.staff_id || "").includes(searchTerm)
    );
    const allChecked = filtered.length > 0 && selected.length === filtered.length;
    const toggleAll = () => setSelected(allChecked ? [] : filtered.map((s) => s.id));
    const toggleOne = (id: number) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

    const handleGenerate = () => {
        const template = templates.find((tp) => String(tp.id) === templateId);
        if (!template) return;
        const chosen = staff.filter((s) => selected.includes(s.id));
        if (chosen.length === 0) {
            toast({ title: t("no_staff_selected"), description: t("select_at_least_one_staff"), variant: "destructive" });
            return;
        }
        printIdCards(chosen.map((s) => renderIdCardHtml(template, toPerson(s), "staff")).join(""));
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(filtered.map((s) => `${s.staff_id}\t${s.name}`).join("\n"));
        tt.success("data_copied_to_clipboard");
    };
    const handleExportCSV = () => {
        const rows = [[t("staff_id"), t("name"), t("role"), t("designation"), t("department"), t("father_name"), t("mother_name"), t("joining_date"), t("phone"), t("dob")],
            ...filtered.map((s) => [s.staff_id || "", s.name || "", s.role || "", s.designation || "", s.department || "", s.father_name || "", s.mother_name || "", s.date_of_joining || "", s.phone || "", s.dob || ""])];
        const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "staff_id_card.csv";
        link.click();
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="space-y-6">
            {/* Criteria */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <UserSquare2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("generate_staff_id_card")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("generate_staff_id_card_description")}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("role")} <span className="text-red-500">*</span></Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select_role")} /></SelectTrigger>
                                <SelectContent>
                                    {roles.map((r) => <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("id_card_template")} <span className="text-red-500">*</span></Label>
                            <Select value={templateId} onValueChange={setTemplateId}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select_template")} /></SelectTrigger>
                                <SelectContent>
                                    {templates.map((tp) => <SelectItem key={tp.id} value={String(tp.id)}>{tp.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSearch} disabled={loading} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} {t("search")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Staff list */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FileText className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("staff_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("x_of_y_selected", { selected: selected.length, total: filtered.length })}</p>
                        </div>
                    </div>
                    <Button onClick={handleGenerate} disabled={selected.length === 0} className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all disabled:opacity-40">
                        <UserSquare2 className="h-4 w-4" /> {t("generate")}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <Input placeholder={t("search_staff")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-3 h-9 text-xs w-full md:w-64" />
                        <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500 self-end md:self-auto">
                            {toolbarActions.map((a, i) => (
                                <Button key={i} variant="ghost" size="icon" onClick={a.onClick} title={a.title} className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"><a.Icon className="h-4 w-4" /></Button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1400px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="w-10"><Checkbox checked={allChecked} onCheckedChange={toggleAll} className="h-3.5 w-3.5" /></TableHead>
                                    {[t("staff_id"), t("staff_name"), t("role"), t("designation"), t("department"), t("father_name"), t("mother_name"), t("joining_date"), t("phone"), t("dob")].map((h) => (
                                        <TableHead key={h} className="font-semibold text-gray-600"><div className="flex items-center gap-1">{h} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows />
                                ) : !searched ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("select_role_and_template_then_search")}</TableCell></TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_staff_found")}</TableCell></TableRow>
                                ) : filtered.map((s) => (
                                    <TableRow key={s.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                        <TableCell className="py-3"><Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggleOne(s.id)} className="h-3.5 w-3.5" /></TableCell>
                                        <TableCell className="py-3 text-gray-700 font-medium">{s.staff_id || "-"}</TableCell>
                                        <TableCell className="py-3 text-[#6366f1] font-medium">{s.name || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.role || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.designation || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.department || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.father_name || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.mother_name || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.date_of_joining ? new Date(s.date_of_joining).toLocaleDateString("en-US") : "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.phone || "-"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.dob ? new Date(s.dob).toLocaleDateString("en-US") : "-"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="text-xs text-gray-500 font-medium pt-2">{t("showing_x_staff", { count: filtered.length })}</div>
                </CardContent>
            </Card>
        </div>
    );
}
