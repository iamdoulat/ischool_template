"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function EmailSettingPage() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Email Setting</h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col items-center">

                {/* Form Container */}
                <div className="w-full max-w-4xl p-8 space-y-5 animate-in fade-in duration-300">

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">Email Engine <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-3">
                            <Select defaultValue="smtp">
                                <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded text-gray-600">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="smtp">SMTP</SelectItem>
                                    <SelectItem value="sendmail">SendMail</SelectItem>
                                    <SelectItem value="phpmail">PHPMail</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">Email <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-3">
                            <Input defaultValue="no-replytest@webfeb.com" className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">SMTP Username <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-3">
                            <Input defaultValue="9a3279001@smtp-brevo.com" className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">SMTP Password <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-3 relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                defaultValue="supersecretpassword123"
                                className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded pr-8"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500"
                            >
                                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">SMTP Server <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-3">
                            <Input defaultValue="smtp-relay.brevo.com" className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">SMTP Port <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-3">
                            <Input defaultValue="587" className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full md:w-32" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">SMTP Security <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-3">
                            <Select defaultValue="tls">
                                <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded text-gray-600">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tls">TLS</SelectItem>
                                    <SelectItem value="ssl">SSL</SelectItem>
                                    <SelectItem value="none">None</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label className="text-[11px] font-bold text-gray-400 text-right uppercase md:col-span-1">SMTP Auth <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-3">
                            <Select defaultValue="on">
                                <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded text-gray-600">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="on">ON</SelectItem>
                                    <SelectItem value="off">OFF</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                </div>

                {/* Footer Save Action */}
                <div className="w-full border-t border-gray-50 p-6 bg-white flex justify-center mt-auto">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md border-b-2 border-indigo-700">
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
