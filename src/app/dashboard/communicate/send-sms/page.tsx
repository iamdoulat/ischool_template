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
    SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export default function SendSMSPage() {
    const [activeTab, setActiveTab] = useState("Group");
    const [message, setMessage] = useState("");

    const roles = [
        "Students", "Guardians", "Admin", "Teacher",
        "Accountant", "Librarian", "Receptionist"
    ];

    const tabs = ["Group", "Individual", "Class", "Today's Birthday"];

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-sm font-medium text-gray-800">Send SMS</h1>

                {/* Navigation Tabs */}
                <div className="flex bg-white rounded border border-gray-100 p-0.5 shadow-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-4 py-1.5 text-[11px] font-bold rounded transition-all",
                                activeTab === tab
                                    ? "bg-indigo-500 text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Section: SMS Composition */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 space-y-5">
                        {/* SMS Template */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                SMS Template
                            </Label>
                            <Select>
                                <SelectTrigger className="h-9 border-gray-200 text-sm focus:ring-indigo-500 rounded">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="holiday">Holiday Notice</SelectItem>
                                    <SelectItem value="exam">Exam Schedule</SelectItem>
                                    <SelectItem value="fees">Fees Reminder</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Title <span className="text-red-500">*</span>
                            </Label>
                            <Input className="h-9 border-gray-200 text-sm focus-visible:ring-indigo-500 rounded shadow-none" />
                        </div>

                        {/* Send Through */}
                        <div className="flex items-center gap-6 py-1">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Send Through <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="sms" className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500" />
                                    <Label htmlFor="sms" className="text-xs text-gray-700 font-medium cursor-pointer">SMS</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox id="mobile-app" className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500" />
                                    <Label htmlFor="mobile-app" className="text-xs text-gray-700 font-medium cursor-pointer">Mobile App</Label>
                                </div>
                            </div>
                        </div>

                        {/* SMS Template ID */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                SMS Template ID <span className="text-[9px] lowercase font-medium text-gray-400 normal-case">(This field is required Only For Indian SMS Gateway)</span>
                            </Label>
                            <Input className="h-9 border-gray-200 text-sm focus-visible:ring-indigo-500 rounded shadow-none" />
                        </div>

                        {/* Message */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Message <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative group">
                                <textarea
                                    className="w-full h-48 p-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none bg-white transition-all shadow-sm group-hover:border-indigo-200"
                                    placeholder="Type your SMS message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                                <div className="absolute bottom-3 right-3 text-[10px] font-bold text-gray-400">
                                    Character Count: {message.length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Recipients */}
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 min-h-[400px]">
                        <h2 className="text-[11px] font-bold text-gray-500 uppercase mb-4 flex items-center gap-1">
                            Message To <span className="text-red-500">*</span>
                        </h2>

                        <div className="space-y-3">
                            {roles.map((role) => (
                                <div key={role} className="flex items-center gap-3 group cursor-pointer hover:bg-gray-50 p-1 -m-1 rounded transition-colors">
                                    <Checkbox id={role} className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500" />
                                    <Label htmlFor={role} className="text-sm text-gray-600 cursor-pointer font-medium group-hover:text-indigo-600">
                                        {role}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col md:flex-row items-center justify-end gap-6 bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                <RadioGroup defaultValue="now" className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="now" id="now" className="border-gray-300 text-indigo-500 focus:ring-indigo-500" />
                        <Label htmlFor="now" className="text-[11px] font-bold text-gray-700 uppercase cursor-pointer">Send Now</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="schedule" id="schedule" className="border-gray-300 text-indigo-500 focus:ring-indigo-500" />
                        <Label htmlFor="schedule" className="text-[11px] font-bold text-gray-700 uppercase cursor-pointer">Schedule</Label>
                    </div>
                </RadioGroup>

                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-9 text-[11px] font-bold uppercase transition-all rounded shadow-md shadow-indigo-100">
                    Submit
                </Button>
            </div>
        </div>
    );
}
