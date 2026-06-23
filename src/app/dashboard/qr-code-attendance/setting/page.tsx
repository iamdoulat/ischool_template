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
  Search, Network, CheckCircle2, Loader2, Nfc,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/attendance/qr-settings');
            if (response.data) {
                setSettings({
                    auto_attendance: !!response.data.auto_attendance,
                    use_sensor_device: !!response.data.use_sensor_device,
                    use_camera_device: !!response.data.use_camera_device,
                    camera_type: response.data.camera_type || "primary",
                    ip_camera_url: response.data.ip_camera_url || "",
                    ip_camera_brand: response.data.ip_camera_brand || "generic",
                    ip_camera_rtsp_transport: response.data.ip_camera_rtsp_transport || "auto",
                    ip_camera_auth_enabled: !!response.data.ip_camera_auth_enabled,
                    ip_camera_username: response.data.ip_camera_username || "",
                    ip_camera_password: response.data.ip_camera_password || "",
                    notify_in: response.data.notify_in !== false,
                    notify_out: response.data.notify_out !== false,
                    notify_sms: !!response.data.notify_sms,
                    notify_whatsapp: !!response.data.notify_whatsapp
                });
            }
        } catch {
            toast.error(t("failed_to_load_settings"));
        } finally {
            setLoading(false);
        }
    };

    const handleScanNetwork = async () => {
        setScanning(true);
        setDiscoveredCameras([]);
        try {
            const response = await api.post('/attendance/discover-cameras', { subnet: scanSubnet });
            setDiscoveredCameras(response.data.data || []);
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
            await api.post('/attendance/qr-settings', settings);
            toast.success(t("qr_attendance_settings_updated"));
        } catch {
            toast.error(t("failed_to_save_settings"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 max-w-4xl">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Settings2 className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("qr_attendance_protocol")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("configure_hardware_interfaces")}</p>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
                    <SectionSkeleton />
                    <SectionSkeleton />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
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
            )}
        </div>
    );
}