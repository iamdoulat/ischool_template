"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

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
    t: (key: string) => string;
    loading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
    selectedLanguage: null,
    setSelectedLanguage: () => { },
    t: (key: string) => key,
    loading: true,
});

export const useLanguage = () => useContext(LanguageContext);

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

    const t = (key: string): string => {
        return translations[key] || key;
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
