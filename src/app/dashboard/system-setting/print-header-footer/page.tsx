"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Bold, Italic, Underline, Quote, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Link2, Image as ImageIcon, UploadCloud, Printer, Loader2, Eye, Trash2, RotateCcw, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { toast as sonnerToast } from "sonner";
import { useSettings } from "@/components/providers/settings-provider";
import { getImageUrl } from "@/lib/image-url";

const tabs = ["Fees Receipt", "Payslip", "Online Admission Receipt", "Online Exam", "Email", "General Purpose", "Invoice"];
const paperSizes = [
    { value: "A4", label: "A4 (210mm × 297mm)", width: "210mm", height: "297mm" },
    { value: "A5", label: "A5 (148mm × 210mm)", width: "148mm", height: "210mm" },
    { value: "Legal", label: "Legal (216mm × 356mm)", width: "216mm", height: "356mm" },
];

function SkeletonContent() {
    return (
        <div className="space-y-6">
            <div className="space-y-3"><Skeleton className="h-4 w-40 rounded" /><Skeleton className="h-36 w-full rounded-md" /></div>
            <div className="space-y-3"><Skeleton className="h-4 w-32 rounded" /><Skeleton className="h-64 w-full rounded-md" /></div>
        </div>
    );
}

export default function PrintHeaderFooterPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { settings } = useSettings();
    const [activeTab, setActiveTab] = useState("Fees Receipt");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [deletingImage, setDeletingImage] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [settingsData, setSettingsData] = useState<Record<string, { id?: number; header_image_url: string | null; footer_content: string; paper_size: string; new_image_file: File | null }>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getTabTitle = (tab: string) => {
        const key = `print_tab_${tab.toLowerCase().replace(/ /g, '_')}`;
        const translated = t(key);
        return translated && translated !== key ? translated : tab;
    };

    const getPaperSizeLabel = (val: string, fallback: string) => {
        if (val === "A4") return t("paper_size_a4") || fallback;
        if (val === "A5") return t("paper_size_a5") || fallback;
        if (val === "Legal") return t("paper_size_legal") || fallback;
        return fallback;
    };

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('system-setting/print-settings');
            if (res.data?.status === 'success') {
                const fetchedSettings = res.data.data;
                const formattedData: Record<string, { id?: number; header_image_url: string | null; footer_content: string; paper_size: string; new_image_file: File | null }> = {};
                fetchedSettings.forEach((setting: { type: string; id?: number; header_image_url?: string | null; footer_content?: string; paper_size?: string }) => {
                    formattedData[setting.type] = {
                        id: setting.id,
                        header_image_url: setting.header_image_url || null,
                        footer_content: setting.footer_content || "",
                        paper_size: setting.paper_size || "A4",
                        new_image_file: null
                    };
                });
                setSettingsData(formattedData);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            sonnerToast.error(t("failed_load_print_settings") || "Failed to load print settings");
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { sonnerToast.error(t("image_size_must_be_less_than_5mb") || "Image size must be less than 5MB"); return; }
            if (!file.type.startsWith('image/')) { sonnerToast.error(t("please_upload_valid_image") || "Please upload a valid image file"); return; }
            const tempUrl = URL.createObjectURL(file);
            setSettingsData(prev => ({ ...prev, [activeTab]: { ...(prev[activeTab] || { footer_content: "", paper_size: "A4" }), header_image_url: tempUrl, new_image_file: file } }));
            setErrors(prev => ({ ...prev, header_image: '' }));
        }
    };

    const handleFooterChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length > 10000) { setErrors(prev => ({ ...prev, footer_content: t("footer_content_limit_exceeded") || "Footer content must not exceed 10000 characters" })); return; }
        setSettingsData(prev => ({ ...prev, [activeTab]: { ...(prev[activeTab] || { header_image_url: null, paper_size: "A4", new_image_file: null }), footer_content: value } }));
        setErrors(prev => ({ ...prev, footer_content: '' }));
    };

    const handlePaperSizeChange = (value: string) => {
        setSettingsData(prev => ({ ...prev, [activeTab]: { ...(prev[activeTab] || { header_image_url: null, footer_content: "", new_image_file: null }), paper_size: value } }));
    };

    const handleDeleteHeaderImage = async () => {
        if (!confirm(t("confirm_delete_header_image") || "Are you sure you want to delete the header image?")) return;
        const currentData = settingsData[activeTab];
        if (!currentData?.id) {
            setSettingsData(prev => ({ ...prev, [activeTab]: { ...(prev[activeTab] || { footer_content: "", paper_size: "A4" }), header_image_url: null, new_image_file: null } }));
            return;
        }
        setDeletingImage(true);
        try {
            const res = await api.delete(`system-setting/print-settings/${encodeURIComponent(activeTab)}/header-image`);
            if (res.data?.status === 'success') {
                setSettingsData(prev => ({ ...prev, [activeTab]: { ...(prev[activeTab] || { footer_content: "", paper_size: "A4" }), header_image_url: null, new_image_file: null } }));
                sonnerToast.success(t("header_image_deleted_successfully") || "Header image deleted successfully");
            }
        } catch (error) {
            sonnerToast.error(t("failed_delete_header_image") || "Failed to delete header image");
            console.error(error);
        } finally {
            setDeletingImage(false);
        }
    };

    const handleSave = async () => {
        const currentData = settingsData[activeTab] || { header_image_url: null, footer_content: "", paper_size: "A4", new_image_file: null };
        const tabTitle = getTabTitle(activeTab);
        if (!currentData.paper_size) { sonnerToast.error(t("please_select_paper_size") || "Please select a paper size"); return; }
        setSaving(true);
        setErrors({});
        try {
            const formData = new FormData();
            formData.append('type', activeTab);
            formData.append('paper_size', currentData.paper_size);
            if (currentData.new_image_file) formData.append('header_image', currentData.new_image_file);
            formData.append('footer_content', currentData.footer_content || '');
            const res = await api.post('system-setting/print-settings', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data?.status === 'success') {
                sonnerToast.success(`${tabTitle} ${t("configuration_saved") || "configuration saved successfully"}`);
                toast("success", `${tabTitle} ${t("configuration_saved") || "configuration saved successfully"}`);
                setSettingsData(prev => ({ ...prev, [activeTab]: { id: res.data.data.id, header_image_url: res.data.data.header_image_url || prev[activeTab]?.header_image_url, footer_content: res.data.data.footer_content || prev[activeTab]?.footer_content || '', paper_size: res.data.data.paper_size || prev[activeTab]?.paper_size || 'A4', new_image_file: null } }));
            }
        } catch (error: unknown) {
            const errRes = error as { response?: { data?: { errors?: Record<string, string> } } };
            if (errRes.response?.data?.errors) { setErrors(errRes.response.data.errors); sonnerToast.error("Validation failed. Please check the form."); }
            else { sonnerToast.error(`${t("failed_to_save") || "Failed to save"} ${tabTitle} ${t("configuration") || "configuration"}`); toast("error", `${t("failed_to_save") || "Failed to save"} ${tabTitle} ${t("configuration") || "configuration"}`); }
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleResetAll = async () => {
        if (!confirm(t("confirm_reset_all_print_settings") || "Are you sure you want to reset ALL print settings? This will delete all headers and footers for all types.")) return;
        setResetting(true);
        try {
            const res = await api.post('system-setting/print-settings/reset-all');
            if (res.data?.status === 'success') { sonnerToast.success(t("all_print_settings_reset_success") || "All print settings have been reset"); fetchSettings(); }
        } catch (error) {
            sonnerToast.error(t("failed_reset_settings") || "Failed to reset settings");
            console.error(error);
        } finally {
            setResetting(false);
        }
    };

    const currentTabSettings = settingsData[activeTab] || { header_image_url: null, footer_content: "", paper_size: "A4", new_image_file: null };
    const currentPaperSize = paperSizes.find(ps => ps.value === currentTabSettings.paper_size) || paperSizes[0];
    const currentTabTitle = getTabTitle(activeTab);

    return (
        <div className="p-2 sm:p-3 md:p-4 space-y-4 sm:space-y-6 bg-gray-50/10 min-h-screen font-sans">
            
            {/* Standalone Edge-to-Edge Page Header Banner */}
            <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Printer className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-sm sm:text-base font-bold text-gray-800 tracking-tight leading-none">
                                {t("print_header_footer") || "Print Header & Footer"}
                            </h1>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1">
                                {t("manage_print_header_and_footer_templates") || "Manage print header and footer templates for various document types"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={() => setShowPreview(true)} 
                            variant="outline" 
                            size="sm" 
                            disabled={loading} 
                            className="text-[11px] h-8 gap-1.5 border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer shadow-2xs"
                        >
                            <Eye className="h-3.5 w-3.5" />
                            {t("preview") || "Preview"}
                        </Button>
                        <Button 
                            onClick={handleResetAll} 
                            variant="outline" 
                            size="sm" 
                            disabled={loading || resetting} 
                            className="text-[11px] h-8 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 cursor-pointer shadow-2xs"
                        >
                            {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                            {t("reset_all") || "Reset All"}
                        </Button>
                    </div>
                </div>
            </div>

            <Card className="pt-0 overflow-hidden border border-gray-100 shadow-sm">
                <CardContent className="p-0">
                    <div className="flex overflow-x-auto no-scrollbar border-b border-gray-100 bg-white">
                        {tabs.map((tab) => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)} 
                                className={cn(
                                    "px-4 py-3 text-[11px] font-medium transition-all whitespace-nowrap border-b-2 cursor-pointer", 
                                    activeTab === tab ? "text-indigo-600 border-indigo-500 font-bold bg-indigo-50/10" : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                {getTabTitle(tab)}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 sm:p-5 md:p-6 space-y-6">
                        {loading ? (
                            <SkeletonContent />
                        ) : (
                            <>
                                {/* Paper Size Selector */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                    <Label className="text-[11px] font-bold text-gray-600 md:col-span-2 flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5" />
                                        {t("paper_size") || "Paper Size"} <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="md:col-span-10">
                                        <Select value={currentTabSettings.paper_size} onValueChange={handlePaperSizeChange}>
                                            <SelectTrigger className="h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded bg-white">
                                                <SelectValue placeholder={t("select_paper_size") || "Select paper size"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {paperSizes.map((size) => (
                                                    <SelectItem key={size.value} value={size.value} className="text-[11px]">
                                                        {getPaperSizeLabel(size.value, size.label)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-gray-500 mt-1.5">
                                            {t("selected_paper_size", { size: getPaperSizeLabel(currentPaperSize.value, currentPaperSize.label) }) || `Selected: ${getPaperSizeLabel(currentPaperSize.value, currentPaperSize.label)}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Header Image Section */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <label className="text-[11px] font-medium text-gray-600">
                                                {t("header_image_dimensions", { dimensions: "2230px × 300px" }) || `${t("header_image") || "Header Image"} (2230px × 300px)`}
                                            </label>
                                            <span className="text-red-500 text-[11px]">*</span>
                                        </div>
                                        {currentTabSettings.header_image_url && (
                                            <Button 
                                                onClick={handleDeleteHeaderImage} 
                                                disabled={deletingImage} 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-7 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50 gap-1 cursor-pointer"
                                            >
                                                {deletingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                                {t("delete_image") || "Delete Image"}
                                            </Button>
                                        )}
                                    </div>

                                    <div 
                                        onClick={() => fileInputRef.current?.click()} 
                                        className="border-2 border-dashed border-gray-200 hover:border-indigo-400 cursor-pointer rounded-md overflow-hidden bg-gray-50/50 shadow-xs relative group transition-colors"
                                    >
                                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                                        {currentTabSettings.header_image_url ? (
                                            <div className="w-full aspect-[2230/300] min-h-[150px] relative">
                                                <img src={currentTabSettings.header_image_url} alt="Header Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="bg-white px-4 py-2 rounded shadow text-sm font-bold flex items-center gap-2 text-gray-700">
                                                        <UploadCloud size={16} /> {t("change_image") || "Change Image"}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full relative group min-h-[150px]">
                                                <div className="w-full flex flex-col bg-white">
                                                    <div className="flex justify-between p-4 md:p-6 bg-white min-h-[120px]">
                                                        <div className="flex flex-col justify-between items-start">
                                                            <div className="h-10 md:h-12 relative flex items-center">
                                                                <img 
                                                                    src={getImageUrl(settings.print_logo || settings.admin_logo || settings.app_logo || "/logo-print.png")} 
                                                                    alt="Logo" 
                                                                    className="max-h-full object-contain" 
                                                                    onError={(e) => { (e.target as HTMLImageElement).src = "/logo-print.png"; }} 
                                                                />
                                                            </div>
                                                            <div className="text-2xl md:text-3xl font-bold mt-3 tracking-tight p-1">
                                                                {settings.school_name || "Your School Name Here"}
                                                            </div>
                                                        </div>
                                                        <div className="text-right text-[11px] md:text-sm flex flex-col justify-center space-y-0.5 p-2">
                                                            {(settings.school_code || (settings as unknown as { dise_code?: string }).dise_code) && (
                                                                <div><span className="font-bold">{t("school_code_label") || "School Code:"}</span> {settings.school_code || (settings as unknown as { dise_code?: string }).dise_code}</div>
                                                            )}
                                                            <div><span className="font-bold">{t("address_label") || "Address:"}</span> {settings.address || "25 Kings Street, CA"}</div>
                                                            <div><span className="font-bold">{t("phone_no_label") || "Phone No.:"}</span> {settings.phone || "89562423934"}</div>
                                                            <div><span className="font-bold">{t("email_label") || "Email:"}</span> {settings.email || "yourschool@gmail.com"}</div>
                                                            <div><span className="font-bold">{t("website_label") || "Website:"}</span> {(settings.frontend_url || process.env.NEXT_PUBLIC_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.host : '') || settings.base_url)?.replace(/^https?:\/\//, '') || "localhost:3000"}</div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-black text-white text-center py-2 font-bold text-sm md:text-lg uppercase">
                                                        {currentTabTitle}
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <div className="bg-white px-4 py-2 rounded shadow text-sm font-bold flex items-center gap-2 text-gray-700">
                                                            <UploadCloud size={16} /> {t("click_to_upload_custom_image") || "Click to upload custom image"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {errors.header_image && (<p className="text-[10px] text-red-500">{errors.header_image}</p>)}
                                </div>

                                {/* Footer Content Section */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-medium text-gray-600">{t("footer_content") || "Footer Content"}</label>
                                        <span className="text-[10px] text-gray-400">{currentTabSettings.footer_content?.length || 0} / 10000</span>
                                    </div>
                                    <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-xs flex flex-col h-64 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                                        <div className="flex items-center gap-1 p-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
                                            <div className="flex items-center gap-0.5 border-r border-gray-200 pr-1.5 mr-1">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-[10px] font-bold text-gray-500">A</Button>
                                                <Select defaultValue="normal">
                                                    <SelectTrigger className="h-6 w-24 text-[10px] border-none shadow-none bg-transparent focus:ring-0 p-0">
                                                        <SelectValue placeholder={t("normal_text") || "Normal Text"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="normal">{t("normal_text") || "Normal Text"}</SelectItem>
                                                        <SelectItem value="bold">{t("bold") || "Bold"}</SelectItem>
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
                                                placeholder={t("type_your_footer_content_here") || "Type your footer content here..."} 
                                                className="absolute inset-0 w-full h-full p-3 resize-none outline-none border-none text-[11px] text-gray-700 font-sans" 
                                                maxLength={10000} 
                                            />
                                        </div>
                                    </div>
                                    {errors.footer_content && (<p className="text-[10px] text-red-500">{errors.footer_content}</p>)}
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end pt-4 border-t border-gray-50">
                                    <Button 
                                        onClick={handleSave} 
                                        disabled={saving} 
                                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-10 h-10 text-xs font-bold uppercase transition-all rounded-full shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 cursor-pointer"
                                    >
                                        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("saving") || "Saving..."}</> : (t("save") || "Save")}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Preview Modal */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span>{t("print_preview_title", { tab: currentTabTitle }) || `Print Preview - ${currentTabTitle}`}</span>
                                <span className="text-sm font-normal text-gray-500">({getPaperSizeLabel(currentPaperSize.value, currentPaperSize.label)})</span>
                            </div>
                            <Button onClick={() => setShowPreview(false)} variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogTitle>
                        <DialogDescription>
                            {t("print_preview_desc") || "Preview of how your print will appear with header, footer, and selected paper size"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 p-4 bg-gray-100 rounded-lg flex justify-center">
                        <div className="bg-white shadow-lg" style={{ width: currentPaperSize.width, minHeight: currentPaperSize.height, maxWidth: '100%' }}>
                            <div className="flex flex-col h-full">
                                {currentTabSettings.header_image_url ? (
                                    <div className="border-b border-gray-200">
                                        <img src={currentTabSettings.header_image_url} alt="Header Preview" className="w-full h-auto" />
                                    </div>
                                ) : (
                                    <div className="w-full flex flex-col border-b border-gray-200 bg-white">
                                        <div className="flex justify-between p-4 md:p-6 bg-white min-h-[120px]">
                                            <div className="flex flex-col justify-between items-start">
                                                <div className="h-10 md:h-12 relative flex items-center">
                                                    <img 
                                                        src={getImageUrl(settings.print_logo || settings.admin_logo || settings.app_logo || "/logo-print.png")} 
                                                        alt="Logo" 
                                                        className="max-h-full object-contain" 
                                                        onError={(e) => { (e.target as HTMLImageElement).src = "/logo-print.png"; }} 
                                                    />
                                                </div>
                                                <div className="text-2xl md:text-3xl font-bold mt-3 tracking-tight p-1">
                                                    {settings.school_name || "Your School Name Here"}
                                                </div>
                                            </div>
                                            <div className="text-right text-[11px] md:text-sm flex flex-col justify-center space-y-0.5 p-2">
                                                {(settings.school_code || (settings as unknown as { dise_code?: string }).dise_code) && (
                                                    <div><span className="font-bold">{t("school_code_label") || "School Code:"}</span> {settings.school_code || (settings as unknown as { dise_code?: string }).dise_code}</div>
                                                )}
                                                <div><span className="font-bold">{t("address_label") || "Address:"}</span> {settings.address || "25 Kings Street, CA"}</div>
                                                <div><span className="font-bold">{t("phone_no_label") || "Phone No.:"}</span> {settings.phone || "89562423934"}</div>
                                                <div><span className="font-bold">{t("email_label") || "Email:"}</span> {settings.email || "yourschool@gmail.com"}</div>
                                                <div><span className="font-bold">{t("website_label") || "Website:"}</span> {(settings.frontend_url || process.env.NEXT_PUBLIC_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.host : '') || settings.base_url)?.replace(/^https?:\/\//, '') || "localhost:3000"}</div>
                                            </div>
                                        </div>

                                        <div className="bg-black text-white text-center py-2 font-bold text-sm md:text-lg uppercase">
                                            {currentTabTitle}
                                        </div>
                                    </div>
                                )}

                                <div className="flex-1 p-8">
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b">
                                        <h2 className="text-2xl font-bold">{currentTabTitle}</h2>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{currentPaperSize.value}</span>
                                    </div>
                                    <div className="space-y-4 text-sm text-gray-700">
                                        <p>{t("sample_preview_notice") || "This is a sample preview of your print document."}</p>
                                        <p>{t("sample_preview_explanation") || "The header image appears at the top, followed by your document content, and the footer appears at the bottom."}</p>
                                        <div className="border border-gray-200 rounded p-4 mt-6">
                                            <p className="text-xs text-gray-500 mb-2">{t("sample_content_area") || "Sample content area"}</p>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>{t("sample_item_1") || "Item 1"}</span>
                                                    <span>$100.00</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>{t("sample_item_2") || "Item 2"}</span>
                                                    <span>$200.00</span>
                                                </div>
                                                <div className="flex justify-between text-sm font-bold border-t pt-2">
                                                    <span>{t("total") || "Total"}</span>
                                                    <span>$300.00</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {currentTabSettings.footer_content && (
                                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                                        <div className="text-xs text-gray-600 whitespace-pre-wrap text-center">
                                            {currentTabSettings.footer_content}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-xs text-gray-500">
                            {t("paper_size") || "Paper Size"}: <span className="font-semibold">{getPaperSizeLabel(currentPaperSize.value, currentPaperSize.label)}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => setShowPreview(false)} variant="outline" size="sm" className="cursor-pointer">
                                {t("close") || "Close"}
                            </Button>
                            <Button onClick={() => window.print()} size="sm" className="bg-gradient-to-r from-orange-400 to-indigo-500 text-white cursor-pointer">
                                <Printer className="h-3.5 w-3.5 mr-1.5" />
                                {t("print") || "Print"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
