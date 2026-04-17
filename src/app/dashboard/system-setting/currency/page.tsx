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
import { useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

interface Currency {
    id: number;
    currency: string;
    short_code: string;
    symbol: string;
    rate: number;
    is_base: boolean;
    is_active: boolean;
    is_enabled: boolean;
}

export default function CurrencyPage() {
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const fetchCurrencies = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/system-setting/currencies");
            if (response.data.status === "Success") {
                setCurrencies(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch currencies", error);
            toast("error", "Failed to fetch currencies");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchCurrencies();
    }, [fetchCurrencies]);

    const handleRateChange = (id: number, val: string) => {
        setCurrencies(prev => prev.map(c => c.id === id ? { ...c, rate: parseFloat(val) || 0 } : c));
    };

    const handleSymbolChange = (id: number, val: string) => {
        setCurrencies(prev => prev.map(c => c.id === id ? { ...c, symbol: val } : c));
    };

    const toggleEnabled = async (id: number) => {
        try {
            const response = await api.post(`/system-setting/currencies/${id}/toggle-enabled`);
            if (response.data.status === "Success") {
                setCurrencies(prev => prev.map(c => c.id === id ? { ...c, is_enabled: !c.is_enabled } : c));
                toast("success", "Currency status updated");
            }
        } catch (error) {
            console.error("Failed to toggle status", error);
            toast("error", "Failed to update status");
        }
    };

    const toggleActive = async (id: number) => {
        try {
            const response = await api.post(`/system-setting/currencies/${id}/toggle-active`);
            if (response.data.status === "Success") {
                setCurrencies(prev => prev.map(c => ({
                    ...c,
                    is_active: c.id === id
                })));
                toast("success", "Base currency changed");
            }
        } catch (error) {
            console.error("Failed to change active currency", error);
            toast("error", "Failed to change active currency");
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await api.post("/system-setting/currencies/batch-update", {
                currencies: currencies.map(c => ({
                    id: c.id,
                    symbol: c.symbol,
                    rate: c.rate
                }))
            });
            if (response.data.status === "Success") {
                toast("success", "Currencies saved successfully");
            }
        } catch (error) {
            console.error("Failed to save currencies", error);
            toast("error", "Failed to save currencies");
        } finally {
            setSaving(false);
        }
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
                                        {currency.short_code}
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
                                                value={currencies.find(c => c.is_active)?.id.toString()}
                                                onValueChange={(val) => toggleActive(parseInt(val))}
                                                className="flex"
                                            >
                                                <RadioGroupItem
                                                    value={currency.id.toString()}
                                                    className={cn(
                                                        "h-4 w-4 border-gray-300 text-indigo-600 data-[state=checked]:border-indigo-600 transition-all cursor-pointer",
                                                        currency.is_active ? "border-indigo-600" : ""
                                                    )}
                                                />
                                            </RadioGroup>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-4 text-right">
                                        <div className="flex justify-end">
                                            <Switch
                                                checked={currency.is_enabled}
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
                {/* Footer Save Action */}
                <div className="flex justify-end pt-4 border-t border-gray-50 mt-4">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-[#FF8C42] to-[#6D5BFE] hover:from-[#f97316] hover:to-[#5c4ae4] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg border-none"
                    >
                        {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Save
                    </Button>
                </div>

            </div>
        </div>
    );
}
