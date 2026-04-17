"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Mail, GraduationCap } from "lucide-react";
import api from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await api.post("/login", { email, password });
            const { access_token } = response.data.data;

            // Store token
            localStorage.setItem("auth_token", access_token);

            // Redirect to dashboard
            router.push("/dashboard");
        } catch (err: any) {
            console.error("Login attempt failed:", err);
            setError(
                err.response?.data?.message || err.message || "Login failed. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-slate-900 overflow-hidden font-sans">
            {/* Dynamic Background Elements */}
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
                        <p className="text-slate-400 text-lg font-medium">
                            Manage your institution with ease
                        </p>
                    </div>

                    <Card className="border-white/10 bg-slate-800/50 backdrop-blur-xl shadow-2xl">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-2xl text-white font-bold">Sign in</CardTitle>
                            <CardDescription className="text-slate-400">
                                Enter your credentials to access the portal
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleLogin}>
                            <CardContent className="space-y-4">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
                                        {error}
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
                                            className="pl-10 bg-slate-900/50 border-white/10 text-white focus:ring-primary h-11"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-slate-200">Password</Label>
                                        <Link href="/forgot-password" className="text-xs text-primary hover:underline transition-colors">Forgot password?</Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
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
                                            Authenticating...
                                        </>
                                    ) : (
                                        "Dashboard Login"
                                    )}
                                </Button>
                                <div className="text-center text-sm text-slate-500 font-medium">
                                    Secure access for authorized personnel
                                </div>
                            </CardFooter>
                        </form>
                    </Card>

                    <p className="text-center text-slate-400 text-sm">
                        © 2026 iSchool Management System. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
