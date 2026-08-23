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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        const res = await fetch(`${apiUrl}/system-setting/general-setting`, {
            next: { revalidate: 30 },
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(1500),
        }).catch(() => null);

        if (res && res.ok) {
            const json = await res.json();
            const settings = json.data || json;
            const raw = settings.favicon || settings.app_favicon || settings.admin_small_logo || settings.app_logo;
            if (raw) {
                const domain = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000")
                    .replace(/\/+$/, "")
                    .replace(/\/api\/v1\/?$/, "");
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
