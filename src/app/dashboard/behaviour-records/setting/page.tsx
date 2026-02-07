"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Save } from "lucide-react";

export default function SettingPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Setting Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-700">Setting</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-8 py-8 border-b border-muted/10">
                        <label className="text-sm font-bold text-slate-700 min-w-[200px]">
                            Comment Option
                        </label>
                        <div className="flex flex-wrap items-center gap-8">
                            <CheckboxItem id="student" label="Student Comment" defaultChecked />
                            <CheckboxItem id="parent" label="Parent Comment" defaultChecked />
                        </div>
                    </div>
                    <div className="flex justify-center mt-6 pt-4">
                        <Button className="h-9 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
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
        <div className="flex items-center space-x-2 group cursor-pointer hover:bg-muted/20 p-2 rounded-lg transition-colors">
            <Checkbox id={id} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-muted-foreground/30 data-[state=checked]:bg-[#6366F1] data-[state=checked]:border-[#6366F1] transition-all" />
            <label
                htmlFor={id}
                className="text-sm font-bold text-slate-600 group-hover:text-[#6366F1] cursor-pointer transition-colors"
            >
                {label}
            </label>
        </div>
    );
}
