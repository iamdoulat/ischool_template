"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/components/providers/language-provider";
import { exportData } from "@/lib/export-utils";
import { cn, toLocaleNumber } from "@/lib/utils";
import {
    Loader2,
    UserCog,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
} from "lucide-react";
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

interface Widget {
    id: number;
    name: string;
    student: boolean;
    parent: boolean;
}

export default function StudentProfileSettingPage() {
    const { t } = useTranslation();
    const { language } = useLanguage();

    const [activeTab, setActiveTab] = useState<"student-profile-update" | "dashboard-setting">("student-profile-update");
    const [dashboardWidgets, setDashboardWidgets] = useState<Widget[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [allowEditable, setAllowEditable] = useState(false);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingWidgets, setSavingWidgets] = useState(false);
    const [pageSize, setPageSize] = useState<number>(50);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/system-setting/student-profile-setting");
            if (response.data.status === "Success") {
                setDashboardWidgets(response.data.data.widgets || []);
                setAllowEditable(Boolean(response.data.data.is_student_profile_edit));
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
            toast.error(t("failed_to_load"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSaveProfileEdit = async () => {
        try {
            setSavingProfile(true);
            const response = await api.post("/system-setting/student-profile-setting/update-profile-edit", {
                is_student_profile_edit: allowEditable,
            });
            if (response.data.status === "Success") {
                toast.success(t("profile_edit_setting_updated"));
            } else {
                toast.error(t("failed_to_save"));
            }
        } catch (error) {
            console.error("Failed to save profile setting", error);
            toast.error(t("failed_to_save"));
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSaveWidgets = async () => {
        try {
            setSavingWidgets(true);
            const response = await api.post("/system-setting/student-profile-setting/update-widgets", {
                widgets: dashboardWidgets,
            });
            if (response.data.status === "Success") {
                toast.success(t("dashboard_widgets_updated"));
            } else {
                toast.error(t("failed_to_save"));
            }
        } catch (error) {
            console.error("Failed to save dashboard settings", error);
            toast.error(t("failed_to_save"));
        } finally {
            setSavingWidgets(false);
        }
    };

    const toggleDashboardWidget = (id: number, type: "student" | "parent") => {
        setDashboardWidgets((prev) =>
            prev.map((widget) =>
                widget.id === id ? { ...widget, [type]: !widget[type] } : widget
            )
        );
    };

    const translateWidgetName = useCallback(
        (name: string): string => {
            const normalized = name.toLowerCase().trim().replace(/[\s-]+/g, "_");
            const keyMap: Record<string, string> = {
                welcome_student: "welcome_student",
                notice_board: "notice_board",
                subject_progress: "subject_progress",
                upcoming_class: "upcoming_class",
                homework: "homework",
                daily_assignment: "daily_assignment",
                teacher_list: "teacher_list",
                visitor_list: "visitor_list",
                library: "library",
            };
            const key = keyMap[normalized] || normalized;
            const translated = t(key);
            return translated !== key ? translated : name;
        },
        [t]
    );

    const filteredWidgets = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return dashboardWidgets;
        return dashboardWidgets.filter((w) => {
            const localized = translateWidgetName(w.name).toLowerCase();
            const original = w.name.toLowerCase();
            return localized.includes(query) || original.includes(query);
        });
    }, [dashboardWidgets, searchTerm, translateWidgetName]);

    const totalPages = Math.max(1, Math.ceil(filteredWidgets.length / pageSize));
    const paginatedWidgets = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredWidgets.slice(start, start + pageSize);
    }, [filteredWidgets, currentPage, pageSize]);

    const handleExport = (type: "copy" | "csv" | "excel" | "pdf" | "print") => {
        exportData(type, {
            filename: `dashboard_settings_${new Date().toISOString().split("T")[0]}`,
            title: t("dashboard_setting"),
            columns: [t("widget_name"), t("student"), t("parent")],
            rows: filteredWidgets.map((w) => [
                translateWidgetName(w.name),
                w.student ? t("yes") : t("no"),
                w.parent ? t("yes") : t("no"),
            ]),
        });
    };

    return (
        <div className="p-4 space-y-5 bg-gray-50/10 min-h-screen font-sans">
            {/* Page Header Banner (Mandatory Rule: Edge-to-edge gradient div, NEVER inside Card) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <UserCog className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("student_profile_setting")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("configure_student_profile_fields_and_dashboard_widgets")}
                        </p>
                    </div>
                </div>

                {/* Scope / Feature Tabs (High contrast segmented toggle) */}
                <div className="flex items-center p-1 rounded-xl bg-white/95 border border-gray-200/80 shadow-xs gap-1">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("student-profile-update");
                        }}
                        className={cn(
                            "h-8 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer select-none",
                            activeTab === "student-profile-update"
                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/80"
                        )}
                    >
                        {t("student_profile_update")}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("dashboard-setting");
                            setCurrentPage(1);
                        }}
                        className={cn(
                            "h-8 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer select-none",
                            activeTab === "dashboard-setting"
                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/80"
                        )}
                    >
                        {t("dashboard_setting")}
                    </button>
                </div>
            </div>

            {/* Tab 1: Student Profile Update */}
            {activeTab === "student-profile-update" && (
                <Card className="rounded-lg shadow-sm border border-gray-100 overflow-hidden bg-white">
                    <CardContent className="p-6">
                        <div className="max-w-3xl space-y-6">
                            <div className="p-5 rounded-xl border border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-[#6366f1]" />
                                        {t("allow_editable_form_fields")}
                                    </div>
                                    <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
                                        {t("allow_editable_form_fields_desc")}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Switch
                                        checked={allowEditable}
                                        onCheckedChange={setAllowEditable}
                                        disabled={loading || savingProfile}
                                        className="data-[state=checked]:bg-[#6366f1]"
                                        aria-label={t("allow_editable_form_fields")}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-start">
                                <Button
                                    onClick={handleSaveProfileEdit}
                                    disabled={loading || savingProfile}
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white font-bold h-9 px-7 text-xs rounded-lg shadow-xs active:scale-95 transition-all border-none"
                                >
                                    {savingProfile && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                                    {t("save")}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tab 2: Dashboard Widgets Setting */}
            {activeTab === "dashboard-setting" && (
                <Card className="rounded-lg shadow-sm border border-gray-100 overflow-hidden bg-white">
                    {/* Toolbar */}
                    <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-gray-100">
                        <div className="relative w-full sm:w-64">
                            <Input
                                placeholder={t("search_dashboard_widgets")}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-8 text-xs pl-3 border-gray-200 shadow-none rounded-lg bg-white placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-indigo-400"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center gap-2">
                                <Select
                                    value={String(pageSize)}
                                    onValueChange={(val) => {
                                        setPageSize(Number(val));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-16 text-xs border-gray-200 shadow-none rounded-lg bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">{toLocaleNumber(10, language?.short_code)}</SelectItem>
                                        <SelectItem value="25">{toLocaleNumber(25, language?.short_code)}</SelectItem>
                                        <SelectItem value="50">{toLocaleNumber(50, language?.short_code)}</SelectItem>
                                        <SelectItem value="100">{toLocaleNumber(100, language?.short_code)}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={handleSaveWidgets}
                                disabled={loading || savingWidgets}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white font-bold h-8 px-5 text-xs rounded-lg shadow-xs active:scale-95 transition-all border-none"
                            >
                                {savingWidgets && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                                {t("save")}
                            </Button>

                            <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                                <Button
                                    onClick={() => handleExport("copy")}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 rounded-lg transition-all"
                                    title={t("copy")}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    onClick={() => handleExport("excel")}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 rounded-lg transition-all"
                                    title={t("excel")}
                                >
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    onClick={() => handleExport("pdf")}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 rounded-lg transition-all"
                                    title={t("pdf")}
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    onClick={() => handleExport("print")}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 rounded-lg transition-all"
                                    title={t("print")}
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-4">
                                <TableSkeleton rows={8} columns={3} hasToolbar={false} />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                        <TableHead className="h-10 px-4 font-bold text-gray-700 text-xs w-full">
                                            <div className="flex items-center gap-1.5">
                                                {t("widget_name")}
                                                <ArrowUpDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="h-10 px-4 font-bold text-gray-700 text-xs text-center w-28">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {t("student")}
                                                <ArrowUpDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="h-10 px-4 font-bold text-gray-700 text-xs text-center w-28">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {t("parent")}
                                                <ArrowUpDown className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedWidgets.map((widget) => (
                                        <TableRow
                                            key={widget.id}
                                            className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors h-11"
                                        >
                                            <TableCell className="py-2.5 px-4 text-xs text-gray-700 font-medium">
                                                {translateWidgetName(widget.name)}
                                            </TableCell>
                                            <TableCell className="py-2.5 px-4 text-center">
                                                <div className="flex justify-center">
                                                    <Switch
                                                        checked={widget.student}
                                                        onCheckedChange={() => toggleDashboardWidget(widget.id, "student")}
                                                        className="data-[state=checked]:bg-[#6366f1] scale-90 transition-all"
                                                        aria-label={`${translateWidgetName(widget.name)} - ${t("student")}`}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2.5 px-4 text-center">
                                                <div className="flex justify-center">
                                                    <Switch
                                                        checked={widget.parent}
                                                        onCheckedChange={() => toggleDashboardWidget(widget.id, "parent")}
                                                        className="data-[state=checked]:bg-[#6366f1] scale-90 transition-all"
                                                        aria-label={`${translateWidgetName(widget.name)} - ${t("parent")}`}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredWidgets.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-28 text-center text-xs text-gray-400">
                                                {t("no_records_found")}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && filteredWidgets.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 text-xs text-gray-500">
                            <div>
                                {t("showing")}{" "}
                                <span className="font-semibold text-gray-700">
                                    {toLocaleNumber(
                                        filteredWidgets.length > 0 ? (currentPage - 1) * pageSize + 1 : 0,
                                        language?.short_code
                                    )}
                                </span>{" "}
                                {t("to")}{" "}
                                <span className="font-semibold text-gray-700">
                                    {toLocaleNumber(
                                        Math.min(currentPage * pageSize, filteredWidgets.length),
                                        language?.short_code
                                    )}
                                </span>{" "}
                                {t("of")}{" "}
                                <span className="font-semibold text-gray-700">
                                    {toLocaleNumber(dashboardWidgets.length, language?.short_code)}
                                </span>{" "}
                                {t("entries")}
                            </div>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-gray-500 border-gray-200 hover:text-indigo-600 disabled:opacity-30 rounded-lg shadow-2xs"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 p-0 text-xs font-bold rounded-lg transition-all aspect-square border-none",
                                            currentPage === page
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-2xs"
                                        )}
                                    >
                                        {toLocaleNumber(page, language?.short_code)}
                                    </Button>
                                ))}

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-gray-500 border-gray-200 hover:text-indigo-600 disabled:opacity-30 rounded-lg shadow-2xs"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
