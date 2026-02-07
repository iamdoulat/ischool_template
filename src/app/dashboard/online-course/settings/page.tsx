"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Settings,
    Cloud,
    UserCircle,
    Check,
    ChevronDown,
    Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export default function SettingPage() {
    const [guestLogin, setGuestLogin] = useState(true);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Setting Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Settings className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg font-bold tracking-tight">Setting</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-8 py-4">
                        <label className="text-sm font-bold text-slate-700 min-w-[200px]">
                            Online Course Curriculum
                        </label>
                        <div className="flex flex-wrap items-center gap-6">
                            <CheckboxItem id="quiz" label="Quiz" defaultChecked />
                            <CheckboxItem id="exam" label="Exam" defaultChecked />
                            <CheckboxItem id="assignment" label="Assignment" defaultChecked />
                        </div>
                    </div>
                    <div className="flex justify-center mt-6 pt-6 border-t border-muted/20">
                        <Button className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                            <Save className="h-4 w-4" />
                            Save
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* AWS S3 Bucket Setting Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Cloud className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg font-bold tracking-tight">AWS S3 Bucket Setting</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="max-w-4xl mx-auto space-y-6 py-4">
                        <InputField label="Access Key ID" required />
                        <InputField label="Secret Access Key" required />
                        <InputField label="Bucket Name" required />
                        <InputField label="Region" required />
                    </div>
                    <div className="flex justify-center mt-6 pt-6 border-t border-muted/20">
                        <Button className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                            <Save className="h-4 w-4" />
                            Save
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Guest User Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <UserCircle className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg font-bold tracking-tight">Guest User</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="max-w-4xl mx-auto space-y-6 py-4">
                        {/* Guest Login Toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 group">
                            <label className="text-sm font-bold text-slate-700 min-w-[200px]">
                                Guest Login <span className="text-destructive">*</span>
                            </label>
                            <button
                                onClick={() => setGuestLogin(!guestLogin)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                                    guestLogin ? "bg-[#6366F1]" : "bg-muted"
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                                        guestLogin ? "translate-x-6" : "translate-x-1"
                                    )}
                                />
                            </button>
                        </div>

                        <InputField label="Guest User Prefix" required defaultValue="Guest" />
                        <InputField label="Guest User Id Start From" required defaultValue="100" />
                    </div>
                    <div className="flex justify-center mt-6 pt-6 border-t border-muted/20">
                        <Button className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                            <Save className="h-4 w-4" />
                            Save
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function CheckboxItem({ id, label, defaultChecked }: { id: string, label: string, defaultChecked?: boolean }) {
    return (
        <div className="flex items-center space-x-2 group cursor-pointer">
            <Checkbox id={id} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-muted-foreground/30 data-[state=checked]:bg-[#6366F1] data-[state=checked]:border-[#6366F1] transition-all" />
            <label
                htmlFor={id}
                className="text-sm font-bold text-slate-600 group-hover:text-slate-900 cursor-pointer transition-colors"
            >
                {label}
            </label>
        </div>
    );
}

function InputField({ label, required, defaultValue }: { label: string, required?: boolean, defaultValue?: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 group">
            <label className="text-sm font-bold text-slate-700 min-w-[200px] group-focus-within:text-primary transition-colors">
                {label} {required && <span className="text-destructive font-bold">*</span>}
            </label>
            <div className="relative flex-1">
                <Input
                    defaultValue={defaultValue}
                    className="h-11 rounded-xl border-muted/50 bg-muted/30 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all pr-12"
                />
            </div>
        </div>
    );
}
