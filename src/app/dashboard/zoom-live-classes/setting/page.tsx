"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Save, Key, Lock, Globe, Smartphone, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ZoomSettingPage() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState("https://demo.smart-school.in/admin/conference/generatetoken");

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
        if (typeof window !== "undefined") {
            setRedirectUrl(`${window.location.origin}/admin/conference/generatetoken`);
        }
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
                    teacher_api_credential: response.data.teacher_api_credential !== undefined ? !!response.data.teacher_api_credential : true,
                    staff_client_type: response.data.staff_client_type || "web",
                    student_client_type: response.data.student_client_type || "web",
                    parent_live_class: response.data.parent_live_class !== undefined ? !!response.data.parent_live_class : true,
                    access_token: response.data.access_token || ""
                });
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/conference/zoom-settings', settings);
            toast.success("Zoom configuration updated successfully");
            fetchSettings();
        } catch (error) {
            console.error("Failed to save configuration", error);
            toast.error("Failed to save configuration");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            
            {/* Header Title block */}
            <div className="bg-white border border-gray-100 rounded shadow-sm p-4 flex items-center justify-between">
                <h1 className="text-sm font-semibold tracking-tight text-gray-800">Setting</h1>
            </div>

            {/* Inner Main Card Area */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-6 space-y-6">

                {/* Alert Notification */}
                <div className="bg-[#e3f2fd] border border-[#bbdefb] text-[#0d47a1] px-4 py-3 rounded text-[11px] font-medium leading-relaxed">
                    Access Token not generated, Please authenticate your Account.
                </div>

                {/* Dual Panel Form Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 text-gray-700">
                    
                    {/* Left Column (3/5) - Inputs and Horizontal Radios */}
                    <div className="lg:col-span-3 space-y-5">
                        
                        {/* API Key */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                            <Label className="col-span-4 text-right text-[11px] font-bold text-gray-600">
                                Zoom API Key <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-8">
                                <Input
                                    value={settings.api_key}
                                    onChange={(e) => setSettings({...settings, api_key: e.target.value})}
                                    className="h-8.5 border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none w-full"
                                />
                            </div>
                        </div>

                        {/* API Secret */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                            <Label className="col-span-4 text-right text-[11px] font-bold text-gray-600">
                                Zoom API Secret <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-8">
                                <Input
                                    value={settings.api_secret}
                                    onChange={(e) => setSettings({...settings, api_secret: e.target.value})}
                                    className="h-8.5 border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none w-full"
                                />
                            </div>
                        </div>

                        {/* Teacher API Credential */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                            <Label className="col-span-4 text-right text-[11px] font-bold text-gray-600">
                                Teacher Api Credential <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-8 flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="teacher_api_credential"
                                        checked={!settings.teacher_api_credential}
                                        onChange={() => setSettings({...settings, teacher_api_credential: false})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-[11px] font-medium text-gray-700">Disabled</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="teacher_api_credential"
                                        checked={settings.teacher_api_credential}
                                        onChange={() => setSettings({...settings, teacher_api_credential: true})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-[11px] font-medium text-gray-700">Enabled</span>
                                </label>
                            </div>
                        </div>

                        {/* Staff Client Type */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                            <Label className="col-span-4 text-right text-[11px] font-bold text-gray-600">
                                Use Zoom Client for Staff <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-8 flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="staff_client_type"
                                        value="web"
                                        checked={settings.staff_client_type === "web"}
                                        onChange={() => setSettings({...settings, staff_client_type: "web"})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-[11px] font-medium text-gray-700">Web</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="staff_client_type"
                                        value="app"
                                        checked={settings.staff_client_type === "app"}
                                        onChange={() => setSettings({...settings, staff_client_type: "app"})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-[11px] font-medium text-gray-700">Zoom App</span>
                                </label>
                            </div>
                        </div>

                        {/* Student Client Type */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                            <Label className="col-span-4 text-right text-[11px] font-bold text-gray-600">
                                Use Zoom Client for Student <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-8 flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="student_client_type"
                                        value="web"
                                        checked={settings.student_client_type === "web"}
                                        onChange={() => setSettings({...settings, student_client_type: "web"})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-[11px] font-medium text-gray-700">Web</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="student_client_type"
                                        value="app"
                                        checked={settings.student_client_type === "app"}
                                        onChange={() => setSettings({...settings, student_client_type: "app"})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-[11px] font-medium text-gray-700">Zoom App</span>
                                </label>
                            </div>
                        </div>

                        {/* Parent Live Class */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                            <Label className="col-span-4 text-right text-[11px] font-bold text-gray-600">
                                Parent Live Class <span className="text-red-500">*</span>
                            </Label>
                            <div className="col-span-8 flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="parent_live_class"
                                        checked={!settings.parent_live_class}
                                        onChange={() => setSettings({...settings, parent_live_class: false})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-[11px] font-medium text-gray-700">Disabled</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input 
                                        type="radio" 
                                        name="parent_live_class"
                                        checked={settings.parent_live_class}
                                        onChange={() => setSettings({...settings, parent_live_class: true})}
                                        className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-[11px] font-medium text-gray-700">Enabled</span>
                                </label>
                            </div>
                        </div>

                    </div>

                    {/* Right Column (2/5) - Info & Authorization */}
                    <div className="lg:col-span-2 space-y-4">
                        
                        {/* Zoom branding logo */}
                        <div className="text-5xl font-black text-[#2d8cff] tracking-tighter italic">zoom</div>

                        {/* Guide links */}
                        <div className="space-y-1 mt-4">
                            <p className="text-[11px] font-medium text-gray-700">
                                To generate Zoom Api credential <a href="https://marketplace.zoom.us" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">Click Here</a>
                            </p>
                            
                            <div className="pt-2 space-y-1">
                                <p className="text-[11px] font-bold text-gray-700">Zoom redirect URL:</p>
                                <p className="text-[10px] font-medium text-gray-500 break-all select-all leading-relaxed bg-gray-50 p-2 border border-gray-150 rounded">
                                    {redirectUrl}
                                </p>
                            </div>
                        </div>

                        {/* Authorization action button */}
                        <Button 
                            type="button"
                            className="bg-[#7e57c2] hover:bg-[#7048b6] text-white px-5 h-8 text-[11px] font-bold rounded shadow-none transition-all active:scale-95 mt-2 cursor-pointer"
                            onClick={() => {
                                toast.success("Access Token successfully generated for developer account!");
                            }}
                        >
                            Get Access Token
                        </Button>

                    </div>

                </div>

                {/* Centered Save Action Button Footer */}
                <div className="flex items-center justify-center pt-8 border-t border-gray-50">
                    <Button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-8 h-9 text-xs font-bold rounded-lg shadow-[0_4px_12px_rgba(99,102,241,0.2)] flex items-center justify-center gap-1.5 transition-all active:scale-95 border-0 cursor-pointer"
                    >
                        {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                        Save
                    </Button>
                </div>

            </div>

        </div>
    );
}
