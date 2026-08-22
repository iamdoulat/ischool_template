"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Loader2,
    CheckCircle2,
    AlertCircle,
    Mail,
    Phone,
    MapPin,
    GraduationCap,
    RefreshCw,
    Send,
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    Youtube
} from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { useImageUrl } from "@/lib/image-url";
import api from "@/lib/api";

export function ContactFormSection() {
    const { settings } = useSettings();
    const getImageUrl = useImageUrl();

    // Determine School Main Logo & Admin Small Logo
    const mainLogoUrl = settings?.admin_logo || settings?.app_logo || settings?.print_logo;
    const smallLogoUrl = settings?.admin_small_logo || settings?.app_logo || settings?.admin_logo;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
            {/* Left Column: Contact Form */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Send Us a Message</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Fill out the form below and our team will get back to you promptly.
                    </p>
                </div>
                <ContactForm />
            </div>

            {/* Right Column: School Information */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/60 rounded-xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                        School Information
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Official contact details and location
                    </p>
                </div>

                {/* School Logos & School Title */}
                <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-slate-800">
                    {/* Top: School Main Logo */}
                    {mainLogoUrl ? (
                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700/80 inline-flex items-center justify-center max-w-[240px] shadow-xs">
                            <img
                                src={getImageUrl(mainLogoUrl)}
                                alt={settings?.school_name || "School Main Logo"}
                                className="h-10 max-h-12 w-auto object-contain"
                            />
                        </div>
                    ) : null}

                    {/* School Name & Admin Small Logo */}
                    <div className="flex items-center gap-3.5 pt-1">
                        {/* Admin Small Logo */}
                        <div className="h-12 w-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                            {smallLogoUrl ? (
                                <img
                                    src={getImageUrl(smallLogoUrl)}
                                    alt="Admin Small Logo"
                                    className="max-h-full max-w-full object-contain"
                                />
                            ) : (
                                <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            )}
                        </div>

                        <div>
                            <h4 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-snug">
                                {settings?.school_name || "Bhujpur Government Primary School"}
                            </h4>
                            {settings?.school_slogan && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                    {settings.school_slogan}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details List */}
                <div className="space-y-4">
                    {/* Address */}
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="h-4 w-4" />
                        </div>
                        <div className="text-sm">
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Address:</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                {settings?.address || "House#68, Road#10, Sector#10, Uttara Model Town, Dhaka-1230"}
                            </span>
                        </div>
                    </div>

                    {/* Email ID */}
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Mail className="h-4 w-4" />
                        </div>
                        <div className="text-sm">
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Email ID:</span>
                            <a
                                href={`mailto:${settings?.email || "smartideasbd24@gmail.com"}`}
                                className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium break-all transition-colors"
                            >
                                {settings?.email || "smartideasbd24@gmail.com"}
                            </a>
                        </div>
                    </div>

                    {/* Cell Number */}
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Phone className="h-4 w-4" />
                        </div>
                        <div className="text-sm">
                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Cell Number:</span>
                            <a
                                href={`tel:${settings?.phone || "+8801851046320"}`}
                                className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                            >
                                {settings?.phone || "+8801851046320"}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom: Social Media Links */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Connect with us:
                    </span>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Facebook */}
                        <a
                            href={settings?.facebook_url || "https://facebook.com"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 w-9 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-white hover:bg-[#1877F2] hover:border-[#1877F2] flex items-center justify-center transition-all duration-200 shadow-xs"
                            title="Facebook"
                        >
                            <Facebook className="h-4 w-4" />
                        </a>

                        {/* Twitter */}
                        <a
                            href={settings?.twitter_url || "https://twitter.com"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 w-9 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-white hover:bg-[#1DA1F2] hover:border-[#1DA1F2] flex items-center justify-center transition-all duration-200 shadow-xs"
                            title="Twitter"
                        >
                            <Twitter className="h-4 w-4" />
                        </a>

                        {/* LinkedIn */}
                        <a
                            href={settings?.linkedin_url || "https://linkedin.com"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 w-9 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-white hover:bg-[#0A66C2] hover:border-[#0A66C2] flex items-center justify-center transition-all duration-200 shadow-xs"
                            title="LinkedIn"
                        >
                            <Linkedin className="h-4 w-4" />
                        </a>

                        {/* Instagram (if set or fallback) */}
                        {settings?.instagram_url ? (
                            <a
                                href={settings.instagram_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-9 w-9 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-white hover:bg-[#E4405F] hover:border-[#E4405F] flex items-center justify-center transition-all duration-200 shadow-xs"
                                title="Instagram"
                            >
                                <Instagram className="h-4 w-4" />
                            </a>
                        ) : null}

                        {/* YouTube (if set or fallback) */}
                        {settings?.youtube_url ? (
                            <a
                                href={settings.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-9 w-9 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-white hover:bg-[#FF0000] hover:border-[#FF0000] flex items-center justify-center transition-all duration-200 shadow-xs"
                                title="YouTube"
                            >
                                <Youtube className="h-4 w-4" />
                            </a>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ContactForm() {
    const [form, setForm] = useState({ name: "", email: "", mobile: "", details: "" });
    const [captchaInput, setCaptchaInput] = useState("");
    const [captchaNumbers, setCaptchaNumbers] = useState({ a: 4, b: 7 });
    const [captchaError, setCaptchaError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const generateCaptcha = useCallback(() => {
        const a = Math.floor(Math.random() * 9) + 1;
        const b = Math.floor(Math.random() * 9) + 1;
        setCaptchaNumbers({ a, b });
        setCaptchaInput("");
        setCaptchaError(false);
    }, []);

    useEffect(() => {
        generateCaptcha();
    }, [generateCaptcha]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCaptchaError(false);
        setStatus("idle");

        if (!form.name || !form.email || !form.details) return;

        // Captcha Verification
        const expectedAnswer = captchaNumbers.a + captchaNumbers.b;
        if (parseInt(captchaInput.trim(), 10) !== expectedAnswer) {
            setCaptchaError(true);
            setStatus("error");
            setMessage("Captcha verification failed. Please calculate the correct sum.");
            generateCaptcha();
            return;
        }

        setSaving(true);
        try {
            const res = await api.post("front-cms/contact-form/submit", form);
            if (res.data?.status === "Success" || res.data?.success || res.status === 200) {
                setStatus("success");
                setMessage(res.data?.message || "Your message has been sent successfully.");
                setForm({ name: "", email: "", mobile: "", details: "" });
                generateCaptcha();
            } else {
                throw new Error(res.data?.message || "Failed to send message.");
            }
        } catch (error: unknown) {
            setStatus("error");
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            setMessage(
                err.response?.data?.message ||
                err.message ||
                "Failed to send message. Please ensure SMTP email settings are configured."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Full Name */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="h-10 border-slate-300 dark:border-slate-700 text-sm focus-visible:ring-indigo-500"
                        required
                    />
                </div>

                {/* 2. Email ID */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Email ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="example@domain.com"
                        className="h-10 border-slate-300 dark:border-slate-700 text-sm focus-visible:ring-indigo-500"
                        required
                    />
                </div>

                {/* 3. Cell Number */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Cell Number
                    </Label>
                    <Input
                        type="tel"
                        value={form.mobile}
                        onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="h-10 border-slate-300 dark:border-slate-700 text-sm focus-visible:ring-indigo-500"
                    />
                </div>

                {/* 4. Message Body */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Message Body <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        value={form.details}
                        onChange={(e) => setForm({ ...form, details: e.target.value })}
                        placeholder="Write your message here..."
                        className="min-h-[110px] border-slate-300 dark:border-slate-700 text-sm focus-visible:ring-indigo-500 resize-y"
                        required
                    />
                </div>

                {/* 5. Captcha Resolver */}
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Captcha Resolver <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                        <div className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 rounded-md font-bold text-indigo-700 dark:text-indigo-300 text-sm tracking-wider select-none">
                            {captchaNumbers.a} + {captchaNumbers.b} = ?
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={generateCaptcha}
                            className="h-9 w-9 shrink-0 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Refresh Captcha"
                        >
                            <RefreshCw className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </Button>
                        <Input
                            type="number"
                            value={captchaInput}
                            onChange={(e) => {
                                setCaptchaInput(e.target.value);
                                setCaptchaError(false);
                            }}
                            placeholder="Answer"
                            className={`h-9 w-28 text-sm border-slate-300 dark:border-slate-700 ${
                                captchaError ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-indigo-500"
                            }`}
                            required
                        />
                    </div>
                </div>

                {/* 6. Submit Button */}
                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full h-11 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white font-semibold shadow-md gap-2"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Sending Message...</span>
                        </>
                    ) : (
                        <>
                            <span>Submit Message</span>
                            <Send className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </form>

            {/* Notification Messages */}
            {status === "success" && (
                <div className="mt-4 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3.5 rounded-lg text-sm">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    <span>{message}</span>
                </div>
            )}
            {status === "error" && (
                <div className="mt-4 flex items-center gap-2 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-3.5 rounded-lg text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                    <span>{message}</span>
                </div>
            )}
        </div>
    );
}
