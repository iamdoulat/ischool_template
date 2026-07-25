"use client";

import { useState, useEffect } from "react";
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
  Activity, ArrowDownToLine, Server, ScanFace, Smartphone, Settings
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

/* ── Skeletons ─────────────────────────────────────────────── */
function SectionSkeleton() {
  return (
    <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
      <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
        <div className="h-9 w-9 rounded-lg bg-gray-200 animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-32 rounded bg-gray-200 animate-pulse" />
          <div className="h-2 w-48 rounded bg-gray-100 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 w-full rounded-lg bg-gray-100/60 animate-pulse" />
        ))}
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {[...Array(4)].map((_, i) => (
              <TableHead key={i}><div className="h-3 w-16 rounded bg-gray-200 animate-pulse" /></TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(4)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(4)].map((_, j) => (
                <TableCell key={j}><div className="h-3 w-20 rounded bg-gray-100 animate-pulse" /></TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ── Component ─────────────────────────────────────────────── */
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

    // Smart Attendance Method Toggles State (Moved from smart-attendance-settings)
    const [smartSettings, setSmartSettings] = useState({
        is_face_enabled: true,
        is_qr_enabled: true,
        is_nfc_enabled: true,
    });

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

    useEffect(() => {
        fetchSettings();
        fetchZkDevices();
        fetchAcademics();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const [qrRes, smartRes] = await Promise.all([
                api.get('/attendance/qr-settings'),
                api.get('/smart-attendance/settings').catch(() => null)
            ]);

            if (qrRes.data) {
                setSettings({
                    auto_attendance: !!qrRes.data.auto_attendance,
                    use_sensor_device: !!qrRes.data.use_sensor_device,
                    use_camera_device: !!qrRes.data.use_camera_device,
                    camera_type: qrRes.data.camera_type || "primary",
                    ip_camera_url: qrRes.data.ip_camera_url || "",
                    ip_camera_brand: qrRes.data.ip_camera_brand || "generic",
                    ip_camera_rtsp_transport: qrRes.data.ip_camera_rtsp_transport || "auto",
                    ip_camera_auth_enabled: !!qrRes.data.ip_camera_auth_enabled,
                    ip_camera_username: qrRes.data.ip_camera_username || "",
                    ip_camera_password: qrRes.data.ip_camera_password || "",
                    notify_in: qrRes.data.notify_in !== false,
                    notify_out: qrRes.data.notify_out !== false,
                    notify_sms: !!qrRes.data.notify_sms,
                    notify_whatsapp: !!qrRes.data.notify_whatsapp
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
            toast.error(t("failed_to_load_settings"));
        } finally {
            setLoading(false);
        }
    };

    const fetchZkDevices = async () => {
        try {
            const response = await api.get('/zkteco/devices');
            setZkDevices(extractArray(response));
        } catch (error) {
            console.error("Failed to load ZKTeco devices", error);
            setZkDevices([]);
        }
    };

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
                toast.success("ZKTeco Device added successfully!");
            }

            setDeviceModalOpen(false);
            fetchZkDevices();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save ZKTeco device");
        } finally {
            setSavingDevice(false);
        }
    };

    const handleDeleteDevice = async (id: number) => {
        if (!confirm("Are you sure you want to remove this ZKTeco device?")) return;
        try {
            await api.delete(`/zkteco/devices/${id}`);
            toast.success("ZKTeco Device removed.");
            fetchZkDevices();
        } catch {
            toast.error("Failed to delete device.");
        }
    };

    const handlePullLogs = async (id: number) => {
        setPullingDeviceId(id);
        try {
            const response = await api.post(`/zkteco/devices/${id}/pull`);
            toast.success(response.data?.message || "Data pulled successfully!");
            fetchZkDevices();
        } catch {
            toast.error("Failed to pull data from device.");
        } finally {
            setPullingDeviceId(null);
        }
    };

    const getAdmsUrl = () => {
        const envApiUrl = process.env.NEXT_PUBLIC_API_URL || api.defaults.baseURL;
        if (envApiUrl && /^https?:\/\//i.test(envApiUrl)) {
            const base = envApiUrl.replace(/\/$/, '');
            return `${base}/zkteco/cdata`;
        }
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

    const selectCamera = (camera: any) => {
        setSettings({ ...settings, ip_camera_url: camera.ip, ip_camera_brand: camera.brand === 'generic' ? 'generic' : camera.brand });
        setScanDialogOpen(false);
        toast.success(t("selected_camera", { name: camera.name }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                api.post('/attendance/qr-settings', settings),
                api.post('/smart-attendance/settings', smartSettings).catch(() => null)
            ]);
            toast.success("All Attendance & Device settings saved successfully!");
        } catch {
            toast.error(t("failed_to_save_settings"));
        } finally {
            setSaving(false);
        }
    };

    const SMART_METHODS = [
        { key: "is_face_enabled" as const, label: t("face_recognition"), desc: t("face_recognition_desc"), Icon: ScanFace, color: "text-blue-600 bg-blue-50 border-blue-100" },
        { key: "is_qr_enabled" as const, label: t("qr_code_scan"), desc: t("qr_code_scan_desc"), Icon: ScanLine, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
        { key: "is_nfc_enabled" as const, label: t("nfc_system"), desc: t("nfc_system_desc"), Icon: Smartphone, color: "text-purple-600 bg-purple-50 border-purple-100" },
    ];

    return (
        <div className="space-y-6">
            {/* Page header */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 max-w-5xl">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Settings2 className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("qr_attendance_protocol")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">Configure Smart Verification Methods & Hardware Interfaces</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t("save")}
                    </Button>
                </CardHeader>
            </Card>

            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
                    <SectionSkeleton />
                    <SectionSkeleton />
                </div>
            ) : (
                <div className="space-y-6 max-w-5xl">
                    {/* Smart Attendance Verification Methods (Merged Section) */}
                    <Card className="border-[0.5px] border-indigo-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-purple-50/80 via-indigo-50/60 to-blue-50/50 border-b border-indigo-100">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <Settings className="h-5 w-5" />
                                </span>
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-800 leading-none">{t("smart_attendance_settings")}</CardTitle>
                                    <p className="text-[11px] text-slate-500 mt-1">{t("toggle_methods_available")}</p>
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
                                            "flex items-center justify-between border rounded-xl p-4 transition-all duration-300 cursor-pointer select-none",
                                            smartSettings[key] ? "bg-indigo-50/50 border-indigo-200 shadow-sm" : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-2.5 rounded-lg border shrink-0 ${color}`}>
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

                    {/* ZKTeco Biometric / NFC Access Control Manager */}
                    <Card className="border-[0.5px] border-indigo-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-orange-50/50 border-b border-indigo-100">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#6366F1] text-white shadow-sm">
                                    <Cpu className="h-5 w-5" />
                                </span>
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-800 leading-none">ZKTeco Biometric / NFC ADMS System</CardTitle>
                                    <p className="text-[11px] text-slate-500 mt-1">Register ZKTeco Serial Numbers & ADMS Push data receivers for student attendance</p>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleOpenDeviceModal()}
                                className="h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold gap-1.5 shadow-sm"
                            >
                                <Plus className="h-3.5 w-3.5" /> Add ZKTeco Device
                            </Button>
                        </CardHeader>

                        <CardContent className="p-5 space-y-5">
                            {/* ADMS Push URL Notice Box */}
                            <div className="p-3.5 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                                        <Server className="h-3.5 w-3.5 text-indigo-600" />
                                        <span>ZKTeco ADMS / Push Server Listener Endpoint:</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 font-mono break-all">
                                        {getAdmsUrl()}
                                    </p>
                                    <p className="text-[10px] text-slate-500">Configure this HTTP Push URL in your ZKTeco device ADMS / Cloud settings or ZKBioAccess software.</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={copyAdmsUrl}
                                    className="h-8 text-[11px] border-indigo-200 text-indigo-700 hover:bg-indigo-100/70 shrink-0 gap-1.5"
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
                                        className="h-7 text-[10px] text-slate-500 hover:text-indigo-600"
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" /> Refresh List
                                    </Button>
                                </div>

                                {zkDevices.length === 0 ? (
                                    <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                        <Cpu className="h-8 w-8 mx-auto text-slate-300 mb-2 animate-bounce" />
                                        <p className="text-xs font-semibold text-slate-600">No ZKTeco hardware devices registered yet</p>
                                        <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                                            Click &quot;Add ZKTeco Device&quot; to enter your hardware serial number to map attendance to students by Class, Section, and Roll No.
                                        </p>
                                        <Button
                                            onClick={() => handleOpenDeviceModal()}
                                            variant="outline"
                                            className="mt-3 h-8 text-[11px] border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" /> Register First Device
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-slate-50/80">
                                                <TableRow className="border-b border-slate-200">
                                                    <TableHead className="text-[11px] font-bold text-slate-700">Device Name & Serial</TableHead>
                                                    <TableHead className="text-[11px] font-bold text-slate-700">Type & Location</TableHead>
                                                    <TableHead className="text-[11px] font-bold text-slate-700">Assigned Class / Sec</TableHead>
                                                    <TableHead className="text-[11px] font-bold text-slate-700">Status</TableHead>
                                                    <TableHead className="text-[11px] font-bold text-slate-700">Last Push</TableHead>
                                                    <TableHead className="text-[11px] font-bold text-slate-700 text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {Array.isArray(zkDevices) && zkDevices.map((dev) => (
                                                    <TableRow key={dev.id} className="hover:bg-slate-50/60">
                                                        <TableCell className="py-2.5">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-slate-800">{dev.name}</span>
                                                                <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                                                    SN: {dev.serial_number}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-2.5">
                                                            <div className="flex flex-col text-[11px] text-slate-600">
                                                                <span className="capitalize font-semibold text-slate-700">
                                                                    {dev.device_type === 'adms_push' ? 'Biometric ADMS Push' : dev.device_type}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {dev.location || dev.ip_address || "Default Location"}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-2.5">
                                                            <div className="text-[11px] text-slate-700 font-medium">
                                                                {dev.school_class ? (
                                                                    <span>
                                                                        {dev.school_class.class_name || dev.school_class.name} {dev.section ? `- ${dev.section.section_name || dev.section.name}` : ''}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 italic">All Classes (Global)</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-2.5">
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                                dev.is_online
                                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                                            )}>
                                                                <span className={cn("h-1.5 w-1.5 rounded-full", dev.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                                                                {dev.is_online ? "ONLINE" : "OFFLINE"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-2.5">
                                                            <div className="flex flex-col text-[10px] text-slate-500">
                                                                <span>{dev.last_push_at ? new Date(dev.last_push_at).toLocaleString() : "Never"}</span>
                                                                <span className="text-[9px] text-slate-400">{dev.push_count || 0} total pushes</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-2.5 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={pullingDeviceId === dev.id}
                                                                    onClick={() => handlePullLogs(dev.id)}
                                                                    className="h-7 text-[10px] px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
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
                                                                    onClick={() => handleDeleteDevice(dev.id)}
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

                    {/* Hardware Configuration & Processing Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Hardware Configuration */}
                        <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                            <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <Monitor className="h-4 w-4" />
                                </span>
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-800 leading-none">{t("hardware_configuration")}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-5">
                                {/* Devices */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div
                                        onClick={() => setSettings({ ...settings, use_sensor_device: !settings.use_sensor_device })}
                                        className={cn(
                                            "p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-2",
                                            settings.use_sensor_device ? "bg-indigo-50/50 border-indigo-200" : "bg-gray-50 border-gray-100 hover:border-gray-200"
                                        )}
                                    >
                                        <div className="flex justify-between items-center">
                                            <ScanLine className={cn("h-4 w-4", settings.use_sensor_device ? "text-indigo-600" : "text-gray-400")} />
                                            <Checkbox checked={settings.use_sensor_device} className="data-[state=checked]:bg-indigo-600 h-3 w-3" />
                                        </div>
                                        <h4 className="text-[10px] font-bold uppercase text-gray-800">{t("hid_nfc_sensor")}</h4>
                                    </div>

                                    <div
                                        onClick={() => setSettings({ ...settings, use_camera_device: !settings.use_camera_device })}
                                        className={cn(
                                            "p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-2",
                                            settings.use_camera_device ? "bg-indigo-50/50 border-indigo-200" : "bg-gray-50 border-gray-100 hover:border-gray-200"
                                        )}
                                    >
                                        <div className="flex justify-between items-center">
                                            <Camera className={cn("h-4 w-4", settings.use_camera_device ? "text-indigo-600" : "text-gray-400")} />
                                            <Checkbox checked={settings.use_camera_device} className="data-[state=checked]:bg-indigo-600 h-3 w-3" />
                                        </div>
                                        <h4 className="text-[10px] font-bold uppercase text-gray-800">{t("visual_camera")}</h4>
                                    </div>
                                </div>

                                {/* Camera Source */}
                                {settings.use_camera_device && (
                                    <div className="space-y-3 pt-2 border-t border-gray-100">
                                        <Label className="text-[10px] font-bold text-gray-600 uppercase">{t("camera_source")}</Label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="camera_type" value="primary" checked={settings.camera_type === 'primary'} onChange={(e) => setSettings({ ...settings, camera_type: e.target.value })} className="text-indigo-600" />
                                                <span className="text-[11px] font-medium text-gray-700">{t("back_primary")}</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="camera_type" value="secondary" checked={settings.camera_type === 'secondary'} onChange={(e) => setSettings({ ...settings, camera_type: e.target.value })} className="text-indigo-600" />
                                                <span className="text-[11px] font-medium text-gray-700">{t("front_secondary")}</span>
                                            </label>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold text-gray-600 uppercase">{t("camera_manufacturer")}</Label>
                                                <Select value={settings.ip_camera_brand} onValueChange={(val) => setSettings({ ...settings, ip_camera_brand: val })}>
                                                    <SelectTrigger className="h-8 text-[11px]">
                                                        <SelectValue placeholder={t("select_brand")} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="generic">{t("generic_direct_stream")}</SelectItem>
                                                        <SelectItem value="onvif">{t("onvif_standard")}</SelectItem>
                                                        <SelectItem value="hikvision">Hikvision</SelectItem>
                                                        <SelectItem value="dahua">Dahua</SelectItem>
                                                        <SelectItem value="zk">ZK (ZKTeco)</SelectItem>
                                                        <SelectItem value="foscam">Foscam</SelectItem>
                                                        <SelectItem value="esp32cam">ESP32-CAM</SelectItem>
                                                        <SelectItem value="tplink">TP-Link VIGI</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold text-gray-600 uppercase">{t("rtsp_transport")}</Label>
                                                <Select value={settings.ip_camera_rtsp_transport} onValueChange={(val) => setSettings({ ...settings, ip_camera_rtsp_transport: val })}>
                                                    <SelectTrigger className="h-8 text-[11px]">
                                                        <SelectValue placeholder={t("protocol")} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="auto">Auto</SelectItem>
                                                        <SelectItem value="tcp">TCP</SelectItem>
                                                        <SelectItem value="udp">UDP</SelectItem>
                                                        <SelectItem value="http">HTTP</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5">
                                                <Wifi className="h-3 w-3 text-gray-400" /> {t("ip_camera_address_url")}
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={settings.ip_camera_url}
                                                    onChange={(e) => setSettings({ ...settings, ip_camera_url: e.target.value })}
                                                    placeholder={t("ip_camera_address_placeholder")}
                                                    className="h-8 text-[11px] flex-1"
                                                />
                                                <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button type="button" variant="outline" className="h-8 text-[10px] border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex gap-1 items-center px-2">
                                                            <Network className="h-3 w-3" /> {t("scan")}
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-lg">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-sm flex items-center gap-2">
                                                                <Search className="h-4 w-4 text-indigo-500" />
                                                                {t("scan_network_for_ip_cameras")}
                                                            </DialogTitle>
                                                            <DialogDescription className="text-[11px]">
                                                                {t("enter_subnet_to_scan")}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                <Label className="text-[10px] font-bold text-gray-600 whitespace-nowrap">{t("subnet")}:</Label>
                                                                <Input value={scanSubnet} onChange={(e) => setScanSubnet(e.target.value)} placeholder={t("subnet_placeholder")} className="h-8 text-[11px] flex-1" disabled={scanning} />
                                                                <Button onClick={handleScanNetwork} disabled={scanning || !scanSubnet} className="h-8 text-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white px-3 flex gap-1 items-center">
                                                                    {scanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Network className="h-3 w-3" />}
                                                                    {scanning ? t("scanning") : t("start_scan")}
                                                                </Button>
                                                            </div>
                                                            {scanning && (
                                                                <div className="flex items-center gap-2 text-[11px] text-indigo-600 animate-pulse">
                                                                    <Loader2 className="h-3 w-3 animate-spin" /> {t("scanning_254_ips")}
                                                                </div>
                                                            )}
                                                            {discoveredCameras.length > 0 ? (
                                                                <TableSkeleton />
                                                            ) : !scanning && (
                                                                <p className="text-[10px] text-gray-400 text-center py-4">{t("no_cameras_found_try_different_subnet")}</p>
                                                            )}
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => setScanDialogOpen(false)} className="h-8 text-[10px]">{t("close")}</Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                            <p className="text-[9px] text-gray-400">{t("leave_empty_to_use_local_webcams")}</p>
                                        </div>

                                        {/* IP Camera Auth */}
                                        <div className="space-y-2 pt-2 border-t border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5">
                                                    <ShieldCheck className="h-3 w-3 text-gray-400" /> {t("ip_camera_authentication")}
                                                </Label>
                                                <Switch checked={settings.ip_camera_auth_enabled} onCheckedChange={(val) => setSettings({ ...settings, ip_camera_auth_enabled: val })} className="data-[state=checked]:bg-indigo-500 scale-75" />
                                            </div>
                                            {settings.ip_camera_auth_enabled && (
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[9px] font-bold text-gray-500 uppercase">{t("username")}</Label>
                                                        <Input value={settings.ip_camera_username || ''} onChange={(e) => setSettings({ ...settings, ip_camera_username: e.target.value })} placeholder="admin" className="h-7 text-[10px]" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[9px] font-bold text-gray-500 uppercase">{t("password")}</Label>
                                                        <Input type="password" value={settings.ip_camera_password || ''} onChange={(e) => setSettings({ ...settings, ip_camera_password: e.target.value })} placeholder="••••••••" className="h-7 text-[10px]" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Processing & Notifications */}
                        <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                            <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <QrCode className="h-4 w-4" />
                                </span>
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-800 leading-none">{t("processing_notifications")}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-6">
                                {/* Auto Attendance */}
                                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/30">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-gray-700 uppercase">{t("automated_entry")}</span>
                                        <span className="text-[10px] text-gray-400">{t("auto_submit_without_manual_click")}</span>
                                    </div>
                                    <Switch checked={settings.auto_attendance} onCheckedChange={(val) => setSettings({ ...settings, auto_attendance: val })} className="data-[state=checked]:bg-indigo-500" />
                                </div>

                                {/* Notification Triggers */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5 border-b border-gray-100 pb-2">
                                        <Bell className="h-3 w-3 text-indigo-500" /> {t("notification_triggers")}
                                    </Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                                            <Checkbox checked={settings.notify_in} onCheckedChange={(val) => setSettings({ ...settings, notify_in: !!val })} className="data-[state=checked]:bg-indigo-600" />
                                            <span className="text-[11px] font-medium text-gray-700">{t("attendance_in")}</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                                            <Checkbox checked={settings.notify_out} onCheckedChange={(val) => setSettings({ ...settings, notify_out: !!val })} className="data-[state=checked]:bg-indigo-600" />
                                            <span className="text-[11px] font-medium text-gray-700">{t("attendance_out")}</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Action Channels */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-bold text-gray-600 uppercase border-b border-gray-100 pb-2 flex items-center gap-1.5">
                                        <MessageSquare className="h-3 w-3 text-emerald-500" /> {t("action_channels")}
                                    </Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            onClick={() => setSettings({ ...settings, notify_sms: !settings.notify_sms })}
                                            className={cn(
                                                "p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-2",
                                                settings.notify_sms ? "bg-indigo-50/50 border-indigo-200" : "bg-gray-50 border-gray-100 hover:border-gray-200"
                                            )}
                                        >
                                            <div className="flex justify-between items-center">
                                                <MessageSquare className={cn("h-4 w-4", settings.notify_sms ? "text-indigo-600" : "text-gray-400")} />
                                                <Checkbox checked={settings.notify_sms} className="data-[state=checked]:bg-indigo-600 h-3 w-3" />
                                            </div>
                                            <h4 className="text-[10px] font-bold uppercase text-gray-800">{t("send_sms")}</h4>
                                        </div>

                                        <div
                                            onClick={() => setSettings({ ...settings, notify_whatsapp: !settings.notify_whatsapp })}
                                            className={cn(
                                                "p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-2",
                                                settings.notify_whatsapp ? "bg-emerald-50/50 border-emerald-200" : "bg-gray-50 border-gray-100 hover:border-gray-200"
                                            )}
                                        >
                                            <div className="flex justify-between items-center">
                                                <Phone className={cn("h-4 w-4", settings.notify_whatsapp ? "text-emerald-600" : "text-gray-400")} />
                                                <Checkbox checked={settings.notify_whatsapp} className="data-[state=checked]:bg-emerald-600 h-3 w-3" />
                                            </div>
                                            <h4 className="text-[10px] font-bold uppercase text-gray-800">{t("whatsapp_alert")}</h4>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Modal Dialog to Register / Edit ZKTeco Device */}
            <Dialog open={deviceModalOpen} onOpenChange={setDeviceModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold flex items-center gap-2 text-indigo-900">
                            <Cpu className="h-4 w-4 text-indigo-600" />
                            {editingDevice ? "Edit ZKTeco Device" : "Register New ZKTeco Device"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Enter the hardware Serial Number to collect fingerprint/NFC attendance and map to students by Class & Section.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3.5 py-2">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Device Name <span className="text-rose-500">*</span></Label>
                            <Input
                                value={deviceForm.name}
                                onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                                placeholder="e.g. Main Gate Biometric Terminal"
                                className="h-8 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Serial Number (SN) <span className="text-rose-500">*</span></Label>
                                <Input
                                    value={deviceForm.serial_number}
                                    onChange={(e) => setDeviceForm({ ...deviceForm, serial_number: e.target.value })}
                                    placeholder="e.g. C26690330012"
                                    className="h-8 text-xs font-mono"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Protocol Type</Label>
                                <Select
                                    value={deviceForm.device_type}
                                    onValueChange={(val) => setDeviceForm({ ...deviceForm, device_type: val })}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="adms_push">ZK ADMS Push Protocol</SelectItem>
                                        <SelectItem value="fingerprint">Fingerprint Biometric</SelectItem>
                                        <SelectItem value="nfc">NFC / RFID Card</SelectItem>
                                        <SelectItem value="face_nfc">Face + NFC Combo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">IP Address (Optional)</Label>
                                <Input
                                    value={deviceForm.ip_address}
                                    onChange={(e) => setDeviceForm({ ...deviceForm, ip_address: e.target.value })}
                                    placeholder="e.g. 192.168.1.201"
                                    className="h-8 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Location / Room</Label>
                                <Input
                                    value={deviceForm.location}
                                    onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })}
                                    placeholder="e.g. Front Gate / Academic Block A"
                                    className="h-8 text-xs"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Map to Class (Optional)</Label>
                                <Select
                                    value={deviceForm.school_class_id}
                                    onValueChange={(val) => setDeviceForm({ ...deviceForm, school_class_id: val })}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="All Classes (Global)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes (Global)</SelectItem>
                                        {Array.isArray(classes) && classes.map((cls: any) => (
                                            <SelectItem key={cls.id} value={String(cls.id)}>
                                                {cls.class_name || cls.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Map to Section (Optional)</Label>
                                <Select
                                    value={deviceForm.section_id}
                                    onValueChange={(val) => setDeviceForm({ ...deviceForm, section_id: val })}
                                >
                                    <SelectTrigger className="h-8 text-xs">
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
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Notes / Setup Info</Label>
                            <Textarea
                                value={deviceForm.notes}
                                onChange={(e) => setDeviceForm({ ...deviceForm, notes: e.target.value })}
                                placeholder="Device location or configuration notes..."
                                className="h-16 text-xs resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeviceModalOpen(false)}
                            className="h-8 text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveDevice}
                            disabled={savingDevice}
                            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4"
                        >
                            {savingDevice ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                            {editingDevice ? "Update Device" : "Save ZKTeco Device"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}