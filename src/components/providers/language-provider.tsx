"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { i18nFallbacks } from "@/lib/i18n-fallbacks";
import { i18nFallbacksBn } from "@/lib/i18n-fallbacks-bn";
import { i18nFallbacksAr } from "@/lib/i18n-fallbacks-ar";
import { i18nFallbacksHi } from "@/lib/i18n-fallbacks-hi";

interface Language {
    id: number;
    name: string;
    short_code: string;
    country_code: string;
    is_rtl: boolean;
    is_active: boolean;
    is_enabled: boolean;
}

type UserRecord = Record<string, unknown> | null;

interface LanguageContextType {
    selectedLanguage: Language | null;
    setSelectedLanguage: (lang: Language) => void;
    setUserContext: (user: UserRecord) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    loading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
    selectedLanguage: null,
    setSelectedLanguage: () => { },
    setUserContext: () => { },
    t: (key: string) => key,
    loading: true,
});

export const useLanguage = () => useContext(LanguageContext);

/** Maps language short-codes to their locale-specific fallback dictionaries. */
function getLocaleFallbacks(code: string): Record<string, string> | null {
    switch (code) {
        case "bn":
            return i18nFallbacksBn;
        case "ar":
            return i18nFallbacksAr;
        case "hi":
            return i18nFallbacksHi;
        default:
            return null;
    }
}

function getStorageKey(user: UserRecord): string {
    if (user) {
        const id = user.id || user.username || user.email;
        if (id) {
            return `selected_language_user_${id}`;
        }
    }
    return "selected_language_public";
}

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedLanguage, setSelectedLanguageState] = useState<Language | null>(null);
    const [translations, setTranslations] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<UserRecord>(null);

    const updateLayoutDirection = (isRtl: boolean) => {
        if (typeof document !== 'undefined') {
            document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        }
    };

    const fetchTranslations = useCallback(async (code: string) => {
        try {
            const response = await api.get(`/system-setting/languages/translations/${code}`).catch(() => ({ data: { success: false, data: {} } }));
            if (response.data?.success) {
                setTranslations(response.data.data as Record<string, string>);
            }
        } catch (error) {
            console.error("Failed to fetch translations", error);
        }
    }, []);

    const applyLanguage = useCallback((lang: Language) => {
        setSelectedLanguageState(lang);
        fetchTranslations(lang.short_code);
        updateLayoutDirection(lang.is_rtl);
    }, [fetchTranslations]);

    const loadLanguageForUser = useCallback(async (user: UserRecord) => {
        const key = getStorageKey(user);
        
        // Clean up legacy global un-scoped key if present
        if (typeof window !== 'undefined' && localStorage.getItem("selected_language")) {
            localStorage.removeItem("selected_language");
        }

        const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        if (savedLanguage) {
            try {
                const parsed = JSON.parse(savedLanguage);
                applyLanguage(parsed);
                setLoading(false);
                return;
            } catch (e) {
                console.error("Failed to parse saved language for key " + key, e);
            }
        }

        // Default system language lookup
        try {
            const res = await api.get("/system-setting/languages/public").catch(() => null);
            if (res?.data?.success && res.data.data?.length > 0) {
                const enabled = res.data.data;
                const active = enabled.find((l: Language) => l.is_active) || enabled.find((l: Language) => l.short_code === 'en') || enabled[0];
                if (active) {
                    applyLanguage(active);
                }
            } else {
                // Fallback default
                applyLanguage({ id: 1, name: "English", short_code: "en", country_code: "us", is_rtl: false, is_active: true, is_enabled: true });
            }
        } catch {
            applyLanguage({ id: 1, name: "English", short_code: "en", country_code: "us", is_rtl: false, is_active: true, is_enabled: true });
        } finally {
            setLoading(false);
        }
    }, [applyLanguage]);

    const setUserContext = useCallback((user: UserRecord) => {
        setCurrentUser(user);
        loadLanguageForUser(user);
    }, [loadLanguageForUser]);

    useEffect(() => {
        // Initial auto-detection of user from profile if token exists
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
            api.get("/profile", { skipGlobalErrorHandler: true })
                .then((res) => {
                    if (res.data?.success && res.data.data) {
                        setCurrentUser(res.data.data);
                        loadLanguageForUser(res.data.data);
                    } else {
                        setUserContext(null);
                    }
                })
                .catch(() => {
                    setUserContext(null);
                });
        } else {
            setUserContext(null);
        }
    }, [loadLanguageForUser, setUserContext]);

    const setSelectedLanguage = (lang: Language) => {
        applyLanguage(lang);
        const key = getStorageKey(currentUser);
        if (typeof window !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(lang));
            // Ensure old legacy key is removed
            localStorage.removeItem("selected_language");
        }
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

        const langCode = selectedLanguage?.short_code;

        // Resolve the raw template string from the highest-priority source, then
        // interpolate once at the end so {paramName} placeholders are always
        // replaced regardless of which source the string came from.
        let result: string | undefined;

        // 1. API-loaded translations take priority
        if (translations[key]) {
            // If the API translation equals the English fallback (i.e. the backend
            // returned English because it has no real translation for this locale),
            // skip it and use the locale-specific fallback instead.
            const engFallback = i18nFallbacks[key];
            const looksEnglish =
                langCode &&
                langCode !== "en" &&
                engFallback &&
                translations[key] === engFallback;

            if (!looksEnglish) result = translations[key];
        }

        // 2. Locale-specific fallbacks (Bengali, etc.). An intentionally blank
        //    translation ("") is a valid value, so only skip when the key is
        //    truly absent — not merely falsy.
        if (result === undefined && langCode !== "en" && langCode) {
            const localeFallbacks = getLocaleFallbacks(langCode);
            if (localeFallbacks && localeFallbacks[key] !== undefined) result = localeFallbacks[key];
        }

        // 3. Built-in English fallbacks
        if (result === undefined) {
            result = i18nFallbacks[key];
        }

        // 4. Ultimate fallback: humanize the key itself (only when truly missing;
        //    an empty-string translation above is respected as-is).
        if (result === undefined) {
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
            setUserContext,
            t,
            loading
        }}>
            {children}
        </LanguageContext.Provider>
    );
};

