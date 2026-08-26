"use client";

import { useState, useEffect } from "react";
import {
    Upload,
    Download,
    ChevronDown,
    FileSpreadsheet,
    Loader2,
    Info,
    Filter,
    CheckCircle2,
    FileCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";

export default function ImportStudentPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [fetchingPrereqs, setFetchingPrereqs] = useState(true);
    const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);

    const [filters, setFilters] = useState({
        school_class_id: "",
        section_id: "",
        file: null as File | null
    });

    useEffect(() => {
        fetchPrerequisites();
    }, []);

    const fetchPrerequisites = async () => {
        try {
            const response = await api.get("/academics/classes?no_paginate=true");
            setClasses(response.data.data?.data || response.data.data || []);
        } catch (error) {
            console.error("Error fetching prerequisites:", error);
            toast("error", "Failed to load classes");
        } finally {
            setFetchingPrereqs(false);
        }
    };

    const fetchSections = async (classId: string) => {
        if (!classId) {
            setSections([]);
            return;
        }
        try {
            const response = await api.get(`/academics/sections?school_class_id=${classId}&no_paginate=true`);
            setSections(response.data.data?.data || response.data.data || []);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFilters(prev => ({ ...prev, file }));
    };

    const handleImport = async () => {
        if (!filters.school_class_id || !filters.section_id || !filters.file) {
            toast("error", "Please select Class, Section and a CSV file");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("school_class_id", filters.school_class_id);
            formData.append("section_id", filters.section_id);
            formData.append("file", filters.file);

            await api.post("/students/import", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            toast("success", "Students imported successfully");
            setFilters(prev => ({ ...prev, file: null }));
        } catch (error: any) {
            console.error("Error importing students:", error);
            const message = error.response?.data?.message || "Failed to import students";
            toast("error", message);
        } finally {
            setLoading(false);
        }
    };

    const sampleColumns = [
        "Admission No", "Roll No.", "First Name", "Middle Name", "Last Name", "Gender", "Date Of Birth",
        "Category", "Religion", "Cast", "Mobile No.", "Email", "Admission Date", "Blood Group", "House",
        "Height", "Weight", "Measurement Date", "Father Name", "Father Phone", "Father Occupation",
        "Mother Name", "Mother Phone", "Mother Occupation", "If Guardian Is", "Guardian Name",
        "Guardian Relation", "Guardian Email", "Guardian Phone", "Guardian Occupation", "Guardian Address",
        "Current Address", "Permanent Address", "Bank Account No", "Bank Name", "IFSC Code",
        "National Identification No", "Local Identification No", "RTE", "Previous School Details", "Note"
    ];

    const sampleRows = [
        ["1001", "01", "John", "M.", "Doe", "Male", "2012-05-15", "1", "Christian", "General", "9876543210", "john.doe@example.com", "2024-01-10", "O+", "1", "145", "40", "2024-01-10", "Robert Doe", "9876543211", "Engineer", "Sarah Doe", "9876543212", "Teacher", "Father", "Robert Doe", "Father", "robert@example.com", "9876543211", "Engineer", "123 Main St", "123 Main St", "123 Main St", "987654321098", "State Bank", "SBIN0001234", "NAT123456", "LOC123456", "No", "Greenwood High", "Good student"],
        ["1002", "02", "Emily", "", "Smith", "Female", "2012-08-22", "1", "Christian", "General", "9876543220", "emily.smith@example.com", "2024-01-10", "A+", "2", "142", "38", "2024-01-10", "David Smith", "9876543221", "Doctor", "Emma Smith", "9876543222", "Architect", "Mother", "Emma Smith", "Mother", "emma@example.com", "9876543222", "Architect", "456 Park Ave", "456 Park Ave", "456 Park Ave", "987654322099", "State Bank", "SBIN0001234", "NAT123457", "LOC123457", "No", "St. Mary Academy", "Excellent in art"]
    ];

    const requiredColumns = ["Admission No", "First Name", "Gender", "Date Of Birth", "If Guardian Is", "Guardian Name", "Guardian Relation", "Guardian Phone"];

    return (
        <div className="space-y-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen pb-20 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden no-print">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <FileSpreadsheet className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">Import Student</h1>
                        <p className="text-[11px] text-gray-500 mt-1">Bulk import students from CSV file</p>
                    </div>
                </div>
                <Button
                    className="btn-gradient text-white px-5 h-9 text-xs gap-1.5 shadow-md rounded-full font-bold uppercase tracking-wider cursor-pointer"
                    onClick={() => {
                        const csvContent = sampleColumns.join(",") + "\n" + sampleRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
                        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "student_import_sample.csv";
                        link.click();
                        URL.revokeObjectURL(url);
                    }}
                >
                    <Download className="h-4 w-4" />
                    Download Sample Import File
                </Button>
            </div>

            {/* Select Criteria Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-gray-100 leading-none">Select Criteria</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Follow instructions and upload CSV file matching the schema below</p>
                    </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 space-y-6">
                    {/* Instructions */}
                    <div className="p-5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/50 space-y-3 shadow-2xs">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                            <Info className="h-4 w-4 text-amber-600" />
                            Instructions & Formatting Rules
                        </div>
                        <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1.5 list-decimal list-inside font-medium leading-relaxed">
                            <li>Your CSV data should be in the format below. The first line of your CSV file should be the column headers as in the table example. Also make sure that your file is UTF-8 to avoid unnecessary encoding problems.</li>
                            <li>If the column you are trying to import is date make sure that is formatted in format <span className="font-mono font-bold text-amber-900 dark:text-amber-200 bg-amber-100/70 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">Y-m-d (2018-06-06)</span>.</li>
                            <li>Duplicate Admission Number (unique) rows will not be imported.</li>
                            <li>For student Gender use <span className="font-semibold text-gray-900 dark:text-gray-100">Male, Female, Other</span> values.</li>
                            <li>For student Blood Group use <span className="font-semibold text-gray-900 dark:text-gray-100">O+, A+, B+, AB+, O-, A-, B-, AB-</span> values.</li>
                            <li>For RTE use <span className="font-semibold text-gray-900 dark:text-gray-100">Yes, No</span> value.</li>
                            <li>For If Guardian Is use <span className="font-semibold text-gray-900 dark:text-gray-100">Father, Mother, Other</span> values.</li>
                            <li>Category name comes from category table so enter Category ID (Category ID can be found on student categories page).</li>
                            <li>Student house comes from house table so enter Student House ID (Student House ID can be found on student houses page).</li>
                        </ul>
                    </div>

                    {/* Sample Table Preview */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                CSV Schema & Sample Data Preview
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                                Scroll horizontally to view all 41 columns
                            </span>
                        </div>
                        
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-gray-900">
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[3200px]">
                                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            {sampleColumns.map(col => {
                                                const isReq = requiredColumns.includes(col);
                                                return (
                                                    <th key={col} className="px-3.5 py-3 text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 last:border-r-0 whitespace-nowrap">
                                                        {col} {isReq && <span className="text-destructive font-black">*</span>}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {sampleRows.map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-gray-50/60 transition-colors">
                                                {row.map((cell, cIdx) => (
                                                    <td key={cIdx} className="px-3.5 py-2.5 text-xs text-gray-900 dark:text-gray-100 font-semibold border-r border-gray-100 dark:border-gray-800 last:border-r-0 whitespace-nowrap">
                                                        {cell || <span className="text-gray-300 font-normal italic">-</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Form Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-1.5 group">
                            <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                Class <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 px-3.5 py-2 text-xs text-gray-900 dark:text-gray-100 font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:bg-white dark:focus-visible:bg-gray-800 transition-all appearance-none cursor-pointer"
                                    value={filters.school_class_id}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFilters(prev => ({ ...prev, school_class_id: val, section_id: "" }));
                                        fetchSections(val);
                                    }}
                                >
                                    <option value="" className="text-gray-400">Select Class</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id} className="text-gray-900 font-medium">{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5 group">
                            <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                Section <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 px-3.5 py-2 text-xs text-gray-900 dark:text-gray-100 font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:bg-white dark:focus-visible:bg-gray-800 transition-all appearance-none cursor-pointer"
                                    value={filters.section_id}
                                    onChange={(e) => setFilters(prev => ({ ...prev, section_id: e.target.value }))}
                                >
                                    <option value="" className="text-gray-400">Select Section</option>
                                    {sections.map(s => (
                                        <option key={s.id} value={s.id} className="text-gray-900 font-medium">{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5">
                                Select CSV File <span className="text-destructive">*</span>
                            </label>
                            <div className="relative h-28 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50/40 dark:bg-gray-800/40 flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition-all group/upload overflow-hidden">
                                <div className="flex flex-col items-center gap-2 pointer-events-none text-center px-4">
                                    {filters.file ? (
                                        <>
                                            <FileCheck className="h-7 w-7 text-emerald-600 animate-bounce" />
                                            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                                {filters.file.name} ({(filters.file.size / 1024).toFixed(1)} KB)
                                            </span>
                                            <span className="text-[10px] text-emerald-600 font-semibold">Click or drop another file to replace</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-7 w-7 text-gray-400 group-hover/upload:text-indigo-600 transition-colors" />
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 group-hover/upload:text-indigo-600">
                                                Drag and drop your CSV file here or click to browse
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium">Only .csv files encoded in UTF-8 are supported</span>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            className="btn-gradient text-white h-10 px-8 text-xs font-bold uppercase tracking-wider rounded-full shadow-md cursor-pointer"
                            onClick={handleImport}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import Student
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
