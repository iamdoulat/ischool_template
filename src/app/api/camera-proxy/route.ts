import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');
    const user = request.nextUrl.searchParams.get('user');
    const pass = request.nextUrl.searchParams.get('pass');

    if (!url) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    try {
        const headers = new Headers();
        if (user && pass) {
            headers.set('Authorization', 'Basic ' + Buffer.from(user + ':' + pass).toString('base64'));
        }

        // Fetch the camera stream or snapshot
        const response = await fetch(url, { 
            headers,
            // Keep connection alive for MJPEG streams
            cache: 'no-store'
        });

        if (!response.ok) {
            return new NextResponse(`Camera responded with status: ${response.status}`, { status: response.status });
        }

        // Stream the response back to the client
        return new NextResponse(response.body, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'video/x-motion-jpeg',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error: any) {
        return new NextResponse(`Failed to connect to camera: ${error.message}`, { status: 500 });
    }
}
