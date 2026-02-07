"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    CloudUpload,
    Search,
    Download,
    Trash2,
    FileText,
    Image as ImageIcon,
    LayoutGrid,
    List,
    ChevronLeft,
    ChevronRight,
    FileIcon
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ContentItem {
    id: string;
    name: string;
    uploader: string;
    date: string;
    type: "pdf" | "image" | "file";
    thumbnail?: string;
}

const mockContent: ContentItem[] = [
    { id: "1", name: "School_Admission_Form_Sample_Template (1).pdf", uploader: "Joe Black (9000)", date: "02/02/2026 22:18:19", type: "pdf" },
    { id: "2", name: "test-1024x484.jpg", uploader: "Joe Black (9000)", date: "02/02/2026 22:15:53", type: "image", thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" },
    { id: "3", name: "fee-structure-(2) (2).jpg", uploader: "Joe Black (9000)", date: "02/02/2026 22:11:46", type: "image", thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop" },
    { id: "4", name: "fees structure.jpg", uploader: "Joe Black (9000)", date: "01/30/2026 17:35:56", type: "image", thumbnail: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop" },
    { id: "5", name: "8d473501-3162-4953-9aa3-333a178bcbf3.pdf", uploader: "Joe Black (9000)", date: "02/02/2026 22:17:05", type: "file" },
    { id: "6", name: "February Exam_2025-26_Class I_A.pdf", uploader: "Joe Black (9000)", date: "02/02/2026 22:15:13", type: "pdf" },
    { id: "7", name: "6b7e8ec2-b060-4a45-b2a2-dfb866286ca2.pdf", uploader: "Joe Black (9000)", date: "02/02/2026 22:04:57", type: "file" },
    { id: "8", name: "Fees Structure_2025-26 .pdf", uploader: "Joe Black (9000)", date: "01/02/2026 16:56:43", type: "pdf" },
    { id: "9", name: "Book List (1) (4).pdf", uploader: "Joe Black (9000)", date: "02/02/2026 22:16:19", type: "file" },
    { id: "10", name: "Book List (1) (3).pdf", uploader: "Joe Black (9000)", date: "02/02/2026 22:12:30", type: "file" },
    { id: "11", name: "Book List -1.pdf", uploader: "Joe Black (9000)", date: "01/03/2026 17:06:56", type: "pdf" },
    { id: "12", name: "fees structure.pdf", uploader: "Joe Black (9000)", date: "12/03/2025 13:01:34", type: "pdf" },
];

export default function UploadContentPage() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchTerm, setSearchTerm] = useState("");

    const getFileIcon = (item: ContentItem) => {
        if (item.type === "image" && item.thumbnail) {
            return (
                <div className="relative h-12 w-12 rounded border border-gray-100 overflow-hidden shrink-0">
                    <Image src={item.thumbnail} alt={item.name} fill className="object-cover" />
                </div>
            );
        }
        if (item.type === "pdf") {
            return (
                <div className="h-12 w-12 bg-red-50 rounded flex flex-col items-center justify-center border border-red-100 shrink-0">
                    <FileText className="h-6 w-6 text-red-500" />
                    <span className="text-[8px] font-bold text-red-600 uppercase">pdf</span>
                </div>
            );
        }
        return (
            <div className="h-12 w-12 bg-gray-50 rounded flex items-center justify-center border border-gray-200 shrink-0">
                <FileIcon className="h-6 w-6 text-gray-400" />
            </div>
        );
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-sm font-medium text-gray-800">Content List</h1>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-8 px-4 text-[10px] font-bold uppercase transition-all rounded shadow-sm">
                    <CloudUpload className="h-4 w-4" /> Upload
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Content Grid */}
                <div className="flex-1 space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        {/* Toolbar */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Input
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-9 border-gray-200 text-xs pr-10 focus-visible:ring-indigo-500 rounded shadow-none"
                                />
                                <Button className="absolute right-0 top-0 h-9 bg-indigo-500 hover:bg-indigo-600 text-white rounded-l-none px-3">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded border border-gray-100">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewMode("list")}
                                    className={cn("h-7 w-7 rounded", viewMode === "list" ? "bg-indigo-500 text-white shadow-sm hover:bg-indigo-600 hover:text-white" : "text-gray-400")}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewMode("grid")}
                                    className={cn("h-7 w-7 rounded", viewMode === "grid" ? "bg-indigo-500 text-white shadow-sm hover:bg-indigo-600 hover:text-white" : "text-gray-400")}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Grid of Content */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {mockContent.map((item) => (
                                <div key={item.id} className="relative group bg-white border border-gray-100 rounded-md p-3 hover:shadow-md hover:border-indigo-100 transition-all">
                                    <div className="flex items-start gap-4">
                                        {getFileIcon(item)}
                                        <div className="flex-1 min-w-0 pr-6">
                                            <p className="text-[11px] font-bold text-indigo-500 truncate cursor-pointer hover:underline" title={item.name}>
                                                {item.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1 font-medium">{item.uploader}</p>
                                            <p className="text-[9px] text-gray-300 mt-0.5">{item.date}</p>
                                        </div>
                                    </div>

                                    {/* Item Actions */}
                                    <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-gray-50 pt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                                            <Download className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    {/* Checkbox Overlay */}
                                    <div className="absolute top-2 right-2">
                                        <Checkbox className="border-gray-200 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center gap-1.5 pt-4">
                            <Button variant="outline" size="sm" className="h-7 px-2 text-[10px] gap-1 text-gray-500 border-gray-200 hover:bg-indigo-50 hover:text-indigo-600">
                                <ChevronLeft className="h-3 w-3" /> Previous
                            </Button>
                            <div className="flex gap-1">
                                {[1, 2, 3].map((page) => (
                                    <Button
                                        key={page}
                                        variant={page === 1 ? "default" : "outline"}
                                        size="sm"
                                        className={cn(
                                            "h-7 w-7 p-0 text-[10px]",
                                            page === 1 ? "bg-indigo-500 hover:bg-indigo-600 border-0" : "text-gray-400 border-gray-200 hover:bg-indigo-50 hover:text-indigo-600"
                                        )}
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-[10px] gap-1 text-gray-500 border-gray-200 hover:bg-indigo-50 hover:text-indigo-600">
                                Next <ChevronRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Section: Statistics */}
                <div className="w-full lg:w-80 space-y-4 shrink-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50/50 p-12 flex flex-col items-center justify-center border-b border-gray-100">
                            <div className="relative h-20 w-20 flex items-center justify-center bg-white rounded-xl shadow-lg border border-gray-100 group">
                                <CloudUpload className="h-10 w-10 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                                <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-indigo-500 rounded-full border-4 border-white flex items-center justify-center">
                                    <LayoutGrid className="h-3.5 w-3.5 text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="p-0">
                            <div className="flex justify-between items-center p-4 border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Total Documents</span>
                                <span className="text-[11px] font-bold text-gray-700">27</span>
                            </div>
                            <div className="flex justify-between items-center p-4 hover:bg-gray-50/30 transition-colors">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Size</span>
                                <span className="text-[11px] font-bold text-gray-700">8.55 MB</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
