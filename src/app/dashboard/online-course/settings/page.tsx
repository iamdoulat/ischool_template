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
import {
    Settings,
    Cloud,
    UserCircle,
    Check,
    ChevronDown,
    Save,
    RefreshCw,
    ShieldCheck,
    Info,
    Zap,
    Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SettingPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({ curriculum: false, aws: false, guest: false });
    
    // Dialog State
    const [confirmSection, setConfirmSection] = useState<'curriculum' | 'aws' | 'guest' | null>(null);

    const [settings, setSettings] = useState({
        quiz: true,
        exam: true,
        assignment: true,
        aws_access_key_id: "",
        aws_secret_access_key: "",
        aws_bucket_name: "",
        aws_region: "",
        guest_login: true,
        guest_user_prefix: "Guest",
        guest_user_id_start: 100
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/online-course/settings');
            if (response.data) {
                setSettings({
                    ...settings,
                    ...response.data
                });
            }
        } catch (error) {
            console.error("Failed to fetch course settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (section: 'curriculum' | 'aws' | 'guest') => {
        setSaving({ ...saving, [section]: true });
        try {
            await api.post('/online-course/settings', settings);
            toast({ 
                title: "Protocol Committed", 
                description: `Institutional ${section} parameters updated successfully.`,
                variant: "default"
            });
        } catch (error) {
            toast({ 
                title: "Commit Failure", 
                description: "Failed to synchronize parameters with the institutional registry.", 
                variant: "destructive" 
            });
        } finally {
            setSaving({ ...saving, [section]: false });
            setConfirmSection(null);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-700">
                <div className="h-16 w-16 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-2xl shadow-indigo-100 animate-pulse">
                    <Settings className="h-8 w-8" />
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 animate-bounce">Accessing Course Config</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Fetching institutional parameters...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-sans text-slate-800">
            {/* Strategy Header */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 text-indigo-600">
                    <Settings className="h-48 w-48" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="h-16 w-16 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner transform -rotate-3">
                        <Zap className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-widest flex items-center gap-4">
                            Institutional Settings
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.25em] mt-1.5 flex items-center gap-2">
                            <Info className="h-3 w-3 text-indigo-400" /> Configuration of virtual assessment and cloud storage protocols
                        </p>
                    </div>
                </div>
            </div>

            {/* Curriculum Setting Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-inner">
                        <Zap className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-black tracking-tight text-slate-700 uppercase tracking-widest">Course Curriculum Registry</CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-12">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] min-w-[200px]">
                            Assessment Modules
                        </label>
                        <div className="flex flex-wrap items-center gap-8">
                            <CheckboxItem 
                                id="quiz" 
                                label="Quiz Protocol" 
                                checked={settings.quiz} 
                                onChange={(val) => setSettings({...settings, quiz: val})} 
                            />
                            <CheckboxItem 
                                id="exam" 
                                label="Exam Node" 
                                checked={settings.exam} 
                                onChange={(val) => setSettings({...settings, exam: val})} 
                            />
                            <CheckboxItem 
                                id="assignment" 
                                label="Assignment Core" 
                                checked={settings.assignment} 
                                onChange={(val) => setSettings({...settings, assignment: val})} 
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-8 border-t border-gray-50">
                        <Button 
                            onClick={() => setConfirmSection('curriculum')}
                            disabled={saving.curriculum}
                            className="btn-gradient text-white px-12 h-14 text-[11px] font-black uppercase tracking-[0.2em] gap-3 shadow-2xl shadow-orange-200/50 active:scale-95 transition-all rounded-full group"
                        >
                            {saving.curriculum ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />}
                            Sync Curriculum
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* AWS S3 Bucket Setting Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
                        <Cloud className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-black tracking-tight text-slate-700 uppercase tracking-widest">Cloud Storage Infrastructure</CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <InputField 
                            label="AWS Access Key ID" 
                            required 
                            icon={<Lock className="h-3.5 w-3.5" />}
                            value={settings.aws_access_key_id || ""}
                            onChange={(val) => setSettings({...settings, aws_access_key_id: val})}
                        />
                        <InputField 
                            label="Secret Access Key" 
                            required 
                            type="password"
                            icon={<Lock className="h-3.5 w-3.5" />}
                            value={settings.aws_secret_access_key || ""}
                            onChange={(val) => setSettings({...settings, aws_secret_access_key: val})}
                        />
                        <InputField 
                            label="Institutional Bucket" 
                            required 
                            icon={<Cloud className="h-3.5 w-3.5" />}
                            value={settings.aws_bucket_name || ""}
                            onChange={(val) => setSettings({...settings, aws_bucket_name: val})}
                        />
                        <InputField 
                            label="Target Region" 
                            required 
                            icon={<Info className="h-3.5 w-3.5" />}
                            value={settings.aws_region || ""}
                            onChange={(val) => setSettings({...settings, aws_region: val})}
                        />
                    </div>
                    <div className="flex justify-end pt-8 border-t border-gray-50">
                        <Button 
                            onClick={() => setConfirmSection('aws')}
                            disabled={saving.aws}
                            className="btn-gradient text-white px-12 h-14 text-[11px] font-black uppercase tracking-[0.2em] gap-3 shadow-2xl shadow-orange-200/50 active:scale-95 transition-all rounded-full group"
                        >
                            {saving.aws ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />}
                            Commit Cloud Sync
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Guest User Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                        <UserCircle className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-black tracking-tight text-slate-700 uppercase tracking-widest">Guest Node Configuration</CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                    <div className="flex flex-col md:flex-row md:items-center gap-12 p-8 bg-slate-50/50 rounded-[2.5rem] border border-gray-50 shadow-inner">
                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                                Guest Access Protocol <span className="text-destructive">*</span>
                            </label>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter italic">Allow unauthenticated nodes to preview curricula</p>
                        </div>
                        <button
                            onClick={() => setSettings({...settings, guest_login: !settings.guest_login})}
                            className={cn(
                                "relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full transition-all duration-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20",
                                settings.guest_login ? "bg-indigo-600 shadow-lg shadow-indigo-100" : "bg-gray-200"
                            )}
                        >
                            <span
                                className={cn(
                                    "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-xl ring-0 transition-all duration-500",
                                    settings.guest_login ? "translate-x-8" : "translate-x-1"
                                )}
                            />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <InputField 
                            label="Guest Prefix" 
                            required 
                            icon={<UserCircle className="h-3.5 w-3.5" />}
                            value={settings.guest_user_prefix || ""}
                            onChange={(val) => setSettings({...settings, guest_user_prefix: val})}
                        />
                        <InputField 
                            label="ID Start Range" 
                            required 
                            type="number"
                            icon={<Zap className="h-3.5 w-3.5" />}
                            value={(settings.guest_user_id_start || 0).toString()}
                            onChange={(val) => setSettings({...settings, guest_user_id_start: parseInt(val) || 0})}
                        />
                    </div>
                    <div className="flex justify-end pt-8 border-t border-gray-50">
                        <Button 
                            onClick={() => setConfirmSection('guest')}
                            disabled={saving.guest}
                            className="btn-gradient text-white px-12 h-14 text-[11px] font-black uppercase tracking-[0.2em] gap-3 shadow-2xl shadow-orange-200/50 active:scale-95 transition-all rounded-full group"
                        >
                            {saving.guest ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />}
                            Initialize Guest Protocol
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Commit Confirmation Dialog */}
            <AlertDialog open={confirmSection !== null} onOpenChange={(open) => !open && setConfirmSection(null)}>
                <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-10 max-w-lg bg-white">
                    <AlertDialogHeader>
                        <div className="h-20 w-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 mb-8 shadow-inner transform rotate-3">
                            <ShieldCheck className="h-10 w-10" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-gray-800 uppercase tracking-tight leading-tight">Confirm Parameter Sync</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-4 font-medium">
                            You are about to synchronize institutional <span className="text-indigo-600 font-black uppercase">{confirmSection}</span> parameters with the central registry. This protocol will update configurations for all active nodal assets.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-12 gap-4">
                        <AlertDialogCancel className="h-14 px-10 rounded-full text-[10px] font-black uppercase tracking-widest border-gray-100 hover:bg-gray-50 transition-all">Abort Sync</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => confirmSection && handleSave(confirmSection)} 
                            className="bg-indigo-600 hover:bg-indigo-700 h-14 px-12 rounded-full text-[10px] font-black uppercase tracking-widest border-0 shadow-2xl shadow-indigo-200 active:scale-95 transition-all flex gap-3"
                        >
                            <Check className="h-4 w-4" />
                            Confirm Commit
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function CheckboxItem({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (val: boolean) => void }) {
    return (
        <div 
            onClick={() => onChange(!checked)}
            className={cn(
                "flex items-center space-x-4 group cursor-pointer p-5 rounded-[1.5rem] border-2 transition-all duration-300 min-w-[200px]",
                checked 
                    ? "border-indigo-500 bg-indigo-50/50 shadow-xl shadow-indigo-100/50" 
                    : "border-gray-100 bg-white hover:border-gray-200"
            )}
        >
            <Checkbox 
                id={id} 
                checked={checked} 
                onCheckedChange={(val) => onChange(!!val)}
                className={cn(
                    "h-6 w-6 rounded-lg border-2 transition-all",
                    checked ? "bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-200" : "border-gray-200"
                )} 
            />
            <label
                htmlFor={id}
                className={cn(
                    "text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors",
                    checked ? "text-indigo-700" : "text-slate-500 group-hover:text-indigo-600"
                )}
            >
                {label}
            </label>
        </div>
    );
}

function InputField({ label, required, value, onChange, type = "text", icon }: { label: string, required?: boolean, value: string, onChange: (val: string) => void, type?: string, icon?: React.ReactNode }) {
    return (
        <div className="space-y-3 group">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors flex items-center gap-2">
                {icon}
                {label} {required && <span className="text-destructive font-bold">*</span>}
            </label>
            <div className="relative">
                <Input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-14 rounded-2xl border-gray-100 bg-white focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all font-bold text-sm px-6 shadow-sm"
                    placeholder={`Enter ${label.toLowerCase()}...`}
                />
            </div>
        </div>
    );
}
