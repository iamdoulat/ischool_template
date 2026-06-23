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
    Card,
    CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
    UploadCloud,
    Printer,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";

const tabs = [
    "Fees Receipt",
    "Payslip",
    "Online Admission Receipt",
    "Online Exam",
    "Email",
    "General Purpose",
    "Invoice"
];

function SkeletonContent() {
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-36 w-full rounded-md" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-64 w-full rounded-md" />
            </div>
        </div>
    );
}

export default function PrintHeaderFooterPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("Fees Receipt");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
            toast("error", t("failed_to_fetch_print_settings"));
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
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.status === 'success') {
                toast("success", `${activeTab} ${t("configuration_saved")}`);
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
            toast("error", `${t("failed_to_save")} ${activeTab} ${t("configuration")}`);
        } finally {
            setSaving(false);
        }
    };

    const currentTabSettings = settingsData[activeTab] || { header_image_url: null, footer_content: "" };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <Card className="pt-0 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Printer className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("print_header_footer")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("manage_print_header_and_footer_templates")}</p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-0">
                    {/* Tabs inside card */}
                    <div className="flex overflow-x-auto no-scrollbar border-b border-gray-100 bg-white rounded-tr-lg">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-4 py-3 text-[11px] font-medium transition-all whitespace-nowrap border-b-2",
                                    activeTab === tab
                                        ? "text-indigo-600 border-indigo-500 font-bold bg-indigo-50/10"
                                        : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 space-y-6">
                        {loading ? (
                            <SkeletonContent />
                        ) : (
                            <>
                                {/* Header Image Section */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1">
                                        <label className="text-[11px] font-medium text-gray-600">{t("header_image")} (2230px X 300px)</label>
                                        <span className="text-red-500 text-[11px]">*</span>
                                    </div>

                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-200 hover:border-indigo-400 cursor-pointer rounded-md overflow-hidden bg-gray-50/50 shadow-sm relative group transition-colors"
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            accept="image/*"
                                            className="hidden"
                                        />

                                        {currentTabSettings.header_image_url ? (
                                            <div className="w-full aspect-[2230/300] min-h-[150px] relative">
                                                <img
                                                    src={currentTabSettings.header_image_url}
                                                    alt="Header Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="bg-white px-4 py-2 rounded shadow text-sm font-bold flex items-center gap-2 text-gray-700">
                                                        <UploadCloud size={16} /> {t("change_image")}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full aspect-[2230/300] min-h-[150px] bg-white relative p-4 md:p-8 flex flex-col justify-between items-center group">
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <UploadCloud className="h-10 w-10 text-indigo-400 mb-2" />
                                                    <p className="text-sm font-bold text-gray-500 tracking-tight">
                                                        {t("click_to_upload_header_image")}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1">{t("recommended_size_2230x300_pixels")}</p>
                                                </div>
                                                <div className="absolute bottom-6 left-0 right-0 py-1.5 flex justify-center items-center opacity-30">
                                                    <span className="text-gray-800 font-bold text-sm md:text-base uppercase tracking-wider bg-gray-100 px-4 py-1 rounded">
                                                        {activeTab} {t("preview")}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Content Section */}
                                <div className="space-y-2">
                                    <label className="text-[11px] font-medium text-gray-600">{t("footer_content")}</label>

                                    <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm flex flex-col h-64 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                                        {/* Rich Text Toolbar */}
                                        <div className="flex items-center gap-1 p-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
                                            <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-[10px] font-bold text-gray-500">A</Button>
                                                <Select defaultValue="normal">
                                                    <SelectTrigger className="h-6 w-24 text-[10px] border-none shadow-none bg-transparent focus:ring-0 p-0">
                                                        <SelectValue placeholder={t("normal_text")} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="normal">{t("normal_text")}</SelectItem>
                                                        <SelectItem value="bold">{t("bold")}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><Bold size={14} /></Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><Italic size={14} /></Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-indigo-600 hover:bg-gray-100"><Underline size={14} /></Button>
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

                                        <div className="flex-1 p-0 relative">
                                            <textarea
                                                value={currentTabSettings.footer_content}
                                                onChange={handleFooterChange}
                                                placeholder={t("type_your_footer_content_here")}
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
                                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-10 h-10 text-xs font-bold uppercase transition-all rounded-full shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5"
                                    >
                                        {saving ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("saving")}</>
                                        ) : t("save")}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
