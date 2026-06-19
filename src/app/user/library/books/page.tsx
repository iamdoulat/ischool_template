"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ArrowUpDown, Copy, FileSpreadsheet,
    FileBox, Printer, Columns, ChevronLeft, ChevronRight
} from "lucide-react";

const booksData = [
    { id: 1, title: "संसार पुस्तक है।", publisher: "", author: "", subject: "Hindi", rack: "987", qty: 20, price: "$100.00", postDate: "04/30/2026" },
    { id: 2, title: "Maths Activity Book Class 1", publisher: "Yogesh", author: "Hunny", subject: "Maths", rack: "23", qty: 0, price: "$299.00", postDate: "04/08/2026" },
    { id: 3, title: "English Grammar for Beginners", publisher: "s r. k", author: "jhon", subject: "", rack: "2", qty: 100, price: "$100.00", postDate: "04/03/2026" },
    { id: 4, title: "Respiration in Organisms", publisher: "S.K Publisher", author: "John Wilson", subject: "", rack: "", qty: 50, price: "$100.00", postDate: "04/01/2026" },
    { id: 5, title: "Environmental Studies (EVS)", publisher: "Orient BlackSwan", author: "Anita Gupta", subject: "", rack: "435", qty: 0, price: "$100.00", postDate: "03/03/2026" },
    { id: 6, title: "Maths Activity Book Class 1", publisher: "NCERT", author: "S. Verma", subject: "Mathematics", rack: "234", qty: 50, price: "$100.00", postDate: "03/14/2026" },
    { id: 7, title: "English Grammar for Beginners", publisher: "Oxford Publications", author: "R.K. Sharma", subject: "English", rack: "565", qty: 40, price: "$100.00", postDate: "03/20/2026" },
    { id: 8, title: "संसार पुस्तक है।", publisher: "S.K.Publisher", author: "Robert", subject: "", rack: "6567", qty: 50, price: "$45.00", postDate: "03/03/2026" },
    { id: 9, title: "The Valley of Flowers", publisher: "D.S Publisher", author: "Laura", subject: "", rack: "786", qty: 35, price: "$50.00", postDate: "03/25/2026" },
    { id: 10, title: "Respiration in Organisms", publisher: "S.K Publisher", author: "John Wilson", subject: "", rack: "5345", qty: 50, price: "$100.00", postDate: "03/13/2026" },
    { id: 11, title: "Wonderful Adventures of Nils", publisher: "S.K. Publisher", author: "Martin Wilson", subject: "English", rack: "567574", qty: 90, price: "$100.00", postDate: "03/05/2026" },
    { id: 12, title: "Electricity & Circuits", publisher: "S.K. Publisher", author: "John Wright", subject: "Science", rack: "89675", qty: 80, price: "$50.00", postDate: "03/03/2026" },
    { id: 13, title: "चंद्र गहना से लौटती बेर\"", publisher: "D.S Publisher", author: "Suresh Kumar", subject: "hindi", rack: "7845", qty: 80, price: "$150.00", postDate: "02/23/2026" },
    { id: 14, title: "Hindi Vyakaran", publisher: "D.S. Publisher", author: "", subject: "Hindi", rack: "1234", qty: 90, price: "$200.00", postDate: "02/17/2026" },
    { id: 15, title: "Mathematics", publisher: "D.K. Publisher", author: "", subject: "Mathematics", rack: "6534", qty: 80, price: "$300.00", postDate: "02/21/2026" },
    { id: 16, title: "Environmental Studies (EVS)", publisher: "D.S Publisher", author: "", subject: "Environmental", rack: "756", qty: 90, price: "$300.00", postDate: "02/11/2026" },
    { id: 17, title: "English Reader", publisher: "S.K Publisher", author: "", subject: "English", rack: "4545", qty: 50, price: "$250.00", postDate: "02/02/2026" },
    { id: 18, title: "Social & Political Life", publisher: "Sk. Publisher", author: "Harish Vardhan", subject: "Social Science", rack: "57574", qty: 100, price: "$120.00", postDate: "01/20/2026" }
];

export default function UserLibraryBooksPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [currentPage, setCurrentPage] = useState(1);

    const filteredData = booksData.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.publisher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredData.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    
    const paginatedData = filteredData.slice(startIndex, startIndex + sizeNum);

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 p-4 flex justify-between items-center">
                    <h1 className="text-[15px] font-medium text-gray-700 tracking-tight">Book</h1>
                </div>

                <div className="p-4 space-y-4">
                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-8 text-[12px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center mr-2">
                                <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-8 w-16 text-[12px] border-gray-200 shadow-none rounded font-medium">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                                {[Copy, FileSpreadsheet, FileBox, Printer, Columns].map((Icon, i) => (
                                    <Button key={i} variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded text-gray-500">
                                        <Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1000px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[12px] font-bold text-gray-700">
                                    <TableHead className="py-3 px-4 h-auto">Book Title <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Publisher <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Author <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Subject <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Rack Number <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-center">Qty <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-right">Book Price <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-right">Post Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500 text-sm">
                                            No data available in table
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((item, idx) => (
                                        <TableRow key={item.id} className="text-[13px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors whitespace-nowrap text-gray-600">
                                            <TableCell className="py-3 px-4 font-medium text-gray-700">{item.title}</TableCell>
                                            <TableCell className="py-3 px-4">{item.publisher}</TableCell>
                                            <TableCell className="py-3 px-4">{item.author}</TableCell>
                                            <TableCell className="py-3 px-4">{item.subject}</TableCell>
                                            <TableCell className="py-3 px-4">{item.rack}</TableCell>
                                            <TableCell className="py-3 px-4 text-center">{item.qty}</TableCell>
                                            <TableCell className="py-3 px-4 text-right">{item.price}</TableCell>
                                            <TableCell className="py-3 px-4 text-right">{item.postDate}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer Pagination */}
                    <div className="flex items-center justify-between text-[12px] text-gray-500 pt-2 pb-2">
                        <div>
                            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                            {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                        </div>

                        {totalEntries > 0 && (
                            <div className="flex items-center gap-1 border border-gray-200 rounded overflow-hidden">
                                <button
                                    disabled={safePage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    className="h-8 px-2 bg-white hover:bg-gray-50 text-gray-400 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 border-r border-gray-200"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button className="h-8 px-3 text-xs flex items-center justify-center bg-[#6366f1] text-white font-medium border-r border-gray-200">
                                    1
                                </button>
                                <button
                                    disabled={safePage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    className="h-8 px-2 bg-white hover:bg-gray-50 text-gray-400 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
