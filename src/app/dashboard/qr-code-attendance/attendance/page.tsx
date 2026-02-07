"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, User } from "lucide-react";

export default function QrCodeAttendancePage() {
    const [mode, setMode] = useState<"camera" | "sensor">("sensor");

    return (
        <div className="bg-white rounded-lg shadow-sm border min-h-[500px] flex flex-col relative">
            <div className="flex justify-between items-center p-4 border-b">
                <h1 className="text-lg font-medium text-gray-800">QR Code Attendance</h1>
                <div className="flex items-center gap-2">
                    <div className="flex border rounded-md overflow-hidden bg-white shadow-sm">
                        <button
                            onClick={() => setMode("camera")}
                            className={`px-4 py-1.5 text-xs font-medium transition-colors ${mode === "camera"
                                    ? "bg-[#6366f1] text-white"
                                    : "bg-white text-indigo-500 hover:bg-gray-50"
                                }`}
                        >
                            Camera-based device
                        </button>
                        <button
                            onClick={() => setMode("sensor")}
                            className={`px-4 py-1.5 text-xs font-medium transition-colors ${mode === "sensor"
                                    ? "bg-[#6366f1] text-white"
                                    : "bg-white text-indigo-500 hover:bg-gray-50"
                                }`}
                        >
                            Sensor-based device
                        </button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-red-500">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-8">
                {mode === "sensor" && (
                    <div className="w-full space-y-8">
                        <Input
                            placeholder="Scan Your ID Card QR Code / Barcode"
                            className="w-full border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-6"
                            autoFocus
                        />
                        <div className="flex justify-center">
                            <MockIdCardIcon />
                        </div>
                    </div>
                )}

                {mode === "camera" && (
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        {/* Camera View */}
                        <div className="flex flex-col items-center">
                            <div className="w-full max-w-[400px] bg-gray-50 border rounded-t-md p-2 text-center text-sm font-medium text-gray-700">
                                Scan Your ID Card QR Code / Barcode
                            </div>
                            <div className="w-full max-w-[400px] aspect-square bg-white border border-t-0 p-4 flex items-start justify-center">
                                <div className="w-full h-full border-2 border-dashed border-red-200 bg-red-50 flex items-center justify-center text-red-500 text-sm font-medium">
                                    Camera not found.
                                </div>
                            </div>
                        </div>

                        {/* ID Card Icon */}
                        <div className="flex justify-center">
                            <MockIdCardIcon />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function MockIdCardIcon() {
    return (
        <div className="relative w-64 h-48 border-4 border-gray-800 rounded-2xl flex flex-col items-center justify-center bg-white">
            {/* Lanyard Clip */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-8 border-4 border-gray-800 rounded-t-lg bg-white flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gray-800"></div>
            </div>
            {/* Lines */}
            <div className="absolute top-4 w-full h-0.5 bg-gray-800"></div>

            <div className="w-full h-full p-4 flex items-center gap-4 mt-2">
                {/* Profile Photo Placeholder */}
                <div className="w-20 h-24 border-4 border-gray-800 flex items-center justify-center bg-gray-100">
                    <User className="h-12 w-12 text-gray-800" />
                </div>

                {/* Text Lines */}
                <div className="flex-1 space-y-3">
                    <div className="h-2 w-full bg-gray-800 rounded-full"></div>
                    <div className="h-2 w-3/4 bg-gray-800 rounded-full"></div>
                    <div className="h-2 w-full bg-gray-800 rounded-full"></div>
                    {/* Mini QR */}
                    <div className="flex justify-end pt-1">
                        <div className="w-10 h-10 border-2 border-gray-800 grid grid-cols-2 gap-0.5 p-0.5">
                            <div className="bg-gray-800"></div>
                            <div className="bg-gray-800 opacity-50"></div>
                            <div className="bg-gray-800 opacity-20"></div>
                            <div className="bg-gray-800"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
