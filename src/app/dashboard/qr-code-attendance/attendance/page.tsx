"use client";

import { useState, useEffect, useRef } from "react";
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
    Layers, HardDrive
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
    const [mode, setMode] = useState<"camera" | "sensor" | "zkteco">("zkteco");
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
    
    const inputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();
    const cameraImgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [cameraError, setCameraError] = useState(false);
    const [cameraUrl, setCameraUrl] = useState("");
    const [scanCooldown, setScanCooldown] = useState(false);

    // ZKTeco Biometric / NFC Access Control State
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

    useEffect(() => {
        fetchSettings();
        fetchAcademics();
        fetchZkSummary();
        fetchZkLogs();
    }, []);

    useEffect(() => {
        if (mode === "zkteco") {
            fetchZkLogs();
        }
    }, [selectedClass, selectedSection, mode]);

    const fetchAcademics = async () => {
        try {
            const [classRes, secRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true'),
                api.get('/academics/sections?no_paginate=true')
            ]);
            setClasses(extractArray(classRes));
            setSections(extractArray(secRes));
        } catch (e) {
            console.error("Failed to fetch classes/sections", e);
            setClasses([]);
            setSections([]);
        }
    };

    const fetchZkSummary = async () => {
        try {
            const response = await api.get('/zkteco/summary');
            if (response.data && response.data.success) {
                setZkSummary(response.data.data);
            }
        } catch (e) {
            console.error("Failed to fetch ZKTeco summary", e);
        }
    };

    const fetchZkLogs = async () => {
        setFetchingZkLogs(true);
        try {
            const params: any = {};
            if (selectedClass && selectedClass !== 'all') params.school_class_id = selectedClass;
            if (selectedSection && selectedSection !== 'all') params.section_id = selectedSection;
            if (searchTerm) params.search = searchTerm;

            const response = await api.get('/zkteco/logs', { params });
            setZkLogs(extractArray(response));
        } catch (e) {
            console.error("Failed to fetch ZKTeco logs", e);
            setZkLogs([]);
        } finally {
            setFetchingZkLogs(false);
        }
    };

    const handlePullZkData = async () => {
        setPullingZkData(true);
        try {
            const devRes = await api.get('/zkteco/devices');
            const devices = extractArray(devRes);
            if (devices.length === 0) {
                toast.error("No ZKTeco devices registered. Please add a device in Settings.");
                return;
            }

            let totalReprocessed = 0;
            for (const dev of devices) {
                const pullRes = await api.post(`/zkteco/devices/${dev.id}/pull`);
                totalReprocessed += pullRes.data?.data?.reprocessed_count || 0;
            }

            toast.success(`Pulled & synced latest ZKTeco attendance logs. (${totalReprocessed} student(s) matched)`);
            fetchZkSummary();
            fetchZkLogs();
        } catch (err: any) {
            toast.error("Failed to pull ZKTeco data.");
        } finally {
            setPullingZkData(false);
        }
    };

    // Load Face Models and registered face descriptors when Face Recognition mode is selected
    useEffect(() => {
        if (mode === "camera" && lensMode === "face" && !modelsLoaded) {
            const initFaceModels = async () => {
                setLoadingModels(true);
                try {
                    await Promise.all([
                        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
                    ]);
                    setModelsLoaded(true);
                    toast.success(t("ai_face_recognition_framework_mounted"));
                } catch (error) {
                    console.error("Error loading face models:", error);
                    toast.error(t("failed_to_load_ai_face_recognition_models"));
                } finally {
                    setLoadingModels(false);
                }
            };
            initFaceModels();
        }

        if (mode === "camera" && lensMode === "face" && faceUsers.length === 0) {
            const fetchFaceDescriptors = async () => {
                try {
                    const response = await api.get('/attendance/face-descriptors');
                    if (response.data && response.data.success) {
                        setFaceUsers(response.data.data);
                    }
                } catch (error) {
                    console.error("Error fetching face descriptors:", error);
                }
            };
            fetchFaceDescriptors();
        }
    }, [mode, lensMode, modelsLoaded]);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/attendance/qr-settings');
            if (response.data) {
                setSettings(response.data);
                
                // Construct Proxy URL for Camera
                if (response.data.ip_camera_url) {
                    let baseIpOrUrl = response.data.ip_camera_url.trim();
                    let finalTargetUrl = baseIpOrUrl;
                    
                    if (!/^https?:\/\//i.test(baseIpOrUrl)) {
                        baseIpOrUrl = `http://${baseIpOrUrl}`;
                        finalTargetUrl = baseIpOrUrl;
                    }

                    try {
                        const urlObj = new URL(baseIpOrUrl);
                        if (urlObj.pathname === '/' || urlObj.pathname === '') {
                            const brand = response.data.ip_camera_brand || 'generic';
                            const base = baseIpOrUrl.replace(/\/$/, '');
                            switch (brand) {
                                case 'hikvision':
                                    finalTargetUrl = `${base}/Streaming/channels/1/httppreview`;
                                    break;
                                case 'dahua':
                                    finalTargetUrl = `${base}/cgi-bin/mjpg/video.cgi?channel=1&subtype=1`;
                                    break;
                                case 'onvif':
                                    finalTargetUrl = `${base}/onvif/snapshot`;
                                    break;
                                case 'zk':
                                    finalTargetUrl = `${base}/cgi-bin/mjpg/video.cgi`;
                                    break;
                                case 'foscam':
                                    finalTargetUrl = `${base}/cgi-bin/CGIProxy.fcgi?cmd=snapPicture2`;
                                    break;
                                case 'esp32cam':
                                    finalTargetUrl = urlObj.port ? `${base}/stream` : `${base}:81/stream`;
                                    break;
                                case 'tplink':
                                    finalTargetUrl = `${base}/stream1`;
                                    break;
                            }
                        }
                    } catch(e) {}

                    let proxyUrl = `/api/camera-proxy?url=${encodeURIComponent(finalTargetUrl)}`;
                    if (response.data.ip_camera_auth_enabled && response.data.ip_camera_username) {
                        proxyUrl += `&user=${encodeURIComponent(response.data.ip_camera_username)}&pass=${encodeURIComponent(response.data.ip_camera_password || '')}`;
                    }
                    setCameraUrl(proxyUrl);
                }
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoadingSettings(false);
        }
    };

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
            setLastUser({...response.data.user, status: response.data.status});
            setScanValue("");
            toast.success(t("attendance_status_user", { status: response.data.status, name: response.data.user.name }));
            
            const audio = new Audio('/sounds/success.mp3');
            audio.play().catch(() => {});
        } catch (err: any) {
            setError(err.response?.data?.message || t("invalid_id_card"));
            const audio = new Audio('/sounds/error.mp3');
            audio.play().catch(() => {});
        } finally {
            setProcessing(false);
            if (inputRef.current) inputRef.current.focus();
        }
    };

    // AI QR Code and Face Recognition Scanner Loop
    useEffect(() => {
        let scanInterval: NodeJS.Timeout;

        if (mode === "camera" && cameraUrl && !cameraError && !scanCooldown) {
            scanInterval = setInterval(async () => {
                if (cameraImgRef.current && canvasRef.current && cameraImgRef.current.complete) {
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext("2d", { willReadFrequently: true });
                    const img = cameraImgRef.current;

                    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

                        if (lensMode === "qr") {
                            const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                            if (imageData) {
                                const code = jsQR(imageData.data, imageData.width, imageData.height);
                                if (code && code.data) {
                                    handleScan(code.data);
                                    setScanCooldown(true);
                                    setTimeout(() => setScanCooldown(false), 3000);
                                }
                            }
                        } else if (lensMode === "face" && modelsLoaded && faceUsers.length > 0) {
                            try {
                                const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                                if (detection) {
                                    const labeledDescriptors = faceUsers.map(user => {
                                        const descriptors = user.face_descriptor ? [new Float32Array(JSON.parse(user.face_descriptor))] : [];
                                        return new faceapi.LabeledFaceDescriptors(String(user.id), descriptors);
                                    }).filter(d => d.descriptors.length > 0);

                                    if (labeledDescriptors.length > 0) {
                                        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
                                        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

                                        if (bestMatch.label !== 'unknown') {
                                            const matchedUserId = bestMatch.label;
                                            handleScan(matchedUserId);
                                            setScanCooldown(true);
                                            setTimeout(() => setScanCooldown(false), 3000);
                                        }
                                    }
                                }
                            } catch (e) {
                                // Ignore faceapi loop exceptions
                            }
                        }
                    }
                }
            }, lensMode === "qr" ? 500 : 800);
        }

        return () => {
            if (scanInterval) clearInterval(scanInterval);
        };
    }, [mode, lensMode, cameraUrl, cameraError, scanCooldown, modelsLoaded, faceUsers]);

    if (loadingSettings) {
        return (
            <div className="space-y-4 font-sans p-4 min-h-screen">
                <div className="rounded-2xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
                    <div className="flex flex-row items-center gap-2.5 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="h-9 w-9 rounded-lg bg-gray-200 animate-pulse" />
                        <div className="space-y-1.5">
                            <div className="h-4 w-44 rounded bg-gray-200 animate-pulse" />
                            <div className="h-2 w-32 rounded bg-gray-100 animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="h-[400px] rounded-xl border border-gray-100 bg-white shadow-sm animate-pulse" />
                    <div className="h-[400px] rounded-xl border border-gray-100 bg-white shadow-sm animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 font-sans p-4 bg-gray-50/10 min-h-screen text-xs">
            {/* Page Header with Mode Toggles */}
            <div className="rounded-2xl border-[0.5px] border-indigo-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#EFF0FD] to-indigo-50/60">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#6366F1] text-white shadow-sm">
                        <Cpu className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="text-base font-bold tracking-tight text-slate-800 leading-none">Smart Access Control & Attendance Terminal</h1>
                        <p className="text-[11px] text-gray-500 mt-1">ZKTeco Biometric Fingerprint / NFC ADMS Push & Local Scanners</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex border border-indigo-200 rounded-lg overflow-hidden bg-white/80 p-1 shadow-sm">
                        <button
                            onClick={() => setMode("zkteco")}
                            className={cn(
                                "px-3.5 py-1.5 text-[10px] font-bold uppercase transition-all rounded-md flex items-center gap-1.5",
                                mode === "zkteco" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-indigo-600"
                            )}
                        >
                            <Cpu className="h-3.5 w-3.5" /> ZKTeco Biometric / NFC
                        </button>
                        {settings?.use_sensor_device && (
                            <button
                                onClick={() => setMode("sensor")}
                                className={cn(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase transition-all rounded-md flex items-center gap-1.5",
                                    mode === "sensor" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-indigo-600"
                                )}
                            >
                                <Zap className="h-3.5 w-3.5" /> USB Sensor
                            </button>
                        )}
                        {settings?.use_camera_device && (
                            <button
                                onClick={() => setMode("camera")}
                                className={cn(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase transition-all rounded-md flex items-center gap-1.5",
                                    mode === "camera" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:text-indigo-600"
                                )}
                            >
                                <Camera className="h-3.5 w-3.5" /> Visual Camera
                            </button>
                        )}
                    </div>
                </div>
              </div>
            </div>

            {/* ZKTeco Access Control Mode */}
            {mode === "zkteco" && (
                <div className="space-y-4">
                    {/* ZKTeco Metrics Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-xl border border-indigo-100 bg-white shadow-sm flex items-center gap-3">
                            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                <HardDrive className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Registered Devices</p>
                                <p className="text-base font-bold text-slate-800">{zkSummary.total_devices || 0} <span className="text-xs font-normal text-emerald-600">({zkSummary.online_devices || 0} online)</span></p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl border border-indigo-100 bg-white shadow-sm flex items-center gap-3">
                            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
                                <Activity className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Today Punches</p>
                                <p className="text-base font-bold text-slate-800">{zkSummary.today_punches || 0}</p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl border border-indigo-100 bg-white shadow-sm flex items-center gap-3">
                            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Matched Students</p>
                                <p className="text-base font-bold text-slate-800">{zkSummary.matched_punches || 0}</p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl border border-indigo-100 bg-white shadow-sm flex items-center gap-3">
                            <span className="p-2 rounded-lg bg-orange-50 text-orange-600">
                                <Cpu className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400">Match Accuracy</p>
                                <p className="text-base font-bold text-slate-800">{zkSummary.match_rate || 100}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Actions Bar */}
                    <div className="p-4 rounded-xl border border-indigo-100 bg-white shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5 flex-1">
                            <div className="flex items-center gap-1 text-slate-500 font-bold text-[11px] uppercase mr-1">
                                <Filter className="h-3.5 w-3.5 text-indigo-600" /> Filter:
                            </div>

                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-8 text-xs w-[150px] bg-slate-50">
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
                                <SelectTrigger className="h-8 text-xs w-[140px] bg-slate-50">
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

                            <div className="relative flex-1 min-w-[200px] max-w-xs">
                                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') fetchZkLogs(); }}
                                    placeholder="Search Roll No / Admission ID..."
                                    className="h-8 text-xs pl-8 bg-slate-50"
                                />
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={fetchZkLogs}
                                disabled={fetchingZkLogs}
                                className="h-8 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            >
                                {fetchingZkLogs ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
                                Search
                            </Button>
                        </div>

                        <Button
                            type="button"
                            onClick={handlePullZkData}
                            disabled={pullingZkData}
                            className="h-8 px-4 text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white font-bold gap-1.5 shadow-sm shrink-0"
                        >
                            {pullingZkData ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowDownToLine className="h-3.5 w-3.5" />}
                            Pull ZKTeco Attendance Data
                        </Button>
                    </div>

                    {/* ZKTeco Attendance Logs Feed Table */}
                    <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-50/80 to-purple-50/50 border-b border-indigo-100 flex items-center justify-between">
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
                            <div className="p-8 text-center text-slate-400 space-y-2">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
                                <p className="text-xs">Fetching ZKTeco attendance logs...</p>
                            </div>
                        ) : zkLogs.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 space-y-2">
                                <Cpu className="h-8 w-8 mx-auto text-indigo-300" />
                                <p className="text-xs font-bold text-slate-600">No attendance logs received yet</p>
                                <p className="text-[11px] text-slate-400">Connect your ZKTeco device or click &quot;Pull ZKTeco Attendance Data&quot; to fetch latest logs.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/80">
                                    <TableRow className="border-b border-slate-200">
                                        <TableHead className="text-[11px] font-bold text-slate-700">Student / User</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-700">Admission No & Roll No</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-700">Class & Section</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-700">Verification Mode</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-700">Device SN</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-700">Punch Time</TableHead>
                                        <TableHead className="text-[11px] font-bold text-slate-700 text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Array.isArray(zkLogs) && zkLogs.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-slate-50/60">
                                            <TableCell className="py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    {log.student?.avatar ? (
                                                        <img src={getImageUrl(log.student.avatar)} alt="" className="h-7 w-7 rounded-full object-cover border border-slate-200" />
                                                    ) : (
                                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 font-bold text-[10px]">
                                                            {log.student?.name ? log.student.name.charAt(0) : '?'}
                                                        </span>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-800">
                                                            {log.student?.name || `Unregistered User (${log.user_pin})`}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 uppercase">
                                                            {log.student?.role || 'Student'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2.5">
                                                <div className="flex flex-col font-mono text-[11px]">
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
                                            <TableCell className="py-2.5">
                                                <div className="text-[11px] text-slate-700 font-medium">
                                                    {log.school_class || log.student?.school_class_id ? (
                                                        <span>
                                                            {log.school_class?.class_name || log.school_class?.name || 'Class'} {log.section ? `- ${log.section.section_name || log.section.name}` : ''}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">General Access</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2.5">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                                    {log.verify_type === '15' ? 'NFC / RFID Card' : 'Fingerprint Biometric'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2.5">
                                                <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {log.device_serial}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2.5 font-mono text-[11px] text-slate-700">
                                                {log.punch_time ? new Date(log.punch_time).toLocaleString() : 'N/A'}
                                            </TableCell>
                                            <TableCell className="py-2.5 text-right">
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

            {/* Existing USB Sensor & Camera Lens Modes */}
            {mode !== "zkteco" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Scanner Section */}
                    <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden flex flex-col relative h-[400px]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/10 overflow-hidden">
                            <div className={cn("h-full bg-indigo-500 transition-all duration-300", processing ? "w-full animate-pulse" : "w-0")} />
                        </div>

                        <div className="p-6 flex-1 flex flex-col items-center justify-center space-y-6">
                            {mode === "sensor" ? (
                                <div className="w-full max-w-sm space-y-6">
                                    <div className="text-center space-y-1">
                                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t("ready_to_scan")}</h2>
                                        <p className="text-[10px] text-gray-400">{t("connect_institutional_scanning_peripheral")}</p>
                                    </div>

                                    <Input
                                        ref={inputRef}
                                        value={scanValue}
                                        onChange={(e) => setScanValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleScan(scanValue);
                                        }}
                                        placeholder={t("scan_id_card")}
                                        className="h-12 text-center text-lg font-bold tracking-widest bg-gray-50/50 rounded focus-visible:ring-indigo-500 uppercase"
                                        autoFocus
                                    />

                                    <div className="flex justify-center opacity-40">
                                        <MockIdCardIcon active={processing} />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full max-w-sm space-y-4">
                                    {/* Lens Mode Selector Switch */}
                                    <div className="flex border border-gray-100 rounded overflow-hidden bg-gray-50/50 p-0.5">
                                        <button
                                            onClick={() => setLensMode("qr")}
                                            className={cn(
                                                "flex-1 py-1 text-[9px] font-bold uppercase transition-all rounded flex items-center justify-center gap-1.5",
                                                lensMode === "qr" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                            )}
                                        >
                                            <QrCode className="h-3 w-3" /> {t("card_qr_code")}
                                        </button>
                                        <button
                                            onClick={() => setLensMode("face")}
                                            className={cn(
                                                "flex-1 py-1 text-[9px] font-bold uppercase transition-all rounded flex items-center justify-center gap-1.5",
                                                lensMode === "face" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                            )}
                                        >
                                            <ScanFace className="h-3 w-3" /> {t("ai_face_recognition")}
                                        </button>
                                    </div>

                                    <div className="relative aspect-video bg-gray-900 rounded overflow-hidden border-2 border-gray-100 shadow-inner group">
                                        {loadingModels && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90 text-white space-y-2 p-4 text-center z-20">
                                                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                                                <div>
                                                    <p className="text-xs font-bold">{t("mounting_neural_engine")}</p>
                                                    <p className="text-[10px] text-gray-400">{t("downloading_ssd_mobilenet_models")}</p>
                                                </div>
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
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 text-white space-y-2 p-4 text-center">
                                                        <AlertCircle className="h-8 w-8 text-rose-500" />
                                                        <p className="text-xs font-bold">{t("camera_stream_unreachable")}</p>
                                                        <p className="text-[10px] text-gray-400 max-w-[200px]">{t("verify_ip_camera_url_rtsp")}</p>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => { setCameraError(false); fetchSettings(); }}
                                                            className="h-7 text-[10px] bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
                                                        >
                                                            <RefreshCw className="h-3 w-3 mr-1" /> {t("retry_stream")}
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 text-white space-y-2 p-4 text-center">
                                                <Camera className="h-8 w-8 text-indigo-400 opacity-50" />
                                                <p className="text-xs font-bold">{t("no_ip_camera_configured")}</p>
                                                <p className="text-[10px] text-gray-400">{t("configure_camera_url_in_settings")}</p>
                                            </div>
                                        )}

                                        {/* Scanner Overlay Matrix */}
                                        {!cameraError && cameraUrl && (
                                            <div className="absolute inset-0 border-[30px] border-black/40 pointer-events-none flex items-center justify-center">
                                                <div className={cn(
                                                    "w-48 h-48 border-2 rounded transition-all duration-300 relative",
                                                    scanCooldown ? "border-emerald-500 bg-emerald-500/10" : "border-indigo-500/80"
                                                )}>
                                                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-indigo-400" />
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-indigo-400" />
                                                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-indigo-400" />
                                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-indigo-400" />
                                                    
                                                    {scanCooldown && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/80 text-emerald-400 text-xs font-bold gap-1 animate-pulse">
                                                            <CheckCircle2 className="h-4 w-4" /> {t("verified")}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-gray-400 bg-gray-50 p-2 rounded border border-gray-100">
                                        <span className="flex items-center gap-1">
                                            <Wifi className={cn("h-3 w-3", cameraUrl && !cameraError ? "text-emerald-500" : "text-rose-500")} />
                                            {cameraUrl && !cameraError ? t("stream_connected") : t("stream_offline")}
                                        </span>
                                        <span>{lensMode === "qr" ? t("qr_recognition_engine") : t("mobilenet_v1_facial_matcher")}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Result Profile Section */}
                    <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <span className="font-bold text-gray-700 uppercase tracking-widest text-[10px] flex items-center gap-1">
                                <UserCircle className="h-3.5 w-3.5 text-indigo-500" /> {t("verification_profile")}
                            </span>
                            {lastUser && (
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                                    lastUser.status === 'Out' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                                )}>
                                    {lastUser.status === 'Out' ? t("exit_recorded") : t("entry_recorded")}
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
                                                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-50 shadow-md mx-auto"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-white shadow-md mx-auto flex items-center justify-center">
                                                <User className="h-10 w-10 text-indigo-400" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 right-0 p-1 bg-emerald-500 text-white rounded-full border-2 border-white shadow">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-bold text-gray-800">{lastUser.name}</h3>
                                        <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider mt-0.5">{lastUser.role}</p>
                                    </div>

                                    <div className="bg-gray-50 rounded p-3 text-left space-y-1.5 border border-gray-100 text-[11px]">
                                        {lastUser.admission_no && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">{t("admission_no")}:</span>
                                                <span className="font-bold text-gray-700">{lastUser.admission_no}</span>
                                            </div>
                                        )}
                                        {lastUser.staff_id && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">{t("staff_id")}:</span>
                                                <span className="font-bold text-gray-700">{lastUser.staff_id}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">{t("timestamp")}:</span>
                                            <span className="font-bold text-gray-700">{lastUser.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="text-center space-y-3 max-w-xs animate-in fade-in zoom-in duration-200">
                                    <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 mx-auto flex items-center justify-center text-rose-500">
                                        <AlertCircle className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-rose-600">{t("scan_rejected")}</h3>
                                        <p className="text-[11px] text-gray-400 mt-1">{error}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-2 opacity-30">
                                    <User className="h-12 w-12 mx-auto text-gray-400" />
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("awaiting_scan")}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MockIdCardIcon({ active }: { active: boolean }) {
    return (
        <div className={cn(
            "w-36 h-24 border-2 rounded-lg p-3 flex flex-col justify-between transition-all duration-300 bg-white",
            active ? "border-indigo-500 shadow-md scale-105" : "border-gray-200"
        )}>
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200" />
                <div className="space-y-1 flex-1">
                    <div className="h-1.5 bg-gray-200 rounded w-3/4" />
                    <div className="h-1 bg-gray-100 rounded w-1/2" />
                </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                <div className="h-2 w-12 bg-indigo-100 rounded" />
                <QrCode className="h-4 w-4 text-gray-300" />
            </div>
        </div>
    );
}
