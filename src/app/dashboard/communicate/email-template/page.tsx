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
    Eye,
    Pencil,
    X,
    Plus,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface EmailTemplate {
    id: string;
    title: string;
    message: string;
}

const mockTemplates: EmailTemplate[] = [
    {
        id: "1",
        title: "Sports Day Events",
        message: "Games that are played on school sports days can be wide and varied. They can include straightforward sprints and longer races for all age groups as well as egg and spoon races.",
    },
    {
        id: "2",
        title: "National Republic Day",
        message: "India celebrated its 73rd National Republic Day on the 26th of January, 2022. The constitution of India was adopted on the 26th of November, 1949 with Dr. B. R. Ambedkar as the Chairman of the Drafting Committee.",
    },
    {
        id: "3",
        title: "Annual Day Celebration",
        message: "A day in School - In this theme the program can showcase what all goes in school. The ringing of bell, the class, the love of teachers, happy-go-lucky punishments, all pranks, PTM, sports etc.",
    },
    {
        id: "4",
        title: "Summer Vacation",
        message: "Summer vacation is the best time of the year as it gives me a chance to relax and explore new things. It gives me an opportunity to take a break from my daily study routine and adopt new hobbies like gardening, dancing and painting, while also having fun with friends.",
    },
    {
        id: "5",
        title: "International Day of Yoga",
        message: "When proposing 21 June as the date, Modi said that the date was the longest day of the year in the northern hemisphere (shortest in the southern hemisphere), having special significance in many parts of the world.",
    },
    {
        id: "6",
        title: "Independence Day Celebration!!!! Notification",
        message: "All the students of our school are hereby informed that our school is going to celebrate the Independence Day like previous years in the school premises. Students are requested to note that on the 15th August they will be assembled on the school ground at 7:30 am. positively.",
    },
    {
        id: "7",
        title: "Teacher Day Celebration",
        message: "India celebrates Teachers' Day to commemorate Dr Sarvepalli Radhakrishnan's birth anniversary. Schools and colleges mark the occasion by holding cultural events. Additionally, students gift handwritten cards, chocolates, flowers, and handmade gifts to express their gratitude to their favourite teachers.",
    },
    {
        id: "8",
        title: "Dussehra Celebration",
        message: "Dussehra, also known as Dasara or Vijayadashami, is a Hindu festival that celebrates the victory of good over evil.",
    },
    {
        id: "9",
        title: "Children's day",
        message: "Children's day on the 14th November, 2024, with great festive fervour, to commemorate the 131st birth anniversary of Pandit Jawaharlal Nehru. The programme began with a special assembly conducted by the teachers, followed by informative and inspirational speeches by the Director, the CEO and the Principal about the great leader, thinker, visionary and a true statesman - Pandit Jawaharlal Nehru.",
    },
    {
        id: "10",
        title: "Online Classes",
        message: "Be very punctual in log in time, screen off time, activity time table etc. Be ready with necessary text books, note books, pen, pencil and other accessories before class begins. Make sure the device is sufficiently charged before the beginning of the class.",
    },
];

export default function EmailTemplatePage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTemplates = mockTemplates.filter(
        (template) =>
            template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-sm font-medium text-gray-800">Email Template List</h1>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-7 px-3 text-[10px] font-bold uppercase transition-all rounded shadow-sm">
                    <Plus className="h-3 w-3" /> Add
                </Button>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4">
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

                {/* Template Table */}
                <div className="rounded border border-gray-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 w-[200px]">Title</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Message</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right w-[100px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTemplates.map((template) => (
                                <TableRow key={template.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                    <TableCell className="py-3 text-gray-700 font-medium align-top">{template.title}</TableCell>
                                    <TableCell className="py-3 text-gray-500 leading-relaxed font-light">
                                        {template.message}
                                    </TableCell>
                                    <TableCell className="py-3 text-right align-top">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                <Eye className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                <X className="h-3.5 w-3.5" />
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
                        Showing 1 to {filteredTemplates.length} of {mockTemplates.length} entries
                    </div>
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600 text-sm">‹</span>
                        <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded">
                            1
                        </Button>
                        <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600 text-sm">›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
