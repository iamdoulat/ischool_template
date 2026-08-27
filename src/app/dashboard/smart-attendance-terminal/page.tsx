"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import * as faceapi from "face-api.js";
import jsQR from "jsqr";
import {
  ScanFace, ScanLine, Smartphone, Loader2, CheckCircle2, AlertCircle,
  Clock, UserCheck, QrCode, SmartphoneNfc, RefreshCw, Camera, Wifi, WifiOff,
  Maximize2, Minimize2, Sparkles, Activity, ShieldCheck, Search,
  ArrowRight, Users, Check, Volume2, VolumeX, Flame, Zap, CheckCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useImageUrl } from "@/lib/image-url";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  name: string;
  role: string;
  avatar: string | null;
  admission_no?: string;
  staff_id?: string;
  school_class?: { id: number; name: string };
  section?: { id: number; name: string };
  face_descriptor?: any;
  qr_code?: string | null;
  nfc_uid?: string | null;
}

interface Record {
  id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    role: string;
    avatar: string | null;
    admission_no?: string;
    staff_id?: string;
  };
  attendance_date: string;
  attendance_time: string;
  method: 'face' | 'qr' | 'nfc' | 'zkteco' | 'manual';
  status?: string;
}

interface SmartSettings {
  is_face_enabled: boolean;
  is_qr_enabled: boolean;
  is_nfc_enabled: boolean;
}

interface QrSettings {
  use_camera_device?: boolean;
  use_sensor_device?: boolean;
  ip_camera_url?: string;
  ip_camera_brand?: string;
  ip_camera_rtsp_transport?: string;
  ip_camera_auth_enabled?: boolean;
  ip_camera_username?: string;
  ip_camera_password?: string;
  camera_type?: string;
}

type Mode = 'face' | 'qr' | 'nfc' | 'manual';
type CameraSource = 'webcam' | 'ip' | null;

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
  const { t } = useTranslation();
  const getImageUrl = useImageUrl();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraImgRef = useRef<HTMLImageElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

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
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraUrl, setCameraUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [activeMode, setActiveMode] = useState<Mode>('qr');
  const [users, setUsers] = useState<User[]>([]);
  const [labeledDescriptors, setLabeledDescriptors] = useState<faceapi.LabeledFaceDescriptors[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [recordSearch, setRecordSearch] = useState("");
  const [manualSearch, setManualSearch] = useState("");

  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isWebcamPlaying, setIsWebcamPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [matchStatus, setMatchStatus] = useState<string>("In");
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

  const fetchRecords = useCallback(async () => {
    try {
      const res = await api.get('/smart-attendance/records?limit=50');
      setRecords(res.data?.data?.data || res.data?.data || []);
    } catch { /* silent */ }
  }, []);

  // 1. Initialize Terminal Settings & Users
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

        if (qrRes) {
          const qData = qrRes.data?.data || qrRes.data;
          setQrSettings(qData);
          const initialFacing = qData?.camera_type === 'secondary' ? 'user' : 'environment';
          setFacingMode(initialFacing);
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
          if (u.admission_no) qrMap.set(String(u.admission_no), u);
          if (u.staff_id) qrMap.set(String(u.staff_id), u);
          if (u.id) qrMap.set(String(u.id), u);
          if (u.nfc_uid) nfcMap.set(u.nfc_uid, u);
        }
        qrLookup.current = qrMap;
        nfcLookup.current = nfcMap;

        fetchRecords();
      } catch (err) {
        console.error("Initialization error:", err);
        toast.error(t("failed_to_initialize_terminal"));
      }
    };
    init();
  }, [fetchRecords, t]);

  useEffect(() => {
    if (!settings) return;
    const interval = setInterval(fetchRecords, 10000);
    return () => clearInterval(interval);
  }, [settings, fetchRecords]);

  // 2. Load Face Models
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
      } catch (error) {
        console.error("Face model error:", error);
      }
    };
    loadModels();
  }, [settings, activeMode]);

  useEffect(() => {
    if (isModelsLoaded && users.length > 0) {
      const descriptors = users
        .filter(u => u.face_descriptor)
        .map(u => {
          try {
            const desc = typeof u.face_descriptor === 'string' ? JSON.parse(u.face_descriptor) : u.face_descriptor;
            if (Array.isArray(desc) && desc.length === 128) {
              return new faceapi.LabeledFaceDescriptors(String(u.id), [new Float32Array(desc)]);
            }
          } catch {}
          return null;
        })
        .filter(Boolean) as faceapi.LabeledFaceDescriptors[];

      setLabeledDescriptors(descriptors);
    }
  }, [isModelsLoaded, users]);

  // 3. Camera Controls (Webcam / Mobile Front & Back Cameras)
  const startWebcam = async (retries = 3, forcedFacing?: 'environment' | 'user') => {
    stopWebcam();
    const targetFacing = forcedFacing || facingMode;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacing, width: { ideal: 1280 }, height: { ideal: 720 } }
          });
        } catch {
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 400 * attempt));
            stream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
          }
        }
        if (stream && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setCameraSource('webcam');
          setIsWebcamPlaying(true);
          setCameraError(false);
          return;
        }
      } catch (err) {
        console.error(`Webcam attempt ${attempt}/${retries} failed:`, err);
      }
    }
    toast.error(t("could_not_access_camera_after_attempts"));
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
      setIsWebcamPlaying(false);
    }
  };

  const toggleFacingMode = () => {
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    startWebcam(3, nextFacing);
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
  }, [activeMode, cameraUrl]);

  // 4. Attendance Recording
  const playAudio = (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    const audio = new Audio(type === 'success' ? '/sounds/success.mp3' : '/sounds/error.mp3');
    audio.play().catch(() => {});
  };

  const markAttendance = async (userId: number, method: 'face' | 'qr' | 'nfc' | 'manual') => {
    if (processingRef.current) return;
    setIsProcessing(true);
    try {
      const res = await api.post('/smart-attendance/mark', { user_id: userId, method });
      const data = res.data?.data?.data || res.data?.data;
      const alreadyMarked = data?.already_marked;
      const status = data?.status || "In";
      const userData = data?.user;
      const time = data?.time;
      const user = users.find(u => u.id === userId);
      const displayUser = userData ? { ...user, name: userData.name, role: userData.role, avatar: userData.avatar } : user;

      if (displayUser) {
        setMatchedUser(displayUser);
        setMatchStatus(status);
        const message = alreadyMarked
          ? t("already_recorded_at", { name: displayUser.name, time })
          : `${status === 'Out' ? 'Exit Recorded' : 'Entry Recorded'} for ${displayUser.name}`;
        setMatchMessage(message);
        toast.success(message);
        playAudio('success');
        fetchRecords();
        setTimeout(() => {
          setMatchedUser(null);
          setIsProcessing(false);
        }, 3200);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || t("failed_to_mark_attendance"));
      playAudio('error');
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  // 5. Frame Processor
  const matchedUserRef = useRef(matchedUser);
  matchedUserRef.current = matchedUser;

  const processFrame = useCallback(async () => {
    if (processingRef.current || matchedUserRef.current || frameBusyRef.current) return;
    frameBusyRef.current = true;
    try {
      if (activeMode === 'face' && isModelsLoaded && labeledDescriptors.length > 0) {
        const source = cameraSource === 'ip' ? cameraImgRef.current : videoRef.current;
        if (!source) return;
        const displaySize = {
          width: (source as any).videoWidth || (source as HTMLImageElement).naturalWidth || 640,
          height: (source as any).videoHeight || (source as HTMLImageElement).naturalHeight || 480
        };
        if (displaySize.width === 0 || displaySize.height === 0) return;
        if (canvasRef.current) faceapi.matchDimensions(canvasRef.current, displaySize);

        const detection = await faceapi.detectSingleFace(source, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
        if (detection && canvasRef.current) {
          const resized = faceapi.resizeResults(detection, displaySize);
          const ctx = canvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          faceapi.draw.drawDetections(canvasRef.current, resized);

          const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.55);
          const match = faceMatcher.findBestMatch(detection.descriptor);
          if (match.label !== 'unknown' && match.distance < 0.55) {
            markAttendance(parseInt(match.label), 'face');
          }
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
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            imageData = ctx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
          }
        } else if (videoRef.current && isWebcamPlaying) {
          tmpCanvas.width = videoRef.current.videoWidth;
          tmpCanvas.height = videoRef.current.videoHeight;
          const ctx = tmpCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            imageData = ctx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
          }
        }
        if (imageData) {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            let qrCodeValue: string | null = null;
            try {
              const parsed = JSON.parse(code.data);
              qrCodeValue = parsed.qr_code || parsed.id || parsed.user_id || parsed.admission_no;
            } catch {
              qrCodeValue = code.data;
            }
            if (qrCodeValue) {
              let matched = qrLookup.current.get(qrCodeValue);
              if (!matched) {
                try {
                  const lookupRes = await api.post('/smart-attendance/lookup-by-qr', { qr_code: qrCodeValue });
                  if (lookupRes.data?.success && lookupRes.data?.data) {
                    matched = lookupRes.data.data;
                    qrLookup.current.set(qrCodeValue, matched);
                  }
                } catch {}
              }
              if (matched) {
                markAttendance(matched.id, 'qr');
              }
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

  // Scanner interval
  useEffect(() => {
    if (!isWebcamPlaying) return;
    const interval = setInterval(processFrame, activeMode === 'face' ? 250 : 400);
    return () => clearInterval(interval);
  }, [isWebcamPlaying, activeMode, processFrame]);

  // IP Camera Polling & Auto-reconnect
  useEffect(() => {
    if (cameraSource !== 'ip' || !cameraUrl) return;
    const t = setInterval(() => setIpCamTick(n => n + 1), 1500);
    return () => clearInterval(t);
  }, [cameraSource, cameraUrl]);

  useEffect(() => {
    if (cameraSource !== 'ip' || !cameraError) return;
    const delay = Math.min(1500 * Math.pow(1.5, reconnectAttempt), 12000);
    const timer = setTimeout(() => {
      setCameraError(false);
      setIpCamTick(n => n + 1);
      setReconnectAttempt(n => n + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [cameraSource, cameraError, reconnectAttempt]);

  // Web NFC Reader
  useEffect(() => {
    if (activeMode !== 'nfc') return;
    if (!('NDEFReader' in window)) return;
    let ndef: any;
    try {
      ndef = new (window as any).NDEFReader();
      ndef.scan().then(() => {
        ndef.onreading = (event: any) => {
          if (processingRef.current || matchedUserRef.current) return;
          const serialNumber: string = event.serialNumber;
          const matched = nfcLookup.current.get(serialNumber);
          if (matched) markAttendance(matched.id, 'nfc');
          else toast.error(t("no_user_found_for_nfc_tag"));
        };
      }).catch(() => {});
    } catch {}
    return () => {
      try {
        if (ndef) ndef.onreading = null;
      } catch {}
    };
  }, [activeMode, t]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    if (!recordSearch) return records;
    const q = recordSearch.toLowerCase();
    return records.filter(r =>
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.role?.toLowerCase().includes(q) ||
      r.user?.admission_no?.toLowerCase().includes(q) ||
      r.user?.staff_id?.toLowerCase().includes(q)
    );
  }, [records, recordSearch]);

  // Filtered manual users
  const filteredManualUsers = useMemo(() => {
    if (!manualSearch) return users.slice(0, 6);
    const q = manualSearch.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.admission_no?.toLowerCase().includes(q) ||
      u.staff_id?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [users, manualSearch]);

  // Metrics
  const metrics = useMemo(() => {
    const todayTotal = records.length;
    const inCount = records.filter(r => r.status !== 'Out').length;
    const outCount = records.filter(r => r.status === 'Out').length;
    const qrCount = records.filter(r => r.method === 'qr').length;
    const faceCount = records.filter(r => r.method === 'face').length;
    return { todayTotal, inCount, outCount, qrCount, faceCount };
  }, [records]);

  if (!settings) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
          <div className="h-6 w-60 rounded bg-gray-200" />
          <div className="h-3 w-40 rounded bg-gray-100 mt-2" />
        </div>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] space-y-6 max-w-7xl mx-auto px-4 py-4 sm:py-6 font-sans">
      {/* Top Banner with Gradient & Live Clock */}
      <div className="rounded-2xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F8F9FE] to-[#EFF0FD]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                Smart Attendance Terminal
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Live AI Kiosk
                </span>
              </h1>
              <p className="text-[11px] text-gray-500 mt-1">
                Integrated Face Vision, Fast QR Scanner, NFC Radar, and Device Attendance Terminal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Live Clock Badge */}
            <div className="bg-white/90 border border-indigo-100 px-3.5 py-1.5 rounded-xl shadow-sm text-right flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-slate-800 tracking-wider font-mono">{currentTimeStr}</p>
                <p className="text-[9px] text-slate-400 font-medium">Automatic Check-In System</p>
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                "p-2 rounded-xl border transition-all shadow-sm",
                soundEnabled ? "bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50" : "bg-slate-100 text-slate-400 border-slate-200"
              )}
              title={soundEnabled ? "Mute audio cues" : "Unmute audio cues"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today Punches</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{metrics.todayTotal}</h3>
          </div>
          <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Activity className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present / In</p>
            <h3 className="text-xl font-black text-emerald-600 mt-0.5">{metrics.inCount}</h3>
          </div>
          <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exits / Out</p>
            <h3 className="text-xl font-black text-amber-600 mt-0.5">{metrics.outCount}</h3>
          </div>
          <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Flame className="w-5 h-5" />
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Face / QR Match</p>
            <h3 className="text-xl font-black text-blue-600 mt-0.5">{metrics.faceCount + metrics.qrCount}</h3>
          </div>
          <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Camera / Scanner Terminal View */}
        <div className="lg:col-span-8 space-y-4">
          {/* Mode Selector Tabs */}
          <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200 shadow-sm w-full">
            {settings.is_qr_enabled && (
              <button
                onClick={() => setActiveMode('qr')}
                className={cn(
                  "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                  activeMode === 'qr'
                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <ScanLine className="h-4 w-4" /> QR Code Scanner
              </button>
            )}

            {settings.is_face_enabled && (
              <button
                onClick={() => setActiveMode('face')}
                className={cn(
                  "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                  activeMode === 'face'
                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <ScanFace className="h-4 w-4" /> AI Face Vision
              </button>
            )}

            {settings.is_nfc_enabled && (
              <button
                onClick={() => setActiveMode('nfc')}
                className={cn(
                  "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                  activeMode === 'nfc'
                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <SmartphoneNfc className="h-4 w-4" /> NFC / RFID Tap
              </button>
            )}

            <button
              onClick={() => setActiveMode('manual')}
              className={cn(
                "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                activeMode === 'manual'
                  ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Search className="h-4 w-4" /> Manual Check-In
            </button>
          </div>

          {/* Terminal Viewport Container */}
          <Card className="w-full overflow-hidden shadow-xl border border-slate-200/80 rounded-2xl bg-black">
            <CardContent className="p-0">
              <div ref={fullscreenRef} className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden min-h-[380px]">
                {/* Instant Verification Overlay Card */}
                {matchedUser && (
                  <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 animate-in fade-in zoom-in duration-300">
                    <div className="relative mb-4">
                      <Avatar className="h-28 w-28 border-4 border-emerald-400 shadow-2xl">
                        <AvatarImage src={getImageUrl(matchedUser.avatar)} className="object-cover" />
                        <AvatarFallback className="text-3xl font-black bg-emerald-600 text-white">
                          {matchedUser.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg animate-bounce">
                        <CheckCircle2 className="h-6 w-6" />
                      </span>
                    </div>

                    <span className={cn(
                      "px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider mb-1",
                      matchStatus === 'Out' ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    )}>
                      {matchStatus === 'Out' ? 'Exit Recorded 🟡' : 'Entry Recorded 🟢'}
                    </span>

                    <h2 className="text-2xl font-black tracking-tight text-white">{matchedUser.name}</h2>
                    <p className="text-xs text-slate-300 mt-0.5 font-medium">
                      {matchedUser.role} • {matchedUser.role === 'Student' ? `Roll/Admission: ${matchedUser.admission_no || 'N/A'}` : `ID: ${matchedUser.staff_id || 'N/A'}`}
                    </p>
                    <p className="text-sm font-bold text-emerald-400 mt-3 animate-pulse">{matchMessage}</p>
                  </div>
                )}

                {/* Top-Right Control Actions */}
                <div className="absolute top-3 right-3 z-40 flex items-center gap-2">
                  {cameraSource === 'ip' ? (
                    <button
                      onClick={() => { setCameraError(false); setReconnectAttempt(0); setIpCamTick(n => n + 1); }}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/60 text-white/80 hover:bg-black/90 hover:text-white transition-all backdrop-blur-sm"
                      title={t("refresh_camera")}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  ) : isWebcamPlaying && (
                    <button
                      onClick={toggleFacingMode}
                      className="px-3 py-1.5 rounded-xl bg-black/60 text-white/90 text-xs font-bold flex items-center gap-1.5 hover:bg-black/90 transition-all backdrop-blur-sm shadow border border-white/10"
                      title="Switch between front and back camera"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>{facingMode === 'user' ? 'Front Cam 🤳' : 'Back Cam 📷'}</span>
                    </button>
                  )}

                  <button
                    onClick={toggleFullscreen}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-black/60 text-white/80 hover:bg-black/90 hover:text-white transition-all backdrop-blur-sm"
                    title={isFullscreen ? t("exit_fullscreen") : t("fullscreen")}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </div>

                {/* Active Mode Streams */}
                {(activeMode === 'face' || activeMode === 'qr') && (
                  <>
                    {cameraSource === 'ip' && cameraUrl ? (
                      <>
                        <img
                          ref={cameraImgRef}
                          crossOrigin="anonymous"
                          src={`${cameraUrl}&_t=${ipCamTick}`}
                          className="w-full h-full object-cover"
                          alt="IP Camera"
                          onLoad={handleIpCamLoad}
                          onError={() => setCameraError(true)}
                        />
                        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none" />
                        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/10">
                          {cameraError ? <WifiOff className="h-3 w-3 text-rose-400" /> : <Wifi className="h-3 w-3 text-emerald-400" />}
                          {cameraError ? t("reconnecting") : "IP Camera Stream"}
                        </div>
                      </>
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className={cn("w-full h-full object-cover", facingMode === 'user' && "scale-x-[-1]")}
                        />
                        <canvas
                          ref={canvasRef}
                          className={cn("absolute top-0 left-0 w-full h-full object-cover pointer-events-none", facingMode === 'user' && "scale-x-[-1]")}
                        />
                        {!isWebcamPlaying && !matchedUser && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 bg-slate-950 p-6 text-center space-y-3">
                            <Camera className="h-10 w-10 opacity-50 text-indigo-400" />
                            <div>
                              <p className="text-base font-bold text-white">Camera Feed Standby</p>
                              <p className="text-xs text-slate-400 mt-1">Allow camera access or click below to turn on the camera</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => startWebcam(3, facingMode)}
                              className="h-8 text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white gap-1.5 shadow"
                            >
                              <Camera className="w-3.5 h-3.5" /> Turn On Camera
                            </Button>
                          </div>
                        )}
                      </>
                    )}

                    {/* QR Bracket Matrix Overlay with glowing laser */}
                    {activeMode === 'qr' && !cameraError && (
                      <div className="absolute inset-0 border-[50px] border-black/35 pointer-events-none flex items-center justify-center">
                        <div className="w-56 h-56 border-2 border-indigo-400/80 rounded-2xl relative overflow-hidden shadow-2xl">
                          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-indigo-400" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-indigo-400" />
                          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-indigo-400" />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-indigo-400" />
                          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse"
                            style={{ top: '50%', animation: 'bounce 2s ease-in-out infinite' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Face Recognition Oval Alignment Overlay */}
                    {activeMode === 'face' && isModelsLoaded && !cameraError && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-48 h-64 border-2 border-dashed border-blue-400/70 rounded-[80px] shadow-2xl" />
                      </div>
                    )}
                  </>
                )}

                {/* NFC Radar Tap Mode */}
                {activeMode === 'nfc' && (
                  <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-white p-8">
                    <div className="relative flex items-center justify-center h-44 w-44 rounded-full border-4 border-purple-500/30 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
                      <SmartphoneNfc className="h-16 w-16 text-purple-400 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black mb-1">NFC / Smart RFID Radar Active</h3>
                    <p className="text-slate-400 text-center max-w-sm text-xs">
                      Hold institutional student or staff NFC ID card near reader
                    </p>
                  </div>
                )}

                {/* Manual Search Mode */}
                {activeMode === 'manual' && (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white p-6 overflow-y-auto">
                    <div className="max-w-md w-full space-y-4">
                      <div className="text-center space-y-1">
                        <h3 className="text-base font-bold">Manual Fast Check-In</h3>
                        <p className="text-xs text-slate-400">Search by student or staff name, roll number, or ID</p>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Type student name or ID..."
                          value={manualSearch}
                          onChange={e => setManualSearch(e.target.value)}
                          className="pl-9 h-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {filteredManualUsers.map(user => (
                          <div
                            key={user.id}
                            className="p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 flex items-center justify-between transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={getImageUrl(user.avatar)} />
                                <AvatarFallback className="text-xs font-bold text-slate-700">{user.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-bold text-white">{user.name}</p>
                                <p className="text-[10px] text-slate-400">{user.role} • {user.role === 'Student' ? `Roll: ${user.admission_no || 'N/A'}` : `ID: ${user.staff_id || 'N/A'}`}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => markAttendance(user.id, 'manual')}
                              disabled={isProcessing}
                              className="h-7 text-[10px] font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white px-2.5"
                            >
                              Check-In
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Viewport Footer Bar */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 px-4">
                <div className="flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {activeMode === 'face' && "Face Recognition Active (0.55 match threshold)"}
                    {activeMode === 'qr' && "High-speed QR Code Detection Running"}
                    {activeMode === 'nfc' && "Web NFC / USB RFID Bridge Connected"}
                    {activeMode === 'manual' && "Manual Search Directory Active"}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">
                  {cameraSource === 'ip' ? 'IP Camera' : `Device Camera (${facingMode === 'user' ? 'Front' : 'Rear'})`}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 4 Cols: Today's Live Attendance Feed */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border border-slate-200/80 shadow-md rounded-2xl h-full flex flex-col">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                Live Attendance Feed
              </CardTitle>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredRecords.length} Punches
              </span>
            </CardHeader>

            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="Filter today's logs..."
                  value={recordSearch}
                  onChange={e => setRecordSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-white border-slate-200"
                />
              </div>
            </div>

            <CardContent className="p-0 flex-1 overflow-hidden">
              {filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center px-4">
                  <UserCheck className="h-10 w-10 mb-2 opacity-30 text-indigo-400" />
                  <p className="text-xs font-bold text-slate-600">No Check-Ins Found</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Scanned punches will appear here in real-time.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                  {filteredRecords.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/80 transition-colors">
                      <Avatar className="h-9 w-9 border border-slate-200">
                        <AvatarImage src={getImageUrl(r.user?.avatar)} className="object-cover" />
                        <AvatarFallback className="text-xs font-bold text-slate-600 bg-slate-100">
                          {r.user?.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-800 truncate">{r.user?.name || "Unknown"}</p>
                          <span className="text-[10px] font-mono text-slate-400">{r.attendance_time}</span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {r.user?.role || "Student"}
                          </span>
                          <span className={cn(
                            "px-1.5 py-0.2 rounded text-[9px] font-bold",
                            r.status === 'Out' ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                          )}>
                            {r.status === 'Out' ? 'Exit (Out)' : 'Entry (In)'}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            • {r.method === 'face' ? '👤 Face' : r.method === 'qr' ? '📱 QR' : r.method === 'nfc' ? '💳 NFC' : '⚡ Auto'}
                          </span>
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
