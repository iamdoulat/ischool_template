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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
    Sun,
    Moon,
    Grid2X2,
    LayoutGrid,
    MoveHorizontal,
    Maximize,
    Minimize,
    Palette,
    Image as ImageIcon,
    Loader2,
    Upload,
    RefreshCw,
    Clock,
    Trash2,
    Settings,
    Search,
    ChevronDown,
    CheckCircle2,
    AlertTriangle,
    Save,
    MessageSquare,
    Check,
    Users,
    GraduationCap,
    UserCheck,
    ShieldCheck
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import axios from "axios";
import { useEffect } from "react";
import { useSettings } from "@/components/providers/settings-provider";
import api from "@/lib/api";
import { getImageUrl, useImageUrl } from "@/lib/image-url";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";

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

function LogoCard({
    title,
    field,
    dimensions,
    value,
    onUpload,
    onSaveSuccess,
    t,
}: {
    title: string;
    field: string;
    dimensions: string;
    value: string;
    onUpload?: (field: string, file: File) => Promise<string | null>;
    onSaveSuccess?: (field: string, newUrl: string) => void;
    t?: (key: string) => string;
}) {
    const [uploading, setUploading] = useState(false);
    const [imgErrorState, setImgErrorState] = useState<'initial' | 'proxy' | 'failed'>('initial');
    const getImageUrl = useImageUrl();
    const tr = t || ((key: string) => key);

    const defaultLogos: Record<string, string> = {
        print_logo: "/logo-print.png",
        admin_logo: "/logo-admin.png",
        admin_small_logo: "/logo-admin-small.png",
        app_logo: "/logo-app.png",
        favicon: "/logo-admin-small.png",
        app_favicon: "/logo-admin-small.png",
        pwa_icon_512: "/logo-app.png",
        pwa_icon_192: "/logo-app.png",
        pwa_icon_maskable: "/logo-app.png",
        login_page_background_admin: "/bg-admin.jpg",
        login_page_background_user: "/bg-user.jpg",
    };

    useEffect(() => {
        setImgErrorState('initial');
    }, [value, field]);

    const effectiveValue = value || defaultLogos[field] || "";
    const primaryUrl = effectiveValue ? getImageUrl(effectiveValue) : (defaultLogos[field] || "");
    const displaySrc = (imgErrorState === 'proxy' && primaryUrl && (primaryUrl.startsWith('http://') || primaryUrl.startsWith('https://')))
        ? `/api/proxy-image?url=${encodeURIComponent(primaryUrl)}`
        : (primaryUrl || defaultLogos[field] || "/logo-print.png");

    const handleImageError = () => {
        if (imgErrorState === 'initial' && primaryUrl && (primaryUrl.startsWith('http://') || primaryUrl.startsWith('https://'))) {
            setImgErrorState('proxy');
        } else {
            setImgErrorState('failed');
        }
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            const newUrl = onUpload ? await onUpload(field, file) : null;
            setUploading(false);
            e.target.value = "";
            if (newUrl) {
                setImgErrorState('initial');
                if (onSaveSuccess) onSaveSuccess(field, newUrl);
            }
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-lg p-4 space-y-4 flex flex-col items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-300 min-h-[220px]">
            <div className="w-full text-left">
                <h3 className="text-xs font-bold text-gray-700">{title}</h3>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-3 w-full py-2">
                <div className="relative group overflow-hidden rounded-md border border-gray-50 bg-gray-50/50 flex items-center justify-center p-2 min-h-[100px] w-full">
                    {effectiveValue && imgErrorState !== 'failed' ? (
                        <img
                            key={`${field}-${effectiveValue}-${imgErrorState}`}
                            src={displaySrc}
                            alt={title}
                            onError={handleImageError}
                            className="max-h-20 object-contain transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <ImageIcon className="h-10 w-10 text-gray-300" />
                    )}
                    {uploading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 font-bold text-xs uppercase tracking-tight text-indigo-100">
                            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                        </div>
                    )}
                </div>
                <div className="px-2 py-0.5 rounded border border-indigo-100 bg-indigo-50/30">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-tight">({dimensions})</span>
                </div>
            </div>

            <div className="w-full">
                <input
                    type="file"
                    id={`upload-${field}`}
                    className="hidden"
                    accept="image/*"
                    onChange={onFileChange}
                    disabled={uploading}
                />
                <Button
                    variant="ghost"
                    asChild
                    disabled={uploading}
                    className="w-full h-8 text-xs font-bold text-[#FF9800] hover:text-[#6366F1] bg-gray-50 hover:bg-indigo-50 transition-all rounded-full shadow-sm"
                >
                    <label htmlFor={`upload-${field}`} className="cursor-pointer flex items-center justify-center gap-2">
                        {uploading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Upload className="h-3 w-3" />
                        )}
                        {tr("update")}
                    </label>
                </Button>
            </div>
        </div>
    );
}

export default function GeneralSettingPage() {
    const { t } = useTranslation();
    const { refreshSettings, updateSettingsLocal } = useSettings();
    const [activeTab, setActiveTab] = useState("General Setting");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        school_name: "",
        header_desktop_font_size: "22",
        header_mobile_font_size: "14",
        school_slogan: "",
        school_description: "",
        school_code: "",
        address: "",
        phone: "",
        email: "",
        session: "",
        session_start_month: "",
        date_format: "",
        timezone: "",
        start_day_of_week: "",
        time_format: "12",
        currency_format: "",
        base_url: "",
        file_upload_path: "",
        print_logo: "",
        admin_logo: "",
        admin_small_logo: "",
        app_logo: "",
        favicon: "",
        pwa_icon_512: "",
        pwa_icon_192: "",
        pwa_icon_maskable: "",
        pwa_app_short_name: "",
        pwa_app_description: "",
        login_page_background_admin: "",
        login_page_background_user: "",
        theme_mode: "light",
        skins: "shadow",
        side_menu: "expanded",
        primary_color: "#4f46e5",
        school_name_title_color: "#6366f1",
        box_content: "wide",
        mobile_api_url: "",
        mobile_primary_color: "#424242",
        mobile_secondary_color: "#E7F1EE",
        student_login: true,
        parent_login: true,
        student_login_admission_no: true,
        student_login_mobile_no: false,
        student_login_email: false,
        parent_login_mobile_no: true,
        parent_login_email: false,
        allow_student_to_add_timeline: false,
        enable_chat: true,
        attendance_type: "day_wise",
        biometric_attendance: false,
        devices: "",
        low_attendance_limit: "75.00",
        staff_attendance_settings: [
            {
                role: 'Super Admin', settings: [
                    { type: 'Present (P)', from: '08:45:00', upto: '09:05:00', total: '09:00:00' },
                    { type: 'Late (L)', from: '09:05:00', upto: '09:15:00', total: '09:00:00' },
                    { type: 'Half Day (F)', from: '09:15:00', upto: '09:30:00', total: '05:00:00' },
                    { type: 'Half Day (Second Half) (SH)', from: '12:00:00', upto: '12:30:00', total: '05:00:00' },
                ]
            },
            {
                role: 'Admin', settings: [
                    { type: 'Present (P)', from: '08:45:00', upto: '09:05:00', total: '09:00:00' },
                    { type: 'Late (L)', from: '09:05:00', upto: '09:15:00', total: '09:00:00' },
                    { type: 'Half Day (F)', from: '09:15:00', upto: '09:30:00', total: '05:00:00' },
                    { type: 'Half Day (Second Half) (SH)', from: '12:00:00', upto: '12:30:00', total: '05:00:00' },
                ]
            },
            {
                role: 'Teacher', settings: [
                    { type: 'Present (P)', from: '08:45:00', upto: '09:05:00', total: '09:00:00' },
                    { type: 'Late (L)', from: '09:05:00', upto: '09:15:00', total: '09:00:00' },
                    { type: 'Half Day (F)', from: '09:15:00', upto: '09:30:00', total: '05:00:00' },
                    { type: 'Half Day (Second Half) (SH)', from: '12:00:00', upto: '12:30:00', total: '05:00:00' },
                ]
            },
            {
                role: 'Accountant', settings: [
                    { type: 'Present (P)', from: '08:45:00', upto: '09:05:00', total: '09:00:00' },
                    { type: 'Late (L)', from: '09:05:00', upto: '09:15:00', total: '09:00:00' },
                    { type: 'Half Day (F)', from: '09:15:00', upto: '09:30:00', total: '05:00:00' },
                    { type: 'Half Day (Second Half) (SH)', from: '12:00:00', upto: '12:30:00', total: '05:00:00' },
                ]
            },
            {
                role: 'Librarian', settings: [
                    { type: 'Present (P)', from: '08:45:00', upto: '09:05:00', total: '09:00:00' },
                    { type: 'Late (L)', from: '09:05:00', upto: '09:15:00', total: '09:00:00' },
                    { type: 'Half Day (F)', from: '09:15:00', upto: '09:30:00', total: '05:00:00' },
                    { type: 'Half Day (Second Half) (SH)', from: '12:00:00', upto: '12:30:00', total: '05:00:00' },
                ]
            },
            {
                role: 'Receptionist', settings: [
                    { type: 'Present (P)', from: '08:45:00', upto: '09:05:00', total: '09:00:00' },
                    { type: 'Late (L)', from: '09:05:00', upto: '09:15:00', total: '09:00:00' },
                    { type: 'Half Day (F)', from: '09:15:00', upto: '09:30:00', total: '05:00:00' },
                    { type: 'Half Day (Second Half) (SH)', from: '12:00:00', upto: '12:30:00', total: '05:00:00' },
                ]
            },
        ],
        student_attendance_settings: [] as any[],

        // Google Drive
        google_client_id: "",
        google_api_key: "",
        google_project_number: "",
        google_status: false,
        google_allow_student: false,
        google_allow_guardian: false,
        google_allow_staff: false,

        // Whatsapp
        whatsapp_front_site_status: false,
        whatsapp_front_site_mobile: "",
        whatsapp_front_site_from: "",
        whatsapp_front_site_to: "",

        whatsapp_admin_panel_status: false,
        whatsapp_admin_panel_mobile: "",
        whatsapp_admin_panel_from: "",
        whatsapp_admin_panel_to: "",

        whatsapp_student_panel_status: false,
        whatsapp_student_panel_mobile: "",
        whatsapp_student_panel_from: "",
        whatsapp_student_panel_to: "",

        // Chat
        chat_student_delete: false,
        chat_guardian_delete: false,
        chat_staff_delete: false,

        // Maintenance
        maintenance_mode: false,

        // ID Auto Generation
        auto_admission_no: false,
        admission_no_prefix: "",
        admission_no_digit: 4,
        admission_start_from: "",
        auto_staff_id: false,
        staff_id_prefix: "",
        staff_no_digit: 4,
        staff_id_start_from: "",
        auto_roll_no: false,
        roll_no_prefix: "",
        roll_no_digit: 4,
        roll_no_start_from: "",

        auto_username: false,
        username_prefix: "",
        username_digit: 4,
        username_start_from: "",
        auto_parent_username: false,
        parent_username_prefix: "",
        parent_username_digit: 4,
        parent_username_start_from: "",

        // Income Invoice
        income_invoice_enable_auto_generation: false,
        income_invoice_prefix: "",
        income_invoice_digit: 4,
        income_invoice_start_from: "",

        // Expense Invoice
        expense_invoice_enable_auto_generation: false,
        expense_invoice_prefix: "",
        expense_invoice_digit: 4,
        expense_invoice_start_from: "",

        // Certificate Auto Generation
        auto_student_certificate_no: true,
        student_certificate_prefix: "CERT-",
        student_certificate_digit: 4,
        student_certificate_start_from: "1",
        auto_transfer_certificate_no: true,
        transfer_certificate_prefix: "TC-",
        transfer_certificate_digit: 4,
        transfer_certificate_start_from: "1",

        // Fees
        fees_offline_bank_payment_in_student_panel: false,
        fees_offline_bank_payment_instruction: "",
        fees_lock_student_panel_if_fees_remaining: false,
        fees_print_fees_receipt_for: ["Office Copy", "Student Copy", "Bank Copy"],
        fees_due_days: 60,
        fees_single_page_print: true,
        fees_collect_fees_in_back_date: true,
        fees_student_guardian_panel_fees_discount: true,
        fees_display_previous_fees: true,
        fees_allow_student_to_add_partial_payment: true,

        // Miscellaneous
        online_exam_show_only_my_question: false,
        id_card_scan_code: "barcode",
        exam_result_page_in_front_site: false,
        exam_admit_card_download_in_student_panel: false,
        teacher_restricted_mode: false,
        superadmin_visibility: false,
        event_reminder: false,
        staff_apply_leave_notification_email: "",
        enable_multi_class_selection_in_student_admission_form: false,
        footer_contact_title: "Contact Us",
        footer_contact_info_label: "Contact Info",
        facebook_url: "",
        twitter_url: "",
        instagram_url: "",
        youtube_url: "",
        linkedin_url: "",
        pinterest_url: "",
        contact_form_receiver_email: "",
    });

    const { toast } = useToast();
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

    const [activeAttendanceTab, setActiveAttendanceTab] = useState<"Staff" | "Student">("Staff");
    const [selectedClassId, setSelectedClassId] = useState<string>("all");

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get("/system-setting/general-setting");
            if (response.data.status === "Success" || response.data.status === "success" || response.data.data) {
                const incomingData = response.data.data || response.data || {};

                setFormData(prev => {
                    const normalizedData: any = { ...prev };

                    Object.keys(prev).forEach(key => {
                        const value = incomingData[key];

                        // Handle boolean values
                        if (typeof (prev as any)[key] === 'boolean') {
                            normalizedData[key] = (value === 1 || value === true || value === '1' || value === 'true');
                        }
                        // Handle array values (e.g., student_attendance_settings, fees_print_fees_receipt_for)
                        else if (Array.isArray((prev as any)[key])) {
                            normalizedData[key] = Array.isArray(value) ? value : [];
                        }
                        // Handle numeric values
                        else if (typeof (prev as any)[key] === 'number') {
                            normalizedData[key] = (value !== null && value !== undefined) ? Number(value) : (prev as any)[key];
                        }
                        // Handle string values
                        else {
                            normalizedData[key] = (value !== null && value !== undefined) ? String(value) : "";
                        }
                    });

                    // Restore saved font sizes & logo fields from localStorage if backend value is empty
                    if (!normalizedData.header_desktop_font_size && typeof window !== 'undefined') {
                        const savedDesk = localStorage.getItem("header_desktop_font_size");
                        if (savedDesk) normalizedData.header_desktop_font_size = savedDesk;
                    }
                    if (!normalizedData.header_mobile_font_size && typeof window !== 'undefined') {
                        const savedMob = localStorage.getItem("header_mobile_font_size");
                        if (savedMob) normalizedData.header_mobile_font_size = savedMob;
                    }

                    // Restore PWA, logo, and text fields from localStorage if empty
                    const pwaTextAndLogoFields = [
                        'print_logo', 'admin_logo', 'admin_small_logo', 'app_logo', 'favicon',
                        'pwa_icon_512', 'pwa_icon_192', 'pwa_icon_maskable',
                        'pwa_app_short_name', 'pwa_app_description'
                    ];
                    pwaTextAndLogoFields.forEach(lf => {
                        if (!normalizedData[lf] && typeof window !== 'undefined') {
                            const savedVal = localStorage.getItem(`ischool_${lf}`);
                            if (savedVal) normalizedData[lf] = savedVal;
                        }
                    });

                    if (typeof window !== 'undefined') {
                        const savedChat = localStorage.getItem("ischool_enable_chat");
                        if (savedChat !== null) normalizedData.enable_chat = savedChat === "true";
                    }

                    return normalizedData;
                });
            }
        } catch (error) {
            console.error("Error fetching general settings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Real-time auto preview for theme, font size, and PWA fields
        const realTimeFields = ['theme_mode', 'skins', 'side_menu', 'primary_color', 'school_name_title_color', 'box_content', 'header_desktop_font_size', 'header_mobile_font_size', 'pwa_app_short_name', 'pwa_app_description'];
        if (realTimeFields.includes(field)) {
            updateSettingsLocal({ [field]: value });
            if (field === 'primary_color' && typeof window !== 'undefined') {
                localStorage.setItem('ischool_primary_color', String(value));
                document.documentElement.style.setProperty('--sidebar-header-bg', String(value));
                // Auto-persist primary color to backend so sidebar updates instantly
                handleSave({ ...formData, [field]: value });
            }
            if (field === 'school_name_title_color' && typeof window !== 'undefined') {
                document.documentElement.style.setProperty('--preview-header-title-color', value || '');
                localStorage.setItem('school_name_title_color', String(value));
                handleSave({ ...formData, [field]: value });
            }
            if (field === 'header_desktop_font_size' && typeof window !== 'undefined') {
                document.documentElement.style.setProperty('--preview-header-desktop-fz', value ? `${value}px` : '');
            }
            if (field === 'header_mobile_font_size' && typeof window !== 'undefined') {
                document.documentElement.style.setProperty('--preview-header-mobile-fz', value ? `${value}px` : '');
            }
            if ((field === 'pwa_app_short_name' || field === 'pwa_app_description') && typeof window !== 'undefined') {
                localStorage.setItem(`ischool_${field}`, String(value));
            }
        }
    };

    const handleAttendanceSettingChange = (category: 'staff' | 'student', index: number, field: string, value: string, roleIndex?: number) => {
        if (category === 'staff' && typeof roleIndex === 'number') {
            const currentStaffSettings = [...formData.staff_attendance_settings];
            const roleSettings = [...currentStaffSettings[roleIndex].settings];
            roleSettings[index] = { ...roleSettings[index] as any, [field]: value };
            currentStaffSettings[roleIndex] = { ...currentStaffSettings[roleIndex] as any, settings: roleSettings };
            setFormData(prev => ({ ...prev, staff_attendance_settings: currentStaffSettings }));
        }
        // Student handling removed from here, used dedicated function below
    };

    const handleStudentAttendanceChange = (classIndex: number, sectionIndex: number, settingIndex: number, field: string, value: string) => {
        const currentSettings = [...formData.student_attendance_settings];
        const classData = { ...currentSettings[classIndex] };
        const sections = [...classData.sections];
        const sectionData = { ...sections[sectionIndex] };
        const settings = [...sectionData.settings];

        settings[settingIndex] = { ...settings[settingIndex], [field]: value };

        sectionData.settings = settings;
        sections[sectionIndex] = sectionData;
        classData.sections = sections;
        currentSettings[classIndex] = classData;

        setFormData(prev => ({ ...prev, student_attendance_settings: currentSettings }));
    };

    const handleSave = async (overrideData?: Record<string, any>) => {
        setSaving(true);
        try {
            const isReactEvent = overrideData && (overrideData.nativeEvent || overrideData.target || overrideData._reactName || typeof overrideData.preventDefault === 'function');
            const dataToSave = (overrideData && !isReactEvent) ? overrideData : formData;
            const payload = { ...dataToSave } as Record<string, any>;
            
            // Persist font sizes in localStorage so font preference is preserved
            if (payload.header_desktop_font_size !== undefined && payload.header_desktop_font_size !== null && typeof window !== 'undefined') {
                localStorage.setItem("header_desktop_font_size", String(payload.header_desktop_font_size));
            }
            if (payload.header_mobile_font_size !== undefined && payload.header_mobile_font_size !== null && typeof window !== 'undefined') {
                localStorage.setItem("header_mobile_font_size", String(payload.header_mobile_font_size));
            }

            // Persist all logo, PWA text and icon paths in localStorage
            const pwaTextAndLogoFields = [
                'print_logo', 'admin_logo', 'admin_small_logo', 'app_logo', 'favicon',
                'pwa_icon_512', 'pwa_icon_192', 'pwa_icon_maskable',
                'pwa_app_short_name', 'pwa_app_description'
            ];
            pwaTextAndLogoFields.forEach(lf => {
                if (payload[lf] !== undefined && payload[lf] !== null && typeof window !== 'undefined') {
                    localStorage.setItem(`ischool_${lf}`, String(payload[lf]));
                }
            });

            if (payload.enable_chat !== undefined && payload.enable_chat !== null && typeof window !== 'undefined') {
                localStorage.setItem("ischool_enable_chat", String(payload.enable_chat));
            }

            Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = null; });
            if (payload.contact_form_receiver_email === null) delete payload.contact_form_receiver_email;
            const response = await api.post("/system-setting/general-setting", payload);
            if (response.data.status === "Success" || response.data.status === "success" || response.data.success) {
                await refreshSettings();
                toast("success", t("general_settings_updated_successfully"));
                setIsSaveDialogOpen(false);
                return true;
            }
        } catch (error: any) {
            console.error("Error saving general settings:", error);
            toast("error", error.response?.data?.message || t("failed_to_save_general_settings"));
        } finally {
            setSaving(false);
        }
        return false;
    };

    const handleLogoUpload = async (field: string, file: File) => {
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("type", "general");

        try {
            const response = await api.post("/upload", uploadData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.status === "Success" || response.data.status === "success" || response.data.success) {
                let imagePath = response.data.data?.path || response.data.data?.url;
                if (imagePath && imagePath.includes("/storage/")) {
                    imagePath = imagePath.substring(imagePath.lastIndexOf("/storage/") + 9);
                }
                handleChange(field, imagePath);
                toast("success", t("logo_uploaded_successfully"));
                return imagePath;
            }
        } catch (error) {
            console.error("Error uploading logo:", error);
            toast("error", t("upload_failed_please_try_again"));
        }
        return null;
    };

    const handleLogoSuccess = (field: string, newUrl: string) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(`ischool_${field}`, newUrl);
            if (field === "favicon" || field === "app_logo" || field === "admin_small_logo") {
                const fullUrl = getImageUrl(newUrl) || newUrl;
                const cacheBusted = `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
                
                const syncLink = (rel: string) => {
                    let link = document.querySelector<HTMLLinkElement>(`link[rel='${rel}']`);
                    if (link) {
                        link.href = cacheBusted;
                    } else {
                        link = document.createElement("link");
                        link.rel = rel;
                        link.href = cacheBusted;
                        document.head.appendChild(link);
                    }
                };

                syncLink("icon");
                syncLink("shortcut icon");
            }
        }
        setFormData(prev => {
            const updated = { ...prev, [field]: newUrl };
            handleSave(updated);
            return updated;
        });
    };

    const [clearingCache, setClearingCache] = useState(false);

    const handleClearCache = async () => {
        setClearingCache(true);
        try {
            const res = await api.post("/system-setting/clear-cache");
            if (res.data?.success || res.data?.status === "success") {
                toast("success", "System cache cleared successfully!");
            } else {
                toast("success", "Cache cleared!");
            }
        } catch (error) {
            console.error("Failed to clear system cache:", error);
            toast("error", "Failed to clear system cache.");
        } finally {
            setClearingCache(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="space-y-6 animate-pulse">
                    <Skeleton className="h-5 w-32 rounded" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-3 w-24 rounded" />
                                <Skeleton className="h-8 w-full rounded" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-8 w-full rounded" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20 rounded" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-3 w-20 rounded" />
                                    <Skeleton className="h-8 w-full rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
        }

        switch (activeTab) {
            case "General Setting":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <h2 className="text-sm font-bold text-gray-700 pb-2 border-b border-gray-100">{t("general_setting")}</h2>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                <div className="space-y-1.5 md:col-span-6 lg:col-span-7">
                                    <Label className="text-xs font-medium text-gray-600">{t("school_name")} <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.school_name}
                                        onChange={(e) => handleChange("school_name", e.target.value)}
                                        placeholder="Enter School Name"
                                        className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-3 lg:col-span-2.5">
                                    <Label className="text-xs font-medium text-gray-600 whitespace-nowrap">Desktop Header Font (px)</Label>
                                    <Input
                                        type="number"
                                        value={formData.header_desktop_font_size || ""}
                                        onChange={(e) => handleChange("header_desktop_font_size", e.target.value)}
                                        placeholder="e.g. 22"
                                        className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded max-w-[130px] w-full"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-3 lg:col-span-2.5">
                                    <Label className="text-xs font-medium text-gray-600 whitespace-nowrap">Mobile Header Font (px)</Label>
                                    <Input
                                        type="number"
                                        value={formData.header_mobile_font_size || ""}
                                        onChange={(e) => handleChange("header_mobile_font_size", e.target.value)}
                                        placeholder="e.g. 14"
                                        className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded max-w-[130px] w-full"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-12">
                                    <Label className="text-xs font-medium text-gray-600">{t("school_slogan")}</Label>
                                    <Input
                                        value={formData.school_slogan}
                                        onChange={(e) => handleChange("school_slogan", e.target.value)}
                                        placeholder="Enter School Slogan"
                                        className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-12">
                                    <Label className="text-xs font-medium text-gray-600">{t("school_description")}</Label>
                                    <Textarea
                                        value={formData.school_description}
                                        onChange={(e) => handleChange("school_description", e.target.value)}
                                        placeholder="Enter School Description"
                                        className="min-h-[100px] text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-6 lg:col-span-4">
                                    <Label className="text-xs font-medium text-gray-600">{t("school_code")}</Label>
                                    <Input
                                        value={formData.school_code}
                                        onChange={(e) => handleChange("school_code", e.target.value)}
                                        placeholder="Enter School Code"
                                        className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-gray-600">{t("address")} <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => handleChange("address", e.target.value)}
                                    placeholder="Enter School Address"
                                    className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-50/50">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("top_bar")}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("phone")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => handleChange("phone", e.target.value)}
                                            placeholder="Enter Phone Number"
                                            className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("email")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.email}
                                            onChange={(e) => handleChange("email", e.target.value)}
                                            placeholder="Enter School Email"
                                            className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("facebook_url")}</Label>
                                        <Input
                                            value={formData.facebook_url}
                                            onChange={(e) => handleChange("facebook_url", e.target.value)}
                                            placeholder="https://facebook.com/..."
                                            className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("twitter_url")}</Label>
                                        <Input
                                            value={formData.twitter_url}
                                            onChange={(e) => handleChange("twitter_url", e.target.value)}
                                            placeholder="https://twitter.com/..."
                                            className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("instagram_url")}</Label>
                                        <Input
                                            value={formData.instagram_url}
                                            onChange={(e) => handleChange("instagram_url", e.target.value)}
                                            placeholder="https://instagram.com/..."
                                            className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("youtube_url")}</Label>
                                        <Input
                                            value={formData.youtube_url}
                                            onChange={(e) => handleChange("youtube_url", e.target.value)}
                                            placeholder="https://youtube.com/..."
                                            className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("linkedin_url")}</Label>
                                        <Input
                                            value={formData.linkedin_url}
                                            onChange={(e) => handleChange("linkedin_url", e.target.value)}
                                            placeholder="https://linkedin.com/..."
                                            className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-50/50">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("contact_form")}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("receiver_email")}</Label>
                                        <Input
                                            value={formData.contact_form_receiver_email}
                                            onChange={(e) => handleChange("contact_form_receiver_email", e.target.value)}
                                            placeholder="admin@school.com"
                                            className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-50/50">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("academic_session")}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("session")} <span className="text-red-500">*</span></Label>
                                        <Select value={formData.session} onValueChange={(val) => handleChange("session", val)}>
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select Session" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="2024-25">2024-25</SelectItem>
                                                <SelectItem value="2025-26">2025-26</SelectItem>
                                                <SelectItem value="2026-27">2026-27</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("session_start_month")} <span className="text-red-500">*</span></Label>
                                        <Select value={formData.session_start_month} onValueChange={(val) => handleChange("session_start_month", val)}>
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select Month" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="January">January</SelectItem>
                                                <SelectItem value="February">February</SelectItem>
                                                <SelectItem value="March">March</SelectItem>
                                                <SelectItem value="April">April</SelectItem>
                                                <SelectItem value="May">May</SelectItem>
                                                <SelectItem value="June">June</SelectItem>
                                                <SelectItem value="July">July</SelectItem>
                                                <SelectItem value="August">August</SelectItem>
                                                <SelectItem value="September">September</SelectItem>
                                                <SelectItem value="October">October</SelectItem>
                                                <SelectItem value="November">November</SelectItem>
                                                <SelectItem value="December">December</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-50/50">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("date_time")}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("date_format")} <span className="text-red-500">*</span></Label>
                                        <Select value={formData.date_format} onValueChange={(val) => handleChange("date_format", val)}>
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select Format" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="dd/mm/yyyy">dd/mm/yyyy</SelectItem>
                                                <SelectItem value="mm/dd/yyyy">mm/dd/yyyy</SelectItem>
                                                <SelectItem value="yyyy/mm/dd">yyyy/mm/dd</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("timezone")} <span className="text-red-500">*</span></Label>
                                        <Select value={formData.timezone} onValueChange={(val) => handleChange("timezone", val)}>
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select Timezone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Asia/Kolkata">(GMT+05:30) Asia, Kolkata</SelectItem>
                                                <SelectItem value="Asia/Dhaka">(GMT+06:00) Asia, Dhaka</SelectItem>
                                                <SelectItem value="UTC">UTC</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("time_format")} <span className="text-red-500">*</span></Label>
                                        <Select value={formData.time_format} onValueChange={(val) => handleChange("time_format", val)}>
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select Format" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="12">12 Hours (AM/PM)</SelectItem>
                                                <SelectItem value="24">24 Hours</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("start_day_of_week")} <span className="text-red-500">*</span></Label>
                                        <Select value={formData.start_day_of_week} onValueChange={(val) => handleChange("start_day_of_week", val)}>
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select Day" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Monday">Monday</SelectItem>
                                                <SelectItem value="Tuesday">Tuesday</SelectItem>
                                                <SelectItem value="Wednesday">Wednesday</SelectItem>
                                                <SelectItem value="Thursday">Thursday</SelectItem>
                                                <SelectItem value="Friday">Friday</SelectItem>
                                                <SelectItem value="Saturday">Saturday</SelectItem>
                                                <SelectItem value="Sunday">Sunday</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-50/50">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("currency")}</h3>
                                <div className="space-y-1.5 max-w-sm">
                                    <Label className="text-xs font-medium text-gray-600">{t("currency_format")} <span className="text-red-500">*</span></Label>
                                    <Select value={formData.currency_format} onValueChange={(val) => handleChange("currency_format", val)}>
                                        <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                            <SelectValue placeholder="Select Format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1,23,45,678.00">1,23,45,678.00</SelectItem>
                                            <SelectItem value="123,456,789.00">123,456,789.00</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-50/50">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("file_upload_path")}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("base_url")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.base_url}
                                            onChange={(e) => handleChange("base_url", e.target.value)}
                                            placeholder="https://api.yourdomain.com"
                                            className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("file_upload_path")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.file_upload_path}
                                            onChange={(e) => handleChange("file_upload_path", e.target.value)}
                                            placeholder="/storage/uploads"
                                            className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>

                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-50/50">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("footer_contact_information")}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("footer_contact_title")}</Label>
                                        <Input
                                            value={formData.footer_contact_title}
                                            onChange={(e) => handleChange("footer_contact_title", e.target.value)}
                                            placeholder="Contact Us"
                                            className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("footer_contact_info_label")}</Label>
                                        <Input
                                            value={formData.footer_contact_info_label}
                                            onChange={(e) => handleChange("footer_contact_info_label", e.target.value)}
                                            placeholder="Contact Info"
                                            className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-gray-600">{t("footer_address")}</Label>
                                    <Input
                                        value={formData.address}
                                        onChange={(e) => handleChange("address", e.target.value)}
                                        placeholder="123 Education Street, Knowledge City, State - 400001"
                                        className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("footer_phone")}</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => handleChange("phone", e.target.value)}
                                            placeholder="+1 234 567 8900"
                                            className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("footer_email")}</Label>
                                        <Input
                                            value={formData.email}
                                            onChange={(e) => handleChange("email", e.target.value)}
                                            placeholder="info@smartschool.com.bd"
                                            className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                        />
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>
                );

            case "Logo":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="pb-2 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-700">{t("logo_settings")}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            <LogoCard
                                title={t("print_logo") || "Print Logo"}
                                field="print_logo"
                                dimensions="200px x 50px"
                                value={formData.print_logo}
                                onUpload={handleLogoUpload}
                                onSaveSuccess={handleLogoSuccess}
                                t={t}
                            />
                            <LogoCard
                                title={t("admin_logo") || "Admin Logo"}
                                field="admin_logo"
                                dimensions="200px x 50px"
                                value={formData.admin_logo}
                                onUpload={handleLogoUpload}
                                onSaveSuccess={handleLogoSuccess}
                                t={t}
                            />
                            <LogoCard
                                title={t("admin_small_logo") || "Admin Small Logo"}
                                field="admin_small_logo"
                                dimensions="50px x 50px"
                                value={formData.admin_small_logo}
                                onUpload={handleLogoUpload}
                                onSaveSuccess={handleLogoSuccess}
                                t={t}
                            />
                            <LogoCard
                                title={t("app_logo") || "App Logo"}
                                field="app_logo"
                                dimensions="200px x 50px"
                                value={formData.app_logo}
                                onUpload={handleLogoUpload}
                                onSaveSuccess={handleLogoSuccess}
                                t={t}
                            />
                            <LogoCard
                                title={t("favicon") || "Browser Favicon"}
                                field="favicon"
                                dimensions="32px x 32px (ICO/PNG)"
                                value={formData.favicon}
                                onUpload={handleLogoUpload}
                                onSaveSuccess={handleLogoSuccess}
                                t={t}
                            />
                        </div>

                        <div className="pt-6 border-t border-gray-100 space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">PWA App Details & Icons (Progressive Web App)</h3>
                                <p className="text-[11px] text-gray-400">Configure PWA app short name, description, and mobile install logos for Android and iOS PWA installation.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/60 p-4 rounded-lg border border-gray-100">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-gray-600">PWA App Short Name (App Name) <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.pwa_app_short_name || ""}
                                        onChange={(e) => handleChange("pwa_app_short_name", e.target.value)}
                                        placeholder="e.g. iSchool"
                                        className="h-8 text-xs bg-white border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-gray-600">PWA App Description</Label>
                                    <Input
                                        value={formData.pwa_app_description || ""}
                                        onChange={(e) => handleChange("pwa_app_description", e.target.value)}
                                        placeholder="e.g. Comprehensive School Management System"
                                        className="h-8 text-xs bg-white border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                                <LogoCard
                                    title="PWA Icon (512x512)"
                                    field="pwa_icon_512"
                                    dimensions="512px x 512px (PNG)"
                                    value={formData.pwa_icon_512}
                                    onUpload={handleLogoUpload}
                                    onSaveSuccess={handleLogoSuccess}
                                    t={t}
                                />
                                <LogoCard
                                    title="PWA Icon (192x192)"
                                    field="pwa_icon_192"
                                    dimensions="192px x 192px (PNG)"
                                    value={formData.pwa_icon_192}
                                    onUpload={handleLogoUpload}
                                    onSaveSuccess={handleLogoSuccess}
                                    t={t}
                                />
                                <LogoCard
                                    title="PWA Maskable Icon"
                                    field="pwa_icon_maskable"
                                    dimensions="512px x 512px (PNG)"
                                    value={formData.pwa_icon_maskable}
                                    onUpload={handleLogoUpload}
                                    onSaveSuccess={handleLogoSuccess}
                                    t={t}
                                />
                            </div>
                        </div>
                    </div>
                );

            case "Login Page Background":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="pb-2 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-700">{t("login_page_background")}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <LogoCard
                                title={t("login_page_background_admin") || "Admin Login Background"}
                                field="login_page_background_admin"
                                dimensions="1920px x 1080px"
                                value={formData.login_page_background_admin}
                                onUpload={handleLogoUpload}
                                onSaveSuccess={handleLogoSuccess}
                                t={t}
                            />
                            <LogoCard
                                title={t("login_page_background_user") || "User Login Background"}
                                field="login_page_background_user"
                                dimensions="1920px x 1080px"
                                value={formData.login_page_background_user}
                                onUpload={handleLogoUpload}
                                onSaveSuccess={handleLogoSuccess}
                                t={t}
                            />
                        </div>
                    </div>
                );

            case "Backend Theme":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <h2 className="text-sm font-bold text-gray-700 pb-2 border-b border-gray-100">{t("backend_theme")}</h2>

                        <div className="space-y-8 max-w-4xl">
                            {/* Theme Mode */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("theme_mode_light_dark")}</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleChange('theme_mode', 'light')}
                                        className={cn(
                                            "w-12 h-12 rounded-lg flex items-center justify-center transition-all border-2",
                                            formData.theme_mode === 'light'
                                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                        )}
                                    >
                                        <Sun className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleChange('theme_mode', 'dark')}
                                        className={cn(
                                            "w-12 h-12 rounded-lg flex items-center justify-center transition-all border-2",
                                            formData.theme_mode === 'dark'
                                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                        )}
                                    >
                                        <Moon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Skins */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("skins_shadow_bordered")}</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleChange('skins', 'shadow')}
                                        className={cn(
                                            "w-12 h-12 rounded-lg flex items-center justify-center transition-all border-2",
                                            formData.skins === 'shadow'
                                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                        )}
                                    >
                                        <div className="w-5 h-5 border-2 border-current rounded-sm shadow-md" />
                                    </button>
                                    <button
                                        onClick={() => handleChange('skins', 'bordered')}
                                        className={cn(
                                            "w-12 h-12 rounded-lg flex items-center justify-center transition-all border-2",
                                            formData.skins === 'bordered'
                                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                        )}
                                    >
                                        <div className="w-5 h-5 border-2 border-current rounded-sm" />
                                    </button>
                                </div>
                            </div>

                            {/* Side Menu */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("side_menu_navigation")}</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleChange('side_menu', 'expanded')}
                                        className={cn(
                                            "w-12 h-12 rounded-lg flex items-center justify-center transition-all border-2",
                                            formData.side_menu === 'expanded'
                                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                        )}
                                    >
                                        <LayoutGrid className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleChange('side_menu', 'collapsed')}
                                        className={cn(
                                            "w-12 h-12 rounded-lg flex items-center justify-center transition-all border-2",
                                            formData.side_menu === 'collapsed'
                                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                        )}
                                    >
                                        <div className="w-5 h-8 border-r-2 border-current rounded-l-sm" />
                                    </button>
                                </div>
                            </div>

                            {/* Primary Color */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t("primary_color")}</label>
                                    <p className="text-[11px] text-gray-500 mt-0.5">Controls the top-left sidebar header background color and brand theme.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {[
                                        { color: '#ffffff', name: 'White' },
                                        { color: '#4f46e5', name: 'Indigo' },
                                        { color: '#3b82f6', name: 'Blue' },
                                        { color: '#f59e0b', name: 'Amber' },
                                        { color: '#10b981', name: 'Emerald' },
                                        { color: '#ef4444', name: 'Red' },
                                    ].map(({ color, name }) => {
                                        const isSelected = formData.primary_color?.toLowerCase() === color.toLowerCase();
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                title={name}
                                                onClick={() => handleChange('primary_color', color)}
                                                className={cn(
                                                    "w-10 h-10 rounded-xl transition-all border-2 ring-offset-1 flex items-center justify-center cursor-pointer shadow-xs",
                                                    color === '#ffffff' ? "border-gray-300 hover:border-gray-400 bg-white" : "border-transparent",
                                                    isSelected
                                                        ? (color === '#ffffff'
                                                            ? "border-indigo-600 ring-2 ring-indigo-500 shadow-md scale-105"
                                                            : "border-gray-900 ring-2 ring-indigo-500 shadow-md scale-105")
                                                        : "hover:scale-102"
                                                )}
                                                style={{ backgroundColor: color }}
                                            >
                                                {isSelected && (
                                                    <Check className={cn("h-4 w-4 stroke-[3]", color === '#ffffff' ? "text-gray-800" : "text-white")} />
                                                )}
                                            </button>
                                        );
                                    })}
                                    <div className="relative group">
                                        <input
                                            type="color"
                                            value={formData.primary_color || '#4f46e5'}
                                            onChange={(e) => handleChange('primary_color', e.target.value)}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10 z-10"
                                            title="Custom Color"
                                        />
                                        <div className="w-10 h-10 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center group-hover:border-gray-300 shadow-xs">
                                            <div className="w-4 h-4 rounded-full border border-gray-300" style={{ background: 'conic-gradient(red, yellow, green, cyan, blue, magenta, red)' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* School Name Title Color */}
                            <div className="space-y-5 pt-3 border-t border-gray-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Palette className="h-4 w-4 text-indigo-600" />
                                            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                                {t("school_name_title_color") || "School Name Title Color"}
                                            </label>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            {t("school_name_title_color_desc") || "Set a dedicated solid color or vibrant multi-color gradient for the school name in the top navigation header."}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50/80 border border-gray-200/80 shadow-2xs self-start sm:self-auto">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Preview:</span>
                                        <span 
                                            className="text-xs font-black truncate max-w-[200px]"
                                            style={
                                                (formData.school_name_title_color || '#6366f1').includes('gradient')
                                                    ? {
                                                        backgroundImage: formData.school_name_title_color,
                                                        WebkitBackgroundClip: 'text',
                                                        backgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent',
                                                        color: 'transparent'
                                                    }
                                                    : { color: formData.school_name_title_color || '#6366f1' }
                                            }
                                        >
                                            {formData.school_name || "Smart School"}
                                        </span>
                                    </div>
                                </div>

                                {/* Multi-Color Gradient Plates */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                                            ✨ Multi-Color Gradient Palettes
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">12 designer gradients</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                                        {[
                                            { name: "Royal Violet", gradient: "linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)" },
                                            { name: "Sunset Fire", gradient: "linear-gradient(135deg, #FF512F 0%, #F09819 50%, #DD2476 100%)" },
                                            { name: "Ocean Cyan", gradient: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)" },
                                            { name: "Emerald Mint", gradient: "linear-gradient(135deg, #0ba360 0%, #3cba92 100%)" },
                                            { name: "Cosmic Fusion", gradient: "linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)" },
                                            { name: "Golden Sunrise", gradient: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)" },
                                            { name: "Cyberpunk Neon", gradient: "linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 100%)" },
                                            { name: "Deep Nebula", gradient: "linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)" },
                                            { name: "Aurora Sky", gradient: "linear-gradient(135deg, #00F260 0%, #0575E6 100%)" },
                                            { name: "Flaming Amber", gradient: "linear-gradient(135deg, #FF9800 0%, #FF5722 50%, #E91E63 100%)" },
                                            { name: "Midnight Bloom", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
                                            { name: "Rose & Coral", gradient: "linear-gradient(135deg, #F857A6 0%, #FF5858 100%)" },
                                        ].map(({ name, gradient }) => {
                                            const isSelected = formData.school_name_title_color === gradient;
                                            return (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    title={name}
                                                    onClick={() => handleChange('school_name_title_color', gradient)}
                                                    className={cn(
                                                        "h-10 px-2 rounded-xl transition-all border-2 ring-offset-1 hover:scale-102 active:scale-98 shadow-xs flex items-center justify-between gap-1.5 cursor-pointer relative overflow-hidden group",
                                                        isSelected
                                                            ? "border-indigo-600 ring-2 ring-indigo-500 shadow-md scale-102"
                                                            : "border-gray-200/80 hover:border-gray-300"
                                                    )}
                                                    style={{ background: gradient }}
                                                >
                                                    <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] truncate">
                                                        {name}
                                                    </span>
                                                    {isSelected ? (
                                                        <div className="h-4 w-4 rounded-full bg-white/90 shadow-sm flex items-center justify-center shrink-0">
                                                            <Check className="h-2.5 w-2.5 text-indigo-700 font-black" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-3.5 w-3.5 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Solid Color Palettes & Custom Picker */}
                                <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                                            🎨 Solid Color Palettes & Custom Picker
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        {[
                                            { color: '#6366f1', label: 'Indigo' },
                                            { color: '#2563eb', label: 'Blue' },
                                            { color: '#0284c7', label: 'Sky' },
                                            { color: '#059669', label: 'Emerald' },
                                            { color: '#d97706', label: 'Amber' },
                                            { color: '#dc2626', label: 'Red' },
                                            { color: '#9333ea', label: 'Purple' },
                                            { color: '#e11d48', label: 'Rose' },
                                            { color: '#0f172a', label: 'Slate' },
                                        ].map(({ color, label }) => {
                                            const isSelected = formData.school_name_title_color?.toLowerCase() === color.toLowerCase();
                                            return (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    title={label}
                                                    onClick={() => handleChange('school_name_title_color', color)}
                                                    className={cn(
                                                        "w-9 h-9 rounded-xl transition-all border-2 ring-offset-2 hover:scale-105 active:scale-95 shadow-xs flex items-center justify-center cursor-pointer",
                                                        isSelected
                                                            ? "border-gray-500 ring-2 ring-indigo-500 scale-105"
                                                            : "border-transparent"
                                                    )}
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {isSelected && (
                                                        <Check className="h-4 w-4 text-white drop-shadow-sm" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                        <div className="relative group flex items-center gap-2">
                                            <div className="relative">
                                                <input
                                                    type="color"
                                                    value={!formData.school_name_title_color?.includes('gradient') ? (formData.school_name_title_color || '#6366f1') : '#6366f1'}
                                                    onChange={(e) => handleChange('school_name_title_color', e.target.value)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-9 h-9 z-10"
                                                />
                                                <div className="w-9 h-9 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center group-hover:border-indigo-400 transition-colors shadow-xs">
                                                    <div className="w-4 h-4 rounded-full border border-gray-300 shadow-inner" style={{ background: 'conic-gradient(red, yellow, green, cyan, blue, magenta, red)' }} />
                                                </div>
                                            </div>
                                            <Input
                                                type="text"
                                                value={formData.school_name_title_color || '#6366f1'}
                                                onChange={(e) => handleChange('school_name_title_color', e.target.value)}
                                                placeholder="#6366f1 or gradient"
                                                className="h-8 w-36 text-[11px] font-mono bg-white border-gray-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Box Content */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("box_content_compact_wide")}</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleChange('box_content', 'wide')}
                                        className={cn(
                                            "w-12 h-12 rounded-lg flex items-center justify-center transition-all border-2",
                                            formData.box_content === 'wide'
                                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                        )}
                                    >
                                        <Maximize className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleChange('box_content', 'compact')}
                                        className={cn(
                                            "w-12 h-12 rounded-lg flex items-center justify-center transition-all border-2",
                                            formData.box_content === 'compact'
                                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                                        )}
                                    >
                                        <Minimize className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "Mobile App":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-700">{t("mobile_app")}</h2>
                            <Button
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white text-xs font-bold h-8 rounded-full px-4 shadow-md transition-all border-none"
                            >
                                {t("register_your_android_app")}
                            </Button>
                        </div>

                        <div className="space-y-6 max-w-4xl">
                            {/* User Mobile App */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("user_mobile_app")}</h3>

                                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] items-center gap-4">
                                    <Label className="text-xs font-medium text-gray-600">{t("user_mobile_app_api_url")}</Label>
                                    <Input
                                        value={formData.mobile_api_url}
                                        onChange={(e) => handleChange('mobile_api_url', e.target.value)}
                                        placeholder="https://app.yourdomain.com"
                                        className="h-10 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded-md"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] items-center gap-4">
                                    <Label className="text-xs font-medium text-gray-600">{t("user_mobile_app_primary_color_code")}</Label>
                                    <div className="flex gap-2 items-center">
                                        <div
                                            className="w-8 h-8 rounded border border-gray-200"
                                            style={{ backgroundColor: formData.mobile_primary_color }}
                                        />
                                        <Input
                                            value={formData.mobile_primary_color}
                                            onChange={(e) => handleChange('mobile_primary_color', e.target.value)}
                                            className="h-10 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded-md max-w-[200px]"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] items-center gap-4">
                                    <Label className="text-xs font-medium text-gray-600">{t("user_mobile_app_secondary_color_code")}</Label>
                                    <div className="flex gap-2 items-center">
                                        <div
                                            className="w-8 h-8 rounded border border-gray-200"
                                            style={{ backgroundColor: formData.mobile_secondary_color }}
                                        />
                                        <Input
                                            value={formData.mobile_secondary_color}
                                            onChange={(e) => handleChange('mobile_secondary_color', e.target.value)}
                                            className="h-10 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded-md max-w-[200px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-50">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-8 h-9 text-xs font-bold uppercase transition-all rounded-full shadow-md border-none"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        {t("loading")}
                                    </>
                                ) : (
                                    t("save")
                                )}
                            </Button>
                        </div>
                    </div>
                );

            case "Student / Guardian Panel":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-indigo-600" />
                                    <h2 className="text-sm font-bold text-gray-800 tracking-tight">
                                        {t("student_guardian_panel") || "Student / Guardian Panel"}
                                    </h2>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {t("student_guardian_panel_desc") || "Configure student and parent portal login options, multi-identifier credentials, and timeline access."}
                                </p>
                            </div>
                            <Button
                                onClick={() => handleSave()}
                                disabled={saving}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-9 text-xs font-bold uppercase transition-all rounded-full shadow-md border-none self-start sm:self-auto cursor-pointer"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                        {t("saving") || "Saving..."}
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-3.5 w-3.5 mr-1.5" />
                                        {t("save") || "Save Settings"}
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-5 max-w-4xl">
                            {/* Card 1: Portal Access Options */}
                            <div className="p-4 sm:p-5 rounded-xl bg-white border border-gray-200/80 shadow-2xs space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <UserCheck className="h-4 w-4 text-indigo-600" />
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        {t("user_login_option") || "Portal Login Access"}
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Enable or disable login portal access for Students and Parents/Guardians.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                    <div className={cn(
                                        "flex items-center justify-between p-3.5 rounded-lg border transition-all",
                                        formData.student_login 
                                            ? "bg-indigo-50/40 border-indigo-200/80" 
                                            : "bg-gray-50/60 border-gray-200"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                                                formData.student_login ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
                                            )}>
                                                <GraduationCap className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <label htmlFor="student_login" className="text-xs font-bold text-gray-800 cursor-pointer">
                                                    {t("student_login") || "Student Login"}
                                                </label>
                                                <p className="text-[11px] text-gray-500">Allow students to log into student dashboard</p>
                                            </div>
                                        </div>
                                        <Switch
                                            id="student_login"
                                            checked={!!formData.student_login}
                                            onCheckedChange={(checked) => handleChange('student_login', checked)}
                                            className="data-[state=checked]:bg-indigo-600 scale-90 cursor-pointer"
                                        />
                                    </div>

                                    <div className={cn(
                                        "flex items-center justify-between p-3.5 rounded-lg border transition-all",
                                        formData.parent_login 
                                            ? "bg-indigo-50/40 border-indigo-200/80" 
                                            : "bg-gray-50/60 border-gray-200"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                                                formData.parent_login ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
                                            )}>
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <label htmlFor="parent_login" className="text-xs font-bold text-gray-800 cursor-pointer">
                                                    {t("parent_login") || "Parent Login"}
                                                </label>
                                                <p className="text-[11px] text-gray-500">Allow parents/guardians to access parent dashboard</p>
                                            </div>
                                        </div>
                                        <Switch
                                            id="parent_login"
                                            checked={!!formData.parent_login}
                                            onCheckedChange={(checked) => handleChange('parent_login', checked)}
                                            className="data-[state=checked]:bg-indigo-600 scale-90 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Student Login Credentials */}
                            <div className={cn(
                                "p-4 sm:p-5 rounded-xl bg-white border border-gray-200/80 shadow-2xs space-y-3 transition-opacity",
                                !formData.student_login && "opacity-50 pointer-events-none"
                            )}>
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        {t("additional_username_option_for_student_login") || "Additional Username Options For Student Login"}
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Students can always log in with their standard Username. Select additional credentials students can use as their login identifier:
                                </p>
                                <div className="flex flex-wrap items-center gap-6 pt-1">
                                    <div className="flex items-center gap-2.5 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-indigo-50/30 transition-colors">
                                        <Checkbox
                                            id="student_login_admission_no"
                                            checked={!!formData.student_login_admission_no}
                                            onCheckedChange={(checked) => handleChange('student_login_admission_no', checked)}
                                            className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded-sm h-4 w-4 cursor-pointer"
                                        />
                                        <label htmlFor="student_login_admission_no" className="text-xs text-gray-700 font-semibold cursor-pointer">
                                            {t("admission_no") || "Admission Number"}
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-indigo-50/30 transition-colors">
                                        <Checkbox
                                            id="student_login_mobile_no"
                                            checked={!!formData.student_login_mobile_no}
                                            onCheckedChange={(checked) => handleChange('student_login_mobile_no', checked)}
                                            className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded-sm h-4 w-4 cursor-pointer"
                                        />
                                        <label htmlFor="student_login_mobile_no" className="text-xs text-gray-700 font-semibold cursor-pointer">
                                            {t("mobile_number") || "Registered Mobile Number"}
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-indigo-50/30 transition-colors">
                                        <Checkbox
                                            id="student_login_email"
                                            checked={!!formData.student_login_email}
                                            onCheckedChange={(checked) => handleChange('student_login_email', checked)}
                                            className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded-sm h-4 w-4 cursor-pointer"
                                        />
                                        <label htmlFor="student_login_email" className="text-xs text-gray-700 font-semibold cursor-pointer">
                                            {t("email") || "Registered Email Address"}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Parent Login Credentials */}
                            <div className={cn(
                                "p-4 sm:p-5 rounded-xl bg-white border border-gray-200/80 shadow-2xs space-y-3 transition-opacity",
                                !formData.parent_login && "opacity-50 pointer-events-none"
                            )}>
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        {t("additional_username_option_for_parent_login") || "Additional Username Options For Parent Login"}
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Parents can always log in with their standard Parent Username. Select additional credentials parents can use as their login identifier:
                                </p>
                                <div className="flex flex-wrap items-center gap-6 pt-1">
                                    <div className="flex items-center gap-2.5 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-indigo-50/30 transition-colors">
                                        <Checkbox
                                            id="parent_login_mobile_no"
                                            checked={!!formData.parent_login_mobile_no}
                                            onCheckedChange={(checked) => handleChange('parent_login_mobile_no', checked)}
                                            className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded-sm h-4 w-4 cursor-pointer"
                                        />
                                        <label htmlFor="parent_login_mobile_no" className="text-xs text-gray-700 font-semibold cursor-pointer">
                                            {t("mobile_number") || "Guardian Mobile Number"}
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:bg-indigo-50/30 transition-colors">
                                        <Checkbox
                                            id="parent_login_email"
                                            checked={!!formData.parent_login_email}
                                            onCheckedChange={(checked) => handleChange('parent_login_email', checked)}
                                            className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 rounded-sm h-4 w-4 cursor-pointer"
                                        />
                                        <label htmlFor="parent_login_email" className="text-xs text-gray-700 font-semibold cursor-pointer">
                                            {t("email") || "Guardian Email Address"}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Student Timeline Permissions */}
                            <div className="p-4 sm:p-5 rounded-xl bg-white border border-gray-200/80 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-indigo-600" />
                                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                            {t("allow_student_to_add_timeline") || "Allow Student To Add Timeline"}
                                        </h3>
                                    </div>
                                    <Switch
                                        id="allow_student_to_add_timeline"
                                        checked={!!formData.allow_student_to_add_timeline}
                                        onCheckedChange={(checked) => handleChange('allow_student_to_add_timeline', checked)}
                                        className="data-[state=checked]:bg-indigo-600 scale-90 cursor-pointer"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    When enabled, students are permitted to create timeline milestone entries and activity records directly from their student portal profile.
                                </p>
                            </div>
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="flex justify-end pt-4 border-t border-gray-100 max-w-4xl">
                            <Button
                                onClick={() => handleSave()}
                                disabled={saving}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-8 h-9 text-xs font-bold uppercase transition-all rounded-full shadow-md border-none cursor-pointer"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                        {t("saving") || "Saving..."}
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-3.5 w-3.5 mr-1.5" />
                                        {t("save") || "Save Settings"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                );

            case "Attendance Type":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="pb-2 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-700">{t("attendance_type")}</h2>
                        </div>

                        <div className="space-y-8 max-w-6xl">
                            {/* Attendance Options */}
                            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr_300px_1fr] items-center gap-6">
                                <Label className="text-sm font-medium text-gray-600">{t("attendance")}</Label>
                                <RadioGroup
                                    value={formData.attendance_type}
                                    onValueChange={(val) => handleChange('attendance_type', val)}
                                    className="flex items-center gap-6"
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="day_wise" id="day_wise" className="border-indigo-500 text-indigo-500" />
                                        <label htmlFor="day_wise" className="text-sm text-gray-600 font-medium cursor-pointer">{t("day_wise")}</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="period_wise" id="period_wise" className="border-indigo-500 text-indigo-500" />
                                        <label htmlFor="period_wise" className="text-sm text-gray-600 font-medium cursor-pointer">{t("period_wise")}</label>
                                    </div>
                                </RadioGroup>

                                <Label className="text-sm font-medium text-gray-600 text-right pr-4">{t("qr_code_barcode_biometric_attendance")}</Label>
                                <div className="flex justify-end">
                                    <Switch
                                        checked={!!formData.biometric_attendance}
                                        onCheckedChange={(checked) => handleChange('biometric_attendance', checked)}
                                        className="data-[state=checked]:bg-indigo-500 scale-90"
                                    />
                                </div>
                            </div>

                            {/* Devices */}
                            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-baseline gap-6">
                                <Label className="text-sm font-medium text-gray-600">{t("devices_separate_by_comma")}</Label>
                                <Input
                                    value={formData.devices}
                                    onChange={(e) => handleChange('devices', e.target.value)}
                                    className="h-10 text-sm border-gray-200 focus:ring-indigo-500 shadow-none rounded-md"
                                />
                            </div>

                            {/* Low Attendance Limit */}
                            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] items-center gap-6">
                                <Label className="text-sm font-medium text-gray-600">{t("low_attendance_limit")}</Label>
                                <div className="flex items-center">
                                    <Input
                                        type="number"
                                        value={formData.low_attendance_limit}
                                        onChange={(e) => handleChange('low_attendance_limit', e.target.value)}
                                        className="h-10 text-sm border-gray-200 focus:ring-indigo-500 shadow-none rounded-l-md rounded-r-none w-32"
                                    />
                                    <div className="h-10 w-10 border border-l-0 border-gray-200 bg-gray-50 flex items-center justify-center rounded-r-md text-sm text-gray-500 font-medium">
                                        %
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-8 text-sm font-bold uppercase transition-all rounded-full shadow-md border-none"
                                >
                                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                                    {t("save")}
                                </Button>
                            </div>

                            {/* Staff / Student Settings Tabs */}
                            <div className="mt-8 border rounded-lg overflow-hidden bg-white shadow-sm">
                                <div className="flex bg-gray-50 border-b">
                                    <button
                                        onClick={() => setActiveAttendanceTab("Staff")}
                                        className={cn(
                                            "px-8 py-3 text-sm font-bold tracking-wider transition-all border-b-2",
                                            activeAttendanceTab === "Staff"
                                                ? "bg-white border-indigo-500 text-indigo-600"
                                                : "border-transparent text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        {t("staff")}
                                    </button>
                                    <button
                                        onClick={() => setActiveAttendanceTab("Student")}
                                        className={cn(
                                            "px-8 py-3 text-sm font-bold tracking-wider transition-all border-b-2",
                                            activeAttendanceTab === "Student"
                                                ? "bg-white border-indigo-500 text-indigo-600"
                                                : "border-transparent text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        {t("student")}
                                    </button>
                                </div>

                                <div className="p-6">
                                    {activeAttendanceTab === 'Staff' ? (
                                        <div className="space-y-10">
                                            {formData.staff_attendance_settings.map((roleGroup: any, roleIdx: number) => (
                                                <div key={roleIdx} className="border border-gray-100 rounded-lg overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow">
                                                    <div className="bg-gray-50/80 p-4 border-b border-gray-100 flex items-center justify-between">
                                                        <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                            {t("role")}: {roleGroup.role}
                                                        </div>
                                                        <Button
                                                            onClick={handleSave}
                                                            disabled={saving}
                                                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-8 text-xs font-bold uppercase transition-all rounded-full shadow-md border-none"
                                                        >
                                                            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                                                            {t("update")}
                                                        </Button>
                                                    </div>

                                                    <div className="p-5">
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full border-collapse">
                                                                <thead>
                                                                    <tr className="border-b border-gray-100">
                                                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[28%]">{t("attendance_type")}</th>
                                                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[24%]">{t("entry_from")}</th>
                                                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[24%]">{t("entry_upto")}</th>
                                                                        <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-[24%]">{t("total_hour")}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {roleGroup.settings.map((setting: any, idx: number) => (
                                                                        <tr key={idx} className="border-b border-gray-50 last:border-b-0 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                                            <td className="py-4 px-4 text-xs font-bold text-gray-600">{setting.type}</td>
                                                                            <td className="py-4 px-4">
                                                                                <div className="relative group max-w-[150px]">
                                                                                    <Input
                                                                                        value={setting.from}
                                                                                        onChange={(e) => handleAttendanceSettingChange('staff', idx, 'from', e.target.value, roleIdx)}
                                                                                        className="h-9 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded-md pr-8 bg-white transition-all group-hover:border-indigo-200"
                                                                                    />
                                                                                    <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-4 px-4">
                                                                                <div className="relative group max-w-[150px]">
                                                                                    <Input
                                                                                        value={setting.upto}
                                                                                        onChange={(e) => handleAttendanceSettingChange('staff', idx, 'upto', e.target.value, roleIdx)}
                                                                                        className="h-9 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded-md pr-8 bg-white transition-all group-hover:border-indigo-200"
                                                                                    />
                                                                                    <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-4 px-4">
                                                                                <div className="relative group max-w-[150px]">
                                                                                    <Input
                                                                                        value={setting.total}
                                                                                        onChange={(e) => handleAttendanceSettingChange('staff', idx, 'total', e.target.value, roleIdx)}
                                                                                        className="h-9 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded-md pr-8 bg-white transition-all group-hover:border-indigo-200"
                                                                                    />
                                                                                    <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="bg-gray-50/80 p-4 rounded-lg mb-6 flex flex-col md:flex-row items-center justify-between border border-gray-100 gap-4">
                                                <div className="flex items-center gap-4 w-full md:w-auto">
                                                    <div className="text-sm font-bold text-gray-600 uppercase flex items-center gap-2 whitespace-nowrap">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                        {t("role")}: {t("student")}
                                                    </div>

                                                    <div className="flex items-center gap-2 w-full md:w-64">
                                                        <Label className="text-xs font-medium text-gray-500 whitespace-nowrap">{t("class_filter")}:</Label>
                                                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none bg-white">
                                                                <SelectValue placeholder={t("all_classes")} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all" className="text-xs">{t("all_classes")}</SelectItem>
                                                                {formData.student_attendance_settings.map((cls: any) => (
                                                                    <SelectItem key={cls.class_id} value={String(cls.class_id)} className="text-xs">
                                                                        {cls.class_name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-6 h-8 text-xs font-bold uppercase transition-all rounded-full shadow-md border-none w-full md:w-auto"
                                                >
                                                    {saving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                                                    {t("update")}
                                                </Button>
                                            </div>

                                            <div className="space-y-8">
                                                {formData.student_attendance_settings.map((classItem: any, classIdx: number) => {
                                                    // Filter logic
                                                    if (selectedClassId !== "all" && String(classItem.class_id) !== selectedClassId) {
                                                        return null;
                                                    }

                                                    return (
                                                        <div key={classItem.class_id} className="space-y-4">
                                                            <h3 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-2">
                                                                {classItem.class_name}
                                                            </h3>

                                                            <div className="grid grid-cols-1 gap-6">
                                                                {classItem.sections.map((section: any, sectionIdx: number) => (
                                                                    <div key={section.section_id} className="border border-gray-100 rounded-lg overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow">
                                                                        <div className="bg-gray-50/50 p-3 border-b border-gray-100 flex items-center gap-2">
                                                                            <span className="text-xs font-bold text-gray-500 uppercase">{t("section")}:</span>
                                                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{section.section_name}</span>
                                                                        </div>

                                                                        <div className="p-4 overflow-x-auto">
                                                                            <table className="w-full border-collapse">
                                                                                <thead>
                                                                                    <tr className="border-b border-gray-100">
                                                                                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-[28%]">{t("attendance_type")}</th>
                                                                                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-[24%]">{t("entry_from")}</th>
                                                                                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-[24%]">{t("entry_upto")}</th>
                                                                                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider w-[24%]">{t("total_hour")}</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {section.settings.map((setting: any, settingIdx: number) => (
                                                                                        <tr key={settingIdx} className="border-b border-gray-50 last:border-b-0 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                                                            <td className="py-2 px-3 text-xs font-bold text-gray-600">{setting.type}</td>
                                                                                            <td className="py-2 px-3">
                                                                                                <div className="relative group max-w-[150px]">
                                                                                                    <Input
                                                                                                        value={setting.from}
                                                                                                        onChange={(e) => handleStudentAttendanceChange(classIdx, sectionIdx, settingIdx, 'from', e.target.value)}
                                                                                                        className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded-md pr-7 bg-white transition-all group-hover:border-indigo-200"
                                                                                                    />
                                                                                                    <Clock className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="py-2 px-3">
                                                                                                <div className="relative group max-w-[150px]">
                                                                                                    <Input
                                                                                                        value={setting.upto}
                                                                                                        onChange={(e) => handleStudentAttendanceChange(classIdx, sectionIdx, settingIdx, 'upto', e.target.value)}
                                                                                                        className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded-md pr-7 bg-white transition-all group-hover:border-indigo-200"
                                                                                                    />
                                                                                                    <Clock className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="py-2 px-3">
                                                                                                <div className="relative group max-w-[150px]">
                                                                                                    <Input
                                                                                                        value={setting.total}
                                                                                                        onChange={(e) => handleStudentAttendanceChange(classIdx, sectionIdx, settingIdx, 'total', e.target.value)}
                                                                                                        className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded-md pr-7 bg-white transition-all group-hover:border-indigo-200"
                                                                                                    />
                                                                                                    <Clock className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                                                                                </div>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "Fees":
                return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <h2 className="text-sm font-bold text-gray-700 pb-2 border-b border-gray-100">{t("fees")}</h2>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between group">
                                <Label className="text-xs font-medium text-gray-600">{t("offline_bank_payment_in_student_panel")}</Label>
                                <Switch
                                    checked={formData.fees_offline_bank_payment_in_student_panel}
                                    onCheckedChange={(checked) => handleChange('fees_offline_bank_payment_in_student_panel', checked)}
                                    className="data-[state=checked]:bg-indigo-500 scale-90"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-medium text-gray-600">{t("offline_bank_payment_instruction")}</Label>
                                <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
                                    <textarea
                                        className="w-full h-32 p-3 text-xs text-gray-600 focus:outline-none resize-none bg-transparent"
                                        value={formData.fees_offline_bank_payment_instruction}
                                        onChange={(e) => handleChange('fees_offline_bank_payment_instruction', e.target.value)}
                                        placeholder="Offline mode of payment are Cash, DD, Online and Cheques"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-gray-600">{t("lock_student_panel_if_fees_remaining")}</Label>
                                <Switch
                                    checked={formData.fees_lock_student_panel_if_fees_remaining}
                                    onCheckedChange={(checked) => handleChange('fees_lock_student_panel_if_fees_remaining', checked)}
                                    className="data-[state=checked]:bg-indigo-500 scale-90"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600">{t("print_fees_receipt_for")}</Label>
                                <div className="flex items-center gap-6 pt-1">
                                    {["Office Copy", "Student Copy", "Bank Copy"].map((label) => (
                                        <div key={label} className="flex items-center gap-2">
                                            <Checkbox
                                                id={label}
                                                checked={formData.fees_print_fees_receipt_for?.includes(label)}
                                                onCheckedChange={(checked) => {
                                                    const current = formData.fees_print_fees_receipt_for || [];
                                                    let updated;
                                                    if (checked) {
                                                        updated = [...current, label];
                                                    } else {
                                                        updated = current.filter(item => item !== label);
                                                    }
                                                    handleChange('fees_print_fees_receipt_for', updated);
                                                }}
                                                className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 rounded-sm h-3.5 w-3.5"
                                            />
                                            <label htmlFor={label} className="text-xs text-gray-600 font-medium cursor-pointer">{label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5 max-w-md">
                                <Label className="text-xs font-medium text-gray-600">{t("carry_forward_fees_due_days")} <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.fees_due_days}
                                    onChange={(e) => handleChange('fees_due_days', parseInt(e.target.value) || 0)}
                                    className="h-8 text-xs border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                                />
                            </div>

                            {[
                                { label: "Single Page Fees Print", key: "fees_single_page_print" },
                                { label: "Collect Fees In Back Date", key: "fees_collect_fees_in_back_date" },
                                { label: "Student / Guardian Panel Fees Discount", key: "fees_student_guardian_panel_fees_discount" },
                                { label: "Display Previous Fees", key: "fees_display_previous_fees" },
                                { label: "Allow Student To Add Partial Payment", key: "fees_allow_student_to_add_partial_payment" }
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between group">
                                    <Label className="text-xs font-medium text-gray-600">{item.label}</Label>
                                    <Switch
                                        checked={(formData as any)[item.key]}
                                        onCheckedChange={(checked) => handleChange(item.key, checked)}
                                        className="data-[state=checked]:bg-indigo-500 scale-90"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case "ID Auto Generation":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <h2 className="text-sm font-bold text-gray-700 pb-2 border-b border-gray-100">{t("id_auto_generation")}</h2>

                        {/* Student ID */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("student_admission_no_auto_generation")}</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-center justify-between max-w-sm">
                                    <Label className="text-xs font-medium text-gray-600">{t("auto_admission_no")}</Label>
                                    <Switch
                                        checked={formData.auto_admission_no}
                                        onCheckedChange={(checked) => handleChange('auto_admission_no', checked)}
                                        className="data-[state=checked]:bg-indigo-500 scale-90"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("admission_no_prefix")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.admission_no_prefix}
                                            onChange={(e) => handleChange('admission_no_prefix', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("admission_no_digit")} <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={String(formData.admission_no_digit)}
                                            onValueChange={(value) => handleChange('admission_no_digit', parseInt(value))}
                                        >
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="4">4</SelectItem>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="6">6</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("admission_start_from")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.admission_start_from}
                                            onChange={(e) => handleChange('admission_start_from', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Staff ID */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("staff_id_auto_generation")}</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-center justify-between max-w-sm">
                                    <Label className="text-xs font-medium text-gray-600">{t("auto_staff_id")}</Label>
                                    <Switch
                                        checked={formData.auto_staff_id}
                                        onCheckedChange={(checked) => handleChange('auto_staff_id', checked)}
                                        className="data-[state=checked]:bg-indigo-500 scale-90"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("staff_id_prefix")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.staff_id_prefix}
                                            onChange={(e) => handleChange('staff_id_prefix', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("staff_no_digit")} <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={String(formData.staff_no_digit)}
                                            onValueChange={(value) => handleChange('staff_no_digit', parseInt(value))}
                                        >
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="4">4</SelectItem>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="6">6</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("staff_id_start_from")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.staff_id_start_from}
                                            onChange={(e) => handleChange('staff_id_start_from', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Student Roll Generation */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("student_roll_auto_generation")}</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-center justify-between max-w-sm">
                                    <Label className="text-xs font-medium text-gray-600">{t("auto_roll_no")}</Label>
                                    <Switch
                                        checked={formData.auto_roll_no}
                                        onCheckedChange={(checked) => handleChange('auto_roll_no', checked)}
                                        className="data-[state=checked]:bg-indigo-500 scale-90"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("student_roll_prefix")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.roll_no_prefix}
                                            onChange={(e) => handleChange('roll_no_prefix', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("student_no_digit")} <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={String(formData.roll_no_digit)}
                                            onValueChange={(value) => handleChange('roll_no_digit', parseInt(value))}
                                        >
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1</SelectItem>
                                                <SelectItem value="2">2</SelectItem>
                                                <SelectItem value="3">3</SelectItem>
                                                <SelectItem value="4">4</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("student_roll_start_from")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.roll_no_start_from}
                                            onChange={(e) => handleChange('roll_no_start_from', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Username Auto Generation */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("username_auto_generation")}</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-center justify-between max-w-sm">
                                    <Label className="text-xs font-medium text-gray-600">{t("auto_username")}</Label>
                                    <Switch
                                        checked={formData.auto_username}
                                        onCheckedChange={(checked) => handleChange('auto_username', checked)}
                                        className="data-[state=checked]:bg-indigo-500 scale-90"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("username_prefix")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.username_prefix}
                                            onChange={(e) => handleChange('username_prefix', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                            placeholder="std_"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("username_digit")} <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={String(formData.username_digit)}
                                            onValueChange={(value) => handleChange('username_digit', parseInt(value))}
                                        >
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="4">4</SelectItem>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="6">6</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("username_start_from")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.username_start_from}
                                            onChange={(e) => handleChange('username_start_from', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Income Invoice */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("income_invoice_auto_generation")}</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-center justify-between max-w-sm">
                                    <Label className="text-xs font-medium text-gray-600">{t("auto_generate_invoice_no")}</Label>
                                    <Switch
                                        checked={formData.income_invoice_enable_auto_generation}
                                        onCheckedChange={(checked) => handleChange('income_invoice_enable_auto_generation', checked)}
                                        className="data-[state=checked]:bg-indigo-500 scale-90"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("invoice_no_prefix")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.income_invoice_prefix}
                                            onChange={(e) => handleChange('income_invoice_prefix', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                            placeholder="INV-"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("invoice_no_digit")} <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={String(formData.income_invoice_digit)}
                                            onValueChange={(value) => handleChange('income_invoice_digit', parseInt(value))}
                                        >
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="4">4</SelectItem>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="6">6</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("invoice_start_from")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.income_invoice_start_from}
                                            onChange={(e) => handleChange('income_invoice_start_from', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Parent Username Auto Generation */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("parent_username_auto_generation")}</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-center justify-between max-w-sm">
                                    <Label className="text-xs font-medium text-gray-600">{t("auto_parent_username")}</Label>
                                    <Switch
                                        checked={formData.auto_parent_username}
                                        onCheckedChange={(checked) => handleChange('auto_parent_username', checked)}
                                        className="data-[state=checked]:bg-indigo-500 scale-90"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("parent_username_prefix")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.parent_username_prefix}
                                            onChange={(e) => handleChange('parent_username_prefix', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                            placeholder="par_"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("parent_username_digit")} <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={String(formData.parent_username_digit)}
                                            onValueChange={(value) => handleChange('parent_username_digit', parseInt(value))}
                                        >
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="4">4</SelectItem>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="6">6</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("parent_username_start_from")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.parent_username_start_from}
                                            onChange={(e) => handleChange('parent_username_start_from', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expense Invoice */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("expense_invoice_auto_generation")}</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-center justify-between max-w-sm">
                                    <Label className="text-xs font-medium text-gray-600">{t("auto_generate_expense_no")}</Label>
                                    <Switch
                                        checked={formData.expense_invoice_enable_auto_generation}
                                        onCheckedChange={(checked) => handleChange('expense_invoice_enable_auto_generation', checked)}
                                        className="data-[state=checked]:bg-indigo-500 scale-90"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("expense_no_prefix")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.expense_invoice_prefix}
                                            onChange={(e) => handleChange('expense_invoice_prefix', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                            placeholder="EXP-"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("expense_no_digit")} <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={String(formData.expense_invoice_digit)}
                                            onValueChange={(value) => handleChange('expense_invoice_digit', parseInt(value))}
                                        >
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="4">4</SelectItem>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="6">6</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("expense_start_from")} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.expense_invoice_start_from}
                                            onChange={(e) => handleChange('expense_invoice_start_from', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Student Certificate Auto Generation */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("student_certificate_no_auto_generation") || "Student Certificate No Auto Generation"}</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-center justify-between max-w-sm">
                                    <Label className="text-xs font-medium text-gray-600">{t("auto_student_certificate_no") || "Auto Generate Certificate No"}</Label>
                                    <Switch
                                        checked={formData.auto_student_certificate_no}
                                        onCheckedChange={(checked) => handleChange('auto_student_certificate_no', checked)}
                                        className="data-[state=checked]:bg-indigo-500 scale-90"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("student_certificate_prefix") || "Certificate No Prefix"} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.student_certificate_prefix}
                                            onChange={(e) => handleChange('student_certificate_prefix', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                            placeholder="CERT-"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("student_certificate_digit") || "Certificate No Digit"} <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={String(formData.student_certificate_digit || 4)}
                                            onValueChange={(value) => handleChange('student_certificate_digit', parseInt(value))}
                                        >
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="4">4</SelectItem>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="6">6</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("student_certificate_start_from") || "Certificate Start From"} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.student_certificate_start_from}
                                            onChange={(e) => handleChange('student_certificate_start_from', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transfer Certificate Auto Generation */}
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("transfer_certificate_no_auto_generation") || "Transfer Certificate No Auto Generation"}</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="flex items-center justify-between max-w-sm">
                                    <Label className="text-xs font-medium text-gray-600">{t("auto_transfer_certificate_no") || "Auto Generate TC No"}</Label>
                                    <Switch
                                        checked={formData.auto_transfer_certificate_no}
                                        onCheckedChange={(checked) => handleChange('auto_transfer_certificate_no', checked)}
                                        className="data-[state=checked]:bg-indigo-500 scale-90"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("transfer_certificate_prefix") || "TC No Prefix"} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.transfer_certificate_prefix}
                                            onChange={(e) => handleChange('transfer_certificate_prefix', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                            placeholder="TC-"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("transfer_certificate_digit") || "TC No Digit"} <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={String(formData.transfer_certificate_digit || 4)}
                                            onValueChange={(value) => handleChange('transfer_certificate_digit', parseInt(value))}
                                        >
                                            <SelectTrigger className="h-8 text-xs border-gray-200 shadow-none rounded">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="4">4</SelectItem>
                                                <SelectItem value="5">5</SelectItem>
                                                <SelectItem value="6">6</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-gray-600">{t("transfer_certificate_start_from") || "TC Start From"} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.transfer_certificate_start_from}
                                            onChange={(e) => handleChange('transfer_certificate_start_from', e.target.value)}
                                            className="h-8 border-gray-200 shadow-none rounded text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "Google Drive Setting":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="pb-2 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-700">{t("google_drive_setting")}</h2>
                        </div>
                        <div className="space-y-6 max-w-4xl">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-gray-600">{t("client_id")} <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.google_client_id}
                                        onChange={(e) => handleChange('google_client_id', e.target.value)}
                                        className="h-8 border-gray-200 shadow-none rounded text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-gray-600">{t("api_key")} <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.google_api_key}
                                        onChange={(e) => handleChange('google_api_key', e.target.value)}
                                        className="h-8 border-gray-200 shadow-none rounded text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium text-gray-600">{t("project_number_app_id")} <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.google_project_number}
                                        onChange={(e) => handleChange('google_project_number', e.target.value)}
                                        className="h-8 border-gray-200 shadow-none rounded text-xs"
                                    />
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <Label className="text-sm font-medium text-gray-600">{t("status")} <span className="text-red-500">*</span></Label>
                                    <Switch
                                        checked={formData.google_status}
                                        onCheckedChange={(checked) => handleChange('google_status', checked)}
                                        className="data-[state=checked]:bg-indigo-500 scale-90"
                                    />
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <Label className="text-sm font-medium text-gray-600 block mb-4">{t("allow_students_parents_and_staff_to_upload_student_document_through_google_drive")} <span className="text-red-500">*</span></Label>
                                    <div className="flex flex-wrap gap-8">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-600">{t("student")}</span>
                                            <Switch
                                                checked={formData.google_allow_student}
                                                onCheckedChange={(checked) => handleChange('google_allow_student', checked)}
                                                className="data-[state=checked]:bg-indigo-500 scale-90"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-600">{t("guardian")}</span>
                                            <Switch
                                                checked={formData.google_allow_guardian}
                                                onCheckedChange={(checked) => handleChange('google_allow_guardian', checked)}
                                                className="data-[state=checked]:bg-indigo-500 scale-90"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-600">{t("staff")}</span>
                                            <Switch
                                                checked={formData.google_allow_staff}
                                                onCheckedChange={(checked) => handleChange('google_allow_staff', checked)}
                                                className="data-[state=checked]:bg-indigo-500 scale-90"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "Whatsapp Settings":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="pb-2 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-700">{t("whatsapp_settings")}</h2>
                        </div>
                        <div className="space-y-8 max-w-4xl">
                            {/* Front Site */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t("front_site")}</h3>
                                <div className="space-y-4 pl-2">
                                    <div className="flex items-center justify-between max-w-xs">
                                        <Label className="text-sm font-medium text-gray-600">{t("whatsapp_link")}</Label>
                                        <Switch
                                            checked={formData.whatsapp_front_site_status}
                                            onCheckedChange={(checked) => handleChange('whatsapp_front_site_status', checked)}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-600">{t("mobile_no")}</Label>
                                            <Input
                                                value={formData.whatsapp_front_site_mobile}
                                                onChange={(e) => handleChange('whatsapp_front_site_mobile', e.target.value)}
                                                className="h-8 border-gray-200 shadow-none rounded text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-600">From</Label>
                                            <Input
                                                type="time"
                                                value={formData.whatsapp_front_site_from}
                                                onChange={(e) => handleChange('whatsapp_front_site_from', e.target.value)}
                                                className="h-8 border-gray-200 shadow-none rounded text-xs"
                                                placeholder="From"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-600">To</Label>
                                            <Input
                                                type="time"
                                                value={formData.whatsapp_front_site_to}
                                                onChange={(e) => handleChange('whatsapp_front_site_to', e.target.value)}
                                                className="h-8 border-gray-200 shadow-none rounded text-xs"
                                                placeholder="To"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100"></div>

                            {/* Admin Panel */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t("admin_panel")}</h3>
                                <div className="space-y-4 pl-2">
                                    <div className="flex items-center justify-between max-w-xs">
                                        <Label className="text-sm font-medium text-gray-600">{t("whatsapp_link")}</Label>
                                        <Switch
                                            checked={formData.whatsapp_admin_panel_status}
                                            onCheckedChange={(checked) => handleChange('whatsapp_admin_panel_status', checked)}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-600">{t("mobile_no")}</Label>
                                            <Input
                                                value={formData.whatsapp_admin_panel_mobile}
                                                onChange={(e) => handleChange('whatsapp_admin_panel_mobile', e.target.value)}
                                                className="h-8 border-gray-200 shadow-none rounded text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-600">From</Label>
                                            <Input
                                                type="time"
                                                value={formData.whatsapp_admin_panel_from}
                                                onChange={(e) => handleChange('whatsapp_admin_panel_from', e.target.value)}
                                                className="h-8 border-gray-200 shadow-none rounded text-xs"
                                                placeholder="From"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-600">To</Label>
                                            <Input
                                                type="time"
                                                value={formData.whatsapp_admin_panel_to}
                                                onChange={(e) => handleChange('whatsapp_admin_panel_to', e.target.value)}
                                                className="h-8 border-gray-200 shadow-none rounded text-xs"
                                                placeholder="To"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100"></div>

                            {/* Student / Guardian Panel */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t("student_guardian_panel")}</h3>
                                <div className="space-y-4 pl-2">
                                    <div className="flex items-center justify-between max-w-xs">
                                        <Label className="text-sm font-medium text-gray-600">{t("whatsapp_link")}</Label>
                                        <Switch
                                            checked={formData.whatsapp_student_panel_status}
                                            onCheckedChange={(checked) => handleChange('whatsapp_student_panel_status', checked)}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-600">{t("mobile_no")}</Label>
                                            <Input
                                                value={formData.whatsapp_student_panel_mobile}
                                                onChange={(e) => handleChange('whatsapp_student_panel_mobile', e.target.value)}
                                                className="h-8 border-gray-200 shadow-none rounded text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-600">From</Label>
                                            <Input
                                                type="time"
                                                value={formData.whatsapp_student_panel_from}
                                                onChange={(e) => handleChange('whatsapp_student_panel_from', e.target.value)}
                                                className="h-8 border-gray-200 shadow-none rounded text-xs"
                                                placeholder="From"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium text-gray-600">To</Label>
                                            <Input
                                                type="time"
                                                value={formData.whatsapp_student_panel_to}
                                                onChange={(e) => handleChange('whatsapp_student_panel_to', e.target.value)}
                                                className="h-8 border-gray-200 shadow-none rounded text-xs"
                                                placeholder="To"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "Chat":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-700">{t("chat")}</h2>
                        </div>
                        <div className="space-y-6 max-w-4xl">
                            {/* Primary Chat System Master Toggle */}
                            <div className="border border-indigo-100 rounded-lg p-6 bg-gradient-to-r from-indigo-50/40 via-white to-purple-50/20 shadow-sm flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-indigo-600" />
                                        Enable Chat System (ON / OFF)
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Turn the real-time internal chat system ON or OFF across the entire application (hides floating chat icon, header chat button, and messages).
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={cn("text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-colors", formData.enable_chat ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200")}>
                                        {formData.enable_chat ? "ON" : "OFF"}
                                    </span>
                                    <Switch
                                        checked={Boolean(formData.enable_chat)}
                                        onCheckedChange={(checked) => handleChange('enable_chat', checked)}
                                        className="data-[state=checked]:bg-indigo-600 scale-110"
                                    />
                                </div>
                            </div>

                            <div className="border border-gray-100 rounded-lg p-6 bg-white shadow-sm">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">{t("student_guardian_panel")}</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between max-w-md">
                                        <Label className="text-sm font-medium text-gray-600">{t("allow_student_to_delete_chat")}</Label>
                                        <Switch
                                            checked={formData.chat_student_delete}
                                            onCheckedChange={(checked) => handleChange('chat_student_delete', checked)}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between max-w-md">
                                        <Label className="text-sm font-medium text-gray-600">{t("allow_guardian_to_delete_chat")}</Label>
                                        <Switch
                                            checked={formData.chat_guardian_delete}
                                            onCheckedChange={(checked) => handleChange('chat_guardian_delete', checked)}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between max-w-md">
                                        <Label className="text-sm font-medium text-gray-600">{t("allow_staff_to_delete_chat")}</Label>
                                        <Switch
                                            checked={formData.chat_staff_delete}
                                            onCheckedChange={(checked) => handleChange('chat_staff_delete', checked)}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "Maintenance":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="pb-2 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-700">{t("maintenance")}</h2>
                        </div>

                        <div className="space-y-6 max-w-4xl">
                            <div className="border border-gray-100 rounded-lg p-6 bg-white shadow-sm">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-50 pb-2">{t("maintenance")}</h3>
                                <div className="flex items-center justify-between max-w-sm">
                                    <Label className="text-sm font-medium text-gray-600">{t("maintenance_mode")}</Label>
                                    <Switch
                                        checked={formData.maintenance_mode}
                                        onCheckedChange={(checked) => handleChange('maintenance_mode', checked)}
                                        className="data-[state=checked]:bg-indigo-500 scale-90"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "Miscellaneous":
                return (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="pb-2 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-700">{t("miscellaneous_settings")}</h2>
                        </div>

                        <div className="space-y-8 max-w-4xl">
                            {/* Online Exam */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("online_exam")}</h3>
                                <div className="pl-4">
                                    <div className="flex items-center justify-between max-w-md">
                                        <Label className="text-sm font-medium text-gray-600">{t("active_online_exam_show_only_my_created_question")}</Label>
                                        <Switch
                                            checked={!!formData.online_exam_show_only_my_question}
                                            onCheckedChange={(checked) => handleChange('online_exam_show_only_my_question', checked)}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ID Card Scan Code */}
                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("id_card_scan_code")}</h3>
                                <div className="pl-4">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-gray-600">{t("scan_code_type")}</Label>
                                        <RadioGroup
                                            value={formData.id_card_scan_code || "barcode"}
                                            onValueChange={(val) => handleChange('id_card_scan_code', val)}
                                            className="flex items-center gap-6"
                                        >
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="barcode" id="barcode" className="border-indigo-500 text-indigo-500" />
                                                <label htmlFor="barcode" className="text-sm text-gray-600 font-medium cursor-pointer">{t("barcode")}</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RadioGroupItem value="qrcode" id="qrcode" className="border-indigo-500 text-indigo-500" />
                                                <label htmlFor="qrcode" className="text-sm text-gray-600 font-medium cursor-pointer">{t("qr_code")}</label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>
                            </div>

                            {/* Exam Result & Admit Card */}
                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("exam_settings")}</h3>
                                <div className="pl-4 space-y-6">
                                    <div className="flex items-center justify-between max-w-md">
                                        <Label className="text-sm font-medium text-gray-600">{t("exam_result_page_in_front_site")}</Label>
                                        <Switch
                                            checked={!!formData.exam_result_page_in_front_site}
                                            onCheckedChange={(checked) => handleChange('exam_result_page_in_front_site', checked)}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between max-w-md">
                                        <Label className="text-sm font-medium text-gray-600">{t("exam_admit_card_download_in_student_panel")}</Label>
                                        <Switch
                                            checked={!!formData.exam_admit_card_download_in_student_panel}
                                            onCheckedChange={(checked) => handleChange('exam_admit_card_download_in_student_panel', checked)}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Teacher Restrictions */}
                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("teacher_settings")}</h3>
                                <div className="pl-4">
                                    <div className="flex items-center justify-between max-w-md">
                                        <Label className="text-sm font-medium text-gray-600">{t("teacher_restricted_mode")}</Label>
                                        <Switch
                                            checked={!!formData.teacher_restricted_mode}
                                            onCheckedChange={(checked) => handleChange('teacher_restricted_mode', checked)}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Superadmin Visibility */}
                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("super_admin_settings")}</h3>
                                <div className="pl-4">
                                    <div className="flex items-center justify-between max-w-md">
                                        <Label className="text-sm font-medium text-gray-600">{t("superadmin_visibility")}</Label>
                                        <Switch
                                            checked={!!formData.superadmin_visibility}
                                            onCheckedChange={(checked) => handleChange('superadmin_visibility', checked)}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Event Reminder */}
                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("event_settings")}</h3>
                                <div className="pl-4">
                                    <div className="flex items-center justify-between max-w-md">
                                        <Label className="text-sm font-medium text-gray-600">{t("event_reminder")}</Label>
                                        <Switch
                                            checked={!!formData.event_reminder}
                                            onCheckedChange={(checked) => handleChange('event_reminder', checked)}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Staff Leave Notification */}
                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("staff_leave_settings")}</h3>
                                <div className="pl-4">
                                    <div className="space-y-1.5 max-w-md">
                                        <Label className="text-sm font-medium text-gray-600">{t("staff_apply_leave_notification_email")}</Label>
                                        <Input
                                            value={formData.staff_apply_leave_notification_email || ""}
                                            onChange={(e) => handleChange('staff_apply_leave_notification_email', e.target.value)}
                                            className="h-9 text-sm border-gray-200 focus:ring-indigo-500 shadow-none rounded-md"
                                            placeholder="Enter email for notifications"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Multi Class Selection */}
                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t("admission_settings")}</h3>
                                <div className="pl-4">
                                    <div className="flex items-center justify-between max-w-md">
                                        <Label className="text-sm font-medium text-gray-600">{t("enable_multi_class_selection_in_student_admission_form")}</Label>
                                        <Switch
                                            checked={!!formData.enable_multi_class_selection_in_student_admission_form}
                                            onCheckedChange={(checked) => handleChange('enable_multi_class_selection_in_student_admission_form', checked)}
                                            className="data-[state=checked]:bg-indigo-500 scale-90"
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-64 opacity-30">
                        <h2 className="text-lg font-bold text-gray-400">{activeTab} {t("settings")}</h2>
                        <p className="text-xs text-gray-400 uppercase tracking-widest mt-2">{t("configuration_module_pending")}</p>
                    </div>
                );
        }
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <Card className="pt-0 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Settings className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("general_setting")}</h1>
                            <p className="text-xs text-gray-500 mt-1">{t("configure_your_schools_general_settings")}</p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleClearCache}
                        disabled={clearingCache}
                        className="h-9 px-4 rounded-full text-xs font-bold gap-2 border-rose-200 bg-rose-50/50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all shadow-sm shrink-0"
                    >
                        {clearingCache ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Clear System Cache
                    </Button>
                </div>
                <CardContent className="p-6 pt-4">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Sidebar Tabs */}
                        <div className="w-full md:w-64 space-y-0.5 bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden h-fit">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "w-full text-left px-4 py-3 text-sm font-medium transition-all relative border-b border-gray-50 last:border-b-0",
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
                        <div className="flex-1 bg-white border border-gray-100 rounded-lg shadow-sm p-6 flex flex-col min-h-[700px]">
                            <div className="flex-1">
                                {renderContent()}
                            </div>

                            {/* Save Button */}
                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                <Button
                                    onClick={() => setIsSaveDialogOpen(true)}
                                    disabled={saving}
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-8 h-9 text-xs font-bold uppercase transition-all rounded-full shadow-md border-none"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            {t("loading")}
                                        </>
                                    ) : (
                                        t("save")
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Save Confirmation Dialog */}
                    <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                        <DialogContent className="sm:max-w-[425px] border-none shadow-2xl p-0 overflow-hidden rounded-lg bg-white">
                            <div className="bg-gradient-to-br from-indigo-50/50 to-white p-6 pt-8">
                                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                                    <Save className="h-8 w-8 text-indigo-600" />
                                </div>
                                <DialogHeader className="space-y-3">
                                    <DialogTitle className="text-center text-xl font-bold text-gray-800">
                                        {t("save_configuration")}
                                    </DialogTitle>
                                    <DialogDescription className="text-center text-sm text-gray-500 leading-relaxed px-4">
                                        {t("you_are_about_to_update_the_system_settings")}
                                    </DialogDescription>
                                </DialogHeader>
                            </div>

                            <DialogFooter className="bg-gray-50/80 p-4 gap-3 sm:gap-0 flex flex-row">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsSaveDialogOpen(false)}
                                    disabled={saving}
                                    className="flex-1 h-11 font-bold text-gray-500 hover:bg-gray-100 rounded-lg"
                                >
                                    {t("review")}
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            {t("applying")}
                                        </>
                                    ) : (
                                        t("update_now")
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
    );
}

