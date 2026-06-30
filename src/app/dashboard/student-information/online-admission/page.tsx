"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import {
    Search,
    FileText,
    Table as TableIcon,
    Printer,
    Eye,
    Pencil,
    Trash2,
    Check,
    Download,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Copy,
    User,
    Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useImageUrl } from "@/lib/image-url";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-GB');
};



interface OnlineAdmission {
    id: string;
    reference_no: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    school_class?: { name: string };
    section?: { name: string };
    school_class_id?: string;
    section_id?: string;
    father_name: string;
    dob: string;
    gender: string;
    category: string;
    student_category?: { category_name: string };
    phone: string;
    email?: string;
    form_status: string;
    payment_status: string;
    is_enrolled: boolean;
    created_at: string;
    father_phone?: string;
    mother_name?: string;
    mother_phone?: string;
}

export default function OnlineAdmissionPage() {
    const getImageUrl = useImageUrl();
    const [admissions, setAdmissions] = useState<OnlineAdmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const tt = useTranslateToast();
    const { t } = useTranslation();
    const router = useRouter();

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
    const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);

    const fetchAdmissions = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get("/online-admissions", {
                params: {
                    page,
                    search: searchTerm,
                    limit: 50
                }
            });
            const { data } = response.data.data;
            const paginationData = response.data.data;

            setAdmissions(data);
            setCurrentPage(paginationData.current_page);
            setLastPage(paginationData.last_page);
            setTotal(paginationData.total);
            setFrom(paginationData.from || 0);
            setTo(paginationData.to || 0);
        } catch (error) {
            console.error("Error fetching admissions:", error);
            tt.error("failed_to_fetch_online_admissions");
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    const fetchClasses = useCallback(async () => {
        try {
            const response = await api.get("/academics/classes?no_paginate=true");
            if (response.data.success) {
                setClasses(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    }, []);

    const fetchSections = useCallback(async (classId: string) => {
        if (!classId) return;
        try {
            const response = await api.get(`/academics/sections?school_class_id=${classId}&no_paginate=true`);
            if (response.data.success) {
                setSections(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchAdmissions(1);
        }, 500);
        return () => clearTimeout(timeout);
    }, [fetchAdmissions]);

    // Export functions
    const exportToCopy = () => {
        if (admissions.length === 0) {
            tt.error("no_data_to_copy");
            return;
        }
        const headers = ["Reference No", "Student Name", "Class", "Section", "Father Name", "DOB", "Gender", "Category", "Mobile", "Form Status", "Payment Status", "Enrolled", "Created At"];
        const rows = admissions.map(a => [
            a.reference_no,
            `${a.first_name} ${a.last_name}`,
            a.school_class?.name || "",
            a.section?.name || "",
            a.father_name,
            a.dob,
            a.gender,
            a.student_category?.category_name || a.category,
            a.phone,
            a.form_status,
            a.payment_status,
            a.is_enrolled ? "Yes" : "No",
            new Date(a.created_at).toLocaleDateString()
        ]);

        const text = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        if (admissions.length === 0) {
            tt.error("no_data_to_export");
            return;
        }
        const data = admissions.map(a => ({
            "Reference No": a.reference_no,
            "Student Name": `${a.first_name} ${a.last_name}`,
            "Class": a.school_class?.name || "",
            "Section": a.section?.name || "",
            "Father Name": a.father_name,
            "Date Of Birth": a.dob,
            "Gender": a.gender,
            "Category": a.student_category?.category_name || a.category,
            "Mobile Number": a.phone,
            "Form Status": a.form_status,
            "Payment Status": a.payment_status,
            "Enrolled": a.is_enrolled ? "Yes" : "No",
            "Created At": new Date(a.created_at).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Admissions");
        XLSX.writeFile(workbook, "online_admissions.xlsx");
        tt.success("excel_file_downloaded");
    };

    const exportToPDF = () => {
        if (admissions.length === 0) {
            tt.error("no_data_to_export");
            return;
        }
        const doc = new jsPDF("landscape");
        autoTable(doc, {
            head: [["Ref No", "Student Name", "Class", "Section", "Father", "DOB", "Gender", "Mobile", "Form Status", "Payment", "Enrolled"]],
            body: admissions.map(a => [
                a.reference_no,
                `${a.first_name} ${a.last_name}`,
                a.school_class?.name || "",
                a.section?.name || "",
                a.father_name,
                a.dob,
                a.gender,
                a.phone,
                a.form_status,
                a.payment_status,
                a.is_enrolled ? "✔" : "✖"
            ]),
            styles: { fontSize: 8 },
        });
        doc.save("online_admissions.pdf");
        tt.success("pdf_file_downloaded");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t("are_you_sure_delete_record"))) return;
        try {
            await api.delete(`/online-admissions/${id}`);
            tt.success("admission_record_deleted_successfully");
            fetchAdmissions(currentPage);
        } catch (error) {
            tt.error("failed_to_delete_record");
        }
    };

    const handleEnroll = async () => {
        if (!selectedAdmission) return;
        setSubmitting(true);
        try {
            const response = await api.post(`/online-admissions/${selectedAdmission.id}/enroll`);
            const enrolledStudent = response.data?.data;
            const message = response.data?.message || t("successfully_enrolled", { name: selectedAdmission.first_name });
            tt.success(message);
            setEnrollDialogOpen(false);
            setSelectedAdmission(null);
            fetchAdmissions(currentPage);
        } catch (error: any) {
            tt.error(error.response?.data?.message || t("failed_to_enroll_applicant"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleView = (admission: OnlineAdmission) => {
        setSelectedAdmission(admission);
        setViewDialogOpen(true);
    };

    const handleEdit = (admission: OnlineAdmission) => {
        router.push(`/dashboard/student-information/online-admission/${admission.id}/edit`);
    };



    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 print:shadow-none print:border-none">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] print:hidden">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Globe className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("online_admission_list")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{total} {t(total === 1 ? "application" : "applications")} {t("total")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 print:hidden">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("search")}
                                className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-4">
                                <span className="text-sm font-semibold text-muted-foreground">50</span>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex gap-1">
                                <IconButton icon={Printer} onClick={handlePrint} title={t("print")} />
                                <IconButton icon={Copy} onClick={exportToCopy} title={t("copy")} />
                                <IconButton icon={TableIcon} onClick={exportToExcel} title={t("excel")} />
                                <IconButton icon={FileText} onClick={exportToPDF} title={t("pdf")} />
                                <IconButton icon={Download} onClick={() => admissions.length > 0 && exportToExcel()} title={t("download")} />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border border-muted/50 relative min-h-[200px]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <Th>{t("reference_no")}</Th>
                                    <Th>{t("student_name")}</Th>
                                    <Th>{t("class")}</Th>
                                    <Th>{t("section")}</Th>
                                    <Th>{t("father_name")}</Th>
                                    <Th>{t("date_of_birth")}</Th>
                                    <Th>{t("gender")}</Th>
                                    <Th>{t("category")}</Th>
                                    <Th>{t("student_mobile_number")}</Th>
                                    <Th>{t("form_status")}</Th>
                                    <Th>{t("payment_status")}</Th>
                                    <Th>{t("enrolled")}</Th>
                                    <Th>{t("created_at")}</Th>
                                    <Th className="text-right print:hidden">{t("action")}</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted/30">
                                {loading ? (
                                    <TableSkeleton rows={5} cols={14} />
                                ) : admissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={14} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td>
                                    </tr>
                                ) : (
                                    admissions.map((student) => (
                                        <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                            <Td><span className="font-semibold text-primary/80">{student.reference_no}</span></Td>
                                            <Td className="font-semibold">{student.first_name} {student.last_name}</Td>
                                            <Td>{student.school_class?.name || ""}</Td>
                                            <Td>{student.section?.name || ""}</Td>
                                            <Td>{student.father_name || "-"}</Td>
                                            <Td>{formatDate(student.dob)}</Td>
                                            <Td>{student.gender || "-"}</Td>
                                            <Td>{student.student_category?.category_name || student.category || "-"}</Td>
                                            <Td>{student.phone}</Td>
                                            <Td>
                                                <Badge className={cn(
                                                    "font-bold text-[10px] px-2 py-0.5 whitespace-nowrap",
                                                    student.form_status.startsWith("Submitted") || student.form_status === "Enrolled"
                                                        ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200"
                                                        : "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200"
                                                )}>
                                                    {student.form_status}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <Badge className={cn(
                                                    "font-bold text-[10px] px-2 py-0.5",
                                                    student.payment_status === "Paid"
                                                        ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200"
                                                        : "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200"
                                                )}>
                                                    {student.payment_status}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <div className="flex justify-center">
                                                    {student.is_enrolled ? (
                                                        <Check className="h-4 w-4 text-green-600 font-bold" strokeWidth={3} />
                                                    ) : (
                                                        <div className="h-4 w-4 flex items-center justify-center">
                                                            <div className="h-3 w-3 rounded-full border-2 border-slate-400 flex items-center justify-center">
                                                                <div className="h-1 w-1 bg-slate-400 rounded-full" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Td>
                                            <Td>{new Date(student.created_at).toLocaleDateString()}</Td>
                                            <Td className="text-right print:hidden">
                                                <div className="flex justify-end gap-1">
                                                    {!student.is_enrolled && (
                                                        <ActionBtn
                                                            icon={Check}
                                                            onClick={() => {
                                                                setSelectedAdmission(student);
                                                                setEnrollDialogOpen(true);
                                                            }}
                                                            className="bg-green-500 hover:bg-green-600"
                                                            title={t("enroll")}
                                                        />
                                                    )}
                                                    <ActionBtn icon={Eye} onClick={() => handleView(student)} className="bg-indigo-500 hover:bg-indigo-600" title={t("view")} />
                                                    <ActionBtn icon={Pencil} onClick={() => handleEdit(student)} className="bg-amber-500 hover:bg-amber-600" title={t("edit")} />
                                                    <ActionBtn icon={Trash2} onClick={() => handleDelete(student.id)} className="bg-red-500 hover:bg-red-600" title={t("delete")} />
                                                </div>
                                            </Td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium print:hidden">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("showing_x_to_y_of_z", { from, to, total })}</p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
                                onClick={() => currentPage > 1 && fetchAdmissions(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {Array.from({ length: lastPage || 1 }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    className={cn(
                                        "h-8 w-8 rounded-[10px] border-none p-0 font-bold active:scale-95 transition-all shadow-md",
                                        currentPage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-orange-500/10"
                                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                    )}
                                    onClick={() => fetchAdmissions(page)}
                                >
                                    {page}
                                </Button>
                            ))}

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
                                onClick={() => currentPage < lastPage && fetchAdmissions(currentPage + 1)}
                                disabled={currentPage === lastPage}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-none shadow-2xl rounded-lg bg-background/95 backdrop-blur-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Eye className="h-5 w-5 text-indigo-500" />
                            {t("admission_application_details")}
                        </DialogTitle>
                        <DialogDescription className="font-semibold text-primary">{t("reference_no")}: {selectedAdmission?.reference_no}</DialogDescription>
                    </DialogHeader>
                    {selectedAdmission && (
                        <div className="space-y-6 pt-4">
                            <div className="flex justify-center mb-6">
                                <div className="w-40 h-40 rounded-lg bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-lg">
                                    {selectedAdmission.student_photo ? (
                                        <img
                                            src={getImageUrl(selectedAdmission.student_photo)}
                                            alt={t("student")}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-20 h-20 text-slate-300" />
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{t("student_info")}</h4>
                                    <InfoRow label={t("full_name")} value={`${selectedAdmission.first_name} ${selectedAdmission.middle_name || ""} ${selectedAdmission.last_name}`} />
                                    <InfoRow label={t("date_of_birth")} value={formatDate(selectedAdmission.dob)} />
                                    <InfoRow label={t("gender")} value={selectedAdmission.gender} />
                                    <InfoRow label={t("mobile")} value={selectedAdmission.phone} />
                                    <InfoRow label={t("email")} value={selectedAdmission.email} />
                                    <InfoRow label={t("class")} value={selectedAdmission.school_class?.name} />
                                    <InfoRow label={t("section")} value={selectedAdmission.section?.name} />
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{t("parent_info")}</h4>
                                    <InfoRow label={t("father_name")} value={selectedAdmission.father_name} />
                                    <InfoRow label={t("father_mobile")} value={selectedAdmission.father_phone} />
                                    <InfoRow label={t("mother_name")} value={selectedAdmission.mother_name} />
                                    <InfoRow label={t("mother_mobile")} value={selectedAdmission.mother_phone} />
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mt-4">{t("status")}</h4>
                                    <InfoRow label={t("form_status")} value={selectedAdmission.form_status} />
                                    <InfoRow label={t("payment_status")} value={selectedAdmission.payment_status} />
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Enroll Confirmation Dialog */}
            <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
                <DialogContent className="max-w-md border-none shadow-2xl rounded-lg bg-background/95 backdrop-blur-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                <Check className="h-5 w-5" />
                            </div>
                            {t("confirm_enrollment")}
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-sm text-muted-foreground font-medium">
                            {t("are_you_sure_enroll")} <span className="text-foreground font-bold">{selectedAdmission?.first_name} {selectedAdmission?.last_name}</span>?
                            <br /><br />
                            {t("enroll_confirmation_description")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setEnrollDialogOpen(false)}
                            className="rounded-lg border-muted/50 active:scale-95 transition-all"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={handleEnroll}
                            disabled={submitting}
                            className="rounded-lg bg-green-500 hover:bg-green-600 active:scale-95 transition-all shadow-lg shadow-green-500/20"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("enrolling")}
                                </>
                            ) : t("confirm_enrollment")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-4 py-4 border-b border-muted/50", className)}>{children}</th>;
}

function Td({ children, className, colSpan }: { children: React.ReactNode, className?: string, colSpan?: number }) {
    return <td colSpan={colSpan} className={cn("px-4 py-4 text-sm font-medium text-slate-600", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick, title }: { icon: React.ElementType, onClick?: () => void, title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm group"
        >
            <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
        </button>
    );
}

function ActionBtn({ icon: Icon, className, onClick, title }: { icon: React.ElementType, className?: string, onClick?: () => void, title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={cn("p-1.5 text-white rounded transition-all hover:shadow-md hover:scale-110", className)}
        >
            <Icon className="h-3.5 w-3.5" />
        </button>
    );
}

function InfoRow({ label, value }: { label: string, value?: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{label}</span>
            <span className="text-sm font-semibold">{value || "-"}</span>
        </div>
    );
}
