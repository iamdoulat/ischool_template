"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { LayoutGrid, List, Search, User } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface StaffMember {
    id: string;
    name: string;
    staffId: string;
    role: string;
    department: string;
    imageUrl?: string;
}

const disabledStaff: StaffMember[] = [
    {
        id: "1",
        name: "Albert Thomas",
        staffId: "9000181",
        role: "Teacher",
        department: "Faculty",
        imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Albert",
    },
    {
        id: "2",
        name: "Jonathan Wood",
        staffId: "9002",
        role: "Teacher",
        department: "Faculty",
    },
];

export default function DisabledStaffPage() {
    const [viewMode, setViewMode] = useState<"card" | "list">("card");

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800">Disabled Staff</h1>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Role Filter */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                Role <span className="text-red-500">*</span>
                            </Label>
                            <Select>
                                <SelectTrigger className="h-9 border-gray-200 text-sm focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="accountant">Accountant</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-8 px-4 text-xs shadow-sm transition-all rounded">
                                <Search className="h-3.5 w-3.5" /> Search
                            </Button>
                        </div>
                    </div>

                    {/* Keyword Search */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                                Search By Keyword
                            </Label>
                            <Input
                                placeholder="Search By Staff ID, Name, Role etc..."
                                className="h-9 border-gray-200 text-sm focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-8 px-4 text-xs shadow-sm transition-all rounded">
                                <Search className="h-3.5 w-3.5" /> Search
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Toggle Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setViewMode("card")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all border-b-2",
                        viewMode === "card"
                            ? "border-indigo-500 text-indigo-600 bg-indigo-50/30"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Card View
                </button>
                <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all border-b-2",
                        viewMode === "list"
                            ? "border-indigo-500 text-indigo-600 bg-indigo-50/30"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                >
                    <List className="h-3.5 w-3.5" />
                    List View
                </button>
            </div>

            {/* Staff Records */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {disabledStaff.map((staff) => (
                    <div
                        key={staff.id}
                        className="bg-white rounded border border-gray-100 p-3 flex gap-3 hover:shadow-md transition-shadow group"
                    >
                        <div className="relative h-20 w-20 flex-shrink-0 bg-gray-50 rounded overflow-hidden border border-gray-100">
                            {staff.imageUrl ? (
                                <Image
                                    src={staff.imageUrl}
                                    alt={staff.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                                    <User className="h-8 w-8 mb-1" />
                                    <span className="text-[8px] font-bold text-center leading-tight px-1">NO IMAGE AVAILABLE</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col justify-center min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 truncate">{staff.name}</h3>
                            <p className="text-[11px] text-gray-500">{staff.staffId}</p>
                            <p className="text-[11px] text-gray-500 mb-2">{staff.department}</p>

                            <div className="flex flex-wrap gap-1">
                                <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded border border-gray-200">
                                    {staff.role}
                                </span>
                                <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded border border-gray-200">
                                    {staff.department}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty placeholder cards to match design grid if needed */}
                {[...Array(2)].map((_, i) => (
                    <div key={`empty-${i}`} className="hidden lg:block h-[106px]" />
                ))}
            </div>
        </div>
    );
}
