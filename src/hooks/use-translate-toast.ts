"use client";

import { useTranslation } from "@/hooks/use-translation";
import { useToast } from "@/components/ui/use-toast";

/**
 * A translated toast helper that wraps the custom useToast() hook.
 * Automatically translates toast messages via t().
 *
 * Usage:
 *   const tt = useTranslateToast();
 *   tt.success("entity_created_successfully");
 *   tt.error("entity_delete_failed");
 *   tt.success("x_created_successfully", { entity: t("student") });
 */
export function useTranslateToast() {
    const { t } = useTranslation();
    const { toast } = useToast();

    return {
        success: (key: string, params?: Record<string, string | number>) =>
            toast("success", t(key, params)),
        error: (key: string, params?: Record<string, string | number>) =>
            toast("error", t(key, params)),
        toast: (type: "success" | "error", key: string, params?: Record<string, string | number>) =>
            toast(type, t(key, params)),
    };
}
