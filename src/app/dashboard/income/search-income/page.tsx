"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search, Loader2, Filter, ListChecks } from "lucide-react";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
import api from "@/lib/api";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDate } from "@/lib/utils";


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

interface IncomeRecord {
    id: string;
    name: string;
    description: string;
    invoice_number: string;
    date: string;
    income_head_name: string;
    amount: number;
}

export default function SearchIncomePage() {
    const { symbol, formatCurrency } = useCurrencyFormatter();
    const [searchType, setSearchType] = useState("all");
    const [keyword, setKeyword] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchIncomes = async (params: Record<string, string>) => {
        try {
            setLoading(true);
            const res = await api.get("income/incomes", { params });
            if (res.data?.status === "Success") {
                const mappedData = res.data.data.map((item: {
                    id: number | string;
                    name: string;
                    description?: string;
                    invoice_number?: string;
                    date: string;
                    income_head?: { income_head?: string };
                    amount: string | number;
                }) => ({
                    id: item.id.toString(),
                    name: item.name,
                    description: item.description || "",
                    invoice_number: item.invoice_number || "",
                    date: item.date,
                    income_head_name: item.income_head?.income_head || "N/A",
                    amount: parseFloat(String(item.amount))
                }));
                setIncomes(mappedData);
                if (mappedData.length === 0) {
                    toast.info("No records found for the given criteria.");
                }
            }
        } catch (error) {
            console.error("Error searching income:", error);
            toast.error("Failed to search income");
        } finally {
            setLoading(false);
        }
    };

    const handlePeriodSearch = () => {
        if (searchType === "period" && (!startDate || !endDate)) {
            toast.error("Please select both start and end dates");
            return;
        }
        fetchIncomes({ search_type: searchType, start_date: startDate, end_date: endDate });
    };

    const handleKeywordSearch = () => {
        if (!keyword.trim()) {
            toast.error("Please enter a keyword to search");
            return;
        }
        fetchIncomes({ keyword: keyword.trim() });
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
                        <p className="text-[11px] text-gray-500 mt-1">Search income by type or keyword</p>
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
                                    <SelectTrigger id="search-type">
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

                            {searchType === "period" && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-gray-600">Start Date</Label>
                                        <DatePicker value={startDate} onChange={(val) => setStartDate(val)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-gray-600">End Date</Label>
                                        <DatePicker value={endDate} onChange={(val) => setEndDate(val)} />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    onClick={handlePeriodSearch}
                                    disabled={loading}
                                    className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all"
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
                                    Search <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="search-text"
                                    placeholder="Search By Income Name, Invoice..."
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleKeywordSearch()}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleKeywordSearch}
                                    disabled={loading}
                                    className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all"
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
                        <ListChecks className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Income List</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{incomes.length} record{incomes.length === 1 ? "" : "s"} found</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-md border overflow-x-auto min-h-[300px]">
                        <Table>
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow>
                                    <TableHead className="font-semibold text-gray-600">Name</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Invoice Number</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Income Head</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Date</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Amount ({symbol})</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton rows={5} cols={5} />
                                ) : incomes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-3 text-red-500/80">
                                                <span className="text-xs font-medium uppercase tracking-wider">No data available in table</span>
                                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-2 shadow-inner border border-gray-100">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                        <polyline points="14 2 14 8 20 8"></polyline>
                                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                                        <polyline points="10 9 9 9 8 9"></polyline>
                                                    </svg>
                                                </div>
                                                <div className="flex items-center text-green-600 space-x-1 animate-pulse">
                                                    <span className="font-bold text-lg">+</span>
                                                    <span className="text-xs font-semibold">Select criteria above and click search.</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    incomes.map((income) => (
                                        <TableRow key={income.id} className="hover:bg-gray-50 transition-colors">
                                            <TableCell className="font-medium text-gray-700 py-3">{income.name}</TableCell>
                                            <TableCell className="text-gray-600">{income.invoice_number}</TableCell>
                                            <TableCell className="text-gray-600">{income.income_head_name}</TableCell>
                                            <TableCell className="text-gray-600">{formatDate(income.date)}</TableCell>
                                            <TableCell className="text-gray-600 text-right font-semibold">{formatCurrency(income.amount)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                        <div>
                            Showing {incomes.length > 0 ? 1 : 0} to {incomes.length} of {incomes.length} entries
                        </div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm" disabled><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="default" size="sm" className="h-8 w-8 p-0 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md">1</Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm" disabled><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
