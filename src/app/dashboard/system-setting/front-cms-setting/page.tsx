"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
    X,
    Save,
    Eye,
    Image as ImageIcon,
    Search,
    Check,
    Upload,
    BarChart3,
    Trophy,
    LayoutTemplate,
    FileText,
    Menu,
    Sliders,
    RotateCcw,
    Palette,
    PhoneCall,
    Quote,
    Sparkles,
    GripVertical,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Linkedin,
    Phone,
    Pipette,
    Link2,
    Unlink2,
    Code2,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { PagesTab } from "./tabs/pages-tab";
import { MenusTab } from "./tabs/menus-tab";
import { BannersTab } from "./tabs/banners-tab";
import { HeaderFooterTab } from "./tabs/header-footer-tab";
import { TEMPLATE_PRESETS } from "@/lib/cms-template-presets";
import { getImageUrl } from "@/lib/image-url";

const COURSE_IMAGE_PRESETS = [
    { label: "নুরানি", url: "/madrasha/1111-300x300.png" },
    { label: "কিতাব", url: "/madrasha/events-5-300x300.jpg" },
    { label: "রমজান", url: "/madrasha/al-quran1-300x300.jpg" },
    { label: "আইটি", url: "/madrasha/it_Computer-300x300.jpg" },
    { label: "কারিগরি", url: "/madrasha/sewing-machine-1369658_1920-300x300.jpg" },
    { label: "আরবি", url: "/madrasha/Example_of_Arabic_text_Wellcome_L0040185-300x300.jpg" },
    { label: "দাওরা", url: "/madrasha/Dawra-Class.jpg" },
];

const SCHOOL_COURSE_IMAGE_PRESETS = [
    { label: "Science", url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=300" },
    { label: "Coding / IT", url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=300" },
    { label: "Mathematics", url: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=300" },
    { label: "Languages", url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=300" },
    { label: "Robotics", url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=300" },
    { label: "Arts", url: "https://images.unsplash.com/photo-1460661419200-1860a1df6370?auto=format&fit=crop&q=80&w=300" },
];

const MADRASHA_COLOR_PRESETS = [
    { name: "Forest Dark Green", color: "#014739" },
    { name: "Emerald Islamic Green", color: "#006568" },
    { name: "Deep Pine Green", color: "#034c3c" },
    { name: "Bottle Green", color: "#0b5345" },
    { name: "Dark Teal Green", color: "#0e6655" },
    { name: "Dark Navy Blue", color: "#1a252f" },
    { name: "Midnight Royal", color: "#17202a" },
    { name: "Maroon Crimson", color: "#4a121a" },
];

const SCHOOL_COLOR_PRESETS = [
    { name: "Dark Teal Green", color: "#044E43" },
    { name: "Classic Navy Blue", color: "#1E3A8A" },
    { name: "Royal Indigo", color: "#3730A3" },
    { name: "Deep Emerald", color: "#065F46" },
    { name: "Slate Charcoal", color: "#1E293B" },
    { name: "Crimson Maroon", color: "#831843" },
    { name: "Royal Purple", color: "#581C87" },
    { name: "Pure Onyx", color: "#18181B" },
];

const MADRASHA_FOOTER_COLOR_PRESETS = [
    { name: "Forest Dark Green", color: "#01352A" },
    { name: "Emerald Islamic Green", color: "#014739" },
    { name: "Deep Pine Green", color: "#034C3C" },
    { name: "Bottle Green", color: "#0B5345" },
    { name: "Dark Teal Green", color: "#0E6655" },
    { name: "Dark Navy Blue", color: "#1A252F" },
    { name: "Midnight Royal", color: "#17202A" },
    { name: "Charcoal Slate", color: "#0F172A" },
];

const SCHOOL_FOOTER_COLOR_PRESETS = [
    { name: "Dark Slate Gray", color: "#0F172A" },
    { name: "Dark Teal Green", color: "#044E43" },
    { name: "Classic Navy Blue", color: "#1E3A8A" },
    { name: "Royal Midnight", color: "#1E1B4B" },
    { name: "Deep Emerald", color: "#064E3B" },
    { name: "Slate Charcoal", color: "#111827" },
    { name: "Deep Purple", color: "#2E1065" },
    { name: "Pure Onyx", color: "#09090B" },
];

interface OnlineCourseItem {
    id: number;
    title: string;
    description?: string;
    price?: string | number;
    category?: string;
    image?: string;
    link?: string;
}

interface MainCourseItem {
    id: number;
    online_course_id?: number;
    title: string;
    description?: string;
    price?: string;
    status?: string;
    category?: string;
    image?: string;
    image_url?: string;
    link?: string;
    url?: string;
    btn_text?: string;
}

interface StaffMemberItem {
    id: number;
    name: string;
    role: string;
    image_url?: string;
}

interface NoticeItem {
    id: number;
    title: string;
    date: string;
    description?: string;
}

interface AccordionItem {
    id: number;
    title: string;
    content: string;
}

export interface ProjectItem {
    id: number | string;
    title: string;
    status: string;
    badge_bg?: string;
    image?: string;
    image_url?: string;
    description: string;
}

export const DEFAULT_MADRASHA_PROJECTS: ProjectItem[] = [
    {
        id: 1,
        title: "মাদ্রাসার বহুতল ভবন নির্মাণ",
        status: "চলমান",
        badge_bg: "bg-amber-500",
        image: "/madrasha/Building-under-construction.jpg",
        description: "ছাত্রীদের ক্রমবর্ধমান সংখ্যা ও নিরাপদ আবাসিক ধারণক্ষমতা বৃদ্ধির লক্ষ্যে নতুন বহুতল শিক্ষা ভবনের নির্মাণ কাজ দ্রুত এগিয়ে চলছে।"
    },
    {
        id: 2,
        title: "উচ্চতর ইসলামিক গবেষণা কেন্দ্র",
        status: "পরিকল্পনা",
        badge_bg: "bg-[#014739]",
        image: "/madrasha/dawra-daras.jpg",
        description: "নারী শিক্ষার্থীদের জন্য ইফতা, তাফসির ও হাদিস গবেষণায় উচ্চতর শিক্ষা বিস্তারের বিশেষ পরিকল্পনা গৃহীত হয়েছে।"
    },
    {
        id: 3,
        title: "আলহুদা ম্যাগাজিন ও প্রকাশনা",
        status: "প্রকাশনা",
        badge_bg: "bg-emerald-600",
        image: "/madrasha/hdiya-prodan.jpg",
        description: "শিক্ষার্থীদের প্রবন্ধ, ক্যালিগ্রাফি ও সাহিত্যচর্চাকে উৎসাহিত করতে নিয়মিত ত্রৈমাসিক দেয়াল পত্রিকা ও স্মরণিকা প্রকাশনা।"
    }
];

interface HeaderFooterSections {
    website_template?: string;
    ischool_logo?: string;
    imadrasha_header_logo?: string;
    ischool_logo_width?: number | string;
    ischool_logo_height?: number | string;
    ischool_logo_auto_ratio?: boolean;
    ischool_header_bg?: string;
    ischool_header_bg_enabled?: boolean;
    header_bg_enabled?: boolean;
    ischool_custom_color_presets?: string[];
    madrasha_logo_width?: number | string;
    madrasha_logo_height?: number | string;
    madrasha_logo_auto_ratio?: boolean;
    madrasha_header_bg?: string;
    madrasha_header_bg_enabled?: boolean;
    madrasha_custom_color_presets?: string[];
    madrasha_topbar_bg?: string;
    madrasa_phone?: string;
    madrasa_email?: string;
    madrasa_address?: string;
    hero_title?: string;
    hero_subtitle?: string;
    hero_button_text?: string;
    hero_button_url?: string;
    hero_stats_students?: string;
    hero_stats_teachers?: string;
    hero_stats_awards?: string;
    hero_stats_courses?: string;
    hero_floating_badge_text?: string;
    hero_floating_badge_desc?: string;
    courses_enabled?: boolean;
    courses_section_title?: string;
    courses_section_subtitle?: string;
    staff_enabled?: boolean;
    staff_section_badge?: string;
    staff_section_title?: string;
    staff_section_subtitle?: string;
    features_section_badge?: string;
    features_section_title?: string;
    features_section_subtitle?: string;
    notices_enabled?: boolean;
    notices_section_title?: string;
    notices_section_subtitle?: string;
    footer_enabled?: boolean;
    footer_bg?: string;
    footer_bg_enabled?: boolean;
    ischool_footer_bg?: string;
    ischool_footer_bg_enabled?: boolean;
    ischool_custom_footer_color_presets?: string[];
    madrasha_footer_bg?: string;
    madrasha_footer_bg_enabled?: boolean;
    madrasha_custom_footer_color_presets?: string[];
    footer_show_logo?: boolean;
    footer_show_school_name?: boolean;
    footer_show_institute_name?: boolean;
    footer_show_established_year?: boolean;
    footer_arabic_title?: string;
    footer_madrasa_name?: string;
    footer_about_text?: string;
    footer_established_year?: string;
    footer_info_label?: string;
    footer_department_links?: Array<{ title: string; url?: string }>;
    footer_menu_label?: string;
    footer_quick_links?: Array<{ title: string; url?: string }>;
    footer_contact_info_label?: string;
    footer_address?: string;
    footer_phone?: string;
    footer_email?: string;
    copyright_text?: string;
    footer_powered_by_text?: string;
    muhtamim_enabled?: boolean;
    projects_enabled?: boolean;
    projects_section_badge?: string;
    projects_section_title?: string;
    projects_section_subtitle?: string;
    projects?: ProjectItem[];
    section_order?: string[];
    [key: string]: unknown;
}

interface FrontCmsSettings {
    website_template?: string;
    section_order?: string[];
    is_active: boolean;
    sidebar_active: boolean;
    rtl_mode: boolean;
    sidebar_options: string[];
    language: string;
    current_theme: string;
    footer_text: string;
    google_analytics: string;
    cookie_consent: string;
    header_code?: string;
    body_code?: string;
    footer_code?: string;
    logo_preview?: string;
    favicon_preview?: string;
    madrasha_logo_preview?: string;
    logo_file?: File | null;
    favicon_file?: File | null;
    madrasha_logo_file?: File | null;
    logo_url?: string;
    favicon_url?: string;
    header_footer_sections: HeaderFooterSections;
    social_media: Record<string, string>;
    about_us: {
        section_title?: string;
        section_subtitle?: string;
        title: string;
        description: string;
        image_url?: string;
        experience_years?: string;
        experience_label?: string;
        bullet_point_1?: string;
        bullet_point_2?: string;
        bullet_point_3?: string;
        bullet_point_4?: string;
        muhtamim_badge?: string;
        muhtamim_heading?: string;
        muhtamim_subtitle?: string;
        muhtamim_institute?: string;
        muhtamim_name?: string;
        muhtamim_designation?: string;
        muhtamim_image?: string;
        muhtamim_message?: string;
        muhtamim_btn1_text?: string;
        muhtamim_btn1_url?: string;
        muhtamim_btn2_text?: string;
        muhtamim_btn2_url?: string;
        projects_section_badge?: string;
        projects_section_title?: string;
        projects_section_subtitle?: string;
        projects?: ProjectItem[];
        mission_title?: string;
        mission_description?: string;
        vision_title?: string;
        vision_description?: string;
        values_title?: string;
        values_description?: string;
        accordions_badge?: string;
        accordions_title?: string;
        accordions_subtitle?: string;
        accordions?: AccordionItem[];
        [key: string]: unknown;
    };
    main_courses: MainCourseItem[];
    experienced_staffs: StaffMemberItem[];
    latest_notices: NoticeItem[];
    [key: string]: unknown;
}

export interface SectionOrderItem {
    id: string;
    name: string;
    badge: string;
    enabledKey: string;
    templateOnly?: "imadrasha" | "ischool";
}

export const ALL_SECTION_DEFS: SectionOrderItem[] = [
    { id: "topbar", name: "Topbar Contact Information / টপবার যোগাযোগের তথ্য", badge: "Topbar", enabledKey: "topbar_enabled" },
    { id: "hero", name: "Hero Banner & Slider / ব্যানার ও স্লাইডার", badge: "Hero", enabledKey: "hero_enabled" },
    { id: "notices", name: "Notice Ticker & Notice Box / নোটিশ বক্স", badge: "Notices", enabledKey: "notices_enabled" },
    { id: "about", name: "About Institution / প্রতিষ্ঠান পরিচিতি", badge: "About", enabledKey: "about_enabled" },
    { id: "campus_card", name: "Campus Showcase Card / ক্যাম্পাস ফিচার", badge: "Showcase", enabledKey: "about_enabled", templateOnly: "imadrasha" },
    { id: "muhtamim", name: "Principal / Muhtamim's Speech / অধ্যক্ষ ও মুহতামিমের বাণী", badge: "Speech", enabledKey: "muhtamim_enabled" },
    { id: "courses", name: "Academic Departments & Courses / শিক্ষাবিভাগ", badge: "Departments", enabledKey: "courses_enabled" },
    { id: "staff", name: "Faculty & Teachers / উস্তাদ ও শিক্ষকমণ্ডলী", badge: "Faculty", enabledKey: "staff_enabled" },
    { id: "features", name: "Educational Pillars (Feature Cards) / মাদরাসার বৈশিষ্ট্যসমূহ", badge: "Pillars", enabledKey: "features_enabled", templateOnly: "imadrasha" },
    { id: "projects", name: "Ongoing Projects & Plans / নির্মাণাধীন প্রজেক্ট", badge: "Projects", enabledKey: "projects_enabled", templateOnly: "imadrasha" },
    { id: "stats", name: "Statistics Counter Bar / পরিসংখ্যান কাউন্টার", badge: "Stats", enabledKey: "stats_enabled" },
    { id: "footer", name: "Footer Section Settings / ফুটার সেকশন সেটিংস", badge: "Footer", enabledKey: "footer_enabled" },
];

export const DEFAULT_MADRASHA_ORDER = ["topbar", "hero", "notices", "about", "campus_card", "muhtamim", "courses", "staff", "features", "projects", "stats", "footer"];
export const DEFAULT_SCHOOL_ORDER = ["topbar", "hero", "notices", "about", "muhtamim", "courses", "staff", "stats", "footer"];

export const getSectionMeta = (id: string, isMadrasha: boolean) => {
    switch (id) {
        case "topbar":
            return {
                name: "Topbar Contact Information / টপবার যোগাযোগের তথ্য",
                badge: "Topbar"
            };
        case "hero":
            return {
                name: "Hero Banner & Slider / ব্যানার ও স্লাইডার",
                badge: "Hero"
            };
        case "notices":
            return {
                name: isMadrasha ? "Notice Ticker & Notice Box / নোটিশ বক্স" : "School Notice Board / নোটিশ বোর্ড",
                badge: "Notices"
            };
        case "about":
            return {
                name: isMadrasha ? "About Institution / প্রতিষ্ঠান পরিচিতি" : "About Institution & Values / প্রতিষ্ঠান পরিচিতি",
                badge: "About"
            };
        case "campus_card":
            return {
                name: "Campus Showcase Card / ক্যাম্পাস ফিচার",
                badge: "Showcase"
            };
        case "muhtamim":
            return {
                name: "Principal / Muhtamim's Speech / মুহতামিম সাহেবের বাণী",
                badge: "Speech"
            };
        case "courses":
            return {
                name: isMadrasha ? "Academic Departments & Courses / জামিয়ার শিক্ষাবিভাগ" : "Our Main Courses / আমাদের প্রধান কোর্সসমূহ",
                badge: isMadrasha ? "Departments" : "Courses"
            };
        case "staff":
            return {
                name: isMadrasha ? "Faculty & Teachers / উস্তাদ ও শিক্ষকমণ্ডলী" : "Faculty & Teachers / শিক্ষক ও শিক্ষিকামণ্ডলী",
                badge: "Faculty"
            };
        case "features":
            return {
                name: "Educational Pillars (Feature Cards) / মাদরাসার বৈশিষ্ট্যসমূহ",
                badge: "Pillars"
            };
        case "projects":
            return {
                name: "Ongoing Projects & Plans / নির্মাণাধীন প্রজেক্ট",
                badge: "Projects"
            };
        case "stats":
            return {
                name: "Statistics Counter Bar / পরিসংখ্যান কাউন্টার",
                badge: "Stats"
            };
        case "footer":
            return {
                name: isMadrasha ? "Footer Section Settings / ফুটার সেকশন সেটিংস" : "Footer Section Settings / ফুটার সেকশন সেটিংস",
                badge: "Footer"
            };
        default:
            return { name: id, badge: id };
    }
};

const themes = [
    { id: "default", name: "default", bg: "bg-blue-600" },
    { id: "yellow", name: "yellow", bg: "bg-yellow-500" },
    { id: "darkgray", name: "darkgray", bg: "bg-gray-800" },
    { id: "bold_blue", name: "bold_blue", bg: "bg-blue-800" },
    { id: "shadow_white", name: "shadow_white", bg: "bg-slate-200" },
    { id: "material_pink", name: "material_pink", bg: "bg-pink-500" },
];

function FrontCmsSettingContent() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState<string>("system");
    const [sectionOrder, setSectionOrder] = useState<string[]>(DEFAULT_MADRASHA_ORDER);

    useEffect(() => {
        if (tabParam) {
            const normalized = tabParam === "banner_images" || tabParam === "banner-images" 
                ? "banners" 
                : tabParam === "hero" 
                    ? "sections" 
                    : tabParam === "header_footer" || tabParam === "header-footer" || tabParam === "header" || tabParam === "footer"
                        ? "header_footer"
                        : tabParam;
            if (["system", "social", "sections", "pages", "menus", "banners", "header_footer"].includes(normalized)) {
                setActiveTab(normalized);
            }
        }
    }, [tabParam]);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", val);
        window.history.replaceState({}, "", url.toString());
    };

    const logoInputRef = useRef<HTMLInputElement>(null);
    const ischoolLogoRatioRef = useRef<number>(220 / 48);
    const madrashaLogoInputRef = useRef<HTMLInputElement>(null);
    const madrashaLogoRatioRef = useRef<number>(580 / 105);
    const heroBgInputRef = useRef<HTMLInputElement>(null);
    const aboutImageInputRef = useRef<HTMLInputElement>(null);
    const footerLogoInputRef = useRef<HTMLInputElement>(null);
    const muhtamimImgInputRef = useRef<HTMLInputElement>(null);
    const projectImgInputRef = useRef<HTMLInputElement>(null);
    const [uploadingHeroBg, setUploadingHeroBg] = useState(false);
    const [uploadingAboutImg, setUploadingAboutImg] = useState(false);
    const [uploadingFooterLogo, setUploadingFooterLogo] = useState(false);
    const [uploadingCourseIdx, setUploadingCourseIdx] = useState<number | null>(null);
    const [uploadingMuhtamimImg, setUploadingMuhtamimImg] = useState(false);
    const [uploadingProjectIdx, setUploadingProjectIdx] = useState<number | null>(null);
    const [activeUploadProjectIdx, setActiveUploadProjectIdx] = useState<number | null>(null);
    const [logoTab, setLogoTab] = useState<"ischool" | "imadrasha">("ischool");
    const [headerTab, setHeaderTab] = useState<"ischool" | "imadrasha">("ischool");
    const [footerTab, setFooterTab] = useState<"ischool" | "imadrasha">("ischool");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [coursePickerOpen, setCoursePickerOpen] = useState(false);
    const [onlineCourses, setOnlineCourses] = useState<OnlineCourseItem[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [courseSearch, setCourseSearch] = useState("");

    const [settings, setSettings] = useState<FrontCmsSettings>({
        website_template: "ischool",
        is_active: true,
        sidebar_active: true,
        rtl_mode: false,
        sidebar_options: ["news", "complain"],
        language: "english",
        logo: null,
        favicon: null,
        footer_text: "© iSchool 2026. All rights reserved",
        cookie_consent: "",
        google_analytics: "",
        header_code: "",
        body_code: "",
        footer_code: "",
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
            title: "Welcome to iSchool",
            description: "Providing quality education for over two decades...",
            image_url: "",
            experience_years: "25+",
            experience_label: "Years Of Educational Excellence",
            bullet_point_1: "Innovative STEM Curriculum",
            bullet_point_2: "Personalized Mentorship",
            bullet_point_3: "Global Ethical Values",
            bullet_point_4: "Comprehensive Sports & Arts",
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
        madrasha_logo_preview: "",
        madrasha_logo_file: null,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get("system-setting/front-cms-settings");
            if (res.data?.status === "success" && res.data.data) {
                const fetched = res.data.data;
                const activeTpl = fetched.website_template || fetched.header_footer_sections?.website_template || "ischool";
                setLogoTab(activeTpl === "imadrasha" ? "imadrasha" : "ischool");
                setHeaderTab(activeTpl === "imadrasha" ? "imadrasha" : "ischool");
                setFooterTab(activeTpl === "imadrasha" ? "imadrasha" : "ischool");

                const parseJsonIfString = (val: unknown) => {
                    if (typeof val === "string") {
                        try { return JSON.parse(val); } catch { return val; }
                    }
                    return val;
                };

                const parsedAboutUs = (parseJsonIfString(fetched.about_us) || {}) as Record<string, unknown>;
                const parsedHfs = (parseJsonIfString(fetched.header_footer_sections) || {}) as Record<string, unknown>;
                const isMadrasha = activeTpl === "imadrasha";

                const defaultIslamicAccordions: AccordionItem[] = [
                    { id: 1, title: "সার্বক্ষণিক পর্দার সুব্যবস্থা", content: "নারী শিক্ষার্থীদের পরিপূর্ণ ইসলামি অনুশাসন ও শরিয়তসম্মত শালীন পর্দা নিশ্চিতকরণ।" },
                    { id: 2, title: "চরিত্রগঠনমূলক নিবিড় তারবিয়াত", content: "আদর্শ ও খোদাভীরু মা হিসেবে গড়ে তুলতে প্রতিনিয়ত বিশেষ তারবিয়াতি ও নসিহতমূলক পরিবেশ।" },
                    { id: 3, title: "সম্পূর্ণ অরাজনৈতিক পরিবেশ", content: "দলীয় রাজনৈতিক প্রভাবমুক্ত, নিবেদিতপ্রাণ খাঁটি দ্বীনি শিক্ষার অনুকূল শান্তিময় ক্যাম্পাস।" },
                    { id: 4, title: "অভিজ্ঞ উস্তাদ ও উস্তাযাহ", content: "বিজ্ঞ উলামায়ে কেরাম ও অভিজ্ঞ শিক্ষিকাবৃন্দের নিবিড় তত্ত্বাবধানে যত্নসহকারে পাঠদান।" },
                    { id: 5, title: "স্বাস্থ্যসম্মত নিরাপদ আবাসন", content: "দূর-দূরান্ত থেকে আগত ছাত্রীদের জন্য সুষম খাবার, নিরাপদ হোস্টেল ও মাতৃতুল্য অভিভাবকত্ব।" },
                    { id: 6, title: "কেন্দ্রীয় বোর্ডে সাফল্য", content: "বেফাক ও হাইয়াতুল উলয়ার অধীনে অনুষ্ঠিত কেন্দ্রীয় সমাপনী পরীক্ষায় প্রতি বছর মেধা তালিকায় গৌরবময় স্থান।" }
                ];

                const existingAccordions = parseJsonIfString(parsedAboutUs.accordions);
                const resolvedAccordions = Array.isArray(existingAccordions) && existingAccordions.length > 0
                    ? existingAccordions
                    : (isMadrasha ? defaultIslamicAccordions : []);

                const existingProjects = parseJsonIfString(parsedHfs.projects || parsedAboutUs.projects);
                const resolvedProjects: ProjectItem[] = Array.isArray(existingProjects) && existingProjects.length > 0
                    ? existingProjects
                    : (isMadrasha ? DEFAULT_MADRASHA_PROJECTS : []);

                let localIschoolCustomPresets: string[] = [];
                try {
                    const rawLocal = typeof window !== "undefined" ? localStorage.getItem("ischool_custom_color_presets") : null;
                    if (rawLocal) localIschoolCustomPresets = JSON.parse(rawLocal);
                } catch {
                    // ignore
                }

                let localMadrashaCustomPresets: string[] = [];
                try {
                    const rawLocal = typeof window !== "undefined" ? localStorage.getItem("madrasha_custom_color_presets") : null;
                    if (rawLocal) localMadrashaCustomPresets = JSON.parse(rawLocal);
                } catch {
                    // ignore
                }

                let localIschoolCustomFooterPresets: string[] = [];
                try {
                    const rawLocal = typeof window !== "undefined" ? localStorage.getItem("ischool_custom_footer_color_presets") : null;
                    if (rawLocal) localIschoolCustomFooterPresets = JSON.parse(rawLocal);
                } catch {
                    // ignore
                }

                let localMadrashaCustomFooterPresets: string[] = [];
                try {
                    const rawLocal = typeof window !== "undefined" ? localStorage.getItem("madrasha_custom_footer_color_presets") : null;
                    if (rawLocal) localMadrashaCustomFooterPresets = JSON.parse(rawLocal);
                } catch {
                    // ignore
                }

                const resolvedIschoolCustomPresets = (Array.isArray(parsedHfs.ischool_custom_color_presets) && parsedHfs.ischool_custom_color_presets.length > 0)
                    ? (parsedHfs.ischool_custom_color_presets as string[])
                    : localIschoolCustomPresets;

                const resolvedMadrashaCustomPresets = (Array.isArray(parsedHfs.madrasha_custom_color_presets) && parsedHfs.madrasha_custom_color_presets.length > 0)
                    ? (parsedHfs.madrasha_custom_color_presets as string[])
                    : localMadrashaCustomPresets;

                const resolvedIschoolCustomFooterPresets = (Array.isArray(parsedHfs.ischool_custom_footer_color_presets) && parsedHfs.ischool_custom_footer_color_presets.length > 0)
                    ? (parsedHfs.ischool_custom_footer_color_presets as string[])
                    : localIschoolCustomFooterPresets;

                const resolvedMadrashaCustomFooterPresets = (Array.isArray(parsedHfs.madrasha_custom_footer_color_presets) && parsedHfs.madrasha_custom_footer_color_presets.length > 0)
                    ? (parsedHfs.madrasha_custom_footer_color_presets as string[])
                    : localMadrashaCustomFooterPresets;

                const resolvedHfs: HeaderFooterSections = {
                    madrasa_phone: "+8801719606713",
                    madrasa_email: "anwarabegumgirlsmadrasa@gmail.com",
                    madrasa_address: "১২ নং গিয়াসনগর ইউনিয়ন, মোহাম্মদপুর, মৌলভীবাজার সদর, মৌলভীবাজার",
                    ...parsedHfs,
                    ischool_logo_width: (parsedHfs.ischool_logo_width as number) || 220,
                    ischool_logo_height: (parsedHfs.ischool_logo_height as number) || 48,
                    ischool_logo_auto_ratio: parsedHfs.ischool_logo_auto_ratio !== false,
                    ischool_header_bg: (parsedHfs.ischool_header_bg as string) || "#044E43",
                    ischool_custom_color_presets: resolvedIschoolCustomPresets,
                    ischool_footer_bg: (parsedHfs.ischool_footer_bg as string) || (parsedHfs.footer_bg as string) || "#0F172A",
                    ischool_footer_bg_enabled: parsedHfs.ischool_footer_bg_enabled !== false,
                    ischool_custom_footer_color_presets: resolvedIschoolCustomFooterPresets,
                    madrasha_logo_width: (parsedHfs.madrasha_logo_width as number) || 580,
                    madrasha_logo_height: (parsedHfs.madrasha_logo_height as number) || 105,
                    madrasha_logo_auto_ratio: parsedHfs.madrasha_logo_auto_ratio !== false,
                    madrasha_header_bg: (parsedHfs.madrasha_header_bg as string) || "#014739",
                    madrasha_custom_color_presets: resolvedMadrashaCustomPresets,
                    madrasha_footer_bg: (parsedHfs.madrasha_footer_bg as string) || (parsedHfs.footer_bg as string) || "#01352A",
                    madrasha_footer_bg_enabled: parsedHfs.madrasha_footer_bg_enabled !== false,
                    madrasha_custom_footer_color_presets: resolvedMadrashaCustomFooterPresets,
                    website_template: activeTpl,
                    staff_section_badge: (parsedHfs.staff_section_badge as string) || (isMadrasha ? "বিজ্ঞ উলামায়ে কেরাম ও শিক্ষকমণ্ডলী" : ""),
                    staff_section_title: (parsedHfs.staff_section_title as string) || (isMadrasha ? "শিক্ষক ও পরিচালকমণ্ডলী" : ""),
                    staff_section_subtitle: (parsedHfs.staff_section_subtitle as string) || (isMadrasha ? "দেশবরেণ্য খ্যাতনামা উলামায়ে কেরাম ও অভিজ্ঞ শিক্ষিকাবৃন্দের তত্ত্বাবধানে পরিচালিত।" : ""),
                    features_enabled: parsedHfs.features_enabled !== false,
                    features_section_badge: (parsedHfs.features_section_badge as string) || (parsedAboutUs.accordions_badge as string) || (isMadrasha ? "সুশৃঙ্খল পরিবেশ" : ""),
                    features_section_title: (parsedHfs.features_section_title as string) || (parsedAboutUs.accordions_title as string) || (isMadrasha ? "মাদরাসার বৈশিষ্ট্যসমূহ" : ""),
                    features_section_subtitle: (parsedHfs.features_section_subtitle as string) || (parsedAboutUs.accordions_subtitle as string) || (isMadrasha ? "দ্বীনি অনুশাসন ও খাঁটি আদর্শে পরিচালিত এক অনুপম দ্বীনি পরিবেশ" : ""),
                    projects_enabled: parsedHfs.projects_enabled !== false,
                    projects_section_badge: (parsedHfs.projects_section_badge as string) || (parsedAboutUs.projects_section_badge as string) || (isMadrasha ? "অগ্রযাত্রা ও ভবিষ্যৎ" : ""),
                    projects_section_title: (parsedHfs.projects_section_title as string) || (parsedAboutUs.projects_section_title as string) || (isMadrasha ? "নির্মাণাধীন প্রজেক্ট ও পরিকল্পনা" : ""),
                    projects_section_subtitle: (parsedHfs.projects_section_subtitle as string) || (parsedAboutUs.projects_section_subtitle as string) || (isMadrasha ? "মাদ্রাসার অবকাঠামোগত উন্নয়ন, বহুতল ভবন নির্মাণ ও ভবিষ্যৎ সম্প্রসারণের ধারাবাহিক পরিকল্পনা।" : ""),
                    projects: resolvedProjects,
                };

                if (resolvedHfs.ischool_logo_width && resolvedHfs.ischool_logo_height) {
                    const parsedW = Number(resolvedHfs.ischool_logo_width);
                    const parsedH = Number(resolvedHfs.ischool_logo_height);
                    if (parsedW > 0 && parsedH > 0) {
                        ischoolLogoRatioRef.current = parsedW / parsedH;
                    }
                }

                if (resolvedHfs.madrasha_logo_width && resolvedHfs.madrasha_logo_height) {
                    const parsedW = Number(resolvedHfs.madrasha_logo_width);
                    const parsedH = Number(resolvedHfs.madrasha_logo_height);
                    if (parsedW > 0 && parsedH > 0) {
                        madrashaLogoRatioRef.current = parsedW / parsedH;
                    }
                }

                const resolvedAboutUs = {
                    ...parsedAboutUs,
                    accordions: resolvedAccordions,
                    accordions_badge: resolvedHfs.features_section_badge,
                    accordions_title: resolvedHfs.features_section_title,
                    accordions_subtitle: resolvedHfs.features_section_subtitle,
                    projects: resolvedProjects,
                    projects_section_badge: resolvedHfs.projects_section_badge,
                    projects_section_title: resolvedHfs.projects_section_title,
                    projects_section_subtitle: resolvedHfs.projects_section_subtitle,
                    card_badge: (parsedAboutUs.card_badge as string) || (isMadrasha ? "ঐতিহ্যের দ্বীনি শিক্ষাঙ্গন • স্থাপিত ২০০৩" : ""),
                    card_title: (parsedAboutUs.card_title as string) || (isMadrasha ? "আদর্শ ইসলামী নারী গড়ার অনন্য জামিয়া" : ""),
                    card_description: (parsedAboutUs.card_description as string) || (isMadrasha ? "সম্পূর্ণ শরিয়তসম্মত শালীন পর্দা, অভিজ্ঞ শিক্ষিকাবৃন্দের যত্ন এবং আধুনিক তথ্যপ্রযুক্তির সমন্বয়ে গড়ে উঠেছে আমাদের এই শিক্ষাঙ্গন।" : ""),
                    card_contact_text: (parsedAboutUs.card_contact_text as string) || (isMadrasha ? "ভর্তি সংক্রান্ত যেকোনো তথ্যে যোগাযোগ করুন" : ""),
                    card_btn_text: (parsedAboutUs.card_btn_text as string) || (isMadrasha ? "ভর্তি নির্দেশিকা" : ""),
                    card_btn_url: (parsedAboutUs.card_btn_url as string) || (isMadrasha ? "/online_admission" : ""),
                    muhtamim_badge: (parsedAboutUs.muhtamim_badge as string) || (isMadrasha ? "মুহতামিম সাহেবের বাণী" : "Principal's Speech"),
                    muhtamim_heading: (parsedAboutUs.muhtamim_heading as string) || (isMadrasha ? "দ্বীনি শিক্ষার গুরুত্ব ও খোদাভীরু নারীসমাজ গঠনের আহ্বান" : "Inspiring Excellence, Fostering Leadership & Lifelong Learning"),
                    muhtamim_subtitle: (parsedAboutUs.muhtamim_subtitle as string) || (isMadrasha ? "দিকনির্দেশনামূলক নসিহত ও বার্তা" : "Message from the Principal"),
                    muhtamim_institute: (parsedAboutUs.muhtamim_institute as string) || (isMadrasha ? "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মাদপুর" : "Bhujpur Government Primary School"),
                    muhtamim_name: (parsedAboutUs.muhtamim_name as string) || (isMadrasha ? "শায়খ মাওলানা মুজিবুর রহমান মুজাহিদ" : "Dr. Mohammad Rafiqul Islam"),
                    muhtamim_designation: (parsedAboutUs.muhtamim_designation as string) || (isMadrasha ? "মুহতামিম ও শায়খুল হাদিস" : "Principal & Head of Institution"),
                    muhtamim_image: (parsedAboutUs.muhtamim_image as string) || (isMadrasha ? "https://anwarabegumgirlsmadrasa.com/wp-content/uploads/2019/05/muhtamim-anwara.jpg" : "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80"),
                    muhtamim_message: (parsedAboutUs.muhtamim_message as string) || (isMadrasha ? "আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহ। দ্বীনি শিক্ষা প্রতিটি মুসলমানের জন্য আত্মিক পথনির্দেশ। বিশেষ করে আমাদের সমাজে কন্যাশিশু ও মা-বোনদের খাঁটি ইসলামি অনুশাসনে শিক্ষিত করে গড়ে তোলা আজ সময়ের সবচেয়ে বড় দাবি। আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা আল্লাহর রহমতে সেই মহান লক্ষ্য নিয়ে এগিয়ে যাচ্ছে। আপনারা সকলেই এই প্রতিষ্ঠানের জন্য দোয়া করবেন এবং সার্বিক সহযোগিতা করবেন। জাযাকুমুল্লাহু খাইরান।" : "Welcome to our institution. Education is the cornerstone of individual growth and societal advancement. We are dedicated to nurturing well-rounded individuals equipped with knowledge, moral integrity, and critical thinking skills. Together with our passionate educators, supportive parents, and vibrant students, we strive to build a future of limitless possibilities."),
                    muhtamim_btn1_text: (parsedAboutUs.muhtamim_btn1_text as string) || (isMadrasha ? "ভর্তির বিস্তারিত নির্দেশিকা ও আবেদন" : "Apply For Admission"),
                    muhtamim_btn1_url: (parsedAboutUs.muhtamim_btn1_url as string) || "/online_admission",
                    muhtamim_btn2_text: (parsedAboutUs.muhtamim_btn2_text as string) || (isMadrasha ? "যোগাযোগ করুন" : "Contact Us"),
                    muhtamim_btn2_url: (parsedAboutUs.muhtamim_btn2_url as string) || (isMadrasha ? "#contact" : "/contact-us"),
                };

                setSettings((prev) => ({
                    ...prev,
                    ...fetched,
                    website_template: activeTpl,
                    logo_preview: fetched.logo_url || resolvedHfs.ischool_logo || "",
                    favicon_preview: fetched.favicon_url || "",
                    madrasha_logo_preview: resolvedHfs.imadrasha_header_logo || "",
                    footer_text: fetched.footer_text || prev.footer_text,
                    google_analytics: fetched.google_analytics || "",
                    cookie_consent: fetched.cookie_consent || "",
                    header_code: fetched.header_code ?? (resolvedHfs.header_code as string) ?? "",
                    body_code: fetched.body_code ?? (resolvedHfs.body_code as string) ?? "",
                    footer_code: fetched.footer_code ?? (resolvedHfs.footer_code as string) ?? "",
                    header_footer_sections: resolvedHfs,
                    social_media: (parseJsonIfString(fetched.social_media) || prev.social_media) as Record<string, string>,
                    about_us: resolvedAboutUs,
                    main_courses: (parseJsonIfString(fetched.main_courses) || prev.main_courses) as MainCourseItem[],
                    experienced_staffs: (parseJsonIfString(fetched.experienced_staffs) || prev.experienced_staffs) as StaffMemberItem[],
                    latest_notices: (parseJsonIfString(fetched.latest_notices) || prev.latest_notices) as NoticeItem[],
                }));

                const savedOrder = resolvedHfs.section_order || fetched.section_order;
                const availableDefs = ALL_SECTION_DEFS.filter((d) => !d.templateOnly || d.templateOnly === (isMadrasha ? "imadrasha" : "ischool"));
                const validIds = new Set(availableDefs.map((d) => d.id));
                const activeOrder = Array.isArray(savedOrder) && savedOrder.length > 0
                    ? (savedOrder as string[]).filter(id => validIds.has(id))
                    : (isMadrasha ? DEFAULT_MADRASHA_ORDER : DEFAULT_SCHOOL_ORDER);
                availableDefs.forEach((d) => {
                    if (!activeOrder.includes(d.id)) {
                        activeOrder.push(d.id);
                    }
                });
                setSectionOrder(activeOrder);
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyPreset = async (targetTemplate?: string, forceReset = false) => {
        const tpl = (targetTemplate || settings.website_template || "ischool") as "ischool" | "imadrasha";
        const preset = TEMPLATE_PRESETS[tpl];
        if (!preset) return;

        const defaultOrder = tpl === "imadrasha" ? DEFAULT_MADRASHA_ORDER : DEFAULT_SCHOOL_ORDER;

        setSettings((prev) => {
            const currentTemplatePresets = (prev.header_footer_sections?.template_presets as Record<string, unknown>) || {};
            const outgoingTpl = prev.website_template || "ischool";

            // Snapshot the outgoing template state so user edits are remembered per template
            const updatedPresets: Record<string, unknown> = {
                ...currentTemplatePresets,
                [outgoingTpl]: {
                    current_theme: prev.current_theme,
                    footer_text: prev.footer_text,
                    header_footer_sections: prev.header_footer_sections,
                    about_us: prev.about_us,
                    main_courses: prev.main_courses,
                    experienced_staffs: prev.experienced_staffs,
                    section_order: sectionOrder,
                }
            };

            const savedIncoming = (!forceReset && updatedPresets[tpl])
                ? (updatedPresets[tpl] as Record<string, unknown>)
                : null;

            const targetTheme = (savedIncoming?.current_theme as string) || preset.current_theme || prev.current_theme;
            const targetFooterText = (savedIncoming?.footer_text as string) || preset.footer_text || prev.footer_text;
            const targetOrder = (Array.isArray(savedIncoming?.section_order) && (savedIncoming.section_order as string[]).length > 0)
                ? (savedIncoming.section_order as string[])
                : defaultOrder;
            const targetAboutUs = (savedIncoming?.about_us as Record<string, unknown>) || preset.about_us;
            const targetMainCourses = (savedIncoming?.main_courses as MainCourseItem[]) || (preset.main_courses as MainCourseItem[]);
            const targetExperiencedStaffs = (savedIncoming?.experienced_staffs as StaffMemberItem[]) || (preset.experienced_staffs as StaffMemberItem[]);

            // Isolated base header_footer_sections without cross-template pollution
            const baseHfs = (savedIncoming?.header_footer_sections as HeaderFooterSections) || (preset.header_footer_sections as HeaderFooterSections);
            const targetHfs: HeaderFooterSections = {
                ...baseHfs,
                ischool_custom_color_presets: (baseHfs?.ischool_custom_color_presets as string[]) || (prev.header_footer_sections?.ischool_custom_color_presets as string[]) || [],
                madrasha_custom_color_presets: (baseHfs?.madrasha_custom_color_presets as string[]) || (prev.header_footer_sections?.madrasha_custom_color_presets as string[]) || [],
                ischool_custom_footer_color_presets: (baseHfs?.ischool_custom_footer_color_presets as string[]) || (prev.header_footer_sections?.ischool_custom_footer_color_presets as string[]) || [],
                madrasha_custom_footer_color_presets: (baseHfs?.madrasha_custom_footer_color_presets as string[]) || (prev.header_footer_sections?.madrasha_custom_footer_color_presets as string[]) || [],
                website_template: tpl,
                section_order: targetOrder,
                template_presets: updatedPresets,
            };

            setSectionOrder(targetOrder);
            setHeaderTab(tpl === "imadrasha" ? "imadrasha" : "ischool");
            setFooterTab(tpl === "imadrasha" ? "imadrasha" : "ischool");

            return {
                ...prev,
                website_template: tpl,
                section_order: targetOrder,
                current_theme: targetTheme,
                footer_text: targetFooterText,
                header_footer_sections: targetHfs,
                about_us: targetAboutUs,
                main_courses: targetMainCourses,
                experienced_staffs: targetExperiencedStaffs,
            };
        });

        try {
            await api.post("/front-cms/menus/preset", { template: tpl, website_template: tpl });
        } catch (e) {
            console.error("Failed to sync menus preset:", e);
        }

        toast("success", t(tpl === "imadrasha" ? "template_switched_to_madrasha" : "template_switched_to_ischool"));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "favicon" | "madrasha_logo") => {
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

    const getFilteredSectionOrder = () => {
        const isMadrasha = settings.website_template === "imadrasha";
        const availableDefs = ALL_SECTION_DEFS.filter((d) => !d.templateOnly || d.templateOnly === (isMadrasha ? "imadrasha" : "ischool"));
        const validIds = new Set(availableDefs.map((d) => d.id));
        const currentValid = sectionOrder.filter((id) => validIds.has(id));
        availableDefs.forEach((d) => {
            if (!currentValid.includes(d.id)) {
                currentValid.push(d.id);
            }
        });
        return currentValid;
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const currentFiltered = getFilteredSectionOrder();
        const items = Array.from(currentFiltered);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setSectionOrder(items);
        setSettings((prev) => ({
            ...prev,
            section_order: items,
            header_footer_sections: {
                ...prev.header_footer_sections,
                section_order: items,
            }
        }));
    };

    const toggleSectionEnabled = (key: string, enabled: boolean) => {
        setSettings((prev) => ({
            ...prev,
            header_footer_sections: {
                ...prev.header_footer_sections,
                [key]: enabled,
                ...(key === "header_bg_enabled" ? {
                    ischool_header_bg_enabled: enabled,
                    madrasha_header_bg_enabled: enabled,
                } : {}),
                ...(key === "footer_bg_enabled" ? {
                    ischool_footer_bg_enabled: enabled,
                    madrasha_footer_bg_enabled: enabled,
                } : {}),
            }
        }));
    };

    const isValidHexColor = (hex: string): boolean => {
        return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
    };

    const normalizeHex = (hex: string): string => {
        let clean = hex.trim();
        if (!clean.startsWith("#")) clean = `#${clean}`;
        if (clean.length === 4) {
            clean = `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
        }
        return clean.toUpperCase();
    };

        const getSafePickerHex = (raw?: string, defaultHex = "#044E43") => {
        if (!raw) return defaultHex;
        let clean = raw.trim();
        if (!clean.startsWith("#")) clean = `#${clean}`;
        if (clean.length === 4) {
            clean = `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
        }
        if (/^#[0-9A-Fa-f]{6}$/.test(clean)) return clean;
        return defaultHex;
    };

    const handleColorHexChange = (val: string, templateType: "ischool" | "imadrasha" = "ischool") => {
        const key = templateType === "imadrasha" ? "madrasha_header_bg" : "ischool_header_bg";
        setSettings((prev) => ({
            ...prev,
            header_footer_sections: {
                ...prev.header_footer_sections,
                [key]: val,
            },
        }));
    };

    const handleAddCustomPreset = (colorToAdd?: string, templateType: "ischool" | "imadrasha" = "ischool") => {
        const key = templateType === "ischool" ? "ischool_header_bg" : "madrasha_header_bg";
        const presetsKey = templateType === "ischool" ? "ischool_custom_color_presets" : "madrasha_custom_color_presets";
        const defaultColor = templateType === "ischool" ? "#044E43" : "#014739";

        const raw = colorToAdd || (settings.header_footer_sections?.[key] as string) || defaultColor;
        const normalized = normalizeHex(raw);

        if (!isValidHexColor(normalized)) {
            toast("error", t("invalid_hex_color") || "Please enter a valid Hex color (e.g. #044E43)");
            return;
        }

        const existing = (Array.isArray(settings.header_footer_sections?.[presetsKey])
            ? settings.header_footer_sections[presetsKey]
            : []) as string[];

        if (existing.some((c) => c.toUpperCase() === normalized)) {
            toast("info", `${t("preset_already_exists") || "This color is already in your presets"} (${normalized})`);
            return;
        }

        const updated = [...existing, normalized];

        setSettings((prev) => ({
            ...prev,
            header_footer_sections: {
                ...prev.header_footer_sections,
                [presetsKey]: updated,
                [key]: normalized,
            },
        }));

        try {
            if (typeof window !== "undefined") {
                localStorage.setItem(presetsKey, JSON.stringify(updated));
            }
        } catch (e) {
            console.error("Storage error:", e);
        }

        toast("success", `${t("preset_added_success") || "Color added to custom presets"}: ${normalized}`);
    };

    const handleRemoveCustomPreset = (colorToRemove: string, templateType: "ischool" | "imadrasha" = "ischool", e?: React.MouseEvent) => {
        e?.stopPropagation();
        const presetsKey = templateType === "ischool" ? "ischool_custom_color_presets" : "madrasha_custom_color_presets";
        const existing = (Array.isArray(settings.header_footer_sections?.[presetsKey])
            ? settings.header_footer_sections[presetsKey]
            : []) as string[];

        const updated = existing.filter((c) => c.toUpperCase() !== colorToRemove.toUpperCase());

        setSettings((prev) => ({
            ...prev,
            header_footer_sections: {
                ...prev.header_footer_sections,
                [presetsKey]: updated,
            },
        }));

        try {
            if (typeof window !== "undefined") {
                localStorage.setItem(presetsKey, JSON.stringify(updated));
            }
        } catch (e) {
            console.error("Storage error:", e);
        }

        toast("info", `${t("preset_removed") || "Preset removed"}: ${colorToRemove}`);
    };

    const handleClearCustomPresets = (templateType: "ischool" | "imadrasha" = "ischool") => {
        const presetsKey = templateType === "ischool" ? "ischool_custom_color_presets" : "madrasha_custom_color_presets";
        setSettings((prev) => ({
            ...prev,
            header_footer_sections: {
                ...prev.header_footer_sections,
                [presetsKey]: [],
            },
        }));
        try {
            if (typeof window !== "undefined") {
                localStorage.removeItem(presetsKey);
            }
        } catch (e) {
            console.error("Storage error:", e);
        }
        toast("info", t("clear_all_presets") || "Custom presets cleared");
    };

    const handleFooterColorHexChange = (val: string, templateType: "ischool" | "imadrasha" = "ischool") => {
        const key = templateType === "imadrasha" ? "madrasha_footer_bg" : "ischool_footer_bg";
        setSettings((prev) => ({
            ...prev,
            header_footer_sections: {
                ...prev.header_footer_sections,
                [key]: val,
                ...(prev.website_template === templateType ? { footer_bg: val } : {}),
            },
        }));
    };

    const handleAddCustomFooterPreset = (colorToAdd?: string, templateType: "ischool" | "imadrasha" = "ischool") => {
        const key = templateType === "ischool" ? "ischool_footer_bg" : "madrasha_footer_bg";
        const presetsKey = templateType === "ischool" ? "ischool_custom_footer_color_presets" : "madrasha_custom_footer_color_presets";
        const defaultColor = templateType === "ischool" ? "#0F172A" : "#01352A";

        const raw = colorToAdd || (settings.header_footer_sections?.[key] as string) || defaultColor;
        const normalized = normalizeHex(raw);

        if (!isValidHexColor(normalized)) {
            toast("error", t("invalid_hex_color") || "Please enter a valid Hex color (e.g. #0F172A)");
            return;
        }

        const existing = (Array.isArray(settings.header_footer_sections?.[presetsKey])
            ? settings.header_footer_sections[presetsKey]
            : []) as string[];

        if (existing.some((c) => c.toUpperCase() === normalized)) {
            toast("info", `${t("preset_already_exists") || "This color is already in your presets"} (${normalized})`);
            return;
        }

        const updated = [...existing, normalized];

        setSettings((prev) => ({
            ...prev,
            header_footer_sections: {
                ...prev.header_footer_sections,
                [presetsKey]: updated,
                [key]: normalized,
            },
        }));

        try {
            if (typeof window !== "undefined") {
                localStorage.setItem(presetsKey, JSON.stringify(updated));
            }
        } catch (e) {
            console.error("Storage error:", e);
        }

        toast("success", `${t("preset_added_success") || "Color added to custom presets"}: ${normalized}`);
    };

    const handleRemoveCustomFooterPreset = (colorToRemove: string, templateType: "ischool" | "imadrasha" = "ischool", e?: React.MouseEvent) => {
        e?.stopPropagation();
        const presetsKey = templateType === "ischool" ? "ischool_custom_footer_color_presets" : "madrasha_custom_footer_color_presets";
        const existing = (Array.isArray(settings.header_footer_sections?.[presetsKey])
            ? settings.header_footer_sections[presetsKey]
            : []) as string[];

        const updated = existing.filter((c) => c.toUpperCase() !== colorToRemove.toUpperCase());

        setSettings((prev) => ({
            ...prev,
            header_footer_sections: {
                ...prev.header_footer_sections,
                [presetsKey]: updated,
            },
        }));

        try {
            if (typeof window !== "undefined") {
                localStorage.setItem(presetsKey, JSON.stringify(updated));
            }
        } catch (e) {
            console.error("Storage error:", e);
        }

        toast("info", `${t("preset_removed") || "Preset removed"}: ${colorToRemove}`);
    };

    const handleClearCustomFooterPresets = (templateType: "ischool" | "imadrasha" = "ischool") => {
        const presetsKey = templateType === "ischool" ? "ischool_custom_footer_color_presets" : "madrasha_custom_footer_color_presets";
        setSettings((prev) => ({
            ...prev,
            header_footer_sections: {
                ...prev.header_footer_sections,
                [presetsKey]: [],
            },
        }));
        try {
            if (typeof window !== "undefined") {
                localStorage.removeItem(presetsKey);
            }
        } catch (e) {
            console.error("Storage error:", e);
        }
        toast("info", t("clear_all_presets") || "Custom presets cleared");
    };

    const resetSectionOrder = () => {
        const defaultOrder = settings.website_template === "imadrasha" ? DEFAULT_MADRASHA_ORDER : DEFAULT_SCHOOL_ORDER;
        setSectionOrder(defaultOrder);
        setSettings((prev) => ({
            ...prev,
            section_order: defaultOrder,
            header_footer_sections: {
                ...prev.header_footer_sections,
                section_order: defaultOrder,
            }
        }));
        toast("info", t("reset_order"));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();

            const currentSettingsWithOrder = {
                ...settings,
                section_order: sectionOrder,
                header_footer_sections: {
                    ...settings.header_footer_sections,
                    section_order: sectionOrder,
                }
            };

            Object.keys(currentSettingsWithOrder).forEach(key => {
                if ([
                    "logo", "favicon", "madrasha_logo",
                    "logo_preview", "favicon_preview", "madrasha_logo_preview", 
                    "logo_file", "favicon_file", "madrasha_logo_file", 
                    "logo_url", "favicon_url"
                ].includes(key)) return;

                const value = (currentSettingsWithOrder as Record<string, unknown>)[key];
                if (typeof value === 'object' && value !== null) {
                    formData.append(key, JSON.stringify(value));
                } else if (value !== null && value !== undefined) {
                    formData.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
                }
            });

            if (settings.logo_file) formData.append('logo', settings.logo_file);
            if (settings.favicon_file) formData.append('favicon', settings.favicon_file);
            if (settings.madrasha_logo_file) formData.append('madrasha_logo', settings.madrasha_logo_file);

            const res = await api.post("system-setting/front-cms-settings", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.status === "success") {
                toast("success", t("saved_successfully"));
                fetchSettings();
            } else {
                toast("error", res.data?.message || t("failed_to_save"));
            }
        } catch (err: unknown) {
            console.error("Save front-cms settings error:", err);
            const apiErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
            const errorMsg = apiErr.response?.data?.message || 
                (apiErr.response?.data?.errors ? Object.values(apiErr.response.data.errors).flat().join(", ") : null) || 
                t("failed_to_save");
            toast("error", errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const getProjectsList = (): ProjectItem[] => {
        const list = settings.header_footer_sections?.projects || settings.about_us?.projects;
        if (Array.isArray(list) && list.length > 0) return list;
        return settings.website_template === "imadrasha" ? DEFAULT_MADRASHA_PROJECTS : [];
    };

    const updateProjectsList = (newList: ProjectItem[]) => {
        setSettings((prev) => ({
            ...prev,
            header_footer_sections: {
                ...prev.header_footer_sections,
                projects: newList,
            },
            about_us: {
                ...prev.about_us,
                projects: newList,
            }
        }));
    };

    const addProjectItem = () => {
        const current = getProjectsList();
        const newItem: ProjectItem = {
            id: Date.now(),
            title: "",
            status: "চলমান",
            badge_bg: "bg-amber-500",
            image: "/madrasha/Building-under-construction.jpg",
            description: ""
        };
        updateProjectsList([...current, newItem]);
    };

    const updateProjectItem = (index: number, field: keyof ProjectItem, value: unknown) => {
        const current = [...getProjectsList()];
        if (current[index]) {
            current[index] = { ...current[index], [field]: value };
            updateProjectsList(current);
        }
    };

    const removeProjectItem = (index: number) => {
        const current = [...getProjectsList()];
        current.splice(index, 1);
        updateProjectsList(current);
    };

    const addListItem = (section: "experienced_staffs", item: Omit<StaffMemberItem, "id">) => {
        setSettings((prev) => ({
            ...prev,
            [section]: [...prev[section], { ...item, id: Date.now() }],
        }));
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

    const addOnlineCourse = (course: OnlineCourseItem) => {
        const exists = settings.main_courses.some((c: MainCourseItem) => c.online_course_id === course.id);
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

    const removeListItem = (section: "main_courses" | "experienced_staffs", id: number) => {
        if (section === "main_courses") {
            setSettings((prev) => ({ ...prev, main_courses: prev.main_courses.filter((item) => item.id !== id) }));
        } else {
            setSettings((prev) => ({ ...prev, experienced_staffs: prev.experienced_staffs.filter((item) => item.id !== id) }));
        }
    };

    const resolveCmsImgUrl = (url?: string) => {
        if (!url) return "";
        if (url.includes("anwar-web-banner.png") || url.includes("anwara-web-banner.png")) return "/anwara-web-banner.png";
        if (url.includes("anwarabegumgirlsmadrasa.com/wp-content/uploads/")) {
            const filename = url.split("/").pop();
            if (filename) return `/madrasha/${filename}`;
        }
        if (url.startsWith("/storage/") || url.startsWith("storage/") || url.includes("/storage/")) {
            return getImageUrl(url);
        }
        return url;
    };

    const addCourseItem = () => {
        const newItem: MainCourseItem = {
            id: Date.now(),
            title: "",
            category: "নুরানি",
            price: "ভর্তি চলমান",
            status: "ভর্তি চলমান",
            btn_text: "আবেদন করুন",
            link: "/online_admission",
            url: "/online_admission",
            description: "",
            image: "/madrasha/1111-300x300.png",
            image_url: "/madrasha/1111-300x300.png"
        };
        setSettings((prev) => ({
            ...prev,
            main_courses: [...(prev.main_courses || []), newItem],
        }));
    };

    const updateCourse = (idx: number, field: keyof MainCourseItem, value: string) => {
        setSettings((prev) => {
            const list = [...(prev.main_courses || [])];
            if (!list[idx]) return prev;
            const updated = { ...list[idx], [field]: value };
            if (field === "status") updated.price = value;
            if (field === "price" && !updated.status) updated.status = value;
            if (field === "link") updated.url = value;
            if (field === "url" && !updated.link) updated.link = value;
            if (field === "image") updated.image_url = value;
            if (field === "image_url" && !updated.image) updated.image = value;
            list[idx] = updated;
            return { ...prev, main_courses: list };
        });
    };

    const updateFooterSocial = (platform: string, val: string) => {
        setSettings((prev) => ({
            ...prev,
            header_footer_sections: {
                ...prev.header_footer_sections,
                footer_social_links: {
                    ...((prev.header_footer_sections?.footer_social_links as Record<string, string>) || {}),
                    [platform]: val,
                },
            },
            social_media: {
                ...prev.social_media,
                [platform]: val,
            },
        }));
    };

    const optimizeImageForUpload = (file: File, maxDimension = 1920, quality = 0.88): Promise<File> => {
        return new Promise((resolve) => {
            if (typeof window === "undefined" || file.type === "image/svg+xml" || file.type === "image/gif") {
                return resolve(file);
            }

            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };

            img.onload = () => {
                let { width, height } = img;

                if (width <= maxDimension && height <= maxDimension && file.size < 1024 * 1024) {
                    return resolve(file);
                }

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) return resolve(file);

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) return resolve(file);
                        const newFileName = file.name.replace(/\.[^.]+$/, ".jpg");
                        const optimizedFile = new File([blob], newFileName, { type: "image/jpeg" });
                        resolve(optimizedFile);
                    },
                    "image/jpeg",
                    quality
                );
            };

            img.onerror = () => resolve(file);
            reader.onerror = () => resolve(file);
            reader.readAsDataURL(file);
        });
    };

    const handleCourseImageUpload = async (idx: number, rawFile: File) => {
        if (!rawFile) return;

        if (!rawFile.type.startsWith('image/')) {
            toast("error", t("please_upload_valid_image") || "Please upload a valid image file");
            return;
        }

        try {
            setUploadingCourseIdx(idx);
            const file = await optimizeImageForUpload(rawFile);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("template", settings.website_template || "ischool");
            formData.append("section", "courses");

            let response;
            try {
                response = await api.post("system-setting/front-cms-settings/upload-image", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } catch (formErr: unknown) {
                console.warn("Course image upload fallback to base64:", formErr);
                const base64Data = await new Promise<string>((res, rej) => {
                    const r = new FileReader();
                    r.onload = () => res(r.result as string);
                    r.onerror = rej;
                    r.readAsDataURL(file);
                });
                response = await api.post("system-setting/front-cms-settings/upload-image", {
                    image_base64: base64Data,
                    template: settings.website_template || "ischool",
                    section: "courses",
                });
            }

            const uploadedUrl = response?.data?.data?.url || response?.data?.url;
            const targetFolder = response?.data?.data?.folder || `front_cms/${settings.website_template || "ischool"}/courses`;

            if (uploadedUrl) {
                updateCourse(idx, "image", uploadedUrl);
                updateCourse(idx, "image_url", uploadedUrl);
                toast("success", `${t("course_image_uploaded") || "Course image uploaded successfully"} (${targetFolder})`);
            } else {
                toast("error", response?.data?.message || t("failed_to_save"));
            }
        } catch (error: unknown) {
            console.error("Course image upload failed:", error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            const apiMsg = err?.response?.data?.message || err?.message || "Failed to upload course image";
            toast("error", apiMsg);
        } finally {
            setUploadingCourseIdx(null);
        }
    };

    const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;

        if (!rawFile.type.startsWith('image/')) {
            toast("error", t("please_upload_valid_image") || "Please upload a valid image file");
            e.target.value = "";
            return;
        }

        try {
            setUploadingAboutImg(true);
            const file = await optimizeImageForUpload(rawFile);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("template", settings.website_template || "ischool");
            formData.append("section", "about");

            let response;
            try {
                response = await api.post("system-setting/front-cms-settings/upload-image", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } catch (formErr: unknown) {
                console.warn("About image upload fallback to base64:", formErr);
                const base64Data = await new Promise<string>((res, rej) => {
                    const r = new FileReader();
                    r.onload = () => res(r.result as string);
                    r.onerror = rej;
                    r.readAsDataURL(file);
                });
                response = await api.post("system-setting/front-cms-settings/upload-image", {
                    image_base64: base64Data,
                    template: settings.website_template || "ischool",
                    section: "about",
                });
            }

            const uploadedUrl = response?.data?.data?.url || response?.data?.url;
            const targetFolder = response?.data?.data?.folder || `front_cms/${settings.website_template || "ischool"}/about`;

            if (uploadedUrl) {
                setSettings(prev => ({
                    ...prev,
                    about_us: {
                        ...prev.about_us,
                        image_url: uploadedUrl,
                        image: uploadedUrl,
                    }
                }));
                toast("success", `${t("about_image_uploaded") || "About Us image uploaded successfully"} (${targetFolder})`);
            } else {
                toast("error", response?.data?.message || t("failed_to_save"));
            }
        } catch (error: unknown) {
            console.error("About image upload failed:", error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            const apiMsg = err?.response?.data?.message || err?.message || "Failed to upload about image";
            toast("error", apiMsg);
        } finally {
            setUploadingAboutImg(false);
            e.target.value = "";
        }
    };

    const handleFooterLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;

        if (!rawFile.type.startsWith('image/')) {
            toast("error", t("please_upload_valid_image") || "Please upload a valid image file");
            e.target.value = "";
            return;
        }

        try {
            setUploadingFooterLogo(true);
            const file = await optimizeImageForUpload(rawFile);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("template", settings.website_template || "ischool");
            formData.append("section", "footer");

            let response;
            try {
                response = await api.post("system-setting/front-cms-settings/upload-image", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } catch (formErr: unknown) {
                console.warn("Footer logo upload fallback to base64:", formErr);
                const base64Data = await new Promise<string>((res, rej) => {
                    const r = new FileReader();
                    r.onload = () => res(r.result as string);
                    r.onerror = rej;
                    r.readAsDataURL(file);
                });
                response = await api.post("system-setting/front-cms-settings/upload-image", {
                    image_base64: base64Data,
                    template: settings.website_template || "ischool",
                    section: "footer",
                });
            }

            const uploadedUrl = response?.data?.data?.url || response?.data?.url;
            const targetFolder = response?.data?.data?.folder || `front_cms/${settings.website_template || "ischool"}/footer`;

            if (uploadedUrl) {
                setSettings(prev => ({
                    ...prev,
                    header_footer_sections: {
                        ...prev.header_footer_sections,
                        footer_logo: uploadedUrl,
                    }
                }));
                toast("success", `${t("footer_logo_uploaded") || "Footer logo uploaded successfully"} (${targetFolder})`);
            } else {
                toast("error", response?.data?.message || t("failed_to_save"));
            }
        } catch (error: unknown) {
            console.error("Footer logo upload failed:", error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            const apiMsg = err?.response?.data?.message || err?.message || "Failed to upload footer logo";
            toast("error", apiMsg);
        } finally {
            setUploadingFooterLogo(false);
            e.target.value = "";
        }
    };

    const handleHeroBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;

        if (!rawFile.type.startsWith('image/')) {
            toast("error", t("please_upload_valid_image") || "Please upload a valid image file");
            e.target.value = "";
            return;
        }

        try {
            setUploadingHeroBg(true);

            // Optimize/compress image client-side to prevent hitting PHP upload_max_filesize limit
            const file = await optimizeImageForUpload(rawFile);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("template", settings.website_template || "ischool");
            formData.append("section", "hero");

            let response;
            try {
                response = await api.post("system-setting/front-cms-settings/upload-image", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            } catch (formErr: unknown) {
                // If multipart fails (e.g. server 422 or proxy rejection), fallback automatically to base64 payload
                console.warn("Multipart upload encountered an issue, falling back to base64 upload:", formErr);
                const base64Data = await new Promise<string>((res, rej) => {
                    const r = new FileReader();
                    r.onload = () => res(r.result as string);
                    r.onerror = rej;
                    r.readAsDataURL(file);
                });

                response = await api.post("system-setting/front-cms-settings/upload-image", {
                    image_base64: base64Data,
                    template: settings.website_template || "ischool",
                    section: "hero",
                });
            }

            const uploadedUrl = response?.data?.data?.url || response?.data?.url;
            const targetFolder = response?.data?.data?.folder || `front_cms/${settings.website_template || "ischool"}/hero`;

            if (uploadedUrl) {
                setSettings(prev => ({
                    ...prev,
                    header_footer_sections: {
                        ...prev.header_footer_sections,
                        hero_background: uploadedUrl,
                    }
                }));
                toast("success", `${t("image_uploaded_successfully") || "Image uploaded successfully"} (${targetFolder})`);
            } else {
                toast("error", response?.data?.message || t("failed_to_save"));
            }
        } catch (error: unknown) {
            console.error("Hero background upload failed:", error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            const apiMsg = err?.response?.data?.message || err?.message || "Failed to upload hero background image";
            toast("error", apiMsg);
        } finally {
            setUploadingHeroBg(false);
            e.target.value = "";
        }
    };

    const handleMuhtamimImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;

        if (!rawFile.type.startsWith('image/')) {
            toast("error", t("please_upload_valid_image") || "Please upload a valid image file");
            e.target.value = "";
            return;
        }

        try {
            setUploadingMuhtamimImg(true);
            const file = await optimizeImageForUpload(rawFile);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("template", settings.website_template || "imadrasha");
            formData.append("section", "muhtamim");

            let response;
            try {
                response = await api.post("system-setting/front-cms-settings/upload-image", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } catch (formErr: unknown) {
                console.warn("Muhtamim image upload fallback to base64:", formErr);
                const base64Data = await new Promise<string>((res, rej) => {
                    const r = new FileReader();
                    r.onload = () => res(r.result as string);
                    r.onerror = rej;
                    r.readAsDataURL(file);
                });
                response = await api.post("system-setting/front-cms-settings/upload-image", {
                    image_base64: base64Data,
                    template: settings.website_template || "imadrasha",
                    section: "muhtamim",
                });
            }

            const uploadedUrl = response?.data?.data?.url || response?.data?.url;
            const targetFolder = response?.data?.data?.folder || `front_cms/${settings.website_template || "imadrasha"}/muhtamim`;

            if (uploadedUrl) {
                updateNestedField("about_us", "muhtamim_image", uploadedUrl);
                toast("success", `${t("muhtamim_photo_uploaded") || "Muhtamim photo uploaded successfully"} (${targetFolder})`);
            } else {
                toast("error", response?.data?.message || t("failed_to_save"));
            }
        } catch (error: unknown) {
            console.error("Muhtamim photo upload failed:", error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            const apiMsg = err?.response?.data?.message || err?.message || "Failed to upload muhtamim photo";
            toast("error", apiMsg);
        } finally {
            setUploadingMuhtamimImg(false);
            e.target.value = "";
        }
    };

    const handleProjectImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        const idx = activeUploadProjectIdx;
        if (!rawFile || idx === null) return;

        if (!rawFile.type.startsWith('image/')) {
            toast("error", t("please_upload_valid_image") || "Please upload a valid image file");
            e.target.value = "";
            return;
        }

        try {
            setUploadingProjectIdx(idx);
            const file = await optimizeImageForUpload(rawFile);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("template", settings.website_template || "imadrasha");
            formData.append("section", "projects");

            let response;
            try {
                response = await api.post("system-setting/front-cms-settings/upload-image", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } catch (formErr: unknown) {
                console.warn("Project image upload fallback to base64:", formErr);
                const base64Data = await new Promise<string>((res, rej) => {
                    const r = new FileReader();
                    r.onload = () => res(r.result as string);
                    r.onerror = rej;
                    r.readAsDataURL(file);
                });
                response = await api.post("system-setting/front-cms-settings/upload-image", {
                    image_base64: base64Data,
                    template: settings.website_template || "imadrasha",
                    section: "projects",
                });
            }

            const uploadedUrl = response?.data?.data?.url || response?.data?.url;
            const targetFolder = response?.data?.data?.folder || `front_cms/${settings.website_template || "imadrasha"}/projects`;

            if (uploadedUrl) {
                updateProjectItem(idx, "image", uploadedUrl);
                updateProjectItem(idx, "image_url", uploadedUrl);
                toast("success", `${t("project_image_uploaded") || "Project image uploaded successfully"} (${targetFolder})`);
            } else {
                toast("error", response?.data?.message || t("failed_to_save"));
            }
        } catch (error: unknown) {
            console.error("Project image upload failed:", error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            const apiMsg = err?.response?.data?.message || err?.message || "Failed to upload project image";
            toast("error", apiMsg);
        } finally {
            setUploadingProjectIdx(null);
            setActiveUploadProjectIdx(null);
            e.target.value = "";
        }
    };

    const triggerProjectImageUpload = (idx: number) => {
        setActiveUploadProjectIdx(idx);
        projectImgInputRef.current?.click();
    };

    const updateNestedField = (section: "about_us", field: string, value: unknown) => {
        setSettings((prev) => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
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
                {["system", "social", "sections", "header_footer"].includes(activeTab) && (
                    <Button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 font-bold rounded-full shadow-md flex items-center gap-2 transition-all"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {t("save_all_changes")}
                    </Button>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="overflow-x-auto pb-1 -mx-2 px-2 scrollbar-thin">
                    <TabsList className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 h-11 p-1 gap-1.5 rounded-lg shadow-sm inline-flex w-auto min-w-full sm:min-w-0">
                        <TabsTrigger
                            value="system"
                            className="text-[11px] font-bold uppercase gap-2 px-5 whitespace-nowrap !text-gray-700 dark:!text-gray-200 hover:!text-gray-900 dark:hover:!text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF9800] data-[state=active]:to-[#6366F1] data-[state=active]:!text-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200 cursor-pointer"
                        >
                            <Globe size={15} className="stroke-[2.5px]" />
                            <span>{t("system_tab")}</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="sections"
                            className="text-[11px] font-bold uppercase gap-2 px-5 whitespace-nowrap !text-gray-700 dark:!text-gray-200 hover:!text-gray-900 dark:hover:!text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF9800] data-[state=active]:to-[#6366F1] data-[state=active]:!text-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200 cursor-pointer"
                        >
                            <LayoutPanelLeft size={15} className="stroke-[2.5px]" />
                            <span>{t("sections_tab")}</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="pages"
                            className="text-[11px] font-bold uppercase gap-2 px-5 whitespace-nowrap !text-gray-700 dark:!text-gray-200 hover:!text-gray-900 dark:hover:!text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF9800] data-[state=active]:to-[#6366F1] data-[state=active]:!text-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200 cursor-pointer"
                        >
                            <FileText size={15} className="stroke-[2.5px]" />
                            <span>{t("pages_tab")}</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="menus"
                            className="text-[11px] font-bold uppercase gap-2 px-5 whitespace-nowrap !text-gray-700 dark:!text-gray-200 hover:!text-gray-900 dark:hover:!text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF9800] data-[state=active]:to-[#6366F1] data-[state=active]:!text-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200 cursor-pointer"
                        >
                            <Menu size={15} className="stroke-[2.5px]" />
                            <span>{t("menus_tab")}</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="banners"
                            className="text-[11px] font-bold uppercase gap-2 px-5 whitespace-nowrap !text-gray-700 dark:!text-gray-200 hover:!text-gray-900 dark:hover:!text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF9800] data-[state=active]:to-[#6366F1] data-[state=active]:!text-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200 cursor-pointer"
                        >
                            <ImageIcon size={15} className="stroke-[2.5px]" />
                            <span>{t("banner_images_tab")}</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="social"
                            className="text-[11px] font-bold uppercase gap-2 px-5 whitespace-nowrap !text-gray-700 dark:!text-gray-200 hover:!text-gray-900 dark:hover:!text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF9800] data-[state=active]:to-[#6366F1] data-[state=active]:!text-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200 cursor-pointer"
                        >
                            <Share2 size={15} className="stroke-[2.5px]" />
                            <span>{t("social_links_tab")}</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="header_footer"
                            className="text-[11px] font-bold uppercase gap-2 px-5 whitespace-nowrap !text-gray-700 dark:!text-gray-200 hover:!text-gray-900 dark:hover:!text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF9800] data-[state=active]:to-[#6366F1] data-[state=active]:!text-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200 cursor-pointer"
                        >
                            <Code2 size={15} className="stroke-[2.5px]" />
                            <span>{t("tab_header_footer")}</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

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
                                        <Select 
                                            value={(settings.language === "bengali" || settings.language === "bangla") ? "bangla" : (settings.language || "english")} 
                                            onValueChange={(v) => setSettings({ ...settings, language: v })}
                                        >
                                            <SelectTrigger className="h-9 text-[11px] border-gray-200 shadow-none rounded-lg bg-gray-50/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="english">
                                                    <div className="flex items-center gap-2">
                                                        <span>🇬🇧</span>
                                                        <span>{t("english") || "English"}</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="bangla">
                                                    <div className="flex items-center gap-2">
                                                        <span>🇧🇩</span>
                                                        <span>{t("bangla") || "Bangla (বাংলা)"}</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4 flex items-center gap-1.5">
                                        <LayoutTemplate size={14} className="text-indigo-500" />
                                        {t("website_template")}
                                    </Label>
                                    <div className="md:col-span-8 space-y-1">
                                        <Select 
                                            value={settings.website_template || "ischool"} 
                                            onValueChange={async (val) => {
                                                await applyPreset(val);
                                                if (val === "ischool" || val === "imadrasha") {
                                                    setLogoTab(val);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-9 text-[11px] font-semibold border-gray-200 shadow-none rounded-lg bg-gray-50/50">
                                                <SelectValue placeholder={t("website_template")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ischool" className="text-[11px] py-1.5 cursor-pointer">
                                                    <div className="flex items-center gap-2">
                                                        <span>🏫</span>
                                                        <span className="font-semibold">{t("template_ischool")}</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="imadrasha" className="text-[11px] py-1.5 cursor-pointer">
                                                    <div className="flex items-center gap-2">
                                                        <span>🕌</span>
                                                        <span className="font-semibold">{t("template_imadrasha")}</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-gray-400">
                                            {settings.website_template === "imadrasha" ? (
                                                <span className="text-emerald-700 font-semibold">Active Template: iMadrasha (Islamic Madrasa layout)</span>
                                            ) : (
                                                <span className="text-indigo-700 font-semibold">Active Template: iSchool (Modern School layout)</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <div className="space-y-3">
                                        {/* Header bar with Brand Logo label and Template Switcher */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                                            <div className="space-y-0.5">
                                                <Label className="text-[11px] font-bold text-gray-700 uppercase tracking-tight flex items-center gap-1.5">
                                                    <ImageIcon size={13} className="text-indigo-500" />
                                                    <span>{t("brand_logo")}</span>
                                                </Label>
                                                <p className="text-[10px] text-gray-400 leading-tight">
                                                    {t("website_logo")} • <span className="text-gray-600 font-semibold uppercase">{logoTab}</span>
                                                </p>
                                            </div>

                                            {/* Template Switcher for Brand Logo */}
                                            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 text-[11px]">
                                                <button
                                                    type="button"
                                                    onClick={() => setLogoTab("ischool")}
                                                    className={cn(
                                                        "px-3 py-1 font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                                                        logoTab === "ischool" 
                                                            ? "bg-white text-[#6366F1] shadow-xs font-bold" 
                                                            : "text-gray-500 hover:text-gray-900"
                                                    )}
                                                >
                                                    <span>🏫</span>
                                                    <span>{t("ischool_website_logo")}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLogoTab("imadrasha")}
                                                    className={cn(
                                                        "px-3 py-1 font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                                                        logoTab === "imadrasha" 
                                                            ? "bg-white text-emerald-700 shadow-xs font-bold" 
                                                            : "text-gray-500 hover:text-gray-900"
                                                    )}
                                                >
                                                    <span>🕌</span>
                                                    <span>{t("madrasha_header_banner_logo")}</span>
                                                </button>
                                            </div>
                                        </div>

                                        {logoTab === "ischool" ? (
                                            /* 2-Card Horizontal Layout for iSchool: Live Preview & Adjustments (Left) + Upload & Guidelines (Right) */
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
                                                {/* Card 1 (Left): Live Preview & Dimension Controls */}
                                                <div className="p-3.5 rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/30 via-white to-purple-50/20 flex flex-col justify-between space-y-3 shadow-2xs">
                                                    {/* Header: Title & Reset */}
                                                    <div className="flex items-center justify-between border-b border-indigo-100/70 pb-2">
                                                        <span className="text-[11px] font-bold uppercase text-indigo-950 tracking-wider flex items-center gap-1.5">
                                                            <Eye size={13} className="text-indigo-600" />
                                                            <span>{t("live_preview")} ({t("header")})</span>
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                ischoolLogoRatioRef.current = 220 / 48;
                                                                setSettings((prev) => ({
                                                                    ...prev,
                                                                    header_footer_sections: {
                                                                        ...prev.header_footer_sections,
                                                                        ischool_logo_width: 220,
                                                                        ischool_logo_height: 48,
                                                                        ischool_logo_auto_ratio: true,
                                                                    }
                                                                }));
                                                            }}
                                                            className="h-6 text-[9.5px] font-bold text-gray-500 hover:text-indigo-600 hover:bg-white rounded px-2 flex items-center gap-1 cursor-pointer border border-transparent hover:border-gray-200 transition-all"
                                                            title="Reset to default dimensions (220×48 px)"
                                                        >
                                                            <RotateCcw size={11} /> {t("reset")}
                                                        </Button>
                                                    </div>

                                                    {/* Live Preview Container with dynamic header background */}
                                                    <div 
                                                        className="rounded-lg p-3 flex items-center justify-center relative overflow-hidden min-h-[90px] max-h-[200px] w-full transition-colors duration-200 border border-black/5 shadow-inner"
                                                        style={{
                                                            backgroundColor: (settings.header_footer_sections?.ischool_header_bg as string) || "#044E43",
                                                        }}
                                                    >
                                                        {settings.logo_preview ? (
                                                            <img 
                                                                src={settings.logo_preview} 
                                                                alt="iSchool Brand Logo" 
                                                                className="w-auto object-contain transition-all"
                                                                style={{
                                                                    maxHeight: `${Math.min(160, Number(settings.header_footer_sections?.ischool_logo_height) || 48)}px`,
                                                                    maxWidth: `${settings.header_footer_sections?.ischool_logo_width || 220}px`,
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="flex items-center gap-2.5 text-white">
                                                                <GraduationCap className="h-7 w-7 text-emerald-300" />
                                                                <div>
                                                                    <div className="text-xs font-black tracking-wide">EduEx LMS</div>
                                                                    <div className="text-[8px] font-semibold text-emerald-200">Education & LMS</div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Floating Dimension & Auto Badge */}
                                                        <div className="absolute bottom-1.5 right-2 flex items-center gap-1.5">
                                                            <span className={cn(
                                                                "text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded shadow-2xs transition-colors",
                                                                (settings.header_footer_sections?.ischool_logo_auto_ratio !== false)
                                                                    ? "bg-indigo-600/85 text-white"
                                                                    : "bg-amber-600/85 text-white"
                                                            )}>
                                                                {settings.header_footer_sections?.ischool_logo_auto_ratio !== false ? "Auto Ratio" : "Manual"}
                                                            </span>
                                                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-black/55 text-white font-medium backdrop-blur-xs shadow-2xs">
                                                                {(settings.header_footer_sections?.ischool_logo_width || 220)} × {(settings.header_footer_sections?.ischool_logo_height || 48)} px
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Logo Dimension Controls (Width & Height) */}
                                                    <div className="space-y-2 pt-1 border-t border-indigo-100/60">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[10.5px] uppercase tracking-wide">
                                                                <Sliders size={12} className="text-indigo-600" />
                                                                <span>{t("logo_adjust_controls")}</span>
                                                            </div>

                                                            {/* Auto Proportion Checkbox Toggle */}
                                                            <label 
                                                                className={cn(
                                                                    "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10.5px] font-bold cursor-pointer transition-all select-none shadow-2xs",
                                                                    (settings.header_footer_sections?.ischool_logo_auto_ratio !== false)
                                                                        ? "bg-indigo-50 text-indigo-900 border-indigo-300 hover:bg-indigo-100"
                                                                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                                                )}
                                                                title={t("auto_ratio_hint")}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={settings.header_footer_sections?.ischool_logo_auto_ratio !== false}
                                                                    onChange={(e) => {
                                                                        const isChecked = e.target.checked;
                                                                        if (isChecked) {
                                                                            const curW = Number(settings.header_footer_sections?.ischool_logo_width) || 220;
                                                                            const curH = Number(settings.header_footer_sections?.ischool_logo_height) || 48;
                                                                            if (curW > 0 && curH > 0) {
                                                                                ischoolLogoRatioRef.current = curW / curH;
                                                                            }
                                                                        }
                                                                        setSettings((prev) => ({
                                                                            ...prev,
                                                                            header_footer_sections: {
                                                                                ...prev.header_footer_sections,
                                                                                ischool_logo_auto_ratio: isChecked,
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 accent-indigo-600 cursor-pointer"
                                                                />
                                                                {settings.header_footer_sections?.ischool_logo_auto_ratio !== false ? (
                                                                    <Link2 size={11} className="text-indigo-600" />
                                                                ) : (
                                                                    <Unlink2 size={11} className="text-gray-400" />
                                                                )}
                                                                <span>{t("auto_proportion")}</span>
                                                            </label>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2.5">
                                                            {/* Width Field */}
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-[9.5px] font-bold uppercase text-gray-500 tracking-wide block truncate">
                                                                        {t("logo_width_px")}
                                                                    </Label>
                                                                    {settings.header_footer_sections?.ischool_logo_auto_ratio !== false && (
                                                                        <span className="text-[9px] text-indigo-600 font-semibold flex items-center gap-0.5">
                                                                            <Link2 size={9} /> Auto
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <Input
                                                                    type="number"
                                                                    min={30}
                                                                    max={2000}
                                                                    step={5}
                                                                    value={settings.header_footer_sections?.ischool_logo_width ?? 220}
                                                                    onChange={(e) => {
                                                                        const rawVal = e.target.value;
                                                                        if (rawVal === "") {
                                                                            setSettings((prev) => ({
                                                                                ...prev,
                                                                                header_footer_sections: { ...prev.header_footer_sections, ischool_logo_width: "" as unknown as number }
                                                                            }));
                                                                            return;
                                                                        }
                                                                        const val = Number(rawVal);
                                                                        if (isNaN(val)) return;

                                                                        const isAuto = settings.header_footer_sections?.ischool_logo_auto_ratio !== false;
                                                                        if (isAuto && val > 0) {
                                                                            const ratio = ischoolLogoRatioRef.current > 0 ? ischoolLogoRatioRef.current : (220 / 48);
                                                                            const computedHeight = Math.max(15, Math.round(val / ratio));
                                                                            setSettings((prev) => ({
                                                                                ...prev,
                                                                                header_footer_sections: {
                                                                                    ...prev.header_footer_sections,
                                                                                    ischool_logo_width: val,
                                                                                    ischool_logo_height: computedHeight,
                                                                                }
                                                                            }));
                                                                        } else {
                                                                            setSettings((prev) => ({
                                                                                ...prev,
                                                                                header_footer_sections: { ...prev.header_footer_sections, ischool_logo_width: val }
                                                                            }));
                                                                        }
                                                                    }}
                                                                    className="h-8.5 text-xs font-mono font-semibold bg-white border-gray-200 rounded-md focus-visible:ring-indigo-500"
                                                                    placeholder="220"
                                                                />
                                                            </div>

                                                            {/* Height Field */}
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-[9.5px] font-bold uppercase text-gray-500 tracking-wide block truncate">
                                                                        {t("logo_height_px")}
                                                                    </Label>
                                                                    {settings.header_footer_sections?.ischool_logo_auto_ratio !== false && (
                                                                        <span className="text-[9px] text-indigo-600 font-semibold flex items-center gap-0.5">
                                                                            <Link2 size={9} /> Auto
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <Input
                                                                    type="number"
                                                                    min={15}
                                                                    max={600}
                                                                    step={2}
                                                                    value={settings.header_footer_sections?.ischool_logo_height ?? 48}
                                                                    onChange={(e) => {
                                                                        const rawVal = e.target.value;
                                                                        if (rawVal === "") {
                                                                            setSettings((prev) => ({
                                                                                ...prev,
                                                                                header_footer_sections: { ...prev.header_footer_sections, ischool_logo_height: "" as unknown as number }
                                                                            }));
                                                                            return;
                                                                        }
                                                                        const val = Number(rawVal);
                                                                        if (isNaN(val)) return;

                                                                        const isAuto = settings.header_footer_sections?.ischool_logo_auto_ratio !== false;
                                                                        if (isAuto && val > 0) {
                                                                            const ratio = ischoolLogoRatioRef.current > 0 ? ischoolLogoRatioRef.current : (220 / 48);
                                                                            const computedWidth = Math.max(30, Math.round(val * ratio));
                                                                            setSettings((prev) => ({
                                                                                ...prev,
                                                                                header_footer_sections: {
                                                                                    ...prev.header_footer_sections,
                                                                                    ischool_logo_height: val,
                                                                                    ischool_logo_width: computedWidth,
                                                                                }
                                                                            }));
                                                                        } else {
                                                                            setSettings((prev) => ({
                                                                                ...prev,
                                                                                header_footer_sections: { ...prev.header_footer_sections, ischool_logo_height: val }
                                                                            }));
                                                                        }
                                                                    }}
                                                                    className="h-8.5 text-xs font-mono font-semibold bg-white border-gray-200 rounded-md focus-visible:ring-indigo-500"
                                                                    placeholder="48"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Status Hint */}
                                                        <div className="pt-0.5">
                                                            {settings.header_footer_sections?.ischool_logo_auto_ratio !== false ? (
                                                                <p className="text-[10px] text-indigo-700/90 font-medium flex items-center gap-1">
                                                                    <Sparkles size={11} className="text-indigo-600 shrink-0" />
                                                                    <span>{t("auto_ratio_hint")}</span>
                                                                </p>
                                                            ) : (
                                                                <p className="text-[10px] text-amber-700/90 font-medium flex items-center gap-1">
                                                                    <Info size={11} className="text-amber-600 shrink-0" />
                                                                    <span>{t("manual_dimensions")}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card 2 (Right): Upload Logo & Guidelines */}
                                                <div className="p-3.5 rounded-xl border border-gray-200/80 bg-white flex flex-col justify-between space-y-3 shadow-2xs">
                                                    {/* Header: Title & Format */}
                                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                        <span className="text-[11px] font-bold uppercase text-gray-700 tracking-wider flex items-center gap-1.5">
                                                            <Upload size={13} className="text-[#FF9800]" />
                                                            <span>{t("upload_logo")}</span>
                                                        </span>
                                                        <span className="text-[9.5px] text-gray-400 font-semibold px-2 py-0.5 rounded-full bg-gray-100">PNG / JPG</span>
                                                    </div>

                                                    {/* Upload Dropzone */}
                                                    <div
                                                        onClick={() => logoInputRef.current?.click()}
                                                        className="h-[90px] w-full border-2 border-dashed border-gray-200 hover:border-indigo-500 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/25 transition-all bg-gray-50/50 group px-3 text-center"
                                                    >
                                                        <div className="flex items-center gap-2.5 text-gray-500 group-hover:text-indigo-600 transition-colors">
                                                            <div className="h-8 w-8 rounded-full bg-white shadow-2xs border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <Upload className="h-4 w-4 text-indigo-600" />
                                                            </div>
                                                            <div className="text-left">
                                                                <span className="text-[11px] font-bold uppercase tracking-tight block text-gray-700 group-hover:text-indigo-700">
                                                                    {t("upload_logo")}
                                                                </span>
                                                                <span className="text-[9.5px] text-gray-400 font-normal">Click or drop image file</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <input type="file" ref={logoInputRef} hidden onChange={(e) => handleFileChange(e, "logo")} accept="image/*" />

                                                    {/* Specifications & Instructions */}
                                                    <div className="space-y-2 pt-1 border-t border-gray-100">
                                                        <div className="p-2 rounded-md bg-amber-50/70 border border-amber-200/60 flex items-start gap-1.5 text-[9.5px] text-amber-900 leading-tight">
                                                            <Sparkles size={13} className="text-amber-600 shrink-0 mt-0.5" />
                                                            <div>
                                                                <strong>Recommended:</strong> 250×60 to 368×75 px (PNG with transparent background)
                                                            </div>
                                                        </div>

                                                        <div className="p-2 rounded-md bg-indigo-50/40 border border-indigo-100/60 text-[9.5px] text-gray-600 leading-relaxed">
                                                            <p>Controls header logo dimensions on the iSchool public website.</p>
                                                            <p className="text-[9px] text-indigo-600 mt-0.5 font-medium">
                                                                {t("logo_dimensions_hint")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* 2-Card Horizontal Layout for iMadrasha */
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
                                                {/* Card 1 (Left): Live Preview & Banner Dimensions */}
                                                <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/30 via-white to-teal-50/20 flex flex-col justify-between space-y-3 shadow-2xs">
                                                    {/* Header: Title & Reset */}
                                                    <div className="flex items-center justify-between border-b border-emerald-100/70 pb-2">
                                                        <span className="text-[11px] font-bold uppercase text-emerald-950 tracking-wider flex items-center gap-1.5">
                                                            <Eye size={13} className="text-emerald-700" />
                                                            <span>{t("live_preview")} ({t("madrasha_header_banner_logo")})</span>
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                madrashaLogoRatioRef.current = 580 / 105;
                                                                setSettings((prev) => ({
                                                                    ...prev,
                                                                    header_footer_sections: {
                                                                        ...prev.header_footer_sections,
                                                                        madrasha_logo_width: 580,
                                                                        madrasha_logo_height: 105,
                                                                        madrasha_logo_auto_ratio: true,
                                                                    }
                                                                }));
                                                            }}
                                                            className="h-6 text-[9.5px] font-bold text-gray-500 hover:text-emerald-700 hover:bg-white rounded px-2 flex items-center gap-1 cursor-pointer border border-transparent hover:border-emerald-200 transition-all"
                                                            title="Reset to default dimensions (580×105 px)"
                                                        >
                                                            <RotateCcw size={11} /> {t("reset")}
                                                        </Button>
                                                    </div>

                                                    {/* Live Preview Container with dynamic header background */}
                                                    <div 
                                                        className="rounded-lg p-3 flex items-center justify-center relative overflow-hidden min-h-[105px] max-h-[260px] w-full transition-colors duration-200 border border-black/5 shadow-inner"
                                                        style={{
                                                            backgroundColor: (settings.header_footer_sections?.madrasha_header_bg as string) || "#014739",
                                                        }}
                                                    >
                                                        {settings.madrasha_logo_preview ? (
                                                            <img 
                                                                src={settings.madrasha_logo_preview} 
                                                                alt="Madrasa Header Banner" 
                                                                className="w-auto max-w-full object-contain transition-all"
                                                                style={{
                                                                    maxHeight: `${Math.min(230, Number(settings.header_footer_sections?.madrasha_logo_height) || 105)}px`,
                                                                    maxWidth: `${settings.header_footer_sections?.madrasha_logo_width || 580}px`,
                                                                }}
                                                            />
                                                        ) : (
                                                            <img 
                                                                src="/anwara-web-banner.png" 
                                                                alt="Default Banner" 
                                                                className="w-auto max-w-full object-contain opacity-90 transition-all"
                                                                style={{
                                                                    maxHeight: `${Math.min(230, Number(settings.header_footer_sections?.madrasha_logo_height) || 105)}px`,
                                                                    maxWidth: `${settings.header_footer_sections?.madrasha_logo_width || 580}px`,
                                                                }}
                                                            />
                                                        )}

                                                        {/* Floating Dimension & Auto Badge */}
                                                        <div className="absolute bottom-1.5 right-2 flex items-center gap-1.5">
                                                            <span className={cn(
                                                                "text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded shadow-2xs transition-colors",
                                                                (settings.header_footer_sections?.madrasha_logo_auto_ratio !== false)
                                                                    ? "bg-emerald-600/85 text-white"
                                                                    : "bg-amber-600/85 text-white"
                                                            )}>
                                                                {settings.header_footer_sections?.madrasha_logo_auto_ratio !== false ? "Auto Ratio" : "Manual"}
                                                            </span>
                                                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-black/55 text-white font-medium backdrop-blur-xs shadow-2xs">
                                                                {(settings.header_footer_sections?.madrasha_logo_width || 580)} × {(settings.header_footer_sections?.madrasha_logo_height || 105)} px
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Logo Dimension Controls (Width & Height) */}
                                                    <div className="space-y-2 pt-1 border-t border-emerald-100/60">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-[10.5px] uppercase tracking-wide">
                                                                <Sliders size={12} className="text-emerald-700" />
                                                                <span>{t("logo_adjust_controls")}</span>
                                                            </div>

                                                            {/* Auto Proportion Checkbox Toggle */}
                                                            <label 
                                                                className={cn(
                                                                    "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10.5px] font-bold cursor-pointer transition-all select-none shadow-2xs",
                                                                    (settings.header_footer_sections?.madrasha_logo_auto_ratio !== false)
                                                                        ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                                                                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                                                )}
                                                                title={t("auto_ratio_hint")}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={settings.header_footer_sections?.madrasha_logo_auto_ratio !== false}
                                                                    onChange={(e) => {
                                                                        const isChecked = e.target.checked;
                                                                        if (isChecked) {
                                                                            const curW = Number(settings.header_footer_sections?.madrasha_logo_width) || 580;
                                                                            const curH = Number(settings.header_footer_sections?.madrasha_logo_height) || 105;
                                                                            if (curW > 0 && curH > 0) {
                                                                                madrashaLogoRatioRef.current = curW / curH;
                                                                            }
                                                                        }
                                                                        setSettings((prev) => ({
                                                                            ...prev,
                                                                            header_footer_sections: {
                                                                                ...prev.header_footer_sections,
                                                                                madrasha_logo_auto_ratio: isChecked,
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 accent-emerald-600 cursor-pointer"
                                                                />
                                                                {settings.header_footer_sections?.madrasha_logo_auto_ratio !== false ? (
                                                                    <Link2 size={11} className="text-emerald-700" />
                                                                ) : (
                                                                    <Unlink2 size={11} className="text-gray-400" />
                                                                )}
                                                                <span>{t("auto_proportion")}</span>
                                                            </label>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2.5">
                                                            {/* Width Field */}
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-[9.5px] font-bold uppercase text-gray-500 tracking-wide block truncate">
                                                                        {t("logo_width_px")}
                                                                    </Label>
                                                                    {settings.header_footer_sections?.madrasha_logo_auto_ratio !== false && (
                                                                        <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
                                                                            <Link2 size={9} /> Auto
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <Input
                                                                    type="number"
                                                                    min={40}
                                                                    max={2500}
                                                                    step={5}
                                                                    value={settings.header_footer_sections?.madrasha_logo_width ?? 580}
                                                                    onChange={(e) => {
                                                                        const rawVal = e.target.value;
                                                                        if (rawVal === "") {
                                                                            setSettings((prev) => ({
                                                                                ...prev,
                                                                                header_footer_sections: { ...prev.header_footer_sections, madrasha_logo_width: "" as unknown as number }
                                                                            }));
                                                                            return;
                                                                        }
                                                                        const val = Number(rawVal);
                                                                        if (isNaN(val)) return;

                                                                        const isAuto = settings.header_footer_sections?.madrasha_logo_auto_ratio !== false;
                                                                        if (isAuto && val > 0) {
                                                                            const ratio = madrashaLogoRatioRef.current > 0 ? madrashaLogoRatioRef.current : (580 / 105);
                                                                            const computedHeight = Math.max(20, Math.round(val / ratio));
                                                                            setSettings((prev) => ({
                                                                                ...prev,
                                                                                header_footer_sections: {
                                                                                    ...prev.header_footer_sections,
                                                                                    madrasha_logo_width: val,
                                                                                    madrasha_logo_height: computedHeight,
                                                                                }
                                                                            }));
                                                                        } else {
                                                                            setSettings((prev) => ({
                                                                                ...prev,
                                                                                header_footer_sections: { ...prev.header_footer_sections, madrasha_logo_width: val }
                                                                            }));
                                                                        }
                                                                    }}
                                                                    className="h-8.5 text-xs font-mono font-semibold bg-white border-gray-200 rounded-md focus-visible:ring-emerald-500"
                                                                    placeholder="580"
                                                                />
                                                            </div>

                                                            {/* Height Field */}
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-[9.5px] font-bold uppercase text-gray-500 tracking-wide block truncate">
                                                                        {t("logo_height_px")}
                                                                    </Label>
                                                                    {settings.header_footer_sections?.madrasha_logo_auto_ratio !== false && (
                                                                        <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
                                                                            <Link2 size={9} /> Auto
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <Input
                                                                    type="number"
                                                                    min={20}
                                                                    max={800}
                                                                    step={2}
                                                                    value={settings.header_footer_sections?.madrasha_logo_height ?? 105}
                                                                    onChange={(e) => {
                                                                        const rawVal = e.target.value;
                                                                        if (rawVal === "") {
                                                                            setSettings((prev) => ({
                                                                                ...prev,
                                                                                header_footer_sections: { ...prev.header_footer_sections, madrasha_logo_height: "" as unknown as number }
                                                                            }));
                                                                            return;
                                                                        }
                                                                        const val = Number(rawVal);
                                                                        if (isNaN(val)) return;

                                                                        const isAuto = settings.header_footer_sections?.madrasha_logo_auto_ratio !== false;
                                                                        if (isAuto && val > 0) {
                                                                            const ratio = madrashaLogoRatioRef.current > 0 ? madrashaLogoRatioRef.current : (580 / 105);
                                                                            const computedWidth = Math.max(40, Math.round(val * ratio));
                                                                            setSettings((prev) => ({
                                                                                ...prev,
                                                                                header_footer_sections: {
                                                                                    ...prev.header_footer_sections,
                                                                                    madrasha_logo_height: val,
                                                                                    madrasha_logo_width: computedWidth,
                                                                                }
                                                                            }));
                                                                        } else {
                                                                            setSettings((prev) => ({
                                                                                ...prev,
                                                                                header_footer_sections: { ...prev.header_footer_sections, madrasha_logo_height: val }
                                                                            }));
                                                                        }
                                                                    }}
                                                                    className="h-8.5 text-xs font-mono font-semibold bg-white border-gray-200 rounded-md focus-visible:ring-emerald-500"
                                                                    placeholder="105"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Status Hint */}
                                                        <div className="pt-0.5">
                                                            {settings.header_footer_sections?.madrasha_logo_auto_ratio !== false ? (
                                                                <p className="text-[10px] text-emerald-700/90 font-medium flex items-center gap-1">
                                                                    <Sparkles size={11} className="text-emerald-600 shrink-0" />
                                                                    <span>{t("auto_ratio_hint")}</span>
                                                                </p>
                                                            ) : (
                                                                <p className="text-[10px] text-amber-700/90 font-medium flex items-center gap-1">
                                                                    <Info size={11} className="text-amber-600 shrink-0" />
                                                                    <span>{t("manual_dimensions")}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card 2 (Right): Upload Banner Logo & Guidelines */}
                                                <div className="p-3.5 rounded-xl border border-gray-200/80 bg-white flex flex-col justify-between space-y-3 shadow-2xs">
                                                    {/* Header: Title & Format */}
                                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                        <span className="text-[11px] font-bold uppercase text-gray-700 tracking-wider flex items-center gap-1.5">
                                                            <Upload size={13} className="text-emerald-700" />
                                                            <span>{t("upload_logo")}</span>
                                                        </span>
                                                        <span className="text-[9.5px] text-gray-400 font-semibold px-2 py-0.5 rounded-full bg-gray-100">PNG / JPG</span>
                                                    </div>

                                                    {/* Upload Dropzone */}
                                                    <div
                                                        onClick={() => madrashaLogoInputRef.current?.click()}
                                                        className="h-[90px] w-full border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50/25 transition-all bg-gray-50/50 group px-3 text-center"
                                                    >
                                                        <div className="flex items-center gap-2.5 text-gray-500 group-hover:text-emerald-700 transition-colors">
                                                            <div className="h-8 w-8 rounded-full bg-white shadow-2xs border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <Upload className="h-4 w-4 text-emerald-700" />
                                                            </div>
                                                            <div className="text-left">
                                                                <span className="text-[11px] font-bold uppercase tracking-tight block text-gray-700 group-hover:text-emerald-800">
                                                                    {t("upload_logo")}
                                                                </span>
                                                                <span className="text-[9.5px] text-gray-400 font-normal">Click or drop banner file</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <input type="file" ref={madrashaLogoInputRef} hidden onChange={(e) => handleFileChange(e, "madrasha_logo")} accept="image/*" />

                                                    {/* Specifications & Instructions */}
                                                    <div className="space-y-2 pt-1 border-t border-gray-100">
                                                        <div className="p-2 rounded-md bg-emerald-50/70 border border-emerald-200/60 flex items-start gap-1.5 text-[9.5px] text-emerald-900 leading-tight">
                                                            <Sparkles size={13} className="text-emerald-700 shrink-0 mt-0.5" />
                                                            <div>
                                                                <strong>Recommended:</strong> 580×100 to 640×120 px (Rendered compactly)
                                                            </div>
                                                        </div>

                                                        <div className="p-2 rounded-md bg-emerald-50/40 border border-emerald-100/60 text-[9.5px] text-gray-600 leading-relaxed">
                                                            <p>Controls banner max-width and height on medium & big screens on the iMadrasha public website.</p>
                                                            <p className="text-[9px] text-emerald-700 mt-0.5 font-medium">
                                                                {t("logo_dimensions_hint")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
                                        <Textarea value={settings.google_analytics} onChange={(e) => setSettings({ ...settings, google_analytics: e.target.value })} className="min-h-[100px] text-[10px] font-mono border-gray-200 shadow-none rounded-lg bg-gray-50/50" placeholder={t("paste_script_here_placeholder")} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight md:col-span-4 pt-2">{t("cookie_consent")}</Label>
                                    <div className="md:col-span-8">
                                        <Textarea value={settings.cookie_consent} onChange={(e) => setSettings({ ...settings, cookie_consent: e.target.value })} className="min-h-[70px] text-[11px] border-gray-200 shadow-none rounded-lg bg-gray-50/50" placeholder={t("cookie_usage_policy_placeholder")} />
                                    </div>
                                </div>

                                {/* RESTORED HEADER BACKGROUND COLOR CARD (WITHOUT TOPBAR) */}
                                <div className="p-4 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-3.5 relative overflow-hidden">
                                    <div className={cn(
                                        "absolute top-0 left-0 w-1 h-full transition-colors",
                                        headerTab === "imadrasha" ? "bg-emerald-600" : "bg-indigo-500"
                                    )} />

                                    {/* Card Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "h-6 w-6 rounded-md flex items-center justify-center text-white shadow-2xs transition-all",
                                                headerTab === "imadrasha"
                                                    ? "bg-emerald-600"
                                                    : "bg-gradient-to-br from-[#FF9800] to-[#6366F1]"
                                            )}>
                                                <Palette size={13} className="stroke-[2.5px]" />
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-800 uppercase tracking-tight">
                                                {headerTab === "imadrasha" ? t("madrasha_header_bg") : t("ischool_header_bg")}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Template Switcher Tabs */}
                                            <div className="inline-flex rounded-md border border-gray-200 bg-gray-50/80 p-0.5 text-[9.5px]">
                                                <button
                                                    type="button"
                                                    onClick={() => setHeaderTab("ischool")}
                                                    className={cn(
                                                        "px-2 py-0.5 font-semibold rounded transition-all cursor-pointer flex items-center gap-1",
                                                        headerTab === "ischool"
                                                            ? "bg-white text-indigo-700 shadow-2xs font-bold"
                                                            : "text-gray-500 hover:text-gray-900"
                                                    )}
                                                >
                                                    <span>🏫</span>
                                                    <span>{t("template_ischool")}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setHeaderTab("imadrasha")}
                                                    className={cn(
                                                        "px-2 py-0.5 font-semibold rounded transition-all cursor-pointer flex items-center gap-1",
                                                        headerTab === "imadrasha"
                                                            ? "bg-white text-emerald-700 shadow-2xs font-bold"
                                                            : "text-gray-500 hover:text-gray-900"
                                                    )}
                                                >
                                                    <span>🕌</span>
                                                    <span>{t("template_imadrasha")}</span>
                                                </button>
                                            </div>

                                            {/* Reset Button */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    if (headerTab === "imadrasha") {
                                                        setSettings((prev) => ({
                                                            ...prev,
                                                            header_footer_sections: {
                                                                ...prev.header_footer_sections,
                                                                madrasha_header_bg: "#014739",
                                                                madrasha_header_bg_enabled: true,
                                                                ...(prev.website_template === "imadrasha" ? { header_bg_enabled: true } : {}),
                                                            }
                                                        }));
                                                    } else {
                                                        setSettings((prev) => ({
                                                            ...prev,
                                                            header_footer_sections: {
                                                                ...prev.header_footer_sections,
                                                                ischool_header_bg: "#044E43",
                                                                ischool_header_bg_enabled: true,
                                                                ...(prev.website_template === "ischool" ? { header_bg_enabled: true } : {}),
                                                            }
                                                        }));
                                                    }
                                                    toast("success", "Header background color reset to default.");
                                                }}
                                                className="h-6 text-[9.5px] font-bold text-gray-500 hover:text-gray-800 rounded px-1.5 flex items-center gap-1 cursor-pointer"
                                                title="Reset to default color"
                                            >
                                                <RotateCcw size={10} /> {t("reset")}
                                            </Button>

                                            {/* Enable / Disable Switch */}
                                            <div className="flex items-center gap-1 pl-1.5 border-l border-gray-200">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {(headerTab === "imadrasha"
                                                        ? (settings.header_footer_sections?.madrasha_header_bg_enabled !== false)
                                                        : (settings.header_footer_sections?.ischool_header_bg_enabled !== false))
                                                        ? t("enabled")
                                                        : t("disabled")}
                                                </span>
                                                <Switch
                                                    checked={
                                                        headerTab === "imadrasha"
                                                            ? (settings.header_footer_sections?.madrasha_header_bg_enabled !== false)
                                                            : (settings.header_footer_sections?.ischool_header_bg_enabled !== false)
                                                    }
                                                    onCheckedChange={(val) => {
                                                        if (headerTab === "imadrasha") {
                                                            setSettings((prev) => ({
                                                                ...prev,
                                                                header_footer_sections: {
                                                                    ...prev.header_footer_sections,
                                                                    madrasha_header_bg_enabled: val,
                                                                    ...(prev.website_template === "imadrasha" ? { header_bg_enabled: val } : {}),
                                                                }
                                                            }));
                                                        } else {
                                                            setSettings((prev) => ({
                                                                ...prev,
                                                                header_footer_sections: {
                                                                    ...prev.header_footer_sections,
                                                                    ischool_header_bg_enabled: val,
                                                                    ...(prev.website_template === "ischool" ? { header_bg_enabled: val } : {}),
                                                                }
                                                            }));
                                                        }
                                                    }}
                                                    className={cn(
                                                        "scale-85 data-[state=checked]:bg-emerald-600",
                                                        headerTab === "ischool" && "data-[state=checked]:bg-indigo-600"
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Disabled State Banner */}
                                    {((headerTab === "imadrasha" && settings.header_footer_sections?.madrasha_header_bg_enabled === false) ||
                                      (headerTab === "ischool" && settings.header_footer_sections?.ischool_header_bg_enabled === false)) ? (
                                        <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/60 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 text-[10px] text-amber-800">
                                                <Info size={14} className="text-amber-600 shrink-0" />
                                                <span>{t("header_bg_disabled_notice")}</span>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => {
                                                    if (headerTab === "imadrasha") {
                                                        setSettings((prev) => ({
                                                            ...prev,
                                                            header_footer_sections: {
                                                                ...prev.header_footer_sections,
                                                                madrasha_header_bg_enabled: true,
                                                                ...(prev.website_template === "imadrasha" ? { header_bg_enabled: true } : {}),
                                                            }
                                                        }));
                                                    } else {
                                                        setSettings((prev) => ({
                                                            ...prev,
                                                            header_footer_sections: {
                                                                ...prev.header_footer_sections,
                                                                ischool_header_bg_enabled: true,
                                                                ...(prev.website_template === "ischool" ? { header_bg_enabled: true } : {}),
                                                            }
                                                        }));
                                                    }
                                                }}
                                                className="h-6 text-[9.5px] px-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold cursor-pointer"
                                            >
                                                {t("enabled")}
                                            </Button>
                                        </div>
                                    ) : (
                                        /* THE 3 MARKED CARDS */
                                        <div className="space-y-3">
                                            {/* Card 1: Click to pick color + Live Preview */}
                                            <div className={cn(
                                                "p-3 rounded-lg border flex flex-col gap-2.5",
                                                headerTab === "imadrasha" ? "border-emerald-200/80 bg-emerald-50/30" : "border-indigo-100 bg-indigo-50/20"
                                            )}>
                                                <div className="flex items-center justify-between">
                                                    <span className={cn(
                                                        "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                                                        headerTab === "imadrasha" ? "text-emerald-900" : "text-indigo-900"
                                                    )}>
                                                        <Pipette size={11} className={headerTab === "imadrasha" ? "text-emerald-700" : "text-indigo-600"} />
                                                        <span>{t("click_to_pick_color")}</span>
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border",
                                                        headerTab === "imadrasha" ? "bg-emerald-100/80 text-emerald-800 border-emerald-300" : "bg-indigo-100/80 text-indigo-800 border-indigo-300"
                                                    )}>
                                                        {headerTab === "imadrasha"
                                                            ? ((settings.header_footer_sections?.madrasha_header_bg as string) || "#014739").toUpperCase()
                                                            : ((settings.header_footer_sections?.ischool_header_bg as string) || "#044E43").toUpperCase()}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {/* Swatch button with hidden input */}
                                                    <label
                                                        className="h-8 w-10 rounded-md cursor-pointer flex items-center justify-center shadow-xs border border-white transition-transform hover:scale-105 active:scale-95 shrink-0 relative overflow-hidden"
                                                        style={{
                                                            backgroundColor: headerTab === "imadrasha"
                                                                ? ((settings.header_footer_sections?.madrasha_header_bg as string) || "#014739")
                                                                : ((settings.header_footer_sections?.ischool_header_bg as string) || "#044E43")
                                                        }}
                                                        title={t("click_to_pick_color")}
                                                    >
                                                        <input
                                                            type="color"
                                                            value={getSafePickerHex(
                                                                headerTab === "imadrasha"
                                                                    ? (settings.header_footer_sections?.madrasha_header_bg as string)
                                                                    : (settings.header_footer_sections?.ischool_header_bg as string),
                                                                headerTab === "imadrasha" ? "#014739" : "#044E43"
                                                            )}
                                                            onChange={(e) => handleColorHexChange(e.target.value, headerTab)}
                                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                                        />
                                                        <Pipette size={12} className="text-white drop-shadow-xs stroke-[2.5px]" />
                                                    </label>

                                                    <div className="flex-1">
                                                        <Input
                                                            type="text"
                                                            value={headerTab === "imadrasha"
                                                                ? ((settings.header_footer_sections?.madrasha_header_bg as string) || "#014739")
                                                                : ((settings.header_footer_sections?.ischool_header_bg as string) || "#044E43")}
                                                            onChange={(e) => handleColorHexChange(e.target.value, headerTab)}
                                                            className="h-8 text-[11px] font-mono uppercase bg-white border-gray-200 rounded-md"
                                                            placeholder={headerTab === "imadrasha" ? "#014739" : "#044E43"}
                                                        />
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => handleAddCustomPreset(
                                                            headerTab === "imadrasha"
                                                                ? (settings.header_footer_sections?.madrasha_header_bg as string)
                                                                : (settings.header_footer_sections?.ischool_header_bg as string),
                                                            headerTab
                                                        )}
                                                        className={cn(
                                                            "h-8 text-[10px] font-bold text-white rounded-md flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs",
                                                            headerTab === "imadrasha" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-gradient-to-r from-[#FF9800] to-[#6366F1]"
                                                        )}
                                                        title={t("add_preset_tooltip")}
                                                    >
                                                        <Plus size={11} strokeWidth={2.5} />
                                                        <span>{t("add_to_presets")}</span>
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Card 2: RECOMMENDED COLOR PRESETS */}
                                            <div className="p-3 rounded-lg border border-gray-150 bg-gray-50/50 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                        {t("recommended_color_presets")}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 font-mono">
                                                        {headerTab === "imadrasha"
                                                            ? ((settings.header_footer_sections?.madrasha_header_bg as string) || "#014739").toLowerCase()
                                                            : ((settings.header_footer_sections?.ischool_header_bg as string) || "#044E43").toLowerCase()}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-8 gap-1.5">
                                                    {(headerTab === "imadrasha" ? MADRASHA_COLOR_PRESETS : SCHOOL_COLOR_PRESETS).map((preset) => {
                                                        const current = headerTab === "imadrasha"
                                                            ? ((settings.header_footer_sections?.madrasha_header_bg as string) || "#014739").toLowerCase()
                                                            : ((settings.header_footer_sections?.ischool_header_bg as string) || "#044E43").toLowerCase();
                                                        const isSelected = current === preset.color.toLowerCase();
                                                        return (
                                                            <button
                                                                key={preset.color}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSettings((prev) => ({
                                                                        ...prev,
                                                                        header_footer_sections: {
                                                                            ...prev.header_footer_sections,
                                                                            [headerTab === "imadrasha" ? "madrasha_header_bg" : "ischool_header_bg"]: preset.color,
                                                                        }
                                                                    }));
                                                                }}
                                                                className={cn(
                                                                    "h-7 rounded-md border flex items-center justify-center transition-all cursor-pointer relative shadow-2xs hover:scale-110",
                                                                    isSelected ? "ring-2 ring-emerald-600 ring-offset-1 scale-105 border-white" : "border-white/80 hover:border-white"
                                                                )}
                                                                style={{ backgroundColor: preset.color }}
                                                                title={`${preset.name} (${preset.color})`}
                                                            >
                                                                {isSelected && (
                                                                    <Check className="h-3.5 w-3.5 text-white drop-shadow-md stroke-[3px]" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Card 3: CUSTOM PRESETS */}
                                            <div className="p-3 rounded-lg border border-gray-150 bg-gray-50/50 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                            {t("custom_presets")}
                                                        </span>
                                                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                                                            {((settings.header_footer_sections?.[headerTab === "imadrasha" ? "madrasha_custom_color_presets" : "ischool_custom_color_presets"] as string[]) || []).length}
                                                        </span>
                                                    </div>
                                                    {((settings.header_footer_sections?.[headerTab === "imadrasha" ? "madrasha_custom_color_presets" : "ischool_custom_color_presets"] as string[]) || []).length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleClearCustomPresets(headerTab)}
                                                            className="text-[9px] text-gray-400 hover:text-rose-600 transition-colors cursor-pointer font-medium"
                                                        >
                                                            {t("clear_all_presets")}
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {((settings.header_footer_sections?.[headerTab === "imadrasha" ? "madrasha_custom_color_presets" : "ischool_custom_color_presets"] as string[]) || []).map((colorHex) => {
                                                        const current = headerTab === "imadrasha"
                                                            ? ((settings.header_footer_sections?.madrasha_header_bg as string) || "#014739").toLowerCase()
                                                            : ((settings.header_footer_sections?.ischool_header_bg as string) || "#044E43").toLowerCase();
                                                        const isSelected = current === colorHex.toLowerCase();
                                                        return (
                                                            <div key={colorHex} className="relative group">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSettings((prev) => ({
                                                                            ...prev,
                                                                            header_footer_sections: {
                                                                                ...prev.header_footer_sections,
                                                                                [headerTab === "imadrasha" ? "madrasha_header_bg" : "ischool_header_bg"]: colorHex,
                                                                            }
                                                                        }));
                                                                    }}
                                                                    className={cn(
                                                                        "h-7 w-7 rounded-md border flex items-center justify-center transition-all cursor-pointer relative shadow-2xs hover:scale-110",
                                                                        isSelected ? "ring-2 ring-emerald-600 ring-offset-1 scale-105 border-white" : "border-white/80 hover:border-white"
                                                                    )}
                                                                    style={{ backgroundColor: colorHex }}
                                                                    title={`Custom Preset: ${colorHex}`}
                                                                >
                                                                    {isSelected && (
                                                                        <Check className="h-3 w-3 text-white drop-shadow-md stroke-[3px]" />
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleRemoveCustomPreset(colorHex, headerTab, e)}
                                                                    title="Remove preset"
                                                                    className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                                                >
                                                                    <X size={8} strokeWidth={3} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}

                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddCustomPreset(
                                                            headerTab === "imadrasha"
                                                                ? (settings.header_footer_sections?.madrasha_header_bg as string)
                                                                : (settings.header_footer_sections?.ischool_header_bg as string),
                                                            headerTab
                                                        )}
                                                        className="h-7 px-2 rounded-md border border-dashed border-gray-300 hover:border-emerald-500 bg-white/80 hover:bg-emerald-50/50 flex items-center gap-1 text-[9.5px] font-bold text-gray-600 hover:text-emerald-700 transition-all cursor-pointer shadow-2xs"
                                                    >
                                                        <Plus size={10} strokeWidth={2.5} />
                                                        <span>{t("add_current_color")}</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="text-[9.5px] text-gray-400 italic">
                                                {headerTab === "imadrasha"
                                                    ? "Live preview on the left dynamically reflects this background color. Changes apply to the header banner and topbar on the iMadrasha public website."
                                                    : "Controls the header logo background color on the iSchool public website. Live preview on the left dynamically reflects this color."}
                                            </p>
                                        </div>
                                    )}
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
                                            settings.current_theme === theme.id ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white" : "bg-gray-50 text-gray-400"
                                        )}>{t(`theme_${theme.id}`) || theme.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* SECTIONS TAB */}
                <TabsContent value="sections" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">

                    {/* Active Template Design Indicator & Preset Sync Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{settings.website_template === "imadrasha" ? "🕌" : "🏫"}</span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                                        {settings.website_template === "imadrasha" ? "iMadrasha Template Sections" : "iSchool Template Sections"}
                                    </h3>
                                    <span className={cn(
                                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest",
                                        settings.website_template === "imadrasha" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                    )}>
                                        Active: {settings.website_template === "imadrasha" ? "iMadrasha" : "iSchool"}
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                    {settings.website_template === "imadrasha"
                                        ? "মাদরাসা ওয়েবসাইটের জন্য বিশেষায়িত সেকশনসমূহ কনফিগারেশন"
                                        : "Configure sections and educational content for iSchool template"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyPreset(settings.website_template, true)}
                                className="h-8 text-[11px] font-bold rounded-lg border-gray-200 hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                title="Reset section contents to template default design preset"
                            >
                                <RotateCcw size={13} className="text-gray-500" />
                                <span>{t("apply_template_preset")}</span>
                            </Button>
                        </div>
                    </div>

                    {/* SECTION VISIBILITY & DRAG-AND-DROP ORDER MANAGER */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Sliders size={18} className="stroke-[2.5px]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">
                                        {t("section_order_manager")}
                                    </h3>
                                    <p className="text-[11px] text-gray-500">
                                        {t("drag_to_reorder_sections")}
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={resetSectionOrder}
                                className="h-8 text-[11px] font-bold rounded-lg border-gray-200 hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
                            >
                                <RotateCcw size={12} className="text-gray-500" />
                                <span>{t("reset_order")}</span>
                            </Button>
                        </div>

                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="sections-dnd-list">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-2.5"
                                    >
                                        {getFilteredSectionOrder().map((sectionId, index) => {
                                            const def = ALL_SECTION_DEFS.find((d) => d.id === sectionId);
                                            if (!def) return null;
                                            const isEnabled = settings.header_footer_sections?.[def.enabledKey] !== false;
                                            const isMadrasha = settings.website_template === "imadrasha";
                                            const meta = getSectionMeta(sectionId, isMadrasha);

                                            return (
                                                <Draggable key={sectionId} draggableId={sectionId} index={index}>
                                                    {(dragProvided, dragSnapshot) => (
                                                        <div
                                                            ref={dragProvided.innerRef}
                                                            {...dragProvided.draggableProps}
                                                            className={cn(
                                                                "flex items-center justify-between p-3 rounded-lg border text-xs transition-all select-none",
                                                                dragSnapshot.isDragging
                                                                    ? "bg-indigo-50/90 border-indigo-300 shadow-md ring-2 ring-indigo-400/20"
                                                                    : isEnabled
                                                                        ? "bg-white border-gray-200 hover:border-gray-300 shadow-2xs"
                                                                        : "bg-gray-50/70 border-gray-200/60 opacity-60"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div
                                                                    {...dragProvided.dragHandleProps}
                                                                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-indigo-600 p-1 -m-1"
                                                                    title="Drag with mouse to reorder"
                                                                >
                                                                    <GripVertical size={16} />
                                                                </div>
                                                                <span className="h-5 w-5 rounded-full bg-gray-100 text-gray-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                                                                    {index + 1}
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <span className="font-semibold text-gray-800 truncate block">
                                                                        {meta.name}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                                                <span className={cn(
                                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                                                    isEnabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                                                                )}>
                                                                    {isEnabled ? t("on") : t("off")}
                                                                </span>
                                                                <Switch
                                                                    checked={isEnabled}
                                                                    onCheckedChange={(v) => toggleSectionEnabled(def.enabledKey, v)}
                                                                    className="data-[state=checked]:bg-emerald-600"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>

                    {/* TOPBAR CONTACT INFORMATION (UNIVERSAL: ISCHOOL & IMADRASHA) */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                        <div className={cn(
                            "absolute top-0 left-0 w-1 h-full",
                            settings.website_template === "imadrasha" ? "bg-amber-500" : "bg-indigo-500"
                        )} />
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-xs",
                                    settings.website_template === "imadrasha"
                                        ? "bg-amber-500"
                                        : "bg-gradient-to-br from-[#FF9800] to-[#6366F1]"
                                )}>
                                    <PhoneCall size={18} className="stroke-[2.5px]" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t("topbar_contact_info")}</h2>
                                    <p className="text-[11px] text-gray-500">
                                        {settings.website_template === "imadrasha"
                                            ? "মাদরাসা ওয়েবসাইটের শীর্ষভাগে যোগাযোগের ফোন নম্বর, ইমেইল ও ক্যাম্পাস ঠিকানা কনফিগারেশন"
                                            : "স্কুল ওয়েবসাইটের শীর্ষভাগে যোগাযোগের ফোন নম্বর, ইমেইল ও ক্যাম্পাস ঠিকানা কনফিগারেশন"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {settings.header_footer_sections?.topbar_enabled !== false ? t("enabled") : t("disabled")}
                                </span>
                                <Switch
                                    checked={settings.header_footer_sections?.topbar_enabled !== false}
                                    onCheckedChange={(v) => setSettings({
                                        ...settings,
                                        header_footer_sections: {
                                            ...settings.header_footer_sections,
                                            topbar_enabled: v,
                                        }
                                    })}
                                    className={cn(
                                        settings.website_template === "imadrasha"
                                            ? "data-[state=checked]:bg-amber-500"
                                            : "data-[state=checked]:bg-indigo-600"
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-gray-600 tracking-wide">
                                        {settings.website_template === "imadrasha" ? t("madrasha_phone_numbers") : "ফোন নম্বর / Phone Number(s)"}
                                    </Label>
                                    <Input
                                        type="text"
                                        value={
                                            (settings.website_template === "imadrasha"
                                                ? (settings.header_footer_sections?.madrasa_phone as string)
                                                : (settings.header_footer_sections?.school_phone as string)) ??
                                            (settings.website_template === "imadrasha" ? "+8801719606713" : "+8801851046320")
                                        }
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const field = settings.website_template === "imadrasha" ? "madrasa_phone" : "school_phone";
                                            setSettings((prev) => ({
                                                ...prev,
                                                header_footer_sections: {
                                                    ...prev.header_footer_sections,
                                                    [field]: val,
                                                }
                                            }));
                                        }}
                                        className="h-9 text-xs bg-white border-gray-200 rounded-lg shadow-2xs"
                                        placeholder={settings.website_template === "imadrasha" ? "+8801719606713, +8801812345678" : "+8801851046320"}
                                    />
                                    <p className="text-[9.5px] text-gray-400">Multiple phone numbers separated by comma</p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-gray-600 tracking-wide">
                                        {settings.website_template === "imadrasha" ? t("madrasha_email_addresses") : "ইমেইল ঠিকানা / Official Email Address(es)"}
                                    </Label>
                                    <Input
                                        type="text"
                                        value={
                                            (settings.website_template === "imadrasha"
                                                ? (settings.header_footer_sections?.madrasa_email as string)
                                                : (settings.header_footer_sections?.school_email as string)) ??
                                            (settings.website_template === "imadrasha" ? "anwarabegumgirlsmadrasa@gmail.com" : "smartideasbd24@gmail.com")
                                        }
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const field = settings.website_template === "imadrasha" ? "madrasa_email" : "school_email";
                                            setSettings((prev) => ({
                                                ...prev,
                                                header_footer_sections: {
                                                    ...prev.header_footer_sections,
                                                    [field]: val,
                                                }
                                            }));
                                        }}
                                        className="h-9 text-xs bg-white border-gray-200 rounded-lg shadow-2xs"
                                        placeholder={settings.website_template === "imadrasha" ? "info@madrasa.edu, admissions@madrasa.edu" : "smartideasbd24@gmail.com"}
                                    />
                                    <p className="text-[9.5px] text-gray-400">Multiple email addresses separated by comma</p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-gray-600 tracking-wide">
                                    {settings.website_template === "imadrasha" ? t("madrasha_address") : "ক্যাম্পাস ঠিকানা / Campus Address"}
                                </Label>
                                <Input
                                    type="text"
                                    value={
                                        (settings.website_template === "imadrasha"
                                            ? (settings.header_footer_sections?.madrasa_address as string)
                                            : (settings.header_footer_sections?.school_address as string)) ??
                                        (settings.website_template === "imadrasha"
                                            ? "১২ নং গিয়াসনগর ইউনিয়ন, মোহাম্মদপুর, মৌলভীবাজার সদর, মৌলভীবাজার"
                                            : "House#68, Road#10, Sector#10, Uttara Model Town, Dhaka-1230")
                                    }
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const field = settings.website_template === "imadrasha" ? "madrasa_address" : "school_address";
                                        setSettings((prev) => ({
                                            ...prev,
                                            header_footer_sections: {
                                                ...prev.header_footer_sections,
                                                [field]: val,
                                            }
                                        }));
                                    }}
                                    className="h-9 text-xs bg-white border-gray-200 rounded-lg shadow-2xs"
                                    placeholder={settings.website_template === "imadrasha" ? "মাদ্রাসার পূর্ণাঙ্গ ঠিকানা লিখুন" : "House#68, Road#10, Sector#10, Uttara Model Town, Dhaka-1230"}
                                />
                                <p className="text-[9.5px] text-amber-700/90 leading-tight">
                                    Supports multiple phone numbers, multiple email IDs (separated by comma), and long addresses with smooth horizontal scrolling on desktop and mobile.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* HERO BANNER & MAIN TITLE */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full" />
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <ImageIcon size={18} className="stroke-[2.5px]" />
                                </div>
                                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t("hero_banner_main_title")}</h2>
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
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("background_image_url")}</Label>
                                        <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <span>📁</span> front_cms/{settings.website_template || "ischool"}/hero
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={settings.header_footer_sections?.hero_background || ""} 
                                            onChange={(e) => setSettings({ 
                                                ...settings, 
                                                header_footer_sections: { 
                                                    ...settings.header_footer_sections, 
                                                    hero_background: e.target.value 
                                                } 
                                            })} 
                                            className="h-9 text-[11px] rounded-lg bg-gray-50/30 flex-1" 
                                            placeholder="https://... or click Upload Image" 
                                        />
                                        <input
                                            ref={heroBgInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleHeroBackgroundUpload}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={uploadingHeroBg}
                                            onClick={() => heroBgInputRef.current?.click()}
                                            className="h-9 px-3 text-[11px] font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 border-indigo-200 rounded-lg flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                                        >
                                            {uploadingHeroBg ? (
                                                <>
                                                    <Loader2 size={13} className="animate-spin text-indigo-600" />
                                                    <span>{t("uploading_image")}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={13} className="stroke-[2.5px] text-indigo-600" />
                                                    <span>{t("upload_background_image")}</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Live Preview Card */}
                                    {settings.header_footer_sections?.hero_background ? (
                                        <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-slate-900 shadow-sm group mt-2">
                                            <div className="h-28 w-full relative">
                                                <img 
                                                    src={resolveCmsImgUrl(settings.header_footer_sections.hero_background)} 
                                                    className="h-full w-full object-cover opacity-80 group-hover:opacity-95 transition-opacity" 
                                                    alt="Hero Background Preview" 
                                                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-hero.jpg" }} 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                                            </div>

                                            {/* Overlay Toolbar */}
                                            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => heroBgInputRef.current?.click()}
                                                    disabled={uploadingHeroBg}
                                                    className="h-7 px-2.5 text-[10px] font-bold bg-white/90 hover:bg-white text-gray-800 shadow-sm rounded-md gap-1 cursor-pointer"
                                                >
                                                    <Upload size={11} />
                                                    <span>{t("change_background")}</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="destructive"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        header_footer_sections: {
                                                            ...prev.header_footer_sections,
                                                            hero_background: ""
                                                        }
                                                    }))}
                                                    className="h-7 w-7 bg-rose-600/90 hover:bg-rose-600 text-white shadow-sm rounded-md cursor-pointer"
                                                    title={t("remove_image")}
                                                >
                                                    <Trash2 size={12} />
                                                </Button>
                                            </div>

                                            {/* Bottom info pill */}
                                            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-white/90 font-medium pointer-events-none">
                                                <span className="truncate max-w-[280px] drop-shadow-sm font-mono text-[9px]">
                                                    {settings.header_footer_sections.hero_background}
                                                </span>
                                                <span className="bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shrink-0 text-emerald-300 border border-white/10">
                                                    {settings.website_template || "ischool"}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => heroBgInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl p-4 text-center cursor-pointer bg-gray-50/40 hover:bg-indigo-50/20 transition-all flex flex-col items-center justify-center gap-1.5 mt-2"
                                        >
                                            <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <ImageIcon size={16} />
                                            </div>
                                            <p className="text-[11px] font-bold text-gray-700">
                                                {t("upload_background_image")}
                                            </p>
                                            <p className="text-[9px] text-gray-400">
                                                PNG, JPG, WebP up to 10MB • Saved to <span className="font-mono text-indigo-600">front_cms/{settings.website_template || "ischool"}/hero</span>
                                            </p>
                                        </div>
                                    )}

                                    {/* Quick Presets for Current Template */}
                                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Presets:</span>
                                        {settings.website_template === "imadrasha" ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        header_footer_sections: {
                                                            ...prev.header_footer_sections,
                                                            hero_background: "/madrasha/dawra-daras.jpg"
                                                        }
                                                    }))}
                                                    className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer"
                                                >
                                                    মাদরাসা দরস ও ক্যাম্পাস
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        header_footer_sections: {
                                                            ...prev.header_footer_sections,
                                                            hero_background: "/madrasha/events-5-300x300.jpg"
                                                        }
                                                    }))}
                                                    className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer"
                                                >
                                                    ইসলামিক শিক্ষাঙ্গন
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        header_footer_sections: {
                                                            ...prev.header_footer_sections,
                                                            hero_background: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?q=80&w=2070&auto=format&fit=crop"
                                                        }
                                                    }))}
                                                    className="text-[9px] font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer"
                                                >
                                                    Modern Campus (Classroom)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        header_footer_sections: {
                                                            ...prev.header_footer_sections,
                                                            hero_background: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2070&auto=format&fit=crop"
                                                        }
                                                    }))}
                                                    className="text-[9px] font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer"
                                                >
                                                    University / Academy Hall
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        header_footer_sections: {
                                                            ...prev.header_footer_sections,
                                                            hero_background: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
                                                        }
                                                    }))}
                                                    className="text-[9px] font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer"
                                                >
                                                    Students &amp; Graduation
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("badge_text")}</Label>
                                    <Input value={settings.header_footer_sections?.header_text || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, header_text: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder={t("admissions_open_sample_placeholder")} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("title_part_1_before_highlight")}</Label>
                                    <Input value={settings.header_footer_sections?.hero_title_part1 || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_title_part1: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder={t("empowering_sample_placeholder")} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("title_highlighted_word")}</Label>
                                    <Input value={settings.header_footer_sections?.hero_title_highlight || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_title_highlight: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder={t("minds_sample_placeholder")} />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("title_part_2_after_highlight")}</Label>
                                    <Input value={settings.header_footer_sections?.hero_title_part2 || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_title_part2: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder={t("shaping_sample_placeholder")} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("title_gradient_word")}</Label>
                                    <Input value={settings.header_footer_sections?.hero_title_gradient || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_title_gradient: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder={t("futures_sample_placeholder")} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("subtitle_description")}</Label>
                                    <Textarea value={settings.header_footer_sections?.hero_subtitle || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_subtitle: e.target.value } })} className="min-h-[80px] text-[11px] rounded-lg bg-gray-50/30" placeholder={t("hero_description_placeholder")} />
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("button_1_text")}</Label>
                                        <Input value={settings.header_footer_sections?.hero_btn1_text || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_btn1_text: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder={t("apply_for_admission_sample")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("button_1_link")}</Label>
                                        <Input value={settings.header_footer_sections?.hero_btn1_link || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_btn1_link: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="/online_admission" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("button_2_text")}</Label>
                                        <Input value={settings.header_footer_sections?.hero_btn2_text || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_btn2_text: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder={t("take_a_tour_sample")} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("button_2_link")}</Label>
                                        <Input value={settings.header_footer_sections?.hero_btn2_link || ""} onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, hero_btn2_link: e.target.value } })} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="#" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-full" />
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Info size={18} className="stroke-[2.5px]" />
                                </div>
                                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t("about_us_section_settings")}</h2>
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
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_badge_small_heading")}</Label>
                                    <Input value={settings.about_us?.section_title || ""} onChange={(e) => updateNestedField("about_us", "section_title", e.target.value)} className="h-10 text-[12px] font-medium rounded-lg bg-gray-50/30" placeholder={t("welcome_to_school_placeholder")} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("main_headline_title")}</Label>
                                    <Input value={settings.about_us?.title || ""} onChange={(e) => updateNestedField("about_us", "title", e.target.value)} className="h-10 text-[12px] font-medium rounded-lg bg-gray-50/30" placeholder={t("empowering_minds_sample_placeholder")} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("description_narrative")}</Label>
                                    <Textarea value={settings.about_us?.description || ""} onChange={(e) => updateNestedField("about_us", "description", e.target.value)} className="min-h-[140px] text-[11px] leading-relaxed rounded-lg bg-gray-50/30" placeholder={t("main_description_placeholder")} />
                                </div>
                                {/* Campus Showcase Card Settings (for imadrasha) vs Standard School (for ischool) */}
                                {settings.website_template === "imadrasha" ? (
                                    <div className="p-5 rounded-xl border border-emerald-100 bg-emerald-50/20 space-y-4">
                                        <div className="flex items-center gap-2.5 border-b border-emerald-100 pb-2.5">
                                            <span className="text-lg">🕌</span>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-tight">{t("campus_feature_card_settings")}</h4>
                                                <p className="text-[10px] text-gray-400">ডানপাশের ক্যাম্পাস ফিচার ও পরিচিতি কার্ড (&quot;আদর্শ ইসলামী নারী গড়ার অনন্য জামিয়া&quot;)</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2 md:col-span-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("left_side_main_image_url")}</Label>
                                                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        <span>📁</span> front_cms/{settings.website_template || "imadrasha"}/about
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Input 
                                                        value={settings.about_us?.image_url || ""} 
                                                        onChange={(e) => {
                                                            updateNestedField("about_us", "image_url", e.target.value);
                                                            updateNestedField("about_us", "image", e.target.value);
                                                        }} 
                                                        className="h-9 text-[11px] rounded-lg bg-white border-gray-200 flex-1" 
                                                        placeholder="https://... বা /madrasha/dawra-daras.jpg" 
                                                    />
                                                    <input
                                                        ref={aboutImageInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleAboutImageUpload}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        disabled={uploadingAboutImg}
                                                        onClick={() => aboutImageInputRef.current?.click()}
                                                        className="h-9 px-3 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 rounded-lg flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                                                    >
                                                        {uploadingAboutImg ? (
                                                            <>
                                                                <Loader2 size={13} className="animate-spin text-emerald-600" />
                                                                <span>{t("uploading_image")}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload size={13} className="stroke-[2.5px] text-emerald-600" />
                                                                <span>{t("upload_main_image")}</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                {/* Live Preview Card */}
                                                {settings.about_us?.image_url && (
                                                    <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-slate-900 shadow-sm group mt-2 max-w-sm">
                                                        <div className="h-28 w-full relative">
                                                            <img 
                                                                src={resolveCmsImgUrl(settings.about_us.image_url)} 
                                                                className="h-full w-full object-cover opacity-85 group-hover:opacity-95 transition-opacity" 
                                                                alt="About Us Main Preview" 
                                                                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-about.jpg" }} 
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                                                        </div>

                                                        {/* Overlay Toolbar */}
                                                        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => aboutImageInputRef.current?.click()}
                                                                disabled={uploadingAboutImg}
                                                                className="h-7 px-2.5 text-[10px] font-bold bg-white/90 hover:bg-white text-gray-800 shadow-sm rounded-md gap-1 cursor-pointer"
                                                            >
                                                                <Upload size={11} />
                                                                <span>{t("change_background")}</span>
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="destructive"
                                                                onClick={() => {
                                                                    updateNestedField("about_us", "image_url", "");
                                                                    updateNestedField("about_us", "image", "");
                                                                }}
                                                                className="h-7 w-7 bg-rose-600/90 hover:bg-rose-600 text-white shadow-sm rounded-md cursor-pointer"
                                                                title={t("remove_image")}
                                                            >
                                                                <Trash2 size={12} />
                                                            </Button>
                                                        </div>

                                                        {/* Bottom info pill */}
                                                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-white/90 font-medium pointer-events-none">
                                                            <span className="truncate max-w-[200px] drop-shadow-sm font-mono text-[9px]">
                                                                {settings.about_us.image_url}
                                                            </span>
                                                            <span className="bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shrink-0 text-emerald-300 border border-white/10">
                                                                Preview
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("card_badge")}</Label>
                                                <Input 
                                                    value={settings.about_us?.card_badge || ""} 
                                                    onChange={(e) => updateNestedField("about_us", "card_badge", e.target.value)} 
                                                    className="h-9 text-[11px] rounded-lg bg-white border-gray-200" 
                                                    placeholder="ঐতিহ্যের দ্বীনি শিক্ষাঙ্গন • স্থাপিত ২০০৩" 
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("card_title")}</Label>
                                                <Input 
                                                    value={settings.about_us?.card_title || ""} 
                                                    onChange={(e) => updateNestedField("about_us", "card_title", e.target.value)} 
                                                    className="h-9 text-[11px] rounded-lg bg-white border-gray-200 font-semibold" 
                                                    placeholder="আদর্শ ইসলামী নারী গড়ার অনন্য জামিয়া" 
                                                />
                                            </div>

                                            <div className="space-y-1.5 md:col-span-2">
                                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("card_description")}</Label>
                                                <Textarea 
                                                    value={settings.about_us?.card_description || ""} 
                                                    onChange={(e) => updateNestedField("about_us", "card_description", e.target.value)} 
                                                    className="min-h-[70px] text-[11px] rounded-lg bg-white border-gray-200 leading-relaxed" 
                                                    placeholder="সম্পূর্ণ শরিয়তসম্মত শালীন পর্দা, অভিজ্ঞ শিক্ষিকাবৃন্দের যত্ন এবং আধুনিক তথ্যপ্রযুক্তির সমন্বয়ে গড়ে উঠেছে আমাদের এই শিক্ষাঙ্গন।" 
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("card_contact_text")}</Label>
                                                <Input 
                                                    value={settings.about_us?.card_contact_text || ""} 
                                                    onChange={(e) => updateNestedField("about_us", "card_contact_text", e.target.value)} 
                                                    className="h-9 text-[11px] rounded-lg bg-white border-gray-200" 
                                                    placeholder="ভর্তি সংক্রান্ত যেকোনো তথ্যে যোগাযোগ করুন" 
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("card_btn_text")}</Label>
                                                    <Input 
                                                        value={settings.about_us?.card_btn_text || ""} 
                                                        onChange={(e) => updateNestedField("about_us", "card_btn_text", e.target.value)} 
                                                        className="h-9 text-[11px] rounded-lg bg-white border-gray-200" 
                                                        placeholder="ভর্তি নির্দেশিকা" 
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("card_btn_url")}</Label>
                                                    <Input 
                                                        value={settings.about_us?.card_btn_url || ""} 
                                                        onChange={(e) => updateNestedField("about_us", "card_btn_url", e.target.value)} 
                                                        className="h-9 text-[11px] rounded-lg bg-white border-gray-200" 
                                                        placeholder="/online_admission" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("left_side_main_image_url")}</Label>
                                                <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    <span>📁</span> front_cms/{settings.website_template || "ischool"}/about
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Input 
                                                    value={settings.about_us?.image_url || ""} 
                                                    onChange={(e) => {
                                                        updateNestedField("about_us", "image_url", e.target.value);
                                                        updateNestedField("about_us", "image", e.target.value);
                                                    }} 
                                                    className="h-9 text-[11px] rounded-lg bg-gray-50/30 flex-1" 
                                                    placeholder="https://... or click Upload Image" 
                                                />
                                                <input
                                                    ref={aboutImageInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleAboutImageUpload}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={uploadingAboutImg}
                                                    onClick={() => aboutImageInputRef.current?.click()}
                                                    className="h-9 px-3 text-[11px] font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 border-indigo-200 rounded-lg flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                                                >
                                                    {uploadingAboutImg ? (
                                                        <>
                                                            <Loader2 size={13} className="animate-spin text-indigo-600" />
                                                            <span>{t("uploading_image")}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload size={13} className="stroke-[2.5px] text-indigo-600" />
                                                            <span>{t("upload_main_image")}</span>
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            {/* Live Preview Card */}
                                            {settings.about_us?.image_url && (
                                                <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-slate-900 shadow-sm group mt-2 max-w-sm">
                                                    <div className="h-28 w-full relative">
                                                        <img 
                                                            src={resolveCmsImgUrl(settings.about_us.image_url)} 
                                                            className="h-full w-full object-cover opacity-85 group-hover:opacity-95 transition-opacity" 
                                                            alt="About Us Main Preview" 
                                                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-about.jpg" }} 
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                                                    </div>

                                                    {/* Overlay Toolbar */}
                                                    <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => aboutImageInputRef.current?.click()}
                                                            disabled={uploadingAboutImg}
                                                            className="h-7 px-2.5 text-[10px] font-bold bg-white/90 hover:bg-white text-gray-800 shadow-sm rounded-md gap-1 cursor-pointer"
                                                        >
                                                            <Upload size={11} />
                                                            <span>{t("change_background")}</span>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="destructive"
                                                            onClick={() => {
                                                                updateNestedField("about_us", "image_url", "");
                                                                updateNestedField("about_us", "image", "");
                                                            }}
                                                            className="h-7 w-7 bg-rose-600/90 hover:bg-rose-600 text-white shadow-sm rounded-md cursor-pointer"
                                                            title={t("remove_image")}
                                                        >
                                                            <Trash2 size={12} />
                                                        </Button>
                                                    </div>

                                                    {/* Bottom info pill */}
                                                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-white/90 font-medium pointer-events-none">
                                                        <span className="truncate max-w-[200px] drop-shadow-sm font-mono text-[9px]">
                                                            {settings.about_us.image_url}
                                                        </span>
                                                        <span className="bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider shrink-0 text-emerald-300 border border-white/10">
                                                            Preview
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("experience_years_badge")}</Label>
                                                <Input value={settings.about_us?.experience_years || ""} onChange={(e) => updateNestedField("about_us", "experience_years", e.target.value)} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder="25+" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("experience_label")}</Label>
                                                <Input value={settings.about_us?.experience_label || ""} onChange={(e) => updateNestedField("about_us", "experience_label", e.target.value)} className="h-9 text-[11px] rounded-lg bg-gray-50/30" placeholder={t("years_of_educational_excellence_placeholder")} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Key Highlights / Bullet Points */}
                                <div className="pt-4 border-t border-gray-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t("key_highlights_bullet_points")}</h4>
                                        <span className="text-[9px] text-gray-400 font-medium">{t("displayed_with_checkmarks_desc")}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("bullet_point_1")}</Label>
                                            <Input
                                                value={settings.about_us?.bullet_point_1 ?? ""}
                                                onChange={(e) => updateNestedField("about_us", "bullet_point_1", e.target.value)}
                                                className="h-9 text-[11px] rounded-lg bg-gray-50/30"
                                                placeholder={t("innovative_stem_placeholder")}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("bullet_point_2")}</Label>
                                            <Input
                                                value={settings.about_us?.bullet_point_2 ?? ""}
                                                onChange={(e) => updateNestedField("about_us", "bullet_point_2", e.target.value)}
                                                className="h-9 text-[11px] rounded-lg bg-gray-50/30"
                                                placeholder={t("personalized_mentorship_placeholder")}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("bullet_point_3")}</Label>
                                            <Input
                                                value={settings.about_us?.bullet_point_3 ?? ""}
                                                onChange={(e) => updateNestedField("about_us", "bullet_point_3", e.target.value)}
                                                className="h-9 text-[11px] rounded-lg bg-gray-50/30"
                                                placeholder={t("global_ethical_values_placeholder")}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("bullet_point_4")}</Label>
                                            <Input
                                                value={settings.about_us?.bullet_point_4 ?? ""}
                                                onChange={(e) => updateNestedField("about_us", "bullet_point_4", e.target.value)}
                                                className="h-9 text-[11px] rounded-lg bg-gray-50/30"
                                                placeholder={t("comprehensive_sports_arts_placeholder")}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Mission, Vision, Core Values (Omitted for imadrasha template) */}
                                {(settings.website_template !== "imadrasha" && settings.header_footer_sections?.website_template !== "imadrasha") && (
                                    <div className="pt-4 border-t border-gray-100 space-y-4">
                                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t("mission_vision_values")}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("mission_title_text")}</Label>
                                                <Input value={settings.about_us?.mission_title || ""} onChange={(e) => updateNestedField("about_us", "mission_title", e.target.value)} className="h-8 text-[11px] font-bold rounded-lg bg-gray-50/30" placeholder={t("our_mission_placeholder")} />
                                                <Textarea value={settings.about_us?.mission_description || ""} onChange={(e) => updateNestedField("about_us", "mission_description", e.target.value)} className="min-h-[80px] text-[11px] rounded-lg bg-gray-50/30" placeholder={t("mission_details_placeholder")} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("vision_title_text")}</Label>
                                                <Input value={settings.about_us?.vision_title || ""} onChange={(e) => updateNestedField("about_us", "vision_title", e.target.value)} className="h-8 text-[11px] font-bold rounded-lg bg-gray-50/30" placeholder={t("our_vision_placeholder")} />
                                                <Textarea value={settings.about_us?.vision_description || ""} onChange={(e) => updateNestedField("about_us", "vision_description", e.target.value)} className="min-h-[80px] text-[11px] rounded-lg bg-gray-50/30" placeholder={t("vision_details_placeholder")} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("core_values_title_text")}</Label>
                                                <Input value={settings.about_us?.values_title || ""} onChange={(e) => updateNestedField("about_us", "values_title", e.target.value)} className="h-8 text-[11px] font-bold rounded-lg bg-gray-50/30" placeholder={t("our_core_values_placeholder")} />
                                                <Textarea value={settings.about_us?.values_description || ""} onChange={(e) => updateNestedField("about_us", "values_description", e.target.value)} className="min-h-[80px] text-[11px] rounded-lg bg-gray-50/30" placeholder={t("values_details_placeholder")} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dedicated Standalone Card: Educational Pillars (Feature Cards) / মাদরাসার বৈশিষ্ট্যসমূহ */}
                    {settings.website_template === "imadrasha" && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <Sparkles size={18} className="stroke-[2.5px]" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t("educational_pillars_cards")}</h2>
                                    <p className="text-[10px] text-gray-400">মাদরাসার বৈশিষ্ট্যসমূহ / Educational Pillars (Feature Cards)</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        {settings.header_footer_sections?.features_enabled !== false ? t("enabled") : t("disabled")}
                                    </span>
                                    <Switch
                                        checked={settings.header_footer_sections?.features_enabled !== false}
                                        onCheckedChange={(v) => setSettings({
                                            ...settings,
                                            header_footer_sections: { ...settings.header_footer_sections, features_enabled: v }
                                        })}
                                        className="data-[state=checked]:bg-emerald-500"
                                    />
                                </div>
                                <Button 
                                    type="button"
                                    onClick={() => {
                                        const currentAccordions = [...(settings.about_us?.accordions || [])];
                                        currentAccordions.push({ id: Date.now(), title: "", content: "" });
                                        updateNestedField("about_us", "accordions", currentAccordions);
                                    }} 
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-5 h-8 font-bold rounded-full shadow-md flex items-center gap-2"
                                >
                                    <Plus size={14} className="stroke-[3px]" /> {t("add_item")}
                                </Button>
                            </div>
                        </div>

                        {/* Section Small Badge, Heading H1, Subtitle */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-2">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_badge_small_heading")}</Label>
                                <Input 
                                    value={settings.header_footer_sections?.features_section_badge || settings.about_us?.accordions_badge || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSettings((prev) => ({
                                            ...prev,
                                            header_footer_sections: { ...prev.header_footer_sections, features_section_badge: val },
                                            about_us: { ...prev.about_us, accordions_badge: val }
                                        }));
                                    }}
                                    className="h-9 text-[11px] rounded-lg bg-gray-50/30 font-medium"
                                    placeholder="সুশৃঙ্খল পরিবেশ"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_heading_h1")}</Label>
                                <Input 
                                    value={settings.header_footer_sections?.features_section_title || settings.about_us?.accordions_title || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSettings((prev) => ({
                                            ...prev,
                                            header_footer_sections: { ...prev.header_footer_sections, features_section_title: val },
                                            about_us: { ...prev.about_us, accordions_title: val }
                                        }));
                                    }}
                                    className="h-9 text-[11px] rounded-lg bg-gray-50/30 font-medium"
                                    placeholder="মাদরাসার বৈশিষ্ট্যসমূহ"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_subtitle")}</Label>
                                <Input 
                                    value={settings.header_footer_sections?.features_section_subtitle || settings.about_us?.accordions_subtitle || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSettings((prev) => ({
                                            ...prev,
                                            header_footer_sections: { ...prev.header_footer_sections, features_section_subtitle: val },
                                            about_us: { ...prev.about_us, accordions_subtitle: val }
                                        }));
                                    }}
                                    className="h-9 text-[11px] rounded-lg bg-gray-50/30"
                                    placeholder="দ্বীনি অনুশাসন ও খাঁটি আদর্শে পরিচালিত এক অনুপম দ্বীনি পরিবেশ..."
                                />
                            </div>
                        </div>

                        {/* Accordion Items List */}
                        <div className="space-y-3">
                            {(settings.about_us?.accordions || []).map((acc: AccordionItem, idx: number) => (
                                <div key={acc.id || idx} className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 space-y-3 relative group hover:border-emerald-200 hover:bg-white transition-all">
                                    <Button 
                                        type="button"
                                        size="icon" 
                                        onClick={() => {
                                            const currentList = (settings.about_us?.accordions || []).filter((_, i) => i !== idx);
                                            updateNestedField("about_us", "accordions", currentList);
                                        }} 
                                        className="absolute top-3 right-3 h-7 w-7 bg-red-500 text-white rounded-[8px] shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 border-0 cursor-pointer"
                                    >
                                        <Trash2 size={13} />
                                    </Button>
                                    <div className="space-y-2 pr-8">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                #{idx + 1}
                                            </span>
                                            <Input 
                                                value={acc.title} 
                                                onChange={(e) => {
                                                    const updated = (settings.about_us?.accordions || []).map((item: AccordionItem, i: number) => 
                                                        i === idx ? { ...item, title: e.target.value } : item
                                                    );
                                                    updateNestedField("about_us", "accordions", updated);
                                                }} 
                                                className="h-8 text-[11px] font-bold bg-white border-gray-200 rounded-lg flex-1" 
                                                placeholder={t("accordion_title_placeholder")} 
                                            />
                                        </div>
                                        <Textarea 
                                            value={acc.content} 
                                            onChange={(e) => {
                                                const updated = (settings.about_us?.accordions || []).map((item: AccordionItem, i: number) => 
                                                    i === idx ? { ...item, content: e.target.value } : item
                                                );
                                                updateNestedField("about_us", "accordions", updated);
                                            }} 
                                            className="min-h-[64px] text-[11px] bg-white border-gray-200 rounded-lg leading-relaxed" 
                                            placeholder={t("accordion_content_placeholder")} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* Dedicated Ongoing Projects & Future Plans Section (for imadrasha template) */}
                    {settings.website_template === "imadrasha" && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 bg-emerald-600 h-full" />
                            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <LayoutTemplate size={18} className="stroke-[2.5px]" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t("projects_section_settings")}</h2>
                                        <p className="text-[10px] text-gray-400">নির্মাণাধীন প্রজেক্ট ও ভবিষ্যৎ পরিকল্পনা / Ongoing Projects &amp; Future Plans</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        {settings.header_footer_sections?.projects_enabled !== false ? t("enabled") : t("disabled")}
                                    </span>
                                    <Switch
                                        checked={settings.header_footer_sections?.projects_enabled !== false}
                                        onCheckedChange={(v) => setSettings({
                                            ...settings,
                                            header_footer_sections: { ...settings.header_footer_sections, projects_enabled: v }
                                        })}
                                        className="data-[state=checked]:bg-emerald-600"
                                    />
                                </div>
                            </div>

                            {/* Section Header Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-2">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_badge_small_heading")}</Label>
                                    <Input 
                                        value={(settings.header_footer_sections?.projects_section_badge as string) || (settings.about_us?.projects_section_badge as string) || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSettings((prev) => ({
                                                ...prev,
                                                header_footer_sections: { ...prev.header_footer_sections, projects_section_badge: val },
                                                about_us: { ...prev.about_us, projects_section_badge: val }
                                            }));
                                        }}
                                        className="h-9 text-[11px] rounded-lg bg-gray-50/30 font-medium"
                                        placeholder="অগ্রযাত্রা ও ভবিষ্যৎ"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_heading_h1")}</Label>
                                    <Input 
                                        value={(settings.header_footer_sections?.projects_section_title as string) || (settings.about_us?.projects_section_title as string) || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSettings((prev) => ({
                                                ...prev,
                                                header_footer_sections: { ...prev.header_footer_sections, projects_section_title: val },
                                                about_us: { ...prev.about_us, projects_section_title: val }
                                            }));
                                        }}
                                        className="h-9 text-[11px] rounded-lg bg-gray-50/30 font-medium"
                                        placeholder="নির্মাণাধীন প্রজেক্ট ও পরিকল্পনা"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_subtitle")}</Label>
                                    <Input 
                                        value={(settings.header_footer_sections?.projects_section_subtitle as string) || (settings.about_us?.projects_section_subtitle as string) || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSettings((prev) => ({
                                                ...prev,
                                                header_footer_sections: { ...prev.header_footer_sections, projects_section_subtitle: val },
                                                about_us: { ...prev.about_us, projects_section_subtitle: val }
                                            }));
                                        }}
                                        className="h-9 text-[11px] rounded-lg bg-gray-50/30"
                                        placeholder="মাদ্রাসার অবকাঠামোগত উন্নয়ন, বহুতল ভবন নির্মাণ ও ভবিষ্যৎ সম্প্রসারণের ধারাবাহিক পরিকল্পনা।"
                                    />
                                </div>
                            </div>

                            {/* Project Items CRUD Section */}
                            <div className="pt-4 border-t border-gray-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">{t("project_items")}</h3>
                                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                                            {getProjectsList().length}
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addProjectItem}
                                        className="h-8 px-3 text-xs font-semibold bg-[#014739] hover:bg-[#01352A] text-white rounded-lg shadow-2xs gap-1.5 cursor-pointer"
                                    >
                                        <Plus size={14} />
                                        {t("add_project")}
                                    </Button>
                                </div>

                                {getProjectsList().length === 0 ? (
                                    <div className="text-center py-8 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                        <LayoutTemplate className="mx-auto h-8 w-8 text-gray-400 mb-2 stroke-[1.5px]" />
                                        <p className="text-xs text-gray-500 font-medium">{t("no_projects_added")}</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => updateProjectsList(DEFAULT_MADRASHA_PROJECTS)}
                                            className="mt-3 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                                        >
                                            লোড ডিফল্ট প্রজেক্ট (Load Default Projects)
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {getProjectsList().map((proj, idx) => (
                                            <div key={proj.id || idx} className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 hover:border-emerald-300 transition-all space-y-3 relative group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-6 w-6 rounded-md bg-white border border-gray-200 text-[11px] font-bold text-gray-600 flex items-center justify-center shadow-2xs">
                                                            #{idx + 1}
                                                        </span>
                                                        <span className={cn("text-[10px] font-bold text-white px-2.5 py-0.5 rounded shadow-2xs", proj.badge_bg || "bg-amber-500")}>
                                                            {proj.status || "চলমান"}
                                                        </span>
                                                        <span className="text-xs font-bold text-gray-800 truncate max-w-[200px] sm:max-w-xs">
                                                            {proj.title || "নতুন প্রজেক্ট"}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeProjectItem(idx)}
                                                        className="h-7 w-7 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                                                    <div className="sm:col-span-6 space-y-1">
                                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">{t("project_title")}</Label>
                                                        <Input
                                                            value={proj.title || ""}
                                                            onChange={(e) => updateProjectItem(idx, "title", e.target.value)}
                                                            placeholder="প্রজেক্ট শিরোনাম (যেমন: মাদ্রাসার বহুতল ভবন নির্মাণ)"
                                                            className="h-8 text-xs bg-white rounded-lg"
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-3 space-y-1">
                                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">{t("project_status")}</Label>
                                                        <Input
                                                            value={proj.status || ""}
                                                            onChange={(e) => updateProjectItem(idx, "status", e.target.value)}
                                                            placeholder="যেমন: চলমান, পরিকল্পনা, প্রকাশনা"
                                                            className="h-8 text-xs bg-white rounded-lg"
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-3 space-y-1">
                                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">{t("project_badge_color")}</Label>
                                                        <Select
                                                            value={proj.badge_bg || "bg-amber-500"}
                                                            onValueChange={(val) => updateProjectItem(idx, "badge_bg", val)}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs bg-white rounded-lg">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="bg-amber-500">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                                                        <span>Amber (চলমান)</span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="bg-[#014739]">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="h-2.5 w-2.5 rounded-full bg-[#014739]" />
                                                                        <span>Forest Green (পরিকল্পনা)</span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="bg-emerald-600">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                                                                        <span>Emerald (প্রকাশনা)</span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="bg-blue-600">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                                                                        <span>Blue (নতুন)</span>
                                                                    </div>
                                                                </SelectItem>
                                                                <SelectItem value="bg-rose-600">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
                                                                        <span>Rose (জরুরি)</span>
                                                                    </div>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                                                            <span>{t("project_image")}</span>
                                                            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                <span>📁</span> front_cms/{settings.website_template || "imadrasha"}/projects
                                                            </span>
                                                        </Label>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] text-gray-400 mr-1">ডিফল্ট ছবি:</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    updateProjectItem(idx, "image", "/madrasha/Building-under-construction.jpg");
                                                                    updateProjectItem(idx, "image_url", "/madrasha/Building-under-construction.jpg");
                                                                }}
                                                                className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 cursor-pointer shadow-2xs"
                                                            >
                                                                ভবন
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    updateProjectItem(idx, "image", "/madrasha/dawra-daras.jpg");
                                                                    updateProjectItem(idx, "image_url", "/madrasha/dawra-daras.jpg");
                                                                }}
                                                                className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 cursor-pointer shadow-2xs"
                                                            >
                                                                দরস
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    updateProjectItem(idx, "image", "/madrasha/hdiya-prodan.jpg");
                                                                    updateProjectItem(idx, "image_url", "/madrasha/hdiya-prodan.jpg");
                                                                }}
                                                                className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 cursor-pointer shadow-2xs"
                                                            >
                                                                হাদিয়া
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Input
                                                            value={proj.image || ""}
                                                            onChange={(e) => {
                                                                updateProjectItem(idx, "image", e.target.value);
                                                                updateProjectItem(idx, "image_url", e.target.value);
                                                            }}
                                                            placeholder="/madrasha/Building-under-construction.jpg বা https://..."
                                                            className="h-8 text-xs bg-white rounded-lg flex-1"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            disabled={uploadingProjectIdx === idx}
                                                            onClick={() => triggerProjectImageUpload(idx)}
                                                            className="h-8 px-3 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 rounded-lg flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                                                        >
                                                            {uploadingProjectIdx === idx ? (
                                                                <>
                                                                    <Loader2 size={13} className="animate-spin text-emerald-600" />
                                                                    <span>{t("uploading_project_image")}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Upload size={13} className="stroke-[2.5px] text-emerald-600" />
                                                                    <span>{t("upload_project_image")}</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>

                                                    {/* Project Image Live Preview & Action Card */}
                                                    {proj.image && (
                                                        <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-slate-900 shadow-sm group/thumb max-w-sm mt-1">
                                                            <div className="h-28 w-full relative">
                                                                <img
                                                                    src={resolveCmsImgUrl(proj.image)}
                                                                    alt={proj.title || "Project Preview"}
                                                                    className="h-full w-full object-cover opacity-85 group-hover/thumb:opacity-95 transition-opacity"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = "/madrasha/Building-under-construction.jpg";
                                                                    }}
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                                                            </div>

                                                            {/* Overlay Toolbar */}
                                                            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover/thumb:opacity-100 transition-opacity">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    onClick={() => triggerProjectImageUpload(idx)}
                                                                    disabled={uploadingProjectIdx === idx}
                                                                    className="h-6 px-2 text-[10px] font-bold bg-white/95 hover:bg-white text-gray-800 shadow-xs rounded-md gap-1 cursor-pointer"
                                                                >
                                                                    <Upload size={10} />
                                                                    <span>{t("change_photo")}</span>
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="icon"
                                                                    variant="destructive"
                                                                    onClick={() => {
                                                                        updateProjectItem(idx, "image", "");
                                                                        updateProjectItem(idx, "image_url", "");
                                                                    }}
                                                                    className="h-6 w-6 bg-rose-600/90 hover:bg-rose-600 text-white shadow-xs rounded-md cursor-pointer"
                                                                    title={t("remove_photo")}
                                                                >
                                                                    <Trash2 size={11} />
                                                                </Button>
                                                            </div>

                                                            <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] text-white/90">
                                                                <span className="truncate max-w-[200px]">{proj.image}</span>
                                                                <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold text-white", proj.badge_bg || "bg-amber-500")}>
                                                                    {proj.status || "চলমান"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">{t("project_description")}</Label>
                                                    <Textarea
                                                        value={proj.description || ""}
                                                        onChange={(e) => updateProjectItem(idx, "description", e.target.value)}
                                                        rows={2}
                                                        placeholder="প্রজেক্টের বিবরণ..."
                                                        className="text-xs bg-white rounded-lg min-h-[60px]"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <input
                                    ref={projectImgInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleProjectImageFileChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* Dedicated Principal / Muhtamim Speech Section (Universal: iSchool & iMadrasha) */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                        <div className={cn(
                            "absolute top-0 left-0 w-1 h-full",
                            settings.website_template === "imadrasha" ? "bg-amber-500" : "bg-gradient-to-b from-[#FF9800] to-[#6366F1]"
                        )} />
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-xs",
                                    settings.website_template === "imadrasha"
                                        ? "bg-amber-500"
                                        : "bg-gradient-to-br from-[#FF9800] to-[#6366F1]"
                                )}>
                                    <Quote size={18} className="stroke-[2.5px]" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t("muhtamim_section_settings")}</h2>
                                    <p className="text-[10px] text-gray-500">
                                        {settings.website_template === "imadrasha"
                                            ? "মুহতামিম সাহেবের দিকনির্দেশনামূলক নসিহত ও বাণী"
                                            : "স্কুল অধ্যক্ষের দিকনির্দেশনামূলক বক্তব্য ও বাণী / Principal's Speech & Guidance Message"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {settings.header_footer_sections?.muhtamim_enabled !== false ? t("enabled") : t("disabled")}
                                </span>
                                <Switch
                                    checked={settings.header_footer_sections?.muhtamim_enabled !== false}
                                    onCheckedChange={(v) => setSettings({
                                        ...settings,
                                        header_footer_sections: { ...settings.header_footer_sections, muhtamim_enabled: v }
                                    })}
                                    className={cn(
                                        settings.website_template === "imadrasha"
                                            ? "data-[state=checked]:bg-amber-500"
                                            : "data-[state=checked]:bg-indigo-600"
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">{t("muhtamim_name")}</Label>
                                    <Input
                                        value={(settings.about_us?.muhtamim_name as string) || ""}
                                        onChange={(e) => updateNestedField("about_us", "muhtamim_name", e.target.value)}
                                        className="h-9 text-[11px] font-bold rounded-lg bg-gray-50/30"
                                        placeholder={settings.website_template === "imadrasha" ? "শায়খ মাওলানা মুজিবুর রহমান মুজাহিদ" : "Dr. Mohammad Rafiqul Islam / Principal's Name"}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">{t("muhtamim_designation")}</Label>
                                    <Input
                                        value={(settings.about_us?.muhtamim_designation as string) || ""}
                                        onChange={(e) => updateNestedField("about_us", "muhtamim_designation", e.target.value)}
                                        className="h-9 text-[11px] rounded-lg bg-gray-50/30 font-medium"
                                        placeholder={settings.website_template === "imadrasha" ? "মুহতামিম ও শায়খুল হাদিস" : "Principal & Head of Institution"}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">{t("muhtamim_photo")}</Label>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => updateNestedField(
                                                    "about_us",
                                                    "muhtamim_image",
                                                    settings.website_template === "imadrasha"
                                                        ? "/madrasha/muhtamim-anwara.jpg"
                                                        : "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80"
                                                )}
                                                className={cn(
                                                    "text-[9px] px-2 py-0.5 rounded font-medium cursor-pointer shadow-2xs transition-colors",
                                                    settings.website_template === "imadrasha"
                                                        ? "bg-amber-50/60 hover:bg-amber-100 border border-amber-200 text-amber-900"
                                                        : "bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 text-indigo-900"
                                                )}
                                            >
                                                {settings.website_template === "imadrasha" ? "ডিফল্ট ছবি" : "Default Photo"}
                                            </button>
                                            <span className={cn(
                                                "text-[9px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border",
                                                settings.website_template === "imadrasha"
                                                    ? "text-amber-700 bg-amber-50 border-amber-200"
                                                    : "text-indigo-700 bg-indigo-50 border-indigo-200"
                                            )}>
                                                <span>📁</span> front_cms/{settings.website_template || "ischool"}/principal
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            value={(settings.about_us?.muhtamim_image as string) || ""}
                                            onChange={(e) => updateNestedField("about_us", "muhtamim_image", e.target.value)}
                                            className="h-9 text-[11px] rounded-lg bg-gray-50/30 flex-1"
                                            placeholder={settings.website_template === "imadrasha" ? "/madrasha/muhtamim-anwara.jpg বা https://..." : "https://... or upload photo"}
                                        />
                                        <input
                                            ref={muhtamimImgInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleMuhtamimImageUpload}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={uploadingMuhtamimImg}
                                            onClick={() => muhtamimImgInputRef.current?.click()}
                                            className={cn(
                                                "h-9 px-3 text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer",
                                                settings.website_template === "imadrasha"
                                                    ? "text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-200"
                                                    : "text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 border-none"
                                            )}
                                        >
                                            {uploadingMuhtamimImg ? (
                                                <>
                                                    <Loader2 size={13} className={cn("animate-spin", settings.website_template === "imadrasha" ? "text-amber-600" : "text-white")} />
                                                    <span>{t("uploading_muhtamim_photo")}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={13} className={cn("stroke-[2.5px]", settings.website_template === "imadrasha" ? "text-amber-600" : "text-white")} />
                                                    <span>{settings.website_template === "imadrasha" ? t("upload_muhtamim_photo") : "Upload Photo"}</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {/* Live Preview Card */}
                                    {settings.about_us?.muhtamim_image && (
                                        <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-slate-900 shadow-sm group/muhtamim mt-2 max-w-sm">
                                            <div className="h-28 w-full relative flex items-center justify-center bg-slate-900">
                                                <img
                                                    src={resolveCmsImgUrl(settings.about_us.muhtamim_image as string)}
                                                    className="h-full w-full object-cover opacity-85 group-hover/muhtamim:opacity-95 transition-opacity"
                                                    alt="Principal Preview"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = settings.website_template === "imadrasha"
                                                            ? "/madrasha/muhtamim-anwara.jpg"
                                                            : "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80";
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                                                <div className="absolute bottom-2 left-3 flex items-center gap-2 pointer-events-none">
                                                    <div className={cn(
                                                        "h-9 w-9 rounded-full overflow-hidden border-2 shrink-0 shadow",
                                                        settings.website_template === "imadrasha" ? "border-amber-400" : "border-[#FF9800]"
                                                    )}>
                                                        <img
                                                            src={resolveCmsImgUrl(settings.about_us.muhtamim_image as string)}
                                                            className="h-full w-full object-cover"
                                                            alt=""
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = settings.website_template === "imadrasha"
                                                                    ? "/madrasha/muhtamim-anwara.jpg"
                                                                    : "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80";
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-white drop-shadow">
                                                        {(settings.about_us?.muhtamim_name as string) || (settings.website_template === "imadrasha" ? "মুহতামিম" : "Principal")}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Overlay Toolbar */}
                                            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover/muhtamim:opacity-100 transition-opacity">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => muhtamimImgInputRef.current?.click()}
                                                    disabled={uploadingMuhtamimImg}
                                                    className="h-7 px-2.5 text-[10px] font-bold bg-white/90 hover:bg-white text-gray-800 shadow-sm rounded-md gap-1 cursor-pointer"
                                                >
                                                    <Upload size={11} />
                                                    <span>{t("change_photo")}</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="destructive"
                                                    onClick={() => updateNestedField("about_us", "muhtamim_image", "")}
                                                    className="h-7 w-7 bg-rose-600/90 hover:bg-rose-600 text-white shadow-sm rounded-md cursor-pointer"
                                                    title={t("remove_photo")}
                                                >
                                                    <Trash2 size={12} />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">{t("muhtamim_speech_message")}</Label>
                                <Textarea
                                    value={(settings.about_us?.muhtamim_message as string) || ""}
                                    onChange={(e) => updateNestedField("about_us", "muhtamim_message", e.target.value)}
                                    className="min-h-[145px] text-[11px] rounded-lg bg-gray-50/30 leading-relaxed"
                                    placeholder={
                                        settings.website_template === "imadrasha"
                                            ? "আসসালামু আলাইকুম ওয়ারাহমাতুল্লাহ। দ্বীনি শিক্ষা প্রতিটি মুসলমানের জন্য আত্মিক পথনির্দেশ..."
                                            : "Welcome to our institution. Education is the cornerstone of individual growth and societal advancement. We are dedicated to nurturing well-rounded individuals equipped with knowledge, moral integrity, and critical thinking skills..."
                                    }
                                />
                            </div>
                        </div>

                        {/* Additional Speech Card Text Settings (Headings & Buttons) */}
                        <div className="pt-4 border-t border-gray-100 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">{t("muhtamim_institute")}</Label>
                                    <Input
                                        value={(settings.about_us?.muhtamim_institute as string) || ""}
                                        onChange={(e) => updateNestedField("about_us", "muhtamim_institute", e.target.value)}
                                        className="h-8 text-xs rounded-lg bg-gray-50/30 font-medium"
                                        placeholder={settings.website_template === "imadrasha" ? "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মাদপুর" : "Bhujpur Government Primary School"}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">{t("section_heading_h1")}</Label>
                                    <Input
                                        value={(settings.about_us?.muhtamim_heading as string) || ""}
                                        onChange={(e) => updateNestedField("about_us", "muhtamim_heading", e.target.value)}
                                        className="h-8 text-xs rounded-lg bg-gray-50/30 font-medium"
                                        placeholder={settings.website_template === "imadrasha" ? "দ্বীনি শিক্ষার গুরুত্ব ও খোদাভীরু নারীসমাজ গঠনের আহ্বান" : "Inspiring Excellence, Fostering Leadership & Lifelong Learning"}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">{t("section_subtitle")}</Label>
                                    <Input
                                        value={(settings.about_us?.muhtamim_subtitle as string) || ""}
                                        onChange={(e) => updateNestedField("about_us", "muhtamim_subtitle", e.target.value)}
                                        className="h-8 text-xs rounded-lg bg-gray-50/30 font-medium"
                                        placeholder={settings.website_template === "imadrasha" ? "দিকনির্দেশনামূলক নসিহত ও বার্তা" : "Message from the Principal"}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Button 1 Text (বাটন ১ টেক্সট)</Label>
                                    <Input
                                        value={(settings.about_us?.muhtamim_btn1_text as string) || ""}
                                        onChange={(e) => updateNestedField("about_us", "muhtamim_btn1_text", e.target.value)}
                                        className="h-8 text-xs bg-white rounded-lg"
                                        placeholder={settings.website_template === "imadrasha" ? "ভর্তির বিস্তারিত নির্দেশিকা ও আবেদন" : "Apply For Admission"}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Button 1 Link (বাটন ১ লিংক)</Label>
                                    <Input
                                        value={(settings.about_us?.muhtamim_btn1_url as string) || ""}
                                        onChange={(e) => updateNestedField("about_us", "muhtamim_btn1_url", e.target.value)}
                                        className="h-8 text-xs bg-white rounded-lg"
                                        placeholder="/online_admission"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Button 2 Text (বাটন ২ টেক্সট)</Label>
                                    <Input
                                        value={(settings.about_us?.muhtamim_btn2_text as string) || ""}
                                        onChange={(e) => updateNestedField("about_us", "muhtamim_btn2_text", e.target.value)}
                                        className="h-8 text-xs bg-white rounded-lg"
                                        placeholder={settings.website_template === "imadrasha" ? "যোগাযোগ করুন" : "Contact Us"}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Button 2 Link (বাটন ২ লিংক)</Label>
                                    <Input
                                        value={(settings.about_us?.muhtamim_btn2_url as string) || ""}
                                        onChange={(e) => updateNestedField("about_us", "muhtamim_btn2_url", e.target.value)}
                                        className="h-8 text-xs bg-white rounded-lg"
                                        placeholder={settings.website_template === "imadrasha" ? "#contact" : "/contact-us"}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Courses / জামিয়ার শিক্ষাবিভাগ */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-orange-400 h-full" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                                    <GraduationCap size={18} className="stroke-[2.5px]" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">
                                        {settings.website_template === "imadrasha" ? "জামিয়ার শিক্ষাবিভাগ" : t("our_main_courses_showcase")}
                                    </h2>
                                    <span className="text-[10px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                                        {(settings.main_courses || []).length}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5">
                                <div className="flex items-center gap-2 mr-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        {settings.header_footer_sections?.courses_enabled !== false ? t("enabled") : t("disabled")}
                                    </span>
                                    <Switch
                                        checked={settings.header_footer_sections?.courses_enabled !== false}
                                        onCheckedChange={(v) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, courses_enabled: v } })}
                                        className="data-[state=checked]:bg-orange-500"
                                    />
                                </div>
                                <Button 
                                    type="button"
                                    onClick={addCourseItem}
                                    className={cn(
                                        "text-white px-3.5 h-8 font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer",
                                        settings.website_template === "imadrasha" ? "bg-[#014739] hover:bg-[#01352A]" : "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90"
                                    )}
                                >
                                    <Plus size={14} className="stroke-[3px]" /> {settings.website_template === "imadrasha" ? "নতুন বিভাগ যোগ করুন" : "Add Course / নতুন কোর্স যোগ করুন"}
                                </Button>
                                <Button 
                                    type="button"
                                    variant="outline"
                                    onClick={openCoursePicker}
                                    className="border-gray-200 hover:bg-gray-50 text-gray-700 px-3.5 h-8 font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                    <BookOpen size={14} /> {t("browse_courses")}
                                </Button>
                            </div>
                        </div>

                        {/* Section Header Inputs (Badge, Title, Subtitle) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-2">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("courses_section_badge_label")}</Label>
                                <Input 
                                    value={(settings.header_footer_sections?.courses_section_badge as string) || ""} 
                                    onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, courses_section_badge: e.target.value } })} 
                                    className="h-9 text-[11px] rounded-lg bg-gray-50/30 font-medium" 
                                    placeholder={settings.website_template === "imadrasha" ? "দ্বীনি ও আধুনিক শিক্ষা" : "Academic Programs"} 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_heading_h1")}</Label>
                                <Input 
                                    value={settings.header_footer_sections?.courses_section_title || ""} 
                                    onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, courses_section_title: e.target.value } })} 
                                    className="h-9 text-[11px] rounded-lg bg-gray-50/30 font-medium" 
                                    placeholder={settings.website_template === "imadrasha" ? "জামিয়ার শিক্ষাবিভাগ" : t("our_main_courses_placeholder")} 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_subtitle")}</Label>
                                <Input 
                                    value={settings.header_footer_sections?.courses_section_subtitle || ""} 
                                    onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, courses_section_subtitle: e.target.value } })} 
                                    className="h-9 text-[11px] rounded-lg bg-gray-50/30" 
                                    placeholder={settings.website_template === "imadrasha" ? "দ্বীনি শিক্ষার পাশাপাশি আধুনিক তথ্যপ্রযুক্তি ও নারীদের কারিগরি আত্মকর্মসংস্থানের সুসমন্বয়।" : "Comprehensive modern curriculum designed for academic excellence."} 
                                />
                            </div>
                        </div>

                        {/* Empty State */}
                        {(!settings.main_courses || settings.main_courses.length === 0) ? (
                            <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 space-y-3">
                                <GraduationCap className="mx-auto h-10 w-10 text-gray-400 stroke-[1.5px]" />
                                <p className="text-xs text-gray-500 font-medium">
                                    {settings.website_template === "imadrasha" ? "কোনো শিক্ষাবিভাগ যোগ করা হয়নি" : "No courses added yet"}
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={addCourseItem}
                                        className={cn(
                                            "text-xs text-white cursor-pointer",
                                            settings.website_template === "imadrasha" ? "bg-[#014739] hover:bg-[#01352A]" : "bg-indigo-600 hover:bg-indigo-700"
                                        )}
                                    >
                                        <Plus size={14} className="mr-1" /> {settings.website_template === "imadrasha" ? "নতুন বিভাগ যোগ করুন" : "Add Course / নতুন কোর্স যোগ করুন"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSettings((prev) => ({ 
                                            ...prev, 
                                            main_courses: (TEMPLATE_PRESETS[settings.website_template === "imadrasha" ? "imadrasha" : "ischool"].main_courses as MainCourseItem[]) 
                                        }))}
                                        className={cn(
                                            "text-xs cursor-pointer",
                                            settings.website_template === "imadrasha" ? "border-emerald-300 text-emerald-800 hover:bg-emerald-50" : "border-indigo-300 text-indigo-800 hover:bg-indigo-50"
                                        )}
                                    >
                                        {settings.website_template === "imadrasha" ? "ডিফল্ট বিভাগসমূহ লোড করুন" : t("load_default_courses")}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            /* Courses / Departments Cards Grid */
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {settings.main_courses.map((course: MainCourseItem, idx: number) => (
                                    <div 
                                        key={course.id || idx} 
                                        className="p-5 border border-gray-200 rounded-xl bg-gray-50/40 hover:border-orange-300 hover:shadow-md hover:bg-white transition-all space-y-4 relative group"
                                    >
                                        {/* Card Top Header */}
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="h-6 w-6 shrink-0 rounded-md bg-white border border-gray-200 text-[11px] font-bold text-gray-600 flex items-center justify-center shadow-2xs">
                                                    #{idx + 1}
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] shrink-0 font-bold px-2.5 py-0.5 rounded shadow-2xs",
                                                    settings.website_template === "imadrasha" ? "bg-[#014739] text-amber-300" : "bg-indigo-600 text-white"
                                                )}>
                                                    {course.category || (settings.website_template === "imadrasha" ? "বিভাগ" : "General")}
                                                </span>
                                                <span className="text-xs font-bold text-gray-800 truncate">
                                                    {course.title || (settings.website_template === "imadrasha" ? "নতুন বিভাগ" : "New Course")}
                                                </span>
                                            </div>
                                            <Button 
                                                type="button"
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => removeListItem("main_courses", course.id)} 
                                                className="h-7 w-7 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                                title="মুছে ফেলুন"
                                            >
                                                <Trash2 size={15} />
                                            </Button>
                                        </div>

                                        {/* Row 1: Course Image Preview & Selection */}
                                        <div className="p-3 bg-white rounded-lg border border-gray-100 space-y-2.5">
                                            <div className="flex items-start gap-3">
                                                {/* Image Thumbnail with Upload Trigger */}
                                                <label className="relative h-20 w-28 rounded-lg overflow-hidden border border-gray-200 bg-slate-100 shrink-0 group/thumb cursor-pointer shadow-2xs">
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        className="hidden" 
                                                        disabled={uploadingCourseIdx === idx}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleCourseImageUpload(idx, file);
                                                            e.target.value = "";
                                                        }} 
                                                    />
                                                    {(course.image || course.image_url) ? (
                                                        <img 
                                                            src={resolveCmsImgUrl(course.image || course.image_url)} 
                                                            alt={course.title || "Course"} 
                                                            className="h-full w-full object-cover group-hover/thumb:scale-105 transition-transform" 
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "/madrasha/Dawra-Class.jpg";
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                                                            <ImageIcon size={20} className="mb-0.5" />
                                                            <span className="text-[9px] font-bold uppercase">{t("no_img")}</span>
                                                        </div>
                                                    )}
                                                    {uploadingCourseIdx === idx ? (
                                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-[9px] font-bold gap-1 z-10">
                                                            <Loader2 size={16} className="animate-spin text-amber-300" />
                                                            <span>আপলোড হচ্ছে...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-medium gap-1">
                                                            <Upload size={14} />
                                                            <span>{t("upload_image")}</span>
                                                        </div>
                                                    )}
                                                </label>

                                                {/* Image URL Input & Upload Controls */}
                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                            {t("upload_course_image")}
                                                        </Label>
                                                        <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded flex items-center gap-1">
                                                            <span>📁</span> front_cms/{settings.website_template || "ischool"}/courses
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1.5">
                                                        <Input 
                                                            placeholder="/madrasha/... বা ইমেজ URL..." 
                                                            value={course.image || course.image_url || ""} 
                                                            onChange={(e) => {
                                                                updateCourse(idx, "image", e.target.value);
                                                                updateCourse(idx, "image_url", e.target.value);
                                                            }} 
                                                            className="h-8 text-xs bg-white border-gray-200 rounded-lg flex-1" 
                                                        />
                                                        <label className="cursor-pointer">
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                className="hidden" 
                                                                disabled={uploadingCourseIdx === idx}
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handleCourseImageUpload(idx, file);
                                                                    e.target.value = "";
                                                                }} 
                                                            />
                                                            <span className="h-8 px-2.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1 shadow-2xs">
                                                                {uploadingCourseIdx === idx ? (
                                                                    <Loader2 size={12} className="animate-spin text-indigo-600" />
                                                                ) : (
                                                                    <Upload size={12} className="text-indigo-600" />
                                                                )}
                                                                <span className="hidden sm:inline">{t("upload_image")}</span>
                                                            </span>
                                                        </label>
                                                        {(course.image || course.image_url) && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    updateCourse(idx, "image", "");
                                                                    updateCourse(idx, "image_url", "");
                                                                }}
                                                                className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                                                                title="মুছে ফেলুন"
                                                            >
                                                                <Trash2 size={13} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Quick Presets */}
                                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mr-1">
                                                            {settings.website_template === "imadrasha" ? "নমুনা ছবি:" : "Sample Images:"}
                                                        </span>
                                                        {(settings.website_template === "imadrasha" ? COURSE_IMAGE_PRESETS : SCHOOL_COURSE_IMAGE_PRESETS).map((preset, pIdx) => (
                                                            <button
                                                                key={pIdx}
                                                                type="button"
                                                                onClick={() => updateCourse(idx, "image", preset.url)}
                                                                className={cn(
                                                                    "text-[10px] px-2 py-0.5 rounded border transition-all cursor-pointer",
                                                                    (course.image === preset.url || course.image_url === preset.url)
                                                                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-2xs"
                                                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                                                )}
                                                            >
                                                                {preset.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 2: Title and Category */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                    {settings.website_template === "imadrasha" ? "বিভাগের নাম / Course Title" : t("course_name")}
                                                </Label>
                                                <Input 
                                                    placeholder={settings.website_template === "imadrasha" ? "যেমন: নুরানি বিভাগ" : "Course Title"} 
                                                    value={course.title || ""} 
                                                    onChange={(e) => updateCourse(idx, "title", e.target.value)} 
                                                    className="h-8 text-xs font-bold bg-white border-gray-200 rounded-lg" 
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                    {t("category")} / {settings.website_template === "imadrasha" ? "ব্যাজ (Badge)" : "Badge"}
                                                </Label>
                                                <Input 
                                                    placeholder={settings.website_template === "imadrasha" ? "যেমন: নুরানি, কিতাব, কারিগরি" : "e.g. Science, Technology, Arts"} 
                                                    value={course.category || ""} 
                                                    onChange={(e) => updateCourse(idx, "category", e.target.value)} 
                                                    className="h-8 text-xs bg-white border-gray-200 rounded-lg" 
                                                />
                                                <div className="flex flex-wrap gap-1 pt-1">
                                                    {(settings.website_template === "imadrasha" 
                                                        ? ["হিফজ বিভাগ", "কিতাব বিভাগ", "নূরানী", "নাযেরা", "ক্বেরাত", "কারিগরি"]
                                                        : ["Science", "Technology", "Mathematics", "Humanities", "Languages", "Arts"]
                                                    ).map((cat) => (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => updateCourse(idx, "category", cat)}
                                                            className={cn(
                                                                "text-[9px] px-1.5 py-0.5 rounded border transition-all cursor-pointer",
                                                                course.category === cat 
                                                                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold" 
                                                                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                                                            )}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Row 3: Status, Button Text, and Apply Link */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                    {settings.website_template === "imadrasha" ? "ভর্তি স্ট্যাটাস (Status)" : t("course_fee_or_status")}
                                                </Label>
                                                <Input 
                                                    placeholder={settings.website_template === "imadrasha" ? "যেমন: ভর্তি চলমান / আসন সীমিত" : "e.g. $49 / Free / ভর্তি চলছে"} 
                                                    value={course.status ?? course.price ?? ""} 
                                                    onChange={(e) => updateCourse(idx, "status", e.target.value)} 
                                                    className="h-8 text-xs bg-white border-gray-200 rounded-lg" 
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                    {settings.website_template === "imadrasha" ? "বাটন টেক্সট (Button Text)" : "Button Text"}
                                                </Label>
                                                <Input 
                                                    placeholder={settings.website_template === "imadrasha" ? "যেমন: আবেদন করুন" : "e.g. Enroll Now / Details"} 
                                                    value={course.btn_text || (settings.website_template === "imadrasha" ? "আবেদন করুন" : "Enroll Now")} 
                                                    onChange={(e) => updateCourse(idx, "btn_text", e.target.value)} 
                                                    className="h-8 text-xs bg-white border-gray-200 rounded-lg" 
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                    {t("apply_link")} (URL)
                                                </Label>
                                                <Input 
                                                    placeholder={settings.website_template === "imadrasha" ? "যেমন: /online_admission" : "e.g. /online_admission"} 
                                                    value={course.link || course.url || ""} 
                                                    onChange={(e) => updateCourse(idx, "link", e.target.value)} 
                                                    className="h-8 text-xs bg-white border-gray-200 rounded-lg" 
                                                />
                                            </div>
                                        </div>

                                        {/* Row 4: Description */}
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                {t("description")} ({settings.website_template === "imadrasha" ? "সংক্ষিপ্ত বিবরণ" : "Overview"})
                                            </Label>
                                            <Textarea 
                                                placeholder={settings.website_template === "imadrasha" ? "কোর্সের সংক্ষিপ্ত বিবরণ বা লক্ষ্য লিখুন..." : "Course overview, curriculum, or learning objectives..."} 
                                                value={course.description || ""} 
                                                onChange={(e) => updateCourse(idx, "description", e.target.value)} 
                                                className="min-h-[56px] text-xs bg-white border-gray-200 rounded-lg leading-relaxed resize-y" 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                                        .filter((c: OnlineCourseItem) => !courseSearch || c.title?.toLowerCase().includes(courseSearch.toLowerCase()))
                                        .map((course: OnlineCourseItem) => {
                                            const alreadyAdded = settings.main_courses.some((mc: MainCourseItem) => mc.online_course_id === course.id);
                                            return (
                                                <div key={course.id} className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${alreadyAdded ? 'border-green-200 bg-green-50/50 opacity-60' : 'border-gray-100 hover:border-orange-200 hover:shadow-md bg-white'}`}>
                                                    <div className="h-14 w-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                        {course.image ? <img src={course.image} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full flex items-center justify-center text-gray-300"><BookOpen size={20} /></div>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-[12px] font-bold text-gray-800 truncate">{course.title}</h4>
                                                        <p className="text-[10px] text-gray-400 font-medium truncate">{course.category || t("general")} · ${course.price || "0"}</p>
                                                    </div>
                                                    <Button size="sm" disabled={alreadyAdded} onClick={() => { addOnlineCourse(course); }} className={`h-8 text-[10px] font-bold rounded-full px-4 ${alreadyAdded ? 'bg-green-100 text-green-600 border-0' : 'bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white'}`}>
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
                                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">
                                    {settings.website_template === "imadrasha" ? "অভিজ্ঞ উস্তাদ ও শিক্ষকমণ্ডলী" : t("experienced_faculty_members")}
                                </h2>
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
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-5 h-8 font-bold rounded-full shadow-md flex items-center gap-2"
                                >
                                    <Plus size={14} className="stroke-[3px]" /> {settings.website_template === "imadrasha" ? "উস্তাদ যোগ করুন" : t("add_faculty_member")}
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_badge_small_heading")}</Label>
                                <Input 
                                    value={settings.header_footer_sections?.staff_section_badge || ""} 
                                    onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, staff_section_badge: e.target.value } })} 
                                    className="h-9 text-[11px] rounded-lg bg-gray-50/30" 
                                    placeholder={settings.website_template === "imadrasha" ? "বিজ্ঞ উলামায়ে কেরাম ও শিক্ষকমণ্ডলী" : "Dedicated Teachers & Leaders"} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_heading_h1")}</Label>
                                <Input 
                                    value={settings.header_footer_sections?.staff_section_title || ""} 
                                    onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, staff_section_title: e.target.value } })} 
                                    className="h-9 text-[11px] rounded-lg bg-gray-50/30" 
                                    placeholder={settings.website_template === "imadrasha" ? "আমাদের সম্মানিত শিক্ষকমণ্ডলী" : t("our_experienced_staffs_placeholder")} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">{t("section_subtitle")}</Label>
                                <Input 
                                    value={settings.header_footer_sections?.staff_section_subtitle || ""} 
                                    onChange={(e) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, staff_section_subtitle: e.target.value } })} 
                                    className="h-9 text-[11px] rounded-lg bg-gray-50/30" 
                                    placeholder={settings.website_template === "imadrasha" ? "অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষকদের তালিকা" : t("section_subtitle_placeholder")} 
                                />
                            </div>
                        </div>

                        {settings.experienced_staffs.length === 0 ? (
                            <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center">
                                <Users className="h-10 w-10 text-gray-300 mb-2 stroke-[1.5px]" />
                                <p className="text-xs font-semibold text-gray-500 mb-3">{t("no_staff_added")}</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const defaultStaff = settings.website_template === "imadrasha"
                                            ? TEMPLATE_PRESETS.imadrasha.experienced_staffs
                                            : TEMPLATE_PRESETS.ischool.experienced_staffs;
                                        setSettings({ ...settings, experienced_staffs: defaultStaff || [] });
                                        toast({
                                            title: t("load_default_staff"),
                                            description: t("default_staff_loaded"),
                                        });
                                    }}
                                    className="h-8 text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border-indigo-200 gap-1.5"
                                >
                                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                                    <span>{t("load_default_staff")}</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {settings.experienced_staffs.map((staff: StaffMemberItem, idx: number) => (
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
                                                placeholder={settings.website_template === "imadrasha" ? "উস্তাদের নাম" : t("full_name")}
                                                value={staff.name} 
                                                onChange={(e) => {
                                                    const newList = [...settings.experienced_staffs];
                                                    newList[idx].name = e.target.value;
                                                    setSettings({ ...settings, experienced_staffs: newList });
                                                }} 
                                                className="h-8 text-[11px] text-center font-bold bg-white border-gray-100" 
                                            />
                                            <Input 
                                                placeholder={settings.website_template === "imadrasha" ? "পদবি (যেমন: প্রধান শিক্ষক / শায়খুল হাদিস)" : t("position_role")}
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
                        )}
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

                    {/* FOOTER SECTION SETTINGS */}
                    <div className="p-6 rounded-xl border border-gray-100 bg-white shadow-xs space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                                    <PhoneCall className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t("footer_section_settings")}</h2>
                                    <p className="text-[11px] text-gray-500">{t("footer_section_desc", "Manage all 4-column website footer information, departments, essential links, and address")}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {settings.website_template === "ischool" ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const ischoolPreset = TEMPLATE_PRESETS.ischool;
                                            const hf = ischoolPreset.header_footer_sections;
                                            setSettings(prev => ({
                                                ...prev,
                                                footer_text: ischoolPreset.footer_text || "© All Rights Reserved. iSchool Management System.",
                                                header_footer_sections: {
                                                    ...prev.header_footer_sections,
                                                    footer_enabled: true,
                                                    footer_bg: "#0F172A",
                                                    ischool_footer_bg: "#0F172A",
                                                    ischool_footer_bg_enabled: true,
                                                    footer_bg_enabled: true,
                                                    footer_show_logo: true,
                                                    footer_show_school_name: true,
                                                    footer_show_institute_name: true,
                                                    footer_show_established_year: true,
                                                    footer_arabic_title: "",
                                                    footer_madrasa_name: ischoolPreset.institute_name || "Bhujpur Government Primary School",
                                                    footer_school_name: ischoolPreset.institute_name || "Bhujpur Government Primary School",
                                                    institute_name: ischoolPreset.institute_name || "Bhujpur Government Primary School",
                                                    footer_about_text: hf?.footer_about_text || "Empowering minds, fostering creativity, and building a brighter future with quality education and moral integrity.",
                                                    footer_established_year: hf?.footer_established_year || "Est. 1995",
                                                    footer_info_label: hf?.footer_info_label || "Academic Programs",
                                                    footer_department_links: hf?.footer_department_links || [
                                                        { title: "Online Admission", url: "/online_admission" },
                                                        { title: "Academics", url: "/academics" },
                                                        { title: "Login", url: "/login" },
                                                    ],
                                                    footer_menu_label: hf?.footer_menu_label || "Quick Links",
                                                    footer_quick_links: hf?.footer_quick_links || [
                                                        { title: "Notices", url: "/notices" },
                                                        { title: "About School", url: "#about" },
                                                        { title: "Academic Courses", url: "#courses" },
                                                        { title: "Contact Us", url: "/contact-us" },
                                                    ],
                                                    footer_contact_info_label: hf?.footer_contact_info_label || "Contact Details",
                                                    footer_address: hf?.footer_address || "Bhujpur, Fatikchhari, Chattogram, Bangladesh",
                                                    school_address: hf?.footer_address || "Bhujpur, Fatikchhari, Chattogram, Bangladesh",
                                                    footer_phone: hf?.footer_phone || "+880 1812-345678",
                                                    school_phone: hf?.footer_phone || "+880 1812-345678",
                                                    footer_email: hf?.footer_email || "info@bhujpurschool.edu.bd",
                                                    school_email: hf?.footer_email || "info@bhujpurschool.edu.bd",
                                                    copyright_text: hf?.copyright_text || "© All Rights Reserved. iSchool Management System.",
                                                    footer_powered_by_text: hf?.footer_powered_by_text || "Powered by: iSchool Management System",
                                                }
                                            }));
                                            toast({
                                                title: t("load_ischool_footer_preset"),
                                                description: t("ischool_footer_preset_loaded"),
                                            });
                                        }}
                                        className="h-8 text-xs font-semibold text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100/90 border-indigo-200 gap-1.5"
                                    >
                                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                                        <span>{t("load_ischool_footer_preset")}</span>
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const madrasaPreset = TEMPLATE_PRESETS.imadrasha;
                                            const hf = madrasaPreset.header_footer_sections;
                                            setSettings(prev => ({
                                                ...prev,
                                                footer_text: madrasaPreset.footer_text || "© All Rights reserved by Anwara Begum Girls Titel Madrasha Muhammadpur",
                                                header_footer_sections: {
                                                    ...prev.header_footer_sections,
                                                    footer_enabled: true,
                                                    footer_bg: "#01352A",
                                                    madrasha_footer_bg: "#01352A",
                                                    madrasha_footer_bg_enabled: true,
                                                    footer_bg_enabled: true,
                                                    footer_show_logo: true,
                                                    footer_show_school_name: true,
                                                    footer_show_institute_name: true,
                                                    footer_show_established_year: true,
                                                    footer_arabic_title: hf?.footer_arabic_title || "مدرسة البنات دار الحديث انواره بيغم محمدفور",
                                                    footer_madrasa_name: hf?.footer_madrasa_name || "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মদপুর",
                                                    footer_about_text: hf?.footer_about_text || "মা খাদিজা (রা.) ও আয়েশা (রা.)-এর আদর্শে অনুকরণীয় নারীসমাজ গঠনের লক্ষ্যে প্রতিষ্ঠিত এক ঐতিহ্যবাহী দ্বীনি শিক্ষাপ্রতিষ্ঠান।",
                                                    footer_established_year: hf?.footer_established_year || "স্থাপিত: ২০০৬ খ্রিস্টাব্দ",
                                                    footer_info_label: hf?.footer_info_label || "জামিয়ার শিক্ষাবিভাগ",
                                                    footer_department_links: hf?.footer_department_links || [
                                                        { title: "নুরানি ও নাজেরা বিভাগ", url: "#departments" },
                                                        { title: "হিফজুল কুরআন বিভাগ", url: "#departments" },
                                                        { title: "কিতাব ও দাওরায়ে হাদিস বিভাগ", url: "#departments" },
                                                        { title: "আইটি ও কম্পিউটার প্রশিক্ষণ", url: "#departments" },
                                                        { title: "কারিগরি ও সেলাই প্রশিক্ষণ", url: "#departments" },
                                                    ],
                                                    footer_menu_label: hf?.footer_menu_label || "জরুরি লিংকসমূহ",
                                                    footer_quick_links: hf?.footer_quick_links || [
                                                        { title: "অনলাইন ভর্তি আবেদন", url: "/online_admission" },
                                                        { title: "মাদরাসা নোটিশ বোর্ড", url: "#notices" },
                                                        { title: "মাদ্রাসা পরিচিতি ও ইতিহাস", url: "#about-madrasa" },
                                                        { title: "মুহতামিম সাহেবের বাণী", url: "#muhtamim" },
                                                        { title: "শিক্ষক ও পরিচালকমণ্ডলী", url: "#faculty" },
                                                        { title: "এডমিন / শিক্ষক লগইন", url: "/login" },
                                                    ],
                                                    footer_contact_info_label: hf?.footer_contact_info_label || "যোগাযোগের ঠিকানা",
                                                    footer_address: hf?.footer_address || "১২ নং গিয়াসনগর ইউনিয়ন, মোহাম্মদপুর, মৌলভীবাজার সদর, মৌলভীবাজার",
                                                    footer_phone: hf?.footer_phone || "+8801719606713",
                                                    footer_email: hf?.footer_email || "anwarabegumgirlsmadrasa@gmail.com",
                                                    copyright_text: hf?.copyright_text || "© All Rights reserved by Anwara Begum Girls Titel Madrasha Muhammadpur",
                                                    footer_powered_by_text: hf?.footer_powered_by_text || "চালিত হচ্ছে: iSchool Management System",
                                                }
                                            }));
                                            toast({
                                                title: t("load_madrasa_footer_preset"),
                                                description: t("footer_preset_loaded"),
                                            });
                                        }}
                                        className="h-8 text-xs font-semibold text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/90 border-emerald-200 gap-1.5"
                                    >
                                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>{t("load_madrasa_footer_preset")}</span>
                                    </Button>
                                )}
                                <div className="h-4 w-[1px] bg-gray-200 hidden sm:block" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        {settings.header_footer_sections?.footer_enabled !== false ? t("enabled") : t("disabled")}
                                    </span>
                                    <Switch
                                        checked={settings.header_footer_sections?.footer_enabled !== false}
                                        onCheckedChange={(v) => setSettings({ ...settings, header_footer_sections: { ...settings.header_footer_sections, footer_enabled: v } })}
                                        className="data-[state=checked]:bg-emerald-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* FOOTER BACKGROUND COLOR CONTROLLING SYSTEM */}
                        <div className="p-4 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-3.5 relative overflow-hidden">
                            <div className={cn(
                                "absolute top-0 left-0 w-1 h-full transition-colors",
                                footerTab === "imadrasha" ? "bg-emerald-600" : "bg-indigo-500"
                            )} />

                            {/* Card Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "h-6 w-6 rounded-md flex items-center justify-center text-white shadow-2xs transition-all",
                                        footerTab === "imadrasha"
                                            ? "bg-emerald-600"
                                            : "bg-gradient-to-br from-[#FF9800] to-[#6366F1]"
                                    )}>
                                        <Palette size={13} className="stroke-[2.5px]" />
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-800 uppercase tracking-tight">
                                        {footerTab === "imadrasha" ? t("madrasha_footer_bg") : t("ischool_footer_bg")}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Template Switcher Tabs */}
                                    <div className="inline-flex rounded-md border border-gray-200 bg-gray-50/80 p-0.5 text-[9.5px]">
                                        <button
                                            type="button"
                                            onClick={() => setFooterTab("ischool")}
                                            className={cn(
                                                "px-2 py-0.5 font-semibold rounded transition-all cursor-pointer flex items-center gap-1",
                                                footerTab === "ischool"
                                                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                                                    : "text-gray-500 hover:text-gray-900"
                                            )}
                                        >
                                            <span>🏫</span>
                                            <span>{t("template_ischool")}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFooterTab("imadrasha")}
                                            className={cn(
                                                "px-2 py-0.5 font-semibold rounded transition-all cursor-pointer flex items-center gap-1",
                                                footerTab === "imadrasha"
                                                    ? "bg-white text-emerald-700 shadow-2xs font-bold"
                                                    : "text-gray-500 hover:text-gray-900"
                                            )}
                                        >
                                            <span>🕌</span>
                                            <span>{t("template_imadrasha")}</span>
                                        </button>
                                    </div>

                                    {/* Reset Button */}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (footerTab === "imadrasha") {
                                                setSettings((prev) => ({
                                                    ...prev,
                                                    header_footer_sections: {
                                                        ...prev.header_footer_sections,
                                                        madrasha_footer_bg: "#01352A",
                                                        madrasha_footer_bg_enabled: true,
                                                        ...(prev.website_template === "imadrasha" ? { footer_bg: "#01352A", footer_bg_enabled: true } : {}),
                                                    }
                                                }));
                                            } else {
                                                setSettings((prev) => ({
                                                    ...prev,
                                                    header_footer_sections: {
                                                        ...prev.header_footer_sections,
                                                        ischool_footer_bg: "#0F172A",
                                                        ischool_footer_bg_enabled: true,
                                                        ...(prev.website_template === "ischool" ? { footer_bg: "#0F172A", footer_bg_enabled: true } : {}),
                                                    }
                                                }));
                                            }
                                            toast("success", t("footer_bg_reset_success") || "Footer background color reset to default.");
                                        }}
                                        className="h-6 text-[9.5px] font-bold text-gray-500 hover:text-gray-800 rounded px-1.5 flex items-center gap-1 cursor-pointer"
                                        title="Reset to default color"
                                    >
                                        <RotateCcw size={10} /> {t("reset")}
                                    </Button>

                                    {/* Enable / Disable Switch */}
                                    <div className="flex items-center gap-1 pl-1.5 border-l border-gray-200">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                            {(footerTab === "imadrasha"
                                                ? (settings.header_footer_sections?.madrasha_footer_bg_enabled !== false)
                                                : (settings.header_footer_sections?.ischool_footer_bg_enabled !== false))
                                                ? t("enabled")
                                                : t("disabled")}
                                        </span>
                                        <Switch
                                            checked={
                                                footerTab === "imadrasha"
                                                    ? (settings.header_footer_sections?.madrasha_footer_bg_enabled !== false)
                                                    : (settings.header_footer_sections?.ischool_footer_bg_enabled !== false)
                                            }
                                            onCheckedChange={(val) => {
                                                if (footerTab === "imadrasha") {
                                                    setSettings((prev) => ({
                                                        ...prev,
                                                        header_footer_sections: {
                                                            ...prev.header_footer_sections,
                                                            madrasha_footer_bg_enabled: val,
                                                            ...(prev.website_template === "imadrasha" ? { footer_bg_enabled: val } : {}),
                                                        }
                                                    }));
                                                } else {
                                                    setSettings((prev) => ({
                                                        ...prev,
                                                        header_footer_sections: {
                                                            ...prev.header_footer_sections,
                                                            ischool_footer_bg_enabled: val,
                                                            ...(prev.website_template === "ischool" ? { footer_bg_enabled: val } : {}),
                                                        }
                                                    }));
                                                }
                                            }}
                                            className={cn(
                                                "scale-85 data-[state=checked]:bg-emerald-600",
                                                footerTab === "ischool" && "data-[state=checked]:bg-indigo-600"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Disabled State Banner */}
                            {((footerTab === "imadrasha" && settings.header_footer_sections?.madrasha_footer_bg_enabled === false) ||
                              (footerTab === "ischool" && settings.header_footer_sections?.ischool_footer_bg_enabled === false)) ? (
                                <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/60 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-[10px] text-amber-800">
                                        <Info size={14} className="text-amber-600 shrink-0" />
                                        <span>{t("footer_bg_disabled_notice")}</span>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                            if (footerTab === "imadrasha") {
                                                setSettings((prev) => ({
                                                    ...prev,
                                                    header_footer_sections: {
                                                        ...prev.header_footer_sections,
                                                        madrasha_footer_bg_enabled: true,
                                                        ...(prev.website_template === "imadrasha" ? { footer_bg_enabled: true } : {}),
                                                    }
                                                }));
                                            } else {
                                                setSettings((prev) => ({
                                                    ...prev,
                                                    header_footer_sections: {
                                                        ...prev.header_footer_sections,
                                                        ischool_footer_bg_enabled: true,
                                                        ...(prev.website_template === "ischool" ? { footer_bg_enabled: true } : {}),
                                                    }
                                                }));
                                            }
                                        }}
                                        className="h-6 text-[9.5px] px-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold cursor-pointer"
                                    >
                                        {t("enabled")}
                                    </Button>
                                </div>
                            ) : (
                                /* THE 3 CARDS: Pick Color, Recommended Presets, Custom Presets */
                                <div className="space-y-3">
                                    {/* Card 1: Click to pick color + Live Preview */}
                                    <div className={cn(
                                        "p-3 rounded-lg border flex flex-col gap-2.5",
                                        footerTab === "imadrasha" ? "border-emerald-200/80 bg-emerald-50/30" : "border-indigo-100 bg-indigo-50/20"
                                    )}>
                                        <div className="flex items-center justify-between">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                                                footerTab === "imadrasha" ? "text-emerald-900" : "text-indigo-900"
                                            )}>
                                                <Pipette size={11} className={footerTab === "imadrasha" ? "text-emerald-700" : "text-indigo-600"} />
                                                <span>{t("click_to_pick_color")}</span>
                                            </span>
                                            <span className={cn(
                                                "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border",
                                                footerTab === "imadrasha" ? "bg-emerald-100/80 text-emerald-800 border-emerald-300" : "bg-indigo-100/80 text-indigo-800 border-indigo-300"
                                            )}>
                                                {footerTab === "imadrasha"
                                                    ? ((settings.header_footer_sections?.madrasha_footer_bg as string) || "#01352A").toUpperCase()
                                                    : ((settings.header_footer_sections?.ischool_footer_bg as string) || "#0F172A").toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Swatch button with hidden input */}
                                            <label
                                                className="h-8 w-10 rounded-md cursor-pointer flex items-center justify-center shadow-xs border border-white transition-transform hover:scale-105 active:scale-95 shrink-0 relative overflow-hidden"
                                                style={{
                                                    backgroundColor: footerTab === "imadrasha"
                                                        ? ((settings.header_footer_sections?.madrasha_footer_bg as string) || "#01352A")
                                                        : ((settings.header_footer_sections?.ischool_footer_bg as string) || "#0F172A")
                                                }}
                                                title={t("click_to_pick_color")}
                                            >
                                                <input
                                                    type="color"
                                                    value={getSafePickerHex(
                                                        footerTab === "imadrasha"
                                                            ? (settings.header_footer_sections?.madrasha_footer_bg as string)
                                                            : (settings.header_footer_sections?.ischool_footer_bg as string),
                                                        footerTab === "imadrasha" ? "#01352A" : "#0F172A"
                                                    )}
                                                    onChange={(e) => handleFooterColorHexChange(e.target.value, footerTab)}
                                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                                />
                                                <Pipette size={12} className="text-white drop-shadow-xs stroke-[2.5px]" />
                                            </label>

                                            <div className="flex-1">
                                                <Input
                                                    type="text"
                                                    value={footerTab === "imadrasha"
                                                        ? ((settings.header_footer_sections?.madrasha_footer_bg as string) || "#01352A")
                                                        : ((settings.header_footer_sections?.ischool_footer_bg as string) || "#0F172A")}
                                                    onChange={(e) => handleFooterColorHexChange(e.target.value, footerTab)}
                                                    className="h-8 text-[11px] font-mono uppercase bg-white border-gray-200 rounded-md"
                                                    placeholder={footerTab === "imadrasha" ? "#01352A" : "#0F172A"}
                                                />
                                            </div>

                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => handleAddCustomFooterPreset(
                                                    footerTab === "imadrasha"
                                                        ? (settings.header_footer_sections?.madrasha_footer_bg as string)
                                                        : (settings.header_footer_sections?.ischool_footer_bg as string),
                                                    footerTab
                                                )}
                                                className={cn(
                                                    "h-8 text-[10px] font-bold text-white rounded-md flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs",
                                                    footerTab === "imadrasha" ? "bg-emerald-700 hover:bg-emerald-800" : "bg-gradient-to-r from-[#FF9800] to-[#6366F1]"
                                                )}
                                                title={t("add_preset_tooltip")}
                                            >
                                                <Plus size={11} strokeWidth={2.5} />
                                                <span>{t("add_to_presets")}</span>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Card 2: RECOMMENDED FOOTER COLOR PRESETS */}
                                    <div className="p-3 rounded-lg border border-gray-150 bg-gray-50/50 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                {t("recommended_color_presets")}
                                            </span>
                                            <span className="text-[9px] text-gray-400 font-mono">
                                                {footerTab === "imadrasha"
                                                    ? ((settings.header_footer_sections?.madrasha_footer_bg as string) || "#01352A").toLowerCase()
                                                    : ((settings.header_footer_sections?.ischool_footer_bg as string) || "#0F172A").toLowerCase()}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                                            {(footerTab === "imadrasha" ? MADRASHA_FOOTER_COLOR_PRESETS : SCHOOL_FOOTER_COLOR_PRESETS).map((preset) => {
                                                const current = footerTab === "imadrasha"
                                                    ? ((settings.header_footer_sections?.madrasha_footer_bg as string) || "#01352A").toLowerCase()
                                                    : ((settings.header_footer_sections?.ischool_footer_bg as string) || "#0F172A").toLowerCase();
                                                const isSelected = current === preset.color.toLowerCase();
                                                return (
                                                    <button
                                                        key={preset.color}
                                                        type="button"
                                                        onClick={() => {
                                                            setSettings((prev) => ({
                                                                ...prev,
                                                                header_footer_sections: {
                                                                    ...prev.header_footer_sections,
                                                                    [footerTab === "imadrasha" ? "madrasha_footer_bg" : "ischool_footer_bg"]: preset.color,
                                                                    ...(prev.website_template === footerTab ? { footer_bg: preset.color } : {}),
                                                                }
                                                            }));
                                                        }}
                                                        className={cn(
                                                            "h-7 rounded-md border flex items-center justify-center transition-all cursor-pointer relative shadow-2xs hover:scale-110",
                                                            isSelected ? "ring-2 ring-emerald-600 ring-offset-1 scale-105 border-white" : "border-white/80 hover:border-white"
                                                        )}
                                                        style={{ backgroundColor: preset.color }}
                                                        title={`${preset.name} (${preset.color})`}
                                                    >
                                                        {isSelected && (
                                                            <Check className="h-3.5 w-3.5 text-white drop-shadow-md stroke-[3px]" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Card 3: CUSTOM PRESETS */}
                                    <div className="p-3 rounded-lg border border-gray-150 bg-gray-50/50 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                    {t("custom_presets")}
                                                </span>
                                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                                                    {((settings.header_footer_sections?.[footerTab === "imadrasha" ? "madrasha_custom_footer_color_presets" : "ischool_custom_footer_color_presets"] as string[]) || []).length}
                                                </span>
                                            </div>
                                            {((settings.header_footer_sections?.[footerTab === "imadrasha" ? "madrasha_custom_footer_color_presets" : "ischool_custom_footer_color_presets"] as string[]) || []).length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleClearCustomFooterPresets(footerTab)}
                                                    className="text-[9px] text-gray-400 hover:text-rose-600 transition-colors cursor-pointer font-medium"
                                                >
                                                    {t("clear_all_presets")}
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {((settings.header_footer_sections?.[footerTab === "imadrasha" ? "madrasha_custom_footer_color_presets" : "ischool_custom_footer_color_presets"] as string[]) || []).map((colorHex) => {
                                                const current = footerTab === "imadrasha"
                                                    ? ((settings.header_footer_sections?.madrasha_footer_bg as string) || "#01352A").toLowerCase()
                                                    : ((settings.header_footer_sections?.ischool_footer_bg as string) || "#0F172A").toLowerCase();
                                                const isSelected = current === colorHex.toLowerCase();
                                                return (
                                                    <div key={colorHex} className="relative group">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSettings((prev) => ({
                                                                    ...prev,
                                                                    header_footer_sections: {
                                                                        ...prev.header_footer_sections,
                                                                        [footerTab === "imadrasha" ? "madrasha_footer_bg" : "ischool_footer_bg"]: colorHex,
                                                                        ...(prev.website_template === footerTab ? { footer_bg: colorHex } : {}),
                                                                    }
                                                                }));
                                                            }}
                                                            className={cn(
                                                                "h-7 w-7 rounded-md border flex items-center justify-center transition-all cursor-pointer relative shadow-2xs hover:scale-110",
                                                                isSelected ? "ring-2 ring-emerald-600 ring-offset-1 scale-105 border-white" : "border-white/80 hover:border-white"
                                                            )}
                                                            style={{ backgroundColor: colorHex }}
                                                            title={`Custom Preset: ${colorHex}`}
                                                        >
                                                            {isSelected && (
                                                                <Check className="h-3 w-3 text-white drop-shadow-md stroke-[3px]" />
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleRemoveCustomFooterPreset(colorHex, footerTab, e)}
                                                            className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs hover:bg-rose-700 z-10"
                                                            title={t("remove_preset")}
                                                        >
                                                            <X size={9} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                );
                                            })}

                                            {((settings.header_footer_sections?.[footerTab === "imadrasha" ? "madrasha_custom_footer_color_presets" : "ischool_custom_footer_color_presets"] as string[]) || []).length === 0 && (
                                                <p className="text-[10px] text-gray-400 italic py-0.5">
                                                    {t("no_custom_presets_hint") || "No custom presets added yet. Click \"Add to Presets\" above to save colors here."}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4-COLUMN FOOTER EDIT GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                            
                            {/* COLUMN 1: IDENTITY & ABOUT */}
                            <div className="p-4 rounded-xl border border-emerald-100 bg-[#f9fbf9] flex flex-col justify-between space-y-4">
                                <div className="space-y-3.5">
                                    <div className="flex items-center gap-2 pb-2 border-b border-emerald-100/80 justify-center sm:justify-start">
                                        <div className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black shrink-0">
                                            ১
                                        </div>
                                        <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider text-center sm:text-left">
                                            {settings.website_template === "ischool" ? t("column_1_school_identity") : t("column_1_identity")}
                                        </h3>
                                    </div>

                                    {/* Footer Logo / Image Upload */}
                                    <div className="space-y-1.5 p-3 rounded-lg border border-emerald-200/70 bg-white">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-[10px] font-bold uppercase text-emerald-900 tracking-wider">
                                                    {t("footer_logo_image")}
                                                </Label>
                                                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                                                    <span>📁</span> front_cms/{settings.website_template || "ischool"}/footer
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {settings.header_footer_sections?.footer_show_logo !== false ? t("enabled") : t("disabled")}
                                                </span>
                                                <Switch
                                                    checked={settings.header_footer_sections?.footer_show_logo !== false}
                                                    onCheckedChange={(v) => setSettings({
                                                        ...settings,
                                                        header_footer_sections: {
                                                            ...settings.header_footer_sections,
                                                            footer_show_logo: v,
                                                        }
                                                    })}
                                                    className="data-[state=checked]:bg-emerald-600 scale-90"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-400">
                                            {t("footer_logo_desc")}
                                        </p>
                                        <div className="flex gap-1.5">
                                            <Input
                                                value={settings.header_footer_sections?.footer_logo || ""}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    header_footer_sections: {
                                                        ...settings.header_footer_sections,
                                                        footer_logo: e.target.value,
                                                    }
                                                })}
                                                className="h-8 text-xs rounded-lg bg-white border-emerald-200/60 flex-1"
                                                placeholder="/madrasha/logo.png বা ইমেজ URL..."
                                            />
                                            <input
                                                ref={footerLogoInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFooterLogoUpload}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={uploadingFooterLogo}
                                                onClick={() => footerLogoInputRef.current?.click()}
                                                className="h-8 px-2.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 rounded-lg flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                                            >
                                                {uploadingFooterLogo ? (
                                                    <Loader2 size={12} className="animate-spin text-emerald-600" />
                                                ) : (
                                                    <Upload size={12} className="text-emerald-600" />
                                                )}
                                                <span>{t("upload_image")}</span>
                                            </Button>
                                        </div>

                                        {/* Footer Logo Preview */}
                                        {settings.header_footer_sections?.footer_logo && (
                                            <div className="relative rounded-lg border border-emerald-200/80 overflow-hidden bg-slate-900 shadow-2xs group mt-1.5">
                                                <div className="h-16 w-full relative flex items-center justify-center p-2 bg-[#01352A]">
                                                    <img
                                                        src={resolveCmsImgUrl(settings.header_footer_sections.footer_logo)}
                                                        className="h-full w-auto object-contain max-h-12"
                                                        alt="Footer Logo Preview"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder-logo.png"; }}
                                                    />
                                                </div>
                                                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => footerLogoInputRef.current?.click()}
                                                        disabled={uploadingFooterLogo}
                                                        className="h-6 px-2 text-[9px] font-bold bg-white/95 text-gray-800 rounded shadow-xs"
                                                    >
                                                        <Upload size={10} className="mr-0.5" /> {t("change_background")}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="destructive"
                                                        onClick={() => setSettings({
                                                            ...settings,
                                                            header_footer_sections: {
                                                                ...settings.header_footer_sections,
                                                                footer_logo: "",
                                                            }
                                                        })}
                                                        className="h-6 w-6 bg-rose-600 text-white rounded shadow-xs"
                                                    >
                                                        <Trash2 size={11} />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {settings.website_template === "imadrasha" && (
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                {t("footer_arabic_title")}
                                            </Label>
                                            <Input
                                                dir="rtl"
                                                value={settings.header_footer_sections?.footer_arabic_title ?? "مدرسة البنات دار الحديث انواره بيغم محمدفور"}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    header_footer_sections: {
                                                        ...settings.header_footer_sections,
                                                        footer_arabic_title: e.target.value,
                                                    }
                                                })}
                                                className="h-9 text-xs rounded-lg bg-white border-emerald-200/60 font-serif text-emerald-900"
                                                placeholder="مدرسة البنات دار الحديث انواره بيغم محمدفور"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                {settings.website_template === "imadrasha" ? t("footer_madrasa_name") : t("institute_name")}
                                            </Label>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {settings.header_footer_sections?.footer_show_school_name !== false && settings.header_footer_sections?.footer_show_institute_name !== false ? t("enabled") : t("disabled")}
                                                </span>
                                                <Switch
                                                    checked={settings.header_footer_sections?.footer_show_school_name !== false && settings.header_footer_sections?.footer_show_institute_name !== false}
                                                    onCheckedChange={(v) => setSettings({
                                                        ...settings,
                                                        header_footer_sections: {
                                                            ...settings.header_footer_sections,
                                                            footer_show_school_name: v,
                                                            footer_show_institute_name: v,
                                                        }
                                                    })}
                                                    className="data-[state=checked]:bg-emerald-600 scale-90"
                                                />
                                            </div>
                                        </div>
                                        <Input
                                            value={settings.header_footer_sections?.footer_madrasa_name ?? settings.header_footer_sections?.footer_school_name ?? (settings.website_template === "imadrasha" ? "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মদপুর" : settings.institute_name || "Bhujpur Government Primary School")}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                header_footer_sections: {
                                                    ...settings.header_footer_sections,
                                                    footer_madrasa_name: e.target.value,
                                                    footer_school_name: e.target.value,
                                                    institute_name: e.target.value,
                                                }
                                            })}
                                            className="h-9 text-xs font-bold rounded-lg bg-white border-emerald-200/60 text-gray-800"
                                            placeholder={settings.website_template === "imadrasha" ? "আনোয়ারা বেগম মহিলা টাইটেল মাদ্রাসা মোহাম্মদপুর" : "Bhujpur Government Primary School"}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                            {t("footer_about_text")}
                                        </Label>
                                        <Textarea
                                            value={settings.header_footer_sections?.footer_about_text ?? (settings.website_template === "imadrasha" ? "মা খাদিজা (রা.) ও আয়েশা (রা.)-এর আদর্শে অনুকরণীয় নারীসমাজ গঠনের লক্ষ্যে প্রতিষ্ঠিত এক ঐতিহ্যবাহী দ্বীনি শিক্ষাপ্রতিষ্ঠান।" : "Empowering minds, fostering creativity, and building a brighter future with quality education and moral integrity.")}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                header_footer_sections: {
                                                    ...settings.header_footer_sections,
                                                    footer_about_text: e.target.value,
                                                }
                                            })}
                                            className="min-h-[85px] text-[11px] leading-relaxed rounded-lg bg-white border-emerald-200/60"
                                            placeholder={settings.website_template === "imadrasha" ? "মা খাদিজা (রা.) ও আয়েশা (রা.)-এর আদর্শে অনুকরণীয় নারীসমাজ গঠনের লক্ষ্যে প্রতিষ্ঠিত এক ঐতিহ্যবাহী দ্বীনি শিক্ষাপ্রতিষ্ঠান।" : "School overview and mission statement..."}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                {t("footer_established_year")}
                                            </Label>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {settings.header_footer_sections?.footer_show_established_year !== false ? t("enabled") : t("disabled")}
                                                </span>
                                                <Switch
                                                    checked={settings.header_footer_sections?.footer_show_established_year !== false}
                                                    onCheckedChange={(v) => setSettings({
                                                        ...settings,
                                                        header_footer_sections: {
                                                            ...settings.header_footer_sections,
                                                            footer_show_established_year: v,
                                                        }
                                                    })}
                                                    className="data-[state=checked]:bg-emerald-600 scale-90"
                                                />
                                            </div>
                                        </div>
                                        <Input
                                            value={settings.header_footer_sections?.footer_established_year ?? (settings.website_template === "imadrasha" ? "স্থাপিত: ২০০৬ খ্রিস্টাব্দ" : "Est. 1995")}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                header_footer_sections: {
                                                    ...settings.header_footer_sections,
                                                    footer_established_year: e.target.value,
                                                }
                                            })}
                                            className="h-9 text-xs font-semibold text-amber-700 rounded-lg bg-white border-emerald-200/60"
                                            placeholder={settings.website_template === "imadrasha" ? "স্থাপিত: ২০০৬ খ্রিস্টাব্দ" : "Est. 1995"}
                                        />
                                    </div>

                                    {/* Column 1 Bottom: Social Link Insert Functionality */}
                                    <div className="pt-3 border-t border-emerald-100 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Share2 size={13} className="text-emerald-700 stroke-[2.5px]" />
                                                <Label className="text-[10px] font-extrabold uppercase text-emerald-950 tracking-wider">
                                                    {t("footer_column1_social")}
                                                </Label>
                                            </div>
                                            <Switch
                                                checked={settings.header_footer_sections?.footer_show_social !== false}
                                                onCheckedChange={(v) => setSettings({
                                                    ...settings,
                                                    header_footer_sections: {
                                                        ...settings.header_footer_sections,
                                                        footer_show_social: v,
                                                    }
                                                })}
                                                className="data-[state=checked]:bg-emerald-600 scale-90"
                                            />
                                        </div>

                                        {settings.header_footer_sections?.footer_show_social !== false && (
                                            <div className="space-y-2 pt-1 bg-white p-2.5 rounded-lg border border-emerald-100">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600">
                                                        <Facebook className="h-3 w-3 text-blue-600" />
                                                        <span>{t("facebook_url")}</span>
                                                    </div>
                                                    <Input
                                                        value={((settings.header_footer_sections?.footer_social_links as Record<string, string>)?.facebook ?? settings.social_media?.facebook) || ""}
                                                        onChange={(e) => updateFooterSocial("facebook", e.target.value)}
                                                        className="h-7 text-[11px] rounded bg-gray-50/50 border-gray-200"
                                                        placeholder="https://facebook.com/..."
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600">
                                                        <Youtube className="h-3 w-3 text-rose-600" />
                                                        <span>{t("youtube_url")}</span>
                                                    </div>
                                                    <Input
                                                        value={((settings.header_footer_sections?.footer_social_links as Record<string, string>)?.youtube ?? settings.social_media?.youtube) || ""}
                                                        onChange={(e) => updateFooterSocial("youtube", e.target.value)}
                                                        className="h-7 text-[11px] rounded bg-gray-50/50 border-gray-200"
                                                        placeholder="https://youtube.com/@..."
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600">
                                                        <Twitter className="h-3 w-3 text-sky-500" />
                                                        <span>{t("twitter_url")}</span>
                                                    </div>
                                                    <Input
                                                        value={((settings.header_footer_sections?.footer_social_links as Record<string, string>)?.twitter ?? settings.social_media?.twitter) || ""}
                                                        onChange={(e) => updateFooterSocial("twitter", e.target.value)}
                                                        className="h-7 text-[11px] rounded bg-gray-50/50 border-gray-200"
                                                        placeholder="https://x.com/..."
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600">
                                                        <Instagram className="h-3 w-3 text-pink-600" />
                                                        <span>{t("instagram_url")}</span>
                                                    </div>
                                                    <Input
                                                        value={((settings.header_footer_sections?.footer_social_links as Record<string, string>)?.instagram ?? settings.social_media?.instagram) || ""}
                                                        onChange={(e) => updateFooterSocial("instagram", e.target.value)}
                                                        className="h-7 text-[11px] rounded bg-gray-50/50 border-gray-200"
                                                        placeholder="https://instagram.com/..."
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600">
                                                        <Phone className="h-3 w-3 text-emerald-600" />
                                                        <span>{t("whatsapp_url")}</span>
                                                    </div>
                                                    <Input
                                                        value={((settings.header_footer_sections?.footer_social_links as Record<string, string>)?.whatsapp ?? settings.social_media?.whatsapp) || ""}
                                                        onChange={(e) => updateFooterSocial("whatsapp", e.target.value)}
                                                        className="h-7 text-[11px] rounded bg-gray-50/50 border-gray-200"
                                                        placeholder="https://wa.me/... or +8801..."
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600">
                                                        <Linkedin className="h-3 w-3 text-blue-700" />
                                                        <span>{t("linkedin_url")}</span>
                                                    </div>
                                                    <Input
                                                        value={((settings.header_footer_sections?.footer_social_links as Record<string, string>)?.linkedin ?? settings.social_media?.linkedin) || ""}
                                                        onChange={(e) => updateFooterSocial("linkedin", e.target.value)}
                                                        className="h-7 text-[11px] rounded bg-gray-50/50 border-gray-200"
                                                        placeholder="https://linkedin.com/in/..."
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* COLUMN 2: ACADEMIC DEPARTMENTS / PROGRAMS */}
                            <div className="p-4 rounded-xl border border-emerald-100 bg-[#f9fbf9] flex flex-col justify-between space-y-4">
                                <div className="space-y-3.5">
                                    <div className="flex items-center gap-2 pb-2 border-b border-emerald-100/80">
                                        <div className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                                            ২
                                        </div>
                                        <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                                            {settings.website_template === "ischool" ? t("column_2_programs") : t("column_2_departments")}
                                        </h3>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                            {t("footer_info_label")}
                                        </Label>
                                        <Input
                                            value={settings.header_footer_sections?.footer_info_label || (settings.website_template === "imadrasha" ? "জামিয়ার শিক্ষাবিভাগ" : "Academic Programs")}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                header_footer_sections: {
                                                    ...settings.header_footer_sections,
                                                    footer_info_label: e.target.value,
                                                }
                                            })}
                                            className="h-9 text-xs font-bold rounded-lg bg-white border-emerald-200/60 text-gray-800"
                                            placeholder={settings.website_template === "imadrasha" ? "জামিয়ার শিক্ষাবিভাগ" : "Academic Programs"}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                {t("footer_department_links")}
                                            </Label>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    const isSchoolTpl = settings.website_template === "ischool";
                                                    const fallbackList = isSchoolTpl ? [
                                                        { title: "Online Admission", url: "/online_admission" },
                                                        { title: "Academics", url: "/academics" },
                                                        { title: "Login", url: "/login" },
                                                    ] : [
                                                        { title: "নুরানি ও নাজেরা বিভাগ", url: "#departments" },
                                                        { title: "হিফজুল কুরআন বিভাগ", url: "#departments" },
                                                        { title: "কিতাব ও দাওরায়ে হাদিস বিভাগ", url: "#departments" },
                                                        { title: "আইটি ও কম্পিউটার প্রশিক্ষণ", url: "#departments" },
                                                        { title: "কারিগরি ও সেলাই প্রশিক্ষণ", url: "#departments" },
                                                    ];
                                                    const cur = settings.header_footer_sections?.footer_department_links || fallbackList;
                                                    setSettings({
                                                        ...settings,
                                                        header_footer_sections: {
                                                            ...settings.header_footer_sections,
                                                            footer_department_links: [...cur, { title: isSchoolTpl ? "New Program" : "নতুন বিভাগ", url: isSchoolTpl ? "#courses" : "#departments" }]
                                                        }
                                                    });
                                                }}
                                                className="h-6 px-2 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/60"
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                {t("add_department_link")}
                                            </Button>
                                        </div>

                                        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                            {(() => {
                                                const isSchoolTpl = settings.website_template === "ischool";
                                                const fallbackList = isSchoolTpl ? [
                                                    { title: "Online Admission", url: "/online_admission" },
                                                    { title: "Academics", url: "/academics" },
                                                    { title: "Login", url: "/login" },
                                                ] : [
                                                    { title: "নুরানি ও নাজেরা বিভাগ", url: "#departments" },
                                                    { title: "হিফজুল কুরআন বিভাগ", url: "#departments" },
                                                    { title: "কিতাব ও দাওরায়ে হাদিস বিভাগ", url: "#departments" },
                                                    { title: "আইটি ও কম্পিউটার প্রশিক্ষণ", url: "#departments" },
                                                    { title: "কারিগরি ও সেলাই প্রশিক্ষণ", url: "#departments" },
                                                ];
                                                const deptLinks = settings.header_footer_sections?.footer_department_links || fallbackList;
                                                return deptLinks.map((item, idx) => (
                                                <div key={idx} className="p-2 rounded-lg bg-white border border-gray-200/70 shadow-2xs space-y-1.5 relative group">
                                                    <div className="flex items-center gap-1.5">
                                                        <Input
                                                            value={item.title}
                                                            onChange={(e) => {
                                                                const list = [...deptLinks];
                                                                list[idx] = { ...list[idx], title: e.target.value };
                                                                setSettings({
                                                                    ...settings,
                                                                    header_footer_sections: {
                                                                        ...settings.header_footer_sections,
                                                                        footer_department_links: list,
                                                                    }
                                                                });
                                                            }}
                                                            className="h-7 text-[11px] rounded-md bg-transparent border-gray-200"
                                                            placeholder={t("link_title")}
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                const list = deptLinks.filter((_, i) => i !== idx);
                                                                setSettings({
                                                                    ...settings,
                                                                    header_footer_sections: {
                                                                        ...settings.header_footer_sections,
                                                                        footer_department_links: list,
                                                                    }
                                                                });
                                                            }}
                                                            className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                    <Input
                                                        value={item.url || ""}
                                                        onChange={(e) => {
                                                            const list = [...deptLinks];
                                                            list[idx] = { ...list[idx], url: e.target.value };
                                                            setSettings({
                                                                ...settings,
                                                                header_footer_sections: {
                                                                    ...settings.header_footer_sections,
                                                                    footer_department_links: list,
                                                                }
                                                            });
                                                        }}
                                                        className="h-6 text-[10px] text-gray-500 font-mono rounded-md bg-gray-50/50 border-gray-100"
                                                        placeholder={t("link_url")}
                                                    />
                                                </div>
                                            ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMN 3: QUICK LINKS */}
                            <div className="p-4 rounded-xl border border-emerald-100 bg-[#f9fbf9] flex flex-col justify-between space-y-4">
                                <div className="space-y-3.5">
                                    <div className="flex items-center gap-2 pb-2 border-b border-emerald-100/80">
                                        <div className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                                            ৩
                                        </div>
                                        <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                                            {t("column_3_links")}
                                        </h3>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                            {t("footer_quick_links_label")}
                                        </Label>
                                        <Input
                                            value={settings.header_footer_sections?.footer_menu_label || (settings.website_template === "imadrasha" ? "জরুরি লিংকসমূহ" : "Quick Links")}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                header_footer_sections: {
                                                    ...settings.header_footer_sections,
                                                    footer_menu_label: e.target.value,
                                                }
                                            })}
                                            className="h-9 text-xs font-bold rounded-lg bg-white border-emerald-200/60 text-gray-800"
                                            placeholder={settings.website_template === "imadrasha" ? "জরুরি লিংকসমূহ" : "Quick Links"}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                                {t("footer_quick_links")}
                                            </Label>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    const isSchoolTpl = settings.website_template === "ischool";
                                                    const fallbackList = isSchoolTpl ? [
                                                        { title: "Notices", url: "/notices" },
                                                        { title: "About Us", url: "#about-us" },
                                                        { title: "Contact Us", url: "/contact-us" },
                                                    ] : [
                                                        { title: "অনলাইন ভর্তি আবেদন", url: "/online_admission" },
                                                        { title: "মাদরাসা নোটিশ বোর্ড", url: "#notices" },
                                                        { title: "মাদ্রাসা পরিচিতি ও ইতিহাস", url: "#about-madrasa" },
                                                        { title: "মুহতামিম সাহেবের বাণী", url: "#muhtamim" },
                                                        { title: "শিক্ষক ও পরিচালকমণ্ডলী", url: "#faculty" },
                                                        { title: "এডমিন / শিক্ষক লগইন", url: "/login" },
                                                    ];
                                                    const cur = settings.header_footer_sections?.footer_quick_links || fallbackList;
                                                    setSettings({
                                                        ...settings,
                                                        header_footer_sections: {
                                                            ...settings.header_footer_sections,
                                                            footer_quick_links: [...cur, { title: isSchoolTpl ? "New Link" : "নতুন লিংক", url: "#" }]
                                                        }
                                                    });
                                                }}
                                                className="h-6 px-2 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/60"
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                {t("add_quick_link")}
                                            </Button>
                                        </div>

                                        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                            {(() => {
                                                const isSchoolTpl = settings.website_template === "ischool";
                                                const fallbackList = isSchoolTpl ? [
                                                    { title: "Notices", url: "/notices" },
                                                    { title: "About Us", url: "#about-us" },
                                                    { title: "Contact Us", url: "/contact-us" },
                                                ] : [
                                                    { title: "অনলাইন ভর্তি আবেদন", url: "/online_admission" },
                                                    { title: "মাদরাসা নোটিশ বোর্ড", url: "#notices" },
                                                    { title: "মাদ্রাসা পরিচিতি ও ইতিহাস", url: "#about-madrasa" },
                                                    { title: "মুহতামিম সাহেবের বাণী", url: "#muhtamim" },
                                                    { title: "শিক্ষক ও পরিচালকমণ্ডলী", url: "#faculty" },
                                                    { title: "এডমিন / শিক্ষক লগইন", url: "/login" },
                                                ];
                                                const quickLinks = settings.header_footer_sections?.footer_quick_links || fallbackList;
                                                return quickLinks.map((item, idx) => (
                                                <div key={idx} className="p-2 rounded-lg bg-white border border-gray-200/70 shadow-2xs space-y-1.5 relative group">
                                                    <div className="flex items-center gap-1.5">
                                                        <Input
                                                            value={item.title}
                                                            onChange={(e) => {
                                                                const list = [...quickLinks];
                                                                list[idx] = { ...list[idx], title: e.target.value };
                                                                setSettings({
                                                                    ...settings,
                                                                    header_footer_sections: {
                                                                        ...settings.header_footer_sections,
                                                                        footer_quick_links: list,
                                                                    }
                                                                });
                                                            }}
                                                            className="h-7 text-[11px] rounded-md bg-transparent border-gray-200"
                                                            placeholder={t("link_title")}
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                const list = quickLinks.filter((_, i) => i !== idx);
                                                                setSettings({
                                                                    ...settings,
                                                                    header_footer_sections: {
                                                                        ...settings.header_footer_sections,
                                                                        footer_quick_links: list,
                                                                    }
                                                                });
                                                            }}
                                                            className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 shrink-0"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                    <Input
                                                        value={item.url || ""}
                                                        onChange={(e) => {
                                                            const list = [...quickLinks];
                                                            list[idx] = { ...list[idx], url: e.target.value };
                                                            setSettings({
                                                                ...settings,
                                                                header_footer_sections: {
                                                                    ...settings.header_footer_sections,
                                                                    footer_quick_links: list,
                                                                }
                                                            });
                                                        }}
                                                        className="h-6 text-[10px] text-gray-500 font-mono rounded-md bg-gray-50/50 border-gray-100"
                                                        placeholder={t("link_url")}
                                                    />
                                                </div>
                                            ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMN 4: CONTACT INFORMATION */}
                            <div className="p-4 rounded-xl border border-emerald-100 bg-[#f9fbf9] flex flex-col justify-between space-y-4">
                                <div className="space-y-3.5">
                                    <div className="flex items-center gap-2 pb-2 border-b border-emerald-100/80">
                                        <div className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                                            ৪
                                        </div>
                                        <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
                                            {t("column_4_contact")}
                                        </h3>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                            {t("footer_contact_info_label")}
                                        </Label>
                                        <Input
                                            value={settings.header_footer_sections?.footer_contact_info_label || (settings.website_template === "imadrasha" ? "যোগাযোগের ঠিকানা" : "Contact Details")}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                header_footer_sections: {
                                                    ...settings.header_footer_sections,
                                                    footer_contact_info_label: e.target.value,
                                                }
                                            })}
                                            className="h-9 text-xs font-bold rounded-lg bg-white border-emerald-200/60 text-gray-800"
                                            placeholder={settings.website_template === "imadrasha" ? "যোগাযোগের ঠিকানা" : "Contact Details"}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                            {t("footer_address")}
                                        </Label>
                                        <Textarea
                                            value={settings.header_footer_sections?.footer_address ?? settings.header_footer_sections?.madrasa_address ?? settings.header_footer_sections?.school_address ?? (settings.website_template === "imadrasha" ? "১২ নং গিয়াসনগর ইউনিয়ন, মোহাম্মদপুর, মৌলভীবাজার সদর, মৌলভীবাজার" : "Bhujpur, Fatikchhari, Chattogram, Bangladesh")}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                header_footer_sections: {
                                                    ...settings.header_footer_sections,
                                                    footer_address: e.target.value,
                                                    madrasa_address: e.target.value,
                                                    school_address: e.target.value,
                                                }
                                            })}
                                            className="min-h-[75px] text-[11px] leading-relaxed rounded-lg bg-white border-emerald-200/60 text-gray-800"
                                            placeholder={settings.website_template === "imadrasha" ? "১২ নং গিয়াসনগর ইউনিয়ন, মোহাম্মদপুর, মৌলভীবাজার সদর, মৌলভীবাজার" : "School Address, City, Country"}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                            {t("footer_phone")}
                                        </Label>
                                        <Input
                                            value={settings.header_footer_sections?.footer_phone ?? settings.header_footer_sections?.madrasa_phone ?? settings.header_footer_sections?.school_phone ?? (settings.website_template === "imadrasha" ? "+8801719606713" : "+880 1812-345678")}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                header_footer_sections: {
                                                    ...settings.header_footer_sections,
                                                    footer_phone: e.target.value,
                                                    madrasa_phone: e.target.value,
                                                    school_phone: e.target.value,
                                                }
                                            })}
                                            className="h-9 text-xs font-semibold rounded-lg bg-white border-emerald-200/60 text-gray-800"
                                            placeholder={settings.website_template === "imadrasha" ? "+8801719606713" : "+880 1812-345678"}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                                            {t("footer_email")}
                                        </Label>
                                        <Input
                                            value={settings.header_footer_sections?.footer_email ?? settings.header_footer_sections?.madrasa_email ?? settings.header_footer_sections?.school_email ?? (settings.website_template === "imadrasha" ? "anwarabegumgirlsmadrasa@gmail.com" : "info@bhujpurschool.edu.bd")}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                header_footer_sections: {
                                                    ...settings.header_footer_sections,
                                                    footer_email: e.target.value,
                                                    madrasa_email: e.target.value,
                                                    school_email: e.target.value,
                                                }
                                            })}
                                            className="h-9 text-xs font-semibold rounded-lg bg-white border-emerald-200/60 text-gray-800"
                                            placeholder={settings.website_template === "imadrasha" ? "anwarabegumgirlsmadrasa@gmail.com" : "info@bhujpurschool.edu.bd"}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* BOTTOM BAR / COPYRIGHT & POWERED BY */}
                        <div className="p-4 rounded-xl border border-gray-200/70 bg-gray-50/60 space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60">
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    {t("bottom_bar_settings")}
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">{t("copyright_text")}</Label>
                                    <Input
                                        value={settings.header_footer_sections?.copyright_text ?? settings.footer_text ?? (settings.website_template === "imadrasha" ? "© All Rights reserved by Anwara Begum Girls Titel Madrasha Muhammadpur" : "© All Rights Reserved. iSchool Management System.")}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            footer_text: e.target.value,
                                            header_footer_sections: {
                                                ...settings.header_footer_sections,
                                                copyright_text: e.target.value,
                                            }
                                        })}
                                        className="h-9 text-xs rounded-lg bg-white border-gray-200 text-gray-800"
                                        placeholder={settings.website_template === "imadrasha" ? "© All Rights reserved by Anwara Begum Girls Titel Madrasha Muhammadpur" : "© All Rights Reserved. iSchool Management System."}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">{t("footer_powered_by_text")}</Label>
                                    <Input
                                        value={settings.header_footer_sections?.footer_powered_by_text ?? (settings.website_template === "imadrasha" ? "চালিত হচ্ছে: iSchool Management System" : "Powered by iSchool Management System")}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            header_footer_sections: {
                                                ...settings.header_footer_sections,
                                                footer_powered_by_text: e.target.value,
                                            }
                                        })}
                                        className="h-9 text-xs rounded-lg bg-white border-gray-200 text-amber-700 font-semibold"
                                        placeholder={settings.website_template === "imadrasha" ? "চালিত হচ্ছে: iSchool Management System" : "Powered by iSchool Management System"}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                </TabsContent>

                <TabsContent value="pages" className="space-y-6">
                    <PagesTab />
                </TabsContent>

                <TabsContent value="menus" className="space-y-6">
                    <MenusTab />
                </TabsContent>

                <TabsContent value="banners" className="space-y-6">
                    <BannersTab />
                </TabsContent>

                {/* HEADER / FOOTER CUSTOM CODE TAB */}
                <TabsContent value="header_footer" className="space-y-6">
                    <HeaderFooterTab 
                        headerCode={settings.header_code || ""}
                        bodyCode={settings.body_code || ""}
                        footerCode={settings.footer_code || ""}
                        onChangeHeaderCode={(val) => setSettings((prev) => ({ 
                            ...prev, 
                            header_code: val,
                            header_footer_sections: {
                                ...prev.header_footer_sections,
                                header_code: val
                            }
                        }))}
                        onChangeBodyCode={(val) => setSettings((prev) => ({ 
                            ...prev, 
                            body_code: val,
                            header_footer_sections: {
                                ...prev.header_footer_sections,
                                body_code: val
                            }
                        }))}
                        onChangeFooterCode={(val) => setSettings((prev) => ({ 
                            ...prev, 
                            footer_code: val,
                            header_footer_sections: {
                                ...prev.header_footer_sections,
                                footer_code: val
                            }
                        }))}
                        onSave={handleSave}
                        saving={saving}
                    />
                </TabsContent>

                {/* SOCIAL LINKS TAB */}
                <TabsContent value="social" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 space-y-6">
                        <div className="border-b border-gray-50 pb-4">
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{t("social_media_links")}</h2>
                            <p className="text-[11px] text-gray-400">{t("configure_social_media_links_desc")}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.keys(settings.social_media || {}).map((platform) => (
                                <div key={platform} className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">{t(platform) || platform.replace(/_/g, ' ')}</Label>
                                    <Input
                                        value={settings.social_media[platform] || ""}
                                        onChange={(e) => updateSocialField(platform, e.target.value)}
                                        className="h-9 text-[11px] rounded-lg bg-gray-50/30"
                                        placeholder={`https://${platform}.com/...`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Sticky Save Bar only for CMS general settings tabs */}
            {["system", "social", "sections", "header_footer"].includes(activeTab) && (
                <div className="sticky bottom-6 z-20 flex justify-end">
                    <Button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:opacity-95 transition-all text-sm h-auto flex items-center gap-2 cursor-pointer"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? t("saving") : t("save_changes")}
                    </Button>
                </div>
            )}
        </div>
    );
}

export default function FrontCmsSettingPage() {
    return (
        <Suspense fallback={<div className="p-8 flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>}>
            <FrontCmsSettingContent />
        </Suspense>
    );
}
