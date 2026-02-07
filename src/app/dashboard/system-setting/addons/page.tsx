"use client";

import { Button } from "@/components/ui/button";
import { CloudUpload, Trash2, Library, Printer, Banknote, QrCode, FileText, ShieldCheck, Network, UserCheck, PlaySquare, Video, MonitorPlay } from "lucide-react";
import { cn } from "@/lib/utils";

// Addon Data Interface
interface Addon {
    id: number;
    title: string;
    version: string;
    description: string;
    icon: React.ReactNode;
    iconBgColor?: string; // Optional custom bg color if needed
}

const addons: Addon[] = [
    {
        id: 1,
        title: "Smart School Whatsapp Messaging",
        version: "1.0",
        description: "Smart School WhatsApp Messaging addon adds WhatsApp messaging module in Smart School. Using this module you can send notification or direct messages to...",
        icon: <div className="bg-green-500 rounded-full p-1"><Video className="text-white h-4 w-4" /></div> // Using generic video/message icon as placeholder for WA
    },
    {
        id: 2,
        title: "Smart School Thermal Print",
        version: "2.0",
        description: "Thermal Print addon adds Thermal Printer compatible small size fees receipt print capability in Smart School. Using this module you can utilize modern cost effective fees receipt...",
        icon: <Printer className="text-gray-700 h-6 w-6" />
    },
    {
        id: 3,
        title: "Smart School Quick Fees Create",
        version: "2.0",
        description: "Quick Fees Create addon adds one click fees create feature in Smart School Fees Collection module. Using this you can create and assign fees on students in just few seconds and...",
        icon: <Banknote className="text-gray-700 h-6 w-6" />
    },
    {
        id: 4,
        title: "Smart School QR Code Attendance",
        version: "3.0",
        description: "QR Code Attendance addon adds automated Student/Staff attendance using QR/Barcode module in Smart School. Using this module Student/Staff can submit their...",
        icon: <QrCode className="text-gray-700 h-6 w-6" />
    },
    {
        id: 5,
        title: "Smart School CBSE Examination",
        version: "4.0",
        description: "CBSE Examination addon adds CBSE Examination module in Smart School. Using this module teacher/staff can create and print marksheets with advance features.",
        icon: <FileText className="text-gray-700 h-6 w-6" />
    },
    {
        id: 6,
        title: "Smart School Two Factor Authentication",
        version: "4.0",
        description: "Two Factor Authentication addon adds Two Factor Authentication module in Smart School. Using this module you can enhance login security of your Smart School users.",
        icon: <ShieldCheck className="text-gray-700 h-6 w-6" />
    },
    {
        id: 7,
        title: "Smart School Multi Branch",
        version: "4.0",
        description: "Multi Branch addon adds Multi Branch module in Smart School. Using this module Superadmin user can add other any number of schools/branches.",
        icon: <Network className="text-gray-700 h-6 w-6" />
    },
    {
        id: 8,
        title: "Smart School Behaviour Records",
        version: "4.0",
        description: "Behaviour Records addon adds Behaviour Records module in Smart School. Using this module teacher/staff can create different incidents with positive/negative marks and then...",
        icon: <UserCheck className="text-gray-700 h-6 w-6" />
    },
    {
        id: 9,
        title: "Smart School Online Course",
        version: "5.0",
        description: "Online Course addon adds Online Course module in Smart School. Using this module teacher/staff can create free or paid online course with their study material based on video...",
        icon: <PlaySquare className="text-gray-700 h-6 w-6" />
    },
    {
        id: 10,
        title: "Smart School Gmeet Live Class",
        version: "7.0",
        description: "Gmeet Live Class addon adds Gmeet Live Class module in Smart School. Using this module teacher/staff can create live online classes using http://meet.google.com service....",
        icon: <Video className="text-gray-700 h-6 w-6" />
    },
    {
        id: 11,
        title: "Smart School Zoom Live Classes",
        version: "8.0",
        description: "Zoom Live Class addon adds Zoom Live Class module in Smart School. Using this module teacher/staff can create live online classes using Zoom.us service. Further students...",
        icon: <MonitorPlay className="text-gray-700 h-6 w-6" />
    },
];

export default function AddonsPage() {
    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans space-y-6">

            {/* Header */}
            <div className="bg-white rounded-t-lg shadow-sm border border-gray-100 p-4">
                <h1 className="text-[13px] font-medium text-gray-700">Addons</h1>
            </div>

            {/* Upload Box */}
            <div className="bg-white rounded-b-lg shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-4 items-stretch">
                <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg h-12 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-2 text-gray-500 group-hover:text-indigo-500">
                        <CloudUpload className="h-4 w-4" />
                        <span className="text-[11px] font-medium">Drag and drop a file here or click</span>
                    </div>
                </div>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-12 text-[11px] font-bold uppercase transition-all rounded shadow-md gap-2 w-full md:w-auto">
                    <CloudUpload className="h-4 w-4" />
                    Upload
                </Button>
            </div>

            {/* Addons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                {addons.map((addon) => (
                    <div key={addon.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-shadow">
                        {/* Icon Area */}
                        <div className="flex flex-col items-center gap-2 flex-shrink-0 w-20">
                            <div className="h-16 w-16 bg-orange-100 border border-orange-200 rounded-md flex items-center justify-center relative overflow-hidden group">
                                {/* Orange Book Background Simulation */}
                                <div className="absolute inset-0 bg-orange-400 transform -skew-x-12 translate-x-[-50%] w-full h-full opacity-20"></div>
                                <Library className="h-10 w-10 text-orange-500 absolute opacity-30" />
                                {/* Overlay Icon */}
                                <div className="relative z-10 bg-white/80 p-1.5 rounded-full shadow-sm backdrop-blur-sm">
                                    {addon.icon}
                                </div>
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">Version {addon.version}</span>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="text-[12px] font-bold text-indigo-600 mb-1 leading-tight">{addon.title}</h3>
                                <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-3">
                                    {addon.description}
                                </p>
                            </div>

                            <div className="flex justify-end mt-2">
                                <Button
                                    variant="destructive"
                                    className="h-6 px-3 text-[9px] font-bold uppercase rounded bg-red-500 hover:bg-red-600 shadow-sm"
                                >
                                    Uninstall
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
