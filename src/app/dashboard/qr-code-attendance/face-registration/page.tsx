"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  UserCheck, Camera, ShieldAlert, Loader2, Search,
  CheckCircle, AlertCircle, RefreshCw, Scan, Sparkles, Upload, Wifi,
} from "lucide-react";
import * as faceapi from "face-api.js";
import { useImageUrl } from "@/lib/image-url";

interface RegisteredUser {
  id: number; name: string; role: string;
  admission_no?: string; staff_id?: string; avatar?: string;
  has_face: boolean;
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
  const [loadingModels, setLoadingModels] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [qrSettings, setQrSettings] = useState<QrSettings | null>(null);
  const [cameraUrl, setCameraUrl] = useState<string | null>(null);
  const [ipCamTick, setIpCamTick] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraImgRef = useRef<HTMLImageElement | null>(null);
  const uploadImgRef = useRef<HTMLImageElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectIntervalRef = useRef<any>(null);
  const descriptorRef = useRef<Float32Array | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { t } = useTranslation();

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
        toast.success(t("ai_face_recognition_models_loaded"));
      } catch (error) {
        console.error("Error loading models:", error);
        toast.error(t("failed_to_load_ai_models"));
      }
    };
    loadModels();
    return () => stopCamera();
  }, []);

  // Search users — loads all when query is empty
  const searchUsers = async (query = searchQuery, role = roleFilter) => {
    setSearching(true);
    try {
      const roleQuery = role !== "all" ? `&role=${role}` : "";
      const res = await api.get(`/smart-attendance/users?search=${encodeURIComponent(query)}${roleQuery}`);
      if (res.data?.success) setUsers(res.data.data);
    } catch {
      toast.error(t("error_searching_users"));
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => searchUsers(), 300);
    return () => clearTimeout(t);
  }, [searchQuery, roleFilter]);

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

  // Poll IP camera feed every 2s for live face detection
  useEffect(() => {
    if (captureMode !== 'ipcam') return;
    const t = setInterval(() => setIpCamTick(n => n + 1), 2000);
    return () => clearInterval(t);
  }, [captureMode]);

  // Camera — try with camera_type facingMode, fallback to no constraint, then IP camera
  const startCamera = async () => {
    setCaptureMode('webcam');
    setIsCameraActive(true);

    const tryGetUserMedia = async (constraints?: MediaStreamConstraints): Promise<MediaStream | null> => {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints || { video: true });
      } catch { return null; }
    };

    // Attempt 1: with facingMode from settings
    const facingMode = qrSettings?.camera_type === 'secondary' ? 'environment' : 'user';
    let stream = await tryGetUserMedia({ video: { facingMode } });

    // Attempt 2: if facingMode failed, try without it
    if (!stream) stream = await tryGetUserMedia({ video: true });

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

    // Attempt 3: if IP camera is configured, use it as img source
    if (cameraUrl) {
      setCaptureMode('ipcam');
      return;
    }

    toast.error(t("no_camera_found_use_photo_upload"));
    setIsCameraActive(false);
    setCaptureMode(null);
  };

  const stopCamera = () => {
    if (detectIntervalRef.current) { clearInterval(detectIntervalRef.current); detectIntervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    cameraImgRef.current = null;
    uploadImgRef.current = null;
    setFaceDetected(false);
    descriptorRef.current = null;
    setIsCameraActive(false);
    if (canvasRef.current) {
      canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

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
        if (canvas.width !== displaySize.width) { canvas.width = displaySize.width; canvas.height = displaySize.height; }
        faceapi.matchDimensions(canvas, displaySize);

        const detection = await faceapi.detectSingleFace(source).withFaceLandmarks().withFaceDescriptor();
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          setFaceDetected(true);
          descriptorRef.current = detection.descriptor;
          const resized = faceapi.resizeResults(detection, displaySize);
          const box = resized.detection.box;
          if (ctx) {
            ctx.strokeStyle = "#4F46E5";
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            ctx.fillStyle = "#4F46E5";
            ctx.font = "14px Inter";
            ctx.fillText(t("face_ready_for_registration"), box.x, box.y - 10);
          }
        } else {
          setFaceDetected(false);
          descriptorRef.current = null;
        }
      } catch { /* face-api frame error — safe to ignore */ }
    }, 300);
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
    if (detectIntervalRef.current) { clearInterval(detectIntervalRef.current); detectIntervalRef.current = null; }
    if (canvasRef.current) canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // Register face to DB
  const handleRegisterFace = async () => {
    if (!selectedUser) { toast.error(t("select_person_first")); return; }
    if (!descriptorRef.current) { toast.error(t("no_face_detected")); return; }
    setCapturing(true);
    try {
      const descriptorArray = Array.from(descriptorRef.current);
      const res = await api.post("/attendance/face-register", {
        user_id: selectedUser.id,
        face_descriptor: descriptorArray,
      });
      if (res.data?.success) {
        toast.success(res.data.message || t("face_registered_successfully"));
        const updated = { ...selectedUser, has_face: true };
        setSelectedUser(updated);
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? updated : u));
        clearUpload();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("failed_to_register_face"));
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Gradient card header */}
      <div className="rounded-2xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="flex flex-row items-center gap-2.5 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("ai_biometric_face_registration")}</h1>
            <p className="text-[11px] text-gray-500 mt-1">{t("register_faces_description")}</p>
          </div>
        </div>
      </div>

      {loadingModels ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Search skeleton */}
          <div className="lg:col-span-5 rounded-2xl border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-white p-6 space-y-4">
            <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
            <div className="h-11 w-full rounded-lg bg-gray-100 animate-pulse" />
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-9 flex-1 rounded bg-gray-100 animate-pulse" />)}
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-14 w-full rounded-lg bg-gray-100/70 animate-pulse" />)}
            </div>
          </div>
          {/* Capture skeleton */}
          <div className="lg:col-span-7 rounded-2xl border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-white p-6 space-y-4">
            <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
            <div className="aspect-video w-full rounded-2xl bg-gray-100 animate-pulse flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-xs text-gray-400">{t("initializing_ai_framework")}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: User Search */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-500" />
              {t("select_person")}
            </h2>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input placeholder={t("search_by_name_id_roll")} value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-11 border-slate-200 focus-visible:ring-indigo-500" />
              </div>
              <div className="flex gap-2">
                <Button variant={roleFilter === "all" ? "default" : "outline"} onClick={() => setRoleFilter("all")} className="flex-1 h-9">{t("all")}</Button>
                <Button variant={roleFilter === "Student" ? "default" : "outline"} onClick={() => setRoleFilter("Student")} className="flex-1 h-9">{t("students")}</Button>
                <Button variant={roleFilter === "Staff" ? "default" : "outline"} onClick={() => setRoleFilter("Staff")} className="flex-1 h-9">{t("staff")}</Button>
              </div>
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {searching ? (
                <div className="p-6 text-center text-slate-400 text-sm flex justify-center items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> {t("searching")}
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  {searchQuery ? t("no_matching_users_found") : t("type_above_to_search")}
                </div>
              ) : (
                users.map(user => (
                  <div key={user.id} onClick={() => { setSelectedUser(user); clearUpload(); }}
                    className={cn("p-3 flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50",
                      selectedUser?.id === user.id && "bg-indigo-50/70 hover:bg-indigo-50")}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 uppercase">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">{user.name}</h4>
                        <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">{user.role}</span>
                          <span>•</span>
                          <span>{user.role === 'Student' ? `${t("reg")}: ${user.admission_no || t("not_applicable")}` : `${t("id")}: ${user.staff_id || t("not_applicable")}`}</span>
                        </span>
                      </div>
                    </div>
                    {user.has_face ? (
                      <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> {t("ready")}
                      </span>
                    ) : (
                      <span className="text-rose-500 bg-rose-50 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> {t("no_face")}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Capture Panel */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-500" />
              {t("ai_face_capture")}
            </h2>

            {!selectedUser ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                <UserCheck className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-base font-semibold text-slate-700">{t("select_person_first_title")}</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">{t("choose_user_from_left_panel")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Selected User Banner */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{selectedUser.role}</span>
                    <h3 className="text-lg font-bold text-slate-800 mt-0.5">{selectedUser.name}</h3>
                    <p className="text-xs text-slate-500">{selectedUser.role === 'Student' ? `${t("admission")}: ${selectedUser.admission_no || t("not_applicable")}` : `${t("id")}: ${selectedUser.staff_id || t("not_applicable")}`}</p>
                  </div>
                  {selectedUser.has_face ? (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> {t("registered")}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 animate-bounce" /> {t("not_registered")}
                    </span>
                  )}
                </div>

                {/* Capture Source Selector */}
                <div className="flex gap-2 flex-wrap">
                  <Button variant={captureMode === 'webcam' ? 'default' : 'outline'} size="sm" onClick={startCamera}
                    disabled={isCameraActive && captureMode === 'webcam'}
                    className={captureMode === 'webcam' ? 'bg-indigo-600' : ''}>
                    <Camera className="w-4 h-4 mr-1.5" /> {t("webcam")}
                  </Button>
                  {cameraUrl && (
                    <Button variant={captureMode === 'ipcam' ? 'default' : 'outline'} size="sm"
                      onClick={() => { stopCamera(); setCaptureMode('ipcam'); setIsCameraActive(true); }}
                      className={captureMode === 'ipcam' ? 'bg-indigo-600' : ''}>
                      <Wifi className="w-4 h-4 mr-1.5" /> {t("ip_camera")}
                    </Button>
                  )}
                  <Button variant={captureMode === 'upload' ? 'default' : 'outline'} size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className={captureMode === 'upload' ? 'bg-indigo-600' : ''}>
                    <Upload className="w-4 h-4 mr-1.5" /> {t("upload_photo")}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </div>

                {/* Camera / Upload Preview */}
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video border border-slate-800 flex items-center justify-center min-h-[300px]">
                  {isCameraActive ? (
                    <>
                      {captureMode === 'webcam' && (
                        <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
                      )}
                      {captureMode === 'ipcam' && cameraUrl && (
                        <img ref={cameraImgRef} src={`${cameraUrl}&_t=${ipCamTick}`} className="w-full h-full object-contain" alt={t("ip_camera")}
                          onLoad={(e) => { cameraImgRef.current = e.currentTarget; startFaceDetectionLoop(e.currentTarget); }}
                          onError={() => { toast.error(t("ip_camera_unreachable")); setIsCameraActive(false); setCaptureMode(null); }}
                        />
                      )}
                      {captureMode === 'upload' && uploadedImage && (
                        <img ref={uploadImgRef} src={uploadedImage} className="w-full h-full object-contain" alt={t("uploaded")}
                          onLoad={(e) => { uploadImgRef.current = e.currentTarget; startFaceDetectionLoop(e.currentTarget); }}
                        />
                      )}
                      <canvas ref={canvasRef} className={cn("absolute inset-0 w-full h-full object-cover", captureMode === 'webcam' && "scale-x-[-1]")} />
                      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm border border-slate-700 px-3 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-2">
                        <span className={cn("w-2.5 h-2.5 rounded-full animate-ping", faceDetected ? "bg-emerald-500" : "bg-yellow-500")} />
                        {faceDetected ? t("face_detected") : t("align_face_inside_frame")}
                      </div>
                    </>
                  ) : (
                    <div className="text-center flex flex-col items-center p-8">
                      <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 text-indigo-400">
                        <Camera className="w-8 h-8" />
                      </div>
                      <h4 className="font-semibold text-slate-200 mt-4 text-sm">{t("capture_source_offline")}</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs">
                        {t("click_webcam_or_upload_photo")}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isCameraActive && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleRegisterFace} disabled={capturing || !faceDetected}
                      className={cn("flex-1 h-12 font-bold text-sm text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2",
                        faceDetected
                          ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:shadow-indigo-500/20 hover:-translate-y-0.5"
                          : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none")}>
                      {capturing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {t("saving_biometric_map")}</>
                      ) : (
                        <><UserCheck className="w-5 h-5" /> {t("register_save_biometric_data")}</>
                      )}
                    </Button>
                    <Button variant="outline" onClick={captureMode === 'upload' ? clearUpload : stopCamera} disabled={capturing}
                      className="h-12 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50">
                      {captureMode === 'upload' ? t("clear_photo") : t("close_feed")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
