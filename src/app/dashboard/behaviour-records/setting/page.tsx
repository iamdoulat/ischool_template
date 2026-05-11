"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, RefreshCw, ShieldCheck, MessageSquare, UserCheck, Users, Settings2, Info, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        student_comment: true,
        parent_comment: true
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/behaviour/settings');
            if (response.data) {
                setSettings({
                    student_comment: !!response.data.student_comment,
                    parent_comment: !!response.data.parent_comment
                });
            }
        } catch (error) {
            console.error("Failed to fetch behaviour settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/behaviour/settings', settings);
            toast({ title: "Success", description: "Behaviour configuration updated" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update configuration", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-700">
                <div className="h-16 w-16 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-2xl shadow-indigo-100 animate-pulse">
                    <Settings2 className="h-8 w-8" />
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 animate-bounce">Accessing Protocol Registry</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Fetching behavioural synchronization parameters...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-sans">
            {/* Strategy Header */}
            <div className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 text-indigo-600">
                    <ShieldCheck className="h-48 w-48" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="h-16 w-16 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner transform -rotate-3">
                        <MessageSquare className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-widest flex items-center gap-4">
                            Behaviour Protocol
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.25em] mt-1.5 flex items-center gap-2">
                            <Info className="h-3 w-3 text-indigo-400" /> Configuration of institutional feedback and commentary channels
                        </p>
                    </div>
                </div>
            </div>

            {/* Setting Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shadow-inner">
                        <Zap className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-black tracking-tight text-slate-700 uppercase">Communication Parameters</CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 p-8 bg-white/50 rounded-lg border border-gray-50 shadow-sm relative group hover:border-indigo-100 transition-all duration-500">
                        <div className="space-y-2 relative z-10">
                            <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-3">
                                <Users className="h-4 w-4 text-indigo-500" />
                                Comment Channel Protocol
                            </label>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-7">Determine which institutional nodes can engage in commentary</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-10 relative z-10">
                            <CheckboxItem 
                                id="student" 
                                label="Student Node Engagement" 
                                checked={settings.student_comment} 
                                onChange={(val) => setSettings({...settings, student_comment: val})}
                                icon={<UserCheck className="h-3.5 w-3.5" />}
                            />
                            <CheckboxItem 
                                id="parent" 
                                label="Parent Node Engagement" 
                                checked={settings.parent_comment} 
                                onChange={(val) => setSettings({...settings, parent_comment: val})}
                                icon={<Users className="h-3.5 w-3.5" />}
                            />
                        </div>
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700">
                            <MessageSquare className="h-32 w-32" />
                        </div>
                    </div>

                    <div className="flex justify-center pt-8 border-t border-gray-50">
                        <Button 
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-gradient text-white px-16 h-14 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-orange-200/50 transition-all rounded-full flex gap-4 active:scale-95 group"
                        >
                            {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />}
                            Commit Protocol
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function CheckboxItem({ id, label, checked, onChange, icon }: { id: string, label: string, checked: boolean, onChange: (val: boolean) => void, icon?: React.ReactNode }) {
    return (
        <div 
            onClick={() => onChange(!checked)}
            className={cn(
                "flex items-center space-x-4 group cursor-pointer p-4 rounded-lg border-2 transition-all duration-300 min-w-[240px]",
                checked 
                    ? "border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-100/50" 
                    : "border-gray-50 bg-white hover:border-gray-200"
            )}
        >
            <Checkbox 
                id={id} 
                checked={checked} 
                onCheckedChange={(val) => onChange(!!val)}
                className={cn(
                    "h-5 w-5 rounded-lg border-2 transition-all",
                    checked ? "bg-indigo-500 border-indigo-500" : "border-gray-200"
                )} 
            />
            <div className="flex flex-col gap-1">
                <label
                    htmlFor={id}
                    className={cn(
                        "text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-2",
                        checked ? "text-indigo-700" : "text-slate-500 group-hover:text-indigo-600"
                    )}
                >
                    {icon}
                    {label}
                </label>
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter italic">
                    {checked ? "Channel Operational" : "Channel Inactive"}
                </span>
            </div>
        </div>
    );
}
