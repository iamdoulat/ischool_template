"use client";

import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
    Upload,
    FileSpreadsheet,
    ArrowRight,
    CheckCircle2,
    AlertTriangle,
    Download,
    X,
    Loader2,
    MapPin,
    Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// The fields that our system expects
const SYSTEM_FIELDS = [
    { key: "admission_no", label: "Admission No", required: true },
    { key: "roll_no", label: "Roll Number", required: false },
    { key: "name", label: "Student Name", required: true },
    { key: "attendance", label: "Attendance Status", required: true },
    { key: "date", label: "Date", required: false },
    { key: "entry_time", label: "Entry Time", required: false },
    { key: "exit_time", label: "Exit Time", required: false },
    { key: "note", label: "Note", required: false },
];

const VALID_ATTENDANCE = ["present", "late", "absent", "holiday", "half_day"];

interface CsvImportDialogProps {
    onImport: (records: any[]) => void;
    attendanceDate: string;
    selectedClass: string;
    selectedSection: string;
}

type ImportStep = "upload" | "mapping" | "preview" | "done";

export default function CsvImportDialog({
    onImport,
    attendanceDate,
    selectedClass,
    selectedSection,
}: CsvImportDialogProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<ImportStep>("upload");
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setStep("upload");
        setCsvHeaders([]);
        setCsvData([]);
        setMapping({});
        setPreviewData([]);
        setErrors([]);
        setFileName("");
        setIsDragging(false);
    };

    const handleOpenChange = (val: boolean) => {
        setOpen(val);
        if (!val) resetState();
    };

    // ─── Step 1: File Upload & Parse ───────────────────────────────
    const parseFile = (file: File) => {
        if (!file.name.endsWith(".csv")) {
            toast.error("Invalid file type", { description: "Please upload a .csv file" });
            return;
        }
        setFileName(file.name);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    toast.error("CSV Parse Error", {
                        description: results.errors[0].message,
                    });
                    return;
                }
                const headers = results.meta.fields || [];
                const data = results.data as Record<string, string>[];

                if (headers.length === 0 || data.length === 0) {
                    toast.error("Empty CSV", { description: "The CSV file has no data rows." });
                    return;
                }

                setCsvHeaders(headers);
                setCsvData(data);

                // Auto-map columns with fuzzy matching
                const autoMap: Record<string, string> = {};
                SYSTEM_FIELDS.forEach((field) => {
                    const exact = headers.find(
                        (h) => h.toLowerCase().replace(/[\s_-]/g, "") === field.key.replace(/_/g, "")
                    );
                    if (exact) {
                        autoMap[field.key] = exact;
                        return;
                    }
                    // Try partial match
                    const partial = headers.find((h) =>
                        h.toLowerCase().includes(field.key.replace(/_/g, "")) ||
                        field.label.toLowerCase().split(" ").some(word => h.toLowerCase().includes(word))
                    );
                    if (partial && !Object.values(autoMap).includes(partial)) {
                        autoMap[field.key] = partial;
                    }
                });
                setMapping(autoMap);
                setStep("mapping");
                toast.success("File parsed!", {
                    description: `Found ${headers.length} columns and ${data.length} rows`,
                    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
                });
            },
        });
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) parseFile(file);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) parseFile(file);
    };

    // ─── Step 2: Column Mapping ────────────────────────────────────
    const handleMappingChange = (systemField: string, csvColumn: string) => {
        setMapping((prev) => ({ ...prev, [systemField]: csvColumn === "__skip__" ? "" : csvColumn }));
    };

    const validateMapping = (): boolean => {
        const errs: string[] = [];
        SYSTEM_FIELDS.filter((f) => f.required).forEach((field) => {
            if (!mapping[field.key]) {
                errs.push(`"${field.label}" is required but not mapped.`);
            }
        });
        setErrors(errs);
        return errs.length === 0;
    };

    const handleProceedToPreview = () => {
        if (!validateMapping()) return;

        // Transform CSV data using the mapping
        const transformed = csvData.map((row, idx) => {
            const admNo = mapping.admission_no ? row[mapping.admission_no]?.trim() || "" : "";
            const rollNo = mapping.roll_no ? row[mapping.roll_no]?.trim() || "" : "";
            const name = mapping.name ? row[mapping.name]?.trim() || "" : "";
            let att = mapping.attendance ? row[mapping.attendance]?.trim().toLowerCase() || "present" : "present";
            // Normalize attendance value
            if (!VALID_ATTENDANCE.includes(att)) {
                if (att === "p" || att === "yes" || att === "1") att = "present";
                else if (att === "a" || att === "no" || att === "0") att = "absent";
                else if (att === "l") att = "late";
                else if (att === "h" || att === "hd") att = "half_day";
                else att = "present";
            }
            const entryTime = mapping.entry_time ? row[mapping.entry_time]?.trim() || "" : "";
            const exitTime = mapping.exit_time ? row[mapping.exit_time]?.trim() || "" : "";
            const note = mapping.note ? row[mapping.note]?.trim() || "" : "";

            return {
                id: idx + 1,
                student_id: idx + 1,
                admission_no: admNo || "-",
                roll_no: rollNo || "-",
                name: name || `Student ${idx + 1}`,
                attendance: att as any,
                reason: "CSV Import",
                entry_time: entryTime,
                exit_time: exitTime,
                note,
            };
        });

        setPreviewData(transformed);
        setStep("preview");
    };

    // ─── Step 3: Preview & Confirm ─────────────────────────────────
    const handleConfirmImport = () => {
        onImport(previewData);
        setStep("done");
        toast.success("Import Complete!", {
            description: `${previewData.length} records imported successfully. Review and save.`,
            icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        });
        setTimeout(() => {
            setOpen(false);
            resetState();
        }, 1200);
    };

    // ─── Step indicators ───────────────────────────────────────────
    const steps: { key: ImportStep; label: string; num: number }[] = [
        { key: "upload", label: "Upload", num: 1 },
        { key: "mapping", label: "Map Columns", num: 2 },
        { key: "preview", label: "Preview", num: 3 },
    ];

    const currentStepIdx = steps.findIndex((s) => s.key === step);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="h-9 text-xs font-bold uppercase border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-full px-5 gap-2 transition-all"
                >
                    <Upload className="h-3.5 w-3.5" />
                    Import CSV
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-[680px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            Bulk CSV Attendance Import
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100 text-xs mt-1">
                            Upload a CSV file to import attendance records for the selected class & section.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mt-5">
                        {steps.map((s, i) => (
                            <div key={s.key} className="flex items-center gap-2">
                                <div
                                    className={cn(
                                        "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all",
                                        i <= currentStepIdx
                                            ? "bg-white text-indigo-600 shadow-md"
                                            : "bg-white/20 text-white/60"
                                    )}
                                >
                                    {i < currentStepIdx ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                        s.num
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        "text-[11px] font-semibold",
                                        i <= currentStepIdx ? "text-white" : "text-white/50"
                                    )}
                                >
                                    {s.label}
                                </span>
                                {i < steps.length - 1 && (
                                    <ArrowRight className="h-3 w-3 text-white/30 mx-1" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                    {/* ──────── STEP 1: Upload ──────── */}
                    {step === "upload" && (
                        <div className="space-y-5">
                            {/* Drop zone */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all",
                                    isDragging
                                        ? "border-indigo-400 bg-indigo-50/50 scale-[1.01]"
                                        : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50/50"
                                )}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <div className="flex flex-col items-center gap-3">
                                    <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center">
                                        <Upload className="h-6 w-6 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700">
                                            Drop your CSV file here
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            or click to browse • .csv files only
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Download sample */}
                            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                                <div className="flex items-start gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                        <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-700">
                                            Need a template?
                                        </p>
                                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                                            Download our sample CSV with the correct format.
                                            Columns: admission_no, roll_no, name, attendance, date,
                                            entry_time, exit_time, note
                                        </p>
                                        <a
                                            href="/samples/attendance_sample.csv"
                                            download="attendance_sample.csv"
                                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 mt-2 transition-colors"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            Download Sample CSV
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ──────── STEP 2: Column Mapping ──────── */}
                    {step === "mapping" && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin className="h-4 w-4 text-indigo-500" />
                                <p className="text-xs font-bold text-gray-700">
                                    Map CSV columns to system fields
                                </p>
                            </div>
                            <p className="text-[11px] text-gray-400 -mt-3">
                                File: <span className="font-semibold text-gray-600">{fileName}</span>{" "}
                                • {csvData.length} rows found
                            </p>

                            {errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                                    {errors.map((err, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[11px] text-red-600">
                                            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                            {err}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                                            <TableHead className="text-[10px] font-bold uppercase text-gray-500 py-2.5 px-4 w-[200px]">
                                                System Field
                                            </TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase text-gray-500 py-2.5 px-2 w-[30px] text-center">
                                                →
                                            </TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase text-gray-500 py-2.5 px-4">
                                                CSV Column
                                            </TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase text-gray-500 py-2.5 px-4 text-center w-[80px]">
                                                Status
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {SYSTEM_FIELDS.map((field) => (
                                            <TableRow key={field.key} className="hover:bg-gray-50/50">
                                                <TableCell className="py-2 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-semibold text-gray-700">
                                                            {field.label}
                                                        </span>
                                                        {field.required && (
                                                            <span className="text-[9px] bg-red-50 text-red-500 font-bold px-1.5 py-0.5 rounded">
                                                                REQ
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2 px-2 text-center">
                                                    <ArrowRight className="h-3 w-3 text-gray-300 mx-auto" />
                                                </TableCell>
                                                <TableCell className="py-2 px-4">
                                                    <Select
                                                        value={mapping[field.key] || "__skip__"}
                                                        onValueChange={(val) =>
                                                            handleMappingChange(field.key, val)
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-[11px] border-gray-200 rounded shadow-none">
                                                            <SelectValue placeholder="Skip (not mapped)" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="__skip__">
                                                                <span className="text-gray-400">— Skip —</span>
                                                            </SelectItem>
                                                            {csvHeaders.map((h) => (
                                                                <SelectItem key={h} value={h}>
                                                                    {h}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="py-2 px-4 text-center">
                                                    {mapping[field.key] ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                                    ) : field.required ? (
                                                        <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto" />
                                                    ) : (
                                                        <span className="text-[10px] text-gray-300">—</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* ──────── STEP 3: Preview ──────── */}
                    {step === "preview" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-indigo-500" />
                                <p className="text-xs font-bold text-gray-700">
                                    Preview Import Data
                                </p>
                                <span className="ml-auto text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">
                                    {previewData.length} records
                                </span>
                            </div>

                            <div className="rounded-xl border border-gray-100 overflow-x-auto max-h-[280px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 z-10">
                                        <TableRow className="bg-gray-50/95 hover:bg-gray-50/95 text-[10px] font-bold uppercase text-gray-500">
                                            <TableHead className="py-2.5 px-3 w-8">#</TableHead>
                                            <TableHead className="py-2.5 px-3">Adm. No</TableHead>
                                            <TableHead className="py-2.5 px-3">Roll</TableHead>
                                            <TableHead className="py-2.5 px-3">Name</TableHead>
                                            <TableHead className="py-2.5 px-3">Status</TableHead>
                                            <TableHead className="py-2.5 px-3">Entry</TableHead>
                                            <TableHead className="py-2.5 px-3">Exit</TableHead>
                                            <TableHead className="py-2.5 px-3">Note</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.slice(0, 20).map((row, idx) => (
                                            <TableRow key={idx} className="text-[11px] hover:bg-gray-50/50">
                                                <TableCell className="py-2 px-3 text-gray-400">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 font-semibold text-indigo-600">
                                                    {row.admission_no}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 text-gray-600">
                                                    {row.roll_no}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 font-semibold text-gray-800">
                                                    {row.name}
                                                </TableCell>
                                                <TableCell className="py-2 px-3">
                                                    <span
                                                        className={cn(
                                                            "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize",
                                                            row.attendance === "present" &&
                                                                "bg-green-50 text-green-600",
                                                            row.attendance === "absent" &&
                                                                "bg-red-50 text-red-600",
                                                            row.attendance === "late" &&
                                                                "bg-amber-50 text-amber-600",
                                                            row.attendance === "half_day" &&
                                                                "bg-orange-50 text-orange-600",
                                                            row.attendance === "holiday" &&
                                                                "bg-blue-50 text-blue-600"
                                                        )}
                                                    >
                                                        {row.attendance.replace("_", " ")}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-2 px-3 text-gray-500">
                                                    {row.entry_time || "—"}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 text-gray-500">
                                                    {row.exit_time || "—"}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 text-gray-400 truncate max-w-[100px]">
                                                    {row.note || "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {previewData.length > 20 && (
                                <p className="text-[10px] text-gray-400 text-center">
                                    Showing first 20 of {previewData.length} records
                                </p>
                            )}
                        </div>
                    )}

                    {/* ──────── STEP: Done ──────── */}
                    {step === "done" && (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                            <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center animate-in zoom-in duration-300">
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                            <p className="text-sm font-bold text-gray-700">Import Successful!</p>
                            <p className="text-xs text-gray-400">
                                {previewData.length} records loaded. Review the table and click Save
                                Attendance.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {step !== "done" && (
                    <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-2">
                        {step === "mapping" && (
                            <Button
                                variant="ghost"
                                onClick={() => setStep("upload")}
                                className="text-xs font-semibold text-gray-500 h-9 rounded-full"
                            >
                                ← Back
                            </Button>
                        )}
                        {step === "preview" && (
                            <Button
                                variant="ghost"
                                onClick={() => setStep("mapping")}
                                className="text-xs font-semibold text-gray-500 h-9 rounded-full"
                            >
                                ← Back
                            </Button>
                        )}
                        <div className="flex-1" />
                        {step === "mapping" && (
                            <Button
                                onClick={handleProceedToPreview}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase h-9 px-6 rounded-full transition-all active:scale-95 gap-2"
                            >
                                Preview Data
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        )}
                        {step === "preview" && (
                            <Button
                                onClick={handleConfirmImport}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs font-bold uppercase h-9 px-6 rounded-full transition-all active:scale-95 gap-2"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Confirm Import ({previewData.length} records)
                            </Button>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
