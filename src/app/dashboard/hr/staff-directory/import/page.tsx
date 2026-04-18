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

interface Role {
    name: string;
}

export default function ImportStaffPage() {
    const router = useRouter();
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
                alert("Please upload a CSV file");
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
                alert("Please upload a CSV file");
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
            alert("Please select a CSV file to import");
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

            alert("Bulk import will be implemented soon");
            // After successful import, redirect to staff directory
            // router.push("/dashboard/hr/staff-directory");
        } catch (error) {
            console.error("Import error:", error);
            alert("Failed to import staff. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const gradientBtn = "bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white shadow-lg shadow-purple-200/50 transition-all duration-300 border-none rounded-full";

    return (
        <div className="p-6 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-800">Staff Import</h1>
                </div>
                <Button
                    onClick={handleDownloadSample}
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2 h-10 px-6 text-sm font-semibold rounded-full"
                >
                    <Download className="h-4 w-4" />
                    Download Sample Import File
                </Button>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800 space-y-1">
                        <p>1. Your CSV data should be in the format below. The first line of your CSV file should be the column headers as in the table example. Also make sure that your file is <strong>UTF-8</strong> to avoid unnecessary encoding problems.</p>
                        <p>2. If the column you are trying to import is date make sure that is formatted in format Y-m-d (2018-06-06).</p>
                    </div>
                </div>
            </div>

            {/* Expected Format Table / CSV Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {csvData.length === 0 ? (
                        // Expected Format Table (shown when no CSV uploaded)
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Staff ID</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">First Name</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Last Name</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Father Name</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Mother Name</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Email</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Gender</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Date Of Birth</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Date Of Joining</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Phone</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Emergency Contact Number</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Marital Status</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Current Address</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Permanent Address</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Qualification</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Work Experience</th>
                                    <th className="px-3 py-3 text-left font-semibold text-gray-700">Note</th>
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
                                    Preview ({csvData.length - 1} record{csvData.length - 1 !== 1 ? 's' : ''} detected)
                                </p>
                                <Button
                                    onClick={handleOpenMapping}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs gap-2 border-purple-300 text-purple-700 hover:bg-purple-100"
                                >
                                    <Settings className="h-3 w-3" />
                                    Map Columns
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
                {/* Role, Designation, Department */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Role</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="h-11 border-gray-200">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.name} value={role.name}>{role.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Designation</Label>
                        <Select value={selectedDesignation} onValueChange={setSelectedDesignation}>
                            <SelectTrigger className="h-11 border-gray-200">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Teacher">Teacher</SelectItem>
                                <SelectItem value="Senior Teacher">Senior Teacher</SelectItem>
                                <SelectItem value="Principal">Principal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Department</Label>
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="h-11 border-gray-200">
                                <SelectValue placeholder="Select" />
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
                    <Label className="text-xs font-bold text-gray-500 uppercase">Select CSV File *</Label>
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
                            <span className="text-purple-600 font-semibold">Drag and drop a file here or click</span>
                        </p>
                        {csvFile ? (
                            <p className="text-xs text-green-600 font-medium mt-2">
                                Selected: {csvFile.name}
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400">No file chosen</p>
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
                        {loading ? "Importing..." : "Staff Import"}
                    </Button>
                </div>
            </div>

            {/* Column Mapping Dialog */}
            <Dialog open={mappingDialogOpen} onOpenChange={setMappingDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Map CSV Columns</DialogTitle>
                        <DialogDescription>
                            Match your CSV columns with the expected fields. Auto-matched fields are already selected.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4 font-semibold text-xs text-gray-600 border-b pb-2">
                            <div>Expected Field</div>
                            <div>CSV Column</div>
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
                                        <SelectValue placeholder="Select column..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unmapped">-- Not Mapped --</SelectItem>
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
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                setMappingDialogOpen(false);
                                // Mapping is already saved in state
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            Apply Mapping
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
