"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Upload, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";

export default function ImportQuestionBankPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const tt = useTranslateToast();

    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvData, setCsvData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === "text/csv" || file.name.endsWith(".csv")) {
                setCsvFile(file);
                parseCSV(file);
            } else {
                tt.error("please_upload_csv");
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type === "text/csv" || file.name.endsWith(".csv")) {
                setCsvFile(file);
                parseCSV(file);
            } else {
                tt.error("please_upload_csv");
            }
        }
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) return;
            
            // Simple CSV parsing (assuming no commas inside quotes for now)
            const rows = text.split('\n').filter(row => row.trim().length > 0);
            if (rows.length < 2) {
                tt.error("csv_must_have_header_and_data");
                return;
            }

            const headers = rows[0].split(',').map(h => h.trim());
            const parsedData = rows.slice(1).map(row => {
                const values = row.split(',').map(v => v.trim());
                const rowData: Record<string, any> = {};
                headers.forEach((header, index) => {
                    rowData[header] = values[index] || "";
                });
                return rowData;
            });
            setCsvData(parsedData);
        };
        reader.readAsText(file);
    };

    const handleDownloadSample = () => {
        // CSV headers
        const headers = [
            "class_name",
            "section",
            "subject",
            "question_type",
            "level",
            "question",
            "option_a",
            "option_b",
            "option_c",
            "option_d",
            "correct_answer"
        ];

        // Sample data row
        const sampleData = [
            "Class 1",
            "A",
            "Mathematics",
            "Single Choice",
            "Low",
            "What is 2+2?",
            "3",
            "4",
            "5",
            "6",
            "B"
        ];

        // Create CSV content
        const csvContent = [
            headers.join(","),
            sampleData.join(",")
        ].join("\n");

        // Create blob and download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", "question_import_sample.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = async () => {
        if (!csvFile || csvData.length === 0) {
            tt.error("please_select_csv_to_import");
            return;
        }

        setLoading(true);
        try {
            // Map the parsed CSV data to the API expected payload format
            const questions = csvData.map(row => ({
                class_name: row.class_name,
                section: row.section,
                subject: row.subject,
                question_type: row.question_type,
                level: row.level,
                question: row.question,
                options: [row.option_a, row.option_b, row.option_c, row.option_d].filter(Boolean),
                correct_answer: row.correct_answer
            }));

            await api.post('/online-examination/questions/import', { questions });
            tt.success("questions_imported_successfully");
            
            router.push("/dashboard/online-examinations/question-bank");
        } catch (error) {
            console.error("Import error:", error);
            tt.error("bulk_import_failed");
        } finally {
            setLoading(false);
        }
    };

    const gradientBtn = "bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-200/50 transition-all duration-300 border-none rounded-full";

    return (
        <div className="p-4 lg:p-6 space-y-6 bg-gray-50/10 min-h-screen font-sans animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.back()}
                        className="h-9 w-9 rounded-full bg-white/60 hover:bg-white text-gray-700 shadow-sm transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                        <Upload className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("import_questions")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("import_multiple_questions_via_csv")}</p>
                    </div>
                </div>
                <Button onClick={handleDownloadSample} variant="outline" className="h-10 px-6 rounded-full text-xs font-bold uppercase tracking-widest border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex gap-2">
                    <Download className="h-4 w-4" /> {t("download_sample")}
                </Button>
            </div>

            {/* Content Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                
                {/* Upload Section */}
                <div className="p-6 md:p-8">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-6">{t("upload_csv_file")}</h2>
                    
                    <div 
                        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all duration-300 ${
                            dragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-indigo-300"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="h-16 w-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-indigo-500">
                            <Upload className="h-8 w-8" />
                        </div>
                        <h3 className="text-base font-bold text-gray-800 mb-2">{t("drag_and_drop_file_here")}</h3>
                        <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
                            {t("upload_a_csv_file_containing_the_questions_data")}
                        </p>
                        
                        <input
                            type="file"
                            id="csv-upload"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <Label 
                            htmlFor="csv-upload"
                            className="cursor-pointer bg-white border border-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-full text-xs uppercase tracking-wider hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                        >
                            {t("browse_files")}
                        </Label>
                        
                        {csvFile && (
                            <div className="mt-6 pt-4 border-t border-gray-200 w-full max-w-md text-center">
                                <p className="text-sm font-medium text-emerald-600 flex items-center justify-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                    {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Instructions Card */}
                    <div className="mt-8 bg-amber-50 rounded-xl p-5 border border-amber-100 flex gap-4 items-start">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-800 mb-1">{t("import_instructions")}</h4>
                            <ul className="text-xs text-amber-700/80 space-y-2 list-disc pl-4 mt-3 leading-relaxed">
                                <li>{t("download_the_sample_file_and_fill_it_with_your_data")}</li>
                                <li>{t("do_not_change_the_column_headers_in_the_sample_file")}</li>
                                <li>{t("class_section_and_subject_must_match_exactly_with_system_records")}</li>
                                <li>{t("for_question_type_use_one_of_single_choice_multiple_choice_true_false_descriptive")}</li>
                                <li>{t("for_level_use_one_of_low_medium_high")}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 md:p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => router.back()}
                        className="h-11 px-8 rounded-full text-xs font-bold uppercase tracking-widest border-gray-200"
                    >
                        {t("cancel")}
                    </Button>
                    <Button 
                        onClick={handleImport} 
                        disabled={!csvFile || loading}
                        className={`h-11 px-8 text-xs font-bold uppercase tracking-widest ${gradientBtn}`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {t("importing")}
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Upload className="h-4 w-4" /> {t("import_data")}
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
