"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
    Settings2, Globe, ShieldCheck, Key, Lock, 
    Calendar, AlertCircle, Save, RefreshCw,
    Video, Zap, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        api_key: "",
        api_secret: "",
        use_calendar_api: false,
        forgot_live_class: false
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/conference/gmeet-settings');
            if (response.data) {
                setFormData({
                    api_key: response.data.api_key || "",
                    api_secret: response.data.api_secret || "",
                    use_calendar_api: !!response.data.use_calendar_api,
                    forgot_live_class: !!response.data.forgot_live_class
                });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            await api.post('/conference/gmeet-settings', formData);
            toast({ title: "Success", description: "Google Meet protocol updated" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update protocol", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Syncing G-Meet Protocol...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-4xl mx-auto">
            {/* Header section */}
            <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                    <Video className="h-32 w-32 text-blue-600" />
                </div>
                <div className="relative z-10 flex items-center gap-5">
                    <div className="h-16 w-16 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                        <Settings2 className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-widest flex items-center gap-3">
                            Google Meet <span className="text-blue-500">Protocol</span>
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Management of institutional Google workspace integration</p>
                    </div>
                </div>
                <div className="relative z-10">
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Active Node</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Settings Card */}
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-3">
                                <Key className="h-4 w-4 text-blue-500" />
                                API Authentication
                            </h3>
                            <Zap className="h-4 w-4 text-yellow-400" />
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">G-Cloud API Key <span className="text-red-500">*</span></Label>
                                    <span className="text-[9px] text-blue-400 font-bold uppercase hover:underline cursor-help tracking-widest">Marketplace Guide</span>
                                </div>
                                <div className="relative">
                                    <Input
                                        value={formData.api_key}
                                        onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                                        placeholder="Enter your Google Cloud API Key"
                                        className="h-14 bg-gray-50/50 border-gray-100 rounded-lg px-6 text-sm font-bold tracking-tight focus:ring-blue-500 transition-all shadow-none"
                                    />
                                    <Lock className="absolute right-5 top-4 h-5 w-5 text-gray-300" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">OAuth Client Secret <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Input
                                        type="password"
                                        value={formData.api_secret}
                                        onChange={(e) => setFormData({...formData, api_secret: e.target.value})}
                                        placeholder="••••••••••••••••••••••••"
                                        className="h-14 bg-gray-50/50 border-gray-100 rounded-lg px-6 text-sm font-bold tracking-tight focus:ring-blue-500 transition-all shadow-none"
                                    />
                                    <ShieldCheck className="absolute right-5 top-4 h-5 w-5 text-gray-300" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden p-10 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="h-12 w-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                                <Info className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-700">Commit Protocol Changes</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 text-balance">Update the institutional Google Meet parameters globally.</p>
                            </div>
                        </div>
                        <Button 
                            onClick={handleSave}
                            disabled={submitting}
                            className="btn-gradient text-white px-12 h-14 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/40 transition-all rounded-full flex gap-3 active:scale-95"
                        >
                            {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Commit Protocol
                        </Button>
                    </div>
                </div>

                {/* Sidebar Config */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100">
                            <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest flex items-center gap-3">
                                <Globe className="h-4 w-4 text-blue-500" />
                                Ecosystem
                            </h3>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Calendar Integration</Label>
                                </div>
                                <RadioGroup 
                                    value={formData.use_calendar_api ? "enabled" : "disabled"} 
                                    onValueChange={(val) => setFormData({...formData, use_calendar_api: val === 'enabled'})}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    <div className={cn(
                                        "flex items-center justify-center p-3 rounded-lg border-2 transition-all cursor-pointer",
                                        !formData.use_calendar_api ? "border-blue-500 bg-blue-50/50" : "border-gray-50 bg-gray-50/30"
                                    )}>
                                        <RadioGroupItem value="disabled" id="cal-off" className="hidden" />
                                        <Label htmlFor="cal-off" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Disabled</Label>
                                    </div>
                                    <div className={cn(
                                        "flex items-center justify-center p-3 rounded-lg border-2 transition-all cursor-pointer",
                                        formData.use_calendar_api ? "border-blue-500 bg-blue-50/50" : "border-gray-50 bg-gray-50/30"
                                    )}>
                                        <RadioGroupItem value="enabled" id="cal-on" className="hidden" />
                                        <Label htmlFor="cal-on" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Enabled</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-5 pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-4 w-4 text-orange-500" />
                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Session Notifications</Label>
                                </div>
                                <RadioGroup 
                                    value={formData.forgot_live_class ? "enabled" : "disabled"} 
                                    onValueChange={(val) => setFormData({...formData, forgot_live_class: val === 'enabled'})}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    <div className={cn(
                                        "flex items-center justify-center p-3 rounded-lg border-2 transition-all cursor-pointer",
                                        !formData.forgot_live_class ? "border-orange-500 bg-orange-50/50" : "border-gray-50 bg-gray-50/30"
                                    )}>
                                        <RadioGroupItem value="disabled" id="forgot-off" className="hidden" />
                                        <Label htmlFor="forgot-off" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Disabled</Label>
                                    </div>
                                    <div className={cn(
                                        "flex items-center justify-center p-3 rounded-lg border-2 transition-all cursor-pointer",
                                        formData.forgot_live_class ? "border-orange-500 bg-orange-50/50" : "border-gray-50 bg-gray-50/30"
                                    )}>
                                        <RadioGroupItem value="enabled" id="forgot-on" className="hidden" />
                                        <Label htmlFor="forgot-on" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Enabled</Label>
                                    </div>
                                </RadioGroup>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter leading-relaxed mt-2 italic px-1">
                                    * Trigger alerts for sessions without established curriculum links.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                            <ShieldCheck className="h-32 w-32" />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <h4 className="text-sm font-black uppercase tracking-[0.2em]">Security Protocol</h4>
                            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest leading-relaxed">
                                Google Cloud credentials are encrypted at rest using institutional-grade SHA-256 protocols. Never expose secrets in public documentation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
