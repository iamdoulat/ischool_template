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
    Plus,
    Search,
    PlayCircle,
    Video,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import Image from "next/image";

interface Tutorial {
    id: string;
    title: string;
    thumbnail?: string;
}

const mockTutorials: Tutorial[] = [
    { id: "1", title: "Motivational Speech", thumbnail: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=225&fit=crop" },
    { id: "2", title: "ENVIRONMENTAL SCIENCE", thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=225&fit=crop" },
    { id: "3", title: "Communication Skills" }, // Missing thumbnail test
    { id: "4", title: "Parts of a Plants", thumbnail: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400&h=225&fit=crop" },
    { id: "5", title: "The world of birds", thumbnail: "https://images.unsplash.com/photo-1444464666168-49d633b867ad?w=400&h=225&fit=crop" },
    { id: "6", title: "Natural Disasters", thumbnail: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&h=225&fit=crop" },
    { id: "7", title: "Light, Sound, and Force", thumbnail: "https://images.unsplash.com/photo-1493246507139-91e8bef99c02?w=400&h=225&fit=crop" },
    { id: "8", title: "Long and Short Mathematics", thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd486490e?w=400&h=225&fit=crop" },
    { id: "9", title: "ENGLISH Chapter-1", thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=225&fit=crop" },
    { id: "10", title: "GK Quiz" }, // Missing thumbnail test
    { id: "11", title: "THE WAY THE WORLD LOOKS", thumbnail: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=400&h=225&fit=crop" },
    { id: "12", title: "Matter and its States" }, // Missing thumbnail test
    { id: "13", title: "Time and Calendar", thumbnail: "https://images.unsplash.com/photo-1508962914676-13cb83ecd59d?w=400&h=225&fit=crop" },
    { id: "14", title: "Place Values and Number Names", thumbnail: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=225&fit=crop" },
    { id: "15", title: "Life Of A Tree", thumbnail: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&h=225&fit=crop" },
    { id: "16", title: "Planets of Our Solar System", thumbnail: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=225&fit=crop" },
    { id: "17", title: "Parts of the Body", thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" },
    { id: "18", title: "Telling Time For Children", thumbnail: "https://images.unsplash.com/photo-1584281723501-831499539352?w=400&h=225&fit=crop" },
    { id: "19", title: "The Age Of Renaissance", thumbnail: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&h=225&fit=crop" },
    { id: "20", title: "Force and Pressure", thumbnail: "https://images.unsplash.com/photo-1533158307587-828f0a76ef46?w=400&h=225&fit=crop" },
    { id: "21", title: "Simple Equations", thumbnail: "https://images.unsplash.com/photo-1509475826633-fed5bb1930e7?w=400&h=225&fit=crop" },
    { id: "22", title: "Latitude and Longitude", thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop" },
    { id: "23", title: "Shapes And Angles", thumbnail: "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=400&h=225&fit=crop" },
    { id: "24", title: "JAVA BEGINNERS TUTORIAL", thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=225&fit=crop" },
];

export default function VideoTutorialPage() {
    const [activePage, setActivePage] = useState(1);

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-sm font-medium text-gray-800">Video Tutorial List</h1>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-7 px-3 text-[10px] font-bold uppercase transition-all rounded shadow-sm">
                    <Plus className="h-3 w-3" /> Add
                </Button>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase">Class</Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-xs focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Class 1</SelectItem>
                                <SelectItem value="2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase">Section</Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-xs focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase">Search By Title</Label>
                        <Input
                            placeholder="Search By Title"
                            className="h-8 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-8 px-6 text-[10px] font-bold uppercase transition-all rounded shadow-sm">
                            <Search className="h-3.5 w-3.5" /> Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {mockTutorials.map((video) => (
                        <div key={video.id} className="group cursor-pointer">
                            <div className="relative aspect-video rounded overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                                {video.thumbnail ? (
                                    <>
                                        <Image
                                            src={video.thumbnail}
                                            alt={video.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <PlayCircle className="h-10 w-10 text-white fill-white/20" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Video className="h-8 w-8 text-gray-200" />
                                        <span className="text-[8px] text-gray-300 font-bold uppercase tracking-wider">No Thumbnail</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 text-center p-1.5 border-t border-gray-50">
                                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors" title={video.title}>
                                    {video.title}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-end gap-1 mt-8 border-t border-gray-50 pt-4">
                    <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] text-gray-400 border-gray-200 hover:bg-gray-50 hover:text-gray-600">
                        <ChevronLeft className="h-3 w-3 mr-1" /> Previous
                    </Button>
                    <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 text-white border-0 text-[10px] rounded">
                        1
                    </Button>
                    <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-gray-400 border-gray-200 hover:bg-gray-50 text-[10px] rounded">
                        2
                    </Button>
                    <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] text-gray-400 border-gray-200 hover:bg-gray-50 hover:text-gray-600">
                        Next <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
