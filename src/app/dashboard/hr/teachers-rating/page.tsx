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
    TableRow
} from "@/components/ui/table";
import {
    Star,
    X,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Check
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Rating {
    id: string;
    staffId: string;
    staffName: string;
    rating: number;
    comment: string;
    status: "Pending" | "Approved";
    studentName: string;
}

const mockRatings: Rating[] = [
    { id: "1", staffId: "9002", staffName: "Shivam Verma (9002)", rating: 5, comment: "Motivates students to progress", status: "Pending", studentName: "Saurabh Shah (900875)" },
    { id: "2", staffId: "9002", staffName: "Shivam Verma (9002)", rating: 3, comment: "good", status: "Pending", studentName: "Gian Stark (18005)" },
    { id: "3", staffId: "9002", staffName: "Shivam Verma (9002)", rating: 5, comment: "Excellent", status: "Approved", studentName: "Robin Peterson (18002)" },
    { id: "4", staffId: "9002", staffName: "Shivam Verma (9002)", rating: 4, comment: "no comment", status: "Pending", studentName: "Edward Thomas (1800011)" },
    { id: "5", staffId: "9002", staffName: "Shivam Verma (9002)", rating: 3, comment: "nice", status: "Pending", studentName: "Edward Thomas (18001)" },
    { id: "6", staffId: "9002", staffName: "Shivam Verma (9002)", rating: 2, comment: "good teaching and learning", status: "Pending", studentName: "Vinay Singh (6422)" },
    { id: "7", staffId: "90008", staffName: "Jason Sharlton (90008)", rating: 5, comment: "Solidifies a positive relationship or connection with your students", status: "Approved", studentName: "Saurabh Shah (900875)" },
    { id: "8", staffId: "90008", staffName: "Jason Sharlton (90008)", rating: 4, comment: "good team teacher learning and best regards", status: "Approved", studentName: "MANISH RAJPUT (1101)" },
    { id: "9", staffId: "90008", staffName: "Jason Sharlton (90008)", rating: 2, comment: "yddyy", status: "Approved", studentName: "Kavya Roy (18009)" },
    { id: "10", staffId: "90008", staffName: "Jason Sharlton (90008)", rating: 4, comment: "Very Good", status: "Approved", studentName: "Robin Peterson (18002)" },
    { id: "11", staffId: "90008", staffName: "Jason Sharlton (90008)", rating: 2, comment: "Very nice", status: "Approved", studentName: "Devin Coinneach (18014)" },
    { id: "12", staffId: "90008", staffName: "Jason Sharlton (90008)", rating: 2, comment: "sfd", status: "Pending", studentName: "Vinay Singh (6422)" },
    { id: "13", staffId: "90008", staffName: "Jason Sharlton (90008)", rating: 3, comment: "good", status: "Pending", studentName: "RKS Kumar (RK8001)" },
];

export default function TeachersRatingPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const StarRating = ({ count }: { count: number }) => (
        <div className="flex gap-0.5 items-center">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={cn(
                        "h-3 w-3",
                        s <= count ? "fill-orange-400 text-orange-400" : "text-gray-200"
                    )}
                />
            ))}
            <span className="ml-1 text-[10px] text-gray-500 font-bold">{count}</span>
        </div>
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800 border-b pb-2">Teachers Rating List</h2>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-[10px] text-gray-500 font-bold">50</span>
                            <Select defaultValue="50">
                                <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none">
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
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100"><Copy className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100"><FileText className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100"><Printer className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100"><Columns className="h-3.5 w-3.5" /></Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border border-gray-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Staff ID</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Name</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Rating</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Comment</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Status</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Student Name</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockRatings.map((item) => (
                                <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/20 transition-colors">
                                    <TableCell className="py-3.5 text-gray-500">{item.staffId}</TableCell>
                                    <TableCell className="py-3.5 text-indigo-500 font-medium cursor-pointer hover:underline">{item.staffName}</TableCell>
                                    <TableCell className="py-3.5"><StarRating count={item.rating} /></TableCell>
                                    <TableCell className="py-3.5 text-gray-500 italic max-w-xs">{item.comment}</TableCell>
                                    <TableCell className="py-3.5">
                                        <span className={cn(
                                            "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                                            item.status === "Pending" ? "bg-orange-500 text-white" : "bg-green-600 text-white"
                                        )}>
                                            {item.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{item.studentName}</TableCell>
                                    <TableCell className="py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {item.status === "Pending" && (
                                                <Button className="h-6 px-3 bg-[#6366f1] hover:bg-[#5558dd] text-white text-[9px] font-bold uppercase rounded shadow-sm">
                                                    Approve
                                                </Button>
                                            )}
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-2">
                    <div>Showing 1 to {mockRatings.length} of {mockRatings.length} entries</div>
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-400 mr-2">‹</span>
                        <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0">
                            1
                        </Button>
                        <span className="text-gray-400 ml-2">›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
