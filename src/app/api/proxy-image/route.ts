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
            if (targetUrl.startsWith("/storage/")) {
                targetUrl = `${backendBaseUrl}${targetUrl}`;
            } else if (targetUrl.startsWith("/uploads/")) {
                targetUrl = `${backendBaseUrl}/storage${targetUrl}`;
            } else {
                // Next.js frontend relative path
                targetUrl = `${req.nextUrl.origin}${targetUrl}`;
            }
        } else if (targetUrl.includes("localhost") || targetUrl.includes("127.0.0.1")) {
            // Replace localhost/127.0.0.1 with backend domain
            targetUrl = targetUrl.replace(/^https?:\/\/[^\/]+/, backendBaseUrl);
        }

        if (targetUrl.includes("/uploads/") && !targetUrl.includes("/storage/uploads/")) {
            targetUrl = targetUrl.replace("/uploads/", "/storage/uploads/");
        }

        let response = await fetch(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            },
        });

        // Fallback retry: if /storage/uploads/ gave 404, try /uploads/ directly
        if (!response.ok && response.status === 404 && targetUrl.includes("/storage/uploads/")) {
            const altUrl = targetUrl.replace("/storage/uploads/", "/uploads/");
            const altRes = await fetch(altUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                },
            });
            if (altRes.ok) {
                response = altRes;
            }
        }

        if (!response.ok) {
            // Return 1x1 transparent PNG fallback instead of 404 to avoid console errors
            const transparentPng = Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
                "base64"
            );
            return new NextResponse(transparentPng, {
                status: 200,
                headers: {
                    "Content-Type": "image/png",
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-store, must-revalidate",
                },
            });
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
