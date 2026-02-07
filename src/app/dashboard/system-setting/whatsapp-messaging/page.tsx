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
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

const tabs = ["Meta WhatsApp Official", "Twilio"];

export default function WhatsappMessagingPage() {
    const [activeTab, setActiveTab] = useState("Meta WhatsApp Official");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Whatsapp Messaging Setting</h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                {/* Tabs */}
                <div className="flex border-b border-gray-100 bg-gray-50/30">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-3 text-[11px] font-bold uppercase transition-all relative",
                                activeTab === tab
                                    ? "text-indigo-600 bg-white border-b-2 border-indigo-500 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="p-8 max-w-6xl mx-auto">
                    {activeTab === "Meta WhatsApp Official" ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start animate-in fade-in duration-300">

                            {/* Form Fields */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Access Token <span className="text-red-500">*</span></Label>
                                    <div className="md:col-span-2">
                                        <Input defaultValue="yyyyyy" className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Registered Phone Number <span className="text-red-500">*</span></Label>
                                    <div className="md:col-span-2">
                                        <Input defaultValue="878979790" className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Language <span className="text-red-500">*</span></Label>
                                    <div className="md:col-span-2">
                                        <Input defaultValue="en" className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Status <span className="text-red-500">*</span></Label>
                                    <div className="md:col-span-2">
                                        <Select defaultValue="enabled">
                                            <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="enabled">Enabled</SelectItem>
                                                <SelectItem value="disabled">Disabled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Meta Brand Card */}
                            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                                <div className="w-56 h-32 bg-blue-600 rounded-xl shadow-lg flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                                    <div className="bg-white p-3 rounded-2xl shadow-xl transform transition-transform group-hover:scale-110">
                                        <svg className="w-12 h-12 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12.001 3.5c-3.111 0-5.875 1.579-7.534 3.993C3.012 10.016 3.012 13.984 4.467 16.507c1.659 2.414 4.423 3.993 7.534 3.993h.001c3.111 0 5.875-1.579 7.534-3.993 1.455-2.523 1.455-6.491 0-9.014-1.659-2.414-4.423-3.993-7.534-3.993s-5.875 1.579-7.534 3.993zM12.001 2c3.5 0 6.666 1.834 8.5 4.5 1.667 3 1.667 7.5 0 10.5-1.834 2.666-5 4.5-8.5 4.5h-.001c-3.5 0-6.666-1.834-8.5-4.5-1.667-3-1.667-7.5 0-10.5 1.834-2.666 5-4.5 8.5-4.5h.001z" />
                                            <path d="M12.001 8c-1.381 0-2.5 1.119-2.5 2.5s1.119 2.5 2.5 2.5c1.381 0 2.5-1.119 2.5-2.5s-1.119-2.5-2.5-2.5zm5.5 2.5c0 3.038-2.462 5.5-5.5 5.5s-5.5-2.462-5.5-5.5 2.462-5.5 5.5-5.5 5.5 2.462 5.5 5.5z" />
                                        </svg>
                                    </div>
                                </div>
                                <a
                                    href="https://business.facebook.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:underline flex items-center gap-1.5 font-medium"
                                >
                                    https://business.facebook.com/
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 opacity-30 animate-in fade-in duration-300">
                            <h2 className="text-sm font-bold text-gray-400 p-4 border-2 border-dashed border-gray-200 rounded-xl">Twilio Configuration Module Pending</h2>
                        </div>
                    )}
                </div>

                {/* Footer Save Action */}
                <div className="border-t border-gray-50 p-6 bg-white flex justify-center">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md border-b-2 border-indigo-700">
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
