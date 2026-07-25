"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SmartAttendanceSettingsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/qr-code-attendance/setting");
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-xs">
            Redirecting to QR Code & Smart Attendance Settings...
        </div>
    );
}
