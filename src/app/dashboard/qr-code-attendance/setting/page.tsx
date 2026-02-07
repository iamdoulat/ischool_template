"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function QrCodeSettingPage() {
    return (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
                <h2 className="text-lg font-medium text-gray-800">Setting</h2>
            </div>

            <div className="p-8 space-y-8 flex flex-col items-center">

                {/* Auto Attendance */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full max-w-4xl items-center">
                    <div className="md:col-span-4 md:text-right">
                        <Label htmlFor="auto-attendance" className="text-sm font-medium text-gray-700">
                            Auto Attendance <span className="text-red-500">*</span>
                        </Label>
                    </div>
                    <div className="md:col-span-8">
                        <Switch id="auto-attendance" className="data-[state=checked]:bg-indigo-500" />
                    </div>
                </div>

                {/* Scanner Device Type */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full max-w-4xl items-start">
                    <div className="md:col-span-4 md:text-right pt-2">
                        <Label className="text-sm font-medium text-gray-700">
                            Scanner Device Type <span className="text-red-500">*</span>
                        </Label>
                    </div>
                    <div className="md:col-span-8 flex flex-col sm:flex-row gap-6 pt-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="sensor-device" className="data-[state=checked]:bg-indigo-500 border-indigo-200" defaultChecked />
                            <Label htmlFor="sensor-device" className="text-sm text-gray-600 font-normal cursor-pointer">
                                Sensor-based device like a scanning gun
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="camera-device" className="data-[state=checked]:bg-indigo-500 border-indigo-200" defaultChecked />
                            <Label htmlFor="camera-device" className="text-sm text-gray-600 font-normal cursor-pointer">
                                Camera-based device, like a mobile phone or webcam
                            </Label>
                        </div>
                    </div>
                </div>

                {/* Select Camera */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full max-w-4xl items-center">
                    <div className="md:col-span-4 md:text-right">
                        <Label className="text-sm font-medium text-gray-700">
                            Select Camera <span className="text-red-500">*</span>
                        </Label>
                    </div>
                    <div className="md:col-span-8">
                        <RadioGroup defaultValue="primary" className="flex flex-row gap-6">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="primary" id="primary" className="text-indigo-500 border-indigo-200" />
                                <Label htmlFor="primary" className="text-sm text-gray-600 font-normal cursor-pointer">Primary (Back)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="secondary" id="secondary" className="text-indigo-500 border-indigo-200" />
                                <Label htmlFor="secondary" className="text-sm text-gray-600 font-normal cursor-pointer">Secondary (Front)</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <div className="pt-4">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8">
                        Save
                    </Button>
                </div>

            </div>
        </div>
    );
}
