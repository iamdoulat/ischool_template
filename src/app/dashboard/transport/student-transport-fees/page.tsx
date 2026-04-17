"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
    ArrowUpDown,
    Pencil,
    Trash2,
    Eye,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
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
    section?: { name: string };
    transport_assignment?: {
        route?: { title: string; id: number };
        vehicle?: { vehicle_no: string; id: number };
        pickup_point?: { name: string; id: number };
    };
}

export default function StudentTransportFeesPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingInitial, setFetchingInitial] = useState(true);

    const [students, setStudents] = useState<StudentTransport[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [pickupPoints, setPickupPoints] = useState<any[]>([]);

    // Filters
    const [filters, setFilters] = useState({
        class_id: "",
        section_id: "",
    });

    // Assignment Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentTransport | null>(null);
    const [assignmentForm, setAssignmentForm] = useState({
        route_id: "",
        vehicle_id: "",
        pickup_point_id: "",
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const fetchInitialData = async () => {
        setFetchingInitial(true);
        try {
            const [classesRes, routesRes, vehiclesRes, pointsRes] = await Promise.all([
                api.get("/classes"),
                api.get("/transport/routes"),
                api.get("/transport/vehicles"),
                api.get("/transport/pickup-points"),
            ]);
            setClasses(classesRes.data.data.data || classesRes.data.data || []);
            setRoutes(routesRes.data.data.data || routesRes.data.data || []);
            setVehicles(vehiclesRes.data.data.data || vehiclesRes.data.data || []);
            setPickupPoints(pointsRes.data.data.data || pointsRes.data.data || []);
        } catch (error) {
            toast("error", "Failed to load initial data");
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
            const res = await api.get(`/sections?class_id=${classId}`);
            setSections(res.data.data.data || res.data.data || []);
        } catch (error) {
            toast("error", "Failed to load sections");
        }
    };

    const handleSearch = async () => {
        if (!filters.class_id) {
            toast("error", "Please select a class");
            return;
        }
        setLoading(true);
        try {
            const params: any = {};
            if (filters.class_id) params.class_id = filters.class_id;
            if (filters.section_id) params.section_id = filters.section_id;

            const res = await api.get("/transport/student-assignments", { params });
            setStudents(res.data.data);
            setCurrentPage(1);
        } catch (error) {
            toast("error", "Failed to fetch students");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAssign = (student: StudentTransport) => {
        setSelectedStudent(student);
        setAssignmentForm({
            route_id: student.transport_assignment?.route?.id?.toString() || "",
            vehicle_id: student.transport_assignment?.vehicle?.id?.toString() || "",
            pickup_point_id: student.transport_assignment?.pickup_point?.id?.toString() || "",
        });
        setIsAssignModalOpen(true);
    };

    const handleAssign = async () => {
        if (!selectedStudent) return;
        if (!assignmentForm.route_id || !assignmentForm.vehicle_id || !assignmentForm.pickup_point_id) {
            toast("error", "Please select all fields");
            return;
        }

        setLoading(true);
        try {
            await api.post("/transport/student-assignments", {
                student_id: selectedStudent.id,
                ...assignmentForm,
            });
            toast("success", "Transport assigned successfully");
            setIsAssignModalOpen(false);
            handleSearch();
        } catch (error) {
            toast("error", "Failed to assign transport");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAssignment = async (studentId: number) => {
        if (!confirm("Are you sure you want to remove transport for this student?")) return;
        try {
            await api.delete(`/transport/student-assignments/${studentId}`);
            toast("success", "Transport assignment removed");
            handleSearch();
        } catch (error) {
            toast("error", "Failed to remove assignment");
        }
    };

    const filteredStudents = students.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_no.includes(searchTerm)
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

    // Export Functions
    const exportToExcel = () => {
        const dataToExport = filteredStudents.map(s => ({
            'Admission No': s.admission_no,
            'Student Name': s.name,
            'Class': `${s.school_class?.name || ''}(${s.section?.name || ''})`,
            'Father Name': s.father_name,
            'Route': s.transport_assignment?.route?.title || '-',
            'Vehicle': s.transport_assignment?.vehicle?.vehicle_no || '-',
            'Pickup Point': s.transport_assignment?.pickup_point?.name || '-'
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students Transport");
        XLSX.writeFile(wb, "student_transport_fees.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF('l');
        doc.text("Student Transport Fees Report", 14, 15);
        const tableData = filteredStudents.map(s => [
            s.admission_no,
            s.name,
            `${s.school_class?.name || ''}(${s.section?.name || ''})`,
            s.father_name,
            s.transport_assignment?.route?.title || '-',
            s.transport_assignment?.vehicle?.vehicle_no || '-',
            s.transport_assignment?.pickup_point?.name || '-'
        ]);
        autoTable(doc, {
            head: [['Admission No', 'Student Name', 'Class', 'Father Name', 'Route', 'Vehicle', 'Pickup Point']],
            body: tableData,
            startY: 20,
        });
        doc.save("student_transport_fees.pdf");
    };

    const copyToClipboard = () => {
        const text = filteredStudents.map(s =>
            `${s.admission_no}\t${s.name}\t${s.school_class?.name || '-'}\t${s.transport_assignment?.route?.title || '-'}`
        ).join('\n');
        navigator.clipboard.writeText(text);
        toast("success", "Data copied to clipboard");
    };

    if (fetchingInitial) return <div className="p-8 text-center text-gray-400 italic">Loading criteria data...</div>;

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800 tracking-tight">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end text-left">
                    <div className="space-y-1.5 align-left">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            Class <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Select onValueChange={handleClassChange} value={filters.class_id}>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((c) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5 flex flex-col items-start">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                        <Select onValueChange={(val) => setFilters({ ...filters, section_id: val })} value={filters.section_id}>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button
                        onClick={handleSearch}
                        disabled={loading}
                        variant="gradient"
                        className="px-8 h-10 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg flex items-center gap-1.5 min-w-[120px]"
                    >
                        <Search className="h-4 w-4" />
                        {loading ? "Searching..." : "Search"}
                    </Button>
                </div>
            </div>

            {/* Student Transport Fees Table Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                <h2 className="text-sm font-medium text-gray-800 tracking-tight">Student Transport Fees</h2>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{itemsPerPage}</span>
                            <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(parseInt(val)); setCurrentPage(1); }}>
                                <SelectTrigger className="h-7 w-14 text-[10px] border-none bg-gray-50 hover:bg-gray-100 transition-colors shadow-none rounded-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded" onClick={copyToClipboard}>
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded" onClick={exportToExcel}>
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded" onClick={exportToPDF}>
                                <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded" onClick={() => window.print()}>
                                <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                <Columns className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1400px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">Admission No</TableHead>
                                <TableHead className="py-3 px-4">Student Name</TableHead>
                                <TableHead className="py-3 px-4">Class</TableHead>
                                <TableHead className="py-3 px-4">Father Name</TableHead>
                                <TableHead className="py-3 px-4">Date Of Birth</TableHead>
                                <TableHead className="py-3 px-4">Route Title</TableHead>
                                <TableHead className="py-3 px-4">Vehicle Number</TableHead>
                                <TableHead className="py-3 px-4">Pickup Point</TableHead>
                                <TableHead className="py-3 px-4 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10 text-gray-400">Loading students...</TableCell>
                                </TableRow>
                            ) : paginatedStudents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10 text-gray-400">No students found</TableCell>
                                </TableRow>
                            ) : (
                                paginatedStudents.map((student) => (
                                    <TableRow key={student.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3 px-4 text-gray-700 font-medium">{student.admission_no}</TableCell>
                                        <TableCell className="py-3 px-4">
                                            <span className="text-[#6366f1] font-medium hover:underline cursor-pointer">{student.name}</span>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{`${student.school_class?.name || ''}(${student.section?.name || ''})`}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{student.father_name}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{student.dob}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{student.transport_assignment?.route?.title || '-'}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{student.transport_assignment?.vehicle?.vehicle_no || '-'}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500">{student.transport_assignment?.pickup_point?.name || '-'}</TableCell>
                                        <TableCell className="py-3 px-4 text-right flex items-center justify-end gap-1">
                                            <Button title="View Details" onClick={() => { setSelectedStudent(student); setIsViewModalOpen(true); }} size="icon" variant="ghost" className="h-6 w-6 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm">
                                                <Eye className="h-3 w-3" />
                                            </Button>
                                            <Button title="Edit Assignment" onClick={() => handleOpenAssign(student)} size="icon" variant="gradient" className="h-6 w-6 text-white rounded shadow-sm">
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            {student.transport_assignment && (
                                                <Button title="Delete Assignment" onClick={() => handleRemoveAssignment(student.id)} size="icon" variant="ghost" className="h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded shadow-sm font-bold">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100">
                        <div>
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStudents.length)} of {filteredStudents.length} entries
                        </div>
                        <div className="flex gap-1.5 items-center">
                            <Button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30"
                            >
                                <ChevronLeft className="h-5 w-5 text-gray-600" />
                            </Button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "gradient" : "ghost"}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-9 w-9 rounded-xl text-[12px] font-bold p-0 transition-all shadow-sm",
                                        currentPage === page ? "scale-105 border-0" : "border border-gray-50 text-gray-400 hover:text-indigo-600"
                                    )}
                                >
                                    {page}
                                </Button>
                            ))}

                            <Button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30"
                            >
                                <ChevronRight className="h-5 w-5 text-gray-600" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Assign Transport Modal */}
            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Assign Transport: {selectedStudent?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Route <span className="text-red-500">*</span></Label>
                            <Select value={assignmentForm.route_id} onValueChange={(val) => setAssignmentForm({ ...assignmentForm, route_id: val })}>
                                <SelectTrigger className="h-8 text-[11px]">
                                    <SelectValue placeholder="Select Route" />
                                </SelectTrigger>
                                <SelectContent>
                                    {routes.map((r) => (
                                        <SelectItem key={r.id} value={r.id.toString()}>{r.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Vehicle <span className="text-red-500">*</span></Label>
                            <Select value={assignmentForm.vehicle_id} onValueChange={(val) => setAssignmentForm({ ...assignmentForm, vehicle_id: val })}>
                                <SelectTrigger className="h-8 text-[11px]">
                                    <SelectValue placeholder="Select Vehicle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map((v) => (
                                        <SelectItem key={v.id} value={v.id.toString()}>{v.vehicle_no}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Pickup Point <span className="text-red-500">*</span></Label>
                            <Select value={assignmentForm.pickup_point_id} onValueChange={(val) => setAssignmentForm({ ...assignmentForm, pickup_point_id: val })}>
                                <SelectTrigger className="h-8 text-[11px]">
                                    <SelectValue placeholder="Select Point" />
                                </SelectTrigger>
                                <SelectContent>
                                    {pickupPoints.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignModalOpen(false)} className="h-9 text-[11px] rounded-full px-6">Cancel</Button>
                        <Button
                            variant="gradient"
                            disabled={loading}
                            onClick={handleAssign}
                            className="h-9 text-[11px] min-w-[120px] rounded-full px-8 shadow-lg font-bold uppercase"
                        >
                            {loading ? "Saving..." : "Save Assignment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* View Transport Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>View Transport: {selectedStudent?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-4 text-[12px]">
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="font-bold text-gray-400 uppercase tracking-tight">Admission No</span>
                            <span className="text-gray-700 font-medium">{selectedStudent?.admission_no}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="font-bold text-gray-400 uppercase tracking-tight">Student Name</span>
                            <span className="text-[#6366f1] font-bold">{selectedStudent?.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="font-bold text-gray-400 uppercase tracking-tight">Class</span>
                            <span className="text-gray-700 font-medium">{selectedStudent?.school_class?.name} ({selectedStudent?.section?.name})</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="font-bold text-gray-400 uppercase tracking-tight">Route</span>
                            <span className="text-indigo-600 font-bold">{selectedStudent?.transport_assignment?.route?.title || "Not Assigned"}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="font-bold text-gray-400 uppercase tracking-tight">Vehicle</span>
                            <span className="text-gray-700 font-medium">{selectedStudent?.transport_assignment?.vehicle?.vehicle_no || "Not Assigned"}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-50 pb-2">
                            <span className="font-bold text-gray-400 uppercase tracking-tight">Pickup Point</span>
                            <span className="text-gray-700 font-medium">{selectedStudent?.transport_assignment?.pickup_point?.name || "Not Assigned"}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsViewModalOpen(false)} variant="gradient" className="rounded-full px-8 h-9 text-[11px] font-bold uppercase shadow-lg">Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
