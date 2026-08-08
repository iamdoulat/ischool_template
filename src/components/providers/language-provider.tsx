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
        setSelectedLanguageState((prev) => {
            if (prev?.short_code === lang.short_code && prev?.id === lang.id) {
                return prev;
            }
            return lang;
        });
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

        // Default system language lookup (admin active language)
        try {
            const res = await api.get("/system-setting/languages/public").catch(() => null);
            if (res?.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                const enabled: Language[] = res.data.data;
                const active = enabled.find((l: Language) => l.is_active === true || (l.is_active as unknown) === 1 || String(l.is_active) === '1' || String(l.is_active) === 'true') || enabled.find((l: Language) => l.short_code === 'en') || enabled[0];
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
        // Initial auto-detection of user from profile ONCE on mount
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
            api.get("/profile", { skipGlobalErrorHandler: true })
                .then((res) => {
                    if (res.data?.success && res.data.data) {
                        setCurrentUser(res.data.data);
                        loadLanguageForUser(res.data.data);
                    } else {
                        setCurrentUser(null);
                        loadLanguageForUser(null);
                    }
                })
                .catch(() => {
                    setCurrentUser(null);
                    loadLanguageForUser(null);
                });
        } else {
            setCurrentUser(null);
            loadLanguageForUser(null);
        }
    }, []);

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
        if (!key || typeof key !== "string") return key || "";

        // Hardcoded overrides — special display names that differ from key convention
        const overrides: Record<string, string> = {
            send_wa: "Send WA",
            wa_template: "WA Template",
            whatsapp_messaging: "WhatsApp Gateway",
            sms_setting: "SMS Gateway",
            email_setting: "Email Gateway",
            email_sms_log: "Email / SMS / WA Logs",
            schedule_email_sms_log: "Schedule Email / SMS / WA Logs",
            issue_return: "Issue Books",
        };

        if (overrides[key]) return overrides[key];

        const langCode = selectedLanguage?.short_code;
        const normKey = key.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

        let result: string | undefined;

        // Helper to query dictionary by key or normKey
        const getFromDict = (dict: Record<string, string>) => {
            if (dict[key] !== undefined) return dict[key];
            if (normKey && dict[normKey] !== undefined) return dict[normKey];
            return undefined;
        };

        // 1. Locale-specific fallbacks (Bengali, Arabic, Hindi, etc.) take highest priority when non-English
        if (langCode && langCode !== "en") {
            const localeFallbacks = getLocaleFallbacks(langCode);
            if (localeFallbacks) {
                const locVal = getFromDict(localeFallbacks);
                if (locVal !== undefined && locVal !== "") {
                    result = locVal;
                }
            }
        }

        // 2. API-loaded translations take priority if not resolved by locale fallbacks
        if (result === undefined) {
            const apiVal = getFromDict(translations);
            if (apiVal !== undefined) {
                const engFallback = i18nFallbacks[key] || (normKey ? i18nFallbacks[normKey] : undefined);
                const looksEnglish =
                    langCode &&
                    langCode !== "en" &&
                    engFallback &&
                    apiVal === engFallback;

                if (!looksEnglish) result = apiVal;
            }
        }

        // 3. Built-in English fallbacks
        if (result === undefined) {
            result = getFromDict(i18nFallbacks);
        }

        // 4. Ultimate fallback: humanize the key itself
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

