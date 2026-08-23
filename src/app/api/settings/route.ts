import { NextResponse } from "next/server";

export async function GET() {
  try {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/+$/, "");
    const res = await fetch(`${backendUrl}/system-setting/general-setting`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // fallback if backend is momentarily unreachable
  }

  return NextResponse.json({
    status: "success",
    data: {
      school_name: "iSchool Management System",
      school_slogan: "Excellence in Education",
      phone: "+880 1800-123456",
      email: "info@ischool.edu.bd",
      address: "House 42, Road 11, Banani, Dhaka-1213, Bangladesh",
      currency: "BDT",
      session: "2026",
    },
  });
}
