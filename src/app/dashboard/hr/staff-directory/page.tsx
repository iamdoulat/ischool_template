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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    Search,
    Plus,
    LayoutGrid,
    List as ListIcon,
    Phone,
    MapPin,
    User,
    MoreVertical
} from "lucide-react";
import Image from "next/image";

interface Staff {
    id: string;
    staffId: string;
    name: string;
    role: string[];
    phone: string;
    location: string;
    image?: string;
}

const mockStaff: Staff[] = [
    {
        id: "1",
        staffId: "9000",
        name: "Joe Black",
        role: ["Super Admin", "Technical Head"],
        phone: "65435643635",
        location: "Ground Floor, Admin",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100"
    },
    {
        id: "2",
        staffId: "9002",
        name: "Shivam Verma",
        role: ["Teacher", "Faculty"],
        phone: "8588053584",
        location: "1st Floor, Academic",
        image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100&h=100"
    },
    {
        id: "3",
        staffId: "9009",
        name: "Brandon Heart",
        role: ["Librarian", "Librarian"],
        phone: "3135069814",
        location: "2nd Floor, Library",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100"
    },
    {
        id: "4",
        staffId: "9008",
        name: "William Abbot",
        role: ["Admin", "Principal"],
        phone: "6569566365",
        location: "Ground Floor, Admin",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100"
    },
    {
        id: "5",
        staffId: "90008",
        name: "Jason Sharlton",
        role: ["Teacher", "Faculty"],
        phone: "45645645654",
        location: "Ground Floor, Academic",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100&h=100"
    },
    {
        id: "6",
        staffId: "9001",
        name: "James Decker",
        role: ["Accountant", "Accountant"],
        phone: "76766464642",
        location: "Ground Floor, Finance",
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100&h=100"
    },
    {
        id: "7",
        staffId: "90011",
        name: "Maria Ford",
        role: ["Receptionist", "Receptionist"],
        phone: "6523475620",
        location: "Ground Floor, Reception",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100"
    },
    {
        id: "8",
        staffId: "1002",
        name: "Nishant Khare",
        role: ["Teacher"],
        phone: "9867576757",
        location: "Ground Floor, Academic",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100&h=100"
    }
];

export default function StaffDirectoryPage() {
    const [view, setView] = useState("card");

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800">Staff Directory</h1>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-9 px-4 text-xs shadow-sm shadow-indigo-100 transition-all rounded">
                    <Plus className="h-4 w-4" /> Add Staff
                </Button>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-6">
                <h2 className="text-sm font-medium text-gray-800">Select Criteria</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Role <span className="text-red-500">*</span>
                            </Label>
                            <Select>
                                <SelectTrigger className="h-10 border-gray-200 text-sm focus:ring-indigo-500 transition-all">
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
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-9 px-6 text-xs shadow-md shadow-indigo-100 transition-all">
                                <Search className="h-4 w-4" /> Search
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                Search By Keyword
                            </Label>
                            <Input
                                placeholder="Search By Staff ID, Name, Role etc..."
                                className="h-10 border-gray-200 text-sm focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-9 px-6 text-xs shadow-md shadow-indigo-100 transition-all font-medium">
                                <Search className="h-4 w-4" /> Search
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Staff View Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <Tabs defaultValue="card" className="w-full" onValueChange={setView}>
                    <div className="px-4 border-b border-gray-100 bg-white">
                        <TabsList className="bg-transparent h-12 gap-6 p-0">
                            <TabsTrigger
                                value="card"
                                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none h-12 text-xs font-medium text-gray-500 data-[state=active]:text-indigo-600 border-b-2 border-transparent px-2"
                            >
                                <LayoutGrid className="h-4 w-4 mr-2" /> Card View
                            </TabsTrigger>
                            <TabsTrigger
                                value="list"
                                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none h-12 text-xs font-medium text-gray-500 data-[state=active]:text-indigo-600 border-b-2 border-transparent px-2"
                            >
                                <ListIcon className="h-4 w-4 mr-2" /> List View
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="card" className="p-4 m-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {mockStaff.map((person) => (
                                <div key={person.id} className="bg-white border border-gray-100 rounded-lg p-3 hover:shadow-md transition-all group relative overflow-hidden flex gap-4">
                                    <div className="relative h-20 w-20 shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-50 shadow-sm">
                                        {person.image ? (
                                            <Image
                                                src={person.image}
                                                alt={person.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-300">
                                                <User className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col justify-between py-0.5 w-full">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                                {person.name}
                                            </h3>
                                            <div className="text-[11px] font-medium text-gray-500 mt-0.5">
                                                {person.staffId}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                                <Phone className="h-3 w-3" />
                                                <span>{person.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                                <MapPin className="h-3 w-3" />
                                                <span className="truncate">{person.location}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {person.role.map((r, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded uppercase tracking-tighter">
                                                    {r}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <button className="absolute top-2 right-1 p-1 text-gray-300 hover:text-gray-500 transition-colors">
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            {/* Extra empty state card to match image layout if needed */}
                            <div className="bg-white border border-gray-100 rounded-lg p-3 hover:shadow-md transition-all group relative overflow-hidden flex gap-4">
                                <div className="relative h-20 w-20 shrink-0 rounded-md overflow-hidden bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                                    <User className="h-10 w-10" />
                                </div>
                                <div className="flex flex-col justify-center w-full">
                                    <div className="h-4 w-24 bg-gray-50 rounded mb-2"></div>
                                    <div className="h-3 w-16 bg-gray-50 rounded mb-4"></div>
                                    <div className="flex gap-1">
                                        <div className="h-4 w-12 bg-gray-50 rounded"></div>
                                        <div className="h-4 w-12 bg-gray-50 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="list" className="p-0 m-0">
                        <div className="p-8 text-center text-gray-500 text-sm">
                            List View implementation available here.
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
