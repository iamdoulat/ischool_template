"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Bold,
    Italic,
    Underline,
    Quote,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Link2,
    Image as ImageIcon,
    BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
    "Fees Receipt",
    "Payslip",
    "Online Admission Receipt",
    "Online Exam",
    "Email",
    "General Purpose"
];

export default function PrintHeaderFooterPage() {
    const [activeTab, setActiveTab] = useState("Fees Receipt");

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans space-y-4">

            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-t-lg border-b border-gray-100 shadow-sm relative z-10">
                <h1 className="text-sm font-medium text-gray-800 tracking-tight">Print Header Footer</h1>

                <div className="flex overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-4 py-2 text-[11px] font-medium transition-all whitespace-nowrap border-b-2",
                                activeTab === tab
                                    ? "text-indigo-600 border-indigo-500 font-bold bg-indigo-50/10"
                                    : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-b-lg shadow-sm border border-gray-100 p-6 space-y-6">

                {/* Header Image Section */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1">
                        <label className="text-[11px] font-medium text-gray-600">Header Image (2230px X 300px)</label>
                        <span className="text-red-500 text-[11px]">*</span>
                    </div>

                    <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm relative">
                        {/* Mock Header Image Content */}
                        <div className="w-full aspect-[2230/300] min-h-[150px] bg-white relative p-4 md:p-8 flex flex-col justify-between select-none pointer-events-none">
                            <div className="flex justify-between items-start">
                                {/* Logo */}
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-orange-500 rounded flex items-center justify-center text-white">
                                        <BookOpen size={16} fill="white" />
                                    </div>
                                    <span className="text-lg font-bold text-green-600 bg-yellow-300 px-1">SMART SCHOOL</span>
                                </div>

                                {/* Right Contact Info */}
                                <div className="text-right text-[10px] md:text-sm font-bold text-gray-800 leading-tight space-y-0.5">
                                    <p>Address: 25 Kings Street, CA</p>
                                    <p>Phone No.: 89562423934</p>
                                    <p>Email: yourschool@gmail.com</p>
                                    <p>Website: www.yoursite.in</p>
                                </div>
                            </div>

                            {/* Center School Name */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <h1 className="text-2xl md:text-4xl font-bold text-black tracking-tight mt-[-40px]">
                                    Your School Name Here
                                </h1>
                            </div>

                            {/* Bottom Receipt Bar */}
                            <div className="absolute bottom-6 left-0 right-0 bg-black py-1.5 flex justify-center items-center">
                                <span className="text-white font-bold text-sm md:text-base uppercase tracking-wider">
                                    {activeTab}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Content Section */}
                <div className="space-y-2">
                    <label className="text-[11px] font-medium text-gray-600">Footer Content</label>

                    <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm flex flex-col h-64">
                        {/* Rich Text Toolbar */}
                        <div className="flex items-center gap-1 p-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
                            {/* Text Style Dropdown Mock */}
                            <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-[10px] font-bold text-gray-500">A</Button>
                                <Select defaultValue="normal">
                                    <SelectTrigger className="h-6 w-24 text-[10px] border-none shadow-none bg-transparent focus:ring-0 p-0">
                                        <SelectValue placeholder="Normal text" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="normal">Normal text</SelectItem>
                                        <SelectItem value="bold">Bold</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Formatting Icons */}
                            <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><Bold size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><Italic size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><Underline size={14} /></Button>
                                <Button variant="ghost" className="h-6 px-1.5 text-[10px] text-gray-500 hover:text-indigo-600 hover:bg-gray-100 font-medium">Small</Button>
                            </div>

                            {/* Paragraph Icons */}
                            <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><Quote size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><List size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><ListOrdered size={14} /></Button>
                            </div>

                            {/* Alignment Icons */}
                            <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><AlignLeft size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><AlignCenter size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><AlignRight size={14} /></Button>
                            </div>

                            {/* Links & Media */}
                            <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><Link2 size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><ImageIcon size={14} /></Button>
                            </div>
                        </div>

                        {/* Text Area Content */}
                        <div className="flex-1 p-3">
                            <p className="text-[11px] text-gray-700 font-sans">
                                This receipt is computer generated hence no signature is required.
                            </p>
                        </div>
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
