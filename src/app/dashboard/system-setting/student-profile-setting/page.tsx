"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { Loader2, UserCog } from "lucide-react";
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
    FileText,
    Printer,
    Columns,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

interface Widget {
    id: number;
    name: string;
    student: boolean;
    parent: boolean;
}

export default function StudentProfileSettingPage() {
    const { t } = useTranslation();
    const [dashboardWidgets, setDashboardWidgets] = useState<Widget[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [allowEditable, setAllowEditable] = useState(false);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingWidgets, setSavingWidgets] = useState(false);
    const { toast } = useToast();

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/system-setting/student-profile-setting");
            if (response.data.status === "Success") {
                setDashboardWidgets(response.data.data.widgets);
                setAllowEditable(response.data.data.is_student_profile_edit);
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
            toast("error", t("failed_to_load"));
        } finally {
            setLoading(false);
        }
    }, [toast, t]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSaveProfileEdit = async () => {
        try {
            setSavingProfile(true);
            const response = await api.post("/system-setting/student-profile-setting/update-profile-edit", {
                is_student_profile_edit: allowEditable
            });
            if (response.data.status === "Success") {
                toast("success", t("saved_successfully"));
            }
        } catch (error) {
            console.error("Failed to save profile setting", error);
            toast("error", t("failed_to_save"));
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSaveWidgets = async () => {
        try {
            setSavingWidgets(true);
            const response = await api.post("/system-setting/student-profile-setting/update-widgets", {
                widgets: dashboardWidgets
            });
            if (response.data.status === "Success") {
                toast("success", t("saved_successfully"));
            }
        } catch (error) {
            console.error("Failed to save dashboard settings", error);
            toast("error", t("failed_to_save"));
        } finally {
            setSavingWidgets(false);
        }
    };

    const toggleDashboardWidget = (id: number, type: 'student' | 'parent') => {
        setDashboardWidgets(prev => prev.map(widget =>
            widget.id === id ? { ...widget, [type]: !widget[type] } : widget
        ));
    };

    const filteredWidgets = dashboardWidgets.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCopy = () => {
        const text = filteredWidgets.map(w => `${w.name}\t${w.student ? 'Yes' : 'No'}\t${w.parent ? 'Yes' : 'No'}`).join('\n');
        navigator.clipboard.writeText(`Name\tStudent\tParent\n${text}`);
        toast("success", t("copied_to_clipboard"));
    };

    const handleExportExcel = () => {
        const csv = ["Name,Student,Parent", ...filteredWidgets.map(w => `"${w.name}",${w.student ? 'Yes' : 'No'},${w.parent ? 'Yes' : 'No'}`)].join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard_settings_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast("success", t("exported_to_csv"));
    };

    const handleExportPDF = () => {
        window.print();
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <Card className="pt-0 overflow-hidden flex flex-col min-h-[600px]">

                {/* Gradient Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <UserCog className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("student_profile_setting")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("configure_student_profile_fields_and_dashboard_widgets")}</p>
                        </div>
                    </div>
                </div>

                <CardContent className="p-0 flex flex-col flex-1">
                {/* Tabs */}
                <Tabs defaultValue="student-profile-update" className="flex flex-col flex-1">
                    <div className="px-4 border-b border-gray-100">
                        <TabsList className="bg-transparent h-10 p-0 space-x-6">
                            <TabsTrigger
                                value="student-profile-update"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-1 pb-2 h-full shadow-none bg-transparent text-[13px]"
                            >
                                {t("student_profile_update")}
                            </TabsTrigger>
                            <TabsTrigger
                                value="dashboard-setting"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 text-gray-500 font-medium px-1 pb-2 h-full shadow-none bg-transparent text-[13px]"
                            >
                                {t("dashboard_setting")}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Tab 1: Student Profile Update Content */}
                    <TabsContent value="student-profile-update" className="mt-0 p-6">
                        <div className="space-y-6 max-w-4xl">
                            <div className="flex items-center gap-12 border-b border-gray-50 pb-6">
                                <label className="text-[13px] font-medium text-gray-700 w-48">{t("allow_editable_form_fields")}</label>
                                <div className="flex items-center gap-4">
                                    <Switch
                                        checked={allowEditable}
                                        onCheckedChange={setAllowEditable}
                                        disabled={loading || savingProfile}
                                        className="data-[state=checked]:bg-indigo-600 scale-90"
                                    />
                                    <Button
                                        onClick={handleSaveProfileEdit}
                                        disabled={loading || savingProfile}
                                        className="bg-gradient-to-r from-[#FF8C42] to-[#6D5BFE] hover:from-[#f97316] hover:to-[#5c4ae4] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg border-none"
                                    >
                                        {savingProfile && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                        {t("save")}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab 2: Dashboard Setting Content */}
                    <TabsContent value="dashboard-setting" className="mt-0 flex-1 flex flex-col">
                        {/* Toolbar */}
                        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50/50">
                            <div className="relative w-full md:w-56">
                                <Input
                                    placeholder={t("search")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-8 text-[12px] pl-3 border-gray-200 shadow-none rounded bg-white focus:bg-white transition-colors placeholder:text-gray-400"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Select defaultValue="50">
                                        <SelectTrigger className="h-7 w-14 text-[11px] border-gray-200 shadow-none rounded bg-white">
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

                                <Button
                                    onClick={handleSaveWidgets}
                                    disabled={loading || savingWidgets}
                                    className="bg-gradient-to-r from-[#FF8C42] to-[#6D5BFE] hover:from-[#f97316] hover:to-[#5c4ae4] text-white px-6 h-7 text-[10px] font-bold uppercase transition-all rounded-full shadow-md border-none"
                                >
                                    {savingWidgets && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                    {t("save")}
                                </Button>

                                <div className="flex items-center gap-1">
                                    <Button onClick={handleCopy} variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Copy className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={handleExportExcel} variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={handleExportPDF} variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><FileText className="h-3.5 w-3.5" /></Button>
                                    <Button onClick={handlePrint} variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Printer className="h-3.5 w-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Columns className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 p-4 bg-white overflow-auto">
                            {loading ? (
                                <TableSkeleton rows={8} columns={3} hasToolbar={false} />
                            ) : (
                            <>
                            <div className="border border-gray-100 rounded overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50/40">
                                        <TableRow className="border-b border-gray-100 hover:bg-transparent text-[11px]">
                                            <TableHead className="h-10 px-4 font-bold text-gray-600 text-[11px] w-full cursor-pointer hover:text-indigo-600 transition-colors group">
                                                <div className="flex items-center gap-1">{t("name")} <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" /></div>
                                            </TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600 text-[11px] text-center w-24">
                                                <div className="flex items-center justify-center gap-1">{t("student")} <ArrowUpDown className="h-3 w-3 opacity-30" /></div>
                                            </TableHead>
                                            <TableHead className="h-10 px-4 font-bold text-gray-600 text-[11px] text-center w-24">
                                                <div className="flex items-center justify-center gap-1">{t("parent")} <ArrowUpDown className="h-3 w-3 opacity-30" /></div>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredWidgets.map((widget) => (
                                            <TableRow key={widget.id} className="border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer h-11 group">
                                                <TableCell className="py-2 px-4 text-[12px] text-gray-600 font-medium">{widget.name}</TableCell>
                                                <TableCell className="py-2 px-4 text-center">
                                                    <div className="flex justify-center">
                                                        <Switch
                                                            checked={widget.student}
                                                            onCheckedChange={() => toggleDashboardWidget(widget.id, 'student')}
                                                            className="data-[state=checked]:bg-[#6366f1] scale-90 transition-all"
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2 px-4 text-center">
                                                    <div className="flex justify-center">
                                                        <Switch
                                                            checked={widget.parent}
                                                            onCheckedChange={() => toggleDashboardWidget(widget.id, 'parent')}
                                                            className="data-[state=checked]:bg-[#6366f1] scale-90 transition-all"
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredWidgets.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-24 text-center text-[12px] text-gray-400">
                                                    {t("no_records_found")}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between pt-4">
                                <p className="text-[10px] text-gray-500 font-medium">
                                    {t("showing")} 1 {t("to")} {filteredWidgets.length} {t("of")} {dashboardWidgets.length} {t("entries")}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7 text-gray-400 border-gray-100 hover:text-indigo-600 disabled:opacity-30 rounded-lg shadow-sm" disabled>
                                        <ChevronLeft className="h-3 w-3" />
                                    </Button>
                                    <Button className="h-8 w-8 p-0 text-[11px] font-bold bg-gradient-to-r from-[#FF8C42] to-[#6D5BFE] text-white border-none hover:opacity-90 transition-all rounded-lg shadow-md aspect-square">
                                        1
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-7 w-7 text-gray-400 border-gray-100 hover:text-indigo-600 disabled:opacity-30 rounded-lg shadow-sm" disabled>
                                        <ChevronRight className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            </>
                            )}
                        </div>
                    </TabsContent>

                </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
