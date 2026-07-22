import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const rawUrl = req.nextUrl.searchParams.get("url");
    if (!rawUrl) return new NextResponse("Missing URL", { status: 400 });

    try {
        let targetUrl = rawUrl;

        const backendBaseUrl = (
            process.env.NEXT_PUBLIC_API_URL || "https://api.ischool.mddoulat.com"
        )
            .replace(/\/+$/, "")
            .replace(/\/api\/v1\/?$/, "");

        // If URL is relative (e.g. /storage/... or /logo-admin.png)
        if (targetUrl.startsWith("/")) {
            if (targetUrl.startsWith("/storage/") || targetUrl.startsWith("/uploads/")) {
                targetUrl = `${backendBaseUrl}${targetUrl}`;
            } else {
                // Next.js frontend relative path
                targetUrl = `${req.nextUrl.origin}${targetUrl}`;
            }
        } else if (targetUrl.includes("localhost") || targetUrl.includes("127.0.0.1")) {
            // Replace localhost/127.0.0.1 with backend domain
            targetUrl = targetUrl.replace(/^https?:\/\/[^\/]+/, backendBaseUrl);
        }

        const response = await fetch(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            },
        });

        if (!response.ok) {
            return new NextResponse(`Failed to fetch image from target: ${response.status}`, { status: response.status });
        }
        
        const buffer = await response.arrayBuffer();
        const headers = new Headers();
        headers.set("Content-Type", response.headers.get("Content-Type") || "image/png");
        headers.set("Access-Control-Allow-Origin", "*");
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        
        return new NextResponse(buffer, { headers });
    } catch (error: any) {
        console.error("proxy-image error:", error);
        return new NextResponse(`Internal Proxy Error: ${error?.message || error}`, { status: 500 });
    }
}
