"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, GraduationCap, BookOpen, FileSearch, AlertCircle } from "lucide-react";
import api from "@/lib/api";

interface ExamGroup {
    id: number;
    name: string;
    exams: { id: number; name: string }[];
}

interface ExamResult {
    subject_name: string;
    marks: string | null;
    theory_marks: string | null;
    practical_marks: string | null;
    is_absent: boolean;
}

export function ExamResultSection() {
    const [admissionNo, setAdmissionNo] = useState("");
    const [examId, setExamId] = useState("");
    const [examGroups, setExamGroups] = useState<ExamGroup[]>([]);
    const [loadingExams, setLoadingExams] = useState(true);
    const [searching, setSearching] = useState(false);
    const [result, setResult] = useState<{
        student: {
            name: string;
            last_name: string;
            admission_no: string;
            roll_no: string;
            class_name?: string;
            section_name?: string;
        } | null;
        exam_results: ExamResult[];
    } | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get("examination/public/exam-list");
                setExamGroups(res.data?.exam_groups || []);
            } catch {
                setError("Failed to load exam list.");
            } finally {
                setLoadingExams(false);
            }
        };
        fetchExams();
    }, []);

    const flattenExams = () => {
        const list: { id: number; name: string; group: string }[] = [];
        for (const group of examGroups) {
            for (const exam of group.exams || []) {
                list.push({ ...exam, group: group.name });
            }
        }
        return list;
    };

    const handleSearch = async () => {
        if (!admissionNo.trim()) { setError("Please enter Admission No."); return; }
        if (!examId) { setError("Please select an Exam."); return; }
        setError("");
        setSearching(true);
        setResult(null);
        try {
            const res = await api.post("examination/public/search-by-admission", {
                admission_no: admissionNo.trim(),
                exam_id: Number(examId),
            });
            if (res.data?.found) {
                setResult(res.data);
            } else {
                setError(res.data?.message || "No result found.");
            }
        } catch {
            setError("Failed to search. Try again.");
        } finally {
            setSearching(false);
        }
    };

    const exams = flattenExams();

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Exam Result
                </h3>
            </div>

            <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-700">
                            Admission No <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            value={admissionNo}
                            onChange={(e) => setAdmissionNo(e.target.value)}
                            placeholder="e.g. 2026001"
                            className="h-10"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-700">
                            Exam <span className="text-red-500">*</span>
                        </Label>
                        <Select value={examId} onValueChange={setExamId} disabled={loadingExams}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder={loadingExams ? "Loading..." : "Select Exam"} />
                            </SelectTrigger>
                            <SelectContent>
                                {exams.map((exam) => (
                                    <SelectItem key={exam.id} value={String(exam.id)}>
                                        {exam.name} ({exam.group})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Button
                            onClick={handleSearch}
                            disabled={searching || loadingExams}
                            className="h-10 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white gap-2"
                        >
                            {searching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                            {searching ? "Searching..." : "Search"}
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {result && result.student && (
                    <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                        <div className="bg-gray-50 px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                            <span><strong>Name:</strong> {result.student.name} {result.student.last_name}</span>
                            <span><strong>Admission No:</strong> {result.student.admission_no}</span>
                            <span><strong>Roll No:</strong> {result.student.roll_no}</span>
                            {result.student.class_name && <span><strong>Class:</strong> {result.student.class_name}{result.student.section_name ? ` - ${result.student.section_name}` : ""}</span>}
                        </div>

                        {result.exam_results.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="text-left px-4 py-3 font-semibold text-gray-700">Subject</th>
                                            <th className="text-center px-4 py-3 font-semibold text-gray-700">Marks</th>
                                            <th className="text-center px-4 py-3 font-semibold text-gray-700">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {result.exam_results.map((r, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50">
                                                <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                                                    <BookOpen className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                    {r.subject_name}
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-700">{r.is_absent ? "—" : r.marks ?? "-"}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {r.is_absent ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">ABSENT</span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">PRESENT</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-10 text-gray-400">
                                <FileSearch className="h-10 w-10 mb-2" />
                                <p className="text-sm">No exam results available for this student.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
