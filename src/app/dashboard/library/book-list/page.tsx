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
    Plus,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
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

interface Book {
    id: string;
    title: string;
    description: string;
    bookNumber: string;
    isbnNumber: string;
    publisher: string;
    author: string;
    subject: string;
    rackNumber: string;
    qty: number;
    available: number;
    price: string;
    postDate: string;
}

const mockBooks: Book[] = [
    { id: "1", title: "Hindi Vyakaran", description: "No Description", bookNumber: "1453", isbnNumber: "DA097886", publisher: "D.S. Publisher", author: "Suresh Kumar", subject: "Hindi", rackNumber: "7845", qty: 80, available: 77, price: "₹10,500.00", postDate: "02/23/2025" },
    { id: "2", title: "Mathematics", description: "No Description", bookNumber: "1455", isbnNumber: "BRT0-890907", publisher: "D.S. Publisher", author: "", subject: "Mathematics", rackNumber: "1234", qty: 90, available: 86, price: "₹14,000.00", postDate: "02/17/2025" },
    { id: "3", title: "Environmental Studies (EVS)", description: "No Description", bookNumber: "65545", isbnNumber: "FSB87665", publisher: "D.S. Publisher", author: "", subject: "Environmental", rackNumber: "756", qty: 90, available: 88, price: "₹21,000.00", postDate: "02/11/2025" },
    { id: "4", title: "English Reader", description: "English Reader", bookNumber: "4344", isbnNumber: "FG-08908", publisher: "S.K. Publisher", author: "", subject: "English", rackNumber: "4545", qty: 50, available: 48, price: "₹17,500.00", postDate: "02/02/2025" },
    { id: "5", title: "Social & Political Life", description: "No Description", bookNumber: "87897", isbnNumber: "VBB00-8-90-78", publisher: "St. Publisher", author: "Harish Vardhan", subject: "Social Science", rackNumber: "57574", qty: 100, available: 90, price: "₹8,400.00", postDate: "01/20/2025" },
    { id: "6", title: "Wonderful Adventures of Nils", description: "No Description", bookNumber: "789667", isbnNumber: "DER900808", publisher: "S.K. Publisher", author: "Selma Lagerlöf", subject: "English", rackNumber: "567574", qty: 90, available: 79, price: "₹7,000.00", postDate: "01/15/2025" },
    { id: "7", title: "Electricity & Circuits", description: "No Description", bookNumber: "56433", isbnNumber: "FG-08908", publisher: "S.K. Publisher", author: "John Wright", subject: "Science", rackNumber: "89875", qty: 80, available: 69, price: "₹3,500.00", postDate: "01/10/2025" },
    { id: "8", title: "Basic Geometrical Ideas", description: "No Description", bookNumber: "34222", isbnNumber: "FWSE56564", publisher: "S.K. Publisher", author: "David Wilson", subject: "Mathematics", rackNumber: "34522", qty: 100, available: 93, price: "₹5,600.00", postDate: "01/02/2025" },
];

export default function BookListPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredBooks = mockBooks.filter((book) =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.publisher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-sm font-medium text-gray-800">Book List</h1>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-7 px-3 text-[10px] font-bold uppercase transition-all rounded shadow-sm">
                    <Plus className="h-3 w-3" /> Add Book
                </Button>
            </div>

            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
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
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded text-gray-400">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table Container with horizontal scroll */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1200px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Book Title <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Description <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Book Number <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">ISBN Number <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Publisher <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Author <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Subject <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Rack Number <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Qty <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Available <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Book Price</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Post Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right sticky right-0 bg-gray-50/50 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBooks.map((book) => (
                                <TableRow key={book.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                    <TableCell className="py-3 text-gray-700 font-medium">{book.title}</TableCell>
                                    <TableCell className="py-3 text-gray-400">{book.description}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.bookNumber}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.isbnNumber}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.publisher}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.author || "-"}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.subject}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.rackNumber}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.qty}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.available}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.price}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{book.postDate}</TableCell>
                                    <TableCell className="py-3 text-right sticky right-0 bg-white group-hover:bg-gray-50/30 transition-colors shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
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
                        Showing 1 to {filteredBooks.length} of {mockBooks.length} entries
                    </div>
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600 text-[10px]">‹</span>
                        <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded">
                            1
                        </Button>
                        <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600 text-[10px]">›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
