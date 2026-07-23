"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import api from "@/lib/api";
import { getImageUrl } from "@/lib/image-url";

const fallbackBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api\/v1\/?$/, "");

interface GeneralSettings {
    school_name: string;
    school_slogan: string;
    school_description: string;
    school_code: string;
    address: string;
    phone: string;
    email: string;
    session: string;
    session_start_month: string;
    date_format: string;
    timezone: string;
    start_day_of_week: string;
    currency_format: string;
    base_url: string;
    file_upload_path: string;
    print_logo: string;
    print_logo_base64?: string;
    admin_logo: string;
    admin_small_logo: string;
    app_logo: string;
    login_page_background_admin: string;
    login_page_background_user: string;
    theme_mode: string;
    skins: string;
    side_menu: string;
    primary_color: string;
    box_content: string;
    mobile_api_url: string;
    mobile_primary_color: string;
    mobile_secondary_color: string;
    student_login: boolean;
    parent_login: boolean;
    student_login_admission_no: boolean;
    student_login_mobile_no: boolean;
    student_login_email: boolean;
    parent_login_mobile_no: boolean;
    parent_login_email: boolean;
    allow_student_to_add_timeline: boolean;
    attendance_type: string;
    biometric_attendance: boolean;
    devices: string;
    low_attendance_limit: string;
    time_format: string;
    staff_attendance_settings: Array<{ type: string; from: string; upto: string; total: string }>;
    student_attendance_settings: Array<{ type: string; from: string; upto: string; total: string }>;
    footer_contact_title?: string;
    footer_contact_info_label?: string;
    facebook_url?: string;
    twitter_url?: string;
    instagram_url?: string;
    youtube_url?: string;
    linkedin_url?: string;
    pinterest_url?: string;
    contact_form_receiver_email?: string;
    app_version?: string;
    maintenance_mode?: boolean;
    website?: string;
    url?: string;
    [key: string]: any;
}

function createDefaultSettings(): GeneralSettings {
    return {
        school_name: "iSchool Management System",
        school_slogan: "Excellence in Education",
        school_description: "Comprehensive school management system",
        school_code: "ISCHOOL",
        address: "Default Address",
        phone: "+1 234 567 890",
        email: "admin@ischool.com",
        session: "2026",
        session_start_month: "4",
        date_format: "d/m/Y",
        time_format: "12",
        timezone: "UTC",
        start_day_of_week: "monday",
        currency_format: "USD",
        base_url: fallbackBaseUrl,
        file_upload_path: "uploads/",
        print_logo: "/logo-print.png",
        print_logo_base64: "",
        admin_logo: "/logo-admin.png",
        admin_small_logo: "/logo-admin-small.png",
        app_logo: "/logo-app.png",
        login_page_background_admin: "/bg-admin.jpg",
        login_page_background_user: "/bg-user.jpg",
        theme_mode: "light",
        skins: "default",
        side_menu: "default",
        primary_color: "#3b82f6",
        box_content: "default",
        mobile_api_url: fallbackBaseUrl,
        mobile_primary_color: "#3b82f6",
        mobile_secondary_color: "#64748b",
        student_login: true,
        parent_login: true,
        student_login_admission_no: true,
        student_login_mobile_no: true,
        student_login_email: true,
        parent_login_mobile_no: true,
        parent_login_email: true,
        allow_student_to_add_timeline: true,
        attendance_type: "day_wise",
        biometric_attendance: false,
        devices: "",
        low_attendance_limit: "75",
        staff_attendance_settings: [],
        student_attendance_settings: [],
        footer_contact_title: "Contact Us",
        footer_contact_info_label: "Contact Info",
        facebook_url: "",
        twitter_url: "",
        instagram_url: "",
        youtube_url: "",
        linkedin_url: "",
        pinterest_url: "",
        contact_form_receiver_email: "",
        app_version: "7.2.0",
        maintenance_mode: false
    };
}

interface SettingsContextType {
    settings: GeneralSettings;
    loading: boolean;
    refreshSettings: () => Promise<void>;
    updateSettingsLocal: (newSettings: Partial<GeneralSettings>) => void;
}

const defaultCtxSettings = createDefaultSettings();

const SettingsContext = createContext<SettingsContextType>({
    settings: defaultCtxSettings,
    loading: true,
    refreshSettings: async () => { },
    updateSettingsLocal: () => { },
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [settings, setSettings] = useState<GeneralSettings>(createDefaultSettings());
    const [loading, setLoading] = useState(true);

    const { setTheme } = useTheme();

    const fetchSettings = async () => {
        try {
            const response = await api.get("/system-setting/general-setting");
            if (response.data.status === "Success" || response.data.data || response.data) {
                const incomingData = response.data.data || response.data || {};
                const defaults = createDefaultSettings();
                const normalizedData: Record<string, any> = { ...defaults };

                // Dynamically merge all backend setting properties
                Object.keys(incomingData).forEach(key => {
                    const value = incomingData[key];
                    if (value !== null && value !== undefined && value !== "") {
                        if (
                            key.includes('login') ||
                            key === 'allow_student_to_add_timeline' ||
                            key === 'biometric_attendance' ||
                            key === 'maintenance_mode'
                        ) {
                            normalizedData[key] = (value === 1 || value === true || value === '1' || value === 'true');
                        } else if (key === 'staff_attendance_settings' || key === 'student_attendance_settings') {
                            normalizedData[key] = Array.isArray(value) ? value : [];
                        } else {
                            normalizedData[key] = value;
                        }
                    }
                });

                // Resolve logo & background image paths to absolute URLs if uploaded
                const imageFields = [
                    'print_logo', 'admin_logo', 'admin_small_logo', 'app_logo',
                    'login_page_background_admin', 'login_page_background_user'
                ];

                imageFields.forEach(imgField => {
                    const val = normalizedData[imgField];
                    if (val && typeof val === 'string' && val.trim() !== '') {
                        normalizedData[imgField] = getImageUrl(val, normalizedData.base_url || fallbackBaseUrl);
                    }
                });

                const currentSettings = normalizedData as GeneralSettings;
                setSettings(currentSettings);

                // Set theme based on settings
                if (currentSettings.theme_mode) {
                    setTheme(currentSettings.theme_mode.toLowerCase());
                }
            }
        } catch (error) {
            console.error("Failed to fetch general settings:", error);
            setSettings(createDefaultSettings());
        } finally {
            setLoading(false);
        }
    };

    const updateSettingsLocal = (newData: Partial<GeneralSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newData };
            if (updated.theme_mode) {
                setTheme(updated.theme_mode.toLowerCase());
            }
            return updated;
        });
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{
            settings,
            loading,
            refreshSettings: fetchSettings,
            updateSettingsLocal
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
