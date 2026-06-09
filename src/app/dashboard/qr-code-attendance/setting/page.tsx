"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
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
    QrCode, Settings2, Smartphone, Monitor, 
    ScanLine, ShieldCheck, Save, RefreshCw,
    Camera, Cpu, Zap, Wifi, Bell, MessageSquare, Phone,
    Search, Network, CheckCircle2, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function QrCodeSettingPage() {
    const [loading, setLoading] = useState(false);
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
        } catch (error) {
            toast.error("Failed to load settings");
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
            toast.success(`Scan complete: ${response.data.message || 'cameras found'}`);
        } catch (error) {
            toast.error("Network scan failed");
        } finally {
            setScanning(false);
        }
    };

    const selectCamera = (camera: any) => {
        setSettings({
            ...settings,
            ip_camera_url: camera.ip,
            ip_camera_brand: camera.brand === 'generic' ? 'generic' : camera.brand,
        });
        setScanDialogOpen(false);
        toast.success(`Selected: ${camera.name}`);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/attendance/qr-settings', settings);
            toast.success("QR Attendance settings updated");
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4 font-sans p-4 bg-gray-50/10 min-h-screen text-xs">
            {/* Header */}
            <div className="bg-white p-4 rounded border border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <QrCode className="h-16 w-16 text-indigo-500" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-base font-semibold text-gray-800 uppercase flex items-center gap-2">
                        <Settings2 className="h-5 w-5 text-indigo-500" />
                        QR Attendance Protocol
                    </h1>
                    <p className="text-[10px] text-gray-400 mt-1">Configure hardware interfaces & automated attendance logic</p>
                </div>
                <div className="relative z-10 flex gap-2">
                    <Button 
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-5 h-8 text-[11px] font-bold rounded shadow-md shadow-indigo-500/25 transition-all active:scale-95 border-0 flex gap-2 items-center"
                    >
                        {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save Settings
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hardware Configuration */}
                <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-indigo-500" />
                        <h2 className="text-xs font-bold text-gray-700 uppercase">Hardware Configuration</h2>
                    </div>
                    
                    <div className="p-4 space-y-5 flex-1">
                        {/* Devices */}
                        <div className="grid grid-cols-2 gap-3">
                            <div 
                                onClick={() => setSettings({...settings, use_sensor_device: !settings.use_sensor_device})}
                                className={cn(
                                    "p-3 rounded border transition-all cursor-pointer flex flex-col gap-2",
                                    settings.use_sensor_device ? "bg-indigo-50/50 border-indigo-200" : "bg-gray-50 border-gray-100 hover:border-gray-200"
                                )}
                            >
                                <div className="flex justify-between items-center">
                                    <ScanLine className={cn("h-4 w-4", settings.use_sensor_device ? "text-indigo-600" : "text-gray-400")} />
                                    <Checkbox checked={settings.use_sensor_device} className="data-[state=checked]:bg-indigo-600 h-3 w-3" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase text-gray-800">HID / NFC Sensor</h4>
                                </div>
                            </div>

                            <div 
                                onClick={() => setSettings({...settings, use_camera_device: !settings.use_camera_device})}
                                className={cn(
                                    "p-3 rounded border transition-all cursor-pointer flex flex-col gap-2",
                                    settings.use_camera_device ? "bg-indigo-50/50 border-indigo-200" : "bg-gray-50 border-gray-100 hover:border-gray-200"
                                )}
                            >
                                <div className="flex justify-between items-center">
                                    <Camera className={cn("h-4 w-4", settings.use_camera_device ? "text-indigo-600" : "text-gray-400")} />
                                    <Checkbox checked={settings.use_camera_device} className="data-[state=checked]:bg-indigo-600 h-3 w-3" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase text-gray-800">Visual Camera</h4>
                                </div>
                            </div>
                        </div>

                        {/* Visual Source Settings */}
                        {settings.use_camera_device && (
                            <div className="space-y-3 pt-2 border-t border-gray-50">
                                <Label className="text-[10px] font-bold text-gray-600 uppercase">Camera Source</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="camera_type" 
                                            value="primary" 
                                            checked={settings.camera_type === 'primary'}
                                            onChange={(e) => setSettings({...settings, camera_type: e.target.value})}
                                            className="text-indigo-600"
                                        />
                                        <span className="text-[11px] font-medium text-gray-700">Back/Primary</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="camera_type" 
                                            value="secondary" 
                                            checked={settings.camera_type === 'secondary'}
                                            onChange={(e) => setSettings({...settings, camera_type: e.target.value})}
                                            className="text-indigo-600"
                                        />
                                        <span className="text-[11px] font-medium text-gray-700">Front/Secondary</span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5 pt-2">
                                        <Label className="text-[10px] font-bold text-gray-600 uppercase">Camera Manufacturer</Label>
                                        <Select 
                                            value={settings.ip_camera_brand} 
                                            onValueChange={(val) => setSettings({...settings, ip_camera_brand: val})}
                                        >
                                            <SelectTrigger className="h-8 text-[11px]">
                                                <SelectValue placeholder="Select Brand" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="generic">Generic / Direct Stream</SelectItem>
                                                <SelectItem value="onvif">ONVIF Standard</SelectItem>
                                                <SelectItem value="hikvision">Hikvision</SelectItem>
                                                <SelectItem value="dahua">Dahua</SelectItem>
                                                <SelectItem value="zk">ZK (ZKTeco)</SelectItem>
                                                <SelectItem value="foscam">Foscam</SelectItem>
                                                <SelectItem value="esp32cam">ESP32-CAM</SelectItem>
                                                <SelectItem value="tplink">TP-Link VIGI</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5 pt-2">
                                        <Label className="text-[10px] font-bold text-gray-600 uppercase">RTSP Transport</Label>
                                        <Select 
                                            value={settings.ip_camera_rtsp_transport} 
                                            onValueChange={(val) => setSettings({...settings, ip_camera_rtsp_transport: val})}
                                        >
                                            <SelectTrigger className="h-8 text-[11px]">
                                                <SelectValue placeholder="Protocol" />
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

                                <div className="space-y-1.5 pt-2">
                                    <Label className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5">
                                        <Wifi className="h-3 w-3 text-gray-400" /> IP Camera Address / URL
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={settings.ip_camera_url}
                                            onChange={(e) => setSettings({...settings, ip_camera_url: e.target.value})}
                                            placeholder="e.g. 192.168.1.100 or full http:// stream URL"
                                            className="h-8 text-[11px] flex-1"
                                        />
                                        <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="h-8 text-[10px] border-indigo-200 text-indigo-600 hover:bg-indigo-50 flex gap-1 items-center px-2"
                                                >
                                                    <Network className="h-3 w-3" />
                                                    Scan
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-lg">
                                                <DialogHeader>
                                                    <DialogTitle className="text-sm flex items-center gap-2">
                                                        <Search className="h-4 w-4 text-indigo-500" />
                                                        Scan Network for IP Cameras
                                                    </DialogTitle>
                                                    <DialogDescription className="text-[11px]">
                                                        Enter the subnet to scan for IP cameras on common ports (80, 8080, 81).
                                                        This may take up to 30 seconds for a full /24 scan.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-[10px] font-bold text-gray-600 whitespace-nowrap">Subnet:</Label>
                                                        <Input
                                                            value={scanSubnet}
                                                            onChange={(e) => setScanSubnet(e.target.value)}
                                                            placeholder="e.g. 192.168.1"
                                                            className="h-8 text-[11px] flex-1"
                                                            disabled={scanning}
                                                        />
                                                        <Button
                                                            onClick={handleScanNetwork}
                                                            disabled={scanning || !scanSubnet}
                                                            className="h-8 text-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white px-3 flex gap-1 items-center"
                                                        >
                                                            {scanning ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <Network className="h-3 w-3" />
                                                            )}
                                                            {scanning ? "Scanning..." : "Start Scan"}
                                                        </Button>
                                                    </div>
                                                    {scanning && (
                                                        <div className="flex items-center gap-2 text-[11px] text-indigo-600 animate-pulse">
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                            Scanning 254 IPs across 3 ports...
                                                        </div>
                                                    )}
                                                    {discoveredCameras.length > 0 && (
                                                        <div className="max-h-48 overflow-y-auto border rounded">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead className="text-[9px] h-7">IP</TableHead>
                                                                        <TableHead className="text-[9px] h-7">Port</TableHead>
                                                                        <TableHead className="text-[9px] h-7">Brand</TableHead>
                                                                        <TableHead className="text-[9px] h-7"></TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {discoveredCameras.map((cam, i) => (
                                                                        <TableRow key={i}>
                                                                            <TableCell className="text-[10px] py-1 font-mono">{cam.ip}</TableCell>
                                                                            <TableCell className="text-[10px] py-1">{cam.port}</TableCell>
                                                                            <TableCell className="text-[10px] py-1">
                                                                                <span className={cn(
                                                                                    "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                                                                    cam.brand === 'generic' ? 'bg-gray-100 text-gray-600' :
                                                                                    cam.brand === 'hikvision' ? 'bg-red-50 text-red-700' :
                                                                                    cam.brand === 'dahua' ? 'bg-blue-50 text-blue-700' :
                                                                                    'bg-indigo-50 text-indigo-700'
                                                                                )}>
                                                                                    {cam.brand}
                                                                                </span>
                                                                            </TableCell>
                                                                            <TableCell className="text-[10px] py-1">
                                                                                <Button
                                                                                    onClick={() => selectCamera(cam)}
                                                                                    size="sm"
                                                                                    className="h-6 text-[9px] bg-indigo-600 hover:bg-indigo-700 text-white px-2 flex gap-1 items-center"
                                                                                >
                                                                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                                                                    Select
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    )}
                                                    {!scanning && discoveredCameras.length === 0 && (
                                                        <p className="text-[10px] text-gray-400 text-center py-4">
                                                            No cameras found. Try a different subnet or adjust the IP range.
                                                        </p>
                                                    )}
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setScanDialogOpen(false)}
                                                        className="h-8 text-[10px]"
                                                    >
                                                        Close
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <p className="text-[9px] text-gray-400">Leave empty to use local webcams, or use Scan to find IP cameras on your network</p>
                                </div>

                                {/* IP Camera Authentication */}
                                <div className="space-y-2 pt-2 border-t border-gray-50">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5">
                                            <ShieldCheck className="h-3 w-3 text-gray-400" /> IP Camera Authentication
                                        </Label>
                                        <Switch 
                                            checked={settings.ip_camera_auth_enabled}
                                            onCheckedChange={(val) => setSettings({...settings, ip_camera_auth_enabled: val})}
                                            className="data-[state=checked]:bg-indigo-500 scale-75" 
                                        />
                                    </div>
                                    {settings.ip_camera_auth_enabled && (
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] font-bold text-gray-500 uppercase">Username</Label>
                                                <Input 
                                                    value={settings.ip_camera_username || ''}
                                                    onChange={(e) => setSettings({...settings, ip_camera_username: e.target.value})}
                                                    placeholder="admin"
                                                    className="h-7 text-[10px]"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[9px] font-bold text-gray-500 uppercase">Password</Label>
                                                <Input 
                                                    type="password"
                                                    value={settings.ip_camera_password || ''}
                                                    onChange={(e) => setSettings({...settings, ip_camera_password: e.target.value})}
                                                    placeholder="••••••••"
                                                    className="h-7 text-[10px]"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Processing & Notifications */}
                <div className="bg-white rounded border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <h2 className="text-xs font-bold text-gray-700 uppercase">Processing & Notifications</h2>
                    </div>
                    
                    <div className="p-4 space-y-6 flex-1">
                        {/* Auto Attendance */}
                        <div className="flex items-center justify-between p-3 rounded border border-gray-100 bg-gray-50/30">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-gray-700 uppercase">Automated Entry</span>
                                <span className="text-[10px] text-gray-400">Auto-submit without manual click</span>
                            </div>
                            <Switch 
                                checked={settings.auto_attendance}
                                onCheckedChange={(val) => setSettings({...settings, auto_attendance: val})}
                                className="data-[state=checked]:bg-indigo-500" 
                            />
                        </div>

                        {/* Notification Triggers */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5 border-b border-gray-50 pb-2">
                                <Bell className="h-3 w-3 text-indigo-500" /> Notification Triggers
                            </Label>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                                    <Checkbox 
                                        checked={settings.notify_in} 
                                        onCheckedChange={(val) => setSettings({...settings, notify_in: !!val})}
                                        className="data-[state=checked]:bg-indigo-600" 
                                    />
                                    <span className="text-[11px] font-medium text-gray-700">Attendance IN</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                                    <Checkbox 
                                        checked={settings.notify_out} 
                                        onCheckedChange={(val) => setSettings({...settings, notify_out: !!val})}
                                        className="data-[state=checked]:bg-indigo-600" 
                                    />
                                    <span className="text-[11px] font-medium text-gray-700">Attendance OUT</span>
                                </label>
                            </div>
                        </div>

                        {/* Notification Channels */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-600 uppercase border-b border-gray-50 pb-2 flex items-center gap-1.5">
                                <MessageSquare className="h-3 w-3 text-emerald-500" /> Action Channels
                            </Label>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div 
                                    onClick={() => setSettings({...settings, notify_sms: !settings.notify_sms})}
                                    className={cn(
                                        "p-3 rounded border transition-all cursor-pointer flex flex-col gap-2",
                                        settings.notify_sms ? "bg-indigo-50/50 border-indigo-200" : "bg-gray-50 border-gray-100 hover:border-gray-200"
                                    )}
                                >
                                    <div className="flex justify-between items-center">
                                        <MessageSquare className={cn("h-4 w-4", settings.notify_sms ? "text-indigo-600" : "text-gray-400")} />
                                        <Checkbox checked={settings.notify_sms} className="data-[state=checked]:bg-indigo-600 h-3 w-3" />
                                    </div>
                                    <h4 className="text-[10px] font-bold uppercase text-gray-800">Send SMS</h4>
                                </div>

                                <div 
                                    onClick={() => setSettings({...settings, notify_whatsapp: !settings.notify_whatsapp})}
                                    className={cn(
                                        "p-3 rounded border transition-all cursor-pointer flex flex-col gap-2",
                                        settings.notify_whatsapp ? "bg-emerald-50/50 border-emerald-200" : "bg-gray-50 border-gray-100 hover:border-gray-200"
                                    )}
                                >
                                    <div className="flex justify-between items-center">
                                        <Phone className={cn("h-4 w-4", settings.notify_whatsapp ? "text-emerald-600" : "text-gray-400")} />
                                        <Checkbox checked={settings.notify_whatsapp} className="data-[state=checked]:bg-emerald-600 h-3 w-3" />
                                    </div>
                                    <h4 className="text-[10px] font-bold uppercase text-gray-800">WhatsApp Alert</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
