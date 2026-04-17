"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    FileText,
    Table as TableIcon,
    Printer,
    FileDown,
    ChevronDown,
    Eye,
    Pencil,
    Trash2,
    Check,
    Download,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface OnlineAdmission {
    id: string;
    reference_no: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    school_class?: { name: string };
    section?: { name: string };
    father_name: string;
    dob: string;
    gender: string;
    category: string;
    phone: string;
    form_status: string;
    payment_status: string;
    is_enrolled: boolean;
    created_at: string;
}

export default function OnlineAdmissionPage() {
    const [admissions, setAdmissions] = useState<OnlineAdmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

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
            toast("error", "Failed to fetch online admissions.");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, toast]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchAdmissions(1);
        }, 500);
        return () => clearTimeout(timeout);
    }, [fetchAdmissions]);

    // Export functions
    const exportToCopy = () => {
        if (admissions.length === 0) {
            toast("error", "No data to copy.");
            return;
        }
        const headers = ["Reference No", "Student Name", "Class", "Father Name", "DOB", "Gender", "Category", "Mobile", "Form Status", "Payment Status", "Enrolled", "Created At"];
        const rows = admissions.map(a => [
            a.reference_no,
            `${a.first_name} ${a.last_name}`,
            `${a.school_class?.name || ""}(${a.section?.name || ""})`,
            a.father_name,
            a.dob,
            a.gender,
            a.category,
            a.phone,
            a.form_status,
            a.payment_status,
            a.is_enrolled ? "Yes" : "No",
            new Date(a.created_at).toLocaleDateString()
        ]);

        const text = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
        navigator.clipboard.writeText(text);
        toast("success", "Copied to clipboard");
    };

    const exportToExcel = () => {
        if (admissions.length === 0) {
            toast("error", "No data to export.");
            return;
        }
        const data = admissions.map(a => ({
            "Reference No": a.reference_no,
            "Student Name": `${a.first_name} ${a.last_name}`,
            "Class": `${a.school_class?.name || ""}(${a.section?.name || ""})`,
            "Father Name": a.father_name,
            "Date Of Birth": a.dob,
            "Gender": a.gender,
            "Category": a.category,
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
        toast("success", "Excel file downloaded");
    };

    const exportToPDF = () => {
        if (admissions.length === 0) {
            toast("error", "No data to export.");
            return;
        }
        const doc = new jsPDF("landscape");
        autoTable(doc, {
            head: [["Ref No", "Student Name", "Class", "Father", "DOB", "Gender", "Mobile", "Form Status", "Payment", "Enrolled"]],
            body: admissions.map(a => [
                a.reference_no,
                `${a.first_name} ${a.last_name}`,
                `${a.school_class?.name || ""}(${a.section?.name || ""})`,
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
        toast("success", "PDF file downloaded");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            await api.delete(`/online-admissions/${id}`);
            toast("success", "Record deleted successfully");
            fetchAdmissions(currentPage);
        } catch (error) {
            toast("error", "Failed to delete record");
        }
    };

    const handleEnroll = async (id: string) => {
        if (!confirm("Are you sure you want to enroll this applicant?")) return;
        try {
            await api.post(`/online-admissions/${id}/enroll`);
            toast("success", "Applicant enrolled as student successfully");
            fetchAdmissions(currentPage);
        } catch (error) {
            toast("error", "Failed to enroll applicant");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm print:shadow-none print:border-none">
                <CardHeader className="flex flex-row items-center justify-between border-b border-muted/50 pb-4 print:hidden">
                    <CardTitle className="text-xl font-bold tracking-tight">Student List</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 print:hidden">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search"
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
                                <IconButton icon={Printer} onClick={handlePrint} title="Print" />
                                <IconButton icon={Copy} onClick={exportToCopy} title="Copy" />
                                <IconButton icon={TableIcon} onClick={exportToExcel} title="Excel" />
                                <IconButton icon={FileText} onClick={exportToPDF} title="PDF" />
                                <IconButton icon={Download} onClick={() => admissions.length > 0 && exportToExcel()} title="Download" />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-xl border border-muted/50 relative min-h-[200px]">
                        {loading && (
                            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <Th>Reference No</Th>
                                    <Th>Student Name</Th>
                                    <Th>Class</Th>
                                    <Th>Father Name</Th>
                                    <Th>Date Of Birth</Th>
                                    <Th>Gender</Th>
                                    <Th>Category</Th>
                                    <Th>Student Mobile Number</Th>
                                    <Th>Form Status</Th>
                                    <Th>Payment Status</Th>
                                    <Th>Enrolled</Th>
                                    <Th>Created At</Th>
                                    <Th className="text-right print:hidden">Action</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-muted/30">
                                {admissions.map((student) => (
                                    <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                        <Td><span className="font-semibold text-primary/80">{student.reference_no}</span></Td>
                                        <Td className="font-semibold">{student.first_name} {student.last_name}</Td>
                                        <Td>{student.school_class?.name || ""}({student.section?.name || ""})</Td>
                                        <Td>{student.father_name}</Td>
                                        <Td>{student.dob}</Td>
                                        <Td>{student.gender}</Td>
                                        <Td>{student.category || "-"}</Td>
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
                                                    <ActionBtn icon={Check} onClick={() => handleEnroll(student.id)} className="bg-green-500 hover:bg-green-600" title="Enroll" />
                                                )}
                                                <ActionBtn icon={Eye} className="bg-indigo-500 hover:bg-indigo-600" title="View" />
                                                <ActionBtn icon={Pencil} className="bg-indigo-500 hover:bg-indigo-600" title="Edit" />
                                                <ActionBtn icon={Trash2} onClick={() => handleDelete(student.id)} className="bg-red-500 hover:bg-red-600" title="Delete" />
                                            </div>
                                        </Td>
                                    </tr>
                                ))}
                                {!loading && admissions.length === 0 && (
                                    <tr>
                                        <Td colSpan={13} className="text-center py-10 text-muted-foreground">No records found.</Td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium print:hidden">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Showing {from} to {to} of {total} entries</p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all disabled:opacity-50"
                                onClick={() => currentPage > 1 && fetchAdmissions(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {Array.from({ length: lastPage || 1 }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    className={cn(
                                        "h-8 w-8 rounded-lg border-none p-0 font-bold active:scale-95 transition-all shadow-md",
                                        currentPage === page
                                            ? "bg-gradient-to-br from-[#FF9800] to-[#4F39F6] text-white shadow-orange-500/10"
                                            : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                                    )}
                                    onClick={() => fetchAdmissions(page)}
                                >
                                    {page}
                                </Button>
                            ))}

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all disabled:opacity-50"
                                onClick={() => currentPage < lastPage && fetchAdmissions(currentPage + 1)}
                                disabled={currentPage === lastPage}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
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

function IconButton({ icon: Icon, onClick, title }: { icon: any, onClick?: () => void, title?: string }) {
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

function ActionBtn({ icon: Icon, className, onClick, title }: { icon: any, className?: string, onClick?: () => void, title?: string }) {
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
