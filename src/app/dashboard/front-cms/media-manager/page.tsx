"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload, ImageIcon, FileIcon, Search, Youtube, MoreHorizontal, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
    id: string;
    name: string;
    type: "image" | "video";
    url: string;
}

const mockMedia: MediaItem[] = [
    { id: "1", name: "ts.jpg", type: "image", url: "/media/ts.jpg" },
    { id: "2", name: "1703710460.jpg", type: "image", url: "/media/m1.jpg" },
    { id: "3", name: "ready-set-school_lm.jpg", type: "image", url: "/media/m2.jpg" },
    { id: "4", name: "34.png", type: "image", url: "/media/m3.jpg" },
    { id: "5", name: "tg.png", type: "image", url: "/media/m4.jpg" },
    { id: "6", name: "M_Admission-side-banner.png", type: "image", url: "/media/m5.jpg" },
    { id: "7", name: "images (5).jpg", type: "image", url: "/media/m6.jpg" },
    { id: "8", name: "ca1a3b.jpg", type: "image", url: "/media/m7.jpg" },
    { id: "9", name: "image.png", type: "image", url: "/media/m8.jpg" },
    { id: "10", name: "v-4banner3-3.jpg", type: "image", url: "/media/m9.jpg" },
    { id: "11", name: "top-banner2-2.jpg", type: "image", url: "/media/m10.jpg" },
    { id: "12", name: "1695458824-750001127650ec8f8c2e17login_bg3.jpg", type: "image", url: "/media/m11.jpg" },
    { id: "13", name: "1695468735-193040404050eccc0396277user.jpg", type: "image", url: "/media/m12.jpg" },
    { id: "14", name: "1674040621-200362736463c7d52d312c9GDCC Sports Da...", type: "image", url: "/media/m13.jpg" },
    { id: "15", name: "download.png", type: "image", url: "/media/m14.jpg" },
    { id: "16", name: "maxresdefault.jpg", type: "image", url: "/media/m15.jpg" },
    { id: "17", name: "H-RM.jpg", type: "image", url: "/media/m16.jpg" },
    { id: "18", name: "Christmas-Day.png", type: "image", url: "/media/m17.jpg" },
    { id: "19", name: "Happy-Diwali-to-My-Students.jpg", type: "image", url: "/media/m18.jpg" },
    { id: "20", name: "Happy.jpg", type: "image", url: "/media/m19.jpg" },
    { id: "21", name: "Celebrations-ideas.jpg", type: "image", url: "/media/m20.jpg" },
    { id: "22", name: "GDCC Sports DAY (2).jfif", type: "image", url: "/media/m21.jpg" },
    { id: "23", name: "nying.jpg", type: "image", url: "/media/m22.jpg" },
    { id: "24", name: "coming.jpg", type: "image", url: "/media/m23.jpg" },
];

export default function MediaManagerPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <h1 className="text-lg font-semibold text-gray-800 tracking-tight">Media Manager</h1>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 relative">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] items-center gap-6">
                    {/* File Upload */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Upload Your File</Label>
                        <div className="border border-dashed border-gray-200 rounded-md p-6 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                            <Upload className="h-4 w-4 text-gray-400" />
                            <span className="text-[11px] text-gray-500 font-medium">Drag and drop a file here or click</span>
                        </div>
                    </div>

                    <div className="text-[10px] font-bold text-gray-300 uppercase px-4">or</div>

                    {/* YouTube Upload */}
                    <div className="space-y-1.5 relative">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            Upload Youtube Video Link <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="URL"
                                className="h-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-9 text-[11px] font-bold uppercase transition-all rounded shadow-sm">
                                Submit
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-6">
                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search By File Name</Label>
                        <Input
                            placeholder="Enter Keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>
                    <div className="w-full md:w-64 space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Filter By File Type</Label>
                        <Select defaultValue="all">
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none bg-white">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Select</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Media Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {mockMedia.map((item) => (
                        <div key={item.id} className="group relative bg-[#f1f2f6] rounded border border-gray-100 overflow-hidden flex flex-col p-2 min-h-[140px] hover:shadow-md transition-shadow">
                            {/* Media Thumbnail/Placeholder */}
                            <div className="flex-1 rounded bg-white flex items-center justify-center overflow-hidden relative">
                                <div className="absolute inset-0 bg-gray-200 animate-pulse" /> {/* Placeholder background */}
                                <div className="z-10 bg-white w-full h-full flex flex-col items-center justify-center">
                                    {/* In a real app we'd use item.url, here we simulate with thumbnails */}
                                    <div className="w-full h-full bg-[#f8f9fa] flex items-center justify-center border-b border-gray-50">
                                        <ImageIcon className="h-10 w-10 text-gray-300 opacity-20" />
                                    </div>
                                </div>
                                <div className="absolute top-1 right-1 bg-white/80 p-1 rounded shadow-sm border border-gray-100">
                                    <ImageIcon className="h-2.5 w-2.5 text-gray-400" />
                                </div>
                            </div>

                            {/* File Info */}
                            <div className="mt-2 text-center px-1">
                                <p className="text-[9px] font-medium text-gray-600 truncate " title={item.name}>
                                    {item.name}
                                </p>
                            </div>

                            {/* Action Overlay (Optional functionality) */}
                            <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors pointer-events-none" />
                        </div>
                    ))}
                </div>

                {/* Footer / Pagination */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-50">
                    <div className="text-[10px] text-gray-400 font-medium tracking-tight">
                        1 2 <span className="mx-1 text-gray-300">|</span> <span className="hover:text-indigo-500 cursor-pointer">Last »</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-6 px-2 flex items-center justify-center bg-gray-50 text-[10px] text-gray-400 border border-gray-100 rounded cursor-not-allowed">1</span>
                        <span className="h-6 px-2 flex items-center justify-center bg-indigo-500 text-[10px] text-white border border-indigo-600 rounded cursor-pointer shadow-sm">2</span>
                        <span className="h-6 px-2 flex items-center justify-center bg-gray-50 text-[10px] text-gray-400 border border-gray-100 rounded hover:bg-gray-100 cursor-pointer">Next ›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
