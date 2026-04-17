"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function ThermalPrintPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        status: true,
        school_name: "Smart School",
        address: "25 Kings Street, CA <br> 89562423934 <br> info@smartschool.com.bd",
        footer_text: "This receipt is computer generated hence no signature is required."
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get("system-setting/thermal-print-settings");
            if (res.data?.status === "success" && res.data.data) {
                setSettings(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.post("system-setting/thermal-print-settings", settings);
            if (res.data?.status === "success") {
                toast("success", "Settings saved successfully");
            }
        } catch (error) {
            toast("error", "Failed to save settings");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Thermal Print</h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">

                {/* Form Container */}
                <div className="w-full p-8 space-y-6 animate-in fade-in duration-300">

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2">Thermal Print <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-10">
                            <Switch
                                checked={settings.status}
                                onCheckedChange={(checked) => setSettings({ ...settings, status: checked })}
                                className="data-[state=checked]:bg-indigo-500 scale-90"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2">School Name <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-10">
                            <Input
                                value={settings.school_name}
                                onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                                className="h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2 mt-2">Address</Label>
                        <div className="md:col-span-10">
                            <Textarea
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                className="min-h-[100px] text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2 mt-2">Footer Text</Label>
                        <div className="md:col-span-10">
                            <Textarea
                                value={settings.footer_text}
                                onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                                className="min-h-[80px] text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y"
                            />
                        </div>
                    </div>

                </div>

                {/* Footer Save Action */}
                <div className="w-full border-t border-gray-50 p-4 bg-white flex justify-end mt-auto">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:opacity-90 text-white px-10 h-10 text-xs font-bold uppercase transition-all rounded-full shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5"
                    >
                        {saving ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : "Save"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
