"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Lock, Mail, GraduationCap, User, Users, Shield, Briefcase, Calculator, BookOpen, PhoneCall, Sparkles, BarChart3, Zap, ExternalLink, RefreshCw } from "lucide-react";
import { useImageUrl } from "@/lib/image-url";
import api from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [emailOrUsername, setEmailOrUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("admin");
    const [settings, setSettings] = useState<{ app_logo?: string; school_name?: string; app_name?: string; tagline?: string; school_slogan?: string; school_description?: string; session?: string; base_url?: string; [key: string]: unknown } | null>(null);
    const [mounted, setMounted] = useState(false);
    const getImageUrl = useImageUrl();

    // Captcha (driven by system-setting → captcha-setting, "user_login" & "admin_login" aliases)
    const [captchaModules, setCaptchaModules] = useState<Record<string, boolean>>({
        user_login: true,
        admin_login: true,
    });
    const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
    const [captchaAnswer, setCaptchaAnswer] = useState("");

    const regenerateCaptcha = () => {
        const a = Math.floor(Math.random() * 8) + 2; // 2 to 9
        const b = Math.floor(Math.random() * 8) + 1; // 1 to 8
        setCaptcha({ a, b });
        setCaptchaAnswer("");
    };

    const isCaptchaRequired = activeTab === "admin"
        ? Boolean(captchaModules.admin_login ?? captchaModules.user_login ?? captchaModules.login ?? false)
        : Boolean(captchaModules.user_login ?? captchaModules.login ?? false);

    useEffect(() => {
        setMounted(true);
        regenerateCaptcha();

        api.get("/system-setting/general-setting").then(r => {
            const data = r.data?.data || r.data || {};
            setSettings(data);
        }).catch(() => { });

        api.get("/system-setting/captcha-settings/public").then(r => {
            const raw = r.data?.data || r.data || {};
            const modules = raw.modules || raw;
            const modulesMap: Record<string, boolean> = {};
            if (typeof modules === "object" && modules !== null) {
                if (Array.isArray(modules)) {
                    modules.forEach((item: { alias?: string; is_active?: boolean | number }) => {
                        if (item?.alias) modulesMap[item.alias] = Boolean(item.is_active);
                    });
                } else {
                    Object.entries(modules).forEach(([k, v]) => {
                        modulesMap[k] = Boolean(v);
                    });
                }
            }
            setCaptchaModules(modulesMap);
        }).catch(() => { });
    }, []);

    const isUserLoginAllowed = mounted ? (Boolean(settings?.student_login ?? true) || Boolean(settings?.parent_login ?? true)) : true;

    useEffect(() => {
        if (mounted && !isUserLoginAllowed && activeTab === "user") {
            setActiveTab("admin");
        }
    }, [mounted, isUserLoginAllowed, activeTab]);

    const getIdentifierPlaceholder = () => {
        if (activeTab === 'admin') {
            return "Email / Username";
        }
        const options = ["Username"];
        if (settings?.student_login_admission_no ?? true) options.push("Admission No");
        if (settings?.student_login_mobile_no || settings?.parent_login_mobile_no) options.push("Mobile");
        if (settings?.student_login_email || settings?.parent_login_email) options.push("Email");
        return options.join(" / ");
    };

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        setError("");
        setPassword("");
        setEmailOrUsername("");
        regenerateCaptcha();
    };

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError("");

        if (isCaptchaRequired && Number(captchaAnswer) !== captcha.a + captcha.b) {
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

            // Store token and role-based PWA configuration
            if (access_token) {
                localStorage.setItem("auth_token", access_token);
            }

            // Redirect and configure PWA based on role
            const userRole = user?.role || user?.user_type || user?.role_name || "";
            const roleLower = String(userRole).toLowerCase().trim();
            const isUserPortal =
                roleLower === "student" ||
                roleLower === "parent" ||
                roleLower === "parents" ||
                roleLower === "guardian" ||
                roleLower === "std" ||
                roleLower === "par";
            const targetStartUrl = isUserPortal ? "/user/dashboard" : "/dashboard";
            const canonicalRole = isUserPortal ? (roleLower.includes("par") ? "Parent" : "Student") : (userRole || "Admin");

            localStorage.setItem("user_role", canonicalRole);
            localStorage.setItem("pwa_start_url", targetStartUrl);
            document.cookie = `pwa_start_url=${targetStartUrl}; path=/; max-age=31536000; SameSite=Lax`;
            document.cookie = `user_role=${canonicalRole}; path=/; max-age=31536000; SameSite=Lax`;

            if (isUserPortal) {
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
        <div className="min-h-screen relative flex items-center justify-center bg-slate-900 overflow-x-hidden font-sans p-2 sm:p-4 lg:p-6" suppressHydrationWarning>
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
            </div>

            <div className="container relative z-10 max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                    
                    {/* Left Column: Logo, School Name, School Slogan, School Description & Features */}
                    <div className="lg:col-span-6 xl:col-span-7 space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-left-4 duration-700">
                        
                        {/* Header & Logo Block (Center Aligned) */}
                        <div className="space-y-2 text-center flex flex-col items-center">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-bold tracking-wide backdrop-blur-md shadow-md">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
                                <span>iSchool Management Portal</span>
                            </div>

                            {/* Logo Display */}
                            <div className="pt-0.5 flex justify-center w-full">
                                {mounted && settings?.app_logo ? (
                                    <div className="inline-block bg-slate-800/80 p-2 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
                                        <img
                                            src={getImageUrl(settings.app_logo)}
                                            alt={settings?.school_name || "School Logo"}
                                            className="h-10 sm:h-12 w-auto max-w-[240px] object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="inline-flex bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/30 border border-white/10">
                                        <GraduationCap className="h-7 w-7 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* School Title & Slogan */}
                            <div className="space-y-0.5 pt-0.5 text-center w-full">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight" suppressHydrationWarning>
                                    {mounted ? (settings?.school_name || "iSchool Management System") : "iSchool Management System"}
                                </h1>
                                {mounted && (settings?.school_slogan || settings?.tagline) && (
                                    <p className="text-indigo-300 font-semibold text-xs sm:text-sm tracking-wide" suppressHydrationWarning>
                                        {settings?.school_slogan || settings?.tagline}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* School Description Container (Only shown when school_description is available) */}
                        {mounted && settings?.school_description && settings.school_description.trim() !== "" && (
                            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-3.5 backdrop-blur-xl space-y-1.5 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all" suppressHydrationWarning>
                                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                                <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px] uppercase tracking-wider">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>School Overview</span>
                                </div>
                                <p className="text-slate-300 text-xs leading-relaxed line-clamp-3" suppressHydrationWarning>
                                    {settings.school_description}
                                </p>
                            </div>
                        )}

                        {/* Feature Highlights Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="bg-slate-800/30 border border-white/10 rounded-xl p-2.5 backdrop-blur-md flex items-center gap-2.5 hover:bg-slate-800/50 transition-colors">
                                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                                    <Users className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-200">Student & Parent Portal</h4>
                                    <p className="text-[10px] text-slate-400">Attendance, fees & report cards</p>
                                </div>
                            </div>

                            <div className="bg-slate-800/30 border border-white/10 rounded-xl p-2.5 backdrop-blur-md flex items-center gap-2.5 hover:bg-slate-800/50 transition-colors">
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                                    <BarChart3 className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-200">Smart Reports & Results</h4>
                                    <p className="text-[10px] text-slate-400">Automated grading & analytics</p>
                                </div>
                            </div>
                        </div>

                        {/* Announcement / Status Footer */}
                        <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-purple-950/60 border border-indigo-500/20 rounded-xl p-2.5 backdrop-blur-md flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                                <Zap className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 text-[11px] sm:text-xs text-slate-300 flex items-center justify-between gap-2">
                                <span className="text-slate-300 font-medium truncate" suppressHydrationWarning>
                                    Academic Portal Session {mounted && settings?.session ? settings.session : (settings?.session || "2025-2026")} Active
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Online
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Dynamic Login Box */}
                    <div className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto lg:ml-auto animate-in fade-in slide-in-from-right-4 duration-700">
                        <Card className="border-white/10 bg-slate-800/60 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <CardHeader className="space-y-2 p-3.5 sm:p-4 pb-2">
                                    {isUserLoginAllowed ? (
                                        <TabsList className="grid grid-cols-2 bg-slate-900/60 p-0.5 rounded-xl border border-white/5 h-9">
                                            <TabsTrigger
                                                value="user"
                                                className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300 font-semibold text-xs transition-all"
                                            >
                                                User Login
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="admin"
                                                className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-300 font-semibold text-xs transition-all"
                                            >
                                                Admin Login
                                            </TabsTrigger>
                                        </TabsList>
                                    ) : (
                                        <div className="bg-slate-900/60 p-1.5 rounded-xl border border-white/5 text-center text-xs font-semibold text-indigo-300">
                                            Admin Portal Login
                                        </div>
                                    )}

                                    <div>
                                        <CardTitle className="text-xl sm:text-2xl text-white font-bold">
                                            {activeTab === 'admin' ? 'Admin Login' : 'User Login'}
                                        </CardTitle>
                                    </div>
                                </CardHeader>

                                <form onSubmit={handleLogin} suppressHydrationWarning>
                                    <CardContent className="space-y-2.5 sm:space-y-3 p-3.5 sm:p-4 pt-1">
                                        {error && (
                                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-2 rounded-lg text-xs text-center">
                                                {error}
                                            </div>
                                        )}
                                        <div className="space-y-1.5">
                                            <div className="relative" suppressHydrationWarning>
                                                <Input
                                                    id="email"
                                                    type="text"
                                                    autoComplete="username"
                                                    placeholder={getIdentifierPlaceholder()}
                                                    required
                                                    value={emailOrUsername}
                                                    onChange={(e) => setEmailOrUsername(e.target.value)}
                                                    className="bg-white border-white/10 text-slate-800 focus:ring-indigo-500 h-10 sm:h-11 text-sm rounded-md"
                                                />
                                                <Mail className="absolute right-3.5 top-3 sm:top-3.5 h-4 w-4 text-slate-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="relative" suppressHydrationWarning>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    autoComplete="current-password"
                                                    placeholder="Password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="bg-white border-white/10 text-slate-800 focus:ring-indigo-500 h-10 sm:h-11 text-sm rounded-md"
                                                />
                                                <Lock className="absolute right-3.5 top-3 sm:top-3.5 h-4 w-4 text-slate-400" />
                                            </div>
                                            <div className="flex justify-end pt-0.5">
                                                <Link href="/forgot-password" className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">Forgot password?</Link>
                                            </div>
                                        </div>

                                        {mounted && isCaptchaRequired && (
                                            <div className="space-y-1.5 pt-0.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-slate-300 text-[11px] font-medium flex items-center gap-1.5">
                                                        <Shield className="w-3.5 h-3.5 text-indigo-400" />
                                                        Captcha Verification
                                                    </Label>
                                                    <button
                                                        type="button"
                                                        onClick={regenerateCaptcha}
                                                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline transition-colors cursor-pointer"
                                                        title="Refresh Captcha"
                                                    >
                                                        <RefreshCw className="w-3 h-3" />
                                                        Refresh
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="select-none px-3.5 h-10 flex items-center justify-center bg-slate-900/90 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-base rounded-md tracking-wider shadow-inner cursor-pointer hover:bg-slate-900 hover:border-indigo-400 transition-colors"
                                                        onClick={regenerateCaptcha}
                                                        title="Click to refresh captcha"
                                                    >
                                                        {captcha.a} + {captcha.b} = ?
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        placeholder="Enter answer"
                                                        required
                                                        value={captchaAnswer}
                                                        onChange={(e) => setCaptchaAnswer(e.target.value)}
                                                        className="bg-white border-white/10 text-slate-800 focus:ring-indigo-500 h-10 text-sm rounded-md flex-1 font-medium"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full h-10 sm:h-11 mt-1 text-base font-bold transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] bg-[#4caf50] hover:bg-[#43a047] text-white shadow-md shadow-green-600/20 rounded-md"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Authenticating...
                                                </>
                                            ) : (
                                                "Sign In"
                                            )}
                                        </Button>

                                        {/* Quick Login Role Buttons */}
                                        <div className="pt-1 space-y-1.5">
                                            <TabsContent value="admin" className="m-0 space-y-1">
                                                <div className="grid grid-cols-3 gap-1">
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('superadmin@ischool.com')} className="bg-[#0284c7] hover:bg-[#0369a1] text-white border-none hover:text-white h-8 sm:h-8.5 shadow-xs flex items-center justify-center gap-1 px-0 rounded-sm">
                                                        <Shield className="w-3 h-3" /> <span className="text-[10px] sm:text-[11px]">Super Admin</span>
                                                    </Button>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('admin@ischool.com')} className="bg-[#00bcd4] hover:bg-[#00acc1] text-white border-none hover:text-white h-8 sm:h-8.5 shadow-xs flex items-center justify-center gap-1 px-0 rounded-sm">
                                                        <Briefcase className="w-3 h-3" /> <span className="text-[10px] sm:text-[11px]">Admin</span>
                                                    </Button>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('teacher@ischool.com')} className="bg-[#9ca3af] hover:bg-[#6b7280] text-white border-none hover:text-white h-8 sm:h-8.5 shadow-xs flex items-center justify-center gap-1 px-0 rounded-sm">
                                                        <BookOpen className="w-3 h-3" /> <span className="text-[10px] sm:text-[11px]">Teacher</span>
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-1">
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('accountant@ischool.com')} className="bg-[#9ca3af] hover:bg-[#6b7280] text-white border-none hover:text-white h-8 sm:h-8.5 shadow-xs flex items-center justify-center gap-1 px-0 rounded-sm">
                                                        <Calculator className="w-3 h-3" /> <span className="text-[10px] sm:text-[11px]">Accountant</span>
                                                    </Button>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('receptionist@ischool.com')} className="bg-[#e91e63] hover:bg-[#d81b60] text-white border-none hover:text-white h-8 sm:h-8.5 shadow-xs flex items-center justify-center gap-1 px-0 rounded-sm">
                                                        <PhoneCall className="w-3 h-3" /> <span className="text-[10px] sm:text-[11px]">Receptionist</span>
                                                    </Button>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('librarian@ischool.com')} className="bg-[#4caf50] hover:bg-[#43a047] text-white border-none hover:text-white h-8 sm:h-8.5 shadow-xs flex items-center justify-center gap-1 px-0 rounded-sm">
                                                        <BookOpen className="w-3 h-3" /> <span className="text-[10px] sm:text-[11px]">Librarian</span>
                                                    </Button>
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="user" className="m-0">
                                                <div className="grid grid-cols-2 gap-1">
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('STD-0100')} className="bg-[#0284c7] hover:bg-[#0369a1] text-white border-none hover:text-white h-8 sm:h-8.5 shadow-xs flex items-center justify-center gap-1.5 rounded-sm">
                                                        <User className="w-3.5 h-3.5" /> <span className="text-xs">Student</span>
                                                    </Button>
                                                    <Button type="button" variant="outline" size="sm" onClick={() => handleRoleFill('PAR-0100')} className="bg-[#e91e63] hover:bg-[#d81b60] text-white border-none hover:text-white h-8 sm:h-8.5 shadow-xs flex items-center justify-center gap-1.5 rounded-sm">
                                                        <Users className="w-3.5 h-3.5" /> <span className="text-xs">Parent</span>
                                                    </Button>
                                                </div>
                                            </TabsContent>
                                        </div>
                                    </CardContent>
                                </form>
                            </Tabs>
                        </Card>
                    </div>

                </div>

                {/* Bottom Middle Credit / Footer */}
                <div className="mt-4 pt-2.5 border-t border-white/5 text-center flex flex-col sm:flex-row items-center justify-center gap-2 text-[11px] text-slate-400">
                    <span>
                        © {new Date().getFullYear()} {mounted ? (settings?.school_name || settings?.app_name || "iSchool") : "iSchool"}. All rights reserved.
                    </span>
                    <span className="hidden sm:inline text-slate-600">•</span>
                    <div className="inline-flex items-center gap-1.5 text-slate-300">
                        <span>Developed by</span>
                        <a
                            href="https://uddoktasoft.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 hover:text-white font-semibold text-[11px] border border-indigo-500/30 hover:border-indigo-400 shadow-xs transition-all duration-200 active:scale-95 group"
                        >
                            <span>Uddokta Soft</span>
                            <ExternalLink className="w-3 h-3 text-indigo-400 group-hover:text-white transition-colors" />
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}
