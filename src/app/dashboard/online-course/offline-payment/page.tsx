"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import {
    Search,
    ChevronDown,
    PlusCircle,
    RefreshCw,
    CreditCard,
    GraduationCap,
    Check,
    BookOpen,
    Printer,
    Download,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    cn,
    toLocaleNumber,
    translateClassName,
    translateSectionName,
    translateRoleName,
} from "@/lib/utils";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { useSettings } from "@/components/providers/settings-provider";
import { sanitizeHtml } from "@/lib/sanitize";

interface Course {
    id: number;
    title: string;
    sections: number;
    lessons: number;
    quizzes: number;
    exams: number;
    assignments: number;
    provider: string;
    price: number;
    current_price: number;
    purchase_status?: string;
    invoice_no?: string;
    payment_date?: string;
}

interface Student {
    id: string;
    name: string;
    admission_no: string;
}

export default function OfflinePaymentPage() {
    const { toast } = useToast();
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const { symbol, formatCurrency } = useCurrencyFormatter();

    const formatPrice = (amount: number | string) => {
        const val = typeof amount === "string" ? parseFloat(amount) : amount;
        if (isNaN(val)) return `${symbol}${toLocaleNumber("0.00", shortCode)}`;
        return `${symbol}${toLocaleNumber(val.toFixed(2), shortCode)}`;
    };

    const [searching, setSearching] = useState(false);
    const [submitting, setSubmitting] = useState<number | null>(null);
    const [invoiceData, setInvoiceData] = useState<any>(null);
    const [printSettings, setPrintSettings] = useState<any>(null);
    const { settings } = useSettings();

    // Criteria State
    const [criteria, setCriteria] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [selectedStudent, setSelectedStudent] = useState("");

    const [sections, setSections] = useState<any[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);

    // Confirmation State
    const [confirmId, setConfirmId] = useState<number | null>(null);
    const [receiptData, setReceiptData] = useState<any>(null);
    const [showReceipt, setShowReceipt] = useState(false);

    useEffect(() => {
        fetchCriteria();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            const cls = criteria.find(c => c.id.toString() === selectedClass);
            setSections(cls?.sections || []);
            setStudents([]);
            setSelectedSection("");
            setSelectedStudent("");
        } else {
            setSections([]);
            setStudents([]);
        }
    }, [selectedClass, criteria]);

    useEffect(() => {
        if (selectedClass && selectedSection) {
            fetchStudents();
        }
    }, [selectedClass, selectedSection]);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/online-course/offline-payments/criteria');
            setCriteria(response.data);
        } catch (error) {
            console.error("Failed to fetch criteria", error);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await api.get('/online-course/offline-payments/students', {
                params: { class_id: selectedClass, section_id: selectedSection }
            });
            setStudents(response.data);
        } catch (error) {
            console.error("Failed to fetch students", error);
        }
    };

    const handleSearch = async () => {
        if (!selectedStudent) {
            toast({
                title: t("validation_error") || "Validation Error",
                description: t("please_select_student") || "Please select a student before searching.",
                variant: "destructive"
            });
            return;
        }

        setSearching(true);
        try {
            const response = await api.get('/online-course/offline-payments/search-courses', {
                params: { student_id: selectedStudent }
            });
            setCourses(response.data);
            toast({
                title: t("search_successful") || "Search Successful",
                description: t("courses_retrieved_successfully") || "Available courses retrieved successfully."
            });
        } catch {
            toast({
                title: t("search_failed") || "Search Failed",
                description: t("failed_to_retrieve_courses") || "Failed to retrieve courses.",
                variant: "destructive"
            });
        } finally {
            setSearching(false);
        }
    };

    const executeAssignment = async () => {
        if (!confirmId) return;
        setSubmitting(confirmId);
        try {
            const response = await api.post('/online-course/offline-payments', {
                student_id: selectedStudent,
                course_id: confirmId
            });
            toast({
                title: t("request_submitted") || "Request Submitted",
                description: response.data.message || "Payment request submitted for admin verification."
            });
            fetchStudents();
            handleSearch();
        } catch {
            toast({
                title: t("payment_failed") || "Payment Failed",
                description: t("failed_to_record_payment") || "Failed to record offline payment.",
                variant: "destructive"
            });
        } finally {
            setSubmitting(null);
            setConfirmId(null);
        }
    };

    const downloadInvoice = async (course: Course) => {
        if (!course.invoice_no) return;
        const selectedStudentData = students.find(s => s.id.toString() === selectedStudent);
        
        let currentSettings = printSettings;
        if (!currentSettings) {
            try {
                const res = await api.get('system-setting/print-settings');
                if (res.data?.status === 'success') {
                    const invoiceSetting = res.data.data.find((s: any) => s.type === 'Invoice');
                    setPrintSettings(invoiceSetting);
                    currentSettings = invoiceSetting;
                }
            } catch {}
        }

        setInvoiceData({
            type: 'course',
            id: course.invoice_no,
            date: course.payment_date || new Date().toISOString(),
            reference_no: course.invoice_no,
            studentName: selectedStudentData?.name,
            admissionNo: selectedStudentData?.admission_no,
            detail: `Course Purchase: ${course.title}`,
            amount: course.current_price,
            provider: course.provider
        });

        setTimeout(async () => {
            const element = document.getElementById('modern-invoice-template');
            if (element) {
                try {
                    const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    const pdf = new jsPDF();
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`${course.invoice_no}.pdf`);
                    toast({ title: t("search_successful") || "Success", description: "Your invoice has been downloaded successfully." });
                } catch (e: any) {
                    console.error("PDF Gen Error:", e);
                    toast({ title: "Error", description: `Failed to generate PDF: ${e.message || 'Unknown error'}`, variant: "destructive" });
                } finally {
                    setInvoiceData(null);
                }
            }
        }, 500);
    };

    const currentStudentName = students.find(s => s.id.toString() === selectedStudent)?.name || t("target_student");
    const currentCourseTitle = courses.find(c => c.id === confirmId)?.title || t("selected_asset");

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Title Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-900 dark:to-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <CreditCard className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">{t("offline_payment")}</h1>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{t("record_manual_course_enrollment_payments")}</p>
                    </div>
                </div>
            </div>

            {/* Select Criteria Card (Search button aligned inline on the 4th column) */}
            <div className="bg-white dark:bg-card/50 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-900 dark:to-zinc-950 border-b border-gray-100 dark:border-zinc-800 rounded-t-lg">
                    <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-orange-500 shadow-sm">
                        <GraduationCap className="h-4 w-4" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{t("select_criteria")}</h2>
                </div>
                <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        {/* Class */}
                        <div className="space-y-1.5 group">
                            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                                {t("class")}
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="flex h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-card px-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm text-gray-800 dark:text-gray-200"
                                >
                                    <option value="">{t("select")}</option>
                                    {criteria.map(cls => <option key={cls.id} value={cls.id}>{translateClassName(cls.name, shortCode)}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none group-hover:text-indigo-400 transition-colors" />
                            </div>
                        </div>

                        {/* Section */}
                        <div className="space-y-1.5 group">
                            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                                {t("section")}
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    disabled={!selectedClass}
                                    className="flex h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-card px-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm disabled:opacity-50 text-gray-800 dark:text-gray-200"
                                >
                                    <option value="">{t("select")}</option>
                                    {sections.map(sec => <option key={sec.id} value={sec.id}>{translateSectionName(sec.name, shortCode)}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none group-hover:text-indigo-400 transition-colors" />
                            </div>
                        </div>

                        {/* Student */}
                        <div className="space-y-1.5 group">
                            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                                {t("student")} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedStudent}
                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                    disabled={!selectedSection}
                                    className="flex h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-card px-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm disabled:opacity-50 text-gray-800 dark:text-gray-200"
                                >
                                    <option value="">{t("select")}</option>
                                    {students.map(stu => <option key={stu.id} value={stu.id}>{stu.name} ({stu.admission_no})</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none group-hover:text-indigo-400 transition-colors" />
                            </div>
                        </div>

                        {/* Search Button (Moved Inline to marked 4th position) */}
                        <div>
                            <Button
                                onClick={handleSearch}
                                disabled={!selectedStudent || searching}
                                className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white h-9 px-5 text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 border-0 cursor-pointer transition-all active:scale-95"
                            >
                                {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Available Courses Table */}
            {courses.length > 0 && (
                <div className="bg-white dark:bg-card/50 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-800 mt-6">
                    <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-900 dark:to-zinc-950 border-b border-gray-100 dark:border-zinc-800 rounded-t-lg">
                        <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-950/50 flex items-center justify-center text-green-500 shadow-sm">
                            <BookOpen className="h-4 w-4" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{t("available_courses")}</h2>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-zinc-800">
                            <table className="w-full text-xs text-left min-w-[850px]">
                                <thead className="bg-gray-50 dark:bg-zinc-800/80 text-gray-600 dark:text-gray-300 font-bold uppercase border-b border-gray-200 dark:border-zinc-800">
                                    <tr>
                                        <th className="px-4 py-3">{t("course_title")}</th>
                                        <th className="px-4 py-3 text-center">{t("lessons")}</th>
                                        <th className="px-4 py-3 text-center">{t("quizzes")}</th>
                                        <th className="px-4 py-3 text-center">{t("exams")}</th>
                                        <th className="px-4 py-3 text-center">{t("assignments")}</th>
                                        <th className="px-4 py-3">{t("creator")}</th>
                                        <th className="px-4 py-3 text-center">{t("original_price")}</th>
                                        <th className="px-4 py-3 text-center">{t("current_price")}</th>
                                        <th className="px-4 py-3 text-right">{t("action")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                    {courses.map((course) => (
                                        <tr key={course.id} className="hover:bg-indigo-50/40 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                                        {course.title[0]}
                                                    </div>
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{course.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">{toLocaleNumber(course.lessons, shortCode)}</td>
                                            <td className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">{toLocaleNumber(course.quizzes, shortCode)}</td>
                                            <td className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">{toLocaleNumber(course.exams, shortCode)}</td>
                                            <td className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">{toLocaleNumber(course.assignments, shortCode)}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                                                    {translateRoleName(course.provider, shortCode) || course.provider}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-400 line-through">{formatPrice(course.price)}</td>
                                            <td className="px-4 py-3 text-center text-indigo-600 dark:text-indigo-400 font-bold">{formatPrice(course.current_price)}</td>
                                            <td className="px-4 py-3 text-right">
                                                {course.purchase_status === 'Pending' ? (
                                                    <Button disabled className="h-8 px-4 text-xs font-bold rounded-full bg-amber-500 hover:bg-amber-500 text-white gap-2 shadow-sm border-0">
                                                        {t("pending")}
                                                    </Button>
                                                ) : course.purchase_status === 'Completed' ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="inline-flex items-center justify-center h-8 px-4 text-xs font-bold rounded-full bg-green-500 text-white shadow-sm">
                                                            {t("paid")}
                                                        </span>
                                                        <Button
                                                            onClick={() => downloadInvoice(course)}
                                                            className="h-8 px-3.5 text-xs font-bold rounded-full bg-slate-800 hover:bg-slate-700 text-white shadow-sm border-0 gap-1.5 cursor-pointer"
                                                        >
                                                            <Download className="h-3 w-3" />
                                                            {t("invoice")}
                                                        </Button>
                                                    </div>
                                                ) : course.purchase_status === 'Rejected' ? (
                                                    <Button
                                                        onClick={() => setConfirmId(course.id)}
                                                        disabled={submitting !== null}
                                                        className="h-8 px-4 text-xs font-bold rounded-full bg-red-500 hover:bg-red-600 text-white gap-2 shadow-sm border-0 cursor-pointer"
                                                    >
                                                        {submitting === course.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-3 w-3" />}
                                                        {t("retry_pay")}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => setConfirmId(course.id)}
                                                        disabled={submitting !== null}
                                                        className="h-8 px-4 text-xs font-bold rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white gap-1.5 shadow-sm border-0 cursor-pointer transition-all active:scale-95"
                                                    >
                                                        {submitting === course.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-3 w-3" />}
                                                        {t("pay")}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                            <p>
                                {t("showing_x_to_y_of_z", {
                                    from: toLocaleNumber(courses.length > 0 ? 1 : 0, shortCode),
                                    to: toLocaleNumber(courses.length, shortCode),
                                    total: toLocaleNumber(courses.length, shortCode),
                                })}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg border-gray-200 dark:border-zinc-700" disabled>
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-7 w-7 p-0 rounded-lg text-xs font-bold shadow-md bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0"
                                >
                                    {toLocaleNumber(courses.length > 0 ? 1 : 0, shortCode)}
                                </Button>
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg border-gray-200 dark:border-zinc-700" disabled>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Confirmation Dialog */}
            <AlertDialog open={confirmId !== null} onOpenChange={(open) => !open && setConfirmId(null)}>
                <AlertDialogContent className="bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("confirm_payment") || t("confirm")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("confirm_offline_payment_desc", { courseTitle: currentCourseTitle, studentName: currentStudentName })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeAssignment} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] border-0 text-white rounded-full cursor-pointer">
                            {t("confirm_payment") || t("confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Payment Receipt Dialog */}
            <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
                <DialogContent className="sm:max-w-[425px] bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                                <Check className="h-4 w-4" />
                            </span>
                            {t("payment_receipt")}
                        </DialogTitle>
                    </DialogHeader>
                    {receiptData && (
                        <div id="receipt-print-area" className="py-4 space-y-4 text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                                <span className="text-gray-500 font-semibold">{t("invoice_no")}:</span>
                                <span className="font-bold">{receiptData.invoice_no}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                                <span className="text-gray-500 font-semibold">{t("date")}:</span>
                                <span className="font-bold">{receiptData.payment_date}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                                <span className="text-gray-500 font-semibold">{t("student")}:</span>
                                <span className="font-bold">{receiptData.student?.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                                <span className="text-gray-500 font-semibold">{t("course")}:</span>
                                <span className="font-bold">{receiptData.course?.title}</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="text-gray-500 font-semibold">{t("amount_paid")}:</span>
                                <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{formatPrice(receiptData.amount)}</span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReceipt(false)}>
                            {t("close")}
                        </Button>
                        <Button 
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-full"
                            onClick={() => {
                                const printContent = document.getElementById('receipt-print-area');
                                if (printContent) {
                                    const originalContents = document.body.innerHTML;
                                    document.body.innerHTML = `
                                        <div style="padding: 40px; font-family: sans-serif;">
                                            <h2 style="text-align: center; color: #4F46E5; margin-bottom: 20px;">Payment Receipt</h2>
                                            ${printContent.innerHTML}
                                        </div>
                                    `;
                                    window.print();
                                    document.body.innerHTML = originalContents;
                                    window.location.reload();
                                }
                            }}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            {t("print_receipt")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Invoice Template (Hidden) */}
            {invoiceData && (
                <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -50, opacity: 0, pointerEvents: 'none' }}>
                    <div id="modern-invoice-template" style={{ width: '800px', backgroundColor: '#ffffff', padding: '48px', fontFamily: 'sans-serif', color: '#1e293b', minHeight: '1122px', boxSizing: 'border-box' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            {/* Left Column: Logo + School Name */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {printSettings?.header_image_base64 ? (
                                    <img src={printSettings.header_image_base64} alt="Header" style={{ maxHeight: '80px', objectFit: 'contain', marginBottom: '8px' }} />
                                ) : settings?.print_logo_base64 ? (
                                    <img src={settings.print_logo_base64} alt="Logo" style={{ maxHeight: '80px', objectFit: 'contain', marginBottom: '8px' }} />
                                ) : null}
                                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', lineHeight: '1.2', margin: 0 }}>{settings?.school_name || "iSchool"}</h1>
                            </div>
                            
                            {/* Right Column: Address and Others */}
                            <div style={{ textAlign: 'right', fontSize: '13px', color: '#1e293b', lineHeight: '1.5' }}>
                                {settings?.address && (
                                    <div><span style={{ fontWeight: 'bold' }}>Address:</span> {settings.address}</div>
                                )}
                                {settings?.phone && (
                                    <div><span style={{ fontWeight: 'bold' }}>Phone No.:</span> {settings.phone}</div>
                                )}
                                {settings?.email && (
                                    <div><span style={{ fontWeight: 'bold' }}>Email:</span> {settings.email}</div>
                                )}
                                <div><span style={{ fontWeight: 'bold' }}>Website:</span> {(settings?.frontend_url || (typeof window !== 'undefined' ? window.location.host : '') || process.env.NEXT_PUBLIC_FRONTEND_URL || "localhost:3000")?.replace(/^https?:\/\//, '')}</div>
                            </div>
                        </div>

                        {/* Centered full-width black bar */}
                        <div style={{ backgroundColor: '#000000', color: '#ffffff', fontWeight: 'bold', textAlign: 'center', padding: '10px 0', letterSpacing: '0.2em', fontSize: '15px', marginBottom: '24px', textTransform: 'uppercase', borderRadius: '4px' }}>
                            INVOICE
                        </div>

                        {/* Invoice Meta Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
                            <div>
                                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Invoice No:</span> <span style={{ color: '#4f46e5', fontWeight: '900' }}>{invoiceData.reference_no}</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Date:</span> <span style={{ fontWeight: '600' }}>{new Date(invoiceData.date).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Billed To */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Billed To</p>
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 4px 0' }}>{invoiceData.studentName}</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '500', margin: 0 }}>Admission No: {invoiceData.admissionNo}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Status</p>
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '32px', padding: '0 16px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d' }}>
                                    PAID
                                </span>
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '32px' }}>
                            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                                            <p style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px', margin: 0 }}>{invoiceData.detail}</p>
                                            {invoiceData.provider && <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '500', margin: 0 }}>Provider: {invoiceData.provider}</p>}
                                        </td>
                                        <td style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>
                                            {formatPrice(invoiceData.amount)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Total */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '64px' }}>
                            <div style={{ width: '50%', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '24px', border: '1px solid #f1f5f9', boxSizing: 'border-box' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b' }}>Subtotal</span>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{formatPrice(invoiceData.amount)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0', marginTop: '16px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b' }}>Total Paid</span>
                                    <span style={{ fontSize: '20px', fontWeight: '900', color: '#4f46e5' }}>{formatPrice(invoiceData.amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ textAlign: 'center', paddingTop: '32px', borderTop: '1px solid #e2e8f0' }}>
                            {printSettings?.footer_content ? (
                                <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(printSettings.footer_content) }} />
                            ) : (
                                <p style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', margin: 0 }}>Thank you for your payment!</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
