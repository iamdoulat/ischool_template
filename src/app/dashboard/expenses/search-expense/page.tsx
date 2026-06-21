"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search, Loader2, Filter } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDate } from "@/lib/utils";

interface ExpenseRecord {
    id: string;
    name: string;
    invoice_number: string;
    date: string;
    expense_head: { expense_head: string };
    amount: number;
}

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export default function SearchExpensePage() {
    const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState("all");
    const [keyword, setKeyword] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleSearch = async (type: 'period' | 'keyword') => {
        if (type === 'period' && searchType === 'period' && (!startDate || !endDate)) {
            toast.error("Please select start and end dates");
            return;
        }

        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (type === 'period') {
                params.search_type = searchType;
                if (searchType === 'period') {
                    params.start_date = startDate;
                    params.end_date = endDate;
                }
            } else {
                params.keyword = keyword;
            }

            const res = await api.get("expense/expenses", { params });
            if (res.data?.status === "Success") {
                setExpenses(res.data.data);
            }
        } catch (error) {
            console.error("Error searching expenses:", error);
            toast.error("Search failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Select Criteria</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Search expenses by period or keyword</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Search Type Column */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="search-type" className="text-xs font-semibold text-gray-600">
                                    Search Type <span className="text-red-500">*</span>
                                </Label>
                                <Select value={searchType} onValueChange={setSearchType}>
                                    <SelectTrigger id="search-type" className="h-10 rounded-md border-gray-200 focus:ring-2 focus:ring-indigo-500/20">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
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

                            {searchType === 'period' && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase text-gray-400">Start Date</Label>
                                        <DatePicker value={startDate} onChange={(val) => setStartDate(val)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase text-gray-400">End Date</Label>
                                        <DatePicker value={endDate} onChange={(val) => setEndDate(val)} />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={() => handleSearch('period')}
                                    disabled={loading}
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-8 h-10 text-sm font-bold rounded-full shadow-lg active:scale-95 transition-all gap-2"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    Search
                                </Button>
                            </div>
                        </div>

                        {/* Search Input Column */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="search-text" className="text-xs font-semibold text-gray-600">
                                    Search By Keyword <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="search-text"
                                    placeholder="Search By Expense, Invoice..."
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    className="h-10 rounded-md border-gray-200 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={() => handleSearch('keyword')}
                                    disabled={loading}
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-8 h-10 text-sm font-bold rounded-full shadow-lg active:scale-95 transition-all gap-2"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    Search
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Search className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Expense List</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{expenses.length} result{expenses.length === 1 ? "" : "s"} found</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-md border overflow-x-auto min-h-[300px]">
                        <Table>
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow>
                                    <TableHead className="font-semibold text-gray-600">Name</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Invoice Number</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Expense Head</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton rows={5} cols={5} />
                                ) : expenses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3 text-gray-400">
                                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-2 border border-gray-100">
                                                    <Search className="h-8 w-8" strokeWidth={1.5} />
                                                </div>
                                                <div className="text-sm font-semibold text-gray-600 italic">No data available in table</div>
                                                <div className="text-xs text-indigo-500 font-medium">Add new record or search with different criteria.</div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    expenses.map((item) => (
                                        <TableRow key={item.id} className="text-sm hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="font-medium text-gray-700">{item.name}</TableCell>
                                            <TableCell className="text-gray-600">{item.invoice_number}</TableCell>
                                            <TableCell className="text-gray-600 font-medium">{item.expense_head.expense_head}</TableCell>
                                            <TableCell className="text-gray-600">{formatDate(item.date)}</TableCell>
                                            <TableCell className="text-right font-bold text-gray-800">${item.amount}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2 border-t">
                        <div>
                            Showing {expenses.length > 0 ? 1 : 0} to {expenses.length} of {expenses.length} entries
                        </div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm" disabled>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md font-bold"
                            >
                                1
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm" disabled>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
