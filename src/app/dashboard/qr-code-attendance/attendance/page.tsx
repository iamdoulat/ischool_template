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
    Wifi, QrCode, ScanFace, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as faceapi from "face-api.js";

const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://127.0.0.1:8000';

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
    const [mode, setMode] = useState<"camera" | "sensor">("sensor");
    const [lensMode, setLensMode] = useState<"qr" | "face">("qr");
    const [loadingModels, setLoadingModels] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceUsers, setFaceUsers] = useState<any[]>([]);

    const [scanValue, setScanValue] = useState("");
    const [processing, setProcessing] = useState(false);
    const [lastUser, setLastUser] = useState<ScannedUser | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState<any>(null);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const cameraImgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [cameraError, setCameraError] = useState(false);
    const [cameraUrl, setCameraUrl] = useState("");
    const [scanCooldown, setScanCooldown] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

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
                    toast.success("AI Face Recognition Framework mounted!");
                } catch (error) {
                    console.error("Error loading face models:", error);
                    toast.error("Failed to load AI face recognition models.");
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
                if (!response.data.use_sensor_device && response.data.use_camera_device) {
                    setMode("camera");
                }
                
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
                                    // Default ESP32-CAM port 81 for stream
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
            toast.success(`Attendance ${response.data.status}: ${response.data.user.name}`);
            
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
                        if (canvas.width !== img.naturalWidth) {
                            canvas.width = img.naturalWidth;
                            canvas.height = img.naturalHeight;
                        }

                        if (lensMode === "qr") {
                            try {
                                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                                const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
                                if (imageData) {
                                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                                        inversionAttempts: "dontInvert",
                                    });

                                    if (code && code.data) {
                                        handleScan(code.data);
                                        setScanCooldown(true);
                                        setTimeout(() => setScanCooldown(false), 3000); 
                                    }
                                }
                            } catch (e) {
                                // Ignore CORS canvas read errors
                            }
                        } else if (lensMode === "face" && modelsLoaded && faceUsers.length > 0) {
                            try {
                                ctx?.clearRect(0, 0, canvas.width, canvas.height);
                                
                                const detection = await faceapi.detectSingleFace(img)
                                    .withFaceLandmarks()
                                    .withFaceDescriptor();

                                if (detection) {
                                    // Resize box
                                    const displaySize = { width: canvas.width, height: canvas.height };
                                    const resizedDetections = faceapi.resizeResults(detection, displaySize);
                                    
                                    const box = resizedDetections.detection.box;
                                    if (ctx) {
                                        ctx.strokeStyle = "#4F46E5"; // Indigo color matching design tokens
                                        ctx.lineWidth = 4;
                                        ctx.strokeRect(box.x, box.y, box.width, box.height);
                                    }

                                    const labeledDescriptors = faceUsers.map(u => {
                                        const desc = new Float32Array(u.face_descriptor);
                                        return new faceapi.LabeledFaceDescriptors(u.id.toString(), [desc]);
                                    });

                                    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
                                    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

                                    if (bestMatch.label !== 'unknown') {
                                        const matchedUserId = bestMatch.label;
                                        handleScan(matchedUserId);
                                        setScanCooldown(true);
                                        setTimeout(() => setScanCooldown(false), 3000);
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

    return (
        <div className="space-y-4 font-sans p-4 bg-gray-50/10 min-h-screen text-xs">
            {/* Header */}
            <div className="bg-white p-4 rounded border border-gray-100 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-indigo-50 flex items-center justify-center">
                        <Scan className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                            Attendance Terminal
                        </h1>
                        <p className="text-[10px] text-gray-400 mt-1">Real-time scanning & verification</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex border border-gray-100 rounded overflow-hidden bg-gray-50/50 p-1">
                        {settings?.use_camera_device && (
                            <button
                                onClick={() => setMode("camera")}
                                className={cn(
                                    "px-4 py-1.5 text-[10px] font-bold uppercase transition-all rounded flex items-center gap-2",
                                    mode === "camera" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Camera className="h-3.5 w-3.5" /> Visual
                            </button>
                        )}
                        {settings?.use_sensor_device && (
                            <button
                                onClick={() => setMode("sensor")}
                                className={cn(
                                    "px-4 py-1.5 text-[10px] font-bold uppercase transition-all rounded flex items-center gap-2",
                                    mode === "sensor" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Zap className="h-3.5 w-3.5" /> HID / NFC
                            </button>
                        )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-rose-500 rounded">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

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
                                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Ready to Scan</h2>
                                    <p className="text-[10px] text-gray-400">Connect institutional scanning peripheral</p>
                                </div>

                                <Input
                                    ref={inputRef}
                                    value={scanValue}
                                    onChange={(e) => setScanValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleScan(scanValue);
                                    }}
                                    placeholder="SCAN ID CARD..."
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
                                        <QrCode className="h-3 w-3" /> Card / QR Code
                                    </button>
                                    <button
                                        onClick={() => setLensMode("face")}
                                        className={cn(
                                            "flex-1 py-1 text-[9px] font-bold uppercase transition-all rounded flex items-center justify-center gap-1.5",
                                            lensMode === "face" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        <ScanFace className="h-3 w-3" /> AI Face Recognition
                                    </button>
                                </div>

                                <div className="relative aspect-video bg-gray-900 rounded overflow-hidden border-2 border-gray-100 shadow-inner group">
                                    {loadingModels && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90 text-white space-y-2 p-4 text-center z-20">
                                            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Loading AI Engine</p>
                                                <p className="text-[8px] text-gray-400 mt-1 max-w-[200px]">Mounting facial landmarks and recognition models...</p>
                                            </div>
                                        </div>
                                    )}

                                    {cameraUrl ? (
                                        cameraError ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white space-y-3 p-4 text-center z-10">
                                                <AlertCircle className="h-8 w-8 text-rose-500" />
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Connection Failed</p>
                                                    <p className="text-[9px] text-gray-400 mt-1 max-w-[200px]">Camera offline or invalid credentials.</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" className="text-[9px] h-7 bg-white/10 border-white/20 hover:bg-white/20" onClick={() => setCameraError(false)}>
                                                        Retry
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <img 
                                                    ref={cameraImgRef}
                                                    crossOrigin="anonymous"
                                                    src={cameraUrl} 
                                                    className="w-full h-full object-cover" 
                                                    alt="IP Camera Stream" 
                                                    onError={() => setCameraError(true)}
                                                />
                                                <canvas 
                                                    ref={canvasRef} 
                                                    className={cn(
                                                        "absolute inset-0 w-full h-full pointer-events-none",
                                                        lensMode === "qr" && "hidden"
                                                    )} 
                                                />
                                            </>
                                        )
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white space-y-2">
                                            <div className="relative">
                                                <div className="absolute inset-0 animate-ping rounded-full bg-rose-500/20 h-12 w-12" />
                                                <div className="relative h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/50">
                                                    <Camera className="h-6 w-6 text-rose-500" />
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Optical Source Offline</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Scan Line Overlay */}
                                    {!cameraError && lensMode === "qr" && (
                                        <div className="absolute inset-x-0 h-[1px] bg-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.8)] top-1/2 -translate-y-1/2 animate-[scan_2s_ease-in-out_infinite] pointer-events-none" />
                                    )}
                                    
                                    {/* Corner Accents */}
                                    <div className="absolute top-4 left-4 h-6 w-6 border-t-2 border-l-2 border-white/20 rounded-tl pointer-events-none" />
                                    <div className="absolute top-4 right-4 h-6 w-6 border-t-2 border-r-2 border-white/20 rounded-tr pointer-events-none" />
                                    <div className="absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-white/20 rounded-bl pointer-events-none" />
                                    <div className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-white/20 rounded-br pointer-events-none" />
                                </div>

                                <div className="flex justify-between items-center px-2">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("h-2 w-2 rounded-full animate-pulse", cameraError ? "bg-rose-500" : "bg-emerald-500")} />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            {cameraError ? "Stream Error" : (settings?.ip_camera_url ? "IP Camera Connected" : "Local Camera")}
                                        </span>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 text-[9px] font-bold uppercase text-indigo-500 hover:bg-indigo-50"
                                        onClick={() => {
                                            setCameraError(false);
                                            fetchSettings();
                                        }}
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1.5" /> Refresh
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Identity Verification Section */}
                <div className="flex flex-col gap-4 h-[400px]">
                    <div className={cn(
                        "flex-1 rounded border transition-all duration-300 flex flex-col p-6 items-center justify-center relative overflow-hidden",
                        lastUser ? "bg-emerald-50/50 border-emerald-100 shadow-sm" : "bg-white border-gray-100 shadow-sm"
                    )}>
                        {!lastUser && !error ? (
                            <div className="flex flex-col items-center text-center space-y-4 opacity-40">
                                <UserCircle className="h-16 w-16 text-gray-400" />
                                <div>
                                    <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest">Awaiting Identity</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Scan credential to verify</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
                                <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
                                    <AlertCircle className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest">Access Denied</h3>
                                    <p className="text-[10px] text-rose-500 mt-1">{error}</p>
                                </div>
                                <Button 
                                    onClick={() => setError(null)}
                                    className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold uppercase h-8 px-6 rounded shadow-sm"
                                >
                                    Dismiss Error
                                </Button>
                            </div>
                        ) : lastUser && (
                            <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="absolute top-4 right-4">
                                    <div className={cn(
                                        "text-white px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm",
                                        lastUser.status === 'In' ? "bg-emerald-500" : "bg-indigo-500"
                                    )}>
                                        <CheckCircle2 className="h-3 w-3" /> Identity Verified
                                    </div>
                                </div>

                                <div className="flex flex-col items-center text-center space-y-3">
                                    <div className="relative">
                                        <div className="h-24 w-24 rounded bg-white border-2 border-emerald-100 shadow-sm overflow-hidden flex items-center justify-center">
                                            {lastUser.avatar ? (
                                                <img src={`${apiBase}/storage/${lastUser.avatar}`} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserCircle className="h-12 w-12 text-emerald-100" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">{lastUser.name}</h3>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-100/50 px-2.5 py-0.5 rounded">{lastUser.role}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {lastUser.admission_no || lastUser.staff_id}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded border border-emerald-50 flex justify-between items-center shadow-sm">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Timestamp</p>
                                        <p className="text-sm font-black text-emerald-900">{lastUser.time}</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Action</p>
                                        <p className="text-xs font-bold text-emerald-700 uppercase">Attendance {lastUser.status}</p>
                                    </div>
                                </div>
                            </div>
                        )}
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
            "relative w-48 h-32 border-2 border-gray-300 rounded flex flex-col items-center justify-center bg-white transition-all duration-300",
            active ? "scale-105 border-indigo-300 shadow-lg shadow-indigo-50" : ""
        )}>
            {/* Lanyard Clip */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-5 border-2 border-gray-300 rounded-t bg-white flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
            
            <div className="w-full h-full p-3 flex items-center gap-3">
                <div className="w-12 h-16 border-2 border-gray-200 flex items-center justify-center bg-gray-50 rounded-sm">
                    <User className={cn("h-6 w-6 text-gray-300 transition-all", active ? "text-indigo-400" : "")} />
                </div>

                <div className="flex-1 space-y-2">
                    <div className="h-1.5 w-full bg-gray-200 rounded-full"></div>
                    <div className="h-1.5 w-3/4 bg-gray-200 rounded-full"></div>
                    <div className="flex justify-end pt-2">
                        <QrCode className={cn("h-6 w-6", active ? "text-indigo-400" : "text-gray-300")} />
                    </div>
                </div>
            </div>
        </div>
    )
}
