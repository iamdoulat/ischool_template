"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft, GraduationCap } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.post("/forgot-password", { email });
            setSuccess(true);
        } catch (err: any) {
            console.error("Forgot password request failed:", err);
            setError(err.response?.data?.message || err.message || "Failed to send reset email. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-slate-900 overflow-hidden font-sans">
            {/* Dynamic Background Elements - Consistent with Login */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050853064-850439649520?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
            </div>

            <div className="container relative z-10 flex items-center justify-center px-4">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                            <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20">
                                <GraduationCap className="h-10 w-10 text-white" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                            iSchool <span className="text-primary italic">Cloud</span>
                        </h1>
                    </div>

                    <Card className="border-white/10 bg-slate-800/50 backdrop-blur-xl shadow-2xl">
                        {success ? (
                            <div className="p-8 text-center space-y-6 animate-in zoom-in duration-500">
                                <div className="flex justify-center">
                                    <div className="bg-green-500/20 p-4 rounded-full border border-green-500/30">
                                        <CheckCircle2 className="h-12 w-12 text-green-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-white">Check Your Inbox</h2>
                                    <p className="text-slate-400">
                                        We've sent a password reset link to <span className="text-white font-medium">{email}</span>.
                                    </p>
                                </div>
                                <Button 
                                    className="w-full h-11 bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all"
                                    onClick={() => router.push("/login")}
                                >
                                    Return to Login
                                </Button>
                            </div>
                        ) : (
                            <>
                                <CardHeader className="space-y-1">
                                    <CardTitle className="text-2xl text-white font-bold">Forgot Password</CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Enter your email and we'll send you a recovery link
                                    </CardDescription>
                                </CardHeader>
                                <form onSubmit={handleSubmit}>
                                    <CardContent className="space-y-4">
                                        {error && (
                                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                                                <AlertCircle className="h-4 w-4 shrink-0" />
                                                <p>{error}</p>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-slate-200">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="admin@ischool.com"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    suppressHydrationWarning
                                                    className="pl-10 bg-slate-900/50 border-white/10 text-white focus:ring-primary h-11"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex flex-col space-y-4">
                                        <Button
                                            type="submit"
                                            className="w-full h-11 text-base font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending Recovery Link...
                                                </>
                                            ) : (
                                                "Send Reset Link"
                                            )}
                                        </Button>
                                        <Link 
                                            href="/login" 
                                            className="flex items-center justify-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                                        >
                                            <ArrowLeft className="h-4 w-4" /> Back to Dashboard Login
                                        </Link>
                                    </CardFooter>
                                </form>
                            </>
                        )}
                    </Card>

                    <p className="text-center text-slate-400 text-sm">
                        © 2026 iSchool Management System. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
