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
    Check
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
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans text-slate-800">
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
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-inner">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-black tracking-tight text-slate-700 uppercase">{t("registry_criteria")}</CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                        <div className="space-y-3 group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">
                                {t("institutional_class")} <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="flex h-14 w-full rounded-lg border border-muted/50 bg-white px-6 py-2 text-[11px] font-black uppercase tracking-tight focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm"
                                >
                                    <option value="">{t("select_class_node")}</option>
                                    {criteria.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-3 group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">
                                {t("academic_section")} <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    className="flex h-14 w-full rounded-lg border border-muted/50 bg-white px-6 py-2 text-[11px] font-black uppercase tracking-tight focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm"
                                >
                                    <option value="">{t("select_section_node")}</option>
                                    {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-3 group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">
                                {t("target_student_node")} <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedStudent}
                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                    className="flex h-14 w-full rounded-lg border border-muted/50 bg-white px-6 py-2 text-[11px] font-black uppercase tracking-tight focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm"
                                >
                                    <option value="">{t("identify_student_node")}</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.admission_no})</option>)}
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-8 border-t border-gray-50">
                        <Button
                            onClick={handleSearch}
                            disabled={searching}
                            className="btn-gradient text-white px-12 h-14 text-[11px] font-black uppercase tracking-[0.2em] gap-3 shadow-2xl shadow-orange-200/50 active:scale-95 transition-all rounded-full group"
                        >
                            {searching ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />}
                            {t("execute_nodal_lookup")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Offline Payment Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
                        <BookmarkCheck className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-black tracking-tight text-slate-700 uppercase">{t("available_virtual_assets")}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto relative min-h-[400px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] border-y border-muted/20">
                                <tr>
                                    <th className="px-8 py-6">{t("course_title")}</th>
                                    <th className="px-6 py-6 text-center">{t("sections")}</th>
                                    <th className="px-6 py-6 text-center">{t("lessons")}</th>
                                    <th className="px-6 py-6 text-center">{t("quizzes")}</th>
                                    <th className="px-6 py-6 text-center">{t("exams")}</th>
                                    <th className="px-6 py-6 text-center">{t("assignments")}</th>
                                    <th className="px-6 py-6">{t("provider")}</th>
                                    <th className="px-6 py-6 text-center">{t("original")}</th>
                                    <th className="px-6 py-6 text-center">{t("commitment")}</th>
                                    <th className="px-8 py-6 text-right">{t("commitment_action")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.length === 0 ? (
                                    <tr className="group transition-colors">
                                        <td colSpan={10} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-6">
                                                <div className="p-10 rounded-[3rem] bg-indigo-50/50 text-indigo-300 transform -rotate-3 shadow-inner">
                                                    <FileSearch className="h-16 w-16 opacity-30" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-rose-500/60 font-black text-[10px] uppercase tracking-[0.3em] bg-rose-50 px-8 py-3 rounded-full border border-rose-100 shadow-sm">{t("no_analytical_data_available")}</p>
                                                    <p className="text-[9px] uppercase font-black text-gray-400 tracking-tighter italic">{t("execute_student_lookup_to_populate_assets")}</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    courses.map((course, index) => (
                                        <tr key={course.id} className={cn(
                                            "hover:bg-indigo-50/20 border-b border-muted/10 transition-colors group",
                                            index % 2 === 0 ? 'bg-white' : 'bg-muted/5'
                                        )}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-9 w-9 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-[11px] font-black shadow-lg shadow-indigo-100 uppercase tracking-tighter">
                                                        {course.title[0]}
                                                    </div>
                                                    <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight">{course.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center tabular-nums font-black text-slate-500">{course.sections}</td>
                                            <td className="px-6 py-6 text-center tabular-nums font-black text-slate-500">{course.lessons}</td>
                                            <td className="px-6 py-6 text-center tabular-nums font-black text-slate-500">{course.quizzes}</td>
                                            <td className="px-6 py-6 text-center tabular-nums font-black text-slate-500">{course.exams}</td>
                                            <td className="px-6 py-6 text-center tabular-nums font-black text-slate-500">{course.assignments}</td>
                                            <td className="px-6 py-6">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm">{course.provider}</span>
                                            </td>
                                            <td className="px-6 py-6 text-center tabular-nums text-slate-400 line-through text-[11px] font-black opacity-50">${course.price.toFixed(2)}</td>
                                            <td className="px-6 py-6 text-center tabular-nums text-indigo-600 text-[13px] font-black">${course.current_price.toFixed(2)}</td>
                                            <td className="px-8 py-6 text-right">
                                                <Button
                                                    onClick={() => setConfirmId(course.id)}
                                                    disabled={submitting !== null}
                                                    className="h-10 px-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] gap-2 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                                                >
                                                    {submitting === course.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                                                    {t("commit")}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-8 py-8 bg-slate-50/50 border-t border-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                            {t("displaying_x_to_y_of_z_nodal_assets", { from: courses.length > 0 ? 1 : 0, to: courses.length, total: courses.length })}
                        </p>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="icon" className="h-11 w-11 rounded-lg border-muted/50 text-muted-foreground hover:bg-white transition-all shadow-sm" disabled>
                                <ChevronDown className="h-5 w-5 rotate-90" />
                            </Button>
                            <Button className="h-11 w-11 rounded-lg border-none p-0 text-white font-black text-xs active:scale-95 transition-all shadow-xl shadow-orange-500/10 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                                {courses.length > 0 ? 1 : 0}
                            </Button>
                            <Button variant="outline" size="icon" className="h-11 w-11 rounded-lg border-muted/50 text-muted-foreground hover:bg-white transition-all shadow-sm" disabled>
                                <ChevronDown className="h-5 w-5 -rotate-90" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Commitment Confirmation Dialog */}
            <AlertDialog open={confirmId !== null} onOpenChange={(open) => !open && setConfirmId(null)}>
                <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-10 max-w-lg bg-white">
                    <AlertDialogHeader>
                        <div className="h-20 w-20 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 mb-8 shadow-inner transform rotate-3">
                            <ShieldCheck className="h-10 w-10" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-gray-800 uppercase tracking-tight leading-tight">{t("confirm_asset_commitment")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-4 font-medium">
                            {t("offline_payment_commitment_description", { courseTitle: currentCourseTitle, studentName: currentStudentName })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-12 gap-4">
                        <AlertDialogCancel className="h-14 px-10 rounded-full text-[10px] font-black uppercase tracking-widest border-gray-100 hover:bg-gray-50 transition-all">{t("discard_protocol")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeAssignment}
                            className="bg-indigo-600 hover:bg-indigo-700 h-14 px-12 rounded-full text-[10px] font-black uppercase tracking-widest border-0 shadow-2xl shadow-indigo-200 active:scale-95 transition-all flex gap-3"
                        >
                            <Check className="h-4 w-4" />
                            {t("commit_assignment")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
