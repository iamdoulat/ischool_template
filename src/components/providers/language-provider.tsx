"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { i18nFallbacks } from "@/lib/i18n-fallbacks";
import { i18nFallbacksBn } from "@/lib/i18n-fallbacks-bn";

interface Language {
    id: number;
    name: string;
    short_code: string;
    country_code: string;
    is_rtl: boolean;
    is_active: boolean;
    is_enabled: boolean;
}

interface LanguageContextType {
    selectedLanguage: Language | null;
    setSelectedLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    loading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
    selectedLanguage: null,
    setSelectedLanguage: () => { },
    t: (key: string, _params?: Record<string, string | number>) => key,
    loading: true,
});

export const useLanguage = () => useContext(LanguageContext);

/** Maps language short-codes to their locale-specific fallback dictionaries. */
function getLocaleFallbacks(code: string): Record<string, string> | null {
    switch (code) {
        case "bn":
            return i18nFallbacksBn;
        // Add more locales here as needed, e.g.:
        // case "hi": return i18nFallbacksHi;
        default:
            return null;
    }
}

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedLanguage, setSelectedLanguageState] = useState<Language | null>(null);
    const [translations, setTranslations] = useState<any>({});
    const [loading, setLoading] = useState(true);

    const fetchTranslations = useCallback(async (code: string) => {
        try {
            const response = await api.get(`/system-setting/languages/translations/${code}`);
            if (response.data.success) {
                setTranslations(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch translations", error);
        }
    }, []);

    useEffect(() => {
        const savedLanguage = localStorage.getItem("selected_language");
        if (savedLanguage) {
            try {
                const parsed = JSON.parse(savedLanguage);
                setSelectedLanguageState(parsed);
                fetchTranslations(parsed.short_code);

                // Set RTL if needed
                updateLayoutDirection(parsed.is_rtl);
            } catch (e) {
                console.error("Failed to parse saved language", e);
            }
        }
        setLoading(false);
    }, [fetchTranslations]);

    const updateLayoutDirection = (isRtl: boolean) => {
        if (typeof document !== 'undefined') {
            document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        }
    };

    const setSelectedLanguage = (lang: Language) => {
        setSelectedLanguageState(lang);
        fetchTranslations(lang.short_code);
        localStorage.setItem("selected_language", JSON.stringify(lang));
        updateLayoutDirection(lang.is_rtl);
    };

    const t = (key: string, params?: Record<string, string | number>): string => {
        // Hardcoded overrides — special display names that differ from key convention
        const overrides: Record<string, string> = {
            send_wa: "Send WA",
            wa_template: "WA Template",
            whatsapp_messaging: "WhatsApp Gateway",
            sms_setting: "SMS Gateway",
            email_setting: "Email Gateway",
            email_sms_log: "Email / SMS / WA Logs",
            schedule_email_sms_log: "Schedule Email / SMS / WA Logs",
        };

        if (overrides[key]) return overrides[key];

        // 1. API-loaded translations take top priority
        if (translations[key]) return translations[key];

        // 2. Locale-specific fallbacks (Bengali, etc.)
        const langCode = selectedLanguage?.short_code;
        if (langCode !== "en" && langCode) {
            const localeFallbacks = getLocaleFallbacks(langCode);
            if (localeFallbacks && localeFallbacks[key]) return localeFallbacks[key];
        }

        // 3. Built-in English fallbacks
        let result = i18nFallbacks[key];

        // 4. Ultimate fallback: humanize the key itself
        if (!result) {
            result = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        }

        // Interpolation: replace {paramName} placeholders
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                result = result.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
            }
        }

        return result;
    };

    return (
        <LanguageContext.Provider value={{
            selectedLanguage,
            setSelectedLanguage,
            t,
            loading
        }}>
            {children}
        </LanguageContext.Provider>
    );
};
