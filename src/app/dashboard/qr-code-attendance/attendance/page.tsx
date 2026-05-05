"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    X, User, Scan, Camera, Smartphone, 
    Monitor, ShieldCheck, Zap, UserCircle, 
    CheckCircle2, AlertCircle, RefreshCw,
    Maximize2, Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScannedUser {
    name: string;
    last_name: string;
    role: string;
    admission_no?: string;
    employee_id?: string;
    photo?: string;
    time: string;
}

export default function QrCodeAttendancePage() {
    const { toast } = useToast();
    const [mode, setMode] = useState<"camera" | "sensor">("sensor");
    const [scanValue, setScanValue] = useState("");
    const [processing, setProcessing] = useState(false);
    const [lastUser, setLastUser] = useState<ScannedUser | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (mode === "sensor" && inputRef.current) {
            inputRef.current.focus();
        }
    }, [mode]);

    const handleScan = async (value: string) => {
        if (!value || processing) return;
        
        setProcessing(true);
        setError(null);
        try {
            const response = await api.post('/attendance/qr-scan', { code: value });
            setLastUser(response.data.user);
            setScanValue("");
            toast({
                title: "Attendance Recorded",
                description: `Present: ${response.data.user.name} ${response.data.user.last_name}`,
                className: "bg-emerald-500 text-white border-none shadow-lg shadow-emerald-200"
            });
            
            // Audio feedback placeholder
            const audio = new Audio('/sounds/success.mp3');
            audio.play().catch(() => {});

        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid ID Card");
            const audio = new Audio('/sounds/error.mp3');
            audio.play().catch(() => {});
        } finally {
            setProcessing(false);
            if (inputRef.current) inputRef.current.focus();
        }
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <Scan className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                            Attendance Terminal
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Institutional real-time scanning & identity verification</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex border border-gray-100 rounded-full overflow-hidden bg-gray-50/50 p-1">
                        <button
                            onClick={() => setMode("camera")}
                            className={cn(
                                "px-6 py-2 text-[10px] font-bold uppercase transition-all rounded-full flex items-center gap-2",
                                mode === "camera" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <Camera className="h-3.5 w-3.5" /> Visual Capture
                        </button>
                        <button
                            onClick={() => setMode("sensor")}
                            className={cn(
                                "px-6 py-2 text-[10px] font-bold uppercase transition-all rounded-full flex items-center gap-2",
                                mode === "sensor" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <Zap className="h-3.5 w-3.5" /> Sensor HID
                        </button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-rose-500 rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
                {/* Scanner Section */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-indigo-100/20 overflow-hidden flex flex-col relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-500/10 overflow-hidden">
                        <div className={cn("h-full bg-indigo-500 transition-all duration-300", processing ? "w-full animate-pulse" : "w-0")} />
                    </div>

                    <div className="p-12 flex-1 flex flex-col items-center justify-center space-y-12">
                        {mode === "sensor" ? (
                            <div className="w-full max-w-md space-y-10">
                                <div className="text-center space-y-2">
                                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Ready to Scan</h2>
                                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Connect institutional scanning peripheral</p>
                                </div>

                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                                    <Input
                                        ref={inputRef}
                                        value={scanValue}
                                        onChange={(e) => setScanValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleScan(scanValue);
                                        }}
                                        placeholder="INITIALIZING PERIPHERAL..."
                                        className="relative h-16 text-center text-xl font-bold tracking-widest border-none bg-white rounded-2xl shadow-inner focus-visible:ring-0 uppercase"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex justify-center opacity-40">
                                    <MockIdCardIcon active={processing} />
                                </div>
                            </div>
                        ) : (
                            <div className="w-full max-w-lg space-y-8">
                                <div className="relative aspect-video bg-gray-900 rounded-3xl overflow-hidden border-4 border-gray-100 shadow-2xl">
                                    {/* Camera Placeholder */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white space-y-4">
                                        <div className="relative">
                                            <div className="absolute inset-0 animate-ping rounded-full bg-rose-500/20 h-16 w-16" />
                                            <div className="relative h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/50">
                                                <Camera className="h-8 w-8 text-rose-500" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-rose-400">Optical Source Offline</p>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Waiting for manifest authorization</p>
                                        </div>
                                    </div>

                                    {/* Scan Line Overlay */}
                                    <div className="absolute inset-x-0 h-0.5 bg-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.5)] top-1/2 -translate-y-1/2 animate-[scan_2s_ease-in-out_infinite]" />
                                    
                                    {/* Corner Accents */}
                                    <div className="absolute top-6 left-6 h-8 w-8 border-t-2 border-l-2 border-white/20 rounded-tl-lg" />
                                    <div className="absolute top-6 right-6 h-8 w-8 border-t-2 border-r-2 border-white/20 rounded-tr-lg" />
                                    <div className="absolute bottom-6 left-6 h-8 w-8 border-b-2 border-l-2 border-white/20 rounded-bl-lg" />
                                    <div className="absolute bottom-6 right-6 h-8 w-8 border-b-2 border-r-2 border-white/20 rounded-br-lg" />
                                </div>

                                <div className="flex justify-between items-center px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Optic Cycle</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase text-indigo-500 hover:bg-indigo-50">
                                        <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh Source
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Identity Verification Section */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* User Card */}
                    <div className={cn(
                        "flex-1 rounded-3xl border transition-all duration-500 flex flex-col p-10 items-center justify-center relative overflow-hidden",
                        lastUser ? "bg-emerald-50 border-emerald-100 shadow-xl shadow-emerald-100/30" : "bg-white border-gray-100 shadow-lg shadow-gray-100/50"
                    )}>
                        {!lastUser && !error ? (
                            <div className="flex flex-col items-center text-center space-y-6 opacity-30">
                                <UserCircle className="h-24 w-24 text-gray-300" />
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Awaiting Identity</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Scan a valid institutional credential</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
                                <div className="h-20 w-20 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 border border-rose-200">
                                    <AlertCircle className="h-10 w-10" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-rose-600 uppercase tracking-widest">Access Denied</h3>
                                    <p className="text-[10px] text-rose-400 font-bold uppercase mt-1">{error}</p>
                                </div>
                                <Button 
                                    onClick={() => setError(null)}
                                    className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold uppercase h-9 px-8 rounded-full shadow-lg"
                                >
                                    Dismiss Error
                                </Button>
                            </div>
                        ) : lastUser && (
                            <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="absolute top-6 right-6">
                                    <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-200">
                                        <CheckCircle2 className="h-3 w-3" /> Identity Verified
                                    </div>
                                </div>

                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="relative">
                                        <div className="h-32 w-32 rounded-3xl bg-white border-4 border-emerald-200 shadow-xl overflow-hidden flex items-center justify-center">
                                            {lastUser.photo ? (
                                                <img src={lastUser.photo} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserCircle className="h-20 w-20 text-emerald-100" />
                                            )}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-emerald-500 border-4 border-emerald-50 flex items-center justify-center shadow-lg">
                                            <Zap className="h-4 w-4 text-white fill-white" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-bold text-emerald-900 uppercase tracking-tight">{lastUser.name} {lastUser.last_name}</h3>
                                        <div className="flex items-center justify-center gap-3">
                                            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-100/50 px-3 py-1 rounded-full">{lastUser.role}</span>
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">ID: {lastUser.admission_no || lastUser.employee_id}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/60 p-6 rounded-2xl border border-emerald-100 flex justify-between items-center">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Timestamp</p>
                                        <p className="text-xl font-black text-emerald-800 tracking-tight">{lastUser.time}</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Status</p>
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Present (Digital)</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Widget */}
                    <div className="bg-gray-900 rounded-3xl p-8 flex items-center justify-between group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                                <Zap className="h-5 w-5 fill-white" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Real-time Cycle</p>
                                <p className="text-sm font-bold text-white uppercase tracking-tight">Active Protocol v4.2</p>
                            </div>
                        </div>
                        <div className="relative z-10 text-right">
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Latency</p>
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">0.04ms</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 10%; opacity: 0.2; }
                    50% { top: 90%; opacity: 0.8; }
                    100% { top: 10%; opacity: 0.2; }
                }
            `}</style>
        </div>
    );
}

function MockIdCardIcon({ active }: { active?: boolean }) {
    return (
        <div className={cn(
            "relative w-64 h-44 border-4 border-gray-800 rounded-2xl flex flex-col items-center justify-center bg-white transition-all duration-500",
            active ? "scale-105 shadow-2xl shadow-indigo-100" : ""
        )}>
            {/* Lanyard Clip */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-8 border-4 border-gray-800 rounded-t-lg bg-white flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gray-800"></div>
            </div>
            {/* Lines */}
            <div className="absolute top-4 w-full h-0.5 bg-gray-800"></div>

            <div className="w-full h-full p-4 flex items-center gap-4 mt-2">
                {/* Profile Photo Placeholder */}
                <div className="w-20 h-24 border-4 border-gray-800 flex items-center justify-center bg-gray-50 overflow-hidden">
                    <User className={cn("h-12 w-12 text-gray-800 transition-all", active ? "animate-pulse" : "")} />
                </div>

                {/* Text Lines */}
                <div className="flex-1 space-y-3">
                    <div className="h-2 w-full bg-gray-800 rounded-full opacity-80"></div>
                    <div className="h-2 w-3/4 bg-gray-800 rounded-full opacity-60"></div>
                    <div className="h-2 w-full bg-gray-800 rounded-full opacity-40"></div>
                    {/* Mini QR */}
                    <div className="flex justify-end pt-1">
                        <div className={cn(
                            "w-10 h-10 border-2 border-gray-800 grid grid-cols-2 gap-0.5 p-0.5 transition-all",
                            active ? "bg-indigo-50" : ""
                        )}>
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
