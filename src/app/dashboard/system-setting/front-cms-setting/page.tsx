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
import { BookOpen, Loader2, Plus, Trash2, Globe, Share2, LayoutPanelLeft, FileText, Users, GraduationCap, Info } from "lucide-react";
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
        // Previews and working files
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

            // Append general and JSON fields
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
                // Clear file states but keep previews from server
                setSettings((prev: any) => ({
                    ...prev,
                    logo_file: null,
                    favicon_file: null,
                    logo_preview: res.data.data.logo_url || prev.logo_preview,
                    favicon_preview: res.data.data.favicon_url || prev.favicon_preview
                }));
            }
        } catch (error) {
            toast("error", "Failed to save settings");
            console.error(error);
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
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Front CMS Setting</h1>

            <Tabs defaultValue="system" className="w-full">
                <TabsList className="bg-white border text-gray-500 h-10 p-1 gap-1">
                    <TabsTrigger value="system" className="text-[11px] gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"><Globe size={14} /> System</TabsTrigger>
                    <TabsTrigger value="social" className="text-[11px] gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"><Share2 size={14} /> Social Links</TabsTrigger>
                    <TabsTrigger value="sections" className="text-[11px] gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"><LayoutPanelLeft size={14} /> Sections</TabsTrigger>
                </TabsList>

                {/* SYSTEM TAB */}
                <TabsContent value="system" className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-600 md:col-span-4">Front CMS</Label>
                                    <div className="md:col-span-8">
                                        <Switch
                                            checked={settings.is_active}
                                            onCheckedChange={(v) => setSettings({ ...settings, is_active: v })}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-600 md:col-span-4">Sidebar</Label>
                                    <div className="md:col-span-8">
                                        <Switch
                                            checked={settings.sidebar_active}
                                            onCheckedChange={(v) => setSettings({ ...settings, sidebar_active: v })}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-600 md:col-span-4 text-nowrap">RTL Mode</Label>
                                    <div className="md:col-span-8">
                                        <Switch
                                            checked={settings.rtl_mode}
                                            onCheckedChange={(v) => setSettings({ ...settings, rtl_mode: v })}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-600 md:col-span-4">Language</Label>
                                    <div className="md:col-span-8">
                                        <Select value={settings.language} onValueChange={(v) => setSettings({ ...settings, language: v })}>
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
                                <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                                    <Label className="text-[11px] font-bold text-gray-600 md:col-span-4 pt-2">Logo</Label>
                                    <div className="md:col-span-8 flex gap-4 items-center">
                                        <div
                                            onClick={() => logoInputRef.current?.click()}
                                            className="h-20 w-44 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors bg-gray-50 overflow-hidden"
                                        >
                                            {settings.logo_preview ? (
                                                <img src={settings.logo_preview} className="h-full w-full object-contain p-2" alt="Logo" />
                                            ) : (
                                                <Plus className="text-gray-400" />
                                            )}
                                        </div>
                                        <input type="file" ref={logoInputRef} hidden onChange={(e) => handleFileChange(e, "logo")} accept="image/*" />
                                        <div className="text-[10px] text-gray-400">368x75px</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                                    <Label className="text-[11px] font-bold text-gray-600 md:col-span-4 pt-2">Favicon</Label>
                                    <div className="md:col-span-8 flex gap-4 items-center">
                                        <div
                                            onClick={() => faviconInputRef.current?.click()}
                                            className="h-12 w-12 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors bg-gray-50 overflow-hidden"
                                        >
                                            {settings.favicon_preview ? (
                                                <img src={settings.favicon_preview} className="h-full w-full object-contain p-1" alt="Favicon" />
                                            ) : (
                                                <Plus className="text-gray-400" size={16} />
                                            )}
                                        </div>
                                        <input type="file" ref={faviconInputRef} hidden onChange={(e) => handleFileChange(e, "favicon")} accept="image/*" />
                                        <div className="text-[10px] text-gray-400">32x32px</div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-600 md:col-span-4">Footer Text</Label>
                                    <div className="md:col-span-8">
                                        <Input value={settings.footer_text} onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })} className="h-8 text-[11px] border-gray-200 shadow-none rounded" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                                    <Label className="text-[11px] font-bold text-gray-600 md:col-span-4 pt-2">Analytics Code</Label>
                                    <div className="md:col-span-8">
                                        <Textarea value={settings.google_analytics} onChange={(e) => setSettings({ ...settings, google_analytics: e.target.value })} className="min-h-[100px] text-[10px] font-mono border-gray-200 shadow-none rounded bg-gray-50/50" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                                    <Label className="text-[11px] font-bold text-gray-600 md:col-span-4 pt-2">Cookie Consent</Label>
                                    <div className="md:col-span-8">
                                        <Textarea value={settings.cookie_consent} onChange={(e) => setSettings({ ...settings, cookie_consent: e.target.value })} className="min-h-[60px] text-[11px] border-gray-200 shadow-none rounded" placeholder="Your cookie agreement text..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Theme Selection */}
                        <div className="pt-6 border-t border-gray-100">
                            <Label className="text-[11px] font-bold text-gray-600 mb-4 block">Current Theme</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {themes.map((theme) => (
                                    <div
                                        key={theme.id}
                                        onClick={() => setSettings({ ...settings, current_theme: theme.id })}
                                        className={cn(
                                            "cursor-pointer group flex flex-col border rounded overflow-hidden transition-all",
                                            settings.current_theme === theme.id ? "ring-2 ring-indigo-500 ring-offset-2 border-transparent" : "border-gray-200 hover:border-indigo-300"
                                        )}
                                    >
                                        <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                            <div className="h-2 w-full bg-white border-b border-gray-200"></div>
                                            <div className={cn("h-4 w-full", theme.bg)}></div>
                                            <div className="p-3 space-y-2">
                                                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                                <div className="h-8 w-full bg-gray-200 rounded"></div>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "py-1 text-center text-[9px] font-bold uppercase",
                                            settings.current_theme === theme.id ? "bg-indigo-600 text-white" : "bg-gray-500 text-white"
                                        )}>{theme.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* SOCIAL LINKS TAB */}
                <TabsContent value="social" className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            {Object.keys(settings.social_media).map((platform) => (
                                <div key={platform} className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-600 md:col-span-3 capitalize">{platform.replace('_', ' ')}</Label>
                                    <div className="md:col-span-9">
                                        <Input
                                            value={settings.social_media[platform]}
                                            onChange={(e) => updateSocialField(platform, e.target.value)}
                                            className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* SECTIONS TAB */}
                <TabsContent value="sections" className="space-y-6 animate-in fade-in duration-300">

                    {/* About Us */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-4">
                            <Info size={16} className="text-indigo-500" />
                            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">About Us Section</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-8 space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400">Title</Label>
                                    <Input value={settings.about_us.title} onChange={(e) => updateNestedField("about_us", "title", e.target.value)} className="h-9 text-[11px]" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400">Description</Label>
                                    <Textarea value={settings.about_us.description} onChange={(e) => updateNestedField("about_us", "description", e.target.value)} className="min-h-[100px] text-[11px]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Courses */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <GraduationCap size={16} className="text-indigo-500" />
                                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Our Main Courses</h2>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => addListItem("main_courses", { title: "", description: "", price: "" })} className="h-7 text-[10px] border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                <Plus size={12} className="mr-1" /> Add Course
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {settings.main_courses.map((course: any, idx: number) => (
                                <div key={course.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/30 space-y-3 relative group">
                                    <Button variant="ghost" size="icon" onClick={() => removeListItem("main_courses", course.id)} className="absolute top-2 right-2 h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={12} />
                                    </Button>
                                    <Input placeholder="Course Title" value={course.title} onChange={(e) => {
                                        const newCourses = [...settings.main_courses];
                                        newCourses[idx].title = e.target.value;
                                        setSettings({ ...settings, main_courses: newCourses });
                                    }} className="h-8 text-[11px] bg-white" />
                                    <Textarea placeholder="Short description..." value={course.description} onChange={(e) => {
                                        const newCourses = [...settings.main_courses];
                                        newCourses[idx].description = e.target.value;
                                        setSettings({ ...settings, main_courses: newCourses });
                                    }} className="min-h-[60px] text-[11px] bg-white" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Staff */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-indigo-500" />
                                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Our Experienced Staffs</h2>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => addListItem("experienced_staffs", { name: "", role: "" })} className="h-7 text-[10px] border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                <Plus size={12} className="mr-1" /> Add Staff
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {settings.experienced_staffs.map((staff: any, idx: number) => (
                                <div key={staff.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/30 flex flex-col items-center space-y-3 relative group">
                                    <Button variant="ghost" size="icon" onClick={() => removeListItem("experienced_staffs", staff.id)} className="absolute top-1 right-1 h-5 w-5 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={10} />
                                    </Button>
                                    <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500"><Users size={24} /></div>
                                    <Input placeholder="Staff Name" value={staff.name} onChange={(e) => {
                                        const newList = [...settings.experienced_staffs];
                                        newList[idx].name = e.target.value;
                                        setSettings({ ...settings, experienced_staffs: newList });
                                    }} className="h-7 text-[10px] text-center bg-white" />
                                    <Input placeholder="Designation" value={staff.role} onChange={(e) => {
                                        const newList = [...settings.experienced_staffs];
                                        newList[idx].role = e.target.value;
                                        setSettings({ ...settings, experienced_staffs: newList });
                                    }} className="h-7 text-[10px] text-center bg-white" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notices */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-indigo-500" />
                                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Latest Notices</h2>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => addListItem("latest_notices", { title: "", date: "" })} className="h-7 text-[10px] border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                <Plus size={12} className="mr-1" /> Add Notice
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {settings.latest_notices.map((notice: any, idx: number) => (
                                <div key={notice.id} className="flex gap-4 items-center p-3 border border-gray-50 rounded-lg bg-gray-50/20 group">
                                    <Input placeholder="Notice Headline" value={notice.title} onChange={(e) => {
                                        const newList = [...settings.latest_notices];
                                        newList[idx].title = e.target.value;
                                        setSettings({ ...settings, latest_notices: newList });
                                    }} className="h-8 text-[11px] bg-white flex-1" />
                                    <Input type="date" value={notice.date} onChange={(e) => {
                                        const newList = [...settings.latest_notices];
                                        newList[idx].date = e.target.value;
                                        setSettings({ ...settings, latest_notices: newList });
                                    }} className="h-8 text-[11px] w-40 bg-white" />
                                    <Button variant="ghost" size="icon" onClick={() => removeListItem("latest_notices", notice.id)} className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 size={12} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                </TabsContent>
            </Tabs>

            {/* Global Save Action */}
            <div className="w-full bg-white border-t border-gray-100 p-4 flex justify-end sticky bottom-0 z-10 rounded-b-lg shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-90 text-white px-10 h-10 text-xs font-bold uppercase transition-all rounded-full shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5"
                >
                    {saving ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                        <>Save Configuration</>
                    )}
                </Button>
            </div>
        </div>
    );
}

