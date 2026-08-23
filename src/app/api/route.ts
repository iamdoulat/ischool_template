import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "success",
      message: "iSchool API Gateway & SMS System Active",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      endpoints: {
        documentation: "/api/docs",
        settings: "/api/settings",
        health: "/api/health",
        v1: "/api/v1",
      },
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    }
  );
}
