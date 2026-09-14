"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Building2,
    MapPin,
    Phone,
    Mail,
    User,
    ArrowRight,
    LogIn,
    GraduationCap,
    School,
    Loader2,
    Sparkles,
    ShieldCheck
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface BranchData {
    id: number;
    branch_name: string;
    school_slogan?: string;
    school_description?: string;
    branch_code: string;
    slug: string;
    branch_url?: string;
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
    total_students_count?: number;
    total_staff_count?: number;
}

export default function BranchLandingPage() {
    const params = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const slug = params?.slug as string;

    const [branch, setBranch] = useState<BranchData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;

        const fetchBranch = async () => {
            setLoading(true);
            setError(null);
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
                } else {
                    setError("Branch information not found");
                }
            } catch (err: any) {
                console.error("Failed to load branch details:", err);
                setError("Branch not found or currently unavailable.");
            } finally {
                setLoading(false);
            }
        };

        fetchBranch();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                    Connecting to Campus Branch Portal...
                </p>
            </div>
        );
    }

    if (error || !branch) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
                <Card className="max-w-md w-full text-center border-rose-200 dark:border-rose-900 shadow-xl rounded-3xl p-6">
                    <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center mx-auto mb-4 text-rose-600">
                        <Building2 className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        Branch Not Found
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mb-6">
                        {error || "The campus branch you requested does not exist or has been relocated."}
                    </CardDescription>
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => router.push("/")}
                            className="bg-primary text-white rounded-xl h-11"
                        >
                            Return to Main Portal
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push("/login")}
                            className="rounded-xl h-11"
                        >
                            Direct System Login
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
            {/* Top Navigation Bar */}
            <header className="h-16 border-b bg-background/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white shadow-md shadow-primary/25 overflow-hidden border border-primary/20">
                        {branch.logo ? (
                            <img src={branch.logo} alt={branch.branch_name} className="w-full h-full object-cover" />
                        ) : (
                            <School className="h-5 w-5" />
                        )}
                    </div>
                    <div>
                        <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-foreground flex items-center gap-2">
                            {branch.branch_name}
                            {branch.is_main && (
                                <span className="text-[10px] uppercase font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                                    Main Campus
                                </span>
                            )}
                        </h1>
                        <p className="text-[11px] font-medium text-muted-foreground">
                            Campus Code: <span className="font-bold text-foreground">{branch.branch_code || branch.slug}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Link href={`/br/${branch.slug}/login`}>
                        <Button className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs sm:text-sm rounded-xl h-9 sm:h-10 px-3 sm:px-5 gap-2 shadow-md shadow-primary/20">
                            <LogIn className="h-4 w-4" />
                            <span>Branch Login</span>
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Hero & Branch Identity Banner */}
            <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                    
                    {/* Left Column: Campus Overview */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide">
                            <Sparkles className="h-3.5 w-3.5" />
                            Dedicated Campus Portal
                        </div>

                        <div>
                            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                Welcome to <br />
                                <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                                    {branch.branch_name}
                                </span>
                            </h2>
                            {branch.school_slogan && (
                                <p className="text-sm font-semibold text-primary/90 italic mt-2">
                                    "{branch.school_slogan}"
                                </p>
                            )}
                        </div>

                        <p className="text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                            {branch.school_description || "Official campus management branch for students, faculty, and administrative staff. Access branch-specific academic schedules, attendance, grading, and digital student services."}
                        </p>

                        {/* Campus Info Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {branch.address && (
                                <div className="p-4 rounded-2xl bg-card border border-muted/80 shadow-sm flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Campus Address</p>
                                        <p className="text-xs font-semibold text-foreground mt-0.5 line-clamp-2">{branch.address}</p>
                                    </div>
                                </div>
                            )}

                            {branch.principal_name && (
                                <div className="p-4 rounded-2xl bg-card border border-muted/80 shadow-sm flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Branch Principal / Head</p>
                                        <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{branch.principal_name}</p>
                                    </div>
                                </div>
                            )}

                            {branch.phone && (
                                <div className="p-4 rounded-2xl bg-card border border-muted/80 shadow-sm flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Campus Helpline</p>
                                        <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{branch.phone}</p>
                                    </div>
                                </div>
                            )}

                            {branch.email && (
                                <div className="p-4 rounded-2xl bg-card border border-muted/80 shadow-sm flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email Contact</p>
                                        <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{branch.email}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-4">
                            <Link href={`/br/${branch.slug}/login`}>
                                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl px-6 h-12 gap-2 shadow-lg shadow-primary/25">
                                    <span>Access Branch Portal</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button size="lg" variant="outline" className="rounded-2xl px-6 h-12 font-semibold">
                                    Main System Login
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Portal Access Card */}
                    <div className="lg:col-span-5">
                        <Card className="rounded-3xl border-muted/60 shadow-2xl bg-card/95 backdrop-blur-xl overflow-hidden relative">
                            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary to-indigo-600" />
                            <CardHeader className="pt-8 pb-4 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-inner">
                                    <GraduationCap className="h-7 w-7" />
                                </div>
                                <CardTitle className="text-2xl font-black text-foreground">
                                    Campus Portal
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Secure login for {branch.branch_name} members
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4 pb-8">
                                <div className="p-4 rounded-2xl bg-muted/30 border border-muted/50 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground font-medium">Campus Status:</span>
                                        <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                            Active & Online
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground font-medium">Branch Identification:</span>
                                        <span className="font-mono font-bold text-foreground">{branch.branch_code || branch.slug}</span>
                                    </div>
                                </div>

                                <Link href={`/br/${branch.slug}/login`} className="block w-full">
                                    <Button className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white font-bold h-12 rounded-2xl shadow-lg shadow-primary/20 hover:opacity-95 transition-all gap-2">
                                        <LogIn className="h-4 w-4" />
                                        <span>Proceed to Login</span>
                                    </Button>
                                </Link>

                                <div className="text-center">
                                    <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                        Encrypted Branch Authentication
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 border-t bg-background/50 text-center text-xs text-muted-foreground">
                <p>© {new Date().getFullYear()} {branch.branch_name} — Powered by iSchool Unified Multi-Branch Management</p>
            </footer>
        </div>
    );
}
