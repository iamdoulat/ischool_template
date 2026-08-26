"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, GraduationCap, ArrowLeft, Mail, Sparkles } from "lucide-react";
import { useImageUrl } from "@/lib/image-url";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
    const [emailOrUsername, setEmailOrUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const getImageUrl = useImageUrl();
    const [settings, setSettings] = useState<{ app_logo?: string; school_name?: string; school_slogan?: string; tagline?: string } | null>(null);

    useEffect(() => {
        setMounted(true);
        api.get("/system-setting/general-setting").then(r => {
            const data = r.data?.data || r.data || {};
            setSettings(data);
        }).catch(() => {});
    }, []);

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

                    <Card className="border-white/10 bg-slate-800/60 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
                        <CardHeader className="space-y-1.5 p-4 sm:p-5 pb-2">
                            <CardTitle className="text-xl sm:text-2xl text-white font-bold tracking-tight">Forgot Password</CardTitle>
                            <CardDescription className="text-slate-400 text-xs sm:text-sm">
                                {sent
                                    ? "Check your email for the reset link."
                                    : "Enter your email or username and we'll send you a reset link."
                                }
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="p-4 sm:p-5 pt-2 space-y-4">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-xs sm:text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                {sent ? (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-5 rounded-xl text-center space-y-2">
                                        <Mail className="h-9 w-9 mx-auto text-emerald-400" />
                                        <p className="text-sm font-bold">Reset link sent!</p>
                                        <p className="text-xs text-emerald-400/80">If an account exists with that email/username, you will receive a password reset link shortly.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <div className="relative">
                                            <Input
                                                id="email_or_username"
                                                type="text"
                                                placeholder="Email / Username"
                                                required
                                                value={emailOrUsername}
                                                onChange={(e) => setEmailOrUsername(e.target.value)}
                                                className="bg-white border-white/10 text-slate-900 focus:ring-indigo-500 h-11 text-xs sm:text-sm font-semibold rounded-xl pl-3.5 pr-10"
                                            />
                                            <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                {!sent && (
                                    <Button
                                        type="submit"
                                        className="w-full h-11 text-sm font-bold tracking-wide transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-600/20 rounded-xl cursor-pointer"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            "Send Reset Link"
                                        )}
                                    </Button>
                                )}

                                <div className="text-center pt-2">
                                    <Link href="/login" className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 font-semibold hover:underline transition-colors">
                                        <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
                                    </Link>
                                </div>
                            </CardContent>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
