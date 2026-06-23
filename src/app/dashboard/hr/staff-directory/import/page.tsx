"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Download, Upload, AlertCircle, Settings } from "lucide-react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";

interface Role {
    name: string;
}

export default function ImportStaffPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRole, setSelectedRole] = useState("");
    const [selectedDesignation, setSelectedDesignation] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvData, setCsvData] = useState<string[][]>([]);
    const [loading, setLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await api.get("/hr/staff-roles");
            if (response.data.status === "Success") {
                setRoles(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

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
                alert(t("please_upload_csv"));
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
                alert(t("please_upload_csv"));
            }
        }
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const rows = text.split("\n").map(row => {
                // Handle CSV parsing with proper comma separation
                return row.split(",").map(cell => cell.trim());
            }).filter(row => row.some(cell => cell.length > 0)); // Remove empty rows

            setCsvData(rows);
        };
        reader.readAsText(file);
    };

    const expectedFields = [
        "Staff ID",
        "First Name",
        "Last Name",
        "Father Name",
        "Mother Name",
        "Email",
        "Gender",
        "Date Of Birth",
        "Date Of Joining",
        "Phone",
        "Emergency Contact Number",
        "Marital Status",
        "Current Address",
        "Permanent Address",
        "Qualification",
        "Work Experience",
        "Note"
    ];

    const initializeMapping = () => {
        if (csvData.length === 0) return;

        const csvHeaders = csvData[0];
        const mapping: Record<string, string> = {};

        // Auto-map exact matches
        expectedFields.forEach(expectedField => {
            const matchIndex = csvHeaders.findIndex(header =>
                header.toLowerCase().trim() === expectedField.toLowerCase().trim()
            );
            if (matchIndex !== -1) {
                mapping[expectedField] = csvHeaders[matchIndex];
            }
        });

        setColumnMapping(mapping);
    };

    const handleOpenMapping = () => {
        initializeMapping();
        setMappingDialogOpen(true);
    };

    const handleDownloadSample = () => {
        // CSV headers matching the table
        const headers = [
            "Staff ID",
            "First Name",
            "Last Name",
            "Father Name",
            "Mother Name",
            "Email",
            "Gender",
            "Date Of Birth",
            "Date Of Joining",
            "Phone",
            "Emergency Contact Number",
            "Marital Status",
            "Current Address",
            "Permanent Address",
            "Qualification",
            "Work Experience",
            "Note"
        ];

        // Sample data row
        const sampleData = [
            "STF001",
            "John",
            "Doe",
            "Richard Doe",
            "Mary Doe",
            "john.doe@example.com",
            "Male",
            "1990-01-15",
            "2024-01-01",
            "+1234567890",
            "+0987654321",
            "Married",
            "123 Main St, City",
            "456 Home St, Town",
            "Masters in Education",
            "5 years",
            "Experienced teacher"
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
        link.setAttribute("download", "staff_import_sample.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = async () => {
        if (!csvFile) {
            alert(t("please_select_csv_to_import"));
            return;
        }

        setLoading(true);
        try {
            // TODO: Implement bulk import API call
            const formData = new FormData();
            formData.append("file", csvFile);
            formData.append("role", selectedRole);
            formData.append("designation", selectedDesignation);
            formData.append("department", selectedDepartment);

            alert(t("bulk_import_to_be_implemented"));
            // After successful import, redirect to staff directory
            // router.push("/dashboard/hr/staff-directory");
        } catch (error) {
            console.error("Import error:", error);
            alert(t("bulk_import_failed"));
        } finally {
            setLoading(false);
        }
    };

    const gradientBtn = "bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white shadow-lg shadow-purple-200/50 transition-all duration-300 border-none rounded-full";

    return (
        <div className="p-6 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="h-9 w-9 p-0 hover:bg-white/60 rounded-lg shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Upload className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("staff_import")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("bulk_import_csv")}</p>
                    </div>
                </div>
                <Button
                    onClick={handleDownloadSample}
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2 h-10 px-6 text-sm font-semibold rounded-full"
                >
                    <Download className="h-4 w-4" />
                    {t("download_sample_import_file")}
                </Button>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800 space-y-1">
                        <p>{`${t("csv_instructions_line1_prefix")} `}<strong>UTF-8</strong>{` ${t("to_avoid_encoding_problems")}`}</p>
                        <p>{t("csv_instructions_line2")}</p>
                    </div>
                </div>
            </div>

            {/* Expected Format Table / CSV Preview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {csvData.length === 0 ? (
                        // Expected Format Table (shown when no CSV uploaded)
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("staff_id")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("first_name")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("last_name")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("father_name")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("mother_name")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("email")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("gender")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("date_of_birth")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("date_of_joining")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("phone")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("emergency_contact_number")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("marital_status")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("current_address")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("permanent_address")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("qualification")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("work_experience")}</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">{t("note")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-100">
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                    <td className="px-3 py-3 text-gray-500">XYZ</td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        // CSV Preview Table (shown when CSV uploaded)
                        <>
                            <div className="bg-purple-50 border-b border-purple-200 px-4 py-2 flex items-center justify-between">
                                <p className="text-xs font-bold text-purple-700 uppercase">
                                    {t("preview_n_records_detected", { count: csvData.length - 1 })}
                                </p>
                                <Button
                                    onClick={handleOpenMapping}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-2 border-purple-300 text-purple-700 hover:bg-purple-100"
                                >
                                    <Settings className="h-3 w-3" />
                                    {t("map_columns")}
                                </Button>
                            </div>
                            <div className="max-h-96 overflow-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-purple-50 border-b border-purple-200 sticky top-0">
                                        <tr>
                                            {csvData[0]?.map((header, index) => (
                                                <th key={index} className="px-3 py-3 text-left font-semibold text-purple-700 whitespace-nowrap">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {csvData.slice(1).map((row, rowIndex) => (
                                            <tr key={rowIndex} className="border-b border-gray-100 hover:bg-gray-50">
                                                {row.map((cell, cellIndex) => (
                                                    <td key={cellIndex} className="px-3 py-3 text-gray-700 whitespace-nowrap">
                                                        {cell || '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Import Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-6">
                {/* Role, Designation, Department */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">{t("role")}</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="h-11 border-gray-200">
                                <SelectValue placeholder={t("select")} />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.name} value={role.name}>{role.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">{t("designation")}</Label>
                        <Select value={selectedDesignation} onValueChange={setSelectedDesignation}>
                            <SelectTrigger className="h-11 border-gray-200">
                                <SelectValue placeholder={t("select")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Teacher">Teacher</SelectItem>
                                <SelectItem value="Senior Teacher">Senior Teacher</SelectItem>
                                <SelectItem value="Principal">Principal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">{t("department")}</Label>
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="h-11 border-gray-200">
                                <SelectValue placeholder={t("select")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Science">Science</SelectItem>
                                <SelectItem value="Mathematics">Mathematics</SelectItem>
                                <SelectItem value="English">English</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase">{t("select_csv_file")} *</Label>
                    <div
                        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? "border-purple-400 bg-purple-50" : "border-gray-300 hover:border-purple-300"
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">
                            <span className="text-purple-600 font-semibold">{t("drag_drop_or_click")}</span>
                        </p>
                        {csvFile ? (
                            <p className="text-xs text-green-600 font-medium mt-2">
                                {t("selected")}: {csvFile.name}
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400">{t("no_file_chosen")}</p>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleImport}
                        disabled={loading || !csvFile}
                        className={`${gradientBtn} px-10 h-12 text-sm font-semibold shadow-lg`}
                    >
                        {loading ? t("importing_dotdotdot") : t("staff_import_button")}
                    </Button>
                </div>
            </div>

            {/* Column Mapping Dialog */}
            <Dialog open={mappingDialogOpen} onOpenChange={setMappingDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t("map_csv_columns")}</DialogTitle>
                        <DialogDescription>
                            {t("auto_match_instructions")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4 font-semibold text-xs text-gray-600 border-b pb-2">
                            <div>{t("expected_field")}</div>
                            <div>{t("csv_column")}</div>
                        </div>

                        {expectedFields.map((expectedField) => (
                            <div key={expectedField} className="grid grid-cols-2 gap-4 items-center">
                                <Label className="text-sm font-medium">{expectedField}</Label>
                                <Select
                                    value={columnMapping[expectedField] || "unmapped"}
                                    onValueChange={(value) => {
                                        setColumnMapping(prev => ({
                                            ...prev,
                                            [expectedField]: value === "unmapped" ? "" : value
                                        }));
                                    }}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder={t("select_column_dotdotdot")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unmapped">{t("not_mapped")}</SelectItem>
                                        {csvData[0]?.map((header, index) => (
                                            <SelectItem key={index} value={header}>
                                                {header}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setMappingDialogOpen(false)}
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={() => {
                                setMappingDialogOpen(false);
                                // Mapping is already saved in state
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {t("apply_mapping")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
