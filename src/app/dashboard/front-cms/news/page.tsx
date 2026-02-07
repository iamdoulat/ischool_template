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

interface NewsItem {
    id: string;
    title: string;
    url: string;
}

const mockNews: NewsItem[] = [
    { id: "1", title: "The Junior Red Cross", url: "https://demo.smart-school.in/read/the-junior-red-cross" },
    { id: "2", title: "Parents and Guardians Teacher's Meeting", url: "https://demo.smart-school.in/read/parents-and-guardians-teachers-meeting" },
    { id: "3", title: "Winter Term-end Exams Start", url: "https://demo.smart-school.in/read/winter-term-end-exams-start" },
    { id: "4", title: "The Opening Ceremony of Computer Science Month", url: "https://demo.smart-school.in/read/the-opening-ceremony-of-computer-science-month" },
    { id: "5", title: "Children's Day Program by teachers", url: "https://demo.smart-school.in/read/childrens-day-program-by-teachers-1" },
    { id: "6", title: "Webinar for the Students of Class IX to XII on Career information.", url: "https://demo.smart-school.in/read/webinar-for-the-students-of-class-ix-to-xii-on-career-information" },
    { id: "7", title: "Diwali Celebration Notice", url: "https://demo.smart-school.in/read/diwali-celebration-notice" },
    { id: "8", title: "Teachers' Day Celebration", url: "https://demo.smart-school.in/read/teachers-day-celebration-2" },
    { id: "9", title: "Sports Quiz competition", url: "https://demo.smart-school.in/read/sports-quiz-competition" },
    { id: "10", title: "Inter-House patriotic song competition", url: "https://demo.smart-school.in/read/inter-house-patriotic-song-competition" },
    { id: "11", title: "National Level Workshop for Science Teachers Teaching in Class X to XII (Online)", url: "https://demo.smart-school.in/read/national-level-workshop-for-science-teachers-teaching-in-class-x-to-xii-online" },
    { id: "12", title: "Admissions for the current academic year 2025-26 are now open.", url: "https://demo.smart-school.in/read/admissions-for-the-current-academic-year-2025-26-are-now-open" },
    { id: "13", title: "World Environment Day program", url: "https://demo.smart-school.in/read/world-environment-day-program" },
    { id: "14", title: "School Vacation Notice", url: "https://demo.smart-school.in/read/school-vacation-notice" },
    { id: "15", title: "Books Mela", url: "https://demo.smart-school.in/read/books-mela-1" },
    { id: "16", title: "New Academic Session Admission Start (2025-26)!!!!!", url: "https://demo.smart-school.in/read/new-academic-session-admission-start-2025-26" },
    { id: "17", title: "Date sheet Final Exam Nursery to Sr.Kg", url: "https://demo.smart-school.in/read/date-sheet-final-exam-nursery-to-srkg-1" },
    { id: "18", title: "Board Exams Preparation", url: "https://demo.smart-school.in/read/board-exams-preparation" },
];

export default function NewsListPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredNews = mockNews.filter((news) =>
        news.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        news.url.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                    <h2 className="text-sm font-semibold text-gray-800 tracking-tight">News List</h2>
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
                    <Table className="min-w-[800px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Title <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">URL <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredNews.map((news) => (
                                <TableRow key={news.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                    <TableCell className="py-3 px-4">
                                        <span className="text-[#6366f1] font-medium hover:underline cursor-pointer">{news.title}</span>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{news.url}</TableCell>
                                    <TableCell className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
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
                        Showing 1 to {filteredNews.length} of {mockNews.length} entries
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
