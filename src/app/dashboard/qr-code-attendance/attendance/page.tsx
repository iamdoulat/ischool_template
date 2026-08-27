"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import jsQR from "jsqr";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    X, User, Scan, Camera, Smartphone, 
    Monitor, Zap, UserCircle, 
    CheckCircle2, AlertCircle, RefreshCw,
    Wifi, QrCode, ScanFace, Loader2, Cpu,
    Filter, Search, ArrowDownToLine, Check, Activity,
    Layers, HardDrive, Clock, Volume2, VolumeX,
    FileSpreadsheet, Printer, Copy, ShieldCheck,
    CreditCard, Sparkles
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import * as faceapi from "face-api.js";
import { useTranslation } from "@/hooks/use-translation";
import { useImageUrl } from "@/lib/image-url";

/* ── Defensive Array Extractor ───────────────────────────────── */
const extractArray = (res: any): any[] => {
    if (Array.isArray(res?.data?.data?.data)) return res.data.data.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
};

interface ScannedUser {
    name: string;
    role: string;
    admission_no?: string;
    staff_id?: string;
    avatar?: string;
    time: string;
    status?: string;
}

export default function QrCodeAttendancePage() {
    const getImageUrl = useImageUrl();
    const { t } = useTranslation();

    const [mode, setMode] = useState<"zkteco" | "camera" | "sensor">("zkteco");
    const [lensMode, setLensMode] = useState<"qr" | "face">("qr");
    const [loadingModels, setLoadingModels] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceUsers, setFaceUsers] = useState<any[]>([]);

    const [scanValue, setScanValue] = useState("");
    const [processing, setProcessing] = useState(false);
    const [lastUser, setLastUser] = useState<ScannedUser | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState<any>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

    const inputRef = useRef<HTMLInputElement>(null);
    const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);
    const cameraImgRef = useRef<HTMLImageElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [cameraError, setCameraError] = useState(false);
    const [cameraUrl, setCameraUrl] = useState("");
    const [scanCooldown, setScanCooldown] = useState(false);
    const [webcamActive, setWebcamActive] = useState(false);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [cameraErrMsg, setCameraErrMsg] = useState<string | null>(null);

    // Live Clock
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    // Camera Management
    const startWebcam = async (targetFacing = facingMode) => {
        stopWebcam();
        setCameraErrMsg(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: targetFacing, width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => {});
            }
            setWebcamActive(true);
        } catch (err: any) {
            console.error("Camera access failed:", err);
            try {
                const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = fallbackStream;
                    videoRef.current.play().catch(() => {});
                }
                setWebcamActive(true);
            } catch (fbErr: any) {
                setCameraErrMsg(fbErr.message || "Failed to access camera");
                setWebcamActive(false);
            }
        }
    };

    const stopWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        setWebcamActive(false);
    };

    const toggleFacingMode = () => {
        const next = facingMode === "environment" ? "user" : "environment";
        setFacingMode(next);
        startWebcam(next);
    };

    // ZKTeco Biometric State
    const [zkSummary, setZkSummary] = useState<any>({
        total_devices: 0,
        online_devices: 0,
        today_punches: 0,
        matched_punches: 0,
        match_rate: 100,
    });
    const [zkLogs, setZkLogs] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("all");
    const [selectedSection, setSelectedSection] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [fetchingZkLogs, setFetchingZkLogs] = useState(false);
    const [pullingZkData, setPullingZkData] = useState(false);

    // Fetch Initial Settings
    const fetchSettings = useCallback(async () => {
        setLoadingSettings(true);
        try {
            const res = await api.get('/attendance/qr-settings');
            const data = res.data?.data || res.data;
            if (data) {
                setSettings(data);
                if (data.ip_camera_url && data.use_camera_device) {
                    setCameraUrl(data.ip_camera_url);
                }
                if (data.camera_type === 'secondary') {
                    setFacingMode('user');
                }
            }
        } catch (e) {
            console.error("Failed to load QR Attendance settings", e);
        } finally {
            setLoadingSettings(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Fetch Classes and Sections for ZKTeco Filter
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [clsRes, secRes] = await Promise.all([
                    api.get('/academics/classes?no_paginate=true').catch(() => ({ data: { data: [] } })),
                    api.get('/academics/sections?no_paginate=true').catch(() => ({ data: { data: [] } })),
                ]);
                setClasses(extractArray(clsRes));
                setSections(extractArray(secRes));
            } catch {}
        };
        fetchFilters();
    }, []);

    // Fetch ZKTeco Data
    const fetchZkLogs = useCallback(async () => {
        setFetchingZkLogs(true);
        try {
            const params: any = { limit: 40 };
            if (selectedClass !== "all") params.class_id = selectedClass;
            if (selectedSection !== "all") params.section_id = selectedSection;
            if (searchTerm.trim()) params.search = searchTerm.trim();

            const [logsRes, sumRes] = await Promise.all([
                api.get('/zkteco/logs', { params }).catch(() => ({ data: { data: [] } })),
                api.get('/zkteco/summary').catch(() => ({ data: { data: {} } })),
            ]);

            setZkLogs(extractArray(logsRes));
            if (sumRes.data?.data) {
                setZkSummary(sumRes.data.data);
            }
        } catch (e) {
            console.error("Failed to fetch ZKTeco logs", e);
        } finally {
            setFetchingZkLogs(false);
        }
    }, [selectedClass, selectedSection, searchTerm]);

    useEffect(() => {
        if (mode === "zkteco") {
            fetchZkLogs();
        }
    }, [mode, fetchZkLogs]);

    const handlePullZkData = async () => {
        setPullingZkData(true);
        try {
            const devRes = await api.get('/zkteco/devices').catch(() => ({ data: { data: [] } }));
            const devices = extractArray(devRes);
            if (devices.length === 0) {
                toast.info("No ZKTeco hardware devices registered.");
                return;
            }
            for (const d of devices) {
                await api.post(`/zkteco/devices/${d.id}/pull`).catch(() => {});
            }
            await fetchZkLogs();
            toast.success("Synchronized latest ZKTeco attendance logs.");
        } catch {
            toast.error("Failed to pull ZKTeco attendance data.");
        } finally {
            setPullingZkData(false);
        }
    };

    // Load Face Models when in Camera Face Lens mode
    useEffect(() => {
        if (mode === "camera" && lensMode === "face" && !modelsLoaded) {
            const loadFaceAI = async () => {
                setLoadingModels(true);
                try {
                    await Promise.all([
                        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                    ]);
                    setModelsLoaded(true);
                    const res = await api.get('/attendance/face-descriptors').catch(() => ({ data: { data: [] } }));
                    setFaceUsers(extractArray(res));
                } catch {
                    console.error("Failed to load Face AI models");
                } finally {
                    setLoadingModels(false);
                }
            };
            loadFaceAI();
        }
    }, [mode, lensMode, modelsLoaded]);

    // Handle Camera stream activation
    useEffect(() => {
        if (mode === "camera") {
            if (!cameraUrl) {
                startWebcam(facingMode);
            }
        } else {
            stopWebcam();
        }
        return () => stopWebcam();
    }, [mode, cameraUrl]);

    // Play Audio Cue
    const playAudio = (type: 'success' | 'error') => {
        if (!soundEnabled) return;
        const audio = new Audio(type === 'success' ? '/sounds/success.mp3' : '/sounds/error.mp3');
        audio.play().catch(() => {});
    };

    // Process Attendance Scan (QR, ID, or NFC UID)
    const handleScan = async (code: string) => {
        if (!code || processing || scanCooldown) return;
        setProcessing(true);
        setError(null);
        try {
            const res = await api.post('/attendance/qr-scan', { code });
            const data = res.data?.data || res.data;
            if (data?.user) {
                const user = data.user;
                setLastUser({
                    name: user.name || "Unknown",
                    role: user.role || "Student",
                    admission_no: user.admission_no || user.roll_no,
                    staff_id: user.staff_id,
                    avatar: user.avatar,
                    time: data.time || new Date().toLocaleTimeString(),
                    status: data.status || "In",
                });
                toast.success(`Attendance marked: ${user.name}`);
                playAudio('success');
                setScanCooldown(true);
                setTimeout(() => setScanCooldown(false), 2000);
            }
            setScanValue("");
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to mark attendance";
            setError(msg);
            toast.error(msg);
            playAudio('error');
        } finally {
            setProcessing(false);
            if (inputRef.current) inputRef.current.focus();
        }
    };

    // Camera Frame Real-Time QR Scanner Loop
    useEffect(() => {
        if (mode !== "camera" || lensMode !== "qr" || scanCooldown || processing) return;

        const interval = setInterval(() => {
            if (!videoRef.current || !webcamActive || videoRef.current.readyState !== 4) return;
            const video = videoRef.current;
            const canvas = canvasRef.current || document.createElement('canvas');
            if (canvas.width !== video.videoWidth) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qr = jsQR(imgData.data, imgData.width, imgData.height);
            if (qr && qr.data) {
                handleScan(qr.data);
            }
        }, 300);

        return () => clearInterval(interval);
    }, [mode, lensMode, webcamActive, scanCooldown, processing]);

    // Export Handlers
    const handleCopyZkLogs = () => {
        const header = "Student/User\tRoll/Admission\tClass/Section\tMethod\tDevice SN\tPunch Time\tStatus\n";
        const rows = zkLogs.map(l =>
            `${l.student?.name || l.user_pin}\t${l.student?.admission_no || l.user_pin}\t${l.school_class?.name || '-'}\t${l.verify_type === '15' || l.verify_type === '111' ? 'Face' : 'Fingerprint'}\t${l.device_serial}\t${l.punch_time}\t${l.status}`
        ).join("\n");
        navigator.clipboard.writeText(header + rows);
        toast.success("Attendance logs copied to clipboard!");
    };

    const handleExportZkCsv = () => {
        const header = "Student/User,Roll/Admission,Class,Section,Method,Device SN,Punch Time,Status\n";
        const rows = zkLogs.map(l =>
            `"${l.student?.name || l.user_pin}","${l.student?.admission_no || l.user_pin}","${l.school_class?.name || '-'}","${l.section?.name || '-'}","${l.verify_type === '15' || l.verify_type === '111' ? 'Face' : 'Fingerprint'}","${l.device_serial}","${l.punch_time}","${l.status}"`
        ).join("\n");
        const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `zkteco_attendance_logs_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        toast.success("CSV file downloaded!");
    };

    return (
        <div className="space-y-5 font-sans p-4 sm:p-6 max-w-7xl mx-auto min-h-screen text-xs">
            {/* Master Page Header Banner */}
            <div className="rounded-2xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#EFF0FD] to-indigo-50/60">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <Sparkles className="h-6 w-6" />
                        </span>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                                Smart Attendance & Access Control Terminal
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                    Hardware ADMS & Local
                                </span>
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                Real-time ZKTeco Visible Light Face Recognition, Biometric Fingerprint ADMS Push, Mobile Front Camera, & USB Sensors
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                        {/* Live Clock */}
                        <div className="bg-white/90 border border-indigo-100 px-3 py-1.5 rounded-xl shadow-xs text-right flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                            <p className="text-xs font-bold text-slate-800 font-mono">{currentTimeStr}</p>
                        </div>

                        {/* Sound Toggle */}
                        <button
                            type="button"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={cn(
                                "p-2 rounded-xl border transition-all shadow-xs",
                                soundEnabled ? "bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50" : "bg-slate-100 text-slate-400 border-slate-200"
                            )}
                            title={soundEnabled ? "Mute audio cues" : "Unmute audio cues"}
                        >
                            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto sm:mx-0">
                <button
                    onClick={() => setMode("zkteco")}
                    className={cn(
                        "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                        mode === "zkteco"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                    )}
                >
                    <Cpu className="h-3.5 w-3.5" /> ZKTeco Biometric / Face
                </button>

                <button
                    onClick={() => setMode("camera")}
                    className={cn(
                        "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                        mode === "camera"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                    )}
                >
                    <Camera className="h-3.5 w-3.5" /> Mobile / IP Camera
                </button>

                <button
                    onClick={() => setMode("sensor")}
                    className={cn(
                        "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                        mode === "sensor"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                    )}
                >
                    <Zap className="h-3.5 w-3.5" /> USB Sensor / Barcode
                </button>
            </div>

            {/* ================= 1. ZKTECO BIOMETRIC / FACE ACCESS CONTROL VIEW ================= */}
            {mode === "zkteco" && (
                <div className="space-y-5">
                    {/* ZKTeco Metrics Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                        <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-xs flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Registered Devices</p>
                                <p className="text-xl font-black text-slate-800 mt-0.5">{zkSummary.total_devices || 0}</p>
                                <span className="text-[10px] text-emerald-600 font-medium">
                                    {zkSummary.online_devices || 0} Online ADMS Terminals
                                </span>
                            </div>
                            <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                                <HardDrive className="h-5 w-5" />
                            </span>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-xs flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Today Punches</p>
                                <p className="text-xl font-black text-slate-800 mt-0.5">{zkSummary.today_punches || zkLogs.length}</p>
                                <span className="text-[10px] text-slate-500">Live Hardware Stream</span>
                            </div>
                            <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                                <Activity className="h-5 w-5" />
                            </span>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-xs flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Matched Students</p>
                                <p className="text-xl font-black text-emerald-600 mt-0.5">{zkSummary.matched_punches || 0}</p>
                                <span className="text-[10px] text-emerald-600 font-medium">Mapped to Roll/Adm</span>
                            </div>
                            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </span>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-xs flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Match Accuracy</p>
                                <p className="text-xl font-black text-slate-800 mt-0.5">{zkSummary.match_rate || 100}%</p>
                                <span className="text-[10px] text-indigo-600 font-medium">SpeedFace & Biometrics</span>
                            </div>
                            <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                                <Cpu className="h-5 w-5" />
                            </span>
                        </div>
                    </div>

                    {/* Filter & Actions Bar */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 flex-1">
                            <div className="flex items-center gap-1 text-slate-500 font-bold text-[11px] uppercase mr-1">
                                <Filter className="h-3.5 w-3.5 text-indigo-600" /> Filter:
                            </div>

                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-8 text-xs w-[140px] bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {Array.isArray(classes) && classes.map((cls: any) => (
                                        <SelectItem key={cls.id} value={String(cls.id)}>
                                            {cls.class_name || cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="h-8 text-xs w-[130px] bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="All Sections" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {Array.isArray(sections) && sections.map((sec: any) => (
                                        <SelectItem key={sec.id} value={String(sec.id)}>
                                            {sec.section_name || sec.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="relative flex-1 min-w-[180px] max-w-xs">
                                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') fetchZkLogs(); }}
                                    placeholder="Search Roll / Admission ID..."
                                    className="h-8 text-xs pl-8 bg-slate-50 border-slate-200"
                                />
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={fetchZkLogs}
                                disabled={fetchingZkLogs}
                                className="h-8 text-xs border-slate-200 text-indigo-600 hover:bg-indigo-50"
                            >
                                {fetchingZkLogs ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                                Search
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-auto">
                            {/* Export Toolbar */}
                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                                <button
                                    type="button"
                                    onClick={handleCopyZkLogs}
                                    className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                                    title="Copy Table"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportZkCsv}
                                    className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                                    title="Export CSV"
                                >
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="p-1.5 hover:bg-slate-100 text-slate-600 transition-all"
                                    title="Print Logs"
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <Button
                                type="button"
                                onClick={handlePullZkData}
                                disabled={pullingZkData}
                                className="h-8 px-3.5 text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white font-bold gap-1.5 shadow-xs shrink-0"
                            >
                                {pullingZkData ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowDownToLine className="h-3.5 w-3.5" />}
                                Sync Device Data
                            </Button>
                        </div>
                    </div>

                    {/* ZKTeco Attendance Logs Feed Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Cpu className="h-4 w-4 text-indigo-600" />
                                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                                    ZKTeco Live Attendance Feed (Roll / Admission ID Wise)
                                </h3>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">
                                Showing {zkLogs.length} attendance log entries
                            </span>
                        </div>

                        {fetchingZkLogs ? (
                            <div className="p-12 text-center text-slate-400 space-y-2">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                                <p className="text-xs font-medium">Fetching ZKTeco hardware attendance stream...</p>
                            </div>
                        ) : zkLogs.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 space-y-2">
                                <Cpu className="h-8 w-8 mx-auto text-slate-300" />
                                <p className="text-xs font-bold text-slate-600">No attendance logs received today yet</p>
                                <p className="text-[11px] text-slate-400">Connect your ZKTeco device or click &quot;Sync Device Data&quot; to fetch latest logs.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/80">
                                    <TableRow className="border-b border-slate-200">
                                        <TableHead className="text-xs font-bold text-slate-700 py-3">Student / User</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-700">Admission No & Roll No</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-700">Class & Section</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-700">Verification Mode</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-700">Device SN</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-700">Punch Time</TableHead>
                                        <TableHead className="text-xs font-bold text-slate-700 text-right pr-6">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-100">
                                    {Array.isArray(zkLogs) && zkLogs.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-indigo-50/20 transition-colors">
                                            <TableCell className="py-3">
                                                <div className="flex items-center gap-2.5">
                                                    {log.student?.avatar ? (
                                                        <img src={getImageUrl(log.student.avatar)} alt="" className="h-8 w-8 rounded-full object-cover border border-slate-200" />
                                                    ) : (
                                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs">
                                                            {log.student?.name ? log.student.name.charAt(0) : '?'}
                                                        </span>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-800">
                                                            {log.student?.name || `Unregistered PIN (${log.user_pin})`}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 uppercase">
                                                            {log.student?.role || 'Student'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-3">
                                                <div className="flex flex-col font-mono text-xs">
                                                    <span className="text-slate-700 font-semibold">
                                                        Adm: {log.student?.admission_no || log.user_pin}
                                                    </span>
                                                    {log.student?.roll_no && (
                                                        <span className="text-[10px] text-slate-400">
                                                            Roll: {log.student.roll_no}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-3">
                                                <div className="text-xs text-slate-700 font-medium">
                                                    {log.school_class || log.student?.school_class_id ? (
                                                        <span>
                                                            {log.school_class?.class_name || log.school_class?.name || 'Class'} {log.section ? `- ${log.section.section_name || log.section.name}` : ''}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">General Gate</span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-3">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border",
                                                    String(log.verify_type) === '15' || String(log.verify_type) === '111' || log.verify_type === 'face'
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : String(log.verify_type) === '4'
                                                            ? "bg-purple-50 text-purple-700 border-purple-200"
                                                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                )}>
                                                    {String(log.verify_type) === '15' || String(log.verify_type) === '111' || log.verify_type === 'face'
                                                        ? 'Face Recognition 👤'
                                                        : String(log.verify_type) === '4'
                                                            ? 'RFID/NFC Card 💳'
                                                            : 'Fingerprint Biometric 👆'}
                                                </span>
                                            </TableCell>

                                            <TableCell className="py-3">
                                                <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {log.device_serial}
                                                </span>
                                            </TableCell>

                                            <TableCell className="py-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                                                {log.punch_time ? new Date(log.punch_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                                            </TableCell>

                                            <TableCell className="py-3 text-right pr-6">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                                                    log.status === 'matched'
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                                )}>
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    {log.status === 'matched' ? 'PRESENT' : 'UNMATCHED PIN'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            )}

            {/* ================= 2. CAMERA OR USB SENSOR SCANNER VIEW ================= */}
            {mode !== "zkteco" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Scanner Section */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col relative min-h-[420px]">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                            <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                                {mode === "camera" ? <Camera className="h-4 w-4 text-indigo-600" /> : <Zap className="h-4 w-4 text-amber-500" />}
                                {mode === "camera" ? "Mobile / Device Camera Feed" : "USB Sensor / Barcode Scanner"}
                            </span>
                            {mode === "sensor" && settings?.auto_attendance && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full animate-pulse">
                                    <Zap className="h-3 w-3 text-indigo-600" /> Auto Attendance Active
                                </span>
                            )}
                        </div>

                        <div className="p-6 flex-1 flex flex-col items-center justify-center space-y-4">
                            {mode === "sensor" ? (
                                <div className="w-full max-w-sm space-y-4 text-center">
                                    <div className="space-y-1">
                                        <h2 className="text-base font-bold text-slate-800">Ready to Scan ID Card</h2>
                                        <p className="text-xs text-slate-400">Swipe RFID card or point handheld barcode scanner</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Input
                                            ref={inputRef}
                                            value={scanValue}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setScanValue(val);
                                                if (settings?.auto_attendance && val.trim().length >= 3) {
                                                    if (autoScanTimerRef.current) clearTimeout(autoScanTimerRef.current);
                                                    autoScanTimerRef.current = setTimeout(() => {
                                                        handleScan(val.trim());
                                                    }, 400);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (autoScanTimerRef.current) clearTimeout(autoScanTimerRef.current);
                                                    handleScan(scanValue.trim());
                                                }
                                            }}
                                            placeholder="SCAN BARCODE OR TYPE ROLL NO..."
                                            className="h-12 text-center text-sm font-bold tracking-widest bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-indigo-500 uppercase shadow-inner"
                                            autoFocus
                                        />
                                        {settings?.auto_attendance && (
                                            <p className="text-[10px] text-slate-400">⚡ Auto-records attendance instantly upon scan</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full max-w-md space-y-3">
                                    {/* Lens Mode Selector Switch */}
                                    <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-100/70 p-0.5">
                                        <button
                                            onClick={() => setLensMode("qr")}
                                            className={cn(
                                                "flex-1 py-1.5 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-1.5",
                                                lensMode === "qr" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            <QrCode className="h-3.5 w-3.5" /> High-Speed QR Scanner
                                        </button>
                                        <button
                                            onClick={() => setLensMode("face")}
                                            className={cn(
                                                "flex-1 py-1.5 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-1.5",
                                                lensMode === "face" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            <ScanFace className="h-3.5 w-3.5" /> AI Face Recognition
                                        </button>
                                    </div>

                                    {/* Video Camera Viewport */}
                                    <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner group flex items-center justify-center">
                                        {loadingModels && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white space-y-2 p-4 text-center z-20">
                                                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                                                <p className="text-xs font-bold">Mounting Neural Face Engine...</p>
                                            </div>
                                        )}

                                        <canvas ref={canvasRef} className="hidden" />

                                        {cameraUrl ? (
                                            <>
                                                <img
                                                    ref={cameraImgRef}
                                                    src={cameraUrl}
                                                    alt="Camera Stream"
                                                    crossOrigin="anonymous"
                                                    onError={() => setCameraError(true)}
                                                    className={cn("w-full h-full object-cover", cameraError && "hidden")}
                                                />
                                                {cameraError && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white space-y-2 p-4 text-center">
                                                        <AlertCircle className="h-8 w-8 text-rose-500" />
                                                        <p className="text-xs font-bold">Camera stream unreachable</p>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => { setCameraError(false); fetchSettings(); }}
                                                            className="h-7 text-xs bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800"
                                                        >
                                                            <RefreshCw className="h-3 w-3 mr-1" /> Retry Stream
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className={cn("w-full h-full object-cover", facingMode === "user" && "scale-x-[-1]", !webcamActive && "hidden")}
                                                />
                                                {!webcamActive && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white space-y-3 p-4 text-center">
                                                        <Camera className="h-8 w-8 text-indigo-400 opacity-60" />
                                                        <div>
                                                            <p className="text-xs font-bold">Camera Feed Standby</p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">Click below to activate device camera</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => startWebcam(facingMode)}
                                                            className="h-8 text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white px-3.5 font-bold gap-1.5 shadow-sm"
                                                        >
                                                            <Camera className="h-3.5 w-3.5" /> Turn On Camera
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* Mobile Camera Flip Button */}
                                                {webcamActive && (
                                                    <button
                                                        type="button"
                                                        onClick={toggleFacingMode}
                                                        className="absolute top-3 right-3 z-20 px-2.5 py-1 bg-black/60 hover:bg-black/80 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow transition-all active:scale-95"
                                                        title="Flip between Back and Front camera"
                                                    >
                                                        <RefreshCw className="h-3 w-3" />
                                                        <span>{facingMode === "environment" ? "Back 📷" : "Front 🤳"}</span>
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {/* Scanner Overlay Matrix */}
                                        {((cameraUrl && !cameraError) || webcamActive) && (
                                            <div className="absolute inset-0 border-[35px] border-black/40 pointer-events-none flex items-center justify-center">
                                                <div className={cn(
                                                    "w-48 h-48 border-2 rounded-xl transition-all duration-300 relative overflow-hidden",
                                                    scanCooldown ? "border-emerald-500 bg-emerald-500/10" : "border-indigo-400/80"
                                                )}>
                                                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-indigo-400" />
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-indigo-400" />
                                                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-indigo-400" />
                                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-indigo-400" />
                                                    
                                                    {!scanCooldown && (
                                                        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#10b981] animate-pulse"
                                                            style={{ top: '50%', animation: 'bounce 2s ease-in-out infinite' }}
                                                        />
                                                    )}

                                                    {scanCooldown && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/80 text-emerald-400 text-xs font-bold gap-1 animate-pulse">
                                                            <CheckCircle2 className="h-4 w-4" /> Attendance Marked
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Result Profile Section */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[420px]">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
                            <span className="font-bold text-slate-700 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                <UserCircle className="h-4 w-4 text-indigo-600" /> Verification Result
                            </span>
                            {lastUser && (
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                    lastUser.status === 'Out' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                )}>
                                    {lastUser.status === 'Out' ? 'Exit Recorded 🟡' : 'Entry Recorded 🟢'}
                                </span>
                            )}
                        </div>

                        <div className="p-6 flex-1 flex flex-col items-center justify-center">
                            {lastUser ? (
                                <div className="text-center space-y-4 max-w-xs w-full animate-in fade-in zoom-in duration-200">
                                    <div className="relative inline-block">
                                        {lastUser.avatar ? (
                                            <img
                                                src={getImageUrl(lastUser.avatar)}
                                                alt={lastUser.name}
                                                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 shadow-md mx-auto"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-indigo-100 shadow-md mx-auto flex items-center justify-center">
                                                <User className="h-10 w-10 text-indigo-400" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 right-0 p-1 bg-emerald-500 text-white rounded-full border-2 border-white shadow">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">{lastUser.name}</h3>
                                        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mt-0.5">{lastUser.role}</p>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-3 text-left space-y-2 border border-slate-200 text-xs">
                                        {lastUser.admission_no && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Admission / Roll No:</span>
                                                <span className="font-bold text-slate-700 font-mono">{lastUser.admission_no}</span>
                                            </div>
                                        )}
                                        {lastUser.staff_id && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Staff ID:</span>
                                                <span className="font-bold text-slate-700 font-mono">{lastUser.staff_id}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Timestamp:</span>
                                            <span className="font-bold text-slate-700 font-mono">{lastUser.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="text-center space-y-3 max-w-xs animate-in fade-in zoom-in duration-200">
                                    <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 mx-auto flex items-center justify-center text-rose-500">
                                        <AlertCircle className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-rose-600">Scan Rejected</h3>
                                        <p className="text-xs text-slate-400 mt-1">{error}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-2 opacity-40">
                                    <User className="h-12 w-12 mx-auto text-slate-400" />
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Awaiting Scan</p>
                                    <p className="text-[10px] text-slate-400">Scan an ID card or face camera to confirm attendance</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
