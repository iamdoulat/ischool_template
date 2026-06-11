"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, GraduationCap, ArrowLeft, Lock } from "lucide-react";
import api from "@/lib/api";

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const emailOrUsername = searchParams.get("email_or_username") || "";

    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [settings, setSettings] = useState<{ app_logo?: string; school_name?: string } | null>(null);

    useEffect(() => {
        api.get("/system-setting/general-setting").then(r => {
            const data = r.data?.data || r.data || {};
            setSettings(data);
        }).catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (password !== passwordConfirmation) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            await api.post("/reset-password", {
                email_or_username: emailOrUsername,
                token,
                password,
                password_confirmation: passwordConfirmation,
            });
            setSuccess(true);
            setTimeout(() => router.push("/login"), 3000);
        } catch (err: any) {
            setError(
                err.response?.data?.message || "Failed to reset password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-slate-900 overflow-hidden font-sans">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="container relative z-10 flex items-center justify-center px-4">
                <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                            {settings?.app_logo ? (
                                <img
                                    src={settings.app_logo}
                                    alt={settings?.school_name || "School Logo"}
                                    className="h-16 w-auto object-contain"
                                />
                            ) : (
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-xl shadow-indigo-500/30 border border-white/10">
                                    <GraduationCap className="h-10 w-10 text-white" />
                                </div>
                            )}
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                            iSchool <span className="text-indigo-400 italic">Cloud</span>
                        </h1>
                    </div>

                    <Card className="border-white/10 bg-slate-800/60 backdrop-blur-xl shadow-2xl">
                        <CardHeader className="space-y-4 pb-4">
                            <div>
                                <CardTitle className="text-2xl text-white font-bold">Reset Password</CardTitle>
                                <CardDescription className="text-slate-400 text-sm mt-2">
                                    {success ? "Password reset successful!" : "Enter your new password below."}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-6 rounded-lg text-center space-y-2">
                                        <Lock className="h-10 w-10 mx-auto" />
                                        <p className="text-sm font-medium">Password reset successful!</p>
                                        <p className="text-xs text-green-400/70">Redirecting to login...</p>
                                    </div>
                                )}

                                {!success && (
                                    <>
                                        <div className="space-y-2">
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="New Password"
                                                required
                                                minLength={8}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="bg-white border-white/10 text-slate-800 focus:ring-indigo-500 h-12 text-base rounded-md"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Input
                                                id="password_confirmation"
                                                type="password"
                                                placeholder="Confirm New Password"
                                                required
                                                minLength={8}
                                                value={passwordConfirmation}
                                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                                className="bg-white border-white/10 text-slate-800 focus:ring-indigo-500 h-12 text-base rounded-md"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-12 mt-2 text-lg font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 rounded-md"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Resetting...
                                                </>
                                            ) : (
                                                "Reset Password"
                                            )}
                                        </Button>
                                    </>
                                )}

                                <div className="text-center pt-2">
                                    <Link href="/login" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                                        <ArrowLeft className="h-4 w-4" /> Back to Login
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
