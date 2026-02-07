"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Menu,
    Pencil,
    Trash2,
    GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
    id: string;
    title: string;
    subItems?: MenuItem[];
}

const mainMenuItems: MenuItem[] = [
    { id: "1", title: "HOME" },
    { id: "2", title: "ONLINE COURSE" },
    { id: "3", title: "ONLINE ADMISSION" },
    { id: "4", title: "CBSE EXAM RESULT" },
    { id: "5", title: "EXAM RESULT" },
    { id: "6", title: "ANNUAL CALENDAR" },
    { id: "7", title: "ABOUT US" },
    {
        id: "8",
        title: "ACADEMICS",
        subItems: [
            { id: "8-1", title: "FACILITIES" },
            { id: "8-2", title: "ANNUAL SPORTS DAY" },
            { id: "8-3", title: "COURSE" },
            { id: "8-4", title: "SCHOOL UNIFORM" },
            { id: "8-5", title: "PRINCIPAL MESSAGE" },
            { id: "8-6", title: "SCHOOL MANAGEMENT" },
            { id: "8-7", title: "KNOW US" },
            { id: "8-8", title: "APPROACH" },
            { id: "8-9", title: "PRE PRIMARY" },
            { id: "8-10", title: "TEACHER" },
            { id: "8-11", title: "HOUSES & MENTORING" },
            { id: "8-12", title: "STUDENT COUNCIL" },
            { id: "8-13", title: "CAREER COUNSELLING" },
        ]
    },
    { id: "9", title: "GALLERY" },
    { id: "10", title: "EVENTS" },
    { id: "11", title: "NEWS" },
    { id: "12", title: "CONTACT" },
];

export default function MenusPage() {
    const [activeTab, setActiveTab] = useState<"main" | "bottom">("main");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Add Menu Item Form */}
                <div className="w-full lg:w-[450px]">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800 tracking-tight">Add Menu Item</h2>
                        </div>
                        <div className="p-4 space-y-5">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Menu Item <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input
                                    className="h-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                    placeholder=""
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-1">
                                    <Label className="text-[11px] font-medium text-gray-600">External URL</Label>
                                    <Switch className="data-[state=checked]:bg-indigo-500 scale-75" />
                                </div>
                                <div className="flex items-center justify-between py-1">
                                    <Label className="text-[11px] font-medium text-gray-600">Open in New Tab</Label>
                                    <Switch className="data-[state=checked]:bg-indigo-500 scale-75" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">External URL Address</Label>
                                <Input
                                    className="h-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                    placeholder=""
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Pages</Label>
                                <Select>
                                    <SelectTrigger className="h-9 border-gray-200 text-[11px] shadow-none rounded">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="home">Home</SelectItem>
                                        <SelectItem value="about">About Us</SelectItem>
                                        <SelectItem value="contact">Contact Us</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-9 text-[11px] font-bold uppercase transition-all rounded shadow-sm">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Menu Item List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                            <h1 className="text-sm font-medium text-gray-800 tracking-tight">Menu Item List</h1>
                            <div className="flex rounded shadow-sm">
                                <Button
                                    onClick={() => setActiveTab("main")}
                                    className={cn(
                                        "h-8 px-4 text-[10px] font-bold uppercase rounded-r-none transition-all",
                                        activeTab === "main" ? "bg-[#6366f1] text-white hover:bg-[#5558dd]" : "bg-white text-indigo-500 border border-indigo-100 hover:bg-indigo-50"
                                    )}
                                >
                                    Main Menu
                                </Button>
                                <Button
                                    onClick={() => setActiveTab("bottom")}
                                    className={cn(
                                        "h-8 px-4 text-[10px] font-bold uppercase rounded-l-none transition-all",
                                        activeTab === "bottom" ? "bg-[#6366f1] text-white hover:bg-[#5558dd]" : "bg-white text-indigo-500 border border-indigo-100 hover:bg-indigo-50"
                                    )}
                                >
                                    Bottom Menu
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            {mainMenuItems.map((item) => (
                                <div key={item.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded group hover:border-indigo-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Menu className="h-4 w-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{item.title}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 text-white rounded hover:bg-indigo-600">
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 text-white rounded hover:bg-indigo-600">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        {/* Always visible icons for main menu items as per design */}
                                        <div className="flex items-center gap-1 group-hover:hidden">
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 text-white rounded">
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 text-white rounded">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Sub Items */}
                                    {item.subItems && (
                                        <div className="pl-8 space-y-1.5 border-l-2 border-indigo-50 ml-2">
                                            {item.subItems.map((sub) => (
                                                <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50/50 border border-gray-100 rounded group hover:border-indigo-100 hover:bg-white transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <Menu className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-300 transition-colors" />
                                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">{sub.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Pencil className="h-2.5 w-2.5 text-indigo-400 cursor-pointer hover:text-indigo-600" />
                                                        <Trash2 className="h-2.5 w-2.5 text-red-300 cursor-pointer hover:text-red-500" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
