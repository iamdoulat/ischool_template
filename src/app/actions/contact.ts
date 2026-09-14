"use server";

import { serverFetch } from "@/lib/server-api";

export interface ContactFormData {
    name: string;
    email: string;
    mobile?: string;
    details: string;
}

export interface ContactActionResponse {
    success: boolean;
    message: string;
}

/**
 * Next.js Server Action (Flow 2):
 * Executed on the Next.js server. Makes the POST API call directly to the Laravel backend.
 * The backend API endpoint and credentials are completely hidden from the browser console.
 */
export async function submitContactAction(
    formData: ContactFormData
): Promise<ContactActionResponse> {
    // Basic server-side validation
    if (!formData.name?.trim() || !formData.email?.trim() || !formData.details?.trim()) {
        return {
            success: false,
            message: "Name, email, and message details are required.",
        };
    }

    try {
        const { data, error, status } = await serverFetch<any>(
            "/front-cms/contact-form/submit",
            {
                method: "POST",
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    mobile: formData.mobile?.trim() || "",
                    details: formData.details.trim(),
                }),
                cache: "no-store",
            }
        );

        if (error || status >= 400) {
            return {
                success: false,
                message: error || "Failed to submit message to the school office.",
            };
        }

        const successMessage =
            data?.message ||
            (typeof data === "string" ? data : null) ||
            "Your message has been sent successfully. We will get back to you shortly.";

        return {
            success: true,
            message: successMessage,
        };
    } catch (err: any) {
        return {
            success: false,
            message: err.message || "An unexpected error occurred while sending your message.",
        };
    }
}
