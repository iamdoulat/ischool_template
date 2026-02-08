"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Themes Data
const themes = [
    { id: "default", name: "default", bg: "bg-blue-600" },
    { id: "yellow", name: "yellow", bg: "bg-yellow-500" },
    { id: "darkgray", name: "darkgray", bg: "bg-gray-800" },
    { id: "bold_blue", name: "bold_blue", bg: "bg-blue-800" },
    { id: "shadow_white", name: "shadow_white", bg: "bg-slate-200" },
    { id: "material_pink", name: "material_pink", bg: "bg-pink-500" },
];

export default function FrontCmsSettingPage() {
    const [selectedTheme, setSelectedTheme] = useState("material_pink");

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Front CMS Setting</h1>

            {/* Main Form Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                    {/* LEFT COLUMN: System Configuration */}
                    <div className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                            <Label className="text-[11px] font-bold text-gray-600 md:col-span-4">Front CMS</Label>
                            <div className="md:col-span-8">
                                <Switch defaultChecked className="data-[state=checked]:bg-indigo-500 scale-90" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                            <Label className="text-[11px] font-bold text-gray-600 md:col-span-4">Sidebar</Label>
                            <div className="md:col-span-8">
                                <Switch defaultChecked className="data-[state=checked]:bg-indigo-500 scale-90" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                            <Label className="text-[11px] font-bold text-gray-600 md:col-span-4">Language RTL Text Mode</Label>
                            <div className="md:col-span-8">
                                <Switch className="data-[state=checked]:bg-indigo-500 scale-90" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                            <Label className="text-[11px] font-bold text-gray-600 md:col-span-4">Sidebar Option</Label>
                            <div className="md:col-span-8 flex gap-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="news" defaultChecked className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-500" />
                                    <label htmlFor="news" className="text-[11px] text-gray-600 font-medium">News</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="complain" defaultChecked className="h-3.5 w-3.5 border-gray-300 data-[state=checked]:bg-indigo-500" />
                                    <label htmlFor="complain" className="text-[11px] text-gray-600 font-medium">Complain</label>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                            <Label className="text-[11px] font-bold text-gray-600 md:col-span-4">Language</Label>
                            <div className="md:col-span-8">
                                <Select defaultValue="english">
                                    <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="english">English</SelectItem>
                                        <SelectItem value="spanish">Spanish</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Logo Upload Mockup */}
                        <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                            <Label className="text-[11px] font-bold text-gray-600 md:col-span-4 pt-2">Logo (368px X 75px)</Label>
                            <div className="md:col-span-8">
                                <div className="border border-gray-200 rounded p-2 flex items-center justify-center bg-gray-50 h-20 relative group cursor-pointer hover:bg-gray-100 transition-colors">
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-[9px] text-gray-500 bg-white px-1 rounded shadow-sm border border-gray-100">Click to Change</div>
                                    <div className="flex items-center gap-2 select-none pointer-events-none">
                                        <div className="h-8 w-8 bg-orange-500 rounded flex items-center justify-center text-white">
                                            <BookOpen size={16} fill="white" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-700">Smart School</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Favicon Upload Mockup */}
                        <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                            <Label className="text-[11px] font-bold text-gray-600 md:col-span-4 pt-2">Favicon (32px X 32px)</Label>
                            <div className="md:col-span-8">
                                <div className="border border-gray-200 rounded p-2 flex items-center justify-center bg-gray-50 h-12 relative group cursor-pointer hover:bg-gray-100 transition-colors w-full md:w-1/2">
                                    <div className="h-6 w-6 bg-orange-500 rounded flex items-center justify-center text-white">
                                        <BookOpen size={12} fill="white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                            <Label className="text-[11px] font-bold text-gray-600 md:col-span-4">Footer Text</Label>
                            <div className="md:col-span-8">
                                <Input defaultValue="© Smart School 2026. All rights reserved" className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                            <Label className="text-[11px] font-bold text-gray-600 md:col-span-4 pt-2">Cookie Consent</Label>
                            <div className="md:col-span-8">
                                <Textarea className="min-h-[60px] text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                            <Label className="text-[11px] font-bold text-gray-600 md:col-span-4 pt-2">Google Analytics</Label>
                            <div className="md:col-span-8">
                                <Textarea
                                    defaultValue={`<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
</script>`}
                                    className="min-h-[100px] text-[10px] font-mono border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y bg-gray-50/50"
                                />
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Social Media Links */}
                    <div className="space-y-4">
                        {[
                            { label: "WhatsApp URL", default: "https://www.whatsapp.com/" },
                            { label: "Facebook URL", default: "https://www.facebook.com/" },
                            { label: "Twitter URL", default: "https://twitter.com/x" },
                            { label: "Youtube URL", default: "https://www.youtube.com/" },
                            { label: "Google Plus", default: "https://plus.google.com/" },
                            { label: "Instagram URL", default: "https://www.instagram.com/" },
                            { label: "Pinterest URL", default: "https://in.pinterest.com/" },
                            { label: "LinkedIn URL", default: "https://www.linkedin.com/" },
                        ].map((field) => (
                            <div key={field.label} className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                <Label className="text-[11px] font-bold text-gray-600 md:col-span-3">{field.label}</Label>
                                <div className="md:col-span-9">
                                    <Input defaultValue={field.default} className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

                {/* Theme Selection Section */}
                <div className="pt-6 border-t border-gray-100 space-y-4">
                    <Label className="text-[11px] font-bold text-gray-600">Current Theme</Label>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {themes.map((theme) => (
                            <div
                                key={theme.id}
                                onClick={() => setSelectedTheme(theme.id)}
                                className={cn(
                                    "cursor-pointer group flex flex-col border rounded overflow-hidden transition-all",
                                    selectedTheme === theme.id ? "ring-2 ring-indigo-500 ring-offset-2 border-transparent" : "border-gray-200 hover:border-indigo-300"
                                )}
                            >
                                {/* Visual Representation of Theme Screenshot */}
                                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                    {/* Header Bar */}
                                    <div className="h-4 w-full bg-white border-b border-gray-200 flex items-center px-1 gap-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-red-400"></div>
                                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-400"></div>
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                                    </div>
                                    {/* Nav Bar Mock */}
                                    <div className={cn("h-6 w-full flex items-center px-2", theme.bg)}>
                                        <div className="h-2 w-12 bg-white/30 rounded"></div>
                                    </div>
                                    {/* Hero Area Mock */}
                                    <div className="p-2 space-y-1">
                                        <div className="h-8 w-2/3 bg-gray-200 rounded"></div>
                                        <div className="h-2 w-full bg-gray-200 rounded"></div>
                                        <div className="h-12 w-full bg-gray-200 rounded mt-2"></div>
                                        {/* Admission Circle Mock */}
                                        <div className="absolute right-4 top-12 h-10 w-10 rounded-full bg-red-500 shadow-lg border-2 border-white flex items-center justify-center">
                                            <div className="w-6 h-1 bg-white/50 rounded"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Label */}
                                <div className={cn(
                                    "py-1.5 text-center text-[10px] font-bold uppercase transition-colors tracking-wider",
                                    selectedTheme === theme.id ? "bg-[#6366f1] text-white" : "bg-gray-500 text-white"
                                )}>
                                    {theme.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Save Action */}
                <div className="flex justify-end pt-4 border-t border-gray-50">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md border-b-2 border-indigo-700">
                        Save
                    </Button>
                </div>

            </div>
        </div>
    );
}
