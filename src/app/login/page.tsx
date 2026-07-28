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
    const [settings, setSettings] = useState<{ app_logo?: string; school_name?: string; base_url?: string; [key: string]: unknown } | null>(null);
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
            const { access_token, user } = response.data.data;

            // Store token
            localStorage.setItem("auth_token", access_token);

            // Redirect based on role
            const userRole = user?.role || "";
            if (userRole === "Student" || userRole === "Parent") {
                router.push("/user/dashboard");
            } else {
                router.push("/dashboard");
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
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-slate-900 overflow-hidden font-sans p-4 sm:p-6 lg:p-12">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050853064-850439649520?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
            </div>

            <div className="container relative z-10 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative">
                    
                    {/* Left Column: Logo, School Name, Slogan */}
                    <div className="lg:col-span-6 text-center space-y-6 animate-in fade-in slide-in-from-left-4 duration-700 flex flex-col items-center justify-center">
                        <div className="flex justify-center">
                            {settings?.app_logo ? (
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

                        <div className="space-y-3 text-center">
                            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
                                {settings?.school_name || settings?.app_name || "iSchool"}
                            </h1>
                            <p className="text-indigo-200/90 text-lg sm:text-xl font-medium max-w-lg mx-auto">
                                Comprehensive School Management System
                            </p>
                            <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed hidden sm:block">
                                Streamlining education management, empowering teachers, students, and parents with seamlessly integrated digital tools.
                            </p>
                        </div>

                        {/* Desktop Feature Highlights */}
                        <div className="hidden lg:grid grid-cols-2 gap-4 pt-4 border-t border-white/10 w-full max-w-lg">
                            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 backdrop-blur-sm text-center">
                                <div className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">Smart Management</div>
                                <div className="text-slate-300 text-sm">Automated attendance, grading & scheduling</div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 backdrop-blur-sm text-center">
                                <div className="text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">Secure & Fast</div>
                                <div className="text-slate-300 text-sm">Role-based access & encrypted records</div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Stylistic Divider (Desktop) */}
                    <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] w-px flex-col items-center justify-center z-20 pointer-events-none">
                        <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-indigo-500/40 to-transparent" />
                        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-900 shadow-[0_0_12px_#6366f1]" />
                    </div>

                    {/* Mobile Stylistic Divider */}
                    <div className="lg:hidden w-full flex items-center justify-center my-2">
                        <div className="h-[1px] w-full max-w-xs bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                    </div>

                    {/* Right Column: Login Card Section */}
                    <div className="lg:col-span-6 w-full max-w-md mx-auto lg:max-w-lg space-y-6 animate-in fade-in slide-in-from-right-4 duration-700">
                        <Card className="border-white/10 bg-slate-800/60 backdrop-blur-xl shadow-2xl">
                            <Tabs defaultValue="admin" value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <CardHeader className="space-y-4 pb-4">
                                    <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-900/50 p-1 border border-white/5 rounded-xl">
                                        <TabsTrigger 
                                            value="user" 
                                            className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300 font-semibold transition-all"
                                        >
                                            Student/Parent
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
                                
                                <form onSubmit={handleLogin}>
                                    <CardContent className="space-y-4">
                                        {error && (
                                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
                                                {error}
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <Input
                                                    id="email"
                                                    type="text"
                                                    placeholder="Email / Username"
                                                    required
                                                    value={emailOrUsername}
                                                    onChange={(e) => setEmailOrUsername(e.target.value)}
                                                    className="bg-white border-white/10 text-slate-800 focus:ring-indigo-500 h-12 text-base rounded-md"
                                                />
                                                <div className="absolute right-3 top-3 h-6 w-6 bg-slate-300 rounded flex items-center justify-center">
                                                    <div className="flex space-x-0.5">
                                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                                    </div>
                                                </div>
                                                <Mail className="absolute right-12 top-4 h-4 w-4 text-slate-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    placeholder="Password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="bg-white border-white/10 text-slate-800 focus:ring-indigo-500 h-12 text-base rounded-md"
                                                />
                                                <div className="absolute right-3 top-3 h-6 w-6 bg-slate-300 rounded flex items-center justify-center">
                                                    <div className="flex space-x-0.5">
                                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                                    </div>
                                                </div>
                                                <Lock className="absolute right-12 top-4 h-4 w-4 text-slate-400" />
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
