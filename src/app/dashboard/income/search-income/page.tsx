"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Image from "next/image";

export default function SearchIncomePage() {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-4 mb-4">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Search Type Column */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="search-type" className="text-xs font-semibold text-gray-600">
                                Search Type <span className="text-red-500">*</span>
                            </Label>
                            <Select>
                                <SelectTrigger id="search-type">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="this-week">This Week</SelectItem>
                                    <SelectItem value="last-week">Last Week</SelectItem>
                                    <SelectItem value="this-month">This Month</SelectItem>
                                    <SelectItem value="last-month">Last Month</SelectItem>
                                    <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                                    <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                                    <SelectItem value="last-12-months">Last 12 Months</SelectItem>
                                    <SelectItem value="this-year">This Year</SelectItem>
                                    <SelectItem value="last-year">Last Year</SelectItem>
                                    <SelectItem value="period">Period</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-9 text-sm">
                                <Search className="mr-2 h-4 w-4" /> Search
                            </Button>
                        </div>
                    </div>

                    {/* Search Input Column */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="search-text" className="text-xs font-semibold text-gray-600">
                                Search <span className="text-red-500">*</span>
                            </Label>
                            <Input id="search-text" placeholder="Search By Income" />
                        </div>
                        <div className="flex justify-end">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-9 text-sm">
                                <Search className="mr-2 h-4 w-4" /> Search
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-4">Income List</h2>

                <div className="rounded-md border overflow-x-auto min-h-[300px]">
                    <Table>
                        <TableHeader className="bg-gray-50 text-xs uppercase">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-600">Name</TableHead>
                                <TableHead className="font-semibold text-gray-600">Invoice Number</TableHead>
                                <TableHead className="font-semibold text-gray-600">Income Head</TableHead>
                                <TableHead className="font-semibold text-gray-600">Date</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right">Amount ($)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Empty State */}
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3 text-red-500/80">
                                        <span className="text-xs">No data available in table</span>
                                        {/* Using a placeholder SVG or just styling for the visual shown in image */}
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                <polyline points="10 9 9 9 8 9"></polyline>
                                            </svg>
                                        </div>
                                        <div className="flex items-center text-green-600 space-x-1">
                                            <span className="font-bold text-lg">+</span>
                                            <span className="text-sm font-semibold">Add new record or search with different criteria.</span>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                    <div>
                        Showing 0 to 0 of 0 entries
                    </div>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
