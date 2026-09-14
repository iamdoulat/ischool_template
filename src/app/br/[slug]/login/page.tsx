"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2, Lock, Mail, GraduationCap, User, Users, Shield, Briefcase,
    Building2, MapPin, Phone, Sparkles, RefreshCw, ArrowLeft, School, Star
} from "lucide-react";
import { useImageUrl } from "@/lib/image-url";
import api, { setCachedProfile } from "@/lib/api";
import { toast } from "sonner";
import { tokenManager } from "@/lib/token-manager";

interface BranchData {
    id: number;
    branch_name: string;
    school_slogan?: string;
    school_description?: string;
    branch_code: string;
    slug: string;
    is_main: boolean;
    phone?: string;
    email?: string;
    address?: string;
    principal_name?: string;
    logo?: string;
    admin_logo?: string;
    print_logo?: string;
    primary_color?: string;
    status: string;
}

export default function BranchLoginPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug as string;
    const getImageUrl = useImageUrl();

    const [branch, setBranch] = useState<BranchData | null>(null);
    const [loadingBranch, setLoadingBranch] = useState(true);

    const [emailOrUsername, setEmailOrUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("admin");
    const [mounted, setMounted] = useState(false);

    // Captcha
    const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
    const [captchaAnswer, setCaptchaAnswer] = useState("");

    const regenerateCaptcha = () => {
        const a = Math.floor(Math.random() * 8) + 2;
        const b = Math.floor(Math.random() * 8) + 1;
        setCaptcha({ a, b });
        setCaptchaAnswer("");
    };

    useEffect(() => {
        setMounted(true);
        regenerateCaptcha();

        // Prefetch dashboard destinations for instant transition
        if (slug) {
            router.prefetch(`/br/${slug}/dashboard`);
            router.prefetch(`/br/${slug}/user/dashboard`);
        }
        router.prefetch("/dashboard");
        router.prefetch("/user/dashboard");

        if (!slug) return;

        const fetchBranch = async () => {
            setLoadingBranch(true);
            try {
                const res = await api.get(`/multi-branch/branches/by-slug/${slug}`, {
                    skipGlobalErrorHandler: true,
                });
                const data = res.data?.data || res.data;
                if (data) {
                    setBranch(data);
                    if (typeof window !== "undefined") {
                        localStorage.setItem("active_branch_id", data.id.toString());
                        localStorage.setItem("active_branch_slug", data.slug || slug);
                        localStorage.setItem("active_branch_name", data.branch_name);
                        document.cookie = `active_branch_id=${data.id}; path=/; max-age=2592000; SameSite=Lax`;
                    }
                }
            } catch (err) {
                console.error("Failed to load branch details:", err);
            } finally {
                setLoadingBranch(false);
            }
        };

        fetchBranch();
    }, [slug, router]);

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

        if (Number(captchaAnswer) !== captcha.a + captcha.b) {
            setError("Incorrect captcha answer. Please try again.");
            regenerateCaptcha();
            return;
        }

        setLoading(true);

        try {
            const response = await api.post("/login", {
                email_or_username: emailOrUsername.trim(),
                password: password,
                branch_slug: slug,
                branch_id: branch?.id,
            });
            const resData = response.data?.data || response.data;
            const access_token = resData?.access_token || resData?.token;
            const user = resData?.user;

            if (access_token) {
                await tokenManager.setToken(access_token);
            }

            const activeBranchId = resData?.branch_id || branch?.id;
            const activeBranchSlug = resData?.branch_slug || branch?.slug || slug;
            const activeBranchName = resData?.branch_name || branch?.branch_name;
            const isMainBranch = Boolean(
                branch?.is_main ||
                activeBranchSlug === "main" ||
                slug === "main" ||
                activeBranchId === 1 ||
                String(activeBranchId) === "1"
            );

            if (isMainBranch) {
                localStorage.removeItem("active_branch_id");
                localStorage.removeItem("active_branch_slug");
                localStorage.removeItem("active_branch_name");
                document.cookie = "active_branch_id=; path=/; max-age=0";
            } else {
                if (activeBranchId) {
                    localStorage.setItem("active_branch_id", activeBranchId.toString());
                    document.cookie = `active_branch_id=${activeBranchId}; path=/; max-age=2592000; SameSite=Lax`;
                }
                if (activeBranchSlug) {
                    localStorage.setItem("active_branch_slug", activeBranchSlug);
                }
                if (activeBranchName) {
                    localStorage.setItem("active_branch_name", activeBranchName);
                }
            }

            const userRole = user?.role || user?.user_type || user?.role_name || "";
            const roleLower = String(userRole).toLowerCase().trim();
            const isUserPortal =
                roleLower === "student" ||
                roleLower === "parent" ||
                roleLower === "parents" ||
                roleLower === "guardian" ||
                roleLower === "std" ||
                roleLower === "par";
            const branchSlug = activeBranchSlug || slug;
            const targetStartUrl = isMainBranch || !branchSlug || branchSlug === "main"
                ? (isUserPortal ? "/user/dashboard" : "/dashboard")
                : (isUserPortal ? `/br/${branchSlug}/user/dashboard` : `/br/${branchSlug}/dashboard`);
            const canonicalRole = isUserPortal ? (roleLower.includes("par") ? "Parent" : "Student") : (userRole || "Admin");

            localStorage.setItem("user_role", canonicalRole);
            localStorage.setItem("pwa_start_url", targetStartUrl);
            document.cookie = `pwa_start_url=${targetStartUrl}; path=/; max-age=31536000; SameSite=Lax`;
            document.cookie = `user_role=${canonicalRole}; path=/; max-age=31536000; SameSite=Lax`;

            toast.success(`Welcome back, ${user?.name || "User"}!`);

            if (user) {
                setCachedProfile(user);
            }

            router.replace(targetStartUrl);
        } catch (err: unknown) {
            console.error("Login attempt failed:", err);
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
            const msg = errorObj.response?.data?.message || errorObj.message || "Login failed. Please check your credentials.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleFill = (roleEmail: string, customPassword?: string) => {
        setEmailOrUsername(roleEmail);
        const passwords: Record<string, string> = {
            "branchadmin@ischool.com": "bracnhadmin1234",
            "brstudent@ischool.com": "brstudent1234",
            "admin@ischool.com": "admin1234",
            "teacher@ischool.com": "teacher@123",
            "accountant@ischool.com": "accountant@123",
            "STD-0100": "student123",
            "PAR-0100": "parent123",
        };
        setPassword(customPassword || passwords[roleEmail] || "password123");
        setCaptchaAnswer(String(captcha.a + captcha.b));
        setError("");
        if (roleEmail === "brstudent@ischool.com" || roleEmail === "STD-0100" || roleEmail === "PAR-0100") {
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
                {/* Back to branch landing */}
                <div className="mb-4">
                    <Link
                        href={`/br/${slug}`}
                        className="inline-flex items-center gap-2 text-xs font-bold text-indigo-300 hover:text-white transition-colors bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to {branch?.branch_name || "Campus Portal"}</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                    {/* Left Column: Campus Info */}
                    <div className="lg:col-span-6 xl:col-span-7 space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-left-4 duration-700">
                        {/* Header & Badge Block */}
                        <div className="space-y-2 text-center flex flex-col items-center">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-bold tracking-wide backdrop-blur-md shadow-md">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
                                <span>{branch?.branch_name || "Campus Portal"} • Code: {branch?.branch_code || branch?.slug?.toUpperCase() || "CAMPUS"}</span>
                            </div>

                            {/* Branch Logo Display */}
                            <div className="pt-0.5 flex justify-center w-full">
                                {(branch?.logo || branch?.admin_logo || branch?.app_logo || branch?.print_logo) ? (
                                    <div className="inline-block bg-slate-800/80 p-2.5 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
                                        <img
                                            src={getImageUrl(branch.logo || branch.admin_logo || branch.app_logo || branch.print_logo)}
                                            alt={branch.branch_name}
                                            className="h-12 sm:h-14 w-auto max-w-[240px] object-contain rounded-xl"
                                        />
                                    </div>
                                ) : (
                                    <div className="inline-flex bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/30 border border-white/10">
                                        <School className="h-8 w-8 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Branch School Name, Slogan & Code */}
                            <div className="space-y-1 pt-0.5 text-center w-full">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight flex items-center justify-center gap-2" suppressHydrationWarning>
                                    <span>{branch ? branch.branch_name : "Campus Branch Portal"}</span>
                                    {branch?.is_main && (
                                        <span className="text-[10px] uppercase font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 px-2 py-0.5 rounded-full">
                                            Main
                                        </span>
                                    )}
                                </h1>
                                {branch?.school_slogan && (
                                    <p className="text-indigo-300 font-semibold text-xs sm:text-sm tracking-wide" suppressHydrationWarning>
                                        "{branch.school_slogan}"
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Branch Description */}
                        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed text-center max-w-xl mx-auto line-clamp-3">
                            {branch?.school_description || "Welcome to the official branch portal. Sign in to access campus-specific attendance, grades, fee records, academic timetables, and administration modules."}
                        </p>

                        {/* Campus Info Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                            {branch?.address && (
                                <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-800/40 border border-white/5 backdrop-blur-sm">
                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Campus Address</h2>
                                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{branch.address}</p>
                                    </div>
                                </div>
                            )}

                            {branch?.phone && (
                                <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-800/40 border border-white/5 backdrop-blur-sm">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Branch Helpline</h2>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">{branch.phone}</p>
                                    </div>
                                </div>
                            )}

                            {branch?.principal_name && (
                                <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-800/40 border border-white/5 backdrop-blur-sm">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Campus Head</h2>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">{branch.principal_name}</p>
                                    </div>
                                </div>
                            )}

                            {branch?.branch_code && (
                                <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-800/40 border border-white/5 backdrop-blur-sm">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-xs font-bold text-white uppercase tracking-wider">Branch Code</h2>
                                        <p className="text-xs font-mono font-bold text-indigo-300 truncate mt-0.5">{branch.branch_code}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Demo Credentials */}
                        <div className="pt-2 border-t border-white/10">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
                                Quick Sign-in Shortcuts
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRoleFill("branchadmin@ischool.com", "bracnhadmin1234")}
                                    className="h-7 text-xs bg-slate-800/60 border-white/10 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg gap-1.5"
                                >
                                    <Shield className="h-3 w-3 text-indigo-400" />
                                    <span>Branch Admin</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRoleFill("brstudent@ischool.com", "brstudent1234")}
                                    className="h-7 text-xs bg-slate-800/60 border-white/10 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg gap-1.5"
                                >
                                    <GraduationCap className="h-3 w-3 text-cyan-400" />
                                    <span>Student</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRoleFill("teacher@ischool.com")}
                                    className="h-7 text-xs bg-slate-800/60 border-white/10 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg gap-1.5"
                                >
                                    <Briefcase className="h-3 w-3 text-emerald-400" />
                                    <span>Teacher</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRoleFill("parent@ischool.com")}
                                    className="h-7 text-xs bg-slate-800/60 border-white/10 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg gap-1.5"
                                >
                                    <Users className="h-3 w-3 text-purple-400" />
                                    <span>Parent</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sign In Card */}
                    <div className="lg:col-span-6 xl:col-span-5">
                        <Card className="border-white/10 bg-slate-800/60 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                            <CardHeader className="space-y-1.5 p-4 sm:p-5 pb-2">
                                <CardTitle className="text-xl sm:text-2xl text-white font-bold tracking-tight">
                                    {branch ? `${branch.branch_name} Sign In` : "Campus Sign In"}
                                </CardTitle>
                                <CardDescription className="text-slate-400 text-xs sm:text-sm">
                                    Access your {branch?.branch_name ? branch.branch_name : "branch"} administration or user account
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-5 pt-2">
                                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-900/60 p-1 border border-white/5 rounded-xl h-11">
                                        <TabsTrigger
                                            value="admin"
                                            className="text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <Shield className="h-3.5 w-3.5" />
                                            <span>Staff / Admin</span>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="user"
                                            className="text-xs sm:text-sm font-semibold rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <GraduationCap className="h-3.5 w-3.5" />
                                            <span>Student / Parent</span>
                                        </TabsTrigger>
                                    </TabsList>

                                    <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
                                        {error && (
                                            <div className="p-3 text-xs sm:text-sm text-red-300 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-2">
                                                <span>{error}</span>
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-semibold text-slate-300">
                                                {activeTab === "admin" ? "Staff Email / Username" : "Admission No / Username / Email"}
                                            </Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    type="text"
                                                    value={emailOrUsername}
                                                    onChange={(e) => setEmailOrUsername(e.target.value)}
                                                    placeholder={activeTab === "admin" ? "branchadmin@ischool.com" : "brstudent@ischool.com"}
                                                    required
                                                    className="pl-9 bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 h-10 sm:h-11 rounded-xl text-xs sm:text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-semibold text-slate-300">Password</Label>
                                                <Link
                                                    href={`/br/${slug}/forgot-password`}
                                                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                                                >
                                                    Forgot password?
                                                </Link>
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    type="password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    required
                                                    className="pl-9 bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 h-10 sm:h-11 rounded-xl text-xs sm:text-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Captcha */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-semibold text-slate-300">Security Verification</Label>
                                                <button
                                                    type="button"
                                                    onClick={regenerateCaptcha}
                                                    className="text-indigo-400 hover:text-indigo-300 text-xs inline-flex items-center gap-1"
                                                >
                                                    <RefreshCw className="h-3 w-3" />
                                                    <span>Refresh</span>
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-10 sm:h-11 px-4 bg-slate-900 border border-white/10 rounded-xl flex items-center justify-center font-mono font-bold text-sm text-indigo-300 tracking-wider select-none shrink-0">
                                                    {captcha.a} + {captcha.b} = ?
                                                </div>
                                                <Input
                                                    type="number"
                                                    value={captchaAnswer}
                                                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                                                    placeholder="Answer"
                                                    required
                                                    className="bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 h-10 sm:h-11 rounded-xl text-xs sm:text-sm font-mono"
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={loading || loadingBranch}
                                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold h-10 sm:h-11 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-xs sm:text-sm mt-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Signing in...
                                                </>
                                            ) : (
                                                `Sign in to ${branch ? branch.branch_name : "Campus"}`
                                            )}
                                        </Button>

                                        {/* Bottom Demo User Prefill Buttons */}
                                        <div className="pt-3 border-t border-white/10">
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
                                                Demo Sign-in Credentials
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRoleFill("branchadmin@ischool.com", "branchadmin1234")}
                                                    className="h-11 text-xs bg-slate-900/80 border-indigo-500/30 hover:border-indigo-500/60 text-indigo-200 hover:text-white hover:bg-indigo-600/30 rounded-xl flex flex-col items-center justify-center p-1.5 leading-tight transition-all shadow-sm group"
                                                >
                                                    <div className="flex items-center gap-1.5 font-bold">
                                                        <Shield className="h-3.5 w-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                                                        <span>Branch Admin</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-full">branchadmin@ischool.com</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRoleFill("brstudent@ischool.com", "brstudent1234")}
                                                    className="h-11 text-xs bg-slate-900/80 border-cyan-500/30 hover:border-cyan-500/60 text-cyan-200 hover:text-white hover:bg-cyan-600/30 rounded-xl flex flex-col items-center justify-center p-1.5 leading-tight transition-all shadow-sm group"
                                                >
                                                    <div className="flex items-center gap-1.5 font-bold">
                                                        <GraduationCap className="h-3.5 w-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                                                        <span>Student</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-full">brstudent@ischool.com</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
