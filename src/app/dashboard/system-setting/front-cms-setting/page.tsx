"use client";

import { useState, useEffect, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    BookOpen, 
    Loader2, 
    Plus, 
    Trash2, 
    Globe, 
    Share2, 
    LayoutPanelLeft, 
    FileText, 
    Users, 
    GraduationCap, 
    Info,
    ChevronLeft,
    ChevronRight,
    X,
    Save,
    Pencil,
    Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

const themes = [
    { id: "default", name: "default", bg: "bg-blue-600" },
    { id: "yellow", name: "yellow", bg: "bg-yellow-500" },
    { id: "darkgray", name: "darkgray", bg: "bg-gray-800" },
    { id: "bold_blue", name: "bold_blue", bg: "bg-blue-800" },
    { id: "shadow_white", name: "shadow_white", bg: "bg-slate-200" },
    { id: "material_pink", name: "material_pink", bg: "bg-pink-500" },
];

export default function FrontCmsSettingPage() {
    const { toast } = useToast();
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState<any>({
        is_active: true,
        sidebar_active: true,
        rtl_mode: false,
        sidebar_options: ["news", "complain"],
        language: "english",
        logo: null,
        favicon: null,
        footer_text: "© Smart School 2026. All rights reserved",
        cookie_consent: "",
        google_analytics: "",
        social_media: {
            whatsapp: "https://www.whatsapp.com/",
            facebook: "https://www.facebook.com/",
            twitter: "https://twitter.com/x",
            youtube: "https://www.youtube.com/",
            google_plus: "https://plus.google.com/",
            instagram: "https://www.instagram.com/",
            pinterest: "https://in.pinterest.com/",
            linkedin: "https://www.linkedin.com/",
        },
        current_theme: "material_pink",
        about_us: { title: "Welcome to Smart School", description: "Providing quality education for over two decades...", image_url: "" },
        main_courses: [
            { id: 1, title: "English Literature", description: "Advanced study of classic literature", price: "Free" },
            { id: 2, title: "Computer Science", description: "Modern programming and algorithms", price: "Free" }
        ],
        experienced_staffs: [
            { id: 1, name: "Jason Sharlton", role: "Principal", image_url: "" },
            { id: 2, name: "Elena Gilbert", role: "Vice Principal", image_url: "" }
        ],
        latest_notices: [
            { id: 1, title: "Annual Sports Day", date: "2026-03-15" },
            { id: 2, title: "Admissions Open", date: "2026-04-01" }
        ],
        header_footer_sections: {
            header_text: "Enrolment Open: 2026-27",
            header_link: "#",
            footer_links: [
                { title: "Privacy Policy", url: "/privacy" },
                { title: "Terms of Service", url: "/terms" }
            ]
        },
        logo_preview: "",
        logo_file: null,
        favicon_preview: "",
        favicon_file: null,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get("system-setting/front-cms-settings");
            if (res.data?.status === "success" && res.data.data) {
                const fetched = res.data.data;
                setSettings((prev: any) => ({
                    ...prev,
                    ...fetched,
                    logo_preview: fetched.logo_url || "",
                    favicon_preview: fetched.favicon_url || "",
                    // Ensure arrays are initialized if null
                    social_media: fetched.social_media || prev.social_media,
                    about_us: fetched.about_us || prev.about_us,
                    main_courses: fetched.main_courses || prev.main_courses,
                    experienced_staffs: fetched.experienced_staffs || prev.experienced_staffs,
                    latest_notices: fetched.latest_notices || prev.latest_notices,
                }));
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "favicon") => {
        const file = e.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setSettings({
                ...settings,
                [`${type}_preview`]: previewUrl,
                [`${type}_file`]: file
            });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();

            Object.keys(settings).forEach(key => {
                if (["logo_preview", "favicon_preview", "logo_file", "favicon_file", "logo_url", "favicon_url"].includes(key)) return;

                const value = settings[key];
                if (typeof value === 'object' && value !== null) {
                    formData.append(key, JSON.stringify(value));
                } else if (value !== null && value !== undefined) {
                    formData.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value);
                }
            });

            if (settings.logo_file) formData.append('logo', settings.logo_file);
            if (settings.favicon_file) formData.append('favicon', settings.favicon_file);

            const res = await api.post("system-setting/front-cms-settings", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.status === "success") {
                toast("success", "Front CMS settings saved successfully");
                fetchSettings();
            }
        } catch (error) {
            toast("error", "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const addListItem = (section: string, item: any) => {
        setSettings({ ...settings, [section]: [...settings[section], { ...item, id: Date.now() }] });
    };

    const removeListItem = (section: string, id: number) => {
        setSettings({ ...settings, [section]: settings[section].filter((item: any) => item.id !== id) });
    };

    const updateNestedField = (section: string, field: string, value: any) => {
        setSettings({
            ...settings,
            [section]: { ...settings[section], [field]: value }
        });
    };

    const updateSocialField = (platform: string, value: string) => {
        setSettings({
            ...settings,
            social_media: { ...settings.social_media, [platform]: value }
        });
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-sm font-semibold text-gray-800 tracking-tight">Front CMS Setting</h1>
                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-6 h-9 font-bold rounded-full shadow-md flex items-center gap-2"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save All Changes
                </Button>
            </div>

            <Tabs defaultValue="system" className="w-full">
                <TabsList className="bg-white border text-gray-500 h-11 p-1 gap-1 rounded-xl shadow-sm border-gray-100">
                    <TabsTrigger value="system" className="text-[11px] font-bold uppercase gap-2 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
                        <Globe size={14} className="stroke-[2.5px]" /> System
                    </TabsTrigger>
                    <TabsTrigger value="social" className="text-[11px] font-bold uppercase gap-2 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
                        <Share2 size={14} className="stroke-[2.5px]" /> Social Links
                    </TabsTrigger>
                    <TabsTrigger value="sections" className="text-[11px] font-bold uppercase gap-2 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
                        <LayoutPanelLeft size={14} className="stroke-[2.5px]" /> Sections
                    </TabsTrigger>
                </TabsList>

                {/* SYSTEM TAB */}
                <TabsContent value="system" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4">Front CMS</Label>
                                    <div className="md:col-span-8 flex items-center gap-2">
                                        <Switch
                                            checked={settings.is_active}
                                            onCheckedChange={(v) => setSettings({ ...settings, is_active: v })}
                                            className="data-[state=checked]:bg-indigo-500"
                                        />
                                        <span className="text-[10px] text-gray-400 font-medium uppercase">{settings.is_active ? 'Enabled' : 'Disabled'}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4">Sidebar</Label>
                                    <div className="md:col-span-8 flex items-center gap-2">
                                        <Switch
                                            checked={settings.sidebar_active}
                                            onCheckedChange={(v) => setSettings({ ...settings, sidebar_active: v })}
                                            className="data-[state=checked]:bg-indigo-500"
                                        />
                                        <span className="text-[10px] text-gray-400 font-medium uppercase">{settings.sidebar_active ? 'Visible' : 'Hidden'}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4">RTL Mode</Label>
                                    <div className="md:col-span-8 flex items-center gap-2">
                                        <Switch
                                            checked={settings.rtl_mode}
                                            onCheckedChange={(v) => setSettings({ ...settings, rtl_mode: v })}
                                            className="data-[state=checked]:bg-indigo-500"
                                        />
                                        <span className="text-[10px] text-gray-400 font-medium uppercase">{settings.rtl_mode ? 'On' : 'Off'}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4">Language</Label>
                                    <div className="md:col-span-8">
                                        <Select value={settings.language} onValueChange={(v) => setSettings({ ...settings, language: v })}>
                                            <SelectTrigger className="h-9 text-[11px] border-gray-200 shadow-none rounded-lg bg-gray-50/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="english">English</SelectItem>
                                                <SelectItem value="spanish">Spanish</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4 pt-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4 pt-3">Brand Logo</Label>
                                    <div className="md:col-span-8 flex flex-col gap-3">
                                        <div
                                            onClick={() => logoInputRef.current?.click()}
                                            className="h-24 w-full max-w-[200px] border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all bg-gray-50/50 overflow-hidden relative group"
                                        >
                                            {settings.logo_preview ? (
                                                <>
                                                    <img src={settings.logo_preview} className="h-full w-full object-contain p-4 transition-transform group-hover:scale-105" alt="Logo" />
                                                    <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Pencil className="h-5 w-5 text-indigo-600" />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-gray-400">
                                                    <Plus className="h-6 w-6" />
                                                    <span className="text-[8px] font-bold uppercase">Upload Logo</span>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" ref={logoInputRef} hidden onChange={(e) => handleFileChange(e, "logo")} accept="image/*" />
                                        <p className="text-[9px] text-gray-400 font-medium tracking-tight">Recommended size: 368x75 pixels (PNG/JPG)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4 pt-2">Footer Text</Label>
                                    <div className="md:col-span-8">
                                        <Input value={settings.footer_text} onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })} className="h-9 text-[11px] border-gray-200 shadow-none rounded-lg bg-gray-50/50" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4 pt-2">Google Analytics</Label>
                                    <div className="md:col-span-8">
                                        <Textarea value={settings.google_analytics} onChange={(e) => setSettings({ ...settings, google_analytics: e.target.value })} className="min-h-[100px] text-[10px] font-mono border-gray-200 shadow-none rounded-lg bg-gray-50/50" placeholder="Paste script here..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4 pt-2">Cookie Consent</Label>
                                    <div className="md:col-span-8">
                                        <Textarea value={settings.cookie_consent} onChange={(e) => setSettings({ ...settings, cookie_consent: e.target.value })} className="min-h-[70px] text-[11px] border-gray-200 shadow-none rounded-lg bg-gray-50/50" placeholder="Cookie usage policy text..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Theme Selection */}
                        <div className="pt-8 border-t border-gray-100">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-6 block">Interface Theme Style</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                                {themes.map((theme) => (
                                    <div
                                        key={theme.id}
                                        onClick={() => setSettings({ ...settings, current_theme: theme.id })}
                                        className={cn(
                                            "cursor-pointer group flex flex-col border-2 rounded-2xl overflow-hidden transition-all duration-300",
                                            settings.current_theme === theme.id ? "border-indigo-500 shadow-lg scale-105" : "border-gray-50 hover:border-indigo-200 hover:shadow-md"
                                        )}
                                    >
                                        <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                            <div className="h-3 w-full bg-white border-b border-gray-100 flex items-center px-1.5 gap-0.5">
                                                <div className="h-1 w-1 rounded-full bg-gray-200" />
                                                <div className="h-1 w-1 rounded-full bg-gray-200" />
                                            </div>
                                            <div className={cn("h-6 w-full", theme.bg)}></div>
                                            <div className="p-4 space-y-2">
                                                <div className="h-3 w-3/4 bg-gray-200 rounded-full"></div>
                                                <div className="h-6 w-full bg-gray-200 rounded-lg opacity-50"></div>
                                            </div>
                                            {settings.current_theme === theme.id && (
                                                <div className="absolute top-10 right-4 h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center">
                                                    <div className="h-3 w-3 rounded-full bg-indigo-500" />
                                                </div>
                                            )}
                                        </div>
                                        <div className={cn(
                                            "py-2 text-center text-[9px] font-bold uppercase tracking-tight",
                                            settings.current_theme === theme.id ? "bg-gradient-to-r from-orange-400 to-indigo-500 text-white" : "bg-gray-50 text-gray-400"
                                        )}>{theme.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* SOCIAL LINKS TAB */}
                <TabsContent value="social" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            {Object.keys(settings.social_media).map((platform) => (
                                <div key={platform} className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 group">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4 capitalize">{platform.replace('_', ' ')}</Label>
                                    <div className="md:col-span-8 relative">
                                        <div className="absolute left-3 top-2.5 h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform">
                                            <Globe size={16} />
                                        </div>
                                        <Input
                                            value={settings.social_media[platform]}
                                            onChange={(e) => updateSocialField(platform, e.target.value)}
                                            className="h-9 pl-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded-lg bg-gray-50/50 hover:bg-white transition-colors"
                                            placeholder={`Enter ${platform} URL`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* SECTIONS TAB */}
                <TabsContent value="sections" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* About Us */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full" />
                        <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Info size={18} className="stroke-[2.5px]" />
                            </div>
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Welcome / About Us Section</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            <div className="md:col-span-8 space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Headline Title</Label>
                                    <Input value={settings.about_us.title} onChange={(e) => updateNestedField("about_us", "title", e.target.value)} className="h-10 text-[12px] font-medium rounded-lg bg-gray-50/30" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Introduction Content</Label>
                                    <Textarea value={settings.about_us.description} onChange={(e) => updateNestedField("about_us", "description", e.target.value)} className="min-h-[140px] text-[11px] leading-relaxed rounded-lg bg-gray-50/30" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Courses */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-orange-400 h-full" />
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                    <GraduationCap size={18} className="stroke-[2.5px]" />
                                </div>
                                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Our Main Courses Showcase</h2>
                            </div>
                            <Button 
                                onClick={() => addListItem("main_courses", { title: "", description: "", price: "" })} 
                                className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-90 text-white px-5 h-8 font-bold rounded-full shadow-md flex items-center gap-2"
                            >
                                <Plus size={14} className="stroke-[3px]" /> Add New Course
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {settings.main_courses.map((course: any, idx: number) => (
                                <div key={course.id} className="p-6 border border-gray-100 rounded-2xl bg-gray-50/30 space-y-4 relative group hover:border-orange-200 transition-all hover:shadow-lg hover:bg-white">
                                    <Button 
                                        size="icon" 
                                        onClick={() => removeListItem("main_courses", course.id)} 
                                        className="absolute top-4 right-4 h-8 w-8 bg-red-500 text-white rounded-[10px] shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 border-0"
                                    >
                                        <X size={16} className="stroke-[3.5px]" />
                                    </Button>
                                    <div className="space-y-4 pr-10">
                                        <Input 
                                            placeholder="Course Name" 
                                            value={course.title} 
                                            onChange={(e) => {
                                                const newCourses = [...settings.main_courses];
                                                newCourses[idx].title = e.target.value;
                                                setSettings({ ...settings, main_courses: newCourses });
                                            }} 
                                            className="h-9 text-[11px] font-bold bg-white border-gray-100 rounded-lg" 
                                        />
                                        <Textarea 
                                            placeholder="What will students learn?" 
                                            value={course.description} 
                                            onChange={(e) => {
                                                const newCourses = [...settings.main_courses];
                                                newCourses[idx].description = e.target.value;
                                                setSettings({ ...settings, main_courses: newCourses });
                                            }} 
                                            className="min-h-[80px] text-[11px] bg-white border-gray-100 rounded-lg leading-relaxed" 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Experienced Staff */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-green-500 h-full" />
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                    <Users size={18} className="stroke-[2.5px]" />
                                </div>
                                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Experienced Faculty Members</h2>
                            </div>
                            <Button 
                                onClick={() => addListItem("experienced_staffs", { name: "", role: "" })} 
                                className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-90 text-white px-5 h-8 font-bold rounded-full shadow-md flex items-center gap-2"
                            >
                                <Plus size={14} className="stroke-[3px]" /> Add Faculty Member
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {settings.experienced_staffs.map((staff: any, idx: number) => (
                                <div key={staff.id} className="p-6 border border-gray-100 rounded-2xl bg-gray-50/30 flex flex-col items-center space-y-4 relative group hover:border-green-200 hover:shadow-lg hover:bg-white transition-all">
                                    <Button 
                                        size="icon" 
                                        onClick={() => removeListItem("experienced_staffs", staff.id)} 
                                        className="absolute top-3 right-3 h-7 w-7 bg-red-500 text-white rounded-[8px] shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 border-0"
                                    >
                                        <X size={14} className="stroke-[3.5px]" />
                                    </Button>
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-50 to-green-50 border border-indigo-100 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-110 transition-transform">
                                        <Users size={32} className="stroke-[1.5px]" />
                                    </div>
                                    <div className="w-full space-y-2">
                                        <Input 
                                            placeholder="Full Name" 
                                            value={staff.name} 
                                            onChange={(e) => {
                                                const newList = [...settings.experienced_staffs];
                                                newList[idx].name = e.target.value;
                                                setSettings({ ...settings, experienced_staffs: newList });
                                            }} 
                                            className="h-8 text-[11px] text-center font-bold bg-white border-gray-100" 
                                        />
                                        <Input 
                                            placeholder="Position / Role" 
                                            value={staff.role} 
                                            onChange={(e) => {
                                                const newList = [...settings.experienced_staffs];
                                                newList[idx].role = e.target.value;
                                                setSettings({ ...settings, experienced_staffs: newList });
                                            }} 
                                            className="h-8 text-[10px] text-center text-gray-500 font-medium bg-white border-gray-100 italic" 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Latest Notices */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-red-400 h-full" />
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                                    <FileText size={18} className="stroke-[2.5px]" />
                                </div>
                                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Recent Announcements / Notices</h2>
                            </div>
                            <Button 
                                onClick={() => addListItem("latest_notices", { title: "", date: "" })} 
                                className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-90 text-white px-5 h-8 font-bold rounded-full shadow-md flex items-center gap-2"
                            >
                                <Plus size={14} className="stroke-[3px]" /> Post Notice
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {settings.latest_notices.map((notice: any, idx: number) => (
                                <div key={notice.id} className="flex gap-4 items-center p-4 border border-gray-50 rounded-xl bg-gray-50/20 group hover:bg-white hover:border-red-100 hover:shadow-md transition-all">
                                    <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                                    <Input 
                                        placeholder="Enter notice headline..." 
                                        value={notice.title} 
                                        onChange={(e) => {
                                            const newList = [...settings.latest_notices];
                                            newList[idx].title = e.target.value;
                                            setSettings({ ...settings, latest_notices: newList });
                                        }} 
                                        className="h-9 text-[11px] font-medium bg-white flex-1 border-gray-100 rounded-lg" 
                                    />
                                    <Input 
                                        type="date" 
                                        value={notice.date} 
                                        onChange={(e) => {
                                            const newList = [...settings.latest_notices];
                                            newList[idx].date = e.target.value;
                                            setSettings({ ...settings, latest_notices: newList });
                                        }} 
                                        className="h-9 text-[11px] w-48 bg-white border-gray-100 rounded-lg text-gray-500 font-bold" 
                                    />
                                    <Button 
                                        size="icon" 
                                        onClick={() => removeListItem("latest_notices", notice.id)} 
                                        className="h-8 w-8 bg-red-500 text-white rounded-[10px] shadow-md border-0 transition-transform hover:scale-105"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        
                        {/* Standard Pagination Footer for Sections */}
                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium pt-6 border-t border-gray-50">
                            <div>Showing {settings.latest_notices.length} notices in library</div>
                            <div className="flex gap-2 items-center">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-gray-100">
                                    <ChevronLeft size={14} className="stroke-[3px]" />
                                </Button>
                                <Button className="h-8 w-8 p-0 bg-gradient-to-r from-orange-400 to-indigo-500 text-white border-0 font-bold text-[12px] rounded-xl shadow-md">
                                    1
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-gray-100">
                                    <ChevronRight size={14} className="stroke-[3px]" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Global Sticky Save Action */}
            <div className="w-full bg-white/80 backdrop-blur-md border-t border-gray-100 p-5 flex justify-center sticky bottom-0 z-20 rounded-b-2xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)] mt-8">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-95 text-white px-16 h-11 text-xs font-bold uppercase tracking-widest transition-all rounded-full shadow-[0_8px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_10px_25px_rgba(99,102,241,0.25)] hover:-translate-y-1"
                >
                    {saving ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving Configuration...</>
                    ) : (
                        <>Apply Global Configuration</>
                    )}
                </Button>
            </div>
        </div>
    );
}
