"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Banner {
    id: string;
    name: string;
    url: string;
}

const mockBanners: Banner[] = [
    { id: "1", name: "v-4banner1.jpg", url: "/banners/b1.jpg" },
    { id: "2", name: "v-4banner4.jpg", url: "/banners/b2.jpg" },
    { id: "3", name: "op-banner2-2.jpg", url: "/banners/b3.jpg" },
    { id: "4", name: "v-4banner3-3.jpg", url: "/banners/b4.jpg" },
    { id: "5", name: "GDCC Sports Day (3).jfif", url: "/banners/b5.jpg" },
    { id: "6", name: "top-banner2-2.jpg", url: "/banners/b6.jpg" },
];

export default function BannerImagesPage() {
    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                {/* Header Section */}
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <h2 className="text-sm font-semibold text-gray-800 tracking-tight">Banner Images</h2>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5 font-bold tracking-tight">
                        <Plus className="h-4 w-4" />
                        Add Images
                    </Button>
                </div>

                {/* Banner Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 py-2">
                    {mockBanners.map((banner) => (
                        <div
                            key={banner.id}
                            className="bg-[#f8f9fa] rounded border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-shadow duration-200"
                        >
                            {/* Image Preview Container */}
                            <div className="h-24 bg-white flex items-center justify-center overflow-hidden relative border-b border-gray-50">
                                {/* Simulate Banner Image with UI icon */}
                                <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center">
                                    <ImageIcon className="h-12 w-12 text-gray-300 opacity-20" />
                                </div>
                                {/* Overlay for actions if needed in future */}
                                <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors" />
                            </div>

                            {/* Filename Label */}
                            <div className="bg-white p-2 text-center">
                                <p className="text-[10px] font-medium text-gray-500 truncate" title={banner.name}>
                                    {banner.name}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
