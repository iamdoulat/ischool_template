"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

// Mock Data
const initialCurrencies = [
    { id: 1, currency: "AED", shortCode: "AED", symbol: "AEDf", rate: 1, isBase: false, isActive: false, isEnabled: true },
    { id: 2, currency: "AFN", shortCode: "AFN", symbol: "؋", rate: 140, isBase: false, isActive: false, isEnabled: true },
    { id: 3, currency: "ALL", shortCode: "ALL", symbol: "ALL", rate: 1, isBase: false, isActive: false, isEnabled: true },
    { id: 4, currency: "AMD", shortCode: "AMD", symbol: "AMD", rate: 1, isBase: false, isActive: false, isEnabled: true },
    { id: 5, currency: "ANG", shortCode: "ANG", symbol: "ANG", rate: 1, isBase: false, isActive: false, isEnabled: true },
    { id: 6, currency: "AOA", shortCode: "AOA", symbol: "AOA", rate: 1, isBase: false, isActive: false, isEnabled: true },
    { id: 7, currency: "ARS", shortCode: "ARS", symbol: "ARS", rate: 1, isBase: false, isActive: false, isEnabled: true },
    { id: 8, currency: "AUD", shortCode: "AUD", symbol: "AUD", rate: 1, isBase: false, isActive: false, isEnabled: true },
    { id: 9, currency: "AWG", shortCode: "AWG", symbol: "AWG", rate: 1, isBase: false, isActive: false, isEnabled: true },
    { id: 10, currency: "AZN", shortCode: "AZN", symbol: "AZN", rate: 1, isBase: false, isActive: false, isEnabled: true },
    { id: 11, currency: "BAM", shortCode: "BAM", symbol: "BAM", rate: 1, isBase: false, isActive: false, isEnabled: true },
    { id: 12, currency: "BAM", shortCode: "BAM", symbol: "BAM", rate: 1, isBase: false, isActive: false, isEnabled: true },
    { id: 13, currency: "BDT", shortCode: "BDT", symbol: "BDT", rate: 1, isBase: false, isActive: false, isEnabled: true },
    { id: 14, currency: "BGN", shortCode: "BGN", symbol: "BGN", rate: 1, isBase: false, isActive: false, isEnabled: true },
    { id: 15, currency: "BHD", shortCode: "BHD", symbol: "BHD", rate: 1, isBase: false, isActive: false, isEnabled: true },
];

export default function CurrencyPage() {
    const [currencies, setCurrencies] = useState(initialCurrencies);
    const [activeCurrencyId, setActiveCurrencyId] = useState<number | null>(4); // Default to AMD based on mock or user choice (mock screenshot has row 4 Active, assuming index logic) (Actually row 4 is Arabic in screenshot, but here AMD is 4th. I'll stick to ID logic)

    const handleRateChange = (id: number, val: string) => {
        setCurrencies(prev => prev.map(c => c.id === id ? { ...c, rate: parseFloat(val) || 0 } : c));
    };

    const handleSymbolChange = (id: number, val: string) => {
        setCurrencies(prev => prev.map(c => c.id === id ? { ...c, symbol: val } : c));
    };

    const toggleEnabled = (id: number) => {
        setCurrencies(prev => prev.map(c => c.id === id ? { ...c, isEnabled: !c.isEnabled } : c));
    };

    return (
        <div className="p-4 bg-gray-50/10 min-h-screen font-sans space-y-4">

            {/* Header Container */}
            <div className="bg-white rounded-t-lg shadow-sm border border-gray-100 p-4">
                <h1 className="text-[13px] font-medium text-gray-700">Currencies</h1>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-b-lg shadow-sm border border-gray-100 p-4">

                {/* Table */}
                <div className="overflow-x-auto border border-gray-100 rounded">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-b border-gray-100 hover:bg-transparent text-[11px]">
                                <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase w-12">#</TableHead>
                                <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase">Currency</TableHead>
                                <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase">Short Code</TableHead>
                                <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase w-48">Currency Symbol</TableHead>
                                <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase w-32">Conversion Rate</TableHead>
                                <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase w-32">Base Currency</TableHead>
                                <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase w-24 text-center">Active</TableHead>
                                <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase w-24 text-right">Enabled</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currencies.map((currency, idx) => (
                                <TableRow key={currency.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors h-12">
                                    <TableCell className="py-2 px-4 text-[11px] text-gray-500 font-medium">
                                        {idx + 1}.
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-[11px] text-gray-600 font-medium">
                                        {currency.currency}
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-[11px] text-gray-500">
                                        {currency.shortCode}
                                    </TableCell>
                                    <TableCell className="py-2 px-4">
                                        <Input
                                            value={currency.symbol}
                                            onChange={(e) => handleSymbolChange(currency.id, e.target.value)}
                                            className="h-7 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full"
                                        />
                                    </TableCell>
                                    <TableCell className="py-2 px-4">
                                        <Input
                                            type="text"
                                            value={currency.rate}
                                            onChange={(e) => handleRateChange(currency.id, e.target.value)}
                                            className="h-7 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full"
                                        />
                                    </TableCell>
                                    <TableCell className="py-2 px-4">
                                        {/* Base Currency Column from screenshot often empty, implementing as empty unless logic dictates otherwise */}
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-center">
                                        <div className="flex justify-center">
                                            <RadioGroup
                                                value={activeCurrencyId?.toString()}
                                                onValueChange={(val) => setActiveCurrencyId(parseInt(val))}
                                                className="flex"
                                            >
                                                <RadioGroupItem
                                                    value={currency.id.toString()}
                                                    className={cn(
                                                        "h-4 w-4 border-gray-300 text-indigo-600 data-[state=checked]:border-indigo-600 transition-all cursor-pointer",
                                                        activeCurrencyId === currency.id ? "border-indigo-600" : ""
                                                    )}
                                                />
                                            </RadioGroup>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-right">
                                        <div className="flex justify-end">
                                            <Switch
                                                checked={currency.isEnabled}
                                                onCheckedChange={() => toggleEnabled(currency.id)}
                                                className="data-[state=checked]:bg-gray-600 scale-90 transition-all"
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer Save Action if needed (standard practice usually) */}
                {/* Screenshot clipped doesn't show one but usually lists like this have Save or Auto-save. Adding consistent Save button */}
                <div className="flex justify-end pt-4 border-t border-gray-50 mt-4">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md border-b-2 border-indigo-700">
                        Save
                    </Button>
                </div>

            </div>
        </div>
    );
}
