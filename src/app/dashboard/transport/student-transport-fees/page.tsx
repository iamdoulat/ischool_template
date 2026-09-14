/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    Eye,
    SlidersHorizontal,
    Bus,
    BadgeDollarSign,
    Sparkles,
    X,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, toLocaleNumber, translateClassName } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface StudentTransport {
    id: number;
    admission_no: string;
    name: string;
    father_name: string;
    dob: string;
    school_class?: { name: string };
    schoolClass?: { name: string };
    section?: { name: string };
    transport_assignment?: any;
    transportAssignment?: {
        route?: { title: string; id: number };
        vehicle?: { vehicle_no: string; id: number };
        pickupPoint?: { name: string; id: number };
    };
    transportFees?: any[];
}

const TABLE_COLS = 9;

function SkeletonRows({ rows = 6, cols = TABLE_COLS }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-100 dark:border-gray-800">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3.5">
                            <div
                                className="h-3.5 rounded bg-gray-200/70 dark:bg-gray-700/70 animate-pulse"
                                style={{ width: `${50 + ((i * 3 + j * 7) % 40)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function StudentTransportFeesPage() {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const shortCode = language?.short_code || "en";
    const { symbol } = useCurrencyFormatter();

    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingInitial, setFetchingInitial] = useState(true);
    const [searched, setSearched] = useState(false);

    const [students, setStudents] = useState<StudentTransport[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [pickupPoints, setPickupPoints] = useState<any[]>([]);
    const [feeMasters, setFeeMasters] = useState<any[]>([]);
    const [routePickupPoints, setRoutePickupPoints] = useState<any[]>([]);

    const [filters, setFilters] = useState({ class_id: "", section_id: "" });

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isAssignFeesModalOpen, setIsAssignFeesModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentTransport | null>(null);
    const [assignmentForm, setAssignmentForm] = useState({ route_id: "", vehicle_id: "", pickup_point_id: "" });
    const [selectedFeeMasterIds, setSelectedFeeMasterIds] = useState<number[]>([]);
    const [monthlyFeeAmount, setMonthlyFeeAmount] = useState<number>(0);

    // Delete confirmation
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteStudentId, setDeleteStudentId] = useState<number | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const fetchInitialData = async () => {
        setFetchingInitial(true);
        try {
            const [classesRes, routesRes, vehiclesRes, pointsRes, feeMastersRes, rppRes] = await Promise.all([
                api.get("/academics/classes"),
                api.get("/transport/routes"),
                api.get("/transport/vehicles"),
                api.get("/transport/pickup-points"),
                api.get("/transport/fees-master"),
                api.get("/transport/route-pickup-points"),
            ]);
            setClasses(classesRes.data?.data?.data || classesRes.data?.data || []);
            setRoutes(routesRes.data?.data?.data || routesRes.data?.data || []);
            setVehicles(vehiclesRes.data?.data?.data || vehiclesRes.data?.data || []);
            setPickupPoints(pointsRes.data?.data?.data || pointsRes.data?.data || []);
            setFeeMasters(feeMastersRes.data?.data || []);
            setRoutePickupPoints(rppRes.data?.data || []);
        } catch (error) {
            tt.error("failed_to_load_initial_data");
        } finally {
            setFetchingInitial(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleClassChange = async (classId: string) => {
        setFilters({ ...filters, class_id: classId, section_id: "" });
        try {
            const res = await api.get(`/academics/sections?school_class_id=${classId}`);
            setSections(res.data?.data?.data || res.data?.data || []);
        } catch (error) {
            tt.error("failed_to_load_sections");
        }
    };

    const handleSearch = async () => {
        if (!filters.class_id) {
            tt.error("select_class");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get("/transport/student-assignments", { params: filters });
            let fetchedData = res.data?.data?.data || res.data?.data || res.data || [];
            if (!Array.isArray(fetchedData)) {
                if (typeof fetchedData === "object" && Array.isArray(fetchedData.data)) {
                    fetchedData = fetchedData.data;
                } else {
                    fetchedData = [];
                }
            }
            setStudents(fetchedData);
            setSearched(true);
            setCurrentPage(1);
        } catch (error) {
            tt.error("failed_to_load_students");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAssign = (student: StudentTransport) => {
        setSelectedStudent(student);
        const assignment = student.transportAssignment || student.transport_assignment;
        setAssignmentForm({
            route_id: assignment?.route?.id?.toString() || assignment?.route_id?.toString() || "",
            vehicle_id: assignment?.vehicle?.id?.toString() || assignment?.vehicle_id?.toString() || "",
            pickup_point_id:
                (assignment as any)?.pickupPoint?.id?.toString() ||
                assignment?.pickup_point_id?.toString() ||
                assignment?.pickup_point?.id?.toString() ||
                "",
        });
        setIsAssignModalOpen(true);
    };

    const handleAssign = async () => {
        if (!selectedStudent || !assignmentForm.route_id || !assignmentForm.vehicle_id || !assignmentForm.pickup_point_id) {
            tt.error("fill_required_fields");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                student_id: selectedStudent.id,
                ...assignmentForm,
            };
            const res = await api.post("/transport/student-assignments", payload);
            tt.success(res.data.message || "transport_assigned_successfully");
            setIsAssignModalOpen(false);
            handleSearch();
        } catch (error: any) {
            tt.error(error.response?.data?.message || "failed_to_assign_transport");
        } finally {
            setLoading(false);
        }
    };

    const confirmRemoveAssignment = (studentId: number) => {
        setDeleteStudentId(studentId);
        setIsDeleteDialogOpen(true);
    };

    const handleRemoveAssignment = async () => {
        if (!deleteStudentId) return;
        try {
            await api.delete(`/transport/student-assignments/${deleteStudentId}`);
            tt.success("transport_assignment_removed");
            handleSearch();
        } catch (error) {
            tt.error("failed_to_remove_assignment");
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteStudentId(null);
        }
    };

    const handleOpenAssignFeesModal = (student: StudentTransport) => {
        setSelectedStudent(student);
        const assignment = student.transportAssignment || student.transport_assignment;
        if (!assignment) return;

        const routeId = assignment.route_id || assignment.route?.id;
        const pickupPointId =
            assignment.pickup_point_id ||
            (assignment as any).pickupPoint?.id ||
            assignment.pickup_point?.id;

        const route = routePickupPoints.find((r: any) => r.id == routeId);
        const pickupPointsArray = route?.pickupPoints || route?.pickup_points || [];
        const pickupPoint = pickupPointsArray.find((p: any) => p.id == pickupPointId);

        const mapping =
            pickupPoint?.pivot ||
            pickupPointsArray.find((p: any) => p.pivot?.pickup_point_id == pickupPointId)?.pivot;

        setMonthlyFeeAmount(mapping ? parseFloat(mapping.monthly_fees || mapping.monthlyFees || 0) : 0);

        const existingFeeMasterIds = (student.transportFees || []).map((f) => f.transport_fee_master_id);

        if (existingFeeMasterIds.length > 0) {
            setSelectedFeeMasterIds(existingFeeMasterIds);
        } else {
            const currentMonthName = new Date().toLocaleString("default", { month: "long" });
            const currentFeeMaster = feeMasters.find((fm) => fm.month === currentMonthName);
            setSelectedFeeMasterIds(currentFeeMaster ? [currentFeeMaster.id] : []);
        }

        setIsAssignFeesModalOpen(true);
    };

    const submitAssignFees = async () => {
        if (!selectedStudent) return;
        if (selectedFeeMasterIds.length === 0) {
            tt.error("please_select_at_least_one_month");
            return;
        }
        setLoading(true);
        try {
            const res = await api.post(`/transport/student-assignments/${selectedStudent.id}/fees`, {
                fee_master_ids: selectedFeeMasterIds,
            });
            tt.success(res.data.message || "transport_fees_assigned_successfully");
            setIsAssignFeesModalOpen(false);
        } catch (error: any) {
            tt.error(error.response?.data?.message || "failed_to_assign_fees");
        } finally {
            setLoading(false);
        }
    };

    const handleFeeMasterToggle = (id: number) => {
        setSelectedFeeMasterIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const filteredStudents = students.filter(
        (s) =>
            (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.admission_no && s.admission_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (s.father_name && s.father_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

    const exportToExcel = () => {
        const dataToExport = filteredStudents.map((s, i) => {
            const assignment = s.transportAssignment || s.transport_assignment;
            return {
                SL: i + 1,
                "Admission No": s.admission_no,
                "Student Name": s.name,
                Class: `${(s.schoolClass || s.school_class)?.name || ""}(${s.section?.name || ""})`,
                "Father Name": s.father_name || "-",
                Route: assignment?.route?.title || "-",
                Vehicle: assignment?.vehicle?.vehicle_no || "-",
                "Pickup Point":
                    (assignment as any)?.pickupPoint?.name || assignment?.pickup_point?.name || "-",
            };
        });
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students Transport");
        XLSX.writeFile(wb, "student_transport_fees.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF("landscape");
        doc.text("Student Transport Fees Report", 14, 15);
        const tableData = filteredStudents.map((s, i) => {
            const assignment = s.transportAssignment || s.transport_assignment;
            return [
                i + 1,
                s.admission_no,
                s.name,
                `${(s.schoolClass || s.school_class)?.name || ""}(${s.section?.name || ""})`,
                s.father_name || "-",
                assignment?.route?.title || "-",
                assignment?.vehicle?.vehicle_no || "-",
                (assignment as any)?.pickupPoint?.name || assignment?.pickup_point?.name || "-",
            ];
        });
        autoTable(doc, {
            head: [["#", "Admission No", "Student Name", "Class", "Father Name", "Route", "Vehicle", "Pickup Point"]],
            body: tableData,
            startY: 20,
        });
        doc.save("student_transport_fees.pdf");
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(
            filteredStudents
                .map((s, i) => {
                    const assignment = s.transportAssignment || s.transport_assignment;
                    return `${i + 1}. ${s.admission_no}\t${s.name}\t${(s.schoolClass || s.school_class)?.name || "-"}\t${assignment?.route?.title || "-"}`;
                })
                .join("\n")
        );
        tt.success("data_copied_to_clipboard");
    };

    const toolbarActions = [
        { Icon: Copy, onClick: copyToClipboard, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: exportToExcel, title: t("excel") },
        { Icon: FileText, onClick: exportToPDF, title: t("pdf") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
    ];

    return (
        <div className="space-y-6 w-full pb-12 animate-in fade-in duration-500">
            {/* Criteria Filter Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <SlidersHorizontal className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                            {t("select_criteria")}
                        </CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("filter_students_by_class_and_section")}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="p-5">
                    {fetchingInitial ? (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-5 h-9 rounded-lg bg-gray-200/70 animate-pulse" />
                            <div className="md:col-span-5 h-9 rounded-lg bg-gray-200/70 animate-pulse" />
                            <div className="md:col-span-2 h-9 rounded-lg bg-gray-200/70 animate-pulse" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            {/* Class Selector */}
                            <div className="md:col-span-5 space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                    <span>{t("class")}</span>
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Select onValueChange={handleClassChange} value={filters.class_id}>
                                    <SelectTrigger className="h-9 text-xs border-gray-200 dark:border-gray-700 rounded-lg">
                                        <SelectValue placeholder={t("select_class")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((c) => (
                                            <SelectItem key={c.id} value={c.id.toString()} className="text-xs">
                                                {translateClassName(c.name, shortCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Section Selector */}
                            <div className="md:col-span-5 space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {t("section")}
                                </Label>
                                <Select
                                    onValueChange={(val) => setFilters({ ...filters, section_id: val })}
                                    value={filters.section_id}
                                >
                                    <SelectTrigger className="h-9 text-xs border-gray-200 dark:border-gray-700 rounded-lg">
                                        <SelectValue placeholder={t("select_section")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sections.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()} className="text-xs">
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Search Button (Inline) */}
                            <div className="md:col-span-2">
                                <Button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="w-full h-9 px-6 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                                >
                                    <Search className="h-4 w-4" />
                                    <span>{loading ? t("searching") : t("search")}</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* List Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Bus className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                    {t("student_transport_fees")}
                                </CardTitle>
                                <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-500" />
                                    {toLocaleNumber(filteredStudents.length, shortCode)} {filteredStudents.length === 1 ? t("student") : t("students")}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                    {/* Search & Tool Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                            <Input
                                placeholder={t("search")}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-9 pl-8 pr-8 text-xs rounded-lg border-gray-200 dark:border-gray-700 bg-background focus-visible:ring-indigo-500 shadow-none"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2">
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(val) => {
                                    setItemsPerPage(parseInt(val));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[75px] h-9 text-xs border-gray-200 dark:border-gray-700 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10" className="text-xs font-bold">{toLocaleNumber("10", shortCode)}</SelectItem>
                                    <SelectItem value="25" className="text-xs font-bold">{toLocaleNumber("25", shortCode)}</SelectItem>
                                    <SelectItem value="50" className="text-xs font-bold">{toLocaleNumber("50", shortCode)}</SelectItem>
                                    <SelectItem value="100" className="text-xs font-bold">{toLocaleNumber("100", shortCode)}</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg p-0.5 bg-gray-50 dark:bg-gray-800/50">
                                {toolbarActions.map((action, i) => (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        onClick={action.onClick}
                                        title={action.title}
                                        className="h-7 w-7 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
                                    >
                                        <action.Icon className="h-3.5 w-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1300px]">
                            <TableHeader className="bg-gray-50 dark:bg-gray-800/60 text-xs">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("admission_no")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("student_name")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("class")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("father_name")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("date_of_birth")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("route_title")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("vehicle_number")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("pickup_point")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 text-right py-3 px-4 w-32">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <SkeletonRows rows={6} cols={TABLE_COLS} />
                                ) : paginatedStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={TABLE_COLS} className="px-4 py-16 text-center text-xs font-bold uppercase tracking-wider text-gray-400">
                                            {searched ? t("no_students_found") : t("select_class_and_search")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedStudents.map((s) => (
                                        <TableRow
                                            key={s.id}
                                            className="text-xs hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer whitespace-nowrap"
                                        >
                                            <TableCell className="py-3.5 px-4 text-gray-700 dark:text-gray-200 font-mono font-medium">
                                                {s.admission_no}
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4">
                                                <span className="text-[#6366f1] font-bold">{s.name}</span>
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                                                {`${translateClassName((s.schoolClass || s.school_class)?.name, shortCode) || ""}${s.section?.name ? ` (${s.section.name})` : ""}`}
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                                                {s.father_name || "—"}
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 text-gray-600 dark:text-gray-300 font-mono">
                                                {s.dob ? formatDate(s.dob) : "—"}
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                                                {(s.transportAssignment || s.transport_assignment)?.route?.title || "—"}
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 text-gray-600 dark:text-gray-300 font-mono">
                                                {(s.transportAssignment || s.transport_assignment)?.vehicle?.vehicle_no || "—"}
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                                                {((s.transportAssignment || s.transport_assignment) as any)?.pickupPoint?.name ||
                                                    (s.transportAssignment || s.transport_assignment)?.pickup_point?.name ||
                                                    "—"}
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        title={t("view")}
                                                        onClick={() => {
                                                            setSelectedStudent(s);
                                                            setIsViewModalOpen(true);
                                                        }}
                                                        size="sm"
                                                        className="h-7 w-7 bg-blue-500 hover:bg-blue-600 text-white rounded p-0 shadow-xs active:scale-95 transition-all"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        title={t("edit")}
                                                        onClick={() => handleOpenAssign(s)}
                                                        size="sm"
                                                        className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-xs active:scale-95 transition-all"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {(s.transportAssignment || s.transport_assignment) && (
                                                        <>
                                                            <Button
                                                                title={t("assign_fees")}
                                                                onClick={() => handleOpenAssignFeesModal(s)}
                                                                size="sm"
                                                                className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded p-0 shadow-xs active:scale-95 transition-all"
                                                            >
                                                                <BadgeDollarSign className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                title={t("delete")}
                                                                onClick={() => confirmRemoveAssignment(s.id)}
                                                                size="sm"
                                                                className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-xs active:scale-95 transition-all"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-1">
                        <div>
                            {t("showing_x_to_y_of_z", {
                                from: toLocaleNumber(filteredStudents.length === 0 ? 0 : startIndex + 1, shortCode),
                                to: toLocaleNumber(Math.min(startIndex + itemsPerPage, filteredStudents.length), shortCode),
                                total: toLocaleNumber(filteredStudents.length, shortCode),
                            })}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="h-8 w-8 p-0 rounded-lg bg-background border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 w-8 p-0 rounded-lg text-xs font-bold transition-all",
                                        currentPage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-xs"
                                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                                    )}
                                >
                                    {toLocaleNumber(page, shortCode)}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="h-8 w-8 p-0 rounded-lg bg-background border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Assign Transport Modal */}
            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-card">
                    <DialogHeader className="p-6 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white">
                        <DialogTitle className="text-white text-lg font-bold tracking-tight">
                            {t("assign_transport")}: {selectedStudent?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                                <span>{t("route")}</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={assignmentForm.route_id}
                                onValueChange={(val) => setAssignmentForm({ ...assignmentForm, route_id: val })}
                            >
                                <SelectTrigger className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-medium">
                                    <SelectValue placeholder={t("select_route")} />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] rounded-xl">
                                    {routes.map((r) => (
                                        <SelectItem key={r.id} value={r.id.toString()} className="text-xs">
                                            {r.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                                <span>{t("vehicle")}</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={assignmentForm.vehicle_id}
                                onValueChange={(val) => setAssignmentForm({ ...assignmentForm, vehicle_id: val })}
                            >
                                <SelectTrigger className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-medium">
                                    <SelectValue placeholder={t("select_vehicle")} />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] rounded-xl">
                                    {vehicles.map((v) => (
                                        <SelectItem key={v.id} value={v.id.toString()} className="text-xs">
                                            {v.vehicle_no}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                                <span>{t("pickup_point")}</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={assignmentForm.pickup_point_id}
                                onValueChange={(val) => setAssignmentForm({ ...assignmentForm, pickup_point_id: val })}
                            >
                                <SelectTrigger className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-medium">
                                    <SelectValue placeholder={t("select_point")} />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] rounded-xl">
                                    {pickupPoints.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()} className="text-xs">
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="p-4 sm:p-6 bg-muted/30 border-t border-border flex flex-col sm:flex-row sm:justify-end gap-2.5">
                        <Button
                            variant="outline"
                            onClick={() => setIsAssignModalOpen(false)}
                            className="h-10 px-6 rounded-xl border-border text-xs font-bold"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            disabled={loading}
                            onClick={handleAssign}
                            className="h-10 px-8 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#4f46e5] text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                            <span>{loading ? t("saving") : t("save_assignment")}</span>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Details Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-card">
                    <DialogHeader className="p-6 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white">
                        <DialogTitle className="text-white text-lg font-bold tracking-tight">
                            {t("view_transport")}: {selectedStudent?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-3 text-xs">
                        <div className="flex justify-between border-b border-border/50 pb-2">
                            <span className="font-bold text-muted-foreground">{t("admission_no")}</span>
                            <span className="font-mono font-medium text-foreground">{selectedStudent?.admission_no}</span>
                        </div>
                        <div className="flex justify-between border-b border-border/50 pb-2">
                            <span className="font-bold text-muted-foreground">{t("student_name")}</span>
                            <span className="font-bold text-indigo-600">{selectedStudent?.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-border/50 pb-2">
                            <span className="font-bold text-muted-foreground">{t("class")}</span>
                            <span className="font-medium text-foreground">
                                {translateClassName((selectedStudent?.schoolClass || selectedStudent?.school_class)?.name, shortCode)}
                                {selectedStudent?.section?.name ? ` (${selectedStudent.section.name})` : ""}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-border/50 pb-2">
                            <span className="font-bold text-muted-foreground">{t("route")}</span>
                            <span className="font-bold text-indigo-600">
                                {(selectedStudent?.transportAssignment || selectedStudent?.transport_assignment)?.route?.title || "—"}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-border/50 pb-2">
                            <span className="font-bold text-muted-foreground">{t("vehicle")}</span>
                            <span className="font-mono font-medium text-foreground">
                                {(selectedStudent?.transportAssignment || selectedStudent?.transport_assignment)?.vehicle?.vehicle_no || "—"}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-border/50 pb-2">
                            <span className="font-bold text-muted-foreground">{t("pickup_point")}</span>
                            <span className="font-medium text-foreground">
                                {((selectedStudent?.transportAssignment || selectedStudent?.transport_assignment) as any)?.pickupPoint?.name ||
                                    (selectedStudent?.transportAssignment || selectedStudent?.transport_assignment)?.pickup_point?.name ||
                                    "—"}
                            </span>
                        </div>
                    </div>
                    <DialogFooter className="p-4 sm:p-6 bg-muted/30 border-t border-border flex justify-end">
                        <Button
                            onClick={() => setIsViewModalOpen(false)}
                            className="h-10 px-8 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#4f46e5] text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                            {t("close")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Fees Modal */}
            <Dialog open={isAssignFeesModalOpen} onOpenChange={setIsAssignFeesModalOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-card">
                    <DialogHeader className="p-6 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white">
                        <DialogTitle className="text-white text-lg font-bold tracking-tight">
                            {t("assign_fees")}: {selectedStudent?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center bg-muted/40 p-3.5 rounded-2xl border border-border">
                            <span className="font-bold text-muted-foreground text-xs">{t("pickup_point_fee")}:</span>
                            <span className="font-bold text-indigo-600 font-mono text-base">
                                {symbol}
                                {toLocaleNumber(monthlyFeeAmount.toFixed(2), shortCode)}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-foreground block">{t("select_months")}</Label>
                            <div className="grid grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto custom-scrollbar p-1">
                                {feeMasters.map((fm) => (
                                    <div
                                        key={fm.id}
                                        onClick={() => handleFeeMasterToggle(fm.id)}
                                        className="flex items-center space-x-2.5 border border-border/80 p-2.5 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                                    >
                                        <Checkbox
                                            id={`fm-${fm.id}`}
                                            checked={selectedFeeMasterIds.includes(fm.id)}
                                            onCheckedChange={() => handleFeeMasterToggle(fm.id)}
                                            className="h-4 w-4 border-gray-300 accent-indigo-500 rounded"
                                        />
                                        <Label
                                            htmlFor={`fm-${fm.id}`}
                                            className="text-xs cursor-pointer font-medium text-foreground flex-1"
                                        >
                                            {fm.month}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {feeMasters.length === 0 && (
                                <div className="text-center py-4 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900">
                                    {t("no_transport_fee_masters_found")}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="p-4 sm:p-6 bg-muted/30 border-t border-border flex flex-col sm:flex-row sm:justify-end gap-2.5">
                        <Button
                            variant="outline"
                            onClick={() => setIsAssignFeesModalOpen(false)}
                            className="h-10 px-6 rounded-xl border-border text-xs font-bold"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            disabled={loading || feeMasters.length === 0}
                            onClick={submitAssignFees}
                            className="h-10 px-8 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#4f46e5] text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                            <span>{loading ? t("saving") : t("assign_fees")}</span>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-3xl border-border bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-black tracking-tight text-foreground">
                            {t("delete")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
                            {t("remove_transport_confirmation")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-border text-xs font-bold">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveAssignment}
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                        >
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
