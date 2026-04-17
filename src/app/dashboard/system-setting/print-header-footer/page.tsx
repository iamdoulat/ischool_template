"use client";

import { useState, useRef, useEffect } from "react";
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
    BookOpen,
    UploadCloud,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const tabs = [
    "Fees Receipt",
    "Payslip",
    "Online Admission Receipt",
    "Online Exam",
    "Email",
    "General Purpose"
];

export default function PrintHeaderFooterPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("Fees Receipt");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Store data for all tabs: { "Fees Receipt": { header_image_url: "...", footer_content: "...", new_image_file: File } }
    const [settingsData, setSettingsData] = useState<Record<string, any>>({});

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('system-setting/print-settings');
            if (res.data?.status === 'success') {
                const fetchedSettings = res.data.data;
                const formattedData: any = {};

                fetchedSettings.forEach((setting: any) => {
                    formattedData[setting.type] = {
                        header_image_url: setting.header_image_url || null,
                        footer_content: setting.footer_content || "",
                        new_image_file: null
                    };
                });

                setSettingsData(formattedData);
            }
        } catch (error) {
            toast("error", "Failed to fetch print settings");
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            setSettingsData(prev => ({
                ...prev,
                [activeTab]: {
                    ...(prev[activeTab] || {}),
                    header_image_url: tempUrl,
                    new_image_file: file
                }
            }));
        }
    };

    const handleFooterChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSettingsData(prev => ({
            ...prev,
            [activeTab]: {
                ...(prev[activeTab] || {}),
                footer_content: e.target.value
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const currentData = settingsData[activeTab] || {};

            const formData = new FormData();
            formData.append('type', activeTab);

            if (currentData.new_image_file) {
                formData.append('header_image', currentData.new_image_file);
            }
            if (currentData.footer_content !== undefined) {
                formData.append('footer_content', currentData.footer_content);
            }

            const res = await api.post('system-setting/print-settings', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data?.status === 'success') {
                toast("success", `${activeTab} Configuration Saved`);
                // Clear the new file pending state since it's uploaded
                setSettingsData(prev => ({
                    ...prev,
                    [activeTab]: {
                        ...prev[activeTab],
                        new_image_file: null,
                        header_image_url: res.data.data.header_image_url || prev[activeTab]?.header_image_url
                    }
                }));
            }
        } catch (error) {
            toast("error", `Failed to save ${activeTab} configuration`);
        } finally {
            setSaving(false);
        }
    };

    const currentTabSettings = settingsData[activeTab] || { header_image_url: null, footer_content: "" };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

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

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 hover:border-indigo-400 cursor-pointer rounded-md overflow-hidden bg-gray-50/50 shadow-sm relative group transition-colors"
                    >
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />

                        {currentTabSettings.header_image_url ? (
                            <div className="w-full aspect-[2230/300] min-h-[150px] relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={currentTabSettings.header_image_url}
                                    alt="Header Preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="bg-white px-4 py-2 rounded shadow text-sm font-bold flex items-center gap-2 text-gray-700">
                                        <UploadCloud size={16} /> Change Image
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full aspect-[2230/300] min-h-[150px] bg-white relative p-4 md:p-8 flex flex-col justify-between items-center group">
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                                    <UploadCloud className="h-10 w-10 text-indigo-400 mb-2" />
                                    <p className="text-sm font-bold text-gray-500 tracking-tight">
                                        Click to Upload Header Image
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">Recommended size: 2230x300 pixels</p>
                                </div>
                                <div className="absolute bottom-6 left-0 right-0 py-1.5 flex justify-center items-center opacity-30">
                                    <span className="text-gray-800 font-bold text-sm md:text-base uppercase tracking-wider bg-gray-100 px-4 py-1 rounded">
                                        {activeTab} Preview
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Content Section */}
                <div className="space-y-2">
                    <label className="text-[11px] font-medium text-gray-600">Footer Content</label>

                    <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm flex flex-col h-64 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                        {/* Rich Text Toolbar Mock */}
                        <div className="flex items-center gap-1 p-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
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
                            <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><Bold size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><Italic size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><Underline size={14} /></Button>
                                <Button variant="ghost" className="h-6 px-1.5 text-[10px] text-gray-500 hover:text-indigo-600 hover:bg-gray-100 font-medium">Small</Button>
                            </div>
                            <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><Quote size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><List size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><ListOrdered size={14} /></Button>
                            </div>
                            <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><AlignLeft size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><AlignCenter size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><AlignRight size={14} /></Button>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><Link2 size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><ImageIcon size={14} /></Button>
                            </div>
                        </div>

                        {/* Text Area Content */}
                        <div className="flex-1 p-0 relative">
                            <textarea
                                value={currentTabSettings.footer_content}
                                onChange={handleFooterChange}
                                placeholder="Type your footer content here..."
                                className="absolute inset-0 w-full h-full p-3 resize-none outline-none border-none text-[11px] text-gray-700 font-sans"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Save Action */}
                <div className="flex justify-end pt-4 border-t border-gray-50">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-90 text-white px-10 h-10 text-xs font-bold uppercase transition-all rounded-full shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5"
                    >
                        {saving ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                        ) : "Save"}
                    </Button>
                </div>

            </div>
        </div>
    );
}
