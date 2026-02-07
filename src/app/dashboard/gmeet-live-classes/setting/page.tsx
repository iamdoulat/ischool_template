"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SettingPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Setting</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">API Key</Label>
                        <Input
                            defaultValue="EdRTSDR08AjN012cEGFea542wthcdD2b31irtmZ1GFM'xwzz.grpider.sxzznxmt.com"
                            className="h-10 bg-white border-muted/50 text-xs"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">API Secret</Label>
                        <Input
                            defaultValue="Mid3RGFRec006wDyzcrF1RSK7f"
                            className="h-10 bg-white border-muted/50 text-xs"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-slate-700">Use Google Calendar API</Label>
                        <RadioGroup defaultValue="disabled" className="flex gap-6">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="disabled" id="calendar-disabled" />
                                <Label htmlFor="calendar-disabled" className="text-sm font-normal cursor-pointer">Disabled</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="enabled" id="calendar-enabled" />
                                <Label htmlFor="calendar-enabled" className="text-sm font-normal cursor-pointer">Enabled</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-slate-700">Forgot Live Class</Label>
                        <RadioGroup defaultValue="disabled" className="flex gap-6">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="disabled" id="forgot-disabled" />
                                <Label htmlFor="forgot-disabled" className="text-sm font-normal cursor-pointer">Disabled</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="enabled" id="forgot-enabled" />
                                <Label htmlFor="forgot-enabled" className="text-sm font-normal cursor-pointer">Enabled</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="pt-4">
                        <Button className="h-10 px-8 rounded-md bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5558DD] hover:to-[#7C3AED] text-white text-sm font-bold shadow-sm active:scale-95 transition-all">
                            Save
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
