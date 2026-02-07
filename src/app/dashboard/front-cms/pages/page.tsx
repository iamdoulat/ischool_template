"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    Plus,
    ArrowUpDown,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PageItem {
    id: string;
    title: string;
    url: string;
    pageType: string;
    isSystem?: boolean;
}

const mockPages: PageItem[] = [
    { id: "1", title: "Home", url: "https://demo.smart-school.in/page/home", pageType: "Standard", isSystem: true },
    { id: "2", title: "Complain", url: "https://demo.smart-school.in/page/complain", pageType: "Standard", isSystem: true },
    { id: "3", title: "404 page", url: "https://demo.smart-school.in/page/404-page", pageType: "Standard", isSystem: true },
    { id: "4", title: "Contact us", url: "https://demo.smart-school.in/page/contact-us", pageType: "Standard", isSystem: true },
    { id: "5", title: "Complain", url: "https://demo.smart-school.in/page/complain-1", pageType: "Standard" },
    { id: "6", title: "About Us", url: "https://demo.smart-school.in/page/about-us", pageType: "Standard" },
    { id: "7", title: "Course", url: "https://demo.smart-school.in/page/course", pageType: "Standard" },
    { id: "8", title: "School Uniform", url: "https://demo.smart-school.in/page/school-uniform", pageType: "Standard" },
    { id: "9", title: "Gallery", url: "https://demo.smart-school.in/page/gallery", pageType: "Gallery" },
    { id: "10", title: "News", url: "https://demo.smart-school.in/page/news", pageType: "Standard" },
    { id: "11", title: "Events", url: "https://demo.smart-school.in/page/events", pageType: "Event" },
    { id: "12", title: "Teacher", url: "https://demo.smart-school.in/page/teacher", pageType: "Standard" },
    { id: "13", title: "Introduction", url: "https://demo.smart-school.in/page/introduction", pageType: "Standard" },
    { id: "14", title: "School History", url: "https://demo.smart-school.in/page/school-history", pageType: "Standard" },
    { id: "15", title: "Facilities", url: "https://demo.smart-school.in/page/facilities", pageType: "Standard" },
    { id: "16", title: "Principal Message", url: "https://demo.smart-school.in/page/principal-message", pageType: "Standard" },
    { id: "17", title: "School Management", url: "https://demo.smart-school.in/page/school-management", pageType: "Standard" },
    { id: "18", title: "Know Us", url: "https://demo.smart-school.in/page/know-us", pageType: "Standard" },
    { id: "19", title: "Approach", url: "https://demo.smart-school.in/page/approach", pageType: "Standard" },
    { id: "20", title: "Pre Primary", url: "https://demo.smart-school.in/page/pre-primary", pageType: "Standard" },
    { id: "21", title: "Primary", url: "https://demo.smart-school.in/page/primary", pageType: "Standard" },
    { id: "22", title: "Sports", url: "https://demo.smart-school.in/page/sports", pageType: "Standard" },
    { id: "23", title: "Student Council", url: "https://demo.smart-school.in/page/student-council", pageType: "Standard" },
    { id: "24", title: "Houses & Mentoring", url: "https://demo.smart-school.in/page/houses-mentoring", pageType: "Standard" },
    { id: "25", title: "Career Counselling", url: "https://demo.smart-school.in/page/career-counselling", pageType: "Standard" },
    { id: "26", title: "Annual Sports Day", url: "https://demo.smart-school.in/page/annual-sports-day", pageType: "Standard" },
    { id: "27", title: "new page test", url: "https://demo.smart-school.in/page/new-page-test", pageType: "Standard" },
    { id: "28", title: "Robotics", url: "https://demo.smart-school.in/page/robotics", pageType: "Standard" },
];

export default function PagesListPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredPages = mockPages.filter((page) =>
        page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.url.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getBadgeStyle = (type: string) => {
        switch (type.toLowerCase()) {
            case "gallery":
                return "bg-lime-500 text-white";
            case "event":
                return "bg-cyan-500 text-white";
            default:
                return "bg-gray-400 text-white";
        }
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <h2 className="text-sm font-semibold text-gray-800 tracking-tight">Page List</h2>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-7 text-[10px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5 font-bold tracking-tight">
                        <Plus className="h-3.5 w-3.5" />
                        Add
                    </Button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">50</span>
                            <Select defaultValue="50">
                                <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            {[Copy, FileSpreadsheet, FileText, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Title <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">URL <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Page Type <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPages.map((page) => (
                                <TableRow key={page.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{page.title}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500 font-normal">{page.url}</TableCell>
                                    <TableCell className="py-3 px-4">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight shadow-sm",
                                            getBadgeStyle(page.pageType)
                                        )}>
                                            {page.pageType}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            {!page.isSystem && (
                                                <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>
                        Showing 1 to {filteredPages.length} of {mockPages.length} entries
                    </div>
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600 text-[10px]">‹</span>
                        <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded shadow-sm">
                            1
                        </Button>
                        <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600 text-[10px]">›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
