"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, Mail, GraduationCap, User, Users, Shield, Briefcase, Calculator, BookOpen, PhoneCall } from "lucide-react";
import { useImageUrl } from "@/lib/image-url";
import api from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [emailOrUsername, setEmailOrUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("admin");
    const [settings, setSettings] = useState<{ app_logo?: string; school_name?: string; app_name?: string; tagline?: string; base_url?: string; [key: string]: any } | null>(null);
    const [mounted, setMounted] = useState(false);
    const getImageUrl = useImageUrl();

    // Captcha (driven by system-setting → captcha-setting, "User login" / "Login" aliases)
    const [captchaEnabled, setCaptchaEnabled] = useState(false);
    const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
    const [captchaAnswer, setCaptchaAnswer] = useState("");

    const regenerateCaptcha = () => {
        // Deterministic-free small operands; identity is not security-sensitive here.
        const a = 1 + Math.floor((Date.now() % 9));
        const b = 1 + Math.floor((Date.now() / 7) % 9);
        setCaptcha({ a, b });
        setCaptchaAnswer("");
    };

    useEffect(() => {
        setMounted(true);
        api.get("/system-setting/general-setting").then(r => {
            const data = r.data?.data || r.data || {};
            setSettings(data);
        }).catch(() => {});

        api.get("/system-setting/captcha-settings/public").then(r => {
            const map = r.data?.data || {};
            const enabled = !!(map.user_login || map.login);
            setCaptchaEnabled(enabled);
            if (enabled) regenerateCaptcha();
        }).catch(() => {});
    }, []);

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        setError("");
    };

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError("");

        if (captchaEnabled && Number(captchaAnswer) !== captcha.a + captcha.b) {
            setError("Incorrect captcha answer. Please try again.");
            regenerateCaptcha();
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/login", { email_or_username: emailOrUsername, password });
            const resData = response.data.data || response.data;
            const access_token = resData?.access_token || resData?.token;
            const user = resData?.user;

            // Store token
            if (access_token) {
                localStorage.setItem("auth_token", access_token);
            }

            // Redirect based on role
            const userRole = user?.role || "";
            if (userRole === "Student" || userRole === "Parent") {
                window.location.href = "/user/dashboard";
            } else {
                window.location.href = "/dashboard";
            }
        } catch (err: unknown) {
            console.error("Login attempt failed:", err);
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
            setError(
                errorObj.response?.data?.message || errorObj.message || "Login failed. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRoleFill = (roleEmail: string) => {
        setEmailOrUsername(roleEmail);
        const passwords: Record<string, string> = {
            "superadmin@ischool.com": "superadmin123",
            "admin@ischool.com": "admin1234",
            "teacher@ischool.com": "teacher@123",
            "accountant@ischool.com": "accountant@123",
            "receptionist@ischool.com": "receptionist@123",
            "librarian@ischool.com": "librarian@123",
            "STD-0100": "student123",
            "PAR-0100": "parent123",
        };
        setPassword(passwords[roleEmail] || "password123");
        setError("");
        if (roleEmail === "STD-0100" || roleEmail === "PAR-0100") {
            setActiveTab("user");
        } else {
            setActiveTab("admin");
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-slate-900 overflow-hidden font-sans p-4 sm:p-6 lg:p-12" suppressHydrationWarning>
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
            </div>

            <div className="container relative z-10 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative">
                    
                    {/* Left Column: Logo, School Name, Slogan */}
                    <div className="lg:col-span-6 text-center space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 flex flex-col items-center justify-center">
                        <div className="flex justify-center">
                            {mounted && settings?.app_logo ? (
                                <img
                                    src={getImageUrl(settings.app_logo)}
                                    alt={settings?.school_name || "School Logo"}
                                    className="h-16 max-h-16 w-auto object-contain bg-slate-800/80 p-2.5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md"
                                />
                            ) : (
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-xl shadow-indigo-500/30 border border-white/10">
                                    <GraduationCap className="h-10 w-10 text-white" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2" suppressHydrationWarning>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight" suppressHydrationWarning>
                                {mounted ? (settings?.school_name || "iSchool Management System") : "iSchool Management System"}
                            </h1>
                            <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto" suppressHydrationWarning>
                                {mounted ? (settings?.tagline || settings?.school_name || "Empowering education with modern, intelligent management solutions.") : "Empowering education with modern, intelligent management solutions."}
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Dynamic Login Box */}
                    <div className="lg:col-span-6 w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-4 duration-700">
                        <Card className="border-white/10 bg-slate-800/60 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <CardHeader className="space-y-4 pb-4">
                                    <TabsList className="grid grid-cols-2 bg-slate-900/60 p-1 rounded-xl border border-white/5">
                                        <TabsTrigger 
                                            value="user" 
                                            className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300 font-semibold transition-all"
                                        >
                                            User Login
                                        </TabsTrigger>
                                        <TabsTrigger 
                                            value="admin" 
                                            className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300 font-semibold transition-all"
                                        >
                                            Admin Login
                                        </TabsTrigger>
                                    </TabsList>
                                    
                                    <div>
                                        <CardTitle className="text-2xl text-white font-bold">
                                            {activeTab === 'admin' ? 'Admin Login' : 'User Login'}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                
                                <form onSubmit={handleLogin} suppressHydrationWarning>
                                    <CardContent className="space-y-4">
                                        {error && (
                                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
                                                {error}
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <div className="relative" suppressHydrationWarning>
                                                <Input
                                                    id="email"
                                                    type="text"
                                                    autoComplete="username"
                                                    placeholder="Email / Username"
                                                    required
                                                    value={emailOrUsername}
                                                    onChange={(e) => setEmailOrUsername(e.target.value)}
                                                    className="bg-white border-white/10 text-slate-800 focus:ring-indigo-500 h-12 text-base rounded-md"
                                                />
                                                <Mail className="absolute right-4 top-4 h-4 w-4 text-slate-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="relative" suppressHydrationWarning>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    autoComplete="current-password"
                                                    placeholder="Password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="bg-white border-white/10 text-slate-800 focus:ring-indigo-500 h-12 text-base rounded-md"
                                                />
                                                <Lock className="absolute right-4 top-4 h-4 w-4 text-slate-400" />
                                            </div>
                                            <div className="flex justify-end pt-1">
                                                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">Forgot password?</Link>
                                            </div>
                                        </div>
                                        
                                        {captchaEnabled && (
                                            <div className="space-y-2">
                                                <Label className="text-slate-300 text-xs font-medium">Captcha Verification</Label>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="select-none px-4 h-12 flex items-center justify-center bg-white text-slate-800 font-bold text-lg rounded-md tracking-widest cursor-pointer"
                                                        onClick={regenerateCaptcha}
                                                        title="Click to refresh"
                                                    >
                                                        {captcha.a} + {captcha.b} = ?
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        placeholder="Answer"
                                                        required
                                                        value={captchaAnswer}
                                                        onChange={(e) => setCaptchaAnswer(e.target.value)}
                                                        className="bg-white border-white/10 text-slate-800 focus:ring-indigo-500 h-12 text-base rounded-md flex-1"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full h-12 mt-2 text-lg font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-[#4caf50] hover:bg-[#43a047] text-white shadow-lg shadow-green-600/20 rounded-md"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Authenticating...
                                                </>
                                            ) : (
                                                "Sign In"
                                            )}
                                        </Button>

                                        {/* Quick Login Role Buttons */}
                                        <div className="pt-2 space-y-3">
                                            <TabsContent value="admin" className="m-0 space-y-1">
                                                <div className="grid grid-cols-3 gap-1">
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('superadmin@ischool.com')} className="bg-[#0284c7] hover:bg-[#0369a1] text-white border-none hover:text-white h-10 shadow-sm flex items-center justify-center gap-1.5 px-0 rounded-sm">
                                                        <Shield className="w-3.5 h-3.5" /> <span className="text-[11px] sm:text-xs">Super Admin</span>
                                                    </Button>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('admin@ischool.com')} className="bg-[#00bcd4] hover:bg-[#00acc1] text-white border-none hover:text-white h-10 shadow-sm flex items-center justify-center gap-1.5 px-0 rounded-sm">
                                                        <Briefcase className="w-3.5 h-3.5" /> <span className="text-[11px] sm:text-xs">Admin</span>
                                                    </Button>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('teacher@ischool.com')} className="bg-[#9ca3af] hover:bg-[#6b7280] text-white border-none hover:text-white h-10 shadow-sm flex items-center justify-center gap-1.5 px-0 rounded-sm">
                                                        <BookOpen className="w-3.5 h-3.5" /> <span className="text-[11px] sm:text-xs">Teacher</span>
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-1">
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('accountant@ischool.com')} className="bg-[#9ca3af] hover:bg-[#6b7280] text-white border-none hover:text-white h-10 shadow-sm flex items-center justify-center gap-1.5 px-0 rounded-sm">
                                                        <Calculator className="w-3.5 h-3.5" /> <span className="text-[11px] sm:text-xs">Accountant</span>
                                                    </Button>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('receptionist@ischool.com')} className="bg-[#e91e63] hover:bg-[#d81b60] text-white border-none hover:text-white h-10 shadow-sm flex items-center justify-center gap-1.5 px-0 rounded-sm">
                                                        <PhoneCall className="w-3.5 h-3.5" /> <span className="text-[11px] sm:text-xs">Receptionist</span>
                                                    </Button>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('librarian@ischool.com')} className="bg-[#4caf50] hover:bg-[#43a047] text-white border-none hover:text-white h-10 shadow-sm flex items-center justify-center gap-1.5 px-0 rounded-sm">
                                                        <BookOpen className="w-3.5 h-3.5" /> <span className="text-[11px] sm:text-xs">Librarian</span>
                                                    </Button>
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="user" className="m-0">
                                                <div className="grid grid-cols-2 gap-1">
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('STD-0100')} className="bg-[#0284c7] hover:bg-[#0369a1] text-white border-none hover:text-white h-10 shadow-sm flex items-center justify-center gap-2 rounded-sm">
                                                        <User className="w-4 h-4" /> <span>Student</span>
                                                    </Button>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('PAR-0100')} className="bg-[#e91e63] hover:bg-[#d81b60] text-white border-none hover:text-white h-10 shadow-sm flex items-center justify-center gap-2 rounded-sm">
                                                        <Users className="w-4 h-4" /> <span>Parent</span>
                                                    </Button>
                                                </div>
                                            </TabsContent>
                                        </div>
                                    </CardContent>
                                </form>
                            </Tabs>
                        </Card>

                        <p className="text-center text-slate-400 text-xs font-medium">
                            © {new Date().getFullYear()} {settings?.school_name || settings?.app_name || "iSchool"}. All rights reserved.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
