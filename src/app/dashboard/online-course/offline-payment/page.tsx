"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Search,
    ChevronDown,
    PlusCircle,
    FileSearch,
    ArrowRight,
    RefreshCw,
    CreditCard,
    GraduationCap,
    Users,
    Zap,
    BookmarkCheck,
    ShieldCheck,
    Info,
    AlertCircle,
    Check,
    BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
}

interface Student {
    id: string;
    name: string;
    admission_no: string;
}

export default function OfflinePaymentPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [submitting, setSubmitting] = useState<number | null>(null);

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
            console.error("Failed to fetch analytical criteria");
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await api.get('/online-course/offline-payments/students', {
                params: { class_id: selectedClass, section_id: selectedSection }
            });
            setStudents(response.data);
        } catch (error) {
            console.error("Failed to fetch students registry");
        }
    };

    const handleSearch = async () => {
        if (!selectedStudent) {
            toast({ title: t("validation_error"), description: t("please_identify_target_student_before_lookup"), variant: "destructive" });
            return;
        }

        setSearching(true);
        try {
            const response = await api.get('/online-course/offline-payments/search-courses');
            setCourses(response.data);
            toast({ title: t("lookup_successful"), description: t("available_virtual_assets_synchronized") });
        } catch (error) {
            toast({ title: t("lookup_failure"), description: t("failed_to_locate_course_nodes"), variant: "destructive" });
        } finally {
            setSearching(false);
        }
    };

    const executeAssignment = async () => {
        if (!confirmId) return;
        setSubmitting(confirmId);
        try {
            await api.post('/online-course/offline-payments', {
                student_id: selectedStudent,
                course_id: confirmId
            });
            toast({ title: t("payment_recorded"), description: t("offline_transaction_indexed_and_asset_assigned") });
        } catch (error) {
            toast({ title: t("transaction_failed"), description: t("failed_to_record_offline_payment"), variant: "destructive" });
        } finally {
            setSubmitting(null);
            setConfirmId(null);
        }
    };

    const currentStudentName = students.find(s => s.id.toString() === selectedStudent)?.name || t("target_student");
    const currentCourseTitle = courses.find(c => c.id === confirmId)?.title || t("selected_asset");

    return (
        <div className="space-y-6">
            {/* Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <CreditCard className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("offline_payment")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("record_manual_course_enrollment_payments")}</p>
                    </div>
                </div>
            </div>

            {/* Select Criteria Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 rounded-t-lg">
                    <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
                        <GraduationCap className="h-4 w-4" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900">{t("select_criteria") || "Select Criteria"}</h2>
                </div>
                <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2 group">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                            {t("class")}
                        </label>
                        <div className="relative">
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm"
                            >
                                <option value="">{t("select")}</option>
                                {criteria.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none group-hover:text-indigo-400 transition-colors" />
                        </div>
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                            {t("section")}
                        </label>
                        <div className="relative">
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                disabled={!selectedClass}
                                className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm disabled:opacity-50"
                            >
                                <option value="">{t("select")}</option>
                                {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none group-hover:text-indigo-400 transition-colors" />
                        </div>
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                            {t("student")} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={selectedStudent}
                                onChange={(e) => setSelectedStudent(e.target.value)}
                                disabled={!selectedSection}
                                className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm disabled:opacity-50"
                            >
                                <option value="">{t("select")}</option>
                                {students.map(stu => <option key={stu.id} value={stu.id}>{stu.name} ({stu.admission_no})</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none group-hover:text-indigo-400 transition-colors" />
                        </div>
                    </div>
                </div>
                <div className="mt-5 flex justify-end">
                    <Button
                        onClick={handleSearch}
                        disabled={!selectedStudent || searching}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white h-9 px-5 text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 border-0"
                    >
                        {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        {t("search") || "Search"}
                    </Button>
                </div>
                </div>
            </div>

            {courses.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 mt-6">
                    <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 rounded-t-lg">
                        <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-500 shadow-sm">
                            <BookOpen className="h-4 w-4" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-900">{t("available_courses") || "Available Courses"}</h2>
                    </div>
                    <div className="p-5">
                    <div className="overflow-x-auto relative">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3">{t("course_title")}</th>
                                    <th className="px-4 py-3 text-center">{t("lessons")}</th>
                                    <th className="px-4 py-3 text-center">{t("quizzes")}</th>
                                    <th className="px-4 py-3 text-center">{t("exams")}</th>
                                    <th className="px-4 py-3 text-center">{t("assignments")}</th>
                                    <th className="px-4 py-3">{t("provider")}</th>
                                    <th className="px-4 py-3 text-center">{t("price") || "Price"}</th>
                                    <th className="px-4 py-3 text-center">{t("current_price") || "Current Price"}</th>
                                    <th className="px-4 py-3 text-right">{t("action") || "Action"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-20 text-center text-gray-500">
                                            {t("no_analytical_data_available")}
                                        </td>
                                    </tr>
                                ) : (
                                    courses.map((course) => (
                                        <tr key={course.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                        {course.title[0]}
                                                    </div>
                                                    <span className="font-semibold text-gray-800">{course.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">{course.lessons}</td>
                                            <td className="px-4 py-3 text-center">{course.quizzes}</td>
                                            <td className="px-4 py-3 text-center">{course.exams}</td>
                                            <td className="px-4 py-3 text-center">{course.assignments}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{course.provider}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-400 line-through">${course.price.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center text-indigo-600 font-bold">${course.current_price.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    onClick={() => setConfirmId(course.id)}
                                                    disabled={submitting !== null}
                                                    className="h-8 px-4 text-xs font-bold rounded bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white gap-2 shadow-sm border-0"
                                                >
                                                    {submitting === course.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <PlusCircle className="h-3 w-3" />}
                                                    {t("pay") || "Pay"}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-gray-500">
                            {`Displaying ${courses.length > 0 ? 1 : 0} to ${courses.length} of ${courses.length} entries`}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-md border-gray-200" disabled>
                                <ChevronDown className="h-4 w-4 rotate-90 text-gray-400" />
                            </Button>
                            <Button className="h-8 w-8 rounded-md bg-gradient-to-r from-[#FF9800] to-[#6366F1] border-0 text-white font-bold text-xs">
                                {courses.length > 0 ? 1 : 0}
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-md border-gray-200" disabled>
                                <ChevronDown className="h-4 w-4 -rotate-90 text-gray-400" />
                            </Button>
                        </div>
                    </div>
                    </div>
                </div>
            )}

            {/* Payment Confirmation Dialog */}
            <AlertDialog open={confirmId !== null} onOpenChange={(open) => !open && setConfirmId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("confirm_payment") || "Confirm Payment"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("confirm_offline_payment_desc", { courseTitle: currentCourseTitle, studentName: currentStudentName }) || `Are you sure you want to record an offline payment for ${currentStudentName} for the course "${currentCourseTitle}"?`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel") || "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeAssignment} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 border-0 text-white">
                            {t("confirm_payment") || "Confirm Payment"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
