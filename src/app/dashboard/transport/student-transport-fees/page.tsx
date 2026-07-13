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
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    Eye,
    SlidersHorizontal,
    Bus,
    BadgeDollarSign,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export default function StudentTransportFeesPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
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
    const [isAssignFeesModalOpen, setIsAssignFeesModalOpen] = useState(false);
    const [selectedFeeMasterIds, setSelectedFeeMasterIds] = useState<number[]>([]);
    const [monthlyFeeAmount, setMonthlyFeeAmount] = useState<number>(0);

    const [filters, setFilters] = useState({ class_id: "", section_id: "" });

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentTransport | null>(null);
    const [assignmentForm, setAssignmentForm] = useState({ route_id: "", vehicle_id: "", pickup_point_id: "" });

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
            setClasses(classesRes.data.data.data || classesRes.data.data || []);
            setRoutes(routesRes.data.data.data || routesRes.data.data || []);
            setVehicles(vehiclesRes.data.data.data || vehiclesRes.data.data || []);
            setPickupPoints(pointsRes.data.data.data || pointsRes.data.data || []);
            setFeeMasters(feeMastersRes.data.data || []);
            setRoutePickupPoints(rppRes.data.data || []);
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
            setSections(res.data.data.data || res.data.data || []);
        } catch (error) {
            tt.error("failed_to_load_sections");
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await api.get("/transport/student-assignments", { params: filters });
            setStudents(res.data.data || []);
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
            pickup_point_id: (assignment as any)?.pickupPoint?.id?.toString() || assignment?.pickup_point_id?.toString() || assignment?.pickup_point?.id?.toString() || "",
        });
        setIsAssignModalOpen(true);
    };

    const handleAssign = async () => {
        if (!selectedStudent || !assignmentForm.route_id || !assignmentForm.vehicle_id || !assignmentForm.pickup_point_id) {
            toast("error", t("please_fill_all_required_fields"));
            return;
        }
        setLoading(true);
        try {
            const payload = {
                student_id: selectedStudent.id,
                ...assignmentForm
            };
            const res = await api.post("/transport/student-assignments", payload);
            tt.success(res.data.message || "transport_assigned_successfully");
            setIsAssignModalOpen(false);
            handleSearch();
        } catch (error: any) {
            toast("error", error.response?.data?.message || t("failed_to_assign_transport"));
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAssignment = async (studentId: number) => {
        if (!confirm(t("remove_transport_confirmation"))) return;
        try {
            await api.delete(`/transport/student-assignments/${studentId}`);
            tt.success("transport_assignment_removed");
            handleSearch();
        } catch (error) {
            tt.error("failed_to_remove_assignment");
        }
    };

    const handleOpenAssignFeesModal = (student: StudentTransport) => {
        setSelectedStudent(student);
        const assignment = student.transportAssignment || student.transport_assignment;
        if (!assignment) return;
        
        const routeId = assignment.route_id || assignment.route?.id;
        const pickupPointId = assignment.pickup_point_id || (assignment as any).pickupPoint?.id || assignment.pickup_point?.id;
        
        const route = routePickupPoints.find((r: any) => r.id == routeId);
        const pickupPointsArray = route?.pickupPoints || route?.pickup_points || [];
        const pickupPoint = pickupPointsArray.find((p: any) => p.id == pickupPointId);
        
        const mapping = pickupPoint?.pivot || pickupPointsArray.find((p: any) => p.pivot?.pickup_point_id == pickupPointId)?.pivot;
        
        setMonthlyFeeAmount(mapping ? parseFloat(mapping.monthly_fees || mapping.monthlyFees || 0) : 0);

        const existingFeeMasterIds = (student.transportFees || []).map(f => f.transport_fee_master_id);
        
        if (existingFeeMasterIds.length > 0) {
            setSelectedFeeMasterIds(existingFeeMasterIds);
        } else {
            const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
            const currentFeeMaster = feeMasters.find(fm => fm.month === currentMonthName);
            setSelectedFeeMasterIds(currentFeeMaster ? [currentFeeMaster.id] : []);
        }
        
        setIsAssignFeesModalOpen(true);
    };

    const submitAssignFees = async () => {
        if (!selectedStudent) return;
        if (selectedFeeMasterIds.length === 0) {
            toast("error", t("please_select_at_least_one_month") || "Please select at least one month");
            return;
        }
        setLoading(true);
        try {
            const res = await api.post(`/transport/student-assignments/${selectedStudent.id}/fees`, {
                fee_master_ids: selectedFeeMasterIds
            });
            tt.success(res.data.message || "transport_fees_assigned_successfully");
            setIsAssignFeesModalOpen(false);
        } catch (error: any) {
            toast("error", error.response?.data?.message || t("failed_to_assign_fees"));
        } finally {
            setLoading(false);
        }
    };

    const handleFeeMasterToggle = (id: number) => {
        setSelectedFeeMasterIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const filteredStudents = students.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.admission_no.includes(searchTerm)
    );
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

    const exportToExcel = () => {
        const dataToExport = filteredStudents.map(s => {
            const assignment = s.transportAssignment || s.transport_assignment;
            return {
                'Admission No': s.admission_no, 'Student Name': s.name, 'Class': `${(s.schoolClass || s.school_class)?.name || ''}(${s.section?.name || ''})`,
                'Father Name': s.father_name, 'Route': assignment?.route?.title || '-',
                'Vehicle': assignment?.vehicle?.vehicle_no || '-', 'Pickup Point': (assignment as any)?.pickupPoint?.name || assignment?.pickup_point?.name || '-'
            };
        });
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students Transport");
        XLSX.writeFile(wb, "student_transport_fees.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF('l');
        doc.text("Student Transport Fees Report", 14, 15);
        const tableData = filteredStudents.map(s => {
            const assignment = s.transportAssignment || s.transport_assignment;
            return [s.admission_no, s.name, `${(s.schoolClass || s.school_class)?.name || ''}(${s.section?.name || ''})`, s.father_name, assignment?.route?.title || '-', assignment?.vehicle?.vehicle_no || '-', (assignment as any)?.pickupPoint?.name || assignment?.pickup_point?.name || '-'];
        });
        autoTable(doc, { head: [['Admission No', 'Student Name', 'Class', 'Father Name', 'Route', 'Vehicle', 'Pickup Point']], body: tableData, startY: 20 });
        doc.save("student_transport_fees.pdf");
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(filteredStudents.map(s => {
            const assignment = s.transportAssignment || s.transport_assignment;
            return `${s.admission_no}\t${s.name}\t${(s.schoolClass || s.school_class)?.name || '-'}\t${assignment?.route?.title || '-'}`;
        }).join('\n'));
        tt.success("data_copied_to_clipboard");
    };

    const toolbarActions = [
        { Icon: Copy, onClick: copyToClipboard, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: exportToExcel, title: t("excel") },
        { Icon: FileText, onClick: exportToPDF, title: t("pdf") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
        { Icon: Columns, onClick: () => {}, title: t("columns") },
    ];

    return (
        <div className="space-y-6">
            {/* Criteria Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <SlidersHorizontal className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("filter_students_by_class_and_section")}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fetchingInitial ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="h-9 rounded bg-gray-200/70 animate-pulse" />
                            <div className="h-9 rounded bg-gray-200/70 animate-pulse" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-600">{t("class")} <span className="text-red-500">*</span></Label>
                                    <Select onValueChange={handleClassChange} value={filters.class_id}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select_class")} /></SelectTrigger>
                                        <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-600">{t("section")}</Label>
                                    <Select onValueChange={(val) => setFilters({ ...filters, section_id: val })} value={filters.section_id}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("select_section")} /></SelectTrigger>
                                        <SelectContent>{sections.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button onClick={handleSearch} disabled={loading} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                                    <Search className="h-4 w-4" /> {loading ? t("searching") : t("search")}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* List Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Bus className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_transport_fees")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{filteredStudents.length} {filteredStudents.length === 1 ? t("student").toLowerCase() : t("students").toLowerCase()}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <Input placeholder={t("search")} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="h-9 text-xs w-full md:w-64" />
                        <div className="flex items-center gap-2">
                            <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(parseInt(val)); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[70px] h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                {toolbarActions.map((action, i) => (
                                    <Button key={i} variant="ghost" size="icon" onClick={action.onClick} title={action.title} className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <action.Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1400px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600">{t("admission_no")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("student_name")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("class")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("father_name")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("date_of_birth")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("route_title")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("vehicle_number")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("pickup_point")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows rows={6} cols={TABLE_COLS} />
                                ) : paginatedStudents.length === 0 ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{searched ? t("no_students_found") : t("select_class_and_search")}</TableCell></TableRow>
                                ) : paginatedStudents.map((s) => (
                                    <TableRow key={s.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                        <TableCell className="py-3 text-gray-700 font-medium">{s.admission_no}</TableCell>
                                        <TableCell className="py-3"><span className="text-[#6366f1] font-medium">{s.name}</span></TableCell>
                                        <TableCell className="py-3 text-gray-500">{`${(s.schoolClass || s.school_class)?.name || ''}(${s.section?.name || ''})`}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{s.father_name || "—"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{formatDate(s.dob) || "—"}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{(s.transportAssignment || s.transport_assignment)?.route?.title || '-'}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{(s.transportAssignment || s.transport_assignment)?.vehicle?.vehicle_no || '-'}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{((s.transportAssignment || s.transport_assignment) as any)?.pickupPoint?.name || (s.transportAssignment || s.transport_assignment)?.pickup_point?.name || '-'}</TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button title={t("view")} onClick={() => { setSelectedStudent(s); setIsViewModalOpen(true); }} size="sm" className="h-7 w-7 bg-blue-500 hover:bg-blue-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Eye className="h-4 w-4" /></Button>
                                                <Button title={t("edit")} onClick={() => handleOpenAssign(s)} size="sm" className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Pencil className="h-4 w-4" /></Button>
                                                {(s.transportAssignment || s.transport_assignment) && (
                                                    <>
                                                        <Button title={t("assign_fees") || "Assign Fees"} onClick={() => handleOpenAssignFeesModal(s)} size="sm" className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><BadgeDollarSign className="h-4 w-4" /></Button>
                                                        <Button title={t("delete")} onClick={() => handleRemoveAssignment(s.id)} size="sm" className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Trash2 className="h-4 w-4" /></Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                        <div>{t("showing_x_to_y_of_z", { from: filteredStudents.length === 0 ? 0 : startIndex + 1, to: Math.min(startIndex + itemsPerPage, filteredStudents.length), total: filteredStudents.length })}</div>
                        <div className="flex gap-1 items-center">
                            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button key={page} size="sm" onClick={() => setCurrentPage(page)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all", currentPage === page ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200")}>{page}</Button>
                            ))}
                            <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Assign Modal */}
            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t("assign_transport")}: {selectedStudent?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>{t("route")} <span className="text-red-500">*</span></Label>
                            <Select value={assignmentForm.route_id} onValueChange={(val) => setAssignmentForm({ ...assignmentForm, route_id: val })}>
                                <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder={t("select_route")} /></SelectTrigger>
                                <SelectContent>{routes.map((r) => <SelectItem key={r.id} value={r.id.toString()}>{r.title}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>{t("vehicle")} <span className="text-red-500">*</span></Label>
                            <Select value={assignmentForm.vehicle_id} onValueChange={(val) => setAssignmentForm({ ...assignmentForm, vehicle_id: val })}>
                                <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder={t("select_vehicle")} /></SelectTrigger>
                                <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id.toString()}>{v.vehicle_no}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>{t("pickup_point")} <span className="text-red-500">*</span></Label>
                            <Select value={assignmentForm.pickup_point_id} onValueChange={(val) => setAssignmentForm({ ...assignmentForm, pickup_point_id: val })}>
                                <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder={t("select_point")} /></SelectTrigger>
                                <SelectContent>{pickupPoints.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignModalOpen(false)} className="h-9 text-[11px] rounded-full px-6">{t("cancel")}</Button>
                        <Button disabled={loading} onClick={handleAssign} className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[11px] font-bold uppercase shadow-lg active:scale-95 transition-all min-w-[120px]">{loading ? t("saving") : t("save_assignment")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t("view_transport")}: {selectedStudent?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-4 text-[12px]">
                        <div className="flex justify-between border-b border-gray-50 pb-2"><span className="font-bold text-gray-400 uppercase tracking-tight">{t("admission_no")}</span><span className="text-gray-700 font-medium">{selectedStudent?.admission_no}</span></div>
                        <div className="flex justify-between border-b border-gray-50 pb-2"><span className="font-bold text-gray-400 uppercase tracking-tight">{t("student_name")}</span><span className="text-[#6366f1] font-bold">{selectedStudent?.name}</span></div>
                        <div className="flex justify-between border-b border-gray-50 pb-2"><span className="font-bold text-gray-400 uppercase tracking-tight">{t("class")}</span><span className="text-gray-700 font-medium">{(selectedStudent?.schoolClass || selectedStudent?.school_class)?.name} ({selectedStudent?.section?.name})</span></div>
                        <div className="flex justify-between border-b border-gray-50 pb-2"><span className="font-bold text-gray-400 uppercase tracking-tight">{t("route")}</span><span className="text-indigo-600 font-bold">{(selectedStudent?.transportAssignment || selectedStudent?.transport_assignment)?.route?.title || t("not_assigned")}</span></div>
                        <div className="flex justify-between border-b border-gray-50 pb-2"><span className="font-bold text-gray-400 uppercase tracking-tight">{t("vehicle")}</span><span className="text-gray-700 font-medium">{(selectedStudent?.transportAssignment || selectedStudent?.transport_assignment)?.vehicle?.vehicle_no || t("not_assigned")}</span></div>
                        <div className="flex justify-between border-b border-gray-50 pb-2"><span className="font-bold text-gray-400 uppercase tracking-tight">{t("pickup_point")}</span><span className="text-gray-700 font-medium">{((selectedStudent?.transportAssignment || selectedStudent?.transport_assignment) as any)?.pickupPoint?.name || (selectedStudent?.transportAssignment || selectedStudent?.transport_assignment)?.pickup_point?.name || t("not_assigned")}</span></div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsViewModalOpen(false)} className="rounded-full px-8 h-9 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[11px] font-bold uppercase shadow-lg active:scale-95 transition-all">{t("close")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Fees Modal */}
            <Dialog open={isAssignFeesModalOpen} onOpenChange={setIsAssignFeesModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Assign Fees : {selectedStudent?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="font-bold text-gray-500 uppercase tracking-tight text-xs">{t("pickup_point_fee") || "Pickup Point Fee"}:</span>
                            <span className="font-bold text-[#6366f1] text-sm">{symbol}{monthlyFeeAmount.toFixed(2)}</span>
                        </div>
                        <Label className="mb-3 block text-gray-700">{t("select_months") || "Select Months"}</Label>
                        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                            {feeMasters.map(fm => (
                                <div key={fm.id} className="flex items-center space-x-2 border p-2 rounded hover:bg-gray-50">
                                    <Checkbox 
                                        id={`fm-${fm.id}`} 
                                        checked={selectedFeeMasterIds.includes(fm.id)} 
                                        onCheckedChange={() => handleFeeMasterToggle(fm.id)} 
                                        className="border-gray-300" 
                                    />
                                    <Label htmlFor={`fm-${fm.id}`} className="text-xs cursor-pointer font-medium text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1">
                                        {fm.month}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        {feeMasters.length === 0 && (
                            <div className="text-center py-4 text-xs text-red-500 bg-red-50 rounded border border-red-100">
                                No transport fee masters found for active session.
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignFeesModalOpen(false)} className="h-9 text-[11px] rounded-full px-6">{t("cancel")}</Button>
                        <Button disabled={loading || feeMasters.length === 0} onClick={submitAssignFees} className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[11px] font-bold uppercase shadow-lg active:scale-95 transition-all min-w-[120px]">
                            {loading ? t("saving") : t("assign")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
