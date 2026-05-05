"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
    QrCode, Settings2, Smartphone, Monitor, 
    ScanLine, ShieldCheck, Save, RefreshCw,
    Camera, Cpu, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function QrCodeSettingPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [settings, setSettings] = useState({
        auto_attendance: false,
        use_sensor_device: true,
        use_camera_device: true,
        camera_type: "primary"
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
                    camera_type: response.data.camera_type || "primary"
                });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/attendance/qr-settings', settings);
            toast({ title: "Success", description: "QR Attendance settings updated" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen flex flex-col items-center">
            {/* Header */}
            <div className="w-full max-w-4xl bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <QrCode className="h-24 w-24 text-indigo-500" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-4">
                        <Settings2 className="h-8 w-8 text-indigo-500" />
                        QR Attendance Protocol
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Configure hardware interfaces & automated attendance logic</p>
                </div>
            </div>

            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-indigo-100/20 border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-indigo-500" />
                    <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">System Configuration</h2>
                </div>

                <div className="p-10 space-y-12">
                    {/* Auto Attendance */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center group">
                        <div className="md:col-span-4 md:text-right flex flex-col">
                            <Label className="text-sm font-bold text-gray-700 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                Automated Entry
                            </Label>
                            <span className="text-[10px] text-gray-400 font-medium">Auto-trigger attendance on scan</span>
                        </div>
                        <div className="md:col-span-8 flex items-center gap-4">
                            <Switch 
                                checked={settings.auto_attendance}
                                onCheckedChange={(val) => setSettings({...settings, auto_attendance: val})}
                                className="data-[state=checked]:bg-indigo-500 h-7 w-12" 
                            />
                            {settings.auto_attendance ? (
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Zap className="h-3 w-3 fill-emerald-500" /> Real-time active
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Manual verification</span>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-gray-50 w-full" />

                    {/* Scanner Device Type */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start group">
                        <div className="md:col-span-4 md:text-right pt-2 flex flex-col">
                            <Label className="text-sm font-bold text-gray-700 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                Hardware Interface
                            </Label>
                            <span className="text-[10px] text-gray-400 font-medium">Supported scanning peripherals</span>
                        </div>
                        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div 
                                onClick={() => setSettings({...settings, use_sensor_device: !settings.use_sensor_device})}
                                className={cn(
                                    "p-6 rounded-2xl border transition-all cursor-pointer flex flex-col gap-4",
                                    settings.use_sensor_device ? "bg-indigo-50 border-indigo-200 shadow-md shadow-indigo-100" : "bg-gray-50/50 border-gray-100 opacity-60 hover:opacity-100"
                                )}
                            >
                                <div className="flex justify-between items-center">
                                    <ScanLine className={cn("h-6 w-6", settings.use_sensor_device ? "text-indigo-600" : "text-gray-400")} />
                                    <Checkbox checked={settings.use_sensor_device} className="rounded-full data-[state=checked]:bg-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-800">Laser Sensor</h4>
                                    <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">Scanning guns & HID devices</p>
                                </div>
                            </div>

                            <div 
                                onClick={() => setSettings({...settings, use_camera_device: !settings.use_camera_device})}
                                className={cn(
                                    "p-6 rounded-2xl border transition-all cursor-pointer flex flex-col gap-4",
                                    settings.use_camera_device ? "bg-indigo-50 border-indigo-200 shadow-md shadow-indigo-100" : "bg-gray-50/50 border-gray-100 opacity-60 hover:opacity-100"
                                )}
                            >
                                <div className="flex justify-between items-center">
                                    <Monitor className={cn("h-6 w-6", settings.use_camera_device ? "text-indigo-600" : "text-gray-400")} />
                                    <Checkbox checked={settings.use_camera_device} className="rounded-full data-[state=checked]:bg-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-800">Visual Capture</h4>
                                    <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">Webcams & Mobile lenses</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-50 w-full" />

                    {/* Select Camera */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center group">
                        <div className="md:col-span-4 md:text-right flex flex-col">
                            <Label className="text-sm font-bold text-gray-700 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                Visual Source
                            </Label>
                            <span className="text-[10px] text-gray-400 font-medium">Default camera priority</span>
                        </div>
                        <div className="md:col-span-8">
                            <RadioGroup 
                                value={settings.camera_type} 
                                onValueChange={(val) => setSettings({...settings, camera_type: val})}
                                className="flex flex-row gap-8"
                            >
                                <div className="flex items-center space-x-3 bg-gray-50/50 px-6 py-4 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all cursor-pointer">
                                    <RadioGroupItem value="primary" id="primary" className="text-indigo-600 border-indigo-300" />
                                    <div className="flex items-center gap-2">
                                        <Camera className="h-4 w-4 text-indigo-500" />
                                        <Label htmlFor="primary" className="text-[11px] font-bold text-gray-600 uppercase tracking-widest cursor-pointer">Back Module</Label>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 bg-gray-50/50 px-6 py-4 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all cursor-pointer">
                                    <RadioGroupItem value="secondary" id="secondary" className="text-indigo-600 border-indigo-300" />
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="h-4 w-4 text-indigo-500" />
                                        <Label htmlFor="secondary" className="text-[11px] font-bold text-gray-600 uppercase tracking-widest cursor-pointer">Front Module</Label>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-gray-50/30 border-t border-gray-50 flex justify-center">
                    <Button 
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-gradient text-white px-16 h-12 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex gap-3"
                    >
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Commit Protocol Settings
                    </Button>
                </div>
            </div>

            {/* Hint Box */}
            <div className="w-full max-w-4xl bg-indigo-50/30 p-6 rounded-2xl border border-indigo-100 flex items-start gap-4">
                <Cpu className="h-6 w-6 text-indigo-400 mt-1" />
                <div className="space-y-1">
                    <h4 className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest">Architectural Insight</h4>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase leading-relaxed tracking-tight">
                        These protocols define how the system interfaces with institutional hardware. Ensure that visual capture devices are properly calibrated and authorized in the browser manifest before deployment.
                    </p>
                </div>
            </div>
        </div>
    );
}
