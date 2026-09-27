import { getImageUrl } from "@/lib/image-url";

export const runtime = 'nodejs';
export const revalidate = 10;

export const size = {
    width: 32,
    height: 32,
};
export const contentType = 'image/png';

export default async function Icon() {
    let faviconUrl = "";

    try {
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        let apiUrl = rawApiUrl.replace(/\/+$/, "");
        const isLocal = apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1");
        if (process.env.NODE_ENV === "production" && !isLocal) {
            apiUrl = apiUrl.replace(/^http:\/\//i, "https://");
        }
        if (!apiUrl.endsWith("/api/v1") && !apiUrl.includes("/api/v")) {
            apiUrl = `${apiUrl}/api/v1`;
        }

        const res = await fetch(`${apiUrl}/system-setting/general-setting`, {
            next: { revalidate: 15 },
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(5000),
        }).catch(() => null);

        if (res && res.ok) {
            const json = await res.json();
            const settings = json.data || json;
            const raw = settings.favicon || settings.app_favicon || settings.admin_small_logo || settings.app_logo;
            if (raw) {
                let domain = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000")
                    .replace(/\/+$/, "")
                    .replace(/\/api\/v1\/?$/, "");
                if (process.env.NODE_ENV === "production" && !domain.includes("localhost") && !domain.includes("127.0.0.1")) {
                    domain = domain.replace(/^http:\/\//i, "https://");
                }
                faviconUrl = getImageUrl(raw, settings.base_url || domain);
                if (faviconUrl && !faviconUrl.startsWith("http://") && !faviconUrl.startsWith("https://")) {
                    faviconUrl = `${domain}${faviconUrl.startsWith("/") ? "" : "/"}${faviconUrl}`;
                }
            }
        }
    } catch {
        // Silent fallback
    }

    if (faviconUrl && (faviconUrl.startsWith("http://") || faviconUrl.startsWith("https://"))) {
        try {
            const imgRes = await fetch(faviconUrl);
            if (imgRes.ok) {
                const arrayBuffer = await imgRes.arrayBuffer();
                const mimeType = imgRes.headers.get("content-type") || "image/png";
                return new Response(arrayBuffer, {
                    headers: {
                        "Content-Type": mimeType,
                        "Cache-Control": "public, max-age=60, s-maxage=60",
                    },
                });
            }
        } catch (e) {
            console.error("Error proxying favicon in icon.tsx:", e);
        }
    }

    // Default fallback to public logo-admin-small.png
    return new Response(null, {
        status: 302,
        headers: { Location: "/logo-admin-small.png" },
    });
}
