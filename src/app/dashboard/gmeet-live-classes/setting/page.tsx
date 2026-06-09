"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingPage() {
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
            console.error("Failed to load settings", error);
            toast.error("Failed to load Google Meet settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            await api.post('/conference/gmeet-settings', formData);
            toast.success("Settings updated successfully");
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error("Failed to update Google Meet settings");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            
            {/* Header */}
            <div className="bg-white border border-gray-100 rounded shadow-sm p-4 flex items-center">
                <h1 className="text-sm font-semibold tracking-tight text-gray-800">Setting</h1>
            </div>

            {/* Main White Panel */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-0 overflow-hidden">
                
                {/* Form Fields Container */}
                <div className="p-6 space-y-5">
                    
                    {/* API Key */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        <Label className="w-full md:w-[28%] text-left md:text-right font-medium text-gray-600 text-xs pr-4 md:mb-0 mb-1">
                            API Key
                        </Label>
                        <div className="w-full md:w-[70%] max-w-lg">
                            <Input
                                value={formData.api_key}
                                onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                                placeholder=""
                                className="h-9 border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none"
                            />
                        </div>
                    </div>

                    {/* API Secret */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        <Label className="w-full md:w-[28%] text-left md:text-right font-medium text-gray-600 text-xs pr-4 md:mb-0 mb-1">
                            API Secret
                        </Label>
                        <div className="w-full md:w-[70%] max-w-lg">
                            <Input
                                value={formData.api_secret}
                                onChange={(e) => setFormData({...formData, api_secret: e.target.value})}
                                placeholder=""
                                className="h-9 border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none"
                            />
                        </div>
                    </div>

                    {/* Use Google Calendar Api */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        <Label className="w-full md:w-[28%] text-left md:text-right font-medium text-gray-600 text-xs pr-4 md:mb-0 mb-1">
                            Use Google Calendar Api <span className="text-red-500">*</span>
                        </Label>
                        <div className="w-full md:w-[70%] max-w-lg flex items-center gap-6 text-xs text-gray-700 font-medium">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="use_calendar_api" 
                                    checked={!formData.use_calendar_api} 
                                    onChange={() => setFormData({...formData, use_calendar_api: false})}
                                    className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer" 
                                />
                                <span>Disabled</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="use_calendar_api" 
                                    checked={formData.use_calendar_api} 
                                    onChange={() => setFormData({...formData, use_calendar_api: true})}
                                    className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer" 
                                />
                                <span>Enabled</span>
                            </label>
                        </div>
                    </div>

                    {/* Parent Live Class */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        <Label className="w-full md:w-[28%] text-left md:text-right font-medium text-gray-600 text-xs pr-4 md:mb-0 mb-1">
                            Parent Live Class <span className="text-red-500">*</span>
                        </Label>
                        <div className="w-full md:w-[70%] max-w-lg flex items-center gap-6 text-xs text-gray-700 font-medium">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="forgot_live_class" 
                                    checked={!formData.forgot_live_class} 
                                    onChange={() => setFormData({...formData, forgot_live_class: false})}
                                    className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer" 
                                />
                                <span>Disabled</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="forgot_live_class" 
                                    checked={formData.forgot_live_class} 
                                    onChange={() => setFormData({...formData, forgot_live_class: true})}
                                    className="h-3.5 w-3.5 text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 cursor-pointer" 
                                />
                                <span>Enabled</span>
                            </label>
                        </div>
                    </div>

                </div>

                {/* Footer Save Button */}
                <div className="bg-white p-4 border-t border-gray-150 flex justify-start md:pl-[28%]">
                    <Button 
                        onClick={handleSave} 
                        disabled={submitting}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-5 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm"
                    >
                        {submitting ? "Saving..." : "Save"}
                    </Button>
                </div>

            </div>

        </div>
    );
}
