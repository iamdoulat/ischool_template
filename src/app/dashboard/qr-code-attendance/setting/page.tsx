"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Sparkles, CheckCircle, Zap, Globe, Lock, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Defensive Array Extractor ───────────────────────────────── */
const extractArray = (res: any): any[] => {
    if (Array.isArray(res?.data?.data?.data)) return res.data.data.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
};

export default function QrCodeSettingPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [scanDialogOpen, setScanDialogOpen] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scanSubnet, setScanSubnet] = useState("192.168.1");
    const [discoveredCameras, setDiscoveredCameras] = useState<any[]>([]);

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

    // Camera Live Test Modal
    const [cameraTestOpen, setCameraTestOpen] = useState(false);
    const [cameraTesting, setCameraTesting] = useState(false);
    const [testingStream, setTestingStream] = useState<MediaStream | null>(null);
    const previewVideoRef = useRef<HTMLVideoElement | null>(null);

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

    const [settings, setSettings] = useState({
        auto_attendance: false,
        use_sensor_device: true,
        use_camera_device: true,
        camera_type: "primary",
        ip_camera_url: "",
        ip_camera_brand: "generic",
        ip_camera_rtsp_transport: "auto",
        ip_camera_auth_enabled: false,
        ip_camera_username: "",
        ip_camera_password: "",
        notify_in: true,
        notify_out: true,
        notify_sms: false,
        notify_whatsapp: false
    });

    const { t } = useTranslation();

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const [qrRes, smartRes] = await Promise.all([
                api.get('/attendance/qr-settings'),
                api.get('/smart-attendance/settings').catch(() => null)
            ]);

            if (qrRes.data) {
                const qd = qrRes.data?.data || qrRes.data;
                setSettings({
                    auto_attendance: !!qd.auto_attendance,
                    use_sensor_device: qd.use_sensor_device !== false,
                    use_camera_device: qd.use_camera_device !== false,
                    camera_type: qd.camera_type || "primary",
                    ip_camera_url: qd.ip_camera_url || "",
                    ip_camera_brand: qd.ip_camera_brand || "generic",
                    ip_camera_rtsp_transport: qd.ip_camera_rtsp_transport || "auto",
                    ip_camera_auth_enabled: !!qd.ip_camera_auth_enabled,
                    ip_camera_username: qd.ip_camera_username || "",
                    ip_camera_password: qd.ip_camera_password || "",
                    notify_in: qd.notify_in !== false,
                    notify_out: qd.notify_out !== false,
                    notify_sms: !!qd.notify_sms,
                    notify_whatsapp: !!qd.notify_whatsapp
                });
            }

            if (smartRes?.data) {
                const smartData = smartRes.data?.data?.data || smartRes.data?.data;
                if (smartData) {
                    setSmartSettings({
                        is_face_enabled: smartData.is_face_enabled !== false,
                        is_qr_enabled: smartData.is_qr_enabled !== false,
                        is_nfc_enabled: smartData.is_nfc_enabled !== false,
                    });
                }
            }
        } catch {
            toast.error(t("failed_to_load_settings") || "Failed to load attendance settings");
        } finally {
            setLoading(false);
        }
    }, [t]);

    const fetchZkDevices = useCallback(async () => {
        try {
            const response = await api.get('/zkteco/devices');
            setZkDevices(extractArray(response));
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

    useEffect(() => {
        fetchSettings();
        fetchZkDevices();
        fetchAcademics();
    }, [fetchSettings, fetchZkDevices, fetchAcademics]);

    // Live Camera Test
    const startCameraTest = async () => {
        setCameraTestOpen(true);
        setCameraTesting(true);
        try {
            const facingMode = settings.camera_type === 'secondary' ? 'user' : 'environment';
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
            setTestingStream(stream);
            if (previewVideoRef.current) {
                previewVideoRef.current.srcObject = stream;
                previewVideoRef.current.play().catch(() => {});
            }
        } catch (err: any) {
            toast.error("Could not access camera: " + (err.message || "Permission denied"));
        } finally {
            setCameraTesting(false);
        }
    };

    const stopCameraTest = () => {
        if (testingStream) {
            testingStream.getTracks().forEach(track => track.stop());
            setTestingStream(null);
        }
        if (previewVideoRef.current) {
            previewVideoRef.current.srcObject = null;
        }
        setCameraTestOpen(false);
    };

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
                port: parseInt(deviceForm.port) || 4370,
                school_class_id: deviceForm.school_class_id && deviceForm.school_class_id !== 'all' ? parseInt(deviceForm.school_class_id) : null,
                section_id: deviceForm.section_id && deviceForm.section_id !== 'all' ? parseInt(deviceForm.section_id) : null,
            };

            if (editingDevice) {
                await api.put(`/zkteco/devices/${editingDevice.id}`, payload);
                toast.success("ZKTeco Device updated successfully!");
            } else {
                await api.post('/zkteco/devices', payload);
                toast.success("ZKTeco Device registered successfully!");
            }

            setDeviceModalOpen(false);
            fetchZkDevices();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save ZKTeco device");
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
            toast.success("ZKTeco Device removed.");
            setDeleteDeviceOpen(false);
            setDeviceToDelete(null);
            fetchZkDevices();
        } catch {
            toast.error("Failed to delete device.");
        }
    };

    const handlePullLogs = async (id: number) => {
        setPullingDeviceId(id);
        try {
            const response = await api.post(`/zkteco/devices/${id}/pull`);
            toast.success(response.data?.message || "Logs synchronized from device!");
            fetchZkDevices();
        } catch {
            toast.error("Failed to pull data from device.");
        } finally {
            setPullingDeviceId(null);
        }
    };

    const getAdmsUrl = () => {
        if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/api/v1/zkteco/cdata`;
        }
        return "/api/v1/zkteco/cdata";
    };

    const copyAdmsUrl = () => {
        const url = getAdmsUrl();
        navigator.clipboard.writeText(url);
        setCopiedUrl(true);
        toast.success("ADMS Push URL copied to clipboard!");
        setTimeout(() => setCopiedUrl(false), 3000);
    };

    const handleScanNetwork = async () => {
        setScanning(true);
        setDiscoveredCameras([]);
        try {
            const response = await api.post('/attendance/discover-cameras', { subnet: scanSubnet });
            setDiscoveredCameras(extractArray(response));
            toast.success(t("scan_complete_cameras_found", { message: response.data.message || 'cameras found' }));
        } catch {
            toast.error(t("network_scan_failed"));
        } finally {
            setScanning(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                api.post('/attendance/qr-settings', settings),
                api.post('/smart-attendance/settings', smartSettings).catch(() => null)
            ]);
            toast.success("All Attendance Protocol & Hardware settings saved successfully!");
        } catch {
            toast.error(t("failed_to_save_settings") || "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const SMART_METHODS = [
        {
            key: "is_face_enabled" as const,
            label: "AI Face Recognition",
            desc: "SSD MobileNet facial vectors and Visible Light face devices",
            Icon: ScanFace,
            color: "text-blue-600 bg-blue-50 border-blue-100"
        },
        {
            key: "is_qr_enabled" as const,
            label: "High-Speed QR Code",
            desc: "Encrypted student card QR code scanning with optical lasers",
            Icon: ScanLine,
            color: "text-emerald-600 bg-emerald-50 border-emerald-100"
        },
        {
            key: "is_nfc_enabled" as const,
            label: "NFC & Smart RFID",
            desc: "13.56MHz MIFARE & 125kHz EM4100 contactless tap cards",
            Icon: Smartphone,
            color: "text-purple-600 bg-purple-50 border-purple-100"
        },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-4 sm:py-6 font-sans">
            {/* Master Page Header */}
            <div className="rounded-2xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#EFF0FD] to-indigo-50/60">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <Settings2 className="h-6 w-6" />
                        </span>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                                Smart Attendance & Hardware Settings
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                    System Protocols
                                </span>
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                Configure biometric verification methods, ZKTeco ADMS push devices, mobile camera lens orientation, and event notifications.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all self-end sm:self-center"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save All Settings
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse p-6" />
                    <div className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse p-6" />
                </div>
            ) : (
                <div className="space-y-6 w-full">
                    {/* 1. Smart Attendance Biometric Methods Switcher */}
                    <Card className="border border-slate-200 shadow-xs rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="flex flex-row items-center justify-between gap-2.5 px-5 py-4 bg-slate-50/70 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                    <Sparkles className="h-5 w-5" />
                                </span>
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-800 leading-none">AI & Biometric Verification Methods</CardTitle>
                                    <p className="text-[11px] text-slate-500 mt-1">Select which authentication modes are accessible on kiosk terminals and mobile scanners</p>
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
                                            "flex items-center justify-between border rounded-2xl p-4 transition-all duration-200 cursor-pointer select-none",
                                            smartSettings[key] ? "bg-indigo-50/40 border-indigo-200 shadow-xs" : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-2.5 rounded-xl border shrink-0 ${color}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <Label className="text-xs font-bold text-slate-800 cursor-pointer">{label}</Label>
                                                <p className="text-[10px] text-slate-500 line-clamp-1">{desc}</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={smartSettings[key]}
                                            onCheckedChange={(c) => setSmartSettings({ ...smartSettings, [key]: c })}
                                            className="data-[state=checked]:bg-indigo-600 shrink-0 ml-2"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. ZKTeco Biometric / Visible Light Face Device Manager */}
                    <Card className="border border-slate-200 shadow-xs rounded-2xl overflow-hidden bg-white">
                        <CardHeader className="flex flex-row items-center justify-between gap-2.5 px-5 py-4 bg-slate-50/70 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#6366F1] text-white shadow-xs">
                                    <Cpu className="h-5 w-5" />
                                </span>
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-800 leading-none">ZKTeco Biometric & Face Terminal Manager</CardTitle>
                                    <p className="text-[11px] text-slate-500 mt-1">Register SpeedFace, ProFace, SenseFace, uFace, & MB20 series ADMS hardware devices</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleOpenDeviceModal()}
                                className="h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-xs"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add ZKTeco Device
                            </Button>
                        </CardHeader>

                        <CardContent className="p-5 space-y-5">
                            {/* ADMS Push URL Notice Box */}
                            <div className="p-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                                        <Server className="h-4 w-4 text-indigo-600" />
                                        <span>ZKTeco Cloud ADMS Push Listener Endpoint:</span>
                                    </div>
                                    <p className="text-xs text-indigo-800 font-mono select-all bg-white/80 px-2 py-1 rounded border border-indigo-200 inline-block">
                                        {getAdmsUrl()}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        Configure this HTTP endpoint in your ZKTeco device ADMS / Cloud Server menu or ZKBioAccess software.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={copyAdmsUrl}
                                    className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-100/70 shrink-0 gap-1.5 bg-white"
                                >
                                    {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                    {copiedUrl ? "Copied!" : "Copy Push URL"}
                                </Button>
                            </div>

                            {/* Registered Devices Table */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <HardDrive className="h-3.5 w-3.5 text-indigo-600" /> Registered ZKTeco Hardware ({zkDevices.length})
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={fetchZkDevices}
                                        className="h-7 text-[11px] text-slate-500 hover:text-indigo-600"
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" /> Refresh List
                                    </Button>
                                </div>

                                {zkDevices.length === 0 ? (
                                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                        <Cpu className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                                        <p className="text-xs font-bold text-slate-600">No ZKTeco hardware devices registered yet</p>
                                        <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                                            Register your device serial number to route attendance punches to specific Classes and Sections automatically.
                                        </p>
                                        <Button
                                            onClick={() => handleOpenDeviceModal()}
                                            variant="outline"
                                            className="mt-3 h-8 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" /> Register First Device
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                                        <Table>
                                            <TableHeader className="bg-slate-50/80">
                                                <TableRow className="border-b border-slate-200">
                                                    <TableHead className="text-xs font-bold text-slate-700 py-3">Device Name & Serial</TableHead>
                                                    <TableHead className="text-xs font-bold text-slate-700">Type & Location</TableHead>
                                                    <TableHead className="text-xs font-bold text-slate-700">Assigned Class / Section</TableHead>
                                                    <TableHead className="text-xs font-bold text-slate-700">Status</TableHead>
                                                    <TableHead className="text-xs font-bold text-slate-700">Last Push</TableHead>
                                                    <TableHead className="text-xs font-bold text-slate-700 text-right pr-6">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="divide-y divide-slate-100">
                                                {Array.isArray(zkDevices) && zkDevices.map((dev) => (
                                                    <TableRow key={dev.id} className="hover:bg-slate-50/60">
                                                        <TableCell className="py-3">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-slate-800">{dev.name}</span>
                                                                <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded w-fit mt-0.5 border border-indigo-100">
                                                                    SN: {dev.serial_number}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3">
                                                            <div className="flex flex-col text-xs text-slate-600">
                                                                <span className="capitalize font-semibold text-slate-700">
                                                                    {dev.device_type === 'adms_push' ? 'Visible Light Face / ADMS Push' : dev.device_type}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {dev.location || dev.ip_address || "Entrance Gate"}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3">
                                                            <div className="text-xs text-slate-700 font-medium">
                                                                {dev.school_class ? (
                                                                    <span>
                                                                        Class {dev.school_class.class_name || dev.school_class.name} {dev.section ? `(${dev.section.section_name || dev.section.name})` : ''}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 italic">Global / All Classes</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3">
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                                                dev.is_online
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                                            )}>
                                                                <span className={cn("h-1.5 w-1.5 rounded-full", dev.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                                                                {dev.is_online ? "ONLINE" : "OFFLINE"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-3">
                                                            <div className="flex flex-col text-[11px] text-slate-500">
                                                                <span>{dev.last_push_at ? new Date(dev.last_push_at).toLocaleTimeString() : "Never"}</span>
                                                                <span className="text-[9px] text-slate-400">{dev.push_count || 0} total logs</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3 text-right pr-6">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={pullingDeviceId === dev.id}
                                                                    onClick={() => handlePullLogs(dev.id)}
                                                                    className="h-7 text-xs px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                                                    title="Pull & reprocess device attendance logs"
                                                                >
                                                                    {pullingDeviceId === dev.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowDownToLine className="h-3 w-3" />}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenDeviceModal(dev)}
                                                                    className="h-7 w-7 p-0 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => confirmDeleteDevice(dev)}
                                                                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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

                    {/* 3. Camera Source & Notification Settings Split Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Camera Source & Lens Orientation */}
                        <Card className="border border-slate-200 shadow-xs rounded-2xl overflow-hidden bg-white">
                            <CardHeader className="flex flex-row items-center gap-2.5 px-5 py-4 bg-slate-50/70 border-b border-slate-100">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                    <Camera className="h-5 w-5" />
                                </span>
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-800 leading-none">Camera & Lens Configuration</CardTitle>
                                    <p className="text-[11px] text-slate-500 mt-1">Configure mobile front/back camera orientation and IP streams</p>
                                </div>
                            </CardHeader>

                            <CardContent className="p-5 space-y-5">
                                {/* Hardware Toggles */}
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
                                            <h4 className="text-xs font-bold text-slate-800">USB / Sensor Device</h4>
                                            <p className="text-[10px] text-slate-400">Barcode scanner & RFID cards</p>
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
                                            <h4 className="text-xs font-bold text-slate-800">Visual Camera</h4>
                                            <p className="text-[10px] text-slate-400">Mobile lens & IP cameras</p>
                                        </div>
                                    </div>
                                </div>

                                {settings.use_camera_device && (
                                    <div className="space-y-4 pt-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                                <Smartphone className="h-3.5 w-3.5 text-indigo-600" /> Default Camera Lens
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={startCameraTest}
                                                className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1"
                                            >
                                                <Camera className="h-3 w-3" /> Test Camera Feed
                                            </Button>
                                        </div>

                                        {/* Camera Lens Orientation Selector */}
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
                                                    <p className="text-xs font-bold leading-tight">Back Camera 📷</p>
                                                    <p className="text-[10px] text-slate-500">For phone scanning student badges</p>
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
                                                    <p className="text-xs font-bold leading-tight">Front Camera 🤳</p>
                                                    <p className="text-[10px] text-slate-500">For tablet / iPad desk kiosks</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* IP Camera RTSP / HTTP Stream Option */}
                                        <div className="space-y-3 pt-3 border-t border-slate-100">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                    <Wifi className="h-3.5 w-3.5 text-indigo-600" /> External IP Camera Stream URL (Optional)
                                                </Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={settings.ip_camera_url}
                                                        onChange={(e) => setSettings({ ...settings, ip_camera_url: e.target.value })}
                                                        placeholder="Leave empty for device/phone camera or http://192.168.1.100"
                                                        className="h-9 text-xs flex-1 bg-white border-slate-200"
                                                    />
                                                    <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
                                                        <DialogTrigger asChild>
                                                            <Button type="button" variant="outline" className="h-9 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex gap-1 items-center px-3">
                                                                <Network className="h-3.5 w-3.5" /> Scan Network
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-lg rounded-2xl">
                                                            <DialogHeader>
                                                                <DialogTitle className="text-sm flex items-center gap-2">
                                                                    <Search className="h-4 w-4 text-indigo-500" />
                                                                    Scan Local Subnet for IP Cameras
                                                                </DialogTitle>
                                                                <DialogDescription className="text-xs">
                                                                    Discover ONVIF and RTSP streaming cameras on your local network
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
                                                                        {scanning ? "Scanning..." : "Start Scan"}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button variant="outline" onClick={() => setScanDialogOpen(false)} className="text-xs">Close</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                                <p className="text-[10px] text-emerald-600 font-medium">
                                                    ✨ Leave empty to automatically use your phone, iPad, or computer webcam.
                                                </p>
                                            </div>

                                            {settings.ip_camera_url && (
                                                <div className="grid grid-cols-2 gap-3 pt-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Manufacturer Brand</Label>
                                                        <Select value={settings.ip_camera_brand} onValueChange={(val) => setSettings({ ...settings, ip_camera_brand: val })}>
                                                            <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                                                                <SelectValue placeholder="Brand" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="generic">Generic Direct Stream</SelectItem>
                                                                <SelectItem value="onvif">ONVIF Standard</SelectItem>
                                                                <SelectItem value="hikvision">Hikvision</SelectItem>
                                                                <SelectItem value="dahua">Dahua</SelectItem>
                                                                <SelectItem value="zk">ZKTeco</SelectItem>
                                                                <SelectItem value="tplink">TP-Link VIGI</SelectItem>
                                                                <SelectItem value="esp32cam">ESP32-CAM</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Transport Protocol</Label>
                                                        <Select value={settings.ip_camera_rtsp_transport} onValueChange={(val) => setSettings({ ...settings, ip_camera_rtsp_transport: val })}>
                                                            <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                                                                <SelectValue placeholder="Protocol" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="auto">Auto Protocol</SelectItem>
                                                                <SelectItem value="tcp">TCP Transport</SelectItem>
                                                                <SelectItem value="udp">UDP Transport</SelectItem>
                                                                <SelectItem value="http">HTTP Streaming</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            )}
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
                                    <CardTitle className="text-sm font-bold text-slate-800 leading-none">Automated Entry & Notifications</CardTitle>
                                    <p className="text-[11px] text-slate-500 mt-1">Configure auto attendance recording and parent/staff alerts</p>
                                </div>
                            </CardHeader>

                            <CardContent className="p-5 space-y-5">
                                {/* Auto Attendance Card */}
                                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                            <Zap className="h-3.5 w-3.5 text-amber-500" /> Automated Auto-Entry Recording
                                        </span>
                                        <span className="text-[10px] text-slate-400 mt-0.5">
                                            Auto-submit and log attendance immediately upon card swipe or face recognition without manual clicks
                                        </span>
                                    </div>
                                    <Switch
                                        checked={settings.auto_attendance}
                                        onCheckedChange={(val) => setSettings({ ...settings, auto_attendance: val })}
                                        className="data-[state=checked]:bg-indigo-600"
                                    />
                                </div>

                                {/* Event Triggers */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                        <Bell className="h-3.5 w-3.5 text-indigo-500" /> Notification Event Triggers
                                    </Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-slate-50/70 hover:bg-slate-100/60 rounded-xl border border-slate-200 transition-all">
                                            <Checkbox
                                                checked={settings.notify_in}
                                                onCheckedChange={(val) => setSettings({ ...settings, notify_in: !!val })}
                                                className="data-[state=checked]:bg-indigo-600"
                                            />
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">Check-in (In Event)</p>
                                                <p className="text-[10px] text-slate-400">Notify upon arrival</p>
                                            </div>
                                        </label>

                                        <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-slate-50/70 hover:bg-slate-100/60 rounded-xl border border-slate-200 transition-all">
                                            <Checkbox
                                                checked={settings.notify_out}
                                                onCheckedChange={(val) => setSettings({ ...settings, notify_out: !!val })}
                                                className="data-[state=checked]:bg-indigo-600"
                                            />
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">Check-out (Out Event)</p>
                                                <p className="text-[10px] text-slate-400">Notify upon departure</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Action Channels */}
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <Label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                        <MessageSquare className="h-3.5 w-3.5 text-emerald-500" /> Alert Delivery Channels
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
                                                    <p className="text-xs font-bold text-slate-800">SMS Gateway</p>
                                                    <p className="text-[10px] text-slate-400">Direct mobile text</p>
                                                </div>
                                            </div>
                                            <Checkbox checked={settings.notify_sms} className="data-[state=checked]:bg-indigo-600 h-3.5 w-3.5" />
                                        </div>

                                        <div
                                            onClick={() => setSettings({ ...settings, notify_whatsapp: !settings.notify_whatsapp })}
                                            className={cn(
                                                "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                                                settings.notify_whatsapp ? "bg-indigo-50/50 border-indigo-200 shadow-xs" : "bg-slate-50/70 border-slate-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className={cn("h-4 w-4", settings.notify_whatsapp ? "text-emerald-600" : "text-slate-400")} />
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">WhatsApp Alert</p>
                                                    <p className="text-[10px] text-slate-400">Instant parent message</p>
                                                </div>
                                            </div>
                                            <Checkbox checked={settings.notify_whatsapp} className="data-[state=checked]:bg-indigo-600 h-3.5 w-3.5" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* ZKTeco Device Registration & Edit Modal */}
            <Dialog open={deviceModalOpen} onOpenChange={setDeviceModalOpen}>
                <DialogContent className="max-w-md rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                            <Cpu className="h-5 w-5 text-indigo-600" />
                            {editingDevice ? "Edit ZKTeco Hardware Terminal" : "Register New ZKTeco Device"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Enter the hardware serial number to bind attendance push records from this terminal.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3.5 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Device Name <span className="text-rose-500">*</span></Label>
                            <Input
                                placeholder="e.g. Main Gate SpeedFace V5L"
                                value={deviceForm.name}
                                onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                                className="h-8 text-xs bg-white border-slate-200"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Serial Number (SN) <span className="text-rose-500">*</span></Label>
                            <Input
                                placeholder="e.g. BKT7194600123"
                                value={deviceForm.serial_number}
                                onChange={(e) => setDeviceForm({ ...deviceForm, serial_number: e.target.value.trim() })}
                                className="h-8 text-xs font-mono uppercase bg-white border-slate-200"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">IP Address (Optional)</Label>
                                <Input
                                    placeholder="192.168.1.201"
                                    value={deviceForm.ip_address}
                                    onChange={(e) => setDeviceForm({ ...deviceForm, ip_address: e.target.value })}
                                    className="h-8 text-xs bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Port</Label>
                                <Input
                                    placeholder="4370"
                                    value={deviceForm.port}
                                    onChange={(e) => setDeviceForm({ ...deviceForm, port: e.target.value })}
                                    className="h-8 text-xs bg-white border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Assigned Class</Label>
                                <Select
                                    value={deviceForm.school_class_id || "all"}
                                    onValueChange={(val) => setDeviceForm({ ...deviceForm, school_class_id: val })}
                                >
                                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                                        <SelectValue placeholder="All Classes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes (Global)</SelectItem>
                                        {classes.map((c: any) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.class_name || c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Assigned Section</Label>
                                <Select
                                    value={deviceForm.section_id || "all"}
                                    onValueChange={(val) => setDeviceForm({ ...deviceForm, section_id: val })}
                                >
                                    <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                                        <SelectValue placeholder="All Sections" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sections</SelectItem>
                                        {sections.map((s: any) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.section_name || s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Physical Location</Label>
                            <Input
                                placeholder="e.g. Entrance Gate A / Science Lab"
                                value={deviceForm.location}
                                onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })}
                                className="h-8 text-xs bg-white border-slate-200"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeviceModalOpen(false)} className="text-xs">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveDevice}
                            disabled={savingDevice || !deviceForm.name || !deviceForm.serial_number}
                            className="text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                        >
                            {savingDevice ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                            {editingDevice ? "Update Device" : "Register Device"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Live Camera Testing Modal */}
            <Dialog open={cameraTestOpen} onOpenChange={(open) => { if (!open) stopCameraTest(); }}>
                <DialogContent className="max-w-md rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                            <Camera className="h-5 w-5 text-indigo-600" />
                            Live Camera Source Test
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Verifying live video feed from {settings.camera_type === 'secondary' ? 'Front / Selfie Camera' : 'Back / Rear Camera'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center my-2 border border-slate-800">
                        {cameraTesting ? (
                            <div className="flex flex-col items-center gap-2 text-white text-xs">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                Initializing video stream...
                            </div>
                        ) : (
                            <video
                                ref={previewVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className={cn("w-full h-full object-cover", settings.camera_type === 'secondary' && "scale-x-[-1]")}
                            />
                        )}
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {settings.camera_type === 'secondary' ? 'Front / Selfie Lens 🤳' : 'Back / Rear Lens 📷'}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={stopCameraTest} className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white w-full">
                            Close Camera Preview
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Device Confirmation Dialog */}
            <AlertDialog open={deleteDeviceOpen} onOpenChange={setDeleteDeviceOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-slate-800">
                            Delete ZKTeco Device?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-slate-500">
                            Are you sure you want to remove <strong>{deviceToDelete?.name}</strong> (SN: <code>{deviceToDelete?.serial_number}</code>)? The server will stop processing automated push logs from this terminal.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteDevice}
                            className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            Delete Device
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}