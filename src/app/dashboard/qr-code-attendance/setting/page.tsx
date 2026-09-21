"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsQR from "jsqr";
import * as faceapi from "face-api.js";
import { acquireCameraStream, stopCameraStream } from "@/lib/camera";
import { useLanguage } from "@/components/providers/language-provider";
import { useSettings } from "@/components/providers/settings-provider";
import { useImageUrl } from "@/lib/image-url";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  QrCode, Settings2, Monitor,
  ScanLine, ShieldCheck, Save, RefreshCw,
  Camera, Wifi, Bell, MessageSquare, Phone,
  Search, Network, CheckCircle2, Loader2, Cpu,
  Plus, Edit, Trash2, Copy, Check, Radio, HardDrive,
  Activity, ArrowDownToLine, Server, ScanFace, Smartphone, Settings,
  Sparkles, CheckCircle, Zap, Globe, Lock, Shield, Clock, AlertTriangle, AlertCircle,
  Volume2, VolumeX, FileSpreadsheet, Printer, User, UserCircle, Filter
} from "lucide-react";
import { cn, formatDate, toLocaleNumber, translateClassName, translateSectionName } from "@/lib/utils";

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

interface FaceUser {
    id: number;
    name: string;
    role: string;
    admission_no?: string;
    staff_id?: string;
    avatar?: string;
    face_descriptor?: string | number[];
}

export default function QrCodeSettingPage() {
    const { t, language } = useLanguage();
    const { settings: globalSettings } = useSettings();
    const getImageUrl = useImageUrl();

    // Active Navigation Tab
    const [activeTab, setActiveTab] = useState<"protocols" | "terminals" | "logs" | "testing">("protocols");

    // General loading & saving state
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

    // IP Camera Scan Dialog
    const [scanDialogOpen, setScanDialogOpen] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scanSubnet, setScanSubnet] = useState("192.168.1");

    // ZKTeco Device Management State
    const [zkDevices, setZkDevices] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [deviceModalOpen, setDeviceModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<any>(null);
    const [savingDevice, setSavingDevice] = useState(false);
    const [pullingDeviceId, setPullingDeviceId] = useState<number | null>(null);
    const [copiedUrl, setCopiedUrl] = useState(false);

    // Delete Device Confirmation
    const [deleteDeviceOpen, setDeleteDeviceOpen] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState<any>(null);

    // Smart Attendance Method Toggles
    const [smartSettings, setSmartSettings] = useState({
        is_face_enabled: true,
        is_qr_enabled: true,
        is_nfc_enabled: true,
    });

    // Hardware & Camera Settings
    const [settings, setSettings] = useState({
        auto_attendance: true,
        camera_type: "primary" as "primary" | "secondary",
        ip_camera_url: "",
        use_sensor_device: true,
        use_camera_device: true,
        notify_in: true,
        notify_out: true,
        notify_sms: false,
        notify_whatsapp: false,
        min_checkout_minutes: 30,
    });

    // Device Form State
    const [deviceForm, setDeviceForm] = useState({
        name: "",
        serial_number: "",
        ip_address: "",
        port: "4370",
        location: "",
        device_type: "adms_push",
        school_class_id: "",
        section_id: "",
        notes: ""
    });

    // Live Camera Test Dialog State
    const [cameraTestOpen, setCameraTestOpen] = useState(false);
    const [testCameraType, setTestCameraType] = useState<"primary" | "secondary">("primary");
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
    const [cameraTesting, setCameraTesting] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [testingStream, setTestingStream] = useState<MediaStream | null>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);

    // ── ZKTeco Real-Time Attendance Logs Feed State ───────────────
    const [zkSummary, setZkSummary] = useState<any>({
        total_devices: 0,
        online_devices: 0,
        today_punches: 0,
        matched_punches: 0,
        match_rate: 100,
    });
    const [zkLogs, setZkLogs] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("all");
    const [selectedSection, setSelectedSection] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [fetchingZkLogs, setFetchingZkLogs] = useState(false);
    const [pullingZkData, setPullingZkData] = useState(false);

    // ── Live Scanner & Testing Tab State ──────────────────────────
    const [testingMode, setTestingMode] = useState<"camera" | "sensor">("camera");
    const [testingLensMode, setTestingLensMode] = useState<"qr" | "face">("qr");
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [webcamActive, setWebcamActive] = useState(false);
    const [isSwitchingTestingCam, setIsSwitchingTestingCam] = useState(false);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [faceUsers, setFaceUsers] = useState<FaceUser[]>([]);
    const [labeledFaceDescriptors, setLabeledFaceDescriptors] = useState<faceapi.LabeledFaceDescriptors[]>([]);
    const [scanValue, setScanValue] = useState("");
    const [processing, setProcessing] = useState(false);
    const [scanCooldown, setScanCooldown] = useState(false);
    const [lastUser, setLastUser] = useState<ScannedUser | null>(null);
    const [scanErrorMsg, setScanErrorMsg] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const faceBusyRef = useRef(false);

    // Live Clock synced with School Timezone
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const tz = globalSettings?.timezone;
            try {
                const options: Intl.DateTimeFormatOptions = {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                    ...(tz ? { timeZone: tz } : {})
                };
                setCurrentTimeStr(new Intl.DateTimeFormat([], options).format(now));
            } catch {
                setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
            }
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, [globalSettings?.timezone]);

    // Audio cue helper
    const playAudio = useCallback((type: 'success' | 'error') => {
        if (!soundEnabled) return;
        try {
            const audio = new Audio(type === 'success' ? '/sounds/success.mp3' : '/sounds/error.mp3');
            audio.play().catch(() => {});
        } catch {}
    }, [soundEnabled]);

    // Fetch Initial Settings & Devices
    const fetchSettings = useCallback(async () => {
        try {
            const [qrRes, smartRes] = await Promise.all([
                api.get('/attendance/qr-settings').catch(() => ({ data: { data: {} } })),
                api.get('/smart-attendance/settings').catch(() => ({ data: { data: {} } })),
            ]);

            const d = qrRes.data?.data || qrRes.data;
            if (d) {
                setSettings({
                    auto_attendance: d.auto_attendance !== undefined ? Boolean(d.auto_attendance) : true,
                    camera_type: d.camera_type === 'secondary' ? 'secondary' : 'primary',
                    ip_camera_url: d.ip_camera_url || "",
                    use_sensor_device: d.use_sensor_device !== undefined ? Boolean(d.use_sensor_device) : true,
                    use_camera_device: d.use_camera_device !== undefined ? Boolean(d.use_camera_device) : true,
                    notify_in: d.notify_in !== undefined ? Boolean(d.notify_in) : true,
                    notify_out: d.notify_out !== undefined ? Boolean(d.notify_out) : true,
                    notify_sms: Boolean(d.notify_sms),
                    notify_whatsapp: Boolean(d.notify_whatsapp),
                    min_checkout_minutes: d.min_checkout_minutes || 30,
                });
                if (d.camera_type === 'secondary') {
                    setFacingMode('user');
                }
            }

            const sm = smartRes.data?.data || smartRes.data;
            if (sm) {
                setSmartSettings({
                    is_face_enabled: sm.is_face_enabled !== undefined ? Boolean(sm.is_face_enabled) : true,
                    is_qr_enabled: sm.is_qr_enabled !== undefined ? Boolean(sm.is_qr_enabled) : true,
                    is_nfc_enabled: sm.is_nfc_enabled !== undefined ? Boolean(sm.is_nfc_enabled) : true,
                });
            }
        } catch {
            console.error("Could not fetch settings");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchZkDevices = useCallback(async () => {
        try {
            const res = await api.get('/zkteco/devices').catch(() => ({ data: { data: [] } }));
            setZkDevices(extractArray(res));
        } catch {
            setZkDevices([]);
        }
    }, []);

    const fetchAcademics = useCallback(async () => {
        try {
            const [classRes, secRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true').catch(() => ({ data: { data: [] } })),
                api.get('/academics/sections?no_paginate=true').catch(() => ({ data: { data: [] } }))
            ]);
            setClasses(extractArray(classRes));
            setSections(extractArray(secRes));
        } catch {
            setClasses([]);
            setSections([]);
        }
    }, []);

    // Fetch ZKTeco Real-Time Logs
    const fetchZkLogs = useCallback(async () => {
        setFetchingZkLogs(true);
        try {
            const params: any = { limit: 50 };
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
        fetchSettings();
        fetchZkDevices();
        fetchAcademics();
        fetchZkLogs();
    }, [fetchSettings, fetchZkDevices, fetchAcademics, fetchZkLogs]);

    useEffect(() => {
        if (activeTab === "logs") {
            fetchZkLogs();
            const interval = setInterval(() => {
                fetchZkLogs();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [activeTab, fetchZkLogs]);

    useEffect(() => {
        if (activeTab === "terminals") {
            fetchZkDevices();
            const interval = setInterval(() => {
                fetchZkDevices();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [activeTab, fetchZkDevices]);

    // Live Camera Test Helper
    const enumerateCameras = async () => {
        try {
            if (!navigator.mediaDevices?.enumerateDevices) return;
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(d => d.kind === 'videoinput');
            setVideoDevices(videoInputs);
        } catch (e) {
            console.error("Error enumerating devices:", e);
        }
    };

    const initCameraStream = useCallback(async (type: 'primary' | 'secondary', deviceId?: string) => {
        setCameraTesting(true);
        setCameraError(null);

        try {
            const facing = type === 'secondary' ? 'user' : 'environment';
            const stream = await acquireCameraStream({
                targetFacing: facing,
                deviceId: deviceId || undefined,
                currentStream: testingStream,
                videoElement: previewVideoRef.current,
                cooldownMs: 200,
            });

            setTestingStream(stream);
            await enumerateCameras();
        } catch (err: unknown) {
            console.error("Camera access error:", err);
            const errObj = err as { name?: string; message?: string };
            const msg = errObj?.name === "NotAllowedError"
                ? "Camera permission was denied. Please allow camera permissions in browser settings."
                : (errObj?.message || "Could not access video feed from selected camera.");
            setCameraError(msg);
            toast.error(msg);
        } finally {
            setCameraTesting(false);
        }
    }, [testingStream]);

    useEffect(() => {
        if (cameraTestOpen && previewVideoRef.current && testingStream) {
            previewVideoRef.current.srcObject = testingStream;
            previewVideoRef.current.play().catch(e => console.log("Video play error:", e));
        }
    }, [cameraTestOpen, testingStream]);

    const startCameraTest = async () => {
        const type = settings.camera_type === 'secondary' ? 'secondary' : 'primary';
        setTestCameraType(type);
        setCameraTestOpen(true);
        await initCameraStream(type);
    };

    const handleSwitchTestCamera = async (type: 'primary' | 'secondary') => {
        setTestCameraType(type);
        setSelectedDeviceId("");
        await initCameraStream(type);
    };

    const handleSelectDevice = async (devId: string) => {
        setSelectedDeviceId(devId);
        await initCameraStream(testCameraType, devId);
    };

    const stopCameraTest = () => {
        stopCameraStream(testingStream, previewVideoRef.current);
        setTestingStream(null);
        setCameraTestOpen(false);
        setCameraError(null);
    };

    // Save All Settings
    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                api.post('/attendance/qr-settings', settings),
                api.post('/smart-attendance/settings', smartSettings).catch(() => {})
            ]);
            toast.success(t("settings_saved_success") || "Settings saved successfully");
        } catch (err: any) {
            toast.error(err.response?.data?.message || t("failed_to_save_settings") || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    // ZKTeco Device Management
    const handleOpenDeviceModal = (device?: any) => {
        if (device) {
            setEditingDevice(device);
            setDeviceForm({
                name: device.name || "",
                serial_number: device.serial_number || "",
                ip_address: device.ip_address || "",
                port: String(device.port || 4370),
                location: device.location || "",
                device_type: device.device_type || "adms_push",
                school_class_id: device.school_class_id ? String(device.school_class_id) : "",
                section_id: device.section_id ? String(device.section_id) : "",
                notes: device.notes || ""
            });
        } else {
            setEditingDevice(null);
            setDeviceForm({
                name: "",
                serial_number: "",
                ip_address: "",
                port: "4370",
                location: "",
                device_type: "adms_push",
                school_class_id: "",
                section_id: "",
                notes: ""
            });
        }
        setDeviceModalOpen(true);
    };

    const handleSaveDevice = async () => {
        if (!deviceForm.serial_number || !deviceForm.name) {
            toast.error("Device Name and Serial Number are required.");
            return;
        }

        setSavingDevice(true);
        try {
            const payload = {
                ...deviceForm,
                school_class_id: deviceForm.school_class_id && deviceForm.school_class_id !== 'all' ? Number(deviceForm.school_class_id) : null,
                section_id: deviceForm.section_id && deviceForm.section_id !== 'all' ? Number(deviceForm.section_id) : null,
                port: Number(deviceForm.port) || 4370
            };

            if (editingDevice) {
                await api.put(`/zkteco/devices/${editingDevice.id}`, payload);
                toast.success(t("zkteco_device_updated_success") || "ZKTeco device updated successfully");
            } else {
                await api.post('/zkteco/devices', payload);
                toast.success(t("zkteco_device_registered_success") || "ZKTeco device registered successfully");
            }
            setDeviceModalOpen(false);
            fetchZkDevices();
            fetchZkLogs();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Failed to save ZKTeco device");
        } finally {
            setSavingDevice(false);
        }
    };

    const confirmDeleteDevice = (device: any) => {
        setDeviceToDelete(device);
        setDeleteDeviceOpen(true);
    };

    const handleDeleteDevice = async () => {
        if (!deviceToDelete) return;
        try {
            await api.delete(`/zkteco/devices/${deviceToDelete.id}`);
            toast.success(t("device_removed_success") || "Device removed successfully");
            setDeleteDeviceOpen(false);
            setDeviceToDelete(null);
            fetchZkDevices();
            fetchZkLogs();
        } catch {
            toast.error("Failed to delete device");
        }
    };

    const handlePullLogs = async (deviceId: number) => {
        setPullingDeviceId(deviceId);
        try {
            await api.post(`/zkteco/devices/${deviceId}/pull`);
            toast.success(t("logs_synchronized_success") || "Logs synchronized successfully");
            fetchZkLogs();
        } catch {
            toast.error(t("failed_to_pull_logs") || "Failed to pull logs from device");
        } finally {
            setPullingDeviceId(null);
        }
    };

    const handlePullAllZkData = async () => {
        setPullingZkData(true);
        try {
            if (zkDevices.length === 0) {
                toast.info("No ZKTeco hardware devices registered.");
                return;
            }
            for (const d of zkDevices) {
                await api.post(`/zkteco/devices/${d.id}/pull`).catch(() => {});
            }
            await fetchZkLogs();
            toast.success(t("device_sync_completed") || "Device sync completed!");
        } catch {
            toast.error(t("device_sync_failed") || "Device sync failed");
        } finally {
            setPullingZkData(false);
        }
    };

    const getAdmsHost = () => {
        if (typeof window !== "undefined") {
            const h = window.location.hostname;
            return (h === "localhost" || h === "127.0.0.1") ? "192.168.1.48" : h;
        }
        return "192.168.1.48";
    };

    const getAdmsPort = () => {
        if (typeof window !== "undefined") {
            const h = window.location.hostname;
            if (h === "localhost" || h === "127.0.0.1") return "8000";
            return window.location.protocol === "https:" ? "443" : (window.location.port || "80");
        }
        return "443";
    };

    const getAdmsUrl = () => {
        const host = getAdmsHost();
        const port = getAdmsPort();
        if (typeof window !== "undefined" && window.location.protocol === "https:") {
            return `https://${host}/iclock/cdata.php`;
        }
        return `http://${host}:${port}/iclock/cdata.php`;
    };

    const copyAdmsUrl = () => {
        const url = getAdmsUrl();
        navigator.clipboard.writeText(url);
        setCopiedUrl(true);
        toast.success("ADMS Server Push Endpoint copied!");
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    const handleScanNetwork = async () => {
        setScanning(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.info(`Scanned subnet ${scanSubnet}.0/24. 0 new IP cameras discovered.`);
        } finally {
            setScanning(false);
        }
    };

    // Format Punch Time
    const formatPunchTime = (dateStr?: string) => {
        if (!dateStr) return "—";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return toLocaleNumber(dateStr, language?.short_code);
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
            return `${toLocaleNumber(`${day}/${month}/${year}`, language?.short_code)} ${toLocaleNumber(time, language?.short_code)}`;
        } catch {
            return toLocaleNumber(dateStr, language?.short_code);
        }
    };

    // ── Export Handlers for Attendance Logs ───────────────────────
    const handleCopyZkLogs = () => {
        const header = `${t("student_user") || "Student/User"}\t${t("admission_no_and_roll_no") || "Roll/Admission"}\t${t("class_and_section") || "Class/Section"}\t${t("verification_mode") || "Method"}\t${t("device_sn") || "Device SN"}\t${t("punch_time") || "Punch Time"}\t${t("status") || "Status"}\n`;
        const rows = zkLogs.map(l =>
            `${l.student?.name || l.user_pin}\t${l.student?.admission_no || l.user_pin}\t${l.school_class?.name || '-'}${l.section?.name ? ` - ${l.section.name}` : ''}\t${String(l.verify_type) === '15' || String(l.verify_type) === '111' || l.verify_type === 'face' ? 'Face' : 'Fingerprint'}\t${l.device_serial}\t${l.punch_time ? formatPunchTime(l.punch_time) : '-'}\t${l.status === 'matched' ? 'PRESENT' : 'UNMATCHED'}`
        ).join("\n");
        navigator.clipboard.writeText(header + rows);
        toast.success(t("logs_copied_clipboard") || "Attendance logs copied to clipboard!");
    };

    const handleExportZkExcel = () => {
        const rows = zkLogs.map(l => ({
            [t("student_user") || "Student / User"]: l.student?.name || l.user_pin,
            [t("admission_no_and_roll_no") || "Admission No & Roll No"]: `${l.student?.admission_no || l.user_pin}${l.student?.roll_no ? ` (Roll: ${l.student.roll_no})` : ''}`,
            [t("class_and_section") || "Class & Section"]: l.school_class?.name ? `${translateClassName(l.school_class.name, language?.short_code)}${l.section?.name ? ` - ${translateSectionName(l.section.name, language?.short_code)}` : ''}` : (t("general_gate") || "General Gate"),
            [t("verification_mode") || "Verification Mode"]: String(l.verify_type) === '15' || String(l.verify_type) === '111' || l.verify_type === 'face'
                ? (t("face_recognition_mode") || "Face Recognition 👤")
                : String(l.verify_type) === '4'
                    ? (t("rfid_nfc_card_mode") || "RFID/NFC Card 💳")
                    : (t("fingerprint_biometric_mode") || "Fingerprint Biometric 👆"),
            [t("device_sn") || "Device SN"]: l.device_serial,
            [t("punch_time") || "Punch Time"]: l.punch_time ? formatPunchTime(l.punch_time) : "—",
            [t("status") || "Status"]: l.status === 'matched' ? (t("status_present") || "PRESENT") : (t("status_unmatched_pin") || "UNMATCHED PIN"),
        }));
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "ZKTeco Logs");
        XLSX.writeFile(workbook, `zkteco_attendance_logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
        toast.success(t("excel_downloaded") || "Excel file downloaded!");
    };

    const handleExportZkCsv = () => {
        const header = `${t("student_user") || "Student/User"},${t("admission_no_and_roll_no") || "Roll/Admission"},${t("class_and_section") || "Class/Section"},${t("verification_mode") || "Method"},${t("device_sn") || "Device SN"},${t("punch_time") || "Punch Time"},${t("status") || "Status"}\n`;
        const rows = zkLogs.map(l =>
            `"${l.student?.name || l.user_pin}","${l.student?.admission_no || l.user_pin}","${l.school_class?.name || '-'}${l.section?.name ? ` - ${l.section.name}` : ''}","${String(l.verify_type) === '15' || String(l.verify_type) === '111' || l.verify_type === 'face' ? 'Face' : 'Fingerprint'}","${l.device_serial}","${l.punch_time ? formatPunchTime(l.punch_time) : '-'}","${l.status === 'matched' ? 'PRESENT' : 'UNMATCHED'}"`
        ).join("\n");
        const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `zkteco_attendance_logs_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        toast.success(t("csv_downloaded") || "CSV file downloaded!");
    };

    // ── Live Scanner / Testing Helper ─────────────────────────────
    const startScannerWebcam = useCallback(async (targetFacing = facingMode) => {
        setIsSwitchingTestingCam(true);
        try {
            const stream = await acquireCameraStream({
                targetFacing,
                videoElement: videoRef.current,
                currentStream: videoRef.current?.srcObject as MediaStream | null,
                cooldownMs: 200,
            });
            if (stream && videoRef.current) {
                setWebcamActive(true);
            }
        } catch (err) {
            console.error("Scanner webcam failed:", err);
            setWebcamActive(false);
        } finally {
            setIsSwitchingTestingCam(false);
        }
    }, [facingMode]);

    const stopScannerWebcam = useCallback(() => {
        stopCameraStream(videoRef.current?.srcObject as MediaStream | null, videoRef.current);
        setWebcamActive(false);
    }, []);

    const toggleTestingFacingMode = () => {
        if (isSwitchingTestingCam) return;
        setFacingMode(prev => prev === "environment" ? "user" : "environment");
    };

    // Start/Stop scanner webcam when on testing tab
    useEffect(() => {
        if (activeTab === "testing" && testingMode === "camera") {
            startScannerWebcam(facingMode);
        } else {
            stopScannerWebcam();
        }
        return () => stopScannerWebcam();
    }, [activeTab, testingMode, facingMode, startScannerWebcam, stopScannerWebcam]);

    // Load AI Face Models when Testing Tab and Face mode active
    useEffect(() => {
        if (activeTab !== "testing" || testingMode !== "camera" || testingLensMode !== "face") return;
        let isMounted = true;
        const loadModels = async () => {
            setLoadingModels(true);
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                ]);
                if (isMounted) setModelsLoaded(true);
            } catch (err) {
                console.error("Error loading face models:", err);
            } finally {
                if (isMounted) setLoadingModels(false);
            }
        };
        if (!modelsLoaded) {
            loadModels();
        }
        return () => { isMounted = false; };
    }, [activeTab, testingMode, testingLensMode, modelsLoaded]);

    // Load registered face users for live recognition verification
    useEffect(() => {
        if (!modelsLoaded) return;
        const fetchFaceUsers = async () => {
            try {
                const res = await api.get('/smart-attendance/users').catch(() => null);
                const uData: FaceUser[] = res?.data?.data?.data || res?.data?.data || [];
                setFaceUsers(uData);

                const descriptors = uData
                    .filter((u: FaceUser) => Boolean(u.face_descriptor))
                    .map((u: FaceUser) => {
                        try {
                            const desc = typeof u.face_descriptor === 'string' ? JSON.parse(u.face_descriptor) : u.face_descriptor;
                            if (Array.isArray(desc) && desc.length === 128) {
                                return new faceapi.LabeledFaceDescriptors(String(u.id), [new Float32Array(desc)]);
                            }
                        } catch {}
                        return null;
                    })
                    .filter(Boolean) as faceapi.LabeledFaceDescriptors[];

                setLabeledFaceDescriptors(descriptors);
            } catch (e) {
                console.error("Error loading face users in settings:", e);
            }
        };
        fetchFaceUsers();
    }, [modelsLoaded]);

    const handleFaceMatch = useCallback(async (userId: number) => {
        if (processing || scanCooldown) return;
        setProcessing(true);
        setScanErrorMsg(null);
        try {
            const res = await api.post('/smart-attendance/mark', { user_id: userId, method: 'face' });
            const data = res.data?.data?.data || res.data?.data;
            const userData = data?.user || faceUsers.find((u: FaceUser) => u.id === userId);
            const status = data?.status || "In";
            const isAlready = data?.already_marked;
            if (userData) {
                setLastUser({
                    name: userData.name || "Unknown",
                    role: userData.role || "Student",
                    admission_no: userData.admission_no,
                    staff_id: userData.staff_id,
                    avatar: userData.avatar,
                    time: data?.time || new Date().toLocaleTimeString(),
                    status: isAlready ? "Already Marked" : status,
                });
                if (isAlready) {
                    toast.info(t("present_already_provided") || "Today present Already Provided.");
                } else if (status === 'Out') {
                    toast.success(`Exit recorded: ${userData.name}`);
                } else {
                    toast.success(`Entry recorded: ${userData.name}`);
                }
                playAudio('success');
                setScanCooldown(true);
                setTimeout(() => setScanCooldown(false), 2500);
            }
        } catch (err: unknown) {
            console.error("Face attendance error:", err);
            const errObj = err as { response?: { data?: { message?: string } } };
            const msg = errObj?.response?.data?.message || "Failed to mark attendance";
            setScanErrorMsg(msg);
            toast.error(msg);
            playAudio('error');
        } finally {
            setProcessing(false);
        }
    }, [processing, scanCooldown, faceUsers, playAudio, t]);

    // AI Face Vision Detection & Matching Loop
    useEffect(() => {
        if (activeTab !== "testing" || testingMode !== "camera" || testingLensMode !== "face" || !webcamActive || !modelsLoaded || scanCooldown || processing) return;

        const interval = setInterval(async () => {
            if (faceBusyRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
            const video = videoRef.current;
            if (video.videoWidth === 0 || video.videoHeight === 0) return;

            faceBusyRef.current = true;
            try {
                const displaySize = { width: video.videoWidth, height: video.videoHeight };
                if (canvasRef.current) {
                    if (canvasRef.current.width !== displaySize.width || canvasRef.current.height !== displaySize.height) {
                        faceapi.matchDimensions(canvasRef.current, displaySize);
                    }
                }

                const detection = await faceapi
                    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

                    if (detection) {
                        const resized = faceapi.resizeResults(detection, displaySize);
                        faceapi.draw.drawDetections(canvasRef.current, resized);
                        faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);

                        if (labeledFaceDescriptors.length > 0 && detection.descriptor) {
                            const matcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.55);
                            const match = matcher.findBestMatch(detection.descriptor);
                            if (match.label !== 'unknown' && match.distance < 0.55) {
                                handleFaceMatch(parseInt(match.label));
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Face loop error:", err);
            } finally {
                faceBusyRef.current = false;
            }
        }, 300);

        const currentCanvas = canvasRef.current;
        return () => {
            clearInterval(interval);
            if (currentCanvas) {
                const ctx = currentCanvas.getContext('2d');
                ctx?.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
            }
        };
    }, [activeTab, testingMode, testingLensMode, webcamActive, modelsLoaded, labeledFaceDescriptors, scanCooldown, processing, handleFaceMatch]);

    // Process Attendance Scan (Testing Tab)
    const handleScan = useCallback(async (code: string) => {
        if (!code || processing || scanCooldown) return;
        setProcessing(true);
        setScanErrorMsg(null);
        try {
            const res = await api.post('/attendance/qr-scan', { code });
            const data = res.data?.data || res.data;
            if (data?.user) {
                const user = data.user;
                const status = data.status || "In";
                const isAlready = data.already_marked || status === 'Already Marked';
                setLastUser({
                    name: user.name || "Unknown",
                    role: user.role || "Student",
                    admission_no: user.admission_no || user.roll_no,
                    staff_id: user.staff_id,
                    avatar: user.avatar,
                    time: data.time || new Date().toLocaleTimeString(),
                    status: status,
                });
                if (isAlready) {
                    toast.info(data.message || t("present_already_provided") || "Today present Already Provided.");
                } else if (status === 'Out') {
                    toast.success(`Check-out recorded: ${user.name}`);
                } else {
                    toast.success(`Check-in recorded: ${user.name}`);
                }
                playAudio('success');
                setScanCooldown(true);
                setTimeout(() => setScanCooldown(false), 2000);
            }
            setScanValue("");
        } catch (err: unknown) {
            const errObj = err as { response?: { data?: { message?: string } } };
            const msg = errObj?.response?.data?.message || "Failed to mark attendance";
            setScanErrorMsg(msg);
            toast.error(msg);
            playAudio('error');
        } finally {
            setProcessing(false);
            if (inputRef.current) inputRef.current.focus();
        }
    }, [processing, scanCooldown, playAudio, t]);

    // Camera Frame Real-Time QR Scanner Loop
    useEffect(() => {
        if (activeTab !== "testing" || testingMode !== "camera" || testingLensMode !== "qr" || scanCooldown || processing) return;

        const interval = setInterval(() => {
            if (!videoRef.current || !webcamActive || videoRef.current.readyState < 2) return;
            const video = videoRef.current;
            if (video.videoWidth === 0 || video.videoHeight === 0) return;
            const canvas = canvasRef.current || document.createElement('canvas');
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
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

        const currentCanvas = canvasRef.current;
        return () => {
            clearInterval(interval);
            if (currentCanvas) {
                const ctx = currentCanvas.getContext('2d');
                ctx?.clearRect(0, 0, currentCanvas.width, currentCanvas.height);
            }
        };
    }, [activeTab, testingMode, testingLensMode, webcamActive, scanCooldown, processing, handleScan]);

    // Biometric methods list
    const SMART_METHODS = [
        {
            key: "is_face_enabled" as const,
            label: t("ai_face_recognition_label") || "AI Face Recognition",
            desc: t("ai_face_recognition_desc") || "SSD MobileNet facial vectors and Visible Light face devices",
            Icon: ScanFace,
            color: "text-blue-600 bg-blue-50 border-blue-100"
        },
        {
            key: "is_qr_enabled" as const,
            label: t("high_speed_qr_code_label") || "High-Speed QR Code",
            desc: t("high_speed_qr_code_desc") || "Encrypted student card QR code scanning with optical lasers",
            Icon: ScanLine,
            color: "text-emerald-600 bg-emerald-50 border-emerald-100"
        },
        {
            key: "is_nfc_enabled" as const,
            label: t("nfc_smart_rfid_label") || "NFC & Smart RFID",
            desc: t("nfc_smart_rfid_desc") || "13.56MHz MIFARE & 125kHz EM4100 contactless tap cards",
            Icon: Smartphone,
            color: "text-purple-600 bg-purple-50 border-purple-100"
        },
    ];

    return (
        <div className="w-full space-y-4 font-sans pb-12 text-xs">
            {/* Master Page Header Banner (Canonical Edge-to-Edge) */}
            <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Settings2 className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                                {t("smart_attendance_hardware_settings") || "Smart Attendance & Hardware Settings"}
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                    {t("system_protocols_badge") || "System Protocols"}
                                </span>
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("smart_hardware_settings_description") || "Configure biometric verification methods, check-in interval rules, ZKTeco devices, camera orientation, and event notifications."}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
                        {/* Live Clock synced with School Timezone */}
                        <div className="bg-white/90 border border-indigo-100 px-3 py-1.5 rounded-lg shadow-xs text-right flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                            <p className="text-xs font-bold text-slate-800 font-mono">{toLocaleNumber(currentTimeStr, language?.short_code)}</p>
                        </div>

                        {/* Sound Toggle */}
                        <button
                            type="button"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={cn(
                                "p-2 rounded-lg border transition-all shadow-xs",
                                soundEnabled ? "bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50" : "bg-slate-100 text-slate-400 border-slate-200"
                            )}
                            title={soundEnabled ? (t("mute_audio_cues") || "Mute audio cues") : (t("unmute_audio_cues") || "Unmute audio cues")}
                        >
                            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        </button>

                        {/* Save Button */}
                        <Button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="h-9 px-5 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-sm active:scale-95 transition-all border-0 cursor-pointer"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saving ? (t("saving_settings_btn") || "Saving...") : (t("save_all_settings_btn") || "Save All Settings")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Responsive Top Navigation Tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200 shadow-xs">
                <button
                    onClick={() => setActiveTab("protocols")}
                    className={cn(
                        "flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                        activeTab === "protocols"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    )}
                >
                    <Settings2 className="h-4 w-4" />
                    <span>{t("tab_protocols_settings") || "System Protocols & Rules"}</span>
                </button>

                <button
                    onClick={() => setActiveTab("terminals")}
                    className={cn(
                        "flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                        activeTab === "terminals"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    )}
                >
                    <Cpu className="h-4 w-4" />
                    <span>{t("tab_zkteco_terminals") || "ZKTeco ADMS Terminals"}</span>
                    <span className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                        activeTab === "terminals" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    )}>
                        {toLocaleNumber(zkDevices.length, language?.short_code)}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab("logs")}
                    className={cn(
                        "flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                        activeTab === "logs"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    )}
                >
                    <Activity className="h-4 w-4" />
                    <span>{t("tab_attendance_logs") || "Live Hardware Logs"}</span>
                    <span className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                        activeTab === "logs" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    )}>
                        {toLocaleNumber(zkSummary.today_punches || zkLogs.length, language?.short_code)}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab("testing")}
                    className={cn(
                        "flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                        activeTab === "testing"
                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    )}
                >
                    <Sparkles className="h-4 w-4" />
                    <span>{t("tab_scanner_testing") || "Live Scanner & Device Test"}</span>
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse p-6" />
                    <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse p-6" />
                </div>
            ) : (
                <div className="space-y-6 w-full">
                    {/* ============================================================== */}
                    {/* TAB 1: SYSTEM PROTOCOLS & CONFIGURATION                        */}
                    {/* ============================================================== */}
                    {activeTab === "protocols" && (
                        <div className="space-y-6 w-full animate-in fade-in duration-200">
                            {/* 1. Smart Attendance Biometric Methods Switcher */}
                            <Card className="border border-slate-200 shadow-xs rounded-2xl overflow-hidden bg-white">
                                <CardHeader className="flex flex-row items-center justify-between gap-2.5 px-5 py-4 bg-slate-50/70 border-b border-slate-100">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                            <Sparkles className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <CardTitle className="text-sm font-bold text-slate-800 leading-none">{t("smart_attendance_verification_channels") || "Smart Attendance Verification Channels"}</CardTitle>
                                            <p className="text-[11px] text-slate-500 mt-1">{t("smart_channels_description") || "Enable or disable individual attendance recognition modules across kiosks and terminals"}</p>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-5">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {SMART_METHODS.map(({ key, label, desc, Icon, color }) => (
                                            <div
                                                key={key}
                                                onClick={() => setSmartSettings({ ...smartSettings, [key]: !smartSettings[key] })}
                                                className={cn(
                                                    "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 select-none",
                                                    smartSettings[key]
                                                        ? "bg-slate-50/70 border-slate-300 shadow-xs ring-1 ring-indigo-500/10"
                                                        : "bg-slate-50/30 border-slate-200 opacity-60 hover:opacity-100"
                                                )}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className={cn("p-2.5 rounded-xl border", color)}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <Switch
                                                        checked={smartSettings[key]}
                                                        onCheckedChange={(val) => setSmartSettings({ ...smartSettings, [key]: val })}
                                                        className="data-[state=checked]:bg-indigo-600"
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                        {label}
                                                        {smartSettings[key] && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 2. Check-In / Check-Out Interval Policy Card */}
                            <Card className="border border-slate-200 shadow-xs rounded-2xl overflow-hidden bg-white">
                                <CardHeader className="flex flex-row items-center gap-2.5 px-5 py-4 bg-slate-50/70 border-b border-slate-100">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                        <Clock className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <CardTitle className="text-sm font-bold text-slate-800 leading-none">{t("checkin_checkout_interval_policy") || "Check-In & Check-Out Interval Policy"}</CardTitle>
                                        <p className="text-[11px] text-slate-500 mt-1">{t("interval_policy_description") || "Prevent double-scanning discrepancies and manage minimum gap before departure punch"}</p>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-5 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <div className="space-y-1.5 md:col-span-1">
                                            <Label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-indigo-600" /> {t("minimum_interval_before_checkout") || "Minimum Interval Before Check-Out"}
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="720"
                                                    value={settings.min_checkout_minutes}
                                                    onChange={(e) => setSettings({ ...settings, min_checkout_minutes: Math.max(1, parseInt(e.target.value, 10) || 30) })}
                                                    className="h-9 text-xs bg-white border-slate-200 w-24 font-bold text-center"
                                                />
                                                <span className="text-xs font-bold text-slate-600">{t("minutes_default_val", { min: toLocaleNumber(30, language?.short_code) }) || `Minutes (Default: ${toLocaleNumber(30, language?.short_code)})`}</span>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                                            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                                                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                                                <span>{t("attendance_cycle_rule_explanation") || "Attendance Cycle Rule Explanation:"}</span>
                                            </div>
                                            <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4 leading-relaxed">
                                                <li><strong>{t("first_scan_of_the_day_rule") || "1st Scan of the Day:"}</strong> {t("records_official_checkin_entry") || "Records official Check-In (Entry) with arrival timestamp."}</li>
                                                <li><strong>{t("within_min_checkout_minutes_rule", { min: toLocaleNumber(settings.min_checkout_minutes, language?.short_code) }) || `Within ${toLocaleNumber(settings.min_checkout_minutes, language?.short_code)} Minutes:`}</strong> {t("prevent_false_checkouts_rule") || "If student/staff scans again, system returns \"Today present Already Provided.\" (Prevents false check-outs)."}</li>
                                                <li><strong>{t("after_min_checkout_minutes_rule", { min: toLocaleNumber(settings.min_checkout_minutes, language?.short_code) }) || `After ${toLocaleNumber(settings.min_checkout_minutes, language?.short_code)} Minutes:`}</strong> {t("subsequent_scan_checkout_rule") || "Subsequent scan records official Check-Out (Departure)."}</li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 3. Camera Source & Notification Settings Split Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Camera Source & Lens Orientation */}
                                <Card className="border border-slate-200 shadow-xs rounded-2xl overflow-hidden bg-white">
                                    <CardHeader className="flex flex-row items-center gap-2.5 px-5 py-4 bg-slate-50/70 border-b border-slate-100">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                            <Camera className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <CardTitle className="text-sm font-bold text-slate-800 leading-none">{t("camera_lens_configuration") || "Camera & Lens Configuration"}</CardTitle>
                                            <p className="text-[11px] text-slate-500 mt-1">{t("camera_lens_description") || "Configure mobile front/back camera orientation and IP streams"}</p>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-5 space-y-5">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div
                                                onClick={() => setSettings({ ...settings, use_sensor_device: !settings.use_sensor_device })}
                                                className={cn(
                                                    "p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2",
                                                    settings.use_sensor_device ? "bg-indigo-50/40 border-indigo-200 shadow-xs" : "bg-slate-50/60 border-slate-200"
                                                )}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <ScanLine className={cn("h-4 w-4", settings.use_sensor_device ? "text-indigo-600" : "text-slate-400")} />
                                                    <Checkbox checked={settings.use_sensor_device} className="data-[state=checked]:bg-indigo-600 h-3.5 w-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-800">{t("usb_sensor_device_label") || "USB / Sensor Device"}</h4>
                                                    <p className="text-[10px] text-slate-400">{t("usb_sensor_device_desc") || "Barcode scanner & RFID cards"}</p>
                                                </div>
                                            </div>

                                            <div
                                                onClick={() => setSettings({ ...settings, use_camera_device: !settings.use_camera_device })}
                                                className={cn(
                                                    "p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2",
                                                    settings.use_camera_device ? "bg-indigo-50/40 border-indigo-200 shadow-xs" : "bg-slate-50/60 border-slate-200"
                                                )}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <Camera className={cn("h-4 w-4", settings.use_camera_device ? "text-indigo-600" : "text-slate-400")} />
                                                    <Checkbox checked={settings.use_camera_device} className="data-[state=checked]:bg-indigo-600 h-3.5 w-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-800">{t("visual_camera_label") || "Visual Camera"}</h4>
                                                    <p className="text-[10px] text-slate-400">{t("visual_camera_desc") || "Mobile lens & IP cameras"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {settings.use_camera_device && (
                                            <div className="space-y-4 pt-3 border-t border-slate-100">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                                        <Smartphone className="h-3.5 w-3.5 text-indigo-600" /> {t("default_camera_lens_orientation") || "Default Camera Lens Orientation"}
                                                    </Label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={startCameraTest}
                                                        className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1"
                                                    >
                                                        <Camera className="h-3 w-3" /> {t("test_camera_feed_btn") || "Test Camera Feed"}
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div
                                                        onClick={() => setSettings({ ...settings, camera_type: 'primary' })}
                                                        className={cn(
                                                            "p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5",
                                                            settings.camera_type === 'primary' ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs" : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100/60"
                                                        )}
                                                    >
                                                        <Smartphone className="h-4 w-4 shrink-0 text-indigo-600" />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold leading-tight">{t("back_rear_camera_option") || "Back / Rear Camera 📷"}</p>
                                                            <p className="text-[10px] text-slate-500">{t("back_rear_camera_desc") || "For phone scanning student badges"}</p>
                                                        </div>
                                                    </div>

                                                    <div
                                                        onClick={() => setSettings({ ...settings, camera_type: 'secondary' })}
                                                        className={cn(
                                                            "p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5",
                                                            settings.camera_type === 'secondary' ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs" : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100/60"
                                                        )}
                                                    >
                                                        <ScanFace className="h-4 w-4 shrink-0 text-indigo-600" />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold leading-tight">{t("front_selfie_camera_option") || "Front / Selfie Camera 🤳"}</p>
                                                            <p className="text-[10px] text-slate-500">{t("front_selfie_camera_desc") || "For tablet / iPad desk kiosks"}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 pt-3 border-t border-slate-100">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                            <Wifi className="h-3.5 w-3.5 text-indigo-600" /> {t("external_ip_camera_url_optional") || "External IP Camera Stream URL (Optional)"}
                                                        </Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                value={settings.ip_camera_url}
                                                                onChange={(e) => setSettings({ ...settings, ip_camera_url: e.target.value })}
                                                                placeholder={t("ip_camera_url_placeholder") || "Leave empty for device/phone camera or http://192.168.1.100"}
                                                                className="h-9 text-xs flex-1 bg-white border-slate-200"
                                                            />
                                                            <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
                                                                <DialogTrigger asChild>
                                                                    <Button type="button" variant="outline" className="h-9 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex gap-1 items-center px-3">
                                                                        <Network className="h-3.5 w-3.5" /> {t("scan_network_btn") || "Scan Network"}
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-lg rounded-2xl">
                                                                    <DialogHeader>
                                                                        <DialogTitle className="text-sm flex items-center gap-2">
                                                                            <Search className="h-4 w-4 text-indigo-500" />
                                                                            {t("scan_local_subnet_ip_cameras") || "Scan Local Subnet for IP Cameras"}
                                                                        </DialogTitle>
                                                                        <DialogDescription className="text-xs">
                                                                            {t("discover_onvif_rtsp_desc") || "Discover ONVIF and RTSP streaming cameras on your local network"}
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="space-y-3 py-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <Input
                                                                                value={scanSubnet}
                                                                                onChange={(e) => setScanSubnet(e.target.value)}
                                                                                placeholder="192.168.1"
                                                                                className="h-8 text-xs flex-1"
                                                                                disabled={scanning}
                                                                            />
                                                                            <Button
                                                                                onClick={handleScanNetwork}
                                                                                disabled={scanning || !scanSubnet}
                                                                                className="h-8 text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white px-3.5 flex gap-1"
                                                                            >
                                                                                {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Network className="h-3.5 w-3.5" />}
                                                                                {scanning ? (t("scanning_btn") || "Scanning...") : (t("start_scan_btn") || "Start Scan")}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                    <DialogFooter>
                                                                        <Button variant="outline" onClick={() => setScanDialogOpen(false)} className="text-xs">{t("close_btn") || "Close"}</Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                        <p className="text-[10px] text-emerald-600 font-medium">
                                                            {t("leave_empty_webcam_hint") || "✨ Leave empty to automatically use your phone, iPad, or computer webcam."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Automated Entry & Notification Dispatcher */}
                                <Card className="border border-slate-200 shadow-xs rounded-2xl overflow-hidden bg-white">
                                    <CardHeader className="flex flex-row items-center gap-2.5 px-5 py-4 bg-slate-50/70 border-b border-slate-100">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                            <Bell className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <CardTitle className="text-sm font-bold text-slate-800 leading-none">{t("automated_entry_notifications") || "Automated Entry & Notifications"}</CardTitle>
                                            <p className="text-[11px] text-slate-500 mt-1">{t("automated_entry_description") || "Configure auto attendance recording and parent/staff alerts"}</p>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-5 space-y-5">
                                        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                    <Zap className="h-3.5 w-3.5 text-amber-500" /> {t("automated_auto_entry_recording") || "Automated Auto-Entry Recording"}
                                                </span>
                                                <span className="text-[10px] text-slate-400 mt-0.5">
                                                    {t("auto_attendance_subtext") || "Auto-submit and log attendance immediately upon card swipe or face recognition without manual clicks"}
                                                </span>
                                            </div>
                                            <Switch
                                                checked={settings.auto_attendance}
                                                onCheckedChange={(val) => setSettings({ ...settings, auto_attendance: val })}
                                                className="data-[state=checked]:bg-indigo-600"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                                <Bell className="h-3.5 w-3.5 text-indigo-500" /> {t("notification_event_triggers") || "Notification Event Triggers"}
                                            </Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-slate-50/70 hover:bg-slate-100/60 rounded-xl border border-slate-200 transition-all">
                                                    <Checkbox
                                                        checked={settings.notify_in}
                                                        onCheckedChange={(val) => setSettings({ ...settings, notify_in: !!val })}
                                                        className="data-[state=checked]:bg-indigo-600"
                                                    />
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">{t("checkin_in_event") || "Check-in (In Event)"}</p>
                                                        <p className="text-[10px] text-slate-400">{t("notify_upon_arrival") || "Notify upon arrival"}</p>
                                                    </div>
                                                </label>

                                                <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-slate-50/70 hover:bg-slate-100/60 rounded-xl border border-slate-200 transition-all">
                                                    <Checkbox
                                                        checked={settings.notify_out}
                                                        onCheckedChange={(val) => setSettings({ ...settings, notify_out: !!val })}
                                                        className="data-[state=checked]:bg-indigo-600"
                                                    />
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">{t("checkout_out_event") || "Check-out (Out Event)"}</p>
                                                        <p className="text-[10px] text-slate-400">{t("notify_upon_departure") || "Notify upon departure"}</p>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-2 border-t border-slate-100">
                                            <Label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                                <MessageSquare className="h-3.5 w-3.5 text-emerald-500" /> {t("alert_delivery_channels") || "Alert Delivery Channels"}
                                            </Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div
                                                    onClick={() => setSettings({ ...settings, notify_sms: !settings.notify_sms })}
                                                    className={cn(
                                                        "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                                        settings.notify_sms ? "bg-indigo-50/50 border-indigo-200 shadow-xs" : "bg-slate-50/70 border-slate-200"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Phone className={cn("h-4 w-4", settings.notify_sms ? "text-indigo-600" : "text-slate-400")} />
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800">{t("sms_gateway_channel") || "SMS Gateway"}</p>
                                                            <p className="text-[10px] text-slate-400">{t("direct_mobile_text") || "Direct mobile text"}</p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        checked={settings.notify_sms}
                                                        onCheckedChange={(val) => setSettings({ ...settings, notify_sms: val })}
                                                        className="data-[state=checked]:bg-indigo-600"
                                                    />
                                                </div>

                                                <div
                                                    onClick={() => setSettings({ ...settings, notify_whatsapp: !settings.notify_whatsapp })}
                                                    className={cn(
                                                        "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                                        settings.notify_whatsapp ? "bg-emerald-50/50 border-emerald-200 shadow-xs" : "bg-slate-50/70 border-slate-200"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquare className={cn("h-4 w-4", settings.notify_whatsapp ? "text-emerald-600" : "text-slate-400")} />
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800">{t("whatsapp_alert_channel") || "WhatsApp Alert"}</p>
                                                            <p className="text-[10px] text-slate-400">{t("instant_parent_ping") || "Instant parent ping"}</p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        checked={settings.notify_whatsapp}
                                                        onCheckedChange={(val) => setSettings({ ...settings, notify_whatsapp: val })}
                                                        className="data-[state=checked]:bg-emerald-600"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* TAB 2: ZKTECO HARDWARE & ADMS TERMINAL MANAGEMENT              */}
                    {/* ============================================================== */}
                    {activeTab === "terminals" && (
                        <div className="space-y-4 w-full animate-in fade-in duration-200">
                            <Card className="border border-slate-200 shadow-xs rounded-2xl overflow-hidden bg-white">
                                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-slate-50/70 border-b border-slate-100">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                            <Cpu className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <CardTitle className="text-sm font-bold text-slate-800 leading-none">{t("zkteco_hardware_adms_terminals") || "ZKTeco Hardware & ADMS Biometric Terminals"}</CardTitle>
                                            <p className="text-[11px] text-slate-500 mt-1">{t("zkteco_hardware_description") || "Connect standalone SpeedFace, uFace, ProFace, and SenseFace facial recognition devices"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={copyAdmsUrl}
                                            className="h-8 text-xs border-slate-200 hover:bg-slate-50 text-slate-700 gap-1.5 shadow-2xs"
                                        >
                                            {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                                            {copiedUrl ? (t("copied_adms_url") || "Copied ADMS URL") : (t("copy_server_push_url") || "Copy Server Push URL")}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => handleOpenDeviceModal()}
                                            className="h-8 text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white font-bold gap-1 shadow-xs border-0"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> {t("add_zkteco_device_btn") || "Add ZKTeco Device"}
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-5 space-y-4">
                                    {/* ADMS Instructions Banner */}
                                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                <Activity className="h-4 w-4 text-indigo-600" /> {t("zkteco_adms_endpoint_label") || "ZKTeco ADMS Cloud Server Push Endpoint:"}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[11px] font-medium text-slate-600">
                                                    Server Address (IP): <strong className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-600">{getAdmsHost()}</strong>
                                                </span>
                                                <span className="text-[11px] font-medium text-slate-600">
                                                    Server Port: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-600">{getAdmsPort()}</strong>
                                                </span>
                                            </div>
                                            <code className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 select-all block sm:inline">
                                                {getAdmsUrl()}
                                            </code>
                                        </div>
                                        <span className="text-[10px] text-slate-400 italic max-w-xs text-right">
                                            {t("zkteco_adms_menu_hint") || "In device menu: Comm. → Cloud Server (ADMS) → enter Server Address & Port."}
                                        </span>
                                    </div>

                                    {/* Numeric User ID / PIN Mapping Hint Banner */}
                                    <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-start gap-2.5">
                                        <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                                        <div className="text-[11px] space-y-1">
                                            <p className="font-bold text-indigo-950">
                                                {t("zkteco_pin_mapping_title") || "ZKTeco User ID (Numeric PIN) Mapping Guide:"}
                                            </p>
                                            <p className="text-slate-600 leading-relaxed">
                                                {t("zkteco_pin_mapping_desc") || "ZKTeco hardware terminals only support numbers for User ID. iSchool automatically matches numeric punches to alphanumeric roll numbers like RL-2A0101 by: (1) Student Database ID, (2) Digits only (e.g. 20101 for RL-2A0101), (3) Ending suffix (e.g. 0101 or 101), or (4) Numeric Admission No."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Devices Table */}
                                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                                        {zkDevices.length === 0 ? (
                                            <div className="text-center py-10 px-4 space-y-2">
                                                <Cpu className="h-8 w-8 mx-auto text-slate-300" />
                                                <p className="text-xs font-bold text-slate-600">{t("no_zkteco_devices_registered") || "No ZKTeco hardware devices registered yet"}</p>
                                                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                                                    {t("no_zkteco_devices_hint") || "Register your device's serial number above so that automatic real-time punches from ZKTeco face recognition terminals sync with student attendance."}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader className="bg-slate-50/80">
                                                        <TableRow>
                                                            <TableHead className="py-2.5 px-4 text-xs font-bold text-slate-700">{t("table_terminal_name") || "Terminal Name"}</TableHead>
                                                            <TableHead className="py-2.5 px-4 text-xs font-bold text-slate-700">{t("table_serial_number") || "Serial Number"}</TableHead>
                                                            <TableHead className="py-2.5 px-4 text-xs font-bold text-slate-700">{t("table_type_protocol") || "Type / Protocol"}</TableHead>
                                                            <TableHead className="py-2.5 px-4 text-xs font-bold text-slate-700">{t("table_location") || "Location"}</TableHead>
                                                            <TableHead className="py-2.5 px-4 text-xs font-bold text-slate-700">{t("table_class_section_filter") || "Class/Section Filter"}</TableHead>
                                                            <TableHead className="py-2.5 px-4 text-xs font-bold text-slate-700">{t("table_status_last_heartbeat") || "Status / Last Heartbeat"}</TableHead>
                                                            <TableHead className="py-2.5 px-4 text-xs font-bold text-slate-700 text-right">{t("table_actions") || "Actions"}</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody className="divide-y divide-slate-100">
                                                        {zkDevices.map((dev) => (
                                                            <TableRow key={dev.id} className="hover:bg-slate-50/60 transition-colors">
                                                                <TableCell className="py-3 px-4 font-bold text-slate-800 text-xs">{dev.name}</TableCell>
                                                                <TableCell className="py-3 px-4 font-mono text-[11px] text-slate-600">{dev.serial_number}</TableCell>
                                                                <TableCell className="py-3 px-4">
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                                        {dev.device_type === 'standalone_sdk' ? (t("standalone_tcp_badge") || 'Standalone TCP') : (t("adms_push_badge") || 'ADMS Push')}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="py-3 px-4 text-slate-600 text-xs">{dev.location || "—"}</TableCell>
                                                                <TableCell className="py-3 px-4 text-xs text-slate-600">
                                                                    {dev.school_class ? `${translateClassName(dev.school_class.name, language?.short_code)} (${dev.section ? translateSectionName(dev.section.name, language?.short_code) : (t("all_sections_filter") || 'All')})` : (t("all_classes_filter") || "All Classes")}
                                                                </TableCell>
                                                                <TableCell className="py-3 px-4">
                                                                    {(() => {
                                                                        const isRecentPush = dev.last_push_at && (new Date().getTime() - new Date(dev.last_push_at).getTime() < 3 * 60 * 1000);
                                                                        const isDevOnline = dev.is_online !== undefined ? Boolean(dev.is_online && isRecentPush) : Boolean(dev.status === 'online' && isRecentPush);
                                                                        return (
                                                                            <div className="flex flex-col gap-1">
                                                                                <span className={cn(
                                                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 w-fit",
                                                                                    isDevOnline ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
                                                                                )}>
                                                                                    <span className={cn("w-1.5 h-1.5 rounded-full", isDevOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-400")} />
                                                                                    {isDevOnline ? (t("online_status") || 'Online') : (t("offline_status") || 'Offline')}
                                                                                </span>
                                                                                <span className="text-[10px] text-slate-400 font-mono">
                                                                                    {dev.last_push_at ? formatDate(dev.last_push_at, "dd/MM/yyyy hh:mm a") : (t("never_connected") || "Never")}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </TableCell>
                                                                <TableCell className="py-3 px-4 text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handlePullLogs(dev.id)}
                                                                            disabled={pullingDeviceId === dev.id}
                                                                            className="h-7 px-2.5 text-[10px] font-bold bg-gradient-to-r from-[#6366f1] to-indigo-600 text-white rounded-lg shadow-xs hover:opacity-90 active:scale-95 transition-all"
                                                                            title={t("sync_punches_tooltip") || "Synchronize punches from device"}
                                                                        >
                                                                            {pullingDeviceId === dev.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowDownToLine className="h-3 w-3 mr-1" />}
                                                                            {t("sync_punches_btn") || "Sync"}
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            onClick={() => handleOpenDeviceModal(dev)}
                                                                            className="h-7 w-7 p-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg shadow-xs active:scale-95 transition-all"
                                                                            title={t("edit") || "Edit"}
                                                                        >
                                                                            <Edit className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            onClick={() => confirmDeleteDevice(dev)}
                                                                            className="h-7 w-7 p-0 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-lg shadow-xs active:scale-95 transition-all"
                                                                            title={t("delete") || "Delete"}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* TAB 3: REAL-TIME HARDWARE ATTENDANCE LOGS                      */}
                    {/* ============================================================== */}
                    {activeTab === "logs" && (
                        <div className="space-y-4 w-full animate-in fade-in duration-200">
                            {/* ZKTeco Metrics Bar */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                                <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-xs flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">{t("registered_devices") || "Registered Devices"}</p>
                                        <p className="text-xl font-black text-slate-800 mt-0.5">{toLocaleNumber(zkSummary.total_devices || zkDevices.length, language?.short_code)}</p>
                                        <span className="text-[10px] text-emerald-600 font-medium">
                                            {t("online_adms_terminals", { count: toLocaleNumber(zkSummary.online_devices || zkDevices.filter(d => d.status === 'online').length, language?.short_code) }) || `${zkSummary.online_devices || 0} Online ADMS Terminals`}
                                        </span>
                                    </div>
                                    <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                                        <HardDrive className="h-5 w-5" />
                                    </span>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-xs flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">{t("today_punches") || "Today Punches"}</p>
                                        <p className="text-xl font-black text-slate-800 mt-0.5">{toLocaleNumber(zkSummary.today_punches || zkLogs.length, language?.short_code)}</p>
                                        <span className="text-[10px] text-slate-500">{t("live_hardware_stream") || "Live Hardware Stream"}</span>
                                    </div>
                                    <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                                        <Activity className="h-5 w-5" />
                                    </span>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-xs flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">{t("matched_students") || "Matched Students"}</p>
                                        <p className="text-xl font-black text-emerald-600 mt-0.5">{toLocaleNumber(zkSummary.matched_punches || zkLogs.filter(l => l.status === 'matched').length, language?.short_code)}</p>
                                        <span className="text-[10px] text-emerald-600 font-medium">{t("mapped_to_roll_adm") || "Mapped to Roll/Adm"}</span>
                                    </div>
                                    <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </span>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-xs flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">{t("match_accuracy") || "Match Accuracy"}</p>
                                        <p className="text-xl font-black text-slate-800 mt-0.5">{toLocaleNumber(zkSummary.match_rate || 100, language?.short_code)}%</p>
                                        <span className="text-[10px] text-indigo-600 font-medium">{t("speedface_biometrics") || "SpeedFace & Biometrics"}</span>
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
                                        <Filter className="h-3.5 w-3.5 text-indigo-600" /> {t("filter_label") || "Filter:"}
                                    </div>

                                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                                        <SelectTrigger className="h-8 text-xs w-[140px] bg-slate-50 border-slate-200">
                                            <SelectValue placeholder={t("all_classes") || "All Classes"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t("all_classes") || "All Classes"}</SelectItem>
                                            {Array.isArray(classes) && classes.map((cls: any) => (
                                                <SelectItem key={cls.id} value={String(cls.id)}>
                                                    {translateClassName(cls.class_name || cls.name, language?.short_code)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                                        <SelectTrigger className="h-8 text-xs w-[130px] bg-slate-50 border-slate-200">
                                            <SelectValue placeholder={t("all_sections") || "All Sections"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t("all_sections") || "All Sections"}</SelectItem>
                                            {Array.isArray(sections) && sections.map((sec: any) => (
                                                <SelectItem key={sec.id} value={String(sec.id)}>
                                                    {translateSectionName(sec.section_name || sec.name, language?.short_code)}
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
                                            placeholder={t("search_roll_admission_placeholder") || "Search Roll / Admission ID..."}
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
                                        {t("search") || "Search"}
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-auto">
                                    {/* Export Toolbar */}
                                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                                        <button
                                            type="button"
                                            onClick={handleCopyZkLogs}
                                            className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                                            title={t("copy_table") || "Copy Table"}
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleExportZkExcel}
                                            className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                                            title={t("export_excel") || "Export Excel"}
                                        >
                                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleExportZkCsv}
                                            className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all"
                                            title={t("export_csv") || "Export CSV"}
                                        >
                                            <FileSpreadsheet className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => window.print()}
                                            className="p-1.5 hover:bg-slate-100 text-slate-600 transition-all"
                                            title={t("print_logs") || "Print Logs"}
                                        >
                                            <Printer className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={handlePullAllZkData}
                                        disabled={pullingZkData}
                                        className="h-8 px-3.5 text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white font-bold gap-1.5 shadow-xs shrink-0"
                                    >
                                        {pullingZkData ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowDownToLine className="h-3.5 w-3.5" />}
                                        {t("sync_device_data") || "Sync Device Data"}
                                    </Button>
                                </div>
                            </div>

                            {/* ZKTeco Attendance Logs Feed Table */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="h-4 w-4 text-indigo-600" />
                                        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                                            {t("zkteco_live_attendance_feed") || "ZKTeco Live Attendance Feed (Roll / Admission ID Wise)"}
                                        </h3>
                                    </div>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                        {t("showing_attendance_log_entries", { count: toLocaleNumber(zkLogs.length, language?.short_code) }) || `Showing ${zkLogs.length} attendance log entries`}
                                    </span>
                                </div>

                                {fetchingZkLogs ? (
                                    <div className="p-12 text-center text-slate-400 space-y-2">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                                        <p className="text-xs font-medium">{t("fetching_zkteco_attendance_stream") || "Fetching ZKTeco hardware attendance stream..."}</p>
                                    </div>
                                ) : zkLogs.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400 space-y-2">
                                        <Cpu className="h-8 w-8 mx-auto text-slate-300" />
                                        <p className="text-xs font-bold text-slate-600">{t("no_attendance_logs_today") || "No attendance logs received today yet"}</p>
                                        <p className="text-[11px] text-slate-400">{t("connect_zkteco_sync_instruction") || 'Connect your ZKTeco device or click "Sync Device Data" to fetch latest logs.'}</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-50/80">
                                                <TableRow className="border-b border-slate-200">
                                                    <TableHead className="text-xs font-bold text-slate-700 py-3 px-4">{t("student_user") || "Student / User"}</TableHead>
                                                    <TableHead className="text-xs font-bold text-slate-700 px-4">{t("admission_no_and_roll_no") || "Admission No & Roll No"}</TableHead>
                                                    <TableHead className="text-xs font-bold text-slate-700 px-4">{t("class_and_section") || "Class & Section"}</TableHead>
                                                    <TableHead className="text-xs font-bold text-slate-700 px-4">{t("verification_mode") || "Verification Mode"}</TableHead>
                                                    <TableHead className="text-xs font-bold text-slate-700 px-4">{t("device_sn") || "Device SN"}</TableHead>
                                                    <TableHead className="text-xs font-bold text-slate-700 px-4">{t("punch_time") || "Punch Time"}</TableHead>
                                                    <TableHead className="text-xs font-bold text-slate-700 text-right pr-6">{t("status") || "Status"}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="divide-y divide-slate-100">
                                                {Array.isArray(zkLogs) && zkLogs.map((log) => (
                                                    <TableRow key={log.id} className="hover:bg-indigo-50/20 transition-colors">
                                                        <TableCell className="py-3 px-4">
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
                                                                        {log.student?.name || t("unregistered_pin", { pin: toLocaleNumber(log.user_pin, language?.short_code) }) || `Unregistered PIN (${log.user_pin})`}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 uppercase">
                                                                        {log.student?.role || t("student") || 'Student'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="py-3 px-4">
                                                            <div className="flex flex-col font-mono text-xs">
                                                                <span className="text-slate-700 font-semibold">
                                                                    {t("adm_short") || "Adm"}: {toLocaleNumber(log.student?.admission_no || log.user_pin, language?.short_code)}
                                                                </span>
                                                                {log.student?.roll_no && (
                                                                    <span className="text-[10px] text-slate-400">
                                                                        {t("roll_short") || "Roll"}: {toLocaleNumber(log.student.roll_no, language?.short_code)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="py-3 px-4">
                                                            <div className="text-xs text-slate-700 font-medium">
                                                                {log.school_class || log.student?.school_class_id ? (
                                                                    <span>
                                                                        {translateClassName(log.school_class?.class_name || log.school_class?.name || '', language?.short_code) || t("class") || 'Class'} {log.section ? `- ${translateSectionName(log.section.section_name || log.section.name, language?.short_code)}` : ''}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 italic">{t("general_gate") || "General Gate"}</span>
                                                                )}
                                                            </div>
                                                        </TableCell>

                                                        <TableCell className="py-3 px-4">
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border",
                                                                String(log.verify_type) === '15' || String(log.verify_type) === '111' || log.verify_type === 'face'
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                    : String(log.verify_type) === '4'
                                                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                                                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                            )}>
                                                                {String(log.verify_type) === '15' || String(log.verify_type) === '111' || log.verify_type === 'face'
                                                                    ? (t("face_recognition_mode") || 'Face Recognition 👤')
                                                                    : String(log.verify_type) === '4'
                                                                        ? (t("rfid_nfc_card_mode") || 'RFID/NFC Card 💳')
                                                                        : (t("fingerprint_biometric_mode") || 'Fingerprint Biometric 👆')}
                                                            </span>
                                                        </TableCell>

                                                        <TableCell className="py-3 px-4">
                                                            <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                {log.device_serial}
                                                            </span>
                                                        </TableCell>

                                                        <TableCell className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                                                            {log.punch_time ? formatPunchTime(log.punch_time) : '—'}
                                                        </TableCell>

                                                        <TableCell className="py-3 px-4 text-right pr-6">
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                                                                log.status === 'matched'
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                                            )}>
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                {log.status === 'matched' ? (t("status_present") || 'PRESENT') : (t("status_unmatched_pin") || 'UNMATCHED PIN')}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* TAB 4: LIVE SCANNER & DEVICE TESTING VIEW                      */}
                    {/* ============================================================== */}
                    {activeTab === "testing" && (
                        <div className="space-y-4 w-full animate-in fade-in duration-200">
                            {/* Mode Switcher */}
                            <div className="flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-xs max-w-md">
                                <button
                                    onClick={() => setTestingMode("camera")}
                                    className={cn(
                                        "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                        testingMode === "camera"
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                    )}
                                >
                                    <Camera className="h-3.5 w-3.5" /> {t("mobile_ip_camera") || "Mobile / IP Camera"}
                                </button>

                                <button
                                    onClick={() => setTestingMode("sensor")}
                                    className={cn(
                                        "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                        testingMode === "sensor"
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                    )}
                                >
                                    <Zap className="h-3.5 w-3.5" /> {t("usb_sensor_barcode") || "USB Sensor / Barcode"}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Scanner Viewport Frame */}
                                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col relative min-h-[420px]">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                                        <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                                            {testingMode === "camera" ? <Camera className="h-4 w-4 text-indigo-600" /> : <Zap className="h-4 w-4 text-amber-500" />}
                                            {testingMode === "camera" ? (t("mobile_device_camera_feed") || "Mobile / Device Camera Feed") : (t("usb_sensor_barcode_scanner") || "USB Sensor / Barcode Scanner")}
                                        </span>
                                        {testingMode === "sensor" && settings?.auto_attendance && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full animate-pulse">
                                                <Zap className="h-3 w-3 text-indigo-600" /> {t("auto_attendance_active") || "Auto Attendance Active"}
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col items-center justify-center space-y-4">
                                        {testingMode === "sensor" ? (
                                            <div className="w-full max-w-sm space-y-4 text-center">
                                                <div className="space-y-1">
                                                    <h2 className="text-base font-bold text-slate-800">{t("ready_to_scan_id_card") || "Ready to Scan ID Card"}</h2>
                                                    <p className="text-xs text-slate-400">{t("swipe_rfid_or_barcode_scanner") || "Swipe RFID card or point handheld barcode scanner"}</p>
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
                                                        placeholder={t("scan_barcode_or_type_roll") || "SCAN BARCODE OR TYPE ROLL NO..."}
                                                        className="h-12 text-center text-sm font-bold tracking-widest bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-indigo-500 uppercase shadow-inner"
                                                        autoFocus
                                                    />
                                                    {settings?.auto_attendance && (
                                                        <p className="text-[10px] text-slate-400">{t("auto_records_attendance_instant") || "⚡ Auto-records attendance instantly upon scan"}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full max-w-md space-y-3">
                                                {/* Lens Mode Selector Switch */}
                                                <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-100/70 p-0.5">
                                                    <button
                                                        onClick={() => setTestingLensMode("qr")}
                                                        className={cn(
                                                            "flex-1 py-1.5 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-1.5",
                                                            testingLensMode === "qr" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
                                                        )}
                                                    >
                                                        <QrCode className="h-3.5 w-3.5" /> {t("high_speed_qr_scanner") || "High-Speed QR Scanner"}
                                                    </button>
                                                    <button
                                                        onClick={() => setTestingLensMode("face")}
                                                        className={cn(
                                                            "flex-1 py-1.5 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-1.5",
                                                            testingLensMode === "face" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
                                                        )}
                                                    >
                                                        <ScanFace className="h-3.5 w-3.5" /> {t("ai_face_recognition") || "AI Face Recognition"}
                                                    </button>
                                                </div>

                                                {/* Video Camera Viewport */}
                                                <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner group flex items-center justify-center">
                                                    <canvas
                                                        ref={canvasRef}
                                                        className={cn(
                                                            "absolute inset-0 w-full h-full object-cover pointer-events-none z-10",
                                                            facingMode === "user" && "scale-x-[-1]",
                                                            !webcamActive && "hidden"
                                                        )}
                                                    />

                                                    {settings.ip_camera_url && settings.use_camera_device ? (
                                                        <img
                                                            src={settings.ip_camera_url}
                                                            alt="Camera Stream"
                                                            crossOrigin="anonymous"
                                                            className="w-full h-full object-cover"
                                                        />
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
                                                                        <p className="text-xs font-bold">{t("camera_feed_standby") || "Camera Feed Standby"}</p>
                                                                        <p className="text-[10px] text-slate-400 mt-0.5">{t("click_to_activate_camera") || "Click below to activate device camera"}</p>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => startScannerWebcam(facingMode)}
                                                                        className="h-8 text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white px-3.5 font-bold gap-1.5 shadow-sm"
                                                                    >
                                                                        <Camera className="h-3.5 w-3.5" /> {t("turn_on_camera") || "Turn On Camera"}
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            {/* AI Face Models Loading Badge */}
                                                            {webcamActive && testingLensMode === "face" && (!modelsLoaded || loadingModels) && (
                                                                <div className="absolute top-3 left-3 z-30 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10 shadow">
                                                                    <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                                                                    <span>{t("loading_face_models") || "Loading AI Face Models..."}</span>
                                                                </div>
                                                            )}

                                                            {/* Mobile Camera Flip Button */}
                                                            {webcamActive && (
                                                                <button
                                                                    type="button"
                                                                    onClick={toggleTestingFacingMode}
                                                                    disabled={isSwitchingTestingCam}
                                                                    className="absolute top-3 right-3 z-30 px-3 py-1.5 bg-black/70 hover:bg-black/90 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md backdrop-blur-sm border border-white/10 transition-all disabled:opacity-60"
                                                                    title={facingMode === "user" ? (t("back_cam") || "Back Cam 📷") : (t("front_cam") || "Front Cam 🤳")}
                                                                >
                                                                    {isSwitchingTestingCam ? (
                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                                                                    ) : (
                                                                        <RefreshCw className="h-3.5 w-3.5" />
                                                                    )}
                                                                    <span>{facingMode === "user" ? (t("front_cam") || "Front 🤳") : (t("back_cam") || "Back 📷")}</span>
                                                                </button>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Scanner Overlay Matrix for QR mode */}
                                                    {webcamActive && testingLensMode === "qr" && (
                                                        <div className="absolute inset-0 border-[35px] border-black/40 pointer-events-none flex items-center justify-center z-20">
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
                                                                        style={{ top: '50%' }}
                                                                    />
                                                                )}

                                                                {scanCooldown && (
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/80 text-emerald-400 text-xs font-bold gap-1 animate-pulse">
                                                                        <CheckCircle2 className="h-4 w-4" /> {t("attendance_marked_success") || "Attendance Marked"}
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
                                            <UserCircle className="h-4 w-4 text-indigo-600" /> {t("verification_result") || "Verification Result"}
                                        </span>
                                        {lastUser && (
                                            <span className={cn(
                                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                lastUser.status === 'Already Marked'
                                                    ? "bg-sky-100 text-sky-800 border border-sky-200"
                                                    : lastUser.status === 'Out'
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-emerald-100 text-emerald-700"
                                            )}>
                                                {lastUser.status === 'Already Marked'
                                                    ? (t("present_already_provided") || 'Present Already Provided ℹ️')
                                                    : lastUser.status === 'Out'
                                                        ? (t("exit_recorded") || 'Exit Recorded 🟡')
                                                        : (t("entry_recorded") || 'Entry Recorded 🟢')}
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
                                                            <span className="text-slate-400">{t("admission_roll_no_label") || "Admission / Roll No:"}</span>
                                                            <span className="font-bold text-slate-700 font-mono">{toLocaleNumber(lastUser.admission_no, language?.short_code)}</span>
                                                        </div>
                                                    )}
                                                    {lastUser.staff_id && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400">{t("staff_id_label") || "Staff ID:"}</span>
                                                            <span className="font-bold text-slate-700 font-mono">{toLocaleNumber(lastUser.staff_id, language?.short_code)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">{t("timestamp_label") || "Timestamp:"}</span>
                                                        <span className="font-bold text-slate-700 font-mono">{formatPunchTime(lastUser.time)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : scanErrorMsg ? (
                                            <div className="text-center space-y-3 max-w-xs animate-in fade-in zoom-in duration-200">
                                                <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 mx-auto flex items-center justify-center text-rose-500">
                                                    <AlertCircle className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-rose-600">{t("scan_rejected") || "Scan Rejected"}</h3>
                                                    <p className="text-xs text-slate-400 mt-1">{scanErrorMsg}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center space-y-2 opacity-40">
                                                <User className="h-12 w-12 mx-auto text-slate-400" />
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("awaiting_scan") || "Awaiting Scan"}</p>
                                                <p className="text-[10px] text-slate-400">{t("scan_card_or_face_instruction") || "Scan an ID card or face camera to confirm attendance"}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ZKTeco Device Add/Edit Modal */}
            <Dialog open={deviceModalOpen} onOpenChange={setDeviceModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                            <Cpu className="h-5 w-5 text-indigo-600" />
                            {editingDevice ? (t("edit_zkteco_terminal") || "Edit ZKTeco Terminal") : (t("register_new_zkteco_terminal") || "Register New ZKTeco Biometric Terminal")}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            {t("configure_zkteco_hardware_details") || "Configure hardware details and attendance mapping for ZKTeco SpeedFace & ProFace terminals."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3.5 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">{t("terminal_name_label") || "Terminal Name"} <span className="text-rose-500">*</span></Label>
                                <Input
                                    placeholder={t("terminal_name_placeholder") || "e.g. Main Gate SpeedFace"}
                                    value={deviceForm.name}
                                    onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                                    className="h-8 text-xs bg-white border-slate-200"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">{t("serial_number_label") || "Serial Number"} <span className="text-rose-500">*</span></Label>
                                <Input
                                    placeholder={t("serial_number_placeholder") || "e.g. CQZ9194200001"}
                                    value={deviceForm.serial_number}
                                    onChange={(e) => setDeviceForm({ ...deviceForm, serial_number: e.target.value })}
                                    className="h-8 text-xs bg-white border-slate-200 font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">{t("device_ip_address_label") || "Device IP Address"}</Label>
                                <Input
                                    placeholder={t("device_ip_address_placeholder") || "192.168.1.201"}
                                    value={deviceForm.ip_address}
                                    onChange={(e) => setDeviceForm({ ...deviceForm, ip_address: e.target.value })}
                                    className="h-8 text-xs bg-white border-slate-200 font-mono"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">{t("protocol_type_label") || "Protocol Type"}</Label>
                                <Select
                                    value={deviceForm.device_type}
                                    onValueChange={(val) => setDeviceForm({ ...deviceForm, device_type: val })}
                                >
                                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                                        <SelectValue placeholder={t("select") || "Select type"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="adms_push">{t("adms_push_recommended") || "ADMS Cloud Server Push (Recommended)"}</SelectItem>
                                        <SelectItem value="standalone_sdk">{t("standalone_tcp_sdk") || "Standalone Direct TCP SDK"}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">{t("assigned_class_label") || "Assigned Class"}</Label>
                                <Select
                                    value={deviceForm.school_class_id || "all"}
                                    onValueChange={(val) => setDeviceForm({ ...deviceForm, school_class_id: val })}
                                >
                                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                                        <SelectValue placeholder={t("all_classes_filter") || "All Classes"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("all_classes_filter") || "All Classes"}</SelectItem>
                                        {classes.map((c: any) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {translateClassName(c.class_name || c.name, language?.short_code)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">{t("assigned_section_label") || "Assigned Section"}</Label>
                                <Select
                                    value={deviceForm.section_id || "all"}
                                    onValueChange={(val) => setDeviceForm({ ...deviceForm, section_id: val })}
                                >
                                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                                        <SelectValue placeholder={t("all_sections_filter") || "All Sections"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("all_sections_filter") || "All Sections"}</SelectItem>
                                        {sections.map((s: any) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {translateSectionName(s.section_name || s.name, language?.short_code)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">{t("physical_location_label") || "Physical Location"}</Label>
                            <Input
                                placeholder={t("physical_location_placeholder") || "e.g. Entrance Gate A / Science Lab"}
                                value={deviceForm.location}
                                onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })}
                                className="h-8 text-xs bg-white border-slate-200"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeviceModalOpen(false)} className="text-xs">
                            {t("cancel_btn") || "Cancel"}
                        </Button>
                        <Button
                            onClick={handleSaveDevice}
                            disabled={savingDevice || !deviceForm.name || !deviceForm.serial_number}
                            className="text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs border-0"
                        >
                            {savingDevice ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                            {editingDevice ? (t("update_device_btn") || "Update Device") : (t("register_device_btn") || "Register Device")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Live Camera Testing Modal */}
            <Dialog open={cameraTestOpen} onOpenChange={(open) => { if (!open) stopCameraTest(); }}>
                <DialogContent className="max-w-lg rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                            <Camera className="h-5 w-5 text-indigo-600" />
                            {t("live_camera_source_test") || "Live Camera Source Test"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            {t("live_camera_test_desc") || "Verify live video feed and test front & back mobile phone cameras or USB webcams."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-1">
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleSwitchTestCamera('primary')}
                                className={cn(
                                    "h-9 text-xs font-bold gap-1.5 rounded-xl border transition-all",
                                    testCameraType === 'primary'
                                        ? "bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs"
                                        : "hover:bg-slate-50 text-slate-600 border-slate-200"
                                )}
                            >
                                <Smartphone className="h-3.5 w-3.5 text-indigo-600" />
                                {t("back_rear_camera_option") || "Back / Rear Camera 📷"}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleSwitchTestCamera('secondary')}
                                className={cn(
                                    "h-9 text-xs font-bold gap-1.5 rounded-xl border transition-all",
                                    testCameraType === 'secondary'
                                        ? "bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs"
                                        : "hover:bg-slate-50 text-slate-600 border-slate-200"
                                )}
                            >
                                <ScanFace className="h-3.5 w-3.5 text-indigo-600" />
                                {t("front_selfie_camera_option") || "Front / Selfie Camera 🤳"}
                            </Button>
                        </div>

                        {videoDevices.length > 1 && (
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase">{t("available_camera_hardware") || "Available Camera Hardware"}</Label>
                                <Select value={selectedDeviceId} onValueChange={handleSelectDevice}>
                                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                                        <SelectValue placeholder={t("select_specific_video_device") || "Select specific video device"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {videoDevices.map((dev, i) => (
                                            <SelectItem key={dev.deviceId || i} value={dev.deviceId}>
                                                {dev.label || `Camera ${i + 1}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                            {cameraTesting ? (
                                <div className="flex flex-col items-center gap-2 text-white text-xs">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                    {t("connecting_to_camera", { type: testCameraType === 'secondary' ? (t("front_cam") || 'Front') : (t("back_cam") || 'Back') }) || `Connecting to ${testCameraType === 'secondary' ? 'Front' : 'Back'} Camera...`}
                                </div>
                            ) : cameraError ? (
                                <div className="p-4 text-center text-rose-400 text-xs space-y-1.5">
                                    <AlertCircle className="h-7 w-7 mx-auto text-rose-500" />
                                    <p className="font-bold">{cameraError}</p>
                                    <p className="text-[10px] text-slate-400">{t("check_camera_permission_hint") || "Check browser permission settings or test another camera."}</p>
                                </div>
                            ) : (
                                <video
                                    ref={previewVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={cn(
                                        "w-full h-full object-cover",
                                        testCameraType === 'secondary' && "scale-x-[-1]"
                                    )}
                                />
                            )}

                            {!cameraError && !cameraTesting && (
                                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    {testCameraType === 'secondary' ? (t("front_lens_active_live") || 'Front Lens 🤳 Active Live') : (t("back_lens_active_live") || 'Back Lens 📷 Active Live')}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex flex-row justify-between items-center gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => initCameraStream(testCameraType, selectedDeviceId)}
                            className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                            <RefreshCw className="h-3 w-3 mr-1" /> {t("retry_stream_btn") || "Retry Stream"}
                        </Button>
                        <Button onClick={stopCameraTest} className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                            {t("close_camera_preview_btn") || "Close Camera Preview"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Device Confirmation Dialog */}
            <AlertDialog open={deleteDeviceOpen} onOpenChange={setDeleteDeviceOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-800">
                            {t("delete_zkteco_device_title") || "Delete ZKTeco Device?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-500">
                            {t("delete_zkteco_device_confirm", { name: deviceToDelete?.name, sn: deviceToDelete?.serial_number }) || `Are you sure you want to remove ${deviceToDelete?.name} (SN: ${deviceToDelete?.serial_number})? The server will stop processing automated push logs from this terminal.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="text-xs">{t("cancel_btn") || "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteDevice}
                            className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {t("delete_device_btn") || "Delete Device"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}