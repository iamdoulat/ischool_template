"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Upload,
    RotateCcw,
    Download,
    Trash2,
    CloudUpload,
    Eye,
    EyeOff
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Mock Backup Files Data
const backupFiles = [
    { id: 1, name: "db_ver_7.1.0_2026-02-07_13-48-37.sql" },
    { id: 2, name: "db_ver_7.1.0_2026-02-06_17-48-01.sql" },
    { id: 3, name: "db_ver_7.1.0_2026-02-05_16-29-20.sql" },
    { id: 4, name: "db_ver_7.1.0_2026-02-04_05-31-45.sql" },
    { id: 5, name: "db_ver_7.1.0_2026-02-03_14-49-24.sql" },
    { id: 6, name: "db_ver_7.1.0_2026-02-02_21-18-12.sql" },
    { id: 7, name: "db_ver_7.1.0_2026-02-01_11-22-24.sql" },
    { id: 8, name: "db_ver_7.1.0_2026-01-31_06-12-04.sql" },
    { id: 9, name: "db_ver_7.1.0_2026-01-30_01-01-00.sql" },
    { id: 10, name: "db_ver_7.1.0_2026-01-29_22-04-45.sql" },
];

export default function BackupRestorePage() {
    const [showKey, setShowKey] = useState(false);
    const [cronKey] = useState("********************************");

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* Left Column: Backup History */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-50">
                        <h2 className="text-[13px] font-medium text-gray-700">Backup History</h2>
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-md gap-1.5">
                            <Plus className="h-3 w-3" />
                            Create Backup
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="p-4">
                        <div className="border border-gray-100 rounded overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="border-b border-gray-100 hover:bg-transparent">
                                        <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase">Backup Files</TableHead>
                                        <TableHead className="h-9 px-4 text-[11px] font-bold text-gray-600 uppercase text-right w-[300px]">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {backupFiles.map((file) => (
                                        <TableRow key={file.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors group">
                                            <TableCell className="py-2 px-4 text-[11px] font-medium text-blue-500 hover:text-blue-600 hover:underline cursor-pointer transition-colors">
                                                {file.name}
                                            </TableCell>
                                            <TableCell className="py-2 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5 opacity-90 hover:opacity-100">
                                                    <Button
                                                        className="h-6 px-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all text-[9px] font-semibold uppercase gap-1"
                                                    >
                                                        <Download className="h-2.5 w-2.5" />
                                                        Download
                                                    </Button>
                                                    <Button
                                                        className="h-6 px-2 rounded bg-amber-400 hover:bg-amber-500 text-white shadow-sm transition-all text-[9px] font-semibold uppercase gap-1"
                                                    >
                                                        <RotateCcw className="h-2.5 w-2.5" />
                                                        Restore
                                                    </Button>
                                                    <Button
                                                        className="h-6 px-2 rounded bg-red-500 hover:bg-red-600 text-white shadow-sm transition-all text-[9px] font-semibold uppercase gap-1"
                                                    >
                                                        <Trash2 className="h-2.5 w-2.5" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Upload & Cron Key */}
            <div className="lg:col-span-1 space-y-4">

                {/* Upload Box */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-50 p-4">
                        <h2 className="text-[13px] font-medium text-gray-700">Upload From Local Directory</h2>
                    </div>

                    <div className="p-4 space-y-4">
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors group">
                            <CloudUpload className="h-8 w-8 text-gray-300 group-hover:text-indigo-400 transition-colors mb-2" />
                            <p className="text-[11px] text-gray-500 font-medium">Drag and drop a file here or click</p>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-gray-50">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-md gap-1.5">
                                <Upload className="h-3 w-3" />
                                Upload
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Cron Key Box */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-gray-50">
                        <h2 className="text-[13px] font-medium text-gray-700">Cron Secret Key</h2>
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-md">
                            Regenerate
                        </Button>
                    </div>

                    <div className="p-4 relative min-h-[60px]">
                        {/* Key Display Mock */}
                        <div className="flex flex-col gap-2">
                            <div className="relative">
                                <Input
                                    readOnly
                                    value={showKey ? "cron_secret_key_x82js92ks01" : cronKey}
                                    className="h-8 text-[11px] font-mono border-transparent bg-transparent shadow-none px-0 "
                                />
                            </div>

                            <div className="absolute bottom-2 right-4">
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}
