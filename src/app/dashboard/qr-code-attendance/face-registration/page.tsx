"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  UserCheck, Camera, ShieldAlert, Loader2, Search,
  CheckCircle, AlertCircle, RefreshCw, Sparkles, Upload, Wifi,
  ScanFace, UserCheck2, Trash2, CheckCircle2, ShieldCheck,
  Smartphone, User, Cpu, HardDrive, ArrowDownToLine, Activity,
  Layers, Settings2, ExternalLink
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as faceapi from "face-api.js";
import { useImageUrl } from "@/lib/image-url";

interface RegisteredUser {
  id: number;
  name: string;
  role: string;
  admission_no?: string;
  staff_id?: string;
  avatar?: string;
  has_face: boolean;
  face_descriptor?: any;
}

interface QrSettings {
  use_camera_device?: boolean;
  camera_type?: string;
  ip_camera_url?: string;
  ip_camera_brand?: string;
  ip_camera_rtsp_transport?: string;
  ip_camera_auth_enabled?: boolean;
  ip_camera_username?: string;
  ip_camera_password?: string;
}

type CaptureMode = 'webcam' | 'ipcam' | 'upload' | null;
type PageMode = 'register' | 'verify' | 'zkteco';

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

export default function FaceRegistrationPage() {
  const getImageUrl = useImageUrl();
  const { t } = useTranslation();

  const [pageMode, setPageMode] = useState<PageMode>('register');
  const [loadingModels, setLoadingModels] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);

  // Camera & Mobile facingMode states (Default to front/selfie camera)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [removingFace, setRemovingFace] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [qrSettings, setQrSettings] = useState<QrSettings | null>(null);
  const [cameraUrl, setCameraUrl] = useState<string | null>(null);
  const [ipCamTick, setIpCamTick] = useState(0);

  // Verification Mode State
  const [registeredFaces, setRegisteredFaces] = useState<RegisteredUser[]>([]);
  const [verifiedUser, setVerifiedUser] = useState<{
    user: RegisteredUser;
    confidence: number;
  } | null>(null);
  const [markingAttendance, setMarkingAttendance] = useState(false);

  // ZKTeco Hardware Face Devices State
  const [zkDevices, setZkDevices] = useState<any[]>([]);
  const [zkLogs, setZkLogs] = useState<any[]>([]);
  const [zkSummary, setZkSummary] = useState<any>({
    total_devices: 0,
    online_devices: 0,
    today_punches: 0,
    matched_punches: 0,
    match_rate: 100,
  });
  const [fetchingZkData, setFetchingZkData] = useState(false);
  const [pullingZkData, setPullingZkData] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraImgRef = useRef<HTMLImageElement | null>(null);
  const uploadImgRef = useRef<HTMLImageElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectIntervalRef = useRef<any>(null);
  const descriptorRef = useRef<Float32Array | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const faceMatcherRef = useRef<faceapi.FaceMatcher | null>(null);

  // Load AI models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setLoadingModels(true);
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setLoadingModels(false);
      } catch (error) {
        console.error("Error loading models:", error);
        toast.error(t("failed_to_load_ai_models"));
        setLoadingModels(false);
      }
    };
    loadModels();
    return () => stopCamera();
  }, []);

  // Search users
  const searchUsers = async (query = searchQuery, role = roleFilter) => {
    setSearching(true);
    try {
      const res = await api.get("/attendance/face-users", {
        params: {
          search: query || undefined,
          role: role === "all" ? undefined : role,
        },
      });
      if (res.data?.data) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter]);

  // Load registered faces for verification matcher
  const loadRegisteredFaces = async () => {
    try {
      const res = await api.get('/attendance/face-descriptors');
      const list = res.data?.data || [];
      setRegisteredFaces(list);

      const labeled = list.map((u: any) => {
        try {
          const desc = typeof u.face_descriptor === 'string' ? JSON.parse(u.face_descriptor) : u.face_descriptor;
          if (Array.isArray(desc) && desc.length === 128) {
            return new faceapi.LabeledFaceDescriptors(String(u.id), [new Float32Array(desc)]);
          }
        } catch {}
        return null;
      }).filter(Boolean) as faceapi.LabeledFaceDescriptors[];

      if (labeled.length > 0) {
        faceMatcherRef.current = new faceapi.FaceMatcher(labeled, 0.6);
      } else {
        faceMatcherRef.current = null;
      }
    } catch (e) {
      console.error("Failed to load registered face descriptors", e);
    }
  };

  useEffect(() => {
    loadRegisteredFaces();
  }, []);

  // Fetch ZKTeco devices, logs and summary
  const fetchZkData = async () => {
    setFetchingZkData(true);
    try {
      const [devRes, logRes, sumRes] = await Promise.all([
        api.get('/zkteco/devices').catch(() => ({ data: { data: [] } })),
        api.get('/zkteco/logs', { params: { limit: 15 } }).catch(() => ({ data: { data: [] } })),
        api.get('/zkteco/summary').catch(() => ({ data: { data: {} } })),
      ]);
      setZkDevices(devRes.data?.data || []);
      setZkLogs(logRes.data?.data || []);
      if (sumRes.data?.data) setZkSummary(sumRes.data.data);
    } catch (e) {
      console.error("Failed to fetch ZKTeco data", e);
    } finally {
      setFetchingZkData(false);
    }
  };

  useEffect(() => {
    if (pageMode === 'zkteco') {
      fetchZkData();
    }
  }, [pageMode]);

  // Pull latest ZKTeco attendance logs
  const handlePullZkLogs = async () => {
    setPullingZkData(true);
    try {
      if (zkDevices.length === 0) {
        toast.error("No ZKTeco face devices found. Please configure in Settings.");
        return;
      }
      for (const dev of zkDevices) {
        await api.post(`/zkteco/devices/${dev.id}/pull`).catch(() => {});
      }
      await fetchZkData();
      toast.success("Synchronized and processed latest ZKTeco Face logs.");
    } catch (e) {
      toast.error("Failed to pull ZKTeco Face data.");
    } finally {
      setPullingZkData(false);
    }
  };

  // Fetch QR attendance settings for camera config
  useEffect(() => {
    api.get('/attendance/qr-settings').then(res => {
      const data = res.data?.data || res.data;
      if (data) {
        setQrSettings(data);
        if (data.use_camera_device && data.ip_camera_url) {
          const proxyUrl = buildCameraProxyUrl(data);
          if (proxyUrl) setCameraUrl(proxyUrl);
        }
      }
    }).catch(() => {});
  }, []);

  // Poll IP camera feed every 2s if in IP camera mode
  useEffect(() => {
    if (captureMode !== 'ipcam') return;
    const t = setInterval(() => setIpCamTick(n => n + 1), 2000);
    return () => clearInterval(t);
  }, [captureMode]);

  // Camera Management (Webcam / Mobile Phone Front & Rear Cameras)
  const startCamera = async (targetFacing: "user" | "environment" = facingMode) => {
    stopCamera();
    setCaptureMode('webcam');
    setIsCameraActive(true);

    const tryGetUserMedia = async (constraints: MediaStreamConstraints): Promise<MediaStream | null> => {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        return null;
      }
    };

    // Attempt 1: Targeted facingMode (front selfie camera or back camera) with ideal dimensions
    let stream = await tryGetUserMedia({
      video: {
        facingMode: targetFacing,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    // Attempt 2: Fallback to simple facingMode
    if (!stream) {
      stream = await tryGetUserMedia({ video: { facingMode: targetFacing } });
    }

    // Attempt 3: General fallback
    if (!stream) {
      stream = await tryGetUserMedia({ video: true });
    }

    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          startFaceDetectionLoop(videoRef.current!);
        };
      }
      return;
    }

    if (cameraUrl) {
      setCaptureMode('ipcam');
      return;
    }

    toast.error(t("no_camera_found_use_photo_upload"));
    setIsCameraActive(false);
    setCaptureMode(null);
  };

  const toggleFacingMode = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  };

  const stopCamera = () => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    cameraImgRef.current = null;
    uploadImgRef.current = null;
    setFaceDetected(false);
    descriptorRef.current = null;
    setIsCameraActive(false);
    setVerifiedUser(null);
    if (canvasRef.current) {
      canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Face Detection and Verification Loop
  const startFaceDetectionLoop = (source: HTMLVideoElement | HTMLImageElement) => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);

    detectIntervalRef.current = setInterval(async () => {
      try {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const displaySize = {
          width: (source as HTMLVideoElement).videoWidth || (source as HTMLImageElement).naturalWidth || 640,
          height: (source as HTMLVideoElement).videoHeight || (source as HTMLImageElement).naturalHeight || 480,
        };
        if (displaySize.width === 0 || displaySize.height === 0) return;
        if (canvas.width !== displaySize.width) {
          canvas.width = displaySize.width;
          canvas.height = displaySize.height;
        }
        faceapi.matchDimensions(canvas, displaySize);

        const detection = await faceapi.detectSingleFace(source).withFaceLandmarks().withFaceDescriptor();
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          setFaceDetected(true);
          descriptorRef.current = detection.descriptor;
          const resized = faceapi.resizeResults(detection, displaySize);
          const box = resized.detection.box;

          if (pageMode === 'verify' && faceMatcherRef.current) {
            const bestMatch = faceMatcherRef.current.findBestMatch(detection.descriptor);
            if (bestMatch.label !== 'unknown') {
              const matchedId = Number(bestMatch.label);
              const foundUser = registeredFaces.find(u => u.id === matchedId) || users.find(u => u.id === matchedId);
              const confidence = Math.round((1 - bestMatch.distance) * 100);

              if (foundUser) {
                setVerifiedUser({
                  user: foundUser,
                  confidence: Math.max(confidence, 70),
                });
              }

              if (ctx) {
                ctx.strokeStyle = "#10B981";
                ctx.lineWidth = 3;
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                ctx.fillStyle = "#10B981";
                ctx.font = "bold 14px Inter, sans-serif";
                ctx.fillText(`✓ ${foundUser?.name || 'Verified'} (${confidence}%)`, box.x, Math.max(box.y - 10, 20));
              }
            } else {
              setVerifiedUser(null);
              if (ctx) {
                ctx.strokeStyle = "#EF4444";
                ctx.lineWidth = 2;
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                ctx.fillStyle = "#EF4444";
                ctx.font = "12px Inter, sans-serif";
                ctx.fillText("Unrecognized Face", box.x, Math.max(box.y - 10, 20));
              }
            }
          } else {
            // Register Mode
            if (ctx) {
              ctx.strokeStyle = "#6366F1";
              ctx.lineWidth = 3;
              ctx.strokeRect(box.x, box.y, box.width, box.height);
              ctx.fillStyle = "#6366F1";
              ctx.font = "bold 13px Inter, sans-serif";
              ctx.fillText(t("face_ready_for_registration") || "Face In Focus - Ready to Save", box.x, Math.max(box.y - 10, 20));
            }
          }
        } else {
          setFaceDetected(false);
          descriptorRef.current = null;
          if (pageMode === 'verify') setVerifiedUser(null);
        }
      } catch {
        /* ignore frame processing glitches */
      }
    }, 250);
  };

  // Upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      stopCamera();
      setUploadedImage(dataUrl);
      setCaptureMode('upload');
      setIsCameraActive(true);
    };
    reader.readAsDataURL(file);
  };

  const clearUpload = () => {
    setUploadedImage(null);
    setCaptureMode(null);
    setIsCameraActive(false);
    setFaceDetected(false);
    descriptorRef.current = null;
    uploadImgRef.current = null;
    setVerifiedUser(null);
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (canvasRef.current) canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // Register face to DB
  const handleRegisterFace = async () => {
    if (!selectedUser) {
      toast.error(t("select_person_first"));
      return;
    }
    if (!descriptorRef.current) {
      toast.error(t("no_face_detected"));
      return;
    }
    setCapturing(true);
    try {
      const descriptorArray = Array.from(descriptorRef.current);
      const res = await api.post("/attendance/face-register", {
        user_id: selectedUser.id,
        face_descriptor: descriptorArray,
      });
      if (res.data?.success) {
        toast.success(res.data.message || t("face_registered_successfully"));
        const updated = { ...selectedUser, has_face: true, face_descriptor: descriptorArray };
        setSelectedUser(updated);
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? updated : u));
        loadRegisteredFaces();
        clearUpload();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("failed_to_register_face"));
    } finally {
      setCapturing(false);
    }
  };

  // Remove face biometric data
  const handleRemoveFace = async () => {
    if (!selectedUser) return;
    if (!confirm(`Are you sure you want to remove face biometric data for ${selectedUser.name}?`)) return;

    setRemovingFace(true);
    try {
      const res = await api.post("/attendance/face-remove", { user_id: selectedUser.id });
      if (res.data?.success) {
        toast.success(res.data.message || "Face data removed.");
        const updated = { ...selectedUser, has_face: false, face_descriptor: undefined };
        setSelectedUser(updated);
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? updated : u));
        loadRegisteredFaces();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove face data");
    } finally {
      setRemovingFace(false);
    }
  };

  // Mark attendance for verified user
  const handleMarkAttendance = async (userId: number) => {
    setMarkingAttendance(true);
    try {
      const res = await api.post('/attendance/qr-scan', { code: String(userId) });
      toast.success(`Attendance ${res.data.status || 'marked'} for ${res.data.user?.name || 'user'}`);
      const audio = new Audio('/sounds/success.mp3');
      audio.play().catch(() => {});
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark attendance");
      const audio = new Audio('/sounds/error.mp3');
      audio.play().catch(() => {});
    } finally {
      setMarkingAttendance(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header with Mode Switcher */}
      <div className="rounded-2xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-800 leading-tight">
                {pageMode === 'register'
                  ? t("ai_biometric_face_registration")
                  : pageMode === 'verify'
                    ? "Mobile Front Camera Face Verification"
                    : "ZKTeco Face Attendance Device System"}
              </h1>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {pageMode === 'register'
                  ? "Enroll student & staff facial geometry using mobile phone front camera or photo upload."
                  : pageMode === 'verify'
                    ? "Live real-time facial verification & attendance matching via mobile front camera."
                    : "Live ZKTeco Visible Light Face Recognition (SpeedFace / ProFace / uFace) ADMS push integration."}
              </p>
            </div>
          </div>

          {/* 3-Way Mode Switcher */}
          <div className="flex bg-white/80 p-1 rounded-xl border border-gray-200 shadow-sm self-start sm:self-auto gap-1">
            <button
              onClick={() => { setPageMode('register'); stopCamera(); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                pageMode === 'register'
                  ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Enroll Face
            </button>
            <button
              onClick={() => { setPageMode('verify'); stopCamera(); startCamera('user'); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                pageMode === 'verify'
                  ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <ScanFace className="w-3.5 h-3.5" />
              Verify (Front Cam)
            </button>
            <button
              onClick={() => { setPageMode('zkteco'); stopCamera(); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                pageMode === 'zkteco'
                  ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Cpu className="w-3.5 h-3.5" />
              ZKTeco Face Device
            </button>
          </div>
        </div>
      </div>

      {loadingModels ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
            <div className="h-11 w-full rounded-lg bg-gray-100 animate-pulse" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 w-full rounded-lg bg-gray-100/70 animate-pulse" />)}
            </div>
          </div>
          <div className="lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <div className="aspect-video w-full rounded-2xl bg-gray-100 animate-pulse flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs text-gray-500 font-medium">{t("initializing_ai_framework") || "Loading SSD MobileNet Face AI..."}</p>
            </div>
          </div>
        </div>
      ) : pageMode === 'register' ? (
        /* ================= 1. REGISTRATION (ENROLLMENT) VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: User Directory Search */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-500" />
              {t("select_person")}
            </h2>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={t("search_by_name_id_roll")}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 border-slate-200 focus-visible:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <Button variant={roleFilter === "all" ? "default" : "outline"} onClick={() => setRoleFilter("all")} className="flex-1 h-8 text-xs font-semibold">{t("all")}</Button>
                <Button variant={roleFilter === "Student" ? "default" : "outline"} onClick={() => setRoleFilter("Student")} className="flex-1 h-8 text-xs font-semibold">{t("students")}</Button>
                <Button variant={roleFilter === "Staff" ? "default" : "outline"} onClick={() => setRoleFilter("Staff")} className="flex-1 h-8 text-xs font-semibold">{t("staff")}</Button>
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {searching ? (
                <div className="p-6 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> {t("searching")}
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  {searchQuery ? t("no_matching_users_found") : t("type_above_to_search")}
                </div>
              ) : (
                users.map(user => (
                  <div
                    key={user.id}
                    onClick={() => { setSelectedUser(user); clearUpload(); }}
                    className={cn(
                      "p-3 flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50",
                      selectedUser?.id === user.id && "bg-indigo-50/70 border-l-4 border-indigo-600"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={getImageUrl(user.avatar)} alt={user.name} className="w-9 h-9 rounded-full object-cover border" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 uppercase text-xs">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-slate-800 text-xs leading-snug">{user.name}</h4>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-medium">{user.role}</span>
                          <span>•</span>
                          <span>{user.role === 'Student' ? `${t("reg")}: ${user.admission_no || 'N/A'}` : `ID: ${user.staff_id || 'N/A'}`}</span>
                        </span>
                      </div>
                    </div>
                    {user.has_face ? (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Enrolled
                      </span>
                    ) : (
                      <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-rose-200">
                        <ShieldAlert className="w-3 h-3" /> No Face
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Capture & Enrollment Panel */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-500" />
              {t("ai_face_capture")}
            </h2>

            {!selectedUser ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                <UserCheck className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-700">{t("select_person_first_title") || "Select Person First"}</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">{t("choose_user_from_left_panel") || "Choose a student or staff member from the left list to enroll their face."}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Selected User Details Banner */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedUser.avatar ? (
                      <img src={getImageUrl(selectedUser.avatar)} alt={selectedUser.name} className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                        {selectedUser.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{selectedUser.role}</span>
                      <h3 className="text-sm font-bold text-slate-800 leading-tight">{selectedUser.name}</h3>
                      <p className="text-[11px] text-slate-500">{selectedUser.role === 'Student' ? `Admission No: ${selectedUser.admission_no || 'N/A'}` : `Staff ID: ${selectedUser.staff_id || 'N/A'}`}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedUser.has_face ? (
                      <>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Enrolled
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleRemoveFace}
                          disabled={removingFace}
                          className="h-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 text-xs"
                          title="Remove Face Data"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Not Enrolled
                      </span>
                    )}
                  </div>
                </div>

                {/* Source Selection & Controls */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex gap-2">
                    <Button
                      variant={captureMode === 'webcam' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => startCamera(facingMode)}
                      disabled={isCameraActive && captureMode === 'webcam'}
                      className={cn("h-8 text-xs font-bold gap-1.5", captureMode === 'webcam' && "bg-indigo-600 text-white")}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Mobile / Front Cam
                    </Button>
                    <Button
                      variant={captureMode === 'upload' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className={cn("h-8 text-xs font-bold gap-1.5", captureMode === 'upload' && "bg-indigo-600 text-white")}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {t("upload_photo")}
                    </Button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </div>

                  {/* Flip Lens button for phone */}
                  {isCameraActive && captureMode === 'webcam' && (
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all border border-slate-200"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>{facingMode === 'user' ? 'Front Cam 🤳' : 'Back Cam 📷'}</span>
                    </button>
                  )}
                </div>

                {/* Camera / Upload Viewport */}
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video border border-slate-800 flex items-center justify-center min-h-[300px]">
                  {isCameraActive ? (
                    <>
                      {captureMode === 'webcam' && (
                        <video
                          ref={videoRef}
                          className={cn("w-full h-full object-cover", facingMode === 'user' && "scale-x-[-1]")}
                          playsInline
                          muted
                          autoPlay
                        />
                      )}
                      {captureMode === 'upload' && uploadedImage && (
                        <img
                          ref={uploadImgRef}
                          src={uploadedImage}
                          className="w-full h-full object-contain"
                          alt={t("uploaded")}
                          onLoad={(e) => { uploadImgRef.current = e.currentTarget; startFaceDetectionLoop(e.currentTarget); }}
                        />
                      )}
                      <canvas
                        ref={canvasRef}
                        className={cn("absolute inset-0 w-full h-full object-cover pointer-events-none", facingMode === 'user' && captureMode === 'webcam' && "scale-x-[-1]")}
                      />

                      {/* Status pill overlay */}
                      <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-sm border border-slate-700 px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-2 shadow">
                        <span className={cn("w-2 h-2 rounded-full", faceDetected ? "bg-emerald-400 animate-pulse" : "bg-amber-400")} />
                        {faceDetected ? "Face Aligned - Ready" : "Align face inside frame"}
                      </div>
                    </>
                  ) : (
                    <div className="text-center flex flex-col items-center p-8">
                      <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 text-indigo-400 mb-3 shadow-inner">
                        <Smartphone className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-slate-200 text-sm">Mobile Front Camera Ready</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Click "Mobile / Front Cam" to turn on your front camera and scan facial landmarks.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => startCamera('user')}
                        className="mt-4 h-8 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white font-bold text-xs gap-1.5 shadow"
                      >
                        <Camera className="w-3.5 h-3.5" /> Turn On Front Camera
                      </Button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isCameraActive && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleRegisterFace}
                      disabled={capturing || !faceDetected}
                      className={cn(
                        "flex-1 h-11 font-bold text-xs text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2",
                        faceDetected
                          ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:shadow-indigo-500/20"
                          : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      )}
                    >
                      {capturing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving Biometric Vector...</>
                      ) : (
                        <><UserCheck2 className="w-4 h-4" /> Save Face Biometrics for {selectedUser.name}</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={captureMode === 'upload' ? clearUpload : stopCamera}
                      disabled={capturing}
                      className="h-11 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-semibold"
                    >
                      {captureMode === 'upload' ? t("clear_photo") : t("close_feed")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : pageMode === 'verify' ? (
        /* ================= 2. LIVE FRONT CAMERA VERIFICATION VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Verification Stream Viewport */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ScanFace className="w-4 h-4 text-emerald-600" />
                Live Face Recognition Stream
              </h2>
              {isCameraActive && (
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all border border-slate-200"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>{facingMode === 'user' ? 'Front Cam 🤳' : 'Back Cam 📷'}</span>
                </button>
              )}
            </div>

            <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video border border-slate-800 flex items-center justify-center min-h-[340px]">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    className={cn("w-full h-full object-cover", facingMode === 'user' && "scale-x-[-1]")}
                    playsInline
                    muted
                    autoPlay
                  />
                  <canvas
                    ref={canvasRef}
                    className={cn("absolute inset-0 w-full h-full object-cover pointer-events-none", facingMode === 'user' && "scale-x-[-1]")}
                  />

                  {/* Top Status */}
                  <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-sm border border-slate-700 px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-2 shadow">
                    <span className={cn("w-2 h-2 rounded-full", verifiedUser ? "bg-emerald-400 animate-pulse" : faceDetected ? "bg-amber-400" : "bg-slate-400")} />
                    {verifiedUser ? `Matched: ${verifiedUser.user.name}` : faceDetected ? "Analyzing Facial Match..." : "Position Face in Front Camera"}
                  </div>
                </>
              ) : (
                <div className="text-center flex flex-col items-center p-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 text-emerald-400 mb-3">
                    <ScanFace className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-200 text-sm">Face Verification Offline</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Start the front camera to perform real-time biometric matching against enrolled users.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => startCamera('user')}
                    className="mt-4 h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow"
                  >
                    <Camera className="w-3.5 h-3.5" /> Start Front Camera Verification
                  </Button>
                </div>
              )}
            </div>

            {isCameraActive && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopCamera}
                  className="w-full h-9 border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  Stop Camera Stream
                </Button>
              </div>
            )}
          </div>

          {/* Right: Verification Match Result Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verification Result
            </h2>

            {verifiedUser ? (
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="relative">
                  {verifiedUser.user.avatar ? (
                    <img
                      src={getImageUrl(verifiedUser.user.avatar)}
                      alt={verifiedUser.user.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-emerald-300 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-emerald-100 border-4 border-emerald-300 shadow-md flex items-center justify-center text-emerald-700 font-bold text-2xl">
                      {verifiedUser.user.name.charAt(0)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1 rounded-full shadow">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {verifiedUser.user.role} Verified
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{verifiedUser.user.name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {verifiedUser.user.role === 'Student'
                      ? `Admission No: ${verifiedUser.user.admission_no || 'N/A'}`
                      : `Staff ID: ${verifiedUser.user.staff_id || 'N/A'}`}
                  </p>
                  <p className="text-xs font-bold text-emerald-700 mt-2">
                    Match Confidence: {verifiedUser.confidence}%
                  </p>
                </div>

                <div className="w-full pt-2">
                  <Button
                    onClick={() => handleMarkAttendance(verifiedUser.user.id)}
                    disabled={markingAttendance}
                    className="w-full h-11 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white font-bold text-xs gap-1.5 shadow"
                  >
                    {markingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Mark Attendance for {verifiedUser.user.name}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
                <User className="w-12 h-12 text-slate-300 mb-2" />
                <h4 className="text-sm font-bold text-slate-700">Awaiting Face Recognition</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  {isCameraActive
                    ? "Face the front camera directly with adequate lighting."
                    : "Turn on the front camera stream to begin matching."}
                </p>
                <div className="mt-4 text-[11px] text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  Total Enrolled Faces in Database: {registeredFaces.length}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= 3. ZKTECO FACE ATTENDANCE HARDWARE VIEW ================= */
        <div className="space-y-6">
          {/* ZKTeco Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase">ZKTeco Hardware</span>
                <HardDrive className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-xl font-bold text-slate-800">{zkSummary.total_devices || zkDevices.length}</p>
              <span className="text-[10px] text-emerald-600 font-medium">{zkSummary.online_devices || 0} Online</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase">Today Face Punches</span>
                <Activity className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-xl font-bold text-slate-800">{zkSummary.today_punches || zkLogs.length}</p>
              <span className="text-[10px] text-slate-500">Live ADMS Push Stream</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase">Matched Students</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xl font-bold text-emerald-600">{zkSummary.matched_punches || 0}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Mapped to Class/Roll</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold uppercase">Recognition Match Rate</span>
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-xl font-bold text-slate-800">{zkSummary.match_rate || 100}%</p>
              <span className="text-[10px] text-indigo-600 font-medium">SpeedFace / ProFace / SenseFace</span>
            </div>
          </div>

          {/* ZKTeco Face Hardware & Live Punch Verification Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Registered ZKTeco Face Terminals */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  ZKTeco Face Terminals ({zkDevices.length})
                </h2>
                <Link
                  href="/dashboard/qr-code-attendance/setting"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                >
                  <Settings2 className="w-3.5 h-3.5" /> Hardware Settings
                </Link>
              </div>

              {/* Push Listener Notice */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-indigo-600" />
                  ADMS Face Attendance Cloud Push Endpoint:
                </p>
                <code className="block bg-white p-1.5 rounded border border-indigo-200 text-indigo-700 font-mono text-[11px] select-all">
                  /api/v1/zkteco/cdata
                </code>
                <p className="text-[10px] text-slate-500">
                  Compatible with ZKTeco SpeedFace V5L, ProFace X, SenseFace 7A, MB20, uFace 800 & ZKBioAccess.
                </p>
              </div>

              {/* Devices List */}
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
                {zkDevices.length === 0 ? (
                  <div className="p-8 text-center border border-dashed rounded-xl text-slate-400 text-xs">
                    <HardDrive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No ZKTeco hardware devices registered yet.
                    <div className="mt-2">
                      <Link href="/dashboard/qr-code-attendance/setting">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                          <ExternalLink className="w-3 h-3" /> Add Device in Settings
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  zkDevices.map((dev: any) => (
                    <div
                      key={dev.id}
                      className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800">{dev.name}</span>
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            dev.status === 'online' || dev.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                          )} />
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">SN: {dev.serial_number}</p>
                        <p className="text-[10px] text-slate-400">
                          {dev.school_class ? `Class ${dev.school_class.name}` : 'All Classes'} {dev.section ? `(${dev.section.name})` : ''} • {dev.location || 'Entrance Gate'}
                        </p>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full border",
                        dev.status === 'online' || dev.is_online
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      )}>
                        {dev.status === 'online' || dev.is_online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Live ZKTeco Face Attendance Feed */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Live ZKTeco Face & Biometric Logs
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePullZkLogs}
                  disabled={pullingZkData}
                  className="h-8 text-xs font-semibold gap-1.5 border-slate-200"
                >
                  <ArrowDownToLine className={cn("w-3.5 h-3.5 text-indigo-600", pullingZkData && "animate-spin")} />
                  {pullingZkData ? "Syncing..." : "Sync / Pull Device Logs"}
                </Button>
              </div>

              {/* Feed Table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                {fetchingZkData ? (
                  <div className="p-8 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> Loading ZKTeco Feed...
                  </div>
                ) : zkLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No punch records received today from ZKTeco devices yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50/70">
                      <TableRow>
                        <TableHead className="text-[11px] font-bold">User / Roll</TableHead>
                        <TableHead className="text-[11px] font-bold">Method</TableHead>
                        <TableHead className="text-[11px] font-bold">Device SN</TableHead>
                        <TableHead className="text-[11px] font-bold">Time</TableHead>
                        <TableHead className="text-[11px] font-bold text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100">
                      {zkLogs.map((log: any) => (
                        <TableRow key={log.id} className="text-xs hover:bg-slate-50/60">
                          <TableCell className="py-2.5 font-medium">
                            <div className="flex items-center gap-2">
                              {log.student?.avatar ? (
                                <img src={getImageUrl(log.student.avatar)} alt="" className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                                  {(log.student?.name || log.user_pin || '?').charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-800 text-xs leading-tight">
                                  {log.student?.name || `PIN: ${log.user_pin}`}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {log.student?.school_class?.name ? `Class ${log.student.school_class.name}` : ''} {log.student?.section?.name ? `(${log.student.section.name})` : ''}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              String(log.verify_type) === '15' || String(log.verify_type) === '111' || log.verify_type === 'face'
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200"
                            )}>
                              {String(log.verify_type) === '15' || String(log.verify_type) === '111' || log.verify_type === 'face'
                                ? 'Face Recognition 👤'
                                : String(log.verify_type) === '1'
                                  ? 'Fingerprint 👆'
                                  : String(log.verify_type) === '4'
                                    ? 'RFID/NFC Card 💳'
                                    : 'Biometric 🔐'}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 font-mono text-[10px] text-slate-500">
                            {log.device_serial || 'ZK-DEV'}
                          </TableCell>
                          <TableCell className="py-2.5 text-[11px] text-slate-600 whitespace-nowrap">
                            {log.punch_time ? new Date(log.punch_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold",
                              log.status === 'matched'
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            )}>
                              {log.status === 'matched' ? '✓ Present' : 'Unmatched'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
