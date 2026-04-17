import { useLanguage } from "@/components/providers/language-provider";

export function useTranslation() {
    const { t, selectedLanguage } = useLanguage();

    return {
        t,
        language: selectedLanguage,
        isRtl: selectedLanguage?.is_rtl || false,
    };
}
