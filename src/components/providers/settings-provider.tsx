"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import api from "@/lib/api";

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
    staff_attendance_settings: Array<{ type: string; from: string; upto: string; total: string }>;
    student_attendance_settings: Array<{ type: string; from: string; upto: string; total: string }>;
}

interface SettingsContextType {
    settings: GeneralSettings | null;
    loading: boolean;
    refreshSettings: () => Promise<void>;
    updateSettingsLocal: (newSettings: Partial<GeneralSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: null,
    loading: true,
    refreshSettings: async () => { },
    updateSettingsLocal: () => { },
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [settings, setSettings] = useState<GeneralSettings | null>(null);
    const [loading, setLoading] = useState(true);

    const { setTheme } = useTheme();

    const fetchSettings = async () => {
        try {
            const response = await api.get("/system-setting/general-setting");
            if (response.data.status === "Success") {
                const incomingData = response.data.data || {};
                const normalizedData: any = {};

                // Fields to normalize
                const fields = [
                    'school_name', 'school_slogan', 'school_description', 'school_code', 'address', 'phone', 'email',
                    'session', 'session_start_month', 'date_format', 'timezone',
                    'start_day_of_week', 'currency_format', 'base_url', 'file_upload_path',
                    'print_logo', 'admin_logo', 'admin_small_logo', 'app_logo',
                    'login_page_background_admin', 'login_page_background_user',
                    'theme_mode', 'skins', 'side_menu', 'primary_color', 'box_content',
                    'theme_mode', 'skins', 'side_menu', 'primary_color', 'box_content',
                    'mobile_api_url', 'mobile_primary_color', 'mobile_secondary_color',
                    'student_login', 'parent_login', 'student_login_admission_no',
                    'student_login_mobile_no', 'student_login_email', 'parent_login_mobile_no',
                    'parent_login_email', 'allow_student_to_add_timeline',
                    'attendance_type', 'biometric_attendance', 'devices', 'low_attendance_limit',
                    'staff_attendance_settings', 'student_attendance_settings'
                ];

                fields.forEach(field => {
                    const value = incomingData[field];
                    if (field.includes('login') || field === 'allow_student_to_add_timeline' || field === 'biometric_attendance') {
                        normalizedData[field] = (value === 1 || value === true || value === '1' || value === 'true');
                    } else if (field === 'staff_attendance_settings' || field === 'student_attendance_settings') {
                        normalizedData[field] = Array.isArray(value) ? value : [];
                    } else {
                        normalizedData[field] = (value !== null && value !== undefined) ? String(value) : "";
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
        } finally {
            setLoading(false);
        }
    };

    const updateSettingsLocal = (newData: Partial<GeneralSettings>) => {
        setSettings(prev => {
            const updated = prev ? { ...prev, ...newData } : null;
            if (updated?.theme_mode) {
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
