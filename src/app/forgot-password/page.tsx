"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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
            setError(err.response?.data?.message || "Failed to send reset email.");
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
                <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
                <p className="text-gray-500">We have sent a password reset link to your email.</p>
                <div className="pt-4">
                    <Button onClick={() => router.push("/login")} disabled={loading}>Back to Login</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/10 p-4 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Forgot Password</h1>
                    <p className="text-sm text-gray-500">Enter your email to receive a reset link.</p>
                </div>
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3 text-sm animate-in slide-in-from-top-2 duration-200">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                id="email"
                                type="email"
                                required
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 h-11 border-gray-200 focus-visible:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300">
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sending Email...
                            </span>
                        ) : (
                            "Send Reset Link"
                        )}
                    </Button>
                </form>
                <button onClick={() => router.push("/login")} className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors w-full">
                    <Mail className="h-4 w-4" /> Back to Login
                </button>
            </div>
        </div>
    );
}
