"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, AlertCircle, Mail, Phone, MapPin, GraduationCap } from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import api from "@/lib/api";

export function ContactFormSection() {
    const { settings } = useSettings();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
                <ContactForm />
            </div>
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Contact Information</h3>
                <div className="space-y-3">
                    {settings?.app_logo ? (
                        <img
                            src={settings.app_logo}
                            alt={settings.school_name || "School Logo"}
                            className="h-12 w-auto object-contain"
                        />
                    ) : (
                        <div className="flex items-center gap-2 text-primary">
                            <GraduationCap className="h-8 w-8" />
                            <span className="font-extrabold text-lg uppercase tracking-tight text-gray-900">
                                {settings?.school_name || "iSchool"}
                            </span>
                        </div>
                    )}
                    {settings?.school_name && !settings?.app_logo && (
                        <p className="text-sm font-bold text-gray-800">{settings.school_name}</p>
                    )}
                    {settings?.address && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                            <span>{settings.address}</span>
                        </div>
                    )}
                    {settings?.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4 shrink-0 text-primary" />
                            <span>{settings.email}</span>
                        </div>
                    )}
                    {settings?.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4 shrink-0 text-primary" />
                            <span>{settings.phone}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function ContactForm() {
    const [form, setForm] = useState({ name: "", email: "", mobile: "", details: "" });
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.details) return;

        setSaving(true);
        setStatus("idle");
        try {
            const res = await api.post("front-cms/contact-form/submit", form);
            if (res.data?.status === "Success") {
                setStatus("success");
                setMessage(res.data?.message || "Your message has been sent successfully.");
                setForm({ name: "", email: "", mobile: "", details: "" });
            }
        } catch (error: any) {
            setStatus("error");
            setMessage(error.response?.data?.message || "Failed to send message. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">
                        Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your full name"
                        className="h-10 border-gray-300 text-sm"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">
                        Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="your@email.com"
                        className="h-10 border-gray-300 text-sm"
                        required
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Mobile Number</Label>
                    <Input
                        type="tel"
                        value={form.mobile}
                        onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                        placeholder="+1234567890"
                        className="h-10 border-gray-300 text-sm"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">
                        Details Info <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        value={form.details}
                        onChange={(e) => setForm({ ...form, details: e.target.value })}
                        placeholder="Your message..."
                        className="min-h-[120px] border-gray-300 text-sm"
                        required
                    />
                </div>
                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full h-11 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white font-semibold"
                >
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit"}
                </Button>
            </form>

            {status === "success" && (
                <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md text-sm">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    {message}
                </div>
            )}
            {status === "error" && (
                <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {message}
                </div>
            )}
        </div>
    );
}
