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
import { ExternalLink, MessageSquare } from "lucide-react";

// List of all SMS gateways shown in the tabs
const gateways = [
    "Clickatell Sms Gateway",
    "Twilio SMS Gateway",
    "MSG91",
    "Text Local",
    "SMS Country",
    "Bulk SMS",
    "Mobi Reach",
    "Nexmo",
    "AfricasTalking",
    "SMS Egypt",
    "SMS Gateway Hub",
    "Custom SMS Gateway",
];

export default function SmsSettingPage() {
    const [activeTab, setActiveTab] = useState("Clickatell Sms Gateway");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">SMS Setting</h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
                {/* Scrollable Tabs */}
                <div className="border-b border-gray-100 bg-white">
                    <div className="flex overflow-x-auto no-scrollbar">
                        {gateways.map((gateway) => (
                            <button
                                key={gateway}
                                onClick={() => setActiveTab(gateway)}
                                className={cn(
                                    "px-5 py-3 text-[11px] font-bold uppercase transition-all whitespace-nowrap border-b-2",
                                    activeTab === gateway
                                        ? "text-indigo-600 border-indigo-500 bg-indigo-50/10"
                                        : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"
                                )}
                            >
                                {gateway}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start animate-in fade-in duration-300">

                        {/* Left: Configuration Form */}
                        <div className="space-y-6">
                            {/* Dynamic Field Labels based on active tab mostly, but here hardcoded for Clickatell match */}
                            {activeTab === "Clickatell Sms Gateway" ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                        <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Clickatell Username <span className="text-red-500">*</span></Label>
                                        <div className="md:col-span-2">
                                            <Input className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                        <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Clickatell Password <span className="text-red-500">*</span></Label>
                                        <div className="md:col-span-2">
                                            <Input type="password" className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                        <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">API Key <span className="text-red-500">*</span></Label>
                                        <div className="md:col-span-2">
                                            <Input className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                        <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Status <span className="text-red-500">*</span></Label>
                                        <div className="md:col-span-2">
                                            <Select defaultValue="select">
                                                <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded text-gray-500">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="select">Select</SelectItem>
                                                    <SelectItem value="enabled">Enabled</SelectItem>
                                                    <SelectItem value="disabled">Disabled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Fallback for other tabs to show they are functional in concept */
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                        <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">{activeTab.replace(" Gateway", "")} API Key <span className="text-red-500">*</span></Label>
                                        <div className="md:col-span-2">
                                            <Input className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                        <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Sender ID <span className="text-red-500">*</span></Label>
                                        <div className="md:col-span-2">
                                            <Input className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                                        <Label className="text-[11px] font-bold text-gray-500 text-right uppercase">Status <span className="text-red-500">*</span></Label>
                                        <div className="md:col-span-2">
                                            <Select defaultValue="select">
                                                <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded text-gray-500">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="select">Select</SelectItem>
                                                    <SelectItem value="enabled">Enabled</SelectItem>
                                                    <SelectItem value="disabled">Disabled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Brand Card */}
                        <div className="flex flex-col items-center justify-center p-8 space-y-6">
                            {activeTab === "Clickatell Sms Gateway" ? (
                                <>
                                    <div className="p-6 bg-white rounded-xl flex items-center justify-center">
                                        {/* Stylized Text Logo for Clickatell */}
                                        <div className="flex items-center gap-2 text-3xl font-bold tracking-tighter text-gray-700">
                                            <div className="h-8 w-8 rounded-full border-[3px] border-emerald-400 flex items-center justify-center">
                                                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                            </div>
                                            <span className="text-gray-600">Clickatell</span>
                                        </div>
                                    </div>
                                    <a
                                        href="https://www.clickatell.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-indigo-500 hover:text-indigo-600 hover:underline flex items-center gap-1.5 font-medium transition-colors"
                                    >
                                        https://www.clickatell.com
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </>
                            ) : (
                                <>
                                    <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center">
                                        <MessageSquare className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">Configure {activeTab}</p>
                                </>
                            )}
                        </div>

                    </div>
                </div>

                {/* Footer Save Action */}
                <div className="border-t border-gray-50 p-6 bg-white flex justify-center mt-auto">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md border-b-2 border-indigo-700">
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
