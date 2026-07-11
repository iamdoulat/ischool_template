"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/hooks/use-translation";
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
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Loader2, DollarSign } from "lucide-react";

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

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <Skeleton className="h-4 rounded" style={{ width: `${50 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function CurrencyPage() {
    const { t } = useTranslation();
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
            toast("error", t("failed_to_fetch_currencies"));
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
                toast("success", t("currency_status_updated"));
            }
        } catch (error) {
            console.error("Failed to toggle status", error);
            toast("error", t("failed_to_update_status"));
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
                toast("success", t("base_currency_changed"));
            }
        } catch (error) {
            console.error("Failed to change active currency", error);
            toast("error", t("failed_to_change_active_currency"));
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
                toast("success", t("currencies_saved_successfully"));
            }
        } catch (error) {
            console.error("Failed to save currencies", error);
            toast("error", t("failed_to_save_currencies"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <Card className="pt-0 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <DollarSign className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("currency_settings")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("currency_settings_subtitle")}</p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-6">
                    {loading ? (
                        <div className="rounded border border-gray-100 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-100">
                                    <TableRow className="border-b border-gray-200 hover:bg-transparent text-[11px]">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <TableHead key={i} className="h-9 px-4">
                                                <Skeleton className="h-3 w-16 rounded" />
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableSkeleton cols={8} />
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <>
                            {/* Table */}
                            <div className="overflow-x-auto border border-gray-100 rounded">
                                <Table>
                                    <TableHeader className="bg-gray-100">
                                        <TableRow className="border-b border-gray-200 hover:bg-transparent text-[11px]">
                                            <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase w-12">#</TableHead>
                                            <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase">{t("currency")}</TableHead>
                                            <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase">{t("short_code")}</TableHead>
                                            <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase w-48">{t("currency_symbol")}</TableHead>
                                            <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase w-32">{t("conversion_rate")}</TableHead>
                                            <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase w-32">{t("base_currency")}</TableHead>
                                            <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase w-24 text-center">{t("active")}</TableHead>
                                            <TableHead className="h-9 px-4 font-bold text-gray-600 uppercase w-24 text-right">{t("enabled")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currencies.map((currency, idx) => (
                                            <TableRow key={currency.id} className="border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer h-12">
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
                                                        className="h-7 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full max-w-[120px]"
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2 px-4">
                                                    <Input
                                                        type="text"
                                                        value={currency.rate}
                                                        onChange={(e) => handleRateChange(currency.id, e.target.value)}
                                                        className="h-7 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded w-full max-w-[100px]"
                                                    />
                                                </TableCell>
                                                <TableCell className="py-2 px-4 text-[11px] text-gray-500">
                                                    {currency.is_base ? t("base_currency") : ""}
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
                                        {currencies.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-6 text-gray-400">
                                                    {t("no_currencies_found")}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Footer Save Action */}
                            <div className="flex justify-end pt-4 border-t border-gray-50 mt-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg border-none"
                                >
                                    {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                    {t("save")}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
