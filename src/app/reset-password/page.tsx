"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import api from "@/lib/api";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const t = searchParams.get("token");
        const e = searchParams.get("email");
        if (t) setToken(t);
        if (e) setEmail(e);

        if (!t || !e) {
            setError("Invalid or missing reset link. Please request a new one.");
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== passwordConfirmation) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post("/reset-password", {
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });

            if (response.data.status === "Success") {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            }
        } catch (err: any) {
            console.error("Reset password error:", err);
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center">
                    <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Password Reset!</h2>
                <p className="text-gray-500">Your password has been successfully updated. Redirecting you to login...</p>
                <div className="pt-4">
                    <Loader2 className="h-5 w-5 text-indigo-600 animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Set New Password</h1>
                <p className="text-sm text-gray-500">Please enter your new password below.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3 text-sm animate-in slide-in-from-top-2 duration-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 h-11 border-gray-200 focus-visible:ring-indigo-500"
                        />
                        <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <div className="relative">
                        <Input
                            id="confirm_password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            className="pl-10 h-11 border-gray-200 focus-visible:ring-indigo-500"
                        />
                        <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading || !!error}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-200 transition-all duration-300"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Updating Password...
                        </span>
                    ) : (
                        "Reset Password"
                    )}
                </Button>
            </form>

            <button
                onClick={() => router.push("/login")}
                className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors w-full"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
            </button>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/10 p-4 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
                <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />
            </div>

            <div className="w-full max-w-[420px]">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 mb-4 rotate-3">
                        <KeyRound className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        Smart School
                    </span>
                </div>

                {/* Form Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-2xl shadow-indigo-500/5 p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                            <p className="text-sm text-gray-400">Loading form...</p>
                        </div>
                    }>
                        <ResetPasswordForm />
                    </Suspense>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-[11px] text-gray-400 font-medium uppercase tracking-widest animate-in fade-in duration-1000">
                    &copy; {new Date().getFullYear()} Smart School. All Rights Reserved.
                </div>
            </div>
        </div>
    );
}
