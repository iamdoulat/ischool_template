"use client";

import { useState, useEffect } from "react";
import {
    Upload,
    Download,
    ChevronDown,
    FileSpreadsheet,
    AlertCircle,
    Loader2,
    Info
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function ImportStudentPage() {
    const { toast } = useToast();
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
            const [classesRes, sectionsRes] = await Promise.all([
                api.get("/classes?limit=100"),
                api.get("/sections?limit=100")
            ]);
            setClasses(classesRes.data.data.data);
            setSections(sectionsRes.data.data.data);
        } catch (error) {
            console.error("Error fetching prerequisites:", error);
            toast("error", "Failed to load classes and sections");
        } finally {
            setFetchingPrereqs(false);
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <FileSpreadsheet className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Import Student</h1>
                        <p className="text-sm text-muted-foreground">Bulk import students from CSV file</p>
                    </div>
                </div>
                <Button variant="default" className="h-10 px-6 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl shadow-lg shadow-primary/20">
                    <Download className="h-4 w-4 mr-2" />
                    Download Sample Import File
                </Button>
            </div>

            {/* Select Criteria Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-muted/50 flex items-center justify-between bg-muted/20">
                    <h2 className="font-bold text-lg tracking-tight">Select Criteria</h2>
                </div>
                <CardContent className="p-8 space-y-8">
                    {/* Instructions */}
                    <div className="p-6 bg-muted/10 rounded-2xl border border-muted/30 space-y-3">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm mb-4">
                            <Info className="h-4 w-4" />
                            Instructions
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                            <li>Your CSV data should be in the format below. The first line of your CSV file should be the column headers as in the table example. Also make sure that your file is UTF-8 to avoid unnecessary encoding problems.</li>
                            <li>If the column you are trying to import is date make sure that is formatted in format Y-m-d (2018-06-06).</li>
                            <li>Duplicate Admission Number (unique) rows will not be imported.</li>
                            <li>For student Gender use Male, Female value.</li>
                            <li>For student Blood Group use O+, A+, B+, AB+, O-, A-, B-, AB- value.</li>
                            <li>For RTE use Yes, No value.</li>
                            <li>For If Guardian Is user father,mother,other value.</li>
                            <li>Category name comes from other table so for category, enter Category Id (Category Id can be found on category page ).</li>
                            <li>Student house comes from other table so for student house, enter Student House Id (Student House Id can be found on student house page ).</li>
                        </ul>
                    </div>

                    {/* Sample Table */}
                    <div className="space-y-4">
                        <div className="h-[200px] border border-muted/50 rounded-2xl overflow-hidden bg-muted/5">
                            <div className="w-full overflow-x-auto h-full scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                                <table className="w-full text-left border-collapse min-w-[3000px]">
                                    <thead className="bg-muted/10 sticky top-0">
                                        <tr>
                                            {sampleColumns.map(col => (
                                                <th key={col} className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-muted/30 whitespace-nowrap">
                                                    {["Admission No", "First Name", "Gender", "Date Of Birth", "If Guardian Is", "Guardian Name", "Guardian Relation", "Guardian Phone"].includes(col) ? (
                                                        <span className="flex items-center gap-1">
                                                            {col} <span className="text-destructive">*</span>
                                                        </span>
                                                    ) : col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-muted/20 hover:bg-muted/10 transition-colors">
                                            {sampleColumns.map((col, idx) => (
                                                <td key={idx} className="px-4 py-4 text-sm text-muted-foreground italic whitespace-nowrap">
                                                    Sample Data
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Form Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                Class <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-12 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                    value={filters.school_class_id}
                                    onChange={(e) => setFilters(prev => ({ ...prev, school_class_id: e.target.value }))}
                                >
                                    <option value="">Select</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                Section <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-12 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                    value={filters.section_id}
                                    onChange={(e) => setFilters(prev => ({ ...prev, section_id: e.target.value }))}
                                >
                                    <option value="">Select</option>
                                    {sections.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                Select CSV File <span className="text-destructive">*</span>
                            </label>
                            <div className="relative h-24 border-2 border-dashed border-muted-foreground/30 rounded-2xl bg-muted/30 flex items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all group/upload overflow-hidden">
                                <div className="flex flex-col items-center gap-2 pointer-events-none">
                                    <Upload className="h-6 w-6 text-muted-foreground group-hover/upload:text-primary transition-colors" />
                                    <span className="text-sm font-semibold text-muted-foreground group-hover/upload:text-foreground">
                                        {filters.file ? filters.file.name : "Drag and drop a file here or click"}
                                    </span>
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

                    <div className="flex justify-end pt-4">
                        <Button
                            variant="default"
                            className="h-12 px-12 text-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl shadow-lg shadow-primary/20"
                            onClick={handleImport}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                "Import Student"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
