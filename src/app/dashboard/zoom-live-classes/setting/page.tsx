"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

export default function ZoomSettingPage() {
    const [teacherCredentials, setTeacherCredentials] = useState(true);
    const [parentLiveClass, setParentLiveClass] = useState(true);
    const [staffClientType, setStaffClientType] = useState("web");
    const [studentClientType, setStudentClientType] = useState("web");

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-semibold text-gray-800">Setting</h1>

            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-8">
                {/* Alert Banner */}
                <div className="bg-sky-50 border border-sky-100 text-sky-600 px-4 py-3 rounded-md text-sm">
                    Access Token not generated, Please authenticate your Account.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                    {/* Left Column - Form Fields */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Label className="w-1/3 text-right text-xs font-semibold text-gray-600">
                                Zoom API Key <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                defaultValue="s4aABluGRXK5kj5JM1UQtg"
                                className="flex-1 h-9 text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <Label className="w-1/3 text-right text-xs font-semibold text-gray-600">
                                Zoom API Secret <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                defaultValue="w0ELxqU7WGzH4q3knJ2Yh5DfAqRvBypB"
                                className="flex-1 h-9 text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <Label className="w-1/3 text-right text-xs font-semibold text-gray-600">
                                Teacher Api Credential <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex-1">
                                <Switch
                                    checked={teacherCredentials}
                                    onCheckedChange={setTeacherCredentials}
                                    className="bg-gray-200 data-[state=checked]:bg-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Label className="w-1/3 text-right text-xs font-semibold text-gray-600">
                                Use Zoom Client for Staff <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex-1">
                                <RadioGroup
                                    value={staffClientType}
                                    onValueChange={setStaffClientType}
                                    className="flex items-center gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="web" id="staff-web" className="text-indigo-600 border-indigo-600" />
                                        <Label htmlFor="staff-web" className="font-normal text-gray-700">Web</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="app" id="staff-app" className="text-indigo-600 border-indigo-600" />
                                        <Label htmlFor="staff-app" className="font-normal text-gray-700">Zoom App</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Label className="w-1/3 text-right text-xs font-semibold text-gray-600">
                                Use Zoom Client for Student <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex-1">
                                <RadioGroup
                                    value={studentClientType}
                                    onValueChange={setStudentClientType}
                                    className="flex items-center gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="web" id="student-web" className="text-indigo-600 border-indigo-600" />
                                        <Label htmlFor="student-web" className="font-normal text-gray-700">Web</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="app" id="student-app" className="text-indigo-600 border-indigo-600" />
                                        <Label htmlFor="student-app" className="font-normal text-gray-700">Zoom App</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Label className="w-1/3 text-right text-xs font-semibold text-gray-600">
                                Parent Live Class <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex-1">
                                <Switch
                                    checked={parentLiveClass}
                                    onCheckedChange={setParentLiveClass}
                                    className="bg-gray-200 data-[state=checked]:bg-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Info */}
                    <div className="space-y-6">
                        <div className="text-4xl font-bold text-[#2d8cff] tracking-tight">zoom</div>

                        <div className="space-y-4 text-xs text-gray-600">
                            <p>
                                To generate Zoom Api credential <a href="#" className="text-blue-500 hover:underline">Click Here</a>
                            </p>

                            <div className="space-y-1">
                                <p>Zoom redirect URL:</p>
                                <p className="text-gray-500 break-all select-all">
                                    https://demo.smart-school.in/admin/conference/generatetoken
                                </p>
                            </div>

                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white">
                                Get Access Token
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-center pt-8 md:pt-16 border-t mt-8">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8">
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
