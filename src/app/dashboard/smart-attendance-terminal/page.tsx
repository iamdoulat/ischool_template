// @ts-nocheck
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";
import * as faceapi from "face-api.js";
import jsQR from "jsqr";
import { 
  ScanFace, ScanLine, Smartphone, Loader2, CheckCircle2, AlertCircle,
  Clock, UserCheck, QrCode, SmartphoneNfc, RefreshCw, Camera, Wifi, WifiOff,
  Maximize2, Minimize2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useImageUrl } from "@/lib/image-url";

interface User {
  id: number; name: string; role: string; avatar: string | null;
  face_descriptor?: any; qr_code?: string | null; nfc_uid?: string | null;
}

interface Record {
  id: number; user_id: number;
  user: { id: number; name: string; role: string; avatar: string | null };
  attendance_date: string; attendance_time: string; method: 'face' | 'qr' | 'nfc';
  status?: string;
}

interface SmartSettings { is_face_enabled: boolean; is_qr_enabled: boolean; is_nfc_enabled: boolean; }

interface QrSettings {
  use_camera_device: boolean; use_sensor_device: boolean;
  ip_camera_url: string; ip_camera_brand: string;
  ip_camera_rtsp_transport: string; ip_camera_auth_enabled: boolean;
  ip_camera_username: string; ip_camera_password: string;
  camera_type: string;
}

type Mode = 'face' | 'qr' | 'nfc' | null;
type CameraSource = 'webcam' | 'ip' | null;

const methodIcons: Record<string, React.ReactNode> = {
  face: <ScanFace className="h-3.5 w-3.5" />,
  qr: <QrCode className="h-3.5 w-3.5" />,
  nfc: <SmartphoneNfc className="h-3.5 w-3.5" />,
};
const methodColors: Record<string, string> = {
  face: 'text-blue-600 bg-blue-50',
  qr: 'text-green-600 bg-green-50',
  nfc: 'text-purple-600 bg-purple-50',
};
function buildCameraProxyUrl(settings: QrSettings): string | null {
  if (!settings.ip_camera_url) return null;
  let baseIpOrUrl = settings.ip_camera_url.trim();
  if (!/^https?:\/\//i.test(baseIpOrUrl)) baseIpOrUrl = `http://${baseIpOrUrl}`;
  let finalTargetUrl = baseIpOrUrl;
  try {
    const urlObj = new URL(baseIpOrUrl);
    if (urlObj.pathname === '/' || urlObj.pathname === '') {
      const base = baseIpOrUrl.replace(/\/$/, '');
      const brand = settings.ip_camera_brand || 'generic';
      switch (brand) {
        case 'hikvision': finalTargetUrl = `${base}/Streaming/channels/1/httppreview`; break;
        case 'dahua': finalTargetUrl = `${base}/cgi-bin/mjpg/video.cgi?channel=1&subtype=1`; break;
        case 'onvif': finalTargetUrl = `${base}/onvif/snapshot`; break;
        case 'zk': finalTargetUrl = `${base}/cgi-bin/mjpg/video.cgi`; break;
        case 'foscam': finalTargetUrl = `${base}/cgi-bin/CGIProxy.fcgi?cmd=snapPicture2`; break;
        case 'esp32cam': finalTargetUrl = urlObj.port ? `${base}/stream` : `${base}:81/stream`; break;
        case 'tplink': finalTargetUrl = `${base}/stream1`; break;
      }
    }
  } catch { /* ignore */ }
  let proxyUrl = `/api/camera-proxy?url=${encodeURIComponent(finalTargetUrl)}`;
  if (settings.ip_camera_auth_enabled && settings.ip_camera_username) {
    proxyUrl += `&user=${encodeURIComponent(settings.ip_camera_username)}&pass=${encodeURIComponent(settings.ip_camera_password || '')}`;
  }
  return proxyUrl;
}

export default function SmartAttendanceTerminalPage() {
  const getImageUrl = useImageUrl();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraImgRef = useRef<HTMLImageElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      fullscreenRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen();
    }
  };

  const [settings, setSettings] = useState<SmartSettings | null>(null);
  const [qrSettings, setQrSettings] = useState<QrSettings | null>(null);
  const [cameraSource, setCameraSource] = useState<CameraSource>(null);
  const [cameraUrl, setCameraUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [activeMode, setActiveMode] = useState<Mode>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [labeledDescriptors, setLabeledDescriptors] = useState<faceapi.LabeledFaceDescriptors[]>([]);
  const [records, setRecords] = useState<Record[]>([]);

  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isWebcamPlaying, setIsWebcamPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [matchMessage, setMatchMessage] = useState("");
  const [ipCamTick, setIpCamTick] = useState(0);
  const [ipCamReady, setIpCamReady] = useState(false);

  const qrLookup = useRef<Map<string, User>>(new Map());
  const nfcLookup = useRef<Map<string, User>>(new Map());
  const processingRef = useRef(false);
  processingRef.current = isProcessing;
  const frameBusyRef = useRef(false);
  const activeModeRef = useRef(activeMode);
  activeModeRef.current = activeMode;
  const cameraSourceRef = useRef(cameraSource);
  cameraSourceRef.current = cameraSource;
  const isWebcamPlayingRef = useRef(isWebcamPlaying);
  isWebcamPlayingRef.current = isWebcamPlaying;
  const reconnectAttemptRef = useRef(0);
  reconnectAttemptRef.current = reconnectAttempt;
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await api.get('/smart-attendance/records?limit=30');
      setRecords(res.data?.data?.data || res.data?.data || []);
    } catch { /* silent */ }
  }, []);

  // 1. Load all settings and users
  useEffect(() => {
    const init = async () => {
      try {
        const [smartRes, qrRes, usersRes] = await Promise.all([
          api.get('/smart-attendance/settings'),
          api.get('/attendance/qr-settings').catch(() => null),
          api.get('/smart-attendance/users'),
        ]);

        const sData = smartRes.data?.data?.data || smartRes.data?.data;
        if (sData) {
          setSettings(sData);
          if (sData.is_qr_enabled) setActiveMode('qr');
          else if (sData.is_face_enabled) setActiveMode('face');
          else if (sData.is_nfc_enabled) setActiveMode('nfc');
        }

        // QR Attendance camera settings
        if (qrRes) {
          const qData = qrRes.data?.data || qrRes.data;
          setQrSettings(qData);
          if (qData?.use_camera_device && qData?.ip_camera_url) {
            const proxyUrl = buildCameraProxyUrl(qData);
            if (proxyUrl) {
              setCameraUrl(proxyUrl);
              setCameraSource('ip');
            }
          }
        }

        const uData = usersRes.data?.data?.data || usersRes.data?.data || [];
        setUsers(uData);
        const qrMap = new Map<string, User>();
        const nfcMap = new Map<string, User>();
        for (const u of uData) {
          if (u.qr_code) qrMap.set(u.qr_code, u);
          if (u.nfc_uid) nfcMap.set(u.nfc_uid, u);
        }
        qrLookup.current = qrMap;
        nfcLookup.current = nfcMap;

        fetchRecords();
      } catch (err) {
        console.error("Initialization error:", err);
        toast.error("Failed to initialize terminal");
      }
    };
    init();
  }, [fetchRecords]);

  useEffect(() => {
    if (!settings) return;
    const interval = setInterval(fetchRecords, 10000);
    return () => clearInterval(interval);
  }, [settings, fetchRecords]);

  // 2. Face Models
  useEffect(() => {
    if (!settings?.is_face_enabled && activeMode !== 'face') return;
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setIsModelsLoaded(true);
      } catch (error) { console.error("Face model error:", error); }
    };
    loadModels();
  }, [settings, activeMode]);

  useEffect(() => {
    if (isModelsLoaded && users.length > 0) {
      const descriptors = users
        .filter(u => u.face_descriptor)
        .map(u => new faceapi.LabeledFaceDescriptors(u.id.toString(), [new Float32Array(u.face_descriptor)]));
      setLabeledDescriptors(descriptors);
    }
  }, [isModelsLoaded, users]);

  // 3. Start/stop camera source with retry
  const startWebcam = async (retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const facingMode = qrSettings?.camera_type === 'secondary' ? 'environment' : 'user';
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        } catch {
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 500 * attempt));
            stream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
          }
        }
        if (stream && videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraSource('webcam');
          setIsWebcamPlaying(true);
          setCameraError(false);
          return;
        }
      } catch (err) {
        console.error(`Webcam attempt ${attempt}/${retries} failed:`, err);
      }
    }
    toast.error("Could not access camera after multiple attempts.");
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
      setIsWebcamPlaying(false);
    }
  };

  useEffect(() => {
    if (activeMode === 'face' || activeMode === 'qr') {
      if (cameraUrl && !isWebcamPlaying) {
        setCameraSource('ip');
        setCameraError(false);
      } else if (!isWebcamPlaying) {
        startWebcam();
      }
    } else {
      stopWebcam();
      setCameraSource(null);
    }
  }, [activeMode, cameraUrl, isWebcamPlaying]);

  // 4. Mark Attendance
  const markAttendance = async (userId: number, method: 'face' | 'qr' | 'nfc') => {
    if (processingRef.current) return;
    setIsProcessing(true);
    try {
      const res = await api.post('/smart-attendance/mark', { user_id: userId, method });
      const data = res.data?.data?.data || res.data?.data;
      const alreadyMarked = data?.already_marked;
      const status = data?.status;
      const userData = data?.user;
      const time = data?.time;
      const user = users.find(u => u.id === userId);
      const displayUser = userData ? { ...user, name: userData.name, role: userData.role, avatar: userData.avatar } : user;
      if (displayUser) {
        setMatchedUser(displayUser);
        const message = alreadyMarked
          ? `${displayUser.name} already recorded at ${time}`
          : `Attendance ${status} Record Successful — ${displayUser.name}`;
        setMatchMessage(message);
        toast.success(message);
        fetchRecords();
        setTimeout(() => { setMatchedUser(null); setIsProcessing(false); }, 3000);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark attendance");
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  // 5. Processing loop — supports both <video> (webcam) and <img> (IP camera)
  const matchedUserRef = useRef(matchedUser);
  matchedUserRef.current = matchedUser;

  const processFrame = useCallback(async () => {
    if (processingRef.current || matchedUserRef.current || frameBusyRef.current) return;
    frameBusyRef.current = true;
    try {
      if (activeMode === 'face' && isModelsLoaded && labeledDescriptors.length > 0) {
        const source = cameraSource === 'ip' ? cameraImgRef.current : videoRef.current;
        if (!source) return;
        const displaySize = { width: (source as any).videoWidth || (source as HTMLImageElement).naturalWidth || 640, height: (source as any).videoHeight || (source as HTMLImageElement).naturalHeight || 480 };
        if (displaySize.width === 0 || displaySize.height === 0) return;
        if (canvasRef.current) faceapi.matchDimensions(canvasRef.current, displaySize);
        const detection = await faceapi.detectSingleFace(source, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
        if (detection && canvasRef.current) {
          const resized = faceapi.resizeResults(detection, displaySize);
          const ctx = canvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          faceapi.draw.drawDetections(canvasRef.current, resized);
          const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.45);
          const match = faceMatcher.findBestMatch(detection.descriptor);
          if (match.label !== 'unknown' && match.distance < 0.45) markAttendance(parseInt(match.label), 'face');
        }
      } else if (activeMode === 'qr') {
        let imageData: ImageData | null = null;
        const tmpCanvas = document.createElement('canvas');
        if (cameraSource === 'ip' && cameraImgRef.current) {
          const img = cameraImgRef.current;
          if (img.naturalWidth === 0 || !img.complete) return;
          tmpCanvas.width = img.naturalWidth;
          tmpCanvas.height = img.naturalHeight;
          const ctx = tmpCanvas.getContext('2d');
          if (ctx) { ctx.drawImage(img, 0, 0); imageData = ctx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height); }
        } else if (videoRef.current && isWebcamPlaying) {
          tmpCanvas.width = videoRef.current.videoWidth;
          tmpCanvas.height = videoRef.current.videoHeight;
          const ctx = tmpCanvas.getContext('2d');
          if (ctx) { ctx.drawImage(videoRef.current, 0, 0); imageData = ctx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height); }
        }
        if (imageData) {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            let qrCodeValue: string | null = null;
            try { const parsed = JSON.parse(code.data); qrCodeValue = parsed.qr_code || parsed.id || parsed.user_id; }
            catch { qrCodeValue = code.data; }
            if (qrCodeValue) {
              const matched = qrLookup.current.get(qrCodeValue);
              if (matched) { markAttendance(matched.id, 'qr'); }
            }
          }
        }
      }
    } finally {
      frameBusyRef.current = false;
    }
  }, [activeMode, isModelsLoaded, labeledDescriptors, cameraSource, isWebcamPlaying]);

  const handleIpCamLoad = useCallback(() => {
    setCameraError(false);
    setReconnectAttempt(0);
    setIpCamReady(true);
    const mode = activeModeRef.current;
    if (mode === 'face' || mode === 'qr') processFrame();
  }, [processFrame]);

  // Webcam: interval-based processing
  useEffect(() => {
    if (!isWebcamPlaying) return;
    const interval = setInterval(processFrame, activeMode === 'face' ? 300 : 800);
    return () => clearInterval(interval);
  }, [isWebcamPlaying, activeMode, processFrame]);

  // Poll IP camera image every 1.5s for live feed
  useEffect(() => {
    if (cameraSource !== 'ip' || !cameraUrl) return;
    const t = setInterval(() => setIpCamTick(n => n + 1), 1500);
    return () => clearInterval(t);
  }, [cameraSource, cameraUrl]);

  // Auto-reconnect IP camera with exponential backoff
  useEffect(() => {
    if (cameraSource !== 'ip' || !cameraError) return;
    const delay = Math.min(1500 * Math.pow(1.5, reconnectAttempt), 15000);
    const timer = setTimeout(() => {
      setCameraError(false);
      setIpCamTick(n => n + 1);
      setReconnectAttempt(n => n + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [cameraSource, cameraError, reconnectAttempt]);

  // 6. NFC
  useEffect(() => {
    if (activeMode !== 'nfc') return;
    if (!('NDEFReader' in window)) {
      toast.warning("Web NFC not supported on this browser.");
      return;
    }
    let ndef: any;
    try {
      ndef = new (window as any).NDEFReader();
      ndef.scan().then(() => {
        ndef.onreading = (event: any) => {
          if (processingRef.current || matchedUserRef.current) return;
          const serialNumber: string = event.serialNumber;
          toast.info(`NFC Tag: ${serialNumber}`);
          const matched = nfcLookup.current.get(serialNumber);
          if (matched) markAttendance(matched.id, 'nfc');
          else toast.error("No user found for this NFC tag");
        };
      }).catch((err: any) => { toast.error("NFC error: " + err.message); });
    } catch (error) { console.error(error); }
    return () => { try { if (ndef) ndef.onreading = null; } catch {} };
  }, [activeMode]);

  if (!settings) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-[80vh] space-y-6 max-w-6xl mx-auto px-4 py-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Smart Attendance Terminal
        </h1>
        <p className="text-muted-foreground text-lg">
          {cameraSource === 'ip' ? 'IP Camera Connected' : 'Select your check-in method'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Mode Selector */}
          <div className="flex gap-4 p-2 bg-muted/50 rounded-2xl border shadow-sm w-full justify-center">
            {settings.is_qr_enabled && (
              <Button variant={activeMode === 'qr' ? 'default' : 'ghost'}
                className={`flex-1 rounded-xl h-14 text-base ${activeMode === 'qr' ? 'shadow-md bg-green-600 hover:bg-green-700' : ''}`}
                onClick={() => setActiveMode('qr')}>
                <ScanLine className="mr-2 h-5 w-5" /> QR Code
              </Button>
            )}
            {settings.is_face_enabled && (
              <Button variant={activeMode === 'face' ? 'default' : 'ghost'}
                className={`flex-1 rounded-xl h-14 text-base ${activeMode === 'face' ? 'shadow-md bg-blue-600 hover:bg-blue-700' : ''}`}
                onClick={() => setActiveMode('face')}>
                <ScanFace className="mr-2 h-5 w-5" /> Face Scan
              </Button>
            )}
            {settings.is_nfc_enabled && (
              <Button variant={activeMode === 'nfc' ? 'default' : 'ghost'}
                className={`flex-1 rounded-xl h-14 text-base ${activeMode === 'nfc' ? 'shadow-md bg-purple-600 hover:bg-purple-700' : ''}`}
                onClick={() => setActiveMode('nfc')}>
                <Smartphone className="mr-2 h-5 w-5" /> NFC Tap
              </Button>
            )}
          </div>

          {/* Terminal Card */}
          <Card className="w-full overflow-hidden shadow-xl border-0 ring-1 ring-border/50">
            <CardContent className="p-0">
              <div ref={fullscreenRef} className="relative aspect-video bg-black flex items-center justify-center">

                {matchedUser && (
                  <div className="absolute inset-0 z-50 bg-green-500/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 animate-in fade-in zoom-in duration-300">
                    <CheckCircle2 className="h-20 w-20 mb-4" />
                    <Avatar className="h-24 w-24 border-4 border-white mb-4 shadow-lg">
                      <AvatarImage src={getImageUrl(matchedUser.avatar)} />
                      <AvatarFallback className="text-3xl text-green-700">{matchedUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-3xl font-bold">{matchedUser.name}</h2>
                    <p className="text-xl opacity-90 mt-2">{matchMessage}</p>
                  </div>
                )}

                {/* Top-right controls */}
                {cameraSource === 'ip' && (
                  <button onClick={() => { setCameraError(false); setReconnectAttempt(0); setIpCamTick(n => n + 1); }}
                    className="absolute top-3 right-12 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all"
                    title="Refresh Camera">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
                <button onClick={toggleFullscreen}
                  className="absolute top-3 right-3 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-all"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>

                {/* Face / QR modes */}
                {(activeMode === 'face' || activeMode === 'qr') && (
                  <>
                    {cameraSource === 'ip' && cameraUrl ? (
                      <>
                        <img ref={cameraImgRef} crossOrigin="anonymous" src={`${cameraUrl}&_t=${ipCamTick}`}
                          className="w-full h-full object-cover" alt="IP Camera"
                          onLoad={handleIpCamLoad}
                          onError={() => setCameraError(true)} />
                        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none" />
                        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                          {cameraError ? <WifiOff className="h-3 w-3 text-rose-400" /> : <Wifi className="h-3 w-3 text-green-400" />}
                          {cameraError ? 'Reconnecting...' : 'IP Camera'}
                        </div>
                        {cameraError && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                            <WifiOff className="h-10 w-10 text-rose-500 mb-3" />
                            <p className="text-white font-medium text-lg">Camera Connection Lost</p>
                            <p className="text-sm text-slate-400 mt-1">Retrying automatically...</p>
                            <Button variant="outline" size="sm" className="mt-4 text-black"
                              onClick={() => { setCameraError(false); setReconnectAttempt(0); }}>
                              <RefreshCw className="h-4 w-4 mr-2" /> Retry Now
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none" />
                        {!isWebcamPlaying && !matchedUser && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-black">
                            <Camera className="h-10 w-10 mb-4 opacity-40" />
                            <p className="text-lg">Camera Offline</p>
                            <p className="text-sm text-slate-500 mt-1">Configure an IP camera in QR Attendance Settings, or allow camera access.</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* QR guide overlay with full-frame scanning animation */}
                    {activeMode === 'qr' && !cameraError && (
                      <div className="absolute inset-0 border-[60px] border-black/30 pointer-events-none">
                        <div className="absolute left-[60px] right-[60px] top-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_12px_#22c55e]" style={{ animation: 'scan 2s ease-in-out infinite' }} />
                        <div className="absolute top-[60px] left-[60px] w-6 h-6 border-t-2 border-l-2 border-green-400" />
                        <div className="absolute top-[60px] right-[60px] w-6 h-6 border-t-2 border-r-2 border-green-400" />
                        <div className="absolute bottom-[60px] left-[60px] w-6 h-6 border-b-2 border-l-2 border-green-400" />
                        <div className="absolute bottom-[60px] right-[60px] w-6 h-6 border-b-2 border-r-2 border-green-400" />
                      </div>
                    )}

                    {/* Face model loading */}
                    {activeMode === 'face' && !isModelsLoaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 bg-black/60 backdrop-blur-sm z-10">
                        <Loader2 className="h-10 w-10 animate-spin mb-4 text-blue-500" />
                        <p className="font-medium text-lg">Loading AI Vision Models...</p>
                      </div>
                    )}
                  </>
                )}

                {/* NFC View */}
                {activeMode === 'nfc' && (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white p-8">
                    <div className="relative flex items-center justify-center h-48 w-48 rounded-full border-4 border-purple-500/30 mb-8">
                      <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
                      <Smartphone className="h-20 w-20 text-purple-400 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Ready to Scan</h3>
                    <p className="text-slate-400 text-center max-w-sm text-lg">Tap your NFC ID Card or Smartphone against the reader.</p>
                    {!("NDEFReader" in window) && (
                      <div className="mt-8 p-4 bg-slate-800 rounded-lg text-sm text-slate-300 text-center">
                        <AlertCircle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                        Web NFC not supported on this browser.
                        <Button variant="outline" className="w-full mt-4 text-black"
                          onClick={() => {
                            const nfcUser = users.find(u => u.nfc_uid);
                            if (nfcUser) markAttendance(nfcUser.id, 'nfc');
                            else if (users.length > 0) toast.error("No users with NFC tags assigned");
                          }}>
                          Mock NFC Tap (Demo)
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted/30 text-center border-t flex items-center justify-center gap-3">
                <p className="text-sm text-muted-foreground font-medium">
                  {activeMode === 'face' && "Align your face within the frame. AI will automatically recognize you."}
                  {activeMode === 'qr' && "Hold your ID card's QR code steadily in front of the camera."}
                  {activeMode === 'nfc' && "Hold your NFC card or phone against the terminal."}
                  {!activeMode && "Select a check-in method above."}
                </p>
                {cameraUrl && cameraSource === 'ip' && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                    <Wifi className="h-3 w-3" /> IP Camera
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Records Panel */}
        <div className="space-y-4">
          <Card className="border-0 shadow-lg ring-1 ring-border/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Today&apos;s Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <UserCheck className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No check-ins yet today</p>
                </div>
              ) : (
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {records.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <Avatar className="h-9 w-9 border">
                        <AvatarImage src={getImageUrl(r.user?.avatar)} />
                        <AvatarFallback className="text-xs">{r.user?.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.user?.name || 'Unknown'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${methodColors[r.method] || ''}`}>
                            {methodIcons[r.method]} {r.method.toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            r.status === 'Out' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                          }`}>
                            {r.status === 'Out' ? 'OUT' : 'IN'}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{r.attendance_time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
