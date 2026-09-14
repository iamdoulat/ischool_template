"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, School, ArrowLeft, Mail, Sparkles, MapPin, Phone, Building2 } from "lucide-react";
import { useImageUrl } from "@/lib/image-url";
import api from "@/lib/api";

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
}

export default function BranchForgotPasswordPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const getImageUrl = useImageUrl();

    const [branch, setBranch] = useState<BranchData | null>(null);
    const [emailOrUsername, setEmailOrUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!slug) return;

        api.get(`/multi-branch/branches/by-slug/${slug}`, {
            skipGlobalErrorHandler: true,
        }).then((res) => {
            const data = res.data?.data || res.data;
            if (data) setBranch(data);
        }).catch((err) => {
            console.error("Failed to load branch details:", err);
        });
    }, [slug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await api.post("/forgot-password", { email_or_username: emailOrUsername });
            setSent(true);
        } catch (err: any) {
            setError(
                err.response?.data?.message || "Failed to send reset email. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-slate-900 overflow-x-hidden font-sans p-3 sm:p-4 lg:p-6" suppressHydrationWarning>
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
            </div>

            <div className="container relative z-10 max-w-md mx-auto px-2 sm:px-4 py-4">
                <div className="w-full space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    
                    {/* Header & Logo Block */}
                    <div className="space-y-2 text-center flex flex-col items-center">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-bold tracking-wide backdrop-blur-md shadow-md">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
                            <span>Campus Recovery • Code: {branch?.branch_code || branch?.slug?.toUpperCase() || "CAMPUS"}</span>
                        </div>

                        {/* Branch Logo Display */}
                        <div className="pt-0.5 flex justify-center w-full">
                            {branch?.logo ? (
                                <div className="inline-block bg-slate-800/80 p-2 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
                                    <img
                                        src={getImageUrl(branch.logo)}
                                        alt={branch.branch_name}
                                        className="h-10 sm:h-12 w-auto max-w-[240px] object-contain rounded-xl"
                                    />
                                </div>
                            ) : (
                                <div className="inline-flex bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/30 border border-white/10">
                                    <School className="h-7 w-7 text-white" />
                                </div>
                            )}
                        </div>

                        {/* School Title & Slogan */}
                        <div className="space-y-0.5 pt-0.5 text-center w-full">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight" suppressHydrationWarning>
                                {branch ? branch.branch_name : "Campus Branch Portal"}
                            </h1>
                            {branch?.school_slogan && (
                                <p className="text-indigo-300 font-semibold text-xs sm:text-sm tracking-wide" suppressHydrationWarning>
                                    "{branch.school_slogan}"
                                </p>
                            )}
                            {branch?.address && (
                                <p className="text-slate-400 text-xs flex items-center justify-center gap-1 pt-1">
                                    <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                                    <span>{branch.address}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <Card className="border-white/10 bg-slate-800/60 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                        <CardHeader className="space-y-1.5 p-4 sm:p-5 pb-2">
                            <CardTitle className="text-xl sm:text-2xl text-white font-bold tracking-tight">Forgot Password</CardTitle>
                            <CardDescription className="text-slate-400 text-xs sm:text-sm">
                                {sent
                                    ? "Check your email for the password reset link."
                                    : "Enter your username or email and we will send you a reset link."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5 pt-2">
                            {sent ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-center space-y-2">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center mx-auto">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <p className="text-sm font-medium text-white">Reset link sent!</p>
                                        <p className="text-xs text-slate-400">
                                            If an account exists for <span className="text-indigo-300 font-semibold">{emailOrUsername}</span>, you will receive password reset instructions shortly.
                                        </p>
                                    </div>
                                    <Link href={`/br/${slug}/login`}>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full bg-slate-900/60 border-white/10 text-white hover:bg-slate-800 h-10 sm:h-11 rounded-xl text-xs sm:text-sm"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Branch Sign In
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {error && (
                                        <div className="p-3 text-xs sm:text-sm text-red-300 bg-red-950/40 border border-red-500/30 rounded-xl">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-300">Email or Username</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="text"
                                                value={emailOrUsername}
                                                onChange={(e) => setEmailOrUsername(e.target.value)}
                                                placeholder="e.g. staff@ischool.com or STD-0100"
                                                required
                                                className="pl-9 bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 h-10 sm:h-11 rounded-xl text-xs sm:text-sm"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold h-10 sm:h-11 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-xs sm:text-sm"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sending Reset Link...
                                            </>
                                        ) : (
                                            "Send Reset Link"
                                        )}
                                    </Button>

                                    <div className="text-center pt-2">
                                        <Link
                                            href={`/br/${slug}/login`}
                                            className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors gap-1.5"
                                        >
                                            <ArrowLeft className="h-3.5 w-3.5" />
                                            Back to Branch Sign In
                                        </Link>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
