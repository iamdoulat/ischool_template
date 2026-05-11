"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { 
    Video, Settings2, Key, ShieldCheck, 
    Smartphone, Monitor, ExternalLink, RefreshCw,
    Save, Info, Zap, Lock, Globe, Copy
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ZoomSettingPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [settings, setSettings] = useState({
        api_key: "",
        api_secret: "",
        teacher_api_credential: true,
        staff_client_type: "web",
        student_client_type: "web",
        parent_live_class: true,
        access_token: ""
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/conference/zoom-settings');
            if (response.data) {
                setSettings({
                    api_key: response.data.api_key || "",
                    api_secret: response.data.api_secret || "",
                    teacher_api_credential: !!response.data.teacher_api_credential,
                    staff_client_type: response.data.staff_client_type || "web",
                    student_client_type: response.data.student_client_type || "web",
                    parent_live_class: !!response.data.parent_live_class,
                    access_token: response.data.access_token || ""
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
            await api.post('/conference/zoom-settings', settings);
            toast({ title: "Success", description: "Zoom configuration updated" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-[#2d8cff]/10 flex items-center justify-center">
                        <Video className="h-6 w-6 text-[#2d8cff]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                            Virtual Classroom Protocol
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Configure zoom integration & live session parameters</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl shadow-blue-100/20 border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Zoom API Configuration</h2>
                    </div>
                    {!settings.access_token && (
                        <div className="flex items-center gap-2 bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100">
                            <Zap className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Authentication Required</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-10">
                    {/* Left Column - Form Fields */}
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <Label className="col-span-4 text-right text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Zoom API Key <span className="text-red-500">*</span>
                                </Label>
                                <div className="col-span-8 relative">
                                    <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        value={settings.api_key}
                                        onChange={(e) => setSettings({...settings, api_key: e.target.value})}
                                        className="pl-10 h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-[#2d8cff] shadow-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4 items-center">
                                <Label className="col-span-4 text-right text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    API Secret <span className="text-red-500">*</span>
                                </Label>
                                <div className="col-span-8 relative">
                                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="password"
                                        value={settings.api_secret}
                                        onChange={(e) => setSettings({...settings, api_secret: e.target.value})}
                                        className="pl-10 h-11 border-gray-100 bg-gray-50/30 rounded-lg focus:ring-[#2d8cff] shadow-none font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4 items-center">
                                <Label className="col-span-4 text-right text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Teacher API Proxy
                                </Label>
                                <div className="col-span-8 flex items-center gap-3">
                                    <Switch
                                        checked={settings.teacher_api_credential}
                                        onCheckedChange={(val) => setSettings({...settings, teacher_api_credential: val})}
                                        className="data-[state=checked]:bg-blue-500"
                                    />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enable unique teacher tokens</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-6 items-start">
                                <Label className="col-span-4 text-right text-[11px] font-bold text-gray-500 uppercase tracking-widest pt-3">
                                    Staff Interface
                                </Label>
                                <div className="col-span-8">
                                    <RadioGroup
                                        value={settings.staff_client_type}
                                        onValueChange={(val) => setSettings({...settings, staff_client_type: val})}
                                        className="flex gap-4"
                                    >
                                        <div className={cn(
                                            "flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer",
                                            settings.staff_client_type === 'web' ? "bg-blue-50 border-blue-200" : "bg-gray-50/50 border-gray-100 opacity-60"
                                        )}>
                                            <RadioGroupItem value="web" id="staff-web" className="text-blue-600 border-blue-300" />
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-blue-500" />
                                                <Label htmlFor="staff-web" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">In-Browser</Label>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer",
                                            settings.staff_client_type === 'app' ? "bg-blue-50 border-blue-200" : "bg-gray-50/50 border-gray-100 opacity-60"
                                        )}>
                                            <RadioGroupItem value="app" id="staff-app" className="text-blue-600 border-blue-300" />
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="h-4 w-4 text-blue-500" />
                                                <Label htmlFor="staff-app" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">Native App</Label>
                                            </div>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-6 items-start">
                                <Label className="col-span-4 text-right text-[11px] font-bold text-gray-500 uppercase tracking-widest pt-3">
                                    Student Interface
                                </Label>
                                <div className="col-span-8">
                                    <RadioGroup
                                        value={settings.student_client_type}
                                        onValueChange={(val) => setSettings({...settings, student_client_type: val})}
                                        className="flex gap-4"
                                    >
                                        <div className={cn(
                                            "flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer",
                                            settings.student_client_type === 'web' ? "bg-blue-50 border-blue-200" : "bg-gray-50/50 border-gray-100 opacity-60"
                                        )}>
                                            <RadioGroupItem value="web" id="student-web" className="text-blue-600 border-blue-300" />
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-blue-500" />
                                                <Label htmlFor="student-web" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">In-Browser</Label>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer",
                                            settings.student_client_type === 'app' ? "bg-blue-50 border-blue-200" : "bg-gray-50/50 border-gray-100 opacity-60"
                                        )}>
                                            <RadioGroupItem value="app" id="student-app" className="text-blue-600 border-blue-300" />
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="h-4 w-4 text-blue-500" />
                                                <Label htmlFor="student-app" className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">Native App</Label>
                                            </div>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4 items-center">
                                <Label className="col-span-4 text-right text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Parent Participation
                                </Label>
                                <div className="col-span-8 flex items-center gap-3">
                                    <Switch
                                        checked={settings.parent_live_class}
                                        onCheckedChange={(val) => setSettings({...settings, parent_live_class: val})}
                                        className="data-[state=checked]:bg-blue-500"
                                    />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Allow parent-guest access</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Info */}
                    <div className="space-y-8 bg-blue-50/30 p-10 rounded-lg border border-blue-100/50 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div className="text-5xl font-black text-[#2d8cff] tracking-tighter italic">zoom</div>
                            <div className="h-1.5 w-16 bg-blue-500 rounded-full" />
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                        <Info className="h-3.5 w-3.5" /> Documentation
                                    </p>
                                    <p className="text-xs text-blue-900/60 leading-relaxed font-medium">
                                        To generate your Zoom API Server-to-Server OAuth credentials, please visit the Zoom Marketplace developer console.
                                    </p>
                                    <Button variant="link" className="p-0 h-auto text-[10px] font-bold uppercase text-blue-600 hover:text-blue-800 flex items-center gap-1.5">
                                        Zoom Marketplace <ExternalLink className="h-3 w-3" />
                                    </Button>
                                </div>

                                <div className="space-y-3 bg-white/60 p-6 rounded-lg border border-blue-100 shadow-sm shadow-blue-100/20">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">OAuth Redirect URL</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 text-[10px] font-bold text-blue-900 select-all break-all leading-tight">
                                            {window.location.origin}/admin/conference/generatetoken
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-white rounded-lg">
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button className="w-full h-14 bg-[#2d8cff] hover:bg-[#1e7bd8] text-white rounded-lg shadow-xl shadow-blue-200/50 font-bold uppercase tracking-widest flex gap-3 text-[11px]">
                            <Zap className="h-4 w-4 fill-white" /> Authorize Institutional Account
                        </Button>
                    </div>
                </div>

                <div className="p-8 bg-gray-50/30 border-t border-gray-50 flex justify-center">
                    <Button 
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-gradient text-white px-20 h-14 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex gap-3"
                    >
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Commit Classroom Settings
                    </Button>
                </div>
            </div>
        </div>
    );
}
