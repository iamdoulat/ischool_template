"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    Sun,
    Grid2X2,
    MoveHorizontal,
    Maximize,
    Palette,
    Bold,
    Italic,
    Underline,
    Type,
    Quote,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Link2,
    Image as ImageIcon
} from "lucide-react";

const tabs = [
    "General Setting",
    "Logo",
    "Login Page Background",
    "Backend Theme",
    "Mobile App",
    "Student / Guardian Panel",
    "Fees",
    "ID Auto Generation",
    "Attendance Type",
    "Google Drive Setting",
    "Whatsapp Settings",
    "Chat",
    "Maintenance",
    "Miscellaneous",
];

export default function GeneralSettingPage() {
    const [activeTab, setActiveTab] = useState("Fees");

    const renderContent = () => {
        switch (activeTab) {
            case "Fees":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <h2 className="text-sm font-bold text-gray-700 pb-2 border-b border-gray-100">Fees</h2>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between group">
                                <Label className="text-[11px] font-medium text-gray-600">Offline Bank Payment In Student Panel</Label>
                                <Switch defaultChecked className="data-[state=checked]:bg-indigo-500 scale-90" />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[11px] font-medium text-gray-600">Offline Bank Payment Instruction</Label>
                                <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
                                    <div className="flex items-center gap-1 p-1.5 border-b border-gray-50 bg-gray-50/50 flex-wrap">
                                        <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-[10px] font-bold text-gray-400">A</Button>
                                            <Select defaultValue="normal">
                                                <SelectTrigger className="h-6 w-24 text-[9px] border-none shadow-none bg-transparent focus:ring-0">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="normal">Normal text</SelectItem>
                                                    <SelectItem value="h1">Heading 1</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {[Bold, Italic, Underline].map((Icon, i) => (
                                            <Button key={i} variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-indigo-500">
                                                <Icon className="h-3 w-3" />
                                            </Button>
                                        ))}
                                        <div className="w-[1px] h-3 bg-gray-200 mx-1" />
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-[10px] font-bold text-gray-400">Small</Button>
                                        <Quote className="h-3 w-3 text-gray-400" />
                                        <div className="w-[1px] h-3 bg-gray-200 mx-1" />
                                        {[List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link2, ImageIcon].map((Icon, i) => (
                                            <Button key={i} variant="ghost" size="icon" className="h-6 w-6 text-gray-400">
                                                <Icon className="h-3 w-3" />
                                            </Button>
                                        ))}
                                    </div>
                                    <textarea
                                        className="w-full h-32 p-3 text-[11px] text-gray-600 focus:outline-none resize-none bg-transparent"
                                        defaultValue="Offline mode of payment are Cash, DD, Online and Cheques"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-medium text-gray-600">Lock Student Panel If Fees Remaining</Label>
                                <Switch className="data-[state=checked]:bg-indigo-500 scale-90" />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[11px] font-medium text-gray-600">Print Fees Receipt For</Label>
                                <div className="flex items-center gap-6 pt-1">
                                    {["Office Copy", "Student Copy", "Bank Copy"].map((label) => (
                                        <div key={label} className="flex items-center gap-2">
                                            <Checkbox id={label} defaultChecked className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded-sm h-3.5 w-3.5" />
                                            <label htmlFor={label} className="text-[11px] text-gray-600 font-medium cursor-pointer">{label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5 max-w-md">
                                <Label className="text-[11px] font-medium text-gray-600">Carry Forward Fees Due Days <span className="text-red-500">*</span></Label>
                                <Input defaultValue="60" className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                            </div>

                            {[
                                "Single Page Fees Print",
                                "Collect Fees In Back Date",
                                "Student / Guardian Panel Fees Discount",
                                "Display Previous Fees",
                                "Allow Student To Add Partial Payment"
                            ].map((label) => (
                                <div key={label} className="flex items-center justify-between group">
                                    <Label className="text-[11px] font-medium text-gray-600">{label}</Label>
                                    <Switch defaultChecked className="data-[state=checked]:bg-indigo-500 scale-90" />
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case "ID Auto Generation":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <h2 className="text-sm font-bold text-gray-700 pb-2 border-b border-gray-100">ID Auto Generation</h2>

                        {/* Student ID */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">Student Admission No. Auto Generation</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-center justify-between max-w-sm">
                                    <Label className="text-[11px] font-medium text-gray-600">Auto Admission No.</Label>
                                    <Switch defaultChecked={false} className="data-[state=checked]:bg-indigo-500 scale-90" />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-medium text-gray-600">Admission No. Prefix <span className="text-red-500">*</span></Label>
                                        <Input className="h-8 border-gray-200 shadow-none rounded text-[11px]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-medium text-gray-600">Admission No. Digit <span className="text-red-500">*</span></Label>
                                        <Select>
                                            <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="4">4</SelectItem>
                                                <SelectItem value="5">5</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-medium text-gray-600">Admission Start From <span className="text-red-500">*</span></Label>
                                        <Input className="h-8 border-gray-200 shadow-none rounded text-[11px]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Staff ID */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">Staff ID Auto Generation</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-center justify-between max-w-sm">
                                    <Label className="text-[11px] font-medium text-gray-600">Auto Staff ID</Label>
                                    <Switch defaultChecked={false} className="data-[state=checked]:bg-indigo-500 scale-90" />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-medium text-gray-600">Staff ID Prefix <span className="text-red-500">*</span></Label>
                                        <Input className="h-8 border-gray-200 shadow-none rounded text-[11px]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-medium text-gray-600">Staff No. Digit <span className="text-red-500">*</span></Label>
                                        <Select>
                                            <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="4">4</SelectItem>
                                                <SelectItem value="5">5</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-medium text-gray-600">Staff ID Start From <span className="text-red-500">*</span></Label>
                                        <Input className="h-8 border-gray-200 shadow-none rounded text-[11px]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "Student / Guardian Panel":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <h2 className="text-sm font-bold text-gray-700 pb-2 border-b border-gray-100">Student / Guardian Panel</h2>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-medium text-gray-600">User Login Option</Label>
                                <div className="flex items-center gap-6">
                                    {["Student Login", "Parent Login"].map((label) => (
                                        <div key={label} className="flex items-center gap-2">
                                            <Checkbox id={label} defaultChecked className="border-gray-300 data-[state=checked]:bg-indigo-500" />
                                            <label htmlFor={label} className="text-[11px] text-gray-600 font-medium">{label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[11px] font-medium text-gray-600">Additional Username Option For Student Login</Label>
                                <div className="flex items-center gap-6">
                                    {["Admission No", "Mobile Number", "Email"].map((label) => (
                                        <div key={label} className="flex items-center gap-2">
                                            <Checkbox id={`s-${label}`} defaultChecked className="border-gray-300 data-[state=checked]:bg-indigo-500" />
                                            <label htmlFor={`s-${label}`} className="text-[11px] text-gray-600 font-medium">{label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[11px] font-medium text-gray-600">Additional Username Option For Parent Login</Label>
                                <div className="flex items-center gap-6">
                                    {["Mobile Number", "Email"].map((label) => (
                                        <div key={label} className="flex items-center gap-2">
                                            <Checkbox id={`p-${label}`} defaultChecked className="border-gray-300 data-[state=checked]:bg-indigo-500" />
                                            <label htmlFor={`p-${label}`} className="text-[11px] text-gray-600 font-medium">{label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between max-w-sm pt-2">
                                <Label className="text-[11px] font-medium text-gray-600">Allow Student To Add Timeline</Label>
                                <Switch className="data-[state=checked]:bg-indigo-500 scale-90" />
                            </div>
                        </div>
                    </div>
                );

            case "Backend Theme":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <h2 className="text-sm font-bold text-gray-700 pb-2 border-b border-gray-100">Backend Theme</h2>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Theme Mode (Light/Dark)</Label>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" className="h-10 w-10 border-gray-200 bg-white shadow-sm rounded-lg hover:border-indigo-400 transition-all">
                                        <Sun className="h-5 w-5 text-gray-600" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Skins (Shadow/Bordered)</Label>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" className="h-10 w-10 border-gray-200 bg-white shadow-sm rounded-lg hover:border-indigo-400 transition-all">
                                        <Grid2X2 className="h-5 w-5 text-gray-600" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Side Menu (Navigation)</Label>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" className="h-10 w-10 border-gray-200 bg-white shadow-sm rounded-lg hover:border-indigo-400 transition-all">
                                        <MoveHorizontal className="h-5 w-5 text-gray-600 rotate-90" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Primary Color</Label>
                                <div className="flex items-center gap-2.5">
                                    {["bg-indigo-500", "bg-blue-500", "bg-amber-500", "bg-teal-500", "bg-rose-500"].map((color, i) => (
                                        <button key={i} className={cn("h-6 w-6 rounded-md shadow-sm border border-white/50 transition-transform hover:scale-110", color, i === 0 && "ring-2 ring-indigo-200 ring-offset-1")} />
                                    ))}
                                    <Button variant="outline" className="h-7 w-7 p-0 border-gray-200 bg-white shadow-sm rounded-md">
                                        <Palette className="h-3 w-3 text-gray-400" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Box Content (Compact/Wide)</Label>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" className="h-10 w-10 border-gray-200 bg-white shadow-sm rounded-lg hover:border-indigo-400 transition-all">
                                        <Maximize className="h-5 w-5 text-gray-600" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-64 opacity-30">
                        <h2 className="text-lg font-bold text-gray-400">{activeTab} Settings</h2>
                        <p className="text-xs text-gray-400 uppercase tracking-widest mt-2">Configuration Module Pending</p>
                    </div>
                );
        }
    };

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-4">General Setting</h1>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Sidebar Tabs */}
                <div className="w-full md:w-64 space-y-0.5 bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden h-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "w-full text-left px-4 py-3 text-[11px] font-medium transition-all relative border-b border-gray-50 last:border-b-0",
                                activeTab === tab
                                    ? "bg-indigo-50/30 text-indigo-600 font-bold"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                            )}
                        >
                            {activeTab === tab && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full" />
                            )}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Right Content Area */}
                <div className="flex-1 bg-white border border-gray-100 rounded-lg shadow-sm p-6 relative min-h-[700px]">
                    {renderContent()}

                    {/* Save Button */}
                    <div className="absolute bottom-6 right-6 pt-6 bg-white w-full flex justify-end">
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md flex items-center gap-2">
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
