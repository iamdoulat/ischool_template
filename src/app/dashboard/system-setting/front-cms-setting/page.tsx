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
    Users, 
    GraduationCap, 
    Info,
    ChevronLeft,
    ChevronRight,
    X,
    Save,
    Pencil,
    Eye,
    Image as ImageIcon,
    Search,
    Check,
    Upload,
    BarChart3,
    Trophy,
    LayoutTemplate,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";

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
    const { t } = useTranslation();
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [coursePickerOpen, setCoursePickerOpen] = useState(false);
    const [onlineCourses, setOnlineCourses] = useState<any[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [courseSearch, setCourseSearch] = useState("");

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
        about_us: {
            section_title: "About Us",
            section_subtitle: "Fusce sem dolor, interdum in fficitur at, faucibus nec lorem. Sed nec molestie justo.",
            title: "Welcome to Smart School",
            description: "Providing quality education for over two decades...",
            image_url: "",
            accordions: [
                { id: 1, title: "Collapsible Group Item #1", content: "Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch." },
                { id: 2, title: "Collapsible Group Item #2", content: "Brunch 3 wolf moon tempor, sunt aliqua put a bird on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore." },
                { id: 3, title: "Collapsible Group Item #3", content: "Leggings occaecat craft beer farm-to-table, raw denim aesthetic synth nesciunt you probably haven't heard of them accusamus labore sustainable VHS." },
            ]
        },
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
            hero_background: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?q=80&w=2070&auto=format&fit=crop",
            hero_title_part1: "Empowering",
            hero_title_highlight: "Minds",
            hero_title_part2: "Shaping",
            hero_title_gradient: "Futures",
            hero_subtitle: "Provide your children with the best education possible. We focus on holistic development, academic excellence, and character building.",
            hero_btn1_text: "Apply for Admission",
            hero_btn1_link: "/online_admission",
            hero_btn2_text: "Take a Tour",
            hero_btn2_link: "#",
            courses_section_title: "Our Main Courses",
            courses_section_subtitle: "Fusce sem dolor, interdum in fficitur at, faucibus nec lorem. Sed nec molestie justo.",
            staff_section_title: "Our Experienced Staffs",
            staff_section_subtitle: "Considering desire as primary motivation for the generation of narratives is a useful concept.",
            header_enabled: true,
            hero_enabled: true,
            about_enabled: true,
            courses_enabled: true,
            staff_enabled: true,
            notices_enabled: true,
            stats_enabled: true,
            stats_students: 2500,
            stats_teachers: 150,
            stats_awards: 50,
            stats_courses: 30,
            footer_enabled: true,
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
                    footer_text: fetched.footer_text || prev.footer_text,
                    google_analytics: fetched.google_analytics || "",
                    cookie_consent: fetched.cookie_consent || "",
                    header_footer_sections: { ...prev.header_footer_sections, ...(fetched.header_footer_sections || {}) },
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
                toast("success", t("saved_successfully"));
                fetchSettings();
            }
        } catch (error) {
            toast("error", t("failed_to_save"));
        } finally {
            setSaving(false);
        }
    };

    const addListItem = (section: string, item: any) => {
        setSettings({ ...settings, [section]: [...settings[section], { ...item, id: Date.now() }] });
    };

    const openCoursePicker = async () => {
        setCoursePickerOpen(true);
        setLoadingCourses(true);
        setCourseSearch("");
        try {
            const res = await api.get("online-course/courses?per_page=100");
            const result = res.data?.data?.data || res.data?.data || [];
            setOnlineCourses(Array.isArray(result) ? result : []);
        } catch {
            setOnlineCourses([]);
        } finally {
            setLoadingCourses(false);
        }
    };

    const addOnlineCourse = (course: any) => {
        const exists = settings.main_courses.some((c: any) => c.online_course_id === course.id);
        if (exists) return;
        setSettings({
            ...settings,
            main_courses: [
                ...settings.main_courses,
                {
                    id: Date.now(),
                    online_course_id: course.id,
                    title: course.title,
                    description: course.description || "",
                    price: course.price?.toString() || "",
                    category: course.category || "General",
                    image: course.image || "",
                    link: course.link || "/online_admission",
                }
            ]
        });
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
            <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm mb-2">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <LayoutTemplate className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("front_cms_setting")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("manage_public_website_content")}</p>
                        </div>
                    </div>
                </div>
                {/* Skeleton body */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        {Array.from({ length: 2 }).map((_, col) => (
                            <div key={col} className="space-y-6">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                        <div className="md:col-span-4 h-3 bg-gray-200/70 rounded" />
                                        <div className="md:col-span-8 h-9 bg-gray-200/60 rounded" />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm mb-2">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <LayoutTemplate className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("front_cms_setting")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("manage_public_website_content")}</p>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-6 h-9 font-bold rounded-full shadow-md flex items-center gap-2"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {t("save_all_changes")}
                </Button>
            </div>

            <Tabs defaultValue="system" className="w-full">
                <TabsList className="bg-white border text-gray-500 h-11 p-1 gap-1 rounded-lg shadow-sm border-gray-100">
                    <TabsTrigger value="system" className="text-[11px] font-bold uppercase gap-2 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
                        <Globe size={14} className="stroke-[2.5px]" /> {t("system")}
                    </TabsTrigger>
                    <TabsTrigger value="social" className="text-[11px] font-bold uppercase gap-2 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
                        <Share2 size={14} className="stroke-[2.5px]" /> {t("social_links")}
                    </TabsTrigger>
                    <TabsTrigger value="hero" className="text-[11px] font-bold uppercase gap-2 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
                        <ImageIcon size={14} className="stroke-[2.5px]" /> {t("hero")}
                    </TabsTrigger>
                    <TabsTrigger value="sections" className="text-[11px] font-bold uppercase gap-2 px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-300">
                        <LayoutPanelLeft size={14} className="stroke-[2.5px]" /> {t("sections")}
                    </TabsTrigger>
                </TabsList>

                {/* SYSTEM TAB */}
                <TabsContent value="system" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4">{t("front_cms")}</Label>
                                    <div className="md:col-span-8 flex items-center gap-2">
                                        <Switch
                                            checked={settings.is_active}
                                            onCheckedChange={(v) => setSettings({ ...settings, is_active: v })}
                                            className="data-[state=checked]:bg-indigo-500"
                                        />
                                        <span className="text-[10px] text-gray-400 font-medium uppercase">{settings.is_active ? t("enabled") : t("disabled")}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4">{t("sidebar")}</Label>
                                    <div className="md:col-span-8 flex items-center gap-2">
                                        <Switch
                                            checked={settings.sidebar_active}
                                            onCheckedChange={(v) => setSettings({ ...settings, sidebar_active: v })}
                                            className="data-[state=checked]:bg-indigo-500"
                                        />
                                        <span className="text-[10px] text-gray-400 font-medium uppercase">{settings.sidebar_active ? t("visible") : t("hidden")}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4">{t("rtl_mode")}</Label>
                                    <div className="md:col-span-8 flex items-center gap-2">
                                        <Switch
                                            checked={settings.rtl_mode}
                                            onCheckedChange={(v) => setSettings({ ...settings, rtl_mode: v })}
                                            className="data-[state=checked]:bg-indigo-500"
                                        />
                                        <span className="text-[10px] text-gray-400 font-medium uppercase">{settings.rtl_mode ? t("on") : t("off")}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4">{t("language")}</Label>
                                    <div className="md:col-span-8">
                                        <Select value={settings.language} onValueChange={(v) => setSettings({ ...settings, language: v })}>
                                            <SelectTrigger className="h-9 text-[11px] border-gray-200 shadow-none rounded-lg bg-gray-50/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="english">{t("english")}</SelectItem>
                                                <SelectItem value="spanish">{t("spanish")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4 pt-2">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4 pt-3">{t("brand_logo")}</Label>
                                    <div className="md:col-span-8 flex flex-col gap-3">
                                        <div
                                            onClick={() => logoInputRef.current?.click()}
                                            className="h-24 w-full max-w-[200px] border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all bg-gray-50/50 overflow-hidden relative group"
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
                                                    <span className="text-[8px] font-bold uppercase">{t("upload_logo")}</span>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" ref={logoInputRef} hidden onChange={(e) => handleFileChange(e, "logo")} accept="image/*" />
                                        <p className="text-[9px] text-gray-400 font-medium tracking-tight">{t("recommended_size_368x75_pixels_png_jpg")}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4 pt-2">{t("footer_text")}</Label>
                                    <div className="md:col-span-8">
                                        <Input value={settings.footer_text} onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })} className="h-9 text-[11px] border-gray-200 shadow-none rounded-lg bg-gray-50/50" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4 pt-2">{t("google_analytics")}</Label>
                                    <div className="md:col-span-8">
                                        <Textarea value={settings.google_analytics} onChange={(e) => setSettings({ ...settings, google_analytics: e.target.value })} className="min-h-[100px] text-[10px] font-mono border-gray-200 shadow-none rounded-lg bg-gray-50/50" placeholder="Paste script here..." />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4 pt-2">{t("cookie_consent")}</Label>
                                    <div className="md:col-span-8">
                                        <Textarea value={settings.cookie_consent} onChange={(e) => setSettings({ ...settings, cookie_consent: e.target.value })} className="min-h-[70px] text-[11px] border-gray-200 shadow-none rounded-lg bg-gray-50/50" placeholder="Cookie usage policy text..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section Visibility Toggles */}
                        <div className="pt-8 border-t border-gray-100">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-6 block">{t("section_visibility")}</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                                    <Label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">{t("header")}</Label>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={settings.header_footer_sections?.header_enabled !== false}
                                            onCheckedChange={(v) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, header_enabled: v } })}
                                            className="data-[state=checked]:bg-indigo-500"
                                        />
                                        <span className="text-[9px] text-gray-400 font-medium w-12">{settings.header_footer_sections?.header_enabled !== false ? t("on") : t("off")}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                                    <Label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">{t("notices_board")}</Label>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={settings.header_footer_sections?.notices_enabled !== false}
                                            onCheckedChange={(v) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, notices_enabled: v } })}
                                            className="data-[state=checked]:bg-indigo-500"
                                        />
                                        <span className="text-[9px] text-gray-400 font-medium w-12">{settings.header_footer_sections?.notices_enabled !== false ? t("on") : t("off")}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                                    <Label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">{t("stats_counter")}</Label>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={settings.header_footer_sections?.stats_enabled !== false}
                                            onCheckedChange={(v) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, stats_enabled: v } })}
                                            className="data-[state=checked]:bg-indigo-500"
                                        />
                                        <span className="text-[9px] text-gray-400 font-medium w-12">{settings.header_footer_sections?.stats_enabled !== false ? t("on") : t("off")}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                                    <Label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">{t("footer")}</Label>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={settings.header_footer_sections?.footer_enabled !== false}
                                            onCheckedChange={(v) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, footer_enabled: v } })}
                                            className="data-[state=checked]:bg-indigo-500"
                                        />
                                        <span className="text-[9px] text-gray-400 font-medium w-12">{settings.header_footer_sections?.footer_enabled !== false ? t("on") : t("off")}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Theme Selection */}
                        <div className="pt-8 border-t border-gray-100">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-6 block">{t("interface_theme_style")}</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                                {themes.map((theme) => (
                                    <div
                                        key={theme.id}
                                        onClick={() => setSettings({ ...settings, current_theme: theme.id })}
                                        className={cn(
                                            "cursor-pointer group flex flex-col border-2 rounded-lg overflow-hidden transition-all duration-300",
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
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10 space-y-6">
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

                {/* HERO TAB */}
                <TabsContent value="hero" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-8">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <ImageIcon size={18} className="stroke-[2.5px]" />
                                </div>
                                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t("hero_section_configuration")}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{settings.header_footer_sections?.hero_enabled !== false ? t("enabled") : t("disabled")}</span>
                                <Switch
                                    checked={settings.header_footer_sections?.hero_enabled !== false}
                                    onCheckedChange={(v) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_enabled: v } })}
                                    className="data-[state=checked]:bg-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("background_image_url")}</Label>
                                    <div className="flex gap-3">
                                        <Input value={settings.header_footer_sections?.hero_background || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_background: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30 flex-1" placeholder="https://..." />
                                        {settings.header_footer_sections?.hero_background && (
                                            <div className="h-9 w-16 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                                <img src={settings.header_footer_sections.hero_background} className="h-full w-full object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("badge_text")}</Label>
                                    <Input value={settings.header_footer_sections?.header_text || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, header_text: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="Admissions Open for 2026-27" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("title_part_1_before_highlight")}</Label>
                                    <Input value={settings.header_footer_sections?.hero_title_part1 || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_title_part1: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="Empowering" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("title_highlighted_word")}</Label>
                                    <Input value={settings.header_footer_sections?.hero_title_highlight || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_title_highlight: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="Minds" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("title_part_2_after_highlight")}</Label>
                                    <Input value={settings.header_footer_sections?.hero_title_part2 || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_title_part2: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="Shaping" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("title_gradient_word")}</Label>
                                    <Input value={settings.header_footer_sections?.hero_title_gradient || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_title_gradient: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="Futures" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("subtitle_description")}</Label>
                                    <Textarea value={settings.header_footer_sections?.hero_subtitle || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_subtitle: e.target.value } })} className="min-h-[80px] text-[11px] rounded-lg bg-gray-50/30" placeholder="Hero description text..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("button_1_text")}</Label>
                                        <Input value={settings.header_footer_sections?.hero_btn1_text || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_btn1_text: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="Apply for Admission" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("button_1_link")}</Label>
                                        <Input value={settings.header_footer_sections?.hero_btn1_link || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_btn1_link: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="/online_admission" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("button_2_text")}</Label>
                                        <Input value={settings.header_footer_sections?.hero_btn2_text || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_btn2_text: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="Take a Tour" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("button_2_link")}</Label>
                                        <Input value={settings.header_footer_sections?.hero_btn2_link || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_btn2_link: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="#" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* SECTIONS TAB */}
                <TabsContent value="sections" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* About Us */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full" />
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Info size={18} className="stroke-[2.5px]" />
                                </div>
                                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t("welcome_about_us_section")}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{settings.header_footer_sections?.about_enabled !== false ? t("enabled") : t("disabled")}</span>
                                <Switch
                                    checked={settings.header_footer_sections?.about_enabled !== false}
                                    onCheckedChange={(v) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, about_enabled: v } })}
                                    className="data-[state=checked]:bg-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            <div className="md:col-span-8 space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_heading_h1")}</Label>
                                    <Input value={settings.about_us.section_title || ""} onChange={(e) => updateNestedField("about_us", "section_title", e.target.value)} className="h-10 text-[12px] font-medium rounded-lg bg-gray-50/30" placeholder="About Us" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_subtitle")}</Label>
                                    <Input value={settings.about_us.section_subtitle || ""} onChange={(e) => updateNestedField("about_us", "section_subtitle", e.target.value)} className="h-10 text-[12px] font-medium rounded-lg bg-gray-50/30" placeholder="Section subtitle..." />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("right_side_headline_title")}</Label>
                                    <Input value={settings.about_us.title} onChange={(e) => updateNestedField("about_us", "title", e.target.value)} className="h-10 text-[12px] font-medium rounded-lg bg-gray-50/30" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("right_side_content")}</Label>
                                    <Textarea value={settings.about_us.description} onChange={(e) => updateNestedField("about_us", "description", e.target.value)} className="min-h-[140px] text-[11px] leading-relaxed rounded-lg bg-gray-50/30" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("left_image_url")}</Label>
                                    <div className="flex gap-3">
                                        <Input value={settings.about_us.image_url || ""} onChange={(e) => updateNestedField("about_us", "image_url", e.target.value)} className="h-10 text-[11px] rounded-lg bg-gray-50/30 flex-1" placeholder="https://..." />
                                        {settings.about_us.image_url && (
                                            <div className="h-10 w-20 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                                <img src={settings.about_us.image_url} className="h-full w-full object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Accordion Items */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("accordion_items")}</Label>
                                        <Button onClick={() => {
                                            const accordions = [...(settings.about_us.accordions || [])];
                                            accordions.push({ id: Date.now(), title: "", content: "" });
                                            updateNestedField("about_us", "accordions", accordions);
                                        }} className="bg-gradient-to-r from-orange-400 to-indigo-500 text-white h-7 text-[9px] font-bold rounded-full px-3 flex items-center gap-1">
                                            <Plus size={12} /> {t("add_item")}
                                        </Button>
                                    </div>
                                    {(settings.about_us.accordions || []).map((acc: any, idx: number) => (
                                        <div key={acc.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/20 space-y-3 relative group">
                                            <Button size="icon" onClick={() => {
                                                const accordions = [...(settings.about_us.accordions || [])].filter((a: any) => a.id !== acc.id);
                                                updateNestedField("about_us", "accordions", accordions);
                                            }} className="absolute top-3 right-3 h-7 w-7 bg-red-500 text-white rounded-[8px] shadow-md opacity-0 group-hover:opacity-100 transition-all border-0">
                                                <Trash2 size={14} />
                                            </Button>
                                            <div className="space-y-2 pr-8">
                                                <Input value={acc.title} onChange={(e) => {
                                                    const accordions = [...(settings.about_us.accordions || [])];
                                                    accordions[idx].title = e.target.value;
                                                    updateNestedField("about_us", "accordions", accordions);
                                                }} className="h-8 text-[11px] font-bold bg-white border-gray-100 rounded-lg" placeholder="Accordion title..." />
                                                <Textarea value={acc.content} onChange={(e) => {
                                                    const accordions = [...(settings.about_us.accordions || [])];
                                                    accordions[idx].content = e.target.value;
                                                    updateNestedField("about_us", "accordions", accordions);
                                                }} className="min-h-[60px] text-[11px] bg-white border-gray-100 rounded-lg leading-relaxed" placeholder="Accordion content..." />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Courses */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-orange-400 h-full" />
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                    <GraduationCap size={18} className="stroke-[2.5px]" />
                                </div>
                                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t("our_main_courses_showcase")}</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{settings.header_footer_sections?.courses_enabled !== false ? t("enabled") : t("disabled")}</span>
                                    <Switch
                                        checked={settings.header_footer_sections?.courses_enabled !== false}
                                        onCheckedChange={(v) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, courses_enabled: v } })}
                                        className="data-[state=checked]:bg-orange-500"
                                    />
                                </div>
                                <Button 
                                    onClick={openCoursePicker}
                                    className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-90 text-white px-5 h-8 font-bold rounded-full shadow-md flex items-center gap-2"
                                >
                                    <Plus size={14} className="stroke-[3px]" /> {t("browse_courses")}
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Section Heading (H1)</Label>
                                <Input value={settings.header_footer_sections?.courses_section_title || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, courses_section_title: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="Our Main Courses" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_subtitle")}</Label>
                                <Input value={settings.header_footer_sections?.courses_section_subtitle || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, courses_section_subtitle: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="Section subtitle..." />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {settings.main_courses.map((course: any, idx: number) => (
                                <div key={course.id} className="p-6 border border-gray-100 rounded-lg bg-gray-50/30 space-y-4 relative group hover:border-orange-200 transition-all hover:shadow-lg hover:bg-white">
                                    <Button 
                                        size="icon" 
                                        onClick={() => removeListItem("main_courses", course.id)} 
                                        className="absolute top-4 right-4 h-8 w-8 bg-red-500 text-white rounded-[10px] shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 border-0"
                                    >
                                        <X size={16} className="stroke-[3.5px]" />
                                    </Button>
                                    <div className="flex gap-4 pr-10">
                                        <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                            {course.image ? <img src={course.image} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full flex items-center justify-center text-gray-300 text-[10px] font-bold uppercase">{t("no_img")}</div>}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <Input placeholder={t("course_name")} value={course.title} onChange={(e) => { const n = [...settings.main_courses]; n[idx].title = e.target.value; setSettings({ ...settings, main_courses: n }); }} className="h-9 text-[11px] font-bold bg-white border-gray-100 rounded-lg" />
                                        </div>
                                        <div className="w-28">
                                            <Input placeholder={t("category")} value={course.category || ""} onChange={(e) => { const n = [...settings.main_courses]; n[idx].category = e.target.value; setSettings({ ...settings, main_courses: n }); }} className="h-9 text-[11px] bg-white border-gray-100 rounded-lg" />
                                        </div>
                                        <div className="w-24">
                                            <Input placeholder={t("price")} value={course.price || ""} onChange={(e) => { const n = [...settings.main_courses]; n[idx].price = e.target.value; setSettings({ ...settings, main_courses: n }); }} className="h-9 text-[11px] bg-white border-gray-100 rounded-lg" />
                                        </div>
                                        <div className="w-32">
                                            <Input placeholder={t("apply_link")} value={course.link || ""} onChange={(e) => { const n = [...settings.main_courses]; n[idx].link = e.target.value; setSettings({ ...settings, main_courses: n }); }} className="h-9 text-[11px] bg-white border-gray-100 rounded-lg" />
                                        </div>
                                    </div>
                                    <Textarea placeholder={t("description")} value={course.description} onChange={(e) => { const n = [...settings.main_courses]; n[idx].description = e.target.value; setSettings({ ...settings, main_courses: n }); }} className="min-h-[60px] text-[11px] bg-white border-gray-100 rounded-lg leading-relaxed" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Dialog open={coursePickerOpen} onOpenChange={setCoursePickerOpen}>
                        <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col p-0 rounded-lg border-none shadow-2xl">
                            <DialogHeader className="p-6 pb-0">
                                <DialogTitle className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
                                    <BookOpen size={16} /> {t("browse_online_courses")}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="px-6 pt-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} className="h-10 pl-9 text-[11px] border-gray-200 rounded-lg bg-gray-50/50" placeholder={t("search_courses")} />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-2 min-h-[300px]">
                                {loadingCourses ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                    </div>
                                ) : onlineCourses.length === 0 ? (
                                    <div className="text-center py-16 text-gray-400 text-[11px] font-bold uppercase tracking-tight">{t("no_courses_found")}</div>
                                ) : (
                                    onlineCourses
                                        .filter((c: any) => !courseSearch || c.title?.toLowerCase().includes(courseSearch.toLowerCase()))
                                        .map((course: any) => {
                                            const alreadyAdded = settings.main_courses.some((mc: any) => mc.online_course_id === course.id);
                                            return (
                                                <div key={course.id} className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${alreadyAdded ? 'border-green-200 bg-green-50/50 opacity-60' : 'border-gray-100 hover:border-orange-200 hover:shadow-md bg-white'}`}>
                                                    <div className="h-14 w-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                        {course.image ? <img src={course.image} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full flex items-center justify-center text-gray-300"><BookOpen size={20} /></div>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-[12px] font-bold text-gray-800 truncate">{course.title}</h4>
                                                        <p className="text-[10px] text-gray-400 font-medium truncate">{course.category || "General"} · ${course.price || "0"}</p>
                                                    </div>
                                                    <Button size="sm" disabled={alreadyAdded} onClick={() => { addOnlineCourse(course); }} className={`h-8 text-[10px] font-bold rounded-full px-4 ${alreadyAdded ? 'bg-green-100 text-green-600 border-0' : 'bg-gradient-to-r from-orange-400 to-indigo-500 text-white'}`}>
                                                        {alreadyAdded ? <><Check size={12} className="mr-1" /> {t("added")}</> : t("select")}
                                                    </Button>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                            <DialogFooter className="p-4 border-t border-gray-100">
                                <Button variant="outline" onClick={() => setCoursePickerOpen(false)} className="h-9 text-[10px] font-bold rounded-full px-6">{t("close")}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Experienced Staff */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-green-500 h-full" />
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                    <Users size={18} className="stroke-[2.5px]" />
                                </div>
                                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t("experienced_faculty_members")}</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{settings.header_footer_sections?.staff_enabled !== false ? t("enabled") : t("disabled")}</span>
                                    <Switch
                                        checked={settings.header_footer_sections?.staff_enabled !== false}
                                        onCheckedChange={(v) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, staff_enabled: v } })}
                                        className="data-[state=checked]:bg-green-500"
                                    />
                                </div>
                                <Button 
                                    onClick={() => addListItem("experienced_staffs", { name: "", role: "", image_url: "" })} 
                                    className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-90 text-white px-5 h-8 font-bold rounded-full shadow-md flex items-center gap-2"
                                >
                                    <Plus size={14} className="stroke-[3px]" /> {t("add_faculty_member")}
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Section Heading (H1)</Label>
                                <Input value={settings.header_footer_sections?.staff_section_title || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, staff_section_title: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="Our Experienced Staffs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_subtitle")}</Label>
                                <Input value={settings.header_footer_sections?.staff_section_subtitle || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, staff_section_subtitle: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="Section subtitle..." />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {settings.experienced_staffs.map((staff: any, idx: number) => (
                                <div key={staff.id} className="p-6 border border-gray-100 rounded-lg bg-gray-50/30 flex flex-col items-center space-y-4 relative group hover:border-green-200 hover:shadow-lg hover:bg-white transition-all">
                                    <Button 
                                        size="icon" 
                                        onClick={() => removeListItem("experienced_staffs", staff.id)} 
                                        className="absolute top-3 right-3 h-7 w-7 bg-red-500 text-white rounded-[8px] shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 border-0"
                                    >
                                        <X size={14} className="stroke-[3.5px]" />
                                    </Button>
                                    <label className="cursor-pointer">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => {
                                                        const newList = [...settings.experienced_staffs];
                                                        newList[idx].image_url = ev.target?.result as string;
                                                        setSettings({ ...settings, experienced_staffs: newList });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                                e.target.value = "";
                                            }} 
                                        />
                                        <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-50 to-green-50 border border-indigo-100 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-110 transition-transform group-hover:shadow-lg">
                                            {staff.image_url ? (
                                                <img src={staff.image_url} alt={staff.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Users size={32} className="stroke-[1.5px]" />
                                            )}
                                            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
                                                <Upload size={16} className="text-white opacity-0 hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    </label>
                                    <div className="w-full space-y-2">
                                        <Input 
                                            placeholder={t("full_name")}
                                            value={staff.name} 
                                            onChange={(e) => {
                                                const newList = [...settings.experienced_staffs];
                                                newList[idx].name = e.target.value;
                                                setSettings({ ...settings, experienced_staffs: newList });
                                            }} 
                                            className="h-8 text-[11px] text-center font-bold bg-white border-gray-100" 
                                        />
                                        <Input 
                                            placeholder={t("position_role")}
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

                    {/* Stats Counter */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-amber-500 h-full" />
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                                    <BarChart3 size={18} className="stroke-[2.5px]" />
                                </div>
                                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t("stats_counter")}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{settings.header_footer_sections?.stats_enabled !== false ? t("enabled") : t("disabled")}</span>
                                <Switch
                                    checked={settings.header_footer_sections?.stats_enabled !== false}
                                    onCheckedChange={(v) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, stats_enabled: v } })}
                                    className="data-[state=checked]:bg-amber-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="p-6 border border-gray-100 rounded-lg bg-gray-50/30 space-y-3">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2"><Users size={14} /> {t("students")}</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={settings.header_footer_sections?.stats_students ?? 2500}
                                    onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, stats_students: parseInt(e.target.value) || 0 } })}
                                    className="h-10 text-[14px] font-bold text-center bg-white border-gray-100 rounded-lg"
                                />
                            </div>
                            <div className="p-6 border border-gray-100 rounded-lg bg-gray-50/30 space-y-3">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2"><GraduationCap size={14} /> {t("teachers")}</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={settings.header_footer_sections?.stats_teachers ?? 150}
                                    onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, stats_teachers: parseInt(e.target.value) || 0 } })}
                                    className="h-10 text-[14px] font-bold text-center bg-white border-gray-100 rounded-lg"
                                />
                            </div>
                            <div className="p-6 border border-gray-100 rounded-lg bg-gray-50/30 space-y-3">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2"><Trophy size={14} /> {t("awards")}</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={settings.header_footer_sections?.stats_awards ?? 50}
                                    onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, stats_awards: parseInt(e.target.value) || 0 } })}
                                    className="h-10 text-[14px] font-bold text-center bg-white border-gray-100 rounded-lg"
                                />
                            </div>
                            <div className="p-6 border border-gray-100 rounded-lg bg-gray-50/30 space-y-3">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2"><BookOpen size={14} /> {t("courses")}</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={settings.header_footer_sections?.stats_courses ?? 30}
                                    onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, stats_courses: parseInt(e.target.value) || 0 } })}
                                    className="h-10 text-[14px] font-bold text-center bg-white border-gray-100 rounded-lg"
                                />
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
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("saving_configuration")}</>
                    ) : (
                        <>{t("apply_global_configuration")}</>
                    )}
                </Button>
            </div>
        </div>
    );
}
