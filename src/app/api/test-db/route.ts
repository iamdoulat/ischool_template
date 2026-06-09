import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/students?limit=5', {
            headers: {
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
