"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function ThermalPrintPage() {
    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <h1 className="text-sm font-medium text-gray-800 tracking-tight mb-2">Thermal Print</h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col">

                {/* Form Container */}
                <div className="w-full p-8 space-y-6 animate-in fade-in duration-300">

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2">Thermal Print <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-10">
                            <Switch className="data-[state=checked]:bg-indigo-500 scale-90" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2">School Name <span className="text-red-500">*</span></Label>
                        <div className="md:col-span-10">
                            <Input defaultValue="Smart School" className="h-9 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2 mt-2">Address</Label>
                        <div className="md:col-span-10">
                            <Textarea
                                defaultValue="25 Kings Street, CA <br> 89562423934 <br> info@smartschool.com.bd"
                                className="min-h-[100px] text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <Label className="text-[11px] font-bold text-gray-600 md:col-span-2 mt-2">Footer Text</Label>
                        <div className="md:col-span-10">
                            <Textarea
                                defaultValue="This receipt is computer generated hence no signature is required."
                                className="min-h-[80px] text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded resize-y"
                            />
                        </div>
                    </div>

                </div>

                {/* Footer Save Action */}
                <div className="w-full border-t border-gray-50 p-4 bg-white flex justify-end mt-auto">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md border-b-2 border-indigo-700">
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
