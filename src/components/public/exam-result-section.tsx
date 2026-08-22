"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Loader2,
    Search,
    GraduationCap,
    BookOpen,
    AlertCircle,
    Printer,
    Award,
    Clock,
    UserCheck,
    RotateCcw
} from "lucide-react";
import api from "@/lib/api";
import { useSettings } from "@/components/providers/settings-provider";
import { useImageUrl } from "@/lib/image-url";

interface ExamItem {
    id: number;
    name: string;
    session?: string;
    is_result_published?: boolean;
    group?: string;
}

interface ExamGroup {
    id: number;
    name: string;
    exams: ExamItem[];
}

interface ExamResultItem {
    subject_name: string;
    marks: string | number | null;
    theory_marks: string | number | null;
    practical_marks: string | number | null;
    is_absent: boolean;
}

interface SearchResponse {
    found: boolean;
    published?: boolean;
    message?: string;
    exam?: {
        id: number;
        name: string;
        group?: string;
        session?: string;
    };
    student?: {
        id: number;
        admission_no: string;
        roll_no: string;
        name: string;
        last_name?: string;
        class_name?: string;
        section_name?: string;
    };
    exam_results?: ExamResultItem[];
}

export function ExamResultSection() {
    const { settings } = useSettings();
    const getImageUrl = useImageUrl();

    const [rollNo, setRollNo] = useState("");
    const [examId, setExamId] = useState("");
    const [examGroups, setExamGroups] = useState<ExamGroup[]>([]);
    const [loadingExams, setLoadingExams] = useState(true);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [notPublished, setNotPublished] = useState(false);
    const [result, setResult] = useState<SearchResponse | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    // Fetch exams list
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get("examination/public/exam-list");
                const groups = res.data?.exam_groups || [];
                setExamGroups(groups);

                // Auto-select first exam if available
                const allExams: ExamItem[] = [];
                groups.forEach((g: ExamGroup) => {
                    (g.exams || []).forEach((e: ExamItem) => {
                        allExams.push({ ...e, group: g.name });
                    });
                });
                if (allExams.length > 0 && !examId) {
                    setExamId(String(allExams[0].id));
                }
            } catch {
                setErrorMessage("Unable to load exam lists. Please try refreshing.");
            } finally {
                setLoadingExams(false);
            }
        };
        fetchExams();
    }, [examId]);

    const flattenExams = (): ExamItem[] => {
        const list: ExamItem[] = [];
        for (const group of examGroups) {
            for (const exam of group.exams || []) {
                list.push({ ...exam, group: group.name });
            }
        }
        return list;
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const trimmedRoll = rollNo.trim();
        if (!trimmedRoll) {
            setErrorMessage("Please enter your Roll Number.");
            return;
        }
        if (!examId) {
            setErrorMessage("Please select an Examination.");
            return;
        }

        setErrorMessage("");
        setNotPublished(false);
        setResult(null);
        setSearching(true);
        setHasSearched(true);

        try {
            const res = await api.post("examination/public/search", {
                roll_no: trimmedRoll,
                exam_id: Number(examId),
            });

            const data: SearchResponse = res.data;

            if (data.published === false || (data.message && data.message.toLowerCase().includes("not published"))) {
                setNotPublished(true);
                setErrorMessage(data.message || "Result Not published Yet.");
            } else if (data.found && data.student) {
                setResult(data);
            } else {
                setErrorMessage(data.message || `No result found for Roll Number: ${trimmedRoll}`);
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            const msg = error.response?.data?.message || error.message || "";
            if (msg.toLowerCase().includes("not published")) {
                setNotPublished(true);
                setErrorMessage(msg || "Result Not published Yet.");
            } else {
                setErrorMessage(msg || "Failed to search result. Please check your Roll Number and try again.");
            }
        } finally {
            setSearching(false);
        }
    };

    const handleReset = () => {
        setRollNo("");
        setResult(null);
        setErrorMessage("");
        setNotPublished(false);
        setHasSearched(false);
    };

    const exams = flattenExams();

    // Calculations for marksheet summary
    const examResults = result?.exam_results || [];
    const totalSubjects = examResults.length;
    let totalMarksObtained = 0;
    let anyAbsent = false;

    examResults.forEach((r) => {
        if (r.is_absent) {
            anyAbsent = true;
        } else if (r.marks !== null && r.marks !== undefined) {
            totalMarksObtained += Number(r.marks) || 0;
        }
    });

    const maxMarks = totalSubjects * 100;
    const percentage = maxMarks > 0 ? ((totalMarksObtained / maxMarks) * 100).toFixed(2) : "0.00";

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Search Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] px-6 py-5 text-white">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold tracking-tight">Search Examination Result</h2>
                            <p className="text-xs text-white/90">
                                Enter your Roll Number to view and print your marksheet
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="p-6 sm:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* 1. Exam Selection */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                Select Examination <span className="text-red-500">*</span>
                            </Label>
                            <Select value={examId} onValueChange={setExamId} disabled={loadingExams}>
                                <SelectTrigger className="h-11 border-slate-300 dark:border-slate-700 text-sm">
                                    <SelectValue placeholder={loadingExams ? "Loading examinations..." : "Select Examination"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.length > 0 ? (
                                        exams.map((exam) => (
                                            <SelectItem key={exam.id} value={String(exam.id)}>
                                                {exam.name} {exam.group ? `(${exam.group})` : ""} {exam.session ? `- ${exam.session}` : ""}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="none" disabled>
                                            No examinations available
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 2. Roll Number */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                Student Roll Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                value={rollNo}
                                onChange={(e) => {
                                    setRollNo(e.target.value);
                                    setErrorMessage("");
                                    setNotPublished(false);
                                }}
                                placeholder="Enter your Roll No (e.g. 101, 202601)"
                                className="h-11 border-slate-300 dark:border-slate-700 text-sm focus-visible:ring-indigo-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={searching || loadingExams}
                            className="h-11 px-8 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white font-bold shadow-md gap-2"
                        >
                            {searching ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Searching Result...</span>
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4" />
                                    <span>Search Result</span>
                                </>
                            )}
                        </Button>

                        {hasSearched && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleReset}
                                className="h-11 px-5 border-slate-300 dark:border-slate-700 gap-1.5"
                            >
                                <RotateCcw className="h-4 w-4 text-slate-500" />
                                <span>Reset</span>
                            </Button>
                        )}
                    </div>
                </form>
            </div>

            {/* CASE 1: Result Not Published Yet Banner */}
            {notPublished && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-2xl p-6 sm:p-8 text-center shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-3">
                        <Clock className="h-7 w-7 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200">
                        Result Not published Yet
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 max-w-md mx-auto mt-2">
                        The examination results for this session are currently under evaluation or awaiting official publication. Please check back later.
                    </p>
                </div>
            )}

            {/* CASE 2: Error Message (Student not found, etc.) */}
            {!notPublished && errorMessage && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-5 flex items-center gap-3 text-red-700 dark:text-red-300 animate-in fade-in duration-200">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                    <span className="text-sm font-medium">{errorMessage}</span>
                </div>
            )}

            {/* CASE 3: Result Details Marksheet */}
            {result && result.student && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden animate-in fade-in duration-300 print:shadow-none print:border-none">
                    
                    {/* Marksheet Header */}
                    <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-center sm:text-left">
                            <div className="h-16 w-16 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 shrink-0 shadow-xs">
                                {settings?.app_logo || settings?.admin_logo ? (
                                    <img
                                        src={getImageUrl(settings.app_logo || settings.admin_logo)}
                                        alt={settings?.school_name || "Logo"}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                ) : (
                                    <GraduationCap className="h-9 w-9 text-indigo-600 dark:text-indigo-400" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                                    {settings?.school_name || "Bhujpur Government Primary School"}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Academic Marksheet &bull; {result.exam?.name || "Term Exam"} {result.exam?.session ? `(${result.exam.session})` : ""}
                                </p>
                            </div>
                        </div>

                        {/* Print Button */}
                        <div className="print:hidden">
                            <Button
                                onClick={() => window.print()}
                                variant="outline"
                                className="border-slate-300 dark:border-slate-700 gap-2 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600"
                            >
                                <Printer className="h-4 w-4" />
                                <span>Print Marksheet</span>
                            </Button>
                        </div>
                    </div>

                    {/* Student Info Card */}
                    <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Name</span>
                                <p className="font-bold text-slate-900 dark:text-white">
                                    {result.student.name} {result.student.last_name || ""}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Roll Number</span>
                                <p className="font-bold text-indigo-600 dark:text-indigo-400">
                                    {result.student.roll_no || rollNo}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Admission No</span>
                                <p className="font-medium text-slate-800 dark:text-slate-200">
                                    {result.student.admission_no || "—"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Class & Section</span>
                                <p className="font-medium text-slate-800 dark:text-slate-200">
                                    {result.student.class_name || "General"} {result.student.section_name ? `(${result.student.section_name})` : ""}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Subjects Marks Table */}
                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-100/75 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                                        <th className="text-left py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">#</th>
                                        <th className="text-left py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">Subject</th>
                                        <th className="text-center py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">Theory</th>
                                        <th className="text-center py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">Practical</th>
                                        <th className="text-center py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">Marks Obtained</th>
                                        <th className="text-center py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {examResults.length > 0 ? (
                                        examResults.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                                <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                                                <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className="h-4 w-4 text-indigo-500 shrink-0" />
                                                        <span>{item.subject_name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                                                    {item.theory_marks ?? "—"}
                                                </td>
                                                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                                                    {item.practical_marks ?? "—"}
                                                </td>
                                                <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                                                    {item.is_absent ? "—" : (item.marks ?? "0")}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {item.is_absent ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded-md">
                                                            ABSENT
                                                        </span>
                                                    ) : Number(item.marks || 0) >= 33 ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md">
                                                            <UserCheck className="h-3.5 w-3.5" />
                                                            PASSED
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-md">
                                                            NEEDS IMPR.
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-slate-400">
                                                No individual subject marks available for this exam.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary & Result Card */}
                        {examResults.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Marks</span>
                                    <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                                        {totalMarksObtained} <span className="text-xs font-normal text-slate-500">/ {maxMarks}</span>
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Percentage</span>
                                    <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                                        {percentage}%
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overall Status</span>
                                    <p className={`text-xl font-extrabold mt-1 ${anyAbsent ? 'text-red-600' : Number(percentage) >= 33 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {anyAbsent ? "ABSENT" : Number(percentage) >= 33 ? "PASSED" : "FAILED"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
